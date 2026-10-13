// API 를 직접 부른다 (B-0.4b) — 화면이 망가졌을 때 서버가 무엇을 받고 무엇을 거부하나. 거부한 것은 원장에 없다 (서버 로그에만).
//   받는다: 빈 seq · 뒤바뀐 도착 순서 · 계약과 다른 사건 순서 · 같은 줄 두 번 (D34)
//   거부한다: 계약에 없는 칸 · 타입이 다른 값 · 없는 plan · 같은 (열람 · seq) 를 다른 사건이
//   기록하지 않는다: 대응표에 없는 user_id · user_id 없는 줄
import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { lines, readings } from "./ledger";
import { READERS, STRANGER } from "./readers";

const GOLDEN = { article_id: "6f4080a5-bada-412a-b870-bc5d16fe88b3", article_version: 1 };
const id = () => randomUUID(); // 테스트마다 · 돌릴 때마다 새 열람이다
const now = () => new Date().toISOString();

function reading(user_id: string = READERS.api) {
  const base = { user_id, session_id: id(), reading_id: id() };
  const plan = (level: string, by: string) => ({ plan_id: id(), ...base, ...GOLDEN, created_at: now(), level, level_chosen_by: by });
  const event = (plan_id: string, seq: number, type: string, slide_index: number | null, from_plan_id: string | null = null) => ({
    event_id: id(), ...base, plan_id, seq, occurred_at: now(), type, slide_index, from_plan_id,
  });
  return { ...base, plan, event };
}
const postPlan = async (request: APIRequestContext, plan: unknown) => (await request.post("/api/plans", { data: plan })).json();
const postEvents = async (request: APIRequestContext, events: unknown[]) =>
  ((await (await request.post("/api/events", { data: { events } })).json()).results as { status: string; code?: string }[]).map((r) => r.code ?? r.status);
const mine = async (request: APIRequestContext, reading_id: string, user_id: string = READERS.api) =>
  (await readings(request, user_id)).find((r) => r.reading_id === reading_id);

test("기사 한 판 — 패키지와 판의 키. 저작 데이터는 내려보내지 않는다", async ({ request }) => {
  const res = await request.get(`/api/articles/${GOLDEN.article_id}/1`);
  const body = await res.json();
  expect(Object.keys(body)).toEqual(["article_id", "article_version", "package"]);
  expect([body.article_id, body.article_version, body.package.levels.map((l: any) => l.id)]).toEqual([GOLDEN.article_id, 1, ["basic", "advanced"]]);
  expect(JSON.stringify(body)).not.toMatch(/"authoring"|"_[a-z_]+":/);
  for (const path of [`${GOLDEN.article_id}/2`, `${STRANGER}/1`, "x/1", `${GOLDEN.article_id}/x`]) expect((await request.get(`/api/articles/${path}`)).status(), path).toBe(404);
});

test("plan — block_decisions 는 서버가 계산한다. 화면이 보낸 값은 받지 않는다. 같은 plan 을 두 번 받으면 성공이다", async ({ request }) => {
  const R = reading();
  const plan = R.plan("advanced", "READER");
  const claimed = [{ concept_id: id(), version: 1, decision: "FULL", reason: "STATIC_LEVEL" }];
  expect(await postPlan(request, { ...plan, block_decisions: claimed })).toEqual({ status: "rejected", code: "LEDGER_FIELD" });
  expect(await mine(request, R.reading_id)).toBeUndefined();
  expect(await postPlan(request, plan)).toEqual({ status: "stored" });
  expect(await postPlan(request, plan)).toEqual({ status: "duplicate" });
  const stored = (await mine(request, R.reading_id))!;
  expect(stored.plans).toHaveLength(1);
  expect(stored.plans[0]!.block_decisions.map((d: any) => d.decision).sort()).toEqual(["REFRESHER", "SKIP", "SKIP", "SKIP"]);
  expect(stored.check.conforms).toBe(true); // 불변식 6 — 적힌 값이 패키지에서 계산한 값과 같다

  // 모양 · 참조가 틀린 plan
  expect((await postPlan(request, { ...R.plan("basic", "READER"), level: "intermediate" })).code).toBe("PLAN_LEVEL");
  expect((await postPlan(request, { ...R.plan("basic", "READER"), article_version: 9 })).code).toBe("PLAN_ARTICLE");
  expect((await postPlan(request, { ...R.plan("basic", "READER"), level_chosen_by: "SYSTEM" })).code).toBe("LEDGER_FIELD");
  expect((await postPlan(request, { ...R.plan("basic", "READER"), created_at: "어제" })).code).toBe("LEDGER_FIELD");
  expect((await postPlan(request, { ...R.plan("basic", "READER"), reader_name: "x" })).code).toBe("LEDGER_FIELD");
  expect((await postPlan(request, R.plan("advanced", "READER"))).code).toBe("PLAN_DUPLICATE"); // 같은 열람 · 같은 레벨에 다른 plan
  expect((await request.post("/api/plans", { data: Buffer.from("{"), headers: { "content-type": "application/json" } })).status()).toBe(400);
  expect((await mine(request, R.reading_id))!.plans).toHaveLength(1);
});

