import {
  DECISIONS, EVIDENCE_TYPES, POSITIONS, PROBE_TYPES, READER_LEDGERS, READING_EVENT_TYPES,
  type KnowledgeEvidence, type Probe, type ProbeExposure, type ProbeResponse, type ReadingEvent, type ReadingPlanLog,
} from "@claro/contract";
import { asc, getTableName } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  LEDGER_TABLES, LedgerRejected, appendArticle, appendLedger, knowledgeEvidence, probe, probeExposure, probeResponse, reader,
  readingEvent, readingPlanLog, readingSummary,
} from "../src";
import { ORDER, attempt, freshDb, goldenRecord, insertLedger, insertRaw, trial, type Ledger, type PySummary, type Row, type Trial } from "./harness";

let t: Awaited<ReturnType<typeof freshDb>>;
let T: Trial;
beforeAll(async () => {
  t = await freshDb();
  await appendArticle(t.db, goldenRecord());
  T = trial();
});

/** 되돌리는 거래 안에서 원장을 넣고 본다 */
async function within<R>(L: Ledger, fn: () => Promise<R>): Promise<R> {
  await t.client.exec("begin");
  try {
    await insertLedger(t.client, L);
    return await fn();
  } finally {
    await t.client.exec("rollback");
  }
}

const asPython = (s: Awaited<ReturnType<typeof readingSummary>>): PySummary | null =>
  s && {
    completed: s.completed,
    completed_to_end: s.completed_to_end,
    stopped_at: s.stopped_at && [s.stopped_at.level, s.stopped_at.slide_index],
    stopped_end_shown: s.stopped_end_shown,
    furthest: s.furthest as Record<string, number>,
    switched_from: s.switched_from,
  };

describe("시험 원장 (verify-observation 의 가짜 독자 하나)", () => {
  it("그대로 들어간다 — plan 2 · 읽기 사건 22 · 물음 2 · 노출 3 · 응답 2 · 증거 3", async () => {
    const counts = await within(T.ledger, async () => {
      const out: Record<string, number> = {};
      for (const [, table] of ORDER) out[table] = (await t.client.query<{ n: number }>(`select count(*)::int as n from ${table}`)).rows[0]!.n;
      return out;
    });
    expect(counts).toEqual({ reading_plan_log: 2, probe: 2, reading_event: 22, probe_exposure: 3, probe_response: 2, knowledge_evidence: 3 });
  });

  it("계약 타입으로 넣고(appendLedger) 꺼내면 넣은 줄과 같다 — 시각 · null · 담긴 모양까지", async () => {
    await t.client.exec("begin");
    try {
      const L = T.ledger;
      for (const r of L.plans) await appendLedger(t.db, "ReadingPlanLog", r as unknown as ReadingPlanLog);
      for (const r of L.probes) await appendLedger(t.db, "Probe", r as unknown as Probe);
      for (const r of L.events) await appendLedger(t.db, "ReadingEvent", r as unknown as ReadingEvent);
      for (const r of L.exposures) await appendLedger(t.db, "ProbeExposure", r as unknown as ProbeExposure);
      for (const r of L.responses) await appendLedger(t.db, "ProbeResponse", r as unknown as ProbeResponse);
      for (const r of L.evidence) await appendLedger(t.db, "KnowledgeEvidence", r as unknown as KnowledgeEvidence);
      expect(await t.db.select().from(readingPlanLog).orderBy(asc(readingPlanLog.created_at))).toEqual(L.plans);
      expect(await t.db.select().from(readingEvent).orderBy(asc(readingEvent.seq))).toEqual(L.events);
      expect(await t.db.select().from(probe).orderBy(asc(probe.prompt))).toEqual(L.probes);
      expect(await t.db.select().from(probeExposure).orderBy(asc(probeExposure.shown_at))).toEqual(L.exposures);
      expect(await t.db.select().from(probeResponse).orderBy(asc(probeResponse.responded_at))).toEqual(L.responses);
      const evidence = await t.db.select().from(knowledgeEvidence);
      expect(evidence).toHaveLength(L.evidence.length);
      for (const row of L.evidence) expect(evidence).toContainEqual(row);
    } finally {
      await t.client.exec("rollback");
    }
  });
});

