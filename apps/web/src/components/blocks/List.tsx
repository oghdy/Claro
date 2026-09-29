import type { List as ListT } from "@claro/contract";
import { RichText } from "../Inline";

// 순서는 배열 순서, 번호는 목록이 붙인다. 간격은 순서만 뜻한다 — 등간격 (D20 · §7.5)
export function List({ block }: { block: ListT }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag className="b-list">
      {block.items.map((it, j) => (
        <li key={j} data-emphasized={it.emphasized ? "" : undefined}>
          {it.label && (
            <div className="item-label" data-u={`${j}.label`}>
              <RichText spans={it.label} />
            </div>
          )}
          <div className="item-body" data-u={`${j}.body`}>
            <RichText spans={it.body} />
          </div>
        </li>
      ))}
    </Tag>
  );
}
