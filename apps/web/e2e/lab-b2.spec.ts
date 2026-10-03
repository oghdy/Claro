// B2 — 층 전환(끔 · 꼬리표 · 글꼴)의 모습. 375×667 · 375×812 · 1440×900 → logs/frontend/F-2a/b2-*-layers-*.png
import { expect, test } from "@playwright/test";
import path from "node:path";
import { DESKTOP, MOBILE_SE, MOBILE_X, goTo, openLevel } from "./lab";

const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-2a");

for (const [size, vp] of Object.entries({ se: MOBILE_SE, x: MOBILE_X, desktop: DESKTOP }))
  test(`b2 층 전환 ${size}`, async ({ browser }) => {
    const mobile = size !== "desktop";
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await openLevel(page, "b2", "basic");
    const modes = page.getByRole("group", { name: "층 표시" });
    for (const [mode, name] of [["tags", "꼬리표"], ["font", "글꼴"]] as const) {
      await modes.getByRole("button", { name }).click();
      await expect(page.locator(".lab-b")).toHaveAttribute("data-layers", mode);
      // 입문 2장(해석 · 사실 · 이어 주는 글), 4장(개념 → 연결 → 비유 — 독자 검증을 통과한 흐름), 9장(사실과 해석이 한 문단에)
      for (const i of [1, 3, 8]) {
        await goTo(page, "b2", i);
        await page.screenshot({ path: path.join(OUT, `b2-${size}-layers-${mode}-basic-${i + 1}.png`) });
      }
    }
    // 글꼴: 사실은 고딕 그대로, 나머지는 명조
    const fam = (layer: string) => page.locator(`.x-slide [data-layer="${layer}"]`).first().evaluate((e) => getComputedStyle(e).fontFamily);
    expect(await fam("fact")).toContain("Pretendard");
    expect(await fam("claim")).not.toContain("Pretendard");
    await ctx.close();
  });
