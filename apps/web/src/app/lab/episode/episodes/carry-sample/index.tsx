"use client";

import { Episode } from "../../../../../episode/kit/Episode";
import { CoverArt } from "../../../../../episode/episodes/fomc/Art";
import { Glyph } from "../../../../../episode/episodes/fomc";
import { CARRY, CARRY_BANNER } from "./data";

// 지난 값 견본 (UX-6) — 금리 2화에 시안 전용 지난 값을 붙여 공통 뼈대 (kit/Episode)에 올린다. 맨 위 띠가 "견본 · 실제 아님"을 크게 알린다.
// 풀이 장면 · "이 그림을 본 독자"로 바로 연다 (지난 값이 처음부터 보이는 모드). 시안 줄의 스위치로 체험 (처음 보는 독자 — 민 뒤에 보인다)도 본다.
export function CarrySample() {
  return (
    <div className="carry-wrap">
      <p className="carry-banner" data-testid="carry-banner">
        <strong>{CARRY_BANNER.tag}</strong>
        <span>{CARRY_BANNER.note}</span>
        <a href="/lab/episode/fomc">{CARRY_BANNER.real}</a>
      </p>
      <Episode ep={CARRY} Art={CoverArt} Glyph={Glyph} start={{ scene: "aha", solve: "seen" }} />
    </div>
  );
}
