// S-2 · "오늘" 창 · 달력 · 기다림 목록 · 꼬리표 (모델 없음). 규칙은 D86 글자 그대로 — 여기서 새로 정한 것은 "아침 몇 시" 하나다 (CUTOFF · _open S2-a).
//
//   "오늘" = 아침 한 번 고른다 · 어제 낮 한국 + 밤사이 해외 (월요일은 주말 포함) · 낮에 나온 것은 내일로
//   이어짐 = 기관 + (사건 번호 · 회사 · 조항) 하나 더 + 달력 → 제안 · 사람이 붙인다
//   기다림 목록 = 날짜 있는 것은 달력 · 날짜 없는 것은 주 1회 · 공정위 의결서는 사람이 주 1회 눈으로
//
// 숫자 가중치 · 점수 · 임계값은 없다. 꼬리표는 "글자가 맞았다"는 사실만 적는다.
import type { FomcMeeting, Row } from "./collect-sources.ts";

/** 아침 고르기 시각 (한국). D86 은 "아침 한 번"까지만 정했다 — 시각은 정해진 적이 없다. 창의 끝을 긋는 데만 쓴다 */
export const CUTOFF = "07:00";

const DAY = 86_400_000;
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
export const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const weekday = (date: string) => WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()]!;
const kstMs = (date: string, hhmm: string) => Date.parse(`${date}T${hhmm}:00+09:00`);

export type Window = {
  pick: string;          // 고르는 아침 (한국 날짜)
  weekday: string;
  from_ms: number;       // 시각이 있는 것 (해외): from ≤ 시각 < to
  to_ms: number;
  kr_dates: string[];    // 날짜뿐인 것 (국내 목록): 이 날짜들
  say: string;           // 사람이 읽는 한 줄
};
/** 그날 아침의 창. 월요일은 금요일 아침부터 (주말 포함). 그 밖의 날은 어제 아침부터 */
export function windowOf(pick: string, cutoff = CUTOFF): Window {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pick) || Number.isNaN(Date.parse(`${pick}T00:00:00Z`))) throw new Error(`--date ${pick} — YYYY-MM-DD`);
  const back = weekday(pick) === "월" ? 3 : 1;
  const kr_dates = Array.from({ length: back }, (_, i) => addDays(pick, i - back));
  const first = kr_dates[0]!, last = kr_dates[kr_dates.length - 1]!;
  return {
    pick, weekday: weekday(pick), from_ms: kstMs(first, cutoff), to_ms: kstMs(pick, cutoff), kr_dates,
    say: `${pick} (${weekday(pick)}) 아침 ${cutoff} 에 고른다 — 국내 = ${first === last ? first : `${first} ~ ${last}`} 에 올라온 것 · 해외 = ${first} ${cutoff} ~ ${pick} ${cutoff} (한국 시각)${back > 1 ? " · 월요일이라 주말 포함" : ""}`,
  };
}
export const inWindow = (w: Window, r: Pick<Row, "date" | "at">) => (r.at ? Date.parse(r.at) >= w.from_ms && Date.parse(r.at) < w.to_ms : w.kr_dates.includes(r.date));

