// P-S2 — 짧은 이야기 새 꼴 단계 (src/short-flow.ts · short-flow-prompt.ts). 모델을 부르지 않는다 — 줄의 목록 → 모양 · 짓기 → 계약 검증 (validateFlowStory) · 고침 얹기 · 함의 요청 (앞 덩이) · 기계 알림 · 확인지.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENTAIL_SYSTEM, type WT } from "../src/episode-prompt.ts";
import { BONE_CELLS, FLOW_ENTAIL_SYSTEM, FLOW_WRITE_SCHEMA, FLOW_WRITE_SYSTEM, ROW_KINDS, parseFlow, pathOfId, textsOfFlow, type FlowWritten } from "../src/short-flow-prompt.ts";
import { FLOW_MODELS, applyFlowRepairs, assembleFlow, beforeOf, build, entailReqFlow, exemplarFlow, flowNotices, loadFlow, repairReq, review, seams, sheet, sizeOf, validateFlow, writeReq } from "../src/short-flow.ts";
import { SHORT_MODELS } from "../src/short.ts";

const CODE = "license-notice-flow";
const wt = (t: string, src: string[] = [], voice: WT["voice"] = "none", calc: WT["calc"] = []): WT => ({ t, src, calc, voice });

describe("P-S2 — 프롬프트 · 모델 배치", () => {
  it("글 · 고치기는 Sonnet, 함의는 P-S1 그대로 Opus low — 바꾼 것은 글 모델 하나", () => {
    expect(FLOW_MODELS.write).toMatchObject({ model: "claude-sonnet-5-5", effort: SHORT_MODELS.write.effort });
    expect(FLOW_MODELS.repair.model).toBe("claude-sonnet-5-5");
    expect(FLOW_MODELS.entail).toMatchObject({ model: SHORT_MODELS.entail.model, effort: SHORT_MODELS.entail.effort });
  });

  it("프롬프트에 옛 꼴의 칸이 없고 (장면 넷 · 짚은 것 목록 칸 · 당부 칸) 쓰는 법의 뼈가 있다 — 줄기는 뉴스 · 한 문장 답 · 앞을 받는다 · 채점하지 않는다", () => {
    for (const old of ["why.real", "keep.advice", "where.unknown", "plain.title", "장면 넷"]) expect(FLOW_WRITE_SYSTEM).not.toContain(old);
    for (const must of ["줄기는 뉴스다", "그래서 무슨 일이었는데?", "문단의 첫 문장은 앞 문단의 끝을 받는다", "같은 물건을 다시 불러온다", "답을 먼저 말하지 않는다", "받는 말은 채점하지 않는다", "기관의 말로 끝내지 않는다", "숫자 뉴스", "{{EXEMPLAR}}"]) expect(FLOW_WRITE_SYSTEM).toContain(must);
    expect(BONE_CELLS.map((c) => c.k)).toEqual(expect.arrayContaining(["stems[i]", "chosen", "dropped[i]", "answer", "about", "first_thought", "breaker", "words[i]", "try", "pick", "not_drawn[i]"]));
    expect(ROW_KINDS.map((c) => c.k)).toEqual(expect.arrayContaining(["cover.ask", "p", "cite", "flip.b", "pick.1.reply", "keep.line", "word.name", "keep.whose"]));
    expect(FLOW_WRITE_SCHEMA.properties.rows.items.properties.beat.enum).toEqual(["first_thought", "breaker", "name", "land", "none"]);
  });

  it("본보기 = 손 견본 B — 근거 표시가 없고 · 받는 말의 채점하는 앞머리 (아니에요 · 맞아요)를 뗐다", () => {
    const ex = exemplarFlow();
    expect(ex).toContain("[p · first_thought] 네, 먼저 떠올려 볼게요.");
    expect(ex).toContain("[flip] “성인 3명 중 1명이 비만” ≠");
    expect(ex).not.toMatch(/\[pick\.\d\.reply\] (아니에요|맞아요)/);
    expect(ex).not.toContain("pr.trend");
    const q = writeReq(loadFlow(CODE));
    expect(q.system).toContain(ex);
    expect(q.user).toContain("p04 | #1. 자동차운전면허 정지처분을 받고");
    expect(q.user).not.toContain("아침 고르기의 추천 줄");   // 이 입력은 뒤집기 후보를 비웠다 — 문서에서 줄기를 처음부터 고른다
  });

  it("함의 프롬프트 = episode-entail/2 그대로 + 덧붙임 (앞 덩이는 읽기용 · 근거는 이 글에 붙은 것만)", () => {
    expect(FLOW_ENTAIL_SYSTEM.startsWith(ENTAIL_SYSTEM)).toBe(true);
    expect(FLOW_ENTAIL_SYSTEM).toContain("근거는 이 글에 붙은 것만 본다");
  });
});

