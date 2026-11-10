import { describe, expect, it } from "vitest";
import { D5_WORDS, verdict } from "../src/p5.ts";
import { COUNTER_SYSTEM, DERIVE_SYSTEM } from "../src/p5-prompt.ts";

describe("P-5 — 판정은 checks 에서 계산한다 (DATA_MODEL §7.3)", () => {
  it("계약 표 그대로", () => {
    expect(verdict("ASSERTED", [])).toBe("검사 안 됨");
    expect(verdict("ASSERTED", ["NOT_REFUTED", "NOT_REFUTED"])).toBe("VALID");
    expect(verdict("ASSERTED", ["NOT_REFUTED", "SCOPED"])).toBe("VALID WITH SCOPE");
    expect(verdict("ASSERTED", ["NOT_REFUTED", "UNRESOLVED"])).toBe("검사 안 됨");
    expect(verdict("DEFENSIVE", ["UNRESOLVED"])).toBe("방어용");
  });
  it("DEFENSIVE 이고 UNRESOLVED 가 있고 나머지가 NOT_REFUTED · SCOPED 뿐 → 방어용 (§7.3 의 새 줄 · D50 P5-c)", () => {
    expect(verdict("DEFENSIVE", ["UNRESOLVED", "NOT_REFUTED"])).toBe("방어용");
    expect(verdict("DEFENSIVE", ["UNRESOLVED", "SCOPED", "NOT_REFUTED", "NOT_REFUTED", "NOT_REFUTED"])).toBe("방어용"); // 실물 DC-08
    expect(verdict("DEFENSIVE", ["SCOPED", "SCOPED", "NOT_REFUTED", "UNRESOLVED", "NOT_REFUTED", "SCOPED"])).toBe("방어용"); // 실물 DC-14
    expect(verdict("ASSERTED", ["UNRESOLVED", "SCOPED"])).toBe("검사 안 됨"); // ASSERTED 는 그대로
    expect(verdict("DEFENSIVE", ["NOT_REFUTED", "SCOPED"])).toBe("VALID WITH SCOPE"); // UNRESOLVED 가 없으면 보통 줄
  });
  it("계약 표에 없는 경우는 그렇다고 말한다 (REFUTED)", () => {
    expect(verdict("ASSERTED", ["REFUTED"])).toContain("계약 밖");
  });
});

describe("P-5 프롬프트 — D44 정치 임시 규칙 · 반대 이유를 지어내지 않는다", () => {
  it("두 프롬프트 모두 규칙을 담는다", () => {
    for (const p of [DERIVE_SYSTEM, COUNTER_SYSTEM]) {
      expect(p).toContain("동기 · 의도 · 압력에 대한 해석을 만들지 않는다");
      expect(p).toContain("반대 이유를 지어내지 않는다");
      expect(p).toContain("새 수");
    }
    expect(COUNTER_SYSTEM).toContain("좁혀서 참이 되는 문장");
    expect(D5_WORDS).toContain("청문");
  });
});
