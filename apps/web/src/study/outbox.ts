import { loadOutbox, saveOutbox, sessionId, type OutboxState, type Unsent } from "../reader/place";

// 보낼 줄 — 화면이 만든 기록(동의 · plan · 읽기 사건 · 물음을 보여줬다 · 답했다)을 쥐고 있다가 서버에 보낸다. 탭 하나에 하나다.
// **읽는 것 · 답하는 것이 먼저다.** 여기서 일어나는 일은 화면을 한 순간도 기다리게 하지 않고, 실패해도 화면은 모른다:
//   - 줄을 받으면 쥐고(저장소에도) 바로 돌아간다. 보내는 것은 그 뒤에, 따로 한다
//   - 서버가 느리거나 죽었으면 쥐고 있다가 다시 보낸다. 같은 줄을 두 번 보내도 된다 — 서버는 같은 키를 성공으로 받는다
//   - **일어난 순서대로, 하나가 끝나야 다음을 보낸다** — 동의가 먼저 가야 나머지를 받고, plan 이 그것을 가리키는 줄보다 먼저 가야 한다
// **사람이 처음 손을 댄 뒤부터 보낸다 (D35).** 터치 · 휠 · 키 · 누르기 — 그 전의 줄은 쥐고 있다가 그때 같이 보낸다. 손을 대지 않고 떠나면 0줄이다.
//   메신저의 미리보기 로봇이 링크를 열어도 그 독자의 줄이 원장에 가지 않게 한다. 스크립트가 흉내 낸 입력(isTrusted 아님)은 손이 아니다.
//   scroll 은 듣지 않는다: 화면이 스스로 올려놓는 것도 scroll 이다. 사람이 글을 내리는 길은 아래 넷에 다 걸린다

const WHERE: Record<Unsent["kind"], string> = {
  consent: "/api/consents", plan: "/api/plans", event: "/api/events", exposure: "/api/exposures", response: "/api/responses",
};
const BATCH = 50; // 한 번에 보내는 읽기 사건 수
const WAIT = 10_000; // 이만큼 답이 없으면 못 보낸 것으로 친다 (다시 보낸다)
const RETRY = [1_000, 2_000, 5_000, 15_000, 30_000]; // 못 보냈을 때 다시 해 보기까지
const HANDS = ["pointerdown", "touchstart", "wheel", "keydown"] as const;

/** 뜻 없는 UUID (v4). crypto.randomUUID 는 https · localhost 에서만 있다 — 같은 공유기의 폰(http)에서도 되게 getRandomValues 로 만든다 */
export function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 링크의 독자 번호 — `?r=<user_id>`. 뜻 없는 UUID 다. 없거나 모양이 다르면 null */
export function readerFromLink(): string | null {
  const r = new URLSearchParams(window.location.search).get("r");
  return r && UUID.test(r) ? r.toLowerCase() : null;
}

/** 세션 = 탭 하나 (F-3 동안의 운영 규칙 · D34) */
export const tabSession = () => sessionId(uuid);

export interface Outbox {
  /** 줄을 쥔다. 손을 댄 뒤라면 곧 보낸다 */
  push(...items: Unsent[]): void;
  /** 서버가 "기록하지 않는 독자"라고 답했다 — 더 쥐지도 보내지도 않는다 */
  readonly off: boolean;
}

let one: Outbox | undefined;

/** 이 탭의 보낼 줄. 브라우저에서만 부른다 */
export function outbox(): Outbox {
  return (one ??= open());
}

function open(): Outbox {
  const state: OutboxState = loadOutbox();
  const keep = () => saveOutbox(state);
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

  /** 쥐고 있는 줄을 앞에서부터 보낸다 */
  async function flush() {
    if (sending || state.off || !state.touched || !state.unsent.length) return;
    sending = true;
    clearTimeout(timer);
    try {
      while (state.unsent.length && !state.off) {
        const head = state.unsent[0]!;
        let n = 1;
        if (head.kind === "event") while (n < BATCH && state.unsent[n]?.kind === "event") n++;
        const batch = state.unsent.slice(0, n);
        const answer = (await post(WHERE[head.kind], head.kind === "event" ? { events: batch.map((u) => u.row) } : head.row)) as
          | { status?: string; results?: { status?: string }[] }
          | null;
        if (answer?.status === "not_recorded" || answer?.results?.some((r) => r.status === "not_recorded")) {
          // 대응표에 없는 독자 · 동의하지 않은 독자다 — 기록하지 않는다. 화면은 그대로다
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

  function hand(e: Event) {
    if (!e.isTrusted) return;
    for (const type of HANDS) window.removeEventListener(type, hand, true);
    if (state.touched) return;
    state.touched = true;
    keep();
    setTimeout(flush, 0);
  }
  if (!state.touched) for (const type of HANDS) window.addEventListener(type, hand, { capture: true, passive: true });

  // 다시 보낼 때 — 연결이 돌아왔다 · 화면으로 돌아왔다 · 화면을 떠난다(떠나면서 한 번 더. keepalive 라 떠난 뒤에도 간다)
  window.addEventListener("online", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", flush);
  if (state.unsent.length) setTimeout(flush, 0); // 되살린 화면이 쥐고 있던 줄

  return {
    push(...items) {
      if (state.off) return;
      state.unsent.push(...items);
      keep();
      setTimeout(flush, 0); // 보내는 것은 이 순간(넘어가는 움직임 · 누름)이 지나간 뒤에
    },
    get off() {
      return state.off;
    },
  };
}
