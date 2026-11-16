import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// UX-10 — 기름값 1화를 「이야기 짜는 법」 (docs/content/story-guide.md)으로 다시 짠 시안 (/lab/episode/oil-replot). 실제 /s/oil/1 과 같은 뼈대 · 같은 그림 — 차례만 다르다.
// **글은 회차 파일에서 읽어 댄다** (다시 짠 판 = 이 폴더의 episode.json · 지금 판 = 파이프라인의 oil-1/episode.json). 글을 여기에 옮겨 적지 않는다.
// 보는 것: ① 다시 짠 판의 차례 (0화 없음 · 뉴스 한 줄 · 답은 누른 뒤에만 · 문서의 문장이 터진다 · "뒤집어 보면" 상자 없음) ② 실제 /s/oil/1 은 그대로다 (시안 전용 칸이 꺼져 있다)
const repo = (p: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../..", p), "utf8"));
type T = { t: string };
type Ep = {
  assembly: { new: string[] };
  scenes: { cover: { title: string; ask_new: string }; event: { quote: T; ask: string }; tools: { ask: string }; aha: { ask_new: string }; next: { ask: string }; keep: { line: string } };
  solve: { entry: { flip: { label: string } }; lab: { frames: { nodes: { id: string; reach: string; still?: T }[] }[] } };
};
const NEW: Ep = repo("apps/web/src/app/lab/episode/oil-replot/episode.json");
const NOW: Ep = repo("packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/episodes/oil-1/episode.json");
/** 깨는 사실의 꼬리표 — 사슬의 멈춘 고리 (주유소)의 오늘 값. 두 판이 같다 */
const STILL = NEW.solve.lab.frames[0]!.nodes.find((n) => n.reach === "none")!.still!.t;
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

test.use({ viewport: { width: 390, height: 844 } });

const root = (page: Page) => page.locator(".ep-root");
const ask = async (page: Page, text: string, to: string) => {
  await expect(page.getByTestId("ask")).toHaveText(text);
  await page.getByTestId("ask").click();
  await expect(root(page)).toHaveAttribute("data-scene", to);
};
const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico")) errors.push(`${m.text()} (${m.location().url})`);
  });
  return errors;
};

