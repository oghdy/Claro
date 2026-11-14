// UX-7 — 짧은 이야기의 꼴. **lab 전용이다 — 계약이 아니다** (계약은 실물에서 · D24. 이 파일과 data.ts 가 D80 의 실물이다).
// 계약 (docs/contract/EPISODE.md · @claro/contract)의 타입을 쓸 수 있는 데는 그대로 썼다: 글 한 덩이 · 문서 · 구절 · 꼬리표 · 도구 · 풀이의 입구 · 기본 풀이 · "문서가 말한 것" 칸.
// 계약에 모자라서 여기서 지은 칸에는 「모자람」이라고 적었다 — logs/frontend/UX-7.md ③ 의 표가 이것을 옮긴 것이다.
import type { Episode, EpisodeText, PlainFlip, RealItem, SolveEntry } from "@claro/contract";

/** 짧은 이야기의 장면 — 넷. 「모자람 1」 계약의 장면은 여덟으로 고정이고 (SceneId) 조립은 cover 로 시작해 keep 으로 끝나며 aha 를 꼭 지난다 (불변식 6). 0화 · 도구 줍기 · 견주기 · 이어짐이 없는 조립을 적을 길이 없다 */
export type ShortSceneId = "cover" | "where" | "why" | "keep";

export interface ShortStory {
  code: string;
  /** 같은 사건 — 계약의 Episode.event_ref 그대로 (긴 이야기와 같은 값) */
  event_ref: Episode["event_ref"];
  /**
   * 「모자람 2」 무게 — 긴 이야기 / 짧은 이야기. 계약에 칸이 없다. 화면 (오늘 · 카드 · 장면 수)과 비용이 이것으로 갈린다
   */
  weight: "short";
  /**
   * 「모자람 3」 주제 (선반) — 계약의 Series 를 가리키지만 **번호가 없다**. 계약은 Episode.series + number (≥ 1) + track (now 가 하나 · 번호가 표지와 같다 — 불변식 2 · 7)이 전부 필수다.
   * 이 이야기는 "2화"가 아니다 — 같은 날 같은 발표의 곁 이야기다. 번호 없이 주제에 놓는 길이 계약에 없다
   */
  shelf: Pick<Episode["series"], "series_id" | "code" | "name">;
  /**
   * 「모자람 4」 같은 사건의 다른 이야기 — event_ref 가 같다는 것만으로는 "긴 이야기의 곁 이야기"라는 사이를 적지 못한다 (previous 는 "지난 회차"다 — 뜻이 다르다).
   * code 는 계약의 Episode.code
   */
  sibling: { code: string; label: string; note: string };
  docs: Episode["docs"];
  quotes: Episode["quotes"];
  voice_labels: Episode["voice_labels"];
  /**
   * 「모자람 5」 다시 만나는 도구 — 다른 회차 (sibling)의 도구를 **가리키기만** 한다 (그 회차의 Tool 카드를 글자 그대로 쓴다 · 새로 쓰지 않는다).
   * 계약의 Tool 은 "이 회차의 카드"라서 회차마다 통째로 들고 있어야 하고 (§6.1), 도구마다 지도의 자리 · 줍는 장면이 있어야 한다 (불변식 5).
   * 짧은 이야기는 자기 지도가 없다 — 주제의 지도 (sibling 의 map)에 붙는다
   */
  tools_from: { episode: string; keys: string[] };
  /** 풀이의 입구 — 계약 SolveEntry 그대로 (첫 생각 · 깨는 사실 · 뒤집기 · 그리지 않을 것 · 누구의 말 · 사망) */
  entry: SolveEntry;
  /**
   * 기본 풀이 "뒤집기만" — 계약 PlainFlip 그대로. 「모자람 6」 why (체험이 없는 까닭)는 정치 · 사망 · 자료 없음 · 뒤집기 없음 넷뿐인데 (NoLabWhy · 불변식 12),
   * 이 이야기에 체험이 없는 까닭은 그 넷이 아니라 **무게** (짧은 이야기)다. 그래서 null 로 두었고, 계약 검사는 PLAIN_WHY 하나로 이것을 거부한다 (check.ts 가 그 하나만 나오는지 본다)
   */
  plain: PlainFlip;
  scenes: {
    cover: { weight_label: string; title: string; dek: EpisodeText; meta: EpisodeText; hint: EpisodeText; ask: string };
    where: { kicker: string; body: EpisodeText[]; unknown: EpisodeText; ask: string };
    why: { kicker: string; title: string; lead: EpisodeText; real_label: string; real: RealItem[]; verdict: EpisodeText; tool_lead: string; ask: string };
    keep: { kicker: string; title: string; line: string; advice_label: string; advice: EpisodeText; map_note: string; gain_label: string };
  };
}
