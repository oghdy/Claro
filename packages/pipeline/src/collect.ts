// S-2 · 후보 모으기 — 아침 고르기를 15분으로 (D86 · MVP). 명령 하나:
//
//     pnpm --filter @claro/pipeline collect --date 2026-11-13                                   # 모델 없이: 그날 "오늘" 창의 후보 목록 + 달력 + 기다림 목록 → 한 장 (sheet.md)
//     pnpm --filter @claro/pipeline collect --date 2026-11-13 --recommend --step <Step> --budget <달러>   # + 모델이 추천 10 (배치 — 값이 반 · 대개 1 시간 안)
//     pnpm --filter @claro/pipeline collect --date 2026-11-13 --recommend --step <Step> --budget <달러> --now   # 바로 (값은 두 배)
//     … --date 2026-10-29,2026-10-30    # 여러 날 (추천은 한 배치로)      … --refetch    # 목록을 다시 받는다      … --again    # 추천을 다시 부른다
//
//   --date = **고르는 아침** (한국 날짜). 창은 그 전날 것이다 — "어제 낮 한국 + 밤사이 해외 · 월요일은 주말 포함" (collect-wait.ts)
//
// 나오는 것 (packages/pipeline/data/collect/days/<날짜>/)
//   candidates.json    그날 후보 (제목 · 주소 · 기관 · 시각 · 첨부 · 꼬리표) + 출처마다 결과 + 달력 + 기다림 목록 확인. **원문 글 없음** — 목록에 딸려 온 첫 문단은 git 밖 (.cache/collect)에만
//   recommend.raw.json 모델 출력 그대로 + 요청 지문 · 쓴 값 (--recommend 일 때)
//   sheet.md           사람이 아침에 보는 한 장
//   picks.json         사람이 고른 것을 적는 곳 (없으면 빈 틀을 만든다 · 있으면 건드리지 않는다)
//
// 지키는 것
//   - 받을 때마다 robots.ts 에 묻는다. 막으면 받지 않고 그렇게 적는다 (D40 — 우회하지 않는다). 정직한 User-Agent 하나 (fetch.ts)
//   - 받는 것은 목록 쪽뿐이다 (보도자료 본문 · 첨부 0). 받은 바이트는 git 밖 캐시 (.cache/raw)에
//   - 고르지 않는다 · 내지 않는다. 추천까지가 기계 몫이다 (D86)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cacheDir, fetchOnce, readCached, writeCached } from "./fetch.ts";
import { robotsAllows } from "./robots.ts";
import { PRICE, callMany, modeArg, needBudget, requestSha, spentOf } from "./llm.ts";
import { COLLECT_VERSION, SOURCES, kst, parseFomcCalendar, parsePipcDecisions, type FomcMeeting, type Row, type Source } from "./collect-sources.ts";
import { asOf, calendarFor, fomcEntries, inWindow, mergeCalendar, tagsOf, watchResults, windowOf, type Calendar, type Waitlist, type Window } from "./collect-wait.ts";
import { checkOutput, checkPicks, emptyPicks, recommendReq, renderSheet, type Candidate, type Day, type Picks, type RecommendRaw, type SourceReport } from "./recommend.ts";
import { RECOMMEND_MODEL, RECOMMEND_VERSION, type RecommendOut } from "./recommend-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA = join(ROOT, "packages/pipeline/data/collect");
const dayDir = (date: string) => join(DATA, "days", date);
const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
const writeJson = (p: string, v: unknown) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + "\n"); };

const PAGE_CAP = 15;   // 한 출처 · 한 날에 넘기는 쪽 수의 끝 (멈추지 않는 것을 막는 울타리 — 하루 300건)
const PIPC_PAGES = 3;  // 결정문 게시판 위쪽 몇 쪽 (쪽당 10줄 — 새 글은 위에 온다)

// ── 받기 (robots → 캐시 → GET 한 번) ─────────────────────────────────────────────────────────────────
type Got = { ok: true; body: string } | { ok: false; status: SourceReport["status"]; why: string };
const todayKst = () => kst(Date.now()).date;
/** 지난 날짜가 주소에 든 목록은 바뀌지 않는다 → 이름에 그 날짜. 최신 목록 · 피드는 받은 날을 이름에 (같은 날 다시 돌리면 다시 받지 않는다) */
async function get(url: string, label: string, refetch: boolean): Promise<Got> {
  const r = await robotsAllows(url);
  if (!r.ok) return { ok: false, status: "robots 가 막음", why: r.why };
  let got = refetch ? null : readCached(ROOT, label);
  if (!got) {
    got = await fetchOnce(url);
    if (got.meta.error || got.meta.http_status !== 200) return { ok: false, status: "못 받음", why: got.meta.error ?? `HTTP ${got.meta.http_status}` };
    writeCached(ROOT, label, got);
  }
  return { ok: true, body: new TextDecoder("utf-8").decode(got.bytes) };
}

