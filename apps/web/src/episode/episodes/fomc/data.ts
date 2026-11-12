// 금리 회차 — 「금리는 어디로」 2화. **회차의 글 · 근거 · 풀이 칸은 골든 픽스처에 있다**: fixtures/episode-rate-2.json
// (회차 계약 docs/contract/EPISODE.md 의 모양 — B-E1 이 UX-2 · UX-4 의 시안 데이터를 한 글자도 바꾸지 않고 옮겼다).
// 여기에는 시안 전용만 남았다 — 주소 · 문서 파일의 자리 · 두 독자의 고정값.
import { parseEpisode } from "@claro/contract";
import golden from "../../../../../../fixtures/episode-rate-2.json";
import type { EpisodeData, ReaderFixture, ReaderId } from "../../kit/types";

// ─────────────────────────────────────────────────────────── 두 독자 — **손으로 적은 고정값이다**
// 지식 상태를 추정하지 않는다. 따라온 독자 = 1화(9월 — 지금 본 화면의 기사)를 읽은 독자. 그 기사에서 주운 개념 셋을 안다고 **정해 뒀다**.

export const READERS: Record<ReaderId, ReaderFixture> = {
  new: { id: "new", label: "처음 온 독자", note: "이 시리즈가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
  follower: {
    id: "follower",
    label: "따라온 독자",
    note: "1화를 읽음 · 개념 세 개를 이미 앎",
    known: ["rate", "target", "dots"],
    readZero: true,
    // 「누가 값을 정하나」 0화까지 읽은 독자다 — 그 회차(episodes/delivery)의 따라온 독자가 아는 셋과 같다
    elsewhere: [{ series: "price", concepts: ["fee", "mfn", "provisional"] }],
  },
};

export const FOMC: EpisodeData = {
  ...parseEpisode(golden),
  path: "/lab/episode/fomc",
  real: "/s/rate/2",
  announced: "2026-10-28",
  short: "금리",
  stores: ["packages/pipeline/data/events/FOMC-20261028/store.documents.json", "fixtures/store.documents.json"],
  readers: READERS,
};
