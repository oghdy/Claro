// docs/contract/EPISODE.md §1 을 코드로 옮긴 것 (B-E1). 원본은 그 문서다.
// 계약에 없는 칸을 여기서 만들지 않는다. 문서와 어긋나면 test/contract-docs.test.ts 가 실패한다.
// UUID · EventRef · ConceptRef 는 ARTICLE_PACKAGE(./types) 가 코드로 옮긴 것을 쓴다 — 여기서 다시 정의하지 않는다
// (주인은 DATA_MODEL §2 · CONCEPT_IDENTITY §3.2).
//
// 두 가지를 같이 둔다
//   1. TypeScript 타입 — 화면 · 파이프라인이 쓴다
//   2. EPISODE_SHAPES — 같은 칸 목록을 값으로. 타입 식은 문서의 글자 그대로다. 검증기(validate-episode.ts)가 이 표를 읽어 모양을 본다
// 둘의 칸 이름이 어긋나면 컴파일이 안 된다 (Shape<T>).
import type { ConceptRef, EventRef, UUID } from "./types";

// ─────────────────────────────────────────────────────────── 닫힌 값

/** 장면 여덟 — 차례는 고정이다 (D59) */
export const SCENE_IDS = ["cover", "zero", "event", "tools", "aha", "compare", "next", "keep"] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const TRACK_STATES = ["past", "now", "next"] as const;
export type TrackState = (typeof TRACK_STATES)[number];

/** 누구의 말 꼬리표 — fact 문서에 적힌 사실 · official 기관 · 당사자의 판단 · 말 (D46) · explain Claro 가 풀어 쓴 설명 */
export const VOICES = ["fact", "official", "explain"] as const;
export type Voice = (typeof VOICES)[number];

/** 체험이 없는 까닭 (D61 ① ③ ④) */
export const NO_LAB_WHYS = ["politics", "death", "no-source", "no-flip"] as const;
export type NoLabWhy = (typeof NO_LAB_WHYS)[number];

/** 서는 틀 조합 (불변식 15) — 실물: [toggle] 배달앱 1화 · [chain, seats] 금리 2화 · [pages] 개인정보 1화 (UX-5). [chain] · [seats] 는 그 부분 */
export const FRAME_COMBOS: readonly (readonly Frame["kind"][])[] = [["toggle"], ["chain"], ["seats"], ["chain", "seats"], ["pages"]];

// ─────────────────────────────────────────────────────────── 지난 회차에서 온 구절의 키 (§4.5 · 실물 전 · 3화에서 확인 — UX-6)

/** 지난 회차에서 온 구절의 키 꼴 — `<그 구절이 처음 실린 회차의 code>:<그 회차에서의 키>` ("fomc:omo.2023"). 이 회차의 구절은 `:` 없이 쓴다 */
export const CARRIED_KEY = /^([^:]+):([^:]+)$/;
/** 지난 회차 (code) 의 구절 키를 이 회차로 옮길 때의 키 — 이미 옮겨 온 키 (`x:k`)는 그대로 둔다 (앞머리를 거듭 붙이지 않는다) */
export const carriedKey = (previousCode: string, key: string): string => (key.includes(":") ? key : `${previousCode}:${key}`);

// ─────────────────────────────────────────────────────────── 가리키는 이름

/** Episode.quotes 의 키 */
export type QuoteKey = string;
/** Episode.docs 의 키 */
export type DocLabel = string;
/** Tool.key */
export type ToolKey = string;
/** 가리키는 이름 — 독자 글이 아니다 */
export type Id = string;
/** 원문 · 문서 이름 — 독자 글의 숫자 규칙 밖이다 */
export type SourceText = string;
/** 다른 글 속의 조각 — 그 글이 숫자 규칙을 받는다 */
export type Fragment = string;
/** 글 한 덩이의 글자 — 숫자는 불변식 9 가 본다 (맨 글자열의 규칙 10 이 아니라) */
export type TextBody = string;
/** 적어 둔 말 — 어떻게 계산했나(calc) · 그리지 않을 것(not_drawn). 독자 글의 숫자 규칙 밖이다 */
export type Note = string;
/** 지도 위의 자리 — 가로 · 세로 (0 ~ 100) */
export type Point = [number, number];
export type Edge = [ToolKey, ToolKey];

