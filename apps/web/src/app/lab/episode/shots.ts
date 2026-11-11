// UX-1 스크린샷 — 아이폰 크기(390×844)로 단계마다 + 두 독자. 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/shots.ts http://localhost:3210
// → logs/frontend/UX-1/{new,follower}-NN-장면[-b…].png
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-1");
mkdirSync(OUT, { recursive: true });

const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms);

/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function scene(page: Page, name: string) {
  const scroller = page.locator(".ep-scroll");
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  const { h, view } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight }));
  const n = Math.max(1, Math.ceil((h - 24) / (view - 60)));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 60));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}.png`) });
  }
}
const ask = async (page: Page) => {
  await page.getByTestId("ask").click();
  await settle(page);
};

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

// ── 처음 온 독자
await page.goto(`${BASE}/lab/episode`);
await settle(page, 2500);
await scene(page, "new-01-cover");
await ask(page);
await scene(page, "new-02-zero");
await ask(page);
await scene(page, "new-03-event");
await ask(page);
await scene(page, "new-04-tools-ask");
// "이거 알아요?" — 수수료는 알아요, 나머지는 처음
await page.getByTestId("tool-fee").getByRole("button", { name: "알아요" }).click();
await page.getByTestId("tool-mfn").getByRole("button", { name: "처음 들어요" }).click();
await page.getByTestId("tool-dominance").getByRole("button", { name: "처음 들어요" }).click();
await settle(page, 900);
await scene(page, "new-04-tools-answered");
await ask(page);
await scene(page, "new-05-aha");
// 풀이: 요구가 없을 때 → 값 내리기
const lab = page.getByTestId("lab");
await lab.scrollIntoViewIfNeeded();
await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, 150));
await page.getByTestId("lab-act").click();
await settle(page, 1400);
await page.screenshot({ path: path.join(OUT, "new-05-lab-1-off-lowered.png") });
await page.getByTestId("lab-go-on").click();
await settle(page, 700);
await page.screenshot({ path: path.join(OUT, "new-05-lab-2-on-before.png") });
await page.getByTestId("lab-act").click();
await settle(page, 1100);
await page.screenshot({ path: path.join(OUT, "new-05-lab-3-on-blocked.png") });
await ask(page);
await scene(page, "new-06-next");
await page.getByTestId("tool-provisional").getByRole("button", { name: "처음 들어요" }).click();
await settle(page, 700);
await ask(page);
await settle(page, 2200);
await scene(page, "new-07-keep");
await page.getByTestId("open-map").click();
await settle(page, 900);
await page.getByTestId("map-view").getByTestId("node-mfn").click();
await settle(page, 400);
await page.screenshot({ path: path.join(OUT, "new-08-map.png") });

// 근거 보기 — 사건 장면에서 한 문장
await page.goto(`${BASE}/lab/episode`);
await settle(page, 2000);
await ask(page);
await ask(page);
await page.getByTestId("src-toggle").click();
await page.locator(".ep-fine-amount .ep-src-hit").first().click();
await settle(page, 700);
await page.screenshot({ path: path.join(OUT, "new-09-source-sheet.png") });

// ── 따라온 독자
await page.goto(`${BASE}/lab/episode`);
await settle(page, 2000);
await page.getByTestId("reader-follower").click();
await settle(page);
await scene(page, "follower-01-cover");
await ask(page);
await scene(page, "follower-02-event");
await ask(page);
await scene(page, "follower-03-tools");
await ask(page);
await scene(page, "follower-04-aha");
await ask(page);
await scene(page, "follower-05-compare");
await ask(page);
await scene(page, "follower-06-next");
await ask(page);
await settle(page, 2200);
await scene(page, "follower-07-keep");
await page.getByTestId("open-map").click();
await settle(page, 900);
await page.screenshot({ path: path.join(OUT, "follower-08-map.png") });

// ── 움직임 줄이기: 장면이 바뀐 직후에 자리가 옮겨져 있는 요소가 없어야 한다 (표지 그림의 기울기 같은 SVG 안의 고정 변환은 세지 않는다)
const calm = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const p2 = await calm.newPage();
await p2.goto(`${BASE}/lab/episode`);
await p2.waitForTimeout(2000);
await p2.getByTestId("ask").click();
await p2.waitForTimeout(60);
const moving = await p2.evaluate(() => [...document.querySelectorAll<HTMLElement>(".ep-scene *")].filter((el) => el instanceof HTMLElement && !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length);
console.log(`움직임 줄이기 — 장면이 바뀐 60ms 뒤 자리가 옮겨져 있는 요소: ${moving}`);

await browser.close();
console.log(errors.length ? `콘솔 오류 ${errors.length}:\n${errors.join("\n")}` : "콘솔 오류 0");
