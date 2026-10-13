// 골든 한 판을 데이터베이스에 넣는다 — 화면이 보여주는 기사는 이 판이다 (app/page.tsx).
// 픽스처는 한 개체를 두 파일에 둔다 (DATA_MODEL §11): record 파일(판의 키 · 저작 데이터) + 패키지 파일. 이어 붙이고 `_` 주석을 뺀다 — 발행물에는 없다
import { stripAnnotations, type ArticleRecord } from "@claro/contract";
import { appendArticle, type Db } from "@claro/db";
import { loadRaw } from "../lib/load";
import { readArticle } from "./ledger";

export const GOLDEN_RECORD = "fomc-2026-09.record.json";

/** 골든 판의 키 */
export function goldenKey(): { article_id: string; article_version: number } {
  const { article_id, article_version } = loadRaw(GOLDEN_RECORD) as { article_id: string; article_version: number };
  return { article_id, article_version };
}

/** 이미 있으면 아무것도 하지 않는다 (판은 불변이다 — 고쳐 넣지 않는다). 넣었으면 true */
export async function seedGolden(db: Db): Promise<boolean> {
  const raw = loadRaw(GOLDEN_RECORD) as { article_id: string; article_version: number; authoring: unknown; _package: string };
  if (await readArticle(db, raw.article_id, raw.article_version)) return false;
  const record = stripAnnotations({
    article_id: raw.article_id, article_version: raw.article_version, package: loadRaw(raw._package), authoring: raw.authoring,
  }) as ArticleRecord;
  await appendArticle(db, record);
  return true;
}
