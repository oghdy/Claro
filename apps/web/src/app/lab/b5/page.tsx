import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { ReaderB5 } from "../../../lab/b5/ReaderB5";
import "../../../lab/b/b.css";
import "../../../lab/b3/b3.css";
import "../../../lab/b5/b5.css";

export const metadata: Metadata = { title: "Claro lab B5 — 물음을 따라가는 여정 (시험)" };

const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

// B5 — 위쪽 막대와 옆으로 넘어가는 전환을 걷어 내고, 누른 물음이 다음 화면의 머리가 되게 한 것. 확정이 아니다
export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={PRETENDARD} precedence="default" />
      <noscript>
        <style>{".lab-b5 .b5-deck .b-card *, .lab-b5 .b5-deck .b3-end { opacity: 1 !important; transform: none !important; }"}</style>
      </noscript>
      <ReaderB5 pkg={loadPackage("fomc-2026-09.article.json")} />
    </>
  );
}
