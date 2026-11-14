import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { MapPage } from "../../../../episode/today/Map";
import { TODAY_COPY as C } from "../copy";
import { PaletteDock } from "../palette/PaletteDock";

// UX-7 — 개념 지도 견본 (시안). "오늘" 화면에서 개념 지도로 가는 길의 끝. 읽은 기록이 없다 — 오늘의 이야기를 다 읽은 독자의 지도를 고정값으로 보인다.
export const metadata: Metadata = { title: "Claro 시안 — 개념 지도 (견본)" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  // F-E2: 지도 부품은 실제 주소 (/map)와 한 벌이다 (episode/today/Map)
  return <MapPage title={C.mapTitle} note={C.mapNote} back={{ href: "/lab/today", label: C.mapBack }} top={<PaletteDock tag={C.draft} />} />;
}
