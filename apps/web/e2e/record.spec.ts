// 읽으면 원장에 남는다 (B-0.4b) — 화면의 순간 → 사건 → 원장의 줄. 끝에서 끝까지: 브라우저 → API → 데이터베이스(PGlite) → 원장에서 센 값.
// 독자는 링크로 온다 (`/?r=<user_id>`). 테스트마다 다른 독자를 쓴다 (e2e/readers.ts).
// 장에서 멈출 때마다 끝까지 내린다 (readToEnd) — 짧은 장은 열자마자 끝이 나오고 긴 장은 내려야 나온다. 그 차이가 줄 수를 흔들지 않게.
import { expect, test, type Page } from "@playwright/test";
import { EVENT_FIELDS, PLAN_FIELDS, enter, lines, readings, settledLedger, study, unsent } from "./ledger";
import { READERS, STRANGER } from "./readers";
import { MOBILE_SE, ask, card, count, readToEnd, settled } from "./reader";

const phone = { viewport: MOBILE_SE, isMobile: true, hasTouch: true };
const GOLDEN = { article_id: "6f4080a5-bada-412a-b870-bc5d16fe88b3", article_version: 1 };
const visit = (lv: string, i: number) => [`ENTERED ${lv} ${i}`, `END ${lv} ${i}`];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** 독자의 링크로 기사에 들어간다 (동의 · 읽기 전 물음을 지나서). 링크가 없으면 그냥 연다 */
async function open(page: Page, reader: string | null, path = "/") {
  if (reader && path === "/") return enter(page, reader);
  await page.goto(reader ? `${path}?r=${reader}` : path);
  await page.locator(".r-deck").waitFor();
  await page.evaluate(() => document.fonts.ready);
}
/** 화면이 서버로 보낸 요청 — /api 로 간 것만 */
function apiCalls(page: Page): string[] {
  const calls: string[] = [];
  page.on("request", (r) => new URL(r.url()).pathname.startsWith("/api/") && calls.push(`${r.method()} ${new URL(r.url()).pathname.replace(/readers\/.*/, "readers/…")}`));
  return calls;
}

test("입문을 끝까지 읽는다 → 원장: plan 1 · 사건 18 · 완독 · 끝이 나온 완독 · 멈춘 장 = 마지막 장", async ({ browser, request }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.finish);
  for (let i = 0; i < 9; i++) {
    await readToEnd(page, cdp, i);
    if (i < 8) await ask(page, i);
  }
  const r = await settledLedger(request, READERS.finish, 18);
  expect(lines(r)).toEqual(range(9).flatMap((i) => visit("basic", i)));
  expect(r.events.map((e) => e.seq)).toEqual(range(18));
  expect(r.summary).toEqual({
    completed: true, completed_to_end: true, stopped_at: { level: "basic", slide_index: 8 }, stopped_end_shown: true,
    furthest: { basic: 8 }, switched_from: [],
  });
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });

  // plan — 화면이 보낸 것은 아홉 칸이다. 나머지는 서버가 채웠다: 정적 레벨이라 null · [] 이고, block_decisions 는 패키지에서 계산한 값
  expect(r.plans).toHaveLength(1);
  const plan = r.plans[0]!;
  expect(Object.keys(plan)).toEqual(PLAN_FIELDS);
  expect(plan).toMatchObject({
    user_id: READERS.finish, ...GOLDEN, level: "basic", level_chosen_by: "DEFAULT",
    estimator_version: null, selected_blocks: null, skipped_blocks: null, narrative_form: null, probe_plan: [],
  });
  expect(plan.block_decisions.map((d: any) => `${d.decision} ${d.reason}`).sort()).toEqual(
    ["FULL STATIC_LEVEL", "FULL STATIC_LEVEL", "SKIP STATIC_LEVEL", "SKIP STATIC_LEVEL"], // 계약 §4.2 의 표 — 입문
  );
  // 사건 — 계약의 칸 열 개, 그것만. 독자 · 세션 · 열람이 plan 과 같다. 방향 · 머문 시간 같은 칸이 없다
  for (const e of r.events) {
    expect(Object.keys(e)).toEqual(EVENT_FIELDS);
    expect([e.user_id, e.session_id, e.reading_id, e.plan_id, e.from_plan_id]).toEqual([plan.user_id, plan.session_id, plan.reading_id, plan.plan_id, null]);
  }
  await ctx.close();
});

