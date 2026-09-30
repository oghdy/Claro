"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticlePackage, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../../lib/levels";
import { LabSlide } from "../LabSlide";
import { prefersReducedMotion } from "../layers";

// C — 이어 읽기 · 섞기 · 문서
//   스냅 없이 한 문서로 이어서 읽는다. 슬라이드 = 장(章). 장과 장 사이에 물음이 크게 한 줄 선다.
//   물음을 지나 다음 장을 읽는 동안에는 위쪽 막대에 "이 장이 답하는 물음"이 작게 남는다 (D15 — slides[i+1] 이 open_questions[i] 에 답한다).
//   화면보다 긴 슬라이드: 문제가 생기지 않는다 — 스냅이 없어서 글은 그냥 이어진다.
//   층 표시: 글꼴이 곧 층이다. 사실(fact)은 고딕, Claro 가 쓴 말(개념 · 연결 · 해석 · 이어 주는 글)은 명조.

export function ReaderC({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [idx, setIdx] = useState(0);
  const [echo, setEcho] = useState<string | null>(null);
  const level = pkg.levels.find((l) => l.id === levelId)!;
  const n = level.slides.length;

  function switchLevel(id: LevelId) {
    setLevelId(id);
    setIdx(0);
    window.scrollTo({ top: 0 });
  }
  const jump = (i: number) =>
    document.getElementById(`c-ch-${i}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

  return (
    <div className="lab-c">
      <header className="c-bar">
        <div className="c-row">
          <a className="c-brand" href="/lab">
            Claro
          </a>
          {pkg.levels.length > 1 && (
            <div className="c-levels" role="group" aria-label="설명 수준">
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === levelId} onClick={() => switchLevel(l.id)}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <span className="c-count">
            {idx + 1}/{n}
          </span>
        </div>
        <div className="c-line" aria-hidden="true">
          {level.slides.map((_, i) => (
            <span key={i} data-done={i <= idx ? "" : undefined} />
          ))}
        </div>
        {echo && (
          <p className="c-echo" aria-hidden="true">
            ↳ {echo}
          </p>
        )}
      </header>
      <div className="c-wrap">
        <nav className="c-toc" aria-label="장 목록">
          <ol>
            {level.slides.map((s, i) => (
              <li key={i} aria-current={i === idx ? "step" : undefined}>
                <button type="button" onClick={() => jump(i)}>
                  <span className="c-toc-n">{i + 1}</span>
                  {s.kicker}
                </button>
              </li>
            ))}
          </ol>
          <Legend />
        </nav>
        <DocC key={level.id} level={level} onIndex={setIdx} onEcho={setEcho} />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <p className="c-legend">
      <span data-layer="fact">고딕</span> — 기록된 사실
      <br />
      <span data-layer="claim">명조</span> — Claro 가 풀어 쓴 말 (설명 · 해석)
    </p>
  );
}

function DocC({ level, onIndex, onEcho }: { level: Level; onIndex: (i: number) => void; onEcho: (q: string | null) => void }) {
  const mainRef = useRef<HTMLElement>(null);
  const n = level.slides.length;

  useEffect(() => {
    const main = mainRef.current!;
    const update = () => {
      const bar = document.querySelector<HTMLElement>(".c-bar")?.offsetHeight ?? 0;
      const line = window.scrollY + bar + 32;
      let cur = 0;
      main.querySelectorAll<HTMLElement>(".c-ch").forEach((ch, i) => {
        if (ch.offsetTop <= line) cur = i;
      });
      onIndex(cur);
      // 장 앞의 물음이 화면 위로 지나갔으면 위쪽에 작게 남긴다
      const q = main.querySelector<HTMLElement>(`[data-before-slide="${cur}"]`);
      onEcho(q && q.offsetTop + q.offsetHeight < window.scrollY + bar ? level.open_questions[cur - 1]!.text : null);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => (window.removeEventListener("scroll", update), window.removeEventListener("resize", update), onEcho(null));
  }, [level, onIndex, onEcho]);

  return (
    <main className="c-main" ref={mainRef} data-level={level.id}>
      <div className="c-legend-top">
        <Legend />
      </div>
      {level.slides.map((s, i) => {
        const q = i > 0 ? level.open_questions[i - 1] : undefined;
        return (
          <div key={i}>
            {q && (
              <div className="c-q" data-before-slide={i} aria-label="다음 장으로">
                <p data-u="oq">{q.text}</p>
              </div>
            )}
            <section className="c-ch" id={`c-ch-${i}`} data-slide-index={i}>
              <LabSlide slide={s} />
            </section>
          </div>
        );
      })}
      <div className="c-end">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
          처음으로 ↑
        </button>
      </div>
    </main>
  );
}
