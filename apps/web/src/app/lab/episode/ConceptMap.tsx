"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CONCEPTS, COPY, READERS, type ConceptId, type ReaderId } from "./data";

// 내 개념 지도. 자리는 손으로 놓았다 (시안) — 배치를 계산하지 않는다.
// 상태는 셋뿐이다: new (오늘 주움) · known (알던 것) · none (아직). **얼마나 아는지는 그리지 않는다** — 추정하지 않으니까.
// 선은 "이 이야기에서 개념이 이어진 길"이다. 선수 지식(prerequisite) 같은 뜻을 싣지 않았다 (_open UX1-d).

export type NodeState = "new" | "known" | "none";

const AT: Record<ConceptId, readonly [number, number]> = { fee: [21, 72], mfn: [47, 45], dominance: [77, 66], provisional: [73, 22] };
const GHOSTS: readonly { name: string; at: readonly [number, number]; from: ConceptId }[] = [
  { name: COPY.map.ghosts[0], at: [28, 13], from: "provisional" },
  { name: COPY.map.ghosts[1], at: [52, 91], from: "dominance" },
];
const EDGES: readonly (readonly [ConceptId, ConceptId])[] = [
  ["fee", "mfn"],
  ["mfn", "dominance"],
  ["dominance", "provisional"],
];
const ORDER: readonly ConceptId[] = ["fee", "mfn", "dominance", "provisional"];

type Picked = { kind: "concept"; id: ConceptId } | { kind: "ghost"; name: string } | { kind: "else"; name: string; series: string } | null;

export function ConceptMap({ reader, states, grow = false, compact = false }: { reader: ReaderId; states: Record<ConceptId, NodeState>; grow?: boolean; compact?: boolean }) {
  const c = COPY.map;
  const [picked, setPicked] = useState<Picked>(null);
  const shown = ORDER.filter((id) => states[id] !== "none");
  const fresh = shown.filter((id) => states[id] === "new");
  const elsewhere = READERS[reader].elsewhere;
  // 자라는 모습: 알던 것이 먼저 있고, 오늘 주운 것이 하나씩 붙는다
  const delay = (id: ConceptId) => (grow && states[id] === "new" ? 0.7 + fresh.indexOf(id) * 0.28 : 0);

  return (
    <div className="ep-map" data-compact={compact ? "" : undefined} data-testid="concept-map">
      <div className="ep-map-series">
        <span>{c.seriesLabel}</span>
      </div>
      <div className="ep-map-field">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {GHOSTS.map((g) => (
            <line key={g.name} x1={AT[g.from][0]} y1={AT[g.from][1]} x2={g.at[0]} y2={g.at[1]} className="ep-edge" data-kind="ghost" />
          ))}
          {EDGES.filter(([a, b]) => states[a] !== "none" && states[b] !== "none").map(([a, b]) => {
            const isNew = states[a] === "new" || states[b] === "new";
            return (
              <motion.line
                key={`${a}-${b}`}
                x1={AT[a][0]}
                y1={AT[a][1]}
                x2={AT[b][0]}
                y2={AT[b][1]}
                className="ep-edge"
                data-kind={isNew ? "new" : "known"}
                initial={grow && isNew ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: Math.max(delay(a), delay(b)) + 0.15 }}
              />
            );
          })}
        </svg>

        {GHOSTS.map((g) => (
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
            style={{ left: `${AT[id][0]}%`, top: `${AT[id][1]}%` }}
            initial={grow && states[id] === "new" ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay(id) }}
            onClick={() => setPicked({ kind: "concept", id })}
          >
            {CONCEPTS[id].name}
          </motion.button>
        ))}
        {shown.length === 0 ? <p className="ep-map-empty">{c.emptyNew}</p> : null}
      </div>

      {elsewhere.length ? (
        <div className="ep-map-else">
          <span>
            {c.elsewhereLabel} · {elsewhere[0]!.series}
          </span>
          <div>
            {elsewhere.map((e) => (
              <button key={e.name} type="button" className="ep-node" data-state="known" data-static onClick={() => setPicked({ kind: "else", ...e })}>
                {e.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
              <h2>{CONCEPTS[picked.id].name}</h2>
              <p className="ep-map-where">{states[picked.id] === "new" ? c.whereToday.t : reader === "follower" ? c.whereBefore : c.whereSeed}</p>
              <p>{CONCEPTS[picked.id].short.t}</p>
              <p className="ep-map-use">{CONCEPTS[picked.id].use.t}</p>
            </>
          ) : picked.kind === "ghost" ? (
            <>
              <h2>{picked.name}</h2>
              <p className="ep-map-where">{c.whereGhost}</p>
            </>
          ) : (
            <>
              <h2>{picked.name}</h2>
              <p className="ep-map-where">
                {picked.series} · {c.whereElse}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