async function walk(s: Source, w: Window, refetch: boolean): Promise<{ rows: Row[]; report: SourceReport }> {
  const rows: Row[] = [];
  const rep: SourceReport = { id: s.id, name: s.name, origin: s.origin, status: "됨", requests: 0, rows: 0, in_window: 0, why: "" };
  const fail = (g: Extract<Got, { ok: false }>) => { rep.status = g.status; rep.why = g.why; };
  const today = todayKst();
  if (s.by === "date") {
    for (const date of w.kr_dates) for (let page = 1; page <= PAGE_CAP; page++) {
      const g = await get(s.url({ date, page }), `collect_${s.id}_${date}_p${page}${date < today ? "" : `_at${today}`}`, refetch);
      rep.requests++;
      if (!g.ok) { fail(g); break; }
      const got = s.parse(g.body).filter((r) => r.date === date);
      const fresh = got.filter((r) => !rows.some((x) => x.native_id === r.native_id));
      rows.push(...fresh);
      if (got.length < s.page_size || !fresh.length) break;
    }
  } else if (s.by === "paged") {
    const first = w.kr_dates[0]!;
    for (let page = 1; page <= PAGE_CAP; page++) {
      const g = await get(s.url({ date: first, page }), `collect_${s.id}_p${page}_at${today}`, refetch);
      rep.requests++;
      if (!g.ok) { fail(g); break; }
      const got = s.parse(g.body);
      rows.push(...got.filter((r) => !rows.some((x) => x.native_id === r.native_id)));
      if (!got.length || got.some((r) => r.date < first)) break;
    }
  } else {
    const g = await get(s.url({ date: w.pick, page: 1 }), `collect_${s.id}_at${today}`, refetch);
    rep.requests++;
    if (g.ok) rows.push(...s.parse(g.body)); else fail(g);
  }
  rep.rows = rows.length;
  if (rep.status === "됨" && !rows.length && s.by !== "date") { rep.status = "줄 0"; rep.why = "목록에서 한 줄도 못 읽었다 — 쪽의 꼴이 바뀌었을 수 있다"; }
  if (rep.status === "됨" && s.by === "feed" && rows.length) {
    const oldest = rows.reduce((a, r) => (r.at && r.at < a ? r.at : a), rows[0]!.at ?? "");
    if (oldest && Date.parse(oldest) > w.from_ms) rep.why = `이 피드는 ${kst(Date.parse(oldest)).date} 뒤 것만 준다 — 창의 앞쪽을 못 본다`;
  }
  return { rows, report: rep };
}

// ── 겹친 것 묶기 · 번호 ──────────────────────────────────────────────────────────────────────────────
const norm = (t: string) => t.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
const RANK = ["kftc-press", "fss-press", "korea-briefing", "korea-press"];   // 같은 발표가 여러 곳에 있으면 낸 기관의 게시판 → 브리핑 → 보도자료 차례로 남긴다
const rank = (s: string) => { const i = RANK.indexOf(s); return i < 0 ? RANK.length : i; };
type Merged = Row & { also_at: Candidate["also_at"] };
/** 같은 자료를 여러 부처가 올린다 (제목이 같다 — S-1 ⑧). 하나로 묶고 다른 곳은 also_at 에. 첫 문단 · 첨부는 있는 쪽 것을 받는다 */
export function dedupe(rows: Row[]): Merged[] {
  const out = new Map<string, Merged>();
  for (const r of [...rows].sort((a, b) => rank(a.source) - rank(b.source))) {
    const k = norm(r.title);
    const hit = out.get(k);
    if (!hit) { out.set(k, { ...r, also_at: [] }); continue; }
    hit.also_at.push({ source: r.source, org: r.org, url: r.url });
    hit.lead ??= r.lead;
    hit.attach ??= r.attach;
  }
  return [...out.values()];
}
const keyOf = (r: Pick<Row, "source" | "native_id">) => `${r.source}:${r.native_id}`;
/** 번호 (c001 …). 그날 파일이 이미 있으면 같은 줄은 같은 번호를 받는다 — 사람이 picks.json 에 적은 번호가 다시 돌려도 안 바뀌게 */
export function assignIds<T extends Pick<Row, "source" | "native_id">>(rows: T[], prev: { id: string; source: string; native_id: string }[]): (T & { id: string })[] {
  const old = new Map(prev.map((p) => [keyOf(p), p.id]));
  let n = prev.reduce((a, p) => Math.max(a, Number(p.id.slice(1)) || 0), 0);
  return rows.map((r) => ({ ...r, id: old.get(keyOf(r)) ?? `c${String(++n).padStart(3, "0")}` }));
}
/** git 에 두는 판 — 첫 문단을 뺀다 (D40 · 권리) */
export const publicCopy = (day: Day): Day => ({ ...day, candidates: day.candidates.map((c) => ({ ...c, lead: null })) });

