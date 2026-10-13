import { isUUID } from "@claro/contract";
import { db } from "../../../server/db";
import { peekLedger } from "../../../server/ledger";

// 원장에 남은 것을 내어 준다 — **이 컴퓨터에서 돌릴 때만.** PGlite 는 한 프로세스만 여니, 켜져 있는 서버에게 물어야 원장을 볼 수 있다
// (scripts/ledger.mjs · e2e 가 읽는다). CLARO_PEEK=1 일 때만 있고, 배포(Vercel)에서는 그 값이 있어도 없다. 실제 Postgres 에서는 SQL 로 본다
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (process.env.CLARO_PEEK !== "1" || process.env.VERCEL) return new Response(null, { status: 404 });
  const user_id = new URL(req.url).searchParams.get("user_id");
  return Response.json(await peekLedger(await db(), isUUID(user_id) ? user_id : undefined));
}
