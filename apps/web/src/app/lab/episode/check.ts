// 회차 시안의 작은 검사 — 독자가 읽는 글의 숫자 · 날짜가 저장된 원문 구절에 있는가. **두 회차(배달앱 · FOMC) 다 돈다** (UX-2).
// UX-4: 풀이 칸(틀의 입구 · 틀 · 기본 풀이)의 글과 규칙도 본다 — 아래 E.
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
// 보는 것
//   A. 구절(quote)이 저장된 문서(store.documents.json)의 글에 그대로 있다 (빈칸 · 줄바꿈만 무시)
//   B. 글({ t })에 숫자가 있으면: 그 글의 src 구절들에 그 숫자가 있거나, calc(계산) · ui(화면 번호)로 밝혀 두었다
//   C. { t } 꼴이 아닌 맨 글자열에는 숫자가 없다 (숫자가 검사를 비켜 가지 못하게)
//   D. 가리키는 것이 있다 — 글의 src 가 그 회차의 구절이고, 도구 · 조립 · 지도 · 다른 시리즈가 가리키는 개념이 있다
//   E. 풀이 칸의 규칙 (UX-4 — kit/frames/types.ts) — 틀의 입구 · 틀 · 기본 풀이
//        E1 깨는 사실에는 구절이 있다                       E2 체험이 없으면 기본 풀이가 있고, 까닭이 넷 중 하나다 (demo 는 체험이 있는 시안에만)
//        E3 사람이 숨진 사건이면 체험이 없고 "조용히"다 (D61 ④)     E4 뒤집기가 없으면 틀을 고르지 않는다 (D61 ⑥)
//        E5 틀의 조합이 서는 것이다 (켜고 끄기 하나 · 고리 / 자리를 이은 것)
//        E6 자리에 앉기는 한 기관 안의 공식 이견에만 (D61 ③) — 정당 표결이면 FAIL · 쪽마다 공식으로 한 말에 구절 · 쪽마다의 수가 표결 기록 구절에 있다
//        E7 고리는 둘 ~ 넷이고, 닿은 차례대로이며, 멈춘 자리가 있다      E8 그림이 붙은 개념이 이 회차에 있다 · 이은 틀에는 탭 이름이 있다
//        E9 세 칸의 "서로 다르게 말하는 것"은 둘 이상을 나란히 (또는 빔) · 저마다 구절이 있다 (D46 ④)
//      맨 끝에 **일부러 망가뜨린 견본**을 돌려, 규칙이 정말 FAIL 을 내는지 본다 (FAIL 이 안 나오면 그것이 FAIL 이다)
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람이 읽는다). 한글로 쓴 수("여섯 가지") · 그림
//
// 영어 원문을 위한 읽기 규칙 둘 (UX-2 — FOMC 문서가 영어다. 구절 쪽에만 쓴다):
//   달 이름 → 수            "October 28, 2026" 의 October = 10      (글의 "10월 28일")
//   분수 → 소수             "3-3/4 to 4 percent" = 3.75 · "1/4 percentage point" = 0.25      (글의 "3.75~4%" · "0.25%포인트")
// 영어로 쓴 수(three weeks · eight meetings)는 읽지 않는다 — 글에서 calc 로 밝혀 둔다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { CHROME } from "./kit/chrome";
import { QUIET_SAMPLE } from "./episodes/quiet-sample/data";
import { isSteps, isToggle } from "./kit/frames/LabCard";
import { EPISODES, SHELF } from "./kit/shelf";
import type { EpisodeData, Solve, T } from "./kit/types";

const REPO = path.join(import.meta.dirname, "../../../../../..");
const squash = (s: string) => s.replace(/\s+/g, "");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 영어 구절의 달 이름 · 분수를 수로 */
const english = (s: string) =>
  MONTHS.reduce((out, m, i) => out.replace(new RegExp(`\\b${m}\\b`, "g"), ` ${i + 1} `), s)
    .replace(/(\d+)-(\d)\/(\d)/g, (_, whole: string, a: string, b: string) => String(Number(whole) + Number(a) / Number(b)))
    .replace(/(?<![\d.])(\d)\/(\d)(?![\d.])/g, (_, a: string, b: string) => String(Number(a) / Number(b)));
