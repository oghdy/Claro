// API 를 직접 부른다 (B-0.4b) — 화면이 망가졌을 때 서버가 무엇을 받고 무엇을 거부하나. 거부한 것은 원장에 없다 (서버 로그에만).
//   받는다: 빈 seq · 뒤바뀐 도착 순서 · 계약과 다른 사건 순서 · 같은 줄 두 번 (D34)
//   거부한다: 계약에 없는 칸 · 타입이 다른 값 · 없는 plan · 같은 (열람 · seq) 를 다른 사건이
//   기록하지 않는다: 대응표에 없는 user_id · user_id 없는 줄
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Probe } from "@claro/contract";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { golden } from "./golden";
import { lines, readings, study } from "./ledger";
import { READERS, STRANGER, TEST_PROBES } from "./readers";
import { probeProblems, type GoalRow } from "../src/server/probe-check";
import { PROBES } from "../src/study/probes";

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
  // 같은 열람 · 같은 레벨에 다른 plan (탭 복제) — 받는다. plan 이 거부되면 그 plan 의 사건이 전부 따라 거부된다 (D35). 읽을 때 PLAN_DUPLICATE
  expect(await postPlan(request, R.plan("advanced", "READER"))).toEqual({ status: "stored" });
  expect((await mine(request, R.reading_id))!.check.issues.map((i) => i.code)).toEqual(["PLAN_DUPLICATE"]);
  // 뜻이 틀린 plan (불변식 7 — 첫 plan 이 아닌데 DEFAULT) 도 받는다
  expect(await postPlan(request, R.plan("basic", "DEFAULT"))).toEqual({ status: "stored" });
  expect((await mine(request, R.reading_id))!.check.issues.map((i) => i.code)).toEqual(["PLAN_DUPLICATE", "PLAN_DEFAULT"]);
  expect((await request.post("/api/plans", { data: Buffer.from("{"), headers: { "content-type": "application/json" } })).status()).toBe(400);
  expect((await mine(request, R.reading_id))!.plans).toHaveLength(3);
});

test("화면이 보여주는 기사(빌드할 때 실은 것)와 데이터베이스의 판이 같은 글이다", async ({ request }) => {
  const strip = (o: any): any => (Array.isArray(o) ? o.map(strip) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, strip(v)])) : o);
  const inDb = (await (await request.get(`/api/articles/${GOLDEN.article_id}/1`)).json()).package;
  expect(JSON.stringify(inDb)).toBe(JSON.stringify(strip(golden())));
  // 화면의 판의 키 — 정적 페이지가 실은 것. 데이터베이스의 판과 같은 키다
  const html = await (await request.get("/")).text();
  expect(html).toContain(GOLDEN.article_id);
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

// ── 물음 쪽 (B-0.5 · D37) — 동의 · 물음을 보여줬다 · 답했다. 망가뜨린 것
const post = async (request: APIRequestContext, path: string, data: unknown) => (await request.post(path, { data })).json();
function asking(user_id: string, probe_id: string, position = "POST", probe_type = "COMPREHENSION") {
  const exposure = {
    exposure_id: id(), user_id, session_id: id(), probe_id, probe_version: 1, probe_type, position, plan_id: null, shown_at_loc: null,
    shown_at: new Date(Date.now() - 5000).toISOString(),
  };
  const answer = (response: string) => ({ interaction_id: id(), exposure_id: exposure.exposure_id, user_id, responded_at: now(), response });
  return { exposure, answer };
}

