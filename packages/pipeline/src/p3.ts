// P-3 — 사실 추출 → Deep Fact Graph 초안 (FINDINGS §7 스테이지 2 · 3). 명령:
//
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 --call [--model M] [--effort E] [--only A,B]   # 저장된 출력이 없는 문서만 모델을 부른다 → 출력을 저장
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 [--model M]                                  # 저장한 출력에서 그래프를 짓는다 (모델을 부르지 않는다 · 결정적)
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 --check                                      # 다시 지어 파일과 글자 단위로 같은지 (아무것도 쓰지 않는다)
//
// 두 단계로 나눈다 (§3.2 · 지시 5): ① 모델 — 문서 하나 = 부르기 한 번, JSON 을 받고 JSON 을 낸다. 출력을 그대로 저장한다 (raw/).
// ② 짓기 — 저장한 출력에서만 돈다: 모양 검사 → 구절 위치 찾기 (P-1 의 맞추기 규칙 · match.ts) → 묶기 (아래 규칙) → graph.json. 모델이 다시 돌지 않는다.
//
// 구절 규칙: 모델이 낸 구절은 코드가 원문에서 찾는다. 글자 그대로 한 곳이면 span. 한 구절이라도 원문에 없으면 그 사실은 "구절 없음"으로 따로 모은다 —
// 버리지 않지만 그래프(facts · fact_sources)에는 넣지 않는다. 여러 곳이면 "구절 여럿" — 위치를 고르지 않는다 (P-1).
//
// 묶기 규칙 (§5.3 N:M — 같은 사실을 여러 문서가 말하면 하나로, 출처를 여럿):
//   R1 claim_text 가 같고 (NFC · 공백 묶음 하나 · 끝 마침표 무시) fact_type · event_at 이 같다 → 같은 사실
//   R2 다른 문서의 두 사실이 같은 구절(맞추기 규칙으로 같은 글)을 하나라도 갖고 fact_type · event_at · actor 가 같다 → 같은 사실
//   그 밖은 묶지 않는다. 같은 fact_type · event_at 에 같은 수(數) 묶음을 가진 다른 문서의 사실 쌍은 "묶음 후보"로만 적는다 (사람이 본다)
//   묶인 사실의 칸은 문서 순서상 첫 사실의 것. 칸이 서로 다르면 _merge_conflicts 에 적는다
//
// 권리 미확인 문서 (지역 연은 연설 — 전문이 git 밖 캐시에만 있는 것): 모델 출력 · 구절 글은 git 밖 캐시에, git 에는 해시 · span · 한국어 사실 글만 (P-1 · D40)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { sha256 } from "./extract.ts";
import { RULES, canon, cpLength, cpSlice, locate } from "./match.ts";
import { FACT_TYPES, OUTPUT_SCHEMA, PROMPT_VERSION, SYSTEM_PROMPT, userMessage, type EventContext } from "./p3-prompt.ts";
import { DEFAULT_MODEL, STOP_AT_USD, PRICE, callJson, spent } from "./llm.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));

// 사건 — 무엇을 읽고 어디에 쓰나
type EventConf = EventContext & { out: string; cacheOut: string; kind: "pack" | "golden" };
export const EVENTS: Record<string, EventConf> = {
  "FOMC-20261028": {
    code: "FOMC-20261028", what: "미국 연준 FOMC 의 10월 통화정책 회의 (2026-10-27 ~ 28)", date: "2026-10-28", prev_meeting: "2026-09-16",
    out: R("packages/pipeline/data/events/FOMC-20261028/p3"), cacheOut: R("packages/pipeline/.cache/p3/FOMC-20261028"), kind: "pack",
  },
  // 9월 — 정답(골든 사실 60)이 있는 데서 추출 품질을 잰다. 골든(fixtures/)에는 쓰지 않는다
  "FOMC-20260916": {
    code: "FOMC-20260916", what: "미국 연준 FOMC 의 9월 통화정책 회의 (2026-09-15 ~ 16)", date: "2026-09-16", prev_meeting: "2026-07-29",
    out: R("packages/pipeline/data/p3-golden/FOMC-20260916"), cacheOut: R("packages/pipeline/.cache/p3/FOMC-20260916"), kind: "golden",
  },
};

