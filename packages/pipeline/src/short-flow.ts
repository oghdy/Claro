// P-S2 — 파이프라인이 짧은 이야기를 **새 꼴**로 쓴다 (D95 · D98 · D99 ② · D100). 발표 하나의 1차 문서에서 FlowStory (docs/contract/EPISODE.md §14 — 표지 + 한 흐름)를 짓는다.
// 옛 길 (short.ts · short-prompt.ts — 장면 넷 · ShortStory)은 **한 글자도 고치지 않았다** — 실제 주소에 떠 있다 (옛 꼴은 D99 ④ 에서 내린다). 이 파일은 옛 길에서 원문 읽기 · 구절 토막만 불러 쓴다 (load · passagesOf).
// 다른 파이프라인 파일 (episode*.ts · llm.ts · p3.ts · w2.ts · extract.ts)도 불러 쓰기만 한다.
//
//     pnpm --filter @claro/pipeline short-flow <code> --count                                # 글 요청의 입력 토큰 · 값 어림 (count_tokens · 값 0)
//     pnpm --filter @claro/pipeline short-flow <code> --write-call  --step S --budget USD     # A 뼈 + 글 (Sonnet · 한 번 부르기에 두 걸음) → raw/write.*.json
//     pnpm --filter @claro/pipeline short-flow <code> --entail-call --step S --budget USD     # B 함의 (Opus low · 위험한 글만 · **앞 덩이를 같이 준다** · 저장된 판정이 없는 것만) → raw/entail.*.jsonl
//     pnpm --filter @claro/pipeline short-flow <code> --repair-call --step S --budget USD     # C 걸린 덩이만 고치기 (Sonnet · 앞뒤 덩이를 보며) → raw/repair.*.json (그 뒤 --entail-call 을 한 번 더)
//     pnpm --filter @claro/pipeline short-flow <code>                                         # 짓기 — 저장한 출력에서 story.json · review.json (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline short-flow <code> --check                                 # 다시 지어 파일과 글자 단위로 같은지
//     pnpm --filter @claro/pipeline short-flow <code> --sheet                                 # 사람 확인지 sheet.md
//     pnpm --filter @claro/pipeline short-flow <code> --read                                  # 통독 — 독자가 읽는 차례대로 (가지는 둘 다)
//       (모델을 부르는 것은 --step S --budget USD 가 있어야 한다. 기본은 배치 (값이 반) · --now 는 즉시)
//
// 사람 입력   data/shorts/<code>.json — 어느 사건 · 어느 문서 · 문서의 문장에 붙일 이름표 · 고르기에서 온 한마디 · (견줌용 · 없어도 된다) 글 모델 write_model (P-S2f). 선반 · 곁 이야기 · 가리킬 도구는 없다 (새 꼴에 칸이 없다 — EPISODE §14.7)
// 출력        data/events/<사건>/shorts/<code>/ — raw/ (모델 출력) · story.json (FlowStory) · review.json · sheet.md · human.json (사람이 적는다 — 이 파일은 읽기만)
// 무엇이 어디서 오나
//   구절 (quotes)                         코드 — 저장된 문서를 끊은 토막 (short.ts passagesOf). 모델이 구절을 쓰지 않는다
//   뼈 (줄기 후보 · 고른 하나 · "그래서 무슨 일이었는데?" · 첫 생각 · 깨는 구절 · 낱말 · 써 볼 자리 · 그리지 않을 것) · 표지 · 흐름 (덩이의 수 · 종류 · 차례 · 글) · 남음     A 출력 (모델)
//   episode_id · docs · 화면 말 (뒤집어 보면 · ○○ 발표문에서 · 이 이야기의 한 줄 · 이 이야기에서 만난 낱말) · 고를 것 · 낱말의 key     코드 · 사람 입력
//   줄기는 뉴스인가 · 술술 읽히나 · 뒤집기가 진짜인가 · 그리지 않을 것 · 사망     **사람** — 확인지에 올린다. human.json 에 적기 전에는 "낼 수 있나 = false"
// 검사 (겹): 계약 검증 (validateFlowStory — 구절 · 숫자 · 뼈의 차례 · 뒤집기 · 고르기 · 낱말) → 함의 (B) → 고치기 (C) → 다시 → 기계 알림 (쓰는 법 — 막지 않는다) → 사람
// 자동 발행은 없다. 이 파일은 실제 주소 · apps/web 을 건드리지 않는다.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMON, needsEntail2, riskOf } from "./episode.ts";
import { ENTAIL2_SCHEMA, deriveVerdict, entailUser, type EVerdict, type Repair, type WT } from "./episode-prompt.ts";
import { sha256 } from "./extract.ts";
import { PRICE, callMany, countTokens, modeArg, needBudget, requestSha, spentOf, type Budget, type CallReq, type Effort, type Mode, type Req } from "./llm.ts";
import { uuidFrom } from "./p3.ts";
import {
  FLOW_ENTAIL_SYSTEM, FLOW_ENTAIL_VERSION, FLOW_REPAIR_SCHEMA, FLOW_REPAIR_SYSTEM, FLOW_REPAIR_VERSION, FLOW_WRITE_SCHEMA, FLOW_WRITE_VERSION,
  flowEntailUser, flowWriteSystem, flowWriteUser, parseFlow, pathOfId, textsOfFlow, type FlowText, type FlowWritten,
} from "./short-flow-prompt.ts";
import { DATED, load, type Issue } from "./short.ts";
import { widen } from "./w2.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const oneLine = (s: string) => s.replace(/\s+/gu, " ").trim();

// 모델 배치 (D2 — 단계마다). **독자가 읽는 글을 내는 단계 (뼈 + 글 · 고치기)는 Sonnet** (D98 — 도윤이 눈 가리고 고른 B 가 Sonnet). 함의는 P-S1 그대로 Opus low — 바꾸는 것은 글 모델 하나다 (견줌이 흐려지지 않게).
// effort 는 P-S1 의 글 · 고치기와 같은 medium — 모델만 바뀌어야 전 · 후를 모델 탓으로 읽을 수 있다. 값도 싸다 (Sonnet 출력 10 달러 / 100만 — Fable 의 1/4)
export const FLOW_MODELS = {
  write: { model: "claude-sonnet-5-5", effort: "medium" as Effort, max_tokens: 24000 },
  entail: { model: "claude-opus-5-5", effort: "low" as Effort, max_tokens: 6000 },
  repair: { model: "claude-sonnet-5-5", effort: "medium" as Effort, max_tokens: 12000 },
};
// 화면 말 — 손 견본 (골든 다섯째)과 글자가 같게 (EPISODE §14.5 · E-34)
export const FLOW_COMMON = { flip_label: COMMON.flip_label, line_label: "이 이야기의 한 줄", words_label: "이 이야기에서 만난 낱말", voice_fact: COMMON.voice_fact, voice_explain: COMMON.voice_explain };
// 크기 — 쓰는 법이다 (UX-8 ⑥ 12 · EPISODE §14.8). 계약 불변식이 아니다 — 넘으면 알림만
export const FLOW_SIZE = { paras: [6, 11], sentences: 5, sentence_chars: 70, path_chars: 1100, words: [1, 2] } as const;

// ── 사람 입력 ────────────────────────────────────────────────────────────────────────────────────────
export type FlowInput = {
  code: string; event: string;
  pick: { date: string; id: string; flip_hint: string };   // S-2 아침 한 장의 어느 줄에서 왔나 · 그 줄의 뒤집기 후보 (신호일 뿐 — 비우면 문서에서 줄기를 처음부터 고른다)
  docs: Record<string, { name: string }>;                   // 근거로 쓸 문서 (사건 소스 팩의 label) → 독자에게 보일 이름. git 에 전문이 있는 문서만
  cite_label: string;                                       // 문서의 문장 (cite) 위에 붙는 이름표 — "○○ 발표문에서"
  human_note?: string;                                      // 글 단계에 전할 말 (없어도 된다)
  write_model?: string;                                     // P-S2f — 글 모델을 이 이야기만 바꾼다 (견줌용 · 없으면 FLOW_MODELS 그대로). 고치기도 따라간다 — writeModelOf
};
export function loadFlow(code: string) {
  const x = load(code);   // 원문 · 구절 토막 · 사건 — 옛 길의 것 그대로 (short.ts). 입력의 code · event · docs 만 읽는다
  const input = x.input as unknown as FlowInput;
  if (!input.cite_label) throw new Error(`짧은 이야기 ${code} — 입력에 cite_label ("○○ 발표문에서")이 없다`);
  writeModelOf(input);   // 모르는 모델이면 여기서 멈춘다 (부르기 전에)
  return { ...x, input };
}
export type L = ReturnType<typeof loadFlow>;
/** P-S2f — 글 · 고치기 모델. 입력에 `write_model` 이 없으면 FLOW_MODELS 그대로 (기본 동작 · 요청 지문이 바뀌지 않는다).
 *  있으면 글과 고치기가 함께 그 모델로 — 고친 글은 글 사이에 끼워지는 독자 글이라 한 편 안에서 결이 섞이지 않게 (P-S2 ③ 이 고치기를 글과 같은 Sonnet 으로 둔 까닭과 같다).
 *  effort · max_tokens · 함의 (Opus low)는 그대로 — 바꾸는 것은 모델 하나다 (견줌이 흐려지지 않게) */
