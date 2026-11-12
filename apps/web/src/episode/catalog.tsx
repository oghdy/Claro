// 실제 화면에 나가는 회차 (F-E1 · D76) — 골든 셋. 첫 화면 (/)과 회차 화면 (/s/<시리즈>/<n>)이 이것 하나를 읽는다.
// **회차의 글 · 근거 · 풀이 칸은 골든 픽스처 (fixtures/episode-*.json — 계약 검증을 지난 것)에 있다.** 여기는 어느 회차가 나가는지와 그 회차의 화면 부품만 적는다.
// 데이터베이스를 읽지 않는다 — 빌드할 때 정적 페이지에 실린다 (옛 화면과 같다: 판은 불변이라 요청마다 읽을 이유가 없다).
// 나가지 않는 것: 파이프라인 시험판 (lab/episode/fomc-auto) · 3화 자리 (lab/episode/rate-3) · 견본 둘 (조용히 · 지난 값) — 시안 주소에만 있다.
// 새 회차를 실제 주소에 올리는 길: 게이트를 지난 회차 파일을 여기 한 줄로 올리고 push 한다 (push = 배포 · D76).
import type { ComponentType } from "react";
import { DeliveryEpisode } from "./episodes/delivery";
import { CoverArt as DeliveryArt } from "./episodes/delivery/Art";
import { DELIVERY } from "./episodes/delivery/data";
import { FomcEpisode } from "./episodes/fomc";
import { CoverArt as FomcArt } from "./episodes/fomc/Art";
import { FOMC } from "./episodes/fomc/data";
import { PipcEpisode } from "./episodes/pipc";
import { CoverArt as PipcArt } from "./episodes/pipc/Art";
import { PIPC } from "./episodes/pipc/data";
import type { EpisodeData } from "./kit/types";

export interface LiveEpisode {
  ep: EpisodeData;
  /** 회차 화면 — 공통 뼈대 (kit/Episode) + 이 회차의 표지 그림 · 도구 그림 */
  Screen: ComponentType<{ real?: boolean }>;
  /** 표지 그림 — 첫 화면도 같은 그림을 쓴다 */
  Art: ComponentType;
}

/** 차례 = 첫 화면의 시리즈 차례. 시리즈마다 지금은 회차가 하나다 */
export const LIVE: readonly LiveEpisode[] = [
  { ep: DELIVERY, Screen: DeliveryEpisode, Art: DeliveryArt },
  { ep: FOMC, Screen: FomcEpisode, Art: FomcArt },
  { ep: PIPC, Screen: PipcEpisode, Art: PipcArt },
];

/** 실제 주소 — 시리즈의 code 와 회차 번호 (둘 다 계약의 칸: Series.code · Episode.number) */
export const realPath = (ep: EpisodeData): string => `/s/${ep.series.code}/${ep.number}`;

export const liveOf = (series: string, n: string): LiveEpisode | undefined => LIVE.find((x) => x.ep.series.code === series && String(x.ep.number) === n);

/** 오늘의 회차 — 가장 최근에 발표된 것 (EpisodeData.announced — 손으로 적은 날. 계약에 발행 시각 칸이 없다) */
export const today = (): LiveEpisode => [...LIVE].sort((a, b) => (b.ep.announced ?? "").localeCompare(a.ep.announced ?? ""))[0]!;

/** 한 줄 제목 — 표지 제목의 줄바꿈을 빈칸으로 (글자는 그대로) */
export const oneLine = (title: string): string => title.replace(/\n/g, " ");
