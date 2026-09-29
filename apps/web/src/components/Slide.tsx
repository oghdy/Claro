import type { Slide as SlideT } from "@claro/contract";
import { RichText } from "./Inline";
import { BlockView } from "./blocks/BlockView";

// 슬라이드는 kicker · headline · 블록만 안다. open_question 은 슬라이드의 속성이 아니다 (D17) — Between.tsx
export function Slide({ slide }: { slide: SlideT }) {
  return (
    <article className="slide">
      <p className="kicker" data-u="kicker">
        {slide.kicker}
      </p>
      <h1 className="headline" data-u="headline">
        <RichText spans={slide.headline} />
      </h1>
      <div className="blocks">
        {slide.blocks.map((b, j) => (
          <BlockView key={j} block={b} />
        ))}
      </div>
    </article>
  );
}
