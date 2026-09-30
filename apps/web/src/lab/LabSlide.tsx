import type { Block, ReceivedBlock, Slide } from "@claro/contract";
import { isKnownBlock } from "@claro/contract";
import { InlineText, RichText } from "../components/Inline";

// F-2a 세 방향이 같이 쓰는 마크업. 방향마다 다른 건 CSS 와 넘기는 방식이다.
// 글은 F-1 의 RichText 로 그린다 — span 마다 data-layer 가 남고, 서식은 <b> 와 \n 뿐이다 (§6).
// 클래스는 전부 x- 로 시작한다 — 본 화면(globals.css)의 클래스와 겹치지 않게.
// data-u 는 독자 글 단위 — e2e/lab-text.spec.ts 가 골든과 대조한다.
// 시각은 선형화에 들어가는 필드만 쓴다 (§7.1-5). 판단 색 없음 (D20). 계산 없음 (D12).

export function LabSlide({ slide }: { slide: Slide }) {
  return (
    <article className="x-slide" data-lab-slide="">
      <p className="x-kicker" data-u="kicker">
        {slide.kicker}
      </p>
      <h2 className="x-headline" data-u="headline">
        <RichText spans={slide.headline} />
      </h2>
      <div className="x-blocks">
        {slide.blocks.map((b, j) => (
          <LabBlock key={j} block={b} />
        ))}
      </div>
    </article>
  );
}

function LabBlock({ block }: { block: ReceivedBlock }) {
  if (!isKnownBlock(block))
    return (
      <div className="x-block" data-block="unknown">
        <p className="x-p" data-weight="normal" data-u="text">
          <InlineText text={block.text} />
        </p>
      </div>
    );
  return (
    <div className="x-block" data-block={block.type}>
      {render(block)}
    </div>
  );
}

function render(b: Block) {
  switch (b.type) {
    case "prose":
      return (
        <div className="x-prose">
          {b.paragraphs.map((p, j) => (
            <p key={j} className="x-p" data-weight={p.weight} data-u={`p${j}`}>
              <RichText spans={p.body} />
            </p>
          ))}
        </div>
      );
    case "quote":
      return (
        <figure className="x-quote">
          <figcaption className="x-attr" data-u="attribution">
            {b.attribution}
          </figcaption>
          <blockquote className="x-qbody" data-u="body">
            <RichText spans={b.body} />
          </blockquote>
        </figure>
      );
    case "list": {
      // 순서는 배열 순서. 번호는 목록이 붙인다. 간격은 순서만 뜻한다 — 등간격 (D20)
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className="x-list" data-ordered={b.ordered ? "" : undefined}>
          {b.items.map((it, j) => (
            <li key={j} className="x-li" data-emphasized={it.emphasized ? "" : undefined}>
              {it.label && (
                <span className="x-li-label" data-u={`${j}.label`}>
                  <RichText spans={it.label} />
                </span>
              )}
              <span className="x-li-body" data-u={`${j}.body`}>
                <RichText spans={it.body} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "contrast":
      // 항목은 위치로만 구분한다 (data-pos). 항목의 뜻으로 색 · 모양을 고르지 않는다 (§7.1-5)
      return (
        <div className="x-contrast">
          {b.items.map((it, j) => (
            <div key={j} className="x-c" data-pos={j} data-emphasized={it.emphasized ? "" : undefined}>
              <div className="x-c-label" data-u={`${j}.label`}>
                <RichText spans={it.label} />
              </div>
              {it.value && (
                <div className="x-c-value" data-u={`${j}.value`}>
                  <RichText spans={it.value} />
                </div>
              )}
              {it.body && (
                <div className="x-c-body" data-u={`${j}.body`}>
                  <RichText spans={it.body} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    case "sheet":
      // 값에 색으로 방향 · 판단을 입히지 않는다 (§7.7)
      return (
        <dl className="x-sheet">
          {b.rows.map((r, j) => (
            <div key={j} className="x-row">
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
}
