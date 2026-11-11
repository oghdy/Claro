// 배달앱 회차 — 「누가 값을 정하나」 1화. **회차의 글 · 근거 · 풀이 칸은 골든 픽스처에 있다**: fixtures/episode-price-1.json
// (회차 계약 docs/contract/EPISODE.md 의 모양 — B-E1 이 UX-1 · UX-2 · UX-4 의 시안 데이터를 한 글자도 바꾸지 않고 옮겼다).
// 여기에는 시안 전용만 남았다 — 주소 · 문서 파일의 자리 · 두 독자의 고정값.
import { parseEpisode } from "@claro/contract";
import golden from "../../../../../../../../fixtures/episode-price-1.json";
import type { EpisodeData, ReaderFixture, ReaderId } from "../../kit/types";

// ─────────────────────────────────────────────────────────── 두 독자 — **손으로 적은 고정값이다**
// 지식 상태를 추정하지 않는다 (CLAUDE.md "절대 하지 말 것"). 아래 known 은 계산한 것이 아니라 시안이 정해 둔 것이다.
// 처음 온 독자는 "이거 알아요?" 에 스스로 답한 것만 접힌다 (D57 — 씨앗). 그것도 추정이 아니라 독자가 누른 그대로다.

export const READERS: Record<ReaderId, ReaderFixture> = {
  new: { id: "new", label: "처음 온 독자", note: "이 시리즈가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
  follower: {
    id: "follower",
    label: "따라온 독자",
    note: "0화를 읽음 · 개념 세 개를 이미 앎",
    known: ["fee", "mfn", "provisional"],
    readZero: true,
    // 「금리는 어디로」 2화까지 읽은 독자다 — 그 회차(episodes/fomc)의 진짜 개념 다섯. UX-1 에서는 지어낸 예시 둘이었다
    elsewhere: [{ series: "rate", concepts: ["rate", "target", "dots", "vote", "conditions"] }],
  },
};

export const DELIVERY: EpisodeData = {
  ...parseEpisode(golden),
  path: "/lab/episode",
  short: "배달앱",
  stores: ["packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json"],
  readers: READERS,
};
