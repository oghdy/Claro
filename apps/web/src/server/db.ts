// **데이터베이스 접속은 이 파일 한 곳이다.** 서버(Route Handlers · 페이지)도 스크립트(scripts/)도 여기서만 연다.
// 지금은 PGlite — 프로세스 안의 Postgres 다 (개발 · 테스트. D1 의 "0.4b 는 외부 DB 없이"). 접속 값 · 비밀 값이 없다.
// Supabase 로 바꿀 때 고칠 곳은 open() 하나다: PGlite 대신 Postgres 드라이버로 열고 DATABASE_URL 을 읽는다 (packages/db/SUPABASE.md §3).
// 그때 마이그레이션은 여기서 돌리지 않는다 — 따로, 직접 연결로 돌린다 (같은 문서 §1). 이 이상의 추상화는 두지 않았다.
//
// PGlite 는 **한 프로세스만** 같은 폴더를 연다. 서버가 켜져 있는 동안 스크립트(seed · reader)를 같은 폴더에 돌리지 않는다.
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Db } from "@claro/db";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

// 실행 위치는 apps/web 이다 (lib/load.ts 와 같은 가정)
const MIGRATIONS = path.join(process.cwd(), "../../packages/db/migrations");

/** 원장을 둘 폴더. 용도마다 따로 둔다 (.data/dev · .data/test · .data/phone) — 전부 .gitignore. "memory" 면 프로세스가 끝날 때 사라진다 */
const dataDir = () => process.env.CLARO_PGLITE_DIR ?? ".data/dev";

async function open(): Promise<Db> {
  const dir = dataDir();
  // 폴더는 실행할 때 정해진다 — 빌드가 따라가며 묶지 않게 한다 (개발 · 테스트에서만 쓰는 길이다)
  const at = dir === "memory" ? null : path.resolve(/* turbopackIgnore: true */ dir);
  if (at) mkdirSync(path.dirname(at), { recursive: true });
  const client = at ? new PGlite(at) : new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS });
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
