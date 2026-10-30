// P-1 — 원문 저장 · 해시 · span. 명령 하나:
//
//     pnpm --filter @claro/pipeline p1            # 가져오기(캐시가 없을 때만) → 뽑기 → 해시 → 구절 위치 → store.json · 기록 파일
//     pnpm --filter @claro/pipeline p1 --check    # 다시 돌려 대 본다: 캐시의 바이트로 다시 뽑고 · 새로 받아 다시 뽑아 해시를 견준다. 아무것도 쓰지 않는다
//
// 쓰는 곳
//   fixtures/store.json                      source_registry · fact_sources 의 span_start · span_end · (증명된) Source.published_at
//   fixtures/store.documents.json            SourceDocument — 원문 전문 (연방 정부 저작물만). store.json 옆 파일
//   packages/pipeline/data/fomc-2026-09.sources.json   가져온 기록 — 문서마다 가져온 때 · 주소(리다이렉트 뒤) · 해시 · 못 가져온 까닭 · 구절마다 결과
//   packages/pipeline/.cache/ (git 밖)       받은 바이트 · 권리 미확인 문서의 글
//
// 한 번 저장한 원문은 바꾸지 않는다 (DATA_MODEL §4.1). 이미 저장된 글이 있으면 그 글을 쓰고, 새로 받은 글은 견주기만 한다.
// LLM 을 쓰지 않는다. 구절(`_passage`) · 사실 · Source 행은 고치지 않는다.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EXTRACTOR, extract, sha256 } from "./extract.ts";
import { fetchOnce, readCached, readCachedText, writeCached, writeCachedText, USER_AGENT, type Fetched } from "./fetch.ts";
import { RULES, cpLength, locate } from "./match.ts";
import { registryRow, rightsOf, type Rights } from "./rights.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const STORE = join(ROOT, "fixtures/store.json");
// SourceDocument(원문 전문) — store.json 옆 파일. 계약 타입 그대로 { source_id, text } 의 줄이다. 검사는 둘을 합쳐 읽는다 (verify-article.load_bundle)
const STORE_DOCS = join(ROOT, "fixtures/store.documents.json");
export const RECORD = join(ROOT, "packages/pipeline/data/fomc-2026-09.sources.json");

type Source = { source_id: string; label: string; title: string; publisher: string; url: string | null; published_at: string; ingested_at: string; _note?: string };
type FactSource = { fact_id: string; source_id: string; section: string | null; span_start: number | null; span_end: number | null; _passage?: string; _note?: string };
type Store = { sources: Source[]; source_documents: { source_id: string; text: string }[]; source_registry: unknown[]; facts: { fact_id: string; label: string }[]; fact_sources: FactSource[] } & Record<string, unknown>;

type DocRecord = {
  label: string;
  source_id: string;
  publisher: string;
  url: string | null;
  status: "STORED" | "NOT_FETCHED";
  why: string | null;                 // 못 가져온 까닭
  fetch: Omit<Fetched, "raw_sha256" | "raw_bytes"> & { raw_sha256: string; raw_bytes: number } | null;
  kind: "HTML" | "PDF" | null;
  extractor: string | null;
  text_sha256: string | null;         // SourceDocument.text 의 UTF-8 바이트 sha256
  text_length: number | null;         // 코드 포인트 수
  pdf_page_starts: number[] | null;   // PDF 쪽이 시작하는 글자 위치 (코드 포인트)
  rights: Rights;
  text_in: "store.documents.json" | "cache" | null;   // 전문이 있는 곳. cache = packages/pipeline/.cache/text/<label>.txt (git 밖)
  live: boolean;                      // 살아 있는 페이지 — 다시 받으면 글이 바뀔 수 있다. 같은 해시를 약속하지 않는다
};

type SpanRecord = {
  fact: string;
  source: string;
  section: string | null;
  passage: string;
  result: "FOUND" | "NOT_FOUND" | "MULTIPLE" | "NO_DOCUMENT";
  span_start: number | null;
  span_end: number | null;
  count: number | null;               // MULTIPLE 일 때 몇 곳
  pdf_page: number | null;            // FOUND 이고 PDF 면 몇 쪽 (1부터)
};

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");

