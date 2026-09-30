import type { Layer } from "@claro/contract";

// 층을 독자에게 부르는 말 (§8.4 "이건 원문 / 이건 해석"). 좋다/나쁘다가 아니라 "어디서 왔나"만 말한다.
// 계약 §6 표의 뜻을 독자 말로 옮긴 것. writing(사실 주장이 없는 글)은 표시하지 않는다.
export const LAYER_WORD: Partial<Record<Layer, string>> = {
  fact: "사실",
  claim: "해석",
  concept: "개념",
  bridge: "연결",
};

export const LAYER_EXPLAIN: Record<Layer, string> = {
  fact: "출처에 적혀 있는 사실이에요.",
  claim: "사실들에서 Claro 가 끌어낸 해석이에요.",
  concept: "뉴스를 읽기 위한 배경 개념 설명이에요.",
  bridge: "개념을 오늘 일에 잇는 문장이에요.",
  writing: "사실을 주장하지 않는 글이에요 — 질문이나 이어 주는 말.",
};

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
