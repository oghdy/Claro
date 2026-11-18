// UX-13 스크린샷 — 폰 크기 (390×844 · 360 폭 한 장). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/start/shots.ts http://localhost:3213 [나갈 폴더]
// 찍는 것: 시작 첫 화면 · 시작 끝까지 · 달력 화면 (처음 · 다른 날 누른 뒤 · 가장 새 날 + "그 전" · ?many=1) · 실제 / (견줌) · /map · 360 폭 시작.
// 재는 것: 가로 넘침 · 문 둘이 첫 화면 (844) 안에 드는가 · 누를 곳의 키 · 잘린 글 · 두 문과 돌아가는 길이 닿는 곳
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3213";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-13"));
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
// (tsx 가 안쪽 함수에 이름표 도우미를 붙여 브라우저에서 못 돈다 → 글자열로 넘긴다)
const MEASURE = `(() => {
  var box = function (sel) { return Array.from(document.querySelectorAll(sel)).map(function (el) { var r = el.getBoundingClientRect(); return { h: Math.round(r.height), bottom: Math.round(r.bottom) }; }); };
  var min = function (xs) { return xs.length ? Math.min.apply(null, xs) : null; };
  var root = document.documentElement, scroller = document.querySelector(".ep-scroll");
  return {
    overflowX: Math.max(root.scrollWidth - root.clientWidth, scroller.scrollWidth - scroller.clientWidth),
    page: scroller.scrollHeight,
    stories: box(".sp-story").length,
    storyMin: min(box(".sp-story").map(function (b) { return b.h; })),
    doors: box(".sp-door").map(function (b) { return b.h; }),
    doorsBottom: min(box(".sp-door").map(function (b) { return b.bottom; })),
    rows: box(".hc-row").length,
    cellMin: min(box("button.hf-cell").map(function (b) { return b.h; })),
    clipped: Array.from(document.querySelectorAll(".sp-story-title, .sp-door strong, .sp-door-sub, .sp-head h1, .hc-row-title, .sp-days-title")).filter(function (el) { return el.scrollWidth > el.clientWidth + 1; }).length,
  };
})()`;
const measure = (page: Page) => page.evaluate(MEASURE);
const bottom = (page: Page) => page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight));

const browser = await chromium.launch({ channel: "chrome" });
for (const width of [390, 360]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const pre = width === 390 ? "" : "360-";

  let res = await page.goto(`${BASE}/lab/start`);
  await page.waitForTimeout(900);
  console.log(`${pre}start`, res!.status(), JSON.stringify(await measure(page)), "· 머리:", await page.getByTestId("head").innerText());
  await shot(page, `${pre}1-start`);
  if (width === 390) {
    await bottom(page);
    await page.waitForTimeout(250);
    await shot(page, "2-start-end");
  }

  res = await page.goto(`${BASE}/lab/start/days`);
  await page.waitForTimeout(900);
  console.log(`${pre}days`, res!.status(), JSON.stringify(await measure(page)));
  if (width === 390) {
    const picked = page.getByTestId("picked");
    await shot(page, "3-days");
    console.log("days 처음 고른 날", await picked.getAttribute("data-day"), "·", await page.locator("button.hf-cell[aria-pressed=true]").getAttribute("aria-label"));
    await page.locator('button.hf-cell[data-day="2026-11-15"]').tap();
    await page.waitForTimeout(300);
    console.log("days 2026-11-15 누름 →", await picked.getAttribute("data-day"), (await picked.locator(".hc-row-title").allInnerTexts()).join(" | "));
    await shot(page, "4-days-other");
    await page.locator("button.hf-cell[data-newest]").tap();
    await page.waitForTimeout(300);
    console.log("days 가장 새 날 누름 →", (await picked.locator(".hf-list-head").innerText()).replace(/\n/g, " "), "|", (await picked.locator(".hc-row-title").allInnerTexts()).join(" | "));
    await page.locator(".hf-before summary").tap();
    await page.waitForTimeout(300);
    await shot(page, "5-days-newest-before");

    res = await page.goto(`${BASE}/lab/start/days?many=1`);
    await page.waitForTimeout(900);
    console.log("days-many", res!.status(), JSON.stringify(await measure(page)));
    await shot(page, "6-days-many");

    // 문 둘 · 돌아가는 길 · 오늘 이야기 — 눌러서 닿는 곳
    await page.goto(`${BASE}/lab/start`);
    await page.getByTestId("door-days").tap();
    await page.waitForURL("**/lab/start/days");
    console.log("문 ① 지난 이야기 →", new URL(page.url()).pathname);
    await page.getByTestId("back").tap();
    await page.waitForURL("**/lab/start");
    console.log("달력의 돌아가는 길 →", new URL(page.url()).pathname);
    await page.getByTestId("door-map").tap();
    await page.waitForURL("**/map");
    console.log("문 ② 개념 지도 →", new URL(page.url()).pathname);
    await page.waitForTimeout(900);
    await shot(page, "8-map");
    await page.goto(`${BASE}/lab/start`);
    const first = page.locator(".sp-story").first();
    const href = await first.getAttribute("href");
    await first.tap();
    await page.waitForURL(`**${href}`);
    console.log("오늘 첫 이야기 →", new URL(page.url()).pathname);

    res = await page.goto(`${BASE}/`);
    await page.waitForTimeout(900);
    console.log("실제 /", res!.status(), "키", await page.locator(".ep-scroll").evaluate((el) => el.scrollHeight));
    await shot(page, "7-real-home");
  }
  console.log(`폭 ${width} 페이지 오류 ${errors.length}`, errors.join(" | "));
  await context.close();
}
// 스크립트 없이 (첫 HTML) — 시작 화면의 이야기 · 문 둘 · 달력 화면의 처음 고른 날이 서버 그림에 있다
const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, javaScriptEnabled: false });
const p = await noJs.newPage();
await p.goto(`${BASE}/lab/start`);
console.log("스크립트 없이 start — 머리", await p.getByTestId("head").innerText(), "· 이야기", await p.locator(".sp-story").count(), "· 문", (await p.locator(".sp-door").evaluateAll((els) => els.map((el) => el.getAttribute("href")))).join(" "));
await p.goto(`${BASE}/lab/start/days`);
console.log("스크립트 없이 days — 고른 날", await p.getByTestId("picked").getAttribute("data-day"), "· 제목", (await p.locator(".hf-list .hc-row-title").allInnerTexts()).join(" | "));
await noJs.close();
await browser.close();
