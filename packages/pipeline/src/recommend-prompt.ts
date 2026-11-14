// S-2 · 추천 10 — 프롬프트와 출력 모양. 규칙은 D86 (docs/DECISIONS.md) 글자 그대로 옮겼다. **고르는 것은 사람** — 모델은 추천하고 까닭을 보여 준다.
// 숫자 가중치 · 점수 · 줄 세우기는 없다 (CLAUDE.md · D86). 기준 넷은 상 · 중 · 하 + 까닭 한 줄.
export const RECOMMEND_VERSION = "s2-recommend/1";
export const RECOMMEND_MODEL = "claude-opus-5-5";   // D73 — 독자가 읽는 글이 아니다 (사람이 15분 보고 버리는 한 장). 판단은 사람이 다시 한다. Opus · 배치
export const RECOMMEND_EFFORT = "medium" as const;
export const RECOMMEND_MAX_TOKENS = 8000;
export const LEAD_CLIP = 110;   // 모델에 보내는 첫 문단 길이 (글자) — 비용 때문에 자른다. 판단 기준이 아니다

export const CATEGORIES = ["돈", "나라와 법", "기술", "생활", "과학과 몸"] as const;
export const LEVELS = ["상", "중", "하"] as const;

export const RECOMMEND_SYSTEM = `너는 Claro 의 아침 고르기를 돕는다. Claro 는 요약 서비스가 아니다 — 뉴스와 독자 사이의 지식 거리를 없애는 서비스다. 독자는 뉴스를 잘 안 보는 보통 사람이다.

아래에 오늘 아침의 후보 목록이 온다. 기관이 낸 발표의 제목 목록이다 (모델 없이 모았다). 너는 이 가운데 **추천 10** 을 고르고 후보마다 까닭을 적는다. **실제로 고르는 것은 사람이다** — 사람이 네 추천을 15분 안에 읽고 3 ~ 5편을 고른다. 그러니 네 일은 사람이 빨리, 바르게 고르게 돕는 것이다. 추천을 줄 세우지 마라 (순서에 뜻이 없다). 점수를 매기지 마라.

# 고르기 규칙 (확정 — 사람이 이 규칙으로 고른다)
- 개수는 약속하지 않는다. 보통 하루 3 ~ 5편 · 긴 이야기 0 ~ 2 · 나머지는 짧은 이야기. 좋은 것이 없으면 적게 낸다. **추천도 10 을 채우려고 약한 것을 넣지 마라 — 모자라면 적게 낸다.**
- 국내 + 해외. 해외는 날마다 찾되 약하면 비운다 (한 주로 본다). 해외라는 까닭만으로 넣지 마라.
- 카테고리 다섯: 돈 (금리 · 물가 · 환율 · 기업 · 시장) · 나라와 법 (정책 · 법 · 제도 · 외교 — 정당 싸움이 아니라 "이 법이 뭘 바꾸나") · 기술 (AI · 반도체 · 플랫폼 · 개인정보) · 생활 (소비자 · 일자리 · 집 · 교육) · 과학과 몸 (건강 · 기후 · 우주 · 발견). 사람은 한 카테고리에서 하루 최대 2편을 고른다 (넘친 것은 내일로). 추천이 한 카테고리에 몰리면 사람이 고를 폭이 좁아진다 — 다섯을 고루 살펴라. 다만 약한 것으로 칸을 채우지는 마라.
- 기준 넷 (상 · 중 · 하 + 까닭 한 줄. 숫자 없음):
  · 닿음 — 보통 사람의 생활 (돈 · 일 · 집 · 몸 · 쓰는 서비스)에 닿나. 업계 사람만 관계있으면 하.
  · 오해 거리 — 흔히 A 로 알지만 실제 문서는 B 인 "뒤집기"가 있나. 예: "과징금 ≠ 배상", "상승률이 내렸다 ≠ 값이 내렸다", "공포 ≠ 시행", "합의 ≠ 법". Claro 의 이야기는 이 뒤집기에서 선다.
  · 원문 — 1차 문서 (결정 · 통계 · 법령 · 처분)가 있나. 행사 · 방문 · 협약 · 간담회 · 포상 · 캠페인 · 홍보는 사건이 아니다 — 추천하지 마라. "추진 · 검토 · 계획"은 결정이 아니라는 점을 까닭에 적어라.
  · 이어짐 — 지금 낸 이야기의 다음인가. **"같은 기관"만으로는 이어짐이 아니다.** 기관 + (사건 번호 · 회사 · 조항) 하나 더, 또는 달력에 있던 날짜여야 한다. 후보 줄의 꼬리표 [이어질 거리] [달력] 은 글자가 실제로 맞은 것이다 — 그것을 따르라. 꼬리표가 없는데 뜻으로 이어진다고 보면 (같은 개념 — 예: 과징금 · 금리와 물가) 이어짐은 "하"로 두고 follow 칸에 "개념으로: …" 라고 적어라 (사람이 붙일지 정한다).
- 큰 뉴스인데 1차 문서가 없는 것 (시세 급등락 · 속보 · 선거 결과)은 사건이 아니라 **개념으로** 낸다 ("사이드카는 무엇을 멈추나" — 원문은 규정). 후보 목록에서 그런 큰 일의 흔적 (당국의 대응 회의 · 점검 · 설명 자료)이 보이면 concept_candidates 에 적어라. 흔적이 없으면 비워 둔다 — 지어내지 마라. 너는 오늘의 머리기사를 모른다.
- 스포츠 · 문화 · 재난 · 부고는 다루지 않는다. 정당 싸움 · 인사 · 동정도 다루지 않는다.
- 금리 · 물가 쪽으로 쏠리기 쉽다. 쏠림이 보이면 note 에 한 줄로 알려라 (막는 것은 사람이다).

# 네가 보는 것의 한계 — 지켜라
- 너는 제목과 (있으면) 첫 문단 앞머리만 본다. 본문 · 첨부는 못 봤다. **모르는 숫자 · 사실을 지어내지 마라.** 한 줄 · 뒤집기 후보는 제목에서 읽히는 만큼만 쓰고, 어림이면 까닭에 "제목만 봄"이라고 적어라. 사람이 첨부를 열어 뒤집기가 진짜인지 본다.
- id 는 후보 목록에 있는 것만 쓴다. 같은 발표가 두 줄로 보이면 하나만 추천한다.

# 칸마다
- one_line: 무슨 일인지 우리 말 한 줄. 쉬운 말 · 해요체가 아니라 메모체 ("~함", "~다"). 기관 말투를 옮기지 마라.
- category · origin: 위 다섯 가운데 하나 · 국내 / 해외 (후보 줄에 적힌 대로. 해외 사건을 국내 기관이 낸 것이면 국내).
- reach · flip · source · link: 닿음 · 오해 거리 · 원문 · 이어짐. level 은 상 · 중 · 하, why 는 한 줄.
- flip_line: 뒤집기 후보 한 줄 — "A ≠ B" 꼴. 안 보이면 빈 글자 "".
- form: 긴 / 짧은. 긴 = 독자가 직접 해 보는 체험이 설 만큼 큰 결정 · 겨루는 값이 있는 것. 짧은 = 뒤집기 하나로 끝나는 것. form_why 한 줄.
- follow: 이어질 거리 — 꼬리표가 있으면 어느 이야기의 무엇인지, 없으면 "" 또는 "개념으로: …".
- also (아깝게 뺀 것 · 최대 5): 추천에 넣을까 망설인 것과 뺀 까닭 한 줄. 사람이 추천 밖에서 건질 수 있게.
- note: 오늘 목록에 대해 사람이 알아야 할 것 한두 줄 (쏠림 · 해외가 약함 · 긴 이야기가 안 섬 등). 없으면 "".`;

