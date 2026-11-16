// UX-10 — 기름값 다시 짜기의 폰 그림 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx scripts/shots-ux10.ts http://localhost:<포트> <나갈 폴더> read   지금 판 (/s/oil/1 → now-NN-…) · 다시 짠 판 (/lab/episode/oil-replot → new-NN-…) 을 처음부터 끝까지 눌러 가며
//   pnpm --filter @claro/web exec tsx scripts/shots-ux10.ts http://localhost:<포트> <나갈 폴더> same   kit 을 고치기 전 · 후에 같은 주소들을 같은 이름으로 (움직임 줄임) — lab/episode/diff.mjs 로 픽셀을 견준다
// 번호는 장면의 자리다 (01 표지 · 02 지금까지 · 03 오늘의 사건 · 04 도구 · 05 풀이 누르기 전 · 06 풀이 누른 뒤 · 07 이어짐 · 08 남음) — 두 판의 같은 장면이 같은 번호로 나란히 놓인다.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3310";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../logs/frontend/UX-10"));
const MODE = process.argv[4] ?? "read";
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

/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function shoot(name: string) {
  const scroller = page.locator(".ep-scroll");
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  const { h, view, over } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight, over: document.documentElement.scrollWidth > window.innerWidth || el.scrollWidth > el.clientWidth }));
  if (over) wide++;
  const n = Math.max(1, Math.ceil((h - 24) / (view - 80)));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 80));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}.png`) });
  }
  // same — 화면의 뼈 (태그 · 클래스 · data-* · 글)도 글자로 떠 둔다. 그림은 같은 빌드를 두 번 찍어도 몇 픽셀 달라서 (글자 가장자리 · 덜 끝난 움직임), 전 · 후가 정말 같은지는 이것으로 본다. 움직임이 쓰는 style 은 뺀다
  if (MODE === "same") writeFileSync(path.join(OUT, `${name}.html`), (await page.locator(".ep-root").evaluate((el) => el.outerHTML)).replace(/ style="[^"]*"/g, "").replace(/></g, ">\n<"));
}

/** 한 이야기를 처음부터 끝까지 — 장면마다 찍고, 도구는 "처음 들어요", 풀이는 누르는 단계마다 */
async function walk(url: string, prefix: string) {
  const res = await page.goto(`${BASE}${url}`);
  if (res?.status() !== 200) errors.push(`${res?.status()} ${url}`);
  await settle(2000);
  for (let guard = 0; guard < 12; guard++) {
    const id = await sceneId();
    const no = NO[id] ?? "99";
    if (id === "tools" || id === "next") {
      // 처음 온 독자 — "이거 알아요?" 에 전부 "처음 들어요" (본문이 펴진다)
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
    } else {
      await shoot(`${prefix}-${no}-${id}`);
    }
    if (id === "keep" || (await page.getByTestId("ask").count()) === 0) break;
    await page.getByTestId("ask").click();
    await settle();
  }
}

if (MODE === "read") {
  await walk("/s/oil/1", "now");
  await walk("/lab/episode/oil-replot", "new");
} else {
  // kit (Episode.tsx · frames/Steps.tsx · LabCard.tsx)을 지나는 실제 주소 전부 + 회차 시안 셋 + 파이프라인 시험판
  const urls: [string, string][] = [
    ["/s/oil/1", "s-oil-1"],
    ["/s/rate/2", "s-rate-2"],
    ["/s/price/1", "s-price-1"],
    ["/s/privacy/1", "s-privacy-1"],
    ["/lab/episode", "lab-delivery"],
    ["/lab/episode/fomc", "lab-fomc"],
    ["/lab/episode/pipc", "lab-pipc"],
    ["/lab/episode/fomc-auto", "lab-fomc-auto"],
  ];
  for (const [u, p] of urls) await walk(u, p);
}

await browser.close();
console.log(`찍음 → ${OUT} · 가로 넘침 ${wide} · 콘솔 · 페이지 오류 ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);
