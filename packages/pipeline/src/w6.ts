// W-6 — API 비용 (D51). 장부 분석 · 기사 한 편 몫 · effort 를 작게 잰다. 명령:
//
//     pnpm --filter @claro/pipeline w6 --ledger                         # 장부를 단계 · 부르기별로 (입력 · 캐시 쓰기 · 캐시 읽기 · 출력) — 모델 0
//     pnpm --filter @claro/pipeline w6 --article                        # 10월 FOMC 기사 한 편 몫 (지금 그래프 · Coverage · 해석이 쓰는 출력의 값) — 모델 0
//     pnpm --filter @claro/pipeline w6 --extract --effort low --docs ST-09,PC-09 --step W-6 --budget 4 [--now]
//                                                                       # 9월 문서 사실 추출을 effort 만 바꿔 → data/w6/extract/ (골든이 있는 곳 — P-3b 방법)
//     pnpm --filter @claro/pipeline w6 --extract-compare                # 골든 사실마다 후보 (구절이 원문에서 겹치는 사실) — 사람이 판정해 data/w6/extract-judge.json 에
//     pnpm --filter @claro/pipeline w6 --assign --effort low --step W-6 --budget 4      # P-4 요소 붙이기 한 묶음 (모델 사실 처음 140) → data/w6/assign/
//     pnpm --filter @claro/pipeline w6 --p5 derive|counter --effort medium --step W-6 --budget 4   # P-5 를 effort 만 바꿔 → data/w6/p5/
//     pnpm --filter @claro/pipeline w6 --side                           # 잰 것을 앞 결과와 나란히 (사람이 볼 표) — 모델 0
//     pnpm --filter @claro/pipeline w2 --call --model M --effort E --raw-dir data/w6/w2/raw --step W-6 --budget 4   # 의미 대조 — W-2 시험 묶음 그대로 (출력은 W-6 쪽에)
//     pnpm --filter @claro/pipeline w6 --w2                             # W-2 시험 묶음 결과 — data/w2 (W-2 의 판) 와 data/w6/w2 (W-6 이 잰 판) 나란히 — 모델 0
//
// 이 Step 은 **잰다** (D2 · D51 ④). 파이프라인의 저장 출력(p3/raw · p4/raw · p5/raw)에는 쓰지 않는다 — 짓기가 "마지막 출력" 을 집어 결과가 바뀌지 않게 data/w6/ 에만.
// 장부의 event 는 "W-6" (9월 비교 스크립트 compare-p3-golden.py 의 비용 칸에 섞이지 않게) · source_label 에 무엇을 쟀는지.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { BATCH_FACTOR, DEFAULT_MODEL, PRICE, callMany, costOf, ledger, modeArg, needBudget, type CallReq, type Effort, type LedgerLine, type Usage } from "./llm.ts";
import { EVENTS, loadDocs, usableRaw } from "./p3.ts";
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, userMessage } from "./p3-prompt.ts";
import { modelInput } from "./tables.ts";
import { CHUNK, evCtx, factDocs, isTableFact, load as p4load, modelAssignments } from "./p4.ts";
import { ASSIGN_SYSTEM, ASSIGN_VERSION, assignSchema, assignUser } from "./p4-prompt.ts";
import { requestOf } from "./p5.ts";
import { build as w2build, loadRuns as w2runs } from "./w2.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
export const DIR = R("packages/pipeline/data/w6");
const SEPT = "FOMC-20260916", OCT = "FOMC-20261028";
const usd = (x: number) => `$${x.toFixed(2)}`;
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n));

// ── 장부 ─────────────────────────────────────────────────────────────────────────────────────────────
type Agg = { n: number; in: number; cw: number; cr: number; out: number; usd: number; usd_now: number };
const z = (): Agg => ({ n: 0, in: 0, cw: 0, cr: 0, out: 0, usd: 0, usd_now: 0 });
function add(a: Agg, u: Usage | null, cost: number, model: string) {
  a.n++;
  if (!u) return;
  a.in += u.input_tokens; a.cw += u.cache_creation_input_tokens; a.cr += u.cache_read_input_tokens; a.out += u.output_tokens;
  a.usd += cost; a.usd_now += PRICE[model] ? costOf(model, u) : cost;
}
/** 값이 어디로 가나 — 입력 · 캐시 쓰기 · 캐시 읽기 · 출력 (즉시 값) */
function split(model: string, a: Agg) {
  const p = PRICE[model]!;
  return { in: (a.in * p.in) / 1e6, cw: (a.cw * p.cache_write) / 1e6, cr: (a.cr * p.cache_read) / 1e6, out: (a.out * p.out) / 1e6 };
}
const kindOf = (l: LedgerLine) => l.prompt_version.split("/")[0]!;

