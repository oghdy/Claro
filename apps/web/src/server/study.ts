// 물음 쪽의 기록 (B-0.5 · D37) — 동의 · 물음을 보여줬다 · 답했다. Route Handlers 는 이 함수들을 부르기만 한다.
//   - 동의는 원장 밖이다 (identity.consent). 동의가 없는 독자의 줄은 어느 것도 받지 않는다 (./ledger.ts notRecordable)
//   - 쓰는 길은 appendLedger 뿐. 받은 줄을 계약 타입으로 검사한 뒤 넣는다. 같은 줄을 다시 받으면 성공이다
//   - **응답과 그 증거 줄은 한 거래로 쓴다** — 물음의 target 마다 정확히 한 줄 (불변식 16). 데이터베이스는 "빠짐없이"를 못 본다
//   - 증거 줄을 쓰기 전에 개념을 본다 — leaf · MERGED 아님 · 있는 버전 (불변식 18 · ./concepts.ts). 데이터베이스는 못 본다
//   - `is_correct` 는 **서버가 가린다** — 고르는 물음이고 정답이 있으면 고른 것과 견준다. 쓴 답 · 정답 없는 물음은 null 이다. 기계로 채점하지 않는다
//   - 무리(Claro · 일반 기사)를 적지 않는다. 받는 줄 어디에도 그런 칸이 없다 (D37)
// 값을 매기지 않는다 — 가중치 · 점수 · 지식 상태가 없다.
import { randomUUID } from "node:crypto";
import { OBSERVATION_TYPES, fieldProblems, isUUID, type ProbeExposure, type ProbeResponse, type UUID } from "@claro/contract";
import { appendLedger, consent, probe, probeExposure, probeResponse, reader, readingPlanLog, type Db } from "@claro/db";
import { and, eq } from "drizzle-orm";
import { evidenceProblem } from "./concepts";
import { notRecordable, put, refused, type Outcome } from "./ledger";

/** 지금 안내문의 판 — 글자가 바뀌면 올린다 (study/copy.ts NOTICE) */
export const NOTICE_VERSIONS = [1];

/**
 * 이 번호의 독자에 대해 화면이 알아야 하는 것 — 대응표에 있는가 · 동의했는가 · 이미 보여준 물음.
 * 화면은 이것으로 흐름을 정한다: 모르는 번호면 기사만, 동의 전이면 안내부터, 이미 물은 것은 다시 묻지 않는다 (다른 브라우저로 다시 열어도).
 * 원장에 쓰지 않는다. 사람을 알아볼 값이 없다 — 이름표도 내보내지 않는다
 */
export async function readerStatus(db: Db, user_id: string) {
  if (!isUUID(user_id) || !(await db.select({ id: reader.user_id }).from(reader).where(eq(reader.user_id, user_id))).length) return { known: false as const };
  const consented = (await db.select({ id: consent.consent_id }).from(consent).where(eq(consent.user_id, user_id)).limit(1)).length > 0;
  const asked = await db.select({ probe_id: probeExposure.probe_id, position: probeExposure.position }).from(probeExposure).where(eq(probeExposure.user_id, user_id));
  return { known: true as const, consented, asked };
}

interface ConsentRequest {
  consent_id: UUID;
  user_id: UUID;
  notice_version: number;
  consented_at: string;
}

/** 안내를 읽고 "시작할게요"를 눌렀다 */
export async function giveConsent(db: Db, body: unknown): Promise<Outcome> {
  const b = body as Partial<ConsentRequest> | null;
  if ((await notRecordable(db, b?.user_id)) === "UNKNOWN_READER") {
    refused("Consent", "UNKNOWN_READER", b?.consent_id);
    return { status: "not_recorded", code: "UNKNOWN_READER" };
  }
  const keys = b && typeof b === "object" ? Object.keys(b).sort().join() : "";
  const at = typeof b?.consented_at === "string" ? Date.parse(b.consented_at) : NaN;
  if (keys !== "consent_id,consented_at,notice_version,user_id" || !isUUID(b!.consent_id) || !NOTICE_VERSIONS.includes(b!.notice_version!) || Number.isNaN(at)) {
    refused("Consent", "CONSENT_SHAPE", b?.consent_id);
    return { status: "rejected", code: "CONSENT_SHAPE" };
  }
  const row = b as ConsentRequest;
  if ((await db.select({ id: consent.consent_id }).from(consent).where(eq(consent.consent_id, row.consent_id))).length) return { status: "duplicate" };
  await db.insert(consent).values(row).onConflictDoNothing();
  return { status: "stored" };
}

