import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Rich } from "../../../episode/kit/parts";
import { COUNT_NOUN, COUNT_WORD, TODAY_COPY as C } from "./copy";
import { TODAY, continues, minutesOfLong, minutesOfShort, sharedConcepts, type TodayItem } from "./data";
import { PaletteDock } from "./palette/PaletteDock";

// UX-7 — "오늘" 첫 화면 **시안** (D79). 실제 첫 화면 (/)은 그대로다 — 여기는 lab.
// 보이려는 것 셋: (1) 하루 3 ~ 5편이 한 줄로 놓인다 · 무게 둘 (긴 이야기 · 짧은 이야기) (2) **시리즈는 약속이 아니라 결과다** — "N화" · 시리즈 줄 · 지난 이야기는
// 둘째 이야기가 실제로 있는 주제 (지금은 금리)에만 생기고, 나머지는 주제 이름만 (3) 번호가 없어도 이야기는 개념으로 이어진다.
// 정적이다 · 아무것도 저장하지 않는다 · 긴 이야기의 글은 골든의 글자 그대로다. 카드는 시안 회차 화면 (/lab/episode/*)으로 간다 — 고른 색이 거기서도 이어지게 (실제 주소는 종이 톤 그대로다).
export const dynamic = "force-static";
export const metadata: Metadata = { title: C.metaTitle };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const oneLine = (s: string) => s.replace(/\n/g, " ");

function Weight({ long, minutes, lab }: { long: boolean; minutes: number; lab: boolean }) {
  return (
    <p className="td-weight" data-weight={long ? "long" : "short"}>
      <b>{long ? C.long : C.short}</b>
      <span>
        {C.about} {minutes}
        {C.minutes}
      </span>
      <span data-lab={lab ? "" : undefined}>{lab ? C.lab : C.noLab}</span>
    </p>
  );
}

function Long({ item, lead }: { item: Extract<TodayItem, { kind: "long" }>; lead: boolean }) {
  const { ep, Art } = item;
  const c = ep.scenes.cover;
  const cont = continues(ep);
  return (
    <article className="td-card" data-kind="long" data-lead={lead ? "" : undefined} data-cont={cont ? "" : undefined} data-testid={`card-${ep.code}`}>
      <a className="td-main" href={ep.path}>
        {/* 이어지는 이야기면 주제 이름 + 몇 화. 단편이면 주제 이름만 — 번호 없음 */}
        <p className="td-topic">
          <span>{cont ? C.contLabel : C.topic}</span>
          <strong>{ep.series.name}</strong>
          {cont ? <em>{c.episode.t}</em> : null}
        </p>
        {lead ? (
          <div className="ep-cover-art td-art">
            <Art />
          </div>
        ) : null}
        <h3 className="td-title">
          <Rich text={lead ? c.title : oneLine(c.title)} />
        </h3>
        <p className="td-dek">{c.dek.t}</p>
        <p className="td-meta">{c.meta.t}</p>
        <Weight long minutes={minutesOfLong(ep)} lab={ep.solve.lab !== null} />
        {lead ? (
          <span className="td-go">
            {C.go}
            <Arrow />
          </span>
        ) : (
          <span className="td-arrow" aria-hidden="true">
            <Arrow />
          </span>
        )}
      </a>
      {cont ? (
        <details className="td-recap" data-testid={`recap-${ep.code}`}>
          <summary>
            {C.recap}
            <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          {/* 골든의 "지난 이야기" 글 그대로 (표지의 recap) */}
          {c.recap.map((r) => (
            <p key={r.t}>
              <Rich text={r.t} />
            </p>
          ))}
        </details>
      ) : null}
    </article>
  );
}

function Short({ item }: { item: Extract<TodayItem, { kind: "short" }> }) {
  const { story, path } = item;
  const c = story.scenes.cover;
  return (
    <article className="td-card" data-kind="short" data-testid="card-short">
      <a className="td-main" href={path}>
        <p className="td-topic">
          <span>{C.topic}</span>
          <strong>{story.shelf.name}</strong>
          <i>{C.sibling}</i>
        </p>
        <h3 className="td-title">{oneLine(c.title)}</h3>
        <Weight long={false} minutes={minutesOfShort(story)} lab={false} />
        <span className="td-arrow" aria-hidden="true">
          <Arrow />
        </span>
      </a>
    </article>
  );
}

