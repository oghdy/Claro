// P-5 — 해석(Derived Claim) 후보 + 반증 기록 (FINDINGS §7 스테이지 6 · §7.2). 명령:
//
//     pnpm --filter @claro/pipeline p5 FOMC-20261028 --derive-call             # 해석 후보 (Opus · p5-derive) → p5/raw/derive.*.json
//     pnpm --filter @claro/pipeline p5 FOMC-20261028 --counter-call [--only DC-03,DC-07]   # 반증 (Opus · p5-counter · 따로 부른다) → p5/raw/counter.*.json
//       (W-6: 두 부르기 모두 --step S --budget USD 가 있어야 부른다 — 장부의 Step 칸 · 상한. 기본은 배치 (값이 반) · --now 는 즉시)
//     pnpm --filter @claro/pipeline p5 FOMC-20261028                           # 저장한 출력에서 p5/claims.json 을 짓는다 (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline p5 FOMC-20261028 --check                   # 다시 지어 파일과 글자 단위로 같은지
//
// 무엇이 어디서 오나
//   해석 · 근거 사실 · 물음 · 정치 표시        p5-derive 출력 (label 은 짓기가 출력 순서로 DC-01 … — 9월의 DC-A … 와 섞이지 않게 수로)
//   반증 물음 · 답 · 답의 사실 · outcome        p5-counter 출력. 해석(문장 · 종류 · 근거)이 부를 때와 같을 때만 쓴다 · 같은 해석을 여러 번 불렀으면 마지막 것
//   statement                                    SCOPED 가 있으면 좁힌 문장 (계약: "반증을 거친 뒤의 문장") · 원래 문장은 _statement_before
//   판정 (VALID …)                               **저장하지 않는다** (DATA_MODEL §7.3) — 검사(verify-claims.py --report)와 이 명령의 출력이 checks 에서 계산한다
//   recollected                                  답의 사실 가운데 P-5 가 다시 모은 문서(pack.json p5_recollect.added)의 것이 있으면 true
//   [뒤] · _after_event                         사실의 가장 이른 출처 공개일이 사건 날짜 뒤 (D33-b — 표시만 · 발행 검사는 발행일로 따로)
//   _d5                                          모델 표시 또는 코드 낱말 규칙 (D44 — 정치에 닿는 해석은 따로 모은다)
//   [뒤 · 회의 기록]                             [뒤] 사실 가운데 이 사건 회의의 기록(pack.json item role "record" — 회의록)에서 온 것. 회의 뒤 공개 · 회의 안의 논의 (W-1 · 프롬프트에만)
//   한 문장 (P5-e)                               statement 의 문장 수 (sentenceCount). /2 출력부터 한 문장이 아니면 problems — verify-claims CL_SENTENCE 가 따로 잰다
//   checkpoints                                  events/<code>/checkpoints.json 의 OPEN 물음 (사람이 둔 것 — W3-c) 을 반증 부르기에 같이 보내고, 답을 claims.json checkpoints 에 (답이 있을 때만)
// 판: 지금 판(p5-derive/2 · p5-counter/2) 출력이 없으면 앞 판(/1) 출력으로 짓는다 (P5_COMPAT) — claims.json 의 derive_version · counter_version 은 실제로 쓴 판
// 모델 출력이 가리킨 사실은 label 로 받고, 부를 때의 fact_id · 사실 글 sha256 을 같이 저장한다 — 짓기 때 그래프의 같은 label 이 같은 사실이 아니면 멈춘다 (다시 불러야)
// 그래프(p3) · coverage(p4) · 골든(fixtures)은 읽기만 한다. 계약 모양 밖의 것은 _ 주석
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { DEFAULT_MODEL, PRICE, callMany, modeArg, needBudget, spent, spentOf, type Budget, type Effort, type Mode } from "./llm.ts";
import { EVENTS, uuidFrom } from "./p3.ts";
import {
  COUNTER_SYSTEM, COUNTER_VERSION, DERIVE_SYSTEM, DERIVE_VERSION, P5_COMPAT, counterSchema, counterUser, deriveSchema, deriveUser, exemplarBlock, versionNo,
  type Checkpoint, type Ctx, type ExemplarClaim,
} from "./p5-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const evDir = (code: string) => R("packages/pipeline/data/events", code);
const outDir = (code: string) => join(evDir(code), "p5");
export const EFFORT: Effort = "high";

