import { PaletteDock } from "../today/palette/PaletteDock";
import { PALETTE_BOOT, paletteCss } from "../today/palette/palettes";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../../../episode/episodes/fomc/fomc.css";
import "../../../episode/episodes/pipc/pipc.css";
import "../today/palette/dock.css";
import "../today/palette/overrides.css";
import "../today/palette/marker.css";
import "./play.css";

// UX-9 — /lab/play/* (진짜 체험 시안)의 공통: 회차 화면과 같은 CSS + 새 체험의 것 (play.css) · 색 시안 (lab/episode 와 같은 스위치 — 곧장 열면 종이 톤 그대로). lab 전용.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pd-host">
      <style>{paletteCss()}</style>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT }} />
      <PaletteDock floating />
      {children}
    </div>
  );
}
