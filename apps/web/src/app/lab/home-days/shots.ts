// UX-12 스크린샷 — 폰 크기 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/home-days/shots.ts http://localhost:3212 [나갈 폴더]
// 찍는 것: 지금 실제 / (견줌) · 가 · 나 · 각 ?many=1 — 첫 화면 한 장 + 지난 이야기 칸까지 내린 한 장 + 지난 이야기 칸 통째 (키를 견주려고). 나는 처음 그대로 (바로 위 하루 펼침) · 하나 더 펼친 것 · 다 접은 것.
// 재는 것 (390 · 360 폭): 가로 넘침 · 누를 곳의 키 (작은 줄 · 접힌 날짜 줄) · 지난 이야기 칸의 키 · 잘린 제목
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3212";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-12"));
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const toRest = async (page: Page) => {
  await page.locator("#td-rest").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, -16));
  await page.waitForTimeout(250);
};
// (tsx 가 안쪽 함수에 이름표 도우미를 붙여 브라우저에서 못 돈다 → 글자열로 넘긴다)
const MEASURE = `(() => {
  var h = function (sel) { return Array.from(document.querySelectorAll(sel)).map(function (el) { return Math.round(el.getBoundingClientRect().height); }); };
  var min = function (xs) { return xs.length ? Math.min.apply(null, xs) : null; };
  var root = document.documentElement, scroller = document.querySelector(".ep-scroll");
  return {
    overflowX: Math.max(root.scrollWidth - root.clientWidth, scroller.scrollWidth - scroller.clientWidth),
    rest: Math.round(document.querySelector("#td-rest").parentElement.getBoundingClientRect().height),
    rows: h(".hd-row").length,
    rowMin: min(h(".hd-row")),
    foldMin: min(h(".hd-fold summary")),
    // 제목이 잘렸나 — 작은 줄의 제목은 줄을 바꾼다 (말줄임 없음). 글 상자가 제 글보다 좁으면 잘린 것
    clipped: Array.from(document.querySelectorAll(".hd-row-title, .hd-day-head h3, .hd-fold-head h3")).filter(function (el) { return el.scrollWidth > el.clientWidth + 1; }).length,
  };
})()`;
const measure = (page: Page) => page.evaluate(MEASURE);

const browser = await chromium.launch({ channel: "chrome" });
const PAGES = [
  ["real", "/"],
  ["a", "/lab/home-days/a"],
  ["a-many", "/lab/home-days/a?many=1"],
  ["b", "/lab/home-days/b"],
  ["b-many", "/lab/home-days/b?many=1"],
] as const;
for (const width of [390, 360]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const [name, url] of PAGES) {
    const res = await page.goto(`${BASE}${url}`);
    await page.waitForTimeout(900);
    const tag = width === 390 ? name : `${name}-360`;
    console.log(tag, res!.status(), JSON.stringify(await measure(page)));
    if (width === 390) await shot(page, `${tag}-1-top`);
    await toRest(page);
    await shot(page, `${tag}-2-rest`);
    if (width === 390) await page.locator("#td-rest").locator("xpath=..").screenshot({ path: path.join(OUT, `${tag}-3-rest-whole.png`) });
    if (name.startsWith("b") && width === 390) {
      // 하나 더 펼친 것 (둘째 날)
      await page.locator(".hd-fold summary").nth(1).tap();
      await page.waitForTimeout(300);
      await toRest(page);
      await shot(page, `${tag}-4-rest-open2`);
      console.log(`${tag} (둘 펼침)`, JSON.stringify(await measure(page)));
      // 다 접은 것
      await page.locator(".hd-fold summary").nth(1).tap();
      await page.locator(".hd-fold summary").nth(0).tap();
      await page.waitForTimeout(300);
      await toRest(page);
      await shot(page, `${tag}-5-rest-folded`);
      console.log(`${tag} (다 접음)`, JSON.stringify(await measure(page)));
    }
    if (name === "a" && width === 390) {
      // 작은 줄을 누르면 그 이야기로
      const row = page.locator(".hd-row").first();
      const href = await row.getAttribute("href");
      await row.tap();
      await page.waitForURL(`**${href}`);
      console.log(`a 첫 줄 → ${new URL(page.url()).pathname}`);
    }
  }
  console.log(`폭 ${width} 페이지 오류 ${errors.length}`, errors.join(" | "));
  await context.close();
}
await browser.close();
