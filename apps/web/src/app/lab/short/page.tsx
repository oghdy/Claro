import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { COMPARE, LIGHT } from "./data";
import { Light } from "./Light";

// UX-8 — 짧은 이야기 손 견본 (시안 · D91 작업 1): 「비만율이 26.9% 늘었다는데, 왜 더하면 안 맞을까」 — 질병관리청 2026-11-09 발표. 홀로 선다 · 손으로 썼다 (모델 API 0).
// 표지 + **한 흐름** (첫 생각 → 깨는 사실 → 이름 → 뒤집기 → 예상 한 번 고르기 → 남는 한 줄). 물음 단추는 표지의 하나뿐이다. 꼴은 lab 전용 (./types.ts) — 계약의 ShortStory 에 들어가지 않는다.
// 글과 근거는 ./data.ts · 구절은 git 의 문서 하나에서만 (./check.ts 가 대조한다). 아무것도 저장하지 않는다. 실제 주소 (/ · /s/* · /short/* · /map)는 건드리지 않았다.
export const metadata: Metadata = { title: `Claro 시안 — 짧은 이야기 · ${LIGHT.cover.title.t.replace(/\n/g, " ")}`, robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <Light story={LIGHT} compare={COMPARE} />;
}
