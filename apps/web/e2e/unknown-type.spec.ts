// 모르는 type → 그 블록의 text 를 그린다 (§7.9 · D14)
import { expect, test } from "@playwright/test";
import { golden } from "./golden";
import { ask, jumpToEnd, readSlide, settled } from "./reader";

test("모르는 type 의 블록은 text 로 그려진다 — 골든 입문의 모든 블록", async ({ page }) => {
  await page.goto("/test/unknown-type");
  const basic = golden().levels.find((l: any) => l.id === "basic");
  // 레벨이 하나 → 전환 UI 없음 (D22)
  await expect(page.getByRole("group", { name: "설명 수준" })).toHaveCount(0);

  const got: unknown[] = [];
  for (let i = 0; i < basic.slides.length; i++) {
    await settled(page, i);
    await jumpToEnd(page, i);
    const s = await readSlide(page, i);
    expect(s.hidden).toEqual([]);
    got.push(s.unit.blocks.map((b) => ({ block: b.kind, type: b.unknown, text: b.units.find(([k]) => k === "text")?.[1] })));
    if (i < basic.slides.length - 1) await ask(page, i, false);
  }
  const want = basic.slides.map((s: any) => s.blocks.map((b: any) => ({ block: "unknown", type: `future_${b.type}`, text: b.text })));
  expect(got).toEqual(want);
  console.log(`  모르는 type 블록 ${want.flat().length}개 — 전부 text 로 그려짐`);
});