const isLive = (s: Source) => (s._note ?? "").includes("살아 있는 페이지");

// 저장한 글로 공개 시점이 증명되는 것 — P-1 이 글을 읽고 적었다. 증거 글이 저장한 글에 없으면 실패한다
const PUBLISHED_PROOF = [
  {
    label: "OMO", evidence: "Last Update: September 16, 2026", value: "2026-09-16",
    note: "응답 머리 Last-Modified 도 Wed, 16 Sep 2026 18:13:03 GMT (= 14:13 EDT, 성명 14:00 뒤). 이 판에 2026 \"September 17 | 25 | 0 | 3.75-4.00\" 줄이 있다 — C-3 이 10/09 에 읽은 판(_note)과 같은 판으로 보인다",
  },
];

function firstLine(t: string) {
  return t.split("\n", 1)[0] ?? "";
}

// 같은 주소의 다른 판 — 저장소 _note 가 "이 판은 그 주소에 없다" 고 적은 Source. 받은 글의 첫 줄로 대 본다
function versionGone(s: Source, text: string, kind: string): string | null {
  if (!(s._note ?? "").includes("이 판은 그 주소에 없다")) return null;
  const head = firstLine(text);
  if (kind === "PDF" && /\bFINAL\b/.test(head) && /preliminary/i.test(s.title)) {
    return `같은 주소가 지금은 FINAL 판을 준다 (받은 글 첫 줄: "${head}"). 이 Source 는 preliminary 판이다 — 그 판은 그 주소에 없다. FINAL 은 다른 Source 다 (DATA_MODEL §4.1)`;
  }
  return null;
}

function blockedWhy(meta: Fetched, bytes: Uint8Array): string {
  if (meta.error) return `네트워크 오류 — ${meta.error}`;
  const body = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 2000)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return `막힘 — HTTP ${meta.http_status}. 응답 본문: "${body.slice(0, 260)}${body.length > 260 ? "…" : ""}"`;
}

async function getBytes(s: Source, refetch: boolean) {
  if (!refetch) {
    const c = readCached(ROOT, s.label);
    if (c && c.meta.http_status === 200) return { ...c, fromCache: true }; // 받은 것만 캐시에 둔다 — 막힌 응답은 다시 시도한다
  }
  const got = await fetchOnce(s.url!);
  if (!refetch && got.meta.http_status === 200) writeCached(ROOT, s.label, got);
  return { ...got, fromCache: false };
}

