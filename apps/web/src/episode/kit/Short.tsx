"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { SHORT_SCENE_IDS, type ShortSceneId } from "@claro/contract";
import type { ShortData } from "../catalog";
import { CHROME, SHORT_CHROME as C } from "./chrome";
import { ConceptMap, type NodeState } from "./ConceptMap";
import { PlainFlipLead } from "./frames/Plain";
import { Ask, EASE, Head, P, Rich, SrcCtx, Txt, rise, stagger } from "./parts";
import { toolOf, type EpisodeData, type T } from "./types";

// 짧은 이야기 한 편 (UX-7 시안 → F-E2 에서 kit 로 · 실제 주소 /short/<code> 와 시안 /lab/today/short 가 **같은 부품 한 벌**이다 — real 하나로 가른다).
// 장면 넷: 표지 → 어디가 (뒤집기) → 문서가 말한 것 → 남음. 체험이 없다 — 기본 풀이 "뒤집기만"의 부품을 쓴다.
// 넘어가는 방법 · 글 부품 · 근거 시트 · 지도는 긴 이야기와 같은 것이다 (겉모습도 같은 CSS). 다른 것은 장면의 수와 무게뿐이다.
// 번호가 없다 ("N화" · 시리즈 줄 · 다음 화 예고 없음) — 주제 이름만. 도구는 긴 이야기의 카드를 글자 그대로 가리킨다. 아무것도 저장하지 않는다.
// 이야기의 모양은 계약 (ShortStory — docs/contract/EPISODE.md §13 · B-E3)이다. **곁 이야기 · 가리킨 도구는 없을 수 있다** (홀로 선 짧은 이야기 — D88 E-21):
// 그러면 곁 이야기로 가는 길 · 접힌 도구 · 지도 · "만난 개념"이 없다 (그 칸의 글 hint · tool_lead · map_note · gain_label 도 없을 수 있다).

export interface ShortParts {
  story: ShortData;
  /** 표지 그림 */
  Art: ComponentType;
  /** 도구를 가리킨 긴 이야기 (tools_from.episode) — 도구 카드 · 그 구절 · 지도가 거기 있다. 없으면 도구 · 지도 없음 */
  from: EpisodeData | null;
  /** 곁 이야기 (sibling.episode)로 가는 길 — 주소와 그 이야기의 표지 제목. 없으면 길 없음 */
  sibling: { href: string; title: string } | null;
  /** 실제 화면 (/short/<code>). 없으면 시안 (/lab/today/short) — 돌아갈 곳이 시안의 "오늘"이다 */
  real?: boolean;
  /** 시안 전용 — 맨 위에 얹는 것 (색 스위치) */
  top?: ReactNode;
}

const ORDER: readonly ShortSceneId[] = SHORT_SCENE_IDS;

