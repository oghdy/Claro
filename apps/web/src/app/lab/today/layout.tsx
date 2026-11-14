import { PALETTE_BOOT, paletteCss } from "./palette/palettes";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../../../episode/episodes/fomc/fomc.css";
import "../../../episode/episodes/pipc/pipc.css";
import "./palette/dock.css";
import "./palette/overrides.css";
import "./today.css";

// UX-7 — /lab/today (오늘 시안 · 짧은 이야기 · 지도 견본)의 공통: 색 시안의 CSS 와 첫 그림 전에 색을 거는 스크립트. lab 전용.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{paletteCss()}</style>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT }} />
      {children}
    </>
  );
}
