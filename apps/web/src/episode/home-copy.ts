// 첫 화면 (/ — "오늘" · F-E2)과 개념 지도 (/map)의 글 — 화면의 것이다 (이야기의 글이 아니다). 이야기 · 시리즈의 글 (제목 · 한 줄 · 날 · 지난 이야기 · 시리즈 줄)은 골든에서 그대로 읽는다.
// 숫자가 없다 (lab/episode/check.ts S4 가 본다 — "지난 이야기 30초" 하나만 예외: UX-7 에서 도윤이 본 그 말 · D79 ③) — 사실을 말하지 않는다. 편 수 · 날짜는 화면이 목록에서 세어 넣는다 ({n} · {m} · {d}).
// 과장하지 않는다: 읽은 기록을 아직 저장하지 않는다 (D64 ~ D67 OPEN) → preview · mapNote 가 그렇게 말한다. 날마다 낸다고 약속하지 않는다 (FINDINGS §10.6) → countRecent.
export const HOME = {
  mark: "Claro",
  previewTag: "미리보기",
  tagline: "뉴스 하나가 이야기 한 편이 돼요",
  /** 머리 — 읽는 그날 (한국 날짜)에 낸 이야기가 있을 때만 "오늘의 이야기". 가장 새 묶음이 다른 날이면 그 날짜를 그대로 적는다. 낸 날이 적힌 이야기가 없으면 "최근 이야기" (까닭은 logs/frontend/F-E2.md ②) */
  titleToday: "오늘의 이야기",
  titleDay: "{m}월 {d}일의 이야기",
  titleRecent: "최근 이야기",
  /** 편 수는 화면이 센다 — {n} 전체 · {long} 긴 이야기 · {short} 짧은 이야기 */
  count: "{n} 편이에요.",
  countRecent: "아직 날마다 내지는 않아요. 지금까지 낸 {n} 편이에요.",
  tally: "긴 이야기 {long}, 짧은 이야기 {short}.",
  restLabel: "지난 이야기",
  long: "긴 이야기",
  short: "짧은 이야기",
  lab: "체험 있음",
  noLab: "체험 없음",
  topic: "주제",
  go: "이 이야기 읽기",
  recap: "지난 이야기 30초",
  contLabel: "이어지는 이야기",
  contNote: "뉴스가 이어져서 둘째 이야기가 생긴 주제예요.",
  contNext: "다음 이야기 · 날짜가 잡혀 있어요",
  contGo: "읽기",
  conceptLabel: "개념으로 이어져요",
  conceptNote: "같은 개념을 만나는 이야기끼리는 서로 이어져요.",
  conceptBoth: "두 이야기에서 함께 만나는 개념",
  mapGo: "개념 지도 보기",
  aboutLabel: "Claro는",
  about: "뉴스를 줄여 주는 곳이 아니에요. 물음 하나를 따라 들어가서, 직접 눌러 보고, 그 뉴스를 읽는 데 필요한 개념을 주워서 나와요.",
  preview: "지금은 미리보기예요. 읽은 기록은 아직 저장하지 않아서, 화면을 닫으면 지도가 처음으로 돌아가요.",
  mapTitle: "이야기를 다 읽으면,\n지도는 이렇게 돼요",
  mapNote: "읽은 기록은 아직 저장하지 않아요. 그래서 내 지도가 아니라, 다 읽었을 때의 지도예요. 지도는 주제마다 한 장이고, 짧은 이야기에서 만난 개념은 같은 주제의 지도에 붙어요.",
  mapBack: "첫 화면으로",
  mapMetaTitle: "개념 지도 · Claro",
  metaTitle: "Claro — 뉴스 하나가 이야기 한 편이 돼요",
  metaDescription: "뉴스를 줄여 주는 곳이 아니에요. 물음을 따라 들어가서, 직접 눌러 보고, 개념을 주워서 나와요.",
} as const;

/** 편 수를 말로 — 화면이 센 수. 다섯을 넘으면 숫자 그대로 */
const COUNT_WORD = ["영", "한", "두", "세", "네", "다섯"] as const;
const COUNT_NOUN = ["없음", "하나", "둘", "셋", "넷", "다섯"] as const;
export const countWord = (n: number): string => COUNT_WORD[n] ?? String(n);
export const countNoun = (n: number): string => COUNT_NOUN[n] ?? `${n} 편`;
