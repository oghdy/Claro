// **데이터베이스 접속은 이 파일 한 곳이다.** 서버(Route Handlers)도 스크립트(scripts/)도 여기서만 연다.
//   DATABASE_URL 이 있으면      → 실제 Postgres (Supabase · 이 컴퓨터의 Postgres). 드라이버는 postgres.js
//   없고 CLARO_PGLITE_DIR 이 있으면 → PGlite — 프로세스 안의 Postgres (개발 · 테스트 · `pnpm phone`). 접속 값이 없다. 열 때 마이그레이션을 스스로 돌린다
//   둘 다 없으면                 → 열지 않는다. 배포된 서버가 접속 값 없이 조용히 임시 폴더에 쓰는 일이 없게
// 실제 Postgres 의 마이그레이션은 여기서 스스로 돌지 않는다 — `pnpm --filter @claro/web migrate` 로 따로 돌린다 (아래 migrateDatabase · packages/db/SUPABASE.md §1).
// 접속 값은 환경 변수에서만 읽는다. 값을 로그에 쓰지 않는다 — 오류를 낼 때도.
//
// PGlite 는 **한 프로세스만** 같은 폴더를 연다. 서버가 켜져 있는 동안 스크립트(seed · reader)를 같은 폴더에 돌리지 않는다. 실제 Postgres 는 그런 제약이 없다.
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Db } from "@claro/db";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// 실행 위치는 apps/web 이다 (lib/load.ts 와 같은 가정). 마이그레이션은 스크립트와 PGlite 만 읽는다 — 배포된 서버는 읽지 않는다
const MIGRATIONS = path.join(process.cwd(), "../../packages/db/migrations");

/**
 * prepare: false — Supabase 의 거래 방식 풀러(6543)는 준비된 문장을 못 쓴다. 어느 접속에서든 같은 길로 간다.
 * max — 서버리스에서는 인스턴스마다 접속이 생긴다. 작게 둔다 (풀러가 뒤에서 모은다)
 */
const connect = (url: string, max: number) => postgres(url, { prepare: false, max, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} });

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return drizzle(connect(url, 3));
  const dir = process.env.CLARO_PGLITE_DIR;
  if (!dir) throw new Error("데이터베이스가 정해지지 않았다 — DATABASE_URL (실제 Postgres) 이나 CLARO_PGLITE_DIR (PGlite 폴더) 가 있어야 한다");
  // 개발 · 테스트에서만 쓰는 길이다 — 쓸 때만 싣는다. 폴더는 실행할 때 정해진다 (빌드가 따라가며 묶지 않게)
  const [{ PGlite }, lite, liteMigrator] = await Promise.all([
    import("@electric-sql/pglite"), import("drizzle-orm/pglite"), import("drizzle-orm/pglite/migrator"),
  ]);
  const at = dir === "memory" ? null : path.resolve(/* turbopackIgnore: true */ dir);
  if (at) mkdirSync(path.dirname(at), { recursive: true });
  const db = lite.drizzle(at ? new PGlite(at) : new PGlite());
  await liteMigrator.migrate(db, { migrationsFolder: MIGRATIONS });
  return db;
}

// Next 는 경로마다 모듈을 따로 묶는다 — 접속 하나를 프로세스 전체가 나눠 쓰게 globalThis 에 둔다
const held = globalThis as { __claroDb?: Promise<Db> };

export function db(): Promise<Db> {
  return (held.__claroDb ??= open().catch((e) => {
    held.__claroDb = undefined; // 다음 요청이 다시 열어 본다
    throw e;
  }));
}

/**
 * 실제 Postgres 에 마이그레이션을 전부 적용한다 (저널의 순서대로 · 이미 적용한 것은 건너뛴다). scripts/migrate.ts 가 부른다.
 * DATABASE_MIGRATE_URL 이 있으면 그것으로 (직접 연결 · 세션 방식 풀러 — 거래 방식 풀러로는 돌리지 않는다), 없으면 DATABASE_URL 로.
 */
export async function migrateDatabase(): Promise<string> {
  const url = process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_MIGRATE_URL 도 DATABASE_URL 도 없다");
  const sql = connect(url, 1);
  try {
    await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS });
    const [row] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    return `적용된 마이그레이션 ${row!.n}개`;
  } finally {
    await sql.end();
  }
}