// ─────────────────────────────────────────────────────────── 글 · 근거

/** 독자가 읽는 글 한 덩이. 굵게는 `**이렇게**`, 줄바꿈은 `\n` */
export interface EpisodeText {
  t: TextBody;
  src?: QuoteKey[];
  calc?: Record<string, Note>;
  ui?: true;
  voice?: Voice;
}

export interface EpisodeDoc {
  source_id: UUID;
  name: SourceText;
}

export interface EpisodeQuote {
  doc: DocLabel;
  quote: SourceText;
}

export interface VoiceLabels {
  fact: string;
  official: string;
  explain: string;
}

// ─────────────────────────────────────────────────────────── 시리즈 · 도구 · 조립

export interface Series {
  series_id: UUID;
  code: Id;
  name: string;
  sub: string;
}

export interface TrackItem {
  no: EpisodeText;
  title: EpisodeText;
  state: TrackState;
}

/** 지난 회차를 가리킨다 — ArticleRef (OBSERVATION · D30) 와 같은 방식. 실물 전 · 3화에서 확인 (UX-6 · §3.4) */
export interface EpisodeRef {
  episode_id: UUID;
  episode_version: number;
}

export interface Tool {
  key: ToolKey;
  name: string;
  short: EpisodeText;
  body: EpisodeText[];
  use: EpisodeText;
  basis: ConceptRef[];
}

export interface Pickup {
  tools: ToolKey[];
  aha: ToolKey[];
  next: ToolKey[];
}

export interface Assembly {
  new: SceneId[];
  follower: SceneId[];
}

// ─────────────────────────────────────────────────────────── 장면의 글

export interface CoverScene {
  episode: EpisodeText;
  title: string;
  dek: EpisodeText;
  meta: EpisodeText;
  new_hint: EpisodeText;
  recap_label: string;
  recap: EpisodeText[];
  ask_new: string;
  ask_follower: string;
}

export interface Beat {
  when: EpisodeText;
  head: string;
  body: EpisodeText;
}

export interface ZeroScene {
  kicker: EpisodeText;
  title: EpisodeText;
  beats: Beat[];
  ask: string;
}

export interface Figure {
  who: string;
  amount: EpisodeText;
  tag: string;
}

export interface EventScene {
  kicker: EpisodeText;
  title: string;
  lead: EpisodeText;
  figures: Figure[];
  figure_note: EpisodeText;
  quote_label: string;
  quote: EpisodeText;
  quote_note: string;
  riddle: EpisodeText[];
  ask: string;
}

export interface ToolsScene {
  kicker: string;
  title_new: string;
  title_follower: string;
  sub_new: EpisodeText;
  sub_follower: EpisodeText;
  ask: string;
}

export interface RealItem {
  head: EpisodeText;
  body: EpisodeText;
}

export interface AhaScene {
  kicker: string;
  real_label: string;
  real: RealItem[];
  verdict: EpisodeText;
  ask_new: string;
  ask_follower: string;
}

export interface CompareRow {
  label: string;
  a: EpisodeText;
  b: EpisodeText;
}

export interface CompareScene {
  kicker: string;
  title: string;
  lead: EpisodeText;
  cols: EpisodeText[];
  rows: CompareRow[];
  body: EpisodeText[];
  ask: string;
}

export interface LineItem {
  when: EpisodeText;
  what: string;
  state: TrackState;
}

export interface Coming {
  head: string;
  body: EpisodeText;
}

export interface NextScene {
  kicker: string;
  title: string;
  lead: EpisodeText;
  line: LineItem[];
  here_label: string;
  tool_lead: string;
  coming_label: string;
  coming: Coming[];
  unknown_label: string;
  unknown: EpisodeText[];
  unknown_note: EpisodeText;
  ask: string;
}

