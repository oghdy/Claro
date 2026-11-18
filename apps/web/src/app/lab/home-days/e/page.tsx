import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { HomeDays } from "../HomeDays";

// UX-12d (D142) 시안 달력 판 — 이번 달 7칸 달력 + 그 아래 고른 날의 이야기. lab 전용 — 실제 첫 화면 (/)은 그대로다. `?many=1` = 날이 쌓인 견본
export const metadata: Metadata = { title: "시안 달력 판 (UX-12d) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ many?: string }> }) {
  return <HomeDays variant="e" many={(await searchParams).many === "1"} />;
}