export type Doc = {
  label: string; source_id: string; title: string; publisher: string; published_at: string; url: string | null;
  text: string; text_sha256: string; in_git: boolean;   // in_git = 전문이 저장소에 있다 (연방 정부). 아니면 캐시에만 — 모델 출력 · 구절도 캐시에만
};

const safe = (label: string) => label.replace(/[^\w.-]/g, "_");

/** 사건의 저장된 원문 — 소스 팩의 순서대로 */
export function loadDocs(code: string): { event_id: string; docs: Doc[] } {
  const conf = EVENTS[code]!;
  const p1Docs = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(R("fixtures/store.documents.json")).source_documents.map((d) => [d.source_id, d.text]));
  const docs: Doc[] = [];
  if (conf.kind === "pack") {
    const dir = R("packages/pipeline/data/events", code);
    const st = readJson<{ events: { event_id: string }[]; sources: { source_id: string; label: string; title: string; publisher: string; url: string | null; published_at: string }[] }>(join(dir, "store.json"));
    const own = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(join(dir, "store.documents.json")).source_documents.map((d) => [d.source_id, d.text]));
    const rec = readJson<{ documents: { label: string; status: string; source_id: string | null; text_in: string | null; text_sha256: string | null }[] }>(join(dir, "fetch.json"));
    for (const x of rec.documents) {
      if (x.status !== "STORED") continue;
      const s = st.sources.find((y) => y.source_id === x.source_id)!;
      const text = x.text_in === "store.documents.json" ? own.get(x.source_id!)
        : x.text_in === "fixtures/store.documents.json" ? p1Docs.get(x.source_id!)
        : existsSync(R("packages/pipeline/.cache/events", code, "text", `${safe(x.label)}.txt`)) ? readFileSync(R("packages/pipeline/.cache/events", code, "text", `${safe(x.label)}.txt`), "utf8") : undefined;
      if (text == null) throw new Error(`${x.label}: 원문이 이 기계에 없다 (${x.text_in}) — p2 를 먼저 돌린다`);
      if (sha256(text) !== x.text_sha256) throw new Error(`${x.label}: 원문의 해시가 기록과 다르다`);
      docs.push({ label: x.label, source_id: s.source_id, title: s.title, publisher: s.publisher, published_at: s.published_at, url: s.url, text, text_sha256: x.text_sha256!, in_git: x.text_in !== "cache" });
    }
    return { event_id: st.events[0]!.event_id, docs };
  }
  const st = readJson<{ events: { event_id: string }[]; sources: { source_id: string; label: string; title: string; publisher: string; url: string | null; published_at: string }[] }>(R("fixtures/store.json"));
  const rec = readJson<{ documents: { label: string; status: string; source_id: string; text_in: string | null; text_sha256: string | null }[] }>(R("packages/pipeline/data/fomc-2026-09.sources.json"));
  for (const x of rec.documents) {
    if (x.status !== "STORED") continue;
    const s = st.sources.find((y) => y.source_id === x.source_id)!;
    const text = p1Docs.get(x.source_id);
    if (text == null || x.text_in !== "store.documents.json") throw new Error(`${x.label}: 9월 원문은 fixtures/store.documents.json 에 있어야 한다`);
    if (sha256(text) !== x.text_sha256) throw new Error(`${x.label}: 원문의 해시가 기록과 다르다`);
    docs.push({ label: x.label, source_id: s.source_id, title: s.title, publisher: s.publisher, published_at: s.published_at, url: s.url, text, text_sha256: x.text_sha256!, in_git: true });
  }
  return { event_id: st.events[0]!.event_id, docs };
}

