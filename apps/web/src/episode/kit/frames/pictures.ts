// 개념의 그림 부품 — 켜고 끄기의 그림. **데이터(회차 계약)가 아니라 코드다** (UX-4 ③-1 · D62 ①).
// 계약의 ToggleFrame.picture.id 가 여기의 이름을 가리킨다. 그림은 개념마다 사람이 한 번 만들고, 그 개념이 나오는 회차마다 다시 쓴다.
// 그림의 종류는 지금 하나다 (pair — 두 자리 · 묶임). 이 그림이 개념 라이브러리 어디에 놓이는지는 정하지 않았다 (UX4-g · UX3-b).
import type { PairStage } from "./types";

export const PICTURES: Record<string, PairStage> = {
  // 최혜대우 — 배달앱 1화 (UX-1 의 값 그대로: 막대 너비 · 손님 여덟 · 새 앱에 둘 · 셋이 옮겨 간다)
  "mfn-tie": {
    kind: "pair",
    sides: [
      { name: "큰 앱", bar: "수수료 높음" },
      { name: "새 앱", bar: "수수료 낮음" },
    ],
    tag: "메뉴값",
    tie: "=",
    tokens: "손님",
    // 사실이 아니다 — 그림의 높낮이와 점의 수
    drawn: { bars: [86, 34], tokens: 8, startInMover: 2, moved: 3 },
  },
};