describe("완독 · 멈춘 장 · 끝이 나온 완독 — 원장에서 센다. 파이썬 검사의 값과 같다", () => {
  it("시험 열람: 입문 1~4장 → 숙련 끝까지 → 입문 4장으로 돌아와 닫음", async () => {
    const got = await within(T.ledger, () => readingSummary(t.db, T.ledger.plans[0]!.reading_id as string));
    expect(asPython(got)).toEqual(T.summary);
    expect(got).toEqual({
      completed: true,
      completed_to_end: true,
      stopped_at: { level: "basic", slide_index: 3 },
      stopped_end_shown: true,
      furthest: { basic: 3, advanced: 4 },
      switched_from: ["basic", "advanced"],
    });
  });

  it("파이썬 selftest 의 맞는 원장 셋 — 끝이 안 나온 것 · 숙련으로 바꾸고 끝난 것도 같은 값이다", async () => {
    const valid = T.cases.filter((c) => c.summary);
    expect(valid.map((c) => c.name.slice(0, 12))).toEqual(["끝이 나온 사건이 하나", "설명 장에 닿은 뒤인데", "입문 4장에서 숙련으로"]);
    for (const c of valid) {
      const got = await within(c.ledger, () => readingSummary(t.db, c.ledger.plans[0]!.reading_id as string));
      expect(asPython(got), c.name).toEqual(c.summary);
    }
    const noEnd = valid[0]!.summary!;
    expect([noEnd.completed, noEnd.completed_to_end, noEnd.stopped_end_shown]).toEqual([true, false, false]);
    const switched = valid[2]!.summary!;
    expect([switched.completed, switched.stopped_at, switched.switched_from]).toEqual([false, ["advanced", 0], ["basic"]]);
  });

  it("계산한 값을 담는 칸은 없다 — 사건이 없는 열람은 null", async () => {
    expect(await readingSummary(t.db, "00000000-0000-4000-8000-000000000000")).toBeNull();
    const cols = await t.client.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'public'");
    expect(cols.rows.filter((c) => /complet|stopped|furthest|dwell|duration/.test(c.column_name))).toEqual([]);
  });
});

