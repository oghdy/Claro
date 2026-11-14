import { PaletteDock } from "../today/palette/PaletteDock";
import { PALETTE_BOOT, paletteCss } from "../today/palette/palettes";
import "../today/palette/dock.css";
import "../today/palette/overrides.css";
import "../today/palette/marker.css";

// UX-7 — 회차 시안 화면 (/lab/episode/*)에 색 시안을 건다 (lab 전용 · 실제 주소 /s/* 에는 이 layout 이 없다).
// 곧장 연 화면은 지금 그대로다: 색은 종이 톤이고 색 스위치도 안 보인다. /lab/today 를 거쳐 온 탭 (또는 주소에 ?c=<색>)에서만 스위치가 뜨고 고른 색이 걸린다.
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
