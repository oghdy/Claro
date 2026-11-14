// UX-7 — 색 시안 (lab 전용). 회차 화면의 CSS (src/episode — **건드리지 않는다**)에는 색 변수 (--ep-*) 말고도 글자 그대로 적힌 색이 있다:
//   #fff (강조색 면 위의 글) · #f0a184 (먹색 면 위의 강조) · rgba(244, 238, 227, a) (먹색 면 위의 종이색) · rgba(30, 26, 22, a) (먹색 그림자 · 옅은 면) · 조용히 톤의 셋.
// 색 시안이 켜졌을 때 (html[data-palette]) 만 그 줄들을 변수로 바꿔 덮는 규칙을 만든다 → overrides.css. 색 시안이 꺼져 있으면 (지금의 종이 톤 · 실제 주소) 이 규칙은 하나도 걸리지 않는다.
//   node src/app/lab/today/palette/gen-overrides.mjs          (apps/web 에서 · 다시 만든다)
//   node src/app/lab/today/palette/gen-overrides.mjs --check  (지금 파일이 최신인가 — check.ts 가 부른다)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const SRC = path.join(HERE, "../../../..");
const FILES = ["episode/episode.css", "episode/kit/frames/frames.css", "episode/episodes/fomc/fomc.css", "episode/episodes/pipc/pipc.css"];

const pct = (a) => `${Math.round(Number(a) * 100)}%`;
/** 글자 그대로 적힌 색 → 변수. 못 바꾼 색이 남으면 멈춘다 (새 색이 생겼다는 뜻) */
function swap(prop, value) {
  const shadow = prop === "box-shadow";
  let v = value
    .replace(/#fff\b/gi, "var(--ep-on-accent)")
    .replace(/#f0a184\b/gi, "var(--ep-accent-on-ink)")
    .replace(/#453d34\b/gi, "var(--ep-ink2)")
    .replace(/#e9e2d4\b/gi, "color-mix(in srgb, var(--ep-ink) 9%, var(--ep-paper))")
    .replace(/rgba\(244, 238, 227, ([\d.]+)\)/g, (_, a) => `color-mix(in srgb, var(--ep-paper) ${pct(a)}, transparent)`)
    .replace(/rgba\(30, 26, 22, ([\d.]+)\)/g, (_, a) => `color-mix(in srgb, var(${shadow ? "--ep-shade" : "--ep-ink"}) ${pct(a)}, transparent)`)
    .replace(/rgba\(173, 60, 24, ([\d.]+)\)/g, (_, a) => `color-mix(in srgb, var(--ep-accent-ink) ${pct(a)}, transparent)`);
  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(v.replace(/var\([^)]*\)/g, ""))) throw new Error(`바꾸지 못한 색: ${prop}: ${value}`);
  return v;
}

function generate() {
  const out = [];
  for (const file of FILES) {
    const css = readFileSync(path.join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [];
    // 얕은 CSS 읽기 — 규칙 · @media 한 겹. 선언은 `;` 로 끊는다
    const stack = [];
    let buf = "";
    for (const ch of css) {
      if (ch === "{") {
        stack.push({ head: buf.trim(), decls: [] });
        buf = "";
      } else if (ch === "}") {
        const top = stack.pop();
        if (buf.trim()) top.decls.push(buf.trim());
        buf = "";
        const media = stack.find((s) => s.head.startsWith("@"));
        if (!top.head.startsWith("@")) rules.push({ selector: top.head, decls: top.decls, media: media?.head ?? null });
      } else if (ch === ";" && stack.length && !stack.at(-1).head.startsWith("@media")) {
        stack.at(-1).decls.push(buf.trim());
        buf = "";
      } else buf += ch;
    }
    const lines = [];
    const overridden = [];
    for (const r of rules) {
      if (r.selector.startsWith("@") || /^(from|to|\d+%)/.test(r.selector)) continue;
      const hit = r.decls
        .map((d) => {
          const i = d.indexOf(":");
          return [d.slice(0, i).trim(), d.slice(i + 1).trim()];
        })
        .filter(([p, v]) => !p.startsWith("--ep-accent") || /#/.test(v))
        .filter(([, v]) => /#[0-9a-f]{3,8}\b|rgba?\(/i.test(v));
      if (!hit.length) continue;
      const selector = r.selector
        .split(",")
        .map((s) => `html[data-palette] ${s.trim().replace(/\s+/g, " ")}`)
        .join(", ");
      const body = hit.map(([p, v]) => `${p}: ${swap(p, v)};`).join(" ");
      lines.push(r.media ? `${r.media} { ${selector} { ${body} } }` : `${selector} { ${body} }`);
      overridden.push({ parts: r.selector.split(",").map((s) => s.trim().replace(/\s+/g, " ")), props: hit.map(([p]) => p), media: r.media });
    }
    // 덮는 규칙은 선택자가 한 단 세다 (html[data-palette] …). 그래서 원래는 뒤에서 이기던 규칙 — 덮인 선택자에 상태를 덧붙인 것 (…[aria-pressed="true"] 같은) —
    // 이 같은 속성을 변수로 적어 뒀으면 지게 된다. 그런 규칙을 찾아 같은 세기로 다시 적는다 (값은 그대로)
    const parts = (sel) => sel.split(",").map((s) => s.trim().replace(/\s+/g, " "));
    const again = [];
    for (const o of overridden) {
      for (const r of rules) {
        if (r.media !== o.media || r.selector.startsWith("@")) continue;
        const rp = parts(r.selector);
        if (!rp.every((x) => o.parts.some((b) => x !== b && x.startsWith(b) && /^[\[:.][^\s>+~]*$/.test(x.slice(b.length))))) continue;
        for (const d of r.decls) {
          const i = d.indexOf(":");
          const [prop, value] = [d.slice(0, i).trim(), d.slice(i + 1).trim()];
          if (!o.props.includes(prop) || /#[0-9a-f]{3,8}\b|rgba?\(/i.test(value)) continue;
          again.push(`${rp.map((x) => `html[data-palette] ${x}`).join(", ")} { ${prop}: ${value}; }`);
        }
      }
    }
    if (lines.length) out.push(`/* ${file} — ${lines.length} */`, ...lines);
    if (again.length) out.push(`/* ${file} — 다시 적은 것 ${again.length} (덮인 선택자에 상태를 덧붙인 규칙) */`, ...new Set(again));
  }
  return `/* 만든 파일이다 — 손으로 고치지 않는다. gen-overrides.mjs 가 src/episode 의 CSS 에서 글자 그대로 적힌 색을 찾아 만든다 (UX-7 · lab 전용).\n   색 시안이 켜졌을 때만 (html[data-palette]) 걸린다. */\n${out.join("\n")}\n`;
}

const target = path.join(HERE, "overrides.css");
const next = generate();
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== next) {
    console.log("FAIL overrides.css 가 src/episode 의 CSS 와 맞지 않는다 — gen-overrides.mjs 를 다시 돌린다");
    process.exit(1);
  }
  console.log(`OK overrides.css 가 최신이다 (규칙 ${next.split("\n").filter((l) => l.startsWith("html") || l.startsWith("@media")).length})`);
} else {
  writeFileSync(target, next);
  console.log(`overrides.css — 규칙 ${next.split("\n").filter((l) => l.startsWith("html") || l.startsWith("@media")).length}`);
}