const row = (k: string, t: string, src = "", voice = "none", beat = "none", calc = "") => ({ k, beat, t, src, calc, voice });
const BONE = [
  ["stems[0]", "가"], ["stems[1]", "나"], ["chosen", "가"], ["chosen_why", "까닭"], ["dropped[0]", "나 — 약하다"], ["answer", "결정이 통지보다 먼저여서 취소됐대."], ["about", "news"], ["about_why", "일에 대한 말"],
  ["first_thought", "억울했겠지"], ["first_thought_why", "그렇게 보기 쉽다"], ["breaker", "날짜"], ["flip", "“가” ≠ “나”"], ["flip_strength", "strong"], ["flip_basis", "여기"], ["words[0]", "사전 통지서: 필요"],
  ["try", "ㄷ씨"], ["pick", "pick"], ["pick_why", "갈린다"], ["path", "첫 생각 → …"], ["not_drawn[0]", "무엇을 했는지 — 문서에 없다"], ["unknown[0]", "무슨 일로"], ["death", "false"],
].map(([k, v]) => ({ k, v, src: k === "breaker" ? "p04" : k === "flip_basis" ? "p13, p04" : "" }));
const ROWS = [
  row("voice_official", "위원회의 판단"),
  row("cover.title", "정지가 취소된 건\n억울해서였을까"), row("cover.dek", "위원회가 정지처분을 취소했어요.", "p08 p09", "fact"), row("cover.meta", "2026년 10월 28일 발표", "p01"), row("cover.ask", "왜 취소됐죠?"),
  row("p", "네, 한번 따라가 볼게요. 취소됐다면 억울한 사정이 있었겠죠.", "", "explain", "first_thought"),
  row("p", "그런데 문서가 보여 주는 건 날짜예요.", "p04", "fact", "breaker"),
  row("cite", "2026년 8월 12일 운전면허 정지처분 사전 통지서를 발급하기도 전인 2026년 8월 10일", "p04", "fact"),
  row("p", "결정이 이틀 앞서요.", "p04", "fact", "none", "이틀: 8월 10일 → 8월 12일 = 2일"),
  row("p", "미리 알려야 해요. 이 종이를 **사전 통지서**라고 불러요.", "p10", "explain", "name"),
  row("flip.a", "“억울한 사정이 있었다”"), row("flip.op", "≠"), row("flip.b", "“순서를 어겨서 취소됐다”", "p13"), row("flip.note", "위원회는 절차를 어겼다고 봤어요.", "p13", "official"),
  row("pick.ask", "그럼 통지서를 낸 날 바로 결정했다면요?", "p05"), row("pick.1.label", "괜찮다"), row("pick.1.reply", "통지서가 나갔으니 그래 보여요. 그런데 위원회는 이것도 절차를 어겼다고 봤어요.", "p05 p13", "official"),
  row("pick.2.label", "안 된다"), row("pick.2.reply", "의견 낼 틈이 없으니 그래요. 위원회도 이것을 절차를 어겼다고 봤어요.", "p05 p13", "official"),
  row("p", "어느 쪽을 골랐어도 답은 같아요. 까닭은 순서였어요.", "p13", "explain", "land"),
  row("keep.line", "기한 전에 결정한 정지가\n순서를 어겨 취소됐다.", "p13"),
  row("word.name", "사전 통지서"), row("word.short", "처분 전에 미리 알리는 종이예요.", "p10"), row("word.body", "처분 내용과 의견제출 기한을 알려요.", "p10", "explain"),
  row("keep.whose", "여기까지는 **위원회의 판단**이에요. 무슨 일로 정지를 받았는지는 이 문서에 없어요."),
];
const sample = (): FlowWritten => parseFlow(JSON.stringify({ bone: BONE, rows: ROWS })).written;

