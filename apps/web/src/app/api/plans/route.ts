import { db } from "../../../server/db";
import { openPlan } from "../../../server/ledger";

// 열람의 한 레벨을 보여줬다 → plan 한 줄. block_decisions 는 서버가 패키지에서 계산한다.
// 답은 언제나 { status }: stored · duplicate(성공) · rejected · not_recorded. 5xx 는 "못 넣었다 — 다시 보내라"다
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => undefined);
  if (body === undefined) return Response.json({ status: "rejected", code: "BAD_REQUEST" }, { status: 400 });
  return Response.json(await openPlan(await db(), body));
}