export function writeModelOf(input: Pick<FlowInput, "write_model">): { write: string; repair: string } {
  const m = input.write_model;
  if (m === undefined) return { write: FLOW_MODELS.write.model, repair: FLOW_MODELS.repair.model };
  if (!PRICE[m]) throw new Error(`write_model ${m} — 가격을 모르는 모델이다 (llm.ts PRICE: ${Object.keys(PRICE).join(" · ")})`);
  return { write: m, repair: m };
}

/** 글 단계의 본보기 — 손으로 쓴 짧은 이야기 B (골든 다섯째 — 숫자 뉴스 · 다른 사건). 흐름 · 이음매 · 말결을 보인다. 근거 표시는 뺀다.
 *  고르기의 받는 말 앞머리 ("아니에요." · "맞아요.")는 뗀다 — 쓰는 법 10 과 어긋난 자리다 (D100 B-E4-a) */
export function exemplarFlow(): string {
  const g = readJson<Record<string, any>>(R("fixtures/episode-short-obesity-who.json"));
  const one = (s: string) => s.replace(/\n/g, " / ");
  const L: string[] = [`[표지 · 제목] ${one(g.cover.title.t)}`, `[표지 · 한 줄] ${g.cover.dek.t}`, `[표지 · 날] ${g.cover.meta.t}`, `[표지 · 물음 단추] ${g.cover.ask.t}`, "— 단추를 누르면 —"];
  for (const b of g.flow as any[]) {
    if (b.kind === "p") L.push(`[p${b.beat ? ` · ${b.beat}` : ""}] ${b.text.t}`);
    else if (b.kind === "cite") L.push(`[cite] ${b.text.t}`);
    else if (b.kind === "flip") L.push(`[flip] ${b.a.t} ${b.op} ${b.b.t}`, `[flip.note] ${b.note.t}`);
    else L.push(`[pick.ask] ${b.ask.t}`, ...b.options.flatMap((o: any, i: number) => [`[pick.${i + 1}.label] ${o.label.t}`, `[pick.${i + 1}.reply] ${String(o.reply.t).replace(/^(아니에요|맞아요)\.\s*/u, "")}`]));
  }
  L.push(`[keep.line] ${one(g.keep.line.t)}`, ...g.keep.words.flatMap((w: any) => [`[word.name] ${String(w.name).replace(/\s*\([^)]*\)$/, "")}`, `[word.short] ${w.short.t}`]), `[keep.whose] ${g.keep.whose.t}`);
  return L.join("\n");
}

// ── 저장한 모델 출력 ─────────────────────────────────────────────────────────────────────────────────
type Raw = {
  _what: string; event: string; short: string; kind: "write" | "repair"; prompt_version: string; model: string | null; model_requested: string; effort: string;
  input_sha256: string; request_sha256: string; response_id: string | null; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number;
  called_at: string; output_sha256: string; output: string; mode?: "batch"; batch_id?: string;
};
const rawDir = (x: L) => join(x.out, "raw");
function readRaws(x: L, kind: Raw["kind"]): Raw[] {
  if (!existsSync(rawDir(x))) return [];
  return readdirSync(rawDir(x)).filter((n) => n.startsWith(`${kind}.`) && n.endsWith(".json")).map((n) => readJson<Raw>(join(rawDir(x), n))).sort((a, b) => a.called_at.localeCompare(b.called_at));
}
function saveRaw(x: L, kind: Raw["kind"], name: string, a: CallReq, r: Awaited<ReturnType<typeof callMany>>[number]) {
  if (!r.ok || r.text == null) throw new Error(`${kind} 실패 — ${r.error}`);
  const raw: Raw = {
    _what: `짧은 이야기 (새 꼴) 단계의 모델 출력 (${kind} — short-flow.ts 가 쓴다 · 손으로 고치지 않는다). 프롬프트 src/short-flow-prompt.ts ${a.prompt_version}`,
    event: x.input.event, short: x.code, kind, prompt_version: a.prompt_version, model: r.model, model_requested: a.model, effort: a.effort, input_sha256: sha256(a.user), request_sha256: r.request_sha256,
    response_id: r.response_id, stop_reason: r.stop_reason, usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(),
    output_sha256: sha256(r.text), output: r.text, ...(r.mode === "batch" ? { mode: r.mode, batch_id: r.batch_id! } : {}),
  };
  mkdirSync(rawDir(x), { recursive: true });
  writeFileSync(join(rawDir(x), `${name}.json`), JSON.stringify(raw, null, 2) + "\n");
  const u = r.usage!;
  console.log(`  ${name}: ${r.model} 입력 ${u.input_tokens} (캐시 쓰기 ${u.cache_creation_input_tokens} · 읽기 ${u.cache_read_input_tokens}) · 출력 ${u.output_tokens} · ${(r.duration_ms / 1000).toFixed(0)}초 · $${r.cost_usd.toFixed(3)}${r.mode === "batch" ? " (배치)" : ""}`);
}
const est = (model: string, inTok: number, outTok: number) => (inTok * PRICE[model]!.in + outTok * PRICE[model]!.out) / 1e6;
const callReq = (x: L, label: string, q: Req & { version: string }, e: number): CallReq => ({ event: x.input.event, source_label: `${x.code}:${label}`, model: q.model, effort: q.effort, system: q.system, user: q.user, schema: q.schema, max_tokens: q.max_tokens, prompt_version: q.version, text_sha256: sha256(q.user), est_usd: e });

export function writeReq(x: L): Req & { version: string } {
  const s = [...x.srcs.values()][0]!, label = [...x.srcs.keys()][0]!;
  const human = [x.input.pick.flip_hint ? `아침 고르기의 추천 줄이 본 뒤집기 후보 (제목만 보고 낸 신호다 — 문서가 받치지 않으면 따르지 않는다): ${x.input.pick.flip_hint}` : "", x.input.human_note ?? ""].filter(Boolean).join("\n");
  const user = flowWriteUser({ event_title: x.event.title, doc_name: x.input.docs[label]!.name, published_at: String(s.published_at), passages: [...x.passages.values()].map((p) => ({ key: p.key, quote: oneLine(p.quote), cont: p.cont })), human });
  return { model: writeModelOf(x.input).write, effort: FLOW_MODELS.write.effort, system: flowWriteSystem(exemplarFlow()), user, schema: FLOW_WRITE_SCHEMA, max_tokens: FLOW_MODELS.write.max_tokens, version: FLOW_WRITE_VERSION };
}

// ── 사람 게이트 (human.json — 사람이 적는다. 기계는 읽기만) ──────────────────────────────────────────
export type FlowHuman = {
  ok?: boolean; by?: string; minutes?: number;
  stem_ok?: boolean;        // 줄기는 뉴스인가 — "그래서 무슨 일이었는데?"에 한 문장으로 답이 되나 (D95 ④)
  flow_ok?: boolean;        // 술술 읽히나 — 소리 내어 읽듯 처음부터 끝까지 · 문단이 앞을 받나 · 점프가 없나 (D91)
  flip_ok?: boolean;        // 뒤집기가 진짜인가 · 문서가 받치나
  not_drawn_ok?: boolean;   // 그리지 않을 것을 넘지 않았나
  pick_ok?: boolean;        // 고르기가 있으면: 받는 말이 채점하지 않나 · 어느 쪽을 골라도 같은 곳으로 가나 (없으면 적지 않아도 된다)
  death_checked?: boolean;  // 사람이 숨진 사건이 아니다 (새 꼴에는 사망 칸이 없다 — E-29)
  edits?: { id: string; t: string; src?: string[]; calc?: { n: string; how: string }[]; why: string }[];   // 글 덩이의 id 그대로 (flow[3].text · cover.title · keep.line …)
  drops?: string[];         // flow[i] — 덩이를 통째로 뺀다 (뼈의 차례가 깨지면 계약 검증이 막는다)
  not_drawn?: string[];     // 있으면 모델의 그리지 않을 것을 통째로 갈음한다
  note?: string;
};
export function readHuman(x: L): FlowHuman | null {
  const p = join(x.out, "human.json");
  return existsSync(p) ? readJson<FlowHuman>(p) : null;
}

