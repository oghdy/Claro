import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// UX-10b — 기름값 1화를 이야기 짜는 법으로 손으로 다시 짠 둘째 판 (/lab/episode/oil-replot-b). 화면은 실제 /s/oil/1 과 같은 부품 · 같은 그림 — 이야기의 차례만 다르다.
// **글은 episode.json 에서 읽어 댄다** — 글을 손질해도 이 시험은 선다. 실제 주소 (/s/oil/1)는 이 Step 이 건드리지 않았다 — 그대로인지 여기서 한 번 더 본다.
const FILE = path.join(import.meta.dirname, "../src/app/lab/episode/oil-replot-b/episode.json");
type Text = { t: string };
const ep = JSON.parse(readFileSync(FILE, "utf8")) as { assembly: { new: string[] }; scenes: { cover: { title: string; ask_new: string }; event: { ask: string; title: string }; tools: { ask: string }; aha: { ask_new: string }; keep: { line: string } }; solve: { lab: { frames: { nodes: { id: string; still?: Text }[] }[] }; entry: { flip: { a: string } } } };
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const STILL = "적용 대상에서 제외";

test.use({ viewport: { width: 390, height: 844 } });

test("둘째 판 — 표지 → 오늘의 사건 → 도구 → 풀이 (답은 누른 뒤) → 이어짐 → 남음 · 지금까지의 이야기 없음 · 콘솔 오류 0", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico")) errors.push(`${m.text()} (${m.location().url})`);
  });
  const res = await page.goto("/lab/episode/oil-replot-b");
  expect(res?.status()).toBe(200);
  const root = page.locator(".ep-root");

  // 맨 위 견줘 읽기 길 하나 — 실제 /s/oil/1 로
  await expect(page.getByTestId("orb-compare")).toHaveAttribute("href", "/s/oil/1");
  // 표지 — 제목 위 뉴스 한 줄 · 물음 제목 · 단추 하나
  await expect(root).toHaveAttribute("data-scene", "cover");
  await expect(page.getByTestId("cover-news")).toContainText("열두 번째도 그대로");
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(ep.scenes.cover.title));
  await expect(page.getByTestId("ask")).toHaveText(ep.scenes.cover.ask_new);
  await expect(page.locator(".ep-count")).toHaveText("1/6");
  await page.getByTestId("ask").click();

  // 오늘의 사건 (지금까지의 이야기 없이 곧바로)
  await expect(root).toHaveAttribute("data-scene", "event");
  await expect(page.locator(".ep-scene")).toContainText("1,800원대");
  await page.getByTestId("ask").click();

  // 도구 — 둘 · 처음 들어요
  await expect(root).toHaveAttribute("data-scene", "tools");
  await expect(page.locator(".ep-tool")).toHaveCount(2);
  const fresh = page.locator(".ep-tool-ask button[data-primary]");
  while (await fresh.count()) await fresh.first().click();
  await page.getByTestId("ask").click();

  // 풀이 — 누르기 전에는 답이 어디에도 없다 (법 5)
  await expect(root).toHaveAttribute("data-scene", "aha");
  const body = page.locator(".ep-scene");
  await expect(body).not.toContainText(STILL);
  await expect(body).not.toContainText("공급가격을 기준으로");
  await expect(page.getByTestId("lab-gate")).toBeVisible();
  await expect(page.getByTestId("burst")).toHaveCount(0);
  // 가린 고리는 다른 고리와 같은 모양 (idle) — 꼬리표 · 점선이 없다
  await expect(page.locator('.fr-chain li[data-node="station"]')).toHaveAttribute("data-state", "idle");

  // 누른 뒤 — 문서의 문장이 먼저 터진다 · 상자는 없다
  await page.getByTestId("lab-act").click();
  await expect(page.getByTestId("burst")).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("burst")).toContainText(STILL);
  await expect(page.locator('.fr-chain li[data-node="station"]')).toHaveAttribute("data-state", "still");
  await expect(page.locator(".ep-flip")).toHaveCount(0);
  await page.getByTestId("ask").click();

  // 이어짐 → 남음
  await expect(root).toHaveAttribute("data-scene", "next");
  await expect(page.locator(".ep-coming")).toBeVisible();
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "keep");
  expect(plain(await page.locator(".ep-oneline p").innerText())).toBe(plain(ep.scenes.keep.line));
  await expect(page.locator(".ep-count")).toHaveText("6/6");
  expect(errors).toEqual([]);
});

test("실제 /s/oil/1 은 그대로 — 지금까지의 이야기 장면 · 뉴스 한 줄 없음 · 멈춘 고리 꼬리표가 처음부터 보인다 · 다시 짠 판으로 가는 길 없음", async ({ page }) => {
  const res = await page.goto("/s/oil/1");
  expect(res?.status()).toBe(200);
  const root = page.locator(".ep-root");
  await expect(page.getByTestId("cover-news")).toHaveCount(0);
  await expect(page.getByTestId("orb-bar")).toHaveCount(0);
  await expect(page.locator("a[href*='oil-replot']")).toHaveCount(0);
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "zero");
  await page.getByTestId("ask").click(); // event
  await page.getByTestId("ask").click(); // tools
  const fresh = page.locator(".ep-tool-ask button[data-primary]");
  while (await fresh.count()) await fresh.first().click();
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "aha");
  await expect(page.locator('.fr-chain li[data-node="station"]')).toHaveAttribute("data-state", "still");
  await expect(page.getByTestId("burst")).toHaveCount(0);
});
