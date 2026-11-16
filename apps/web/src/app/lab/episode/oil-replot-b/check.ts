// UX-10b — 「기름값 다시 짠 1화」 (둘째 판 · 손으로)의 검사. ../check.ts (세 회차 · 견본) 는 따로 돈다.
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/oil-replot-b/check.ts
// 보는 것
//   계약   episode.json 이 계약 검증을 지난다 — 저장된 문서 (store.documents.json)를 읽어 구절 대조 · 숫자 근거 (불변식 8 ~)
//   R1     풀이 전의 글에 깨는 사실이 없다 (법 5 · D112) — 처음 온 독자가 풀이 장면의 체험을 누르기 전에 볼 수 있는 글 전부 (표지 · 사건 · 도구 카드 · 개념 지도의 도구 · 체험 앞 · 단추 · 제목 위 한 줄)
//          와 그 글이 기대는 구절 (근거 시트가 구절을 보인다)에 깨는 사실의 구절 · 말이 없다
//   R2     1화의 처음 온 독자 조립에 "지금까지의 이야기" (zero)가 없다 (법 4)
//   R3     실제 화면 (Screen · catalog)이 이 시안 폴더를 읽지 않는다 — F-E6 부터 실제 /s/oil/1 은 메운 판을 제 자리 (events/…/local/oil-1/ — 회차 파일 + 화면 칸 screen.json)에서 읽는다. 화면 칸 (옛 이름 replot)은 실제 화면도 쓴다 (../check.ts S8 이 본다)
//   R4     시안 전용 글 (맨 위 띠 · 풀이 뒤 문장)이 구절에서 온다 · 숫자 없음 · 모델 · 파이프라인 · 비용 말 없음
//   R5     화면 쪽 — 틀의 조합을 세울 부품이 있다 · 가림 (veil)이 멈춘 고리를 가리킨다 · 개념 지도의 자리가 도구와 맞다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람) · 술술 읽히나 (폰에서 사람)
import { readFileSync } from "node:fs";
import path from "node:path";
import { validateEpisode, type Episode } from "@claro/contract";
import { isSteps } from "../../../../episode/kit/frames/LabCard";
import { BOX, BREAKER_KEYS, COPY, EPISODE_FILE, REPLOT, STORE } from "./data";

const REPO = path.join(import.meta.dirname, "../../../../../../..");
const read = (f: string) => readFileSync(path.join(REPO, f), "utf8");
console.log("■ 기름값 · 다시 짠 1화 (oil-replot-b · 둘째 판)");

