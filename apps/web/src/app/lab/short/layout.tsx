import { PALETTE_BOOT, paletteCss } from "../today/palette/palettes";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../today/palette/dock.css";
import "../today/palette/overrides.css";
import "../today/palette/marker.css";
import "../../../episode/today/today.css";
import "./light.css";

// UX-8 — /lab/short (짧은 이야기 손 견본)의 공통: 긴 이야기와 같은 CSS + 이 견본의 것 (light.css) · 색 시안의 CSS (lab/today 와 같은 스위치 — 종이가 기본). lab 전용.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{paletteCss()}</style>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT }} />
      {children}
    </>
  );
}
