import type { Metadata, Viewport } from "next";
import { OilReplotB } from "./OilReplotB";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "./oilb.css";

// UX-10b — 기름값 1화를 이야기 짜는 법으로 다시 짠 판 (둘째). 실제 /s/oil/1 과 나란히 폰으로 읽는 시안. 실제 주소 · 다른 시안은 건드리지 않았다.
export const metadata: Metadata = { title: "Claro 시안 — 기름값 · 다시 짠 1화 (둘째)", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E1A16" };

export default function Page() {
  return <OilReplotB />;
}