// ── 하루 ─────────────────────────────────────────────────────────────────────────────────────────────
function carried(pick: string): { from: string; rows: Candidate[] } | null {
  const days = join(DATA, "days");
  if (!existsSync(days)) return null;
  const prev = readdirSync(days).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < pick).sort().pop();
  if (!prev || !existsSync(join(days, prev, "picks.json")) || !existsSync(join(days, prev, "candidates.json"))) return null;
  const p = readJson<Picks>(join(days, prev, "picks.json"));
  const d = readJson<Day>(join(days, prev, "candidates.json"));
  return { from: prev, rows: d.candidates.filter((c) => p.tomorrow.includes(c.id)) };
}

export async function collectDay(pick: string, refetch: boolean): Promise<Day> {
  const w = windowOf(pick);
  console.log(`collect ${pick} — ${w.say}`);
  const { wl, stories } = asOf(readJson<Waitlist>(join(DATA, "waitlist.json")), pick);
  const cal = readJson<Calendar>(join(DATA, "calendar.json"));
  const today = todayKst();

  const reports: SourceReport[] = [];
  const all: Row[] = [];
  for (const s of SOURCES) {
    const { rows, report } = await walk(s, w, refetch);
    const inw = rows.filter((r) => inWindow(w, r));
    report.in_window = inw.length;
    reports.push(report);
    all.push(...inw);
    console.log(`  ${s.name.padEnd(24)} ${report.status} · 물음 ${report.requests} · 줄 ${report.rows} · 창 ${report.in_window}${report.why ? ` · ${report.why}` : ""}`);
  }

  // 기다림 목록의 확인 — 연준 달력 · 개인정보위 결정문 (후보가 아니다)
  let fomc: FomcMeeting[] | null = null;
  const fc = await get("https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", `collect_fed-calendar_at${today}`, refetch);
  if (fc.ok) fomc = [Number(pick.slice(0, 4)), Number(pick.slice(0, 4)) + 1].flatMap((y) => parseFomcCalendar(fc.body, y));
  let pipc: Row[] | null = [];
  for (let page = 1; page <= PIPC_PAGES && pipc; page++) {
    const g = await get(`https://www.pipc.go.kr/np/default/agenda.do?mCode=E030010000&page=${page}`, `collect_pipc-decisions_p${page}_at${today}`, refetch);
    if (!g.ok) { pipc = page === 1 ? null : pipc; break; }
    pipc.push(...parsePipcDecisions(g.body));
  }
  console.log(`  기다림 목록 확인 — 연준 달력 ${fomc ? `회의 ${fomc.length}줄` : "못 받음"} · 개인정보위 결정문 ${pipc ? `${pipc.length}줄` : "못 받음"}`);

  const entries = mergeCalendar(cal.entries, fomc ? fomcEntries(fomc) : []);
  const { due, ahead } = calendarFor(w, entries);

  const dir = dayDir(pick);
  const prevIds = existsSync(join(dir, "candidates.json")) ? readJson<Day>(join(dir, "candidates.json")).candidates : [];
  const hint = new Map(SOURCES.map((s) => [s.id, s]));
  const merged = dedupe(all);
  const over = carried(pick);
  const overNew = (over?.rows ?? []).filter((c) => !merged.some((m) => keyOf(m) === keyOf(c)));
  const list = assignIds<Merged>([...merged, ...overNew.map((c) => ({ ...c, lead: c.lead ?? null }))], prevIds);
  const candidates: Candidate[] = list.map((r) => ({
    ...r, origin: hint.get(r.source)!.origin, rights_hint: hint.get(r.source)!.rights_hint,
    tags: [...tagsOf(r, wl, due), ...(over && overNew.some((c) => keyOf(c) === keyOf(r)) ? [{ type: "어제 넘친 것" as const, from: over.from }] : [])],
  }));

  const day: Day = {
    version: COLLECT_VERSION, pick, window: w.say, made_at: new Date().toISOString(),
    sources: reports, candidates,
    calendar: { due, ahead, unknown: cal.unknown },
    watch: watchResults(wl, { fomc, pipc }, pick),
    stories,
  };
  writeJson(join(dir, "candidates.json"), publicCopy(day));
  writeJson(join(cacheDir(ROOT, "collect"), `${pick}.candidates.json`), day);   // 첫 문단이 든 판 — git 밖
  console.log(`  후보 ${candidates.length} (국내 ${candidates.filter((c) => c.origin === "국내").length} · 해외 ${candidates.filter((c) => c.origin === "해외").length}) · 이어질 거리 ${candidates.filter((c) => c.tags.some((t) => t.type === "이어질 거리")).length} · 달력 (창) ${due.length}`);
  return day;
}

