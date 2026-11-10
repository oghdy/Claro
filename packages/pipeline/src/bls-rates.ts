// W-3 · BLS 지수 → 변화율 · 증감. 명령 하나:
//
//     pnpm --filter @claro/pipeline bls-rates FOMC-20261028           # 10월 — bls/rates.json 을 쓴다 (+ 연준 인용과 대조)
//     pnpm --filter @claro/pipeline bls-rates FOMC-20260916           # 9월 — p3-golden/…/bls-rates.json (+ 9월 골든과 대조 — 정답)
//     pnpm --filter @claro/pipeline bls-rates FOMC-20261028 --check   # 다시 계산해 저장한 파일과 글자 단위로 같은지 (다르면 exit 1)
//
// 계산은 BLS 가 발표하는 방법 그대로 (보도자료의 표 머리 — "Seasonally adjusted changes from preceding month" · "Unadjusted 12-mos. ended"):
//   - CPI · 근원 CPI · 에너지 CPI · PPI 최종수요: 전월 대비 = 계절조정 지수 · 1년 전 대비 = 계절조정 안 된 지수.
//     (지금/전 − 1) × 100 을 **발표된 지수(소수 셋째 자리) 그대로** 정확한 십진 계산으로 · 소수 한 자리 · 반올림 (0.05 → 0.1, −0.05 → −0.1). "-0.0" 은 "0.0"
//   - 비농업 취업자 · 일시해고 실업자: 전월 대비 증감 = 수준의 차 (천 명)
//   - 실업률 · 경제활동참가율: 계산하지 않는다 (이미 사실 — bls.ts). 대조에만 그 값을 그대로 쓴다
// 모델을 부르지 않는다 · API 를 부르지 않는다 — bls.ts 가 저장한 응답(SourceDocument.text) 하나에서만 계산한다. 같은 입력이면 같은 출력.
//
// **계산값의 자리 — 계약의 "계산된 수" (ComputedNumber · DATA_MODEL §6.5 — W-4 · D48 W3-a).** 10월 사건의 rates.json 은 두 부분이다:
//   computed  계약 모양 (ComputedNumber) — 입력은 그래프의 사실 (FactRef) · op · 소수 자리 · 값 · 단위 · volatility · as_of. 그래프 곁에 둔다 (그래프 안이 아니다 — p3 가 짓는 파일에 두 쓰는 이를 두지 않는다)
//   rates     계산 기록 (W-3) — 입력의 원문 위치 · 구절 · 각주 · 반올림 전 값. 계약 타입이 아니다. computed 의 값과 같아야 한다 (verify-bls-rates)
// 9월 사건의 bls-rates.json 은 계산 기록만이다 — 9월 골든과 견주는 측정이고 입력이 9월 사건의 사실이 아니다 (W3-e).
//
// **판** — API 값은 받은 날(bls.json 의 fetched_at)의 판이다. 첫 발표(회의 때 위원들이 본 값)와 다를 수 있다. 계산값마다 쓴 지수 · 그 지수의 각주를 적는다. 고치지 않는다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MEASURES, RATE_MONTHS, back, blsDir, findPoint, monthOf, seriesBlocks, ymOf, type Measure, type Month, type Op } from "./bls.ts";
import { uuidFrom } from "./p3.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const RATES_VERSION = "bls-rates/1";

// 측정 표 · 달 계산은 bls.ts 에 있다 (기준 달의 사실을 bls.ts 가 만들어야 해서 — W-4). 여기서는 다시 내보내기만
export { MEASURES, back, monthOf, ymOf, type Measure, type Month, type Op } from "./bls.ts";

