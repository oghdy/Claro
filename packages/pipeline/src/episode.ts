// P-E1 · P-E2 — 파이프라인이 회차를 낸다 (D60 · D62 · D68 · D73). 이미 있는 P-3 ~ P-5 산출물에서 회차 (docs/contract/EPISODE.md 의 Episode)를 짓는다.
// **명령의 첫 인자는 회차 code 다** (data/series/*.json 의 episodes 의 키 — 한 사건에 회차가 여럿일 수 있다: 금리 2화 · 3화 모두 FOMC-20261028). 사건 code 를 주면 그 사건의 회차 목록을 보이고 멈춘다.
// P-E2 가 더한 명령 (아래 P-E1 의 명령에서 FOMC-20261028 자리에 회차 code — fomc-auto · rate-2b · rate-3):
//     episode rate-3 --count [--like MIN-09]        # 입력 토큰 · 함의에 보낼 글 수 · 값 어림 (count_tokens · 값 0). --like — 아직 없는 새 문서 대신 본보기 문서의 사실을 얹어 센다
//     episode rate-3 --sheet                        # 사람 확인지 (한 장 · markdown) — 설계 뒤 gate1.md · 글 뒤 gate2.md. 모델 안 부름
//     episode --entail-gold [--call --step S --budget USD]   # 함의 프롬프트를 정답 묶음 (data/episode-entail/gold.json)으로 잰다. --call 없이는 세기만
//   사람 게이트 (human.json — logs/pipeline/P-E2.md ⑥): graph_seen (다시 돌린 그래프를 사람이 봤다) → --design-call → after_design.ok (게이트 1) → --write-call → --entail-call · --repair-call → after_write.ok (게이트 2)
//   얼린 회차 (series 의 frozen — fomc-auto): 모델을 부르지 않는다. 저장한 출력으로 다시 지어 --check 만 한다 (판 /1 그대로)
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
import { SCHEMA as ENTAIL_SCHEMA } from "./w2-prompt.ts";
import { widen } from "./w2.ts";
import {
  CURRENT, DESIGN_SCHEMA, DESIGN_SYSTEM, ENTAIL2_SCHEMA, REPAIR_SCHEMA, REPAIR_SYSTEM, WRITE_SCHEMA,
  deriveVerdict, designUser, entailSystem, entailUser, parseDesign, parseWritten, writeSystem, writeUser, type Ctx, type Design, type EVerdict, type Repair, type Versions, type WT, type Written,
} from "./episode-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const R = (...p: string[]) => join(ROOT, ...p);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const evDir = (code: string) => R("packages/pipeline/data/events", code);

// ── 시리즈 · 회차 (사람 입력 — data/series/*.json). 회차는 **회차 code** 로 찾는다 (P-E2 — 한 사건에 회차 둘) ─────────────────
type Past = { no: string; title: string; src_facts: string[]; calc: Record<string, string> };
export type EpEntry = {
  event: string; number: number;
  dir?: string;                        // 사건 폴더 아래 출력 자리. 없으면 episodes/<회차 code>
  versions?: Partial<Versions>;        // 못 박은 판 — 얼린 회차
  frozen?: string;                     // 있으면 모델을 부르지 않는다 (까닭)
  previous?: string;                   // 지난 회차 (계약의 Episode JSON · 저장소 뿌리에서의 길). 있으면 시리즈 줄 · 지난 요지 · 주운 도구 · 그림을 거기서 받는다
  new_documents?: string[];            // 이번 화의 새 문서 (label) — 그 사실은 전부 보내고 [새 문서] 로 표시한다
  past?: Past[]; previous_gist?: string[]; prior_tools?: { name: string; concepts: string[] }[];   // previous 가 없을 때 사람이 준다
  next_document: string;
};
type SeriesFile = { series: { series_id: string; code: string; name: string; sub: string }; episodes: Record<string, EpEntry> };
const seriesFiles = () => readdirSync(R("packages/pipeline/data/series")).filter((n) => n.endsWith(".json")).map((n) => readJson<SeriesFile>(R("packages/pipeline/data/series", n)));
export function findEpisode(epCode: string): { series: SeriesFile["series"]; entry: EpEntry } {
  const all = seriesFiles();
  const f = all.find((s) => s.episodes[epCode]);
  if (f) return { series: f.series, entry: f.episodes[epCode]! };
  const ofEvent = all.flatMap((s) => Object.entries(s.episodes).filter(([, e]) => e.event === epCode).map(([k, e]) => `${k} (${e.number}화${e.frozen ? " · 얼림" : ""})`));
  throw new Error(ofEvent.length ? `${epCode} 는 사건 code 다 — 회차 code 를 준다: ${ofEvent.join(" · ")}` : `data/series/*.json 에 회차 ${epCode} 가 없다 — 시리즈 · 회차는 사람이 적는다`);
}
/** 회차의 출력 폴더 */
const outDir = (epCode: string) => { const { entry } = findEpisode(epCode); return join(evDir(entry.event), entry.dir ?? join("episodes", epCode)); };
/** 지난 회차 — 계약의 Episode 에서 이어 쓰기에 쓰는 칸만 (EPISODE §7.6 · §10 "같은 시리즈의 회차 둘"은 계약의 미확인 — 여기서는 읽기만 한다) */
type PrevT = { t: string; src?: string[]; calc?: Record<string, string>; ui?: true; voice?: string };
export type Prev = {
  code: string; number: number; series: SeriesFile["series"];
  track: { no: PrevT; title: PrevT; state: string }[];
  docs: Record<string, { source_id: string; name: string }>; quotes: Record<string, { doc: string; quote: string }>;
  tools: { key: string; name: string; short: PrevT; basis: { concept_id: string }[] }[]; pickup: Record<string, string[]>;
  scenes: { cover: { title: string; dek: PrevT }; next: { coming: { head: string; body: PrevT }[]; unknown: PrevT[] }; keep: { line: string; next_body: PrevT } };
  solve: { entry: { flip: { a: string; op: string; b: string; note: PrevT } | null }; lab: null | { title: string; frames: any[]; born: { tool: string } | null } };
  map: { at: Record<string, [number, number]>; edges: string[][]; ghosts: { name: string; from: string }[] };
};

// 모델 배치 (D2 — 단계마다) · logs/pipeline/P-E1.md ⑤ · D73 (설계 · 글은 Fable 그대로 — 글을 Opus 로 바꾸지 않는다)
export const MODELS = {
  design: { model: "claude-fable-5-2", effort: "high" as Effort, max_tokens: 40000 },     // 판단 — 뒤집기가 진짜인가 · 틀이 서나. 상한 40000: /2 의 2화 시험이 28,753 을 썼다 (/1 의 상한 32000 의 90%) — 3화는 carry 칸이 더 든다 (잘리면 0.9 달러를 버린다)
  write: { model: "claude-fable-5-2", effort: "medium" as Effort, max_tokens: 48000 },    // 독자 글의 맛 (--models 로 견줄 수 있다)
  entail: { model: "claude-opus-5-5", effort: "medium" as Effort, max_tokens: 8000 },     // W-2 · D49 그대로
  repair: { model: "claude-opus-5-5", effort: "medium" as Effort, max_tokens: 16000 },    // 분명한 일 — 가리킨 데만 고친다
};
/** 슬롯 요소마다 보내는 사실 수 (구절을 실을 수 있는 것 · 최근 것 먼저) — /1 의 값. /2 는 KNOBS.per_element */
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
export type Passage = { key: string; doc: string; source_id: string; quote: string; span_start: number; span_end: number };

export function load(epCode: string, opts: { like?: string } = {}) {
  const { series, entry } = findEpisode(epCode);
  const code = entry.event;
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
  const prev = entry.previous ? readJson<Prev>(R(entry.previous)) : null;
  if (prev && prev.series.series_id !== series.series_id) throw new Error(`${epCode}: 지난 회차 ${entry.previous} 는 다른 시리즈다`);
  if (prev && prev.number + 1 !== entry.number) throw new Error(`${epCode}: 지난 회차는 ${prev.number}화인데 이번 화가 ${entry.number}화다`);
  const versions: Versions = { ...CURRENT, ...(entry.versions ?? {}) };
  // 사람이 고친 사실 글 (게이트 3 의 몫을 회차 단계가 받는 자리 — p3 그래프는 고치지 않는다 · 모델에 보내는 사실 글만 바뀐다 · logs/pipeline/P-E2.md ①)
  const fixPath = join(d, "fact-fixes.json");
  const fixes = new Map((existsSync(fixPath) ? readJson<{ fixes: { label: string; claim_text: string }[] }>(fixPath).fixes : []).map((f) => [f.label, f.claim_text]));
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
  for (const l of fixes.keys()) if (!byLabel.has(l)) throw new Error(`fact-fixes.json: 그래프에 없는 사실 ${l}`);
  const newDocs = new Set(opts.like ? [opts.like] : entry.new_documents ?? []);   // like — 세기 전용: 아직 없는 새 문서 대신 본보기 문서의 사실을 새 문서처럼 얹는다
  const isNew = (label: string) => (docsOfFact.get(label) ?? []).some((dl) => newDocs.has(dl));
  // 지난 회차에서 받는 것 — 시리즈 줄 · 요지 · 주운 도구. 지난 회차가 없으면 사람이 적은 것 (entry)
  const idToCode = new Map(lib.concepts.map((c) => [c.concept_id, c.code]));
  const past: Past[] = prev ? [] : entry.past ?? [];
  const previous_gist = prev ? [] : entry.previous_gist ?? [];
  const prior_tools = prev ? prev.tools.map((t) => ({ name: t.name, concepts: t.basis.map((b) => idToCode.get(b.concept_id) ?? "?") })) : entry.prior_tools ?? [];
  const ep = { ...entry, code: epCode, past, previous_gist, prior_tools };
  return { politicsOnly, code, conf, graph, graph_sha256: sha256(graphText), cov, p5, srcs, texts, documents, lib, series, ep, prev, versions, v1: versions.write === "episode-write/1", fixes, isNew, byLabel, passages, docsOfFact, event_id: store.events.find((e) => e.code === code)?.event_id ?? graph.event_id };
}
export type L = ReturnType<typeof load>;

// ── 비용 손잡이 (D73 — 맛은 지키고 줄이기 · logs/pipeline/P-E2.md ④) ─────────────────────────────────────
export const KNOBS = {
  /** 슬롯 요소마다 보내는 사실 수 — /1 은 6. 새 문서의 사실은 이 수와 상관없이 전부 간다 */
  per_element: 4,
  /** 사실 하나에 구절이 여럿이면 설계 · 글에 보이는 구절 수 (근거로는 전부 실린다 — 보이는 것만 줄인다) */
  passages_shown: 2,
  /** 구절 하나를 보이는 길이 (글자) — /1 은 260 */
  passage_clip: 220,
};

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
    for (const l of ranked.slice(0, x.v1 ? PER_ELEMENT : KNOBS.per_element)) pick.add(l);
  }
  if (!x.v1) for (const f of x.graph.facts) if (x.isNew(f.label)) pick.add(f.label);   // 새 문서의 사실은 전부
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
  if (!x.v1) for (const f of x.graph.facts) if (x.isNew(f.label) && x.passages.has(f.label)) pick.add(f.label);   // 새 문서의 사실 (구절 있는 것)은 글 단계도 전부 본다
  return x.graph.facts.map((f) => f.label).filter((l) => pick.has(l));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s).replace(/\n/g, " ⏎ ");
