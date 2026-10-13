import type { Metadata, Viewport } from "next";
import { cssVariables } from "@claro/tokens";
// Pretendard 를 직접 싣는다 (pretendard@1.3.9 · SIL OFL). 글자 묶음 92개로 나뉜 가변 글꼴 — 화면에 쓰인 글자의 묶음만 같은 서버에서 받는다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

// 아직 공개하는 서비스가 아니다 — 검색에 걸리지 않게 한다 (D36 · D37). robots.ts 와 같이
export const metadata: Metadata = { title: "Claro", robots: { index: false, follow: false, nocache: true } };

// 번호가 있는 링크(?r=<UUID>)로 열었으면, 화면이 누구인지 알 때까지 첫 그림을 가려 둔다 (study.css · study/Study.tsx 가 걷는다).
// 링크 없이 온 사람에게는 아무 일도 하지 않는다 — 기사가 지금처럼 바로 보인다. 화면의 스크립트가 끝내 안 돌면 8초 뒤에 스스로 걷는다 (읽는 것을 막지 않는다)
const GATE = `if(/[?&]r=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(&|$)/i.test(location.search)){document.documentElement.setAttribute("data-gate","");setTimeout(function(){document.documentElement.removeAttribute("data-gate")},8000)}`;
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <style>{cssVariables()}</style>
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
        {/* 스크립트가 못 돌면 가린 것을 걷을 것도 없다 — 가리지 않는다 */}
        <noscript>
          <style>{"html[data-gate] body > * { visibility: visible !important; }"}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
