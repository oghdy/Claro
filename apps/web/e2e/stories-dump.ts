// F-E8 (D132) — e2e 의 그날 값을 이야기 목록 (episode/catalog.tsx STORIES)에서 꺼내 JSON 으로 낸다. **tsx 로 돈다** (./stories.ts 가 부른다 — 시험 파일이 아니다).
// 까닭: catalog 는 이야기 파일 (JSON)을 import 속성 없이 읽는다 — Next · tsx 는 읽지만 Playwright 의 로더는 못 읽는다 ("needs an import attribute of type: json").
// 값은 **화면이 쓰는 그 함수**에서 나온다 (bundle · hrefOfLine · latestPerSeries · numbered · unpromised · 시안의 TODAY · sharedConcepts) — 화면과 시험이 같은 규칙을 두 번 짜지 않는다.
// 규칙의 뜻 (가장 새 날이 머리 · 같은 날이면 목록의 위가 먼저 · 그날이면 "오늘의 이야기" …)은 시험 쪽에서 이 값으로 다시 본다 (episode.spec.ts · today.spec.ts).
import { STORIES, bundle, hrefOfLine, latestPerSeries, numbered, unpromised, type Line } from "../src/episode/catalog";
import { TODAY, sharedConcepts as labConcepts } from "../src/app/lab/today/data";

/** 첫 화면의 카드 하나 — 목록의 줄 하나 */
const card = (x: Line) => ({
  /** 카드의 data-testid (home/cards.tsx · today/cards.tsx — 이야기의 code) */
  id: `card-${x.kind === "long" ? x.ep.code : x.story.code}`,
  kind: x.kind,
  /** 실제 주소 */
  href: hrefOfLine(x),
  /** Claro 가 낸 날 (목록에 손으로 적은 값 — 없으면 null) */
  day: x.day ?? null,
  /** 목록 (STORIES)의 차례 */
  at: STORIES.indexOf(x),
  /** 제목 위 뉴스 한 줄 (화면 칸 screen.news — 긴 이야기만 · 없으면 null) */
  news: x.kind === "long" ? (x.screen?.news?.t ?? null) : null,
});

const { day, top, rest } = bundle();
const VIEW = {
  /** 가장 새 묶음의 날 (bundle — day 가 하나도 없으면 null) */
  day,
  /** 목록의 차례 그대로 */
  all: STORIES.map(card),
  /** 첫 화면의 맨 위 묶음 · 그 아래 "지난 이야기" (bundle 그대로) */
  top: top.map(card),
  rest: rest.map(card),
  /** 개념 지도 (/map · /lab/today/map) — 주제마다 한 장 (latestPerSeries). ghosts = 그 지도에 그려지는 "다음 화 개념"의 수 (약속하지 않는 이야기는 0) */
  maps: latestPerSeries().map((x) => ({ series: x.ep.series.code, ghosts: unpromised(x.ep) ? 0 : x.ep.map.ghosts.length })),
  /** "이어지는 이야기" (첫 화면) — 번호를 보이는 주제의 가장 새 긴 이야기 (cont-<시리즈>) */
  cont: latestPerSeries()
    .filter((x) => numbered(x.ep.series.code))
    .map((x) => x.ep.series.code),
  /** 시안 /lab/today — 실제 목록 + 견본 (병원) + 빈 자리 */
  lab: {
    cards: TODAY.map((x) => (x.kind === "empty" ? "card-empty" : card(x).id)),
    /** 개념으로 이어짐 — 묶음마다 이야기의 시안 주소 */
    concepts: labConcepts().map((g) => g.stories.map((s) => s.path)),
    /** 이어지는 이야기 (시안 — 번호를 보이는 긴 이야기마다) */
    cont: TODAY.flatMap((x) => (x.kind === "long" && numbered(x.ep.series.code) ? [x.ep.series.code] : [])),
  },
};
export type StoriesView = typeof VIEW;

process.stdout.write(JSON.stringify(VIEW));
