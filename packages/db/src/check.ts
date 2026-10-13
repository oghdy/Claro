// 읽을 때 보는 검사 — 열람 하나가 계약에 맞는가, 어디가 어긋났는가 (D34).
// 원장은 "화면이 무엇이 일어났다고 말했나"의 기록이다. 넣을 때는 모양 · 참조 · 덧붙이기만 막고(migrations), 사건의 뜻은 여기서 본다:
//   읽기 사건 — 불변식 8 (seq 가 0부터 1씩 — 온전한 열람의 성질) · 9 · 10 · 11 · 22
//   plan — 불변식 3 (열람 · 레벨에 하나, 같은 독자 · 세션 · 판) · 5 (정적 레벨) · 7 (첫 plan 만 DEFAULT) (D35) · 6 (block_decisions 가 패키지에서 계산한 값과 같다)
// 어긋난 줄을 고치지도 지우지도 않는다. 세기만 한다 — 분석은 계약에 맞는 열람만 쓴다.
// CODE 는 scripts/verify-observation.py check_ledger 와 같은 이름이고 같은 판정이다 — 테스트가 망가뜨린 원장으로 둘을 댄다.
import { deriveBlockDecisions, type UUID } from "@claro/contract";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "./append";
import { articleRecord, readingEvent, readingPlanLog } from "./schema";

export interface ReadingIssue {
  code:
    | "EVENT_SEQ" | "EVENT_SLIDE" | "EVENT_CURRENT_PLAN" | "EVENT_SWITCH" | "EVENT_CLOSED" | "EVENT_END"
    | "PLAN_DECISIONS" | "PLAN_DUPLICATE" | "PLAN_READING" | "PLAN_STATIC" | "PLAN_DEFAULT";
  /** 어긋난 사건의 seq. 열람 전체 · plan 의 것이면 null */
  seq: number | null;
  message: string;
}

export interface ReadingCheck {
  /** 계약에 맞는 열람인가 — issues 가 비었다 */
  conforms: boolean;
  issues: ReadingIssue[];
  /** 빈 seq — 사건이 사라졌다는 사실 (가장 큰 seq 까지에서. 끝에서 사라진 것은 알 수 없다) */
  missing_seq: number[];
}