test("사건 — seq 를 건너뛴다 · 뒤바뀌어 온다 · 같은 사건이 두 번 온다 → 받는다", async ({ request }) => {
  const R = reading();
  const plan = R.plan("basic", "DEFAULT");
  await postPlan(request, plan);
  const e = [0, 1, 2, 3].map((i) => R.event(plan.plan_id, i, i % 2 ? "SLIDE_END_SHOWN" : "SLIDE_ENTERED", i >> 1));
  const late = R.event(plan.plan_id, 7, "SLIDE_ENTERED", 2); // 4 · 5 · 6 이 사라졌다
  expect(await postEvents(request, [e[0], e[1]])).toEqual(["stored", "stored"]);
  expect(await postEvents(request, [late])).toEqual(["stored"]); // 건너뛴 seq — 뒤따르는 사건을 버리지 않는다
  expect(await postEvents(request, [e[3], e[2]])).toEqual(["stored", "stored"]); // 뒤바뀐 도착 순서
  expect(await postEvents(request, [e[0], e[1], e[2], e[3], late])).toEqual(Array(5).fill("duplicate")); // 다시 보낸 묶음 — 성공
  const r = (await mine(request, R.reading_id))!;
  expect(r.events.map((x) => x.seq)).toEqual([0, 1, 2, 3, 7]);
  expect(lines(r)).toEqual(["ENTERED basic 0", "END basic 0", "ENTERED basic 1", "END basic 1", "ENTERED basic 2"]);
  expect(r.check).toMatchObject({ conforms: false, missing_seq: [4, 5, 6] });
  expect(r.check.issues.map((i) => i.code)).toEqual(["EVENT_SEQ"]);
  expect(r.summary.stopped_at).toEqual({ level: "basic", slide_index: 2 });
});

test("사건 — 계약과 다른 순서(뜻이 틀렸다)도 받는다. 읽을 때 어디가 어긋났는지 나온다", async ({ request }) => {
  const R = reading();
  const basic = R.plan("basic", "DEFAULT"), adv = R.plan("advanced", "READER");
  await postPlan(request, basic);
  await postPlan(request, adv);
  expect(await postEvents(request, [
    R.event(basic.plan_id, 0, "SLIDE_ENTERED", 0),
    R.event(basic.plan_id, 1, "SLIDE_END_SHOWN", 5), // 지금 장이 아닌 장의 끝 (불변식 22)
    R.event(basic.plan_id, 2, "SLIDE_END_SHOWN", 0),
    R.event(basic.plan_id, 3, "SLIDE_END_SHOWN", 0), // 같은 장의 끝이 두 번 (불변식 22)
    R.event(adv.plan_id, 4, "SLIDE_ENTERED", 1), // 전환 없이 다른 레벨 (불변식 9)
    R.event(basic.plan_id, 5, "SLIDE_ENTERED", 40), // 레벨에 없는 장 (불변식 9)
    R.event(adv.plan_id, 6, "LEVEL_SWITCHED", null, basic.plan_id),
    R.event(adv.plan_id, 7, "CLOSED", null), // 전환 바로 다음이 SLIDE_ENTERED 가 아니다 (불변식 10)
    R.event(adv.plan_id, 8, "SLIDE_ENTERED", 0), // CLOSED 뒤의 사건 (불변식 11)
  ])).toEqual(Array(9).fill("stored"));
  const r = (await mine(request, R.reading_id))!;
  expect(r.events).toHaveLength(9);
  expect(r.check.conforms).toBe(false);
  expect(r.check.issues.map((i) => `${i.seq} ${i.code}`)).toEqual([
    "1 EVENT_END", "3 EVENT_END", "4 EVENT_CURRENT_PLAN", "5 EVENT_SLIDE", "7 EVENT_SWITCH", "7 EVENT_CLOSED",
  ]);
});