// 저장한 모델 출력 — 문서 · 모델 하나에 파일 하나. 권리 미확인 문서는 출력 글을 캐시에 두고 git 에는 지문만
export type RawOut = {
  _what: string; event: string; source_label: string; source_id: string; text_sha256: string; prompt_version: string;
  model_requested: string; model: string; effort: string; request_sha256: string; response_id: string; stop_reason: string;
  usage: unknown; duration_ms: number; cost_usd: number; called_at: string;
  output_sha256: string; output: string | null; output_in: "here" | "cache";
};
const rawName = (label: string, model: string) => `${safe(label)}.${model}.json`;
export const rawPath = (code: string, label: string, model: string) => join(EVENTS[code]!.out, "raw", rawName(label, model));
const rawCachePath = (code: string, label: string, model: string) => join(EVENTS[code]!.cacheOut, "raw", rawName(label, model));

export function readRaw(code: string, doc: Doc, model: string): { raw: RawOut; output: string | null } | null {
  const p = rawPath(code, doc.label, model);
  if (!existsSync(p)) return null;
  const raw = readJson<RawOut>(p);
  let output = raw.output;
  if (raw.output_in === "cache") {
    const c = rawCachePath(code, doc.label, model);
    output = existsSync(c) ? readFileSync(c, "utf8") : null;
    if (output != null && sha256(output) !== raw.output_sha256) throw new Error(`${doc.label}: 캐시의 모델 출력이 기록의 해시와 다르다`);
  }
  return { raw, output };
}

// ── ① 모델 ─────────────────────────────────────────────────────────────────────────────────────────────
async function callAll(code: string, docs: Doc[], model: string, effort: "low" | "medium" | "high", only: string[] | null) {
  const conf = EVENTS[code]!;
  mkdirSync(join(conf.out, "raw"), { recursive: true });
  const todo = docs.filter((d) => (!only || only.includes(d.label)));
  const queue: Doc[] = [];
  for (const d of todo) {
    const have = readRaw(code, d, model);
    if (have && have.raw.text_sha256 === d.text_sha256 && have.raw.prompt_version === PROMPT_VERSION) {
      console.log(`  ${d.label.padEnd(13)} 저장된 출력이 있다 — 부르지 않는다`);
      continue;
    }
    queue.push(d);
  }
  const price = PRICE[model]!;
  let stop = false;
  const worker = async () => {
    while (queue.length && !stop) {
      const d = queue.shift()!;
      // 상한: 장부의 합 + 이 문서의 대략 비용 (입력 = 글자 / 3 토큰 · 출력 32k 토큰으로 넉넉히)
      const est = ((cpLength(d.text) / 3 + 4000) * price.in + 32000 * price.out) / 1e6;
      if (spent() + est > STOP_AT_USD) {
        console.log(`  ${d.label.padEnd(13)} 멈춤 — 쓴 돈 $${spent().toFixed(2)} + 이 문서 대략 $${est.toFixed(2)} > $${STOP_AT_USD} (상한 $15)`);
        stop = true;
        return;
      }
      const user = userMessage(conf, { label: d.label, title: d.title, publisher: d.publisher, published_at: d.published_at, url: d.url }, d.text);
      const r = await callJson({ event: code, source_label: d.label, model, effort, system: SYSTEM_PROMPT, user, schema: OUTPUT_SCHEMA, prompt_version: PROMPT_VERSION, text_sha256: d.text_sha256, max_tokens: 64000 });
      if (!r.ok || r.text == null) {
        console.log(`  ${d.label.padEnd(13)} 실패 — ${r.error}`);
        if (r.fatal) {
          stop = true;
          console.log("  치명적 오류 — 남은 문서를 부르지 않는다");
        }
        continue;
      }
      const raw: RawOut = {
        _what: `P-3 모델 출력 (p3.ts 가 쓴다 — 손으로 고치지 않는다). 요청 머리 · 키는 기록하지 않는다. 요청 본문은 지문(request_sha256)만 — 프롬프트는 src/p3-prompt.ts ${PROMPT_VERSION} · 원문은 text_sha256`,
        event: code, source_label: d.label, source_id: d.source_id, text_sha256: d.text_sha256, prompt_version: PROMPT_VERSION,
        model_requested: model, model: r.model!, effort, request_sha256: r.request_sha256, response_id: r.response_id!, stop_reason: r.stop_reason!,
        usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(),
        output_sha256: sha256(r.text), output: d.in_git ? r.text : null, output_in: d.in_git ? "here" : "cache",
      };
      if (!d.in_git) {
        mkdirSync(join(conf.cacheOut, "raw"), { recursive: true });
        writeFileSync(rawCachePath(code, d.label, model), r.text);
      }
      writeFileSync(rawPath(code, d.label, model), JSON.stringify(raw, null, 2) + "\n");
      const u = r.usage!;
      console.log(`  ${d.label.padEnd(13)} ${r.model} 입력 ${u.input_tokens} (캐시 읽기 ${u.cache_read_input_tokens} · 쓰기 ${u.cache_creation_input_tokens}) · 출력 ${u.output_tokens} · ${(r.duration_ms / 1000).toFixed(0)}초 · $${r.cost_usd.toFixed(3)}`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  console.log(`  장부 합 $${spent().toFixed(3)}`);
}

// ── ② 짓기 (결정적) ─────────────────────────────────────────────────────────────────────────────────────
const TP = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2}))?)?)?$/;
const normClaim = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim().replace(/[.。]$/, "");

