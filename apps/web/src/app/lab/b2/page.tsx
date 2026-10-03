import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { notoSerif } from "../../../lab/fonts";
import { ReaderB } from "../../../lab/b/ReaderB";
import "../../../lab/b/b.css";

export const metadata: Metadata = { title: "Claro lab B2 — B + 층 전환 (시험)" };

const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

// B2 — 도윤이 고른 B 에 층 표시를 섞어 본 것 (끔 · 꼬리표 · 글꼴). 확정이 아니다. /lab/b 는 그대로 둔다
export default function Page() {
  return (
    <div className={notoSerif.variable}>
      <link rel="stylesheet" href={PRETENDARD} precedence="default" />
      <ReaderB pkg={loadPackage("fomc-2026-09.article.json")} layerModes />
    </div>
  );
}
