import type { ArticlePackage, LevelId, ReadingEvent } from "@claro/contract";
import { loadReading, saveReading, sessionId, type ArticleKey, type ReadingState } from "./place";
import type { ReaderMoment } from "./Reader";

// 읽기 기록 — 화면이 아는 순간 셋(Reader 의 notice)을 원장의 줄로 옮겨 서버에 보낸다 (OBSERVATION §4 · §5 · B-0.4b).
//   slide → SLIDE_ENTERED     level → LEVEL_SWITCHED     end → SLIDE_END_SHOWN
// **읽는 것이 먼저다.** 여기서 일어나는 일은 화면을 한 순간도 기다리게 하지 않고, 실패해도 화면은 모른다:
//   - 순간이 오면 줄을 만들어 쥐고(저장소에도) 바로 돌아간다. 보내는 것은 그 뒤에, 따로 한다
//   - 서버가 느리거나 죽었으면 쥐고 있다가 다시 보낸다. 같은 줄을 두 번 보내도 된다 — 서버는 같은 event_id 를 성공으로 받는다
//   - seq · occurred_at · event_id · plan_id · reading_id · session_id 는 여기서 만든다. 일어난 순서를 아는 것은 기기다 (D34)
// 링크에 독자 번호가 없으면 기록기가 없다 — 서버를 부르지 않는다. 시험 경로(/test)는 이 파일을 쓰지 않는다.
// 계약에 없는 것은 적지 않는다: 방향 · 손짓 · 머문 시간 · 어떻게 왔는지.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 뜻 없는 UUID (v4). crypto.randomUUID 는 https · localhost 에서만 있다 — 같은 공유기의 폰(http)에서도 되게 getRandomValues 로 만든다 */
function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** 링크의 독자 번호 — `/?r=<user_id>`. 뜻 없는 UUID 다. 없거나 모양이 다르면 기록하지 않는다 */
function readerFromLink(): string | null {
  const r = new URLSearchParams(window.location.search).get("r");
  return r && UUID.test(r) ? r.toLowerCase() : null;
}

const BATCH = 50; // 한 번에 보내는 사건 수
const WAIT = 10_000; // 이만큼 답이 없으면 못 보낸 것으로 친다 (다시 보낸다)
const RETRY = [1_000, 2_000, 5_000, 15_000, 30_000]; // 못 보냈을 때 다시 해 보기까지

export interface Recorder {
  note(m: ReaderMoment): void;
}

/** 이 화면의 기록기. 링크에 독자 번호가 없으면 null — 아무것도 하지 않는다 */
export function createRecorder(pkg: ArticlePackage, article: ArticleKey): Recorder | null {
  const user_id = readerFromLink();
  if (!user_id) return null;
  const session_id = sessionId(uuid);
  // 같은 탭에서 되살린 열람이면 이어 간다. 아니면 새 열람이다
  const state: ReadingState = loadReading(article) ?? { reading_id: uuid(), seq: 0, plans: {}, at: null, ended: {}, unsent: [], off: false };
  /** 이 화면을 그리기 전에 이미 적은 "끝" — 되살린 뒤 같은 장의 끝을 다시 적지 않는다 */
  const endedBefore = new Set(Object.entries(state.ended).flatMap(([lv, is]) => is!.map((i) => `${lv}/${i}`)));
  const keep = () => saveReading(article, state);

  /** 그 레벨의 plan — 없으면 지금 만든다. 그냥 놓인 첫 레벨만 DEFAULT 다 (불변식 7) */
  function plan(level: LevelId): string {
    const had = state.plans[level];
    if (had) return had;
    const plan_id = uuid();
    const first = Object.keys(state.plans).length === 0 && level === pkg.levels[0]!.id;
    state.plans[level] = plan_id;
    state.unsent.push({
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
      event_id: uuid(), user_id: user_id!, session_id, reading_id: state.reading_id, plan_id, seq: state.seq++,
      occurred_at: new Date().toISOString(), type, slide_index, from_plan_id,
    };
    state.unsent.push({ kind: "event", id: row.event_id, row: { ...row } });
  }

  function note(m: ReaderMoment) {
    if (state.off) return;
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
    keep();
    setTimeout(flush, 0); // 보내는 것은 이 순간(넘어가는 움직임)이 지나간 뒤에
  }

  let sending = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function post(path: string, body: unknown): Promise<unknown> {
    // 답이 없으면 끊는다 (AbortSignal.timeout 은 오래된 Safari 에 없다 — 직접 센다)
    const stop = new AbortController();
    const timeout = setTimeout(() => stop.abort(), WAIT);
    try {
      const res = await fetch(path, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true, signal: stop.signal,
      });
      if (res.status >= 500) throw new Error(String(res.status)); // 못 넣었다 — 다시 보낸다
      return res.ok ? await res.json() : null; // 4xx — 다시 보내도 같다. 버린다 (서버 로그에 남는다)
    } finally {
      clearTimeout(timeout);
    }
  }

  /** 쥐고 있는 줄을 앞에서부터 보낸다. plan 이 그것을 가리키는 사건보다 먼저 간다 */
  async function flush() {
    if (sending || state.off || !state.unsent.length) return;
    sending = true;
    clearTimeout(timer);
    try {
      while (state.unsent.length && !state.off) {
        const head = state.unsent[0]!;
        let n = 1;
        if (head.kind === "event") while (n < BATCH && state.unsent[n]?.kind === "event") n++;
        const batch = state.unsent.slice(0, n);
        const answer = (head.kind === "plan" ? await post("/api/plans", head.row) : await post("/api/events", { events: batch.map((u) => u.row) })) as
          | { status?: string; results?: { status?: string }[] }
          | null;
        if (answer?.status === "not_recorded" || answer?.results?.some((r) => r.status === "not_recorded")) {
          // 대응표에 없는 독자다 — 기록하지 않는다. 읽는 것은 그대로다
          state.off = true;
          state.unsent = [];
        } else {
          // 넣었다 · 이미 있다 · 원장이 거부했다(다시 보내도 같다 — 서버 로그에 남는다). 어느 쪽이든 더 쥐고 있지 않는다
          const sent = new Set(batch.map((u) => u.id));
          state.unsent = state.unsent.filter((u) => !sent.has(u.id));
        }
        keep();
        failures = 0;
      }
    } catch {
      timer = setTimeout(flush, RETRY[Math.min(failures++, RETRY.length - 1)]);
    } finally {
      sending = false;
    }
  }

  // 다시 보낼 때 — 연결이 돌아왔다 · 화면으로 돌아왔다 · 화면을 떠난다(떠나면서 한 번 더. keepalive 라 떠난 뒤에도 간다)
  window.addEventListener("online", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", flush);
  if (state.unsent.length) setTimeout(flush, 0); // 되살린 열람이 쥐고 있던 줄

  return { note };
}
