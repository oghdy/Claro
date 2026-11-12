"use client";

import { Episode } from "../../kit/Episode";
import { CoverArt } from "./Art";
import { PIPC } from "./data";

// 개인정보 회차 (UX-5) — 공통 뼈대(kit/Episode) 위에 이 회차의 것 둘을 올린다: 표지 그림 · 도구 그림.
// 풀이 장면은 회차의 부품이 아니다 — 넘겨 보기 틀에 넣을 데이터(골든 픽스처의 solve)만 있고, 화면은 kit/frames/Pages 가 세운다.

/** 도구 카드의 작은 그림 */
function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  // 과징금 — 동전과 내는 손짓
  if (id === "fine")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 10h7M8.5 14h7" />
      </svg>
    );
  // 시정명령 — 고칠 것에 표시
  if (id === "order")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="4.5" y="4" width="15" height="16" rx="2.5" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
      </svg>
    );
  // 안전조치의무 — 방패
  if (id === "safety")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M12 3.5l7 2.5v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" />
      </svg>
    );
  // ‘다했다면’ 단서 — 한 줄에 붙은 꼬리
  if (id === "proviso")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M4 8h16M4 13h9" />
        <path d="M16.5 13v3.5h3.5" />
        <circle cx="16.5" cy="13" r="1.3" fill="currentColor" />
      </svg>
    );
  // 공표명령 — 알리는 판
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 10v4l3 .5 7 4v-13l-7 4Z" />
      <path d="M17.5 9.5c1.3 1.3 1.3 3.7 0 5" />
    </svg>
  );
}

/** real — 실제 화면 (/s/*). 없으면 시안 (/lab/episode/*) */
export function PipcEpisode({ real }: { real?: boolean }) {
  return <Episode ep={PIPC} Art={CoverArt} Glyph={Glyph} real={real} />;
}
