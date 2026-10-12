// 디자인 토큰 (D1: 웹과 앱이 공유하는 것은 토큰뿐이다 — 화면 컴포넌트는 공유하지 않는다).
// 값은 전부 플랫폼 중립이다: 길이는 px 숫자(= RN 의 dp), 시간은 ms, 곡선은 cubic-bezier 네 숫자, 스프링은 물리값.
// 웹은 css.ts 가 CSS 변수로 옮기고(Motion 은 motion 을 그대로 읽는다), 앱(Expo · Reanimated)은 이 객체를 그대로 읽는다.
// 겉모습의 근거: D26 — 다크 · 고딕 · 제목 26 · 본문 16.5 · 물음 버튼 17. 그 밖의 값은 /lab/b5 에서 도윤이 본 그대로 옮겼다.

/** 색 — 바탕 · 면 두 단계 · 글 세 단계 · 선. 뜻에 따라 바뀌는 색은 없다 (D20: 판단을 싣는 색 금지) */
export const color = {
  bg: "#0f1113",
  surface: "#1a1d21",
  surface2: "#24282d",
  ink: "#ecebe6",
  muted: "#9ca1a7",
  faint: "#6b7076",
  /** ink 의 12% — 가는 선 */
  rule: "rgba(236, 235, 230, 0.12)",
  /** 물음 버튼: 면 = ink, 글 = bg (D26 "하얀 물음 버튼") */
  askFace: "#ecebe6",
  askInk: "#0f1113",
} as const;

export const font = {
  /** 고딕. 웹은 Pretendard Variable 을 직접 싣는다. 앱은 같은 글꼴 파일을 싣는다 */
  family: ["Pretendard Variable", "Pretendard", "-apple-system", "Apple SD Gothic Neo", "sans-serif"],
  /** 자간 (em) */
  tracking: { body: -0.01, headline: -0.025, value: -0.02 },
} as const;

/** 글자 — size(px) · line(배수) · weight */
export const type = {
  headline: { size: 26, line: 1.36, weight: 750 }, // D26
  body: { size: 16.5, line: 1.72, weight: 400 }, // D26
  ask: { size: 17, line: 1.45, weight: 700 }, // D26 — 물음 버튼. 누른 물음(머리)도 같은 글자다: 같은 글이 그대로 올라간다
  conclusion: { size: 21, line: 1.55, weight: 700 },
  secondary: { size: 14.5, line: 1.65, weight: 400 },
  quote: { size: 16, line: 1.65, weight: 400 },
  item: { size: 15.5, line: 1.55, weight: 400 },
  value: { size: 28, line: 1.25, weight: 800 },
  sheetValue: { size: 15, line: 1.45, weight: 700 },
  label: { size: 12.5, line: 1.45, weight: 600 },
  kicker: { size: 13, line: 1.4, weight: 700 }, // 장의 이름표 — 본문보다 먼저 눈에 들어오되 제목을 넘지 않는다
  caption: { size: 12, line: 1.4, weight: 600 }, // 인용의 출처 · 대조의 라벨
  ui: { size: 12.5, line: 1, weight: 600 },
  note: { size: 14, line: 1.5, weight: 400 },
  tag: { size: 10, line: 1.1, weight: 700 },
} as const;

/** 간격 (px) */
export const space = {
  /** 장의 안쪽 여백 */
  pageX: 20,
  pageTop: 18,
  pageBottom: 22,
  /** 블록 사이 · 문단 사이 */
  block: 16,
  para: 13,
  /** 제목 아래 · kicker 아래 */
  headlineAfter: 22,
  kickerAfter: 14,
  /** 누른 물음(머리) 아래 — 선까지(= askPad: 버튼의 면이 걷히면 그 아래 끝이 선이 된다) · 선에서 글까지 */
  askedRule: 18,
  askedAfter: 18,
  /** 글 끝에서 물음 버튼까지 (최소) */
  endBefore: 24,
  /** 물음 버튼 안쪽 */
  askPad: 18,
  askGap: 12,
  askArrow: 20,
  /** 면(인용 · 대조 · 표)의 안쪽 */
  cardPad: 14,
} as const;

/** 누름 · 물러남의 크기 (배수) · 나타날 때의 흐림 (px) */
export const effect = { pressScale: 0.97, leaveScale: 0.985, enterBlur: 5 } as const;

export const radius = { ask: 14, card: 12, control: 8, chip: 6, tag: 4, frame: 22 } as const;

/** 읽는 폭의 최대값 (px). 넓은 화면에서도 한 줄이 길어지지 않게 */
export const layout = { column: 440 } as const;

export type Bezier = readonly [number, number, number, number];
export interface Spring {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/** 움직임 — 시간(ms) · 곡선 · 스프링. Motion(웹)과 Reanimated(앱)가 같은 숫자를 쓴다 */
export const motion = {
  duration: {
    /** 누름 반응 */
    press: 120,
    /** 물음을 누른 뒤 답의 첫 덩이가 나오기까지 — 물음이 자리에 거의 닿을 때 */
    answer: 380,
    /** 읽던 글이 물러난다 */
    leave: 240,
    /** 글 한 덩이가 나타난다 */
    appear: 380,
    /** 물음이 머리 자리로 간다 (곡선으로 갈 때) */
    travel: 520,
    /** 버튼의 면이 걷힌다 */
    drain: 440,
    /** 지나온 길 · 층 설명이 뜬다 */
    panel: 220,
    /** 마지막 장 — 요점 문장이 혼자 서 있는 시간 */
    rest: 600,
  },
  /** 덩이와 덩이 사이 */
  stagger: { tight: 40, base: 85 },
  ease: {
    /** 나타날 때 — 빨리 나와 천천히 선다 */
    out: [0.2, 0.7, 0.2, 1],
    /** 물러날 때 */
    in: [0.4, 0, 1, 1],
    /** 한 면이 통째로 움직일 때 */
    glide: [0.32, 0.72, 0, 1],
  },
  spring: {
    /** 물음이 올라간다 — 천천히 떠올라 넘치지 않고 선다 (0.7초쯤) */
    lift: { stiffness: 150, damping: 25, mass: 1 },
    /** 글이 자리에 앉는다 */
    settle: { stiffness: 190, damping: 27, mass: 1 },
  },
} as const satisfies {
  duration: Record<string, number>;
  stagger: Record<string, number>;
  ease: Record<string, Bezier>;
  spring: Record<string, Spring>;
};

export const tokens = { color, font, type, space, radius, layout, motion, effect } as const;
export type Tokens = typeof tokens;
