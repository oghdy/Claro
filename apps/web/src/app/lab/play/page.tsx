import type { Metadata, Viewport } from "next";
import { DELIVERY } from "../../../episode/episodes/delivery/data";
import { FOMC } from "../../../episode/episodes/fomc/data";
import { PIPC } from "../../../episode/episodes/pipc/data";
import { PLAY_CHROME } from "./copy";

// UX-9 — 진짜 체험 시안의 들머리 (lab 전용): 세 이야기로 가는 길. 이야기마다 "처음부터" (표지에서 흐름을 따라) · "체험으로 바로" · 견줄 "지금 체험" (실제 주소).
export const metadata: Metadata = { title: "Claro 시안 — 진짜 체험", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4EEE3" };

const ROWS = [
  { ep: DELIVERY, path: "/lab/play/price", line: "내가 값을 정한다 → 요구가 그 값을 되돌린다" },
  { ep: FOMC, path: "/lab/play/rate", line: "먼저 표를 던진다 → 실제 표가 열린다" },
  { ep: PIPC, path: "/lab/play/privacy", line: "먼저 핀을 꽂는다 → 위원회의 ★ 과 견준다" },
] as const;

export default function Page() {
  return (
    <main className="pl-index">
      <h1>{PLAY_CHROME.indexTitle}</h1>
      <p>{PLAY_CHROME.indexSub}</p>
      <ul>
        {ROWS.map(({ ep, path, line }) => (
          <li key={path}>
            <a className="pl-index-main" href={path} data-testid={`play-${ep.series.code}`}>
              <span>{ep.short}</span>
              <strong>{ep.scenes.cover.title.replace(/\n/g, " ")}</strong>
              <em>{line}</em>
            </a>
            <div>
              <a href={`${path}?at=play`}>{PLAY_CHROME.jump}</a>
              {ep.real ? <a href={ep.real}>{PLAY_CHROME.original}</a> : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
