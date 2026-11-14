import { expect, test } from "@playwright/test";

// UX-8 — 짧은 이야기 손 견본 (/lab/short · lab 전용 꼴). 표지 + 한 흐름: 물음 단추는 표지의 하나뿐 · 가운데 "예상 한 번 고르기" · 고르기 전에는 뒤가 안 보인다 · 어느 쪽을 골라도 같은 곳으로.
// 실제 주소 (/ · /s/* · /short/* · /map)는 이 Step 이 건드리지 않았다 — 그쪽은 today.spec.ts · episode.spec.ts 가 그대로 본다.
test.use({ viewport: { width: 390, height: 844 } });

test("짧은 이야기 손 견본 — 표지 → 한 흐름 · 고르면 이어진다 · 근거를 누르면 원문 구절 · 남는 한 줄 · 낱말 둘", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/lab/short");
  const root = page.getByTestId("light");
  await expect(root).toHaveAttribute("data-scene", "cover");
  await expect(page.locator(".ep-title-cover")).toContainText("왜 더하면 안 맞을까");
  await expect(page.locator(".ep-track"), "시리즈 줄이 없다").toHaveCount(0);
  await expect(page.locator(".ep-count"), "장면 세기가 없다 (한 흐름)").toHaveCount(0);

  // 표지의 물음 하나 → 이야기
  await expect(page.getByTestId("ask")).toHaveCount(1);
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "story");
  await expect(page.getByTestId("ask"), "이야기 안에는 물음 단추가 없다").toHaveCount(0);
  await expect(page.locator(".lt-flow")).toContainText("네, 한번 더해 볼게요.");
  await expect(page.locator(".lt-cite blockquote")).toHaveText("10년 전에 비해 약 26.9%(7.5%p) 증가하였다.");
  await expect(page.getByTestId("flip")).toContainText("“26.9%p 늘었다”");
  expect(await page.locator(".lt-flow").innerText(), "번호 · 목록 꼴이 없다").not.toMatch(/\d화|짚은 것/);

  // 고르기 전 — 뒤가 없다
  await expect(page.getByTestId("rest")).toHaveCount(0);
  await expect(page.getByTestId("oneline")).toHaveCount(0);
  await page.getByTestId("pick-men").click();
  await expect(page.getByTestId("reply")).toContainText("퍼센트포인트로 재면 그래요.");
  await expect(page.getByTestId("rest")).toBeVisible();
  // 다른 쪽을 눌러도 받는 말만 바뀐다 — 이야기는 같은 곳으로 간다
  await page.getByTestId("pick-women").click();
  await expect(page.getByTestId("reply")).toContainText("변화율로 재면 그래요.");
  await expect(page.getByTestId("rest")).toContainText("어느 쪽을 골랐어도 맞아요.");
  await expect(page.getByTestId("oneline")).toContainText("몇에서 몇이 됐는지부터 찾는다.");

  // 낱말 둘 — 접혀 있고 펼치면 풀이
  await expect(page.locator("[data-testid^=word-]")).toHaveCount(2);
  await page.getByTestId("word-pp").getByRole("button").click();
  await expect(page.getByTestId("word-pp")).toContainText("변화폭(%p)");

  // 근거 — 켜고 깨는 사실을 누르면 저장된 문서의 구절
  await page.getByTestId("src-toggle").click();
  await page.locator(".lt-flow .ep-src-hit", { hasText: "지금의 비만율은 35.4%예요" }).click();
  await expect(page.locator(".ep-sheet blockquote").first()).toContainText("성인 3명 중 1명(35.4%)이 비만인 것으로 나타났으며");
  await expect(page.locator(".ep-sheet cite").first()).toContainText("질병관리청 보도자료");
  await page.locator(".ep-sheet header button").click();
  // 계산한 수는 어떻게 냈는지 보인다
  await page.locator(".lt-flow .ep-src-hit", { hasText: "네, 한번 더해 볼게요." }).click();
  await expect(page.locator(".ep-sheet-calc")).toContainText("27.9 = 35.4 − 7.5");
  await page.locator(".ep-sheet header button").click();

  // 견줘 읽기 — 다른 두 편으로 가는 길 (실제 주소 · 시안 주소를 가리키기만 한다)
  await expect(page.getByTestId("compare").locator("a")).toHaveCount(2);
  await expect(page.getByTestId("compare").locator("a").first()).toHaveAttribute("href", "/short/license-notice");
  expect(errors).toEqual([]);
});
