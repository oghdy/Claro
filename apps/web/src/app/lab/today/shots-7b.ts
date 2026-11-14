// UX-7b 스크린샷 — 아이폰 크기 (390×844 · 2배). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/today/shots-7b.ts http://localhost:3210 [나갈 폴더]
// 찍는 것 (스위치의 색 넷 — 종이 + 미색 · 쑥 · 형광펜): 오늘 · 짧은 이야기 (표지 · 뒤집기 · 남음) · 지도 견본
//   · 체험 셋 (배달앱 켜고 끄기 · 금리 자리 · 개인정보 넘겨 보기 ★) · 도구 줍기 · 뒤집기 · 남는 한 줄 · 회차의 지도. 끝에 색 넷을 나란히 (sheet-*.png)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import { PALETTES } from "./palette/palettes";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-7b"));
mkdirSync(OUT, { recursive: true });
const IDS = PALETTES.filter((p) => p.dock).map((p) => p.id);

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const settle = (page: Page, ms = 1300) => page.waitForTimeout(ms);
const sceneId = (page: Page) => page.locator(".ep-root").getAttribute("data-scene");
const top = (page: Page, y: number) => page.locator(".ep-scroll").evaluate((el, v) => el.scrollTo(0, v), y);
/** 어떤 것을 화면 위쪽에서 gap 만큼 아래에 놓는다 */
const bring = async (page: Page, selector: string, gap = 70) => {
  await page.locator(".ep-scroll").evaluate(
    (el, [q, g]) => {
      const x = el.querySelector<HTMLElement>(q as string);
      if (x) el.scrollTo(0, x.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - (g as number));
    },
    [selector, gap] as const,
  );
  await page.waitForTimeout(350);
};
const ask = async (page: Page) => {
  await page.getByTestId("ask").click();
  await settle(page);
};
/** 도구 줍기의 "이거 알아요?" — 첫 도구는 알아요 · 나머지는 처음 들어요 (새것 / 알던 것 두 색이 다 보이게) */
const answerTools = async (page: Page) => {
  const asks = page.locator(".ep-tool-ask");
  let first = true;
  while ((await asks.count()) > 0) {
    await asks.first().locator("button").nth(first ? 0 : 1).click();
    first = false;
    await page.waitForTimeout(350);
  }
};
/** 풀이 장면까지 — 가는 길에 도구 줍기를 찍는다 (name 이 있으면) */
async function toAha(page: Page, url: string, toolsShot?: string) {
  await page.goto(url);
  await settle(page, 1800);
  for (let i = 0; i < 6 && (await sceneId(page)) !== "aha"; i++) {
    if ((await sceneId(page)) === "tools") {
      await answerTools(page);
      await settle(page, 600);
      if (toolsShot) await shot(page, toolsShot);
    }
    await ask(page);
  }
}
async function toKeep(page: Page) {
  for (let i = 0; i < 5 && (await sceneId(page)) !== "keep"; i++) {
    if ((await page.getByTestId("lab-gate").count()) > 0) await page.getByTestId("lab-gate-open").click();
    await answerTools(page);
    await ask(page);
  }
  await settle(page, 2200);
}

