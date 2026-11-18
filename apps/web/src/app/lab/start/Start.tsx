import { bundle, hrefOfLine, numbered, oneLine, type Line } from "../../../episode/catalog";
import { HOME } from "../../../episode/home-copy";
import { CHROME, SHORT_CHROME } from "../../../episode/kit/chrome";
import { ConceptMap, type NodeState } from "../../../episode/kit/ConceptMap";
import { Rich } from "../../../episode/kit/parts";
import { Calendar, type CalDay } from "../home-days/Calendar";
import { byDay, dayLabel, dayParts, keyOf, monthKeys, monthOf, sampleWeek, type DayGroup } from "../home-days/days";
import "../../../episode/episode.css";
import "../../../episode/today/today.css";
import "../home-days/home-days.css";
import "./start.css";

// UX-13b (D146) — "잡스 바이브" 잣대 셋으로 다듬음: ① 보자마자 무엇을 하는지 안다 ② 할 일이 하나로 분명하다 ③ 누를 것은 누를 것처럼 보인다 (무엇이 걸렸고 어떻게 고쳤나 — logs/frontend/UX-13b.md ②).
//   시작: 큰 한마디를 작은 한 줄로 (가장 큰 글 = 오늘 첫 이야기의 제목) · 이야기마다 들어가기 단추 (첫째 = 먹색 · 둘째부터 = 같은 꼴의 테 단추) · 문 둘을 낮게 (회색 한 줄 뺌) · 누를 수 없는 "미리보기" 표 뺌.
//   달력: 이야기 있는 날 = 옅은 면 동그라미 (누를 날) · 고른 날 = 먹색 · 줄마다 동그란 들어가기. 이야기 끝 견본 = /lab/start/end (설계 그림 — 실제 kit 은 F-E9).
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
  /** 문 둘 — 이름은 home-copy 의 칸 이름 그대로 (restLabel · conceptLabel). UX-13b: 아래 회색 한 줄 ("날짜별로 보기" · "이야기에서 주운 개념")을 뺐다 — 그림 + 이름이면 안다 */
  doors: "더 보기",
  cal: {
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    n: "{n}편",
    newest: "",
    prev: "앞 달",
    next: "다음 달",
    cell: "{day}, 이야기 {n}편",
    cellNewest: "{day}, 이야기 {n}편",
  },
  sample: "견본 — 날이 쌓인 모습",
  sampleNote: "지금 이야기를 지난 7일에 되풀이해 깔았어요. 실제 주소에는 없어요.",
  sampleN: "견본 — 오늘 이야기가 {n}편일 때",
  sampleLong: "견본 — 오늘 묶음에 긴 이야기가 있을 때",
  sampleNNote: "지금 목록의 이야기를 빌려 그렸어요. 실제 주소에는 없어요.",
  now: "지금 목록으로",
  /** 이야기 끝 견본 (/lab/start/end) — 설계 그림의 글. 단추의 말 "다른 이야기 보기"는 지시문 (D146)의 보기 그대로 · 실제로 옮길 때 도윤이 정한다 (_open) */
  end: {
    go: "다른 이야기 보기",
    strip: "견본 — 이야기 끝 장면 (설계)",
    stripNote: "실제 이야기 화면은 그대로예요. 끝 장면에서 할 일을 하나로 줄인 그림이에요.",
    kinds: { short: "짧은 이야기", long: "긴 이야기" },
  },
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
/** 미리보기 글 — home-copy 의 preview 에서 앞의 두 문장만 (미리보기 · 아직 날마다 내지 못함). 지도 저장 이야기 (셋째 문장)는 지도가 있는 화면 (/map · 이야기 끝)이 이미 말한다. 새 글자 없음 */
const PREVIEW = HOME.preview.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

