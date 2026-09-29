// 정규 텍스트 = linearize(block) — ARTICLE_PACKAGE §7.3 ~ §7.7.
// 백엔드 scripts/verify-article.py 의 linearize 와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 고친다.
import type { Block, RichText } from "./types";

/** RichText 의 글 = span text 를 순서대로 이은 것 (§6) */
export function richText(spans: RichText): string {
  return spans.map((s) => s.text).join("");
}

/** 항목 안의 \n 은 공백으로 — 항목 하나가 한 줄 (§7.1-7) */
function oneLine(spans: RichText): string {
  return richText(spans).replace(/\n/g, " ");
}

export function linearize(b: Block): string {
  switch (b.type) {
    case "prose":
      return b.paragraphs.map((p) => richText(p.body)).join("\n\n");
    case "quote":
      return `[${b.attribution}] ${richText(b.body)}`;
    case "list":
      return b.items
        .map((it, i) => {
          const head = b.ordered ? `${i + 1}. ` : "- ";
          const core = (it.label && it.label.length ? oneLine(it.label) + " — " : "") + oneLine(it.body);
          return head + (it.emphasized ? `<b>${core}</b>` : core);
        })
        .join("\n");
    case "contrast":
      return b.items
        .map((it) => {
          const core = [it.value, it.body]
            .filter((x): x is RichText => !!x && x.length > 0)
            .map(oneLine)
            .join(" ");
          return oneLine(it.label) + ": " + (it.emphasized ? `<b>${core}</b>` : core);
        })
        .join("\n");
    case "sheet":
      return b.rows.map((r) => `${oneLine(r.label)}: ${oneLine(r.value)}`).join("\n");
  }
}
