// 독자 기록 API 가 하는 일 (B-0.4b). Route Handlers 는 이 함수들을 부르기만 한다.
//   - 쓰는 길은 appendLedger 뿐이다. 받은 줄을 계약 타입(@claro/contract)으로 검사한 뒤 넣는다
//   - plan 의 block_decisions 는 **서버가 패키지에서 계산한다.** 화면이 보낸 값을 받지 않는다 (불변식 6 · D34)
//   - 같은 event_id · plan_id 를 두 번 받으면 성공이다 — 화면은 못 보낸 줄을 다시 보낸다
//   - 대응표(identity.reader)에 없는 user_id · user_id 없는 줄은 **기록하지 않는다.** 읽기는 된다 (OBSERVATION §3 · D34)
//   - 동의(identity.consent)가 없는 독자의 줄도 **기록하지 않는다** (D37). 물음 쪽(노출 · 응답 · 증거 · 동의)은 ./study.ts
//   - 거부한 것은 서버 로그에만 남긴다. 원장에 넣지 않는다
// 원장은 받는다 — 여기서도 사건의 뜻(순서가 계약대로인가)으로 거부하지 않는다. 그것은 읽을 때 본다 (packages/db checkReading).
import {
  OBSERVATION_TYPES, deriveBlockDecisions, fieldProblems, isUUID,
  type ArticlePackage, type ReadingEvent, type ReadingPlanLog, type UUID,
} from "@claro/contract";
import {
  appendLedger, articleRecord, checkReading, consent, knowledgeEvidence, ledgerRejection, probe, probeExposure, probeResponse, reader, readingEvent,
  readingPlanLog, readingSummary, type Db,
} from "@claro/db";
import { and, asc, eq, inArray } from "drizzle-orm";

export interface Article {
  article_id: UUID;
  article_version: number;
  package: ArticlePackage;
}

/** 기사 한 판 — 패키지와 판의 키. 저작 데이터(authoring)는 내려보내지 않는다 (DATA_MODEL §11) */
export async function readArticle(db: Db, article_id: string, article_version: number): Promise<Article | null> {
  if (!isUUID(article_id) || !Number.isInteger(article_version)) return null;
  const [row] = await db
    .select({ article_id: articleRecord.article_id, article_version: articleRecord.article_version, package: articleRecord.package })
    .from(articleRecord)
    .where(and(eq(articleRecord.article_id, article_id), eq(articleRecord.article_version, article_version)));
  return row ?? null;
}

/** stored 넣었다 · duplicate 이미 있다(성공) · rejected 원장이 거부했다(다시 보내도 같다) · not_recorded 기록하지 않는 독자다 */
export type Outcome =
  | { status: "stored" | "duplicate" }
  | { status: "rejected" | "not_recorded"; code: string };

/** 서버 로그에만. 독자 글 · 사람을 알아볼 값이 없다 — 줄의 종류, 까닭, 줄의 키뿐이다 */
export function refused(kind: string, code: string, id: unknown, detail?: string): void {
  console.warn(`[claro] ledger ${JSON.stringify({ refused: kind, code, id: isUUID(id) ? id : null, detail })}`);
}

/**
 * 이 독자의 줄을 기록해도 되나. 되면 null, 안 되면 까닭:
 *   UNKNOWN_READER  대응표에 없는 user_id · user_id 없음 (OBSERVATION §3 · D34)
 *   NO_CONSENT      안내를 읽고 "시작할게요"를 누른 적이 없다 — **동의 전에는 아무것도 기록하지 않는다** (D37). plan · 사건 · 노출 · 응답 전부
 */
export async function notRecordable(db: Db, user_id: unknown): Promise<"UNKNOWN_READER" | "NO_CONSENT" | null> {
  if (!isUUID(user_id)) return "UNKNOWN_READER";
  if (!(await db.select({ user_id: reader.user_id }).from(reader).where(eq(reader.user_id, user_id))).length) return "UNKNOWN_READER";
  if (!(await db.select({ id: consent.consent_id }).from(consent).where(eq(consent.user_id, user_id)).limit(1)).length) return "NO_CONSENT";
  return null;
}

/** 거부면 까닭을, 거부가 아닌 실패(접속 등)면 그대로 던진다 — 그 줄은 화면이 다시 보낸다 */
export async function put(fn: () => Promise<void>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    const code = ledgerRejection(e);
    if (code === null) throw e;
    return code;
  }
}

/** 화면이 보내는 plan 의 칸. 나머지 여섯은 서버가 채운다 — 정적 레벨이라 null · [] 이고, block_decisions 는 계산한다 */
export const PLAN_REQUEST_FIELDS = [
  "plan_id", "user_id", "session_id", "reading_id", "article_id", "article_version", "created_at", "level", "level_chosen_by",
] as const;
export type PlanRequest = Pick<ReadingPlanLog, (typeof PLAN_REQUEST_FIELDS)[number]>;

