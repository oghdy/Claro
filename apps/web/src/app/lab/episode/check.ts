// 회차 시안의 작은 검사 — 독자가 읽는 글의 숫자 · 날짜가 저장된 원문 구절에 있는가. **두 회차(배달앱 · FOMC) 다 돈다** (UX-2).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
// 보는 것
//   A. 구절(quote)이 저장된 문서(store.documents.json)의 글에 그대로 있다 (빈칸 · 줄바꿈만 무시)
//   B. 글({ t })에 숫자가 있으면: 그 글의 src 구절들에 그 숫자가 있거나, calc(계산) · ui(화면 번호)로 밝혀 두었다
//   C. { t } 꼴이 아닌 맨 글자열에는 숫자가 없다 (숫자가 검사를 비켜 가지 못하게)
//   D. 가리키는 것이 있다 — 글의 src 가 그 회차의 구절이고, 도구 · 조립 · 지도 · 다른 시리즈가 가리키는 개념이 있다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람이 읽는다). 한글로 쓴 수("여섯 가지") · 그림
//
// 영어 원문을 위한 읽기 규칙 둘 (UX-2 — FOMC 문서가 영어다. 구절 쪽에만 쓴다):
//   달 이름 → 수            "October 28, 2026" 의 October = 10      (글의 "10월 28일")
//   분수 → 소수             "3-3/4 to 4 percent" = 3.75 · "1/4 percentage point" = 0.25      (글의 "3.75~4%" · "0.25%포인트")
// 영어로 쓴 수(three weeks · eight meetings)는 읽지 않는다 — 글에서 calc 로 밝혀 둔다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { CHROME } from "./kit/chrome";
import { EPISODES, SHELF } from "./kit/shelf";
import type { EpisodeData, T } from "./kit/types";

const REPO = path.join(import.meta.dirname, "../../../../../..");
const squash = (s: string) => s.replace(/\s+/g, "");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 영어 구절의 달 이름 · 분수를 수로 */
const english = (s: string) =>
  MONTHS.reduce((out, m, i) => out.replace(new RegExp(`\\b${m}\\b`, "g"), ` ${i + 1} `), s)
    .replace(/(\d+)-(\d)\/(\d)/g, (_, whole: string, a: string, b: string) => String(Number(whole) + Number(a) / Number(b)))
    .replace(/(?<![\d.])(\d)\/(\d)(?![\d.])/g, (_, a: string, b: string) => String(Number(a) / Number(b)));
/** 숫자 토막 — 쉼표를 떼고, 숫자가 아닌 것으로 끊는다. 앞의 0 은 뗀다 ("09" = "9") */
const runs = (s: string) => (s.replace(/(\d),(?=\d)/g, "$1").match(/\d+/g) ?? []).map((n) => String(Number(n)));
const isT = (v: unknown): v is T => typeof v === "object" && v !== null && typeof (v as { t?: unknown }).t === "string";

let failed = 0;