export async function checkReading(db: Db, reading_id: UUID): Promise<ReadingCheck | null> {
  // 넣은 순서가 아니라 created_at 순서로 본다 — 같으면 plan_id 로 (어느 Postgres 에서든 같은 답이 나오게)
  const planRows = (await db.select().from(readingPlanLog).where(eq(readingPlanLog.reading_id, reading_id))).sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.plan_id.localeCompare(b.plan_id),
  );
  const first = planRows[0];
  if (!first) return null;
  const [article] = await db
    .select({ package: articleRecord.package })
    .from(articleRecord)
    .where(and(eq(articleRecord.article_id, first.article_id), eq(articleRecord.article_version, first.article_version)));
  if (!article) return null;
  const slides = new Map(article.package.levels.map((l) => [l.id, l.slides.length]));
  const plans = new Map(planRows.map((p) => [p.plan_id, p]));
  const events = await db.select().from(readingEvent).where(eq(readingEvent.reading_id, reading_id)).orderBy(asc(readingEvent.seq));

  const issues: ReadingIssue[] = [];
  const issue = (code: ReadingIssue["code"], seq: number | null, message: string) => issues.push({ code, seq, message });

  // 불변식 6 — 정적 레벨이면 적은 값이 패키지에서 계산한 값과 같다
  const derived = deriveBlockDecisions(article.package);
  const asMap = (ds: { concept_id: string; decision: string; version: number }[]) =>
    JSON.stringify(ds.map((d) => [d.concept_id, d.decision, d.version]).sort());
  for (const p of planRows)
    if (p.estimator_version === null && asMap(p.block_decisions) !== asMap(derived[p.level] ?? []))
      issue("PLAN_DECISIONS", null, `plan(${p.level}) block_decisions 가 패키지에서 계산한 값과 다르다 (불변식 6)`);

  // 불변식 3 · 5 · 7 — plan 의 뜻. 넣을 때 막지 않는다 (D35): plan 이 거부되면 그 레벨의 사건이 전부 따라 거부된다
  if (new Set(planRows.map((p) => p.level)).size !== planRows.length)
    issue("PLAN_DUPLICATE", null, "한 열람에 같은 레벨의 plan 이 둘이다 (불변식 3)");
  if (new Set(planRows.map((p) => [p.user_id, p.session_id, p.article_id, p.article_version].join("/"))).size !== 1)
    issue("PLAN_READING", null, "한 열람의 plan 들이 다른 독자 · 세션 · 판을 가리킨다 (불변식 3)");
  for (const p of planRows)
    if (p.estimator_version === null && (p.selected_blocks !== null || p.skipped_blocks !== null || p.block_decisions.some((d) => d.reason !== "STATIC_LEVEL")))
      issue("PLAN_STATIC", null, `정적 레벨 plan(${p.level})이 블록 선택이나 다른 reason 을 가졌다 (불변식 5)`);
  // "첫"은 created_at 이 가장 이른 것이다. 같은 순간의 plan 이 둘이면 어느 쪽도 첫 plan 으로 친다
  const earliest = Math.min(...planRows.map((p) => Date.parse(p.created_at)));
  if (planRows.some((p) => p.level_chosen_by === "DEFAULT" && Date.parse(p.created_at) > earliest))
    issue("PLAN_DEFAULT", null, "첫 plan 이 아닌데 DEFAULT 다 (불변식 7)");

  // 불변식 8 — 온전한 열람이면 0부터 1씩
  const have = new Set(events.map((e) => e.seq));
  const missing_seq: number[] = [];
  for (let s = 0; s < (events.at(-1)?.seq ?? -1); s++) if (!have.has(s)) missing_seq.push(s);
  if (events.some((e, n) => e.seq !== n)) issue("EVENT_SEQ", null, "seq 가 0부터 1씩이 아니다 — 온전한 열람이 아니다 (불변식 8)");

  // 불변식 9 · 10 · 11 · 22 — seq 순서로 따라간다
  let cur: UUID | null = null;
  let expectEnter = false;
  let here: number | null = null;
  const ended = new Set<string>();
  events.forEach((e, n) => {
    const p = plans.get(e.plan_id)!; // 넣을 때 본다 (EVENT_PLAN)
    cur ??= e.plan_id;
    if (expectEnter && (e.type !== "SLIDE_ENTERED" || e.plan_id !== cur))
      issue("EVENT_SWITCH", e.seq, `seq ${e.seq} — 전환 바로 다음은 새 plan 의 SLIDE_ENTERED 다 (불변식 10)`);
    expectEnter = false;
    if (e.type === "SLIDE_ENTERED") {
      if (e.slide_index === null || e.slide_index < 0 || e.slide_index >= (slides.get(p.level) ?? 0))
        issue("EVENT_SLIDE", e.seq, `seq ${e.seq} slide_index ${e.slide_index} — 그 레벨의 범위 밖 (불변식 9)`);
      if (e.plan_id !== cur) issue("EVENT_CURRENT_PLAN", e.seq, `seq ${e.seq} — 지금 plan 이 아닌 plan 의 사건이다 (불변식 9)`);
      here = e.slide_index;
    } else if (e.type === "SLIDE_END_SHOWN") {
      const key = `${e.plan_id}/${e.slide_index}`;
      if (e.plan_id !== cur || e.slide_index === null || e.slide_index !== here)
        issue("EVENT_END", e.seq, `seq ${e.seq} — 끝이 나온 장(${e.slide_index})이 지금 장(${here})이 아니다 (불변식 22)`);
      else if (ended.has(key)) issue("EVENT_END", e.seq, `seq ${e.seq} — 같은 plan 의 같은 장에 끝이 두 번 나왔다 (불변식 22)`);
      ended.add(key);
    } else if (e.type === "LEVEL_SWITCHED") {
      const from = e.from_plan_id === null ? undefined : plans.get(e.from_plan_id);
      if (!from || e.from_plan_id !== cur || from.level === p.level)
        issue("EVENT_SWITCH", e.seq, `seq ${e.seq} — 지금 plan 에서 같은 열람의 다른 레벨 plan 으로 (불변식 10)`);
      cur = e.plan_id;
      expectEnter = true;
      here = null;
    } else if (e.type === "CLOSED" && n !== events.length - 1) {
      issue("EVENT_CLOSED", e.seq, `seq ${e.seq} — CLOSED 뒤에 사건이 있다 (불변식 11)`);
    }
  });
  if (expectEnter) issue("EVENT_SWITCH", events.at(-1)!.seq, "전환 뒤에 SLIDE_ENTERED 가 없다 (불변식 10)");

  return { conforms: issues.length === 0, issues, missing_seq };
}
