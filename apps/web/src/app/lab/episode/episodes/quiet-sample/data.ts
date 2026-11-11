// UX-4 — 기본 풀이 "다. 조용히"의 견본 데이터. **실제 사건이 아니다.** 사실 · 숫자 · 이름 · 날짜가 하나도 없다 — 칸마다 무엇이 들어가는지만 적었다.
// 실물 사건이 생기면 이 파일은 지운다 (계약은 실물에서 — D24). check.ts 가 숫자가 없는지 본다.
import { t, type PlainSolve, type SolveEntry } from "../../kit/types";

export const QUIET_SAMPLE = {
  banner: "견본 — 실제 사건 아님",
  bannerNote: "기본 풀이 “조용히”의 모양만 보여요. 아래 글은 칸마다 무엇이 들어가는지 적은 자리 표시예요. 사실 · 숫자 · 이름이 없어요.",
  kicker: "풀이",
  entry: {
    first_thought: t("(쓰지 않는 칸 — 조용히 꼴에서는 독자의 생각을 뒤집으려 하지 않아요)"),
    breaker: t("(쓰지 않는 칸)"),
    flip: null,
    not_drawn: ["원인 · 책임 — 공식 조사가 말하기 전에는 쓰지 않는다", "피해를 그림 · 눌러 보기로 만들지 않는다"],
    whose: t("(누구의 말인지 — 여기까지는 어느 기관이 발표한 것인지 한 문장)"),
    // 사람이 숨진 사건 (D61 ④) — 체험이 없어야 하고 꼴은 "조용히"여야 한다
    death: true,
  } satisfies SolveEntry,
  plain: {
    kind: "quiet",
    why: "death",
    title: "지금까지\n확인된 것만 볼게요",
    what: [t("(무슨 일이 있었는지 — 공식 발표에 적힌 대로, 한두 문장)"), t("(언제 · 어디서 — 발표한 곳의 말 그대로)")],
    known: [t("(지금 확인된 것 — 발표한 기관의 이름과 함께)"), t("(아직 확인되지 않은 것은 확인되지 않았다고 그대로)")],
    coming: [t("(다음에 나올 공식 발표 — 조사 결과 · 집계)"), t("(그것이 언제쯤 나오는지 — 문서에 적혀 있을 때만)")],
    ask: "다음에 무엇이 나오는지 볼게요",
  } satisfies PlainSolve,
} as const;
