// F-3 첫 회의 흐름 셋 (B-0.5 · D37) — 화면 → 원장의 줄. 주소가 무리를 가른다.
//   Claro 무리 `/?r=`      동의 → 읽기 전 물음 → 기사 → 직후 물음 셋 → 고맙다는 화면
//   일반 기사 `/news?r=`   동의 → 읽기 전 물음 → 바깥 기사를 읽고 돌아온다 → 직후 물음 셋
//   며칠 뒤 `/again?r=`    같은 물음 셋을 다시
import { expect, test, type Page } from "@playwright/test";
import { TEST_OUTSIDE_URL } from "./database";
import { lines, study, unsent } from "./ledger";
import { READERS, STRANGER } from "./readers";
import { MOBILE_SE, ask, card, readToEnd } from "./reader";
import { NOTICE, STUDY } from "../src/study/copy";
import { PROBES } from "../src/study/probes";

const phone = { viewport: MOBILE_SE, isMobile: true, hasTouch: true };
const C_0002 = "8099c201-8ace-4262-acaf-8fda2a57b6d4";
const label = (probe_id: string) => Object.entries(PROBES).find(([, p]) => p.probe_id === probe_id)?.[0];
const prompt = (page: Page) => page.locator(".s-prompt");
const choose = (page: Page, text: string) => page.locator(".s-choice", { hasText: text }).tap();
const next = (page: Page) => page.locator(".s-go").tap();
const skip = (page: Page) => page.locator(".s-skip").tap();
/** 다 보냈다 — 화면이 쥐고 있는 줄이 없다 */
const sent = (page: Page) => expect.poll(() => unsent(page), { timeout: 20_000 }).toBe(0);
/** 화면의 어디에도 맞았다 · 틀렸다를 말하는 글이 없다 */
const noVerdict = async (page: Page) => expect(await page.locator("body").innerText()).not.toMatch(/정답|맞았|맞혔|틀렸|오답|점수/);

test("동의 문안 · 물음 넷이 D37 의 글자 그대로다 — 화면에 실은 물음 = 데이터베이스의 물음", async ({ request }) => {
  expect([NOTICE.title, ...NOTICE.lines, NOTICE.agree]).toEqual([
    "읽기 전에 알려 드려요",
    "Claro 는 뉴스를 더 쉽게 읽히게 하려는 실험이에요. 도와주셔서 고맙습니다.",
    "기록하는 것: 기사를 어디까지 읽었는지, 물음에 적은 답.",
    "기록하지 않는 것: 이름, 연락처. 답은 번호로만 남아요.",
    "며칠 뒤에 같은 물음을 한 번 더 여쭤볼게요. 언제든 그만두셔도 됩니다.",
    "알겠어요, 시작할게요",
  ]);
  expect(Object.values(PROBES).map((p) => [p.prompt, p.choices, p.correct_choice])).toEqual([
    ["지난 9월 미국이 금리를 올렸다는 소식, 얼마나 알고 계세요?", ["처음 듣는다", "들어는 봤다", "왜 올렸는지도 안다"], null],
    ["미국 연준이 왜 금리를 올렸는지, 친구에게 말하듯 한두 문장으로 적어 주세요.", null, null],
    ["연준이 금리를 올린 이유로 가장 가까운 것은?", ["경기가 너무 좋아서 식히려고", "물가가 갑자기 크게 나빠져서", "물가가 오르는 속도가 충분히 빨리 줄고 있다는 확신이 없어서", "잘 모르겠다"], 2],
    ['"물가 상승률이 내려오고 있다"는 말은 물건값이 싸지고 있다는 뜻일까요?', ["그렇다", "아니다", "잘 모르겠다"], 1],
  ]);
  const inDb = (await study(request, STRANGER)).probes;
  for (const p of Object.values(PROBES)) {
    const row = inDb.find((x) => x.probe_id === p.probe_id)!;
    expect([row.version, row.prompt, row.choices, row.correct_choice, row.event_id, row.goal_ref, row.targets]).toEqual([1, p.prompt, p.choices, p.correct_choice, p.event_id, p.goal_ref, p.targets]);
  }
  expect(PROBES.P3.targets).toEqual([{ concept_id: C_0002, version: 4 }]);
  expect([PROBES.P0.goal_ref, PROBES.P1.goal_ref, PROBES.P2.goal_ref, PROBES.P3.goal_ref]).toEqual(Array(3).fill("689476be-768a-4222-aca4-bfcb84754ab4").concat(null));
});

