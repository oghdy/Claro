// P-S1 — 짧은 이야기 단계의 프롬프트 · 출력 모양 (D86 · D88). 긴 이야기 (episode-prompt.ts)를 본뜨되 짧게: 설계와 글을 **한 번에** 받는다.
//   글 (short-write)   Fable — 뼈 (뒤집기가 진짜인가 · 그리지 않을 것 · 사람 칸 제안) + 장면 넷의 독자 글. 맛은 지킨다 (D73)
//   함의               episode-prompt.ts 의 episode-entail/2 를 그대로 (불러 쓰기만) — Opus low · 위험한 글만
//   고치기             episode-prompt.ts 의 episode-repair/2 를 그대로 (불러 쓰기만) — Opus
// 사실 뽑기 단계는 모델이 없다 — 문서를 문장 · 줄머리로 끊은 **구절 목록** (short.ts passagesOf · 글자 그대로)을 글 단계가 근거로 가리킨다.
// 출력은 칸 목록 하나 (episode-prompt.ts WRITE_SCHEMA 와 같은 모양 — 큰 스키마는 문법이 너무 커 거절된다).
// 본보기는 손으로 쓴 짧은 이야기 하나 (골든 넷째 — 영훈의료재단). 다른 사건의 글이다 — 말투와 크기를 보라고 넣는다.
import type { WT } from "./episode-prompt.ts";

export const SHORT_WRITE_VERSION = "short-write/1";

