// 표지 그림 — 정보가 든 통에서 점선이 새어 나가고, 옆에서는 알림 종이 울리고 있다.
// "≠" 가 이 회차의 그림말이다 (배달앱의 "=" · 금리의 "‖" 자리) — 풀이의 "털렸다 ≠ 벌받는다"로 이어진다.
// 글자 · 숫자 없음. 꾸밈이라 읽기 도구에는 숨긴다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 168" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="152" rx="132" ry="9" className="ep-art-shadow" />
      {/* 정보가 든 통 */}
      <path d="M58 50c0-10 19-18 42-18s42 8 42 18v72c0 10-19 18-42 18s-42-8-42-18Z" className="ep-art-phone" />
      <path d="M58 50c0 10 19 18 42 18s42-8 42-18M58 74c0 10 19 18 42 18s42-8 42-18M58 98c0 10 19 18 42 18s42-8 42-18" className="ep-art-line" />
      {/* 새어 나가는 길 */}
      <path d="M142 108h110" className="ep-art-chain" />
      {/* 알림 종 */}
      <g transform="rotate(9 246 76)">
        <path d="M246 34c-17 0-27 13-27 31v22l-9 13h72l-9-13V65c0-18-10-31-27-31Z" className="ep-art-bowl" />
        <path d="M239 108a7.5 7.5 0 0 0 14 0" className="ep-art-line" />
        <circle cx="246" cy="30" r="4.5" className="ep-art-ink" />
      </g>
      <path d="M204 44c-7 11-8 25-3 37M292 52c6 12 5 26-2 37" className="ep-art-ring" />
      {/* 같지 않다 */}
      <circle cx="184" cy="108" r="19" className="ep-art-eq" />
      <path d="M175 103.5h18M175 112.5h18M190 97l-12 22" className="ep-art-eqline" />
    </svg>
  );
}
