import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Light } from "../short/Light";
import { STORY } from "./data";

// UX-8b — 짧은 이야기 다시 쓰기 (시안 · D95): 같은 뉴스 (질병관리청 2026-11-09 발표)를 **줄기는 뉴스 · 개념은 도구**로 손으로 다시 썼다 (모델 API 0).
// 꼴 (../short/types.ts 의 LightStory)과 화면 부품 (../short/Light.tsx)은 불러 쓰기만 한다 — lab/short 의 파일은 고치지 않았다.
// 글과 근거는 ./data.ts · 구절은 git 의 문서 하나에서만 (./check.ts 가 대조한다). 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: `Claro 시안 — 짧은 이야기 · ${STORY.cover.title.t.replace(/\n/g, " ")}`, robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <Light story={STORY} compare={[]} />;
}