type RepairLine = Repair["items"][number] & { round: number };
function readRepairs(x: L): RepairLine[] {
  return readRaws(x, "repair").flatMap((r, i) => (JSON.parse(r.output) as Repair).items.map((it) => ({ ...it, round: i + 1 })));
}
/** 고치기 출력 · 사람의 고침을 얹는다 (round 차례 · 사람은 맨 뒤 = round 0). 고치기의 drop 은 얹지 않는다 (사람이 본다 — proposed_drops) */
export function applyFlowRepairs(w: FlowWritten, repairs: RepairLine[], human: FlowHuman | null): { written: FlowWritten; touched: Set<string>; applied: (RepairLine & { before: string })[]; unknown: string[]; proposed_drops: string[] } {
  const out = structuredClone(w);
  const byId = new Map(textsOfFlow(out).map((t) => [t.id, t.wt]));
  const touched = new Set<string>(), applied: (RepairLine & { before: string })[] = [], unknown: string[] = [], proposed = new Set<string>();
  const all: (RepairLine & { setSrc: boolean; setCalc: boolean })[] = [
    ...repairs.map((r) => ({ ...r, setSrc: true, setCalc: true })),
    ...(human?.edits ?? []).map((e) => ({ id: e.id, action: "fix" as const, t: e.t, src: e.src ?? [], calc: e.calc ?? [], why: `사람: ${e.why}`, round: 0, setSrc: !!e.src, setCalc: !!e.calc })),
  ];
  for (const { setSrc, setCalc, ...r } of all) {
    const wt = byId.get(r.id);
    if (!wt) { unknown.push(r.id); continue; }
    applied.push({ ...r, before: wt.t });
    if (r.action === "drop") proposed.add(r.id);
    if (r.action !== "fix") continue;
    proposed.delete(r.id);
    wt.t = r.t;
    if (setSrc) wt.src = r.src.filter((k) => /^p\d+$/.test(k));
    if (setCalc) wt.calc = r.calc;
    touched.add(r.id);
  }
  const drops = [...new Set(human?.drops ?? [])].map((d) => /^flow\[(\d+)\]$/.exec(d)).filter((m): m is RegExpExecArray => !!m).map((m) => Number(m[1])).filter((i) => i < out.flow.length).sort((a, b) => b - a);
  for (const i of drops) out.flow.splice(i, 1);
  if (human?.not_drawn?.length) out.bone.not_drawn = human.not_drawn;
  return { written: out, touched, applied, unknown, proposed_drops: [...proposed] };
}

// ── 짓기 ─────────────────────────────────────────────────────────────────────────────────────────────
const T = (wt: WT) => ({
  t: wt.t,
  ...(wt.src.length ? { src: wt.src } : {}),
  ...(wt.calc.length ? { calc: Object.fromEntries(wt.calc.map((c) => [c.n, c.how])) } : {}),
  ...(wt.src.length && wt.voice !== "none" ? { voice: wt.voice } : {}),
});
/** FlowWritten → 계약의 FlowStory (EPISODE §14). 구절은 글이 가리킨 것만 싣는다 (문서의 차례대로) */
export function assembleFlow(x: L, w: FlowWritten): { story: Record<string, unknown>; notes: string[] } {
  const notes: string[] = [];
  const used = new Set(textsOfFlow(w).flatMap((t) => t.wt.src));
  for (const k of used) if (!x.passages.has(k)) notes.push(`글이 가리킨 구절 ${k} 가 구절 목록에 없다 — 계약 검증이 거부한다 (REF_QUOTE)`);
  const quotes = Object.fromEntries([...x.passages.values()].filter((p) => used.has(p.key)).map((p) => [p.key, { doc: p.doc, quote: oneLine(p.quote) }]));
  const docsUsed = new Set(Object.values(quotes).map((q) => q.doc));
  const docs = Object.fromEntries([...x.srcs.entries()].filter(([l]) => docsUsed.has(l)).map(([l, s]) => [l, { source_id: s.source_id, name: x.input.docs[l]!.name }]));
  const story = {
    episode_id: uuidFrom(`short:${x.code}`), episode_version: 1, code: x.code, event_ref: x.event.event_id, weight: "short", form: "flow",
    docs, quotes,
    voice_labels: { fact: FLOW_COMMON.voice_fact, official: w.voice_official, explain: FLOW_COMMON.voice_explain },
    cover: { title: T(w.cover.title), dek: T(w.cover.dek), meta: T(w.cover.meta), ask: T(w.cover.ask) },
    flow: w.flow.map((b) =>
      b.kind === "p" ? { kind: "p", beat: b.beat, text: T(b.text) }
      : b.kind === "cite" ? { kind: "cite", label: x.input.cite_label, text: T(b.text) }
      : b.kind === "flip" ? { kind: "flip", label: FLOW_COMMON.flip_label, a: T(b.a), op: b.op, b: T(b.b), note: T(b.note) }
      : { kind: "pick", ask: T(b.ask), options: b.options.map((o, i) => ({ key: `o${i + 1}`, label: T(o.label), reply: T(o.reply) })) }),
    keep: {
      line_label: FLOW_COMMON.line_label, line: T(w.keep.line), words_label: FLOW_COMMON.words_label,
      words: w.keep.words.map((v, i) => ({ key: `w${i + 1}`, name: v.name, short: T(v.short), body: [T(v.body)] })),
      whose: T(w.keep.whose),
    },
    not_drawn: w.bone.not_drawn,
  };
  return { story, notes };
}

