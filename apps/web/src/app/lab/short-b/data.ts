// UX-8b-B — 짧은 이야기 다시 쓰기: 「어른 셋 중 하나가 비만이라는데, 그 한 명은 누구일까」
// 질병관리청 「2025 지역사회건강조사」 비만 관련 지표 심층분석 (2026-11-09 발표) · 소스 팩 KDCA-20261109-OBESITY 그대로 · 카테고리 = 과학과 몸.
// **손으로 썼다 (모델 API 0).** 줄기 = 뉴스 (무슨 일이 · 누구에게): 비만율이 올라 셋 중 하나가 됐고, 그 비만은 남성 30~40대에 몰려 있다. 개념 (비만율 · 퍼센트포인트)은 길 위에서 줍는 도구다 (D95).
// 어떻게 썼는지는 logs/frontend/UX-8b-B.md ③. 꼴 · 부품은 ../short 의 것을 불러 쓴다 (고치지 않았다).
//
// **이야기의 글 · 근거는 골든 다섯째에 있다**: fixtures/episode-short-obesity-who.json (계약 docs/contract/EPISODE.md §14 의 짧은 이야기 새 꼴 FlowStory — B-E4).
// B-E4 가 이 파일에 있던 글을 한 글자도 바꾸지 않고 계약 모양으로 옮겼다 (logs/backend/B-E4.md ③). 화면 (../short/Light.tsx)은 lab 꼴 (../short/types.ts 의 LightStory)을 그리므로
// 계약 → lab 꼴로 되돌린다 — 칸의 이름 · 자리만. 되돌리기는 ../short/flow.ts 한 곳에 있다 (UX-8c 가 이 파일에서 옮겼다 — /lab/flow/license-notice 도 같은 것을 쓴다).
// 여기에는 시안 전용만 있다 — 카테고리 (계약에서는 카탈로그의 값 — EPISODE §14.7) · 사건 이름 · 문서 파일의 자리 · 화면의 글 · 견줘 읽기.
import { parseFlowStory, type FlowStory } from "@claro/contract";
import golden from "../../../../../../fixtures/episode-short-obesity-who.json";
import type { LightStory } from "../short/types";
import { LIGHT_CHROME as CHROME } from "../short/data";
import { toLight } from "../short/flow";

/** 짧은 이야기 새 꼴 = 골든 다섯째 — 계약 검증 (모양 · 숫자 · 뼈의 차례 · 뒤집기 · 고르기 · 문서의 문장 · 낱말)을 지난다. 구절을 저장된 문서와 대는 것은 ./check.ts (L2) */
export const FLOW: FlowStory = parseFlowStory(golden);

export const LIGHT: LightStory = toLight(FLOW, { event_code: "KDCA-20261109-OBESITY", category: "과학과 몸" });

/** 근거 문서가 저장된 파일 (저장소 뿌리에서) — check.ts 가 구절을 대조할 때 읽는다. git 에 있는 파일이다 */
export const LIGHT_STORES = ["packages/pipeline/data/events/KDCA-20261109-OBESITY/store.documents.json"] as const;

/** 화면의 글 — 부품 (../short/Light.tsx)이 ../short/data 의 것을 읽는다. 검사를 위해 같은 것을 다시 내보낸다 */
export const LIGHT_CHROME = CHROME;

/** 견줘 읽기 — 앞서 쓴 이야기 하나만 (시안 주소를 가리키기만 한다) */
export const COMPARE = [{ href: "/lab/short", kind: "앞서 쓴 같은 뉴스", title: "비만율이 26.9% 늘었다는데, 왜 더하면 안 맞을까" }] as const;
