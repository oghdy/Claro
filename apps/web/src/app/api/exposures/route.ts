import { db } from "../../../server/db";
import { showProbe } from "../../../server/study";

// 답은 언제나 { status }: stored · duplicate(성공) · rejected · not_recorded. 5xx 는 "못 넣었다 — 다시 보내라"다 (server/study.ts)
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => undefined);
  if (body === undefined) return Response.json({ status: "rejected", code: "BAD_REQUEST" }, { status: 400 });
  return Response.json(await showProbe(await db(), body));
}
