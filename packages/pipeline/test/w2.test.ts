import { describe, expect, it } from "vitest";
import { codeCheck, derive, inputOf, loadCases, outcomeOf, score, sentenceStarts, shapeProblems, widen, wrapped, type Case } from "../src/w2.ts";
import { SYSTEM, userMessage, type Judgement } from "../src/w2-prompt.ts";

const J = (verdict: Judgement["verdict"], issues: Judgement["issues"] = []): Judgement => ({ verdict, issues, note: "" });
const cases = loadCases().cases;
const byId = (id: string) => cases.find((c) => c.id === id)!;

describe("W-2 둘레 — 코드가 원문에서 구절을 넓힌다", () => {
  it("문장 조각이면 그 문장 전체 + 앞 두 문장 + 뒤 한 문장", () => {
    const t = "One. Two is here. Three says that the manager noted that prices rose. Four follows. Five.";
    const a = t.indexOf("prices rose"), b = a + "prices rose".length;
    expect(widen(t, a, b)).toBe("One. Two is here. Three says that the manager noted that ⟦prices rose⟧. Four follows.");
  });
  it("줄임말 · 머리글자에서 문장을 끊지 않는다", () => {
    const t = "Voting against were Beth M. Hammack and Mr. Smith of the U.S. Treasury. Next one.";
    expect(sentenceStarts(Array.from(t), false)).toEqual([0, t.indexOf("Next")]);
  });
  it("PDF 글(문장 중간 줄바꿈)은 줄바꿈을 공백으로 · HTML 글은 줄 = 문단", () => {
    const pdf = "This is a long line of a transcript that keeps going well past sixty characters and then\nwraps in the middle of the sentence without any terminator at the end of the line and\ncontinues here. Short.";
    expect(wrapped(pdf)).toBe(true);
    const html = "Menu item\nAnother menu item\nThe Committee decided to raise the target range. It will deliver.\nFor media inquiries";
    expect(wrapped(html)).toBe(false);
    const a = html.indexOf("raise the target range"), b = a + "raise the target range".length;
    expect(widen(html, a, b)).toBe("Menu item Another menu item The Committee decided to ⟦raise the target range⟧. It will deliver.");
  });
  it("실물 — P3b-b 의 구절 부족 4 는 둘레에 빠진 주어 · 맥락이 들어온다", () => {
    const ctx = (id: string) => inputOf(byId(id)).evidence.map((e) => e.context).join(" ");
    expect(ctx("SH-MIN-09#11")).toContain("the manager noted");
    expect(ctx("SH-PC-10#5")).toContain("the accumulation of more ⟦information");
    expect(ctx("SH-PC-10#29")).toContain("strategy meeting");
    expect(ctx("SH-PC-09#25")).toContain("artificial intelligence");
  });
  it("원문이 저장되지 않은 문서는 둘레가 없다", () => {
    expect(inputOf(byId("G-F42")).evidence[0]!.context).toBeNull();
  });
});

describe("W-2 판정을 코드가 다시 본다", () => {
  it("verdict 는 issues 에서 정해진다", () => {
    expect(derive([])).toBe("ENTAILED");
    expect(derive([{ where: "CONTEXT" }])).toBe("NEEDS_CONTEXT");
    expect(derive([{ where: "CONTEXT" }, { where: "NOWHERE" }])).toBe("EXCEEDS");
    expect(derive([{ where: "NOWHERE" }, { where: "CONFLICT" }])).toBe("CONTRADICTS");
  });
  it("part 는 글에 글자 그대로 있어야 한다 · verdict 가 issues 와 어긋나면 모양 문제", () => {
    const claim = "여러 참가자는 금리를 올려야 한다고 말함";
    expect(shapeProblems(claim, J("EXCEEDS", [{ part: "여러 참가자", kind: "QUANTITY", where: "NOWHERE", why: "" }]))).toEqual([]);
    expect(shapeProblems(claim, J("EXCEEDS", [{ part: "여러 참가자들", kind: "QUANTITY", where: "NOWHERE", why: "" }]))[0]).toContain("part 가 글에 없다");
    expect(shapeProblems(claim, J("ENTAILED", [{ part: "여러 참가자", kind: "QUANTITY", where: "NOWHERE", why: "" }]))[0]).toContain("≠");
    expect(shapeProblems(claim, J("CANNOT_JUDGE"))).toEqual([]);
  });
  it("게이트에서 — ENTAILED 그대로 · NEEDS_CONTEXT 표시 · 나머지는 막는다", () => {
    expect(["ENTAILED", "NEEDS_CONTEXT", "EXCEEDS", "CONTRADICTS", "CANNOT_JUDGE"].map((v) => outcomeOf(v as Judgement["verdict"]))).toEqual(["PASS", "FLAG", "BLOCK", "BLOCK", "BLOCK"]);
  });
});