test("레벨을 바꿨다 돌아온다 → plan 은 레벨마다 하나. 돌아온 레벨은 있던 plan 을 다시 쓰고, 이미 나온 끝은 다시 안 남는다", async ({ browser, request }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.levels);
  await readToEnd(page, cdp, 0);
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  await page.getByRole("button", { name: "숙련", exact: true }).tap();
  await page.locator('.r-deck[data-level="advanced"]').waitFor();
  await readToEnd(page, cdp, 0);
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  await page.getByRole("button", { name: "입문", exact: true }).tap();
  await page.locator('.r-deck[data-level="basic"]').waitFor();
  await expect(count(page)).toHaveText("2/9"); // 읽던 자리
  await page.waitForTimeout(1500);

  const r = await settledLedger(request, READERS.levels, 11);
  expect(lines(r)).toEqual([
    ...visit("basic", 0), ...visit("basic", 1),
    "SWITCHED basic>advanced", ...visit("advanced", 0), ...visit("advanced", 1),
    "SWITCHED advanced>basic", "ENTERED basic 1", // 돌아온 장 — 끝이 이미 나왔던 장이다 (불변식 22)
  ]);
  expect(r.plans.map((p) => `${p.level} ${p.level_chosen_by}`)).toEqual(["basic DEFAULT", "advanced READER"]);
  expect(r.plans[1]!.block_decisions.map((d: any) => d.decision).sort()).toEqual(["REFRESHER", "SKIP", "SKIP", "SKIP"]); // §4.2 — 숙련
  expect(r.summary).toMatchObject({ completed: false, stopped_at: { level: "basic", slide_index: 1 }, stopped_end_shown: true, switched_from: ["basic", "advanced"] });
  expect(r.check.conforms).toBe(true);
  await ctx.close();
});

test("지나온 길로 되돌아간다 → 같은 사건(SLIDE_ENTERED)으로 남는다. 방향은 남지 않고, 이미 나온 끝은 다시 안 남는다", async ({ browser, request }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.back);
  for (let i = 0; i < 2; i++) (await readToEnd(page, cdp, i), await ask(page, i));
  await readToEnd(page, cdp, 2);
  await page.locator(".r-where").tap();
  await page.locator(".r-trail li").nth(0).locator("button").tap();
  await settled(page, 0);
  await ask(page, 0); // 다시 앞으로
  await page.waitForTimeout(1500);

  const r = await settledLedger(request, READERS.back, 8);
  expect(lines(r)).toEqual([...visit("basic", 0), ...visit("basic", 1), ...visit("basic", 2), "ENTERED basic 0", "ENTERED basic 1"]);
  expect(r.summary).toMatchObject({ completed: false, stopped_at: { level: "basic", slide_index: 1 }, stopped_end_shown: true, furthest: { basic: 2 } });
  expect(r.check.conforms).toBe(true);
  await ctx.close();
});

test("4장에서 새로고침한다 → 같은 열람 · 이어지는 seq · 되살린 장과 이미 보낸 끝은 다시 안 남는다", async ({ browser, request }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.refresh);
  for (let i = 0; i < 3; i++) (await readToEnd(page, cdp, i), await ask(page, i));
  await readToEnd(page, cdp, 3);
  const before = await settledLedger(request, READERS.refresh, 8);

  await page.reload();
  await settled(page, 3);
  await page.waitForTimeout(2000);
  expect((await readings(request, READERS.refresh)).map((r) => r.events.length), "되살린 것만으로는 줄이 늘지 않는다").toEqual([8]);
  await readToEnd(page, cdp, 3);
  await ask(page, 3);
  await readToEnd(page, cdp, 4);

  const r = await settledLedger(request, READERS.refresh, 10);
  expect([r.reading_id, r.session_id]).toEqual([before.reading_id, before.session_id]);
  expect(r.plans.map((p) => p.plan_id)).toEqual(before.plans.map((p) => p.plan_id));
  expect(lines(r)).toEqual(range(5).flatMap((i) => visit("basic", i)));
  expect(r.events.map((e) => e.seq)).toEqual(range(10));
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  await ctx.close();
});

