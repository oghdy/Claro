// 표지 그림 — 가입 칸이 있는 작은 창에서 점선이 새어 나간다. 긴 이야기 (개인정보 1화)의 "≠" 를 잇는다. 글자 · 숫자 없음.
// UX-7 의 짧은 이야기 시안 (lab/today/short/Short.tsx)에 있던 그림 그대로 — F-E2 에서 이 이야기의 폴더로 꺼냈다.
export function CoverArt() {
  return (
    <svg viewBox="0 0 320 120" role="presentation" aria-hidden="true" className="ep-art">
      <ellipse cx="160" cy="110" rx="118" ry="7" className="ep-art-shadow" />
      <rect x="62" y="18" width="118" height="84" rx="12" className="ep-art-phone" />
      <path d="M62 40h118" className="ep-art-line" />
      <path d="M78 56h64M78 70h86M78 84h44" className="ep-art-line" />
      <path d="M180 78h84" className="ep-art-chain" />
      <circle cx="222" cy="78" r="17" className="ep-art-eq" />
      <path d="M214 74h16M214 82h16M227 68l-10 20" className="ep-art-eqline" />
    </svg>
  );
}
