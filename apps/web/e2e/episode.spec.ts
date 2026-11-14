// 실제 주소 (F-E1 · D76 → F-E2 · D86 · D88) — 첫 화면 `/` = "오늘" · 긴 이야기 셋 `/s/<시리즈>/<n>` · 짧은 이야기 `/short/<code>` · 개념 지도 `/map` · 옛 화면으로 넘어가는 번호 링크.
// 회차의 글은 골든 픽스처 (fixtures/episode-*.json)에서 읽어 화면과 대 본다 — 화면이 골든의 글자 그대로를 보인다.
// 실제 화면에는 시안의 것 (맨 위 띠 · 독자 스위치 · 풀이 스위치)이 없고, 독자는 처음 온 독자의 조립을 받는다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { READERS } from "./readers";
import { OLD } from "./reader";

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const golden = (name: string) => JSON.parse(readFileSync(path.join(import.meta.dirname, "../../../fixtures", `episode-${name}.json`), "utf8"));
// numbered — 번호 화면 규칙 (D88 E-20): 같은 시리즈에 긴 이야기가 둘 이상 실제로 있을 때만 "N화" · 시리즈 줄 · "다음 화"가 보인다. 지금은 금리뿐이다 (2화 — 첫째가 있었다)
// tags — 국내 / 해외 · 카테고리 (목록에 손으로 적은 값 — episode/catalog.tsx)
const LIVE = [
  { path: "/s/price/1", ep: golden("price-1"), code: "delivery", numbered: false, tags: ["국내", "기술"] },
  { path: "/s/rate/2", ep: golden("rate-2"), code: "fomc", numbered: true, tags: ["해외", "돈"] },
  { path: "/s/privacy/1", ep: golden("privacy-1"), code: "pipc", numbered: false, tags: ["국내", "기술"] },
];
const SHORT = golden("short-privacy-yeonghun");
const SHORT_PATH = `/short/${SHORT.code}`;
/** 장면 머리의 번호를 뗀 것 — "1화 · 오늘의 사건" → "오늘의 사건". 남은 글자는 골든 그대로다 */
const unnumber = (t: string) => t.replace(/^\d+화(와 \d+화)* · /, "");
/** 빈칸 · 줄바꿈 · 굵게 표시 (**) 를 빼고 견준다 — 글자는 그대로 */
const flat = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, "");
const text = (v: string | { t: string }) => (typeof v === "string" ? v : v.t);
const sceneText = async (page: Page) => flat(await page.locator(".ep-scene").innerText());

test.use(PHONE);

