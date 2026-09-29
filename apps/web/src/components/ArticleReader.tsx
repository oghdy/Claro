"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ArticlePackage, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../lib/levels";
import { Between } from "./Between";
import { Slide } from "./Slide";

// 레벨을 바꿀 때 읽던 위치 (FOMC-21)
//   레벨끼리는 슬라이드를 공유하지 않는다(§3) — "입문 4장 = 숙련 몇 장"이라는 대응이 데이터에 없다. 만들지 않는다.
//   그래서 레벨마다 자기가 읽던 장을 따로 기억한다. 처음 여는 레벨은 1장부터, 다시 돌아온 레벨은 떠났던 장에서.
//   기억은 이 화면 안에서만 산다(사용자 상태 저장은 범위 밖 — §0).

export function ArticleReader({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [idx, setIdx] = useState(0);
  const positions = useRef<Partial<Record<LevelId, number>>>({});
  const level = pkg.levels.find((l) => l.id === levelId)!;

  function switchLevel(next: LevelId) {
    if (next === levelId) return;
    positions.current[levelId] = idx;
    setIdx(positions.current[next] ?? 0);
    setLevelId(next);
  }

  return (
    <div className="reader">
      <header className="bar">
        {pkg.levels.length > 1 && (
          <div className="levels" role="group" aria-label="설명 수준">
            {pkg.levels.map((l) => (
              <button key={l.id} type="button" aria-pressed={l.id === levelId} onClick={() => switchLevel(l.id)}>
                {LEVEL_NAMES[l.id]}
              </button>
            ))}
          </div>
        )}
        <Progress index={idx} total={level.slides.length} />
      </header>
      <Deck key={level.id} level={level} startAt={positions.current[level.id] ?? 0} onIndex={setIdx} />
    </div>
  );
}

function Progress({ index, total }: { index: number; total: number }) {
  return (
    <div className="progress">
      <div className="segs" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} data-done={i <= index ? "" : undefined} />
        ))}
      </div>
      <span className="count">
        {index + 1}/{total}
      </span>
    </div>
  );
}

/** 한 레벨의 읽는 흐름: 슬라이드 · 사이 · 슬라이드 · … · 마지막 슬라이드 · 끝 */
function Deck({ level, startAt, onIndex }: { level: Level; startAt: number; onIndex: (i: number) => void }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const n = level.slides.length;

  useLayoutEffect(() => {
    // startAt 은 이 Deck 이 처음 그려질 때만 쓴다
    const page = pageRefs.current[startAt];
    if (deckRef.current && page) deckRef.current.scrollTop = page.offsetTop;
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    // 지금 장 = 화면 가운데를 지난 마지막 페이지. 페이지가 화면보다 길어도 맞다
    const update = () => {
      const mid = deck.scrollTop + deck.clientHeight / 2;
      let cur = 0;
      pageRefs.current.forEach((p, i) => {
        if (p && p.offsetTop <= mid) cur = i;
      });
      onIndex(cur);
    };
    update();
    deck.addEventListener("scroll", update, { passive: true });
    return () => deck.removeEventListener("scroll", update);
  }, [onIndex]);

  const toStart = () => pageRefs.current[0]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="deck" ref={deckRef} data-level={level.id}>
      {level.slides.map((s, i) => {
        const q = level.open_questions[i];
        return (
          <section
            key={i}
            className="page"
            data-slide-index={i}
            ref={(el) => {
              pageRefs.current[i] = el;
            }}
          >
            <Slide slide={s} />
            {i < n - 1 && q && <Between question={q} />}
            {i === n - 1 && (
              <div className="end">
                <button type="button" onClick={toStart}>
                  처음부터 다시 보기
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
