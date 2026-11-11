// 회차 시안의 공통 모양 (UX-2). **시안 코드다 — 계약(ARTICLE_PACKAGE)이 아니다.** 두 회차(배달앱 · FOMC)가 같은 화면 부품 위에
// 데이터만 다르게 올라가게 하려고 뽑았다. 회차 · 시리즈 · 0화를 계약에 넣는 것은 이 Step 의 일이 아니다 (UX1-b — PM → 백엔드).
//
// 글의 규칙 (check.ts 가 두 회차 모두 본다)
//   1. 독자가 읽는 글은 전부 { t, src?, calc?, ui? } 꼴이다
//   2. t 에 숫자가 있으면 src 가 가리키는 구절 안에 그 숫자가 있어야 한다
//   3. 구절(quote)은 저장된 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시하고 대조)
//   4. calc — 구절의 수로 계산한 수 (어떻게 계산했는지 적는다) · ui — 화면 번호(0화 · 1화)처럼 사실이 아닌 수

/** 근거 구절 하나 — 저장된 1차 문서의 글 그대로 */
export interface Source {
  doc: string;
  quote: string;
}

/** 문서 — 어느 저장소(store)의 어느 source_id 인가 */
export interface DocRef {
  store: string;
  source_id: string;
  name: string;
}

/** 독자가 읽는 글 한 덩이 */
export interface T {
  t: string;
  /** 이 글의 근거 구절들 */
  src?: readonly string[];
  /** 구절의 수로 계산한 수 — { 수: 어떻게 } */
  calc?: Record<string, string>;
  /** 사실이 아닌 화면 번호 (0화 · 1화 …) */
  ui?: true;
  /**
   * 이 글이 무엇인가 — 근거를 열었을 때 독자에게 보이는 꼬리표.
   *   fact     문서에 적힌 사실
   *   official 기관 · 당사자의 판단 · 말 (D46: 누가 말했는지와 함께)
   *   explain  Claro 가 풀어 쓴 설명 (문서의 논리를 쉬운 말로)
   */
  layer?: "fact" | "official" | "explain";
}

export const t = (text: string, src?: readonly string[], more?: Partial<T>): T => ({ t: text, ...(src ? { src } : {}), ...more });

/** 개념 (도구) */
export interface Concept {
  id: string;
  name: string;
  /** 접혔을 때의 한 줄 */
  short: T;
  /** 펼쳤을 때 */
  body: readonly T[];
  /** 이 회차에서 어디에 쓰이나 — 지도에서 보인다 */
  use: T;
  /** 설명의 바탕 — 개념 라이브러리의 canonical_name 들, 없으면 "hand" (손으로 썼다 · UX1-f). 화면에는 안 보인다 */
  from: readonly string[] | "hand";
}

// 두 독자 — **손으로 적은 고정값이다.** 지식 상태를 추정하지 않는다 (CLAUDE.md "절대 하지 말 것").
export type ReaderId = "new" | "follower";

export interface ReaderFixture {
  id: ReaderId;
  label: string;
  /** 시안 조종 칸에 보이는 설명 */
  note: string;
  /** 이미 아는 개념 (고정값) → 접힌다 */
  known: readonly string[];
  /** 지난 이야기를 읽었나 (고정값) */
  readZero: boolean;
  /** 다른 시리즈에서 주운 개념 (고정값) — 지도에만 보인다. 이름은 그 시리즈의 회차 데이터에서 읽는다 (shelf.ts) */
  elsewhere: readonly { series: string; concepts: readonly string[] }[];
}

export type SceneId = "cover" | "zero" | "event" | "tools" | "aha" | "compare" | "next" | "keep";
export type TrackState = "past" | "now" | "next";

export interface SeriesInfo {
  id: string;
  name: string;
  sub: string;
  episodes: readonly { no: T; title: T; state: TrackState }[];
}

