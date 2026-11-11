"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CHROME } from "./chrome";
import { SHELF, shelfOf } from "./shelf";
import type { EpisodeData, ReaderId } from "./types";

// 내 개념 지도 (공통). 자리는 회차 데이터에 손으로 놓여 있다 (시안) — 배치를 계산하지 않는다.
// 상태는 셋뿐이다: new (오늘 주움) · known (알던 것) · none (아직). **얼마나 아는지는 그리지 않는다** — 추정하지 않으니까.
// 선은 "이 이야기에서 개념이 이어진 길"이다. 선수 지식(prerequisite) 같은 뜻을 싣지 않았다 (_open UX1-d).
// 지도는 시리즈를 넘어 하나다: 다른 시리즈에서 주운 개념이 아래에 같이 보이고, 거기서 그 시리즈의 회차로 건너갈 수 있다 (UX-2).

export type NodeState = "new" | "known" | "none";

type Picked = { kind: "concept"; id: string } | { kind: "ghost"; name: string } | { kind: "else"; series: string; id: string } | null;

export function ConceptMap({ ep, reader, states, grow = false, compact = false }: { ep: EpisodeData; reader: ReaderId; states: Record<string, NodeState>; grow?: boolean; compact?: boolean }) {
  const c = CHROME.map;
  const { at, edges, ghosts } = ep.map;
  const [picked, setPicked] = useState<Picked>(null);
  const shown = ep.conceptOrder.filter((id) => states[id] !== "none");
  const fresh = shown.filter((id) => states[id] === "new");
  const elsewhere = ep.readers[reader].elsewhere;
  // 자라는 모습: 알던 것이 먼저 있고, 오늘 주운 것이 하나씩 붙는다
  const delay = (id: string) => (grow && states[id] === "new" ? 0.7 + fresh.indexOf(id) * 0.28 : 0);
  const xy = (id: string) => at[id] ?? ([50, 50] as const);
  const pickedElse = picked?.kind === "else" ? shelfOf(picked.series) : undefined;

  return (
    <div className="ep-map" data-compact={compact ? "" : undefined} data-testid="concept-map">
      <div className="ep-map-series">
        <span>{ep.series.name}</span>
      </div>
      <div className="ep-map-field">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {ghosts.map((g) => (
            <line key={g.name} x1={xy(g.from)[0]} y1={xy(g.from)[1]} x2={g.at[0]} y2={g.at[1]} className="ep-edge" data-kind="ghost" />
          ))}
          {edges
            .filter(([a, b]) => states[a] !== "none" && states[b] !== "none")
            .map(([a, b]) => {
              const isNew = states[a] === "new" || states[b] === "new";
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={xy(a)[0]}
                  y1={xy(a)[1]}
                  x2={xy(b)[0]}
                  y2={xy(b)[1]}
                  className="ep-edge"
                  data-kind={isNew ? "new" : "known"}
                  initial={grow && isNew ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45, delay: Math.max(delay(a), delay(b)) + 0.15 }}
                />
              );
            })}
        </svg>

        {ghosts.map((g) => (
          <button key={g.name} type="button" className="ep-node" data-state="ghost" style={{ left: `${g.at[0]}%`, top: `${g.at[1]}%` }} onClick={() => setPicked({ kind: "ghost", name: g.name })}>
            {g.name}
          </button>
        ))}
        {shown.map((id) => (
          <motion.button
            key={id}
            type="button"
            className="ep-node"
            data-state={states[id]}
            data-testid={`node-${id}`}
            style={{ left: `${xy(id)[0]}%`, top: `${xy(id)[1]}%` }}
            initial={grow && states[id] === "new" ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay(id) }}
            onClick={() => setPicked({ kind: "concept", id })}
          >
            {ep.concepts[id]!.name}
          </motion.button>
        ))}
        {shown.length === 0 ? <p className="ep-map-empty">{c.emptyNew}</p> : null}
      </div>

      {elsewhere.map((e) => {
        const shelf = shelfOf(e.series);
        if (!shelf) return null;
        return (
          <div key={e.series} className="ep-map-else" data-testid={`else-${e.series}`}>
            <span>
              {c.elsewhereLabel} · {shelf.name}
            </span>
            <div>
              {e.concepts.map((id) => (
                <button key={id} type="button" className="ep-node" data-state="known" data-static onClick={() => setPicked({ kind: "else", series: e.series, id })}>
                  {shelf.concepts[id]?.name ?? id}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <ul className="ep-map-legend">
        <li data-state="new">{c.legendNew}</li>
        <li data-state="known">{c.legendKnown}</li>
        <li data-state="ghost">{c.legendGhost}</li>
      </ul>

      {compact ? null : (
        <div className="ep-map-detail" aria-live="polite">
          {picked === null ? (
            <p className="ep-map-hint">
              {c.tapHint} {c.edgeNote}
            </p>
          ) : picked.kind === "concept" ? (
            <>
              <h2>{ep.concepts[picked.id]!.name}</h2>
              <p className="ep-map-where">{states[picked.id] === "new" ? ep.copy.map.whereToday.t : reader === "follower" ? c.whereBefore : c.whereSeed}</p>
              <p>{ep.concepts[picked.id]!.short.t}</p>
              <p className="ep-map-use">{ep.concepts[picked.id]!.use.t}</p>
            </>
          ) : picked.kind === "ghost" ? (
            <>
              <h2>{picked.name}</h2>
              <p className="ep-map-where">{c.whereGhost}</p>
            </>
          ) : (
            <>
              <h2>{pickedElse?.concepts[picked.id]?.name ?? picked.id}</h2>
              <p className="ep-map-where">
                {pickedElse?.name} · {c.whereElse}
              </p>
              <p>{pickedElse?.concepts[picked.id]?.short.t}</p>
            </>
          )}
        </div>
      )}

      {compact ? null : (
        <nav className="ep-shelf" aria-label={c.shelfLabel} data-testid="shelf">
          <h2>{c.shelfLabel}</h2>
          <ul>
            {SHELF.map((s) =>
              s.series === ep.series.id ? (
                <li key={s.series} data-here>
                  <strong>{s.name}</strong>
                  <span>
                    {s.episode} · {s.title}
                  </span>
                  <em>{c.shelfHere}</em>
                </li>
              ) : (
                <li key={s.series}>
                  <a href={s.path} data-testid={`shelf-${s.series}`}>
                    <strong>{s.name}</strong>
                    <span>
                      {s.episode} · {s.title}
                    </span>
                    <em>
                      {c.shelfGo}
                      <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </em>
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
