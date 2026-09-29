import type { Quote as QuoteT } from "@claro/contract";
import { RichText } from "../Inline";

export function Quote({ block }: { block: QuoteT }) {
  return (
    <figure className="b-quote">
      <figcaption data-u="attribution">{block.attribution}</figcaption>
      <blockquote data-u="body">
        <RichText spans={block.body} />
      </blockquote>
    </figure>
  );
}
