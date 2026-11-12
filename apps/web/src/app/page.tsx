import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { LIVE, realPath, today } from "../episode/catalog";
import { HOME } from "../episode/home-copy";
import { Rich } from "../episode/kit/parts";
import "../episode/episode.css";
import "../episode/episodes/fomc/fomc.css";
import "../episode/episodes/pipc/pipc.css";
import "./home.css";

// 첫 화면 (F-E1 · D76) — 종이 톤. Claro 가 무엇인지 두 줄 · 오늘의 회차 하나 (가장 최근 발표) · 시리즈 셋과 시리즈마다 최근 회차.
// **정적이다** — 빌드할 때 골든 픽스처에서 읽어 HTML 에 싣는다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다 · 독자가 누구인지 묻지 않는다.
// 회차 · 시리즈의 글은 골든의 글자 그대로다 (제목의 줄바꿈만 한 줄 제목에서 빈칸으로). 화면의 글은 ../episode/home-copy.ts.
// 옛 첫 화면 (9월 FOMC 기사 · 다크 · D26)은 /archive/fomc-2026-09 로 옮겼다 — 번호가 있는 옛 링크 (/?r=<UUID>)는 그리로 넘긴다 (next.config.ts).
export const dynamic = "force-static";

const og = { title: HOME.metaTitle, description: HOME.metaDescription };
export const metadata: Metadata = { title: HOME.metaTitle, description: HOME.metaDescription, openGraph: { ...og, type: "website", siteName: "Claro", locale: "ko_KR" }, twitter: { card: "summary", ...og } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Page() {
  const t = today();
  const c = t.ep.scenes.cover;
  return (
    <div className="ep-root hm-root" data-testid="home">
      <div className="ep-scroll">
        <main className="ep-scene hm">
          <header className="hm-top">
            <span className="hm-mark">{HOME.mark}</span>
            <span className="hm-preview">{HOME.previewTag}</span>
          </header>

          <section className="hm-intro">
            <h1>
              <Rich text={HOME.title} />
            </h1>
            {HOME.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>

          <section className="hm-today" aria-labelledby="hm-today">
            <h2 id="hm-today" className="hm-label">
              {HOME.todayLabel}
            </h2>
            <a className="hm-today-card" href={realPath(t.ep)} data-testid="today">
              <div className="ep-series">
                <span>{HOME.seriesTag}</span>
                <strong>{t.ep.series.name}</strong>
              </div>
              <div className="ep-cover-art">
                <t.Art />
              </div>
              <p className="ep-episode-no">{c.episode.t}</p>
              <h3 className="hm-today-title">
                <Rich text={c.title} />
              </h3>
              <p className="hm-dek">{c.dek.t}</p>
              <p className="ep-meta">{c.meta.t}</p>
              <span className="hm-go">
                {HOME.todayGo}
                <Arrow />
              </span>
            </a>
          </section>

          <section className="hm-shelf" aria-labelledby="hm-series">
            <h2 id="hm-series" className="hm-label">
              {HOME.seriesLabel}
            </h2>
            {LIVE.map(({ ep }) => (
              <a key={ep.series.code} className="hm-series" href={realPath(ep)} data-testid={`series-${ep.series.code}`}>
                <strong>{ep.series.name}</strong>
                <span className="hm-series-sub">{ep.series.sub}</span>
                {/* 시리즈 줄 — 회차 표지의 것과 같은 데이터 · 같은 모양 (지나온 화 · 지금 · 다음 화) */}
                <ol className="ep-track">
                  {ep.track.map((e) => (
                    <li key={e.no.t} data-state={e.state}>
                      <span className="ep-track-dot" aria-hidden="true" />
                      <span className="ep-track-no">{e.no.t}</span>
                      <span className="ep-track-title">{e.title.t}</span>
                    </li>
                  ))}
                </ol>
                <span className="hm-series-go">
                  <em>{HOME.latest}</em>
                  {ep.scenes.cover.episode.t} {HOME.read}
                  <Arrow />
                </span>
              </a>
            ))}
          </section>

          <p className="hm-foot">{HOME.preview}</p>
        </main>
      </div>
    </div>
  );
}