test("다시 짠 판 — 오늘의 일부터 · 답은 누른 뒤에만 · 문서의 문장이 터진다 · 콘솔 오류 0", async ({ page }) => {
  const errors = errorsOf(page);
  const res = await page.goto("/lab/episode/oil-replot");
  expect(res?.status()).toBe(200);
  await expect(root(page)).toHaveAttribute("data-scene", "cover");
  await expect(root(page)).toHaveAttribute("data-real", "");

  // 맨 위 — 견줘 읽기 (실제 주소) · 실제 화면처럼 (시안 조종 칸 없음 · 번호 없음)
  await expect(page.getByTestId("replot-compare")).toHaveAttribute("href", "/s/oil/1");
  await expect(page.locator(".ep-demo")).toHaveCount(0);
  await expect(page.getByTestId("cover-no")).not.toContainText("화");
  // 표지 — 제목 위에 그날의 뉴스 한 줄 (시안 전용 칸) · 제목은 회차 파일 그대로
  await expect(page.getByTestId("cover-news")).toBeVisible();
  const [newsY, titleY] = await Promise.all([page.getByTestId("cover-news").boundingBox(), page.locator(".ep-title-cover").boundingBox()]);
  expect(newsY!.y, "뉴스 한 줄이 제목 위에 있다").toBeLessThan(titleY!.y);
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(NEW.scenes.cover.title));

  // 차례 — 표지 다음이 오늘의 사건이다 (지금까지의 이야기 없음). 장면 여섯
  expect(NEW.assembly.new).toEqual(["cover", "event", "tools", "aha", "next", "keep"]);
  await expect(page.locator(".ep-count")).toHaveText("1/6");
  await ask(page, NEW.scenes.cover.ask_new, "event");
  // 오늘의 사건 — 큰 인용은 답이 아니다
  await expect(page.locator(".ep-demand blockquote")).toHaveText(NEW.scenes.event.quote.t);
  await expect(page.locator(".ep-scene")).not.toContainText(STILL);
  await ask(page, NEW.scenes.event.ask, "tools");
  await expect(page.locator(".ep-scene")).not.toContainText(STILL);
  await ask(page, NEW.scenes.tools.ask, "aha");

  // 풀이 — 누르기 전: 멈출 고리가 다른 고리와 같게 보인다 · 답의 글자가 어디에도 없다
  const station = page.locator('.fr-chain li[data-node="station"]');
  await expect(station).toHaveAttribute("data-state", "idle");
  await expect(page.locator('.fr-link[data-kind="open"]')).toHaveCount(0);
  await expect(page.locator(".ep-scene")).not.toContainText(STILL);
  await expect(page.getByTestId("lab-gate")).toBeVisible();
  await expect(page.getByTestId("burst")).toHaveCount(0);
  // 누른 뒤: 고리가 멈추고 꼬리표가 나온다 → 문서의 문장 → "뒤집어 보면" 상자는 없다
  await page.getByTestId("lab-act").click();
  await expect(station).toHaveAttribute("data-state", "still");
  await expect(station.locator("em")).toHaveText(STILL);
  await expect(page.locator('.fr-link[data-kind="open"]')).toHaveCount(1);
  await expect(page.getByTestId("burst")).toBeVisible();
  await expect(page.getByTestId("burst")).toContainText(STILL);
  await expect(page.locator(".ep-flip")).toHaveCount(0);
  await expect(page.locator(".ep-scene")).not.toContainText(NEW.solve.entry.flip.label);
  // 문서의 문장이 풀이에서 생긴 도구보다 먼저 온다
  const [burstBox, bornBox] = await Promise.all([page.getByTestId("burst").boundingBox(), page.getByTestId("tool-scope").boundingBox()]);
  expect(burstBox!.y).toBeLessThan(bornBox!.y);

  await ask(page, NEW.scenes.aha.ask_new, "next");
  await ask(page, NEW.scenes.next.ask, "keep");
  expect(plain(await page.locator(".ep-oneline p").innerText())).toBe(plain(NEW.scenes.keep.line));
  // 실제 화면처럼 — 다음 화를 약속하지 않는다
  await expect(page.locator(".ep-nextup")).toHaveCount(0);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("실제 /s/oil/1 은 그대로다 — 시안 전용 칸 (뉴스 한 줄 · 고리 가리기 · 문서의 문장)이 꺼져 있다", async ({ page }) => {
  const errors = errorsOf(page);
  const res = await page.goto("/s/oil/1");
  expect(res?.status()).toBe(200);
  await expect(page.getByTestId("replot-banner")).toHaveCount(0);
  await expect(page.getByTestId("cover-news")).toHaveCount(0);
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(NOW.scenes.cover.title));
  // 차례 — 지금 판 그대로 (지금까지의 이야기가 둘째 장)
  expect(NOW.assembly.new).toEqual(["cover", "zero", "event", "tools", "aha", "next", "keep"]);
  await expect(page.locator(".ep-count")).toHaveText("1/7");
  await ask(page, NOW.scenes.cover.ask_new, "zero");
  await page.getByTestId("ask").click();
  await expect(root(page)).toHaveAttribute("data-scene", "event");
  await expect(page.locator(".ep-demand blockquote")).toHaveText(NOW.scenes.event.quote.t);
  await ask(page, NOW.scenes.event.ask, "tools");
  await ask(page, NOW.scenes.tools.ask, "aha");
  // 풀이 — 멈춘 고리는 처음부터 제 꼬리표와 점선으로 선다 (고치지 않았다) · 누른 뒤 "뒤집어 보면" 상자가 있고 문서의 문장 칸은 없다
  const station = page.locator('.fr-chain li[data-node="station"]');
  await expect(station).toHaveAttribute("data-state", "still");
  await expect(station.locator("em")).toHaveText(STILL);
  await expect(page.locator('.fr-link[data-kind="open"]')).toHaveCount(1);
  await page.getByTestId("lab-act").click();
  await expect(page.locator(".ep-flip")).toHaveCount(1);
  await expect(page.locator(".ep-flip figcaption")).toHaveText(NOW.solve.entry.flip.label);
  await expect(page.getByTestId("burst")).toHaveCount(0);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("다른 실제 주소 · 회차 시안에도 시안 전용 칸이 없다", async ({ page }) => {
  for (const p of ["/s/rate/2", "/s/price/1", "/s/privacy/1", "/lab/episode", "/lab/episode/fomc", "/lab/episode/pipc"]) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator(".ep-root"), p).toHaveAttribute("data-scene", "cover");
    await expect(page.getByTestId("cover-news"), p).toHaveCount(0);
    await expect(page.getByTestId("replot-banner"), p).toHaveCount(0);
  }
});
