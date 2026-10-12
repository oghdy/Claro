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
