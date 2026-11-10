// W-6 — 부르는 길(배치 · 즉시) · Step 이름과 상한을 부르는 쪽이 넘긴다 (W1-a) · 배치 값. 네트워크 0 — 상한에 걸려 아무것도 보내지 않는 경우만 부른다
import { describe, expect, it } from "vitest";
import { BATCH_FACTOR, budgetArg, callMany, costOf, modeArg, needBudget, passArgs, requestParams, requestSha, type CallReq } from "../src/llm.ts";
import { parseArgs } from "../src/rerun.ts";

const u = { input_tokens: 1000, output_tokens: 2000, cache_creation_input_tokens: 100, cache_read_input_tokens: 5000 };
const req = (n: number): CallReq => ({ event: "TEST", source_label: `t${n}`, model: "claude-opus-5-5", effort: "medium", system: "s", user: `u${n}`, schema: { type: "object" }, prompt_version: "test/1", text_sha256: "x", max_tokens: 100, est_usd: 1 });

describe("llm — Step · 상한 · 길", () => {
  it("--step 과 --budget 은 함께 · 멈춤은 상한의 95%", () => {
    expect(budgetArg(["--step", "W-5", "--budget", "3"])).toEqual({ step: "W-5", budget: 3, stopAt: 2.85 });
    expect(budgetArg(["p3", "FOMC"])).toBeNull();
    expect(() => budgetArg(["--step", "W-5"])).toThrow(/함께/);
    expect(() => budgetArg(["--budget", "3"])).toThrow(/함께/);
    expect(() => budgetArg(["--step", "W-5", "--budget", "0"])).toThrow(/0 보다 큰/);
    expect(() => needBudget([])).toThrow(/--step/);
  });
  it("기본은 배치 · --now 는 즉시 · 자식 명령에 넘기는 인자", () => {
    expect(modeArg([])).toBe("batch");
    expect(modeArg(["--now"])).toBe("now");
    expect(passArgs({ step: "W-5", budget: 3, stopAt: 2.85 }, "batch")).toEqual(["--step", "W-5", "--budget", "3"]);
    expect(passArgs(null, "now")).toEqual(["--now"]);
  });
  it("배치 값은 반 — 캐시 값과 겹쳐", () => {
    const now = costOf("claude-opus-5-5", u);
    expect(now).toBeCloseTo((1000 * 4 + 2000 * 20 + 100 * 5 + 5000 * 0.2) / 1e6, 10);
    expect(costOf("claude-opus-5-5", u, "batch")).toBeCloseTo(now * BATCH_FACTOR, 10);
  });
  it("요청 본문은 길과 상관없다 — 배치 · 즉시가 같은 request_sha256 (저장한 출력이 다시 부르기를 부르지 않는다)", () => {
    const p = requestParams(req(1));
    expect(Object.keys(p).sort()).toEqual(["max_tokens", "messages", "model", "output_config", "system"]);
    expect(JSON.stringify(p)).not.toMatch(/stream/);
    const other: CallReq = { ...req(1), est_usd: 99, source_label: "다른 이름" };
    expect(requestSha(req(1))).toBe(requestSha(other));
  });
  it("상한에 걸리면 보내지 않는다 (배치 — 보내기 전에 누계로 · 즉시 — 하나씩)", async () => {
    const budget = { step: "TEST-W6-없는-Step", budget: 0.4, stopAt: 0.38 };
    // 배치: 추정 1 × 0.5 = 0.5 > 0.38 → 셋 다 보내지 않는다 (네트워크 0)
    const rb = await callMany([req(1), req(2), req(3)], { mode: "batch", budget });
    expect(rb.map((r) => [r.skipped, r.ok, r.mode])).toEqual([[true, false, "batch"], [true, false, "batch"], [true, false, "batch"]]);
    expect(rb[0]!.error).toMatch(/상한/);
    expect(rb[0]!.request_sha256).toBe(requestSha(req(1)));
    const rn = await callMany([req(1), req(2)], { mode: "now", budget });
    expect(rn.every((r) => r.skipped && r.mode === "now")).toBe(true);
  });
});

describe("rerun — 길 · Step · 상한 인자 (W-6 · W1-a)", () => {
  it("기본은 배치 · --now · --step --budget 은 code 로 읽히지 않는다", () => {
    const o = parseArgs(["--step", "W-5", "--budget", "3", "FOMC-20261028", "--doc", "MIN-10", "--now"]);
    expect([o.code, o.doc, o.mode, o.budget]).toEqual(["FOMC-20261028", "MIN-10", "now", { step: "W-5", budget: 3, stopAt: 2.85 }]);
    const d = parseArgs(["FOMC-20261028", "--doc", "MIN-10"]);
    expect([d.mode, d.budget]).toEqual(["batch", null]);
  });
});
