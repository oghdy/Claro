"use client";

import { Episode } from "../../../episode/kit/Episode";
import { PlainArt, PlainGlyph } from "../../../episode/kit/PlainLook";
import { LONGS, episodeOf, hrefOfLine, previewUnpromised, screenOf, short, shortOf } from "../../../episode/catalog";
import { ShortLineScreen } from "../../../episode/Screen";

// 미리 보기의 화면 쪽 (L-1) — 서버 (page.tsx)가 읽어 준 파일을 **실제 화면이 쓰는 그 함수들**로 올린다: episodeOf (계약 검증) · screenOf (화면 칸의 꼴) · short (짧은 이야기 검증).
// 올린 뒤와 같게 그리려고 이야기 목록 (catalog)을 보고 정하는 것 셋:
//   그림         같은 시리즈의 긴 이야기가 목록에 있으면 그 그림 묶음 · 없으면 기본 그림 (PlainLook — 새 시리즈의 표지 그림은 따로 정한다)
//   번호         번호 화면 규칙 (D88 E-20) — 이 이야기를 목록에 더했다고 치고 센다
//   약속 없음    meta.json 의 line.unpromised (목록에 이미 있으면 목록의 값이 그대로 통한다)
const COPY = { tag: "미리 보기 — 아직 올리지 않은 판", pipeline: "미리 보기 — 파이프라인이 낸 판", real: "실제 화면", broken: "미리 보기 — 검사를 지나지 못한 판 (story:check 를 돌린다)" } as const;

interface Props {
  kind: "long" | "short";
  from: "local" | "shorts";
  file: unknown;
  screen: unknown | null;
  line: { unpromised?: boolean } | null;
  store: string | null;
}

/**
 * 파일이 계약 · 화면 칸의 꼴을 못 지나면 **화면에 그 까닭을 적는다** — 던지지 않는다 (던지면 빌드가 서고, 미리 보기 하나 때문에 실제 화면의 배포까지 멈춘다).
 * 실제 화면의 줄 (catalog STORIES)은 지금처럼 빌드를 세운다 — 검사를 못 지난 것이 실제로 나가면 안 되니까
 */
export function LocalPreview(props: Props) {
  try {
    return <Preview {...props} />;
  } catch (e) {
    return (
      <div className="lp-wrap">
        <Bar tag={COPY.broken} real={null} />
        <pre className="lp-broken" data-testid="lp-broken">
          {String((e as Error).message)}
        </pre>
      </div>
    );
  }
}

function Preview({ kind, from, file, screen, line, store }: Props) {
  const tag = from === "local" ? COPY.tag : COPY.pipeline;
  if (kind === "short") {
    const row = short(file, { place: "국내", category: "돈" }, LONGS.map((x) => x.ep));
    const live = shortOf(row.story.code);
    return (
      <div className="lp-wrap">
        <Bar tag={tag} real={live ? hrefOfLine(live) : null} />
        <ShortLineScreen line={live && live.story.episode_id === row.story.episode_id ? { ...row, Art: live.Art } : row} real />
      </div>
    );
  }
  const ep = episodeOf(file, store ? [store] : []);
  const same = LONGS.filter((x) => x.ep.series.code === ep.series.code);
  const look = same[0] ?? { Art: PlainArt, Glyph: PlainGlyph };
  const live = same.find((x) => x.ep.number === ep.number);
  // 같은 시리즈에 긴 이야기가 둘 이상 실제로 있나 — 이 이야기 + 목록의 다른 번호 · 또는 둘째 이후 (catalog.numbered 와 같은 뜻)
  const numbered = same.some((x) => x.ep.number !== ep.number) || ep.number >= 2;
  if (line?.unpromised) previewUnpromised(ep.episode_id);
  return (
    <div className="lp-wrap">
      <Bar tag={tag} real={live ? hrefOfLine(live) : null} />
      <Episode ep={ep} Art={look.Art} Glyph={look.Glyph} real numbered={numbered} screen={screen ? screenOf(screen) : undefined} />
    </div>
  );
}

function Bar({ tag, real }: { tag: string; real: string | null }) {
  return (
    <p className="lp-bar" data-testid="lp-bar">
      <strong>{tag}</strong>
      {real ? (
        <a href={real} data-testid="lp-real">
          {COPY.real} → {real}
        </a>
      ) : null}
    </p>
  );
}
