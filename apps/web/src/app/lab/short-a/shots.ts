// UX-8b 스크린샷 — 아이폰 크기 (390×844 · 2배). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/short-a/shots.ts http://localhost:3217 [나갈 폴더] [이름 앞머리] [주소]
// 찍는 것: 표지 → 이야기 (첫 생각 · 고르기 전) → 고른 뒤 (받는 말 · 깨는 사실 · 문서의 문장 · 도구 · 뒤집기 · 내려앉기 · 남는 한 줄 · 낱말 · 누구의 말 · 맨 끝) → 근거 시트.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3217";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-8b-A"));
const PRE = process.argv[4] ?? "";
const URL_PATH = process.argv[5] ?? "/lab/short-a";
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}${name}.png`) });
const settle = (page: Page, ms = 1300) => page.waitForTimeout(ms);
/** 어떤 것을 화면 위쪽에서 gap 만큼 아래에 놓는다 */
const bring = async (page: Page, selector: string, gap = 70) => {
  await page.locator(".ep-scroll").evaluate(
    (el, [q, g]) => {
      const x = el.querySelector<HTMLElement>(q as string);
      if (x) el.scrollTo(0, x.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - (g as number));
    },
    [selector, gap] as const,
  );
  await page.waitForTimeout(400);
};

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));

const res = await page.goto(`${BASE}${URL_PATH}`);
console.log(`${URL_PATH} ${res?.status()}`);
await settle(page, 1800);
await shot(page, "1-cover");
await page.getByTestId("ask").click();
await settle(page, 2400);
await shot(page, "2-first-thought-pick-before");
await page.getByTestId("pick-then40").click();
await settle(page, 2200);
await shot(page, "3-pick-after-breaker");
await bring(page, ".lt-cite", 200);
await shot(page, "4-cite-tool");
await bring(page, "[data-testid=flip]", 330);
await shot(page, "5-flip");
await bring(page, "[data-testid=oneline]", 330);
await shot(page, "6-land-oneline");
await bring(page, ".lt-words-label", 40);
await page.getByTestId("word-rate").getByRole("button").click();
await settle(page, 500);
await shot(page, "7-words-whose");
await page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await settle(page, 500);
await shot(page, "8-end");
console.log(`견줘 읽기 칸이 보이나: ${await page.getByTestId("compare").isVisible()}`);
// 근거
await bring(page, ".lt-cite", 330);
await page.getByTestId("src-toggle").click();
await page.locator(".lt-flow .ep-src-hit", { hasText: "20대 남성이 원래 이랬던 건 아니에요." }).click();
await settle(page, 700);
await shot(page, "9-source-sheet");

await browser.close();
if (errors.length) {
  console.log(`페이지 오류 ${errors.length}\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`OK — ${OUT}`);
