import type { Metadata } from "next";
import { parseArticlePackage } from "@claro/contract";
import { ArticleReader } from "../../../components/ArticleReader";
import { loadRaw } from "../../../lib/load";

export const metadata: Metadata = { title: "Claro — 테스트: 모르는 type" };

// 모르는 type 이 오면 그 블록의 text 를 그린다 (§7.9 · D14).
// 골든 입문 레벨에서 만든다: 모든 블록의 type 을 모르는 이름으로 바꾸고 구조 필드를 없앤다 — text 만 남는다.
// 그려진 글이 골든 블록의 text 와 같으면 통과다 (e2e/unknown-type.spec.ts).
// 레벨이 하나라 전환 UI 도 없어야 한다 (D22).
function build(): unknown {
  const raw = loadRaw("fomc-2026-09.article.json") as { levels: { id: string; slides: { blocks: { type: string; text: string }[] }[] }[] };
  const basic = raw.levels.find((l) => l.id === "basic")!;
  const slides = basic.slides.map((s) => ({
    ...s,
    blocks: s.blocks.map((b) => ({ type: `future_${b.type}`, text: b.text, shape: { anything: [1, 2, 3] } })),
  }));
  return { ...raw, levels: [{ ...basic, slides }] };
}

export default function Page() {
  return <ArticleReader pkg={parseArticlePackage(build())} />;
}
