// P-2 — 사건 하나의 소스 팩: 목록 하나를 받아 가져오고 · 뽑고 · 해시를 낸다. 명령 하나:
//
//     pnpm --filter @claro/pipeline pack FOMC-20261028            # 가져오기(캐시가 없을 때만) → robots 확인 → 뽑기 → 해시 → 쓰기
//     pnpm --filter @claro/pipeline pack FOMC-20261028 --check    # 다시 돌려 대 본다 (캐시 바이트로 다시 뽑기 · 새로 받아 다시 뽑기). 아무것도 쓰지 않는다
//     pnpm --filter @claro/pipeline pack FOMC-20261028 --retry    # 못 가져온 것을 다시 시도 (막힌 곳은 다시 두드리지 않는다 — skip 항목은 요청하지 않는다)
//
// 사건마다 폴더 하나: packages/pipeline/data/events/<code>/
//   pack.json              사람이 쓴 목록 (입력) — 무엇 · 누가 · 주소 · 왜(슬롯) · 주소를 어떻게 확인했나 · 공개 시각과 그 증거 글
//   store.json             계약 모양 (DATA_MODEL §1) — events · sources · source_registry · source_documents(비움) · 나머지 칸은 빈 배열
//   store.documents.json   SourceDocument — 원문 전문 (can_store 인 발행처만 = 미국 연방 정부). P-1 과 같은 모양
//   fetch.json             가져온 기록 — 문서마다 요청 · 받은 때 · 리다이렉트 뒤 주소 · 해시 · robots · 못 가져온 까닭 (계약 밖 — P-1 _open P1-a)
//   .cache (git 밖)        받은 바이트 · 권리 미확인 문서의 글 — packages/pipeline/.cache/events/<code>/
//
// 뽑기 · 해시 · 권리 · User-Agent 는 P-1 과 같은 코드다 (extract.ts · fetch.ts · rights.ts). 새로 더한 것은 robots.txt 확인(robots.ts) 하나.
// 한 번 저장한 원문은 바꾸지 않는다 (DATA_MODEL §4.1). 같은 주소 · 같은 글(해시)이면 P-1 의 Source 와 같은 문서다 — source_id 를 이어 쓴다.
// LLM 을 쓰지 않는다. 사실 · 구절 · 해석을 만들지 않는다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { EXTRACTOR, extract, sha256 } from "./extract.ts";
import { USER_AGENT, fetchOnce, type Fetched } from "./fetch.ts";
import { cpLength } from "./match.ts";
import { registryRow, rightsOf, type Rights } from "./rights.ts";
import { ROBOTS_VERSION, robotsAllows, type RobotsRecord } from "./robots.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const eventDir = (code: string) => join(ROOT, "packages/pipeline/data/events", code);
const P1_RECORD = join(ROOT, "packages/pipeline/data/fomc-2026-09.sources.json");
const P1_STORE = join(ROOT, "fixtures/store.json");
const P1_DOCS = join(ROOT, "fixtures/store.documents.json");

export type PackItem = {
  label: string;
  group: string;
  title: string;
  publisher: string;
  url: string;
  slots: string[];
  why: string;
  url_basis: string;
  live?: boolean;
  skip?: string;                  // 요청하지 않는 까닭 (D40 — 막힌 곳을 다시 두드리지 않는다)
  published_at?: string;          // TimePoint. 저장한 글의 published_evidence 로 증명된 것만
  published_evidence?: string;    // 저장한 글에 그대로 있어야 하는 글 — 없으면 실패한다 (지어내지 않는다)
  published_note?: string;        // 그 날짜가 무엇의 날짜인가 (연설한 날 · 판의 날 …)
  kind?: "PRIMARY" | "SECONDARY";
  language?: string;
};
export type Pack = { event: { code: string; title: string; occurred_at: string | null; storyline_code: string | null }; slots: string[]; items: PackItem[] } & Record<string, unknown>;

export const SOURCE_FIELDS = ["source_id", "label", "title", "publisher", "url", "kind", "language", "published_at", "ingested_at"] as const; // DATA_MODEL §1 Source

