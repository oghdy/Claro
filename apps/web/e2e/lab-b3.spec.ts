// B3 — 물음 버튼이 "다 읽었을 때" 나오는가 · 진행 막대 · 줄임 설정 · 꼬리표 모습
import { expect, test } from "@playwright/test";
import path from "node:path";
import { MOBILE_SE, goTo, openLevel, swipe } from "./lab";

const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-2a");
const opacity = (el: Element) => Number(getComputedStyle(el).opacity);

test("b3 — 짧은 카드: 글이 나타난 뒤에 물음 버튼이 나온다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  // 화면이 그려질 때마다 "마지막 블록 · 물음 버튼이 다 나타난 시각"을 적는다
  await page.addInitScript(() => {
    const t: Record<string, number> = {};
    (window as unknown as { __t: typeof t }).__t = t;
    const tick = () => {
      const card = document.querySelector('[data-slide-index="0"]');
      const op = (sel: string) => { const all = card?.querySelectorAll(sel); const el = all?.[all.length - 1]; return el ? Number(getComputedStyle(el).opacity) : -1; };
      if (t.hidden === undefined && op(".b3-end") === 0) t.hidden = performance.now();
      if (t.block === undefined && op(".x-block") === 1) t.block = performance.now();
      if (t.end === undefined && op(".b3-end") === 1) t.end = performance.now();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto("/lab/b3");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __t: Record<string, number> }).__t.end)).toBeGreaterThan(0);
  const t = await page.evaluate(() => (window as unknown as { __t: Record<string, number> }).__t);
  expect(t.hidden, "처음엔 버튼이 안 보인다").toBeLessThan(t.end!);
  expect(t.block, "본문이 먼저").toBeLessThan(t.end!);
  console.log(`  b3 입문 1장: 본문 다 나타남 → 물음 버튼 다 나타남 ${Math.round(t.end! - t.block!)}ms 뒤`);
  await ctx.close();
});

test("b3 — 긴 카드(숙련 4장, 375×667): 글 끝까지 내려가야 물음 버튼이 나온다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "b3", "advanced");
  for (let i = 0; i < 3; i++) (await swipe(cdp, { dx: 260, y: 300 }), await page.waitForTimeout(800));
  const card = page.locator('[data-slide-index="3"]');
  await expect(page.locator(".b-count")).toHaveText("4/5");
  await page.waitForTimeout(1500); // 글은 다 나타났다
  expect(await card.getAttribute("data-ready"), "아직 안 내려갔으면 버튼 없음").toBeNull();
  expect(await card.locator(".b3-end").evaluate(opacity)).toBe(0);
  for (let k = 0; k < 4; k++) (await swipe(cdp, { dy: 260 }), await page.waitForTimeout(600));
  await expect(card).toHaveAttribute("data-ready", "");
  await expect.poll(() => card.locator(".b3-end").evaluate(opacity)).toBe(1);
  await ctx.close();
});

test("b3 — 진행 막대가 스크롤 위치를 따라간다 · 누른 물음이 다음 카드에 남는다", async ({ page }) => {
  await page.setViewportSize(MOBILE_SE);
  await page.goto("/lab/b3");
  await page.evaluate(() => {
    const p = document.querySelector<HTMLElement>(".b-pager")!;
    p.style.scrollSnapType = "none";
    p.scrollLeft = p.clientWidth * 0.5;
  });
  const seg = page.locator(".b3-segs span").nth(1).locator("i");
  await expect.poll(() => seg.evaluate((e) => e.getBoundingClientRect().width / e.parentElement!.getBoundingClientRect().width)).toBeCloseTo(0.5, 1);
  const q = await page.locator('[data-slide-index="0"] [data-u="oq"]').innerText();
  expect(await page.locator('[data-slide-index="1"] .b3-echo').innerText()).toBe(q);
});

test("b3 — 줄임 설정이면 등장 효과 없이 처음부터 다 보인다", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/lab/b3");
  await page.locator(".b-count").waitFor();
  for (const sel of [".x-headline", ".x-block", ".b3-end"])
    expect(await page.locator(`[data-slide-index="4"] ${sel}`).first().evaluate(opacity), sel).toBe(1);
  await ctx.close();
});

test("b3 — 꼬리표 모습 (375×667)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await openLevel(page, "b3", "basic");
  await page.getByRole("button", { name: "층", exact: true }).click();
  for (const i of [1, 3, 8]) {
    await goTo(page, "b3", i);
    await page.screenshot({ path: path.join(OUT, `b3-se-tags-basic-${i + 1}.png`) });
  }
  // 대조 칸: 라벨과 값이 같은 층이면 꼬리표는 라벨에만
  const tag = (sel: string) => page.locator(`[data-slide-index="3"] .x-c ${sel} [data-layer]`).first().evaluate((e) => getComputedStyle(e, "::before").content);
  expect(await tag(".x-c-label")).not.toBe("none");
  expect(await tag(".x-c-value")).toBe("none");
  await ctx.close();
});
