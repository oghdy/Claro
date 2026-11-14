// UX-7 스크린샷 — 아이폰 크기 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/today/shots.ts http://localhost:3210 [나갈 폴더]
// 찍는 것: 오늘 화면 × 색 넷 (위에서부터) · 짧은 이야기 × 색 넷 (장면 넷) · 회차 화면 하나 (개인정보 — 표지 · 넘겨 보기 · 남음 · 지도) × 색 넷 · 금리 표지 × 색 넷
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import { PALETTES } from "./palette/palettes";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-7"));
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const settle = (page: Page, ms = 1300) => page.waitForTimeout(ms);
/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function scroll(page: Page, name: string, max = 9) {
  const scroller = page.locator(".ep-scroll");
  const { h, view } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight }));
  const n = Math.min(max, Math.max(1, Math.ceil((h - 24) / (view - 60))));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 60));
    await page.waitForTimeout(250);
    await shot(page, `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}`);
  }
}
const ask = async (page: Page) => {
  await page.getByTestId("ask").click();
  await settle(page);
};

const browser = await chromium.launch({ channel: "chrome" });
for (const { id } of PALETTES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();

  // 오늘
  await page.goto(`${BASE}/lab/today?c=${id}`);
  await settle(page);
  await scroll(page, `today-${id}`, 4);
  await page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, 0));
  await page.getByTestId("recap-fomc").locator("summary").scrollIntoViewIfNeeded();
  await page.getByTestId("recap-fomc").locator("summary").click();
  await page.waitForTimeout(300);
  await shot(page, `today-${id}-recap`);

  // 짧은 이야기 — 장면 넷
  await page.goto(`${BASE}/lab/today/short`);
  await settle(page);
  await shot(page, `short-${id}-1-cover`);
  await ask(page);
  await scroll(page, `short-${id}-2-where`, 3);
  await ask(page);
  await scroll(page, `short-${id}-3-why`, id === "paper" ? 2 : 1);
  if (id === "paper" || id === "mist") {
    // 근거 — 문장을 누르면 원문 구절
    await page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, 0));
    await page.getByTestId("src-toggle").click();
    await page.locator(".ep-src-hit").nth(1).click();
    await settle(page, 700);
    await shot(page, `short-${id}-3-why-src`);
    await page.locator(".ep-sheet header button").click();
    await page.getByTestId("src-toggle").click();
    await page.waitForTimeout(400);
  }
  await ask(page);
  await settle(page, 1600);
  await scroll(page, `short-${id}-4-keep`, 3);

  // 지도 견본
  await page.goto(`${BASE}/lab/today/map`);
  await settle(page);
  await shot(page, `map-${id}`);

  // 회차 화면 하나 — 개인정보 (넘겨 보기 · ★ · 지도)
  await page.goto(`${BASE}/lab/episode/pipc`);
  await settle(page);
  await shot(page, `episode-${id}-1-cover`);
  for (let i = 0; i < 4 && (await page.locator(".ep-root").getAttribute("data-scene")) !== "aha"; i++) {
    // 도구 줍기 — "이거 알아요?" 에 하나는 알아요 · 나머지는 처음 들어요 (새것 / 알던 것 두 색이 다 보이게)
    if ((await page.locator(".ep-root").getAttribute("data-scene")) === "tools") {
      const asks = page.locator(".ep-tool-ask");
      let first = true;
      while ((await asks.count()) > 0) {
        await asks.first().locator("button").nth(first ? 0 : 1).click();
        first = false;
        await page.waitForTimeout(350);
      }
      await settle(page, 600);
      if (id === "mist" || id === "night") await shot(page, `episode-${id}-2-tools`);
    }
    await ask(page);
  }
  // 넘겨 보기 — 칸을 끝까지 넘긴다
  const lab = page.getByTestId("lab");
  await page.locator(".ep-scroll").evaluate((el) => {
    const x = el.querySelector<HTMLElement>("[data-testid=lab]")!;
    el.scrollTo(0, x.offsetTop - 70);
  });
  for (let i = 0; i < 8 && (await page.getByTestId("lab-gate").count()) > 0; i++) {
    await lab.getByTestId("lab-act").click();
    await page.waitForTimeout(900);
    // ★ 칸 (알림을 받고도 대응을 소홀히) 이 막 넘어온 때
    if (i === 3) await shot(page, `episode-${id}-3-lab-mid`);
  }
  await settle(page, 900);
  await page.locator(".ep-scroll").evaluate((el) => {
    const x = el.querySelector<HTMLElement>("[data-testid=lab]")!;
    el.scrollTo(0, x.offsetTop - 70);
  });
  await page.waitForTimeout(300);
  await page.locator(".ep-scroll").evaluate((el) => {
    const x = el.querySelector<HTMLElement>(".ep-flip");
    if (x) el.scrollTo(0, x.offsetTop - 120);
  });
  await page.waitForTimeout(300);
  await shot(page, `episode-${id}-4-flip`);
  for (let i = 0; i < 4 && (await page.locator(".ep-root").getAttribute("data-scene")) !== "keep"; i++) {
    if ((await page.getByTestId("lab-gate").count()) > 0) await page.getByTestId("lab-gate-open").click();
    const pending = page.locator(".ep-tool-ask");
    while ((await pending.count()) > 0) {
      await pending.first().locator("button").nth(1).click();
      await page.waitForTimeout(350);
    }
    await ask(page);
  }
  await settle(page, 2200);
  await shot(page, `episode-${id}-5-keep`);
  await page.getByTestId("map-button").click();
  await settle(page, 900);
  await shot(page, `episode-${id}-6-map`);

  // 금리 2화 표지 (이어지는 이야기 — 시리즈 줄)
  await page.goto(`${BASE}/lab/episode/fomc`);
  await settle(page);
  await shot(page, `episode-fomc-${id}-cover`);
  await context.close();
}

