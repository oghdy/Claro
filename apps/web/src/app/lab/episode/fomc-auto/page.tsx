import type { Metadata, Viewport } from "next";
import { AutoEpisode } from "./AutoEpisode";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "./auto.css";

// P-E1 — **파이프라인이 만든 판.** 손으로 만든 금리 2화 (../fomc — 골든 fixtures/episode-rate-2.json)와 견줘 보려고 같은 뼈대 (kit/) 위에 올린다.
// 글 · 근거 · 풀이 칸은 packages/pipeline/data/events/FOMC-20261028/episode/episode.json (pnpm --filter @claro/pipeline episode FOMC-20261028 이 짓는다).
// 사람 확인 전이다 — 뒤집기 · 사망 · 표결의 갈림 · 지도는 파이프라인의 제안이다 (같은 폴더의 review.json). kit · 다른 회차의 파일은 고치지 않았다.
export const metadata: Metadata = { title: "Claro 시안 — 금리는 어디로 · 2화 (파이프라인이 만든 판)" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E1A16" };

export default function Page() {
  return <AutoEpisode />;
}
