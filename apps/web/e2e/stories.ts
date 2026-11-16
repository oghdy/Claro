// F-E8 (D132) — e2e 가 "지금 목록"의 값 (머리 날짜 · 읽는 날의 시각 · 카드의 차례 · 묶음 · 맨 위 카드 · 수 · 지도 장 수 · 뉴스 한 줄 카드 · 이어지는 이야기)을
// 손으로 박지 않고 **이야기 목록 (episode/catalog.tsx STORIES)에서** 읽는다. 새 이야기를 목록 맨 위에 한 줄 더해도 시험을 고치지 않는다.
// 목록은 ./stories-dump.ts 를 tsx 로 돌려 읽는다 (Playwright 의 로더는 catalog 가 읽는 이야기 파일 (JSON)을 못 읽는다 — 그 파일 머리).
// 이야기 하나의 글 · 동작을 보는 시험 (episode.spec.ts 의 LIVE · SHORTS · 기름값 · 화면 칸)은 여기를 쓰지 않는다 — 그건 그 이야기를 지키는 것이다.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { HOME } from "../src/episode/home-copy";
import type { StoriesView } from "./stories-dump";

export const LIST: StoriesView = JSON.parse(
  execFileSync(path.join(import.meta.dirname, "../node_modules/.bin/tsx"), [path.join(import.meta.dirname, "stories-dump.ts")], { cwd: path.join(import.meta.dirname, ".."), encoding: "utf8" }),
);
export type Card = StoriesView["all"][number];

/** 그날의 한낮 (한국 시각) — plus 날 뒤. 읽는 날을 고정하는 시계에 쓴다 */
export const noonKst = (day: string, plus = 0): Date => new Date(Date.parse(`${day}T12:00:00+09:00`) + plus * 86_400_000);

/** 날짜 머리 — "{m}월 {d}일의 이야기" (화면의 글 HOME.titleDay 에 목록의 날을 넣은 것) */
export const dayTitle = (day: string): string => {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})$/.exec(day)!;
  return HOME.titleDay.replace("{m}", String(Number(m))).replace("{d}", String(Number(d)));
};
