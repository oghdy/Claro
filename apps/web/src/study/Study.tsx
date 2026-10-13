"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ArticlePackage, Position, ProbeExposure } from "@claro/contract";
import { loadReading, loadStudy, saveStudy, type ArticleKey, type StudyState } from "../reader/place";
import { Reader } from "../reader/Reader";
import { RecordedReader } from "../reader/RecordedReader";
import { NOTICE, NOTICE_VERSION, STUDY } from "./copy";
import { ASKS, OUTSIDE_ARTICLE } from "./flows";
import { outbox, readerFromLink, tabSession, uuid } from "./outbox";
import { PROBES, type ProbeLabel } from "./probes";

// F-3 첫 회의 흐름 셋 (D37). 주소가 무리를 가른다 — 데이터베이스에 무리를 적지 않는다.
//   ClaroStudy  `/?r=`      동의 → 읽기 전 물음 → 기사 (화면 그대로) → 마지막 장 아래에서 물음으로 → 직후 물음 셋 → 고맙다는 화면
//   NewsStudy   `/news?r=`  동의 → 읽기 전 물음 → 바깥 기사를 읽고 돌아온다 → 직후 물음 셋 → 고맙다는 화면
//   AgainStudy  `/again?r=` (동의) → 며칠 뒤의 같은 물음 셋 → 고맙다는 화면. 기사를 다시 보여주지 않는다
// 링크 없이 온 사람 · 대응표에 없는 번호: `/` 는 지금처럼 기사만 뜬다 (동의 · 물음 · 기록 없음). 나머지 둘은 "받으신 링크로 열어 주세요".
// **동의 전에는 아무것도 기록하지 않는다** — 기록기도 보낼 줄도 동의를 누른 뒤에 처음 생긴다 (서버도 동의 없는 독자의 줄을 받지 않는다).
// 맞았는지 틀렸는지를 보여주지 않는다. 한 번에 물음 하나. 건너뛸 수 있다 — 보여줬다는 것은 남고 답은 없다 (무응답은 증거가 아니다)

type Who =
  | { state: "none" } // 링크에 번호가 없다 (서버가 그린 첫 그림도 이것이다)
  | { state: "pending"; user_id: string }
  | { state: "offline"; user_id: string } // 서버에 물어보지 못했다
  | { state: "unknown" } // 대응표에 없는 번호
  | { state: "known"; user_id: string; consented: boolean; asked: string[] };

const key = (probe_id: string, position: Position) => `${probe_id}@${position}`;

/** 링크의 번호가 누구인지 서버에 묻는다 — 대응표에 있는가 · 동의했는가 · 이미 보여준 물음. 원장에 쓰는 요청이 아니다 */
function useReader(flow: string): [Who, () => void, () => void] {
  const [who, setWho] = useState<Who>({ state: "none" });
  const ask = useCallback(() => {
    const user_id = readerFromLink();
    if (!user_id) return setWho({ state: "none" });
    setWho({ state: "pending", user_id });
    const stop = new AbortController();
    const timeout = setTimeout(() => stop.abort(), 6000);
    fetch(`/api/readers/${user_id}`, { signal: stop.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s: { known: boolean; consented?: boolean; asked?: { probe_id: string; position: Position }[] }) =>
        setWho(s.known ? { state: "known", user_id, consented: !!s.consented, asked: (s.asked ?? []).map((a) => key(a.probe_id, a.position)) } : { state: "unknown" }),
      )
      .catch(() => {
        // 서버에 못 물었다. 이 탭에서 이미 동의하고 읽던 독자면 그대로 이어 간다 — 기록은 쥐고 있다가 서버가 돌아오면 보낸다 (D35)
        const had = loadStudy(flow, user_id);
        setWho(had && had.stage !== "consent" ? { state: "known", user_id, consented: true, asked: had.asked } : { state: "offline", user_id });
      })
      .finally(() => clearTimeout(timeout));
  }, [flow]);
  useEffect(ask, [ask]);
  return [who, ask, () => setWho({ state: "unknown" })];
}

