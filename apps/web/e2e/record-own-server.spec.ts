// 테스트가 제 서버를 직접 켜고 죽인다 (3102) — 다른 테스트의 서버를 건드리지 않는다. 빌드는 테스트 것(.next-test)을 같이 쓴다. 차례대로 돈다.
//   1. 서버를 죽인 채 세 장을 넘기고 살린다 — **프로세스를 실제로 죽인다** (SIGKILL). 요청을 끊는 흉내가 아니다
//   2. 데이터베이스가 죽은 채 첫 화면을 연다 — 기사는 뜬다 (D35). 기록은 쥐고 있다가 데이터베이스가 살아나면 보낸다
//   3. 배포(Vercel)에는 /api/peek 가 없다 — CLARO_PEEK=1 이 들어가도 (D35)
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { testDatabase } from "./database";
import { lines, readings, settledLedger } from "./ledger";
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
const held = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find((k) => k.startsWith("claro:reading:"))!)!).unsent.length);

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
  await page.goto(`${BASE}/?r=${READERS.killed}`);
  await page.locator(".r-deck").waitFor();
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

test("데이터베이스가 죽은 채 첫 화면을 연다 → 기사는 뜬다. 기록은 쥐고 있다가 데이터베이스가 살아나면 간다", async ({ browser, request }) => {
  test.setTimeout(180_000);
  // 데이터베이스가 없는 곳을 가리킨다 (아무도 듣지 않는 포트). 서버는 켜지고, 데이터베이스에 닿는 길만 죽어 있다
  await start({ DATABASE_URL: "postgres://localhost:1/claro_nowhere", CLARO_PGLITE_DIR: "" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "데이터베이스가 정말 죽어 있다").toBeGreaterThanOrEqual(500);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const answers: number[] = [];
  page.on("response", (r) => new URL(r.url()).pathname.startsWith("/api/") && answers.push(r.status()));
  const first = await page.goto(`${BASE}/?r=${READERS.dbdown}`);
  expect(first!.status(), "첫 화면").toBe(200);
  await expect(card(page, 0).locator('[data-u="headline"]')).toContainText("금리를 올렸어요");
  await readToEnd(page, cdp, 0);
  await ask(page, 0);
  await readToEnd(page, cdp, 1);
  await ask(page, 1);
  await readToEnd(page, cdp, 2);
  await expect(count(page)).toHaveText("3/9");
  await expect.poll(() => answers.length, { message: "보내려 했다" }).toBeGreaterThan(0);
  expect(answers.every((s) => s >= 500), `서버의 답 ${answers.join(" ")} — 못 넣었다고 답한다 (거부가 아니다)`).toBe(true);
  expect(await held(page), "plan 1 + 사건 6 을 쥐고 있다").toBe(7);

  await kill();
  await start(); // 데이터베이스가 살아났다
  const r = await settledLedger(request, READERS.dbdown, 6, 60_000, BASE);
  expect(lines(r)).toEqual([0, 1, 2].flatMap((i) => [`ENTERED basic ${i}`, `END basic ${i}`]));
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  await ctx.close();
});

test("배포(Vercel)에는 /api/peek 가 없다 — CLARO_PEEK=1 이 들어가도. 값이 없으면 어디서도 없다", async () => {
  test.setTimeout(90_000);
  await start({ VERCEL: "1" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "VERCEL=1 · CLARO_PEEK=1").toBe(404);
  expect((await fetch(`${BASE}/api/peek?user_id=${READERS.killed}`)).status).toBe(404);
  await kill();
  await start({ CLARO_PEEK: "" }, "/");
  expect((await fetch(`${BASE}/api/peek`)).status, "CLARO_PEEK 없음").toBe(404);
});
