// P-3b · 표는 코드가 읽는다 (D42). **어느 문서가 표인지는 table-rules.json 한 곳** — 검사(scripts/verify-fact-graph.py)도 같은 파일을 읽는다.
//
//   TABLE  모델에 보내지 않는다. 아래 읽기 함수가 칸 이름과 값을 짝지어 사실을 만든다
//   MIXED  글은 모델이, 글 안의 표 덩어리는 코드가. 모델 입력에서는 표 줄을 가린다 (modelInput)
//   TEXT   (목록에 없음) 모델이 읽는다
//
// 칸 짝짓기: 줄을 '|' 로 나눠 앞뒤 공백을 지운 칸 목록. 머리 칸 번호 h · 줄 칸 번호 r — r - h 는 표마다 정해진 값 (table-rules.json offsets).
// 사실마다 `table` 주석에 머리 줄 · 줄 · 칸 짝(h · r · 머리 글 · 값)을 그대로 남긴다 — 검사가 원문에서 다시 나눠 대 본다.
// 구절 = 원문을 글자 그대로 자른 것 (머리 줄 · 줄, 또는 머리부터 줄까지 이어진 덩어리). 원문에 한 곳에만 있어야 한다 — 아니면 사실로 만들지 않고 notes 에.
// 계산하지 않는다: 변화 · 차이 · 최고 · 최저를 만들지 않는다. 표에 있는 칸을 옮길 뿐이다.
import { readFileSync } from "node:fs";
import { cpLength, cpSlice, locate } from "./match.ts";

type DocRule = { handler: string; kind: "TABLE" | "MIXED"; url: string };
export const TABLE_RULES: { version: string; documents: DocRule[]; offsets: Record<string, number>; mask_line: string } = JSON.parse(readFileSync(new URL("../table-rules.json", import.meta.url), "utf8"));

export type TableDoc = { label: string; source_id: string; title: string; publisher: string; published_at: string; url: string | null; text: string };
export type TableEvent = { date: string; prev_meeting: string };

/** 문서 → 규칙 (없으면 TEXT) */
export function docRule(url: string | null): DocRule | null {
  if (!url) return null;
  return TABLE_RULES.documents.find((r) => new RegExp(r.url).test(url)) ?? null;
}
export const docKind = (url: string | null): "TABLE" | "MIXED" | "TEXT" => docRule(url)?.kind ?? "TEXT";

export type Cell = { h: number; r: number; col: string; shown: string; value: string };
export type TableNote = { handler: string; header_line: string; row_line: string; cells: Cell[]; row_label: string; group?: { line: string; index: number; col: string; shown: string } | null; date_cell?: string | null };
export type TableFact = {
  key: string; source_label: string; source_id: string;
  claim_text: string; fact_type: string; actor: string | null; volatility: "STABLE" | "VOLATILE"; as_of: string | null; event_at: string | null;
  passages: { text: string; span_start: number; span_end: number }[];
  table: TableNote;
};

export const cells = (line: string): string[] => line.split("|").map((c) => c.trim());
/** 머리 글의 꼬리 각주 숫자를 뗀다 ("Median1" → "Median" · "Core PCE inflation4" → "Core PCE inflation"). 수로만 된 머리("2026")는 그대로 */
export const clean = (s: string): string => s.replace(/(?<=[A-Za-z])\d+$/, "");

type Line = { text: string; start: number; end: number }; // 코드 포인트
function linesOf(text: string): Line[] {
  const out: Line[] = [];
  let at = 0;
  for (const t of text.split("\n")) {
    const n = cpLength(t);
    out.push({ text: t, start: at, end: at + n });
    at += n + 1;
  }
  return out;
}

