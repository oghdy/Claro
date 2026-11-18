import { hrefOfLine, type Line } from "../../../episode/catalog";

// UX-12 (D136) — 지난 이야기를 날짜로 묶는 것. **lab 의 것이다** (실제로 옮길 때는 catalog 의 bundle 곁으로 — logs/frontend/UX-12.md ⑥).
// 날짜는 목록에 적힌 값 그대로다 (지어내지 않는다). day 가 없는 이야기는 day: null 묶음 하나로 맨 아래에 선다 ("그 전").

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

/** "11월 17일" — 실제 첫 화면의 dayTitle 과 같은 꼴 (머리의 "의 이야기"만 없다) */
export const dayLabel = (day: string): string => {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})$/.exec(day) ?? [];
  return `${Number(m)}월 ${Number(d)}일`;
};

const back = (day: string, n: number): string => new Date(Date.parse(`${day}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

/**
 * **견본** (`?many=1`) — 날이 쌓인 모습. 지금 목록의 이야기를 맨 위 묶음의 날 바로 앞 7일에 둘씩 되풀이해 깐다 (날짜 · 차례는 지어낸 것이다 — 그래서 화면 위에 견본 띠가 선다).
 * 날 없는 이야기들은 그대로 맨 아래 "그 전"에 남는다. 실제 주소에는 없다
 */
export function sampleWeek(day: string, top: readonly Line[], rest: readonly Line[]): Line[] {
  const pool = [...rest, ...top];
  const dated = Array.from({ length: 14 }, (_, i) => ({ ...pool[i % pool.length]!, day: back(day, Math.floor(i / 2) + 1) }));
  return [...dated, ...rest.filter((x) => !x.day)];
}

export const keyOf = (line: Line): string => `${line.day ?? "-"}:${hrefOfLine(line)}`;

/** 날짜를 칸으로 — 달 · 날 · 요일 (UX-12c). 요일은 그 날짜에서 계산한다 (달력의 날은 시간대와 상관없다 — UTC 로 센다). 지어내는 것 없음 */
export const dayParts = (day: string): { month: number; date: number; weekday: string } => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return { month: m, date: d, weekday: "일월화수목금토"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]! };
};
