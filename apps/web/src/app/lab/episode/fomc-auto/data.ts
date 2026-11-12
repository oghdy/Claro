// 파이프라인이 만든 금리 2화 (P-E1). **회차의 글 · 근거 · 풀이 칸은 파이프라인 산출물에 있다**:
//   packages/pipeline/data/events/FOMC-20261028/episode/episode.json  (회차 계약 docs/contract/EPISODE.md 의 모양)
//   packages/pipeline/data/events/FOMC-20261028/episode/review.json   (사람 확인 목록 — 따라온 독자가 아는 도구도 여기서 읽는다)
// 여기에는 시안 전용만 있다 — 주소 · 문서 파일의 자리 · 두 독자의 고정값 · 맨 위 띠의 말.
import { validateEpisode } from "@claro/contract";
import built from "../../../../../../../packages/pipeline/data/events/FOMC-20261028/episode/episode.json";
import review from "../../../../../../../packages/pipeline/data/events/FOMC-20261028/episode/review.json";
import type { EpisodeData, ReaderFixture, ReaderId } from "../../../../episode/kit/types";

/** 맨 위 띠 — 시안 전용 글 (숫자 없음) */
export const BANNER = {
  tag: "파이프라인이 만든 판",
  note: "사람 확인 전",
  hand: "손으로 만든 판 보기",
  broken: "파이프라인이 낸 회차가 계약 검증을 지나지 못했다 — 화면을 그리지 않는다.",
};

// 두 독자 — **손으로 적은 고정값이다** (지식 상태를 추정하지 않는다). 따라온 독자가 아는 도구 = 사람이 준 "지난 화에서 주운 도구" 와 같다고 설계 단계가 적은 것 (review.json follower_known)
const known = (review as { follower_known: string[] }).follower_known;
export const READERS: Record<ReaderId, ReaderFixture> = {
  new: { id: "new", label: "처음 온 독자", note: "이 시리즈가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
  follower: { id: "follower", label: "따라온 독자", note: "지난 화를 읽음", known, readZero: true, elsewhere: [{ series: "price", concepts: ["fee", "mfn", "provisional"] }] },
};

export const STORES = ["packages/pipeline/data/events/FOMC-20261028/store.documents.json", "fixtures/store.documents.json"] as const;

// 계약 검증을 지나지 못하면 화면을 그리지 않는다 (빌드는 깨지 않는다 — 같은 서버에 다른 회차가 있다). 구절 대조 (불변식 8)는 check.ts 가 문서를 읽어 본다
const r = validateEpisode(built);
export const AUTO_ERRORS: string[] = r.ok ? [] : r.errors.map((e) => `${e.code} ${e.path}: ${e.message}`);
export const AUTO: EpisodeData | null = r.ok ? { ...r.episode, path: "/lab/episode/fomc-auto", short: "금리 · 파이프라인", stores: STORES, readers: READERS } : null;