const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${p2(m)}-${p2(d)}`;
function addDays(isoDate: string, n: number): string {
  const t = new Date(`${isoDate}T00:00:00Z`).getTime() + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export type ReadResult = { facts: TableFact[]; notes: string[]; regions: [number, number][] };

export function readTables(doc: TableDoc, ev: TableEvent): ReadResult {
  const rule = docRule(doc.url);
  if (!rule) return { facts: [], notes: [], regions: [] };
  const L = linesOf(doc.text);
  const out: ReadResult = { facts: [], notes: [], regions: [] };
  let n = 0;
  /** 구절 = 원문 글자 그대로 (줄 a 의 처음 ~ 줄 b 의 끝). 원문에 한 곳에만 있어야 한다 */
  const slice = (a: number, b: number) => {
    const s = L[a]!.start, e = L[b]!.end;
    const text = cpSlice(doc.text, s, e);
    const loc = locate(doc.text, text);
    return loc.result === "FOUND" && loc.span_start === s && loc.span_end === e ? { text, span_start: s, span_end: e } : null;
  };
  const push = (f: Omit<TableFact, "key" | "source_label" | "source_id" | "passages">, ps: ({ text: string; span_start: number; span_end: number } | null)[], what: string) => {
    if (ps.some((p) => p == null)) {
      out.notes.push(`${doc.label} ${what}: 구절이 원문에 한 곳이 아니다 — 사실로 만들지 않음`);
      return;
    }
    n++;
    out.facts.push({ key: `${doc.label}#T${n}`, source_label: doc.label, source_id: doc.source_id, ...f, passages: ps as TableFact["passages"] });
  };
  const inSeriesWindow = (d: string, firstOfYear: string | null) => d <= ev.date && (d >= ev.prev_meeting || d === firstOfYear);

  if (rule.handler === "treasury_par_yield") {
    const hi = L.findIndex((l) => /^Date \| /.test(l.text));
    if (hi < 0) throw new Error(`${doc.label}: 국채 표의 머리 줄이 없다`);
    const head = cells(L[hi]!.text);
    const rows = L.map((l, i) => ({ l, i, m: /^(\d{2})\/(\d{2})\/(\d{4}) \|/.exec(l.text) })).filter((x) => x.i > hi && x.m);
    const y0 = ev.date.slice(0, 4);
    const first = rows.map((x) => iso(+x.m![3]!, +x.m![1]!, +x.m![2]!)).filter((d) => d.startsWith(y0)).sort()[0] ?? null;
    for (const { l, i, m } of rows) {
      const d = iso(+m![3]!, +m![1]!, +m![2]!);
      if (!inSeriesWindow(d, first)) continue;
      const row = cells(l.text);
      if (row.length !== head.length) {
        out.notes.push(`${doc.label} ${d}: 줄의 칸 수 ${row.length} ≠ 머리 ${head.length} — 사실로 만들지 않음`);
        continue;
      }
      const cs: Cell[] = [];
      for (let k = 1; k < head.length; k++) if (row[k] && row[k] !== "N/A") cs.push({ h: k, r: k + TABLE_RULES.offsets.treasury_par_yield!, col: head[k]!, shown: head[k]!, value: row[k]! });
      if (!cs.length) continue;
      push({
        claim_text: `미 재무부 일별 국채 par 수익률 곡선 금리 (%) — ${d}: ${cs.map((c) => `${c.shown} ${c.value}`).join(" · ")}`,
        fact_type: "MEASUREMENT", actor: null, volatility: "STABLE", as_of: null, event_at: d,
        table: { handler: "treasury_par_yield", header_line: L[hi]!.text, row_line: l.text, cells: cs, row_label: row[0]!, date_cell: row[0]! },
      }, [slice(hi, hi), slice(i, i)], d);
    }
    return out;
  }

  if (rule.handler === "eia_history") {
    const ti = L.findIndex((l) => /\(Dollars per (Barrel|Gallon)\)$/.test(l.text));
    if (ti < 0) throw new Error(`${doc.label}: EIA 표의 제목 줄이 없다`);
    const title = L[ti]!.text;
    const y0 = ev.date.slice(0, 4);
    if (/^Week Of \| Mon \| Tue \| Wed \| Thu \| Fri$/.test(L[ti + 1]?.text ?? "")) {
      // 일별 — 줄 = 한 주 (월 ~ 금). 칸의 날 = 주의 첫날 + (칸 번호 - 1)
      const hi = ti + 1;
      const head = cells(L[hi]!.text);
      type C = { d: string; i: number; k: number; row: string[] };
      const all: C[] = [];
      L.forEach((l, i) => {
        const m = /^(\d{4}) ([A-Z][a-z]{2})- ?(\d{1,2}) to ([A-Z][a-z]{2})- ?(\d{1,2}) \|/.exec(l.text);
        if (!m || i <= hi) return;
        const start = iso(+m[1]!, MON[m[2]!.toLowerCase()]!, +m[3]!);
        const end = addDays(start, 4);
        if (end.slice(5) !== `${p2(MON[m[4]!.toLowerCase()]!)}-${p2(+m[5]!)}`) {
          out.notes.push(`${doc.label} ${l.text.slice(0, 30)}: 주의 끝날이 월 ~ 금이 아니다 — 사실로 만들지 않음`);
          return;
        }
        const row = cells(l.text);
        for (let k = 1; k < head.length; k++) if (row[k]) all.push({ d: addDays(start, k - 1), i, k, row });
      });
      const first = all.map((c) => c.d).filter((d) => d.startsWith(y0)).sort()[0] ?? null;
      for (const c of all) {
        if (!inSeriesWindow(c.d, first)) continue;
        const cell: Cell = { h: c.k, r: c.k + TABLE_RULES.offsets.eia_daily!, col: head[c.k]!, shown: head[c.k]!, value: c.row[c.k]! };
        push({
          claim_text: `EIA ${title} — ${c.d} · ${cell.shown} ${cell.value}`,
          fact_type: "MEASUREMENT", actor: null, volatility: "STABLE", as_of: null, event_at: c.d,
          table: { handler: "eia_daily", header_line: L[hi]!.text, row_line: L[c.i]!.text, cells: [cell], row_label: c.row[0]! },
        }, [slice(ti, hi), slice(c.i, c.i)], c.d);
      }
      return out;
    }
    if (/^Year-Month \| Week 1/.test(L[ti + 1]?.text ?? "") && /^End Date \| Value/.test(L[ti + 2]?.text ?? "")) {
      // 주별 — 줄 = 한 달. 칸 = (주 끝날, 값) 짝. 값 칸 r 의 머리는 h = r - 1 ("Value"), 주 끝날은 줄의 r - 1 칸
      const hi = ti + 2;
      const head = cells(L[hi]!.text);
      const off = TABLE_RULES.offsets.eia_weekly!;
      type C = { d: string; i: number; r: number; row: string[] };
      const all: C[] = [];
      L.forEach((l, i) => {
        const m = /^(\d{4})-([A-Z][a-z]{2}) \|/.exec(l.text);
        if (!m || i <= hi) return;
        const row = cells(l.text);
        for (let r = 2; r < row.length; r += 2) {
          const dm = /^(\d{2})\/(\d{2})$/.exec(row[r - 1] ?? "");
          if (!dm || !row[r]) continue;
          const lm = MON[m[2]!.toLowerCase()]!;
          const y = +dm[1]! === 12 && lm === 1 ? +m[1]! - 1 : +m[1]!;
          all.push({ d: iso(y, +dm[1]!, +dm[2]!), i, r, row });
        }
      });
      const first = all.map((c) => c.d).filter((d) => d.startsWith(y0)).sort()[0] ?? null;
      for (const c of all) {
        if (!inSeriesWindow(c.d, first)) continue;
        const h = c.r - off;
        const cell: Cell = { h, r: c.r, col: head[h]!, shown: head[h]!, value: c.row[c.r]! };
        push({
          claim_text: `EIA ${title} — End Date ${c.row[c.r - 1]} (${c.d}) · ${cell.shown} ${cell.value}`,
          fact_type: "MEASUREMENT", actor: null, volatility: "STABLE", as_of: null, event_at: c.d,
          table: { handler: "eia_weekly", header_line: L[hi]!.text, row_line: L[c.i]!.text, cells: [cell], row_label: c.row[0]!, date_cell: c.row[c.r - 1]! },
        }, [slice(ti, hi), slice(c.i, c.i)], c.d);
      }
      return out;
    }
    throw new Error(`${doc.label}: 모르는 EIA 표 모양`);
  }

  if (rule.handler === "sep") {
    const ti = L.findIndex((l) => /^Table 1\. .*, ([A-Z][a-z]+) (\d{4})$/.test(l.text));
    if (ti < 0) throw new Error(`${doc.label}: SEP Table 1 이 없다`);
    const tm = /, ([A-Z][a-z]+) (\d{4})$/.exec(L[ti]!.text)!;
    const vMonth = tm[1]!, vYear = +tm[2]!, vM = MONTHS.indexOf(vMonth.toLowerCase()) + 1;
    const vintage = `${vMonth} ${vYear}`;
    const docDay = doc.published_at.slice(0, 10);
    const priorAt = (label: string) => {
      const pm = MONTHS.indexOf(label.toLowerCase()) + 1;
      if (pm < 1) return null;
      return `${pm > vM ? vYear - 1 : vYear}-${p2(pm)}`;
    };
    const atOf = (rowLabel: string) => {
      const m = /^([A-Z][a-z]+) projections?$/.exec(rowLabel);
      if (!m) return docDay;
      return m[1] === vMonth ? docDay : priorAt(m[1]!);
    };
    // Table 1 — 머리 둘: 묶음 줄 (Variable | Median | Central Tendency | Range) · 해 줄 (15 칸 · 이름 칸 없음 → 줄 칸 = 해 칸 + 1)
    const gi = L.findIndex((l, i) => i > ti && /^Variable \| /.test(l.text));
    const yi = gi + 1;
    const groups = cells(L[gi]!.text).slice(1);
    const years = cells(L[yi]!.text);
    const per = years.length / groups.length;
    if (!Number.isInteger(per)) throw new Error(`${doc.label}: Table 1 머리의 칸 수가 맞지 않는다`);
    const off1 = TABLE_RULES.offsets.sep_table1!;
    let variable: { i: number; label: string } | null = null;
    for (let i = yi + 1; i < L.length && !/^Note:/.test(L[i]!.text); i++) {
      const t = L[i]!.text;
      if (!t.includes("|")) continue;
      const row = cells(t);
      if (row.length !== years.length + off1) {
        out.notes.push(`${doc.label} Table 1 "${row[0]}": 칸 수 ${row.length} — 사실로 만들지 않음`);
        continue;
      }
      const prior = /^[A-Z][a-z]+ projections?$/.test(row[0]!);
      if (!prior) variable = { i, label: row[0]! };
      if (!variable) continue;
      for (let g = 0; g < groups.length; g++) {
        const cs: Cell[] = [];
        for (let k = 0; k < per; k++) {
          const h = g * per + k, r = h + off1;
          if (row[r]) cs.push({ h, r, col: years[h]!, shown: years[h]!, value: row[r]! });
        }
        if (!cs.length) continue;
        const gShown = clean(groups[g]!);
        push({
          claim_text: `FOMC 참가자 경제 전망 (SEP · Table 1 · ${vintage}) — ${clean(variable.label)}${prior ? ` · ${row[0]}` : ""} · ${gShown}: ${cs.map((c) => `${c.shown} ${c.value}`).join(" · ")} (Percent)`,
          fact_type: "OFFICIAL_CLAIM", actor: "FOMC 참가자 (경제 전망)", volatility: "STABLE", as_of: null, event_at: atOf(row[0]!),
          table: { handler: "sep_table1", header_line: L[yi]!.text, row_line: t, cells: cs, row_label: row[0]!, group: { line: L[gi]!.text, index: g + 1, col: groups[g]!, shown: gShown } },
        }, [slice(ti, yi), prior ? slice(variable.i, i) : slice(i, i)], `Table 1 ${row[0]} ${gShown}`);
      }
    }
    // Figure 2 — 점도표 (중간점 줄 · 해 칸 · 값 = 참가자 수)
    const fi = L.findIndex((l) => /^Figure 2\. /.test(l.text));
    const fh = L.findIndex((l, i) => i > fi && /^Midpoint of target range or target level \(Percent\) \| /.test(l.text));
    if (fi >= 0 && fh >= 0) {
      const head = cells(L[fh]!.text);
      for (let i = fh + 1; i < L.length && /^\d\.\d{3} \|/.test(L[i]!.text); i++) {
        const row = cells(L[i]!.text);
        const cs: Cell[] = [];
        for (let k = 1; k < head.length; k++) if (row[k + TABLE_RULES.offsets.sep_dots!]) cs.push({ h: k, r: k + TABLE_RULES.offsets.sep_dots!, col: head[k]!, shown: head[k]!, value: row[k + TABLE_RULES.offsets.sep_dots!]! });
        if (!cs.length) continue;
        push({
          claim_text: `FOMC 참가자 경제 전망 (SEP · Figure 2 점도표 · ${vintage}) — 적정 연방기금금리 중간점 ${row[0]}: ${cs.map((c) => `${c.shown} ${c.value}명`).join(" · ")}`,
          fact_type: "OFFICIAL_CLAIM", actor: "FOMC 참가자 (경제 전망)", volatility: "STABLE", as_of: null, event_at: docDay,
          table: { handler: "sep_dots", header_line: L[fh]!.text, row_line: L[i]!.text, cells: cs, row_label: row[0]! },
        }, [slice(fi, fh), slice(i, i)], `Figure 2 ${row[0]}`);
      }
    } else out.notes.push(`${doc.label}: Figure 2 (점도표) 를 못 찾음`);
    // Figure 4 — 불확실성 · 위험 판단 (판 제목 · "Number of participants" · 머리 "| …" · 줄 "<달> projections | …")
    L.forEach((l, i) => {
      if (!/^(Uncertainty about|Risks to) /.test(l.text) || L[i + 1]?.text !== "Number of participants" || !/^\| /.test(L[i + 2]?.text ?? "")) return;
      const hiR = i + 2;
      const head = cells(L[hiR]!.text);
      for (let j = hiR + 1; j < L.length && /^[A-Z][a-z]+ projections \|/.test(L[j]!.text); j++) {
        const row = cells(L[j]!.text);
        const off = TABLE_RULES.offsets.sep_risk!;
        const cs: Cell[] = [];
        for (let k = 1; k < head.length; k++) if (row[k + off] !== undefined && row[k + off] !== "") cs.push({ h: k, r: k + off, col: head[k]!, shown: head[k]!, value: row[k + off]! });
        if (!cs.length) continue;
        push({
          claim_text: `FOMC 참가자 경제 전망 (SEP · Figure 4 · ${vintage}) — ${l.text} · ${row[0]}: ${cs.map((c) => `${c.shown} ${c.value}명`).join(" · ")}`,
          fact_type: "OFFICIAL_CLAIM", actor: "FOMC 참가자 (경제 전망)", volatility: "STABLE", as_of: null, event_at: atOf(row[0]!),
          table: { handler: "sep_risk", header_line: L[hiR]!.text, row_line: L[j]!.text, cells: cs, row_label: row[0]! },
        }, [slice(i, j)], `${l.text} ${row[0]}`);
      }
    });
    out.notes.push(`${doc.label}: 읽지 않은 것 — Figure 1 (Table 1 과 같은 값 + 지난해 실제 값) · Figure 3 (분포 막대 — 머리의 해 칸 5 와 줄의 칸 9 가 짝이 맞지 않는다) · Figure 4.D · 4.E (확산 지수 이력) · Figure 5 · Table 2 · 글 (방법 설명 · 각주)`);
    return out;
  }

  if (rule.handler === "omo_rates") {
    L.forEach((l, i) => {
      if (!/^\d{4}$/.test(l.text) || !/^Date \| Increase \| Decrease \| Level \(%\)$/.test(L[i + 1]?.text ?? "")) return;
      const y = +l.text;
      const hi = i + 1;
      const head = cells(L[hi]!.text);
      for (let j = hi + 1; j < L.length && L[j]!.text.includes(" | "); j++) {
        const row = cells(L[j]!.text);
        const dm = /^([A-Z][a-z]+) (\d{1,2})\*?$/.exec(row[0]!);
        const mm = dm ? MONTHS.indexOf(dm[1]!.toLowerCase()) + 1 : 0;
        if (!dm || mm < 1 || row.length !== head.length) {
          out.notes.push(`${doc.label} ${y} "${row[0]}": 날짜 · 칸 수를 읽지 못함 — 사실로 만들지 않음`);
          continue;
        }
        const d = iso(y, mm, +dm[2]!);
        if (d > ev.date) continue;
        const off = TABLE_RULES.offsets.omo_rates!;
        const cs: Cell[] = [];
        for (let k = 1; k < head.length; k++) if (row[k + off] && row[k + off] !== "...") cs.push({ h: k, r: k + off, col: head[k]!, shown: head[k]!, value: row[k + off]! });
        push({
          claim_text: `연준 공개시장조작 페이지의 목표 금리 변경 이력 표 — ${y} ${row[0]} (${d}): ${cs.map((c) => `${c.shown} ${c.value}`).join(" · ")}`,
          fact_type: "OFFICIAL_ACTION", actor: null, volatility: "STABLE", as_of: null, event_at: d,
          table: { handler: "omo_rates", header_line: L[hi]!.text, row_line: L[j]!.text, cells: cs, row_label: row[0]!, date_cell: row[0]! },
        }, [slice(i, j)], d);
      }
    });
    return out;
  }

  if (rule.handler === "fomc_calendar") {
    // 연준 회의 일정 페이지 — 사건 해의 덩어리 ("YYYY FOMC Meetings" ~ 그 해의 각주 줄). 회의 = 달 줄 + 바로 다음 날 줄 ("27-28" · "8-9*")
    const y0 = ev.date.slice(0, 4);
    const hi = L.findIndex((l) => l.text === `${y0} FOMC Meetings`);
    if (hi < 0) throw new Error(`${doc.label}: ${y0} FOMC Meetings 줄이 없다`);
    const fi = L.findIndex((l, i) => i > hi && l.text === CAL_FOOT);
    if (fi < 0) throw new Error(`${doc.label}: ${y0} 의 SEP 각주 줄이 없다`);
    const lu = L.findIndex((l) => /^Last Update: [A-Z][a-z]+ \d{1,2}, \d{4}$/.test(l.text));
    const lm = lu >= 0 ? /^Last Update: ([A-Z][a-z]+) (\d{1,2}), (\d{4})$/.exec(L[lu]!.text)! : null;
    const asOf = lm ? iso(+lm[3]!, MONTHS.indexOf(lm[1]!.toLowerCase()) + 1, +lm[2]!) : doc.published_at.slice(0, 10);
    const meets: { mi: number; month: string; days: string }[] = [];
    for (let i = hi + 1; i < fi; i++) {
      const m = L[i]!.text, d = L[i + 1]?.text ?? "";
      if (/^[A-Z][a-z]+(\/[A-Z][a-z]+)?$/.test(m) && /^\d{1,2}-\d{1,2}\*?$/.test(d)) meets.push({ mi: i, month: m, days: d });
    }
    if (!meets.length) throw new Error(`${doc.label}: ${y0} 회의 줄을 못 찾았다`);
    const last = meets.at(-1)!;
    const foot = slice(last.mi, fi); // 마지막 회의 ~ 각주 (각주 줄만으로는 해마다 같아 한 곳이 아니다)
    for (const x of meets) {
      const sep = x.days.endsWith("*");
      const pair = slice(x.mi, x.mi + 1) ?? slice(hi, x.mi + 1); // 달 · 날 두 줄이 다른 해에도 있으면 해 머리부터
      const off = TABLE_RULES.offsets.fomc_calendar!;
      push({
        claim_text: `연준 FOMC 회의 일정 페이지 (${y0} FOMC Meetings) — ${x.month} ${x.days} 회의: ${sep ? `* 표시 있음 (각주 "${CAL_FOOT}")` : "* 표시 없음 (경제 전망 SEP 각주가 붙지 않은 회의)"}`,
        fact_type: "OFFICIAL_ACTION", actor: null, volatility: "VOLATILE", as_of: asOf, event_at: null,
        table: { handler: "fomc_calendar", header_line: L[hi]!.text, row_line: x.month, cells: [{ h: 0, r: off, col: x.month, shown: x.month, value: x.days }], row_label: x.month, date_cell: lu >= 0 ? L[lu]!.text : null },
      }, [slice(hi, hi), pair, foot, ...(lu >= 0 ? [slice(lu, lu)] : [])], `${y0} ${x.month} ${x.days}`);
    }
    return out;
  }

  if (rule.handler === "pipe_blocks") {
    for (const b of pipeBlocks(doc.text)) {
      out.regions.push([L[b.header]!.start, L[b.last]!.end]);
      const head = cells(L[b.header]!.text);
      const caption = b.caption.map((c) => L[c]!.text).join(" ");
      const notes = b.notes.map((c) => L[c]!.text.replace(/^\|\s*/, "")).join(" ");
      const day = /^\d{4}-\d{2}-\d{2}/.test(doc.published_at) ? doc.published_at.slice(0, 10) : null;
      for (const ri of b.rows) {
        const row = cells(L[ri]!.text);
        const off = TABLE_RULES.offsets.pipe_blocks!;
        const cs: Cell[] = [];
        for (let k = 1; k < head.length; k++) if (row[k + off] && row[k + off] !== "…" && row[k + off] !== "...") cs.push({ h: k, r: k + off, col: head[k]!, shown: head[k]!, value: row[k + off]! });
        if (!cs.length) continue;
        push({
          claim_text: `${doc.publisher} 「${doc.title}」 의 표 "${caption}"${notes ? ` ${notes}` : ""} — ${row[0]}: ${cs.map((c) => `${c.shown} ${c.value}`).join(" · ")}`,
          fact_type: "MEASUREMENT", actor: null, volatility: day ? "VOLATILE" : "STABLE", as_of: day, event_at: null,
          table: { handler: "pipe_blocks", header_line: L[b.header]!.text, row_line: L[ri]!.text, cells: cs, row_label: row[0]! },
        }, [slice(b.caption[0] ?? b.header, ri)], `표 "${caption}" ${row[0]}`);
      }
    }
    return out;
  }
  throw new Error(`모르는 표 읽기 ${rule.handler}`);
}

