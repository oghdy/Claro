import { expect, test, type Page } from "@playwright/test";

// UX-9 — 진짜 체험 시안 (/lab/play/* · lab 전용). 원래 회차 화면에서 체험 자리만 새 체험으로 바꿔 끼웠다: 독자가 먼저 정하고 → 결과가 그것을 깬다.
// 실제 주소 (/ · /s/* · /short/* · /map)는 이 Step 이 건드리지 않았다 — 그쪽은 today.spec.ts · episode.spec.ts 가 그대로 본다 (맨 아래 시험 하나가 실제 주소에 새 체험이 없는지만 다시 본다).
test.use({ viewport: { width: 390, height: 844 } });

const watch = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
};
/** 표지부터 물음 단추를 눌러 풀이 장면까지 간다 — 앞뒤 흐름이 그대로인지 */
const toSolve = async (page: Page) => {
  const root = page.locator(".ep-root");
  await expect(root).toHaveAttribute("data-scene", "cover");
  for (let i = 0; i < 8 && (await root.getAttribute("data-scene")) !== "aha"; i += 1) {
    // 도구 줍기 장면 — "이거 알아요?" 에 답해야 접힌다. 답하지 않아도 넘어갈 수 있다
    await page.getByTestId("ask").click();
    await page.waitForTimeout(500);
  }
  await expect(root).toHaveAttribute("data-scene", "aha");
};

test("배달앱 — 내가 값을 정한다 → 요구가 그 값을 되돌린다 (끌기 · 점선으로 남는 내 값 · 막힌 뒤에야 답이 열린다)", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/lab/play/price");
  await toSolve(page);
  const lab = page.getByTestId("lab");
  await expect(lab).toHaveAttribute("data-stage", "set");
  await expect(page.getByTestId("lab-tab-off"), "지금 체험의 탭이 없다 (새 체험이 끼워졌다)").toHaveCount(0);
  await expect(page.getByTestId("lab-gate"), "체험을 마치기 전에는 답이 접혀 있다").toBeVisible();
  await expect(page.getByTestId("price-commit")).toBeDisabled();
  await expect(lab.locator(".ep-app-tag").first()).not.toContainText(/\d/);

  // 값표를 손으로 끌어 내린다 — 내가 정한 눈금에 선다
  const tag = page.getByTestId("price-tag");
  await tag.scrollIntoViewIfNeeded();
  const box = (await tag.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50, { steps: 10 });
  await page.mouse.up();
  await expect(lab).toHaveAttribute("data-level", "2");
  await expect(page.getByTestId("price-state")).toHaveText("새 앱: 더 싸게");
  // 화살표로도 같은 일 (끌기를 못 하는 손)
  await page.getByTestId("price-up").click();
  await expect(lab).toHaveAttribute("data-level", "1");

  await page.getByTestId("price-commit").click();
  await expect(lab).toHaveAttribute("data-stage", "sold");
  await expect(page.getByTestId("lab-caption")).toContainText("값이 내려가는 쪽으로 경쟁이 생겨요.");
  await expect(page.getByTestId("lab-gate"), "한 번 팔아 본 것으로는 답이 열리지 않는다").toBeVisible();

  // 요구가 온다 — 내 값표가 제자리로, 내가 정한 값은 점선으로 남는다
  await page.getByTestId("lab-go-on").click();
  await expect(lab).toHaveAttribute("data-stage", "tied");
  await expect(page.getByTestId("price-demand")).toHaveText("“다른 앱보다 비싸게 팔지 마세요”");
  await expect(page.getByTestId("price-ghost")).toHaveText("내가 정한 값");
  await expect(page.getByTestId("price-state")).toHaveText("같은 값");

  // 다시 내린다 — 막힌다 → 답이 열린다
  await page.getByTestId("price-down").click();
  await expect(lab).toHaveAttribute("data-stage", "blocked");
  await expect(page.getByTestId("price-state")).toHaveText("내릴 수 없어요");
  await expect(page.getByTestId("lab-caption")).toContainText("결국 두 앱의 값은 같은 자리에 묶여요.");
  await expect(page.getByTestId("price-ghost"), "막힌 뒤에도 내 값이 남아 있다").toBeVisible();
  await expect(page.getByTestId("lab-gate")).toHaveCount(0);
  await expect(page.locator(".ep-flip")).toContainText("“다른 앱에서 더 싸게 팔지 마세요”");
  expect(errors).toEqual([]);
});