/** 이름에서 나오는 UUID (v5 모양 · SHA-1) — 같은 입력이면 같은 id. 짓기가 결정적이어야 한다 */
export function uuidFrom(name: string): string {
  const ns = "8f1c2a9e-3b7d-4c55-9a61-2d4e5f6a7b8c"; // P-3 의 이름 공간 (아무 값 — 고정)
  const h = createHash("sha1").update(Buffer.from(ns.replace(/-/g, ""), "hex")).update(name, "utf8").digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/** 사실 글의 수(數) 가운데 구절에 없는 것 — 확정 §5.5 "숫자 · 날짜의 원문 리터럴 일치" 의 거친 첫 판. 사람이 보는 경고일 뿐 막지 않는다.
 *  날짜로 쓴 수(2026년 · 9월 · 16일 · 2026-09-16)는 뺀다 — 원문은 영어 날짜라 리터럴로 댈 수 없다 */
export function numbersNotInPassages(claim: string, passages: string[]): string[] {
  const c = claim.replace(/\d{4}-\d{2}(-\d{2})?/g, " ").replace(/\d+\s*(년|월|일|분기|개월|번째|번|회|명|주|개)/g, " ");
  const toks = [...c.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/,/g, ""));
  const hay = passages.join(" ").replace(/,/g, "");
  return [...new Set(toks.filter((t) => !new RegExp(`(^|[^0-9.])${t.replace(/\./g, "\\.")}($|[^0-9])`).test(hay)))];
}
const numberSet = (claim: string) => [...new Set([...claim.replace(/\d{4}-\d{2}(-\d{2})?/g, " ").replace(/\d+\s*(년|월|일|분기)/g, " ").matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/,/g, "")))].sort();

type Cand = {
  key: string; source_label: string; source_id: string; idx: number; in_git: boolean; model: string;
  claim_text: string; fact_type: string; actor: string | null; volatility: string; as_of: string | null; event_at: string | null;
  passages: { text: string; result: "FOUND" | "NOT_FOUND" | "MULTIPLE"; span_start?: number; span_end?: number; count?: number }[];
  shape_errors: string[];
};

