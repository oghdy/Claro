"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticlePackage, Layer, Level, LevelId } from "@claro/contract";
import { LEVEL_NAMES } from "../../lib/levels";
import { LabSlide } from "../LabSlide";
import { LAYER_EXPLAIN, LAYER_WORD, prefersReducedMotion } from "../layers";

// B5 (2026-10-09, 시험 — 확정 아님) — "물음을 따라가는 여정". B4 에서 스토리 느낌(위쪽 막대 · 옆에서 들어오는 카드)을 걷어 냈다.
//   1. 누른 물음이 다음 화면의 머리가 된다 — 하얀 버튼이 그대로 위로 올라가 자리를 잡고, 그 아래로 답이 차례로 펼쳐진다
//   2. 옆으로 움직이는 것이 없다. 읽던 글은 위로 빠지고 새 글은 아래에서 올라온다 (읽는 방향 = 나아가는 방향)
//   3. 막대 대신 "지나온 길" — 장수(3/9)를 누르면 지금까지 지나온 물음이 순서대로 뜨고, 누르면 그 자리로 돌아간다.
//      아직 안 간 물음은 보여 주지 않는다 (넘길 이유를 미리 쓰지 않는다)
//   4. 마지막 장에는 지나온 물음 전부
//   넘어가는 방법은 물음 버튼 하나뿐이다(B4 와 같다). 한 번에 한 장만 보인다 — 나머지 장은 같은 자리에 겹쳐 두고 감춘다.
//   움직임 줄이기 설정이면 전환 · 등장 효과 없이 바로 바뀐다.
// 스크립트가 하는 계산은 전부 탐색이다 — 지금 몇 장인지, 버튼이 화면에 들어왔는지, 버튼과 머리의 화면 위치. 글의 값은 건드리지 않는다 (D12)

const STEP = 70;
const LEAD = 160;
const RISE = 520; // 물음이 위로 올라가는 시간 (ms)

export function ReaderB5({ pkg }: { pkg: ArticlePackage }) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [tags, setTags] = useState(false);
  const level = pkg.levels.find((l) => l.id === levelId)!;
  return (
    <div className="lab-b lab-b3 lab-b5" data-layers={tags ? "tags" : "off"}>
      <Journey key={level.id} pkg={pkg} level={level} tags={tags} onTags={setTags} onLevel={setLevelId} />
    </div>
  );
}

