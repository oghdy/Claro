import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inlineRuns, linearize, validateArticlePackage, type Block } from "../src";

const GOLDEN_PATH = fileURLToPath(new URL("../../../fixtures/fomc-2026-09.article.json", import.meta.url));
const golden = (): any => JSON.parse(readFileSync(GOLDEN_PATH, "utf-8"));

function codes(doc: unknown): string[] {
  const r = validateArticlePackage(doc);
  return r.ok ? [] : r.errors.map((e) => e.code);
}

describe("골든", () => {
  it("검증을 통과한다 — 경고도 없다", () => {
    const r = validateArticlePackage(golden());
    if (!r.ok) throw new Error(r.errors.map((e) => `${e.code} ${e.path} ${e.message}`).join("\n"));
    expect(r.warnings).toEqual([]);
    expect(r.pkg.levels.map((l) => [l.id, l.slides.length, l.open_questions.length])).toEqual([
      ["basic", 9, 8],
      ["advanced", 5, 4],
    ]);
  });

  it("`_` 필드를 무시하고, 돌려주는 패키지에는 남기지 않는다 (§9-10)", () => {
    const raw = golden();
    expect(JSON.stringify(raw)).toMatch(/"_/);
    const r = validateArticlePackage(raw);
    expect(r.ok).toBe(true);
    if (r.ok) expect(JSON.stringify(r.pkg)).not.toMatch(/"_/);
  });

  it("모든 블록이 text == linearize(block) (§9-4)", () => {
    let n = 0;
    for (const lv of golden().levels)
      for (const s of lv.slides)
        for (const b of s.blocks) {
          expect(linearize(b as Block)).toBe(b.text);
          n++;
        }
    expect(n).toBeGreaterThan(0);
  });
});

describe("위반은 거부한다", () => {
  it("text 가 구조와 다르다 → TEXT_MISMATCH", () => {
    const d = golden();
    d.levels[0].slides[3].blocks[1].items[1].value[0].text = "3.4%";
    expect(codes(d)).toEqual(["TEXT_MISMATCH"]);
  });

  it("open_questions 길이 → OQ_LENGTH", () => {
    const d = golden();
    d.levels[1].open_questions.pop();
    expect(codes(d)).toEqual(["OQ_LENGTH"]);
  });

  it("빈 open_question → STRING_EMPTY", () => {
    const d = golden();
    d.levels[0].open_questions[2].text = " ";
    expect(codes(d)).toEqual(["STRING_EMPTY"]);
  });

  it("레벨 순서 · 어휘 → LEVEL_ID", () => {
    const d = golden();
    d.levels.reverse();
    expect(codes(d)).toEqual(["LEVEL_ID"]);
    const e = golden();
    e.levels[1].id = "adv";
    expect(codes(e)).toEqual(["LEVEL_ID"]);
  });

  it("다른 슬라이드를 가리키는 필드 → SCHEMA_KEY (§9-3)", () => {
    const d = golden();
    d.levels[0].open_questions[0].resolves = 1;
    expect(codes(d)).toEqual(["SCHEMA_KEY"]);
  });

  it("<b> 밖의 태그 → INLINE_FORMAT, span 을 넘는 <b> → BOLD_CROSSES_SPAN (§9-7)", () => {
    const d = golden();
    const sp = d.levels[0].slides[0].headline[0];
    sp.text = sp.text.replace("\n", "<br>");
    expect(codes(d)).toContain("INLINE_FORMAT");
    const e = golden();
    const para = e.levels[0].slides[3].blocks[0].paragraphs[0].body;
    para[0].text = para[0].text.replace("</b>", "");
    expect(codes(e)).toContain("BOLD_CROSSES_SPAN");
  });

  it("layer 어휘 밖 → SPAN_LAYER", () => {
    const d = golden();
    d.levels[0].slides[0].headline[0].layer = "source";
    expect(codes(d)).toEqual(["SPAN_LAYER"]);
  });

  it("refs 는 층이 정한 모양이다 — concept 층은 ConceptRef, 나머지는 UUID 문자열 (§6 · DATA_MODEL §2.2)", () => {
    // 골든: 입문 3장 헤드라인은 concept 층, 입문 1장 헤드라인은 fact 층
    const concept = (d: any) => d.levels[0].slides[2].headline[0];
    const fact = (d: any) => d.levels[0].slides[0].headline[0];
    expect(concept(golden()).layer).toBe("concept");
    expect(fact(golden()).layer).toBe("fact");
    expect(concept(golden()).refs[0]).toEqual({ concept_id: expect.any(String), version: expect.any(Number), part: null });
    expect(typeof fact(golden()).refs[0]).toBe("string");

    const cases: [string, (d: any) => void][] = [
      ["concept 층에 옛 문자열 \"C-0002\"", (d) => (concept(d).refs = ["C-0002"])],
      ["ConceptRef 에 part 가 없다", (d) => delete concept(d).refs[0].part],
      ["ConceptRef 에 계약에 없는 필드", (d) => (concept(d).refs[0].code = "C-0002")],
      ["ConceptRef 의 version 이 문자열", (d) => (concept(d).refs[0].version = "4")],
      ["ConceptRef 의 version 이 0", (d) => (concept(d).refs[0].version = 0)],
      ["fact 층에 ConceptRef 객체", (d) => (fact(d).refs = [{ concept_id: "x", version: 1, part: null }])],
      ["fact 층에 숫자", (d) => (fact(d).refs = [31])],
      ["refs 가 목록이 아니다", (d) => (fact(d).refs = "F01")],
    ];
    for (const [name, mutate] of cases) {
      const d = golden();
      mutate(d);
      expect(codes(d), name).toEqual(["SPAN_REFS"]);
    }
    // part 는 문자열이거나 null — 문안 이름이 맞는지는 백엔드 검사(CONCEPT_IDENTITY 불변식 12)가 본다
    const ok = golden();
    concept(ok).refs[0].part = "FULL:②";
    expect(codes(ok)).toEqual([]);
  });

  it("emphasized 항목을 <b> 로 또 감쌈 → EMPHASIZED_DOUBLE (§9-8)", () => {
    const d = golden();
    // 골든에서 emphasized 가 있는 첫 항목을 찾아 value 를 통째 굵게
    for (const lv of d.levels)
      for (const s of lv.slides)
        for (const b of s.blocks)
          if (b.type === "contrast")
            for (const it of b.items)
              if (it.emphasized && it.value) {
                it.value = [{ ...it.value[0], text: `<b>${it.value.map((x: any) => x.text).join("")}</b>` }];
                b.text = linearize(b);
                expect(codes(d)).toContain("EMPHASIZED_DOUBLE");
                return;
              }
    throw new Error("골든에 emphasized contrast 항목이 없다");
  });
});

describe("모르는 type (§7.9 · D14)", () => {
  it("실패가 아니라 경고. text 만 있으면 그릴 수 있다", () => {
    const d = golden();
    d.levels[0].slides[0].blocks.push({ type: "map", text: "경로: <b>북상</b>\n멕시코 → 텍사스", route: [1, 2] });
    const r = validateArticlePackage(d);
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.code)).toEqual(["BLOCK_TYPE_UNKNOWN"]);
  });

  it("text 가 없으면 그릴 것이 없다 → BLOCK_NO_TEXT", () => {
    const d = golden();
    d.levels[0].slides[0].blocks.push({ type: "map", route: [1, 2] });
    expect(codes(d)).toEqual(["BLOCK_NO_TEXT"]);
  });
});

describe("inlineRuns — <b> 와 \\n 만 서식", () => {
  it("<b> 만 굵기로 읽고 나머지 태그는 글자로 둔다", () => {
    expect(inlineRuns("a<b>b</b>c<i>d</i>\ne")).toEqual([
      { text: "a", bold: false },
      { text: "b", bold: true },
      { text: "c<i>d</i>\ne", bold: false },
    ]);
  });
});
