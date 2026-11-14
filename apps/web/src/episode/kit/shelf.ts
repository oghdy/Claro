// 시리즈를 넘는 것 — 책장. 내 개념 지도는 시리즈마다 따로가 아니라 **하나다**: 다른 시리즈에서 주운 개념도 같이 보인다.
// 개념의 이름 · 한 줄은 그 시리즈의 회차 데이터에서 읽는다 (여기에 옮겨 적지 않는다). 회차들을 오가는 길도 여기서 나온다 (UX-5 부터 셋).
// 책장은 화면의 것이다 (계약이 아니다) — 회차 · 시리즈는 계약에 있다 (docs/contract/EPISODE.md). 독자의 지도가 무엇을 단위로 쌓이나는 정하지 않았다 (D64).
// F-E2: 책장의 이야기는 이야기 목록 (../catalog.tsx — 한 곳)에서 나온다 — 시리즈 (선반)마다 가장 새 긴 이야기 하나. 번호를 보일지도 목록이 정한다 (번호 화면 규칙 · D88 E-20).
import { latestPerSeries, numbered } from "../catalog";
import type { Concept, EpisodeData } from "./types";

export const EPISODES: readonly EpisodeData[] = latestPerSeries().map((x) => x.ep);

export interface ShelfEntry {
  series: string;
  name: string;
  /** 시안 주소 */
  path: string;
  /** 실제 주소 (F-E1) */
  real: string;
  short: string;
  /** 지금 열려 있는 회차 — "1화" · "2화" */
  episode: string;
  /** 실제 화면에서 번호를 보이나 — 같은 시리즈에 긴 이야기가 둘 이상 실제로 있을 때만 (catalog.numbered). 시안은 늘 보인다 */
  numbered: boolean;
  title: string;
  concepts: Record<string, Concept>;
}

export const SHELF: readonly ShelfEntry[] = EPISODES.map((e) => ({
  series: e.series.code,
  name: e.series.name,
  path: e.path,
  real: e.real ?? e.path,
  short: e.short,
  episode: e.scenes.cover.episode.t,
  numbered: numbered(e.series.code),
  title: e.scenes.cover.title.replace(/\n/g, " "),
  concepts: Object.fromEntries(e.tools.map((x) => [x.key, x])),
}));

/** 다른 회차로 가는 주소 — 실제 화면은 실제 주소로, 시안은 시안 주소로 (둘이 섞이지 않는다) */
export const hrefOf = (s: ShelfEntry, real: boolean): string => (real ? s.real : s.path);

export const shelfOf = (series: string): ShelfEntry | undefined => SHELF.find((s) => s.series === series);

/** 다른 이야기의 이름표 — 실제 화면은 번호 화면 규칙을 따른다 (번호가 없는 주제는 제목만). 시안은 데이터 그대로 "N화 · 제목" */
export const labelOf = (s: ShelfEntry, real: boolean): string => (real && !s.numbered ? s.title : `${s.episode} · ${s.title}`);
