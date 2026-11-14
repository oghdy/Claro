// UX-8b-B 짧은 이야기 다시 쓰기의 검사 (UX-8 check.ts 를 옮겨 L9 를 더했다) — lab 전용 꼴 (./types.ts)이라 계약 검증 (validateShortStory)을 쓸 수 없다. 같은 규칙을 여기서 본다.
//   pnpm --filter @claro/web exec tsx src/app/lab/short-b/check.ts [--read]     (--read: 통독용으로 글을 차례대로 찍는다)
// 보는 것
//   L1  근거 문서 파일이 **git 에 올라 있는** 파일이다
//   L2  구절이 저장된 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시 — 계약 불변식 8 과 같은 대조) · 구절이 가리키는 문서가 있다 · 문서의 source_id 가 저장된 것이다
//   L3  글이 가리키는 구절이 있다 · 안 쓰인 구절이 없다
//   L4  글의 숫자는 근거 구절 안의 수이거나 calc 에 어떻게 냈는지 적힌 수다 (계약 불변식 9 · 10 — 여기서는 제목 · 뒤집기 · 단추도 글 덩이라 같이 본다)
//   L5  그리지 않을 것 — 원인 단정 · 탓하기 · 건강 조언 · 넓히기 · 반사실이 글에 없다 (낱말로만 본다. 뜻은 사람이 읽는다)
//   L6  술술 읽히는 꼴 (D91) — 보고서 말투 · 관청 말 · 목록 꼴이 없다 · 물음 단추는 표지의 하나뿐 · 문단은 다섯 문장까지 · 한 문장은 70자까지 · 해요체 (남는 한 줄만 평서문)
//   L7  뼈의 차례 — 첫 생각 → 깨는 사실 → 이름 → 뒤집기 → 써 보기 → 내려앉기 → 남는 한 줄. 고르기는 하나 · 어느 쪽을 골라도 같은 수의 문장으로 받는다
//   L8  크기 — 긴 이야기보다 확실히 짧다 (빈칸 뺀 글자 · 한쪽 가지만 센다) · 개념 낱말 1 ~ 2
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 · 술술 읽히는가 (사람 — 소리 내어 읽듯 처음부터 끝까지 · D91)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LIGHT, LIGHT_CHROME, LIGHT_STORES } from "./data";
import type { T } from "../short/types";

const REPO = path.join(import.meta.dirname, "../../../../../..");
let failed = 0;
const fail = (code: string, message: string) => {
  failed += 1;
  console.log(`  FAIL ${code} ${message}`);
};
const squash = (s: string) => s.replace(/\s+/g, "");
const S = LIGHT;

console.log(`■ 짧은 이야기 다시 쓰기 (B) — ${S.cover.title.t.replace(/\n/g, " ")} (${S.code} · lab 전용 꼴)`);

// L1
for (const f of LIGHT_STORES) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", f], { cwd: REPO, stdio: "pipe" });
  } catch {
    fail("L1", `문서 파일이 git 에 없다 — ${f}`);
  }
}
const documents = LIGHT_STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
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
for (const [k, v] of Object.entries(LIGHT_CHROME)) if (/\d/.test(v)) fail("L4", `화면 글 ${k} 에 숫자가 있다 — "${v}"`);

// L5 — 그리지 않을 것
const banned: [RegExp, string][] = [
  [/(때문에|탓에|해서|하니까) (비만|살이|늘|올)/, "원인 단정 (왜 올랐나는 문서에 없다)"],
  [/부풀|속였|속인|과장|낚|왜곡/, "제목 · 기관을 탓함"],
  [/빼야|줄여야|하세요|해야 해요|위험해|조심하세요/, "건강 조언 · 겁주기"],
  [/요즘 사람|한국인은|다들|누구나|흔히|늘 그렇/, "넓히기"],
  [/었다면|았다면|였다면|없었으면/, "반사실"],
  [/가장 많이/, "“가장 많이” (발표문의 그 말은 변화율 기준 — 옮기지 않기로 했다)"],
  [/치료제|다이어트/, "이야기의 줄기 밖"],
];
for (const { where, item } of items) for (const [re, what] of banned) if (re.test(item.t)) fail("L5", `${where}: ${what} — "${item.t}"`);

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
const ORDER = ["first_thought", "breaker", "name", "flip", "try", "land"] as const;
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

// L9 — 페이지에 모델 이름 · 다른 견본 이름이 없다 (도윤이 모른 채 읽는다). 줄기는 뉴스 — 뒤집기 · 남는 한 줄에 뉴스의 말이 있다
for (const { where, item } of items) if (/소넷|Sonnet|Fable|Opus|Claude|클로드|short-a|UX-8/i.test(item.t)) fail("L9", `${where}: 모델 · 견본 이름 — "${item.t}"`);
const newsWords = /비만/;
if (!newsWords.test(S.keep.line.t) || !newsWords.test(firstFlip && firstFlip.kind === "flip" ? firstFlip.a.t + firstFlip.b.t : "")) fail("L9", "뒤집기 · 남는 한 줄에 뉴스의 말 (비만)이 없다");

if (process.argv.includes("--read")) {
  console.log("\n── 통독 (독자가 읽는 차례 · 가지는 둘 다)");
  for (const { where, item } of items) console.log(`- **${where}** ${item.t.replace(/\n/g, " / ")}${item.src?.length ? ` ← ${item.src.join(" ")}` : ""}${item.calc ? ` · calc ${Object.entries(item.calc).map(([k, v]) => `${k} = ${v}`).join(" || ")}` : ""}`);
}

if (!failed) {
  console.log(`  구절 ${Object.keys(S.quotes).length} (문서 ${Object.keys(S.docs).length} — git 의 store.documents.json) · 글 덩이 ${items.length} (한 번 읽을 때 ${read.length}) — 숫자가 든 글 ${withDigits}`);
  console.log(`  빈칸 뺀 글자 ${chars} (읽는 길 — 표지 · 흐름 한쪽 가지 · 한 줄 · 누구의 말) + 접힌 낱말 카드 ${cardChars} · 문단 ${S.flow.filter((b) => b.kind === "p").length} · 고르기 ${picks.length} · 물음 단추 1 (표지) · 낱말 ${S.keep.words.map((w) => w.name).join(" · ")}`);
  console.log(`  뼈: ${beats.join(" → ")} → 남는 한 줄 · 그리지 않을 것 ${S.not_drawn.length}`);
  console.log("\nOK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기");
} else {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
