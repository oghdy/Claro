import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPackage } from "../../../lib/load";
import "../../../reader/reader.css";
import { Probe } from "./Probe";

export const metadata: Metadata = { title: "Claro — 테스트: 화면이 아는 순간" };

// 읽기 기록(OBSERVATION §5)은 다음 Step 이다. 여기서는 본 화면이 그 순간들을 한 곳에서 아는지만 본다 (e2e/reader-moments.spec.ts):
// 지금 장이 바뀌었다 · 레벨을 바꿨다 · 이 장의 끝이 화면에 나왔다 (마지막 장 포함)
// 배포(Vercel)에서는 닫는다 — 빌드할 때 404 로 굳는다 (D36). 테스트는 이 컴퓨터의 빌드로 돈다
export default function Page() {
  if (process.env.VERCEL) notFound();
  return <Probe pkg={loadPackage("fomc-2026-09.article.json")} />;
}
