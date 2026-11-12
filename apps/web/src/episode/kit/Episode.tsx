"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { CHROME } from "./chrome";
import { ConceptMap, type NodeState } from "./ConceptMap";
import { LabCard } from "./frames/LabCard";
import { PlainFlipLead, PlainQuietBody, PlainThreeCards } from "./frames/Plain";
import { Ask, EASE, Head, P, Rich, SrcCtx, Txt, rise, stagger } from "./parts";
import { SHELF, hrefOf } from "./shelf";
import { toolOf, type EpisodeData, type ReaderId, type SceneId, type T } from "./types";

// 한 회차 — 처음부터 끝까지 (공통 뼈대). 넘어가는 방법은 본 화면과 같다 (D26): 한 번에 한 장 · 물음 버튼 하나 · 누른 물음이 다음 장의 머리.
// 달라진 것은 (1) 회차가 시리즈 안에 있다 (2) 독자가 아는 개념은 접힌다 (3) 끝에 내 개념 지도가 자란다 (D57).
// **지식 상태를 추정하지 않는다.** 따라온 독자의 "아는 개념"은 회차 데이터의 고정값이고, 처음 온 독자는 "이거 알아요?" 에 누른 그대로다.
//
// UX-2: 두 회차(배달앱 · FOMC)가 이 한 부품 위에 올라간다.
// UX-4: 풀이 장면도 회차의 부품이 아니다 — 회차는 **틀에 넣을 데이터**(ep.solve)만 주고, 틀 부품(kit/frames)이 화면을 세운다. 회차가 주는 것은 —
//   ep    글 · 근거 · 도구 · 조립 · 지도 자리 · 풀이 칸 = 계약의 회차 (골든 픽스처 fixtures/episode-*.json — B-E1) + 시안 전용 (두 독자의 고정값 · 주소)
//   Art   표지 그림            Glyph 도구 카드의 작은 그림
// 장면 여덟의 모양과 차례는 여기 있고, 회차는 바꾸지 못한다.

export interface EpisodeParts {
  ep: EpisodeData;
  Art: ComponentType;
  Glyph: ComponentType<{ id: string }>;
  /**
   * 실제 화면 (F-E1 — /s/<시리즈>/<n>). 시안 띠 · 독자 스위치 · 풀이 스위치가 없고, 독자는 **처음 온 독자**다 (독자 기록이 아직 없다 — D64 ~ D67 OPEN.
   * 누가 따라온 독자인지 추정하지 않는다). 근거 단추는 위쪽 줄로 온다. 다른 회차로 가는 길은 실제 주소다. 없으면 시안 (/lab/episode/*)
   */
  real?: boolean;
  /** 시안 전용 — 처음 열 장면 · 풀이 스위치 (견본 주소가 바로 그 화면을 열려고 — UX-6). 없으면 표지 · 체험 */
  start?: { scene?: SceneId; solve?: SolveMode };
}

/**
 * 풀이를 어떻게 보이나 — **시안의 스위치다. 손으로 켠다** (지식 상태를 추정하지 않는다).
 *   lab   체험 (틀)            plain 체험 없이 — 기본 풀이 (D61 ①)            seen  이 그림을 본 독자 — 설명 없이 그림과 오늘의 값만 (D61 ②)
 */
export type SolveMode = "lab" | "plain" | "seen";

const EpCtx = createContext<EpisodeParts | null>(null);
const useEp = () => {
  const v = useContext(EpCtx);
  if (!v) throw new Error("EpCtx 밖");
  return v;
};

/** 처음 온 독자가 "이거 알아요?" 에 답한 것 — seed: 알아요 · fresh: 처음 들어요 */
type Answer = "seed" | "fresh";
type Answers = Partial<Record<string, Answer>>;

// ─────────────────────────────────────────────────────────── 시리즈 줄

