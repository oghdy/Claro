// 테스트가 제 서버를 직접 켜고 죽인다 (3102) — 다른 테스트의 서버를 건드리지 않는다. 빌드는 테스트 것(.next-test)을 같이 쓴다. 차례대로 돈다.
//   1. 서버를 죽인 채 세 장을 넘기고 살린다 — **프로세스를 실제로 죽인다** (SIGKILL). 요청을 끊는 흉내가 아니다
//   2. 데이터베이스가 죽은 채 첫 화면을 연다 — 기사는 뜬다 (D35). 기록은 쥐고 있다가 데이터베이스가 살아나면 보낸다
//   3. 배포(Vercel)에는 /api/peek 가 없다 — CLARO_PEEK=1 이 들어가도 (D35)
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { testDatabase } from "./database";
import { enter, lines, readings, settledLedger, unsent } from "./ledger";
import { READERS } from "./readers";
import { MOBILE_SE, ask, card, count, readToEnd } from "./reader";

test.describe.configure({ mode: "serial" });

const PORT = 3102;
const BASE = `http://localhost:${PORT}`;
const env = { ...process.env, CLARO_DIST: ".next-test", CLARO_PEEK: "1", ...testDatabase("own") };
const phone = { viewport: MOBILE_SE, isMobile: true, hasTouch: true };
let server: ChildProcess | undefined;

/** 켠다. `ready` 가 200 을 줄 때까지 기다린다 */
async function start(extra: Record<string, string> = {}, ready = "/api/peek") {
  server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env: { ...env, ...extra }, stdio: "ignore" });
  await expect.poll(() => fetch(`${BASE}${ready}`).then((r) => r.status, () => 0), { timeout: 30_000, message: "서버가 켜졌다" }).toBe(200);
}
async function kill() {
  const gone = new Promise((f) => server!.once("exit", f));
  server!.kill("SIGKILL");
  await gone;
  await expect.poll(() => fetch(`${BASE}/`).then(() => "살아 있다", () => "죽었다"), { message: "서버가 죽었다" }).toBe("죽었다");
}
const held = unsent;

test.beforeAll(() => void execFileSync("node_modules/.bin/tsx", ["e2e/setup-db.ts"], { env }));
test.afterEach(async () => {
  if (server && server.exitCode === null && server.signalCode === null) await kill();
});

