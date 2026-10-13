// 실제 Postgres 에 마이그레이션을 적용한다.   pnpm --filter @claro/web migrate
// 어느 데이터베이스인지는 apps/web/.env 의 DATABASE_MIGRATE_URL (없으면 DATABASE_URL) 이 정한다 — 값은 출력하지 않는다. 어느 서버의 어느 데이터베이스인지만 낸다
import { migrateDatabase } from "../src/server/db";

const url = process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL;
if (url) {
  const u = new URL(url);
  console.log(`대상 — ${u.hostname}:${u.port || 5432}${u.pathname}`);
}
console.log(await migrateDatabase());
process.exit(0);
