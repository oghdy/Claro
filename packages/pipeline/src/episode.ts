// P-E1 — 파이프라인이 회차를 낸다 (D60 · D62 · D68). 이미 있는 P-3 ~ P-5 산출물에서 회차 (docs/contract/EPISODE.md 의 Episode)를 짓는다. 명령:
//
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --count                       # 설계 · 글 요청의 입력 토큰을 센다 (count_tokens · 값 0)
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --design-call  --step P-E1 --budget 3   # A 설계 (① 뒤집기 ② 사슬 ③ 개념 ④ 틀 제안) → episode/raw/design.*.json
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --write-call   --step P-E1 --budget 3 [--models claude-fable-5-2,claude-opus-5-5]   # B 글 → episode/raw/write.<모델>.*.json
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --entail-call  --step P-E1 --budget 3   # C 함의 (근거가 붙은 글마다 · 저장된 판정이 없는 것만) → episode/raw/entail.*.jsonl
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --repair-call  --step P-E1 --budget 3   # D 걸린 글 고치기 → episode/raw/repair.*.json (그 뒤 --entail-call 을 한 번 더)
//     pnpm --filter @claro/pipeline episode FOMC-20261028                                # 짓기 — 저장한 출력에서 episode/episode.json · review.json (모델 안 부름 · 결정적)
//     pnpm --filter @claro/pipeline episode FOMC-20261028 --check                        # 다시 지어 파일과 글자 단위로 같은지
//       (모델을 부르는 것은 전부 --step S --budget USD 가 있어야 한다. 기본은 배치 (값이 반) · --now 는 즉시. --writer <모델> — 짓기에 쓸 글 출력을 고른다)
//
// 무엇이 어디서 오나 (logs/pipeline/P-E1.md ②)
//   뒤집기 · 사슬 · 자리 · 틀 · 도구 · 사람 칸 제안     A 설계 출력 (모델)
//   장면 여덟의 글 · 도구 카드 · 풀이 칸의 글          B 글 출력 (모델) — 글마다 근거 **사실 label**
//   quotes · docs                                       코드 — 그 사실의 FactSource 구절 (p3) 을 그대로. 문서의 날짜 줄은 코드가 문서 머리에서 찾아 붙인다 (`<문서>.date`)
//   episode_id · series · number · track 의 뼈 · assembly · 공통 화면 말 · 화 번호 (ui) · pickup · map 의 자리      코드
//   death · split · why · plain.why                     **제안일 뿐이다** — review.json 의 사람 확인 목록에 올린다 (EPISODE §8)
// 검사 (겹): 계약 검증 (packages/contract validateEpisode — 구절이 문서에 그대로 · 숫자 · D61 규칙) → 함의 (C) → 고치기 (D) → 다시
// P-3 ~ P-5 산출물 · 골든 · 계약은 읽기만 한다.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { PRICE, callMany, countTokens, modeArg, needBudget, requestSha, spentOf, type Budget, type CallReq, type Effort, type Mode, type Req } from "./llm.ts";
import { EVENTS, uuidFrom } from "./p3.ts";
import { SCHEMA as ENTAIL_SCHEMA, type Judgement } from "./w2-prompt.ts";
import { derive, widen } from "./w2.ts";
import {
  DESIGN_SCHEMA, DESIGN_SYSTEM, DESIGN_VERSION, ENTAIL_SYSTEM, ENTAIL_VERSION, REPAIR_SCHEMA, REPAIR_SYSTEM, REPAIR_VERSION, WRITE_SCHEMA, WRITE_VERSION,
  designUser, entailUser, parseDesign, parseWritten, writeSystem, writeUser, type Ctx, type Design, type Repair, type WT, type Written,
} from "./episode-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const evDir = (code: string) => R("packages/pipeline/data/events", code);
const outDir = (code: string) => join(evDir(code), "episode");

// 모델 배치 (D2 — 단계마다) · logs/pipeline/P-E1.md ⑤
export const MODELS = {
  design: { model: "claude-fable-5-2", effort: "high" as Effort, max_tokens: 32000 },     // 판단 — 뒤집기가 진짜인가 · 틀이 서나
  write: { model: "claude-fable-5-2", effort: "medium" as Effort, max_tokens: 48000 },    // 독자 글의 맛 (--models 로 견줄 수 있다)
  entail: { model: "claude-opus-5-5", effort: "medium" as Effort, max_tokens: 8000 },     // W-2 · D49 그대로
  repair: { model: "claude-opus-5-5", effort: "medium" as Effort, max_tokens: 16000 },    // 분명한 일 — 가리킨 데만 고친다
};
/** 슬롯 요소마다 보내는 사실 수 (구절을 실을 수 있는 것 · 최근 것 먼저) */
export const PER_ELEMENT = 6;

// 두 실물 (fixtures/episode-price-1 · episode-rate-2)에서 **글자가 같은** 화면 말 — 회차마다 새로 쓰지 않는다 (logs/pipeline/P-E1.md ②)
export const COMMON = {
  voice_fact: "문서에 적힌 사실", voice_explain: "Claro 가 풀어 쓴 설명",
  zero_no: "0화", zero_title: "지금까지의 이야기", next_no: "다음 화",
  new_hint: "이 시리즈가 처음이시네요. 지금까지의 이야기부터 짧게 볼게요.", recap_label: "지난 이야기", ask_new: "이 이야기, 어디서 시작됐죠?",
  tools_kicker: "도구 줍기", tools_sub_new: "아는 건 “알아요”를 누르면 접혀요. 접어도 언제든 다시 펼 수 있어요.",
  aha_kicker: "풀이", compare_kicker: "따라온 독자에게만",
  next_kicker: "이어짐", next_lead: "오늘은 이 시리즈의 한 회차예요. 어디까지 왔고, 무엇이 남았는지 볼게요.", line_next_when: "다음", line_next_what: "?",
  here_label: "지금 여기", tool_lead: "가는 길에 도구 하나 더.", coming_label: "다음 회차가 될 일들", unknown_label: "아직 모르는 것", next_ask: "오늘 내가 얻은 건 뭐죠?",
  keep_kicker: "남음", keep_title: "수수께끼 하나를 풀었고,\n도구가 남았어요",
  flip_label: "뒤집어 보면", again: "처음으로",
};
const ASSEMBLY = { new: ["cover", "zero", "event", "tools", "aha", "next", "keep"], follower: ["cover", "event", "tools", "aha", "compare", "next", "keep"] };
const HANGUL = ["영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱"];
const COUNT_WORD = ["영", "한", "두", "세", "네", "다섯", "여섯", "일곱"];

// ── 읽기 ─────────────────────────────────────────────────────────────────────────────────────────────
type Fact = { fact_id: string; label: string; claim_text: string; fact_type: string; actor: string | null; event_at: string | null };
type FactSource = { fact_id: string; source_id: string; span_start: number | null; span_end: number | null; _passage?: string };
type Src = { source_id: string; label: string; title: string; publisher: string; published_at: string };
type Claim = { label: string; kind: string; statement: string; basis: string[]; checks: { question: string; answer: string; outcome: string; _labels: string[]; _missing?: string }[]; _basis_labels?: string[] };
type Cov = {
  slots: { id: string; name: string; elements: { id: string; what: string; status: string; labels: string[] }[] }[];
  statement_diff: { only_09: { sentence: string; facts: string[] }[]; only_10: { sentence: string; facts: string[] }[]; same: string[] } & Record<string, unknown>;
};
type Library = {
  concepts: { concept_id: string; code: string; canonical_name: string; concept_type: string; version: number; status: string }[];
  versions: { concept_id: string; version: number; proposition: string; full: { text: string }[]; refresher: string; analogies: { name: string; text: string; limits: string[] }[] }[];
};
type SeriesFile = {
  series: { series_id: string; code: string; name: string; sub: string };
  episodes: Record<string, { number: number; code: string; past: { no: string; title: string; src_facts: string[]; calc: Record<string, string> }[]; previous_gist: string[]; prior_tools: { name: string; concepts: string[] }[]; next_document: string }>;
};
export type Passage = { key: string; doc: string; source_id: string; quote: string; span_start: number; span_end: number };

