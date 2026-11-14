"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PIPC } from "../../../episode/episodes/pipc/data";
import { CHROME } from "../../../episode/kit/chrome";
import type { PageCard, PagesFrame } from "../../../episode/kit/frames/types";
import { Txt } from "../../../episode/kit/parts";
import { PRIVACY } from "./copy";

// UX-9 — 개인정보의 진짜 체험: **먼저 핀을 꽂는다 → 한 장씩 넘긴다 → 위원회의 ★ 과 견준다.**
// 지금 체험 (kit/frames/Pages)은 뒤집힌 카드를 차례로 넘기기만 한다 — 독자가 정하는 것이 없다.
// 여기서는
//   ① 여섯 칸이 뒤집힌 채 놓여 있다 (때 + 칸의 이름만). 보안 담당의 자리에서 "가장 단단히 챙길 칸" 하나에 **내 핀**을 꽂는다
//   ② 한 장씩 넘긴다 (지금 체험과 같은 넘기기 — 차례 그대로). 내 핀은 그 칸에 남아 있다. ★ 칸을 넘기면 위원회의 ★ 이 찍힌다
//   ③ 다 넘기면 내 핀과 위원회의 ★ 을 견준 한 줄 + 골든의 맺는 글 (… “그때 막았으면 두 번째는 없었다”고까지 말한 건 아니에요)
// 그리지 않는 것 (골든 not_drawn · D91)
//   · **반사실** — "거기서 막았으면 안 털렸다"가 없다. 내 핀은 결과를 바꾸지 않는다: 넘기는 칸 · 차례 · 글은 어디에 꽂든 똑같다.
//     물음도 "어디서 막겠나"가 아니라 "어느 칸을 가장 단단히 챙기겠나"다 (하는 일의 자리를 묻는다 — 일어난 일을 되돌리지 않는다)
//   · 칸과 칸 사이의 화살표 · 앞날 칸 · 지어낸 날짜 — 틀 부품과 같다 (가는 세로줄 · "날짜 없음")
//   · ★ 칸에서 회사가 실제로 한 일 — 고를 것으로 만들지 않았다 (UX-5 가 버린 "막았다 / 놔뒀다" 고르기를 다시 들이지 않는다)
// 채점하지 않는다 — 핀이 ★ 과 같은 칸이어도 "맞았다"고 하지 않는다 ("같은 칸에 있어요"). 독자 기록 없음.
// ★ 칸의 이름: 넘기기 전에는 그 칸의 머리 ("대응을 소홀히 했어요" — 판단 그 자체)를 보일 수 없다. 골든의 풀이 장면이 같은 칸을 부르는 말 ("알림 뒤의 대응" — scenes.aha.real 의 머리)을 쓴다. 새로 지은 이름이 아니다.

/** 넘기기 전에 보이는 칸의 이름 — ★ 칸은 판단이 든 머리 대신 골든의 다른 자리에 있는 이름 */
export const faceName = (card: PageCard): string => (card.star ? PIPC.scenes.aha.real[1]!.head.t : card.head);

function When({ card }: { card: PageCard }) {
  return card.when ? (
    <span className="fr-pg-when">
      <Txt item={card.when} />
    </span>
  ) : (
    <span className="fr-pg-when" data-none="">
      {card.no_date}
    </span>
  );
}
function Pin({ fresh }: { fresh?: boolean }) {
  return (
    <motion.span className="pl-pin" initial={fresh ? { scale: 0.3, y: -14, rotate: -18 } : false} animate={{ scale: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 16 }} data-testid="pin">
      <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 18v-6M5.5 12h9L13 7.5V3H7v4.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {PRIVACY.pin}
    </motion.span>
  );
}

