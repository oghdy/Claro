import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Light } from "../../short/Light";
import { COMPARE, LIGHT } from "./data";

// UX-8c — 짧은 이야기 새 꼴 (FlowStory)의 첫 한 편을 폰으로 읽는 시안 (D99 ③ · D101 PS2-o). 옛 꼴 /short/license-notice 와 같은 원문이다.
// 부품 (../../short/Light.tsx) · CSS (../layout.tsx → ../../short/layout.tsx)는 불러 쓰기만 한다. 글과 근거는 story.json 에 있다 — ./data.ts
export const metadata: Metadata = { title: `Claro 시안 — 짧은 이야기 · ${LIGHT.cover.title.t.replace(/\n/g, " ")}`, robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <Light story={LIGHT} compare={COMPARE} />;
}
