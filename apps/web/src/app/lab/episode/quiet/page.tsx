import type { Metadata, Viewport } from "next";
import { QuietSample } from "../episodes/quiet-sample";
import "../episode.css";
import "../kit/frames/frames.css";

// UX-4 — 기본 풀이 "다. 조용히"의 **견본**. 실제 사건이 아니다 — 사실 · 숫자 · 이름이 하나도 없다 (모양만 본다).
// 사람이 숨진 사건 · 부고에는 체험이 없다 (D61 ④). 그런 회차의 풀이 장면이 어떤 모양인지만 보인다. 시안 전용.
export const metadata: Metadata = { title: "Claro 시안 — 기본 풀이 · 조용히 (견본 · 실제 사건 아님)" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default function Page() {
  return <QuietSample />;
}
