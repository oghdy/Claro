import type { Metadata, Viewport } from "next";
import { paper } from "@claro/tokens";
import { StartEnd } from "../Start";

// UX-13b (D146) 시안 — 이야기 끝 장면의 설계 그림 (정지 그림): 끝에서 할 일 하나 = "다른 이야기 보기" → 달력 화면. lab 전용 — 실제 이야기 화면 (kit)은 그대로다. `?k=long` = 긴 이야기의 끝
export const metadata: Metadata = { title: "시안 이야기 끝 (UX-13b) · Claro", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };

export default async function Page({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  return <StartEnd kind={(await searchParams).k === "long" ? "long" : "short"} />;
}
