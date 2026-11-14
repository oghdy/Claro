import type { Metadata, Viewport } from "next";
import { PrivacyPlay } from "../PlayEpisodes";

// UX-9 — 진짜 체험 시안 (개인정보). 원래 회차 화면 (/lab/episode/pipc 와 같은 뼈대 · 같은 골든)에서 **체험 자리만** 새 체험으로 바꿔 끼웠다: 먼저 핀을 꽂는다 → 위원회의 ★ 과 견준다.
// 주소 끝에 ?at=play 를 붙이면 풀이 장면을 바로 연다. 아무것도 저장하지 않는다. 실제 주소 (/s/privacy/1)는 건드리지 않았다.
export const metadata: Metadata = { title: "Claro 시안 — 진짜 체험 · 개인정보", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

export default async function Page({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  return <PrivacyPlay jump={at === "play"} />;
}
