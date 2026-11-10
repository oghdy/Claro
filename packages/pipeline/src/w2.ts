// W-2 — 의미 대조 (D43 · FINDINGS §5.5): 사실의 글이 그 구절에서 나오는가. 명령:
//
//     pnpm --filter @claro/pipeline w2 --call --model claude-opus-5-5 [--effort medium] [--only id,id] [--limit N]   # 저장된 출력이 없는 시험 예만 모델을 부른다 → raw/ 에 한 줄씩
//     pnpm --filter @claro/pipeline w2 --call --model claude-opus-5-5 --preview   # 보기(10월 그래프의 사실 15)만 부른다
//     pnpm --filter @claro/pipeline w2                # 저장한 출력에서 report.json 을 짓는다 (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline w2 --check        # 다시 지어 파일과 글자 단위로 같은지
//     pnpm --filter @claro/pipeline w2 --show <id>    # 시험 예 하나의 모델 입력을 그대로 본다 (모델 안 부름)
//
// 두 단계 (§3.2 · P-3 와 같은 모양): ① 판정 — 사실 하나 = 부르기 한 번. 모델 출력을 그대로 저장한다. ② 짓기 — 저장한 출력과 시험 묶음에서만 돈다.
//
// 모델이 받는 것: 사실 (글 · fact_type · actor · event_at · as_of) + 근거마다 문서의 서지 · 구절 · **둘레** (코드가 원문에서 넓힌다 — widen()).
// 모델이 내는 것: verdict + issues[] (part = 글에서 글자 그대로 딴 부분 · kind · where · why). 글을 고쳐 쓰지 않는다 — 가리키기만 (게이트 3 에서 사람이 고친다).
// 코드가 다시 보는 것: part 가 글에 글자 그대로 있는가 · verdict 가 issues 에서 정해지는 값과 같은가 (derive()).
//
// 이 Step 은 **잰다** (D2). 파이프라인 명령에 잇지 않는다 (W-1) · 그래프 · 골든 · 계약을 쓰지 않는다. 읽는 것: fixtures/store*.json · 10월 store*.json (원문) · data/w2/cases.json.
// 시험 묶음의 구절은 전부 미국 연방 정부 문서(저장소에 전문이 있는 것)와 store.json 에 이미 있는 짧은 구절이다 — 권리 미확인 문서는 넣지 않았다.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { PRICE, callJson, requestSha, spentOf } from "./llm.ts";
import { numbersMissing, quantifierProblem } from "./checks.ts";
import { KINDS, SCHEMA, SYSTEM, VERDICTS, VERSION, WHERES, userMessage, type EvidenceIn, type FactIn, type Issue, type Judgement, type Verdict } from "./w2-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
export const DIR = R("packages/pipeline/data/w2");
export const STEP = "W-2";
export const BUDGET_USD = 8;
export const STOP_AT_USD = 7.5;   // 장부의 W-2 합 + 이번 부르기의 넉넉한 추정이 이 값을 넘으면 부르지 않는다
const MAX_TOKENS = 8000;
type Effort = "low" | "medium" | "high";

// ── 시험 묶음 ────────────────────────────────────────────────────────────────────────────────────────
export type CasePassage = { event: string; source_label: string; passage: string; span_start: number | null; span_end: number | null };
export type Case = {
  id: string;
  group: "RIGHT" | "WRONG" | "EDGE" | "PREVIEW";   // 맞는 예 · 틀린 예 · 경계 (정답을 매기지 않았다 — 보기만) · 보기 (10월 그래프의 사실 — 정답 없음)
  kind: string;                            // 꼴 — cases.json 의 kinds 에 뜻
  expect: "OK" | "SHORT" | "BAD" | null;   // OK 글이 구절에서 나온다 · SHORT 글은 원문과 맞지만 구절이 모자란다 · BAD 글이 넘치거나 어긋난다
  base: string | null;                     // 망가뜨린 글이면 그 바탕 예의 id (구절 · 칸이 같다)
  origin: string;                          // 어디서 왔나
  fact: FactIn;
  passages: CasePassage[];
  changed?: string[];                      // BAD — 글에서 넘치거나 어긋난 부분 (글자 그대로). 모델이 가리킨 part 와 겹치는지 본다
  note: string;
};
export type Cases = { _what: string; version: string; kinds: Record<string, string>; excluded: { what: string; why: string }[]; cases: Case[] };
export const loadCases = (): Cases => readJson<Cases>(join(DIR, "cases.json"));