test("서버가 답하지 않는다 → 화면은 기다리지 않는다. 못 보낸 사건은 쥐고 있다가, 서버가 돌아오면 보낸다", async ({ browser, request }) => {
  test.setTimeout(150_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.slow);
  await readToEnd(page, cdp, 0);
  await settledLedger(request, READERS.slow, 2);
  const turn = async (i: number) => {
    const t = Date.now();
    await ask(page, i);
    return Date.now() - t;
  };
  const alive = await turn(0); // 서버가 살아 있을 때 넘어가는 데 걸린 시간
  await readToEnd(page, cdp, 1);
  await settledLedger(request, READERS.slow, 4);

  // 서버가 죽었다 — 화면에서 /api 로 가는 요청이 전부 끊긴다
  let dropped = 0;
  await page.route("**/api/**", (route) => (dropped++, route.abort("connectionrefused")));
  const dead: number[] = [];
  for (let i = 1; i < 4; i++) {
    dead.push(await turn(i));
    await readToEnd(page, cdp, i + 1);
  }
  await expect(count(page)).toHaveText("5/9");
  await expect(card(page, 4).locator(".r-ask")).toBeVisible();
  expect(dropped, "보내려 했다").toBeGreaterThan(0);
  expect((await readings(request, READERS.slow))[0]!.events.length, "죽은 동안 원장은 그대로다").toBe(4);
  // 넘어가는 움직임이 서버를 기다리지 않는다 — 살아 있을 때와 같은 시간에 끝난다
  for (const ms of dead) expect(Math.abs(ms - alive), `살아 있을 때 ${alive}ms · 죽었을 때 ${dead.join(" · ")}ms`).toBeLessThan(700);

  // 서버가 살아났다 — 화면은 아무것도 하지 않아도 된다. 쥐고 있던 줄이 간다
  await page.unroute("**/api/**");
  const r = await settledLedger(request, READERS.slow, 10, 45_000);
  expect(lines(r)).toEqual(range(5).flatMap((i) => visit("basic", i)));
  expect(r.events.map((e) => e.seq)).toEqual(range(10));
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  // 사건의 시각은 일어난 때다 (기기의 시각) — 보낸 때가 아니다. 순서는 seq 가 정한다
  const at = r.events.map((e) => Date.parse(e.occurred_at));
  expect([...at].sort((a, b) => a - b)).toEqual(at);

  // 서버가 느리다 (답이 4초 뒤에 온다) — 그래도 넘어가는 시간은 같다
  await page.route("**/api/**", async (route) => (await new Promise((f) => setTimeout(f, 4000)), route.continue()));
  const slow = await turn(4);
  expect(slow, `느릴 때 ${slow}ms`).toBeLessThan(alive + 700);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  console.log(`  넘어가는 시간 — 서버가 살아 있을 때 ${alive}ms · 죽었을 때 ${dead.join(" · ")}ms · 4초 늦게 답할 때 ${slow}ms`);
  await ctx.close();
});

