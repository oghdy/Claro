// P-S1 — 짧은 이야기 단계 (src/short.ts · short-prompt.ts). 모델을 부르지 않는다 — 구절 끊기 · 칸 목록 → 모양 · 고침 얹기 · 짓기 → 계약 검증 · 확인지.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WRITE_SCHEMA, type WT } from "../src/episode-prompt.ts";
import { needsEntail2 } from "../src/episode.ts";
import { CELLS, SHORT_WRITE_SYSTEM, STRING_CELLS, parseShort, shortWriteSystem, textsOfShort, type ShortWritten } from "../src/short-prompt.ts";
import { SHORT_MODELS, applyShortRepairs, assembleShort, build, entailReqShort, exemplarShort, load, passagesOf, review, sheet, textPaths, validateShort, writeReq } from "../src/short.ts";

const CODE = "license-notice";
const cp = (s: string) => Array.from(s);

describe("P-S1 — 구절 목록 (모델 없음)", () => {
  const x = load(CODE);
  const text = [...x.texts.values()][0]!;
  const ps = [...x.passages.values()];

  it("토막마다 문서의 글자 그대로다 — 자리 (코드 포인트)로 다시 잘라 같은 글 · 키는 문서의 차례대로 p01 …", () => {
    expect(ps.length).toBeGreaterThan(10);
    ps.forEach((p, i) => {
      expect(cp(text).slice(p.span_start, p.span_end).join(""), p.key).toBe(p.quote);
      expect(p.key).toBe(`p${String(i + 1).padStart(2, "0")}`);
      if (i) expect(p.span_start).toBeGreaterThanOrEqual(ps[i - 1]!.span_end);
    });
  });

  it("쪽 번호 줄을 넘지 않는다 — 쪽이 넘어가 끊긴 문장은 두 토막이고 뒤 토막에 표시 · 연락처 · 해시태그는 내지 않는다", () => {
    for (const p of ps) expect(p.quote).not.toMatch(/^\s*-\s*\d+\s*-\s*$/m);
    const cont = ps.filter((p) => p.cont);
    expect(cont.map((p) => p.quote.slice(0, 11))).toEqual(["하다고 보아 취소하였", "준수해야 한다는 원칙"]);
    const all = ps.map((p) => p.quote).join("\n");
    expect(all).not.toMatch(/044-|주무관|#국민권익위/);
    expect(all).toContain("보도시점: 2026. 10. 28.(수) 08:30");
  });

  it("작은 견본 — 줄머리 · 문장 끝 · 빈 줄에서 끊는다. 짧은 머리 줄은 버린다", () => {
    const t = "- 1 -\n보도자료\n보도시점 2026. 1. 2.(금) 12:00\n큰 제목 첫 줄\n둘째 줄\n- 작은 제목 하나\n□ 첫 문장이다. 둘째 문장은\n줄을 넘는다.\n* 각주: 기준은 3천만원 이상\n\n담당 부서 어디 책임자 누구 (02-000-0000)\n뒤는 내지 않는다.";
    expect(passagesOf(t).map((p) => p.quote)).toEqual(["보도시점 2026. 1. 2.(금) 12:00", "큰 제목 첫 줄\n둘째 줄", "- 작은 제목 하나", "□ 첫 문장이다.", "둘째 문장은\n줄을 넘는다.", "* 각주: 기준은 3천만원 이상"]);
  });
});

describe("P-S1 — 프롬프트 · 칸 목록", () => {
  it("칸의 길이 겹치지 않는다 · API 에 보내는 스키마는 칸 목록 하나 · 숫자 가중치 · 문턱이 없다", () => {
    expect(new Set(CELLS.map((c) => c.k)).size).toBe(CELLS.length);
    expect(Object.keys(WRITE_SCHEMA.properties)).toEqual(["cells"]);
    for (const c of CELLS) expect(SHORT_WRITE_SYSTEM).toContain(`${c.k} = `);
    expect(SHORT_WRITE_SYSTEM).not.toMatch(/점수|가중치|\d+\s*점|0\.\d/);
    expect(STRING_CELLS).toContain("keep.line");
  });

  it("본보기는 손 견본 (영훈 — 다른 사건)이고 근거 키 · 도구 · 지도의 글을 뺀다. 이 사건의 문서 글은 프롬프트에 없다 (입력에만)", () => {
    const ex = exemplarShort();
    expect(ex).toContain("뚫린 곳은");
    expect(ex).not.toMatch(/"src"|tool_lead|map_note|gain_label|pr\.yh/);
    const x = load(CODE), q = writeReq(x);
    expect(q.system).toBe(shortWriteSystem(ex));
    expect(q.system).not.toContain("사전 통지서");
    expect(q.user).toContain("p04 | #1.");
    expect(q.user).toContain("(쪽이 넘어가 끊김 — 앞 구절에서 이어짐) 하다고 보아 취소하였다.");
    expect(q.model).toBe("claude-fable-5-2");   // D73 — 글은 Fable
    expect(SHORT_MODELS.entail).toMatchObject({ model: "claude-opus-5-5", effort: "low" });
  });

  it("칸 목록 → 모양: src · calc 를 펴고 · 모르는 칸 · 빈 칸 · 틀린 값을 적는다", () => {
    const cells = [
      { k: "design.flip_strength", t: "strong", src: "", calc: "", voice: "none" },
      { k: "design.flip_basis", t: "여기에 선다", src: "p07 p13", calc: "", voice: "none" },
      { k: "design.not_drawn[0]", t: "가", src: "", calc: "", voice: "none" }, { k: "design.not_drawn[1]", t: "나", src: "", calc: "", voice: "none" },
      { k: "design.death", t: "maybe", src: "", calc: "", voice: "none" },
      { k: "where.body[0]", t: "이틀 먼저였어요.", src: "p04, F001 p99", calc: "2: 8월 10일 → 8월 12일 = 2일 || 엉터리", voice: "fact" },
      { k: "why.real[0].head", t: "머리", src: "", calc: "", voice: "none" }, { k: "why.real[0].body", t: "몸", src: "p13", calc: "", voice: "official" },
      { k: "lab.title", t: "체험", src: "", calc: "", voice: "none" },
    ];
    const { written: w, problems } = parseShort(JSON.stringify({ cells }));
    expect(w.design).toMatchObject({ flip_strength: "strong", flip_basis_src: ["p07", "p13"], not_drawn: ["가", "나"], death: false });
    expect(w.where.body).toEqual([{ t: "이틀 먼저였어요.", src: ["p04", "p99"], calc: [{ n: "2", how: "8월 10일 → 8월 12일 = 2일" }], voice: "fact" }]);
    expect(w.why.real).toHaveLength(1);
    expect(problems).toContain("모르는 칸 lab.title");
    expect(problems).toContain('design.death: "maybe" 는 true | false 가 아니다');
    expect(problems.filter((p) => p.startsWith("빈 칸")).length).toBeGreaterThan(10);
  });
});

// 손으로 만든 작은 글 — 실물 문서의 구절에 기댄다 (모델 출력이 아니다. 짓기 · 검증 · 고침의 길만 본다)
const wt = (t: string, src: string[] = [], voice: WT["voice"] = "none", calc: WT["calc"] = []): WT => ({ t, src, calc, voice });
const sample = (): ShortWritten => ({
  design: { first_thought_why: "까닭", flip_strength: "strong", flip_basis: "바탕", flip_basis_src: ["p13"], not_drawn: ["운전자가 무엇을 했는지 — 문서에 없다"], unknown: ["무엇"], concepts: ["사전 통지"], death: false, weight: "short", weight_why: "뒤집기 하나" },
  voice_official: "위원회의 판단",
  cover: { title: "제목\n둘째 줄", dek: wt("처분이 취소됐어요.", ["p08", "p09"], "fact"), meta: wt("2026년 10월 28일 발표", ["p01"]), hint: wt("짧게 볼게요."), ask: "물음" },
  plain: { title: "머리" },
  entry: { first_thought: wt("첫 생각", [], "explain"), breaker: wt("통지서는 2026년 8월 12일에 나왔는데 결정은 8월 10일이었어요.", ["p04"], "fact"), flip_a: "“가”", flip_op: "≠", flip_b: "“나”", flip_note: wt("위원회는 운전이 아니라 절차를 지켰는지를 봤어요.", ["p13"], "official"), whose: wt("여기까지는 **위원회의 판단**이에요.") },
  where: { kicker: "무엇을 봤나", body: [wt("첫 덩이", ["p14"], "fact"), wt("둘째 덩이", ["p05"], "fact")], unknown: wt("문서에 없어요."), ask: "물음" },
  why: { title: "머리", lead: wt("이끄는 글", ["p10"], "explain"), real_label: "위원회가 짚은 것", real: [{ head: wt("하나"), body: wt("몸 하나", ["p13"], "official") }, { head: wt("둘"), body: wt("몸 둘", ["p15"], "official") }], verdict: wt("판정", ["p08", "p09"], "official"), ask: "물음" },
  keep: { title: "머리", line: "한 줄이다.", advice_label: "위원장의 말", advice: wt("당부", ["p17", "p18"], "official") },
});

describe("P-S1 — 짓기 → 계약 검증 (홀로 선 짧은 이야기 · EPISODE §13.9)", () => {
  const x = load(CODE);

  it("곁 이야기 · 가리킨 도구가 없으면 null 이고 도구 · 지도의 글도 null — validateShortStory 통과 · 구절은 글이 가리킨 것만 · 알림 없음", () => {
    const { story, notes } = assembleShort(x, sample());
    const s = story as any;
    expect(notes).toEqual([]);
    expect([s.sibling, s.tools_from, s.scenes.why.tool_lead, s.scenes.keep.map_note, s.scenes.keep.gain_label]).toEqual([null, null, null, null, null]);
    expect(s.weight).toBe("short");
    expect(s.solve.plain).toEqual({ kind: "flip", why: "short", title: "머리" });
    expect(Object.keys(s.quotes)).toEqual(["p01", "p04", "p05", "p08", "p09", "p10", "p13", "p14", "p15", "p17", "p18"]);
    expect(s.quotes.p09).toEqual({ doc: "PR-1028-PDF", quote: "하다고 보아 취소하였다." });
    expect(s.scenes.cover.hint).toEqual({ t: "짧게 볼게요." });           // 근거 없는 글에는 꼬리표를 달지 않는다 (손 견본과 같다)
    expect(s.solve.entry.first_thought).toEqual({ t: "첫 생각" });
    const v = validateShort(story, x);
    expect(v.errors).toEqual([]);
    expect(v.warnings).toEqual([]);
    expect(v.stats).toMatchObject({ quotes: 11, docs: 1, tools_from: 0, texts_with_digits: 2 });
  });

  it("글의 숫자가 근거 구절에 없으면 거부 (NUMBER_UNGROUNDED) · 맨 글자열의 숫자 (BARE_DIGIT) · 없는 구절 키 (REF_QUOTE) — 자리를 글 덩이 id 로 옮길 수 있다", () => {
    const w = sample();
    w.entry.breaker.t = "결정이 2일 먼저였어요.";
    w.keep.line = "2일 먼저였다.";
    w.where.body[0]!.src = ["p77"];
    const v = validateShort(assembleShort(x, w).story, x);
    expect(v.errors.map((e) => e.code).sort()).toEqual(["BARE_DIGIT"]);   // 모양에서 먼저 멈춘다
    w.keep.line = "이틀 먼저였다.";
    const v2 = validateShort(assembleShort(x, w).story, x);
    expect(v2.errors.map((e) => `${e.code} ${e.path}`).sort()).toEqual(["NUMBER_UNGROUNDED /solve/entry/breaker", "REF_QUOTE /scenes/where/body/0/src"]);
    expect(new Map(textPaths(w)).get("/solve/entry/breaker")).toBe("entry.breaker");
    w.entry.breaker.calc = [{ n: "2", how: "8월 10일 → 8월 12일 = 2일" }];
    w.where.body[0]!.src = ["p14"];
    expect(validateShort(assembleShort(x, w).story, x).ok).toBe(true);
  });

  it("고침 얹기 — 고치기 단계 (근거까지 바꾼다) → 사람 (맨 뒤 · src 를 안 적으면 근거는 그대로 · 맨 글자열도 고친다 · 줄을 뺀다 · 그리지 않을 것을 갈음)", () => {
    const r = applyShortRepairs(sample(), [{ id: "why.verdict", action: "fix", t: "고친 판정", src: ["p13", "X9"], calc: [], why: "넘침", round: 1 }, { id: "why.lead", action: "keep", t: "이끄는 글", src: [], calc: [], why: "트집", round: 1 }], {
      edits: [{ id: "why.verdict", t: "사람이 고친 판정", why: "말투" }, { id: "keep.line", t: "사람의 한 줄이다.", why: "맺음" }, { id: "nope.cell", t: "x", why: "y" }],
      drops: ["where.body[1]", "cover.dek"], not_drawn: ["사람이 적은 선"],
    });
    expect(r.written.why.verdict).toMatchObject({ t: "사람이 고친 판정", src: ["p13"] });
    expect(r.written.why.lead.t).toBe("이끄는 글");
    expect(r.written.keep.line).toBe("사람의 한 줄이다.");
    expect(r.written.where.body.map((b) => b.t)).toEqual(["첫 덩이"]);
    expect(r.written.cover.dek.t).toBe("처분이 취소됐어요.");      // 뺄 수 없는 칸은 그대로
    expect(r.written.design.not_drawn).toEqual(["사람이 적은 선"]);
    expect([...r.touched]).toEqual(["why.verdict"]);
    expect(r.unknown).toEqual(["nope.cell"]);
    expect(r.applied.map((a) => `${a.round}:${a.id}:${a.action}`)).toEqual(["1:why.verdict:fix", "1:why.lead:keep", "0:why.verdict:fix", "0:keep.line:fix"]);
  });

  it("함의는 위험한 글에만 (D73 — episode.ts 의 규칙 그대로) · 요청은 구절과 그 둘레를 싣는다 · 고친 글은 다시 본다", () => {
    const w = sample();
    const ts = textsOfShort(w);
    expect(ts.map((t) => t.id).slice(0, 5)).toEqual(["cover.dek", "cover.meta", "cover.hint", "entry.first_thought", "entry.breaker"]);
    const risky = ts.filter((t) => needsEntail2(t.wt)).map((t) => t.id);
    expect(risky).toContain("entry.breaker");          // 숫자
    expect(risky).toContain("entry.flip_note");        // 기관의 판단
    expect(risky).not.toContain("cover.hint");         // 근거 없는 말 건넴
    expect(needsEntail2(w.where.body[0]!)).toBe(false);
    expect(needsEntail2(w.where.body[0]!, true)).toBe(false);   // 너무 짧은 글 (열네 글자 아래)은 고쳐도 보지 않는다
    const q = entailReqShort(x, "entry.breaker", w.entry.breaker)!;
    expect(q.user).toContain("구절: #1. 자동차운전면허 정지처분을 받고");
    expect(q.user).toContain("둘레: ");
    expect(q.effort).toBe("low");
    expect(entailReqShort(x, "cover.hint", w.cover.hint)).toBeNull();
  });
});

// 실물 — 파이프라인이 낸 첫 짧은 이야기 (모델 출력이 저장돼 있을 때만)
const OUT = new URL(`../data/events/ACRC-20261028-LICENSE-NOTICE/shorts/${CODE}/`, import.meta.url);
describe.runIf(existsSync(new URL("story.json", OUT)))("P-S1 — 실물 (license-notice)", () => {
  it("저장한 출력에서 다시 지으면 story.json 과 글자 단위로 같다 · 계약 검증 통과 · 홀로 선다 · 구절이 전부 git 의 문서에 그대로", () => {
    const r = build(CODE);
    const file = JSON.parse(readFileSync(new URL("story.json", OUT), "utf8"));
    const { _source, ...body } = file;
    expect(body).toEqual(r.b.story);
    expect(_source.what).toContain("골든이 아니다");
    expect(r.v.errors).toEqual([]);
    expect(r.v.warnings).toEqual([]);
    expect([body.sibling, body.tools_from]).toEqual([null, null]);
    expect(body.solve.entry.flip).not.toBeNull();
    const text = [...r.x.texts.values()][0]!.replace(/\s+/g, "");
    for (const q of Object.values(body.quotes) as { quote: string }[]) expect(text).toContain(q.quote.replace(/\s+/g, ""));
  });

  it("확인지 — 사람이 볼 여덟 가지가 한 장에 · 사람이 넘기기 전에는 낼 수 없다", () => {
    const r = build(CODE);
    const md = sheet(r);
    for (const h of ["## 1. 막힘", "## 2. 뒤집기가 진짜인가", "## 3. 그리지 않을 것", "## 4. 숫자", "## 5. 구절", "## 6. 함의", "## 7. 사람 칸", "## 8. 통독", "human.json"]) expect(md).toContain(h);
    expect(md).toContain("없음 (홀로 선 짧은 이야기)");
    const rv = review(r);
    if (r.human?.ok !== true) expect(rv.publishable).toBe(false);
    expect(rv.human_cells.sibling).toBeNull();
  });
});
