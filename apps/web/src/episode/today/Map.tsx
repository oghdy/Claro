"use client";

import type { ReactNode } from "react";
import { latestPerSeries, numbered } from "../catalog";
import { ConceptMap, type NodeState } from "../kit/ConceptMap";
import { Rich } from "../kit/parts";

// 개념 지도 한 장씩 — 주제 (시리즈)마다 (UX-7 의 지도 견본 → F-E2 에서 실제 주소 /map 과 한 벌로). "오늘" 화면에서 개념 지도로 가는 길의 끝.
// **읽은 기록이 없다** — 독자의 지도가 아니라, 이야기를 다 읽은 뒤의 지도를 고정값으로 보인다 (추정하지 않는다 · 화면의 글이 그렇게 말한다).
// 지도 부품 · 자리 · 선은 이야기 데이터의 것 그대로다 (kit/ConceptMap). 짧은 이야기의 개념은 같은 주제의 지도에 이미 있다.
export function MapPage({ title, note, back, real = false, top }: { title: string; note: string; back: { href: string; label: string }; real?: boolean; top?: ReactNode }) {
  return (
    <div className="ep-root td-root" data-real={real ? "" : undefined} data-testid="today-map">
      {top}
      <header className="ep-bar">
        <a className="ep-back" href={back.href} aria-label={back.label}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="ep-bar-title">{back.label}</p>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene td-map">
          <h1 className="ep-title">
            <Rich text={title} />
          </h1>
          <p className="ep-note">{note}</p>
          {latestPerSeries().map(({ ep }) => (
            <div key={ep.series.code} className="ep-keep-map">
              <ConceptMap ep={ep} reader="new" states={Object.fromEntries(ep.tools.map((x) => [x.key, "new"])) as Record<string, NodeState>} real={real} numbered={numbered(ep.series.code)} compact />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
