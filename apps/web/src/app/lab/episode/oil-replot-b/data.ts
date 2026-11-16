// UX-10b — 「기름값은 어디서 묶이나」 1화를 「이야기 짜는 법」 (docs/content/story-guide.md)으로 손으로 다시 짠 판의 자리.
// 회차 파일은 이 폴더의 episode.json (계약의 Episode — 같은 사건 · 같은 소스 팩 · 같은 구절). 이 주소는 lab 시안이라 실제 화면 (/s/oil/1)에 나가지 않는다.
// 이 파일은 시안 전용 칸 (kit/Episode 의 `replot` — UX-10 이 더한 것을 그대로 쓴다)과 맨 위 띠의 글만 둔다. 계약에 없는 칸이다.
import type { EpisodeParts } from "../../../../episode/kit/Episode";

export const STORE = "packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/store.documents.json";
export const EPISODE_FILE = "apps/web/src/app/lab/episode/oil-replot-b/episode.json";

/** "뒤집어 보면 A ≠ B" 상자를 풀이 맨 아래에 남기나 — 폰에서 견주고 정했다 (logs/frontend/UX-10b.md ⑦) */
export const BOX = false;

/** 깨는 사실 — 뒤집기를 받치는 문서 문장 (구절 키). 풀이 전의 글 · 그 글이 기대는 구절에 없어야 한다 (법 5) */
export const BREAKER_KEYS = ["F054.1", "F054.2", "F019", "F037", "F042", "F061.1", "F093.1", "F068"] as const;

export const REPLOT: NonNullable<EpisodeParts["replot"]> = {
  // 제목 위 — 그날의 뉴스 한 줄 (법 3)
  news: { t: "석유 최고가격, 열두 번째도 그대로", src: ["F001.1", "F001.2"] },
  // 사슬의 멈춘 고리 — 누르기 전에는 다른 고리와 같게 (법 5)
  veil: { station: "여기까지일까요?" },
  // 체험 뒤에 문서의 문장이 먼저 터진다 (법 6) — 상자는 BOX 로
  burst: {
    label: "시작할 때 산업부가 첫 발표에 적은 문장",
    quote: { t: "“최고가격은 정유사의 주유소 및 대리점 등에 대한 공급가격을 기준으로 하며, 주유소 판매가격은 적용 대상에서 제외한다.”", src: ["F054.1", "F054.2"], voice: "official" },
    note: "오늘 문서의 문장은 아니에요. 제도를 시작할 때 산업부가 적은 문장이에요.",
    box: BOX,
  },
};

/** 맨 위 띠 — 시안 전용 글 (숫자 · 모델 · 파이프라인 · 비용 말 없음) */
export const COPY = { tag: "다시 짠 이야기", compare: "견줘 읽기", to: "/s/oil/1" } as const;
