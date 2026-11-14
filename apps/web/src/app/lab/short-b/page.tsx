import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Light } from "../short/Light";
import { COMPARE, LIGHT } from "./data";

// UX-8b-B — 짧은 이야기 다시 쓰기 (시안): 같은 뉴스 (질병관리청 2026-11-09 비만 발표)를 **줄기는 뉴스 · 개념은 도구** (D95)로 손으로 다시 썼다 (모델 API 0).
// 꼴 (../short/types.ts) · 부품 (../short/Light.tsx)은 불러 쓰기만 한다 — lab/short 의 파일은 고치지 않았다. 글과 근거는 ./data.ts · 구절 대조는 ./check.ts.
export const metadata: Metadata = { title: `Claro 시안 — 짧은 이야기 · ${LIGHT.cover.title.t.replace(/\n/g, " ")}`, robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <Light story={LIGHT} compare={COMPARE} />;
}
