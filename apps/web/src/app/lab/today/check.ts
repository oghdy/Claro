// UX-7 · UX-7b 시안의 검사 — "오늘" 화면 · 짧은 이야기 · 색 시안. (회차 셋은 ../episode/check.ts 가 계약으로 본다 — 여기서 다시 보지 않는다.)
//   pnpm --filter @claro/web exec tsx src/app/lab/today/check.ts
// 보는 것
//   T1  짧은 이야기의 구절이 전부 **git 에 있는** 저장 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시 — 계약 불변식 8 과 같은 대조). 문서 파일이 git 에 올라 있는 파일인지도 본다
//   T2  짧은 이야기의 글이 가리키는 구절 · 문서 · 도구가 전부 있다
//   T3  글의 숫자는 전부 근거 구절 안에 있다 (계약 불변식 9 와 같은 셈) · 맨 글자열 (제목 · 물음 · 한 줄)에는 숫자가 없다
//   T4  그리지 않을 것 (E3-1 ③ 9 · 10 · 11) — 공표명령 · "안 모았으면" · 진료 기록의 안전 / 유출 · 한 사람 몫이 글에 없다 (낱말로만 본다. 뜻은 사람이 읽는다)
//   T5  풀이 칸을 계약의 규칙 (solveProblems)에 넣으면 **PLAIN_WHY 하나만** 걸린다 — 계약에 "짧아서 체험이 없다"는 까닭이 없다는 것 (D80 의 실물). 다른 것이 걸리면 실패
//   T6  "오늘"의 번호 규칙 — 번호 · 지난 이야기가 보이는 카드는 Episode.number ≥ 2 인 것뿐이다 · 화면 글의 숫자는 "지난 이야기 30초" 하나뿐이다
//   T7  색 시안 — 재는 짝 전부 대비 4.5 이상 (WCAG AA) · **Claude 결이 아니다** (채도 있는 크림 · 베이지 바탕 / 주황 쪽 강조 — UX-7b 에서 고친 규칙: 따뜻한 바탕은 막지 않는다)
//       · 따뜻하고 부드러운 셋 (미색 · 쑥 · 형광펜)은 **눈 피로 기준** (본문 대비 범위 · 새하얀 바탕 피함 · 바탕 채도 낮게 · 따뜻한 쪽)
//   T8  덮는 규칙 (palette/overrides.css)이 src/episode 의 CSS 와 맞는다 (다시 만들어 견준다)
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (사람) · 색이 예쁜가 (도윤)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { solveProblems, type EpisodeText } from "@claro/contract";
import { PIPC } from "../../../episode/episodes/pipc/data";
import { TODAY_COPY } from "./copy";
import { TODAY, continues, sharedConcepts } from "./data";
import { CONTRAST_PAIRS, HL_PAIRS, PALETTES, contrast } from "./palette/palettes";
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
      console.log(`  긴 이야기  ${ep.series.name}${cont ? ` · ${ep.scenes.cover.episode.t} (이어지는 이야기 — 번호 · 시리즈 줄 · 지난 이야기)` : " (주제 이름만 — 번호 없음)"} · 체험 ${ep.solve.lab ? "있음" : "없음"} → ${ep.path}`);
    } else if (item.kind === "short") console.log(`  짧은 이야기 ${item.story.shelf.name} (주제 이름만 — 번호 없음) · 체험 없음 → ${item.path}`);
    else console.log("  자리만     견본 자리 — 글 없음");
  }
  for (const [k, v] of Object.entries(TODAY_COPY)) if (/\d/.test(v) && k !== "recap") fail("T6", `화면 글 ${k} 에 숫자가 있다 — "${v}"`);
  for (const g of sharedConcepts()) console.log(`  개념으로 이어짐: ${g.names.join(" · ")} — ${g.stories.map((x) => x.title).join(" ↔ ")}`);
}