describe("P-S2 — 줄의 목록 → 모양", () => {
  it("뼈 · 표지 · 흐름 (덩이의 차례는 줄의 차례) · 남음 — 뒤집기 넷은 한 덩이 · 고르기 다섯은 한 덩이 · 낱말은 name 마다", () => {
    const { written: w, problems } = parseFlow(JSON.stringify({ bone: BONE, rows: ROWS }));
    expect(problems).toEqual([]);
    expect(w.bone).toMatchObject({ stems: ["가", "나"], about: "news", pick: "pick", death: false, breaker_src: ["p04"], flip_basis_src: ["p13", "p04"] });
    expect(w.flow.map((b) => (b.kind === "p" ? `p:${b.beat}` : b.kind))).toEqual(["p:first_thought", "p:breaker", "cite", "p:null", "p:name", "flip", "pick", "p:land"]);
    expect(w.flow[3]).toMatchObject({ text: { calc: [{ n: "이틀", how: "8월 10일 → 8월 12일 = 2일" }] } });
    expect(w.keep.words).toEqual([{ name: "사전 통지서", short: wt("처분 전에 미리 알리는 종이예요.", ["p10"]), body: wt("처분 내용과 의견제출 기한을 알려요.", ["p10"], "explain") }]);
    expect(textsOfFlow(w).map((t) => t.id)).toEqual(expect.arrayContaining(["cover.ask", "flow[2].text", "flow[5].b", "flow[6].options[1].reply", "keep.line", "keep.words[0].body[0]", "keep.whose"]));
    expect(pathOfId("flow[6].options[1].reply")).toBe("/flow/6/options/1/reply");
  });

  it("빠진 줄 · 모르는 줄 · 틀린 값 · keep.line 뒤의 흐름 줄을 적는다", () => {
    const rows = [...ROWS.filter((r) => r.k !== "cover.ask" && r.k !== "flip.note"), row("lab.title", "체험"), row("p", "뒤늦은 문단")];
    const { problems } = parseFlow(JSON.stringify({ bone: BONE.map((b) => (b.k === "about" ? { ...b, v: "둘 다" } : b)).filter((b) => b.k !== "answer"), rows }));
    expect(problems).toEqual(expect.arrayContaining(["빈 뼈 answer", 'about: "둘 다" 는 news | concept 가 아니다', "빈 줄 cover.ask", "빈 줄 flip.note", "모르는 줄 lab.title", "흐름의 줄 p 가 keep.line 뒤에 있다 — 흐름에 넣지 않았다"]));
  });
});

