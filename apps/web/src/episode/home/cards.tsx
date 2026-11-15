import type { ComponentType } from "react";
import { numbered, oneLine, type Line, type LongLine, type ShortLine } from "../catalog";
import { Rich } from "../kit/parts";
import { Arrow } from "../today/cards";

// 실제 첫 화면 (/)의 카드 — F-E4 (D105 "메인 화면 좀 예쁘게"). 시안 /lab/today 의 카드 (today/cards.tsx)에서 갈라졌다: 시안은 그대로 두고, 실제 첫 화면만 이 카드를 쓴다.
// 다른 것: **카드마다 제 그림** (긴 이야기 = 그 이야기의 표지 그림 · 짧은 이야기 = 작은 그림) · 꼬리표 (국내 / 해외 · 카테고리 · 무게 · 날)가 상자 없이 조용한 한 줄 · 눈이 먼저 가는 것은 제목과 한 줄.
// 같은 것: 놓이는 글 (주제 이름 · 물음 제목 · 한 줄 · 날 · 국내 / 해외 · 카테고리 · 무게) · 읽는 시간 없음 (D82) · 체험 표시 없음 (D91 ②) · 번호와 지난 이야기는 번호 화면 규칙을 지난 것에만 (catalog.numbered — D88 E-20).
// 이야기의 글은 전부 파일의 글자 그대로다 (제목의 줄바꿈만 한 줄 제목에서 빈칸으로).

/** 카드가 쓰는 화면 글 (home-copy.ts HOME) */
export interface HomeCardCopy {
  long: string;
  short: string;
  go: string;
  recap: string;
}

/** 국내 / 해외 · 카테고리 · 무게 · 날 — 조용한 한 줄. 해외만 이끼색 글자다 (D83 ② — 상자는 뺐다) */
function Meta({ line, weight, when }: { line: Line; weight: string; when: string }) {
  return (
    <p className="hm-meta">
      <span data-place={line.place === "해외" ? "abroad" : "home"}>{line.place}</span>
      <span>{line.category}</span>
      <span data-weight={line.kind}>{weight}</span>
      <em>{when}</em>
    </p>
  );
}

export function HomeLongCard({ line, href, lead, C }: { line: LongLine; href: string; lead: boolean; C: HomeCardCopy }) {
  const { ep, Art } = line;
  const c = ep.scenes.cover;
  const cont = numbered(ep.series.code);
  return (
    <article className="td-card hm-card" data-kind="long" data-lead={lead ? "" : undefined} data-cont={cont ? "" : undefined} data-testid={`card-${ep.code}`}>
      <a className="td-main" href={href}>
        {/* 그 이야기의 표지 그림 그대로 (이야기 화면의 표지와 같은 부품) */}
        <div className="hm-face">
          <Art />
        </div>
        <div className="hm-body">
          {/* 주제 이름. 이어지는 이야기면 몇 화인지도 — 아직 한 편인 주제는 번호 없음 */}
          <p className="hm-eyebrow">
            <strong>{ep.series.name}</strong>
            {cont ? <em>{c.episode.t}</em> : null}
          </p>
          <h3 className="td-title">
            <Rich text={lead ? c.title : oneLine(c.title)} />
          </h3>
          <p className="td-dek">{c.dek.t}</p>
          <Meta line={line} weight={C.long} when={c.meta.t} />
          {lead ? (
            <span className="td-go">
              {C.go}
              <Arrow />
            </span>
          ) : null}
        </div>
      </a>
      {cont ? (
        <details className="td-recap" data-testid={`recap-${ep.code}`}>
          <summary>
            {C.recap}
            <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          {/* 골든의 "지난 이야기" 글 그대로 (표지의 recap) */}
          {c.recap.map((r) => (
            <p key={r.t}>
              <Rich text={r.t} />
            </p>
          ))}
        </details>
      ) : null}
    </article>
  );
}