/** 칸의 차례 = 프롬프트의 칸 목록 = 확인지의 차례. T = 글 한 덩이 (t · src · calc · voice) · S = 맨 글자열 (숫자 금지) · D = 뼈 (사람이 보는 글 — 독자 글이 아니다) */
export const CELLS: readonly { k: string; kind: "T" | "S" | "D"; what: string }[] = [
  { k: "design.first_thought_why", kind: "D", what: "보통 사람이 왜 그렇게 생각하기 쉬운가 — 한 문장" },
  { k: "design.flip_strength", kind: "D", what: "\"strong\" 또는 \"weak\" — 깨는 사실과 뒤집기의 뒤쪽 말을 문서가 글자로 받치면 strong" },
  { k: "design.flip_basis", kind: "D", what: "뒤집기가 문서의 어디에 서 있나 — 한두 문장. src 에 그 구절 키" },
  { k: "design.not_drawn[i]", kind: "D", what: "그리지 않을 것 셋 ~ 다섯 — 이 문서로는 말할 수 없는데 글이 미끄러지기 쉬운 것 (문서에 없는 사실 · 반사실 · 넓힌 말 · 까닭)" },
  { k: "design.unknown[i]", kind: "D", what: "독자가 궁금해할 텐데 이 문서에 없는 것 둘 ~ 넷" },
  { k: "design.concepts[i]", kind: "D", what: "이 이야기에서 독자가 만나는 개념의 이름 하나 ~ 셋 (도구 카드 후보 — 지금은 카드를 쓰지 않는다)" },
  { k: "design.death", kind: "D", what: "\"true\" 또는 \"false\" — 사람이 숨진 사건인가" },
  { k: "design.weight", kind: "D", what: "\"short\" 또는 \"long\" — 짧은 이야기로 서나. 뒤집기가 둘 이상 얽히거나 눌러 볼 차례가 있으면 long" },
  { k: "design.weight_why", kind: "D", what: "그 까닭 한 문장" },
  { k: "voice_official", kind: "S", what: "근거를 열었을 때 official 글에 붙는 꼬리표의 이름 — 누구의 판단인지 아주 짧게 (\"○○의 판단\" 꼴)" },
  { k: "cover.title", kind: "S", what: "물음 제목 — 두 줄 (\\n). 독자의 말로 묻는다" },
  { k: "cover.dek", kind: "T", what: "사건 한 줄 — 누가 무엇을 했나. 두 문장까지" },
  { k: "cover.meta", kind: "T", what: "\"○○○○년 ○월 ○일 발표\" 같은 날짜 한 줄 (문서의 날짜 줄 구절을 src 에)" },
  { k: "cover.hint", kind: "T", what: "표지의 귀띔 한 줄 — 발표 하나를 놓고 짧게 본다는 말 (src \"\" · voice none · 숫자 없이)" },
  { k: "cover.ask", kind: "S", what: "독자의 첫 물음 (첫 생각을 물음으로) — 다음 장면으로 넘어가는 단추" },
  { k: "plain.title", kind: "S", what: "어디가 장면의 머리 — 물음에 대한 답을 한마디로. 두 줄 (\\n)" },
  { k: "entry.first_thought", kind: "T", what: "독자의 첫 생각 — 독자의 말로 한 문장 (src \"\" · voice explain)" },
  { k: "entry.breaker", kind: "T", what: "깨는 사실 — 문서에 적힌 것 (구절 필수). 두 문장까지" },
  { k: "where.kicker", kind: "S", what: "어디가 장면의 작은 머리 — 네댓 글자의 물음 꼴 (\"무엇을 봤나\")" },
  { k: "where.body[i]", kind: "T", what: "깨는 사실 아래의 글 하나 ~ 둘 — 무슨 일이 있었나를 가장 쉬운 말로 (구체적인 장면 하나)" },
  { k: "entry.flip_a", kind: "S", what: "뒤집기의 앞쪽 말 — 큰따옴표 “ ” 안의 짧은 말 (독자의 첫 생각 쪽)" },
  { k: "entry.flip_op", kind: "S", what: "\"≠\" 또는 \"=\"" },
  { k: "entry.flip_b", kind: "S", what: "뒤집기의 뒤쪽 말 — 큰따옴표 “ ” 안의 짧은 말" },
  { k: "entry.flip_note", kind: "T", what: "왜 그런지 한 문단 — 누가 그렇게 봤는지와 함께 (구절 필수 · 세 문장까지)" },
  { k: "where.unknown", kind: "T", what: "문서에 없는 것을 없다고 말한다 — 독자가 가장 궁금해할 하나 (src \"\" · voice none)" },
  { k: "where.ask", kind: "S", what: "다음 장면 (문서가 말한 것)으로 넘어가는 독자의 물음" },
  { k: "why.title", kind: "S", what: "문서가 말한 것 장면의 머리 — 두 줄 (\\n)" },
  { k: "why.lead", kind: "T", what: "이끄는 글 — 기관이 무엇을 기준으로 봤나. 두 문장까지" },
  { k: "why.real_label", kind: "S", what: "\"○○가 짚은 것\" 꼴의 이름표" },
  { k: "why.real[i].head", kind: "T", what: "짚은 것 둘 ~ 셋의 머리 — 열 글자 안팎 (src \"\" · voice none · 숫자 없이)" },
  { k: "why.real[i].body", kind: "T", what: "그 내용 한 덩이 (구절 필수)" },
  { k: "why.verdict", kind: "T", what: "그래서 기관의 답은 무엇이었나 — 누구의 판단인지와 함께. 꼭 남아야 할 낱말 하나를 굵게" },
  { k: "why.ask", kind: "S", what: "남음으로 넘어가는 물음 (\"그래서 무엇이 남나요?\" 같은)" },
  { k: "entry.whose", kind: "T", what: "\"여기까지는 **○○의 판단**이에요\"로 시작하는 한 문단 — 누구의 말까지 들었고 누구의 말은 우리가 확인한 문서에 없는지 (src \"\" · voice none)" },
  { k: "keep.title", kind: "S", what: "남음 장면의 머리 — 두 줄 (\\n)" },
  { k: "keep.line", kind: "S", what: "남는 한 줄 — 뒤집기의 맺음. 네 줄까지 (\\n) · 숫자 없이 · 평서문 (\"~다.\")" },
  { k: "keep.advice_label", kind: "S", what: "\"○○의 당부\" · \"○○의 말\" 꼴의 이름표" },
  { k: "keep.advice", kind: "T", what: "기관 · 당사자가 문서에서 한 당부나 말 — 세 문장까지 (구절 필수)" },
];

const cellLine = (c: (typeof CELLS)[number]) => `${c.k} = ${c.kind === "T" ? "글 한 덩이 (T)" : c.kind === "S" ? "글자열" : "뼈"} — ${c.what}`;

