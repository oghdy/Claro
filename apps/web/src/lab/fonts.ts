import { Gowun_Batang, IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";

// F-2a 탐색용 글꼴. 빌드할 때 내려받아 같은 서버에서 준다 (폰에 글꼴이 없어도 보인다 — iOS 엔 한글 명조가 없다).
// 한글은 subset 목록에 없어서 preload 를 끈다. 확정(F-2b)하면 packages/tokens 로 옮긴다.
// Pretendard(B)는 Google Fonts 에 없어 B 페이지가 CDN 스타일시트로 부른다.

/** A — 명조 중심 */
export const notoSerif = Noto_Serif_KR({ weight: ["400", "600", "700"], subsets: ["latin"], preload: false, display: "swap", variable: "--lab-noto-serif" });

/** C — 섞기: Claro 가 쓴 말 */
export const gowunBatang = Gowun_Batang({ weight: ["400", "700"], subsets: ["latin"], preload: false, display: "swap", variable: "--lab-gowun" });

/** C — 섞기: 기록된 사실 */
export const plexSansKr = IBM_Plex_Sans_KR({ weight: ["400", "500", "600", "700"], subsets: ["latin"], preload: false, display: "swap", variable: "--lab-plex" });
