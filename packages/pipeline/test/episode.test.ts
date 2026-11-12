import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMMON, applyRepairs, dateLine, needsEntail, textsOf } from "../src/episode.ts";
import { DESIGN_SCHEMA, DESIGN_SYSTEM, ENTAIL_SYSTEM, REPAIR_SYSTEM, WRITE_SCHEMA, fromCells, parseDesign, parseWritten, template, writeSystem, DESIGN_SPEC, WRITE_SPEC } from "../src/episode-prompt.ts";

const golden = JSON.parse(readFileSync(new URL("../../../fixtures/episode-rate-2.json", import.meta.url), "utf8"));
const price = JSON.parse(readFileSync(new URL("../../../fixtures/episode-price-1.json", import.meta.url), "utf8"));
/** 회차의 독자 글 전부 (EpisodeText 의 t 와 맨 글자열) */
function strings(v: unknown, out: string[] = [], key = ""): string[] {
  if (typeof v === "string") { if (!["doc", "quote", "source_id", "concept_id", "episode_id", "event_ref", "series_id", "id", "tool", "key", "kind", "state", "reach", "why", "split", "voice", "from", "code"].includes(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out, key));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!k.startsWith("_") && !["docs", "quotes", "assembly", "pickup"].includes(k)) strings(x, out, k);
  return out;
}

describe("P-E1 — 공정한 시험: 프롬프트에 손으로 만든 금리 2화 (골든)의 글이 없다", () => {
  it("골든에만 있는 독자 글 (10자 이상)은 어느 프롬프트에도 없다 — 두 실물에 글자가 같은 화면 말은 뺀다", () => {
    const common = new Set([...strings(price), ...Object.values(COMMON)]);
    const only = [...new Set(strings(golden))].filter((s) => s.replace(/\s/g, "").length >= 10 && !common.has(s));
    expect(only.length).toBeGreaterThan(100);
    const prompts = [DESIGN_SYSTEM, writeSystem("(본보기 자리)"), ENTAIL_SYSTEM, REPAIR_SYSTEM].join("\n");
    expect(only.filter((s) => prompts.includes(s))).toEqual([]);
  });
});

describe("P-E1 — 칸 목록 (모델 출력) → 모양", () => {
  it("API 에 보내는 스키마는 칸 목록 하나다 (큰 스키마는 문법이 너무 커 거절된다)", () => {
    expect(Object.keys(DESIGN_SCHEMA.properties)).toEqual(["cells"]);
    expect(Object.keys(WRITE_SCHEMA.properties)).toEqual(["cells"]);
  });
  it("프롬프트의 칸 목록은 SPEC 에서 나온다", () => {
    const t = template(DESIGN_SPEC as never);
    expect(t).toContain("chosen_flip = 정수");
    expect(t).toContain("seats.sides[i].why = \"in-doc\" | \"not-yet\"");
    expect(DESIGN_SYSTEM).toContain("flips[i].breaker_facts = 빈칸으로 띄운 목록");
    expect(template(WRITE_SPEC as never)).toContain("lab.seats.sides[i].said = 글 한 덩이 (T)");
  });
  it("빠진 칸은 빈 값 · 모르는 칸과 enum 밖의 값은 알린다", () => {
    const { design, problems } = parseDesign(JSON.stringify({ cells: [{ k: "flips[0].a", v: "가" }, { k: "flips[0].op", v: "~" }, { k: "chosen_flip", v: "-1" }, { k: "frames", v: "chain seats" }, { k: "없는.칸", v: "x" }, { k: "seats.sides[1].count", v: "2" }] }));
    expect(design.flips).toHaveLength(1);
    expect(design.chosen_flip).toBe(-1);
    expect(design.frames).toEqual(["chain", "seats"]);
    expect(design.seats.sides).toHaveLength(2);
    expect(design.seats.sides[1]!.count).toBe(2);
    expect(design.death_proposal).toBe(false);
    expect(problems).toEqual(["flips[0].op: \"~\" 는 ≠ | = 가 아니다", "모르는 칸 없는.칸"]);
    expect(fromCells(DESIGN_SPEC as never, []).problems).toEqual([]);
  });
  it("글 한 덩이 — src 는 사실 label 목록 · calc 는 '숫자: 방법' 목록 · 틀이 없으면 lab 은 null", () => {
    const w = parseWritten(JSON.stringify({ cells: [
      { k: "cover.dek", t: "여섯 주 뒤 6주", src: "F001, F012 엉뚱", calc: "6: 9월 16일 → 10월 28일 = 42일 || 12: 10 + 2", voice: "fact" },
      { k: "entry.flip_a", t: "가", src: "", calc: "", voice: "none" }, { k: "entry.flip_b", t: "나", src: "", calc: "", voice: "none" },
      { k: "lab.seats.sides[0].not_yet_note", t: "", src: "", calc: "", voice: "none" },
    ] }), [], "flip");
    expect(w.cover.dek).toEqual({ t: "여섯 주 뒤 6주", src: ["F001", "F012"], calc: [{ n: "6", how: "9월 16일 → 10월 28일 = 42일" }, { n: "12", how: "10 + 2" }], voice: "fact" });
    expect(w.entry.flip).toMatchObject({ a: "가", op: "≠", b: "나" });
    expect(w.lab).toBeNull();
    expect(w.plain.three).toBeNull();
  });
});

describe("P-E1 — 짓기의 작은 부품", () => {
  it("문서 머리의 날짜 줄", () => {
    expect(dateLine("Press Release\nOctober 28, 2026\nFederal Reserve issues FOMC statement\n", "2026-10-28T18:00:00Z")).toEqual({ quote: "October 28, 2026" });
    expect(dateLine("날짜가 없는 글", "2026-10-28")).toBeNull();
    expect(dateLine("October 28, 2026", "2026-10")).toBeNull();
  });
  it("고치기 — fix 는 글을 바꾸고 · drop 은 뺄 수 있는 줄만 뺀다", () => {
    const w = parseWritten(JSON.stringify({ cells: [
      { k: "event.riddle[0]", t: "하나", src: "F001", calc: "", voice: "explain" }, { k: "event.riddle[1]", t: "둘", src: "F002", calc: "", voice: "fact" },
      { k: "event.lead", t: "머리", src: "F003", calc: "", voice: "fact" },
    ] }), [], "flip");
    const r = applyRepairs(w, [
      { id: "event.riddle[0]", action: "drop", t: "하나", src: [], calc: [], why: "", round: 1 },
      { id: "event.lead", action: "drop", t: "머리", src: [], calc: [], why: "", round: 1 },
      { id: "event.riddle[1]", action: "fix", t: "둘 고침", src: ["F002"], calc: [], why: "", round: 1 },
    ]);
    expect(r.written.event.riddle.map((x) => x.t)).toEqual(["둘 고침"]);
    expect(r.written.event.lead.t).toBe("머리");
    expect(r.cantDrop.map((x) => x.id)).toEqual(["event.lead"]);
    expect(w.event.riddle).toHaveLength(2);
    expect(textsOf(w).map((t) => t.id)).toContain("event.riddle[1]");
  });
  it("함의를 보는 글 — 근거가 있고 낱말만은 아닌 것", () => {
    expect(needsEntail({ t: "2026년 10월 28일", src: ["F001"], calc: [], voice: "none" })).toBe(false);
    expect(needsEntail({ t: "연준은 금리를 그대로 두기로 했어요.", src: ["F002"], calc: [], voice: "fact" })).toBe(true);
    expect(needsEntail({ t: "연준은 금리를 그대로 두기로 했어요.", src: [], calc: [], voice: "explain" })).toBe(false);
  });
});
