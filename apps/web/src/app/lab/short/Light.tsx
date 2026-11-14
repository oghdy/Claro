"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Ask, EASE, P, Rich, SrcCtx, Txt, rise, stagger } from "../../../episode/kit/parts";
import { PaletteDock } from "../today/palette/PaletteDock";
import { CoverArt } from "./Art";
import { LIGHT_CHROME as C } from "./data";
import type { Block, LightStory, T, Word } from "./types";

// UX-8 — 짧은 이야기 손 견본의 화면 (lab 전용). 긴 이야기의 글 부품 (kit/parts — 글 한 덩이 · 근거 밑줄 · 물음 단추 · 움직임 값)과 CSS 를 **불러 쓰기만** 한다.
// 실제 짧은 이야기 화면 (kit/Short — 장면 넷)을 쓰지 않은 까닭: 그 부품은 계약의 칸 (어디가 · 문서가 말한 것 · 남음)을 그린다. 이 견본의 글은 칸이 아니라 **한 흐름**이다.
//   화면 둘 — 표지 → 이야기. 물음 단추는 표지의 하나뿐이고, 이야기는 한 장면 안에서 끊기지 않고 내려간다.
//   가운데에 "예상 한 번 고르기"가 하나 있다 — 고르면 받는 말이 나오고 아래가 이어진다 (어느 쪽을 골라도 같은 곳으로 간다).
//   끝 (남는 한 줄 · 낱말 · 누구의 말)은 따로 선 장면이 아니라 흐름에 이어 붙는다. 아무것도 저장하지 않는다.

