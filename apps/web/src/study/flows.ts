// F-3 첫 회의 흐름 — 언제 무엇을 묻나 (D37). 물음의 글은 ./probes.ts, 화면의 글은 ./copy.ts.
//   읽기 전 하나 · 다 읽은 직후 셋 · 며칠 뒤 같은 셋. 순서는 고정이다 — 두 무리 · 두 시점이 같은 물음을 같은 차례로 받는다.
// "며칠"은 여기 없다. 며칠 뒤의 링크를 도윤이 보내는 날이 그날이다 — 두 노출의 시각 차이가 사실이다.
// 무리를 고르는 것 · 물음을 고르는 것(ACTIVE · AUDIT)은 없다. 무리는 주소가 가른다
import type { Position, ProbeType } from "@claro/contract";
import type { ProbeLabel } from "./probes";

export const ASKS: Record<Position, { ask: ProbeLabel[]; probe_type: ProbeType }> = {
  PRE: { ask: ["P0"], probe_type: "DIAGNOSTIC" },
  POST: { ask: ["P1", "P2", "P3"], probe_type: "COMPREHENSION" },
  DELAYED: { ask: ["P1", "P2", "P3"], probe_type: "COMPREHENSION" },
};

/**
 * 일반 기사 무리가 읽을 바깥 기사 — **도윤이 정한다.** 여기 한 곳에만 적는다. `url` 이 비어 있으면 그 흐름(/news)은 "준비 중"으로 뜬다.
 * 남의 기사 글을 우리 화면에 싣지 않는다 — 주소로만 보낸다 (새 탭). `title` 은 링크에 적을 말이다 (비우면 "기사 읽으러 가기")
 */
export const OUTSIDE_ARTICLE: { url: string; title: string } = {
  // 앞의 환경 변수는 테스트만 쓴다 (빌드할 때 굳는다 — e2e/database.ts). 실제 주소는 그 뒤에 적는다 — 비우면("") 흐름이 닫힌다
  // 더팩트 2026-09-17 — 같은 사건(9월 FOMC 금리 인상)의 국내 기사. 도윤이 골랐다 (D37 "0.5 코드" 판정 4)
  url: process.env.NEXT_PUBLIC_CLARO_TEST_OUTSIDE_URL || "https://news.tf.co.kr/read/world/2366861.htm",
  title: "",
};

/** 주소 — Claro 무리 · 일반 기사 무리 · 며칠 뒤 (두 무리 공통). 독자 번호는 어디서나 `?r=` 다 */
export const PATHS = { claro: "/", news: "/news", again: "/again" } as const;
