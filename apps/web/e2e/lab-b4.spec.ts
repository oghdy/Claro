// B4 — 옆으로 쓸어서는 안 넘어가고, 물음 버튼으로만 넘어간다. 돌아가기는 "이전 장" 버튼
import { expect, test } from "@playwright/test";
import { MOBILE_SE, openLevel, swipe } from "./lab";

test("b4 — 옆으로 쓸어도 그대로, 물음 버튼을 누르면 다음 장, 이전 버튼으로 돌아간다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "b4", "basic");
  const count = page.locator(".b-count");
  const left = () => page.locator(".b-pager").evaluate((p) => p.scrollLeft);

  for (const dx of [260, 300, -260]) (await swipe(cdp, { dx, y: 300 }), await page.waitForTimeout(600));
  expect(await left(), "쓸어도 안 움직인다").toBe(0);
  await expect(count).toHaveText("1/9");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  expect(await left(), "→ 로도 안 넘어간다").toBe(0);

  await expect(page.getByRole("button", { name: "이전 장" })).toBeDisabled();
  await page.locator('[data-slide-index="0"] .b-next').tap();
  await expect(count).toHaveText("2/9");
  await page.locator('[data-slide-index="1"] .b-next').tap();
  await expect(count).toHaveText("3/9");
  await page.getByRole("button", { name: "이전 장" }).tap();
  await expect(count).toHaveText("2/9");

  // 카드 안 세로 스크롤은 그대로 된다 (숙련 4장)
  await openLevel(page, "b4", "advanced");
  for (let i = 0; i < 3; i++) (await page.locator(`[data-slide-index="${i}"] .b-next`).tap(), await page.waitForTimeout(900));
  await expect(count).toHaveText("4/5");
  await swipe(cdp, { dy: 260 });
  await page.waitForTimeout(600);
  expect(await page.locator('[data-slide-index="3"]').evaluate((c) => c.scrollTop)).toBeGreaterThan(50);
  await ctx.close();
});
