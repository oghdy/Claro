"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { CoverArt } from "./Art";
import { ConceptMap, type NodeState } from "./ConceptMap";
import { Mechanism } from "./Mechanism";
import { CONCEPTS, COPY, DOCS, READERS, SERIES, SOURCES, type ConceptId, type ReaderId, type T } from "./data";

// 한 회차 — 처음부터 끝까지. 넘어가는 방법은 본 화면과 같다 (D26): 한 번에 한 장 · 물음 버튼 하나 · 누른 물음이 다음 장의 머리.
// 달라진 것은 (1) 회차가 시리즈 안에 있다 (2) 독자가 아는 개념은 접힌다 (3) 끝에 내 개념 지도가 자란다 (D57).
// **지식 상태를 추정하지 않는다.** 따라온 독자의 "아는 개념"은 data.ts 의 고정값이고, 처음 온 독자는 "이거 알아요?" 에 누른 그대로다.

type SceneId = "cover" | "zero" | "event" | "tools" | "aha" | "compare" | "next" | "keep";

/** 같은 회차 · 다른 조립 — 독자마다 새로 쓰지 않는다. 장면을 고르고 접을 뿐이다 */
const ASSEMBLY: Record<ReaderId, readonly SceneId[]> = {
  new: ["cover", "zero", "event", "tools", "aha", "next", "keep"],
  follower: ["cover", "event", "tools", "aha", "compare", "next", "keep"],
};

/** 처음 온 독자가 "이거 알아요?" 에 답한 것 — seed: 알아요 · fresh: 처음 들어요 */
type Answer = "seed" | "fresh";
type Answers = Partial<Record<ConceptId, Answer>>;

const EASE = [0.2, 0.7, 0.2, 1] as const;
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.075, delayChildren: 0.12 } } };
const rise: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