export type Graph = Record<string, unknown> & { facts: Record<string, unknown>[]; fact_sources: Record<string, unknown>[] };

export function build(code: string, model: string, includeBls: boolean): { graph: Graph; cacheSide: Record<string, unknown> } {
  const conf = EVENTS[code]!;
  const { event_id, docs } = loadDocs(code);
  const cands: Cand[] = [];
  const perSource: Record<string, Record<string, number>> = {};
  const builtFrom: { source_label: string; raw: string; output_sha256: string; model: string; prompt_version: string }[] = [];
  const missingOutput: string[] = [];
  for (const d of docs) {
    const got = readRaw(code, d, model);
    if (!got || got.raw.text_sha256 !== d.text_sha256 || got.raw.prompt_version !== PROMPT_VERSION) {
      missingOutput.push(d.label);
      continue;
    }
    if (got.output == null) {
      missingOutput.push(`${d.label} (출력이 이 기계의 캐시에 없다)`);
      continue;
    }
    builtFrom.push({ source_label: d.label, raw: rawName(d.label, model), output_sha256: got.raw.output_sha256, model: got.raw.model, prompt_version: got.raw.prompt_version });
    const out = JSON.parse(got.output) as { facts: Record<string, unknown>[] };
    out.facts.forEach((f, idx) => {
      const errs: string[] = [];
      const s = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : null);
      const claim = (s("claim_text") ?? "").trim();
      if (!claim) errs.push("claim_text 가 비었다");
      const ft = s("fact_type") ?? "";
      if (!(FACT_TYPES as readonly string[]).includes(ft)) errs.push(`fact_type ${ft}`);
      const vol = s("volatility") ?? "";
      if (vol !== "STABLE" && vol !== "VOLATILE") errs.push(`volatility ${vol}`);
      const actor = s("actor")?.trim() || null;
      if ((ft === "OFFICIAL_CLAIM" || ft === "OFFICIAL_LIMIT") && !actor) errs.push(`${ft} 인데 actor 가 없다 (DATA_MODEL §3.4)`);
      const as_of = s("as_of")?.trim() || null, event_at = s("event_at")?.trim() || null;
      if (vol === "VOLATILE" && !as_of) errs.push("VOLATILE 인데 as_of 가 없다 (D8)");
      for (const [k, v] of [["as_of", as_of], ["event_at", event_at]] as const) if (v != null && !TP.test(v)) errs.push(`${k} ${JSON.stringify(v)} 가 TimePoint 가 아니다`);
      const ps = Array.isArray(f.passages) ? (f.passages as unknown[]).filter((p): p is string => typeof p === "string" && p.trim() !== "") : [];
      if (ps.length === 0) errs.push("구절이 없다");
      const passages = ps.map((p) => {
        const l = locate(d.text, p);
        return l.result === "FOUND" ? { text: p, result: l.result, span_start: l.span_start, span_end: l.span_end }
          : l.result === "MULTIPLE" ? { text: p, result: l.result, count: l.count } : { text: p, result: l.result };
      });
      cands.push({ key: `${d.label}#${idx}`, source_label: d.label, source_id: d.source_id, idx, in_git: d.in_git, model: got.raw.model, claim_text: claim, fact_type: ft, actor, volatility: vol, as_of, event_at, passages, shape_errors: errs });
    });
  }
  // 갈래
  const bucket = (c: Cand) => c.shape_errors.length ? "bad_shape" : c.passages.some((p) => p.result === "NOT_FOUND") ? "no_passage" : c.passages.some((p) => p.result === "MULTIPLE") ? "multiple" : "verified";
  for (const c of cands) {
    const ps = (perSource[c.source_label] ??= { candidates: 0, verified: 0, no_passage: 0, multiple: 0, bad_shape: 0 });
    ps.candidates!++;
    ps[bucket(c)]!++;
  }
  const verified = cands.filter((c) => bucket(c) === "verified");
  // 묶기 — 합집합 찾기. 순서 = 문서 순서 · 출력 안 순서 (cands 순서 그대로)
  const parent = verified.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const union = (a: number, b: number, why: string, log: string[]) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    parent[Math.max(ra, rb)] = Math.min(ra, rb);
    log.push(`${why}: ${verified[a]!.key} + ${verified[b]!.key}`);
  };
  const mergeLog: string[] = [];
  const byClaim = new Map<string, number>();
  verified.forEach((c, i) => {
    // 글이 같아도 때가 다르면 다른 사실이다 — "목표 범위를 3-1/2~3-3/4%로 유지" 는 6월에도 7월에도 같은 글이다
    const k = `${c.fact_type}|${c.event_at}|${normClaim(c.claim_text)}`;
    if (byClaim.has(k)) union(byClaim.get(k)!, i, "R1 같은 글", mergeLog);
    else byClaim.set(k, i);
  });
  const byPassage = new Map<string, number[]>();
  verified.forEach((c, i) => {
    for (const p of c.passages) {
      const k = `${c.fact_type}|${c.event_at}|${c.actor}|${canon(p.text).c}`; // 말한 쪽이 다르면 다른 사실 — 성명문의 글을 의장이 읽은 것은 "의장이 말했다"
      (byPassage.get(k) ?? byPassage.set(k, []).get(k)!).push(i);
    }
  });
  for (const ids of byPassage.values()) {
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (verified[ids[a]!]!.source_label !== verified[ids[b]!]!.source_label) union(ids[a]!, ids[b]!, "R2 같은 구절", mergeLog);
    }
  }
  const groups = new Map<number, number[]>();
  verified.forEach((_, i) => (groups.get(find(i)) ?? groups.set(find(i), []).get(find(i))!).push(i));
  const ordered = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, m]) => m.map((i) => verified[i]!));
  const facts: Record<string, unknown>[] = [];
  const fact_sources: Record<string, unknown>[] = [];
  const cacheSide: Record<string, unknown> = { passages: {} as Record<string, string> };
  const keyToLabel = new Map<string, string>();
  ordered.forEach((members, gi) => {
    const head = members[0]!;
    const fact_id = uuidFrom(`${code}|${PROMPT_VERSION}|${model}|${head.key}`);
    const label = `F${String(gi + 1).padStart(3, "0")}`;
    const conflicts: string[] = [];
    for (const m of members.slice(1)) for (const k of ["fact_type", "volatility", "actor", "as_of", "event_at"] as const) {
      if (m[k] !== head[k]) conflicts.push(`${m.key} ${k}: ${JSON.stringify(m[k])} (머리 ${JSON.stringify(head[k])})`);
    }
    const nums = numbersNotInPassages(head.claim_text, members.filter((m) => normClaim(m.claim_text) === normClaim(head.claim_text) || m === head).flatMap((m) => m.passages.map((p) => p.text)));
    facts.push({
      fact_id, label, claim_text: head.claim_text, fact_type: head.fact_type, actor: head.actor, volatility: head.volatility, as_of: head.volatility === "VOLATILE" ? head.as_of : null,
      event_at: head.event_at, event_id, storyline_id: null, storyline_version: null, extraction_model: head.model, extraction_version: PROMPT_VERSION,
      _from: members.map((m) => m.key),
      ...(members.length > 1 ? { _other_texts: members.slice(1).filter((m) => normClaim(m.claim_text) !== normClaim(head.claim_text)).map((m) => `${m.key}: ${m.claim_text}`) } : {}),
      ...(conflicts.length ? { _merge_conflicts: conflicts } : {}),
      ...(head.volatility !== "VOLATILE" && head.as_of ? { _as_of_dropped: head.as_of } : {}),
      ...(head.event_at && head.event_at.slice(0, 10) > conf.date ? { _after_event: true } : {}),
      ...(nums.length ? { _numbers_not_in_passage: nums } : {}),
    });
    for (const m of members) {
      keyToLabel.set(m.key, label);
      m.passages.forEach((p, pi) => {
        const row: Record<string, unknown> = { fact_id, source_id: m.source_id, section: null, span_start: p.span_start, span_end: p.span_end, _from: m.key };
        if (m.in_git) row._passage = p.text;
        else {
          row._passage_in = "cache";
          (cacheSide.passages as Record<string, string>)[`${m.key}/${pi}`] = p.text;
        }
        fact_sources.push(row);
      });
    }
  });
  // 묶음 후보 — 묶지 않는다. 사람이 본다
  const candidates: string[] = [];
  const heads = ordered.map((ms) => ms[0]!);
  for (let a = 0; a < heads.length; a++) for (let b = a + 1; b < heads.length; b++) {
    const x = heads[a]!, y = heads[b]!;
    if (x.source_label === y.source_label || x.fact_type !== y.fact_type || !x.event_at || x.event_at !== y.event_at) continue;
    const nx = numberSet(x.claim_text), ny = numberSet(y.claim_text);
    if (nx.length && nx.join(",") === ny.join(",")) candidates.push(`${keyToLabel.get(x.key)} ~ ${keyToLabel.get(y.key)} (${x.fact_type} · ${x.event_at} · 수 ${nx.join(" ")})`);
  }
  const outCand = (c: Cand) => ({
    key: c.key, source_label: c.source_label, claim_text: c.claim_text, fact_type: c.fact_type, actor: c.actor, volatility: c.volatility, as_of: c.as_of, event_at: c.event_at,
    passages: c.passages.map((p) => ({ result: p.result, ...(c.in_git ? { text: p.text } : { text_in: "cache" }), ...(p.count ? { count: p.count } : {}), ...(p.span_start != null ? { span_start: p.span_start, span_end: p.span_end } : {}) })),
    ...(c.shape_errors.length ? { shape_errors: c.shape_errors } : {}),
  });
  // BLS — 코드가 API 응답에서 뽑은 사실 (bls.ts). 같은 그래프에 넣는다
  let bls: { sources: unknown[]; facts: Record<string, unknown>[]; fact_sources: Record<string, unknown>[] } | null = null;
  const blsPath = R("packages/pipeline/data/events", code, "bls/bls.json");
  if (includeBls && existsSync(blsPath)) bls = readJson(blsPath);
  const graph: Graph = {
    _what: `${code} 의 Deep Fact Graph 초안 (P-3 · p3.ts 가 저장한 모델 출력에서 짓는다 — 손으로 고치지 않는다). facts · fact_sources 는 계약 모양 (DATA_MODEL §1 Fact · FactSource) + _ 주석. ` +
      `구절이 원문에서 글자 그대로 한 곳에 찾아진 사실만 facts 에 있다. 구절 없음 · 구절 여럿 · 모양 틀림은 아래에 따로. 사람이 게이트에서 본다 (§10.1)`,
    event: code, event_id, prompt_version: PROMPT_VERSION, model, match_rules: RULES.version, built_from: builtFrom,
    missing_output: missingOutput,
    counts: {
      documents: docs.length, documents_with_output: builtFrom.length, candidates: cands.length, verified: verified.length,
      no_passage: cands.filter((c) => bucket(c) === "no_passage").length, multiple: cands.filter((c) => bucket(c) === "multiple").length,
      bad_shape: cands.filter((c) => bucket(c) === "bad_shape").length, facts_after_merge: facts.length, merges: mergeLog.length, merge_candidates: candidates.length,
      bls_facts: bls ? bls.facts.length : 0,
    },
    per_source: perSource,
    facts: [...facts, ...(bls ? bls.facts.map((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith("_") || k === "_slot"))) : [])],
    fact_sources: [...fact_sources, ...(bls ? bls.fact_sources : [])],
    merges: mergeLog,
    merge_candidates: candidates,
    no_passage: cands.filter((c) => bucket(c) === "no_passage").map(outCand),
    multiple: cands.filter((c) => bucket(c) === "multiple").map(outCand),
    bad_shape: cands.filter((c) => bucket(c) === "bad_shape").map(outCand),
  };
  return { graph, cacheSide };
}

