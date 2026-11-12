import type { Metadata, Viewport } from "next";
import { PipcEpisode } from "../episodes/pipc";
import "../episode.css";
import "../kit/frames/frames.css";
import "../episodes/pipc/pipc.css";

// UX-5 — 셋째 회차 시안: 개인정보위의 과징금 (2026-10-28 의결 · 10-29 발표)을 시리즈 「내 정보는 누가 지키나」 1화로. 같은 뼈대(kit/) · 같은 장면 여덟.
// 풀이는 넘겨 보기 틀 (kit/frames/Pages — 이 회차가 첫 실물). 글과 근거는 골든 픽스처 fixtures/episode-privacy-1.json (회차 계약). 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: "Claro 시안 — 내 정보는 누가 지키나 · 1화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <PipcEpisode />;
}
