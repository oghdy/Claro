"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { SHORT_SCENE_IDS, type ShortSceneId } from "@claro/contract";
import { PIPC } from "../../../../episode/episodes/pipc/data";
import { CHROME } from "../../../../episode/kit/chrome";
import { ConceptMap, type NodeState } from "../../../../episode/kit/ConceptMap";
import { PlainFlipLead } from "../../../../episode/kit/frames/Plain";
import { Ask, EASE, Head, P, Rich, SrcCtx, Txt, rise, stagger } from "../../../../episode/kit/parts";
import { toolOf, type EpisodeData, type T } from "../../../../episode/kit/types";
import { PaletteDock } from "../palette/PaletteDock";
import { SHORT as S, SHORT_CHROME as C } from "./data";

// UX-7 — 짧은 이야기 한 편 (시안). 장면 넷: 표지 → 어디가 털렸나 (뒤집기) → 문서가 말한 것 → 남음. 체험이 없다 — 기본 풀이 "뒤집기만"의 부품을 쓴다.
// 넘어가는 방법 · 글 부품 · 근거 시트 · 지도는 긴 이야기와 같은 것이다 (src/episode/kit — 겉모습도 같은 CSS). 다른 것은 장면의 수와 무게뿐이다.
// 번호가 없다 ("N화" · 시리즈 줄 · 다음 화 예고 없음) — 주제 이름만. 도구는 긴 이야기의 카드를 글자 그대로 가리킨다. 아무것도 저장하지 않는다.
// 이야기의 모양은 계약 (ShortStory — docs/contract/EPISODE.md §13 · B-E3)이고 글은 골든 넷째 (fixtures/episode-short-privacy-yeonghun.json)다 — ./data.ts 가 읽는다.

const ORDER: readonly ShortSceneId[] = SHORT_SCENE_IDS;
/** 이 이야기의 지도 = 같은 주제 (긴 이야기)의 지도. "어디서 주웠나"의 말만 이 이야기의 것으로 */
const MAP_EP: EpisodeData = { ...PIPC, map: { ...PIPC.map, where_today: { t: C.where } } };
const TOOLS = S.tools_from.keys;

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 표지 그림 — 가입 칸이 있는 작은 창에서 점선이 새어 나간다. 긴 이야기의 "≠" 를 잇는다. 글자 · 숫자 없음 */
function ShortArt() {
  return (
    <svg viewBox="0 0 320 120" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="110" rx="118" ry="7" className="ep-art-shadow" />
      <rect x="62" y="18" width="118" height="84" rx="12" className="ep-art-phone" />
      <path d="M62 40h118" className="ep-art-line" />
      <path d="M78 56h64M78 70h86M78 84h44" className="ep-art-line" />
      <path d="M180 78h84" className="ep-art-chain" />
      <circle cx="222" cy="78" r="17" className="ep-art-eq" />
      <path d="M214 74h16M214 82h16M227 68l-10 20" className="ep-art-eqline" />
    </svg>
  );
}

/** 긴 이야기와 같은 도구 — 접어서. 펼치면 긴 이야기의 카드 글이 그대로 나온다 */
function FoldedTool({ id }: { id: string }) {
  const tool = toolOf(PIPC, id);
  const [open, setOpen] = useState(false);
  return (
    <motion.section className="ep-tool" variants={rise} data-state={open ? "reopened" : "folded"} data-testid={`tool-${id}`}>
      <header className="ep-tool-head">
        <span className="ep-tool-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2>{tool.name}</h2>
        <span className="ep-tool-status">{C.folded}</span>
      </header>
      {open ? (
        <div className="ep-tool-body">
          {tool.body.map((b) => (
            <p key={b.t}>
              <Txt item={b} />
            </p>
          ))}
          <button type="button" className="ep-link" onClick={() => setOpen(false)}>
            {C.close}
          </button>
        </div>
      ) : (
        <div className="ep-tool-short">
          <p>
            <Txt item={tool.short} />
          </p>
          <button type="button" className="ep-link" onClick={() => setOpen(true)}>
            {C.open}
          </button>
        </div>
      )}
    </motion.section>
  );
}