export type PackDoc = {
  label: string;
  source_id: string | null;       // 저장한 것만 Source 가 된다
  publisher: string;
  url: string;
  status: "STORED" | "NOT_FETCHED";
  why: string | null;
  robots: { ok: boolean; why: string } | null;
  fetch: Fetched | null;
  kind: "HTML" | "PDF" | null;
  extractor: string | null;
  text_sha256: string | null;
  text_length: number | null;
  pdf_page_starts: number[] | null;
  first_line: string | null;      // 받은 글의 첫 줄 — 판(preliminary / FINAL)을 보려고
  rights: Rights;
  text_in: "store.documents.json" | "fixtures/store.documents.json" | "cache" | null;   // fixtures/… = P-1 이 이미 저장한 같은 글 (두 벌 두지 않는다)
  live: boolean;
  same_as_p1: string | null;      // P-1 의 같은 Source (같은 주소 · 같은 해시) — 그 label
  policy_terms: Record<string, number> | null;   // 글에 그 낱말이 몇 번 — 판단이 아니라 셈 (연설이 정책을 말했나를 사람이 보려고)
};

const POLICY_TERMS = ["monetary policy", "federal funds rate", "policy rate", "inflation", "FOMC"];
const countTerms = (t: string) => Object.fromEntries(POLICY_TERMS.map((w) => [w, t.toLowerCase().split(w.toLowerCase()).length - 1]));

