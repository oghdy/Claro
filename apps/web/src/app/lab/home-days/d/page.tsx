import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { HomeDays } from "../HomeDays";

// UX-12c (D140) 시안 날짜 판 — 담백 판 (c)에서 "이어지는 이야기" 칸을 빼고 날짜를 왼쪽 칸의 큰 숫자로. lab 전용 — 실제 첫 화면 (/)은 그대로다. `?many=1` = 날이 쌓인 견본
export const metadata: Metadata = { title: "시안 날짜 판 (UX-12c) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ many?: string }> }) {
  return <HomeDays variant="d" many={(await searchParams).many === "1"} />;
}
