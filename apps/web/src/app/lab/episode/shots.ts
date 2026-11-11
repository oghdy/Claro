// 회차 시안 스크린샷 — 아이폰 크기(390×844)로 단계마다 + 두 독자. 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/shots.ts http://localhost:3200
// → logs/frontend/UX-2/
//     fomc-{new,follower}-NN-장면[-b…].png      둘째 회차 (UX-2)
//     ux1-after-{new,follower}-NN-….png         배달앱 회차를 UX-1 과 같은 차례로 다시 찍은 것 — logs/frontend/UX-1/ 의 같은 이름과 견준다
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3200";
const OUT = path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-2");
mkdirSync(OUT, { recursive: true });

const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms);
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function scene(page: Page, name: string) {
  const scroller = page.locator(".ep-scroll");
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  const { h, view } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight }));
  const n = Math.max(1, Math.ceil((h - 24) / (view - 60)));
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
const answer = async (page: Page, id: string, a: "알아요" | "처음 들어요") => page.getByTestId(`tool-${id}`).getByRole("button", { name: a }).click();
/** 풀이 장면을 화면 가운데로 */
const toLab = async (page: Page) => {
  await page.getByTestId("lab").scrollIntoViewIfNeeded();
  await page.locator(".ep-scroll").evaluate((el) => {
    const lab = el.querySelector<HTMLElement>("[data-testid=lab]")!;
    el.scrollTo(0, lab.offsetTop - 70);
  });
  await page.waitForTimeout(300);
};

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

// ═══════════════════════════════════════════ 둘째 회차 — FOMC
const F = `${BASE}/lab/episode/fomc`;

// ── 처음 온 독자
await page.goto(F);
await settle(page, 2500);
await scene(page, "fomc-new-01-cover");
await ask(page);
await scene(page, "fomc-new-02-zero");
await ask(page);
await scene(page, "fomc-new-03-event");
await ask(page);
await scene(page, "fomc-new-04-tools-ask");
// "이거 알아요?" — 기준금리는 알아요, 나머지는 처음
await answer(page, "rate", "알아요");
await answer(page, "target", "처음 들어요");
await answer(page, "vote", "처음 들어요");
await settle(page, 900);
await scene(page, "fomc-new-04-tools-answered");
await ask(page);
await scene(page, "fomc-new-05-aha");
// 풀이: 9월 — 밟기 전 → 밟은 뒤 → 10월 — 고르기 전 → 그대로 → 올리자
await toLab(page);
await shot(page, "fomc-new-05-lab-1-sep-before");
await page.getByTestId("lab-act").click();
await settle(page, 1900);
await shot(page, "fomc-new-05-lab-2-sep-pressed");
await page.getByTestId("lab-go-on").click();
await settle(page, 900);
await toLab(page);
await shot(page, "fomc-new-05-lab-3-oct-before");
await page.getByTestId("lab-wait").click();
await settle(page, 1200);
await shot(page, "fomc-new-05-lab-4-oct-wait");
await page.getByTestId("lab-other").click();
await settle(page, 1200);
await shot(page, "fomc-new-05-lab-5-oct-raise");
await ask(page);
await scene(page, "fomc-new-06-next");
await answer(page, "dots", "처음 들어요");
await settle(page, 700);
await ask(page);
await settle(page, 2600);
await scene(page, "fomc-new-07-keep");
await page.getByTestId("open-map").click();
await settle(page, 900);
await page.getByTestId("map-view").getByTestId("node-conditions").click();
await settle(page, 400);
await shot(page, "fomc-new-08-map");

// 근거 보기 — 풀이 뒤의 "실제로 연준이 말한 것"에서 한 문장
await page.goto(F);
await settle(page, 2000);
await ask(page);
await ask(page);
await page.getByTestId("src-toggle").click();
await page.locator(".ep-fine-amount .ep-src-hit").first().click();
await settle(page, 700);
await shot(page, "fomc-new-09-source-sheet");

// ── 따라온 독자 (1화를 읽었다)
await page.goto(F);
await settle(page, 2000);
await page.getByTestId("reader-follower").click();
await settle(page);
await scene(page, "fomc-follower-01-cover");
await ask(page);
await scene(page, "fomc-follower-02-event");
await ask(page);
await scene(page, "fomc-follower-03-tools");
await ask(page);
await scene(page, "fomc-follower-04-aha");
await ask(page);
await scene(page, "fomc-follower-05-compare");
await ask(page);
await scene(page, "fomc-follower-06-next");
await ask(page);
await settle(page, 2600);
await scene(page, "fomc-follower-07-keep");
await page.getByTestId("open-map").click();
await settle(page, 900);
await shot(page, "fomc-follower-08-map");
// 지도 아래 — 다른 시리즈의 개념과 시리즈 목록 (두 회차를 오가는 길)
await page.getByTestId("map-view").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await settle(page, 400);
await shot(page, "fomc-follower-08-map-b");
// 길을 따라 건너가 본다 — 시리즈 목록에서 배달앱 회차로
await page.getByTestId("shelf-price").click();
await page.waitForURL(/\/lab\/episode$/);
await settle(page, 2000);
await shot(page, "fomc-follower-09-crossed-to-delivery");

