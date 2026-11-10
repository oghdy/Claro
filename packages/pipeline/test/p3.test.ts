import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPoint, seriesBlocks } from "../src/bls.ts";
import { cpSlice, spanMatches } from "../src/match.ts";
import { build, numbersNotInPassages, uuidFrom } from "../src/p3.ts";
import { FACT_TYPES, OUTPUT_SCHEMA, PROMPT_VERSION, SYSTEM_PROMPT } from "../src/p3-prompt.ts";

describe("P-3 짓기 — 저장한 모델 출력에서 결정적으로", () => {
  it("이름에서 나오는 UUID — 같은 이름이면 같다 · v5 모양", () => {
    expect(uuidFrom("a")).toBe(uuidFrom("a"));
    expect(uuidFrom("a")).not.toBe(uuidFrom("b"));
    expect(uuidFrom("a")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("두 번 지으면 글자 단위로 같다 (10월 · 9월)", () => {
    // 10월은 권리 미확인 원문 · 모델 출력이 git 밖 캐시에 있어야 지을 수 있다 — 캐시가 없는 기계에서는 9월만
    const oct = existsSync(new URL("../.cache/p3/FOMC-20261028/raw", import.meta.url));
    for (const code of oct ? ["FOMC-20261028", "FOMC-20260916"] : ["FOMC-20260916"]) {
      const a = JSON.stringify(build(code, "claude-sonnet-5-5", code === "FOMC-20261028").graph);
      const b = JSON.stringify(build(code, "claude-sonnet-5-5", code === "FOMC-20261028").graph);
      expect(a).toBe(b);
    }
  });
  it("그래프의 사실은 모두 구절이 원문에서 확인된 것 — 모델 사실의 FactSource 마다 span 의 글 = 구절", () => {
    const { graph } = build("FOMC-20260916", "claude-sonnet-5-5", false);
    const docs = new Map(JSON.parse(readFileSync(new URL("../../../fixtures/store.documents.json", import.meta.url), "utf8")).source_documents.map((d: { source_id: string; text: string }) => [d.source_id, d.text]));
    for (const r of graph.fact_sources as { source_id: string; span_start: number; span_end: number; _passage: string }[]) {
      expect(spanMatches(docs.get(r.source_id) as string, r.span_start, r.span_end, r._passage)).toBe(true);
    }
  });
  it("수 대조 — 구절에 없는 수만 돌려준다 · 날짜 · 셈 단위는 뺀다", () => {
    expect(numbersNotInPassages("2026년 9월 실업률 4.1%", ["The unemployment rate was 4.1 percent"])).toEqual([]);
    expect(numbersNotInPassages("10년 4.94", ["| 4.94 | 5.01 |"])).toEqual([]); // 칸이 틀려도 수는 구절에 있다 — 이 검사로는 못 잡는다 (P-3 로그)
    expect(numbersNotInPassages("12개월 3.5%", ["rose 3.4 percent"])).toEqual(["3.5"]);
  });
});

describe("P-3 프롬프트 · 스키마", () => {
  it("fact_type 은 계약의 7값 그대로 · 스키마도 같은 값", () => {
    expect([...FACT_TYPES]).toEqual(["OFFICIAL_ACTION", "OFFICIAL_CLAIM", "OFFICIAL_LIMIT", "MEASUREMENT", "COURT_RULING", "COMPANY_DISCLOSURE", "INDEPENDENT_OBSERVATION"]);
    expect(OUTPUT_SCHEMA.properties.facts.items.properties.fact_type.enum).toEqual([...FACT_TYPES]);
  });
  it("프롬프트 판이 있고, 9월 골든의 사실 글을 본보기로 담지 않는다", () => {
    expect(PROMPT_VERSION).toMatch(/^p3-extract\/\d+$/);
    const store = JSON.parse(readFileSync(new URL("../../../fixtures/store.json", import.meta.url), "utf8"));
    for (const f of store.facts as { claim_text: string }[]) expect(SYSTEM_PROMPT.includes(f.claim_text)).toBe(false);
  });
});

describe("BLS 응답 — 시리즈 블록 · 값 조각", () => {
  const text = `{"status":"REQUEST_SUCCEEDED","Results":{"series":[{"seriesID":"A","data":[{"year":"2026","period":"M09","periodName":"September","value":"4.2","footnotes":[{}]}]},{"seriesID":"B","data":[{"year":"2026","period":"M09","periodName":"September","latest":"true","value":"4.2","footnotes":[{"code":"P","text":"preliminary"}]}]}]}}`;
  it("같은 조각이 두 시리즈에 있어도 블록 안에서 한 곳", () => {
    const bl = seriesBlocks(text);
    expect([...bl.keys()]).toEqual(["A", "B"]);
    const a = findPoint(text, bl.get("A")!, "2026", "M09")!;
    const b = findPoint(text, bl.get("B")!, "2026", "M09")!;
    expect(a.start).not.toBe(b.start);
    expect(cpSlice(text, b.start, b.end)).toBe(b.passage);
    expect(b.footnotes).toEqual(["preliminary"]);
    expect(b.latest).toBe(true);
    expect(findPoint(text, bl.get("A")!, "2026", "M10")).toBeNull();
  });
});
