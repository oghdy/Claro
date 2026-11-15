import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// UX-8c — 짧은 이야기 새 꼴 (계약 FlowStory)의 첫 한 편을 폰으로 읽는 시안 (/lab/flow/license-notice). 화면은 lab/short/Light.tsx 그대로.
// **글은 story.json 에서 읽어 댄다** — 편집자가 story.json 을 손질해도 이 시험은 그대로 선다 (글을 여기에 옮겨 적지 않는다).
// 실제 주소 (/ · /s/* · /short/* · /map)는 이 Step 이 건드리지 않았다 — 그쪽은 today.spec.ts · episode.spec.ts 가 그대로 본다.
const STORY = path.join(import.meta.dirname, "../../../packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice-flow/story.json");
type Text = { t: string };
type Block = { kind: "p"; text: Text } | { kind: "cite"; label: string; text: Text } | { kind: "flip"; label: string; a: Text; b: Text; note: Text } | { kind: "pick"; options: { key: string }[] };
const story = JSON.parse(readFileSync(STORY, "utf8")) as { cover: { title: Text; ask: Text }; flow: Block[]; keep: { line: Text; words: unknown[]; whose: Text } };
/** 화면의 글과 파일의 글을 대는 꼴 — 굵게 표시 (**) · 줄바꿈 · 빈칸만 무시 */
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

test.use({ viewport: { width: 390, height: 844 } });

test("새 꼴 짧은 이야기 — story.json 그대로: 제목 → 한 흐름 · 뒤집기 하나 · 남는 한 줄 · 견줘 읽기 (옛 꼴) · 콘솔 오류 0", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // 사이트에 favicon 이 없어 브라우저가 스스로 부르는 /favicon.ico 의 404 하나는 뺀다 — 페이지의 오류가 아니고 모든 주소가 같다 (logs/frontend/UX-8c.md _open). 그 밖의 콘솔 오류는 다 잡는다
  page.on("console", (m) => {
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico")) errors.push(`${m.text()} (${m.location().url})`);
  });
  const res = await page.goto("/lab/flow/license-notice");
  expect(res?.status()).toBe(200);
  const root = page.getByTestId("light");
  await expect(root).toHaveAttribute("data-scene", "cover");

  // 제목 — story.json 의 표지 제목 그대로 · 카테고리 꼬리표
  expect(plain(await page.locator(".ep-title-cover").innerText())).toBe(plain(story.cover.title.t));
  await expect(page.locator(".ep-bar-title")).toContainText("나라와 법");

  // 표지의 물음 하나 → 이야기 (물음이 흐름 맨 위에 다시 보인다)
  await expect(page.getByTestId("ask")).toHaveCount(1);
  await expect(page.getByTestId("ask")).toHaveText(story.cover.ask.t);
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "story");
  await expect(page.locator(".lt-lead")).toContainText(story.cover.ask.t);

  // 고르기가 있으면 하나 고른다 (지금 한 편에는 없다 — 그러면 흐름이 끝까지 바로 보인다)
  const pick = story.flow.find((b) => b.kind === "pick");
  if (pick && pick.kind === "pick") await page.getByTestId(`pick-${pick.options[0]!.key}`).click();
  await expect(page.getByTestId("rest")).toBeVisible();

  // 흐름의 글이 파일의 차례 그대로 다 보인다
  const flowText = plain(await page.locator(".lt-flow").innerText());
  let from = 0;
  for (const [i, b] of story.flow.entries()) {
    const parts = b.kind === "p" ? [b.text.t] : b.kind === "cite" ? [b.label, b.text.t] : b.kind === "flip" ? [b.label, b.a.t, b.b.t, b.note.t] : [];
    for (const t of parts) {
      const at = flowText.indexOf(plain(t), from);
      expect(at, `흐름 ${i} (${b.kind}) 의 글이 차례대로 보인다 — "${t.slice(0, 30)}…"`).toBeGreaterThanOrEqual(0);
      from = at + plain(t).length;
    }
  }

  // 뒤집기 — 정확히 하나 · 두 말이 파일 그대로
  const flip = story.flow.find((b) => b.kind === "flip");
  if (!flip || flip.kind !== "flip") throw new Error("story.json 에 뒤집기가 없다");
  await expect(page.getByTestId("flip")).toHaveCount(1);
  await page.getByTestId("flip").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("flip")).toBeVisible();
  expect(plain(await page.locator(".ep-flip-a").innerText())).toBe(plain(flip.a.t));
  expect(plain(await page.locator(".ep-flip-b").innerText())).toBe(plain(flip.b.t));

  // 남는 한 줄 · 낱말 · 누구의 말
  expect(plain(await page.getByTestId("oneline").locator("p").innerText())).toBe(plain(story.keep.line.t));
  await expect(page.locator("[data-testid^=word-]")).toHaveCount(story.keep.words.length);
  expect(plain(await page.locator(".ep-caveat").innerText())).toBe(plain(story.keep.whose.t));

  // 근거 — 켜면 근거 있는 글을 눌러 저장된 문서의 구절을 본다
  await page.getByTestId("src-toggle").click();
  await page.locator(".lt-flow .ep-src-hit").first().click();
  await expect(page.locator(".ep-sheet blockquote").first()).toBeVisible();
  await expect(page.locator(".ep-sheet cite").first()).toContainText("국민권익위원회");
  await page.locator(".ep-sheet header button").click();

  // 견줘 읽기 — 같은 원문으로 앞서 낸 옛 꼴 하나 (실제 주소)
  const links = page.getByTestId("compare").locator("a");
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute("href", "/short/license-notice");
  await expect(links.first()).toContainText("같은 원문 · 앞서 낸 글");
  expect((await page.request.get("/short/license-notice")).status(), "견줘 읽기 링크가 열린다").toBe(200);

  // 페이지에 모델 이름 · 만든 길 · 비용 같은 말이 없다 (보이는 글 · 페이지에 실린 데이터 둘 다)
  const made = /파이프라인|pipeline|Sonnet|소넷|Fable|Opus|Claude|클로드|claude-/i;
  expect(await page.locator("body").innerText()).not.toMatch(made);
  expect(await page.locator("body").innerText()).not.toMatch(/비용|달러|\$\s?\d/);
  expect(await page.content(), "페이지에 실린 데이터 (HTML · RSC)").not.toMatch(made);

  expect(errors).toEqual([]);
});
