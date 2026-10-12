// docs/contract/OBSERVATION.md §1 을 코드로 옮긴 것. 원본은 그 문서다 (B-0.4a).
// 계약에 없는 칸을 여기서 만들지 않는다. 문서와 어긋나면 test/contract-docs.test.ts 가 실패한다.
// LevelId 는 ARTICLE_PACKAGE(./types), GoalRef 는 DATA_MODEL(./data-model) 이 주인이다 — 여기서 다시 정의하지 않는다.
import type { GoalRef } from "./data-model";
import { opt, req, union, type TypeDesc } from "./describe";
import type { LevelId, UUID } from "./types";

/** "2026-10-09T05:12:33Z" — UTC, 초 단위 이상 */
export type Timestamp = string;

// ── 가리키기 (§2)
export interface ArticleRef {
  article_id: UUID;
  article_version: number;
}

/** 그 판 · 그 레벨 안의 자리. 위치로 가리킨다 */
export interface SlideLoc {
  slide_index: number;
  block_index: number | null;
}

// ── 닫힌 값 (확정 §9.4)
export const POSITIONS = ["PRE", "POST", "DELAYED"] as const;
export type Position = (typeof POSITIONS)[number];

export const PROBE_TYPES = ["DIAGNOSTIC", "ACTIVE", "AUDIT", "COMPREHENSION"] as const;
export type ProbeType = (typeof PROBE_TYPES)[number];

export const LEVEL_CHOSEN_BY = ["DEFAULT", "READER"] as const;
export const DECISIONS = ["SKIP", "REFRESHER", "FULL"] as const;
export const READING_EVENT_TYPES = ["SLIDE_ENTERED", "SLIDE_END_SHOWN", "LEVEL_SWITCHED", "CLOSED"] as const;
export const EVIDENCE_TYPES = ["PROBE_RESPONSE", "SELF_REPORT_KNOWN"] as const;

/** 정적 레벨의 BlockDecision.reason (§4.2). 다른 값은 실물 없음 */
export const STATIC_LEVEL_REASON = "STATIC_LEVEL";

// ── 시스템이 무엇을 보여줬나 (§4)
export interface BlockDecision {
  concept_id: UUID;
  version: number;
  decision: (typeof DECISIONS)[number];
  reason: string;
}

export interface ProbePlanItem {
  probe_id: UUID;
  probe_version: number;
  probe_type: ProbeType;
  position: Position;
}

export interface ReadingPlanLog {
  plan_id: UUID;
  user_id: UUID;
  session_id: UUID;
  reading_id: UUID;
  article_id: UUID;
  article_version: number;
  created_at: Timestamp;
  level: LevelId;
  level_chosen_by: (typeof LEVEL_CHOSEN_BY)[number];
  estimator_version: string | null;
  selected_blocks: SlideLoc[] | null;
  skipped_blocks: SlideLoc[] | null;
  block_decisions: BlockDecision[];
  narrative_form: string | null;
  probe_plan: ProbePlanItem[];
}

// ── 독자가 무엇을 했나 — 읽기 (§5)
export interface ReadingEvent {
  event_id: UUID;
  user_id: UUID;
  session_id: UUID;
  reading_id: UUID;
  plan_id: UUID;
  seq: number;
  occurred_at: Timestamp;
  type: (typeof READING_EVENT_TYPES)[number];
  slide_index: number | null;
  from_plan_id: UUID | null;
}

// ── 독자가 무엇을 했나 — 개념에 대해 (§7)
export interface ExposureContext {
  session_id: UUID;
  reading_id: UUID | null;
  plan_id: UUID | null;
}

export interface KnowledgeEvidence {
  event_id: UUID;
  user_id: UUID;
  concept_id: UUID;
  content_version: number;
  timestamp: Timestamp;
  evidence_type: (typeof EVIDENCE_TYPES)[number];
  position: Position | null;
  interaction_id: UUID;
  probe_id: UUID | null;
  article_id: UUID | null;
  article_version: number | null;
  content_block_id: SlideLoc | null;
  exposure_context: ExposureContext;
  model_version: string | null;
}

// ── probe (§6)
export interface ProbeTarget {
  concept_id: UUID;
  version: number;
}

