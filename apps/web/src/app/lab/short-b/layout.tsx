import { PALETTE_BOOT, paletteCss } from "../today/palette/palettes";
import "../../../episode/episode.css";
import "../../../episode/kit/frames/frames.css";
import "../today/palette/dock.css";
import "../today/palette/overrides.css";
import "../today/palette/marker.css";
import "../../../episode/today/today.css";
import "../short/light.css";

// UX-8b-B — /lab/short-b 의 공통: /lab/short 와 같은 CSS (light.css 는 불러 쓰기만 한다). lab 전용.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{paletteCss()}</style>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT }} />
      {children}
    </>
  );
}
