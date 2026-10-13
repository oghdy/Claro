"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, animate, motion, type Variants } from "motion/react";
import type { ArticlePackage, Level, LevelId } from "@claro/contract";
import { radius } from "@claro/tokens";
import { LEVEL_NAMES } from "../lib/levels";
import { COPY, LAYER_EXPLAIN, LAYER_LEGEND, LAYER_WORD, type Tagged } from "./copy";
import { ASK_IN, CHOREOGRAPHY, LAST_REST, PANEL, type Choreography } from "./motions";
import { loadPlace, savePlace, type LevelPlace, type Place } from "./place";
import { SlideView } from "./SlideView";

// 읽는 화면 — "물음을 따라가는 여정" (D26 · 도윤 결정).
//   1. 한 번에 한 장. 넘어가는 방법은 물음(open_question) 버튼 하나뿐이다. 쓸어서는 넘어가지 않는다 — 옆으로 움직이는 것이 없다
//   2. 물음 버튼은 다 읽었을 때 나온다 — 글이 다 나타났고, 버튼 자리가 화면에 들어왔을 때
//   3. 누른 물음이 다음 화면의 머리가 된다 (D15: slides[i+1] 이 open_questions[i] 에 답한다)
//   4. 위쪽 막대는 없다. 장수 + 지나온 길 — 뒤로 가는 길은 그것뿐이고, 아직 안 간 물음은 보여 주지 않는다
//   5. 층: "층" 버튼으로 글자 꼬리표 + 문장을 누르면 설명. 판단 색 없음 (D20)
// 장들은 같은 자리에 겹쳐 있고 지금 장만 보인다. 나머지는 inert — 읽기 도구 · 키보드가 들어가지 않는다.
// 스크립트가 하는 계산은 전부 탐색이다 — 지금 몇 장인지, 끝자리가 화면에 들어왔는지, 버튼과 머리의 화면 위치. 글의 값은 건드리지 않는다 (D12)

/**
 * 화면이 아는 순간 셋. 전부 `notice` 한 곳을 지난다 — 읽기 기록(OBSERVATION §5)을 붙일 자리다. 이 Step 에서는 아무 데도 보내지 않는다.
 *   slide  지금 장이 바뀌었다 (열자마자 첫 장 · 레벨을 바꿔 들어간 장도. 어떻게 왔는지는 모른다)
 *   level  독자가 레벨을 바꿨다
 *   end    이 장의 끝이 화면에 나왔다 — 물음 버튼을 내보내는 바로 그 판정이다. 물음 버튼이 없는 마지막 장에도 있다. 장마다 한 번
 */
export type ReaderMoment =
  | { kind: "slide"; level: LevelId; index: number }
  | { kind: "level"; from: LevelId; to: LevelId }
  | { kind: "end"; level: LevelId; index: number };

// 꼬리표 글자는 CSS 가 그린다 — 낱말은 copy.ts 한 곳에서 온다
const WORD_VARS = Object.fromEntries(Object.entries(LAYER_WORD).map(([k, v]) => [`--w-${k}`, JSON.stringify(v)])) as CSSProperties;

// 버튼의 하얀 면 — 다 보임 / 아래쪽 끝으로 걷힘
const SHOWN = `inset(0% 0% 0% 0% round ${radius.ask}px)`;
const DRAINED = `inset(100% 0% 0% 0% round ${radius.ask}px)`;

