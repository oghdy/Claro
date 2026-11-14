import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { bundle, hrefOfLine, latestPerSeries, nextOf, numbered, realPath, type Line } from "../episode/catalog";
import { HOME, countNoun, countWord } from "../episode/home-copy";
import { Arrow, LongCard, ShortCard } from "../episode/today/cards";
import { sharedConcepts } from "../episode/today/concepts";
import "../episode/episode.css";
import "../episode/episodes/fomc/fomc.css";
import "../episode/episodes/pipc/pipc.css";
import "../episode/today/today.css";
import "./home.css";

// 첫 화면 = "오늘" (F-E2 · D79 · D86 · D88) — 종이 톤. 이야기들이 한 줄로 놓인다: 긴 이야기 · 짧은 이야기 (무게 둘) · 번호는 둘째 이야기가 실제로 있는 주제에만 · 아래에 개념으로 이어지는 길.
// 시안 /lab/today (UX-7 · UX-7b — 도윤이 보고 종이를 골랐다)와 **같은 카드 부품**이다 (episode/today). 실제 화면에는 색 스위치 · 시안 띠 · 견본 자리가 없다.
// **정적이다** — 빌드할 때 이야기 목록 (episode/catalog.tsx)에서 읽어 HTML 에 싣는다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다 · 독자가 누구인지 묻지 않는다.
// 이야기 · 시리즈의 글은 골든의 글자 그대로다 (제목의 줄바꿈만 한 줄 제목에서 빈칸으로). 화면의 글은 ../episode/home-copy.ts. 읽는 시간은 내지 않는다 (D82).
// **머리는 날짜를 속이지 않는다** — "오늘의 이야기"는 읽는 그날 (한국 날짜)에 낸 이야기가 있을 때만이다 (아래 TODAY_SCRIPT). 옛 번호 링크 (/?r=<UUID>)는 옛 화면으로 넘긴다 (next.config.ts).
export const dynamic = "force-static";

const og = { title: HOME.metaTitle, description: HOME.metaDescription };
export const metadata: Metadata = { title: HOME.metaTitle, description: HOME.metaDescription, openGraph: { ...og, type: "website", siteName: "Claro", locale: "ko_KR" }, twitter: { card: "summary", ...og } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

/** 낸 날을 글로 — "{m}월 {d}일의 이야기". 날짜는 목록에 적힌 값 그대로다 (지어내지 않는다) */
const dayTitle = (day: string): string => {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})$/.exec(day) ?? [];
  return HOME.titleDay.replace("{m}", String(Number(m))).replace("{d}", String(Number(d)));
};
/**
 * 서버가 그린 머리는 날짜 그대로다 ("11월 19일의 이야기" — 언제 읽어도 참이다). 이 한 줄이, 읽는 기기의 지금이 **한국 날짜로 그날**일 때만 머리를 "오늘의 이야기"로 바꾼다.
 * 페이지가 정적이라 서버는 읽는 날을 모른다 — 빌드한 날을 "오늘"이라고 적으면 다음 날부터 거짓이 된다. 스크립트가 안 돌면 날짜 머리가 그대로 남는다 (그것도 참이다)
 */
const TODAY_SCRIPT = `(function(){try{var h=document.currentScript.previousElementSibling;var d=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Seoul"}).format(new Date());if(h&&h.getAttribute("data-day")===d)h.textContent=${JSON.stringify(HOME.titleToday)}}catch(e){}})()`;

function Cards({ lines, lead }: { lines: readonly Line[]; lead: boolean }) {
  return (
    <>
      {lines.map((line, i) =>
        line.kind === "long" ? (
          <LongCard key={line.ep.code} line={line} href={hrefOfLine(line)} lead={lead && i === 0} C={HOME} />
        ) : (
          <ShortCard key={line.story.code} line={line} href={hrefOfLine(line)} C={HOME} />
        ),
      )}
    </>
  );
}

