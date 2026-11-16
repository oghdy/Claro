// UX-10 (D113 ② · D115) — 기름값 1화를 「이야기 짜는 법」 (docs/content/story-guide.md)으로 다시 짠 시안. 같은 뉴스 · 같은 소스 팩 · 같은 그림 — **차례만** 다르다.
// 이야기의 글 · 근거 · 풀이 칸은 ./episode.json 에 있다 (계약의 Episode — 로컬 세션이 손으로 썼다 · 모델 API 0). 빌드할 때 계약 검증을 지난다 —
// 저장된 문서를 같이 주어 구절이 문서의 글 그대로인지까지 본다 (어기면 빌드가 멈춘다).
// 여기에는 **시안 전용**만 있다: 계약에 칸이 없어 kit 의 시안 칸 (EpisodeParts.replot)으로 넘기는 것 셋 · 견줘 읽기 · 맨 위 띠의 말.
import { parseEpisode } from "@claro/contract";
import store from "../../../../../../../packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/store.documents.json";
import type { EpisodeParts } from "../../../../episode/kit/Episode";
import type { EpisodeData } from "../../../../episode/kit/types";
import file from "./episode.json";

/** 구절이 기대는 저장된 문서 (저장소 뿌리에서) — check.ts 가 읽는다 */
export const STORES = ["packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/store.documents.json"] as const;
export const PATH = "/lab/episode/oil-replot";
/** 견줘 읽기 — 같은 뉴스의 지금 판 (실제 주소를 가리키기만 한다) */
export const NOW = "/s/oil/1";

const ep = parseEpisode(file, { documents: store.source_documents });
/** 화면이 쓰는 꼴 — 실제 화면처럼 처음 온 독자 하나 (catalog.episodeOf 와 같은 고정값). 다른 이야기로 가는 길은 실제 주소다 */
export const EPISODE: EpisodeData = {
  ...ep,
  path: PATH,
  short: ep.series.name,
  stores: STORES,
  readers: {
    new: { id: "new", label: "처음 온 독자", note: "", known: [], readZero: false, elsewhere: [] },
    follower: { id: "follower", label: "따라온 독자", note: "", known: [], readZero: true, elsewhere: [] },
  },
};

/**
 * 시안 전용 칸 셋 (kit/Episode 의 replot — 계약에 없다 · logs/frontend/UX-10.md ⑥). 글의 근거는 episode.json 의 구절을 가리킨다 (check.ts 가 본다).
 *   news   그날의 뉴스 한 줄 — 법 3. 계약에는 표지의 제목 · 한 줄 (dek)뿐이다
 *   veil   사슬의 주유소 고리를 누르기 전에 가린다 — 법 5. 계약의 멈춘 고리 (StoppedNode)에는 "누르기 전의 말" (idle)이 없다
 *   burst  체험 뒤에 문서의 문장이 먼저 — 법 6. 계약의 풀이에는 문서의 문장을 그대로 보이는 칸이 없다 (지금 판은 이 문장을 오늘의 사건 장면의 인용 칸에 썼다 — 글자는 그대로 옮겼다)
 */
export const REPLOT = {
  news: { t: "석유 최고가격, 열두 번째도 그대로", src: ["F001.1"] },
  veil: { station: "여기일까요?" },
  burst: {
    label: "삼월, 제도를 시작하며 산업부가 적은 문장",
    quote: { t: "“최고가격은 정유사의 주유소 및 대리점 등에 대한 공급가격을 기준으로 하며, 주유소 판매가격은 적용 대상에서 제외한다.”", src: ["F054.1", "F054.2"], voice: "official" },
    note: "산업부가 삼월 첫 발표에 적은 문장 그대로예요. 오늘 문서의 문장은 아니에요.",
  },
} satisfies NonNullable<EpisodeParts["replot"]>;

/** 맨 위 띠 — 시안 전용 글 (숫자 없음 · check.ts) */
export const BANNER = { tag: "시안", what: "같은 뉴스 · 차례만 다시", compare: "견줘 읽기 → 지금 판" } as const;