export function load(code: string) {
  const conf = EVENTS[code];
  if (!conf) throw new Error(`모르는 사건 ${code}`);
  const d = evDir(code);
  const graphText = readFileSync(join(d, "p3/graph.json"), "utf8");
  const graph = JSON.parse(graphText) as { event_id: string; facts: Fact[]; fact_sources: FactSource[] };
  const cov = readJson<Cov>(join(d, "p4/coverage.json"));
  const p5 = readJson<{ claims: Claim[]; claims_d5: Claim[]; empty_counter_slots: { claim: string; question: string; element: string; missing: string }[] }>(join(d, "p5/claims.json"));
  const store = readJson<{ sources: Src[]; events: { event_id: string; code: string }[] }>(join(d, "store.json"));
  const srcs = new Map(store.sources.map((s) => [s.source_id, s]));
  const texts = new Map<string, string>();
  const documents: { source_id: string; text: string }[] = [];
  for (const p of [join(d, "store.documents.json"), R("fixtures/store.documents.json")]) {
    for (const x of readJson<{ source_documents: { source_id: string; text: string }[] }>(p).source_documents) {
      if (texts.has(x.source_id)) continue;
      texts.set(x.source_id, x.text);
      documents.push({ source_id: x.source_id, text: x.text });
    }
  }
  const lib = readJson<Library>(R("docs/content/concept-library.json"));
  const seriesFile = readdirSync(R("packages/pipeline/data/series")).filter((n) => n.endsWith(".json")).map((n) => readJson<SeriesFile>(R("packages/pipeline/data/series", n))).find((s) => s.episodes[code]);
  if (!seriesFile) throw new Error(`data/series/*.json 에 사건 ${code} 가 없다 — 시리즈 · 지난 회차는 사람이 준다`);
  const byLabel = new Map(graph.facts.map((f) => [f.label, f]));
  // 사실의 구절 — 저장된 문서에 그대로 있는 것만 (권리: 캐시에만 있는 문서의 구절은 실을 수 없다 — UX1-g)
  const passages = new Map<string, Passage[]>();
  const docsOfFact = new Map<string, string[]>();
  const idToLabel = new Map(graph.facts.map((f) => [f.fact_id, f.label]));
  for (const r of graph.fact_sources) {
    const label = idToLabel.get(r.fact_id)!;
    const s = srcs.get(r.source_id);
    if (s) docsOfFact.set(label, [...new Set([...(docsOfFact.get(label) ?? []), s.label])]);
    const text = texts.get(r.source_id);
    if (!s || text == null || r._passage == null || r.span_start == null || r.span_end == null) continue;
    if (Array.from(text).slice(r.span_start, r.span_end).join("") !== r._passage) continue;
    const list = passages.get(label) ?? [];
    if (list.some((p) => p.doc === s.label && p.quote === r._passage)) continue;
    list.push({ key: "", doc: s.label, source_id: s.source_id, quote: r._passage, span_start: r.span_start, span_end: r.span_end });
    passages.set(label, list);
  }
  for (const [label, list] of passages) list.forEach((p, i) => { p.key = list.length === 1 ? label : `${label}.${i + 1}`; });
  // 정치에 닿는 해석 (p5 claims_d5 — D44 · D46)에만 쓰인 사실. 회차의 근거로 싣지 않는다 (D46 ③ — 오늘 요점에 꼭 필요할 때만 · 그 판단은 사람이 한다)
  const labelsOf = (cs: Claim[]) => new Set(cs.flatMap((c) => [...(c._basis_labels ?? []), ...c.checks.flatMap((k) => k._labels)]));
  const plain = labelsOf(p5.claims);
  const politicsOnly = new Set([...labelsOf(p5.claims_d5)].filter((l) => !plain.has(l)));
  return { politicsOnly, code, conf, graph, graph_sha256: sha256(graphText), cov, p5, srcs, texts, documents, lib, series: seriesFile.series, ep: seriesFile.episodes[code]!, byLabel, passages, docsOfFact, event_id: store.events.find((e) => e.code === code)?.event_id ?? graph.event_id };
}
export type L = ReturnType<typeof load>;

/** p5 가 가리킨 것 ∪ 문구 차이의 사실 ∪ 사람이 준 사실 — 두 단계가 모두 받는다 */
function coreFacts(x: L, checks = true): Set<string> {
  const pick = new Set<string>();
  for (const c of [...x.p5.claims, ...x.p5.claims_d5]) {
    for (const l of c._basis_labels ?? []) pick.add(l);
    if (checks) for (const k of c.checks) for (const l of k._labels) pick.add(l);
  }
  for (const s of [...x.cov.statement_diff.only_09, ...x.cov.statement_diff.only_10]) for (const l of s.facts) pick.add(l);
  for (const p of x.ep.past) for (const l of p.src_facts) pick.add(l);
  return pick;
}
/** 설계 단계에 보내는 사실 — 바탕 (coreFacts) ∪ 슬롯 요소마다 PER_ELEMENT (구절을 실을 수 있는 것만 · 최근 것 먼저). 전부 (814)를 보내지 않는다 — 값 */
export function selectFacts(x: L): string[] {
  const pick = coreFacts(x);
  for (const s of x.cov.slots) for (const e of s.elements) {
    const ranked = e.labels.filter((l) => x.passages.has(l)).sort((a, b) => (x.byLabel.get(b)?.event_at ?? "").localeCompare(x.byLabel.get(a)?.event_at ?? ""));
    for (const l of ranked.slice(0, PER_ELEMENT)) pick.add(l);
  }
  return x.graph.facts.map((f) => f.label).filter((l) => pick.has(l));
}
/** 글 단계에 보내는 사실 — 바탕 (반증 물음의 답에만 쓰인 사실은 뺀다) ∪ 설계가 가리킨 것 (설계가 장면마다 재료를 골라 뒀다) */
export function writeFacts(x: L, design: Design): string[] {
  const pick = coreFacts(x, false);
  const walk = (v: unknown) => {
    if (typeof v === "string") { if (x.byLabel.has(v)) pick.add(v); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(design);
  return x.graph.facts.map((f) => f.label).filter((l) => pick.has(l));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s).replace(/\n/g, " ⏎ ");
export function ctx(x: L, labels: string[] = selectFacts(x)): Ctx {
  const basisLabels = (c: Claim) => c._basis_labels ?? [];
  const pub = (l: string) => (x.docsOfFact.get(l) ?? []).map((d) => { const s = [...x.srcs.values()].find((y) => y.label === d)!; return `${d} ${String(s.published_at).slice(0, 10)}`; }).join(" + ");
  const facts = labels.map((l) => {
    const f = x.byLabel.get(l)!;
    const ps = x.passages.get(l);
    return `${l} | ${pub(l)} | ${f.event_at ?? "-"} | ${f.fact_type} | ${f.actor ?? "-"} | ${f.claim_text} | ${ps ? `[구절] ${ps.map((p) => `“${clip(p.quote, 260)}”`).join(" / ")}` : "[구절 없음]"}`;
  }).join("\n");
  const used = new Set(labels.flatMap((l) => x.docsOfFact.get(l) ?? []));
  const docs = [...x.srcs.values()].filter((s) => used.has(s.label)).map((s) => `${s.label} · ${s.title} · ${s.publisher} · ${String(s.published_at).slice(0, 10)}${String(s.published_at).slice(0, 10) > x.conf.date ? " [사건 뒤에 공개]" : ""}${x.texts.has(s.source_id) ? "" : " [원문 저장 안 됨 — 구절 없음]"}`).join("\n");
  const slots = x.cov.slots.map((s) => `${s.id} ${s.name}\n${s.elements.map((e) => `  ${e.id} ${e.what} — ${e.status} (사실 ${e.labels.length})`).join("\n")}`).join("\n");
  const sd = x.cov.statement_diff;
  const diff = [
    "지난 문서에만:", ...sd.only_09.map((s) => `  - “${s.sentence}” (${s.facts.join(" ")})`),
    "이번 문서에만:", ...sd.only_10.map((s) => `  - “${s.sentence}” (${s.facts.join(" ")})`),
    "두 문서에 글자 그대로 같은 문장:", ...sd.same.map((s) => `  - “${s}”`),
  ].join("\n");
  const claimLine = (c: Claim) => `${c.label} [${c.kind}] ${c.statement}\n   근거 ${basisLabels(c).join(" ")}\n${c.checks.map((k) => `   - (${k.outcome}) ${k.question} → ${k.answer}`).join("\n")}`;
  const claims = x.p5.claims.map(claimLine).join("\n");
  const empty = x.p5.empty_counter_slots.map((e) => `- ${e.claim} · ${e.question} — 없는 것: ${e.missing}`).join("\n");
  const politics = x.p5.claims_d5.map((c) => `${c.label} ${c.statement}`).join("\n") || "(없음)";
  const ver = new Map(x.lib.versions.map((v) => [`${v.concept_id}@${v.version}`, v]));
  const library = x.lib.concepts.filter((c) => c.status === "CANONICAL").map((c) => {
    const v = ver.get(`${c.concept_id}@${c.version}`);
    if (!v) return `${c.code} ${c.canonical_name} (${c.concept_type}) — 문안 없음`;
    return [`${c.code} ${c.canonical_name} (${c.concept_type} · v${c.version})`, `  명제: ${v.proposition}`, `  풀어 쓴 설명: ${v.full.map((f) => f.text).join(" ")}`, `  짧은 설명: ${v.refresher}`,
      ...v.analogies.map((a) => `  비유 「${a.name}」: ${a.text}${a.limits.length ? ` — 한계선: ${a.limits.join(" / ")}` : ""}`)].join("\n");
  }).join("\n");
  const e = x.ep;
  const series = [
    `시리즈: 「${x.series.name}」 — ${x.series.sub}`, `이번 화: ${e.number}화`,
    `지난 화의 제목: ${e.past.map((p) => `${p.no} “${p.title}”${p.src_facts.length ? ` (근거 ${p.src_facts.join(" ")})` : ""}`).join(" · ")}`,
    "지난 회차의 요지 (사람이 적은 것 — 숫자를 글에 쓰려면 사실 목록에서 근거를 찾아 붙인다):", ...e.previous_gist.map((g) => `  - ${g}`),
    `지난 화에서 주운 도구 (따라온 독자는 이미 안다): ${e.prior_tools.map((t) => `${t.name} (${t.concepts.join(" + ")})`).join(" · ")}`,
    `다음 문서: ${e.next_document}`,
  ].join("\n");
  return { code: x.code, what: x.conf.what, date: x.conf.date, series, docs, slots, diff, claims, empty, politics, facts, library };
}

/** 글 단계의 말투 본보기 — 다른 사건 (배달앱 1화 골든)의 글. 근거 표시는 뺀다 (글자만). 금리 2화 골든은 쓰지 않는다 */
export function exemplar(): string {
  const g = readJson<Record<string, unknown>>(R("fixtures/episode-price-1.json"));
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.t === "string" && Object.keys(o).every((k) => ["t", "src", "calc", "ui", "voice"].includes(k))) return o.voice ? `${o.t} 〔${o.voice}〕` : o.t;
      return Object.fromEntries(Object.entries(o).filter(([k]) => !["src", "basis", "picture", "stage"].includes(k)).map(([k, w]) => [k, strip(w)]));
    }
    return v;
  };
  const solve = g.solve as { entry: unknown; plain: unknown };
  const tools = (g.tools as { name: string; short: unknown; body: unknown; use: unknown }[]).map((t) => ({ name: t.name, short: t.short, body: t.body, use: t.use }));
  return JSON.stringify(strip({ series: g.series, scenes: g.scenes, tools, entry: solve.entry, plain: solve.plain }), null, 1);
}