test("금리 — 먼저 표를 던진다 → 실제 표가 열린다 (까닭마다 받는 말 · 아무도 앉지 않은 쪽 · 채점하는 말 없음 · 처음 던진 표가 남는다)", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/lab/play/rate?at=play");
  await expect(page.locator(".ep-root")).toHaveAttribute("data-scene", "aha");
  // 9월 회의 — 틀 부품 그대로. 밟기 전에는 표가 없다
  await expect(page.getByTestId("rate-ballot")).toHaveCount(0);
  await page.getByTestId("lab-act").click();
  await page.getByTestId("rate-go-on").click();
  const ballot = page.getByTestId("rate-ballot");
  await expect(ballot).toBeVisible();
  await expect(page.getByTestId("lab-gate"), "표를 던지기 전에는 답이 접혀 있다").toBeVisible();
  await expect(ballot.locator(".fr-seat")).toHaveCount(12);
  await expect(page.getByTestId("rate-result"), "던지기 전에는 실제 결과가 안 보인다").toHaveCount(0);
  await expect(page.getByTestId("rate-cast")).toBeDisabled();

  // 그대로 둔다 + "이제 물가가 잡힐 것 같아서" — 뒤집기가 내 표 위에서 깨진다
  await page.getByTestId("rate-vote-wait").click();
  await expect(page.getByTestId("rate-cast"), "까닭을 골라야 던질 수 있다").toBeDisabled();
  await page.getByTestId("rate-why-0").click();
  await page.getByTestId("rate-cast").click();
  await expect(page.getByTestId("rate-result")).toHaveText("실제 결과 · 10 대 2로 ‘그대로’");
  await expect(page.getByTestId("rate-side-wait").locator(".fr-seat")).toHaveCount(10);
  await expect(page.getByTestId("rate-side-raise").locator(".fr-seat")).toHaveCount(2);
  await expect(page.getByTestId("rate-side-wait").locator(".fr-seat[data-me]")).toHaveCount(1);
  await expect(page.getByTestId("rate-mine")).toContainText("10명과 같은 쪽에 앉았어요.");
  await expect(page.getByTestId("rate-reply")).toContainText("표는 같은데 까닭이 달랐어요.");
  await expect(ballot.getByTestId("lab-caption")).toContainText("의장이 전한 판단은 이래요.");
  await expect(ballot).toContainText("어느 쪽이 맞는지는 우리가 정하지 않아요.");
  expect(await ballot.innerText(), "채점하는 말이 없다").not.toMatch(/정답|오답|맞았|틀렸|맞혔/);
  await expect(page.getByTestId("lab-gate")).toHaveCount(0);

  // 다른 표 — 내린다: 그쪽에는 아무도 앉지 않았다. 열두 자리는 그대로 10 과 2
  await page.getByTestId("rate-again").click();
  await page.getByTestId("rate-vote-cut").click();
  await page.getByTestId("rate-why-0").click();
  await page.getByTestId("rate-cast").click();
  await expect(page.getByTestId("rate-alone")).toContainText("내리자 · 나 혼자");
  await expect(page.getByTestId("rate-side-wait").locator(".fr-seat")).toHaveCount(10);
  await expect(page.getByTestId("rate-side-raise").locator(".fr-seat")).toHaveCount(2);
  await expect(page.getByTestId("rate-mine")).toContainText("내리자는 표는 없었어요.");
  await expect(page.getByTestId("rate-first")).toContainText("그대로 둔다 · 이제 물가가 잡힐 것 같아서");

  // 다른 표 — 올린다: 까닭이 아직 문서에 없다는 말이 화면에 있다 (계약 불변식 17 과 같은 일)
  await page.getByTestId("rate-again").click();
  await page.getByTestId("rate-vote-raise").click();
  await page.getByTestId("rate-why-1").click();
  await page.getByTestId("rate-cast").click();
  await expect(page.getByTestId("rate-side-raise").locator(".fr-seat[data-me]")).toHaveCount(1);
  await expect(ballot.getByTestId("lab-caption")).toContainText("우리가 확인한 문서에 아직 없어요.");
  // 쪽을 누르면 그쪽이 한 말
  await page.getByTestId("rate-side-wait").click();
  await expect(ballot.getByTestId("lab-caption")).toContainText("10명이 앉은 쪽이에요.");
  expect(await ballot.innerText(), "한국의 대출 이자로 잇지 않는다").not.toMatch(/한국|대출 이자/);
  expect(errors).toEqual([]);
});

