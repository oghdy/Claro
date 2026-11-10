// P-3 · BLS — 공식 Public Data API v1 (D41 도윤 선택: 등록 · 키 없이). 명령 하나:
//
//     pnpm --filter @claro/pipeline bls FOMC-20261028            # 캐시가 없을 때만 API 를 한 번 부른다 → 응답을 Source · SourceDocument 로 쓴다
//     pnpm --filter @claro/pipeline bls FOMC-20261028 --refetch  # 다시 부른다 (하루 25회 안 — 부른 횟수를 캐시에 센다)
//
// 지키는 것 (D40 · D41)
//   - 정직한 User-Agent 하나 ("Claro pipeline") — 개인 정보 · 연락처를 넣지 않는다
//   - v1 이용 한도: 하루 25 질의 · 질의당 25 시리즈 · 10년. 부른 횟수를 .cache/bls/calls.json 에 날짜별로 세고 넘으면 부르지 않는다
//   - 응답 본문을 글자 그대로 SourceDocument.text 로 둔다 (JSON 을 고쳐 쓰지 않는다) — 해시 · 가져온 때 · 주소를 기록
//   - **API 값은 받은 날의 판이다.** 첫 발표 값이 아니라 수정된 값을 줄 수 있다 (D28 D-1). 그래서 Source.published_at = 받은 날,
//     사실은 VOLATILE · as_of = 받은 날. "처음 공개된 날"은 이 응답이 증명하지 못한다
//
// 시리즈의 뜻: v1 응답은 시리즈 이름을 주지 않는다 (카탈로그는 v2 — 등록이 필요). 아래 SERIES 의 뜻은 BLS 시리즈 ID 의 공지된 형식에서
// 적은 것이고, **이 응답 안에서 대조되지 않는다** (P-3 _open). 사실의 글에 시리즈 ID 를 그대로 남긴다.
//
// 사실 만들기: 모델을 부르지 않는다. 응답이 이미 구조화된 수치라 코드가 뽑는다 (결정적). 시리즈마다 정해진 달의 값 하나 = 사실 하나.
// 구절 = 그 값의 JSON 조각 글자 그대로 · section = seriesID (같은 조각이 다른 시리즈에도 있을 수 있어 시리즈 블록 안에서 찾는다).
// 변화율 · 증감은 사실로 만들지 않는다 — 원문에 없는 계산이다. 계산은 bls-rates.ts 가 하고 결과는 계약의 "계산된 수"(ComputedNumber — W-4 · D48 W3-a)다.
// 계산된 수의 입력은 그래프의 사실이어야 하므로, 변화율의 기준 달(전월 · 1년 전) 값도 사실로 만든다 (factMonths — MEASURES · RATE_MONTHS 에서 정해진다).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { sha256, sourceDocument } from "./extract.ts";
import { cpLength } from "./match.ts";
import { registryRow } from "./rights.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const BLS_UA = "ClaroPipeline/0.1 (Claro pipeline)";
export const BLS_API = "https://api.bls.gov/publicAPI/v1/timeseries/data/";
// SourceDocument.extractor — 응답 본문을 글자 그대로 둔다 (JSON 을 고쳐 쓰지 않는다). 뽑는 일이 없다
export const BLS_EXTRACTOR = "bls-raw/1 (API 응답 본문 글자 그대로 — 뽑지 않음)";
const DAILY_LIMIT = 25;

// 시리즈 — 9월 브리프의 슬롯(고용·성장 · 실제 물가 수치 · 외부 충격)과 9월 골든이 쓴 수치(F30 F39 F40 F41 F48)를 보고 골랐다
export const SERIES: { id: string; ko: string; unit: string; slot: string }[] = [
  { id: "CES0000000001", ko: "비농업 취업자 수 (CES · 계절조정)", unit: "천 명", slot: "고용·성장" },
  { id: "LNS14000000", ko: "실업률 (CPS · 계절조정)", unit: "%", slot: "고용·성장" },
  { id: "LNS11300000", ko: "경제활동참가율 (CPS · 계절조정)", unit: "%", slot: "고용·성장" },
  { id: "LNS13023653", ko: "일시해고 실업자 수 (CPS · 계절조정)", unit: "천 명", slot: "고용·성장" },
  { id: "CUSR0000SA0", ko: "CPI-U 전체 지수 (계절조정)", unit: "지수 1982-84=100", slot: "실제 물가 수치" },
  { id: "CUUR0000SA0", ko: "CPI-U 전체 지수 (계절조정 안 함)", unit: "지수 1982-84=100", slot: "실제 물가 수치" },
  { id: "CUSR0000SA0L1E", ko: "CPI-U 식품·에너지 제외 지수 (계절조정)", unit: "지수 1982-84=100", slot: "실제 물가 수치" },
  { id: "CUUR0000SA0L1E", ko: "CPI-U 식품·에너지 제외 지수 (계절조정 안 함)", unit: "지수 1982-84=100", slot: "실제 물가 수치" },
  { id: "CUSR0000SA0E", ko: "CPI-U 에너지 지수 (계절조정)", unit: "지수 1982-84=100", slot: "실제 물가 수치" },
  { id: "WPSFD4", ko: "PPI 최종수요 지수 (계절조정)", unit: "지수 2009-11=100", slot: "실제 물가 수치" },
  { id: "WPUFD4", ko: "PPI 최종수요 지수 (계절조정 안 함)", unit: "지수 2009-11=100", slot: "실제 물가 수치" },
];

