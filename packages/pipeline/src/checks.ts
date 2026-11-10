// P-3b · 모델이 쓴 사실 글을 코드가 구절과 대 본다 (D42). **규칙은 fact-check-rules.json 한 곳** — 프롬프트 · 검사(verify-fact-graph.py)도 같은 파일.
//
//   수량어 — 연준의 수량어(a few · some · several · many · most · all · a majority …)를 대응표의 한국어로만 옮긴다. 섞이면 실패
//   수(數) — 글의 아라비아 숫자는 구절(또는 문서의 공개일 · 제목)에 있어야 한다. 글이 구절보다 많이 말하지 않는다 (P3-c 의 기계 부분)
//
// 실패한 사실은 그래프에 넣지 않고 따로 모은다 (짓기 — p3.ts). 검사는 그래프의 사실이 모두 통과하는지 본다.
import { readFileSync } from "node:fs";

type QClass = { id: string; en: string[]; ko: string[] };
export const CHECK_RULES: {
  version: string;
  quantifiers: { classes: QClass[]; nouns: { en: string[]; ko: string[] }[]; ko_banned: string[] };
  numbers: { month_names: Record<string, number>; number_words: Record<string, number>; ordinals: Record<string, number>; fractions: Record<string, string>; one_units: Record<string, string> };
} = JSON.parse(readFileSync(new URL("../fact-check-rules.json", import.meta.url), "utf8"));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const byLen = (a: string, b: string) => b.length - a.length;
const Q = CHECK_RULES.quantifiers;
const EN_Q = Q.classes.flatMap((c) => c.en.map((w) => ({ w, id: c.id }))).sort((a, b) => byLen(a.w, b.w));
const KO_Q = Q.classes.flatMap((c) => c.ko.map((w) => ({ w, id: c.id }))).sort((a, b) => byLen(a.w, b.w));
const alt = (ws: string[]) => [...new Set(ws)].sort(byLen).map(esc).join("|");
const EN_NOUN = alt(Q.nouns.flatMap((n) => n.en));
const KO_NOUN = `(?<![가-힣])(?:${alt(Q.nouns.flatMap((n) => n.ko))})`; // 낱말의 처음에서만 — "중앙은행" 의 "은행" 은 아니다
const EN_RE = new RegExp(`\\b(${EN_Q.map((x) => esc(x.w)).join("|")})\\s+(?:of\\s+(?:the\\s+|these\\s+|those\\s+)?)?(?:[A-Za-z-]+\\s+){0,2}?(${EN_NOUN})\\b`, "gi");
const KO_FWD = new RegExp(`(${KO_Q.map((x) => esc(x.w)).join("|")})\\s*(?:명의|명|의)?\\s*(?:[가-힣A-Za-z]+\\s+)?${KO_NOUN}`, "g");
const KO_REV = new RegExp(`${KO_NOUN}\\s*(?:들)?\\s*(?:중\\s*)?(?:의\\s*)?(${KO_Q.map((x) => esc(x.w)).join("|")})`, "g");
/** 원문 낱말 → 짝 한국어 낱말 (낱말 처음) */
const pairOf = (en: string) => new RegExp(`(?<![가-힣])(?:${alt(Q.nouns.find((n) => n.en.includes(en.toLowerCase()))!.ko)})`);
const enId = (w: string) => EN_Q.find((x) => x.w.toLowerCase() === w.toLowerCase())!.id;
const koId = (w: string) => KO_Q.find((x) => x.w === w)!.id;

/** 구절의 수량어 갈래 (수량어 + 사람 낱말) */
export function enQuantifiers(passages: string[]): string[] {
  return [...new Set(enMatches(passages).map((m) => m.id))].sort();
}
const enMatches = (passages: string[]) => passages.flatMap((p) => [...p.matchAll(EN_RE)].map((m) => ({ id: enId(m[1]!), noun: m[2]! })));
/** 글의 수량어 갈래 (수량어 + 사람 낱말 · 사람 낱말 + 수량어) */
export function koQuantifiers(claim: string): string[] {
  const out = new Set<string>();
  for (const m of claim.matchAll(KO_FWD)) out.add(koId(m[1]!));
  for (const m of claim.matchAll(KO_REV)) out.add(koId(m[1]!));
  return [...out].sort();
}

