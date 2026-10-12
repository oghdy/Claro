import type { Metadata } from "next";
import { loadPackage } from "../lib/load";
import { Reader } from "../reader/Reader";
import { DEFAULT_MOTION, isMotionId } from "../reader/motions";
import "../reader/reader.css";

const GOLDEN = "fomc-2026-09.article.json";

// 브랜드는 프론트가 붙인다 (§2)
export function generateMetadata(): Metadata {
  return { title: `Claro — ${loadPackage(GOLDEN).title}` };
}

// ?m=a|b|c — 넘어가는 움직임 안을 골라 본다. 도윤이 고르면(F-2b 물음 6) 이 갈림은 지운다
export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  return (
    <>
      {/* 스크립트가 없으면 등장 효과가 풀리지 않는다 — 첫 장은 그대로 읽히게 */}
      <noscript>
        <style>{".reader .r-card *, .reader .r-end { opacity: 1 !important; transform: none !important; }"}</style>
      </noscript>
      <Reader pkg={loadPackage(GOLDEN)} motionId={isMotionId(m) ? m : DEFAULT_MOTION} />
    </>
  );
}
