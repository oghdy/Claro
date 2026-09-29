// 렌더 결과 ↔ 골든 독자 글 문자 단위 대조. scripts/compare-reader-text.py 가 골든끼리 하던 일을 화면에 대해 한다.
//   대조: kicker · headline · 문단 · 인용(출처 + 글) · 목록(라벨 + 글) · 대조(라벨 + 값 + 글) · 표(라벨 + 값) · open_question
//   <b> 위치까지 본다(DOM 의 <b> 를 되돌린다). 모양(무게 · 강조 · 순서) · 장수 · 블록 수 · span 의 layer 순서도 본다.
//   화면 글(innerText)이 골든 글에서 <b> 만 뺀 것과 같은지도 본다 — CSS 로 숨거나 바뀐 글자가 없는지.
import { expect, test } from "@playwright/test";
import { renderedUnits } from "./dom";
import { golden, goldenUnits } from "./golden";

const NAMES: Record<string, string> = { basic: "입문", intermediate: "중급", advanced: "숙련" };
const plain = (s: string) => s.replace(/<\/?b>/g, "");

for (const lv of golden().levels) {
  test(`${NAMES[lv.id]} — 화면 글이 골든과 문자 단위로 같다`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: NAMES[lv.id] }).click();
    await expect(page.locator(".deck")).toHaveAttribute("data-level", lv.id);

    const want = goldenUnits(lv);
    const got = await renderedUnits(page);

    expect(got.units.length, "장수").toBe(lv.slides.length);
    let n = 0, chars = 0;
    for (let i = 0; i < want.length; i++) {
      const w = want[i]!, g = got.units[i]!;
      expect(g.kicker, `${lv.id}[${i}] kicker`).toBe(w.kicker);
      expect(g.headline, `${lv.id}[${i}] headline`).toBe(w.headline);
      expect(g.oq, `${lv.id}[${i}] open_question`).toBe(w.oq);
      expect(g.layers, `${lv.id}[${i}] span layer 순서`).toEqual(w.layers);
      expect(g.blocks.length, `${lv.id}[${i}] 블록 수`).toBe(w.blocks.length);
      n += 2 + (w.oq ? 1 : 0);
      chars += w.kicker.length + w.headline.length + (w.oq?.length ?? 0);
      w.blocks.forEach((wb, j) => {
        const gb = g.blocks[j]!;
        expect(gb.kind, `${lv.id}[${i}] blocks/${j} 종류`).toBe(wb.kind);
        expect(gb.shape, `${lv.id}[${i}] blocks/${j} 모양`).toEqual(wb.shape);
        expect(gb.units, `${lv.id}[${i}] blocks/${j} 글`).toEqual(wb.units);
        n += wb.units.length;
        chars += wb.units.reduce((a, [, t]) => a + t.length, 0);
      });
      // 화면에 보이는 글 — innerText. 순서: kicker · headline · 블록 단위들 · open_question
      const seq = [w.kicker, w.headline, ...w.blocks.flatMap((b) => b.units.map(([, t]) => t)), ...(w.oq ? [w.oq] : [])];
      expect(got.visible[i], `${lv.id}[${i}] innerText`).toEqual(seq.map(plain));
    }
    // 독자 글 밖에 그려진 글자는 마지막 장의 버튼 하나뿐
    expect(got.stray).toEqual(["처음부터 다시 보기"]);
    console.log(`  ${lv.id}: 슬라이드 ${want.length} · 독자 글 단위 ${n}개 · ${chars}자 대조 — 일치`);
  });
}