// ── 원문 ─────────────────────────────────────────────────────────────────────────────────────────────
type Src = { source_id: string; label: string; title: string; publisher: string; published_at: string };
type DocInfo = Src & { text: string | null };
const EVENT_STORE: Record<string, { store: string; docs: string[] }> = {
  "FOMC-20260916": { store: R("fixtures/store.json"), docs: [R("fixtures/store.documents.json")] },
  "FOMC-20261028": { store: R("packages/pipeline/data/events/FOMC-20261028/store.json"), docs: [R("packages/pipeline/data/events/FOMC-20261028/store.documents.json"), R("fixtures/store.documents.json")] },
};
const docCache = new Map<string, Map<string, DocInfo>>();
export function docsOf(event: string): Map<string, DocInfo> {
  let m = docCache.get(event);
  if (m) return m;
  const conf = EVENT_STORE[event];
  if (!conf) throw new Error(`모르는 사건 ${event}`);
  const texts = new Map<string, string>();
  for (const p of conf.docs) for (const d of readJson<{ source_documents: { source_id: string; text: string }[] }>(p).source_documents) if (!texts.has(d.source_id)) texts.set(d.source_id, d.text);
  m = new Map(readJson<{ sources: Src[] }>(conf.store).sources.map((s) => [s.label, { source_id: s.source_id, label: s.label, title: s.title, publisher: s.publisher, published_at: s.published_at, text: texts.get(s.source_id) ?? null }]));
  docCache.set(event, m);
  return m;
}

