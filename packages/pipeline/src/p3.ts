// P-3 · P-3b — 사실 추출 → Deep Fact Graph 초안 (FINDINGS §7 스테이지 2 · 3). 명령:
//
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 --call [--model M] [--effort E] [--only A,B]   # 저장된 출력이 없는 글 문서만 모델을 부른다 → 출력을 저장
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 --merge-call [--model M]                      # 같은 사실 묶음 후보를 모델에 묻는다 → 출력을 저장
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 [--model M]                                  # 저장한 출력 + 표에서 그래프를 짓는다 (모델을 부르지 않는다 · 결정적)
//     pnpm --filter @claro/pipeline p3 FOMC-20261028 --check                                      # 다시 지어 파일과 글자 단위로 같은지 (아무것도 쓰지 않는다)
//
// 두 단계로 나눈다 (§3.2): ① 모델 — 글 문서 하나 = 부르기 한 번, JSON 을 받고 JSON 을 낸다. 출력을 그대로 저장한다 (raw/).
// ② 짓기 — 저장한 출력과 원문에서만 돈다: 표 읽기 (코드) → 모양 검사 → 구절 위치 → 수량어 · 수 검사 → 묶기 → graph.json. 모델이 다시 돌지 않는다.
//
// 누가 무엇을 읽나 (D42 · table-rules.json 한 곳): 표 문서는 코드만 (src/tables.ts) · 글 문서는 모델 · 글 안의 표는 코드 (모델에게는 가려서)
//
// 구절 규칙: 모델이 낸 구절은 코드가 원문에서 찾는다. 글자 그대로 한 곳이면 span. 한 구절이라도 원문에 없으면 "구절 없음" · 여러 곳이면 "구절 여럿" (P-1).
// 글 검사 (D42 · fact-check-rules.json 한 곳 · src/checks.ts): 글의 수량어가 구절의 수량어와 대응표대로 · 글의 수 · 날짜가 구절에 있다.
// 어긋나면 그래프에 넣지 않고 따로 모은다 (quantifier_mismatch · number_mismatch) — 사람이 본다. 버리지 않는다.
//
// 묶기 규칙 (§5.3 N:M — 같은 사실을 여러 문서가 말하면 하나로, 출처를 여럿):
//   R1 claim_text 가 같고 (NFC · 공백 묶음 하나 · 끝 마침표 무시) fact_type · event_at 이 같다 → 같은 사실
//   R2 다른 문서의 두 사실이 같은 구절(맞추기 규칙으로 같은 글)을 하나라도 갖고 fact_type · event_at · actor 가 같다 → 같은 사실
//   R3 모델이 묶음을 제안하고 (p3-merge) 코드가 확정한다 — 묶음의 모든 사실이: 서로 다른 문서 · fact_type 같음 · event_at 같음 (비지 않음) ·
//      글의 수 묶음 같음 · 글의 수량어 같음 · OFFICIAL_CLAIM / LIMIT 이면 actor 같음. 문서 순서로 첫 사실부터 규칙을 지키는 사실만 더하고,
//      어긋나는 사실은 빼고 까닭을 남긴다 (둘이 안 되면 묶지 않는다)
//   표 · BLS 사실은 묶지 않는다 (코드가 만든 사실 — 칸 하나하나가 따로다)
//   묶인 사실의 칸은 문서 순서상 첫 사실의 것. 칸이 서로 다르면 _merge_conflicts 에 적는다
//
// 권리 미확인 문서 (지역 연은 연설 — 전문이 git 밖 캐시에만 있는 것): 모델 출력 · 구절 글은 git 밖 캐시에, git 에는 해시 · span · 한국어 사실 글만 (P-1 · D40)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { sha256 } from "./extract.ts";
import { RULES, canon, cpLength, cpSlice, locate } from "./match.ts";
import {
  FACT_TYPES, MERGE_SCHEMA, MERGE_SYSTEM, MERGE_VERSION, OUTPUT_SCHEMA, PROMPT_COMPAT, PROMPT_VERSION, SYSTEM_PROMPT,
  mergeUserMessage, userMessage, type EventContext, type MergeItem,
} from "./p3-prompt.ts";
import { DEFAULT_MODEL, PRICE, STEP, STOP_AT_USD, callJson, requestSha, spent, spentStep } from "./llm.ts";
import { TABLE_RULES, docKind, modelInput, readTables, type TableFact } from "./tables.ts";
import { CHECK_RULES, koQuantifiers, numbersMissing, passageNumbers, quantifierProblem } from "./checks.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));

