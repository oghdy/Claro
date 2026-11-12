import type { Metadata, Viewport } from "next";
import { Rate3Episode } from "./Rate3Episode";
import { COPY, loadRate3 } from "./data";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "./rate3.css";

// UX-6 — 「금리는 어디로」 3화의 자리 (P-E2 ① 10). 10월 회의록이 나오면 파이프라인이 회차 파일을 낸다 — 이 주소는 그 파일만 있으면 그린다.
// **요청마다 읽는다** (force-dynamic): 회의록 날 세션은 파일만 만들면 되고, 폰 서버를 다시 빌드하지 않아도 이 주소가 바뀐다.
// 파일이 없으면 "회의록을 기다리는 중" 한 장. 글 · 근거 · 풀이 칸은 파이프라인의 것 (사람 확인 전이면 맨 위 띠가 알린다).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claro 시안 — 금리는 어디로 · 3화 (파이프라인)" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E1A16" };

export default function Page() {
  return <Rate3Episode data={loadRate3()} copy={COPY} />;
}
