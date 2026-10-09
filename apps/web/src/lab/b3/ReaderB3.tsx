"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticlePackage, Layer, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../../lib/levels";
import { LabSlide } from "../LabSlide";
import { LAYER_EXPLAIN, LAYER_WORD, prefersReducedMotion } from "../layers";

// B3 (2026-10-09, 시험 — 확정 아님) — B2 에서 손맛과 배치를 다듬어 본 것. /lab/b · /lab/b2 는 그대로 둔다.
//   1. 카드가 들어오면 kicker → 제목 → 블록 순으로 짧게 차례로 나타난다
//   2. 물음 버튼은 "다 읽었을 때" 나온다 — 버튼 자리가 화면에 들어온 뒤, 앞의 글이 다 나타난 다음에.
//      짧은 카드는 버튼이 화면 아래쪽에 선다(엄지 자리가 매 장 같다). 긴 카드는 글 끝까지 내려가야 나온다
//   3. 누른 물음은 다음 카드 위쪽에 작게 남는다 — 이 장이 그 물음에 답한다 (D15)
//   4. 진행 막대가 손가락을 따라 채워진다
//   5. 글자를 키웠다 · callout 은 면이 아니라 왼쪽 선 · 위쪽 줄은 "층" 버튼 하나(꼬리표) · 안내는 글을 가리지 않는다
//   6. 마지막 장에 다른 레벨로 가는 길
//   움직임 줄이기 설정이면 1 · 2 의 등장 효과 없이 처음부터 다 보인다.
// 스크립트가 하는 계산은 전부 탐색이다 — 스크롤 위치, 화면에 들어왔는지, 블록 개수만큼의 등장 순서. 글의 값은 건드리지 않는다 (D12)

const STEP = 70; // 블록 하나가 나타나는 간격 (ms)
const LEAD = 160; // kicker · 제목 뒤 첫 블록까지

