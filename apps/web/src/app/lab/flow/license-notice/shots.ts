// UX-8c 스크린샷 — 아이폰 크기 (390×844 · 2배). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/flow/license-notice/shots.ts http://localhost:3210 [나갈 폴더] [이름 앞머리]
// 찍는 것: 표지 → 이야기 (화면 높이의 4/5 씩 끝까지 내려가며) → 낱말 카드 펼침 · 누구의 말 → 견줘 읽기 → 근거 시트.
// 글을 고르는 데 글자를 쓰지 않는다 — story.json 이 손질돼도 같은 길로 찍힌다.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../../logs/frontend/UX-8c"));
const PRE = process.argv[4] ?? "";
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
// 사이트에 favicon 이 없어 브라우저가 스스로 부르는 /favicon.ico 의 404 는 뺀다 (페이지의 오류가 아니다 — 모든 주소가 같다 · logs/frontend/UX-8c.md _open)
const favicon = (url: string) => new URL(url, BASE).pathname === "/favicon.ico";
page.on("console", (m) => {
  if (m.type() === "error" && !favicon(m.location().url || BASE)) errors.push(`${m.text()} (${m.location().url})`);
});

const res = await page.goto(`${BASE}/lab/flow/license-notice`);
console.log(`/lab/flow/license-notice ${res?.status()}`);
await settle(page, 1800);
await shot(page, "1-cover");
await page.getByTestId("ask").click();
await settle(page, 2400);
// 고르기가 있으면 첫째를 고른다 (지금 한 편에는 없다)
const pick = page.locator("[data-testid^=pick-]");
if (await pick.count()) {
  await pick.first().click();
  await settle(page, 2200);
}
// 이야기 — 화면 높이의 4/5 씩 (위아래가 조금 겹치게) 끝까지
let n = 0;
for (;;) {
  n += 1;
  await shot(page, `2-story-${n}`);
  const more = await page.locator(".ep-scroll").evaluate((el) => {
    const before = el.scrollTop;
    el.scrollTo(0, before + Math.round(el.clientHeight * 0.8));
    return el.scrollTop > before + 1;
  });
  if (!more || n >= 12) break;
  await settle(page, 700);
}
// 낱말 카드 펼침 · 누구의 말
await bring(page, ".lt-words-label", 40);
await page.locator("[data-testid^=word-]").first().getByRole("button").click();
await settle(page, 500);
await shot(page, "3-words-whose");
await bring(page, "[data-testid=compare]", 200);
await shot(page, "4-compare");
// 근거 — 깨는 사실 (흐름에서 근거가 붙은 첫 글)
await page.getByTestId("src-toggle").click();
await settle(page, 300);
await bring(page, ".lt-flow .ep-src-hit", 330);
await page.locator(".lt-flow .ep-src-hit").first().click();
await settle(page, 700);
await shot(page, "5-source-sheet");

await browser.close();
if (errors.length) {
  console.log(`페이지 오류 ${errors.length}\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`OK — ${OUT} · 이야기 ${n} 장`);
