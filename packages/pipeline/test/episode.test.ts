import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMMON, GOLD_PATH, assemble, carryPairs, applyGate1, applyRepairs, dateLine, findEpisode, gate1Problem, graphProblem, humanRepairs, load, needsEntail, needsEntail2, previousBlock, riskOf, scoreGold, seatsStand, tasteChecks, textsOf, type Gold } from "../src/episode.ts";
import { CURRENT, DESIGN_SCHEMA, DESIGN_SYSTEM, ENTAIL_SYSTEM, ENTAIL_SYSTEM_V1, REPAIR_SYSTEM, WRITE_SCHEMA, deriveVerdict, entailSystem, fromCells, parseDesign, parseWritten, template, writeSystem, DESIGN_SPEC, WRITE_SPEC } from "../src/episode-prompt.ts";
import { sha256 } from "../src/extract.ts";

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

// ─────────────────────────────────────────────────────────────────────────────────────────────── P-E2
const emptyDesign = () => parseDesign(JSON.stringify({ cells: [
  { k: "flips[0].a", v: "가" }, { k: "flips[0].op", v: "≠" }, { k: "flips[0].b", v: "나" }, { k: "flips[1].a", v: "다" }, { k: "chosen_flip", v: "0" },
  { k: "chain.has", v: "true" }, { k: "seats.has", v: "true" }, { k: "seats.split_proposal", v: "official-dissent" }, { k: "seats.record_facts", v: "F001" },
  { k: "seats.sides[0].id", v: "wait" }, { k: "seats.sides[0].why", v: "in-doc" }, { k: "seats.sides[0].said_facts", v: "F002" },
  { k: "seats.sides[1].id", v: "raise" }, { k: "seats.sides[1].why", v: "not-yet" }, { k: "seats.sides[1].said_facts", v: "F013" },
  { k: "frames", v: "chain" },
] })).design;

describe("P-E2 — 회차는 회차 code 로 찾는다 (한 사건에 회차 둘)", () => {
  it("2화 (얼림) · 3화가 같은 사건을 가리킨다 · 사건 code 를 주면 회차 목록을 보이고 멈춘다", () => {
    expect(findEpisode("fomc-auto").entry).toMatchObject({ event: "FOMC-20261028", number: 2, dir: "episode" });
    expect(findEpisode("rate-3").entry).toMatchObject({ event: "FOMC-20261028", number: 3, previous: "fixtures/episode-rate-2.json", new_documents: ["MIN-10"] });
    expect(() => findEpisode("FOMC-20261028")).toThrow(/회차 code 를 준다: .*fomc-auto.*rate-3/);
    expect(() => findEpisode("없는-회차")).toThrow(/없다/);
  });
  it("얼린 회차는 판 /1 에 못 박혀 있다 · 그 함의 프롬프트는 한 글자도 바뀌지 않았다 (저장한 판정의 요청 지문)", () => {
    const x = load("fomc-auto");
    expect(x.versions).toEqual({ design: "episode-design/1", write: "episode-write/1", entail: "episode-entail/1", repair: "episode-repair/1" });
    expect(x.v1).toBe(true);
    expect(entailSystem("episode-entail/1")).toBe(ENTAIL_SYSTEM_V1);
    expect(sha256(ENTAIL_SYSTEM_V1)).toBe("47612328c6d29b13d3b45197a62c92ca51aa0f26f15ce9c827d35e1d7a432759");
    expect(load("rate-2b").versions).toEqual(CURRENT);
  });
  it("3화는 지난 회차 (손 2화)를 읽는다 — 시리즈 줄 · 주운 도구 · 그림 · 약속. 프롬프트 (system)에는 그 글이 없다", () => {
    const x = load("rate-3");
    expect(x.prev?.code).toBe("fomc");
    expect(x.ep.prior_tools.map((t) => t.name)).toEqual(golden.tools.map((t: { name: string }) => t.name));
    const block = previousBlock(x.prev!);
    expect(block).toContain("그림 rate-brake");
    expect(block).toContain("그림 fomc-seats");
    expect(block).toContain("까닭 not-yet");
    expect(block).toContain(golden.scenes.next.coming[0].head);
    expect([DESIGN_SYSTEM, writeSystem("(본보기 자리)")].some((p) => p.includes(golden.solve.lab.frames[0].caption.after.t))).toBe(false);
  });
  it("새 문서가 있는 회차는 다시 돌린 그래프를 사람이 봤어야 설계를 부른다", () => {
    const x = load("rate-3");
    expect(graphProblem(x, null)).toMatch(/MIN-10 의 사실이 그래프에 없다|graph_seen/);
    expect(graphProblem(load("rate-2b"), null)).toBeNull();
    const like = load("rate-3", { like: "MIN-09" });
    expect(like.graph.facts.some((f) => like.isNew(f.label))).toBe(true);
  });
});

