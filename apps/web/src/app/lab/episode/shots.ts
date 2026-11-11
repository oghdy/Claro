// 회차 시안 스크린샷 — 아이폰 크기(390×844). 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/shots.ts http://localhost:3200 <나갈 폴더> [walk|extras|all]
//
// UX-4: 풀이를 틀 부품(kit/frames)으로 옮기기 **전과 후**를 같은 차례 · 같은 이름으로 찍어 픽셀로 견준다 (diff.mjs).
//   walk    두 회차 × 두 독자 — 장면마다 위에서부터 + 풀이의 누르는 단계마다 (전 · 후 둘 다 이것을 찍는다)
//   extras  UX-4 에서 새로 생긴 것 — 체험 없이 보기 (기본 풀이) · 이 그림을 본 독자 (다시 쓰기) · 조용히 견본
// 견줄 때는 시안 조종 칸의 둘째 줄(.ep-demo-lab — UX-4 에서 생겼다 · 풀이 장면에서만 보인다)을 숨기고 찍는다:
// 그 줄만큼 화면이 밀리는 것은 틀로 옮긴 것과 상관없는 차이라서다. extras 는 숨기지 않는다 (도윤이 보는 그대로).
// UX-2 까지의 차례 (지도 · 근거 시트 · 건너가기)는 git 기록의 이 파일에 있다 (fd95c53).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3200";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-4"));
const MODE = process.argv[4] ?? "all";
mkdirSync(OUT, { recursive: true });

const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms);
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

/** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
async function scene(page: Page, name: string) {
  const scroller = page.locator(".ep-scroll");
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  const { h, view } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight }));
  const n = Math.max(1, Math.ceil((h - 24) / (view - 60)));
  for (let i = 0; i < n; i++) {
    await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 60));
    await page.waitForTimeout(250);
    await shot(page, `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}`);
  }
}
const ask = async (page: Page) => {
  await page.getByTestId("ask").click();
  await settle(page);
};
const sceneId = (page: Page) => page.locator(".ep-root").getAttribute("data-scene");
/** 풀이 부품을 화면 위쪽으로 */
const toLab = async (page: Page) => {
  await page.locator(".ep-scroll").evaluate((el) => {
    const lab = el.querySelector<HTMLElement>("[data-testid=lab]")!;
    el.scrollTo(0, lab.offsetTop - 70);
  });
  await page.waitForTimeout(300);
};
const hideLabRow = (page: Page) => page.addStyleTag({ content: ".ep-demo-lab{display:none !important}" });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

const EPISODES = [
  { id: "delivery", url: `${BASE}/lab/episode` },
  { id: "fomc", url: `${BASE}/lab/episode/fomc` },
] as const;

/** 풀이의 누르는 단계 — 회차마다 */
async function labSteps(page: Page, id: string, name: string) {
  await toLab(page);
  if (id === "delivery") {
    await shot(page, `${name}-lab-1-off-before`);
    await page.getByTestId("lab-act").click();
    await settle(page, 1400);
    await shot(page, `${name}-lab-2-off-lowered`);
    await page.getByTestId("lab-go-on").click();
    await settle(page, 900);
    await shot(page, `${name}-lab-3-on-before`);
    await page.getByTestId("lab-act").click();
    await settle(page, 1300);
    await shot(page, `${name}-lab-4-on-blocked`);
    return;
  }
  await shot(page, `${name}-lab-1-sep-before`);
  await page.getByTestId("lab-act").click();
  await settle(page, 1900);
  await shot(page, `${name}-lab-2-sep-pressed`);
  await page.getByTestId("lab-go-on").click();
  await settle(page, 900);
  await toLab(page);
  await shot(page, `${name}-lab-3-oct-before`);
  await page.getByTestId("lab-wait").click();
  await settle(page, 1200);
  await shot(page, `${name}-lab-4-oct-wait`);
  await page.getByTestId("lab-other").click();
  await settle(page, 1200);
  await shot(page, `${name}-lab-5-oct-raise`);
}

async function toAha(page: Page, url: string, reader: "new" | "follower") {
  await page.goto(url);
  await settle(page, 2200);
  if (reader === "follower") {
    await page.getByTestId("reader-follower").click();
    await settle(page);
  }
  while ((await sceneId(page)) !== "aha") await ask(page);
}

// ═══════════════════════════════════════════ walk — 전 · 후가 같은 차례
if (MODE === "walk" || MODE === "all") {
  for (const e of EPISODES) {
    for (const reader of ["new", "follower"] as const) {
      await page.goto(e.url);
      await settle(page, 2200);
      await hideLabRow(page);
      if (reader === "follower") {
        await page.getByTestId("reader-follower").click();
        await settle(page);
      }
      for (let i = 1; ; i++) {
        const id = (await sceneId(page))!;
        const name = `${e.id}-${reader}-${String(i).padStart(2, "0")}-${id}`;
        if (id === "keep") await settle(page, 1400);
        await scene(page, name);
        if (id === "aha" && reader === "new") await labSteps(page, e.id, name);
        if (id === "keep") break;
        await ask(page);
      }
    }
  }
}

// ═══════════════════════════════════════════ extras — UX-4 에서 새로 생긴 것
if (MODE === "extras" || MODE === "all") {
  for (const e of EPISODES) {
    // 체험 없이 보기 — 기본 풀이
    await toAha(page, e.url, "new");
    await page.getByTestId("lab-plain").click();
    await settle(page, 900);
    await scene(page, `${e.id}-plain`);
    if (e.id === "fomc") {
      // 세 칸 — 차례로 연다
      await page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, (el.querySelector<HTMLElement>("[data-testid=plain-three]")?.offsetTop ?? 0) - 70));
      await page.getByTestId("plain-open").click();
      await settle(page, 700);
      await shot(page, `${e.id}-plain-open-2`);
      await page.getByTestId("plain-open").click();
      await settle(page, 700);
      await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, 260));
      await page.waitForTimeout(300);
      await shot(page, `${e.id}-plain-open-3`);
      await scene(page, `${e.id}-plain-opened`);
    }
    // 이 그림을 본 독자 — 다시 쓰기
    await toAha(page, e.url, "new");
    await page.getByTestId("lab-seen").click();
    await settle(page, 900);
    await scene(page, `${e.id}-seen`);
    if (e.id === "fomc") {
      await toLab(page);
      await page.getByTestId("seen-side-raise").click();
      await settle(page, 600);
      await shot(page, `${e.id}-seen-lab-raise`);
    }
    // 다시 해 보기 — 그림을 본 독자도 처음처럼 눌러 볼 수 있다
    await toLab(page);
    await page.getByTestId("seen-redo").click();
    await settle(page, 700);
    await toLab(page);
    await shot(page, `${e.id}-seen-redo`);
  }
  // 조용히 — 견본 (실제 사건 아님)
  await page.goto(`${BASE}/lab/episode/quiet`);
  await settle(page, 2000);
  await scene(page, "quiet-sample");
}

await browser.close();
console.log(`→ ${OUT}`);
console.log(errors.length ? `콘솔 오류 ${errors.length}:\n${errors.join("\n")}` : "콘솔 오류 0");