// ── 정확한 십진 계산 ──────────────────────────────────────────────
/** "336.940" → 336940n (소수 자리 d 로 맞춘다) */
export function scaled(s: string, d: number): bigint {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s.trim());
  if (!m) throw new Error(`수가 아니다: "${s}"`);
  const frac = m[3] ?? "";
  if (frac.length > d) throw new Error(`소수 ${frac.length} 자리 > ${d}: "${s}"`);
  const v = BigInt(m[2]! + frac.padEnd(d, "0"));
  return m[1] ? -v : v;
}
const decimals = (s: string) => (s.split(".")[1] ?? "").length;
/** n / d 를 정수로 반올림 (0.5 는 0 에서 먼 쪽 — BLS 의 보통 반올림) · d > 0 */
export function roundDiv(n: bigint, d: bigint): bigint {
  if (d <= 0n) throw new Error("나누는 수는 양수");
  const neg = n < 0n;
  const a = neg ? -n : n;
  const q = (2n * a + d) / (2n * d);
  return neg ? -q : q;
}
/** 정수 r 을 소수 k 자리 글로 (r = 값 × 10^k). 0 은 부호 없이 */
export function fmt(r: bigint, k: number): string {
  const neg = r < 0n;
  const a = (neg ? -r : r).toString().padStart(k + 1, "0");
  const body = k ? `${a.slice(0, -k)}.${a.slice(-k)}` : a;
  return neg ? `-${body}` : body;
}
/** (to/from − 1) × 100 — 소수 places 자리로 반올림한 글 */
export function pctChange(to: string, from: string, places = 1): string {
  const d = Math.max(decimals(to), decimals(from));
  const A = scaled(to, d);
  const B = scaled(from, d);
  if (B <= 0n) throw new Error(`기준 값이 0 이하: ${from}`);
  return fmt(roundDiv((A - B) * 100n * 10n ** BigInt(places), B), places);
}
/** to − from (같은 단위) — 입력의 소수 자리 그대로 */
export function levelChange(to: string, from: string): string {
  const d = Math.max(decimals(to), decimals(from));
  return fmt(scaled(to, d) - scaled(from, d), d);
}

// ── 계산 ────────────────────────────────────────────────────────
type Bls = {
  fetch: { fetched_at: string; text_sha256: string };
  sources: { source_id: string; label: string }[];
  source_documents: { source_id: string; text: string }[];
  facts: { fact_id: string; label: string; _key: string }[];
};
export type Input = {
  role: "to" | "from";
  series: string;
  month: string;
  value: string;
  footnotes: string[];
  fact_id: string | null; // 그래프에 그 값의 사실이 있으면 (bls.ts 가 만든 것)
  fact_label: string | null;
  source_id: string;
  section: string;
  span_start: number;
  span_end: number;
  passage: string;
};
export type Rate = {
  label: string;
  measure: string;
  ko: string;
  month: string;
  op: Op;
  lag: number;
  value: string;
  unit: string;
  unrounded: string | null;
  inputs: Input[];
  vintage: { source_label: string; fetched: string; footnotes: string[] };
};

export function point(bls: Bls, series: string, m: Month): Input | null {
  const text = bls.source_documents[0]!.text;
  const b = seriesBlocks(text).get(series);
  if (!b) return null;
  const p = findPoint(text, b, m.year, m.period);
  if (!p) return null;
  const f = bls.facts.find((x) => x._key === `${series}|${m.year}|${m.period}`) ?? null;
  return {
    role: "to", series, month: ymOf(m), value: p.value, footnotes: p.footnotes,
    fact_id: f?.fact_id ?? null, fact_label: f?.label ?? null,
    source_id: bls.sources[0]!.source_id, section: series, span_start: p.start, span_end: p.end, passage: p.passage,
  };
}

export function rate(bls: Bls, ms: Measure, m: Month): Rate | { missing: string } {
  const to = point(bls, ms.series, m);
  const from = point(bls, ms.series, back(m, ms.lag));
  if (!to || !from) return { missing: `${ms.key} ${ymOf(m)}: ${!to ? ymOf(m) : ymOf(back(m, ms.lag))} 값이 응답에 정확히 한 곳에 있지 않다` };
  const value = ms.op === "pct_change" ? pctChange(to.value, from.value, 1) : levelChange(to.value, from.value);
  return {
    label: `RATE-${ms.key}-${m.year}${m.period}`, measure: ms.key, ko: ms.ko, month: ymOf(m), op: ms.op, lag: ms.lag, value, unit: ms.unit,
    unrounded: ms.op === "pct_change" ? pctChange(to.value, from.value, 4) : null,
    inputs: [to, { ...from, role: "from" }],
    vintage: { source_label: bls.sources[0]!.label, fetched: bls.fetch.fetched_at.slice(0, 10), footnotes: [...new Set([...to.footnotes, ...from.footnotes])] },
  };
}

