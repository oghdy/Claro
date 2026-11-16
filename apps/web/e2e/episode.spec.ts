// 실제 주소 (F-E1 · D76 → F-E2 · D86 · D88) — 첫 화면 `/` = "오늘" · 긴 이야기 셋 `/s/<시리즈>/<n>` · 짧은 이야기 `/short/<code>` · 개념 지도 `/map` · 옛 화면으로 넘어가는 번호 링크.
// 회차의 글은 골든 픽스처 (fixtures/episode-*.json)에서 읽어 화면과 대 본다 — 화면이 골든의 글자 그대로를 보인다.
// 짧은 이야기는 실제 목록에 남은 하나 — 「면허 정지…」 (P-S1 이 낸 파일 · 골든이 아니다 · 홀로 선다: sibling · tools_from null). 병원 짧은 이야기 (골든 넷째)는
// F-E3 에서 실제 화면에서 내렸다 (한 사건 = 이야기 하나 · D91 ①) → /short/pipc-hospital 404 · 곁 이야기 길 없음. 시안 (/lab/today/short)에만 남는다 (today.spec.ts).
// 카드에 "체험 있음 · 없음"을 적지 않는다 (D91 ② · F-E3).
// F-E4 (D105): 첫 화면의 카드는 실제 첫 화면의 것이다 (episode/home/cards.tsx — 카드마다 그림 · 조용한 꼬리표). 뜻 (카드 수 · 차례 · 링크 · 번호 규칙 · 거짓 "오늘" 없음)은 그대로 본다.
// F-E5 (D107 ~ D111): 11/15 "오늘" 두 편이 맨 위에 선다 — 긴 이야기 /s/oil/1 (새 시리즈의 첫 이야기 · 파이프라인이 낸 회차 파일 · 다음 화를 약속하지 않는다) · 짧은 이야기 /short/meta-gallery (홀로 선다).
// 머리는 읽는 날이 한국 날짜로 그날이면 "오늘의 이야기", 아니면 "{m}월 {d}일의 이야기" — 시계를 고정해 둘 다 본다 (그때는 카드 여섯 · 11/15 를 손으로 박았다 → F-E8 부터 목록에서).
// F-E6 (D125): /s/oil/1 의 회차 파일이 메운 판 (판 2 — events/…/local/oil-1/episode.json · 로컬 세션이 쓰고 편집자가 짚은 것)으로 바뀌었다. 파이프라인이 낸 판 1 (episodes/oil-1/)은 그 자리에 그대로다.
// 이 이야기만 화면 칸 셋 (그 곁의 screen.json — 계약에 없는 손 칸: 제목 위 뉴스 한 줄 · 멈춘 고리 가림 · 풀이 뒤 문서 문장)을 받는다. 다른 실제 이야기는 그대로다 — 둘 다 아래에서 본다.
// F-E7 (D127): 그 뉴스 한 줄이 눈에 띈다 (굵게 · 옅은 강조 바탕 띠 · 강조색 점 — 뼈대 episode.css .ep-news) · 첫 화면 카드에도 제목 바로 위에 (같은 꼴 · 작게). 다른 카드 · 화면에는 없다.
// 실제 화면에는 시안의 것 (맨 위 띠 · 독자 스위치 · 풀이 스위치)이 없고, 독자는 처음 온 독자의 조립을 받는다.
// F-E8 (D132): **그날의 값은 손으로 박지 않는다** — 머리 날짜 · 읽는 날의 시각 · 카드의 차례 · 맨 위 묶음 · 지난 이야기 · 맨 위 카드 · 편 수 · 지도 장 수 · 뉴스 한 줄 카드 ·
// 이어지는 이야기 수는 이야기 목록 (catalog.tsx STORIES · bundle — ./stories.ts)에서 읽는다. 새 이야기를 목록 맨 위에 한 줄 더해도 이 파일을 고치지 않는다.
// 지키던 뜻 (가장 새 날의 이야기가 맨 위 · 같은 날이면 목록의 위가 먼저 · 목록의 차례 = 화면의 차례 · 그날이면 "오늘의 이야기" · 다음 날은 날짜 그대로)은 그대로 본다.
// 이야기 하나의 글 · 동작을 보는 시험 (LIVE · SHORTS · 기름값 · 화면 칸 · 금리 2화)은 그대로다 — 그 이야기를 지키는 것이다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { HOME, countNoun } from "../src/episode/home-copy";
import { READERS } from "./readers";
import { OLD } from "./reader";
import { LIST, dayTitle, noonKst } from "./stories";

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const repo = (file: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../..", file), "utf8"));
const golden = (name: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../fixtures", `episode-${name}.json`), "utf8"));
// numbered — 번호 화면 규칙 (D88 E-20): 같은 시리즈에 긴 이야기가 둘 이상 실제로 있을 때만 "N화" · 시리즈 줄 · "다음 화"가 보인다. 지금은 금리뿐이다 (2화 — 첫째가 있었다)
// tags — 국내 / 해외 · 카테고리 (목록에 손으로 적은 값 — episode/catalog.tsx)
// unpromised — 다음 화를 약속하지 않는 이야기 (F-E5 · catalog 의 unpromised): 지도에 "다음 화 개념" (ghosts)이 없고 이어짐의 "다음 회차가 될 일들"이 "남은 일들"이다
const LIVE = [
  { path: "/s/oil/1", ep: repo("packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/local/oil-1/episode.json"), code: "oil-1", numbered: false, tags: ["국내", "돈"], unpromised: true },
  { path: "/s/price/1", ep: golden("price-1"), code: "delivery", numbered: false, tags: ["국내", "기술"], unpromised: false },
  { path: "/s/rate/2", ep: golden("rate-2"), code: "fomc", numbered: true, tags: ["해외", "돈"], unpromised: false },
  { path: "/s/privacy/1", ep: golden("privacy-1"), code: "pipc", numbered: false, tags: ["국내", "기술"], unpromised: false },
];
/** 실제의 짧은 이야기 둘 — 파일 그대로 읽어 화면과 대 본다 (catalog.tsx 가 읽는 그 파일). 목록의 차례 (새것이 위) */
const META = repo("packages/pipeline/data/events/GPDP-20261114-META-GALLERY/shorts/meta-gallery/story.json");
const SHORT = repo("packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice/story.json");
const SHORTS = [
  { story: META, tags: ["해외", "기술"] },
  { story: SHORT, tags: ["국내", "나라와 법"] },
];
const SHORT_PATH = `/short/${SHORT.code}`;
/**
 * 첫 화면의 맨 위 묶음 (catalog.bundle — 목록에 적힌 day 가운데 가장 늦은 날의 이야기들) · 그 아래 "지난 이야기". 그날 · 다음 날의 한낮 (한국 시각)에 읽는다.
 * 손으로 박지 않는다 (F-E8) — 새 이야기를 목록에 더하면 여기가 따라 바뀐다
 */
const { top: TOP, rest: REST } = LIST;
const DAY = LIST.day ?? "";
const READ = { on: noonKst(DAY), after: noonKst(DAY, 1) };
/** 맨 위 카드 — 맨 위 묶음의 첫 이야기가 긴 이야기면 큰 카드 (data-lead) */
const LEAD = TOP[0]?.kind === "long" ? TOP[0].id : null;
const DELIVERY = LIVE.find((x) => x.code === "delivery")!;
const FOMC = LIVE.find((x) => x.code === "fomc")!;
/** 실제 화면에서 내린 짧은 이야기 (병원 — 골든 넷째는 그대로) */
const GONE = golden("short-privacy-yeonghun");
const GONE_PATH = `/short/${GONE.code}`;
/** 카드 · 길에 "체험 있음 · 없음"이 없다 (D91 ②) */
const LAB_MARK = /체험\s*(있음|없음)/;
/** 장면 머리의 번호를 뗀 것 — "1화 · 오늘의 사건" → "오늘의 사건". 남은 글자는 골든 그대로다 */
const unnumber = (t: string) => t.replace(/^\d+화(와 \d+화)* · /, "");
/** 빈칸 · 줄바꿈 · 굵게 표시 (**) 를 빼고 견준다 — 글자는 그대로 */
const flat = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, "");
const text = (v: string | { t: string }) => (typeof v === "string" ? v : v.t);
const sceneText = async (page: Page) => flat(await page.locator(".ep-scene").innerText());

test.use(PHONE);

test("첫 화면 = 오늘 — 종이 톤 · 카드는 목록 그대로 (가장 새 날의 묶음 + 지난 이야기 · 글은 파일 그대로) · 병원 짧은 이야기 없음 · 체험 표시 없음 · 번호는 금리에만 · 시안의 것이 없다 · 머리가 날짜를 속이지 않는다", async ({ page, request }) => {
  // 목록의 뜻 (F-E8 — 값은 목록에서 오지만 규칙은 그대로 본다): 머리의 날 = 목록에 적힌 날 가운데 가장 늦은 날 · 맨 위 묶음은 다 그날 · 지난 이야기는 새 날이 위 (날이 없는 것은 맨 아래)
  const days = LIST.all.flatMap((x) => (x.day ? [x.day] : []));
  expect(DAY, "목록에 낸 날 (day)이 적힌 이야기가 있다").not.toBe("");
  expect(DAY, "머리의 날 = 가장 새 날").toBe([...days].sort().at(-1));
  expect(TOP.length, "맨 위 묶음이 있다").toBeGreaterThan(0);
  for (const x of TOP) expect(x.day, `${x.id}: 맨 위 묶음은 그날의 이야기`).toBe(DAY);
  for (const x of REST) expect((x.day ?? "") < DAY, `${x.id}: 지난 이야기는 그날보다 앞 (날이 없는 것 포함)`).toBe(true);
  for (const [i, x] of REST.entries()) if (i) expect((REST[i - 1]!.day ?? "") >= (x.day ?? ""), `지난 이야기의 차례 — ${REST[i - 1]!.id} 가 ${x.id} 보다 새 날 (같은 날이면 목록의 차례)`).toBe(true);
  for (const part of [TOP, REST]) for (const [i, x] of part.entries()) if (i && part[i - 1]!.day === x.day) expect(part[i - 1]!.at, `같은 날이면 목록의 위가 먼저 — ${part[i - 1]!.id} · ${x.id}`).toBeLessThan(x.at);
  // 읽는 날이 그날 (한국 날짜)이다
  await page.clock.setFixedTime(READ.on);
  const res = await page.goto("/");
  expect(res!.status()).toBe(200);
  await expect(page.locator(".r-deck"), "옛 화면 (B5)이 아니다").toHaveCount(0);
  await expect(page.locator(".ep-demo, [data-testid=palette-dock], [data-testid=card-empty]"), "시안 띠 · 색 스위치 · 견본 자리가 없다").toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(244, 238, 227)");
  // 머리 — 가장 새 묶음의 날. 서버가 그린 글은 날짜 그대로 ("{m}월 {d}일의 이야기")이고, 읽는 날이 그날일 때만 "오늘의 이야기"가 된다
  expect(await (await request.get("/")).text(), "서버가 그린 머리는 날짜다").toMatch(new RegExp(`<h1[^>]*data-day="${DAY}"[^>]*>${dayTitle(DAY)}</h1>`));
  await expect(page.getByTestId("head")).toHaveAttribute("data-day", DAY);
  await expect(page.getByTestId("head")).toHaveText("오늘의 이야기");

  // 긴 이야기 넷 — 카드의 글은 골든 그대로 · 주소는 실제 주소 · 번호 · 지난 이야기는 번호 화면 규칙을 지난 것 (금리)에만
  for (const { path: href, ep, code, numbered, tags } of LIVE) {
    const card = page.getByTestId(`card-${code}`);
    await expect(card.locator("a.td-main")).toHaveAttribute("href", href);
    const seen = flat(await card.innerText());
    for (const s of [ep.series.name, ep.scenes.cover.title, ep.scenes.cover.dek.t, ep.scenes.cover.meta.t, ...tags, "긴 이야기"]) expect(seen, s).toContain(flat(s));
    expect(await card.innerText(), `${code}: 체험 표시`).not.toMatch(LAB_MARK);
    expect(/\d화/.test(await card.innerText()), `${code} 의 번호`).toBe(numbered);
    await expect(page.getByTestId(`recap-${code}`)).toHaveCount(numbered ? 1 : 0);
  }
  await page.getByTestId("recap-fomc").locator("summary").click();
  for (const r of FOMC.ep.scenes.cover.recap) expect(flat(await page.getByTestId("recap-fomc").innerText())).toContain(flat(r.t));
  // 짧은 이야기 둘 — 얇은 카드 · 번호 없음 · 제 주소 · 체험 표시 없음
  for (const { story, tags } of SHORTS) {
    const short = page.getByTestId(`card-${story.code}`);
    await expect(short.locator("a.td-main")).toHaveAttribute("href", `/short/${story.code}`);
    for (const s of [story.series.name, story.scenes.cover.title, story.scenes.cover.meta.t, ...tags, "짧은 이야기"]) expect(flat(await short.innerText()), s).toContain(flat(s));
    expect(await short.innerText()).not.toMatch(/\d화/);
  }
  expect((await page.locator(".td-list").allInnerTexts()).join("\n"), "카드에 체험 표시가 없다 (D91 ②)").not.toMatch(LAB_MARK);
  // 병원 짧은 이야기는 내렸다 (D91 ① — 개인정보 긴 이야기와 같은 사건) — 카드도 제목도 없다
  await expect(page.getByTestId(`card-${GONE.code}`)).toHaveCount(0);
  expect(flat(await page.getByTestId("home").innerText())).not.toContain(flat(GONE.scenes.cover.title));
  // 차례 — 목록의 차례 그대로 (카드 = 목록의 줄 전부) · 맨 위가 큰 카드. 맨 위 묶음 = 가장 새 날의 이야기들 · 그 아래 "지난 이야기" (값은 목록에서 — F-E8)
  const ids = (sel: string) => page.locator(sel).evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
  expect(await ids(".td-list .td-card")).toEqual([...TOP, ...REST].map((x) => x.id));
  expect([...TOP, ...REST].map((x) => x.id), "목록의 차례 = 화면의 차례 (새 이야기는 목록 맨 위에 적는다)").toEqual(LIST.all.map((x) => x.id));
  expect(await ids("main > .td-list .td-card"), "그날의 묶음").toEqual(TOP.map((x) => x.id));
  expect(await ids(".td-sec .td-list .td-card"), "지난 이야기").toEqual(REST.map((x) => x.id));
  if (REST.length) await expect(page.locator("#td-rest")).toHaveText("지난 이야기");
  else await expect(page.locator("#td-rest")).toHaveCount(0);
  const topLongs = TOP.filter((x) => x.kind === "long").length;
  await expect(page.locator(".hm-tally")).toHaveText(HOME.tally.replace("{long}", countNoun(topLongs)).replace("{short}", countNoun(TOP.length - topLongs)));
  await expect(page.locator(".td-card[data-lead]")).toHaveCount(LEAD ? 1 : 0);
  if (LEAD) await expect(page.getByTestId(LEAD)).toHaveAttribute("data-lead", "");
  // F-E4 — 카드마다 제 그림 (긴 이야기 = 표지 그림 · 짧은 이야기 = 작은 그림) · 첫 인상의 큰 한 줄 · 화면 글이 "매일"을 약속하지 않는다
  for (const { id } of LIST.all) await expect(page.getByTestId(id).locator(".hm-face svg"), `${id} 의 그림`).toHaveCount(1);
  await expect(page.locator(".hm-tagline")).toBeVisible();
  expect(await page.getByTestId("home").innerText()).not.toMatch(/매일|날마다 (새 이야기가 )?(올라와요|내요|만나요)/);
  // 읽는 시간을 내지 않는다 (D82)
  expect(await page.getByTestId("home").innerText()).not.toMatch(/\d+\s*분/);
  // 이어지는 이야기 — 번호를 보이는 주제만 (목록에서 — 지금은 금리). 시리즈 줄은 골든의 track (지나온 화 · 지금 — "다음 화" 칸은 줄에 없다) · 예고는 날짜가 있는 것
  expect(await ids("[data-testid^=cont-]")).toEqual(LIST.cont.map((s) => `cont-${s}`));
  const cont = page.getByTestId("cont-rate");
  await expect(cont).toHaveAttribute("href", "/s/rate/2");
  const track = FOMC.ep.track.filter((e: any) => e.state !== "next");
  await expect(cont.locator(".ep-track li")).toHaveCount(track.length);
  for (const s of [...track.flatMap((e: any) => [e.no.t, e.title.t]), FOMC.ep.scenes.next.coming[0].body.t]) expect(flat(await cont.innerText()), s).toContain(flat(s));
  // 공유했을 때 보이는 것 · 검색은 그대로 막는다
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<meta property="og:title" content="Claro — [^"]+"/);
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
  // 개념 지도로 가는 길 — 주제마다 한 장 · 첫 화면으로 돌아온다
  await page.getByTestId("to-map").click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByTestId("concept-map")).toHaveCount(LIST.maps.length);
  // 다음 화를 약속하지 않는 이야기 (기름값)의 지도에는 "다음 화 개념"이 없다 — 다른 지도는 그대로 (둘씩). 지도마다의 수는 목록에서 (F-E8 — 주제가 늘면 따라 는다)
  await expect(page.locator(".ep-node[data-state=ghost]")).toHaveCount(LIST.maps.reduce((n, x) => n + x.ghosts, 0));
  for (const x of LIVE) expect(LIST.maps.find((m) => m.series === x.ep.series.code)?.ghosts, `${x.path} 의 지도의 다음 화 개념`).toBe(x.unpromised ? 0 : x.ep.map.ghosts.length);
  for (const g of LIVE[0]!.ep.map.ghosts) expect(await page.getByTestId("today-map").innerText(), `지도의 ghost "${g.name}"`).not.toContain(g.name);
  await expect(page.getByTestId("palette-dock")).toHaveCount(0);
  await page.locator("a.ep-back").click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByTestId("card-delivery").locator("a.td-main").click();
  await expect(page).toHaveURL(DELIVERY.path);
  // 읽는 날이 그날이 아니면 (다음 날) 머리는 날짜 그대로다 — "오늘"이라고 하지 않는다
  await page.clock.setFixedTime(READ.after);
  await page.goto("/");
  await expect(page.getByTestId("head")).toHaveText(dayTitle(DAY));
  expect(await page.getByTestId("home").innerText()).not.toContain("오늘의 이야기");
});

