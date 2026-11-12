// 「금리는 어디로」 3화 — 10월 회의록 (MIN-10)으로 파이프라인이 낸다 (P-E2 ① · 회의록 날 11/18 무렵). **이 파일은 서버에서만 읽힌다** (node:fs).
// 회차의 글 · 근거 · 풀이 칸은 파이프라인 산출물에 있다 — 이 주소는 **파일만 생기면** 그린다 (다시 빌드하지 않아도 된다 — page.tsx 가 요청마다 읽는다):
//   packages/pipeline/data/events/FOMC-20261028/episodes/rate-3/episode.json  (회차 계약 docs/contract/EPISODE.md 의 모양 — `episode rate-3` 이 짓는다)
//   packages/pipeline/data/events/FOMC-20261028/episodes/rate-3/review.json   (사람 확인 목록 — 따라온 독자가 아는 도구 follower_known · 낼 수 있나 publishable)
// 파일이 없으면 "회의록을 기다리는 중" 한 장. 계약 검증을 못 지나면 그리지 않고 오류를 보인다 (fomc-auto 와 같다).
// 지난 회차 = 손 2화 (fixtures/episode-rate-2.json — data/series/rate.json 의 rate-3.previous). 그것을 받아 같은 그림 · 지난 값 · 옮겨 온 구절을 대 본다 (계약 §7.9 · PREV_MISMATCH).
// fomc-auto/ 다섯 파일을 본떴다 (page · data · 화면 · check · css). kit · 다른 회차의 파일은 고치지 않았다.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEpisode, validateEpisode, type Episode } from "@claro/contract";
import previousGolden from "../../../../../../../fixtures/episode-rate-2.json";

export const EVENT_DIR = "packages/pipeline/data/events/FOMC-20261028/episodes/rate-3";
export const EPISODE_FILE = `${EVENT_DIR}/episode.json`;
export const REVIEW_FILE = `${EVENT_DIR}/review.json`;
/** 근거 문서가 저장된 파일 — 3화의 새 문서 (회의록)도 사건의 저장소에 들어간다 (rerun --doc MIN-10). 손 2화에서 옮겨 온 9월 문서는 fixtures 쪽 */
export const STORES = ["packages/pipeline/data/events/FOMC-20261028/store.documents.json", "fixtures/store.documents.json"] as const;
/** 지난 회차 — 손 2화 (계약 검증을 지난 것) */
export const PREVIOUS: Episode = parseEpisode(previousGolden);

/** 맨 위 띠 · 기다리는 화면 — 시안 전용 글. 숫자는 대기 화면의 날짜 하나뿐 (check.ts S4 가 그 하나만 받는다) */
export const COPY = {
  banner: { tag: "파이프라인이 만든 3화", review: "사람 확인 전", ready: "사람이 확인함", hand: "손 2화 보기" },
  wait: {
    series: "금리는 어디로",
    no: "3화",
    title: "회의록을\n기다리는 중이에요",
    when: "11/18 무렵",
    // 회의록은 결정 3주 뒤 (손 2화의 구절 cal.minutes "released three weeks after the date of the policy decision") · 결정 10월 28일 (st10.date) → 11월 18일
    body: [
      "2화에서 본 회의의 회의록이 나오면, 파이프라인이 3화를 만들어요.",
      "2화에서 해 본 그림 (브레이크 · 회의 자리)을 그대로 받아 오늘의 값만 바꾸고, 지난 화의 값을 옆에 놓아요.",
      "2화가 ‘아직 문서에 없다’고 한 것 — 올리자고 한 두 사람의 까닭 — 을 회의록에서 찾아봐요.",
    ],
    links: [
      { href: "/lab/episode/fomc", label: "지난 화 (2화) 보기" },
      { href: "/lab/episode/carry", label: "지난 값이 어떻게 보일지 — 견본" },
    ],
  },
  broken: "파이프라인이 낸 3화가 계약 검증을 지나지 못했다 — 화면을 그리지 않는다.",
};

export type Rate3 =
  | { state: "waiting" }
  | { state: "broken"; errors: string[] }
  | { state: "ok"; episode: Episode; known: string[]; publishable: boolean | null; warnings: string[] };

/** 저장소 뿌리 — next start / next dev 는 apps/web 에서 돈다 */
export const repoRoot = () => path.resolve(process.cwd(), "../..");

/** 파일이 있으면 읽어 계약 검증 (지난 회차와 대 보기까지). 구절 대조 (불변식 8)는 check.ts 가 문서를 읽어 본다 */
export function loadRate3(root = repoRoot()): Rate3 {
  const file = path.join(root, EPISODE_FILE);
  if (!existsSync(file)) return { state: "waiting" };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return { state: "broken", errors: [`episode.json 을 읽지 못했다 — ${String(e)}`] };
  }
  const r = validateEpisode(raw, { previous: PREVIOUS });
  if (!r.ok) return { state: "broken", errors: r.errors.map((e) => `${e.code} ${e.path}: ${e.message}`) };
  const reviewFile = path.join(root, REVIEW_FILE);
  const review = existsSync(reviewFile) ? (JSON.parse(readFileSync(reviewFile, "utf8")) as { follower_known?: string[]; publishable?: boolean }) : {};
  return { state: "ok", episode: r.episode, known: review.follower_known ?? [], publishable: review.publishable ?? null, warnings: r.warnings.map((w) => `${w.code} ${w.path}`) };
}
