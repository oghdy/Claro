import type { Prose as ProseT } from "@claro/contract";
import { RichText } from "../Inline";

// weight 는 명제를 더하지 않는 무게다 (§7.3). 모양만 바꾸고 판단 색은 쓰지 않는다 (D20)
export function Prose({ block }: { block: ProseT }) {
  return (
    <div className="b-prose">
      {block.paragraphs.map((p, j) => (
        <p key={j} className="para" data-weight={p.weight} data-u={`p${j}`}>
          <RichText spans={p.body} />
        </p>
      ))}
    </div>
  );
}
