// F-E2 스크린샷 (390×844) — 첫 화면 "오늘" · 긴 이야기 셋의 표지 (번호 화면 규칙) · 남음 장면 · 짧은 이야기 넷 장면 · 개념 지도.
//   pnpm --filter @claro/web exec tsx scripts/shots-fe2.ts <주소> <이름 앞머리>
//   예: tsx scripts/shots-fe2.ts http://localhost:3310 local   ·   tsx scripts/shots-fe2.ts https://claro-lime-one.vercel.app live
// 그림은 logs/frontend/F-E2/<앞머리>-*.png. 브라우저는 이 Mac 의 Chrome (playwright.config.ts 와 같다)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3310";
const PRE = process.argv[3] ?? "local";
const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-E2");
mkdirSync(OUT, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}-${name}.png`) });
const calm = (page: Page) => page.waitForTimeout(1100);
const LONG = [
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
const scrollTo = async (top: number) => {
  await page.locator(".ep-scroll").evaluate((el, top) => el.scrollTo({ top }), top);
  await page.waitForTimeout(250);
};

// 첫 화면 — 위에서 아래로
await go("/");
await shot(page, "home-1");
const height = await page.locator(".ep-scroll").evaluate((el) => el.scrollHeight);
for (let i = 2, top = 760; top < height - 100; i += 1, top += 760) {
  await scrollTo(top);
  await shot(page, `home-${i}`);
}
// 지난 이야기 30초 (이어지는 이야기 — 금리)
await page.getByTestId("recap-fomc").locator("summary").scrollIntoViewIfNeeded();
await page.getByTestId("recap-fomc").locator("summary").click();
await page.waitForTimeout(300);
await shot(page, "home-recap");

// 긴 이야기 — 표지 (번호 화면 규칙) · 첫 장면들의 머리 · 남음 장면 · 지도
for (const e of LONG) {
  await go(e.path);
  await shot(page, `${e.id}-cover`);
  let i = 0;
  while ((await page.locator(".ep-root").getAttribute("data-scene")) !== "keep") {
    if ((await page.locator("[data-testid=lab-gate-open]").count()) > 0) await page.locator("[data-testid=lab-gate-open]").click();
    await page.locator("[data-testid=ask]").click();
    await calm(page);
    i += 1;
    if (i <= 2) await shot(page, `${e.id}-scene-${i + 1}`);
  }
  await shot(page, `${e.id}-keep`);
  await scrollTo(99999);
  await shot(page, `${e.id}-keep-end`);
  await page.locator("[data-testid=map-button]").click();
  await calm(page);
  await shot(page, `${e.id}-map`);
  await page.locator("[data-testid=map-view]").evaluate((el) => el.scrollTo({ top: 99999 }));
  await page.waitForTimeout(250);
  await shot(page, `${e.id}-map-shelf`);
}

// 짧은 이야기 — 장면 넷
await go("/short/pipc-hospital");
await shot(page, "short-1-cover");
for (const [i, scene] of ["where", "why", "keep"].entries()) {
  await page.locator("[data-testid=ask]").click();
  await calm(page);
  await shot(page, `short-${i + 2}-${scene}`);
}
await scrollTo(99999);
await shot(page, "short-4-keep-end");

// 개념 지도
await go("/map");
await shot(page, "map-1");
await scrollTo(99999);
await shot(page, "map-2");

await browser.close();
console.log(status.join("\n"));
