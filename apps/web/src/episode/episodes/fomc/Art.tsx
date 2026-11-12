// 표지 그림 — 계기판의 바늘은 목표 눈금을 지나 있고, 페달 위에는 "잠깐 멈춤"이 떠 있다.
// "‖" (멈춤)이 이 회차의 그림말이다 — 배달앱 회차의 "=" 자리. 풀이의 "≠" 로 이어진다: 멈춤은 끝이 아니다.
// 글자 · 숫자 없음 (눈금에 값을 적지 않는다 — 지어낸 수 금지). 꾸밈이라 읽기 도구에는 숨긴다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 168" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="152" rx="132" ry="9" className="ep-art-shadow" />
      {/* 계기판 */}
      <path d="M52 132a84 84 0 0 1 168 0Z" className="ep-art-phone" />
      <path d="M72 132a64 64 0 0 1 128 0" className="ep-art-dial" />
      {/* 눈금 — 가운데보다 왼쪽의 굵은 눈금이 목표 */}
      <path d="M84 104l9 5M103 82l6 8M136 70v10M169 82l-6 8M188 104l-9 5" className="ep-art-tick" />
      <path d="M116 73l5 12" className="ep-art-goal" />
      {/* 바늘 — 목표를 지나 오른쪽에 */}
      <path d="M136 132l38-44" className="ep-art-needle" />
      <circle cx="136" cy="132" r="7" className="ep-art-ink" />
      {/* 페달 */}
      <g transform="rotate(8 262 104)">
        <rect x="238" y="62" width="48" height="74" rx="12" className="ep-art-phone" />
        <path d="M248 80h28M248 94h28M248 108h28M248 122h28" className="ep-art-tagline" />
      </g>
      <path d="M262 138v12" className="ep-art-tick" />
      {/* 잠깐 멈춤 */}
      <circle cx="232" cy="52" r="19" className="ep-art-eq" />
      <path d="M226 43.5v17M238 43.5v17" className="ep-art-eqline" />
    </svg>
  );
}
