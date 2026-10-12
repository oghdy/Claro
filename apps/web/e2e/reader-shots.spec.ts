// 본 화면 스크린샷 (375×667 · 375×812 · 1440×900) + 움직임 안마다 넘어가는 모습 영상 (375×667) → logs/frontend/F-2b/
import { test } from "@playwright/test";
import path from "node:path";
import { DESKTOP, MOBILE_SE, MOBILE_X, MOTIONS, ask, card, goTo, openLevel, readToEnd, swipe } from "./reader";

const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-2b");
const SIZES = { se: MOBILE_SE, x: MOBILE_X, desktop: DESKTOP };

for (const [size, vp] of Object.entries(SIZES)) {
  test(`스크린샷 ${size}`, async ({ browser }) => {
    test.setTimeout(120_000);
    const mobile = size !== "desktop";
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const shot = (name: string) => page.screenshot({ path: path.join(OUT, `${size}-${name}.png`) });

    await openLevel(page, "basic");
    await goTo(page, 0);
    await shot("basic-1");
    await goTo(page, 2);
    await shot("basic-3");
    await goTo(page, 3);
    await shot("basic-4");
    if (mobile) (await goTo(page, 3, true), await shot("basic-4-end"));
    await goTo(page, 8);
    await shot("basic-9");
    await goTo(page, 8, true);
    await shot("basic-9-end");
    await page.locator(".r-where").click();
    await page.waitForTimeout(400);
    await shot("basic-9-trail");
    await page.keyboard.press("Escape");
    await goTo(page, 1);
    await page.getByRole("button", { name: "층", exact: true }).click();
    await card(page, 1).locator('.r-slide [data-layer="claim"]').first().click();
    await page.waitForTimeout(400);
    await shot("basic-2-layers");

    await openLevel(page, "advanced");
    await goTo(page, 3);
    await shot("advanced-4");
    if (mobile) (await goTo(page, 3, true), await shot("advanced-4-end"));
    await goTo(page, 4, true);
    await shot("advanced-5-end");
    await ctx.close();
  });
}

for (const m of MOTIONS)
  test(`영상 움직임 ${m} — 375×667, 입문 1 → 5장 · 지나온 길로 돌아가기`, async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({
      viewport: MOBILE_SE, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      recordVideo: { dir: path.join(import.meta.dirname, "../test-results/video"), size: MOBILE_SE },
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await openLevel(page, "basic", `?m=${m}`);
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(1100);
      await readToEnd(page, cdp, i);
      await page.waitForTimeout(500);
      await ask(page, i);
    }
    await page.waitForTimeout(1200);
    await swipe(cdp, { dx: 260, y: 300 }); // 옆으로 쓸어도 그대로
    await page.waitForTimeout(600);
    await page.locator(".r-where").tap();
    await page.waitForTimeout(1200);
    await page.locator(".r-trail li").nth(1).locator("button").tap();
    await page.waitForTimeout(1200);
    const video = page.video()!;
    await ctx.close();
    await video.saveAs(path.join(OUT, `motion-${m}-375x667.webm`));
  });
