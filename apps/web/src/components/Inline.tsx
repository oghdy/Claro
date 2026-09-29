import { Fragment } from "react";
import { inlineRuns, type RichText as RichTextT } from "@claro/contract";

// 서식은 <b> 와 \n 둘뿐이다 (§6). 글은 전부 React 글자 노드로 넣는다 — 그 밖의 HTML 은 해석되지 않고 글자로 보인다.

/** 문자열 하나를 <b> · \n 만 해석해 그린다 */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {inlineRuns(text).map((run, i) => {
        const lines = run.text.split("\n");
        const content = lines.map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {line}
          </Fragment>
        ));
        return run.bold ? <b key={i}>{content}</b> : <Fragment key={i}>{content}</Fragment>;
      })}
    </>
  );
}

/** span 마다 출처 층을 DOM 에 남긴다. 층을 어떻게 보여줄지는 다음 Step (F-2) */
export function RichText({ spans }: { spans: RichTextT }) {
  return (
    <>
      {spans.map((sp, i) => (
        <span key={i} data-layer={sp.layer}>
          <InlineText text={sp.text} />
        </span>
      ))}
    </>
  );
}
