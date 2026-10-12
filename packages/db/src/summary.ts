// 완독 · 멈춘 장 · 끝이 나온 완독 — **칸이 아니다. 원장에서 센다** (OBSERVATION §5.2 · §5.3).
// 지식 상태가 아니다: 읽기 사건을 세는 것이고, 값을 매기지 않는다. 같은 계산이 scripts/verify-observation.py reading_summary 에 있다 — 테스트가 둘을 댄다.
import type { LevelId, UUID } from "@claro/contract";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "./append";
import { articleRecord, readingEvent, readingPlanLog } from "./schema";

export interface ReadingSummary {
  /** 어느 plan 에서든 마지막 장에 닿았다 */
  completed: boolean;
  /** 완독이고, 그 마지막 장의 끝이 화면에 나왔다 (D33) */
  completed_to_end: boolean;
  /** seq 가 가장 큰 SLIDE_ENTERED 의 (레벨 · 장) */
  stopped_at: { level: LevelId; slide_index: number } | null;
  /** 멈춘 장의 끝이 나온 뒤였나 */
  stopped_end_shown: boolean;
  /** 레벨마다 가장 멀리 간 장 */
  furthest: Partial<Record<LevelId, number>>;
  /** 레벨 전환으로 떠난 레벨, 일어난 순서대로 — 이탈이 아니다 (§5.3) */
  switched_from: LevelId[];
}

export async function readingSummary(db: Db, reading_id: UUID): Promise<ReadingSummary | null> {
  const plans = await db.select().from(readingPlanLog).where(eq(readingPlanLog.reading_id, reading_id));
  const first = plans[0];
  if (!first) return null;
  const [article] = await db
    .select({ package: articleRecord.package })
    .from(articleRecord)
    .where(and(eq(articleRecord.article_id, first.article_id), eq(articleRecord.article_version, first.article_version)));
  if (!article) return null;
  const lastSlide = new Map(article.package.levels.map((l) => [l.id, l.slides.length - 1]));
  const levelOf = new Map(plans.map((p) => [p.plan_id, p.level]));
  const events = await db.select().from(readingEvent).where(eq(readingEvent.reading_id, reading_id)).orderBy(asc(readingEvent.seq));

  const at = (e: { plan_id: UUID; slide_index: number | null }) => `${levelOf.get(e.plan_id)}/${e.slide_index}`;
  const entered = events.filter((e) => e.type === "SLIDE_ENTERED");
  const ended = new Set(events.filter((e) => e.type === "SLIDE_END_SHOWN").map(at));
  const furthest: Partial<Record<LevelId, number>> = {};
  for (const e of entered) {
    const lv = levelOf.get(e.plan_id)!;
    furthest[lv] = Math.max(furthest[lv] ?? 0, e.slide_index!);
  }
  const last = entered.at(-1);
  return {
    completed: Object.entries(furthest).some(([lv, i]) => i === lastSlide.get(lv as LevelId)),
    completed_to_end: [...lastSlide].some(([lv, i]) => ended.has(`${lv}/${i}`)),
    stopped_at: last ? { level: levelOf.get(last.plan_id)!, slide_index: last.slide_index! } : null,
    stopped_end_shown: !!last && ended.has(at(last)),
    furthest,
    switched_from: events.filter((e) => e.type === "LEVEL_SWITCHED").map((e) => levelOf.get(e.from_plan_id!)!),
  };
}
