// UX-7 — "오늘" 시안 화면의 글 (화면의 것 — 이야기의 글이 아니다). 사실을 말하지 않는다. 숫자는 화면이 센 것뿐이다 (편 수). 읽는 시간은 내지 않는다 (D82 · UX-7b).
export const TODAY_COPY = {
  mark: "Claro",
  draft: "시안",
  title: "오늘의 이야기",
  /** 편 수는 화면이 센다 — {n} 전체 · {long} 긴 이야기 · {short} 짧은 이야기 */
  count: "오늘은 {n} 편이에요. 긴 이야기 {long}, 짧은 이야기 {short}.",
  draftNote: "시안이에요. 긴 이야기 셋은 지금 실제 주소에 있는 것 그대로고, 날짜는 저마다의 발표일이에요.",
  long: "긴 이야기",
  short: "짧은 이야기",
  lab: "체험 있음",
  noLab: "체험 없음",
  topic: "주제",
  go: "이 이야기 읽기",
  recap: "지난 이야기 30초",
  sibling: "같은 발표의 병원 쪽",
  emptyTitle: "견본 자리 — 글 없음",
  emptyNote: "다섯째 이야기가 들어올 자리예요. 여기 놓을 뉴스 제목을 지어내지 않았어요.",
  contLabel: "이어지는 이야기",
  contNote: "둘째 이야기가 실제로 생긴 주제에만 번호와 줄이 생겨요.",
  contNext: "다음 이야기 · 날짜가 잡혀 있어요",
  contGo: "읽기",
  shelfLabel: "아직 한 편인 주제",
  shelfNote: "번호가 없어요. 뉴스가 이어지면 그때 붙어요.",
  shelfOne: "긴 이야기 하나",
  shelfOneAndShort: "긴 이야기 하나 · 짧은 이야기 하나",
  conceptLabel: "개념으로 이어져요",
  conceptNote: "번호가 없어도, 같은 개념을 만나는 이야기끼리는 이어져요.",
  conceptBoth: "두 이야기에서 함께 만나는 개념",
  mapGo: "개념 지도 보기",
  foot: "실제 첫 화면은 바꾸지 않았어요.",
  footLink: "지금의 첫 화면과 견주기",
  mapTitle: "오늘 다 읽으면,\n지도는 이렇게 돼요",
  mapNote: "견본이에요. 읽은 기록은 아직 저장하지 않아요. 지도는 주제마다 한 장이고, 짧은 이야기에서 만난 개념은 같은 주제의 지도에 붙어요.",
  mapBack: "오늘로",
  metaTitle: "Claro 시안 — 오늘의 이야기",
} as const;

/** 편 수를 말로 — 화면이 센 수 (하루 다섯 편까지) */
export const COUNT_WORD = ["영", "한", "두", "세", "네", "다섯"] as const;
export const COUNT_NOUN = ["없음", "하나", "둘", "셋", "넷", "다섯"] as const;
