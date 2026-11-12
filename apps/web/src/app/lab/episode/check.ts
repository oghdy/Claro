// 회차 시안의 검사 — **회차의 규칙은 계약이 본다** (docs/contract/EPISODE.md §9 · @claro/contract 의 validateEpisode). 여기서는 그것을 부르고,
// 화면 쪽의 것만 따로 본다 (B-E1 에서 정리 — 구절 대조 · 숫자 · 풀이 칸의 규칙 · 망가뜨린 견본은 계약 쪽으로 갔다:
// packages/contract/src/validate-episode.ts · fixtures/invalid/episode-*.json · packages/contract/test/episode.test.ts).
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
// 보는 것
//   계약   세 회차(골든 픽스처)가 계약 검증을 지난다 — 저장된 문서를 읽어 구절 대조(불변식 8)까지
//   S1     켜고 끄기의 그림 부품이 있다 (picture.id → kit/frames/pictures.ts) — 그림은 데이터가 아니라 코드라서 계약이 못 본다
//   S2     틀의 조합을 세울 화면 부품이 있다 (kit/frames/LabCard — 켜고 끄기 · 고리 · 자리 · 넘겨 보기)
//   S3     두 독자의 고정값(시안 전용)이 가리키는 도구 · 다른 시리즈가 있다
//   S4     시안 전용 글(공통 화면 글 kit/chrome.ts · 조종 칸의 짧은 이름 · 조용히 견본)에 숫자가 없다
//   S5     조용히 견본(회차가 아니다)의 풀이 칸이 계약의 풀이 규칙(§9 11 ~ 20)에 맞다
//   S6     지난 값 견본 (UX-6 — 금리 2화 + 시안 전용 지난 값 · 실제 아님)이 계약 검증을 지난다 (구절 대조 · 지난 회차 칸 불변식 25 · 26). 지난 값이 9월 구절에 기댄다
//   3화 (rate-3) · 파이프라인 2화 (fomc-auto)는 제 폴더의 check.ts 가 본다
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람이 읽는다) · 한글로 쓴 수("여섯 가지") · 그림이 "그리지 않을 것"을 넘었나 (사람)
import { readFileSync } from "node:fs";
import path from "node:path";
import { solveProblems, validateEpisode } from "@claro/contract";
import { CHROME } from "./kit/chrome";
import { QUIET_SAMPLE } from "./episodes/quiet-sample/data";
import { CARRY, CARRY_BANNER, CARRY_EPISODE } from "./episodes/carry-sample/data";
import { isPages, isSteps, isToggle } from "./kit/frames/LabCard";
import { PICTURES } from "./kit/frames/pictures";
import { EPISODES, SHELF } from "./kit/shelf";

const REPO = path.join(import.meta.dirname, "../../../../../..");
let failed = 0;
const report = (errors: string[]) => {
  failed += errors.length;
  if (errors.length) {
    console.log(`FAIL ${errors.length}`);
    for (const x of errors) console.log(`  ${x}`);
  }
  return errors.length === 0;
};
/** 맨 글자열에 숫자가 없다 (시안 전용 글) */
function digits(where: string, v: unknown, out: string[]) {
  if (typeof v === "string") {
    if (/\d/.test(v)) out.push(`S4 ${where}: 글에 숫자가 있다 — "${v}"`);
  } else if (Array.isArray(v)) v.forEach((x, i) => digits(`${where}[${i}]`, x, out));
  else if (typeof v === "object" && v !== null) for (const [k, x] of Object.entries(v)) digits(`${where}.${k}`, x, out);
}