function ledgerTable() {
  const L = ledger();
  const by = new Map<string, Agg & { model: string }>();
  for (const l of L) {
    const key = `${l.step} · ${l.event} · ${kindOf(l)} · ${l.model_requested} · ${l.effort}${l.mode === "batch" ? " · 배치" : ""}`;
    const a = by.get(key) ?? { ...z(), model: l.model_requested };
    add(a, l.usage, l.cost_usd, l.model_requested);
    by.set(key, a);
  }
  console.log(`장부 ${L.length} 줄 · 합 ${usd(L.reduce((s, l) => s + l.cost_usd, 0))}\n`);
  console.log("| Step · 사건 · 부르기 · 모델 · effort | n | 입력 | 캐시 쓰기 | 캐시 읽기 | 출력 | 값 | 출력 몫 | 캐시 읽기 / (입력+쓰기+읽기) |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const [key, a] of by) {
    const s = split(a.model, a);
    const tot = s.in + s.cw + s.cr + s.out;
    console.log(`| ${key} | ${a.n} | ${k(a.in)} | ${k(a.cw)} | ${k(a.cr)} | ${k(a.out)} | ${usd(a.usd)} | ${tot ? Math.round((s.out / tot) * 100) : 0}% | ${a.in + a.cw + a.cr ? Math.round((a.cr / (a.in + a.cw + a.cr)) * 100) : 0}% |`);
  }
  const all = z();
  for (const l of L) if (l.model_requested === DEFAULT_MODEL) add(all, l.usage, l.cost_usd, l.model_requested);
  const s = split(DEFAULT_MODEL, all);
  console.log(`\nOpus 전체: 입력 ${usd(s.in)} · 캐시 쓰기 ${usd(s.cw)} · 캐시 읽기 ${usd(s.cr)} · **출력 ${usd(s.out)}** (${Math.round((s.out / (s.in + s.cw + s.cr + s.out)) * 100)}%)`);
}

