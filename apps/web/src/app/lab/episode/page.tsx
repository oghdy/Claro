import type { Metadata, Viewport } from "next";
import { DeliveryEpisode } from "./episodes/delivery";
import "./episode.css";
import "./kit/frames/frames.css";

// UX-1 — 첫 "회차" 시안 (D57: 쌓인다 · 이어진다 · 맛). 본 화면(/)과 따로다 — 계약 · 골든 · 원장을 읽지 않는다.
// 글과 근거는 episodes/delivery/data.ts (손으로 쓴 시안 데이터), 두 독자의 "아는 개념"은 거기 적힌 고정값이다. 아무것도 저장하지 않는다.
// UX-2 부터 화면 부품은 kit/ (공통 뼈대)에 있고, 둘째 회차는 ./fomc 에 있다. UX-4 부터 풀이 장면도 kit/frames (틀 부품)이 세운다.
export const metadata: Metadata = { title: "Claro 시안 — 누가 값을 정하나 · 1화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <DeliveryEpisode />;
}
