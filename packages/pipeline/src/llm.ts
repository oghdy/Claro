// P-3 · Claude API 부르기 — 파이프라인에서 모델을 부르는 곳은 이 파일 하나다.
//
//   - 키는 packages/pipeline/.env.pipeline 의 ANTHROPIC_API_KEY (git 밖). **값을 출력 · 기록 · 오류 메시지에 남기지 않는다**
//     — 기록에는 요청 머리(header)를 넣지 않고, 오류는 상태 코드와 오류 종류만 적는다
//   - 호출마다 모델 · 입력 · 출력 토큰 · 걸린 시간 · 대략 비용을 장부(data/p3-calls.jsonl)에 한 줄. 장부의 합이 상한을 넘을 것 같으면 부르지 않는다
//   - 모델 배치(D2)는 단계마다 정한다. **사실 추출은 claude-opus-5-5 (D42)** — 기본값. 다른 단계는 그 단계에서 잰다
//   - 출력은 structured outputs (output_config.format · json_schema) — 모양이 틀린 JSON 이 오지 않게. 스트리밍 + finalMessage (긴 출력)
//   - 거절(refusal) 때 다른 모델로 넘기는 fallbacks 는 켜지 않았다: 어느 모델이 낸 출력인지가 이 Step 에서 재는 것이다. 거절은 기록하고 그 문서만 멈춘다
import Anthropic from "@anthropic-ai/sdk";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const ENV = join(ROOT, "packages/pipeline/.env.pipeline");
export const LEDGER = join(ROOT, "packages/pipeline/data/p3-calls.jsonl");
export const DEFAULT_MODEL = "claude-opus-5-5"; // D42 — 사실 추출
// 상한은 Step 마다 (장부의 step 칸으로 센다). P-3 은 $15 · P-3b 는 $12 · P-4 는 $8 (지시)
export const STEP = "P-4";
export const BUDGET_USD = 8;
export const STOP_AT_USD = 7.5;        // 이 Step 에서 쓴 돈 + 이번 부르기의 넉넉한 추정이 이 값을 넘으면 부르지 않는다 — 상한 아래 여유

// 가격 (US$ / 100만 토큰 · claude-api 스킬의 표 2026-11-03 판). 대략 비용이다 — 청구서가 아니다
export const PRICE: Record<string, { in: number; out: number; cache_write: number; cache_read: number }> = {
  "claude-sonnet-5-5": { in: 2, out: 10, cache_write: 2.5, cache_read: 0.1 },
  "claude-opus-5-5": { in: 4, out: 20, cache_write: 5, cache_read: 0.2 },
};

export type Usage = { input_tokens: number; output_tokens: number; cache_creation_input_tokens: number; cache_read_input_tokens: number };

export function costOf(model: string, u: Usage): number {
  const p = PRICE[model];
  if (!p) throw new Error(`가격을 모르는 모델 ${model}`);
  return (u.input_tokens * p.in + u.output_tokens * p.out + u.cache_creation_input_tokens * p.cache_write + u.cache_read_input_tokens * p.cache_read) / 1e6;
}

export type LedgerLine = {
  at: string; step: string; event: string; source_label: string; model_requested: string; model: string | null; effort: string;
  prompt_version: string; request_sha256: string; text_sha256: string; stop_reason: string | null; usage: Usage | null;
  duration_ms: number; cost_usd: number; ok: boolean; error: string | null; request_id: string | null;
};

export function ledger(): LedgerLine[] {
  if (!existsSync(LEDGER)) return [];
  return readFileSync(LEDGER, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
export const spent = () => ledger().reduce((a, l) => a + l.cost_usd, 0);
/** 이 Step(STEP)에서 쓴 돈 */
export const spentStep = () => ledger().filter((l) => l.step === STEP).reduce((a, l) => a + l.cost_usd, 0);

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
};

/** 한 번 부른다. JSON 을 받고 JSON 을 낸다 — 출력 글(text)을 그대로 돌려준다. 장부에 한 줄 */
export async function callJson(a: {
  event: string; source_label: string; model: string; effort: "low" | "medium" | "high"; system: string; user: string; schema: object;
  prompt_version: string; text_sha256: string; max_tokens: number;
}): Promise<CallResult> {
  const params = {
    model: a.model,
    max_tokens: a.max_tokens,
    system: [{ type: "text" as const, text: a.system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: a.user }],
    output_config: { effort: a.effort, format: { type: "json_schema" as const, schema: a.schema as Record<string, unknown> } },
  };
  // 요청의 지문 — 머리(키) 없이 본문만
  const request_sha256 = sha256(JSON.stringify(params));
  const t0 = Date.now();
  let r: CallResult;
  try {
    const stream = getClient().messages.stream(params);
    const msg = await stream.finalMessage();
    const u = msg.usage;
    const usage: Usage = {
      input_tokens: u.input_tokens, output_tokens: u.output_tokens,
      cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0, cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    };
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const okStop = msg.stop_reason === "end_turn";
    r = {
      ok: okStop, fatal: false, error: okStop ? null : `stop_reason ${msg.stop_reason}`, model: msg.model, stop_reason: msg.stop_reason ?? null,
      usage, text, response_id: msg.id, duration_ms: Date.now() - t0, cost_usd: costOf(a.model, usage), request_sha256,
    };
  } catch (e) {
    const s = safeError(e);
    r = { ok: false, fatal: s.fatal, error: s.msg, model: null, stop_reason: null, usage: null, text: null, response_id: null, duration_ms: Date.now() - t0, cost_usd: 0, request_sha256 };
  }
  const line: LedgerLine = {
    at: new Date().toISOString(), step: STEP, event: a.event, source_label: a.source_label, model_requested: a.model, model: r.model, effort: a.effort,
    prompt_version: a.prompt_version, request_sha256, text_sha256: a.text_sha256, stop_reason: r.stop_reason, usage: r.usage,
    duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), ok: r.ok, error: r.error, request_id: r.response_id,
  };
  appendFileSync(LEDGER, JSON.stringify(line) + "\n");
  return r;
}
