"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { CHROME } from "../chrome";
import { Rich } from "../parts";
import type { ChainFrame, SeatsFrame } from "./types";

// 틀 둘과 그 둘을 잇는 것 — 어디서 멈추나 (ChainPicture) · 자리에 앉기 (SeatsPicture) · StepsCard.
// UX-2 의 금리 풀이(episodes/fomc/Mechanism.tsx)를 그대로 옮겼다 — 모양 · 움직임 값은 바꾸지 않았고, 글 · 고리 · 자리 수만 데이터로 뺐다.
//
// 잇는 법 (UX3-i): 틀마다 탭 하나. 앞 틀의 그림은 뒤 틀에서도 남는다 — **이미 일어난 일로** (carried: 움직임 없이 끝 모습).
//   금리 2화: [어디서 멈추나 · 9월 회의] → [자리에 앉기 · 10월 회의] — 멈춘 그림 아래에 자리가 놓인다.
// 틀 하나만 넣어도 된다 (탭이 사라진다). 어느 쪽을 골라도 "맞았다 · 틀렸다"가 없다 — 고른 쪽의, 문서에 적힌 말이 나올 뿐이다.
// 고리에서 힘이 닿지 않은 뒤는 **그리지 않는다**: 첫 안 닿은 고리 앞의 선은 점선과 물음표다.
//
// seen: 이 그림을 본 독자 (D61 ②) — 탭 · 누르기 · 설명 없이 그림의 끝 모습과 오늘의 값만 (고리마다의 상태 · 갈린 수 · 실제 결과).
//   쪽을 누르면 그쪽이 한 말이 나온다 — 그 말은 설명이 아니라 오늘의 값이다. "다시 해 보기"로 처음처럼 해 볼 수 있다.

type StepFrame = ChainFrame | SeatsFrame;
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

// ─────────────────────────────────────────────────────────── 어디서 멈추나

/** after: 밀었다 · carried: 앞 틀에서 이미 일어난 일 (움직임 없이) */
function ChainPicture({ frame: f, after, carried }: { frame: ChainFrame; after: boolean; carried: boolean }) {
  const firstOpen = f.nodes.findIndex((n) => n.reach === "none") - 1;
  return (
    <ol className="fr-chain" aria-label={f.nodes.map((n) => n.name).join(" → ")} data-after={after ? "" : undefined} data-carried={carried ? "" : undefined} data-picture={f.picture.id}>
      {f.nodes.flatMap((n, i) => {
        const next = f.nodes[i + 1];
        const node = (
          <li key={n.id} data-node={n.id} data-state={n.reach === "none" ? "still" : !after ? "idle" : n.reach === "full" ? "on" : "part"}>
            <span className="fr-dot" aria-hidden="true" />
            <strong>{n.name}</strong>
            <em>{n.reach === "none" ? n.still.t : after ? n.after.t : n.idle}</em>
          </li>
        );
        if (!next) return [node];
        const open = next.reach === "none";
        return [
          node,
          <li key={`${n.id}-link`} className="fr-link" data-kind={open ? "open" : "solid"} aria-hidden="true">
            {after && !open ? (
              <motion.i key={`a-${carried}`} initial={{ top: "0%", opacity: 1 }} animate={{ top: "100%", opacity: [1, 1, 0] }} transition={{ duration: carried ? 0 : 0.7, delay: carried ? 0 : i * 0.8, ease: "easeIn" }} />
            ) : null}
            {after && i === firstOpen ? (
              <motion.b initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: carried ? 0 : i * 0.8, type: "spring", stiffness: 300, damping: 18 }}>
                ?
              </motion.b>
            ) : null}
            {after && i === firstOpen ? <span>{f.unknown}</span> : null}
          </li>,
        ];
      })}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────── 자리에 앉기

function Seat({ id, you }: { id: string; you?: string }) {
  return (
    <motion.span layoutId={`seat-${id}`} transition={SPRING} className="fr-seat" data-me={you ? "" : undefined}>
      {you ?? null}
    </motion.span>
  );
}
/** 갈린 뒤 두 칸의 너비 — 사람 수를 따르되 적은 쪽도 이름이 들어갈 만큼은 준다 (금리 2화의 10 · 2 → 5 : 2) */
const cols = (f: SeatsFrame) => f.sides.map((s) => `${Math.max(2, Math.round(s.count / 2))}fr`).join(" ");

