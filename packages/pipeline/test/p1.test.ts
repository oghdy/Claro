import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { htmlToText, sha256, tidy } from "../src/extract.ts";
import { canon, cpLength, cpSlice, locate, spanMatches } from "../src/match.ts";
import { rightsOf } from "../src/rights.ts";

const root = new URL("../../../", import.meta.url);
const store = JSON.parse(readFileSync(new URL("fixtures/store.json", root), "utf8"));
const storeDocs = JSON.parse(readFileSync(new URL("fixtures/store.documents.json", root), "utf8"));
const record = JSON.parse(readFileSync(new URL("packages/pipeline/data/fomc-2026-09.sources.json", root), "utf8"));

describe("뽑기 (extract.ts)", () => {
  const html = `<html><head><title>t</title><script>var x = "no";</script></head><body>
    <nav>Menu</nav><p>Inflation
      remains&nbsp;elevated. Today&rsquo;s action.</p><!-- c -->
    <table><tr><th>Date</th><td>Increase</td></tr><tr><td><time>09/15/2026</time>
    </td><td>25</td></tr></table><pre>a  b
c</pre><style>p{}</style><div>x<br>y</div></body></html>`;

  it("블록은 줄 · 표의 줄은 한 줄(칸은 ' | ') · 글자 참조를 푼다 · 소스의 줄바꿈은 공백 · script/style/head 는 버린다", () => {
    expect(htmlToText(html)).toBe("Menu\nInflation remains elevated. Today’s action.\nDate | Increase\n09/15/2026 | 25\na b\nc\nx\ny");
  });
  it("같은 입력이면 같은 글 · 같은 해시", () => {
    expect(sha256(htmlToText(html))).toBe(sha256(htmlToText(html)));
  });
  it("공백 정리 — 줄마다 공백 묶음 하나 · 빈 줄 없음 · 끝 줄바꿈 없음", () => {
    expect(tidy("  a \t b \n\n\n c  d  \n")).toBe("a b\nc d");
  });
});

describe("맞추기 (match.ts · match-rules.json)", () => {
  it("공백 · 줄바꿈 · 따옴표 모양만 같게 본다", () => {
    const t = "He said:\nToday’s  policy action will “support” it.";
    expect(locate(t, `Today's policy action will "support" it.`)).toEqual({ result: "FOUND", span_start: 9, span_end: t.length });
  });
  it("대시 · 줄임표 · 마크다운 표시는 같게 보지 않는다 — 못 찾음", () => {
    const t = "by a 12 – 0 vote. one more thing. a discipline, not to a decision.";
    expect(locate(t, "by a 12 - 0 vote").result).toBe("NOT_FOUND");
    expect(locate(t, "one … thing").result).toBe("NOT_FOUND");
    expect(locate(t, "a discipline, **not to a decision**.").result).toBe("NOT_FOUND");
  });
  it("여러 곳이면 여럿 — 위치를 고르지 않는다", () => {
    expect(locate("x 4.1 y 4.1 z", "4.1")).toEqual({ result: "MULTIPLE", count: 2, starts: [2, 8] });
  });
  it("위치는 코드 포인트 단위 (Python str 과 같다)", () => {
    const t = "𝔸 Inflation remains elevated.";
    const r = locate(t, "remains");
    expect(r).toEqual({ result: "FOUND", span_start: 12, span_end: 19 });
    expect(cpSlice(t, 12, 19)).toBe("remains");
    expect(cpLength(t)).toBe(t.length - 1);
  });
  it("canon 은 길이를 줄이기만 한다 (공백 묶음)", () => {
    expect(canon("a \n b").c).toBe("a b");
  });
});

describe("권리", () => {
  it("연방 정부만 저장소에 — 그 밖은 미확인", () => {
    expect(rightsOf("federalreserve.gov")).toBe("US_FEDERAL_17USC105");
    expect(rightsOf("cmegroup.com")).toBe("UNCONFIRMED");
  });
});

describe("저장소 — store.json · store.documents.json 과 가져온 기록이 맞는가 (검사 verify-data-model.py 와 같은 것을 TS 로)", () => {
  const docs = new Map<string, string>(storeDocs.source_documents.map((d: { source_id: string; text: string }) => [d.source_id, d.text]));
  const recs = new Map<string, { text_sha256: string; text_length: number; text_in: string; rights: string }>(
    record.documents.map((d: { source_id: string }) => [d.source_id, d]),
  );
  it("저장한 원문은 기록의 해시 · 길이와 같고, 연방 정부 저작물뿐이다", () => {
    for (const [sid, text] of docs) {
      const r = recs.get(sid)!;
      expect(sha256(text)).toBe(r.text_sha256);
      expect(cpLength(text)).toBe(r.text_length);
      expect(r.rights).toBe("US_FEDERAL_17USC105");
      expect(r.text_in).toBe("store.documents.json");
    }
  });
  it("span 이 있는 FactSource 는 그 글의 span 이 구절과 맞고, 구절이 그 글에 한 번뿐이다", () => {
    let n = 0;
    for (const fs of store.fact_sources) {
      if (fs.span_start == null) continue;
      const text = docs.get(fs.source_id)!;
      expect(spanMatches(text, fs.span_start, fs.span_end, fs._passage)).toBe(true);
      expect(locate(text, fs._passage)).toEqual({ result: "FOUND", span_start: fs.span_start, span_end: fs.span_end });
      n++;
    }
    expect(n).toBe(record.spans.filter((x: { result: string }) => x.result === "FOUND").length);
  });
});
