// F-2a 스크린샷 (375×667 · 375×812 · 1440×900) + 넘기는 모습 영상 (375×667) → logs/frontend/F-2a/
import { test, type Page } from "@playwright/test";
import path from "node:path";
import { DESKTOP, DIRS, MOBILE_SE, MOBILE_X, goTo, goToQuestion, openLevel, swipe, type Dir } from "./lab";

const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-2a");
const SIZES = { se: MOBILE_SE, x: MOBILE_X, desktop: DESKTOP };

// 층 표시를 켠 모습 — 입문 2장 (해석 · 사실 · 이어 주는 글이 한 장에 다 있다)
async function showLayers(page: Page, dir: Dir) {
  if (dir === "a") await page.getByRole("button", { name: "층 보기" }).click();
  if (dir === "b") await page.locator('[data-slide-index="1"] .x-p [data-layer="claim"]').first().click();
  await page.waitForTimeout(300);
}

for (const dir of DIRS)
  for (const [size, vp] of Object.entries(SIZES)) {
    test(`스크린샷 ${dir} ${size}`, async ({ browser }) => {
      const mobile = size !== "desktop";
      const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const shot = (name: string) => page.screenshot({ path: path.join(OUT, `${dir}-${size}-${name}.png`) });

      await openLevel(page, dir, "basic");
      await goTo(page, dir, 0);
      await shot("basic-1");
      await goTo(page, dir, 2);
      await shot("basic-3");
      if (dir === "a") (await goToQuestion(page, 2), await shot("basic-3to4-question"));
      await goTo(page, dir, 3);
      await shot("basic-4");
      if (mobile) (await goTo(page, dir, 3, true), await shot("basic-4-end"));
      await goTo(page, dir, 8, true);
      await shot("basic-9-end");
      await goTo(page, dir, 1);
      await showLayers(page, dir);
      await shot("basic-2-layers");

      await openLevel(page, dir, "advanced");
      await goTo(page, dir, 3);
      await shot("advanced-4");
      if (mobile) (await goTo(page, dir, 3, true), await shot("advanced-4-end"));
      await ctx.close();
    });
  }

for (const dir of DIRS)
  test(`영상 ${dir} — 375×667 에서 손가락으로 넘기기`, async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: MOBILE_SE, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      recordVideo: { dir: path.join(import.meta.dirname, "../test-results/video"), size: MOBILE_SE },
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await openLevel(page, dir, "basic");
    await page.waitForTimeout(1200);
    const beat = () => page.waitForTimeout(900);
    if (dir === "b") {
      // 1 → 2 → 3 → 4(카드 안에서 아래로) → 5, 그리고 2장으로 돌아가 문장을 눌러 층 보기
      for (let i = 0; i < 4; i++) (await swipe(cdp, { dx: 260, y: 300, speed: 700 }), await beat());
      await swipe(cdp, { dy: 260, speed: 600 }), await beat();
      await swipe(cdp, { dx: 260, y: 300, speed: 700 }), await beat();
      for (let i = 0; i < 3; i++) (await swipe(cdp, { dx: -260, y: 300, speed: 900 }), await page.waitForTimeout(500));
      await page.locator('[data-slide-index="1"] .x-p [data-layer="claim"]').first().click();
      await page.waitForTimeout(1500);
    } else {
      // 1장부터 5장까지 위로 쓸어 올리기 (A 는 물음 화면 · 긴 4장의 문단 멈춤이 같이 보인다)
      for (let i = 0; i < (dir === "a" ? 11 : 9); i++) (await swipe(cdp, { dy: 300, speed: 700 }), await beat());
      if (dir === "a") (await page.getByRole("button", { name: "층 보기" }).click(), await page.waitForTimeout(1500));
    }
    const video = page.video()!;
    await ctx.close();
    await video.saveAs(path.join(OUT, `${dir}-swipe-375x667.webm`));
  });
