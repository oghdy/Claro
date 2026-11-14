import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { paper } from "@claro/tokens";
import { SHORTS, oneLine, shortOf } from "../../../episode/catalog";
import { SHORT_CHROME } from "../../../episode/kit/chrome";
import { ShortScreen } from "../../../episode/Screen";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../../../episode/episodes/fomc/fomc.css";
import "../../../episode/episodes/pipc/pipc.css";
import "../../../episode/today/today.css";

// 짧은 이야기 화면 — 실제 주소 (F-E2 · D86 · D88). `/short/<code>` — 짧은 이야기에는 번호가 없다 (계약의 ShortStory — EPISODE §13). 이름은 이야기의 code (계약의 칸 · 유일 · 불변)다.
// 시리즈 아래 (/s/<시리즈>/…)에 두지 않은 까닭: 그 자리는 번호의 것이고, 짧은 이야기는 어느 선반에 놓이든 한 편으로 선다 (시리즈는 약속이 아니라 결과 — D79 ①).
// 화면은 시안 (/lab/today/short)과 **같은 부품 한 벌**이다 (src/episode/kit/Short). 다른 것은 real 하나: 색 스위치가 없고, 돌아갈 곳 · 곁 이야기가 실제 주소다.
// **정적이다** — 계약 검증을 지난 파일을 빌드할 때 싣는다. 아무것도 저장하지 않는다. 목록 (episode/catalog.tsx)에 없는 주소는 404.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

type Params = Promise<{ code: string }>;

export function generateStaticParams() {
  return SHORTS.map(({ story }) => ({ code: story.code }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const line = shortOf(code);
  if (!line) return {};
  const { story } = line;
  const c = story.scenes.cover;
  const shelf = `${story.series.name} · ${SHORT_CHROME.weightLabel}`;
  const og = { title: oneLine(c.title), description: c.dek.t };
  return { title: `${oneLine(c.title)} — ${shelf} · Claro`, description: c.dek.t, openGraph: { ...og, type: "article", siteName: `Claro · ${shelf}`, locale: "ko_KR" }, twitter: { card: "summary", ...og } };
}

export default async function Page({ params }: { params: Params }) {
  const { code } = await params;
  if (!shortOf(code)) notFound();
  return <ShortScreen code={code} real />;
}
