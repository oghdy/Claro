// UX-8b 짧은 이야기 다시 쓰기 (줄기는 뉴스 · D95)의 검사 — /lab/short 의 check.ts 와 같은 규칙 (L1 ~ L8) + 이 Step 의 것 (N1 ~ N3).
//   pnpm --filter @claro/web exec tsx src/app/lab/short-a/check.ts [--read]     (--read: 통독용으로 글을 차례대로 찍는다)
// 보는 것
//   L1  근거 문서 파일이 **git 에 올라 있는** 파일이다
//   L2  구절이 저장된 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시) · 구절이 가리키는 문서가 있다 · 문서의 source_id 가 저장된 것이다 · "문서의 문장" 칸은 구절 안의 글 그대로다
//   L3  글이 가리키는 구절이 있다 · 안 쓰인 구절이 없다
//   L4  글의 숫자는 근거 구절 안의 수이거나 calc 에 어떻게 냈는지 적힌 수다 (표지의 물음 단추도)
//   L5  그리지 않을 것 — 원인 단정 · 탓하기 · 건강 조언 · 넓히기 · 반사실 · 앞날 · 비만치료제가 글에 없다 (낱말로만 본다. 뜻은 사람이 읽는다)
//   L6  술술 읽히는 꼴 (D91) — 보고서 말투 · 관청 말 · 목록 꼴이 없다 · 물음 단추는 표지의 하나뿐 · 문단은 다섯 문장까지 · 한 문장은 70자까지 · 해요체 (남는 한 줄만 평서문)
//   L7  뼈의 차례 — 첫 생각 → 걸어 보기 (고르기) → 깨는 사실 → 도구 줍기 → 뒤집기 → 내려앉기 → 남는 한 줄. 고르기는 하나 · 어느 쪽을 골라도 같은 수의 문장으로 받는다
//   L8  크기 — 빈칸 뺀 글자 (한쪽 가지만 센다) · 개념 낱말 1 ~ 2
//   N1  **줄기는 뉴스 (D95)** — 표지 (제목 · 한 줄 · 단추) · 뒤집기의 두 말 · 남는 한 줄에 개념 낱말 (퍼센트포인트 · %p · 변화율 · 읽는 법)이 없다
//   N2  **개념은 도구** — 이름을 붙이는 문단 (beat name)은 둘까지 · 표지와 흐름의 첫 다섯 덩이에는 개념 낱말이 없다 (뉴스가 먼저 선다) · 개념 낱말이 든 덩이는 흐름의 절반이 안 된다
//   N3  화면에 싣는 파일 (data · page · layout · css)에 모델 이름 · 다른 견본의 이름이 없다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 · 술술 읽히는가 · **이 이야기가 무엇에 대한 것인가** (사람 — 소리 내어 읽듯 처음부터 끝까지 · D91 · D95)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LIGHT_CHROME } from "../short/data";
import type { T } from "../short/types";
import { ASK_SRC, STORY, STORY_STORES } from "./data";

const REPO = path.join(import.meta.dirname, "../../../../../..");
let failed = 0;
const fail = (code: string, message: string) => {
  failed += 1;
  console.log(`  FAIL ${code} ${message}`);
};
const squash = (s: string) => s.replace(/\s+/g, "");
const S = STORY;

console.log(`■ 짧은 이야기 다시 쓰기 (UX-8b) — ${S.cover.title.t.replace(/\n/g, " ")} (${S.code} · lab 전용 꼴)`);

// L1
for (const f of STORY_STORES) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", f], { cwd: REPO, stdio: "pipe" });
  } catch {
    fail("L1", `문서 파일이 git 에 없다 — ${f}`);
  }
}
const documents = STORY_STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
const textOf = new Map(documents.map((d) => [d.source_id, squash(d.text)]));

