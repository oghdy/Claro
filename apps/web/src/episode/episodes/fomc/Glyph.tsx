// 도구 카드의 작은 그림 — 이 회차의 것 (F-E2 에서 index.tsx 밖으로 꺼냈다 · 글자는 그대로: 이야기 목록 catalog.tsx 가 화면 뼈대 없이 그림만 읽는다).
/** 도구 카드의 작은 그림 — 지난 값 견본 (../carry-sample) · 3화 주소 (../../rate-3)도 같은 그림을 쓴다 (같은 시리즈 · 같은 도구 key) */
export function Glyph({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  // 기준금리 — 페달
  if (id === "rate")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="7" y="4.5" width="10" height="11" rx="2.5" transform="rotate(-10 12 10)" />
        <path d="M12 16v4M8.5 20h7" />
      </svg>
    );
  // 물가 목표 — 눈금과 바늘
  if (id === "target")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <path d="M4 16a8 8 0 0 1 16 0" />
        <path d="M12 16l4.5-5.5" />
        <path d="M9 8.6l-.8-1.9" />
      </svg>
    );
  // 표결 — 여럿과 둘
  if (id === "vote")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="6" cy="9" r="1.6" />
        <circle cx="11" cy="9" r="1.6" />
        <circle cx="6" cy="15" r="1.6" />
        <circle cx="11" cy="15" r="1.6" />
        <circle cx="18.5" cy="12" r="1.6" fill="currentColor" />
      </svg>
    );
  // 금융 여건 — 가운데 고리
  if (id === "conditions")
    return (
      <svg viewBox="0 0 24 24" {...s}>
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="19" cy="12" r="2" />
        <path d="M7 12h2M15 12h2" />
      </svg>
    );
  // 점도표 — 점들
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 20V4M4 20h16" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" />
      <circle cx="13" cy="10" r="1.2" fill="currentColor" />
      <circle cx="13" cy="14" r="1.2" fill="currentColor" />
      <circle cx="17" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}