export function PrivacyCard({ onDone }: { onDone: () => void }) {
  const f = PIPC.solve.lab!.frames[0] as PagesFrame;
  const n = f.cards.length;
  /** 내 핀이 꽂힌 칸 (차례 번호) */
  const [pin, setPin] = useState<number | null>(null);
  /** 처음 꽂은 칸 — 다시 꽂아도 남는다 (이 부품 안에서만) */
  const [first, setFirst] = useState<number | null>(null);
  /** 넘기기 시작했나 · 넘긴 칸의 수 */
  const [turning, setTurning] = useState(false);
  const [turned, setTurned] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const foot = useRef<HTMLDivElement>(null);
  const done = turning && turned === n;

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  useEffect(() => {
    if (turned > 0) foot.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turned]);

  const start = () => {
    if (pin === null) return;
    setFirst((x) => x ?? pin);
    setTurning(true);
  };
  const turn = () => {
    setFresh(turned);
    setOpen(turned);
    setTurned(turned + 1);
  };
  const again = () => {
    setTurning(false);
    setTurned(0);
    setOpen(null);
    setFresh(null);
    setPin(null);
  };
  const pinned = pin === null ? null : f.cards[pin]!;

  return (
    <div className="ep-lab fr-pages pl-privacy" data-phase={done ? "done" : turning ? "turn" : "pin"} data-pin={pinned?.id} data-testid="lab">
      <p className="fr-pg-label">
        <span>{f.label}</span>
        {turning ? (
          <b aria-label={`${n}${CHROME.pages.countOf} ${turned}${CHROME.pages.countUnit}`}>
            {turned}/{n}
          </b>
        ) : null}
      </p>
      {!turning ? <p className="pl-ask">{PRIVACY.ask}</p> : null}

      <ol className="fr-pg-list" aria-label={f.label}>
        {f.cards.map((c, i) => {
          const mine = pin === i;
          // 넘긴 칸 — 틀 부품의 칸과 같은 모양 (때 · 머리 · 한 줄). ★ 칸에는 위원회의 ★
          if (turning && i < turned) {
            const isOpen = open === i;
            return (
              <motion.li
                key={c.id}
                data-card={c.id}
                data-open={isOpen ? "" : undefined}
                data-star={c.star ? "" : undefined}
                data-now={c.state === "now" ? "" : undefined}
                data-none={c.when ? undefined : ""}
                data-mine={mine ? "" : undefined}
                initial={fresh === i ? { opacity: 0, rotateX: -78, y: 10 } : false}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: c.star ? 0.62 : 0.42, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <span className="fr-pg-dot" aria-hidden="true">
                  {c.star ? "★" : null}
                </span>
                <div className="fr-pg-card">
                  <button type="button" className="fr-pg-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} data-testid={`pg-row-${c.id}`}>
                    <When card={c} />
                    <strong>{c.head}</strong>
                    {c.state === "now" ? <em>{CHROME.pages.now}</em> : null}
                    {c.star ? <span className="pl-star">{PRIVACY.star}</span> : null}
                    {mine ? <Pin /> : null}
                  </button>
                  {isOpen ? (
                    <motion.p className="fr-pg-body" initial={fresh === i ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                      <Txt item={c.body} />
                    </motion.p>
                  ) : null}
                </div>
              </motion.li>
            );
          }
          // 지금 넘길 칸 — 뒤집힌 카드. ★ 칸의 뒷면에는 골든의 물음
          if (turning && i === turned) {
            return (
              <li key={c.id} data-card={c.id} data-next="" data-none={c.when ? undefined : ""}>
                <span className="fr-pg-dot" aria-hidden="true" />
                <motion.button type="button" className="fr-pg-back pl-back" data-star={c.star ? "" : undefined} onClick={turn} whileTap={{ scale: 0.975 }} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} data-testid="lab-act">
                  <span className="pl-back-top">
                    <When card={c} />
                    {mine ? <Pin /> : null}
                  </span>
                  <strong>{c.star ? f.ask : faceName(c)}</strong>
                  <em>
                    {f.action}
                    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 7.5 10 13.5l6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </em>
                </motion.button>
              </li>
            );
          }
          // 아직 뒤집혀 있는 칸 — 때 + 이름만. 넘기기 전에는 눌러서 핀을 꽂는다
          return (
            <li key={c.id} data-card={c.id} data-face="" data-none={c.when ? undefined : ""} data-mine={mine ? "" : undefined}>
              <span className="fr-pg-dot" aria-hidden="true" />
              <div className="fr-pg-card">
                <button type="button" className="fr-pg-head pl-face" aria-pressed={turning ? undefined : mine} disabled={turning} onClick={() => setPin(i)} data-testid={`pin-${c.id}`}>
                  <When card={c} />
                  <strong>{faceName(c)}</strong>
                  {mine ? <Pin fresh={!turning} /> : null}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div ref={foot} className="fr-pg-foot">
        {!turning ? (
          <>
            <div className="ep-lab-actions">
              <motion.button type="button" className="ep-lab-act" onClick={start} whileTap={{ scale: 0.97 }} disabled={pin === null} data-testid="pin-go">
                {pin === null ? PRIVACY.goWait : PRIVACY.go}
              </motion.button>
            </div>
            <p className="ep-lab-caption" data-testid="lab-caption">
              {PRIVACY.pinHint}
            </p>
          </>
        ) : null}

        {done && pinned ? (
          <>
            <motion.div className="pl-mine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} data-testid="pin-compare">
              <h3>{PRIVACY.compare}</h3>
              <p data-testid="pin-reply">
                <Txt item={PRIVACY.replies[pinned.id]!} />
              </p>
            </motion.div>
            <motion.p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.4 }}>
              <Txt item={f.caption.after} />
            </motion.p>
            <p className="pl-nograde">{PRIVACY.noGrade}</p>
            {first !== null && first !== pin ? (
              <p className="pl-first" data-testid="pin-first">
                <b>{PRIVACY.first}</b>
                {faceName(f.cards[first]!)}
              </p>
            ) : null}
            <button type="button" className="ep-lab-nextrule" onClick={again} data-testid="pin-again">
              {PRIVACY.again}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
