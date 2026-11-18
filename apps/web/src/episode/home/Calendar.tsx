"use client";

import { useState } from "react";
import { HOME } from "../home-copy";

// 달력 화면 (/days — F-E9 · D148)의 달력 + 고른 날의 이야기 줄. **실제 화면의 첫 클라이언트 부품이다** (날 고르기 · 달 넘기기에 자바스크립트가 필요하다).
// UX-12d · UX-13b 의 lab 달력 (app/lab/home-days/Calendar.tsx + lab/start/start.css 의 덮어쓰기)을 옮겼다 — 표시는 셋: 이야기 없는 날 (회색 숫자 · 못 누름) · 이야기 있는 날 (옅은 면 동그라미) · 고른 날 (먹색).
// 줄마다 오른쪽의 동그란 들어가기는 lab 에서 CSS 그림이었고 여기서는 줄 안의 요소다 (UX-13b _open i). lab 의 달력은 lab 시안이 그대로 쓴다.
// 서버가 처음 고른 날의 줄까지 그려서 보낸다 — 스크립트가 돌기 전에도 줄이 보인다. 받는 것은 전부 서버가 이야기 목록에서 만든 글자다. 지어내는 것 · 저장하는 것은 없다.

export interface CalRow {
  href: string;
  code: string;
  title: string;
  /** 작은 회색 한 줄 — 주제 이름 (· N화 · 긴 이야기) */
  sub: string[];
}
export interface CalDay {
  day: string;
  /** "11월 17일 화요일" */
  label: string;
  rows: CalRow[];
}
export interface CalMonth {
  /** "2026-11" */
  key: string;
  /** "11월" */
  title: string;
  /** 1일 앞의 빈칸 수 (일요일부터) */
  lead: number;
  /** 그 달의 날 수 */
  count: number;
}

const n = (k: number) => HOME.n.replace("{n}", String(k));

const Chevron = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 이야기 줄 하나 — 제목 + 작은 회색 한 줄 + 오른쪽의 동그란 들어가기. 줄 전체가 링크다 (고른 날의 줄 · "그 전"의 줄이 같이 쓴다) */
export function Row({ row }: { row: CalRow }) {
  return (
    <a className="hc-row" href={row.href} data-testid={`row-${row.code}`}>
      <span className="hc-row-title">{row.title}</span>
      <span className="hc-row-sub">
        {row.sub.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </span>
      <span className="hc-row-go" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

export function Calendar({ months, days, initial }: { months: readonly CalMonth[]; days: Record<string, CalDay>; initial: string }) {
  const [picked, setPicked] = useState(initial);
  const [at, setAt] = useState(() => Math.max(0, months.findIndex((m) => initial.startsWith(m.key))));
  const month = months[at]!;
  const day = days[picked]!;
  return (
    <div className="hf" data-testid="calendar">
      <div className="hf-head">
        <h3>{month.title}</h3>
        {/* 달 넘기기 — 이야기가 있는 달이 둘 이상일 때만 선다 */}
        {months.length > 1 ? (
          <span className="hf-nav">
            <button type="button" aria-label={HOME.prevMonth} disabled={at === 0} onClick={() => setAt(at - 1)} data-testid="prev-month">
              <Chevron d="M12 5l-5 5 5 5" />
            </button>
            <button type="button" aria-label={HOME.nextMonth} disabled={at === months.length - 1} onClick={() => setAt(at + 1)} data-testid="next-month">
              <Chevron d="M8 5l5 5-5 5" />
            </button>
          </span>
        ) : null}
      </div>
      <div className="hf-grid hf-week" aria-hidden="true">
        {HOME.weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="hf-grid" role="group" aria-label={month.title}>
        {Array.from({ length: month.lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: month.count }, (_, i) => {
          const key = `${month.key}-${String(i + 1).padStart(2, "0")}`;
          const d = days[key];
          // 이야기 없는 날 — 숫자만 조용히 (누를 수 없다)
          if (!d)
            return (
              <span key={key} className="hf-cell" data-empty="">
                <b>{i + 1}</b>
              </span>
            );
          return (
            <button key={key} type="button" className="hf-cell" data-day={key} aria-pressed={key === picked} aria-label={HOME.cell.replace("{day}", d.label).replace("{n}", String(d.rows.length))} onClick={() => setPicked(key)}>
              <b>{i + 1}</b>
            </button>
          );
        })}
      </div>
      {/* 고른 날의 이야기 */}
      <section className="hf-list" aria-live="polite" data-testid="picked" data-day={day.day}>
        <p className="hf-list-head">
          <strong>{day.label}</strong>
          <span>{n(day.rows.length)}</span>
        </p>
        <ul className="hc-rows">
          {day.rows.map((r) => (
            <li key={r.href}>
              <Row row={r} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
