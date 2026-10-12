// 화면이 아는 순간 셋이 한 곳(Reader 의 notice)을 지나는가 — 읽기 기록(OBSERVATION §5)을 나중에 붙일 자리.
// 기록 자체는 이 Step 에서 만들지 않는다. /test/moments 가 notice 를 window.__moments 에 쌓는다.
//   slide  지금 장이 바뀌었다 (열자마자 첫 장도)   level  레벨을 바꿨다
//   end    이 장의 끝이 화면에 나왔다 — 물음 버튼이 나오는 순간. **물음 버튼이 없는 마지막 장에도 있어야 한다** (D33)
import { expect, test } from "@playwright/test";
import { MOBILE_SE, ask, card, count, readToEnd, settled } from "./reader";

test("순간 — 장이 바뀐다 · 끝이 화면에 나왔다(마지막 장 포함) · 레벨을 바꿨다", async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto("/test/moments");
  await page.getByRole("button", { name: "숙련", exact: true }).tap();
  await settled(page, 0);
  const moments = () => page.evaluate(() => (window as any).__moments.map((m: any) => (m.kind === "level" ? `level ${m.from}>${m.to}` : `${m.kind} ${m.level} ${m.index}`)));
  const adv = (await moments()).slice(-2);
  expect(adv).toEqual(["level basic>advanced", "slide advanced 0"]);
  expect((await moments())[0]).toBe("slide basic 0");

  await page.evaluate(() => ((window as any).__moments.length = 0));
  for (let i = 0; i < 4; i++) {
    // 긴 장(4장): 끝까지 내리기 전에는 end 가 없다
    if (i === 3) (await page.waitForTimeout(1500), expect(await moments()).not.toContain("end advanced 3"));
    await readToEnd(page, cdp, i);
    expect((await moments()).at(-1), `${i + 1}장 — 물음 버튼이 나온 순간`).toBe(`end advanced ${i}`);
    await ask(page, i);
  }
  await expect(count(page)).toHaveText("5/5");
  await expect(card(page, 4).locator('[data-u="oq"]')).toHaveCount(0);
  await readToEnd(page, cdp, 4);
  expect(await moments()).toEqual([
    "end advanced 0", "slide advanced 1", "end advanced 1", "slide advanced 2", "end advanced 2", "slide advanced 3",
    "end advanced 3", "slide advanced 4", "end advanced 4",
  ]);
  // 지나온 길로 되돌아가는 것도 같은 slide 순간이다. 이미 끝을 본 장의 end 는 다시 나오지 않는다
  await page.locator(".r-where").tap();
  await page.locator(".r-trail li").nth(1).locator("button").tap();
  await settled(page, 1);
  await page.waitForTimeout(600);
  expect((await moments()).slice(9)).toEqual(["slide advanced 1"]);
  await ctx.close();
});
