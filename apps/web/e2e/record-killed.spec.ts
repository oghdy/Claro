// 서버를 죽인 채 세 장을 넘기고 살린다 (B-0.4b). **프로세스를 실제로 죽인다** (SIGKILL) — 요청을 끊는 흉내가 아니다.
// 보는 것: 죽은 동안 화면은 그대로 넘어간다 · 죽기 전의 줄은 원장에 남아 있다 (데이터베이스가 갑자기 죽어도) · 살아나면 쥐고 있던 줄이 간다.
// 제 서버를 따로 켠다 (3102 · .data/test-killed) — 다른 테스트의 서버를 죽이지 않는다. 빌드는 테스트 것(.next-test)을 같이 쓴다
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { lines, readings, settledLedger } from "./ledger";
import { READERS } from "./readers";
import { MOBILE_SE, ask, card, count, readToEnd } from "./reader";

const PORT = 3102;
const BASE = `http://localhost:${PORT}`;
const env = { ...process.env, CLARO_DIST: ".next-test", CLARO_PGLITE_DIR: ".data/test-killed", CLARO_PEEK: "1" };
let server: ChildProcess | undefined;

async function start() {
  server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env, stdio: "ignore" });
  await expect.poll(() => fetch(`${BASE}/api/peek`).then((r) => r.status, () => 0), { timeout: 30_000, message: "서버가 켜졌다" }).toBe(200);
}
async function kill() {
  const gone = new Promise((f) => server!.once("exit", f));
  server!.kill("SIGKILL");
  await gone;
  await expect.poll(() => fetch(`${BASE}/api/peek`).then(() => "살아 있다", () => "죽었다"), { message: "서버가 죽었다" }).toBe("죽었다");
}
test.afterAll(() => void server?.kill("SIGKILL"));

test("서버를 죽인 채 세 장을 넘기고 살린다 → 화면은 그대로 넘어가고, 살아나면 원장에 빠진 줄이 없다", async ({ browser, request }) => {
  test.setTimeout(180_000);
  execFileSync("node_modules/.bin/tsx", ["e2e/setup-db.ts"], { env });
  await start();
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
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
  const held = await page.evaluate(() => JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find((k) => k.startsWith("claro:reading:"))!)!).unsent.length);
  expect(held, "죽은 동안의 사건 여섯을 쥐고 있다").toBe(6);

  await start(); // 같은 데이터베이스 폴더로 다시 켠다 — 갑자기 죽은 뒤에도 열린다
  expect((await readings(request, READERS.killed, BASE)).map((r) => lines(r)), "죽기 전의 줄은 그대로 있다").toEqual([lines(before)]);
  const r = await settledLedger(request, READERS.killed, 10, 60_000, BASE); // 화면은 아무것도 하지 않는다 — 다시 보내기를 기다린다
  expect(lines(r)).toEqual([0, 1, 2, 3, 4].flatMap((i) => [`ENTERED basic ${i}`, `END basic ${i}`]));
  expect(r.events.map((e) => e.seq)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(r.reading_id).toBe(before.reading_id);
  expect(r.check).toEqual({ conforms: true, issues: [], missing_seq: [] });
  expect(r.summary).toMatchObject({ completed: false, stopped_at: { level: "basic", slide_index: 4 }, stopped_end_shown: true });
  await ctx.close();
});