// L2
for (const [label, d] of Object.entries(S.docs)) if (!textOf.has(d.source_id)) fail("L2", `문서 ${label} 의 source_id 가 저장된 문서에 없다`);
for (const [key, q] of Object.entries(S.quotes)) {
  const doc = S.docs[q.doc];
  if (!doc) fail("L2", `구절 ${key} 가 없는 문서 ${q.doc} 를 가리킨다`);
  else if (!(textOf.get(doc.source_id) ?? "").includes(squash(q.quote))) fail("L2", `구절 ${key} 가 문서의 글에 없다 — "${q.quote.slice(0, 40)}…"`);
}

// 글을 차례대로 걷는다 — 독자가 읽는 차례 그대로 (가지는 둘 다)
type Item = { where: string; item: T; reader: boolean; branch?: string };
const items: Item[] = [];
const add = (where: string, item: T, more: Partial<Item> = {}) => items.push({ where, item, reader: true, ...more });
add("표지 · 제목", S.cover.title);
add("표지 · 한 줄", S.cover.dek);
add("표지 · 날", S.cover.meta);
S.flow.forEach((b, i) => {
  const at = `흐름 ${i + 1}${b.beat ? ` (${b.beat})` : ""}`;
  if (b.kind === "p") add(at, b.text);
  else if (b.kind === "cite") add(`${at} · 문서의 문장`, b.text);
  else if (b.kind === "flip") {
    add(`${at} · 뒤집기 앞`, b.a);
    add(`${at} · 뒤집기 뒤`, b.b);
    add(`${at} · 뒤집기의 풀이`, b.note);
  } else {
    add(`${at} · 고르기`, b.ask);
    for (const o of b.options) {
      add(`${at} · 단추 ${o.key}`, o.label, { branch: o.key });
      add(`${at} · 받는 말 ${o.key}`, o.reply, { branch: o.key });
    }
  }
});
add("남는 한 줄", S.keep.line);
for (const w of S.keep.words) {
  add(`낱말 ${w.key} · 한 줄`, w.short);
  w.body.forEach((b, i) => add(`낱말 ${w.key} · 풀이 ${i + 1}`, b));
}
add("누구의 말", S.keep.whose);

// L3
const used = new Set<string>();
for (const { where, item } of items)
  for (const k of item.src ?? []) {
    used.add(k);
    if (!S.quotes[k]) fail("L3", `${where}: 없는 구절 ${k}`);
  }
for (const k of Object.keys(S.quotes)) if (!used.has(k)) fail("L3", `안 쓰인 구절 ${k}`);

// L4 — 숫자
const NUM = /\d+(?:[.,]\d+)*/g;
let withDigits = 0;
for (const { where, item } of items) {
  const nums = item.t.match(NUM) ?? [];
  if (!nums.length) continue;
  withDigits += 1;
  const quoted = (item.src ?? []).map((k) => S.quotes[k]?.quote ?? "").join(" ").replace(/\s+/g, " "); // 숫자는 빈칸을 지우지 않고 본다 (표의 수가 서로 붙지 않게)
  const calc = Object.keys(item.calc ?? {});
  for (const n of nums) {
    const inQuote = new RegExp(`(?<![\\d.])${n.replace(".", "\\.")}(?![\\d]|\\.\\d)`).test(quoted);
    const inCalc = calc.some((k) => [...(k.match(NUM) ?? [])].includes(n));
    if (!inQuote && !inCalc) fail("L4", `${where}: 숫자 ${n} 가 근거 구절에도 calc 에도 없다 — "${item.t.slice(0, 50)}…"`);
  }
  for (const k of calc) if (!item.t.includes(k)) fail("L4", `${where}: calc 의 ${k} 가 글에 없다`);
}
{
  const quoted = ASK_SRC.map((k) => S.quotes[k]?.quote ?? "").join(" ");
  for (const n of S.cover.ask.match(NUM) ?? []) if (!new RegExp(`(?<![\\d.])${n.replace(".", "\\.")}(?![\\d]|\\.\\d)`).test(quoted)) fail("L4", `표지의 물음 단추: 숫자 ${n} 가 근거 구절 (${ASK_SRC.join(" ")})에 없다`);
  for (const k of ASK_SRC) used.add(k);
}
for (const [k, v] of Object.entries(LIGHT_CHROME)) if (/\d/.test(v)) fail("L4", `화면 글 ${k} 에 숫자가 있다 — "${v}"`);