// 사건마다 어느 달의 값을 사실로 만드나 — 회의 전에 첫 발표가 나온 마지막 달(9월)과 그 앞 달 · 12개월 전 (변화를 사람이 볼 수 있게)
export const EVENT_MONTHS: Record<string, { year: string; period: string }[]> = {
  "FOMC-20261028": [
    { year: "2026", period: "M09" },
    { year: "2026", period: "M08" },
    { year: "2025", period: "M09" },
  ],
};

// ── 변화율 측정 (W-3 · bls-rates.ts 가 계산한다) — 기준 달의 사실을 여기서 만들어야 해서 이 파일에 둔다 ─────────────
export type Op = "pct_change" | "level_change";
export type Measure = { key: string; ko: string; series: string; op: Op; lag: 1 | 12; unit: "%" | "천 명"; basis: string };

// BLS 보도자료의 방식 — 시리즈 ID 의 뜻은 SERIES (응답 안에서 대조되지 않음 — P3-g (1))
export const MEASURES: Measure[] = [
  { key: "CPI_ALL_1M", ko: "CPI-U 전체 · 전월 대비", series: "CUSR0000SA0", op: "pct_change", lag: 1, unit: "%", basis: "계절조정 지수" },
  { key: "CPI_ALL_12M", ko: "CPI-U 전체 · 1년 전 대비", series: "CUUR0000SA0", op: "pct_change", lag: 12, unit: "%", basis: "계절조정 안 한 지수" },
  { key: "CPI_CORE_1M", ko: "CPI-U 식품·에너지 제외 · 전월 대비", series: "CUSR0000SA0L1E", op: "pct_change", lag: 1, unit: "%", basis: "계절조정 지수" },
  { key: "CPI_CORE_12M", ko: "CPI-U 식품·에너지 제외 · 1년 전 대비", series: "CUUR0000SA0L1E", op: "pct_change", lag: 12, unit: "%", basis: "계절조정 안 한 지수" },
  { key: "CPI_ENERGY_1M", ko: "CPI-U 에너지 · 전월 대비", series: "CUSR0000SA0E", op: "pct_change", lag: 1, unit: "%", basis: "계절조정 지수" },
  { key: "PPI_FD_1M", ko: "PPI 최종수요 · 전월 대비", series: "WPSFD4", op: "pct_change", lag: 1, unit: "%", basis: "계절조정 지수" },
  { key: "PPI_FD_12M", ko: "PPI 최종수요 · 1년 전 대비", series: "WPUFD4", op: "pct_change", lag: 12, unit: "%", basis: "계절조정 안 한 지수" },
  { key: "PAYROLL_1M", ko: "비농업 취업자 수 · 전월 대비 증감", series: "CES0000000001", op: "level_change", lag: 1, unit: "천 명", basis: "계절조정 수준" },
  { key: "TEMP_LAYOFF_1M", ko: "일시해고 실업자 수 · 전월 대비 증감", series: "LNS13023653", op: "level_change", lag: 1, unit: "천 명", basis: "계절조정 수준" },
];
// 계산하지 않는 것 — 에너지 1년 전 대비 (계절조정 안 한 에너지 지수 CUUR0000SA0E 를 받지 않았다) · 실업률 · 경제활동참가율 (이미 율)

