import type { Metadata, Viewport } from "next";
import { OilReplotB2 } from "./OilReplotB2";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "./oilb.css";

// UX-11b — 둘째 판 (oil-replot-b)의 빈 곳을 손으로 메운 판. 메우기 전 (/lab/episode/oil-replot-b)과 나란히 폰으로 읽는 시안. 실제 주소 · 다른 시안은 건드리지 않았다.
export const metadata: Metadata = { title: "Claro 시안 — 기름값 · 빈 곳을 메운 1화", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E1A16" };

export default function Page() {
  return <OilReplotB2 />;
}