export default function Page() {
  const { day, top, rest } = bundle();
  const longs = top.filter((x) => x.kind === "long").length;
  const count = (day ? HOME.count : HOME.countRecent).replace("{n}", countWord(top.length));
  const tally = HOME.tally.replace("{long}", countNoun(longs)).replace("{short}", countNoun(top.length - longs));
  // 이어지는 이야기 — 번호를 보이는 시리즈 (긴 이야기가 둘 이상 실제로 있다). 시리즈마다 가장 새 이야기의 줄을 보인다
  const cont = latestPerSeries().filter((x) => numbered(x.ep.series.code));
  const concepts = sharedConcepts([...top, ...rest], hrefOfLine);
  return (
    <div className="ep-root td-root hm-root" data-testid="home">
      <div className="ep-scroll">
        <main className="ep-scene td hm">
          <header className="td-top hm-top">
            <span className="td-mark">
              <span>{HOME.mark}</span>
            </span>
            <span className="hm-preview">{HOME.previewTag}</span>
            <p className="hm-tagline">{HOME.tagline}</p>
          </header>
          <section className="td-intro">
            {/* 낸 날이 적힌 이야기가 없으면 "최근 이야기". 있으면 그 날짜 — 읽는 날이 그날이면 스크립트가 "오늘의 이야기"로 (suppressHydrationWarning: 그 글자를 React 가 되돌리지 않게) */}
            <h1 data-day={day ?? undefined} data-testid="head" suppressHydrationWarning>
              {day ? dayTitle(day) : HOME.titleRecent}
            </h1>
            {day ? <script dangerouslySetInnerHTML={{ __html: TODAY_SCRIPT }} /> : null}
            <p>
              {count}
              <span className="hm-tally">{tally}</span>
            </p>
          </section>

          <section className="td-list" aria-label={day ? dayTitle(day) : HOME.titleRecent}>
            <Cards lines={top} lead={top[0]?.kind === "long"} />
          </section>

          {rest.length ? (
            <section className="td-sec" aria-labelledby="td-rest">
              <h2 id="td-rest" className="td-label hm-restlabel">
                {HOME.restLabel}
              </h2>
              <div className="td-list">
                <Cards lines={rest} lead={false} />
              </div>
            </section>
          ) : null}

          {cont.length ? (
            <section className="td-sec" aria-labelledby="td-cont">
              <h2 id="td-cont" className="td-label">
                {HOME.contLabel}
              </h2>
              <p className="td-secnote">{HOME.contNote}</p>
              {cont.map(({ ep }) => {
                // 다음 이야기 예고 — 달력에 날짜가 있을 때만 (D79 ①) · 그 이야기가 아직 목록에 없을 때만. 골든의 "이어짐" 장면 첫 칸의 글 그대로 (날짜 · 근거가 거기 있다)
                const coming = nextOf(ep) ? undefined : ep.scenes.next.coming[0];
                return (
                  <a key={ep.series.code} className="td-series" href={realPath(ep)} data-testid={`cont-${ep.series.code}`}>
                    <strong>{ep.series.name}</strong>
                    <span className="td-series-sub">{ep.series.sub}</span>
                    {/* 시리즈 줄 — 골든의 track 그대로 (지나온 화 · 지금). "다음 화" 칸은 줄에 놓지 않는다 — 예고는 날짜가 있을 때만 아래에 따로 */}
                    <ol className="ep-track">
                      {ep.track
                        .filter((e) => e.state !== "next")
                        .map((e) => (
                          <li key={e.no.t} data-state={e.state}>
                            <span className="ep-track-dot" aria-hidden="true" />
                            <span className="ep-track-no">{e.no.t}</span>
                            <span className="ep-track-title">{e.title.t}</span>
                          </li>
                        ))}
                    </ol>
                    {coming && /\d+월 \d+일/.test(coming.body.t) ? (
                      <p className="td-next">
                        <em>{HOME.contNext}</em>
                        {coming.body.t}
                      </p>
                    ) : null}
                    <span className="td-series-go">
                      {ep.scenes.cover.episode.t} {HOME.contGo}
                      <Arrow />
                    </span>
                  </a>
                );
              })}
            </section>
          ) : null}

          <section className="td-sec" aria-labelledby="td-concept">
            <h2 id="td-concept" className="td-label">
              {HOME.conceptLabel}
            </h2>
            <p className="td-secnote">{HOME.conceptNote}</p>
            <ul className="td-concepts">
              {concepts.map((g) => (
                <li key={g.names.join()}>
                  {g.stories.map((x, i) => (
                    <a key={x.path} href={x.path} data-end={i > 0 ? "" : undefined}>
                      {x.title}
                    </a>
                  ))}
                  <p>
                    <span>{HOME.conceptBoth}</span>
                    {g.names.map((n) => (
                      <b key={n}>{n}</b>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            <a className="ep-map-button td-mapgo" href="/map" data-testid="to-map">
              {HOME.mapGo}
              <Arrow />
            </a>
          </section>

          <section className="td-sec hm-about" aria-labelledby="hm-about">
            <h2 id="hm-about" className="td-label">
              {HOME.aboutLabel}
            </h2>
            <p>{HOME.about}</p>
          </section>

          <p className="td-foot">{HOME.preview}</p>
        </main>
      </div>
    </div>
  );
}
