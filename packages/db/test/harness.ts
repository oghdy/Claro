// 테스트용 데이터베이스 — 프로세스 안의 Postgres (PGlite). 외부 DB · 접속 값이 없다.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripAnnotations, type ArticleRecord } from "@claro/contract";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ledgerRejection, type Db } from "../src";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const path = (rel: string) => fileURLToPath(new URL(`../../../${rel}`, import.meta.url));
const readJson = (rel: string) => JSON.parse(readFileSync(path(rel), "utf-8"));

export const MIGRATIONS = fileURLToPath(new URL("../migrations", import.meta.url));

/** 테스트가 쓰는 접속 — 거래를 여러 호출에 걸쳐 쓴다 (begin … rollback). 그래서 접속은 하나다 */
export interface TestClient {
  query<T = Record<string, unknown>>(q: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(q: string): Promise<unknown>;
}

/**
 * 테스트용 데이터베이스. 기본은 프로세스 안의 Postgres (PGlite) — 외부 DB · 접속 값이 없다.
 * `CLARO_TEST_PG` (예: postgres://localhost:5432 — 데이터베이스 이름 없이)가 있으면 **실제 Postgres** 에서 돈다 (B-0.4c):
 * 테스트 파일마다 `claro_test_<n>` 데이터베이스를 쓴다 — 없으면 만들고, 안을 비우고, 마이그레이션을 전부 적용한다. 다른 데이터베이스는 건드리지 않는다
 */
export async function freshDb(): Promise<{ client: TestClient; db: Db }> {
  const base = process.env.CLARO_TEST_PG;
  if (!base) {
    const client = new PGlite();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return { client, db };
  }
  const name = `claro_test_${process.env.VITEST_POOL_ID ?? "0"}`;
  const admin = postgres(`${base}/postgres`, { max: 1, onnotice: () => {} });
  if (!(await admin`select 1 from pg_database where datname = ${name}`).length) await admin.unsafe(`create database ${name}`);
  await admin.end();
  const sql = postgres(`${base}/${name}`, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema if exists public cascade; drop schema if exists identity cascade; drop schema if exists drizzle cascade; create schema public");
  const db = drizzlePg(sql);
  await migratePg(db, { migrationsFolder: MIGRATIONS });
  const client: TestClient = {
    query: async (q, params = []) => ({ rows: (await sql.unsafe(q, params as never[])) as never }),
    exec: (q) => sql.unsafe(q),
  };
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
  /** 파이썬 derive_decisions 가 골든에서 낸 값 — 레벨 → concept_id → [decision, version] */
  decisions: Record<string, Record<string, [string, number]>>;
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

/** 파이썬 검사의 시험 원장(가짜 독자 하나)과 망가뜨린 사본. 판의 키와 개념의 키만 실제 것으로 바꾼다 — 원장이 실제 판 · 실제 개념을 가리키게 */
export function trial(): Trial {
  let out = execFileSync("python3", [path("scripts/export-trial-ledger.py")], { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  const { article_id, concept_ids } = JSON.parse(out) as { article_id: string; concept_ids: Record<string, string> };
  for (const [made, real] of Object.entries(concept_ids)) out = out.replaceAll(made, real);
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
export async function insertRaw(client: TestClient, table: string, row: Row): Promise<void> {
  const keys = Object.keys(row);
  const values = keys.map((k) => (row[k] !== null && typeof row[k] === "object" ? JSON.stringify(row[k]) : row[k]));
  await client.query(
    `insert into ${table} (${keys.map((k) => `"${k}"`).join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")})`,
    values,
  );
}

export async function insertLedger(client: TestClient, L: Ledger): Promise<void> {
  for (const [key, table] of ORDER) for (const row of L[key]) await insertRaw(client, table, row);
}

/** 거부한 까닭 — 트리거가 낸 CODE, 아니면 Postgres 의 제약 이름 (src 의 ledgerRejection). 거부가 아닌 실패면 그 오류의 글 */
export function reason(e: unknown): string {
  return ledgerRejection(e) ?? `실패 ${(e as Error)?.message}`;
}

/** 되돌리는 거래 안에서 해 본다. 거부되면 까닭을, 받으면 null 을 돌려준다 */
export async function attempt(client: TestClient, fn: () => Promise<void>): Promise<string | null> {
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
