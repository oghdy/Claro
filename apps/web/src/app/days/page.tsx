import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { bundle, hrefOfLine, numbered, oneLine, type Line } from "../../episode/catalog";
import { HOME } from "../../episode/home-copy";
import { Calendar, Row, type CalDay, type CalRow } from "../../episode/home/Calendar";
import { byDay, dayLabel, keyOf, monthKeys, monthOf, type DayGroup } from "../../episode/home/days";
import "../../episode/episode.css";
import "../../episode/today/today.css";
import "./days.css";

// 달력 화면 — 실제 주소 (F-E9 · D148). 시작 화면의 문 "지난 이야기" · 이야기 끝의 "다른 이야기 보기" · 지난 날 이야기의 첫 장 ‹ 가 오는 곳.
// UX-13b 판 (/lab/start/days — 도윤이 받은 꼴)을 옮겼다. 새로 디자인하지 않았다: 머리 막대 ‹ "첫 화면으로" → / · "지난 이야기" · 달력 · 고른 날의 줄 · 날 없는 이야기는 달력 밖 접힌 "그 전" (날짜를 지어내지 않는다).
// 달력에는 낸 날이 적힌 이야기 전부가 선다 — 가장 새 날 (시작 화면의 그날)도 누른다.
// **처음 고른 날** = `?d=YYYY-MM-DD` 가 이야기가 있는 날이면 그날 (이야기 끝에서 올 때 — 방금 읽은 이야기의 날) → 아니면 바로 위 지난 날 (가장 새 날의 이야기는 방금 지나온 시작 화면에 있다) → 없으면 가장 새 날.
// **요청마다 그린다** (`?d=` 를 읽는다) — 고른 날의 줄이 첫 HTML 에 있어야 스크립트 없이도 맞고, 다른 날이 먼저 보였다 바뀌는 깜박임이 없다. 데이터베이스를 읽지 않는다 · 아무것도 저장하지 않는다.
// 이야기의 글은 파일의 글자 그대로 (제목의 줄바꿈 · 굵게 표시만 뺀다). 화면 글은 ../../episode/home-copy.ts.
export const metadata: Metadata = { title: HOME.daysMetaTitle };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

const titleOf = (line: Line): string => oneLine(line.kind === "long" ? line.ep.scenes.cover.title : line.story.scenes.cover.title).replace(/\*\*/g, "");
const rowOf = (line: Line): CalRow => {
  const long = line.kind === "long";
  const series = long ? line.ep.series : line.story.series;
  return {
    href: hrefOfLine(line),
    code: long ? line.ep.code : line.story.code,
    title: titleOf(line),
    // 번호 ("N화")는 번호 화면 규칙 (D88 E-20)을 지난 시리즈에만
    sub: [series.name, ...(long && numbered(series.code) ? [line.ep.scenes.cover.episode.t] : []), ...(long ? [HOME.long] : [])],
  };
};
const count = (k: number): string => HOME.n.replace("{n}", String(k));

const Back = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string | string[] }> }) {
  const { d } = await searchParams;
  const pick = typeof d === "string" ? d : undefined;
  const { day: newest, top, rest } = bundle();
  const groups = byDay(rest);
  const dated = [...(newest ? [{ day: newest, lines: [...top] }] : []), ...groups.filter((g): g is DayGroup & { day: string } => g.day !== null)];
  // 낸 날이 하나도 없으면 (bundle 이 전부를 top 에 준다) 그 전부가 "그 전"이다
  const before = newest ? (groups.find((g) => g.day === null)?.lines ?? []) : top;
  const days: Record<string, CalDay> = Object.fromEntries(dated.map((g) => [g.day, { day: g.day, label: dayLabel(g.day), rows: g.lines.map(rowOf) }]));
  const months = monthKeys(dated.map((g) => g.day)).map((k) => ({ ...monthOf(k), title: HOME.month.replace("{m}", String(monthOf(k).month)) }));
  const initial = (pick && Object.hasOwn(days, pick) ? pick : undefined) ?? dated.find((g) => g.day !== newest)?.day ?? newest;
  return (
    <div className="ep-root td-root sp-root" data-real="" data-testid="days">
      <header className="ep-bar">
        <a className="ep-back" href="/" aria-label={HOME.mapBack} data-testid="back">
          <Back />
        </a>
        <p className="ep-bar-title">{HOME.mapBack}</p>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene td sp-days">
          <h1 className="sp-days-title">{HOME.restLabel}</h1>
          {initial ? <Calendar months={months} days={days} initial={initial} /> : null}
          {before.length ? (
            <details className="hf-before" data-day="before" data-testid="before">
              <summary>
                <h2>{HOME.before}</h2>
                <span>{count(before.length)}</span>
                <svg className="hc-mark" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ul className="hc-rows">
                {before.map((line) => (
                  <li key={keyOf(line)}>
                    <Row row={rowOf(line)} />
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </main>
      </div>
    </div>
  );
}
