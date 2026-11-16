// L-1 — 로컬 세션이 쓴 판 (사건 폴더의 local/<code>/)의 검사 **한 명령**. 스킬 「오늘 이야기 만들기」 (.claude/skills/today-story) 의 ⑥.
//   pnpm --filter @claro/web story:check <사건>/<code>          예: story:check MOTIR-20261113-OIL-PRICE-CAP/oil-1
//   (local/<code>/ 가 없으면 파이프라인이 낸 짧은 이야기 shorts/<code>/ 를 본다 — 읽기만)
// 막는 것 (FAIL · exit 1)
//   계약   긴 = validateEpisode · 짧은 = validateShortStory — 저장된 문서 (그 사건의 store.documents.json · 권리가 git 을 허락한 것만)를 읽어 구절 대조 · 숫자 근거까지
//   S8     화면 칸 (screen.json — 꼴은 catalog.screenOf · 규칙은 episode/screen-check.ts — 실제 화면의 검사 lab/episode/check.ts S8 과 **같은 함수**)
//   R1     깨는 구절 (meta.json breakers · 깨는 말 ban)이 **풀이 전**의 글 · 도구 카드 · 그 글의 근거에 없다 (법 5 · D112) · 풀이 뒤에는 있다
//   R5     화면 — 체험 틀을 세울 부품이 있다 · 그림 부품이 있다 · 지도의 자리가 도구와 맞다
//   M      meta.json 의 꼴 — 깨는 구절 키가 이 이야기에 있다 · line (목록에 적을 값)의 날 · 꼬리표 · 카테고리
// 알리는 것 (경고 — 사람이 보고 정한다 · exit 0)
//   W1 한글로 쓴 수가 남았나 (법 8 — 말의 셈이면 둔다)   W2 뉴스 한 줄이 폰 한 줄에 드나 (어림 — 실제는 story:shots 가 잰다)   W3 큰 제목이 두 줄 안 · 줄마다 13자 안팎인가
//   W4 1화의 처음 온 독자 조립에 "지금까지의 이야기"가 있나 (법 4)   W5 화면 글에 만드는 쪽 말 (모델 · 파이프라인 · 비용)이 있나   W6 meta.json · README.md 가 없나
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 · 쉽게 읽히나 (사람 — 폰에서) · 그림
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateEpisode, validateShortStory, type Episode, type ShortStory } from "@claro/contract";
import { LONGS, screenOf } from "../src/episode/catalog";
import { isPages, isSteps, isToggle } from "../src/episode/kit/frames/LabCard";
import { PICTURES } from "../src/episode/kit/frames/pictures";
import type { ScreenSlots } from "../src/episode/kit/types";
import { screenProblems, type StoredDocument } from "../src/episode/screen-check";
import { readLocal, type LocalMeta } from "../src/app/lab/local/files";

// CLARO_STORY_ROOT — 검사 자체를 시험할 때만 (망가뜨린 사본을 저장소 밖에 두고 돌린다 · logs/pipeline/L-1.md ④). 평소에는 이 저장소
const REPO = process.env.CLARO_STORY_ROOT ?? path.join(import.meta.dirname, "../../..");
const args = process.argv.slice(2);
const [event, code] = args.length === 1 ? args[0]!.split("/") : args;
if (!event || !code || args.length > 2) {
  console.log("쓰는 법: pnpm --filter @claro/web story:check <사건>/<code>");
  process.exit(2);
}
const story = readLocal(REPO, event, code);
if (!story) {
  console.log(`FAIL — 이야기가 없다: packages/pipeline/data/events/${event}/local/${code}/ (episode.json 또는 story.json)`);
  process.exit(1);
}

const errors: string[] = [];
const warns: string[] = [];
const documents: StoredDocument[] = story.store ? (JSON.parse(readFileSync(path.join(REPO, story.store), "utf8")) as { source_documents: StoredDocument[] }).source_documents : [];
const meta: LocalMeta = story.meta ?? {};
console.log(`■ ${story.kind === "long" ? "긴 이야기" : "짧은 이야기"} · ${story.dir}${story.from === "shorts" ? " (파이프라인이 낸 판 — 읽기만)" : ""}`);
console.log(`저장된 문서 ${documents.length} 편 (${story.store ?? "store.documents.json 없음"})`);

