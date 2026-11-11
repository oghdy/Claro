// UX-1 시안의 작은 검사 — 독자가 읽는 글의 숫자 · 날짜가 저장된 원문 구절에 있는가.
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
// 보는 것
//   A. SOURCES 의 구절(quote)이 저장된 문서(store.documents.json)의 글에 그대로 있다 (빈칸 · 줄바꿈만 무시)
//   B. 글({ t })에 숫자가 있으면: 그 글의 src 구절들에 그 숫자가 있거나, calc(계산) · ui(화면 번호)로 밝혀 두었다
//   C. { t } 꼴이 아닌 맨 글자열에는 숫자가 없다 (숫자가 검사를 비켜 가지 못하게)
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람이 읽는다). 한글로 쓴 수("여섯 가지")
import { readFileSync } from "node:fs";
import path from "node:path";
import { CONCEPTS, COPY, DOCS, READERS, SERIES, SOURCES, type SrcKey, type T } from "./data";

const STORE = path.join(import.meta.dirname, "../../../../../../packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json");
const docs = (JSON.parse(readFileSync(STORE, "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents;
const squash = (s: string) => s.replace(/\s+/g, "");
const textOf = new Map(docs.map((d) => [d.source_id, squash(d.text)]));

const errors: string[] = [];
let quotes = 0;
let texts = 0;
let withDigits = 0;
const exempt: string[] = [];

// A
for (const [key, s] of Object.entries(SOURCES)) {
  quotes++;
  const doc = textOf.get(DOCS[s.doc].source_id);
  if (!doc) errors.push(`A ${key}: 문서 ${s.doc} 가 store.documents.json 에 없다`);
  else if (!doc.includes(squash(s.quote))) errors.push(`A ${key}: 구절이 ${s.doc} 의 글에 없다 — "${s.quote.slice(0, 40)}…"`);
}

// B · C
/** 숫자 토막 — 쉼표를 떼고, 숫자가 아닌 것으로 끊는다. 앞의 0 은 뗀다 ("09" = "9") */
const runs = (s: string) => (s.replace(/(\d),(?=\d)/g, "$1").match(/\d+/g) ?? []).map((n) => String(Number(n)));
const isT = (v: unknown): v is T => typeof v === "object" && v !== null && typeof (v as { t?: unknown }).t === "string";

function checkT(where: string, item: T) {
  texts++;
  const want = runs(item.t.replace(/\*\*/g, ""));
  if (want.length === 0) return;
  withDigits++;
  if (item.ui) {
    exempt.push(`${where}: "${item.t}" (ui)`);
    return;
  }
  const pool = (item.src ?? []).flatMap((k: SrcKey) => runs(SOURCES[k].quote));
  const calc = Object.keys(item.calc ?? {});
  for (const n of want) {
    // 연도: 글의 2026 ↔ 구절의 ’26
    const ok = pool.includes(n) || (n.length === 4 && n.startsWith("20") && pool.includes(String(Number(n.slice(2))))) || calc.includes(n);
    if (!ok) errors.push(`B ${where}: 숫자 ${n} 이 근거 구절에 없다 — "${item.t.slice(0, 50)}…" (src: ${(item.src ?? []).join(", ") || "없음"})`);
  }
  if (calc.length) exempt.push(`${where}: "${item.t.replace(/\n/g, " ")}" (계산 — ${Object.entries(item.calc!).map(([n, how]) => `${n} = ${how}`).join(" · ")})`);
}

function walk(where: string, v: unknown) {
  if (typeof v === "string") {
    if (/\d/.test(v)) errors.push(`C ${where}: 맨 글자열에 숫자가 있다 — "${v}"`);
    return;
  }
  if (Array.isArray(v)) return v.forEach((x, i) => walk(`${where}[${i}]`, x));
  if (isT(v)) return checkT(where, v);
  if (typeof v === "object" && v !== null) for (const [k, x] of Object.entries(v)) walk(`${where}.${k}`, x);
}
walk("COPY", COPY);
walk("SERIES", SERIES);
for (const c of Object.values(CONCEPTS)) walk(`CONCEPTS.${c.id}`, { name: c.name, short: c.short, body: c.body, use: c.use });
for (const r of Object.values(READERS)) walk(`READERS.${r.id}`, { label: r.label, elsewhere: r.elsewhere.map((e) => e.name + e.series) });

console.log(`구절 ${quotes} (문서 ${new Set(Object.values(SOURCES).map((s) => s.doc)).size}) · 글 ${texts} — 숫자가 든 글 ${withDigits}`);
console.log(`밝혀 둔 예외 ${exempt.length}:`);
for (const e of exempt) console.log(`  ${e}`);
if (errors.length) {
  console.log(`FAIL ${errors.length}`);
  for (const e of errors) console.log(`  ${e}`);
  process.exit(1);
}
console.log("OK — 구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다");