// L5 — 그리지 않을 것
const banned: [RegExp, string][] = [
  [/(때문에|탓에|해서|하니까) (비만|살이|늘|올)/, "원인 단정 (왜 올랐나는 문서에 없다)"],
  [/부풀|속였|속인|과장|낚|왜곡/, "제목 · 기관을 탓함"],
  [/빼야|줄여야|하세요|해야 해요|위험해|조심하세요/, "건강 조언 · 겁주기"],
  [/요즘 사람|한국인은|다들|누구나|흔히|늘 그렇/, "넓히기"],
  [/었다면|았다면|였다면|없었으면/, "반사실"],
  [/될 거예요|늘어날|오를 거|앞으로|머지않아|가 되면 더/, "앞날 · 같은 사람들을 따라간 것처럼 말함 (표는 두 해의 같은 나이대를 견준 것뿐이다)"],
  [/요즘 20대|젊은 층이 .*(해서|탓)|배달|야식|운동을 안/, "20대가 왜 늘었나를 문서 밖에서 짐작"],
  [/치료제|다이어트/, "이야기의 줄기 밖"],
];
for (const { where, item } of items) for (const [re, what] of banned) if (re.test(item.t)) fail("L5", `${where}: ${what} — "${item.t}"`);

if (items.some((x) => /가장 많이/.test(x.item.t)) && !S.flow.some((b) => b.kind === "p" && /가장 많이.{0,6}는 이 변화율로 잰 말/.test(b.text.t))) fail("L5", "“가장 많이”를 옮겼는데 그 말의 기준 (변화율)을 흐름이 밝히지 않았다");
// "문서의 문장" 칸은 구절 안의 글 그대로다
for (const b of S.flow) if (b.kind === "cite" && !(b.text.src ?? []).some((k) => squash(S.quotes[k]?.quote ?? "").includes(squash(b.text.t)))) fail("L2", `문서의 문장이 구절의 글 그대로가 아니다 — "${b.text.t}"`);

// L6 — 술술 읽히는 꼴
const report: [RegExp, string][] = [
  [/것으로 나타났|것으로 확인|에 따르면|한편|아울러|또한|이에 |관련하여|바탕으로|실시|추진|예정이다|밝혔다/, "보고서 말투"],
  [/분율|산출|표준화율|조율|인지하고 있는|이환|건강행태|심층 ?분석|연령대별 현황/, "관청 말 그대로"],
  [/첫째|둘째|셋째|①|②|③|\b1\)|\b2\)/, "목록 꼴"],
  [/!|충격|놀랍게도|무려/, "호들갑"],
];
const sentences = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/\n/g, " ")
    .split(/(?<=[.?!”])\s+(?=[^\s])/)
    .map((x) => x.trim())
    .filter(Boolean);
for (const { where, item } of items) {
  if (where.includes("문서의 문장")) continue; // 문서의 글자 그대로다
  for (const [re, what] of report) if (re.test(item.t)) fail("L6", `${where}: ${what} — "${item.t}"`);
  const ss = sentences(item.t);
  if (ss.length > 5) fail("L6", `${where}: 문단이 ${ss.length}문장이다 (다섯까지)`);
  for (const s of ss) if ([...squash(s)].length > 70) fail("L6", `${where}: 한 문장이 ${[...squash(s)].length}자다 (70자까지) — "${s}"`);
}
// 해요체 — 이야기 문단 (남는 한 줄 · 뒤집기의 두 말 · 단추 · 날짜 · 제목은 뺀다)
for (const { where, item } of items) {
  if (/제목|날|뒤집기 앞|뒤집기 뒤|단추|남는 한 줄|문서의 문장/.test(where)) continue;
  for (const s of sentences(item.t)) if (/[가-힣]다\.$/.test(s)) fail("L6", `${where}: 평서문 (“~다.”)이 섞였다 — "${s}"`);
}
if (S.flow.some((b) => (b as { ask?: unknown }).ask && b.kind !== "pick")) fail("L6", "흐름 안에 물음 단추가 있다");