type Fact = { fact_id: string; label: string; claim_text: string; fact_type: string; actor: string | null; event_at: string | null; _from?: string[] };
type Graph = { event_id: string; facts: Fact[]; fact_sources: { fact_id: string; source_id: string }[] };
type Src = { source_id: string; label: string; title: string; publisher: string; published_at: string };
type Cov = {
  graph_sha256: string;
  slots: { id: string; name: string; elements: { id: string; what: string; status: string; labels: string[]; basis?: string }[] }[];
  unslotted: { groups: { title: string; labels: string[] }[] };
};
type Raw = {
  _what: string; event: string; kind: "derive" | "counter"; prompt_version: string; model: string; model_requested: string; effort: string;
  input_sha256: string; request_sha256: string; graph_sha256: string; claims?: { key: string; claim_sha256: string }[]; checkpoints?: { id: string; question_sha256: string }[];
  refs: Record<string, [string, string]>; response_id: string; stop_reason: string; usage: unknown; duration_ms: number; cost_usd: number;
  called_at: string; output_sha256: string; output: string;
  mode?: "batch"; batch_id?: string;   // W-6 — 배치로 받은 출력 (cost_usd 는 배치 값)
};
type DClaim = { key: string; statement: string; kind: "ASSERTED" | "DEFENSIVE"; basis: string[]; question: string; element: string; d5: boolean; d5_why: string | null; note: string | null };
type CCheck = { question: string; element: string | null; answer: string; facts: string[]; outcome: "NOT_REFUTED" | "SCOPED" | "UNRESOLVED" | "REFUTED"; missing: string | null };
type CResult = { key: string; checks: CCheck[]; narrowed_statement: string | null; reader_picture: string };
type CPoint = { id: string; answer: string; facts: string[]; outcome: "ANSWERED" | "UNRESOLVED"; missing: string | null };
type CheckpointFile = { checkpoints: (Checkpoint & { status: "OPEN" | "CLOSED"; answer_from?: string; until?: string })[] };

/** 문장 수 (P5-e) — 마침표 · 물음표 · 느낌표 (뒤에 따옴표 · 괄호가 붙어도) 다음에 공백이나 끝. 머리글자("Lisa D. Cook" · "U.S.")와 소수점("3.7")은 끝이 아니다.
 *  인용 안의 마침표 뒤에 조사가 이어지면 ("'…필요하다.' 고 했다") 끝이 아니다.
 *  verify-claims.py 가 같은 규칙을 따로 짠다 (CL_SENTENCE) */
