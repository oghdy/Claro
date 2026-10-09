// B5 — 물음을 따라가는 여정: 막대 없음 · 누른 물음이 다음 화면의 머리 · 지나온 길 · 옆으로 안 움직임
import { expect, test } from "@playwright/test";
import { MOBILE_SE, openLevel, swipe } from "./lab";

test("b5 — 물음을 누르면 그 물음이 다음 화면의 머리가 된다. 옆으로는 아무것도 움직이지 않는다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "b5", "basic");
  const count = page.locator(".b-count");
  await expect(page.locator(".b-segs")).toHaveCount(0); // 스토리식 막대 없음

  for (const dx of [260, -260]) (await swipe(cdp, { dx, y: 300 }), await page.waitForTimeout(500));
  await expect(count).toHaveText("1/9");

  const q = await page.locator('[data-slide-index="0"] [data-u="oq"]').innerText();
  await page.locator('[data-slide-index="0"] .b-next').tap();
  await expect(count).toHaveText("2/9");
  // 올라가는 동안: 사본이 떠 있고 머리는 아직 비어 있다. 도착하면 머리가 이어받는다
  await expect(page.locator(".b5-ghost")).toHaveCount(1);
  const head = page.locator('[data-slide-index="1"] .b5-asked');
  expect(await head.evaluate((e) => getComputedStyle(e).visibility)).toBe("hidden");
  await expect(page.locator(".b5-ghost")).toHaveCount(0);
  expect(await head.evaluate((e) => getComputedStyle(e).visibility)).toBe("visible");
  expect(await head.innerText()).toBe(q);
  // 화면 어디에도 가로로 밀린 것이 없다
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".b5-deck")!.scrollLeft === 0)).toBe(true);
  // 지난 장은 감춰져 있고 누를 수 없다
  expect(await page.locator('[data-slide-index="0"]').evaluate((e) => [getComputedStyle(e).opacity, (e as HTMLElement).inert])).toEqual(["0", true]);
  await ctx.close();
});

test("b5 — 지나온 길: 지나온 물음만 보이고, 누르면 그 자리로 돌아간다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await openLevel(page, "b5", "basic");
  const qs: string[] = [];
  for (let i = 0; i < 3; i++) {
    qs.push(await page.locator(`[data-slide-index="${i}"] [data-u="oq"]`).innerText());
    await page.locator(`[data-slide-index="${i}"] .b-next`).tap();
    await page.waitForTimeout(900);
  }
  await expect(page.locator(".b-count")).toHaveText("4/9");
  await page.locator(".b5-where").tap();
  const items = page.locator(".b5-trail li .b5-trail-t");
  const kicker = await page.locator('[data-slide-index="0"] [data-u="kicker"]').innerText();
  expect(await items.allInnerTexts(), "첫 장 + 지나온 물음 셋. 아직 안 간 물음은 없다").toEqual([kicker, ...qs]);
  await expect(page.locator(".b5-trail li[aria-current]")).toContainText("지금 여기");
  await page.locator(".b5-trail li").nth(1).locator("button").tap();
  await expect(page.locator(".b-count")).toHaveText("2/9");
  await expect(page.locator(".b5-trail")).toHaveCount(0);
  await expect(page.locator('[data-slide-index="1"]')).toHaveAttribute("data-active", "");
  await ctx.close();
});

test("b5 — 긴 장(숙련 4장, 375×667): 내려가야 물음이 나온다 · 마지막 장에 지나온 물음 전부", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "b5", "advanced");
  for (let i = 0; i < 3; i++) (await page.locator(`[data-slide-index="${i}"] .b-next`).tap(), await page.waitForTimeout(1200));
  const card = page.locator('[data-slide-index="3"]');
  await page.waitForTimeout(1200);
  expect(await card.getAttribute("data-ready")).toBeNull();
  for (let k = 0; k < 4; k++) (await swipe(cdp, { dy: 260 }), await page.waitForTimeout(600));
  await expect(card).toHaveAttribute("data-ready", "");
  await card.locator(".b-next").tap();
  await expect(page.locator(".b-count")).toHaveText("5/5");
  await expect(page.locator(".b5-ghost")).toHaveCount(0); // 전환이 끝난 뒤에 읽는다 (올라가는 동안 누른 버튼은 감춰져 있다)
  const all = await page.locator('[data-level] [data-u="oq"]').allInnerTexts();
  expect(await page.locator('[data-slide-index="4"] .b5-path li').allInnerTexts()).toEqual(all);
  await ctx.close();
});

test("b5 — 줄임 설정이면 전환 없이 바로 바뀌고 처음부터 다 보인다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await openLevel(page, "b5", "basic");
  await page.locator('[data-slide-index="0"] .b-next').click();
  await expect(page.locator(".b5-ghost")).toHaveCount(0);
  await expect(page.locator(".b-count")).toHaveText("2/9");
  for (const sel of [".b5-asked", ".x-headline", ".x-block", ".b3-end"])
    expect(await page.locator(`[data-slide-index="1"] ${sel}`).first().evaluate((e) => [getComputedStyle(e).opacity, getComputedStyle(e).visibility]), sel).toEqual(["1", "visible"]);
  await ctx.close();
});