export function ctx(x: L, labels: string[] = selectFacts(x)): Ctx {
  const basisLabels = (c: Claim) => c._basis_labels ?? [];
  const pub = (l: string) => (x.docsOfFact.get(l) ?? []).map((d) => { const s = [...x.srcs.values()].find((y) => y.label === d)!; return `${d} ${String(s.published_at).slice(0, 10)}`; }).join(" + ");
  const facts = labels.map((l) => {
    const f = x.byLabel.get(l)!;
    const ps = x.passages.get(l);
    const shown = x.v1 ? ps : ps?.slice(0, KNOBS.passages_shown);
    return `${l}${x.isNew(l) ? " [새 문서]" : ""} | ${pub(l)} | ${f.event_at ?? "-"} | ${f.fact_type} | ${f.actor ?? "-"} | ${x.fixes.get(l) ?? f.claim_text} | ${shown ? `[구절] ${shown.map((p) => `“${clip(p.quote, x.v1 ? 260 : KNOBS.passage_clip)}”`).join(" / ")}${ps!.length > shown.length ? ` (+ 구절 ${ps!.length - shown.length})` : ""}` : "[구절 없음]"}`;
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
    x.prev ? `지난 화의 제목: ${x.prev.track.filter((t) => t.state !== "next").map((t) => `${t.no.t} “${t.title.t}”`).join(" · ")}`
      : `지난 화의 제목: ${e.past.map((p) => `${p.no} “${p.title}”${p.src_facts.length ? ` (근거 ${p.src_facts.join(" ")})` : ""}`).join(" · ")}`,
    ...(x.prev ? ["지난 회차의 요지: 아래 “지난 회차” (숫자를 글에 쓰려면 사실 목록에서 근거를 찾아 붙인다)"] : ["지난 회차의 요지 (사람이 적은 것 — 숫자를 글에 쓰려면 사실 목록에서 근거를 찾아 붙인다):", ...e.previous_gist.map((g) => `  - ${g}`)]),
    `지난 화에서 주운 도구 (따라온 독자는 이미 안다): ${e.prior_tools.map((t) => `${t.name} (${t.concepts.join(" + ")})`).join(" · ")}`,
    ...(e.new_documents?.length ? [`이번 화의 새 문서: ${e.new_documents.join(" · ")} — 사실 목록에서 [새 문서] 로 표시했다. 지난 회차는 이 문서 없이 쓰였다`] : []),
    `다음 문서: ${e.next_document}`,
  ].join("\n");
  return { code: x.code, what: x.conf.what, date: x.conf.date, series, previous: x.prev ? previousBlock(x.prev) : "", docs, slots, diff, claims, empty, politics, facts, library };
}

/** 지난 회차 → 설계 · 글 단계가 받는 글. 뼈와 값이다 — 장면의 글을 통째로 옮기지 않는다 (베끼지 않게). 그림의 말 (고리 이름 · 누를 행동 · 고르는 말)은 그대로 받으라고 준다 */
export function previousBlock(p: Prev): string {
  const L: string[] = [`${p.number}화 “${p.scenes.cover.title.replace(/\n/g, " ")}” (회차 code ${p.code})`, `걸었던 것: ${p.scenes.cover.dek.t}`];
  const f = p.solve.entry.flip;
  if (f) L.push(`뒤집기: ${f.a} ${f.op} ${f.b} — ${f.note.t}`);
  L.push(`오늘의 한 줄: ${p.scenes.keep.line.replace(/\n/g, " ")}`);
  if (p.solve.lab) {
    L.push(`체험 “${p.solve.lab.title.replace(/\n/g, " ")}” — 틀 [${p.solve.lab.frames.map((fr) => fr.kind).join(" → ")}]`);
    for (const fr of p.solve.lab.frames) {
      if (fr.kind === "chain") {
        L.push(`  사슬 (그림 ${fr.picture.id} · 도구 ${fr.picture.tool})${fr.tab ? ` · 탭 “${fr.tab.t}”` : ""} · 누를 행동 “${fr.action}” · 멈춘 자리 뒤의 물음 “${fr.unknown}”`);
        for (const nd of fr.nodes) L.push(`    고리 ${nd.id} “${nd.name}” ${nd.reach} — 지난 값: ${(nd.after ?? nd.still).t}`);
        L.push(`    누른 뒤의 글: ${fr.caption.after.t}`);
      } else if (fr.kind === "seats") {
        L.push(`  자리 (그림 ${fr.picture.id} · 도구 ${fr.picture.tool})${fr.tab ? ` · 탭 “${fr.tab.t}”` : ""} · 기관 ${fr.ground.body} (${fr.ground.split}) · 자리 그림의 이름 “${fr.label}”`);
        for (const sd of fr.sides) L.push(`    쪽 ${sd.id} “${sd.choose}” · ${sd.group.t} · 까닭 ${sd.why} — 그 자리에서 들은 말: ${sd.said.t}`);
      } else L.push(`  ${fr.kind} (그림 ${fr.picture?.id ?? "-"}) — 이 단계가 다시 쓰지 못하는 틀이다`);
    }
    if (p.solve.lab.born) L.push(`  풀이에서 생긴 도구: ${p.solve.lab.born.tool}`);
  } else L.push("체험 없음 (기본 풀이)");
  const where = (k: string) => Object.entries(p.pickup).find(([, ks]) => ks.includes(k))?.[0] ?? "-";
  L.push("도구 (key · 이름 · 주운 장면 · 한 줄):", ...p.tools.map((t) => `  ${t.key} · ${t.name} · ${where(t.key)} · ${t.short.t}`));
  L.push("이어짐에서 한 약속 — “다음 회차가 될 일”:", ...p.scenes.next.coming.map((c) => `  - ${c.head}: ${c.body.t}`));
  L.push("“아직 모르는 것”이라고 한 것:", ...p.scenes.next.unknown.map((u) => `  - ${u.t}`));
  L.push(`다음 화 예고: ${p.scenes.keep.next_body.t}`);
  L.push(`개념 지도 — 선 ${p.map.edges.map((e) => e.join("–")).join(" · ")} · 다음 화에서 만날 개념 ${p.map.ghosts.map((g) => g.name).join(" · ")}`);
  return L.join("\n");
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
  _what: string; event: string; episode?: string; kind: "design" | "write" | "repair"; prompt_version: string; model: string | null; model_requested: string; effort: string;
  input_sha256: string; request_sha256: string; graph_sha256: string; response_id: string | null; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number;
  called_at: string; output_sha256: string; output: string; mode?: "batch"; batch_id?: string;
};
const rawDir = (epCode: string) => join(outDir(epCode), "raw");
function readRaws(epCode: string, kind: Raw["kind"]): Raw[] {
  if (!existsSync(rawDir(epCode))) return [];
  return readdirSync(rawDir(epCode)).filter((n) => n.startsWith(`${kind}.`) && n.endsWith(".json")).map((n) => readJson<Raw>(join(rawDir(epCode), n))).sort((a, b) => a.called_at.localeCompare(b.called_at));
}
function saveRaw(x: L, kind: Raw["kind"], name: string, a: CallReq, r: Awaited<ReturnType<typeof callMany>>[number]) {
  if (!r.ok || r.text == null) throw new Error(`${kind} 실패 — ${r.error}`);
  const raw: Raw = {
    _what: `회차 단계의 모델 출력 (${kind} — episode.ts 가 쓴다 · 손으로 고치지 않는다). 프롬프트 src/episode-prompt.ts ${a.prompt_version}`,
    event: x.code, episode: x.ep.code, kind, prompt_version: a.prompt_version, model: r.model, model_requested: a.model, effort: a.effort, input_sha256: sha256(a.user), request_sha256: r.request_sha256, graph_sha256: x.graph_sha256,
    response_id: r.response_id, stop_reason: r.stop_reason, usage: r.usage, duration_ms: r.duration_ms, cost_usd: Number(r.cost_usd.toFixed(6)), called_at: new Date().toISOString(),
    output_sha256: sha256(r.text), output: r.text, ...(r.mode === "batch" ? { mode: r.mode, batch_id: r.batch_id! } : {}),
  };
  mkdirSync(rawDir(x.ep.code), { recursive: true });
  writeFileSync(join(rawDir(x.ep.code), `${name}.json`), JSON.stringify(raw, null, 2) + "\n");
  const u = r.usage!;
  console.log(`  ${name}: ${r.model} 입력 ${u.input_tokens} (캐시 쓰기 ${u.cache_creation_input_tokens} · 읽기 ${u.cache_read_input_tokens}) · 출력 ${u.output_tokens} · ${(r.duration_ms / 1000).toFixed(0)}초 · $${r.cost_usd.toFixed(3)}${r.mode === "batch" ? " (배치)" : ""}`);
}
const est = (model: string, inTok: number, outTok: number) => (inTok * PRICE[model]!.in + outTok * PRICE[model]!.out) / 1e6;

export function designReq(x: L, effort: Effort = MODELS.design.effort): Req & { version: string } {
  return { model: MODELS.design.model, effort, system: DESIGN_SYSTEM, user: designUser(ctx(x)), schema: DESIGN_SCHEMA, max_tokens: MODELS.design.max_tokens, version: x.versions.design };
}
export function latestDesign(x: L): { raw: Raw; design: Design; problems: string[] } {
  const raw = readRaws(x.ep.code, "design").filter((r) => r.prompt_version === x.versions.design).at(-1);
  if (!raw) throw new Error(`--design-call 을 먼저 (${x.ep.code} · ${x.versions.design})`);
  return { raw, ...parseDesign(raw.output) };
}

// ── 사람 게이트 (episode/human.json — 계약이 아니다. 모양과 뜻: logs/pipeline/P-E2.md ⑥) ────────────────────────────
/** 사람이 적는 파일. 셋 다 없어도 되는 칸이지만 /2 회차는 차례대로 있어야 다음 부르기가 나간다:
 *    graph_seen           다시 돌린 그래프 (새 문서의 사실 · 슬롯 · 해석 · 체크포인트)를 사람이 봤다 — 그 그래프의 sha256. 새 문서가 있는 회차의 설계 앞
 *    after_design (게이트 1 · 5분)   뒤집기 · 틀 · 이야기 · 사람 칸. ok 가 true 여야 글을 쓴다. 적은 칸만 설계의 제안을 덮는다
 *    after_write  (게이트 2 · 15 ~ 20분)   함의에 걸린 글 · 그림 · 통독. edits 는 고치기 뒤에 얹힌다 (사람이 마지막이다). ok 가 true 여야 "낼 수 있다"
 *  P-E1 의 옛 모양 ({ after_design: { frames, why, by } })도 읽는다 */
export type Human = {
  graph_seen?: { graph_sha256: string; by: string; note?: string };
  after_design?: {
    ok?: boolean; by: string; minutes?: number; why?: string; note?: string;
    flip?: { ok?: boolean; pick?: number; note?: string };
    frames?: ("chain" | "seats")[];
    story?: { ok?: boolean; note?: string };
    death?: boolean; split?: "official-dissent" | "party-vote" | "none"; sides?: Record<string, "in-doc" | "not-yet">;
    not_drawn_add?: string[]; do_not_write_add?: string[];
  };
  after_write?: {
    ok?: boolean; by: string; minutes?: number; note?: string;
    edits?: { id: string; t: string; src?: string[]; calc?: { n: string; how: string }[]; why: string }[];
    drops?: string[];
    picture_ok?: boolean; blocked_seen?: boolean; read_ok?: boolean;
  };
};
export function readHuman(epCode: string): Human | null {
  const p = join(outDir(epCode), "human.json");
  return existsSync(p) ? readJson<Human>(p) : null;
}
/** 설계의 제안에 사람의 확인 (게이트 1)을 얹는다 — 순수 함수. 사람이 켤 수 있는 틀은 설계가 재료를 낸 것뿐이다 (chain.has · seats.has) */
export function applyGate1(design: Design, g: Human["after_design"] | undefined): { design: Design; changed: string[] } {
  const changed: string[] = [];
  if (!g) return { design, changed };
  let d = design;
  if (g.frames) {
    for (const f of g.frames) if (!design[f].has) throw new Error(`human.json: 틀 ${f} 를 켰지만 설계가 그 재료를 내지 않았다 (${f}.has = false)`);
    const frames = (["chain", "seats"] as const).filter((f) => g.frames!.includes(f));
    if (frames.join() !== design.frames.join()) changed.push(`틀 [${design.frames.join(", ") || "없음"}] → [${frames.join(", ") || "없음"}]`);
    d = { ...d, frames };
  }
  if (g.flip?.pick != null && g.flip.pick !== design.chosen_flip) {
    if (g.flip.pick >= design.flips.length) throw new Error(`human.json: 뒤집기 후보 ${g.flip.pick} 은 없다 (후보 ${design.flips.length})`);
    changed.push(`뒤집기 후보 ${design.chosen_flip} → ${g.flip.pick}`);
    d = { ...d, chosen_flip: g.flip.pick, ...(g.flip.pick < 0 ? { frames: [] } : {}) };
  }
  if (g.death != null && g.death !== design.death_proposal) { changed.push(`사망 ${design.death_proposal} → ${g.death}`); d = { ...d, death_proposal: g.death, ...(g.death ? { frames: [] } : {}) }; }
  if (g.split && g.split !== design.seats.split_proposal) {
    changed.push(`표결의 갈림 ${design.seats.split_proposal} → ${g.split}`);
    d = { ...d, seats: { ...d.seats, split_proposal: g.split }, ...(g.split !== "official-dissent" ? { frames: d.frames.filter((f) => f !== "seats") } : {}) };
  }
  if (g.sides) {
    for (const id of Object.keys(g.sides)) if (!design.seats.sides.some((sd) => sd.id === id)) throw new Error(`human.json: 자리의 쪽 ${id} 는 설계에 없다`);
    const sides = d.seats.sides.map((sd) => (g.sides![sd.id] && g.sides![sd.id] !== sd.why ? (changed.push(`쪽 ${sd.id} 의 까닭 ${sd.why} → ${g.sides![sd.id]}`), { ...sd, why: g.sides![sd.id]! }) : sd));
    d = { ...d, seats: { ...d.seats, sides } };
  }
  if (g.not_drawn_add?.length) { changed.push(`그리지 않을 것 + ${g.not_drawn_add.length}`); d = { ...d, not_drawn: [...d.not_drawn, ...g.not_drawn_add] }; }
  if (g.do_not_write_add?.length) { changed.push(`쓰지 말 것 + ${g.do_not_write_add.length}`); d = { ...d, do_not_write: [...d.do_not_write, ...g.do_not_write_add] }; }
  return { design: d, changed };
}
/** 설계 + 사람의 확인 → 글 단계 · 짓기가 쓰는 설계. proposed — 파이프라인이 제안한 틀 (바꾸기 전) */
export function approvedDesign(x: L): { raw: Raw; design: Design; proposed: Design["frames"]; human: Human | null; changed: string[] } {
  const { raw, design } = latestDesign(x);
  const human = readHuman(x.ep.code);
  const { design: d, changed } = applyGate1(design, human?.after_design);
  return { raw, design: d, proposed: design.frames, human, changed };
}
/** 글을 쓰기 전에 — 게이트 1 을 지났나 (/2 부터) */
export function gate1Problem(x: L, human: Human | null): string | null {
  if (x.v1) return null;
  if (!human?.after_design) return "게이트 1 (설계 뒤) — human.json 의 after_design 이 없다. `--sheet` 로 확인지 (gate1.md)를 내고 사람이 본 뒤 적는다";
  if (human.after_design.ok !== true) return "게이트 1 (설계 뒤) — after_design.ok 가 true 가 아니다 (사람이 아직 넘기지 않았다)";
  return null;
}
/** 설계를 부르기 전에 — 새 문서가 있는 회차는 다시 돌린 그래프를 사람이 봤어야 한다 (p3 사실 글의 넘침이 회차로 번지지 않게 — P-E1 ⑧-6) */
export function graphProblem(x: L, human: Human | null): string | null {
  const docs = x.ep.new_documents ?? [];
  if (!docs.length) return null;
  const have = new Set([...x.srcs.values()].map((sr) => sr.label));
  const missing = docs.filter((dl) => !have.has(dl) || !x.graph.facts.some((f) => (x.docsOfFact.get(f.label) ?? []).includes(dl)));
  if (missing.length) return `새 문서 ${missing.join(" · ")} 의 사실이 그래프에 없다 — 다시 돌리기 (rerun ${x.code} --doc ${missing[0]})를 먼저`;
  if (!human?.graph_seen) return "human.json 의 graph_seen 이 없다 — 다시 돌린 그래프 (새 사실 · 슬롯 · 해석 · 체크포인트)를 사람이 보고, 고칠 사실 글은 fact-fixes.json 에 적은 뒤 graph_sha256 을 적는다";
  if (human.graph_seen.graph_sha256 !== x.graph_sha256) return `human.json 의 graph_seen.graph_sha256 이 지금 그래프 (${x.graph_sha256.slice(0, 12)}…)와 다르다 — 사람이 본 뒤에 그래프가 바뀌었다`;
  return null;
}
export function writeReq(x: L, model: string): Req & { version: string } {
  const { design, proposed, human, changed } = approvedDesign(x);
  const g = human?.after_design;
  const note = x.v1
    ? (g?.frames ? `틀 (frames): 설계의 제안 [${proposed.join(", ") || "없음"}] → 사람이 정한 것 [${design.frames.join(", ") || "없음"}]. 까닭: ${g.why}\n아래 설계의 frames 는 사람이 정한 값으로 이미 바뀌어 있다. 켜진 틀의 칸을 채운다 — 재료는 설계의 chain · seats 에 있다.` : "")
    : [
      changed.length ? `사람이 바꾼 것: ${changed.join(" · ")}. 아래 설계는 이미 그 값으로 바뀌어 있다. 켜진 틀의 칸을 채운다 — 재료는 설계의 chain · seats 에 있다.` : "사람이 설계의 제안을 그대로 넘겼다.",
      g?.flip?.note ? `뒤집기에 대해: ${g.flip.note}` : "", g?.story?.note ? `이야기에 대해: ${g.story.note}` : "", g?.why ? `까닭: ${g.why}` : "", g?.note ? `그 밖에: ${g.note}` : "",
    ].filter(Boolean).join("\n");
  return { model, effort: MODELS.write.effort, system: writeSystem(exemplar()), user: writeUser(ctx(x, writeFacts(x, design)), JSON.stringify(design, null, 1), note), schema: WRITE_SCHEMA, max_tokens: MODELS.write.max_tokens, version: x.versions.write };
}
export function latestWrite(x: L, model: string): { raw: Raw; written: Written } | null {
  const raw = readRaws(x.ep.code, "write").filter((r) => r.prompt_version === x.versions.write && r.model_requested === model).at(-1);
  if (!raw) return null;
  const { design } = approvedDesign(x);
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
function readRepairs(x: L): RepairLine[] {
  return readRaws(x.ep.code, "repair").filter((r) => r.prompt_version === x.versions.repair).flatMap((r, i) => (JSON.parse(r.output) as Repair).items.map((it) => ({ ...it, round: i + 1 })));
}
/** 사람의 고침 (게이트 2 — human.json after_write.edits · drops)을 고치기 줄의 꼴로. 고치기 단계 뒤에 얹힌다 (round 0 = 사람) */
export function humanRepairs(h: Human | null): RepairLine[] {
  const g = h?.after_write;
  return [
    ...(g?.edits ?? []).map((e) => ({ id: e.id, action: "fix" as const, t: e.t, src: e.src ?? [], calc: e.calc ?? [], why: `사람 (게이트 2): ${e.why}`, round: 0 })),
    ...(g?.drops ?? []).map((id) => ({ id, action: "drop" as const, t: "", src: [], calc: [], why: "사람 (게이트 2): 뺀다", round: 0 })),
  ];
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
  /** 같은 그림 (D61 ②) — 지난 회차에 같은 틀이 있고 설계가 그림을 바꾸자고 하지 않았으면 (carry.has 이고 keep 이 false 일 때만 바꾼다) 그 그림의 이름과 **그림의 말**을 받는다:
   *  고리의 이름 · 누를 행동 · 멈춘 자리 뒤의 물음 · 자리 그림의 이름 · 내 자리의 글자 · 쪽의 고르는 말 · 다른 쪽 단추 · 도구의 이름. 전부 근거가 붙지 않는 맨 글자열이다. 값 · 글은 받지 않는다 */
  const keepPicture = !!x.prev && !(design.carry?.has && design.carry.keep === false);
  const said = (where: string, mine: string, theirs: string | undefined) => {
    if (!keepPicture || theirs == null || theirs === mine) return mine;
    notes.push(`${where}: 그림의 말을 지난 회차에서 받았다 — “${mine}” → “${theirs}”`);
    return theirs;
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
      key: d.key, name: said(`tools.${d.key}.name`, bare(d.name, `tools.${d.key}.name`), x.prev?.tools.find((pt) => pt.key === d.key)?.name), short: T(`tools[${i}].short`, t.short), body: t.body.map((b, j) => T(`tools[${i}].body[${j}]`, b)), use: T(`tools[${i}].use`, t.use),
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
  /** 지난 회차의 글 한 덩이를 그대로 받는다 — 그 근거 구절 · 문서도 함께 옮긴다 (키는 지난 회차의 것 그대로) */
  const carryT = (t: PrevT): ET => {
    for (const k of t.src ?? []) { const q = x.prev!.quotes[k]; if (!q) throw new Error(`지난 회차의 구절 ${k} 가 없다`); quotes[k] = q; docs[q.doc] ??= x.prev!.docs[q.doc]!; }
    return t as ET;
  };
  const pastT = x.prev
    ? x.prev.track.filter((t) => t.state !== "next").map((t) => ({ no: t.no, title: carryT(t.title), state: "past" }))
    : x.ep.past.map((p) => {
      const src = keysOf(p.src_facts, `track ${p.no}`);
      return { no: /\d/.test(p.no) ? ui(p.no) : { t: p.no }, title: { t: p.title, ...(src.length ? { src } : {}), ...(Object.keys(p.calc).length ? { calc: p.calc } : {}) } as ET, state: "past" };
    });
  const prevFrame = (kind: string) => (x.prev?.solve.lab?.frames ?? []).find((f) => f.kind === kind) as any | undefined;
  const pictureId = (kind: "chain" | "seats", proposed: string) => {
    const pf = prevFrame(kind);
    if (!pf || !keepPicture) return proposed || `${x.series.code}-${kind}`;
    if (proposed && proposed !== pf.picture.id) notes.push(`${kind}: 설계가 그림 이름을 “${proposed}” 로 냈다 — 지난 회차의 그림 “${pf.picture.id}” 을 받았다 (같은 그림 · 오늘의 값만)`);
    return pf.picture.id;
  };
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
          kind: "chain", picture: { id: x.v1 ? design.chain.picture_id || `${x.series.code}-chain` : pictureId("chain", design.chain.picture_id), tool: pictureTool(keepPicture && keys.includes(prevFrame("chain")?.picture.tool) ? prevFrame("chain").picture.tool : design.chain.picture_tool, design.born_tool) },
          tab: both ? T("lab.chain.tab", c.tab, false) : null,
          nodes: design.chain.nodes.filter((d) => wn.has(d.id)).map((d) => {
            const { nd, i } = wn.get(d.id)!;
            const value = T(`lab.chain.nodes[${i}].value`, nd.value, false);
            const name = said(`chain.${d.id}.name`, nd.name, prevFrame("chain")?.nodes.find((pn: any) => pn.id === d.id)?.name);
            return d.reach === "none" ? { id: d.id, name, reach: "none", still: value } : { id: d.id, name, reach: d.reach, idle: nd.idle, after: value };
          }),
          unknown: said("chain.unknown", c.unknown, prevFrame("chain")?.unknown), action: said("chain.action", c.action, prevFrame("chain")?.action), again: COMMON.again, caption: { before: T("lab.chain.caption_before", c.caption_before, false), after: T("lab.chain.caption_after", c.caption_after) },
          go_on: both && c.go_on ? T("lab.chain.go_on", c.go_on, false) : null,
        });
      }
      if (kind === "seats" && w.lab!.seats) {
        const s = w.lab!.seats;
        const ws = new Map(s.sides.map((sd, i) => [sd.id, { sd, i }]));
        frames.push({
          kind: "seats", picture: { id: x.v1 ? design.seats.picture_id || `${x.series.code}-seats` : pictureId("seats", design.seats.picture_id), tool: pictureTool(keepPicture && keys.includes(prevFrame("seats")?.picture.tool) ? prevFrame("seats").picture.tool : design.seats.picture_tool, "") }, tab: both ? T("lab.seats.tab", s.tab, false) : null,
          ground: { body: bare(design.seats.body, "seats.ground.body"), split: design.seats.split_proposal, record: keysOf(design.seats.record_facts, "seats.ground.record") }, label: said("seats.label", s.label, prevFrame("seats")?.label), you: said("seats.you", s.you, prevFrame("seats")?.you),
          sides: [...design.seats.sides].sort((a, b) => b.count - a.count).filter((d) => ws.has(d.id)).map((d) => {
            const { sd, i } = ws.get(d.id)!;
            return { id: d.id, choose: said(`seats.${d.id}.choose`, sd.choose, prevFrame("seats")?.sides.find((ps: any) => ps.id === d.id)?.choose), group: T(`lab.seats.sides[${i}].group`, sd.group, false), count: d.count, said: T(`lab.seats.sides[${i}].said`, sd.said), why: d.why, not_yet_note: d.why === "not-yet" ? sd.not_yet_note : null };
          }),
          other: said("seats.other", s.other, prevFrame("seats")?.other), result: T("lab.seats.result", s.result, false), caption: { before: T("lab.seats.caption_before", s.caption_before, false) },
        });
      }
    }
  }
  const lab = hasLab && frames.length ? {
    title: w.lab!.title, seen_title: w.lab!.seen_title ?? null, setup: w.lab!.setup.map((s, i) => T(`lab.setup[${i}]`, s)), frames,
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
  keys.forEach((k, i) => { const a = (2 * Math.PI * i) / keys.length - Math.PI / 2; at[k] = x.prev?.map.at[k] ?? [Math.round(50 + 30 * Math.cos(a)), Math.round(50 + 30 * Math.sin(a))]; });   // 지난 회차에 있던 도구는 그 자리 그대로
  const edges = design.map_edges.filter((e) => keys.includes(e.from) && keys.includes(e.to) && e.from !== e.to).map((e) => [e.from, e.to]);
  const ghosts = design.ghosts.filter((g) => keys.includes(g.from)).slice(0, 2).map((g) => {
    const [gx, gy] = at[g.from]!;
    return { name: bare(g.name, "map.ghosts"), at: [Math.round(50 + (gx - 50) * 0.35 + (gy < 50 ? 8 : -8)), gy < 50 ? 8 : 92], from: g.from };
  });
  const episode = {
    _source: {
      what: `파이프라인이 만든 회차 (${x.v1 ? "P-E1 · " : ""}packages/pipeline/src/episode.ts). 사건 ${x.code} 의 P-3 ~ P-5 산출물에서 지었다. **사람 확인 전이다** — death · split · why · 뒤집기 · 지도는 제안이다 (review.json)`,
      event_code: x.code, design: x.versions.design, write: x.versions.write, graph_sha256: x.graph_sha256, ...(x.prev ? { previous: x.prev.code } : {}),
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
  const tmp = join(outDir(x.ep.code), `.validate-input.${process.pid}.json`);
  mkdirSync(outDir(x.ep.code), { recursive: true });
  writeFileSync(tmp, JSON.stringify({ episode, documents: x.documents }));
  const out = execFileSync(R("apps/web/node_modules/.bin/tsx"), [R("packages/pipeline/src/episode-validate.ts"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  unlinkSync(tmp);
  return JSON.parse(out);
}

// ── 함의 ─────────────────────────────────────────────────────────────────────────────────────────────
type Judged = { verdict: EVerdict; issues: { part: string; kind: string; where: string; why: string }[]; note: string };
type EntailLine = { id: string; text_sha256: string; request_sha256: string; model: string | null; model_requested: string; effort: string; prompt_version: string; stop_reason: string | null; usage: unknown; duration_ms: number; cost_usd: number; called_at: string; ok: boolean; error: string | null; output: string | null; mode?: "batch"; batch_id?: string };
const entailPath = (epCode: string) => join(rawDir(epCode), `entail.${MODELS.entail.model}.${MODELS.entail.effort}.jsonl`);
const readEntail = (epCode: string): EntailLine[] => (existsSync(entailPath(epCode)) ? readFileSync(entailPath(epCode), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
/** /1 — 함의를 보는 글: 근거가 붙었고, 낱말 · 날짜 · 수만 있는 짧은 글 (큰 글자 · 칸 머리 · 연표의 때)이 아닌 것 */
export const needsEntail = (wt: WT) => wt.src.length > 0 && wt.t.replace(/\s/g, "").length >= 14;

// 위험한 글 (D73 — 함의는 위험한 글에만). 규칙은 글자를 본다 (모델 아님 · 결정적). P-E1 의 걸림 17 에 대 본 결과: logs/pipeline/P-E2.md ④
//   숫자        아라비아 숫자 · calc — 수 자체는 코드가 보지만 (불변식 9) 그 수가 **무엇의** 수인가는 뜻이다
//   한글 수     "열 명과 두 명" · "처음" · "유일" · "마다" — 코드의 숫자 검사가 못 보는 수 · 범위의 말
//   기관의 판단  꼬리표 official
//   문서의 일   꼬리표가 explain · none 인데 문서 · 기관 · 사람이 한 일을 말하는 글 (꼬리표가 틀렸을 수 있다 — P-E1 의 걸림 둘이 이 꼴)
//   인과        때문 · 그래서 · ~려고 · 뜻 …
//   고친 글     고치기 단계 · 사람이 고친 글
const RISK = {
  numword: /(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|열한|열두|스무|몇)\s?(명|표|번|차례|달|주|해|사람|곳|개|배|가지)|(하나|둘|셋|넷)(뿐|이|은|는|도|예|이에|,| )|처음|마지막|유일|모두|전부|마다|항상|늘 |언제나|만에/u,
  cause: /때문|덕분|탓|그래서|따라서|그러니|위해|위한|려고|으니까|니까요|므로|결과|영향|이유|까닭|원인|바람에|(?:해|돼|져|와|워|려|여|라)서[ ,]|뜻|의미|보여/u,
  doc: /(라고|다고|다는|라는|자고|자는|냐고)|(했|말했|밝혔|적었|적혔|전했|봤|인정|판단|평가|지적|선호|원했)|성명문|회의록|의장|위원|연준|위원회|총재|이사|회의/u,
};
export function riskOf(wt: WT, repaired = false): string[] {
  const r: string[] = [];
  if (/\d/.test(wt.t) || wt.calc.length) r.push("숫자");
  else if (RISK.numword.test(wt.t)) r.push("한글 수");
  if (wt.voice === "official") r.push("기관의 판단");
  else if ((wt.voice === "explain" || wt.voice === "none") && RISK.doc.test(wt.t)) r.push("문서의 일");
  if (RISK.cause.test(wt.t)) r.push("인과");
  if (repaired) r.push("고친 글");
  return r;
}
/** /2 — 함의를 보는 글: /1 의 조건 + 위험한 글 */
export const needsEntail2 = (wt: WT, repaired = false) => needsEntail(wt) && riskOf(wt, repaired).length > 0;

export function entailReq(x: L, id: string, wt: WT): (Req & { version: string }) | null {
  const srcByLabel = new Map([...x.srcs.values()].map((s) => [s.label, s]));
  const evidence = wt.src.filter((l) => !x.politicsOnly.has(l)).flatMap((l) => x.passages.get(l) ?? []).map((p) => {
    const s = srcByLabel.get(p.doc)!;
    return { title: s.title, publisher: s.publisher, published_at: String(s.published_at), passage: p.quote.replace(/\s+/gu, " "), context: widen(x.texts.get(p.source_id)!, p.span_start, p.span_end) };
  });
  if (!evidence.length) return null;
  const v = x.versions.entail;
  return { model: MODELS.entail.model, effort: MODELS.entail.effort, system: entailSystem(v), user: entailUser({ t: wt.t, voice: wt.voice, calc: wt.calc, where: id }, evidence), schema: v === "episode-entail/1" ? ENTAIL_SCHEMA : ENTAIL2_SCHEMA, max_tokens: MODELS.entail.max_tokens, version: v };
}
/** 글 하나의 저장된 판정 — 지금 글 · 지금 근거와 같은 요청에서 나온 것. verdict 는 issues 에서 다시 정한다 (모델이 적은 값을 믿지 않는다) */
export function judgementOf(lines: EntailLine[], req: Req): Judged | null {
  const want = requestSha(req);
  const hit = lines.filter((l) => l.request_sha256 === want && l.ok && l.output != null).at(-1);
  if (!hit) return null;
  const j = JSON.parse(hit.output!) as Judged;
  return j.verdict === "CANNOT_JUDGE" ? j : { ...j, verdict: deriveVerdict(j.issues) };
}
const BAD = new Set<EVerdict>(["EXCEEDS", "CONTRADICTS", "UNDER_SOURCED"]);

// ── 지은 결과 + 검사 ─────────────────────────────────────────────────────────────────────────────────
export function writerOf(argv: string[]): string {
  return argv.includes("--writer") ? argv[argv.indexOf("--writer") + 1]! : MODELS.write.model;
}
export function build(epCode: string, writer: string) {
  const x = load(epCode);
  const { raw: draw, design, proposed, human, changed } = approvedDesign(x);
  const lw = latestWrite(x, writer);
  if (!lw) throw new Error(`--write-call 을 먼저 (${writer})`);
  const repairs = writer === MODELS.write.model ? readRepairs(x) : [];
  const first = applyRepairs(lw.written, repairs);
  // 사람의 고침 (게이트 2)은 고치기 단계 뒤에 얹는다. 근거를 적지 않은 고침은 지금 근거를 그대로 둔다
  const now = new Map(textsOf(first.written).map((t) => [t.id, t.wt]));
  const hr = (x.v1 ? [] : humanRepairs(human)).map((r) => (r.action === "fix" && !r.src.length && now.has(r.id) ? { ...r, src: now.get(r.id)!.src, calc: r.calc.length ? r.calc : now.get(r.id)!.calc } : r));
  const second = applyRepairs(first.written, hr);
  const written = second.written, applied = [...first.applied, ...second.applied], cantDrop = [...first.cantDrop, ...second.cantDrop];
  const b = assemble(x, design, written);
  const v = validate(b.episode, x);
  const entail = readEntail(epCode);
  const texts = textsOf(written);
  const touched = new Set(applied.filter((a) => a.action === "fix").map((a) => a.id));
  const want = (t: { id: string; wt: WT }) => (x.v1 ? needsEntail(t.wt) : needsEntail2(t.wt, touched.has(t.id)));
  const judged = texts.filter(want).map((t) => {
    const req = entailReq(x, t.id, t.wt);
    return { id: t.id, path: b.where.get(t.id) ?? null, t: t.wt.t, src: t.wt.src, judgement: req ? judgementOf(entail, req) : null };
  });
  return { x, design, proposed, human, changed, draw, wraw: lw.raw, written, original: lw.written, applied, cantDrop, b, v, judged, texts, touched };
}

const MINUTES = { flip: 3, frame: 1, picture: 4, human_cell: 1, hand_tool: 5, map: 2, blocked: 2, read: 4 };
/** 사람 확인 목록 — EPISODE §8 (스스로 적는 칸) · UX-3 ⑦ · B-E1 ⑥ */
export function review(r: ReturnType<typeof build>) {
  const { design: d, b, v, judged, x } = r;
  const flip = d.flips[d.chosen_flip] ?? null;
  const items: { what: string; where: string; proposal: string; why: string; minutes: number; kind: "must" | "blocked" | "look" }[] = [];
  const add = (kind: "must" | "blocked" | "look", minutes: number, what: string, where: string, proposal: string, why: string) => items.push({ kind, minutes, what, where, proposal, why });
  const bad = judged.filter((j) => j.judgement && BAD.has(j.judgement.verdict));
  for (const e of v.errors) add("blocked", MINUTES.blocked, "계약 검증에 걸렸다 — 발행 못 한다", e.path, e.code, e.message);
  for (const j of bad) add("blocked", MINUTES.blocked, j.judgement!.verdict === "UNDER_SOURCED" ? "근거가 덜 붙은 글 — 받칠 사실을 붙이거나 그 조각을 뺀다" : "함의 검사에 걸린 글 — 고치거나 뺀다", j.path ?? j.id, j.t, j.judgement!.issues.map((i) => `“${i.part}” ${i.kind} · ${i.where} — ${i.why}`).join(" / "));
  for (const c of r.cantDrop) add("blocked", MINUTES.blocked, "고치기 단계가 빼자고 했지만 뺄 수 없는 칸이다", b.where.get(c.id) ?? c.id, c.t, c.why);
  add("must", MINUTES.flip, "뒤집기가 진짜인가 — 그 첫 생각을 정말 흔히 하나 · 깨는 사실이 정말 깨나", "/solve/entry/flip", flip ? `첫 생각 “${flip.first_thought}” → ${flip.a} ${flip.op} ${flip.b}` : "뒤집기 없음 — 기본 풀이",
    flip ? `${flip.why_common} (근거 ${flip.why_common_facts.join(" ") || "없음"}) · 고른 까닭: ${d.flip_reason}${d.flips.length > 1 ? ` · 버린 후보: ${d.flips.filter((_, i) => i !== d.chosen_flip).map((f) => `${f.a} ${f.op} ${f.b}`).join(" / ")}` : ""}` : d.flip_reason);
  add("must", MINUTES.human_cell, "사람이 숨진 사건 · 부고인가", "/solve/entry/death", String(d.death_proposal), d.death_reason);
  add("must", MINUTES.frame, "체험을 넣을 것인가 · 틀이 맞나 (정치 · 말투 · 자료)", "/solve/lab", `파이프라인의 제안 ${r.proposed.length ? `[${r.proposed.join(" → ")}]` : `체험 없음 (${d.plain_why_proposal})`} · 기본 풀이 ${d.plain_kind}${r.human?.after_design?.frames && (x.v1 || r.proposed.join() !== d.frames.join()) ? ` → 사람이 정한 것 [${d.frames.join(" → ")}] (${r.human.after_design.why ?? r.human.after_design.note ?? ""})` : ""}`, d.frame_reason);
  if (d.frames.includes("seats")) {
    add("must", MINUTES.human_cell, "자리에 앉기 — 한 기관 안의 공식 이견인가 (정당 표결이면 금지)", "/solve/lab/frames/*/ground/split", `${d.seats.split_proposal} · ${d.seats.body}`, d.seats.split_reason);
    for (const s of d.seats.sides) add("must", MINUTES.human_cell, `자리 “${s.stance}” (${s.count}) — 그쪽의 까닭이 문서에 있나 · not-yet 이면 화면의 문장이 정말 그 뜻인가`, `/solve/lab/frames/*/sides/${s.id}/why`, s.why, s.why_reason);
  }
  if (!x.v1 && d.frames.length) add("must", MINUTES.frame, "이야기 — 독자를 그 자리에 앉혔나 · “아!”가 뒤집기의 되풀이가 아니라 개념에 떨어지나 · 두 틀이 이어지나", "/solve/lab/setup · caption", `누가: ${d.story.who} · 하는 일: ${d.story.do} · 아!: ${d.story.aha} (${d.story.aha_concept})${d.frames.length > 1 ? ` · 잇는 말: ${d.story.bridge}` : ""}`, `${d.story.from} → ${d.story.to}`);
  const pairs = x.v1 ? [] : carryPairs(x, d, b.episode);
  if (pairs.length) add("must", MINUTES.frame * 2, "같은 그림 · 오늘의 값 — 지난 회차의 값과 나란히 본다 (계약에 지난 값의 칸이 없다 — 화면에는 오늘 값만 나간다)", "/solve/lab/frames", pairs.map((c) => `${c.where} “${c.name}”: ${c.before} → ${c.today}`).join(" / "), d.carry.why);
  if (!x.v1 && x.prev) for (const pr of d.carry.promises) add("look", 0, `지난 회차의 약속 — ${pr.status}`, "-", pr.promise, pr.answer_gist);
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
    _what: `${x.v1 ? "P-E1 — " : ""}사람 확인 목록 (episode.ts 가 짓는다 · 결정적). 사건 ${x.code} · 회차 ${x.ep.code}. must = 사람이 꼭 정하는 칸 (EPISODE §8 · UX-3 ⑦) · blocked = 검사에 걸려 발행 못 하는 것 · look = 읽어 볼 것. minutes 는 어림이다`,
    human_after_design: r.human?.after_design ?? null, frames_proposed: r.proposed, frames: d.frames,
    event: x.code, episode_code: x.ep.code, writer: r.wraw.model_requested, design_version: r.draw.prompt_version, write_version: r.wraw.prompt_version,
    ...(x.v1 ? {} : {
      gates: {
        graph_seen: r.human?.graph_seen ?? null,
        after_design: r.human?.after_design ? { ok: r.human.after_design.ok === true, by: r.human.after_design.by, changed: r.changed } : null,
        after_write: r.human?.after_write ? { ok: r.human.after_write.ok === true, by: r.human.after_write.by, edits: r.human.after_write.edits?.length ?? 0, drops: r.human.after_write.drops?.length ?? 0 } : null,
      },
      /** 낼 수 있나 — 계약 통과 · 막힘 0 · 게이트 2 를 사람이 넘겼다. 발행은 이 단계의 일이 아니다 */
      publishable: v.ok && items.every((i) => i.kind !== "blocked") && r.human?.after_write?.ok === true,
      carry: pairs,
    }),
    minutes: { must: items.filter((i) => i.kind === "must").reduce((a, i) => a + i.minutes, 0), blocked: items.filter((i) => i.kind === "blocked").reduce((a, i) => a + i.minutes, 0), look: items.filter((i) => i.kind === "look").reduce((a, i) => a + i.minutes, 0) },
    follower_known: b.followerKnown,
    checks: {
      contract: { ok: v.ok, errors: v.errors, warnings: v.warnings, stats: v.stats },
      entail: { model: MODELS.entail.model, effort: MODELS.entail.effort, prompt_version: x.versions.entail, texts: r.texts.length, with_src: r.texts.filter((t) => t.wt.src.length).length,
        ...(x.v1 ? {} : { low_risk_skipped: r.texts.filter((t) => needsEntail(t.wt) && !needsEntail2(t.wt, r.touched.has(t.id))).map((t) => t.id), UNDER_SOURCED: count("UNDER_SOURCED") }), judged: judged.filter((j) => j.judgement).length, not_judged: judged.filter((j) => !j.judgement).map((j) => j.id),
        ENTAILED: count("ENTAILED"), NEEDS_CONTEXT: count("NEEDS_CONTEXT"), EXCEEDS: count("EXCEEDS"), CONTRADICTS: count("CONTRADICTS"), CANNOT_JUDGE: count("CANNOT_JUDGE"),
        flagged: judged.filter((j) => j.judgement && j.judgement.verdict !== "ENTAILED").map((j) => ({ id: j.id, path: j.path, t: j.t, verdict: j.judgement!.verdict, issues: j.judgement!.issues, note: j.judgement!.note })) },
      repairs: r.applied.map((a) => ({ id: a.id, round: a.round, action: a.action, before: textsOf(r.original).find((t) => t.id === a.id)?.wt.t ?? null, after: a.action === "fix" ? a.t : null, why: a.why })),
    },
    items,
  };
}

// ── 이어 쓰기 — 같은 그림의 지난 값 ↔ 오늘의 값 (UX-4 ⑦-3 · EPISODE §7.6 미확인: 계약에 지난 값의 칸이 없다 → review.json 에만 싣는다) ──
export function carryPairs(x: L, d: Design, episode: Record<string, unknown>): { where: string; name: string; before: string; today: string }[] {
  const prevFrames = x.prev?.solve.lab?.frames ?? [];
  const nowFrames = ((episode.solve as { lab: { frames: any[] } | null }).lab?.frames ?? []) as any[];
  const out: { where: string; name: string; before: string; today: string }[] = [];
  for (const nf of nowFrames) {
    const pf = prevFrames.find((f) => f.kind === nf.kind);
    if (!pf) continue;
    if (nf.kind === "chain") for (const nd of nf.nodes) { const pn = pf.nodes.find((n: any) => n.id === nd.id); if (pn) out.push({ where: `chain.${nd.id}`, name: nd.name, before: `${(pn.after ?? pn.still).t} (${pn.reach})`, today: `${(nd.after ?? nd.still).t} (${nd.reach})` }); }
    if (nf.kind === "seats") for (const sd of nf.sides) { const ps = pf.sides.find((n: any) => n.id === sd.id); if (ps) out.push({ where: `seats.${sd.id}`, name: sd.choose, before: `${ps.group.t} · 까닭 ${ps.why}`, today: `${sd.group.t} · 까닭 ${sd.why}` }); }
  }
  void d;
  return out;
}

/** 발행일에 걸린 말 — 읽는 날이 달라지면 틀린다 (D8 VOLATILE · P-E1 ③ "지난달" 열아홉 번) */
export const DATED = /지난달|어제|오늘 아침|이번 주|지난주|최근|얼마 전|며칠 전/;
// ── 설계를 코드가 본다 (게이트 1 의 확인지에 싣는다 — 사람이 볼 것을 줄인다) ─────────────────────────────────
export type Check = { level: "막힘" | "볼 것" | "좋음"; what: string };
/** 자리 틀의 조건 둘 (D61 ③ · D62 ②) — 한 기관 안의 공식 이견 · 양쪽이 공식으로 한 말이 문서에 (구절 있는 사실) */
export const seatsStand = (d: Design, hasPassage: (l: string) => boolean) =>
  d.seats.has && d.seats.split_proposal === "official-dissent" && d.seats.sides.length === 2 && d.seats.sides.every((sd) => sd.said_facts.some(hasPassage)) && d.seats.record_facts.some(hasPassage);
export function designChecks(x: L, d: Design, problems: string[] = []): Check[] {
  const out: Check[] = problems.map((p) => ({ level: "볼 것" as const, what: `칸 목록: ${p}` }));
  const has = (l: string) => x.passages.has(l) && !x.politicsOnly.has(l);
  const flip = d.flips[d.chosen_flip];
  if (d.chosen_flip >= 0 && !flip) out.push({ level: "막힘", what: `chosen_flip ${d.chosen_flip} 에 후보가 없다` });
  if (flip && !flip.breaker_facts.some(has)) out.push({ level: "막힘", what: "깨는 사실에 구절을 실을 수 있는 사실이 없다 (불변식 11)" });
  if (flip && !flip.why_common_facts.length) out.push({ level: "볼 것", what: "그 첫 생각을 흔히 한다는 문서 안의 증거가 없다 — 사람이 판단한다" });
  const stand = seatsStand(d, has);
  if (stand && !d.frames.includes("seats") && flip && !d.death_proposal) out.push({ level: "볼 것", what: "자리의 조건 둘이 서는데 (공식 이견 · 양쪽의 말이 문서에) 설계가 제안에서 뺐다 — 켤지 정한다" });
  if (stand && d.frames.includes("seats")) out.push({ level: "좋음", what: `자리 틀을 제안했다 — 조건 둘이 선다${d.seats.sides.some((sd) => sd.why === "not-yet") ? " · 까닭이 아직 없는 쪽 (not-yet)은 화면에 그 말이 나간다 (불변식 17)" : ""}` });
  if (!stand && d.frames.includes("seats")) out.push({ level: "막힘", what: "자리 틀을 제안했지만 조건이 서지 않는다 (공식 이견이 아니거나 · 쪽이 둘이 아니거나 · 한쪽의 말에 구절이 없다)" });
  if (d.frames.includes("chain")) {
    const order = d.chain.nodes.map((n) => ({ full: 0, part: 1, none: 2 })[n.reach]);
    if (d.chain.nodes.length < 2 || d.chain.nodes.length > 4) out.push({ level: "막힘", what: `고리가 ${d.chain.nodes.length} 개다 (둘 ~ 넷 · 불변식 18)` });
    if (order.some((o, i) => i > 0 && o < order[i - 1]!)) out.push({ level: "막힘", what: "고리가 닿은 차례대로가 아니다 (full → part → none)" });
    if (!d.chain.nodes.some((n) => n.reach !== "full")) out.push({ level: "막힘", what: "멈춘 자리가 없다" });
    for (const n of d.chain.nodes) if (!n.facts.some(has)) out.push({ level: "막힘", what: `고리 ${n.id} 의 오늘의 값에 구절을 실을 수 있는 사실이 없다` });
  }
  if (d.frames.length) {
    const st = d.story;
    const empty = (["who", "do", "aha"] as const).filter((k) => !st[k].trim());
    if (empty.length) out.push({ level: "볼 것", what: `이야기의 칸이 비었다 — ${empty.join(" · ")} (체험이 설명이 될 위험)` });
    if (d.frames.length > 1 && !st.bridge.trim()) out.push({ level: "볼 것", what: "틀이 둘인데 잇는 말 (story.bridge)이 없다 — 두 틀이 따로 논다" });
    if (flip && st.aha.trim() && (st.aha.includes(flip.a) && st.aha.includes(flip.b))) out.push({ level: "볼 것", what: "“아!”가 뒤집기 문장의 되풀이로 보인다 — 개념에 떨어져야 한다" });
  }
  const named: [string, string][] = [...d.tools.map((t) => [`tools.${t.key}.name`, t.name] as [string, string]), ["seats.body", d.seats.body], ...d.ghosts.map((g, i) => [`ghosts[${i}].name`, g.name] as [string, string]), ...d.chain.nodes.map((n) => [`chain.nodes.${n.id}.name`, n.name] as [string, string])];
  const digit = named.filter(([, v]) => /\d/.test(v));
  if (digit.length) out.push({ level: "볼 것", what: `이름 칸에 숫자 — 코드가 덧붙인 말을 뗀다: ${digit.map(([k, v]) => `${k} “${v}”`).join(" · ")}` });
  if (d.voice_official.replace(/\s/g, "").length > 20 || /\d/.test(d.voice_official)) out.push({ level: "볼 것", what: `voice_official 이 꼬리표의 이름이 아니다 (길거나 숫자가 있다): “${clip(d.voice_official, 50)}”` });
  const dated = [["reader_question", d.reader_question], ["title_question", d.title_question], ["keep_line", d.keep_line], ["story.aha", d.story.aha]].filter(([, v]) => DATED.test(v!));
  if (dated.length) out.push({ level: "볼 것", what: `발행일에 걸린 말 (읽는 날이 달라지면 틀린다) — ${dated.map(([k, v]) => `${k} “${clip(v!, 40)}”`).join(" · ")}. 글 단계가 다듬을 때 고친다 (글 프롬프트의 규칙)` });
  const hand = d.tools.filter((t) => t.hand);
  if (hand.length) out.push({ level: "볼 것", what: `라이브러리에 없는 도구 ${hand.length} — ${hand.map((t) => t.name).join(" · ")} (콘텐츠 레인 · 도구마다 5분)` });
  if (x.prev) {
    const c = d.carry;
    if (!c.has) out.push({ level: "볼 것", what: "지난 회차를 받았는데 carry 를 채우지 않았다" });
    const pk = (x.prev.solve.lab?.frames ?? []).map((f) => f.kind as string);
    if (!(c.has && c.keep === false) && pk.join() !== d.frames.join()) out.push({ level: "볼 것", what: `틀이 지난 회차와 다르다 — 지난 [${pk.join(" → ")}] · 이번 [${d.frames.join(" → ")}]` });
    const pc = (x.prev.solve.lab?.frames ?? []).find((f) => f.kind === "chain");
    if (pc && d.frames.includes("chain")) {
      const a = pc.nodes.map((n: any) => `${n.id}:${n.name}`).join(" → "), bb = d.chain.nodes.map((n) => `${n.id}:${n.name}`).join(" → ");
      if (a !== bb) out.push({ level: "볼 것", what: `같은 그림인데 고리가 다르다 — 지난 [${a}] · 이번 [${bb}] (그림의 말은 그대로 받는다)` });
    }
    const ps = (x.prev.solve.lab?.frames ?? []).find((f) => f.kind === "seats");
    if (ps && d.frames.includes("seats")) {
      const a = ps.sides.map((n: any) => n.id).sort().join(), bb = d.seats.sides.map((n) => n.id).sort().join();
      if (a !== bb) out.push({ level: "볼 것", what: `같은 그림인데 쪽의 id 가 다르다 — 지난 [${a}] · 이번 [${bb}]` });
      for (const sd of d.seats.sides) { const p0 = ps.sides.find((n: any) => n.id === sd.id); if (p0 && p0.why === "not-yet" && sd.why === "in-doc") out.push({ level: "좋음", what: `쪽 ${sd.id} 의 까닭이 채워졌다 (not-yet → in-doc · ${sd.who_says || "누가 전했는지 비었다"}) — 그 근거 구절을 본다` }); }
    }
    for (const t of d.tools) { const pt = x.prev.tools.find((y) => y.key === t.key); if (pt && pt.name !== t.name) out.push({ level: "볼 것", what: `도구 ${t.key} 의 이름이 지난 회차와 다르다 — “${pt.name}” · “${t.name}”` }); }
    const promised = x.prev.scenes.next.coming.length + x.prev.scenes.next.unknown.length;
    if (c.promises.length < promised) out.push({ level: "볼 것", what: `지난 회차의 약속 · 모름 ${promised} 가운데 ${c.promises.length} 만 답했다` });
  }
  return out;
}

// ── 사람 확인지 — 한 장 (markdown · 결정적). 사람은 이것을 보고 human.json 을 적는다 (logs/pipeline/P-E2.md ⑥) ────────────
const one = (v: string) => v.replace(/\n/g, " / ");
export function gate1Sheet(x: L): string {
  const { raw, design: d, problems } = latestDesign(x);
  const human = readHuman(x.ep.code);
  const checks = designChecks(x, d, problems);
  const quote = (labels: string[], n = 2) => labels.filter((l) => x.passages.has(l)).slice(0, n).map((l) => `  - ${l} (${x.passages.get(l)![0]!.doc}) “${clip(x.passages.get(l)![0]!.quote, 150)}”`);
  const flip = d.flips[d.chosen_flip];
  const L: string[] = [
    `# 게이트 1 — 설계 뒤 · 5분 · 「${x.series.name}」 ${x.ep.number}화 (${x.ep.code})`,
    "",
    `글에 돈 (≈ 0.9 달러)을 쓰기 **전에** 본다. 정한 것은 \`${join("packages/pipeline/data/events", x.code, x.ep.dir ?? join("episodes", x.ep.code), "human.json")}\` 의 \`after_design\` 에 적고 \`ok: true\`. 적지 않은 칸은 설계의 제안 그대로 간다.`,
    `설계 ${raw.prompt_version} · ${raw.model} · ${raw.effort} · $${raw.cost_usd.toFixed(2)} · 그래프 ${raw.graph_sha256.slice(0, 12)}${raw.graph_sha256 === x.graph_sha256 ? "" : " (**지금 그래프와 다르다 — 설계를 다시 불러야 한다**)"}`,
    "",
    "## 0. 기계가 먼저 본 것",
    ...(checks.length ? checks.map((c) => `- **${c.level}** — ${c.what}`) : ["- 걸린 것 없음"]),
    "",
    "## 1. 뒤집기가 진짜인가 (3분) — `flip`",
    `독자의 물음: ${d.reader_question}`,
    ...(flip ? [
      `- 첫 생각: “${flip.first_thought}”`,
      `- 정말 흔히 하나: ${flip.why_common}`, ...quote(flip.why_common_facts),
      `- 깨는 사실: ${flip.breaker}`, ...quote(flip.breaker_facts, 3),
      `- **${flip.a} ${flip.op} ${flip.b}** (${flip.strength} · 씨앗 ${flip.seed_claim || "-"})`,
      `- 고른 까닭: ${d.flip_reason}`,
      ...d.flips.map((f, i) => (i === d.chosen_flip ? null : `- 버린 후보 ${i}: ${f.a} ${f.op} ${f.b} (${f.strength})`)).filter((v): v is string => !!v),
    ] : [`- **뒤집기 없음** — ${d.flip_reason}`, "- 체험 없이 기본 풀이로 나간다"]),
    `- 제목 물음: “${one(d.title_question)}” · 오늘의 한 줄: “${one(d.keep_line)}”`,
    "- 볼 것: 그 첫 생각을 보통 사람이 정말 하나 · 깨는 사실이 첫 생각과 **양립할 수 없나** (그저 다른 얘기가 아닌가)",
    "- 고르기: 맞다 → 그대로 / 다른 후보 → `flip.pick: <번호>` / 뒤집기가 아니다 → `flip.pick: -1` (체험 없음)",
    "",
    "## 2. 틀과 이야기 (1분) — `frames` · `story`",
    `- 제안: **${d.frames.length ? `[${d.frames.join(" → ")}]` : `체험 없음 (${d.plain_why_proposal})`}** · 기본 풀이 ${d.plain_kind} — ${d.frame_reason}`,
    `- 이야기: 독자는 **${d.story.who || "(비었다)"}** · ${d.story.from} → ${d.story.to} · 하는 일: ${d.story.do || "(비었다)"}`,
    `- “아!”가 떨어지는 곳: **${d.story.aha || "(비었다)"}** (${d.story.aha_concept || "-"})`,
    ...(d.frames.length > 1 ? [`- 두 틀을 잇는 말: ${d.story.bridge || "(비었다)"}`] : []),
    ...(d.chain.has ? [`- 사슬 (${d.frames.includes("chain") ? "제안" : "재료만"}): ${d.chain.nodes.map((n) => `${n.name} [${n.reach}] ${n.value_gist}`).join(" → ")} → ? (${d.chain.unknown_gist})`] : [`- 사슬 없음 — ${d.chain.why}`]),
    ...(d.seats.has ? [`- 자리 (${d.frames.includes("seats") ? "제안" : "재료만"}): ${d.seats.body} · ${d.seats.sides.map((sd) => `${sd.stance} ${sd.count}`).join(" ↔ ")} — ${d.seats.why}`] : [`- 자리 없음 — ${d.seats.why}`]),
    "- 볼 것: 독자가 **구경**하나 **앉나** · “아!”가 뒤집기 문장의 되풀이가 아니라 다음에도 쓸 개념인가 · 억지 체험이 아닌가",
    "- 고르기: `frames: [\"chain\", \"seats\"]` 가운데 켤 것 (설계가 재료를 낸 것만) · 이야기를 고치려면 `story.note` 에 한 줄 (글 단계가 받는다)",
    "",
    "## 3. 사람 칸 (1분) — `death` · `split` · `sides`",
    `- 사람이 숨진 사건인가: **${d.death_proposal}** — ${d.death_reason}`,
    ...(d.seats.has ? [
      `- 표결의 갈림: **${d.seats.split_proposal}** — ${d.seats.split_reason} (정당 표결이면 자리 금지)`, ...quote(d.seats.record_facts),
      ...d.seats.sides.flatMap((sd) => [`- 쪽 \`${sd.id}\` “${sd.stance}” ${sd.count} — 까닭 **${sd.why}**${sd.who_says ? ` (${sd.who_says})` : ""}: ${sd.why_reason}`, ...quote(sd.why === "in-doc" && sd.why_facts.length ? sd.why_facts : sd.said_facts, 3)]),
      "- 볼 것: `in-doc` 인 쪽 — 그 구절이 정말 **그쪽의** 까닭인가 (회의록의 수량어 “몇몇”을 표결의 쪽과 우리가 이은 것은 아닌가)",
    ] : []),
    "",
    ...(x.prev ? [
      `## 4. 지난 회차 (${x.prev.number}화)에서 이어지나 — 같은 그림 · 오늘의 값`,
      `- 그림을 그대로 받나: **${d.carry.keep ? "받는다" : "바꾼다"}** — ${d.carry.why}`,
      ...d.carry.changes.map((c) => `- 달라진 값 \`${c.where}\`: ${c.before} → **${c.today}** (${c.facts.join(" ")})`),
      ...d.carry.promises.map((pr) => `- 지난 약속 [${pr.status}] ${pr.promise} → ${pr.answer_gist}`),
      `- 그림을 본 독자의 머리: “${one(d.carry.seen_title)}”`,
      "- 볼 것: 지난 화가 독자에게 한 약속에 답하나 · 값이 달라진 자리가 정말 새 문서에서 왔나",
      "",
    ] : []),
    "## 5. 그리지 않을 것 · 쓰지 말 것 — 더할 것이 있으면 `not_drawn_add` · `do_not_write_add`",
    ...d.not_drawn.map((n) => `- (그림) ${n}`), ...d.do_not_write.map((n) => `- (글) ${n}`),
    "",
    "## 6. 설계가 자신 없다고 적은 것",
    ...d.doubts.map((n) => `- ${n}`),
    "",
    "## human.json 에 적을 것 — 고칠 칸만 남긴다",
    "```json",
    JSON.stringify({ after_design: { ok: true, by: "", minutes: 5, flip: { ok: true, note: "" }, frames: d.frames, story: { ok: true, note: "" }, death: d.death_proposal, ...(d.seats.has ? { split: d.seats.split_proposal, sides: Object.fromEntries(d.seats.sides.map((sd) => [sd.id, sd.why])) } : {}), not_drawn_add: [], do_not_write_add: [], note: "" } }, null, 2),
    "```",
    `지금 상태: ${human?.after_design ? (human.after_design.ok === true ? `넘김 (${human.after_design.by})` : "적었지만 ok 가 아니다") : "아직 없다"}`,
  ];
  return L.join("\n") + "\n";
}
export function gate2Sheet(r: ReturnType<typeof build>): string {
  const rv = review(r);
  const d = r.design, ep = r.b.episode as any, en = rv.checks.entail as any;
  const blocked = rv.items.filter((i) => i.kind === "blocked");
  const idOf = new Map([...r.b.where.entries()].map(([id, p]) => [p, id]));
  const fixes = rv.checks.repairs.filter((x0) => x0.action === "fix");
  const L: string[] = [
    `# 게이트 2 — 글 뒤 · 15 ~ 20분 · 「${r.x.series.name}」 ${r.x.ep.number}화 (${r.x.ep.code})`,
    "",
    `내기 전에 본다. 고칠 글은 \`human.json\` 의 \`after_write.edits\` 에 \`{ id, t, why }\` (근거를 바꾸려면 \`src\`), 뺄 줄은 \`drops\`. 다 보면 \`ok: true\`. 고친 것은 \`logs/correction-log.jsonl\` 에도 한 줄.`,
    `글 ${r.wraw.prompt_version} · ${r.wraw.model} · 글 덩이 ${en.texts} (근거 있는 것 ${en.with_src}) · 계약 검증 ${r.v.ok ? "통과" : `**실패 ${r.v.errors.length}**`} · 함의 본 글 ${en.judged} (위험하지 않아 건너뛴 글 ${(en.low_risk_skipped ?? []).length} · 아직 ${en.not_judged.length})`,
    "",
    `## 1. 막힘 ${blocked.length} — 고치거나 뺀다 (하나 2분)`,
    ...(blocked.length ? blocked.flatMap((b0) => [`- \`${idOf.get(b0.where) ?? b0.where}\` **${b0.what}**`, `  - 글: ${one(b0.proposal)}`, `  - 걸린 까닭: ${b0.why}`]) : ["- 없음"]),
    ...(en.not_judged.length ? ["", `**함의를 아직 못 본 글 ${en.not_judged.length}** — \`--entail-call\` 을 한 번 더, 또는 직접 읽는다: ${en.not_judged.join(" · ")}`] : []),
    "",
    `## 2. 고치기 단계가 바꾼 글 ${fixes.length} — 글이 바뀐 것만 읽는다 (근거만 더한 것은 함의가 다시 봤다)`,
    ...fixes.filter((f) => f.before !== f.after).map((f) => `- \`${f.id}\`\n  - 앞: ${one(f.before ?? "")}\n  - 뒤: ${one(f.after ?? "")}\n  - ${f.why}`),
    "",
    "## 3. 그림이 틀리게 가르치지 않나 (4분) — 검사가 못 본다",
    ...(ep.solve.lab ? (ep.solve.lab.frames as any[]).flatMap((f) => f.kind === "chain"
      ? [`- 사슬 “${f.action}”: ${f.nodes.map((n: any) => `${n.name} [${n.reach}] ${(n.after ?? n.still).t}`).join(" → ")} → ${f.unknown}`, `  - 누른 뒤: ${one(f.caption.after.t)}`]
      : [`- 자리 ${f.ground.body}: ${f.sides.map((sd: any) => `${sd.group.t} (${sd.why})`).join(" ↔ ")}`, ...f.sides.map((sd: any) => `  - ${sd.choose}: ${one(sd.said.t)}`)]) : ["- 체험 없음 (기본 풀이)"]),
    ...d.not_drawn.map((n) => `- 넘지 말아야 할 선: ${n}`),
    ...(rv as any).carry?.length ? ["- **지난 값 ↔ 오늘 값** (화면에는 오늘 값만 나간다):", ...(rv as any).carry.map((c: any) => `  - ${c.where} “${c.name}”: ${c.before} → ${c.today}`)] : [],
    "- 볼 것: 빠진 고리 · 문서가 말하지 않은 인과 · 화면의 “멈춤”이 까닭으로 읽히지 않나 · not-yet 문장이 정말 그 뜻인가",
    "",
    "## 4. 맛 (5분) — 폰에서 통독",
    `- 제목: “${one(ep.scenes.cover.title)}” · 오늘의 한 줄: “${one(ep.scenes.keep.line)}”`,
    `- 체험의 머리: “${one(ep.solve.lab?.title ?? "-")}”${ep.solve.lab?.seen_title ? ` · 그림을 본 독자: “${one(ep.solve.lab.seen_title)}”` : ""}`,
    ...tasteChecks(r).map((t) => `- **기계가 센 것** — ${t}`),
    "- 볼 것: 수수께끼가 걸리나 · 체험에서 독자가 앉나 · 같은 문장이 되풀이되나 · 맺음이 “없어요”로 끝나나",
    "",
    "## 5. 그 밖",
    ...rv.items.filter((i) => i.kind === "must" && (i.where === "/map" || i.where.startsWith("/tools/"))).map((i) => `- ${i.what}: ${i.proposal}`),
    ...r.b.notes.map((n) => `- 짓기 메모: ${n}`),
    "",
    "## human.json 에 적을 것",
    "```json",
    JSON.stringify({ after_write: { ok: false, by: "", minutes: 0, blocked_seen: false, picture_ok: false, read_ok: false, edits: [{ id: "", t: "", why: "" }], drops: [], note: "" } }, null, 2),
    "```",
    `지금 상태: 낼 수 있나 = **${(rv as any).publishable ?? false}** (계약 ${r.v.ok ? "통과" : "실패"} · 막힘 ${blocked.length} · 게이트 2 ${r.human?.after_write?.ok === true ? "넘김" : "아직"})`,
  ];
  return L.join("\n") + "\n";
}
/** 맛을 기계가 세는 것 — 글 프롬프트 /2 의 규칙이 지켜졌나 (세기만 한다 · 막지 않는다) */
export function tasteChecks(r: { texts: { id: string; wt: WT }[] }): string[] {
  const out: string[] = [];
  const sent = (t: string) => t.replace(/\*\*/g, "").split(/(?<=[.?!])["”’']?\s+(?=\S)/u).filter((y) => y.trim().length > 1);
  const long = r.texts.filter((t) => sent(t.wt.t).length > 3);
  if (long.length) out.push(`세 문장을 넘는 덩이 ${long.length}: ${long.map((t) => `${t.id} (${sent(t.wt.t).length})`).join(" · ")}`);
  // 되풀이 — 열여덟 글자 (빈칸 빼고)가 글자 그대로 같은 토막이 세 자리 이상에 있다 (범위 문장이 머리만 바뀌어 옮겨 다닌다 — P-E1 ③)
  const N = 18;
  const at = new Map<string, Set<string>>();
  for (const t of r.texts) { const k = t.wt.t.replace(/[\s*]/g, ""); for (let i = 0; i + N <= k.length; i++) { const g = k.slice(i, i + N); const st = at.get(g) ?? new Set<string>(); st.add(t.id); at.set(g, st); } }
  const rep: { g: string; ids: Set<string> }[] = [];
  for (const [g, ids] of [...at.entries()].filter(([, ids]) => ids.size >= 3).sort((p, q) => q[1].size - p[1].size)) if (!rep.some((x) => [...ids].every((i) => x.ids.has(i)))) rep.push({ g, ids });
  if (rep.length) out.push(`같은 문장이 세 자리 이상에: ${rep.map((x) => `“…${x.g}…” × ${x.ids.size}`).join(" · ")}`);
  const dated = r.texts.filter((t) => DATED.test(t.wt.t));
  if (dated.length) out.push(`발행일에 걸린 말 ${dated.length}: ${dated.map((t) => t.id).join(" · ")}`);
  const noSay = r.texts.filter((t) => /^(aha\.verdict|entry\.flip\.note)$/.test(t.id) && /없어요\.?$/.test(t.wt.t.trim()));
  if (noSay.length) out.push(`맺음이 “없어요”로 끝난다: ${noSay.map((t) => t.id).join(" · ")}`);
  return out;
}

// ── 모델 부르기 ──────────────────────────────────────────────────────────────────────────────────────
const callReq = (x: L, label: string, q: Req & { version: string }, e: number): CallReq => ({ event: x.code, source_label: `${x.v1 ? "" : `${x.ep.code}:`}${label}`, model: q.model, effort: q.effort, system: q.system, user: q.user, schema: q.schema, max_tokens: q.max_tokens, prompt_version: q.version, text_sha256: sha256(q.user), est_usd: e });
const mayCall = (x: L) => { if (x.ep.frozen) throw new Error(`회차 ${x.ep.code} 는 얼렸다 — 모델을 부르지 않는다 (${x.ep.frozen})`); };

async function callDesign(epCode: string, mode: Mode, budget: Budget, effort: Effort) {
  const x = load(epCode);
  mayCall(x);
  const gp = graphProblem(x, readHuman(epCode));
  if (gp) throw new Error(`멈춤 — ${gp}`);
  const q = designReq(x, effort);
  const tok = (await countTokens(q)) ?? Math.round(q.user.length / 1.6);
  const e = est(q.model, tok, effort === "high" ? 32000 : 20000);
  console.log(`episode ${epCode} --design-call — ${q.version} · ${q.model} · ${q.effort} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(x, "EP-DESIGN", q, e);
  const [r] = await callMany([a], { mode, budget });
  if (r!.skipped) throw new Error(`멈춤 — ${r!.error}`);
  saveRaw(x, "design", `design.${sha256(q.user).slice(0, 12)}`, a, r!);
}
async function callWrite(epCode: string, models: string[], mode: Mode, budget: Budget) {
  const x = load(epCode);
  mayCall(x);
  const g1 = gate1Problem(x, readHuman(epCode));
  if (g1) throw new Error(`멈춤 — ${g1}`);
  const bad = designChecks(x, approvedDesign(x).design).filter((c) => c.level === "막힘");
  if (bad.length) throw new Error(`멈춤 — 설계에 막힘이 있다: ${bad.map((c) => c.what).join(" / ")}`);
  const reqs: CallReq[] = [];
  for (const m of models) {
    const q = writeReq(x, m);
    const tok = (await countTokens(q)) ?? Math.round((q.user.length + q.system.length) / 1.6);
    const e = est(m, tok, 30000);
    console.log(`episode ${epCode} --write-call — ${q.version} · ${m} · ${q.effort} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"})`);
    reqs.push(callReq(x, `EP-WRITE(${m})`, q, e));
  }
  console.log(`  Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const rs = await callMany(reqs, { mode, budget, conc: 2 });
  rs.forEach((r, i) => { if (r.skipped) console.log(`  멈춤 — ${models[i]}: ${r.error}`); else saveRaw(x, "write", `write.${models[i]}.${sha256(reqs[i]!.user).slice(0, 12)}`, reqs[i]!, r); });
}
/** 함의 한 부르기의 값 어림 — 앞부분 (system)은 캐시에서 읽힌다. 뒤 (글 · 근거 · 둘레)는 요청마다 글자 수로 센다 (P-E1 PE1-r: 고친 글은 근거가 늘어 더 크다) */
const entailEst = (q: Req) => (Math.round(q.system.length * 0.75) * PRICE[q.model]!.cache_read + Math.round(q.user.length * 0.6) * PRICE[q.model]!.in + 650 * PRICE[q.model]!.out) / 1e6;
async function callEntail(epCode: string, writer: string, mode: Mode, budget: Budget) {
  const r = build(epCode, writer);
  mayCall(r.x);
  const stored = readEntail(epCode);
  const want = (t: { id: string; wt: WT }) => (r.x.v1 ? needsEntail(t.wt) : needsEntail2(t.wt, r.touched.has(t.id)));
  const todo = r.texts.filter(want).map((t) => ({ t, q: entailReq(r.x, t.id, t.wt) })).filter((y): y is { t: { id: string; wt: WT }; q: Req & { version: string } } => !!y.q && !judgementOf(stored, y.q));
  // 상한에 걸리면 뒤의 것부터 못 보낸다 — 고친 글 · 풀이 칸 (입구 · 체험 · 기본 풀이) · 풀이 장면 · 사건 장면을 먼저 본다
  const rank = (id: string) => (r.touched.has(id) ? -1 : /^(entry|lab|plain)\./.test(id) ? 0 : id.startsWith("aha.") ? 1 : id.startsWith("event.") ? 2 : 3);
  todo.sort((a, b) => rank(a.t.id) - rank(b.t.id));
  if (!todo.length) return void console.log(`episode ${epCode} --entail-call — 볼 글이 없다 (저장된 판정이 전부 지금 글과 같다)`);
  const total = todo.reduce((a, y) => a + entailEst(y.q), 0);
  console.log(`episode ${epCode} --entail-call — ${todo[0]!.q.version} · ${MODELS.entail.model} · ${MODELS.entail.effort} · 글 ${todo.length} · 넉넉한 추정 $${(total * (mode === "batch" ? 0.5 : 1)).toFixed(2)} (${mode === "batch" ? "배치" : "즉시"}) · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const reqs = todo.map((y) => callReq(r.x, `EP-ENTAIL(${y.t.id})`, y.q, entailEst(y.q)));
  const rs = await callMany(reqs, { mode, budget, conc: 4 });
  mkdirSync(rawDir(epCode), { recursive: true });
  let cost = 0, n = 0;
  rs.forEach((res, i) => {
    if (res.skipped) return;
    const line: EntailLine = { id: todo[i]!.t.id, text_sha256: sha256(todo[i]!.t.wt.t), request_sha256: res.request_sha256, model: res.model, model_requested: MODELS.entail.model, effort: MODELS.entail.effort, prompt_version: todo[i]!.q.version, stop_reason: res.stop_reason, usage: res.usage, duration_ms: res.duration_ms, cost_usd: Number(res.cost_usd.toFixed(6)), called_at: new Date().toISOString(), ok: res.ok, error: res.error, output: res.text, ...(res.mode === "batch" ? { mode: res.mode, batch_id: res.batch_id! } : {}) };
    appendFileSync(entailPath(epCode), JSON.stringify(line) + "\n");
    cost += res.cost_usd; n++;
  });
  console.log(`  받은 판정 ${n} / ${todo.length} · $${cost.toFixed(3)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)}`);
}
async function callRepair(epCode: string, mode: Mode, budget: Budget) {
  const r = build(epCode, MODELS.write.model);
  mayCall(r.x);
  const byPath = new Map([...r.b.where.entries()].map(([id, p]) => [p, id]));
  const why = new Map<string, string[]>();
  const push = (id: string, s: string) => why.set(id, [...(why.get(id) ?? []), s]);
  const bare: string[] = [];
  for (const j of r.judged) if (j.judgement && BAD.has(j.judgement.verdict)) push(j.id, `함의 (${j.judgement.verdict}): ${j.judgement.issues.map((i) => `“${i.part}” — ${i.kind} · ${i.where} · ${i.why}`).join(" / ")}`);
  for (const e of r.v.errors) {
    const id = byPath.get(e.path);
    if (id && e.code === "NUMBER_UNGROUNDED") push(id, `숫자: ${e.message}`);
    else bare.push(`${e.code} ${e.path}: ${e.message}`);
  }
  if (!why.size) return void console.log(`episode ${epCode} --repair-call — 고칠 글이 없다${bare.length ? ` (글 덩이가 아닌 문제 ${bare.length} — 사람이 본다)` : ""}`);
  const srcByLabel = new Map([...r.x.srcs.values()].map((s) => [s.label, s]));
  const byId = new Map(r.texts.map((t) => [t.id, t.wt]));
  const blocks = [...why.entries()].map(([id, ws]) => {
    const wt = byId.get(id)!;
    const ev = wt.src.flatMap((l) => (r.x.passages.get(l) ?? []).map((p) => `  ${l} · ${srcByLabel.get(p.doc)!.title} (${String(srcByLabel.get(p.doc)!.published_at).slice(0, 10)}) — 구절: ${p.quote.replace(/\s+/gu, " ")}\n     둘레: ${widen(r.x.texts.get(p.source_id)!, p.span_start, p.span_end)}`));
    return [`## ${id}`, `자리: ${r.b.where.get(id) ?? id}${DROPPABLE.test(id) ? " (뺄 수 있는 줄)" : " (필수 칸 — 뺄 수 없다)"}`, `지금 글: ${wt.t}`, `꼬리표: ${wt.voice}`, `근거 label: ${wt.src.join(" ") || "없음"}`, `calc: ${wt.calc.map((c) => `${c.n} = ${c.how}`).join(" · ") || "없음"}`, "근거:", ...(ev.length ? ev : ["  (없음)"]), "걸린 까닭:", ...ws.map((s) => `  - ${s}`)].join("\n");
  });
  // 근거를 더 붙일 수 있게 — 설계 단계가 받은 사실 가운데 구절을 실을 수 있는 것 (글은 짧게)
  const avail = selectFacts(r.x).filter((l) => r.x.passages.has(l) && !r.x.politicsOnly.has(l)).map((l) => `${l} | ${(r.x.docsOfFact.get(l) ?? []).join("+")} | ${r.x.byLabel.get(l)!.event_at ?? "-"} | ${clip(r.x.fixes.get(l) ?? r.x.byLabel.get(l)!.claim_text, 110)}`);
  const user = `${blocks.join("\n\n")}\n\n## 쓸 수 있는 사실 (label | 문서 | 일어난 날 | 글)\n${avail.join("\n")}\n\n위 ${blocks.length} 덩이를 고쳐라.`;
  const q = { model: MODELS.repair.model, effort: MODELS.repair.effort, system: REPAIR_SYSTEM, user, schema: REPAIR_SCHEMA, max_tokens: MODELS.repair.max_tokens, version: r.x.versions.repair };
  const tok = (await countTokens(q)) ?? Math.round(user.length / 1.6);
  const e = est(q.model, tok, 6000);
  console.log(`episode ${epCode} --repair-call — ${q.version} · ${q.model} · ${q.effort} · 덩이 ${blocks.length} · 입력 ${tok} 토큰 · 넉넉한 추정 $${(e * (mode === "batch" ? 0.5 : 1)).toFixed(2)} · Step "${budget.step}" $${spentOf(budget.step).toFixed(3)} / $${budget.budget}`);
  const a = callReq(r.x, `EP-REPAIR(${blocks.length})`, q, e);
  const [res] = await callMany([a], { mode, budget });
  if (res!.skipped) throw new Error(`멈춤 — ${res!.error}`);
  saveRaw(r.x, "repair", `repair.${String(readRaws(epCode, "repair").length + 1).padStart(2, "0")}.${sha256(user).slice(0, 12)}`, a, res!);
}

// ── 함의의 정답 묶음 (data/episode-entail/gold.json — P-E1 의 걸림 17 이 씨앗 · logs/pipeline/P-E2.md ⑤) ────────────────
export type GoldCase = { id: string; origin: string; t: string; voice: WT["voice"]; calc: WT["calc"]; src: string[]; expect: EVerdict; accept?: EVerdict[]; borderline?: boolean; parts?: { part: string; where: string }[]; why: string };
export type Gold = { _what: string; load_as: string; graph_sha256: string; cases: GoldCase[] };
export const GOLD_PATH = R("packages/pipeline/data/episode-entail/gold.json");
const goldRawPath = () => R("packages/pipeline/data/episode-entail/raw", `gold.${CURRENT.entail.replace("/", "-")}.${MODELS.entail.model}.${MODELS.entail.effort}.jsonl`);
/** 판정을 정답과 댄다 — 맞음 (expect 또는 accept) · 갈래만 다름 (EXCEEDS ↔ UNDER_SOURCED) · 잘못 막음 · 놓침. borderline 은 세지 않는다 */
export function scoreGold(cases: GoldCase[], got: Map<string, EVerdict>) {
  const blocks = (v: EVerdict) => BAD.has(v);
  const rows = cases.filter((c) => got.has(c.id)).map((c) => {
    const v = got.get(c.id)!;
    const ok = v === c.expect || (c.accept ?? []).includes(v);
    const kind = ok ? "맞음" : blocks(v) && blocks(c.expect) ? "갈래만 다름" : blocks(v) ? "잘못 막음" : blocks(c.expect) ? "놓침" : "다름";
    return { id: c.id, expect: c.expect, got: v, kind, borderline: !!c.borderline };
  });
  const scored = rows.filter((r0) => !r0.borderline);
  const n = (k: string) => scored.filter((r0) => r0.kind === k).length;
  return { rows, total: scored.length, 맞음: n("맞음"), "갈래만 다름": n("갈래만 다름"), "잘못 막음": n("잘못 막음"), 놓침: n("놓침"), 다름: n("다름") };
}
async function entailGold(argv: string[]) {
  const gold = readJson<Gold>(GOLD_PATH);
  const x = load(gold.load_as);
  const reqs = gold.cases.map((c) => ({ c, q: entailReq(x, c.id, { t: c.t, src: c.src, calc: c.calc, voice: c.voice }) })).filter((y): y is { c: GoldCase; q: Req & { version: string } } => !!y.q);
  const total = reqs.reduce((a, y) => a + entailEst(y.q), 0);
  const stored: EntailLine[] = existsSync(goldRawPath()) ? readFileSync(goldRawPath(), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  console.log(`episode --entail-gold — ${CURRENT.entail} · ${MODELS.entail.model} · ${MODELS.entail.effort} · 예 ${reqs.length} (정답: ${["ENTAILED", "NEEDS_CONTEXT", "UNDER_SOURCED", "EXCEEDS"].map((v) => `${v} ${gold.cases.filter((c) => c.expect === v).length}`).join(" · ")} · 경계 ${gold.cases.filter((c) => c.borderline).length}) · 첫 요청 ${await countTokens(reqs[0]!.q)} 토큰 · 넉넉한 추정 $${(total * 0.5).toFixed(2)} (배치)${x.graph_sha256 === gold.graph_sha256 ? "" : " · **그래프가 묶음을 만든 때와 다르다** (근거 구절이 바뀌었을 수 있다)"}`);
  if (argv.includes("--call")) {
    const budget = needBudget(argv);
    const todo = reqs.filter((y) => !judgementOf(stored, y.q));
    const rs = await callMany(todo.map((y) => callReq(x, `EP-ENTAIL-GOLD(${y.c.id})`, y.q, entailEst(y.q))), { mode: modeArg(argv), budget, conc: 4 });
    mkdirSync(dirname(goldRawPath()), { recursive: true });
    rs.forEach((res, i) => { if (!res.skipped) { const line: EntailLine = { id: todo[i]!.c.id, text_sha256: sha256(todo[i]!.c.t), request_sha256: res.request_sha256, model: res.model, model_requested: MODELS.entail.model, effort: MODELS.entail.effort, prompt_version: CURRENT.entail, stop_reason: res.stop_reason, usage: res.usage, duration_ms: res.duration_ms, cost_usd: Number(res.cost_usd.toFixed(6)), called_at: new Date().toISOString(), ok: res.ok, error: res.error, output: res.text, ...(res.mode === "batch" ? { mode: res.mode, batch_id: res.batch_id! } : {}) }; appendFileSync(goldRawPath(), JSON.stringify(line) + "\n"); stored.push(line); } });
  }
  const got = new Map(reqs.map((y) => [y.c.id, judgementOf(stored, y.q)?.verdict] as const).filter((e): e is [string, EVerdict] => !!e[1]));
  if (!got.size) return void console.log("  저장된 판정 없음 — 재려면 --call --step <Step> --budget <달러>");
  const sc = scoreGold(gold.cases, got);
  console.log(`  판정 ${got.size} · 맞음 ${sc.맞음} / ${sc.total} · 갈래만 다름 ${sc["갈래만 다름"]} · 잘못 막음 ${sc["잘못 막음"]} · 놓침 ${sc.놓침}`);
  for (const r0 of sc.rows.filter((r1) => r1.kind !== "맞음")) console.log(`    ${r0.kind}${r0.borderline ? " (경계)" : ""} ${r0.id}: 정답 ${r0.expect} · 판정 ${r0.got}`);
}

async function count(epCode: string, like: string | undefined, effort: Effort) {
  const x = load(epCode, { like });
  const dq = designReq(x, effort);
  const facts = selectFacts(x);
  const dt = (await countTokens(dq)) ?? Math.round(dq.user.length / 1.6);
  console.log(`episode ${epCode} --count — ${x.ep.number}화 · 사건 ${x.code} · 판 ${x.versions.design}${like ? ` · 새 문서 대신 ${like} 의 사실을 얹었다` : ""}`);
  console.log(`  그래프 sha256 ${x.graph_sha256} (사람이 본 뒤 human.json graph_seen.graph_sha256 에 적는 값) · 사람이 고친 사실 글 ${x.fixes.size}${x.ep.new_documents?.length ? ` · 새 문서 ${x.ep.new_documents.join(" · ")}` : ""}`);
  const gp = like ? null : graphProblem(x, readHuman(epCode));
  if (gp) console.log(`  설계를 부르기 전에: ${gp}`);
  console.log(`  설계: 고른 사실 ${facts.length} / ${x.graph.facts.length} (구절 있는 것 ${facts.filter((l) => x.passages.has(l)).length} · 새 문서 ${facts.filter((l) => x.isNew(l)).length}) · system ${dq.system.length}자 · user ${dq.user.length}자${x.prev ? ` (지난 회차 ${previousBlock(x.prev).length}자)` : ""} → 입력 ${dt} 토큰 → 입력 값 $${(est(dq.model, dt, 0) * 0.5).toFixed(3)} (배치)`);
  if (!readRaws(epCode, "design").some((r) => r.prompt_version === x.versions.design)) return void console.log("  글 · 함의: 설계 출력이 있어야 센다");
  const wq = writeReq(x, MODELS.write.model);
  const wt = (await countTokens(wq)) ?? 0;
  console.log(`  글 (${MODELS.write.model}): system ${wq.system.length}자 · user ${wq.user.length}자 → 입력 ${wt} 토큰 → 입력 값 $${(est(wq.model, wt, 0) * 0.5).toFixed(3)} (배치)`);
  if (!latestWrite(x, MODELS.write.model)) return void console.log("  함의: 글 출력이 있어야 센다");
  const r = build(epCode, MODELS.write.model);
  const all = r.texts.filter((t) => needsEntail(t.wt)), risky = r.texts.filter((t) => needsEntail2(t.wt, r.touched.has(t.id)));
  const cost = (ts: typeof all) => ts.reduce((a, t) => { const q = entailReq(x, t.id, t.wt); return a + (q ? entailEst(q) : 0); }, 0) * 0.5;
  console.log(`  함의: 근거 있는 글 ${all.length} → 위험한 글 ${risky.length} · 어림 $${cost(all).toFixed(2)} → $${cost(risky).toFixed(2)} (배치)`);
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = ["--step", "--budget", "--models", "--writer", "--like", "--effort"];
  const code = argv.find((a, i) => !a.startsWith("--") && !flags.includes(argv[i - 1] ?? ""));
  const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const effort = (opt("--effort") ?? MODELS.design.effort) as Effort;
  if (!["low", "medium", "high"].includes(effort)) throw new Error(`--effort ${effort}`);
  if (argv.includes("--entail-gold")) return entailGold(argv);
  if (!code) throw new Error("회차 code (data/series/*.json 의 episodes 의 키)");
  const writer = writerOf(argv);
  if (argv.includes("--count")) return count(code, opt("--like"), effort);
  if (argv.includes("--probe")) {
    // 출력 모양 (json_schema)이 받아들여지는지만 본다 — 문법이 너무 크면 400 (값 0). 짧은 요청 · 즉시 · 잘려도 된다
    const budget = needBudget(argv);
    const x = load(code);
    const reqs = ([["design", DESIGN_SCHEMA], ["write", WRITE_SCHEMA], ["repair", REPAIR_SCHEMA], ["entail", ENTAIL2_SCHEMA]] as const).map(([k, schema]) =>
      callReq(x, `EP-PROBE(${k})`, { model: "claude-opus-5-5", effort: "low", system: "출력 모양 시험이다. 모든 칸을 가장 짧은 값으로 채운다.", user: "시작.", schema, max_tokens: 200, version: "episode-probe/1" }, 0.02));
    const rs = await callMany(reqs, { mode: "now", budget, conc: 3 });
    rs.forEach((r, i) => console.log(`  ${reqs[i]!.source_label}: ${r.error ?? "ok"} · $${r.cost_usd.toFixed(4)}`));
    return;
  }
  if (argv.includes("--design-call")) return callDesign(code, modeArg(argv), needBudget(argv), effort);
  if (argv.includes("--write-call")) return callWrite(code, argv.includes("--models") ? argv[argv.indexOf("--models") + 1]!.split(",") : [MODELS.write.model], modeArg(argv), needBudget(argv));
  if (argv.includes("--entail-call")) return callEntail(code, writer, modeArg(argv), needBudget(argv));
  if (argv.includes("--repair-call")) return callRepair(code, modeArg(argv), needBudget(argv));
  if (argv.includes("--sheet")) {
    const x = load(code);
    if (x.v1) console.log(`episode ${code} --sheet — 판 /1 의 회차다 (설계에 이야기 칸이 없다) · gate1.md 는 내지 않는다`);
    else {
      const g1 = gate1Sheet(x);
      writeFileSync(join(outDir(code), "gate1.md"), g1);
      console.log(`episode ${code} --sheet — gate1.md (${g1.split("\n").length} 줄)`);
      for (const c of designChecks(x, latestDesign(x).design, latestDesign(x).problems)) console.log(`  ${c.level} — ${c.what}`);
    }
    if (latestWrite(x, writer)) { const g2 = gate2Sheet(build(code, writer)); writeFileSync(join(outDir(code), "gate2.md"), g2); console.log(`  gate2.md (${g2.split("\n").length} 줄)`); }
    else console.log("  gate2.md 는 글 출력이 있어야 낸다");
    return;
  }
  const x0 = load(code);
  if (x0.ep.frozen && readRaws(code, "design").some((r) => r.graph_sha256 !== x0.graph_sha256)) {
    // 얼린 회차는 그것을 지은 그래프에서만 다시 지을 수 있다 — 그래프가 바뀌면 (새 문서 · 다시 돌리기) 파일을 그대로 둔다
    return void console.log(`episode ${code}${argv.includes("--check") ? " --check" : ""} — 얼린 회차다 · 그것을 지은 그래프가 아니다 (지금 ${x0.graph_sha256.slice(0, 12)}…) — 다시 짓지 않고 파일을 그대로 둔다`);
  }
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
