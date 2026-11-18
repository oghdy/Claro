import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { StartHome } from "./Start";

// UX-13 (D144) · UX-13b (D146) 시안 — 깔끔한 시작 화면: 머리 · 가장 새 날의 이야기 (이야기마다 들어가기 단추) · 문 둘 (지난 이야기 달력 → /lab/start/days · 개념 지도 → /map). lab 전용 — 실제 첫 화면 (/)은 그대로다.
// `?n=1` · `?n=3` · `?n=4` · `?n=long` = 견본 (오늘 이야기가 하나 · 셋 · 넷일 때 · 긴 이야기가 있을 때의 꼴)
export const metadata: Metadata = { title: "시안 시작 화면 (UX-13b) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  return <StartHome sample={(await searchParams).n} />;
}