export function Reader({
  pkg, onMoment, after,
}: {
  pkg: ArticlePackage; onMoment?: (m: ReaderMoment) => void;
  /** 마지막 장의 끝 묶음에 더할 것 — 물음으로 가는 길 (study/). 없으면 화면은 그대로다 */
  after?: ReactNode;
}) {
  const [levelId, setLevelId] = useState<LevelId>(pkg.levels[0]!.id);
  const [tags, setTags] = useState(false);
  // 읽던 자리 — 레벨마다. 이 화면이 살아 있는 동안은 여기에, 새로고침을 넘어서는 place.ts 가 든다
  const places = useRef<Place["at"]>({});
  /** 되살린 횟수 — 바뀌면 Journey 를 되살린 자리에서 새로 그린다 */
  const [restored, setRestored] = useState(0);
  /** 저장된 자리를 찾아봤다 — 그 전의 첫 그림(1장)은 아직 "지금 장"이 아니다. 순간으로 내지 않는다 */
  const [live, setLive] = useState(false);
  const level = pkg.levels.find((l) => l.id === levelId)!;
  // 움직임 줄이기 설정이면 전환 · 등장 없이 바로
  const choreo = useReducedMotion() ? null : CHOREOGRAPHY;
  const still = choreo ? "" : ":still";
  const sink = useRef(onMoment);
  sink.current = onMoment;
  const notice = useCallback((m: ReaderMoment) => sink.current?.(m), []);

  // 새로고침 — 같은 탭에서 읽던 자리(레벨 · 레벨별 장)를 되살린다. 서버는 모른다: 1장으로 그려 보내고, 브라우저에서 첫 그림 전에 맞춘다
  useLayoutEffect(() => {
    const saved = loadPlace(pkg);
    setLive(true);
    if (!saved) return;
    places.current = saved.at;
    setLevelId(saved.level);
    setRestored((k) => k + 1);
  }, [pkg]);

  // 레벨을 바꾸면 — 처음 가는 레벨은 1장, 돌아온 레벨은 읽던 자리. 레벨끼리 장의 대응은 없다 (계약 §3) — 만들지 않는다
  function switchLevel(to: LevelId) {
    if (to === levelId) return;
    notice({ kind: "level", from: levelId, to });
    setLevelId(to);
    savePlace(pkg, { level: to, at: places.current });
  }

  const keep = useCallback((id: LevelId, place: LevelPlace) => {
    places.current = { ...places.current, [id]: place };
    savePlace(pkg, { level: id, at: places.current });
  }, [pkg]);

  return (
    <div className="reader" data-layers={tags ? "on" : "off"} data-motion={choreo ? "on" : "none"} style={WORD_VARS}>
      <Journey key={`${level.id}${still}:${restored}`} pkg={pkg} level={level} start={places.current[level.id]} onPlace={keep} live={live} choreo={choreo} tags={tags} onTags={setTags} onLevel={switchLevel} notice={notice} after={after} />
    </div>
  );
}

/** 기기의 "움직임 줄이기" 설정. 서버는 모른다 — 처음엔 꺼진 것으로 그리고, 브라우저에서 바로 맞춘다 (그때 Journey 를 새로 그린다) */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const flags = (n: number, first = false) => Array.from({ length: n }, (_, i) => first && i === 0);