// ── 달력 ─────────────────────────────────────────────────────────────────────────────────────────────
export type CalEntry = { date: string; approx: boolean; what: string; story: string | null; orgs: string[]; keys: string[]; url: string; basis: string };
export type Calendar = { entries: CalEntry[]; unknown: { what: string; why: string }[] };
/** 연준 달력 쪽에서 읽은 회의 줄을 달력 칸으로 — 회의 마지막 날 (결정) · 회의록이 나왔으면 나온 날 */
export function fomcEntries(ms: FomcMeeting[]): CalEntry[] {
  const url = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
  return ms.flatMap((m) => [
    { date: m.last_day, approx: false, what: `연준 회의 (FOMC ${m.label}) 결정${m.sep ? " · 점도표" : ""} — 한국 시각으로는 다음 날 새벽`, story: "rate", orgs: ["연준", "Federal Reserve"], keys: ["FOMC statement"], url, basis: "연준 달력 쪽 (collect 가 읽음)" },
    ...(m.minutes_released ? [{ date: m.minutes_released, approx: false, what: `연준 ${m.label} 회의의 회의록`, story: "rate", orgs: ["연준", "Federal Reserve"], keys: ["Minutes of the Federal Open Market Committee"], url, basis: "연준 달력 쪽 (Released …)" }] : []),
  ]);
}
/** 사람이 적은 것 + 스스로 읽은 것. 같은 일 (같은 이야기 · 같은 열쇠)이 둘 다에 있으면: 사람이 어림 날짜로 적은 것은 같은 달의 실제 날짜가 읽히면 그쪽으로 · 날짜가 같으면 사람이 적은 것을 남긴다 */
export function mergeCalendar(hand: CalEntry[], auto: CalEntry[]): CalEntry[] {
  const alike = (a: CalEntry, b: CalEntry) => a.story === b.story && a.keys.some((k) => b.keys.includes(k));
  const keepHand = hand.filter((h) => !(h.approx && auto.some((a) => alike(a, h) && a.date.slice(0, 7) === h.date.slice(0, 7))));
  return [...keepHand, ...auto.filter((a) => !keepHand.some((h) => alike(a, h) && a.date === h.date))].sort((a, b) => a.date.localeCompare(b.date));
}
/** 창에 든 것 (어제 일 — 오늘 후보에 떠야 한다) · 다가오는 것 (오늘부터 이레) */
export function calendarFor(w: Window, entries: CalEntry[]): { due: CalEntry[]; ahead: CalEntry[] } {
  const end = addDays(w.pick, 7);
  return { due: entries.filter((e) => w.kr_dates.includes(e.date)), ahead: entries.filter((e) => e.date >= w.pick && e.date <= end) };
}

// ── 기다림 목록 · 꼬리표 ─────────────────────────────────────────────────────────────────────────────
export type Watch = { type: "fomc-minutes"; meeting_last_day: string } | { type: "pipc-case"; cases: string[] } | { type: "human-weekly" } | { type: "calendar" } | { type: "list" } | { type: "none" };
export type WaitItem = { head: string; kind: "dated" | "undated" | "idea"; date: string | null; approx: boolean; where: string; watch: Watch; keys: string[]; becomes: string; since: string };
export type Story = { code: string; name: string; fixture: string; since: string; gists: { since: string; gist: string }[]; orgs: string[]; keys: string[]; items: WaitItem[] };
export type Waitlist = { stories: Story[] };
/** 그 아침에 알던 것만 — since (고른 아침)가 그날보다 앞인 이야기 · 남은 것 · 한 줄. 오늘 날짜로 돌리면 전부다. 지난 날짜로 돌려 볼 때 그날 몰랐던 이야기가 꼬리표로 새지 않게 한다 */
export function asOf(wl: Waitlist, pick: string): { wl: Waitlist; stories: { code: string; name: string; gist: string }[] } {
  const stories = wl.stories.filter((s) => s.since < pick).map((s) => ({ ...s, items: s.items.filter((i) => i.since < pick) }));
  return { wl: { stories }, stories: stories.map((s) => ({ code: s.code, name: s.name, gist: s.gists.filter((g) => g.since < pick).sort((a, b) => a.since.localeCompare(b.since)).pop()?.gist ?? "" })) };
}

export type Tag =
  | { type: "이어질 거리"; story: string; name: string; item: string | null; matched: string[] }   // 기관 + 하나 더
  | { type: "같은 기관"; story: string; name: string }                                              // 기관만 — 올리지 않는다 (D86)
  | { type: "달력"; what: string; matched: string[] }
  | { type: "어제 넘친 것"; from: string };

