// 인라인 서식 (§6): `<b>…</b>` 와 `\n` 둘뿐. 그 밖의 태그 · class · style 은 없다.
// 여기서는 정확히 "<b>" 와 "</b>" 만 서식으로 읽는다. 나머지 글자는 전부 글이다 — 다른 HTML 을 해석하지 않는다.

export interface InlineRun {
  text: string;
  bold: boolean;
}

const B_TOKEN = /(<b>|<\/b>)/;

/** 글을 굵기 구간으로 나눈다. `\n` 은 글에 그대로 남긴다(그리는 쪽이 줄바꿈으로 바꾼다). */
export function inlineRuns(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let bold = false;
  for (const part of text.split(B_TOKEN)) {
    if (part === "<b>") bold = true;
    else if (part === "</b>") bold = false;
    else if (part) runs.push({ text: part, bold });
  }
  return runs;
}

/** §9-7 위반을 찾는다. 없으면 null. */
export function inlineFormatProblem(text: string): string | null {
  const rest = text.replace(/<\/?b>/g, "");
  if (rest.includes("<") || rest.includes(">")) return "<b> 와 \\n 밖의 태그가 있다";
  let depth = 0;
  for (const m of text.matchAll(/<\/?b>/g)) {
    depth += m[0] === "<b>" ? 1 : -1;
    if (depth !== 0 && depth !== 1) return "<b> 가 중첩되거나 먼저 닫힌다";
  }
  if (depth !== 0) return "<b> 가 span 을 넘는다";
  return null;
}
