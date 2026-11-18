import { bundle, hrefOfLine, type Line } from "../catalog";
import { HOME } from "../home-copy";
import type { Exits } from "../kit/types";

// 달력 화면 (/days — F-E9 · D148)의 셈과 길. UX-12d · UX-13b 의 lab 셈 (app/lab/home-days/days.ts)을 실제 자리로 옮겼다 — lab 시안은 제 것을 그대로 쓴다 (지울 때 같이).
// 날짜는 이야기 목록에 적힌 값 그대로다 (지어내지 않는다). 낸 날이 없는 이야기는 달력 밖 "그 전"에 선다. 요일 · 달의 칸은 그 날짜에서 센다 (UTC — 달력의 날은 시간대와 상관없다).

/** 달력 화면의 주소 */
export const DAYS = "/days";
/** 그날을 골라 둔 달력 화면 — 낸 날이 없으면 그냥 달력 화면 */
export const daysHref = (day: string | null | undefined): string => (day ? `${DAYS}?d=${day}` : DAYS);

/**
 * 이야기의 나가는 길 (kit/types 의 Exits) — 이야기가 사는 곳으로 (UX-13b ④ · D148 PM):
 * 첫 장의 ‹ = 가장 새 날의 이야기 (시작 화면에 있다) → `/` · 그 밖 → 달력 (그날 골라 둠) · 끝의 "다른 이야기 보기" = 늘 달력 (그날 골라 둠).
 * 낸 날이 하나도 없는 목록이면 전부가 시작 화면에 있다 (bundle 의 day = null) → ‹ 는 `/`
 */
export const exitsOf = (line: Line): Exits => ({ home: (line.day ?? null) === bundle().day ? "/" : daysHref(line.day), more: daysHref(line.day) });

export interface DayGroup {
  /** 낸 날 (YYYY-MM-DD) — 없는 이야기들의 묶음은 null */
  day: string | null;
  lines: Line[];
}

/** bundle().rest (새 날이 위 · 날 없는 것이 맨 아래 · 같은 날은 목록의 차례)를 그 차례 그대로 날마다 끊는다 */
export function byDay(rest: readonly Line[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const line of rest) {
    const day = line.day ?? null;
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.lines.push(line);
    else groups.push({ day, lines: [line] });
  }
  return groups;
}

export const keyOf = (line: Line): string => `${line.day ?? "-"}:${hrefOfLine(line)}`;

/** 고른 날의 머리 — "11월 17일 화요일" (HOME.dayLabel). 요일은 그 날짜에서 센다 */
export const dayLabel = (day: string): string => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const w = HOME.weekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
  return HOME.dayLabel.replace("{m}", String(m)).replace("{d}", String(d)).replace("{w}", w);
};

/** 달력 한 달 — 1일 앞의 빈칸 수 (일요일부터) · 그 달의 날 수 */
export const monthOf = (key: string): { key: string; month: number; lead: number; count: number } => {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return { key, month: m, lead: new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), count: new Date(Date.UTC(y, m, 0)).getUTCDate() };
};

/** 이야기가 있는 가장 이른 달부터 가장 늦은 달까지 (사이의 빈 달도) — "2026-11" 꼴 · 이른 달이 앞 */
export const monthKeys = (days: readonly string[]): string[] => {
  const sorted = [...days].sort();
  if (!sorted.length) return [];
  let [y, m] = sorted[0]!.split("-").map(Number) as [number, number];
  const last = sorted[sorted.length - 1]!.slice(0, 7);
  const out: string[] = [];
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (key >= last) return out;
    if (++m > 12) (m = 1), y++;
  }
};
