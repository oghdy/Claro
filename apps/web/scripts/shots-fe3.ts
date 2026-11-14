// F-E3 스크린샷 (390×844) — 첫 화면 (병원 짧은 이야기 없음 · 카드에 체험 표시 없음) · 개인정보 긴 이야기의 남음 (곁의 짧은 이야기 길 없음) ·
// 남은 짧은 이야기 「면허 정지…」 (홀로 선다) · 내린 주소 /short/pipc-hospital (404) · 시안 /lab/today · /lab/today/short (견본은 남음).
//   pnpm --filter @claro/web exec tsx scripts/shots-fe3.ts <주소> <이름 앞머리> [그림 폴더]
//   예: tsx scripts/shots-fe3.ts http://localhost:3310 local /tmp/x   ·   tsx scripts/shots-fe3.ts https://claro-lime-one.vercel.app live
// 그림은 <그림 폴더 — 없으면 logs/frontend/F-E3>/<앞머리>-*.png. 브라우저는 이 Mac 의 Chrome (playwright.config.ts 와 같다)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3310";
const PRE = process.argv[3] ?? "local";
const OUT = process.argv[4] ?? path.join(import.meta.dirname, "../../../logs/frontend/F-E3");
mkdirSync(OUT, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}-${name}.png`) });
const calm = (page: Page) => page.waitForTimeout(1100);

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors: string[] = [];
page.on("console", (m) => (m.type() === "error" ? errors.push(`${page.url()} ${m.text()}`) : undefined));
const status: string[] = [];
const go = async (p: string) => {
  const r = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  status.push(`${r!.status()} ${p}`);
  await page.evaluate(() => document.fonts.ready);
  await calm(page);
};
const scrollTo = async (top: number) => {
  await page.locator(".ep-scroll").first().evaluate((el, top) => el.scrollTo({ top }), top);
  await page.waitForTimeout(250);
};
const scrollAll = async (name: string) => {
  await shot(page, `${name}-1`);
  const height = await page.locator(".ep-scroll").first().evaluate((el) => el.scrollHeight);
  for (let i = 2, top = 760; top < height - 100; i += 1, top += 760) {
    await scrollTo(top);
    await shot(page, `${name}-${i}`);
  }
};
/** 장면을 남음까지 넘긴다 (체험은 "그냥 열어 보기") */
const toKeep = async (root: string) => {
  while ((await page.locator(root).getAttribute("data-scene")) !== "keep") {
    if ((await page.locator("[data-testid=lab-gate-open]").count()) > 0) await page.locator("[data-testid=lab-gate-open]").click();
    await page.locator("[data-testid=ask]").click();
    await calm(page);
  }
};

// 첫 화면 — 위에서 아래로
await go("/");
await scrollAll("home");

// 개인정보 긴 이야기 — 남음 (곁의 짧은 이야기로 가는 길이 없다)
await go("/s/privacy/1");
await toKeep(".ep-root");
await shot(page, "privacy-1-keep");
await scrollTo(99999);
await shot(page, "privacy-1-keep-end");

// 남은 짧은 이야기 — 장면 넷 (홀로 선다)
await go("/short/license-notice");
await shot(page, "short-1-cover");
for (const [i, scene] of ["where", "why", "keep"].entries()) {
  await page.locator("[data-testid=ask]").click();
  await calm(page);
  await shot(page, `short-${i + 2}-${scene}`);
}
await scrollTo(99999);
await shot(page, "short-4-keep-end");

// 내린 주소 · 지도
await go("/short/pipc-hospital");
await shot(page, "gone-pipc-hospital");
await go("/map");
await shot(page, "map-1");

// 시안 — 견본은 남는다
await go("/lab/today");
await scrollAll("lab-today");
await go("/lab/today/short");
await shot(page, "lab-short-cover");
await toKeep("[data-testid=short]");
await scrollTo(99999);
await shot(page, "lab-short-keep-end");

await browser.close();
console.log(status.join("\n"));
console.log(errors.length ? `콘솔 오류 ${errors.length}\n${errors.join("\n")}` : "콘솔 오류 0");
