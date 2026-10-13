// 테스트용 데이터베이스를 새로 만든다 — 골든 한 판 + 테스트의 독자들. 서버를 켜기 전에 돈다 (playwright.config.ts · e2e/record-own-server.spec.ts).
//   PGlite            폴더는 CLARO_PGLITE_DIR (.data/test…). 지우고 새로 만든다
//   실제 Postgres     DATABASE_URL 의 데이터베이스 (이름이 claro_test… 여야 한다). 없으면 만들고, 안을 비우고, 마이그레이션을 전부 적용한다
// 테스트의 원장은 관찰이 아니다. **이름이 테스트용이 아니면 아무것도 지우지 않는다**
import { rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { consent, probe, reader } from "@claro/db";
import postgres from "postgres";
import { db, migrateDatabase } from "../src/server/db";
import { seedGolden } from "../src/server/golden";
import { PROBES, PROBE_LABELS } from "../src/study/probes";
import { CONSENTED, READERS, TEST_PROBES } from "./readers";

// 실제 Postgres 면 여기서는 주인으로 붙는다 (서버는 claro_api 로 붙는다 — e2e/database.ts)
if (process.env.CLARO_TEST_OWNER_URL) process.env.DATABASE_URL = process.env.CLARO_TEST_OWNER_URL;
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
  const login = postgres(url, { max: 1, onnotice: () => {} });
  await login.unsafe("alter role claro_api login password 'claro_test'"); // 테스트용 값이다. 이 Mac 의 Postgres 에서만
  await login.end();
} else {
  const dir = process.env.CLARO_PGLITE_DIR;
  if (!dir || !/^\.data\/test/.test(dir)) throw new Error("CLARO_PGLITE_DIR 이 .data/test… 가 아니다 — 테스트용 폴더만 지운다");
  rmSync(dir, { recursive: true, force: true });
}
const d = await db();
await seedGolden(d);
await d.insert(reader).values(Object.values(READERS).map((user_id, i) => ({ user_id, label: `T-${String(i + 1).padStart(2, "0")}` })));
await d.insert(consent).values(CONSENTED.map((user_id) => ({ consent_id: randomUUID(), user_id, notice_version: 1, consented_at: new Date().toISOString() })));
// 물음 — F-3 의 넷 (src/study/probes.ts) + 테스트용 둘 (target 이 둘)
const C2 = PROBES.P3.targets[0];
const C1 = { concept_id: "247d3e88-b62f-4811-9315-cf48de7e560e", version: 1 }; // C-0001
const two = { ...PROBES.P3, goal_ref: null, prompt: "시험 — target 둘", choices: ["가", "나"], correct_choice: 0 };
await d.insert(probe).values([
  ...PROBE_LABELS.map((l) => ({ ...PROBES[l], targets: [...PROBES[l].targets], choices: PROBES[l].choices ? [...PROBES[l].choices!] : null })),
  { ...two, probe_id: TEST_PROBES.TWO, targets: [C2, C1] },
  { ...two, probe_id: TEST_PROBES.BAD, targets: [C2, { ...C2, version: 99 }] },
]);
process.exit(0);