// 파이썬 selftest 가 망가뜨린 원장 44개를 그대로 넣어 본다. 값 = 데이터베이스가 거부한 까닭. null = 데이터베이스는 받는다.
// 파이썬에 사본이 늘면 이 표와 어긋나 실패한다 — 그 불변식을 어디서 지키는지 정하고 적는다.
const DB_VERDICT: Record<string, string | null> = {
  "증거 줄에 값을 매기는 칸 (weight)": "LEDGER_FIELD",
  "plan 에 독자 이름 칸": "LEDGER_FIELD",
  "읽기 사건에 방향 칸": "LEDGER_FIELD",
  "패키지에 없는 레벨 (intermediate)": "PLAN_LEVEL",
  "한 열람에 같은 레벨 plan 둘": "PLAN_DUPLICATE",
  "정적 레벨인데 selected_blocks 를 채움": "PLAN_STATIC",
  "정적 레벨인데 reason 이 다름": "PLAN_STATIC",
  "숙련 plan 이 C-0002 를 FULL 로 적음 (패키지는 SKIP)": null, // 불변식 6 — 값이 패키지에서 계산한 것과 같은가. 데이터베이스가 안 본다
  "SKIP 인 개념을 목록에서 뺌": null, // 불변식 6 — 위와 같다
  "decision 값이 셋 밖 (PARTIAL)": "PLAN_DECISIONS",
  "바꿔서 연 레벨이 DEFAULT": "PLAN_DEFAULT",
  "한 열람의 plan 이 다른 판을 가리킴": "PLAN_ARTICLE", // 그 판(v2)이 없다. 있는 판이면 PLAN_READING — 아래에 따로
  "seq 가 건너뜀": "EVENT_SEQ",
  "레벨에 없는 장 (입문 10장)": "EVENT_SLIDE",
  "SLIDE_ENTERED 에 slide_index 가 없다": "EVENT_SLIDE",
  "전환 없이 다른 레벨의 사건": "EVENT_CURRENT_PLAN",
  "같은 레벨로 전환": "EVENT_SWITCH",
  "전환 바로 다음이 SLIDE_ENTERED 가 아니다": "EVENT_SWITCH",
  "CLOSED 뒤에 사건": "EVENT_CLOSED",
  "계약에 없는 사건 (SWIPED_UP)": "CHECK reading_event_slide_index_by_type",
  "불변식 22 — 지금 장이 아닌 장의 끝이 나왔다 (2장에 있는데 4장의 끝)": "EVENT_END",
  "불변식 22 — 같은 장의 끝이 두 번": "EVENT_END",
  "불변식 22 — 끝이 나온 장을 안 적음": "EVENT_END",
  "불변식 22 — 전환 직후(아직 어느 장에도 안 들어감)에 끝이 나왔다": "EVENT_SWITCH",
  '끝이 나온 사건이 하나도 없다 (화면이 안 냄) — 원장은 맞다. 계산이 "끝이 안 나왔다"를 말한다': null, // 맞는 원장
  "읽기 사건에 머문 시간 칸": "LEDGER_FIELD",
  "없는 물음 판을 가리키는 노출": "EXPOSURE_PROBE",
  "유형이 넷 밖 (QUIZ)": "CHECK probe_exposure_probe_type",
  "노출의 유형이 계획과 다르다": "EXPOSURE_PLAN",
  "보여주기 전에 답함": "RESPONSE_EXPOSURE",
  "노출 하나에 응답 둘": "RESPONSE_TWICE",
  "무응답 노출에서 증거 줄": "EVIDENCE_NO_RESPONSE",
  "응답을 지웠는데 증거 줄이 남음": "EVIDENCE_NO_RESPONSE",
  "target 둘인데 증거 줄 하나": null, // 불변식 16 의 "빠짐없이" — 줄은 하나씩 들어온다. 없는 줄은 넣는 순간에 볼 수 없다
  "요점 물음의 답에 증거 줄을 붙임 (target 0)": "EVIDENCE_TARGETS",
  "증거의 위치가 노출과 다름": "EVIDENCE_PROBE",
  "자기 보고인데 probe_id": "EVIDENCE_PROBE",
  "없는 문안 버전 (C-0002 v9)": null, // 불변식 18 — 개념 라이브러리의 테이블이 없다
  "MERGED 개념에 기록": null, // 불변식 18 — 위와 같다
  "leaf 가 아닌 것에 기록": null, // 불변식 18 — 위와 같다
  "증거의 판이 plan 과 다름": "EVIDENCE_CONTEXT",
  "plan 없이 기사 자리를 적음": "EVIDENCE_CONTEXT",
  "설명 장에 닿은 뒤인데 PRE 라고 적음": null, // 계약이 불변식으로 두지 않았다 (파이썬도 "빈틈")
  "입문 4장에서 숙련으로 바꾸고 끝 — 원장은 맞다": null, // 맞는 원장
};

