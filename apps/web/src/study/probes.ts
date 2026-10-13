// F-3 첫 회의 물음 넷 — 판 1 (DECISIONS D37 의 표, **글자 그대로**). 화면과 데이터베이스가 같은 것을 읽는다:
//   화면은 빌드할 때 이 파일을 싣고 (데이터베이스가 죽어도 물음은 뜬다), `probes` 명령이 같은 줄을 데이터베이스에 넣는다. 둘이 같은지는 테스트가 본다.
// **만든 뒤 고치지 않는다** (OBSERVATION §6.1). 글자가 하나라도 바뀌면 version 을 올린 새 줄을 더한다 — 옛 판을 지우거나 고쳐 쓰지 않는다.
// 보기의 순서는 고정이다 — 두 무리 · 두 시점이 같은 물음을 받았다는 것이 먼저다 (D37).
// 물음을 어디에 놓나 · 언제 묻나는 여기 없다 (그것은 흐름의 일이다 — ./flows.ts). 여기는 물음의 판뿐이다
import type { Probe } from "@claro/contract";

const EVENT_FOMC = "15661514-6b4a-4da8-8879-47430c6be5a9"; // Event FOMC-20260916 (fixtures/store.json)
const GOAL_COMMON = "689476be-768a-4222-aca4-bfcb84754ab4"; // 그 사건의 COMMON 요점
const C_0002 = { concept_id: "8099c201-8ace-4262-acaf-8fda2a57b6d4", version: 4 }; // INFLATION_LEVEL_VS_RATE — 수준이 아니라 상승률

export const PROBES = {
  /** 읽기 전 — 얼마나 알고 왔나. 정답이 없다 */
  P0: {
    probe_id: "ce1079c0-58ee-4737-bc19-bf873473a441", version: 1, created_on: "2026-10-13", event_id: EVENT_FOMC, goal_ref: GOAL_COMMON, targets: [],
    prompt: "지난 9월 미국이 금리를 올렸다는 소식, 얼마나 알고 계세요?",
    choices: ["처음 듣는다", "들어는 봤다", "왜 올렸는지도 안다"], correct_choice: null,
  },
  /** 요점을 제 말로 — 가장 중요한 물음. 맞았는지는 기계가 가리지 않는다 (is_correct null — 도윤이 읽고 가린다, 원장 밖) */
  P1: {
    probe_id: "60b0ea20-1fc1-4bfd-8526-ad507f8a7e97", version: 1, created_on: "2026-10-13", event_id: EVENT_FOMC, goal_ref: GOAL_COMMON, targets: [],
    prompt: "미국 연준이 왜 금리를 올렸는지, 친구에게 말하듯 한두 문장으로 적어 주세요.",
    choices: null, correct_choice: null,
  },
  /** 요점을 고르기로. 정답은 셋째. 둘째가 이 기사가 깨려는 오해다 */
  P2: {
    probe_id: "832361fa-ced1-4926-b49b-05e5ab45d9e7", version: 1, created_on: "2026-10-13", event_id: EVENT_FOMC, goal_ref: GOAL_COMMON, targets: [],
    prompt: "연준이 금리를 올린 이유로 가장 가까운 것은?",
    choices: ["경기가 너무 좋아서 식히려고", "물가가 갑자기 크게 나빠져서", "물가가 오르는 속도가 충분히 빨리 줄고 있다는 확신이 없어서", "잘 모르겠다"],
    correct_choice: 2,
  },
  /** 개념 C-0002 를 겨눈다 — 이 물음의 응답이 그 개념의 증거 줄이 된다. 요점에서 나온 물음이 아니다 (goal_ref null) */
  P3: {
    probe_id: "29320d2c-d2bb-452f-90c0-73a126b6931f", version: 1, created_on: "2026-10-13", event_id: EVENT_FOMC, goal_ref: null, targets: [C_0002],
    prompt: '"물가 상승률이 내려오고 있다"는 말은 물건값이 싸지고 있다는 뜻일까요?',
    choices: ["그렇다", "아니다", "잘 모르겠다"], correct_choice: 1,
  },
} as const satisfies Record<string, Probe>;

export type ProbeLabel = keyof typeof PROBES;
export const PROBE_LABELS = Object.keys(PROBES) as ProbeLabel[];
/** probe_id → 사람이 부르는 이름 (P0 …). 원장에는 없는 이름이다 */
export const labelOf = (probe_id: string): ProbeLabel | undefined => PROBE_LABELS.find((l) => PROBES[l].probe_id === probe_id);