export const SHORT_WRITE_SYSTEM = `너는 Claro 의 짧은 이야기 단계다. 발표 하나 (1차 문서)의 **구절 목록**을 받아 짧은 이야기 한 편의 **뼈**와 **독자 글 전부**를 한 번에 낸다. 네 출력은 코드가 검사하고 (숫자 · 구절) 다른 모델이 문장마다 근거와 대 본 뒤 (함의) 사람 편집자가 확인지로 읽는다.

## 짧은 이야기란
Claro 는 뉴스와 독자 사이의 지식 거리를 없앤다. 요약 서비스가 아니다. 독자는 뉴스를 잘 모르는 보통 사람이다.
짧은 이야기는 이 분쯤에 읽는 한 편이고 장면 넷으로 흐른다:
**표지** (물음 제목) → **어디가** (독자의 첫 생각 → 그것을 깨는, 문서에 있는 사실 → \`A ≠ B\` 한 줄 → 문서에 없는 것은 없다고) → **문서가 말한 것** (기관이 짚은 것 둘 ~ 셋 → 그래서 내린 답) → **남음** (한 줄 → 기관의 당부).
독자가 "아, 그래서 그랬구나" 하게 만드는 것이 목적이다. 그 "아"는 **작은 뒤집기 하나**에서 온다. 체험 (눌러 보는 그림)은 없다. 다음 화 예고도 없다 — 한 편으로 끝난다.
이 이야기는 **홀로 선다**: 곁에 긴 이야기가 없고, 가리킬 도구 카드도 없다. 그래서 개념은 글 안에서 쉬운 말로 한 번 풀고 지나간다.

## 먼저 뼈 — design 칸 (사람 편집자가 본다)
- **뒤집기가 진짜인가.** 첫 생각은 보통 사람이 제목만 보고 실제로 할 법한 생각이어야 한다. 깨는 사실은 구절에 글자로 있어야 한다. 뒤집기의 뒤쪽 말 (B)이 틀린 생각이라는 것을 **문서가** 받쳐야 한다 — 문서가 말하지 않는 것으로 뒤집지 않는다. 억지면 \`weak\` 라고 정직하게 적는다 (사람이 판단한다)
- **그리지 않을 것.** 이 문서만으로는 말할 수 없는데 글이 미끄러지기 쉬운 것을 적는다 — 문서에 없는 사실 (누가 · 언제 · 왜) · "~했다면 ~했을 것" 같은 반사실 · 사례 몇을 관행으로 넓힌 말 · 당사자의 속마음. 독자 글은 이 선을 넘지 않는다
- 사람 칸 (사망 · 무게)은 제안일 뿐이다 — 사람이 확인한다

## 말투 — 이것이 제품이다
- **친구가 옆에서 말해 주듯.** 해요체. 짧은 문장. 한 문장에 한 가지. 어려운 말은 풀어서 — 전문 용어를 먼저 쓰지 말고 쉬운 말로 먼저 말한 뒤 이름을 붙인다 ("이런 것을 ○○라고 불러요"). 관청의 말 (재결 · 인용 · 처분청 · 위법 · 부당)을 그대로 옮기지 않는다 — 풀어 쓰고, 꼭 필요한 낱말 하나만 이름으로 남긴다
- 독자는 기사를 "읽는" 것이 아니라 이야기 안으로 "들어간다". 수수께끼를 걸고 (어, 이상한데?) · 같이 풀고 (볼게요) · 한 줄로 남긴다. 호들갑은 없다 — 느낌표 · 과장 · "충격" 같은 말을 쓰지 않는다
- **구체적인 것 하나가 설명 열 줄보다 낫다.** 문서에 날짜 · 차례 · 사례가 있으면 그 가운데 가장 또렷한 하나를 장면으로 보여 준다. 사례를 전부 늘어놓지 않는다
- **한 덩이는 세 문장까지.** 굵게는 \`**이렇게**\` — 덩이에 많아야 하나, 꼭 남아야 할 말에만. 머리 · 제목은 줄바꿈 (\`\\n\`)으로 두 줄이 될 수 있다
- **독자의 숨.** 설명만 이어지면 강의가 된다. 장면마다 한 번쯤 독자의 말로 받는다 — 짧은 되물음 · "~잖아요" · "~고요". 남발하지 않는다
- **같은 문장을 통째로 되풀이하지 않는다.** 깨는 사실 · 뒤집기 · 판정 · 남는 한 줄이 같은 말의 되풀이가 되지 않게 — 장면마다 한 걸음씩 나아간다 (무슨 일 → 그래서 무엇이 아닌가 → 기관은 무엇을 봤나 → 무엇이 남나)
- **발행일에 걸린 말을 쓰지 않는다** — "지난달" · "어제" · "이번 주" · "최근" · "얼마 전". 읽는 날이 달라져도 맞는 말로 쓴다 (날짜로)
- **맺음은 문서가 말한 것으로.** 뒤집기의 풀이 · 남는 한 줄을 "~라는 말은 없어요"로 끝내지 않는다. 없다는 말은 \`where.unknown\` 과 \`entry.whose\` 에 한 번씩이면 된다
- 사람 이름은 꼭 필요할 때만 쓴다. 문서가 가린 사람 (ㄱ씨 같은)은 그대로 가린 채로 — 누구인지 짐작하게 쓰지 않는다

## 넘지 않는 선
- **문서에 있는 것만.** 받은 구절 목록에 없는 것 — 네 배경 지식 · 보도 · 다른 사건 — 을 사실처럼 쓰지 않는다. 개념을 쉬운 말로 푸는 설명도 받은 구절이 말한 데까지만 (법 조문의 내용 · 제도의 역사 · 통계를 네 지식으로 보태지 않는다)
- **누구의 말인가**: 기관 · 당사자의 판단은 "○○가 그렇게 봤다"로. 우리 판단처럼 쓰지 않는다. 정치에 닿는 것 (정당 · 인사 · 의도)은 쓰지 않는다
- **사례를 넓히지 않는다.** 문서가 사례 셋을 말하면 셋의 일이다. "경찰은 늘" · "흔히" · "많은 사람이"처럼 관행 · 빈도로 넓히지 않는다
- **새 수를 만들지 않는다.** 계산이 필요하면 (날짜 사이의 기간) 어떻게 계산했는지 calc 에 밝힌다
- **쪽이 넘어가 끊긴 구절**은 두 토막으로 온다 (목록에 "앞 구절에서 이어짐" 표시). 그 문장에 기대려면 두 토막을 다 src 에 붙인다

## 글 한 덩이 (T) — 독자 글의 꼴
\`{ t, src, calc, voice }\` — **네 칸 모두 글자열이다**
- \`t\` — 글
- \`src\` — 이 글이 기대는 **구절 키**들을 빈칸으로 띄워 한 줄로 ("p04 p11" · 없으면 ""). 근거 없는 말 건넴 ("볼게요")은 ""
- **근거는 넉넉히 — 조각마다.** 글의 내용 가운데 문서에서 온 **조각 하나하나**를 src 의 구절이 받쳐야 한다: 누가 · 무엇을 · 언제 · 얼마나 · 어떻게 봤나. 한 문장이 구절 셋에 기대면 셋 다 붙인다. 다음 검사는 **붙은 근거만** 본다
- **숫자 규칙 (코드가 본다)**: \`t\` 에 아라비아 숫자가 있으면 그 숫자가 src 구절의 **글자 안에** 있어야 한다 (날짜의 연 · 월 · 일도 숫자다). 구절에 없는 수는 둘 중 하나다 — ① \`calc\` 에 "2: 8월 10일 → 8월 12일 = 2일" 처럼 **그 숫자 토막마다** "숫자: 어떻게 나왔나"를 적는다 (여럿이면 " || " 로 잇는다 · 없으면 "") ② 숫자를 쓰지 않는다 (한글로 "이틀" — 다만 한글 수도 문서의 수와 맞아야 하고, 그 계산의 바탕 구절을 src 에 붙인다)
- \`voice\` — "fact" 문서에 적힌 사실 · "official" 기관 · 당사자의 판단이나 말 (누가 말했는지와 함께 쓴다) · "explain" Claro 가 풀어 쓴 설명 · "none" 표지 · 머리 · 물음 · 없다는 말
- **맨 글자열 칸** (T 가 아닌 글자열 — 제목 · 머리 · 이름표 · 물음 · 남는 한 줄)에는 **아라비아 숫자를 쓰지 않는다.** 수가 필요하면 한글로

## 본보기 — 다른 사건의 짧은 이야기 (손으로 쓴 것. 말투와 크기를 보라고. 이 사건의 정답이 아니다)
아래 본보기는 곁에 긴 이야기가 있는 짧은 이야기라서 "한 묶음" · "도구" · "지도"를 말한다. **이번 이야기는 홀로 선다 — 그런 말을 쓰지 않는다.**
{{EXEMPLAR}}

## 출력 — 칸 목록
JSON 하나: \`{ "cells": [ { "k": 칸의 길, "t": 글, "src": 근거, "calc": 계산, "voice": 꼬리표 }, … ] }\`. 아래 칸을 **이 차례대로** 채운다 (목록의 \`[i]\` 는 0 부터의 번호 — \`where.body[0]\` · \`why.real[1].head\`).
"글 한 덩이 (T)" 칸은 네 값을 다 쓴다. "글자열" 칸과 "뼈" 칸은 \`t\` 에 값을 쓰고 \`calc\` 는 "" · \`voice\` 는 "none" (\`src\` 는 \`design.flip_basis\` 만 구절 키 · 나머지는 ""). 뼈 칸에는 숫자를 써도 된다.

${CELLS.map(cellLine).join("\n")}`;

