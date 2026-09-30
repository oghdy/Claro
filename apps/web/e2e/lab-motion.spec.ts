// F-2a — 움직임을 줄이는 설정(prefers-reduced-motion)을 따르는가
import { expect, test } from "@playwright/test";
import { openLevel } from "./lab";

test("B — 줄임 설정이면 '다음'이 미끄러지지 않고 바로 넘어간다", async ({ browser }) => {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, reducedMotion });
    const page = await ctx.newPage();
    await openLevel(page, "b", "basic");
    await page.locator('[data-slide-index="0"] .b-next').click();
    const x = await page.evaluate(() => {
      const p = document.querySelector<HTMLElement>(".b-pager")!;
      return p.scrollLeft / p.clientWidth;
    });
    // 누른 직후: 줄임이면 이미 다음 카드, 아니면 아직 가는 중
    if (reducedMotion === "reduce") expect(x).toBe(1);
    else expect(x).toBeLessThan(1);
    await ctx.close();
  }
});

test("A · B — 줄임 설정이면 전환 · 등장 애니메이션이 없다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/lab/a");
  expect(await page.locator(".a-more").evaluate((e) => getComputedStyle(e).transitionDuration)).toBe("0s");
  await page.goto("/lab/b");
  expect(await page.locator(".b-hint").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  await ctx.close();
});