// ── 기사 한 편 몫 (10월 FOMC — 지금 쓰는 출력의 값) ─────────────────────────────────────────────────────
type RawAny = { usage: Usage; cost_usd: number; mode?: string; effort: string; model_requested?: string; called_at: string; input_sha256?: string; claims?: unknown[]; items?: unknown[]; prompt_version: string; kind?: string };
const nowCost = (r: RawAny) => costOf(r.model_requested ?? DEFAULT_MODEL, r.usage);
export function article() {
  const ev = R("packages/pipeline/data/events", OCT);
  const rows: { stage: string; what: string; n: number; u: Agg }[] = [];
  const push = (stage: string, what: string, rs: RawAny[]) => {
    const a = z();
    for (const r of rs) add(a, r.usage, nowCost(r), r.model_requested ?? DEFAULT_MODEL);
    rows.push({ stage, what, n: rs.length, u: a });
  };
  // P-3 사실 추출 — 그래프가 지금 쓰는 출력 (문서마다 하나)
  const { docs } = loadDocs(OCT);
  const ex = docs.filter((d) => d.kind !== "TABLE").map((d) => usableRaw(OCT, d, DEFAULT_MODEL)?.raw).filter((r): r is NonNullable<typeof r> => !!r) as unknown as RawAny[];
  push("P-3 사실 추출", `글 문서 ${ex.length} (effort ${[...new Set(ex.map((r) => r.effort))].join("·")})`, ex);
  const rd = (d: string, pre: string) => (existsSync(d) ? readdirSync(d).filter((n) => n.startsWith(pre) && n.endsWith(".json")).map((n) => readJson<RawAny>(join(d, n))) : []);
  push("P-3 묶음 제안", "사실 목록 전부 1", rd(join(ev, "p3"), "merge."));
  const assigns = rd(join(ev, "p4/raw"), "assign.");
  push("P-4 요소 붙이기", `모델 사실 ${assigns.reduce((s, r) => s + (r.items?.length ?? 0), 0)} · 부르기 ${assigns.length}`, assigns);
  push("P-4 Unslotted", "1", rd(join(ev, "p4/raw"), "unslotted."));
  const p5 = rd(join(ev, "p5/raw"), "");
  const der = p5.filter((r) => r.kind === "derive").sort((a, b) => a.called_at.localeCompare(b.called_at)).at(-1)!;
  const cnt = p5.filter((r) => r.kind === "counter").sort((a, b) => (b.claims?.length ?? 0) - (a.claims?.length ?? 0))[0]!;
  push("P-5 해석", `1 (effort ${der.effort})`, [der]);
  push("P-5 반증", `해석 ${cnt.claims?.length} (effort ${cnt.effort})`, [cnt]);
  return rows;
}
function articleTable() {
  const rows = article();
  console.log("10월 FOMC 기사 한 편 몫 — 지금 그래프 · Coverage · 해석이 쓰는 저장 출력의 토큰을 즉시 값으로 (다시 부른 것 · 버린 것 빼고)\n");
  console.log("| 단계 | 무엇 | 입력 | 캐시 쓰기 | 캐시 읽기 | 출력 | 즉시 값 | 출력 몫 | 배치 값 |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  let t = 0;
  for (const r of rows) {
    const s = split(DEFAULT_MODEL, r.u);
    const v = s.in + s.cw + s.cr + s.out;
    t += v;
    console.log(`| ${r.stage} | ${r.what} | ${k(r.u.in)} | ${k(r.u.cw)} | ${k(r.u.cr)} | ${k(r.u.out)} | ${usd(v)} | ${Math.round((s.out / v) * 100)}% | ${usd(v * BATCH_FACTOR)} |`);
  }
  console.log(`| **합** | | | | | | **${usd(t)}** | | **${usd(t * BATCH_FACTOR)}** |`);
}

// ── 사실 추출 (9월 · 골든) ───────────────────────────────────────────────────────────────────────────
type ExOut = { _what: string; event: string; label: string; effort: Effort; mode: string; prompt_version: string; request_sha256: string; stored_request_sha256: string | null; usage: Usage | null; cost_usd: number; output: string | null; error: string | null; called_at: string };
const exPath = (label: string, effort: string, mode: string) => join(DIR, "extract", `${label}.${effort}.${mode}.json`);

async function extract(argv: string[], effort: Effort, labels: string[]) {
  const budget = needBudget(argv), mode = modeArg(argv);
  const conf = EVENTS[SEPT]!;
  const { docs } = loadDocs(SEPT);
  const pick = labels.map((l) => docs.find((d) => d.label === l) ?? (() => { throw new Error(`9월 문서 ${l} 없음`); })());
  const reqs: CallReq[] = [];
  const meta: { label: string; stored: string | null }[] = [];
  for (const d of pick) {
    if (existsSync(exPath(d.label, effort, mode))) { console.log(`  ${d.label} ${effort} ${mode} — 저장돼 있다`); continue; }
    const input = modelInput(d);
    const user = userMessage(conf, { label: d.label, title: d.title, publisher: d.publisher, published_at: d.published_at, url: d.url, storyline: d.storyline, after: d.after }, input);
    reqs.push({ event: "W-6", source_label: `extract:${SEPT}:${d.label}:${effort}`, model: DEFAULT_MODEL, effort, system: SYSTEM_PROMPT, user, schema: OUTPUT_SCHEMA, prompt_version: "p3-extract/3", text_sha256: d.text_sha256, max_tokens: 64000, est_usd: ((input.length / 3 + 5000) * 4 + Math.min(32000, (2 * input.length) / 3 + 4000) * 20) / 1e6 });
    meta.push({ label: d.label, stored: usableRaw(SEPT, d, DEFAULT_MODEL)?.raw.request_sha256 ?? null });
  }
  mkdirSync(join(DIR, "extract"), { recursive: true });
  const rs = await callMany(reqs, { mode, budget, conc: 3 });
  rs.forEach((r, i) => {
    const m = meta[i]!;
    if (r.skipped) return console.log(`  ${m.label} 보내지 않음 — ${r.error}`);
    const o: ExOut = {
      _what: "W-6 — 9월 문서 사실 추출을 effort · 부르는 길만 바꿔 다시 (잰다 · 그래프에 안 들어간다). stored_request_sha256 = p3-golden 에 저장된 출력(즉시 · medium)의 요청 지문 — medium 이면 같아야 한다",
      event: SEPT, label: m.label, effort, mode, prompt_version: "p3-extract/3", request_sha256: r.request_sha256, stored_request_sha256: m.stored, usage: r.usage, cost_usd: Number(r.cost_usd.toFixed(6)), output: r.ok ? r.text : null, error: r.error, called_at: new Date().toISOString(),
    };
    writeFileSync(exPath(m.label, effort, mode), JSON.stringify(o, null, 2) + "\n");
    console.log(`  ${m.label} ${effort} ${mode} — ${r.ok ? `출력 ${r.usage!.output_tokens} · 캐시 읽기 ${r.usage!.cache_read_input_tokens} · $${r.cost_usd.toFixed(3)}${m.stored === r.request_sha256 ? " · 저장된 요청과 같은 요청" : effort === "medium" ? " · ⚠ 저장된 요청과 다르다" : ""}` : `실패 ${r.error}`}`);
  });
}

type F = { claim_text: string; fact_type: string; passages: string[]; event_at: string | null; actor: string | null };
const variants = () => (existsSync(join(DIR, "extract")) ? [...new Set(readdirSync(join(DIR, "extract")).map((n) => n.split(".").slice(1, 3).join(".")))].sort() : []);
function spans(text: string, ps: string[]) {
  return ps.map((p) => { const i = text.indexOf(p); return i < 0 ? null : [i, i + p.length] as [number, number]; });
}
const overlap = (a: ([number, number] | null)[], b: ([number, number] | null)[]) => a.some((x) => x && b.some((y) => y && x[0] < y[1] && y[0] < x[1]));

/** 골든 사실마다: 9월 판정(compare.json)이 가리킨 사실(저장된 즉시 medium 출력의 key) · 새 출력에서 구절이 원문에서 겹치는 사실 */
function extractCompare() {
  const cmp = readJson<{ models: Record<string, { judgements: Record<string, { status: string; keys: string[] }> }> }>(R("packages/pipeline/data/p3-golden", SEPT, "compare.json"));
  const jd = Object.values(cmp.models)[0]!.judgements;
  const store = readJson<{ facts: { label: string; fact_id: string; claim_text: string }[] }>(R("fixtures/store.json"));
  const gl = new Map(store.facts.map((f) => [f.label, f]));
  const { docs } = loadDocs(SEPT);
  const vs = variants();
  const judge = existsSync(join(DIR, "extract-judge.json")) ? readJson<{ judgements: Record<string, Record<string, { status: string; keys: string[]; note?: string }>> }>(join(DIR, "extract-judge.json")).judgements : {};
  const sampled = new Set(readdirSync(join(DIR, "extract")).map((n) => n.split(".")[0]!));
  const summary: Record<string, Record<string, number>> = {};
  const tok: Record<string, { out: number; usd: number; facts: number; docs: number; nopass: number }> = {};
  for (const v of vs) {
    tok[v] = { out: 0, usd: 0, facts: 0, docs: 0, nopass: 0 };
    for (const l of sampled) {
      const p = join(DIR, "extract", `${l}.${v}.json`);
      if (!existsSync(p)) continue;
      const o = readJson<ExOut>(p);
      const text = docs.find((d) => d.label === l)!.text;
      const fs = o.output ? (JSON.parse(o.output) as { facts: F[] }).facts : [];
      tok[v].out += o.usage?.output_tokens ?? 0; tok[v].usd += o.cost_usd; tok[v].facts += fs.length; tok[v].docs++;
      tok[v].nopass += fs.filter((f) => spans(text, f.passages).some((s) => !s)).length;
    }
  }
  // 저장된 즉시 medium (P-3b) 의 같은 문서 값
  const base = { out: 0, usd: 0, facts: 0, docs: 0, nopass: 0 };
  for (const l of sampled) {
    const d = docs.find((x) => x.label === l)!;
    const r = usableRaw(SEPT, d, DEFAULT_MODEL);
    if (!r?.output) continue;
    const fs = (JSON.parse(r.output) as { facts: F[] }).facts;
    base.out += (r.raw.usage as Usage).output_tokens; base.usd += r.raw.cost_usd; base.facts += fs.length; base.docs++;
    base.nopass += fs.filter((f) => spans(d.text, f.passages).some((s) => !s)).length;
  }
  console.log(`표본 문서 ${[...sampled].sort().join(" · ")}\n`);
  for (const [label, j] of Object.entries(jd)) {
    const keys = j.keys.filter((x) => sampled.has(x.split("#")[0]!));
    if (!keys.length) continue;
    console.log(`■ ${label} [${j.status} · ${keys.join(" ")}] ${gl.get(label)?.claim_text}`);
    for (const key of keys) {
      const [l, i] = key.split("#") as [string, string];
      const d = docs.find((x) => x.label === l)!;
      const base = (JSON.parse(usableRaw(SEPT, d, DEFAULT_MODEL)!.output!) as { facts: F[] }).facts[Number(i)]!;
      console.log(`   즉시 medium ${key}: ${base.claim_text}`);
      const bs = spans(d.text, base.passages);
      for (const v of vs) {
        const p = join(DIR, "extract", `${l}.${v}.json`);
        if (!existsSync(p)) continue;
        const o = readJson<ExOut>(p);
        const fs = o.output ? (JSON.parse(o.output) as { facts: F[] }).facts : [];
        const hits = fs.map((f, n) => ({ f, n })).filter(({ f }) => overlap(bs, spans(d.text, f.passages)));
        console.log(`   ${v.padEnd(13)} ${hits.length ? hits.map(({ f, n }) => `${l}#${n}: ${f.claim_text}`).join("\n                 ") : "— 구절이 겹치는 사실 없음"}`);
      }
    }
    for (const v of vs) {
      const jj = judge[v]?.[label];
      if (jj) { (summary[v] ??= {})[jj.status] = (summary[v]![jj.status] ?? 0) + 1; console.log(`   판정 ${v.padEnd(13)} ${jj.status}${jj.keys.length ? ` (${jj.keys.join(" ")})` : ""}${jj.note ? ` — ${jj.note}` : ""}`); }
    }
  }
  const base9 = Object.values(jd).filter((j) => j.keys.some((x) => sampled.has(x.split("#")[0]!)));
  console.log(`\n| | 골든 판정 (표본 문서에 key 가 있는 것 ${base9.length}) | 사실 수 | 구절이 원문에 없음 | 출력 토큰 | 값 |`);
  console.log("|---|---|---|---|---|---|");
  const bc: Record<string, number> = {};
  for (const j of base9) bc[j.status] = (bc[j.status] ?? 0) + 1;
  console.log(`| 저장된 즉시 medium (P-3b) | ${JSON.stringify(bc)} | ${base.facts} | ${base.nopass} | ${base.out} | ${usd(base.usd)} |`);
  for (const v of vs) console.log(`| ${v} | ${JSON.stringify(summary[v] ?? {})} | ${tok[v]!.facts} | ${tok[v]!.nopass} | ${tok[v]!.out} | ${usd(tok[v]!.usd)} |`);
}

// ── P-4 요소 붙이기 (한 묶음) ─────────────────────────────────────────────────────────────────────────
async function assign(argv: string[], effort: Effort) {
  const budget = needBudget(argv), mode = modeArg(argv);
  const p = join(DIR, "assign", `${effort}.${mode}.json`);
  if (existsSync(p)) return console.log(`  ${p} 저장돼 있다`);
  const { schema, graph, elementIds } = p4load(OCT);
  const ch = graph.facts.filter((f) => !isTableFact(f)).slice(0, CHUNK);
  const user = assignUser(evCtx(OCT, graph), schema.slots, ch.map((f) => ({ key: f.label, doc: factDocs(f).join("+"), event_at: f.event_at, fact_type: f.fact_type, actor: f.actor, claim_text: f.claim_text })));
  const [r] = await callMany([{ event: "W-6", source_label: `assign:${OCT}:${ch[0]!.label}..${ch.at(-1)!.label}:${effort}`, model: DEFAULT_MODEL, effort, system: ASSIGN_SYSTEM, user, schema: assignSchema(elementIds), prompt_version: ASSIGN_VERSION, text_sha256: sha256(user), max_tokens: 32000, est_usd: ((user.length / 2.5 + 3000) * 4 + ch.length * 90 * 20) / 1e6 }], { mode, budget });
  if (!r!.ok) return console.log(`  실패 ${r!.error}`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ _what: "W-6 — P-4 요소 붙이기 한 묶음 (모델 사실 처음 140 · 지금 그래프) 을 effort 만 바꿔 (잰다 · Coverage 에 안 들어간다)", effort, mode, items: ch.map((f) => ({ key: f.label, fact_id: f.fact_id })), usage: r!.usage, cost_usd: Number(r!.cost_usd.toFixed(6)), input_sha256: sha256(user), output: r!.text, called_at: new Date().toISOString() }, null, 2) + "\n");
  console.log(`  assign ${effort} ${mode} — 출력 ${r!.usage!.output_tokens} · $${r!.cost_usd.toFixed(3)}`);
}

