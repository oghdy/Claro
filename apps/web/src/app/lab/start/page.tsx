import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { StartHome } from "./Start";

// UX-13 (D144) 시안 — 깔끔한 시작 화면: 머리 · 한마디 · 가장 새 날의 이야기 · 문 둘 (지난 이야기 달력 → /lab/start/days · 개념 지도 → /map). lab 전용 — 실제 첫 화면 (/)은 그대로다
export const dynamic = "force-static";
export const metadata: Metadata = { title: "시안 시작 화면 (UX-13) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default function Page() {
  return <StartHome />;
}
