import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { HOME } from "../../episode/home-copy";
import { MapPage } from "../../episode/today/Map";
import "../../episode/episode.css";
import "../../episode/episodes/fomc/fomc.css";
import "../../episode/episodes/pipc/pipc.css";
import "../../episode/today/today.css";

// 개념 지도 — 실제 주소 (F-E2). 첫 화면 ("오늘")의 "개념으로 이어져요"에서 오는 길의 끝. 주제마다 지도 한 장.
// **독자의 지도가 아니다** — 읽은 기록을 아직 저장하지 않는다 (D64 ~ D67 OPEN). 이야기를 다 읽은 뒤의 지도를 고정값으로 보이고, 화면의 글이 그렇게 말한다. 정적이다.
export const dynamic = "force-static";
export const metadata: Metadata = { title: HOME.mapMetaTitle };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <MapPage title={HOME.mapTitle} note={HOME.mapNote} back={{ href: "/", label: HOME.mapBack }} real />;
}
