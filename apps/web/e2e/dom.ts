import type { Page } from "@playwright/test";
import type { UnitSlide } from "./golden";

/** 화면에 그려진 한 레벨을 독자 글 단위로 읽는다. <b> 는 <b>…</b> 로, <br> 은 \n 으로 되돌린다. */
export async function renderedUnits(page: Page): Promise<{ units: UnitSlide[]; visible: string[][]; stray: string[] }> {
  return page.evaluate(() => {
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
    const u = (root: Element, sel: string) => {
      const el = root.querySelector(sel);
      return el ? ser(el) : null;
    };
    const pages = Array.from(document.querySelectorAll(".deck > .page"));
    const visible: string[][] = [];
    const units = pages.map((p) => {
      const vis: string[] = [];
      p.querySelectorAll<HTMLElement>("[data-u]").forEach((el) => vis.push(el.innerText));
      visible.push(vis);
      const blocks = Array.from(p.querySelectorAll(".slide .block")).map((b) => {
        const kind = b.getAttribute("data-block")!;
        let shape: unknown[] = [];
        if (kind === "prose") shape = Array.from(b.querySelectorAll(".para")).map((x) => x.getAttribute("data-weight"));
        if (kind === "contrast") shape = Array.from(b.querySelectorAll(".c-item")).map((x) => x.hasAttribute("data-emphasized"));
        if (kind === "list")
          shape = Array.from(b.querySelectorAll("li")).map((x) => [x.parentElement!.tagName === "OL", x.hasAttribute("data-emphasized")]);
        const units = Array.from(b.querySelectorAll("[data-u]")).map((x) => [x.getAttribute("data-u")!, ser(x)] as [string, string]);
        return { kind, shape, units };
      });
      const layers = Array.from(p.querySelectorAll(".slide [data-layer]")).map((x) => x.getAttribute("data-layer")!);
      return { kicker: u(p, ".slide [data-u=kicker]")!, headline: u(p, ".slide [data-u=headline]")!, oq: u(p, ".between [data-u=oq]"), blocks, layers };
    });
    // 독자 글 단위 밖에 그려진 글자 — UI 문구만 있어야 한다
    const stray: string[] = [];
    const walker = document.createTreeWalker(document.querySelector(".deck")!, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode())
      if (n.textContent!.trim() && !n.parentElement!.closest("[data-u]")) stray.push(n.textContent!.trim());
    return { units, visible, stray };
  });
}

export async function goToSlide(page: Page, i: number) {
  await page.evaluate((i) => {
    const deck = document.querySelector<HTMLElement>(".deck")!;
    const p = deck.querySelectorAll<HTMLElement>(".page")[i]!;
    deck.scrollTo({ top: p.offsetTop, behavior: "instant" });
  }, i);
}