/** 숫자 토막 — 쉼표를 떼고, 숫자가 아닌 것으로 끊는다. 앞의 0 은 뗀다 ("09" = "9") */
const runs = (s: string) => (s.replace(/(\d),(?=\d)/g, "$1").match(/\d+/g) ?? []).map((n) => String(Number(n)));
const isT = (v: unknown): v is T => typeof v === "object" && v !== null && typeof (v as { t?: unknown }).t === "string";

/** 풀이 칸에서 독자의 글이 아닌 칸 — 구절 · 그림 · 쪽의 이름(가리키는 말). 숫자가 있어도 된다 */
const NOT_TEXT = new Set(["record", "picture", "id"]);

let failed = 0;

/** E — 풀이 칸의 규칙. notes 는 FAIL 이 아니라 알림이다 */
function checkSolve(solve: Solve, e: EpisodeData | null, errors: string[], notes: string[]) {
  const { entry, lab, plain } = solve;
  const pool = (keys: readonly string[]) => keys.flatMap((k) => runs(english(e?.sources[k]?.quote ?? "")));
  if (!entry.death && !entry.breaker.src?.length) errors.push("E1 entry.breaker: 깨는 사실에 근거 구절이 없다");
  if (!lab && !plain) errors.push("E2 solve: 체험도 기본 풀이도 없다");
  if (!lab && plain?.why === "demo") errors.push("E2 plain.why: 체험이 없는 회차인데 까닭이 demo 다 — 정치 · 사망 · 자료 · 뒤집기 없음 가운데 하나여야 한다");
  if (entry.death) {
    if (lab) errors.push("E3 entry.death: 사람이 숨진 사건인데 체험(lab)이 있다 (D61 ④)");
    if (plain && plain.kind !== "quiet") errors.push(`E3 entry.death: 사람이 숨진 사건인데 기본 풀이가 "조용히"가 아니다 — ${plain.kind} (D61 ④)`);
    if (plain && plain.why !== "death") errors.push(`E3 plain.why: 사람이 숨진 사건인데 까닭이 ${plain.why} 다`);
  } else if (plain?.why === "death") errors.push("E3 plain.why: 까닭이 사망인데 entry.death 가 아니다");
  if (!entry.flip && lab) errors.push("E4 entry.flip: 뒤집기가 없는데 틀을 골랐다 — 뒤집기가 없으면 기본 풀이다 (D61 ⑥)");
  if (!entry.flip && plain?.kind === "flip") errors.push("E4 plain: 뒤집기가 없는데 꼴이 뒤집기만(flip)이다");
  if (plain?.kind === "three") {
    if (plain.differ.length === 1) errors.push("E9 plain.differ: 서로 다르게 말하는 것이 한쪽뿐이다 — 둘 이상을 나란히 놓거나 비운다 (D46 ④)");
    plain.differ.forEach((d, i) => d.says.src?.length || errors.push(`E9 plain.differ[${i}]: 그쪽이 한 말에 근거 구절이 없다`));
  }
  if (!lab) return;
  if (!isToggle(lab.frames) && !isSteps(lab.frames)) errors.push(`E5 lab.frames: 서는 조합이 아니다 — [${lab.frames.map((f) => f.kind).join(", ")}] (켜고 끄기 하나 · 고리 / 자리를 이은 것만)`);
  lab.frames.forEach((f, i) => {
    const at = `lab.frames[${i}] ${f.kind}`;
    if (f.picture.concept && e && !e.concepts[f.picture.concept]) errors.push(`E8 ${at}: 그림이 붙은 개념 "${f.picture.concept}" 가 이 회차에 없다`);
    if (lab.frames.length > 1 && f.kind !== "toggle" && !f.tab) errors.push(`E8 ${at}: 틀을 이었는데 탭 이름이 없다`);
    if (f.kind === "chain") {
      if (f.nodes.length < 2 || f.nodes.length > 4) errors.push(`E7 ${at}: 고리가 ${f.nodes.length}개다 — 둘 ~ 넷`);
      const rank = { full: 0, part: 1, none: 2 } as const;
      if (f.nodes.some((n, k) => k > 0 && rank[n.reach] < rank[f.nodes[k - 1]!.reach])) errors.push(`E7 ${at}: 고리가 닿은 차례대로가 아니다 — ${f.nodes.map((n) => n.reach).join(" → ")}`);
      if (!f.nodes.some((n) => n.reach === "none")) errors.push(`E7 ${at}: 멈춘 자리가 없다 — 힘이 닿지 않은 고리가 하나는 있어야 "어디서 멈추나"다`);
    }
    if (f.kind === "seats") {
      if (f.ground.split !== "official-dissent") errors.push(`E6 ${at}: 한 기관 안의 공식 이견이 아니다 (split: ${f.ground.split}) — 정당 표결에는 자리에 앉기를 쓰지 않는다. 양쪽 공식 입장을 글로 나란히 (D61 ③)`);
      if (!f.ground.body.trim()) errors.push(`E6 ${at}: 어느 기관의 표결인지 적지 않았다`);
      if (!f.ground.record.length) errors.push(`E6 ${at}: 표결이 적힌 공식 기록(구절)이 없다`);
      for (const k of f.ground.record) if (e && !e.sources[k]) errors.push(`E6 ${at}: 표결 기록 "${k}" 가 이 회차의 구절이 아니다`);
      const record = pool(f.ground.record);
      for (const side of f.sides) {
        if (!side.said.src?.length) errors.push(`E6 ${at}: "${side.id}" 쪽이 공식으로 한 말에 근거 구절이 없다`);
        if (!record.includes(String(side.count))) errors.push(`E6 ${at}: "${side.id}" 쪽의 수 ${side.count} 이 표결 기록 구절에 없다`);
        if (side.why === "not-yet") notes.push(`${at}: "${side.id}" 쪽의 까닭은 아직 문서에 없다 (not-yet) — 그 문서가 나올 때까지 이 쪽은 반쪽이다`);
      }
    }
  });
}