describe("P-E2 — 사람 게이트", () => {
  it("게이트 1 — 적은 칸만 설계의 제안을 덮는다", () => {
    const d = emptyDesign();
    expect(applyGate1(d, undefined)).toEqual({ design: d, changed: [] });
    const on = applyGate1(d, { by: "편집자", ok: true, frames: ["seats", "chain"] });
    expect(on.design.frames).toEqual(["chain", "seats"]);
    expect(on.changed).toEqual(["틀 [chain] → [chain, seats]"]);
    expect(applyGate1(d, { by: "", flip: { pick: -1 } }).design).toMatchObject({ chosen_flip: -1, frames: [] });
    expect(applyGate1(d, { by: "", frames: ["chain", "seats"], split: "party-vote" }).design.frames).toEqual(["chain"]);
    expect(applyGate1(d, { by: "", sides: { raise: "in-doc" } }).design.seats.sides[1]!.why).toBe("in-doc");
    expect(applyGate1(d, { by: "", death: true }).design).toMatchObject({ death_proposal: true, frames: [] });
    expect(() => applyGate1(d, { by: "", sides: { none: "in-doc" } })).toThrow(/설계에 없다/);
    expect(() => applyGate1(d, { by: "", flip: { pick: 5 } })).toThrow(/없다/);
  });
  it("게이트 1 을 넘기지 않으면 글을 쓰지 않는다 (/2) · 얼린 /1 은 옛 모양 그대로", () => {
    const x = load("rate-2b");
    expect(gate1Problem(x, null)).toMatch(/after_design 이 없다/);
    expect(gate1Problem(x, { after_design: { by: "편집자" } })).toMatch(/ok 가 true 가 아니다/);
    expect(gate1Problem(x, { after_design: { by: "편집자", ok: true } })).toBeNull();
    expect(gate1Problem(load("fomc-auto"), null)).toBeNull();
  });
  it("게이트 2 — 사람의 고침은 고치기 줄의 꼴로 얹힌다", () => {
    expect(humanRepairs({ after_write: { by: "편집자", edits: [{ id: "aha.verdict", t: "고친 글", why: "맛" }], drops: ["event.riddle[1]"] } }).map((r) => [r.id, r.action, r.round])).toEqual([["aha.verdict", "fix", 0], ["event.riddle[1]", "drop", 0]]);
    expect(humanRepairs(null)).toEqual([]);
  });
  it("자리 틀의 조건 둘 — 까닭이 아직 없는 쪽 (not-yet)이 있어도 선다 (D62 ②)", () => {
    const d = emptyDesign();
    expect(seatsStand(d, () => true)).toBe(true);
    expect(seatsStand(d, (l) => l !== "F013")).toBe(false);
    expect(seatsStand({ ...d, seats: { ...d.seats, split_proposal: "party-vote" } }, () => true)).toBe(false);
  });
});

