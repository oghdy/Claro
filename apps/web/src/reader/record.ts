import type { ArticlePackage, LevelId, ReadingEvent } from "@claro/contract";
import { outbox, tabSession, uuid } from "../study/outbox";
import { loadReading, saveReading, type ArticleKey, type ReadingState } from "./place";
import type { ReaderMoment } from "./Reader";

// 읽기 기록 — 화면이 아는 순간 셋(Reader 의 notice)을 원장의 줄로 옮긴다 (OBSERVATION §4 · §5 · B-0.4b).
//   slide → SLIDE_ENTERED     level → LEVEL_SWITCHED     end → SLIDE_END_SHOWN
// 줄을 만들어 "보낼 줄"(study/outbox.ts)에 넘기고 바로 돌아간다 — 보내는 것 · 다시 보내는 것 · 사람이 손을 댄 뒤부터 보내는 것은 거기서 한다.
// seq · occurred_at · event_id · plan_id · reading_id · session_id 는 여기서 만든다. 일어난 순서를 아는 것은 기기다 (D34).
// 기록기는 **동의한 독자의 화면에서만** 만들어진다 (study/Study.tsx — D37). 링크 없이 온 사람 · 모르는 번호 · 시험 경로(/test)에는 없다.
// 계약에 없는 것은 적지 않는다: 방향 · 손짓 · 머문 시간 · 어떻게 왔는지.

export interface Recorder {
  note(m: ReaderMoment): void;
}

/** 이 독자의 이 판에 대한 기록기 */
export function createRecorder(pkg: ArticlePackage, article: ArticleKey, user_id: string): Recorder {
  const out = outbox();
  const session_id = tabSession();
  // 같은 탭에서 되살린 열람이면 이어 간다. 아니면 새 열람이다
  const state: ReadingState = loadReading(article) ?? { reading_id: uuid(), seq: 0, plans: {}, at: null, ended: {} };
  /** 이 화면을 그리기 전에 이미 적은 "끝" — 되살린 뒤 같은 장의 끝을 다시 적지 않는다 */
  const endedBefore = new Set(Object.entries(state.ended).flatMap(([lv, is]) => is!.map((i) => `${lv}/${i}`)));

  /** 그 레벨의 plan — 없으면 지금 만든다. 그냥 놓인 첫 레벨만 DEFAULT 다 (불변식 7) */
  function plan(level: LevelId): string {
    const had = state.plans[level];
    if (had) return had;
    const plan_id = uuid();
    const first = Object.keys(state.plans).length === 0 && level === pkg.levels[0]!.id;
    state.plans[level] = plan_id;
    out.push({
      kind: "plan", id: plan_id,
      row: {
        plan_id, user_id, session_id, reading_id: state.reading_id, article_id: article.article_id, article_version: article.article_version,
        created_at: new Date().toISOString(), level, level_chosen_by: first ? "DEFAULT" : "READER",
      },
    });
    return plan_id;
  }

  function event(type: ReadingEvent["type"], plan_id: string, slide_index: number | null, from_plan_id: string | null) {
    const row: ReadingEvent = {
      event_id: uuid(), user_id, session_id, reading_id: state.reading_id, plan_id, seq: state.seq++,
      occurred_at: new Date().toISOString(), type, slide_index, from_plan_id,
    };
    out.push({ kind: "event", id: row.event_id, row: { ...row } });
  }

  function note(m: ReaderMoment) {
    if (out.off) return;
    if (m.kind === "slide") {
      // 지금 장이 **바뀔 때** 적는다 (§5.1). 되살린 자리 · 다시 그려진 같은 장은 바뀐 것이 아니다
      if (state.at && state.at.level === m.level && state.at.index === m.index) return;
      event("SLIDE_ENTERED", plan(m.level), m.index, null);
      state.at = { level: m.level, index: m.index };
    } else if (m.kind === "level") {
      const from = plan(m.from);
      event("LEVEL_SWITCHED", plan(m.to), null, from);
      state.at = null; // 전환 바로 다음은 새 plan 의 SLIDE_ENTERED 다 — 돌아온 자리가 떠날 때와 같아도 적는다 (불변식 10)
    } else {
      if (endedBefore.has(`${m.level}/${m.index}`)) return;
      event("SLIDE_END_SHOWN", plan(m.level), m.index, null);
      (state.ended[m.level] ??= []).push(m.index);
    }
    saveReading(article, state);
  }

  return { note };
}