export interface KeepScene {
  kicker: string;
  title: string;
  line: string;
  next_body: EpisodeText;
}

export interface Scenes {
  cover: CoverScene;
  zero: ZeroScene;
  event: EventScene;
  tools: ToolsScene;
  aha: AhaScene;
  compare: CompareScene;
  next: NextScene;
  keep: KeepScene;
}

// ─────────────────────────────────────────────────────────── 지도

export interface Ghost {
  name: string;
  at: Point;
  from: ToolKey;
}

export interface ToolMap {
  where_today: EpisodeText;
  at: Record<ToolKey, Point>;
  edges: Edge[];
  ghosts: Ghost[];
}

// ─────────────────────────────────────────────────────────── 풀이

export interface Flip {
  label: string;
  a: string;
  op: string;
  b: string;
  note: EpisodeText;
}

export interface SolveEntry {
  first_thought: EpisodeText;
  breaker: EpisodeText;
  flip: Flip | null;
  not_drawn: Note[];
  whose: EpisodeText;
  death: boolean;
}

/** 그림 부품을 가리킨다 — 그림은 데이터가 아니라 코드다. 같은 id 가 다시 쓰는 단위 (D61 ②) */
export interface PictureRef {
  id: Id;
  tool: ToolKey;
}

export interface ToggleTabs {
  off: string;
  on: string;
}
export interface ToggleDevice {
  on: string;
  off: string;
}
export interface ToggleState {
  idle: string;
  moved: string;
  blocked: string;
}
export interface ToggleCaption {
  off_before: EpisodeText;
  off_after: EpisodeText;
  on_before: EpisodeText;
  on_after: EpisodeText;
}

/** 켜고 끄기 — 그림(자리 · 막대 · 알갱이)은 picture.id 가 가리키는 개념의 그림 부품에 있다. 여기에는 뼈의 글만 */
export interface ToggleFrame {
  kind: "toggle";
  picture: PictureRef;
  tabs: ToggleTabs;
  device: ToggleDevice;
  action: string;
  again: string;
  go_on: string;
  state: ToggleState;
  caption: ToggleCaption;
}

export interface ReachedNode {
  id: Id;
  name: string;
  reach: "full" | "part";
  idle: string;
  after: EpisodeText;
  before?: ChainBefore;
}
export interface StoppedNode {
  id: Id;
  name: string;
  reach: "none";
  still: EpisodeText;
  before?: ChainBefore;
}
export type ChainNode = ReachedNode | StoppedNode;

/** 같은 그림의 지난 값 — 지난 회차 (Episode.previous)의 같은 고리 (같은 picture.id · 같은 고리 id). 실물 전 · 3화에서 확인 (UX-6 · §7.9) */
export interface ChainBefore {
  reach: "full" | "part" | "none";
  value: EpisodeText;
}

export interface ChainCaption {
  before: EpisodeText;
  after: EpisodeText;
}

/** 어디서 멈추나 */
export interface ChainFrame {
  kind: "chain";
  picture: PictureRef;
  tab: EpisodeText | null;
  nodes: ChainNode[];
  unknown: string;
  action: string;
  again: string;
  caption: ChainCaption;
  go_on: EpisodeText | null;
}

export interface SeatsGround {
  body: string;
  split: "official-dissent" | "party-vote";
  record: QuoteKey[];
}

export interface SeatSide {
  id: Id;
  choose: string;
  group: EpisodeText;
  count: number;
  said: EpisodeText;
  why: "in-doc" | "not-yet";
  not_yet_note: Fragment | null;
  before?: SeatBefore;
}

/** 같은 그림의 지난 값 — 지난 회차의 같은 쪽 (같은 picture.id · 같은 쪽 id). 실물 전 · 3화에서 확인 (UX-6 · §7.9) */
export interface SeatBefore {
  group: EpisodeText;
  why: "in-doc" | "not-yet";
}