for (const e of EPISODES) {
  const { path: _path, short, stores, readers, ...episode } = e;
  console.log(`\n■ ${e.series.name} · ${e.scenes.cover.episode.t} (${e.code})`);
  const documents = stores.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
  const r = validateEpisode(episode, { documents });
  if (!r.ok) {
    report(r.errors.map((x) => `${x.code} ${x.path}: ${x.message}`));
    continue;
  }
  const { stats } = r;
  console.log(`구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits}`);
  console.log(`도구 ${stats.tools} — 개념 라이브러리 바탕 ${stats.tools_from_library} · 손으로 ${stats.tools - stats.tools_from_library}`);
  console.log(`밝혀 둔 예외 ${stats.exempt.length}:`);
  for (const x of stats.exempt) console.log(`  ${x}`);
  const { lab, plain, entry } = e.solve;
  console.log(`풀이 칸: 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 기본 풀이 ${plain ? `${plain.kind} (까닭: ${plain.why ?? "없음 — 체험이 있다"})` : "없음"} · 뒤집기 ${entry.flip ? `A ${entry.flip.op} B` : "없음"} · 사망 ${entry.death ? "예" : "아니오"}`);
  for (const w of r.warnings) console.log(`  알림 — ${w.path}: ${w.message}`);

  // 화면 쪽
  const errors: string[] = [];
  const has = (key: string) => e.tools.some((x) => x.key === key);
  for (const f of lab?.frames ?? []) if (f.kind === "toggle" && !PICTURES[f.picture.id]) errors.push(`S1 그림 부품 "${f.picture.id}" 가 kit/frames/pictures.ts 에 없다`);
  if (lab && !isToggle(lab.frames) && !isSteps(lab.frames) && !isPages(lab.frames)) errors.push(`S2 틀의 조합 [${lab.frames.map((f) => f.kind).join(", ")}] 을 세울 화면 부품이 없다`);
  for (const rd of Object.values(readers)) {
    for (const id of rd.known) if (!has(id)) errors.push(`S3 readers.${rd.id}.known: 도구 "${id}" 가 이 회차에 없다`);
    for (const el of rd.elsewhere) {
      const shelf = SHELF.find((s) => s.series === el.series);
      if (!shelf) errors.push(`S3 readers.${rd.id}.elsewhere: 시리즈 "${el.series}" 가 책장에 없다`);
      else for (const id of el.concepts) if (!shelf.concepts[id]) errors.push(`S3 readers.${rd.id}.elsewhere: 도구 "${id}" 가 시리즈 "${el.series}" 에 없다`);
    }
  }
  digits("short", short, errors);
  digits("readers", Object.values(readers).map((rd) => rd.label), errors);
  if (report(errors)) console.log("OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다");
}

{
  console.log("\n■ 조용히 견본 — 실제 사건 아님 (episodes/quiet-sample)");
  const errors: string[] = [];
  digits("QUIET_SAMPLE", QUIET_SAMPLE, errors);
  const r = solveProblems({ entry: QUIET_SAMPLE.entry, lab: null, plain: QUIET_SAMPLE.plain }, null);
  errors.push(...r.errors.map((x) => `S5 ${x.code} ${x.path}: ${x.message}`));
  console.log(`풀이 칸: 체험 없음 · 기본 풀이 ${QUIET_SAMPLE.plain.kind} (까닭: ${QUIET_SAMPLE.plain.why}) · 뒤집기 ${QUIET_SAMPLE.entry.flip ? "있음" : "없음"} · 사망 ${QUIET_SAMPLE.entry.death ? "예" : "아니오"}`);
  if (report(errors)) console.log("OK — 숫자가 든 글이 없고, 풀이 칸의 규칙이 맞다");
}
{
  console.log("\n■ 지난 값 견본 — 실제 아님 (episodes/carry-sample · /lab/episode/carry)");
  const errors: string[] = [];
  const documents = CARRY.stores.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
  const r = validateEpisode(CARRY_EPISODE, { documents });
  if (!r.ok) errors.push(...r.errors.map((x) => `S6 ${x.code} ${x.path}: ${x.message}`));
  else {
    const befores = r.episode.solve.lab!.frames.flatMap((f) => (f.kind === "chain" ? f.nodes.filter((n) => n.before).map((n) => `${n.id} ${n.before!.reach} “${n.before!.value.t}” (${n.before!.value.src?.join(" ")})`) : f.kind === "seats" ? f.sides.filter((x) => x.before).map((x) => `${x.id} “${x.before!.group.t}” · 까닭 ${x.before!.why}`) : []));
    console.log(`지난 값 ${befores.length}: ${befores.join(" / ")}`);
    for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}`);
    if (!r.warnings.some((w) => w.code === "PREVIOUS_NOT_CHECKED")) errors.push("S6 견본의 지난 회차는 회차가 아니다 — PREVIOUS_NOT_CHECKED 알림이 있어야 한다");
  }
  digits("CARRY_BANNER", CARRY_BANNER, errors);
  digits("short", CARRY.short, errors);
  if (report(errors)) console.log("OK — 계약 검증을 지났고 (지난 값의 구절도 저장된 문서에 있다), 견본 띠에 숫자가 없다");
}
{
  console.log("\n■ 공통 화면 글 (kit/chrome.ts)");
  const errors: string[] = [];
  digits("CHROME", CHROME, errors);
  if (report(errors)) console.log("OK — 숫자가 든 글이 없다");
}

if (failed) {
  console.log(`\nFAIL ${failed}`);
  process.exit(1);
}
console.log(`\nOK — 회차 ${EPISODES.length} (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글`);
