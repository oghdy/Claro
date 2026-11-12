import type { Metadata, Viewport } from "next";
import { DeliveryEpisode } from "../../../episode/episodes/delivery";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";

// UX-1 — 첫 "회차" 시안 (D57: 쌓인다 · 이어진다 · 맛). 본 화면(/)과 따로다 — 계약 · 골든 · 원장을 읽지 않는다.
// 글과 근거는 골든 픽스처 fixtures/episode-price-1.json (회차 계약 — B-E1. 손으로 쓴 시안 데이터를 옮긴 것), 두 독자의 "아는 개념"은 episodes/delivery/data.ts 의 고정값이다. 아무것도 저장하지 않는다.
// UX-2 부터 화면 부품은 kit/ (공통 뼈대)에 있고, 둘째 회차는 ./fomc 에 있다. UX-4 부터 풀이 장면도 kit/frames (틀 부품)이 세운다.
// F-E1 (D76) 부터 화면 부품 · 회차 데이터는 src/episode 에 있고, 실제 주소 (/s/price/1)와 **같은 한 벌**을 쓴다. 이 주소는 그 화면에 시안 띠 · 독자 스위치 · 풀이 스위치가 붙은 것이다 (따라온 독자 · 기본 풀이 · 그림을 본 독자를 보는 자리).
export const metadata: Metadata = { title: "Claro 시안 — 누가 값을 정하나 · 1화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <DeliveryEpisode />;
}
