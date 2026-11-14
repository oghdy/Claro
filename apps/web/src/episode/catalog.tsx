// 실제 화면에 나가는 이야기 — **목록은 여기 한 곳이다** (F-E2 · D86 · D88). 첫 화면 `/` ("오늘") · 긴 이야기 `/s/<시리즈>/<번호>` · 짧은 이야기 `/short/<code>` ·
// 개념 지도 `/map` · 회차 화면의 책장 (kit/shelf.ts) · 시안 `/lab/today` 가 전부 STORIES 하나를 읽는다.
// **이야기의 글 · 근거 · 풀이 칸은 계약 검증을 지난 파일에 있다** (fixtures/episode-*.json — 긴 이야기는 Episode · 짧은 이야기는 ShortStory). 여기는 어느 이야기가 나가는지와 화면의 것만 적는다.
// 데이터베이스를 읽지 않는다 — 빌드할 때 정적 페이지에 실린다 (판은 불변이라 요청마다 읽을 이유가 없다).
//
// ── 이야기를 더하는 법: **파일 하나 + 아래 STORIES 에 한 줄** (push = 배포 · D76 — 게이트를 지난 것만)
//   긴 이야기    import rate3 from "<회차 파일>.json";        long(episodeOf(rate3), { ...FOMC_LOOK, place: "해외", category: "돈", day: "2026-11-19" }),
//   짧은 이야기  import x from "<짧은 이야기 파일>.json";     short(x, { place: "국내", category: "생활", day: "2026-11-19" }),
//   - **새 이야기는 맨 위에** 적는다 (목록의 차례 = 화면의 차례 · 같은 날이면 위의 것이 먼저). 주소 · 번호 규칙 · 책장 · 지도 · 곁 이야기로 가는 길은 목록에서 저절로 나온다
//   - day = Claro 가 그 이야기를 낸 날 (YYYY-MM-DD · 한국 날짜). **손으로 적는다** — 계약에 발행 시각 칸이 없다 (EPISODE §10 미확인). 없으면 "오늘"로 묶이지 않는다 (지금의 넷)
//   - place · category = 국내 / 해외 꼬리표 · 카테고리 다섯 (D83 · D86). **손으로 적는다** — 계약에 칸이 없다 (_open F-E2-b)
//   - 그림 (Art · Glyph)은 없어도 된다 — 기본 그림 (kit/PlainLook)이 선다. 같은 시리즈의 그림을 다시 쓰려면 그 묶음 (FOMC_LOOK 등)을 펼쳐 넣는다
//   - 짧은 이야기의 곁 이야기 · 도구 (sibling · tools_from)는 목록의 긴 이야기에서 찾는다. 둘 다 없어도 (null) 된다 — 홀로 선 짧은 이야기 (D88 E-21)
//
// 이 파일은 화면 뼈대 (kit/Episode)를 읽지 않는다 — kit/shelf.ts 가 이 목록을 읽기 때문이다 (서로 물리지 않게). 화면은 ./Screen.tsx 가 세운다.
import type { ComponentType } from "react";
import { parseEpisode, parseShortStory, type ShortStory } from "@claro/contract";
import yeonghun from "../../../../fixtures/episode-short-privacy-yeonghun.json";
import licenseNotice from "../../../../packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice/story.json";
import { CoverArt as DeliveryArt } from "./episodes/delivery/Art";
import { DELIVERY } from "./episodes/delivery/data";
import { Glyph as DeliveryGlyph } from "./episodes/delivery/Glyph";
import { CoverArt as FomcArt } from "./episodes/fomc/Art";
import { FOMC } from "./episodes/fomc/data";
import { Glyph as FomcGlyph } from "./episodes/fomc/Glyph";
import { CoverArt as PipcArt } from "./episodes/pipc/Art";
import { PIPC } from "./episodes/pipc/data";
import { Glyph as PipcGlyph } from "./episodes/pipc/Glyph";
import { CoverArt as YeonghunArt } from "./episodes/pipc-hospital/Art";
import { PlainArt, PlainGlyph } from "./kit/PlainLook";
import type { EpisodeData, ReaderFixture, ReaderId } from "./kit/types";

// ─────────────────────────────────────────────────────────── 줄의 모양

/** 국내 / 해외 꼬리표 (D83 ②) · 카테고리 다섯 (D83 ③ · D86). 화면의 것 — 계약에 칸이 없다 */
export type Place = "국내" | "해외";
export type Category = "돈" | "나라와 법" | "기술" | "생활" | "과학과 몸";

/**
 * 짧은 이야기 — 계약의 ShortStory. 곁 이야기 · 도구 (sibling · tools_from)는 **없을 수 있게 받는다**:
 * 지금 계약은 둘 다 필수지만 홀로 선 짧은 이야기를 내면서 `| null` 로 열릴 수 있다 (D88 E-21 · P-S1). 어느 쪽 타입이든 여기에 들어온다
 */