test("링크 없이 읽는다 → 서버를 부르지 않는다. 원장 0줄. 대응표에 없는 번호는 누구인지 한 번 묻고(쓰지 않는다) 지금처럼 기사만 뜬다", async ({ browser, request }) => {
  test.setTimeout(90_000);
  for (const [who, link, want] of [["번호 없음", null, []], ["모양이 다른 번호", "R-07", []], ["대응표에 없는 번호", STRANGER, ["GET /api/readers/…"]]] as const) {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const calls = apiCalls(page);
    await open(page, link);
    for (let i = 0; i < 2; i++) (await readToEnd(page, cdp, i), await ask(page, i));
    await page.getByRole("button", { name: "숙련", exact: true }).tap();
    await page.locator('.r-deck[data-level="advanced"]').waitFor();
    await page.waitForTimeout(2500);
    await expect(count(page), `${who} — 읽기는 된다`).toHaveText("1/5");
    expect(calls, who).toEqual(want);
    await ctx.close();
  }
  expect(await readings(request, STRANGER)).toEqual([]);
});

test("미리보기 로봇 — 연다 · 기다린다 · 떠난다 → 원장에 쓰는 요청 0 · 원장 0줄 (동의 화면에서 멈춘다 — D37)", async ({ browser, request }) => {
  test.setTimeout(60_000);
  // 스크립트까지 돌리는 로봇: 화면이 그려진다. 등록된 독자의 링크라 안내가 뜬다. 손은 대지 않는다
  const bot = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await bot.newPage();
  const calls = apiCalls(page);
  await page.goto(`/?r=${READERS.robot}`);
  await page.locator(".study").waitFor();
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    for (const type of ["pointerdown", "touchstart", "wheel", "keydown", "click"]) window.dispatchEvent(new Event(type, { bubbles: true }));
    window.scrollTo(0, 400);
    window.dispatchEvent(new Event("online"));
  });
  await page.waitForTimeout(1500);
  await page.goto("about:blank"); // 떠난다 — pagehide
  await page.waitForTimeout(1000);
  await bot.close();
  expect(calls, "로봇이 연 화면에서 나간 요청 — 누구인지 묻는 것 하나 (읽기만)").toEqual(["GET /api/readers/…"]);
  const s = await study(request, READERS.robot);
  expect([s.consents.length, s.exposures.length, s.responses.length, s.readings.length]).toEqual([0, 0, 0, 0]);
});

test("사람이 처음 손을 댄 뒤부터 보낸다 (D35) — 동의한 독자가 새 창으로 다시 열어도, 손대기 전에는 쥐고만 있다", async ({ browser, request }) => {
  test.setTimeout(90_000);
  const first = await browser.newContext(phone);
  await enter(await first.newPage(), READERS.robot); // 동의 · 읽기 전 물음을 지나 기사로
  await settledLedger(request, READERS.robot, 2);
  await first.close();

  // 같은 링크를 새 창으로 — 이미 동의했고 읽기 전 물음도 지났으니 기사가 바로 뜬다. 한동안 읽기만 한다
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const sent = apiCalls(page);
  await page.goto(`/?r=${READERS.robot}`);
  await page.locator(".r-deck").waitFor();
  await page.waitForTimeout(3500);
  expect(sent).toEqual(["GET /api/readers/…"]);
  expect(await unsent(page), "화면은 줄을 만들어 쥐고 있다 (plan · 1장에 들어옴 · 1장의 끝)").toBe(3);
  await page.evaluate(() => window.dispatchEvent(new Event("pointerdown"))); // 스크립트가 흉내 낸 입력은 손이 아니다
  await page.waitForTimeout(800);
  expect(sent).toEqual(["GET /api/readers/…"]);
  const touched = Date.now();
  await page.touchscreen.tap(187, 30);
  await expect.poll(async () => (await readings(request, READERS.robot)).map((r) => r.events.length)).toEqual([2, 2]);
  const r = (await readings(request, READERS.robot))[1]!;
  expect(lines(r)).toEqual(visit("basic", 0));
  expect(Date.parse(r.events[0]!.occurred_at), "시각은 일어난 때다 — 손을 댄 때가 아니다").toBeLessThan(touched - 2000);
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  await ctx.close();
});

