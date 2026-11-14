// UX-7 — "오늘"에 놓이는 이야기 (시안 · lab 전용). 긴 이야기 셋은 실제 주소에 나가 있는 골든 그대로 (글은 한 글자도 여기 없다 — 회차 데이터에서 읽는다),
// 짧은 이야기 하나는 ./short (lab 전용 견본), 마지막은 자리만 있는 칸이다 (글 없음 — 뉴스를 지어내지 않는다).
// 손으로 정한 것은 **차례 하나뿐**이다. 나머지는 데이터에서 나온다:
//   이어지는 이야기인가   계약의 Episode.number ≥ 2 (둘째 이야기가 실제로 있다) — "N화" · 시리즈 줄 · 지난 이야기는 이때만 보인다 (D79 ①)
//   체험이 있는가         계약의 solve.lab 이 있나
//   읽는 시간은 내지 않는다 (D82 · UX-7b — 어림 함수도 뺐다)
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
