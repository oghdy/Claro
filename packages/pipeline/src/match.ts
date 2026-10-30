// 구절 → 원문 위치 (P-1). **맞추는 규칙은 match-rules.json 한 곳에만 있다** — 검사(scripts/verify-data-model.py)도 같은 파일을 읽는다.
// 느슨하게 맞추지 않는다: 공백 묶음 = 공백 하나, 따옴표 모양만 같게 본다. 그 밖에 글자가 하나라도 다르면 못 찾음.
// 여러 곳에 있으면 "여럿" — 위치를 고르지 않는다.
import { readFileSync } from "node:fs";

type Rules = { version: string; whitespace: string[]; same: string[][] };
export const RULES: Rules = JSON.parse(readFileSync(new URL("../match-rules.json", import.meta.url), "utf8"));

const WS = new Set(RULES.whitespace);
const SAME = new Map<string, string>();
for (const group of RULES.same) for (const ch of group) SAME.set(ch, group[0]!);

/** 맞추기용 글 + 각 글자가 원문의 몇 번째 글자에서 왔는지.
 *  위치는 **코드 포인트** 단위다 (Python str · Postgres substring 과 같다. JS 의 UTF-16 위치가 아니다). c 도 코드 포인트 배열로 본다 */
export function canon(s: string): { c: string; at: number[] } {
  let c = "";
  const at: number[] = [];
  let inWs = false;
  let i = -1;
  for (const ch of s) {
    i++;
    if (WS.has(ch)) {
      if (!inWs) {
        c += " ";
        at.push(i);
      }
      inWs = true;
      continue;
    }
    inWs = false;
    c += SAME.get(ch) ?? ch;
    at.push(i);
  }
  return { c, at };
}

export type Located =
  | { result: "FOUND"; span_start: number; span_end: number }
  | { result: "NOT_FOUND" }
  | { result: "MULTIPLE"; count: number; starts: number[] };

export function locate(text: string, passage: string): Located {
  const T = canon(text);
  const tc = Array.from(T.c);
  const p = Array.from(canon(passage).c);
  if (p.length === 0) return { result: "NOT_FOUND" };
  const hits: number[] = [];
  const first = p[0]!;
  outer: for (let i = 0; i + p.length <= tc.length; i++) {
    if (tc[i] !== first) continue;
    for (let j = 1; j < p.length; j++) if (tc[i + j] !== p[j]) continue outer;
    hits.push(i);
  }
  if (hits.length === 0) return { result: "NOT_FOUND" };
  if (hits.length > 1) return { result: "MULTIPLE", count: hits.length, starts: hits.map((h) => T.at[h]!) };
  const h = hits[0]!;
  return { result: "FOUND", span_start: T.at[h]!, span_end: T.at[h + p.length - 1]! + 1 };
}

/** 코드 포인트 단위로 자른다 */
export const cpSlice = (s: string, start: number, end: number): string => Array.from(s).slice(start, end).join("");
export const cpLength = (s: string): number => Array.from(s).length;

/** 검사와 같은 판정 — span 의 글을 규칙대로 맞추면 구절과 같은가 */
export function spanMatches(text: string, start: number, end: number, passage: string): boolean {
  return canon(cpSlice(text, start, end)).c === canon(passage).c;
}
