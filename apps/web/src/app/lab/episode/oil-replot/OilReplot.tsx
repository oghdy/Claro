"use client";

import { OIL_LOOK, numbered } from "../../../../episode/catalog";
import { Episode, type EpisodeParts } from "../../../../episode/kit/Episode";
import type { EpisodeData } from "../../../../episode/kit/types";

// UX-10 — 다시 짠 기름값 1화를 **실제 화면과 같게** 세운다: 같은 뼈대 (kit/Episode) · 같은 그림 (OIL_LOOK) · real · 번호 규칙 (catalog.numbered — 기름값은 한 편뿐이라 번호를 숨긴다).
// 다음 화를 약속하지 않는 이야기 (catalog.unpromised)인 것도 같다 — episode_id 가 지금 판과 같아서 화면이 그대로 찾는다 (episode.json 의 _source.id_note).
// 다른 것은 둘뿐: 맨 위의 견줘 읽기 띠 · 시안 전용 칸 (replot).
export function OilReplot({ ep, replot, now, banner }: { ep: EpisodeData; replot: NonNullable<EpisodeParts["replot"]>; now: string; banner: { tag: string; what: string; compare: string } }) {
  return (
    <div className="rp-wrap">
      <p className="rp-banner" data-testid="replot-banner">
        <strong>{banner.tag}</strong>
        <span>{banner.what}</span>
        <a href={now} data-testid="replot-compare">
          {banner.compare}
        </a>
      </p>
      <Episode ep={ep} Art={OIL_LOOK.Art} Glyph={OIL_LOOK.Glyph} real numbered={numbered(ep.series.code)} replot={replot} />
    </div>
  );
}