test("탭을 복제한다 → 두 탭이 같은 열람 번호 · 같은 seq 를 쓴다. plan 은 둘 다 남고(D35), seq 가 겹친 사건은 나중 것이 거부된다", async ({ browser, request }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext(phone);
  const a = await ctx.newPage();
  const cdpA = await ctx.newCDPSession(a);
  await open(a, READERS.twin);
  await readToEnd(a, cdpA, 0);
  await ask(a, 0);
  await readToEnd(a, cdpA, 1);
  await settledLedger(request, READERS.twin, 4);
  // 복제 — 브라우저는 새 탭에 이 탭의 sessionStorage 를 베껴 준다
  const copied = await a.evaluate(() => JSON.stringify(sessionStorage));
  const b = await ctx.newPage();
  await b.addInitScript((dump) => {
    if (!sessionStorage.length) for (const [k, v] of Object.entries(JSON.parse(dump) as Record<string, string>)) sessionStorage.setItem(k, v);
  }, copied);
  const cdpB = await ctx.newCDPSession(b);
  await open(b, READERS.twin);
  await settled(b, 1); // 같은 자리가 되살아났다

  // 탭 A 가 먼저 3장으로 (seq 4 · 5) — 그다음 탭 B 도 3장으로 (같은 seq 4 · 5 — 거부된다)
  await a.bringToFront();
  await ask(a, 1);
  await readToEnd(a, cdpA, 2);
  await settledLedger(request, READERS.twin, 6);
  await b.bringToFront();
  await ask(b, 1);
  await readToEnd(b, cdpB, 2);
  await expect.poll(() => unsent(b)).toBe(0);
  // 탭 B 가 숙련으로 (seq 6 · 7 · 8 — 남는다. 숙련 plan 하나)
  await b.getByRole("button", { name: "숙련", exact: true }).tap();
  await b.locator('.r-deck[data-level="advanced"]').waitFor();
  await readToEnd(b, cdpB, 0);
  await settledLedger(request, READERS.twin, 9);
  // 탭 A 도 숙련으로 (다른 plan_id 의 숙련 plan. seq 6 · 7 · 8 은 겹쳐 거부) → 2장으로 (seq 9 — **남는다.** 그 줄이 가리키는 plan 이 거부되지 않았다)
  await a.bringToFront();
  await a.getByRole("button", { name: "숙련", exact: true }).tap();
  await a.locator('.r-deck[data-level="advanced"]').waitFor();
  await readToEnd(a, cdpA, 0);
  await ask(a, 0);
  const r = await settledLedger(request, READERS.twin, 10);
  await expect.poll(() => unsent(a)).toBe(0);

  expect(r.plans.map((p) => p.level)).toEqual(["basic", "advanced", "advanced"]);
  expect(r.events.map((e) => e.seq)).toEqual(range(10));
  const advOfA = r.plans[2]!.plan_id;
  expect(r.events[9]).toMatchObject({ type: "SLIDE_ENTERED", slide_index: 1, plan_id: advOfA }); // 탭 A 의 줄 — plan 이 남아 있어 이 줄도 남았다
  expect(r.check.conforms).toBe(false);
  expect(r.check.issues.map((i) => i.code)).toContain("PLAN_DUPLICATE");
  // 잃은 것: 탭 B 의 seq 4 · 5 와 탭 A 의 seq 6 · 7 · 8 — 다섯 줄. 서버 로그에 UNIQUE reading_event_reading_seq 로만 남는다
  await ctx.close();
});

test("/test 경로는 API 를 부르지 않는다 — 대응표에 있는 독자의 링크로 열어도", async ({ browser, request }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext(phone);
  for (const path of ["/test/moments", "/test/unknown-type"]) {
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const calls = apiCalls(page);
    await open(page, READERS.testRoute, path);
    for (let i = 0; i < 2; i++) (await readToEnd(page, cdp, i), await ask(page, i));
    await page.waitForTimeout(2000);
    expect(calls, path).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((k) => /reading|session|outbox|study/.test(k))), `${path} — 열람 · 세션 · 보낼 줄을 만들지도 않는다`).toEqual([]);
    await page.close();
  }
  expect(await readings(request, READERS.testRoute)).toEqual([]);
  await ctx.close();
});

