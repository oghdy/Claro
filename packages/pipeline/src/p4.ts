// P-4 — Coverage 점검 · Unslotted 탐색 · 스토리라인 새 판 (FINDINGS §7 스테이지 4 · 5). 명령:
//
//     pnpm --filter @claro/pipeline p4 FOMC-20261028 --assign-call      # 요소가 붙지 않은 모델 사실만 모델(Opus)에 보낸다 → 출력을 저장 (p4/raw/)
//     pnpm --filter @claro/pipeline p4 FOMC-20261028 --unslotted-call   # 어느 요소에도 붙지 않은 사실에서 Unslotted 묶음 후보 → 저장
//     pnpm --filter @claro/pipeline p4 FOMC-20261028                    # 저장한 출력 + 표 규칙에서 coverage.json · 스토리라인 v2 를 짓는다 (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline p4 FOMC-20261028 --check            # 다시 지어 파일과 글자 단위로 같은지
//
// 무엇이 어디서 오나
//   스키마 (슬롯 · 요소 · 표 규칙 · 빈 요소의 상태)   packages/pipeline/coverage-schema.json — 사람이 쓴다
//   사실 → 요소                                        모델 사실은 p4-assign (붙인 근거 why) · 표 · BLS 사실은 table_rules (코드) · 성명문 문장 차이(S13.a)는 코드
//   요소의 상태                                        사실 1 개 이상 = FOUND · 없으면 스키마 if_empty (없으면 짓기가 멈춘다)
//                                                      스토리라인 요소(storyline)는 그 스토리라인의 새 판을 이 실행이 지었을 때만 FOUND — 아니면 STORYLINE_STALE
//   슬롯의 채움 / 일부 / 빔                            요소에서 계산 (계약 밖 — 사람이 보는 면)
//   대표 사실                                          요소마다 source_priority 순서로 첫 문서의 가장 앞 사실 하나 (판단 아님)
//
// 쓰는 것: p4/coverage.json (계약 SlotCheck 줄 + 사람이 보는 슬롯 표 + 사실마다 붙인 근거) · data/storylines/SL-iran-war/v2.json (계약 모양 — Storyline · StorylineVersion · Fact · FactSource)
// 그래프(p3/graph.json)는 읽기만 한다. 고치지 않는다.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { DEFAULT_MODEL, STEP, STOP_AT_USD, PRICE, callJson, spent, spentStep } from "./llm.ts";
import { EVENTS, loadDocs, uuidFrom } from "./p3.ts";
import {
  ASSIGN_SYSTEM, ASSIGN_VERSION, UNSLOTTED_SCHEMA, UNSLOTTED_SYSTEM, UNSLOTTED_VERSION, assignSchema, assignUser, unslottedUser,
  type SchemaSlot,
} from "./p4-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const CHUNK = 140;
const V2_DATE = "2026-11-10"; // 새 판을 만든 날 (P-4). 짓기가 결정적이어야 해서 고정 — 다시 판을 올리면 새 값

type Fact = Record<string, unknown> & { fact_id: string; label: string; claim_text: string; fact_type: string; actor: string | null; event_at: string | null; _from?: string[]; _table?: unknown };
type FS = Record<string, unknown> & { fact_id: string; source_id: string; span_start: number; span_end: number };
type Graph = { event: string; event_id: string; facts: Fact[]; fact_sources: FS[] };
type IfEmpty = { status: "NOT_EXTRACTED" | "SOURCE_UNAVAILABLE" | "NOT_APPLICABLE" | "STORYLINE_STALE"; sources?: string[]; basis: string };
type Schema = {
  version: string; applies_to: string[]; source_priority: string[]; slots: SchemaSlot[];
  table_rules: { rules: { doc: string; match?: string; elements: string[] }[] };
  if_empty: Record<string, IfEmpty>;
};
type RawAssign = {
  _what: string; event: string; prompt_version: string; model: string; model_requested: string; effort: string; schema_version: string;
  items: { key: string; fact_id: string; claim_sha256: string }[]; input_sha256: string; request_sha256: string; response_id: string; stop_reason: string;
  usage: unknown; duration_ms: number; cost_usd: number; called_at: string; output_sha256: string; output: string;
};

const SCHEMA_PATH = R("packages/pipeline/coverage-schema.json");
const out = (code: string) => join(EVENTS[code]!.out, "..", "p4");
const graphPath = (code: string) => join(EVENTS[code]!.out, "graph.json");
const SL_DIR = R("packages/pipeline/data/storylines");