/** 글 안의 표 덩어리 (MIXED) — 머리 줄이 "| " 로 시작하고 (첫 칸이 빈 칸), 아래 줄들이 머리와 칸 수가 같다. "| " 로 시작하고 칸 수가 다른 줄은 단위 설명.
 *  제목 = 머리 바로 위 줄 (그 줄이 "[" 로 시작하면 그 위 줄까지). 줄 번호는 0 부터 */
export function pipeBlocks(text: string): { caption: number[]; header: number; notes: number[]; rows: number[]; last: number }[] {
  const ls = text.split("\n");
  const out: { caption: number[]; header: number; notes: number[]; rows: number[]; last: number }[] = [];
  for (let i = 0; i < ls.length; i++) {
    if (!/^\| \S/.test(ls[i]!)) continue;
    const head = cells(ls[i]!);
    if (head.length < 2 || head[0] !== "") continue;
    const notes: number[] = [], rows: number[] = [];
    let j = i + 1;
    for (; j < ls.length && ls[j]!.includes("|"); j++) {
      const c = cells(ls[j]!);
      if (ls[j]!.startsWith("| ") && c.length !== head.length) notes.push(j);
      else if (c.length === head.length && c[0] !== "") rows.push(j);
      else break;
    }
    if (rows.length < 1) continue;
    const caption: number[] = [];
    if (i > 0 && !ls[i - 1]!.includes("|") && ls[i - 1]!.trim()) {
      if (ls[i - 1]!.startsWith("[") && i > 1 && !ls[i - 2]!.includes("|") && ls[i - 2]!.trim()) caption.push(i - 2);
      caption.push(i - 1);
    }
    out.push({ caption, header: i, notes, rows, last: j - 1 });
    i = j - 1;
  }
  return out;
}

