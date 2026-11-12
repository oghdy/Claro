// F-E1 스크린샷 (390×844) — 첫 화면 · 회차 셋의 표지 · 체험 · 지도 · 옛 화면의 새 주소.
//   pnpm --filter @claro/web exec tsx scripts/shots-fe1.ts <주소> <이름 앞머리>
//   예: tsx scripts/shots-fe1.ts http://localhost:3310 local   ·   tsx scripts/shots-fe1.ts https://claro-lime-one.vercel.app live
// 그림은 logs/frontend/F-E1/<앞머리>-*.png. 브라우저는 이 Mac 의 Chrome (playwright.config.ts 와 같다)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3310";
const PRE = process.argv[3] ?? "local";
const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-E1");
mkdirSync(OUT, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}-${name}.png`) });
const calm = (page: Page) => page.waitForTimeout(1100);
const EPISODES = [
  { id: "price-1", path: "/s/price/1" },
  { id: "rate-2", path: "/s/rate/2" },
  { id: "privacy-1", path: "/s/privacy/1" },
];

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const status: string[] = [];
const go = async (p: string) => {
  const r = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  status.push(`${r!.status()} ${p}`);
  await page.evaluate(() => document.fonts.ready);
  await calm(page);
};

await go("/");
await shot(page, "home-1");
for (const [i, top] of [700, 1400, 99999].entries()) {
  await page.locator(".ep-scroll").evaluate((el, top) => el.scrollTo({ top }), top);
  await page.waitForTimeout(250);
  await shot(page, `home-${i + 2}`);
}

for (const e of EPISODES) {
  await go(e.path);
  await shot(page, `${e.id}-cover`);
  // 풀이 장면까지 — 처음 온 독자의 조립 (표지 → 0화 → 사건 → 도구 → 풀이)
  while ((await page.locator(".ep-root").getAttribute("data-scene")) !== "aha") {
    await page.locator("[data-testid=ask]").click();
    await calm(page);
  }
  await shot(page, `${e.id}-lab`);
  await page.locator("[data-testid=lab]").first().scrollIntoViewIfNeeded().catch(() => {});
  await page.locator(".ep-scroll").evaluate((el) => el.scrollBy({ top: 420 }));
  await page.waitForTimeout(300);
  await shot(page, `${e.id}-lab-2`);
  await page.locator("[data-testid=lab-gate]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, `${e.id}-lab-gate`);
  await page.locator("[data-testid=lab-gate-open]").click();
  await calm(page);
  while ((await page.locator(".ep-root").getAttribute("data-scene")) !== "keep") {
    await page.locator("[data-testid=ask]").click();
    await calm(page);
  }
  await page.waitForTimeout(1600); // 지도가 자란다
  await shot(page, `${e.id}-keep`);
  await page.locator(".ep-scroll").evaluate((el) => el.scrollTo({ top: 99999 }));
  await page.waitForTimeout(300);
  await shot(page, `${e.id}-keep-end`);
  await page.locator("[data-testid=open-map]").click();
  await calm(page);
  await shot(page, `${e.id}-map`);
}

// 근거 — 문장을 누르면 원문 구절
await go("/s/rate/2");
await page.locator("[data-testid=src-toggle]").click();
await page.locator(".ep-src-hit").first().click();
await calm(page);
await shot(page, "rate-2-source");

await go("/archive/fomc-2026-09");
await shot(page, "archive-fomc-2026-09");

console.log(status.join("\n"));
await browser.close();