test("동의 전에는 아무것도 기록하지 않는다 — plan · 사건 · 노출 · 응답 전부. 동의하면 그때부터 받는다", async ({ request }) => {
  const R = reading(READERS.noconsent);
  const plan = R.plan("basic", "DEFAULT");
  const Q = asking(READERS.noconsent, PROBES.P2.probe_id);
  const NO = { status: "not_recorded", code: "NO_CONSENT" };
  expect(await postPlan(request, plan)).toEqual(NO);
  expect(await postEvents(request, [R.event(plan.plan_id, 0, "SLIDE_ENTERED", 0)])).toEqual(["NO_CONSENT"]);
  expect(await post(request, "/api/exposures", Q.exposure)).toEqual(NO);
  expect(await post(request, "/api/responses", Q.answer("잘 모르겠다"))).toEqual(NO);
  let s = await study(request, READERS.noconsent);
  expect([s.consents.length, s.readings.length, s.exposures.length, s.responses.length], "동의 전의 원장").toEqual([0, 0, 0, 0]);
  expect(await (await request.get(`/api/readers/${READERS.noconsent}`)).json()).toEqual({ known: true, consented: false, asked: [] });

  // 동의 — 모양이 틀리면 안 받는다. 대응표에 없는 번호의 동의도 안 받는다. 같은 누름을 다시 보내면 성공이고 한 줄이다
  const consent = { consent_id: id(), user_id: READERS.noconsent, notice_version: 1, consented_at: now() };
  expect((await post(request, "/api/consents", { ...consent, group: "claro" })).code, "무리를 적어 보낸다").toBe("CONSENT_SHAPE");
  expect((await post(request, "/api/consents", { ...consent, notice_version: 7 })).code, "없는 안내문의 판").toBe("CONSENT_SHAPE");
  expect(await post(request, "/api/consents", { ...consent, user_id: STRANGER })).toEqual({ status: "not_recorded", code: "UNKNOWN_READER" });
  expect(await post(request, "/api/consents", consent)).toEqual({ status: "stored" });
  expect(await post(request, "/api/consents", consent)).toEqual({ status: "duplicate" });
  expect(await postPlan(request, plan)).toEqual({ status: "stored" });
  expect(await post(request, "/api/exposures", Q.exposure)).toEqual({ status: "stored" });
  s = await study(request, READERS.noconsent);
  expect([s.consents.length, s.readings.length, s.exposures.length]).toEqual([1, 1, 1]);
  expect(await (await request.get(`/api/readers/${READERS.noconsent}`)).json()).toEqual({ known: true, consented: true, asked: [{ probe_id: PROBES.P2.probe_id, position: "POST" }] });
  expect(await (await request.get(`/api/readers/${STRANGER}`)).json()).toEqual({ known: false });
  expect(await (await request.get("/api/readers/R-07")).json()).toEqual({ known: false });
});

