import { bundle, hrefOfLine, latestPerSeries, nextOf, numbered, oneLine, realPath, type Line } from "../../../episode/catalog";
import { HOME, countNoun, countWord } from "../../../episode/home-copy";
import { HomeLongCard, HomeShortCard } from "../../../episode/home/cards";
import { Rich } from "../../../episode/kit/parts";
import { Arrow } from "../../../episode/today/cards";
import { sharedConcepts } from "../../../episode/today/concepts";
import { Calendar, type CalDay } from "./Calendar";
import { byDay, dayLabel, dayParts, keyOf, monthKeys, monthOf, sampleWeek, type DayGroup } from "./days";
import "../../../episode/episode.css";
import "../../../episode/episodes/fomc/fomc.css";
import "../../../episode/episodes/pipc/pipc.css";
import "../../../episode/today/today.css";
import "../../home.css";
import "./home-days.css";

// UX-12 (D136) — 첫 화면의 "지난 이야기"를 날짜별로 묶은 **시안 둘**의 한 몸. lab 전용이다 — 실제 첫 화면 (app/page.tsx)은 그대로다.
// **"지난 이야기" 칸 말고는 실제 첫 화면 (app/page.tsx)을 그대로 옮겨 적었다** (같은 목록 · 같은 카드 부품 · 같은 글 · 같은 css) — 둘을 견줄 때 다른 것이 섞이지 않게.
// 다른 것: ① 맨 위의 시안 띠 (가 ↔ 나 · 견본) ② 지난 이야기 = 날짜 머리 + 작은 줄 카드 (가 = 다 펼침 · 나 = 날마다 접힘 — <details> · 자바스크립트 없음).
// 화면 글 (C)은 시안의 것이다 — 편 수는 숫자로 적는다 (화면이 목록에서 센 수).

export type Variant = "a" | "b" | "c" | "d" | "e";

const C = {
  before: "그 전",
  n: "{n}편",
  long: "긴",
  short: "짧은",
  strip: { a: "시안 가 · 날짜마다 펼침", b: "시안 나 · 날짜마다 접힘", c: "시안 나 · 담백 판", d: "시안 · 날짜 판", e: "시안 · 달력 판" },
  month: "{m}월",
  /** 띠의 길 — 가 ↔ 나 (UX-12) · 나 ↔ 담백 판 (UX-12b) · 담백 판 ↔ 날짜 판 (UX-12c) */
  links: { a: [["b", "나 보기"]], b: [["a", "가 보기"], ["c", "담백 판"]], c: [["b", "나 보기"], ["d", "날짜 판"]], d: [["c", "담백 판"], ["e", "달력 판"]], e: [["d", "날짜 판"]] },
  /** 달력 판 (UX-12d) */
  cal: {
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    n: "{n}편",
    newest: "맨 위에 있는 이야기예요",
    prev: "앞 달",
    next: "다음 달",
    cell: "{day}, 이야기 {n}편",
    cellNewest: "{day}, 이야기 {n}편, 가장 새 이야기",
  },
  many: "일주일 쌓인 모습",
  now: "지금 목록으로",
  sample: "견본 — 날이 쌓인 모습",
  sampleNote: "지금 이야기를 지난 7일에 되풀이해 깔았어요. 실제 주소에는 없어요.",
} as const;

const dayTitle = (day: string): string => {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})$/.exec(day) ?? [];
  return HOME.titleDay.replace("{m}", String(Number(m))).replace("{d}", String(Number(d)));
};
const TODAY_SCRIPT = `(function(){try{var h=document.currentScript.previousElementSibling;var d=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Seoul"}).format(new Date());if(h&&h.getAttribute("data-day")===d)h.textContent=${JSON.stringify(HOME.titleToday)}}catch(e){}})()`;