/** choice: 내가 앉은 쪽 (null = 아직 안 골랐다) */
function SeatsPicture({ frame: f, choice }: { frame: SeatsFrame; choice: string | null }) {
  // 쪽은 둘이다 (계약 불변식 16)
  const first = f.sides[0]!;
  const total = first.count + f.sides[1]!.count;
  // 나를 뺀 자리들 — 내가 앉은 쪽은 그만큼 다른 사람이 하나 적다. 합은 늘 문서의 수다
  const others = Array.from({ length: total - 1 }, (_, i) => i);
  const firstOthers = choice === first.id ? first.count - 1 : first.count;
  return (
    <div className="fr-seats" data-split={choice ?? undefined} style={choice ? { gridTemplateColumns: cols(f) } : undefined} aria-label={f.label} data-picture={f.picture.id}>
      {choice === null ? (
        <div className="fr-row">
          <Seat id="me" you={f.you} />
          {others.map((i) => (
            <Seat key={i} id={String(i)} />
          ))}
        </div>
      ) : (
        f.sides.map((s, k) => (
          <div key={s.id} className="fr-group" data-side={s.id} data-mine={choice === s.id ? "" : undefined}>
            <h3>{s.group.t}</h3>
            <div className="fr-row">
              {choice === s.id ? <Seat id="me" you={f.you} /> : null}
              {(k === 0 ? others.slice(0, firstOthers) : others.slice(firstOthers)).map((i) => (
                <Seat key={i} id={String(i)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/** 그림을 본 독자의 자리 그림 — 갈린 모습 그대로 (내 자리 없음). 쪽을 누르면 그쪽이 한 말 */
function SeatsSeen({ frame: f, picked, onPick }: { frame: SeatsFrame; picked: string | null; onPick: (id: string) => void }) {
  return (
    <div className="fr-seats" data-split="seen" style={{ gridTemplateColumns: cols(f) }} aria-label={f.label} data-picture={f.picture.id}>
      {f.sides.map((s) => (
        <button key={s.id} type="button" className="fr-group" data-side={s.id} data-mine={picked === s.id ? "" : undefined} aria-pressed={picked === s.id} onClick={() => onPick(s.id)} data-testid={`seen-side-${s.id}`}>
          <h3>{s.group.t}</h3>
          <div className="fr-row">
            {Array.from({ length: s.count }, (_, i) => (
              <span key={i} className="fr-seat" />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────── 잇기

export function StepsCard({ frames, seen = false }: { frames: readonly StepFrame[]; seen?: boolean }) {
  const [redo, setRedo] = useState(false);
  const [phase, setPhase] = useState(0);
  /** 민 고리 틀 (틀의 차례 번호) */
  const [pressed, setPressed] = useState<readonly number[]>([]);
  /** 자리 틀마다 내가 앉은 쪽 */
  const [choice, setChoice] = useState<Record<number, string | null>>({});
  const [picked, setPicked] = useState<string | null>(null);

  if (seen && !redo) {
    const seats = frames.find((f) => f.kind === "seats");
    const said = seats?.sides.find((s) => s.id === picked)?.said;
    return (
      <div className="ep-lab fr-steps" data-seen="" data-testid="lab">
        <p className="fr-seen">{CHROME.seen.label}</p>
        {frames.map((f, i) => (f.kind === "chain" ? <ChainPicture key={i} frame={f} after carried /> : <SeatsSeen key={i} frame={f} picked={picked} onPick={setPicked} />))}
        {seats ? (
          <>
            <p className="ep-lab-state fr-real">{seats.result.t}</p>
            <p className="ep-lab-caption fr-seen-caption" aria-live="polite" data-testid="lab-caption" data-hint={said ? undefined : ""}>
              {said ? <Rich text={said.t} /> : CHROME.seen.sideHint}
            </p>
          </>
        ) : null}
        <button type="button" className="ep-link fr-redo" onClick={() => setRedo(true)} data-testid="seen-redo">
          {CHROME.seen.redo}
        </button>
      </div>
    );
  }

  const cur = frames[phase]!;
  const isPressed = pressed.includes(phase);
  const sat = choice[phase] ?? null;
  const side = cur.kind === "seats" ? cur.sides.find((s) => s.id === sat) : undefined;
  const caption = cur.kind === "chain" ? (isPressed ? cur.caption.after : cur.caption.before) : (side?.said ?? cur.caption.before);

  return (
    <LayoutGroup>
      <div className="ep-lab fr-steps" data-phase={phase} data-testid="lab">
        {frames.length > 1 ? (
          <div className="ep-lab-tabs" role="tablist">
            {frames.map((f, i) => (
              <button key={i} type="button" role="tab" aria-selected={phase === i} onClick={() => setPhase(i)} data-testid={`lab-tab-${i}`}>
                {f.tab?.t}
              </button>
            ))}
          </div>
        ) : null}

        {frames.map((f, i) =>
          i > phase ? null : f.kind === "chain" ? (
            // 뒤 틀로 넘어가면 앞 틀의 일은 이미 일어난 일이다 — 고리의 상태는 "민 뒤"
            <ChainPicture key={i} frame={f} after={i < phase || pressed.includes(i)} carried={i < phase} />
          ) : i === phase ? (
            <SeatsPicture key={i} frame={f} choice={choice[i] ?? null} />
          ) : null,
        )}

        {cur.kind === "chain" ? (
          <div className="ep-lab-actions">
            <motion.button type="button" className="ep-lab-act" onClick={() => setPressed((p) => [...p, phase])} whileTap={{ scale: 0.97 }} disabled={isPressed} data-testid="lab-act">
              {cur.action}
            </motion.button>
            {isPressed ? (
              <button type="button" className="ep-link" onClick={() => setPressed((p) => p.filter((x) => x !== phase))}>
                {cur.again}
              </button>
            ) : null}
          </div>
        ) : sat === null ? (
          <div className="fr-choose">
            {cur.sides.map((s) => (
              <motion.button key={s.id} type="button" onClick={() => setChoice((c) => ({ ...c, [phase]: s.id }))} whileTap={{ scale: 0.97 }} data-testid={`lab-${s.id}`}>
                {s.choose}
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="ep-lab-state fr-real">{cur.result.t}</p>
        )}

        <p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption">
          <Rich text={caption.t} />
        </p>

        {cur.kind === "chain" && isPressed && cur.go_on && phase < frames.length - 1 ? (
          <motion.button type="button" className="ep-lab-nextrule" onClick={() => setPhase(phase + 1)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.35 }} data-testid="lab-go-on">
            {cur.go_on.t}
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        ) : null}
        {cur.kind === "seats" && sat !== null ? (
          <button type="button" className="ep-lab-nextrule" onClick={() => setChoice((c) => ({ ...c, [phase]: cur.sides.find((s) => s.id !== sat)!.id }))} data-testid="lab-other">
            {cur.other}
          </button>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