// 사건 — 무엇을 읽고 어디에 쓰나. storyline = 스토리라인 문서 (P3-h — 범위가 스토리라인 전체)
type Storyline = { code: string; title: string; docs: string[]; basis: string };
// after_docs = 사건 뒤에 나온 문서 (P-4 다시 모으기 — 반대자의 회의 뒤 발언). 범위가 "그 사람의 정책 견해" (p3-prompt.ts scopeLine)
type EventConf = EventContext & { out: string; cacheOut: string; kind: "pack" | "golden"; storyline: Storyline | null; after_docs?: string[] };
export const EVENTS: Record<string, EventConf> = {
  "FOMC-20261028": {
    code: "FOMC-20261028", what: "미국 연준 FOMC 의 10월 통화정책 회의 (2026-10-27 ~ 28)", date: "2026-10-28", prev_meeting: "2026-09-16",
    out: R("packages/pipeline/data/events/FOMC-20261028/p3"), cacheOut: R("packages/pipeline/.cache/p3/FOMC-20261028"), kind: "pack",
    storyline: { code: "SL-iran-war", title: "이란 전쟁", docs: ["TSY-IR-1008", "TSY-IR-1021", "CC-1005", "CC-1010", "WH-0619", "WH-1025"], basis: "P-2 소스 팩 pack.json 의 group \"스토리라인\" (why: SL-iran-war 9/16 뒤) · P-4 가 더한 WH-0619 · WH-1025" },
    after_docs: ["SP-HAM-1105"],
  },
  // 9월 — 정답(골든 사실 60)이 있는 데서 추출 품질을 잰다. 골든(fixtures/)에는 쓰지 않는다
  "FOMC-20260916": {
    code: "FOMC-20260916", what: "미국 연준 FOMC 의 9월 통화정책 회의 (2026-09-15 ~ 16)", date: "2026-09-16", prev_meeting: "2026-07-29",
    out: R("packages/pipeline/data/p3-golden/FOMC-20260916"), cacheOut: R("packages/pipeline/.cache/p3/FOMC-20260916"), kind: "golden",
    storyline: { code: "SL-iran-war", title: "이란 전쟁", docs: ["WH-0408", "CC-0626", "CC-0707", "CC-0901"], basis: "9월 골든 store.json 의 스토리라인 SL-iran-war — 이란 전쟁 1차 문서 (백악관 · CENTCOM). 저장된 것은 WH-0408 하나" },
  },
};

export type Doc = {
  label: string; source_id: string; title: string; publisher: string; published_at: string; url: string | null;
  text: string; text_sha256: string; in_git: boolean;   // in_git = 전문이 저장소에 있다 (연방 정부). 아니면 캐시에만 — 모델 출력 · 구절도 캐시에만
  kind: "TABLE" | "MIXED" | "TEXT"; storyline: { code: string; title: string } | null; after?: boolean;
};

const safe = (label: string) => label.replace(/[^\w.-]/g, "_");

/** 사건의 저장된 원문 — 소스 팩의 순서대로 */
export function loadDocs(code: string): { event_id: string; docs: Doc[] } {
  const conf = EVENTS[code]!;
  const p1Docs = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(R("fixtures/store.documents.json")).source_documents.map((d) => [d.source_id, d.text]));
  const docs: Doc[] = [];
  const sl = (label: string) => (conf.storyline?.docs.includes(label) ? { code: conf.storyline.code, title: conf.storyline.title } : null);
  if (conf.kind === "pack") {
    const dir = R("packages/pipeline/data/events", code);
    const st = readJson<{ events: { event_id: string }[]; sources: { source_id: string; label: string; title: string; publisher: string; url: string | null; published_at: string }[] }>(join(dir, "store.json"));
    const own = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(join(dir, "store.documents.json")).source_documents.map((d) => [d.source_id, d.text]));
    const rec = readJson<{ documents: { label: string; status: string; source_id: string | null; text_in: string | null; text_sha256: string | null }[] }>(join(dir, "fetch.json"));
    // 스토리라인 문서 목록은 팩의 group 과 같아야 한다 (한 곳에서 어긋나지 않게)
    const pack = readJson<{ items: { label: string; group: string }[] }>(join(dir, "pack.json"));
    const packSl = pack.items.filter((i) => i.group === "스토리라인").map((i) => i.label).sort().join(",");
    if (conf.storyline && packSl !== [...conf.storyline.docs].sort().join(",")) throw new Error(`${code}: 스토리라인 문서 목록이 pack.json 의 group 과 다르다`);
    for (const x of rec.documents) {
      if (x.status !== "STORED") continue;
      const s = st.sources.find((y) => y.source_id === x.source_id)!;
      const text = x.text_in === "store.documents.json" ? own.get(x.source_id!)
        : x.text_in === "fixtures/store.documents.json" ? p1Docs.get(x.source_id!)
        : existsSync(R("packages/pipeline/.cache/events", code, "text", `${safe(x.label)}.txt`)) ? readFileSync(R("packages/pipeline/.cache/events", code, "text", `${safe(x.label)}.txt`), "utf8") : undefined;
      if (text == null) throw new Error(`${x.label}: 원문이 이 기계에 없다 (${x.text_in}) — p2 를 먼저 돌린다`);
      if (sha256(text) !== x.text_sha256) throw new Error(`${x.label}: 원문의 해시가 기록과 다르다`);
      docs.push({ label: x.label, source_id: s.source_id, title: s.title, publisher: s.publisher, published_at: s.published_at, url: s.url, text, text_sha256: x.text_sha256!, in_git: x.text_in !== "cache", kind: docKind(s.url), storyline: sl(x.label), ...(conf.after_docs?.includes(x.label) ? { after: true } : {}) });
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
    docs.push({ label: x.label, source_id: s.source_id, title: s.title, publisher: s.publisher, published_at: s.published_at, url: s.url, text, text_sha256: x.text_sha256!, in_git: true, kind: docKind(s.url), storyline: sl(x.label) });
  }
  return { event_id: st.events[0]!.event_id, docs };
}

