// 테이블이 계약 타입에서 벗어나면 **컴파일이 실패한다** (`pnpm typecheck`).
// 테이블에서 읽은 줄의 타입(InferSelectModel)과 계약 타입이 서로 정확히 같아야 한다 — 칸이 하나 더 있거나, 빠졌거나, 타입 · null 여부가 다르면 걸린다.
// 실행 때의 검사(칸 이름 · 순서 · SQL 타입 · 실제 데이터베이스의 칸)는 test/contract-tables.test.ts 가 한다.
import type {
  ArticleRecord, KnowledgeEvidence, Probe, ProbeExposure, ProbeResponse, ReaderLedger, ReadingEvent, ReadingPlanLog,
} from "@claro/contract";
import type { InferSelectModel } from "drizzle-orm";
import type {
  LEDGER_TABLES, articleRecord, knowledgeEvidence, probe, probeExposure, probeResponse, readingEvent, readingPlanLog,
} from "./schema";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Same<Table, Contract> = Equal<{ [K in keyof Table]: Table[K] }, { [K in keyof Contract]: Contract[K] }>;
type Assert<T extends true> = T;

export type TableMatchesContract = [
  Assert<Same<InferSelectModel<typeof articleRecord>, ArticleRecord>>,
  Assert<Same<InferSelectModel<typeof readingPlanLog>, ReadingPlanLog>>,
  Assert<Same<InferSelectModel<typeof readingEvent>, ReadingEvent>>,
  Assert<Same<InferSelectModel<typeof knowledgeEvidence>, KnowledgeEvidence>>,
  Assert<Same<InferSelectModel<typeof probe>, Probe>>,
  Assert<Same<InferSelectModel<typeof probeExposure>, ProbeExposure>>,
  Assert<Same<InferSelectModel<typeof probeResponse>, ProbeResponse>>,
  // 독자 원장 타입마다 테이블이 정확히 하나
  Assert<Equal<keyof typeof LEDGER_TABLES, ReaderLedger>>,
];

/** 계약 타입 이름 → 그 줄의 타입 */
export interface LedgerRow {
  ReadingPlanLog: ReadingPlanLog;
  ReadingEvent: ReadingEvent;
  KnowledgeEvidence: KnowledgeEvidence;
  Probe: Probe;
  ProbeExposure: ProbeExposure;
  ProbeResponse: ProbeResponse;
}