// ─────────────────────────────────────────────────────────── 계약
interface Item {
  where: string;
  text: string;
  src: readonly string[];
}
/** 풀이 **전**에 독자가 볼 수 있는 글 — 깨는 구절을 여기서 찾는다 */
const pre: Item[] = [];
const put = (where: string, v: unknown) => {
  if (typeof v === "string") pre.push({ where, text: v, src: [] });
  else if (v && typeof v === "object" && "t" in v) pre.push({ where, text: String((v as { t: string }).t), src: (v as { src?: string[] }).src ?? [] });
};
let quotes: Record<string, { quote: string }> = {};
let slots: ScreenSlots | undefined;
/** 풀이 뒤에 깨는 사실을 보이는 자리의 구절 키 */
let post: string[] = [];
let hasFlip = false;
let title = "";

if (story.kind === "long") {
  const r = validateEpisode(story.file, { documents });
  if (!r.ok) fail(r.errors.map((x) => `${x.code} ${x.path}: ${x.message}`));
  const e: Episode = r.episode;
  const { stats } = r;
  quotes = e.quotes;
  title = e.scenes.cover.title;
  hasFlip = Boolean(e.solve.entry.flip);
  console.log(`계약 OK — ${e.series.name} ${e.number}화 (${e.code} · 판 ${e.episode_version}) · 구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits} · 도구 ${stats.tools} (라이브러리 ${stats.tools_from_library})`);
  for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}: ${w.message}`);

  // S8 화면 칸
  if (story.screen) {
    try {
      slots = screenOf(story.screen);
    } catch (x) {
      errors.push(`S8 ${(x as Error).message}`);
    }
    if (slots) {
      const s = screenProblems(e, slots, documents, story.code);
      errors.push(...s.errors);
      console.log(`S8 화면 칸: ${s.said.join(" / ") || "빈 파일"}`);
    }
  } else console.log("S8 화면 칸: screen.json 없음 — 뉴스 한 줄 · 가림 · 터짐 없이 선다");
  if (!slots?.news) warns.push("W2 뉴스 한 줄 (screen.json news)이 없다 — 법 3: 제목 위 한 줄은 늘 둔다 (첫 화면 카드에도 선다)");

  // R1 풀이 전의 글 — 처음 온 독자의 조립에서 풀이 장면 (aha) 앞 + 풀이 장면의 체험을 누르기 전
  const sc = e.scenes;
  const order = e.assembly.new;
  const before = order.slice(0, Math.max(0, order.indexOf("aha")));
  if (before.includes("cover")) {
    put("표지 제목 위 한 줄", slots?.news);
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
    const t = e.tools.find((x) => x.key === k);
    if (!t) continue;
    put(`도구 ${k} 이름`, t.name);
    put(`도구 ${k} short`, t.short);
    t.body.forEach((b, i) => put(`도구 ${k} body[${i}]`, b));
    put(`도구 ${k} use`, t.use);
  }
  const lab = e.solve.lab;
  if (lab) {
    put("풀이 머리", lab.title);
    lab.setup.forEach((s, i) => put(`풀이 준비 글[${i}]`, s));
    for (const f of lab.frames) {
      if (f.kind !== "chain") continue;
      for (const n of f.nodes) {
        put(`사슬 ${n.id} 이름`, n.name);
        // 가림 (veil)이 없으면 멈춘 고리의 꼬리표 (still)가 처음부터 보인다 (D112 ②)
        if (n.reach === "none") put(`사슬 ${n.id} 누르기 전${slots?.veil?.[n.id] ? " (가림)" : " (가림 없음 — 꼬리표가 처음부터 보인다)"}`, slots?.veil?.[n.id] ?? n.still);
        else put(`사슬 ${n.id} 누르기 전`, n.idle);
      }
      put("사슬 누르기 전 캡션", f.caption.before);
      put("사슬 단추", f.action);
    }
  }
  post = [...(slots?.burst?.quote.src ?? []), ...(e.solve.entry.breaker.src ?? [])];

  // R5 화면 쪽
  for (const f of lab?.frames ?? []) if (f.kind === "toggle" && !PICTURES[f.picture.id]) errors.push(`R5 그림 부품 "${f.picture.id}" 가 kit/frames/pictures.ts 에 없다 — 켜고 끄기 틀은 그림이 코드다 (새 그림은 화면 일 · PM 에게)`);
  if (lab && !isToggle(lab.frames) && !isSteps(lab.frames) && !isPages(lab.frames)) errors.push(`R5 틀의 조합 [${lab.frames.map((f) => f.kind).join(", ")}] 을 세울 화면 부품이 없다`);
  for (const t of e.tools) if (!e.map.at[t.key]) errors.push(`R5 개념 지도에 도구 ${t.key} 의 자리가 없다`);
  for (const k of Object.keys(e.map.at)) if (!e.tools.some((t) => t.key === k)) errors.push(`R5 개념 지도의 ${k} 가 도구에 없다`);
  console.log(`R5 조립 (처음 온 독자) ${order.join(" → ")} · 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 뒤집기 ${hasFlip ? "있음" : "없음"} · 도구 ${e.tools.map((t) => t.key).join(" · ")}`);
  if (e.number === 1 && order.includes("zero")) warns.push('W4 1화인데 처음 온 독자의 조립에 "지금까지의 이야기" (zero)가 있다 — 법 4: 1화는 오늘의 일과 물음으로 시작한다');
  const same = LONGS.filter((x) => x.ep.series.code === e.series.code);
  console.log(`목록 (catalog): ${same.length ? `시리즈 ${e.series.code} 의 긴 이야기 ${same.map((x) => `${x.ep.number}화`).join(" · ")} — 그 그림을 쓴다` : `시리즈 ${e.series.code} 는 새 시리즈 — 기본 그림 (PlainLook)`}${same.some((x) => x.ep.number === e.number) ? ` · ${e.number}화는 이미 목록에 있다 (갈아 끼우기)` : ""}`);
} else {
  const r = validateShortStory(story.file, { documents, episodes: LONGS.map((x) => x.ep) });
  if (!r.ok) fail(r.errors.map((x) => `${x.code} ${x.path}: ${x.message}`));
  const s: ShortStory = r.story;
  quotes = s.quotes;
  title = s.scenes.cover.title;
  hasFlip = Boolean(s.solve.entry.flip);
  console.log(`계약 OK — ${s.series.name} · 짧은 이야기 (${s.code} · 판 ${s.episode_version}) · ${Object.entries(r.stats).map(([k, v]) => `${k} ${Array.isArray(v) ? v.length : v}`).join(" · ")}`);
  for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}: ${w.message}`);
  console.log("S8 화면 칸: 짧은 이야기에는 없다 (옛 꼴 — 장면 넷)");
  // 풀이 전 = 표지 · 무슨 일인가 (문서가 말한 것 앞)
  const c = s.scenes;
  put("표지 제목", c.cover.title);
  put("표지 dek", c.cover.dek);
  put("표지 meta", c.cover.meta);
  put("표지 hint", c.cover.hint);
  put("표지 단추", c.cover.ask);
  put("무슨 일 kicker", c.where.kicker);
  c.where.body.forEach((b, i) => put(`무슨 일 body[${i}]`, b));
  put("무슨 일 unknown", c.where.unknown);
  put("무슨 일 단추", c.where.ask);
  post = [...(s.solve.entry.breaker.src ?? [])];
}

