import type { Layer, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../lib/levels";

// 읽는 화면이 독자에게 하는 말 — 전부 여기 있다. 기사 글(골든)이 아닌 글자는 이 파일에서만 나온다.
// ⚠ 아직 아무도 검토하지 않았다 (D26 PM 검수 메모). 도윤이 고르면 여기만 고친다 — logs/frontend/F-2b.md 의 표와 같은 글이다.

/** 층을 부르는 말 (§8.4 "이건 원문 / 이건 해석"). 좋다/나쁘다가 아니라 "어디서 왔나"만 말한다. writing 은 꼬리표가 없다 */
export const LAYER_WORD: Record<Exclude<Layer, "writing">, string> = {
  fact: "사실",
  claim: "해석",
  concept: "개념",
  bridge: "연결",
};

/** 문장을 눌렀을 때 아래에 뜨는 글 — 앞의 낱말 */
export const LAYER_SHEET_WORD: Record<Layer, string> = { ...LAYER_WORD, writing: "글" };

/** 문장을 눌렀을 때 아래에 뜨는 글 — 설명 */
export const LAYER_EXPLAIN: Record<Layer, string> = {
  fact: "출처에 적혀 있는 사실이에요.",
  claim: "사실들에서 Claro 가 끌어낸 해석이에요.",
  concept: "뉴스를 읽기 위한 배경 개념 설명이에요.",
  bridge: "개념을 오늘 일에 잇는 문장이에요.",
  writing: "사실을 주장하지 않는 글이에요 — 질문이나 이어 주는 말.",
};

/** "층" 을 켰을 때 위에 뜨는 한 줄 */
export const LAYER_LEGEND: [word: string, gloss: string][] = [
  [LAYER_WORD.fact, "출처에 있는 것"],
  [LAYER_WORD.claim, "Claro 가 끌어낸 것"],
  [LAYER_WORD.concept, "배경 설명"],
  [LAYER_WORD.bridge, "개념을 오늘 일에 잇는 말"],
];

export const COPY = {
  /** 위쪽 줄 */
  trail: "지나온 길",
  layers: "층",
  levelsLabel: "설명 수준",
  /** 지나온 길에서 지금 자리 */
  here: "지금 여기",
  /** 첫 장 글 아래 한 줄 */
  tip: "문장을 누르면 그 문장이 사실인지 해석인지 보여요",
  /** 아래에 글이 남았을 때 */
  more: "아래에 더 있어요 ↓",
  /** 마지막 장 — 지나온 물음 위 */
  path: "이 물음들을 따라 여기까지 왔어요",
  restart: "처음부터 다시 보기",
  /** 물음 버튼을 읽기 도구가 부르는 말 */
  askLabel: (q: string) => `다음: ${q}`,
  /** 마지막 장 — 다른 레벨로 */
  reread: (id: LevelId) => `${LEVEL_NAMES[id]}으로 다시 읽기`,
} as const;
