"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { FOMC } from "../../../episode/episodes/fomc/data";
import { CHROME } from "../../../episode/kit/chrome";
import { StepsCard } from "../../../episode/kit/frames/Steps";
import type { ChainFrame, SeatsFrame } from "../../../episode/kit/frames/types";
import { Txt } from "../../../episode/kit/parts";
import { RATE, type Vote } from "./copy";

// UX-9 — 금리의 진짜 체험: **먼저 표를 던진다 → 실제 열두 표가 열린다 → 내 표 · 내 까닭과 견준다.**
// 지금 체험 (kit/frames/Steps 의 자리에 앉기)은 실제로 갈린 두 쪽 가운데 하나를 누르면 바로 그쪽의 말이 나온다 — 고르는 것이 곧 열어 보는 것이다.
// 여기서는
//   ① 9월 회의의 브레이크는 그대로 밟는다 (틀 부품 그대로 — 표를 던지기 전에 본 것이 있어야 표가 설문이 아니다 · UX-2 ③)
//   ② 10월 회의 — 표 셋 (올린다 · 그대로 둔다 · 내린다) 가운데 하나와 **까닭 하나**를 고르고 "표 던지기"
//   ③ 실제 표가 열린다 (10 대 2) → 내 표가 앉은 쪽 · 그쪽이 공식으로 한 말 · **내 까닭과 문서의 말을 견준 한 줄**
//      "그대로 둔다 + 이제 물가가 잡힐 것 같아서" 를 고른 독자에게서 뒤집기 (“그대로” ≠ “이제 됐다”)가 **자기 표 위에서** 깨진다
//      "내린다"를 고른 독자: 그쪽에는 아무도 앉지 않았다 (내리자는 표는 없었다)
// 지킨 것
//   · D61 ③ — 자리는 한 기관 (연준 FOMC) 안의 공식 이견뿐이다 (골든 seats 틀의 ground · 쪽 둘). "내린다"는 쪽이 아니다 — 빈 자리다
//   · 채점하지 않는다 — "맞았다 · 틀렸다"가 없다. 같은 쪽 · 다른 까닭 · 아무도 없는 쪽을 말할 뿐이다. 맺는 줄도 골든의 "어느 쪽이 맞는지는 우리가 정하지 않아요"
//   · 올리자 쪽의 까닭은 문서에 아직 없다 (골든 not_yet_note) — 그쪽에 앉으면 그 문장이 그대로 보인다 (계약 불변식 17 과 같은 일)
//   · 미 연준의 금리를 한국의 대출 이자로 잇지 않는다 — 까닭의 말에도 없다 (./check.ts)
//   · 독자 기록 없음 — 처음 던진 표는 이 부품 안에만 남는다 (화면을 닫으면 없다)
// 새 글은 ./copy.ts 의 RATE 뿐이다. 수 · 구절은 골든의 것이다.

const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;
type Cast = { vote: Vote; reason: 0 | 1 };

function Seat({ id, you, delay = 0 }: { id: string; you?: string; delay?: number }) {
  return (
    <motion.span layoutId={`pl-seat-${id}`} transition={{ ...SPRING, delay }} className="fr-seat" data-me={you ? "" : undefined}>
      {you ?? null}
    </motion.span>
  );
}

