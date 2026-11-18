"use client";

import { useState } from "react";

// UX-12d (D142) — 달력 판의 달력 + 고른 날의 이야기 목록. lab 전용 클라이언트 부품 (날 고르기에 자바스크립트가 필요하다).
// 서버가 처음 고른 날 (바로 위 지난 날)의 목록까지 그려서 보낸다 — 스크립트가 돌기 전에도 제목이 보인다.
// 받는 것은 전부 서버가 이야기 목록에서 만든 글자다 (날짜 · 요일 · 제목 · 주제 이름). 여기서 지어내는 것은 없다. 저장하는 것도 없다.

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
export interface CalCopy {
  weekdays: readonly string[];
  n: string;
  newest: string;
  prev: string;
  next: string;
  cell: string;
  cellNewest: string;
}

const Chevron = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Calendar({ months, days, newest, initial, C }: { months: readonly CalMonth[]; days: Record<string, CalDay>; newest: string | null; initial: string; C: CalCopy }) {
  const [picked, setPicked] = useState(initial);
  const [at, setAt] = useState(() => Math.max(0, months.findIndex((m) => initial.startsWith(m.key))));
  const month = months[at]!;
  const day = days[picked]!;
  const n = (k: number) => C.n.replace("{n}", String(k));
  return (
    <div className="hf" data-testid="calendar">
      <div className="hf-head">
        <h3>{month.title}</h3>
        {/* 달 넘기기 — 이야기가 있는 달이 둘 이상일 때만 선다 */}
        {months.length > 1 ? (
          <span className="hf-nav">
            <button type="button" aria-label={C.prev} disabled={at === 0} onClick={() => setAt(at - 1)}>
              <Chevron d="M12 5l-5 5 5 5" />
            </button>
            <button type="button" aria-label={C.next} disabled={at === months.length - 1} onClick={() => setAt(at + 1)}>
              <Chevron d="M8 5l5 5-5 5" />
            </button>
          </span>
        ) : null}
      </div>
      <div className="hf-grid hf-week" aria-hidden="true">
        {C.weekdays.map((w) => (
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
          const label = (key === newest ? C.cellNewest : C.cell).replace("{day}", d.label).replace("{n}", String(d.rows.length));
          return (
            <button key={key} type="button" className="hf-cell" data-day={key} data-newest={key === newest ? "" : undefined} aria-pressed={key === picked} aria-label={label} onClick={() => setPicked(key)}>
              <b>{i + 1}</b>
              <i aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {/* 고른 날의 이야기 — 줄은 담백 판 · 날짜 판의 줄 그대로 (제목 + 작은 회색 한 줄) */}
      <section className="hf-list" aria-live="polite" data-testid="picked" data-day={day.day}>
        <p className="hf-list-head">
          <strong>{day.label}</strong>
          <span>{n(day.rows.length)}</span>
          {day.day === newest ? <span>{C.newest}</span> : null}
        </p>
        <ul className="hc-rows">
          {day.rows.map((r) => (
            <li key={r.href}>
              <a className="hc-row" href={r.href} data-testid={`row-${r.code}`}>
                <span className="hc-row-title">{r.title}</span>
                <span className="hc-row-sub">
                  {r.sub.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
