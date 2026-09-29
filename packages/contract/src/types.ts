// docs/contract/ARTICLE_PACKAGE.md §1 · §7 을 코드로 옮긴 것. 원본은 그 문서다.
// 계약에 없는 필드를 여기서 만들지 않는다. 바꿔야 할 게 보이면 docs/development-backend.md "계약 변경 요청".

/** 0.2 가 모양을 정한다. 지금은 문자열 ID 로만 다룬다 (§1). */
export type Ref = string;

export type Layer = "fact" | "claim" | "concept" | "bridge" | "writing";

export const LAYERS: readonly Layer[] = ["fact", "claim", "concept", "bridge", "writing"];

/** 출처가 하나인 가장 작은 글 조각 (§6). 인라인 서식은 `<b>…</b>` 와 `\n` 둘뿐. */
export interface Span {
  text: string;
  layer: Layer;
  /** writing 이면 [], 나머지는 1개 이상 (픽스처의 0.2 대기만 예외 — §6.2) */
  refs: Ref[];
}

export type RichText = Span[];

export type LevelId = "basic" | "intermediate" | "advanced";

/** 배열 순서 = 전환 UI 순서 (§3) */
export const LEVEL_IDS: readonly LevelId[] = ["basic", "intermediate", "advanced"];

export interface ArticlePackage {
  event_ref: Ref;
  title: string;
  lang: "ko";
  published_at: string;
  levels: Level[];
}

export interface Level {
  id: LevelId;
  /** 배열 순서 = 읽는 순서 */
  slides: Slide[];
  /** 길이 = slides.length − 1. open_questions[i] 는 slides[i] 와 slides[i+1] 사이 (D17) */
  open_questions: OpenQuestion[];
}

export interface Slide {
  kicker: string;
  headline: RichText;
  blocks: Block[];
}

export interface OpenQuestion {
  text: string;
}

// ---------------------------------------------------------------- 블록 — 원형 5개 (§7.2, D20)

export type Weight = "normal" | "secondary" | "callout" | "conclusion";

export const WEIGHTS: readonly Weight[] = ["normal", "secondary", "callout", "conclusion"];

export interface Prose {
  type: "prose";
  text: string;
  paragraphs: { body: RichText; weight: Weight }[];
}

export interface Quote {
  type: "quote";
  text: string;
  attribution: string;
  body: RichText;
}

export interface ListItem {
  label?: RichText;
  body: RichText;
  emphasized?: true;
}

export interface List {
  type: "list";
  text: string;
  ordered: boolean;
  items: ListItem[];
}

/** value 와 body 중 하나 이상 (§7.6) */
export interface ContrastItem {
  label: RichText;
  value?: RichText;
  body?: RichText;
  emphasized?: true;
}

export interface Contrast {
  type: "contrast";
  text: string;
  items: ContrastItem[];
}

export interface Sheet {
  type: "sheet";
  text: string;
  rows: { label: RichText; value: RichText }[];
}

export type Block = Prose | Quote | List | Contrast | Sheet;

export type BlockType = Block["type"];

export const BLOCK_TYPES: readonly BlockType[] = ["prose", "quote", "list", "contrast", "sheet"];

/**
 * 모르는 원형 (§7.9). 계약이 닫은 목록 밖이지만 백엔드가 먼저 배포되는 순간은 생긴다.
 * 프론트는 `text` 만 믿고 문단으로 그린다. 나머지 필드는 읽지 않는다.
 * 계약 타입이 아니라 프론트가 받는 입력의 모양이다.
 */
export interface UnknownBlock {
  type: string;
  text: string;
}

/** 프론트가 실제로 받는 블록 — 원형이거나 모르는 원형 */
export type ReceivedBlock = Block | UnknownBlock;

export function isKnownBlock(b: ReceivedBlock): b is Block {
  return (BLOCK_TYPES as readonly string[]).includes(b.type);
}
