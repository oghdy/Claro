import { DATA_MODEL_TYPES, OBSERVATION_TYPES, READER_LEDGERS, type FieldDesc } from "@claro/contract";
import { getTableColumns, getTableName } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import { LEDGER_TABLES, articleRecord, reader } from "../src";
import { freshDb } from "./harness";

// 계약 타입 ↔ 테이블. 세 곳을 댄다: 계약의 칸 목록(문서와는 packages/contract 의 테스트가 댄다) · Drizzle 스키마 · 마이그레이션을 적용한 실제 데이터베이스.
const TABLES: [string, PgTable, Record<string, FieldDesc>][] = [
  ["ArticleRecord", articleRecord, DATA_MODEL_TYPES.ArticleRecord],
  ...READER_LEDGERS.map((k): [string, PgTable, Record<string, FieldDesc>] => [k, LEDGER_TABLES[k], OBSERVATION_TYPES[k]]),
];

/** 계약의 타입 식 → Postgres 타입. 여기 없는 식이 나오면 실패한다 — 새 모양은 어디에 담을지 정하고 더한다 */
function sqlType(type: string, where: string): string {
  const t = type.replace(/ \| null$/, "");
  if (where === "Probe.created_on") return "date"; // 계약은 "string // 날짜"
  if (where === "ArticleRecord.package" || where === "ArticleRecord.authoring") return "json"; // 통째로, 넣은 글자 그대로
  if (t === "UUID" || t === "GoalRef") return "uuid";
  if (t === "integer") return "integer";
  if (t === "Timestamp") return "timestamp with time zone";
  if (t === "boolean") return "boolean";
  if (t === "string" || t === "LevelId" || t === "Position" || t === "ProbeType" || /^"/.test(t)) return "text";
  if (/\[\]$/.test(t) || t === "SlideLoc" || t === "ExposureContext") return "jsonb";
  throw new Error(`${where}: 계약의 타입 식 "${type}" 을 어느 Postgres 타입에 담는지 정해지지 않았다`);
}

let t: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  t = await freshDb();
});

const dbColumns = async (schema: string, table: string) =>
  (
    await t.client.query<{ column_name: string; data_type: string; is_nullable: string }>(
      "select column_name, data_type, is_nullable from information_schema.columns where table_schema = $1 and table_name = $2 order by ordinal_position",
      [schema, table],
    )
  ).rows;

describe.each(TABLES)("%s", (kind, table, fields) => {
  it("Drizzle 스키마의 칸 = 계약의 칸 (이름 · 순서 · null 여부). 더한 것도 뺀 것도 바꾼 이름도 없다", () => {
    const cols = getTableColumns(table);
    expect(Object.keys(cols)).toEqual(Object.keys(fields));
    for (const [k, c] of Object.entries(cols)) {
      expect(c.name, `${kind}.${k} 의 칸 이름`).toBe(k);
      expect(!c.notNull, `${kind}.${k} 가 null 을 받는가`).toBe(fields[k]!.nullable);
      expect(c.hasDefault, `${kind}.${k} — 원장의 칸에는 기본값이 없다. 쓰는 쪽이 전부 적는다`).toBe(false);
    }
  });

  it("실제 데이터베이스의 칸 = 계약의 칸 (이름 · 순서 · Postgres 타입 · null 여부)", async () => {
    const cols = await dbColumns("public", getTableName(table));
    expect(cols.map((c) => c.column_name)).toEqual(Object.keys(fields));
    for (const c of cols) {
      const f = fields[c.column_name]!;
      expect(c.data_type, `${kind}.${c.column_name}`).toBe(sqlType(f.type, `${kind}.${c.column_name}`));
      expect(c.is_nullable === "YES", `${kind}.${c.column_name} 가 null 을 받는가`).toBe(f.nullable);
    }
  });
});

