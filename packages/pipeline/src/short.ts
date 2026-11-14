// P-S1 — 파이프라인이 짧은 이야기를 쓴다 (D86 · D88). 발표 하나의 1차 문서에서 짧은 이야기 (docs/contract/EPISODE.md §13 의 ShortStory)를 짓는다.
// 긴 이야기 (episode.ts)를 본뜨되 짧게 · 싸게: P-3 ~ P-5 (사실 그래프 · 슬롯 · 해석)를 돌리지 않는다. 기존 파일은 불러 쓰기만 한다 (llm.ts · episode.ts · episode-prompt.ts · w2.ts · p3.ts · extract.ts).
//
//     pnpm --filter @claro/pipeline short <code> --passages                              # 구절 목록 (모델 없음 — 문서를 문장 · 줄머리로 끊는다. 글자 그대로)
//     pnpm --filter @claro/pipeline short <code> --count                                 # 글 요청의 입력 토큰 · 값 어림 (count_tokens · 값 0)
//     pnpm --filter @claro/pipeline short <code> --write-call  --step S --budget USD     # A 뼈 + 글 (Fable) → raw/write.*.json
//     pnpm --filter @claro/pipeline short <code> --entail-call --step S --budget USD     # B 함의 (Opus low · 위험한 글만 · 저장된 판정이 없는 것만) → raw/entail.*.jsonl
//     pnpm --filter @claro/pipeline short <code> --repair-call --step S --budget USD     # C 걸린 글 고치기 (Opus) → raw/repair.*.json (그 뒤 --entail-call 을 한 번 더)
//     pnpm --filter @claro/pipeline short <code>                                         # 짓기 — 저장한 출력에서 story.json · review.json (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline short <code> --check                                 # 다시 지어 파일과 글자 단위로 같은지
//     pnpm --filter @claro/pipeline short <code> --sheet                                 # 사람 확인지 sheet.md (한 장 — 뒤집기 · 그리지 않을 것 · 숫자 · 구절 · 무게 · 곁 이야기)
//       (모델을 부르는 것은 --step S --budget USD 가 있어야 한다. 기본은 배치 (값이 반) · --now 는 즉시)
//
// 사람 입력   data/shorts/<code>.json — 어느 사건 · 어느 문서 · 선반 (시리즈) · 곁 이야기 · 가리킬 도구 (없으면 null) · 고르기에서 온 한마디
// 출력        data/events/<사건>/shorts/<code>/ — raw/ (모델 출력) · story.json (ShortStory) · review.json · sheet.md · human.json (사람이 적는다)
// 무엇이 어디서 오나
//   구절 (quotes)                          코드 — 저장된 문서 (store.documents.json — 권리가 git 을 허락한 것만)를 끊은 토막. 모델이 구절을 쓰지 않는다 → 지어낸 구절이 없다
//   뼈 (뒤집기의 세기 · 그리지 않을 것 · 사망 · 무게) · 장면 넷의 글        A 출력 (모델) — 글마다 근거 **구절 키**
//   episode_id · series · docs · 화면 말 (문서가 말한 것 · 남음 · 뒤집어 보면) · sibling · tools_from 과 그 글 (null)   코드 · 사람 입력
//   death · weight · 뒤집기가 진짜인가 · 그리지 않을 것 · 선반        **제안일 뿐이다** — 확인지에 올린다 (EPISODE §8). 사람이 human.json 에 ok 를 적기 전에는 "낼 수 있나 = false"
// 검사 (겹): 계약 검증 (validateShortStory — 구절이 문서에 그대로 · 숫자 · 풀이 규칙) → 함의 (B) → 고치기 (C) → 다시 → 사람
// 자동 발행은 없다. 이 파일은 실제 주소 · apps/web 을 건드리지 않는다.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMON, needsEntail2, riskOf } from "./episode.ts";
import { CURRENT, ENTAIL2_SCHEMA, REPAIR_SCHEMA, REPAIR_SYSTEM, WRITE_SCHEMA, deriveVerdict, entailSystem, entailUser, type EVerdict, type Repair, type WT } from "./episode-prompt.ts";
import { sha256 } from "./extract.ts";
import { PRICE, callMany, countTokens, modeArg, needBudget, requestSha, spentOf, type Budget, type CallReq, type Effort, type Mode, type Req } from "./llm.ts";
import { cpLength } from "./match.ts";
import { uuidFrom } from "./p3.ts";
import { SHORT_WRITE_VERSION, STRING_CELLS, parseShort, shortWriteSystem, shortWriteUser, textsOfShort, type ShortWritten } from "./short-prompt.ts";
import { widen } from "./w2.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));

// 모델 배치 (D2 — 단계마다 · D73: 글은 Fable 그대로 · 함의 · 고치기는 Opus). 함의는 low — 문서 하나 · 구절이 짧다 (지시 P-S1 ③)
export const SHORT_MODELS = {
  write: { model: "claude-fable-5-2", effort: "medium" as Effort, max_tokens: 24000 },
  entail: { model: "claude-opus-5-5", effort: "low" as Effort, max_tokens: 6000 },
  repair: { model: "claude-opus-5-5", effort: "medium" as Effort, max_tokens: 12000 },
};
// 화면 말 — 손으로 쓴 견본 (골든 넷째)과 글자가 같게 (이야기마다 새로 쓰지 않는다)
export const SHORT_COMMON = { why_kicker: "문서가 말한 것", keep_kicker: COMMON.keep_kicker, flip_label: COMMON.flip_label, voice_fact: COMMON.voice_fact, voice_explain: COMMON.voice_explain };

// ── 사람 입력 ────────────────────────────────────────────────────────────────────────────────────────
type Ref = { episode_id: string; episode_version: number };
export type ShortInput = {
  code: string; event: string;
  pick: { date: string; id: string; flip_hint: string };                                   // S-2 아침 한 장의 어느 줄에서 왔나 · 그 줄의 뒤집기 후보 (신호일 뿐)
  series: { series_id: string; code: string; name: string; sub: string };                  // 선반 — 사람이 정한다 (제안)
  docs: Record<string, { name: string }>;                                                   // 근거로 쓸 문서 (사건 소스 팩의 label) → 독자에게 보일 이름. git 에 전문이 있는 문서만
  sibling: { episode: Ref; label: string; note: string } | null;                            // 같은 사건의 곁 이야기 — 없으면 null (홀로 선다)
  tools_from: { episode: Ref; keys: string[]; tool_lead: string; map_note: string; gain_label: string } | null;   // 가리킬 도구와 그 글 — 없으면 null
  human_note?: string;                                                                      // 글 단계에 전할 말 (없어도 된다)
};
export type Passage = { key: string; doc: string; source_id: string; quote: string; span_start: number; span_end: number; cont: boolean };
type SourceRow = { source_id: string; label: string; title: string; publisher: string; published_at: string };