describe("P-E2 — 함의: 위험한 글 · 갈래 · 정답 묶음", () => {
  const gold = JSON.parse(readFileSync(GOLD_PATH, "utf8")) as Gold;
  const wt = (c: Gold["cases"][number]) => ({ t: c.t, src: c.src, calc: c.calc, voice: c.voice });
  it("P-E1 의 걸림 17 이 전부 위험한 글 규칙에 걸린다", () => {
    const flagged = gold.cases.filter((c) => c.origin.startsWith("P-E1 첫 판정 EXCEEDS"));
    expect(flagged).toHaveLength(17);
    expect(flagged.filter((c) => !needsEntail2(wt(c))).map((c) => c.id)).toEqual([]);
  });
  it("규칙 — 숫자 · 한글 수 · 기관의 판단 · 문서의 일 · 인과 · 고친 글", () => {
    const t = (s: string, voice: "fact" | "official" | "explain" | "none" = "fact") => ({ t: s, src: ["F001"], calc: [], voice });
    expect(riskOf(t("표결은 10 대 2였어요."))).toEqual(["숫자"]);
    expect(riskOf(t("열 명과 두 명이 갈렸어요.", "explain"))).toEqual(["한글 수"]);
    expect(riskOf(t("경제가 강한 속도로 커지고 있다", "official"))).toEqual(["기관의 판단"]);
    expect(riskOf(t("성명문에 그렇게 적혔어요.", "explain"))).toEqual(["문서의 일"]);
    expect(riskOf(t("물가가 높기 때문이에요."))).toEqual(["인과"]);
    expect(riskOf(t("물가는 여전히 높아요."))).toEqual([]);
    expect(riskOf(t("물가는 여전히 높아요."), true)).toEqual(["고친 글"]);
    expect(needsEntail2(t("일자리와 실업률 문장은 두 글에서 같아요."))).toBe(false);
    expect(needsEntail2({ ...t("표결은 10 대 2였어요."), src: [] })).toBe(false);
  });
  it("갈래 — 넘침 (NOWHERE) 이 별개의 내용 (OTHER) 을 이긴다 · /1 의 판정에도 같은 값", () => {
    expect(deriveVerdict([])).toBe("ENTAILED");
    expect(deriveVerdict([{ where: "CONTEXT" }])).toBe("NEEDS_CONTEXT");
    expect(deriveVerdict([{ where: "OTHER" }, { where: "CONTEXT" }])).toBe("UNDER_SOURCED");
    expect(deriveVerdict([{ where: "OTHER" }, { where: "NOWHERE" }])).toBe("EXCEEDS");
    expect(deriveVerdict([{ where: "NOWHERE" }, { where: "CONFLICT" }])).toBe("CONTRADICTS");
    expect(ENTAIL_SYSTEM).toContain("UNDER_SOURCED");
    expect(ENTAIL_SYSTEM_V1).not.toContain("UNDER_SOURCED");
  });
  it("정답 묶음 — 예 20 ~ 35 · 가리킬 부분은 글에 글자 그대로 · 근거 사실에 실을 수 있는 구절이 있다", () => {
    expect(gold.cases.length).toBeGreaterThanOrEqual(20);
    expect(gold.cases.length).toBeLessThanOrEqual(35);
    expect(new Set(gold.cases.map((c) => c.id)).size).toBe(gold.cases.length);
    const x = load(gold.load_as);
    for (const c of gold.cases) {
      for (const p of c.parts ?? []) expect(c.t).toContain(p.part);
      expect(c.src.some((l) => x.passages.has(l))).toBe(true);
      if (c.expect === "ENTAILED" || c.expect === "NEEDS_CONTEXT") expect((c.parts ?? []).some((p) => p.where === "NOWHERE" || p.where === "OTHER")).toBe(false);
      if (c.expect === "UNDER_SOURCED") expect((c.parts ?? []).every((p) => p.where === "OTHER")).toBe(true);
      if (c.expect === "EXCEEDS") expect((c.parts ?? []).some((p) => p.where === "NOWHERE")).toBe(true);
    }
    for (const v of ["ENTAILED", "NEEDS_CONTEXT", "UNDER_SOURCED", "EXCEEDS"]) expect(gold.cases.filter((c) => c.expect === v).length).toBeGreaterThanOrEqual(5);
  });
  it("정답과 대기 — 맞음 · 갈래만 다름 · 잘못 막음 · 놓침. 경계는 세지 않는다", () => {
    const cs = [
      { id: "a", expect: "EXCEEDS" }, { id: "b", expect: "UNDER_SOURCED" }, { id: "c", expect: "ENTAILED", accept: ["NEEDS_CONTEXT"] }, { id: "d", expect: "ENTAILED" }, { id: "e", expect: "EXCEEDS" }, { id: "f", expect: "EXCEEDS", borderline: true },
    ].map((c) => ({ origin: "", t: "", voice: "fact" as const, calc: [], src: [], why: "", ...c })) as Gold["cases"];
    const sc = scoreGold(cs, new Map([["a", "EXCEEDS"], ["b", "EXCEEDS"], ["c", "NEEDS_CONTEXT"], ["d", "EXCEEDS"], ["e", "ENTAILED"], ["f", "ENTAILED"]]));
    expect(sc).toMatchObject({ total: 5, 맞음: 2, "갈래만 다름": 1, "잘못 막음": 1, 놓침: 1 });
  });
});

describe("P-E2 — 맛을 기계가 센다 (글 프롬프트 /2 의 규칙)", () => {
  it("세 문장을 넘는 덩이 · 세 자리 이상에 되풀이되는 문장 · 발행일에 걸린 말 · “없어요”로 끝나는 맺음", () => {
    const T = (id: string, t: string) => ({ id, wt: { t, src: [], calc: [], voice: "explain" as const } });
    const same = "의장은 그동안 써 온 처방이 조금 듣기 시작했지만 확고한 결론은 없다고 전했어요.";
    const out = tasteChecks({ texts: [T("a", `하나예요. 둘이에요. 셋이에요. 넷이에요.`), T("b", same), T("c", `${same} 그래요.`), T("d", `먼저요. ${same}`), T("e", "지난달에 올렸어요."), T("aha.verdict", "그런 말은 문서에 없어요.")] });
    expect(out.join("\n")).toMatch(/세 문장을 넘는 덩이 1: a \(4\)/);
    expect(out.join("\n")).toMatch(/같은 문장이 세 자리 이상에/);
    expect(out.join("\n")).toMatch(/발행일에 걸린 말 1: e/);
    expect(out.join("\n")).toMatch(/맺음이 “없어요”로 끝난다: aha.verdict/);
    expect(tasteChecks({ texts: [T("a", "하나예요. 둘이에요.")] })).toEqual([]);
  });
  it("P-E1 의 글 (판 /1)에서 세면 — 되풀이와 긴 덩이가 잡힌다 (logs/pipeline/P-E1.md ③ 의 관찰을 기계가 본다)", () => {
    const wr = JSON.parse(readFileSync(new URL("../data/events/FOMC-20261028/episode/raw/write.claude-fable-5-2.44b1c69ceec7.json", import.meta.url), "utf8"));
    const out = tasteChecks({ texts: textsOf(parseWritten(wr.output, ["chain", "seats"], "three")) }).join("\n");
    expect(out).toMatch(/같은 문장이 세 자리 이상에/);
    expect(out).toMatch(/세 문장을 넘는 덩이/);
  });
});