/** 평균 증감 (천 명) — 대조용 (연준 · 골든이 "월평균"을 말할 때). (to − from) / 달 수, 소수 한 자리 */
export function avgChange(bls: Bls, series: string, from: string, to: string): string | null {
  const a = point(bls, series, monthOf(to));
  const b = point(bls, series, monthOf(from));
  if (!a || !b) return null;
  const n = (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7));
  const d = Math.max(decimals(a.value), decimals(b.value));
  return fmt(roundDiv((scaled(a.value, d) - scaled(b.value, d)) * 10n, BigInt(n) * 10n ** BigInt(d)), 1);
}

// ── 대조 — 정답 (9월 골든) · 연준 인용 (10월 그래프) ─────────────────────
// expected 는 그 글에 적힌 수 (단위는 계산값과 같게 — 취업자는 천 명). fragment 는 그 글 안에서 그 수를 말하는 조각 (글에 있어야 한다)
export type Cmp =
  | { against: string; fragment: string; kind: "rate"; measure: string; month: string; expected: string; note?: string }
  | { against: string; fragment: string; kind: "level"; series: string; month: string; expected: string; note?: string }
  | { against: string; fragment: string; kind: "avg"; series: string; from: string; to: string; expected: string; approx?: number; note?: string }
  | { against: string; fragment: string; kind: "none"; note: string };

const R = (against: string, fragment: string, measure: string, month: string, expected: string, note?: string): Cmp => ({ against, fragment, kind: "rate", measure, month, expected, ...(note ? { note } : {}) });
const L = (against: string, fragment: string, series: string, month: string, expected: string, note?: string): Cmp => ({ against, fragment, kind: "level", series, month, expected, ...(note ? { note } : {}) });

