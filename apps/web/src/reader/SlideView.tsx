import type { Block, ReceivedBlock, Slide } from "@claro/contract";
import { isKnownBlock } from "@claro/contract";
import { motion, type Variants } from "motion/react";
import { InlineText, RichText } from "../components/Inline";

// 한 장의 글 — kicker · headline · 블록. open_question 은 장의 속성이 아니다 (D17) — Reader 가 장과 장 사이에 그린다.
// 글은 RichText 로 그린다: span 마다 data-layer 가 남고 서식은 <b> 와 \n 뿐이다 (§6).
// data-u 는 독자 글 단위다 — e2e/reader-text.spec.ts 가 골든과 문자 단위로 대조한다.
// 시각은 선형화에 들어가는 필드만 쓴다 (§7.1-5). 판단 색 없음 (D20). 계산 없음 (D12).
// kicker · headline · 블록 하나하나가 "덩이"다 — 차례로 나타난다 (item). 어떻게 나타나는지는 Reader 가 정한다.

export function SlideView({ slide, item }: { slide: Slide; item: Variants }) {
  return (
    <article className="r-slide">
      <motion.p className="r-kicker" data-u="kicker" variants={item}>
        {slide.kicker}
      </motion.p>
      <motion.h1 className="r-headline" data-u="headline" variants={item}>
        <RichText spans={slide.headline} />
      </motion.h1>
      <div className="r-blocks">
        {slide.blocks.map((b, j) => (
          <motion.div key={j} className="r-block" data-block={isKnownBlock(b) ? b.type : "unknown"} variants={item}>
            <BlockBody block={b} />
          </motion.div>
        ))}
      </div>
    </article>
  );
}

function BlockBody({ block }: { block: ReceivedBlock }) {
  // 모르는 원형 — 정규 텍스트를 문단으로 그린다 (§7.9 · D14). 다른 필드는 읽지 않는다
  if (!isKnownBlock(block))
    return (
      <p className="r-p" data-weight="normal" data-unknown-type={block.type} data-u="text">
        <InlineText text={block.text} />
      </p>
    );
  return known(block);
}

function known(b: Block) {
  switch (b.type) {
    case "prose":
      return (
        <div className="r-prose">
          {b.paragraphs.map((p, j) => (
            <p key={j} className="r-p" data-weight={p.weight} data-u={`p${j}`}>
              <RichText spans={p.body} />
            </p>
          ))}
        </div>
      );
    case "quote":
      return (
        <figure className="r-quote">
          <figcaption className="r-attr" data-u="attribution">
            {b.attribution}
          </figcaption>
          <blockquote className="r-qbody" data-u="body">
            <RichText spans={b.body} />
          </blockquote>
        </figure>
      );
    case "list": {
      // 순서는 배열 순서. 간격은 순서만 뜻한다 — 등간격, 모든 점이 같다 (D20)
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className="r-list" data-ordered={b.ordered ? "" : undefined}>
          {b.items.map((it, j) => (
            <li key={j} className="r-li" data-emphasized={it.emphasized ? "" : undefined}>
              {it.label && (
                <span className="r-li-label" data-u={`${j}.label`}>
                  <RichText spans={it.label} />
                </span>
              )}
              <span className="r-li-body" data-u={`${j}.body`}>
                <RichText spans={it.body} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "contrast":
      // 항목은 위치로만 구분한다. 항목의 뜻으로 색 · 모양을 고르지 않는다 (§7.1-5)
      return (
        <div className="r-contrast">
          {b.items.map((it, j) => (
            <div key={j} className="r-c" data-emphasized={it.emphasized ? "" : undefined}>
              <div className="r-c-label" data-u={`${j}.label`}>
                <RichText spans={it.label} />
              </div>
              {it.value && (
                <div className="r-c-value" data-u={`${j}.value`}>
                  <RichText spans={it.value} />
                </div>
              )}
              {it.body && (
                <div className="r-c-body" data-u={`${j}.body`}>
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
        <dl className="r-sheet">
          {b.rows.map((r, j) => (
            <div key={j} className="r-row">
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