// ─────────────────────────────────────────────────────────── M · R1 — meta.json
const PLACES = ["국내", "해외"];
const CATEGORIES = ["돈", "나라와 법", "기술", "생활", "과학과 몸"];
if (!story.meta) {
  if (story.from === "local") warns.push("W6 meta.json 이 없다 — 깨는 구절 키 (breakers) · 목록에 적을 값 (line)을 적는다");
} else {
  for (const k of Object.keys(story.meta)) if (!["_what", "breakers", "ban", "line"].includes(k)) errors.push(`M meta.json: 모르는 칸 "${k}"`);
  const l = meta.line;
  if (!l) warns.push("W6 meta.json 에 line 이 없다 — 올릴 때 목록에 적을 값 (day · place · category · unpromised)");
  else {
    if (l.day !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(l.day)) errors.push(`M meta.json line.day "${l.day}" 가 YYYY-MM-DD 가 아니다`);
    if (!l.place || !PLACES.includes(l.place)) errors.push(`M meta.json line.place "${l.place}" 가 ${PLACES.join(" / ")} 가 아니다`);
    if (!l.category || !CATEGORIES.includes(l.category)) errors.push(`M meta.json line.category "${l.category}" 가 ${CATEGORIES.join(" / ")} 가 아니다`);
    if (l.unpromised !== undefined && typeof l.unpromised !== "boolean") errors.push("M meta.json line.unpromised 가 참 · 거짓이 아니다");
    console.log(`M 목록에 적을 값: day ${l.day ?? "(없음 — 올리는 날 적는다)"} · ${l.place} · ${l.category}${story.kind === "long" ? ` · unpromised ${l.unpromised === true}` : ""}`);
  }
}
const breakers = meta.breakers;
if (breakers === undefined) {
  if (hasFlip && story.kind === "long" && story.from === "local") errors.push("R1 뒤집기가 있는 긴 이야기인데 meta.json 에 breakers (깨는 구절 키)가 없다 — 법 5: 쓰기 전에 적어 둔다");
  else console.log(`R1 깨는 구절: 적어 둔 키가 없다 — 건너뜀 (${story.kind === "short" ? "짧은 이야기 — 적으면 본다" : hasFlip ? "파이프라인 판" : "뒤집기 없는 이야기"})`);
} else {
  for (const k of breakers) if (!(k in quotes)) errors.push(`M meta.json breakers: 구절 ${k} 가 이 이야기에 없다`);
  let ban: RegExp | null = null;
  try {
    ban = meta.ban?.length ? new RegExp(meta.ban.map((x) => `(?:${x})`).join("|")) : null;
  } catch (x) {
    errors.push(`M meta.json ban: 정규식이 아니다 — ${(x as Error).message}`);
  }
  for (const it of pre) {
    for (const k of it.src) {
      if (breakers.includes(k)) errors.push(`R1 ${it.where}: 깨는 사실의 구절 ${k} 에 기댄다 (근거 시트에 답이 뜬다)`);
      const q = quotes[k]?.quote ?? "";
      if (ban?.test(q)) errors.push(`R1 ${it.where}: 기대는 구절 ${k} 안에 깨는 말이 있다 — "${q.slice(0, 40)}…"`);
    }
    if (ban?.test(it.text)) errors.push(`R1 ${it.where}: 글에 깨는 말이 있다 — "${it.text.slice(0, 50)}…"`);
  }
  if (breakers.length && !post.some((k) => breakers.includes(k))) errors.push("R1 풀이 뒤 (burst · breaker)에 깨는 사실의 구절이 없다 — 뒤집기가 서지 않는다");
  console.log(`R1 풀이 전의 글 ${pre.length} 덩이 (기대는 구절 ${new Set(pre.flatMap((x) => x.src)).size}) — 깨는 구절 ${breakers.join(" · ") || "(빈 목록)"}${meta.ban?.length ? ` · 깨는 말 ${meta.ban.length}` : ""} 을 찾았다`);
}

