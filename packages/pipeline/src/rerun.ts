// W-1 — 다시 돌리기 한 번에. 새 문서 하나(10월 회의록)를 사건에 더하고 수집 → 사실 추출 → BLS 변화율 → Coverage · 스토리라인 → 해석 · 반증 을 차례로 돈다.
//
//     pnpm --filter @claro/pipeline rerun FOMC-20261028 --doc MIN-10              # 마른 실행 (기본) — 단계마다 무엇을 다시 부르고 무엇을 재사용하나 · 예상 비용. 부르지 않고 쓰지 않는다
//     pnpm --filter @claro/pipeline rerun FOMC-20261028 --doc MIN-10 --go --step W-5 --budget 3   # 돈다 — 단계마다 검사(verify-*) · 검사가 실패하면 거기서 멈춘다 (다음 단계로 넘기지 않는다)
//
//     --step 이름 --budget 달러   장부의 Step 칸과 그 Step 의 상한 (W1-a — 부르는 쪽이 정한다). 모델을 부르는 --go 에는 꼭 준다. 마른 실행이 알맞은 값을 보인다
//     --now                  즉시 부른다. 기본은 배치 (W-6 · D51 — 값이 반 · 단계마다 배치 하나 · 대개 1 시간 안 · 최대 24 시간. 끊겨도 같은 명령을 다시 돌리면 보낸 배치에 다시 붙는다)
//
//     --keep-derive          해석 후보를 다시 부르지 않는다 (앞 해석을 반증만 다시). 기본은 다시 부른다 — 새 문서가 "왜" 를 세울 수 있는데, 반증은 해석을 좁힐 뿐 세우지 못한다
//     --counter unresolved   반증을 UNRESOLVED 물음이 있는 해석만 (--keep-derive 와 함께만). 기본 = 전부 — 새 사실은 어느 해석이든 좁히거나 깰 수 있다
//     --like LABEL           아직 가져오지 않은 문서의 비용 추정 본보기 (기본 MIN-09 — 9월 회의록)
//     --pretend-new          마른 시험: 이미 저장된 --doc 을 처음 더하는 문서처럼 계획을 보인다. --go 와 함께면 저장된 출력을 재사용해 끝까지 돈다 (모델 0 · 네트워크 0)
//
// 규칙
//   - 단계마다 그 단계의 명령(p2 · p3 · bls-rates · p4 · p5 — 사람이 따로 돌리는 것과 같은 명령)을 자식 프로세스로 돌린다. 이 파일은 순서 · 판단 · 멈춤만 한다
//   - 앞 단계의 저장된 출력은 그대로 쓴다. 모델은 새 문서 · 바뀐 입력에 닿는 것만 부른다 (각 명령이 이미 그렇게 한다 — 저장된 출력의 입력 sha 를 댄다)
//   - 아무것도 바뀌지 않은 단계는 쓰지 않고 --check 로 같은지만 본다
//   - 못 가져옴으로 기록된 문서는 다시 두드리지 않는다 (D40 · D41) — 멈추고 사람에게
//   - 게이트는 사람이다. 이 명령은 초안을 다시 지을 뿐이다 — 사람이 고친 것은 logs/correction-log.jsonl 에 (CorrectionEntry · §10.3)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "./extract.ts";
import { BATCH_FACTOR, DEFAULT_MODEL, budgetArg, modeArg, passArgs, pendingBatches, spent, spentOf, type Budget, type Mode } from "./llm.ts";
import { EVENTS, extractUpper, pending as p3pending } from "./p3.ts";
import { pending as p4pending } from "./p4.ts";
import { readCheckpoints } from "./p5.ts";
import { DERIVE_VERSION, COUNTER_VERSION } from "./p5-prompt.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PKG = join(ROOT, "packages/pipeline");
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const safe = (label: string) => label.replace(/[^\w.-]/g, "_");
const usd = (x: number | null | undefined) => (x == null ? "  —  " : `$${x.toFixed(2)}`);

type Item = { label: string; group: string; title: string; publisher: string; url: string; skip?: string; role?: string; published_at?: string };
type Doc = { label: string; status: "STORED" | "NOT_FETCHED"; why: string | null; text_sha256: string | null; text_length: number | null };
type Call = { what: string; cmd: string[]; upper: number | null; last: number | null };