export interface SeatsCaption {
  before: EpisodeText;
}

/** 자리에 앉기 */
export interface SeatsFrame {
  kind: "seats";
  picture: PictureRef;
  tab: EpisodeText | null;
  ground: SeatsGround;
  label: string;
  you: string;
  sides: SeatSide[];
  other: string;
  result: EpisodeText;
  caption: SeatsCaption;
}

/** 넘겨 보기의 한 칸 — 때가 문서에 있으면 when, 없으면 no_date ("날짜 없음"이 화면에 보인다 — 불변식 22) */
export interface PageCard {
  id: Id;
  when: EpisodeText | null;
  no_date: string | null;
  head: string;
  body: EpisodeText;
  state: TrackState;
  star: boolean;
}

export interface PagesCaption {
  before: EpisodeText;
  after: EpisodeText;
}

/** 넘겨 보기 — 일의 차례를 한 칸씩 넘긴다. ★ 칸 하나가 "아!"다 (UX-5 · §7.8). 앞날 칸은 없다 (불변식 24) */
export interface PagesFrame {
  kind: "pages";
  picture: PictureRef;
  label: string;
  cards: PageCard[];
  ask: string;
  action: string;
  again: string;
  caption: PagesCaption;
}

export type Frame = ToggleFrame | ChainFrame | SeatsFrame | PagesFrame;

export interface Born {
  lead: string;
  tool: ToolKey;
}

export interface Lab {
  title: string;
  seen_title: string | null;
  setup: EpisodeText[];
  frames: Frame[];
  born: Born | null;
}

export interface PlainFlip {
  kind: "flip";
  why: NoLabWhy | null;
  title: string;
}

export interface Differ {
  who: EpisodeText;
  says: EpisodeText;
}

export interface PlainThree {
  kind: "three";
  why: NoLabWhy | null;
  title: string;
  lead: EpisodeText;
  known: EpisodeText[];
  unknown: EpisodeText[];
  differ: Differ[];
  differ_note: EpisodeText | null;
}

export interface PlainQuiet {
  kind: "quiet";
  why: NoLabWhy | null;
  title: string;
  what: EpisodeText[];
  known: EpisodeText[];
  coming: EpisodeText[];
  ask: string;
}

export type PlainSolve = PlainFlip | PlainThree | PlainQuiet;

export interface Solve {
  entry: SolveEntry;
  lab: Lab | null;
  plain: PlainSolve | null;
}

// ─────────────────────────────────────────────────────────── 회차

export interface Episode {
  episode_id: UUID;
  episode_version: number;
  code: Id;
  event_ref: EventRef;
  series: Series;
  number: number;
  track: TrackItem[];
  previous?: EpisodeRef;
  docs: Record<DocLabel, EpisodeDoc>;
  quotes: Record<QuoteKey, EpisodeQuote>;
  voice_labels: VoiceLabels;
  tools: Tool[];
  pickup: Pickup;
  assembly: Assembly;
  scenes: Scenes;
  solve: Solve;
  map: ToolMap;
}

// ─────────────────────────────────────────────────────────── 칸 목록 (값) — 문서의 타입 블록과 글자로 같다

/** T 의 칸 이름을 빠짐없이 · 남김없이. 없어도 되는 칸은 이름 끝에 `?` */
type Shape<T> = { readonly [K in keyof T as K extends string ? (undefined extends T[K] ? `${K}?` : K) : never]-?: string };