const Ctx = createContext<ShortParts | null>(null);
const useShort = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("짧은 이야기 밖");
  return v;
};

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 긴 이야기와 같은 도구 — 접어서. 펼치면 긴 이야기의 카드 글이 그대로 나온다 */
function FoldedTool({ id, from }: { id: string; from: EpisodeData }) {
  const tool = toolOf(from, id);
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
  const { story: S, from } = useShort();
  const c = CHROME.chrome;
  // 도구 카드의 글은 긴 이야기의 것 — 구절도 거기서 찾는다
  const quote = (k: string) => S.quotes[k] ?? from?.quotes[k];
  const doc = (label: string) => S.docs[label] ?? from?.docs[label];
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

export function Short(parts: ShortParts) {
  const { story: S, Art, from, sibling, real = false, top } = parts;
  // 가리킨 도구 — 가리킨 긴 이야기가 목록에 있을 때만 (없으면 도구 · 지도 없이 선다)
  const TOOLS = useMemo(() => (from ? (S.tools_from?.keys ?? []) : []), [S, from]);
  /** 이 이야기의 지도 = 같은 주제 (긴 이야기)의 지도. "어디서 주웠나"의 말만 이 이야기의 것으로 */
  const mapEp = useMemo<EpisodeData | null>(() => (from && TOOLS.length ? { ...from, map: { ...from.map, where_today: { t: C.where } } } : null), [from, TOOLS]);
  const home = real ? { href: "/", bar: CHROME.chrome.home, link: CHROME.keep.home } : { href: C.backHref, bar: C.back, link: C.toToday };
  const [step, setStep] = useState(0);
  const [asked, setAsked] = useState<readonly string[]>([]);
  const [srcOn, setSrcOn] = useState(false);
  const [srcItem, setSrcItem] = useState<T | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const scene = ORDER[step]!;
  // 도구는 "문서가 말한 것" 장면을 지나면 만난 것이다 (고정 — 추정하지 않는다)
  const met = step > ORDER.indexOf("why");
  const states = useMemo(() => Object.fromEntries((from?.tools ?? []).map((x) => [x.key, met && TOOLS.includes(x.key) ? "new" : "none"])) as Record<string, NodeState>, [met, from, TOOLS]);
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
          <span>{CHROME.chrome.topicTag}</span>
          <strong>{S.series.name}</strong>
        </motion.div>
        <motion.div className="ep-cover-art st-art" variants={rise}>
          <Art />
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
        {c.cover.hint ? (
          <motion.p className="ep-hint" variants={rise}>
            <Txt item={c.cover.hint} />
          </motion.p>
        ) : null}
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
        {from && TOOLS.length ? (
          <>
            {c.why.tool_lead ? (
              <motion.p className="ep-tool-lead" variants={rise}>
                {c.why.tool_lead}
              </motion.p>
            ) : null}
            <div className="ep-tools">
              {TOOLS.map((id) => (
                <FoldedTool key={id} id={id} from={from} />
              ))}
            </div>
          </>
        ) : null}
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
        {mapEp && from ? (
          <>
            <motion.div className="ep-keep-map" variants={rise}>
              <ConceptMap ep={mapEp} reader="new" states={states} real={real} numbered={false} grow compact />
            </motion.div>
            <motion.div className="ep-gain" variants={rise}>
              <div data-kind="new">
                <h2>
                  {c.keep.gain_label} <b>{TOOLS.length}</b>
                </h2>
                <p>{TOOLS.map((id) => toolOf(from, id).name).join(" · ")}</p>
              </div>
            </motion.div>
            {c.keep.map_note ? (
              <motion.p className="ep-p" variants={rise}>
                {c.keep.map_note}
              </motion.p>
            ) : null}
            {/* 실제 화면은 아직 읽은 기록을 남기지 않는다 — 긴 이야기의 남음 장면과 같은 한 줄 (F-E1) */}
            {real ? (
              <motion.p className="ep-p st-notsaved" variants={rise}>
                {CHROME.keep.notSaved}
              </motion.p>
            ) : null}
            <motion.div variants={rise}>
              <button type="button" className="ep-map-button" onClick={() => setMapOpen(true)} data-testid="open-map">
                {C.mapButton}
                <Arrow />
              </button>
            </motion.div>
          </>
        ) : null}
        {sibling && S.sibling ? (
          <motion.a className="ep-other" href={sibling.href} variants={rise} data-testid="sibling">
            <span>{S.sibling.label}</span>
            <strong>{sibling.title}</strong>
            <em>{S.sibling.note}</em>
            <Arrow />
          </motion.a>
        ) : null}
        <motion.div variants={rise}>
          <button type="button" className="ep-link ep-restart" onClick={() => (setStep(0), setAsked([]))}>
            {C.restart}
          </button>
          <a className="ep-link ep-home" href={home.href} data-testid="to-today">
            {home.link}
          </a>
        </motion.div>
      </>
    ),
  };

  return (
    <MotionConfig reducedMotion="user">
      <Ctx.Provider value={parts}>
      <SrcCtx.Provider value={src}>
        <div className="ep-root st-root" data-episode={S.code} data-scene={scene} data-src={srcOn ? "" : undefined} data-real="" data-testid="short">
          {top}
          <header className="ep-bar">
            {step === 0 ? (
              <a className="ep-back" href={home.href} aria-label={home.bar} data-testid="bar-home">
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
            {mapEp ? (
              <button type="button" className="ep-mapbtn" onClick={() => setMapOpen(true)} aria-label={CHROME.chrome.mapAria} data-testid="map-button">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 6.5 10 14l5-7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="5" cy="6" r="2.2" fill="currentColor" />
                  <circle cx="15" cy="6" r="2.2" fill="currentColor" />
                  <circle cx="10" cy="14.5" r="2.2" fill="currentColor" />
                </svg>
                <b>{count}</b>
              </button>
            ) : null}
          </header>

          <div className="ep-scroll" ref={scroller}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main key={scene} className="ep-scene" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -14, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
                {body[scene]()}
              </motion.main>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {mapOpen && mapEp ? (
              <motion.div className="ep-mapview" role="dialog" aria-label={CHROME.map.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: EASE }} data-testid="map-view">
                <header>
                  <h1>{CHROME.map.title}</h1>
                  <button type="button" onClick={() => setMapOpen(false)}>
                    {CHROME.map.close}
                  </button>
                </header>
                <ConceptMap ep={mapEp} reader="new" states={states} real={real} numbered={false} />
              </motion.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>{srcItem ? <SourceSheet item={srcItem} onClose={() => setSrcItem(null)} /> : null}</AnimatePresence>
        </div>
      </SrcCtx.Provider>
      </Ctx.Provider>
    </MotionConfig>
  );
}
