// 받은 줄을 계약의 칸 목록과 댄다 (fieldProblems) — API 가 원장에 넣기 전에 쓰는 검사 (B-0.4b)
import { describe, expect, it } from "vitest";
import { OBSERVATION_TYPES, fieldProblems } from "../src";

const event = {
  event_id: "0d0e0000-0000-4000-8000-000000000001", user_id: "0d0e0000-0000-4000-8000-000000000002",
  session_id: "0d0e0000-0000-4000-8000-000000000003", reading_id: "0d0e0000-0000-4000-8000-000000000004",
  plan_id: "0d0e0000-0000-4000-8000-000000000005", seq: 0, occurred_at: "2026-10-13T05:12:33.120Z", type: "SLIDE_ENTERED",
  slide_index: 0, from_plan_id: null,
};
const problems = (row: unknown) => fieldProblems(OBSERVATION_TYPES.ReadingEvent, row);

describe("fieldProblems — 계약의 칸을 전부, 그것만. 값은 타입 식에 맞게", () => {
  it("맞는 줄은 통과한다", () => {
    expect(problems(event)).toEqual([]);
    expect(problems({ ...event, occurred_at: "2026-10-13T05:12:33Z", type: "LEVEL_SWITCHED", slide_index: null, from_plan_id: event.plan_id })).toEqual([]);
  });
  it("계약에 없는 칸 · 빠진 칸", () => {
    expect(problems({ ...event, dwell_ms: 900 })).toEqual(['계약에 없는 칸 "dwell_ms"']);
    const { from_plan_id: _f, ...missing } = event;
    expect(problems(missing)).toEqual(['칸 "from_plan_id" 이 없다']);
  });
  it.each([
    ["seq", "0"], ["seq", 1.5], ["seq", null], ["event_id", "E-1"], ["user_id", null], ["occurred_at", "2026-10-13 05:12:33"],
    ["occurred_at", "2026-13-45T05:12:33Z"], ["occurred_at", 1791868831739], ["type", "SWIPED_UP"], ["type", null], ["slide_index", "0"],
    ["from_plan_id", "없음"],
  ])("%s = %j 는 그 칸의 타입이 아니다", (key, value) => {
    expect(problems({ ...event, [key]: value })).toHaveLength(1);
  });
  it("객체가 아닌 것", () => {
    for (const v of [null, "글", 3, [event]]) expect(problems(v)).toEqual(["객체가 아니다"]);
  });
  it("칸의 일부만 볼 때 — 나머지 칸이 오면 계약에 없는 칸으로 친다 (plan: 화면이 block_decisions 를 보내면 거부)", () => {
    const only = ["plan_id", "level", "level_chosen_by"] as const;
    const row = { plan_id: event.plan_id, level: "basic", level_chosen_by: "DEFAULT" };
    expect(fieldProblems(OBSERVATION_TYPES.ReadingPlanLog, row, only)).toEqual([]);
    expect(fieldProblems(OBSERVATION_TYPES.ReadingPlanLog, { ...row, block_decisions: [] }, only)).toEqual(['계약에 없는 칸 "block_decisions"']);
    expect(fieldProblems(OBSERVATION_TYPES.ReadingPlanLog, { ...row, level: "expert" }, only)).toHaveLength(1);
    expect(fieldProblems(OBSERVATION_TYPES.ReadingPlanLog, { ...row, level_chosen_by: "SYSTEM" }, only)).toHaveLength(1);
  });
});
