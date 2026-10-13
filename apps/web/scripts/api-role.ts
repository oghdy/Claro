// 배포된 서버가 쓸 접속 값을 만든다 — API 전용 역할(claro_api)에 새 비밀번호를 걸고, 그 역할의 접속 문자열을 파일에 쓴다.
//   pnpm --filter @claro/web deploy:role        (.env.deploy 의 주인 접속으로 돌린다)
// 그 역할은 넣기 · 읽기만 한다 — 고치기 · 지우기 · 트리거 끄기를 못 한다 (packages/db/migrations/0006). 역할 자체는 마이그레이션이 만든다.
// **비밀번호와 접속 문자열은 화면에 내지 않는다.** apps/web/.env.vercel 에만 쓴다 (.gitignore 의 .env.*) — 도윤이 그 파일을 열어 Vercel 의 환경 변수 칸에 옮긴다.
// 다시 돌리면 비밀번호가 바뀐다 (옛 값은 그 순간부터 못 쓴다) — Vercel 의 값도 다시 넣어야 한다
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { db } from "../src/server/db";

const ROLE = "claro_api";
const OUT = ".env.vercel";
const owner = new URL(process.env.DATABASE_URL ?? "");
const password = randomBytes(24).toString("hex"); // 글자 · 숫자뿐이라 SQL · 주소에 그대로 넣어도 된다
await (await db()).execute(sql.raw(`alter role ${ROLE} login password '${password}'`));

// 풀러를 지나면 사용자 이름이 "역할.프로젝트" 다 (Supabase). 배포된 서버는 거래 방식 풀러(6543)로 붙는다
const api = new URL(owner.href);
const [, project] = decodeURIComponent(owner.username).split(".");
api.username = project ? `${ROLE}.${project}` : ROLE;
api.password = password;
if (/pooler\.supabase\.com$/.test(owner.hostname)) api.port = "6543";
writeFileSync(OUT, `DATABASE_URL=${api.href}\n`, { mode: 0o600 });

// 그 값으로 실제로 붙어 본다 — 읽기는 되고, 고치기 · 트리거 끄기는 안 돼야 한다
const as = postgres(api.href, { prepare: false, max: 1, connect_timeout: 15, onnotice: () => {} });
const denied = async (q: string) => as.unsafe(q).then(() => false, (e: { code?: string }) => e.code === "42501");
try {
  const [who] = await as`select current_user as u, (select count(*)::int from public.article_record) as articles`;
  const checks: [string, boolean][] = [
    [`${ROLE} 로 붙는다 (${api.hostname}:${api.port || 5432}) · 원장을 읽는다`, who!.u === ROLE],
    ["고치기는 권한이 없다", await denied("update public.reading_event set seq = seq")],
    ["지우기는 권한이 없다", await denied("delete from public.reading_event")],
    ["트리거를 끌 수 없다", await denied("alter table public.reading_event disable trigger all")],
    ["대응표에 쓸 수 없다", await denied("update identity.reader set label = label")],
  ];
  for (const [what, ok] of checks) console.log(`${ok ? "OK  " : "FAIL"}  ${what}`);
  console.log(`\n접속 값을 apps/web/${OUT} 에 썼다 (화면에는 내지 않는다). 그 파일의 DATABASE_URL= 뒤의 값을 Vercel 의 환경 변수에 넣는다`);
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
} catch (e) {
  console.log(`FAIL  ${ROLE} 로 붙지 못했다 — ${String((e as Error).message).replace(/postgres(ql)?:\/\/\S+/g, "<가림>").slice(0, 120)}`);
  process.exit(1);
}
