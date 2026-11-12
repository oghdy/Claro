// UX-6 — 「금리는 어디로」 3화 (파이프라인 · 회의록 날)의 검사. ../check.ts (세 회차 · 견본) · ../fomc-auto/check.ts 는 따로 돈다.
//   pnpm --filter @claro/web exec tsx src/app/lab/episode/rate-3/check.ts
// 파일이 없으면 "회의록을 기다리는 중" — 실패가 아니다 (0 으로 끝난다). 파일이 있으면 — ../fomc-auto/check.ts 와 같은 규칙을 이 회차에:
//   계약   episode.json 이 계약 검증을 지난다 — 저장된 문서를 읽어 구절 대조 (불변식 8) · **지난 회차 (손 2화)를 받아 같은 그림 · 지난 값 · 옮겨 온 구절을 대 본다** (계약 §7.9 · PREV_MISMATCH)
//   S2     틀의 조합을 세울 화면 부품이 있다          S3  두 독자의 고정값이 가리키는 도구 · 다른 시리즈가 있다
//   S4     시안 전용 글 (맨 위 띠 · 대기 화면)에 숫자가 없다 — 화면 번호 ("3화") · 대기 화면의 날짜 하나 ("11/18 무렵" — 결정 10월 28일 + 3주)는 밝혀 둔 예외
// 보지 않는 것: 글의 뜻이 구절에서 나오는가 (파이프라인의 함의 검사 — review.json) · 사람 확인 칸이 참인가 (사람 — 게이트 1 · 2)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateEpisode } from "@claro/contract";
import { isPages, isSteps, isToggle } from "../../../../episode/kit/frames/LabCard";
import { SHELF } from "../../../../episode/kit/shelf";
import { COPY, EPISODE_FILE, PREVIOUS, REVIEW_FILE, STORES } from "./data";

const REPO = path.join(import.meta.dirname, "../../../../../../..");
console.log("■ 금리는 어디로 · 3화 (rate-3 · 파이프라인)");

const errors: string[] = [];
// S4 — 대기 화면 · 맨 위 띠 (파일이 없어도 이 글은 화면에 나간다)
const words = [...Object.entries(COPY.banner), ...Object.entries(COPY.wait).filter(([k]) => k !== "when"), ["broken", COPY.broken] as const];
const flat = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : typeof v === "object" && v ? Object.values(v).flatMap(flat) : []);
for (const [k, v] of words) for (const s of flat(v)) if (/\d/.test(s.replace(/\d+화/g, ""))) errors.push(`S4 ${k}: 글에 숫자가 있다 — "${s}"`);
if (COPY.wait.when !== "11/18 무렵") errors.push(`S4 wait.when: 밝혀 둔 날짜 ("11/18 무렵")가 아니다 — "${COPY.wait.when}"`);

const file = path.join(REPO, EPISODE_FILE);
if (!existsSync(file)) {
  if (errors.length) {
    console.log(`FAIL ${errors.length}`);
    for (const x of errors) console.log(`  ${x}`);
    process.exit(1);
  }
  console.log(`회의록을 기다리는 중 — ${EPISODE_FILE} 이 아직 없다 (P-E2 ① 7 · \`pnpm --filter @claro/pipeline episode rate-3\` 이 짓는다). 주소는 기다리는 한 장을 그린다`);
  console.log("OK — 대기 화면의 글 (숫자는 밝혀 둔 날짜 하나 · 화면 번호뿐)");
  process.exit(0);
}

const built = JSON.parse(readFileSync(file, "utf8"));
const documents = STORES.flatMap((f) => (JSON.parse(readFileSync(path.join(REPO, f), "utf8")) as { source_documents: { source_id: string; text: string }[] }).source_documents);
const r = validateEpisode(built, { documents, previous: PREVIOUS });
if (!r.ok) {
  console.log(`FAIL ${r.errors.length}`);
  for (const x of r.errors) console.log(`  ${x.code} ${x.path}: ${x.message}`);
  process.exit(1);
}
const e = r.episode;
const { stats } = r;
console.log(`구절 ${stats.quotes} (문서 ${stats.docs}) · 글 ${stats.texts} — 숫자가 든 글 ${stats.texts_with_digits}`);
console.log(`도구 ${stats.tools} — 개념 라이브러리 바탕 ${stats.tools_from_library} · 손으로 ${stats.tools - stats.tools_from_library}`);
const { lab, plain, entry } = e.solve;
console.log(`풀이 칸: 체험 ${lab ? `[${lab.frames.map((f) => f.kind).join(" → ")}]` : "없음"} · 기본 풀이 ${plain ? `${plain.kind} (까닭: ${plain.why ?? "없음 — 체험이 있다"})` : "없음"} · 뒤집기 ${entry.flip ? `A ${entry.flip.op} B` : "없음"} · 사망 ${entry.death ? "예" : "아니오"}`);
// 지난 회차 칸 (계약 §3.4 · §4.5 · §7.9 — 실물 전)이 찼나 — 비어도 통과한다 (고를 수 있는 칸). 비었으면 화면에 지난 값이 안 나간다
const befores = (lab?.frames ?? []).flatMap((f) => (f.kind === "chain" ? f.nodes.filter((n) => n.before).map((n) => `고리 ${n.id}`) : f.kind === "seats" ? f.sides.filter((s) => s.before).map((s) => `쪽 ${s.id}`) : []));
const carried = Object.keys(e.quotes).filter((k) => k.includes(":"));
console.log(`지난 회차 칸: previous ${e.previous ? `${e.previous.episode_id} v${e.previous.episode_version}` : "없음"} · 지난 값 ${befores.length ? befores.join(" · ") : "없음 — 화면에 지난 값이 안 나간다"} · 옮겨 온 구절 ${carried.length ? carried.join(" ") : "없음"}`);
for (const w of r.warnings) console.log(`  알림 — ${w.code} ${w.path}: ${w.message}`);

const review = existsSync(path.join(REPO, REVIEW_FILE)) ? (JSON.parse(readFileSync(path.join(REPO, REVIEW_FILE), "utf8")) as { follower_known?: string[]; publishable?: boolean }) : null;
console.log(`review.json ${review ? `있음 · 낼 수 있나 ${review.publishable ?? "-"}` : "없음"}`);
const has = (key: string) => e.tools.some((x) => x.key === key);
if (lab && !isToggle(lab.frames) && !isSteps(lab.frames) && !isPages(lab.frames)) errors.push(`S2 틀의 조합 [${lab.frames.map((f) => f.kind).join(", ")}] 을 세울 화면 부품이 없다`);
for (const f of lab?.frames ?? []) if (f.kind === "toggle") errors.push("S1 켜고 끄기는 파이프라인이 내지 않는다 (개념마다 사람이 만든다 — D62)");
for (const id of review?.follower_known ?? []) if (!has(id)) errors.push(`S3 follower_known: 도구 "${id}" 가 이 회차에 없다`);
if (!SHELF.find((s) => s.series === "price")) errors.push(`S3 readers.follower.elsewhere: 시리즈 "price" 가 책장에 없다`);
if (errors.length) {
  console.log(`FAIL ${errors.length}`);
  for (const x of errors) console.log(`  ${x}`);
  process.exit(1);
}
console.log("OK — 계약 검증을 지났고 (구절 · 숫자 · 풀이 칸 · 지난 회차와 대 보기), 화면 쪽 검사도 맞다");
