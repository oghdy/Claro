// 본 화면(/) 공용 — 독자처럼 움직인다: 물음 버튼을 눌러 앞으로, "지나온 길"로 뒤로. 쓸어서는 넘어가지 않는다 (D26)
import type { CDPSession, Page } from "@playwright/test";
import type { UnitBlock, UnitSlide } from "./golden";

export const NAMES: Record<string, string> = { basic: "입문", intermediate: "중급", advanced: "숙련" };
export const MOBILE_SE = { width: 375, height: 667 };
export const MOBILE_X = { width: 375, height: 812 };
export const DESKTOP = { width: 1440, height: 900 };

export const card = (page: Page, i: number) => page.locator(`.r-card[data-slide-index="${i}"]`);
export const count = (page: Page) => page.locator(".r-count");

export async function openLevel(page: Page, level: string) {
  await page.goto("/");
  if (level !== "basic") await page.getByRole("button", { name: NAMES[level], exact: true }).click();
  await page.locator(`.r-deck[data-level="${level}"]`).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** 전환이 끝났다 — 지금 장만 보이고, 올라오던 물음 · 물러나던 글에 남은 것이 없다 */
export async function settled(page: Page, i: number) {
  await page.waitForFunction((i) => {
    const c = document.querySelector<HTMLElement>(`.r-card[data-slide-index="${i}"]`);
    return !!c && c.hasAttribute("data-active") && !document.querySelector(".r-card[data-leaving], .r-deck[data-moving]");
  }, i);
}

/** i 장의 끝자리가 나올 때까지 손가락으로 내린다 (긴 장). 내린 횟수를 돌려준다 */
export async function readToEnd(page: Page, cdp: CDPSession, i: number, onStep?: () => Promise<unknown>): Promise<number> {
  let swipes = 0;
  for (; swipes < 20; swipes++) {
    await onStep?.();
    if (await card(page, i).evaluate((c) => c.hasAttribute("data-ended") && c.scrollTop + c.clientHeight >= c.scrollHeight - 1)) break;
    await swipe(cdp, { dy: 260 });
    await page.waitForTimeout(500);
  }
  await onStep?.();
  // 끝자리(물음 버튼 · 마지막 장의 끝)가 다 나타날 때까지
  await page.waitForFunction((i) => getComputedStyle(document.querySelector(`.r-card[data-slide-index="${i}"] .r-end`)!).opacity === "1", i);
  return swipes;
}

/** i 장의 끝자리로 바로 내린다 (손가락 없이 — 흐름이 아니라 글만 볼 때) */
export async function jumpToEnd(page: Page, i: number) {
  await card(page, i).evaluate((c) => c.scrollTo(0, c.scrollHeight));
  await page.waitForFunction((i) => getComputedStyle(document.querySelector(`.r-card[data-slide-index="${i}"] .r-end`)!).opacity === "1", i);
}

/** 물음 버튼을 눌러 다음 장으로 */
export async function ask(page: Page, i: number, touch = true) {
  const btn = card(page, i).locator(".r-ask");
  await (touch ? btn.tap() : btn.click());
  await settled(page, i + 1);
}

/** 물음 버튼만 눌러 i 장까지 간다 (끝자리가 화면 밖이면 스크롤로 내린다 — 사진용) */
export async function goTo(page: Page, i: number, end = false) {
  let cur = Number((await count(page).innerText()).split("/")[0]) - 1;
  if (cur > i) {
    await page.locator(".r-where").click();
    await page.locator(".r-trail li").nth(i).locator("button").click();
    await settled(page, i);
    cur = i;
  }
  for (; cur < i; cur++) {
    await card(page, cur).evaluate((c) => c.scrollTo(0, c.scrollHeight));
    await card(page, cur).locator(".r-ask").click();
    await settled(page, cur + 1);
  }
  await page.waitForTimeout(900); // 글이 차례로 나타난 뒤
  await card(page, i).evaluate((c, end) => c.scrollTo(0, end ? c.scrollHeight : 0), end);
  await page.waitForTimeout(end ? 1300 : 500);
}

/** 손가락으로 민다 (Chrome 의 실제 터치 스크롤 — 관성이 그대로 돈다). dy > 0 = 아래 글로, dx > 0 = 왼쪽으로 쓸기 */
export async function swipe(cdp: CDPSession, { x = 187, y = 380, dx = 0, dy = 0, speed = 900 }) {
  await cdp.send("Input.synthesizeScrollGesture", { x, y, xDistance: -dx, yDistance: -dy, speed, gestureSourceType: "touch", preventFling: false });
}

/**
 * 지금 장(i)을 독자가 보는 그대로 읽는다 — 감춰 둔 장은 읽지 않는다.
 *   units   글 단위. <b> 는 <b>…</b> 로, <br> 은 \n 으로 되돌린다
 *   visible 단위마다 innerText (CSS 로 숨거나 바뀐 글자가 있으면 여기서 어긋난다)
 *   hidden  실제로는 안 보이는 단위 — 투명하거나, 감춰졌거나, 크기가 없거나, inert 안에 있다
 *   asked   이 장의 머리(방금 누른 물음)
 *   stray   독자 글 단위 밖에 그려진 글자
 */
export async function readSlide(page: Page, i: number) {
  return page.evaluate((i) => {
    const ser = (el: Node): string => {
      let out = "";
      el.childNodes.forEach((c) => {
        if (c.nodeType === Node.TEXT_NODE) out += c.textContent;
        else if (c instanceof HTMLBRElement) out += "\n";
        else if (c instanceof HTMLElement && c.tagName === "B") out += `<b>${ser(c)}</b>`;
        else out += ser(c);
      });
      return out;
    };
    const actives = document.querySelectorAll<HTMLElement>(".r-deck > .r-card[data-active]");
    const p = actives[0]!;
    const shown = (el: HTMLElement) => {
      if (el.closest("[inert]") || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      for (let a: HTMLElement | null = el; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (Number(s.opacity) < 1 || (a !== el && s.clipPath !== "none")) return false;
      }
      return true;
    };
    const u = (sel: string) => {
      const el = p.querySelector(sel);
      return el ? ser(el) : null;
    };
    const visible: string[] = [], hidden: string[] = [];
    p.querySelectorAll<HTMLElement>("[data-u]").forEach((el) => {
      visible.push(el.innerText);
      if (!shown(el)) hidden.push(el.innerText.slice(0, 24));
    });
    const blocks = Array.from(p.querySelectorAll(".r-slide .r-block")).map((b) => {
      const kind = b.getAttribute("data-block")!;
      let shape: unknown[] = [];
      if (kind === "prose") shape = Array.from(b.querySelectorAll(".r-p")).map((x) => x.getAttribute("data-weight"));
      if (kind === "contrast") shape = Array.from(b.querySelectorAll(".r-c")).map((x) => x.hasAttribute("data-emphasized"));
      if (kind === "list") shape = Array.from(b.querySelectorAll("li")).map((x) => [x.parentElement!.tagName === "OL", x.hasAttribute("data-emphasized")]);
      const units = Array.from(b.querySelectorAll("[data-u]")).map((x) => [x.getAttribute("data-u")!, ser(x)] as [string, string]);
      return { kind, shape, units, unknown: b.querySelector("[data-unknown-type]")?.getAttribute("data-unknown-type") ?? null };
    });
    const layers = Array.from(p.querySelectorAll(".r-slide [data-layer]")).map((x) => x.getAttribute("data-layer")!);
    const stray: string[] = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent!.trim() && !n.parentElement!.closest("[data-u]")) stray.push(n.textContent!.trim());
    const askedEl = p.querySelector<HTMLElement>(".r-asked-text");
    const unit: Omit<UnitSlide, "blocks"> & { blocks: (UnitBlock & { unknown: string | null })[] } = {
      kicker: u(".r-slide [data-u=kicker]")!, headline: u(".r-slide [data-u=headline]")!, oq: u(".r-end [data-u=oq]"), blocks, layers,
    };
    return {
      index: Number(p.dataset.slideIndex), actives: actives.length, unit, visible, hidden, stray,
      asked: askedEl ? askedEl.innerText : null, askedShown: askedEl ? shown(askedEl) : null,
      total: document.querySelectorAll(".r-deck > .r-card").length,
      inertOthers: Array.from(document.querySelectorAll<HTMLElement>(".r-deck > .r-card:not([data-active])")).every((c) => c.inert && getComputedStyle(c).opacity === "0"),
    };
  }, i);
}