// ── P-5 (effort 만) ───────────────────────────────────────────────────────────────────────────────────
async function p5(argv: string[], kind: "derive" | "counter", effort: Effort) {
  const budget = needBudget(argv), mode = modeArg(argv);
  const p = join(DIR, "p5", `${kind}.${effort}.${mode}.json`);
  if (existsSync(p)) return console.log(`  ${p} 저장돼 있다`);
  const q = requestOf(OCT, kind, null);
  const [r] = await callMany([{ event: "W-6", source_label: `p5-${kind}:${OCT}:${effort}`, model: DEFAULT_MODEL, effort, system: q.system, user: q.user, schema: q.schema, prompt_version: q.version, text_sha256: sha256(q.user), max_tokens: q.maxTok, est_usd: q.est_usd }], { mode, budget });
  if (!r!.ok) return console.log(`  실패 ${r!.error}`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ _what: `W-6 — P-5 ${kind} 를 effort 만 바꿔 (지금 그래프 · ${q.version} · 잰다 — claims.json 에 안 들어간다)`, kind, effort, mode, prompt_version: q.version, graph_sha256: q.x.graph_sha256, input_sha256: sha256(q.user), claims: q.sentClaims ?? null, usage: r!.usage, cost_usd: Number(r!.cost_usd.toFixed(6)), output: r!.text, called_at: new Date().toISOString() }, null, 2) + "\n");
  console.log(`  p5 ${kind} ${effort} ${mode} — 입력 ${r!.usage!.input_tokens} · 출력 ${r!.usage!.output_tokens} · $${r!.cost_usd.toFixed(3)}`);
}