export const EPISODE_SHAPES = {
  Episode: {
    episode_id: "UUID",
    episode_version: "integer",
    code: "Id",
    event_ref: "EventRef",
    series: "Series",
    number: "integer",
    track: "TrackItem[]",
    "previous?": "EpisodeRef",
    docs: "Record<DocLabel, EpisodeDoc>",
    quotes: "Record<QuoteKey, EpisodeQuote>",
    voice_labels: "VoiceLabels",
    tools: "Tool[]",
    pickup: "Pickup",
    assembly: "Assembly",
    scenes: "Scenes",
    solve: "Solve",
    map: "ToolMap",
  } satisfies Shape<Episode>,
  Series: { series_id: "UUID", code: "Id", name: "string", sub: "string" } satisfies Shape<Series>,
  TrackItem: { no: "EpisodeText", title: "EpisodeText", state: "TrackState" } satisfies Shape<TrackItem>,
  EpisodeRef: { episode_id: "UUID", episode_version: "integer" } satisfies Shape<EpisodeRef>,
  EpisodeText: { t: "TextBody", "src?": "QuoteKey[]", "calc?": "Record<string, Note>", "ui?": "true", "voice?": "Voice" } satisfies Shape<EpisodeText>,
  EpisodeDoc: { source_id: "UUID", name: "SourceText" } satisfies Shape<EpisodeDoc>,
  EpisodeQuote: { doc: "DocLabel", quote: "SourceText" } satisfies Shape<EpisodeQuote>,
  VoiceLabels: { fact: "string", official: "string", explain: "string" } satisfies Shape<VoiceLabels>,
  Tool: { key: "ToolKey", name: "string", short: "EpisodeText", body: "EpisodeText[]", use: "EpisodeText", basis: "ConceptRef[]" } satisfies Shape<Tool>,
  Pickup: { tools: "ToolKey[]", aha: "ToolKey[]", next: "ToolKey[]" } satisfies Shape<Pickup>,
  Assembly: { new: "SceneId[]", follower: "SceneId[]" } satisfies Shape<Assembly>,
  Scenes: {
    cover: "CoverScene",
    zero: "ZeroScene",
    event: "EventScene",
    tools: "ToolsScene",
    aha: "AhaScene",
    compare: "CompareScene",
    next: "NextScene",
    keep: "KeepScene",
  } satisfies Shape<Scenes>,
  CoverScene: {
    episode: "EpisodeText",
    title: "string",
    dek: "EpisodeText",
    meta: "EpisodeText",
    new_hint: "EpisodeText",
    recap_label: "string",
    recap: "EpisodeText[]",
    ask_new: "string",
    ask_follower: "string",
  } satisfies Shape<CoverScene>,
  ZeroScene: { kicker: "EpisodeText", title: "EpisodeText", beats: "Beat[]", ask: "string" } satisfies Shape<ZeroScene>,
  Beat: { when: "EpisodeText", head: "string", body: "EpisodeText" } satisfies Shape<Beat>,
  EventScene: {
    kicker: "EpisodeText",
    title: "string",
    lead: "EpisodeText",
    figures: "Figure[]",
    figure_note: "EpisodeText",
    quote_label: "string",
    quote: "EpisodeText",
    quote_note: "string",
    riddle: "EpisodeText[]",
    ask: "string",
  } satisfies Shape<EventScene>,
  Figure: { who: "string", amount: "EpisodeText", tag: "string" } satisfies Shape<Figure>,
  ToolsScene: {
    kicker: "string",
    title_new: "string",
    title_follower: "string",
    sub_new: "EpisodeText",
    sub_follower: "EpisodeText",
    ask: "string",
  } satisfies Shape<ToolsScene>,
  AhaScene: {
    kicker: "string",
    real_label: "string",
    real: "RealItem[]",
    verdict: "EpisodeText",
    ask_new: "string",
    ask_follower: "string",
  } satisfies Shape<AhaScene>,
  RealItem: { head: "EpisodeText", body: "EpisodeText" } satisfies Shape<RealItem>,
  CompareScene: {
    kicker: "string",
    title: "string",
    lead: "EpisodeText",
    cols: "EpisodeText[]",
    rows: "CompareRow[]",
    body: "EpisodeText[]",
    ask: "string",
  } satisfies Shape<CompareScene>,
  CompareRow: { label: "string", a: "EpisodeText", b: "EpisodeText" } satisfies Shape<CompareRow>,
  NextScene: {
    kicker: "string",
    title: "string",
    lead: "EpisodeText",
    line: "LineItem[]",
    here_label: "string",
    tool_lead: "string",
    coming_label: "string",
    coming: "Coming[]",
    unknown_label: "string",
    unknown: "EpisodeText[]",
    unknown_note: "EpisodeText",
    ask: "string",
  } satisfies Shape<NextScene>,
  LineItem: { when: "EpisodeText", what: "string", state: "TrackState" } satisfies Shape<LineItem>,
  Coming: { head: "string", body: "EpisodeText" } satisfies Shape<Coming>,
  KeepScene: { kicker: "string", title: "string", line: "string", next_body: "EpisodeText" } satisfies Shape<KeepScene>,
  ToolMap: { where_today: "EpisodeText", at: "Record<ToolKey, Point>", edges: "Edge[]", ghosts: "Ghost[]" } satisfies Shape<ToolMap>,
  Ghost: { name: "string", at: "Point", from: "ToolKey" } satisfies Shape<Ghost>,
  Solve: { entry: "SolveEntry", lab: "Lab | null", plain: "PlainSolve | null" } satisfies Shape<Solve>,
  SolveEntry: {
    first_thought: "EpisodeText",
    breaker: "EpisodeText",
    flip: "Flip | null",
    not_drawn: "Note[]",
    whose: "EpisodeText",
    death: "boolean",
  } satisfies Shape<SolveEntry>,
  Flip: { label: "string", a: "string", op: "string", b: "string", note: "EpisodeText" } satisfies Shape<Flip>,
  Lab: { title: "string", seen_title: "string | null", setup: "EpisodeText[]", frames: "Frame[]", born: "Born | null" } satisfies Shape<Lab>,
  Born: { lead: "string", tool: "ToolKey" } satisfies Shape<Born>,
  PictureRef: { id: "Id", tool: "ToolKey" } satisfies Shape<PictureRef>,
  ToggleFrame: {
    kind: '"toggle"',
    picture: "PictureRef",
    tabs: "ToggleTabs",
    device: "ToggleDevice",
    action: "string",
    again: "string",
    go_on: "string",
    state: "ToggleState",
    caption: "ToggleCaption",
  } satisfies Shape<ToggleFrame>,
  ToggleTabs: { off: "string", on: "string" } satisfies Shape<ToggleTabs>,
  ToggleDevice: { on: "string", off: "string" } satisfies Shape<ToggleDevice>,
  ToggleState: { idle: "string", moved: "string", blocked: "string" } satisfies Shape<ToggleState>,
  ToggleCaption: { off_before: "EpisodeText", off_after: "EpisodeText", on_before: "EpisodeText", on_after: "EpisodeText" } satisfies Shape<ToggleCaption>,
  ChainFrame: {
    kind: '"chain"',
    picture: "PictureRef",
    tab: "EpisodeText | null",
    nodes: "ChainNode[]",
    unknown: "string",
    action: "string",
    again: "string",
    caption: "ChainCaption",
    go_on: "EpisodeText | null",
  } satisfies Shape<ChainFrame>,
  ReachedNode: { id: "Id", name: "string", reach: '"full" | "part"', idle: "string", after: "EpisodeText", "before?": "ChainBefore" } satisfies Shape<ReachedNode>,
  StoppedNode: { id: "Id", name: "string", reach: '"none"', still: "EpisodeText", "before?": "ChainBefore" } satisfies Shape<StoppedNode>,
  ChainBefore: { reach: '"full" | "part" | "none"', value: "EpisodeText" } satisfies Shape<ChainBefore>,
  ChainCaption: { before: "EpisodeText", after: "EpisodeText" } satisfies Shape<ChainCaption>,
  SeatsFrame: {
    kind: '"seats"',
    picture: "PictureRef",
    tab: "EpisodeText | null",
    ground: "SeatsGround",
    label: "string",
    you: "string",
    sides: "SeatSide[]",
    other: "string",
    result: "EpisodeText",
    caption: "SeatsCaption",
  } satisfies Shape<SeatsFrame>,
  SeatsGround: { body: "string", split: '"official-dissent" | "party-vote"', record: "QuoteKey[]" } satisfies Shape<SeatsGround>,
  SeatSide: {
    id: "Id",
    choose: "string",
    group: "EpisodeText",
    count: "integer",
    said: "EpisodeText",
    why: '"in-doc" | "not-yet"',
    not_yet_note: "Fragment | null",
    "before?": "SeatBefore",
  } satisfies Shape<SeatSide>,
  SeatBefore: { group: "EpisodeText", why: '"in-doc" | "not-yet"' } satisfies Shape<SeatBefore>,
  SeatsCaption: { before: "EpisodeText" } satisfies Shape<SeatsCaption>,
  PagesFrame: {
    kind: '"pages"',
    picture: "PictureRef",
    label: "string",
    cards: "PageCard[]",
    ask: "string",
    action: "string",
    again: "string",
    caption: "PagesCaption",
  } satisfies Shape<PagesFrame>,
  PageCard: {
    id: "Id",
    when: "EpisodeText | null",
    no_date: "string | null",
    head: "string",
    body: "EpisodeText",
    state: "TrackState",
    star: "boolean",
  } satisfies Shape<PageCard>,
  PagesCaption: { before: "EpisodeText", after: "EpisodeText" } satisfies Shape<PagesCaption>,
  PlainFlip: { kind: '"flip"', why: "NoLabWhy | null", title: "string" } satisfies Shape<PlainFlip>,
  PlainThree: {
    kind: '"three"',
    why: "NoLabWhy | null",
    title: "string",
    lead: "EpisodeText",
    known: "EpisodeText[]",
    unknown: "EpisodeText[]",
    differ: "Differ[]",
    differ_note: "EpisodeText | null",
  } satisfies Shape<PlainThree>,
  Differ: { who: "EpisodeText", says: "EpisodeText" } satisfies Shape<Differ>,
  PlainQuiet: {
    kind: '"quiet"',
    why: "NoLabWhy | null",
    title: "string",
    what: "EpisodeText[]",
    known: "EpisodeText[]",
    coming: "EpisodeText[]",
    ask: "string",
  } satisfies Shape<PlainQuiet>,
} as const;