function Journey({
  pkg, level, tags, onTags, onLevel,
}: {
  pkg: ArticlePackage; level: Level; tags: boolean; onTags: (v: boolean) => void; onLevel: (id: LevelId) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [trail, setTrail] = useState(false);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<Layer | null>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const seenAt = useRef(new Map<number, number>());
  const busy = useRef(false);
  const selRef = useRef<HTMLElement | null>(null);
  const n = level.slides.length;
  const others = pkg.levels.filter((l) => l.id !== level.id);

  /** 물음 버튼 자리가 화면에 들어왔으면 — 앞의 글이 다 나타난 다음에 — 버튼을 내보낸다 */
  const check = useCallback((i: number) => {
    const card = cards.current[i];
    if (!card) return;
    setMore(card.scrollTop + card.clientHeight < card.scrollHeight - 24);
    const end = card.querySelector<HTMLElement>(".b3-end");
    if (!end || card.hasAttribute("data-ready")) return;
    const c = card.getBoundingClientRect(), e = end.getBoundingClientRect();
    if (e.top + e.height * 0.6 > c.bottom) return;
    const blocks = card.querySelectorAll(".x-block").length;
    const wait = Math.max(0, (seenAt.current.get(i) ?? 0) + LEAD + blocks * STEP + 260 - performance.now());
    end.style.transitionDelay = `${Math.round(wait)}ms`;
    card.setAttribute("data-ready", "");
  }, []);

  /** i 장을 연다. delay = 물음이 위로 올라가는 동안 글이 기다리는 시간 */
  const open = useCallback((i: number, delay = 0) => {
    const card = cards.current[i];
    if (!card) return;
    card.scrollTop = 0;
    if (!seenAt.current.has(i)) {
      seenAt.current.set(i, performance.now() + delay);
      card.style.setProperty("--d", `${delay}ms`);
      card.setAttribute("data-seen", "");
    }
    check(i);
  }, [check]);

  useEffect(() => open(0), [open]);

  function closeSheet() {
    selRef.current?.removeAttribute("data-selected");
    selRef.current = null;
    setSel(null);
  }

  /** 지나온 길에서 고른 자리로 (뒤로 가는 유일한 길) */
  function jump(k: number) {
    if (busy.current || k === idx) return setTrail(false);
    closeSheet();
    setTrail(false);
    setIdx(k);
    open(k);
  }

  /** 물음 버튼을 눌렀다 — 물음이 위로 올라가 다음 장의 머리가 된다 */
  function ask(i: number) {
    if (busy.current || i >= n - 1) return;
    closeSheet();
    const from = cards.current[i]!, to = cards.current[i + 1]!;
    const btn = from.querySelector<HTMLElement>(".b-next")!;
    const head = to.querySelector<HTMLElement>(".b5-asked")!;
    if (prefersReducedMotion()) {
      setIdx(i + 1);
      open(i + 1);
      return;
    }
    busy.current = true;
    to.scrollTop = 0;
    const a = btn.getBoundingClientRect(), b = head.getBoundingClientRect();
    const hs = getComputedStyle(head);
    // 버튼의 사본이 버튼 자리에서 머리 자리까지 간다. 가면서 하얀 면이 걷히고 글자가 머리의 모양이 된다
    const ghost = btn.cloneNode(true) as HTMLElement;
    ghost.removeAttribute("aria-label");
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.add("b5-ghost");
    // 글자를 위에 붙여 둔다 — 도착했을 때 머리의 글자 자리와 겹치게
    Object.assign(ghost.style, { alignItems: "flex-start", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.querySelector(".lab-b5")!.appendChild(ghost);
    btn.style.visibility = "hidden";
    from.setAttribute("data-leaving", "");
    to.setAttribute("data-incoming", "");
    setIdx(i + 1);
    open(i + 1, RISE - 180);
    ghost.querySelector<HTMLElement>(".b-next-arrow")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
    const move = ghost.animate(
      [
        { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` },
        {
          left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px`,
          padding: "0px", borderRadius: "0px", backgroundColor: "rgba(0,0,0,0)", color: hs.color, fontSize: hs.fontSize, lineHeight: hs.lineHeight,
        },
      ],
      { duration: RISE, easing: "cubic-bezier(0.3, 0.75, 0.2, 1)", fill: "forwards" },
    );
    move.onfinish = () => {
      to.removeAttribute("data-incoming");
      ghost.remove();
      from.removeAttribute("data-leaving");
      btn.style.visibility = "";
      busy.current = false;
    };
  }

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

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") (setTrail(false), closeSheet());
      if (e.key === "ArrowLeft" && idx > 0) jump(idx - 1);
    };
    const resize = () => check(idx);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => (window.removeEventListener("keydown", key), window.removeEventListener("resize", resize));
  });

  // 지나온 길 — 첫 장은 물음 없이 시작하므로 그 장의 kicker 로 부른다
  const stops = level.slides.slice(0, idx + 1).map((s, k) => (k === 0 ? s.kicker : level.open_questions[k - 1]!.text));

  return (
    <>
      <header className="b-bar b5-bar">
        <div className="b-row">
          <button type="button" className="b5-where" aria-expanded={trail} aria-controls="b5-trail" onClick={() => setTrail(!trail)}>
            <span className="b-count">
              {idx + 1}/{n}
            </span>
            <span className="b5-where-label">지나온 길</span>
          </button>
          {pkg.levels.length > 1 && (
            <div className="b-levels" role="group" aria-label="설명 수준">
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === level.id} onClick={() => onLevel(l.id)}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="b3-lens" aria-pressed={tags} onClick={() => onTags(!tags)}>
            층
          </button>
        </div>
        {tags && (
          <p className="b-legend">
            {LAYER_WORD.fact} — 출처에 있는 것 · {LAYER_WORD.claim} — Claro 가 끌어낸 것 · {LAYER_WORD.concept} — 배경 설명 · {LAYER_WORD.bridge} — 개념을 오늘 일에 잇는 말
          </p>
        )}
      </header>
      <div className="b-stage">
        <div className="b5-deck" data-level={level.id} onClick={onTap} onScrollCapture={() => check(idx)}>
          {level.slides.map((s, i) => {
            const q = level.open_questions[i];
            const prev = i > 0 ? level.open_questions[i - 1] : undefined;
            const active = i === idx;
            return (
              <section
                key={i}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="b-card"
                data-slide-index={i}
                data-active={active ? "" : undefined}
                inert={!active}
                aria-label={`${i + 1}/${n}`}
              >
                {/* 방금 누른 물음 — 이 장의 머리. 같은 글이 앞 장의 버튼에 있으므로 읽기 도구에는 숨긴다 */}
                {prev && (
                  <p className="b5-asked" aria-hidden="true">
                    {prev.text}
                  </p>
                )}
                <LabSlide slide={s} />
                {i === 0 && <p className="b3-tip">문장을 누르면 그 문장이 사실인지 해석인지 보여요</p>}
                <div className="b3-end">
                  {i < n - 1 && q ? (
                    <button type="button" className="b-next" onClick={() => ask(i)} aria-label={`다음: ${q.text}`}>
                      <span className="b-next-q" data-u="oq">
                        {q.text}
                      </span>
                      <span className="b-next-arrow" aria-hidden="true">
                        ↓
                      </span>
                    </button>
                  ) : (
                    <div className="b3-last">
                      <div className="b5-path" aria-hidden="true">
                        <p>이 물음들을 따라 여기까지 왔어요</p>
                        <ol>
                          {level.open_questions.map((oq, k) => (
                            <li key={k}>{oq.text}</li>
                          ))}
                        </ol>
                      </div>
                      {others.map((l) => (
                        <button key={l.id} type="button" className="b-next" onClick={() => onLevel(l.id)}>
                          <span className="b-next-q">{LEVEL_NAMES[l.id]}으로 다시 읽기</span>
                          <span className="b-next-arrow" aria-hidden="true">
                            →
                          </span>
                        </button>
                      ))}
                      <button type="button" className="b-next b-restart" onClick={() => jump(0)}>
                        처음부터 다시 보기
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {trail && (
          <nav className="b5-trail" id="b5-trail" aria-label="지나온 길">
            <ol>
              {stops.map((t, k) => (
                <li key={k} aria-current={k === idx ? "step" : undefined}>
                  <button type="button" onClick={() => jump(k)}>
                    <span className="b5-trail-n">{k + 1}</span>
                    <span className="b5-trail-t">{t}</span>
                    {k === idx && <span className="b5-trail-here">지금 여기</span>}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="b-more" data-show={more && !sel && !trail ? "" : undefined} aria-hidden="true">
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
    </>
  );
}
