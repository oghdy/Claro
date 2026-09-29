import type { ReceivedBlock, UnknownBlock } from "@claro/contract";
import { isKnownBlock } from "@claro/contract";
import { Contrast } from "./Contrast";
import { Fallback } from "./Fallback";
import { List } from "./List";
import { Prose } from "./Prose";
import { Quote } from "./Quote";
import { Sheet } from "./Sheet";

export function BlockView({ block }: { block: ReceivedBlock }) {
  const inner = render(block);
  return (
    <div className="block" data-block={isKnownBlock(block) ? block.type : "unknown"}>
      {inner}
    </div>
  );
}

function render(block: ReceivedBlock) {
  if (!isKnownBlock(block)) return <Fallback type={block.type} text={block.text} />;
  switch (block.type) {
    case "prose":
      return <Prose block={block} />;
    case "quote":
      return <Quote block={block} />;
    case "list":
      return <List block={block} />;
    case "contrast":
      return <Contrast block={block} />;
    case "sheet":
      return <Sheet block={block} />;
    default: {
      const b = block as UnknownBlock;
      return <Fallback type={b.type} text={b.text} />;
    }
  }
}
