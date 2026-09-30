import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { gowunBatang, plexSansKr } from "../../../lab/fonts";
import { ReaderC } from "../../../lab/c/ReaderC";
import "../../../lab/c/c.css";

export const metadata: Metadata = { title: "Claro lab C — 이어 읽기 · 섞기 · 문서" };

export default function Page() {
  return (
    <div className={`${gowunBatang.variable} ${plexSansKr.variable}`}>
      <ReaderC pkg={loadPackage("fomc-2026-09.article.json")} />
    </div>
  );
}
