"use client";

import { Episode } from "../../../../episode/kit/Episode";
import { CoverArt } from "../../../../episode/episodes/fomc/Art";
import { AUTO, AUTO_ERRORS, BANNER } from "./data";

// 파이프라인이 만든 금리 2화 — 공통 뼈대 (kit/Episode)에 그대로 올린다. 화면 맨 위의 띠가 "파이프라인이 만든 판"임을 알린다.
// 표지 그림은 손으로 만든 2화의 것을 빌렸다 (그림은 코드다 — 파이프라인이 내지 않는다). 도구의 작은 그림은 도구가 무엇이 나올지 몰라 차례로 고르는 무늬다.

/** 도구 카드의 작은 그림 — 도구의 차례로 고르는 무늬 (뜻 없음) */
function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const i = AUTO ? Math.max(0, AUTO.tools.findIndex((x) => x.key === id)) % 5 : 0;
  if (i === 0)
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M4 16a8 8 0 0 1 16 0" />
        <path d="M12 16l4-5" />
      </svg>
    );
  if (i === 2)
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="7" cy="9" r="1.6" />
        <circle cx="12" cy="9" r="1.6" />
        <circle cx="7" cy="15" r="1.6" />
        <circle cx="12" cy="15" r="1.6" />
        <circle cx="18" cy="12" r="1.6" fill="currentColor" />
      </svg>
    );
  if (i === 3)
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="19" cy="12" r="2" />
        <path d="M7 12h2M15 12h2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 20V4M4 20h16" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" />
      <circle cx="13" cy="10" r="1.2" fill="currentColor" />
      <circle cx="17" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function AutoEpisode() {
  return (
    <div className="auto-wrap">
      <p className="auto-banner" data-testid="auto-banner">
        <strong>{BANNER.tag}</strong>
        <span>{BANNER.note}</span>
        <a href="/lab/episode/fomc">{BANNER.hand}</a>
      </p>
      {AUTO ? (
        <Episode ep={AUTO} Art={CoverArt} Glyph={Glyph} />
      ) : (
        <div className="auto-broken">
          <p>{BANNER.broken}</p>
          <ul>
            {AUTO_ERRORS.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
