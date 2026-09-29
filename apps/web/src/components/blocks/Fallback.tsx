import { InlineText } from "../Inline";

// 모르는 원형 — 정규 텍스트를 문단으로 그린다 (§7.9 · D14). 다른 필드는 읽지 않는다
export function Fallback({ type, text }: { type: string; text: string }) {
  return (
    <div className="b-fallback" data-unknown-type={type}>
      <p className="para" data-weight="normal" data-u="text">
        <InlineText text={text} />
      </p>
    </div>
  );
}
