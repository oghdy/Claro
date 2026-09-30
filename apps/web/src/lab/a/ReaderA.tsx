"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticlePackage, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../../lib/levels";
import { LabSlide } from "../LabSlide";
import { LAYER_WORD, prefersReducedMotion } from "../layers";

// A — 세로 · 명조 · 종이
//   슬라이드와 질문이 번갈아 한 화면씩 세로로 넘어간다. open_question 은 자기 화면을 가진다 (D17).
//   화면보다 긴 슬라이드: 페이지가 글 길이만큼 늘어나고, 그 페이지에서만 문단마다 멈춤 자리가 생긴다(data-tall).
//     페이지 하나만 멈춤 자리로 두면 브라우저가 긴 페이지의 꼬리를 건너뛰거나(세게 넘길 때) 꼬리에 갇힌다(휠 한 칸씩).
//     문단 단위로 멈추면 한 번 넘길 때 한 문단씩 내려가고, 마지막 문단 다음이 물음 화면이다.
//   페이지 끝에도 멈춤 자리(scroll-snap-stop: always)가 있어서, 세게 넘겨도 글 끝에서 한 번 멈춘다.
//   아래에 글이 남아 있으면 "아래에 더 있어요"가 뜬다 — 스크롤 위치로 켜고 끄는 탐색 계산뿐 (D12 는 글에 대한 규칙).
//   층 표시: "층 보기"를 켜면 층이 바뀌는 자리마다 글자 꼬리표(사실 · 해석 · 개념 · 연결). 기본은 꺼짐 — 읽기가 먼저.

export function ReaderA({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [idx, setIdx] = useState(0);
  const [lens, setLens] = useState(false);
  const level = pkg.levels.find((l) => l.id === levelId)!;

  return (
    <div className="lab-a" data-lens={lens ? "" : undefined}>
      <header className="a-bar">
        <div className="a-row">
          {pkg.levels.length > 1 && (
            <div className="a-levels" role="group" aria-label="설명 수준">
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === levelId} onClick={() => (setLevelId(l.id), setIdx(0))}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="a-lens" aria-pressed={lens} onClick={() => setLens(!lens)}>
            층 보기
          </button>
        </div>
        <div className="a-progress">
          <div className="a-segs" aria-hidden="true">
            {level.slides.map((_, i) => (
              <span key={i} data-done={i <= idx ? "" : undefined} />
            ))}
          </div>
          <span className="a-count">
            {idx + 1}/{level.slides.length}
          </span>
        </div>
        {lens && (
          <p className="a-legend">
            {LAYER_WORD.fact} — 출처에 있는 것 · {LAYER_WORD.claim} — Claro 가 끌어낸 것 · {LAYER_WORD.concept} — 배경 설명 · {LAYER_WORD.bridge} — 개념을 오늘 일에 잇는 말
          </p>
        )}
      </header>
      <DeckA key={level.id} level={level} onIndex={setIdx} />
    </div>
  );
}

function DeckA({ level, onIndex }: { level: Level; onIndex: (i: number) => void }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const n = level.slides.length;

  useEffect(() => {
    const deck = deckRef.current!;
    // 화면보다 긴 페이지 표시 — 레이아웃 측정(탐색). 글의 값을 계산하지 않는다
    const measure = () =>
      deck.querySelectorAll<HTMLElement>(".a-page").forEach((p) => p.toggleAttribute("data-tall", p.offsetHeight > deck.clientHeight + 1));
    const update = () => {
      const top = deck.scrollTop;
      const bottom = top + deck.clientHeight;
      const mid = top + deck.clientHeight / 2;
      let cur = 0;
      let here: HTMLElement | null = null;
      deck.querySelectorAll<HTMLElement>(".a-page").forEach((p) => {
        if (p.offsetTop <= mid) {
          here = p;
          const s = p.dataset.slideIndex ?? p.dataset.afterSlide;
          if (s !== undefined) cur = Number(s);
        }
      });
      onIndex(cur);
      const h = here as HTMLElement | null;
      setMore(!!h && h.offsetTop + h.offsetHeight > bottom + 24);
    };
    const resize = () => (measure(), update());
    resize();
    deck.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", resize);
    document.fonts?.ready.then(resize);
    return () => (deck.removeEventListener("scroll", update), window.removeEventListener("resize", resize));
  }, [onIndex]);

  const toStart = () => deckRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <>
      <div className="a-deck" ref={deckRef} data-level={level.id} tabIndex={0}>
        {level.slides.flatMap((s, i) => {
          const q = level.open_questions[i];
          const out = [
            <section key={`s${i}`} className="a-page a-slide-page" data-slide-index={i}>
              <LabSlide slide={s} />
              {i === n - 1 && (
                <div className="a-end">
                  <button type="button" onClick={toStart}>
                    처음부터 다시 보기
                  </button>
                </div>
              )}
            </section>,
          ];
          if (i < n - 1 && q)
            out.push(
              <section key={`q${i}`} className="a-page a-q-page" data-after-slide={i} aria-label="다음 장으로">
                <p className="a-q" data-u="oq">
                  {q.text}
                </p>
                <span className="a-q-next" aria-hidden="true">
                  ↓
                </span>
              </section>,
            );
          return out;
        })}
      </div>
      <div className="a-more" data-show={more ? "" : undefined} aria-hidden="true">
        아래에 더 있어요 ↓
      </div>
    </>
  );
}
