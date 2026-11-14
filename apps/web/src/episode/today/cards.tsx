import type { ReactNode } from "react";
import { numbered, oneLine, type Line, type LongLine, type ShortLine } from "../catalog";
import { Rich } from "../kit/parts";

// "오늘"의 카드 (UX-7 시안 → F-E2 에서 실제 첫 화면과 한 벌로). 실제 `/` 와 시안 `/lab/today` 가 같은 부품을 쓴다 — 다른 것은 가는 주소와 화면의 글 (copy)뿐이다.
// 카드에 놓이는 것: 물음 제목 · 주제 이름 · 무게 (긴 · 짧은) · 체험이 있나 · 날 (골든의 meta 글 그대로) · 국내 / 해외 꼬리표 · 카테고리. **읽는 시간은 내지 않는다** (D82).
// 번호 ("N화") · 지난 이야기는 번호 화면 규칙을 지난 것에만 (catalog.numbered — D88 E-20). 이야기의 글은 전부 골든의 글자 그대로다.

/** 카드가 쓰는 화면 글 — 실제 (home-copy.ts HOME) · 시안 (lab/today/copy.ts TODAY_COPY) 둘 다 이 칸들을 갖는다 */
export interface CardCopy {
  long: string;
  short: string;
  lab: string;
  noLab: string;
  topic: string;
  go: string;
  recap: string;
  contLabel: string;
}

export const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 이어지는 이야기인가 — 번호를 보이는 시리즈의 긴 이야기 (시안의 옛 규칙 number ≥ 2 와 지금 목록에서 같은 답이다) */
export const continues = (line: LongLine): boolean => numbered(line.ep.series.code);

// 무게 (긴 이야기 · 짧은 이야기) · 체험이 있나 — 읽는 시간은 내지 않는다 (D82: 읽기 전부터 "N분이나?")
function Weight({ C, long, lab }: { C: CardCopy; long: boolean; lab: boolean }) {
  return (
    <p className="td-weight" data-weight={long ? "long" : "short"}>
      <b>{long ? C.long : C.short}</b>
      <span data-lab={lab ? "" : undefined}>{lab ? C.lab : C.noLab}</span>
    </p>
  );
}

/** 국내 / 해외 꼬리표 · 카테고리 · 날 — 꼬리표 둘은 목록에 손으로 적은 값 (계약에 칸이 없다), 날은 골든의 meta 글 */
function When({ line, meta }: { line: Line; meta: string }) {
  return (
    <p className="td-when">
      <span data-place={line.place === "해외" ? "abroad" : "home"}>{line.place}</span>
      <span>{line.category}</span>
      <em>{meta}</em>
    </p>
  );
}

export function LongCard({ line, href, lead, C }: { line: LongLine; href: string; lead: boolean; C: CardCopy }) {
  const { ep, Art } = line;
  const c = ep.scenes.cover;
  const cont = continues(line);
  return (
    <article className="td-card" data-kind="long" data-lead={lead ? "" : undefined} data-cont={cont ? "" : undefined} data-testid={`card-${ep.code}`}>
      <a className="td-main" href={href}>
        {/* 이어지는 이야기면 주제 이름 + 몇 화. 아직 한 편인 주제면 주제 이름만 — 번호 없음 */}
        <p className="td-topic">
          <span>{cont ? C.contLabel : C.topic}</span>
          <strong>{ep.series.name}</strong>
          {cont ? <em>{c.episode.t}</em> : null}
        </p>
        {lead ? (
          <div className="ep-cover-art td-art">
            <Art />
          </div>
        ) : null}
        <h3 className="td-title">
          <Rich text={lead ? c.title : oneLine(c.title)} />
        </h3>
        <p className="td-dek">{c.dek.t}</p>
        <When line={line} meta={c.meta.t} />
        <Weight C={C} long lab={ep.solve.lab !== null} />
        {lead ? (
          <span className="td-go">
            {C.go}
            <Arrow />
          </span>
        ) : (
          <span className="td-arrow" aria-hidden="true">
            <Arrow />
          </span>
        )}
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

/** 짧은 이야기 — 얇은 카드. aside: 주제 이름 옆의 한마디 (시안 전용 — 이 이야기에만 맞는 화면 글) */
export function ShortCard({ line, href, C, aside }: { line: ShortLine; href: string; C: CardCopy; aside?: ReactNode }) {
  const c = line.story.scenes.cover;
  return (
    <article className="td-card" data-kind="short" data-testid={`card-${line.story.code}`}>
      <a className="td-main" href={href}>
        <p className="td-topic">
          <span>{C.topic}</span>
          <strong>{line.story.series.name}</strong>
          {aside ? <i>{aside}</i> : null}
        </p>
        <h3 className="td-title">{oneLine(c.title)}</h3>
        <When line={line} meta={c.meta.t} />
        <Weight C={C} long={false} lab={false} />
        <span className="td-arrow" aria-hidden="true">
          <Arrow />
        </span>
      </a>
    </article>
  );
}
