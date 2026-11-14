import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { paper } from "@claro/tokens";
import { LONGS, longOf, numbered, oneLine } from "../../../../episode/catalog";
import { LongScreen } from "../../../../episode/Screen";
import "../../../../episode/episode.css";
import "../../../../episode/kit/frames/frames.css";
import "../../../../episode/episodes/fomc/fomc.css";
import "../../../../episode/episodes/pipc/pipc.css";

// 긴 이야기 화면 — 실제 주소 (F-E1 · D76). `/s/<시리즈 code>/<번호>` — 둘 다 계약의 칸이다 (Series.code · Episode.number). F-E2 에서도 그대로다 (나간 링크가 깨지지 않게).
// 화면은 시안 (/lab/episode/*)과 **같은 부품 한 벌**이다 (src/episode/kit). 다른 것은 real 하나: 시안 띠 · 독자 스위치 · 풀이 스위치가 없고, 독자는 처음 온 독자다.
// F-E2: 어느 이야기가 나가는지는 이야기 목록 (episode/catalog.tsx — 한 곳)이 정한다. **번호 화면 규칙** (D88 E-20)도 목록이 정한다 — 같은 시리즈에 긴 이야기가 둘 이상 실제로 있을 때만 "N화" 를 보인다 (제목 · 화면 안쪽 모두).
// **정적이다** — 계약 검증을 지난 파일을 빌드할 때 싣는다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다. 목록에 없는 주소는 404.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

type Params = Promise<{ series: string; n: string }>;

export function generateStaticParams() {
  return LONGS.map(({ ep }) => ({ series: ep.series.code, n: String(ep.number) }));
}

// 제목 · 설명 · 공유했을 때 보이는 것 — 전부 이야기의 글 그대로 (표지의 제목 · 한 줄). 브랜드는 프론트가 붙인다. 번호는 규칙을 지난 시리즈에만
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { series, n } = await params;
  const line = longOf(series, n);
  if (!line) return {};
  const { ep } = line;
  const c = ep.scenes.cover;
  const shelf = numbered(series) ? `${ep.series.name} ${c.episode.t}` : ep.series.name;
  const title = `${oneLine(c.title)} — ${shelf} · Claro`;
  const og = { title: `${oneLine(c.title)}`, description: c.dek.t };
  return { title, description: c.dek.t, openGraph: { ...og, type: "article", siteName: `Claro · ${shelf}`, locale: "ko_KR" }, twitter: { card: "summary", ...og } };
}

export default async function Page({ params }: { params: Params }) {
  const { series, n } = await params;
  if (!longOf(series, n)) notFound();
  return <LongScreen series={series} n={n} />;
}
