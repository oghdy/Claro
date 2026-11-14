// UX-7 시안의 검사 — "오늘" 화면 · 짧은 이야기 · 색 시안. (회차 셋은 ../episode/check.ts 가 계약으로 본다 — 여기서 다시 보지 않는다.)
//   pnpm --filter @claro/web exec tsx src/app/lab/today/check.ts
// 보는 것
//   T1  짧은 이야기의 구절이 전부 **git 에 있는** 저장 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시 — 계약 불변식 8 과 같은 대조). 문서 파일이 git 에 올라 있는 파일인지도 본다
//   T2  짧은 이야기의 글이 가리키는 구절 · 문서 · 도구가 전부 있다
//   T3  글의 숫자는 전부 근거 구절 안에 있다 (계약 불변식 9 와 같은 셈) · 맨 글자열 (제목 · 물음 · 한 줄)에는 숫자가 없다
//   T4  그리지 않을 것 (E3-1 ③ 9 · 10 · 11) — 공표명령 · "안 모았으면" · 진료 기록의 안전 / 유출 · 한 사람 몫이 글에 없다 (낱말로만 본다. 뜻은 사람이 읽는다)
//   T5  풀이 칸을 계약의 규칙 (solveProblems)에 넣으면 **PLAIN_WHY 하나만** 걸린다 — 계약에 "짧아서 체험이 없다"는 까닭이 없다는 것 (D80 의 실물). 다른 것이 걸리면 실패
//   T6  "오늘"의 번호 규칙 — 번호 · 지난 이야기가 보이는 카드는 Episode.number ≥ 2 인 것뿐이다 · 화면 글의 숫자는 "지난 이야기 30초" 하나뿐이다
//   T7  색 시안 셋 — 재는 짝 전부 대비 4.5 이상 (WCAG AA) · 바탕 · 강조가 피할 결 (크림 · 베이지 바탕 / 테라코타 · 코랄 · 주황 강조)이 아니다
//   T8  덮는 규칙 (palette/overrides.css)이 src/episode 의 CSS 와 맞는다 (다시 만들어 견준다)
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (사람) · 색이 예쁜가 (도윤)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { solveProblems, type EpisodeText } from "@claro/contract";
import { PIPC } from "../../../episode/episodes/pipc/data";
import { TODAY_COPY } from "./copy";
import { TODAY, continues, minutesOfLong, minutesOfShort, sharedConcepts } from "./data";
import { CONTRAST_PAIRS, PALETTES, contrast } from "./palette/palettes";
import { SHORT, SHORT_CHROME, SHORT_STORES } from "./short/data";

const REPO = path.join(import.meta.dirname, "../../../../../..");
let failed = 0;
const fail = (code: string, message: string) => {
  failed += 1;
  console.log(`  FAIL ${code} ${message}`);
};
const squash = (s: string) => s.replace(/\s+/g, "");
const runs = (s: string) => (s.replace(/(\d),(?=\d)/g, "$1").match(/\d+/g) ?? []).map((n) => String(Number(n)));
const isText = (v: unknown): v is EpisodeText => typeof v === "object" && v !== null && typeof (v as { t?: unknown }).t === "string";

