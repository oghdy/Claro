// P-E1 — 파이프라인이 만든 금리 2화의 검사. ../check.ts (두 골든 · 책장) 는 고치지 않았다 — 이 회차는 책장에 올리지 않았다 (UX-5 가 같은 폴더에서 돈다).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/fomc-auto/check.ts
// 보는 것 — ../check.ts 와 같은 규칙을 이 회차에:
//   계약   episode.json 이 계약 검증을 지난다 — 저장된 문서를 읽어 구절 대조 (불변식 8)까지
//   S2     틀의 조합을 세울 화면 부품이 있다          S3  두 독자의 고정값이 가리키는 도구 · 다른 시리즈가 있다
//   S4     시안 전용 글 (맨 위 띠 · 짧은 이름 · 독자 이름)에 숫자가 없다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (파이프라인의 함의 검사 — review.json) · 사람 확인 칸이 참인가 (사람)
import { readFileSync } from "node:fs";
import path from "node:path";
import { validateEpisode } from "@claro/contract";
import { isSteps, isToggle } from "../kit/frames/LabCard";
import { SHELF } from "../kit/shelf";
import { BANNER, READERS, STORES } from "./data";

const REPO = path.join(import.meta.dirname, "../../../../../../..");
const built = JSON.parse(readFileSync(path.join(REPO, "packages/pipeline/data/events/FOMC-20261028/episode/episode.json"), "utf8"));
const documents = STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
const r = validateEpisode(built, { documents });
console.log("■ 금리는 어디로 · 파이프라인이 만든 판 (fomc-auto)");
if (!r.ok) {
  console.log(`FAIL ${r.errors.length}`);
  for (const x of r.errors) console.log(`  ${x.code} ${x.path}: ${x.message}`);
  process.exit(1);
}
const e = r.episode;
const { stats } = r;
console.log(`구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits}`);
console.log(`도구 ${stats.tools} — 개념 라이브러리 바탕 ${stats.tools_from_library} · 손으로 ${stats.tools - stats.tools_from_library}`);
console.log(`밝혀 둔 예외 ${stats.exempt.length}:`);
for (const x of stats.exempt) console.log(`  ${x}`);
const { lab, plain, entry } = e.solve;
console.log(`풀이 칸: 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 기본 풀이 ${plain ? `${plain.kind} (까닭: ${plain.why ?? "없음 — 체험이 있다"})` : "없음"} · 뒤집기 ${entry.flip ? `A ${entry.flip.op} B` : "없음"} · 사망 ${entry.death ? "예" : "아니오"}`);
for (const w of r.warnings) console.log(`  알림 — ${w.path}: ${w.message}`);

const errors: string[] = [];
const has = (key: string) => e.tools.some((x) => x.key === key);
if (lab && !isToggle(lab.frames) && !isSteps(lab.frames)) errors.push(`S2 틀의 조합 [${lab.frames.map((f) => f.kind).join(", ")}] 을 세울 화면 부품이 없다`);
for (const f of lab?.frames ?? []) if (f.kind === "toggle") errors.push("S1 켜고 끄기는 파이프라인이 내지 않는다 (개념마다 사람이 만든다 — D62)");
for (const rd of Object.values(READERS)) {
  for (const id of rd.known) if (!has(id)) errors.push(`S3 readers.${rd.id}.known: 도구 "${id}" 가 이 회차에 없다`);
  for (const el of rd.elsewhere) {
    const shelf = SHELF.find((s) => s.series === el.series);
    if (!shelf) errors.push(`S3 readers.${rd.id}.elsewhere: 시리즈 "${el.series}" 가 책장에 없다`);
    else for (const id of el.concepts) if (!shelf.concepts[id]) errors.push(`S3 readers.${rd.id}.elsewhere: 도구 "${id}" 가 시리즈 "${el.series}" 에 없다`);
  }
}
for (const [k, v] of [...Object.entries(BANNER), ...Object.values(READERS).map((rd) => [`readers.${rd.id}.label`, rd.label] as const)]) if (/\d/.test(v)) errors.push(`S4 ${k}: 글에 숫자가 있다 — "${v}"`);
if (errors.length) {
  console.log(`FAIL ${errors.length}`);
  for (const x of errors) console.log(`  ${x}`);
  process.exit(1);
}
console.log("OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다");
