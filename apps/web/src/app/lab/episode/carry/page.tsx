import type { Metadata, Viewport } from "next";
import { CarrySample } from "../episodes/carry-sample";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "../episodes/carry-sample/carry.css";

// UX-6 — 같은 그림의 지난 값 (계약 EPISODE §7.9 — 실물 전)의 **견본**. 실제 회차가 아니다: 금리 2화 (골든)에 시안에서만 9월 값을 "지난 화"로 붙였다.
// 3화 (회의록 · 11/18 무렵)가 첫 실물이다 — 그 주소는 ../rate-3. 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: "Claro 시안 — 지난 값 견본 (실제 아님) · 금리는 어디로 2화" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E1A16" };

export default function Page() {
  return <CarrySample />;
}