const factDocs = (f: Fact): string[] => (f._from ? [...new Set(f._from.map((k) => k.split("#")[0]!))] : f.label.startsWith("BLS-") ? ["BLS-API-1110"] : []);
const isTableFact = (f: Fact) => !!f._table || f.label.startsWith("BLS-");

function load(code: string) {
  const conf = EVENTS[code];
  if (!conf || conf.kind !== "pack") throw new Error(`P-4 는 소스 팩 사건만 — ${code}`);
  const schema = readJson<Schema>(SCHEMA_PATH);
  if (!schema.applies_to.includes(code)) throw new Error(`coverage-schema.json 이 ${code} 에 쓰이지 않는다`);
  const graphText = readFileSync(graphPath(code), "utf8");
  const graph = JSON.parse(graphText) as Graph;
  const elementIds = schema.slots.flatMap((s) => s.elements.map((e) => e.id));
  if (new Set(elementIds).size !== elementIds.length) throw new Error("요소 id 가 겹친다");
  for (const k of Object.keys(schema.if_empty)) if (!elementIds.includes(k)) throw new Error(`if_empty 의 ${k} 가 스키마에 없다`);
  for (const r of schema.table_rules.rules) for (const e of r.elements) if (!elementIds.includes(e)) throw new Error(`table_rules 의 ${e} 가 스키마에 없다`);
  return { conf, schema, graph, graph_sha256: sha256(graphText), elementIds };
}

function eventSummary(graph: Graph): string {
  // 사건 요약 = 그래프의 성명문 사실 글 그대로 (해석을 보태지 않는다)
  const pick = (key: string) => graph.facts.find((f) => f._from?.includes(key))?.claim_text;
  return ["결정 · 표결 · 반대 (10월 성명문 사실 그대로):", pick("ST-10#1"), pick("ST-10#0"), pick("ST-10#11"), pick("ST-10#12")].filter(Boolean).join("\n- ");
}
const evCtx = (code: string, graph: Graph) => {
  const c = EVENTS[code]!;
  return { code, what: c.what, date: c.date, prev_meeting: c.prev_meeting, summary: eventSummary(graph) };
};

// ── 저장한 모델 출력 ───────────────────────────────────────────────────────────────────────────────
function readAssignRaws(code: string): RawAssign[] {
  const d = join(out(code), "raw");
  if (!existsSync(d)) return [];
  return readdirSync(d).filter((n) => n.startsWith(`assign.`) && n.endsWith(".json")).sort().map((n) => readJson<RawAssign>(join(d, n)));
}
/** fact_id → 모델이 붙인 것 (사실의 글이 같을 때만 — 글이 바뀌면 다시 불러야 한다) */
function modelAssignments(code: string, graph: Graph, elementIds: string[]) {
  const byId = new Map(graph.facts.map((f) => [f.fact_id, f]));
  const got = new Map<string, { elements: string[]; why: string; raw: string }>();
  const problems: string[] = [];
  for (const r of readAssignRaws(code)) {
    if (r.prompt_version !== ASSIGN_VERSION) continue;
    if (sha256(r.output) !== r.output_sha256) throw new Error(`assign 출력의 해시가 기록과 다르다 (${r.input_sha256.slice(0, 12)})`);
    const o = JSON.parse(r.output) as { assignments: { key: string; elements: string[]; why: string }[] };
    const keyTo = new Map(r.items.map((i) => [i.key, i]));
    for (const a of o.assignments) {
      const it = keyTo.get(a.key);
      if (!it) {
        problems.push(`출력에 받지 않은 key ${a.key}`);
        continue;
      }
      const f = byId.get(it.fact_id);
      if (!f || sha256(f.claim_text) !== it.claim_sha256) continue; // 그래프에서 사라졌거나 글이 바뀌었다 — 이 출력은 쓰지 않는다
      const bad = a.elements.filter((e) => !elementIds.includes(e));
      if (bad.length) problems.push(`${a.key}: 모르는 요소 ${bad.join(" ")}`);
      got.set(it.fact_id, { elements: [...new Set(a.elements.filter((e) => elementIds.includes(e)))].sort(), why: a.why, raw: `assign.${r.input_sha256.slice(0, 12)}` });
    }
    for (const it of r.items) if (!o.assignments.some((a) => a.key === it.key)) problems.push(`출력에 빠진 key ${it.key}`);
  }
  return { got, problems };
}