test("답 — 맞았는지는 서버가 가린다 (고르는 물음만). 같은 응답을 두 번 받으면 성공 · 노출 하나에 다른 응답은 거부", async ({ request }) => {
  const U = READERS.api;
  const before = (await study(request, U)).responses.length;
  // P3 — 개념을 겨눈다: 응답 하나에 증거 한 줄
  const Q = asking(U, PROBES.P3.probe_id);
  await post(request, "/api/exposures", Q.exposure);
  const a = Q.answer("아니다");
  expect((await post(request, "/api/responses", { ...a, is_correct: true })).code, "화면이 맞았다고 적어 보낸다").toBe("LEDGER_FIELD");
  expect((await post(request, "/api/responses", { ...a, response: "글쎄요" })).code, "보기에 없는 답").toBe("RESPONSE_CHOICE");
  expect((await post(request, "/api/responses", { ...a, exposure_id: id() })).code, "없는 노출").toBe("RESPONSE_EXPOSURE");
  expect((await post(request, "/api/responses", { ...a, responded_at: "2020-01-01T00:00:00Z" })).code, "보여주기 전에 답함").toBe("RESPONSE_EXPOSURE");
  expect((await study(request, U)).responses.length, "거부한 것은 원장에 없다").toBe(before);
  expect(await post(request, "/api/responses", a)).toEqual({ status: "stored" });
  expect(await post(request, "/api/responses", a), "같은 응답을 다시 보냈다").toEqual({ status: "duplicate" });
  expect((await post(request, "/api/responses", Q.answer("그렇다"))).code, "같은 노출에 다른 응답 (답을 고쳤다)").toBe("RESPONSE_TWICE");
  let s = await study(request, U);
  const mine = (iid: string) => s.evidence.filter((e) => e.interaction_id === iid);
  expect(s.responses.filter((r) => r.exposure_id === Q.exposure.exposure_id).map((r) => [r.response, r.is_correct])).toEqual([["아니다", true]]);
  expect(mine(a.interaction_id).map((e) => [e.concept_id, e.content_version, e.position, e.article_id, e.exposure_context.plan_id])).toEqual([
    [PROBES.P3.targets[0].concept_id, 4, "POST", null, null],
  ]);

  // 가림 — P3 "그렇다" · "잘 모르겠다" 는 틀림, P2 셋째는 맞음, P0 · P1 은 가리지 않는다
  const got: [string, unknown][] = [];
  for (const [probe_id, response, position, type] of [
    [PROBES.P3.probe_id, "그렇다", "DELAYED", "COMPREHENSION"], [PROBES.P3.probe_id, "잘 모르겠다", "DELAYED", "COMPREHENSION"],
    [PROBES.P2.probe_id, PROBES.P2.choices[2], "POST", "COMPREHENSION"], [PROBES.P2.probe_id, PROBES.P2.choices[1], "POST", "COMPREHENSION"],
    [PROBES.P0.probe_id, "처음 듣는다", "PRE", "DIAGNOSTIC"], [PROBES.P1.probe_id, "  물가 때문에?\n잘 모르겠어요  ", "POST", "COMPREHENSION"],
  ] as const) {
    const q = asking(U, probe_id, position, type);
    await post(request, "/api/exposures", q.exposure);
    const ans = q.answer(response);
    expect(await post(request, "/api/responses", ans)).toEqual({ status: "stored" });
    s = await study(request, U);
    got.push([response, s.responses.find((r) => r.interaction_id === ans.interaction_id)!.is_correct]);
  }
  expect(got).toEqual([
    ["그렇다", false], ["잘 모르겠다", false], [PROBES.P2.choices[2], true], [PROBES.P2.choices[1], false],
    ["처음 듣는다", null], ["  물가 때문에?\n잘 모르겠어요  ", null], // 쓴 글은 그대로 — 다듬지 않는다
  ]);
  expect(s.responses.find((r) => r.response.includes("물가 때문에"))!.response).toBe("  물가 때문에?\n잘 모르겠어요  ");
});

test("노출 — 계약에 없는 칸 · 놓을 자리 · 없는 물음 판 · 넷 밖의 유형은 거부. 같은 노출을 두 번 받으면 성공", async ({ request }) => {
  const Q = asking(READERS.api, PROBES.P1.probe_id);
  expect((await post(request, "/api/exposures", { ...Q.exposure, group: "news" })).code, "무리 칸").toBe("LEDGER_FIELD");
  expect((await post(request, "/api/exposures", { ...Q.exposure, shown_at_loc: { slide_index: 8, block_index: null } })).code, "놓을 자리").toBe("LEDGER_FIELD");
  expect((await post(request, "/api/exposures", { ...Q.exposure, probe_type: "QUIZ" })).code).toBe("CHECK probe_exposure_probe_type");
  expect((await post(request, "/api/exposures", { ...Q.exposure, position: "MID" })).code).toBe("CHECK probe_exposure_position");
  expect((await post(request, "/api/exposures", { ...Q.exposure, probe_version: 2 })).code, "없는 판").toBe("EXPOSURE_PROBE");
  expect((await post(request, "/api/exposures", { ...Q.exposure, plan_id: id() })).code, "없는 plan").toMatch(/EXPOSURE_PLAN|FK/);
  expect(await post(request, "/api/exposures", Q.exposure)).toEqual({ status: "stored" });
  expect(await post(request, "/api/exposures", Q.exposure)).toEqual({ status: "duplicate" });
  expect((await study(request, READERS.api)).exposures.filter((x) => x.exposure_id === Q.exposure.exposure_id)).toHaveLength(1);
});

