// UX-13b 스크린샷 — 폰 크기 (390×844 · 360 폭 한 장). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/start/shots.ts http://localhost:3214 [나갈 폴더]
// 찍는 것: 시작 (지금 목록 · 견본 하나 · 셋 · 넷 · 긴 이야기) · 달력 (처음 · 이야기 끝에서 올 때 ?d= · 견본) · 실제 이야기 끝 둘 (지금 — /s/oil/1 · /short/suneung-alert 을 끝까지 넘겨서) · 끝 견본 둘 · 360 폭 시작.
// 재는 것: 가로 넘침 · 화면 키 · 이야기마다 들어가기 단추가 있는가 (수 · 키) · 잘린 글 · 눌러서 닿는 곳 (이야기마다 · 문 둘 · 달력 줄 · 끝 견본의 단추)
// (UX-13 때의 그림은 logs/frontend/UX-13/ 에 그대로 있다 — 앞 ↔ 뒤 견줌은 그 그림과)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3214";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-13b"));
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
// (tsx 가 안쪽 함수에 이름표 도우미를 붙여 브라우저에서 못 돈다 → 글자열로 넘긴다)
const MEASURE = `(() => {
  var box = function (sel) { return Array.from(document.querySelectorAll(sel)).map(function (el) { var r = el.getBoundingClientRect(); return { h: Math.round(r.height), bottom: Math.round(r.bottom) }; }); };
  var min = function (xs) { return xs.length ? Math.min.apply(null, xs) : null; };
  var root = document.documentElement, scroller = document.querySelector(".ep-scroll");
  return {
    overflowX: Math.max(root.scrollWidth - root.clientWidth, scroller.scrollWidth - scroller.clientWidth),
    page: scroller.scrollHeight,
    stories: box(".sp-story").length,
    go: box(".sp-story-go").map(function (b) { return b.h; }),
    doors: box(".sp-door").map(function (b) { return b.h; }),
    doorsBottom: min(box(".sp-door").map(function (b) { return b.bottom; })),
    rows: box(".hc-row").length,
    rowMin: min(box(".hc-row").map(function (b) { return b.h; })),
    cellMin: min(box("button.hf-cell").map(function (b) { return b.h; })),
    clipped: Array.from(document.querySelectorAll(".sp-story-title, .sp-door strong, .sp-head h1, .sp-tagline, .hc-row-title, .sp-days-title, .sp-end-go")).filter(function (el) { return el.scrollWidth > el.clientWidth + 1; }).length,
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
  const open = async (name: string, url: string) => {
    const res = await page.goto(`${BASE}${url}`);
    await page.waitForTimeout(900);
    console.log(`${pre}${name}`, res!.status(), JSON.stringify(await measure(page)));
  };

  await open("start", "/lab/start");
  console.log("  머리:", await page.getByTestId("head").innerText(), "· 이야기마다 단추:", (await page.locator(".sp-story").evaluateAll((els) => els.map((el) => `${el.getAttribute("href")} [${el.querySelector(".sp-story-go")?.textContent}]`))).join(" · "));
  await shot(page, `${pre}1-start`);
  if (width === 390) {
    for (const [n, name] of [["1", "2-start-one"], ["3", "3-start-three"], ["4", "4-start-four"], ["long", "5-start-long"]] as const) {
      await open(`start?n=${n}`, `/lab/start?n=${n}`);
      await shot(page, name);
    }

    await open("days", "/lab/start/days");
    const picked = page.getByTestId("picked");
    console.log("  처음 고른 날", await picked.getAttribute("data-day"), "· 누를 날", (await page.locator("button.hf-cell").evaluateAll((els) => els.map((el) => el.getAttribute("data-day")))).join(" "));
    await shot(page, "6-days");
    await page.locator('button.hf-cell[data-day="2026-11-15"]').tap();
    await page.waitForTimeout(300);
    console.log("  2026-11-15 누름 →", await picked.getAttribute("data-day"), (await picked.locator(".hc-row-title").allInnerTexts()).join(" | "));
    await page.locator(".hf-before summary").tap();
    await page.waitForTimeout(300);
    await shot(page, "7-days-other-before");
    await open("days?d=2026-11-18", "/lab/start/days?d=2026-11-18");
    console.log("  ?d=2026-11-18 → 고른 날", await picked.getAttribute("data-day"), (await picked.locator(".hf-list-head").innerText()).replace(/\n/g, " "));
    await shot(page, "8-days-from-end");
    await open("days?many=1", "/lab/start/days?many=1");
    await shot(page, "9-days-many");

    // 실제 이야기의 끝 장면 (지금) — 물음 단추로 끝까지 넘긴다
    for (const [name, url] of [["10-end-now-long", "/s/oil/1"], ["11-end-now-short", "/short/suneung-alert"]] as const) {
      await page.goto(`${BASE}${url}`);
      await page.waitForTimeout(1200);
      const root = page.locator(".ep-root");
      for (let i = 0; i < 14 && (await root.getAttribute("data-scene")) !== "keep"; i++) {
        // 체험을 마치기 전에는 아래가 접혀 있다 — "그냥 열어 보기"로 연다
        const gate = page.locator(".ep-gate button");
        if (await gate.count()) await gate.first().click().catch(() => {});
        await page.getByTestId("ask").click();
        await page.waitForTimeout(700);
      }
      await page.waitForTimeout(1500);
      const acts = await page.locator(".ep-scene a, .ep-scene button:not(.ep-node)").evaluateAll((els) => els.map((el) => `${(el.textContent ?? "").trim().slice(0, 14)}${el.getAttribute("href") ? `→${el.getAttribute("href")}` : ""}`));
      console.log(`실제 끝 ${url}`, await root.getAttribute("data-scene"), "키", await page.locator(".ep-scroll").evaluate((el) => el.scrollHeight), "· 누를 것", acts.length, ":", acts.join(" | "));
      await shot(page, `${name}-top`);
      await bottom(page);
      await page.waitForTimeout(400);
      await shot(page, `${name}-bottom`);
    }
    await open("end", "/lab/start/end");
    await shot(page, "12-end-sample-short");
    await open("end?k=long", "/lab/start/end?k=long");
    await shot(page, "13-end-sample-long-top");
    await bottom(page);
    await page.waitForTimeout(400);
    await shot(page, "13-end-sample-long-bottom");

    // 눌러서 닿는 곳
    for (const i of [0, 1]) {
      await page.goto(`${BASE}/lab/start`);
      const story = page.locator(".sp-story").nth(i);
      const href = await story.getAttribute("href");
      await story.locator(".sp-story-go").tap();
      await page.waitForURL(`**${href}`);
      console.log(`시작 · 이야기 ${i + 1} 의 단추 →`, new URL(page.url()).pathname);
    }
    await page.goto(`${BASE}/lab/start`);
    await page.getByTestId("door-days").tap();
    await page.waitForURL("**/lab/start/days");
    console.log("문 ① 지난 이야기 →", new URL(page.url()).pathname);
    const row = page.locator(".hf-list .hc-row").first();
    const rowHref = await row.getAttribute("href");
    const b = (await row.boundingBox())!;
    await page.touchscreen.tap(b.x + b.width - 22, b.y + b.height / 2); // 줄 오른쪽의 동그란 들어가기
    await page.waitForURL(`**${rowHref}`);
    console.log("달력 · 첫 줄의 동그란 단추 →", new URL(page.url()).pathname);
    await page.goto(`${BASE}/lab/start/days`);
    await page.getByTestId("back").tap();
    await page.waitForURL("**/lab/start");
    console.log("달력의 ‹ →", new URL(page.url()).pathname);
    await page.getByTestId("door-map").tap();
    await page.waitForURL("**/map");
    console.log("문 ② 개념 지도 →", new URL(page.url()).pathname);
    await page.goto(`${BASE}/lab/start/end`);
    await page.getByTestId("end-go").tap();
    await page.waitForURL("**/lab/start/days?d=*");
    await page.waitForTimeout(500);
    console.log("끝 견본의 단추 →", new URL(page.url()).pathname + new URL(page.url()).search, "· 고른 날", await page.getByTestId("picked").getAttribute("data-day"));

    const res = await page.goto(`${BASE}/`);
    console.log("실제 /", res!.status(), "키", await page.locator(".ep-scroll").evaluate((el) => el.scrollHeight));
  }
  console.log(`폭 ${width} 페이지 오류 ${errors.length}`, errors.join(" | "));
  await context.close();
}
// 스크립트 없이 (첫 HTML) — 시작 화면의 이야기 · 단추 · 문 둘 · 달력 화면의 처음 고른 날이 서버 그림에 있다
const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, javaScriptEnabled: false });
const p = await noJs.newPage();
await p.goto(`${BASE}/lab/start`);
console.log("스크립트 없이 start — 머리", await p.getByTestId("head").innerText(), "· 이야기", await p.locator(".sp-story").count(), "· 단추", await p.locator(".sp-story-go").count(), "· 문", (await p.locator(".sp-door").evaluateAll((els) => els.map((el) => el.getAttribute("href")))).join(" "));
await p.goto(`${BASE}/lab/start/days`);
console.log("스크립트 없이 days — 고른 날", await p.getByTestId("picked").getAttribute("data-day"), "· 제목", (await p.locator(".hf-list .hc-row-title").allInnerTexts()).join(" | "));
await noJs.close();
await browser.close();
