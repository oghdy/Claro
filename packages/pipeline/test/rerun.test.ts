// W-1 — 다시 돌리기 준비: p1 --check 가 못 가져온 문서를 다시 요청하지 않는다 · 한 문장 검사 (P5-e) · P-5 판 /2 · 체크포인트 · rerun 의 멈춤
import { describe, expect, it } from "vitest";
import { decide } from "../src/p1.ts";
import { readCheckpoints, sentenceCount } from "../src/p5.ts";
import { COUNTER_SYSTEM, COUNTER_VERSION, DERIVE_SYSTEM, DERIVE_VERSION, P5_COMPAT, counterSchema, counterUser, versionNo, type Ctx } from "../src/p5-prompt.ts";
import { Stop, parseArgs, step } from "../src/rerun.ts";

describe("p1 — 못 가져옴으로 기록된 문서는 다시 두드리지 않는다 (D41 · P-2 와 같은 규칙)", () => {
  const nf = { status: "NOT_FETCHED" as const }, st = { status: "STORED" as const };
  it("--check 는 못 가져온 문서를 요청하지 않는다 (예전에는 했다)", () => {
    expect(decide(nf, false, { check: true, retry: false })).toBe("recorded");
    expect(decide(nf, false, { check: true, retry: true })).toBe("recorded");
  });
  it("다시 시도는 --retry 로만", () => {
    expect(decide(nf, false, { check: false, retry: false })).toBe("recorded");
    expect(decide(nf, false, { check: false, retry: true })).toBe("fetch");
  });
  it("저장된 글은 그대로 · --check 는 저장된 문서만 새로 받아 견준다 · 기록 없는 문서는 가져온다", () => {
    expect(decide(st, true, { check: false, retry: false })).toBe("keep");
    expect(decide(st, true, { check: true, retry: false })).toBe("fetch");
    expect(decide(undefined, false, { check: false, retry: false })).toBe("fetch");
  });
});

describe("한 문장 검사 (P5-e) — sentenceCount", () => {
  it("마침표 하나 = 한 문장 · 소수점 · 머리글자 · 따옴표는 끝이 아니다", () => {
    expect(sentenceCount("9월 CPI 는 1년 전보다 3.7% 올랐다.")).toBe(1);
    expect(sentenceCount("Lisa D. Cook 이사는 U.S. 경제가 강하다고 말했다.")).toBe(1);
    expect(sentenceCount("의장은 '정보가 더 필요하다.' 고 했다")).toBe(1);
    expect(sentenceCount("마침표가 없는 한 문장")).toBe(1);
    expect(sentenceCount("")).toBe(0);
  });
  it("10월 P-5 의 좁힌 문장 꼴 — 둘 · 셋", () => {
    expect(sentenceCount("이번 동결은 물가가 나아졌다는 뜻이 아니다. 성명문과 의장은 물가가 여전히 높다고 했다.")).toBe(2);
    expect(sentenceCount("의장은 ~라고 전했다. 다만 이 둘을 이은 말은 없다(F003). 두 위원은 올리기를 원했다.")).toBe(3);
    expect(sentenceCount("물가가 높다고 했다.) 다만 고용은 같았다.")).toBe(2);
  });
});

describe("P-5 판 /2 — 부르지 않고 판만 올렸다 (회의록 다시 돌리기에서 부른다)", () => {
  it("판 · 앞 판", () => {
    expect([DERIVE_VERSION, COUNTER_VERSION]).toEqual(["p5-derive/2", "p5-counter/2"]);
    expect(Object.keys(P5_COMPAT).sort()).toEqual(["p5-counter/1", "p5-derive/1"]);
    expect(versionNo(COUNTER_VERSION)).toBe(2);
  });
  it("프롬프트 — 한 문장 · 주장은 남기고 범위를 단다 · [뒤 · 회의 기록] · 반대자 줄이 그때의 상태를 말하지 않는다", () => {
    for (const p of [DERIVE_SYSTEM, COUNTER_SYSTEM]) {
      expect(p).toContain("한 문장");
      expect(p).toContain("[뒤 · 회의 기록]");
      expect(p).toContain("반대 이유를 지어내지 않는다");
      expect(p).not.toContain("10월 회의록은 아직");
    }
    expect(COUNTER_SYSTEM).toContain("주장은 남기고 범위를 단다");
    expect(COUNTER_SYSTEM).toContain("체크포인트");
  });
  it("체크포인트 — 반증 부르기에 같이 간다 · 출력 모양에 자리가 있다", () => {
    const c = { code: "X", what: "w", date: "2026-10-28", prev_meeting: "2026-09-16", docs: "", slots: "", unslotted: "", storyline: "", facts: "", exemplars: "" } satisfies Ctx;
    const claims = [{ key: "a", statement: "s.", kind: "ASSERTED", basis: ["F001"] }];
    expect(counterUser(c, claims)).not.toContain("확인할 물음");
    const u = counterUser(c, claims, [{ id: "W3-c", question: "9월 CPI 가 회의 전에 나왔나", why: "셧다운" }]);
    expect(u).toContain("## 확인할 물음");
    expect(u).toContain("W3-c 9월 CPI 가 회의 전에 나왔나");
    expect(counterSchema(["S01.a"]).required).toContain("checkpoints");
  });
  it("10월 사건의 체크포인트 W3-c 가 OPEN 으로 있다 (D48)", () => {
    const k = readCheckpoints("FOMC-20261028");
    expect(k.map((x) => [x.id, x.status])).toEqual([["W3-c", "OPEN"]]);
  });
});

describe("rerun — 인자 · 단계 검사가 실패하면 멈춘다", () => {
  it("인자", () => {
    expect(() => parseArgs(["FOMC-20261028"])).toThrow(/--doc/);
    expect(() => parseArgs(["FOMC-20260916", "--doc", "X"])).toThrow(/소스 팩/);
    expect(() => parseArgs(["FOMC-20261028", "--doc", "X", "--counter", "unresolved"])).toThrow(/--keep-derive/);
    const o = parseArgs(["FOMC-20261028", "--doc", "MIN-10"]);
    expect([o.code, o.doc, o.go, o.keepDerive, o.counter, o.like]).toEqual(["FOMC-20261028", "MIN-10", false, false, "all", "MIN-09"]);
  });
  it("검사가 실패하면 Stop — 다음 명령으로 넘기지 않는다 · 마른 실행은 돌리지 않는다", () => {
    expect(() => step({ go: true }, ["node", "-e", "process.exit(3)"])).toThrow(Stop);
    expect(() => step({ go: true }, ["node", "-e", "process.exit(0)"])).not.toThrow();
    expect(() => step({ go: false }, ["node", "-e", "process.exit(3)"])).not.toThrow();
  });
});
