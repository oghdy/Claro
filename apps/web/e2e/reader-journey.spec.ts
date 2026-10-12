// 본 화면의 흐름 (D26): 한 번에 한 장 · 물음 버튼으로만 · 다 읽었을 때 버튼 · 누른 물음이 머리 · 막대 없이 지나온 길 · 겹쳐 둔 장은 inert
import { expect, test } from "@playwright/test";
import { MOBILE_SE, ask, card, count, openLevel, readToEnd, settled, swipe } from "./reader";

const phone = { viewport: MOBILE_SE, isMobile: true, hasTouch: true };

test("쓸어서는 넘어가지 않는다. 물음을 누르면 그 물음이 다음 화면의 머리가 된다. 옆으로는 아무것도 움직이지 않는다", async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "basic");
  await expect(page.locator(".r-segs, .segs")).toHaveCount(0); // 스토리식 막대 없음
  await readToEnd(page, cdp, 0);

  for (const d of [{ dx: 260 }, { dx: -260 }, { dy: 300 }, { dy: -300 }]) (await swipe(cdp, { y: 300, ...d }), await page.waitForTimeout(400));
  await expect(count(page)).toHaveText("1/9");

  const q = await card(page, 0).locator('[data-u="oq"]').innerText();
  // 버튼의 글자 자리 → 머리의 글자 자리. 올라가는 동안 줄바꿈 · 크기가 같아야 한 동작으로 보인다
  const box = (sel: string) => page.locator(sel).evaluate((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { w: r.width, h: r.height, font: `${s.fontSize}/${s.lineHeight}/${s.fontWeight}/${s.letterSpacing}` }; });
  const from = await box('.r-card[data-slide-index="0"] .r-ask-q');
  await card(page, 0).locator(".r-ask").tap();
  await expect(count(page)).toHaveText("2/9");
  await settled(page, 1);
  const to = await box('.r-card[data-slide-index="1"] .r-asked-fly');
  expect(await card(page, 1).locator(".r-asked-text").innerText()).toBe(q);
  expect(to, "버튼 안의 글자와 머리의 글자 — 같은 폭 · 높이 · 글자").toEqual(from);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".r-deck")!.scrollLeft === 0)).toBe(true);
  expect(await card(page, 0).evaluate((e) => [getComputedStyle(e).opacity, (e as HTMLElement).inert])).toEqual(["0", true]);
  await ctx.close();
});

test("지나온 길: 지나온 물음만 보이고, 누르면 그 자리로 돌아간다", async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "basic");
  const qs: string[] = [];
  for (let i = 0; i < 3; i++) {
    await readToEnd(page, cdp, i);
    qs.push(await card(page, i).locator('[data-u="oq"]').innerText());
    await ask(page, i);
  }
  await expect(count(page)).toHaveText("4/9");
  await page.locator(".r-where").tap();
  await expect(page.locator(".r-trail li .r-trail-t")).toHaveText(["시작", ...qs]); // 첫 장("시작") + 지나온 물음 셋. 아직 안 간 물음은 없다
  await expect(page.locator(".r-trail li[aria-current]")).toContainText("지금 여기");
  await page.locator(".r-trail li").nth(1).locator("button").tap();
  await expect(count(page)).toHaveText("2/9");
  await expect(page.locator(".r-trail")).toHaveCount(0);
  await settled(page, 1);
  await ctx.close();
});

test("긴 장(입문 4장 · 숙련 4장, 375×667): 끝까지 내려야 물음이 나오고, 그 전에는 누를 수 없다", async ({ browser }) => {
  test.setTimeout(90_000);
  for (const level of ["basic", "advanced"]) {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await openLevel(page, level);
    for (let i = 0; i < 3; i++) (await readToEnd(page, cdp, i), await ask(page, i));
    const c = card(page, 3);
    await page.waitForTimeout(1500); // 글이 다 나타난 뒤에도
    expect(await c.evaluate((e) => e.scrollHeight > e.clientHeight), `${level} 4장은 화면보다 길다`).toBe(true);
    expect(await c.getAttribute("data-ended"), `${level} 4장 — 내리기 전에는 끝이 아니다`).toBeNull();
    expect(await c.locator(".r-end").evaluate((e) => [getComputedStyle(e).opacity, getComputedStyle(e).pointerEvents])).toEqual(["0", "none"]);
    await expect(page.locator(".r-more")).toHaveAttribute("data-show", ""); // "아래에 더 있어요"
    const swipes = await readToEnd(page, cdp, 3);
    expect(swipes).toBeGreaterThan(0);
    await ask(page, 3);
    await expect(count(page)).toHaveText(level === "basic" ? "5/9" : "5/5");
    await ctx.close();
  }
});