test("개인정보 — 먼저 핀을 꽂는다 → 한 장씩 넘긴다 → 위원회의 ★ 과 견준다 (핀이 남는다 · 반사실 없음 · 넘기기 전에는 판단이 안 보인다)", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/lab/play/privacy?at=play");
  await expect(page.locator(".ep-title")).toContainText("보안 담당이");
  const lab = page.getByTestId("lab");
  await expect(lab).toHaveAttribute("data-phase", "pin");
  await expect(lab.locator("li[data-face]")).toHaveCount(6);
  expect(await lab.innerText(), "넘기기 전에는 위원회의 판단이 안 보인다").not.toMatch(/소홀/);
  await expect(page.getByTestId("pin-neglect")).toContainText("알림 뒤의 대응");
  await expect(page.getByTestId("pin-go")).toBeDisabled();
  await expect(page.getByTestId("lab-gate")).toBeVisible();

  // 핀 — 옮겨 꽂을 수 있다 (하나만)
  await page.getByTestId("pin-path").click();
  await page.getByTestId("pin-first").click();
  await expect(page.getByTestId("pin")).toHaveCount(1);
  await expect(lab).toHaveAttribute("data-pin", "first");
  await page.getByTestId("pin-go").click();
  await expect(lab).toHaveAttribute("data-phase", "turn");

  // 한 장씩 — ★ 칸의 뒷면에는 골든의 물음. 넘기면 위원회의 ★
  for (let i = 0; i < 3; i += 1) await page.getByTestId("lab-act").click();
  await expect(page.getByTestId("lab-act")).toContainText("알림을 받은 회사는, 그다음에 어떻게 했을까요?");
  await expect(page.getByTestId("pin-compare"), "다 넘기기 전에는 견준 말이 없다").toHaveCount(0);
  await page.getByTestId("lab-act").click();
  await expect(lab.locator("li[data-star]")).toContainText("대응을 소홀히 했어요");
  await expect(lab.locator("li[data-star]")).toContainText("위원회의 ★");
  await expect(lab.locator("li[data-card=first] [data-testid=pin]"), "내 핀이 그 칸에 남아 있다").toBeVisible();
  await page.getByTestId("lab-act").click();
  await page.getByTestId("lab-act").click();
  await expect(lab).toHaveAttribute("data-phase", "done");
  await expect(lab.locator("li[data-card]")).toHaveCount(6);
  await expect(page.getByTestId("pin-reply")).toContainText("위원회는 해커 이야기에서 멈추지 않았어요.");
  await expect(lab).toContainText("“그때 막았으면 두 번째는 없었다”고까지 말한 건 아니에요.");
  await expect(lab).toContainText("핀은 채점하지 않아요.");
  await expect(page.getByTestId("lab-gate")).toHaveCount(0);
  await expect(page.getByTestId("tool-proviso")).toBeVisible();

  // 다시 — ★ 과 같은 칸. "맞았다"고 하지 않는다 · 처음 꽂은 칸이 남는다
  await page.getByTestId("pin-again").click();
  await page.getByTestId("pin-neglect").click();
  await page.getByTestId("pin-go").click();
  for (let i = 0; i < 6; i += 1) await page.getByTestId("lab-act").click();
  await expect(page.getByTestId("pin-reply")).toContainText("내 핀과 위원회의 ★ 이 같은 칸에 있어요.");
  await expect(page.getByTestId("pin-first")).toContainText("첫 번째 유출");
  expect(await lab.innerText(), "채점하는 말이 없다").not.toMatch(/정답|오답|맞았|틀렸|맞혔/);
  expect(errors).toEqual([]);
});

test("들머리 · 실제 주소 — /lab/play 는 세 길 · 실제 주소 (/s/*)의 체험은 지금 그대로다 (새 체험이 없다)", async ({ page }) => {
  await page.goto("/lab/play");
  await expect(page.locator(".pl-index li")).toHaveCount(3);
  await expect(page.getByTestId("play-price")).toHaveAttribute("href", "/lab/play/price");
  for (const [path, old] of [
    ["/s/price/1", "lab-tab-off"],
    ["/s/rate/2", "lab-tab-0"],
    ["/s/privacy/1", "lab-act"],
  ] as const) {
    await page.goto(path);
    const root = page.locator(".ep-root");
    for (let i = 0; i < 8 && (await root.getAttribute("data-scene")) !== "aha"; i += 1) {
      await page.getByTestId("ask").click();
      await page.waitForTimeout(500);
    }
    await expect(root).toHaveAttribute("data-scene", "aha");
    await expect(page.getByTestId(old), `${path} — 지금 체험의 부품`).toBeVisible();
    await expect(page.locator(".pl-price, .pl-rate, .pl-privacy"), `${path} — 새 체험이 없다`).toHaveCount(0);
  }
});