/** 흐름의 자리 — 같은 탭에서는 새로고침을 넘어 이어진다 (place.ts). 다른 브라우저로 열면 서버가 아는 것(동의 · 이미 보여준 물음)에서 다시 정한다 */
function useStudy(flow: string, who: Who, first: (consented: boolean, asked: Set<string>) => string) {
  const [state, setState] = useState<StudyState | null>(null);
  const user_id = who.state === "known" ? who.user_id : null;
  useEffect(() => {
    if (who.state !== "known") return setState(null);
    setState(loadStudy(flow, who.user_id) ?? { stage: first(who.consented, new Set(who.asked)), showing: null, asked: who.asked });
    // eslint-disable-next-line react-hooks/exhaustive-deps — 누구인지가 정해질 때 한 번
  }, [who]);
  // 번호가 있는 링크면 첫 그림(기사)을 가려 둔다 (layout.tsx 의 짧은 스크립트). 무엇을 보여줄지 정해지면 — 그림을 그리기 전에 — 걷는다
  // (첫 그림의 who 는 언제나 "none" 이다 — 링크에 번호가 있으면 아직 묻기 전일 뿐이니 걷지 않는다)
  const ready = who.state !== "pending" && (who.state !== "known" || state !== null);
  useLayoutEffect(() => {
    if (ready && !(who.state === "none" && readerFromLink())) document.documentElement.removeAttribute("data-gate");
  }, [ready, who.state]);
  const update = useCallback(
    (change: (s: StudyState) => StudyState) =>
      setState((s) => {
        if (!s || !user_id) return s;
        const next = change(s);
        saveStudy(flow, user_id, next);
        return next;
      }),
    [flow, user_id],
  );
  return [state, update] as const;
}

const noChange = () => () => {};

const allAsked = (asked: Set<string> | string[], position: Position) => {
  const had = new Set(asked);
  return ASKS[position].ask.every((l) => had.has(key(PROBES[l].probe_id, position)));
};

function Page({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <main className="study">
      <div className="s-page">
        {kicker && <p className="s-kicker">{kicker}</p>}
        {children}
      </div>
    </main>
  );
}

function Message({ title, note, children }: { title: string; note: string; children?: ReactNode }) {
  return (
    <Page>
      <h1 className="s-title">{title}</h1>
      <p className="s-text">{note}</p>
      {children}
    </Page>
  );
}

/** 동의 안내 — 누르기 전에는 아무것도 기록하지 않는다. 누르면 그 사실과 때가 원장 밖에 남는다 (identity.consent) */
function Consent({ user_id, onAgree }: { user_id: string; onAgree: () => void }) {
  return (
    <Page>
      <h1 className="s-title">{NOTICE.title}</h1>
      {NOTICE.lines.map((line) => (
        <p key={line} className="s-text">
          {line}
        </p>
      ))}
      <button
        type="button"
        className="s-go"
        onClick={() => {
          const consent_id = uuid();
          outbox().push({ kind: "consent", id: consent_id, row: { consent_id, user_id, notice_version: NOTICE_VERSION, consented_at: new Date().toISOString() } });
          onAgree();
        }}
      >
        {NOTICE.agree}
      </button>
    </Page>
  );
}

/**
 * 물음을 하나씩 보여준다. 보여주는 순간 "보여줬다"를 적고, "다음"을 누르면 "답했다"를 적는다 — 노출 하나에 응답은 많아야 하나다.
 * 그래서 답은 "다음"을 누를 때 한 번 정해진다: 그 전에 바꾼 것은 적히지 않고, 누른 뒤에는 돌아가 고칠 수 없다. 쓰던 글은 새로고침에 남는다.
 */