export interface Probe {
  probe_id: UUID;
  version: number;
  created_on: string;
  event_id: UUID | null;
  goal_ref: GoalRef | null;
  targets: ProbeTarget[];
  prompt: string;
  choices: string[] | null;
  correct_choice: number | null;
}

export interface ProbeExposure {
  exposure_id: UUID;
  user_id: UUID;
  session_id: UUID;
  probe_id: UUID;
  probe_version: number;
  probe_type: ProbeType;
  position: Position;
  plan_id: UUID | null;
  shown_at_loc: SlideLoc | null;
  shown_at: Timestamp;
}

export interface ProbeResponse {
  interaction_id: UUID;
  exposure_id: UUID;
  user_id: UUID;
  responded_at: Timestamp;
  response: string;
  is_correct: boolean | null;
}

// ── 교정 기록 (§8 · §9). 원본은 logs/correction-log.jsonl 이다 — 테이블은 아직 없다
export const GATES = ["GATE_1", "GATE_2", "GATE_3", "GATE_4"] as const;
export const ERROR_TYPES = [
  "팩트 누락", "Goal 왜곡", "오독 미방어", "스토리라인 stale", "압축", "시점 앵커 누락", "원문 불일치", "축약 변질", "레이어 혼입",
] as const;
export const CAUGHT_BY = [
  "BACKGROUND_KNOWLEDGE", "SOURCE_RECHECK", "PLAIN_READING", "OTHER_READER", "AUTOMATED_CHECK", "ARTIFACT_COMPARE",
] as const;
export const CORRECTION_TARGET_KINDS = ["ARTICLE", "CONCEPT", "FACT", "CLAIM", "GOAL", "BRIDGE"] as const;
export const REPLACEMENT_KINDS = ["FACT", "CLAIM", "BRIDGE", "CONCEPT_VERSION"] as const;

export interface CorrectionTarget {
  kind: (typeof CORRECTION_TARGET_KINDS)[number];
  code: string;
  where: string | null;
}

export interface Replacement {
  kind: (typeof REPLACEMENT_KINDS)[number];
  old_id: UUID;
  old_version: number | null;
  new_id: UUID | null;
  new_version: number | null;
}

export interface CorrectionEntry {
  correction_id: UUID;
  date: string;
  event_code: string | null;
  gate: (typeof GATES)[number] | null;
  occasion: string;
  stage: string | null;
  targets: CorrectionTarget[];
  error_type: (typeof ERROR_TYPES)[number];
  type_note: string | null;
  what_was_wrong: string;
  what_i_changed: string;
  caught_by: (typeof CAUGHT_BY)[number];
  check: string | null;
  catch_note: string | null;
  time_spent_min: number | null;
  after_publication: boolean;
  replacements: Replacement[];
}

