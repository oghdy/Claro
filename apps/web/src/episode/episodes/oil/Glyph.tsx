// 도구 카드의 작은 그림 — 「기름값은 어디서 묶이나」 의 도구 다섯 (cap · supply · notice · scope · settle). 지난 셋 (delivery · fomc · pipc)과 같은 결: 24 칸 · 선 굵기 1.8 · 글자 · 숫자 없음.
export function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  // 최고가격 — 천장 선과 그 아래에서 멈추는 화살
  if (id === "cap")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M4 6.5h16" />
        <path d="M12 19v-8M8.5 14l3.5-3.5 3.5 3.5" />
      </svg>
    );
  // 공급가격과 판매가격 — 값표 둘 (넘기는 값 · 파는 값)
  if (id === "supply")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="3.5" y="7" width="7" height="10" rx="2" />
        <rect x="13.5" y="7" width="7" height="10" rx="2" />
        <path d="M10.5 12h3" />
      </svg>
    );
  // 고시 — 문서 한 장
  if (id === "notice")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="5.5" y="3.5" width="13" height="17" rx="2.5" />
        <path d="M9 9h6M9 12.5h6M9 16h3.5" />
      </svg>
    );
  // 묶이는 자리 — 꺾쇠가 덮는 칸과 그 밖의 점
  if (id === "scope")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M3.5 10V6.5h10V10" />
        <circle cx="8.5" cy="15.5" r="2.6" />
        <circle cx="18.5" cy="15.5" r="2.6" strokeDasharray="2.4 2.4" />
      </svg>
    );
  // 손실 보전 — 비운 자리를 되채우는 화살
  if (id === "settle")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M5 13.5V18h14v-4.5" />
        <path d="M12 4.5v9M8.5 10l3.5 3.5 3.5-3.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}
