import type { Metadata, Viewport } from "next";
import { FomcEpisode } from "../episodes/fomc";
import "../episode.css";
import "../kit/frames/frames.css";
import "../episodes/fomc/fomc.css";

// UX-2 — 둘째 회차 시안: 2026-10-28 FOMC 를 시리즈 「금리는 어디로」 2화로. 배달앱 회차(../page.tsx)와 같은 뼈대(kit/) 위에 올라간다.
// 글과 근거는 골든 픽스처 fixtures/episode-rate-2.json (회차 계약 — B-E1. 손으로 쓴 시안 데이터를 옮긴 것). 본 화면의 계약 · 원장을 읽지 않는다. 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: "Claro 시안 — 금리는 어디로 · 2화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <FomcEpisode />;
}