export const shortWriteSystem = (exemplar: string) => SHORT_WRITE_SYSTEM.replace("{{EXEMPLAR}}", exemplar);

export type ShortCtx = {
  event_title: string; doc_name: string; published_at: string;
  passages: { key: string; quote: string; cont: boolean }[];
  human: string;   // 사람이 준 말 (고르기의 뒤집기 후보 · 고칠 방향) — 없으면 ""
};
export const shortWriteUser = (c: ShortCtx) => `## 사건
${c.event_title}

## 문서 (하나)
${c.doc_name} · 공개 ${c.published_at}

## 구절 목록 (키 | 원문 글자 그대로 — 근거로 가리킬 수 있는 것은 이것뿐이다)
${c.passages.map((p) => `${p.key} | ${p.cont ? "(쪽이 넘어가 끊김 — 앞 구절에서 이어짐) " : ""}${p.quote}`).join("\n")}
${c.human ? `\n## 사람 편집자의 말\n${c.human}\n` : ""}
위 문서로 짧은 이야기 한 편의 칸을 전부 채워라.`;

// ── 칸 목록 → 모양 ───────────────────────────────────────────────────────────────────────────────────
type Cell = { k: string; t?: string; src?: string; calc?: string; voice?: string };
const splitKeys = (v: string) => [...new Set(v.split(/[\s,·]+/).map((x) => x.trim()).filter(Boolean))];
export const toWT = (c: Cell | undefined): WT => ({
  t: (c?.t ?? "").trim(),
  src: splitKeys(c?.src ?? "").filter((x) => /^p\d+$/.test(x)),
  calc: (c?.calc ?? "").split("||").map((x) => x.trim()).filter(Boolean).map((x) => { const k = x.indexOf(":"); return k < 0 ? null : { n: x.slice(0, k).trim(), how: x.slice(k + 1).trim() }; }).filter((x): x is { n: string; how: string } => !!x && !!x.n && !!x.how),
  voice: (["fact", "official", "explain", "none"].includes(c?.voice ?? "") ? c!.voice : "none") as WT["voice"],
});

export type ShortDesign = {
  first_thought_why: string; flip_strength: "strong" | "weak"; flip_basis: string; flip_basis_src: string[];
  not_drawn: string[]; unknown: string[]; concepts: string[]; death: boolean; weight: "short" | "long"; weight_why: string;
};
export type ShortWritten = {
  design: ShortDesign;
  voice_official: string;
  cover: { title: string; dek: WT; meta: WT; hint: WT; ask: string };
  plain: { title: string };
  entry: { first_thought: WT; breaker: WT; flip_a: string; flip_op: "≠" | "="; flip_b: string; flip_note: WT; whose: WT };
  where: { kicker: string; body: WT[]; unknown: WT; ask: string };
  why: { title: string; lead: WT; real_label: string; real: { head: WT; body: WT }[]; verdict: WT; ask: string };
  keep: { title: string; line: string; advice_label: string; advice: WT };
};

/** 모델 출력 (칸 목록) → ShortWritten. problems — 모르는 칸 · 빠진 칸 · 값이 틀린 칸 */
export function parseShort(output: string): { written: ShortWritten; problems: string[] } {
  const cells = (JSON.parse(output) as { cells: Cell[] }).cells;
  const by = new Map(cells.map((c) => [c.k.trim().replace(/\[\s*(\d+)\s*\]/g, "[$1]"), c]));
  const used = new Set<string>(), problems: string[] = [];
  const s = (k: string) => { used.add(k); const v = (by.get(k)?.t ?? "").trim(); if (!v) problems.push(`빈 칸 ${k}`); return v; };
  const t = (k: string) => { used.add(k); const w = toWT(by.get(k)); if (!w.t) problems.push(`빈 칸 ${k}`); return w; };
  const count = (prefix: string) => { let n = -1; for (const k of by.keys()) if (k.startsWith(`${prefix}[`)) { const m = /^\[(\d+)\]/.exec(k.slice(prefix.length)); if (m) n = Math.max(n, Number(m[1])); } return n + 1; };
  const list = (prefix: string) => Array.from({ length: count(prefix) }, (_, i) => s(`${prefix}[${i}]`));
  const pick = <T extends string>(k: string, allowed: readonly T[], dflt: T): T => { const v = s(k); if (!allowed.includes(v as T)) { problems.push(`${k}: "${v}" 는 ${allowed.join(" | ")} 가 아니다`); return dflt; } return v as T; };
  used.add("design.flip_basis");
  const written: ShortWritten = {
    design: {
      first_thought_why: s("design.first_thought_why"), flip_strength: pick("design.flip_strength", ["strong", "weak"], "weak"),
      flip_basis: s("design.flip_basis"), flip_basis_src: toWT(by.get("design.flip_basis")).src,
      not_drawn: list("design.not_drawn"), unknown: list("design.unknown"), concepts: list("design.concepts"),
      death: pick("design.death", ["true", "false"], "false") === "true", weight: pick("design.weight", ["short", "long"], "short"), weight_why: s("design.weight_why"),
    },
    voice_official: s("voice_official"),
    cover: { title: s("cover.title"), dek: t("cover.dek"), meta: t("cover.meta"), hint: t("cover.hint"), ask: s("cover.ask") },
    plain: { title: s("plain.title") },
    entry: { first_thought: t("entry.first_thought"), breaker: t("entry.breaker"), flip_a: s("entry.flip_a"), flip_op: pick("entry.flip_op", ["≠", "="], "≠"), flip_b: s("entry.flip_b"), flip_note: t("entry.flip_note"), whose: t("entry.whose") },
    where: { kicker: s("where.kicker"), body: Array.from({ length: count("where.body") }, (_, i) => t(`where.body[${i}]`)), unknown: t("where.unknown"), ask: s("where.ask") },
    why: {
      title: s("why.title"), lead: t("why.lead"), real_label: s("why.real_label"),
      real: Array.from({ length: count("why.real") }, (_, i) => ({ head: t(`why.real[${i}].head`), body: t(`why.real[${i}].body`) })), verdict: t("why.verdict"), ask: s("why.ask"),
    },
    keep: { title: s("keep.title"), line: s("keep.line"), advice_label: s("keep.advice_label"), advice: t("keep.advice") },
  };
  for (const k of by.keys()) if (!used.has(k)) problems.push(`모르는 칸 ${k}`);
  return { written, problems };
}

/** 독자 글 덩이 전부 (T) — id 는 칸의 길 그대로. 차례 = 화면의 차례 */
export function textsOfShort(w: ShortWritten): { id: string; wt: WT }[] {
  return [
    { id: "cover.dek", wt: w.cover.dek }, { id: "cover.meta", wt: w.cover.meta }, { id: "cover.hint", wt: w.cover.hint },
    { id: "entry.first_thought", wt: w.entry.first_thought }, { id: "entry.breaker", wt: w.entry.breaker },
    ...w.where.body.map((wt, i) => ({ id: `where.body[${i}]`, wt })),
    { id: "entry.flip_note", wt: w.entry.flip_note }, { id: "where.unknown", wt: w.where.unknown },
    { id: "why.lead", wt: w.why.lead },
    ...w.why.real.flatMap((r, i) => [{ id: `why.real[${i}].head`, wt: r.head }, { id: `why.real[${i}].body`, wt: r.body }]),
    { id: "why.verdict", wt: w.why.verdict }, { id: "entry.whose", wt: w.entry.whose }, { id: "keep.advice", wt: w.keep.advice },
  ];
}
/** 맨 글자열 칸 (독자 글 — 숫자 금지). 사람이 고칠 수 있다 (human.json edits 의 id) */
export const STRING_CELLS = CELLS.filter((c) => c.kind === "S" && !c.k.includes("[i]")).map((c) => c.k);