describe("P-E2 — 이어 쓰기: 같은 그림 · 오늘의 값만 (3화의 짓기 길을 돈 안 들이고 본다)", () => {
  // 설계 · 글은 P-E1 (2화 · 판 /1)의 저장한 출력을 빌린다 — 글의 내용은 2화다. 보는 것은 지난 회차 (손 2화)에서 **코드가 받는 것**뿐이다
  const raw = (n: string) => JSON.parse(readFileSync(new URL(`../data/events/FOMC-20261028/episode/raw/${n}`, import.meta.url), "utf8")).output as string;
  const d = parseDesign(raw("design.4a53bd50a449.json")).design;
  d.frames = ["chain", "seats"];
  d.chain.nodes[1]!.id = "cond"; d.chain.nodes[2]!.id = "infl"; d.seats.sides[0]!.id = "wait";
  const w = parseWritten(raw("write.claude-fable-5-2.44b1c69ceec7.json"), d.frames, d.plain_kind);
  w.lab!.chain!.nodes[1]!.id = "cond"; w.lab!.chain!.nodes[2]!.id = "infl"; w.lab!.seats!.sides[0]!.id = "wait"; w.lab!.seen_title = "그 그림에\n오늘의 값이 들어왔어요";
  const x = load("rate-3", { like: "MIN-09" });
  const b = assemble(x, d, w);
  const e = b.episode as any;
  it("시리즈 줄 — 지난 회차의 줄을 받고 지난 화가 지나간 화가 된다 · 그 근거 구절도 함께 온다", () => {
    expect(e.number).toBe(3);
    expect(e.track.map((t: any) => `${t.no.t}:${t.state}`)).toEqual(["0화:past", "1화:past", "2화:past", "3화:now", "다음 화:next"]);
    expect(e.track[2].title.t).toBe(golden.track[2].title.t);
    expect(e.quotes["omo.2023"]).toEqual(golden.quotes["omo.2023"]);
    expect(e._source.previous).toBe("fomc");
  });
  it("그림 — 이름 (picture.id)과 그림의 말 (고리 이름 · 누를 행동 뒤의 물음 · 고르는 말)은 지난 회차의 것 · 값은 오늘의 것", () => {
    const [chain, seats] = e.solve.lab.frames;
    expect([chain.picture.id, seats.picture.id]).toEqual(["rate-brake", "fomc-seats"]);
    expect(chain.nodes.map((n: any) => n.name)).toEqual(golden.solve.lab.frames[0].nodes.map((n: any) => n.name));
    expect(chain.unknown).toBe(golden.solve.lab.frames[0].unknown);
    expect(seats.sides.map((sd: any) => sd.choose)).toEqual(golden.solve.lab.frames[1].sides.map((sd: any) => sd.choose));
    expect(chain.nodes[1].after.t).not.toBe(golden.solve.lab.frames[0].nodes[1].after.t);
    expect(e.solve.lab.seen_title).toBe("그 그림에\n오늘의 값이 들어왔어요");
    expect(b.notes.some((n) => n.includes("그림의 말을 지난 회차에서 받았다"))).toBe(true);
  });
  it("지도 — 지난 회차에 있던 도구는 그 자리 그대로 · 지난 값 ↔ 오늘 값은 회차 밖 (review)에 나란히", () => {
    expect(e.map.at.rate).toEqual(golden.map.at.rate);
    expect(e.map.at.conditions).toEqual(golden.map.at.conditions);
    const pairs = carryPairs(x, d, b.episode);
    expect(pairs.map((p) => p.where)).toEqual(["chain.rate", "chain.cond", "chain.infl", "seats.wait", "seats.raise"]);
    expect(pairs[4]!.before).toContain("not-yet");
  });
  it("설계가 그림을 바꾸자고 하면 (carry.has · keep false) 받지 않는다", () => {
    const d2 = { ...d, carry: { ...d.carry, has: true, keep: false } };
    expect((assemble(x, d2, w).episode as any).solve.lab.frames[0].picture.id).toBe(d.chain.picture_id);
  });
});
