// 독자 기록 원장 + 기사 한 판 (B-0.4a). 원본은 docs/contract/OBSERVATION.md §1 · DATA_MODEL.md §11 이다.
//
// - 원장 타입마다 테이블 하나. **칸 이름은 계약 그대로다** — 더하지도 빼지도 바꾸지도 않았다 (src/contract-check.ts 가 컴파일 때, 테스트가 실행 때 댄다)
// - 계약 안에서 다른 타입에 담기는 모양(BlockDecision · ProbePlanItem · ProbeTarget · SlideLoc · ExposureContext)은 그 칸에 jsonb 로 담는다
// - 닫힌 값은 @claro/contract 의 목록에서 CHECK 를 만든다 — 값 목록을 여기 다시 적지 않는다
// - 담긴 모양 · 가리키는 것이 있는가 · "덧붙이기만"은 migrations 의 트리거가 지킨다 (0001 · 0003).
//   읽기 사건의 뜻(순서가 계약대로인가)은 넣을 때 막지 않는다 — 읽을 때 src/check.ts 가 열람마다 본다 (D34)
// - 지식 상태 · 가중치 · 임계값을 담는 테이블은 없다 (FINDINGS §9.4 · §9.6). 완독 · 멈춘 장도 칸이 아니다 — src/summary.ts 가 원장에서 센다
import type {
  ArticleAuthoring, ArticlePackage, BlockDecision, ExposureContext, LevelId, Position, ProbePlanItem, ProbeTarget, ProbeType,
  ReadingEvent, ReadingPlanLog, KnowledgeEvidence, SlideLoc,
} from "@claro/contract";
import {
  DECISIONS, EVIDENCE_TYPES, LEVEL_CHOSEN_BY, LEVEL_IDS, POSITIONS, PROBE_TYPES, READING_EVENT_TYPES,
} from "@claro/contract";
import { sql } from "drizzle-orm";
import {
  boolean, check, date, foreignKey, integer, json, jsonb, pgSchema, pgTable, primaryKey, text, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { timestamptz } from "./timestamp";

void DECISIONS; // BlockDecision.decision 은 jsonb 안에 있다 — 트리거가 본다 (0001). 목록의 주인은 계약이다

const inList = (column: string, values: readonly string[]) => `"${column}" in (${values.map((v) => `'${v}'`).join(", ")})`;
const oneOf = (column: string, values: readonly string[]) => sql.raw(inList(column, values));

// ── 기사 한 판 — ArticleRecord (DATA_MODEL §11). 통째로 불변
// package · authoring 은 json 이다 (jsonb 가 아니다): 넣은 글자 · 키 순서 그대로 나온다. 안을 나눠 담지 않는다
export const articleRecord = pgTable(
  "article_record",
  {
    article_id: uuid().notNull(),
    article_version: integer().notNull(),
    package: json().$type<ArticlePackage>().notNull(),
    authoring: json().$type<ArticleAuthoring>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.article_id, t.article_version] }),
    check("article_record_version_positive", sql.raw(`"article_version" >= 1`)),
  ],
);

// ── ReadingPlanLog — 시스템이 무엇을 보여줬나 (§4)
export const readingPlanLog = pgTable(
  "reading_plan_log",
  {
    plan_id: uuid().primaryKey(),
    user_id: uuid().notNull(),
    session_id: uuid().notNull(),
    reading_id: uuid().notNull(),
    article_id: uuid().notNull(),
    article_version: integer().notNull(),
    created_at: timestamptz().notNull(),
    level: text().$type<LevelId>().notNull(),
    level_chosen_by: text().$type<ReadingPlanLog["level_chosen_by"]>().notNull(),
    estimator_version: text(),
    selected_blocks: jsonb().$type<SlideLoc[]>(),
    skipped_blocks: jsonb().$type<SlideLoc[]>(),
    block_decisions: jsonb().$type<BlockDecision[]>().notNull(),
    narrative_form: text(),
    probe_plan: jsonb().$type<ProbePlanItem[]>().notNull(),
  },
  (t) => [
    foreignKey({
      name: "reading_plan_log_article_fk",
      columns: [t.article_id, t.article_version],
      foreignColumns: [articleRecord.article_id, articleRecord.article_version],
    }),
    unique("reading_plan_log_reading_level").on(t.reading_id, t.level), // 불변식 3
    check("reading_plan_log_level", oneOf("level", LEVEL_IDS)),
    check("reading_plan_log_level_chosen_by", oneOf("level_chosen_by", LEVEL_CHOSEN_BY)),
  ],
);

