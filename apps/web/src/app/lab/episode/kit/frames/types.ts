// 풀이 칸의 모양 (UX-4) — 틀의 입구 · 체험 틀 셋 · 기본 풀이 셋. **시안 코드다 — 계약이 아니다** (회차 계약은 다음 Step · 백엔드).
// 틀 부품(kit/frames/*.tsx)은 이 타입의 데이터만 받는다. 회차 쪽(episodes/*/data.ts)에는 데이터만 남는다.
// 실물이 있는 틀만 있다 (D24): 켜고 끄기 = 배달앱 1화 · 어디서 멈추나 + 자리에 앉기 = 금리 2화.
// 넘겨 보기 · 숫자 만지기 · 가르기는 실물 회차가 생길 때 만든다.
//
// 파이프라인이 채울 차례 (D61 ⑥)와 칸의 대응
//   ① 첫 생각 · 뒤집기      → SolveEntry (firstThought · breaker · flip · notDrawn · whose · death)
//   ② 사슬 엮기             → ChainFrame.nodes (고리 · 어디까지 닿았나 · 모르는 고리)
//   ③ 개념 ↔ 사건 연결      → Frame.picture (다시 쓰는 그림의 이름 · 그 그림이 붙은 개념) + Lab.born
// 그림의 수(자리 수 · 손님 수 · 막대 높이)는 number 로 적는다. 사실인 수(표결 수)는 check.ts 가 근거 구절에서 찾는다.
// 사실이 아닌 수(그림을 그리려고 정한 수)는 `drawn` 아래에만 둔다 — 독자에게 숫자로 보이지 않는다.
import type { T } from "../types";

// ─────────────────────────────────────────────────────────── 틀의 입구 — 모든 풀이에 공통

/** 체험이 없는 까닭 (D61 ① ③ ④ · UX-3 ⑤) */
export type NoLabWhy =
  /** 정치 — 당파 표결 · 편을 고르게 하는 체험이 된다 (D46 · D61 ③) */
  | "politics"
  /** 사람이 숨진 사건 · 부고 (D61 ④) — 꼴은 "조용히"뿐이다 */
  | "death"
  /** 자료 — 틀을 채울 문서가 없다 (판결문 등) */
  | "no-source"
  /** 뒤집을 믿음이 없다 — 발표뿐이다 */
  | "no-flip";

export interface SolveEntry {
  /** 첫 생각 — 독자가 믿고 들어오는 한 줄 */
  firstThought: T;
  /** 깨는 사실 — 그것을 깨는, 문서에 있는 사실 (src 가 있어야 한다) */
  breaker: T;
  /** 뒤집기 — `A` 기호 `B`. 없으면(null) 틀을 고르지 않는다 → 기본 풀이 */
  flip: { label: string; a: string; op: string; b: string; note: T } | null;
  /** 그리지 않을 것 — 문서가 말하지 않은 고리 · 앞날 · 값. 독자에게 보이지 않는다 (만드는 쪽의 선) */
  notDrawn: readonly string[];
  /** 누구의 말 — "여기까지는 ○○의 판단" (D46) */
  whose: T;
  /** 사람이 숨진 사건 · 부고인가 (D61 ④). true 면 체험이 없어야 하고 기본 풀이는 "조용히"여야 한다 — check.ts 가 본다 */
  death: boolean;
}

// ─────────────────────────────────────────────────────────── 체험 틀

/** 그림의 이름 — 같은 그림을 본 독자에게는 설명을 빼고 그림과 오늘의 값만 보인다 (D61 ②) */
export interface Picture {
  id: string;
  /** 이 그림이 붙은 개념 (개념 체험 — 그 개념이 나오는 회차마다 다시 쓴다). 없으면 이 사건만의 그림 */
  concept?: string;
}