// ─────────────────────────────────────────────────────────── 짧은 이야기
console.log(`■ 짧은 이야기 — ${SHORT.scenes.cover.title.replace(/\n/g, " ")} (${SHORT.code})`);
{
  // T1
  for (const f of SHORT_STORES) {
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", f], { cwd: REPO, stdio: "pipe" });
    } catch {
      fail("T1", `문서 파일이 git 에 없다 — ${f}`);
    }
  }
  const documents = SHORT_STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
  const used = new Set<string>();
  for (const [key, q] of Object.entries(SHORT.quotes)) {
    const doc = SHORT.docs[q.doc];
    if (!doc) {
      fail("T2", `구절 ${key} 의 문서 "${q.doc}" 가 docs 에 없다`);
      continue;
    }
    const stored = documents.find((d) => d.source_id === doc.source_id);
    if (!stored) fail("T1", `구절 ${key}: 문서 ${q.doc} (${doc.source_id}) 가 git 의 저장 문서에 없다`);
    else if (!squash(stored.text).includes(squash(q.quote))) fail("T1", `구절 ${key} 가 저장된 문서의 글과 다르다 — "${q.quote.slice(0, 40)}…"`);
    else used.add(doc.source_id);
  }

  // T2 · T3 — 글을 전부 걷는다
  const texts: { where: string; item: EpisodeText }[] = [];
  const bare: { where: string; s: string }[] = [];
  const walk = (v: unknown, where: string) => {
    if (isText(v)) texts.push({ where, item: v });
    else if (typeof v === "string") bare.push({ where, s: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (typeof v === "object" && v !== null) for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`);
  };
  walk(SHORT.scenes, "scenes");
  walk({ first_thought: SHORT.entry.first_thought, breaker: SHORT.entry.breaker, flip: SHORT.entry.flip, whose: SHORT.entry.whose }, "entry");
  walk(SHORT.plain.title, "plain.title");
  walk(SHORT.sibling, "sibling");
  walk(SHORT_CHROME, "chrome");
  let withDigits = 0;
  for (const { where, item } of texts) {
    for (const k of item.src ?? []) if (!SHORT.quotes[k]) fail("T2", `${where}: 구절 "${k}" 가 quotes 에 없다`);
    const need = runs(item.t);
    if (!need.length) continue;
    withDigits += 1;
    const pool = (item.src ?? []).flatMap((k) => runs(SHORT.quotes[k]?.quote ?? ""));
    for (const n of need) if (!pool.includes(n) && !item.ui) fail("T3", `${where}: 숫자 ${n} 이 근거 구절에 없다 — "${item.t}"`);
  }
  for (const { where, s } of bare) if (/\d/.test(s)) fail("T3", `${where}: 맨 글자열에 숫자가 있다 — "${s}"`);
  for (const key of SHORT.tools_from.keys) if (!PIPC.tools.some((x) => x.key === key)) fail("T2", `도구 "${key}" 가 긴 이야기 (${SHORT.tools_from.episode})에 없다`);
  if (SHORT.event_ref !== PIPC.event_ref) fail("T2", "event_ref 가 긴 이야기와 다르다 — 같은 발표다");

  // T4
  const all = [...texts.map((x) => ({ where: x.where, s: x.item.t })), ...bare].filter((x) => !x.where.startsWith("chrome"));
  const banned: [RegExp, string][] = [
    [/공표/, "공표명령 (영훈의료재단에는 없다 — ③ 9)"],
    [/안 모았|모으지 않았(다면|으면)|없었다면|없었을/, "반사실 (“안 모았으면 안 털렸다” — ③ 10)"],
    [/진료 기록(은|이|도)? ?(안전|무사|유출|빠져|털렸[어다]요?\.)/, "진료 기록의 안전 / 유출을 말함 (문서에 없다 — ③ 11)"],
    [/한 명당|한 사람당|1인당|배나? |곱절/, "과징금 ÷ 명수 · 배수 견주기"],
  ];
  for (const { where, s } of all) for (const [re, what] of banned) if (re.test(s)) fail("T4", `${where}: ${what} — "${s}"`);

  // T5 — 계약의 풀이 규칙에 넣어 본다
  const r = solveProblems({ entry: SHORT.entry, lab: null, plain: SHORT.plain }, { quotes: SHORT.quotes, tools: PIPC.tools });
  const codes = r.errors.map((e) => e.code);
  if (codes.join() !== "PLAIN_WHY") fail("T5", `계약의 풀이 규칙에서 걸린 것이 PLAIN_WHY 하나가 아니다 — [${codes.join(", ")}]`);

  console.log(`  구절 ${Object.keys(SHORT.quotes).length} (문서 ${used.size} — 전부 git 의 store.documents.json) · 글 ${texts.length} — 숫자가 든 글 ${withDigits} · 맨 글자열 ${bare.length}`);
  console.log(`  장면 넷 · 체험 없음 · 뒤집기 A ${SHORT.entry.flip?.op} B · 다시 만나는 도구 ${SHORT.tools_from.keys.join(" · ")} (긴 이야기 ${SHORT.tools_from.episode} 의 카드 그대로)`);
  console.log(`  계약의 풀이 규칙: ${r.errors.map((e) => `${e.code} ${e.path} — ${e.message}`).join(" / ")}  ← 계약에 모자란 칸 (D80 실물 · 실패가 아니다)`);
}

// ─────────────────────────────────────────────────────────── 오늘
console.log("\n■ 오늘 — 카드");
{
  for (const item of TODAY) {
    if (item.kind === "long") {
      const { ep } = item;
      const cont = continues(ep);
      if (cont !== ep.number >= 2) fail("T6", `${ep.code}: 번호 규칙이 Episode.number 와 다르다`);
      console.log(`  긴 이야기  ${ep.series.name}${cont ? ` · ${ep.scenes.cover.episode.t} (이어지는 이야기 — 번호 · 시리즈 줄 · 지난 이야기)` : " (주제 이름만 — 번호 없음)"} · 약 ${minutesOfLong(ep)}분 · 체험 ${ep.solve.lab ? "있음" : "없음"} → ${ep.path}`);
    } else if (item.kind === "short") console.log(`  짧은 이야기 ${item.story.shelf.name} (주제 이름만 — 번호 없음) · 약 ${minutesOfShort(item.story)}분 · 체험 없음 → ${item.path}`);
    else console.log("  자리만     견본 자리 — 글 없음");
  }
  for (const [k, v] of Object.entries(TODAY_COPY)) if (/\d/.test(v) && k !== "recap") fail("T6", `화면 글 ${k} 에 숫자가 있다 — "${v}"`);
  for (const g of sharedConcepts()) console.log(`  개념으로 이어짐: ${g.names.join(" · ")} — ${g.stories.map((x) => x.title).join(" ↔ ")}`);
}

// ─────────────────────────────────────────────────────────── 색
console.log("\n■ 색 시안 — 대비 (WCAG 2 · AA = 4.5 이상)");
{
  const hsl = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
    const [max, min] = [Math.max(r, g, b), Math.min(r, g, b)];
    const d = max - min;
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
  };
  for (const p of PALETTES) {
    const rows = CONTRAST_PAIRS.map(([a, b, what]) => ({ what, ratio: contrast(p.colors[a], p.colors[b]) }));
    const worst = rows.reduce((m, x) => (x.ratio < m.ratio ? x : m));
    const bg = hsl(p.colors.paper);
    const ac = hsl(p.colors.accent);
    console.log(`  ${p.name} (${p.id}) — ${p.note}`);
    console.log(`    ${rows.map((x) => `${x.what} ${x.ratio.toFixed(2)}`).join(" · ")}`);
    console.log(`    가장 낮은 짝: ${worst.what} ${worst.ratio.toFixed(2)} · 바탕 색상 ${bg.h}° 채도 ${bg.s}% · 강조 색상 ${ac.h}°`);
    for (const x of rows) if (x.ratio < 4.5) fail("T7", `${p.name}: ${x.what} ${x.ratio.toFixed(2)} — AA 아래`);
    if (p.id === "paper") continue;
    // 피할 결 — 따뜻한 (노랑 ~ 주황 쪽) 밝은 바탕 · 주황 ~ 코랄 ~ 테라코타 강조
    if (bg.l > 60 && bg.s > 6 && bg.h >= 15 && bg.h <= 70) fail("T7", `${p.name}: 바탕이 따뜻한 종이 결이다 (색상 ${bg.h}° 채도 ${bg.s}%)`);
    if ((ac.h >= 0 && ac.h <= 45) || ac.h >= 350) fail("T7", `${p.name}: 강조가 주황 · 코랄 · 테라코타 쪽이다 (색상 ${ac.h}°)`);
  }
}

// T8
console.log("\n■ 덮는 규칙");
try {
  console.log(`  ${execFileSync("node", [path.join(import.meta.dirname, "palette/gen-overrides.mjs"), "--check"], { encoding: "utf8" }).trim()}`);
} catch (e) {
  fail("T8", String((e as { stdout?: string }).stdout ?? e).trim());
}

if (failed) {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
console.log("\nOK — 짧은 이야기 (구절 · 숫자 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 셋 (AA) · 덮는 규칙");