// ── ReadingEvent — 독자가 무엇을 했나, 읽기 (§5)
export const readingEvent = pgTable(
  "reading_event",
  {
    event_id: uuid().primaryKey(),
    user_id: uuid().notNull(),
    session_id: uuid().notNull(),
    reading_id: uuid().notNull(),
    plan_id: uuid().notNull().references(() => readingPlanLog.plan_id),
    seq: integer().notNull(),
    occurred_at: timestamptz().notNull(),
    type: text().$type<ReadingEvent["type"]>().notNull(),
    slide_index: integer(),
    from_plan_id: uuid().references(() => readingPlanLog.plan_id),
  },
  (t) => [
    // (열람 · seq)는 유일하기만 하면 된다 — 빈 곳 · 뒤바뀐 도착 순서를 받는다 (D34). "0부터 1씩"은 읽을 때 본다 (src/check.ts)
    unique("reading_event_reading_seq").on(t.reading_id, t.seq),
    check("reading_event_type", oneOf("type", READING_EVENT_TYPES)),
    check("reading_event_seq_from_zero", sql.raw(`"seq" >= 0`)),
    // 모양 — slide_index 는 SLIDE_ENTERED · SLIDE_END_SHOWN 일 때만, from_plan_id 는 LEVEL_SWITCHED 일 때만 (§1 의 칸 주석).
    // 사건의 뜻(불변식 9 · 10 · 11 · 22 — 지금 plan · 지금 장 · 전환 다음 · 끝은 한 번)은 넣을 때 거부하지 않는다 (D34)
    check(
      "reading_event_slide_index_by_type",
      sql.raw(`("type" in ('SLIDE_ENTERED', 'SLIDE_END_SHOWN')) = ("slide_index" is not null) and ("slide_index" is null or "slide_index" >= 0)`),
    ),
    check("reading_event_from_plan_by_type", sql.raw(`("type" = 'LEVEL_SWITCHED') = ("from_plan_id" is not null)`)),
  ],
);

// ── Probe — 물음 한 판 (§6.1). 만든 뒤 고치지 않는다
// goal_ref 는 Goal 을 가리키는 값만 담는다 — 요점 · 사건의 테이블은 아직 없다 (불변식 23 은 여기서 못 지킨다)
export const probe = pgTable(
  "probe",
  {
    probe_id: uuid().notNull(),
    version: integer().notNull(),
    created_on: date({ mode: "string" }).notNull(),
    event_id: uuid(),
    goal_ref: uuid(),
    targets: jsonb().$type<ProbeTarget[]>().notNull(),
    prompt: text().notNull(),
    choices: jsonb().$type<string[]>(),
    correct_choice: integer(),
  },
  (t) => [
    primaryKey({ columns: [t.probe_id, t.version] }),
    check("probe_version_from_one", sql.raw(`"version" >= 1`)),
  ],
);

// ── ProbeExposure — 물음을 보여줬다 (§6.3)
export const probeExposure = pgTable(
  "probe_exposure",
  {
    exposure_id: uuid().primaryKey(),
    user_id: uuid().notNull(),
    session_id: uuid().notNull(),
    probe_id: uuid().notNull(),
    probe_version: integer().notNull(),
    probe_type: text().$type<ProbeType>().notNull(),
    position: text().$type<Position>().notNull(),
    plan_id: uuid().references(() => readingPlanLog.plan_id),
    shown_at_loc: jsonb().$type<SlideLoc>(),
    shown_at: timestamptz().notNull(),
  },
  (t) => [
    foreignKey({
      name: "probe_exposure_probe_fk", // 불변식 12 — 있는 판
      columns: [t.probe_id, t.probe_version],
      foreignColumns: [probe.probe_id, probe.version],
    }),
    check("probe_exposure_probe_type", oneOf("probe_type", PROBE_TYPES)),
    check("probe_exposure_position", oneOf("position", POSITIONS)),
  ],
);