function tableAssign(schema: Schema, f: Fact): { elements: string[]; why: string } | null {
  if (!isTableFact(f)) return null;
  const doc = factDocs(f)[0]!;
  const rule = schema.table_rules.rules.find((r) => r.doc === doc && (!r.match || new RegExp(r.match).test(f.claim_text)));
  if (!rule) return { elements: [], why: `표 규칙 없음 (${doc})` };
  return { elements: [...rule.elements], why: `표 규칙 ${doc}${rule.match ? ` /${rule.match}/` : ""} → ${rule.elements.join(" ")}` };
}

// ── 성명문 문장 차이 (S13.a · 코드) ─────────────────────────────────────────────────────────────────────
function statementSentences(text: string): { s: string; start: number; end: number }[] {
  const a0 = text.indexOf("approved the following statement");
  const b = text.indexOf("For media inquiries");
  if (a0 < 0 || b < 0) throw new Error("성명문 본문의 경계를 못 찾았다");
  const a = text.lastIndexOf("\n", a0) + 1; // 그 줄의 처음부터 ("The Federal Open Market Committee approved …")
  const res: { s: string; start: number; end: number }[] = [];
  // 문장 끝 = 줄 끝 · 또는 마침표 / 쌍점 뒤 공백. 이름 머리글자("Lisa D. Cook")와 소수점에서는 자르지 않는다
  let st = a;
  const push = (end: number) => {
    const raw = text.slice(st, end);
    const lead = raw.length - raw.trimStart().length;
    const s = raw.trim();
    if (s) res.push({ s, start: st + lead, end: st + lead + s.length });
    st = end;
  };
  for (let i = a; i < b; i++) {
    const ch = text[i]!;
    if (ch === "\n") push(i);
    else if ((ch === "." || ch === ":") && /\s/.test(text[i + 1] ?? "") && !(ch === "." && /(^|\s)[A-Z]$/.test(text.slice(Math.max(a, i - 2), i)))) push(i + 1);
  }
  push(b);
  return res;
}
function statementDiff(code: string, graph: Graph) {
  const { docs } = loadDocs(code);
  const st10 = docs.find((d) => d.label === "ST-10")!, st09 = docs.find((d) => d.label === "ST-09")!;
  const a = statementSentences(st09.text), b = statementSentences(st10.text);
  const A = new Set(a.map((x) => x.s)), B = new Set(b.map((x) => x.s));
  // 사실의 span 이 그 문장 안에 있나 (JS 글자 위치 — span 은 코드 포인트지만 이 두 성명문 앞부분에 BMP 밖 글자가 없다는 것을 아래에서 확인)
  for (const d of [st09, st10]) if ([...d.text.slice(0, 9000)].length !== d.text.slice(0, 9000).length) throw new Error(`${d.label}: BMP 밖 글자 — 위치 단위를 맞춰야 한다`);
  const factsIn = (sid: string, x: { start: number; end: number }) =>
    [...new Set(graph.fact_sources.filter((fs) => fs.source_id === sid && fs.span_start >= x.start && fs.span_end <= x.end).map((fs) => fs.fact_id))];
  const lab = new Map(graph.facts.map((f) => [f.fact_id, f.label]));
  const only09 = a.filter((x) => !B.has(x.s)).map((x) => ({ sentence: x.s, facts: factsIn(st09.source_id, x).map((id) => lab.get(id)) }));
  const only10 = b.filter((x) => !A.has(x.s)).map((x) => ({ sentence: x.s, facts: factsIn(st10.source_id, x).map((id) => lab.get(id)) }));
  const same = a.filter((x) => B.has(x.s)).map((x) => x.s);
  const factIds = [...new Set([...a.filter((x) => !B.has(x.s)).flatMap((x) => factsIn(st09.source_id, x)), ...b.filter((x) => !A.has(x.s)).flatMap((x) => factsIn(st10.source_id, x))])];
  return { method: "문장 단위 — 성명문 본문('… approved the following statement' 줄 ~ 'For media inquiries')을 줄 끝 · 마침표 · 쌍점으로 나눠 (이름 머리글자는 자르지 않는다) 글자 그대로 견준다. 바뀐 문장 안에 span 이 있는 그래프 사실을 S13.a 에 붙인다", only_09: only09, only_10: only10, same, factIds };
}

