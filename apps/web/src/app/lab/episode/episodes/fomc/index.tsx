"use client";

import { Episode } from "../../kit/Episode";
import { CoverArt } from "./Art";
import { FOMC } from "./data";

// FOMC 회차 (UX-2) — 공통 뼈대(kit/Episode) 위에 이 회차의 것 둘을 올린다: 표지 그림 · 도구 그림.
// 풀이 장면은 회차의 부품이 아니다 (UX-4) — 틀에 넣을 데이터(골든 픽스처의 solve)만 있고, 화면은 kit/frames 가 세운다.

/** 도구 카드의 작은 그림 */
function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  // 기준금리 — 페달
  if (id === "rate")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="7" y="4.5" width="10" height="11" rx="2.5" transform="rotate(-10 12 10)" />
        <path d="M12 16v4M8.5 20h7" />
      </svg>
    );
  // 물가 목표 — 눈금과 바늘
  if (id === "target")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M4 16a8 8 0 0 1 16 0" />
        <path d="M12 16l4.5-5.5" />
        <path d="M9 8.6l-.8-1.9" />
      </svg>
    );
  // 표결 — 여럿과 둘
  if (id === "vote")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="6" cy="9" r="1.6" />
        <circle cx="11" cy="9" r="1.6" />
        <circle cx="6" cy="15" r="1.6" />
        <circle cx="11" cy="15" r="1.6" />
        <circle cx="18.5" cy="12" r="1.6" fill="currentColor" />
      </svg>
    );
  // 금융 여건 — 가운데 고리
  if (id === "conditions")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="19" cy="12" r="2" />
        <path d="M7 12h2M15 12h2" />
      </svg>
    );
  // 점도표 — 점들
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 20V4M4 20h16" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" />
      <circle cx="13" cy="10" r="1.2" fill="currentColor" />
      <circle cx="13" cy="14" r="1.2" fill="currentColor" />
      <circle cx="17" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function FomcEpisode() {
  return <Episode ep={FOMC} Art={CoverArt} Glyph={Glyph} />;
}