export function RateCard({ onDone }: { onDone: () => void }) {
  const frames = FOMC.solve.lab!.frames;
  const chain = frames[0] as ChainFrame;
  const seats = frames[1] as SeatsFrame;
  const [braked, setBraked] = useState(false);
  const [atVote, setAtVote] = useState(false);
  const [vote, setVote] = useState<Vote | null>(null);
  const [reason, setReason] = useState<0 | 1 | null>(null);
  const [cast, setCast] = useState<Cast | null>(null);
  /** 처음 던진 표 — 다시 던져도 남는다 (이 부품 안에서만) */
  const [first, setFirst] = useState<Cast | null>(null);
  /** 눌러 본 쪽 — 그쪽이 공식으로 한 말 */
  const [picked, setPicked] = useState<string | null>(null);
  const ballot = useRef<HTMLDivElement>(null);
  const onBrake = useCallback(() => setBraked(true), []);

  useEffect(() => {
    if (cast) onDone();
  }, [cast, onDone]);
  useEffect(() => {
    if (atVote) ballot.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [atVote]);

  const option = (v: Vote) => RATE.options.find((o) => o.id === v)!;
  const [sideA, sideB] = [seats.sides[0]!, seats.sides[1]!];
  const total = sideA.count + sideB.count;
  const throwIt = () => {
    if (vote === null || reason === null) return;
    const c = { vote, reason };
    setCast(c);
    setFirst((f) => f ?? c);
    setPicked(option(vote).side);
  };
  const again = () => {
    setCast(null);
    setVote(null);
    setReason(null);
    setPicked(null);
  };

  const mine = cast ? option(cast.vote) : null;
  // 내 표가 실제 쪽에 앉으면 나는 그 쪽의 한 자리다 (합은 늘 문서의 수). 아무도 없는 쪽이면 나는 열두 자리 밖이다
  const inside = mine?.side != null;
  const others = Array.from({ length: inside ? total - 1 : total }, (_, i) => i);
  const firstOthers = mine?.side === sideA.id ? sideA.count - 1 : sideA.count;
  const pickedSide = seats.sides.find((s) => s.id === picked);
  // 맺는 줄 — 골든의 세 칸 풀이에 있는 문장 그대로 ("… 어느 쪽이 맞는지는 우리가 정하지 않아요.")
  const plain = FOMC.solve.plain;
  const noGrade = plain?.kind === "three" ? plain.differ_note : null;

  return (
    <>
      {/* ① 9월 회의 — 틀 부품 그대로 */}
      <StepsCard frames={[chain]} onDone={onBrake} />
      {braked && !atVote && chain.go_on ? (
        <motion.button type="button" className="ep-lab-nextrule pl-goon" onClick={() => setAtVote(true)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.35 }} data-testid="rate-go-on">
          {chain.go_on.t}
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      ) : null}

      {/* ② ③ 10월 회의 — 표 */}
      {atVote ? (
        <LayoutGroup>
          <motion.div ref={ballot} className="ep-lab pl-rate" data-cast={cast ? cast.vote : undefined} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} data-testid="rate-ballot">
            <p className="pl-tab">{seats.tab ? <Txt item={seats.tab} /> : null}</p>

            {cast === null ? (
              <div className="fr-seats" aria-label={seats.label}>
                <div className="fr-row">
                  <Seat id="me" you={seats.you} />
                  {Array.from({ length: total - 1 }, (_, i) => (
                    <Seat key={i} id={String(i)} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="fr-seats" data-split={cast.vote} style={{ gridTemplateColumns: `${Math.max(2, Math.round(sideA.count / 2))}fr ${Math.max(2, Math.round(sideB.count / 2))}fr` }} aria-label={seats.label}>
                  {seats.sides.map((s, k) => (
                    <button key={s.id} type="button" className="fr-group" data-side={s.id} data-mine={mine?.side === s.id ? "" : undefined} aria-pressed={picked === s.id} onClick={() => setPicked(s.id)} data-testid={`rate-side-${s.id}`}>
                      <h3>{s.group.t}</h3>
                      <div className="fr-row">
                        {mine?.side === s.id ? <Seat id="me" you={seats.you} delay={0.9} /> : null}
                        {(k === 0 ? others.slice(0, firstOthers) : others.slice(firstOthers)).map((i, n) => (
                          <Seat key={i} id={String(i)} delay={0.05 * n + (k === 0 ? 0 : 0.3)} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                {!inside ? (
                  <motion.div className="pl-alone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.4 }} data-testid="rate-alone">
                    <Seat id="me" you={seats.you} delay={0.9} />
                    <span>{RATE.alone}</span>
                  </motion.div>
                ) : null}
              </>
            )}

            {cast === null ? (
              <>
                <p className="ep-lab-caption pl-before" data-testid="lab-caption">
                  <Txt item={seats.caption.before} />
                </p>
                <div className="pl-slip" data-testid="rate-slip">
                  <h3>
                    <b>{RATE.slip}</b>
                    <span>{RATE.ask}</span>
                  </h3>
                  <div className="pl-votes" role="radiogroup" aria-label={RATE.slip}>
                    {RATE.options.map((o) => (
                      <motion.button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={vote === o.id}
                        onClick={() => {
                          setVote(o.id);
                          setReason(null);
                        }}
                        whileTap={{ scale: 0.96 }}
                        data-testid={`rate-vote-${o.id}`}
                      >
                        <i aria-hidden="true" />
                        {o.label}
                      </motion.button>
                    ))}
                  </div>
                  {vote ? (
                    <motion.div key={vote} className="pl-why" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                      <p>{RATE.whyAsk}</p>
                      {option(vote).reasons.map((r, i) => (
                        <motion.button key={r} type="button" aria-pressed={reason === i} onClick={() => setReason(i as 0 | 1)} whileTap={{ scale: 0.98 }} data-testid={`rate-why-${i}`}>
                          {r}
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : null}
                </div>
                <div className="ep-lab-actions">
                  <motion.button type="button" className="ep-lab-act" onClick={throwIt} whileTap={{ scale: 0.97 }} disabled={vote === null || reason === null} data-testid="rate-cast">
                    {vote === null || reason === null ? RATE.castWait : RATE.cast}
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <motion.p className="ep-lab-state fr-real" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, type: "spring", stiffness: 260, damping: 18 }} data-testid="rate-result">
                  <Txt item={seats.result} />
                </motion.p>

                <motion.div className="pl-mine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.4 }} data-testid="rate-mine">
                  <h3>{RATE.mineLabel}</h3>
                  <p className="pl-chip">
                    <b>{mine!.label}</b>
                    {mine!.reasons[cast.reason]}
                  </p>
                  <p>
                    <Txt item={mine!.head} />
                  </p>
                  <p data-testid="rate-reply">
                    <Txt item={mine!.replies[cast.reason]} />
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 0.4 }}>
                  <p className="ep-lab-caption pl-said" aria-live="polite" data-testid="lab-caption" data-hint={pickedSide ? undefined : ""}>
                    {pickedSide ? <Txt item={pickedSide.said} /> : CHROME.seen.sideHint}
                  </p>
                  {noGrade ? (
                    <p className="pl-nograde">
                      <Txt item={noGrade} />
                    </p>
                  ) : null}
                  {first && (first.vote !== cast.vote || first.reason !== cast.reason) ? (
                    <p className="pl-first" data-testid="rate-first">
                      <b>{RATE.first}</b>
                      {option(first.vote).label} · {option(first.vote).reasons[first.reason]}
                    </p>
                  ) : null}
                  <button type="button" className="ep-lab-nextrule" onClick={again} data-testid="rate-again">
                    {RATE.again}
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </LayoutGroup>
      ) : null}
    </>
  );
}