test("가장 새 묶음 (목록에서) — 그날의 새 주소가 열린다 (200) · 콘솔 오류가 없다 (첫 화면 · 그날의 이야기 · 지도)", async ({ page }) => {
  const errors: string[] = [];
  // favicon 404 는 뺀다 (지난 결정대로)
  page.on("console", (m) => (m.type() === "error" && !/favicon/.test(`${m.text()} ${m.location().url}`) ? errors.push(`${page.url()} ${m.text()}`) : undefined));
  page.on("pageerror", (e) => errors.push(`${page.url()} ${e.message}`));
  for (const p of ["/", ...TOP.map((x) => x.href), "/map"]) {
    const res = await page.goto(p, { waitUntil: "networkidle" });
    expect(res!.status(), p).toBe(200);
  }
  // 가로로 넘치지 않는다 (긴 주제 이름 · 긴 문서 이름)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

/** 기름값 1화 — 판 1 (파이프라인 산출물 · 실제 화면에서 내려왔다) · 화면 칸 (판 2 곁의 손 칸) */
const OIL = LIVE[0]!;
const OIL_V1 = repo("packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/episodes/oil-1/episode.json");
const OIL_SCREEN = repo("packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/local/oil-1/screen.json");
/** 종이 토큰의 옅은 강조색 (paper.accentSoft #f7dfd2) — 뉴스 한 줄의 바탕 띠 (F-E7 · D127) */
const ACCENT_SOFT = "rgb(247, 223, 210)";
/** 뉴스 한 줄의 꼴 — 굵기 · 크기 · 바탕 · 글자 줄의 수 · 오른쪽 끝 */
const newsLook = (el: Locator) =>
  el.evaluate((n) => {
    const cs = getComputedStyle(n);
    // 글자 줄 = 글 조각 (text node)의 줄 상자의 수 — 감싼 요소의 상자는 세지 않는다
    const tops = new Set<number>();
    const walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      const r = document.createRange();
      r.selectNodeContents(t);
      for (const x of r.getClientRects()) if (x.width > 1) tops.add(Math.round(x.top));
    }
    const lines = tops.size;
    return { weight: Number(cs.fontWeight), size: parseFloat(cs.fontSize), bg: cs.backgroundColor, lines, right: n.getBoundingClientRect().right };
  });
const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (m) => (m.type() === "error" && !/favicon/.test(`${m.text()} ${m.location().url}`) ? errors.push(`${page.url()} ${m.text()}`) : undefined));
  page.on("pageerror", (e) => errors.push(`${page.url()} ${e.message}`));
  return errors;
};
/** 표지에서 풀이 장면까지 — 도구는 전부 "처음 들어요" */
const toAha = async (page: Page) => {
  const root = page.locator(".ep-root");
  for (let i = 0; i < 6 && (await root.getAttribute("data-scene")) !== "aha"; i++) {
    const before = await root.getAttribute("data-scene");
    const fresh = page.locator(".ep-tool-ask button[data-primary]");
    while (await fresh.count()) await fresh.first().click();
    await page.getByTestId("ask").click();
    await expect(root).not.toHaveAttribute("data-scene", before!);
  }
  await expect(root).toHaveAttribute("data-scene", "aha");
};

