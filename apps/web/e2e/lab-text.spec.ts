// F-2a — 세 방향 모두 골든의 독자 글을 전부, 순서대로, 글자 하나 안 바꾸고 그리는가 (가짜 글 없음)
//   순서: 슬라이드마다 kicker · headline · 블록 단위들 · 그 뒤 open_question. span 의 layer 순서도 본다.
import { expect, test } from "@playwright/test";
import { golden, goldenUnits } from "./golden";
import { DIRS, NAMES, openLevel } from "./lab";

const plain = (s: string) => s.replace(/<\/?b>/g, "");

for (const dir of DIRS)
  for (const lv of golden().levels) {
    test(`lab/${dir} ${NAMES[lv.id]} — 골든 독자 글 전부`, async ({ page }) => {
      await openLevel(page, dir, lv.id);
      const want = goldenUnits(lv);
      const seq = want.flatMap((w) => [w.kicker, w.headline, ...w.blocks.flatMap((b) => b.units.map(([, t]) => t)), ...(w.oq ? [w.oq] : [])]);
      const root = page.locator(`[data-level="${lv.id}"]`);
      const got = await root.evaluate((r) => Array.from(r.querySelectorAll<HTMLElement>("[data-u]")).map((e) => e.innerText));
      const layers = await root.evaluate((r) => Array.from(r.querySelectorAll<HTMLElement>("[data-lab-slide] [data-layer]")).map((e) => e.dataset.layer));
      expect(got).toEqual(seq.map(plain));
      expect(layers).toEqual(want.flatMap((w) => w.layers));
      console.log(`  lab/${dir} ${lv.id}: 독자 글 단위 ${seq.length}개 · ${seq.join("").length}자 — 일치`);
    });
  }