export type EpisodeShapeName = keyof typeof EPISODE_SHAPES;

/** 이름 붙인 타입 식 — 문서의 `이름 = 식` 줄과 글자로 같다 */
export const EPISODE_ALIASES = {
  QuoteKey: "string",
  DocLabel: "string",
  ToolKey: "string",
  Id: "string",
  SourceText: "string",
  Fragment: "string",
  TextBody: "string",
  Note: "string",
  Point: "[number, number]",
  Edge: "[ToolKey, ToolKey]",
  SceneId: SCENE_IDS.map((v) => `"${v}"`).join(" | "),
  TrackState: TRACK_STATES.map((v) => `"${v}"`).join(" | "),
  Voice: VOICES.map((v) => `"${v}"`).join(" | "),
  NoLabWhy: NO_LAB_WHYS.map((v) => `"${v}"`).join(" | "),
  Frame: "ToggleFrame | ChainFrame | SeatsFrame | PagesFrame",
  ChainNode: "ReachedNode | StoppedNode",
  PlainSolve: "PlainFlip | PlainThree | PlainQuiet",
} as const;

/** 갈래가 있는 타입 — 어느 칸의 값으로 갈래를 고르나 */
export const EPISODE_UNIONS: Record<string, { tag: string; of: Record<string, EpisodeShapeName> }> = {
  Frame: { tag: "kind", of: { toggle: "ToggleFrame", chain: "ChainFrame", seats: "SeatsFrame", pages: "PagesFrame" } },
  ChainNode: { tag: "reach", of: { full: "ReachedNode", part: "ReachedNode", none: "StoppedNode" } },
  PlainSolve: { tag: "kind", of: { flip: "PlainFlip", three: "PlainThree", quiet: "PlainQuiet" } },
};
