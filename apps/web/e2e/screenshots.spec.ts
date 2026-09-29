// 모바일(375×812) · 데스크톱(1440×900) 스크린샷 → logs/frontend/F-1/
import { test } from "@playwright/test";
import path from "node:path";
import { goToSlide } from "./dom";

const OUT = path.join(import.meta.dirname, "../../../logs/frontend/F-1");
const VIEWS = { mobile: { width: 375, height: 812 }, desktop: { width: 1440, height: 900 } };
// 입문 1 · 4(대조) · 9(마지막) / 숙련 4(표 — 375×812 에서 teaser 겹침이 있던 장) · 5
const SHOTS: [string, "입문" | "숙련", number][] = [
  ["basic-1", "입문", 0],
  ["basic-4", "입문", 3],
  ["basic-9", "입문", 8],
  ["advanced-4", "숙련", 3],
  ["advanced-5", "숙련", 4],
];

for (const [view, size] of Object.entries(VIEWS)) {
  test(`스크린샷 ${view}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    for (const [name, lv, i] of SHOTS) {
      await page.getByRole("button", { name: lv }).click();
      await goToSlide(page, i);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(OUT, `${view}-${name}.png`) });
    }
    await page.goto("/test/unknown-type");
    await page.screenshot({ path: path.join(OUT, `${view}-unknown-type-1.png`) });
  });
}