/** 열람의 한 레벨을 보여줬다 — plan 한 줄 */
export async function openPlan(db: Db, body: unknown): Promise<Outcome> {
  const plan_id = (body as { plan_id?: unknown } | null)?.plan_id;
  const no = await notRecordable(db, (body as { user_id?: unknown } | null)?.user_id);
  if (no) {
    refused("ReadingPlanLog", no, plan_id);
    return { status: "not_recorded", code: no };
  }
  const problems = fieldProblems(OBSERVATION_TYPES.ReadingPlanLog, body, PLAN_REQUEST_FIELDS);
  if (problems.length) {
    refused("ReadingPlanLog", "LEDGER_FIELD", plan_id, problems.join(" · "));
    return { status: "rejected", code: "LEDGER_FIELD" };
  }
  const req = body as PlanRequest;
  if ((await db.select({ plan_id: readingPlanLog.plan_id }).from(readingPlanLog).where(eq(readingPlanLog.plan_id, req.plan_id))).length)
    return { status: "duplicate" };
  const article = await readArticle(db, req.article_id, req.article_version);
  const block_decisions = article && deriveBlockDecisions(article.package)[req.level];
  if (!article || !block_decisions) {
    const code = article ? "PLAN_LEVEL" : "PLAN_ARTICLE";
    refused("ReadingPlanLog", code, plan_id);
    return { status: "rejected", code };
  }
  const code = await put(() =>
    appendLedger(db, "ReadingPlanLog", {
      ...req, estimator_version: null, selected_blocks: null, skipped_blocks: null, block_decisions, narrative_form: null, probe_plan: [],
    }),
  );
  if (code === null) return { status: "stored" };
  if (code === "UNIQUE reading_plan_log_pkey") return { status: "duplicate" }; // 같은 줄이 동시에 두 번 왔다
  refused("ReadingPlanLog", code, plan_id);
  return { status: "rejected", code };
}

export const MAX_EVENTS = 200;

/** 읽기 사건을 받는다 — 줄마다 따로 넣는다. 한 줄이 거부돼도 나머지는 남는다 */
export async function acceptEvents(db: Db, rows: unknown[]): Promise<(Outcome & { event_id: string | null })[]> {
  const ids = rows.map((r) => (r as { event_id?: unknown } | null)?.event_id).filter(isUUID);
  const have = new Set(
    ids.length ? (await db.select({ event_id: readingEvent.event_id }).from(readingEvent).where(inArray(readingEvent.event_id, ids))).map((r) => r.event_id) : [],
  );
  const readers = new Map<unknown, Awaited<ReturnType<typeof notRecordable>>>();
  const out: (Outcome & { event_id: string | null })[] = [];
  for (const row of rows) {
    const raw = row as { event_id?: unknown; user_id?: unknown } | null;
    const event_id = isUUID(raw?.event_id) ? raw.event_id : null;
    if (!readers.has(raw?.user_id)) readers.set(raw?.user_id, await notRecordable(db, raw?.user_id));
    const no = readers.get(raw?.user_id);
    if (no) {
      refused("ReadingEvent", no, event_id);
      out.push({ event_id, status: "not_recorded", code: no });
      continue;
    }
    const problems = fieldProblems(OBSERVATION_TYPES.ReadingEvent, row);
    if (problems.length) {
      refused("ReadingEvent", "LEDGER_FIELD", event_id, problems.join(" · "));
      out.push({ event_id, status: "rejected", code: "LEDGER_FIELD" });
      continue;
    }
    if (have.has(event_id!)) {
      out.push({ event_id, status: "duplicate" });
      continue;
    }
    const code = await put(() => appendLedger(db, "ReadingEvent", row as ReadingEvent));
    if (code === null) (have.add(event_id!), out.push({ event_id, status: "stored" }));
    else if (code === "UNIQUE reading_event_pkey") out.push({ event_id, status: "duplicate" });
    else (refused("ReadingEvent", code, event_id), out.push({ event_id, status: "rejected", code }));
  }
  return out;
}

/**
 * 원장에 남은 것 — 열람마다 plan · 사건 · 원장에서 센 값(완독 · 멈춘 장) · 계약에 맞는가. **이 컴퓨터에서 볼 때만** (api/peek 가 막는다).
 * 화면이 아니다. 세고 견주기만 한다 — 값을 매기지 않는다.
 */
export async function peekLedger(db: Db, user_id?: string) {
  const readers = await db.select({ user_id: reader.user_id, label: reader.label }).from(reader).orderBy(asc(reader.label));
  const plans = await db.select().from(readingPlanLog).orderBy(asc(readingPlanLog.created_at));
  const events = await db.select().from(readingEvent).orderBy(asc(readingEvent.seq));
  const mine = <T extends { user_id: string }>(xs: T[]) => xs.filter((x) => !user_id || x.user_id === user_id);
  // 물음 쪽 — 노출 · 응답 · 증거 · 동의. 보여준 순서대로
  const exposures = mine(await db.select().from(probeExposure).orderBy(asc(probeExposure.shown_at)));
  const responses = mine(await db.select().from(probeResponse).orderBy(asc(probeResponse.responded_at)));
  const evidence = mine(await db.select().from(knowledgeEvidence).orderBy(asc(knowledgeEvidence.timestamp)));
  const consents = mine(await db.select().from(consent).orderBy(asc(consent.consented_at)));
  const ids = [...new Set(plans.filter((p) => !user_id || p.user_id === user_id).map((p) => p.reading_id))];
  const readings = [];
  for (const reading_id of ids) {
    const own = plans.filter((p) => p.reading_id === reading_id);
    readings.push({
      reading_id,
      user_id: own[0]!.user_id,
      session_id: own[0]!.session_id,
      plans: own,
      events: events.filter((e) => e.reading_id === reading_id),
      summary: await readingSummary(db, reading_id),
      check: await checkReading(db, reading_id),
    });
  }
  const probes = await db.select().from(probe).orderBy(asc(probe.prompt));
  return {
    readers, readings, exposures, responses, evidence, consents, probes,
    rows: { reading_plan_log: plans.length, reading_event: events.length, probe_exposure: exposures.length, probe_response: responses.length, knowledge_evidence: evidence.length },
  };
}