test("Claro 무리 — 동의 → 읽기 전 물음 → 기사 → 직후 물음 셋 → 고맙다는 화면. 원장: 동의 1 · 노출 4 · 응답 4 · 증거 1", async ({ browser, request }) => {
  test.setTimeout(150_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const posts: string[] = [];
  page.on("request", (r) => r.method() === "POST" && posts.push(new URL(r.url()).pathname));
  await page.goto(`/?r=${READERS.study}`);
  // 동의 — 누르기 전에는 아무것도 기록하지 않는다 (기사도 아직 안 보인다)
  await expect(page.locator(".s-title")).toHaveText(NOTICE.title);
  await expect(page.locator(".s-text")).toHaveText([...NOTICE.lines]);
  await expect(page.locator(".r-deck")).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(posts, "동의 전").toEqual([]);
  let s = await study(request, READERS.study);
  expect([s.consents.length, s.exposures.length, s.readings.length], "동의 전의 원장").toEqual([0, 0, 0]);
  await page.locator(".s-go", { hasText: NOTICE.agree }).tap();

  // 읽기 전 물음 (P0) — 고르지 않으면 "다음"이 눌리지 않는다
  await expect(prompt(page)).toHaveText(PROBES.P0.prompt);
  await expect(page.locator(".s-choice")).toHaveText([...PROBES.P0.choices]);
  await expect(page.locator(".s-go")).toBeDisabled();
  await choose(page, "들어는 봤다");
  await noVerdict(page);
  await next(page);

  // 기사 — 지금 화면 그대로. 끝까지 읽는다
  await page.locator(".r-deck").waitFor();
  for (let i = 0; i < 9; i++) {
    await readToEnd(page, cdp, i);
    if (i < 8) await ask(page, i);
  }
  // 마지막 장에 물음으로 가는 길 하나가 더해졌다
  const way = card(page, 8).locator(".r-to-questions");
  await expect(way).toHaveText(STUDY.toQuestions);
  await way.tap();

  // 직후 물음 셋 — P1 (쓰기) · P2 · P3. 기사는 다시 보이지 않는다
  await expect(prompt(page)).toHaveText(PROBES.P1.prompt);
  await expect(page.locator(".r-deck")).toHaveCount(0);
  const wrote = "물가가 갑자기 나빠져서가 아니라,\n내려가는 속도가 충분하다는 확신이 없어서 올렸대.";
  await page.locator(".s-write").fill(wrote);
  await next(page);
  await expect(prompt(page)).toHaveText(PROBES.P2.prompt);
  await expect(page.locator(".s-choice")).toHaveText([...PROBES.P2.choices]); // 보기의 순서는 고정이다
  await choose(page, PROBES.P2.choices[1]);
  await choose(page, PROBES.P2.choices[2]); // 마음을 바꿨다 — "다음"을 누르기 전의 것은 적히지 않는다
  await noVerdict(page);
  await next(page);
  await expect(prompt(page)).toHaveText(PROBES.P3.prompt);
  await choose(page, "아니다");
  await next(page);
  await expect(page.locator(".s-title")).toHaveText(STUDY.thanks);
  await noVerdict(page);
  await sent(page);

  s = await study(request, READERS.study);
  expect(s.consents.map((c) => [c.user_id, c.notice_version])).toEqual([[READERS.study, 1]]);
  expect(Object.keys(s.consents[0]!).sort(), "동의 줄의 칸 — 무리를 적는 칸이 없다").toEqual(["consent_id", "consented_at", "notice_version", "user_id"]);
  const r = s.readings[0]!;
  expect(s.readings).toHaveLength(1);
  expect(lines(r)).toHaveLength(18);
  expect(r.summary).toMatchObject({ completed: true, completed_to_end: true });
  expect(r.check.conforms).toBe(true);
  // 노출 넷 — 읽기 전 물음은 plan 이 없다 (아직 기사를 보여주지 않았다). 직후 물음은 방금 읽은 레벨의 plan 을 가리킨다. 자리는 적지 않는다
  expect(s.exposures.map((x) => [label(x.probe_id), x.probe_version, x.position, x.probe_type, x.plan_id, x.shown_at_loc])).toEqual([
    ["P0", 1, "PRE", "DIAGNOSTIC", null, null],
    ["P1", 1, "POST", "COMPREHENSION", r.plans[0]!.plan_id, null],
    ["P2", 1, "POST", "COMPREHENSION", r.plans[0]!.plan_id, null],
    ["P3", 1, "POST", "COMPREHENSION", r.plans[0]!.plan_id, null],
  ]);
  expect(new Set(s.exposures.map((x) => x.session_id)).size).toBe(1);
  expect(Date.parse(s.exposures[0]!.shown_at), "읽기 전 물음은 기사의 첫 사건보다 앞이다").toBeLessThan(Date.parse(r.events[0]!.occurred_at));
  // 응답 넷 — 쓴 글은 그대로 · 쓴 답과 정답 없는 물음은 가리지 않는다 (null) · 고르는 물음은 서버가 가린다
  expect(s.responses.map((a) => [a.response, a.is_correct])).toEqual([
    ["들어는 봤다", null], [wrote, null], [PROBES.P2.choices[2], true], ["아니다", true],
  ]);
  expect(s.responses.map((a) => a.exposure_id)).toEqual(s.exposures.map((x) => x.exposure_id));
  // 증거 한 줄 — 개념을 겨누는 물음(P3)의 응답에서만. 무엇을 본 뒤의 답인지는 plan 을 가리킨다. 값을 매기는 칸이 없다
  expect(s.evidence).toHaveLength(1);
  expect(s.evidence[0]).toMatchObject({
    user_id: READERS.study, concept_id: C_0002, content_version: 4, evidence_type: "PROBE_RESPONSE", position: "POST",
    interaction_id: s.responses[3]!.interaction_id, probe_id: PROBES.P3.probe_id, article_id: r.plans[0]!.article_id, article_version: 1,
    content_block_id: null, exposure_context: { session_id: r.session_id, reading_id: r.reading_id, plan_id: r.plans[0]!.plan_id }, model_version: null,
  });
  expect(Object.keys(s.evidence[0]!)).toHaveLength(14);

  // 새로고침 — 고맙다는 화면 그대로. 다시 묻지 않는다
  await page.reload();
  await expect(page.locator(".s-title")).toHaveText(STUDY.thanks);
  await page.waitForTimeout(1000);
  expect((await study(request, READERS.study)).exposures).toHaveLength(4);
  await ctx.close();
});

test("일반 기사 무리 — 물음만 있는 화면. 바깥 기사는 새 창의 링크로. plan 이 없다 — 노출 · 응답만 남는다", async ({ browser, request }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`/news?r=${READERS.news}`);
  await page.locator(".s-go", { hasText: NOTICE.agree }).tap();
  await expect(prompt(page)).toHaveText(PROBES.P0.prompt);
  await choose(page, "처음 듣는다");
  await next(page);
  // 바깥 기사 — 주소로만 보낸다. 우리 화면에 그 기사의 글이 없다
  await expect(page.locator(".s-title")).toHaveText(STUDY.goRead);
  const link = page.locator("a.s-out");
  expect([await link.getAttribute("href"), await link.getAttribute("target"), await link.getAttribute("rel")]).toEqual([TEST_OUTSIDE_URL, "_blank", "noopener noreferrer"]);
  await expect(page.locator(".r-deck, .r-card")).toHaveCount(0);
  await page.locator(".s-go", { hasText: STUDY.didRead }).tap();
  await expect(prompt(page)).toHaveText(PROBES.P1.prompt);
  await page.locator(".s-write").fill("물가가 올라서 금리를 올린 것 같다");
  await next(page);
  await choose(page, PROBES.P2.choices[1]); // 이 기사가 깨려는 오해
  await next(page);
  await choose(page, "그렇다");
  await next(page);
  await expect(page.locator(".s-title")).toHaveText(STUDY.thanks);
  await sent(page);

  const s = await study(request, READERS.news);
  expect(s.readings, "plan · 읽기 사건이 없다").toEqual([]);
  expect(s.exposures.map((x) => [label(x.probe_id), x.position, x.plan_id])).toEqual([["P0", "PRE", null], ["P1", "POST", null], ["P2", "POST", null], ["P3", "POST", null]]);
  expect(s.responses.map((a) => a.is_correct)).toEqual([null, null, false, false]);
  // 증거 — 기사 밖의 답이다: 판 · 열람 · plan 이 null
  expect(s.evidence).toHaveLength(1);
  expect(s.evidence[0]).toMatchObject({ concept_id: C_0002, position: "POST", article_id: null, article_version: null, exposure_context: { reading_id: null, plan_id: null } });
  // 무리를 적은 곳이 없다 — 원장의 줄에도, 동의에도
  expect(JSON.stringify(s)).not.toMatch(/"(group|arm|cohort|condition|variant|flow)"/);
  await ctx.close();
});

