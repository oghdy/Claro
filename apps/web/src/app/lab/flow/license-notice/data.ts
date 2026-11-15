// UX-8c — 짧은 이야기 새 꼴의 첫 한 편을 폰으로 읽는 시안: 국민권익위원회 2026-10-28 발표 (운전면허 정지처분 세 건 취소) · 사건 ACRC-20261028-LICENSE-NOTICE · 카테고리 = 나라와 법.
// **이야기의 글 · 근거는 이 파일에 없다** — story.json (계약 FlowStory · docs/contract/EPISODE.md §14)을 빌드할 때 읽는다.
// 편집자 손질 (human.json → story.json 다시 짓기)은 다음 빌드에 그대로 실린다. 글을 코드에 옮겨 적지 않는다.
// 읽는 길: story.json → parseFlowStory (계약 검증 — 저장된 문서를 같이 주어 구절이 문서의 글 그대로인지도 본다 · 어기면 빌드가 멈춘다)
//          → ../../short/flow.ts 의 toLight (lab 꼴로 되돌리기 — /lab/short-b 와 같은 것) → ../../short/Light.tsx (고치지 않았다).
// 여기에는 시안 전용만 있다 — 사건 이름 · 카테고리 (계약에서는 카탈로그의 값 — EPISODE §14.7) · 문서 파일 · 견줘 읽기.
import { parseFlowStory, type FlowStory } from "@claro/contract";
import story from "../../../../../../../packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice-flow/story.json";
import before from "../../../../../../../packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice/story.json";
import store from "../../../../../../../packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/store.documents.json";
import { toLight } from "../../short/flow";
import type { LightStory } from "../../short/types";

/** 짧은 이야기 새 꼴 — 계약 검증 (모양 · 숫자 · 뼈의 차례 · 뒤집기 · 고르기 · 문서의 문장 · 낱말 · 구절이 저장된 문서의 글 그대로)을 지난다 */
export const FLOW: FlowStory = parseFlowStory(story, { documents: store.source_documents });

export const LIGHT: LightStory = toLight(FLOW, { event_code: "ACRC-20261028-LICENSE-NOTICE", category: "나라와 법" });

/** 견줘 읽기 — 같은 원문으로 앞서 낸 옛 꼴 (실제 주소를 가리키기만 한다). 제목은 그 이야기의 파일에서 읽는다 */
export const COMPARE = [{ href: "/short/license-notice", kind: "같은 원문 · 앞서 낸 글", title: before.scenes.cover.title.replace(/\n/g, " ") }] as const;
