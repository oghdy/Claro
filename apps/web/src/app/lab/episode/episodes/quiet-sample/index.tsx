"use client";

import { MotionConfig, motion } from "motion/react";
import { CHROME } from "../../kit/chrome";
import { PlainQuietBody } from "../../kit/frames/Plain";
import { Ask, Head, Txt, rise, stagger } from "../../kit/parts";
import { QUIET_SAMPLE as S } from "./data";

// 기본 풀이 "다. 조용히"의 견본 화면 (UX-4) — 풀이 장면 한 장만. 회차가 아니다 (표지 · 도구 · 지도가 없다).
// 눌러 보기가 없다. 물음 버튼도 낮춘 말이고, 견본이라 누르지 못한다. 강조색을 쓰지 않는다 (data-tone="quiet").
export function QuietSample() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="ep-root" data-tone="quiet" data-episode="quiet-sample" data-scene="aha">
        <div className="ep-demo" role="group" aria-label={CHROME.chrome.readersAria}>
          <span className="ep-demo-tag">{CHROME.chrome.draft}</span>
          <a className="ep-demo-switch" href="/lab/episode">
            {CHROME.lab.back}
          </a>
        </div>
        <p className="pl-sample">
          {S.banner}
          <span>{S.bannerNote}</span>
        </p>
        <div className="ep-scroll">
          <motion.main className="ep-scene" variants={stagger} initial="hidden" animate="show">
            <Head kicker={S.kicker} title={S.plain.title} />
            <PlainQuietBody plain={S.plain} />
            <motion.p className="ep-caveat" variants={rise}>
              <Txt item={S.entry.whose} />
            </motion.p>
            <Ask text={S.plain.ask} onAsk={() => {}} />
          </motion.main>
        </div>
      </div>
    </MotionConfig>
  );
}