const has = (hay: string, k: string) => hay.toLowerCase().includes(k.toLowerCase());
const orgHit = (org: string, orgs: string[]) => orgs.some((o) => has(org, o));
/** 한 후보의 꼬리표 — 글자 맞추기뿐이다. 제목과 (있으면) 첫 문단에서 찾는다 */
export function tagsOf(r: Pick<Row, "org" | "title" | "lead">, wl: Waitlist, due: CalEntry[]): Tag[] {
  const hay = `${r.title} ${r.lead ?? ""}`;
  const out: Tag[] = [];
  for (const s of wl.stories) {
    if (!orgHit(r.org, s.orgs)) continue;
    const item = s.items.find((i) => i.keys.some((k) => has(hay, k)));
    const matched = [...new Set([...s.keys, ...(item?.keys ?? [])].filter((k) => has(hay, k)))];
    if (matched.length) out.push({ type: "이어질 거리", story: s.code, name: s.name, item: item?.head ?? null, matched });
    else out.push({ type: "같은 기관", story: s.code, name: s.name });
  }
  for (const e of due) {
    if (!e.orgs.length || !orgHit(r.org, e.orgs)) continue;
    const matched = e.keys.filter((k) => has(hay, k));
    if (matched.length) out.push({ type: "달력", what: e.what, matched });
  }
  return out;
}

// ── 날짜 없는 것의 확인 (주 1회면 넉넉하다 — S-1 ⑥. 돌릴 때마다 한 번 묻는다: 싸다) ─────────────────────
export type WatchResult = { story: string; head: string; state: "왔다" | "아직" | "사람이 본다" | "확인할 곳 없음" | "못 물었다"; say: string; url: string };
export function watchResults(wl: Waitlist, got: { fomc: FomcMeeting[] | null; pipc: Row[] | null }, pick: string): WatchResult[] {
  const out: WatchResult[] = [];
  for (const s of wl.stories) for (const i of s.items) {
    const w = i.watch;
    if (w.type === "fomc-minutes") {
      const m = got.fomc?.find((x) => x.last_day === w.meeting_last_day);
      if (!got.fomc) out.push({ story: s.name, head: i.head, state: "못 물었다", say: "연준 달력 쪽을 못 받았다", url: i.where });
      else if (m?.minutes_released) out.push({ story: s.name, head: i.head, state: "왔다", say: `회의록 공개 ${m.minutes_released} (연준 달력 쪽)`, url: i.where });
      else out.push({ story: s.name, head: i.head, state: "아직", say: `연준 달력의 ${m?.label ?? w.meeting_last_day} 줄에 Minutes 가 없다${i.date ? ` · 예정 ${i.date}${i.approx ? " 무렵" : ""}` : ""}`, url: i.where });
    } else if (w.type === "pipc-case") {
      const hit = got.pipc?.filter((r) => w.cases.some((c) => r.title.includes(c))) ?? [];
      if (!got.pipc) out.push({ story: s.name, head: i.head, state: "못 물었다", say: "결정문 게시판을 못 받았다", url: i.where });
      else if (hit.length) out.push({ story: s.name, head: i.head, state: "왔다", say: hit.map((r) => `${r.native_id}번 「${r.title}」 (의결 ${r.date})`).join(" · "), url: hit[0]!.url });
      else out.push({ story: s.name, head: i.head, state: "아직", say: `결정문 게시판 위쪽 ${got.pipc.length}줄에 사건 번호 ${w.cases.join(" · ")} 없음 (맨 위 의결일 ${got.pipc[0]?.date ?? "?"})`, url: i.where });
    } else if (w.type === "human-weekly") {
      out.push({ story: s.name, head: i.head, state: "사람이 본다", say: `robots 가 막는 게시판 — 주 1회 눈으로 (D86)${weekday(pick) === "월" ? " · **오늘이 월요일이다**" : ""}`, url: i.where });
    } else if (w.type === "none" && i.kind !== "idea") {
      out.push({ story: s.name, head: i.head, state: "확인할 곳 없음", say: i.becomes, url: i.where });
    }
  }
  return out;
}
