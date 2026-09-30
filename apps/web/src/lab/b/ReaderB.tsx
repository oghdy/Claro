"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticlePackage, Layer, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../../lib/levels";
import { LabSlide } from "../LabSlide";
import { LAYER_EXPLAIN, LAYER_WORD, prefersReducedMotion } from "../layers";

// B — 카드 · 고딕 · 촘촘
//   슬라이드 한 장 = 카드 한 장. 옆으로 넘긴다(가로 스냅 — 손가락을 그대로 따라온다). 위쪽은 스토리식 진행 막대.
//   open_question 은 카드 맨 끝의 "다음" 버튼 그 자체다 — 물음을 눌러서 넘어간다.
//   화면보다 긴 카드: 카드 안에서 세로로 스크롤된다. 물음 버튼이 글 맨 끝에 있어서 버튼에 닿으면 다 읽은 것이다.
//   아래에 글이 남아 있으면 "아래에 더 있어요"가 뜬다.
//   층 표시: 문장을 누르면 아래에서 그 문장의 층이 뜬다(사실 · 해석 · 개념 · 연결). 평소엔 아무 표시 없음.

export function ReaderB({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [idx, setIdx] = useState(0);
  const level = pkg.levels.find((l) => l.id === levelId)!;

  return (
    <div className="lab-b">
      <header className="b-bar">
        <div className="b-segs" aria-hidden="true">
          {level.slides.map((_, i) => (
            <span key={i} data-done={i <= idx ? "" : undefined} />
          ))}
        </div>
        <div className="b-row">
          {pkg.levels.length > 1 && (
            <div className="b-levels" role="group" aria-label="설명 수준">
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === levelId} onClick={() => (setLevelId(l.id), setIdx(0))}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <span className="b-count">
            {idx + 1}/{level.slides.length}
          </span>
        </div>
      </header>
      <PagerB key={level.id} level={level} idx={idx} onIndex={setIdx} />
    </div>
  );
}

function PagerB({ level, idx, onIndex }: { level: Level; idx: number; onIndex: (i: number) => void }) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLElement | null>(null);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<Layer | null>(null);
  const [hint, setHint] = useState(true);
  const n = level.slides.length;

  const go = useCallback((i: number) => {
    const pager = pagerRef.current!;
    const to = Math.max(0, Math.min(n - 1, i));
    pager.scrollTo({ left: to * pager.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [n]);

  useEffect(() => {
    const pager = pagerRef.current!;
    const update = () => {
      const i = Math.round(pager.scrollLeft / pager.clientWidth);
      onIndex(i);
      if (i > 0) setHint(false); // 한 장 넘기면 안내는 할 일을 다 했다
      const card = pager.children[i] as HTMLElement | undefined;
      setMore(!!card && card.scrollTop + card.clientHeight < card.scrollHeight - 24);
    };
    update();
    // 카드 안 세로 스크롤도 잡는다 (scroll 은 거품이 안 올라와서 capture)
    pager.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    const key = (e: KeyboardEvent) => {
      const i = Math.round(pager.scrollLeft / pager.clientWidth);
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", key);
    const t = setTimeout(() => setHint(false), 6000);
    return () => {
      pager.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", key);
      clearTimeout(t);
    };
  }, [onIndex, go]);

  // 문장을 누르면 그 문장의 층
  function onTap(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".x-slide [data-layer]");
    selRef.current?.removeAttribute("data-selected");
    if (!el || selRef.current === el) {
      selRef.current = null;
      setSel(null);
      return;
    }
    el.setAttribute("data-selected", "");
    selRef.current = el;
    setSel(el.dataset.layer as Layer);
    setHint(false);
  }
  function closeSheet() {
    selRef.current?.removeAttribute("data-selected");
    selRef.current = null;
    setSel(null);
  }

  return (
    <div className="b-stage">
      <button type="button" className="b-side b-prev" aria-label="이전 장" onClick={() => go(idx - 1)} disabled={idx === 0}>
        ‹
      </button>
      <div className="b-pager" ref={pagerRef} data-level={level.id} onClick={onTap}>
        {level.slides.map((s, i) => {
          const q = level.open_questions[i];
          return (
            <section key={i} className="b-card" data-slide-index={i} aria-roledescription="카드" aria-label={`${i + 1}/${n}`}>
              <LabSlide slide={s} />
              {i < n - 1 && q ? (
                <button type="button" className="b-next" onClick={() => go(i + 1)} aria-label={`다음 장: ${q.text}`}>
                  <span className="b-next-q" data-u="oq">
                    {q.text}
                  </span>
                  <span className="b-next-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ) : (
                <button type="button" className="b-next b-restart" onClick={() => go(0)}>
                  처음부터 다시 보기
                </button>
              )}
            </section>
          );
        })}
      </div>
      <button type="button" className="b-side b-nextside" aria-label="다음 장" onClick={() => go(idx + 1)} disabled={idx === n - 1}>
        ›
      </button>
      <div className="b-more" data-show={more && !sel ? "" : undefined} aria-hidden="true">
        아래에 더 있어요 ↓
      </div>
      {hint && !sel && (
        <p className="b-hint" role="status">
          문장을 누르면 그 문장이 사실인지 해석인지 보여요
        </p>
      )}
      {sel && (
        <div className="b-sheet" role="status" onClick={closeSheet}>
          <b className="b-sheet-word">{LAYER_WORD[sel] ?? "글"}</b>
          <span>{LAYER_EXPLAIN[sel]}</span>
          <span className="b-sheet-close" aria-hidden="true">
            ×
          </span>
        </div>
      )}
    </div>
  );
}