// ── 스토리라인 새 판 (SL-iran-war v2) ────────────────────────────────────────────────────────────────────
function storylineV2(code: string, graph: Graph) {
  const conf = EVENTS[code]!;
  const sl = conf.storyline!;
  const golden = readJson<{ storylines: { storyline_id: string; code: string; title: string; version: number; ongoing: boolean }[]; storyline_versions: Record<string, unknown>[] }>(R("fixtures/store.json"));
  const row = golden.storylines.find((s) => s.code === sl.code)!;
  const v1 = golden.storyline_versions.filter((v) => v.storyline_id === row.storyline_id);
  if (row.version !== 1 || v1.length !== 1) throw new Error(`${sl.code}: 골든의 판이 1 이 아니다 — 새 판 번호를 다시 본다`);
  const since = String(v1[0]!.created_at); // v1 이 고정한 때 (9월 기사 발행일)
  const slDocs = new Set(sl.docs);
  const series = new Set(["EIA-B", "EIA-D"]);
  const pick = graph.facts.filter((f) => {
    const ds = factDocs(f);
    if (ds.some((d) => slDocs.has(d))) return true; // 스토리라인 문서의 사실 — 전부 (v1 에 없던 것이다. WH-0619 는 9/16 앞의 일이지만 v1 이 몰랐던 1차)
    return ds.length === 1 && series.has(ds[0]!) && !!f.event_at && f.event_at > since && f.event_at <= conf.date; // 유가 · 경유 — v1 뒤 ~ 사건 날
  });
  const facts = pick.map((f) => {
    const { _from, _storyline_doc, _after_event, ...rest } = f as Fact & { _storyline_doc?: string; _after_event?: boolean };
    return {
      ...Object.fromEntries(Object.entries(rest).filter(([k]) => !k.startsWith("_") || k === "_table")),
      fact_id: uuidFrom(`${sl.code}|v2|${f.fact_id}`), label: `v2-${f.label}`, event_id: null, storyline_id: row.storyline_id, storyline_version: 2,
      _graph_fact_id: f.fact_id, _graph_label: f.label, _graph: `packages/pipeline/data/events/${code}/p3/graph.json`, _from,
    };
  });
  const ids = new Map(pick.map((f) => [f.fact_id, uuidFrom(`${sl.code}|v2|${f.fact_id}`)]));
  const fact_sources = graph.fact_sources.filter((fs) => ids.has(fs.fact_id)).map((fs) => ({ ...fs, fact_id: ids.get(fs.fact_id)! }));
  const byDoc: Record<string, number> = {};
  for (const f of pick) for (const d of factDocs(f)) byDoc[d] = (byDoc[d] ?? 0) + 1;
  return {
    _what: `${sl.code} 의 새 판 (v2) — 계약 모양 (DATA_MODEL §1 Storyline · StorylineVersion · Fact · FactSource + _ 주석). p4.ts 가 ${code} 의 사실 그래프에서 짓는다 — 손으로 고치지 않는다. ` +
      `v1 은 골든(fixtures/store.json)에 있고 고치지 않는다 — 아래 storyline_versions 의 v1 줄은 골든에서 옮긴 것. v2 의 사실은 그래프 사실을 스토리라인 소유로 옮겨 적은 것이다 (fact_id 는 새로 · _graph_fact_id 가 원래 사실) — 소유를 어디에 둘지는 _open P4-b`,
    storylines: [{ storyline_id: row.storyline_id, code: row.code, title: row.title, version: 2, ongoing: row.ongoing, _ongoing_note: "v1 의 값을 그대로 옮겼다 — 판정하지 않았다 (_open P4-c)" }],
    storyline_versions: [
      ...v1.map((v) => ({ ...v, _copied_from: "fixtures/store.json (골든 — 고치지 않는다)" })),
      {
        storyline_id: row.storyline_id, version: 2, created_at: V2_DATE,
        change: `P-4 — v1(${since}) 뒤 ~ ${conf.date} 의 1차 사실 + v1 이 몰랐던 6/19 백악관 MOU 발표. 문서별 ${Object.entries(byDoc).map(([d, n]) => `${d} ${n}`).join(" · ")}`,
        _rule: `사실 = (1) 스토리라인 문서(${[...slDocs].join(" · ")} — 저장된 것만)의 그래프 사실 전부 (2) EIA-B · EIA-D 표 사실 가운데 event_at 이 ${since} 뒤 ~ ${conf.date}. 둘 다 코드 규칙 (p4.ts storylineV2)`,
      },
    ],
    facts,
    fact_sources,
  };
}