// ── 나란히 (사람이 볼 표) ─────────────────────────────────────────────────────────────────────────────
function side() {
  // P-4: 같은 사실의 요소가 같은가 (저장된 즉시 medium 과 · 잰 것끼리)
  const ad = join(DIR, "assign");
  if (existsSync(ad)) {
    const { graph, elementIds } = p4load(OCT);
    const { got } = modelAssignments(OCT, graph, elementIds);
    const runs = readdirSync(ad).filter((n) => n.endsWith(".json")).map((n) => ({ name: n.replace(/\.json$/, ""), ...readJson<{ items: { key: string; fact_id: string }[]; output: string; usage: Usage; cost_usd: number }>(join(ad, n)) }));
    const asg = (r: (typeof runs)[number]) => {
      const o = JSON.parse(r.output) as { assignments: { key: string; elements: string[] }[] };
      const m = new Map(r.items.map((i) => [i.key, i.fact_id]));
      return new Map(o.assignments.map((a) => [m.get(a.key)!, [...new Set(a.elements.filter((e) => elementIds.includes(e)))].sort().join(" ")]));
    };
    const stored = new Map([...got].map(([id, v]) => [id, v.elements.join(" ")]));
    console.log("P-4 요소 붙이기 — 사실 140 (같은 묶음) · 저장된 것은 즉시 medium (다른 묶음 구성으로 불렀다)\n");
    console.log("| 잰 것 | 출력 토큰 | 값 | 저장(즉시 medium)과 요소가 같은 사실 | 요소 없음 ↔ 있음 |");
    console.log("|---|---|---|---|---|");
    const maps = runs.map((r) => ({ r, m: asg(r) }));
    for (const { r, m } of maps) {
      const ids = [...m.keys()];
      const same = ids.filter((id) => stored.get(id) === m.get(id)).length;
      const flip = ids.filter((id) => !stored.get(id) !== !m.get(id)).length;
      console.log(`| ${r.name} | ${r.usage.output_tokens} | ${usd(r.cost_usd)} | ${same}/${ids.length} | ${flip} |`);
    }
    for (let i = 0; i < maps.length; i++) for (let j = i + 1; j < maps.length; j++) {
      const a = maps[i]!, b = maps[j]!;
      const ids = [...a.m.keys()].filter((id) => b.m.has(id));
      console.log(`| ${a.r.name} ↔ ${b.r.name} | | | ${ids.filter((id) => a.m.get(id) === b.m.get(id)).length}/${ids.length} | ${ids.filter((id) => !a.m.get(id) !== !b.m.get(id)).length} |`);
    }
  }
  // P-5: 해석 문장 · 반증 결과를 나란히
  const pd = join(DIR, "p5");
  if (existsSync(pd)) {
    const ev = R("packages/pipeline/data/events", OCT, "p5/raw");
    const raws = readdirSync(ev).map((n) => readJson<RawAny & { output: string }>(join(ev, n)));
    const der0 = raws.filter((r) => r.kind === "derive").sort((a, b) => a.called_at.localeCompare(b.called_at)).at(-1)!;
    const cnt0 = raws.filter((r) => r.kind === "counter").sort((a, b) => (b.claims?.length ?? 0) - (a.claims?.length ?? 0))[0]!;
    for (const n of readdirSync(pd).filter((x) => x.endsWith(".json"))) {
      const w = readJson<{ kind: string; effort: string; mode: string; usage: Usage; cost_usd: number; output: string; prompt_version: string }>(join(pd, n));
      const base = w.kind === "derive" ? der0 : cnt0;
      console.log(`\nP-5 ${w.kind} — 앞 (${base.prompt_version} · effort ${base.effort} · 즉시 · 출력 ${base.usage.output_tokens} · ${usd(nowCost(base))}) ↔ 잰 것 (${w.prompt_version} · effort ${w.effort} · ${w.mode} · 출력 ${w.usage.output_tokens} · ${usd(w.cost_usd)} — 즉시 값 ${usd(costOf(DEFAULT_MODEL, w.usage))})`);
      if (w.kind === "derive") {
        const a = (JSON.parse(base.output) as { claims: { key: string; statement: string; kind: string; basis: string[]; element: string }[] }).claims;
        const b = (JSON.parse(w.output) as { claims: { key: string; statement: string; kind: string; basis: string[]; element: string }[] }).claims;
        console.log(`  해석 후보 ${a.length} ↔ ${b.length} · 근거 사실 평균 ${(a.reduce((s, c) => s + c.basis.length, 0) / a.length).toFixed(1)} ↔ ${(b.reduce((s, c) => s + c.basis.length, 0) / b.length).toFixed(1)} · DEFENSIVE ${a.filter((c) => c.kind === "DEFENSIVE").length} ↔ ${b.filter((c) => c.kind === "DEFENSIVE").length}`);
        const els = [...new Set([...a, ...b].map((c) => c.element))].sort();
        console.log("\n| 요소 | 앞 (high) | 잰 것 |\n|---|---|---|");
        for (const e of els) console.log(`| ${e} | ${a.filter((c) => c.element === e).map((c) => `(${c.kind[0]}) ${c.statement}`).join("<br>") || "—"} | ${b.filter((c) => c.element === e).map((c) => `(${c.kind[0]}) ${c.statement}`).join("<br>") || "—"} |`);
      } else {
        type CR = { key: string; checks: { question: string; outcome: string; facts: string[] }[]; narrowed_statement: string | null };
        const a = (JSON.parse(base.output) as { results: CR[] }).results, b = (JSON.parse(w.output) as { results: CR[] }).results;
        const cnt = (rs: CR[], o: string) => rs.flatMap((r) => r.checks).filter((c) => c.outcome === o).length;
        console.log(`  물음 ${a.flatMap((r) => r.checks).length} ↔ ${b.flatMap((r) => r.checks).length} · ${["NOT_REFUTED", "SCOPED", "UNRESOLVED", "REFUTED"].map((o) => `${o} ${cnt(a, o)} ↔ ${cnt(b, o)}`).join(" · ")} · 좁힌 문장 ${a.filter((r) => r.narrowed_statement).length} ↔ ${b.filter((r) => r.narrowed_statement).length}`);
        console.log("\n| 해석 key | 앞 (high) outcome | 잰 것 outcome | 좁힌 문장 (잰 것) |\n|---|---|---|---|");
        for (const r of a) {
          const s = b.find((x) => x.key === r.key);
          console.log(`| ${r.key} | ${r.checks.map((c) => c.outcome[0]).join("")} | ${s ? s.checks.map((c) => c.outcome[0]).join("") : "—"} | ${s?.narrowed_statement ?? ""} |`);
        }
      }
    }
  }
}

