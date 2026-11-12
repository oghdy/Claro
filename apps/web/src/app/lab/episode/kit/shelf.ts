// 시리즈를 넘는 것 — 책장. 내 개념 지도는 시리즈마다 따로가 아니라 **하나다**: 다른 시리즈에서 주운 개념도 같이 보인다.
// 개념의 이름 · 한 줄은 그 시리즈의 회차 데이터에서 읽는다 (여기에 옮겨 적지 않는다). 회차들을 오가는 길도 여기서 나온다 (UX-5 부터 셋).
// 책장은 시안 전용이다 — 회차 · 시리즈는 계약에 있다 (docs/contract/EPISODE.md). 독자의 지도가 무엇을 단위로 쌓이나는 정하지 않았다 (D64).
import { DELIVERY } from "../episodes/delivery/data";
import { FOMC } from "../episodes/fomc/data";
import { PIPC } from "../episodes/pipc/data";
import type { Concept, EpisodeData } from "./types";

export const EPISODES: readonly EpisodeData[] = [DELIVERY, FOMC, PIPC];

export interface ShelfEntry {
  series: string;
  name: string;
  path: string;
  short: string;
  /** 지금 열려 있는 회차 — "1화" · "2화" */
  episode: string;
  title: string;
  concepts: Record<string, Concept>;
}

export const SHELF: readonly ShelfEntry[] = EPISODES.map((e) => ({
  series: e.series.code,
  name: e.series.name,
  path: e.path,
  short: e.short,
  episode: e.scenes.cover.episode.t,
  title: e.scenes.cover.title.replace(/\n/g, " "),
  concepts: Object.fromEntries(e.tools.map((x) => [x.key, x])),
}));

export const shelfOf = (series: string): ShelfEntry | undefined => SHELF.find((s) => s.series === series);
