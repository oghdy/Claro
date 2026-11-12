// 풀이 칸의 모양 — **계약이다** (docs/contract/EPISODE.md §7 · @claro/contract). 여기서 다시 정의하지 않는다.
// 틀 부품(kit/frames/*.tsx)은 계약 타입의 데이터만 받는다.
// 여기 남은 것은 **그림 부품의 모양**이다 — 켜고 끄기의 그림은 데이터가 아니라 개념의 그림 부품이고 (UX-4 ③-1 · D62),
// 계약의 틀은 그 이름(picture.id)만 가리킨다. 그림은 pictures.ts 에 있다.
export type { ChainFrame, ChainNode, Frame, Lab, NoLabWhy, PageCard, PagesFrame, PictureRef as Picture, PlainFlip, PlainQuiet, PlainSolve, PlainThree, SeatSide, SeatsFrame, Solve, SolveEntry, ToggleFrame } from "@claro/contract";

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