test("며칠 뒤 — 같은 물음 셋을 DELAYED 로. 건너뛴 물음은 노출만 남는다 (무응답은 증거가 아니다). 다시 열면 다시 묻지 않는다", async ({ browser, request }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`/again?r=${READERS.again}`);
  // 직후 물음에 답한 적 없는 독자가 와도 받는다 — 동의부터
  await page.locator(".s-go", { hasText: NOTICE.agree }).tap();
  await expect(page.locator(".s-kicker")).toContainText(STUDY.again);
  await expect(prompt(page)).toHaveText(PROBES.P1.prompt);
  await skip(page); // P1 건너뛰기
  await expect(prompt(page)).toHaveText(PROBES.P2.prompt);
  await choose(page, "잘 모르겠다");
  await next(page);
  await expect(prompt(page)).toHaveText(PROBES.P3.prompt);
  await choose(page, "아니다");
  await skip(page); // 골랐지만 건너뛰었다 — 답이 아니다
  await expect(page.locator(".s-title")).toHaveText(STUDY.thanks);
  await expect(page.locator(".s-text")).toHaveText(STUDY.thanksLater);
  await expect(page.locator(".r-deck, .r-card"), "기사를 다시 보여주지 않는다").toHaveCount(0);
  await sent(page);

  let s = await study(request, READERS.again);
  expect(s.exposures.map((x) => [label(x.probe_id), x.position, x.probe_type, x.plan_id])).toEqual([
    ["P1", "DELAYED", "COMPREHENSION", null], ["P2", "DELAYED", "COMPREHENSION", null], ["P3", "DELAYED", "COMPREHENSION", null],
  ]);
  expect(s.responses.map((a) => [a.response, a.is_correct])).toEqual([["잘 모르겠다", false]]);
  expect(s.evidence, "P3 는 답하지 않았다 — 증거 0").toEqual([]);
  await ctx.close();

  // 다른 브라우저로 같은 링크를 다시 연다 — 이미 물은 것은 다시 묻지 않는다
  const again = await browser.newContext(phone);
  const p2 = await again.newPage();
  await p2.goto(`/again?r=${READERS.again}`);
  await expect(p2.locator(".s-title")).toHaveText(STUDY.thanks);
  await p2.waitForTimeout(1000);
  s = await study(request, READERS.again);
  expect([s.exposures.length, s.consents.length]).toEqual([3, 1]);
  await again.close();
});