function finish(day: Day, raw: RecommendRaw | null) {
  const dir = dayDir(day.pick);
  const chk = raw ? checkOutput(JSON.stringify(raw.output), day) : null;
  const sheet = renderSheet(publicCopy(day), raw && chk?.out ? { out: chk.out, problems: chk.problems, cost_usd: raw.cost_usd, model: raw.model ?? raw.model_requested } : null);
  writeFileSync(join(dir, "sheet.md"), sheet);
  const pp = join(dir, "picks.json");
  if (!existsSync(pp)) writeJson(pp, emptyPicks(day.pick));
  const picks = readJson<Picks>(pp);
  console.log(`  한 장 → ${join("packages/pipeline/data/collect/days", day.pick, "sheet.md")} (${sheet.split("\n").length} 줄)${chk?.problems.length ? ` · 이상한 점 ${chk.problems.length}` : ""}`);
  if (picks.picked.length || picks.tomorrow.length) for (const s of checkPicks(picks, day, raw?.output ?? null)) console.log(`  고른 것: ${s}`);
  else console.log(`  고른 것: 아직 없다 — picks.json 에 사람이 적는다`);
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const dates = (opt("--date") ?? "").split(",").filter(Boolean);
  if (!dates.length) throw new Error("collect --date <YYYY-MM-DD>[,…] [--recommend --step <Step> --budget <달러> [--now]] [--refetch] [--again]");
  const refetch = argv.includes("--refetch");
  const days: Day[] = [];
  for (const d of dates) days.push(await collectDay(d, refetch));
  const rawPath = (d: string) => join(dayDir(d), "recommend.raw.json");
  const stored = (day: Day, sha?: string): RecommendRaw | null => {
    if (!existsSync(rawPath(day.pick))) return null;
    const r = readJson<RecommendRaw>(rawPath(day.pick));
    return sha == null || r.request_sha256 === sha ? r : null;
  };
  if (!argv.includes("--recommend")) {
    for (const day of days) finish(day, stored(day));   // 전에 받은 추천이 있으면 그것으로 한 장을 다시 그린다 (모델 안 부름)
    return;
  }
  const budget = needBudget(argv);
  const mode = modeArg(argv);
  const price = PRICE[RECOMMEND_MODEL]!;
  const reqs = days.map((day) => recommendReq(day, price));
  const need = days.map((day, i) => (argv.includes("--again") ? true : !stored(day, requestSha(reqs[i]!))));
  const send = reqs.filter((_, i) => need[i]);
  console.log(`추천 — ${RECOMMEND_MODEL} · ${RECOMMEND_VERSION} · ${mode === "batch" ? "배치" : "즉시"} · 부를 것 ${send.length} / ${days.length} (같은 요청의 저장한 출력은 다시 부르지 않는다) · 넉넉한 어림 $${send.reduce((a, r) => a + (r.est_usd ?? 0) * (mode === "batch" ? 0.5 : 1), 0).toFixed(2)} · Step "${budget.step}" 쓴 돈 $${spentOf(budget.step).toFixed(3)} / 상한 $${budget.budget}`);
  const results = send.length ? await callMany(send, { mode, budget, conc: 2 }) : [];
  let k = 0;
  days.forEach((day, i) => {
    if (!need[i]) return finish(day, stored(day));
    const r = results[k++]!;
    if (!r.ok || !r.text) { console.log(`  ${day.pick} 추천 실패 — ${r.error}${r.skipped ? " (보내지 않았다)" : ""}`); return finish(day, null); }
    const chk = checkOutput(r.text, day);
    if (!chk.out) { console.log(`  ${day.pick} 추천 실패 — ${chk.problems.join(" · ")}`); return finish(day, null); }
    const raw: RecommendRaw = { prompt_version: RECOMMEND_VERSION, model: r.model, model_requested: RECOMMEND_MODEL, effort: reqs[i]!.effort, mode: r.mode, batch_id: r.batch_id, request_sha256: r.request_sha256, at: new Date().toISOString(), usage: r.usage, cost_usd: Number(r.cost_usd.toFixed(6)), output: chk.out as RecommendOut };
    writeJson(rawPath(day.pick), raw);
    console.log(`  ${day.pick} 추천 ${chk.out.recommended.length} · $${r.cost_usd.toFixed(4)} · 입력 ${r.usage?.input_tokens ?? "?"} (+캐시 ${((r.usage?.cache_read_input_tokens ?? 0) + (r.usage?.cache_creation_input_tokens ?? 0))}) · 출력 ${r.usage?.output_tokens ?? "?"}`);
    finish(day, raw);
  });
  console.log(`Step "${budget.step}" 쓴 돈 $${spentOf(budget.step).toFixed(4)} / 상한 $${budget.budget}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
