// 제 그림이 없는 이야기의 기본 그림 (F-E2) — 손으로 그린 표지 · 도구 그림 없이 목록에 들어온 이야기 (파이프라인이 낸 것)가 쓴다.
// 뜻을 싣지 않는다: 문서 한 장과 물음 하나. 글자 · 숫자 없음. 이야기마다의 그림은 사람이 그려 목록의 줄에 붙인다 (catalog.tsx).
export function PlainArt() {
  return (
    <svg viewBox="0 0 320 120" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="110" rx="118" ry="7" className="ep-art-shadow" />
      <rect x="92" y="14" width="96" height="88" rx="12" className="ep-art-phone" />
      <path d="M108 38h64M108 54h64M108 70h40" className="ep-art-line" />
      <path d="M188 78h30" className="ep-art-chain" />
      <circle cx="236" cy="78" r="17" className="ep-art-eq" />
      <path d="M231 73c0-7 10-7 10 0 0 4-5 4-5 8M236 86v.5" className="ep-art-eqline" />
    </svg>
  );
}

/** 도구 카드의 작은 그림 — 어느 도구에나 같은 표시 (줍는 점 하나) */
export function PlainGlyph(_: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
