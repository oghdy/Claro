// 모르는 type → 그 블록의 text 를 그린다 (§7.9 · D14)
import { expect, test } from "@playwright/test";
import { golden } from "./golden";

test("모르는 type 의 블록은 text 로 그려진다 — 골든 입문의 모든 블록", async ({ page }) => {
  await page.goto("/test/unknown-type");
  const basic = golden().levels.find((l: any) => l.id === "basic");
  // 레벨이 하나 → 전환 UI 없음 (D22)
  await expect(page.getByRole("group", { name: "설명 수준" })).toHaveCount(0);

  const got = await page.evaluate(() => {
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
    return Array.from(document.querySelectorAll(".deck > .page")).map((p) =>
      Array.from(p.querySelectorAll(".block")).map((b) => ({
        block: b.getAttribute("data-block"),
        type: b.querySelector("[data-unknown-type]")?.getAttribute("data-unknown-type"),
        text: ser(b.querySelector("[data-u=text]")!),
      })),
    );
  });
  const want = basic.slides.map((s: any) => s.blocks.map((b: any) => ({ block: "unknown", type: `future_${b.type}`, text: b.text })));
  expect(got).toEqual(want);
  const n = want.flat().length;
  console.log(`  모르는 type 블록 ${n}개 — 전부 text 로 그려짐`);
});
