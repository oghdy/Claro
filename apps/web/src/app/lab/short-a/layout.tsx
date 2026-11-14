import { PALETTE_BOOT, paletteCss } from "../today/palette/palettes";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../today/palette/dock.css";
import "../today/palette/overrides.css";
import "../today/palette/marker.css";
import "../../../episode/today/today.css";
import "../short/light.css";
import "./short-a.css";

// UX-8b — /lab/short-a 의 공통: /lab/short 와 같은 CSS 를 그대로 불러 쓴다 (lab/short 의 파일은 고치지 않았다) + 이 폴더의 한 줄 (short-a.css). lab 전용.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{paletteCss()}</style>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT }} />
      {children}
    </>
  );
}
