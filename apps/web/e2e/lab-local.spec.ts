import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// L-1 — 미리 보기 주소 (/lab/local/<사건>/<code>): 로컬 세션이 쓴 판 (사건 폴더의 local/<code>/)을 실제 화면과 같은 부품으로 그린다. 도윤이 올리기 전에 폰으로 읽는 곳.
// **글은 파일에서 읽어 댄다** — 글을 손질해도 이 시험은 선다. 여기서는 미리 보기가 서는지 · 실제처럼 그리는지 · 실제 화면에 새지 않는지만 본다 (장면을 끝까지 누르는 것은 scripts/shots-story.ts).
const EVENTS = path.join(import.meta.dirname, "../../../packages/pipeline/data/events");
const OIL = "MOTIR-20261113-OIL-PRICE-CAP";
const META = "GPDP-20261114-META-GALLERY";
const json = (...p: string[]) => JSON.parse(readFileSync(path.join(EVENTS, ...p), "utf8"));
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

test.use({ viewport: { width: 390, height: 844 } });

test("긴 이야기 미리 보기 — local/oil-1 이 실제 화면의 부품으로 선다 (띠 · 뉴스 한 줄 · 제목 · 약속 없음) · 콘솔 오류 0", async ({ page }) => {
  const ep = json(OIL, "local/oil-1/episode.json") as { scenes: { cover: { title: string; ask_new: string } } };
  const screen = json(OIL, "local/oil-1/screen.json") as { news: { t: string } };
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico")) errors.push(`${m.text()} (${m.location().url})`);
  });
  const res = await page.goto(`/lab/local/${OIL}/oil-1`);
  expect(res?.status()).toBe(200);
  // 맨 위 띠 — 미리 보기임을 밝히고, 이미 나간 이야기면 실제 주소로 가는 길 하나
  await expect(page.getByTestId("lp-bar")).toContainText("미리 보기");
  await expect(page.getByTestId("lp-real")).toHaveAttribute("href", "/s/oil/1");
  await expect(page.getByTestId("lp-broken")).toHaveCount(0);
  // 실제 화면처럼 — real (시안 띠 · 독자 스위치 없음) · 뉴스 한 줄 · 제목 · 단추가 파일 그대로
  const root = page.locator(".ep-root");
  await expect(root).toHaveAttribute("data-real", "");
  await expect(root).toHaveAttribute("data-scene", "cover");
  await expect(page.locator(".ep-demo")).toHaveCount(0);
  await expect(page.getByTestId("cover-news")).toHaveText(plain(screen.news.t));
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(ep.scenes.cover.title));
  await expect(page.getByTestId("ask")).toHaveText(ep.scenes.cover.ask_new);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("짧은 이야기 미리 보기 — local 에 없으면 파이프라인이 낸 옛 꼴 (shorts/<code>)을 읽는다 · 새 꼴 시험판 · 없는 이야기는 404", async ({ page, request }) => {
  const story = json(META, "shorts/meta-gallery/story.json") as { scenes: { cover: { title: string; ask: string } } };
  const res = await page.goto(`/lab/local/${META}/meta-gallery`);
  expect(res?.status()).toBe(200);
  await expect(page.getByTestId("short")).toHaveAttribute("data-scene", "cover");
  await expect(page.getByTestId("lp-real")).toHaveAttribute("href", "/short/meta-gallery");
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(story.scenes.cover.title));
  await expect(page.getByTestId("ask")).toHaveText(story.scenes.cover.ask);
  // 한 흐름 꼴 (FlowStory — 보류 D104)은 이 화면이 그리지 않는다 · 없는 사건 · 없는 code
  expect((await request.get("/lab/local/ACRC-20261028-LICENSE-NOTICE/license-notice-flow-fable")).status()).toBe(404);
  expect((await request.get(`/lab/local/${OIL}/nope`)).status()).toBe(404);
  expect((await request.get("/lab/local/NOPE/oil-1")).status()).toBe(404);
});

test("미리 보기는 실제 화면에 새지 않는다 — 첫 화면 · 실제 이야기 화면에 미리 보기 주소 · 띠가 없다", async ({ page }) => {
  for (const url of ["/", "/days", "/s/oil/1", "/short/meta-gallery", "/map"]) {
    await page.goto(url);
    expect(await page.content(), url).not.toContain("/lab/local");
    await expect(page.getByTestId("lp-bar"), url).toHaveCount(0);
  }
});
