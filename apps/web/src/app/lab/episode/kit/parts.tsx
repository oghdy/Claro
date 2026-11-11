"use client";

import { createContext, useContext } from "react";
import { motion, type Variants } from "motion/react";
import type { T } from "./types";

// 장면과 풀이 부품이 같이 쓰는 작은 것들 — 글 한 덩이 · 머리 · 물음 버튼 · 움직임 값.
// UX-4 에서 Episode.tsx 밖으로 꺼냈다 (풀이 부품 kit/frames/* 과 조용히 견본이 같은 것을 쓴다). 글자 · 모양은 바꾸지 않았다.

export const EASE = [0.2, 0.7, 0.2, 1] as const;
export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.075, delayChildren: 0.12 } } };
export const rise: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

// ─────────────────────────────────────────────────────────── 글

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (p === "\n" ? <br key={i} /> : p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export const SrcCtx = createContext<{ on: boolean; open: (item: T) => void }>({ on: false, open: () => {} });

/** 글 한 덩이. "근거"를 켜면 근거가 있는 글에 밑줄이 생기고, 누르면 구절이 뜬다 */
export function Txt({ item, className }: { item: T; className?: string }) {
  const { on, open } = useContext(SrcCtx);
  const has = Boolean(item.src?.length || item.layer);
  if (on && has) {
    return (
      <button type="button" className={`ep-src-hit ${className ?? ""}`} onClick={() => open(item)}>
        <Rich text={item.t} />
      </button>
    );
  }
  return (
    <span className={className}>
      <Rich text={item.t} />
    </span>
  );
}

export function P({ item }: { item: T }) {
  return (
    <motion.p className="ep-p" variants={rise}>
      <Txt item={item} />
    </motion.p>
  );
}

export function Head({ asked, kicker, title }: { asked?: string; kicker: string; title: string }) {
  return (
    <>
      {asked ? (
        <motion.p className="ep-asked" variants={rise}>
          <span aria-hidden="true">Q</span>
          {asked}
        </motion.p>
      ) : null}
      <motion.p className="ep-kicker" variants={rise}>
        {kicker}
      </motion.p>
      <motion.h1 className="ep-title" variants={rise}>
        <Rich text={title} />
      </motion.h1>
    </>
  );
}

export function Ask({ text, onAsk }: { text: string; onAsk: () => void }) {
  return (
    <motion.div className="ep-ask-wrap" variants={rise}>
      <motion.button type="button" className="ep-ask" onClick={onAsk} whileTap={{ scale: 0.975 }} data-testid="ask">
        <span>{text}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3v13M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