function Cards({ lines, lead }: { lines: readonly Line[]; lead: boolean }) {
  return (
    <>
      {lines.map((line, i) =>
        line.kind === "long" ? (
          <HomeLongCard key={line.ep.code} line={line} href={hrefOfLine(line)} lead={lead && i === 0} C={HOME} />
        ) : (
          <HomeShortCard key={line.story.code} line={line} href={hrefOfLine(line)} C={HOME} />
        ),
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────── 지난 이야기 — 날짜 묶음 · 작은 줄 카드 (시안의 것)

const titleOf = (line: Line): string => oneLine(line.kind === "long" ? line.ep.scenes.cover.title : line.story.scenes.cover.title);
const plain = (s: string): string => s.replace(/\*\*/g, "");

/** 가: "2편" · 나 (접힌 줄 — 안이 안 보인다): "긴 1편 · 짧은 1편" */
const tally = (lines: readonly Line[], split: boolean): string => {
  const n = (k: number) => C.n.replace("{n}", String(k));
  if (!split) return n(lines.length);
  const longs = lines.filter((x) => x.kind === "long").length;
  return [longs ? `${C.long} ${n(longs)}` : "", lines.length - longs ? `${C.short} ${n(lines.length - longs)}` : ""].filter(Boolean).join(" · ");
};

/**
 * 작은 줄 카드 — 주제 이름 (+ 이어지는 이야기면 몇 화) · 제목 · 국내 / 해외 · 긴 / 짧은. 그림 · 소개 글 · 뉴스 한 줄 · 지난 이야기 30초 · 카테고리 · 날 글은 뺐다 (까닭: logs/frontend/UX-12.md ②).
 * 글은 실제 카드와 같은 곳에서 읽는다 (이야기 파일의 글자 그대로 · 제목의 줄바꿈만 빈칸으로)
 */
function Row({ line }: { line: Line }) {
  const long = line.kind === "long";
  const series = long ? line.ep.series : line.story.series;
  return (
    <li>
      <a className="hd-row" href={hrefOfLine(line)} data-kind={line.kind} data-testid={`row-${long ? line.ep.code : line.story.code}`}>
        <span className="hd-row-body">
          <span className="hd-row-topic">
            <strong>{series.name}</strong>
            {long && numbered(series.code) ? <em>{line.ep.scenes.cover.episode.t}</em> : null}
          </span>
          <span className="hd-row-title">{long ? <Rich text={titleOf(line)} /> : titleOf(line)}</span>
          <span className="hd-row-meta">
            <span data-place={line.place === "해외" ? "abroad" : "home"}>{line.place}</span>
            <span data-weight={line.kind}>{long ? HOME.long : HOME.short}</span>
          </span>
        </span>
        <svg className="hd-row-go" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </li>
  );
}

function Rows({ lines }: { lines: readonly Line[] }) {
  return (
    <ul className="hd-rows">
      {lines.map((line) => (
        <Row key={keyOf(line)} line={line} />
      ))}
    </ul>
  );
}

/** 가 — 날짜 머리 + 작은 줄이 다 보인다 */
function DaysOpen({ groups }: { groups: readonly DayGroup[] }) {
  return (
    <div className="hd-days" data-variant="a">
      {groups.map((g) => (
        <section key={g.day ?? "before"} className="hd-day" data-day={g.day ?? "before"} data-testid="day">
          <div className="hd-day-head">
            <h3>{g.day ? dayLabel(g.day) : C.before}</h3>
            <span>{tally(g.lines, false)}</span>
          </div>
          <Rows lines={g.lines} />
        </section>
      ))}
    </div>
  );
}

/** 나 — 날짜 한 줄 (날 · 편 수 · 제목이 살짝)을 누르면 그날 작은 줄이 펼쳐진다. 바로 위 지난 날 하나만 펼쳐 둔다 (까닭: 로그 ②) */
function DaysFold({ groups }: { groups: readonly DayGroup[] }) {
  return (
    <div className="hd-days" data-variant="b">
      {groups.map((g, i) => (
        <details key={g.day ?? "before"} className="hd-fold" data-day={g.day ?? "before"} data-testid="day" open={i === 0 && g.day !== null}>
          <summary>
            <span className="hd-fold-text">
              <span className="hd-fold-head">
                <h3>{g.day ? dayLabel(g.day) : C.before}</h3>
                <span>{tally(g.lines, true)}</span>
              </span>
              <span className="hd-fold-peek">{g.lines.map((x) => plain(titleOf(x))).join(" · ")}</span>
            </span>
            <svg className="hd-fold-mark" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <Rows lines={g.lines} />
        </details>
      ))}
    </div>
  );
}

/**
 * 나 담백 판 (UX-12b · D138 — 도윤 "접히는 형식이 좋다 · 더 담백하게 · 한 화면에 뭐가 너무 많다"). 나에서 **덜어 낸 것**이다:
 * 접힌 줄 = 날짜 · 편 수 · 꺾쇠 한 줄 (살짝 보이는 제목 · 긴 / 짧은 셈 없음) · 날마다 상자 없이 가는 선 · 펼친 줄 = 제목 + 작은 회색 한 줄 (주제 이름 · 이어지는 이야기면 몇 화 · 긴 이야기면 그 말).
 * 색은 먹 + 회색뿐. 펼쳐 두는 날은 나와 같다 (바로 위 지난 날 하나)
 */
function DaysPlain({ groups }: { groups: readonly DayGroup[] }) {
  return (
    <div className="hc-days" data-variant="c">
      {groups.map((g, i) => (
        <details key={g.day ?? "before"} className="hc-fold" data-day={g.day ?? "before"} data-testid="day" open={i === 0 && g.day !== null}>
          <summary>
            <h3>{g.day ? dayLabel(g.day) : C.before}</h3>
            <span>{tally(g.lines, false)}</span>
            <svg className="hc-mark" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="hc-rows">
            {g.lines.map((line) => {
              const long = line.kind === "long";
              const series = long ? line.ep.series : line.story.series;
              return (
                <li key={keyOf(line)}>
                  <a className="hc-row" href={hrefOfLine(line)} data-kind={line.kind} data-testid={`row-${long ? line.ep.code : line.story.code}`}>
                    <span className="hc-row-title">{long ? <Rich text={titleOf(line)} /> : titleOf(line)}</span>
                    <span className="hc-row-sub">
                      <span>{series.name}</span>
                      {long && numbered(series.code) ? <span>{line.ep.scenes.cover.episode.t}</span> : null}
                      {long ? <span>{HOME.long}</span> : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}

/**
 * 날짜 판 (UX-12c · D140 — 도윤 "날짜마다 좀 구분 가게 더 예쁘게"). 담백 판의 줄 (제목 + 회색 한 줄)은 그대로고 **날짜가 왼쪽 칸으로 나왔다**:
 * 큰 날 숫자 + 그 아래 작은 "11월 · 화" (요일은 날짜에서 계산). 그날의 이야기는 오른쪽 칸에 — 날마다 왼쪽 숫자 하나 + 오른쪽 한 덩이.
 * 펼친 날은 숫자가 먹색, 접힌 날은 회색. 날 없는 묶음 ("그 전")은 숫자 자리에 그 말이 선다. 상자 · 강조색 · 줄마다 꺾쇠 없음 (담백 판 그대로)
 */
function DaysDated({ groups }: { groups: readonly DayGroup[] }) {
  return (
    <div className="he-days" data-variant="d">
      {groups.map((g, i) => {
        const parts = g.day ? dayParts(g.day) : null;
        return (
          <details key={g.day ?? "before"} className="he-fold" data-day={g.day ?? "before"} data-testid="day" open={i === 0 && g.day !== null}>
            <summary>
              {/* 읽기 도구에는 "11월 17일" 한 덩이로 (머리 h3) — 눈에는 숫자 · 달 · 요일로 */}
              <h3 className="he-date" aria-label={g.day ? `${dayLabel(g.day)} ${parts!.weekday}요일` : C.before}>
                {parts ? (
                  <>
                    <b>{parts.date}</b>
                    <small>
                      {C.month.replace("{m}", String(parts.month))} · {parts.weekday}
                    </small>
                  </>
                ) : (
                  <i>{C.before}</i>
                )}
              </h3>
              <span className="he-count">{tally(g.lines, false)}</span>
              <svg className="he-mark" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <ul className="he-rows">
              {g.lines.map((line) => {
                const long = line.kind === "long";
                const series = long ? line.ep.series : line.story.series;
                return (
                  <li key={keyOf(line)}>
                    <a className="he-row" href={hrefOfLine(line)} data-kind={line.kind} data-testid={`row-${long ? line.ep.code : line.story.code}`}>
                      <span className="he-row-title">{long ? <Rich text={titleOf(line)} /> : titleOf(line)}</span>
                      <span className="he-row-sub">
                        <span>{series.name}</span>
                        {long && numbered(series.code) ? <span>{line.ep.scenes.cover.episode.t}</span> : null}
                        {long ? <span>{HOME.long}</span> : null}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

/**
 * 달력 판 (UX-12d · D142 — 도윤 "실제로 달력 모양으로"). 이번 달 7칸 달력 (칸 = 날 숫자 + 이야기가 있으면 점 하나) + 그 아래 고른 날의 이야기 (줄은 담백 판 그대로).
 * 달력에는 **낸 날이 적힌 이야기 전부**가 선다 — 맨 위 묶음의 날 (가장 새 날 · 테 두른 칸)도. 처음 고른 날은 바로 위 지난 날 (없으면 가장 새 날).
 * 날 없는 묶음 ("그 전")은 달력에 넣지 않는다 (날짜를 지어내지 않는다) — 달력 아래 접힌 한 줄. 날 고르기는 클라이언트 부품 (./Calendar.tsx)
 */
function DaysCalendar({ newest, top, groups }: { newest: string | null; top: readonly Line[]; groups: readonly DayGroup[] }) {
  const dated = [...(newest ? [{ day: newest, lines: [...top] }] : []), ...groups.filter((g): g is DayGroup & { day: string } => g.day !== null)];
  const before = groups.find((g) => g.day === null);
  const rowOf = (line: Line) => {
    const long = line.kind === "long";
    const series = long ? line.ep.series : line.story.series;
    return {
      href: hrefOfLine(line),
      code: long ? line.ep.code : line.story.code,
      title: plain(titleOf(line)),
      sub: [series.name, ...(long && numbered(series.code) ? [line.ep.scenes.cover.episode.t] : []), ...(long ? [HOME.long] : [])],
    };
  };
  const days: Record<string, CalDay> = Object.fromEntries(dated.map((g) => [g.day, { day: g.day, label: `${dayLabel(g.day)} ${dayParts(g.day).weekday}요일`, rows: g.lines.map(rowOf) }]));
  const months = monthKeys(dated.map((g) => g.day)).map((k) => ({ ...monthOf(k), title: C.month.replace("{m}", String(monthOf(k).month)) }));
  const initial = dated.find((g) => g.day !== newest)?.day ?? newest;
  return (
    <div className="hf-wrap" data-variant="e">
      {initial ? <Calendar months={months} days={days} newest={newest} initial={initial} C={C.cal} /> : null}
      {before ? (
        <details className="hf-before" data-day="before" data-testid="day">
          <summary>
            <h3>{C.before}</h3>
            <span>{tally(before.lines, false)}</span>
            <svg className="hc-mark" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="hc-rows">
            {before.lines.map((line) => {
              const r = rowOf(line);
              return (
                <li key={keyOf(line)}>
                  <a className="hc-row" href={r.href} data-testid={`row-${r.code}`}>
                    <span className="hc-row-title">{r.title}</span>
                    <span className="hc-row-sub">
                      {r.sub.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────── 화면

export function HomeDays({ variant, many }: { variant: Variant; many: boolean }) {
  const real = bundle();
  const { day, top } = real;
  // 견본이면 지난 이야기만 바꾼다 (맨 위 묶음 · 아래 칸은 지금 목록 그대로)
  const rest = many && day ? sampleWeek(day, top, real.rest) : real.rest;
  const groups = byDay(rest);
  const longs = top.filter((x) => x.kind === "long").length;
  const count = (day ? HOME.count : HOME.countRecent).replace("{n}", countWord(top.length));
  const tallyTop = HOME.tally.replace("{long}", countNoun(longs)).replace("{short}", countNoun(top.length - longs));
  // 날짜 판 (d)은 "이어지는 이야기" 칸이 없다 (UX-12c · D140 — 도윤 "없는 게 더 이쁠 것 같다")
  const cont = variant === "d" || variant === "e" ? [] : latestPerSeries().filter((x) => numbered(x.ep.series.code));
  const concepts = sharedConcepts([...top, ...real.rest], hrefOfLine);
  const topics = latestPerSeries().map(({ ep }) => ({ code: ep.series.code, name: ep.series.name, tools: ep.tools.map((x) => x.name) }));
  const here = `/lab/home-days/${variant}`;
  return (
    <div className="ep-root td-root hm-root" data-testid="home-days" data-variant={variant}>
      <div className="ep-scroll">
        <main className="ep-scene td hm">
          {/* 시안 띠 — 실제 첫 화면에는 없다 */}
          <nav className="hd-strip" data-many={many ? "" : undefined} data-testid="strip">
            <strong>{many ? C.sample : C.strip[variant]}</strong>
            <span>
              {C.links[variant].map(([to, label]) => (
                <a key={to} href={`/lab/home-days/${to}${many ? "?many=1" : ""}`}>
                  {label}
                </a>
              ))}
              <a href={many ? here : `${here}?many=1`}>{many ? C.now : C.many}</a>
            </span>
            {many ? <p>{C.sampleNote}</p> : null}
          </nav>
          <header className="td-top hm-top">
            <span className="td-mark hm-mark">
              <span>{HOME.mark}</span>
            </span>
            <span className="hm-preview">{HOME.previewTag}</span>
          </header>
          <section className="hm-hero">
            <p className="hm-tagline">
              <Rich text={HOME.tagline} />
            </p>
            <p className="hm-sub">{HOME.sub}</p>
          </section>
          <section className="hm-intro">
            <h1 data-day={day ?? undefined} data-testid="head" suppressHydrationWarning>
              {day ? dayTitle(day) : HOME.titleRecent}
            </h1>
            {day ? <script dangerouslySetInnerHTML={{ __html: TODAY_SCRIPT }} /> : null}
            <p>
              {count} <span className="hm-tally">{tallyTop}</span>
            </p>
          </section>

          <section className="td-list" aria-label={day ? dayTitle(day) : HOME.titleRecent}>
            <Cards lines={top} lead={top[0]?.kind === "long"} />
          </section>

          {/* ── 여기만 시안이다: 지난 이야기를 날짜별로 */}
          {groups.length ? (
            <section className="td-sec hd-rest" aria-labelledby="td-rest">
              <h2 id="td-rest" className="td-label hm-restlabel">
                {HOME.restLabel}
              </h2>
              {variant === "a" ? <DaysOpen groups={groups} /> : variant === "b" ? <DaysFold groups={groups} /> : variant === "c" ? <DaysPlain groups={groups} /> : variant === "d" ? <DaysDated groups={groups} /> : <DaysCalendar newest={day} top={top} groups={groups} />}
            </section>
          ) : null}

          {cont.length ? (
            <section className="td-sec hm-cont" aria-labelledby="td-cont">
              <h2 id="td-cont" className="td-label hm-h2">
                {HOME.contLabel}
              </h2>
              <p className="td-secnote">{HOME.contNote}</p>
              {cont.map(({ ep }) => {
                const coming = nextOf(ep) ? undefined : ep.scenes.next.coming[0];
                return (
                  <a key={ep.series.code} className="td-series" href={realPath(ep)} data-testid={`cont-${ep.series.code}`}>
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

          <section className="td-sec hm-map" aria-labelledby="td-concept">
            <h2 id="td-concept" className="hm-map-label">
              {HOME.conceptLabel}
            </h2>
            <p className="hm-map-title">
              <Rich text={HOME.conceptTitle} />
            </p>
            <ul className="hm-map-topics">
              {topics.map((t) => (
                <li key={t.code}>
                  <span>{t.name}</span>
                  <p>
                    {t.tools.map((n) => (
                      <b key={n}>{n}</b>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            <p className="hm-map-note">{HOME.conceptNote}</p>
            {concepts.length ? (
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
            ) : null}
            <a className="ep-map-button td-mapgo" href="/map" data-testid="to-map">
              {HOME.mapGo}
              <Arrow />
            </a>
          </section>

          <section className="td-sec hm-about" aria-labelledby="hm-about">
            <h2 id="hm-about" className="td-label">
              {HOME.aboutLabel}
            </h2>
            <p className="hm-about-lead">{HOME.aboutLead}</p>
            <ol className="hm-steps">
              {HOME.aboutSteps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </section>

          <p className="td-foot">{HOME.preview}</p>
        </main>
      </div>
    </div>
  );
}