// ═══════════════════════════════════════════ 첫 회차 — 배달앱 (UX-1 과 같은 차례 · 같은 이름. 전후 대조)
const D = `${BASE}/lab/episode`;
const U = "ux1-after-";

await page.goto(D);
await settle(page, 2500);
await scene(page, `${U}new-01-cover`);
await ask(page);
await scene(page, `${U}new-02-zero`);
await ask(page);
await scene(page, `${U}new-03-event`);
await ask(page);
await scene(page, `${U}new-04-tools-ask`);
await answer(page, "fee", "알아요");
await answer(page, "mfn", "처음 들어요");
await answer(page, "dominance", "처음 들어요");
await settle(page, 900);
await scene(page, `${U}new-04-tools-answered`);
await ask(page);
await scene(page, `${U}new-05-aha`);
await page.getByTestId("lab").scrollIntoViewIfNeeded();
await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, 150));
await page.getByTestId("lab-act").click();
await settle(page, 1400);
await shot(page, `${U}new-05-lab-1-off-lowered`);
await page.getByTestId("lab-go-on").click();
await settle(page, 700);
await shot(page, `${U}new-05-lab-2-on-before`);
await page.getByTestId("lab-act").click();
await settle(page, 1100);
await shot(page, `${U}new-05-lab-3-on-blocked`);
await ask(page);
await scene(page, `${U}new-06-next`);
await answer(page, "provisional", "처음 들어요");
await settle(page, 700);
await ask(page);
await settle(page, 2200);
await scene(page, `${U}new-07-keep`);
await page.getByTestId("open-map").click();
await settle(page, 900);
await page.getByTestId("map-view").getByTestId("node-mfn").click();
await settle(page, 400);
await shot(page, `${U}new-08-map`);

await page.goto(D);
await settle(page, 2000);
await ask(page);
await ask(page);
await page.getByTestId("src-toggle").click();
await page.locator(".ep-fine-amount .ep-src-hit").first().click();
await settle(page, 700);
await shot(page, `${U}new-09-source-sheet`);

await page.goto(D);
await settle(page, 2000);
await page.getByTestId("reader-follower").click();
await settle(page);
await scene(page, `${U}follower-01-cover`);
await ask(page);
await scene(page, `${U}follower-02-event`);
await ask(page);
await scene(page, `${U}follower-03-tools`);
await ask(page);
await scene(page, `${U}follower-04-aha`);
await ask(page);
await scene(page, `${U}follower-05-compare`);
await ask(page);
await scene(page, `${U}follower-06-next`);
await ask(page);
await settle(page, 2200);
await scene(page, `${U}follower-07-keep`);
await page.getByTestId("open-map").click();
await settle(page, 900);
await shot(page, `${U}follower-08-map`);
// 두 시리즈가 같이 있는 지도 — 두 회차를 다 읽은 독자. 아래로 내려 시리즈 목록까지
await page.getByTestId("map-view").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await settle(page, 400);
await shot(page, `${U}follower-08-map-b`);

// ── 움직임 줄이기: 장면이 바뀐 직후에 자리가 옮겨져 있는 요소가 없어야 한다 (표지 그림의 기울기 같은 SVG 안의 고정 변환은 세지 않는다)
const calm = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const p2 = await calm.newPage();
for (const url of [D, F]) {
  await p2.goto(url);
  await p2.waitForTimeout(2000);
  await p2.getByTestId("ask").click();
  await p2.waitForTimeout(60);
  const moving = await p2.evaluate(() => [...document.querySelectorAll<HTMLElement>(".ep-scene *")].filter((el) => el instanceof HTMLElement && !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(el).transform)).length);
  console.log(`움직임 줄이기 (${url.replace(BASE, "")}) — 장면이 바뀐 60ms 뒤 자리가 옮겨져 있는 요소: ${moving}`);
}

await browser.close();
console.log(errors.length ? `콘솔 오류 ${errors.length}:\n${errors.join("\n")}` : "콘솔 오류 0");
