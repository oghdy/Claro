"use client";

import { Episode } from "../../kit/Episode";
import { CoverArt } from "./Art";
import { Glyph } from "./Glyph";
import { FOMC } from "./data";

// FOMC 회차 (UX-2) — 공통 뼈대(kit/Episode) 위에 이 회차의 것 둘을 올린다: 표지 그림 · 도구 그림.
// 풀이 장면은 회차의 부품이 아니다 (UX-4) — 틀에 넣을 데이터(골든 픽스처의 solve)만 있고, 화면은 kit/frames 가 세운다.


/** 지난 값 견본 · 3화 주소가 이 길로 읽는다 */
export { Glyph };

/** real — 실제 화면 (/s/*). 없으면 시안 (/lab/episode/*) */
export function FomcEpisode({ real }: { real?: boolean }) {
  return <Episode ep={FOMC} Art={CoverArt} Glyph={Glyph} real={real} />;
}