describe("파이썬 selftest 의 망가뜨린 원장 — 데이터베이스가 거부하는가", () => {
  it("사본마다 데이터베이스의 판정이 표와 같다", async () => {
    const got: Record<string, string | null> = {};
    for (const c of T.cases) got[c.name] = await attempt(t.client, () => insertLedger(t.client, c.ledger));
    expect(got).toEqual(DB_VERDICT);
  });

  it("데이터베이스가 받는 것은: 파이썬도 통과시키는 셋 + 다른 곳에서 지켜야 하는 여섯 (불변식 6 · 16 · 18)", () => {
    const accepted = T.cases.filter((c) => DB_VERDICT[c.name] === null);
    expect(accepted.filter((c) => c.python_codes.length === 0)).toHaveLength(3);
    expect(accepted.filter((c) => c.python_codes.length > 0).map((c) => c.python_codes.join("+")).sort()).toEqual([
      "EVIDENCE_CONCEPT+EVIDENCE_TARGETS", "EVIDENCE_CONCEPT+EVIDENCE_TARGETS", "EVIDENCE_TARGETS", "EVIDENCE_VERSION", "PLAN_DECISIONS", "PLAN_DECISIONS",
    ]);
  });

  it("거부한 것 가운데 파이썬이 통과시키는 것은 없다 — 데이터베이스가 계약보다 엄하지 않다", () => {
    for (const c of T.cases) if (DB_VERDICT[c.name] !== null) expect(c.python_codes.length, c.name).toBeGreaterThan(0);
  });
});

describe("원장은 덧붙이기만 한다 — 데이터베이스가 막는다", () => {
  const tables = READER_LEDGERS.map((k) => getTableName(LEDGER_TABLES[k]));
  const tryAfterInsert = (q: string) => attempt(t.client, async () => {
    await insertLedger(t.client, T.ledger);
    await t.client.query(q);
  });

  it.each(tables)("%s — 고치기 거부", async (table) => {
    const col = { reading_plan_log: "level_chosen_by = 'READER'", reading_event: "slide_index = 0", probe: "prompt = '고침'",
      probe_exposure: "position = 'PRE'", probe_response: "is_correct = true", knowledge_evidence: "content_version = 1" }[table]!;
    expect(await tryAfterInsert(`update ${table} set ${col}`)).toBe("LEDGER_APPEND_ONLY");
  });
  it.each(tables)("%s — 지우기 거부", async (table) => {
    expect(await tryAfterInsert(`delete from ${table}`)).toBe("LEDGER_APPEND_ONLY");
  });
  it.each(tables)("%s — 비우기(truncate) 거부", async (table) => {
    expect(await tryAfterInsert(`truncate ${table} cascade`)).toBe("LEDGER_APPEND_ONLY");
  });
  it("값이 같아도 고치기는 거부한다 (아무것도 안 바꾸는 update)", async () => {
    expect(await tryAfterInsert("update reading_event set seq = seq")).toBe("LEDGER_APPEND_ONLY");
  });
  it("막힌 뒤에도 줄은 그대로다", async () => {
    await t.client.exec("begin");
    await insertLedger(t.client, T.ledger);
    await t.client.exec("savepoint s");
    await expect(t.client.query("delete from reading_event where seq > 3")).rejects.toThrow(/LEDGER_APPEND_ONLY/);
    await t.client.exec("rollback to savepoint s");
    const n = (await t.client.query<{ n: number }>("select count(*)::int as n from reading_event")).rows[0]!.n;
    await t.client.exec("rollback");
    expect(n).toBe(22);
  });
});

