// 테스트용 데이터베이스 — 프로세스 안의 Postgres (PGlite). 외부 DB · 접속 값이 없다.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripAnnotations, type ArticleRecord } from "@claro/contract";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const path = (rel: string) => fileURLToPath(new URL(`../../../${rel}`, import.meta.url));
const readJson = (rel: string) => JSON.parse(readFileSync(path(rel), "utf-8"));

export const MIGRATIONS = fileURLToPath(new URL("../migrations", import.meta.url));

export async function freshDb() {
  const client = new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return { client, db };
}

/** 골든 한 판 — 픽스처는 한 개체를 두 파일에 둔다 (DATA_MODEL §11). 읽는 쪽이 이어 붙인다 */
export function goldenRaw() {
  const record = readJson("fixtures/fomc-2026-09.record.json");
  return { record, package: readJson(`fixtures/${record._package}`) };
}

/** 발행물 모양 — `_` 주석을 뺀 ArticleRecord */
export function goldenRecord(): ArticleRecord {
  const { record, package: pkg } = goldenRaw();
  return stripAnnotations({
    article_id: record.article_id,
    article_version: record.article_version,
    package: pkg,
    authoring: record.authoring,
  });
}

export type Row = Record<string, unknown>;
export interface Ledger {
  plans: Row[];
  events: Row[];
  probes: Row[];
  exposures: Row[];
  responses: Row[];
  evidence: Row[];
}
export interface Trial {
  ledger: Ledger;
  summary: PySummary;
  cases: { name: string; python_codes: string[]; ledger: Ledger; summary: PySummary | null }[];
}
export interface PySummary {
  completed: boolean;
  completed_to_end: boolean;
  stopped_at: [string, number] | null;
  stopped_end_shown: boolean;
  furthest: Record<string, number>;
  switched_from: string[];
}

/** 파이썬 검사의 시험 원장(가짜 독자 하나)과 망가뜨린 사본. 판의 키만 골든의 것으로 바꾼다 — 원장이 실제 판을 가리키게 */
export function trial(): Trial {
  const out = execFileSync("python3", [path("scripts/export-trial-ledger.py")], { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  const { article_id } = JSON.parse(out) as { article_id: string };
  return JSON.parse(out.replaceAll(article_id, goldenRecord().article_id));
}

/** 넣는 순서 — 가리키는 것이 먼저 */
export const ORDER: [keyof Ledger, string][] = [
  ["plans", "reading_plan_log"],
  ["probes", "probe"],
  ["events", "reading_event"],
  ["exposures", "probe_exposure"],
  ["responses", "probe_response"],
  ["evidence", "knowledge_evidence"],
];

/** 줄이 가진 칸을 그대로 SQL 로 — ORM 을 거치지 않는다. 계약에 없는 칸을 데이터베이스가 어떻게 받는지 보려면 이렇게 넣어야 한다 */
export async function insertRaw(client: PGlite, table: string, row: Row): Promise<void> {
  const keys = Object.keys(row);
  const values = keys.map((k) => (row[k] !== null && typeof row[k] === "object" ? JSON.stringify(row[k]) : row[k]));
  await client.query(
    `insert into ${table} (${keys.map((k) => `"${k}"`).join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")})`,
    values,
  );
}

export async function insertLedger(client: PGlite, L: Ledger): Promise<void> {
  for (const [key, table] of ORDER) for (const row of L[key]) await insertRaw(client, table, row);
}

/** 거부한 까닭 — 트리거가 낸 CODE, 아니면 Postgres 의 제약 이름 */
export function reason(e: unknown): string {
  type PgError = { message?: string; code?: string; constraint?: string; column?: string; cause?: unknown };
  let err = e as PgError;
  while (err.cause && !err.code) err = err.cause as PgError; // Drizzle 은 Postgres 의 오류를 cause 에 싼다
  const m = /^([A-Z][A-Z_]+): /.exec(err.message ?? "");
  if (m) return m[1]!;
  if (err.code === "42703") return "LEDGER_FIELD"; // 없는 칸
  if (err.code === "23514") return `CHECK ${err.constraint}`;
  if (err.code === "23503") return `FK ${err.constraint}`;
  if (err.code === "23505") return `UNIQUE ${err.constraint}`;
  if (err.code === "23502") return `NOT_NULL ${err.column}`;
  return `${err.code} ${err.message}`;
}

/** 되돌리는 거래 안에서 해 본다. 거부되면 까닭을, 받으면 null 을 돌려준다 */
export async function attempt(client: PGlite, fn: () => Promise<void>): Promise<string | null> {
  await client.exec("begin");
  try {
    await fn();
    return null;
  } catch (e) {
    return reason(e);
  } finally {
    await client.exec("rollback");
  }
}
