// UX-12d 스크린샷 (d ↔ e 나란히) — UX-12 의 shots.ts 와 같은 재기 — 폰 크기 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/home-days/shots-d.ts http://localhost:3212 [나갈 폴더]
// 찍는 것: 지금 실제 / (견줌) · 가 · 나 · 각 ?many=1 — 첫 화면 한 장 + 지난 이야기 칸까지 내린 한 장 + 지난 이야기 칸 통째 (키를 견주려고). 나는 처음 그대로 (바로 위 하루 펼침) · 하나 더 펼친 것 · 다 접은 것.
// 재는 것 (390 · 360 폭): 가로 넘침 · 누를 곳의 키 (작은 줄 · 접힌 날짜 줄) · 지난 이야기 칸의 키 · 잘린 제목
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3212";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-12d"));
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
    rows: h(".hc-row, .he-row").length,
    rowMin: min(h(".hc-row, .he-row")),
    foldMin: min(h(".he-fold summary, .hf-before summary, button.hf-cell")),
    // 제목이 잘렸나 — 작은 줄의 제목은 줄을 바꾼다 (말줄임 없음). 글 상자가 제 글보다 좁으면 잘린 것
    clipped: Array.from(document.querySelectorAll(".hc-row-title, .he-row-title, .hc-fold h3, .he-date small, .he-date i")).filter(function (el) { return el.scrollWidth > el.clientWidth + 1; }).length,
  };
})()`;
const measure = (page: Page) => page.evaluate(MEASURE);

const browser = await chromium.launch({ channel: "chrome" });
for (const width of [390, 360]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const v of ["d", "e"]) {
    for (const many of ["", "-many"]) {
      const res = await page.goto(`${BASE}/lab/home-days/${v}${many ? "?many=1" : ""}`);
      await page.waitForTimeout(900);
      const tag = `${width === 390 ? "" : "360-"}${many ? "3-many" : "1-rest"}-${v}`;
      console.log(tag, res!.status(), JSON.stringify(await measure(page)));
      await toRest(page);
      if (width === 390 || !many) await shot(page, tag);
      if (width !== 390) continue;
      if (!many) await page.locator("#td-rest").locator("xpath=..").screenshot({ path: path.join(OUT, `5-whole-${v}.png`) });
      if (v === "d" && !many) {
        await page.locator("details[data-testid=day] summary").nth(1).tap();
        await page.waitForTimeout(300);
        await toRest(page);
        await shot(page, "2-other-d");
      }
      if (v === "e") {
        const picked = page.getByTestId("picked");
        console.log(`e${many} 처음 고른 날`, await picked.getAttribute("data-day"), "·", await page.locator("button.hf-cell[aria-pressed=true]").getAttribute("aria-label"));
        // 다른 날을 누른다 (지금: 15일 · 견본: 14일) → 목록이 그날로
        const other = many ? "2026-11-14" : "2026-11-15";
        await page.locator(`button.hf-cell[data-day="${other}"]`).tap();
        await page.waitForTimeout(300);
        console.log(`e${many} ${other} 누름 →`, await picked.getAttribute("data-day"), (await picked.locator(".hc-row-title").allInnerTexts()).join(" | "));
        if (!many) await shot(page, "2-other-e");
        if (!many) {
          // 가장 새 날 (테 두른 칸)을 누른다 · "그 전"을 편다
          await page.locator("button.hf-cell[data-newest]").tap();
          await page.waitForTimeout(300);
          console.log("e 가장 새 날 누름 →", await picked.locator(".hf-list-head").innerText());
          await page.locator(".hf-before summary").tap();
          await page.waitForTimeout(300);
          await shot(page, "4-newest-before-e");
          // 키보드 — 칸은 button 이다: 초점을 주고 Enter
          await page.locator('button.hf-cell[data-day="2026-11-17"]').focus();
          await page.keyboard.press("Enter");
          console.log("e 키보드 Enter (17일) →", await picked.getAttribute("data-day"));
          const row = page.locator(".hf-list .hc-row").first();
          const href = await row.getAttribute("href");
          await row.tap();
          await page.waitForURL(`**${href}`);
          console.log(`e 첫 줄 → ${new URL(page.url()).pathname}`);
        }
      }
    }
  }
  console.log(`폭 ${width} 페이지 오류 ${errors.length}`, errors.join(" | "));
  await context.close();
}
// 스크립트 없이 (첫 HTML) — 처음 고른 날의 목록이 서버 그림에 있다
const noJs = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, javaScriptEnabled: false });
const p = await noJs.newPage();
await p.goto(`${BASE}/lab/home-days/e`);
console.log("스크립트 없이 e — 고른 날", await p.getByTestId("picked").getAttribute("data-day"), "· 제목", (await p.locator(".hf-list .hc-row-title").allInnerTexts()).join(" | "));
await noJs.close();
await browser.close();
