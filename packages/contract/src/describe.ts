// 계약 타입의 칸 목록을 값으로도 갖는다 — 실행 중에 읽을 수 있어야 계약 문서 · 테이블과 견줄 수 있다.
// 타입이 원본이 아니다. 원본은 docs/contract/*.md 의 타입 블록이고, test/contract-docs.test.ts 가 이 목록을 문서와 글자로 댄다.

export interface FieldDesc<N extends boolean = boolean> {
  /** 계약 문서 타입 블록의 타입 식 그대로 (공백만 한 칸으로) */
  readonly type: string;
  readonly nullable: N;
}

/** T 의 모든 칸을 빠짐없이 · 남김없이. null 을 받는 칸인지가 타입과 같아야 한다 */
export type TypeDesc<T> = { readonly [K in keyof T]-?: FieldDesc<null extends T[K] ? true : false> };

export const req = (type: string): FieldDesc<false> => ({ type, nullable: false });
export const opt = (type: string): FieldDesc<true> => ({ type: `${type} | null`, nullable: true });

/** `"A" | "B"` — 닫힌 값 목록을 문서의 타입 식으로 */
export const union = (values: readonly string[]): string => values.map((v) => `"${v}"`).join(" | ");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP_RE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
export const isUUID = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/** 값 하나가 계약의 타입 식에 맞는가. 다른 타입을 담는 식(`SlideLoc[]` · `BlockDecision[]` …)은 여기서 보지 않는다 — null 여부까지만 */
function valueFits(type: string, v: unknown): boolean {
  switch (type) {
    case "UUID": return isUUID(v);
    case "integer": return Number.isInteger(v);
    case "string": return typeof v === "string";
    case "boolean": return typeof v === "boolean";
    case "Timestamp": return typeof v === "string" && TIMESTAMP_RE.test(v) && !Number.isNaN(Date.parse(v));
    case "LevelId": return v === "basic" || v === "intermediate" || v === "advanced";
  }
  if (/^"[^"]*"( \| "[^"]*")*$/.test(type)) return typeof v === "string" && type.split(" | ").includes(`"${v}"`);
  return true;
}

/**
 * 받은 줄을 계약의 칸 목록과 댄다 — 칸이 전부 · 그것만 있는가, 값이 타입 식에 맞는가. 어긋난 곳마다 글 하나. 맞으면 [].
 * `only` 를 주면 그 칸들만 본다 (줄의 일부만 받는 곳 — 나머지는 받는 쪽이 채운다).
 */
export function fieldProblems<D extends Record<string, FieldDesc>>(desc: D, row: unknown, only?: readonly (keyof D & string)[]): string[] {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return ["객체가 아니다"];
  const want: readonly string[] = only ?? Object.keys(desc);
  const got = row as Record<string, unknown>;
  const out: string[] = [];
  for (const k of Object.keys(got)) if (!want.includes(k)) out.push(`계약에 없는 칸 "${k}"`);
  for (const k of want) {
    const f = desc[k]!;
    if (!(k in got)) out.push(`칸 "${k}" 이 없다`);
    else if (got[k] === null ? !f.nullable : !valueFits(f.type.replace(/ \| null$/, ""), got[k])) out.push(`"${k}" 의 값이 ${f.type} 이 아니다`);
  }
  return out;
}