describe("망가뜨린 것 — 전부 거부", () => {
  const edit = (fn: (L: Ledger) => void): Ledger => {
    const L = structuredClone(T.ledger);
    fn(L);
    return L;
  };
  const verdict = (L: Ledger) => attempt(t.client, () => insertLedger(t.client, L));
  const nowhere = "0d0e0000-0000-4000-8000-000000000000";

  it("없는 판을 가리키는 plan (없는 article_id)", async () => {
    expect(await verdict(edit((L) => L.plans.forEach((p) => (p.article_id = nowhere))))).toBe("PLAN_ARTICLE");
  });
  it("없는 판을 가리키는 plan (있는 기사의 없는 판 v7)", async () => {
    expect(await verdict(edit((L) => L.plans.forEach((p) => (p.article_version = 7))))).toBe("PLAN_ARTICLE");
  });
  it("plan → 판은 트리거 말고 FK 로도 묶여 있다", async () => {
    const fk = await t.client.query<{ conname: string }>("select conname from pg_constraint where contype = 'f' and conrelid = 'reading_plan_log'::regclass");
    expect(fk.rows.map((r) => r.conname)).toEqual(["reading_plan_log_article_fk"]);
  });
  it("한 열람의 plan 이 다른 (있는) 판을 가리킴 → PLAN_READING", async () => {
    await t.client.exec("begin");
    try {
      await appendArticle(t.db, { ...goldenRecord(), article_version: 2 });
      await insertRaw(t.client, "reading_plan_log", T.ledger.plans[0]!);
      await expect(insertRaw(t.client, "reading_plan_log", { ...T.ledger.plans[1]!, article_version: 2 })).rejects.toThrow(/PLAN_READING/);
    } finally {
      await t.client.exec("rollback");
    }
  });
  it("계약에 없는 칸 — 테이블마다 (SQL 로 직접 넣어도 칸이 없다)", async () => {
    for (const [key] of ORDER)
      expect(await verdict(edit((L) => (L[key][0]!.note = "x"))), key).toBe("LEDGER_FIELD");
  });
  it("계약에 없는 칸 — 담긴 모양 안 (block_decisions · probe_plan · targets · exposure_context · SlideLoc)", async () => {
    const cases: ((L: Ledger) => void)[] = [
      (L) => ((L.plans[0]!.block_decisions as Row[])[0]!.weight = 2),
      (L) => (L.plans[0]!.probe_plan = [{ probe_id: L.probes[0]!.probe_id, probe_version: 1, probe_type: "AUDIT", position: "POST", after_slide: 3 }]),
      (L) => ((L.probes[0]!.targets as Row[])[0]!.strength = 0.8),
      (L) => ((L.evidence[0]!.exposure_context as Row).device = "x"),
      (L) => (L.evidence[2]!.content_block_id = { slide_index: 2, block_index: null, span: 1 }),
      (L) => (L.exposures[0]!.shown_at_loc = { slide_index: 2, block_index: null, place: "after" }),
    ];
    for (const [i, c] of cases.entries()) expect(await verdict(edit(c)), `${i}`).toBe("LEDGER_FIELD");
  });
  it("담긴 모양이 틀림 — 칸이 빠졌거나 타입이 다르다", async () => {
    const cases: ((L: Ledger) => void)[] = [
      (L) => delete (L.plans[0]!.block_decisions as Row[])[0]!.reason,
      (L) => ((L.plans[0]!.block_decisions as Row[])[0]!.version = "4"),
      (L) => ((L.plans[0]!.block_decisions as Row[])[0]!.concept_id = "C-0002"),
      (L) => (L.plans[0]!.block_decisions = {}),
      (L) => ((L.evidence[0]!.exposure_context as Row).session_id = null),
      (L) => (L.evidence[2]!.content_block_id = { slide_index: 2.5, block_index: null }),
      (L) => (L.probes[0]!.choices = ["가", 2]),
    ];
    for (const [i, c] of cases.entries()) expect(await verdict(edit(c)), `${i}`).toBe("LEDGER_SHAPE");
  });
  it("ORM 은 모르는 칸을 조용히 버린다 — 그래서 쓰는 길(appendLedger)이 먼저 거부한다", async () => {
    const row = { ...T.ledger.events[0]!, dwell_ms: 900 } as unknown as ReadingEvent;
    await expect(appendLedger(t.db, "ReadingEvent", row)).rejects.toMatchObject({ name: "LedgerRejected", code: "LEDGER_FIELD" });
    const { from_plan_id: _f, ...missing } = T.ledger.events[0]!;
    await expect(appendLedger(t.db, "ReadingEvent", missing as unknown as ReadingEvent)).rejects.toBeInstanceOf(LedgerRejected);
    expect((await t.client.query("select 1 from reading_event")).rows).toHaveLength(0);
  });
  it("물음의 판은 1부터 1씩 · 판을 다시 쓸 수 없다", async () => {
    const p = T.ledger.probes[0]!;
    expect(await verdict(edit((L) => L.probes.push({ ...p, version: 3 })))).toBe("PROBE_VERSION");
    expect(await verdict(edit((L) => L.probes.push({ ...p, prompt: "고친 글" })))).toBe("PROBE_VERSION");
    expect(await verdict(edit((L) => L.probes.push({ ...p, version: 2, prompt: "고친 글" })))).toBeNull();
    expect(await verdict(edit((L) => (L.probes[0]!.correct_choice = 2)))).toBe("PROBE_CHOICE");
  });
  it("같은 seq 를 두 번 · 다른 열람의 plan · 첫 사건이 1부터", async () => {
    expect(await verdict(edit((L) => L.events.splice(5, 0, { ...L.events[4]!, event_id: nowhere })))).toBe("EVENT_SEQ");
    expect(await verdict(edit((L) => (L.events[3]!.reading_id = nowhere)))).toBe("EVENT_PLAN");
    expect(await verdict(edit((L) => L.events.forEach((e) => (e.seq = (e.seq as number) + 1))))).toBe("EVENT_SEQ");
  });
});