// 저장한 모델 출력 — 문서 · 모델 · 프롬프트 판 하나에 파일 하나 (P-3 의 p3-extract/1 출력은 이름에 판이 없다 — 그대로 둔다).
// 권리 미확인 문서는 출력 글을 캐시에 두고 git 에는 지문만
export type RawOut = {
  _what: string; event: string; source_label: string; source_id: string; text_sha256: string; input_sha256?: string; prompt_version: string;
  model_requested: string; model: string; effort: string; request_sha256: string; response_id: string; stop_reason: string;
  usage: unknown; duration_ms: number; cost_usd: number; called_at: string;
  output_sha256: string; output: string | null; output_in: "here" | "cache";
};
const vtag = (v: string) => v.replace(/\//g, "-");
const rawName = (label: string, model: string, version = PROMPT_VERSION) => `${safe(label)}.${model}.${vtag(version)}.json`;
export const rawPath = (code: string, label: string, model: string, version = PROMPT_VERSION) => join(EVENTS[code]!.out, "raw", rawName(label, model, version));
const rawCachePath = (code: string, label: string, model: string, version = PROMPT_VERSION) => join(EVENTS[code]!.cacheOut, "raw", rawName(label, model, version));
const mergeName = (model: string) => `merge.${model}.${vtag(MERGE_VERSION)}.json`;

export function readRaw(code: string, doc: Doc, model: string, version = PROMPT_VERSION): { raw: RawOut; output: string | null } | null {
  const p = rawPath(code, doc.label, model, version);
  if (!existsSync(p)) return null;
  const raw = readJson<RawOut>(p);
  let output = raw.output;
  if (raw.output_in === "cache") {
    const c = rawCachePath(code, doc.label, model, version);
    output = existsSync(c) ? readFileSync(c, "utf8") : null;
    if (output != null && sha256(output) !== raw.output_sha256) throw new Error(`${doc.label}: 캐시의 모델 출력이 기록의 해시와 다르다`);
  }
  return { raw, output };
}

/** 이 문서에 지금 쓸 수 있는 모델 출력 — 지금 판의 출력, 아니면 앞 판의 출력 가운데 지금 판의 요청과 글자 그대로 같은 요청에서 나온 것 (PROMPT_COMPAT · P4-j).
 *  앞 판을 쓸 때는 지금 판으로 요청을 다시 지어 request_sha256 을 댄다 — 같지 않으면 쓰지 않는다 (다시 불러야 한다) */
export function usableRaw(code: string, doc: Doc, model: string): { raw: RawOut; output: string | null; compat: boolean } | null {
  const cur = readRaw(code, doc, model);
  if (cur && cur.raw.text_sha256 === doc.text_sha256 && cur.raw.prompt_version === PROMPT_VERSION) return { ...cur, compat: false };
  for (const v of Object.keys(PROMPT_COMPAT)) {
    const old = readRaw(code, doc, model, v);
    if (!old || old.raw.text_sha256 !== doc.text_sha256 || old.raw.prompt_version !== v || old.raw.model_requested !== model || doc.after) continue;
    const user = userMessage(EVENTS[code]!, { label: doc.label, title: doc.title, publisher: doc.publisher, published_at: doc.published_at, url: doc.url, storyline: doc.storyline, after: doc.after }, modelInput(doc));
    const req = requestSha({ model, effort: old.raw.effort as "low" | "medium" | "high", system: SYSTEM_PROMPT, user, schema: OUTPUT_SCHEMA, max_tokens: MAX_TOKENS });
    if (req === old.raw.request_sha256) return { ...old, compat: true };
  }
  return null;
}
const MAX_TOKENS = 64000;
// fact_id 이름의 판 칸 — 모델 사실은 그 출력의 판 · 표 사실은 P-3b 에서 지은 그대로 (판이 올라도 표 사실의 id 가 바뀌지 않게 — id 는 이름일 뿐이다)
const TABLE_ID_SALT = "p3-extract/2";

// ── ① 모델 ─────────────────────────────────────────────────────────────────────────────────────────────
const estimate = (model: string, inputChars: number) => ((inputChars / 3 + 5000) * PRICE[model]!.in + 32000 * PRICE[model]!.out) / 1e6;

async function callAll(code: string, docs: Doc[], model: string, effort: "low" | "medium" | "high", only: string[] | null) {
  const conf = EVENTS[code]!;
  mkdirSync(join(conf.out, "raw"), { recursive: true });
  const queue: Doc[] = [];
  for (const d of docs.filter((d) => !only || only.includes(d.label))) {
    if (d.kind === "TABLE") {
      console.log(`  ${d.label.padEnd(13)} 표 문서 — 모델에 보내지 않는다 (코드가 읽는다 · ${TABLE_RULES.version})`);
      continue;
    }
    const have = usableRaw(code, d, model);
    if (have) {
      console.log(`  ${d.label.padEnd(13)} 저장된 출력이 있다 (${have.raw.prompt_version}${have.compat ? " — 지금 판과 같은 요청" : ""}) — 부르지 않는다`);
      continue;
    }
    queue.push(d);
  }
  let stop = false;
  const worker = async () => {
    while (queue.length && !stop) {
      const d = queue.shift()!;
      const input = modelInput(d);
      const est = estimate(model, cpLength(input));
      if (spentStep() + est > STOP_AT_USD) {
        console.log(`  ${d.label.padEnd(13)} 멈춤 — ${STEP} 에서 쓴 돈 $${spentStep().toFixed(2)} + 이 문서 대략 $${est.toFixed(2)} > $${STOP_AT_USD}`);
        stop = true;
        return;
      }
      const user = userMessage(conf, { label: d.label, title: d.title, publisher: d.publisher, published_at: d.published_at, url: d.url, storyline: d.storyline, after: d.after }, input);
      const r = await callJson({ event: code, source_label: d.label, model, effort, system: SYSTEM_PROMPT, user, schema: OUTPUT_SCHEMA, prompt_version: PROMPT_VERSION, text_sha256: d.text_sha256, max_tokens: MAX_TOKENS });
      if (!r.ok || r.text == null) {
        console.log(`  ${d.label.padEnd(13)} 실패 — ${r.error}`);
        if (r.fatal) {
          stop = true;
          console.log("  치명적 오류 — 남은 문서를 부르지 않는다");
        }
        continue;
      }
      const raw: RawOut = {
        _what: `P-3 모델 출력 (p3.ts 가 쓴다 — 손으로 고치지 않는다). 요청 머리 · 키는 기록하지 않는다. 요청 본문은 지문(request_sha256)만 — 프롬프트는 src/p3-prompt.ts ${PROMPT_VERSION} · 원문은 text_sha256 · 모델이 받은 글(표를 가린 것)은 input_sha256`,
        event: code, source_label: d.label, source_id: d.source_id, text_sha256: d.text_sha256, input_sha256: sha256(input), prompt_version: PROMPT_VERSION,
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
  console.log(`  ${STEP} 에서 쓴 돈 $${spentStep().toFixed(3)} · 장부 합 $${spent().toFixed(3)}`);
}

// ── ② 짓기 (결정적) ─────────────────────────────────────────────────────────────────────────────────────
const TP = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2}))?)?)?$/;
const normClaim = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim().replace(/[.。]$/, "");
const normActor = (s: string | null) => (s ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
/** 글의 수 묶음 (묶기 R3 · 묶음 후보) — 아라비아 숫자만 */
export const numberSet = (claim: string) => [...passageNumbers([claim.replace(/[A-Za-z]+/g, " ")])].sort();

/** 이름에서 나오는 UUID (v5 모양 · SHA-1) — 같은 입력이면 같은 id. 짓기가 결정적이어야 한다 */
export function uuidFrom(name: string): string {
  const ns = "8f1c2a9e-3b7d-4c55-9a61-2d4e5f6a7b8c"; // P-3 의 이름 공간 (아무 값 — 고정)
  const h = createHash("sha1").update(Buffer.from(ns.replace(/-/g, ""), "hex")).update(name, "utf8").digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

type Bucket = "verified" | "bad_shape" | "no_passage" | "multiple" | "quantifier_mismatch" | "number_mismatch";
type Cand = {
  key: string; source_label: string; source_id: string; idx: number; in_git: boolean; model: string | null;
  claim_text: string; fact_type: string; actor: string | null; volatility: string; as_of: string | null; event_at: string | null;
  passages: { text: string; result: "FOUND" | "NOT_FOUND" | "MULTIPLE"; span_start?: number; span_end?: number; count?: number }[];
  shape_errors: string[]; problem: string | null; bucket: Bucket; table: TableFact["table"] | null; version: string | null;
};

export type Graph = Record<string, unknown> & { facts: Record<string, unknown>[]; fact_sources: Record<string, unknown>[] };

/** 묶기 R3 의 코드 규칙 — 어긋나는 까닭 (없으면 null) */
function mergeRuleProblem(ms: Cand[]): string | null {
  if (ms.length < 2) return "사실이 둘 미만";
  if (new Set(ms.map((m) => m.source_label)).size !== ms.length) return "같은 문서의 사실이 둘 이상";
  const h = ms[0]!;
  for (const m of ms.slice(1)) {
    if (m.fact_type !== h.fact_type) return `fact_type 이 다르다 (${h.fact_type} · ${m.fact_type})`;
    if (!h.event_at || m.event_at !== h.event_at) return `event_at 이 다르거나 비었다 (${h.event_at} · ${m.event_at})`;
    if (numberSet(m.claim_text).join(",") !== numberSet(h.claim_text).join(",")) return `글의 수가 다르다 (${numberSet(h.claim_text).join(" ")} · ${numberSet(m.claim_text).join(" ")})`;
    if (koQuantifiers(m.claim_text).join(",") !== koQuantifiers(h.claim_text).join(",")) return "글의 수량어가 다르다";
    if ((h.fact_type === "OFFICIAL_CLAIM" || h.fact_type === "OFFICIAL_LIMIT") && normActor(m.actor) !== normActor(h.actor)) return `말한 쪽(actor)이 다르다 (${h.actor} · ${m.actor})`;
  }
  return null;
}

/** 모델 출력 · 표에서 후보를 모은다 (묶기 전) */
function collect(code: string, model: string) {
  const conf = EVENTS[code]!;
  const { event_id, docs } = loadDocs(code);
  const cands: Cand[] = [];
  const builtFrom: { source_label: string; raw: string; output_sha256: string; model: string; prompt_version: string; input_sha256: string | null; request_sha256: string; compat: boolean }[] = [];
  const missingOutput: string[] = [];
  const tableNotes: string[] = [];
  const tableRead: { source_label: string; handler: string; kind: string; facts: number }[] = [];
  for (const d of docs) {
    // 표 (코드)
    if (d.kind !== "TEXT") {
      const t = readTables(d, { date: conf.date, prev_meeting: conf.prev_meeting });
      tableNotes.push(...t.notes);
      tableRead.push({ source_label: d.label, handler: TABLE_RULES.documents.find((x) => new RegExp(x.url).test(d.url ?? ""))!.handler, kind: d.kind, facts: t.facts.length });
      for (const f of t.facts) {
        cands.push({
          key: f.key, source_label: d.label, source_id: d.source_id, idx: -1, in_git: d.in_git, model: null, claim_text: f.claim_text, fact_type: f.fact_type, actor: f.actor,
          volatility: f.volatility, as_of: f.as_of, event_at: f.event_at, passages: f.passages.map((p) => ({ ...p, result: "FOUND" as const })), shape_errors: [], problem: null, bucket: "verified", table: f.table, version: null,
        });
      }
    }
    if (d.kind === "TABLE") continue;
    // 글 (모델)
    const got = usableRaw(code, d, model);
    if (!got) {
      missingOutput.push(d.label);
      continue;
    }
    if (got.output == null) {
      missingOutput.push(`${d.label} (출력이 이 기계의 캐시에 없다)`);
      continue;
    }
    builtFrom.push({ source_label: d.label, raw: rawName(d.label, model, got.raw.prompt_version), output_sha256: got.raw.output_sha256, model: got.raw.model, prompt_version: got.raw.prompt_version, input_sha256: got.raw.input_sha256 ?? null, request_sha256: got.raw.request_sha256, compat: got.compat });
    const out = JSON.parse(got.output) as { facts: Record<string, unknown>[] };
    const allowed = [d.published_at, d.title];
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
      let bucket: Bucket = "verified";
      let problem: string | null = null;
      if (errs.length) bucket = "bad_shape";
      else if (passages.some((p) => p.result === "NOT_FOUND")) bucket = "no_passage";
      else if (passages.some((p) => p.result === "MULTIPLE")) bucket = "multiple";
      else if ((problem = quantifierProblem(claim, ps))) bucket = "quantifier_mismatch";
      else {
        const miss = numbersMissing(claim, ps, allowed);
        if (miss.length) {
          bucket = "number_mismatch";
          problem = `글의 수 ${miss.join(" · ")} 가 구절 · 문서 공개일 · 제목에 없다`;
        }
      }
      cands.push({ key: `${d.label}#${idx}`, source_label: d.label, source_id: d.source_id, idx, in_git: d.in_git, model: got.raw.model, claim_text: claim, fact_type: ft, actor, volatility: vol, as_of, event_at, passages, shape_errors: errs, problem, bucket, table: null, version: got.raw.prompt_version });
    });
  }
  return { conf, event_id, docs, cands, builtFrom, missingOutput, tableNotes, tableRead };
}