export function sentenceCount(text: string): number {
  const s = text.trim();
  if (!s) return 0;
  let n = 1;
  for (const m of s.matchAll(/[.!?。]["'”’)\]]*(?=\s|$)/g)) {
    const i = m.index!;
    if (/(^|[\s.(])[A-Z]$/.test(s.slice(Math.max(0, i - 3), i))) continue; // 머리글자
    const rest = s.slice(i + m[0].length);
    if (/^\s*(?:이라고|라고|라며|이라는|라는|고|며|는|란)(?=[\s,.]|$)/.test(rest)) continue; // 인용 안의 마침표 — "'…필요하다.' 고 했다"
    if (rest.trim()) n++;
  }
  return n;
}

/** 사람이 둔 확인할 물음 (W-1 · W3-c) — 없으면 빈 목록 */
export function readCheckpoints(code: string): CheckpointFile["checkpoints"] {
  const p = join(evDir(code), "checkpoints.json");
  return existsSync(p) ? readJson<CheckpointFile>(p).checkpoints : [];
}
const cpSha = (k: Checkpoint) => sha256(JSON.stringify([k.id, k.question, k.why]));

// D44 — 정치에 닿는 낱말 (코드의 그물 · 모델 표시를 덮지 않고 더한다)
export const D5_WORDS = ["정치", "백악관", "대통령", "Trump", "트럼프", "청문", "독립성", "의장 교체", "의장이 바뀌", "취임", "Powell", "중간선거", "선거", "정치적 압력"];

export function load(code: string) {
  const conf = EVENTS[code];
  if (!conf || conf.kind !== "pack") throw new Error(`P-5 는 소스 팩 사건만 — ${code}`);
  const d = evDir(code);
  const graphText = readFileSync(join(d, "p3/graph.json"), "utf8");
  const graph = JSON.parse(graphText) as Graph;
  const cov = readJson<Cov>(join(d, "p4/coverage.json"));
  if (cov.graph_sha256 !== sha256(graphText)) throw new Error("coverage.json 이 지금 그래프로 지어지지 않았다 — p4 를 먼저");
  const store = readJson<{ sources: Src[] }>(join(d, "store.json"));
  const bls = readJson<{ sources: Src[] }>(join(d, "bls/bls.json"));
  const srcs = new Map([...store.sources, ...bls.sources].map((s) => [s.source_id, s]));
  const v2 = readJson<{ _fact_refs: { fact_id: string; label: string }[]; _graph_sha256: string }>(R("packages/pipeline/data/storylines/SL-iran-war/v2.json"));
  if (v2._graph_sha256 !== sha256(graphText)) throw new Error("스토리라인 v2 가 지금 그래프로 지어지지 않았다 — p4 를 먼저");
  const pack = readJson<{ p5_recollect?: { added: string[] }; items: { label: string; role?: string }[] }>(join(d, "pack.json"));
  // 이 사건 회의의 기록 (회의록) — 회의 뒤 공개 · 회의 안의 논의 (W-1). 프롬프트의 [뒤 · 회의 기록] 표시에만 쓴다
  const recordDocs = new Set(pack.items.filter((i) => i.role === "record").map((i) => i.label));
  const golden = readJson<{ facts: { fact_id: string }[]; claims: { label: string; kind: string; statement: string; checks: { question: string; answer: string; outcome: string; facts: string[] }[] }[] }>(R("fixtures/store.json"));
  // 사실의 가장 이른 출처 공개일 (날짜만)
  const firstPub = new Map<string, string>();
  const docsOf = new Map<string, string[]>();
  for (const r of graph.fact_sources) {
    const s = srcs.get(r.source_id);
    if (!s) throw new Error(`Source ${r.source_id} 를 모른다`);
    const day = String(s.published_at).slice(0, 10);
    const cur = firstPub.get(r.fact_id);
    if (!cur || day < cur) firstPub.set(r.fact_id, day);
    const l = docsOf.get(r.fact_id) ?? [];
    if (!l.includes(s.label)) l.push(s.label);
    docsOf.set(r.fact_id, l);
  }
  const byLabel = new Map(graph.facts.map((f) => [f.label, f]));
  const after = (f: Fact) => (firstPub.get(f.fact_id) ?? "") > conf.date;
  const elementIds = cov.slots.flatMap((s) => s.elements.map((e) => e.id));
  const elementOf = new Map(cov.slots.flatMap((s) => s.elements.map((e) => [e.id, { slot: s, el: e }] as const)));
  const afterMark = (f: Fact) => (!after(f) ? "" : (docsOf.get(f.fact_id) ?? []).some((l) => recordDocs.has(l)) ? " [뒤 · 회의 기록]" : " [뒤]");
  return { conf, graph, graphText, graph_sha256: sha256(graphText), cov, srcs, v2, pack, golden, firstPub, docsOf, byLabel, after, afterMark, recordDocs, elementIds, elementOf };
}
export type L = ReturnType<typeof load>;

export function ctx(code: string, x: L): Ctx {
  const docs = [...new Map([...x.srcs.values()].map((s) => [s.label, s])).values()]
    .filter((s) => x.graph.fact_sources.some((r) => r.source_id === s.source_id))
    .map((s) => `${s.label} · ${s.title} · ${s.publisher} · ${String(s.published_at).slice(0, 10)}${String(s.published_at).slice(0, 10) > x.conf.date ? (x.recordDocs.has(s.label) ? " [뒤 · 회의 기록]" : " [뒤]") : ""}`).join("\n");
  const slots = x.cov.slots.map((s) => `${s.id} ${s.name}\n${s.elements.map((e) => `  ${e.id} ${e.what} — ${e.status}${e.labels.length ? `: ${e.labels.join(" ")}` : e.basis ? ` (${e.basis.slice(0, 160)})` : ""}`).join("\n")}`).join("\n");
  const unslotted = x.cov.unslotted.groups.map((g) => `- ${g.title}: ${g.labels.join(" ")}`).join("\n");
  const storyline = x.v2._fact_refs.map((r) => r.label).join(" ");
  const facts = x.graph.facts.map((f) => `${f.label}${x.afterMark(f)} | ${(x.docsOf.get(f.fact_id) ?? []).join("+")} | ${f.event_at ?? "-"} | ${f.fact_type} | ${f.actor ?? "-"} | ${f.claim_text}`).join("\n");
  const gf = new Map(x.golden.facts.map((f) => [f.fact_id, f]));
  const ex: ExemplarClaim[] = x.golden.claims.map((c) => ({ label: c.label, kind: c.kind, statement: c.statement, checks: c.checks.map((k) => ({ question: k.question, answer: k.answer, outcome: k.outcome, n: k.facts.filter((id) => gf.has(id)).length })) }));
  return { code, what: x.conf.what, date: x.conf.date, prev_meeting: x.conf.prev_meeting, docs, slots, unslotted, storyline, facts, exemplars: exemplarBlock(ex) };
}

const claimSha = (c: { statement: string; kind: string; basis: string[] }) => sha256(JSON.stringify([c.statement, c.kind, c.basis]));

/** 저장한 출력 — 지금 판과 앞 판(P5_COMPAT) 것, 부른 때 순서. 같은 해석은 늦게 부른 것이 이긴다 (지금 판이 앞 판보다 늦다) */
export function readRaws(code: string, kind: "derive" | "counter", version: string): Raw[] {
  const d = join(outDir(code), "raw");
  if (!existsSync(d)) return [];
  const ok = new Set([version, ...Object.keys(P5_COMPAT).filter((v) => v.split("/")[0] === version.split("/")[0])]);
  return readdirSync(d).filter((n) => n.startsWith(`${kind}.`) && n.endsWith(".json")).map((n) => readJson<Raw>(join(d, n)))
    .filter((r) => ok.has(r.prompt_version)).sort((a, b) => a.called_at.localeCompare(b.called_at));
}

/** 출력이 가리킨 label 들 — 부를 때의 사실과 지금 그래프의 사실이 같은가 */
function refsOk(x: L, r: Raw, labels: string[], problems: string[], where: string) {
  for (const l of labels) {
    const f = x.byLabel.get(l);
    const ref = r.refs[l];
    if (!f) problems.push(`${where}: 그래프에 없는 label ${l}`);
    else if (!ref || ref[0] !== f.fact_id || ref[1] !== sha256(f.claim_text)) problems.push(`${where}: ${l} 이 부를 때의 사실과 다르다 (다시 불러야)`);
  }
}
function refsOf(x: L, labels: Iterable<string>): Record<string, [string, string]> {
  const o: Record<string, [string, string]> = {};
  for (const l of [...new Set(labels)].sort()) {
    const f = x.byLabel.get(l);
    if (f) o[l] = [f.fact_id, sha256(f.claim_text)];
  }
  return o;
}

export function verdict(kind: string, outcomes: string[]): string {
  if (!outcomes.length) return "검사 안 됨";
  if (outcomes.includes("REFUTED")) return "반증됨 (계약 밖)";
  const u = outcomes.includes("UNRESOLVED");
  // DEFENSIVE 이고 UNRESOLVED 가 있으면 — 나머지가 NOT_REFUTED · SCOPED 뿐이면 방어용 (DATA_MODEL §7.3 · D50 P5-c). SCOPED 가 있으면 statement 는 좁힌 문장 (짓기가 반증 출력의 좁힌 문장으로 바꾼다)
  if (kind === "DEFENSIVE" && u && outcomes.every((o) => o === "UNRESOLVED" || o === "NOT_REFUTED" || o === "SCOPED")) return "방어용";
  if (u) return "검사 안 됨";
  if (outcomes.every((o) => o === "NOT_REFUTED")) return "VALID";
  return "VALID WITH SCOPE";
}

// ── 짓기 ────────────────────────────────────────────────────────────────────────────────────────────
export function build(code: string) {
  const x = load(code);
  const problems: string[] = [];
  const der = readRaws(code, "derive", DERIVE_VERSION);
  if (!der.length) throw new Error("해석 후보 출력이 없다 — --derive-call 을 먼저");
  const dr = der.at(-1)!;
  if (sha256(dr.output) !== dr.output_sha256) throw new Error("derive 출력의 해시가 기록과 다르다");
  const dClaims = (JSON.parse(dr.output) as { claims: DClaim[] }).claims;
  const keyLabel = new Map(dClaims.map((c, i) => [c.key, `DC-${String(i + 1).padStart(2, "0")}`]));
  if (keyLabel.size !== dClaims.length) throw new Error("derive 출력의 key 가 겹친다");
  // 반증 — 해석마다 마지막 것 (해석이 부를 때와 같을 때만)
  const res = new Map<string, { r: CResult; raw: Raw }>();
  for (const cr of readRaws(code, "counter", COUNTER_VERSION)) {
    if (sha256(cr.output) !== cr.output_sha256) throw new Error(`counter 출력의 해시가 기록과 다르다 (${cr.input_sha256.slice(0, 12)})`);
    const sent = new Map((cr.claims ?? []).map((c) => [c.key, c.claim_sha256]));
    for (const r of (JSON.parse(cr.output) as { results: CResult[] }).results) {
      const c = dClaims.find((d) => d.key === r.key);
      if (!c || sent.get(r.key) !== claimSha(c)) continue;
      res.set(r.key, { r, raw: cr });
    }
  }
  const p5docs = new Set(x.pack.p5_recollect?.added ?? []);
  const fid = (l: string) => x.byLabel.get(l)?.fact_id;
  const slotStr = (eid: string | null) => {
    if (!eid) return null;
    const e = x.elementOf.get(eid);
    return e ? `${e.slot.name} / ${e.el.id} ${e.el.what}` : null;
  };
  const claims: Record<string, unknown>[] = [], claimsD5: Record<string, unknown>[] = [], dropped: Record<string, unknown>[] = [];
  const emptySlots: Record<string, unknown>[] = [];
  const table: { label: string; d5: boolean; kind: string; verdict: string; statement: string; before: string | null; basis: string[]; outcomes: string[]; after: boolean }[] = [];
  for (const c of dClaims) {
    const label = keyLabel.get(c.key)!;
    refsOk(x, dr, c.basis, problems, `${label} 근거`);
    if (!c.basis.length) problems.push(`${label}: 근거 사실이 없다`);
    const got = res.get(c.key);
    const checks: Record<string, unknown>[] = [];
    let narrowed: string | null = null, picture: string | null = null;
    if (got) {
      narrowed = got.r.narrowed_statement?.trim() || null;
      picture = got.r.reader_picture;
      got.r.checks.forEach((k, i) => {
        refsOk(x, got.raw, k.facts, problems, `${label} 물음 ${i + 1}`);
        if ((k.outcome === "NOT_REFUTED" || k.outcome === "SCOPED" || k.outcome === "REFUTED") && !k.facts.length) problems.push(`${label} 물음 ${i + 1}: ${k.outcome} 인데 답의 사실이 없다`);
        if (k.outcome === "UNRESOLVED" && !k.missing) problems.push(`${label} 물음 ${i + 1}: UNRESOLVED 인데 무엇이 답할지(missing)가 없다`);
        const facts = k.facts.filter((l) => x.byLabel.has(l));
        const afterL = facts.filter((l) => x.after(x.byLabel.get(l)!));
        const rec = facts.some((l) => (x.docsOf.get(fid(l)!) ?? []).some((d) => p5docs.has(d)));
        checks.push({
          question: k.question, slot: slotStr(k.element), recollected: rec, answer: k.answer, facts: facts.map((l) => fid(l)!), outcome: k.outcome,
          _labels: facts, ...(afterL.length ? { _after_event_facts: afterL, ...(afterL.length === facts.length ? { _after_event_only: true } : {}) } : {}),
          ...(k.missing ? { _missing: k.missing } : {}),
        });
        if (k.outcome === "UNRESOLVED") {
          const e = k.element ? x.elementOf.get(k.element) : null;
          emptySlots.push({ claim: label, question: k.question, element: k.element, element_status: e ? e.el.status : null, missing: k.missing });
        }
      });
    } else problems.push(`${label}: 반증 기록이 없다 — --counter-call`);
    const outcomes = checks.map((k) => k.outcome as string);
    if (outcomes.includes("SCOPED") && !narrowed) problems.push(`${label}: SCOPED 가 있는데 좁힌 문장이 없다`);
    const statement = outcomes.includes("SCOPED") && narrowed ? narrowed : c.statement;
    // 한 문장 (P5-e) — 이 문장을 낸 출력의 판이 /2 부터 (앞 판 출력은 그때 규칙이 코드에 없었다 — verify-claims 가 WARN 으로 센다)
    const from = statement !== c.statement ? got!.raw.prompt_version : dr.prompt_version;
    const ns = sentenceCount(statement);
    if (versionNo(from) >= 2 && ns !== 1) problems.push(`${label}: 문장이 ${ns} 개 — 한 문장이어야 한다 (P5-e · ${from})`);
    const d5Code = D5_WORDS.filter((w) => `${c.statement} ${narrowed ?? ""} ${c.question}`.includes(w));
    const d5 = c.d5 || d5Code.length > 0;
    const basisAfter = c.basis.filter((l) => x.byLabel.has(l) && x.after(x.byLabel.get(l)!));
    const row = {
      claim_id: uuidFrom(`${code}|${dr.prompt_version}|${dr.output_sha256}|${c.key}`), // 그 출력의 판 (앞 판 출력으로 지어도 id 가 바뀌지 않게)
      label, event_id: x.graph.event_id, statement, kind: c.kind, basis: c.basis.filter((l) => x.byLabel.has(l)).map((l) => fid(l)!), checks: checks.map(({ question, slot, recollected, answer, facts, outcome, ...rest }) => ({ question, slot, recollected, answer, facts, outcome, ...rest })),
      _basis_labels: c.basis, _question: c.question, _element: c.element,
      ...(statement !== c.statement ? { _statement_before: c.statement } : {}),
      ...(picture ? { _reader_picture: picture } : {}),
      ...(basisAfter.length ? { _basis_after_event: basisAfter } : {}),
      ...(d5 ? { _d5: true, _d5_by: [c.d5 ? "model" : null, d5Code.length ? `code (${d5Code.join(" · ")})` : null].filter(Boolean).join(" + "), ...(c.d5_why ? { _d5_why: c.d5_why } : {}) } : {}),
      ...(c.note ? { _note: c.note } : {}),
    };
    const v = verdict(c.kind, outcomes);
    if (outcomes.includes("REFUTED")) dropped.push({ ...row, _why: "반증이 이겼다 — 계약 outcome 셋 밖 (DATA_MODEL §7.2 '반증이 이긴 경우는 미확인'). 해석 목록에서 뺐다" });
    else (d5 ? claimsD5 : claims).push(row);
    table.push({ label, d5, kind: c.kind, verdict: v, statement, before: statement !== c.statement ? c.statement : null, basis: c.basis, outcomes, after: basisAfter.length > 0 });
  }
  // 체크포인트 (W3-c) — 늦게 부른 반증 출력의 답 (보낸 물음과 지금 checkpoints.json 의 물음이 같을 때만)
  const cps = readCheckpoints(code);
  const cpOut: Record<string, unknown>[] = [];
  const usedCounters = [...new Set([...res.values()].map((v) => v.raw))].sort((a, b) => a.called_at.localeCompare(b.called_at));
  for (const k of cps) {
    let ans: { a: CPoint; raw: Raw } | null = null;
    for (const r of usedCounters) {
      if (!(r.checkpoints ?? []).some((y) => y.id === k.id && y.question_sha256 === cpSha(k))) continue;
      const a = ((JSON.parse(r.output) as { checkpoints?: CPoint[] }).checkpoints ?? []).find((y) => y.id === k.id);
      if (a) ans = { a, raw: r };
    }
    if (!ans) {
      if (k.status === "OPEN" && usedCounters.some((r) => versionNo(r.prompt_version) >= 2)) problems.push(`체크포인트 ${k.id}: 반증 출력에 답이 없다 — --counter-call 을 다시`);
      continue;
    }
    refsOk(x, ans.raw, ans.a.facts, problems, `체크포인트 ${k.id}`);
    if (ans.a.outcome === "ANSWERED" && !ans.a.facts.length) problems.push(`체크포인트 ${k.id}: ANSWERED 인데 답의 사실이 없다`);
    if (ans.a.outcome === "UNRESOLVED" && !ans.a.missing) problems.push(`체크포인트 ${k.id}: UNRESOLVED 인데 무엇이 답할지(missing)가 없다`);
    const facts = ans.a.facts.filter((l) => x.byLabel.has(l));
    cpOut.push({ id: k.id, question: k.question, status: k.status, answer: ans.a.answer, outcome: ans.a.outcome, facts: facts.map((l) => fid(l)!), _labels: facts, ...(ans.a.missing ? { _missing: ans.a.missing } : {}), _raw: `counter.${ans.raw.input_sha256.slice(0, 12)}` });
  }
  const cnt = (o: string) => table.flatMap((t) => t.outcomes).filter((x) => x === o).length;
  const out = {
    _what: `${code} 의 해석(Derived Claim) 후보와 반증 기록 (P-5 · p5.ts 가 저장한 모델 출력에서 짓는다 — 손으로 고치지 않는다). claims · claims_d5 는 계약 모양 (DATA_MODEL §1 DerivedClaim · CounterCheck) + _ 주석. ` +
      `판정(VALID …)은 저장하지 않는다 — checks 에서 계산한다 (§7.3 · verify-claims.py --report). claims_d5 = 정치에 닿는 해석 (D44 — 도윤이 D5 를 정한 뒤 본다). dropped = 반증이 이긴 해석 (계약 밖). empty_counter_slots = 답이 그래프에 없던 반증 물음 (§7.2 — 다시 모으기)`,
    event: code, event_id: x.graph.event_id, graph: `packages/pipeline/data/events/${code}/p3/graph.json`, graph_sha256: x.graph_sha256,
    derive_version: dr.prompt_version, counter_version: [...new Set(usedCounters.map((r) => r.prompt_version))].sort().join(" + ") || COUNTER_VERSION, model: DEFAULT_MODEL, derive_raw: `derive.${dr.input_sha256.slice(0, 12)}`,
    counter_raws: [...new Set([...res.values()].map((v) => `counter.${v.raw.input_sha256.slice(0, 12)}`))].sort(),
    counts: {
      candidates: dClaims.length, claims: claims.length, claims_d5: claimsD5.length, dropped: dropped.length,
      checks: table.reduce((a, t) => a + t.outcomes.length, 0), NOT_REFUTED: cnt("NOT_REFUTED"), SCOPED: cnt("SCOPED"), UNRESOLVED: cnt("UNRESOLVED"), REFUTED: cnt("REFUTED"),
      verdicts: Object.fromEntries([...new Set(table.map((t) => t.verdict))].sort().map((v) => [v, table.filter((t) => t.verdict === v).length])),
      empty_counter_slots: emptySlots.length, problems: problems.length,
    },
    claims, claims_d5: claimsD5, dropped, empty_counter_slots: emptySlots, ...(cpOut.length ? { checkpoints: cpOut } : {}), problems,
  };
  return { out, table, x };
}

// ── 모델 부르기 ─────────────────────────────────────────────────────────────────────────────────────
const est = (chars: number, outTok: number) => ((chars / 1.6 + 5000) * PRICE[DEFAULT_MODEL]!.in + outTok * PRICE[DEFAULT_MODEL]!.out) / 1e6;

/** 부를 요청 (W-6: w6.ts 가 같은 요청을 effort 만 바꿔 잰다 — 그래서 따로 낸다) */
export function requestOf(code: string, kind: "derive" | "counter", only: string[] | null) {
  const x = load(code);
  const c = ctx(code, x);
  let user: string, system: string, schema: object, version: string, maxTok: number, sentClaims: { key: string; claim_sha256: string }[] | undefined, sentCps: Checkpoint[] = [];
  if (kind === "derive") {
    [user, system, schema, version, maxTok] = [deriveUser(c), DERIVE_SYSTEM, deriveSchema(x.elementIds), DERIVE_VERSION, 32000];
  } else {
    const der = readRaws(code, "derive", DERIVE_VERSION).at(-1);
    if (!der) throw new Error("--derive-call 을 먼저");
    const dc = (JSON.parse(der.output) as { claims: DClaim[] }).claims;
    const lab = new Map(dc.map((d, i) => [d.key, `DC-${String(i + 1).padStart(2, "0")}`]));
    const pick = only ? dc.filter((d) => only.includes(lab.get(d.key)!)) : dc;
    if (!pick.length) throw new Error("반증할 해석이 없다");
    sentClaims = pick.map((d) => ({ key: d.key, claim_sha256: claimSha(d) }));
    sentCps = readCheckpoints(code).filter((k) => k.status === "OPEN");
    [user, system, schema, version, maxTok] = [counterUser(c, pick.map((d) => ({ key: d.key, statement: d.statement, kind: d.kind, basis: d.basis })), sentCps), COUNTER_SYSTEM, counterSchema(x.elementIds), COUNTER_VERSION, 64000];
  }
  return { x, user, system, schema, version, maxTok, sentClaims, sentCps, est_usd: est(user.length, kind === "derive" ? 12000 : 30000) };
}

async function call(code: string, kind: "derive" | "counter", only: string[] | null, mode: Mode, budget: Budget) {
  const { x, user, system, schema, version, maxTok, sentClaims, sentCps, est_usd: e } = requestOf(code, kind, only);
  console.log(`p5 ${code} --${kind}-call — 입력 ${user.length}자 · 대략 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" 쓴 돈 $${spentOf(budget.step).toFixed(3)} / 상한 $${budget.budget}`);
  const [r] = await callMany([{ event: code, source_label: kind === "derive" ? "P5-DERIVE" : `P5-COUNTER(${sentClaims!.length})`, model: DEFAULT_MODEL, effort: EFFORT, system, user, schema, prompt_version: version, text_sha256: sha256(user), max_tokens: maxTok, est_usd: e }], { mode, budget });
  if (r!.skipped) throw new Error(`멈춤 — ${r!.error}`);
  if (!r!.ok || r!.text == null) throw new Error(`실패 — ${r!.error}`);
  const o = JSON.parse(r!.text);
  const labels = kind === "derive" ? (o.claims as DClaim[]).flatMap((d) => d.basis) : [...(o.results as CResult[]).flatMap((y) => y.checks.flatMap((k) => k.facts)), ...((o.checkpoints ?? []) as CPoint[]).flatMap((k) => k.facts)];
  const raw: Raw = {
    _what: `P-5 ${kind === "derive" ? "해석 후보" : "반증"} (모델 출력 — p5.ts 가 쓴다 · 손으로 고치지 않는다). 프롬프트 src/p5-prompt.ts ${version}. refs = 출력이 가리킨 label → 부를 때의 [fact_id, 사실 글 sha256]${kind === "counter" ? " · claims = 보낸 해석의 key 와 [문장 · 종류 · 근거]의 sha256" : ""}`,
    event: code, kind, prompt_version: version, model: r!.model!, model_requested: DEFAULT_MODEL, effort: EFFORT,
    input_sha256: sha256(user), request_sha256: r!.request_sha256, graph_sha256: x.graph_sha256, ...(sentClaims ? { claims: sentClaims } : {}), ...(sentCps.length ? { checkpoints: sentCps.map((k) => ({ id: k.id, question_sha256: cpSha(k) })) } : {}),
    refs: refsOf(x, labels), response_id: r!.response_id!, stop_reason: r!.stop_reason!, usage: r!.usage, duration_ms: r!.duration_ms,
    cost_usd: Number(r!.cost_usd.toFixed(6)), called_at: new Date().toISOString(), output_sha256: sha256(r!.text), output: r!.text,
    ...(r!.mode === "batch" ? { mode: r!.mode, batch_id: r!.batch_id! } : {}),
  };
  mkdirSync(join(outDir(code), "raw"), { recursive: true });
  writeFileSync(join(outDir(code), "raw", `${kind}.${sha256(user).slice(0, 12)}.json`), JSON.stringify(raw, null, 2) + "\n");
  const u = r!.usage!;
  console.log(`  ${r!.model} 입력 ${u.input_tokens} · 출력 ${u.output_tokens} · ${(r!.duration_ms / 1000).toFixed(0)}초 · $${r!.cost_usd.toFixed(3)}${r!.mode === "batch" ? " (배치)" : ""} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} · 장부 $${spent().toFixed(3)}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a, i) => !a.startsWith("--") && !["--only", "--step", "--budget"].includes(argv[i - 1] ?? ""));
  if (!code) throw new Error("사건 code");
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1]!.split(",") : null;
  if (argv.includes("--derive-call")) return call(code, "derive", null, modeArg(argv), needBudget(argv));
  if (argv.includes("--counter-call")) return call(code, "counter", only, modeArg(argv), needBudget(argv));
  const { out, table } = build(code);
  const body = JSON.stringify(out, null, 2) + "\n";
  const p = join(outDir(code), "claims.json");
  if (argv.includes("--check")) {
    const same = existsSync(p) && readFileSync(p, "utf8") === body;
    console.log(`p5 ${code} --check — claims.json ${same ? "같다" : "다르다"}`);
    if (!same) process.exitCode = 1;
    return;
  }
  mkdirSync(outDir(code), { recursive: true });
  writeFileSync(p, body);
  const c = out.counts;
  console.log(`p5 ${code} — 후보 ${c.candidates} (해석 ${c.claims} · _d5 ${c.claims_d5} · 반증됨 ${c.dropped}) · 물음 ${c.checks}: NOT_REFUTED ${c.NOT_REFUTED} · SCOPED ${c.SCOPED} · UNRESOLVED ${c.UNRESOLVED} · REFUTED ${c.REFUTED} · 빈 반증 슬롯 ${c.empty_counter_slots} · 문제 ${c.problems}`);
  console.log(`  판정 ${Object.entries(c.verdicts).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  for (const t of table) console.log(`  ${t.label}${t.d5 ? " _d5" : ""} [${t.kind} · ${t.verdict}] ${t.statement}\n      ${t.outcomes.join(" ")} · 근거 ${t.basis.join(" ")}${t.after ? " · 근거에 [뒤]" : ""}`);
  for (const pr of out.problems) console.log(`  문제 ${pr}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