test("사건 — 계약에 없는 칸 · 틀린 모양 · 없는 plan → 그 줄만 거부한다. 같은 묶음의 맞는 줄은 남는다", async ({ request }) => {
  const R = reading(), other = reading();
  const plan = R.plan("basic", "DEFAULT");
  await postPlan(request, plan);
  const good = R.event(plan.plan_id, 0, "SLIDE_ENTERED", 0);
  const { from_plan_id: _f, ...missing } = R.event(plan.plan_id, 9, "SLIDE_ENTERED", 1);
  expect(await postEvents(request, [
    { ...R.event(plan.plan_id, 1, "SLIDE_ENTERED", 1), dwell_ms: 900 }, // 머문 시간
    { ...R.event(plan.plan_id, 2, "SLIDE_ENTERED", 1), direction: "up" }, // 방향
    missing, // 칸이 빠졌다
    { ...R.event(plan.plan_id, 3, "SLIDE_ENTERED", 1), seq: "3" }, // 타입
    R.event(plan.plan_id, 4, "SWIPED_UP", 1), // 계약에 없는 사건
    R.event(plan.plan_id, 5, "SLIDE_ENTERED", null), // 모양 — 들어간 장이 없다
    R.event(plan.plan_id, 6, "LEVEL_SWITCHED", null, null), // 모양 — 떠난 plan 이 없다
    R.event(id(), 7, "SLIDE_ENTERED", 1), // 없는 plan
    other.event(plan.plan_id, 8, "SLIDE_ENTERED", 1), // 다른 열람 · 세션의 plan
    good,
    { ...R.event(plan.plan_id, 0, "SLIDE_ENTERED", 3) }, // 같은 (열람 · seq) 를 다른 사건이
    "글", null,
  ])).toEqual([
    "LEDGER_FIELD", "LEDGER_FIELD", "LEDGER_FIELD", "LEDGER_FIELD", "LEDGER_FIELD",
    "CHECK reading_event_slide_index_by_type", "CHECK reading_event_from_plan_by_type",
    "EVENT_PLAN", "EVENT_PLAN", "stored", "UNIQUE reading_event_reading_seq",
    "UNKNOWN_READER", "UNKNOWN_READER",
  ]);
  const r = (await mine(request, R.reading_id))!;
  expect(r.events.map((e) => e.event_id)).toEqual([good.event_id]);
  for (const bad of [{}, { events: "x" }, { events: [], more: 1 }, [good]]) expect((await request.post("/api/events", { data: bad })).status()).toBe(400);
});

test("대응표에 없는 user_id · user_id 없는 줄 → 기록하지 않는다 (원장 0줄)", async ({ request }) => {
  const S = reading(STRANGER);
  const plan = S.plan("basic", "DEFAULT");
  expect(await postPlan(request, plan)).toEqual({ status: "not_recorded", code: "UNKNOWN_READER" });
  expect(await postEvents(request, [S.event(plan.plan_id, 0, "SLIDE_ENTERED", 0)])).toEqual(["UNKNOWN_READER"]);
  const { user_id: _u, ...nobody } = reading().plan("basic", "DEFAULT");
  expect(await postPlan(request, nobody)).toEqual({ status: "not_recorded", code: "UNKNOWN_READER" });
  const { user_id: _v, ...anon } = reading().event(id(), 0, "SLIDE_ENTERED", 0);
  expect(await postEvents(request, [anon])).toEqual(["UNKNOWN_READER"]);
  expect(await readings(request, STRANGER)).toEqual([]);
  // 대응표에 있는 독자의 plan 에 다른 번호로 사건을 붙일 수 없다
  const R = reading();
  const mineP = R.plan("basic", "DEFAULT");
  await postPlan(request, mineP);
  expect(await postEvents(request, [{ ...R.event(mineP.plan_id, 0, "SLIDE_ENTERED", 0), user_id: STRANGER }])).toEqual(["UNKNOWN_READER"]);
  expect((await mine(request, R.reading_id))!.events).toEqual([]);
});

test("원장을 내어 주는 길(/api/peek)은 읽기만 한다 — 고치는 · 지우는 길이 API 에 없다", async ({ request }) => {
  for (const path of ["/api/peek", "/api/plans", "/api/events", `/api/articles/${GOLDEN.article_id}/1`])
    for (const method of ["put", "patch", "delete"] as const) expect((await request[method](path)).status(), `${method} ${path}`).toBe(405);
});
