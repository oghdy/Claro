import type { Metadata, Viewport } from "next";
import { PipcEpisode } from "../../../../episode/episodes/pipc";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/pipc/pipc.css";

// UX-5 — 셋째 회차 시안: 개인정보위의 과징금 (2026-10-28 의결 · 10-29 발표)을 시리즈 「내 정보는 누가 지키나」 1화로. 같은 뼈대(kit/) · 같은 장면 여덟.
// 풀이는 넘겨 보기 틀 (kit/frames/Pages — 이 회차가 첫 실물). 글과 근거는 골든 픽스처 fixtures/episode-privacy-1.json (회차 계약). 아무것도 저장하지 않는다.
// F-E1 (D76) 부터 화면 부품 · 회차 데이터는 src/episode 에 있고, 실제 주소 (/s/privacy/1)와 **같은 한 벌**을 쓴다. 이 주소는 그 화면에 시안 띠 · 독자 스위치 · 풀이 스위치가 붙은 것이다 (따라온 독자 · 기본 풀이 · 그림을 본 독자를 보는 자리).
export const metadata: Metadata = { title: "Claro 시안 — 내 정보는 누가 지키나 · 1화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <PipcEpisode />;
}
