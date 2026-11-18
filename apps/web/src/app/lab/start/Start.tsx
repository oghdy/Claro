import { bundle, hrefOfLine, numbered, oneLine, type Line } from "../../../episode/catalog";
import { HOME } from "../../../episode/home-copy";
import { Rich } from "../../../episode/kit/parts";
import { Calendar, type CalDay } from "../home-days/Calendar";
import { byDay, dayLabel, dayParts, keyOf, monthKeys, monthOf, sampleWeek, type DayGroup } from "../home-days/days";
import "../../../episode/episode.css";
import "../../../episode/today/today.css";
import "../home-days/home-days.css";
import "./start.css";

// UX-13 (D144) — 깔끔한 시작 화면 (/lab/start) + 따로 선 달력 화면 (/lab/start/days). **lab 전용이다** — 실제 첫 화면 (app/page.tsx) · /map 은 그대로다.
// 시작 화면에 있는 것: 머리 · 한마디 · 가장 새 날의 이야기 (실제 첫 화면과 같은 묶음 — catalog.bundle 의 top · 같은 머리 규칙) · 문 둘 (지난 이야기 달력 · 개념 지도).
// 없는 것: 지난 이야기 목록 · 이어지는 이야기 · 개념 지도 먹색 판 · 소개. 상자는 문 둘뿐이고 이야기는 글줄이다 (먹 + 회색 · 강조색은 Claro 표의 점 하나).
// 달력 화면은 UX-12d 의 달력 부품 (../home-days/Calendar.tsx) · 묶는 셈 (../home-days/days.ts) · 줄 꼴 (.hf-* · .hc-row — ../home-days/home-days.css)을 그대로 쓴다.
// 이야기의 글은 파일의 글자 그대로 (제목의 줄바꿈만 빈칸으로). 화면 글은 home-copy.ts 의 것 + 아래 C (누를 곳의 이름 — 소개 문구가 아니다). 저장하는 것 없음.

export const START = "/lab/start";
export const DAYS = "/lab/start/days";

const C = {
  n: "{n}편",
  month: "{m}월",
  before: "그 전",
  /** 문 둘 — 이름은 home-copy 의 칸 이름 그대로 (restLabel · conceptLabel) · 아래 한 줄은 가는 곳의 꼴 */
  daysSub: "날짜별로 보기",
  mapSub: "이야기에서 주운 개념",
  doors: "더 보기",
  cal: {
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    n: "{n}편",
    newest: "가장 새 이야기예요",
    prev: "앞 달",
    next: "다음 달",
    cell: "{day}, 이야기 {n}편",
    cellNewest: "{day}, 이야기 {n}편, 가장 새 이야기",
  },
  sample: "견본 — 날이 쌓인 모습",
  sampleNote: "지금 이야기를 지난 7일에 되풀이해 깔았어요. 실제 주소에는 없어요.",
  now: "지금 목록으로",
} as const;

const dayTitle = (day: string): string => {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})$/.exec(day) ?? [];
  return HOME.titleDay.replace("{m}", String(Number(m))).replace("{d}", String(Number(d)));
};
/** 실제 첫 화면 (app/page.tsx)의 그 한 줄 그대로 — 읽는 기기의 한국 날짜가 그날일 때만 머리를 "오늘의 이야기"로 */
const TODAY_SCRIPT = `(function(){try{var h=document.currentScript.previousElementSibling;var d=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Seoul"}).format(new Date());if(h&&h.getAttribute("data-day")===d)h.textContent=${JSON.stringify(HOME.titleToday)}}catch(e){}})()`;

const titleOf = (line: Line): string => oneLine(line.kind === "long" ? line.ep.scenes.cover.title : line.story.scenes.cover.title);
const plain = (s: string): string => s.replace(/\*\*/g, "");
const codeOf = (line: Line): string => (line.kind === "long" ? line.ep.code : line.story.code);
const count = (k: number): string => C.n.replace("{n}", String(k));

const Go = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Mark() {
  return (
    <header className="td-top sp-top">
      <span className="td-mark sp-mark">
        <span>{HOME.mark}</span>
      </span>
      <span className="sp-preview">{HOME.previewTag}</span>
    </header>
  );
}

