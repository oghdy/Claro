"use client";

import { Episode } from "../../kit/Episode";
import { CoverArt } from "./Art";
import { DELIVERY } from "./data";

// 배달앱 회차 (UX-1) — 공통 뼈대(kit/Episode) 위에 이 회차의 것 둘을 올린다: 표지 그림 · 도구 그림.
// 풀이 장면은 회차의 부품이 아니다 (UX-4) — 틀에 넣을 데이터(골든 픽스처의 solve)만 있고, 화면은 kit/frames 가 세운다.

/** 도구 카드의 작은 그림 — UX-1 의 Episode.tsx 에 있던 것 그대로 */
function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (id === "fee")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5V12l6 6" />
      </svg>
    );
  if (id === "mfn")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M5 9.5h14M5 14.5h14" />
      </svg>
    );
  if (id === "dominance")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="3.5" y="5" width="11" height="14" rx="2" />
        <rect x="17" y="12" width="3.5" height="7" rx="1" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3.2 3.2" />
      <path d="M8 12.6c1.3-1.8 2.7-1.8 4 0s2.7 1.8 4 0" />
    </svg>
  );
}

/** real — 실제 화면 (/s/*). 없으면 시안 (/lab/episode/*) */
export function DeliveryEpisode({ real }: { real?: boolean }) {
  return <Episode ep={DELIVERY} Art={CoverArt} Glyph={Glyph} real={real} />;
}