describe("W-2 점수 — 시험 묶음의 expect 와 대 본다", () => {
  const right = byId("G-F04"), short = byId("SH-PC-09#25"), bad = byId("C-QUANTITY-2");
  it("맞는 예 — 막으면 틀림 · 구절 짧음 표시는 막은 것이 아니다", () => {
    expect(score(right, J("ENTAILED")).correct).toBe(true);
    expect(score(right, J("NEEDS_CONTEXT", [{ part: "성명문은", kind: "ACTOR", where: "CONTEXT", why: "" }])).correct).toBe(true);
    expect(score(right, J("EXCEEDS", [{ part: "성명문은", kind: "ACTOR", where: "NOWHERE", why: "" }])).correct).toBe(false);
    expect(score(right, J("CANNOT_JUDGE")).correct).toBe(false);
  });
  it("구절 부족 — 그대로 보내면 놓친 것", () => {
    expect(score(short, J("ENTAILED")).correct).toBe(false);
    expect(score(short, J("NEEDS_CONTEXT", [{ part: "AI 관련", kind: "DETAIL", where: "CONTEXT", why: "" }]))).toMatchObject({ correct: true, exact: true });
  });
  it("넘침 — EXCEEDS · CONTRADICTS 만 잡은 것 · 가리킨 부분이 changed 와 겹치는지", () => {
    expect(score(bad, J("ENTAILED")).correct).toBe(false);
    expect(score(bad, J("NEEDS_CONTEXT", [{ part: "대부분의 참가자", kind: "QUANTITY", where: "CONTEXT", why: "" }])).correct).toBe(false);
    expect(score(bad, J("CONTRADICTS", [{ part: "대부분", kind: "QUANTITY", where: "CONFLICT", why: "" }]))).toMatchObject({ correct: true, pointed: true });
    expect(score(bad, J("EXCEEDS", [{ part: "크게 흐리게", kind: "QUANTITY", where: "NOWHERE", why: "" }]))).toMatchObject({ correct: true, pointed: false });
  });
  it("코드 검사와 겹치는 곳 — 연준 수량어는 대응표가 이미 막는다 · 인과는 못 막는다", () => {
    expect(codeCheck(byId("C-QUANTITY-2"))).toContain("수량어");
    expect(codeCheck(byId("C-CAUSE-4"))).toBeNull();
  });
});

describe("W-2 시험 묶음 · 프롬프트", () => {
  it("망가뜨린 글은 바탕 예와 구절이 같고 글만 다르다 · changed 는 글에 있고 바탕 글에는 없다", () => {
    const corrupt = cases.filter((c) => c.kind.startsWith("corrupt-"));
    expect(corrupt.length).toBe(24);
    for (const c of corrupt) {
      const b = byId(c.base!);
      expect(b.group).toBe("RIGHT");
      expect(c.passages).toEqual(b.passages);
      expect(c.fact.claim_text).not.toBe(b.fact.claim_text);
      for (const ch of c.changed!) { expect(c.fact.claim_text).toContain(ch); expect(b.fact.claim_text).not.toContain(ch); }
    }
  });
  it("모델 입력에 정답의 단서(id · kind · expect · note)가 없다", () => {
    for (const c of cases as Case[]) {
      const u = inputOf(c).user;
      expect(u).not.toContain(c.id);
      for (const w of ["corrupt-", "golden", "p3b-", "망가뜨린", "시험"]) expect(u).not.toContain(w);
      if (c.note) expect(u).not.toContain(c.note);
    }
  });
  it("프롬프트 — 고쳐 쓰지 않는다 · 배경 지식으로 메우지 않는다 · part 는 글자 그대로", () => {
    expect(SYSTEM).toContain("글을 고쳐 쓰지 않는다");
    expect(SYSTEM).toContain("배경 지식으로 빈 곳을 메우지 않는다");
    expect(SYSTEM).toContain("글자 그대로 딴");
    expect(userMessage({ claim_text: "글", fact_type: "MEASUREMENT", actor: null, event_at: null, as_of: null }, [{ title: "T", publisher: "P", published_at: "2026", passage: "p", context: null }])).toContain("둘레: 없음");
  });
});