// ── 짓기 ────────────────────────────────────────────────────────────────────────────────────────────
export function build(code: string) {
  const { schema, graph, graph_sha256, elementIds } = load(code);
  const store = readJson<{ sources: { source_id: string; label: string }[] }>(join(EVENTS[code]!.out, "..", "store.json"));
  const bls = readJson<{ sources: { source_id: string; label: string }[] }>(join(EVENTS[code]!.out, "..", "bls", "bls.json"));
  const srcId = new Map([...store.sources, ...bls.sources].map((s) => [s.label, s.source_id]));
  const golden = readJson<{ storylines: { storyline_id: string; code: string }[] }>(R("fixtures/store.json"));
  const { got, problems } = modelAssignments(code, graph, elementIds);
  const diff = statementDiff(code, graph);
  const v2 = storylineV2(code, graph);
  const v2Built = v2.facts.length > 0;

  const perFact: Record<string, { label: string; docs: string[]; elements: string[]; why: string; by: string }> = {};
  const unassigned: string[] = [];
  for (const f of graph.facts) {
    const t = tableAssign(schema, f);
    const m = got.get(f.fact_id);
    let elements: string[], why: string, by: string;
    if (t) [elements, why, by] = [t.elements, t.why, "table_rules (코드)"];
    else if (m) [elements, why, by] = [m.elements, m.why, `${ASSIGN_VERSION} · ${m.raw}`];
    else {
      unassigned.push(f.label);
      continue;
    }
    if (diff.factIds.includes(f.fact_id) && !elements.includes("S13.a")) {
      elements = [...elements, "S13.a"].sort();
      why += " · [코드] 9월 ↔ 10월 성명문에서 바뀐 문장 안의 사실 → S13.a";
    }
    perFact[f.fact_id] = { label: f.label, docs: factDocs(f), elements, why, by };
  }
  if (unassigned.length) throw new Error(`요소를 붙이지 않은 모델 사실 ${unassigned.length} — --assign-call 을 먼저 (${unassigned.slice(0, 8).join(" ")} …)`);

  const prio = (f: Fact) => {
    const ds = factDocs(f).map((d) => schema.source_priority.indexOf(d)).filter((i) => i >= 0);
    return ds.length ? Math.min(...ds) : 999;
  };
  const after = (f: Fact) => (f.event_at && f.event_at.slice(0, 10) > EVENTS[code]!.date ? 1 : 0);
  const labelOf = new Map(graph.facts.map((f) => [f.fact_id, f]));
  const missingIfEmpty: string[] = [];
  const slots = schema.slots.map((s) => {
    const elements = s.elements.map((e) => {
      const fids = graph.facts.filter((f) => perFact[f.fact_id]!.elements.includes(e.id)).sort((x, y) => prio(x) - prio(y) || after(x) - after(y) || (y.event_at ?? "").localeCompare(x.event_at ?? "") || x.label.localeCompare(y.label)).map((f) => f.fact_id);
      let status: string, basis: string | null = null, sources: string[] = [];
      if (fids.length && e.storyline && !v2Built) [status, basis] = ["STORYLINE_STALE", `스토리라인 ${e.storyline} 의 새 판을 짓지 못했다`];
      else if (fids.length) status = "FOUND";
      else {
        const ie = schema.if_empty[e.id];
        if (!ie) {
          missingIfEmpty.push(e.id);
          status = "?";
        } else [status, basis, sources] = [ie.status, ie.basis, ie.sources ?? []];
      }
      const rep = fids[0] ? labelOf.get(fids[0])! : null;
      return {
        id: e.id, what: e.what, status, n: fids.length,
        rep: rep ? { label: rep.label, docs: factDocs(rep), claim_text: rep.claim_text } : null,
        labels: fids.map((id) => labelOf.get(id)!.label), facts: fids,
        ...(sources.length ? { sources } : {}), ...(basis ? { basis } : {}), ...(e.storyline ? { storyline: e.storyline } : {}),
      };
    });
    const st = elements.map((x) => x.status);
    const ok = (x: string) => x === "FOUND" || x === "NOT_APPLICABLE";
    const state = st.every(ok) ? "채움" : st.some((x) => x === "FOUND") ? "일부" : "빔";
    const n = new Set(elements.flatMap((x) => x.facts)).size;
    return { id: s.id, name: s.name, from_09: s.from_09, renamed: s.renamed, state, n_facts: n, elements };
  });
  if (missingIfEmpty.length) throw new Error(`빈 요소인데 coverage-schema.json if_empty 에 상태가 없다 — 사람이 본다: ${missingIfEmpty.join(" · ")}`);

  const sl = golden.storylines.find((x) => x.code === "SL-iran-war")!;
  const slot_checks = slots.flatMap((s) => s.elements.map((e) => ({
    slot: `${s.name} / ${e.id} ${e.what}`,
    status: e.status,
    facts: e.status === "FOUND" ? e.facts : [],
    sources: e.status === "NOT_EXTRACTED" ? (e.sources ?? []).map((l) => {
      const id = srcId.get(l);
      if (!id) throw new Error(`${e.id}: if_empty sources 의 ${l} 가 소스 팩 Source 에 없다`);
      return id;
    }) : [],
    storyline: e.status === "STORYLINE_STALE" ? sl.storyline_id : null,
  })));

  // Unslotted — 저장한 제안 (입력이 지금과 같을 때만)
  const noSlot = graph.facts.filter((f) => !isTableFact(f) && perFact[f.fact_id]!.elements.length === 0);
  const unsUser = unslottedUser(evCtx(code, graph), schema.slots, noSlot.map((f) => ({ key: f.label, doc: factDocs(f).join("+"), event_at: f.event_at, actor: f.actor, claim_text: f.claim_text })));
  const unsPath = join(out(code), "raw", `unslotted.${DEFAULT_MODEL}.${UNSLOTTED_VERSION.replace(/\//g, "-")}.json`);
  let unslotted: { state: string; groups: { title: string; labels: string[]; facts: string[]; why: string; unknown?: string[] }[] } = { state: "제안 없음 (--unslotted-call 을 돌리지 않았다)", groups: [] };
  if (existsSync(unsPath)) {
    const r = readJson<RawAssign>(unsPath);
    if (r.input_sha256 !== sha256(unsUser)) unslotted.state = "제안의 입력이 지금 슬롯 밖 사실 목록과 다르다 — 적용하지 않음 (--unslotted-call 을 다시)";
    else {
      const byLabel = new Map(noSlot.map((f) => [f.label, f]));
      unslotted = {
        state: `unslotted.${DEFAULT_MODEL} 적용`,
        groups: (JSON.parse(r.output) as { groups: { title: string; keys: string[]; why: string }[] }).groups.map((g) => {
          const unknown = g.keys.filter((k) => !byLabel.has(k));
          const ok = g.keys.filter((k) => byLabel.has(k));
          return { title: g.title, labels: ok, facts: ok.map((k) => byLabel.get(k)!.fact_id), why: g.why, ...(unknown.length ? { unknown } : {}) };
        }),
      };
    }
  }

  const count = (x: string) => slots.flatMap((s) => s.elements).filter((e) => e.status === x).length;
  const coverage = {
    _what: `${code} 의 Coverage 점검 (P-4 · p4.ts 가 저장한 모델 출력 · 표 규칙 · 성명문 문장 차이에서 짓는다 — 손으로 고치지 않는다). slot_checks 는 계약 SlotCheck 모양 (DATA_MODEL §1 · §12) — 요소 하나 = 한 줄. ` +
      `slots 는 사람이 보는 슬롯 표 (채움 / 일부 / 빔 은 계약 밖 — 요소에서 계산). per_fact 는 사실마다 붙인 요소와 근거 (모델의 why 또는 표 규칙)`,
    event: code, schema: schema.version, graph: `packages/pipeline/data/events/${code}/p3/graph.json`, graph_sha256,
    assign_version: ASSIGN_VERSION, unslotted_version: UNSLOTTED_VERSION, model: DEFAULT_MODEL,
    counts: {
      facts: graph.facts.length, facts_table: graph.facts.filter(isTableFact).length, facts_model: graph.facts.filter((f) => !isTableFact(f)).length,
      facts_with_element: Object.values(perFact).filter((p) => p.elements.length).length, facts_without_element: Object.values(perFact).filter((p) => !p.elements.length).length,
      slots: slots.length, slots_full: slots.filter((s) => s.state === "채움").length, slots_partial: slots.filter((s) => s.state === "일부").length, slots_empty: slots.filter((s) => s.state === "빔").length,
      elements: slot_checks.length, FOUND: count("FOUND"), NOT_EXTRACTED: count("NOT_EXTRACTED"), SOURCE_UNAVAILABLE: count("SOURCE_UNAVAILABLE"), NOT_APPLICABLE: count("NOT_APPLICABLE"), STORYLINE_STALE: count("STORYLINE_STALE"),
      unslotted_groups: unslotted.groups.length, assign_problems: problems.length,
    },
    slots,
    slot_checks,
    statement_diff: { method: diff.method, only_09: diff.only_09, only_10: diff.only_10, same: diff.same },
    unslotted,
    storyline: { code: "SL-iran-war", file: "packages/pipeline/data/storylines/SL-iran-war/v2.json", version: 2, facts: v2.facts.length },
    assign_problems: problems,
    per_fact: perFact,
  };
  return { coverage, v2, unsUser, noSlot };
}

