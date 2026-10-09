import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { ReaderB3 } from "../../../lab/b3/ReaderB3";
import "../../../lab/b/b.css";
import "../../../lab/b3/b3.css";

export const metadata: Metadata = { title: "Claro lab B3 — B 다듬기 (시험)" };

const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

// B3 — B2 에서 전환 · 배치를 다듬어 본 것. 확정이 아니다. /lab/b · /lab/b2 는 그대로 둔다
export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={PRETENDARD} precedence="default" />
      <noscript>
        <style>{".lab-b3 .b-pager .b-card *, .lab-b3 .b-pager .b3-end { opacity: 1 !important; transform: none !important; }"}</style>
      </noscript>
      <ReaderB3 pkg={loadPackage("fomc-2026-09.article.json")} />
    </>
  );
}
