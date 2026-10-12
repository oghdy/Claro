import { customType } from "drizzle-orm/pg-core";

/**
 * 계약의 Timestamp ("2026-10-09T05:12:33Z" — UTC, 초 단위 이상) ↔ Postgres timestamptz.
 * 같은 순간을 돌려준다. 글자는 다를 수 있다 — 소수 초의 끝자리 0 은 Postgres 가 떼고, UTC 가 아닌 오프셋으로 넣은 값은 Z 로 바뀐다.
 */
export function toContractTimestamp(v: string | Date): string {
  if (v instanceof Date) return v.toISOString().replace(".000Z", "Z");
  const m = /^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d:\d\d)(\.\d+)?(?:Z|\+00(?::?00)?)$/.exec(v);
  if (m) return `${m[1]}T${m[2]}${m[3] ?? ""}Z`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error(`timestamptz 를 읽지 못했다: ${v}`);
  return d.toISOString().replace(".000Z", "Z");
}

export const timestamptz = customType<{ data: string; driverData: string | Date }>({
  dataType: () => "timestamp with time zone",
  fromDriver: toContractTimestamp,
});
