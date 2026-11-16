// 표지 그림 — **물음의 그림** (F-E6 · D125 · 이야기 짜는 법 5 "답을 먼저 보이지 않는다" · D112 · UX-10 i).
// 천장 (최고가격의 선)이 왼쪽 화면 밖에서 들어와 주유기 쪽으로 간다. 주유기 (가격표)도 같이 있다. **천장이 어디까지 닿는지는 그리지 않았다** —
// 주유기 위에서는 점선이고 (오른쪽 화면 밖으로 이어진다), 가격표 위에 물음표 하나가 있다. 제목의 물음 ("주유소 값도 못 넘을까요")이 이 그림의 말이다.
// 앞의 그림 (F-E5 — 정유소 탱크 위의 천장이 주유기 앞에서 끝나고 "≠")은 답을 그렸다 → 뺐다: 탱크 (천장이 누구 위에 있는지) · 끝나는 자리 · ≠.
// 왼쪽의 차는 기름을 넣으러 온 독자의 자리다 (정유사 · 주유소 어느 쪽도 아니다). 글자 · 숫자 없음 · ≠ / = 없음. 새 색 없음 — 종이 토큰의 것만 (지난 그림들과 같은 클래스 · 같은 선 굵기). 꾸밈이라 읽기 도구에는 숨긴다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 168" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="152" rx="132" ry="9" className="ep-art-shadow" />
      {/* 천장 — 화면 밖에서 들어온 들보. 주유기 쪽으로는 점선 (닿는지 모른다) */}
      <path d="M152 27.5h180" className="ep-art-chain" />
      <rect x="-14" y="22" width="156" height="11" rx="5.5" className="ep-art-tag" />
      {/* 차 — 기름을 넣으러 온 사람 */}
      <path d="M32 136v-15c0-6 4-10 10-11l17-3 12-18c2-3 6-5 10-5h27c5 0 9 2 11 6l10 17 16 4c6 1 9 5 9 11v14Z" className="ep-art-phone" />
      <path d="M80 106l9-13h23l8 13Z" className="ep-art-tag" />
      <path d="M44 121h8" className="ep-art-tagline" />
      <circle cx="62" cy="137" r="10.5" className="ep-art-phone" />
      <circle cx="62" cy="137" r="2.6" className="ep-art-ink" />
      <circle cx="126" cy="137" r="10.5" className="ep-art-phone" />
      <circle cx="126" cy="137" r="2.6" className="ep-art-ink" />
      {/* 주유기와 가격표 */}
      <g transform="rotate(3 256 96)">
        <rect x="230" y="78" width="50" height="68" rx="9" className="ep-art-bowl" />
        <rect x="239" y="88" width="32" height="18" rx="4" className="ep-art-tag" />
        <path d="M246 97h18" className="ep-art-tagline" />
        <path d="M230 102c-14 0-14 8-14 18v14c0 8 10 8 10 0v-10" fill="none" className="ep-art-tagline" />
        <rect x="224" y="144" width="62" height="6" rx="3" className="ep-art-ink" />
        <path d="M255 78V66" className="ep-art-tagline" />
        <rect x="238" y="46" width="34" height="21" rx="5" className="ep-art-phone" />
        <path d="M246 56.5h18" className="ep-art-tagline" />
      </g>
      {/* 물음 — 천장이 여기까지 닿을까 */}
      <circle cx="258" cy="27" r="16" className="ep-art-eq" />
      <path d="M252.5 22.5c0-3.6 2.6-5.8 5.6-5.8s5.6 2 5.6 5.2c0 4-5.4 4.2-5.4 8.4M258.3 35.6v.2" fill="none" className="ep-art-eqline" />
    </svg>
  );
}
