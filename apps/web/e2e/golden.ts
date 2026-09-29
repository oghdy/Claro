// 골든 쪽 독자 글 단위 — scripts/compare-reader-text.py 의 new_units 와 같은 규칙
import { readFileSync } from "node:fs";
import path from "node:path";

export const GOLDEN_PATH = path.join(import.meta.dirname, "../../../fixtures/fomc-2026-09.article.json");
export const golden = () => JSON.parse(readFileSync(GOLDEN_PATH, "utf-8"));

type Spans = { text: string; layer: string }[];
const rt = (s: Spans) => s.map((x) => x.text).join("");

export interface UnitBlock {
  kind: string;
  shape: unknown[];
  units: [string, string][];
}
export interface UnitSlide {
  kicker: string;
  headline: string;
  oq: string | null;
  blocks: UnitBlock[];
  layers: string[];
}

export function goldenUnits(level: any): UnitSlide[] {
  return level.slides.map((s: any, i: number) => {
    const layers: string[] = [];
    const take = (sp: Spans) => (sp.forEach((x) => layers.push(x.layer)), rt(sp));
    const headline = take(s.headline);
    const blocks: UnitBlock[] = s.blocks.map((b: any) => {
      if (b.type === "prose")
        return { kind: "prose", shape: b.paragraphs.map((p: any) => p.weight), units: b.paragraphs.map((p: any, j: number) => [`p${j}`, take(p.body)]) };
      if (b.type === "quote") return { kind: "quote", shape: [], units: [["attribution", b.attribution], ["body", take(b.body)]] };
      const seq = b.type === "sheet" ? b.rows : b.items;
      const units: [string, string][] = [];
      const shape: unknown[] = [];
      seq.forEach((it: any, j: number) => {
        for (const f of ["label", "value", "body"]) if (f in it) units.push([`${j}.${f}`, take(it[f])]);
        if (b.type === "contrast") shape.push(!!it.emphasized);
        if (b.type === "list") shape.push([b.ordered, !!it.emphasized]);
      });
      return { kind: b.type, shape, units };
    });
    return { kicker: s.kicker, headline, oq: level.open_questions[i]?.text ?? null, blocks, layers };
  });
}
