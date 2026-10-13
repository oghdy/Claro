import { cache } from "react";
import type { Metadata } from "next";
import { RecordedReader } from "../reader/RecordedReader";
import { db } from "../server/db";
import { goldenKey } from "../server/golden";
import { readArticle } from "../server/ledger";
import "../reader/reader.css";

// 기사는 데이터베이스에서 온다 — 패키지와 판의 키 (article_id · article_version). 요청마다 읽는다.
// 지금 보여주는 기사는 골든 한 판이다. 어느 기사를 보여줄지 고르는 일은 아직 없다
export const dynamic = "force-dynamic";

const article = cache(async () => {
  const key = goldenKey();
  const found = await readArticle(await db(), key.article_id, key.article_version);
  if (!found) throw new Error(`기사 ${key.article_id} v${key.article_version} 가 데이터베이스에 없다 — pnpm --filter @claro/web seed`);
  return found;
});

// 브랜드는 프론트가 붙인다 (§2)
export async function generateMetadata(): Promise<Metadata> {
  return { title: `Claro — ${(await article()).package.title}` };
}

export default async function Page() {
  const a = await article();
  return (
    <>
      {/* 스크립트가 없으면 등장 효과가 풀리지 않는다 — 첫 장은 그대로 읽히게 */}
      <noscript>
        <style>{".reader .r-card *, .reader .r-end { opacity: 1 !important; transform: none !important; filter: none !important; }"}</style>
      </noscript>
      <RecordedReader pkg={a.package} article={{ article_id: a.article_id, article_version: a.article_version }} />
    </>
  );
}
