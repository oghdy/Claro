import { db } from "../../../server/db";
import { MAX_EVENTS, acceptEvents } from "../../../server/ledger";

// 읽기 사건을 받는다 — { events: ReadingEvent[] }. 줄마다 답한다: stored · duplicate(성공) · rejected · not_recorded.
// 같은 event_id 를 두 번 받으면 성공이다. 순서 · 빈 seq 로 거부하지 않는다 (D34)
export async function POST(req: Request) {
  const body = (await req.json().catch(() => undefined)) as { events?: unknown } | undefined;
  const events = body && typeof body === "object" && Object.keys(body).join() === "events" ? body.events : undefined;
  if (!Array.isArray(events) || events.length > MAX_EVENTS) return Response.json({ status: "rejected", code: "BAD_REQUEST" }, { status: 400 });
  return Response.json({ results: await acceptEvents(await db(), events) });
}