const safe = (label: string) => label.replace(/[^\w.-]/g, "_");
function cache(code: string, ...parts: string[]) {
  const d = join(ROOT, "packages/pipeline/.cache/events", code, ...parts);
  mkdirSync(d, { recursive: true });
  return d;
}
function readCached(code: string, label: string): { meta: Fetched; bytes: Uint8Array } | null {
  const d = cache(code, "raw");
  const m = join(d, `${safe(label)}.json`), b = join(d, `${safe(label)}.bin`);
  if (!existsSync(m) || !existsSync(b)) return null;
  return { meta: JSON.parse(readFileSync(m, "utf8")), bytes: new Uint8Array(readFileSync(b)) };
}
function writeCached(code: string, label: string, got: { meta: Fetched; bytes: Uint8Array }) {
  const d = cache(code, "raw");
  writeFileSync(join(d, `${safe(label)}.bin`), got.bytes);
  writeFileSync(join(d, `${safe(label)}.json`), JSON.stringify(got.meta, null, 2) + "\n");
}
function readFailed(code: string, label: string): { meta: Fetched; why: string } | null {
  const p = join(cache(code, "raw"), `${safe(label)}.fail.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}
function writeFailed(code: string, label: string, meta: Fetched, why: string) {
  writeFileSync(join(cache(code, "raw"), `${safe(label)}.fail.json`), JSON.stringify({ meta, why }, null, 2) + "\n");
}
export const cachedTextPath = (code: string, label: string) => join(ROOT, "packages/pipeline/.cache/events", code, "text", `${safe(label)}.txt`);

function blockedWhy(meta: Fetched, bytes: Uint8Array): string {
  if (meta.error) return `네트워크 오류 — ${meta.error}`;
  const body = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 3000)).replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return `막힘 — HTTP ${meta.http_status}. 응답 본문: "${body.slice(0, 220)}${body.length > 220 ? "…" : ""}"`;
}

const readJson = <T,>(p: string, dflt: T): T => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return dflt;
  }
};

async function main() {
  const argv = process.argv.slice(2);
  const code = argv.find((a) => !a.startsWith("--"));
  if (!code) throw new Error("사건 code 를 준다 — 예: pack FOMC-20261028");
  const CHECK = argv.includes("--check"), RETRY = argv.includes("--retry");
  const dir = eventDir(code);
  const pack: Pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
  if (pack.event.code !== code) throw new Error(`pack.json 의 event.code ${pack.event.code} ≠ ${code}`);
  const labels = pack.items.map((i) => i.label);
  if (new Set(labels).size !== labels.length) throw new Error("pack.json 의 label 이 겹친다");
  for (const it of pack.items) for (const s of it.slots) if (!pack.slots.includes(s)) throw new Error(`${it.label}: 목록에 없는 슬롯 "${s}"`);

  const STORE = join(dir, "store.json"), DOCS = join(dir, "store.documents.json"), RECORD = join(dir, "fetch.json");
  const prevStore = readJson<{ events?: { event_id: string; code: string }[]; sources?: { source_id: string; label: string }[] }>(STORE, {});
  const prevRec = readJson<{ documents?: PackDoc[]; robots?: RobotsRecord[] }>(RECORD, {});
  const prevDoc = new Map((prevRec.documents ?? []).map((d) => [d.label, d]));
  const prevSid = new Map((prevStore.sources ?? []).map((s) => [s.label, s.source_id]));
  const storedText = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(DOCS, { source_documents: [] }).source_documents.map((d) => [d.source_id, d.text]));
  // P-1 의 Source — 같은 주소 · 같은 글이면 같은 문서다
  const p1 = readJson<{ documents: { label: string; source_id: string; url: string | null; status: string; text_sha256: string | null }[] }>(P1_RECORD, { documents: [] });
  const p1Text = new Map(readJson<{ source_documents: { source_id: string; text: string }[] }>(P1_DOCS, { source_documents: [] }).source_documents.map((d) => [d.source_id, d.text]));
  const p1Store = readJson<{ sources: Record<string, unknown>[] }>(P1_STORE, { sources: [] });

  const docs: PackDoc[] = [];
  const texts = new Map<string, string>(); // label → 글
  const robotsSeen = new Map<string, RobotsRecord>();
  const checkLines: string[] = [];

  for (const it of pack.items) {
    const rights = rightsOf(it.publisher);
    const base: PackDoc = {
      label: it.label, source_id: null, publisher: it.publisher, url: it.url, status: "NOT_FETCHED", why: null, robots: null, fetch: null, kind: null,
      extractor: null, text_sha256: null, text_length: null, pdf_page_starts: null, first_line: null, rights, text_in: null, live: !!it.live, same_as_p1: null, policy_terms: null,
    };
    if (it.skip) {
      docs.push({ ...base, why: `요청하지 않음 — ${it.skip}` });
      continue;
    }
    const old = prevDoc.get(it.label);
    const kept = old?.status !== "STORED" ? undefined
      : old.text_in === "store.documents.json" ? storedText.get(old.source_id!)
      : old.text_in === "fixtures/store.documents.json" ? p1Text.get(old.source_id!)
      : existsSync(cachedTextPath(code, it.label)) ? readFileSync(cachedTextPath(code, it.label), "utf8") : undefined;
    if (old?.status === "STORED" && kept != null && !CHECK) {
      if (sha256(kept) !== old.text_sha256) throw new Error(`${it.label}: 저장된 글의 해시가 기록과 다르다 — 원문이 바뀌었다`);
      docs.push(old);
      texts.set(it.label, kept);
      continue;
    }
    if (old?.status === "NOT_FETCHED" && !CHECK && !RETRY) {
      docs.push(old);
      continue;
    }
    // robots.txt (D40)
    const rb = await robotsAllows(it.url);
    robotsSeen.set(rb.rec.host, rb.rec);
    if (!rb.ok) {
      docs.push({ ...base, robots: { ok: false, why: rb.why }, why: `robots.txt 가 막는다 — ${rb.why}. 우회하지 않는다 (D40)` });
      continue;
    }
    let got = !CHECK || old?.status === "STORED" ? readCached(code, it.label) : null;
    if (!got || got.meta.http_status !== 200) {
      if (CHECK && old?.status !== "STORED") {
        docs.push(old ?? base);
        continue;
      }
      const failed = !CHECK && !RETRY ? readFailed(code, it.label) : null;
      if (failed) {
        // 한 번 못 가져온 것 — 다시 두드리지 않는다 (--retry 로만). 기록을 쓰기 전에 멈춘 실행이 있어도 그 결과를 쓴다
        docs.push({ ...base, robots: { ok: true, why: rb.why }, fetch: failed.meta, why: failed.why });
        continue;
      }
      got = await fetchOnce(it.url);
      if (got.meta.http_status === 200 && got.bytes.length > 0) writeCached(code, it.label, got);
      else if (!CHECK) writeFailed(code, it.label, got.meta, blockedWhy(got.meta, got.bytes));
    }
    const meta = got.meta;
    if (meta.http_status !== 200 || got.bytes.length === 0) {
      docs.push({ ...base, robots: { ok: true, why: rb.why }, fetch: meta, why: blockedWhy(meta, got.bytes) });
      continue;
    }
    const ex = await extract(got.bytes, meta.content_type);
    const h = sha256(ex.text);
    const p1same = p1.documents.find((d) => d.url === it.url && d.status === "STORED" && d.text_sha256 === h) ?? null;
    const rec: PackDoc = {
      ...base, robots: { ok: true, why: rb.why }, status: "STORED", fetch: meta, kind: ex.kind, extractor: EXTRACTOR, text_sha256: h, text_length: cpLength(ex.text),
      pdf_page_starts: ex.pages ? ex.pages.map((u) => cpLength(ex.text.slice(0, u))) : null, first_line: ex.text.split("\n", 1)[0] ?? "",
      text_in: rights !== "US_FEDERAL_17USC105" ? "cache" : p1same && p1Text.has(p1same.source_id) ? "fixtures/store.documents.json" : "store.documents.json",
      source_id: p1same?.source_id ?? prevSid.get(it.label) ?? randomUUID(), same_as_p1: p1same?.label ?? null, policy_terms: countTerms(ex.text),
    };
    if (CHECK) {
      const want = old?.text_sha256 ?? null;
      checkLines.push(`  ${it.label.padEnd(12)} 캐시 바이트 다시 뽑기  ${want === h ? "같음" : "다름"}  ${h.slice(0, 16)} (기록 ${want?.slice(0, 16)})`);
      const fresh = await fetchOnce(it.url);
      if (fresh.meta.http_status !== 200) {
        checkLines.push(`  ${it.label.padEnd(12)} 새로 받기             HTTP ${fresh.meta.http_status}`);
      } else {
        const ex2 = await extract(fresh.bytes, fresh.meta.content_type);
        const h2 = sha256(ex2.text);
        checkLines.push(`  ${it.label.padEnd(12)} 새로 받기             글 ${h2 === want ? "같음" : "다름"} · 바이트 ${fresh.meta.raw_sha256 === meta.raw_sha256 ? "같음" : "다름"}${rec.live ? "  (살아 있는 페이지 — 예외)" : ""}`);
        if (h2 !== want) {
          const a = kept ?? ex.text;
          let i = 0;
          while (i < a.length && i < ex2.text.length && a[i] === ex2.text[i]) i++;
          checkLines.push(`               첫 차이 @${i}: 저장 ${JSON.stringify(a.slice(Math.max(0, i - 30), i + 50))}`);
          checkLines.push(`                           새로 ${JSON.stringify(ex2.text.slice(Math.max(0, i - 30), i + 50))}`);
        }
      }
      docs.push(old ?? rec);
      continue;
    }
    docs.push(rec);
    texts.set(it.label, ex.text);
    if (rec.text_in === "cache") {
      cache(code, "text");
      writeFileSync(cachedTextPath(code, it.label), ex.text);
    }
  }

  if (CHECK) {
    console.log(`pack ${code} --check — 다시 돌려 견주기 (아무것도 쓰지 않는다)`);
    console.log(checkLines.join("\n"));
    return;
  }

  // 가져온 기록을 먼저 쓴다 — 뒤에서 멈춰도 무엇을 요청했고 무엇이 왔는지는 남는다
  const robots = [...new Map([...(prevRec.robots ?? []).map((r) => [r.host, r] as const), ...[...robotsSeen.values()].map((r) => [r.host, r] as const)]).values()];
  writeFileSync(RECORD, JSON.stringify({
    _what: `${code} 를 가져온 기록 (pack.ts 가 쓴다 — 손으로 고치지 않는다). 계약 타입이 아니다 — SourceDocument 에 해시 · 가져온 주소 · 때의 칸이 없다 (P-1 _open P1-a · D40)`,
    event: code, user_agent: USER_AGENT, extractor: EXTRACTOR, robots_rules: ROBOTS_VERSION,
    position_unit: "코드 포인트 (Unicode scalar)", hash: "sha256(UTF-8(SourceDocument.text))",
    robots, documents: docs, spans: [],
  }, null, 2) + "\n");

  // Source 행 — 저장한 문서만 (못 가져온 것은 ingested_at 이 없다. 목록 · 기록에는 남는다)
  const today = new Date().toISOString().slice(0, 10);
  const errs: string[] = [];
  const sources: Record<string, unknown>[] = [];
  for (const it of pack.items) {
    const d = docs.find((x) => x.label === it.label)!;
    if (d.status !== "STORED") continue;
    const t = texts.get(it.label)!;
    const p1src = d.same_as_p1 ? p1Store.sources.find((s) => s.label === d.same_as_p1) : null;
    if (p1src) {
      // 같은 주소 · 같은 글 = P-1 의 그 Source 다. 행을 계약의 칸 그대로 옮긴다 (한 Source 를 두 모양으로 두지 않는다)
      if (it.published_at != null) errs.push(`${it.label}: P-1 ${d.same_as_p1} 와 같은 문서다 — published_at 을 적지 않는다 (P-1 의 행을 쓴다)`);
      sources.push(Object.fromEntries(SOURCE_FIELDS.map((k) => [k, p1src[k]])) as Record<string, unknown>);
      continue;
    }
    const published_at: string | null = it.published_at ?? null;
    if (it.published_at != null) {
      if (!it.published_evidence) errs.push(`${it.label}: published_at 에 증거 글(published_evidence)이 없다`);
      else if (!t.includes(it.published_evidence)) errs.push(`${it.label}: 증거 글 "${it.published_evidence}" 가 저장한 글에 없다`);
    }
    if (published_at == null) {
      errs.push(`${it.label}: published_at 이 없다 — 저장한 글에서 날짜를 찾아 pack.json 에 증거 글과 함께 적는다. 첫 줄: ${JSON.stringify(d.first_line?.slice(0, 80))}`);
      continue;
    }
    sources.push({
      source_id: d.source_id!, label: it.label, title: it.title, publisher: it.publisher, url: it.url, kind: it.kind ?? "PRIMARY", language: it.language ?? "en",
      published_at, ingested_at: d.fetch!.fetched_at.slice(0, 10),
    });
  }
  if (errs.length) {
    for (const e of errs) console.error("  ERROR " + e);
    throw new Error(`published_at ${errs.length} 건 — 쓰지 않았다`);
  }
  const eventId = prevStore.events?.find((e) => e.code === code)?.event_id ?? randomUUID();
  const pubs = [...new Set(pack.items.map((i) => i.publisher))];
  const prevReg = new Map(((readJson<{ source_registry?: { source: string; last_reviewed_at: string | null }[] }>(STORE, {}).source_registry) ?? []).map((r) => [r.source, r]));
  const store = {
    _what: `${code} 의 소스 팩 — 계약 모양 (DATA_MODEL §1). packages/pipeline/src/pack.ts 가 pack.json 에서 쓴다 — 손으로 고치지 않는다. 골든(fixtures/)이 아니다. 사실 · 해석 · 요점은 아직 없다 (P-3 이후). 원문 전문은 store.documents.json · 가져온 기록은 fetch.json`,
    events: [{ event_id: eventId, code, title: pack.event.title, occurred_at: pack.event.occurred_at, storyline_id: null }],
    storylines: [], storyline_versions: [],
    sources,
    source_documents: [],
    source_registry: pubs.map((p) => registryRow(p, prevReg.get(p)?.last_reviewed_at ?? today, "공개 웹 페이지 — HTTP GET (P-2 파이프라인 · robots.txt 확인)")),
    facts: [], fact_sources: [], claims: [], goals: [], bridges: [], slot_checks: [],
  };
  const documents = sources.filter((s) => docs.find((d) => d.label === s.label)!.text_in === "store.documents.json").map((s) => ({ source_id: s.source_id as string, text: texts.get(s.label as string)! }));
  writeFileSync(STORE, JSON.stringify(store, null, 2) + "\n");
  writeFileSync(DOCS, JSON.stringify({
    _what: `${code} 의 SourceDocument (DATA_MODEL §1) — 원문 전문. 미국 연방 정부 저작물만 (17 U.S.C. §105 · store.json source_registry). 권리 미확인 원문은 git 밖 캐시에만. pack.ts 가 쓴다 — 손으로 고치지 않는다`,
    source_documents: documents,
  }, null, 2) + "\n");
  const n = (f: (d: PackDoc) => boolean) => docs.filter(f).length;
  console.log(`pack ${code} — 소스 팩`);
  console.log(`  목록 ${docs.length} — 저장 ${n((d) => d.status === "STORED")} (store.documents.json ${n((d) => d.text_in === "store.documents.json")} · P-1 것 그대로 ${n((d) => d.text_in === "fixtures/store.documents.json")} · 캐시만 ${n((d) => d.text_in === "cache")}) · 못 가져옴 ${n((d) => d.status === "NOT_FETCHED")}`);
  for (const d of docs) {
    const tag = d.status === "STORED"
      ? `${d.kind} ${String(d.text_length).padStart(7)}자 ${d.text_sha256!.slice(0, 12)} ${d.text_in}${d.live ? " · 살아 있는 페이지" : ""}${d.same_as_p1 ? ` · P-1 ${d.same_as_p1} 와 같은 글` : ""}`
      : `못 가져옴 — ${d.why}`;
    console.log(`  ${d.label.padEnd(12)} ${tag}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