export interface LightParts {
  story: LightStory;
  /** 견줘 읽을 다른 이야기 (시안 전용) */
  compare: readonly { href: string; kind: string; title: string }[];
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Chevron = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 개념 낱말 — 긴 이야기의 도구 카드와 같은 겉모습. 접혀 있다 (이야기가 이미 가르쳤다 — 카드는 되새김이다) */
function WordCard({ word }: { word: Word }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="ep-tool" data-state={open ? "fresh" : undefined} data-testid={`word-${word.key}`}>
      <header className="ep-tool-head">
        <span className="ep-tool-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2>{word.name}</h2>
      </header>
      <div className="ep-tool-short">
        <p>
          <Txt item={word.short} />
        </p>
        <button type="button" className="ep-link" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? C.fold : C.open}
        </button>
      </div>
      {open ? (
        <div className="ep-tool-body">
          {word.body.map((b) => (
            <p key={b.t}>
              <Txt item={b} />
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SourceSheet({ story: S, item, onClose }: { story: LightStory; item: T; onClose: () => void }) {
  return (
    <motion.div className="ep-sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="ep-sheet" role="dialog" aria-label={C.srcTitle} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{C.srcTitle}</h2>
          <button type="button" onClick={onClose}>
            {C.close}
          </button>
        </header>
        {item.voice ? <p className="ep-sheet-layer">{S.voice_labels[item.voice]}</p> : null}
        {item.calc ? (
          <p className="ep-sheet-calc">
            {Object.entries(item.calc)
              .map(([n, how]) => `${n} = ${how}`)
              .join(" · ")}
          </p>
        ) : null}
        {item.src?.length ? (
          item.src.map((k) => (
            <blockquote key={k}>
              <p>{S.quotes[k]?.quote}</p>
              <cite>{S.docs[S.quotes[k]?.doc ?? ""]?.name}</cite>
            </blockquote>
          ))
        ) : (
          <p className="ep-sheet-none">{C.srcNone}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Light({ story: S, compare }: LightParts) {
  const [reading, setReading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [srcOn, setSrcOn] = useState(false);
  const [srcItem, setSrcItem] = useState<T | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pickBox = useRef<HTMLElement>(null);
  const src = useMemo(() => ({ on: srcOn, open: setSrcItem }), [srcOn]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [reading]);

  // 고르기 앞 · 뒤로 흐름을 가른다 — 고르기 전에는 뒤가 보이지 않는다 (먼저 예상하고 → 결과가 그것을 받는다 · D91)
  const at = S.flow.findIndex((b) => b.kind === "pick");
  const before = at < 0 ? S.flow : S.flow.slice(0, at);
  const pick = at < 0 ? null : (S.flow[at] as Extract<Block, { kind: "pick" }>);
  const rest = at < 0 ? [] : S.flow.slice(at + 1);
  const open = !pick || picked !== null;

  const choose = (key: string) => {
    const first = picked === null;
    setPicked(key);
    // 처음 고르면 고른 칸을 화면 위쪽으로 올린다 — 받는 말과 그 아래 이어지는 글이 한눈에 들어오게 (더 내리는 것은 독자의 손이다)
    if (first)
      requestAnimationFrame(() => {
        const box = pickBox.current;
        const view = scroller.current;
        if (box && view) view.scrollTo({ top: box.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop - 18, behavior: "smooth" });
      });
  };

  const block = (b: Block, i: number) => {
    if (b.kind === "p") return <P key={i} item={b.text} />;
    if (b.kind === "cite")
      return (
        <motion.figure key={i} className="lt-cite" variants={rise}>
          <figcaption>{b.label}</figcaption>
          <blockquote>
            <Txt item={b.text} />
          </blockquote>
        </motion.figure>
      );
    if (b.kind === "flip")
      return (
        <div key={i}>
          <motion.figure className="ep-flip" variants={rise} data-big="" data-testid="flip">
            <figcaption>{b.label}</figcaption>
            <p className="ep-flip-a">
              <Txt item={b.a} />
            </p>
            <span className="ep-flip-eq" aria-hidden="true">
              {b.op}
            </span>
            <p className="ep-flip-b">
              <Txt item={b.b} />
            </p>
          </motion.figure>
          <P item={b.note} />
        </div>
      );
    return null;
  };

  const reply = pick?.options.find((o) => o.key === picked)?.reply;

  return (
    <MotionConfig reducedMotion="user">
      <SrcCtx.Provider value={src}>
        <div className="ep-root st-root" data-episode={S.code} data-scene={reading ? "story" : "cover"} data-src={srcOn ? "" : undefined} data-testid="light">
          {/* 시안 전용 — 색 스위치 (lab/today 와 같은 것 · 종이가 기본) */}
          <PaletteDock tag={C.draft} />
          <header className="ep-bar">
            {reading ? (
              <button type="button" className="ep-back" onClick={() => setReading(false)} aria-label={C.coverBack}>
                <Chevron />
              </button>
            ) : (
              <a className="ep-back" href={C.backHref} aria-label={C.back} data-testid="bar-home">
                <Chevron />
              </a>
            )}
            <p className="ep-bar-title">
              <span>{C.barKind}</span>
              <span aria-hidden="true"> · </span>
              <span>{S.category}</span>
            </p>
            <button type="button" className="ep-bar-src" aria-pressed={srcOn} onClick={() => setSrcOn((v) => !v)} data-testid="src-toggle">
              {C.src}
            </button>
          </header>

          <div className="ep-scroll" ref={scroller}>
            <AnimatePresence mode="wait" initial={false}>
              {!reading ? (
                <motion.main key="cover" className="ep-scene" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
                  <motion.div className="ep-series" variants={rise}>
                    <span>{C.barKind}</span>
                    <strong>{S.category}</strong>
                  </motion.div>
                  <motion.div className="ep-cover-art st-art" variants={rise}>
                    <CoverArt />
                  </motion.div>
                  <motion.h1 className="ep-title ep-title-cover" variants={rise}>
                    <Txt item={S.cover.title} />
                  </motion.h1>
                  <P item={S.cover.dek} />
                  <motion.p className="ep-meta" variants={rise}>
                    <Txt item={S.cover.meta} />
                  </motion.p>
                  <Ask text={S.cover.ask} onAsk={() => setReading(true)} />
                </motion.main>
              ) : (
                <motion.main key="story" className="ep-scene lt-flow" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
                  {/* 독자가 방금 누른 물음 — 이야기의 첫 문장이 이것을 받는다 */}
                  <motion.p className="lt-lead" variants={rise}>
                    <b aria-hidden="true">Q</b>
                    {S.cover.ask}
                  </motion.p>
                  {before.map(block)}
                  {pick ? (
                    <motion.section ref={pickBox} className="lt-pick" variants={rise} data-picked={picked ?? undefined} data-testid="pick">
                      <p>
                        <Txt item={pick.ask} />
                      </p>
                      <div className="lt-pick-set" role="group">
                        {pick.options.map((o) => (
                          <button key={o.key} type="button" aria-pressed={picked === o.key} onClick={() => choose(o.key)} data-testid={`pick-${o.key}`}>
                            <Rich text={o.label.t} />
                          </button>
                        ))}
                      </div>
                      {reply ? (
                        <motion.p key={picked} className="lt-reply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} data-testid="reply">
                          <Txt item={reply} />
                        </motion.p>
                      ) : null}
                    </motion.section>
                  ) : null}
                  {open ? (
                    <motion.div key="rest" variants={stagger} initial="hidden" animate="show" data-testid="rest">
                      {rest.map(block)}
                      <div className="lt-end">
                        <motion.figure className="ep-oneline" variants={rise} data-testid="oneline">
                          <figcaption>{S.keep.line_label}</figcaption>
                          <p>
                            <Txt item={S.keep.line} />
                          </p>
                        </motion.figure>
                        <motion.h2 className="lt-words-label" variants={rise}>
                          {S.keep.words_label} <b>{S.keep.words.length}</b>
                        </motion.h2>
                        <motion.div className="ep-tools" variants={rise}>
                          {S.keep.words.map((w) => (
                            <WordCard key={w.key} word={w} />
                          ))}
                        </motion.div>
                        <motion.p className="ep-caveat" variants={rise}>
                          <Txt item={S.keep.whose} />
                        </motion.p>
                        <motion.div className="lt-foot" variants={rise}>
                          <button
                            type="button"
                            className="ep-link ep-restart"
                            onClick={() => {
                              setPicked(null);
                              setReading(false);
                            }}
                          >
                            {C.restart}
                          </button>
                          <a className="ep-link ep-home" href={C.backHref} data-testid="to-today">
                            {C.toToday}
                          </a>
                        </motion.div>
                        <motion.aside className="lt-compare" variants={rise} data-testid="compare">
                          <h2>{C.compare}</h2>
                          <p>{C.compareNote}</p>
                          {compare.map((x) => (
                            <a key={x.href} className="ep-other" href={x.href}>
                              <span>{x.kind}</span>
                              <strong>{x.title}</strong>
                              <Arrow />
                            </a>
                          ))}
                        </motion.aside>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p className="lt-wait" variants={rise}>
                      {C.waitPick}
                    </motion.p>
                  )}
                </motion.main>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>{srcItem ? <SourceSheet story={S} item={srcItem} onClose={() => setSrcItem(null)} /> : null}</AnimatePresence>
        </div>
      </SrcCtx.Provider>
    </MotionConfig>
  );
}