async function main() {
  const storeText = readFileSync(STORE, "utf8");
  const store: Store = JSON.parse(storeText);
  const prev: { documents?: DocRecord[] } = (() => {
    try {
      return JSON.parse(readFileSync(RECORD, "utf8"));
    } catch {
      return {};
    }
  })();
  const prevDoc = new Map((prev.documents ?? []).map((d) => [d.label, d]));
  const docsFile: { source_documents: { source_id: string; text: string }[] } = (() => {
    try {
      return JSON.parse(readFileSync(STORE_DOCS, "utf8"));
    } catch {
      return { source_documents: [] };
    }
  })();
  if (store.source_documents.length > 0) throw new Error("store.json 의 source_documents 는 비어 있어야 한다 — 원문은 store.documents.json 에");
  const storedText = new Map(docsFile.source_documents.map((d) => [d.source_id, d.text]));
  const today = new Date().toISOString().slice(0, 10);

  const docs: DocRecord[] = [];
  const texts = new Map<string, string>(); // source_id → 글
  const checkLines: string[] = [];

  for (const s of store.sources) {
    const rights = rightsOf(s.publisher);
    const base: DocRecord = {
      label: s.label, source_id: s.source_id, publisher: s.publisher, url: s.url, status: "NOT_FETCHED", why: null, fetch: null, kind: null,
      extractor: null, text_sha256: null, text_length: null, pdf_page_starts: null, rights, text_in: null, live: isLive(s),
    };
    if (!s.url) {
      docs.push({ ...base, why: "주소가 없다 (Source.url 이 null). 주소를 짐작해 만들지 않았다" });
      continue;
    }
    const old = prevDoc.get(s.label);
    const kept = storedText.get(s.source_id) ?? (old?.text_in === "cache" ? readCachedText(ROOT, s.label) : null);
    if (old?.status === "STORED" && kept != null && !CHECK) {
      // 이미 저장된 원문 — 바꾸지 않는다. 해시만 다시 댄다
      if (sha256(kept) !== old.text_sha256) throw new Error(`${s.label}: 저장된 글의 해시가 기록과 다르다 — 원문이 바뀌었다`);
      docs.push(old);
      texts.set(s.source_id, kept);
      continue;
    }
    if (old && old.status === "NOT_FETCHED" && !CHECK && !args.has("--retry")) {
      docs.push(old); // 못 가져온 것은 --retry 로만 다시 시도한다 (같은 결과를 내려고)
      continue;
    }
    const got = await getBytes(s, false);
    const meta = got.meta;
    if (meta.http_status !== 200 || got.bytes.length === 0) {
      docs.push({ ...base, fetch: meta, why: blockedWhy(meta, got.bytes) });
      continue;
    }
    const ex = await extract(got.bytes, meta.content_type);
    const gone = versionGone(s, ex.text, ex.kind);
    if (gone) {
      docs.push({ ...base, fetch: meta, kind: ex.kind, why: gone });
      continue;
    }
    const rec: DocRecord = {
      ...base, status: "STORED", fetch: meta, kind: ex.kind, extractor: EXTRACTOR, text_sha256: sha256(ex.text), text_length: cpLength(ex.text),
      pdf_page_starts: ex.pages ? ex.pages.map((u) => cpLength(ex.text.slice(0, u))) : null, text_in: rights === "US_FEDERAL_17USC105" ? "store.documents.json" : "cache",
    };
    if (CHECK) {
      // 1. 캐시의 같은 바이트로 다시 뽑는다 → 같은 글이어야 한다 (결정적)
      const want = old?.text_sha256 ?? null;
      const same = want === rec.text_sha256;
      checkLines.push(`  ${s.label.padEnd(8)} 캐시 바이트 다시 뽑기  ${same ? "같음" : "다름"}  ${rec.text_sha256!.slice(0, 16)} (기록 ${want?.slice(0, 16)})`);
      // 2. 새로 받아 다시 뽑는다
      const fresh = await getBytes(s, true);
      if (fresh.meta.http_status !== 200) {
        checkLines.push(`  ${s.label.padEnd(8)} 새로 받기             HTTP ${fresh.meta.http_status}`);
      } else {
        const ex2 = await extract(fresh.bytes, fresh.meta.content_type);
        const h2 = sha256(ex2.text);
        const rawSame = fresh.meta.raw_sha256 === meta.raw_sha256;
        checkLines.push(`  ${s.label.padEnd(8)} 새로 받기             글 ${h2 === want ? "같음" : "다름"} · 바이트 ${rawSame ? "같음" : "다름"}${rec.live ? "  (살아 있는 페이지 — 예외)" : ""}`);
        if (h2 !== want) {
          // 어디가 다른지 — 첫 차이 근처
          const a = kept ?? ex.text;
          let i = 0;
          while (i < a.length && i < ex2.text.length && a[i] === ex2.text[i]) i++;
          checkLines.push(`           첫 차이 @${i}: 저장 ${JSON.stringify(a.slice(Math.max(0, i - 30), i + 50))}`);
          checkLines.push(`                       새로 ${JSON.stringify(ex2.text.slice(Math.max(0, i - 30), i + 50))}`);
        }
      }
      docs.push(old ?? rec);
      if (kept != null) texts.set(s.source_id, kept);
      continue;
    }
    docs.push(rec);
    texts.set(s.source_id, ex.text);
    if (rec.text_in === "cache") writeCachedText(ROOT, s.label, ex.text);
  }

  // 구절 → 위치
  const factLabel = new Map(store.facts.map((f) => [f.fact_id, f.label]));
  const srcLabel = new Map(store.sources.map((s) => [s.source_id, s.label]));
  const docBy = new Map(docs.map((d) => [d.source_id, d]));
  const spans: SpanRecord[] = [];
  for (const fs of store.fact_sources) {
    if (fs._passage == null) continue;
    const text = texts.get(fs.source_id);
    const r: SpanRecord = {
      fact: factLabel.get(fs.fact_id) ?? fs.fact_id, source: srcLabel.get(fs.source_id) ?? fs.source_id, section: fs.section, passage: fs._passage,
      result: "NO_DOCUMENT", span_start: null, span_end: null, count: null, pdf_page: null,
    };
    if (text != null) {
      const L = locate(text, fs._passage);
      r.result = L.result;
      if (L.result === "FOUND") {
        r.span_start = L.span_start;
        r.span_end = L.span_end;
        const pages = docBy.get(fs.source_id)?.pdf_page_starts;
        if (pages) r.pdf_page = pages.filter((p) => p <= L.span_start).length;
      }
      if (L.result === "MULTIPLE") r.count = L.count;
    }
    spans.push(r);
  }

  if (CHECK) {
    // 구절 위치도 같은가
    const prevSpans = (prev as { spans?: SpanRecord[] }).spans ?? [];
    const key = (x: SpanRecord) => `${x.fact}|${x.source}|${x.passage}`;
    const pm = new Map(prevSpans.map((x) => [key(x), x]));
    const diff = spans.filter((x) => {
      const p = pm.get(key(x));
      return !p || p.result !== x.result || p.span_start !== x.span_start || p.span_end !== x.span_end;
    });
    console.log("p1 --check — 다시 돌려 견주기 (아무것도 쓰지 않는다)");
    console.log(checkLines.join("\n"));
    console.log(`  구절 위치: ${spans.length} 개 중 기록과 다른 것 ${diff.length}`);
    for (const d of diff) console.log(`    다름 ${d.fact} ${d.source} ${d.result} ${d.span_start}-${d.span_end}`);
    return;
  }

  // store.json 에 쓴다 — 원문 · 권리 · span. 다른 칸은 손대지 않는다
  const documents = store.sources.filter((s) => docBy.get(s.source_id)?.text_in === "store.documents.json").map((s) => ({ source_id: s.source_id, text: texts.get(s.source_id)! }));
  const pubs = [...new Set(store.sources.map((s) => s.publisher))];
  const prevReg = new Map((store.source_registry as { source: string; last_reviewed_at: string | null }[]).map((r) => [r.source, r]));
  store.source_registry = pubs.map((p) => registryRow(p, prevReg.get(p)?.last_reviewed_at ?? today, "공개 웹 페이지 — HTTP GET (P-1 파이프라인)"));
  const spanOf = new Map(spans.map((x, i) => [i, x]));
  let i = 0;
  for (const fs of store.fact_sources) {
    if (fs._passage == null) continue;
    const x = spanOf.get(i++)!;
    fs.span_start = x.result === "FOUND" ? x.span_start : null;
    fs.span_end = x.result === "FOUND" ? x.span_end : null;
  }
  // 공개 시점 — 저장한 원문이 스스로 말하는 날짜로만 채운다 (지어내지 않는다). 증거 글이 저장한 글에 그대로 있고,
  // 그 날이 지금 적힌 published_at 의 범위 안일 때만 (해 · 달 → 날). 아니면 그대로 둔다 — "증명 못 함"
  for (const p of PUBLISHED_PROOF) {
    const src = store.sources.find((x) => x.label === p.label)!;
    const text = texts.get(src.source_id);
    const proof = src as Source & { _published_at_basis?: string };
    if (text == null || !text.includes(p.evidence)) throw new Error(`${p.label}: 공개 시점 증거 "${p.evidence}" 가 저장한 글에 없다`);
    if (proof._published_at_basis == null) {
      if (!p.value.startsWith(src.published_at)) throw new Error(`${p.label}: ${p.value} 가 적힌 published_at ${src.published_at} 범위 밖이다`);
      proof._published_at_basis = `P-1: 저장한 글(${docBy.get(src.source_id)!.fetch!.fetched_at.slice(0, 10)} 가져옴)에 "${p.evidence}" 가 있다 — 이 판이 ${p.value} 에 나왔다. 앞 값 "${src.published_at}" (해까지만). ${p.note}`;
      src.published_at = p.value;
    }
  }
  (store._source as Record<string, string>).p1 =
    "P-1 (2026-10-30 · packages/pipeline): 원문을 저장했다 — SourceDocument 는 옆 파일 fixtures/store.documents.json (연방 정부 저작물만) · " +
    "source_registry 채움 · 1차 구절을 원문에서 찾아 fact_sources 의 span_start · span_end 를 채움 (못 찾은 것은 null 그대로) · OMO published_at (`_published_at_basis`). " +
    "가져온 기록 · 못 가져온 까닭 · 구절마다 결과는 packages/pipeline/data/fomc-2026-09.sources.json. 위 note 의 \"SourceDocument · SourceRegistry … 비어 있다\" 는 그 전의 말이다";
  writeFileSync(STORE, JSON.stringify(store, null, 2) + "\n");
  writeFileSync(
    STORE_DOCS,
    JSON.stringify({
      _what: "fixtures/store.json 의 SourceDocument (DATA_MODEL §1) — 원문 전문. store.json 을 사람이 읽을 크기로 두려고 옆 파일에 둔다. " +
        "미국 연방 정부 저작물만 (17 U.S.C. §105 · store.json source_registry). 권리 미확인 원문은 git 밖 캐시에만. " +
        "packages/pipeline (P-1) 이 쓴다 — 손으로 고치지 않는다. 해시 · 가져온 때 · 주소는 packages/pipeline/data/fomc-2026-09.sources.json",
      source_documents: documents,
    }, null, 2) + "\n",
  );

  const record = {
    _what: "P-1 이 원문을 가져온 기록 (packages/pipeline/src/p1.ts 가 쓴다 — 손으로 고치지 않는다). 계약 타입이 아니다 — SourceDocument 에 해시 · 가져온 주소 · 때의 칸이 없어 여기에 둔다 (logs/pipeline/P-1.md _open)",
    store: "fixtures/store.json",
    user_agent: USER_AGENT,
    extractor: EXTRACTOR,
    match_rules: RULES.version,
    position_unit: "코드 포인트 (Unicode scalar) — Python str · Postgres substring 과 같다",
    hash: "sha256(UTF-8(SourceDocument.text))",
    documents: docs,
    spans,
  };
  mkdirSync(dirname(RECORD), { recursive: true });
  writeFileSync(RECORD, JSON.stringify(record, null, 2) + "\n");

  // 요약
  const n = (f: (d: DocRecord) => boolean) => docs.filter(f).length;
  const c = (r: string) => spans.filter((x) => x.result === r).length;
  console.log("p1 — 원문 저장 · 해시 · span");
  console.log(`  Source ${docs.length} — 저장 ${n((d) => d.status === "STORED")} (store.documents.json ${n((d) => d.text_in === "store.documents.json")} · 캐시만 ${n((d) => d.text_in === "cache")}) · 못 가져옴 ${n((d) => d.status === "NOT_FETCHED")}`);
  console.log(`  구절 ${spans.length} — 찾음 ${c("FOUND")} · 못 찾음 ${c("NOT_FOUND")} · 여럿 ${c("MULTIPLE")} · 원문 없음 ${c("NO_DOCUMENT")}`);
  for (const d of docs) {
    const tag = d.status === "STORED" ? `${d.kind} ${String(d.text_length).padStart(7)}자 ${d.text_sha256!.slice(0, 12)} ${d.text_in}${d.live ? " · 살아 있는 페이지" : ""}` : `못 가져옴 — ${d.why}`;
    console.log(`  ${d.label.padEnd(8)} ${tag}`);
  }
  for (const x of spans) {
    if (x.result !== "FOUND") console.log(`  ${x.result.padEnd(11)} ${x.fact.padEnd(5)} ${x.source.padEnd(8)} ${JSON.stringify(x.passage).slice(0, 90)}${x.count ? ` (${x.count}곳)` : ""}`);
  }
  const noStore = docs.filter((d) => d.status === "STORED" && d.text_in === "store.documents.json").length;
  if (noStore !== documents.length) throw new Error("source_documents 수가 기록과 다르다");
}

await main();
