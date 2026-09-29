import type { Metadata } from "next";
import { ArticleReader } from "../components/ArticleReader";
import { loadPackage } from "../lib/load";

const GOLDEN = "fomc-2026-09.article.json";

// 브랜드는 프론트가 붙인다 (§2)
export function generateMetadata(): Metadata {
  return { title: `Claro — ${loadPackage(GOLDEN).title}` };
}

export default function Page() {
  const pkg = loadPackage(GOLDEN);
  return <ArticleReader pkg={pkg} />;
}
