// 짧은 이야기 새 꼴 (계약 FlowStory · docs/contract/EPISODE.md §14) → lab 꼴 (./types.ts 의 LightStory) 되돌리기. 화면 (./Light.tsx)이 lab 꼴을 그리기 때문이다.
// **칸의 이름 · 자리만 옮긴다 — 글은 한 글자도 손대지 않는다**: 뒤집기 · 고르기의 표시는 lab 꼴의 beat 칸으로 · 표시 없는 문단 (beat null)은 칸을 뺀다 · 표지의 물음 단추는 글자만.
// 쓰는 곳: /lab/short-b (골든 다섯째 — B-E4) · /lab/flow/license-notice (짧은 이야기 새 꼴 첫 한 편 — UX-8c). B-E4 가 short-b/data.ts 에 두었던 것을 UX-8c 가 여기 한 곳으로 옮겼다 (글자 그대로).
// D99 ④ (갈아 끼우기)에서 화면이 계약 타입을 바로 그리게 되면 이 파일은 지운다 (logs/backend/B-E4.md ⑥).
import type { FlowBlock, FlowStory } from "@claro/contract";
import type { Block, LightStory } from "./types";

/** 계약의 덩이 → lab 꼴의 덩이 */
const toBlock = (b: FlowBlock): Block => {
  if (b.kind === "p") return b.beat ? { kind: "p", beat: b.beat, text: b.text } : { kind: "p", text: b.text };
  if (b.kind === "cite") return { kind: "cite", label: b.label, text: b.text };
  if (b.kind === "flip") return { kind: "flip", beat: "flip", label: b.label, a: b.a, op: b.op, b: b.b, note: b.note };
  return { kind: "pick", beat: "try", ask: b.ask, options: b.options };
};

/** lab 꼴에만 있는 칸 — 계약에는 없다 (사건은 event_ref 의 UUID 로 가리킨다 · 카테고리는 카탈로그의 값 — EPISODE §14.7) */
export interface LabOnly {
  /** 사건 (packages/pipeline/data/events/<code>) */
  event_code: string;
  /** 표지 · 위쪽 줄의 꼬리표 (D83 다섯) */
  category: string;
}

/** 계약 검증을 지난 짧은 이야기 (새 꼴) → lab 꼴. 칸의 차례도 lab 꼴 그대로 */
export const toLight = (s: FlowStory, lab: LabOnly): LightStory => ({
  code: s.code,
  weight: s.weight,
  event_code: lab.event_code,
  category: lab.category,
  docs: s.docs,
  quotes: s.quotes,
  voice_labels: s.voice_labels,
  cover: { title: s.cover.title, dek: s.cover.dek, meta: s.cover.meta, ask: s.cover.ask.t },
  flow: s.flow.map(toBlock),
  keep: s.keep,
  not_drawn: s.not_drawn,
});
