import { color, effect, font, layout, motion, paper, paperLayout, radius, space, type } from "./values";

// 토큰 → CSS 변수. 웹만 쓴다. 이름: --c-* 색 (옛 화면 — 다크) · --p-* 종이 톤 (회차 화면 · 첫 화면 — F-E1) · --t-{이름}-{size|line|weight} 글자 · --s-* 간격 · --r-* 모서리 · --m-* 움직임.
// 값을 여기서 다시 적지 않는다 — 전부 values.ts 에서 온다.

const kebab = (s: string) => s.replace(/[A-Z]+/g, (m) => `-${m.toLowerCase()}`);

export function cssVariables(): string {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(color)) out.push([`--c-${kebab(k)}`, v]);
  for (const [k, v] of Object.entries(paper)) out.push([`--p-${kebab(k)}`, v]);
  out.push(["--p-page-x", `${paperLayout.pageX}px`], ["--p-column", `${paperLayout.column}px`]);
  out.push(["--font", font.family.map((f) => (/[^a-z-]/i.test(f) ? `"${f}"` : f)).join(", ")]);
  for (const [k, v] of Object.entries(font.tracking)) out.push([`--track-${k}`, `${v}em`]);
  for (const [k, v] of Object.entries(type)) {
    out.push([`--t-${kebab(k)}-size`, `${v.size}px`], [`--t-${kebab(k)}-line`, `${v.line}`], [`--t-${kebab(k)}-weight`, `${v.weight}`]);
  }
  for (const [k, v] of Object.entries(space)) out.push([`--s-${kebab(k)}`, `${v}px`]);
  for (const [k, v] of Object.entries(radius)) out.push([`--r-${k}`, `${v}px`]);
  out.push(["--column", `${layout.column}px`]);
  for (const [k, v] of Object.entries(motion.duration)) out.push([`--m-${k}`, `${v}ms`]);
  for (const [k, v] of Object.entries(motion.ease)) out.push([`--m-ease-${k}`, `cubic-bezier(${v.join(", ")})`]);
  out.push(["--press-scale", `${effect.pressScale}`]);
  return `:root{${out.map(([k, v]) => `${k}:${v}`).join(";")}}`;
}