// 9월 골든 (fixtures/store.json) — 첫 발표 보도자료에서 사람이 옮긴 값 (C-3). 정답이다
export const GOLDEN_KEY: Cmp[] = [
  R("F41", "전월 대비 0.4% (계절조정", "CPI_ALL_1M", "2026-08", "0.4"),
  R("F41", "7월 0.1%", "CPI_ALL_1M", "2026-07", "0.1"),
  R("F41", "3~5월은 0.9%", "CPI_ALL_1M", "2026-03", "0.9"),
  R("F41", "0.9% · 0.6%", "CPI_ALL_1M", "2026-04", "0.6"),
  R("F41", "0.6% · 0.5%", "CPI_ALL_1M", "2026-05", "0.5"),
  R("F41", "12개월 3.4%", "CPI_ALL_12M", "2026-08", "3.4"),
  R("F41", "식품·에너지 제외 전월 대비 0.3%", "CPI_CORE_1M", "2026-08", "0.3"),
  R("F41", "(7월 0.2%)", "CPI_CORE_1M", "2026-07", "0.2"),
  R("F41", "12개월 2.4%", "CPI_CORE_12M", "2026-08", "2.4"),
  R("F41", "에너지 전월 대비 2.1%", "CPI_ENERGY_1M", "2026-08", "2.1"),
  R("F47", "전월 대비 0.1% (계절조정)", "CPI_ALL_1M", "2026-07", "0.1"),
  R("F47", "12개월 3.4%", "CPI_ALL_12M", "2026-07", "3.4"),
  R("F47", "식품·에너지 제외 전월 대비 0.2%", "CPI_CORE_1M", "2026-07", "0.2"),
  R("F47", "12개월 2.5%", "CPI_CORE_12M", "2026-07", "2.5"),
  R("F47", "에너지 전월 대비 -1.5%", "CPI_ENERGY_1M", "2026-07", "-1.5"),
  R("F46", "전월 대비 -0.4%", "CPI_ALL_1M", "2026-06", "-0.4"),
  R("F46", "5월 0.5%", "CPI_ALL_1M", "2026-05", "0.5"),
  R("F46", "12개월 3.5%", "CPI_ALL_12M", "2026-06", "3.5"),
  R("F46", "5월 4.2%", "CPI_ALL_12M", "2026-05", "4.2"),
  R("F46", "식품·에너지 제외 전월 대비 0.0%", "CPI_CORE_1M", "2026-06", "0.0"),
  R("F46", "12개월 2.6%", "CPI_CORE_12M", "2026-06", "2.6"),
  R("F46", "5월 2.9%", "CPI_CORE_12M", "2026-05", "2.9"),
  R("F46", "에너지 전월 대비 -5.7%", "CPI_ENERGY_1M", "2026-06", "-5.7"),
  R("F48", "전월 대비 0.4%", "PPI_FD_1M", "2026-08", "0.4"),
  R("F48", "12개월 5.4%", "PPI_FD_12M", "2026-08", "5.4"),
  R("F48", "7월 4.8%", "PPI_FD_12M", "2026-07", "4.8"),
  R("F40", "비농업 취업자 +162,000", "PAYROLL_1M", "2026-08", "162"),
  { against: "F40", fragment: "그 전 12개월 월평균 +31,000", kind: "avg", series: "CES0000000001", from: "2025-07", to: "2026-07", expected: "31", note: "8월 앞 12 달(2025-08 ~ 2026-07)의 월 증감 평균 = (2026-07 − 2025-07) / 12" },
  L("F40", "실업률 4.1% (7월", "LNS14000000", "2026-08", "4.1"),
  L("F40", "7월 4.1% 에서 변동 없음", "LNS14000000", "2026-07", "4.1"),
  L("F40", "경제활동참가율 61.6%", "LNS11300000", "2026-08", "61.6"),
  R("F30", "비농업 취업자 -23,000", "PAYROLL_1M", "2026-07", "-23"),
  L("F30", "실업률 4.1%", "LNS14000000", "2026-07", "4.1"),
  R("F30", "일시해고 +153,000", "TEMP_LAYOFF_1M", "2026-07", "153"),
];

// 10월 그래프 (p3/graph.json) 의 연준 문서 사실 — 위원이 그때 본 판으로 말한 수. label 은 그래프를 다시 지으면 바뀔 수 있다 (조각이 글에 없으면 대조하지 않고 적는다)
export const FED_KEY: Cmp[] = [
  L("F085", "7월과 8월에 4.1%", "LNS14000000", "2026-07", "4.1", "9월 회의록"),
  L("F085", "7월과 8월에 4.1%", "LNS14000000", "2026-08", "4.1", "9월 회의록"),
  L("F446", "약 4.1%", "LNS14000000", "2026-08", "4.1", "9/16 기자회견 — 그때 최신 달은 8월 (8월 고용 9/4 발표 — 골든 F40)"),
  R("F449", "2.4%", "CPI_CORE_12M", "2026-08", "2.4", "9/16 기자회견 — 구절 \"Core PCE and CPI prices are running at about 3.2 and 2.4 percent\". 2.4 는 근원 CPI 1년 전 대비와 같다 (전체 CPI 는 3.4). 사실 글 \"Core PCE 와 CPI 가격\" 은 어느 CPI 인지 흐리다 — 고치지 않는다 (W-2 · P-7 의 의미 대조 몫)"),
  L("F164", "8월 4.1%", "LNS14000000", "2026-08", "4.1", "Cook 9/28"),
  L("F192", "8월에 4.1%", "LNS14000000", "2026-08", "4.1", "Jefferson 10/1"),
  L("F283", "4.1% 인 실업률", "LNS14000000", "2026-08", "4.1", "Logan 10/1 — 구절에 달이 없다. 10/1 의 최신 달을 8월로 본 것은 추정 (9월 고용 발표일은 우리 출처에 없다)"),
  L("F265", "4.2% 실업률", "LNS14000000", "2026-09", "4.2", "Hammack 10/12 — 구절에 달이 없다. 9월로 본 것은 Waller 10/8 이 9월 고용 보고서를 말했기 때문 (F231)"),
  { against: "F139", fragment: "월평균 약 80,000", kind: "avg", series: "CES0000000001", from: "2025-12", to: "2026-08", expected: "80", approx: 10, note: "Barr 9/29 — \"around 80,000 a month this year\" = 1 ~ 8월 평균 (그때 최신 달 8월). '약' 이라 만 단위로 반올림해 견준다" },
  { against: "F161", fragment: "추정 3.8%", kind: "none", note: "Cook 9/28 — \"estimated\" · 어느 지수인지 구절이 말하지 않는다 (8월 CPI 1년 전 대비는 3.4 · 근원 2.4 — 같지 않다). BLS 지수의 변화율이 아니라 대조하지 않는다" },
  { against: "F316", fragment: "3.7%", kind: "none", note: "Williams 9/29 — 어느 지수 · 어느 달인지 구절이 말하지 않는다. 대조하지 않는다" },
];