/** 묶음 제안에 보낼 사실 — 구절이 확인되고 검사를 통과한 모델 사실만 (표 · BLS 는 묶지 않는다) */
function mergeItems(cands: Cand[]): MergeItem[] {
  return cands.filter((c) => c.bucket === "verified" && !c.table).map((c) => ({ key: c.key, doc: c.source_label, fact_type: c.fact_type, actor: c.actor, event_at: c.event_at, claim_text: c.claim_text }));
}

export function build(code: string, model: string, includeBls: boolean): { graph: Graph; cacheSide: Record<string, unknown>; ledger: { _what: string; labels: Record<string, string> } } {
  const { conf, event_id, docs, cands, builtFrom, missingOutput, tableNotes, tableRead } = collect(code, model);
  const perSource: Record<string, Record<string, number>> = {};
  for (const c of cands) {
    const ps = (perSource[c.source_label] ??= { candidates: 0, verified: 0, no_passage: 0, multiple: 0, bad_shape: 0, quantifier_mismatch: 0, number_mismatch: 0, table: 0 });
    ps.candidates!++;
    ps[c.bucket]!++;
    if (c.table) ps.table!++;
  }
  const verified = cands.filter((c) => c.bucket === "verified");
  // 묶기 — 합집합 찾기. 순서 = 문서 순서 · 출력 안 순서 (cands 순서 그대로)
  const parent = verified.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const mergeLog: string[] = [];
  const union = (a: number, b: number, why: string) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    parent[Math.max(ra, rb)] = Math.min(ra, rb);
    mergeLog.push(`${why}: ${verified[a]!.key} + ${verified[b]!.key}`);
  };
  const byClaim = new Map<string, number>();
  verified.forEach((c, i) => {
    if (c.table) return;
    // 글이 같아도 때가 다르면 다른 사실이다 — "목표 범위를 3-1/2~3-3/4%로 유지" 는 6월에도 7월에도 같은 글이다
    const k = `${c.fact_type}|${c.event_at}|${normClaim(c.claim_text)}`;
    if (byClaim.has(k)) union(byClaim.get(k)!, i, "R1 같은 글");
    else byClaim.set(k, i);
  });
  const byPassage = new Map<string, number[]>();
  verified.forEach((c, i) => {
    if (c.table) return;
    for (const p of c.passages) {
      const k = `${c.fact_type}|${c.event_at}|${c.actor}|${canon(p.text).c}`; // 말한 쪽이 다르면 다른 사실 — 성명문의 글을 의장이 읽은 것은 "의장이 말했다"
      (byPassage.get(k) ?? byPassage.set(k, []).get(k)!).push(i);
    }
  });
  for (const ids of byPassage.values()) {
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (verified[ids[a]!]!.source_label !== verified[ids[b]!]!.source_label) union(ids[a]!, ids[b]!, "R2 같은 구절");
    }
  }
  // R3 — 모델의 묶음 제안 (저장한 출력) + 코드 규칙
  const mergeRaw = join(conf.out, mergeName(model));
  const items = mergeItems(cands);
  const mergeInput = mergeUserMessage(conf, docs.filter((d) => d.kind !== "TABLE").map((d) => ({ label: d.label, title: d.title })), items);
  const proposals: { keys: string[]; why: string; result: string }[] = [];
  let mergeState = "제안 없음 (--merge-call 을 돌리지 않았다)";
  if (existsSync(mergeRaw)) {
    const mr = readJson<RawOut>(mergeRaw);
    if (mr.input_sha256 !== sha256(mergeInput) || mr.prompt_version !== MERGE_VERSION) mergeState = "제안의 입력이 지금 사실 목록과 다르다 — 적용하지 않음 (--merge-call 을 다시)";
    else {
      mergeState = `${mergeName(model)} 적용`;
      const idx = new Map(verified.map((c, i) => [c.key, i]));
      for (const g of (JSON.parse(mr.output!) as { groups: { keys: string[]; why: string }[] }).groups) {
        const keys = [...new Set(g.keys)];
        const unknown = keys.filter((k) => !idx.has(k) || verified[idx.get(k)!]!.table);
        if (unknown.length) {
          proposals.push({ keys, why: g.why, result: `묶지 않음 — 목록에 없는 key ${unknown.join(" · ")}` });
          continue;
        }
        // 문서 순서로 첫 사실부터, 규칙을 지키는 사실만 하나씩 더한다 (어긋나는 사실은 빼고 까닭을 남긴다)
        const ms = keys.map((k) => verified[idx.get(k)!]!).sort((a, b) => cands.indexOf(a) - cands.indexOf(b));
        const take = [ms[0]!];
        const left: string[] = [];
        for (const m of ms.slice(1)) {
          const why = mergeRuleProblem([...take, m]);
          if (why) left.push(`${m.key} (${why})`);
          else take.push(m);
        }
        if (take.length < 2) {
          proposals.push({ keys, why: g.why, result: `묶지 않음 — ${left.join(" · ")}` });
          continue;
        }
        const before = mergeLog.length;
        for (const m of take.slice(1)) union(idx.get(take[0]!.key)!, idx.get(m.key)!, `R3 모델 제안 · 코드 확인`);
        proposals.push({ keys, why: g.why, result: `${mergeLog.length > before ? "묶음" : "이미 묶여 있음 (R1 · R2)"} ${take.map((m) => m.key).join(" + ")}${left.length ? ` — 뺀 것: ${left.join(" · ")}` : ""}` });
      }
    }
  }
  const groups = new Map<number, number[]>();
  verified.forEach((_, i) => (groups.get(find(i)) ?? groups.set(find(i), []).get(find(i))!).push(i));
  const ordered = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, m]) => m.map((i) => verified[i]!));
  const facts: Record<string, unknown>[] = [];
  const fact_sources: Record<string, unknown>[] = [];
  const cacheSide: Record<string, unknown> = { passages: {} as Record<string, string> };
  const keyToLabel = new Map<string, string>();
  // label 장부 (P-5) — 한 번 붙은 label 은 그 사실(fact_id)에 남고, 새 사실은 장부의 다음 번호를 받는다. 사라진 사실의 label 은 다시 쓰지 않는다.
  // 문서가 더해지거나 다시 뽑혀도 이미 사람이 부른 이름(D44 의 F564 · F668 등)이 다른 사실을 가리키지 않게. 장부가 없으면 예전대로 순서대로
  const ledgerPath = join(conf.out, "labels.json");
  const oldLedger = existsSync(ledgerPath) ? readJson<{ labels: Record<string, string> }>(ledgerPath).labels : null;
  const ledgerLabels: Record<string, string> = { ...(oldLedger ?? {}) };
  let nextNo = Math.max(0, ...Object.values(ledgerLabels).map((l) => Number(l.slice(1)))) + 1;
  ordered.forEach((members, gi) => {
    const head = members[0]!;
    const fact_id = uuidFrom(`${code}|${head.table ? TABLE_ID_SALT : head.version}|${model}|${head.key}`);
    const label = oldLedger ? (ledgerLabels[fact_id] ??= `F${String(nextNo++).padStart(3, "0")}`) : (ledgerLabels[fact_id] = `F${String(gi + 1).padStart(3, "0")}`);
    const conflicts: string[] = [];
    for (const m of members.slice(1)) for (const k of ["fact_type", "volatility", "actor", "as_of", "event_at"] as const) {
      if (m[k] !== head[k]) conflicts.push(`${m.key} ${k}: ${JSON.stringify(m[k])} (머리 ${JSON.stringify(head[k])})`);
    }
    facts.push({
      fact_id, label, claim_text: head.claim_text, fact_type: head.fact_type, actor: head.actor, volatility: head.volatility, as_of: head.volatility === "VOLATILE" ? head.as_of : null,
      event_at: head.event_at, event_id, storyline_id: null, storyline_version: null,
      extraction_model: head.table ? null : head.model, extraction_version: head.table ? `${TABLE_RULES.version} (code)` : head.version,
      _from: members.map((m) => m.key),
      ...(head.table ? { _table: head.table } : {}),
      ...(members.length > 1 ? { _other_texts: members.slice(1).filter((m) => normClaim(m.claim_text) !== normClaim(head.claim_text)).map((m) => `${m.key}: ${m.claim_text}`) } : {}),
      ...(conflicts.length ? { _merge_conflicts: conflicts } : {}),
      ...(head.volatility !== "VOLATILE" && head.as_of ? { _as_of_dropped: head.as_of } : {}),
      ...(head.event_at && head.event_at.slice(0, 10) > conf.date ? { _after_event: true } : {}),
      ...(docs.find((d) => d.label === head.source_label)?.storyline ? { _storyline_doc: docs.find((d) => d.label === head.source_label)!.storyline!.code } : {}),
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
  // 묶음 후보 — 묶지 않았다. 같은 종류 · 같은 날 · 같은 수 묶음의 다른 문서 사실 쌍 (사람이 본다)
  const candidates: string[] = [];
  const heads = ordered.map((ms) => ms[0]!).filter((h) => !h.table);
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
    ...(c.problem ? { problem: c.problem } : {}),
  });
  // BLS — 코드가 API 응답에서 뽑은 사실 (bls.ts). 같은 그래프에 넣는다
  let bls: { sources: unknown[]; facts: Record<string, unknown>[]; fact_sources: Record<string, unknown>[] } | null = null;
  const blsPath = R("packages/pipeline/data/events", code, "bls/bls.json");
  if (includeBls && existsSync(blsPath)) bls = readJson(blsPath);
  const n = (b: Bucket) => cands.filter((c) => c.bucket === b).length;
  const graph: Graph = {
    _what: `${code} 의 Deep Fact Graph 초안 (P-3b · p3.ts 가 저장한 모델 출력 · 원문의 표에서 짓는다 — 손으로 고치지 않는다). facts · fact_sources 는 계약 모양 (DATA_MODEL §1 Fact · FactSource) + _ 주석. ` +
      `구절이 원문에서 글자 그대로 한 곳에 찾아지고 수량어 · 수 검사를 통과한 사실만 facts 에 있다. 표 사실(_table)은 코드가 칸을 짝지어 만들었다. 나머지는 아래에 따로 — 사람이 게이트에서 본다 (§10.1)`,
    event: code, event_id, prompt_version: PROMPT_VERSION, prompt_compat: PROMPT_COMPAT, model, match_rules: RULES.version, table_rules: TABLE_RULES.version, check_rules: CHECK_RULES.version, merge_version: MERGE_VERSION,
    storyline: conf.storyline, built_from: builtFrom, missing_output: missingOutput, table_read: tableRead, table_notes: tableNotes,
    counts: {
      documents: docs.length, documents_text: docs.filter((d) => d.kind !== "TABLE").length, documents_with_output: builtFrom.length, candidates: cands.length,
      model_candidates: cands.filter((c) => !c.table).length, table_facts: cands.filter((c) => c.table).length,
      verified: verified.length, no_passage: n("no_passage"), multiple: n("multiple"), bad_shape: n("bad_shape"), quantifier_mismatch: n("quantifier_mismatch"), number_mismatch: n("number_mismatch"),
      facts_after_merge: facts.length, merges: mergeLog.length,
      merges_by_rule: { R1: mergeLog.filter((x) => x.startsWith("R1")).length, R2: mergeLog.filter((x) => x.startsWith("R2")).length, R3: mergeLog.filter((x) => x.startsWith("R3")).length },
      merge_proposals: proposals.length, merge_proposals_rejected: proposals.filter((p) => p.result.startsWith("묶지 않음")).length, merge_proposals_partial: proposals.filter((p) => p.result.includes("뺀 것")).length, merge_candidates: candidates.length,
      bls_facts: bls ? bls.facts.length : 0,
    },
    per_source: perSource,
    facts: [...facts, ...(bls ? bls.facts.map((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith("_") || k === "_slot"))) : [])],
    fact_sources: [...fact_sources, ...(bls ? bls.fact_sources : [])],
    merges: mergeLog,
    merge_state: mergeState,
    merge_proposals: proposals,
    merge_candidates: candidates,
    no_passage: cands.filter((c) => c.bucket === "no_passage").map(outCand),
    multiple: cands.filter((c) => c.bucket === "multiple").map(outCand),
    bad_shape: cands.filter((c) => c.bucket === "bad_shape").map(outCand),
    quantifier_mismatch: cands.filter((c) => c.bucket === "quantifier_mismatch").map(outCand),
    number_mismatch: cands.filter((c) => c.bucket === "number_mismatch").map(outCand),
  };
  const ledger = {
    _what: `${code} 사실 label 장부 (p3.ts 가 쓴다 · 손으로 고치지 않는다). fact_id → label. 한 번 붙은 label 은 바뀌지 않고, 그래프에서 사라진 사실의 label 은 다시 쓰지 않는다 (P-5 — 사람이 부른 이름이 다른 사실을 가리키지 않게)`,
    labels: Object.fromEntries(Object.entries(ledgerLabels).sort((a, b) => a[1].localeCompare(b[1]))),
  };
  return { graph, cacheSide, ledger };
}