const Go = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Back = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 견본 띠 (실제 목록이 아닌 그림일 때만 선다 — UX-12 의 띠 꼴 그대로) */
function Strip({ title, note, href }: { title: string; note: string; href: string }) {
  return (
    <nav className="hd-strip" data-many="" data-testid="strip">
      <strong>{title}</strong>
      <span>
        <a href={href}>{C.now}</a>
      </span>
      <p>{note}</p>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────── 시작 화면

/**
 * 가장 새 날의 이야기 한 편 — 상자 없음. 주제 이름 (회색) · 제목 · 꼬리 · **들어가기 단추**. 긴 이야기도 같은 꼴이다 (UX-13 의 소개 한 줄 dek 은 뺐다 — 네 줄짜리 글이라 "뭐가 너무 많다". 들어가면 표지가 바로 말한다 · 꼬리의 "긴 이야기"만 남는다).
 * 단추는 이야기마다 하나, 같은 말 · 같은 꼴이다. 첫 이야기만 먹색으로 채운다 (이 화면에서 가장 진한 곳 하나 — 고민되면 이것부터), 둘째부터는 같은 꼴의 테 단추.
 * 줄 전체가 링크라 어디를 눌러도 들어간다
 */
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
        <span className="sp-story-meta">
          <span>{line.place}</span>
          <span>{line.category}</span>
          {long ? <span>{HOME.long}</span> : null}
        </span>
        <span className="sp-story-go" data-testid="go">
          {HOME.go}
          <Go />
        </span>
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
  <svg className="sp-minimap" width="52" height="41" viewBox="0 0 58 46" aria-hidden="true">
    <path d="M10 33 27 12l21 9M27 12l5 24" />
    <circle cx="10" cy="33" r="5" />
    <circle cx="48" cy="21" r="5" />
    <circle cx="32" cy="36" r="5" />
    <circle cx="27" cy="12" r="6.5" data-on="" />
  </svg>
);

/**
 * `sample` = 견본 (오늘 이야기가 하나 · 셋 · 넷일 때 · 긴 이야기가 있을 때의 꼴 — 지금 목록의 이야기를 빌려 그린다. 견본 띠가 선다).
 * 견본이 아니면 실제 첫 화면과 같은 묶음 (catalog.bundle 의 top)
 */
export function StartHome({ sample }: { sample?: string }) {
  const real = bundle();
  const days = [...real.top, ...real.rest].map((x) => x.day).filter((d): d is string => Boolean(d));
  const pool = [...real.top, ...real.rest];
  const n = sample && /^[134]$/.test(sample) ? Number(sample) : 0;
  const longDay = sample === "long" ? pool.find((x) => x.kind === "long" && x.day)?.day : undefined;
  const top = n ? pool.slice(0, n) : longDay ? pool.filter((x) => x.day === longDay) : real.top;
  const day = longDay ?? real.day;
  const sampled = Boolean(n || longDay);
  return (
    <div className="ep-root td-root sp-root" data-testid="start">
      <div className="ep-scroll">
        <main className="ep-scene td sp">
          {sampled ? <Strip title={longDay ? C.sampleLong : C.sampleN.replace("{n}", String(n))} note={C.sampleNNote} href={START} /> : null}
          <header className="sp-top">
            <span className="td-mark sp-mark">
              <span>{HOME.mark}</span>
            </span>
            <p className="sp-tagline">{oneLine(HOME.tagline)}</p>
          </header>

          <section className="sp-today" aria-labelledby="sp-head">
            <div className="sp-head">
              <h1 id="sp-head" data-day={day ?? undefined} data-testid="head" suppressHydrationWarning>
                {day ? dayTitle(day) : HOME.titleRecent}
              </h1>
              {day && !sampled ? <script dangerouslySetInnerHTML={{ __html: TODAY_SCRIPT }} /> : null}
              <span>{count(top.length)}</span>
            </div>
            <ul className="sp-stories">
              {top.map((line, i) => (
                <Story key={keyOf(line)} line={line} lead={i === 0} />
              ))}
            </ul>
          </section>

          {/* 문 둘 — 지난 이야기 (달력 화면) · 개념 지도 (실제 /map). 그림 + 이름 + 화살표뿐 */}
          <nav className="sp-doors" aria-label={C.doors}>
            <a className="sp-door" href={DAYS} data-testid="door-days">
              <span className="sp-door-art">
                <MiniMonth days={days} />
              </span>
              <strong>{HOME.restLabel}</strong>
              <span className="sp-door-go">
                <Go size={16} />
              </span>
            </a>
            <a className="sp-door" href="/map" data-testid="door-map">
              <span className="sp-door-art">
                <MiniMap />
              </span>
              <strong>{HOME.conceptLabel}</strong>
              <span className="sp-door-go">
                <Go size={16} />
              </span>
            </a>
          </nav>

          <p className="sp-foot">{PREVIEW}</p>
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
 * 달력 화면 — 달력 (낸 날이 적힌 이야기 전부) + 고른 날의 이야기 + 날 없는 이야기는 달력 밖 접힌 한 줄 ("그 전" — 날짜를 지어내지 않는다).
 * 처음 골라 둔 날 = `pick` (이야기 끝에서 올 때 — 방금 읽은 이야기의 날 · `?d=YYYY-MM-DD`) → 없으면 바로 위 지난 날 (가장 새 날의 이야기는 방금 지나온 시작 화면에 있다) → 없으면 가장 새 날.
 * UX-13b: 달력의 표시는 셋뿐이다 — 이야기 없는 날 (회색 숫자 · 못 누름) · 이야기 있는 날 (옅은 면 동그라미) · 고른 날 (먹색). 가장 새 날의 테와 그 설명 글은 뺐다 (Calendar 에 newest 를 넘기지 않는다 — Calendar.tsx 는 0줄 고침).
 * `many` = 날이 쌓인 견본 (지난 이야기만 바뀐다)
 */
export function StartDays({ many, pick }: { many: boolean; pick?: string }) {
  const real = bundle();
  const { day: newest, top } = real;
  const groups = byDay(many && newest ? sampleWeek(newest, top, real.rest) : real.rest);
  const dated = [...(newest ? [{ day: newest, lines: [...top] }] : []), ...groups.filter((g): g is DayGroup & { day: string } => g.day !== null)];
  // 낸 날이 하나도 없으면 (bundle 이 전부를 top 에 준다) 그 전부가 "그 전"이다
  const before = newest ? (groups.find((g) => g.day === null)?.lines ?? []) : top;
  const days: Record<string, CalDay> = Object.fromEntries(dated.map((g) => [g.day, { day: g.day, label: `${dayLabel(g.day)} ${dayParts(g.day).weekday}요일`, rows: g.lines.map(rowOf) }]));
  const months = monthKeys(dated.map((g) => g.day)).map((k) => ({ ...monthOf(k), title: C.month.replace("{m}", String(monthOf(k).month)) }));
  const initial = (pick && days[pick] ? pick : undefined) ?? dated.find((g) => g.day !== newest)?.day ?? newest;
  return (
    <div className="ep-root td-root sp-root" data-real="" data-testid="start-days">
      <header className="ep-bar">
        <a className="ep-back" href={START} aria-label={HOME.mapBack} data-testid="back">
          <Back />
        </a>
        <p className="ep-bar-title">{HOME.mapBack}</p>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene td sp-days">
          {many ? <Strip title={C.sample} note={C.sampleNote} href={DAYS} /> : null}
          <h1 className="sp-days-title">{HOME.restLabel}</h1>
          {initial ? <Calendar months={months} days={days} newest={null} initial={initial} C={C.cal} /> : null}
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

// ─────────────────────────────────────────────────────────── 이야기 끝 견본 (설계 그림)

/**
 * 이야기 끝 장면의 **설계 그림** (/lab/start/end · `?k=long` = 긴 이야기). 실제 이야기 화면 (kit/Episode.tsx · Short.tsx)은 고치지 않았다 — F-E9 가 옮긴다 (logs/frontend/UX-13b.md ④).
 * 끝 장면에서 할 일은 하나다: 먹색 단추 "다른 이야기 보기" → 달력 화면 (방금 읽은 이야기의 날을 골라 둔 채로).
 * 뺀 것: "다른 시리즈" 상자들 · "첫 화면으로" · "처음부터 다시" · 감색 큰 단추 "내 개념 지도 보기" (지도 아래 작은 글 한 줄로 내림).
 * 이야기의 글 (물음 · 제목 · 한 줄 · 덧붙인 것 · 개념)은 파일의 글자 그대로다. 눌러도 움직이는 것은 맨 아래 단추와 머리 막대의 ‹ 뿐이다 (정지 그림)
 */
export function StartEnd({ kind }: { kind: "short" | "long" }) {
  const pool = [...bundle().top, ...bundle().rest];
  const line = pool.find((x) => x.kind === kind && x.day) ?? pool.find((x) => x.kind === kind);
  if (!line) return null;
  const to = line.day ? `${DAYS}?d=${line.day}` : DAYS;
  const long = line.kind === "long";
  const series = long ? line.ep.series : line.story.series;
  const keep = long ? line.ep.scenes.keep : line.story.scenes.keep;
  const asked = long ? line.ep.scenes.next.ask : line.story.scenes.why.ask;
  const tools = long ? line.ep.tools.map((x) => x.key) : [];
  const states = Object.fromEntries(tools.map((id) => [id, "new"])) as Record<string, NodeState>;
  const pages = long ? line.ep.assembly.new.length : 4;
  return (
    <div className="ep-root td-root sp-root st-root" data-real="" data-testid="start-end">
      <Strip title={C.end.strip} note={C.end.stripNote} href={START} />
      <header className="ep-bar">
        <span className="ep-back" aria-hidden="true">
          <Back />
        </span>
        <p className="ep-bar-title">
          <span>{C.end.kinds[kind]}</span>
          <span aria-hidden="true"> · </span>
          <span>{series.name}</span>
        </p>
        <span className="ep-count">
          {pages}/{pages}
        </span>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene sp-end">
          <p className="ep-asked">
            <span aria-hidden="true">Q</span>
            {asked}
          </p>
          <p className="ep-kicker">{keep.kicker}</p>
          <h1 className="ep-title">
            <Rich text={keep.title} />
          </h1>
          <figure className="ep-oneline">
            <figcaption>{long ? CHROME.keep.lineLabel : SHORT_CHROME.lineLabel}</figcaption>
            <p>
              <Rich text={keep.line} />
            </p>
          </figure>
          {line.kind === "short" ? (
            <aside className="st-advice">
              <h2>{line.story.scenes.keep.advice_label}</h2>
              <p>
                <Rich text={line.story.scenes.keep.advice.t} />
              </p>
            </aside>
          ) : (
            <>
              <div className="ep-keep-map">
                <ConceptMap ep={line.ep} reader="new" states={states} real numbered={false} compact />
              </div>
              <div className="ep-gain">
                <div data-kind="new">
                  <h2>
                    {CHROME.keep.newLabel} <b>{tools.length}</b>
                  </h2>
                  <p>{line.ep.tools.map((x) => x.name).join(" · ")}</p>
                </div>
              </div>
              <p className="sp-end-map">
                <span>
                  {CHROME.keep.mapButton}
                  <Go size={15} />
                </span>
              </p>
              <p className="sp-end-note">{CHROME.keep.notSaved}</p>
            </>
          )}
          <div className="sp-end-foot">
            <a className="sp-end-go" href={to} data-testid="end-go">
              {C.end.go}
              <Go />
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
