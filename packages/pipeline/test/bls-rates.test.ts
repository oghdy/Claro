import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MEASURES, RATE_EVENTS, back, build, levelChange, monthOf, pctChange, roundDiv, ymOf } from "../src/bls-rates.ts";

describe("W-3 BLS 변화율 — BLS 발표 방식 그대로 · 저장한 응답에서 결정적으로", () => {
  it("반올림은 0.5 에서 0 에서 먼 쪽 · '-0.0' 은 없다", () => {
    expect(roundDiv(5n, 10n)).toBe(1n);
    expect(roundDiv(-5n, 10n)).toBe(-1n);
    expect(roundDiv(4n, 10n)).toBe(0n);
    expect(pctChange("100.050", "100.000")).toBe("0.1");
    expect(pctChange("99.950", "100.000")).toBe("-0.1");
    expect(pctChange("336.065", "336.121")).toBe("0.0"); // 6월 근원 전월 대비 −0.0167 — 골든 F46 "0.0%"
    expect(pctChange("336.940", "324.800", 4)).toBe("3.7377");
  });
  it("증감 = 수준의 차 · 달 계산은 해를 넘는다", () => {
    expect(levelChange("159128", "159068")).toBe("60");
    expect(levelChange("158882", "158892")).toBe("-10");
    expect(ymOf(back(monthOf("2026-01"), 1))).toBe("2025-12");
    expect(ymOf(back(monthOf("2026-09"), 12))).toBe("2025-09");
    expect(ymOf(back(monthOf("2025-12"), -1))).toBe("2026-01");
  });
  it("1년 전 대비는 계절조정 안 한 지수 · 전월 대비 · 증감은 계절조정 (BLS 보도자료의 방식)", () => {
    for (const m of MEASURES) expect(m.lag === 12).toBe(/^(CUUR|WPU)/.test(m.series));
  });
  it("두 번 계산하면 글자 단위로 같고, 저장한 파일과 같다 (10월 · 9월)", () => {
    for (const code of Object.keys(RATE_EVENTS)) {
      const a = JSON.stringify(build(code), null, 2) + "\n";
      expect(JSON.stringify(build(code), null, 2) + "\n").toBe(a);
      expect(readFileSync(new URL(`../../../${RATE_EVENTS[code]!.out}`, import.meta.url), "utf8")).toBe(a);
    }
  });
  it("9월 골든 대조 — CPI 는 첫 발표 값과 모두 같다 · 다른 것은 PPI · 취업자뿐 (받은 날 판이 고쳐진 시리즈)", () => {
    const rows = build("FOMC-20260916").compare.rows;
    const cpi = rows.filter((r) => r.kind === "rate" && r.measure.startsWith("CPI_"));
    expect(cpi.length).toBe(23);
    expect(cpi.every((r) => r.match === true)).toBe(true);
    expect(rows.every((r) => r.anchored)).toBe(true);
    const differ = rows.filter((r) => r.match === false).map((r) => (r.kind === "rate" ? r.measure : r.kind === "avg" || r.kind === "level" ? r.series : ""));
    expect(new Set(differ)).toEqual(new Set(["PPI_FD_1M", "PPI_FD_12M", "PAYROLL_1M", "CES0000000001"]));
  });
  it("10월 — 회의 직전 9월 값 (2026-11-10 판)", () => {
    const r = Object.fromEntries(build("FOMC-20261028").rates.filter((x) => x.month === "2026-09").map((x) => [x.measure, x.value]));
    expect(r).toEqual({ CPI_ALL_1M: "0.6", CPI_ALL_12M: "3.7", CPI_CORE_1M: "0.3", CPI_CORE_12M: "2.6", CPI_ENERGY_1M: "5.2", PPI_FD_1M: "1.3", PPI_FD_12M: "6.3", PAYROLL_1M: "60", TEMP_LAYOFF_1M: "6" });
  });
});