// ── ProbeResponse — 독자가 답했다 (§6.3 · §7.4)
export const probeResponse = pgTable(
  "probe_response",
  {
    interaction_id: uuid().primaryKey(),
    exposure_id: uuid().notNull().references(() => probeExposure.exposure_id),
    user_id: uuid().notNull(),
    responded_at: timestamptz().notNull(),
    response: text().notNull(),
    is_correct: boolean(),
  },
  (t) => [unique("probe_response_one_per_exposure").on(t.exposure_id)], // 불변식 13
);

// ── KnowledgeEvidence — 독자가 무엇을 했나, 개념에 대해 (§7). 값을 매기는 칸이 없다
// concept_id 는 값만 담는다 — 개념 라이브러리의 테이블은 아직 없다 (불변식 18 은 여기서 못 지킨다)
export const knowledgeEvidence = pgTable(
  "knowledge_evidence",
  {
    event_id: uuid().primaryKey(),
    user_id: uuid().notNull(),
    concept_id: uuid().notNull(),
    content_version: integer().notNull(),
    timestamp: timestamptz().notNull(),
    evidence_type: text().$type<KnowledgeEvidence["evidence_type"]>().notNull(),
    position: text().$type<Position>(),
    interaction_id: uuid().notNull(),
    probe_id: uuid(),
    article_id: uuid(),
    article_version: integer(),
    content_block_id: jsonb().$type<SlideLoc>(),
    exposure_context: jsonb().$type<ExposureContext>().notNull(),
    model_version: text(),
  },
  (t) => [
    foreignKey({
      name: "knowledge_evidence_article_fk",
      columns: [t.article_id, t.article_version],
      foreignColumns: [articleRecord.article_id, articleRecord.article_version],
    }),
    uniqueIndex("knowledge_evidence_one_per_target") // 불변식 16 — 응답마다 target 마다 많아야 하나
      .on(t.interaction_id, t.concept_id)
      .where(sql.raw(`"evidence_type" = 'PROBE_RESPONSE'`)),
    check("knowledge_evidence_evidence_type", oneOf("evidence_type", EVIDENCE_TYPES)),
    check("knowledge_evidence_position", sql.raw(`"position" is null or ${inList("position", POSITIONS)}`)),
    check("knowledge_evidence_article_pair", sql.raw(`("article_id" is null) = ("article_version" is null)`)),
    // 불변식 15 · 17 — PROBE_RESPONSE 면 probe_id · position 이 있고, SELF_REPORT_KNOWN 이면 probe_id 가 없다
    check(
      "knowledge_evidence_probe_by_type",
      sql.raw(`("evidence_type" = 'PROBE_RESPONSE' and "probe_id" is not null and "position" is not null) or ("evidence_type" = 'SELF_REPORT_KNOWN' and "probe_id" is null)`),
    ),
  ],
);

// ── 누가 어느 user_id 인가 — 원장과 떨어진 schema (OBSERVATION §3 · D30 · D31)
// 원장 테이블은 이 표를 가리키지 않는다 (FK 없음): 원장에는 사람을 알아볼 값이 없고, 이 표에 없는 user_id 의 줄은 독자 기록으로 세지 않을 뿐이다.
// 무엇을 더 담을지는 D31 (OPEN) — 자리만 만들었다. 이 표는 원장이 아니다 (고칠 수 있다)
export const identity = pgSchema("identity");
export const reader = identity.table("reader", {
  user_id: uuid().primaryKey(),
  label: text().notNull(), // 사람을 알아볼 수 없는 부호 ("R-07"). 이름 · 연락처를 담지 않는다 — 누가 R-07 인지는 저장소 · 데이터베이스 밖에 (D34)
  created_at: timestamptz().notNull().default(sql`now()`),
});

/** 계약 타입 이름 → 테이블 */
export const LEDGER_TABLES = {
  ReadingPlanLog: readingPlanLog,
  ReadingEvent: readingEvent,
  KnowledgeEvidence: knowledgeEvidence,
  Probe: probe,
  ProbeExposure: probeExposure,
  ProbeResponse: probeResponse,
} as const;
