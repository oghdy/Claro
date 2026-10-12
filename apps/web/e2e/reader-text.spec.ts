// 화면 글 ↔ 골든 독자 글 문자 단위 대조. scripts/compare-reader-text.py 가 골든끼리 하던 일을 화면에 대해 한다.
//   본 화면은 한 번에 한 장만 보인다 (D26). 그래서 DOM 을 한꺼번에 읽지 않고 **독자처럼 걷는다** —
//   375×667 에서 손가락으로 끝까지 내리고, 물음 버튼을 눌러 다음 장으로. 장마다 그때 화면에 보이는 것만 읽는다.
//   대조: kicker · headline · 문단 · 인용(출처 + 글) · 목록(라벨 + 글) · 대조(라벨 + 값 + 글) · 표(라벨 + 값) · open_question
//     - <b> 위치까지 (DOM 의 <b> 를 되돌린다). 모양(무게 · 강조 · 순서) · 장수 · 블록 수 · span 의 layer 순서
//     - innerText 가 골든 글에서 <b> 만 뺀 것과 같다 — CSS 로 숨거나 바뀐 글자가 없다
//     - 그 단위가 **실제로 보인다** — 투명 · 감춤 · 크기 0 · inert 가 아니다 (등장 효과가 끝난 뒤)
//     - 누른 물음이 다음 장의 머리에 글자 그대로 있다. 그 밖에 그려진 글자는 정해진 UI 문구뿐이다
//     - 지금 장 말고는 전부 감춰져 있고 inert 다
//   움직임이 켜져 있을 때와 움직임 줄이기 설정일 때 — 둘 다 같아야 한다.
import { expect, test } from "@playwright/test";
import { golden, goldenUnits } from "./golden";
import { MOBILE_SE, NAMES, ask, openLevel, readSlide, readToEnd, settled } from "./reader";

const plain = (s: string) => s.replace(/<\/?b>/g, "");
const TIP = "문장을 누르면 그 문장이 사실인지 해석인지 보여요";

for (const mode of ["켬", "줄임"] as const)
  for (const lv of golden().levels) {
    test(`${NAMES[lv.id]} · 움직임 ${mode} — 화면 글이 골든과 문자 단위로 같다`, async ({ browser }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true, reducedMotion: mode === "줄임" ? "reduce" : "no-preference" });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await openLevel(page, lv.id);
      await expect(page.locator(".reader")).toHaveAttribute("data-motion", mode === "줄임" ? "none" : "on");

      const want = goldenUnits(lv);
      const others = golden().levels.filter((l: any) => l.id !== lv.id).map((l: any) => `${NAMES[l.id]}으로 다시 읽기`);
      let n = 0, chars = 0;
      for (let i = 0; i < want.length; i++) {
        await settled(page, i);
        await readToEnd(page, cdp, i);
        const w = want[i]!, got = await readSlide(page, i), g = got.unit;
        expect(got.total, "장수").toBe(lv.slides.length);
        expect([got.index, got.actives], `${lv.id}[${i}] 지금 장은 하나`).toEqual([i, 1]);
        expect(got.inertOthers, `${lv.id}[${i}] 다른 장은 감춰져 있고 inert`).toBe(true);
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
        expect(got.visible, `${lv.id}[${i}] innerText`).toEqual(seq.map(plain));
        expect(got.hidden, `${lv.id}[${i}] 안 보이는 글 단위`).toEqual([]);
        // 누른 물음 = 이 장의 머리. 앞 장의 open_question 글자 그대로
        expect(got.asked, `${lv.id}[${i}] 머리`).toBe(i === 0 ? null : want[i - 1]!.oq);
        if (i > 0) expect(got.askedShown, `${lv.id}[${i}] 머리가 보인다`).toBe(true);
        // 독자 글 밖에 그려진 글자 — 머리(위에서 봤다) · 첫 장의 안내 · 마지막 장의 끝자리뿐
        const ui = [
          ...(i > 0 ? [want[i - 1]!.oq!] : []),
          ...(i === 0 ? [TIP] : []),
          ...(i === want.length - 1 ? ["이 물음들을 따라 여기까지 왔어요", ...want.slice(0, -1).map((x) => x.oq!), ...others, "처음부터 다시 보기"] : []),
        ];
        expect(got.stray, `${lv.id}[${i}] 그 밖의 글자`).toEqual(ui);
        if (i < want.length - 1) await ask(page, i);
      }
      console.log(`  ${lv.id} · ${mode}: 슬라이드 ${want.length} · 독자 글 단위 ${n}개 · ${chars}자 대조 — 일치`);
      await ctx.close();
    });
  }
