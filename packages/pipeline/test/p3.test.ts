import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPoint, seriesBlocks } from "../src/bls.ts";
import { cpSlice, spanMatches } from "../src/match.ts";
import { build, loadDocs, uuidFrom } from "../src/p3.ts";
import { FACT_TYPES, OUTPUT_SCHEMA, PROMPT_COMPAT, PROMPT_VERSION, SYSTEM_PROMPT, scopeLine } from "../src/p3-prompt.ts";
import { CHECK_RULES, enQuantifiers, koQuantifiers, numbersMissing, quantifierProblem } from "../src/checks.ts";
import { CAL_FOOT, MASK, calendarBlock, cells, docKind, modelInput, pipeBlocks, readTables } from "../src/tables.ts";
import { DEFAULT_MODEL } from "../src/llm.ts";

describe("P-3 짓기 — 저장한 모델 출력 · 원문에서 결정적으로", () => {
  it("이름에서 나오는 UUID — 같은 이름이면 같다 · v5 모양", () => {
    expect(uuidFrom("a")).toBe(uuidFrom("a"));
    expect(uuidFrom("a")).not.toBe(uuidFrom("b"));
    expect(uuidFrom("a")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("사실 추출 모델은 claude-opus-5-5 (D42)", () => {
    expect(DEFAULT_MODEL).toBe("claude-opus-5-5");
  });
  it("두 번 지으면 글자 단위로 같다 (10월 · 9월)", () => {
    // 10월은 권리 미확인 원문 · 모델 출력이 git 밖 캐시에 있어야 지을 수 있다 — 캐시가 없는 기계에서는 9월만
    const oct = existsSync(new URL("../.cache/p3/FOMC-20261028/raw", import.meta.url));
    for (const code of oct ? ["FOMC-20261028", "FOMC-20260916"] : ["FOMC-20260916"]) {
      const a = JSON.stringify(build(code, DEFAULT_MODEL, code === "FOMC-20261028").graph);
      const b = JSON.stringify(build(code, DEFAULT_MODEL, code === "FOMC-20261028").graph);
      expect(a).toBe(b);
    }
  });
  it("그래프의 사실은 모두 구절이 원문에서 확인된 것 — FactSource 마다 span 의 글 = 구절", () => {
    const { graph } = build("FOMC-20260916", DEFAULT_MODEL, false);
    const docs = new Map(JSON.parse(readFileSync(new URL("../../../fixtures/store.documents.json", import.meta.url), "utf8")).source_documents.map((d: { source_id: string; text: string }) => [d.source_id, d.text]));
    for (const r of graph.fact_sources as { source_id: string; span_start: number; span_end: number; _passage: string }[]) {
      expect(spanMatches(docs.get(r.source_id) as string, r.span_start, r.span_end, r._passage)).toBe(true);
    }
  });
});

describe("표는 코드가 읽는다 (D42 · table-rules.json)", () => {
  const { docs } = loadDocs("FOMC-20261028");
  const doc = (l: string) => docs.find((d) => d.label === l)!;
  it("국채 · EIA · SEP · 목표 금리 이력은 표 문서 · BEA 는 글 + 표 · 성명문은 글", () => {
    expect(["TSY", "EIA-B", "EIA-D", "SEP-09", "OMO"].map((l) => doc(l).kind)).toEqual(["TABLE", "TABLE", "TABLE", "TABLE", "TABLE"]);
    expect(doc("BEA-08").kind).toBe("MIXED");
    expect(doc("ST-10").kind).toBe("TEXT");
    expect(docKind(null)).toBe("TEXT");
  });
  it("표 문서는 모델에 보내지 않는다 · BEA 의 표 줄은 가린다", () => {
    expect(() => modelInput(doc("TSY"))).toThrow();
    const m = modelInput(doc("BEA-08"));
    expect(m).toContain(MASK);
    expect(m).not.toContain("PCE price index | 0.1 | 0.3");
    expect(modelInput(doc("ST-10"))).toBe(doc("ST-10").text);
  });
  it("국채 10년 칸 — 10/28 줄의 10 Yr 는 5.05 (P-3 Sonnet 은 7 Yr 칸 4.95 를 10년으로 읽었다)", () => {
    const t = readTables(doc("TSY"), { date: "2026-10-28", prev_meeting: "2026-09-16" });
    const f = t.facts.find((x) => x.event_at === "2026-10-28")!;
    expect(f.claim_text).toContain("10 Yr 5.05");
    expect(f.claim_text).toContain("7 Yr 4.95");
    const c = f.table.cells.find((x) => x.col === "10 Yr")!;
    expect(cells(f.table.header_line)[c.h]).toBe("10 Yr");
    expect(cells(f.table.row_line)[c.r]).toBe("5.05");
    // 사건 날 뒤 (10/29) 줄은 만들지 않는다 · 직전 회의 앞은 연초 하나만
    expect(t.facts.some((x) => x.event_at! > "2026-10-28")).toBe(false);
    expect(t.facts.filter((x) => x.event_at! < "2026-09-16").map((x) => x.event_at)).toEqual(["2026-01-02"]);
  });
  it("구절은 원문 글자 그대로 (span 의 글 = 구절)", () => {
    for (const l of ["TSY", "EIA-B", "EIA-D", "SEP-09", "OMO", "BEA-GDP-2Q3"]) {
      for (const f of readTables(doc(l), { date: "2026-10-28", prev_meeting: "2026-09-16" }).facts) {
        for (const p of f.passages) expect(cpSlice(doc(l).text, p.span_start, p.span_end)).toBe(p.text);
      }
    }
  });
  it("글 안의 표 덩어리 — 머리 '| …' · 단위 줄 · 줄", () => {
    const b = pipeBlocks("Caption\n| A | B\n| (unit)\nx | 1 | 2\ny | 3 | 4\nprose after");
    expect(b).toEqual([{ caption: [0], header: 1, notes: [2], rows: [3, 4], last: 4 }]);
    expect(pipeBlocks("Jerome H. Powell | Chair\nJohn | Vice Chair")).toEqual([]);
  });
});

describe("수량어 · 수 검사 (D42 · fact-check-rules.json)", () => {
  it("several → 여러 는 통과 · several → 일부 는 실패 (P-3 Sonnet 의 오류)", () => {
    expect(quantifierProblem("여러 참가자는 정책이 제약적이지 않다고 봄", ["Several participants viewed the current policy rate as not restrictive"])).toBeNull();
    expect(quantifierProblem("일부 참가자는 정책이 제약적이지 않다고 봄", ["Several participants viewed the current policy rate as not restrictive"])).toMatch(/some/);
  });
  it("수량어를 빼면 실패 · 표에 없는 말이면 실패 · 대다수 의 다수 는 괜찮다", () => {
    expect(quantifierProblem("참가자들은 정책이 제약적이지 않다고 봄", ["Several participants viewed"])).toMatch(/사람 낱말만/);
    expect(quantifierProblem("다수의 참가자는 …", ["Many participants noted"])).not.toBeNull();
    expect(quantifierProblem("대다수 참가자는 …", ["The vast majority of participants judged"])).toBeNull();
    expect(enQuantifiers(["almost all members no longer judged"])).toEqual(["almost_all"]);
    expect(koQuantifiers("위원 거의 모두는")).toEqual(["almost_all"]);
  });
  it("대응표의 한국어 말은 서로 겹치지 않는다", () => {
    const ko = CHECK_RULES.quantifiers.classes.flatMap((c) => c.ko);
    expect(new Set(ko).size).toBe(ko.length);
    const en = CHECK_RULES.quantifiers.classes.flatMap((c) => c.en);
    expect(new Set(en).size).toBe(en.length);
  });
  it("글의 수 · 날짜는 구절에 있어야 한다 — 달 이름 · 수 낱말 · 공개일은 된다 · 단위 바꾸기 · 구절에 없는 해는 안 된다", () => {
    expect(numbersMissing("2026년 9월 실업률 4.1%", ["The unemployment rate was 4.1 percent in September"], ["2026-10-02"])).toEqual([]);
    expect(numbersMissing("18명 중 16명", ["Eighteen participants", "sixteen of them"], [])).toEqual([]);
    expect(numbersMissing("개인소득은 1,151억 달러 증가", ["increased $115.1 billion"], [])).toEqual(["1151"]);
    expect(numbersMissing("1/4%p 인상", ["raise the target range by 1/4 percentage point"], [])).toEqual([]);
    expect(numbersMissing("25bp 인상", ["raise the target range by 1/4 percentage point"], [])).toEqual(["25"]);
    expect(numbersMissing("2025년 12월 실업률 4.4%", ["The unemployment rate in December was 4.4 percent"], ["2026-02-18"])).toEqual(["2025"]);
  });
});

describe("P-3 프롬프트 · 스키마", () => {
  it("fact_type 은 계약의 7값 그대로 · 스키마도 같은 값", () => {
    expect([...FACT_TYPES]).toEqual(["OFFICIAL_ACTION", "OFFICIAL_CLAIM", "OFFICIAL_LIMIT", "MEASUREMENT", "COURT_RULING", "COMPANY_DISCLOSURE", "INDEPENDENT_OBSERVATION"]);
    expect(OUTPUT_SCHEMA.properties.facts.items.properties.fact_type.enum).toEqual([...FACT_TYPES]);
  });
  it("프롬프트 판이 있고, 9월 골든의 사실 글을 본보기로 담지 않는다 · 수량어 대응표를 그대로 담는다", () => {
    expect(PROMPT_VERSION).toBe("p3-extract/3");
    const store = JSON.parse(readFileSync(new URL("../../../fixtures/store.json", import.meta.url), "utf8"));
    for (const f of store.facts as { claim_text: string }[]) expect(SYSTEM_PROMPT.includes(f.claim_text)).toBe(false);
    for (const c of CHECK_RULES.quantifiers.classes) for (const k of c.ko) expect(SYSTEM_PROMPT).toContain(k);
    expect(SYSTEM_PROMPT).not.toContain("some participants\" 는 \"일부 참가자\"");
  });
});

describe("P-5 — 프롬프트 판 · 연준 회의 일정 (P4-j · P4-f)", () => {
  const ev = { code: "X", what: "x", date: "2026-10-28", prev_meeting: "2026-09-16" };
  const doc = { label: "D", title: "t", publisher: "p", published_at: "2026-10-01", url: null };
  it("/2 출력을 쓰는 조건은 회의 뒤 문서가 아닐 때 — 회의 뒤 갈래만 /3 에서 생겼다", () => {
    expect(Object.keys(PROMPT_COMPAT)).toEqual(["p3-extract/2"]);
    expect(scopeLine(ev, { ...doc, after: true })).toContain("뒤에 나온 문서");
    expect(scopeLine(ev, doc)).not.toContain("뒤에 나온 문서");
  });
  const cal = ["intro", "2026 FOMC Meetings", "October", "27-28", "Statement:", "December", "8-9*", CAL_FOOT, "2025 FOMC Meetings", "October", "28-29", "December", "9-10*", CAL_FOOT, "Note: tentative", "Last Update: October 28, 2026"].join("\n");
  const calDoc = { label: "CAL", source_id: "s", title: "t", publisher: "federalreserve.gov", published_at: "2026-10-07", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", text: cal };
  it("일정은 코드가 읽는다 — 사건 해의 회의 하나 = 사실 하나 · * 표시 · as_of = Last Update", () => {
    expect(docKind(calDoc.url)).toBe("MIXED");
    const r = readTables(calDoc, { date: "2026-10-28", prev_meeting: "2026-09-16" });
    expect(r.facts.map((f) => f.table.cells[0]!.value)).toEqual(["27-28", "8-9*"]);
    expect(r.facts[0]!.claim_text).toContain("October 27-28 회의: * 표시 없음");
    expect(r.facts[1]!.claim_text).toContain("December 8-9* 회의: * 표시 있음");
    expect(r.facts.every((f) => f.volatility === "VOLATILE" && f.as_of === "2026-10-28" && f.event_at === null)).toBe(true);
  });
  it("모델에게는 일정 덩어리를 가린다 (글은 보낸다)", () => {
    expect(calendarBlock(cal)).toEqual({ first: 1, last: 13 });
    const m = modelInput(calDoc);
    expect(m).toContain(MASK);
    expect(m).toContain("Note: tentative");
    expect(m).not.toContain("27-28");
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
