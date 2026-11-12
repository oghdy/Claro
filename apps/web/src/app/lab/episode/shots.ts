// 회차 시안 스크린샷 — 아이폰 크기(390×844). 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/shots.ts http://localhost:3200 <나갈 폴더> [walk|extras|maps|labclip|all] [회차 id — 그 회차만]
//
// UX-4: 풀이를 틀 부품(kit/frames)으로 옮기기 **전과 후**를 같은 차례 · 같은 이름으로 찍어 픽셀로 견준다 (diff.mjs).
//   walk    두 회차 × 두 독자 — 장면마다 위에서부터 + 풀이의 누르는 단계마다 (전 · 후 둘 다 이것을 찍는다)
//   extras  UX-4 에서 새로 생긴 것 — 체험 없이 보기 (기본 풀이) · 이 그림을 본 독자 (다시 쓰기) · 조용히 견본
// 견줄 때는 시안 조종 칸의 둘째 줄(.ep-demo-lab — UX-4 에서 생겼다 · 풀이 장면에서만 보인다)을 숨기고 찍는다:
// 그 줄만큼 화면이 밀리는 것은 틀로 옮긴 것과 상관없는 차이라서다. extras 는 숨기지 않는다 (도윤이 보는 그대로).
// UX-5: 셋째 회차(pipc — 넘겨 보기)가 들어왔다. maps = 따라온 독자의 개념 지도 (세 시리즈가 한 지도에) · labclip = 풀이 그림만 오려서 (전 · 후 견주기).
// UX-6: 풀이 장면의 아래 (답)가 체험을 마치기 전에는 접혀 있다 (lab-gate) — 처음 온 독자는 풀이의 누르는 단계 (labSteps)를 끝내면 열리고, 그 밖의 걸음은 "그냥 열어 보기"로 연다 (throughGate).
//   carry  지난 값 견본 (/lab/episode/carry — 실제 아님) · gate  답 감추기 전 · 후 (세 회차) · rate3  3화 주소 (파일이 없으면 기다리는 한 장)
// UX-2 까지의 차례 (지도 · 근거 시트 · 건너가기)는 git 기록의 이 파일에 있다 (fd95c53).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3200";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../../../../logs/frontend/UX-4"));
const MODE = process.argv[4] ?? "all";
const ONLY = process.argv[5];
mkdirSync(OUT, { recursive: true });

// SHOTS_SLOW=2 — 기다림을 두 배로 (전 · 후를 픽셀로 견줄 때 움직임이 덜 끝난 채 찍히는 것을 덜려고 — UX-6)
const SLOW = Number(process.env.SHOTS_SLOW ?? 1);
const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms * SLOW);
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
/** 풀이 장면의 아래가 접혀 있으면 (UX-6 lab-gate) "그냥 열어 보기"로 연다. 열었으면 true */
const throughGate = async (page: Page) => {
  if ((await page.getByTestId("lab-gate").count()) === 0) return false;
  await page.getByTestId("lab-gate-open").click();
  await settle(page, 900);
  return true;
};
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

const EPISODES = (
  [
    { id: "delivery", url: `${BASE}/lab/episode` },
    { id: "fomc", url: `${BASE}/lab/episode/fomc` },
    { id: "pipc", url: `${BASE}/lab/episode/pipc` },
  ] as const
).filter((e) => !ONLY || e.id === ONLY);

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
  if (id === "pipc") {
    // 넘겨 보기 — 칸마다. 넘길 때마다 부품이 다음 카드를 화면 안으로 민다
    await shot(page, `${name}-lab-0-before`);
    for (let i = 1; (await page.getByTestId("lab-act").count()) > 0; i++) {
      await page.getByTestId("lab-act").click();
      await settle(page, 1300);
      await shot(page, `${name}-lab-${i}-turned`);
    }
    // 다 넘긴 뒤 — 차례 전체와 끝의 글
    await page.locator(".ep-scroll").evaluate((el) => el.scrollTo(0, el.querySelector<HTMLElement>("[data-testid=lab]")!.offsetTop - 70));
    await page.waitForTimeout(400);
    await shot(page, `${name}-lab-7-all`);
    // 접힌 칸을 다시 펼친다 (★)
    await page.getByTestId("pg-row-neglect").click();
    await settle(page, 500);
    await shot(page, `${name}-lab-8-star-reopened`);
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
        // 체험을 마치면 열린다 (처음 온 독자) · 따라온 독자는 "그냥 열어 보기" — 열린 뒤의 장면도 찍는다 (UX-6)
        if (id === "aha" && ((await throughGate(page)) || reader === "new")) await scene(page, `${name}-open`);
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
    if (e.id === "pipc") {
      await toLab(page);
      await page.getByTestId("pg-row-neglect").click();
      await settle(page, 500);
      await shot(page, `${e.id}-seen-lab-star`);
    }
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
  if (!ONLY) await page.goto(`${BASE}/lab/episode/quiet`);
  await settle(page, 2000);
  if (!ONLY) await scene(page, "quiet-sample");
}