// ── 둘레 — 구절이 든 문장 전체 + 앞 두 문장 + 뒤 한 문장 ─────────────────────────────────────────────
// 위치는 코드 포인트 단위다 (match.ts · 계약의 span 과 같다). 문장 끝 = . ? ! (+ 닫는 따옴표 · 괄호) 뒤에 공백, 그 뒤가 대문자 · 숫자 · 여는 따옴표.
// 줄임말(Mr. · U.S. · 머리글자 한 글자)은 문장 끝으로 보지 않는다.
// 줄바꿈: PDF 에서 뽑은 글은 문장 중간에서 줄이 바뀐다 → 공백으로 본다. HTML 에서 뽑은 글은 줄 = 문단 · 메뉴 항목 → 문장 끝으로 본다 (wrapped() 가 가른다).
// 그래도 너무 길면 (쌍반점으로 이은 명단 등) 구절에서 앞 CAP.before · 뒤 CAP.after 글자까지만 넓히고 … 로 표시한다.
export const WIDEN = { before: 2, after: 1, cap_before: 700, cap_after: 500 };
const ABBR = new Set(["mr", "ms", "mrs", "dr", "st", "no", "vs", "inc", "jr", "sr", "gov", "sept", "jan", "feb", "aug", "oct", "nov", "dec", "u.s", "a.m", "p.m", "e.g", "i.e", "fig"]);
const isWs = (ch: string | undefined) => ch != null && /\s/u.test(ch);
const CLOSERS = new Set(['"', "'", "”", "’", ")", "]"]);
/** PDF 처럼 문장 중간에서 줄이 바뀌는 글인가 — 길면서(60자 이상) 문장 끝 부호로 끝나지 않는 줄이 셋에 하나를 넘는다 */
export function wrapped(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return false;
  const mid = lines.filter((l) => Array.from(l).length >= 60 && !/[.?!:;"”’)\]]$/u.test(l)).length;
  return mid / lines.length > 1 / 3;
}
/** 문장이 시작하는 자리들 (코드 포인트 위치 · 오름차순 · 0 포함) */
export function sentenceStarts(cp: string[], newlineEnds: boolean): number[] {
  const starts = [0];
  for (let i = 0; i < cp.length; i++) {
    const ch = cp[i]!;
    if (ch === "\n" && newlineEnds) {
      let k = i;
      while (k < cp.length && isWs(cp[k])) k++;
      if (k < cp.length && starts[starts.length - 1] !== k) starts.push(k);
      i = k - 1;
      continue;
    }
    if (ch !== "." && ch !== "?" && ch !== "!") continue;
    let j = i + 1;
    while (j < cp.length && CLOSERS.has(cp[j]!)) j++;
    if (!isWs(cp[j])) continue;
    let k = j;
    while (k < cp.length && isWs(cp[k])) k++;
    if (k >= cp.length) break;
    if (!/[\p{Lu}0-9"'“‘(\[]/u.test(cp[k]!)) continue;
    if (ch === ".") {
      let a = i;
      while (a > 0 && !isWs(cp[a - 1]) && cp[a - 1] !== "(") a--;
      const word = cp.slice(a, i).join("").toLowerCase();
      if (ABBR.has(word) || /^\p{L}$/u.test(word)) continue;   // 줄임말 · 머리글자
    }
    if (starts[starts.length - 1] !== k) starts.push(k);
  }
  return starts;
}
const squash = (s: string) => s.replace(/\s+/gu, " ");
/** 구절(span)의 둘레. 구절은 ⟦ ⟧ 로 싼다. 공백 묶음은 공백 하나로 */
export function widen(text: string, span_start: number, span_end: number): string {
  const cp = Array.from(text);
  if (!(0 <= span_start && span_start < span_end && span_end <= cp.length)) throw new Error(`span ${span_start}–${span_end} 이 원문 밖이다`);
  const starts = sentenceStarts(cp, !wrapped(text));
  let si = 0;
  while (si + 1 < starts.length && starts[si + 1]! <= span_start) si++;
  let ei = si + 1;                                             // starts[ei] = 구절이 끝난 뒤 처음 시작하는 문장
  while (ei < starts.length && starts[ei]! < span_end) ei++;
  let from = starts[Math.max(0, si - WIDEN.before)]!;
  let to = ei + WIDEN.after < starts.length ? starts[ei + WIDEN.after]! : cp.length;
  let head = "", tail = "";
  if (span_start - from > WIDEN.cap_before) { from = span_start - WIDEN.cap_before; while (from < span_start && !isWs(cp[from - 1])) from++; head = "… "; }
  if (to - span_end > WIDEN.cap_after) { to = span_end + WIDEN.cap_after; while (to > span_end && !isWs(cp[to])) to--; tail = " …"; }
  const s = (a: number, b: number) => cp.slice(a, b).join("");
  return head + squash(`${s(from, span_start)}⟦${s(span_start, span_end)}⟧${s(span_end, to)}`).trim() + tail;
}

/** 시험 예 하나 → 모델 입력. 구절의 span 이 원문과 맞는지도 본다 (맞지 않으면 멈춘다) */
export function inputOf(c: Case): { fact: FactIn; evidence: EvidenceIn[]; user: string } {
  const evidence = c.passages.map((p) => {
    const d = docsOf(p.event).get(p.source_label);
    if (!d) throw new Error(`${c.id}: 문서 ${p.event} · ${p.source_label} 가 store 에 없다`);
    let context: string | null = null;
    if (p.span_start != null && p.span_end != null) {
      if (d.text == null) throw new Error(`${c.id}: ${p.source_label} 의 원문이 저장돼 있지 않은데 span 이 있다`);
      const got = Array.from(d.text).slice(p.span_start, p.span_end).join("");
      if (got !== p.passage) throw new Error(`${c.id}: ${p.source_label} 의 span 글이 구절과 다르다`);
      context = widen(d.text, p.span_start, p.span_end);
    }
    return { title: d.title, publisher: d.publisher, published_at: d.published_at, passage: squash(p.passage), context };
  });
  return { fact: c.fact, evidence, user: userMessage(c.fact, evidence) };
}

// ── 저장한 모델 출력 ─────────────────────────────────────────────────────────────────────────────────
export type RawLine = {
  case_id: string; model_requested: string; model: string | null; effort: string; prompt_version: string; request_sha256: string; input_sha256: string;
  stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number; called_at: string; response_id: string | null; ok: boolean; error: string | null;
  output: string | null;
};
const vtag = (v: string) => v.replace(/\//g, "-");
export const rawPath = (model: string, effort: string) => join(DIR, "raw", `${model}.${effort}.${vtag(VERSION)}.jsonl`);
export const readRaw = (model: string, effort: string): RawLine[] =>
  existsSync(rawPath(model, effort)) ? readFileSync(rawPath(model, effort), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const reqOf = (model: string, effort: Effort, user: string) => ({ model, effort, system: SYSTEM, user, schema: SCHEMA, max_tokens: MAX_TOKENS });

/** 예 하나의 저장된 출력 — 지금 프롬프트 · 지금 입력과 같은 요청에서 나온 것 가운데 마지막 */
export function storedFor(lines: RawLine[], c: Case, model: string, effort: Effort): RawLine | null {
  const want = requestSha(reqOf(model, effort, inputOf(c).user));
  let hit: RawLine | null = null;
  for (const l of lines) if (l.case_id === c.id && l.request_sha256 === want && l.ok && l.output != null) hit = l;
  return hit;
}

// ── 판정을 다시 본다 · 점수 ──────────────────────────────────────────────────────────────────────────
/** issues 에서 정해지는 verdict (CANNOT_JUDGE 는 모델만 낼 수 있다) */
export function derive(issues: { where: string }[]): Verdict {
  if (issues.some((i) => i.where === "CONFLICT")) return "CONTRADICTS";
  if (issues.some((i) => i.where === "NOWHERE")) return "EXCEEDS";
  if (issues.length) return "NEEDS_CONTEXT";
  return "ENTAILED";
}
/** 출력의 모양 문제 (없으면 빈 배열) — 값 집합 · part 가 글에 글자 그대로 · verdict = derive(issues) */
export function shapeProblems(claim: string, j: Judgement): string[] {
  const out: string[] = [];
  if (!(VERDICTS as readonly string[]).includes(j.verdict)) out.push(`verdict ${j.verdict}`);
  for (const i of j.issues) {
    if (!(KINDS as readonly string[]).includes(i.kind)) out.push(`kind ${i.kind}`);
    if (!(WHERES as readonly string[]).includes(i.where)) out.push(`where ${i.where}`);
    if (!i.part || !claim.includes(i.part)) out.push(`part 가 글에 없다: "${i.part}"`);
  }
  if (j.verdict !== "CANNOT_JUDGE" && j.verdict !== derive(j.issues)) out.push(`verdict ${j.verdict} ≠ issues 에서 정해지는 ${derive(j.issues)}`);
  return out;
}
const overlaps = (claim: string, a: string, b: string) => {
  // a · b 가 글 안에서 한 글자라도 겹치는 자리가 있는가 (둘 다 여러 번 나올 수 있다)
  const pos = (x: string) => { const r: [number, number][] = []; for (let i = claim.indexOf(x); i >= 0 && x; i = claim.indexOf(x, i + 1)) r.push([i, i + x.length]); return r; };
  return pos(a).some(([s1, e1]) => pos(b).some(([s2, e2]) => s1 < e2 && s2 < e1));
};
export type Outcome = "PASS" | "FLAG" | "BLOCK";
/** 게이트에서 어떻게 되나: PASS 그대로 간다 · FLAG 글은 맞다 — 구절을 넓혀야 · BLOCK 사람이 본다 */
export const outcomeOf = (v: Verdict): Outcome => (v === "ENTAILED" ? "PASS" : v === "NEEDS_CONTEXT" ? "FLAG" : "BLOCK");
export type Score = { verdict: Verdict; outcome: Outcome; correct: boolean; exact: boolean; pointed: boolean | null; shape: string[] };
/**
 * 맞는 예 (OK · SHORT): correct = 막지 않았다 (PASS · FLAG). exact = OK→ENTAILED · SHORT→NEEDS_CONTEXT
 * 틀린 예 SHORT (구절 부족): correct = 그대로 보내지 않았다 (FLAG · BLOCK). exact = NEEDS_CONTEXT
 * 틀린 예 BAD (넘침 · 어긋남): correct = EXCEEDS · CONTRADICTS. pointed = 가리킨 part 가 changed 와 겹친다
 */
export function score(c: Case, j: Judgement): Score {
  const v = j.verdict, outcome = outcomeOf(v), shape = shapeProblems(c.fact.claim_text, j);
  if (c.group === "RIGHT") return { verdict: v, outcome, correct: outcome !== "BLOCK", exact: c.expect === "OK" ? v === "ENTAILED" : v === "NEEDS_CONTEXT", pointed: null, shape };
  if (c.expect === "SHORT") return { verdict: v, outcome, correct: outcome !== "PASS", exact: v === "NEEDS_CONTEXT", pointed: null, shape };
  if (c.expect === "BAD") {
    const correct = v === "EXCEEDS" || v === "CONTRADICTS";
    const pointed = correct && j.issues.some((i) => i.where !== "CONTEXT" && (c.changed ?? []).some((ch) => overlaps(c.fact.claim_text, i.part, ch)));
    return { verdict: v, outcome, correct, exact: correct, pointed, shape };
  }
  return { verdict: v, outcome, correct: true, exact: true, pointed: null, shape };   // EDGE — 정답 없음
}
/** 코드 검사(P-3b 의 수량어 · 수)가 이 글을 이미 막는가 — 틀린 예에서 의미 대조와 겹치는 곳을 본다 */
export function codeCheck(c: Case): string | null {
  const ps = c.passages.map((p) => p.passage);
  const q = quantifierProblem(c.fact.claim_text, ps);
  if (q) return `수량어: ${q}`;
  const allowed = c.passages.flatMap((p) => { const d = docsOf(p.event).get(p.source_label)!; return [d.title, d.published_at]; });
  const n = numbersMissing(c.fact.claim_text, ps, allowed);
  return n.length ? `수: ${n.join(" · ")}` : null;
}

// ── 짓기 ─────────────────────────────────────────────────────────────────────────────────────────────
export type Run = { model: string; effort: Effort };
export const RUNS_FILE = join(DIR, "runs.json");   // 어느 모델 · effort 를 보고서에 넣나 (부른 순서)
export const loadRuns = (): Run[] => (existsSync(RUNS_FILE) ? readJson<{ runs: Run[] }>(RUNS_FILE).runs : []);
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)]! : 0; };
const r4 = (x: number) => Number(x.toFixed(4));

export function build() {
  const cs = loadCases();
  const runs = loadRuns();
  const perRun = runs.map((run) => {
    const lines = readRaw(run.model, run.effort);
    const rows = cs.cases.map((c) => {
      const l = storedFor(lines, c, run.model, run.effort);
      if (!l) return { id: c.id, missing: true as const, preview: c.group === "PREVIEW" };
      const j = JSON.parse(l.output!) as Judgement;
      const s = score(c, j);
      const u = l.usage as { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number };
      return { id: c.id, missing: false as const, ...s, issues: j.issues.map((i: Issue) => ({ part: i.part, kind: i.kind, where: i.where, why: i.why })), note: j.note, duration_ms: l.duration_ms, cost_usd: l.cost_usd, in_tokens: u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens, out_tokens: u.output_tokens };
    });
    const done = rows.filter((r) => !r.missing) as Extract<(typeof rows)[number], { missing: false }>[];
    const byKind: Record<string, { n: number; done: number; correct: number; exact: number; pointed: number; pass: number; flag: number; block: number; cannot_judge: number }> = {};
    for (const c of cs.cases) {
      const k = `${c.group} · ${c.kind}`;
      const b = (byKind[k] ??= { n: 0, done: 0, correct: 0, exact: 0, pointed: 0, pass: 0, flag: 0, block: 0, cannot_judge: 0 });
      b.n++;
      const r = done.find((x) => x.id === c.id);
      if (!r) continue;
      b.done++; if (r.correct) b.correct++; if (r.exact) b.exact++; if (r.pointed) b.pointed++;
      if (r.outcome === "PASS") b.pass++; else if (r.outcome === "FLAG") b.flag++; else b.block++;
      if (r.verdict === "CANNOT_JUDGE") b.cannot_judge++;
    }
    const grp = (g: string, e?: string) => cs.cases.filter((c) => c.group === g && (e == null || c.expect === e)).map((c) => done.find((r) => r.id === c.id)).filter((r) => r != null);
    const right = grp("RIGHT"), short = grp("WRONG", "SHORT"), bad = grp("WRONG", "BAD");
    const previewIds = new Set(cs.cases.filter((c) => c.group === "PREVIEW").map((c) => c.id));
    const core = done.filter((r) => !previewIds.has(r.id));
    return {
      model: run.model, effort: run.effort, prompt_version: VERSION, called: done.length, missing: rows.filter((r) => r.missing && !r.preview).map((r) => r.id),
      summary: {
        right: { n: right.length, pass: right.filter((r) => r.outcome === "PASS").length, flag: right.filter((r) => r.outcome === "FLAG").length, false_block: right.filter((r) => !r.correct).length },
        wrong_short: { n: short.length, caught: short.filter((r) => r.correct).length, exact_needs_context: short.filter((r) => r.exact).length, missed: short.filter((r) => !r.correct).length },
        wrong_bad: { n: bad.length, caught: bad.filter((r) => r.correct).length, pointed: bad.filter((r) => r.pointed).length, missed: bad.filter((r) => !r.correct).length },
        shape_problems: done.filter((r) => r.shape.length).length,
      },
      by_kind: byKind,
      missed: done.filter((r) => { const c = cs.cases.find((x) => x.id === r.id)!; return c.group === "WRONG" && !r.correct; }).map((r) => r.id),
      false_blocks: done.filter((r) => { const c = cs.cases.find((x) => x.id === r.id)!; return c.group === "RIGHT" && !r.correct; }).map((r) => r.id),
      // 비용 · 시간은 시험 묶음(보기 빼고)으로 센다 — 모델 · effort 끼리 같은 예로 견주게. 저장된 출력의 값이다 (다시 부른 것 · 실패는 장부에)
      cost: { usd: r4(core.reduce((a, r) => a + r.cost_usd, 0)), usd_per_fact: core.length ? r4(core.reduce((a, r) => a + r.cost_usd, 0) / core.length) : 0, in_tokens: core.reduce((a, r) => a + r.in_tokens, 0), out_tokens: core.reduce((a, r) => a + r.out_tokens, 0) },
      time: { total_s: Math.round(core.reduce((a, r) => a + r.duration_ms, 0) / 1000), median_s: Number((med(core.map((r) => r.duration_ms)) / 1000).toFixed(1)), max_s: Number((Math.max(0, ...core.map((r) => r.duration_ms)) / 1000).toFixed(1)) },
      preview: { n: done.length - core.length, pass: done.filter((r) => previewIds.has(r.id) && r.outcome === "PASS").length, flag: done.filter((r) => previewIds.has(r.id) && r.outcome === "FLAG").length, block: done.filter((r) => previewIds.has(r.id) && r.outcome === "BLOCK").length },
      rows,
    };
  });
  const groups: Record<string, number> = {};
  for (const c of cs.cases) groups[`${c.group} · ${c.kind}`] = (groups[`${c.group} · ${c.kind}`] ?? 0) + 1;
  return {
    _what: "W-2 의미 대조 — 시험 묶음(cases.json)에 모델을 돌린 결과. w2.ts 가 저장한 모델 출력(raw/*.jsonl)에서 짓는다 — 손으로 고치지 않는다. 판정은 모델의 것이고 점수(correct · exact · pointed)는 코드가 cases.json 의 expect · changed 와 대 본 것이다",
    prompt_version: VERSION, system_sha256: sha256(SYSTEM), cases_sha256: sha256(readFileSync(join(DIR, "cases.json"))), widen: WIDEN,
    cases: { total: cs.cases.length, by_group_kind: groups },
    code_check: Object.fromEntries(cs.cases.filter((c) => c.group === "WRONG").map((c) => [c.id, codeCheck(c)])),
    runs: perRun,
  };
}

// ── 부르기 ───────────────────────────────────────────────────────────────────────────────────────────
async function call(model: string, effort: Effort, only: string[] | null, limit: number, conc: number, preview: boolean) {
  if (!PRICE[model]) throw new Error(`가격을 모르는 모델 ${model}`);
  const cs = loadCases();
  const lines = readRaw(model, effort);
  // 보기(PREVIEW)는 --preview 를 줄 때만 부른다 — 모델 · effort 마다 다 돌릴 까닭이 없다
  const todo = cs.cases.filter((c) => (c.group === "PREVIEW") === preview && (!only || only.includes(c.id)) && !storedFor(lines, c, model, effort)).slice(0, limit);
  console.log(`W-2 · ${model} · effort ${effort} · ${VERSION} — 부를 예 ${todo.length} (묶음 ${cs.cases.length}) · 이 Step 장부 $${spentOf(STEP).toFixed(3)} / 상한 $${BUDGET_USD}`);
  mkdirSync(join(DIR, "raw"), { recursive: true });
  const runs = loadRuns();
  if (!runs.some((r) => r.model === model && r.effort === effort)) writeFileSync(RUNS_FILE, JSON.stringify({ _what: "보고서(report.json)에 넣는 모델 · effort — 처음 부른 순서. w2.ts --call 이 더한다", runs: [...runs, { model, effort }] }, null, 2) + "\n");
  let stop = false, i = 0, inflight = 0;
  // 한 번의 넉넉한 추정 — 입력 4,000 · 출력 3,000 토큰
  const est = (4000 * PRICE[model]!.in + 3000 * PRICE[model]!.out) / 1e6;
  const one = async (c: Case) => {
    const inp = inputOf(c);
    const req = reqOf(model, effort, inp.user);
    const r = await callJson({ ...req, event: "W-2", source_label: c.id, prompt_version: VERSION, text_sha256: sha256(inp.user), step: STEP });
    let ok = r.ok, error = r.error;
    if (ok) { try { JSON.parse(r.text!); } catch { ok = false; error = "출력이 JSON 이 아니다"; } }
    const line: RawLine = {
      case_id: c.id, model_requested: model, model: r.model, effort, prompt_version: VERSION, request_sha256: r.request_sha256, input_sha256: sha256(inp.user),
      stop_reason: r.stop_reason, usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(), response_id: r.response_id, ok, error, output: ok ? r.text : null,
    };
    appendFileSync(rawPath(model, effort), JSON.stringify(line) + "\n");
    const u = r.usage;
    console.log(`  ${c.id.padEnd(22)} ${ok ? (JSON.parse(r.text!) as Judgement).verdict.padEnd(14) : `실패 ${error}`} ${u ? `입력 ${u.input_tokens}+캐시 ${u.cache_read_input_tokens}/${u.cache_creation_input_tokens} · 출력 ${u.output_tokens}` : ""} · ${(r.duration_ms / 1000).toFixed(1)}초 · $${r.cost_usd.toFixed(4)}`);
    if (r.fatal) stop = true;
  };
  const worker = async () => {
    while (!stop && i < todo.length) {
      if (spentOf(STEP) + est * (inflight + 1) > STOP_AT_USD) { stop = true; console.log(`  멈춤 — 장부 $${spentOf(STEP).toFixed(3)} + 추정이 $${STOP_AT_USD} 를 넘는다`); break; }
      const c = todo[i++]!;
      inflight++;
      try { await one(c); } finally { inflight--; }
    }
  };
  await Promise.all(Array.from({ length: conc }, worker));
  console.log(`끝 — 이 Step 장부 $${spentOf(STEP).toFixed(3)}`);
}

function printReport(rep: ReturnType<typeof build>) {
  console.log(`W-2 · ${rep.prompt_version} · 시험 예 ${rep.cases.total}`);
  for (const [k, n] of Object.entries(rep.cases.by_group_kind)) console.log(`  ${k.padEnd(34)} ${n}`);
  for (const run of rep.runs) {
    const s = run.summary;
    console.log(`\n■ ${run.model} · effort ${run.effort} — 판정 ${run.called - run.preview.n}${run.preview.n ? ` + 보기 ${run.preview.n}` : ""}${run.missing.length ? ` · 출력 없음 ${run.missing.length}` : ""}`);
    console.log(`  맞는 예 ${s.right.n}: 그대로 ${s.right.pass} · 구절 짧음 표시 ${s.right.flag} · 잘못 막음 ${s.right.false_block}`);
    console.log(`  틀린 예 — 구절 부족 ${s.wrong_short.n}: 잡음 ${s.wrong_short.caught} (NEEDS_CONTEXT ${s.wrong_short.exact_needs_context}) · 놓침 ${s.wrong_short.missed}`);
    console.log(`  틀린 예 — 넘침 · 어긋남 ${s.wrong_bad.n}: 잡음 ${s.wrong_bad.caught} (그 부분을 가리킴 ${s.wrong_bad.pointed}) · 놓침 ${s.wrong_bad.missed}`);
    console.log(`  모양 문제 ${s.shape_problems} · 비용 $${run.cost.usd} (사실 하나 $${run.cost.usd_per_fact}) · 시간 합 ${run.time.total_s}초 · 중앙 ${run.time.median_s}초 · 최대 ${run.time.max_s}초`);
    for (const [k, b] of Object.entries(run.by_kind)) console.log(`    ${k.padEnd(34)} ${String(b.correct).padStart(2)}/${String(b.done).padStart(2)}  (PASS ${b.pass} · FLAG ${b.flag} · BLOCK ${b.block}${b.pointed ? ` · 가리킴 ${b.pointed}` : ""})`);
    if (run.missed.length) console.log(`  놓친 것: ${run.missed.join(" · ")}`);
    if (run.false_blocks.length) console.log(`  잘못 막은 것: ${run.false_blocks.join(" · ")}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name: string) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes("--show")) {
    const c = loadCases().cases.find((x) => x.id === opt("--show"));
    if (!c) throw new Error("그런 예가 없다");
    console.log(inputOf(c).user);
    return;
  }
  if (argv.includes("--call")) {
    const model = opt("--model");
    if (!model) throw new Error("--model 이 필요하다 (W-2 는 모델을 견주는 Step 이다 — 기본값이 없다)");
    await call(model, (opt("--effort") ?? "medium") as Effort, opt("--only")?.split(",") ?? null, Number(opt("--limit") ?? 1e9), Number(opt("--conc") ?? 4), argv.includes("--preview"));
    return;
  }
  const rep = build();
  const out = JSON.stringify(rep, null, 2) + "\n";
  const p = join(DIR, "report.json");
  if (argv.includes("--check")) {
    const same = existsSync(p) && readFileSync(p, "utf8") === out;
    console.log(same ? "W-2 --check: report.json 이 다시 지은 것과 글자 단위로 같다" : "W-2 --check: 다르다 — report.json 을 다시 지어야 한다");
    if (!same) process.exit(1);
    return;
  }
  writeFileSync(p, out);
  printReport(rep);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
