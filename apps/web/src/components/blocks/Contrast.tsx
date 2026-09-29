import type { Contrast as ContrastT } from "@claro/contract";
import { RichText } from "../Inline";

// 항목은 위치로만 구분한다. 항목의 뜻으로 색을 고르지 않는다 (§7.1-5 · D20)
export function Contrast({ block }: { block: ContrastT }) {
  return (
    <div className="b-contrast">
      {block.items.map((it, j) => (
        <div key={j} className="c-item" data-emphasized={it.emphasized ? "" : undefined}>
          <div className="c-label" data-u={`${j}.label`}>
            <RichText spans={it.label} />
          </div>
          {it.value && (
            <div className="c-value" data-u={`${j}.value`}>
              <RichText spans={it.value} />
            </div>
          )}
          {it.body && (
            <div className="c-body" data-u={`${j}.body`}>
              <RichText spans={it.body} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