// ── 구절 목록 (모델 없음) ────────────────────────────────────────────────────────────────────────────
const PAGE_MARK = /^\s*-\s*\d+\s*-\s*$/u;
const STARTS = /^\s*(□|ㅇ|○|◦|▶|▷|※|\*|#\d+\.|-\s|\d+\.\s|붙임|보도시점|보도 시점|배포)/u;     // 줄머리 — 새 토막이 시작된다
const ALONE = /^\s*(.{0,12}보도자료|보도시점.*|보도 시점.*)\s*$/u;                             // 머리 줄 — 혼자 한 토막
const TAIL = /^\s*(담당\s*부서|담당자|책임자|#[^\d\s])/u;                                      // 여기부터는 연락처 · 해시태그 — 구절로 내지 않는다
const SENT_END = /[가-힣]\.[”"’'」)\]]*\s*$/u;
/** 문서의 글을 구절 토막으로 끊는다 — 글자 그대로 (토막 안의 글자를 지우거나 잇지 않는다 · 자리는 코드 포인트).
 *  끊는 곳: 빈 줄 · 쪽 번호 줄 ("- 2 -") · 줄머리 (□ · # · * · - …) · 문장의 끝 ("다." 뒤). 쪽이 넘어가 끊긴 문장은 두 토막이 되고 뒤 토막에 cont 를 단다.
 *  연락처 (담당 부서 …) 뒤는 내지 않는다. 뜻을 보지 않는다 — 무엇이 사실인지는 글 단계 · 함의 · 사람이 본다 */
export function passagesOf(text: string, doc = "", source_id = ""): Passage[] {
  const chunks: { start: number; end: number; cont: boolean }[] = [];
  let cur: { start: number; end: number; cont: boolean } | null = null;
  let afterPage = false, prevEnded = true, pos = 0;
  const close = () => { if (cur) chunks.push(cur); cur = null; };
  for (const line of text.split("\n")) {
    const start = pos, end = pos + line.length;
    pos = end + 1;
    if (TAIL.test(line)) { close(); break; }
    if (PAGE_MARK.test(line)) { close(); afterPage = true; continue; }
    if (!line.trim()) { close(); prevEnded = true; continue; }
    if (cur && (STARTS.test(line) || prevEnded)) close();
    if (!cur) cur = { start, end, cont: afterPage && !prevEnded && !STARTS.test(line) };
    else cur.end = end;
    afterPage = false;
    prevEnded = SENT_END.test(line) || ALONE.test(line);
    if (ALONE.test(line)) close();
  }
  close();
  const out: Passage[] = [];
  for (const c of chunks) {
    // 토막 안의 문장 끝 ("다." 뒤에 빈칸) 에서 한 번 더 끊는다
    const body = text.slice(c.start, c.end);
    const cuts = [0, ...[...body.matchAll(/(?<=[가-힣]\.[”"’'」)\]]*)\s+(?=\S)/gu)].map((m) => m.index! + m[0].length), body.length];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const raw = body.slice(cuts[i]!, cuts[i + 1]!);
      const lead = raw.length - raw.trimStart().length, quote = raw.trim();
      if (quote.replace(/\s/g, "").length < 6) continue;
      const s = c.start + cuts[i]! + lead;
      out.push({ key: "", doc, source_id, quote, span_start: cpLength(text.slice(0, s)), span_end: cpLength(text.slice(0, s + quote.length)), cont: c.cont && i === 0 });
    }
  }
  return out.map((p, i) => ({ ...p, key: `p${String(i + 1).padStart(2, "0")}` }));
}
const oneLine = (s: string) => s.replace(/\s+/gu, " ").trim();

// ── 읽기 ─────────────────────────────────────────────────────────────────────────────────────────────
export const inputPath = (code: string) => R("packages/pipeline/data/shorts", `${code}.json`);
export function load(code: string) {
  if (!existsSync(inputPath(code))) throw new Error(`짧은 이야기 ${code} 의 사람 입력이 없다 — ${inputPath(code)}`);
  const input = readJson<ShortInput>(inputPath(code));
  if (input.code !== code) throw new Error(`입력의 code ${input.code} ≠ ${code}`);
  const dir = R("packages/pipeline/data/events", input.event);
  const store = readJson<{ events: { event_id: string; code: string; title: string }[]; sources: SourceRow[] }>(join(dir, "store.json"));
  const documents = readJson<{ source_documents: { source_id: string; text: string }[] }>(join(dir, "store.documents.json")).source_documents;
  const event = store.events.find((e) => e.code === input.event);
  if (!event) throw new Error(`사건 ${input.event} 이 store.json 에 없다`);
  const srcs = new Map<string, SourceRow>(), texts = new Map<string, string>();
  const passages: Passage[] = [];
  for (const label of Object.keys(input.docs)) {
    const s = store.sources.find((x) => x.label === label);
    if (!s) throw new Error(`문서 ${label} 이 사건 ${input.event} 의 소스 팩에 없다`);
    const d = documents.find((x) => x.source_id === s.source_id);
    if (!d) throw new Error(`문서 ${label} 의 전문이 store.documents.json 에 없다 — 권리가 git 을 허락한 문서만 근거로 쓴다 (캐시의 글은 쓰지 않는다)`);
    srcs.set(label, s);
    texts.set(label, d.text);
    passages.push(...passagesOf(d.text, label, s.source_id));
  }
  // 지금 실물은 문서 하나다. 둘 이상이면 구절 키가 겹친다 (문서마다 p01 부터) — 그 실물이 생길 때 키의 꼴부터 정한다
  if (Object.keys(input.docs).length !== 1) throw new Error("짧은 이야기의 근거 문서는 지금 하나만 받는다 — 둘 이상인 실물이 없다 (구절 키의 꼴부터 정한다)");
  const out = join(dir, "shorts", code);
  return { code, input, event, dir, out, srcs, texts, passages: new Map(passages.map((p) => [p.key, p])), documents: documents.filter((d) => [...srcs.values()].some((s) => s.source_id === d.source_id)) };
}
export type L = ReturnType<typeof load>;

/** 글 단계의 말투 본보기 — 손으로 쓴 짧은 이야기 (골든 넷째 — 영훈의료재단 · 다른 사건). 근거 표시는 뺀다 (글자만 · 꼬리표는 남긴다) */
export function exemplarShort(): string {
  const g = readJson<Record<string, any>>(R("fixtures/episode-short-privacy-yeonghun.json"));
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.t === "string" && Object.keys(o).every((k) => ["t", "src", "calc", "ui", "voice"].includes(k))) return o.voice ? `${o.t} 〔${o.voice}〕` : o.t;
      return Object.fromEntries(Object.entries(o).filter(([k]) => !["src", "tool_lead", "map_note", "gain_label"].includes(k)).map(([k, w]) => [k, strip(w)]));
    }
    return v;
  };
  const e = g.solve.entry;
  return JSON.stringify(strip({ cover: g.scenes.cover, plain: { title: g.solve.plain.title }, entry: { first_thought: e.first_thought, breaker: e.breaker, flip: e.flip, whose: e.whose, not_drawn: e.not_drawn }, where: g.scenes.where, why: g.scenes.why, keep: g.scenes.keep }), null, 1);
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
    _what: `짧은 이야기 단계의 모델 출력 (${kind} — short.ts 가 쓴다 · 손으로 고치지 않는다). 프롬프트 ${kind === "write" ? "src/short-prompt.ts" : "src/episode-prompt.ts"} ${a.prompt_version}`,
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
  const user = shortWriteUser({ event_title: x.event.title, doc_name: x.input.docs[label]!.name, published_at: String(s.published_at), passages: [...x.passages.values()].map((p) => ({ key: p.key, quote: oneLine(p.quote), cont: p.cont })), human });
  return { model: SHORT_MODELS.write.model, effort: SHORT_MODELS.write.effort, system: shortWriteSystem(exemplarShort()), user, schema: WRITE_SCHEMA, max_tokens: SHORT_MODELS.write.max_tokens, version: SHORT_WRITE_VERSION };
}

// ── 사람 게이트 (human.json — 사람이 적는다. 기계는 읽기만) ──────────────────────────────────────────
export type ShortHuman = {
  ok?: boolean; by?: string; minutes?: number;
  flip_ok?: boolean; not_drawn_ok?: boolean; weight_ok?: boolean; series_ok?: boolean; death_checked?: boolean;
  edits?: { id: string; t: string; src?: string[]; calc?: { n: string; how: string }[]; why: string }[];   // 글 덩이 (T) · 맨 글자열 칸의 id 그대로
  drops?: string[];                                                                                         // where.body[i] · why.real[i]
  not_drawn?: string[];                                                                                     // 있으면 모델의 그리지 않을 것을 통째로 갈음한다
  note?: string;
};
export function readHuman(x: L): ShortHuman | null {
  const p = join(x.out, "human.json");
  return existsSync(p) ? readJson<ShortHuman>(p) : null;
}

type RepairLine = Repair["items"][number] & { round: number };
function readRepairs(x: L): RepairLine[] {
  return readRaws(x, "repair").flatMap((r, i) => (JSON.parse(r.output) as Repair).items.map((it) => ({ ...it, round: i + 1 })));
}
const DROPPABLE = /^(where\.body|why\.real)\[\d+\]$/;
/** 고치기 출력 · 사람의 고침을 얹는다 (round 차례 · 사람은 맨 뒤 = round 0). 맨 글자열 칸은 사람만 고친다 */
export function applyShortRepairs(w: ShortWritten, repairs: RepairLine[], human: ShortHuman | null): { written: ShortWritten; touched: Set<string>; applied: (RepairLine & { before: string })[]; unknown: string[] } {
  const out = structuredClone(w);
  const byId = new Map(textsOfShort(out).map((t) => [t.id, t.wt]));
  const touched = new Set<string>(), applied: (RepairLine & { before: string })[] = [], unknown: string[] = [];
  // 사람이 src · calc 를 안 적으면 그 칸은 그대로 둔다 (글만 고친다)
  const all: (RepairLine & { setSrc: boolean; setCalc: boolean })[] = [
    ...repairs.map((r) => ({ ...r, setSrc: true, setCalc: true })),
    ...(human?.edits ?? []).map((e) => ({ id: e.id, action: "fix" as const, t: e.t, src: e.src ?? [], calc: e.calc ?? [], why: `사람: ${e.why}`, round: 0, setSrc: !!e.src, setCalc: !!e.calc })),
  ];
  for (const { setSrc, setCalc, ...r } of all) {
    const wt = byId.get(r.id);
    if (wt) {
      applied.push({ ...r, before: wt.t });
      if (r.action !== "fix") continue;
      wt.t = r.t;
      if (setSrc) wt.src = r.src.filter((k) => /^p\d+$/.test(k));
      if (setCalc) wt.calc = r.calc;
      touched.add(r.id);
    } else if (r.round === 0 && STRING_CELLS.includes(r.id)) {
      const [a, b] = r.id.split(".") as [string, string | undefined];
      const o = out as unknown as Record<string, any>;
      const before = b ? o[a][b] : o[a];
      if (b) o[a][b] = r.t; else o[a] = r.t;
      applied.push({ ...r, before });
    } else unknown.push(r.id);
  }
  for (const id of [...new Set(human?.drops ?? [])].filter((d) => DROPPABLE.test(d)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
    const m = /^(where\.body|why\.real)\[(\d+)\]$/.exec(id)!;
    (m[1] === "where.body" ? out.where.body : out.why.real).splice(Number(m[2]), 1);
  }
  if (human?.not_drawn?.length) out.design.not_drawn = human.not_drawn;
  return { written: out, touched, applied, unknown };
}

// ── 짓기 ─────────────────────────────────────────────────────────────────────────────────────────────
const T = (wt: WT) => ({
  t: wt.t,
  ...(wt.src.length ? { src: wt.src } : {}),
  ...(wt.calc.length ? { calc: Object.fromEntries(wt.calc.map((c) => [c.n, c.how])) } : {}),
  ...(wt.src.length && wt.voice !== "none" ? { voice: wt.voice } : {}),
});
/** ShortWritten → 계약의 ShortStory (EPISODE §13). 구절은 글이 가리킨 것만 싣는다 (문서의 차례대로) */
export function assembleShort(x: L, w: ShortWritten): { story: Record<string, unknown>; notes: string[] } {
  const notes: string[] = [];
  const used = new Set(textsOfShort(w).flatMap((t) => t.wt.src));
  for (const k of used) if (!x.passages.has(k)) notes.push(`글이 가리킨 구절 ${k} 가 구절 목록에 없다 — 계약 검증이 거부한다 (REF_QUOTE)`);
  const quotes = Object.fromEntries([...x.passages.values()].filter((p) => used.has(p.key)).map((p) => [p.key, { doc: p.doc, quote: oneLine(p.quote) }]));
  const docsUsed = new Set(Object.values(quotes).map((q) => q.doc));
  const docs = Object.fromEntries([...x.srcs.entries()].filter(([l]) => docsUsed.has(l)).map(([l, s]) => [l, { source_id: s.source_id, name: x.input.docs[l]!.name }]));
  const tf = x.input.tools_from;
  const story = {
    episode_id: uuidFrom(`short:${x.code}`), episode_version: 1, code: x.code, event_ref: x.event.event_id, weight: "short",
    series: x.input.series,
    sibling: x.input.sibling,
    docs, quotes,
    voice_labels: { fact: SHORT_COMMON.voice_fact, official: w.voice_official, explain: SHORT_COMMON.voice_explain },
    tools_from: tf ? { episode: tf.episode, keys: tf.keys } : null,
    scenes: {
      cover: { title: w.cover.title, dek: T(w.cover.dek), meta: T(w.cover.meta), hint: T(w.cover.hint), ask: w.cover.ask },
      where: { kicker: w.where.kicker, body: w.where.body.map(T), unknown: T(w.where.unknown), ask: w.where.ask },
      why: {
        kicker: SHORT_COMMON.why_kicker, title: w.why.title, lead: T(w.why.lead), real_label: w.why.real_label, real: w.why.real.map((r) => ({ head: T(r.head), body: T(r.body) })),
        verdict: T(w.why.verdict), tool_lead: tf ? tf.tool_lead : null, ask: w.why.ask,
      },
      keep: { kicker: SHORT_COMMON.keep_kicker, title: w.keep.title, line: w.keep.line, advice_label: w.keep.advice_label, advice: T(w.keep.advice), map_note: tf ? tf.map_note : null, gain_label: tf ? tf.gain_label : null },
    },
    solve: {
      entry: {
        first_thought: T(w.entry.first_thought), breaker: T(w.entry.breaker),
        flip: { label: SHORT_COMMON.flip_label, a: w.entry.flip_a, op: w.entry.flip_op, b: w.entry.flip_b, note: T(w.entry.flip_note) },
        not_drawn: w.design.not_drawn, whose: T(w.entry.whose), death: w.design.death,
      },
      plain: { kind: "flip", why: "short", title: w.plain.title },
    },
  };
  return { story, notes };
}

export type Issue = { code: string; path: string; message: string };
export function validateShort(story: unknown, x: L): { ok: boolean; errors: Issue[]; warnings: Issue[]; stats: unknown } {
  mkdirSync(x.out, { recursive: true });
  const tmp = join(x.out, `.validate-input.${process.pid}.json`);
  writeFileSync(tmp, JSON.stringify({ story, documents: x.documents }));
  try {
    return JSON.parse(execFileSync(R("apps/web/node_modules/.bin/tsx"), [R("packages/pipeline/src/short-validate.ts"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally { unlinkSync(tmp); }
}

// ── 함의 (episode-entail/2 그대로 — Opus low · 위험한 글만) ──────────────────────────────────────────
type Judged = { verdict: EVerdict; issues: { part: string; kind: string; where: string; why: string }[]; note: string };
type EntailLine = { id: string; text_sha256: string; request_sha256: string; model: string | null; model_requested: string; effort: string; prompt_version: string; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number; called_at: string; ok: boolean; error: string | null; output: string | null; mode?: "batch"; batch_id?: string };
const entailPath = (x: L) => join(rawDir(x), `entail.${SHORT_MODELS.entail.model}.${SHORT_MODELS.entail.effort}.jsonl`);
const readEntail = (x: L): EntailLine[] => (existsSync(entailPath(x)) ? readFileSync(entailPath(x), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
export function entailReqShort(x: L, id: string, wt: WT): (Req & { version: string }) | null {
  const evidence = wt.src.flatMap((k) => (x.passages.has(k) ? [x.passages.get(k)!] : [])).map((p) => {
    const s = x.srcs.get(p.doc)!;
    return { title: x.input.docs[p.doc]!.name, publisher: s.publisher, published_at: String(s.published_at), passage: oneLine(p.quote), context: widen(x.texts.get(p.doc)!, p.span_start, p.span_end) };
  });
  if (!evidence.length) return null;
  return { model: SHORT_MODELS.entail.model, effort: SHORT_MODELS.entail.effort, system: entailSystem(CURRENT.entail), user: entailUser({ t: wt.t, voice: wt.voice, calc: wt.calc, where: id }, evidence), schema: ENTAIL2_SCHEMA, max_tokens: SHORT_MODELS.entail.max_tokens, version: CURRENT.entail };
}
function judgementOf(lines: EntailLine[], req: Req): Judged | null {
  const want = requestSha(req);
  const hit = lines.filter((l) => l.request_sha256 === want && l.ok && l.output != null).at(-1);
  if (!hit) return null;
  const j = JSON.parse(hit.output!) as Judged;
  return j.verdict === "CANNOT_JUDGE" ? j : { ...j, verdict: deriveVerdict(j.issues) };
}
const BAD = new Set<EVerdict>(["EXCEEDS", "CONTRADICTS", "UNDER_SOURCED"]);

// ── 지은 결과 ────────────────────────────────────────────────────────────────────────────────────────
export function latestWrite(x: L): { raw: Raw; written: ShortWritten; problems: string[] } | null {
  const raw = readRaws(x, "write").filter((r) => r.prompt_version === SHORT_WRITE_VERSION).at(-1);
  return raw ? { raw, ...parseShort(raw.output) } : null;
}
export function build(code: string) {
  const x = load(code);
  const lw = latestWrite(x);
  if (!lw) throw new Error(`짧은 이야기 ${code} — 글 출력이 없다. 먼저 --write-call`);
  const human = readHuman(x);
  const rep = applyShortRepairs(lw.written, readRepairs(x), human);
  const b = assembleShort(x, rep.written);
  const v = validateShort(b.story, x);
  const texts = textsOfShort(rep.written);
  const stored = readEntail(x);
  const judged = texts.map((t) => {
    const risky = needsEntail2(t.wt, rep.touched.has(t.id));
    const q = risky ? entailReqShort(x, t.id, t.wt) : null;
    return { id: t.id, wt: t.wt, risk: riskOf(t.wt, rep.touched.has(t.id)), need: !!q, q, judgement: q ? judgementOf(stored, q) : null };
  });
  return { x, lw, human, rep, b, v, texts, judged, written: rep.written };
}
type Built = ReturnType<typeof build>;

/** 맛을 기계가 세는 것 (세기만 한다 · 막지 않는다) — episode.ts tasteChecks 의 규칙 가운데 짧은 이야기에 맞는 것 */
export const DATED = /지난달|어제|오늘 아침|이번 주|지난주|최근|얼마 전|며칠 전/;
export function tasteShort(texts: { id: string; wt: WT }[], w: ShortWritten): string[] {
  const out: string[] = [];
  const sent = (t: string) => t.replace(/\*\*/g, "").split(/(?<=[.?!])["”’']?\s+(?=\S)/u).filter((y) => y.trim().length > 1);
  const long = texts.filter((t) => sent(t.wt.t).length > 3);
  if (long.length) out.push(`세 문장을 넘는 덩이 ${long.length}: ${long.map((t) => `${t.id} (${sent(t.wt.t).length})`).join(" · ")}`);
  const bold = texts.filter((t) => (t.wt.t.match(/\*\*/g) ?? []).length > 2);
  if (bold.length) out.push(`굵게가 둘 이상인 덩이 ${bold.length}: ${bold.map((t) => t.id).join(" · ")}`);
  const dated = texts.filter((t) => DATED.test(t.wt.t));
  if (dated.length) out.push(`발행일에 걸린 말 ${dated.length}: ${dated.map((t) => t.id).join(" · ")}`);
  const jargon = ["재결", "인용", "처분청", "청구인", "위법·부당", "위법ㆍ부당"];
  const j = texts.filter((t) => jargon.some((g) => t.wt.t.includes(g)));
  if (j.length) out.push(`관청의 말이 그대로 든 덩이 ${j.length}: ${j.map((t) => `${t.id} (${jargon.filter((g) => t.wt.t.includes(g)).join(" · ")})`).join(" · ")}`);
  if (/없어요\.?$/.test(w.entry.flip_note.t.trim()) || /없다\.?$/.test(w.keep.line.trim())) out.push("맺음이 “없어요”로 끝난다 (뒤집기의 풀이 · 남는 한 줄)");
  const chars = texts.reduce((a, t) => a + t.wt.t.replace(/\s/g, "").length, 0);
  out.push(`독자 글 덩이 ${texts.length} · 빈칸 뺀 글자 ${chars} (손 견본 영훈: 덩이 18 · 글자 ${EXEMPLAR_CHARS()})`);
  return out;
}
const EXEMPLAR_CHARS = () => {
  const g = readJson<Record<string, unknown>>(R("fixtures/episode-short-privacy-yeonghun.json"));
  let n = 0;
  const walk = (v: unknown) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") { const o = v as Record<string, unknown>; if (typeof o.t === "string") n += o.t.replace(/\s/g, "").length; else Object.entries(o).forEach(([k, w]) => !k.startsWith("_") && k !== "quotes" && k !== "docs" && walk(w)); } };
  walk(g);
  return n;
};

export function review(r: Built) {
  const blocked = [
    ...r.v.errors.map((e) => ({ where: e.path, what: e.code, why: e.message })),
    ...r.judged.filter((j) => j.judgement && BAD.has(j.judgement.verdict)).map((j) => ({ where: j.id, what: `함의 ${j.judgement!.verdict}`, why: j.judgement!.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ") })),
    ...r.lw.problems.map((p) => ({ where: "write", what: "칸", why: p })),
    ...r.rep.unknown.map((id) => ({ where: id, what: "고침", why: "모르는 칸 id — 얹지 못했다" })),
  ];
  const notJudged = r.judged.filter((j) => j.need && !j.judgement).map((j) => j.id);
  const h = r.human;
  const humanOk = h?.ok === true && h.flip_ok === true && h.not_drawn_ok === true && h.weight_ok === true && h.series_ok === true && h.death_checked === true;
  return {
    _what: "짧은 이야기의 검사 결과 · 사람이 확인할 것 (short.ts 가 쓴다 — 손으로 고치지 않는다). 사람의 확인은 같은 폴더 human.json 에",
    short: r.x.code, event: r.x.input.event, write: { prompt_version: r.lw.raw.prompt_version, model: r.lw.raw.model, effort: r.lw.raw.effort, request_sha256: r.lw.raw.request_sha256 },
    contract: { ok: r.v.ok, errors: r.v.errors, warnings: r.v.warnings, stats: r.v.stats },
    entail: {
      prompt_version: CURRENT.entail, model: SHORT_MODELS.entail.model, effort: SHORT_MODELS.entail.effort,
      texts: r.texts.length, with_src: r.texts.filter((t) => t.wt.src.length).length, risky: r.judged.filter((j) => j.need).length,
      judged: r.judged.filter((j) => j.judgement).map((j) => ({ id: j.id, risk: j.risk, verdict: j.judgement!.verdict, issues: j.judgement!.issues })),
      not_judged: notJudged, low_risk_skipped: r.judged.filter((j) => !j.need && j.wt.src.length).map((j) => j.id),
    },
    repairs: r.rep.applied.map((a) => ({ id: a.id, round: a.round, action: a.action, before: a.before, after: a.action === "fix" ? a.t : a.before, why: a.why })),
    human_cells: {
      flip: { proposal: `${r.written.entry.flip_a} ${r.written.entry.flip_op} ${r.written.entry.flip_b}`, strength: r.written.design.flip_strength, basis: r.written.design.flip_basis, basis_src: r.written.design.flip_basis_src, ok: h?.flip_ok ?? null },
      not_drawn: { proposal: r.written.design.not_drawn, ok: h?.not_drawn_ok ?? null },
      death: { proposal: r.written.design.death, checked: h?.death_checked ?? null },
      weight: { proposal: r.written.design.weight, why: r.written.design.weight_why, ok: h?.weight_ok ?? null },
      series: { proposal: r.x.input.series, ok: h?.series_ok ?? null },
      sibling: r.x.input.sibling, tools_from: r.x.input.tools_from,
    },
    blocked, publishable: r.v.ok && blocked.length === 0 && notJudged.length === 0 && humanOk,
  };
}

// ── 사람 확인지 (한 장) ──────────────────────────────────────────────────────────────────────────────
export function sheet(r: Built): string {
  const rv = review(r), w = r.written, d = w.design;
  const q = (k: string) => { const p = r.x.passages.get(k); return p ? `\`${k}\` “${oneLine(p.quote)}”` : `\`${k}\` (구절 목록에 없음)`; };
  const digits = r.texts.filter((t) => /\d/.test(t.wt.t));
  const src = (wt: WT) => (wt.src.length ? ` ← ${wt.src.join(" ")}` : "");
  const flow: [string, string][] = [
    ["표지 · 제목", oneLine(w.cover.title)], ["표지 · 한 줄", w.cover.dek.t + src(w.cover.dek)], ["표지 · 날", w.cover.meta.t + src(w.cover.meta)], ["표지 · 귀띔", w.cover.hint.t], ["Q", w.cover.ask],
    [`어디가 (${w.where.kicker}) · 머리`, oneLine(w.plain.title)], ["이렇게 생각하기 쉬워요", w.entry.first_thought.t], ["그런데 문서에는", w.entry.breaker.t + src(w.entry.breaker)],
    ...w.where.body.map((b, i): [string, string] => [`아래 글 ${i + 1}`, b.t + src(b)]),
    ["뒤집기", `**${w.entry.flip_a} ${w.entry.flip_op} ${w.entry.flip_b}**`], ["뒤집기의 풀이", w.entry.flip_note.t + src(w.entry.flip_note)], ["문서에 없는 것", w.where.unknown.t], ["Q", w.where.ask],
    ["문서가 말한 것 · 머리", oneLine(w.why.title)], ["이끄는 글", w.why.lead.t + src(w.why.lead)],
    ...w.why.real.map((x0, i): [string, string] => [`${w.why.real_label} ${i + 1}`, `**${x0.head.t}** — ${x0.body.t}${src(x0.body)}`]),
    ["판정", w.why.verdict.t + src(w.why.verdict)], ["누구의 말", w.entry.whose.t], ["Q", w.why.ask],
    ["남음 · 머리", oneLine(w.keep.title)], ["남는 한 줄", oneLine(w.keep.line)], [w.keep.advice_label, w.keep.advice.t + src(w.keep.advice)],
  ];
  const usedKeys = [...new Set(r.texts.flatMap((t) => t.wt.src))].sort();
  const L: string[] = [
    `# 짧은 이야기 확인지 — 「${oneLine(w.cover.title)}」 (${r.x.code})`,
    "",
    `내기 전에 사람 (편집자)이 본다 — 10분 안쪽. 고칠 글은 같은 폴더 \`human.json\` 의 \`edits\` 에 \`{ id, t, why }\` (근거를 바꾸려면 \`src\`), 다 보면 칸마다 \`true\`. 고친 것은 \`logs/correction-log.jsonl\` 에도 한 줄.`,
    `사건 ${r.x.input.event} · 고른 곳 S-2 아침 한 장 ${r.x.input.pick.date} ${r.x.input.pick.id} · 글 ${r.lw.raw.prompt_version} · ${r.lw.raw.model} · 글 덩이 ${rv.entail.texts} (근거 있는 것 ${rv.entail.with_src}) · 계약 검증 ${r.v.ok ? "통과" : `**실패 ${r.v.errors.length}**`} · 함의 본 글 ${rv.entail.judged.length} / 위험한 글 ${rv.entail.risky}`,
    "",
    `## 1. 막힘 ${rv.blocked.length} — 고치거나 뺀다`,
    ...(rv.blocked.length ? rv.blocked.map((b) => `- \`${b.where}\` **${b.what}** — ${b.why}`) : ["- 없음"]),
    ...(rv.entail.not_judged.length ? [`- **함의를 아직 못 본 글 ${rv.entail.not_judged.length}** — \`--entail-call\` 을 한 번 더, 또는 직접 읽는다: ${rv.entail.not_judged.join(" · ")}`] : []),
    "",
    "## 2. 뒤집기가 진짜인가 (가장 중요 — `flip_ok`)",
    `- **${w.entry.flip_a} ${w.entry.flip_op} ${w.entry.flip_b}** · 모델이 본 세기: **${d.flip_strength}**`,
    `- 첫 생각: ${w.entry.first_thought.t}`,
    `  - 왜 그렇게 생각하기 쉬운가 (모델): ${d.first_thought_why}`,
    `- 깨는 사실: ${w.entry.breaker.t}`,
    ...w.entry.breaker.src.map((k) => `  - ${q(k)}`),
    `- 뒤집기가 서 있는 곳 (모델): ${d.flip_basis}`,
    ...d.flip_basis_src.map((k) => `  - ${q(k)}`),
    `- 아침 한 장의 뒤집기 후보 (제목만 본 신호): ${r.x.input.pick.flip_hint || "-"}`,
    "- 볼 것: 보통 사람이 정말 그렇게 생각하나 · 뒤쪽 말이 틀렸다는 것을 **문서가** 받치나 (문서가 말하지 않은 것으로 뒤집지 않았나) · 억지가 아닌가",
    "",
    "## 3. 그리지 않을 것 (`not_drawn_ok`) — 글이 이 선을 넘지 않았나",
    ...d.not_drawn.map((n) => `- ${n}`),
    "- 문서에 없는 것 (모델이 적은 것):",
    ...d.unknown.map((n) => `  - ${n}`),
    "",
    `## 4. 숫자 — 숫자가 든 글 ${digits.length} (코드가 구절 · 계산과 댔다 — 그 수가 **무엇의** 수인지는 사람이)`,
    ...(digits.length ? digits.flatMap((t) => [`- \`${t.id}\` ${t.wt.t}`, ...t.wt.calc.map((c) => `  - 계산 ${c.n} = ${c.how}`), ...t.wt.src.map((k) => `  - ${q(k)}`)]) : ["- 없음"]),
    "",
    `## 5. 구절 — 쓴 구절 ${usedKeys.length} / 문서의 구절 ${r.x.passages.size} (전부 git 에 있는 문서의 글자 그대로 — 계약 검증이 댔다)`,
    ...Object.entries(r.x.input.docs).map(([l, v]) => `- 문서 \`${l}\` ${v.name} · ${r.x.srcs.get(l)!.publisher} · 공개 ${r.x.srcs.get(l)!.published_at}`),
    ...usedKeys.map((k) => `  - ${q(k)}${r.x.passages.get(k)?.cont ? " (쪽이 넘어가 끊긴 뒤 토막)" : ""}`),
    "",
    "## 6. 함의 — 위험한 글마다 (Opus)",
    ...(rv.entail.judged.length ? rv.entail.judged.map((j) => `- \`${j.id}\` [${j.risk.join(" · ")}] **${j.verdict}**${j.issues.length ? ` — ${j.issues.map((i) => `“${i.part}” ${i.where}: ${i.why}`).join(" / ")}` : ""}`) : ["- 아직 없음"]),
    `- 위험하지 않아 건너뛴 글 (근거는 있다): ${rv.entail.low_risk_skipped.join(" · ") || "-"}`,
    ...(rv.repairs.length ? ["", `## 고친 글 ${rv.repairs.length}`, ...rv.repairs.map((f) => `- \`${f.id}\` (${f.round === 0 ? "사람" : `고치기 ${f.round}`} · ${f.action})\n  - 앞: ${oneLine(f.before)}\n  - 뒤: ${oneLine(f.after)}\n  - ${f.why}`)] : []),
    "",
    "## 7. 사람 칸 — 무게 · 사망 · 선반 · 곁 이야기",
    `- 무게 (\`weight_ok\`): 모델의 제안 **${d.weight}** — ${d.weight_why}`,
    `- 사망 (\`death_checked\`): 모델의 제안 **${d.death}** (사람이 숨진 사건이면 짧은 이야기로 낼 수 없다 — EPISODE §13.6)`,
    `- 선반 (\`series_ok\`): 「${r.x.input.series.name}」 (${r.x.input.series.code}) — 작업 세션의 제안이다. 이미 있는 선반에 놓을지 · 새 선반의 이름을 사람이 정한다`,
    `- 곁 이야기: ${r.x.input.sibling ? `${r.x.input.sibling.label} — ${r.x.input.sibling.note}` : "**없음 (홀로 선 짧은 이야기)** — 같은 사건의 긴 이야기가 없다"}`,
    `- 가리킨 도구: ${r.x.input.tools_from ? r.x.input.tools_from.keys.join(" · ") : "**없음** — 도구 카드 · 지도가 없다. 개념은 글 안에서 풀었다"} · 모델이 적은 개념 (도구 후보): ${d.concepts.join(" · ") || "-"}`,
    "",
    "## 8. 통독 (맛) — 화면의 차례대로",
    ...flow.map(([k, v]) => `- **${k}** ${v}`),
    ...tasteShort(r.texts, w).map((t) => `- 기계가 센 것 — ${t}`),
    "- 볼 것: 수수께끼가 걸리나 · 같은 말이 되풀이되나 · 관청의 말이 남았나 · 맺음이 “없어요”로 끝나나 · 손 견본 (영훈)의 결인가",
    "",
    "## human.json 에 적을 것",
    "```json",
    JSON.stringify({ ok: false, by: "", minutes: 0, flip_ok: false, not_drawn_ok: false, weight_ok: false, series_ok: false, death_checked: false, edits: [{ id: "", t: "", why: "" }], drops: [], note: "" }, null, 2),
    "```",
    `지금 상태: 낼 수 있나 = **${rv.publishable}** (계약 ${r.v.ok ? "통과" : "실패"} · 막힘 ${rv.blocked.length} · 함의 못 본 글 ${rv.entail.not_judged.length} · 사람 확인 ${r.human?.ok === true ? "넘김" : "아직"})`,
  ];
  return L.join("\n") + "\n";
}

// ── 모델 부르기 ──────────────────────────────────────────────────────────────────────────────────────
async function callWrite(code: string, mode: Mode, budget: Budget) {
  const x = load(code);
  const q = writeReq(x);
  const tok = (await countTokens(q)) ?? Math.round((q.system.length + q.user.length) / 1.6);
  const e = est(q.model, tok, 12000);
  console.log(`short ${code} --write-call — ${q.version} · ${q.model} · ${q.effort} · 구절 ${x.passages.size} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(x, "SHORT-WRITE", q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(x, "write", `write.${q.model}.${q.effort}.${requestSha(q).slice(0, 12)}`, a, res!);
}
const entailEst = (q: Req) => est(q.model, Math.round((q.system.length + q.user.length) / 1.6), 1500);
async function callEntail(code: string, mode: Mode, budget: Budget) {
  const r = build(code);
  const todo = r.judged.filter((j) => j.need && !j.judgement);
  if (!todo.length) return void console.log(`short ${code} --entail-call — 볼 글이 없다 (저장된 판정이 전부 지금 글과 같다)`);
  const total = todo.reduce((a, j) => a + entailEst(j.q!), 0);
  console.log(`short ${code} --entail-call — ${CURRENT.entail} · ${SHORT_MODELS.entail.model} · ${SHORT_MODELS.entail.effort} · 글 ${todo.length} (전체 ${r.texts.length} 가운데 위험한 글 ${r.judged.filter((j) => j.need).length}) · 넉넉한 추정 $${(total * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const rs = await callMany(todo.map((j) => callReq(r.x, `SHORT-ENTAIL(${j.id})`, j.q!, entailEst(j.q!))), { mode, budget, conc: 4 });
  mkdirSync(rawDir(r.x), { recursive: true });
  let cost = 0, n = 0;
  rs.forEach((res, i) => {
    if (res.skipped) return;
    const line: EntailLine = { id: todo[i]!.id, text_sha256: sha256(todo[i]!.wt.t), request_sha256: res.request_sha256, model: res.model, model_requested: SHORT_MODELS.entail.model, effort: SHORT_MODELS.entail.effort, prompt_version: CURRENT.entail, stop_reason: res.stop_reason, usage: res.usage, duration_ms: res.duration_ms, cost_usd: Number(res.cost_usd.toFixed(6)), called_at: new Date().toISOString(), ok: res.ok, error: res.error, output: res.text, ...(res.mode === "batch" ? { mode: res.mode, batch_id: res.batch_id! } : {}) };
    appendFileSync(entailPath(r.x), JSON.stringify(line) + "\n");
    cost += res.cost_usd; n++;
  });
  console.log(`  받은 판정 ${n} / ${todo.length} · $${cost.toFixed(3)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)}`);
}
async function callRepair(code: string, mode: Mode, budget: Budget) {
  const r = build(code);
  const why = new Map<string, string[]>();
  const push = (id: string, s: string) => why.set(id, [...(why.get(id) ?? []), s]);
  for (const j of r.judged) if (j.judgement && BAD.has(j.judgement.verdict)) push(j.id, `함의 (${j.judgement.verdict}): ${j.judgement.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ")}`);
  const pathToId = new Map(textPaths(r.written));
  const bare: string[] = [];
  for (const e of r.v.errors) {
    const id = pathToId.get(e.path);
    if (id && e.code === "NUMBER_UNGROUNDED") push(id, `숫자: ${e.message}`);
    else bare.push(`${e.code} ${e.path}: ${e.message}`);
  }
  if (!why.size) return void console.log(`short ${code} --repair-call — 고칠 글이 없다${bare.length ? ` (글 덩이가 아닌 문제 ${bare.length} — 사람이 본다: ${bare.join(" / ")})` : ""}`);
  const byId = new Map(r.texts.map((t) => [t.id, t.wt]));
  const blocks = [...why.entries()].map(([id, ws]) => {
    const wt = byId.get(id)!;
    const ev = wt.src.flatMap((k) => (r.x.passages.has(k) ? [r.x.passages.get(k)!] : [])).map((p) => `  ${p.key} · ${r.x.input.docs[p.doc]!.name} — 구절: ${oneLine(p.quote)}\n     둘레: ${widen(r.x.texts.get(p.doc)!, p.span_start, p.span_end)}`);
    return [`## ${id}`, `자리: ${id}${DROPPABLE.test(id) ? " (뺄 수 있는 줄)" : " (필수 칸 — 뺄 수 없다)"}`, `지금 글: ${wt.t}`, `꼬리표: ${wt.voice}`, `근거 label: ${wt.src.join(" ") || "없음"}`, `calc: ${wt.calc.map((c) => `${c.n} = ${c.how}`).join(" · ") || "없음"}`, "근거:", ...(ev.length ? ev : ["  (없음)"]), "걸린 까닭:", ...ws.map((s) => `  - ${s}`)].join("\n");
  });
  const avail = [...r.x.passages.values()].map((p) => `${p.key} | ${p.doc} | - | ${oneLine(p.quote)}`);
  const user = `${blocks.join("\n\n")}\n\n## 쓸 수 있는 사실 (label | 문서 | 일어난 날 | 글 — 여기서 label 은 구절 키이고 글은 원문 구절 그대로다)\n${avail.join("\n")}\n\n위 ${blocks.length} 덩이를 고쳐라.`;
  const q = { model: SHORT_MODELS.repair.model, effort: SHORT_MODELS.repair.effort, system: REPAIR_SYSTEM, user, schema: REPAIR_SCHEMA, max_tokens: SHORT_MODELS.repair.max_tokens, version: CURRENT.repair };
  const tok = (await countTokens(q)) ?? Math.round(user.length / 1.6);
  const e = est(q.model, tok, 4000);
  console.log(`short ${code} --repair-call — ${q.version} · ${q.model} · ${q.effort} · 덩이 ${blocks.length} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(r.x, `SHORT-REPAIR(${blocks.length})`, q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(r.x, "repair", `repair.${String(readRaws(r.x, "repair").length + 1).padStart(2, "0")}.${sha256(user).slice(0, 12)}`, a, res!);
}
/** 계약 검증이 말하는 자리 (JSON 길) → 글 덩이 id */
export function textPaths(w: ShortWritten): [string, string][] {
  return [
    ["/scenes/cover/dek", "cover.dek"], ["/scenes/cover/meta", "cover.meta"], ["/scenes/cover/hint", "cover.hint"],
    ["/solve/entry/first_thought", "entry.first_thought"], ["/solve/entry/breaker", "entry.breaker"], ["/solve/entry/flip/note", "entry.flip_note"], ["/solve/entry/whose", "entry.whose"],
    ...w.where.body.map((_, i): [string, string] => [`/scenes/where/body/${i}`, `where.body[${i}]`]), ["/scenes/where/unknown", "where.unknown"],
    ["/scenes/why/lead", "why.lead"], ...w.why.real.flatMap((_, i): [string, string][] => [[`/scenes/why/real/${i}/head`, `why.real[${i}].head`], [`/scenes/why/real/${i}/body`, `why.real[${i}].body`]]),
    ["/scenes/why/verdict", "why.verdict"], ["/scenes/keep/advice", "keep.advice"],
  ];
}

// ── 명령 ─────────────────────────────────────────────────────────────────────────────────────────────
const outJson = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
function storyFile(r: Built) {
  const s = [...r.x.srcs.values()];
  return outJson({
    _source: {
      what: `짧은 이야기 「${oneLine(r.written.cover.title)}」 — 파이프라인이 낸 것 (P-S1 · short.ts). 골든이 아니다. 사람 게이트 (human.json) 전에는 내지 않는다`,
      made_by: `글 ${r.lw.raw.prompt_version} · ${r.lw.raw.model} (${r.lw.raw.effort}) · 고치기 ${readRepairs(r.x).length ? `${CURRENT.repair} · ${SHORT_MODELS.repair.model}` : "없음"} · 사람의 고침 ${(r.human?.edits ?? []).length}`,
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
  if (!code) throw new Error("짧은 이야기 code 를 준다 — 예: short license-notice (data/shorts/<code>.json)");
  const mode = modeArg(argv);
  if (argv.includes("--passages")) {
    const x = load(code);
    console.log(`short ${code} --passages — 구절 ${x.passages.size} (모델 없음)`);
    for (const p of x.passages.values()) console.log(`  ${p.key} ${p.cont ? "(이어짐) " : ""}${oneLine(p.quote)}`);
    return;
  }
  if (argv.includes("--count")) {
    const x = load(code), q = writeReq(x);
    const tok = await countTokens(q);
    console.log(`short ${code} --count — 글 요청 입력 ${tok ?? "?"} 토큰 (프롬프트 ${q.system.length}자 · 입력 ${q.user.length}자 · 구절 ${x.passages.size}) · 넉넉한 추정 즉시 $${est(q.model, tok ?? 0, 12000).toFixed(2)} · 배치 $${(est(q.model, tok ?? 0, 12000) / 2).toFixed(2)}`);
    return;
  }
  if (argv.includes("--write-call")) return callWrite(code, mode, needBudget(argv));
  if (argv.includes("--entail-call")) return callEntail(code, mode, needBudget(argv));
  if (argv.includes("--repair-call")) return callRepair(code, mode, needBudget(argv));
  const r = build(code);
  const files: [string, string][] = [[join(r.x.out, "story.json"), storyFile(r)], [join(r.x.out, "review.json"), outJson(review(r))]];
  if (argv.includes("--sheet")) {
    writeFileSync(join(r.x.out, "sheet.md"), sheet(r));
    console.log(`short ${code} --sheet — ${join(r.x.out, "sheet.md").replace(ROOT + "/", "")}`);
    return;
  }
  if (argv.includes("--check")) {
    const diff = files.filter(([p, v]) => !existsSync(p) || readFileSync(p, "utf8") !== v).map(([p]) => p.replace(ROOT + "/", ""));
    console.log(diff.length ? `short ${code} --check — 다르다: ${diff.join(" · ")}` : `short ${code} --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)`);
    if (diff.length) process.exitCode = 1;
    return;
  }
  for (const [p, v] of files) writeFileSync(p, v);
  const rv = review(r);
  console.log(`short ${code} — 글 ${r.lw.raw.model} · 글 덩이 ${rv.entail.texts} (근거 있는 것 ${rv.entail.with_src} · 위험한 글 ${rv.entail.risky}) · 구절 ${Object.keys((r.b.story as { quotes: object }).quotes).length} / ${r.x.passages.size}`);
  console.log(`  계약 검증 ${r.v.ok ? "통과" : `실패 ${r.v.errors.length}`} · 알림 ${r.v.warnings.length} · 함의 본 글 ${rv.entail.judged.length} (걸림 ${rv.entail.judged.filter((j) => BAD.has(j.verdict)).length} · 아직 ${rv.entail.not_judged.length}) · 막힘 ${rv.blocked.length} · 낼 수 있나 ${rv.publishable}`);
  for (const b of rv.blocked) console.log(`    ${b.where} ${b.what}: ${b.why}`);
  for (const n of r.b.notes) console.log(`  메모 ${n}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
