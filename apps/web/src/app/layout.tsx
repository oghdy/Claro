import type { Metadata, Viewport } from "next";
import { cssVariables } from "@claro/tokens";
// Pretendard 를 직접 싣는다 (pretendard@1.3.9 · SIL OFL). 글자 묶음 92개로 나뉜 가변 글꼴 — 화면에 쓰인 글자의 묶음만 같은 서버에서 받는다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = { title: "Claro" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <style>{cssVariables()}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
