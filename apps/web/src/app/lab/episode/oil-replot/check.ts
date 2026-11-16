// UX-10 — 다시 짠 기름값 1화 (/lab/episode/oil-replot)의 검사. ../check.ts (실제 화면의 회차 · 견본) · ../rate-3 · ../fomc-auto 의 검사는 따로 돈다.
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/oil-replot/check.ts
// 보는 것
//   계약   episode.json 이 계약 검증을 지난다 — 저장된 문서를 읽어 구절 대조 (불변식 8) · 숫자 근거 (불변식 9 · 10) · 풀이 칸까지
//   R1     옮겨 온 구절 (F…)은 지금 판 (oil-1)의 구절 그대로다 · 새 구절 (N…)은 이 세션이 문서에서 뗀 것 — 몇 개인지 적는다
//   R2     처음 온 독자의 길에 "지금까지의 이야기" (zero)가 없다 — 표지 다음이 오늘의 사건이다 (법 4)
//   R3     **답 먼저 금지** (법 5) — 풀이의 누르기 전까지 독자가 보는 글 (표지 · 오늘의 사건 · 도구 줍기의 도구 · 체험의 준비 글 · 누르기 전 그림말 · 고리 이름 · 시안 칸의 뉴스 한 줄 · 가린 고리의 말)에
//          깨는 사실의 말이 없고, 그 글의 근거 시트에 뜨는 구절에도 깨는 사실이 없다. 깨는 사실인 구절은 글자로 가린다 (아래 ANSWER)
//   R4     시안 전용 칸 (data.ts REPLOT — 계약 밖)의 글: 뉴스 한 줄의 숫자는 근거 구절에 · 터지는 문장은 근거 구절을 이은 글자 그대로 · 맨 글자열에 숫자 없음 · 가린 고리는 사슬의 멈춘 고리다
//   R5     "오늘 문서에는 누구의 값인지가 없다" (도구 '고시'의 글)가 참이다 — 11/13 보도참고의 글에 주유소 · 정유사 · 공급가격이 0 번
//   R6     실제 화면처럼 — 다음 화를 약속하지 않는 이야기로 잡힌다 (catalog.unpromised) · 번호를 숨긴다 (catalog.numbered) · 그림은 OIL_LOOK
//   R7     **화면 칸 (kit/types ScreenSlots · 옛 이름 replot)을 넘기는 곳이 정해져 있다** (F-E6 부터 실제 화면도 쓴다 — 이야기 목록의 손 칸) — 기름값 시안 폴더들 + 실제 화면 (episode/Screen.tsx 가 목록의 line.screen 을) 뿐이다 (src/ 를 다 읽어 센다)
//          · 뉴스 한 줄의 CSS 가 뼈대 (episode.css)에 없다 · 이야기 목록 (catalog) · 실제 화면이 이 시안 폴더를 읽지 않는다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (이번에는 함의 검사를 돌리지 않았다 — 모델 API 0 · 사람이 읽는다) · 차례가 술술 읽히는가 (폰에서 사람)
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { validateEpisode } from "@claro/contract";
import { LONGS, OIL_LOOK, numbered, unpromised } from "../../../../episode/catalog";
import { isSteps } from "../../../../episode/kit/frames/LabCard";
import { toolOf } from "../../../../episode/kit/types";
import { BANNER, EPISODE, NOW, PATH, REPLOT, STORES } from "./data";

const REPO = path.join(import.meta.dirname, "../../../../../../..");
const SRC = path.join(REPO, "apps/web/src");
const HERE = path.relative(SRC, import.meta.dirname);
console.log("■ 기름값 다시 짜기 (oil-replot · UX-10)");

