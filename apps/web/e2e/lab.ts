// F-2a lab 공용 — 방향마다 "한 장으로 가기"와 "독자 글 단위 모으기"
import type { CDPSession, Page } from "@playwright/test";

export const DIRS = ["a", "b", "b2", "b3", "c"] as const;
export type Dir = (typeof DIRS)[number];
export const NAMES: Record<string, string> = { basic: "입문", intermediate: "중급", advanced: "숙련" };
export const MOBILE_SE = { width: 375, height: 667 };
export const MOBILE_X = { width: 375, height: 812 };
export const DESKTOP = { width: 1440, height: 900 };

export async function openLevel(page: Page, dir: Dir, level: string) {
  await page.goto(`/lab/${dir}`);
  await page.getByRole("button", { name: NAMES[level], exact: true }).click();
  await page.locator(`[data-level="${level}"]`).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** i 번째 슬라이드의 맨 위로 (A · C) / i 번째 카드로 (B). end=true 면 그 슬라이드의 글 끝이 화면 아래에 닿게 */
export async function goTo(page: Page, dir: Dir, i: number, end = false) {
  await page.evaluate(
    ({ dir, i, end }) => {
      const s = document.querySelector<HTMLElement>(`[data-slide-index="${i}"]`)!;
      if (dir === "a") {
        const deck = document.querySelector<HTMLElement>(".a-deck")!;
        deck.style.scrollSnapType = "none"; // 사진을 찍을 위치에 정확히 세운다 (넘기는 동작은 영상 · 읽기 테스트가 본다)
        deck.scrollTop = end ? s.offsetTop + s.offsetHeight - deck.clientHeight : s.offsetTop;
      } else if (dir.startsWith("b")) {
        const pager = document.querySelector<HTMLElement>(".b-pager")!;
        pager.style.scrollSnapType = "none";
        pager.scrollLeft = i * pager.clientWidth;
        s.scrollTop = end ? s.scrollHeight : 0;
      } else {
        const bar = document.querySelector<HTMLElement>(".c-bar")!.offsetHeight;
        window.scrollTo({ top: end ? s.offsetTop + s.offsetHeight - innerHeight + 48 : s.offsetTop - bar - 8, behavior: "instant" });
      }
    },
    { dir, i, end },
  );
  await page.waitForTimeout(dir === "b3" ? 1400 : 250); // b3 는 글이 차례로 나타난 뒤에 찍는다
}

/** 질문 화면 (A 만) — slides[i] 와 slides[i+1] 사이 */
export async function goToQuestion(page: Page, i: number) {
  await page.evaluate((i) => {
    const deck = document.querySelector<HTMLElement>(".a-deck")!;
    deck.style.scrollSnapType = "none";
    deck.scrollTop = document.querySelector<HTMLElement>(`[data-after-slide="${i}"]`)!.offsetTop;
  }, i);
  await page.waitForTimeout(250);
}

/** 지금 화면에 온전히 보이는 독자 글 단위를 기록한다. 돌려주는 값 = 지금까지 본 단위 수 · 전체 단위 수 */
export async function markSeen(page: Page): Promise<[number, number]> {
  return page.evaluate(() => {
    const w = window as unknown as { __seen?: Set<number> };
    w.__seen ??= new Set();
    const root = document.querySelector("[data-level]")!;
    const top = document.querySelector(".a-bar, .b-bar, .c-bar")!.getBoundingClientRect().bottom;
    const units = Array.from(root.querySelectorAll<HTMLElement>("[data-u]"));
    units.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top >= top - 1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1) w.__seen!.add(i);
    });
    return [w.__seen.size, units.length];
  });
}

export async function unseen(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const seen = (window as unknown as { __seen: Set<number> }).__seen;
    return Array.from(document.querySelector("[data-level]")!.querySelectorAll<HTMLElement>("[data-u]"))
      .map((el, i) => (seen.has(i) ? null : el.innerText.slice(0, 30)))
      .filter((x): x is string => x !== null);
  });
}

/** 손가락으로 민다 (Chrome 의 실제 터치 스크롤 — 관성 · 스냅이 그대로 돈다). dy > 0 = 아래 글로, dx > 0 = 다음 카드로 */
export async function swipe(cdp: CDPSession, { x = 187, y = 380, dx = 0, dy = 0, speed = 900 }) {
  await cdp.send("Input.synthesizeScrollGesture", {
    x,
    y,
    xDistance: -dx,
    yDistance: -dy,
    speed,
    gestureSourceType: "touch",
    preventFling: false,
  });
}

export async function scrollPos(page: Page, dir: Dir): Promise<number> {
  return page.evaluate((dir) => {
    if (dir === "a") return document.querySelector(".a-deck")!.scrollTop;
    if (dir === "c") return scrollY;
    const pager = document.querySelector<HTMLElement>(".b-pager")!;
    const i = Math.round(pager.scrollLeft / pager.clientWidth);
    return i * 100000 + (pager.children[i] as HTMLElement).scrollTop;
  }, dir);
}
