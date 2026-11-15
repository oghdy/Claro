// 표지 그림 — 정유소 탱크 위에 천장 (들보)이 걸려 있고, 그 천장은 주유기 앞에서 끝난다. 주유소의 가격표는 천장 밖에 서 있다.
// "≠" 가 이 회차의 그림말이다 (배달앱의 "=" · 개인정보의 "≠" 자리) — 풀이의 "석유 최고가격 ≠ 주유소 가격표의 천장"으로 이어진다. 천장이 끝나는 자리에 놓았다.
// 점선은 기름이 정유사에서 주유소로 넘어가는 길 (체험의 사슬). 글자 · 숫자 없음 (F-E5 — 주유소 쪽에 값을 그리지 않는다). 새 색 없음 — 종이 토큰의 것만. 꾸밈이라 읽기 도구에는 숨긴다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 168" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="152" rx="132" ry="9" className="ep-art-shadow" />
      {/* 정유소 탱크 */}
      <path d="M46 70c0-9 19-16 42-16s42 7 42 16v60c0 9-19 16-42 16s-42-7-42-16Z" className="ep-art-phone" />
      <path d="M46 70c0 9 19 16 42 16s42-7 42-16" fill="none" className="ep-art-tagline" />
      <path d="M62 100v30M72 104v30" fill="none" className="ep-art-steam" />
      {/* 천장 — 탱크 위에 걸린 들보. 주유기 앞에서 끝난다 */}
      <path d="M58 33v18M118 33v15" fill="none" className="ep-art-steam" />
      <rect x="30" y="22" width="176" height="11" rx="5.5" className="ep-art-tag" />
      {/* 정유사 → 주유소 */}
      <path d="M132 126h92" className="ep-art-chain" />
      {/* 주유기 — 천장 밖 */}
      <g transform="rotate(4 256 96)">
        <rect x="230" y="58" width="50" height="88" rx="9" className="ep-art-bowl" />
        <rect x="239" y="68" width="32" height="20" rx="4" className="ep-art-tag" />
        <path d="M246 78h18" className="ep-art-tagline" />
        <path d="M280 84c14 0 14 8 14 20v18c0 8-10 8-10 0v-12" fill="none" className="ep-art-tagline" />
        <rect x="224" y="144" width="62" height="6" rx="3" className="ep-art-ink" />
        {/* 가격표 — 천장보다 높이 서 있다 */}
        <path d="M255 58V30" className="ep-art-tagline" />
        <rect x="238" y="10" width="34" height="22" rx="5" className="ep-art-phone" />
        <path d="M246 21h18" className="ep-art-tagline" />
      </g>
      {/* 같지 않다 — 천장이 끝나는 자리 */}
      <circle cx="206" cy="28" r="19" className="ep-art-eq" />
      <path d="M197 23.5h18M197 32.5h18M212 17l-12 22" className="ep-art-eqline" />
    </svg>
  );
}