// L7 — 뼈의 차례
// 이 글에서 고르기 (꼴의 beat 는 "try" 로 굳어 있다)는 **첫 생각을 걸어 보는** 자리다 — 첫 생각 바로 뒤 · 깨는 사실 앞
const ORDER = ["first_thought", "try", "breaker", "name", "flip", "land"] as const;
const beats = S.flow.map((b) => b.beat).filter((b): b is (typeof ORDER)[number] => !!b);
for (const b of ORDER) if (!beats.includes(b)) fail("L7", `뼈 ${b} 가 흐름에 없다`);
if (beats.map((b) => ORDER.indexOf(b)).some((v, i, a) => i > 0 && v < a[i - 1]!)) fail("L7", `뼈의 차례가 뒤섞였다 — ${beats.join(" → ")}`);
const picks = S.flow.filter((b) => b.kind === "pick");
if (picks.length > 1) fail("L7", `고르기가 ${picks.length}개다 (체험은 없거나 아주 작게 — 하나까지)`);
for (const p of picks) {
  if (p.kind !== "pick") continue;
  const n = p.options.map((o) => sentences(o.reply.t).length);
  if (new Set(n).size !== 1) fail("L7", `고르기의 받는 말이 가지마다 길이가 다르다 (${n.join(" · ")}문장)`);
  for (const o of p.options) if (!o.reply.src?.length) fail("L7", `받는 말 ${o.key} 에 근거가 없다`);
}
if (S.flow[0]?.kind !== "p" || S.flow[0].beat !== "first_thought") fail("L7", "흐름이 첫 생각으로 시작하지 않는다");
const firstFlip = S.flow.find((b) => b.kind === "flip");
if (!firstFlip || firstFlip.kind !== "flip" || !firstFlip.b.src?.length) fail("L7", "뒤집기의 뒤쪽 말에 근거가 없다");

// L8 — 크기
const firstBranch = picks[0]?.kind === "pick" ? picks[0].options[0]!.key : undefined;
const read = items.filter((x) => !x.branch || x.branch === firstBranch);
const size = (xs: Item[]) => xs.reduce((n, x) => n + [...squash(x.item.t.replace(/\*\*/g, ""))].length, 0);
const chars = size(read.filter((x) => !x.where.startsWith("낱말"))); // 읽는 길 — 표지 · 흐름 (한쪽 가지) · 남는 한 줄 · 누구의 말. 낱말 카드는 접혀 있다 (되새김 — 따로 센다)
const cardChars = size(read.filter((x) => x.where.startsWith("낱말")));
const LONG_FLOOR = 1100; // 파이프라인 짧은 이야기 (면허 정지) 1,071자 · 손 곁 이야기 (병원) 875자 — 그 언저리를 넘지 않는다. 긴 이야기 셋은 이것의 몇 배다
if (chars > LONG_FLOOR) fail("L8", `빈칸 뺀 글자 ${chars} — ${LONG_FLOOR} 을 넘는다`);
if (S.keep.words.length < 1 || S.keep.words.length > 2) fail("L8", `개념 낱말 ${S.keep.words.length} (1 ~ 2)`);
for (const w of S.keep.words) if (!S.flow.some((b) => b.kind === "p" && b.text.t.includes(`**${w.name.replace(/ \(.*\)$/, "")}**`))) fail("L8", `낱말 ${w.name} 이 흐름에서 굵게 이름 붙지 않았다 (이야기가 먼저 가르치고 카드는 되새긴다)`);

