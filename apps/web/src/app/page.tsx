import type { Metadata } from "next";
import { GOLDEN_RECORD, loadPackage, loadRaw } from "../lib/load";
import { RecordedReader } from "../reader/RecordedReader";
import "../reader/reader.css";

// **기사는 빌드할 때 싣는다 — 첫 화면은 데이터베이스를 읽지 않는다** (D35: 데이터베이스가 죽어도 기사는 뜬다).
// 판은 불변이라 요청마다 읽을 이유가 없다. 이 페이지는 정적이다: 빌드가 픽스처에서 패키지와 판의 키를 읽어 HTML 에 넣는다.
// 지금 보여주는 기사는 골든 한 판이다. 같은 판이 데이터베이스에도 있어야 기록이 그 판을 가리킬 수 있다 (`seed` — 화면의 패키지와 같은 글인지는 테스트가 본다).
// 어느 기사를 보여줄지 고르는 일은 아직 없다
export const dynamic = "force-static";

function article() {
  const record = loadRaw(GOLDEN_RECORD) as { article_id: string; article_version: number; _package: string };
  return { article_id: record.article_id, article_version: record.article_version, package: loadPackage(record._package) };
}

// 브랜드는 프론트가 붙인다 (§2)
export function generateMetadata(): Metadata {
  return { title: `Claro — ${article().package.title}` };
}

export default function Page() {
  const a = article();
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
