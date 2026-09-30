import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { ReaderB } from "../../../lab/b/ReaderB";
import "../../../lab/b/b.css";

export const metadata: Metadata = { title: "Claro lab B — 카드 · 고딕 · 촘촘" };

// Pretendard 는 Google Fonts 에 없다. 탐색에서는 CDN 을 쓰고, 고르면 F-2b 에서 직접 싣는다
const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={PRETENDARD} precedence="default" />
      <ReaderB pkg={loadPackage("fomc-2026-09.article.json")} />
    </>
  );
}