export default function Page() {
  const longs = TODAY.filter((x) => x.kind === "long");
  const shorts = TODAY.filter((x) => x.kind === "short");
  const stories = longs.length + shorts.length;
  const count = C.count.replace("{n}", COUNT_WORD[stories]!).replace("{long}", COUNT_NOUN[longs.length]!).replace("{short}", COUNT_NOUN[shorts.length]!);
  const cont = longs.filter((x) => continues(x.ep));
  const single = longs.filter((x) => !continues(x.ep));
  const concepts = sharedConcepts();
  return (
    <div className="ep-root td-root" data-testid="today">
      <PaletteDock tag={C.draft} />
      <div className="ep-scroll">
        <main className="ep-scene td">
          <header className="td-top">
            <span className="td-mark">{C.mark}</span>
          </header>
          <section className="td-intro">
            <h1>{C.title}</h1>
            <p>{count}</p>
          </section>

          <section className="td-list" aria-label={C.title}>
            {TODAY.map((item, i) =>
              item.kind === "long" ? (
                <Long key={item.ep.code} item={item} lead={i === 0} />
              ) : item.kind === "short" ? (
                <Short key={item.story.code} item={item} />
              ) : (
                <div key="empty" className="td-card" data-kind="empty" data-testid="card-empty">
                  <strong>{C.emptyTitle}</strong>
                  <p>{C.emptyNote}</p>
                </div>
              ),
            )}
          </section>

          <section className="td-sec" aria-labelledby="td-cont">
            <h2 id="td-cont" className="td-label">
              {C.contLabel}
            </h2>
            <p className="td-secnote">{C.contNote}</p>
            {cont.map(({ ep }) => {
              // 다음 이야기 예고 — 달력에 날짜가 있을 때만 (D79 ①). 골든의 "이어짐" 장면 첫 칸의 글 그대로 (날짜 · 근거가 거기 있다)
              const next = ep.scenes.next.coming[0];
              return (
                <a key={ep.code} className="td-series" href={ep.path} data-testid={`cont-${ep.series.code}`}>
                  <strong>{ep.series.name}</strong>
                  <span className="td-series-sub">{ep.series.sub}</span>
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
                  {next && /\d+월 \d+일/.test(next.body.t) ? (
                    <p className="td-next">
                      <em>{C.contNext}</em>
                      {next.body.t}
                    </p>
                  ) : null}
                  <span className="td-series-go">
                    {ep.scenes.cover.episode.t} {C.contGo}
                    <Arrow />
                  </span>
                </a>
              );
            })}

            <h3 className="td-sublabel">{C.shelfLabel}</h3>
            <p className="td-secnote">{C.shelfNote}</p>
            <ul className="td-shelf">
              {single.map(({ ep }) => {
                const withShort = shorts.some((x) => x.story.shelf.code === ep.series.code);
                return (
                  <li key={ep.code}>
                    <a href={ep.path}>
                      <strong>{ep.series.name}</strong>
                      <span>{withShort ? C.shelfOneAndShort : C.shelfOne}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="td-sec" aria-labelledby="td-concept">
            <h2 id="td-concept" className="td-label">
              {C.conceptLabel}
            </h2>
            <p className="td-secnote">{C.conceptNote}</p>
            <ul className="td-concepts">
              {concepts.map((g) => (
                <li key={g.names.join()}>
                  {g.stories.map((x, i) => (
                    <a key={x.path} href={x.path} data-end={i > 0 ? "" : undefined}>
                      {x.title}
                    </a>
                  ))}
                  <p>
                    <span>{C.conceptBoth}</span>
                    {g.names.map((n) => (
                      <b key={n}>{n}</b>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            <a className="ep-map-button td-mapgo" href="/lab/today/map" data-testid="to-map">
              {C.mapGo}
              <Arrow />
            </a>
          </section>

          <p className="td-foot">
            {C.draftNote} {C.foot}{" "}
            <a href="/" data-testid="to-real">
              {C.footLink}
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