test("첫 화면 = 오늘 — 종이 톤 · 이야기 넷 (긴 셋 + 짧은 하나 · 골든의 글 그대로) · 번호는 금리에만 · 시안의 것이 없다 · 머리가 날짜를 속이지 않는다", async ({ page, request }) => {
  const res = await page.goto("/");
  expect(res!.status()).toBe(200);
  await expect(page.locator(".r-deck"), "옛 화면 (B5)이 아니다").toHaveCount(0);
  await expect(page.locator(".ep-demo, [data-testid=palette-dock], [data-testid=card-empty]"), "시안 띠 · 색 스위치 · 견본 자리가 없다").toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(244, 238, 227)");
  // 머리 — 낸 날이 적힌 이야기가 없다 (지금의 넷은 아침 고르기로 낸 것이 아니다) → "오늘의 이야기"라고 하지 않는다
  await expect(page.getByTestId("head")).toHaveText("최근 이야기");
  await expect(page.getByTestId("head")).not.toHaveAttribute("data-day", /.*/);
  expect(await page.getByTestId("home").innerText()).not.toContain("오늘의 이야기");

  // 긴 이야기 셋 — 카드의 글은 골든 그대로 · 주소는 실제 주소 · 번호 · 지난 이야기는 번호 화면 규칙을 지난 것 (금리)에만
  for (const { path: href, ep, code, numbered, tags } of LIVE) {
    const card = page.getByTestId(`card-${code}`);
    await expect(card.locator("a.td-main")).toHaveAttribute("href", href);
    const seen = flat(await card.innerText());
    for (const s of [ep.series.name, ep.scenes.cover.title, ep.scenes.cover.dek.t, ep.scenes.cover.meta.t, ...tags, "긴 이야기", "체험 있음"]) expect(seen, s).toContain(flat(s));
    expect(/\d화/.test(await card.innerText()), `${code} 의 번호`).toBe(numbered);
    await expect(page.getByTestId(`recap-${code}`)).toHaveCount(numbered ? 1 : 0);
  }
  await page.getByTestId("recap-fomc").locator("summary").click();
  for (const r of LIVE[1]!.ep.scenes.cover.recap) expect(flat(await page.getByTestId("recap-fomc").innerText())).toContain(flat(r.t));
  // 짧은 이야기 — 얇은 카드 · 번호 없음 · 제 주소
  const short = page.getByTestId(`card-${SHORT.code}`);
  await expect(short.locator("a.td-main")).toHaveAttribute("href", SHORT_PATH);
  for (const s of [SHORT.series.name, SHORT.scenes.cover.title, SHORT.scenes.cover.meta.t, "국내", "기술", "짧은 이야기", "체험 없음"]) expect(flat(await short.innerText()), s).toContain(flat(s));
  expect(await short.innerText()).not.toMatch(/\d화/);
  // 차례 — 목록의 차례 그대로 · 맨 위가 큰 카드
  expect(await page.locator(".td-list .td-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")))).toEqual(["card-delivery", "card-fomc", "card-pipc", `card-${SHORT.code}`, "card-license-notice"]);
  await expect(page.locator(".td-card[data-lead]")).toHaveCount(1);
  await expect(page.getByTestId("card-delivery")).toHaveAttribute("data-lead", "");
  // 읽는 시간을 내지 않는다 (D82)
  expect(await page.getByTestId("home").innerText()).not.toMatch(/\d+\s*분/);
  // 이어지는 이야기 — 금리만. 시리즈 줄은 골든의 track (지나온 화 · 지금 — "다음 화" 칸은 줄에 없다) · 예고는 날짜가 있는 것
  await expect(page.locator("[data-testid^=cont-]")).toHaveCount(1);
  const cont = page.getByTestId("cont-rate");
  await expect(cont).toHaveAttribute("href", "/s/rate/2");
  const track = LIVE[1]!.ep.track.filter((e: any) => e.state !== "next");
  await expect(cont.locator(".ep-track li")).toHaveCount(track.length);
  for (const s of [...track.flatMap((e: any) => [e.no.t, e.title.t]), LIVE[1]!.ep.scenes.next.coming[0].body.t]) expect(flat(await cont.innerText()), s).toContain(flat(s));
  // 공유했을 때 보이는 것 · 검색은 그대로 막는다
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<meta property="og:title" content="Claro — [^"]+"/);
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
  // 개념 지도로 가는 길 — 주제마다 한 장 · 첫 화면으로 돌아온다
  await page.getByTestId("to-map").click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByTestId("concept-map")).toHaveCount(3);
  await expect(page.getByTestId("palette-dock")).toHaveCount(0);
  await page.locator("a.ep-back").click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByTestId("card-delivery").locator("a.td-main").click();
  await expect(page).toHaveURL(LIVE[0]!.path);
});

test("번호가 있는 옛 링크 (/?r=) 는 옛 화면으로 넘어간다 — 번호는 그대로 따라간다", async ({ page }) => {
  await page.goto(`/?r=${READERS.robot}`);
  await expect(page).toHaveURL(`${OLD}?r=${READERS.robot}`);
  await page.locator(".study, .r-deck").first().waitFor();
});

for (const { path: href, ep, numbered } of LIVE) {
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
    // 곁의 짧은 이야기로 가는 길 — 같은 발표의 긴 이야기 (개인정보)에만
    await expect(page.getByTestId(`beside-${SHORT.code}`)).toHaveCount(ep.episode_id === SHORT.sibling.episode.episode_id ? 1 : 0);
    if (ep.episode_id === SHORT.sibling.episode.episode_id) await expect(page.getByTestId(`beside-${SHORT.code}`)).toHaveAttribute("href", SHORT_PATH);
    await expect(page.locator("[data-testid=home-link]")).toHaveAttribute("href", "/");
    await page.locator("[data-testid=open-map]").click();
    const map = page.locator("[data-testid=map-view]");
    await expect(map).toBeVisible();
    for (const o of others) await expect(map.locator(`[data-testid=shelf-${o.ep.series.code}]`)).toHaveAttribute("href", o.path);
    expect(/\d화/.test(await map.locator("[data-testid=shelf] li[data-here]").innerText()), "책장의 지금 읽는 이야기").toBe(numbered);
    expect(await map.locator(".ep-map-legend").innerText()).toContain(numbered ? "다음 화에서" : "아직 안 주운 것");
  });
}