describe("테이블 전체", () => {
  it("public 에는 원장 여섯 + 기사 한 판뿐이다 — 지식 상태 · 가중치 · 사실 · 개념 · 교정 기록의 테이블이 없다", async () => {
    const r = await t.client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    );
    expect(r.rows.map((x) => x.table_name)).toEqual(TABLES.map(([, tb]) => getTableName(tb)).sort());
    const views = await t.client.query("select 1 from information_schema.views where table_schema in ('public', 'identity')");
    expect(views.rows).toHaveLength(0);
  });

  it("누가 어느 user_id 인지는 원장과 다른 schema 에 — 칸은 user_id · label · created_at 뿐 (D31 OPEN)", async () => {
    expect((await dbColumns("identity", "reader")).map((c) => c.column_name)).toEqual(["user_id", "label", "created_at"]);
    expect(Object.keys(getTableColumns(reader))).toEqual(["user_id", "label", "created_at"]);
  });

  it("원장은 대응표를 가리키지 않는다 — identity 로 가는 FK 가 없다", async () => {
    const r = await t.client.query(
      `select 1 from information_schema.constraint_column_usage u join information_schema.table_constraints c using (constraint_schema, constraint_name)
       where c.constraint_type = 'FOREIGN KEY' and u.table_schema = 'identity' and c.table_schema <> 'identity'`,
    );
    expect(r.rows).toHaveLength(0);
    // identity 안에서는 가리킨다 — 동의(identity.consent)는 대응표의 독자를 가리킨다. 둘 다 원장이 아니다
    const inside = await t.client.query<{ table_name: string }>(
      "select table_name from information_schema.table_constraints where constraint_type = 'FOREIGN KEY' and table_schema = 'identity'",
    );
    expect(inside.rows.map((x) => x.table_name)).toEqual(["consent"]);
  });

  it("원장 어디에도 사람을 알아볼 칸 · 값을 매기는 칸 · 시험 표시 칸이 없다 (불변식 2 · §7.1 — verify-observation 과 같은 낱말)", async () => {
    const PERSONAL = /(?:^|_)(name|email|phone|device|ip|addr|address|agent|account|location)(?:$|_)/i;
    const VALUATION = /(?:^|_)(weight|score|confidence|mastery|strength|threshold|level_estimate|known|state)(?:$|_)/i;
    const TEST_FLAG = /(?:^|_)(test|env|environment|mode|debug|sandbox|real|synthetic)(?:$|_)/i;
    const r = await t.client.query<{ table_name: string; column_name: string }>(
      "select table_name, column_name from information_schema.columns where table_schema = 'public'",
    );
    expect(r.rows.length).toBeGreaterThan(60);
    const bad = r.rows.filter((c) => PERSONAL.test(c.column_name) || VALUATION.test(c.column_name) || TEST_FLAG.test(c.column_name));
    expect(bad).toEqual([]);
  });

  it("테이블마다 고치기 · 지우기 · 비우기를 막는 트리거와 넣을 때의 검사가 있다", async () => {
    const r = await t.client.query<{ event_object_table: string; n: number }>(
      `select event_object_table, count(distinct event_manipulation)::int as n from information_schema.triggers
       where trigger_schema = 'public' and event_manipulation in ('INSERT', 'UPDATE', 'DELETE') group by 1 order by 1`,
    );
    expect(r.rows).toEqual(TABLES.map(([, tb]) => ({ event_object_table: getTableName(tb), n: 3 })).sort((a, b) => a.event_object_table.localeCompare(b.event_object_table)));
    const tr = await t.client.query<{ n: number }>(
      "select count(*)::int as n from pg_trigger g join pg_class c on c.oid = g.tgrelid where not g.tgisinternal and g.tgname like '%_no_truncate' and (g.tgtype & 32) <> 0",
    );
    expect(tr.rows[0]!.n).toBe(TABLES.length);
  });

  it("모든 테이블에 RLS 가 켜져 있고 정책은 API 전용 역할의 것뿐이다 — 그 역할과 주인 말고는 못 읽고 못 쓴다", async () => {
    const r = await t.client.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where c.relkind = 'r' and n.nspname in ('public', 'identity')`,
    );
    expect(r.rows).toHaveLength(TABLES.length + 2); // + identity.reader · identity.consent
    expect(r.rows.filter((x) => !x.relrowsecurity)).toEqual([]);
    // 정책은 API 전용 역할(claro_api)에게만 있다 — 읽기 · 넣기. 다른 역할(화면 키의 anon · authenticated 포함)에게 준 정책은 없다
    const policies = await t.client.query<{ tablename: string; cmd: string; roles: string }>(
      "select tablename, cmd, array_to_string(roles, ',') as roles from pg_policies where schemaname in ('public', 'identity') order by 1, 2",
    );
    expect(policies.rows.every((p) => p.roles === "claro_api")).toBe(true);
    expect(policies.rows.map((p) => `${p.tablename} ${p.cmd}`)).toEqual([
      "article_record INSERT", "article_record SELECT", "consent INSERT", "consent SELECT",
      ...["knowledge_evidence", "probe", "probe_exposure", "probe_response"].flatMap((x) => [`${x} INSERT`, `${x} SELECT`]),
      "reader SELECT",
      ...["reading_event", "reading_plan_log"].flatMap((x) => [`${x} INSERT`, `${x} SELECT`]),
    ]);
  });
});