// ── W-2 시험 묶음 (의미 대조) ─────────────────────────────────────────────────────────────────────────
function w2side() {
  const mine = existsSync(join(DIR, "w2/raw")) ? readdirSync(join(DIR, "w2/raw")).filter((n) => n.endsWith(".jsonl")).map((n) => ({ model: n.split(".")[0]!, effort: n.split(".")[1] as Effort })) : [];
  const runs = [...w2build(w2runs()).runs.map((r) => ({ r, where: "W-2 · 즉시" })), ...w2build(mine, join(DIR, "w2/raw")).runs.map((r) => ({ r, where: "W-6 · 배치" }))];
  console.log("W-2 시험 묶음 107 (보기 빼고) — 맞는 예 56 · 구절 부족 16 · 넘침 · 어긋남 31\n");
  console.log("| 모델 · effort | 판 | 잘못 막음 (맞는 예 56) | 구절 부족 잡음 (16) | 넘침 · 어긋남 잡음 (31) | 그 부분을 가리킴 | 모양 문제 (verdict ≠ issues) | 값 (적힌 값) | 즉시 값으로 |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const { r, where } of runs) {
    const s = r.summary;
    const now = where.includes("배치") ? r.cost.usd / BATCH_FACTOR : r.cost.usd;
    console.log(`| ${r.model.replace("claude-", "")} · ${r.effort} | ${where} | ${s.right.false_block} | ${s.wrong_short.caught} | ${s.wrong_bad.caught} | ${s.wrong_bad.pointed} | ${s.shape_problems} | ${usd(r.cost.usd)} | ${usd(now)} |`);
  }
  for (const { r, where } of runs) if (where.includes("W-6")) console.log(`\n${r.model} · ${r.effort}: 놓친 것 ${r.missed.join(" · ") || "—"} · 잘못 막은 것 ${r.false_blocks.join(" · ") || "—"} · 모양 문제 ${r.rows.filter((x) => !x.missing && "shape" in x && x.shape.length).map((x) => x.id).join(" · ") || "—"}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (x: string) => (argv.includes(x) ? argv[argv.indexOf(x) + 1] : undefined);
  const effort = (opt("--effort") ?? "medium") as Effort;
  if (argv.includes("--ledger")) return ledgerTable();
  if (argv.includes("--article")) return articleTable();
  if (argv.includes("--extract")) return extract(argv, effort, (opt("--docs") ?? "").split(",").filter(Boolean));
  if (argv.includes("--extract-compare")) return extractCompare();
  if (argv.includes("--assign")) return assign(argv, effort);
  if (argv.includes("--p5")) return p5(argv, opt("--p5") as "derive" | "counter", effort);
  if (argv.includes("--side")) return side();
  if (argv.includes("--w2")) return w2side();
  throw new Error("--ledger | --article | --extract | --extract-compare | --assign | --p5 derive|counter | --side");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
