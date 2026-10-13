import { db } from "../../../../../server/db";
import { readArticle } from "../../../../../server/ledger";

// 기사 한 판 — 패키지와 판의 키 (article_id · article_version). 화면은 기록을 남길 때 이 키로 판을 가리킨다 (OBSERVATION §2.1)
export async function GET(_req: Request, ctx: { params: Promise<{ article_id: string; article_version: string }> }) {
  const { article_id, article_version } = await ctx.params;
  const article = /^\d+$/.test(article_version) ? await readArticle(await db(), article_id, Number(article_version)) : null;
  return article ? Response.json(article) : Response.json({ error: "NOT_FOUND" }, { status: 404 });
}
