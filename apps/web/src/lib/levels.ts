import type { LevelId } from "@claro/contract";

// 레벨 표시 이름은 프론트가 한 곳에서 정한다 (D22 · 계약 §3). 바꿀 때 여기만 고친다.
export const LEVEL_NAMES: Record<LevelId, string> = {
  basic: "입문",
  intermediate: "중급",
  advanced: "숙련",
};