test("쓰던 답은 새로고침에 잃지 않는다 · 같은 물음을 다시 그려도 노출은 하나다 · 쓰는 칸에 들어가면 물음이 화면 위에 보인다", async ({ browser, request }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`/again?r=${READERS.draft}`);
  await page.locator(".s-go", { hasText: NOTICE.agree }).tap();
  await page.locator(".s-write").tap();
  await page.locator(".s-write").pressSequentially("연준이 금리를 올린 건");
  await page.waitForTimeout(600);
  // 폰의 키보드는 화면 아래쪽을 덮는다 — 물음과 쓰는 칸이 화면의 위쪽 절반 안에 있어야 한다
  const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
  expect((await box(".s-prompt")).y).toBeGreaterThanOrEqual(0);
  expect((await box(".s-write")).y + (await box(".s-write")).height, "쓰는 칸의 아래 끝").toBeLessThan(MOBILE_SE.height * 0.62);
  await page.reload();
  await expect(page.locator(".s-write")).toHaveValue("연준이 금리를 올린 건");
  await page.locator(".s-write").fill("연준이 금리를 올린 건 속도 때문이다"); // 이어서 쓴다
  await next(page);
  await expect(prompt(page)).toHaveText(PROBES.P2.prompt);
  await page.reload(); // 물음이 뜬 채 새로고침 — 같은 노출이다
  await expect(prompt(page)).toHaveText(PROBES.P2.prompt);
  await sent(page);
  const s = await study(request, READERS.draft);
  expect(s.exposures.map((x) => label(x.probe_id))).toEqual(["P1", "P2"]);
  expect(s.responses.map((a) => a.response)).toEqual(["연준이 금리를 올린 건 속도 때문이다"]);
  await ctx.close();
});