// ─────────────────────────────────────────────────────────── 시작 화면

/** 가장 새 날의 이야기 한 줄 — 상자 없음. 주제 이름 (회색) · 제목 · 꼬리 (국내 / 해외 · 카테고리 · 긴 이야기면 그 말). 첫 줄만 크고, 들어가는 말이 붙는다 */
function Story({ line, lead }: { line: Line; lead: boolean }) {
  const long = line.kind === "long";
  const series = long ? line.ep.series : line.story.series;
  return (
    <li>
      <a className="sp-story" href={hrefOfLine(line)} data-lead={lead ? "" : undefined} data-kind={line.kind} data-testid={`story-${codeOf(line)}`}>
        <span className="sp-story-topic">
          {series.name}
          {long && numbered(series.code) ? <em>{line.ep.scenes.cover.episode.t}</em> : null}
        </span>
        <span className="sp-story-title">{long ? <Rich text={titleOf(line)} /> : titleOf(line)}</span>
        {long ? <span className="sp-story-dek">{line.ep.scenes.cover.dek.t}</span> : null}
        <span className="sp-story-meta">
          <span>{line.place}</span>
          <span>{line.category}</span>
          {long ? <span>{HOME.long}</span> : null}
        </span>
        {lead ? (
          <span className="sp-story-go">
            {HOME.go}
            <Go />
          </span>
        ) : null}
      </a>
    </li>
  );
}

/** 달력 문의 작은 그림 — 가장 새 날이 든 달의 칸을 점으로 (이야기 있는 날 = 먹색 점). 꾸밈이다 — 읽기 도구에는 숨긴다 */
function MiniMonth({ days }: { days: readonly string[] }) {
  const newest = [...days].sort().pop();
  if (!newest) return <span className="sp-mini" aria-hidden="true" />;
  const m = monthOf(newest.slice(0, 7));
  const has = new Set(days.filter((d) => d.startsWith(m.key)).map((d) => Number(d.slice(8))));
  return (
    <span className="sp-mini" aria-hidden="true">
      {Array.from({ length: m.lead }, (_, i) => (
        <i key={`lead-${i}`} data-lead="" />
      ))}
      {Array.from({ length: m.count }, (_, i) => (
        <i key={i} data-on={has.has(i + 1) ? "" : undefined} />
      ))}
    </span>
  );
}

/** 개념 지도 문의 작은 그림 — 점 넷과 선 (지도의 꼴). 꾸밈이다 */
const MiniMap = () => (
  <svg className="sp-minimap" width="58" height="46" viewBox="0 0 58 46" aria-hidden="true">
    <path d="M10 33 27 12l21 9M27 12l5 24" />
    <circle cx="10" cy="33" r="5" />
    <circle cx="48" cy="21" r="5" />
    <circle cx="32" cy="36" r="5" />
    <circle cx="27" cy="12" r="6.5" data-on="" />
  </svg>
);

