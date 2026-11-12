// UX-6 — 같은 그림의 지난 값 (계약 EPISODE §7.9 — 실물 전)이 화면에 어떻게 보이나 보려는 **견본**. 실제 회차가 아니다.
// 금리 2화 (손 · 골든 fixtures/episode-rate-2.json)에 지난 값과 지난 회차 칸을 **시안에서만** 붙였다 — 골든 · 회차 글은 한 글자도 바꾸지 않았다.
// "지난 화" = 9월 (1화). 1화는 본 화면의 기사라 체험 그림이 없었다 — 그래서 이 지난 값은 **어느 회차에도 실린 적 없는 값**이다 (화면 맨 위에 크게 밝힌다).
// 값 자체는 지어내지 않았다 — 9월 문서 (이 회차가 이미 싣고 있는 구절)에 있는 것만:
//   기준금리   올렸어요 (다 닿음)      st09.raise — 9월 성명문 "raise the target range"
//   돈 빌리는 형편 아직 그대로 (안 닿음) pc10.cond — "Since our policy action in September, we have started to see some changes" (9월 조치 **뒤에** 조이기 시작)
//   물가       여전히 높음 (안 닿음)    st09.infl — 9월 성명문 "Inflation remains elevated."
//   그대로 두자 쪽 그대로 두자 · 0명 · 까닭 아직  st09.vote "12 – 0" (9월에는 아무도 그 자리에 앉지 않았다 — 그러니 그쪽의 까닭이 적힌 문서도 없다)
//   올리자 쪽  올리자 · 12명 · 까닭 있음  st09.vote "12 – 0" · st09.infl (9월 성명문이 올린 까닭을 적었다)
//   → 그대로 두자 쪽을 누르면 "지난 화에 ‘아직 문서에 없다’던 이 쪽의 까닭이 이번에 들어왔어요" (not-yet → in-doc) — 3화에서 올리자 쪽에 일어날 일과 같은 꼴
// 3화 (회의록)가 나오면 이 견본은 지운다 — 그때는 실물 (packages/pipeline/data/events/FOMC-20261028/episodes/rate-3/episode.json)이 지난 값을 싣는다 (../../rate-3).
import { parseEpisode, type ChainBefore, type Episode, type EpisodeRef, type SeatBefore } from "@claro/contract";
import golden from "../../../../../../../../fixtures/episode-rate-2.json";
import { FOMC } from "../fomc/data";
import type { EpisodeData } from "../../kit/types";

/** 맨 위 띠 — 시안 전용 글 (숫자 없음 — check.ts S4) */
export const CARRY_BANNER = {
  tag: "견본 · 실제 아님",
  note: "지난 화 (본 화면의 기사)에는 체험 그림이 없었어요. 지난 값이 어떻게 보일지 보려고, 지난 회의 문서의 값을 붙였어요.",
  real: "진짜 회차",
};

const BEFORE_CHAIN: Record<string, ChainBefore> = {
  rate: { reach: "full", value: { t: "올렸어요", src: ["st09.raise"] } },
  cond: { reach: "none", value: { t: "아직 그대로", src: ["pc10.cond"] } },
  infl: { reach: "none", value: { t: "여전히 높음", src: ["st09.infl"] } },
};
const BEFORE_SEATS: Record<string, SeatBefore> = {
  wait: { group: { t: "그대로 두자 · 0명", src: ["st09.vote"] }, why: "not-yet" },
  raise: { group: { t: "올리자 · 12명", src: ["st09.vote", "st09.infl"] }, why: "in-doc" },
};
/** 견본 — 가리키는 회차가 없다 (1화는 회차가 아니다). 계약의 칸을 채우려는 자리 표시 UUID */
const SAMPLE_PREVIOUS: EpisodeRef = { episode_id: "00000000-0000-4000-8000-0000000000c1", episode_version: 1 };

const base = parseEpisode(golden);
const lab = base.solve.lab!;
/** 계약의 회차 꼴 — check.ts 가 계약 검증 (저장된 문서로 구절 대조까지)에 넣는다 */
export const CARRY_EPISODE: Episode = {
  ...base,
  previous: SAMPLE_PREVIOUS,
  solve: {
    ...base.solve,
    lab: {
      ...lab,
      frames: lab.frames.map((f) =>
        f.kind === "chain"
          ? { ...f, nodes: f.nodes.map((n) => (BEFORE_CHAIN[n.id] ? { ...n, before: BEFORE_CHAIN[n.id] } : n)) }
          : f.kind === "seats"
            ? { ...f, sides: f.sides.map((s) => (BEFORE_SEATS[s.id] ? { ...s, before: BEFORE_SEATS[s.id] } : s)) }
            : f,
      ),
    },
  },
};

export const CARRY: EpisodeData = { ...CARRY_EPISODE, path: "/lab/episode/carry", short: "지난 값 견본", stores: FOMC.stores, readers: FOMC.readers };
