// UX-7 — "오늘"에 놓이는 이야기 (시안 · lab 전용). F-E2 부터 **이야기는 실제 화면과 같은 목록에서 온다** (episode/catalog.tsx STORIES — 한 곳).
// 여기 남은 시안의 것은 둘이다: 마지막의 자리만 있는 칸 (글 없음 — 뉴스를 지어내지 않는다) · 시안의 주소 (회차 시안 화면 · 짧은 이야기 시안).
// 손으로 정한 것은 목록의 차례뿐이다. 나머지는 데이터에서 나온다:
//   이어지는 이야기인가   번호 화면 규칙 (catalog.numbered — 같은 시리즈에 긴 이야기가 둘 이상 실제로 있다 · D88 E-20). "N화" · 시리즈 줄 · 지난 이야기는 이때만 보인다 (D79 ①)
//   체험이 있는가         계약의 solve.lab 이 있나
//   읽는 시간은 내지 않는다 (D82 · UX-7b — 어림 함수도 뺐다)
import { STORIES, shortPath, type Line } from "../../../episode/catalog";
import { sharedConcepts as shared } from "../../../episode/today/concepts";
import { SHORT } from "./short/data";

export { SHORT };
export type TodayItem = Line | { kind: "empty" };

/** 차례 — 목록의 차례 그대로 (새 이야기가 위 · 까닭은 logs/frontend/UX-7.md ② · F-E2.md ②) + 빈 자리 */
export const TODAY: readonly TodayItem[] = [...STORIES, { kind: "empty" }];

/** 시안의 주소 — 긴 이야기는 그 회차의 시안 화면 (path), 짧은 이야기 시안은 골든 넷째 하나뿐이라 그것만 /lab/today/short (다른 짧은 이야기는 실제 주소로) */
export const labHref = (line: Line): string => (line.kind === "long" ? line.ep.path : line.story.code === SHORT.code ? "/lab/today/short" : shortPath(line.story));

/** 오늘의 이야기들이 함께 가진 개념 — 이름이 같은 도구 (어림 — episode/today/concepts.ts) */
export const sharedConcepts = () => shared(STORIES, labHref);