// ═══════════════════════════════════════════ maps — 따라온 독자의 개념 지도 (다른 시리즈가 같이 보인다) · 근거 시트 하나
if (MODE === "maps" || MODE === "all") {
  for (const e of EPISODES) {
    await page.goto(e.url);
    await settle(page, 2200);
    await page.getByTestId("reader-follower").click();
    await settle(page);
    while ((await sceneId(page)) !== "keep") {
      await throughGate(page);
      await ask(page);
    }
    await settle(page, 1800);
    await page.getByTestId("open-map").click();
    await settle(page, 900);
    await shot(page, `${e.id}-map-follower`);
    await page.getByTestId("map-view").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);
    await shot(page, `${e.id}-map-follower-b`);
    if (e.id === "pipc") {
      // 근거 — ★ 칸의 구절
      await toAha(page, e.url, "new");
      for (let i = 0; i < 4; i++) {
        await page.getByTestId("lab-act").click();
        await settle(page, 900);
      }
      await page.getByTestId("src-toggle").click();
      await settle(page, 400);
      await shot(page, `${e.id}-src-on`);
      await page.locator("[data-card=neglect] .fr-pg-body .ep-src-hit").click();
      await settle(page, 600);
      await shot(page, `${e.id}-src-star`);
    }
  }
}

// ═══════════════════════════════════════════ carry — 지난 값 견본 (UX-6 · 실제 아님 — 금리 2화 + 시안 전용 지난 값). 풀이 장면 · 이 그림을 본 독자로 열린다
if (MODE === "carry") {
  await page.goto(`${BASE}/lab/episode/carry`);
  await settle(page, 2200);
  await scene(page, "carry-seen");
  await toLab(page);
  await shot(page, "carry-seen-lab");
  await page.getByTestId("seen-side-wait").click();
  await settle(page, 700);
  await shot(page, "carry-seen-wait");
  await page.getByTestId("seen-side-raise").click();
  await settle(page, 700);
  await shot(page, "carry-seen-raise");
  // 처음 보는 독자 (체험) — 지난 값은 밀거나 앉은 뒤에만
  await page.getByTestId("lab-seen").click();
  await settle(page, 1200);
  await toLab(page);
  await shot(page, "carry-lab-1-before");
  await page.getByTestId("lab-act").click();
  await settle(page, 3000);
  await shot(page, "carry-lab-2-pressed");
  await page.getByTestId("lab-go-on").click();
  await settle(page, 900);
  await toLab(page);
  await shot(page, "carry-lab-3-oct");
  await page.getByTestId("lab-wait").click();
  await settle(page, 1400);
  await shot(page, "carry-lab-4-wait");
  await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, 300));
  await page.waitForTimeout(300);
  await shot(page, "carry-lab-5-wait-b");
}

