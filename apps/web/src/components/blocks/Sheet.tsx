import type { Sheet as SheetT } from "@claro/contract";
import { RichText } from "../Inline";

// 값에 색으로 방향 · 판단을 입히지 않는다 (§7.7 · D20)
export function Sheet({ block }: { block: SheetT }) {
  return (
    <dl className="b-sheet">
      {block.rows.map((r, j) => (
        <div key={j} className="s-row">
          <dt data-u={`${j}.label`}>
            <RichText spans={r.label} />
          </dt>
          <dd data-u={`${j}.value`}>
            <RichText spans={r.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