test("동의 화면에서 멈춘 독자 — 원장에 아무것도 없다. 다른 브라우저로 다시 열면: 동의 · 읽기 전 물음을 이미 지났으면 다시 묻지 않는다", async ({ browser, request }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`/?r=${READERS.two}`);
  await expect(page.locator(".s-title")).toHaveText(NOTICE.title);
  await page.touchscreen.tap(187, 500); // 손은 댔다 — 그래도 동의 전이다
  await page.waitForTimeout(1500);
  let s = await study(request, READERS.two);
  expect([s.consents.length, s.exposures.length, s.readings.length]).toEqual([0, 0, 0]);
  await page.locator(".s-go").tap();
  await choose(page, "왜 올렸는지도 안다");
  await next(page);
  await page.locator(".r-deck").waitFor();
  await sent(page);
  await ctx.close();

  const other = await browser.newContext(phone); // 카카오톡 안의 브라우저 → Safari
  const p2 = await other.newPage();
  await p2.goto(`/?r=${READERS.two}`);
  await p2.locator(".r-deck").waitFor(); // 안내 · 읽기 전 물음 없이 기사
  await expect(p2.locator(".study")).toHaveCount(0);
  await p2.touchscreen.tap(187, 30);
  await p2.waitForTimeout(1500);
  s = await study(request, READERS.two);
  expect([s.consents.length, s.exposures.length, s.responses.length]).toEqual([1, 1, 1]);
  expect(s.readings).toHaveLength(2); // 브라우저마다 열람이 따로다 (D36)
  await other.close();
});

test("받은 링크가 아니면 — 물음만 있는 화면(/news · /again)은 열리지 않는다. 요청도 쓰지 않는다", async ({ browser, request }) => {
  const ctx = await browser.newContext(phone);
  for (const path of ["/news", "/again", `/news?r=${STRANGER}`, `/again?r=${STRANGER}`, "/again?r=R-07"]) {
    const page = await ctx.newPage();
    const posts: string[] = [];
    page.on("request", (r) => r.method() === "POST" && posts.push(r.url()));
    await page.goto(path);
    await expect(page.locator(".s-title"), path).toHaveText(STUDY.invite);
    await expect(page.locator(".s-go, .s-choice, .s-write")).toHaveCount(0);
    expect(posts, path).toEqual([]);
    await page.close();
  }
  const s = await study(request, STRANGER);
  expect([s.consents.length, s.exposures.length]).toEqual([0, 0]);
  await ctx.close();
});
