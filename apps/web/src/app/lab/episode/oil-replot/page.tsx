import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { OilReplot } from "./OilReplot";
import { BANNER, EPISODE, NOW, REPLOT } from "./data";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "../../../../episode/episodes/pipc/pipc.css";
import "./oil-replot.css";

// UX-10 (D113 ② · D115) — 「이야기 짜는 법」 (docs/content/story-guide.md)으로 기름값 1화를 다시 짠 시안. 실제 /s/oil/1 과 같은 뼈대 · 같은 그림 · 같은 CSS — 이야기의 차례만 다르다.
// 폰에서 두 주소를 나란히 읽고 견준다 (D104). lab 전용 — 실제 주소 · 이야기 목록 (catalog)에는 올리지 않았다.
export const metadata: Metadata = { title: `Claro 시안 — 기름값 다시 짜기 · ${EPISODE.scenes.cover.title.replace(/\n/g, " ")}`, robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <OilReplot ep={EPISODE} replot={REPLOT} now={NOW} banner={BANNER} />;
}