function SeriesTrack() {
  const { ep } = useEp();
  return (
    <ol className="ep-track">
      {ep.track.map((e) => (
        <li key={e.no.t} data-state={e.state}>
          <span className="ep-track-dot" aria-hidden="true" />
          <span className="ep-track-no">{e.no.t}</span>
          <span className="ep-track-title">{e.title.t}</span>
        </li>
      ))}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────── 도구 카드

type ToolMode = { kind: "known" } | { kind: "fresh" } | { kind: "ask"; answer: Answer | undefined; onAnswer: (a: Answer) => void };

function ToolCard({ id, mode }: { id: string; mode: ToolMode }) {
  const { ep, Glyph } = useEp();
  const c = toolOf(ep, id);
  const copy = CHROME.tools;
  const folded0 = mode.kind === "known" || (mode.kind === "ask" && mode.answer === "seed");
  const [open, setOpen] = useState(false);
  const asking = mode.kind === "ask" && mode.answer === undefined;
  const folded = folded0 && !open;
  const status = mode.kind === "known" ? copy.foldedKnown : mode.kind === "ask" && mode.answer === "seed" ? copy.foldedSeed : asking ? null : copy.fresh;

  return (
    <motion.section className="ep-tool" variants={rise} layout data-state={asking ? "ask" : folded ? "folded" : folded0 ? "reopened" : "fresh"} data-testid={`tool-${id}`}>
      <motion.header layout="position" className="ep-tool-head">
        <span className="ep-tool-mark" aria-hidden="true">
          <Glyph id={id} />
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

// ─────────────────────────────────────────────────────────── 장면

interface SceneProps {
  reader: ReaderId;
  solveMode: SolveMode;
  asked?: string;
  onAsk: (question: string) => void;
  answers: Answers;
  onAnswer: (id: string, a: Answer) => void;
  states: Record<string, NodeState>;
  openMap: () => void;
  restart: () => void;
}

function Cover({ reader, onAsk }: SceneProps) {
  const { ep, Art } = useEp();
  const c = ep.scenes.cover;
  const follower = reader === "follower";
  return (
    <>
      <motion.div className="ep-series" variants={rise}>
        <span>{CHROME.chrome.seriesTag}</span>
        <strong>{ep.series.name}</strong>
      </motion.div>
      <motion.div className="ep-cover-art" variants={rise}>
        <Art />
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
          <h2>{c.recap_label}</h2>
          {c.recap.map((r) => (
            <p key={r.t}>
              <Txt item={r} />
            </p>
          ))}
        </motion.aside>
      ) : (
        <motion.p className="ep-hint" variants={rise}>
          <Txt item={c.new_hint} />
        </motion.p>
      )}
      <Ask text={follower ? c.ask_follower : c.ask_new} onAsk={() => onAsk(follower ? c.ask_follower : c.ask_new)} />
    </>
  );
}

function Zero({ asked, onAsk }: SceneProps) {
  const c = useEp().ep.scenes.zero;
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
  const c = useEp().ep.scenes.event;
  return (
    <>
      <Head asked={asked} kicker={c.kicker.t} title={c.title} />
      <P item={c.lead} />
      <motion.div className="ep-fines" variants={rise}>
        {c.figures.map((f) => (
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
        <Txt item={c.figure_note} />
      </motion.p>
      <motion.figure className="ep-demand" variants={rise}>
        <figcaption>{c.quote_label}</figcaption>
        <blockquote>
          <Txt item={c.quote} />
        </blockquote>
        <p>{c.quote_note}</p>
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

function Tools({ reader, asked, onAsk, answers, onAnswer }: SceneProps) {
  const { ep } = useEp();
  const c = ep.scenes.tools;
  const follower = reader === "follower";
  const known = ep.readers[reader].known;
  // 따라온 독자: 새 도구를 먼저, 아는 도구는 접어서 아래에
  // 도구 줍기 장면의 도구 = 이 장면에서 줍는 도구 (계약 pickup.tools)
  const tools = ep.pickup.tools;
  const order = follower ? [...tools.filter((id) => !known.includes(id)), ...tools.filter((id) => known.includes(id))] : tools;
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={follower ? c.title_follower : c.title_new} />
      <P item={follower ? c.sub_follower : c.sub_new} />
      <div className="ep-tools">
        {order.map((id) => (
          <ToolCard key={id} id={id} mode={follower ? (known.includes(id) ? { kind: "known" } : { kind: "fresh" }) : { kind: "ask", answer: answers[id], onAnswer: (a) => onAnswer(id, a) }} />
        ))}
      </div>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

/** 체험을 마치기 전 — 아래의 답을 접어 둔 자리 (UX-6 · D74 f). "그냥 열어 보기"로 체험 없이도 연다 (독자를 가두지 않는다) */
function LabGate({ onOpen }: { onOpen: () => void }) {
  const g = CHROME.gate;
  return (
    <motion.div className="ep-gate" variants={rise} data-testid="lab-gate">
      <span className="ep-gate-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 20 20">
          <circle cx="4.5" cy="10" r="1.8" fill="currentColor" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
          <circle cx="15.5" cy="10" r="1.8" fill="currentColor" />
        </svg>
      </span>
      <p>
        <strong>{g.note}</strong>
        <span>{g.sub}</span>
      </p>
      <button type="button" className="ep-link" onClick={onOpen} data-testid="lab-gate-open">
        {g.open}
      </button>
    </motion.div>
  );
}

// 풀이 장면 = 입구(solve.entry) + [체험 | 기본 풀이] + 문서가 말한 것(copy.aha.real) + 누구의 말(entry.whose)
// UX-6 (D74 f): 체험을 마치기 전에는 체험 아래 (풀이에서 생기는 도구 · 뒤집기 · 문서가 말한 것 · 누구의 말 · 물음 버튼)를 접어 둔다 — 스크롤로 답이 먼저 보이지 않게.
//   체험을 마치면 (틀 부품의 onDone) 또는 "그냥 열어 보기"를 누르면 열리고, 한 번 열리면 다시 접지 않는다 ("처음으로"를 눌러도).
//   이 그림을 본 독자 · 체험 없이 보기에서는 처음부터 열려 있다 (그 독자에게는 감출 답이 없다 — 다시 쓰기 · 기본 풀이).
function Aha({ reader, solveMode, asked, onAsk }: SceneProps) {
  const { ep } = useEp();
  const c = ep.scenes.aha;
  const { entry, lab, plain } = ep.solve;
  // 체험이 없는 회차는 늘 기본 풀이다. 체험이 있는 회차는 시안 스위치로만 기본 풀이를 본다
  const mode: SolveMode = !lab ? "plain" : solveMode === "plain" && !plain ? "lab" : solveMode;
  const seen = mode === "seen";
  const usePlain = mode === "plain" ? plain : null;
  const ask = usePlain?.kind === "quiet" ? usePlain.ask : reader === "follower" ? c.ask_follower : c.ask_new;
  const flip = entry.flip;
  const born = lab?.born;
  const [opened, setOpened] = useState(false);
  const open = seen || opened;
  const onDone = useCallback(() => setOpened(true), []);

  const flipFigure = flip ? (
    <>
      <motion.figure className="ep-flip" variants={rise} data-big={usePlain?.kind === "flip" ? "" : undefined}>
        <figcaption>{flip.label}</figcaption>
        <p className="ep-flip-a">{flip.a}</p>
        <span className="ep-flip-eq" aria-hidden="true">
          {flip.op}
        </span>
        <p className="ep-flip-b">{flip.b}</p>
      </motion.figure>
      <P item={flip.note} />
    </>
  ) : null;
  const real = (
    <>
      <motion.h2 className="ep-sub" variants={rise}>
        {c.real_label}
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
    </>
  );
  const whose = (
    <motion.p className="ep-caveat" variants={rise}>
      <Txt item={entry.whose} />
    </motion.p>
  );

  if (usePlain) {
    return (
      <>
        <Head asked={asked} kicker={c.kicker} title={usePlain.title} />
        {usePlain.kind === "flip" ? (
          <>
            <PlainFlipLead entry={entry} />
            {flipFigure}
            {real}
          </>
        ) : usePlain.kind === "three" ? (
          <>
            <P item={usePlain.lead} />
            <PlainThreeCards plain={usePlain} />
          </>
        ) : (
          <PlainQuietBody plain={usePlain} />
        )}
        {whose}
        <Ask text={ask} onAsk={() => onAsk(ask)} />
      </>
    );
  }
  if (!lab) return null;

  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={seen && lab.seen_title ? lab.seen_title : lab.title} />
      {seen ? null : lab.setup.map((s) => <P key={s.t} item={s} />)}
      <motion.div variants={rise}>
        <LabCard frames={lab.frames} seen={seen} onDone={onDone} />
      </motion.div>
      {open ? (
        <>
          {born ? (
            <>
              <motion.p className="ep-tool-lead" variants={rise}>
                {born.lead}
              </motion.p>
              <div className="ep-tools">
                {/* 그림을 본 독자는 그 그림이 낳은 도구도 이미 가지고 있다 — 접어서 */}
                <ToolCard id={born.tool} mode={seen ? { kind: "known" } : { kind: "fresh" }} />
              </div>
            </>
          ) : null}
          {flipFigure}
          {real}
          {whose}
          <Ask text={ask} onAsk={() => onAsk(ask)} />
        </>
      ) : (
        <LabGate onOpen={onDone} />
      )}
    </>
  );
}

function Compare({ asked, onAsk }: SceneProps) {
  const c = useEp().ep.scenes.compare;
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
  const { ep } = useEp();
  const c = ep.scenes.next;
  const follower = reader === "follower";
  // "이어짐" 장면에서 하나 더 줍는 도구 (계약 pickup.next — 실물 둘 다 하나)
  const late = ep.pickup.next[0]!;
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
            {n.state === "now" ? <em>{c.here_label}</em> : null}
          </li>
        ))}
      </motion.ol>
      <motion.p className="ep-tool-lead" variants={rise}>
        {c.tool_lead}
      </motion.p>
      <div className="ep-tools">
        <ToolCard id={late} mode={ep.readers[reader].known.includes(late) ? { kind: "known" } : follower ? { kind: "fresh" } : { kind: "ask", answer: answers[late], onAnswer: (a) => onAnswer(late, a) }} />
      </div>
      <motion.h2 className="ep-sub" variants={rise}>
        {c.coming_label}
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
        <h2>{c.unknown_label}</h2>
        <ul>
          {c.unknown.map((u) => (
            <li key={u.t}>{u.t}</li>
          ))}
        </ul>
        <p>
          <Txt item={c.unknown_note} />
        </p>
      </motion.div>
      <Ask text={c.ask} onAsk={() => onAsk(c.ask)} />
    </>
  );
}

function Keep({ reader, asked, states, openMap, restart }: SceneProps) {
  const { ep, real = false } = useEp();
  const c = ep.scenes.keep;
  const k = CHROME.keep;
  const fresh = ep.tools.map((x) => x.key).filter((id) => states[id] === "new");
  const old = ep.tools.map((x) => x.key).filter((id) => states[id] === "known");
  const others = SHELF.filter((s) => s.series !== ep.series.code);
  return (
    <>
      <Head asked={asked} kicker={c.kicker} title={c.title} />
      <motion.figure className="ep-oneline" variants={rise}>
        <figcaption>{k.lineLabel}</figcaption>
        <p>
          <Rich text={c.line} />
        </p>
      </motion.figure>
      <motion.div className="ep-keep-map" variants={rise}>
        <ConceptMap ep={ep} reader={reader} states={states} real={real} grow compact />
      </motion.div>
      <motion.div className="ep-gain" variants={rise}>
        {fresh.length ? (
          <div data-kind="new">
            <h2>
              {k.newLabel} <b>{fresh.length}</b>
            </h2>
            <p>{fresh.map((id) => toolOf(ep, id).name).join(" · ")}</p>
          </div>
        ) : null}
        {old.length ? (
          <div data-kind="known">
            <h2>
              {reader === "follower" ? k.againLabel : k.seedLabel} <b>{old.length}</b>
            </h2>
            <p>{old.map((id) => toolOf(ep, id).name).join(" · ")}</p>
          </div>
        ) : null}
      </motion.div>
      <motion.p className="ep-p" variants={rise}>
        {/* 실제 화면은 아직 읽은 기록을 남기지 않는다 — 지키지 못할 약속 ("다음에 접어 둘게요") 대신 있는 그대로 말한다 */}
        {real ? k.notSaved : k.promise}
      </motion.p>
      <motion.div variants={rise}>
        <button type="button" className="ep-map-button" onClick={openMap} data-testid="open-map">
          {k.mapButton}
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </motion.div>
      <motion.aside className="ep-nextup" variants={rise}>
        <h2>{k.nextTitle}</h2>
        <p>
          <Txt item={c.next_body} />
        </p>
      </motion.aside>
      {others.map((s) => (
        <motion.a key={s.series} className="ep-other" href={hrefOf(s, real)} variants={rise} data-testid={`other-${s.series}`}>
          <span>{k.otherLabel}</span>
          <strong>{s.name}</strong>
          <em>
            {s.episode} · {s.title}
          </em>
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.a>
      ))}
      <motion.div variants={rise}>
        <button type="button" className="ep-link ep-restart" onClick={restart}>
          {k.restart}
        </button>
        {real ? (
          <a className="ep-link ep-home" href="/" data-testid="home-link">
            {k.home}
          </a>
        ) : null}
      </motion.div>
    </>
  );
}

const SCENES: Record<SceneId, (p: SceneProps) => ReactNode> = { cover: Cover, zero: Zero, event: Event, tools: Tools, aha: Aha, compare: Compare, next: Next, keep: Keep };

// ─────────────────────────────────────────────────────────── 근거 시트

function SourceSheet({ item, onClose }: { item: T; onClose: () => void }) {
  const { ep } = useEp();
  const c = CHROME.chrome;
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
            {CHROME.map.close}
          </button>
        </header>
        {item.voice ? <p className="ep-sheet-layer">{ep.voice_labels[item.voice]}</p> : null}
        {item.calc ? <p className="ep-sheet-calc">{Object.entries(item.calc).map(([n, how]) => `${n} = ${how}`).join(" · ")}</p> : null}
        {item.src?.length ? (
          item.src.map((k) => (
            <blockquote key={k}>
              <p>{ep.quotes[k]?.quote}</p>
              <cite>{ep.docs[ep.quotes[k]?.doc ?? ""]?.name}</cite>
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

export function Episode(parts: EpisodeParts) {
  const { ep, start, real = false } = parts;
  const [reader, setReader] = useState<ReaderId>("new");
  const [step, setStep] = useState(() => Math.max(0, start?.scene ? ep.assembly.new.indexOf(start.scene) : 0));
  const [asked, setAsked] = useState<readonly string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [passed, setPassed] = useState<readonly string[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [srcOn, setSrcOn] = useState(false);
  const [srcItem, setSrcItem] = useState<T | null>(null);
  // 풀이 시안의 스위치 — 손으로 켠다. 독자를 바꾸거나 처음으로 가도 그대로 둔다
  const [solveMode, setSolveMode] = useState<SolveMode>(start?.solve ?? "lab");
  const scroller = useRef<HTMLDivElement>(null);

  const scenes = ep.assembly[reader];
  const scene = scenes[step]!;

  // 개념의 상태 — 지도와 "남음"이 읽는다. 계산이 아니라 고정값 + 누른 것 + 지나온 장면이다
  const states = useMemo(() => {
    const out: Record<string, NodeState> = {};
    for (const { key: id } of ep.tools) {
      if (ep.readers[reader].known.includes(id)) out[id] = "known";
      else if (answers[id] === "seed") out[id] = "known";
      else if (answers[id] === "fresh" || passed.includes(id)) out[id] = "new";
      else out[id] = "none";
    }
    return out;
  }, [ep, reader, answers, passed]);
  const count = ep.tools.filter((x) => states[x.key] !== "none").length + ep.readers[reader].elsewhere.reduce((n, e) => n + e.concepts.length, 0);
  const others = SHELF.filter((s) => s.series !== ep.series.code);

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
      // 장면을 지나면 그 장면의 도구를 주운 것이다 (계약 pickup)
      const picked = scene === "tools" || scene === "aha" || scene === "next" ? ep.pickup[scene] : [];
      if (picked.length) setPassed((p) => [...new Set([...p, ...picked])]);
      setAsked((a) => [...a.slice(0, step), question]);
      setStep((s) => Math.min(s + 1, scenes.length - 1));
    },
    [ep, scene, step, scenes.length],
  );
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, reader, solveMode]);

  const Scene = SCENES[scene];
  const src = useMemo(() => ({ on: srcOn, open: setSrcItem }), [srcOn]);
  const c = CHROME.chrome;

  return (
    <MotionConfig reducedMotion="user">
      <EpCtx.Provider value={parts}>
      <SrcCtx.Provider value={src}>
        <div className="ep-root" data-episode={ep.code} data-reader={reader} data-scene={scene} data-solve={scene === "aha" ? solveMode : undefined} data-src={srcOn ? "" : undefined} data-real={real ? "" : undefined}>
          {real ? null : (
          <div className="ep-demo" role="group" aria-label={c.readersAria}>
            <span className="ep-demo-tag">{c.draft}</span>
            <div className="ep-demo-readers">
              {(Object.keys(ep.readers) as ReaderId[]).map((r) => (
                <button key={r} type="button" aria-pressed={reader === r} onClick={() => reset(r)} data-testid={`reader-${r}`}>
                  {ep.readers[r].label}
                </button>
              ))}
            </div>
            <button type="button" className="ep-demo-src" aria-pressed={srcOn} onClick={() => setSrcOn((v) => !v)} data-testid="src-toggle">
              {c.src}
            </button>
            {others.map((s) => (
              <a key={s.series} className="ep-demo-switch" data-many={others.length > 1 ? "" : undefined} href={s.path} data-testid={`switch-${s.series}`}>
                {/* 다른 회차가 둘 이상이면 이름만 (좁은 화면에 한 줄로 — UX-5) */}
                {others.length > 1 ? s.short : `${s.short} ${c.switchSuffix}`}
                <svg width="11" height="11" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
          )}
          {/* 풀이 시안의 스위치 둘 — 풀이 장면에서만 보인다 (UX-4). 제품의 일부가 아니다 */}
          {!real && scene === "aha" && ep.solve.lab ? (
            <div className="ep-demo ep-demo-lab" role="group" aria-label={CHROME.lab.rowAria}>
              <span className="ep-demo-labtag">{CHROME.lab.rowTag}</span>
              {ep.solve.plain ? (
                <button type="button" className="ep-demo-src" aria-pressed={solveMode === "plain"} onClick={() => setSolveMode((m) => (m === "plain" ? "lab" : "plain"))} data-testid="lab-plain">
                  {CHROME.lab.plain}
                </button>
              ) : null}
              <button type="button" className="ep-demo-src" aria-pressed={solveMode === "seen"} onClick={() => setSolveMode((m) => (m === "seen" ? "lab" : "seen"))} data-testid="lab-seen">
                {CHROME.lab.seen}
              </button>
            </div>
          ) : null}

          <header className="ep-bar">
            {real && step === 0 ? (
              // 실제 화면의 첫 장 — 앞 장이 없다. 그 자리는 첫 화면 (시리즈 목록)으로 가는 길이다
              <a className="ep-back" href="/" aria-label={c.home} data-testid="bar-home">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <button type="button" className="ep-back" onClick={back} disabled={step === 0} aria-label={c.back}>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <p className="ep-bar-title">
              <span>{ep.series.name}</span>
              <span aria-hidden="true"> · </span>
              <span>{ep.scenes.cover.episode.t}</span>
            </p>
            {real ? (
              // 근거 — 켜면 근거가 있는 문장에 밑줄이 생기고, 누르면 원문 구절이 뜬다. 시안에서는 맨 위 띠에 있던 단추다
              <button type="button" className="ep-bar-src" aria-pressed={srcOn} onClick={() => setSrcOn((v) => !v)} data-testid="src-toggle">
                {c.src}
              </button>
            ) : null}
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
                key={`${reader}-${scene}${scene === "aha" ? `-${solveMode}` : ""}`}
                className="ep-scene"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              >
                <Scene
                  reader={reader}
                  solveMode={solveMode}
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
                aria-label={CHROME.map.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: EASE }}
                data-testid="map-view"
              >
                <header>
                  <h1>{CHROME.map.title}</h1>
                  <button type="button" onClick={() => setMapOpen(false)}>
                    {CHROME.map.close}
                  </button>
                </header>
                <ConceptMap ep={ep} reader={reader} states={states} real={real} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>{srcItem ? <SourceSheet item={srcItem} onClose={() => setSrcItem(null)} /> : null}</AnimatePresence>
        </div>
      </SrcCtx.Provider>
      </EpCtx.Provider>
    </MotionConfig>
  );
}