export type ShortData = Omit<ShortStory, "sibling" | "tools_from"> & {
  sibling?: NonNullable<ShortStory["sibling"]> | null;
  tools_from?: NonNullable<ShortStory["tools_from"]> | null;
};

interface Tags {
  place: Place;
  category: Category;
  /** Claro 가 낸 날 (YYYY-MM-DD) — 손으로. 없으면 "오늘"로 묶이지 않는다 */
  day?: string;
}
export interface Look {
  /** 표지 그림 — 첫 화면의 맨 위 카드도 같은 그림을 쓴다 */
  Art: ComponentType;
  /** 도구 카드의 작은 그림 */
  Glyph: ComponentType<{ id: string }>;
}
export interface LongLine extends Tags, Look {
  kind: "long";
  ep: EpisodeData;
}
export interface ShortLine extends Tags {
  kind: "short";
  story: ShortData;
  Art: ComponentType;
}
export type Line = LongLine | ShortLine;

// ─────────────────────────────────────────────────────────── 줄을 만드는 것

/** 실제 주소 — 긴 이야기: 시리즈의 code 와 번호 (계약의 칸 Series.code · Episode.number — F-E1 그대로) */
export const realPath = (ep: { series: { code: string }; number: number }): string => `/s/${ep.series.code}/${ep.number}`;
/** 실제 주소 — 짧은 이야기: 번호가 없다. 이야기의 code (계약의 칸 — 유일 · 불변) */
export const shortPath = (story: { code: string }): string => `/short/${story.code}`;

const NEW_ONLY = (): Record<ReaderId, ReaderFixture> => ({
  new: { id: "new", label: "처음 온 독자", note: "", known: [], readZero: false, elsewhere: [] },
  // 실제 화면은 처음 온 독자뿐이다 (누가 따라온 독자인지 추정하지 않는다 — D66). 이 칸은 타입을 채울 뿐 쓰이지 않는다
  follower: { id: "follower", label: "따라온 독자", note: "", known: [], readZero: true, elsewhere: [] },
});

/** 회차 파일 (계약의 Episode — 검증을 지나야 한다)을 화면이 쓰는 꼴로. 시안 주소 · 두 독자의 고정값이 없는 이야기 (파이프라인이 낸 것)가 쓴다 */
export function episodeOf(file: unknown): EpisodeData {
  const ep = parseEpisode(file);
  return { ...ep, path: realPath(ep), real: realPath(ep), short: ep.series.name, stores: [], readers: NEW_ONLY() };
}

export const long = (ep: EpisodeData, more: Tags & Partial<Look>): LongLine => ({ kind: "long", ep, Art: PlainArt, Glyph: PlainGlyph, ...more });
/** 짧은 이야기 파일 (계약의 ShortStory)을 받아 검증한다 — 곁 이야기 · 도구가 가리키는 긴 이야기는 그때까지의 긴 이야기들에서 찾는다 */
export const short = (file: unknown, more: Tags & { Art?: ComponentType }, longs: readonly EpisodeData[] = HAND): ShortLine => ({
  kind: "short",
  story: parseShortStory(file, { episodes: [...longs] }) as ShortData,
  Art: PlainArt,
  ...more,
});

/** 같은 시리즈의 새 이야기가 다시 쓰는 그림 묶음 */
export const DELIVERY_LOOK: Look = { Art: DeliveryArt, Glyph: DeliveryGlyph };
export const FOMC_LOOK: Look = { Art: FomcArt, Glyph: FomcGlyph };
export const PIPC_LOOK: Look = { Art: PipcArt, Glyph: PipcGlyph };
/** 손으로 쓴 긴 이야기 셋 (골든) — 짧은 이야기의 곁 이야기 · 도구를 찾을 때 대 본다. 새 긴 이야기를 가리키는 짧은 이야기는 short(…, …, [그 이야기]) 로 */
const HAND: readonly EpisodeData[] = [DELIVERY, FOMC, PIPC];

// ─────────────────────────────────────────────────────────── 목록 — 새 이야기는 맨 위에

/**
 * 꼬리표 · 카테고리의 자리 = S-1 고르기 종이 시험의 그날 표 (logs/pipeline/S-1.md ③ — 10/28 "[돈] (해) FOMC" · 10/29 "[기술] 개인정보위" · 11/9 "[기술] 공정위 배달앱").
 * 짧은 이야기 (병원)는 개인정보위의 같은 발표라 같은 칸이다. 배달앱은 S-1 도 "기술 ↔ 돈 ↔ 생활"로 애매하다고 적었다 (_open F-E2-b)
 */
export const STORIES: readonly Line[] = [
  long(DELIVERY, { ...DELIVERY_LOOK, place: "국내", category: "기술" }),
  long(FOMC, { ...FOMC_LOOK, place: "해외", category: "돈" }),
  long(PIPC, { ...PIPC_LOOK, place: "국내", category: "기술" }),
  short(yeonghun, { Art: YeonghunArt, place: "국내", category: "기술" }),
  // P-S1 — 파이프라인이 쓴 첫 짧은 이야기 (홀로 선다 · PM 게이트 D89 · 짧은 이야기라 큰 카드가 아닌 끝에). day 없음 — 아침 고르기로 낸 것이 아니라 시험 (10/29 아침 한 장 c142)
  short(licenseNotice, { place: "국내", category: "나라와 법" }),
];