// ── 저장한 모델 출력 ─────────────────────────────────────────────────────────────────────────────────
type Raw = {
  _what: string; event: string; kind: "design" | "write" | "repair"; prompt_version: string; model: string | null; model_requested: string; effort: string;
  input_sha256: string; request_sha256: string; graph_sha256: string; response_id: string | null; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number;
  called_at: string; output_sha256: string; output: string; mode?: "batch"; batch_id?: string;
};
const rawDir = (code: string) => join(outDir(code), "raw");
function readRaws(code: string, kind: Raw["kind"]): Raw[] {
  if (!existsSync(rawDir(code))) return [];
  return readdirSync(rawDir(code)).filter((n) => n.startsWith(`${kind}.`) && n.endsWith(".json")).map((n) => readJson<Raw>(join(rawDir(code), n))).sort((a, b) => a.called_at.localeCompare(b.called_at));
}
function saveRaw(code: string, kind: Raw["kind"], name: string, a: CallReq, r: Awaited<ReturnType<typeof callMany>>[number], graph_sha256: string) {
  if (!r.ok || r.text == null) throw new Error(`${kind} 실패 — ${r.error}`);
  const raw: Raw = {
    _what: `P-E1 회차 단계의 모델 출력 (${kind} — episode.ts 가 쓴다 · 손으로 고치지 않는다). 프롬프트 src/episode-prompt.ts ${a.prompt_version}`,
    event: code, kind, prompt_version: a.prompt_version, model: r.model, model_requested: a.model, effort: a.effort, input_sha256: sha256(a.user), request_sha256: r.request_sha256, graph_sha256,
    response_id: r.response_id, stop_reason: r.stop_reason, usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(),
    output_sha256: sha256(r.text), output: r.text, ...(r.mode === "batch" ? { mode: r.mode, batch_id: r.batch_id! } : {}),
  };
  mkdirSync(rawDir(code), { recursive: true });
  writeFileSync(join(rawDir(code), `${name}.json`), JSON.stringify(raw, null, 2) + "\n");
  const u = r.usage!;
  console.log(`  ${name}: ${r.model} 입력 ${u.input_tokens} (캐시 쓰기 ${u.cache_creation_input_tokens} · 읽기 ${u.cache_read_input_tokens}) · 출력 ${u.output_tokens} · ${(r.duration_ms / 1000).toFixed(0)}초 · $${r.cost_usd.toFixed(3)}${r.mode === "batch" ? " (배치)" : ""}`);
}
const est = (model: string, inTok: number, outTok: number) => (inTok * PRICE[model]!.in + outTok * PRICE[model]!.out) / 1e6;

export function designReq(x: L): Req & { version: string } {
  return { model: MODELS.design.model, effort: MODELS.design.effort, system: DESIGN_SYSTEM, user: designUser(ctx(x)), schema: DESIGN_SCHEMA, max_tokens: MODELS.design.max_tokens, version: DESIGN_VERSION };
}
export function latestDesign(code: string): { raw: Raw; design: Design } {
  const raw = readRaws(code, "design").filter((r) => r.prompt_version === DESIGN_VERSION).at(-1);
  if (!raw) throw new Error("--design-call 을 먼저");
  return { raw, design: parseDesign(raw.output).design };
}
/** 사람의 확인 (설계 뒤) — episode/human.json. 지금 받는 것은 틀 (frames) 하나다: 사람이 설계의 제안을 보고 틀을 켜거나 끈다 (UX-3 ⑦ "틀 승인").
 *  사람이 켤 수 있는 틀은 설계가 재료를 낸 것뿐이다 (chain.has · seats.has). 파일이 없으면 설계의 제안 그대로 */
export type Human = { after_design: { frames?: ("chain" | "seats")[]; why: string; by: string } };
export function readHuman(code: string): Human | null {
  const p = join(outDir(code), "human.json");
  return existsSync(p) ? readJson<Human>(p) : null;
}
/** 설계 + 사람의 확인 → 글 단계 · 짓기가 쓰는 설계. proposed — 파이프라인이 제안한 틀 (바꾸기 전) */
export function approvedDesign(code: string): { raw: Raw; design: Design; proposed: Design["frames"]; human: Human | null } {
  const { raw, design } = latestDesign(code);
  const human = readHuman(code);
  const proposed = design.frames;
  const want = human?.after_design.frames;
  if (!want) return { raw, design, proposed, human };
  for (const f of want) if (!design[f].has) throw new Error(`human.json: 틀 ${f} 를 켰지만 설계가 그 재료를 내지 않았다 (${f}.has = false)`);
  return { raw, design: { ...design, frames: (["chain", "seats"] as const).filter((f) => want.includes(f)) }, proposed, human };
}
export function writeReq(x: L, model: string): Req & { version: string } {
  const { design, proposed, human } = approvedDesign(x.code);
  const note = human?.after_design.frames ? `틀 (frames): 설계의 제안 [${proposed.join(", ") || "없음"}] → 사람이 정한 것 [${design.frames.join(", ") || "없음"}]. 까닭: ${human.after_design.why}\n아래 설계의 frames 는 사람이 정한 값으로 이미 바뀌어 있다. 켜진 틀의 칸을 채운다 — 재료는 설계의 chain · seats 에 있다.` : "";
  return { model, effort: MODELS.write.effort, system: writeSystem(exemplar()), user: writeUser(ctx(x, writeFacts(x, design)), JSON.stringify(design, null, 1), note), schema: WRITE_SCHEMA, max_tokens: MODELS.write.max_tokens, version: WRITE_VERSION };
}
export function latestWrite(code: string, model: string): { raw: Raw; written: Written } | null {
  const raw = readRaws(code, "write").filter((r) => r.prompt_version === WRITE_VERSION && r.model_requested === model).at(-1);
  if (!raw) return null;
  const { design } = approvedDesign(code);
  return { raw, written: parseWritten(raw.output, design.frames, design.plain_kind) };
}

// ── 글 덩이를 하나씩 — 자리 (id) 와 함께 ─────────────────────────────────────────────────────────────
/** Written 안의 모든 글 덩이 (WT). id = Written 안의 자리 ("cover.dek" · "tools[0].body[1]") */
export function textsOf(w: Written): { id: string; wt: WT }[] {
  const out: { id: string; wt: WT }[] = [];
  const walk = (v: unknown, id: string) => {
    if (Array.isArray(v)) return v.forEach((y, i) => walk(y, `${id}[${i}]`));
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (typeof o.t === "string" && Array.isArray(o.src) && Array.isArray(o.calc)) return void out.push({ id, wt: o as unknown as WT });
    for (const [k, y] of Object.entries(o)) walk(y, id ? `${id}.${k}` : k);
  };
  walk(w, "");
  return out;
}
/** 빼도 되는 자리 — 목록의 한 줄인 덩이 (줄 전체가 빠진다). 나머지는 계약의 필수 칸이라 못 뺀다 (사람이 고친다) */
const DROPPABLE = /^(cover\.recap|event\.riddle|tools\[\d+\]\.body|compare\.body|next\.unknown|lab\.setup|plain\.three\.(known|unknown))\[\d+\]$/;

type RepairLine = Repair["items"][number] & { round: number };
/** 고치기 출력을 Written 에 얹는다 (round 차례대로). drop 은 뺄 수 있는 자리만 뺀다 */
export function applyRepairs(w: Written, repairs: RepairLine[]): { written: Written; applied: RepairLine[]; cantDrop: RepairLine[] } {
  const out = structuredClone(w);
  const byId = new Map(textsOf(out).map((t) => [t.id, t.wt]));
  const applied: RepairLine[] = [], cantDrop: RepairLine[] = [], drops: string[] = [];
  for (const r of repairs) {
    const wt = byId.get(r.id);
    if (!wt) continue;
    if (r.action === "fix") { wt.t = r.t; wt.src = r.src; wt.calc = r.calc; applied.push(r); }
    else if (r.action === "drop") { if (DROPPABLE.test(r.id)) { drops.push(r.id); applied.push(r); } else cantDrop.push(r); }
    else applied.push(r);
  }
  // 뒤에서부터 뺀다 (자리 번호가 밀리지 않게)
  for (const id of [...new Set(drops)].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
    const m = /^(.*)\[(\d+)\]$/.exec(id)!;
    const list = m[1]!.split(/\.|\[|\]/).filter(Boolean).reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], out) as unknown[];
    list.splice(Number(m[2]), 1);
  }
  return { written: out, applied, cantDrop };
}
function readRepairs(code: string): RepairLine[] {
  return readRaws(code, "repair").filter((r) => r.prompt_version === REPAIR_VERSION).flatMap((r, i) => (JSON.parse(r.output) as Repair).items.map((it) => ({ ...it, round: i + 1 })));
}

