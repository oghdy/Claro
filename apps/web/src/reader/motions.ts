import { motion as t } from "@claro/tokens";
import type { Transition } from "motion/react";

// 넘어가는 움직임 — 안 셋 (F-2b · 도윤이 폰에서 고른다). 흐름(D26)은 셋 다 같다. 다른 것은 "어떻게 움직이나"뿐이다.
// 물음을 누르면 한 동작으로 세 가지가 일어난다:
//   leave   읽던 글이 물러난다
//   travel  누른 물음이 그 글자 그대로 다음 화면의 머리 자리로 간다. 가는 동안 버튼의 하얀 면이 걷힌다 (drain)
//   enter   그 아래로 답이 차례로 나타난다
// 시간 · 곡선은 전부 토큰(@claro/tokens motion)에서 온다. 여기는 짜임만 정한다.

const s = (ms: number) => ms / 1000;
const spring = (v: { stiffness: number; damping: number; mass: number }): Transition => ({ type: "spring", ...v });
const tween = (ms: number, ease: readonly [number, number, number, number]): Transition => ({ type: "tween", duration: s(ms), ease: [...ease] });

export type MotionId = "a" | "b" | "c";

export interface Choreography {
  name: string;
  /** 읽던 글 — 어디로(px. "follow" = 물음이 가는 만큼 같이) · 어떻게 */
  leave: { y: number | "follow"; transition: Transition };
  /** 물음이 머리 자리로 */
  travel: Transition;
  /** 버튼의 면이 걷힌다 — 어느 쪽 끝으로 · 언제. "bottom" 이면 면이 머리 아래 선으로 접힌다 (면의 아래 끝 = 선의 자리) */
  drain: { toward: "top" | "bottom"; transition: Transition };
  /** 답이 나타난다 — 물음을 누른 뒤 기다리는 시간(초) · 덩이 사이(초) · 올라오는 거리(px) · 어떻게 */
  enter: { delay: number; stagger: number; y: number; transition: Transition };
  /** 머리 아래 선이 그어진다 */
  rule: Transition;
}

export const CHOREOGRAPHY: Record<MotionId, Choreography> = {
  // A — 끌어올리기. 물음이 스프링으로 떠올라 자리에 앉고, 읽던 글은 살짝 위로 빠진다. 물음이 주인공이다
  a: {
    name: "끌어올리기",
    leave: { y: -16, transition: tween(t.duration.leave, t.ease.in) },
    travel: spring(t.spring.lift),
    // 면은 읽던 글이 다 물러난 뒤에 걷힌다 — 걷힌 자리의 글자가 읽던 글과 겹쳐 보이지 않게
    drain: { toward: "bottom", transition: { ...tween(t.duration.drain, t.ease.out), delay: s(t.duration.leave) } },
    enter: { delay: s(240), stagger: s(t.stagger.base), y: 14, transition: spring(t.spring.settle) },
    rule: { ...tween(t.duration.appear, t.ease.out), delay: s(260) },
  },
  // B — 한 장으로 이어지기. 화면 전체가 한 면처럼 위로 흐른다: 읽던 글 · 물음 · 새 글이 같은 속도로 올라가고 물음만 맨 위에 걸려 남는다
  b: {
    name: "한 장으로 이어지기",
    leave: { y: "follow", transition: tween(t.duration.travel, t.ease.glide) },
    travel: tween(t.duration.travel, t.ease.glide),
    drain: { toward: "bottom", transition: { ...tween(t.duration.drain, t.ease.out), delay: s(t.duration.travel - t.duration.drain) } },
    enter: { delay: s(80), stagger: s(t.stagger.tight), y: 56, transition: tween(t.duration.travel, t.ease.glide) },
    rule: { ...tween(t.duration.appear, t.ease.out), delay: s(t.duration.travel - 120) },
  },
  // C — 차분하게. 읽던 글은 제자리에서 물러나고 물음은 짧게 올라간다. 가장 빨리 다음 글이 읽힌다
  c: {
    name: "차분하게",
    leave: { y: 0, transition: tween(t.duration.press, t.ease.in) },
    travel: tween(t.duration.appear, t.ease.out),
    drain: { toward: "bottom", transition: { ...tween(t.duration.panel, t.ease.out), delay: s(t.duration.press) } },
    enter: { delay: s(180), stagger: s(t.stagger.tight), y: 6, transition: tween(t.duration.appear, t.ease.out) },
    rule: { ...tween(t.duration.panel, t.ease.out), delay: s(200) },
  },
};

export const DEFAULT_MOTION: MotionId = "a";
export const isMotionId = (v: unknown): v is MotionId => v === "a" || v === "b" || v === "c";

/** 뒤로 갈 때 · 지나온 길 · 층 설명 — 작은 것들 */
export const PANEL: Transition = tween(t.duration.panel, t.ease.out);
/** 물음 버튼이 나온다 */
export const ASK_IN: Transition = spring(t.spring.settle);
/** 마지막 장 — 요점 문장이 혼자 서 있는 시간(초) 뒤에 끝자리가 나온다 */
export const LAST_REST = s(t.duration.rest);