test("target 이 둘인 물음 — 응답 하나에 증거가 정확히 둘 (한 거래). 하나라도 못 넣으면 응답도 증거도 0 — 'target 둘인데 증거 줄 하나'는 생기지 않는다", async ({ request }) => {
  const U = READERS.api;
  const ok = asking(U, TEST_PROBES.TWO);
  await post(request, "/api/exposures", ok.exposure);
  const a = ok.answer("가");
  expect(await post(request, "/api/responses", a)).toEqual({ status: "stored" });
  let s = await study(request, U);
  const rows = s.evidence.filter((e) => e.interaction_id === a.interaction_id);
  expect(rows.map((e) => `${e.concept_id.slice(0, 8)}@${e.content_version}`).sort()).toEqual(["247d3e88@1", "8099c201@4"]);
  expect(new Set(rows.map((e) => e.event_id)).size).toBe(2);
  expect(await post(request, "/api/responses", a), "다시 보내도 증거가 늘지 않는다").toEqual({ status: "duplicate" });
  expect((await study(request, U)).evidence.filter((e) => e.interaction_id === a.interaction_id)).toHaveLength(2);

  // 둘째 target 이 없는 버전 (v99) — 불변식 18. 데이터베이스는 못 본다, 넣는 쪽이 본다
  const bad = asking(U, TEST_PROBES.BAD);
  await post(request, "/api/exposures", bad.exposure);
  const b = bad.answer("가");
  expect(await post(request, "/api/responses", b)).toEqual({ status: "rejected", code: "EVIDENCE_VERSION" });
  s = await study(request, U);
  expect(s.responses.filter((r) => r.interaction_id === b.interaction_id), "응답도 없다").toEqual([]);
  expect(s.evidence.filter((e) => e.interaction_id === b.interaction_id), "증거 한 줄만 들어간 일이 없다").toEqual([]);
});

test("물음을 넣기 전의 검사 — 없는 요점 · 다른 사건의 요점 · 없는 개념 · 없는 버전 · 옛 버전은 넣지 않는다 (불변식 23 · 18)", () => {
  const goals = (JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../fixtures/store.json"), "utf-8")) as { goals: GoalRow[] }).goals;
  const check = (p: Probe) => probeProblems(p, goals).map((m) => m.split(":")[0]);
  for (const p of Object.values(PROBES)) expect(check(p), p.prompt).toEqual([]);
  const P2: Probe = { ...PROBES.P2, targets: [], choices: [...PROBES.P2.choices] };
  const P3: Probe = { ...PROBES.P3, targets: [...PROBES.P3.targets], choices: [...PROBES.P3.choices] };
  expect(check({ ...P2, goal_ref: id() }), "없는 요점").toEqual(["PROBE_GOAL"]);
  expect(check({ ...P2, event_id: id() }), "요점과 사건이 다르다").toEqual(["PROBE_GOAL"]);
  expect(check({ ...P3, targets: [{ concept_id: id(), version: 1 }] }), "없는 개념").toEqual(["EVIDENCE_CONCEPT"]);
  expect(check({ ...P3, targets: [{ ...P3.targets[0]!, version: 9 }] }), "없는 버전").toEqual(["EVIDENCE_VERSION"]);
  expect(check({ ...P3, targets: [{ ...P3.targets[0]!, version: 3 }] }), "옛 버전 — 라이브러리에 지금 버전(4)의 문안만 있다").toEqual(["EVIDENCE_VERSION"]);
  expect(check({ ...P3, correct_choice: 3 })).toEqual(["PROBE_CHOICE"]);
});