const browser = await chromium.launch({ channel: "chrome" });
for (const id of IDS) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // 오늘 — 위 · 목록 · 아래 (이어지는 이야기 · 개념)
  await page.goto(`${BASE}/lab/today?c=${id}`);
  await settle(page);
  await shot(page, `today-${id}-1`);
  await bring(page, "[data-testid=card-fomc]", 60);
  await shot(page, `today-${id}-2-list`);
  await bring(page, "#td-cont", 60);
  await shot(page, `today-${id}-3-cont`);
  await bring(page, "#td-concept", 60);
  await shot(page, `today-${id}-4-concept`);

  // 짧은 이야기 — 표지 · 뒤집기 · 남음 (남는 한 줄)
  await page.goto(`${BASE}/lab/today/short`);
  await settle(page);
  await shot(page, `short-${id}-1-cover`);
  await ask(page);
  await bring(page, ".ep-flip", 150);
  await shot(page, `short-${id}-2-flip`);
  await ask(page);
  await ask(page);
  await settle(page, 1600);
  await top(page, 0);
  await shot(page, `short-${id}-3-keep`);

  // 지도 견본
  await page.goto(`${BASE}/lab/today/map`);
  await settle(page);
  await shot(page, `map-${id}`);

  // 체험 ① 배달앱 — 켜고 끄기 (조항을 끄고 값을 내린 뒤 → 켜고 막힌 뒤)
  await toAha(page, `${BASE}/lab/episode`);
  await bring(page, "[data-testid=lab]");
  await page.getByTestId("lab-act").click();
  await settle(page, 1500);
  await shot(page, `lab-delivery-${id}-1-off`);
  await page.getByTestId("lab-go-on").click();
  await settle(page, 900);
  await page.getByTestId("lab-act").click();
  await settle(page, 1500);
  await bring(page, "[data-testid=lab]");
  await shot(page, `lab-delivery-${id}-2-on`);
  await bring(page, ".ep-flip", 150);
  await shot(page, `flip-delivery-${id}`);

  // 체험 ② 금리 — 자리에 앉기 (9월을 누른 뒤 → 10월 자리에서 기다리기를 고른 뒤)
  await toAha(page, `${BASE}/lab/episode/fomc`);
  await bring(page, "[data-testid=lab]");
  await page.getByTestId("lab-act").click();
  await settle(page, 1900);
  await shot(page, `lab-fomc-${id}-1-sep`);
  await page.getByTestId("lab-go-on").click();
  await settle(page, 900);
  await bring(page, "[data-testid=lab]");
  await page.getByTestId("lab-wait").click();
  await settle(page, 1300);
  await shot(page, `lab-fomc-${id}-2-seat`);
  await bring(page, ".ep-flip", 150);
  await shot(page, `flip-fomc-${id}`);

  // 체험 ③ 개인정보 — 넘겨 보기 (★ 칸이 막 넘어온 때) · 도구 줍기 · 뒤집기 · 남는 한 줄 · 지도
  await toAha(page, `${BASE}/lab/episode/pipc`, `tools-${id}`);
  await bring(page, "[data-testid=lab]");
  for (let i = 0; i < 8 && (await page.getByTestId("lab-gate").count()) > 0; i++) {
    await page.getByTestId("lab-act").click();
    await page.waitForTimeout(1000);
    if (i === 3) await shot(page, `lab-pipc-${id}-1-star`);
  }
  await settle(page, 900);
  await bring(page, "[data-testid=lab]");
  await shot(page, `lab-pipc-${id}-2-all`);
  await bring(page, ".ep-flip", 150);
  await shot(page, `flip-pipc-${id}`);
  await toKeep(page);
  await top(page, 0);
  await shot(page, `keep-${id}`);
  await page.getByTestId("map-button").click();
  await settle(page, 900);
  await shot(page, `episode-map-${id}`);

  if (errors.length) console.log(`${id}: 화면 오류 ${errors.length} — ${errors.slice(0, 3).join(" / ")}`);
  await context.close();
}
await browser.close();

// 색 넷을 나란히 (왼쪽부터 종이 · 미색 · 쑥 · 형광펜) — PM · 도윤이 한눈에 견주게
const py = `
import sys
from PIL import Image
out, names = sys.argv[1], sys.argv[2:]
ims = [Image.open(n) for n in names]
w, h = ims[0].width // 2, ims[0].height // 2
sheet = Image.new("RGB", (w * len(ims) + 12 * (len(ims) - 1), h), "#7a7a7a")
for i, im in enumerate(ims):
    sheet.paste(im.resize((w, h), Image.LANCZOS), (i * (w + 12), 0))
sheet.save(out)
`;
const SHEETS = [
  ["sheet-today", "today-{id}-1"],
  ["sheet-today-list", "today-{id}-2-list"],
  ["sheet-today-cont", "today-{id}-3-cont"],
  ["sheet-today-concept", "today-{id}-4-concept"],
  ["sheet-short-cover", "short-{id}-1-cover"],
  ["sheet-short-flip", "short-{id}-2-flip"],
  ["sheet-short-keep", "short-{id}-3-keep"],
  ["sheet-map", "map-{id}"],
  ["sheet-lab-delivery-off", "lab-delivery-{id}-1-off"],
  ["sheet-lab-delivery-on", "lab-delivery-{id}-2-on"],
  ["sheet-lab-fomc-sep", "lab-fomc-{id}-1-sep"],
  ["sheet-lab-fomc-seat", "lab-fomc-{id}-2-seat"],
  ["sheet-lab-pipc-star", "lab-pipc-{id}-1-star"],
  ["sheet-lab-pipc-all", "lab-pipc-{id}-2-all"],
  ["sheet-flip-delivery", "flip-delivery-{id}"],
  ["sheet-flip-fomc", "flip-fomc-{id}"],
  ["sheet-flip-pipc", "flip-pipc-{id}"],
  ["sheet-tools", "tools-{id}"],
  ["sheet-keep", "keep-{id}"],
  ["sheet-episode-map", "episode-map-{id}"],
] as const;
for (const [name, pattern] of SHEETS) execFileSync("python3", ["-c", py, path.join(OUT, `${name}.png`), ...IDS.map((id) => path.join(OUT, `${pattern.replace("{id}", id)}.png`))]);
console.log(`나란히 놓은 그림 ${SHEETS.length} (sheet-*.png · 왼쪽부터 ${IDS.join(" · ")})\n찍었다 → ${OUT}`);