const errors: string[] = [];
const built = JSON.parse(readFileSync(path.join(import.meta.dirname, "episode.json"), "utf8"));
const documents = STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
const r = validateEpisode(built, { documents });
if (!r.ok) {
  console.log(`FAIL ${r.errors.length}`);
  for (const x of r.errors) console.log(`  ${x.code} ${x.path}: ${x.message}`);
  process.exit(1);
}
const e = r.episode;
const { stats } = r;
console.log(`계약 OK — 구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits} · 도구 ${stats.tools}`);
console.log(`밝혀 둔 예외 ${stats.exempt.length}:`);
for (const x of stats.exempt) console.log(`  ${x}`);
for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}: ${w.message}`);
const { lab, entry } = e.solve;
console.log(`풀이 칸: 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 뒤집기 ${entry.flip ? `A ${entry.flip.op} B (데이터에는 있다 — 화면은 상자를 그리지 않는다)` : "없음"} · 사망 ${entry.death ? "예" : "아니오"}`);

// R1 — 구절
const now = JSON.parse(readFileSync(path.join(REPO, "packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/episodes/oil-1/episode.json"), "utf8")) as { episode_id: string; quotes: Record<string, { doc: string; quote: string }> };
const fresh = Object.keys(e.quotes).filter((k) => !(k in now.quotes));
for (const [k, q] of Object.entries(e.quotes)) if (k in now.quotes && (now.quotes[k]!.quote !== q.quote || now.quotes[k]!.doc !== q.doc)) errors.push(`R1 구절 ${k}: 지금 판의 구절과 다르다`);
for (const k of fresh) if (!k.startsWith("N.")) errors.push(`R1 구절 ${k}: 지금 판에 없는데 새 구절의 이름 (N.…)이 아니다`);
console.log(`R1 구절: 지금 판에서 그대로 ${Object.keys(e.quotes).length - fresh.length} · 새로 뗀 것 ${fresh.length} (${fresh.join(" ")})`);

// R2 — 처음 온 독자의 길
const road = e.assembly.new;
if (road.includes("zero")) errors.push("R2 처음 온 독자의 길에 지금까지의 이야기 (zero)가 있다");
if (road[1] !== "event") errors.push(`R2 표지 다음이 오늘의 사건이 아니다 — ${road[1]}`);
console.log(`R2 처음 온 독자의 길: ${road.join(" → ")}`);

// R3 — 답 먼저 금지
type Txt = { t: string; src?: readonly string[] };
const norm = (s: string) => s.replace(/\s+/g, "");
/** 깨는 사실인 구절 — 글자로 가린다: "적용 대상에서 제외" · 공급가격이 기준 / 대상 / 상한이라는 말 · 고시 · 규정이 대상을 적은 문장 · 정유사가 넘을 수 없다는 조문 */
const ANSWER = (q: string) => /적용대상에서제외/.test(norm(q)) || (/공급가격/.test(q) && /기준|대상|상한|고정/.test(q)) || /석유정제업자가석유판매업자/.test(norm(q)) || /석유정제업자는.*초과하여판매할수없다/.test(norm(q));
/** 글에 답의 말이 있나 */
const SAYS = (t: string) => /대상에서\s*(제외|빼|뺀)|공급가격(을|이)\s*(기준|대상)|정유사가[^.]{0,20}넘기는[^.]{0,12}(상한|천장)(은|이|을|에)\s|가격표[^.]{0,12}(천장|상한)\s*밖/.test(t);
const answers = Object.entries(e.quotes).filter(([, q]) => ANSWER(q.quote)).map(([k]) => k);
const chain = lab?.frames[0]?.kind === "chain" ? lab.frames[0] : null;
if (!chain) errors.push("R3 체험의 첫 틀이 사슬이 아니다");
const c = e.scenes;
const before: [string, Txt | string][] = [
  ["표지 제목", c.cover.title],
  ["표지 한 줄", c.cover.dek],
  ["표지 날", c.cover.meta],
  ["표지 귀띔", c.cover.new_hint],
  ["표지 단추", c.cover.ask_new],
  ["시안 칸 · 뉴스 한 줄", REPLOT.news],
  ["사건 제목", c.event.title],
  ["사건 첫 글", c.event.lead],
  ...c.event.figures.flatMap((f, i): [string, Txt | string][] => [[`사건 숫자 ${i} 누구`, f.who], [`사건 숫자 ${i}`, f.amount], [`사건 숫자 ${i} 꼬리표`, f.tag]]),
  ["사건 숫자 풀이", c.event.figure_note],
  ["사건 인용 머리", c.event.quote_label],
  ["사건 인용", c.event.quote],
  ["사건 인용 풀이", c.event.quote_note],
  ...c.event.riddle.map((x, i): [string, Txt] => [`사건 수수께끼 ${i}`, x]),
  ["사건 단추", c.event.ask],
  ["도구 줍기 제목", c.tools.title_new],
  ["도구 줍기 단추", c.tools.ask],
  ...e.pickup.tools.flatMap((k): [string, Txt | string][] => {
    const tool = toolOf(e, k);
    return [[`도구 ${k} 이름`, tool.name], [`도구 ${k} 한 줄`, tool.short], ...tool.body.map((b, i): [string, Txt] => [`도구 ${k} 본문 ${i}`, b])];
  }),
  ["체험 제목", lab?.title ?? ""],
  ...(lab?.setup ?? []).map((x, i): [string, Txt] => [`체험 준비 ${i}`, x]),
  ...(chain ? ([["그림말 (누르기 전)", chain.caption.before], ["누르는 말", chain.action], ...chain.nodes.flatMap((n): [string, string][] => [[`고리 ${n.id} 이름`, n.name], ...(n.reach === "none" ? [] : [[`고리 ${n.id} 누르기 전`, n.idle] as [string, string]])])] as [string, Txt | string][]) : []),
  ...Object.entries(REPLOT.veil).map(([k, v]): [string, string] => [`시안 칸 · 가린 고리 ${k}`, v]),
];
for (const [where, v] of before) {
  const t = typeof v === "string" ? v : v.t;
  if (SAYS(t)) errors.push(`R3 ${where}: 풀이 전에 답의 말이 있다 — "${t.replace(/\n/g, " ")}"`);
  for (const k of typeof v === "string" ? [] : (v.src ?? [])) if (answers.includes(k)) errors.push(`R3 ${where}: 근거 시트에 깨는 사실인 구절 ${k} 이 뜬다 — "${e.quotes[k]!.quote}"`);
}
// 멈춘 고리 (주유소)의 꼬리표는 답이다 — 가려져 있어야 한다
for (const n of chain?.nodes ?? []) if (n.reach === "none" && !(n.id in REPLOT.veil)) errors.push(`R3 멈춘 고리 ${n.id} 의 꼬리표 ("${n.still.t}")가 누르기 전에 보인다 — 시안 칸 veil 에 없다`);
// 거꾸로 — 이 검사가 답을 알아보는지: 풀이 뒤의 글에는 답이 있어야 한다
const afterTexts = [chain?.caption.after.t ?? "", REPLOT.burst.quote.t, c.aha.verdict.t];
if (!afterTexts.some(SAYS)) errors.push("R3 (검사 자신) 풀이 뒤의 글에서 답의 말을 알아보지 못했다 — SAYS 가 낡았다");
if (!answers.includes("F054.2") || !answers.includes("F037")) errors.push("R3 (검사 자신) 깨는 사실인 구절 (F054.2 · F037)을 알아보지 못했다 — ANSWER 가 낡았다");
console.log(`R3 답 먼저 금지: 풀이의 누르기 전까지 글 ${before.length} 덩이 · 깨는 사실인 구절 ${answers.length} (${answers.join(" ")}) — 앞의 글 · 근거 시트 어디에도 없다`);

// R4 — 시안 전용 칸
const runs = (s: string) => (s.replace(/,/g, "").match(/\d+/g) ?? []).map((n) => String(Number(n)));
const pool = (src: readonly string[]) => src.flatMap((k) => runs(e.quotes[k]?.quote ?? ""));
for (const [where, x] of [["news", REPLOT.news], ["burst.quote", REPLOT.burst.quote]] as const) {
  for (const k of x.src) if (!(k in e.quotes)) errors.push(`R4 ${where}: 근거 ${k} 가 구절에 없다`);
  for (const n of runs(x.t)) if (!pool(x.src).includes(n)) errors.push(`R4 ${where}: 숫자 ${n} 이 근거 구절에 없다`);
}
for (const [k, v] of Object.entries({ "burst.label": REPLOT.burst.label, "burst.note": REPLOT.burst.note, ...BANNER, ...Object.fromEntries(Object.entries(REPLOT.veil).map(([id, t]) => [`veil.${id}`, t])) })) if (/\d/.test(v)) errors.push(`R4 ${k}: 맨 글자열에 숫자가 있다 — "${v}"`);
const joined = norm(REPLOT.burst.quote.src.map((k) => e.quotes[k]?.quote ?? "").join(""));
if (norm(REPLOT.burst.quote.t.replace(/[“”]/g, "")) !== joined) errors.push("R4 burst.quote: 근거 구절을 이은 글자 그대로가 아니다");
const doc0312 = documents.find((d) => d.source_id === e.docs[e.quotes["F054.1"]!.doc]!.source_id);
if (!doc0312 || !norm(doc0312.text).includes(joined)) errors.push("R4 burst.quote: 저장된 문서의 글 그대로가 아니다");
for (const id of Object.keys(REPLOT.veil)) if (!chain?.nodes.some((n) => n.id === id && n.reach === "none")) errors.push(`R4 veil.${id}: 사슬의 멈춘 고리가 아니다`);
if (lab && !isSteps(lab.frames)) errors.push("R4 veil: 체험이 사슬 · 자리 틀이 아니다 — 가릴 고리가 없다");
console.log(`R4 시안 전용 칸 셋: news "${REPLOT.news.t}" · veil ${Object.keys(REPLOT.veil).join(" ")} · burst (구절 ${REPLOT.burst.quote.src.join(" + ")} 을 이은 글자 그대로 · 저장된 문서에 있다)`);

// R5 — 오늘 문서가 말하지 않은 것
const today = documents.find((d) => d.source_id === e.docs["PR-1113-PDF"]!.source_id)!;
const counts = ["주유소", "정유사", "공급가격"].map((w) => [w, today.text.split(w).length - 1] as const);
for (const [w, n] of counts) if (n !== 0) errors.push(`R5 오늘 문서 (11/13 보도참고)에 "${w}" 가 ${n} 번 있다 — 도구 '고시'의 글 ("누구의 값인지가 적혀 있지 않아요")이 틀렸다`);
console.log(`R5 오늘 문서 (11/13 보도참고)에 ${counts.map(([w, n]) => `${w} ${n}`).join(" · ")} 번`);

// R6 — 실제 화면처럼
if (e.episode_id !== now.episode_id) errors.push("R6 episode_id 가 지금 판과 다르다 — 화면이 unpromised 로 찾지 못한다");
if (!unpromised(e)) errors.push("R6 다음 화를 약속하지 않는 이야기로 잡히지 않는다 (catalog.unpromised)");
if (numbered(e.series.code)) errors.push("R6 번호를 보이는 시리즈로 잡힌다 — 실제 /s/oil/1 은 번호를 숨긴다");
const real = LONGS.find((x) => x.ep.series.code === e.series.code);
if (!real || real.Art !== OIL_LOOK.Art || real.Glyph !== OIL_LOOK.Glyph) errors.push("R6 실제 기름값 이야기의 그림이 OIL_LOOK 이 아니다");
if (real && `/s/${real.ep.series.code}/${real.ep.number}` !== NOW) errors.push(`R6 견줘 읽기의 주소 (${NOW})가 실제 기름값 이야기의 주소가 아니다`);
console.log(`R6 실제 화면처럼: unpromised ${unpromised(e)} · 번호 ${numbered(e.series.code) ? "보임" : "숨김"} · 그림 OIL_LOOK · 견줘 읽기 → ${NOW}`);

// R7 — 화면 칸을 넘기는 곳 (F-E6: 실제 화면은 이야기 목록의 손 칸 line.screen 을 준다 — 그 칸의 검사는 ../check.ts S8)
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? files(path.join(dir, f)) : /\.(tsx?|css)$/.test(f) ? [path.join(dir, f)] : []));
const KIT = ["episode/kit/Episode.tsx", "episode/kit/frames/LabCard.tsx", "episode/kit/frames/Steps.tsx"];
const givers: string[] = [];
for (const f of files(SRC)) {
  const rel = path.relative(SRC, f);
  const text = readFileSync(f, "utf8");
  // 넘기는 곳 = JSX 의 screen= · veil= (뼈대 안에서 아래로 내려보내는 것은 뺀다)
  if (/\bscreen=\{/.test(text) || (/\bveil=\{/.test(text) && !KIT.includes(rel))) givers.push(rel);
  // F-E7 (D127): 뉴스 한 줄의 꼴 (.ep-news)은 이제 뼈대 (episode.css)의 것이다 — 실제 화면이 쓴다. 이 시안의 oil-replot.css 는 그 위에 제 꼴 (점 + 굵게)을 덧입힌다
}
const REAL_GIVER = "episode/Screen.tsx";
// L-1: 미리 보기 (/lab/local — 로컬 세션 판의 screen.json 을 실제와 같은 screenOf 로 읽어 준다 · 그 칸의 검사는 scripts/check-local.ts 가 ../check.ts S8 과 같은 함수로)도 넘기는 곳이다
const PREVIEW = "app/lab/local/";
for (const g of givers) if (!g.startsWith(HERE) && g !== REAL_GIVER && !g.startsWith(PREVIEW)) errors.push(`R7 화면 칸 (screen)을 넘기는 곳이 기름값 시안 폴더 · 실제 화면 (${REAL_GIVER}) 밖에 있다 — ${g}`);
if (!givers.some((g) => g.startsWith(HERE))) errors.push("R7 이 폴더가 화면 칸을 넘기지 않는다 — 검사가 낡았다");
// 실제 /s/oil/1 은 F-E6 부터 판 2 (메운 판 — events/…/local/oil-1)다. 이 시안 (첫째로 다시 짠 판)과 id · 판 번호가 같아도 다른 글이다 — 목록이 이 폴더의 파일을 읽지 않는지를 본다
if (LONGS.some((x) => x.ep.path === PATH)) errors.push("R7 이야기 목록 (catalog)에 이 판이 올라 있다");
for (const f of ["episode/Screen.tsx", "episode/catalog.tsx"]) if (/oil-replot/.test(readFileSync(path.join(SRC, f), "utf8"))) errors.push(`R7 실제 화면 (${f})이 이 시안 폴더를 읽는다`);
if (!/screen=\{line\.screen\}/.test(readFileSync(path.join(SRC, REAL_GIVER), "utf8"))) errors.push(`R7 실제 화면 (${REAL_GIVER})이 이야기 목록의 손 칸 (line.screen)이 아닌 것을 넘긴다`);
console.log(`R7 화면 칸을 넘기는 곳: ${givers.join(" · ")} — 실제 화면은 이야기 목록의 손 칸 (line.screen)만 · 목록은 이 시안 폴더를 읽지 않는다`);

if (errors.length) {
  console.log(`FAIL ${errors.length}`);
  for (const x of errors) console.log(`  ${x}`);
  process.exit(1);
}
console.log("OK — 계약 검증 (구절 · 숫자 · 풀이 칸)을 지났고, 차례 · 답 먼저 금지 · 화면 칸의 검사도 맞다");
