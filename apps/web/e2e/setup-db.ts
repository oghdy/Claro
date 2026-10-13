// 테스트용 데이터베이스를 새로 만든다 — 골든 한 판 + 테스트의 독자들. 서버를 켜기 전에 돈다 (playwright.config.ts · e2e/record-own-server.spec.ts).
//   PGlite            폴더는 CLARO_PGLITE_DIR (.data/test…). 지우고 새로 만든다
//   실제 Postgres     DATABASE_URL 의 데이터베이스 (이름이 claro_test… 여야 한다). 없으면 만들고, 안을 비우고, 마이그레이션을 전부 적용한다
// 테스트의 원장은 관찰이 아니다. **이름이 테스트용이 아니면 아무것도 지우지 않는다**
import { rmSync } from "node:fs";
import { reader } from "@claro/db";
import postgres from "postgres";
import { db, migrateDatabase } from "../src/server/db";
import { seedGolden } from "../src/server/golden";
import { READERS } from "./readers";

const url = process.env.DATABASE_URL;
if (url) {
  const name = new URL(url).pathname.slice(1);
  if (!/^claro_test(_[a-z0-9]+)?$/.test(name)) throw new Error(`데이터베이스 이름이 claro_test… 가 아니다 (${name}) — 테스트용만 비운다`);
  const admin = postgres(new URL("/postgres", url).href, { max: 1, onnotice: () => {} });
  if (!(await admin`select 1 from pg_database where datname = ${name}`).length) await admin.unsafe(`create database ${name}`);
  await admin.end();
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema if exists public cascade; drop schema if exists identity cascade; drop schema if exists drizzle cascade; create schema public");
  await sql.end();
  await migrateDatabase();
} else {
  const dir = process.env.CLARO_PGLITE_DIR;
  if (!dir || !/^\.data\/test/.test(dir)) throw new Error("CLARO_PGLITE_DIR 이 .data/test… 가 아니다 — 테스트용 폴더만 지운다");
  rmSync(dir, { recursive: true, force: true });
}
const d = await db();
await seedGolden(d);
await d.insert(reader).values(Object.values(READERS).map((user_id, i) => ({ user_id, label: `T-${String(i + 1).padStart(2, "0")}` })));
process.exit(0);
