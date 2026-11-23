import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { bundle, hrefOfLine, numbered, oneLine, type Line } from "../episode/catalog";
import { HOME } from "../episode/home-copy";
import { DAYS, keyOf, monthOf } from "../episode/home/days";
import { Rich } from "../episode/kit/parts";
import "../episode/episode.css";
import "../episode/today/today.css";
import "./start.css";

// 첫 화면 = **시작 화면** (F-E9 · D148 — 도윤 "응 좋아 실제 반영 ㄱㄱ"). UX-13b 판 (/lab/start — "잡스 바이브" D146: 보자마자 무엇인지 · 할 일 하나 · 누를 것은 누를 것처럼)을 옮겼다. 새로 디자인하지 않았다.
// 있는 것: Claro 표 · 작은 회색 한마디 · 가장 새 날의 이야기 (catalog.bundle 의 맨 위 묶음 — 이야기마다 "이야기 속으로 들어가기 →" · 첫째 먹색 채움 · 둘째부터 먹색 테) ·
//   문 둘 (지난 이야기 → /days 달력 화면 · 개념 지도 → /map).
// 뺀 것 (F-E2 ~ F-E7 의 첫 화면에 있던 것): 지난 이야기 카드 목록 (→ 달력 화면) · 이어지는 이야기 (D140) · 개념 지도 먹색 판 (→ 문) · 소개 · 오른쪽 위 "미리보기" 표.
//   F-E10 (D150 — 도윤 "미리보기 문구 빼줘"): 맨 아래 미리보기 한 줄 ("지금은 미리보기예요. …")도 뺐다.
// **정적이다** — 빌드할 때 이야기 목록 (episode/catalog.tsx)에서 읽어 HTML 에 싣는다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다 · 독자가 누구인지 묻지 않는다.
// 이야기 · 시리즈의 글은 파일의 글자 그대로다 (제목의 줄바꿈만 빈칸으로). 화면의 글은 ../episode/home-copy.ts. 읽는 시간은 내지 않는다 (D82).
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

const titleOf = (line: Line): string => oneLine(line.kind === "long" ? line.ep.scenes.cover.title : line.story.scenes.cover.title);
const codeOf = (line: Line): string => (line.kind === "long" ? line.ep.code : line.story.code);

const Go = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 가장 새 날의 이야기 한 편 — 상자 없음. 주제 이름 (회색 · 번호는 번호 화면 규칙을 지난 시리즈에만) · 제목 · 꼬리 (국내 / 해외 · 카테고리 · 긴 이야기) · **들어가기 단추**.
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

export default function Page() {
  const { day, top, rest } = bundle();
  const days = [...top, ...rest].map((x) => x.day).filter((d): d is string => Boolean(d));
  return (
    <div className="ep-root td-root sp-root" data-testid="home">
      <div className="ep-scroll">
        <main className="ep-scene td sp">
          <header className="sp-top">
            <span className="td-mark sp-mark">
              <span>{HOME.mark}</span>
            </span>
            <p className="sp-tagline">{HOME.line}</p>
          </header>

          <section className="sp-today" aria-labelledby="sp-head">
            <div className="sp-head">
              {/* 낸 날이 적힌 이야기가 없으면 "최근 이야기". 있으면 그 날짜 — 읽는 날이 그날이면 스크립트가 "오늘의 이야기"로 (suppressHydrationWarning: 그 글자를 React 가 되돌리지 않게) */}
              <h1 id="sp-head" data-day={day ?? undefined} data-testid="head" suppressHydrationWarning>
                {day ? dayTitle(day) : HOME.titleRecent}
              </h1>
              {day ? <script dangerouslySetInnerHTML={{ __html: TODAY_SCRIPT }} /> : null}
              <span data-testid="count">{HOME.n.replace("{n}", String(top.length))}</span>
            </div>
            <ul className="sp-stories">
              {top.map((line, i) => (
                <Story key={keyOf(line)} line={line} lead={i === 0} />
              ))}
            </ul>
          </section>

          {/* 문 둘 — 지난 이야기 (달력 화면) · 개념 지도 (/map). 그림 + 이름 + 화살표뿐 */}
          <nav className="sp-doors" aria-label={HOME.doors}>
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
        </main>
      </div>
    </div>
  );
}