// ─────────────────────────────────────────────────────────── 경고
/** 독자가 읽는 글 전부 (장면 · 도구 · 풀이 · 문서 이름 · 화면 칸) — 근거 키 · 계산 · 그리지 않을 것 · 구절은 뺀다 */
const SKIP = new Set(["src", "calc", "not_drawn", "voice", "quotes", "_source", "event_ref", "map", "assembly", "pickup"]);
const read: { at: string; text: string }[] = [];
const walk = (at: string, v: unknown) => {
  if (typeof v === "string") {
    if (/[가-힣]/.test(v)) read.push({ at, text: v });
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(`${at}[${i}]`, x));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) walk(at ? `${at}.${k}` : k, x);
};
walk("", story.file);
walk("screen", story.screen);
// W1 한글로 쓴 수 — 셈 낱말 (두 ~ 쉰 + 단위) · 한자말 수 (십 · 백 · 천 … + 단위 · 숫자 뒤의 "500만 원" 꼴은 뺀다) · 달 이름
const HANGUL_NUM = [
  /(?<![가-힣])(두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두|열세|열네|열다섯|스무|스물|서른|마흔|쉰)\s?(번째|번|차례|가지|개|명|곳|달|주|해|배|건|편|쪽|살|시간|차)/g,
  /(?<![\d,.가-힣])[일이삼사오육칠팔구]?[십백천만억조]+\s?(원|년|차|주|명|개|퍼센트|달러|유로|불|번째|리터|배럴)/g,
  /(?<![가-힣])(일월|삼월|사월|오월|유월|칠월|팔월|구월|시월|십일월|십이월)/g,
  /(?<![가-힣\d])[삼사오육칠팔구]\s(주|차|년|원|번째)/g,
];
const hits = read.flatMap(({ at, text }) => HANGUL_NUM.flatMap((re) => [...text.matchAll(re)].map((m) => `${at}: "${m[0]}"`)));
if (hits.length) warns.push(`W1 한글로 쓴 수일 수 있는 곳 ${hits.length} — 문서의 수면 아라비아 숫자로 (법 8 · 말의 셈이면 둔다):\n      ${hits.slice(0, 12).join("\n      ")}${hits.length > 12 ? `\n      … 그 밖 ${hits.length - 12}` : ""}`);
// W2 뉴스 한 줄 — 표지에서 글 폭 ≈ 303px (칸 346 − 띠 안쪽 여백 · 점) · 17px 굵은 글: 한글 ≈ 14.4px · 숫자 · 로마자 ≈ 9.6px · 빈칸 · 쉼표 ≈ 4px (F-E7 의 잰 값에서 어림)
if (slots?.news) {
  const px = [...slots.news.t.replace(/\*\*/g, "")].reduce((n, ch) => n + (/[가-힣]/.test(ch) ? 14.4 : /[\s,.·'"‘’“”]/.test(ch) ? 4 : 9.6), 0);
  console.log(`W2 뉴스 한 줄 "${slots.news.t}" — 어림 ${Math.round(px)}px / 표지 한 줄 303px`);
  if (px > 303) warns.push(`W2 뉴스 한 줄이 폰 표지에서 두 줄로 꺾일 수 있다 (어림 ${Math.round(px)}px > 303px) — 줄이거나, story:shots 가 잰 줄 수를 본다`);
}
// W3 큰 제목 — 폰에서 두 줄 안 · 줄마다 13자 안팎 (법 3)
{
  const lines = title.split("\n");
  if (lines.length > 2) warns.push(`W3 큰 제목이 ${lines.length} 줄이다 — 법 3: 폰에서 두 줄 안`);
  for (const l of lines) if ([...l].length > 15) warns.push(`W3 큰 제목의 한 줄이 ${[...l].length}자다 ("${l}") — 줄마다 13자 안팎 · 폰에서 꺾이는지 그림으로 본다`);
}
// W5 만드는 쪽 말
for (const w of ["파이프라인", "모델", "Sonnet", "Fable", "Opus", "비용", "달러", "API"]) {
  const at = read.filter((x) => x.text.includes(w)).map((x) => x.at);
  if (at.length) warns.push(`W5 독자 글에 "${w}" 가 있다 (${at.slice(0, 3).join(" · ")}) — 이야기의 말이면 둔다 · 만드는 쪽 말이면 뺀다`);
}
if (story.from === "local" && !existsSync(path.join(REPO, story.dir, "README.md"))) warns.push("W6 README.md 가 없다 — 누가 · 어떻게 쓴 판인지 한 장 (local/oil-1/README.md 를 본다)");
console.log(`길이 — 독자가 읽는 글 ${read.reduce((n, x) => n + [...x.text].length, 0)}자 (${read.length} 덩이 · 문서 이름 · 화면 칸 넣고 · 구절 · 근거 빼고) — 메우기 앞 · 뒤를 이 수로 견준다`);

for (const w of warns) console.log(`경고 ${w}`);
if (errors.length) fail(errors);
console.log(`\nOK — ${story.code}: 계약 (구절 · 숫자)${story.kind === "long" ? " · 화면 칸" : ""}${breakers ? " · 풀이 전에 깨는 구절 없음" : ""} · 경고 ${warns.length}. 맛 (쉽게 읽히나 · 답이 먼저 보이지 않나)은 폰에서 사람이 본다`);

function fail(list: string[]): never {
  console.log(`\nFAIL ${list.length}`);
  for (const x of list) console.log(`  ${x}`);
  process.exit(1);
}