// ── 칸 목록 — 문서의 타입 식 그대로. 문서 ↔ 이 목록은 테스트가, 이 목록 ↔ 위 타입은 컴파일러가 댄다
export const OBSERVATION_TYPES = {
  ArticleRef: { article_id: req("UUID"), article_version: req("integer") } satisfies TypeDesc<ArticleRef>,
  SlideLoc: { slide_index: req("integer"), block_index: opt("integer") } satisfies TypeDesc<SlideLoc>,
  ReadingPlanLog: {
    plan_id: req("UUID"),
    user_id: req("UUID"),
    session_id: req("UUID"),
    reading_id: req("UUID"),
    article_id: req("UUID"),
    article_version: req("integer"),
    created_at: req("Timestamp"),
    level: req("LevelId"),
    level_chosen_by: req(union(LEVEL_CHOSEN_BY)),
    estimator_version: opt("string"),
    selected_blocks: opt("SlideLoc[]"),
    skipped_blocks: opt("SlideLoc[]"),
    block_decisions: req("BlockDecision[]"),
    narrative_form: opt("string"),
    probe_plan: req("ProbePlanItem[]"),
  } satisfies TypeDesc<ReadingPlanLog>,
  BlockDecision: {
    concept_id: req("UUID"),
    version: req("integer"),
    decision: req(union(DECISIONS)),
    reason: req("string"),
  } satisfies TypeDesc<BlockDecision>,
  ProbePlanItem: {
    probe_id: req("UUID"),
    probe_version: req("integer"),
    probe_type: req("ProbeType"),
    position: req("Position"),
  } satisfies TypeDesc<ProbePlanItem>,
  ReadingEvent: {
    event_id: req("UUID"),
    user_id: req("UUID"),
    session_id: req("UUID"),
    reading_id: req("UUID"),
    plan_id: req("UUID"),
    seq: req("integer"),
    occurred_at: req("Timestamp"),
    type: req(union(READING_EVENT_TYPES)),
    slide_index: opt("integer"),
    from_plan_id: opt("UUID"),
  } satisfies TypeDesc<ReadingEvent>,
  KnowledgeEvidence: {
    event_id: req("UUID"),
    user_id: req("UUID"),
    concept_id: req("UUID"),
    content_version: req("integer"),
    timestamp: req("Timestamp"),
    evidence_type: req(union(EVIDENCE_TYPES)),
    position: opt("Position"),
    interaction_id: req("UUID"),
    probe_id: opt("UUID"),
    article_id: opt("UUID"),
    article_version: opt("integer"),
    content_block_id: opt("SlideLoc"),
    exposure_context: req("ExposureContext"),
    model_version: opt("string"),
  } satisfies TypeDesc<KnowledgeEvidence>,
  ExposureContext: {
    session_id: req("UUID"),
    reading_id: opt("UUID"),
    plan_id: opt("UUID"),
  } satisfies TypeDesc<ExposureContext>,
  Probe: {
    probe_id: req("UUID"),
    version: req("integer"),
    created_on: req("string"),
    event_id: opt("UUID"),
    goal_ref: opt("GoalRef"),
    targets: req("ProbeTarget[]"),
    prompt: req("string"),
    choices: opt("string[]"),
    correct_choice: opt("integer"),
  } satisfies TypeDesc<Probe>,
  ProbeTarget: { concept_id: req("UUID"), version: req("integer") } satisfies TypeDesc<ProbeTarget>,
  ProbeExposure: {
    exposure_id: req("UUID"),
    user_id: req("UUID"),
    session_id: req("UUID"),
    probe_id: req("UUID"),
    probe_version: req("integer"),
    probe_type: req("ProbeType"),
    position: req("Position"),
    plan_id: opt("UUID"),
    shown_at_loc: opt("SlideLoc"),
    shown_at: req("Timestamp"),
  } satisfies TypeDesc<ProbeExposure>,
  ProbeResponse: {
    interaction_id: req("UUID"),
    exposure_id: req("UUID"),
    user_id: req("UUID"),
    responded_at: req("Timestamp"),
    response: req("string"),
    is_correct: opt("boolean"),
  } satisfies TypeDesc<ProbeResponse>,
  CorrectionEntry: {
    correction_id: req("UUID"),
    date: req("string"),
    event_code: opt("string"),
    gate: opt(union(GATES)),
    occasion: req("string"),
    stage: opt("string"),
    targets: req("CorrectionTarget[]"),
    error_type: req(union(ERROR_TYPES)),
    type_note: opt("string"),
    what_was_wrong: req("string"),
    what_i_changed: req("string"),
    caught_by: req(union(CAUGHT_BY)),
    check: opt("string"),
    catch_note: opt("string"),
    time_spent_min: opt("integer"),
    after_publication: req("boolean"),
    replacements: req("Replacement[]"),
  } satisfies TypeDesc<CorrectionEntry>,
  CorrectionTarget: {
    kind: req(union(CORRECTION_TARGET_KINDS)),
    code: req("string"),
    where: opt("string"),
  } satisfies TypeDesc<CorrectionTarget>,
  Replacement: {
    kind: req(union(REPLACEMENT_KINDS)),
    old_id: req("UUID"),
    old_version: opt("integer"),
    new_id: opt("UUID"),
    new_version: opt("integer"),
  } satisfies TypeDesc<Replacement>,
} as const;

/** 문서의 `Name = "A" | "B"` — 이름 붙인 닫힌 값 */
export const OBSERVATION_ALIASES = { Position: POSITIONS, ProbeType: PROBE_TYPES } as const;

/** 덧붙이기만 하는 독자 원장 (§1). Probe 는 "만든 뒤 고치지 않는다" (§6.1). 교정 기록은 jsonl 이 원본이라 여기 없다 */
export const READER_LEDGERS = [
  "ReadingPlanLog", "ReadingEvent", "KnowledgeEvidence", "Probe", "ProbeExposure", "ProbeResponse",
] as const;
export type ReaderLedger = (typeof READER_LEDGERS)[number];
