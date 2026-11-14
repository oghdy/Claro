import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { Arrow, LongCard, ShortCard, continues } from "../../../episode/today/cards";
import { COUNT_NOUN, COUNT_WORD, TODAY_COPY as C } from "./copy";
import { SHORT, TODAY, labHref, sharedConcepts } from "./data";
import { PaletteDock } from "./palette/PaletteDock";

// UX-7 — "오늘" 첫 화면 **시안** (D79). 실제 첫 화면 (/)은 그대로다 — 여기는 lab.
// 보이려는 것 셋: (1) 하루 3 ~ 5편이 한 줄로 놓인다 · 무게 둘 (긴 이야기 · 짧은 이야기) (2) **시리즈는 약속이 아니라 결과다** — "N화" · 시리즈 줄 · 지난 이야기는
// 둘째 이야기가 실제로 있는 주제 (지금은 금리)에만 생기고, 나머지는 주제 이름만 (3) 번호가 없어도 이야기는 개념으로 이어진다.
// F-E2: 실제 첫 화면 (/)이 이 꼴이 됐다 — **카드는 같은 부품이고 (episode/today/cards), 이야기는 같은 목록에서 온다** (episode/catalog.tsx). 여기 남은 것은 시안의 것: 색 스위치 · 견본 자리 · 번호 규칙을 설명하는 구역 둘.
// 정적이다 · 아무것도 저장하지 않는다 · 긴 이야기의 글은 골든의 글자 그대로다. 카드는 시안 회차 화면 (/lab/episode/*)으로 간다 — 고른 색이 거기서도 이어지게 (실제 주소는 종이 톤 그대로다).
export const dynamic = "force-static";
export const metadata: Metadata = { title: C.metaTitle };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

/** 시안의 주소 — 긴 이야기는 회차 시안 화면 (/lab/episode/*)으로, 짧은 이야기는 /lab/today/short 로 (고른 색이 거기서도 이어지게) */
const href = labHref;

export default function Page() {
  const longs = TODAY.filter((x) => x.kind === "long");
  const shorts = TODAY.filter((x) => x.kind === "short");
  const stories = longs.length + shorts.length;
  const count = C.count.replace("{n}", COUNT_WORD[stories]!).replace("{long}", COUNT_NOUN[longs.length]!).replace("{short}", COUNT_NOUN[shorts.length]!);
  const cont = longs.filter((x) => continues(x));
  const single = longs.filter((x) => !continues(x));
  const concepts = sharedConcepts();
  return (
    <div className="ep-root td-root" data-testid="today">
      <PaletteDock tag={C.draft} />
      <div className="ep-scroll">
        <main className="ep-scene td">
          <header className="td-top">
            <span className="td-mark">
              <span>{C.mark}</span>
            </span>
          </header>
          <section className="td-intro">
            <h1>{C.title}</h1>
            <p>{count}</p>
          </section>

          <section className="td-list" aria-label={C.title}>
            {TODAY.map((item, i) =>
              item.kind === "long" ? (
                <LongCard key={item.ep.code} line={item} href={href(item)} lead={i === 0} C={C} />
              ) : item.kind === "short" ? (
                <ShortCard key={item.story.code} line={item} href={href(item)} C={C} aside={item.story.code === SHORT.code ? C.sibling : undefined} />
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
                const withShort = shorts.some((x) => x.story.series.code === ep.series.code);
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
