import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { StartDays } from "../Start";

// UX-13 (D144) 시안 — 따로 선 달력 화면: UX-12d 의 달력 + 고른 날의 이야기 + "그 전". lab 전용. `?many=1` = 날이 쌓인 견본
export const metadata: Metadata = { title: "시안 달력 화면 (UX-13) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ many?: string }> }) {
  return <StartDays many={(await searchParams).many === "1"} />;
}