function SourceSheet({ item, onClose }: { item: T; onClose: () => void }) {
  const c = CHROME.chrome;
  // 도구 카드의 글은 긴 이야기의 것 — 구절도 거기서 찾는다
  const quote = (k: string) => S.quotes[k] ?? PIPC.quotes[k];
  const doc = (label: string) => S.docs[label] ?? PIPC.docs[label];
  return (
    <motion.div className="ep-sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="ep-sheet" role="dialog" aria-label={c.srcTitle} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{c.srcTitle}</h2>
          <button type="button" onClick={onClose}>
            {CHROME.map.close}
          </button>
        </header>
        {item.voice ? <p className="ep-sheet-layer">{S.voice_labels[item.voice]}</p> : null}
        {item.src?.length ? (
          item.src.map((k) => (
            <blockquote key={k}>
              <p>{quote(k)?.quote}</p>
              <cite>{doc(quote(k)?.doc ?? "")?.name}</cite>
            </blockquote>
          ))
        ) : (
          <p className="ep-sheet-none">{c.srcNone}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Short() {
  const [step, setStep] = useState(0);
  const [asked, setAsked] = useState<readonly string[]>([]);
  const [srcOn, setSrcOn] = useState(false);
  const [srcItem, setSrcItem] = useState<T | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const scene = ORDER[step]!;
  // 도구는 "문서가 말한 것" 장면을 지나면 만난 것이다 (고정 — 추정하지 않는다)
  const met = step > ORDER.indexOf("why");
  const states = useMemo(() => Object.fromEntries(PIPC.tools.map((x) => [x.key, met && TOOLS.includes(x.key) ? "new" : "none"])) as Record<string, NodeState>, [met]);
  const count = met ? TOOLS.length : 0;

  const onAsk = useCallback(
    (question: string) => {
      setAsked((a) => [...a.slice(0, step), question]);
      setStep((s) => Math.min(s + 1, ORDER.length - 1));
    },
    [step],
  );
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step]);

  const src = useMemo(() => ({ on: srcOn, open: setSrcItem }), [srcOn]);
  const head = step > 0 ? asked[step - 1] : undefined;
  const c = S.scenes;
  const flip = S.solve.entry.flip!;

  const body: Record<ShortSceneId, () => ReactNode> = {
    cover: () => (
      <>
        <motion.div className="ep-series" variants={rise}>
          <span>주제</span>
          <strong>{S.series.name}</strong>
        </motion.div>
        <motion.div className="ep-cover-art st-art" variants={rise}>
          <ShortArt />
        </motion.div>
        <motion.p className="ep-episode-no" variants={rise}>
          {C.weightLabel}
        </motion.p>
        <motion.h1 className="ep-title ep-title-cover" variants={rise}>
          <Rich text={c.cover.title} />
        </motion.h1>
        <P item={c.cover.dek} />
        <motion.p className="ep-meta" variants={rise}>
          <Txt item={c.cover.meta} />
        </motion.p>
        <motion.p className="ep-hint" variants={rise}>
          <Txt item={c.cover.hint} />
        </motion.p>
        <Ask text={c.cover.ask} onAsk={() => onAsk(c.cover.ask)} />
      </>
    ),
    where: () => (
      <>
        <Head asked={head} kicker={c.where.kicker} title={S.solve.plain.title} />
        <PlainFlipLead entry={S.solve.entry} />
        {c.where.body.map((b) => (
          <P key={b.t} item={b} />
        ))}
        <motion.figure className="ep-flip" variants={rise} data-big="">
          <figcaption>{flip.label}</figcaption>
          <p className="ep-flip-a">{flip.a}</p>
          <span className="ep-flip-eq" aria-hidden="true">
            {flip.op}
          </span>
          <p className="ep-flip-b">{flip.b}</p>
        </motion.figure>
        <P item={flip.note} />
        <motion.p className="ep-note st-unknown" variants={rise}>
          <Txt item={c.where.unknown} />
        </motion.p>
        <Ask text={c.where.ask} onAsk={() => onAsk(c.where.ask)} />
      </>
    ),
    why: () => (
      <>
        <Head asked={head} kicker={c.why.kicker} title={c.why.title} />
        <P item={c.why.lead} />
        <motion.h2 className="ep-sub" variants={rise}>
          {c.why.real_label}
        </motion.h2>
        <motion.ul className="ep-real" variants={rise}>
          {c.why.real.map((r) => (
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
        <P item={c.why.verdict} />
        <motion.p className="ep-tool-lead" variants={rise}>
          {c.why.tool_lead}
        </motion.p>
        <div className="ep-tools">
          {TOOLS.map((id) => (
            <FoldedTool key={id} id={id} />
          ))}
        </div>
        <motion.p className="ep-caveat" variants={rise}>
          <Txt item={S.solve.entry.whose} />
        </motion.p>
        <Ask text={c.why.ask} onAsk={() => onAsk(c.why.ask)} />
      </>
    ),
    keep: () => (
      <>
        <Head asked={head} kicker={c.keep.kicker} title={c.keep.title} />
        <motion.figure className="ep-oneline" variants={rise}>
          <figcaption>{C.lineLabel}</figcaption>
          <p>
            <Rich text={c.keep.line} />
          </p>
        </motion.figure>
        <motion.aside className="st-advice" variants={rise}>
          <h2>{c.keep.advice_label}</h2>
          <p>
            <Txt item={c.keep.advice} />
          </p>
        </motion.aside>
        <motion.div className="ep-keep-map" variants={rise}>
          <ConceptMap ep={MAP_EP} reader="new" states={states} grow compact />
        </motion.div>
        <motion.div className="ep-gain" variants={rise}>
          <div data-kind="new">
            <h2>
              {c.keep.gain_label} <b>{TOOLS.length}</b>
            </h2>
            <p>{TOOLS.map((id) => toolOf(PIPC, id).name).join(" · ")}</p>
          </div>
        </motion.div>
        <motion.p className="ep-p" variants={rise}>
          {c.keep.map_note}
        </motion.p>
        <motion.div variants={rise}>
          <button type="button" className="ep-map-button" onClick={() => setMapOpen(true)} data-testid="open-map">
            {C.mapButton}
            <Arrow />
          </button>
        </motion.div>
        <motion.a className="ep-other" href={PIPC.path} variants={rise} data-testid="sibling">
          <span>{S.sibling.label}</span>
          <strong>{PIPC.scenes.cover.title.replace(/\n/g, " ")}</strong>
          <em>{S.sibling.note}</em>
          <Arrow />
        </motion.a>
        <motion.div variants={rise}>
          <button type="button" className="ep-link ep-restart" onClick={() => (setStep(0), setAsked([]))}>
            {C.restart}
          </button>
          <a className="ep-link ep-home" href={C.backHref} data-testid="to-today">
            {C.toToday}
          </a>
        </motion.div>
      </>
    ),
  };

  return (
    <MotionConfig reducedMotion="user">
      <SrcCtx.Provider value={src}>
        <div className="ep-root st-root" data-episode={S.code} data-scene={scene} data-src={srcOn ? "" : undefined} data-real="" data-testid="short">
          <PaletteDock tag={C.draft} />
          <header className="ep-bar">
            {step === 0 ? (
              <a className="ep-back" href={C.backHref} aria-label={C.back} data-testid="bar-home">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <button type="button" className="ep-back" onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label={CHROME.chrome.back}>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <p className="ep-bar-title">
              <span>{C.barKind}</span>
              <span aria-hidden="true"> · </span>
              <span>{S.series.name}</span>
            </p>
            <button type="button" className="ep-bar-src" aria-pressed={srcOn} onClick={() => setSrcOn((v) => !v)} data-testid="src-toggle">
              {CHROME.chrome.src}
            </button>
            <span className="ep-count" aria-label={`${ORDER.length}장 가운데 ${step + 1}장`}>
              {step + 1}/{ORDER.length}
            </span>
            <button type="button" className="ep-mapbtn" onClick={() => setMapOpen(true)} aria-label={CHROME.chrome.mapAria} data-testid="map-button">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 6.5 10 14l5-7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="5" cy="6" r="2.2" fill="currentColor" />
                <circle cx="15" cy="6" r="2.2" fill="currentColor" />
                <circle cx="10" cy="14.5" r="2.2" fill="currentColor" />
              </svg>
              <b>{count}</b>
            </button>
          </header>

          <div className="ep-scroll" ref={scroller}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main key={scene} className="ep-scene" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
                {body[scene]()}
              </motion.main>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {mapOpen ? (
              <motion.div className="ep-mapview" role="dialog" aria-label={CHROME.map.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: EASE }} data-testid="map-view">
                <header>
                  <h1>{CHROME.map.title}</h1>
                  <button type="button" onClick={() => setMapOpen(false)}>
                    {CHROME.map.close}
                  </button>
                </header>
                <ConceptMap ep={MAP_EP} reader="new" states={states} />
              </motion.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>{srcItem ? <SourceSheet item={srcItem} onClose={() => setSrcItem(null)} /> : null}</AnimatePresence>
        </div>
      </SrcCtx.Provider>
    </MotionConfig>
  );
}