const graphPath = (code: string, model: string) => join(EVENTS[code]!.out, model === DEFAULT_MODEL ? "graph.json" : `graph.${model}.json`);

async function mergeCall(code: string, model: string) {
  const { conf, docs, cands } = collect(code, model);
  const items = mergeItems(cands);
  const user = mergeUserMessage(conf, docs.filter((d) => d.kind !== "TABLE").map((d) => ({ label: d.label, title: d.title })), items);
  const p = join(conf.out, mergeName(model));
  if (existsSync(p) && readJson<RawOut>(p).input_sha256 === sha256(user)) {
    console.log(`p3 ${code} --merge-call — 같은 입력의 제안이 저장돼 있다 — 부르지 않는다`);
    return;
  }
  const est = estimate(model, cpLength(user));
  if (spentStep() + est > STOP_AT_USD) {
    console.log(`p3 ${code} --merge-call — 멈춤 (${STEP} 에서 쓴 돈 $${spentStep().toFixed(2)} + 대략 $${est.toFixed(2)} > $${STOP_AT_USD})`);
    return;
  }
  const r = await callJson({ event: code, source_label: "MERGE", model, effort: "medium", system: MERGE_SYSTEM, user, schema: MERGE_SCHEMA, prompt_version: MERGE_VERSION, text_sha256: sha256(user), max_tokens: 32000 });
  if (!r.ok || r.text == null) throw new Error(`묶음 제안 실패 — ${r.error}`);
  const raw: RawOut = {
    _what: `P-3b 같은 사실 묶음 제안 (모델 출력 — p3.ts 가 쓴다 · 손으로 고치지 않는다). 입력 = 구절이 확인되고 검사를 통과한 모델 사실의 key · 문서 · 종류 · actor · event_at · 한국어 글 (input_sha256). 코드가 규칙 R3 로 확정한다`,
    event: code, source_label: "MERGE", source_id: "-", text_sha256: sha256(user), input_sha256: sha256(user), prompt_version: MERGE_VERSION,
    model_requested: model, model: r.model!, effort: "medium", request_sha256: r.request_sha256, response_id: r.response_id!, stop_reason: r.stop_reason!,
    usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(),
    output_sha256: sha256(r.text), output: r.text, output_in: "here",
  };
  writeFileSync(p, JSON.stringify(raw, null, 2) + "\n");
  console.log(`p3 ${code} --merge-call — ${r.model} · 사실 ${items.length} · 묶음 제안 ${(JSON.parse(r.text) as { groups: unknown[] }).groups.length} · $${r.cost_usd.toFixed(3)}`);
}

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
    console.log(`p3 ${code} --call — ${model} · ${PROMPT_VERSION} · effort ${effort} · 문서 ${only ? only.length : docs.length} · ${STEP} 에서 쓴 돈 $${spentStep().toFixed(3)}`);
    await callAll(code, docs, model, effort, only);
    return;
  }
  if (argv.includes("--merge-call")) {
    await mergeCall(code, model);
    return;
  }
  const { graph, cacheSide, ledger } = build(code, model, model === DEFAULT_MODEL && conf.kind === "pack");
  const body = JSON.stringify(graph, null, 2) + "\n";
  const lBody = JSON.stringify(ledger, null, 2) + "\n";
  const p = graphPath(code, model);
  const lp = join(conf.out, "labels.json");
  const useLedger = model === DEFAULT_MODEL;
  if (argv.includes("--check")) {
    const same = existsSync(p) && readFileSync(p, "utf8") === body;
    const lSame = !useLedger || (existsSync(lp) && readFileSync(lp, "utf8") === lBody);
    console.log(`p3 ${code} --check — 저장한 출력 · 원문에서 다시 지은 그래프가 ${p.replace(ROOT + "/", "")} 와 ${same ? "글자 단위로 같다" : "다르다"} (sha256 ${sha256(body).slice(0, 12)}) · label 장부 ${lSame ? "같다" : "다르다"}`);
    if (!same || !lSame) process.exitCode = 1;
    return;
  }
  mkdirSync(conf.out, { recursive: true });
  writeFileSync(p, body);
  if (useLedger) writeFileSync(lp, lBody);
  if (Object.keys(cacheSide.passages as object).length) {
    mkdirSync(conf.cacheOut, { recursive: true });
    writeFileSync(join(conf.cacheOut, `graph-passages.${model}.json`), JSON.stringify(cacheSide, null, 2) + "\n");
  }
  const c = graph.counts as Record<string, number> & { merges_by_rule: Record<string, number> };
  console.log(`p3 ${code} — ${model} · ${PROMPT_VERSION} · 글 문서 ${c.documents_text}/${c.documents} 중 출력 있음 ${c.documents_with_output}${(graph.missing_output as string[]).length ? ` (없음: ${(graph.missing_output as string[]).join(", ")})` : ""}`);
  console.log(`  후보 ${c.candidates} (모델 ${c.model_candidates} · 표 ${c.table_facts}) → 확인됨 ${c.verified} · 구절 없음 ${c.no_passage} · 여럿 ${c.multiple} · 모양 틀림 ${c.bad_shape} · 수량어 어긋남 ${c.quantifier_mismatch} · 수 어긋남 ${c.number_mismatch}`);
  console.log(`  묶기 ${c.merges} 번 (R1 ${c.merges_by_rule.R1} · R2 ${c.merges_by_rule.R2} · R3 ${c.merges_by_rule.R3}) · 제안 ${c.merge_proposals} 중 묶지 않음 ${c.merge_proposals_rejected} → 사실 ${c.facts_after_merge}${c.bls_facts ? ` + BLS ${c.bls_facts}` : ""} · 묶음 후보 ${c.merge_candidates} (묶지 않음)`);
  console.log(`  묶기 제안: ${graph.merge_state}`);
  for (const [lab, s] of Object.entries(graph.per_source as Record<string, Record<string, number>>)) {
    console.log(`  ${lab.padEnd(13)} 후보 ${String(s.candidates).padStart(3)} (표 ${String(s.table).padStart(2)}) · 확인됨 ${String(s.verified).padStart(3)} · 구절 없음 ${s.no_passage} · 여럿 ${s.multiple} · 모양 ${s.bad_shape} · 수량어 ${s.quantifier_mismatch} · 수 ${s.number_mismatch}`);
  }
  for (const t of graph.table_notes as string[]) console.log(`  표 메모 ${t}`);
  console.log(`  → ${p.replace(ROOT + "/", "")} (sha256 ${sha256(body).slice(0, 12)})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
export { cpSlice };