export type CmpRow = Cmp & { anchored: boolean; computed: string | null; match: boolean | null };

export function compare(bls: Bls, rates: Rate[], key: Cmp[], texts: Map<string, string>): CmpRow[] {
  return key.map((c) => {
    const anchored = (texts.get(c.against) ?? "").includes(c.fragment);
    let computed: string | null = null;
    if (c.kind === "rate") computed = rates.find((r) => r.measure === c.measure && r.month === c.month)?.value ?? null;
    else if (c.kind === "level") computed = point(bls, c.series, monthOf(c.month))?.value ?? null;
    else if (c.kind === "avg") computed = avgChange(bls, c.series, c.from, c.to);
    let match: boolean | null = null;
    if (c.kind !== "none" && anchored && computed !== null) {
      if (c.kind === "avg" && c.approx) match = Math.round(Number(computed) / c.approx) * c.approx === Number(c.expected);
      else match = computed === c.expected;
    }
    return { ...c, anchored, computed, match };
  });
}

// ── 사건 ────────────────────────────────────────────────────────
const months = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let m = monthOf(from); ymOf(m) <= to; m = back(m, -1)) out.push(ymOf(m));
  return out;
};
export const RATE_EVENTS: Record<string, { months: string[]; out: string; blsFrom: string; key: Cmp[]; keyFrom: "golden" | "graph"; computed: boolean; note: string }> = {
  // 회의(10/28) 전에 나온 마지막 달 9월 · 그 앞 달 8월 (bls.ts EVENT_MONTHS 와 같은 달). 10월 값은 회의 뒤 발표라 계산하지 않는다
  "FOMC-20261028": {
    months: RATE_MONTHS["FOMC-20261028"]!, out: "packages/pipeline/data/events/FOMC-20261028/bls/rates.json", blsFrom: "FOMC-20261028", key: FED_KEY, keyFrom: "graph", computed: true,
    note: "회의 직전 지표 — 9월 (그 앞 달 8월). 9월 값이 회의(10/28) 전에 공개됐는지는 이 응답이 증명하지 못한다 (P4-k). 9월 고용 보고서는 Waller 10/8 (F231) · Hammack 10/12 (F265 실업률 4.2%) 연설이 말한다. 9월 CPI · PPI 는 회의 전 공개를 말하는 1차가 그래프에 없다 — Waller 10/8 은 10/1 에 시작된 정부 셧다운으로 공식 통계가 끊겼다고 말했다 (F217)",
  },
  // 9월 사건에는 BLS 원문이 없다 (P-1: 보도자료 못 가져옴). 같은 11/10 응답(2025 ~ 2026)으로 계산한다 — 9월 골든의 3 ~ 8월 값과 견주는 정답 대조
  "FOMC-20260916": {
    months: months("2026-03", "2026-08"), out: "packages/pipeline/data/p3-golden/FOMC-20260916/bls-rates.json", blsFrom: "FOMC-20261028", key: GOLDEN_KEY, keyFrom: "golden", computed: false,
    note: "9월 골든 대조 — 골든은 첫 발표 보도자료에서 사람이 옮긴 값 · 이 계산은 2026-11-10 판. 다르면 그 사이 고쳐진 것이다 (계산이 틀린 것인지는 같은 판의 다른 값으로 가른다)",
  },
};