test("/s/oil/1 = 메운 판 (판 2 · F-E6) — 새 제목 · 제목 위 뉴스 한 줄 (눈에 띄게 — 표지 · 첫 화면 카드 · F-E7) · 지금까지의 이야기 없음 · 멈춘 고리는 누르기 전에 가려져 있다 → 누른 뒤 꼬리표 · 문서 문장 · \"뒤집어 보면\" 상자 없음 · 근거 시트 · 콘솔 오류 0 · 첫 화면 카드 제목", async ({ page, request }) => {
  test.setTimeout(90_000);
  const errors = errorsOf(page);
  const { ep } = OIL;
  const title = ep.scenes.cover.title.replace(/\n/g, " ");
  const old = OIL_V1.scenes.cover.title.replace(/\n/g, " ");
  expect(ep.episode_version, "판 2").toBe(2);
  expect(ep.episode_id, "같은 이야기 — id 그대로").toBe(OIL_V1.episode_id);
  expect(title).not.toBe(old);
  // 서버가 그린 글 — 새 제목 · 뉴스 한 줄. 판 1 의 제목은 없다
  const html = await (await request.get(OIL.path)).text();
  expect(html).toContain(`<meta property="og:title" content="${title}"`);
  expect(flat(html)).toContain(flat(OIL_SCREEN.news.t));
  expect(flat(html)).not.toContain(flat(old));
  // 첫 화면 카드 — 새 제목
  await page.goto("/");
  const card = flat(await page.getByTestId("card-oil-1").innerText());
  expect(card).toContain(flat(title));
  expect(card).not.toContain(flat(old));
  // 첫 화면 카드의 뉴스 한 줄 (F-E7 · D127) — 주제 이름 아래 · 제목 바로 위 · 글은 screen.json 그대로 · 표지와 같은 꼴 (굵게 · 바탕 띠) · 폰에서 한 줄 · 카드 안
  const oilCard = page.getByTestId("card-oil-1");
  const cardNews = oilCard.getByTestId("card-news");
  await expect(cardNews).toBeVisible();
  await expect(cardNews).toHaveText(OIL_SCREEN.news.t);
  const [brow, cn, ct, body] = await Promise.all([oilCard.locator(".hm-eyebrow").boundingBox(), cardNews.boundingBox(), oilCard.locator(".td-title").boundingBox(), oilCard.locator(".hm-body").boundingBox()]);
  expect(brow!.y + brow!.height, "카드: 뉴스 한 줄이 주제 이름 아래").toBeLessThanOrEqual(cn!.y);
  expect(cn!.y + cn!.height, "카드: 뉴스 한 줄이 제목 바로 위").toBeLessThanOrEqual(ct!.y);
  const cardLook = await newsLook(cardNews);
  expect(cardLook.weight, "카드: 굵게").toBeGreaterThanOrEqual(700);
  expect(cardLook.bg, "카드: 옅은 강조 바탕 띠").toBe(ACCENT_SOFT);
  expect(cardLook.lines, "카드: 폰에서 한 줄").toBe(1);
  expect(cardLook.right, "카드: 카드 칸 안").toBeLessThanOrEqual(body!.x + body!.width);
  // 다른 카드 (뉴스 한 줄 없는 이야기)에는 없다 — 뉴스 한 줄이 있는 이야기는 목록에서 (F-E8 — 지금은 기름값 하나 · 새 이야기가 screen.news 를 가져오면 그 카드에도)
  const withNews = LIST.all.filter((x) => x.news);
  expect(withNews.map((x) => x.id), "기름값은 뉴스 한 줄이 있는 이야기").toContain("card-oil-1");
  await expect(page.getByTestId("card-news"), "뉴스 한 줄은 그것이 있는 카드에만").toHaveCount(withNews.length);
  for (const x of withNews) expect(flat(await page.getByTestId(x.id).getByTestId("card-news").innerText()), `${x.id} 의 뉴스 한 줄`).toBe(flat(x.news!));
  await expect(page.locator(`.td-card${withNews.map((x) => `:not([data-testid="${x.id}"])`).join("")} .ep-news`), "다른 카드에는 뉴스 한 줄의 꼴이 없다").toHaveCount(0);

  // 표지 — 뉴스 한 줄이 제목 위에 · 제목은 회차 파일 그대로
  await page.getByTestId("card-oil-1").locator("a.td-main").click();
  await expect(page).toHaveURL(OIL.path);
  const root = page.locator(".ep-root");
  await expect(root).toHaveAttribute("data-scene", "cover");
  await expect(page.getByTestId("cover-news")).toHaveText(OIL_SCREEN.news.t);
  const [news, head] = await Promise.all([page.getByTestId("cover-news").boundingBox(), page.locator(".ep-title-cover").boundingBox()]);
  expect(news!.y + news!.height, "뉴스 한 줄이 제목 위에 있다 (겹치지 않는다)").toBeLessThanOrEqual(head!.y);
  // F-E7 (D127) — 눈에 띄게: 굵게 · 옅은 강조 바탕 띠 (종이 토큰) · 제목보다 작게 · 폰에서 한 줄 · 화면 안 · 카드의 것보다 크다
  const coverLook = await newsLook(page.getByTestId("cover-news"));
  const titleSize = await page.locator(".ep-title-cover").evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  expect(coverLook.weight, "표지: 굵게").toBeGreaterThanOrEqual(700);
  expect(coverLook.bg, "표지: 옅은 강조 바탕 띠").toBe(ACCENT_SOFT);
  expect(coverLook.size, "표지: 제목보다 작게").toBeLessThan(titleSize);
  expect(coverLook.size, "표지: 카드의 뉴스 한 줄보다 크게").toBeGreaterThan(cardLook.size);
  expect(coverLook.lines, "표지: 폰에서 한 줄").toBe(1);
  expect(coverLook.right, "표지: 화면 안").toBeLessThanOrEqual(390);
  expect(flat(await page.locator(".ep-title-cover").innerText())).toBe(flat(ep.scenes.cover.title));
  // 처음 온 독자의 길 — "지금까지의 이야기" (zero) 없이 표지 다음이 오늘의 사건이다. 장면 여섯
  expect(ep.assembly.new).toEqual(["cover", "event", "tools", "aha", "next", "keep"]);
  await expect(page.locator(".ep-count")).toHaveText("1/6");
  expect(await sceneText(page), "표지에 지금까지의 이야기 말이 없다").not.toContain(flat("지금까지의 이야기"));
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "event");
  await expect(page.locator(".ep-count")).toHaveText("2/6");
  await toAha(page);

  // 풀이 — 누르기 전: 멈춘 고리 (주유소)가 다른 고리와 같은 꼴이다. 꼬리표 · 그 앞의 점선 · 문서 문장이 없다 (답을 먼저 보이지 않는다 · D112)
  const chain = ep.solve.lab.frames.find((f: any) => f.kind === "chain");
  const stopped = chain.nodes.filter((n: any) => n.reach === "none");
  expect(stopped.map((n: any) => n.id)).toEqual(Object.keys(OIL_SCREEN.veil));
  const burstText = flat(OIL_SCREEN.burst.quote.t);
  for (const n of stopped) {
    const li = page.locator(`.fr-chain li[data-node="${n.id}"]`);
    await expect(li).toHaveAttribute("data-state", "idle");
    await expect(li.locator("em")).toHaveText(OIL_SCREEN.veil[n.id]);
    expect(await sceneText(page), `누르기 전에 꼬리표 "${n.still.t}" 가 없다`).not.toContain(flat(n.still.t));
  }
  await expect(page.locator('.fr-link[data-kind="open"]')).toHaveCount(0);
  await expect(page.getByTestId("burst")).toHaveCount(0);
  await expect(page.getByTestId("lab-gate")).toBeVisible();
  expect(await sceneText(page)).not.toContain(burstText);

  // 누른 뒤 — 꼬리표가 서고, 문서의 문장이 먼저 터진다. "뒤집어 보면" 상자는 없다
  await page.getByTestId("lab-act").click();
  await expect(page.getByTestId("burst")).toBeVisible({ timeout: 8000 });
  for (const n of stopped) {
    const li = page.locator(`.fr-chain li[data-node="${n.id}"]`);
    await expect(li).toHaveAttribute("data-state", "still");
    await expect(li.locator("em")).toHaveText(n.still.t);
  }
  await expect(page.getByTestId("burst").locator("figcaption")).toHaveText(OIL_SCREEN.burst.label);
  expect(flat(await page.getByTestId("burst").locator("blockquote").innerText())).toBe(burstText);
  expect(flat(await page.getByTestId("burst").innerText())).toContain(flat(OIL_SCREEN.burst.note));
  await expect(page.locator(".ep-flip")).toHaveCount(0);
  expect(await sceneText(page), "상자의 머리가 없다").not.toContain(flat(ep.solve.entry.flip.label));
  expect(await sceneText(page), "뒤집기의 풀이는 문장으로 남는다").toContain(flat(text(ep.solve.entry.flip.note)));

  // 근거 시트 — 터진 문장을 누르면 그 구절 (문서 글 그대로)과 문서 이름이 뜬다
  await page.getByTestId("src-toggle").click();
  await page.getByTestId("burst").locator(".ep-src-hit").click();
  const sheet = page.locator(".ep-sheet");
  const shown = (await sheet.locator("blockquote p").allInnerTexts()).map(flat);
  expect(shown).toEqual(OIL_SCREEN.burst.quote.src.map((k: string) => flat(ep.quotes[k].quote)));
  await expect(sheet.locator("cite").first()).toContainText(ep.docs[ep.quotes[OIL_SCREEN.burst.quote.src[0]].doc].name);
  await page.locator(".ep-sheet header button").click();
  await page.getByTestId("src-toggle").click();

  // 끝까지 — 이어짐 → 남음
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "next");
  await page.getByTestId("ask").click();
  await expect(root).toHaveAttribute("data-scene", "keep");
  await expect(page.locator(".ep-count")).toHaveText("6/6");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "가로로 넘치지 않는다").toBe(true);
  expect(errors).toEqual([]);
});

