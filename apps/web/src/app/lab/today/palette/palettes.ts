// UX-7 · UX-7b — 색 시안 + 지금의 종이 톤. **lab 전용이다.** `packages/tokens` 의 paper 는 그대로다 — 도윤이 고르면 그때 토큰으로 옮긴다.
// UX-7b (D82 · D83): 도윤은 종이를 골랐다 (따뜻 · 부드러움 · 눈이 덜 피곤) — 그런데 종이는 Claude 결이다. 그래서 **따뜻하고 부드럽되 Claude 결이 아닌 셋** (미색 · 쑥 · 형광펜)을 더했다.
// 스위치에는 종이 + 새 셋이 보인다. UX-7 의 신문 · 안개 · 밤은 견본으로 남는다 — 스위치에는 없고 주소의 ?c=news · mist · night 로 열린다 (그때만 스위치에 한 칸 더 보인다).
// 칸은 토큰 paper 와 같은 열둘 + 셋 (회차 화면의 CSS 에 글자 그대로 적혀 있던 색 — overrides.css 가 변수로 바꿔 덮는다):
//   onAccent     강조색 면 위의 글 (지금은 #fff)
//   accentOnInk  먹색 면 (물음 버튼 · 오늘의 한 줄) 위의 강조 (지금은 #f0a184)
//   shade        그림자의 색 (밝은 바탕은 먹색 · 밤 바탕은 검정)
//   hl           형광펜 (있는 색에만 — "아!" 순간의 밑줄. 어디에 칠하는지는 marker.css)
// 색이 가르는 것은 그대로 "새것 / 알던 것" 하나뿐이다 (D20): accent = 새것 · 지금 · 누를 것 · moss = 알던 것.
// 피한 결 (Claude 결): **채도 있는** 크림 · 베이지 바탕 · 테라코타 · 코랄 · 주황 강조. 대비는 check.ts 가 재서 AA (4.5) 아래면 멈춘다.
// 눈 피로 (새 셋 · soft): 본문 대비를 최대로 하지 않는다 — check.ts T7 이 본문 대비 범위 · 바탕 밝기 · 바탕 채도를 본다.
import { paper } from "@claro/tokens";

export interface Palette {
  paper: string;
  card: string;
  ink: string;
  ink2: string;
  muted: string;
  rule: string;
  rule2: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  moss: string;
  mossSoft: string;
  onAccent: string;
  accentOnInk: string;
  shade: string;
  /** 형광펜 — 있는 색에서만 "아!" 순간에 밑줄이 그어진다 */
  hl?: string;
}

export type PaletteId = "paper" | "hanji" | "ssuk" | "marker" | "news" | "mist" | "night";

export interface PaletteEntry {
  id: PaletteId;
  /** 스위치에 보이는 이름 — 도윤이 "안개로" 하고 고를 수 있게 짧게 */
  name: string;
  /** 한 줄 */
  note: string;
  /** 스위치에 늘 보이나 — false 면 주소의 ?c= 로 열었을 때만 보인다 (UX-7 의 견본 셋) */
  dock: boolean;
  /** UX-7b 의 눈 피로 기준을 지켜야 하는 색 (따뜻하고 부드러운 셋) */
  soft: boolean;
  /** 종이 결 — 바탕에 아주 옅은 결을 깐다 (글이 놓이는 면에는 깔지 않는다) */
  grain: boolean;
  colors: Palette;
}

