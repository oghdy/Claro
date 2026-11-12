import type { Metadata, Viewport } from "next";
import { FomcEpisode } from "../../../../episode/episodes/fomc";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";

// UX-2 — 둘째 회차 시안: 2026-10-28 FOMC 를 시리즈 「금리는 어디로」 2화로. 배달앱 회차(../page.tsx)와 같은 뼈대(kit/) 위에 올라간다.
// 글과 근거는 골든 픽스처 fixtures/episode-rate-2.json (회차 계약 — B-E1. 손으로 쓴 시안 데이터를 옮긴 것). 본 화면의 계약 · 원장을 읽지 않는다. 아무것도 저장하지 않는다.
// F-E1 (D76) 부터 화면 부품 · 회차 데이터는 src/episode 에 있고, 실제 주소 (/s/rate/2)와 **같은 한 벌**을 쓴다. 이 주소는 그 화면에 시안 띠 · 독자 스위치 · 풀이 스위치가 붙은 것이다 (따라온 독자 · 기본 풀이 · 그림을 본 독자를 보는 자리).
export const metadata: Metadata = { title: "Claro 시안 — 금리는 어디로 · 2화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <FomcEpisode />;
}
