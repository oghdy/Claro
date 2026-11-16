// F-E6 — 실제 /s/oil/1 을 메운 판 (판 2)으로 바꾸기 앞 · 뒤의 폰 그림 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx scripts/shots-fe6.ts http://localhost:<포트> <나갈 폴더> read v1|v2   /s/oil/1 을 처음부터 끝까지 눌러 가며 (<v>-NN-…) + 첫 화면 (<v>-00-home…) · 근거 시트
//   pnpm --filter @claro/web exec tsx scripts/shots-fe6.ts http://localhost:<포트> <나갈 폴더> same         다른 실제 이야기 (금리 2화 · 배달 · 개인정보 · 짧은 이야기 둘)를 처음부터 끝까지 (움직임 줄임) —
//       장면마다 화면의 뼈 (태그 · 클래스 · data-* · 글 — 움직임의 style 만 뺌)를 .html 로 떠 둔다. 앞 · 뒤 폴더를 `diff -r` 로 견준다
// 번호는 장면의 자리다 (01 표지 · 02 지금까지 · 03 오늘의 사건 · 04 도구 · 05 풀이 누르기 전 · 06 풀이 누른 뒤 · 07 이어짐 · 08 남음).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3311";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../logs/frontend/F-E6"));
const MODE = process.argv[4] ?? "read";
const V = process.argv[5] ?? "v2";
mkdirSync(OUT, { recursive: true });

const NO: Record<string, string> = { cover: "01", zero: "02", event: "03", tools: "04", aha: "05", compare: "06x", next: "07", keep: "08" };
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: MODE === "same" ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const errors: string[] = [];
let wide = 0;
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !m.location().url.endsWith("/favicon.ico") && errors.push(m.text()));

const settle = (ms = 1500) => page.waitForTimeout(ms);
const sceneId = async () => (await page.locator(".ep-root").getAttribute("data-scene")) ?? "";
const bones = (html: string) => html.replace(/ style="[^"]*"/g, "").replace(/></g, ">\n<");

/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function shoot(name: string, sel = ".ep-scroll", root = ".ep-root") {
  const scroller = page.locator(sel);
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  const { h, view, over } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight, over: document.documentElement.scrollWidth > window.innerWidth || el.scrollWidth > el.clientWidth }));
  if (over) wide++;
  if (MODE === "same") {
    writeFileSync(path.join(OUT, `${name}.html`), bones(await page.locator(root).evaluate((el) => el.outerHTML)));
    return;
  }
  const n = Math.max(1, Math.ceil((h - 24) / (view - 80)));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 80));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}.png`) });
  }
}

/** 긴 이야기 하나를 처음부터 끝까지 — 장면마다, 도구는 "처음 들어요", 풀이는 누르기 전 · 뒤 */
async function walk(url: string, prefix: string) {
  const res = await page.goto(`${BASE}${url}`);
  if (res?.status() !== 200) errors.push(`${res?.status()} ${url}`);
  await settle(2000);
  for (let guard = 0; guard < 12; guard++) {
    const id = await sceneId();
    const no = NO[id] ?? "99";
    if (id === "tools" || id === "next") {
      const fresh = page.locator(".ep-tool-ask button[data-primary]");
      while (await fresh.count()) {
        await fresh.first().click();
        await page.waitForTimeout(250);
      }
      await settle(700);
    }
    if (id === "aha") {
      await shoot(`${prefix}-05-aha-before`);
      if (await page.getByTestId("lab-act").count()) {
        await page.getByTestId("lab-act").click();
        await settle(3200);
        if (await page.getByTestId("lab-go-on").count()) {
          await page.getByTestId("lab-go-on").click();
          await settle(1500);
        }
        if (await page.locator(".fr-choose button").count()) {
          await page.locator(".fr-choose button").first().click();
          await settle(2000);
        }
      }
      if (await page.getByTestId("lab-gate-open").count()) {
        await page.getByTestId("lab-gate-open").click();
        await settle(1200);
      }
      await shoot(`${prefix}-06-aha-after`);
      if (MODE === "read") {
        // 근거 시트 — 근거를 켜고 (판 2: 터진 문서 문장 · 판 1: 풀이의 첫 근거 글) 누른다
        await page.getByTestId("src-toggle").click();
        await settle(500);
        const burst = page.locator("[data-testid=burst] .ep-src-hit");
        const mark = (await burst.count()) ? burst.first() : page.locator(".ep-scene .ep-src-hit").first();
        await mark.scrollIntoViewIfNeeded();
        await mark.click();
        await settle(900);
        await page.screenshot({ path: path.join(OUT, `${prefix}-06-aha-after-sheet.png`) });
        await page.locator(".ep-sheet header button").click();
        await settle(500);
        await page.getByTestId("src-toggle").click();
        await settle(400);
      }
    } else {
      await shoot(`${prefix}-${no}-${id}`);
    }
    if (id === "keep" || (await page.getByTestId("ask").count()) === 0) break;
    await page.getByTestId("ask").click();
    await settle();
  }
}

if (MODE === "read") {
  await page.goto(`${BASE}/`);
  await settle(2000);
  await page.screenshot({ path: path.join(OUT, `${V}-00-home.png`) });
  await page.screenshot({ path: path.join(OUT, `${V}-00-home-full.png`), fullPage: true });
  await walk("/s/oil/1", V);
} else {
  for (const [u, p] of [
    ["/s/rate/2", "s-rate-2"],
    ["/s/price/1", "s-price-1"],
    ["/s/privacy/1", "s-privacy-1"],
  ] as const)
    await walk(u, p);
  // 짧은 이야기 둘 · 지도 — 화면 전체의 뼈
  for (const [u, p] of [
    ["/short/meta-gallery", "short-meta"],
    ["/short/license-notice", "short-license"],
  ] as const) {
    const res = await page.goto(`${BASE}${u}`);
    if (res?.status() !== 200) errors.push(`${res?.status()} ${u}`);
    await settle(1500);
    for (let i = 0; i < 8; i++) {
      writeFileSync(path.join(OUT, `${p}-${i}.html`), bones(await page.locator("body").evaluate((el) => el.outerHTML)).replace(/<script[\s\S]*?<\/script>/g, ""));
      const ask = page.getByTestId("ask");
      if (!(await ask.count())) break;
      await ask.first().click();
      await settle(900);
    }
  }
}

await browser.close();
console.log(`찍음 → ${OUT} · 가로 넘침 ${wide} · 콘솔 · 페이지 오류 ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);