/** 수량어 검사 — 실패 까닭 (없으면 null) */
export function quantifierProblem(claim: string, passages: string[]): string | null {
  const E = enQuantifiers(passages), K = koQuantifiers(claim);
  const extra = K.filter((k) => !E.includes(k));
  if (extra.length) return `글의 수량어 ${extra.join(" · ")} 가 구절에 없다 (구절: ${E.join(" · ") || "없음"})`;
  // 금지 말 — 표의 한국어 말을 지운 뒤에 찾는다 ("대다수" 의 "다수" 는 금지 말이 아니다)
  let rest = claim;
  for (const x of KO_Q) rest = rest.split(x.w).join(" ");
  for (const b of Q.ko_banned) {
    if (new RegExp(`${esc(b)}\\s*(?:의\\s*)?(?:${KO_NOUN})|(?:${KO_NOUN})\\s*(?:들)?\\s*(?:중\\s*)?(?:의\\s*)?${esc(b)}`).test(rest)) return `대응표에 없는 말 "${b}" 로 사람 수를 옮겼다`;
  }
  // 수량어를 뺐다 — 구절의 (수량어 + 낱말) 의 짝 한국어 낱말이 글에 있는데 글에 수량어가 없다
  const dropped = !K.length && enMatches(passages).filter((m) => pairOf(m.noun).test(claim));
  if (dropped && dropped.length) return `구절의 수량어 ${[...new Set(dropped.map((m) => m.id))].join(" · ")} 가 글에 없다 — 사람 낱말만 남았다 (모두로 읽힌다)`;
  return null;
}

// ── 수 ──────────────────────────────────────────────────────────────────────────────────────────────
const N = CHECK_RULES.numbers;
const normNum = (t: string) => {
  const s = t.replace(/,/g, "");
  if (!s.includes(".")) return String(Number(s));
  const [a, b] = s.split(".");
  return `${String(Number(a))}.${b}`;
};
const unfrac = (s: string) => Object.entries(N.fractions).reduce((x, [k, v]) => x.split(k).join(` ${v}`), s);
const numTokens = (s: string) => [...unfrac(s).replace(/([0-9]),(?=[0-9]{3}(?![0-9]))/g, "$1").matchAll(/[0-9]+(?:\.[0-9]+)?/g)].map((m) => normNum(m[0]));
const WORDS: Record<string, number> = { ...N.number_words, ...N.ordinals, ...N.month_names };
const WORD_RE = new RegExp(`\\b(${Object.keys(WORDS).sort(byLen).map(esc).join("|")})\\b`, "gi");

/** 구절 쪽의 수 — 숫자 · 수 낱말 · 서수 · 달 이름 */
export function passageNumbers(texts: string[]): Set<string> {
  const out = new Set<string>();
  for (const t of texts) {
    for (const x of numTokens(t)) out.add(x);
    for (const m of t.matchAll(WORD_RE)) out.add(String(WORDS[m[1]!.toLowerCase()]));
  }
  return out;
}
/** 글의 수 가운데 구절 · 허용(문서 공개일 · 제목)에 없는 것 */
export function numbersMissing(claim: string, passages: string[], allowed: string[]): string[] {
  const have = passageNumbers([...passages, ...allowed]);
  // '1년' · '1개월' — 구절에 그 영어 낱말(year …)이 있으면 그 1 은 된다
  let c = claim;
  for (const [ko, en] of Object.entries(N.one_units)) if (passages.some((p) => new RegExp(`\\b${en}`, "i").test(p))) c = c.replace(new RegExp(`(?<![0-9.])1\\s*${ko}`, "g"), " ");
  return [...new Set(numTokens(c))].filter((x) => !have.has(x));
}
