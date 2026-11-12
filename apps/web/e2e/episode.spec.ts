// 실제 주소의 회차 형식 (F-E1 · D76) — 첫 화면 `/` · 회차 셋 `/s/<시리즈>/<n>` · 옛 화면으로 넘어가는 번호 링크.
// 회차의 글은 골든 픽스처 (fixtures/episode-*.json)에서 읽어 화면과 대 본다 — 화면이 골든의 글자 그대로를 보인다.
// 실제 화면에는 시안의 것 (맨 위 띠 · 독자 스위치 · 풀이 스위치)이 없고, 독자는 처음 온 독자의 조립을 받는다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { READERS } from "./readers";
import { OLD } from "./reader";

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const golden = (name: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../fixtures", `episode-${name}.json`), "utf8"));
const LIVE = [
  { path: "/s/price/1", ep: golden("price-1") },
  { path: "/s/rate/2", ep: golden("rate-2") },
  { path: "/s/privacy/1", ep: golden("privacy-1") },
];
/** 빈칸 · 줄바꿈 · 굵게 표시 (**) 를 빼고 견준다 — 글자는 그대로 */
const flat = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, "");
const text = (v: string | { t: string }) => (typeof v === "string" ? v : v.t);
const sceneText = async (page: Page) => flat(await page.locator(".ep-scene").innerText());

test.use(PHONE);

test("첫 화면 — 종이 톤 · 시리즈 셋 · 오늘의 회차 (가장 최근 발표) · 옛 화면이 아니다", async ({ page, request }) => {
  const res = await page.goto("/");
  expect(res!.status()).toBe(200);
  await expect(page.locator(".r-deck"), "옛 화면 (B5)이 아니다").toHaveCount(0);
  await expect(page.locator(".ep-demo"), "시안 띠가 없다").toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(244, 238, 227)");
  const body = flat(await page.locator("[data-testid=home]").innerText());
  for (const { path: href, ep } of LIVE) {
    const card = page.locator(`[data-testid=series-${ep.series.code}]`);
    await expect(card).toHaveAttribute("href", href);
    for (const s of [ep.series.name, ep.series.sub, ...ep.track.flatMap((e: any) => [e.no.t, e.title.t])]) expect(flat(await card.innerText()), s).toContain(flat(s));
    expect(body).toContain(flat(ep.scenes.cover.title));
  }
  // 오늘의 회차 — 배달앱 1화 (11월 9일 발표 — 셋 가운데 가장 늦다). 표지의 글 그대로
  const today = LIVE[0]!;
  const card = page.locator("[data-testid=today]");
  await expect(card).toHaveAttribute("href", today.path);
  for (const k of ["title", "dek", "meta", "episode"]) expect(flat(await card.innerText()), k).toContain(flat(text(today.ep.scenes.cover[k])));
  // 공유했을 때 보이는 것 · 검색은 그대로 막는다
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<meta property="og:title" content="Claro — [^"]+"/);
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
  await card.click();
  await expect(page).toHaveURL(today.path);
});

test("번호가 있는 옛 링크 (/?r=) 는 옛 화면으로 넘어간다 — 번호는 그대로 따라간다", async ({ page }) => {
  await page.goto(`/?r=${READERS.robot}`);
  await expect(page).toHaveURL(`${OLD}?r=${READERS.robot}`);
  await page.locator(".study, .r-deck").first().waitFor();
});

for (const { path: href, ep } of LIVE) {
  test(`${href} — ${ep.series.name} ${ep.scenes.cover.episode.t}: 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 시안의 것이 없다`, async ({ page, request }) => {
    test.setTimeout(90_000);
    const html = await (await request.get(href)).text();
    expect(html).toContain(`<meta property="og:title" content="${ep.scenes.cover.title.replace(/\n/g, " ")}"`);
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
    await page.goto(href);
    const root = page.locator(".ep-root");
    await expect(root).toHaveAttribute("data-reader", "new");
    await expect(page.locator(".ep-demo, [data-testid^=reader-], [data-testid=lab-plain], [data-testid=lab-seen]"), "시안의 것이 없다").toHaveCount(0);
    await expect(page.locator("[data-testid=bar-home]")).toHaveAttribute("href", "/");

    const scenes: string[] = ep.assembly.new;
    const c = ep.scenes;
    const want: Record<string, string[]> = {
      cover: [c.cover.title, text(c.cover.dek), text(c.cover.meta), text(c.cover.new_hint), c.cover.ask_new, ...ep.track.map((e: any) => e.title.t)],
      zero: [text(c.zero.kicker), text(c.zero.title), ...c.zero.beats.flatMap((b: any) => [b.head, text(b.body)]), c.zero.ask],
      event: [text(c.event.kicker), c.event.title, text(c.event.lead), text(c.event.quote), ...c.event.riddle.map(text), c.event.ask],
      tools: [c.tools.kicker, c.tools.title_new, text(c.tools.sub_new), ...ep.pickup.tools.map((k: string) => ep.tools.find((x: any) => x.key === k).name), c.tools.ask],
      aha: [c.aha.kicker, ep.solve.lab.title, ...ep.solve.lab.setup.map(text)],
      next: [c.next.kicker, c.next.title, text(c.next.lead), ...c.next.coming.flatMap((n: any) => [n.head, text(n.body)]), c.next.ask],
      keep: [c.keep.kicker, c.keep.title, c.keep.line, text(c.keep.next_body)],
    };
    for (const [i, scene] of scenes.entries()) {
      await expect(root).toHaveAttribute("data-scene", scene);
      await expect(page.locator(".ep-count")).toHaveText(`${i + 1}/${scenes.length}`);
      await expect(page.locator("[data-testid=ask], [data-testid=lab-gate], [data-testid=open-map]").first()).toBeVisible();
      // 앞 장면이 물러나는 동안에는 두 장면이 겹친다 — 이 장면의 첫 글이 보일 때까지 기다린 뒤 읽는다
      await expect.poll(() => sceneText(page)).toContain(flat(want[scene]![0]!));
      const seen = await sceneText(page);
      for (const s of want[scene]!) expect(seen, `${scene}: ${s}`).toContain(flat(s));
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
    for (const o of others) await expect(page.locator(`[data-testid=other-${o.ep.series.code}]`)).toHaveAttribute("href", o.path);
    await expect(page.locator("[data-testid=home-link]")).toHaveAttribute("href", "/");
    await page.locator("[data-testid=open-map]").click();
    const map = page.locator("[data-testid=map-view]");
    await expect(map).toBeVisible();
    for (const o of others) await expect(map.locator(`[data-testid=shelf-${o.ep.series.code}]`)).toHaveAttribute("href", o.path);
  });
}

test("시안 주소는 그대로 시안이다 — 같은 부품 · 시안 띠 · 시안 주소끼리 오간다. 실제 주소에 없는 것 (파이프라인 시험판 · 견본)은 /s 에 없다", async ({ page, request }) => {
  await page.goto("/lab/episode/fomc");
  await expect(page.locator(".ep-demo").first()).toBeVisible();
  await expect(page.locator("[data-testid=switch-price]")).toHaveAttribute("href", "/lab/episode");
  await expect(page.locator("[data-testid=bar-home]")).toHaveCount(0);
  for (const p of ["/s/rate/3", "/s/rate/1", "/s/fomc-auto/1", "/s/price/2", "/s/carry/1"]) expect((await request.get(p)).status(), p).toBe(404);
});