test("마지막 장: 물음 버튼이 없다. 요점 문장 다음에 지나온 물음 전부 · 다른 레벨 · 처음부터", async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "advanced");
  const qs: string[] = [];
  for (let i = 0; i < 4; i++) {
    await readToEnd(page, cdp, i);
    qs.push(await card(page, i).locator('[data-u="oq"]').innerText());
    await ask(page, i);
  }
  const last = card(page, 4);
  await expect(last.locator('[data-u="oq"]')).toHaveCount(0);
  await expect(last.locator('.r-p[data-weight="conclusion"]')).toHaveCount(1);
  await readToEnd(page, cdp, 4);
  await expect(last.locator(".r-path li")).toHaveText(qs);
  await expect(last.getByRole("button")).toHaveText(["입문으로 다시 읽기", "처음부터 다시 보기"]);
  await last.getByRole("button", { name: "처음부터 다시 보기" }).tap();
  await expect(count(page)).toHaveText("1/5");
  await ctx.close();
});

test("레벨을 바꾸면: 처음 가는 레벨은 1장, 돌아온 레벨은 읽던 자리", async ({ page }) => {
  await openLevel(page, "basic");
  for (let i = 0; i < 3; i++) await ask(page, i, false);
  await expect(count(page)).toHaveText("4/9");
  await page.getByRole("button", { name: "숙련", exact: true }).click();
  await expect(count(page)).toHaveText("1/5");
  for (let i = 0; i < 2; i++) await ask(page, i, false);
  await page.getByRole("button", { name: "입문", exact: true }).click();
  await expect(count(page)).toHaveText("4/9");
  await settled(page, 3);
  // 돌아온 자리 — 지나온 물음이 머리에 있고, 지나온 길도 그대로다
  const q3 = await card(page, 2).locator('[data-u="oq"]').innerText();
  await expect(card(page, 3).locator(".r-asked-text")).toHaveText(q3);
  await page.locator(".r-where").click();
  await expect(page.locator(".r-trail li")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "숙련", exact: true }).click();
  await expect(count(page)).toHaveText("3/5");
});

test("새로고침하면 읽던 자리(레벨 · 레벨별 장)를 되살린다. 같은 탭 안에서만 — 새 탭은 1장부터", async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await openLevel(page, "basic");
  for (let i = 0; i < 2; i++) (await readToEnd(page, cdp, i), await ask(page, i));
  await page.getByRole("button", { name: "숙련", exact: true }).tap();
  for (let i = 0; i < 3; i++) (await readToEnd(page, cdp, i), await ask(page, i));
  await expect(count(page)).toHaveText("4/5");

  await page.reload();
  await expect(page.locator('.r-deck[data-level="advanced"]')).toBeVisible();
  await expect(count(page)).toHaveText("4/5");
  await settled(page, 3);
  // 되살린 장은 글이 보이고, 긴 장(숙련 4장)이라 물음 버튼은 여전히 내려야 나온다. 지나온 장은 끝을 본 것으로 남아 있다
  await expect(card(page, 3).locator(".r-headline")).toHaveCSS("opacity", "1");
  expect(await card(page, 2).getAttribute("data-ended")).toBe("");
  expect(await card(page, 3).getAttribute("data-ended")).toBeNull();
  await readToEnd(page, cdp, 3);
  // 다른 레벨의 자리도 살아 있다
  await page.getByRole("button", { name: "입문", exact: true }).tap();
  await expect(count(page)).toHaveText("3/9");
  await page.reload();
  await expect(count(page)).toHaveText("3/9");

  // 새 탭(같은 브라우저) — 1장부터
  const other = await ctx.newPage();
  await openLevel(other, "basic");
  await expect(count(other)).toHaveText("1/9");
  await expect(other.locator('.r-deck[data-level="basic"]')).toBeVisible();
  await ctx.close();
});