/** 짧은 이야기 — 낮은 카드 · 왼쪽에 작은 그림 */
export function HomeShortCard({ line, href, C }: { line: ShortLine; href: string; C: HomeCardCopy }) {
  const c = line.story.scenes.cover;
  const Face = SHORT_FACE[line.story.code] ?? PlainFace;
  return (
    <article className="td-card hm-card" data-kind="short" data-testid={`card-${line.story.code}`}>
      <a className="td-main" href={href}>
        <div className="hm-face">
          <Face />
        </div>
        <div className="hm-body">
          <p className="hm-eyebrow">
            <strong>{line.story.series.name}</strong>
          </p>
          <h3 className="td-title">{oneLine(c.title)}</h3>
          <Meta line={line} weight={C.short} when={c.meta.t} />
        </div>
      </a>
    </article>
  );
}

// ─────────────────────────────────────────────────────────── 짧은 이야기의 작은 그림
// 첫 화면 카드에만 쓰는 꾸밈이다 (이야기 화면의 표지는 그대로 — catalog 의 Art). 글자 · 숫자 없음 · 뜻을 싣지 않는다 (물건 하나 + 물음 하나). 읽기 도구에는 숨긴다.
// 결은 긴 이야기의 표지 그림과 같다: 먹색 선 · 면 색 물건 · 감색 동그라미 하나.

/** 제 그림이 없는 짧은 이야기 — 문서 한 장과 물음 (kit/PlainLook 의 PlainArt 를 작은 네모에 맞게) */
function PlainFace() {
  return (
    <svg viewBox="0 0 72 72" role="presentation" aria-hidden="true" className="hm-mini">
      <rect x="14" y="10" width="38" height="50" rx="7" className="hm-mini-thing" />
      <path d="M22 24h22M22 33h22M22 42h13" className="hm-mini-line" />
      <circle cx="51" cy="50" r="12" className="hm-mini-dot" />
      <path d="M47.5 46.5c0-5 7-5 7 0 0 2.8-3.5 2.8-3.5 5.6M51 56v.4" className="hm-mini-mark" />
    </svg>
  );
}

/** 「면허 정지…」 — 면허증 한 장과 물음 */
function LicenseFace() {
  return (
    <svg viewBox="0 0 72 72" role="presentation" aria-hidden="true" className="hm-mini">
      <g transform="rotate(-6 34 34)">
        <rect x="7" y="16" width="54" height="37" rx="7" className="hm-mini-thing" />
        <circle cx="21" cy="30" r="5.5" className="hm-mini-soft" />
        <path d="M12.5 45c1.5-6 15.5-6 17 0" className="hm-mini-line" />
        <path d="M36 27h18M36 35h18M36 43h10" className="hm-mini-line" />
      </g>
      <circle cx="53" cy="52" r="12" className="hm-mini-dot" />
      <path d="M49.5 48.5c0-5 7-5 7 0 0 2.8-3.5 2.8-3.5 5.6M53 58v.4" className="hm-mini-mark" />
    </svg>
  );
}

/** 「사진 때문에 수억 유로라는데…」 — 폰 안의 사진첩 (칸 넷)과 물음. 허락을 받았는지를 묻는 이야기다 (F-E5) */
function GalleryFace() {
  return (
    <svg viewBox="0 0 72 72" role="presentation" aria-hidden="true" className="hm-mini">
      <g transform="rotate(-5 30 36)">
        <rect x="11" y="7" width="40" height="58" rx="8" className="hm-mini-thing" />
        <path d="M27 13.5h8" className="hm-mini-line" />
        <rect x="18" y="21" width="11" height="11" rx="2.5" className="hm-mini-soft" />
        <rect x="33" y="21" width="11" height="11" rx="2.5" className="hm-mini-soft" />
        <rect x="18" y="36" width="11" height="11" rx="2.5" className="hm-mini-soft" />
        <rect x="33" y="36" width="11" height="11" rx="2.5" className="hm-mini-soft" />
      </g>
      <circle cx="53" cy="52" r="12" className="hm-mini-dot" />
      <path d="M49.5 48.5c0-5 7-5 7 0 0 2.8-3.5 2.8-3.5 5.6M53 58v.4" className="hm-mini-mark" />
    </svg>
  );
}

/** 이야기의 code → 작은 그림. 없으면 PlainFace 가 선다 (이야기를 더할 때 그림은 없어도 된다) */
const SHORT_FACE: Record<string, ComponentType> = { "license-notice": LicenseFace, "meta-gallery": GalleryFace };