const errors: string[] = [];
const built = JSON.parse(read(EPISODE_FILE));
const documents = (JSON.parse(read(STORE)) as { source_documents: { source_id: string; text: string }[] }).source_documents;
const r = validateEpisode(built, { documents });
if (!r.ok) {
  console.log(`FAIL ${r.errors.length}`);
  for (const x of r.errors) console.log(`  ${x.code} ${x.path}: ${x.message}`);
  process.exit(1);
}
const e: Episode = r.episode;
const { stats } = r;
console.log(`계약 OK — 구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits} · 도구 ${stats.tools} (라이브러리 ${stats.tools_from_library})`);
for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}: ${w.message}`);

// ── R1 풀이 전의 글
interface Item {
  where: string;
  text: string;
  src: readonly string[];
}
const pre: Item[] = [];
const put = (where: string, v: unknown) => {
  if (typeof v === "string") pre.push({ where, text: v, src: [] });
  else if (v && typeof v === "object" && "t" in v) pre.push({ where, text: String((v as { t: string }).t), src: (v as { src?: string[] }).src ?? [] });
};
const sc = e.scenes;
const order = e.assembly.new;
const before = order.slice(0, order.indexOf("aha"));
if (before.includes("cover")) {
  put("표지 제목 위 한 줄", REPLOT.news);
  put("표지 제목", sc.cover.title);
  put("표지 dek", sc.cover.dek);
  put("표지 meta", sc.cover.meta);
  put("표지 new_hint", sc.cover.new_hint);
  put("표지 단추", sc.cover.ask_new);
}
if (before.includes("zero")) {
  put("지금까지 제목", sc.zero.title);
  for (const b of sc.zero.beats) (put("지금까지 head", b.head), put("지금까지 body", b.body));
}
if (before.includes("event")) {
  const c = sc.event;
  put("사건 제목", c.title);
  put("사건 lead", c.lead);
  for (const f of c.figures) (put("사건 큰 글자 who", f.who), put("사건 큰 글자", f.amount), put("사건 큰 글자 꼬리표", f.tag));
  put("사건 figure_note", c.figure_note);
  put("사건 인용 머리", c.quote_label);
  put("사건 인용 칸", c.quote);
  put("사건 인용 설명", c.quote_note);
  for (const x of c.riddle) put("사건 riddle", x);
  put("사건 단추", c.ask);
}
if (before.includes("tools")) {
  const c = sc.tools;
  put("도구 장면 제목", c.title_new);
  put("도구 장면 sub", c.sub_new);
  put("도구 장면 단추", c.ask);
}
// 도구 카드 · 개념 지도 — 풀이 전에 줍는 도구 (pickup.tools). 풀이에서 생기는 도구 (pickup.aha)는 풀이 뒤다
for (const k of e.pickup.tools) {
  const t = e.tools.find((x) => x.key === k)!;
  put(`도구 ${k} 이름`, t.name);
  put(`도구 ${k} short`, t.short);
  t.body.forEach((b, i) => put(`도구 ${k} body[${i}]`, b));
  put(`도구 ${k} use`, t.use);
}
// 풀이 장면 — 체험을 누르기 전 (머리 · 준비 글 · 사슬의 고리 · 가림 · 누르기 전 캡션 · 단추 이름)
if (e.solve.lab) {
  const lab = e.solve.lab;
  put("풀이 머리", lab.title);
  lab.setup.forEach((s, i) => put(`풀이 준비 글[${i}]`, s));
  for (const f of lab.frames) {
    if (f.kind !== "chain") continue;
    for (const n of f.nodes) {
      put(`사슬 ${n.id} 이름`, n.name);
      if (n.reach === "none") put(`사슬 ${n.id} 누르기 전 (가림)`, REPLOT.veil?.[n.id] ?? n.still); // 가림이 없으면 꼬리표가 처음부터 보인다
      else put(`사슬 ${n.id} 누르기 전`, n.idle);
    }
    put("사슬 누르기 전 캡션", f.caption.before);
    put("사슬 단추", f.action);
  }
}
// 단추의 물음 — 풀이 → 이어짐 (풀이 장면의 끝에 있다 · 체험 뒤)
const BAN = /적용 대상에서 (제외|뺀)|공급가격[^.。]*(상한|기준|대상|묶|걸|천장)|(상한|최고가격|최고액|천장)[^.。]*공급가격/;
let scanned = 0;
for (const it of pre) {
  scanned++;
  for (const k of it.src) {
    if ((BREAKER_KEYS as readonly string[]).includes(k)) errors.push(`R1 ${it.where}: 깨는 사실의 구절 ${k} 에 기댄다 (근거 시트에 답이 뜬다)`);
    const q = e.quotes[k]?.quote ?? "";
    if (BAN.test(q)) errors.push(`R1 ${it.where}: 기대는 구절 ${k} 안에 깨는 말이 있다 — "${q.slice(0, 40)}…"`);
  }
  if (BAN.test(it.text)) errors.push(`R1 ${it.where}: 글에 깨는 말이 있다 — "${it.text.slice(0, 50)}…"`);
}
console.log(`R1 풀이 전의 글 ${scanned} 덩이 (구절 ${new Set(pre.flatMap((x) => x.src)).size}) — 깨는 사실의 구절 ${BREAKER_KEYS.join(" · ")} · 깨는 말 없음 검사`);
// 풀이 뒤에는 깨는 사실이 *있어야* 한다 (뒤집기가 서려면) — 체험 뒤 문장 · 풀이문
const postHas = [REPLOT.burst?.quote.src ?? [], e.solve.entry.breaker.src ?? []].flat().some((k) => (BREAKER_KEYS as readonly string[]).includes(k));
if (!postHas) errors.push("R1 풀이 뒤 (burst · breaker)에 깨는 사실의 구절이 없다 — 뒤집기가 서지 않는다");

// ── R2 1화의 처음 온 독자 조립
if (e.assembly.new.includes("zero")) errors.push('R2 처음 온 독자의 조립에 "지금까지의 이야기" (zero)가 있다 — 1화는 오늘의 일과 물음으로 시작한다 (법 4)');
if (e.assembly.new[0] !== "cover" || e.assembly.new[1] !== "event") errors.push("R2 표지 다음이 오늘의 사건이 아니다");
console.log(`R2 처음 온 독자 조립 = ${e.assembly.new.join(" → ")}`);

// ── R3 실제 화면이 이 시안 폴더를 읽지 않는다
const realFiles = ["apps/web/src/episode/Screen.tsx", "apps/web/src/episode/catalog.tsx", "apps/web/src/app/s/[series]/[n]/page.tsx"];
for (const f of realFiles) {
  let text = "";
  try {
    text = read(f);
  } catch {
    continue;
  }
  if (/oil-replot/.test(text)) errors.push(`R3 ${f}: 실제 화면이 기름값 시안 폴더를 읽는다`);
}
const catalog = read("apps/web/src/episode/catalog.tsx");
if (catalog.includes("oil-replot-b")) errors.push("R3 catalog.tsx 가 이 판을 안다 — 실제 주소에 나가면 안 된다");
console.log(`R3 실제 화면 파일 (${realFiles.join(" · ")})이 기름값 시안 폴더를 읽지 않는다 · 이 판은 lab 주소 하나에만 선다`);

// ── R4 시안 전용 글
const flat = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : v && typeof v === "object" ? Object.values(v).flatMap(flat) : []);
// 밝혀 둔 예외: COPY.to (주소 /s/oil/1) — 글이 아니라 길이다
for (const s of flat([COPY.tag, COPY.compare])) if (/\d/.test(s)) errors.push(`R4 맨 위 띠 글에 숫자가 있다 — "${s}"`);
const burst = REPLOT.burst;
if (!burst) errors.push("R4 burst 가 없다");
else {
  const norm = (s: string) => s.replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
  const joined = (burst.quote.src ?? []).map((k) => e.quotes[k]!.quote).join(" ");
  if (norm(burst.quote.t) !== norm(joined)) errors.push(`R4 burst 문장이 구절과 다르다 — "${norm(burst.quote.t)}" ≠ "${norm(joined)}"`);
  for (const s of [burst.label, burst.note]) if (/\d/.test(s)) errors.push(`R4 burst 글에 숫자가 있다 — "${s}"`);
}
if (REPLOT.news && /\d/.test(REPLOT.news.t)) errors.push("R4 제목 위 한 줄에 숫자가 있다");
const visible = JSON.stringify({ ...built, _source: undefined, solve: { ...built.solve, entry: { ...built.solve.entry, not_drawn: undefined } } });
for (const w of ["파이프라인", "모델", "Sonnet", "Fable", "Opus", "비용", "달러", "API"]) if (visible.includes(w) || flat(COPY).some((s) => s.includes(w))) errors.push(`R4 화면 글에 "${w}" 가 있다`);
console.log(`R4 시안 전용 글 — 띠 ${flat(COPY).length}줄 · 제목 위 한 줄 · burst 문장 = 구절 ${(burst?.quote.src ?? []).join("+")} · 상자 ${BOX ? "남김" : "없음"}`);

// ── R5 화면 쪽
const lab = e.solve.lab;
if (lab && !isSteps(lab.frames)) errors.push(`R5 틀의 조합 [${lab.frames.map((f) => f.kind).join(", ")}] 을 세울 화면 부품이 없다`);
for (const f of lab?.frames ?? []) if (f.kind === "chain") for (const id of Object.keys(REPLOT.veil ?? {})) if (!f.nodes.some((n) => n.id === id && n.reach === "none")) errors.push(`R5 veil 의 고리 ${id} 가 멈춘 고리가 아니다`);
for (const t of e.tools) if (!e.map.at[t.key]) errors.push(`R5 개념 지도에 도구 ${t.key} 의 자리가 없다`);
for (const k of Object.keys(e.map.at)) if (!e.tools.some((t) => t.key === k)) errors.push(`R5 개념 지도의 ${k} 가 도구에 없다`);
console.log(`R5 체험 [${lab?.frames.map((f) => f.kind).join(" → ")}] · 가림 ${Object.keys(REPLOT.veil ?? {}).join(",")} · 지도 도구 ${Object.keys(e.map.at).join(" · ")}`);

if (errors.length) {
  console.log(`FAIL ${errors.length}`);
  for (const x of errors) console.log(`  ${x}`);
  process.exit(1);
}
console.log("OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 실제 화면은 이 시안 폴더를 읽지 않음");