/** 물음을 보여줬다 — 답이 없어도 남는다 (§6.3) */
export async function showProbe(db: Db, body: unknown): Promise<Outcome> {
  const exposure_id = (body as { exposure_id?: unknown } | null)?.exposure_id;
  const no = await notRecordable(db, (body as { user_id?: unknown } | null)?.user_id);
  if (no) {
    refused("ProbeExposure", no, exposure_id);
    return { status: "not_recorded", code: no };
  }
  const problems = fieldProblems(OBSERVATION_TYPES.ProbeExposure, body);
  // 자리를 적지 않는다 — 물음은 기사의 앞 · 뒤에 따로 선 화면이다. 기사 안의 자리가 아니다 (D37 · D18)
  if ((body as ProbeExposure).shown_at_loc != null) problems.push("shown_at_loc 은 null 이다");
  if (problems.length) {
    refused("ProbeExposure", "LEDGER_FIELD", exposure_id, problems.join(" · "));
    return { status: "rejected", code: "LEDGER_FIELD" };
  }
  const row = body as ProbeExposure;
  if ((await db.select({ id: probeExposure.exposure_id }).from(probeExposure).where(eq(probeExposure.exposure_id, row.exposure_id))).length) return { status: "duplicate" };
  const code = await put(() => appendLedger(db, "ProbeExposure", row));
  if (code === null) return { status: "stored" };
  if (code === "UNIQUE probe_exposure_pkey") return { status: "duplicate" };
  refused("ProbeExposure", code, exposure_id);
  return { status: "rejected", code };
}

/** 화면이 보내는 응답의 칸. `is_correct` 는 서버가 가린다 — 화면이 보내면 거부한다 */
export const RESPONSE_REQUEST_FIELDS = ["interaction_id", "exposure_id", "user_id", "responded_at", "response"] as const;
type ResponseRequest = Pick<ProbeResponse, (typeof RESPONSE_REQUEST_FIELDS)[number]>;

/** 독자가 답했다 — 응답 한 줄 + 그 물음의 target 마다 증거 한 줄. 전부 들어가거나 하나도 안 들어간다 */
export async function answerProbe(db: Db, body: unknown): Promise<Outcome> {
  const interaction_id = (body as { interaction_id?: unknown } | null)?.interaction_id;
  const say = (status: "rejected", code: string, detail?: string): Outcome => (refused("ProbeResponse", code, interaction_id, detail), { status, code });
  const no = await notRecordable(db, (body as { user_id?: unknown } | null)?.user_id);
  if (no) {
    refused("ProbeResponse", no, interaction_id);
    return { status: "not_recorded", code: no };
  }
  const problems = fieldProblems(OBSERVATION_TYPES.ProbeResponse, body, RESPONSE_REQUEST_FIELDS);
  if (problems.length) return say("rejected", "LEDGER_FIELD", problems.join(" · "));
  const req = body as ResponseRequest;
  if ((await db.select({ id: probeResponse.interaction_id }).from(probeResponse).where(eq(probeResponse.interaction_id, req.interaction_id))).length)
    return { status: "duplicate" };

  const [shown] = await db.select().from(probeExposure).where(eq(probeExposure.exposure_id, req.exposure_id));
  if (!shown) return say("rejected", "RESPONSE_EXPOSURE"); // 없는 노출 — 불변식 13
  const [asked] = await db.select().from(probe).where(and(eq(probe.probe_id, shown.probe_id), eq(probe.version, shown.probe_version)));
  if (!asked) return say("rejected", "EXPOSURE_PROBE");
  // 고르는 물음이면 고른 것은 보기 가운데 하나다 — 글자 그대로
  const picked = asked.choices ? asked.choices.indexOf(req.response) : -1;
  if (asked.choices && picked < 0) return say("rejected", "RESPONSE_CHOICE");
  const is_correct = asked.choices && asked.correct_choice !== null ? picked === asked.correct_choice : null;

  // 증거 줄 — target 마다 하나. 무엇을 본 뒤의 답인지는 복사하지 않고 가리킨다 (§7.3): 기사를 읽는 중이었으면 그 plan · 열람 · 판
  for (const t of asked.targets) {
    const bad = evidenceProblem(t.concept_id, t.version);
    if (bad) return say("rejected", bad); // 불변식 18 — 응답도 넣지 않는다 (target 마다 정확히 하나를 지킬 수 없다)
  }
  const [plan] = shown.plan_id ? await db.select().from(readingPlanLog).where(eq(readingPlanLog.plan_id, shown.plan_id)) : [];
  const code = await put(() =>
    db.transaction(async (tx) => {
      await appendLedger(tx, "ProbeResponse", { ...req, is_correct });
      for (const t of asked.targets)
        await appendLedger(tx, "KnowledgeEvidence", {
          event_id: randomUUID(), user_id: req.user_id, concept_id: t.concept_id, content_version: t.version, timestamp: req.responded_at,
          evidence_type: "PROBE_RESPONSE", position: shown.position, interaction_id: req.interaction_id, probe_id: shown.probe_id,
          article_id: plan?.article_id ?? null, article_version: plan?.article_version ?? null, content_block_id: null,
          exposure_context: { session_id: shown.session_id, reading_id: plan?.reading_id ?? null, plan_id: plan?.plan_id ?? null },
          model_version: null,
        });
    }),
  );
  if (code === null) return { status: "stored" };
  if (code === "UNIQUE probe_response_pkey") return { status: "duplicate" };
  return say("rejected", code);
}