/** 켜고 끄기 — 장치 하나를 켜고 끄며 같은 버튼을 두 번 누른다 */
export interface ToggleFrame {
  kind: "toggle";
  picture: Picture;
  /** 탭 둘 — 꺼졌을 때 · 켜졌을 때 */
  tabs: { off: string; on: string };
  /** 장치(규칙)의 말 — 켜졌을 때 · 꺼졌을 때 */
  device: { on: string; off: string };
  /** 독자가 누를 행동 하나 */
  action: string;
  again: string;
  /** 꺼진 쪽을 해 본 뒤, 켜진 쪽으로 넘어가는 말 */
  goOn: string;
  /** 그림 — 지금은 한 가지뿐이다: 두 자리 (pair) */
  stage: PairStage;
  /** 그림 아래의 한 줄 — 누르기 전 · 꺼졌을 때 누른 뒤 (움직이는 자리의 이름 뒤에 붙는다) · 켜졌을 때 누른 뒤 */
  state: { idle: string; moved: string; blocked: string };
  caption: { offBefore: T; offAfter: T; onBefore: T; onAfter: T };
}

/** 두 자리 그림 — 버티는 자리와 움직이는 자리. 꺼졌을 때는 움직이는 자리의 표가 내려가고 알갱이가 옮겨 온다. 켜졌을 때는 두 표가 묶인다 */
export interface PairStage {
  kind: "pair";
  /** [버티는 자리, 독자가 움직이는 자리] */
  sides: readonly [PairSide, PairSide];
  /** 두 자리에 같이 걸린 표의 이름 */
  tag: string;
  /** 묶였을 때 두 표 사이의 기호 */
  tie: string;
  /** 알갱이(손님)의 이름 — 화면에는 안 보인다 (읽어 주는 말) */
  tokens: string;
  /** 그림을 그리려고 정한 수 — **사실이 아니다.** 독자에게 숫자로 보이지 않는다 (높낮이 · 점의 수) */
  drawn: { bars: readonly [number, number]; tokens: number; startInMover: number; moved: number };
}
export interface PairSide {
  name: string;
  /** 막대 옆의 말 ("수수료 높음") */
  bar: string;
}

/** 어디서 멈추나 — 밀면 힘이 고리를 타고 가다 어느 고리에서 멈춘다 */
export interface ChainFrame {
  kind: "chain";
  picture: Picture;
  /** 틀을 이을 때 탭의 이름 */
  tab?: T;
  /** 고리 둘 ~ 넷. 차례대로 — 다 닿은 고리(full) → 일부만 닿은 고리(part) → 안 닿은 고리(none). 안 닿은 고리가 하나는 있어야 한다 */
  nodes: readonly ChainNode[];
  /** 모르는 고리 — 힘이 닿지 않은 첫 고리 앞의 점선에 붙는 말. 그 뒤는 그리지 않는다 */
  unknown: string;
  action: string;
  again: string;
  caption: { before: T; after: T };
  /** 다음 틀로 넘어가는 말 (틀을 이을 때) */
  goOn?: T;
}
export type ChainNode =
  | { id: string; name: string; reach: "full" | "part"; idle: string; after: string }
  /** 힘이 닿지 않은 고리 — 밀기 전에도 뒤에도 같은 말이다 */
  | { id: string; name: string; reach: "none"; still: string };

/** 자리에 앉기 — 한쪽 자리에 앉아 그쪽의 문서에 적힌 말을 듣는다. 다른 쪽에도 */
export interface SeatsFrame {
  kind: "seats";
  picture: Picture;
  tab?: T;
  /**
   * 쓸 수 있는 조건 (D61 ③ · UX-3 ④-1) — check.ts 가 본다. 안 맞으면 FAIL.
   * 이 칸은 **사람이 채운다** (UX-3 ⑦-2: AI 는 틀을 내놓으려는 쪽으로 기운다).
   */
  ground: {
    /** 어느 기관의 표결인가 — 한 기관이어야 한다 */
    body: string;
    /** official-dissent: 한 기관 안의 공식 이견 (연준 · 헌재 · 대법 · 금통위) · party-vote: 정당 표결 → 이 틀을 쓸 수 없다 */
    split: "official-dissent" | "party-vote";
    /** 표결이 적힌 공식 기록 — 구절. 쪽마다의 수가 이 구절에 있어야 한다 */
    record: readonly string[];
  };
  /** 자리 그림의 이름 (읽어 주는 말) */
  label: string;
  /** 내 자리에 적히는 글자 */
  you: string;
  /** 두 쪽 — 수가 많은 쪽부터 */
  sides: readonly [SeatSide, SeatSide];
  /** 다른 쪽에도 앉아 보는 단추의 말 */
  other: string;
  /** 실제 결과 한 줄 */
  result: T;
  caption: { before: T };
}
export interface SeatSide {
  id: string;
  /** 고르는 단추의 말 */
  choose: string;
  /** 갈린 뒤 그쪽 자리 위의 말 */
  group: T;
  /** 그쪽에 앉은 사람 수 — 사실이다 (ground.record 구절에 있어야 한다) */
  count: number;
  /** 그쪽이 공식으로 한 말 — 구절이 있어야 한다 */
  said: T;
  /** 그쪽의 까닭이 문서에 있나 — not-yet: 뒤에 나오는 문서(회의록 · 의사록)에 있다. 그때까지 이 쪽은 반쪽이다 (check.ts 가 알린다) */
  why: "in-doc" | "not-yet";
}

