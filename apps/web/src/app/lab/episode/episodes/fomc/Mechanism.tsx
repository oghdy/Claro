"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { T } from "../../kit/types";
import { LAB } from "./data";

// "아!" 의 자리 — 독자가 금리를 정하는 자리에 앉는다. 두 번 누른다.
//   9월 회의: 브레이크를 밟는다 → 힘이 가운데 고리(돈 빌리는 형편)까지만 가고, 물가는 그대로다
//   10월 회의: 같은 그림을 보고 고른다 — 그대로 두고 더 본다 / 한 번 더 올린다 → 12자리가 10과 2로 갈린다
// 어느 쪽을 골라도 "맞았다 · 틀렸다"가 없다. 고른 쪽에 실제로 앉았던 사람들의, 문서에 적힌 말이 나올 뿐이다.
// 그림의 수는 성명문의 표결 수(10 · 2)뿐이다. 금리 · 물가의 값은 그리지 않는다 — 지어낸 숫자를 쓰지 않으려고 (UX-1 J1).
// 올린 뒤 물가가 어떻게 되는지는 **그리지 않는다** (아무도 모른다 — 의장: "확실한 결론은 없다"). 둘째 고리는 점선과 물음표다.

type Phase = "sep" | "oct";
type Choice = "wait" | "raise";
/** 성명문: 10 – 2. 나를 뺀 열한 자리 */
const OTHERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

function Bold({ item }: { item: T }) {
  const parts = item.t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{parts.map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}</>;
}

function Seat({ id, me = false }: { id: string; me?: boolean }) {
  return (
    <motion.span layoutId={`seat-${id}`} transition={SPRING} className="fm-seat" data-me={me ? "" : undefined}>
      {me ? LAB.you : null}
    </motion.span>
  );
}

export function Mechanism() {
  const c = LAB;
  const [phase, setPhase] = useState<Phase>("sep");
  const [pressed, setPressed] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);

  // 10월 회의에서는 9월의 인상이 이미 있었던 일이다 — 고리의 상태는 "밟은 뒤"
  const after = phase === "oct" || pressed;
  // 내가 "그대로"에 앉으면 그쪽의 다른 사람은 아홉, "올리자"에 앉으면 그쪽의 다른 사람은 하나 — 합은 늘 10 과 2
  const waitOthers = choice === "raise" ? OTHERS.slice(0, 10) : OTHERS.slice(0, 9);
  const raiseOthers = choice === "raise" ? OTHERS.slice(10) : OTHERS.slice(9);

  const caption = phase === "sep" ? (pressed ? c.sepAfter : c.sepBefore) : choice === "wait" ? c.octWait : choice === "raise" ? c.octRaise : c.octBefore;

  return (
    <LayoutGroup>
      <div className="ep-lab fm-lab" data-phase={phase} data-after={after ? "" : undefined} data-testid="lab">
        <div className="ep-lab-tabs" role="tablist">
          {(["sep", "oct"] as const).map((p) => (
            <button key={p} type="button" role="tab" aria-selected={phase === p} onClick={() => setPhase(p)} data-testid={`lab-tab-${p}`}>
              {p === "sep" ? c.tabSep.t : c.tabOct.t}
            </button>
          ))}
        </div>

        <ol className="fm-chain" aria-label={`${c.nodeRate} → ${c.nodeCond} → ${c.nodeInfl}`}>
          <li data-node="rate" data-state={after ? "on" : "idle"}>
            <span className="fm-dot" aria-hidden="true" />
            <strong>{c.nodeRate}</strong>
            <em>{after ? c.rateOn : c.rateIdle}</em>
          </li>
          <li className="fm-link" data-kind="solid" aria-hidden="true">
            {after ? <motion.i key={`a-${phase}`} initial={{ top: "0%", opacity: 1 }} animate={{ top: "100%", opacity: [1, 1, 0] }} transition={{ duration: phase === "sep" ? 0.7 : 0, ease: "easeIn" }} /> : null}
          </li>
          <li data-node="cond" data-state={after ? "part" : "idle"}>
            <span className="fm-dot" aria-hidden="true" />
            <strong>{c.nodeCond}</strong>
            <em>{after ? c.condPart : c.condIdle}</em>
          </li>
          <li className="fm-link" data-kind="open" aria-hidden="true">
            {after ? (
              <motion.b initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: phase === "sep" ? 0.8 : 0, type: "spring", stiffness: 300, damping: 18 }}>
                ?
              </motion.b>
            ) : null}
            {after ? <span>{c.reach}</span> : null}
          </li>
          <li data-node="infl" data-state="still">
            <span className="fm-dot" aria-hidden="true" />
            <strong>{c.nodeInfl}</strong>
            <em>{c.inflStill}</em>
          </li>
        </ol>

        {phase === "oct" ? (
          <div className="fm-seats" data-split={choice ?? undefined} aria-label={c.seats}>
            {choice === null ? (
              <div className="fm-row">
                <Seat id="me" me />
                {OTHERS.map((i) => (
                  <Seat key={i} id={String(i)} />
                ))}
              </div>
            ) : (
              <>
                <div className="fm-group" data-side="wait" data-mine={choice === "wait" ? "" : undefined}>
                  <h3>{c.groupWait.t}</h3>
                  <div className="fm-row">
                    {choice === "wait" ? <Seat id="me" me /> : null}
                    {waitOthers.map((i) => (
                      <Seat key={i} id={String(i)} />
                    ))}
                  </div>
                </div>
                <div className="fm-group" data-side="raise" data-mine={choice === "raise" ? "" : undefined}>
                  <h3>{c.groupRaise.t}</h3>
                  <div className="fm-row">
                    {choice === "raise" ? <Seat id="me" me /> : null}
                    {raiseOthers.map((i) => (
                      <Seat key={i} id={String(i)} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {phase === "sep" ? (
          <div className="ep-lab-actions">
            <motion.button type="button" className="ep-lab-act" onClick={() => setPressed(true)} whileTap={{ scale: 0.97 }} disabled={pressed} data-testid="lab-act">
              {c.action}
            </motion.button>
            {pressed ? (
              <button type="button" className="ep-link" onClick={() => setPressed(false)}>
                {c.again}
              </button>
            ) : null}
          </div>
        ) : choice === null ? (
          <div className="fm-choose">
            <motion.button type="button" onClick={() => setChoice("wait")} whileTap={{ scale: 0.97 }} data-testid="lab-wait">
              {c.chooseWait}
            </motion.button>
            <motion.button type="button" onClick={() => setChoice("raise")} whileTap={{ scale: 0.97 }} data-testid="lab-raise">
              {c.chooseRaise}
            </motion.button>
          </div>
        ) : (
          <p className="ep-lab-state fm-real">{c.real.t}</p>
        )}

        <p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption">
          <Bold item={caption} />
        </p>

        {phase === "sep" && pressed ? (
          <motion.button type="button" className="ep-lab-nextrule" onClick={() => setPhase("oct")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.35 }} data-testid="lab-go-on">
            {c.goOn.t}
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        ) : null}
        {phase === "oct" && choice !== null ? (
          <button type="button" className="ep-lab-nextrule" onClick={() => setChoice(choice === "wait" ? "raise" : "wait")} data-testid="lab-other">
            {c.other}
          </button>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
