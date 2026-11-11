// 표지 그림 — 두 앱, 같은 값. "=" 가 이 회차의 그림말이다 (풀이 장면의 묶인 값 · 뒤집어 보기에서 다시 나온다).
// 글자 · 숫자 없음. 꾸밈이라 읽기 도구에는 숨긴다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 168" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="152" rx="132" ry="9" className="ep-art-shadow" />
      {/* 왼쪽 앱 */}
      <g transform="rotate(-5 92 84)">
        <rect x="52" y="14" width="80" height="136" rx="14" className="ep-art-phone" />
        <rect x="80" y="21" width="24" height="5" rx="2.5" className="ep-art-ink" />
        <path d="M70 78h44a22 22 0 0 1-44 0Z" className="ep-art-bowl" />
        <path d="M82 66c-3-5 3-7 0-12M92 66c-3-5 3-7 0-12M102 66c-3-5 3-7 0-12" className="ep-art-steam" />
        <rect x="68" y="114" width="48" height="20" rx="10" className="ep-art-tag" />
        <circle cx="79" cy="124" r="3" className="ep-art-hole" />
        <path d="M88 124h20" className="ep-art-tagline" />
      </g>
      {/* 오른쪽 앱 */}
      <g transform="rotate(5 228 84)">
        <rect x="188" y="14" width="80" height="136" rx="14" className="ep-art-phone" />
        <rect x="216" y="21" width="24" height="5" rx="2.5" className="ep-art-ink" />
        <path d="M206 78h44a22 22 0 0 1-44 0Z" className="ep-art-bowl" />
        <path d="M218 66c-3-5 3-7 0-12M228 66c-3-5 3-7 0-12M238 66c-3-5 3-7 0-12" className="ep-art-steam" />
        <rect x="204" y="114" width="48" height="20" rx="10" className="ep-art-tag" />
        <circle cx="215" cy="124" r="3" className="ep-art-hole" />
        <path d="M224 124h20" className="ep-art-tagline" />
      </g>
      {/* 같은 값 */}
      <path d="M118 124h84" className="ep-art-chain" />
      <circle cx="160" cy="124" r="19" className="ep-art-eq" />
      <path d="M151 119.5h18M151 128.5h18" className="ep-art-eqline" />
    </svg>
  );
}
