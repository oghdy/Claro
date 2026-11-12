// docs/contract/DATA_MODEL.md §1 가운데 **ArticleRecord 와 그것이 품는 모양, GoalRef** (B-0.4a) 와
// **권리 — SourceRegistry · DocumentRights · DocumentRightsBasis** (B-E2 · §4.4 · D70 — 파이프라인 rights.ts 가 이 모양으로 낸다) 만 코드로 옮긴 것.
// Fact · Source · DerivedClaim · Goal · Bridge · Event · Storyline 은 옮기지 않았다 — 쓰는 쪽(파이프라인)이 생길 때.
// 원본은 그 문서다. 문서와 어긋나면 test/contract-docs.test.ts 가 실패한다.
import { fieldProblems, isUUID, opt, req, union, type TypeDesc } from "./describe";
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

/** 발행처 하나의 권리 행 (확정 §5.1 · §4.4). `source` = Source.publisher. 근거가 직접 말하는 칸만 — 나머지는 null (불변식 30) */
export interface SourceRegistry {
  source: string;
  access_method: string;
  can_ingest: boolean | null;
  can_store: boolean | null;
  can_quote: boolean | null;
  can_transform: boolean | null;
  commercial_use: boolean | null;
  attribution_required: boolean | null;
  terms_url: string | null;
  last_reviewed_at: TimePoint | null;
  basis: string | null;
}

/** 문서 단위 권리가 말하는 표시 — 공공누리 제1유형만 (D53). 다른 표시는 행을 만들지 않는다 */
export const DOCUMENT_RIGHTS = ["KOGL_TYPE1"] as const;
export type DocumentRightsKind = (typeof DOCUMENT_RIGHTS)[number];
/** 문서 단위 행의 권리 칸 — SourceRegistry 의 같은 이름 칸과 같은 뜻. can_ingest 는 없다 (표시는 받아 연 뒤에 보인다 — 발행처 행이 말한다) */
export const RIGHTS_COLUMNS = ["can_store", "can_quote", "can_transform", "commercial_use", "attribution_required"] as const;
export type RightsColumn = (typeof RIGHTS_COLUMNS)[number];
/** 표시가 직접 말하는 칸 (D53 — 공공누리 제1유형 발행처 행과 같은 값) */
export const DOCUMENT_RIGHTS_GRANTS: Record<DocumentRightsKind, Record<RightsColumn, boolean>> = {
  KOGL_TYPE1: { can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true },
};

/** 같은 바이트를 열어 그 쪽의 그 그림을 보면 다시 확인된다 (실물: pipc PDF 셋 — E3-1b) */
export interface DocumentRightsBasis {
  /** 표시를 본 받은 바이트(파일)의 sha256 — 글의 해시가 아니다 (불변식 37) */
  bytes_sha256: string;
  page: number;
  pages: number;
  /** 파일 안에서 그 그림을 찾는 이름 — "Im5 객체 47 · 167×64 · DCTDecode" */
  image: string;
  image_sha256: string;
  /** 무엇을 봤나 — 그림의 모양 */
  seen: string;
}

/** 문서 하나의 권리 (§4.4 · D70). 그 문서에 한해 발행처 행보다 앞선다. Source 하나에 많아야 한 행 (불변식 35 · 36) */
export interface DocumentRights {
  source_id: UUID;
  rights: DocumentRightsKind;
  can_store: boolean | null;
  can_quote: boolean | null;
  can_transform: boolean | null;
  commercial_use: boolean | null;
  attribution_required: boolean | null;
  basis: DocumentRightsBasis;
  last_reviewed_at: TimePoint;
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
  SourceRegistry: {
    source: req("string"),
    access_method: req("string"),
    can_ingest: opt("boolean"),
    can_store: opt("boolean"),
    can_quote: opt("boolean"),
    can_transform: opt("boolean"),
    commercial_use: opt("boolean"),
    attribution_required: opt("boolean"),
    terms_url: opt("string"),
    last_reviewed_at: opt("TimePoint"),
    basis: opt("string"),
  } satisfies TypeDesc<SourceRegistry>,
  DocumentRights: {
    source_id: req("UUID"),
    rights: req(union(DOCUMENT_RIGHTS)),
    can_store: opt("boolean"),
    can_quote: opt("boolean"),
    can_transform: opt("boolean"),
    commercial_use: opt("boolean"),
    attribution_required: opt("boolean"),
    basis: req("DocumentRightsBasis"),
    last_reviewed_at: req("TimePoint"),
  } satisfies TypeDesc<DocumentRights>,
  DocumentRightsBasis: {
    bytes_sha256: req("string"),
    page: req("integer"),
    pages: req("integer"),
    image: req("string"),
    image_sha256: req("string"),
    seen: req("string"),
  } satisfies TypeDesc<DocumentRightsBasis>,
} as const;

