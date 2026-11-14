// 표지 그림 — 같은 막대 둘 (낮은 것 · 높은 것)을 자 둘이 잰다: 옆의 자는 늘어난 높이만, 아래의 자는 원래 높이에 견줘. 가운데 "≠". 글자 · 숫자 없음.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 120" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="110" rx="118" ry="7" className="ep-art-shadow" />
      <rect x="74" y="48" width="44" height="56" rx="6" className="ep-art-phone" />
      <rect x="134" y="26" width="44" height="78" rx="6" className="ep-art-bowl" />
      <path d="M134 48h44" className="lt-art-mark" />
      <path d="M192 26v22M186 26h12M186 48h12" className="ep-art-tagline" />
      <path d="M196 37h28" className="ep-art-chain" />
      <circle cx="244" cy="37" r="17" className="ep-art-eq" />
      <path d="M236 33h16M236 41h16M249 27l-10 20" className="ep-art-eqline" />
    </svg>
  );
}