export function StartHome() {
  const { day, top, rest } = bundle();
  const days = [...top, ...rest].map((x) => x.day).filter((d): d is string => Boolean(d));
  return (
    <div className="ep-root td-root sp-root" data-testid="start">
      <div className="ep-scroll">
        <main className="ep-scene td sp">
          <Mark />
          <section className="sp-hero">
            <p className="sp-tagline">
              <Rich text={HOME.tagline} />
            </p>
            <p className="sp-sub">{HOME.sub}</p>
          </section>

          <section className="sp-today" aria-labelledby="sp-head">
            <div className="sp-head">
              <h1 id="sp-head" data-day={day ?? undefined} data-testid="head" suppressHydrationWarning>
                {day ? dayTitle(day) : HOME.titleRecent}
              </h1>
              {day ? <script dangerouslySetInnerHTML={{ __html: TODAY_SCRIPT }} /> : null}
              <span>{count(top.length)}</span>
            </div>
            <ul className="sp-stories">
              {top.map((line, i) => (
                <Story key={keyOf(line)} line={line} lead={i === 0} />
              ))}
            </ul>
          </section>

          {/* 문 둘 — 지난 이야기 (달력 화면) · 개념 지도 (실제 /map) */}
          <nav className="sp-doors" aria-label={C.doors}>
            <a className="sp-door" href={DAYS} data-testid="door-days">
              <span className="sp-door-art">
                <MiniMonth days={days} />
              </span>
              <strong>{HOME.restLabel}</strong>
              <span className="sp-door-sub">{C.daysSub}</span>
              <span className="sp-door-go">
                <Go />
              </span>
            </a>
            <a className="sp-door" href="/map" data-testid="door-map">
              <span className="sp-door-art">
                <MiniMap />
              </span>
              <strong>{HOME.conceptLabel}</strong>
              <span className="sp-door-sub">{C.mapSub}</span>
              <span className="sp-door-go">
                <Go />
              </span>
            </a>
          </nav>

          <p className="sp-foot">{HOME.preview}</p>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── 달력 화면

const rowOf = (line: Line) => {
  const long = line.kind === "long";
  const series = long ? line.ep.series : line.story.series;
  return {
    href: hrefOfLine(line),
    code: codeOf(line),
    title: plain(titleOf(line)),
    sub: [series.name, ...(long && numbered(series.code) ? [line.ep.scenes.cover.episode.t] : []), ...(long ? [HOME.long] : [])],
  };
};

/**
 * 달력 화면 — 달력 (낸 날이 적힌 이야기 전부 · 가장 새 날도 누를 수 있다) + 고른 날의 이야기 + 날 없는 이야기는 달력 밖 접힌 한 줄 ("그 전" — 날짜를 지어내지 않는다).
 * 처음 골라 둔 날 = 바로 위 지난 날 (없으면 가장 새 날) — 가장 새 날의 이야기는 방금 지나온 시작 화면에 있다. `many` = 날이 쌓인 견본 (지난 이야기만 바뀐다)
 */
export function StartDays({ many }: { many: boolean }) {
  const real = bundle();
  const { day: newest, top } = real;
  const groups = byDay(many && newest ? sampleWeek(newest, top, real.rest) : real.rest);
  const dated = [...(newest ? [{ day: newest, lines: [...top] }] : []), ...groups.filter((g): g is DayGroup & { day: string } => g.day !== null)];
  // 낸 날이 하나도 없으면 (bundle 이 전부를 top 에 준다) 그 전부가 "그 전"이다
  const before = newest ? (groups.find((g) => g.day === null)?.lines ?? []) : top;
  const days: Record<string, CalDay> = Object.fromEntries(dated.map((g) => [g.day, { day: g.day, label: `${dayLabel(g.day)} ${dayParts(g.day).weekday}요일`, rows: g.lines.map(rowOf) }]));
  const months = monthKeys(dated.map((g) => g.day)).map((k) => ({ ...monthOf(k), title: C.month.replace("{m}", String(monthOf(k).month)) }));
  const initial = dated.find((g) => g.day !== newest)?.day ?? newest;
  return (
    <div className="ep-root td-root sp-root" data-real="" data-testid="start-days">
      <header className="ep-bar">
        <a className="ep-back" href={START} aria-label={HOME.mapBack} data-testid="back">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="ep-bar-title">{HOME.mapBack}</p>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene td sp-days">
          {many ? (
            <nav className="hd-strip" data-many="" data-testid="strip">
              <strong>{C.sample}</strong>
              <span>
                <a href={DAYS}>{C.now}</a>
              </span>
              <p>{C.sampleNote}</p>
            </nav>
          ) : null}
          <h1 className="sp-days-title">{HOME.restLabel}</h1>
          {initial ? <Calendar months={months} days={days} newest={newest} initial={initial} C={C.cal} /> : null}
          {before.length ? (
            <details className="hf-before" data-day="before" data-testid="day">
              <summary>
                <h2>{C.before}</h2>
                <span>{count(before.length)}</span>
                <svg className="hc-mark" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ul className="hc-rows">
                {before.map((line) => {
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
        </main>
      </div>
    </div>
  );
}