// ── 권리 (B-E2 · DATA_MODEL §4.4 · 불변식 35 · 36) ─────────────────────────────────────────────
const HEX64 = /^[0-9a-f]{64}$/;
/** TimePoint — 아는 만큼만 (해 · 달 · 날 · 시각) */
const TIMEPOINT_RE = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
export const isTimePoint = (v: unknown): v is TimePoint => typeof v === "string" && TIMEPOINT_RE.test(v);

/**
 * 불변식 35 — 문서 단위 권리 한 행. 어긋난 곳마다 글 하나, 맞으면 [].
 * 칸이 전부 · 그것만 · `basis` 가 있고 칸이 다 찼다 (받은 바이트 · 그림 해시 = sha256 · 1 ≤ page ≤ pages · image · seen) ·
 * `rights` 가 말하는 칸이 그 값이다 (공공누리 제1유형 = 다섯 다 참 — D53). 어긋난 행은 아무것도 허락하지 않는다 (sourceRights)
 */
export function documentRightsProblems(row: unknown): string[] {
  const out = fieldProblems(DATA_MODEL_TYPES.DocumentRights, row);
  if (out[0] === "객체가 아니다") return out;
  const r = row as Record<string, unknown>;
  const grants = DOCUMENT_RIGHTS_GRANTS[r.rights as DocumentRightsKind];
  if (grants) for (const k of RIGHTS_COLUMNS) if (r[k] !== grants[k]) out.push(`"${k}" = ${JSON.stringify(r[k])} — ${String(r.rights)} 표시가 말하는 값은 ${grants[k]} (D53)`);
  if (!isTimePoint(r.last_reviewed_at)) out.push(`"last_reviewed_at" 이 TimePoint 가 아니다`);
  const b = r.basis;
  if (b === null || typeof b !== "object" || Array.isArray(b)) {
    out.push("basis 가 없다 — 무엇을 봤나 · 다시 확인할 값 (파일 · 쪽 · 그림 · 받은 바이트 해시 · 그림 해시)");
    return out;
  }
  out.push(...fieldProblems(DATA_MODEL_TYPES.DocumentRightsBasis, b).map((m) => `basis: ${m}`));
  const x = b as Record<string, unknown>;
  for (const k of ["bytes_sha256", "image_sha256"] as const) if (!HEX64.test(String(x[k]))) out.push(`basis.${k} 가 sha256 (소문자 16진 64자) 이 아니다`);
  if (!(Number.isInteger(x.page) && Number.isInteger(x.pages) && (x.page as number) >= 1 && (x.page as number) <= (x.pages as number))) out.push(`basis 쪽 ${String(x.page)} / ${String(x.pages)} — 1 ≤ page ≤ pages`);
  for (const k of ["image", "seen"] as const) if (typeof x[k] !== "string" || !(x[k] as string).trim()) out.push(`basis.${k} 가 비었다`);
  return out;
}

/** 불변식 35 — 저장소의 문서 단위 행 전부: 행마다 칸 · 있는 Source · Source 하나에 많아야 한 행 */
export function documentRightsTableProblems(rows: readonly unknown[], sourceIds: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const n = new Map<unknown, number>();
  for (const r of rows) {
    const sid = (r as { source_id?: unknown } | null)?.source_id;
    n.set(sid, (n.get(sid) ?? 0) + 1);
    for (const m of documentRightsProblems(r)) out.push(`${String(sid)}: ${m}`);
    if (!(typeof sid === "string" && sourceIds.has(sid))) out.push(`${String(sid)}: 없는 Source 를 가리킨다`);
  }
  for (const [sid, k] of n) if (k > 1) out.push(`${String(sid)}: 한 문서에 문서 단위 행이 ${k}개 — Source 하나에 많아야 한 행`);
  return out;
}

/** 그 문서의 권리 — 칸마다 값과, 무엇이 정했나 */
export type SourceRights = Record<RightsColumn | "can_ingest", boolean | null> & { by: "DOCUMENT" | "PUBLISHER" | null };

/**
 * 불변식 36 — 문서의 권리. 그 문서의 DocumentRights 행이 (불변식 35 를 지켜) 하나 있으면 칸마다 그 행의 값 (null 이면 발행처 행의 값),
 * 없으면 발행처 행 그대로 — **그 문서에 한해서만**. 같은 발행처의 다른 문서는 발행처 행만 본다. can_ingest 는 발행처 행
 */
export function sourceRights(
  source: { source_id: UUID; publisher: string },
  registry: readonly SourceRegistry[],
  documentRights: readonly DocumentRights[],
): SourceRights {
  const pub = registry.find((r) => r.source === source.publisher) ?? null;
  const mine = documentRights.filter((d) => d?.source_id === source.source_id);
  const doc = mine.length === 1 && isUUID(mine[0]!.source_id) && documentRightsProblems(mine[0]).length === 0 ? mine[0]! : null;
  const out = { can_ingest: pub?.can_ingest ?? null, by: doc ? "DOCUMENT" : pub ? "PUBLISHER" : null } as SourceRights;
  for (const k of RIGHTS_COLUMNS) out[k] = doc?.[k] ?? pub?.[k] ?? null;
  return out;
}
