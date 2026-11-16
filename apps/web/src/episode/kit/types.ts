// 회차 시안이 쓰는 타입. **회차 · 풀이 칸의 모양은 계약이다** — docs/contract/EPISODE.md · @claro/contract (B-E1).
// 여기서 다시 정의하지 않는다 (한 타입은 한 곳에만). 여기 남은 것은 시안 전용이다: 두 독자의 고정값 · 주소 · 문서 파일의 자리.
//
// 글의 규칙 (계약 §9 — @claro/contract 의 validateEpisode 가 본다. check.ts 가 부른다)
//   1. 독자가 읽는 글은 전부 { t, src?, calc?, ui?, voice? } 꼴이다
//   2. t 에 숫자가 있으면 src 가 가리키는 구절 안에 그 숫자가 있어야 한다
//   3. 구절(quote)은 저장된 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시하고 대조)
//   4. calc — 구절의 수로 계산한 수 (어떻게 계산했는지 적는다) · ui — 화면 번호(0화 · 1화)처럼 사실이 아닌 수
import type { Episode, EpisodeText, Tool } from "@claro/contract";

export type { Episode, SceneId, TrackState, ChainFrame, Frame, Lab, NoLabWhy, PlainSolve, SeatsFrame, Solve, SolveEntry, ToggleFrame } from "@claro/contract";

/** 독자가 읽는 글 한 덩이 — 계약의 EpisodeText */
export type T = EpisodeText;
/** 개념 (도구) — 계약의 Tool */
export type Concept = Tool;

export const t = (text: string, src?: readonly string[], more?: Partial<T>): T => ({ t: text, ...(src ? { src: [...src] } : {}), ...more });

// 두 독자 — **손으로 적은 고정값이다. 시안 전용이고 계약이 아니다.** 지식 상태를 추정하지 않는다 (CLAUDE.md "절대 하지 말 것").
// 계약의 조립(Episode.assembly)은 "어느 조립이 어느 장면을 보이나"만 적는다. 누가 어느 조립을 받는지는 계약에 없다 (EPISODE §5).
export type ReaderId = "new" | "follower";

export interface ReaderFixture {
  id: ReaderId;
  label: string;
  /** 시안 조종 칸에 보이는 설명 */
  note: string;
  /** 이미 아는 도구 (고정값) → 접힌다 */
  known: readonly string[];
  /** 지난 이야기를 읽었나 (고정값) */
  readZero: boolean;
  /** 다른 시리즈에서 주운 도구 (고정값) — 지도에만 보인다. 이름은 그 시리즈의 회차에서 읽는다 (shelf.ts) */
  elsewhere: readonly { series: string; concepts: readonly string[] }[];
}

/** 화면에만 있는 것 — 계약의 회차 옆에 붙인다 (계약이 아니다) */
export interface LabOnly {
  /** 이 회차의 시안 주소 (/lab/episode/*) */
  path: string;
  /** 이 회차의 실제 주소 (/s/<시리즈>/<n> — F-E1). 실제 화면에 나가는 회차만 갖는다 (견본 · 파이프라인 시험판에는 없다) */
  real?: string;
  /**
   * 발표된 날 (YYYY-MM-DD) — 첫 화면이 "오늘의 회차" (가장 최근 발표)를 고를 때만 쓴다. **손으로 적은 값이다**:
   * 계약에 발행 시각 칸이 없다 (EPISODE §10 미확인). 표지의 meta 글에 있는 날을 옮겼다. 독자에게 보이지 않는다
   */
  announced?: string;
  /** 시안 조종 칸의 짧은 이름 */
  short: string;
  /** 근거 문서가 저장된 파일 (저장소 뿌리에서) — check.ts 가 구절을 대조할 때 읽는다 */
  stores: readonly string[];
  readers: Record<ReaderId, ReaderFixture>;
}

/**
 * **이야기마다 고르는 화면 칸** (UX-10 이 시안 칸 `replot` 으로 만들었고, F-E6 · D125 에서 실제 화면도 쓴다) — 「이야기 짜는 법」 (docs/content/story-guide.md)이 요구하는데 뼈대가 못 하던 것 셋.
 * **계약에 없는 칸이다** (화면의 것 — 이야기 목록 catalog.tsx 의 손 칸 `screen` · lab 시안은 제 data.ts 에서 준다). 화면 뼈대 (kit/Episode)가 받는다. **안 주면 아무것도 달라지지 않는다.** 셋은 따로따로다 (하나만 줘도 된다).
 *   news   표지 — 제목 위에 그날의 뉴스 한 줄 (법 3 "제목 두 층")
 *   veil   풀이 — 사슬의 멈춘 고리 (reach: none)를 누르기 전에는 다른 고리와 같게 보인다. 고리 id → 누르기 전의 말. 꼬리표 (still) · 그 앞의 점선은 누른 뒤에만 (법 5 "답을 먼저 보이지 않는다")
 *   burst  풀이 — 체험을 마치면 맨 먼저 **문서의 문장**을 크게 보이고 (오늘의 사건 장면의 인용 칸과 같은 꼴) 바로 아래에 뒤집기의 풀이 (flip.note).
 *          "뒤집어 보면 A ≠ B" 상자는 그리지 않는다 (법 6 "뒤집기는 도구지 칸이 아니다"). box: true 면 상자를 정리로 남긴다 (도구 카드 아래)
 * 1화에서 "지금까지의 이야기"를 건너뛰는 것은 칸이 아니다 — 회차의 조립 (assembly.new)에서 zero 를 빼면 된다 (계약 불변식 6 이 받는다).
 * 실제 화면에 나가는 칸은 검사가 본다 (lab/episode/check.ts S8 — 구절 · 숫자 · 문서 글 그대로 · 멈춘 고리)
 */
export interface ScreenSlots {
  news?: T;
  veil?: Readonly<Record<string, string>>;
  burst?: { label: string; quote: T; note: string; box?: boolean };
}

/** 시안이 그리는 한 회차 = 계약의 회차 (골든 픽스처) + 시안 전용 */
export type EpisodeData = Episode & LabOnly;

/** 도구 하나 — key 로 */
export const toolOf = (ep: Episode, key: string): Tool => {
  const tool = ep.tools.find((x) => x.key === key);
  if (!tool) throw new Error(`도구 ${key} 가 이 회차에 없다`);
  return tool;
};