function check(name: string, e: EpisodeData | null, roots: Record<string, unknown>) {
  const errors: string[] = [];
  const exempt: string[] = [];
  let quotes = 0;
  let texts = 0;
  let withDigits = 0;

  // A
  if (e) {
    const textOf = new Map<string, string>();
    for (const [store, file] of Object.entries(e.stores)) {
      const docs = (JSON.parse(readFileSync(path.join(REPO, file), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents;
      for (const d of docs) textOf.set(`${store}:${d.source_id}`, squash(d.text));
    }
    for (const [key, s] of Object.entries(e.sources)) {
      quotes++;
      const ref = e.docs[s.doc];
      const doc = ref ? textOf.get(`${ref.store}:${ref.source_id}`) : undefined;
      if (!doc) errors.push(`A ${key}: 문서 ${s.doc} 가 저장된 문서에 없다`);
      else if (!doc.includes(squash(s.quote))) errors.push(`A ${key}: 구절이 ${s.doc} 의 글에 없다 — "${s.quote.slice(0, 40)}…"`);
    }
  }

  // B · C · D(src)
  function checkT(where: string, item: T) {
    texts++;
    for (const k of item.src ?? []) if (!e?.sources[k]) errors.push(`D ${where}: src "${k}" 가 이 회차의 구절이 아니다`);
    const want = runs(item.t.replace(/\*\*/g, ""));
    if (want.length === 0) return;
    withDigits++;
    if (item.ui) {
      exempt.push(`${where}: "${item.t}" (ui)`);
      return;
    }
    const pool = (item.src ?? []).flatMap((k) => runs(english(e?.sources[k]?.quote ?? "")));
    const calc = Object.keys(item.calc ?? {});
    for (const n of want) {
      // 연도: 글의 2026 ↔ 구절의 ’26
      const ok = pool.includes(n) || (n.length === 4 && n.startsWith("20") && pool.includes(String(Number(n.slice(2))))) || calc.includes(n);
      if (!ok) errors.push(`B ${where}: 숫자 ${n} 이 근거 구절에 없다 — "${item.t.slice(0, 50)}…" (src: ${(item.src ?? []).join(", ") || "없음"})`);
    }
    if (calc.length) exempt.push(`${where}: "${item.t.replace(/\n/g, " ").slice(0, 60)}${item.t.length > 60 ? "…" : ""}" (계산 — ${Object.entries(item.calc!).map(([n, how]) => `${n} = ${how}`).join(" · ")})`);
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
  for (const [k, v] of Object.entries(roots)) walk(k, v);

  // D
  if (e) {
    const has = (id: string) => Boolean(e.concepts[id]);
    const need = (what: string, ids: readonly string[]) => ids.forEach((id) => has(id) || errors.push(`D ${what}: 개념 "${id}" 가 이 회차에 없다`));
    need("conceptOrder", e.conceptOrder);
    need("toolOrder", e.toolOrder);
    need("lateTool", [e.lateTool]);
    need("map.at", Object.keys(e.map.at));
    need("map.edges", e.map.edges.flat());
    need("map.ghosts", e.map.ghosts.map((g) => g.from));
    for (const ids of Object.values(e.pickedAfter)) need("pickedAfter", ids ?? []);
    if (e.copy.aha.born) need("aha.born", [e.copy.aha.born.concept]);
    for (const id of e.conceptOrder) if (!e.map.at[id]) errors.push(`D map.at: 개념 "${id}" 의 자리가 없다`);
    for (const r of Object.values(e.readers)) {
      need(`readers.${r.id}.known`, r.known);
      for (const el of r.elsewhere) {
        const shelf = SHELF.find((s) => s.series === el.series);
        if (!shelf) errors.push(`D readers.${r.id}.elsewhere: 시리즈 "${el.series}" 가 책장에 없다`);
        else for (const id of el.concepts) if (!shelf.concepts[id]) errors.push(`D readers.${r.id}.elsewhere: 개념 "${id}" 가 시리즈 "${el.series}" 에 없다`);
      }
    }
    for (const sc of Object.values(e.assembly).flat()) if (!(sc in e.copy)) errors.push(`D assembly: 장면 "${sc}" 의 글이 없다`);
  }

  console.log(`\n■ ${name}`);
  console.log(e ? `구절 ${quotes} (문서 ${new Set(Object.values(e.sources).map((s) => s.doc)).size}) · 글 ${texts} — 숫자가 든 글 ${withDigits}` : `글 ${texts} — 숫자가 든 글 ${withDigits}`);
  if (e) {
    const lib = Object.values(e.concepts).filter((c) => c.from !== "hand");
    console.log(`개념 ${Object.keys(e.concepts).length} — 개념 라이브러리 바탕 ${lib.length} · 손으로 ${Object.keys(e.concepts).length - lib.length}`);
  }
  console.log(`밝혀 둔 예외 ${exempt.length}:`);
  for (const x of exempt) console.log(`  ${x}`);
  if (errors.length) {
    failed += errors.length;
    console.log(`FAIL ${errors.length}`);
    for (const x of errors) console.log(`  ${x}`);
  } else console.log(e ? "OK — 구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다" : "OK — 숫자가 든 글이 없다");
}

for (const e of EPISODES) {
  check(`${e.series.name} · ${e.copy.cover.episode.t} (${e.id})`, e, {
    COPY: e.copy,
    LAB: e.lab,
    SERIES: e.series,
    CONCEPTS: Object.fromEntries(Object.values(e.concepts).map((c) => [c.id, { name: c.name, short: c.short, body: c.body, use: c.use }])),
    READERS: Object.fromEntries(Object.values(e.readers).map((r) => [r.id, { label: r.label }])),
    MAP: { ghosts: e.map.ghosts.map((g) => g.name) },
    LAYER: e.layerLabels,
    SHORT: e.short,
  });
}
check("공통 화면 글 (kit/chrome.ts)", null, { CHROME });

if (failed) {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
console.log("\nOK — 두 회차 · 공통 글");