// ── 계산된 수 (ComputedNumber — DATA_MODEL §6.5) ─────────────────────────────────────
export type ComputedOp = "pct_change_12m" | "pct_change_1m" | "level_change_1m";
export type ComputedNumber = {
  computed_id: string; label: string; event_id: string; op: ComputedOp;
  inputs: { role: "to" | "from"; fact: string; value: string }[];
  places: number | null; value: string; unit: string; volatility: "STABLE" | "VOLATILE"; as_of: string | null;
};
type GFact = { fact_id: string; label: string; volatility: string; as_of: string | null };

/** 계산 기록 한 줄 → 계약의 계산된 수. 입력이 그래프의 사실이 아니면 멈춘다 (기준 달 사실은 bls.ts 가 만든다 — bls 를 다시 · p3 를 다시) */
export function computedOf(code: string, eventId: string, r: Rate, facts: Map<string, GFact>): ComputedNumber {
  const ins = r.inputs.map((i) => {
    const f = i.fact_id ? facts.get(i.fact_id) : undefined;
    if (!f) throw new Error(`${r.label}: 입력 ${i.series} ${i.month} 이 그래프의 사실이 아니다 — bls 를 다시 돌려 기준 달 사실을 만들고 p3 를 다시`);
    return f;
  });
  const vol = ins.some((f) => f.volatility === "VOLATILE") ? "VOLATILE" : "STABLE";
  const asOfs = [...new Set(ins.filter((f) => f.volatility === "VOLATILE").map((f) => f.as_of))];
  if (vol === "VOLATILE" && (asOfs.length !== 1 || !asOfs[0])) throw new Error(`${r.label}: VOLATILE 입력의 as_of 가 하나가 아니다 (${asOfs.join(" · ")}) — 판이 다른 값을 섞어 계산하지 않는다`);
  return {
    computed_id: uuidFrom(`${code}|computed|${r.label}`), label: r.label, event_id: eventId,
    op: `${r.op}_${r.lag === 12 ? "12m" : "1m"}` as ComputedOp,
    inputs: r.inputs.map((i) => ({ role: i.role, fact: i.fact_id!, value: i.value })),
    places: r.op === "pct_change" ? 1 : null, value: r.value, unit: r.unit, volatility: vol, as_of: vol === "VOLATILE" ? asOfs[0]! : null,
  };
}

