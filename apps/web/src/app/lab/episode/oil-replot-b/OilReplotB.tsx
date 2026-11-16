"use client";

import { Episode } from "../../../../episode/kit/Episode";
import { OIL_LOOK, episodeOf } from "../../../../episode/catalog";
import { COPY, REPLOT, STORE } from "./data";
import file from "./episode.json";

// 실제 화면 (/s/oil/1 — LongScreen)과 같은 부품 · 같은 그림 · 같은 번호 규칙 (real · numbered 없음 · 다음 화 약속 없음)에 올린다.
// 달라지는 것은 이야기의 차례뿐이다. 맨 위에 견줘 읽기 길 하나 (실제 /s/oil/1).
const EP = episodeOf(file, [STORE]);

export function OilReplotB() {
  return (
    <div className="orb-wrap">
      <p className="orb-bar" data-testid="orb-bar">
        <strong>{COPY.tag}</strong>
        <a href={COPY.to} data-testid="orb-compare">
          {COPY.compare} → {COPY.to}
        </a>
      </p>
      <Episode ep={EP} Art={OIL_LOOK.Art} Glyph={OIL_LOOK.Glyph} real numbered={false} replot={REPLOT} />
    </div>
  );
}