/** 장면의 글 — 두 회차가 같은 칸에 다른 글을 넣는다 */
export interface EpisodeCopy {
  cover: {
    episode: T;
    title: string;
    dek: T;
    meta: T;
    newHint: T;
    recapLabel: string;
    recap: readonly T[];
    askNew: string;
    askFollower: string;
  };
  /** 지금까지의 이야기 — 처음 온 독자에게만 */
  zero: { kicker: T; title: T; beats: readonly { when: T; head: string; body: T }[]; ask: string };
  event: {
    kicker: T;
    title: string;
    lead: T;
    /** 큰 글자 둘 */
    figures: readonly { who: string; amount: T; tag: string }[];
    figureNote: T;
    /** 수수께끼가 걸리는 한 문장 */
    quoteLabel: string;
    quote: T;
    quoteNote: string;
    riddle: readonly T[];
    ask: string;
  };
  tools: { kicker: string; titleNew: string; titleFollower: string; subNew: T; subFollower: T; ask: string };
  aha: {
    kicker: string;
    title: string;
    setup: readonly T[];
    /** 풀이에서 생기는 도구 — 풀이 장면 바로 뒤에 펼쳐서 보인다 (없는 회차도 있다) */
    born?: { lead: string; concept: string };
    flipLabel: string;
    flipA: string;
    /** 두 말 사이의 기호 ("=" · "≠") */
    flipOp: string;
    flipB: string;
    flipNote: T;
    realLabel: string;
    real: readonly { head: T; body: T }[];
    verdict: T;
    caveat: T;
    askNew: string;
    askFollower: string;
  };
  /** 견주기 — 따라온 독자에게만 */
  compare: { kicker: string; title: string; lead: T; cols: readonly [T, T]; rows: readonly { label: string; a: T; b: T }[]; body: readonly T[]; ask: string };
  next: {
    kicker: string;
    title: string;
    lead: T;
    line: readonly { when: T; what: string; state: TrackState }[];
    hereLabel: string;
    toolLead: string;
    comingLabel: string;
    coming: readonly { head: string; body: T }[];
    unknownLabel: string;
    unknown: readonly T[];
    unknownNote: T;
    ask: string;
  };
  keep: { kicker: string; title: string; line: string; nextBody: T };
  map: { whereToday: T };
}

/** 한 회차의 데이터 — 화면 부품(React)은 여기 없다. check.ts 가 이것만 읽는다 */
export interface EpisodeData {
  id: string;
  /** 이 회차의 주소 */
  path: string;
  /** 시안 조종 칸의 짧은 이름 */
  short: string;
  /** 저장소 이름 → 저장된 문서 파일 (저장소 뿌리에서) */
  stores: Record<string, string>;
  docs: Record<string, DocRef>;
  sources: Record<string, Source>;
  series: SeriesInfo;
  concepts: Record<string, Concept>;
  /** 지도 · "남음"에 나오는 차례 */
  conceptOrder: readonly string[];
  /** 도구 줍기 장면의 도구 */
  toolOrder: readonly string[];
  /** "이어짐" 장면에서 하나 더 줍는 도구 */
  lateTool: string;
  /** 장면을 지나면 그 장면의 개념을 주운 것이다 */
  pickedAfter: Partial<Record<SceneId, readonly string[]>>;
  readers: Record<ReaderId, ReaderFixture>;
  /** 같은 회차 · 다른 조립 — 독자마다 새로 쓰지 않는다. 장면을 고르고 접을 뿐이다 */
  assembly: Record<ReaderId, readonly SceneId[]>;
  copy: EpisodeCopy;
  /** 풀이 장면의 글 — 모양은 회차마다 다르다 (회차의 풀이 부품이 읽는다). check.ts 가 숫자를 보려고 여기 둔다 */
  lab: Record<string, unknown>;
  /** 지도 — 자리 · 선 · 다음 화의 개념. 손으로 놓았다 (배치를 계산하지 않는다 · UX1-d) */
  map: {
    at: Record<string, readonly [number, number]>;
    edges: readonly (readonly [string, string])[];
    ghosts: readonly { name: string; at: readonly [number, number]; from: string }[];
  };
  /** 근거 시트의 꼬리표 — "누구의 판단인가"는 회차마다 다르다 */
  layerLabels: Record<"fact" | "official" | "explain", string>;
}