describe("P-S2 — 짓기 → 계약 검증 (FlowStory · EPISODE §14)", () => {
  const x = loadFlow(CODE);

  it("validateFlowStory 통과 — form flow · 옛 꼴의 칸 없음 · 화면 말은 코드 · 구절은 글이 가리킨 것만", () => {
    const { story, notes } = assembleFlow(x, sample());
    const s = story as any;
    expect(notes).toEqual([]);
    expect([s.weight, s.form]).toEqual(["short", "flow"]);
    for (const k of ["series", "sibling", "tools_from", "scenes", "solve"]) expect(s).not.toHaveProperty(k);
    expect(s.flow[2]).toMatchObject({ kind: "cite", label: "국민권익위원회 발표문에서" });
    expect(s.flow[5].label).toBe("뒤집어 보면");
    expect(s.flow[6].options.map((o: any) => o.key)).toEqual(["o1", "o2"]);
    expect(s.flow[0]).toEqual({ kind: "p", beat: "first_thought", text: { t: "네, 한번 따라가 볼게요. 취소됐다면 억울한 사정이 있었겠죠." } });   // 근거 없는 글에는 꼬리표를 달지 않는다
    expect(Object.keys(s.quotes)).toEqual(["p01", "p04", "p05", "p08", "p09", "p10", "p13"]);
    const v = validateFlow(story, x);
    expect(v.errors).toEqual([]);
    expect(v.stats).toMatchObject({ blocks: 8, picks: 1, words: 1, beats: ["first_thought", "breaker", "name", "flip", "try", "land"] });
  });

  it("뼈의 차례 · 문서의 문장 · 숫자 · 낱말을 계약이 막는다 — 자리를 글 덩이 id 로 옮길 수 있다 (고치기로 가는 길)", () => {
    const w = sample();
    (w.flow[2] as any).text.t = "2026년 8월 12일에 통지서를 냈는데 2026년 8월 10일에";   // 구절을 고쳐 적었다
    (w.flow[3] as any).text.calc = [];
    (w.flow[3] as any).text.t = "결정이 2일 앞서요.";
    w.keep.words[0]!.name = "의견제출 기한";
    const v = validateFlow(assembleFlow(x, w).story, x);
    expect(v.errors.map((e) => `${e.code} ${e.path}`).sort()).toEqual(["CITE_VERBATIM /flow/2/text", "FLOW_WORD /keep/words/0", "NUMBER_UNGROUNDED /flow/3/text"]);
    const w2 = sample();
    w2.flow.push(w2.flow.splice(5, 1)[0]!);   // 뒤집기를 맨 끝으로
    expect(validateFlow(assembleFlow(x, w2).story, x).errors.map((e) => e.code)).toContain("FLOW_ORDER");
  });

  it("고침 얹기 — 고치기 (근거까지) → 사람 (맨 뒤 · src 를 안 적으면 근거는 그대로 · 덩이를 뺀다 · 그리지 않을 것을 갈음). 고치기의 drop 은 얹지 않고 사람에게", () => {
    const r = applyFlowRepairs(sample(), [
      { id: "keep.line", action: "fix", t: "고친 한 줄이다.", src: ["p13", "X9"], calc: [], why: "넘침", round: 1 },
      { id: "flow[3].text", action: "drop", t: "결정이 이틀 앞서요.", src: [], calc: [], why: "설 수 없다", round: 1 },
    ], { edits: [{ id: "keep.line", t: "사람의 한 줄이다.", why: "맺음" }, { id: "cover.title", t: "새 제목", why: "말맛" }, { id: "nope", t: "x", why: "y" }], drops: ["flow[2]", "cover.dek"], not_drawn: ["사람이 적은 선"] });
    expect(r.written.keep.line).toMatchObject({ t: "사람의 한 줄이다.", src: ["p13"] });
    expect(r.written.cover.title.t).toBe("새 제목");
    expect(r.written.flow.map((b) => b.kind)).toEqual(["p", "p", "p", "p", "flip", "pick", "p"]);   // cite 를 뺐다
    expect(r.written.bone.not_drawn).toEqual(["사람이 적은 선"]);
    expect([...r.touched].sort()).toEqual(["cover.title", "keep.line"]);
    expect(r.unknown).toEqual(["nope"]);
    expect(r.proposed_drops).toEqual(["flow[3].text"]);
  });

  it("함의에 앞 덩이를 같이 준다 (PS1-d) — 읽기용 두 덩이 · 받는 말은 제 가지만 · 근거는 그 글의 구절과 둘레", () => {
    const w = sample(), ts = textsOfFlow(w);
    expect(beforeOf(ts, "flow[0].text")).toEqual(["(표지 · 한 줄) 위원회가 정지처분을 취소했어요.", "(표지 · 물음 단추) 왜 취소됐죠?"]);
    expect(beforeOf(ts, "flow[3].text")[1]).toContain("(흐름 3 · 문서의 문장)");
    expect(beforeOf(ts, "flow[6].options[1].reply")).toEqual([expect.stringContaining("뒤집기의 풀이"), expect.stringContaining("(흐름 7 · 고르기)")]);   // 다른 가지의 받는 말 · 고를 것은 없다
    expect(beforeOf(ts, "flow[7].text")[1]).toContain("(흐름 7 · 받는 말 1)");
    const q = entailReqFlow(x, ts, "flow[3].text")!;
    expect(q.user).toContain("구절: #1. 자동차운전면허 정지처분을 받고");
    expect(q.user).toContain("## 앞 덩이 (읽기용 — 근거가 아니다 · 판정하지 않는다)\n- (흐름 2 (breaker)) 그런데 문서가 보여 주는 건 날짜예요.");
    expect(q).toMatchObject({ model: "claude-opus-5-5", effort: "low", version: "short-flow-entail/1" });
    expect(entailReqFlow(x, ts, "flow[0].text")).toBeNull();   // 근거 없는 말 건넴
  });
});