// ── 짓기 — 설계 + 글 → 계약의 Episode ────────────────────────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const digitRuns = (s: string) => [...s.replace(/(\d),(?=\d{3})/g, "$1").matchAll(/\d+/g)].map((m) => String(Number(m[0])));
/** 문서 머리의 날짜 줄 — 공개일 (published_at)을 영어 날짜로 적은 첫 줄. 없으면 null. 글의 날짜 숫자의 근거로 코드가 붙인다 */
export function dateLine(text: string, published_at: string): { quote: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(published_at);
  if (!m) return null;
  const want = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
  const at = text.indexOf(want);
  if (at < 0) return null;
  const a = text.lastIndexOf("\n", at) + 1;
  const b = text.indexOf("\n", at);
  const line = text.slice(a, b < 0 ? text.length : b).trim();
  return { quote: line.length <= 160 ? line : want };
}

type ET = { t: string; src?: string[]; calc?: Record<string, string>; ui?: true; voice?: "fact" | "official" | "explain" };
export type Built = { episode: Record<string, unknown>; where: Map<string, string>; notes: string[]; followerKnown: string[] };

export function assemble(x: L, design: Design, w: Written): Built {
  const notes: string[] = [];
  const quotes: Record<string, { doc: string; quote: string }> = {};
  const docs: Record<string, { source_id: string; name: string }> = {};
  const names = new Map(w.doc_names.map((d) => [d.label, d.name]));
  const srcByLabel = new Map([...x.srcs.values()].map((s) => [s.label, s]));
  const monthNum = (q: string) => q.replace(new RegExp(MONTHS.join("|"), "g"), (mm) => String(MONTHS.indexOf(mm) + 1));
  /** 문서의 날짜 줄 (있으면) — 쓰기로 할 때만 quotes 에 넣는다 (use) */
  const dateOf = (doc: string): { key: string; nums: string[]; use: () => string } | null => {
    const s = srcByLabel.get(doc)!;
    const text = x.texts.get(s.source_id);
    const dl = text ? dateLine(text, String(s.published_at)) : null;
    if (!dl) return null;
    const key = `${doc}.date`;
    return { key, nums: digitRuns(monthNum(dl.quote)), use: () => { quotes[key] = { doc, quote: dl.quote }; return key; } };
  };
  const useDoc = (doc: string) => { const s = srcByLabel.get(doc)!; docs[doc] ??= { source_id: s.source_id, name: names.get(doc) ?? s.title }; };
  /** 사실 label → 구절 키들 */
  const keysOf = (labels: string[], where: string): string[] => {
    const keys: string[] = [];
    for (const l of labels) {
      const ps = x.passages.get(l);
      if (x.politicsOnly.has(l)) { notes.push(`${where}: 근거 ${l} 은 정치에 닿는 해석에만 쓰인 사실이다 — 근거로 싣지 않았다 (D46 ③). 그 글은 사람이 본다`); continue; }
      if (!ps) { notes.push(`${where}: 근거 ${l} 에 실을 수 있는 구절이 없다 — 뺐다`); continue; }
      for (const p of ps) { quotes[p.key] = { doc: p.doc, quote: p.quote }; useDoc(p.doc); if (!keys.includes(p.key)) keys.push(p.key); }
    }
    return keys;
  };
  const where = new Map<string, string>();   // Written 의 자리 (id) → 회차 안의 길 (JSON pointer) — tag() 가 채운다
  const made = new Map<object, string>();
  const T = (id: string, wt: WT, voice = true): ET => {
    const src = keysOf(wt.src, id);
    // 날짜 — 글의 숫자가 근거 구절에 없고 그 문서의 날짜 줄에 있으면 날짜 줄을 붙인다. 글 단계가 그 숫자를 calc 로 밝혀 뒀어도 구절이 이긴다 (계산이 아니라 문서에 적힌 날짜다)
    const have = new Set(src.flatMap((k) => digitRuns(monthNum(quotes[k]!.quote))));
    const calc = Object.fromEntries(wt.calc.flatMap((c) => digitRuns(c.n).map((k) => [k, c.how])));
    const inText = digitRuns(wt.t);
    for (const doc of [...new Set(src.map((k) => quotes[k]!.doc))]) {
      const d = dateOf(doc);
      if (!d || src.includes(d.key)) continue;
      const hit = inText.filter((n) => !have.has(n) && d.nums.includes(n));
      if (!hit.length) continue;
      src.push(d.use());
      for (const n of d.nums) { have.add(n); delete calc[n]; }
    }
    for (const k of Object.keys(calc)) if (!inText.includes(k) || have.has(k)) delete calc[k];   // 글에 없는 수 · 구절에 이미 있는 수의 calc 는 뺀다
    const et: ET = { t: wt.t, ...(src.length ? { src } : {}), ...(Object.keys(calc).length ? { calc } : {}), ...(voice && wt.voice !== "none" ? { voice: wt.voice } : {}) };
    made.set(et, id);
    return et;
  };
  const ui = (t: string): ET => ({ t, ui: true });
  /** 설계에서 온 맨 글자열 (도구 이름 · 기관 이름 · 다음 화의 개념) — 숫자가 있으면 덧붙인 말 (" — …" · " (…)")을 뗀다 (불변식 10). 설계 프롬프트 /1 이 이 규칙을 말하지 않았다 */
  const bare = (v: string, at: string): string => {
    if (!/\d/.test(v)) return v;
    const cut = v.split(/\s+—\s+|\s*\(/)[0]!.trim();
    notes.push(`${at}: 맨 글자열에 숫자가 있어 덧붙인 말을 뗐다 — “${v}” → “${cut}”`);
    return cut;
  };
  const n = x.ep.number;
  const toolKeys = design.tools.map((t) => t.key);
  const hasLab = !!w.lab && design.frames.length > 0 && !!w.entry.flip && !design.death_proposal;
  // 도구 — 설계의 차례. 글이 없는 도구는 뺀다
  const wTool = new Map(w.tools.map((t, i) => [t.key, { t, i }]));
  const codeToConcept = new Map(x.lib.concepts.map((c) => [c.code, c]));
  const tools = design.tools.filter((t) => wTool.has(t.key)).map((d) => {
    const { t, i } = wTool.get(d.key)!;
    return {
      key: d.key, name: bare(d.name, `tools.${d.key}.name`), short: T(`tools[${i}].short`, t.short), body: t.body.map((b, j) => T(`tools[${i}].body[${j}]`, b)), use: T(`tools[${i}].use`, t.use),
      basis: d.basis.filter((c) => codeToConcept.has(c)).map((c) => ({ concept_id: codeToConcept.get(c)!.concept_id, version: codeToConcept.get(c)!.version, part: null })),
    };
  });
  const keys = tools.map((t) => t.key);
  const pickup = { tools: [] as string[], aha: [] as string[], next: [] as string[] };
  for (const d of design.tools) {
    if (!keys.includes(d.key)) continue;
    let at = d.pickup;
    if (at === "aha" && (!hasLab || d.key !== design.born_tool)) { at = "tools"; notes.push(`도구 ${d.key}: 풀이에서 줍는 도구인데 체험이 없거나 born_tool 이 아니다 — 도구 줍기 장면으로 옮겼다 (UX4-d 미확인)`); }
    pickup[at].push(d.key);
  }
  const followerKnown = design.tools.filter((d) => d.prior && keys.includes(d.key)).map((d) => d.key);
  const fresh = pickup.tools.filter((k) => !followerKnown.includes(k)).length;
  const knownHere = pickup.tools.length - fresh;
  const pastT = x.ep.past.map((p) => {
    const src = keysOf(p.src_facts, `track ${p.no}`);
    return { no: /\d/.test(p.no) ? ui(p.no) : { t: p.no }, title: { t: p.title, ...(src.length ? { src } : {}), ...(Object.keys(p.calc).length ? { calc: p.calc } : {}) } as ET, state: "past" };
  });
  const flip = w.entry.flip;
  const scenes = {
    cover: {
      episode: ui(`${n}화`), title: w.cover.title, dek: T("cover.dek", w.cover.dek, false), meta: T("cover.meta", w.cover.meta, false), new_hint: { t: COMMON.new_hint },
      recap_label: COMMON.recap_label, recap: w.cover.recap.map((r, i) => T(`cover.recap[${i}]`, r, false)), ask_new: COMMON.ask_new, ask_follower: w.cover.ask_follower,
    },
    zero: {
      kicker: ui(n === 1 ? `0화 · ${COMMON.zero_title}` : n === 2 ? `0화와 1화 · ${COMMON.zero_title}` : `0화 ~ ${n - 1}화 · ${COMMON.zero_title}`), title: T("zero.title", w.zero.title, false),
      beats: w.zero.beats.map((b, i) => ({ when: T(`zero.beats[${i}].when`, b.when, false), head: b.head, body: T(`zero.beats[${i}].body`, b.body) })), ask: w.zero.ask,
    },
    event: {
      kicker: ui(`${n}화 · 오늘의 사건`), title: w.event.title, lead: T("event.lead", w.event.lead),
      figures: w.event.figures.map((f, i) => ({ who: f.who, amount: T(`event.figures[${i}].amount`, f.amount, false), tag: f.tag })), figure_note: T("event.figure_note", w.event.figure_note),
      quote_label: w.event.quote_label, quote: T("event.quote", w.event.quote), quote_note: w.event.quote_note, riddle: w.event.riddle.map((r, i) => T(`event.riddle[${i}]`, r)), ask: w.event.ask,
    },
    tools: {
      kicker: COMMON.tools_kicker, title_new: `풀기 전에,\n도구 ${COUNT_WORD[pickup.tools.length]} 개만 챙겨요`,
      title_follower: fresh === 0 ? "오늘 새로 필요한 도구는\n없어요" : `오늘 새로 필요한 도구는\n${HANGUL[fresh]}${fresh === 1 ? "예요" : "이에요"}`,
      sub_new: { t: COMMON.tools_sub_new }, sub_follower: { t: knownHere === 0 ? "오늘은 전부 처음 줍는 도구예요." : `나머지 ${HANGUL[knownHere]}${knownHere === 1 ? "는" : "은"} 지난 화에서 주우셨어요. 접어 뒀어요.` }, ask: w.tools_scene.ask,
    },
    aha: {
      kicker: COMMON.aha_kicker, real_label: w.aha.real_label, real: w.aha.real.map((r, i) => ({ head: T(`aha.real[${i}].head`, r.head, false), body: T(`aha.real[${i}].body`, r.body) })),
      verdict: T("aha.verdict", w.aha.verdict), ask_new: w.aha.ask_new, ask_follower: w.aha.ask_follower,
    },
    compare: {
      kicker: COMMON.compare_kicker, title: w.compare.title, lead: T("compare.lead", w.compare.lead, false), cols: w.compare.cols.map((c, i) => T(`compare.cols[${i}]`, c, false)),
      rows: w.compare.rows.map((r, i) => ({ label: r.label, a: T(`compare.rows[${i}].a`, r.a, false), b: T(`compare.rows[${i}].b`, r.b, false) })),
      body: w.compare.body.map((b, i) => T(`compare.body[${i}]`, b)), ask: w.compare.ask,
    },
    next: {
      kicker: COMMON.next_kicker, title: w.next.title, lead: { t: COMMON.next_lead },
      line: [...w.next.line.map((l, i, all) => ({ when: T(`next.line[${i}].when`, l.when, false), what: l.what, state: i === all.length - 1 ? "now" : "past" })), { when: { t: COMMON.line_next_when }, what: COMMON.line_next_what, state: "next" }],
      here_label: COMMON.here_label, tool_lead: COMMON.tool_lead, coming_label: COMMON.coming_label,
      coming: w.next.coming.map((c, i) => ({ head: c.head, body: T(`next.coming[${i}].body`, c.body) })), unknown_label: COMMON.unknown_label,
      unknown: w.next.unknown.map((u, i) => T(`next.unknown[${i}]`, u, false)), unknown_note: T("next.unknown_note", w.next.unknown_note), ask: COMMON.next_ask,
    },
    keep: { kicker: COMMON.keep_kicker, title: COMMON.keep_title, line: w.keep.line, next_body: T("keep.next_body", w.keep.next_body, false) },
  };
  // 풀이 칸
  const pictureTool = (want: string, fallback: string) => (want && keys.includes(want) ? want : keys.includes(fallback) ? fallback : keys[0]!);
  const frames: unknown[] = [];
  if (hasLab) {
    const both = design.frames.length > 1;
    for (const kind of design.frames) {
      if (kind === "chain" && w.lab!.chain) {
        const c = w.lab!.chain;
        const wn = new Map(c.nodes.map((nd, i) => [nd.id, { nd, i }]));
        frames.push({
          kind: "chain", picture: { id: design.chain.picture_id || `${x.series.code}-chain`, tool: pictureTool(design.chain.picture_tool, design.born_tool) },
          tab: both ? T("lab.chain.tab", c.tab, false) : null,
          nodes: design.chain.nodes.filter((d) => wn.has(d.id)).map((d) => {
            const { nd, i } = wn.get(d.id)!;
            const value = T(`lab.chain.nodes[${i}].value`, nd.value, false);
            return d.reach === "none" ? { id: d.id, name: nd.name, reach: "none", still: value } : { id: d.id, name: nd.name, reach: d.reach, idle: nd.idle, after: value };
          }),
          unknown: c.unknown, action: c.action, again: COMMON.again, caption: { before: T("lab.chain.caption_before", c.caption_before, false), after: T("lab.chain.caption_after", c.caption_after) },
          go_on: both && c.go_on ? T("lab.chain.go_on", c.go_on, false) : null,
        });
      }
      if (kind === "seats" && w.lab!.seats) {
        const s = w.lab!.seats;
        const ws = new Map(s.sides.map((sd, i) => [sd.id, { sd, i }]));
        frames.push({
          kind: "seats", picture: { id: design.seats.picture_id || `${x.series.code}-seats`, tool: pictureTool(design.seats.picture_tool, "") }, tab: both ? T("lab.seats.tab", s.tab, false) : null,
          ground: { body: bare(design.seats.body, "seats.ground.body"), split: design.seats.split_proposal, record: keysOf(design.seats.record_facts, "seats.ground.record") }, label: s.label, you: s.you,
          sides: [...design.seats.sides].sort((a, b) => b.count - a.count).filter((d) => ws.has(d.id)).map((d) => {
            const { sd, i } = ws.get(d.id)!;
            return { id: d.id, choose: sd.choose, group: T(`lab.seats.sides[${i}].group`, sd.group, false), count: d.count, said: T(`lab.seats.sides[${i}].said`, sd.said), why: d.why, not_yet_note: d.why === "not-yet" ? sd.not_yet_note : null };
          }),
          other: s.other, result: T("lab.seats.result", s.result, false), caption: { before: T("lab.seats.caption_before", s.caption_before, false) },
        });
      }
    }
  }
  const lab = hasLab && frames.length ? {
    title: w.lab!.title, seen_title: null, setup: w.lab!.setup.map((s, i) => T(`lab.setup[${i}]`, s)), frames,
    born: design.born_tool && pickup.aha.includes(design.born_tool) && w.lab!.born_lead ? { lead: w.lab!.born_lead, tool: design.born_tool } : null,
  } : null;
  const why = lab ? null : design.plain_why_proposal === "none" ? (flip ? "no-source" : "no-flip") : design.plain_why_proposal;
  let plain: unknown;
  if (design.plain_kind === "three" && w.plain.three) {
    const p = w.plain.three;
    plain = {
      kind: "three", why, title: w.plain.title, lead: T("plain.three.lead", p.lead, false), known: p.known.map((k, i) => T(`plain.three.known[${i}]`, k)), unknown: p.unknown.map((k, i) => T(`plain.three.unknown[${i}]`, k)),
      differ: p.differ.map((d, i) => ({ who: T(`plain.three.differ[${i}].who`, d.who, false), says: T(`plain.three.differ[${i}].says`, d.says) })), differ_note: p.differ_note ? T("plain.three.differ_note", p.differ_note, false) : null,
    };
  } else if (design.plain_kind === "quiet") throw new Error("기본 풀이 \"조용히\" 는 이 판 (episode-write/1)이 쓰지 않는다 — 실물이 없다 (EPISODE §7.7). 사람이 쓴다");
  else plain = flip ? { kind: "flip", why, title: w.plain.title } : null;
  const solve = {
    entry: {
      first_thought: T("entry.first_thought", w.entry.first_thought), breaker: T("entry.breaker", w.entry.breaker),
      flip: flip ? { label: COMMON.flip_label, a: flip.a, op: flip.op, b: flip.b, note: T("entry.flip.note", flip.note) } : null,
      not_drawn: design.not_drawn, whose: T("entry.whose", w.entry.whose, false), death: design.death_proposal,
    },
    lab, plain,
  };
  // 지도 — 자리는 기계가 놓는다 (원 위에 차례대로). 사람 칸이다 (D65)
  const at: Record<string, [number, number]> = {};
  keys.forEach((k, i) => { const a = (2 * Math.PI * i) / keys.length - Math.PI / 2; at[k] = [Math.round(50 + 30 * Math.cos(a)), Math.round(50 + 30 * Math.sin(a))]; });
  const edges = design.map_edges.filter((e) => keys.includes(e.from) && keys.includes(e.to) && e.from !== e.to).map((e) => [e.from, e.to]);
  const ghosts = design.ghosts.filter((g) => keys.includes(g.from)).slice(0, 2).map((g) => {
    const [gx, gy] = at[g.from]!;
    return { name: bare(g.name, "map.ghosts"), at: [Math.round(50 + (gx - 50) * 0.35 + (gy < 50 ? 8 : -8)), gy < 50 ? 8 : 92], from: g.from };
  });
  const episode = {
    _source: {
      what: `파이프라인이 만든 회차 (P-E1 · packages/pipeline/src/episode.ts). 사건 ${x.code} 의 P-3 ~ P-5 산출물에서 지었다. **사람 확인 전이다** — death · split · why · 뒤집기 · 지도는 제안이다 (review.json)`,
      event_code: x.code, design: DESIGN_VERSION, write: WRITE_VERSION, graph_sha256: x.graph_sha256,
    },
    episode_id: uuidFrom(`episode|${x.series.code}|${n}|${x.ep.code}`), episode_version: 1, code: x.ep.code, event_ref: x.event_id, series: x.series, number: n,
    track: [...pastT, { no: ui(`${n}화`), title: T("track_now_title", w.track_now_title, false), state: "now" }, { no: { t: COMMON.next_no }, title: T("track_next_title", w.track_next_title, false), state: "next" }],
    docs, quotes, voice_labels: { fact: COMMON.voice_fact, official: w.voice_official, explain: COMMON.voice_explain },
    tools, pickup, assembly: ASSEMBLY, scenes, solve, map: { where_today: ui(`${n}화에서 주움`), at, edges, ghosts },
  };
  // 글 덩이의 회차 안 길
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) return v.forEach((y, i) => walk(y, `${path}/${i}`));
    if (!v || typeof v !== "object") return;
    const id = made.get(v);
    if (id) return void where.set(id, path);
    for (const [k, y] of Object.entries(v)) walk(y, `${path}/${k}`);
  };
  walk(episode, "");
  return { episode, where, notes, followerKnown };
}

