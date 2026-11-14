import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { ShortScreen } from "../../../../episode/Screen";
import { TODAY_COPY } from "../copy";
import { PaletteDock } from "../palette/PaletteDock";
import { SHORT } from "./data";

// UX-7 — 짧은 이야기 견본 (시안): 영훈의료재단 — 개인정보위 2026-10-28 의결의 병원 쪽. 장면 넷 · 체험 없음 · 번호 없음 (주제 이름만).
// 글과 근거는 골든 넷째 (fixtures/episode-short-privacy-yeonghun.json — 계약의 ShortStory · EPISODE §13 · B-E3)를 ./data.ts 가 읽는다. 구절은 git 에 있는 문서의 것만이고 ../check.ts 가 계약 검증으로 저장된 문서와 대조한다. 아무것도 저장하지 않는다.
export const metadata: Metadata = { title: "Claro 시안 — 짧은 이야기 · 병원이 털렸다는데, 어디가 털린 걸까" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  // F-E2: 화면 부품은 실제 주소 (/short/pipc-hospital)와 한 벌이다 (episode/kit/Short). 시안에는 색 스위치가 얹히고, 돌아갈 곳 · 곁 이야기가 시안 주소다
  return <ShortScreen code={SHORT.code} top={<PaletteDock tag={TODAY_COPY.draft} />} />;
}
