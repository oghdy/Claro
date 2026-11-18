"use client";

import type { ReactNode } from "react";
import { hrefOfLine, longByRef, longOf, numbered, oneLine, shortOf, type ShortLine } from "./catalog";
import { exitsOf } from "./home/days";
import { Episode } from "./kit/Episode";
import { Short } from "./kit/Short";
import type { Exits } from "./kit/types";

// 실제 주소의 이야기 화면 (F-E2) — 이야기 목록 (catalog.tsx)의 한 줄을 화면 뼈대에 올린다. 주소가 주는 것은 이름뿐이다 (시리즈 · 번호 / code).
// 긴 이야기 = kit/Episode · 짧은 이야기 = kit/Short. 둘 다 시안 (/lab/*)과 같은 부품 한 벌이다 — real 로 가른다.
// F-E9 (D148): 실제 주소는 이야기가 제 낸 날 (목록의 줄의 day)을 안다 — 나가는 길 (exits: 첫 장 ‹ · 끝의 "다른 이야기 보기" → 달력)을 여기서만 준다 (home/days.ts exitsOf).
// /lab/local 미리 보기 (같은 부품 · real)는 exits 를 주지 않는다 → 그 끝은 지금까지 그대로다.

/** 긴 이야기 — /s/<시리즈>/<번호>. 번호를 보일지 (번호 화면 규칙 · D88 E-20) · 화면 칸 (line.screen — F-E6 · 없으면 주지 않는다)은 목록이 정한다 */
export function LongScreen({ series, n }: { series: string; n: string }) {
  const line = longOf(series, n);
  if (!line) return null;
  return <Episode ep={line.ep} Art={line.Art} Glyph={line.Glyph} real numbered={numbered(series)} screen={line.screen} exits={exitsOf(line)} />;
}

/** 짧은 이야기 — /short/<code> (real). 목록 (catalog STORIES)에 있는 것만 */
export function ShortScreen({ code, real = false, top }: { code: string; real?: boolean; top?: ReactNode }) {
  const line = shortOf(code);
  if (!line) return null;
  return <ShortLineScreen line={line} real={real} top={top} exits={real ? exitsOf(line) : undefined} />;
}

/**
 * 짧은 이야기 한 줄을 화면에 — 실제 주소 (ShortScreen) · 시안 /lab/today/short (real 없음 — 곁 이야기는 시안 주소로, top 에 색 스위치).
 * 시안의 견본 (병원 — F-E3 에서 목록에서 내렸다)은 목록 밖의 줄이라 이것을 바로 부른다 (lab/today/short/LabShort.tsx).
 * 곁 이야기 · 도구가 가리키는 긴 이야기는 목록에서 찾는다 (판까지). 목록에 없으면 그 길 · 도구 없이 선다
 */
export function ShortLineScreen({ line, real = false, top, exits }: { line: ShortLine; real?: boolean; top?: ReactNode; exits?: Exits }) {
  const { story } = line;
  const from = longByRef(story.tools_from?.episode)?.ep ?? null;
  const sib = longByRef(story.sibling?.episode);
  const sibling = sib ? { href: real ? hrefOfLine(sib) : sib.ep.path, title: oneLine(sib.ep.scenes.cover.title) } : null;
  return <Short story={story} Art={line.Art} from={from} sibling={sibling} real={real} top={top} exits={exits} />;
}
