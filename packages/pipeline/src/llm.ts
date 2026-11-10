// P-3 · Claude API 부르기 — 파이프라인에서 모델을 부르는 곳은 이 파일 하나다.
//
//   - 키는 packages/pipeline/.env.pipeline 의 ANTHROPIC_API_KEY (git 밖). **값을 출력 · 기록 · 오류 메시지에 남기지 않는다**
//     — 기록에는 요청 머리(header)를 넣지 않고, 오류는 상태 코드와 오류 종류만 적는다
//   - 호출마다 모델 · 입력 · 출력 토큰 · 걸린 시간 · 대략 비용을 장부(data/p3-calls.jsonl)에 한 줄. 장부의 합이 상한을 넘을 것 같으면 부르지 않는다
//   - 모델 배치(D2)는 단계마다 정한다. **사실 추출은 claude-opus-5-5 (D42)** — 기본값. 다른 단계는 그 단계에서 잰다
//   - 출력은 structured outputs (output_config.format · json_schema) — 모양이 틀린 JSON 이 오지 않게
//   - 거절(refusal) 때 다른 모델로 넘기는 fallbacks 는 켜지 않았다: 어느 모델이 낸 출력인지가 재는 것이다 (배치는 fallbacks 를 받지도 않는다). 거절은 기록하고 그 문서만 멈춘다
//
// W-6 (D51 — 비용)
//   - **부르는 길 둘 — 배치(기본)와 즉시(--now).** 배치 = Message Batches (값이 반 · 대개 1 시간 안 · 최대 24 시간). Claro 는 속보가 아니다.
//     요청 본문(requestParams)은 두 길이 글자 그대로 같다 — request_sha256 도 같다. 즉시는 스트리밍(전송 방식일 뿐 본문이 아니다) + finalMessage
//   - 배치는 보낸 뒤 .cache/batches/<id>.json 에 적어 둔다 (git 밖). 기다리다 끊겨도 같은 명령을 다시 돌리면 같은 요청(request_sha256)은 그 배치에 다시 붙는다 — 두 번 내지 않는다
//   - **Step 이름 · 상한은 부르는 쪽이 넘긴다 (W1-a)** — `--step <이름> --budget <달러>`. 이 파일에 Step 상수가 없다. 멈춤 = 상한의 95%
//   - 즉시 길에서 같은 앞부분(system)을 여러 개 함께 보낼 때는 하나를 먼저 보내 응답이 흐르기 시작한 뒤 나머지를 보낸다 — 함께 보내면 모두 캐시를 쓰기만 하고 아무도 못 읽는다 (P-3b 장부: 첫 셋이 모두 쓰기)
import Anthropic from "@anthropic-ai/sdk";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const ENV = join(ROOT, "packages/pipeline/.env.pipeline");
export const LEDGER = join(ROOT, "packages/pipeline/data/p3-calls.jsonl");
export const BATCH_DIR = join(ROOT, "packages/pipeline/.cache/batches");
export const DEFAULT_MODEL = "claude-opus-5-5"; // D42 — 사실 추출

// 가격 (US$ / 100만 토큰 · claude-api 스킬의 표 2026-11-03 판). 대략 비용이다 — 청구서가 아니다
export const PRICE: Record<string, { in: number; out: number; cache_write: number; cache_read: number }> = {
  "claude-sonnet-5-5": { in: 2, out: 10, cache_write: 2.5, cache_read: 0.1 },
  "claude-opus-5-5": { in: 4, out: 20, cache_write: 5, cache_read: 0.2 },
  "claude-fable-5-2": { in: 8, out: 40, cache_write: 10, cache_read: 0.2 },   // W-2 — 의미 대조에서 Opus 와 견준다 (D2 · D47). 캐시 쓰기는 입력의 1.25배
};
/** Message Batches — 모든 토큰 값이 반 (claude-api 스킬 batches.md). 캐시 값과 겹쳐 적용된다 */
export const BATCH_FACTOR = 0.5;

export type Mode = "batch" | "now";
export type Usage = { input_tokens: number; output_tokens: number; cache_creation_input_tokens: number; cache_read_input_tokens: number };