function Journey({
  pkg, level, start, onPlace, live, choreo, tags, onTags, onLevel, notice, after,
}: {
  after?: ReactNode;
  pkg: ArticlePackage; level: Level; start: LevelPlace | undefined; onPlace: (id: LevelId, place: LevelPlace) => void; live: boolean;
  choreo: Choreography | null; tags: boolean;
  onTags: (v: boolean) => void; onLevel: (id: LevelId) => void; notice: (m: ReaderMoment) => void;
}) {
  const n = level.slides.length;
  // 읽던 자리에서 시작한다 (돌아온 레벨 · 새로고침). 없으면 1장. 지나온 장은 이미 읽은 것이다 — 글이 나타나 있고 끝을 봤다
  const [idx, setIdx] = useState(start?.idx ?? 0);
  const [leaving, setLeaving] = useState<number | null>(null);
  /** 장마다 — 몇 번째로 나타나는가 (0 = 아직 안 열렸다) · 나타나기 전에 기다릴 시간(초) */
  const [runs, setRuns] = useState(() => flags(n).map((_, i) => Number(i <= (start?.idx ?? 0))));
  const [waits, setWaits] = useState(() => flags(n).map(Number));
  /** 장마다 — 끝이 화면에 나왔다 */
  const [ended, setEnded] = useState(() => start?.ended ?? flags(n));
  const [trail, setTrail] = useState(false);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<Tagged | null>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const revealed = useRef(flags(n)); // 글이 다 나타났다
  const reached = useRef([...ended]); // ended 와 같은 값 — 사건을 한 번만 내려고 따로 든다
  const busy = useRef(false);
  const selRef = useRef<HTMLElement | null>(null);
  const others = pkg.levels.filter((l) => l.id !== level.id);

  /** 이 장의 끝이 화면에 나왔다 — 물음 버튼(마지막 장은 끝자리)을 내보낸다. 장마다 한 번 */
  const reach = useCallback((i: number) => {
    if (reached.current[i]) return;
    reached.current[i] = true;
    setEnded((v) => v.map((x, k) => x || k === i));
    notice({ kind: "end", level: level.id, index: i });
  }, [level.id, notice]);

  /** 끝자리가 화면에 들어왔는가 — 앞의 글이 다 나타난 뒤에만 본다 */
  const check = useCallback((i: number) => {
    const card = cards.current[i];
    if (!card) return;
    // "아래에 더 있어요" — 글이 다 나타난 뒤에만 (나타나는 중에는 깜빡이지 않게)
    setMore(revealed.current[i]! && card.scrollTop + card.clientHeight < card.scrollHeight - 24);
    if (reached.current[i] || !revealed.current[i]) return;
    const mark = card.querySelector(".r-end-mark");
    if (mark && mark.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom + 1) reach(i);
  }, [reach]);

  /** 지금 장이 k 가 됐다 */
  const enter = useCallback((k: number) => {
    setIdx(k);
    notice({ kind: "slide", level: level.id, index: k });
  }, [level.id, notice]);

  // 열자마자 — 지금 장을 알린다 (첫 장, 또는 되살린 자리). 한 번만
  const first = useRef(idx);
  useEffect(() => {
    if (live) notice({ kind: "slide", level: level.id, index: first.current });
  }, [live, level.id, notice]);
  // 자리가 바뀔 때마다 맡긴다 (저장은 place.ts 한 곳).
  // 시작한 자리 그대로면 맡기지 않는다 — 되살리기 전의 첫 그림(1장)이 저장된 자리를 덮지 않게
  const began = useRef({ idx, ended });
  useEffect(() => {
    if (idx === began.current.idx && ended === began.current.ended) return;
    onPlace(level.id, { idx, ended });
  }, [level.id, idx, ended, onPlace]);

  function closeSheet() {
    selRef.current?.removeAttribute("data-selected");
    selRef.current = null;
    setSel(null);
  }

  /** 지나온 자리로 (뒤로 가는 유일한 길) — 이미 읽은 장이라 그대로 보인다 */
  function jump(k: number) {
    setTrail(false);
    if (busy.current || k === idx) return;
    closeSheet();
    flushSync(() => enter(k));
    const card = cards.current[k]!;
    card.scrollTop = 0;
    card.focus({ preventScroll: true });
    check(k);
  }

  /** 물음 버튼을 눌렀다 — 그 물음이 그대로 올라가 다음 장의 머리가 된다 */
  function ask(i: number) {
    if (busy.current || i >= n - 1) return;
    closeSheet();
    setTrail(false);
    reach(i); // 물음을 눌러 넘어간다 = 이 장을 끝냈다 (OBSERVATION §5.4). 키보드로 버튼에 먼저 닿았을 때도
    const from = cards.current[i]!, to = cards.current[i + 1]!;
    // 눌려서 작아진 버튼을 제 크기로 돌려놓고 잰다 — 물음은 제 크기의 자리에서 출발한다
    const pressed = from.querySelector<HTMLElement>(".r-ask")!;
    pressed.style.transition = "none";
    pressed.style.transform = "none";
    const at = from.querySelector(".r-ask-q")!.getBoundingClientRect();
    revealed.current[i + 1] = false;
    flushSync(() => {
      setRuns((v) => v.map((x, k) => (k === i + 1 ? x + 1 : x)));
      setWaits((v) => v.map((x, k) => (k === i + 1 ? (choreo?.enter.delay ?? 0) : x)));
      if (choreo) setLeaving(i);
      enter(i + 1);
    });
    to.scrollTop = 0;
    to.focus({ preventScroll: true });
    if (!choreo) return pressed.removeAttribute("style");

    busy.current = true;
    const deck = to.parentElement!;
    deck.setAttribute("data-moving", "");
    const q = <T extends HTMLElement>(root: HTMLElement, s: string) => root.querySelector<T>(s)!;
    const btn = q(from, ".r-ask"), old = q(from, ".r-leave");
    const fly = q(to, ".r-asked-fly"), plate = q(to, ".r-asked-plate"), rule = q(to, ".r-asked-rule");
    // 머리는 이미 제자리에 있다. 버튼의 글자가 있던 곳에서 출발시킨다 — 같은 글자 · 같은 줄바꿈이라 옮겨 가는 동안 모양이 안 바뀐다
    const b = fly.getBoundingClientRect();
    const dx = at.left - b.left, dy = at.top - b.top;
    const start = `translate(${dx}px, ${dy}px)`;
    fly.style.transform = start;
    plate.style.clipPath = SHOWN;
    rule.style.transform = "scaleX(0)";
    btn.style.opacity = "0";
    const moves = [
      animate(fly, { transform: [start, "translate(0px, 0px)"] }, choreo.travel),
      animate(plate, { clipPath: [SHOWN, DRAINED] }, choreo.drain),
      animate(rule, { transform: ["scaleX(0)", "scaleX(1)"] }, choreo.rule),
      animate(old, { opacity: [1, 0], transform: ["translateY(0px) scale(1)", `translateY(${choreo.leave.y}px) scale(${choreo.leave.scale})`] }, choreo.leave.transition),
    ];
    Promise.all(moves).then(() => {
      flushSync(() => setLeaving(null));
      // 다 끝났다 — 움직이느라 붙인 것을 전부 뗀다. 남으면 되돌아온 장이 투명하거나 버튼이 안 보인다
      const clear = () => [fly, plate, rule, old, btn].forEach((el) => el.removeAttribute("style"));
      moves.forEach((m) => m.cancel());
      clear();
      requestAnimationFrame(() => {
        clear();
        deck.removeAttribute("data-moving");
        busy.current = false;
      });
    });
  }

  function onTap(e: React.MouseEvent) {
    // 표시가 없는 글(writing — 질문 · 이어 주는 말)은 눌러도 아무것도 뜨지 않는다
    const el = (e.target as HTMLElement).closest<HTMLElement>('.r-slide [data-layer]:not([data-layer="writing"])');
    selRef.current?.removeAttribute("data-selected");
    if (!el || selRef.current === el) {
      selRef.current = null;
      setSel(null);
      return;
    }
    el.setAttribute("data-selected", "");
    selRef.current = el;
    setSel(el.dataset.layer as Tagged);
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

  // 덩이(kicker · 제목 · 블록)가 나타나는 모양. 줄임 설정이면 처음부터 다 보인다
  const item: Variants = choreo
    ? {
        hidden: { opacity: 0, y: choreo.enter.y, filter: `blur(${choreo.enter.blur}px)` },
        shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: choreo.enter.transition },
      }
    : { hidden: { opacity: 1, y: 0 }, shown: { opacity: 1, y: 0, transition: { duration: 0 } } };
  const body: Variants = {
    hidden: {},
    shown: (wait: number) => ({ transition: { delayChildren: wait, staggerChildren: choreo?.enter.stagger ?? 0 } }),
  };
  const end: Variants = {
    out: { opacity: 0, y: choreo ? 16 : 0 },
    in: (rest: number) => ({ opacity: 1, y: 0, transition: choreo ? { ...ASK_IN, delay: rest } : { duration: 0 } }),
  };
  const panel = choreo ? PANEL : { duration: 0 };

  // 지나온 길 — 첫 장은 물음 없이 시작한다. "시작" 이라고 부른다 (도윤 · 2026-10-12)
  const stops = level.slides.slice(0, idx + 1).map((_, k) => (k === 0 ? COPY.start : level.open_questions[k - 1]!.text));

  return (
    <>
      <header className="r-bar">
        <div className="r-row">
          <button type="button" className="r-where" aria-expanded={trail} aria-controls="r-trail" onClick={() => setTrail(!trail)}>
            <span className="r-count">
              {idx + 1}/{n}
            </span>
            <span className="r-where-label">{COPY.trail}</span>
          </button>
          {pkg.levels.length > 1 && (
            <div className="r-levels" role="group" aria-label={COPY.levelsLabel}>
              {pkg.levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={l.id === level.id} onClick={() => onLevel(l.id)}>
                  {LEVEL_NAMES[l.id]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="r-lens" aria-pressed={tags} onClick={() => onTags(!tags)}>
            {COPY.layers}
          </button>
        </div>
        {tags && <p className="r-legend">{LAYER_LEGEND.map(([w, g]) => `${w} — ${g}`).join(" · ")}</p>}
      </header>
      <div className="r-stage">
        <div className="r-deck" data-level={level.id} onClick={onTap}>
          {level.slides.map((s, i) => {
            const q = level.open_questions[i];
            const prev = i > 0 ? level.open_questions[i - 1] : undefined;
            const active = i === idx;
            const last = i === n - 1;
            return (
              <section
                key={i}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="r-card"
                data-slide-index={i}
                data-active={active ? "" : undefined}
                data-leaving={i === leaving ? "" : undefined}
                data-ended={ended[i] ? "" : undefined}
                inert={!active}
                tabIndex={-1}
                aria-label={`${i + 1}/${n}`}
                onScroll={() => active && check(i)}
              >
                <div className="r-leave">
                  {/* 방금 누른 물음 — 이 장의 머리. plate 는 버튼의 하얀 면이다: 올라오는 동안에만 보이고 글자는 CSS 가 그린다 */}
                  {prev && (
                    <div className="r-asked">
                      <p className="r-asked-fly">
                        <span className="r-asked-plate" data-q={prev.text} aria-hidden="true" />
                        <span className="r-asked-text">{prev.text}</span>
                      </p>
                      <span className="r-asked-rule" aria-hidden="true" />
                    </div>
                  )}
                  <motion.div
                    key={runs[i]}
                    className="r-body"
                    variants={body}
                    custom={waits[i]}
                    initial="hidden"
                    animate={runs[i] ? "shown" : "hidden"}
                    onAnimationComplete={(d) => {
                      if (d !== "shown") return;
                      revealed.current[i] = true;
                      if (cards.current[i]?.hasAttribute("data-active")) check(i);
                    }}
                  >
                    <SlideView slide={s} item={item} />
                    {i === 0 && (
                      <motion.p className="r-tip" variants={item}>
                        {COPY.tip}
                      </motion.p>
                    )}
                  </motion.div>
                  {/* 장과 장 사이 (D17) — 물음. 마지막 장 뒤에는 물음이 없다: 지나온 물음 전부와 다시 읽는 길 */}
                  <motion.div className="r-end" variants={end} custom={last ? LAST_REST : 0} initial={false} animate={ended[i] ? "in" : "out"}>
                    <span className="r-end-mark" aria-hidden="true" />
                    {!last && q ? (
                      <button type="button" className="r-ask" onClick={() => ask(i)} aria-label={COPY.askLabel(q.text)}>
                        <span className="r-ask-q" data-u="oq">
                          {q.text}
                        </span>
                        <span className="r-ask-arrow" aria-hidden="true" />
                      </button>
                    ) : (
                      <div className="r-last">
                        {level.open_questions.length > 0 && (
                          <div className="r-path">
                            <p>{COPY.path}</p>
                            <ol>
                              {level.open_questions.map((oq, k) => (
                                <li key={k}>{oq.text}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {after}
                        {others.map((l) => (
                          <button key={l.id} type="button" className="r-ask r-reread" onClick={() => onLevel(l.id)}>
                            <span className="r-ask-q">{COPY.reread(l.id)}</span>
                          </button>
                        ))}
                        <button type="button" className="r-ask r-restart" onClick={() => jump(0)}>
                          {COPY.restart}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </section>
            );
          })}
        </div>
        <AnimatePresence>
          {trail && (
            <motion.nav
              className="r-trail"
              id="r-trail"
              aria-label={COPY.trail}
              initial={{ opacity: 0, y: choreo ? -8 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: choreo ? -8 : 0 }}
              transition={panel}
            >
              <ol>
                {stops.map((t, k) => (
                  <li key={k} aria-current={k === idx ? "step" : undefined}>
                    <button type="button" onClick={() => jump(k)}>
                      <span className="r-trail-n">{k + 1}</span>
                      <span className="r-trail-t">{t}</span>
                      {k === idx && <span className="r-trail-here">{COPY.here}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </motion.nav>
          )}
        </AnimatePresence>
        <div className="r-more" data-show={more && !sel && !trail ? "" : undefined} aria-hidden="true">
          {COPY.more}
        </div>
        <AnimatePresence>
          {sel && (
            <motion.div
              className="r-sheet"
              role="status"
              onClick={closeSheet}
              initial={{ opacity: 0, y: choreo ? 12 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: choreo ? 12 : 0 }}
              transition={panel}
            >
              <b className="r-sheet-word">{LAYER_WORD[sel]}</b>
              <span>{LAYER_EXPLAIN[sel]}</span>
              <span className="r-sheet-close" aria-hidden="true">
                ×
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
