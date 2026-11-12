// 모든 회차가 같이 쓰는 화면 글 (공통). 회차의 글은 골든 픽스처 (fixtures/episode-*.json — 회차 계약)에 있다.
// UX-1 의 COPY.tools · keep · map · chrome 에서 회차와 상관없는 줄을 그대로 옮겼다 — 글자는 바꾸지 않았다
// (whereElse 의 "(시안의 예시)" 만 뺐다: 다른 시리즈의 개념이 이제 진짜 회차의 것이다).
export const CHROME = {
  tools: {
    askPrompt: "이거 알아요?",
    yes: "알아요",
    no: "처음 들어요",
    foldedKnown: "이미 아는 도구",
    foldedSeed: "알던 도구",
    fresh: "새 도구",
    open: "펼치기",
    close: "접기",
  },
  keep: {
    lineLabel: "오늘의 한 줄",
    newLabel: "오늘 새로 주운 개념",
    seedLabel: "원래 알던 개념",
    againLabel: "오늘 다시 만난 개념",
    promise: "다음에 이 개념들이 나오면 접어 둘게요. 새로 필요한 것만 꺼낼게요.",
    mapButton: "내 개념 지도 보기",
    nextTitle: "다음 화",
    restart: "처음부터 다시",
    otherLabel: "다른 시리즈",
  },
  map: {
    title: "내 개념 지도",
    close: "닫기",
    emptyNew: "아직 비어 있어요. 회차를 읽으면 여기에 개념이 붙어요.",
    legendNew: "오늘 주움",
    legendKnown: "알던 것",
    legendGhost: "다음 화에서",
    elsewhereLabel: "다른 시리즈",
    tapHint: "개념을 누르면 설명이 나와요.",
    whereSeed: "원래 알던 것",
    whereBefore: "전에 주운 것",
    whereElse: "다른 시리즈에서 주움",
    whereGhost: "아직 줍지 않았어요. 다음 화에서 만나요.",
    edgeNote: "선은 이 이야기에서 개념이 이어진 길이에요.",
    shelfLabel: "시리즈",
    shelfHere: "지금 읽는 중",
    shelfGo: "이 회차 열기",
  },
  chrome: {
    draft: "시안",
    readersAria: "시안 조종",
    src: "근거",
    back: "앞 장으로",
    mapAria: "내 개념 지도",
    srcTitle: "이 문장의 근거",
    srcNone: "따로 붙은 구절이 없는 문장이에요.",
    seriesTag: "시리즈",
    switchSuffix: "회차",
  },
  // ── UX-4: 풀이 시안의 스위치 둘 (제품의 일부가 아니다 — 풀이 장면에서만 보인다)
  lab: {
    rowAria: "풀이 시안 조종",
    rowTag: "풀이",
    plain: "체험 없이 보기",
    seen: "이 그림을 본 독자",
    back: "회차 시안으로",
  },
  // 이 그림을 본 독자 (D61 ② 다시 쓰기) — 설명 없이 그림과 오늘의 값만
  seen: {
    label: "전에 해 본 그림이에요. 오늘의 값만 볼게요.",
    redo: "처음부터 다시 해 보기",
    sideHint: "쪽을 누르면 그쪽이 한 말이 나와요.",
    // 넘겨 보기 (UX-5) — 본 차례는 넘기지 않고 펼쳐 놓는다
    pagesLabel: "전에 넘겨 본 차례예요. 펼쳐 놓았어요.",
    cardHint: "칸을 누르면 그 칸의 글이 나와요.",
  },
  // 넘겨 보기 틀 (UX-5) — 틀의 공통 글. 칸의 글 · 물음 · 단추의 말은 회차 데이터에 있다
  pages: {
    now: "오늘의 사건",
    countOf: "칸 가운데",
    countUnit: "칸을 넘겼어요",
  },
  // 기본 풀이 (D61 ①) — 꼴마다의 칸 이름
  plain: {
    thought: "이렇게 생각하기 쉬워요",
    breaker: "그런데 문서에는",
    known: "확인된 것",
    unknown: "아직 모르는 것",
    differ: "서로 다르게 말하는 것",
    differNone: "서로 다르게 말한 공식 입장은 아직 확인하지 못했어요.",
    open: "다음 칸 열기",
    quietWhat: "무슨 일이 있었나",
    quietKnown: "지금 아는 것",
    quietComing: "다음에 나올 것",
  },
} as const;