export function costOf(model: string, u: Usage, mode: Mode = "now"): number {
  const p = PRICE[model];
  if (!p) throw new Error(`가격을 모르는 모델 ${model}`);
  const full = (u.input_tokens * p.in + u.output_tokens * p.out + u.cache_creation_input_tokens * p.cache_write + u.cache_read_input_tokens * p.cache_read) / 1e6;
  return mode === "batch" ? full * BATCH_FACTOR : full;
}

export type LedgerLine = {
  at: string; step: string; event: string; source_label: string; model_requested: string; model: string | null; effort: string;
  prompt_version: string; request_sha256: string; text_sha256: string; stop_reason: string | null; usage: Usage | null;
  duration_ms: number; cost_usd: number; ok: boolean; error: string | null; request_id: string | null;
  mode?: Mode; batch_id?: string;   // W-6 — 없으면 즉시 (W-6 앞의 줄)
};

export function ledger(): LedgerLine[] {
  if (!existsSync(LEDGER)) return [];
  return readFileSync(LEDGER, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
export const spent = () => ledger().reduce((a, l) => a + l.cost_usd, 0);
/** 어느 Step 이 쓴 돈 — Step 이름은 부르는 쪽이 준다 (W1-a) */
export const spentOf = (step: string) => ledger().filter((l) => l.step === step).reduce((a, l) => a + l.cost_usd, 0);

// ── Step · 상한 · 길 (부르는 쪽의 인자) ──────────────────────────────────────────────────────────────
export type Budget = { step: string; budget: number; stopAt: number };
const argOf = (argv: string[], k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
/** --step 이름 --budget 달러 — 둘 다 없으면 null. 멈춤 = 상한의 95% (상한 아래 여유) */
export function budgetArg(argv: string[]): Budget | null {
  const step = argOf(argv, "--step"), b = argOf(argv, "--budget");
  if (step == null && b == null) return null;
  if (!step || step.startsWith("--") || b == null) throw new Error("--step <Step 이름> 과 --budget <달러> 는 함께 준다");
  const budget = Number(b);
  if (!(budget > 0)) throw new Error(`--budget ${b} — 0 보다 큰 수 (달러)`);
  return { step, budget, stopAt: Number((budget * 0.95).toFixed(4)) };
}
export function needBudget(argv: string[]): Budget {
  const b = budgetArg(argv);
  if (!b) throw new Error("모델을 부르려면 --step <Step 이름> --budget <달러> — 장부의 Step 칸과 그 Step 의 상한 (W1-a · 부르는 쪽이 정한다)");
  return b;
}
/** 길 — --now 면 즉시, 아니면 배치 (W-6 · D51: 결과를 바꾸지 않는 것은 기본으로) */
export const modeArg = (argv: string[]): Mode => (argv.includes("--now") ? "now" : "batch");
/** 인자 목록에서 Step · 상한 · 길을 다시 낸다 — rerun 이 자식 명령에 넘긴다 */
export const passArgs = (b: Budget | null, mode: Mode) => [...(b ? ["--step", b.step, "--budget", String(b.budget)] : []), ...(mode === "now" ? ["--now"] : [])];

function loadKey(): string {
  if (!existsSync(ENV)) throw new Error("packages/pipeline/.env.pipeline 이 없다 — 키가 없다. 멈춘다");
  for (const line of readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/.exec(line);
    if (m) {
      const v = m[1]!.replace(/^["']|["']$/g, "").trim();
      if (v) return v;
    }
  }
  throw new Error(".env.pipeline 에 ANTHROPIC_API_KEY 값이 없다 — 멈춘다");
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: loadKey(), maxRetries: 3, timeout: 15 * 60_000 }));

/** 키 없는 오류 설명 — 상태 코드 · 오류 종류만 */
function safeError(e: unknown): { msg: string; fatal: boolean } {
  if (e instanceof Anthropic.AuthenticationError) return { msg: "401 authentication_error — 키가 거절됐다", fatal: true };
  if (e instanceof Anthropic.PermissionDeniedError) return { msg: "403 permission_error", fatal: true };
  if (e instanceof Anthropic.APIError) {
    const t = (e.error as { error?: { type?: string; message?: string } } | undefined)?.error;
    return { msg: `${e.status ?? "?"} ${t?.type ?? "api_error"}${t?.message ? ` — ${t.message.slice(0, 200)}` : ""}`, fatal: e.status === 400 || e.status === 404 };
  }
  return { msg: String((e as Error)?.name ?? "Error") + ": " + String((e as Error)?.message ?? e).slice(0, 200), fatal: false };
}

export type CallResult = {
  ok: boolean; fatal: boolean; error: string | null; model: string | null; stop_reason: string | null; usage: Usage | null;
  text: string | null; response_id: string | null; duration_ms: number; cost_usd: number; request_sha256: string;
  mode: Mode; batch_id: string | null; skipped?: boolean;   // skipped — 상한에 걸려 보내지 않았다
};

export type Effort = "low" | "medium" | "high";
export type Req = { model: string; effort: Effort; system: string; user: string; schema: object; max_tokens: number };
/** 요청 본문 — 부르기와 지문(request_sha256) 다시 내기가 같은 것을 쓴다 (P-5 · P4-j: 저장한 출력이 지금 프롬프트와 같은 요청에서 나왔는지 코드가 대 본다).
 *  **W-6: 이 모양을 바꾸면 저장한 출력 전부의 request_sha256 이 어긋난다 (p3 usableRaw 가 다시 부르려 한다).** 배치 · 즉시 모두 이것을 그대로 보낸다 */
export function requestParams(a: Req) {
  return {
    model: a.model,
    max_tokens: a.max_tokens,
    system: [{ type: "text" as const, text: a.system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: a.user }],
    output_config: { effort: a.effort, format: { type: "json_schema" as const, schema: a.schema as Record<string, unknown> } },
  };
}
/** 요청의 지문 — 머리(키) 없이 본문만 */
export const requestSha = (a: Req) => sha256(JSON.stringify(requestParams(a)));

/** 한 부르기 — 장부의 칸 (event · source_label · prompt_version · text_sha256) + 본문 + 이 부르기의 넉넉한 추정 (즉시 값 · 상한 판단에만) */
export type CallReq = Req & { event: string; source_label: string; prompt_version: string; text_sha256: string; est_usd?: number };

function writeLedger(step: string, a: CallReq, r: CallResult) {
  const line: LedgerLine = {
    at: new Date().toISOString(), step, event: a.event, source_label: a.source_label, model_requested: a.model, model: r.model, effort: a.effort,
    prompt_version: a.prompt_version, request_sha256: r.request_sha256, text_sha256: a.text_sha256, stop_reason: r.stop_reason, usage: r.usage,
    duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), ok: r.ok, error: r.error, request_id: r.response_id,
    mode: r.mode, ...(r.batch_id ? { batch_id: r.batch_id } : {}),
  };
  appendFileSync(LEDGER, JSON.stringify(line) + "\n");
}

function fromMessage(model: string, msg: Anthropic.Message, mode: Mode, t0: number, request_sha256: string, batch_id: string | null): CallResult {
  const u = msg.usage;
  const usage: Usage = {
    input_tokens: u.input_tokens, output_tokens: u.output_tokens,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0, cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
  };
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  const okStop = msg.stop_reason === "end_turn";
  return {
    ok: okStop, fatal: false, error: okStop ? null : `stop_reason ${msg.stop_reason}`, model: msg.model, stop_reason: msg.stop_reason ?? null,
    usage, text, response_id: msg.id, duration_ms: Date.now() - t0, cost_usd: costOf(model, usage, mode), request_sha256, mode, batch_id,
  };
}

/** 즉시 한 번 (스트리밍 + finalMessage). started — 응답이 흐르기 시작하면 (캐시를 읽을 수 있게 된 때) 부른다 */
async function callNow(a: CallReq, started?: () => void): Promise<CallResult> {
  const params = requestParams(a);
  const request_sha256 = sha256(JSON.stringify(params));
  const t0 = Date.now();
  try {
    const stream = getClient().messages.stream(params);
    if (started) stream.once("streamEvent", () => started());
    const msg = await stream.finalMessage();
    return fromMessage(a.model, msg, "now", t0, request_sha256, null);
  } catch (e) {
    const s = safeError(e);
    return { ok: false, fatal: s.fatal, error: s.msg, model: null, stop_reason: null, usage: null, text: null, response_id: null, duration_ms: Date.now() - t0, cost_usd: 0, request_sha256, mode: "now", batch_id: null };
  } finally {
    started?.();
  }
}

/** 한 번 부른다 (즉시). JSON 을 받고 JSON 을 낸다 — 출력 글(text)을 그대로 돌려준다. 장부에 한 줄. step — 장부의 Step 칸 (부르는 쪽이 준다) */
export async function callJson(a: CallReq & { step: string }): Promise<CallResult> {
  const r = await callNow(a);
  writeLedger(a.step, a, r);
  return r;
}

// ── 배치 ─────────────────────────────────────────────────────────────────────────────────────────────
type BatchRec = {
  _what: string; batch_id: string; step: string; created_at: string; ended_at?: string;
  requests: { custom_id: string; request_sha256: string; event: string; source_label: string; model: string; effort: Effort; prompt_version: string; text_sha256: string }[];
};
const recPath = (id: string, done = false) => join(BATCH_DIR, `${id}${done ? ".done" : ""}.json`);
/** 아직 결과를 받지 않은 배치 (.cache/batches/<id>.json — 받으면 .done.json 으로 이름을 바꾼다) */
export function pendingBatches(): BatchRec[] {
  if (!existsSync(BATCH_DIR)) return [];
  return readdirSync(BATCH_DIR).filter((n) => n.endsWith(".json") && !n.endsWith(".done.json")).map((n) => JSON.parse(readFileSync(join(BATCH_DIR, n), "utf8")) as BatchRec);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const POLL_MS = Number(process.env.CLARO_BATCH_POLL_MS ?? 30_000);

async function waitBatch(id: string, n: number) {
  const t0 = Date.now();
  let last = "";
  for (;;) {
    const b = await getClient().messages.batches.retrieve(id);
    const c = b.request_counts;
    const s = `${b.processing_status} · 처리 중 ${c.processing} · 끝 ${c.succeeded} · 오류 ${c.errored} · 만료 ${c.expired} · 취소 ${c.canceled}`;
    if (s !== last) console.log(`  배치 ${id} (${n}) — ${s} · ${Math.round((Date.now() - t0) / 1000)}초`);
    last = s;
    if (b.processing_status === "ended") return;
    await sleep(POLL_MS);
  }
}

/** 배치로 보내고 끝날 때까지 기다린다. 같은 요청(request_sha256)이 아직 받지 않은 배치에 있으면 그 배치에 다시 붙는다 (두 번 내지 않는다) */
async function callBatch(reqs: CallReq[], step: string): Promise<CallResult[]> {
  mkdirSync(BATCH_DIR, { recursive: true });
  const shas = reqs.map((a) => requestSha(a));
  const out: (CallResult | null)[] = reqs.map(() => null);
  const attach = new Map<string, { rec: BatchRec; idx: Map<string, number[]> }>();   // batch_id → 이번 요청의 자리
  const pend = pendingBatches();
  const fresh: number[] = [];
  shas.forEach((s, i) => {
    const rec = pend.find((p) => p.requests.some((q) => q.request_sha256 === s));
    if (!rec) return fresh.push(i);
    const cid = rec.requests.find((q) => q.request_sha256 === s)!.custom_id;
    const at = attach.get(rec.batch_id) ?? { rec, idx: new Map() };
    at.idx.set(cid, [...(at.idx.get(cid) ?? []), i]);
    attach.set(rec.batch_id, at);
  });
  for (const [id, at] of attach) console.log(`  배치 ${id} 에 다시 붙는다 — 요청 ${[...at.idx.values()].flat().length} (보낸 때 ${at.rec.created_at} · 같은 request_sha256)`);
  if (fresh.length) {
    // 같은 요청이 이번에 둘 이상이면 하나만 보낸다
    const uniq = new Map<string, number[]>();
    for (const i of fresh) uniq.set(shas[i]!, [...(uniq.get(shas[i]!) ?? []), i]);
    const list = [...uniq.entries()].map(([s, is], k) => ({ custom_id: `q${String(k).padStart(4, "0")}-${s.slice(0, 16)}`, sha: s, is }));
    const b = await getClient().messages.batches.create({ requests: list.map((x) => ({ custom_id: x.custom_id, params: requestParams(reqs[x.is[0]!]!) })) });
    const rec: BatchRec = {
      _what: "W-6 — 보낸 Message Batch (llm.ts 가 쓴다 · git 밖). 결과를 받아 장부에 적으면 <id>.done.json 으로 이름을 바꾼다. 끊겨도 같은 명령을 다시 돌리면 같은 request_sha256 은 이 배치에 다시 붙는다",
      batch_id: b.id, step, created_at: new Date().toISOString(),
      requests: list.map((x) => { const a = reqs[x.is[0]!]!; return { custom_id: x.custom_id, request_sha256: x.sha, event: a.event, source_label: a.source_label, model: a.model, effort: a.effort, prompt_version: a.prompt_version, text_sha256: a.text_sha256 }; }),
    };
    writeFileSync(recPath(b.id), JSON.stringify(rec, null, 2) + "\n");
    console.log(`  배치 ${b.id} 보냄 — 요청 ${list.length} (값이 반 · 대개 1 시간 안 · 최대 24 시간). 끊겨도 같은 명령을 다시 돌리면 이 배치에 다시 붙는다`);
    attach.set(b.id, { rec, idx: new Map(list.map((x) => [x.custom_id, x.is])) });
  }
  await Promise.all([...attach.entries()].map(async ([id, at]) => {
    await waitBatch(id, at.rec.requests.length);
    const t0 = Date.parse(at.rec.created_at);
    const got = new Map<string, Anthropic.Messages.MessageBatchResult>();
    for await (const x of await getClient().messages.batches.results(id)) got.set(x.custom_id, x.result);
    // 배치의 요청 전부를 장부에 (이번에 묻지 않은 것도 — 값을 냈다)
    for (const q of at.rec.requests) {
      const res = got.get(q.custom_id);
      const a: CallReq = { event: q.event, source_label: q.source_label, model: q.model, effort: q.effort, prompt_version: q.prompt_version, text_sha256: q.text_sha256, system: "", user: "", schema: {}, max_tokens: 0 };
      let r: CallResult;
      if (res?.type === "succeeded") r = fromMessage(q.model, res.message, "batch", t0, q.request_sha256, id);
      else {
        const err = res?.type === "errored" ? res.error.error : null;
        const msg = !res ? "결과 없음" : res.type === "errored" ? `errored ${err?.type ?? "?"}${err && "message" in err && err.message ? ` — ${String(err.message).slice(0, 200)}` : ""}` : res.type;
        r = { ok: false, fatal: err?.type === "invalid_request_error", error: msg, model: null, stop_reason: null, usage: null, text: null, response_id: null, duration_ms: Date.now() - t0, cost_usd: 0, request_sha256: q.request_sha256, mode: "batch", batch_id: id };
      }
      writeLedger(at.rec.step, a, r);
      for (const i of at.idx.get(q.custom_id) ?? []) out[i] = r;
    }
    writeFileSync(recPath(id), JSON.stringify({ ...at.rec, ended_at: new Date().toISOString() }, null, 2) + "\n");
    renameSync(recPath(id), recPath(id, true));
  }));
  return out.map((r, i) => r ?? { ok: false, fatal: false, error: "결과 없음", model: null, stop_reason: null, usage: null, text: null, response_id: null, duration_ms: 0, cost_usd: 0, request_sha256: shas[i]!, mode: "batch", batch_id: null });
}

const skippedResult = (a: CallReq, mode: Mode, why: string): CallResult => ({ ok: false, fatal: false, error: why, model: null, stop_reason: null, usage: null, text: null, response_id: null, duration_ms: 0, cost_usd: 0, request_sha256: requestSha(a), mode, batch_id: null, skipped: true });

/** 여러 부르기 — 배치(기본) 또는 즉시. 결과는 reqs 순서대로. 장부에 한 줄씩.
 *  상한: 배치는 보내기 전에 정한다 — 장부의 이 Step 합 + 추정(est_usd × 배치 값)의 누계가 멈춤을 넘는 요청부터는 보내지 않는다 (skipped).
 *  즉시는 지금처럼 한 부르기마다 — 쓴 돈 + 부르는 중인 것의 추정 + 다음 추정이 멈춤을 넘으면 거기서 멈춘다 */
export async function callMany(reqs: CallReq[], o: { mode: Mode; budget: Budget; conc?: number; onResult?: (r: CallResult, i: number) => void }): Promise<CallResult[]> {
  const { mode, budget } = o;
  if (!reqs.length) return [];
  const est = (a: CallReq) => (a.est_usd ?? 0) * (mode === "batch" ? BATCH_FACTOR : 1);
  if (mode === "batch") {
    let acc = spentOf(budget.step);
    const send: number[] = [];
    const out: CallResult[] = reqs.map((a) => skippedResult(a, mode, ""));
    reqs.forEach((a, i) => {
      if (acc + est(a) > budget.stopAt) out[i] = skippedResult(a, mode, `상한 — Step "${budget.step}" 장부 + 추정 누계가 멈춤 $${budget.stopAt} 를 넘는다`);
      else { acc += est(a); send.push(i); }
    });
    if (send.length < reqs.length) console.log(`  멈춤 — ${reqs.length - send.length} 개는 보내지 않는다 (Step "${budget.step}" 쓴 돈 $${spentOf(budget.step).toFixed(2)} + 추정 누계 > $${budget.stopAt})`);
    if (send.length) {
      const rs = await callBatch(send.map((i) => reqs[i]!), budget.step);
      send.forEach((i, k) => { out[i] = rs[k]!; });
    }
    out.forEach((r, i) => o.onResult?.(r, i));
    return out;
  }
  // 즉시 — 일꾼 conc. 같은 앞부분이 여럿이면 첫 부르기가 흐르기 시작한 뒤에 나머지 (캐시 쓰기 한 번 · 나머지는 읽기)
  const out: CallResult[] = reqs.map((a) => skippedResult(a, mode, `상한 — Step "${budget.step}" 멈춤 $${budget.stopAt}`));
  const conc = Math.max(1, o.conc ?? 3);
  let next = 0, inflight = 0, stop = false;
  const one = async (i: number, started?: () => void) => {
    const a = reqs[i]!;
    inflight += est(a);
    try {
      const r = await callNow(a, started);
      writeLedger(budget.step, a, r);
      out[i] = r;
      o.onResult?.(r, i);
      if (r.fatal) stop = true;
    } finally { inflight -= est(a); }
  };
  const admit = (i: number) => {
    if (spentOf(budget.step) + inflight + est(reqs[i]!) > budget.stopAt) {
      if (!stop) console.log(`  멈춤 — Step "${budget.step}" 쓴 돈 $${spentOf(budget.step).toFixed(2)} + 추정 > $${budget.stopAt}`);
      stop = true;
      return false;
    }
    return true;
  };
  if (reqs.length > 1 && conc > 1 && admit(0)) {
    next = 1;
    let go!: () => void;
    const warmed = new Promise<void>((r) => { go = r; });
    const first = one(0, go);
    await warmed;
    const worker = async () => { while (!stop && next < reqs.length) { const i = next++; if (!admit(i)) break; await one(i); } };
    await Promise.all([first, ...Array.from({ length: conc - 1 }, worker)]);
    return out;
  }
  const worker = async () => { while (!stop && next < reqs.length) { const i = next++; if (!admit(i)) break; await one(i); } };
  await Promise.all(Array.from({ length: conc }, worker));
  return out;
}