test("키보드: 물음 버튼은 Tab 으로 닿고 Enter 로 눌린다. 감춰 둔 장으로는 들어가지 않는다. ← 는 한 장 뒤로", async ({ page }) => {
  await page.setViewportSize(MOBILE_SE);
  await openLevel(page, "basic");
  await settled(page, 0);
  // 위쪽 줄(지나온 길 · 입문 · 숙련 · 층) 다음이 지금 장의 물음 버튼이다 — 다른 장의 버튼이 끼어들지 않는다
  const seen: string[] = [];
  for (let k = 0; k < 6; k++) {
    await page.keyboard.press("Tab");
    seen.push(await page.evaluate(() => { const a = document.activeElement as HTMLElement; return a.closest(".r-card")?.getAttribute("data-slide-index") ?? a.className; }));
  }
  expect(seen.slice(0, 5)).toEqual(["r-where", "", "", "r-lens", "0"]);
  expect(seen.filter((s) => /^\d+$/.test(s) && s !== "0"), "다른 장에 초점이 들어가지 않는다").toEqual([]);
  await page.locator('.r-card[data-slide-index="0"] .r-ask').focus();
  await page.keyboard.press("Enter");
  await expect(count(page)).toHaveText("2/9");
  await settled(page, 1);
  expect(await page.evaluate(() => document.activeElement?.getAttribute("data-slide-index")), "초점이 새 장으로 옮겨 간다").toBe("1");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).closest(".r-card")?.getAttribute("data-slide-index"))).toBe("1");
  await page.keyboard.press("Enter");
  await expect(count(page)).toHaveText("3/9");
  await settled(page, 2);
  await page.keyboard.press("ArrowLeft");
  await expect(count(page)).toHaveText("2/9");
});

test("층: 버튼을 켜면 글자 꼬리표, 문장을 누르면 설명. 층마다 다른 색은 없다", async ({ page }) => {
  await page.setViewportSize(MOBILE_SE);
  await openLevel(page, "basic");
  await ask(page, 0, false);
  await page.waitForTimeout(900);
  const tag = (layer: string) => card(page, 1).locator(`.r-slide [data-layer="${layer}"]`).first().evaluate((e) => { const s = getComputedStyle(e, "::before"); return { content: s.content, color: s.color, border: s.borderColor, bg: s.backgroundColor }; });
  expect((await tag("claim")).content).toBe("none");
  await page.getByRole("button", { name: "층", exact: true }).click();
  await expect(page.locator(".r-legend")).toHaveText("사실 — 출처에 있는 것 · 해석 — Claro 가 끌어낸 것 · 개념 — 배경 설명 · 연결 — 개념을 이 뉴스에 잇는 말");
  const [claim, fact] = [await tag("claim"), await tag("fact")];
  expect([claim.content, fact.content]).toEqual(['"해석"', '"사실"']);
  expect({ ...claim, content: "" }, "꼬리표는 글자만 다르다").toEqual({ ...fact, content: "" });
  await card(page, 1).locator('.r-slide [data-layer="claim"]').first().click();
  await expect(page.locator(".r-sheet")).toHaveText("해석사실들에서 Claro 가 끌어낸 해석이에요.×");
  await page.keyboard.press("Escape");
  await expect(page.locator(".r-sheet")).toHaveCount(0);
  // 표시가 없는 글(writing)은 눌러도 아무것도 뜨지 않는다
  const writing = card(page, 1).locator('.r-slide [data-layer="writing"]').first();
  expect(await writing.evaluate((e) => getComputedStyle(e, "::before").content)).toBe("none");
  await writing.click();
  await page.waitForTimeout(400);
  await expect(page.locator(".r-sheet")).toHaveCount(0);
  expect(await writing.getAttribute("data-selected")).toBeNull();
  // 연결(bridge) — "이 뉴스"
  await page.getByRole("button", { name: "층", exact: true }).click();
  for (let i = 1; i < 3; i++) await ask(page, i, false);
  await page.waitForTimeout(900);
  await card(page, 3).locator('.r-slide [data-layer="bridge"]').first().click();
  await expect(page.locator(".r-sheet")).toHaveText("연결개념을 이 뉴스에 잇는 문장이에요.×");
});

test("움직임 줄이기 설정이면 전환 없이 바로 바뀐다. 물음 버튼은 그래도 다 읽었을 때 나온다", async ({ browser }) => {
  const ctx = await browser.newContext({ ...phone, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await openLevel(page, "basic");
  await expect(page.locator(".reader")).toHaveAttribute("data-motion", "none");
  await card(page, 0).locator(".r-ask").tap();
  // 누른 바로 그 순간: 물러나는 장도, 올라오는 물음도 없다. 새 장의 글은 이미 다 보인다
  const now = await page.evaluate(() => ({
    count: document.querySelector(".r-count")!.textContent,
    leaving: document.querySelectorAll(".r-card[data-leaving], .r-deck[data-moving]").length,
    running: document.getAnimations().length,
    opacity: Array.from(document.querySelectorAll('.r-card[data-slide-index="1"] :is(.r-asked-text, .r-kicker, .r-headline, .r-block)')).map((e) => getComputedStyle(e).opacity),
  }));
  expect(now).toEqual({ count: "2/9", leaving: 0, running: 0, opacity: ["1", "1", "1", "1", "1"] });
  await ctx.close();
});
