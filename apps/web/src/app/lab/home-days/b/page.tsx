import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { HomeDays } from "../HomeDays";

// UX-12 (D136) 시안 나 — 날짜마다 접힘. lab 전용 — 실제 첫 화면 (/)은 그대로다. `?many=1` = 날이 쌓인 견본 (그래서 요청마다 그린다 — 실제 첫 화면은 정적이다)
export const metadata: Metadata = { title: "시안 나 — 날짜마다 접힘 · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ many?: string }> }) {
  return <HomeDays variant="b" many={(await searchParams).many === "1"} />;
}