export function ReaderB3({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [idx, setIdx] = useState(0);
  const [tags, setTags] = useState(false);
  const segsRef = useRef<HTMLDivElement>(null);
  const level = pkg.levels.find((l) => l.id === levelId)!;
  const others = pkg.levels.filter((l) => l.id !== levelId);
  const switchLevel = (id: LevelId) => (setLevelId(id), setIdx(0));

  return (
    <div className="lab-b lab-b3" data-layers={tags ? "tags" : "off"}>
      <header className="b-bar">
        <div className="b-segs b3-segs" aria-hidden="true" ref={segsRef}>
          {level.slides.map((_, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties}>
              <i />
            </span>
          ))}
        </div>
        <div className="b-row">
          {pkg.levels.length > 1 && (
            <div className="b-levels" role="group" aria-label="설명 수준">
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === levelId} onClick={() => switchLevel(l.id)}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="b3-lens" aria-pressed={tags} onClick={() => setTags(!tags)}>
            층
          </button>
          <span className="b-count">
            {idx + 1}/{level.slides.length}
          </span>
        </div>
        {tags && (
          <p className="b-legend">
            {LAYER_WORD.fact} — 출처에 있는 것 · {LAYER_WORD.claim} — Claro 가 끌어낸 것 · {LAYER_WORD.concept} — 배경 설명 · {LAYER_WORD.bridge} — 개념을 오늘 일에 잇는 말
          </p>
        )}
      </header>
      <PagerB3 key={level.id} level={level} idx={idx} onIndex={setIdx} segs={segsRef} others={others.map((l) => l.id)} onLevel={switchLevel} />
    </div>
  );
}

function PagerB3({
  level, idx, onIndex, segs, others, onLevel,
}: {
  level: Level; idx: number; onIndex: (i: number) => void; segs: React.RefObject<HTMLDivElement | null>; others: LevelId[]; onLevel: (id: LevelId) => void;
}) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLElement | null>(null);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<Layer | null>(null);
  const n = level.slides.length;

  const go = useCallback((i: number) => {
    const pager = pagerRef.current!;
    const to = Math.max(0, Math.min(n - 1, i));
    pager.scrollTo({ left: to * pager.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [n]);

  useEffect(() => {
    const pager = pagerRef.current!;
    let settle: ReturnType<typeof setTimeout>;
    const update = () => {
      const pos = pager.scrollLeft / pager.clientWidth;
      const i = Math.round(pos);
      onIndex(i);
      segs.current?.style.setProperty("--pos", String(pos)); // 진행 막대가 손가락을 따라간다
      const card = pager.children[i] as HTMLElement | undefined;
      setMore(!!card && card.scrollTop + card.clientHeight < card.scrollHeight - 24);
      // 멈췄는데 카드 가장자리에서 어긋나 있으면 맞춘다 (iOS Safari 에서 한 번 본 어긋남의 안전장치)
      clearTimeout(settle);
      settle = setTimeout(() => {
        const want = Math.round(pager.scrollLeft / pager.clientWidth) * pager.clientWidth;
        if (Math.abs(pager.scrollLeft - want) > 1) pager.scrollTo({ left: want, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }, 220);
    };
    update();
    pager.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    const key = (e: KeyboardEvent) => {
      const i = Math.round(pager.scrollLeft / pager.clientWidth);
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", key);

    // 등장: 카드가 화면에 들어오기 시작하면 글이 차례로 나타나고(data-seen), 물음 버튼 자리가 화면에 들어오면 버튼이 나온다(data-ready)
    let seenIO: IntersectionObserver | undefined, readyIO: IntersectionObserver | undefined;
    if (!prefersReducedMotion()) {
      const seenAt = new WeakMap<Element, number>();
      seenIO = new IntersectionObserver(
        (es) => es.forEach((e) => {
          if (!e.isIntersecting || seenAt.has(e.target)) return;
          seenAt.set(e.target, performance.now());
          e.target.setAttribute("data-seen", "");
        }),
        { root: pager, threshold: 0.12 },
      );
      readyIO = new IntersectionObserver(
        (es) => es.forEach((e) => {
          const card = e.target.closest<HTMLElement>(".b-card")!;
          if (!e.isIntersecting || card.hasAttribute("data-ready")) return;
          if (!seenAt.has(card)) (seenAt.set(card, performance.now()), card.setAttribute("data-seen", ""));
          // 앞의 글이 다 나타난 다음에 — 이미 다 나타났으면(긴 카드를 내려온 경우) 바로
          const blocks = card.querySelectorAll(".x-block").length;
          const wait = Math.max(0, seenAt.get(card)! + LEAD + blocks * STEP + 260 - performance.now());
          (e.target as HTMLElement).style.transitionDelay = `${Math.round(wait)}ms`;
          card.setAttribute("data-ready", "");
          readyIO!.unobserve(e.target);
        }),
        { threshold: 0.6 },
      );
      Array.from(pager.children).forEach((c) => {
        seenIO!.observe(c);
        const btn = c.querySelector(".b3-end");
        if (btn) readyIO!.observe(btn);
      });
    }
    return () => {
      pager.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", key);
      clearTimeout(settle);
      seenIO?.disconnect();
      readyIO?.disconnect();
    };
  }, [onIndex, go, segs]);

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
          const prev = i > 0 ? level.open_questions[i - 1] : undefined;
          return (
            <section
              key={i}
              className="b-card"
              data-slide-index={i}
              aria-roledescription="카드"
              aria-label={`${i + 1}/${n}`}
              style={{ "--n": s.blocks.length } as React.CSSProperties}
            >
              {/* 방금 누른 물음 — 이 장이 답한다. 같은 글이 앞 카드의 버튼에 있으므로 읽기 도구에는 숨긴다 */}
              {prev && (
                <p className="b3-echo" aria-hidden="true">
                  {prev.text}
                </p>
              )}
              <LabSlide slide={s} />
              {i === 0 && <p className="b3-tip">문장을 누르면 그 문장이 사실인지 해석인지 보여요</p>}
              <div className="b3-end">
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
                  <div className="b3-last">
                    {others.map((id) => (
                      <button key={id} type="button" className="b-next" onClick={() => onLevel(id)}>
                        <span className="b-next-q">{LEVEL_NAMES[id]}으로 다시 읽기</span>
                        <span className="b-next-arrow" aria-hidden="true">
                          →
                        </span>
                      </button>
                    ))}
                    <button type="button" className="b-next b-restart" onClick={() => go(0)}>
                      처음부터 다시 보기
                    </button>
                  </div>
                )}
              </div>
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
