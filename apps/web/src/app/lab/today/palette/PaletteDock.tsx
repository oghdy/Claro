"use client";

import { useEffect, useState } from "react";
import { DOCK_KEY, PALETTES, PALETTE_KEY, paletteOf, type PaletteId } from "./palettes";

// UX-7 · UX-7b — 색 스위치 (시안 조종 칸 — 제품의 일부가 아니다). 같은 화면을 색 넷으로 바꿔 본다: 종이 (지금) · 미색 · 쑥 · 형광펜.
// UX-7 의 신문 · 안개 · 밤은 주소의 ?c= 로 열었을 때만 한 칸 더 보인다 (견본).
// 고른 색은 html 의 data-palette 에 걸리고, 이 탭의 sessionStorage 에만 남는다 (탭을 닫으면 사라진다 · 서버에 가지 않는다 · 독자 기록이 아니다).
//   inline    /lab/today · 짧은 이야기 — 화면 맨 위 띠로 늘 보인다
//   floating  /lab/episode/* — /lab/today 를 거쳐 온 탭에서만 뜬다 (곧장 연 회차 시안은 지금 그대로다)
export function PaletteDock({ floating = false, tag }: { floating?: boolean; tag?: string }) {
  const [id, setId] = useState<PaletteId>("paper");
  const [shown, setShown] = useState(!floating);

  useEffect(() => {
    const now = paletteOf(document.documentElement.getAttribute("data-palette"))?.id ?? "paper";
    setId(now);
    try {
      if (floating) setShown(sessionStorage.getItem(DOCK_KEY) !== null);
      else sessionStorage.setItem(DOCK_KEY, "1");
    } catch {
      // 저장소를 못 쓰는 브라우저 — 색은 이 화면에서만 바뀐다
    }
  }, [floating]);

  useEffect(() => {
    // 주소창 · 상태 줄의 색도 바탕색으로
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = paletteOf(id)?.colors.paper;
    if (meta && bg) meta.setAttribute("content", bg);
  }, [id]);

  const pick = (next: PaletteId) => {
    setId(next);
    const html = document.documentElement;
    if (next === "paper") html.removeAttribute("data-palette");
    else html.setAttribute("data-palette", next);
    try {
      sessionStorage.setItem(PALETTE_KEY, next);
    } catch {
      // 위와 같다
    }
  };

  if (!shown) return null;
  return (
    <div className="pd" data-floating={floating ? "" : undefined} role="group" aria-label="시안 조종 — 색" data-testid="palette-dock">
      {tag ? <span className="pd-tag">{tag}</span> : null}
      <span className="pd-label">색</span>
      <div className="pd-set">
        {PALETTES.filter((p) => p.dock || p.id === id).map((p) => (
          <button key={p.id} type="button" aria-pressed={id === p.id} onClick={() => pick(p.id)} title={p.note} data-testid={`palette-${p.id}`}>
            <i aria-hidden="true" style={{ background: `linear-gradient(135deg, ${p.colors.paper} 0 50%, ${p.colors.accent} 50% 100%)` }} />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