export function build(code: string) {
  const ev = RATE_EVENTS[code];
  if (!ev) throw new Error(`사건 code 를 준다 — ${Object.keys(RATE_EVENTS).join(" · ")}`);
  const blsRel = `packages/pipeline/data/events/${ev.blsFrom}/bls/bls.json`;
  const bls = JSON.parse(readFileSync(join(blsDir(ev.blsFrom), "bls.json"), "utf8")) as Bls;
  const rates: Rate[] = [];
  const missing: string[] = [];
  for (const ym of ev.months)
    for (const ms of MEASURES) {
      const r = rate(bls, ms, monthOf(ym));
      if ("missing" in r) missing.push(r.missing);
      else rates.push(r);
    }
  // 대조의 글 — 골든은 fixtures/store.json (읽기만), 연준 인용은 10월 그래프 (읽기만)
  const texts = new Map<string, string>();
  const facts: { label: string; claim_text: string }[] =
    ev.keyFrom === "golden"
      ? JSON.parse(readFileSync(join(ROOT, "fixtures/store.json"), "utf8")).facts
      : JSON.parse(readFileSync(join(ROOT, "packages/pipeline/data/events", code, "p3/graph.json"), "utf8")).facts;
  for (const f of facts) texts.set(f.label, f.claim_text);
  const cmp = compare(bls, rates, ev.key, texts);
  // 계산된 수 — 입력은 이 사건 그래프의 사실 (읽기만)
  let computed: ComputedNumber[] | null = null;
  if (ev.computed) {
    const g = JSON.parse(readFileSync(join(ROOT, "packages/pipeline/data/events", code, "p3/graph.json"), "utf8")) as { event_id: string; facts: GFact[] };
    const gf = new Map(g.facts.map((f) => [f.fact_id, f]));
    computed = rates.map((r) => computedOf(code, g.event_id, r, gf));
  }
  const tally = { rows: cmp.length, compared: cmp.filter((c) => c.match !== null).length, match: cmp.filter((c) => c.match === true).length, differ: cmp.filter((c) => c.match === false).length, not_compared: cmp.filter((c) => c.kind === "none").length, anchor_lost: cmp.filter((c) => !c.anchored).length };
  return {
    _what: ev.computed
      ? `${code} 의 BLS 변화율 · 증감 — bls-rates.ts 가 쓴다 (손으로 고치지 않는다). computed = 계약의 계산된 수 (ComputedNumber · DATA_MODEL §6.5 — 입력은 그래프의 사실) · rates = 계산 기록 (원문 위치 · 구절 · 각주 · 반올림 전 값 — 계약 타입이 아니다). 두 값은 같다`
      : `${code} 의 BLS 변화율 · 증감 — bls-rates.ts 가 쓴다 (손으로 고치지 않는다). 계산 기록이다 (9월 골든과 견주는 측정 — W3-e). 입력이 이 사건의 사실이 아니라 계산된 수(ComputedNumber)를 짓지 않는다`,
    version: RATES_VERSION,
    event: code,
    note: ev.note,
    source: { file: blsRel, source_id: bls.sources[0]!.source_id, label: bls.sources[0]!.label, fetched_at: bls.fetch.fetched_at, text_sha256: bls.fetch.text_sha256 },
    vintage: `API 값은 받은 날(${bls.fetch.fetched_at.slice(0, 10)})의 판이다 — 첫 발표(회의 때 위원들이 본 값)와 다를 수 있다. 계산값마다 쓴 지수 · 각주를 inputs 에 적었다. 고치지 않는다`,
    rule: "전월 대비 = 계절조정 · 1년 전 대비 = 계절조정 안 함 · (지금/전 − 1) × 100 · 발표된 지수 그대로 정확한 십진 계산 · 소수 한 자리 반올림 (0.05 → 0.1) · 증감 = 수준의 차 (천 명)",
    measures: MEASURES,
    months: ev.months,
    ...(computed ? { computed } : {}),
    rates,
    missing,
    compare: { against: ev.keyFrom === "golden" ? "fixtures/store.json (9월 골든 — 읽기만)" : `packages/pipeline/data/events/${code}/p3/graph.json (연준 문서 사실 — 읽기만)`, tally, rows: cmp },
  };
}

function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a) => !a.startsWith("--"));
  if (!code) throw new Error(`사건 code 를 준다 — ${Object.keys(RATE_EVENTS).join(" · ")}`);
  const out = build(code);
  const text = JSON.stringify(out, null, 2) + "\n";
  const path = join(ROOT, RATE_EVENTS[code]!.out);
  if (argv.includes("--check")) {
    const same = existsSync(path) && readFileSync(path, "utf8") === text;
    console.log(`bls-rates ${code} --check: ${same ? "같다" : "다르다 — 다시 계산한 것과 저장한 파일이 다르다"}`);
    if (!same) process.exitCode = 1;
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  const t = out.compare.tally;
  console.log(`bls-rates ${code} — 계산 ${out.rates.length} · 못 함 ${out.missing.length} · 판 ${out.source.label} (${out.source.fetched_at}) → ${RATE_EVENTS[code]!.out}`);
  console.log(`  대조 ${t.rows} 줄: 견줌 ${t.compared} (같음 ${t.match} · 다름 ${t.differ}) · 대조 안 함 ${t.not_compared} · 조각을 못 찾음 ${t.anchor_lost}`);
  for (const r of out.compare.rows) if (r.match === false || !r.anchored) console.log(`  ${r.match === false ? "다름" : "조각 없음"} ${r.against} "${r.fragment}" — 글 ${"expected" in r ? r.expected : "-"} · 계산 ${r.computed}`);
  for (const m of out.missing) console.log("  못 함 " + m);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