describe("P-S2 — 기계 알림 (쓰는 법 — 막지 않는다)", () => {
  const codes = (w: FlowWritten) => flowNotices(w).map((n) => `${n.code} ${n.where}`);
  it("깨끗한 견본에는 크기 알림뿐 (문단이 적다)", () => {
    expect(codes(sample())).toEqual(["크기 flow"]);
    expect(sizeOf(sample())).toMatchObject({ paras: 5, blocks: 8 });
  });

  it("보고서 말투 · 관청 말 · 목록 꼴 · 칸 이름 같은 머리 · 다음 칸의 이름인 단추 · 채점하는 받는 말 · 적어 준 첫 생각 · 끝에 온 뒤집기 · 당위문 한 줄 · 줄기 자리의 개념 낱말 · 뜻풀이 꼴의 뒤집기", () => {
    const w = sample();
    w.cover.ask.t = "그래서 무엇이 남나요?";
    w.cover.dek.t = "위원회가 위법·부당하다고 재결했어요.";
    (w.flow[0] as any).text.t = "취소됐다고 하면 잘못이 없었나 보다 싶어요.";
    (w.flow[1] as any).text.t = "**무엇을 봤나** — 한편 위원회에 따르면 첫째 날짜예요.";
    (w.flow[5] as any).a.t = "“통지서는 결정을 알리는 종이”";
    (w.flow[5] as any).b.t = "“통지서는 말할 틈을 여는 종이”";
    (w.flow[6] as any).options[0].reply.t = "아니에요. 위원회는 이것도 어겼다고 봤어요. 순서가 문제였어요.";   // 채점 + 가지마다 문장 수가 다르다
    w.keep.line.t = "사전 통지서는 결정보다\n먼저 와야 한다.";
    const got = codes(w);
    for (const c of ["단추 cover.ask", "말투 cover.dek", "뼈 flow[0].text", "머리 flow[1].text", "말투 flow[1].text", "줄기 flow[5]", "고르기 flow[6].options[0].reply", "고르기 flow[6]", "맺음 keep.line", "줄기 keep.line"]) expect(got).toContain(c);
    const tail = sample();
    tail.flow.splice(6, 1);   // 고르기를 빼면 뒤집기 뒤에 내려앉기 하나뿐이다
    expect(flowNotices(tail).some((n) => n.code === "뼈" && /뒤집기 뒤에 덩이가/.test(n.message))).toBe(true);
  });

  it("이음매 — 앞 덩이의 끝 문장과 받는 첫 문장을 짝지어 뽑는다 (받는지는 사람이 본다)", () => {
    const s = seams(sample());
    expect(s[0]).toEqual(["(단추) 왜 취소됐죠?", "네, 한번 따라가 볼게요."]);
    expect(s[1]).toEqual(["취소됐다면 억울한 사정이 있었겠죠.", "그런데 문서가 보여 주는 건 날짜예요."]);
    expect(s.at(-1)![1]).toContain("(남는 한 줄)");
  });
});

// 실물 — 파이프라인이 새 꼴로 낸 첫 짧은 이야기 (모델 출력이 저장돼 있을 때만)
const OUT = new URL(`../data/events/ACRC-20261028-LICENSE-NOTICE/shorts/${CODE}/`, import.meta.url);
describe.runIf(existsSync(new URL("story.json", OUT)))("P-S2 — 실물 (license-notice-flow)", () => {
  it("저장한 출력에서 다시 지으면 story.json 과 같다 · validateFlowStory 통과 · 글 모델은 Sonnet · 구절이 전부 git 의 문서에 그대로 · 옛 이야기와 같은 사건 · 다른 code", () => {
    const r = build(CODE);
    const file = JSON.parse(readFileSync(new URL("story.json", OUT), "utf8"));
    const { _source, ...body } = file;
    expect(body).toEqual(r.b.story);
    expect(_source.what).toContain("골든이 아니다");
    expect(r.v.errors).toEqual([]);
    expect(r.lw.raw.model).toContain("sonnet");
    expect(r.lw.problems).toEqual([]);
    expect([body.form, body.code]).toEqual(["flow", CODE]);
    const old = JSON.parse(readFileSync(new URL("../license-notice/story.json", OUT), "utf8"));
    expect(body.event_ref).toBe(old.event_ref);
    expect(body.episode_id).not.toBe(old.episode_id);
    const text = [...r.x.texts.values()][0]!.replace(/\s+/g, "");
    for (const q of Object.values(body.quotes) as { quote: string }[]) expect(text).toContain(q.quote.replace(/\s+/g, ""));
  });

  it("확인지 — 뼈 · 무엇에 대한 이야기인가 · 통독 · 이음매 · 뒤집기 · 그리지 않을 것 · 숫자 · 구절 · 함의 · 알림 · 사망. 사람이 넘기기 전에는 낼 수 없다", () => {
    const r = build(CODE);
    const md = sheet(r);
    for (const h of ["## 1. 막힘", "## 2. 뼈", "## 3. 이 이야기는 무엇에 대한 것인가 — 뉴스인가 개념인가", "그래서 무슨 일이었는데?", "## 4. 통독", "### 이음매", "## 5. 뒤집기가 진짜인가", "## 6. 고르기", "## 7. 그리지 않을 것", "## 8. 숫자", "## 9. 구절", "## 10. 함의", "## 11. 기계 알림", "## 12. 사망", "death_checked", "stem_ok", "flow_ok"]) expect(md).toContain(h);
    const rv = review(r);
    if (r.human?.ok !== true) expect(rv.publishable).toBe(false);
    expect(rv.entail.not_judged).toEqual([]);
    expect(repairReq(r)).toBeNull();   // 걸린 덩이가 없다
  });
});