export type Opts = { code: string; doc: string; go: boolean; keepDerive: boolean; counter: "all" | "unresolved"; like: string; pretend: boolean; mode: Mode; budget: Budget | null };

export function parseArgs(argv: string[]): Opts {
  const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const valued = new Set(["--doc", "--like", "--counter", "--step", "--budget"]);
  const code = argv.find((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1] ?? ""));
  const doc = opt("--doc");
  if (!code || !EVENTS[code]) throw new Error(`사건 code — ${Object.keys(EVENTS).join(" · ")}`);
  if (EVENTS[code]!.kind !== "pack") throw new Error(`${code} 는 소스 팩 사건이 아니다 — 다시 돌리기는 소스 팩 사건만`);
  if (!doc) throw new Error("새로 더할 문서의 label — --doc MIN-10 (pack.json items 에 사람이 먼저 적는다)");
  const counter = (opt("--counter") ?? "all") as Opts["counter"];
  if (counter !== "all" && counter !== "unresolved") throw new Error("--counter all | unresolved");
  if (counter === "unresolved" && !argv.includes("--keep-derive")) throw new Error("--counter unresolved 는 --keep-derive 와 함께만 — 해석을 다시 부르면 해석이 새로 나와 전부 반증한다");
  return { code, doc, go: argv.includes("--go"), keepDerive: argv.includes("--keep-derive"), counter, like: opt("--like") ?? "MIN-09", pretend: argv.includes("--pretend-new"), mode: modeArg(argv), budget: budgetArg(argv) };
}

// ── 지난 실물 비용 (저장한 모델 출력의 cost_usd) — 추정의 본보기. 청구서가 아니다 ────────────────────────────
function lastCosts(code: string, like: string) {
  const d = join(PKG, "data/events", code);
  // 저장한 출력의 cost_usd 를 즉시 값으로 (배치로 받은 것은 배치 값이 적혀 있다 — W-6). 추정은 즉시 값에서 낸다
  const rj = (p: string) => {
    if (!existsSync(p)) return null;
    const r = readJson<{ cost_usd: number; mode?: Mode; items?: unknown[]; claims?: unknown[]; prompt_version: string; called_at: string }>(p);
    return r.mode === "batch" ? { ...r, cost_usd: r.cost_usd / BATCH_FACTOR } : r;
  };
  const raws = (dir: string, pre: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.startsWith(pre) && n.endsWith(".json")).map((n) => rj(join(dir, n))!) : []);
  const likeRaw = raws(join(d, "p3/raw"), `${safe(like)}.${DEFAULT_MODEL}.`).sort((a, b) => a.called_at.localeCompare(b.called_at)).at(-1) ?? null;
  const assigns = raws(join(d, "p4/raw"), "assign.");
  const perFact = assigns.length ? assigns.reduce((a, r) => a + r.cost_usd, 0) / assigns.reduce((a, r) => a + (r.items?.length ?? 0), 0) : null;
  const derive = raws(join(d, "p5/raw"), "derive.").sort((a, b) => a.called_at.localeCompare(b.called_at)).at(-1) ?? null;
  const counters = raws(join(d, "p5/raw"), "counter.");
  const fullCounter = counters.sort((a, b) => (b.claims?.length ?? 0) - (a.claims?.length ?? 0))[0] ?? null;
  const graph = readJson<{ per_source: Record<string, { verified: number }> }>(join(d, "p3/graph.json"));
  return {
    extract: likeRaw?.cost_usd ?? null,
    likeFacts: graph.per_source[like]?.verified ?? null,
    merge: rj(join(d, "p3", `merge.${DEFAULT_MODEL}.p3-merge-1.json`))?.cost_usd ?? null,
    assignPerFact: perFact,
    unslotted: rj(join(d, "p4/raw", `unslotted.${DEFAULT_MODEL}.p4-unslotted-1.json`))?.cost_usd ?? null,
    derive: derive?.cost_usd ?? null,
    counter: fullCounter?.cost_usd ?? null,
  };
}

// ── 출력 ──────────────────────────────────────────────────────────────────────────────────────────
const say = (s = "") => console.log(s);
const line = (tag: string, s: string) => say(`  ${tag.padEnd(6)} ${s}`);

export class Stop extends Error {}

function run(cmd: string[], cwd: string): number {
  say(`  $ ${cmd.join(" ")}`);
  const r = spawnSync(cmd[0]!, cmd.slice(1), { cwd, stdio: "inherit" });
  return r.status ?? 1;
}

