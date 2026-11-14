"use client";

import { DELIVERY } from "../../../../episode/episodes/delivery/data";
import { FOMC } from "../../../../episode/episodes/fomc/data";
import { PIPC } from "../../../../episode/episodes/pipc/data";
import { ConceptMap, type NodeState } from "../../../../episode/kit/ConceptMap";
import { Rich } from "../../../../episode/kit/parts";
import { TODAY_COPY as C } from "../copy";
import { PaletteDock } from "../palette/PaletteDock";

// UX-7 — 개념 지도 견본: 오늘의 이야기를 다 읽은 뒤의 지도 (고정값 — 읽은 기록이 없다. 추정하지 않는다). 주제마다 한 장.
// 지도 부품 · 자리 · 선은 회차 데이터의 것 그대로다 (kit/ConceptMap). 짧은 이야기의 개념은 같은 주제 (「내 정보는 누가 지키나」)의 지도에 이미 있다.
const all = (ep: typeof PIPC) => Object.fromEntries(ep.tools.map((x) => [x.key, "new"])) as Record<string, NodeState>;

export function TodayMap() {
  return (
    <div className="ep-root td-root" data-testid="today-map">
      <PaletteDock tag={C.draft} />
      <header className="ep-bar">
        <a className="ep-back" href="/lab/today" aria-label={C.mapBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="ep-bar-title">{C.mapBack}</p>
      </header>
      <div className="ep-scroll">
        <main className="ep-scene td-map">
          <h1 className="ep-title">
            <Rich text={C.mapTitle} />
          </h1>
          <p className="ep-note">{C.mapNote}</p>
          {[DELIVERY, FOMC, PIPC].map((ep) => (
            <div key={ep.code} className="ep-keep-map">
              <ConceptMap ep={ep} reader="new" states={all(ep)} compact />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
