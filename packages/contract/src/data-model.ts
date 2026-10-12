// docs/contract/DATA_MODEL.md §1 가운데 **ArticleRecord 와 그것이 품는 모양, GoalRef 만** 코드로 옮긴 것 (B-0.4a).
// Fact · Source · DerivedClaim · Goal · Bridge · Event · Storyline 은 옮기지 않았다 — 쓰는 쪽(파이프라인)이 생길 때.
// 원본은 그 문서다. 문서와 어긋나면 test/contract-docs.test.ts 가 실패한다.
import { opt, req, type TypeDesc } from "./describe";
import type { ArticlePackage, FactRef, UUID } from "./types";

/** ISO 8601, 아는 만큼만: "2026" · "2026-02" · "2026-09-16" · "2026-09-16T14:00-04:00" */
export type TimePoint = string;
/** Storyline.storyline_id (D27) */
export type StorylineId = UUID;
/** Goal.goal_id — 패키지에는 나오지 않는다. 물음(OBSERVATION Probe)이 이것으로 가리킨다 (D33) */
export type GoalRef = UUID;

export interface StorylinePin {
  storyline_id: StorylineId;
  version: number;
}

export interface TextLocator {
  level: string;
  path: string;
  fragment: string;
}

export interface DerivedInput {
  key: string;
  what: string;
  value: TimePoint;
  fact: FactRef | null;
}

export interface Formula {
  op: string;
  from: string | null;
  to: string | null;
  of: string | null;
  offset: number | null;
}

export interface TimeExpression {
  at: TextLocator;
  class: "DERIVED" | "VOLATILE";
  facts: FactRef[];
  value_at_authoring: number | null;
  check: "==" | ">" | null;
  formula: Formula | null;
  inputs: DerivedInput[];
}

export interface ArticleAuthoring {
  time_expressions: TimeExpression[];
  storylines: StorylinePin[];
  notes: string[];
}

/** 발행 한 번 = 하나. 통째로 불변 (§11). (article_id · article_version) 은 전체에서 유일 */
export interface ArticleRecord {
  article_id: UUID;
  article_version: number;
  package: ArticlePackage;
  authoring: ArticleAuthoring;
}

export const DATA_MODEL_TYPES = {
  ArticleRecord: {
    article_id: req("UUID"),
    article_version: req("integer"),
    package: req("ArticlePackage"),
    authoring: req("ArticleAuthoring"),
  } satisfies TypeDesc<ArticleRecord>,
  ArticleAuthoring: {
    time_expressions: req("TimeExpression[]"),
    storylines: req("StorylinePin[]"),
    notes: req("string[]"),
  } satisfies TypeDesc<ArticleAuthoring>,
  StorylinePin: { storyline_id: req("StorylineId"), version: req("integer") } satisfies TypeDesc<StorylinePin>,
  TimeExpression: {
    at: req("TextLocator"),
    class: req('"DERIVED" | "VOLATILE"'),
    facts: req("FactRef[]"),
    value_at_authoring: opt("number"),
    check: opt('"==" | ">"'),
    formula: opt("Formula"),
    inputs: req("DerivedInput[]"),
  } satisfies TypeDesc<TimeExpression>,
  TextLocator: { level: req("string"), path: req("string"), fragment: req("string") } satisfies TypeDesc<TextLocator>,
  DerivedInput: {
    key: req("string"),
    what: req("string"),
    value: req("TimePoint"),
    fact: opt("FactRef"),
  } satisfies TypeDesc<DerivedInput>,
  Formula: {
    op: req("string"),
    from: opt("string"),
    to: opt("string"),
    of: opt("string"),
    offset: opt("integer"),
  } satisfies TypeDesc<Formula>,
} as const;