/** 검사 · 짓기 명령 하나 — 마른 실행이면 보이기만. 실패하면 멈춘다 */
export function step(o: Pick<Opts, "go">, cmd: string[], cwd = PKG): void {
  if (!o.go) return line("하기", cmd.join(" "));
  const rc = run(cmd, cwd);
  if (rc !== 0) throw new Stop(`${cmd.join(" ")} — exit ${rc}. 여기서 멈춘다 (다음 단계로 넘기지 않는다)`);
}
const node = (f: string, ...a: string[]) => ["node", `src/${f}`, ...a];
const py = (f: string, ...a: string[]) => ["python3", `scripts/${f}`, ...a];

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const { code, doc } = o;
  const evd = join(PKG, "data/events", code);
  const conf = EVENTS[code]!;
  const last = lastCosts(code, o.pretend ? doc : o.like);
  const calls: Call[] = [];   // 이번에 부르는 것
  const would: Call[] = [];   // 마른 시험 — 이 문서가 처음이었다면 불렀을 것
  const plan = (c: Call, reuse: boolean) => {
    would.push(c);
    if (reuse) return line("재사용", `${c.what} — 저장된 출력 (처음 더하는 문서였다면 부른다 · 상한 ${usd(c.upper)} · 지난 실물 ${usd(c.last)}${o.mode === "batch" && c.last != null ? ` → 배치 ${usd(c.last * BATCH_FACTOR)}` : ""})`);
    calls.push(c);
    line("부름", `${c.what} · 상한 ${usd(c.upper)} · 지난 실물 ${usd(c.last)}${o.mode === "batch" && c.last != null ? ` → 배치 ${usd(c.last * BATCH_FACTOR)}` : ""}`);
  };
  const call = (c: Call, reuse = false) => {
    plan(c, reuse);
    if (!reuse && o.go) {
      if (!o.budget) throw new Stop(`${c.what} — 모델을 부르려면 --step <이름> --budget <달러> (W1-a). 마른 실행이 알맞은 값을 보인다`);
      const rc = run([...c.cmd, ...passArgs(o.budget, o.mode)], PKG);
      if (rc !== 0) throw new Stop(`${c.what} — exit ${rc}. 멈춘다`);
    }
  };
  const stepName = o.budget?.step ?? null;
  const before = {
    spentStep: stepName ? spentOf(stepName) : 0, spent: spent(), graphSha: sha256(readFileSync(join(evd, "p3/graph.json"), "utf8")),
    graph: readJson<{ facts: { fact_id: string; label: string }[] }>(join(evd, "p3/graph.json")),
    coverage: readJson<{ slot_checks: { slot: string; status: string }[] }>(join(evd, "p4/coverage.json")),
    claims: readJson<{ counts: Record<string, unknown>; graph_sha256: string }>(join(evd, "p5/claims.json")),
  };

  say(`rerun ${code} --doc ${doc} — ${o.go ? "돈다" : "마른 실행 (부르지 않고 쓰지 않는다 — 돌리려면 --go)"}${o.pretend ? " · 마른 시험 (--pretend-new)" : ""}`);
  say(`  ${o.budget ? `장부 Step "${o.budget.step}" · 이 Step 에서 쓴 돈 $${before.spentStep.toFixed(2)} · 상한 $${o.budget.budget} (멈춤 $${o.budget.stopAt})` : "장부 Step · 상한 — 아직 안 줌 (--step 이름 --budget 달러 · 모델을 부르는 --go 에 꼭)"} · 장부 합 $${before.spent.toFixed(2)}`);
  say(`  부르는 길: ${o.mode === "batch" ? "배치 (기본 · 값이 반 · 단계마다 배치 하나 — 대개 1 시간 안 · 최대 24 시간. 끊겨도 같은 명령을 다시 돌리면 보낸 배치에 다시 붙는다)" : "즉시 (--now)"}`);
  const pend = pendingBatches();
  if (pend.length) say(`  아직 결과를 받지 않은 배치 ${pend.length}: ${pend.map((b) => `${b.batch_id} (${b.step} · 요청 ${b.requests.length} · ${b.created_at.slice(0, 16)})`).join(" · ")} — 같은 요청이면 다시 붙는다`);
  say(`  판: 해석 ${DERIVE_VERSION} · 반증 ${COUNTER_VERSION}`);

  try {
    // ── 1 수집 (P-2 — pack.ts) ─────────────────────────────────────────────────────────────────
    say("\n① 수집 (p2 · pack.ts)");
    const pack = readJson<{ items: Item[] }>(join(evd, "pack.json"));
    const item = pack.items.find((i) => i.label === doc);
    if (!item) {
      const msg = `pack.json items 에 ${doc} 가 없다 — 사람이 목록에 더한다 (P-2 목록의 모양: label · group "회의 뒤" · title · publisher · url · slots · why · url_basis · role "record"(이 회의의 회의록이면)). ` +
        `published_at · published_evidence 는 가져온 뒤 저장한 글에서 찾아 적는다 (pack.ts 가 없으면 멈추고 첫 줄을 보여 준다)`;
      if (o.go) throw new Stop(msg);
      line("사람", `${msg} — 마른 실행은 더했다 치고 계속 본다`);
    }
    if (item?.skip) throw new Stop(`${doc}: 요청하지 않기로 한 항목이다 (skip — ${item.skip})`);
    if (item?.group === "스토리라인" && !conf.storyline?.docs.includes(doc)) throw new Stop(`${doc}: 스토리라인 문서는 p3.ts EVENTS 의 storyline.docs 에도 적어야 한다 (사람 — 범위가 다르다 · P3-h)`);
    const recs = readJson<{ documents: Doc[] }>(join(evd, "fetch.json")).documents;
    const rec = recs.find((d) => d.label === doc);
    const failed = existsSync(join(PKG, ".cache/events", code, "raw", `${safe(doc)}.fail.json`));
    if (rec?.status === "NOT_FETCHED" || (!rec && failed)) {
      throw new Stop(`${doc}: 못 가져옴으로 기록됐다 (${rec?.why ?? ".fail.json"}) — 다시 두드리지 않는다 (D40 · D41). 다시 시도할지는 사람이 정한다: pnpm --filter @claro/pipeline p2 ${code} --retry`);
    }
    // fetch.json 에 STORED 인데 store.json 에 Source 가 없다 = 앞 실행이 published_at 이 없어 멈췄다 (pack.ts 는 가져온 기록을 먼저 쓴다) — pack.ts 를 다시 (네트워크 0 · 캐시)
    const hasSource = readJson<{ sources: { label: string }[] }>(join(evd, "store.json")).sources.some((x) => x.label === doc);
    const packStep = () => {
      try {
        step(o, node("pack.ts", code));
      } catch (e) {
        if (e instanceof Stop) throw new Stop(`${e.message} — published_at 이 없어 멈췄다면: 저장한 글(위 첫 줄)에서 날짜를 찾아 pack.json 의 ${doc} 에 published_at · published_evidence (글 그대로) 를 적고 같은 명령을 다시 (가져온 바이트는 캐시에 있다 — 다시 받지 않는다)`);
        throw e;
      }
    };
    if (rec?.status === "STORED" && !hasSource) {
      line("짓기", `${doc} 는 가져왔지만 Source 가 없다 (published_at 을 적기 전에 멈춘 실행) — pack.ts 다시 (캐시 · 네트워크 0)`);
      packStep();
    } else if (rec?.status === "STORED" && !o.pretend) line("재사용", `${doc} 저장됨 · ${rec.text_length}자 · sha ${rec.text_sha256!.slice(0, 12)}`);
    else if (rec?.status === "STORED") line("재사용", `${doc} 저장됨 (마른 시험: 처음이면 robots.txt + GET 1 · 원문이 바뀌지 않으면 같은 해시)`);
    else {
      line("가져옴", `${item?.url ?? "(목록의 주소)"} — robots.txt 확인 + GET 1 (정직한 UA · 다른 문서는 기록 그대로)`);
      packStep();
    }
    step(o, py("verify-source-pack.py"), ROOT);
    // 이 문서가 어느 갈래로 읽히나 — 회의록은 "회의 뒤 발언" 갈래가 아니다 (W-1 판단 · 로그 ④)
    const after = conf.after_docs?.includes(doc);
    if (item?.role === "record") line("범위", `${doc} = 이 회의의 기록 (role "record") — P-3 은 기본 범위 (직전 회의 ~ 사건 날 · event_at 은 회의 날) · P-5 프롬프트는 [뒤 · 회의 기록]`);
    else if (after) line("범위", `${doc} = 회의 뒤 발언 (p3.ts EVENTS after_docs) — event_at 은 말한 날`);
    else line("범위", `${doc} — 기본 범위. 이 회의의 회의록이면 pack.json item 에 role "record" 를 적는다 (P-5 가 [뒤] 를 "회의 때 알 수 없던 것" 으로 읽지 않게)`);
    const schema = readJson<{ source_priority: string[] }>(join(PKG, "coverage-schema.json"));
    if (!schema.source_priority.includes(doc)) line("알림", `coverage-schema.json source_priority 에 ${doc} 가 없다 — 슬롯의 대표 사실을 고를 때 맨 뒤 (사람이 정한다 · 판단 아님)`);

    // ── 2 사실 추출 (P-3b — p3.ts) ─────────────────────────────────────────────────────────────
    say("\n② 사실 추출 (p3 · Opus · 프롬프트 판은 p3-prompt.ts)");
    const fresh = !rec || rec.status !== "STORED" || !hasSource;
    let p3 = fresh && !o.go ? null : p3pending(code); // --go 면 ① 이 이미 가져왔다
    const others = (p3?.extract ?? []).filter((x) => x.label !== doc);
    if (others.length) throw new Stop(`새 문서 밖의 문서 ${others.map((x) => x.label).join(" · ")} 도 쓸 수 있는 출력이 없다 — 프롬프트 판이 바뀌었나? 여러 문서를 다시 부르는 것은 사람이 정한다 (p3 --call --only …)`);
    const ex = p3?.extract.find((x) => x.label === doc);
    const exCall: Call = { what: `${doc} 사실 추출 1`, cmd: node("p3.ts", code, "--call", "--only", doc), upper: ex?.upper_usd ?? (o.pretend ? extractUpper(code, doc) : null), last: last.extract };
    if (fresh || ex) call(exCall);
    else if (o.pretend) call(exCall, true);
    else line("재사용", `${doc} 사실 추출 — 저장된 출력이 지금 판의 요청과 같다`);
    if (o.go && (fresh || ex)) p3 = p3pending(code);
    const mergeCall: Call = { what: "같은 사실 묶음 제안 1 (사실 전부를 보낸다 — 새 사실이 입력을 바꾼다)", cmd: node("p3.ts", code, "--merge-call"), upper: p3?.merge_upper_usd ?? null, last: last.merge };
    if (!p3 || p3.merge === "unknown") call(mergeCall);
    else if (p3.merge !== "same") call(mergeCall);
    else if (o.pretend) call(mergeCall, true);
    else line("재사용", "묶음 제안 — 입력이 지금 사실 목록과 같다");
    if (o.go) p3 = p3pending(code);
    const graphSame = p3?.graph === "same";
    step(o, graphSame ? node("p3.ts", code, "--check") : node("p3.ts", code));
    step(o, py("verify-fact-graph.py"), ROOT);
    const graphChanged = o.go ? sha256(readFileSync(join(evd, "p3/graph.json"), "utf8")) !== before.graphSha : !graphSame;

    // ── 3 BLS 변화율 (W-3 — bls-rates.ts · 계산 기록 · 모델 · API 0) ─────────────────────────────
    say("\n③ BLS 변화율 기록 (bls-rates · 연준 인용 대조가 그래프를 읽는다)");
    step(o, graphChanged ? node("bls-rates.ts", code) : node("bls-rates.ts", code, "--check"));
    step(o, py("verify-bls-rates.py"), ROOT);

    // ── 4 Coverage · 스토리라인 (P-4 — p4.ts) ──────────────────────────────────────────────────
    say("\n④ Coverage · 스토리라인 (p4)");
    let p4 = o.go || !graphChanged ? p4pending(code) : null;
    const nNew = p4 && !o.pretend ? p4.assign.length : last.likeFacts;
    const assignCall: Call = { what: `요소 붙이기 — 새 모델 사실 ${p4 && !o.pretend ? p4.assign.length : `≈${nNew ?? "?"} (본보기 ${o.pretend ? doc : o.like} 의 사실 수)`}`, cmd: node("p4.ts", code, "--assign-call"), upper: p4 && !o.pretend ? p4.assign_upper_usd : null, last: last.assignPerFact != null && nNew != null ? last.assignPerFact * nNew : null };
    if (!p4 || p4.assign.length) call(assignCall);
    else if (o.pretend) call(assignCall, true);
    else line("재사용", "요소 붙이기 — 모든 모델 사실에 저장된 붙임이 있다");
    if (o.go) p4 = p4pending(code);
    const unsCall: Call = { what: "Unslotted 묶음 후보 1 (슬롯 밖 사실 목록이 바뀌면)", cmd: node("p4.ts", code, "--unslotted-call"), upper: p4?.unslotted_upper_usd ?? null, last: last.unslotted };
    if (!p4 || p4.unslotted === "unknown" || p4.unslotted !== "same") call(unsCall);
    else if (o.pretend) call(unsCall, true);
    else line("재사용", "Unslotted 제안 — 입력이 같다");
    if (o.go) p4 = p4pending(code);
    step(o, p4 && p4.built === "same" ? node("p4.ts", code, "--check") : node("p4.ts", code));
    step(o, py("verify-coverage.py"), ROOT);

    // ── 5 해석 · 반증 (P-5 — p5.ts) ───────────────────────────────────────────────────────────
    say("\n⑤ 해석 · 반증 (p5 · Opus · effort high)");
    const graphNow = sha256(readFileSync(join(evd, "p3/graph.json"), "utf8"));
    const p5stale = o.go ? readJson<{ graph_sha256: string }>(join(evd, "p5/claims.json")).graph_sha256 !== graphNow : graphChanged;
    const cps = readCheckpoints(code).filter((k) => k.status === "OPEN");
    const deriveCall: Call = { what: "해석 후보 1 (그래프 전체를 본다)", cmd: node("p5.ts", code, "--derive-call"), upper: null, last: last.derive };
    const unresolved = (() => {
      const cj = readJson<{ claims: { label: string; checks: { outcome: string }[] }[]; claims_d5: { label: string; checks: { outcome: string }[] }[] }>(join(evd, "p5/claims.json"));
      return [...cj.claims, ...cj.claims_d5].filter((c) => c.checks.some((k) => k.outcome === "UNRESOLVED")).map((c) => c.label);
    })();
    const only = o.keepDerive && o.counter === "unresolved" ? unresolved : null;
    const counterCall: Call = {
      what: `반증 1 — 해석 ${only ? `${only.length} (UNRESOLVED 가 있는 것: ${only.join(" ")})` : "전부"}${cps.length ? ` + 체크포인트 ${cps.map((k) => k.id).join(" · ")}` : ""}`,
      cmd: only ? node("p5.ts", code, "--counter-call", "--only", only.join(",")) : node("p5.ts", code, "--counter-call"), upper: null, last: only ? null : last.counter,
    };
    if (p5stale) {
      if (o.keepDerive) line("재사용", "해석 후보 — --keep-derive (앞 해석을 반증만 다시)");
      else call(deriveCall);
      call(counterCall);
    } else if (o.pretend) {
      if (!o.keepDerive) call(deriveCall, true);
      call(counterCall, true);
    } else line("재사용", "해석 · 반증 — claims.json 이 지금 그래프로 지어졌다");
    if (cps.length) line("체크", `체크포인트 OPEN ${cps.length}: ${cps.map((k) => `${k.id} "${k.question.slice(0, 60)}…"`).join(" · ")} — 반증 부르기(${COUNTER_VERSION})에 같이 간다 · 닫는 것은 사람 (checkpoints.json)`);
    step(o, p5stale ? node("p5.ts", code) : node("p5.ts", code, "--check"));
    step(o, py("verify-claims.py", "--report"), ROOT);
    if (o.go) {
      const cj = readJson<{ counts: { problems: number }; problems: string[] }>(join(evd, "p5/claims.json"));
      if (cj.counts.problems) throw new Stop(`claims.json problems ${cj.counts.problems} — ${cj.problems.slice(0, 3).join(" | ")} … 사람이 본다`);
    }
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    say(`\n멈춤 — ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // ── 마치며 — 무엇을 불렀나 · 무엇이 바뀌었나 · 사람이 볼 것 ───────────────────────────────────────
  say("\n요약");
  const f = o.mode === "batch" ? BATCH_FACTOR : 1;
  const up = calls.reduce((a, c) => a + (c.upper ?? 0), 0), la = calls.reduce((a, c) => a + (c.last ?? 0), 0);
  say(`  모델 부르기 ${calls.length}${calls.length ? ` · 지난 실물(즉시 값)로 대략 $${la.toFixed(2)}${o.mode === "batch" ? ` → 배치 대략 $${(la * f).toFixed(2)}`: ""}${calls.some((c) => c.upper != null) ? ` · 상한이 셈해진 것만 $${(up * f).toFixed(2)}` : ""}` : ""}`);
  if (o.pretend) {
    const wl = would.reduce((a, c) => a + (c.last ?? 0), 0);
    say(`  마른 시험 — ${doc} 가 처음 더하는 문서였다면: 모델 부르기 ${would.length} · 지난 실물(즉시 값)로 대략 $${wl.toFixed(2)}${o.mode === "batch" ? ` → 배치 대략 $${(wl * f).toFixed(2)}` : ""} (이번에는 ${calls.length} — 저장된 출력을 재사용)`);
  }
  if (!o.go && calls.length) {
    // 알맞은 상한 — 배치는 보내기 전에 넉넉한 추정의 누계로 막는다 (상한이 셈해진 것) · 지난 실물의 2 배와 견줘 큰 쪽 · 0.5 달러 단위로 올림
    const want = Math.ceil(Math.max(up * f, la * f * 2) * 2) / 2;
    say(`  돌리려면: --go --step <이 일의 Step 이름> --budget ${want}${o.mode === "now" ? " --now" : ""}  (상한 = 넉넉한 추정 누계와 지난 실물 2 배 가운데 큰 쪽 · 사람이 정한다)`);
    if (o.budget && before.spentStep + la * f > o.budget.stopAt) say(`  ⚠ Step "${o.budget.step}" 의 멈춤($${o.budget.stopAt})에 걸린다 — 쓴 돈 $${before.spentStep.toFixed(2)} + 대략 $${(la * f).toFixed(2)}`);
  }
  if (o.go) {
    say(`  쓴 돈: ${stepName ? `Step "${stepName}" $${(spentOf(stepName) - before.spentStep).toFixed(3)} · ` : ""}장부 합 $${spent().toFixed(2)}`);
    const g = readJson<{ facts: { fact_id: string; label: string }[] }>(join(evd, "p3/graph.json"));
    const oldL = new Set(before.graph.facts.map((f) => f.label)), newL = new Set(g.facts.map((f) => f.label));
    const added = [...newL].filter((l) => !oldL.has(l)), gone = [...oldL].filter((l) => !newL.has(l));
    say(`  그래프 사실 ${before.graph.facts.length} → ${g.facts.length} · 새 label ${added.length}${added.length ? ` (${added[0]} …)` : ""} · 사라진 label ${gone.length}${gone.length ? ` (${gone.slice(0, 8).join(" ")} — 묶음이 바뀌었나 · label 장부가 은퇴로 남긴다)` : ""}`);
    const cov = readJson<{ slot_checks: { slot: string; status: string }[] }>(join(evd, "p4/coverage.json"));
    const was = new Map(before.coverage.slot_checks.map((s) => [s.slot, s.status]));
    for (const s of cov.slot_checks) if (was.get(s.slot) !== s.status) say(`  슬롯 ${s.slot.slice(0, 60)}: ${was.get(s.slot) ?? "없음"} → ${s.status}`);
    const cj = readJson<{ counts: Record<string, unknown>; checkpoints?: { id: string; outcome: string; answer: string }[] }>(join(evd, "p5/claims.json"));
    say(`  해석 ${JSON.stringify(before.claims.counts.verdicts)} → ${JSON.stringify(cj.counts.verdicts)}`);
    for (const k of cj.checkpoints ?? []) say(`  체크포인트 ${k.id} ${k.outcome}: ${k.answer}`);
  }
  say("\n사람이 할 것 (게이트는 사람이다 — §10.1)");
  say("  - 슬롯 표 (p4/coverage.json slots) · 해석 표 (verify-claims --report) · 체크포인트 답 (claims.json checkpoints) 을 본다 → P-6 (요점 · 게이트 2 — 도윤)");
  say("  - 체크포인트를 닫는 것은 사람: checkpoints.json 의 status → CLOSED · closed 에 날짜 · 근거 (W3-c 가 닫히기 전에는 9월 CPI 를 '회의 직전 지표' 로 쓰지 않는다)");
  say("  - 사람이 고친 것은 logs/correction-log.jsonl 에 한 줄 (CorrectionEntry — OBSERVATION §15 · gate · stage · caught_by). 그래프 · 해석은 손으로 고치지 않는다 — 고칠 것은 다시 부르거나 게이트에서 적는다");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
