import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Short } from "./Short";

// UX-7 — 짧은 이야기 견본 (시안): 영훈의료재단 — 개인정보위 2026-10-28 의결의 병원 쪽. 장면 넷 · 체험 없음 · 번호 없음 (주제 이름만).
// 글과 근거는 ./data.ts (lab 전용 꼴 — 계약에 짧은 이야기가 없다 · D80). 구절은 git 에 있는 문서의 것만이고 ../check.ts 가 저장된 문서와 대조한다. 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: "Claro 시안 — 짧은 이야기 · 병원이 털렸다는데, 어디가 털린 걸까" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <Short />;
}
