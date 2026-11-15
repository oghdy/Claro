// F-E5 스크린샷 (390×844 · 2배) — 11/15 "오늘" 두 편: 첫 화면 (카드 여섯 · 맨 위 둘이 그날의 묶음) · 긴 이야기 /s/oil/1 (표지 → 장면마다 → 체험: 사슬 누르기 앞 · 뒤 → 이어짐 → 남음 → 지도) ·
// 짧은 이야기 /short/meta-gallery (표지 → 끝 · 근거 시트) · 개념 지도 /map. 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx scripts/shots-fe5.ts <주소> <이름 앞머리> [그림 폴더]
// 그림은 <그림 폴더 — 없으면 logs/frontend/F-E5>/<앞머리>-*.png. 브라우저는 이 Mac 의 Chrome. 콘솔 오류 · 가로 넘침 (scrollWidth > clientWidth)을 끝에 적는다
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3210";
const PRE = process.argv[3] ?? "local";
const OUT = process.argv[4] ?? path.join(import.meta.dirname, "../../../logs/frontend/F-E5");
mkdirSync(OUT, { recursive: true });
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}-${name}.png`) });
const calm = (page: Page) => page.waitForTimeout(1200);

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors: string[] = [];
page.on("console", (m) => (m.type() === "error" && !/favicon/.test(m.text() + m.location().url) ? errors.push(`${page.url()} ${m.text()}`) : undefined));
page.on("pageerror", (e) => errors.push(`${page.url()} ${e.message}`));
const status: string[] = [];
const wide: string[] = [];
const scroller = () => page.locator(".ep-scroll").first();
/** 가로 넘침 — 지금 화면에서 */
const fit = async (name: string) => {
  const w = await scroller().evaluate((el) => [el.scrollWidth, el.clientWidth, document.documentElement.scrollWidth, window.innerWidth]);
  if (w[0]! > w[1]! || w[2]! > w[3]!) wide.push(`${name} ${w.join("/")}`);
};
const go = async (p: string) => {
  const r = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
  status.push(`${r!.status()} ${p}`);
  await page.evaluate(() => document.fonts.ready);
  await calm(page);
};
const scrollTo = async (top: number) => {
  await scroller().evaluate((el, top) => el.scrollTo({ top }), top);
  await page.waitForTimeout(300);
};
/** 지금 장면을 위에서 아래로 */
const scrollAll = async (name: string) => {
  await scrollTo(0);
  await fit(name);
  await shot(page, `${name}-1`);
  const height = await scroller().evaluate((el) => el.scrollHeight);
  for (let i = 2, top = 740; top < height - 120; i += 1, top += 740) {
    await scrollTo(top);
    await shot(page, `${name}-${i}`);
  }
};

// 첫 화면
await go("/");
console.log("머리:", await page.locator("[data-testid=head]").innerText());
await scrollAll("home");

// 긴 이야기 — 장면마다
await go("/s/oil/1");
const root = page.locator(".ep-root");
for (;;) {
  const scene = (await root.getAttribute("data-scene"))!;
  if (scene === "aha") {
    await scrollAll("oil-aha-before");
    // 체험 — 사슬을 누른다
    await page.locator("[data-testid=lab-act]").scrollIntoViewIfNeeded();
    await shot(page, "oil-aha-chain-before");
    await page.locator("[data-testid=lab-act]").click();
    await page.waitForTimeout(3200);
    await page.locator("[data-testid=lab]").scrollIntoViewIfNeeded();
    await shot(page, "oil-aha-chain-after");
    await page.waitForTimeout(600);
    await scrollAll("oil-aha-after");
  } else await scrollAll(`oil-${scene}`);
  if (scene === "keep") break;
  await page.locator("[data-testid=ask]").scrollIntoViewIfNeeded();
  await page.locator("[data-testid=ask]").click();
  await calm(page);
}
await page.locator("[data-testid=open-map]").scrollIntoViewIfNeeded();
await page.locator("[data-testid=open-map]").click();
await calm(page);
await shot(page, "oil-map");
console.log("oil 지도의 ghost:", await page.locator('[data-testid=map-view] .ep-node[data-state=ghost], [data-testid=map-view] .ep-edge[data-kind=ghost]').count(), "· 범례:", (await page.locator("[data-testid=map-view] .ep-map-legend").innerText()).replace(/\n/g, " / "));

// 짧은 이야기 — 장면마다 · 근거 시트
await go("/short/meta-gallery");
const sroot = page.locator("[data-testid=short]");
for (;;) {
  const scene = (await sroot.getAttribute("data-scene"))!;
  await scrollAll(`meta-${scene}`);
  if (scene === "where") {
    await scrollTo(0);
    await page.locator("[data-testid=src-toggle]").click();
    await page.locator(".pl-thought[data-kind=breaker] .ep-src-hit").click();
    await calm(page);
    await shot(page, "meta-where-sheet");
    console.log("근거 시트 cite:", await page.locator(".ep-sheet cite").first().innerText());
    console.log("근거 시트 구절:", (await page.locator(".ep-sheet blockquote p").first().innerText()).slice(0, 90));
    await page.locator(".ep-sheet header button").click();
    await page.locator("[data-testid=src-toggle]").click();
  }
  if (scene === "keep") break;
  await page.locator("[data-testid=ask]").scrollIntoViewIfNeeded();
  await page.locator("[data-testid=ask]").click();
  await calm(page);
}

// 개념 지도
await go("/map");
await scrollAll("map");
console.log("/map 지도 수:", await page.locator("[data-testid=concept-map]").count());

console.log(status.join("\n"));
console.log(`가로 넘침 ${wide.length}${wide.length ? "\n" + wide.join("\n") : ""}`);
console.log(`콘솔 오류 ${errors.length}${errors.length ? "\n" + errors.join("\n") : ""}`);
await browser.close();
