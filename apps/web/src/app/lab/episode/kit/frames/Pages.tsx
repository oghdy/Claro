"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CHROME } from "../chrome";
import { Txt } from "../parts";
import type { PageCard, PagesFrame } from "./types";

// 틀: 넘겨 보기 — 일의 차례를 한 칸씩 넘긴다 (UX-5 · 실물: 개인정보 1화의 대교 여섯 칸).
//   독자가 하는 것: 뒤집힌 카드(뒷면에는 그 칸의 때만 보인다)를 눌러 넘긴다. 넘긴 칸은 한 줄로 접혀 위에 쌓인다 — 다 넘기면 차례 전체가 한 화면에 남는다.
//   ★ 칸: 넘기기 직전, 뒷면에 물음(ask)이 보인다. 넘기면 그 칸만 강조색이다 — "아!"는 앞 칸(알림)이 만든 기대 위에 선다.
//   접힌 칸을 누르면 그 칸이 다시 펼쳐진다 (앞뒤를 오가며 본다).
// 그리지 않는 것 (계약 §7.8)
//   · 칸과 칸 사이의 화살표 — 차례만 있다 (가는 세로줄). 문서가 까닭을 말하지 않았다
//   · 앞날 칸 — 마지막 칸 뒤에는 아무것도 없다 (계약 불변식 24)
//   · 지어낸 날짜 — 때가 문서에 없는 칸은 점선 꼬리표로 "날짜 없음"(no_date)을 보인다 (계약 불변식 22)
// 그림은 칸들 자체다 — 켜고 끄기처럼 따로 만든 그림 부품이 없다. 데이터만 받는다.
//
// seen: 이 그림을 본 독자 (D61 ②) — 넘기기 · 물음 없이 차례 전체가 펼쳐져 있다. 칸을 누르면 그 칸의 글. "다시 해 보기"로 처음처럼 넘겨 볼 수 있다.
//   값만 바뀌는 다시 쓰기는 **같은 차례의 다음 문서**에서만 선다 (칸이 더해지고 "날짜 없음"이 날짜로) — 그 실물은 아직 없다.

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

function Row({ card, open, onToggle, fresh }: { card: PageCard; open: boolean; onToggle: () => void; fresh: boolean }) {
  return (
    <motion.li
      data-card={card.id}
      data-open={open ? "" : undefined}
      data-star={card.star ? "" : undefined}
      data-now={card.state === "now" ? "" : undefined}
      data-none={card.when ? undefined : ""}
      initial={fresh ? { opacity: 0, rotateX: -78, y: 10 } : false}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: card.star ? 0.62 : 0.42, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <span className="fr-pg-dot" aria-hidden="true">
        {card.star ? "★" : null}
      </span>
      <div className="fr-pg-card">
        <button type="button" className="fr-pg-head" aria-expanded={open} onClick={onToggle} data-testid={`pg-row-${card.id}`}>
          <When card={card} />
          <strong>{card.head}</strong>
          {card.state === "now" ? <em>{CHROME.pages.now}</em> : null}
        </button>
        {open ? (
          <motion.p className="fr-pg-body" initial={fresh ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Txt item={card.body} />
          </motion.p>
        ) : null}
      </div>
    </motion.li>
  );
}

export function PagesCard({ frame: f, seen = false }: { frame: PagesFrame; seen?: boolean }) {
  const [redo, setRedo] = useState(false);
  const still = seen && !redo;
  const n = f.cards.length;
  /** 넘긴 칸의 수 */
  const [turned, setTurned] = useState(0);
  /** 펼쳐진 칸 (차례 번호) */
  const [open, setOpen] = useState<number | null>(null);
  /** 방금 넘긴 칸 — 그 칸만 넘어오는 움직임이 있다 */
  const [fresh, setFresh] = useState<number | null>(null);
  const foot = useRef<HTMLDivElement>(null);

  // 넘길 때마다 다음 카드(또는 끝의 글)가 화면 안에 있게
  useEffect(() => {
    if (turned > 0) foot.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turned]);

  if (still) {
    return (
      <div className="ep-lab fr-pages" data-seen="" data-picture={f.picture.id} data-testid="lab">
        <p className="fr-seen">{CHROME.seen.pagesLabel}</p>
        <ol className="fr-pg-list" aria-label={f.label}>
          {f.cards.map((c, i) => (
            <Row key={c.id} card={c} open={open === i} onToggle={() => setOpen(open === i ? null : i)} fresh={false} />
          ))}
        </ol>
        <p className="ep-lab-caption fr-seen-caption" data-hint="">
          {CHROME.seen.cardHint}
        </p>
        <button
          type="button"
          className="ep-link fr-redo"
          onClick={() => {
            setRedo(true);
            setOpen(null);
          }}
          data-testid="seen-redo"
        >
          {CHROME.seen.redo}
        </button>
      </div>
    );
  }

  const next = turned < n ? f.cards[turned]! : null;
  const done = turned === n;
  const turn = () => {
    setFresh(turned);
    setOpen(turned);
    setTurned(turned + 1);
  };
  const again = () => {
    setTurned(0);
    setOpen(null);
    setFresh(null);
  };

  return (
    <div className="ep-lab fr-pages" data-done={done ? "" : undefined} data-picture={f.picture.id} data-testid="lab">
      <p className="fr-pg-label">
        <span>{f.label}</span>
        <b aria-label={`${n}${CHROME.pages.countOf} ${turned}${CHROME.pages.countUnit}`}>
          {turned}/{n}
        </b>
      </p>

      {turned > 0 ? (
        <ol className="fr-pg-list" aria-label={f.label}>
          {f.cards.slice(0, turned).map((c, i) => (
            <Row key={c.id} card={c} open={open === i} onToggle={() => setOpen(open === i ? null : i)} fresh={fresh === i} />
          ))}
        </ol>
      ) : null}

      <div ref={foot} className="fr-pg-foot">
        {next ? (
          <motion.button
            key={next.id}
            type="button"
            className="fr-pg-back"
            data-star={next.star ? "" : undefined}
            data-left={Math.min(2, n - turned - 1)}
            onClick={turn}
            whileTap={{ scale: 0.975 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: turned ? 0.25 : 0 }}
            data-testid="lab-act"
          >
            <When card={next} />
            {next.star ? <strong>{f.ask}</strong> : null}
            <em>
              {f.action}
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 7.5 10 13.5l6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </em>
          </motion.button>
        ) : (
          <>
            <motion.p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
              <Txt item={f.caption.after} />
            </motion.p>
            <button type="button" className="ep-link fr-redo" onClick={again} data-testid="lab-again">
              {f.again}
            </button>
          </>
        )}
        {turned === 0 ? (
          <p className="ep-lab-caption" data-testid="lab-caption">
            <Txt item={f.caption.before} />
          </p>
        ) : null}
      </div>
    </div>
  );
}