export type Month = { year: string; period: string }; // period = "M01" … "M12"
export const monthOf = (ym: string): Month => ({ year: ym.slice(0, 4), period: `M${ym.slice(5, 7)}` });
export const ymOf = (m: Month) => `${m.year}-${m.period.slice(1)}`;
export function back(m: Month, k: number): Month {
  let y = Number(m.year);
  let mo = Number(m.period.slice(1)) - k;
  while (mo <= 0) {
    mo += 12;
    y -= 1;
  }
  while (mo > 12) {
    mo -= 12;
    y += 1;
  }
  return { year: String(y), period: `M${String(mo).padStart(2, "0")}` };
}

// 계산된 수(ComputedNumber)를 만드는 사건의 달 — bls-rates.ts RATE_EVENTS 가 이것을 쓴다 (한 곳)
export const RATE_MONTHS: Record<string, string[]> = { "FOMC-20261028": ["2026-08", "2026-09"] };

/** 시리즈 하나의 사실 달 — EVENT_MONTHS (사람이 볼 달) 다음에, 그 사건의 계산된 수가 입력으로 쓰는 기준 달 (전월 · 1년 전) 가운데 아직 없는 것 (새 것부터).
 *  기준 달 사실이 없으면 계산된 수의 입력이 그래프 사실이 아니게 된다 (DATA_MODEL ComputedNumber — W-4) */
export function factMonths(code: string, series: string): { m: Month; base: boolean }[] {
  const out: { m: Month; base: boolean }[] = (EVENT_MONTHS[code] ?? []).map((m) => ({ m, base: false }));
  const have = new Set(out.map((x) => ymOf(x.m)));
  const extra = new Set<string>();
  for (const ym of RATE_MONTHS[code] ?? []) for (const ms of MEASURES) if (ms.series === series) for (const m of [monthOf(ym), back(monthOf(ym), ms.lag)]) if (!have.has(ymOf(m))) extra.add(ymOf(m));
  for (const ym of [...extra].sort().reverse()) out.push({ m: monthOf(ym), base: true });
  return out;
}

const MONTH_KO: Record<string, string> = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`M${String(i + 1).padStart(2, "0")}`, `${i + 1}월`]));

export const blsDir = (code: string) => join(ROOT, "packages/pipeline/data/events", code, "bls");
const cacheDir = () => {
  const d = join(ROOT, "packages/pipeline/.cache/bls");
  mkdirSync(d, { recursive: true });
  return d;
};

type Calls = Record<string, number>; // 날짜(UTC) → 부른 횟수

/** 시리즈 블록의 글자 범위 — `"seriesID":"<id>"` 부터 다음 seriesID 앞까지 (코드 포인트) */
export function seriesBlocks(text: string): Map<string, [number, number]> {
  const cps = Array.from(text);
  const flat = cps.join("");
  const re = /"seriesID"\s*:\s*"([^"]+)"/g;
  const hits: { id: string; at: number }[] = [];
  for (let m; (m = re.exec(flat)); ) hits.push({ id: m[1]!, at: cpLength(flat.slice(0, m.index)) });
  const out = new Map<string, [number, number]>();
  hits.forEach((h, i) => out.set(h.id, [h.at, i + 1 < hits.length ? hits[i + 1]!.at : cps.length]));
  return out;
}

