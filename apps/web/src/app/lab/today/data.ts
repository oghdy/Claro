// UX-7 — "오늘"에 놓이는 이야기 (시안 · lab 전용). 긴 이야기 셋은 실제 주소에 나가 있는 골든 그대로 (글은 한 글자도 여기 없다 — 회차 데이터에서 읽는다),
// 짧은 이야기 하나는 ./short (lab 전용 견본), 마지막은 자리만 있는 칸이다 (글 없음 — 뉴스를 지어내지 않는다).
// 손으로 정한 것은 **차례 하나뿐**이다. 나머지는 데이터에서 나온다:
//   이어지는 이야기인가   계약의 Episode.number ≥ 2 (둘째 이야기가 실제로 있다) — "N화" · 시리즈 줄 · 지난 이야기는 이때만 보인다 (D79 ①)
//   체험이 있는가         계약의 solve.lab 이 있나
//   읽는 시간             독자가 읽는 글의 글자 수로 어림 (아래 minutesOf — 어림이다. 계약에 칸이 없다)
import type { ComponentType } from "react";
import { CoverArt as DeliveryArt } from "../../../episode/episodes/delivery/Art";
import { DELIVERY } from "../../../episode/episodes/delivery/data";
import { CoverArt as FomcArt } from "../../../episode/episodes/fomc/Art";
import { FOMC } from "../../../episode/episodes/fomc/data";
import { CoverArt as PipcArt } from "../../../episode/episodes/pipc/Art";
import { PIPC } from "../../../episode/episodes/pipc/data";
import type { EpisodeData } from "../../../episode/kit/types";
import { SHORT } from "./short/data";
import type { ShortStory } from "./short/types";

export type TodayItem = { kind: "long"; ep: EpisodeData; Art: ComponentType } | { kind: "short"; story: ShortStory; path: string } | { kind: "empty" };

/** 차례 — 맨 위는 가장 최근에 발표된 긴 이야기 · 그다음 이어지는 이야기 · 긴 이야기 · 그 곁의 짧은 이야기 · 빈 자리 (까닭은 logs/frontend/UX-7.md ②) */
export const TODAY: readonly TodayItem[] = [
  { kind: "long", ep: DELIVERY, Art: DeliveryArt },
  { kind: "long", ep: FOMC, Art: FomcArt },
  { kind: "long", ep: PIPC, Art: PipcArt },
  { kind: "short", story: SHORT, path: "/lab/today/short" },
  { kind: "empty" },
];

/** 이어지는 이야기 — 둘째 이야기가 실제로 있다 */
export const continues = (ep: EpisodeData): boolean => ep.number >= 2;

/** 글자 수 — 독자가 읽는 글 (t · 제목 · 물음)만. 구절 · 키 · 꼬리표는 세지 않는다 */
function chars(v: unknown, key = ""): number {
  if (typeof v === "string") return ["voice", "state", "kind", "id", "key", "doc", "why", "op", "reach", "tool", "split"].includes(key) ? 0 : v.replace(/[\s*]/g, "").length;
  if (Array.isArray(v)) return key === "src" || key === "not_drawn" ? 0 : v.reduce<number>((n, x) => n + chars(x, key), 0);
  if (typeof v === "object" && v !== null) return Object.entries(v).reduce((n, [k, x]) => n + (k === "calc" || k === "basis" || k === "picture" ? 0 : chars(x, k)), 0);
  return 0;
}
/** 한 분에 읽는 글자 수 (어림) — 쉬운 말 · 폰 화면 */
const PER_MINUTE = 500;

/** 긴 이야기의 읽는 시간 (분 · 어림) — 처음 온 독자의 조립이 보이는 장면 + 도구 카드 + 풀이. 체험은 한 분을 더한다 */
export function minutesOfLong(ep: EpisodeData): number {
  const scenes = ep.assembly.new.reduce((n, id) => n + chars(ep.scenes[id]), 0);
  const tools = chars(ep.tools);
  const solve = chars(ep.solve.entry) + chars(ep.solve.lab);
  return Math.round((scenes + tools + solve) / PER_MINUTE) + (ep.solve.lab ? 1 : 0);
}
export function minutesOfShort(story: ShortStory): number {
  return Math.max(1, Math.round((chars(story.scenes) + chars(story.entry) + chars(story.plain.title)) / PER_MINUTE));
}

/** 오늘의 이야기들이 함께 가진 개념 — 이름이 같은 도구 (시안의 어림: 계약의 Tool.basis 가 비어 있어 "같은 개념"을 이름으로 맞췄다 — _open). 같은 이야기 묶음끼리 모은다 */
export function sharedConcepts(): { stories: { title: string; path: string }[]; names: string[] }[] {
  const seen = new Map<string, { title: string; path: string }[]>();
  const add = (name: string, title: string, path: string) => seen.set(name, [...(seen.get(name) ?? []), { title: title.replace(/\n/g, " "), path }]);
  for (const item of TODAY) {
    if (item.kind === "long") for (const tool of item.ep.tools) add(tool.name, item.ep.scenes.cover.title, item.ep.path);
    if (item.kind === "short") for (const key of item.story.tools_from.keys) add(PIPC.tools.find((x) => x.key === key)!.name, item.story.scenes.cover.title, item.path);
  }
  const groups = new Map<string, { stories: { title: string; path: string }[]; names: string[] }>();
  for (const [name, stories] of seen) {
    if (stories.length < 2) continue;
    const id = stories.map((x) => x.path).join("|");
    groups.set(id, { stories, names: [...(groups.get(id)?.names ?? []), name] });
  }
  return [...groups.values()];
}