// ─────────────────────────────────────────────────────────── 글

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (p === "\n" ? <br key={i} /> : p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

const SrcCtx = createContext<{ on: boolean; open: (item: T) => void }>({ on: false, open: () => {} });

/** 글 한 덩이. "근거"를 켜면 근거가 있는 글에 밑줄이 생기고, 누르면 구절이 뜬다 */
function Txt({ item, className }: { item: T; className?: string }) {
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

function P({ item }: { item: T }) {
  return (
    <motion.p className="ep-p" variants={rise}>
      <Txt item={item} />
    </motion.p>
  );
}

function Head({ asked, kicker, title }: { asked?: string; kicker: string; title: string }) {
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

function Ask({ text, onAsk }: { text: string; onAsk: () => void }) {
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

// ─────────────────────────────────────────────────────────── 시리즈 줄

function SeriesTrack() {
  return (
    <ol className="ep-track">
      {SERIES.episodes.map((e) => (
        <li key={e.no.t} data-state={e.state}>
          <span className="ep-track-dot" aria-hidden="true" />
          <span className="ep-track-no">{e.no.t}</span>
          <span className="ep-track-title">{e.title}</span>
        </li>
      ))}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────── 도구 카드

type ToolMode = { kind: "known" } | { kind: "fresh" } | { kind: "ask"; answer: Answer | undefined; onAnswer: (a: Answer) => void };

function ToolCard({ id, mode }: { id: ConceptId; mode: ToolMode }) {
  const c = CONCEPTS[id];
  const copy = COPY.tools;
  const folded0 = mode.kind === "known" || (mode.kind === "ask" && mode.answer === "seed");
  const [open, setOpen] = useState(false);
  const asking = mode.kind === "ask" && mode.answer === undefined;
  const folded = folded0 && !open;
  const status = mode.kind === "known" ? copy.foldedKnown : mode.kind === "ask" && mode.answer === "seed" ? copy.foldedSeed : asking ? null : "새 도구";

  return (
    <motion.section className="ep-tool" variants={rise} layout data-state={asking ? "ask" : folded ? "folded" : folded0 ? "reopened" : "fresh"} data-testid={`tool-${id}`}>
      <motion.header layout="position" className="ep-tool-head">
        <span className="ep-tool-mark" aria-hidden="true">
          <ToolGlyph id={id} />
        </span>
        <h2>{c.name}</h2>
        {status ? <span className="ep-tool-status">{status}</span> : null}
      </motion.header>

      {asking && mode.kind === "ask" ? (
        <motion.div layout="position" className="ep-tool-ask">
          <p>{copy.askPrompt}</p>
          <div>
            <button type="button" onClick={() => mode.onAnswer("seed")}>
              {copy.yes}
            </button>
            <button type="button" data-primary onClick={() => mode.onAnswer("fresh")}>
              {copy.no}
            </button>
          </div>
        </motion.div>
      ) : folded ? (
        <motion.div layout="position" className="ep-tool-short">
          <p>
            <Txt item={c.short} />
          </p>
          <button type="button" className="ep-link" onClick={() => setOpen(true)}>
            {copy.open}
          </button>
        </motion.div>
      ) : (
        <motion.div layout="position" className="ep-tool-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          {c.body.map((b) => (
            <p key={b.t}>
              <Txt item={b} />
            </p>
          ))}
          {folded0 ? (
            <button type="button" className="ep-link" onClick={() => setOpen(false)}>
              {copy.close}
            </button>
          ) : null}
        </motion.div>
      )}
    </motion.section>
  );
}

function ToolGlyph({ id }: { id: ConceptId }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (id === "fee")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5V12l6 6" />
      </svg>
    );
  if (id === "mfn")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M5 9.5h14M5 14.5h14" />
      </svg>
    );
  if (id === "dominance")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="3.5" y="5" width="11" height="14" rx="2" />
        <rect x="17" y="12" width="3.5" height="7" rx="1" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3.2 3.2" />
      <path d="M8 12.6c1.3-1.8 2.7-1.8 4 0s2.7 1.8 4 0" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────── 장면

interface SceneProps {
  reader: ReaderId;
  asked?: string;
  onAsk: (question: string) => void;
  answers: Answers;
  onAnswer: (id: ConceptId, a: Answer) => void;
  states: Record<ConceptId, NodeState>;
  openMap: () => void;
  restart: () => void;
}

function Cover({ reader, onAsk }: SceneProps) {
  const c = COPY.cover;
  const follower = reader === "follower";
  return (
    <>
      <motion.div className="ep-series" variants={rise}>
        <span>시리즈</span>
        <strong>{SERIES.name}</strong>
      </motion.div>
      <motion.div className="ep-cover-art" variants={rise}>
        <CoverArt />
      </motion.div>
      <motion.p className="ep-episode-no" variants={rise}>
        {c.episode.t}
      </motion.p>
      <motion.h1 className="ep-title ep-title-cover" variants={rise}>
        <Rich text={c.title} />
      </motion.h1>
      <P item={c.dek} />
      <motion.p className="ep-meta" variants={rise}>
        <Txt item={c.meta} />
      </motion.p>
      <motion.div variants={rise}>
        <SeriesTrack />
      </motion.div>
      {follower ? (
        <motion.aside className="ep-recap" variants={rise}>
          <h2>{c.recapLabel}</h2>
          {c.recap.map((r) => (
            <p key={r.t}>
              <Txt item={r} />
            </p>
          ))}
        </motion.aside>
      ) : (
        <motion.p className="ep-hint" variants={rise}>
          <Txt item={c.newHint} />
        </motion.p>
      )}
      <Ask text={follower ? c.askFollower : c.askNew} onAsk={() => onAsk(follower ? c.askFollower : c.askNew)} />
    </>
  );
}

function Zero({ asked, onAsk }: SceneProps) {
  const c = COPY.zero;
  return (
    <>
      <Head asked={asked} kicker={c.kicker.t} title={c.title.t} />
      <ol className="ep-beats">
        {c.beats.map((b, i) => (
          <motion.li key={b.head} variants={rise} data-last={i === c.beats.length - 1 ? "" : undefined}>
            <span className="ep-beat-when">
              <Txt item={b.when} />
            </span>
            <h2>{b.head}</h2>
            <p>
              <Txt item={b.body} />
            </p>
          </motion.li>
        ))}
      </ol>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

function Event({ asked, onAsk }: SceneProps) {
  const c = COPY.event;
  return (
    <>
      <Head asked={asked} kicker={c.kicker.t} title={c.title} />
      <P item={c.lead} />
      <motion.div className="ep-fines" variants={rise}>
        {c.fines.map((f) => (
          <div key={f.who}>
            <span className="ep-fine-who">{f.who}</span>
            <span className="ep-fine-amount">
              <Txt item={f.amount} />
            </span>
            <span className="ep-fine-tag">{f.tag}</span>
          </div>
        ))}
      </motion.div>
      <motion.p className="ep-note" variants={rise}>
        <Txt item={c.fineNote} />
      </motion.p>
      <motion.figure className="ep-demand" variants={rise}>
        <figcaption>{c.demandLabel}</figcaption>
        <blockquote>
          <Txt item={c.demand} />
        </blockquote>
        <p>{c.demandNote}</p>
      </motion.figure>
      <motion.div className="ep-riddle" variants={rise}>
        {c.riddle.map((r) => (
          <p key={r.t}>
            <Txt item={r} />
          </p>
        ))}
      </motion.div>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

const TOOL_ORDER: readonly ConceptId[] = ["fee", "mfn", "dominance"];

function Tools({ reader, asked, onAsk, answers, onAnswer }: SceneProps) {
  const c = COPY.tools;
  const follower = reader === "follower";
  const known = READERS[reader].known;
  // 따라온 독자: 새 도구를 먼저, 아는 도구는 접어서 아래에
  const order = follower ? [...TOOL_ORDER.filter((id) => !known.includes(id)), ...TOOL_ORDER.filter((id) => known.includes(id))] : TOOL_ORDER;
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={follower ? c.titleFollower : c.titleNew} />
      <P item={follower ? c.subFollower : c.subNew} />
      <div className="ep-tools">
        {order.map((id) => (
          <ToolCard key={id} id={id} mode={follower ? (known.includes(id) ? { kind: "known" } : { kind: "fresh" }) : { kind: "ask", answer: answers[id], onAnswer: (a) => onAnswer(id, a) }} />
        ))}
      </div>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

function Aha({ reader, asked, onAsk }: SceneProps) {
  const c = COPY.aha;
  const ask = reader === "follower" ? c.askFollower : c.askNew;
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={c.title} />
      {c.setup.map((s) => (
        <P key={s.t} item={s} />
      ))}
      <motion.div variants={rise}>
        <Mechanism />
      </motion.div>
      <motion.figure className="ep-flip" variants={rise}>
        <figcaption>{c.flipLabel}</figcaption>
        <p className="ep-flip-a">{c.flipA}</p>
        <span className="ep-flip-eq" aria-hidden="true">
          =
        </span>
        <p className="ep-flip-b">{c.flipB}</p>
      </motion.figure>
      <P item={c.flipNote} />
      <motion.h2 className="ep-sub" variants={rise}>
        {c.realLabel}
      </motion.h2>
      <motion.ul className="ep-real" variants={rise}>
        {c.real.map((r) => (
          <li key={r.head.t}>
            <strong>
              <Txt item={r.head} />
            </strong>
            <p>
              <Txt item={r.body} />
            </p>
          </li>
        ))}
      </motion.ul>
      <P item={c.verdict} />
      <motion.p className="ep-caveat" variants={rise}>
        <Txt item={c.caveat} />
      </motion.p>
      <Ask text={ask} onAsk={() => onAsk(ask)} />
    </>
  );
}

function Compare({ asked, onAsk }: SceneProps) {
  const c = COPY.compare;
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={c.title} />
      <P item={c.lead} />
      <motion.div className="ep-compare" variants={rise}>
        <div className="ep-compare-cols">
          <span />
          {c.cols.map((col) => (
            <strong key={col.t}>
              <Txt item={col} />
            </strong>
          ))}
        </div>
        {c.rows.map((r) => (
          <div key={r.label} className="ep-compare-row">
            <span>{r.label}</span>
            <p>
              <Txt item={r.a} />
            </p>
            <p>
              <Txt item={r.b} />
            </p>
          </div>
        ))}
      </motion.div>
      {c.body.map((b) => (
        <P key={b.t} item={b} />
      ))}
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

function Next({ reader, asked, onAsk, answers, onAnswer }: SceneProps) {
  const c = COPY.next;
  const follower = reader === "follower";
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={c.title} />
      <P item={c.lead} />
      <motion.ol className="ep-line" variants={rise}>
        {c.line.map((n) => (
          <li key={n.what} data-state={n.state}>
            <span className="ep-line-dot" aria-hidden="true" />
            <span className="ep-line-when">
              <Txt item={n.when} />
            </span>
            <span className="ep-line-what">{n.what}</span>
            {n.state === "now" ? <em>{c.hereLabel}</em> : null}
          </li>
        ))}
      </motion.ol>
      <motion.p className="ep-tool-lead" variants={rise}>
        {c.toolLead}
      </motion.p>
      <div className="ep-tools">
        <ToolCard id="provisional" mode={follower ? { kind: "known" } : { kind: "ask", answer: answers.provisional, onAnswer: (a) => onAnswer("provisional", a) }} />
      </div>
      <motion.h2 className="ep-sub" variants={rise}>
        {c.comingLabel}
      </motion.h2>
      <motion.ol className="ep-coming" variants={rise}>
        {c.coming.map((n, i) => (
          <li key={n.head}>
            <span aria-hidden="true">{i + 1}</span>
            <div>
              <h3>{n.head}</h3>
              <p>
                <Txt item={n.body} />
              </p>
            </div>
          </li>
        ))}
      </motion.ol>
      <motion.div className="ep-unknown" variants={rise}>
        <h2>{c.unknownLabel}</h2>
        <ul>
          {c.unknown.map((u) => (
            <li key={u.t}>{u.t}</li>
          ))}
        </ul>
        <p>
          <Txt item={c.unknownNote} />
        </p>
      </motion.div>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

const ALL: readonly ConceptId[] = ["fee", "mfn", "dominance", "provisional"];

function Keep({ reader, asked, states, openMap, restart }: SceneProps) {
  const c = COPY.keep;
  const fresh = ALL.filter((id) => states[id] === "new");
  const old = ALL.filter((id) => states[id] === "known");
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={c.title} />
      <motion.figure className="ep-oneline" variants={rise}>
        <figcaption>{c.lineLabel}</figcaption>
        <p>
          <Rich text={c.line} />
        </p>
      </motion.figure>
      <motion.div className="ep-keep-map" variants={rise}>
        <ConceptMap reader={reader} states={states} grow compact />
      </motion.div>
      <motion.div className="ep-gain" variants={rise}>
        {fresh.length ? (
          <div data-kind="new">
            <h2>
              {c.newLabel} <b>{fresh.length}</b>
            </h2>
            <p>{fresh.map((id) => CONCEPTS[id].name).join(" · ")}</p>
          </div>
        ) : null}
        {old.length ? (
          <div data-kind="known">
            <h2>
              {reader === "follower" ? c.againLabel : c.seedLabel} <b>{old.length}</b>
            </h2>
            <p>{old.map((id) => CONCEPTS[id].name).join(" · ")}</p>
          </div>
        ) : null}
      </motion.div>
      <P item={c.promise} />
      <motion.div variants={rise}>
        <button type="button" className="ep-map-button" onClick={openMap} data-testid="open-map">
          {c.mapButton}
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </motion.div>
      <motion.aside className="ep-nextup" variants={rise}>
        <h2>{c.nextTitle}</h2>
        <p>
          <Txt item={c.nextBody} />
        </p>
      </motion.aside>
      <motion.div variants={rise}>
        <button type="button" className="ep-link ep-restart" onClick={restart}>
          {c.restart}
        </button>
      </motion.div>
    </>
  );
}

const SCENES: Record<SceneId, (p: SceneProps) => ReactNode> = { cover: Cover, zero: Zero, event: Event, tools: Tools, aha: Aha, compare: Compare, next: Next, keep: Keep };

/** 장면을 지나면 그 장면의 개념을 주운 것이다 */
const PICKED_AFTER: Partial<Record<SceneId, readonly ConceptId[]>> = { tools: TOOL_ORDER, next: ["provisional"] };

// ─────────────────────────────────────────────────────────── 근거 시트

function SourceSheet({ item, onClose }: { item: T; onClose: () => void }) {
  const c = COPY.chrome;
  return (
    <motion.div className="ep-sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="ep-sheet"
        role="dialog"
        aria-label={c.srcTitle}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{c.srcTitle}</h2>
          <button type="button" onClick={onClose}>
            {COPY.map.close}
          </button>
        </header>
        {item.layer ? <p className="ep-sheet-layer">{c.layer[item.layer]}</p> : null}
        {item.calc ? <p className="ep-sheet-calc">{Object.entries(item.calc).map(([n, how]) => `${n} = ${how}`).join(" · ")}</p> : null}
        {item.src?.length ? (
          item.src.map((k) => (
            <blockquote key={k}>
              <p>{SOURCES[k].quote}</p>
              <cite>{DOCS[SOURCES[k].doc].name}</cite>
            </blockquote>
          ))
        ) : (
          <p className="ep-sheet-none">{c.srcNone}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────── 회차

export function Episode() {
  const [reader, setReader] = useState<ReaderId>("new");
  const [step, setStep] = useState(0);
  const [asked, setAsked] = useState<readonly string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [passed, setPassed] = useState<readonly ConceptId[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [srcOn, setSrcOn] = useState(false);
  const [srcItem, setSrcItem] = useState<T | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const scenes = ASSEMBLY[reader];
  const scene = scenes[step]!;

  // 개념의 상태 — 지도와 "남음"이 읽는다. 계산이 아니라 고정값 + 누른 것 + 지나온 장면이다
  const states = useMemo(() => {
    const out = {} as Record<ConceptId, NodeState>;
    for (const id of ALL) {
      if (READERS[reader].known.includes(id)) out[id] = "known";
      else if (answers[id] === "seed") out[id] = "known";
      else if (answers[id] === "fresh" || passed.includes(id)) out[id] = "new";
      else out[id] = "none";
    }
    return out;
  }, [reader, answers, passed]);
  const count = ALL.filter((id) => states[id] !== "none").length + READERS[reader].elsewhere.length;

  const reset = useCallback((r: ReaderId) => {
    setReader(r);
    setStep(0);
    setAsked([]);
    setAnswers({});
    setPassed([]);
    setMapOpen(false);
    setSrcItem(null);
  }, []);

  const onAsk = useCallback(
    (question: string) => {
      const picked = PICKED_AFTER[scene];
      if (picked) setPassed((p) => [...new Set([...p, ...picked])]);
      setAsked((a) => [...a.slice(0, step), question]);
      setStep((s) => Math.min(s + 1, scenes.length - 1));
    },
    [scene, step, scenes.length],
  );
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, reader]);

  const Scene = SCENES[scene];
  const src = useMemo(() => ({ on: srcOn, open: setSrcItem }), [srcOn]);
  const c = COPY.chrome;

  return (
    <MotionConfig reducedMotion="user">
      <SrcCtx.Provider value={src}>
        <div className="ep-root" data-reader={reader} data-scene={scene} data-src={srcOn ? "" : undefined}>
          <div className="ep-demo" role="group" aria-label="시안 조종">
            <span className="ep-demo-tag">{c.draft}</span>
            <div className="ep-demo-readers">
              {(Object.keys(READERS) as ReaderId[]).map((r) => (
                <button key={r} type="button" aria-pressed={reader === r} onClick={() => reset(r)} data-testid={`reader-${r}`}>
                  {READERS[r].label}
                </button>
              ))}
            </div>
            <button type="button" className="ep-demo-src" aria-pressed={srcOn} onClick={() => setSrcOn((v) => !v)} data-testid="src-toggle">
              근거
            </button>
          </div>

          <header className="ep-bar">
            <button type="button" className="ep-back" onClick={back} disabled={step === 0} aria-label={c.back}>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="ep-bar-title">
              <span>{SERIES.name}</span>
              <span aria-hidden="true"> · </span>
              <span>{COPY.cover.episode.t}</span>
            </p>
            <span className="ep-count" aria-label={`${scenes.length}장 가운데 ${step + 1}장`}>
              {step + 1}/{scenes.length}
            </span>
            <button type="button" className="ep-mapbtn" onClick={() => setMapOpen(true)} aria-label={c.mapAria} data-testid="map-button">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 6.5 10 14l5-7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="5" cy="6" r="2.2" fill="currentColor" />
                <circle cx="15" cy="6" r="2.2" fill="currentColor" />
                <circle cx="10" cy="14.5" r="2.2" fill="currentColor" />
              </svg>
              <motion.b key={count} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
                {count}
              </motion.b>
            </button>
          </header>

          <div className="ep-scroll" ref={scroller}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={`${reader}-${scene}`}
                className="ep-scene"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              >
                <Scene
                  reader={reader}
                  asked={step > 0 ? asked[step - 1] : undefined}
                  onAsk={onAsk}
                  answers={answers}
                  onAnswer={(id, a) => setAnswers((prev) => ({ ...prev, [id]: a }))}
                  states={states}
                  openMap={() => setMapOpen(true)}
                  restart={() => reset(reader)}
                />
              </motion.main>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {mapOpen ? (
              <motion.div
                className="ep-mapview"
                role="dialog"
                aria-label={COPY.map.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: EASE }}
                data-testid="map-view"
              >
                <header>
                  <h1>{COPY.map.title}</h1>
                  <button type="button" onClick={() => setMapOpen(false)}>
                    {COPY.map.close}
                  </button>
                </header>
                <ConceptMap reader={reader} states={states} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>{srcItem ? <SourceSheet item={srcItem} onClose={() => setSrcItem(null)} /> : null}</AnimatePresence>
        </div>
      </SrcCtx.Provider>
    </MotionConfig>
  );
}