// ─────────────────────────────────────────────────────────── 색
console.log("\n■ 색 시안 — 대비 (WCAG 2 · AA = 4.5 이상) · Claude 결 · 눈 피로");
/** 경계값 (UX-7b — 까닭은 logs/frontend/UX-7b.md ④) */
const CREAM_SAT = 30; // 따뜻한 밝은 바탕의 채도 (HSL %) — 이것을 넘으면 크림 · 베이지로 읽는다. 종이 44 · 새 셋 14 ~ 24 — 그 사이에 금을 그었다
const SOFT_SAT = 26; // 새 셋의 바탕 채도 위 끝 — CREAM_SAT 보다 안쪽
const [BODY_MIN, BODY_MAX, CARD_MAX] = [10, 14.5, 15.5]; // 본문 대비 범위 (바탕) · 면 위의 위 끝
const [BG_L_MAX, CARD_L_MAX] = [94, 98]; // 바탕 · 면의 밝기 (HSL %) 위 끝 — 새하얀 바탕을 피한다
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
    // 형광펜이 있는 색 — 글 위에 형광펜이 겹치는 짝도 잰다
    const hl = p.colors.hl;
    if (hl) for (const [a, what] of HL_PAIRS) rows.push({ what, ratio: contrast(p.colors[a], hl) });
    const worst = rows.reduce((m, x) => (x.ratio < m.ratio ? x : m));
    const bg = hsl(p.colors.paper);
    const card = hsl(p.colors.card);
    const ac = hsl(p.colors.accent);
    const body = contrast(p.colors.ink, p.colors.paper);
    const bodyCard = contrast(p.colors.ink, p.colors.card);
    console.log(`  ${p.name} (${p.id})${p.dock ? "" : " [견본 — 스위치에 없음 · ?c= 로만]"} — ${p.note}`);
    console.log(`    ${rows.map((x) => `${x.what} ${x.ratio.toFixed(2)}`).join(" · ")}`);
    console.log(`    가장 낮은 짝: ${worst.what} ${worst.ratio.toFixed(2)} · 바탕 색상 ${bg.h}° 채도 ${bg.s}% 밝기 ${bg.l}% · 면 밝기 ${card.l}% · 강조 색상 ${ac.h}° · 본문 대비 ${body.toFixed(2)} (면 ${bodyCard.toFixed(2)})`);
    for (const x of rows) if (x.ratio < 4.5) fail("T7", `${p.name}: ${x.what} ${x.ratio.toFixed(2)} — AA 아래`);

    // ── Claude 결 (UX-7b 에서 고친 규칙). 예전 규칙은 "따뜻한 밝은 바탕"을 통째로 막았다 (채도 6% 넘으면 실패) — 도윤이 고른 것이 바로 그 따뜻함이라 (D82) 그 규칙으로는 새 셋을 만들 수 없다.
    //    Claude 결은 따뜻함이 아니라 **채도 있는 크림 · 베이지 바탕**과 **주황 쪽 강조**다 (D83). 그래서 둘을 따로 본다 — 하나만 걸려도 멈춘다 (반쪽만 닮아도 그 결로 읽힌다):
    //      크림 · 베이지 바탕   밝고 (밝기 60% 넘음) 따뜻한 쪽 (색상 15 ~ 70° — 주황 ~ 노랑)인데 채도가 CREAM_SAT 를 넘는다. 지금 종이는 39° · 44% 다
    //      주황 쪽 강조         색상 345° ~ 50° (코랄 · 테라코타 · 주황 · 호박). 지금 종이는 14° 다
    const cream = bg.l > 60 && bg.h >= 15 && bg.h <= 70 && bg.s > CREAM_SAT;
    const orange = ac.h <= 50 || ac.h >= 345;
    if (p.id === "paper") {
      // 지금의 종이는 재 보기만 한다 (도윤이 고른 뒤 실제 화면 Step 에서 바뀐다) — 이 규칙이 종이를 Claude 결로 읽는다는 것이 규칙의 눈금이다
      console.log(`    Claude 결 규칙: 바탕 ${cream ? "걸림" : "안 걸림"} (채도 ${bg.s}% > ${CREAM_SAT}%) · 강조 ${orange ? "걸림" : "안 걸림"} (색상 ${ac.h}°) — 종이는 지금 값이라 멈추지 않는다`);
      if (!cream || !orange) fail("T7", "눈금이 틀렸다 — 지금 종이 (Claude 결이라고 한 색)가 규칙에 걸리지 않는다");
      continue;
    }
    if (cream) fail("T7", `${p.name}: 바탕이 채도 있는 크림 · 베이지 결이다 (색상 ${bg.h}° 채도 ${bg.s}% > ${CREAM_SAT}%)`);
    if (orange) fail("T7", `${p.name}: 강조가 주황 · 코랄 · 테라코타 쪽이다 (색상 ${ac.h}°)`);

    // ── 눈 피로 (UX-7b 의 따뜻하고 부드러운 셋만 — soft)
    if (!p.soft) continue;
    //   본문 대비 BODY_MIN ~ BODY_MAX — 최대 (21)로 밀지 않는다. 위: 도윤이 "눈이 안 피곤하다"고 한 지금 종이 (14.97)보다 세지 않게. 아래: AAA (7) 위로 넉넉히 — 둘째 글 · 옅은 글이 같은 바탕에서 AA 를 지킬 자리가 남는다
    if (body < BODY_MIN || body > BODY_MAX) fail("T7", `${p.name}: 본문 대비 ${body.toFixed(2)} 가 범위 (${BODY_MIN} ~ ${BODY_MAX}) 밖이다`);
    if (bodyCard > CARD_MAX) fail("T7", `${p.name}: 면 위의 본문 대비 ${bodyCard.toFixed(2)} 가 ${CARD_MAX} 를 넘는다`);
    //   새하얀 바탕 · 면을 피한다
    if (bg.l > BG_L_MAX) fail("T7", `${p.name}: 바탕이 너무 밝다 (밝기 ${bg.l}% > ${BG_L_MAX}%)`);
    if (card.l > CARD_L_MAX) fail("T7", `${p.name}: 면이 새하얗다 (밝기 ${card.l}% > ${CARD_L_MAX}%)`);
    //   바탕 채도 낮게 — 어느 색상이든
    if (bg.s > SOFT_SAT) fail("T7", `${p.name}: 바탕 채도 ${bg.s}% 가 ${SOFT_SAT}% 를 넘는다`);
    //   따뜻하다 — 바탕이 노랑 ~ 연두 쪽 (색상 20 ~ 100°)이고 채도가 0 이 아니다 (서늘한 회청 · 무채색 흰색이 아니다)
    if (!(bg.h >= 20 && bg.h <= 100 && bg.s >= 8)) fail("T7", `${p.name}: 바탕이 따뜻하지 않다 (색상 ${bg.h}° 채도 ${bg.s}%)`);
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
console.log("\nOK — 짧은 이야기 (구절 · 숫자 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙");