// ── 모델 부르기 ─────────────────────────────────────────────────────────────────────────────────────
const est = (chars: number, outTok: number) => ((chars / 2.5 + 3000) * PRICE[DEFAULT_MODEL]!.in + outTok * PRICE[DEFAULT_MODEL]!.out) / 1e6;

async function assignCall(code: string) {
  const { schema, graph, elementIds } = load(code);
  const { got } = modelAssignments(code, graph, elementIds);
  const todo = graph.facts.filter((f) => !isTableFact(f) && !got.has(f.fact_id));
  console.log(`p4 ${code} --assign-call — 붙일 모델 사실 ${todo.length} · ${STEP} 에서 쓴 돈 $${spentStep().toFixed(3)}`);
  if (!todo.length) return;
  const ev = evCtx(code, graph);
  const chunks: Fact[][] = [];
  for (let i = 0; i < todo.length; i += CHUNK) chunks.push(todo.slice(i, i + CHUNK));
  mkdirSync(join(out(code), "raw"), { recursive: true });
  const run = async (ch: Fact[]) => {
    const items = ch.map((f) => ({ key: f.label, fact_id: f.fact_id, claim_sha256: sha256(f.claim_text) }));
    const user = assignUser(ev, schema.slots, ch.map((f) => ({ key: f.label, doc: factDocs(f).join("+"), event_at: f.event_at, fact_type: f.fact_type, actor: f.actor, claim_text: f.claim_text })));
    const e = est(user.length, ch.length * 90);
    if (spentStep() + e > STOP_AT_USD) {
      console.log(`  멈춤 — ${STEP} $${spentStep().toFixed(2)} + 대략 $${e.toFixed(2)} > $${STOP_AT_USD}`);
      return;
    }
    const r = await callJson({ event: code, source_label: `P4-ASSIGN(${ch[0]!.label}..${ch.at(-1)!.label})`, model: DEFAULT_MODEL, effort: "medium", system: ASSIGN_SYSTEM, user, schema: assignSchema(elementIds), prompt_version: ASSIGN_VERSION, text_sha256: sha256(user), max_tokens: 32000 });
    if (!r.ok || r.text == null) {
      console.log(`  실패 — ${r.error}`);
      return;
    }
    const raw: RawAssign = {
      _what: `P-4 사실 → Coverage 요소 (모델 출력 — p4.ts 가 쓴다 · 손으로 고치지 않는다). items = 보낸 사실 (key = 그때의 label · fact_id · 글의 sha256). 프롬프트 src/p4-prompt.ts ${ASSIGN_VERSION} · 스키마 coverage-schema.json ${schema.version}`,
      event: code, prompt_version: ASSIGN_VERSION, model: r.model!, model_requested: DEFAULT_MODEL, effort: "medium", schema_version: schema.version,
      items, input_sha256: sha256(user), request_sha256: r.request_sha256, response_id: r.response_id!, stop_reason: r.stop_reason!,
      usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(), output_sha256: sha256(r.text), output: r.text,
    };
    writeFileSync(join(out(code), "raw", `assign.${sha256(user).slice(0, 12)}.json`), JSON.stringify(raw, null, 2) + "\n");
    console.log(`  ${ch[0]!.label}..${ch.at(-1)!.label} (${ch.length}) · 출력 ${(r.usage as { output_tokens: number }).output_tokens} · ${(r.duration_ms / 1000).toFixed(0)}초 · $${r.cost_usd.toFixed(3)}`);
  };
  await Promise.all(chunks.map(run));
  console.log(`  ${STEP} 에서 쓴 돈 $${spentStep().toFixed(3)} · 장부 합 $${spent().toFixed(3)}`);
}