export type Frame = ToggleFrame | ChainFrame | SeatsFrame;

/** 체험 — 틀을 차례로 잇는다. 앞 틀의 결과가 뒤 틀의 처음이 된다 (UX3-i) */
export interface Lab {
  /** 풀이 장면의 머리 — 체험으로 부르는 말 */
  title: string;
  /** 준비 글 — 그림을 본 독자에게는 빠진다 (D61 ②) */
  setup: readonly T[];
  frames: readonly Frame[];
  /** 풀이에서 생기는 도구 — 체험 바로 뒤에 펼쳐서 보인다 (없는 회차도 있다) */
  born?: { lead: string; concept: string };
}

// ─────────────────────────────────────────────────────────── 기본 풀이 — 체험 없음 (UX-3 ⑤ · D61 ①)

interface PlainBase {
  /** 체험이 없는 까닭. demo 는 시안 전용 — 체험이 있는 회차를 "체험 없이 보기"로 견줘 보려고 둔 기본 풀이 */
  why: NoLabWhy | "demo";
  /** 풀이 장면의 머리 */
  title: string;
}
/** 가. 뒤집기만 — 첫 생각 → 깨는 사실 → `A ≠ B` 를 크게 → 문서가 말한 것 → 누구의 말. 글은 입구(SolveEntry)와 장면(copy.aha)의 것을 쓴다 */
export interface PlainFlip extends PlainBase {
  kind: "flip";
}
/** 나. 세 칸 — 확인된 것 / 아직 모르는 것 / 서로 다르게 말하는 것. 차례로 연다 */
export interface PlainThree extends PlainBase {
  kind: "three";
  lead: T;
  known: readonly T[];
  unknown: readonly T[];
  /** 양쪽의 공식 입장을 나란히 (D46 ④) — 둘 이상이거나, 없으면 빈 채로 */
  differ: readonly { who: T; says: T }[];
  differNote?: T;
}
/** 다. 조용히 — 무슨 일 → 지금 아는 것 → 다음에 나올 것. 눌러 보기 없음 · 물음 말도 낮춘다 */
export interface PlainQuiet extends PlainBase {
  kind: "quiet";
  what: readonly T[];
  known: readonly T[];
  coming: readonly T[];
  /** 낮춘 물음 말 — 장면의 물음(copy.aha.ask*) 대신 */
  ask: string;
}
export type PlainSolve = PlainFlip | PlainThree | PlainQuiet;

// ─────────────────────────────────────────────────────────── 풀이 칸

/** EpisodeData.solve — 풀이 장면 = 입구 + [체험 | 기본 풀이] + 문서가 말한 것(copy.aha.real) + 누구의 말 */
export interface Solve {
  entry: SolveEntry;
  /** 체험. 없으면(null) 기본 풀이로 나간다 */
  lab: Lab | null;
  /** 기본 풀이. 체험이 없으면 있어야 한다. 시안의 두 회차는 견줘 보려고 둘 다 갖는다 (why: "demo") */
  plain: PlainSolve | null;
}
