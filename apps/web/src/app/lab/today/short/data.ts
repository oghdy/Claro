// UX-7 — 짧은 이야기 견본: 영훈의료재단 (개인정보위 2026-10-28 의결 · 10-29 발표 — 「내 정보는 누가 지키나」의 긴 이야기와 **같은 발표**의 병원 쪽).
// **이야기의 글 · 근거 · 풀이 칸은 골든 넷째에 있다**: fixtures/episode-short-privacy-yeonghun.json (계약 docs/contract/EPISODE.md §13 의 ShortStory — B-E3).
// 손으로 쓴 것은 UX-7 이고 (모델 API 0 · 재료 = logs/pipeline/E3-1.md ③ · D69), B-E3 이 그 글을 한 글자도 바꾸지 않고 계약 모양으로 옮겼다 (lab 전용 꼴 · types.ts 는 지웠다).
// 구절은 git 에 있는 문서에서만 (E3-1b · D70): 개인정보위 보도자료 PDF (문서 안 공공누리 제1유형 표시) · 개인정보 보호법. check.ts 가 계약 검증으로 저장된 문서와 대조한다.
// 여기에는 시안 전용만 있다 — 문서 파일의 자리 · 화면의 글.
import { parseShortStory, type ShortStory } from "@claro/contract";
import golden from "../../../../../../../fixtures/episode-short-privacy-yeonghun.json";
import { PIPC } from "../../../../episode/episodes/pipc/data";

/** 짧은 이야기 = 골든 넷째. 곁 이야기 · 도구는 개인정보 1화 (PIPC) 를 가리킨다 — 받아서 대 본다 (같은 사건 · 도구가 거기 있다) */
export const SHORT: ShortStory = parseShortStory(golden, { episodes: [PIPC] });
// 이 시안은 곁 이야기 · 도구의 이야기로 PIPC 하나만 그린다 (지도 · 접힌 카드 · 곁 이야기로 가는 길)
for (const ref of [SHORT.sibling?.episode, SHORT.tools_from?.episode])
  if (!ref || ref.episode_id !== PIPC.episode_id || ref.episode_version !== PIPC.episode_version) throw new Error("짧은 이야기 시안은 개인정보 1화 (PIPC) 곁의 이야기만 그린다");

/** 근거 문서가 저장된 파일 (저장소 뿌리에서) — check.ts 가 구절을 대조할 때 읽는다. git 에 있는 파일이다 */
export const SHORT_STORES = ["packages/pipeline/data/events/PIPC-20261028-SAFETY-MEASURES/store.documents.json"] as const;

/** 화면의 글 (이야기의 글이 아니다) — F-E2 에서 kit/chrome.ts 로 갔다 (실제 주소와 같은 부품 · 같은 글). check.ts 가 여기서 읽는다 */
export { SHORT_CHROME } from "../../../../episode/kit/chrome";