// ─────────────────────────────────────────────────────────── 목록에서 나오는 것

export const LONGS: readonly LongLine[] = STORIES.filter((x): x is LongLine => x.kind === "long");
export const SHORTS: readonly ShortLine[] = STORIES.filter((x): x is ShortLine => x.kind === "short");

export const hrefOfLine = (line: Line): string => (line.kind === "long" ? realPath(line.ep) : shortPath(line.story));
export const longOf = (series: string, n: string): LongLine | undefined => LONGS.find((x) => x.ep.series.code === series && String(x.ep.number) === n);
export const shortOf = (code: string): ShortLine | undefined => SHORTS.find((x) => x.story.code === code);
/** 긴 이야기 하나 — 판까지 맞는 것 (짧은 이야기의 sibling · tools_from 이 가리키는 EpisodeRef) */
export const longByRef = (ref: { episode_id: string; episode_version: number } | null | undefined): LongLine | undefined =>
  ref ? LONGS.find((x) => x.ep.episode_id === ref.episode_id && x.ep.episode_version === ref.episode_version) : undefined;

/**
 * **번호 화면 규칙** (D79 ① · D88 E-20) — "N화" · 시리즈 줄 · "다음 화"는 **같은 시리즈에 긴 이야기가 둘 이상 실제로 있을 때만** 보인다. 데이터 (number · track)는 그대로다 — 화면이 목록을 보고 정한다.
 * 둘 이상 실제로 있다 = 목록에 그 시리즈의 긴 이야기가 둘 이상이거나, **목록의 긴 이야기가 둘째 이후다 (number ≥ 2)**.
 * 뒤쪽이 금리의 경우다: 1화는 회차 파일이 따로 없지만 (2화의 track 에 줄로만 있다) 실제로 나간 이야기다 — 9월 FOMC 기사 (옛 화면 /archive/fomc-2026-09) · 2화의 "지난 이야기"가 그 문서의 구절에 기댄다.
 * 계약의 번호가 2 라는 것이 "첫째가 있었다"는 기록이다 (번호는 화면이 올리지 않는다). 그래서 금리는 번호를 보이고, 1화는 줄에만 있다 (누를 수 없다 — 형식이 다른 옛 화면으로 잇지 않는다 · D78 5).
 */
export const numbered = (series: string): boolean => {
  const longs = LONGS.filter((x) => x.ep.series.code === series);
  return longs.length >= 2 || longs.some((x) => x.ep.number >= 2);
};

/** 시리즈 (선반)마다 가장 새 긴 이야기 — 목록의 차례에서 먼저 나온 것. 책장 · 지도가 쓴다 */
export const latestPerSeries = (): LongLine[] => LONGS.filter((x, i) => LONGS.findIndex((y) => y.ep.series.code === x.ep.series.code) === i);

/** 같은 시리즈의 다음 긴 이야기 (번호가 하나 큰 것) — 목록에 실제로 있을 때만 */
export const nextOf = (ep: { series: { code: string }; number: number }): LongLine | undefined => longOf(ep.series.code, String(ep.number + 1));

/** 한 줄 제목 — 표지 제목의 줄바꿈을 빈칸으로 (글자는 그대로) */
export const oneLine = (title: string): string => title.replace(/\n/g, " ");

// ─────────────────────────────────────────────────────────── "오늘" — 날로 묶기

/**
 * 첫 화면의 맨 위 묶음. day 가 적힌 이야기가 있으면 **가장 새 날의 이야기들**이 묶음이고 (day = 그날), 나머지는 아래 "지난 이야기"다.
 * day 가 하나도 없으면 (지금의 넷 — 아침 고르기로 낸 것이 아니다) 전부가 한 묶음이고 day 는 null 이다 → 머리는 "최근 이야기".
 * 그날이 오늘인지는 여기서 정하지 않는다 (정적 페이지 — 빌드한 날이 읽는 날이 아니다). 화면이 읽는 그때의 한국 날짜와 견준다 (today/Today.tsx)
 */
export function bundle(lines: readonly Line[] = STORIES): { day: string | null; top: Line[]; rest: Line[] } {
  const days = lines.map((x) => x.day).filter((d): d is string => Boolean(d));
  if (!days.length) return { day: null, top: [...lines], rest: [] };
  const day = days.reduce((a, b) => (a > b ? a : b));
  // 지난 이야기 — 새 날이 위 (날이 없는 것은 맨 아래 · 같은 날은 목록의 차례)
  const rest = lines.filter((x) => x.day !== day).sort((a, b) => (b.day ?? "").localeCompare(a.day ?? ""));
  return { day, top: lines.filter((x) => x.day === day), rest };
}
