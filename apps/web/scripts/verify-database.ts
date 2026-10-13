// 올린 뒤 확인 — packages/db/SUPABASE.md §4 를 그대로 돌린다.   pnpm --filter @claro/web deploy:verify   (.env.deploy 의 데이터베이스)
// 읽기만 한다. 하나("원장은 덧붙이기만")는 고쳐 보려다 거부당하는 것을 본다 — 거부되지 않으면 되돌린다 (거래 안에서).
// 접속 값은 출력하지 않는다
import { sql } from "drizzle-orm";
import { db } from "../src/server/db";
import { goldenKey } from "../src/server/golden";

const d = await db();
const rows = async <T>(q: ReturnType<typeof sql>): Promise<T[]> => {
  const r = (await d.execute(q)) as unknown as T[] | { rows: T[] };
  return Array.isArray(r) ? r : r.rows;
};
let failed = 0;
const say = (ok: boolean, what: string, detail = "") => (ok || failed++, console.log(`${ok ? "OK  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`));

const TABLES = ["identity.consent", "identity.reader", "public.article_record", "public.knowledge_evidence", "public.probe", "public.probe_exposure", "public.probe_response", "public.reading_event", "public.reading_plan_log"];
const tables = await rows<{ name: string; rls: boolean }>(sql`
  select n.nspname || '.' || c.relname as name, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind = 'r' and n.nspname in ('public', 'identity') order by 1`);
say(JSON.stringify(tables.map((t) => t.name)) === JSON.stringify(TABLES), "테이블 9 (원장 6 · article_record · identity.reader · identity.consent) — 그 밖의 테이블이 없다", tables.map((t) => t.name).join(" "));
say(tables.every((t) => t.rls), "RLS 가 전부 켜져 있다", tables.filter((t) => !t.rls).map((t) => t.name).join(" "));
const policies = await rows<{ roles: string }>(sql`select array_to_string(roles, ',') as roles from pg_policies where schemaname in ('public', 'identity')`);
say(policies.length === 17 && policies.every((p) => p.roles === "claro_api"), "정책은 API 전용 역할(claro_api)의 읽기 · 넣기 17개뿐이다 — 화면 키로는 한 줄도 못 읽고 못 쓴다", `${policies.length}개`);
const [api] = await rows<{ rolsuper: boolean; rolcreaterole: boolean; rolbypassrls: boolean; writes: number }>(sql`
  select rolsuper, rolcreaterole, rolbypassrls,
         (select count(*)::int from information_schema.role_table_grants g where g.grantee = 'claro_api' and g.privilege_type not in ('SELECT', 'INSERT')) as writes
    from pg_roles where rolname = 'claro_api'`);
say(!!api && !api.rolsuper && !api.rolcreaterole && !api.rolbypassrls && api.writes === 0, "API 전용 역할은 넣기 · 읽기 권한만 갖는다 (고치기 · 지우기 · 비우기 0 · RLS 를 건너뛰지 못한다)");
const owned = await rows<{ n: number }>(sql`select count(*)::int as n from pg_class c join pg_roles r on r.oid = c.relowner where r.rolname = 'claro_api'`);
say(owned[0]!.n === 0, "API 전용 역할이 주인인 테이블이 없다 — 트리거를 끌 수 없다");
const roles = (await rows<{ rolname: string }>(sql`select rolname from pg_roles where rolname in ('anon', 'authenticated')`)).map((r) => r.rolname);
const grants = await rows<{ grantee: string; table_name: string; privilege_type: string }>(sql`
  select grantee, table_schema || '.' || table_name as table_name, privilege_type from information_schema.role_table_grants
   where grantee in ('anon', 'authenticated') and table_schema in ('public', 'identity')`);
say(grants.length === 0, `화면 키의 역할(anon · authenticated)에 남은 권한 0${roles.length ? "" : " (이 Postgres 에는 그 역할이 없다)"}`, grants.map((g) => `${g.grantee} ${g.table_name} ${g.privilege_type}`).join(" · "));
const [usage] = await rows<{ n: number }>(sql`
  select count(*)::int as n from pg_roles r where r.rolname in ('anon', 'authenticated') and has_schema_privilege(r.rolname, 'identity', 'usage')`);
say(usage!.n === 0, "schema identity 를 화면 키의 역할이 쓰지 못한다");
const [mig] = await rows<{ n: number }>(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
say(mig!.n === 9, "마이그레이션 9개가 적용됐다 (0000 ~ 0008)", `${mig!.n}개`);
const triggers = await rows<{ t: string; n: number }>(sql`
  select event_object_table as t, count(distinct trigger_name)::int as n from information_schema.triggers where trigger_schema = 'public' group by 1 order by 1`);
say(triggers.length === 7, "원장 테이블 7개에 트리거가 있다 (덧붙이기만 · 넣을 때의 검사)", triggers.map((t) => `${t.t} ${t.n}`).join(" · "));

// 원장은 덧붙이기만 한다 — 줄이 있든 없든 문장 단위 트리거(truncate)가 거부해야 한다. 거부되지 않으면 되돌린다
let appendOnly = "거부되지 않았다";
try {
  await d.transaction(async (tx) => {
    await tx.execute(sql`truncate public.reading_event cascade`);
    tx.rollback();
  });
} catch (e) {
  let err = e as { message?: string; cause?: unknown };
  while (err.cause && !/LEDGER_APPEND_ONLY/.test(err.message ?? "")) err = err.cause as typeof err;
  appendOnly = /LEDGER_APPEND_ONLY/.test(err.message ?? "") ? "" : `다른 까닭: ${(err.message ?? "").slice(0, 80)}`;
}
say(appendOnly === "", "원장 비우기(truncate)가 LEDGER_APPEND_ONLY 로 거부된다", appendOnly);

const key = goldenKey();
const [article] = await rows<{ n: number }>(sql`select count(*)::int as n from public.article_record where article_id = ${key.article_id} and article_version = ${key.article_version}`);
const [probes] = await rows<{ n: number }>(sql`select count(*)::int as n from public.probe`);
console.log(`      물음 ${probes!.n}판 ${probes!.n ? "" : "(deploy:probes)"}`);
console.log(`      골든 판 ${article!.n ? "있다" : "아직 없다 (deploy:seed)"} · 독자 ${(await rows<{ label: string }>(sql`select label from identity.reader order by 1`)).map((r) => r.label).join(" ") || "없다 (deploy:reader R-00)"}`);
const [evt] = await rows<{ n: number }>(sql`select count(*)::int as n from pg_event_trigger`);
console.log(`      이벤트 트리거 ${evt!.n}개 (Supabase 의 "automatic RLS" 가 여기 보인다)`);
console.log(failed ? `\n${failed}개 실패` : "\n전부 통과");
process.exit(failed ? 1 : 0);
