// "오늘" 시안 (UX-7 · D79 · UX-7b) — /lab/today · 짧은 이야기 · 색 시안 (종이 + 미색 · 쑥 · 형광펜). lab 전용이다: 실제 주소 (/ · /s/*)는 색이 종이 그대로여야 한다.
// F-E2 부터 실제 첫 화면 (/)도 이 꼴이다 (같은 카드 부품 · 같은 이야기 목록) — 실제 쪽은 episode.spec.ts 가 본다. 여기는 시안에만 있는 것 (색 스위치 · 견본 자리 · 시안 주소)을 본다.
// F-E3: 병원 짧은 이야기는 실제 목록에서 내렸고 (한 사건 = 이야기 하나 · D91 ①) 시안에는 견본으로 남는다 (곁의 긴 이야기 바로 아래 · /lab/today/short). 카드에 체험 표시가 없다 (D91 ②).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const golden = (name: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../fixtures", `episode-${name}.json`), "utf8"));
const flat = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, "");
const PAPER = "rgb(244, 238, 227)";
const bg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.querySelector(".ep-root")!).backgroundColor);

test.use(PHONE);

test("오늘 — 긴 이야기 셋 (골든의 글 그대로) · 짧은 이야기 (견본 병원 + 실제 목록의 면허 정지) · 자리만 있는 칸 · 체험 표시 없음. 번호는 이어지는 이야기 (금리 2화)에만", async ({ page }) => {
  const res = await page.goto("/lab/today");
  expect(res!.status()).toBe(200);
  const cards = [
    { code: "delivery", ep: golden("price-1"), href: "/lab/episode" },
    { code: "fomc", ep: golden("rate-2"), href: "/lab/episode/fomc" },
    { code: "pipc", ep: golden("privacy-1"), href: "/lab/episode/pipc" },
  ];
  for (const { code, ep, href } of cards) {
    const card = page.getByTestId(`card-${code}`);
    await expect(card.locator("a.td-main")).toHaveAttribute("href", href);
    const text = flat(await card.innerText());
    for (const s of [ep.series.name, ep.scenes.cover.title, ep.scenes.cover.dek.t, ep.scenes.cover.meta.t]) expect(text, s).toContain(flat(s));
    // 번호 · 지난 이야기 — 둘째 이야기가 실제로 있을 때만 (번호 화면 규칙 D88 E-20 — 지금 목록에서는 Episode.number ≥ 2 와 같은 답이다)
    const numbered = ep.number >= 2;
    expect(text.includes(flat(ep.scenes.cover.episode.t)), `${code} 의 번호`).toBe(numbered);
    await expect(page.getByTestId(`recap-${code}`)).toHaveCount(numbered ? 1 : 0);
  }
  // 지난 이야기 30초 — 골든의 글 그대로
  await page.getByTestId("recap-fomc").locator("summary").click();
  for (const r of cards[1]!.ep.scenes.cover.recap) expect(flat(await page.getByTestId("recap-fomc").innerText())).toContain(flat(r.t));
  // 짧은 이야기 · 자리만 있는 칸 — 견본 (병원)은 실제 목록에서 내렸어도 시안에는 곁의 긴 이야기 바로 아래 (내리기 전 자리)에 남는다 · 시안 주소로 간다
  await expect(page.getByTestId("card-pipc-hospital").locator("a")).toHaveAttribute("href", "/lab/today/short");
  expect(await page.getByTestId("card-pipc-hospital").innerText()).not.toMatch(/\d화/);
  await expect(page.getByTestId("card-license-notice").locator("a")).toHaveAttribute("href", "/short/license-notice");
  await expect(page.getByTestId("card-empty")).toContainText("견본 자리 — 글 없음");
  expect(await page.locator(".td-list .td-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")))).toEqual(["card-delivery", "card-fomc", "card-pipc", "card-pipc-hospital", "card-license-notice", "card-empty"]);
  // 읽는 시간을 내지 않는다 (D82) · 체험 표시도 없다 (D91 ②) — 무게만
  const list = await page.locator(".td-list").innerText();
  expect(list).not.toMatch(/약\s*\d+\s*분/);
  expect(list).not.toMatch(/체험\s*(있음|없음)/);
  for (const s of ["긴 이야기", "짧은 이야기"]) expect(list).toContain(s);
  // 개념으로 이어짐 — 견본 (병원)과 개인정보가 같은 도구를 만난다 (tools_from)
  await expect(page.locator(".td-concepts li")).toHaveCount(1);
  await expect(page.locator(".td-concepts li a")).toHaveCount(2);
  // 이어지는 이야기 — 금리만. 시리즈 줄에 "다음 화" 칸이 없다 (예고는 날짜가 있을 때만 따로)
  await expect(page.locator("[data-testid^=cont-]")).toHaveCount(1);
  await expect(page.getByTestId("cont-rate").locator(".ep-track li")).toHaveCount(3);
});