export const MASK = TABLE_RULES.mask_line;
export const CAL_FOOT = "* Meeting associated with a Summary of Economic Projections.";

/** 연준 회의 일정 페이지의 일정 덩어리 — 첫 "YYYY FOMC Meetings" 줄 ~ 마지막 SEP 각주 줄 (줄 번호 · 0 부터). 없으면 null */
export function calendarBlock(text: string): { first: number; last: number } | null {
  const ls = text.split("\n");
  const first = ls.findIndex((l) => /^\d{4} FOMC Meetings$/.test(l));
  const last = ls.lastIndexOf(CAL_FOOT);
  return first >= 0 && last > first ? { first, last } : null;
}

/** MIXED 문서에서 코드가 읽고 모델에게는 가리는 줄 덩어리 [첫 줄, 마지막 줄] */
export function maskBlocks(url: string | null, text: string): [number, number][] {
  const r = docRule(url);
  if (r?.handler === "fomc_calendar") {
    const b = calendarBlock(text);
    return b ? [[b.first, b.last]] : [];
  }
  return pipeBlocks(text).map((b) => [b.header, b.last]);
}

/** 모델에 보낼 글. TABLE 은 보내지 않는다 (부르면 오류). MIXED 는 표 덩어리(머리 ~ 마지막 줄)를 한 줄 표시로 바꾼다. TEXT 는 그대로 */
export function modelInput(doc: { label: string; url: string | null; text: string }): string {
  const k = docKind(doc.url);
  if (k === "TABLE") throw new Error(`${doc.label}: 표 문서는 모델에 보내지 않는다 (D42)`);
  if (k === "TEXT") return doc.text;
  const ls = doc.text.split("\n");
  for (const [a, z] of maskBlocks(doc.url, doc.text).reverse()) ls.splice(a, z - a + 1, MASK);
  return ls.join("\n");
}