export const PALETTES: readonly PaletteEntry[] = [
  {
    id: "paper",
    name: "종이",
    note: "지금 — 따뜻한 종이 · 먹 · 감색",
    dock: true,
    soft: false,
    grain: false,
    // 지금의 값 — 토큰 그대로. 이 색이 켜져 있으면 html 에 data-palette 가 없다 (덮는 규칙이 하나도 걸리지 않는다)
    colors: { ...paper, onAccent: "#ffffff", accentOnInk: "#f0a184", shade: paper.ink },
  },
  {
    id: "hanji",
    name: "미색",
    note: "한지 — 노란 기운을 뺀 미색 종이 · 먹 · 청록 하나",
    dock: true,
    soft: true,
    grain: true,
    colors: {
      paper: "#f1eee8",
      card: "#faf8f4",
      ink: "#2b2a28",
      ink2: "#4a4844",
      muted: "#6c6963",
      rule: "rgba(43, 42, 40, 0.14)",
      rule2: "rgba(43, 42, 40, 0.07)",
      accent: "#17777a",
      accentInk: "#0f6467",
      accentSoft: "#d9e9e6",
      moss: "#6b5a45",
      mossSoft: "#e9e2d6",
      onAccent: "#ffffff",
      accentOnInk: "#86d6d0",
      shade: "#2b2a28",
    },
  },
  {
    id: "ssuk",
    name: "쑥",
    note: "오래된 책 — 아주 연한 쑥색 종이 · 짙은 풀먹 · 남색 하나",
    dock: true,
    soft: true,
    grain: true,
    colors: {
      paper: "#e9ece2",
      card: "#f5f7f0",
      ink: "#262a23",
      ink2: "#454b40",
      muted: "#636a5d",
      rule: "rgba(38, 42, 35, 0.15)",
      rule2: "rgba(38, 42, 35, 0.07)",
      accent: "#334a94",
      accentInk: "#2b4086",
      accentSoft: "#dde3f0",
      moss: "#52642e",
      mossSoft: "#dde5cc",
      onAccent: "#ffffff",
      accentOnInk: "#b3c3f5",
      shade: "#262a23",
    },
  },
  {
    id: "marker",
    name: "형광펜",
    note: "따뜻한 회색 공책 · 남색 글씨 · “아!” 에만 형광펜",
    dock: true,
    soft: true,
    grain: false,
    colors: {
      paper: "#eceae6",
      card: "#f8f7f4",
      ink: "#222630",
      ink2: "#424753",
      muted: "#5f646f",
      rule: "rgba(34, 38, 48, 0.15)",
      rule2: "rgba(34, 38, 48, 0.07)",
      accent: "#2c4391",
      accentInk: "#263b82",
      accentSoft: "#dfe3ee",
      moss: "#3f6558",
      mossSoft: "#dbe6e0",
      onAccent: "#ffffff",
      accentOnInk: "#ffe24a",
      shade: "#222630",
      hl: "#ffe24a",
    },
  },
  {
    id: "news",
    name: "신문",
    note: "흰 종이 · 검은 잉크 · 코발트 파랑 하나",
    dock: false,
    soft: false,
    grain: false,
    colors: {
      paper: "#ffffff",
      card: "#f3f4f6",
      ink: "#0e0f12",
      ink2: "#33363d",
      muted: "#62666f",
      rule: "rgba(14, 15, 18, 0.16)",
      rule2: "rgba(14, 15, 18, 0.08)",
      accent: "#1f44e0",
      accentInk: "#1a3ac4",
      accentSoft: "#e3e9ff",
      moss: "#0f6b4f",
      mossSoft: "#dcefe7",
      onAccent: "#ffffff",
      accentOnInk: "#9db2ff",
      shade: "#0e0f12",
    },
  },
  {
    id: "mist",
    name: "안개",
    note: "서늘한 회청 · 짙은 남색 · 산딸기색 하나",
    dock: false,
    soft: false,
    grain: false,
    colors: {
      paper: "#e6ecf1",
      card: "#f4f7fa",
      ink: "#13213a",
      ink2: "#34425c",
      muted: "#57647a",
      rule: "rgba(19, 33, 58, 0.15)",
      rule2: "rgba(19, 33, 58, 0.08)",
      accent: "#b3245a",
      accentInk: "#a01c4e",
      accentSoft: "#f6dbe6",
      moss: "#1c5a78",
      mossSoft: "#d2e3ee",
      onAccent: "#ffffff",
      accentOnInk: "#ff9dc0",
      shade: "#13213a",
    },
  },
  {
    id: "night",
    name: "밤",
    note: "밤하늘 남색 · 밝은 글 · 연두 불빛 하나",
    dock: false,
    soft: false,
    grain: false,
    colors: {
      paper: "#0f1524",
      card: "#18203a",
      ink: "#eef1f7",
      ink2: "#c5cbda",
      muted: "#98a1b6",
      rule: "rgba(238, 241, 247, 0.16)",
      rule2: "rgba(238, 241, 247, 0.09)",
      accent: "#b9f26a",
      accentInk: "#b9f26a",
      accentSoft: "#26361f",
      moss: "#8fc2ff",
      mossSoft: "#1c2d4d",
      onAccent: "#0f1524",
      accentOnInk: "#2f6a00",
      shade: "#000000",
    },
  },
];

/** 형광펜이 올라가는 짝 — hl 이 있는 색에서만 잰다 (글 위에 형광펜이 겹친다) */
export const HL_PAIRS: readonly (readonly [Exclude<keyof Palette, "hl">, string])[] = [
  ["ink", "본문 — 형광펜"],
  ["accentInk", "강조 글 — 형광펜 (★ 칸의 이름)"],
];

