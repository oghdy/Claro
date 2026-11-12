import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { paper } from "@claro/tokens";
import { LIVE, liveOf, oneLine } from "../../../../episode/catalog";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "../../../../episode/episodes/pipc/pipc.css";

// 회차 화면 — 실제 주소 (F-E1 · D76). `/s/<시리즈 code>/<회차 번호>` — 둘 다 계약의 칸이다 (Series.code · Episode.number).
// 화면은 시안 (/lab/episode/*)과 **같은 부품 한 벌**이다 (src/episode/kit). 다른 것은 real 하나: 시안 띠 · 독자 스위치 · 풀이 스위치가 없고, 독자는 처음 온 독자다.
// **정적이다** — 골든 픽스처 (계약 검증을 지난 것)를 빌드할 때 싣는다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다. 목록에 없는 주소는 404 (notFound — 3화 · 파이프라인 시험판 · 견본은 여기 없다).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

type Params = Promise<{ series: string; n: string }>;

export function generateStaticParams() {
  return LIVE.map(({ ep }) => ({ series: ep.series.code, n: String(ep.number) }));
}

// 제목 · 설명 · 공유했을 때 보이는 것 — 전부 회차의 글 그대로 (표지의 제목 · 한 줄). 브랜드는 프론트가 붙인다
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { series, n } = await params;
  const live = liveOf(series, n);
  if (!live) return {};
  const { ep } = live;
  const c = ep.scenes.cover;
  const title = `${oneLine(c.title)} — ${ep.series.name} ${c.episode.t} · Claro`;
  const og = { title: `${oneLine(c.title)}`, description: c.dek.t };
  return { title, description: c.dek.t, openGraph: { ...og, type: "article", siteName: `Claro · ${ep.series.name} ${c.episode.t}`, locale: "ko_KR" }, twitter: { card: "summary", ...og } };
}

export default async function Page({ params }: { params: Params }) {
  const { series, n } = await params;
  const live = liveOf(series, n);
  if (!live) notFound();
  return <live.Screen real />;
}
