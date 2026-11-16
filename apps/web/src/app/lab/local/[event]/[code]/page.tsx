import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import { paper } from "@claro/tokens";
import { listLocal, readLocal } from "../../files";
import { LocalPreview } from "../../LocalPreview";
import "../../../../../episode/episode.css";
import "../../../../../episode/kit/frames/frames.css";
import "../../../../../episode/episodes/fomc/fomc.css";
import "../../../../../episode/episodes/pipc/pipc.css";
import "../../../../../episode/today/today.css";
import "../../local.css";

// 미리 보기 (L-1 · D129) — `/lab/local/<사건>/<code>`. 로컬 세션이 쓴 판 (사건 폴더의 local/<code>/)을 **실제 화면과 같은 부품**으로 그린다 (긴 이야기 = kit/Episode · 짧은 이야기 = kit/Short · real).
// 도윤이 올리기 전에 폰으로 읽는 곳이다. 이야기 목록 (episode/catalog.tsx)에 없는 이야기도 선다 — 첫 화면 · 실제 주소 (/s · /short) · 지도에는 나가지 않는다 (목록에 한 줄을 적어야 나간다).
// **정적이다** — 빌드할 때 그 폴더의 파일을 읽어 싣는다 (files.ts). 없는 주소는 404. 맨 위 띠 하나로 미리 보기임을 밝힌다.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: paper.paper };
export const metadata: Metadata = { title: "Claro 미리 보기 — 아직 올리지 않은 판", robots: { index: false } };
export const dynamicParams = false;

// 빌드는 apps/web 에서 돈다 (next build · Vercel 의 Root Directory) — 저장소 뿌리는 두 칸 위. 뿌리에서 도는 빌드도 받는다 (사건 폴더가 있는 쪽)
const ROOT = [path.join(process.cwd(), "../.."), process.cwd()].find((r) => existsSync(path.join(r, "packages/pipeline/data/events"))) ?? path.join(process.cwd(), "../..");

type Params = Promise<{ event: string; code: string }>;

export function generateStaticParams() {
  return listLocal(ROOT);
}

export default async function Page({ params }: { params: Params }) {
  const { event, code } = await params;
  const story = readLocal(ROOT, event, code);
  if (!story) notFound();
  return <LocalPreview kind={story.kind} from={story.from} file={story.file} screen={story.screen} line={story.meta?.line ?? null} store={story.store} />;
}
