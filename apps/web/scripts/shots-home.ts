// 첫 화면 (/) 스크린샷 — 폰 390×844 (2배) · 데스크톱 1280. 켜 둔 서버를 찍는다 (테스트가 아니다 · F-E4 의 앞 · 뒤 그림이 이것으로 찍혔다).
//   pnpm --filter @claro/web exec tsx scripts/shots-home.ts http://localhost:3210 before|after [나갈 폴더]
// 찍는 것: <이름>-1 ~ n (위에서부터 화면 높이만큼씩 — 앞 · 뒤가 같은 자리) · <이름>-full (첫 화면 전체 한 장) · <이름>-first-paint (열고 0.25초 — 처음 그릴 때 글이 흐린가) · <이름>-desktop (1280×900)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3210";
const NAME = process.argv[3] ?? "after";
const OUT = path.resolve(process.argv[4] ?? path.join(import.meta.dirname, "../../../logs/frontend/F-E4"));
mkdirSync(OUT, { recursive: true });
const file = (s: string) => path.join(OUT, `${NAME}-${s}.png`);
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const browser = await chromium.launch({ channel: "chrome" });
{
  const page = await (await browser.newContext(PHONE)).newPage();
  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForSelector("[data-testid=home]");
  await page.waitForTimeout(250);
  await page.screenshot({ path: file("first-paint") });
  await page.waitForTimeout(1300);
  const scroller = page.locator(".ep-scroll");
  const { h, view } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight }));
  const n = Math.max(1, Math.ceil((h - 24) / (view - 60)));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 60));
    await page.waitForTimeout(250);
    await page.screenshot({ path: file(String(i + 1)) });
  }
  console.log(`${NAME}: 폰 ${n} 장 · 전체 높이 ${h}px`);
  // 전체 한 장 — 화면 높이를 글 높이만큼 늘려서
  await page.setViewportSize({ width: 390, height: h });
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: file("full") });
}
{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: file("desktop") });
}
await browser.close();
