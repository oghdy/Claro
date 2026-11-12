// 개인정보 회차 — 「내 정보는 누가 지키나」 1화 (UX-5). **회차의 글 · 근거 · 풀이 칸은 골든 픽스처에 있다**: fixtures/episode-privacy-1.json
// (회차 계약 docs/contract/EPISODE.md 의 모양 — 손으로 썼다. 재료는 logs/pipeline/E3-1.md ③ · D69. 넘겨 보기 틀의 첫 실물).
// 여기에는 시안 전용만 있다 — 주소 · 문서 파일의 자리 · 두 독자의 고정값.
import { parseEpisode } from "@claro/contract";
import golden from "../../../../../../fixtures/episode-privacy-1.json";
import type { EpisodeData, ReaderFixture, ReaderId } from "../../kit/types";

// ─────────────────────────────────────────────────────────── 두 독자 — **손으로 적은 고정값이다**
// 지식 상태를 추정하지 않는다 (CLAUDE.md "절대 하지 말 것"). 아래 known 은 계산한 것이 아니라 시안이 정해 둔 것이다.
// 이 회차의 둘째 독자는 "이 시리즈를 따라온 독자"가 아니다 (1화라 그런 독자가 없다) — **다른 두 시리즈를 따라온 독자**다:
// 배달앱 1화 · 금리 2화를 읽었고, 거기서 만난 과징금 · 시정명령을 안다고 **정해 뒀다**. 이 시리즈의 지금까지의 이야기는 읽지 않았다.

export const READERS: Record<ReaderId, ReaderFixture> = {
  new: { id: "new", label: "처음 온 독자", note: "Claro 가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
  follower: {
    id: "follower",
    label: "건너온 독자",
    note: "다른 두 시리즈를 따라옴 · 과징금과 시정명령을 이미 앎 · 이 시리즈는 처음",
    known: ["fine", "order"],
    readZero: false,
    // 「누가 값을 정하나」 1화 · 「금리는 어디로」 2화를 끝까지 읽은 독자다 — 그 회차들의 진짜 도구 전부
    elsewhere: [
      { series: "price", concepts: ["fee", "mfn", "dominance", "provisional"] },
      { series: "rate", concepts: ["rate", "target", "vote", "conditions", "dots"] },
    ],
  },
};

export const PIPC: EpisodeData = {
  ...parseEpisode(golden),
  path: "/lab/episode/pipc",
  real: "/s/privacy/1",
  announced: "2026-10-29",
  short: "개인정보",
  stores: [
    "packages/pipeline/data/events/PIPC-20261028-SAFETY-MEASURES/store.documents.json",
    // 견주기 장면 — 「누가 값을 정하나」 1화의 공정위 보도자료 구절 둘
    "packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json",
  ],
  readers: READERS,
};