test("화면 칸 (뉴스 한 줄 · 고리 가림 · 문서 문장)은 기름값에만 선다 — 다른 실제 긴 이야기는 그대로: 뉴스 한 줄 없음 · 사슬의 멈춘 고리는 처음부터 제 꼬리표로 · 누른 뒤 \"뒤집어 보면\" 상자 그대로", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = errorsOf(page);
  for (const { path: href, ep } of LIVE.slice(1)) {
    await page.goto(href);
    await expect(page.locator(".ep-root")).toHaveAttribute("data-scene", "cover");
    await expect(page.getByTestId("cover-news"), href).toHaveCount(0);
    await expect(page.locator(".ep-news"), href).toHaveCount(0);
    await toAha(page);
    await expect(page.getByTestId("burst"), href).toHaveCount(0);
    // 사슬이 있는 이야기 (금리 2화) — 멈춘 고리가 누르기 전부터 제 꼬리표 (still)와 점선으로 선다 (가림 0 · D112 · UX-10 d 는 따로 묻는다)
    const chain = ep.solve.lab.frames.find((f: any) => f.kind === "chain");
    for (const n of chain?.nodes.filter((x: any) => x.reach === "none") ?? []) {
      const li = page.locator(`.fr-chain li[data-node="${n.id}"]`).first();
      await expect(li, `${href} ${n.id}`).toHaveAttribute("data-state", "still");
      await expect(li.locator("em")).toHaveText(n.still.t);
    }
    if (chain?.nodes.some((x: any) => x.reach === "none")) await expect(page.locator('.fr-link[data-kind="open"]').first(), href).toBeVisible();
    // 답을 열면 — "뒤집어 보면" 상자가 그대로 있고 문서 문장 칸은 없다
    await page.getByTestId("lab-gate-open").click();
    await expect(page.locator(".ep-flip"), href).toHaveCount(ep.solve.entry.flip ? 1 : 0);
    if (ep.solve.entry.flip) await expect(page.locator(".ep-flip figcaption")).toHaveText(ep.solve.entry.flip.label);
    await expect(page.getByTestId("burst"), href).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("번호가 있는 옛 링크 (/?r=) 는 옛 화면으로 넘어간다 — 번호는 그대로 따라간다", async ({ page }) => {
  await page.goto(`/?r=${READERS.robot}`);
  await expect(page).toHaveURL(`${OLD}?r=${READERS.robot}`);
  await page.locator(".study, .r-deck").first().waitFor();
});

for (const { path: href, ep, numbered, unpromised } of LIVE) {
  test(`${href} — ${ep.series.name} ${ep.scenes.cover.episode.t} (번호 ${numbered ? "보임" : "없음"}): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다`, async ({ page, request }) => {
    test.setTimeout(90_000);
    const html = await (await request.get(href)).text();
    expect(html).toContain(`<meta property="og:title" content="${ep.scenes.cover.title.replace(/\n/g, " ")}"`);
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
    // 번호는 제목에도 규칙대로 — 번호가 없는 이야기는 주제 이름만
    const title = /<title>([^<]*)<\/title>/.exec(html)![1]!;
    expect(title).toContain(ep.series.name);
    expect(/\d화/.test(title), `제목 "${title}"`).toBe(numbered);
    await page.goto(href);
    const root = page.locator(".ep-root");
    await expect(root).toHaveAttribute("data-reader", "new");
    await expect(page.locator(".ep-demo, [data-testid^=reader-], [data-testid=lab-plain], [data-testid=lab-seen]"), "시안의 것이 없다").toHaveCount(0);
    await expect(page.locator("[data-testid=bar-home]")).toHaveAttribute("href", "/");

    const scenes: string[] = ep.assembly.new;
    const c = ep.scenes;
    const want: Record<string, string[]> = {
      // 번호가 없는 이야기 — 표지에 시리즈 줄이 없고, 장면 머리는 번호를 뗀 나머지 글자 그대로다
      cover: [c.cover.title, text(c.cover.dek), text(c.cover.meta), text(c.cover.new_hint), c.cover.ask_new, ...(numbered ? ep.track.flatMap((e: any) => [e.no.t, e.title.t]) : [])],
      zero: [numbered ? text(c.zero.kicker) : unnumber(text(c.zero.kicker)), text(c.zero.title), ...c.zero.beats.flatMap((b: any) => [b.head, text(b.body)]), c.zero.ask],
      event: [numbered ? text(c.event.kicker) : unnumber(text(c.event.kicker)), c.event.title, text(c.event.lead), text(c.event.quote), ...c.event.riddle.map(text), c.event.ask],
      tools: [c.tools.kicker, c.tools.title_new, text(c.tools.sub_new), ...ep.pickup.tools.map((k: string) => ep.tools.find((x: any) => x.key === k).name), c.tools.ask],
      aha: [c.aha.kicker, ep.solve.lab.title, ...ep.solve.lab.setup.map(text)],
      next: [c.next.kicker, c.next.title, text(c.next.lead), ...c.next.coming.flatMap((n: any) => [n.head, text(n.body)]), c.next.ask],
      // 남음 — "다음 화" 예고는 번호를 보이는 시리즈에서만
      keep: [c.keep.kicker, c.keep.title, c.keep.line, ...(numbered ? [text(c.keep.next_body)] : [])],
    };
    for (const [i, scene] of scenes.entries()) {
      await expect(root).toHaveAttribute("data-scene", scene);
      await expect(page.locator(".ep-count")).toHaveText(`${i + 1}/${scenes.length}`);
      await expect(page.locator("[data-testid=ask], [data-testid=lab-gate], [data-testid=open-map]").first()).toBeVisible();
      // 앞 장면이 물러나는 동안에는 두 장면이 겹친다 — 이 장면의 첫 글이 보일 때까지 기다린 뒤 읽는다
      // (첫 글이 아니라 둘째 글 — 장면의 제목 — 을 기다린다: 번호를 뗀 머리 "지금까지의 이야기"는 표지의 글에도 들어 있다)
      await expect.poll(() => sceneText(page)).toContain(flat(want[scene]![1]!));
      const seen = await sceneText(page);
      for (const s of want[scene]!) expect(seen, `${scene}: ${s}`).toContain(flat(s));
      // 번호 화면 규칙 — 번호 글 (표지의 "N화" · 시리즈 줄 · 장면 머리 · 위쪽 줄)
      if (scene === "cover") {
        await expect(page.getByTestId("cover-no")).toHaveText(numbered ? text(c.cover.episode) : "긴 이야기");
        await expect(page.locator(".ep-scene .ep-track")).toHaveCount(numbered ? 1 : 0);
        await expect(page.locator(".ep-series span")).toHaveText(numbered ? "시리즈" : "주제");
      }
      if (["cover", "zero", "event"].includes(scene)) expect(/\d화/.test(`${await page.locator(".ep-bar-title").innerText()} ${await page.locator(".ep-scene").innerText()}`), `${scene}: 번호 글`).toBe(numbered);
      if (scene === "keep") await expect(page.locator(".ep-nextup")).toHaveCount(numbered ? 1 : 0);
      // 이어짐 — 공통 화면 말 "다음 회차가 될 일들"은 다음 화를 약속하지 않는 이야기에서만 "남은 일들"로 선다 (F-E5). 다른 이야기는 파일의 말 그대로
      if (scene === "next") {
        await expect(page.locator(".ep-scene h2.ep-sub")).toHaveText(unpromised ? "남은 일들" : c.next.coming_label);
        if (unpromised) expect(seen, "다음 회차를 약속하지 않는다").not.toContain(flat(c.next.coming_label));
      }
      // 남음의 작은 지도 — 다음 화 개념 (ghosts)
      if (scene === "keep") await expect(page.locator(".ep-keep-map .ep-node[data-state=ghost]")).toHaveCount(unpromised ? 0 : ep.map.ghosts.length);
      if (scene === "cover") {
        // 근거 — 켜면 근거가 있는 문장을 누를 수 있고, 누르면 원문 구절이 뜬다
        await page.locator("[data-testid=src-toggle]").click();
        await page.locator(".ep-src-hit").first().click();
        const sheet = page.getByRole("dialog");
        const quotes = Object.values(ep.quotes).map((q: any) => flat(q.quote));
        expect(quotes).toContain(flat(await sheet.locator("blockquote p").first().innerText()));
        await sheet.getByRole("button").click();
        await page.locator("[data-testid=src-toggle]").click();
      }
      if (scene === "aha") {
        // 답 감추기 (UX-6) — 체험을 마치기 전에는 아래가 접혀 있다. 그냥 열어 보기로 연다
        await expect(page.locator("[data-testid=ask]")).toHaveCount(0);
        await page.locator("[data-testid=lab-gate-open]").click();
        const opened = await sceneText(page);
        for (const s of [c.aha.real_label, ...c.aha.real.flatMap((r: any) => [text(r.head), text(r.body)]), text(c.aha.verdict), text(ep.solve.entry.whose)]) expect(opened, `aha (연 뒤): ${s}`).toContain(flat(s));
      }
      if (scene !== "keep") await page.locator("[data-testid=ask]").click();
    }
    // 남음 — 다른 시리즈로 가는 길은 실제 주소다 · 지도 · 첫 화면으로
    const others = LIVE.filter((x) => x.path !== href);
    for (const o of others) {
      const link = page.locator(`[data-testid=other-${o.ep.series.code}]`);
      await expect(link).toHaveAttribute("href", o.path);
      expect(/\d화/.test(await link.innerText()), `다른 시리즈 ${o.ep.series.code} 의 번호`).toBe(o.numbered);
    }
    // 곁의 짧은 이야기로 가는 길이 없다 — 한 사건 = 이야기 하나 (D91 ①). 개인정보 (병원 짧은 이야기의 곁)에도 없다
    await expect(page.locator("[data-testid^=beside-]")).toHaveCount(0);
    expect(flat(await sceneText(page))).not.toContain(flat(GONE.scenes.cover.title));
    await expect(page.locator("[data-testid=home-link]")).toHaveAttribute("href", "/");
    await page.locator("[data-testid=open-map]").click();
    const map = page.locator("[data-testid=map-view]");
    await expect(map).toBeVisible();
    for (const o of others) await expect(map.locator(`[data-testid=shelf-${o.ep.series.code}]`)).toHaveAttribute("href", o.path);
    expect(/\d화/.test(await map.locator("[data-testid=shelf] li[data-here]").innerText()), "책장의 지금 읽는 이야기").toBe(numbered);
    // 지도의 "다음 화 개념" — 약속하지 않는 이야기에는 점도 선도 범례의 칸도 이름도 없다. 다른 이야기는 그대로다
    const legend = await map.locator(".ep-map-legend").innerText();
    await expect(map.locator(".ep-node[data-state=ghost]")).toHaveCount(unpromised ? 0 : ep.map.ghosts.length);
    await expect(map.locator(".ep-edge[data-kind=ghost]")).toHaveCount(unpromised ? 0 : ep.map.ghosts.length);
    if (unpromised) {
      expect(legend).not.toMatch(/다음 화에서|아직 안 주운 것/);
      for (const g of ep.map.ghosts) expect(await map.innerText(), `지도의 ghost "${g.name}"`).not.toContain(g.name);
    } else expect(legend).toContain(numbered ? "다음 화에서" : "아직 안 주운 것");
  });
}

for (const { story: S } of SHORTS) {
  const S_PATH = `/short/${S.code}`;
  test(`${S_PATH} — 짧은 이야기 (홀로 선다): 장면 넷 · 파일의 글 그대로 · 근거 구절 · 번호 없음 · 곁 이야기 길 없음 · 도구 · 지도 없음 · 첫 화면은 실제 주소 · 시안의 것이 없다 · ${GONE_PATH} 는 404`, async ({ page, request }) => {
    // 홀로 선 짧은 이야기다 — 곁 이야기 · 가리킨 도구가 없다 (D88 E-21 → P-S1 이 `| null` 로 연 칸). 그 칸에 딸린 글도 없다
    expect(S.sibling).toBeNull();
    expect(S.tools_from).toBeNull();
    expect([S.scenes.why.tool_lead, S.scenes.keep.map_note, S.scenes.keep.gain_label]).toEqual([null, null, null]);
    // 내린 병원 짧은 이야기 — 주소가 없다 (골든은 그대로)
    expect((await request.get(GONE_PATH)).status(), GONE_PATH).toBe(404);
    const html = await (await request.get(S_PATH)).text();
    expect(html).toContain(`<meta property="og:title" content="${S.scenes.cover.title.replace(/\n/g, " ")}"`);
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
    expect(/<title>([^<]*)<\/title>/.exec(html)![1]).not.toMatch(/\d화/);
    await page.goto(S_PATH);
    const root = page.getByTestId("short");
    await expect(page.locator(".ep-demo, [data-testid=palette-dock]"), "시안의 것이 없다").toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
    await expect(page.getByTestId("bar-home")).toHaveAttribute("href", "/");
    await expect(page.locator(".ep-track"), "시리즈 줄이 없다").toHaveCount(0);
    await expect(page.getByTestId("map-button"), "지도 단추가 없다 (만날 도구가 없다)").toHaveCount(0);
    const c = S.scenes;
    const e = S.solve.entry;
    // 장면 넷의 글 — 파일 그대로. 둘째 칸 (장면의 제목)이 보일 때까지 기다린 뒤 읽는다 (앞 장면이 물러나는 동안)
    const want: Record<string, string[]> = {
      cover: [S.series.name, c.cover.title, text(c.cover.dek), text(c.cover.meta), text(c.cover.hint), c.cover.ask, "짧은 이야기"],
      where: [c.where.kicker, S.solve.plain.title, text(e.first_thought), text(e.breaker), ...c.where.body.map(text), e.flip.label, e.flip.a, e.flip.op, e.flip.b, text(e.flip.note), text(c.where.unknown), c.where.ask],
      why: [c.why.kicker, c.why.title, text(c.why.lead), c.why.real_label, ...c.why.real.flatMap((r: any) => [text(r.head), text(r.body)]), text(c.why.verdict), text(e.whose), c.why.ask],
      keep: [c.keep.kicker, c.keep.title, c.keep.line, c.keep.advice_label, text(c.keep.advice)],
    };
    const scenes = Object.keys(want);
    for (const [i, scene] of scenes.entries()) {
      await expect(root).toHaveAttribute("data-scene", scene);
      await expect(page.locator(".ep-count")).toHaveText(`${i + 1}/${scenes.length}`);
      await expect.poll(() => sceneText(page)).toContain(flat(want[scene]![1]!));
      const seen = await sceneText(page);
      for (const s of want[scene]!) expect(seen, `${scene}: ${s}`).toContain(flat(s));
      expect(`${await page.locator(".ep-bar-title").innerText()} ${await page.locator(".ep-scene").innerText()}`, `${scene}: 번호가 없다`).not.toMatch(/\d화/);
      if (scene === "where") {
        // 근거 — 켜고 뒤집기의 깨는 사실을 누르면 원문 구절이 뜬다 (이 이야기의 구절 · 문서 이름)
        await page.getByTestId("src-toggle").click();
        await page.locator(".pl-thought[data-kind=breaker] .ep-src-hit").click();
        const sheet = page.locator(".ep-sheet");
        const quoted = (await sheet.locator("blockquote p").allInnerTexts()).map(flat);
        expect(quoted).toEqual(e.breaker.src.map((k: string) => flat(S.quotes[k].quote)));
        await expect(sheet.locator("cite").first()).toHaveText(S.docs[S.quotes[e.breaker.src[0]].doc].name);
        // F-E5 — 이탈리아 감독기구의 문서는 "출처를 밝히고 글을 바꾸지 않으면" 다시 쓸 수 있다 (D109) → 시트에 기관 이름 · 문서 이름 · 주소가 보이고, 구절은 영어 원문 그대로다
        if (S.code === META.code) {
          const cite = await sheet.locator("cite").first().innerText();
          for (const want of ["Garante per la protezione dei dati personali", "The Garante has fined Meta Platforms Ireland Limited 805 million euros", "https://www.garanteprivacy.it/"]) expect(cite, want).toContain(want);
          for (const q of await sheet.locator("blockquote p").allInnerTexts()) expect(q, "구절은 영어 원문 그대로").not.toMatch(/[가-힣]/);
        }
        await page.locator(".ep-sheet header button").click();
        await page.getByTestId("src-toggle").click();
      }
      if (scene === "why") {
        // 근거 — 본문의 첫 문장을 누르면 그 문장의 구절이 뜬다 · 도구가 없다 (가리킨 긴 이야기가 없다)
        await page.getByTestId("src-toggle").click();
        await page.locator(".ep-src-hit").first().click();
        const quotes = Object.values(S.quotes).map((q: any) => flat(q.quote));
        expect(quotes).toContain(flat(await page.locator(".ep-sheet blockquote p").first().innerText()));
        await page.locator(".ep-sheet header button").click();
        await page.getByTestId("src-toggle").click();
        await expect(page.locator(".ep-tools, .ep-tool-lead, [data-testid^=tool-]"), "도구가 없다").toHaveCount(0);
      }
      if (scene !== "keep") await page.getByTestId("ask").click();
    }
    await expect(page.getByTestId("ask"), "마지막 장 — 물음도 다음 화 예고도 없다").toHaveCount(0);
    await expect(page.locator(".ep-nextup")).toHaveCount(0);
    // 남음 — 지도 · 만난 개념 · 곁 이야기 길이 없다 · 첫 화면은 실제 주소
    await expect(page.locator(".ep-keep-map, .ep-gain, [data-testid=open-map], [data-testid^=node-]"), "지도 · 만난 개념이 없다").toHaveCount(0);
    await expect(page.getByTestId("sibling"), "곁 이야기 길이 없다").toHaveCount(0);
    await expect(page.locator(".ep-scene .ep-other")).toHaveCount(0);
    await expect(page.getByTestId("to-today")).toHaveAttribute("href", "/");
  });
}

test("시안 주소는 그대로 시안이다 — 같은 부품 · 시안 띠 · 시안 주소끼리 오간다. 실제 주소에 없는 것 (파이프라인 시험판 · 견본)은 /s 에 없다", async ({ page, request }) => {
  await page.goto("/lab/episode/fomc");
  await expect(page.locator(".ep-demo").first()).toBeVisible();
  await expect(page.locator("[data-testid=switch-price]")).toHaveAttribute("href", "/lab/episode");
  await expect(page.locator("[data-testid=bar-home]")).toHaveCount(0);
  // 시안의 "오늘" · 짧은 이야기는 시안 주소끼리 오간다 (실제 화면과 같은 부품 — 색 스위치가 얹힌다)
  await page.goto("/lab/today/short");
  await expect(page.getByTestId("palette-dock")).toBeVisible();
  await expect(page.getByTestId("bar-home")).toHaveAttribute("href", "/lab/today");
  for (const p of ["/s/rate/3", "/s/rate/1", "/s/fomc-auto/1", "/s/price/2", "/s/carry/1", "/short/nope", "/short/pipc", GONE_PATH, `/s/privacy/${GONE.code}`, `/s/${SHORT.series.code}/1`]) expect((await request.get(p)).status(), p).toBe(404);
});