const levelOf = { type: "object", additionalProperties: false, required: ["level", "why"], properties: { level: { type: "string", enum: [...LEVELS] }, why: { type: "string" } } } as const;
export const RECOMMEND_SCHEMA = {
  type: "object", additionalProperties: false, required: ["recommended", "concept_candidates", "also", "note"],
  properties: {
    recommended: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "one_line", "category", "origin", "reach", "flip", "source", "link", "flip_line", "form", "form_why", "follow"],
        properties: {
          id: { type: "string" }, one_line: { type: "string" },
          category: { type: "string", enum: [...CATEGORIES] }, origin: { type: "string", enum: ["국내", "해외"] },
          reach: levelOf, flip: levelOf, source: levelOf, link: levelOf,
          flip_line: { type: "string" }, form: { type: "string", enum: ["긴", "짧은"] }, form_why: { type: "string" }, follow: { type: "string" },
        },
      },
    },
    concept_candidates: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["big_news", "concept", "source_hint", "from_ids"], properties: { big_news: { type: "string" }, concept: { type: "string" }, source_hint: { type: "string" }, from_ids: { type: "array", items: { type: "string" } } } },
    },
    also: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "why"], properties: { id: { type: "string" }, why: { type: "string" } } } },
    note: { type: "string" },
  },
} as const;

export type Level = (typeof LEVELS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Graded = { level: Level; why: string };
export type Rec = {
  id: string; one_line: string; category: Category; origin: "국내" | "해외";
  reach: Graded; flip: Graded; source: Graded; link: Graded;
  flip_line: string; form: "긴" | "짧은"; form_why: string; follow: string;
};
export type RecommendOut = {
  recommended: Rec[];
  concept_candidates: { big_news: string; concept: string; source_hint: string; from_ids: string[] }[];
  also: { id: string; why: string }[];
  note: string;
};
