// UX-9 스크린샷 — 아이폰 크기 (390×844 · 2배). 켜 둔 서버를 찍는다 (테스트가 아니다).
//   pnpm --filter @claro/web exec tsx src/app/lab/play/shots.ts http://localhost:3210 [나갈 폴더] [이름 앞머리]
// 찍는 것: 셋마다 고르기 전 · 고른 뒤 · 결과 (+ 사이의 장면) · 들머리. 배달앱은 값표를 **손가락으로 끄는** 길로 간다 (단추가 아니라).
// 움직임 기록: 셋마다 결과가 열리는 순간을 0.25초마다 여섯 장 (이름 끝 -m1 ~ -m6).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3210";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-9"));
const PRE = process.argv[4] ?? "";
mkdirSync(OUT, { recursive: true });

const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${PRE}${name}.png`) });
const settle = (page: Page, ms = 1200) => page.waitForTimeout(ms);
/** 어떤 것을 화면 위쪽에서 gap 만큼 아래에 놓는다 */
const bring = async (page: Page, selector: string, gap = 70) => {
  await page.locator(".ep-scroll").evaluate(
    (el, [q, g]) => {
      const x = el.querySelector<HTMLElement>(q as string);
      if (x) el.scrollTo(0, x.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - (g as number));
    },
    [selector, gap] as const,
  );
  await page.waitForTimeout(350);
};
/** 결과가 열리는 순간 — 0.25초마다 여섯 장 */
const motion = async (page: Page, name: string) => {
  for (let i = 1; i <= 6; i += 1) {
    await page.waitForTimeout(250);
    await shot(page, `${name}-m${i}`);
  }
};
/** 값표를 손가락으로 끌어 내린다 (dy 만큼) */
const dragTag = async (page: Page, dy: number) => {
  const box = (await page.getByTestId("price-tag").boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) await page.mouse.move(x, y + (dy * i) / 8, { steps: 2 });
  return () => page.mouse.up();
};

const browser = await chromium.launch({ channel: "chrome" });
// 끌기는 마우스로 한다 (touch 를 켜면 playwright 의 mouse 가 끌기를 못 만든다) — 화면 크기 · 배율은 폰 그대로
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
const open = async (p: string) => {
  const res = await page.goto(`${BASE}${p}`);
  console.log(`${p} ${res?.status()}`);
  await settle(page, 1800);
};

// ── 들머리
await open("/lab/play");
await shot(page, "0-index");

// ── 배달앱 — 내가 값을 정한다 → 요구가 그 값을 되돌린다
await open("/lab/play/price?at=play");
await shot(page, "price-1-scene");
await bring(page, "[data-testid=lab]", 70);
await shot(page, "price-2-before");
{
  const up = await dragTag(page, 30);
  await shot(page, "price-3-dragging");
  await up();
}
await settle(page, 700);
{
  const up = await dragTag(page, 30);
  await up();
}
await settle(page, 700);
await shot(page, "price-4-picked");
await page.getByTestId("price-commit").click();
await settle(page, 1800);
await shot(page, "price-5-sold");
await page.getByTestId("lab-go-on").click();
await motion(page, "price-6-demand");
await settle(page, 800);
await shot(page, "price-6-tied");
{
  const up = await dragTag(page, 34);
  await shot(page, "price-7-dragging-both");
  await up();
}
await motion(page, "price-8-blocked");
await settle(page, 900);
await shot(page, "price-8-blocked");
await bring(page, "[data-testid=lab-caption]", 420);
await shot(page, "price-9-answer-open");

// ── 금리 — 먼저 표를 던진다 → 실제 표가 열린다
await open("/lab/play/rate?at=play");
await bring(page, "[data-testid=lab]", 70);
await shot(page, "rate-1-brake-before");
await page.getByTestId("lab-act").click();
await settle(page, 3200);
await shot(page, "rate-2-brake-after");
await page.getByTestId("rate-go-on").click();
await settle(page, 1500);
await shot(page, "rate-3-ballot-before");
await page.getByTestId("rate-vote-wait").click();
await settle(page, 600);
await page.getByTestId("rate-why-0").click();
await settle(page, 500);
await bring(page, "[data-testid=rate-slip]", 220);
await shot(page, "rate-4-ballot-picked");
await page.getByTestId("rate-cast").click();
await bring(page, "[data-testid=rate-ballot]", 60);
await motion(page, "rate-5-open");
await settle(page, 1800);
await shot(page, "rate-5-result-wait");
await bring(page, "[data-testid=rate-mine]", 120);
await shot(page, "rate-6-result-wait-mine");
// 다른 표 — 내린다 (아무도 앉지 않은 쪽)
await page.getByTestId("rate-again").click();
await settle(page, 600);
await page.getByTestId("rate-vote-cut").click();
await page.getByTestId("rate-why-0").click();
await page.getByTestId("rate-cast").click();
await settle(page, 3200);
await bring(page, "[data-testid=rate-ballot]", 60);
await shot(page, "rate-7-result-cut");
await bring(page, "[data-testid=rate-mine]", 120);
await shot(page, "rate-8-result-cut-mine");
// 다른 표 — 올린다 (까닭이 아직 문서에 없는 쪽)
await page.getByTestId("rate-again").click();
await settle(page, 600);
await page.getByTestId("rate-vote-raise").click();
await page.getByTestId("rate-why-0").click();
await page.getByTestId("rate-cast").click();
await settle(page, 3200);
await bring(page, "[data-testid=rate-mine]", 120);
await shot(page, "rate-9-result-raise-mine");

// ── 개인정보 — 먼저 핀을 꽂는다 → 위원회의 ★ 과 견준다
await open("/lab/play/privacy?at=play");
await shot(page, "privacy-1-scene");
await bring(page, "[data-testid=lab]", 70);
await shot(page, "privacy-2-before");
await page.getByTestId("pin-first").click();
await settle(page, 700);
await shot(page, "privacy-3-pinned");
await page.getByTestId("pin-go").click();
await settle(page, 700);
for (let i = 0; i < 3; i += 1) {
  await page.getByTestId("lab-act").click();
  await settle(page, 800);
}
await shot(page, "privacy-4-turning-ask");
await page.getByTestId("lab-act").click();
await motion(page, "privacy-5-star");
await settle(page, 600);
await shot(page, "privacy-5-star");
await page.getByTestId("lab-act").click();
await settle(page, 800);
await page.getByTestId("lab-act").click();
await settle(page, 2200);
await bring(page, "[data-testid=lab]", 70);
await shot(page, "privacy-6-all-turned");
await bring(page, "[data-testid=pin-compare]", 160);
await shot(page, "privacy-7-compare");
// 다시 — ★ 과 같은 칸에 꽂는다
await page.getByTestId("pin-again").click();
await settle(page, 500);
await page.getByTestId("pin-neglect").click();
await page.getByTestId("pin-go").click();
for (let i = 0; i < 6; i += 1) {
  await page.getByTestId("lab-act").click();
  await settle(page, 700);
}
await settle(page, 1800);
await bring(page, "[data-testid=pin-compare]", 300);
await shot(page, "privacy-8-compare-same");

await browser.close();
if (errors.length) {
  console.log("페이지 오류:", errors);
  process.exit(1);
}
console.log(`OK — ${OUT}`);
