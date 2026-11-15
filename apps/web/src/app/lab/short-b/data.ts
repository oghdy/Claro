// UX-8b-B — 짧은 이야기 다시 쓰기: 「어른 셋 중 하나가 비만이라는데, 그 한 명은 누구일까」
// 질병관리청 「2025 지역사회건강조사」 비만 관련 지표 심층분석 (2026-11-09 발표) · 소스 팩 KDCA-20261109-OBESITY 그대로 · 카테고리 = 과학과 몸.
// **손으로 썼다 (모델 API 0).** 줄기 = 뉴스 (무슨 일이 · 누구에게): 비만율이 올라 셋 중 하나가 됐고, 그 비만은 남성 30~40대에 몰려 있다. 개념 (비만율 · 퍼센트포인트)은 길 위에서 줍는 도구다 (D95).
// 어떻게 썼는지는 logs/frontend/UX-8b-B.md ③. 꼴 · 부품은 ../short 의 것을 불러 쓴다 (고치지 않았다).
//
// **이야기의 글 · 근거는 골든 다섯째에 있다**: fixtures/episode-short-obesity-who.json (계약 docs/contract/EPISODE.md §14 의 짧은 이야기 새 꼴 FlowStory — B-E4).
// B-E4 가 이 파일에 있던 글을 한 글자도 바꾸지 않고 계약 모양으로 옮겼다 (logs/backend/B-E4.md ③). 화면 (../short/Light.tsx)은 lab 꼴 (../short/types.ts 의 LightStory)을 그리므로
// 여기서 계약 → lab 꼴로 되돌린다 — 칸의 이름 · 자리만 (뒤집기 · 고르기의 표시는 lab 꼴의 beat 칸으로 · 표시 없는 문단은 칸을 뺀다 · 표지의 물음 단추는 글자만).
// 여기에는 시안 전용만 있다 — 카테고리 (계약에서는 카탈로그의 값 — EPISODE §14.7) · 사건 이름 · 문서 파일의 자리 · 화면의 글 · 견줘 읽기.
import { parseFlowStory, type FlowBlock, type FlowStory } from "@claro/contract";
import golden from "../../../../../../fixtures/episode-short-obesity-who.json";
import type { Block, LightStory } from "../short/types";
import { LIGHT_CHROME as CHROME } from "../short/data";

/** 짧은 이야기 새 꼴 = 골든 다섯째 — 계약 검증 (모양 · 숫자 · 뼈의 차례 · 뒤집기 · 고르기 · 문서의 문장 · 낱말)을 지난다. 구절을 저장된 문서와 대는 것은 ./check.ts (L2) */
export const FLOW: FlowStory = parseFlowStory(golden);

/** 계약의 덩이 → lab 꼴의 덩이 */
const toBlock = (b: FlowBlock): Block => {
  if (b.kind === "p") return b.beat ? { kind: "p", beat: b.beat, text: b.text } : { kind: "p", text: b.text };
  if (b.kind === "cite") return { kind: "cite", label: b.label, text: b.text };
  if (b.kind === "flip") return { kind: "flip", beat: "flip", label: b.label, a: b.a, op: b.op, b: b.b, note: b.note };
  return { kind: "pick", beat: "try", ask: b.ask, options: b.options };
};

export const LIGHT: LightStory = {
  code: FLOW.code,
  weight: FLOW.weight,
  event_code: "KDCA-20261109-OBESITY",
  category: "과학과 몸",
  docs: FLOW.docs,
  quotes: FLOW.quotes,
  voice_labels: FLOW.voice_labels,
  cover: { title: FLOW.cover.title, dek: FLOW.cover.dek, meta: FLOW.cover.meta, ask: FLOW.cover.ask.t },
  flow: FLOW.flow.map(toBlock),
  keep: FLOW.keep,
  not_drawn: FLOW.not_drawn,
};

/** 근거 문서가 저장된 파일 (저장소 뿌리에서) — check.ts 가 구절을 대조할 때 읽는다. git 에 있는 파일이다 */
export const LIGHT_STORES = ["packages/pipeline/data/events/KDCA-20261109-OBESITY/store.documents.json"] as const;

/** 화면의 글 — 부품 (../short/Light.tsx)이 ../short/data 의 것을 읽는다. 검사를 위해 같은 것을 다시 내보낸다 */
export const LIGHT_CHROME = CHROME;

/** 견줘 읽기 — 앞서 쓴 이야기 하나만 (시안 주소를 가리키기만 한다) */
export const COMPARE = [{ href: "/lab/short", kind: "앞서 쓴 같은 뉴스", title: "비만율이 26.9% 늘었다는데, 왜 더하면 안 맞을까" }] as const;