// ── 계약 검증 — packages/contract 의 validateEpisode 를 부른다 ───────────────────────────────────────
// 파이프라인은 node 의 타입 지우기로 돈다 (확장자 있는 import 만). 계약 패키지는 확장자 없는 import 라 바로 못 읽는다 → 웹 패키지의 tsx 로 다리 (episode-validate.ts)를 돌린다 (_open)
export type Issue = { code: string; path: string; message: string };
export function validate(episode: unknown, x: L): { ok: boolean; errors: Issue[]; warnings: Issue[]; stats: unknown } {
  const tmp = join(outDir(x.code), `.validate-input.${process.pid}.json`);
  mkdirSync(outDir(x.code), { recursive: true });
  writeFileSync(tmp, JSON.stringify({ episode, documents: x.documents }));
  const out = execFileSync(R("apps/web/node_modules/.bin/tsx"), [R("packages/pipeline/src/episode-validate.ts"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  unlinkSync(tmp);
  return JSON.parse(out);
}

// ── 함의 ─────────────────────────────────────────────────────────────────────────────────────────────
type EntailLine = { id: string; text_sha256: string; request_sha256: string; model: string | null; model_requested: string; effort: string; prompt_version: string; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number; called_at: string; ok: boolean; error: string | null; output: string | null; mode?: "batch"; batch_id?: string };
const entailPath = (code: string) => join(rawDir(code), `entail.${MODELS.entail.model}.${MODELS.entail.effort}.jsonl`);
const readEntail = (code: string): EntailLine[] => (existsSync(entailPath(code)) ? readFileSync(entailPath(code), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
/** 함의를 보는 글 — 근거가 붙었고, 낱말 · 날짜 · 수만 있는 짧은 글 (큰 글자 · 칸 머리 · 연표의 때)이 아닌 것 */
export const needsEntail = (wt: WT) => wt.src.length > 0 && wt.t.replace(/\s/g, "").length >= 14;
export function entailReq(x: L, id: string, wt: WT): (Req & { version: string }) | null {
  const srcByLabel = new Map([...x.srcs.values()].map((s) => [s.label, s]));
  const evidence = wt.src.filter((l) => !x.politicsOnly.has(l)).flatMap((l) => x.passages.get(l) ?? []).map((p) => {
    const s = srcByLabel.get(p.doc)!;
    return { title: s.title, publisher: s.publisher, published_at: String(s.published_at), passage: p.quote.replace(/\s+/gu, " "), context: widen(x.texts.get(p.source_id)!, p.span_start, p.span_end) };
  });
  if (!evidence.length) return null;
  return { model: MODELS.entail.model, effort: MODELS.entail.effort, system: ENTAIL_SYSTEM, user: entailUser({ t: wt.t, voice: wt.voice, calc: wt.calc, where: id }, evidence), schema: ENTAIL_SCHEMA, max_tokens: MODELS.entail.max_tokens, version: ENTAIL_VERSION };
}
/** 글 하나의 저장된 판정 — 지금 글 · 지금 근거와 같은 요청에서 나온 것 */
export function judgementOf(lines: EntailLine[], req: Req): Judgement | null {
  const want = requestSha(req);
  const hit = lines.filter((l) => l.request_sha256 === want && l.ok && l.output != null).at(-1);
  if (!hit) return null;
  const j = JSON.parse(hit.output!) as Judgement;
  return j.verdict === "CANNOT_JUDGE" ? j : { ...j, verdict: derive(j.issues) };
}

// ── 지은 결과 + 검사 ─────────────────────────────────────────────────────────────────────────────────
export function writerOf(argv: string[]): string {
  return argv.includes("--writer") ? argv[argv.indexOf("--writer") + 1]! : MODELS.write.model;
}
export function build(code: string, writer: string) {
  const x = load(code);
  const { raw: draw, design, proposed, human } = approvedDesign(code);
  const lw = latestWrite(code, writer);
  if (!lw) throw new Error(`--write-call 을 먼저 (${writer})`);
  const repairs = writer === MODELS.write.model ? readRepairs(code) : [];
  const { written, applied, cantDrop } = applyRepairs(lw.written, repairs);
  const b = assemble(x, design, written);
  const v = validate(b.episode, x);
  const entail = readEntail(code);
  const texts = textsOf(written);
  const judged = texts.filter((t) => needsEntail(t.wt)).map((t) => {
    const req = entailReq(x, t.id, t.wt);
    return { id: t.id, path: b.where.get(t.id) ?? null, t: t.wt.t, src: t.wt.src, judgement: req ? judgementOf(entail, req) : null };
  });
  return { x, design, proposed, human, draw, wraw: lw.raw, written, original: lw.written, applied, cantDrop, b, v, judged, texts };
}

const MINUTES = { flip: 3, frame: 1, picture: 4, human_cell: 1, hand_tool: 5, map: 2, blocked: 2, read: 4 };
/** 사람 확인 목록 — EPISODE §8 (스스로 적는 칸) · UX-3 ⑦ · B-E1 ⑥ */
export function review(r: ReturnType<typeof build>) {
  const { design: d, b, v, judged, x } = r;
  const flip = d.flips[d.chosen_flip] ?? null;
  const items: { what: string; where: string; proposal: string; why: string; minutes: number; kind: "must" | "blocked" | "look" }[] = [];
  const add = (kind: "must" | "blocked" | "look", minutes: number, what: string, where: string, proposal: string, why: string) => items.push({ kind, minutes, what, where, proposal, why });
  const bad = judged.filter((j) => j.judgement && (j.judgement.verdict === "EXCEEDS" || j.judgement.verdict === "CONTRADICTS"));
  for (const e of v.errors) add("blocked", MINUTES.blocked, "계약 검증에 걸렸다 — 발행 못 한다", e.path, e.code, e.message);
  for (const j of bad) add("blocked", MINUTES.blocked, "함의 검사에 걸린 글 — 고치거나 뺀다", j.path ?? j.id, j.t, j.judgement!.issues.map((i) => `“${i.part}” ${i.kind} · ${i.where} — ${i.why}`).join(" / "));
  for (const c of r.cantDrop) add("blocked", MINUTES.blocked, "고치기 단계가 빼자고 했지만 뺄 수 없는 칸이다", b.where.get(c.id) ?? c.id, c.t, c.why);
  add("must", MINUTES.flip, "뒤집기가 진짜인가 — 그 첫 생각을 정말 흔히 하나 · 깨는 사실이 정말 깨나", "/solve/entry/flip", flip ? `첫 생각 “${flip.first_thought}” → ${flip.a} ${flip.op} ${flip.b}` : "뒤집기 없음 — 기본 풀이",
    flip ? `${flip.why_common} (근거 ${flip.why_common_facts.join(" ") || "없음"}) · 고른 까닭: ${d.flip_reason}${d.flips.length > 1 ? ` · 버린 후보: ${d.flips.filter((_, i) => i !== d.chosen_flip).map((f) => `${f.a} ${f.op} ${f.b}`).join(" / ")}` : ""}` : d.flip_reason);
  add("must", MINUTES.human_cell, "사람이 숨진 사건 · 부고인가", "/solve/entry/death", String(d.death_proposal), d.death_reason);
  add("must", MINUTES.frame, "체험을 넣을 것인가 · 틀이 맞나 (정치 · 말투 · 자료)", "/solve/lab", `파이프라인의 제안 ${r.proposed.length ? `[${r.proposed.join(" → ")}]` : `체험 없음 (${d.plain_why_proposal})`} · 기본 풀이 ${d.plain_kind}${r.human?.after_design.frames ? ` → 사람이 정한 것 [${d.frames.join(" → ")}] (${r.human.after_design.why})` : ""}`, d.frame_reason);
  if (d.frames.includes("seats")) {
    add("must", MINUTES.human_cell, "자리에 앉기 — 한 기관 안의 공식 이견인가 (정당 표결이면 금지)", "/solve/lab/frames/*/ground/split", `${d.seats.split_proposal} · ${d.seats.body}`, d.seats.split_reason);
    for (const s of d.seats.sides) add("must", MINUTES.human_cell, `자리 “${s.stance}” (${s.count}) — 그쪽의 까닭이 문서에 있나 · not-yet 이면 화면의 문장이 정말 그 뜻인가`, `/solve/lab/frames/*/sides/${s.id}/why`, s.why, s.why_reason);
  }
  if (d.frames.length) add("must", MINUTES.picture, "채운 그림이 틀리게 가르치지 않나 — 빠진 고리 · 문서가 말하지 않은 인과 · 그리지 않을 것을 넘지 않았나 (겹 검사가 못 본다)", "/solve/lab/frames · /solve/entry/not_drawn",
    d.frames.includes("chain") ? `고리: ${d.chain.nodes.map((nd) => `${nd.name} (${nd.reach} · ${nd.value_gist})`).join(" → ")} · 그리지 않을 것: ${d.not_drawn.join(" / ")}` : `그리지 않을 것: ${d.not_drawn.join(" / ")}`, d.chain.has ? d.chain.why : d.seats.why);
  if (!r.b.episode.solve || !(r.b.episode.solve as { lab: unknown }).lab) add("must", MINUTES.human_cell, "체험이 없는 까닭", "/solve/plain/why", String(((r.b.episode.solve as { plain: { why?: string } | null }).plain ?? {}).why ?? "-"), d.frame_reason);
  for (const t of d.tools.filter((t) => t.hand)) add("must", MINUTES.hand_tool, `라이브러리에 없는 도구 “${t.name}” — 콘텐츠 레인이 써야 한다 (Atom 규율). 지금 글은 사건의 사실 안에서만 쓴 임시다`, `/tools/${t.key}`, t.name, t.why_needed);
  add("must", MINUTES.map, "개념 지도 — 자리는 기계가 원 위에 놓았다 · 선과 다음 화의 개념은 제안이다 (D65)", "/map", `선 ${d.map_edges.map((e) => `${e.from}–${e.to}`).join(" · ")} · 다음 화 ${d.ghosts.map((g) => g.name).join(" · ")}`, "선의 뜻은 정해지지 않았다 (D65 OPEN)");
  add("look", MINUTES.read, "글 통독 — 제목 (물음) · 수수께끼 · 오늘의 한 줄 · 말투. 근거 없는 글 (사람이 준 요지에서 온 지난 이야기 · 풀어 쓴 설명)은 함의 검사가 보지 않았다", "/scenes", `${(r.b.episode.scenes as { cover: { title: string } }).cover.title.replace(/\n/g, " ")} · ${(r.b.episode.scenes as { keep: { line: string } }).keep.line.replace(/\n/g, " ")}`, `근거 없는 글 ${r.texts.filter((t) => !t.wt.src.length).length} 덩이 (전체 ${r.texts.length})`);
  for (const dd of d.doubts) add("look", 0, "설계 단계가 자신 없다고 적은 것", "-", dd, "");
  for (const nn of b.notes) add("look", 0, "짓기 메모", "-", nn, "");
  const count = (k: string) => judged.filter((j) => j.judgement?.verdict === k).length;
  return {
    _what: `P-E1 — 사람 확인 목록 (episode.ts 가 짓는다 · 결정적). 사건 ${x.code} · 회차 ${x.ep.code}. must = 사람이 꼭 정하는 칸 (EPISODE §8 · UX-3 ⑦) · blocked = 검사에 걸려 발행 못 하는 것 · look = 읽어 볼 것. minutes 는 어림이다`,
    human_after_design: r.human?.after_design ?? null, frames_proposed: r.proposed, frames: d.frames,
    event: x.code, episode_code: x.ep.code, writer: r.wraw.model_requested, design_version: r.draw.prompt_version, write_version: r.wraw.prompt_version,
    minutes: { must: items.filter((i) => i.kind === "must").reduce((a, i) => a + i.minutes, 0), blocked: items.filter((i) => i.kind === "blocked").reduce((a, i) => a + i.minutes, 0), look: items.filter((i) => i.kind === "look").reduce((a, i) => a + i.minutes, 0) },
    follower_known: b.followerKnown,
    checks: {
      contract: { ok: v.ok, errors: v.errors, warnings: v.warnings, stats: v.stats },
      entail: { model: MODELS.entail.model, effort: MODELS.entail.effort, prompt_version: ENTAIL_VERSION, texts: r.texts.length, with_src: r.texts.filter((t) => t.wt.src.length).length, judged: judged.filter((j) => j.judgement).length, not_judged: judged.filter((j) => !j.judgement).map((j) => j.id),
        ENTAILED: count("ENTAILED"), NEEDS_CONTEXT: count("NEEDS_CONTEXT"), EXCEEDS: count("EXCEEDS"), CONTRADICTS: count("CONTRADICTS"), CANNOT_JUDGE: count("CANNOT_JUDGE"),
        flagged: judged.filter((j) => j.judgement && j.judgement.verdict !== "ENTAILED").map((j) => ({ id: j.id, path: j.path, t: j.t, verdict: j.judgement!.verdict, issues: j.judgement!.issues, note: j.judgement!.note })) },
      repairs: r.applied.map((a) => ({ id: a.id, round: a.round, action: a.action, before: textsOf(r.original).find((t) => t.id === a.id)?.wt.t ?? null, after: a.action === "fix" ? a.t : null, why: a.why })),
    },
    items,
  };
}

// ── 모델 부르기 ──────────────────────────────────────────────────────────────────────────────────────
const callReq = (code: string, label: string, q: Req & { version: string }, e: number): CallReq => ({ event: code, source_label: label, model: q.model, effort: q.effort, system: q.system, user: q.user, schema: q.schema, max_tokens: q.max_tokens, prompt_version: q.version, text_sha256: sha256(q.user), est_usd: e });

async function callDesign(code: string, mode: Mode, budget: Budget) {
  const x = load(code);
  const q = designReq(x);
  const tok = (await countTokens(q)) ?? Math.round(q.user.length / 1.6);
  const e = est(q.model, tok, 14000);
  console.log(`episode ${code} --design-call — ${q.model} · ${q.effort} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(code, "EP-DESIGN", q, e);
  const [r] = await callMany([a], { mode, budget });
  if (r!.skipped) throw new Error(`멈춤 — ${r!.error}`);
  saveRaw(code, "design", `design.${sha256(q.user).slice(0, 12)}`, a, r!, x.graph_sha256);
}
async function callWrite(code: string, models: string[], mode: Mode, budget: Budget) {
  const x = load(code);
  const reqs: CallReq[] = [];
  for (const m of models) {
    const q = writeReq(x, m);
    const tok = (await countTokens(q)) ?? Math.round((q.user.length + q.system.length) / 1.6);
    const e = est(m, tok, 30000);
    console.log(`episode ${code} --write-call — ${m} · ${q.effort} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"})`);
    reqs.push(callReq(code, `EP-WRITE(${m})`, q, e));
  }
  console.log(`  Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const rs = await callMany(reqs, { mode, budget, conc: 2 });
  rs.forEach((r, i) => { if (r.skipped) console.log(`  멈춤 — ${models[i]}: ${r.error}`); else saveRaw(code, "write", `write.${models[i]}.${sha256(reqs[i]!.user).slice(0, 12)}`, reqs[i]!, r, x.graph_sha256); });
}
async function callEntail(code: string, writer: string, mode: Mode, budget: Budget) {
  const r = build(code, writer);
  const stored = readEntail(code);
  const todo = r.texts.filter((t) => needsEntail(t.wt)).map((t) => ({ t, q: entailReq(r.x, t.id, t.wt) })).filter((y): y is { t: { id: string; wt: WT }; q: Req & { version: string } } => !!y.q && !judgementOf(stored, y.q));
  // 상한에 걸리면 뒤의 것부터 못 보낸다 — 풀이 칸 (입구 · 체험 · 기본 풀이) · 풀이 장면 · 사건 장면을 먼저 본다
  const rank = (id: string) => (/^(entry|lab|plain)\./.test(id) ? 0 : id.startsWith("aha.") ? 1 : id.startsWith("event.") ? 2 : 3);
  todo.sort((a, b) => rank(a.t.id) - rank(b.t.id));
  if (!todo.length) return void console.log(`episode ${code} --entail-call — 볼 글이 없다 (저장된 판정이 전부 지금 글과 같다)`);
  const one = (await countTokens(todo[0]!.q)) ?? 3500;
  const e = est(MODELS.entail.model, Math.round(one * 0.4), 450);   // 앞부분 (system)은 캐시에서 읽힌다 — W-2 · W-6 의 장부로 본 한 부르기 값
  console.log(`episode ${code} --entail-call — ${MODELS.entail.model} · ${MODELS.entail.effort} · 글 ${todo.length} · 첫 요청 입력 ${one} 토큰 · 넉넉한 추정 $${(e * todo.length * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const reqs = todo.map((y) => callReq(code, `EP-ENTAIL(${y.t.id})`, y.q, e));
  const rs = await callMany(reqs, { mode, budget, conc: 4 });
  mkdirSync(rawDir(code), { recursive: true });
  let cost = 0, n = 0;
  rs.forEach((res, i) => {
    if (res.skipped) return;
    const line: EntailLine = { id: todo[i]!.t.id, text_sha256: sha256(todo[i]!.t.wt.t), request_sha256: res.request_sha256, model: res.model, model_requested: MODELS.entail.model, effort: MODELS.entail.effort, prompt_version: ENTAIL_VERSION, stop_reason: res.stop_reason, usage: res.usage, duration_ms: res.duration_ms, cost_usd: Number(res.cost_usd.toFixed(6)), called_at: new Date().toISOString(), ok: res.ok, error: res.error, output: res.text, ...(res.mode === "batch" ? { mode: res.mode, batch_id: res.batch_id! } : {}) };
    appendFileSync(entailPath(code), JSON.stringify(line) + "\n");
    cost += res.cost_usd; n++;
  });
  console.log(`  받은 판정 ${n} / ${todo.length} · $${cost.toFixed(3)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)}`);
}
async function callRepair(code: string, mode: Mode, budget: Budget) {
  const r = build(code, MODELS.write.model);
  const byPath = new Map([...r.b.where.entries()].map(([id, p]) => [p, id]));
  const why = new Map<string, string[]>();
  const push = (id: string, s: string) => why.set(id, [...(why.get(id) ?? []), s]);
  const bare: string[] = [];
  for (const j of r.judged) if (j.judgement && (j.judgement.verdict === "EXCEEDS" || j.judgement.verdict === "CONTRADICTS")) push(j.id, `함의 (${j.judgement.verdict}): ${j.judgement.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ")}`);
  for (const e of r.v.errors) {
    const id = byPath.get(e.path);
    if (id && e.code === "NUMBER_UNGROUNDED") push(id, `숫자: ${e.message}`);
    else bare.push(`${e.code} ${e.path}: ${e.message}`);
  }
  if (!why.size) return void console.log(`episode ${code} --repair-call — 고칠 글이 없다${bare.length ? ` (글 덩이가 아닌 문제 ${bare.length} — 사람이 본다)` : ""}`);
  const srcByLabel = new Map([...r.x.srcs.values()].map((s) => [s.label, s]));
  const byId = new Map(r.texts.map((t) => [t.id, t.wt]));
  const blocks = [...why.entries()].map(([id, ws]) => {
    const wt = byId.get(id)!;
    const ev = wt.src.flatMap((l) => (r.x.passages.get(l) ?? []).map((p) => `  ${l} · ${srcByLabel.get(p.doc)!.title} (${String(srcByLabel.get(p.doc)!.published_at).slice(0, 10)}) — 구절: ${p.quote.replace(/\s+/gu, " ")}\n     둘레: ${widen(r.x.texts.get(p.source_id)!, p.span_start, p.span_end)}`));
    return [`## ${id}`, `자리: ${r.b.where.get(id) ?? id}${DROPPABLE.test(id) ? " (뺄 수 있는 줄)" : " (필수 칸 — 뺄 수 없다)"}`, `지금 글: ${wt.t}`, `꼬리표: ${wt.voice}`, `근거 label: ${wt.src.join(" ") || "없음"}`, `calc: ${wt.calc.map((c) => `${c.n} = ${c.how}`).join(" · ") || "없음"}`, "근거:", ...(ev.length ? ev : ["  (없음)"]), "걸린 까닭:", ...ws.map((s) => `  - ${s}`)].join("\n");
  });
  // 근거를 더 붙일 수 있게 — 설계 단계가 받은 사실 가운데 구절을 실을 수 있는 것 (글은 짧게)
  const avail = selectFacts(r.x).filter((l) => r.x.passages.has(l) && !r.x.politicsOnly.has(l)).map((l) => `${l} | ${(r.x.docsOfFact.get(l) ?? []).join("+")} | ${r.x.byLabel.get(l)!.event_at ?? "-"} | ${clip(r.x.byLabel.get(l)!.claim_text, 110)}`);
  const user = `${blocks.join("\n\n")}\n\n## 쓸 수 있는 사실 (label | 문서 | 일어난 날 | 글)\n${avail.join("\n")}\n\n위 ${blocks.length} 덩이를 고쳐라.`;
  const q = { model: MODELS.repair.model, effort: MODELS.repair.effort, system: REPAIR_SYSTEM, user, schema: REPAIR_SCHEMA, max_tokens: MODELS.repair.max_tokens, version: REPAIR_VERSION };
  const tok = (await countTokens(q)) ?? Math.round(user.length / 1.6);
  const e = est(q.model, tok, 6000);
  console.log(`episode ${code} --repair-call — ${q.model} · ${q.effort} · 덩이 ${blocks.length} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(code, `EP-REPAIR(${blocks.length})`, q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(code, "repair", `repair.${String(readRaws(code, "repair").length + 1).padStart(2, "0")}.${sha256(user).slice(0, 12)}`, a, res!, r.x.graph_sha256);
}

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a, i) => !a.startsWith("--") && !["--step", "--budget", "--models", "--writer"].includes(argv[i - 1] ?? ""));
  if (!code) throw new Error("사건 code");
  const writer = writerOf(argv);
  if (argv.includes("--count")) {
    const x = load(code);
    const dq = designReq(x);
    console.log(`episode ${code} --count — 고른 사실 ${selectFacts(x).length} / ${x.graph.facts.length} (구절 있는 것 ${selectFacts(x).filter((l) => x.passages.has(l)).length}) · 설계 입력 ${dq.user.length}자 → ${await countTokens(dq)} 토큰`);
    if (readRaws(code, "design").length) for (const m of [MODELS.write.model, "claude-opus-5-5"]) { const wq = writeReq(x, m); console.log(`  글 (${m}) 입력 ${wq.system.length + wq.user.length}자 → ${await countTokens(wq)} 토큰`); }
    return;
  }
  if (argv.includes("--probe")) {
    // 출력 모양 (json_schema)이 받아들여지는지만 본다 — 문법이 너무 크면 400 (값 0). 짧은 요청 · 즉시 · 잘려도 된다
    const budget = needBudget(argv);
    const reqs = ([["design", DESIGN_SCHEMA], ["write", WRITE_SCHEMA], ["repair", REPAIR_SCHEMA]] as const).map(([k, schema]) =>
      callReq(code, `EP-PROBE(${k})`, { model: "claude-opus-5-5", effort: "low", system: "출력 모양 시험이다. 모든 칸을 가장 짧은 값으로 채운다.", user: "시작.", schema, max_tokens: 200, version: "episode-probe/1" }, 0.02));
    const rs = await callMany(reqs, { mode: "now", budget, conc: 3 });
    rs.forEach((r, i) => console.log(`  ${reqs[i]!.source_label}: ${r.error ?? "ok"} · $${r.cost_usd.toFixed(4)}`));
    return;
  }
  if (argv.includes("--design-call")) return callDesign(code, modeArg(argv), needBudget(argv));
  if (argv.includes("--write-call")) return callWrite(code, argv.includes("--models") ? argv[argv.indexOf("--models") + 1]!.split(",") : [MODELS.write.model], modeArg(argv), needBudget(argv));
  if (argv.includes("--entail-call")) return callEntail(code, writer, modeArg(argv), needBudget(argv));
  if (argv.includes("--repair-call")) return callRepair(code, modeArg(argv), needBudget(argv));
  const r = build(code, writer);
  const suffix = writer === MODELS.write.model ? "" : `.${writer}`;
  const files = [
    { p: join(outDir(code), `episode${suffix}.json`), body: JSON.stringify(r.b.episode, null, 2) + "\n" },
    { p: join(outDir(code), `review${suffix}.json`), body: JSON.stringify(review(r), null, 2) + "\n" },
  ];
  if (argv.includes("--check")) {
    const same = files.every((f) => existsSync(f.p) && readFileSync(f.p, "utf8") === f.body);
    console.log(`episode ${code} --check — episode${suffix}.json · review${suffix}.json ${same ? "같다" : "다르다"}`);
    if (!same) process.exitCode = 1;
    return;
  }
  for (const f of files) writeFileSync(f.p, f.body);
  const rv = review(r);
  const en = rv.checks.entail;
  console.log(`episode ${code} — 글 ${writer} · 글 덩이 ${en.texts} (근거 있는 것 ${en.with_src}) · 구절 ${Object.keys((r.b.episode as { quotes: object }).quotes).length} · 문서 ${Object.keys((r.b.episode as { docs: object }).docs).length}`);
  console.log(`  계약 검증 ${r.v.ok ? "통과" : `실패 ${r.v.errors.length}`} · 알림 ${r.v.warnings.length}`);
  for (const e of r.v.errors) console.log(`    ${e.code} ${e.path}: ${e.message}`);
  for (const w of r.v.warnings) console.log(`    알림 ${w.code} ${w.path}: ${w.message}`);
  console.log(`  함의 — 본 글 ${en.judged} (아직 ${en.not_judged.length}) · ENTAILED ${en.ENTAILED} · NEEDS_CONTEXT ${en.NEEDS_CONTEXT} · EXCEEDS ${en.EXCEEDS} · CONTRADICTS ${en.CONTRADICTS} · CANNOT_JUDGE ${en.CANNOT_JUDGE}`);
  console.log(`  고치기 ${rv.checks.repairs.length} · 사람 확인: 꼭 ${rv.items.filter((i) => i.kind === "must").length} (${rv.minutes.must}분) · 막힘 ${rv.items.filter((i) => i.kind === "blocked").length} (${rv.minutes.blocked}분) · 읽기 ${rv.minutes.look}분`);
  for (const nn of r.b.notes) console.log(`  메모 ${nn}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
