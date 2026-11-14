// UX-8 — 짧은 이야기 손 견본의 **lab 전용 꼴**. 계약이 아니다 (계약의 짧은 이야기는 ShortStory — docs/contract/EPISODE.md §13 · 장면 넷 고정).
// 이 견본의 글은 그 꼴에 들어가지 않는다 — 무엇이 안 맞는지는 아래 「안 맞음 1 ~ 7」 과 logs/frontend/UX-8.md ⑦ 에 적었다.
// **계약을 고치지 않았다** (D91: 도윤이 이 견본을 보고 "이거다" 하면 그 뒤에 백엔드가 실물에서 도출한다 — D24).
// 그대로 쓴 계약의 것: 글 한 덩이 EpisodeText ({ t, src?, calc?, voice? }) · docs · quotes · voice_labels · 근거 규칙 (구절은 저장된 문서의 글 그대로 · 글의 숫자는 구절 안의 수 또는 calc).
import type { EpisodeText } from "@claro/contract";

export type T = EpisodeText;

/** 이야기의 뼈 — 흐름 안에서 그 덩이가 맡은 자리. 계약 SolveEntry 의 칸 (first_thought · breaker · flip)과 같은 뜻이고, 여기서는 **칸이 아니라 흐름 속의 표시**다 */
export type Beat = "first_thought" | "breaker" | "name" | "flip" | "try" | "land";

/**
 * 흐름의 한 덩이. 이야기는 덩이의 **차례**다 (칸의 묶음이 아니다).
 *   p     글 한 문단
 *   cite  문서의 문장을 그대로 보여 준다 (글자 그대로 — 구절 안에 있어야 한다)
 *   flip  뒤집기 한 줄 (A ≠ B)
 *   pick  예상 한 번 고르기 — 고르면 아래가 이어진다. 어느 쪽을 골라도 이야기는 같은 곳으로 간다 (가르는 것은 받는 말 한 덩이뿐)
 */
export type Block =
  | { kind: "p"; beat?: Beat; text: T }
  | { kind: "cite"; beat?: Beat; label: string; text: T }
  | { kind: "flip"; beat: "flip"; label: string; a: T; op: "≠" | "="; b: T; note: T }
  | { kind: "pick"; beat: "try"; ask: T; options: readonly { key: string; label: T; reply: T }[] };

/** 개념 낱말 — 긴 이야기의 도구 카드 (계약 Tool)를 가볍게: 이름 · 한 줄 · 풀이. 지도의 자리 · 줍는 장면이 없다 */
export interface Word {
  key: string;
  name: string;
  short: T;
  body: readonly T[];
}

export interface LightStory {
  code: string;
  weight: "short";
  /** 사건 (packages/pipeline/data/events/<code>) */
  event_code: string;
  /** 표지 · 위쪽 줄의 꼬리표 — 카테고리 (D83 다섯). 선반 (series)이 없다 — 안 맞음 2 */
  category: string;
  docs: Record<string, { source_id: string; name: string }>;
  quotes: Record<string, { doc: string; quote: string }>;
  voice_labels: { fact: string; official: string; explain: string };
  cover: { title: T; dek: T; meta: T; ask: string };
  /** 이야기 — 한 흐름 */
  flow: readonly Block[];
  /** 남는 한 줄 · 낱말 · 누구의 말 (흐름의 끝에 이어 붙는다 — 따로 선 장면이 아니다) */
  keep: { line_label: string; line: T; words_label: string; words: readonly Word[]; whose: T };
  /** 그리지 않을 것 — 사람이 보는 글 (독자 글이 아니다) */
  not_drawn: readonly string[];
}

// ─────────────────────────────────────────────────────────── 지금 계약 (ShortStory · EPISODE §13)과 안 맞음
// 1  **장면 넷 고정** (cover · where · why · keep — SHORT_SCENE_IDS · 불변식 28). 이 견본은 표지 + 한 흐름이다. where 의 칸 (kicker · body · unknown · ask) · why 의 칸 (title · lead · real_label · real[] · verdict · ask) · keep 의 칸 (title · advice_label · advice)이 **전부 필수**라 흐름을 칸에 맞춰 자르게 된다 — "짚은 것 1 · 2 · 3" (why.real)이 그 칸이다
// 2  **series (선반) 필수.** 홀로 선 가벼운 이야기는 선반이 없다 — 카테고리 꼬리표뿐. (P-S1 은 선반 「처분은 어떻게 뒤집히나」를 새로 지었다)
// 3  **체험 칸 없음** (불변식 28 — lab 금지 · plain.kind = flip). 이 견본에는 "예상 한 번 고르기"가 있다 (긴 이야기의 틀 여섯 어느 것도 아니다 — 가장 작은 꼴)
// 4  **개념 낱말을 둘 곳이 없다.** 계약의 도구는 긴 이야기의 카드를 가리키기만 한다 (tools_from · 불변식 29) — 홀로 선 이야기는 null 이다 (E-24). 이 견본은 낱말 둘을 스스로 든다
// 5  **제목 · 뒤집기의 두 말 · 남는 한 줄이 맨 글자열** (숫자 금지 — 불변식 10). 이 이야기는 숫자가 주인공이라 제목 · 뒤집기 · 고르는 단추에 숫자가 있다 → 근거를 다는 글 덩이 (T)로 썼다
// 6  **keep.advice (기관의 당부) 필수 · where.unknown ("문서에 없어요") 필수.** 이 견본은 당부를 싣지 않았고 (이야기의 줄기가 아니다), 없다는 말은 "누구의 말" 한 덩이에 같이 있다
// 7  **solve.entry 의 칸** (first_thought · breaker · flip · whose · not_drawn)은 뜻 그대로 살아 있다 — 다만 칸이 아니라 흐름 속의 표시 (beat)다. 계약이 흐름을 받게 되면 이 표시가 불변식 11 · 14 를 잇는다
