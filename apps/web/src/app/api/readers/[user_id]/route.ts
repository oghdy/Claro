import { db } from "../../../../server/db";
import { readerStatus } from "../../../../server/study";

// 이 번호의 독자 — 대응표에 있는가 · 동의했는가 · 이미 보여준 물음. 화면이 흐름을 정하는 데 쓴다. 원장에 쓰지 않는다
export async function GET(_req: Request, ctx: { params: Promise<{ user_id: string }> }) {
  return Response.json(await readerStatus(await db(), (await ctx.params).user_id), { headers: { "cache-control": "no-store" } });
}
