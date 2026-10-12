// 원장에 줄을 덧붙이는 길. **쓰는 쪽은 이것만 쓴다** — Drizzle 의 insert 는 모르는 칸을 조용히 버린다.
// 계약에 없는 칸을 가진 줄을 조용히 받으면 "거부"가 아니다 (OBSERVATION 불변식 1). 여기서 칸을 계약과 대고, 나머지 불변식은 데이터베이스가 본다.
import {
  DATA_MODEL_TYPES, OBSERVATION_TYPES, stripAnnotations, validateArticlePackage, type ArticleRecord, type ReaderLedger,
} from "@claro/contract";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { LedgerRow } from "./contract-check";
import { LEDGER_TABLES, articleRecord } from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export class LedgerRejected extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "LedgerRejected";
  }
}

function exactKeys(kind: string, row: object, fields: object): void {
  const want = Object.keys(fields);
  const got = Object.keys(row);
  const extra = got.filter((k) => !want.includes(k));
  const missing = want.filter((k) => !got.includes(k));
  if (extra.length) throw new LedgerRejected("LEDGER_FIELD", `${kind} 줄에 계약에 없는 칸 ${JSON.stringify(extra)} (불변식 1)`);
  if (missing.length) throw new LedgerRejected("LEDGER_FIELD", `${kind} 줄에 칸 ${JSON.stringify(missing)} 이 없다 — null 도 적는다`);
}

/** 독자 원장에 한 줄 덧붙인다. 계약의 칸을 전부, 그것만 가져야 한다 */
export async function appendLedger<K extends ReaderLedger>(db: Db, kind: K, row: LedgerRow[K]): Promise<void> {
  exactKeys(kind, row, OBSERVATION_TYPES[kind]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any — 테이블마다 줄 타입이 다르다. 같다는 것은 contract-check.ts 가 보인다
  await db.insert(LEDGER_TABLES[kind] as any).values(row as any);
}

/** 기사 한 판을 통째로 넣는다. 패키지는 계약 검증을 통과하고 `_` 주석이 없어야 한다 (발행물에는 없다 — ARTICLE_PACKAGE §6.2 · §9-10) */
export async function appendArticle(db: Db, record: ArticleRecord): Promise<void> {
  exactKeys("ArticleRecord", record, DATA_MODEL_TYPES.ArticleRecord);
  exactKeys("ArticleAuthoring", record.authoring, DATA_MODEL_TYPES.ArticleAuthoring);
  if (JSON.stringify(stripAnnotations(record)) !== JSON.stringify(record))
    throw new LedgerRejected("ARTICLE_ANNOTATION", "`_` 주석이 남아 있다 — 픽스처의 주석은 발행물에 없다");
  const r = validateArticlePackage(record.package);
  if (!r.ok) throw new LedgerRejected("ARTICLE_PACKAGE", r.errors.map((e) => `${e.code} ${e.path}`).join(" · "));
  await db.insert(articleRecord).values(record);
}