test("색 시안 — 스위치로 같은 화면이 바뀐다 · 회차 시안 화면에도 이어진다 · 실제 주소는 종이 톤 그대로", async ({ page }) => {
  await page.goto("/lab/today");
  expect(await bg(page)).toBe(PAPER);
  const seen = new Set<string>([PAPER]);
  // 스위치 — 종이 + 새 셋 (UX-7b). UX-7 의 신문 · 안개 · 밤은 스위치에 없다
  await expect(page.locator("[data-testid^=palette-]:not([data-testid=palette-dock])")).toHaveCount(4);
  for (const id of ["hanji", "ssuk", "marker"]) {
    await page.getByTestId(`palette-${id}`).click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", id);
    seen.add(await bg(page));
  }
  expect(seen.size, "네 색의 바탕이 서로 다르다").toBe(4);
  // 고른 색이 회차 시안 화면에 이어진다 (스위치도 뜬다)
  const night = await bg(page);
  // 형광펜 — 첫 화면에서는 Claro 글자 한 군데에만 그어진다 (제목 · 단추에는 없다)
  const stroke = (sel: string) => page.evaluate((q) => getComputedStyle(document.querySelector(q)!).backgroundImage, sel);
  expect(await stroke(".td-mark > span")).toContain("gradient");
  for (const sel of [".td-title", ".td-go", ".td-intro h1"]) expect(await stroke(sel), sel).toBe("none");
  await page.getByTestId("card-pipc").locator("a.td-main").click();
  await expect(page).toHaveURL(/\/lab\/episode\/pipc$/);
  await expect(page.getByTestId("palette-dock")).toBeVisible();
  expect(await bg(page)).toBe(night);
  await page.getByTestId("ask").click();
  await expect(page.locator(".ep-root")).toHaveAttribute("data-scene", "zero");
  // 실제 주소 — 색을 고른 탭에서도 종이 톤 · 스위치 없음
  for (const real of ["/", "/s/privacy/1"]) {
    await page.goto(real);
    await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
    await expect(page.getByTestId("palette-dock")).toHaveCount(0);
    expect(await bg(page)).toBe(PAPER);
  }
  // 종이로 되돌리면 덮는 규칙이 걷힌다
  await page.goto("/lab/today");
  await page.getByTestId("palette-paper").click();
  await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
  expect(await bg(page)).toBe(PAPER);
  // 종이에서는 형광펜이 없다
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".td-mark > span")!).backgroundImage)).toBe("none");
});

test("UX-7 의 견본 색 (신문 · 안개 · 밤)은 주소의 ?c= 로만 열린다 — 그때만 스위치에 한 칸 더 보인다", async ({ page }) => {
  await page.goto("/lab/today?c=night");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "night");
  await expect(page.getByTestId("palette-night")).toBeVisible();
  await expect(page.locator("[data-testid^=palette-]:not([data-testid=palette-dock])")).toHaveCount(5);
  await page.getByTestId("palette-hanji").click();
  await expect(page.getByTestId("palette-night")).toHaveCount(0);
});

test("곧장 연 회차 시안 화면은 지금 그대로다 — 색 스위치가 없다 (주소에 ?c= 가 있으면 뜬다)", async ({ page }) => {
  await page.goto("/lab/episode/fomc");
  await expect(page.locator(".ep-demo").first()).toBeVisible();
  await expect(page.getByTestId("palette-dock")).toHaveCount(0);
  expect(await bg(page)).toBe(PAPER);
  await page.goto("/lab/episode/fomc?c=mist");
  await expect(page.getByTestId("palette-dock")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "mist");
});

test("짧은 이야기 — 장면 넷 · 번호 없음 · 근거를 누르면 원문 구절 · 지도에 도구 셋 · 긴 이야기로 가는 길", async ({ page }) => {
  await page.goto("/lab/today/short");
  const root = page.getByTestId("short");
  await expect(root).toHaveAttribute("data-scene", "cover");
  await expect(page.locator(".ep-count")).toHaveText("1/4");
  await expect(page.locator(".ep-track"), "시리즈 줄이 없다").toHaveCount(0);
  for (const scene of ["where", "why", "keep"]) {
    expect(await page.locator(".ep-scene").innerText(), "번호가 없다").not.toMatch(/\d화/);
    if (scene === "why") {
      // 근거 — 켜고 뒤집기의 깨는 사실을 누른다
      await page.getByTestId("src-toggle").click();
      await page.locator(".pl-thought[data-kind=breaker] .ep-src-hit").click();
      await expect(page.locator(".ep-sheet blockquote").first()).toContainText("관행적으로 회원가입 기능을 구현하여");
      await expect(page.locator(".ep-sheet cite").first()).toContainText("개인정보위 보도자료");
      await page.locator(".ep-sheet header button").click();
      await page.getByTestId("src-toggle").click();
    }
    await page.getByTestId("ask").click();
    await expect(root).toHaveAttribute("data-scene", scene);
  }
  await expect(page.locator(".ep-count")).toHaveText("4/4");
  await expect(page.getByTestId("ask"), "마지막 장 — 다음 화 예고도 물음도 없다").toHaveCount(0);
  await expect(page.locator(".ep-nextup")).toHaveCount(0);
  for (const id of ["safety", "fine", "order"]) await expect(page.getByTestId(`node-${id}`).first()).toBeVisible();
  await expect(page.getByTestId("node-proviso")).toHaveCount(0);
  await expect(page.getByTestId("sibling")).toHaveAttribute("href", "/lab/episode/pipc");
  await expect(page.getByTestId("to-today")).toHaveAttribute("href", "/lab/today");
});

test("개념 지도 견본 — 주제 셋의 지도", async ({ page }) => {
  await page.goto("/lab/today");
  await page.getByTestId("to-map").click();
  await expect(page).toHaveURL(/\/lab\/today\/map$/);
  await expect(page.getByTestId("concept-map")).toHaveCount(3);
});