const graphPath = (code: string, model: string) => join(EVENTS[code]!.out, model === DEFAULT_MODEL ? "graph.json" : `graph.${model}.json`);

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a) => !a.startsWith("--") && !argv[argv.indexOf(a) - 1]?.match(/^--(model|effort|only)$/));
  if (!code || !EVENTS[code]) throw new Error(`사건 code — ${Object.keys(EVENTS).join(" · ")}`);
  const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const model = opt("--model") ?? DEFAULT_MODEL;
  if (!PRICE[model]) throw new Error(`모르는 모델 ${model}`);
  const effort = (opt("--effort") ?? "medium") as "low" | "medium" | "high";
  const only = opt("--only")?.split(",") ?? null;
  const conf = EVENTS[code]!;
  if (argv.includes("--call")) {
    const { docs } = loadDocs(code);
    console.log(`p3 ${code} --call — ${model} · effort ${effort} · 문서 ${only ? only.length : docs.length} · 지금까지 쓴 돈 $${spent().toFixed(3)}`);
    await callAll(code, docs, model, effort, only);
    return;
  }
  const { graph, cacheSide } = build(code, model, model === DEFAULT_MODEL && conf.kind === "pack");
  const body = JSON.stringify(graph, null, 2) + "\n";
  const p = graphPath(code, model);
  if (argv.includes("--check")) {
    const same = existsSync(p) && readFileSync(p, "utf8") === body;
    console.log(`p3 ${code} --check — 저장한 출력에서 다시 지은 그래프가 ${p.replace(ROOT + "/", "")} 와 ${same ? "글자 단위로 같다" : "다르다"} (sha256 ${sha256(body).slice(0, 12)})`);
    if (!same) process.exitCode = 1;
    return;
  }
  mkdirSync(conf.out, { recursive: true });
  writeFileSync(p, body);
  if (Object.keys(cacheSide.passages as object).length) {
    mkdirSync(conf.cacheOut, { recursive: true });
    writeFileSync(join(conf.cacheOut, `graph-passages.${model}.json`), JSON.stringify(cacheSide, null, 2) + "\n");
  }
  const c = graph.counts as Record<string, number>;
  console.log(`p3 ${code} — ${model} · ${PROMPT_VERSION} · 출력 있는 문서 ${c.documents_with_output}/${c.documents}${graph.missing_output && (graph.missing_output as string[]).length ? ` (없음: ${(graph.missing_output as string[]).join(", ")})` : ""}`);
  console.log(`  후보 ${c.candidates} → 구절 확인됨 ${c.verified} · 구절 없음 ${c.no_passage} · 구절 여럿 ${c.multiple} · 모양 틀림 ${c.bad_shape}`);
  console.log(`  묶기 ${c.merges} 번 → 사실 ${c.facts_after_merge}${c.bls_facts ? ` + BLS ${c.bls_facts}` : ""} · 묶음 후보 ${c.merge_candidates} (묶지 않음)`);
  for (const [lab, s] of Object.entries(graph.per_source as Record<string, Record<string, number>>)) {
    console.log(`  ${lab.padEnd(13)} 후보 ${String(s.candidates).padStart(3)} · 확인됨 ${String(s.verified).padStart(3)} · 구절 없음 ${s.no_passage} · 여럿 ${s.multiple} · 모양 틀림 ${s.bad_shape}`);
  }
  console.log(`  → ${p.replace(ROOT + "/", "")} (sha256 ${sha256(body).slice(0, 12)})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
export { cpSlice };