test("움직임 줄이기 — 화면이 한 번 더 그려져도 첫 장은 한 번만 남는다", async ({ browser, request }) => {
  const ctx = await browser.newContext({ ...phone, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await open(page, READERS.still);
  await readToEnd(page, cdp, 0);
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  const r = await settledLedger(request, READERS.still, 4);
  expect(lines(r)).toEqual([...visit("basic", 0), ...visit("basic", 1)]);
  await ctx.close();
});

test.describe("망가뜨린 화면", () => {
  test("화면이 seq 를 건너뛴다 → 원장은 받는다. 빈 seq 가 사실로 남고, 읽을 때 '온전한 열람이 아니다'가 나온다", async ({ browser, request }) => {
    test.setTimeout(90_000);
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await open(page, READERS.skip);
    await readToEnd(page, cdp, 0);
    await ask(page, 0);
    await readToEnd(page, cdp, 1);
    await settledLedger(request, READERS.skip, 4);
    // 화면의 다음 seq 를 셋 건너뛰게 한다 (4 → 7) — 화면의 버그나, 저장하지 못하고 사라진 사건 셋과 같은 모양이다
    await page.evaluate(() => {
      const k = Object.keys(sessionStorage).find((k) => k.startsWith("claro:reading:"))!;
      const s = JSON.parse(sessionStorage.getItem(k)!);
      sessionStorage.setItem(k, JSON.stringify({ ...s, seq: s.seq + 3 }));
    });
    await page.reload();
    await settled(page, 1);
    await ask(page, 1);
    await readToEnd(page, cdp, 2);
    const r = await settledLedger(request, READERS.skip, 6);
    expect(r.events.map((e) => e.seq)).toEqual([0, 1, 2, 3, 7, 8]);
    expect(lines(r)).toEqual(range(3).flatMap((i) => visit("basic", i))); // 뒤따르는 사건이 버려지지 않았다
    expect(r.check).toMatchObject({ conforms: false, missing_seq: [4, 5, 6] });
    expect(r.check.issues.map((i) => i.code)).toEqual(["EVENT_SEQ"]);
    expect(r.summary).toMatchObject({ stopped_at: { level: "basic", slide_index: 2 }, stopped_end_shown: true });
    await ctx.close();
  });

  test("화면이 같은 사건을 두 번 보낸다 (답이 길에서 사라졌다) → 두 번째도 성공이고, 원장에는 한 줄이다", async ({ browser, request }) => {
    test.setTimeout(90_000);
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    // 서버는 받아서 넣었는데 답이 화면에 닿지 않는다 — 처음 세 번. 화면은 못 보낸 줄로 알고 다시 보낸다
    const sent: string[] = [];
    let lost = 0;
    await page.route("**/api/**", async (route) => {
      const body = route.request().postData() ?? "";
      sent.push(...[...body.matchAll(/"(?:event_id|plan_id|consent_id|exposure_id)":"([0-9a-f-]{36})"/g)].map((m) => m[1]!).filter((id, i, a) => a.indexOf(id) === i));
      if (route.request().method() !== "POST" || lost >= 3) return route.continue();
      lost++;
      await route.fetch();
      return route.abort("connectionreset");
    });
    await open(page, READERS.twice);
    await readToEnd(page, cdp, 0);
    await ask(page, 0);
    await readToEnd(page, cdp, 1);
    const r = await settledLedger(request, READERS.twice, 4, 45_000);
    await expect.poll(() => unsent(page), { timeout: 45_000 }).toBe(0);
    const twice = sent.filter((id, i) => sent.indexOf(id) !== i);
    expect(twice.length, "같은 줄이 두 번 이상 갔다").toBeGreaterThan(0);
    expect(lines(r)).toEqual([...visit("basic", 0), ...visit("basic", 1)]);
    expect(new Set(r.events.map((e) => e.event_id)).size).toBe(4);
    expect(r.plans).toHaveLength(1);
    expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
    await ctx.close();
  });
});