// N1 · N2 — 줄기는 뉴스 · 개념은 도구 (D95)
const CONCEPT = /퍼센트포인트|%p|변화율|읽는 법|읽는 방법|자로 재|두 가지 자/;
const flipB = S.flow.find((b) => b.kind === "flip");
const newsOnly: [string, string][] = [
  ["표지 · 제목", S.cover.title.t],
  ["표지 · 한 줄", S.cover.dek.t],
  ["표지 · 물음 단추", S.cover.ask],
  ["남는 한 줄", S.keep.line.t],
  ...(flipB && flipB.kind === "flip" ? ([["뒤집기 앞", flipB.a.t], ["뒤집기 뒤", flipB.b.t]] as [string, string][]) : []),
];
for (const [where, text] of newsOnly) if (CONCEPT.test(text)) fail("N1", `${where}: 개념 낱말이 있다 (여기는 뉴스에 대한 말이어야 한다) — "${text.replace(/\n/g, " ")}"`);
const blockText = (b: (typeof S.flow)[number]) => (b.kind === "p" || b.kind === "cite" ? b.text.t : b.kind === "flip" ? `${b.a.t} ${b.b.t} ${b.note.t}` : `${b.ask.t} ${b.options.map((o) => `${o.label.t} ${o.reply.t}`).join(" ")}`);
const nameBlocks = S.flow.filter((b) => b.beat === "name").length;
if (nameBlocks > 2) fail("N2", `이름 붙이는 문단이 ${nameBlocks}개다 (둘까지 — 개념은 길 위의 도구다)`);
S.flow.slice(0, 5).forEach((b, i) => {
  if (b.kind !== "cite" && CONCEPT.test(blockText(b))) fail("N2", `흐름 ${i + 1}: 뉴스가 서기 전에 개념 낱말이 나온다 — "${blockText(b).slice(0, 40)}…"`);
});
const conceptBlocks = S.flow.filter((b) => b.kind !== "cite" && CONCEPT.test(blockText(b))).length;
if (conceptBlocks * 2 >= S.flow.length) fail("N2", `개념 낱말이 든 덩이가 ${conceptBlocks} / ${S.flow.length} — 절반이 넘는다`);

// N3 — 화면에 싣는 파일에 모델 이름 · 다른 견본의 이름이 없다
const HIDE = /fable|sonnet|소넷|opus|haiku|claude|anthropic|gpt|short-b|UX-8b-B/i;
for (const f of ["data.ts", "page.tsx", "layout.tsx", "short-a.css"]) {
  const lines = readFileSync(path.join(import.meta.dirname, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (HIDE.test(line)) fail("N3", `${f}:${i + 1} — "${line.trim().slice(0, 60)}"`);
  });
}

if (process.argv.includes("--read")) {
  console.log("\n── 통독 (독자가 읽는 차례 · 가지는 둘 다)");
  for (const { where, item } of items) console.log(`- **${where}** ${item.t.replace(/\n/g, " / ")}${item.src?.length ? ` ← ${item.src.join(" ")}` : ""}${item.calc ? ` · calc ${Object.entries(item.calc).map(([k, v]) => `${k} = ${v}`).join(" || ")}` : ""}`);
}

if (!failed) {
  console.log(`  구절 ${Object.keys(S.quotes).length} (문서 ${Object.keys(S.docs).length} — git 의 store.documents.json) · 글 덩이 ${items.length} (한 번 읽을 때 ${read.length}) — 숫자가 든 글 ${withDigits}`);
  console.log(`  빈칸 뺀 글자 ${chars} (읽는 길 — 표지 · 흐름 한쪽 가지 · 한 줄 · 누구의 말) + 접힌 낱말 카드 ${cardChars} · 문단 ${S.flow.filter((b) => b.kind === "p").length} · 고르기 ${picks.length} · 물음 단추 1 (표지) · 낱말 ${S.keep.words.map((w) => w.name).join(" · ")}`);
  console.log(`  뼈: ${beats.join(" → ")} → 남는 한 줄 · 그리지 않을 것 ${S.not_drawn.length}`);
  console.log(`  줄기는 뉴스: 표지 · 뒤집기 · 남는 한 줄에 개념 낱말 0 · 이름 붙이는 문단 ${nameBlocks} · 개념 낱말이 든 덩이 ${conceptBlocks} / ${S.flow.length} · 모델 이름 0`);
  console.log("\nOK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기 · 줄기는 뉴스 (N1 ~ N3)");
} else {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