describe("닫힌 값 — 계약의 목록에 있는 값은 전부 받고, 밖의 값은 거부한다 (SQL 에 적힌 목록이 계약과 같다)", () => {
  const base = () => structuredClone(T.ledger);
  const ok = async (L: Ledger) => expect(await attempt(t.client, () => insertLedger(t.client, L))).toBeNull();
  const no = async (L: Ledger) => expect(await attempt(t.client, () => insertLedger(t.client, L))).not.toBeNull();

  it("BlockDecision.decision · ProbePlanItem.probe_type · position (jsonb 안 — 트리거가 본다)", async () => {
    for (const d of DECISIONS) {
      const L = base();
      (L.plans[0]!.block_decisions as Row[])[0]!.decision = d;
      await ok(L);
    }
    for (const pt of PROBE_TYPES)
      for (const pos of POSITIONS) {
        const L = base();
        L.plans[1]!.probe_plan = [{ probe_id: L.probes[1]!.probe_id, probe_version: 1, probe_type: pt, position: pos }];
        await ok(L);
      }
    const L = base();
    L.plans[1]!.probe_plan = [{ probe_id: L.probes[1]!.probe_id, probe_version: 1, probe_type: "QUIZ", position: "POST" }];
    await no(L);
    const M = base();
    M.plans[1]!.probe_plan = [{ probe_id: M.probes[1]!.probe_id, probe_version: 1, probe_type: "AUDIT", position: "MID" }];
    await no(M);
  });

  it("ProbeExposure.probe_type · position · ReadingEvent.type · evidence_type (칸 — CHECK 가 본다)", async () => {
    for (const pt of PROBE_TYPES)
      for (const pos of POSITIONS) {
        const L = base();
        Object.assign(L.exposures[2]!, { probe_type: pt, position: pos });
        await ok(L);
      }
    const L = base();
    L.exposures[2]!.position = "MID";
    await no(L);
    const checks = await t.client.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname in ('reading_event_type', 'knowledge_evidence_evidence_type')",
    );
    const listed = checks.rows.flatMap((r) => [...r.def.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1])).sort();
    expect(listed).toEqual([...READING_EVENT_TYPES, ...EVIDENCE_TYPES].sort());
  });
});

describe("누가 어느 user_id 인가 — 원장 밖", () => {
  it("대응표에 없는 user_id 의 줄도 원장은 받는다 (독자 기록으로 세지 않을 뿐 — OBSERVATION §3). 대응표는 원장이 아니라 고칠 수 있다", async () => {
    await t.client.exec("begin");
    try {
      await insertLedger(t.client, T.ledger);
      expect(await t.db.select().from(reader)).toEqual([]);
      const user_id = T.ledger.plans[0]!.user_id as string;
      await t.db.insert(reader).values({ user_id, label: "시험 독자 1" });
      await t.client.query("update identity.reader set label = '시험 독자 하나'");
      const [row] = await t.db.select().from(reader);
      expect(row).toMatchObject({ user_id, label: "시험 독자 하나" });
      expect(row!.created_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/);
    } finally {
      await t.client.exec("rollback");
    }
  });
});