// ═══════════════════════════════════════════ gate — 답 감추기 (UX-6 · D74 f): 체험을 마치기 전 (접힘) → 마친 뒤 (열림). 세 회차 · 처음 온 독자
if (MODE === "gate") {
  const finish: Record<string, (p: Page) => Promise<void>> = {
    delivery: async (p) => {
      await p.getByTestId("lab-act").click();
      await settle(p, 1400);
      await p.getByTestId("lab-go-on").click();
      await settle(p, 900);
      await p.getByTestId("lab-act").click();
      await settle(p, 1400);
    },
    fomc: async (p) => {
      await p.getByTestId("lab-act").click();
      await settle(p, 1900);
      await p.getByTestId("lab-go-on").click();
      await settle(p, 900);
      await p.getByTestId("lab-wait").click();
      await settle(p, 1400);
    },
    pipc: async (p) => {
      while ((await p.getByTestId("lab-act").count()) > 0) {
        await p.getByTestId("lab-act").click();
        await settle(p, 900);
      }
      await settle(p, 800);
    },
  };
  const toGate = async (p: Page) => {
    await p.locator(".ep-scroll").evaluate((el) => {
      const g = el.querySelector<HTMLElement>("[data-testid=lab-gate]") ?? el.querySelector<HTMLElement>(".ep-tool-lead, .ep-flip");
      el.scrollTo(0, (g?.offsetTop ?? 0) - 420);
    });
    await p.waitForTimeout(400);
  };
  for (const e of EPISODES) {
    await toAha(page, e.url, "new");
    await toGate(page);
    await shot(page, `${e.id}-gate-1-closed`);
    await finish[e.id]!(page);
    await toGate(page);
    await shot(page, `${e.id}-gate-2-opened`);
    await page.locator(".ep-scroll").evaluate((el) => el.scrollBy(0, 600));
    await page.waitForTimeout(400);
    await shot(page, `${e.id}-gate-3-opened-b`);
  }
}

// ═══════════════════════════════════════════ rate3 — 3화 주소 (UX-6). 파일이 없으면 "회의록을 기다리는 중" 한 장
if (MODE === "rate3") {
  await page.goto(`${BASE}/lab/episode/rate-3`);
  await settle(page, 2200);
  await scene(page, "rate3");
}

// ═══════════════════════════════════════════ labclip — 풀이 그림만 (UX-5: 셋째 회차 · 넘겨 보기 틀을 더하기 전 · 후를 견준다)
// 풀이 부품([data-testid=lab])만 오려 찍는다 — 시안 조종 칸(위쪽 줄)이 바뀌어도 그림은 그대로인지 본다. 처음 온 독자 · 누르는 단계마다.
if (MODE === "labclip") {
  const clip = async (name: string) => {
    await page.waitForTimeout(200);
    await page.locator("[data-testid=lab]").screenshot({ path: path.join(OUT, `${name}.png`) });
  };
  for (const e of EPISODES) {
    await toAha(page, e.url, "new");
    await clip(`${e.id}-clip-1`);
    if (e.id === "pipc") {
      // 넘겨 보기 — 칸마다 (UX-6: 다 넘기면 아래가 열린다 — 풀이 그림은 그대로인지)
      for (let i = 2; (await page.getByTestId("lab-act").count()) > 0; i++) {
        await page.getByTestId("lab-act").click();
        await settle(page, 1300);
        await clip(`${e.id}-clip-${i}`);
      }
      continue;
    }
    await page.getByTestId("lab-act").click();
    await settle(page, 1900);
    await clip(`${e.id}-clip-2`);
    await page.getByTestId("lab-go-on").click();
    await settle(page, 1100);
    await clip(`${e.id}-clip-3`);
    if (e.id === "delivery") {
      await page.getByTestId("lab-act").click();
      await settle(page, 1500);
      await clip(`${e.id}-clip-4`);
    } else {
      await page.getByTestId("lab-wait").click();
      await settle(page, 1400);
      await clip(`${e.id}-clip-4`);
      await page.getByTestId("lab-other").click();
      await settle(page, 1400);
      await clip(`${e.id}-clip-5`);
    }
    // 이 그림을 본 독자 · 체험 없이 보기 — 장면의 글 전체 (조종 칸 아래)
    for (const sw of ["lab-seen", "lab-plain"] as const) {
      await toAha(page, e.url, "new");
      await page.getByTestId(sw).click();
      await settle(page, 1200);
      await page.locator(".ep-scene").screenshot({ path: path.join(OUT, `${e.id}-clip-${sw}.png`) });
    }
  }
}

await browser.close();
console.log(`→ ${OUT}`);
console.log(errors.length ? `콘솔 오류 ${errors.length}:\n${errors.join("\n")}` : "콘솔 오류 0");