/** 시리즈 블록 안에서 그 달의 데이터 조각 (원문 글자 그대로) · 위치 · 값. 정확히 한 곳이 아니면 null */
export function findPoint(text: string, block: [number, number], year: string, period: string): { passage: string; start: number; end: number; value: string; latest: boolean; footnotes: string[] } | null {
  const cps = Array.from(text);
  const sub = cps.slice(block[0], block[1]).join("");
  // 데이터 한 칸 = {"year":"2026","period":"M09",...,"value":"…","footnotes":[…]} — "year" 부터 footnotes 배열의 끝까지 (각주 "P preliminary" 가 값의 판을 말한다)
  const re = new RegExp(`\\{"year"\\s*:\\s*"${year}"\\s*,\\s*"period"\\s*:\\s*"${period}"[^{}]*?"value"\\s*:\\s*"([^"]*)"\\s*,\\s*"footnotes"\\s*:\\s*\\[((?:\\{[^{}]*\\}\\s*,?\\s*)*)\\]`, "g");
  const ms = [...sub.matchAll(re)];
  if (ms.length !== 1) return null;
  const m = ms[0]!;
  const start = block[0] + cpLength(sub.slice(0, m.index));
  const passage = m[0].slice(1); // 여는 중괄호는 빼고 "year" 부터
  const footnotes = [...(m[2] ?? "").matchAll(/"text"\s*:\s*"([^"]*)"/g)].map((x) => x[1]!);
  return { passage, start: start + 1, end: start + 1 + cpLength(passage), value: m[1]!, latest: /"latest"\s*:\s*"true"/.test(m[0]), footnotes };
}

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a) => !a.startsWith("--"));
  if (!code || !EVENT_MONTHS[code]) throw new Error(`사건 code 를 준다 — ${Object.keys(EVENT_MONTHS).join(" · ")}`);
  const REFETCH = argv.includes("--refetch");
  const cRaw = join(cacheDir(), `${code}.response.json`);
  const cMeta = join(cacheDir(), `${code}.meta.json`);
  const cCalls = join(cacheDir(), "calls.json");
  const body = { seriesid: SERIES.map((s) => s.id), startyear: "2025", endyear: "2026" };

  // final_url — 리다이렉트 뒤 받은 주소 (W-4 에서 더함). 그 전에 받은 캐시의 meta 에는 없다 → SourceDocument.fetched_url null (기록하지 않았다)
  let text: string, meta: { requested_url: string; final_url?: string; method: string; request_body: unknown; user_agent: string; fetched_at: string; http_status: number; content_type: string | null };
  if (existsSync(cRaw) && existsSync(cMeta) && !REFETCH) {
    text = readFileSync(cRaw, "utf8");
    meta = JSON.parse(readFileSync(cMeta, "utf8"));
  } else {
    const calls: Calls = existsSync(cCalls) ? JSON.parse(readFileSync(cCalls, "utf8")) : {};
    const today = new Date().toISOString().slice(0, 10);
    if ((calls[today] ?? 0) >= DAILY_LIMIT) throw new Error(`오늘(UTC ${today}) BLS API 를 이미 ${calls[today]}번 불렀다 — v1 한도 하루 ${DAILY_LIMIT}. 부르지 않는다`);
    calls[today] = (calls[today] ?? 0) + 1;
    writeFileSync(cCalls, JSON.stringify(calls, null, 2) + "\n"); // 부르기 전에 센다 — 실패해도 한 번이다
    const res = await fetch(BLS_API, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": BLS_UA, accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    text = await res.text();
    meta = { requested_url: BLS_API, final_url: res.url, method: "POST", request_body: body, user_agent: BLS_UA, fetched_at: new Date().toISOString(), http_status: res.status, content_type: res.headers.get("content-type") };
    if (res.status !== 200) throw new Error(`BLS API HTTP ${res.status} — 응답 앞부분: ${text.slice(0, 300)}`);
    writeFileSync(cRaw, text);
    writeFileSync(cMeta, JSON.stringify(meta, null, 2) + "\n");
  }
  const parsed = JSON.parse(text) as { status: string; message: string[]; Results?: { series: { seriesID: string; data: unknown[] }[] } };
  if (parsed.status !== "REQUEST_SUCCEEDED") throw new Error(`BLS API status ${parsed.status} — ${parsed.message?.join(" / ")}`);

  const dir = blsDir(code);
  mkdirSync(dir, { recursive: true });
  const OUT = join(dir, "bls.json");
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
  const h = sha256(text);
  if (prev && prev.fetch.text_sha256 === h) {
    // 같은 응답 — 다시 쓰지 않는다 (같은 명령이 같은 결과)
  }
  const label = "BLS-API-1110";
  const fetchedDay = meta.fetched_at.slice(0, 10);
  const source_id: string = prev?.sources?.[0]?.source_id && prev.fetch.text_sha256 === h ? prev.sources[0].source_id : randomUUID();
  const source = {
    source_id, label, title: `BLS Public Data API v1 — ${SERIES.length} series, 2025–2026 (응답 ${fetchedDay})`, publisher: "bls.gov", url: BLS_API,
    kind: "PRIMARY", language: "en", published_at: fetchedDay, ingested_at: fetchedDay,
    _published_at_basis: "API 응답의 판 — 받은 날. 응답에 공개일이 없다. 값이 처음 공개된 날의 증명이 아니다 (첫 발표는 보도자료 — BLS-09 · CPI-09 · PPI-09 는 못 가져옴)",
  };
  const blocks = seriesBlocks(text);
  const facts: Record<string, unknown>[] = [];
  const fact_sources: Record<string, unknown>[] = [];
  const missing: string[] = [];
  const notes: string[] = [];
  for (const s of SERIES) {
    const b = blocks.get(s.id);
    if (!b) {
      missing.push(`${s.id}: 응답에 시리즈가 없다`);
      continue;
    }
    for (const { m, base } of factMonths(code, s.id)) {
      const p = findPoint(text, b, m.year, m.period);
      if (!p) {
        missing.push(`${s.id} ${m.year}-${m.period}: 값이 정확히 한 곳에 있지 않다`);
        continue;
      }
      const fact_id = prev?.facts?.find((f: { _key: string }) => f._key === `${s.id}|${m.year}|${m.period}`)?.fact_id ?? randomUUID();
      facts.push({
        fact_id, label: `BLS-${s.id}-${m.year}${m.period}`,
        claim_text: `BLS 시리즈 ${s.id} (${s.ko}) — ${m.year}년 ${MONTH_KO[m.period]} 값 ${p.value} (${s.unit})${p.footnotes.length ? ` · 각주 "${p.footnotes.join(", ")}"` : ""}. ${fetchedDay} 에 받은 판`,
        fact_type: "MEASUREMENT", actor: null, volatility: "VOLATILE", as_of: fetchedDay, event_at: `${m.year}-${m.period.slice(1)}`,
        event_id: null, storyline_id: null, storyline_version: null, extraction_model: null, extraction_version: "p3-bls/1 (code)",
        _key: `${s.id}|${m.year}|${m.period}`, _slot: s.slot, _series_meaning_basis: "시리즈 ID 형식 — 이 응답 안에서 대조되지 않음 (P-3 _open)",
        ...(base ? { _rate_base: "변화율의 기준 달 — 계산된 수(bls-rates · ComputedNumber)의 입력이라 사실로 만든다 (W-4)" } : {}),
      });
      fact_sources.push({ fact_id, source_id, section: s.id, span_start: p.start, span_end: p.end, _passage: p.passage });
      if (p.latest) notes.push(`${s.id} ${m.year}-${m.period} 은 이 응답의 최신 값 (latest)`);
    }
    // 회의(10/28) 뒤에 첫 발표가 나온 달이 응답에 있으면 적어 둔다 — 사실로 만들지 않는다
    const after = findPoint(text, b, "2026", "M10");
    if (after) notes.push(`${s.id} 2026-M10 값 ${after.value} 이 응답에 있다 — 회의 뒤 발표 (사실로 만들지 않음)`);
  }
  const out = {
    _what: `${code} 의 BLS 수치 — Public Data API v1 응답 하나 (bls.ts 가 쓴다 — 손으로 고치지 않는다). sources · source_documents · source_registry 는 계약 모양 (DATA_MODEL §1). facts · fact_sources 는 코드가 응답에서 뽑은 것 (모델 없음)`,
    fetch: { ...meta, text_sha256: h, text_length: cpLength(text), position_unit: "코드 포인트 (Unicode scalar)", hash: "sha256(UTF-8(SourceDocument.text))" },
    series: SERIES,
    months: EVENT_MONTHS[code],
    rate_months: RATE_MONTHS[code] ?? [],   // 이 달들의 계산된 수가 쓰는 기준 달도 사실이다 (factMonths · `_rate_base`)
    sources: [source],
    source_documents: [sourceDocument(source_id, text, { text_sha256: h, extractor: BLS_EXTRACTOR, fetch: { fetched_at: meta.fetched_at, final_url: meta.final_url ?? null } })],
    source_registry: [registryRow("bls.gov", fetchedDay, "BLS Public Data API v1 — 등록 · 키 없이 POST (D41 도윤 선택). 정직한 User-Agent · 하루 25회 안")],
    facts: facts.map((f) => ({ ...f, event_id: "__EVENT__" })),
    fact_sources,
    missing,
    notes,
  };
  // event_id 는 사건 store.json 에서
  const st = JSON.parse(readFileSync(join(ROOT, "packages/pipeline/data/events", code, "store.json"), "utf8"));
  const eventId = st.events[0].event_id as string;
  out.facts = out.facts.map((f) => ({ ...f, event_id: eventId }));
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`bls ${code} — 응답 ${cpLength(text)}자 sha256 ${h.slice(0, 12)} · 받은 때 ${meta.fetched_at} · 시리즈 ${blocks.size}/${SERIES.length}`);
  console.log(`  사실 ${facts.length} · 못 찾음 ${missing.length}`);
  for (const m of missing) console.log("  못 찾음 " + m);
  for (const n of notes) console.log("  " + n);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