async function unslottedCall(code: string) {
  const { unsUser, noSlot } = build(code);
  const p = join(out(code), "raw", `unslotted.${DEFAULT_MODEL}.${UNSLOTTED_VERSION.replace(/\//g, "-")}.json`);
  if (existsSync(p) && readJson<RawAssign>(p).input_sha256 === sha256(unsUser)) {
    console.log(`p4 ${code} --unslotted-call — 같은 입력의 제안이 저장돼 있다`);
    return;
  }
  const e = est(unsUser.length, 4000);
  if (spentStep() + e > STOP_AT_USD) throw new Error(`멈춤 — ${STEP} $${spentStep().toFixed(2)} + 대략 $${e.toFixed(2)}`);
  const r = await callJson({ event: code, source_label: "P4-UNSLOTTED", model: DEFAULT_MODEL, effort: "medium", system: UNSLOTTED_SYSTEM, user: unsUser, schema: UNSLOTTED_SCHEMA, prompt_version: UNSLOTTED_VERSION, text_sha256: sha256(unsUser), max_tokens: 16000 });
  if (!r.ok || r.text == null) throw new Error(`실패 — ${r.error}`);
  const raw = {
    _what: `P-4 Unslotted 묶음 후보 (모델 출력 — p4.ts 가 쓴다). 입력 = 어느 요소에도 붙지 않은 모델 사실 (input_sha256). 판정이 아니라 사람이 볼 후보`,
    event: code, prompt_version: UNSLOTTED_VERSION, model: r.model!, model_requested: DEFAULT_MODEL, effort: "medium", schema_version: "-",
    items: noSlot.map((f) => ({ key: f.label, fact_id: f.fact_id, claim_sha256: sha256(f.claim_text) })), input_sha256: sha256(unsUser),
    request_sha256: r.request_sha256, response_id: r.response_id!, stop_reason: r.stop_reason!, usage: r.usage, duration_ms: r.duration_ms,
    cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(), output_sha256: sha256(r.text), output: r.text,
  };
  writeFileSync(p, JSON.stringify(raw, null, 2) + "\n");
  console.log(`p4 ${code} --unslotted-call — 사실 ${noSlot.length} · 묶음 ${(JSON.parse(r.text) as { groups: unknown[] }).groups.length} · $${r.cost_usd.toFixed(3)}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a) => !a.startsWith("--"));
  if (!code) throw new Error("사건 code");
  if (argv.includes("--assign-call")) return assignCall(code);
  if (argv.includes("--unslotted-call")) return unslottedCall(code);
  const { coverage, v2 } = build(code);
  const cBody = JSON.stringify(coverage, null, 2) + "\n";
  const vBody = JSON.stringify(v2, null, 2) + "\n";
  const cPath = join(out(code), "coverage.json"), vPath = join(SL_DIR, "SL-iran-war", "v2.json");
  if (argv.includes("--check")) {
    const a = existsSync(cPath) && readFileSync(cPath, "utf8") === cBody, b = existsSync(vPath) && readFileSync(vPath, "utf8") === vBody;
    console.log(`p4 ${code} --check — coverage.json ${a ? "같다" : "다르다"} · SL-iran-war/v2.json ${b ? "같다" : "다르다"}`);
    if (!a || !b) process.exitCode = 1;
    return;
  }
  mkdirSync(out(code), { recursive: true });
  mkdirSync(dirname(vPath), { recursive: true });
  writeFileSync(cPath, cBody);
  writeFileSync(vPath, vBody);
  const c = coverage.counts;
  console.log(`p4 ${code} — 슬롯 ${c.slots}: 채움 ${c.slots_full} · 일부 ${c.slots_partial} · 빔 ${c.slots_empty} · 요소 ${c.elements}: FOUND ${c.FOUND} · NOT_EXTRACTED ${c.NOT_EXTRACTED} · SOURCE_UNAVAILABLE ${c.SOURCE_UNAVAILABLE} · NOT_APPLICABLE ${c.NOT_APPLICABLE} · STORYLINE_STALE ${c.STORYLINE_STALE}`);
  console.log(`  사실 ${c.facts} (표 ${c.facts_table} · 모델 ${c.facts_model}) — 요소 있음 ${c.facts_with_element} · 없음 ${c.facts_without_element} · Unslotted 묶음 ${c.unslotted_groups} (${coverage.unslotted.state}) · assign 문제 ${c.assign_problems}`);
  for (const s of coverage.slots) {
    console.log(`  ${s.id} ${s.name} [${s.state}] 사실 ${s.n_facts}`);
    for (const e of s.elements) console.log(`     ${e.id} ${e.status.padEnd(18)} ${String(e.n).padStart(3)}  ${e.rep ? `${e.rep.label} (${e.rep.docs.join("+")}) ${e.rep.claim_text.slice(0, 70)}` : e.basis ?? ""}`);
  }
  console.log(`  성명문 차이: 9월에만 ${coverage.statement_diff.only_09.length} · 10월에만 ${coverage.statement_diff.only_10.length} · 같음 ${coverage.statement_diff.same.length}`);
  console.log(`  SL-iran-war v2: 사실 ${v2.facts.length} → ${vPath.replace(ROOT + "/", "")}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
