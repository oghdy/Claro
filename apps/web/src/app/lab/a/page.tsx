import type { Metadata } from "next";
import { loadPackage } from "../../../lib/load";
import { notoSerif } from "../../../lab/fonts";
import { ReaderA } from "../../../lab/a/ReaderA";
import "../../../lab/a/a.css";

export const metadata: Metadata = { title: "Claro lab A — 세로 · 명조 · 종이" };

export default function Page() {
  return (
    <div className={notoSerif.variable}>
      <ReaderA pkg={loadPackage("fomc-2026-09.article.json")} />
    </div>
  );
}
