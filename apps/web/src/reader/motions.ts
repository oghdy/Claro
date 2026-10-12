import { effect, motion as t } from "@claro/tokens";
import type { Transition } from "motion/react";

// 넘어가는 움직임 — "끌어올리기" (F-2b · 안 A · B · C 중 도윤이 A 를 골랐다, 2026-10-12. B · C 는 16254d0 에 있다).
// 물음을 누르면 한 동작으로 세 가지가 일어난다:
//   leave   읽던 글이 물러난다
//   travel  누른 물음이 그 글자 그대로 다음 화면의 머리 자리로 간다. 가는 동안 버튼의 하얀 면이 걷힌다 (drain)
//   enter   그 아래로 답이 차례로 나타난다
// 시간 · 곡선은 전부 토큰(@claro/tokens motion)에서 온다. 여기는 짜임만 정한다.

const s = (ms: number) => ms / 1000;
const spring = (v: { stiffness: number; damping: number; mass: number }): Transition => ({ type: "spring", ...v });
const tween = (ms: number, ease: readonly [number, number, number, number]): Transition => ({ type: "tween", duration: s(ms), ease: [...ease] });

export interface Choreography {
  /** 읽던 글 — 어디로(px) · 얼마나 작아지며 · 어떻게 */
  leave: { y: number; scale: number; transition: Transition };
  /** 물음이 머리 자리로 */
  travel: Transition;
  /** 버튼의 면이 걷힌다 — 아래쪽 끝으로 걷혀 머리 아래 선으로 접힌다 (면의 아래 끝 = 선의 자리) */
  drain: Transition;
  /** 답이 나타난다 — 물음을 누른 뒤 기다리는 시간(초) · 덩이 사이(초) · 올라오는 거리(px) · 처음의 흐림(px) · 어떻게 */
  enter: { delay: number; stagger: number; y: number; blur: number; transition: Transition };
  /** 머리 아래 선이 그어진다 */
  rule: Transition;
}

// 물음이 스프링으로 천천히 떠올라 자리에 앉고, 읽던 글은 살짝 작아지며 위로 물러난다.
//   "더 부드럽고 수루룩, 빠른 느낌 없이, 터치감 · 효과는 있되 과하지 않게" — 전체 0.5 → 0.9초쯤. 답은 흐릿한 데서 또렷해지며 올라온다
export const CHOREOGRAPHY: Choreography = {
  leave: { y: -22, scale: effect.leaveScale, transition: tween(t.duration.leave, t.ease.in) },
  travel: spring(t.spring.lift),
  // 면은 읽던 글이 다 물러난 뒤에 걷힌다 — 걷힌 자리의 글자가 읽던 글과 겹쳐 보이지 않게
  drain: { ...tween(t.duration.drain, t.ease.out), delay: s(t.duration.leave) },
  enter: { delay: s(t.duration.answer), stagger: s(t.stagger.base), y: 18, blur: effect.enterBlur, transition: spring(t.spring.settle) },
  rule: { ...tween(t.duration.travel, t.ease.out), delay: s(t.duration.answer) },
};

/** 뒤로 갈 때 · 지나온 길 · 층 설명 — 작은 것들 */
export const PANEL: Transition = tween(t.duration.panel, t.ease.out);
/** 물음 버튼이 나온다 */
export const ASK_IN: Transition = spring(t.spring.settle);
/** 마지막 장 — 요점 문장이 혼자 서 있는 시간(초) 뒤에 끝자리가 나온다 */
export const LAST_REST = s(t.duration.rest);
