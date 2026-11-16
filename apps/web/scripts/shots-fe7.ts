// F-E7 — 뉴스 한 줄을 눈에 띄게 (표지 + 첫 화면 카드) 앞 · 뒤의 폰 그림 (390×844). 켜 둔 서버를 찍는다 (테스트가 아니다 — e2e/ 에 넣지 않았다).
//   pnpm --filter @claro/web exec tsx scripts/shots-fe7.ts http://localhost:<포트> <나갈 폴더> read before|after   /s/oil/1 표지 · 첫 화면 / (위 · 큰 카드) — 그림 + 뉴스 한 줄의 줄 수 · 넘침
//   pnpm --filter @claro/web exec tsx scripts/shots-fe7.ts http://localhost:<포트> <나갈 폴더> same                 첫 화면 카드마다 뼈 (태그 · 클래스 · data-* · 글 — 움직임의 style 만 뺌)를 .html 로.
//       다른 이야기 (뉴스 한 줄 없음)의 카드가 앞 · 뒤 같은지 `diff -r` 로 견준다. 이야기 화면의 뼈는 shots-fe6.ts same 이 뜬다
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Locator } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3411";
const OUT = path.resolve(process.argv[3] ?? path.join(import.meta.dirname, "../../../logs/frontend/F-E7"));
const MODE = process.argv[4] ?? "read";
const V = process.argv[5] ?? "after";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: MODE === "same" ? "reduce" : "no-preference" });
const page = await ctx.newPage();
// 첫 화면 머리가 날마다 다르지 않게 — 11/15 의 한낮 (한국 시각)
await page.clock.setFixedTime(new Date("2026-11-15T12:00:00+09:00"));
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !m.location().url.endsWith("/favicon.ico") && errors.push(m.text()));
const settle = (ms = 1500) => page.waitForTimeout(ms);
const bones = (html: string) => html.replace(/ style="[^"]*"/g, "").replace(/></g, ">\n<");
const wide = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

/** 뉴스 한 줄 — 몇 줄로 섰나 (글자 줄의 수) · 오른쪽 끝이 제 칸을 넘나 · 크기 · 굵기 */
async function measure(news: Locator, box: Locator) {
  if (!(await news.count())) return "뉴스 한 줄 없음";
  const m = await news.evaluate((el, boxEl) => {
    // 글자 줄 = 글 조각 (text node)의 줄 상자 — 감싼 요소의 상자는 세지 않는다 (flex 안의 span 은 위 끝이 글자와 다르다)
    const tops = new Set<number>();
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      const r = document.createRange();
      r.selectNodeContents(t);
      for (const x of r.getClientRects()) if (x.width > 1) tops.add(Math.round(x.top));
    }
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const o = (boxEl as Element).getBoundingClientRect();
    return { lines: tops.size, size: cs.fontSize, weight: cs.fontWeight, w: Math.round(b.width), right: Math.round(b.right), boxRight: Math.round(o.right), bg: cs.backgroundColor };
  }, await box.elementHandle());
  return `줄 ${m.lines} · ${m.size} · 굵기 ${m.weight} · 폭 ${m.w}px · 오른쪽 끝 ${m.right} / 칸 ${m.boxRight} · 바탕 ${m.bg}`;
}

if (MODE === "read") {
  // 첫 화면 — 위 (첫 화면 그대로) · 큰 카드 한 장
  await page.goto(`${BASE}/`);
  await settle(2000);
  await page.screenshot({ path: path.join(OUT, `${V}-home.png`) });
  const card = page.getByTestId("card-oil-1");
  await card.scrollIntoViewIfNeeded();
  await settle(500);
  await card.screenshot({ path: path.join(OUT, `${V}-home-card.png`) });
  console.log(`첫 화면 카드 뉴스 한 줄: ${await measure(card.locator("[data-testid=card-news]"), card.locator(".hm-body"))} · 가로 넘침 ${await wide()}`);
  // /s/oil/1 표지 — 화면 그대로 · 위쪽 확대 (그림 아래 ~ 제목)
  await page.goto(`${BASE}/s/oil/1`);
  await settle(2200);
  await page.screenshot({ path: path.join(OUT, `${V}-cover.png`) });
  const top = await page.locator(".ep-episode-no").boundingBox();
  const title = await page.locator(".ep-title-cover").boundingBox();
  if (top && title) await page.screenshot({ path: path.join(OUT, `${V}-cover-zoom.png`), clip: { x: 0, y: top.y - 14, width: 390, height: title.y + title.height - top.y + 28 } });
  console.log(`표지 뉴스 한 줄: ${await measure(page.getByTestId("cover-news"), page.locator(".ep-scene"))} · 가로 넘침 ${await wide()}`);
  const [n, t] = await Promise.all([page.getByTestId("cover-news").boundingBox(), title]);
  if (n && t) console.log(`표지: 뉴스 한 줄 아래 끝 ${Math.round(n.y + n.height)} · 제목 위 끝 ${Math.round(t.y)} (사이 ${Math.round(t.y - n.y - n.height)}px)`);
  const ask = await page.getByTestId("ask").boundingBox();
  if (ask) console.log(`표지: 물음 단추 아래 끝 ${Math.round(ask.y + ask.height)} / 화면 844 (한 화면에 ${ask.y + ask.height <= 844 ? "든다" : "안 든다"})`);
} else {
  await page.goto(`${BASE}/`);
  await settle(1500);
  for (const card of await page.locator(".td-list .td-card").all()) {
    const id = (await card.getAttribute("data-testid")) ?? "card-x";
    writeFileSync(path.join(OUT, `home-${id}.html`), bones(await card.evaluate((el) => el.outerHTML)));
  }
  // 그림도 — 뼈가 같아도 CSS 가 바뀌면 달라질 수 있다. 기름값 카드 (뉴스 한 줄이 붙어 키가 컸다)를 앞 · 뒤 둘 다 치우고 찍는다 —
  // 아래 카드들이 같은 자리 (같은 소수점 아래 자리)에 서야 글자의 번짐까지 견줄 수 있다
  await page.getByTestId("card-oil-1").evaluate((el) => ((el as HTMLElement).style.display = "none"));
  for (const card of await page.locator(".td-list .td-card:not([data-testid=card-oil-1])").all()) {
    const id = (await card.getAttribute("data-testid")) ?? "card-x";
    await card.scrollIntoViewIfNeeded();
    await settle(300);
    await card.screenshot({ path: path.join(OUT, `home-${id}.png`), animations: "disabled" });
  }
  await page.screenshot({ path: path.join(OUT, `home-without-oil-full.png`), fullPage: true, animations: "disabled" });
  // 다른 이야기 (뉴스 한 줄 없음)의 표지 · 짧은 이야기의 첫 장 — 화면 그림
  for (const u of ["/s/price/1", "/s/rate/2", "/s/privacy/1", "/short/meta-gallery", "/short/license-notice"]) {
    await page.goto(`${BASE}${u}`);
    await settle(1500);
    await page.screenshot({ path: path.join(OUT, `page${u.replace(/\//g, "-")}.png`), animations: "disabled" });
  }
}

await browser.close();
console.log(`찍음 → ${OUT} · 콘솔 · 페이지 오류 ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);