test("서버를 죽인 채 세 장을 넘기고 살린다 → 화면은 그대로 넘어가고, 살아나면 원장에 빠진 줄이 없다", async ({ browser, request }) => {
  test.setTimeout(180_000);
  await start();
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await enter(page, READERS.killed, BASE);
  await readToEnd(page, cdp, 0);
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  const before = await settledLedger(request, READERS.killed, 4, 15_000, BASE);

  await kill();
  for (let i = 1; i < 4; i++) {
    await ask(page, i); // 넘어가는 움직임이 끝날 때까지 — 서버가 없어도 끝난다
    await readToEnd(page, cdp, i + 1);
  }
  await expect(count(page)).toHaveText("5/9");
  await expect(card(page, 4).locator(".r-ask")).toBeVisible();
  expect(await held(page), "죽은 동안의 사건 여섯을 쥐고 있다").toBe(6);

  await start(); // 같은 데이터베이스로 다시 켠다 — 갑자기 죽은 뒤에도 열린다
  expect((await readings(request, READERS.killed, BASE)).map((r) => lines(r)), "죽기 전의 줄은 그대로 있다").toEqual([lines(before)]);
  const r = await settledLedger(request, READERS.killed, 10, 60_000, BASE); // 화면은 아무것도 하지 않는다 — 다시 보내기를 기다린다
  expect(lines(r)).toEqual([0, 1, 2, 3, 4].flatMap((i) => [`ENTERED basic ${i}`, `END basic ${i}`]));
  expect(r.events.map((e) => e.seq)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(r.reading_id).toBe(before.reading_id);
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  expect(r.summary).toMatchObject({ completed: false, stopped_at: { level: "basic", slide_index: 4 }, stopped_end_shown: true });
  await ctx.close();
});

test("데이터베이스가 죽은 채 첫 화면을 연다 → 기사는 뜬다. 읽던 독자의 기록은 쥐고 있다가 데이터베이스가 살아나면 간다", async ({ browser, request }) => {
  test.setTimeout(180_000);
  // 먼저 — 데이터베이스가 살아 있을 때 독자가 동의하고 기사에 들어왔다
  await start();
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await enter(page, READERS.dbdown, BASE);
  await readToEnd(page, cdp, 0);
  await settledLedger(request, READERS.dbdown, 2, 15_000, BASE);
  await kill();

  // 데이터베이스가 없는 곳을 가리킨다 (아무도 듣지 않는 포트). 서버는 켜지고, 데이터베이스에 닿는 길만 죽어 있다
  await start({ DATABASE_URL: "postgres://localhost:1/claro_nowhere", CLARO_PGLITE_DIR: "" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "데이터베이스가 정말 죽어 있다").toBeGreaterThanOrEqual(500);
  const answers: number[] = [];
  page.on("response", (r) => r.request().method() === "POST" && new URL(r.url()).pathname.startsWith("/api/") && answers.push(r.status()));
  const first = await page.reload(); // 같은 탭에서 다시 연다 — 첫 화면
  expect(first!.status(), "첫 화면").toBe(200);
  await expect(card(page, 0).locator('[data-u="headline"]')).toContainText("금리를 올렸어요"); // 누구인지 서버에 못 물어도, 읽던 독자는 기사로 돌아온다
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  await ask(page, 1);
  await readToEnd(page, cdp, 2);
  await expect(count(page)).toHaveText("3/9");
  await expect.poll(() => answers.length, { message: "보내려 했다" }).toBeGreaterThan(0);
  expect(answers.every((s) => s >= 500), `서버의 답 ${answers.join(" ")} — 못 넣었다고 답한다 (거부가 아니다)`).toBe(true);
  expect(await held(page), "사건 넷을 쥐고 있다").toBe(4);

  // 링크 없이 온 사람 — 기사가 지금처럼 뜬다. 처음 온 등록 독자 — 누구인지 못 물었다: 다시 시도하거나 기사만 읽는다 (기록 없이)
  const other = await ctx.newPage();
  expect((await other.goto(`${BASE}/`))!.status()).toBe(200);
  await expect(card(other, 0).locator('[data-u="headline"]')).toContainText("금리를 올렸어요");
  await other.goto(`${BASE}/?r=${READERS.shy}`);
  await expect(other.locator(".s-title")).toHaveText("연결이 잘 안 돼요");
  await other.locator(".s-skip").click(); // 기사만 읽기
  await expect(card(other, 0).locator('[data-u="headline"]')).toContainText("금리를 올렸어요");
  await other.close();

  await kill();
  await start(); // 데이터베이스가 살아났다
  const r = await settledLedger(request, READERS.dbdown, 6, 60_000, BASE);
  expect(lines(r)).toEqual([0, 1, 2].flatMap((i) => [`ENTERED basic ${i}`, `END basic ${i}`]));
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  expect(await readings(request, READERS.shy, BASE), "기사만 읽은 독자 — 기록 없음").toEqual([]);
  await ctx.close();
});

test("배포(Vercel) 빌드 — /test/* 가 닫혀 있다 · /api/peek 가 없다 · 검색을 막는다 · 일반 기사 흐름은 바깥 기사의 링크만 싣는다", async ({ browser }) => {
  test.setTimeout(240_000);
  // 배포와 같은 빌드를 따로 만든다 (VERCEL=1 · 테스트용 바깥 기사 주소 없이)
  const vercel = { ...env, VERCEL: "1", CLARO_DIST: ".next-test-vercel", NEXT_PUBLIC_CLARO_TEST_OUTSIDE_URL: "" };
  execFileSync("node_modules/.bin/next", ["build"], { env: vercel, stdio: "ignore" });
  await start(vercel, "/");
  const status = async (path: string) => (await fetch(`${BASE}${path}`)).status;
  expect([await status("/test/moments"), await status("/test/unknown-type")], "/test/*").toEqual([404, 404]);
  expect([await status("/api/peek"), await status(`/api/peek?user_id=${READERS.killed}`)], "/api/peek").toEqual([404, 404]);
  expect([await status("/"), await status("/news"), await status("/again")]).toEqual([200, 200, 200]);
  expect(await (await fetch(`${BASE}/robots.txt`)).text()).toMatch(/User-Agent: \*\s+Disallow: \/\s*$/i);
  for (const path of ["/", "/news", "/again"]) expect(await (await fetch(`${BASE}${path}`)).text(), path).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
  const page = await (await browser.newContext(phone)).newPage();
  await page.goto(`${BASE}/news?r=${READERS.news}`);
  // 바깥 기사가 정해졌다 (study/flows.ts) — 흐름이 열려 있다: 안내부터. 링크는 그 주소로, 새 창으로
  await expect(page.locator(".s-title")).toHaveText("읽기 전에 알려 드려요");
  await page.locator(".s-go").tap();
  await page.locator(".s-skip").tap();
  await expect(page.locator("a.s-out")).toHaveAttribute("href", "https://news.tf.co.kr/read/world/2366861.htm");
  await expect(page.locator("a.s-out")).toHaveAttribute("target", "_blank");
  expect(await page.locator("body").innerText(), "남의 기사 글을 싣지 않는다 — 링크와 안내뿐").toBe("아래 기사를 읽고 돌아와 주세요\n\n기사는 새 창에서 열려요. 다 읽은 뒤 이 화면으로 돌아와 아래를 눌러 주세요.\n\n기사 읽으러 가기\n다 읽었어요");
  await page.context().close();
});

test("/api/peek 는 CLARO_PEEK=1 이고 Vercel 이 아닐 때만 있다 — 실행할 때 VERCEL 이 있어도 · 값이 없어도 404", async () => {
  test.setTimeout(90_000);
  await start({ VERCEL: "1" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "VERCEL=1 · CLARO_PEEK=1").toBe(404);
  expect((await fetch(`${BASE}/api/peek?user_id=${READERS.killed}`)).status).toBe(404);
  await kill();
  await start({ CLARO_PEEK: "" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "CLARO_PEEK 없음").toBe(404);
});
