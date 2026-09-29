// 레벨을 바꿀 때 읽던 위치 (FOMC-21): 레벨마다 자기 위치를 기억한다. 처음 여는 레벨은 1장부터
import { expect, test } from "@playwright/test";
import { goToSlide } from "./dom";

test("레벨 전환 — 처음 여는 레벨은 1장, 돌아오면 떠났던 장", async ({ page }) => {
  await page.goto("/");
  const count = page.locator(".count");
  await expect(count).toHaveText("1/9");
  await goToSlide(page, 3);
  await expect(count).toHaveText("4/9");

  await page.getByRole("button", { name: "숙련" }).click();
  await expect(count).toHaveText("1/5");
  await goToSlide(page, 2);
  await expect(count).toHaveText("3/5");

  await page.getByRole("button", { name: "입문" }).click();
  await expect(count).toHaveText("4/9");
  await expect(page.locator(".page").nth(3)).toBeInViewport({ ratio: 0.3 });

  await page.getByRole("button", { name: "숙련" }).click();
  await expect(count).toHaveText("3/5");
});

test("마지막 장에는 '처음부터 다시 보기' 하나", async ({ page }) => {
  await page.goto("/");
  await goToSlide(page, 8);
  await expect(page.locator(".count")).toHaveText("9/9");
  await expect(page.locator(".page").nth(8).getByRole("button")).toHaveText(["처음부터 다시 보기"]);
  await page.getByRole("button", { name: "처음부터 다시 보기" }).click();
  await expect(page.locator(".count")).toHaveText("1/9");
});