/** quiet: 찍지 않고 FAIL 만 돌려준다 (망가뜨린 견본용) */
function check(name: string, e: EpisodeData | null, roots: Record<string, unknown>, solve?: Solve, quiet = false): string[] {
  const errors: string[] = [];
  const notes: string[] = [];
  const exempt: string[] = [];
  let quotes = 0;
  let texts = 0;
  let withDigits = 0;

  // A
  if (e) {
    const textOf = new Map<string, string>();
    for (const [store, file] of Object.entries(e.stores)) {
      const docs = (JSON.parse(readFileSync(path.join(REPO, file), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents;
      for (const d of docs) textOf.set(`${store}:${d.source_id}`, squash(d.text));
    }
    for (const [key, s] of Object.entries(e.sources)) {
      quotes++;
      const ref = e.docs[s.doc];
      const doc = ref ? textOf.get(`${ref.store}:${ref.source_id}`) : undefined;
      if (!doc) errors.push(`A ${key}: 문서 ${s.doc} 가 저장된 문서에 없다`);
      else if (!doc.includes(squash(s.quote))) errors.push(`A ${key}: 구절이 ${s.doc} 의 글에 없다 — "${s.quote.slice(0, 40)}…"`);
    }
  }

  // B · C · D(src)
  function checkT(where: string, item: T) {
    texts++;
    for (const k of item.src ?? []) if (!e?.sources[k]) errors.push(`D ${where}: src "${k}" 가 이 회차의 구절이 아니다`);
    const want = runs(item.t.replace(/\*\*/g, ""));
    if (want.length === 0) return;
    withDigits++;
    if (item.ui) {
      exempt.push(`${where}: "${item.t}" (ui)`);
      return;
    }
    const pool = (item.src ?? []).flatMap((k) => runs(english(e?.sources[k]?.quote ?? "")));
    const calc = Object.keys(item.calc ?? {});
    for (const n of want) {
      // 연도: 글의 2026 ↔ 구절의 ’26
      const ok = pool.includes(n) || (n.length === 4 && n.startsWith("20") && pool.includes(String(Number(n.slice(2))))) || calc.includes(n);
      if (!ok) errors.push(`B ${where}: 숫자 ${n} 이 근거 구절에 없다 — "${item.t.slice(0, 50)}…" (src: ${(item.src ?? []).join(", ") || "없음"})`);
    }
    if (calc.length) exempt.push(`${where}: "${item.t.replace(/\n/g, " ").slice(0, 60)}${item.t.length > 60 ? "…" : ""}" (계산 — ${Object.entries(item.calc!).map(([n, how]) => `${n} = ${how}`).join(" · ")})`);
  }
  function walk(where: string, v: unknown) {
    if (typeof v === "string") {
      if (/\d/.test(v)) errors.push(`C ${where}: 맨 글자열에 숫자가 있다 — "${v}"`);
      return;
    }
    if (Array.isArray(v)) return v.forEach((x, i) => walk(`${where}[${i}]`, x));
    if (isT(v)) return checkT(where, v);
    if (typeof v === "object" && v !== null) for (const [k, x] of Object.entries(v)) NOT_TEXT.has(k) || walk(`${where}.${k}`, x);
  }
  for (const [k, v] of Object.entries(roots)) walk(k, v);

  // D
  if (e) {
    const has = (id: string) => Boolean(e.concepts[id]);
    const need = (what: string, ids: readonly string[]) => ids.forEach((id) => has(id) || errors.push(`D ${what}: 개념 "${id}" 가 이 회차에 없다`));
    need("conceptOrder", e.conceptOrder);
    need("toolOrder", e.toolOrder);
    need("lateTool", [e.lateTool]);
    need("map.at", Object.keys(e.map.at));
    need("map.edges", e.map.edges.flat());
    need("map.ghosts", e.map.ghosts.map((g) => g.from));
    for (const ids of Object.values(e.pickedAfter)) need("pickedAfter", ids ?? []);
    if (e.solve.lab?.born) need("solve.lab.born", [e.solve.lab.born.concept]);
    for (const id of e.conceptOrder) if (!e.map.at[id]) errors.push(`D map.at: 개념 "${id}" 의 자리가 없다`);
    for (const r of Object.values(e.readers)) {
      need(`readers.${r.id}.known`, r.known);
      for (const el of r.elsewhere) {
        const shelf = SHELF.find((s) => s.series === el.series);
        if (!shelf) errors.push(`D readers.${r.id}.elsewhere: 시리즈 "${el.series}" 가 책장에 없다`);
        else for (const id of el.concepts) if (!shelf.concepts[id]) errors.push(`D readers.${r.id}.elsewhere: 개념 "${id}" 가 시리즈 "${el.series}" 에 없다`);
      }
    }
    for (const sc of Object.values(e.assembly).flat()) if (!(sc in e.copy)) errors.push(`D assembly: 장면 "${sc}" 의 글이 없다`);
  }

  // E
  if (solve) checkSolve(solve, e, errors, notes);
  if (quiet) return errors;

  console.log(`\n■ ${name}`);
  console.log(e ? `구절 ${quotes} (문서 ${new Set(Object.values(e.sources).map((s) => s.doc)).size}) · 글 ${texts} — 숫자가 든 글 ${withDigits}` : `글 ${texts} — 숫자가 든 글 ${withDigits}`);
  if (e) {
    const lib = Object.values(e.concepts).filter((c) => c.from !== "hand");
    console.log(`개념 ${Object.keys(e.concepts).length} — 개념 라이브러리 바탕 ${lib.length} · 손으로 ${Object.keys(e.concepts).length - lib.length}`);
  }
  console.log(`밝혀 둔 예외 ${exempt.length}:`);
  for (const x of exempt) console.log(`  ${x}`);
  if (solve) {
    const { lab, plain, entry } = solve;
    console.log(`풀이 칸: 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 기본 풀이 ${plain ? `${plain.kind} (까닭: ${plain.why})` : "없음"} · 뒤집기 ${entry.flip ? `A ${entry.flip.op} B` : "없음"} · 사망 ${entry.death ? "예" : "아니오"}`);
    for (const x of notes) console.log(`  알림 — ${x}`);
  }
  if (errors.length) {
    failed += errors.length;
    console.log(`FAIL ${errors.length}`);
    for (const x of errors) console.log(`  ${x}`);
  } else console.log(e ? "OK — 구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다" : solve ? "OK — 숫자가 든 글이 없고, 풀이 칸의 규칙이 맞다" : "OK — 숫자가 든 글이 없다");
  return errors;
}

const rootsOf = (e: EpisodeData) => ({
  COPY: e.copy,
  SOLVE: e.solve,
  SERIES: e.series,
  CONCEPTS: Object.fromEntries(Object.values(e.concepts).map((c) => [c.id, { name: c.name, short: c.short, body: c.body, use: c.use }])),
  READERS: Object.fromEntries(Object.values(e.readers).map((r) => [r.id, { label: r.label }])),
  MAP: { ghosts: e.map.ghosts.map((g) => g.name) },
  LAYER: e.layerLabels,
  SHORT: e.short,
});

for (const e of EPISODES) check(`${e.series.name} · ${e.copy.cover.episode.t} (${e.id})`, e, rootsOf(e), e.solve);
check("조용히 견본 — 실제 사건 아님 (episodes/quiet-sample)", null, { QUIET_SAMPLE }, { entry: QUIET_SAMPLE.entry, lab: null, plain: QUIET_SAMPLE.plain });
check("공통 화면 글 (kit/chrome.ts)", null, { CHROME });

// ─────────────────────────────────────────────────────────── 일부러 망가뜨린 견본 — 규칙이 정말 FAIL 을 내는가
// 금리 2화의 풀이 칸을 한 군데씩 망가뜨려 돌린다. 기대한 규칙의 FAIL 이 나와야 한다. 안 나오면 그것이 FAIL 이다.
{
  const fomc = EPISODES.find((e) => e.id === "fomc")!;
  const broken: [string, string, (s: any) => void][] = [
    ["E6", "자리에 앉기를 정당 표결에 (D61 ③)", (s) => (s.lab.frames[1].ground.split = "party-vote")],
    ["E6", "자리의 수가 표결 기록에 없다 (10 → 9)", (s) => (s.lab.frames[1].sides[0].count = 9)],
    ["E6", "한쪽이 한 말에 근거 구절이 없다", (s) => delete s.lab.frames[1].sides[1].said.src],
    ["E3", "사람이 숨진 사건인데 체험이 있다 (D61 ④)", (s) => (s.entry.death = true)],
    ["E3", "사람이 숨진 사건인데 기본 풀이가 세 칸이다 (D61 ④)", (s) => ((s.entry.death = true), (s.lab = null), (s.plain.why = "death"))],
    ["E2", "체험이 없는데 까닭이 demo 다", (s) => (s.lab = null)],
    ["E4", "뒤집기가 없는데 틀을 골랐다", (s) => (s.entry.flip = null)],
    ["E7", "고리가 다 닿았다 — 멈춘 자리가 없다", (s) => (s.lab.frames[0].nodes[2] = { id: "infl", name: "물가", reach: "full", idle: "그대로", after: "내렸어요" })],
    ["E5", "서지 않는 조합 — 켜고 끄기를 고리 뒤에 이었다", (s) => (s.lab.frames[1] = { kind: "toggle", picture: { id: "x" } })],
    ["E9", "서로 다르게 말하는 것이 한쪽뿐이다", (s) => s.plain.differ.pop()],
    ["B", "기본 풀이 글에 근거 없는 숫자 (지어낸 7명)", (s) => (s.plain.known[1].t = "표결은 10 대 2였어요. 반대한 둘 말고도 7명이 망설였어요.")],
    ["D", "기본 풀이 글이 이 회차에 없는 구절을 가리킨다", (s) => (s.plain.unknown[2].src = ["없는.구절"])],
  ];
  console.log(`\n■ 일부러 망가뜨린 견본 ${broken.length} — FAIL 이 나와야 정상`);
  for (const [rule, what, mutate] of broken) {
    const e = structuredClone(fomc) as EpisodeData;
    mutate(e.solve);
    const errors = check("", e, rootsOf(e), e.solve, true).filter((x) => x.startsWith(`${rule} `));
    if (errors.length) console.log(`  FAIL 남 (정상) — ${what}\n      ${errors[0]}`);
    else {
      failed++;
      console.log(`  FAIL 안 남 (잘못) — ${what}: ${rule} 규칙이 잡지 못했다`);
    }
  }
}

if (failed) {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
console.log("\nOK — 두 회차 · 조용히 견본 · 공통 글 · 망가뜨린 견본은 전부 FAIL 을 냈다");