export function validateFlow(story: unknown, x: L): { ok: boolean; errors: Issue[]; warnings: Issue[]; stats: unknown } {
  mkdirSync(x.out, { recursive: true });
  const tmp = join(x.out, `.validate-input.${process.pid}.json`);
  writeFileSync(tmp, JSON.stringify({ story, documents: x.documents }));
  try {
    return JSON.parse(execFileSync(R("apps/web/node_modules/.bin/tsx"), [R("packages/pipeline/src/short-flow-validate.ts"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally { unlinkSync(tmp); }
}

// ── 함의 (episode-entail/2 + 앞 덩이 — Opus low · 위험한 글만) ───────────────────────────────────────
type Judged = { verdict: EVerdict; issues: { part: string; kind: string; where: string; why: string }[]; note: string };
type EntailLine = { id: string; text_sha256: string; request_sha256: string; model: string | null; model_requested: string; effort: string; prompt_version: string; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number; called_at: string; ok: boolean; error: string | null; output: string | null; mode?: "batch"; batch_id?: string };
const entailPath = (x: L) => join(rawDir(x), `entail.${FLOW_MODELS.entail.model}.${FLOW_MODELS.entail.effort}.jsonl`);
const readEntail = (x: L): EntailLine[] => (existsSync(entailPath(x)) ? readFileSync(entailPath(x), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
export const BEFORE = 2;
/** 이 글 바로 앞에서 독자가 읽은 덩이 (BEFORE 개) — 읽기용. 표지의 제목 · 날 · 고를 것 (짧은 딱지)은 뺀다. 받는 말은 제 가지의 것만 · 고르기 뒤 문단은 첫 가지의 받는 말을 앞으로 본다 */
export function beforeOf(texts: FlowText[], id: string): string[] {
  const i = texts.findIndex((t) => t.id === id);
  if (i < 0) return [];
  const cur = texts[i]!;
  return texts.slice(0, i).filter((t) => !["cover.title", "cover.meta"].includes(t.id) && !t.id.endsWith(".label") && (t.branch === undefined || t.branch === (cur.branch ?? 0))).slice(-BEFORE).map((t) => `(${t.where}) ${oneLine(t.wt.t)}`);
}
export function entailReqFlow(x: L, texts: FlowText[], id: string): (Req & { version: string }) | null {
  const wt = texts.find((t) => t.id === id)?.wt;
  if (!wt) return null;
  const evidence = wt.src.flatMap((k) => (x.passages.has(k) ? [x.passages.get(k)!] : [])).map((p) => {
    const s = x.srcs.get(p.doc)!;
    return { title: x.input.docs[p.doc]!.name, publisher: s.publisher, published_at: String(s.published_at), passage: oneLine(p.quote), context: widen(x.texts.get(p.doc)!, p.span_start, p.span_end) };
  });
  if (!evidence.length) return null;
  const user = flowEntailUser(entailUser({ t: wt.t, voice: wt.voice, calc: wt.calc, where: id }, evidence), beforeOf(texts, id));
  return { model: FLOW_MODELS.entail.model, effort: FLOW_MODELS.entail.effort, system: FLOW_ENTAIL_SYSTEM, user, schema: ENTAIL2_SCHEMA, max_tokens: FLOW_MODELS.entail.max_tokens, version: FLOW_ENTAIL_VERSION };
}
function judgementOf(lines: EntailLine[], req: Req): Judged | null {
  const want = requestSha(req);
  const hit = lines.filter((l) => l.request_sha256 === want && l.ok && l.output != null).at(-1);
  if (!hit) return null;
  const j = JSON.parse(hit.output!) as Judged;
  return j.verdict === "CANNOT_JUDGE" ? j : { ...j, verdict: deriveVerdict(j.issues) };
}
const BAD = new Set<EVerdict>(["EXCEEDS", "CONTRADICTS", "UNDER_SOURCED"]);

// ── 기계 알림 — 쓰는 법 가운데 기계가 볼 수 있는 것 (막지 않는다 · 확인지와 review.json 에 싣는다) ───
// lab 의 검사 (apps/web/src/app/lab/short/check.ts L6 · L7 · L8 · lab/short-a/check.ts N1 · N2)를 파이프라인으로 옮겼다. 낱말을 볼 뿐이다 — 뜻은 사람이 읽는다.
// 기계가 못 보는 것 (문단이 앞을 받는가 · 수수께끼가 걸리는가 · 이 이야기가 무엇에 대한 것인가)은 확인지의 통독 · 이음매 표 · 줄기 칸으로 사람에게 간다.
export const sentencesOf = (s: string) => s.replace(/\*\*/g, "").replace(/\n/g, " ").split(/(?<=[.?!”])\s+(?=\S)/u).map((y) => y.trim()).filter(Boolean);
const bare = (s: string) => [...s.replace(/\*\*/g, "").replace(/\s+/g, "")].length;
const NOTICE: [RegExp, string][] = [
  [/것으로 나타났|것으로 확인|에 따르면|한편|아울러|또한|이에 |관련하여|바탕으로|참고로|예정이다|밝혔다|하였다/, "보고서 말투"],
  [/재결|인용|처분청|청구인|피청구인|위법\s?[·ㆍ･]\s?부당|행정청|당사자/, "관청의 말 그대로"],
  [/첫째|둘째|셋째|①|②|③|(^|\s)[123]\)\s|짚은 것/, "목록 꼴"],
  [/!|충격|놀랍게도|무려/, "호들갑"],
  [/조심해야|주의해야|명심|잊지 마|하셔야|해야 해요|해야 합니다/, "조언 · 훈계"],
];
const HEADISH = /^(\*\*[^*]{1,16}\*\*\s*[—:\-–]|[^.?!]{1,14}\s[—:–]\s|(무엇을 봤나|문서가 말한 것|남음|이렇게 생각하기 쉬워요|그런데 문서에는|어디가)\b)/u;   // 문단이 칸 이름 같은 머리로 시작한다
const NEXT_CELL = /무엇이 남나요|무엇을 따졌나요|무엇을 봤나요|어떻게 됐나요\?$|^그래서요\?$|문서는 뭐라고/u;                                                   // 독자의 물음이 아니라 다음 칸의 이름인 단추
const GRADING = /^["“”']?\s*(아니에요|아니요|아쉽|틀렸|땡|맞아요|맞았|정답|딩동)/u;
const WRITE_DOWN = /생각하기 쉬워요|생각하기 쉽|싶어요\.?$|라고 생각할 수 있어요|여기기 쉬워요/u;                                                                  // 첫 생각을 적어 줬다 (같이 해 보지 않았다)
const OFFICIAL_END = /당부|밝혔|하겠다고|살펴보겠|강조했|원칙을 (일관되게 )?확인/u;
export function flowNotices(w: FlowWritten): { code: string; where: string; message: string }[] {
  const out: { code: string; where: string; message: string }[] = [];
  const N = (code: string, where: string, message: string) => out.push({ code, where, message });
  const texts = textsOfFlow(w);
  const isCite = (t: FlowText) => t.where.endsWith("문서의 문장");
  // 술술 읽히는 꼴 — 말투 · 목록 · 머리
  for (const t of texts) {
    if (isCite(t)) continue;   // 문서의 글자 그대로다
    for (const [re, what] of NOTICE) { const m = re.exec(t.wt.t); if (m) N("말투", t.id, `${what} — “${m[0].trim()}”`); }
    if (DATED.test(t.wt.t)) N("말투", t.id, `발행일에 걸린 말 — “${DATED.exec(t.wt.t)![0]}”`);
  }
  w.flow.forEach((b, i) => { if (b.kind === "p" && HEADISH.test(b.text.t)) N("머리", `flow[${i}].text`, "문단이 칸 이름 같은 머리로 시작한다 — 새 꼴에는 작은 머리가 없다"); });
  if (NEXT_CELL.test(w.cover.ask.t)) N("단추", "cover.ask", `물음 단추가 독자의 물음이 아니라 다음 칸의 이름 같다 — “${w.cover.ask.t}”`);
  if (!/[?？]$/.test(w.cover.ask.t.trim())) N("단추", "cover.ask", "물음 단추가 물음으로 끝나지 않는다");
  // 해요체 — 이야기 문단 · 받는 말 · 누구의 말 (제목 · 뒤집기의 두 말 · 단추 · 날 · 남는 한 줄 · 문서의 문장은 뺀다)
  for (const t of texts) {
    if (/제목|날$|뒤집기 앞|뒤집기 뒤|단추|남는 한 줄|문서의 문장|고를 것/.test(t.where)) continue;
    const plain = sentencesOf(t.wt.t).filter((s) => /[가-힣]다\.$/.test(s));
    if (plain.length) N("말투", t.id, `평서문 (“~다.”)이 섞였다 — “${plain[0]}”`);
  }
  // 뼈 — 첫 생각을 적어 줬나 · 뒤집기의 자리 · 맺음
  const first = w.flow[0];
  if (first?.kind === "p" && WRITE_DOWN.test(first.text.t)) N("뼈", "flow[0].text", "첫 생각을 적어 준 말투다 (“~기 쉬워요” · “~싶어요”) — 같이 해 봤는지 사람이 본다");
  const fi = w.flow.findIndex((b) => b.kind === "flip");
  if (fi >= 0) {
    const after = w.flow.length - 1 - fi;
    if (after < 2) N("뼈", `flow[${fi}]`, `뒤집기 뒤에 덩이가 ${after}개뿐이다 — 뒤집기는 가운데, 그 뒤에 써 보기 (맨 끝의 요약이 되지 않게)`);
    if (fi < 2) N("뼈", `flow[${fi}]`, "뒤집기가 너무 일찍 온다 — 어긋남과 풀이가 서기 전이다");
  }
  const last = w.flow.at(-1);
  if (last?.kind === "p" && OFFICIAL_END.test(last.text.t)) N("맺음", `flow[${w.flow.length - 1}].text`, "흐름이 기관의 말 · 당부로 끝난다");
  if (OFFICIAL_END.test(w.keep.line.t)) N("맺음", "keep.line", "남는 한 줄이 기관의 말 · 당부다");
  if (/없어요\.?$|없다\.?$/.test(w.keep.line.t.trim())) N("맺음", "keep.line", "남는 한 줄이 “없다”로 끝난다");
  if (/(해야|와야|져야|어야|아야) (한다|해요)\.?$/mu.test(w.keep.line.t.trim())) N("맺음", "keep.line", "남는 한 줄이 당위문이다 (“~해야 한다”) — 원칙 선언이 아니라 일어난 일을 남긴다");
  // 고르기 — 채점하지 않는다 · 같은 수의 문장
  for (const [i, b] of w.flow.entries()) {
    if (b.kind !== "pick") continue;
    b.options.forEach((o, k) => { if (GRADING.test(o.reply.t)) N("고르기", `flow[${i}].options[${k}].reply`, `받는 말이 채점한다 — “${sentencesOf(o.reply.t)[0]}” (“~로 보면 그래요. 그런데 …”로 받는다)`); });
    const n = b.options.map((o) => sentencesOf(o.reply.t).length);
    if (new Set(n).size !== 1) N("고르기", `flow[${i}]`, `받는 말이 가지마다 길이가 다르다 (${n.join(" · ")}문장)`);
    const next = w.flow[i + 1];
    if (!next || next.kind !== "p") N("고르기", `flow[${i}]`, "고르기 뒤에 두 가지를 다시 모으는 문단이 없다");
  }
  // 줄기는 뉴스 (D95 — lab N1 · N2): 낱말의 이름이 줄기의 자리 (표지 · 뒤집기의 두 말 · 남는 한 줄)에 있나 · 뉴스가 서기 전에 낱말이 나오나 · 낱말이 든 덩이가 절반을 넘나
  const names = w.keep.words.map((v) => v.name.replace(/\s*\([^)]*\)$/, "")).filter(Boolean);
  const has = (s: string) => names.filter((n) => s.replace(/\*\*/g, "").includes(n));
  const flip = fi >= 0 ? (w.flow[fi] as Extract<FlowWritten["flow"][number], { kind: "flip" }>) : null;
  const stemCells: [string, string][] = [["cover.title", w.cover.title.t], ["cover.ask", w.cover.ask.t], ["keep.line", w.keep.line.t], ...(flip ? ([[`flow[${fi}].a`, flip.a.t], [`flow[${fi}].b`, flip.b.t]] as [string, string][]) : [])];
  for (const [id, t] of stemCells) for (const n of has(t)) N("줄기", id, `개념 낱말 “${n}” 이 줄기의 자리에 있다 — 여기는 뉴스에 대한 말이어야 한다 (D95). 사람이 본다`);
  if (flip) {
    // 뒤집기의 두 말이 같은 것의 뜻풀이 꼴인가 (“○○는 ~하는 것” ≠ “○○는 ~하는 것”) — 낱말만 본다
    const topic = (t: string) => /^["“”'‘’]?\s*([^\s"“”]+?)(은|는)\s/u.exec(t)?.[1] ?? null;
    const nounEnd = (t: string) => !/(다|요|음|함)["”'’.]*$/u.test(t.trim());
    const [ta, tb] = [topic(flip.a.t), topic(flip.b.t)];
    if (ta && ta === tb && nounEnd(flip.a.t) && nounEnd(flip.b.t)) N("줄기", `flow[${fi}]`, `뒤집기의 두 말이 같은 것 (“${ta}”)의 뜻풀이 꼴이다 — 뉴스에 대한 뒤집기인지 사람이 본다 (D95 ③)`);
  }
  const blockText = (b: FlowWritten["flow"][number]) => (b.kind === "p" || b.kind === "cite" ? b.text.t : b.kind === "flip" ? `${b.a.t} ${b.b.t} ${b.note.t}` : `${b.ask.t} ${b.options.map((o) => `${o.label.t} ${o.reply.t}`).join(" ")}`);
  w.flow.slice(0, 2).forEach((b, i) => { if (b.kind !== "cite") for (const n of has(blockText(b))) N("줄기", `flow[${i}]`, `뉴스가 서기 전에 개념 낱말 “${n}” 이 나온다`); });
  const conceptBlocks = w.flow.filter((b) => b.kind !== "cite" && has(blockText(b)).length).length;
  if (names.length && conceptBlocks * 2 > w.flow.length) N("줄기", "flow", `개념 낱말이 든 덩이가 ${conceptBlocks} / ${w.flow.length} — 절반이 넘는다 (개념 강의가 됐는지 사람이 본다)`);
  const nameBeats = w.flow.filter((b) => b.kind === "p" && b.beat === "name").length;
  if (nameBeats > 2) N("줄기", "flow", `이름 붙이는 문단이 ${nameBeats}개다 (둘까지 — 개념은 길 위의 도구다)`);
  if (w.bone.about !== "news") N("줄기", "bone.about", "모델이 스스로 이 이야기를 개념에 대한 것이라고 적었다");
  // 크기 — 쓰는 법 (불변식이 아니다)
  const paras = w.flow.filter((b) => b.kind === "p").length;
  if (paras < FLOW_SIZE.paras[0] || paras > FLOW_SIZE.paras[1]) N("크기", "flow", `흐름의 글 문단 ${paras} (아홉 안팎 — ${FLOW_SIZE.paras[0]} ~ ${FLOW_SIZE.paras[1]})`);
  for (const t of texts) {
    if (isCite(t)) continue;
    const ss = sentencesOf(t.wt.t);
    if (ss.length > FLOW_SIZE.sentences) N("크기", t.id, `한 덩이가 ${ss.length}문장이다 (다섯까지)`);
    for (const s of ss) if (bare(s) > FLOW_SIZE.sentence_chars) N("크기", t.id, `한 문장이 ${bare(s)}자다 (70자까지) — “${s.slice(0, 30)}…”`);
  }
  const size = sizeOf(w);
  if (size.path > FLOW_SIZE.path_chars) N("크기", "읽는 길", `빈칸 뺀 글자 ${size.path} — ${FLOW_SIZE.path_chars} 을 넘는다 (줄기가 둘인지 본다)`);
  if (w.keep.words.length < FLOW_SIZE.words[0] || w.keep.words.length > FLOW_SIZE.words[1]) N("크기", "keep.words", `낱말 ${w.keep.words.length} (하나 ~ 둘)`);
  return out;
}
/** 읽는 길 — 표지 · 흐름 (한쪽 가지) · 남는 한 줄 · 누구의 말. 낱말 카드는 접혀 있다 (따로 센다) — lab check L8 과 같은 셈법 */
export function sizeOf(w: FlowWritten): { path: number; cards: number; paras: number; blocks: number } {
  const read = textsOfFlow(w).filter((t) => t.branch === undefined || t.branch === 0);
  return { path: read.filter((t) => !t.id.startsWith("keep.words")).reduce((a, t) => a + bare(t.wt.t), 0), cards: read.filter((t) => t.id.startsWith("keep.words")).reduce((a, t) => a + bare(t.wt.t), 0), paras: w.flow.filter((b) => b.kind === "p").length, blocks: w.flow.length };
}

// ── 지은 결과 ────────────────────────────────────────────────────────────────────────────────────────
export function latestWrite(x: L): { raw: Raw; written: FlowWritten; problems: string[] } | null {
  const raw = readRaws(x, "write").filter((r) => r.prompt_version === FLOW_WRITE_VERSION).at(-1);
  return raw ? { raw, ...parseFlow(raw.output) } : null;
}
export function build(code: string) {
  const x = loadFlow(code);
  const lw = latestWrite(x);
  if (!lw) throw new Error(`짧은 이야기 ${code} — 글 출력이 없다. 먼저 --write-call`);
  const human = readHuman(x);
  const rep = applyFlowRepairs(lw.written, readRepairs(x), human);
  const b = assembleFlow(x, rep.written);
  const v = validateFlow(b.story, x);
  const texts = textsOfFlow(rep.written);
  const stored = readEntail(x);
  const judged = texts.map((t) => {
    const risky = needsEntail2(t.wt, rep.touched.has(t.id));
    const q = risky ? entailReqFlow(x, texts, t.id) : null;
    return { id: t.id, where: t.where, wt: t.wt, risk: riskOf(t.wt, rep.touched.has(t.id)), need: !!q, q, judgement: q ? judgementOf(stored, q) : null };
  });
  return { x, lw, human, rep, b, v, texts, judged, written: rep.written, notices: flowNotices(rep.written) };
}
type Built = ReturnType<typeof build>;

export function review(r: Built) {
  const blocked = [
    ...r.v.errors.map((e) => ({ where: e.path, what: e.code, why: e.message })),
    ...r.judged.filter((j) => j.judgement && BAD.has(j.judgement.verdict)).map((j) => ({ where: j.id, what: `함의 ${j.judgement!.verdict}`, why: j.judgement!.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ") })),
    ...r.lw.problems.map((p) => ({ where: "write", what: "줄", why: p })),
    ...r.rep.unknown.map((id) => ({ where: id, what: "고침", why: "모르는 글 덩이 id — 얹지 못했다" })),
    ...r.rep.proposed_drops.map((id) => ({ where: id, what: "고치기", why: "고치기 단계가 이 덩이를 빼자고 했다 — 사람이 고치거나 뺀다" })),
  ];
  const notJudged = r.judged.filter((j) => j.need && !j.judgement).map((j) => j.id);
  const h = r.human, w = r.written, bone = w.bone;
  const hasPick = w.flow.some((b) => b.kind === "pick");
  const humanOk = h?.ok === true && h.stem_ok === true && h.flow_ok === true && h.flip_ok === true && h.not_drawn_ok === true && h.death_checked === true && (!hasPick || h.pick_ok === true);
  const flip = w.flow.find((b) => b.kind === "flip");
  return {
    _what: "짧은 이야기 (새 꼴)의 검사 결과 · 사람이 확인할 것 (short-flow.ts 가 쓴다 — 손으로 고치지 않는다). 사람의 확인은 같은 폴더 human.json 에",
    short: r.x.code, event: r.x.input.event, write: { prompt_version: r.lw.raw.prompt_version, model: r.lw.raw.model, effort: r.lw.raw.effort, request_sha256: r.lw.raw.request_sha256 },
    contract: { ok: r.v.ok, errors: r.v.errors, warnings: r.v.warnings, stats: r.v.stats },
    entail: {
      prompt_version: FLOW_ENTAIL_VERSION, model: FLOW_MODELS.entail.model, effort: FLOW_MODELS.entail.effort, before: BEFORE,
      texts: r.texts.length, with_src: r.texts.filter((t) => t.wt.src.length).length, risky: r.judged.filter((j) => j.need).length,
      judged: r.judged.filter((j) => j.judgement).map((j) => ({ id: j.id, risk: j.risk, verdict: j.judgement!.verdict, issues: j.judgement!.issues })),
      not_judged: notJudged, low_risk_skipped: r.judged.filter((j) => !j.need && j.wt.src.length).map((j) => j.id),
    },
    repairs: r.rep.applied.map((a) => ({ id: a.id, round: a.round, action: a.action, before: a.before, after: a.action === "fix" ? a.t : a.before, why: a.why })),
    notices: r.notices,
    size: sizeOf(w),
    bone: { stems: bone.stems, chosen: bone.chosen, chosen_why: bone.chosen_why, dropped: bone.dropped, answer: bone.answer, about: bone.about, about_why: bone.about_why, first_thought: bone.first_thought, breaker: bone.breaker, breaker_src: bone.breaker_src, words: bone.words, try: bone.try, pick: bone.pick, pick_why: bone.pick_why, path: bone.path, unknown: bone.unknown },
    human_cells: {
      stem: { answer: bone.answer, about: bone.about, ok: h?.stem_ok ?? null },
      flow: { ok: h?.flow_ok ?? null },
      flip: { proposal: flip?.kind === "flip" ? `${flip.a.t} ${flip.op} ${flip.b.t}` : null, strength: bone.flip_strength, basis: bone.flip_basis, basis_src: bone.flip_basis_src, ok: h?.flip_ok ?? null },
      not_drawn: { proposal: bone.not_drawn, ok: h?.not_drawn_ok ?? null },
      pick: hasPick ? { ok: h?.pick_ok ?? null } : null,
      death: { proposal: bone.death, checked: h?.death_checked ?? null },
    },
    blocked, publishable: r.v.ok && blocked.length === 0 && notJudged.length === 0 && humanOk,
  };
}

// ── 통독 · 사람 확인지 ───────────────────────────────────────────────────────────────────────────────
const srcTail = (wt: WT) => `${wt.src.length ? ` ← ${wt.src.join(" ")}` : ""}${wt.calc.length ? ` · calc ${wt.calc.map((c) => `${c.n} = ${c.how}`).join(" || ")}` : ""}`;
/** 통독 — 독자가 읽는 차례대로 (가지는 둘 다). 근거 키를 꼬리에 */
export function readThrough(w: FlowWritten, withSrc = true): string[] {
  return textsOfFlow(w).map((t) => `- **${t.where}** ${t.wt.t.replace(/\n/g, " / ")}${withSrc ? srcTail(t.wt) : ""}`);
}
/** 이음매 — 덩이의 끝 문장 → 다음 덩이의 첫 문장 (사람이 "앞을 받는가"를 한눈에 본다. 기계는 판정하지 않는다) */
export function seams(w: FlowWritten): [string, string][] {
  const units: { tail: string; head: string }[] = [{ tail: `(단추) ${w.cover.ask.t}`, head: "" }];
  for (const b of w.flow) {
    if (b.kind === "p") { const s = sentencesOf(b.text.t); units.push({ head: s[0] ?? "", tail: s.at(-1) ?? "" }); }
    else if (b.kind === "cite") units.push({ head: `(문서의 문장) ${b.text.t}`, tail: `(문서의 문장) ${b.text.t}` });
    else if (b.kind === "flip") units.push({ head: `(뒤집기) ${b.a.t} ${b.op} ${b.b.t}`, tail: sentencesOf(b.note.t).at(-1) ?? "" });
    else units.push({ head: `(고르기) ${sentencesOf(b.ask.t)[0] ?? ""}`, tail: `(받는 말 1) ${sentencesOf(b.options[0]!.reply.t).at(-1) ?? ""}` });
  }
  units.push({ head: `(남는 한 줄) ${w.keep.line.t.replace(/\n/g, " ")}`, tail: "" });
  return units.slice(1).map((u, i) => [units[i]!.tail, u.head]);
}
export function sheet(r: Built): string {
  const rv = review(r), w = r.written, d = w.bone;
  const q = (k: string) => { const p = r.x.passages.get(k); return p ? `\`${k}\` “${oneLine(p.quote)}”` : `\`${k}\` (구절 목록에 없음)`; };
  const digits = r.texts.filter((t) => /\d/.test(t.wt.t));
  const usedKeys = [...new Set(r.texts.flatMap((t) => t.wt.src))].sort();
  const flip = w.flow.find((b) => b.kind === "flip");
  const picks = w.flow.filter((b) => b.kind === "pick");
  const size = sizeOf(w);
  const template: FlowHuman = { ok: false, by: "", minutes: 0, stem_ok: false, flow_ok: false, flip_ok: false, not_drawn_ok: false, ...(picks.length ? { pick_ok: false } : {}), death_checked: false, edits: [{ id: "", t: "", why: "" }], drops: [], note: "" };
  const L: string[] = [
    `# 짧은 이야기 확인지 (새 꼴) — 「${oneLine(w.cover.title.t)}」 (${r.x.code})`,
    "",
    "내기 전에 사람 (편집자)이 본다. **맞나 + 술술 읽히나 + 무엇에 대한 이야기인가** — 셋 다 (D91 · D95 ④). 고칠 글은 같은 폴더 `human.json` 의 `edits` 에 `{ id, t, why }` (근거를 바꾸려면 `src`), 다 보면 칸마다 `true`. 고친 것은 `logs/correction-log.jsonl` 에도 한 줄.",
    `사건 ${r.x.input.event} · 고른 곳 S-2 아침 한 장 ${r.x.input.pick.date} ${r.x.input.pick.id} · 글 ${r.lw.raw.prompt_version} · ${r.lw.raw.model} (${r.lw.raw.effort}) · 덩이 ${size.blocks} (글 문단 ${size.paras}) · 읽는 길 빈칸 뺀 ${size.path}자 + 접힌 낱말 카드 ${size.cards}자 · 계약 검증 ${r.v.ok ? "통과" : `**실패 ${r.v.errors.length}**`} · 함의 본 글 ${rv.entail.judged.length} / 위험한 글 ${rv.entail.risky} · 기계 알림 ${r.notices.length}`,
    "",
    `## 1. 막힘 ${rv.blocked.length} — 고치거나 뺀다`,
    ...(rv.blocked.length ? rv.blocked.map((b) => `- \`${b.where}\` **${b.what}** — ${b.why}`) : ["- 없음"]),
    ...(rv.entail.not_judged.length ? [`- **함의를 아직 못 본 글 ${rv.entail.not_judged.length}** — \`--entail-call\` 을 한 번 더, 또는 직접 읽는다: ${rv.entail.not_judged.join(" · ")}`] : []),
    "",
    "## 2. 뼈 — 모델이 글을 쓰기 전에 세운 것",
    "- 줄기 후보:",
    ...d.stems.map((s, i) => `  ${i + 1}. ${s}`),
    `- **고른 줄기**: ${d.chosen}`,
    `  - 까닭: ${d.chosen_why}`,
    "- 버린 것:",
    ...d.dropped.map((s) => `  - ${s}`),
    `- 독자의 첫 생각: ${d.first_thought}`,
    `  - 왜 그렇게 생각하기 쉬운가: ${d.first_thought_why}`,
    `- 그것을 깨는 것: ${d.breaker}`,
    ...d.breaker_src.map((k) => `  - ${q(k)}`),
    `- 이름 붙일 낱말: ${d.words.join(" / ")}`,
    `- 써 볼 자리: ${d.try}`,
    `- 고르기를 둘까: **${d.pick}** — ${d.pick_why}`,
    `- 흐름의 뼈: ${d.path}`,
    "",
    "## 3. 이 이야기는 무엇에 대한 것인가 — 뉴스인가 개념인가 (`stem_ok` · D95 ④)",
    `- 모델이 적은 **“그래서 무슨 일이었는데?”** 의 한 문장: ${d.answer}`,
    `- 모델의 판정: **${d.about}** — ${d.about_why}`,
    `- 줄기의 자리 셋: 제목 「${oneLine(w.cover.title.t)}」 · 뒤집기 ${flip?.kind === "flip" ? `${flip.a.t} ${flip.op} ${flip.b.t}` : "(없음)"} · 남는 한 줄 「${oneLine(w.keep.line.t)}」`,
    "- 볼 것: 아래 통독을 끝까지 읽고 **스스로** 한 문장으로 답해 본다 — 그 답이 일어난 일인가 (낱말의 뜻 · 제도 설명 · 읽는 법이면 개념 강의다) · 모델의 한 문장과 같은가 · 제목의 물음 · 뒤집기 · 남는 한 줄이 뉴스에 대한 말인가 · 낱말은 그 뉴스를 읽으려고 주운 도구인가",
    "- 계약 검증은 이것을 못 본다 — 개념 강의가 된 글도 꼴은 통과한다 (EPISODE §14.6 ①)",
    "",
    "## 4. 통독 — 위에서 아래로 · 소리 내어 읽듯 (`flow_ok` · D91). 고르기는 가지 둘 다",
    ...readThrough(w),
    "",
    "### 이음매 — 앞 덩이의 끝 → 받는 첫 문장 (기계는 뽑기만 했다. 받는지는 사람이 본다)",
    "| 앞의 끝 | → 받는 첫 문장 |",
    "|---|---|",
    ...seams(w).map(([a, b]) => `| ${oneLine(a).replace(/\|/g, "/")} | ${oneLine(b).replace(/\|/g, "/")} |`),
    "- 볼 것: 문단의 첫 문장이 앞 문단의 끝을 받나 · 문단의 차례를 바꾸면 말이 안 되나 (된다면 목록의 한 칸이다) · 답이 장면보다 먼저 나오나 · 풀이 없이 낱말 · 물건이 먼저 나오나 · 같은 생각을 세 번 듣나 · 뒤집기 앞 문단이 뒤집기로 건너갈 다리를 놓나 · 수수께끼가 걸리나 · 맺음이 독자가 내일 쓸 말인가",
    "",
    "## 5. 뒤집기가 진짜인가 (`flip_ok`)",
    `- **${flip?.kind === "flip" ? `${flip.a.t} ${flip.op} ${flip.b.t}` : "(없음)"}** · 모델이 본 세기: **${d.flip_strength}**`,
    `- 뒤집기가 서 있는 곳 (모델): ${d.flip_basis}`,
    ...d.flip_basis_src.map((k) => `  - ${q(k)}`),
    `- 아침 한 장의 뒤집기 후보 (제목만 본 신호): ${r.x.input.pick.flip_hint || "- (비웠다 — 문서에서 줄기를 처음부터 골랐다)"}`,
    "- 볼 것: 보통 사람이 정말 그렇게 생각하나 · 뒤쪽 말을 **문서가** 받치나 · 억지가 아닌가 · 뉴스에 대한 뒤집기인가",
    ...(picks.length ? ["", "## 6. 고르기 (`pick_ok`) — 받는 말이 채점하지 않나 · 어느 쪽을 골라도 같은 곳으로 가나 · 억지 퀴즈가 아닌가", ...picks.flatMap((b) => (b.kind === "pick" ? [`- 물음: ${b.ask.t}`, ...b.options.map((o, k) => `  - ${k + 1}. **${o.label.t}** → ${o.reply.t}`)] : []))] : ["", "## 6. 고르기 — 없음 (모델이 두지 않았다)"]),
    "",
    "## 7. 그리지 않을 것 (`not_drawn_ok`) — 글이 이 선을 넘지 않았나",
    ...d.not_drawn.map((n) => `- ${n}`),
    "- 문서에 없는 것 (모델이 적은 것 — 누구의 말 칸이 이것을 없다고 말하나):",
    ...d.unknown.map((n) => `  - ${n}`),
    "",
    `## 8. 숫자 — 숫자가 든 글 ${digits.length} (코드가 구절 · 계산과 댔다 — 그 수가 **무엇의** 수인지는 사람이)`,
    ...(digits.length ? digits.flatMap((t) => [`- \`${t.id}\` ${t.wt.t.replace(/\n/g, " / ")}`, ...t.wt.calc.map((c) => `  - 계산 ${c.n} = ${c.how}`), ...t.wt.src.map((k) => `  - ${q(k)}`)]) : ["- 없음"]),
    "",
    `## 9. 구절 — 쓴 구절 ${usedKeys.length} / 문서의 구절 ${r.x.passages.size} (전부 git 에 있는 문서의 글자 그대로 — 계약 검증이 댔다)`,
    ...Object.entries(r.x.input.docs).map(([l, v]) => `- 문서 \`${l}\` ${v.name} · ${r.x.srcs.get(l)!.publisher} · 공개 ${r.x.srcs.get(l)!.published_at}`),
    ...usedKeys.map((k) => `  - ${q(k)}${r.x.passages.get(k)?.cont ? " (쪽이 넘어가 끊긴 뒤 토막)" : ""}`),
    "",
    `## 10. 함의 — 위험한 글마다 (Opus low · 앞 덩이 ${BEFORE}개를 읽기용으로 같이 줬다)`,
    ...(rv.entail.judged.length ? rv.entail.judged.map((j) => `- \`${j.id}\` [${j.risk.join(" · ")}] **${j.verdict}**${j.issues.length ? ` — ${j.issues.map((i) => `“${i.part}” ${i.where}: ${i.why}`).join(" / ")}` : ""}`) : ["- 아직 없음"]),
    `- 위험하지 않아 건너뛴 글 (근거는 있다): ${rv.entail.low_risk_skipped.join(" · ") || "-"}`,
    ...(rv.repairs.length ? ["", `### 고친 글 ${rv.repairs.length}`, ...rv.repairs.map((f) => `- \`${f.id}\` (${f.round === 0 ? "사람" : `고치기 ${f.round}`} · ${f.action})\n  - 앞: ${oneLine(f.before)}\n  - 뒤: ${oneLine(f.after)}\n  - ${f.why}`)] : []),
    "",
    `## 11. 기계 알림 ${r.notices.length} — 쓰는 법 가운데 기계가 볼 수 있는 것 (막지 않는다 · 낱말만 본다)`,
    ...(r.notices.length ? r.notices.map((n) => `- [${n.code}] \`${n.where}\` ${n.message}`) : ["- 없음"]),
    `- 크기: 글 문단 ${size.paras} (아홉 안팎) · 읽는 길 ${size.path}자 (1,100 안쪽) · 낱말 ${w.keep.words.length} (하나 ~ 둘) — 손 견본 B: 문단 6 · 913자`,
    "",
    "## 12. 사망 (`death_checked`)",
    `- 모델의 제안: **${d.death}** — 사람이 숨진 사건은 이 꼴로 내지 않는다 (새 꼴에는 사망 칸이 없다 — EPISODE §14.7 · E-29). 사람이 문서를 보고 확인한다`,
    "",
    "## human.json 에 적을 것",
    "```json",
    JSON.stringify(template, null, 2),
    "```",
    `지금 상태: 낼 수 있나 = **${rv.publishable}** (계약 ${r.v.ok ? "통과" : "실패"} · 막힘 ${rv.blocked.length} · 함의 못 본 글 ${rv.entail.not_judged.length} · 사람 확인 ${r.human?.ok === true ? "넘김" : "아직"})`,
  ];
  return L.join("\n") + "\n";
}

// ── 모델 부르기 ──────────────────────────────────────────────────────────────────────────────────────
async function callWrite(code: string, mode: Mode, budget: Budget) {
  const x = loadFlow(code);
  const q = writeReq(x);
  const tok = (await countTokens(q)) ?? Math.round((q.system.length + q.user.length) / 1.6);
  const e = est(q.model, tok, 12000);
  console.log(`short-flow ${code} --write-call — ${q.version} · ${q.model} · ${q.effort} · 구절 ${x.passages.size} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(x, "FLOW-WRITE", q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(x, "write", `write.${q.model}.${q.effort}.${requestSha(q).slice(0, 12)}`, a, res!);
}
// 함의 한 건의 넉넉한 추정 — 앞부분 (system)은 캐시로 읽힌다고 보고 (첫 건만 쓰기), 출력 500 토큰 (P-S1 실측: 건당 190 안팎)
const entailEst = (q: Req, first: boolean) => (Math.round(q.user.length / 1.6) * PRICE[q.model]!.in + Math.round(q.system.length / 1.6) * (first ? PRICE[q.model]!.cache_write : PRICE[q.model]!.cache_read) + 500 * PRICE[q.model]!.out) / 1e6;
async function callEntail(code: string, mode: Mode, budget: Budget) {
  const r = build(code);
  const todo = r.judged.filter((j) => j.need && !j.judgement);
  if (!todo.length) return void console.log(`short-flow ${code} --entail-call — 볼 글이 없다 (저장된 판정이 전부 지금 글 · 앞 덩이와 같다)`);
  const ests = todo.map((j, i) => entailEst(j.q!, i === 0));
  const total = ests.reduce((a, b) => a + b, 0);
  console.log(`short-flow ${code} --entail-call — ${FLOW_ENTAIL_VERSION} · ${FLOW_MODELS.entail.model} · ${FLOW_MODELS.entail.effort} · 글 ${todo.length} (전체 ${r.texts.length} 가운데 위험한 글 ${r.judged.filter((j) => j.need).length}) · 넉넉한 추정 $${(total * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const rs = await callMany(todo.map((j, i) => callReq(r.x, `FLOW-ENTAIL(${j.id})`, j.q!, ests[i]!)), { mode, budget, conc: 4 });
  mkdirSync(rawDir(r.x), { recursive: true });
  let cost = 0, n = 0;
  rs.forEach((res, i) => {
    if (res.skipped) return;
    const line: EntailLine = { id: todo[i]!.id, text_sha256: sha256(todo[i]!.wt.t), request_sha256: res.request_sha256, model: res.model, model_requested: FLOW_MODELS.entail.model, effort: FLOW_MODELS.entail.effort, prompt_version: FLOW_ENTAIL_VERSION, stop_reason: res.stop_reason, usage: res.usage, duration_ms: res.duration_ms, cost_usd: Number(res.cost_usd.toFixed(6)), called_at: new Date().toISOString(), ok: res.ok, error: res.error, output: res.text, ...(res.mode === "batch" ? { mode: res.mode, batch_id: res.batch_id! } : {}) };
    appendFileSync(entailPath(r.x), JSON.stringify(line) + "\n");
    cost += res.cost_usd; n++;
  });
  console.log(`  받은 판정 ${n} / ${todo.length} · $${cost.toFixed(3)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)}`);
}
/** 계약 검증의 오류 가운데 글 덩이 하나를 고쳐서 풀 수 있는 것 — 나머지 (뼈의 차례 · 뒤집기의 수 · 고르기의 수 · 낱말)는 덩이 하나의 일이 아니다. 사람이 보거나 글을 다시 부른다 */
const BLOCK_FIXABLE = new Set(["NUMBER_UNGROUNDED", "CITE_VERBATIM", "BREAKER_SRC", "REF_QUOTE"]);
export function repairReq(r: Built): { q: Req & { version: string }; ids: string[]; bare: string[] } | null {
  const why = new Map<string, string[]>();
  const push = (id: string, s: string) => why.set(id, [...(why.get(id) ?? []), s]);
  for (const j of r.judged) if (j.judgement && BAD.has(j.judgement.verdict)) push(j.id, `함의 (${j.judgement.verdict}): ${j.judgement.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ")}`);
  const pathToId = new Map(r.texts.map((t) => [pathOfId(t.id), t.id]));
  const bare: string[] = [];
  for (const e of r.v.errors) {
    const id = pathToId.get(e.path) ?? pathToId.get(e.path.replace(/\/src(\/\d+)?$/, ""));
    if (id && (BLOCK_FIXABLE.has(e.code) || ((e.code === "FLOW_FLIP" || e.code === "FLOW_PICK") && /근거 구절이 없다/.test(e.message)))) push(id, `계약 (${e.code}): ${e.message}`);
    else bare.push(`${e.code} ${e.path}: ${e.message}`);
  }
  if (!why.size) return null;
  const idx = new Map(r.texts.map((t, i) => [t.id, i]));
  const blocks = [...why.entries()].map(([id, ws]) => {
    const i = idx.get(id)!, t = r.texts[i]!;
    const flowAt = (k: number) => r.texts.slice(k).find((y) => y.branch === undefined || y.branch === (t.branch ?? 0));
    const next = flowAt(i + 1);
    const before = beforeOf(r.texts, id);
    const ev = t.wt.src.flatMap((k) => (r.x.passages.has(k) ? [r.x.passages.get(k)!] : [])).map((p) => `  ${p.key} — 구절: ${oneLine(p.quote)}\n     둘레: ${widen(r.x.texts.get(p.doc)!, p.span_start, p.span_end)}`);
    return [`## ${id}`, `자리: ${t.where}`, "앞 덩이 (읽기용):", ...(before.length ? before.map((s) => `  ${s}`) : ["  (없음 — 표지의 첫 글)"]), `지금 글: ${t.wt.t}`, `뒤 덩이 (읽기용): ${next ? `(${next.where}) ${oneLine(next.wt.t)}` : "(없음)"}`, `꼬리표: ${t.wt.voice}`, `근거 키: ${t.wt.src.join(" ") || "없음"}`, `calc: ${t.wt.calc.map((c) => `${c.n} = ${c.how}`).join(" · ") || "없음"}`, "근거:", ...(ev.length ? ev : ["  (없음)"]), "걸린 까닭:", ...ws.map((s) => `  - ${s}`)].join("\n");
  });
  const avail = [...r.x.passages.values()].map((p) => `${p.key} | ${p.cont ? "(앞 구절에서 이어짐) " : ""}${oneLine(p.quote)}`);
  const user = `${blocks.join("\n\n")}\n\n## 쓸 수 있는 구절 (키 | 원문 글자 그대로)\n${avail.join("\n")}\n\n위 ${blocks.length} 덩이를 고쳐라.`;
  return { q: { model: writeModelOf(r.x.input).repair, effort: FLOW_MODELS.repair.effort, system: FLOW_REPAIR_SYSTEM, user, schema: FLOW_REPAIR_SCHEMA, max_tokens: FLOW_MODELS.repair.max_tokens, version: FLOW_REPAIR_VERSION }, ids: [...why.keys()], bare };
}
async function callRepair(code: string, mode: Mode, budget: Budget) {
  const r = build(code);
  const rq = repairReq(r);
  const structural = r.v.errors.filter((e) => !BLOCK_FIXABLE.has(e.code)).map((e) => `${e.code} ${e.path}: ${e.message}`);
  if (!rq) return void console.log(`short-flow ${code} --repair-call — 고칠 덩이가 없다${structural.length ? ` (덩이 하나의 일이 아닌 문제 ${structural.length} — 사람이 보거나 글을 다시 부른다: ${structural.join(" / ")})` : ""}`);
  const tok = (await countTokens(rq.q)) ?? Math.round(rq.q.user.length / 1.6);
  const e = est(rq.q.model, tok, 4000);
  console.log(`short-flow ${code} --repair-call — ${rq.q.version} · ${rq.q.model} · ${rq.q.effort} · 덩이 ${rq.ids.length} (${rq.ids.join(" · ")}) · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  if (rq.bare.length) console.log(`  덩이 하나의 일이 아닌 문제 ${rq.bare.length} — 고치기에 넣지 않았다: ${rq.bare.join(" / ")}`);
  const a = callReq(r.x, `FLOW-REPAIR(${rq.ids.length})`, rq.q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(r.x, "repair", `repair.${String(readRaws(r.x, "repair").length + 1).padStart(2, "0")}.${sha256(rq.q.user).slice(0, 12)}`, a, res!);
}

// ── 명령 ─────────────────────────────────────────────────────────────────────────────────────────────
const outJson = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
function storyFile(r: Built) {
  const s = [...r.x.srcs.values()];
  return outJson({
    _source: {
      what: `짧은 이야기 새 꼴 「${oneLine(r.written.cover.title.t)}」 — 파이프라인이 낸 것 (P-S2 · short-flow.ts). 골든이 아니다. 사람 게이트 (human.json) 전에는 내지 않는다`,
      made_by: `글 ${r.lw.raw.prompt_version} · ${r.lw.raw.model} (${r.lw.raw.effort}) · 고치기 ${readRepairs(r.x).length ? `${FLOW_REPAIR_VERSION} · ${writeModelOf(r.x.input).repair}` : "없음"} · 사람의 고침 ${(r.human?.edits ?? []).length}`,
      event_code: r.x.input.event, picked_from: `packages/pipeline/data/collect/days/${r.x.input.pick.date}/sheet.md ${r.x.input.pick.id}`,
      documents: `packages/pipeline/data/events/${r.x.input.event}/store.documents.json (${s.map((y) => y.label).join(" · ")})`,
      human_gate: r.human?.ok === true ? `넘김 — ${r.human.by ?? ""}` : "아직",
    },
    ...r.b.story,
  });
}
async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a, i) => !a.startsWith("--") && !["--step", "--budget"].includes(argv[i - 1] ?? ""));
  if (!code) throw new Error("짧은 이야기 code 를 준다 — 예: short-flow license-notice-flow (data/shorts/<code>.json)");
  const mode = modeArg(argv);
  if (argv.includes("--count")) {
    const x = loadFlow(code), q = writeReq(x);
    const tok = await countTokens(q);
    console.log(`short-flow ${code} --count — 글 요청 입력 ${tok ?? "?"} 토큰 (프롬프트 ${q.system.length}자 · 입력 ${q.user.length}자 · 구절 ${x.passages.size}) · ${q.model} · 넉넉한 추정 즉시 $${est(q.model, tok ?? 0, 12000).toFixed(2)} · 배치 $${(est(q.model, tok ?? 0, 12000) / 2).toFixed(2)}`);
    return;
  }
  if (argv.includes("--write-call")) return callWrite(code, mode, needBudget(argv));
  if (argv.includes("--entail-call")) return callEntail(code, mode, needBudget(argv));
  if (argv.includes("--repair-call")) return callRepair(code, mode, needBudget(argv));
  const r = build(code);
  if (argv.includes("--read")) {
    console.log(`short-flow ${code} --read — 통독 (독자가 읽는 차례 · 가지는 둘 다)`);
    for (const l of readThrough(r.written)) console.log(l);
    const z = sizeOf(r.written);
    console.log(`  덩이 ${z.blocks} (글 문단 ${z.paras}) · 읽는 길 빈칸 뺀 ${z.path}자 + 접힌 낱말 카드 ${z.cards}자 · 기계 알림 ${r.notices.length}`);
    return;
  }
  const files: [string, string][] = [[join(r.x.out, "story.json"), storyFile(r)], [join(r.x.out, "review.json"), outJson(review(r))]];
  if (argv.includes("--sheet")) {
    writeFileSync(join(r.x.out, "sheet.md"), sheet(r));
    console.log(`short-flow ${code} --sheet — ${join(r.x.out, "sheet.md").replace(ROOT + "/", "")}`);
    return;
  }
  if (argv.includes("--check")) {
    const diff = files.filter(([p, v]) => !existsSync(p) || readFileSync(p, "utf8") !== v).map(([p]) => p.replace(ROOT + "/", ""));
    console.log(diff.length ? `short-flow ${code} --check — 다르다: ${diff.join(" · ")}` : `short-flow ${code} --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)`);
    if (diff.length) process.exitCode = 1;
    return;
  }
  for (const [p, v] of files) writeFileSync(p, v);
  const rv = review(r);
  console.log(`short-flow ${code} — 글 ${r.lw.raw.model} · 덩이 ${rv.size.blocks} (글 문단 ${rv.size.paras}) · 글 덩이 ${rv.entail.texts} (근거 있는 것 ${rv.entail.with_src} · 위험한 글 ${rv.entail.risky}) · 구절 ${Object.keys((r.b.story as { quotes: object }).quotes).length} / ${r.x.passages.size} · 읽는 길 ${rv.size.path}자`);
  console.log(`  계약 검증 ${r.v.ok ? "통과" : `실패 ${r.v.errors.length}`} · 알림 ${r.v.warnings.length} · 함의 본 글 ${rv.entail.judged.length} (걸림 ${rv.entail.judged.filter((j) => BAD.has(j.verdict)).length} · 아직 ${rv.entail.not_judged.length}) · 막힘 ${rv.blocked.length} · 기계 알림 ${r.notices.length} · 낼 수 있나 ${rv.publishable}`);
  for (const b of rv.blocked) console.log(`    ${b.where} ${b.what}: ${b.why}`);
  for (const n of r.notices) console.log(`    알림 [${n.code}] ${n.where}: ${n.message}`);
  for (const n of r.b.notes) console.log(`  메모 ${n}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