function Questions({
  user_id, position, kicker, state, update, planId, onDone,
}: {
  user_id: string; position: Position; kicker: string; state: StudyState; update: (change: (s: StudyState) => StudyState) => void;
  planId: () => string | null; onDone: () => void;
}) {
  const { ask, probe_type } = ASKS[position];
  const showing = state.showing?.position === position ? state.showing : null;
  const next = ask.find((l) => !state.asked.includes(key(PROBES[l].probe_id, position)));
  const label: ProbeLabel | undefined = showing ? ask.find((l) => PROBES[l].probe_id === showing.probe_id) : next;
  const done = useRef(onDone);
  done.current = onDone;
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!label) return done.current(); // 물을 것이 없다 (다 물었다)
    if (showing) return;
    // 이 물음을 처음 보여준다 — "보여줬다" 한 줄. 자리는 적지 않는다: 기사의 앞 · 뒤에 따로 선 화면이다
    const p = PROBES[label];
    const exposure: ProbeExposure = {
      exposure_id: uuid(), user_id, session_id: tabSession(), probe_id: p.probe_id, probe_version: p.version, probe_type, position,
      plan_id: planId(), shown_at_loc: null, shown_at: new Date().toISOString(),
    };
    outbox().push({ kind: "exposure", id: exposure.exposure_id, row: { ...exposure } });
    update((s) => ({ ...s, showing: { probe_id: p.probe_id, position, exposure_id: exposure.exposure_id, draft: "" }, asked: [...s.asked, key(p.probe_id, position)] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps — 물음이 바뀔 때
  }, [label, showing?.exposure_id]);

  if (!label || !showing) return <Page kicker={kicker}>{null}</Page>;
  const p = PROBES[label];
  const draft = showing.draft;
  const write = (text: string) => update((s) => (s.showing ? { ...s, showing: { ...s.showing, draft: text } } : s));
  const leave = (answered: boolean) => {
    const interaction_id = uuid();
    if (answered)
      outbox().push({
        kind: "response", id: interaction_id,
        row: { interaction_id, exposure_id: showing.exposure_id, user_id, responded_at: new Date().toISOString(), response: draft },
      });
    update((s) => ({ ...s, showing: null }));
    top.current?.scrollIntoView();
  };

  return (
    <Page kicker={ask.length > 1 ? `${kicker} · ${ask.indexOf(label) + 1}/${ask.length}` : kicker}>
      <div ref={top} className="s-question" data-probe={label}>
        <h1 className="s-prompt" id="s-prompt">
          {p.prompt}
        </h1>
        {p.choices ? (
          <div className="s-choices" role="group" aria-labelledby="s-prompt">
            {p.choices.map((c) => (
              <button key={c} type="button" className="s-choice" aria-pressed={draft === c} onClick={() => write(c)}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            className="s-write"
            aria-labelledby="s-prompt"
            placeholder={STUDY.write}
            rows={5}
            maxLength={1000}
            value={draft}
            onChange={(e) => write(e.target.value)}
            // 폰의 키보드가 올라오면 물음과 쓰는 칸이 그 위에 보이게 — 물음을 화면 맨 위로 올린다
            onFocus={() => setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 250)}
          />
        )}
      </div>
      <div className="s-actions">
        <button type="button" className="s-go" disabled={draft.trim() === ""} onClick={() => leave(true)}>
          {STUDY.next}
        </button>
        <button type="button" className="s-skip" onClick={() => leave(false)}>
          {STUDY.skip}
        </button>
      </div>
    </Page>
  );
}

function Thanks({ note, children }: { note: string; children?: ReactNode }) {
  return (
    <Message title={STUDY.thanks} note={note}>
      {children}
    </Message>
  );
}

/** Claro 무리 — `/?r=`. 등록된 독자가 아니면 지금처럼 기사만 뜬다 */
export function ClaroStudy({ pkg, article }: { pkg: ArticlePackage; article: ArticleKey }) {
  /** 링크에 번호가 있는가 — 서버가 그린 첫 그림은 모른다 (없는 것으로 그린다). 브라우저에서 바로 맞춘다 */
  const linked = useSyncExternalStore(noChange, readerFromLink, () => null);
  const [who, retry, readOnly] = useReader("claro");
  const [state, update] = useStudy("claro", who, (consented, asked) =>
    !consented ? "consent" : !allAsked(asked, "PRE") ? "pre" : allAsked(asked, "POST") ? "done" : "read",
  );
  const go = (stage: string) => update((s) => ({ ...s, stage }));
  /** 직후 물음은 방금 읽던 레벨의 plan 을 가리킨다 — 무엇을 읽은 뒤의 답인지 (OBSERVATION §7.3) */
  const planId = () => {
    const r = loadReading(article);
    return (r && (r.at ? r.plans[r.at.level] : Object.values(r.plans).at(-1))) ?? null;
  };

  if (who.state === "offline")
    return (
      <Message title={STUDY.offline} note={STUDY.offlineNote}>
        <button type="button" className="s-go" onClick={retry}>
          {STUDY.retry}
        </button>
        <button type="button" className="s-skip" onClick={readOnly}>
          {STUDY.readOnly}
        </button>
      </Message>
    );
  // 링크 없이 온 사람 · 모르는 번호 — 지금처럼 기사만. 기록기가 없다
  if (!linked || who.state === "unknown") return <Reader pkg={pkg} />;
  // 번호가 있는 링크다 — 누구인지 알 때까지 기사를 그리지 않는다. 가려 둔 채 그려 두면 그 화면이 읽던 자리를 제멋대로 적는다 (끝이 나왔다고 — 아무도 안 봤는데)
  if (who.state !== "known" || !state) return null;
  const { user_id } = who;
  switch (state.stage) {
    case "consent":
      return <Consent user_id={user_id} onAgree={() => go(allAsked(state.asked, "PRE") ? "read" : "pre")} />;
    case "pre":
      return <Questions user_id={user_id} position="PRE" kicker={STUDY.before} state={state} update={update} planId={() => null} onDone={() => go("read")} />;
    case "post":
      return <Questions user_id={user_id} position="POST" kicker={STUDY.after} state={state} update={update} planId={planId} onDone={() => go("done")} />;
    case "done":
      return (
        <Thanks note={STUDY.thanksNow}>
          <button type="button" className="s-skip" onClick={() => go("reread")}>
            {STUDY.reread}
          </button>
        </Thanks>
      );
    case "reread":
      return <RecordedReader pkg={pkg} article={article} user_id={user_id} />;
    default:
      return (
        <RecordedReader
          pkg={pkg}
          article={article}
          user_id={user_id}
          after={
            <button type="button" className="r-ask r-to-questions" onClick={() => go("post")}>
              <span className="r-ask-q">{STUDY.toQuestions}</span>
            </button>
          }
        />
      );
  }
}

/** 받은 링크가 아니면 — 물음만 있는 화면에는 보여줄 기사가 없다 */
function Gate({ who, retry, children }: { who: Who; retry: () => void; children: (user_id: string) => ReactNode }) {
  if (who.state === "none" || who.state === "unknown") return <Message title={STUDY.invite} note={STUDY.inviteNote} />;
  if (who.state === "offline")
    return (
      <Message title={STUDY.offline} note={STUDY.offlineNote}>
        <button type="button" className="s-go" onClick={retry}>
          {STUDY.retry}
        </button>
      </Message>
    );
  if (who.state === "pending") return <Page>{null}</Page>;
  return <>{children(who.user_id)}</>;
}

/** 일반 기사 무리 — `/news?r=`. plan 이 없다 (Claro 를 읽지 않았다). 노출 · 응답만 남는다 */
export function NewsStudy() {
  const [who, retry] = useReader("news");
  const [state, update] = useStudy("news", who, (consented, asked) =>
    !consented ? "consent" : !allAsked(asked, "PRE") ? "pre" : allAsked(asked, "POST") ? "done" : "go",
  );
  const go = (stage: string) => update((s) => ({ ...s, stage }));
  // 바깥 기사가 아직 안 정해졌다 — 동의도 받지 않는다
  if (!OUTSIDE_ARTICLE.url) return <Message title={STUDY.preparing} note={STUDY.preparingNote} />;
  return (
    <Gate who={who} retry={retry}>
      {(user_id) => {
        if (!state) return <Page>{null}</Page>;
        switch (state.stage) {
          case "consent":
            return <Consent user_id={user_id} onAgree={() => go(allAsked(state.asked, "PRE") ? "go" : "pre")} />;
          case "pre":
            return <Questions user_id={user_id} position="PRE" kicker={STUDY.before} state={state} update={update} planId={() => null} onDone={() => go("go")} />;
          case "post":
            return <Questions user_id={user_id} position="POST" kicker={STUDY.after} state={state} update={update} planId={() => null} onDone={() => go("done")} />;
          case "done":
            return <Thanks note={STUDY.thanksNow} />;
          default:
            return (
              <Message title={STUDY.goRead} note={STUDY.goReadNote}>
                <a className="s-out" href={OUTSIDE_ARTICLE.url} target="_blank" rel="noopener noreferrer">
                  {OUTSIDE_ARTICLE.title || STUDY.outsideLink}
                </a>
                <button type="button" className="s-go" onClick={() => go("post")}>
                  {STUDY.didRead}
                </button>
              </Message>
            );
        }
      }}
    </Gate>
  );
}

/** 며칠 뒤 — `/again?r=`. 두 무리 공통. 직후 물음에 답한 적 없는 독자가 와도 받는다. 기사를 다시 보여주지 않는다 */
export function AgainStudy() {
  const [who, retry] = useReader("again");
  const [state, update] = useStudy("again", who, (consented, asked) => (!consented ? "consent" : allAsked(asked, "DELAYED") ? "done" : "ask"));
  const go = (stage: string) => update((s) => ({ ...s, stage }));
  return (
    <Gate who={who} retry={retry}>
      {(user_id) => {
        if (!state) return <Page>{null}</Page>;
        if (state.stage === "consent") return <Consent user_id={user_id} onAgree={() => go("ask")} />;
        if (state.stage === "done") return <Thanks note={STUDY.thanksLater} />;
        return <Questions user_id={user_id} position="DELAYED" kicker={STUDY.again} state={state} update={update} planId={() => null} onDone={() => go("done")} />;
      }}
    </Gate>
  );
}