export const paletteOf = (id: string | null | undefined): PaletteEntry | undefined => PALETTES.find((p) => p.id === id);

/** 대비를 재는 짝 — [글, 바탕, 무엇]. 전부 AA (4.5 : 1) 이상이어야 한다. 화면에서 실제로 글 · 그림말이 올라가는 짝이다 */
type Slot = Exclude<keyof Palette, "hl">;
export const CONTRAST_PAIRS: readonly (readonly [Slot, Slot, string])[] = [
  ["ink", "paper", "본문 — 바탕"],
  ["ink", "card", "본문 — 면"],
  ["ink2", "paper", "둘째 글 — 바탕"],
  ["ink2", "card", "둘째 글 — 면"],
  ["muted", "paper", "옅은 글 — 바탕"],
  ["muted", "card", "옅은 글 — 면"],
  ["accentInk", "paper", "강조 글 — 바탕"],
  ["accentInk", "card", "강조 글 — 면"],
  ["accentInk", "accentSoft", "강조 글 — 옅은 강조 면"],
  ["ink", "accentSoft", "본문 — 옅은 강조 면"],
  ["onAccent", "accent", "강조 면 위의 글 (★ · 누를 것 · 지도의 새 개념)"],
  ["moss", "paper", "알던 것 — 바탕"],
  ["moss", "card", "알던 것 — 면"],
  ["moss", "mossSoft", "알던 것 — 옅은 면"],
  ["ink", "mossSoft", "본문 — 옅은 알던 것 면"],
  ["paper", "ink", "물음 버튼 (먹색 면 위의 글)"],
  ["accentOnInk", "ink", "물음 버튼 · 오늘의 한 줄의 강조"],
];

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
/** WCAG 2 대비 (1 ~ 21) */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const kebab = (s: string) => s.replace(/[A-Z]+/g, (m) => `-${m.toLowerCase()}`);

/**
 * 색 시안의 CSS — lab 의 layout 이 <style> 로 싣는다. 종이 (지금)는 규칙이 없다.
 * 회차 화면은 `.ep-root` 에서 `--ep-*: var(--p-*)` 로 받으므로, 더 센 선택자로 `--ep-*` 를 바로 적는다. 토큰 변수 (--p-*)는 건드리지 않는다.
 */
export function paletteCss(): string {
  return PALETTES.filter((p) => p.id !== "paper")
    .map(({ id, colors, grain }) => {
      const vars = Object.entries(colors)
        .map(([k, v]) => `--ep-${kebab(k)}:${v}`)
        .join(";");
      // 종이 결 — 바탕 (.ep-root)에만. 면 (카드)은 제 바탕색으로 덮여 있어 글 밑에는 결이 없다
      const paperGrain = grain ? `html[data-palette="${id}"] .ep-root{background-image:${GRAIN}}` : "";
      return `html[data-palette="${id}"]:has(.ep-root),html[data-palette="${id}"]:has(.ep-root) body{background:${colors.paper}}html[data-palette="${id}"] .ep-root{${vars}}${paperGrain}`;
    })
    .join("");
}

/** 종이 결 — 섬유 같은 아주 옅은 얼룩 (먹색 · 불투명도 5%). 가로로 조금 긴 결이다 (한지 · 오래된 책 종이) */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.16  0 0 0 0 0.14  0 0 0 0.9 -0.42"/></filter><rect width="240" height="240" filter="url(#g)" opacity="0.1"/></svg>',
)}")`;

/** 주소의 ?c=<id> 또는 이 탭에서 고른 색 (sessionStorage — 탭을 닫으면 사라진다. 독자 기록이 아니다) */
export const PALETTE_KEY = "claro-lab-palette";
/** /lab/today 를 거쳐 온 탭 — 회차 시안 화면에도 색 스위치를 띄운다 */
export const DOCK_KEY = "claro-lab-dock";

/** 첫 그림 전에 색을 건다 (깜빡임 없이). layout 이 <script> 로 싣는다 */
export const PALETTE_BOOT = `(function(){try{var ids=${JSON.stringify(PALETTES.map((p) => p.id))};var q=new URLSearchParams(location.search).get("c");var s=sessionStorage;if(q&&ids.indexOf(q)>=0){s.setItem("${PALETTE_KEY}",q);s.setItem("${DOCK_KEY}","1")}var c=s.getItem("${PALETTE_KEY}");var h=document.documentElement;if(c&&c!=="paper"&&ids.indexOf(c)>=0)h.setAttribute("data-palette",c);if(s.getItem("${DOCK_KEY}"))h.setAttribute("data-dock","")}catch(e){}})()`;