test(`${SHORT_PATH} — 짧은 이야기: 장면 넷 · 골든의 글 그대로 · 번호 없음 · 곁 이야기 · 첫 화면은 실제 주소 · 시안의 것이 없다`, async ({ page, request }) => {
  const html = await (await request.get(SHORT_PATH)).text();
  expect(html).toContain(`<meta property="og:title" content="${SHORT.scenes.cover.title.replace(/\n/g, " ")}"`);
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow[^"]*"/);
  expect(/<title>([^<]*)<\/title>/.exec(html)![1]).not.toMatch(/\d화/);
  await page.goto(SHORT_PATH);
  const root = page.getByTestId("short");
  await expect(page.locator(".ep-demo, [data-testid=palette-dock]"), "시안의 것이 없다").toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-palette", /.*/);
  await expect(page.getByTestId("bar-home")).toHaveAttribute("href", "/");
  await expect(page.locator(".ep-track"), "시리즈 줄이 없다").toHaveCount(0);
  const c = SHORT.scenes;
  const e = SHORT.solve.entry;
  const want: Record<string, string[]> = {
    cover: [SHORT.series.name, c.cover.title, text(c.cover.dek), text(c.cover.meta), text(c.cover.hint), c.cover.ask],
    where: [c.where.kicker, SHORT.solve.plain.title, text(e.first_thought), text(e.breaker), ...c.where.body.map(text), e.flip.label, e.flip.a, e.flip.op, e.flip.b, text(e.flip.note), text(c.where.unknown), c.where.ask],
    why: [c.why.kicker, c.why.title, text(c.why.lead), c.why.real_label, ...c.why.real.flatMap((r: any) => [text(r.head), text(r.body)]), text(c.why.verdict), c.why.tool_lead, text(e.whose), c.why.ask],
    keep: [c.keep.kicker, c.keep.title, c.keep.line, c.keep.advice_label, text(c.keep.advice), c.keep.gain_label, c.keep.map_note, SHORT.sibling.label, SHORT.sibling.note],
  };
  const scenes = Object.keys(want);
  for (const [i, scene] of scenes.entries()) {
    await expect(root).toHaveAttribute("data-scene", scene);
    await expect(page.locator(".ep-count")).toHaveText(`${i + 1}/${scenes.length}`);
    await expect.poll(() => sceneText(page)).toContain(flat(want[scene]![0]!));
    const seen = await sceneText(page);
    for (const s of want[scene]!) expect(seen, `${scene}: ${s}`).toContain(flat(s));
    expect(`${await page.locator(".ep-bar-title").innerText()} ${await page.locator(".ep-scene").innerText()}`, `${scene}: 번호가 없다`).not.toMatch(/\d화/);
    if (scene === "why") {
      // 근거 — 켜고 접힌 도구 아닌 본문의 문장을 누르면 원문 구절이 뜬다 (이 이야기의 구절)
      await page.getByTestId("src-toggle").click();
      await page.locator(".ep-src-hit").first().click();
      const quotes = Object.values(SHORT.quotes).map((q: any) => flat(q.quote));
      expect(quotes).toContain(flat(await page.locator(".ep-sheet blockquote p").first().innerText()));
      await page.locator(".ep-sheet header button").click();
      await page.getByTestId("src-toggle").click();
      // 긴 이야기와 같은 도구 — 접힌 카드 셋 (가리킨 긴 이야기의 카드 그대로)
      for (const id of SHORT.tools_from.keys) await expect(page.getByTestId(`tool-${id}`)).toBeVisible();
    }
    if (scene !== "keep") await page.getByTestId("ask").click();
  }
  await expect(page.getByTestId("ask"), "마지막 장 — 물음도 다음 화 예고도 없다").toHaveCount(0);
  await expect(page.locator(".ep-nextup")).toHaveCount(0);
  // 지도 — 만난 도구만 켜진다 · 곁 이야기 · 첫 화면은 실제 주소
  for (const id of SHORT.tools_from.keys) await expect(page.getByTestId(`node-${id}`).first()).toBeVisible();
  await expect(page.getByTestId("sibling")).toHaveAttribute("href", "/s/privacy/1");
  await expect(page.getByTestId("to-today")).toHaveAttribute("href", "/");
  expect(await sceneText(page)).toContain(flat("이 지도는 아직 저장되지 않아요"));
});

test("시안 주소는 그대로 시안이다 — 같은 부품 · 시안 띠 · 시안 주소끼리 오간다. 실제 주소에 없는 것 (파이프라인 시험판 · 견본)은 /s 에 없다", async ({ page, request }) => {
  await page.goto("/lab/episode/fomc");
  await expect(page.locator(".ep-demo").first()).toBeVisible();
  await expect(page.locator("[data-testid=switch-price]")).toHaveAttribute("href", "/lab/episode");
  await expect(page.locator("[data-testid=bar-home]")).toHaveCount(0);
  // 시안의 "오늘" · 짧은 이야기는 시안 주소끼리 오간다 (실제 화면과 같은 부품 — 색 스위치가 얹힌다)
  await page.goto("/lab/today/short");
  await expect(page.getByTestId("palette-dock")).toBeVisible();
  await expect(page.getByTestId("bar-home")).toHaveAttribute("href", "/lab/today");
  for (const p of ["/s/rate/3", "/s/rate/1", "/s/fomc-auto/1", "/s/price/2", "/s/carry/1", "/short/nope", "/short/pipc", `/s/privacy/${SHORT.code}`]) expect((await request.get(p)).status(), p).toBe(404);
});