// 견줄 것 — 지금의 실제 첫 화면 (종이 톤 · "1화" 표시)
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await settle(page);
  await shot(page, "real-home");
  await page.goto(`${BASE}/s/privacy/1`);
  await settle(page);
  await shot(page, "real-privacy-cover");
  await context.close();
}
await browser.close();

// 색 넷을 나란히 — PM · 도윤이 한눈에 견주게 (sheet-*.png). 파이썬 PIL 이 있으면 만든다 (없으면 건너뛴다)
try {
  const { execFileSync } = await import("node:child_process");
  const py = `
import sys
from PIL import Image
out, names = sys.argv[1], sys.argv[2:]
ims = [Image.open(n) for n in names]
w, h = ims[0].width // 2, ims[0].height // 2
sheet = Image.new("RGB", (w * len(ims) + 12 * (len(ims) - 1), h), "#7a7a7a")
for i, im in enumerate(ims):
    sheet.paste(im.resize((w, h)), (i * (w + 12), 0))
sheet.save(out)
`;
  const ids = PALETTES.map((p) => p.id);
  for (const [name, pattern] of [
    ["sheet-today", "today-{id}"],
    ["sheet-today-list", "today-{id}-b"],
    ["sheet-short-cover", "short-{id}-1-cover"],
    ["sheet-short-flip", "short-{id}-2-where-b"],
    ["sheet-short-keep", "short-{id}-4-keep"],
    ["sheet-episode-cover", "episode-{id}-1-cover"],
    ["sheet-episode-lab", "episode-{id}-3-lab-mid"],
    ["sheet-episode-map", "episode-{id}-6-map"],
  ] as const)
    execFileSync("python3", ["-c", py, path.join(OUT, `${name}.png`), ...ids.map((id) => path.join(OUT, `${pattern.replace("{id}", id)}.png`))]);
  console.log("나란히 놓은 그림 8 (sheet-*.png)");
} catch (e) {
  console.log(`나란히 놓은 그림은 건너뛰었다 — ${String(e).slice(0, 120)}`);
}
console.log(`찍었다 → ${OUT}`);
