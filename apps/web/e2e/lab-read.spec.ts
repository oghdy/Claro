// F-2a — 375×667(아이폰 SE)에서 손가락으로만 넘겨서 모든 글을 한 번씩 온전히 볼 수 있는가
//   Chrome 의 실제 터치 스크롤(관성 · 스냅 포함)로 민다. 방향마다 독자가 하는 동작 그대로:
//     A · C  위로 쓸어 올리기만 반복
//     B      카드 안에서 위로 쓸어 올리다가 더 안 내려가면 옆으로 넘기기
//   독자 글 단위(kicker · 제목 · 문단 · 항목 · 물음)마다 "화면 안에 통째로 들어온 적이 있는가"를 센다.
import { expect, test } from "@playwright/test";
import { golden } from "./golden";
import { DIRS, MOBILE_SE, NAMES, markSeen, openLevel, scrollPos, swipe, unseen } from "./lab";

for (const dir of DIRS)
  for (const lv of golden().levels) {
    test(`lab/${dir} ${NAMES[lv.id]} — 375×667 에서 끝까지 읽힌다`, async ({ browser }) => {
      test.setTimeout(180_000);
      const ctx = await browser.newContext({ viewport: MOBILE_SE, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await openLevel(page, dir, lv.id);
      const n = lv.slides.length;
      let swipes = 0;
      const settle = () => page.waitForTimeout(700);
      await markSeen(page);
      if (dir === "b") {
        for (let i = 0; i < n; i++) {
          for (let k = 0; k < 20; k++) {
            const before = await scrollPos(page, dir);
            await swipe(cdp, { dy: 260 }), swipes++;
            await settle();
            await markSeen(page);
            if ((await scrollPos(page, dir)) === before) break;
          }
          if (i < n - 1) await swipe(cdp, { dx: 250, y: 300 }), swipes++, await settle(), await markSeen(page);
        }
      } else {
        for (let k = 0, still = 0; k < 120 && still < 2; k++) {
          const before = await scrollPos(page, dir);
          await swipe(cdp, { dy: 260 }), swipes++;
          await settle();
          await markSeen(page);
          still = (await scrollPos(page, dir)) === before ? still + 1 : 0;
        }
      }
      const [seen, total] = await markSeen(page);
      const missing = await unseen(page);
      console.log(`  lab/${dir} ${lv.id}: 쓸기 ${swipes}번 · 독자 글 단위 ${seen}/${total} 을 화면 안에서 봄${missing.length ? " · 못 본 것: " + missing.join(" | ") : ""}`);
      expect(missing).toEqual([]);
      await ctx.close();
    });
  }
