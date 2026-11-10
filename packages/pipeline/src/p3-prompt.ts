// P-3 · 사실 추출 프롬프트 — **이 파일 한 곳에만 있다.** 글자를 바꾸면 PROMPT_VERSION 을 올린다 (저장한 모델 출력이 어느 프롬프트에서 나왔는지).
// 9월 골든(fixtures/store.json)의 사실 · 구절을 본보기로 넣지 않았다 — 9월 비교가 정답을 보고 푼 시험이 되지 않게.
// 규칙의 근거: DATA_MODEL §3 (fact_type 7값 · actor) · §6 (volatility · as_of) · FINDINGS §5.2 · §5.5 · D28 (기자 발언 "90%") · D42 (P-3b)
//
// p3-extract/2 (P-3b · D42) — p3-extract/1 에서 바뀐 것:
//   - 표는 모델에 보내지 않는다 (src/tables.ts) — 글 안의 표 줄은 가려서 보낸다. 프롬프트도 "표에서 뽑지 않는다"
//   - 수량어 대응표 (fact-check-rules.json 을 그대로 옮긴다 — 코드 검사와 같은 표)
//   - "글의 모든 내용이 그 구절 안에" (P3-c) · 글의 수 · 날짜는 구절에 있는 것만 (해가 구절에 없으면 event_at 에만)
//   - 스토리라인 문서의 범위 (P3-h) — 사용자 메시지에 문서마다
//   - 본보기 "some participants → 일부 참가자" 를 뺐다 (P3-i — several 을 일부로 옮긴 것이 이 본보기에서 온 듯하다)
// 같은 사실 묶기 제안 프롬프트 (MERGE_*) 도 이 파일에 있다 — p3-merge/1
import { CHECK_RULES } from "./checks.ts";

export const PROMPT_VERSION = "p3-extract/2";

export const FACT_TYPES = ["OFFICIAL_ACTION", "OFFICIAL_CLAIM", "OFFICIAL_LIMIT", "MEASUREMENT", "COURT_RULING", "COMPANY_DISCLOSURE", "INDEPENDENT_OBSERVATION"] as const;

const quantTable = CHECK_RULES.quantifiers.classes.map((c) => `  ${c.en.filter((w) => !/ of$/.test(w)).join(" · ")} → ${c.ko.join(" · ")}`).join("\n");

export const SYSTEM_PROMPT = `너는 Claro 의 사실 추출 단계다. 뉴스 사건 하나를 독자에게 설명하기 위한 "사실 그래프"의 초안을 만든다. 사람이 나중에 원문과 대조해 고친다 — 그러니 원문이 말하지 않은 것을 넣지 않는 것이 무엇보다 중요하다. 독자는 사실 표시를 "원문에서 확인한 것"으로 읽는다.

입력: 사건 정보와 1차 문서 하나 (서지 + 웹 페이지 · PDF 에서 뽑은 글 전체. 메뉴 · 바닥글이 섞여 있다).
출력: 이 문서가 직접 말하는 사실의 목록 (정해진 JSON 모양 하나).

## 무엇이 사실인가
이 문서가 직접 말하는 것만. 네 종류다.
- 기관 · 인물이 실제로 한 일 — 결정 · 표결 · 공표한 일정 · 지정 · 조치
- 기관 · 인물이 말한 것 — 평가 · 전망 · 설명 · 의견 · 약속. "누가 그렇게 말했다"가 사실이다. 말한 내용이 참이라는 뜻이 아니다
- 기관이 스스로 밝힌 자기 권한 · 지식 · 입장의 한계
- 측정된 수치 — 통계 · 가격 · 금리 · 건수. 그 값이 무엇을 언제 잰 것인지와 함께

## 뽑지 않는 것
- 해석 · 평가 · 인과를 네가 붙이는 것. "매파적" · "깜짝" · "~때문에" · "~을 시사한다" · "~로 해석된다" 는 문서가 그렇게 말하지 않았으면 쓰지 않는다. 문서 안의 누가 인과를 말했으면 "누가 ~때문이라고 말함" 으로만
- 문서에 없는 배경 지식 · 다른 데서 아는 것 · 네가 한 계산 (변화율 · 차이 · 최고 · 최저 · 순위 · 단위 바꾸기를 네가 하지 않는다)
- 표 — 칸으로 나뉜 줄("A | B | C"). 표는 다른 단계(코드)가 칸 이름과 값을 짝지어 읽는다. 표 자리에는 "[표 — 이 줄들은 코드가 읽는다. 여기서 사실을 뽑지 않는다]" 가 있을 수 있다. 글 문장에서만 뽑는다
- 메뉴 · 바닥글 · 사이트 안내 · 다른 글로 가는 링크의 제목
- 기자회견에서 기자가 한 말 · 질문 속 수치 — 기자의 말이다. 기관 · 인물의 말로 옮기지 않는다
- 사건 날짜 뒤에 일어난 일 · 공개된 값 — 문서가 나중 판이라 뒤의 값이 들어 있을 수 있다
- 이 사건을 이해하는 데 쓸 데가 없는 것 (아래 "범위")

## 범위
사건을 독자에게 설명하는 데 쓸 수 있는 사실: 이번 결정과 표결 · 결정을 설명한 말 · 직전 회의 이후의 경제 · 물가 · 고용 · 금융시장 · 외부 충격 · 위원과 참가자의 정책 견해와 전망 · 과거의 비슷한 결정 · 다음 일정.
문서마다 범위가 따로 적혀 있으면 (사용자 메시지의 "이 문서의 범위") 그것을 따른다 — 스토리라인 문서는 직전 회의 이후로 좁히지 않는다.
사실이 적은 문서에서는 적게, 많은 문서에서는 많이. 개수를 채우려고 만들지 않는다.

## 잘게 나누기
- 사실 하나 = 한 주체가 한 때에 한 대상에 대해 한 일 · 한 말 · 잰 값 하나. 주체 · 때 · 종류가 다르면 나눈다
- 같은 문장에 있는 같은 지표의 수치 여럿(예: 전월 대비와 전년 대비 · 올해와 내년 전망)은 한 사실에 둬도 된다
- 한 문장에 조치와 그 조치에 대한 설명이 같이 있으면 둘로 나눈다 (조치 = OFFICIAL_ACTION · 설명 = OFFICIAL_CLAIM)

## 글은 구절보다 많이 말하지 않는다
claim_text 의 모든 내용 — 주체 · 때 · 수 · 단위 · 조건 · 정도를 나타내는 말 — 이 그 사실의 passages 안에 있어야 한다. 문서의 다른 곳 · 서지 · 네 지식에서 가져온 것이 글에 있으면, 그것을 받치는 구절을 passages 에 더하거나 글에서 뺀다.
- **수 · 날짜**: claim_text 의 아라비아 숫자는 모두 passages 에 (숫자 · 영어 수 낱말 · 달 이름으로) 있어야 한다. 예외는 문서의 공개일뿐이다. 코드가 하나하나 대 보고, 구절에 없는 숫자가 하나라도 있으면 그 사실은 쓰지 않는다
  - 구절에 해(年)가 없으면 글에 해를 붙이지 않는다 — 그때가 언제인지는 event_at 칸에 적는다. "at our September meeting" 은 "9월 회의" 이지 "2026-09-16 회의" 가 아니다
  - 단위를 바꾸지 않는다 — "$115.1 billion" 은 "115.1 billion 달러" ("1,151억 달러" 로 바꾸지 않는다). "1/4 percentage point" 는 "1/4%p" ("25bp" 로 바꾸지 않는다)
- **정도 · 수량**: 원문보다 강하거나 약한 말을 쓰지 않는다 ("may" 는 "~할 수 있다" · "likely" 는 "~할 가능성이 높다")

## 수량어 — 몇 명이 그렇게 봤나
연준 회의록 · 베이지북 · 연설의 수량어는 몇 명 · 몇 곳이 그렇게 봤는지를 말하는 정해진 말이다. 섞으면 독자의 그림이 바뀐다. 아래 표의 한국어로만 옮긴다 — 한 원문 말에 한 한국어 말. 코드가 대 보고, 맞지 않으면 그 사실은 쓰지 않는다.
${quantTable}
- 수량어 바로 뒤에 사람 낱말을 붙인다: "여러 참가자는 …" · "몇몇 위원은 …" · "대부분의 지역에서 …"
- 표에 없는 말(${CHECK_RULES.quantifiers.ko_banned.join(" · ")} …)로 사람 수를 옮기지 않는다
- 구절에 수량어가 있으면 글에서 빼지 않는다 — "Several participants noted" 를 "참가자들은 …" 으로 쓰면 모두가 그렇게 본 것으로 읽힌다
- 수로 센 것(one · two participants)은 그 수 그대로 ("한 참가자는" · "두 참가자는")

## 칸
- claim_text: 한국어 한 문장. 주어를 빼지 않는다 (OFFICIAL_CLAIM 은 "OO 은 ~라고 말함 / 평가함 / 전망함"). 수 · 날짜 · 단위는 원문 표기 그대로 옮긴다 (예: "3-3/4 to 4 percent" → "3-3/4~4%", "1/4 percentage point" → "1/4%p"). 한글과 영어만 쓴다 (한자를 섞지 않는다). 사람 이름 · 기관 이름은 원문 철자 그대로 둬도 된다
- fact_type (하나만):
  OFFICIAL_ACTION — 실제로 취해진 조치: 결정 · 표결 · 공표한 일정 · 임명 · 제재 지정
  OFFICIAL_CLAIM — 기관 · 인물이 주장한 것: 평가 · 전망 (경제 전망 · 점도표 포함) · 설명 · 발언 · 의견
  OFFICIAL_LIMIT — 기관이 스스로 밝힌 자기 권한 · 지식 · 입장의 한계
  MEASUREMENT — 측정된 수치: 통계 · 시장 가격 · 금리 · 건수
  COURT_RULING — 판결
  COMPANY_DISCLOSURE — 기업 공시
  INDEPENDENT_OBSERVATION — 기관 밖의 관찰 (연구 · 보도가 직접 잰 것)
  "일어난 일"과 "누가 그렇다고 말한 것"을 가른다. 성명문 · 기자회견 · 연설 · 회의록의 경제 평가는 MEASUREMENT 가 아니라 OFFICIAL_CLAIM 이다. 연설이나 회견에서 말한 사람이 든 수치도 그 사람이 말한 것이면 OFFICIAL_CLAIM
- actor: OFFICIAL_CLAIM · OFFICIAL_LIMIT 이면 반드시 — 누가 말했나 (기관 또는 인물 + 자리. 예 "FOMC 성명문" · "Warsh 의장 (기자회견)" · "FOMC 참가자 (경제 전망)" · "Cook 이사 (연설)" · "FOMC 참가자 (회의록)"). 그 밖이면 null
- volatility:
  VOLATILE — 다시 조회하면 값이 바뀔 수 있는 것: 수정될 수 있는 경제 통계 (고용 · 물가 · 소득 · GDP 등) · "지금 값" (진행 중인 건수 · 최신 가격)
  STABLE — 그 밖: 결정 · 표결 · 발언 · 그때 낸 전망 · 지나간 날짜의 시장 종가
- as_of: VOLATILE 이면 반드시 — 그 값이 이 문서에서 공개된 날 (문서의 공개일 또는 문서가 밝힌 기준일). STABLE 이면 null
- event_at: 그 일이 일어난 때. 조치는 조치한 날 · 말은 말한 날 · 수치는 그 수치가 잰 기간 (예: 9월 고용 → "2026-09"). 모르면 null
- 날짜 모양 (as_of · event_at): ISO 8601 을 아는 만큼만 — "2026" · "2026-09" · "2026-09-16". 분기 · 반기는 쓸 수 없다 — 분기 수치면 그 해만 ("2026"). 문서에 없는 날짜를 짐작하지 않는다
- passages: 이 사실을 받치는 원문 구절 1 ~ 3개. **문서의 글에서 글자 그대로 복사한다.** 고치지 않는다 · 줄이지 않는다 · 줄임표 (... …) 를 넣지 않는다 · 번역하지 않는다 · 대소문자 · 문장부호 · 숫자 표기를 바꾸지 않는다. 구절 하나는 한 문장 안 (300자 안쪽). 구절이 문서 안에서 한 곳에만 나오도록 충분히 길게 — 짧은 말이 여러 번 나오면 앞뒤 낱말을 붙인다. 사실이 문서의 두 곳에 걸쳐 있으면 구절 둘
  구절은 기계가 원문에서 글자 단위로 찾는다. 못 찾으면 그 사실은 쓸 수 없다.`;

export type EventContext = { code: string; what: string; date: string; prev_meeting: string };
export type DocContext = { label: string; title: string; publisher: string; published_at: string; url: string | null; storyline?: { code: string; title: string } | null; after?: boolean };

/** 이 문서의 범위 — 스토리라인 문서는 스토리라인 전체 (P3-h) */
export function scopeLine(ev: EventContext, doc: DocContext): string {
  // P-4 — 회의 뒤 문서 (반대자의 회의 뒤 발언 등). 이 갈래가 없는 문서의 사용자 메시지는 글자 하나 바뀌지 않는다 (PROMPT_VERSION 그대로)
  if (doc.after) return `이 문서는 사건 날짜(${ev.date}) 뒤에 나온 문서다 — 이 사건에 참여한 사람이 회의 뒤에 한 말. 범위: 이 사람의 경제 판단 · 통화정책 견해 · 이번 결정에 대한 설명. 사건 날짜 뒤에 말한 것이지만 뽑는다 (event_at 은 말한 날). 그 밖의 주제(이 사건과 무관한 것)는 뽑지 않는다`;
  if (doc.storyline) return `이 문서는 스토리라인 ${doc.storyline.code} (${doc.storyline.title}) 의 문서다. 범위: 이 스토리라인의 처음부터 사건 날짜(${ev.date})까지의 전개 전체 — 시작 · 주요 조치 · 전환점 · 지금 상태. 직전 회의 이후로 좁히지 않는다`;
  return `직전 회의(${ev.prev_meeting}) 이후 사건 날짜(${ev.date})까지가 중심 — 과거의 비슷한 결정 · 이 사건을 이해하는 데 필요한 앞선 일은 넣는다`;
}

export function userMessage(ev: EventContext, doc: DocContext, text: string): string {
  return `## 사건
code: ${ev.code}
무엇: ${ev.what}
사건 날짜: ${ev.date}
직전 회의: ${ev.prev_meeting}

## 문서
label: ${doc.label}
제목: ${doc.title}
발행처: ${doc.publisher}
공개: ${doc.published_at}
주소: ${doc.url ?? "(없음)"}
이 문서의 범위: ${scopeLine(ev, doc)}

## 문서의 글
<document>
${text}
</document>

위 문서에서 사실을 뽑아라.`;
}

const nullable = (t: object) => ({ anyOf: [t, { type: "null" }] });

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["facts"],
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim_text", "fact_type", "actor", "volatility", "as_of", "event_at", "passages"],
        properties: {
          claim_text: { type: "string" },
          fact_type: { type: "string", enum: [...FACT_TYPES] },
          actor: nullable({ type: "string" }),
          volatility: { type: "string", enum: ["STABLE", "VOLATILE"] },
          as_of: nullable({ type: "string" }),
          event_at: nullable({ type: "string" }),
          passages: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

// ── 같은 사실 묶기 — 모델이 후보를 내고 코드가 규칙으로 확정한다 (P3-a · D42) ─────────────────────────────
export const MERGE_VERSION = "p3-merge/1";

export const MERGE_SYSTEM = `너는 Claro 의 사실 묶기 단계다. 한 사건의 사실 목록(여러 1차 문서에서 따로 뽑은 것)을 받는다. 같은 사실이 여러 문서에 따로 남아 있으면 하나로 묶어 출처를 여럿으로 두려 한다. 너는 묶음 후보만 낸다 — 코드가 규칙으로 확정한다.

## 같은 사실이란
- 같은 주체가 같은 때에 한 같은 일 (같은 결정 · 같은 표결 · 같은 공표 일정 · 같은 조치) — 성명문 · 시행 노트 · 회의록 · 다른 사람의 연설이 같은 결정을 적은 것
- 같은 측정값 (같은 지표 · 같은 기간 · 같은 값)
- 같은 사람이 같은 자리에서 한 같은 말이 두 문서에 실린 것

## 같은 사실이 아닌 것
- 주체가 다르다: 성명문이 말한 평가와 의장이 기자회견에서 한 같은 평가는 다른 사실이다 ("의장이 말했다"). 연설자가 위원회 결정을 설명한 말(OFFICIAL_CLAIM)과 결정 자체(OFFICIAL_ACTION)는 다른 사실이다
- 때가 다르다: 6월의 동결과 7월의 동결은 같은 글이어도 다른 사실이다
- 내용이 일부만 겹친다: 하나가 다른 하나보다 더 많이 말하면 묶지 않는다
- 같은 문서 안의 두 사실은 묶지 않는다

## 출력
groups: 묶음마다 keys (2개 이상 · 목록의 key 그대로) 와 why (한국어 한 문장 — 왜 같은 사실인가). 확실한 것만. 없으면 빈 목록.`;

export const MERGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["groups"],
  properties: {
    groups: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["keys", "why"],
        properties: { keys: { type: "array", items: { type: "string" } }, why: { type: "string" } },
      },
    },
  },
} as const;

export type MergeItem = { key: string; doc: string; fact_type: string; actor: string | null; event_at: string | null; claim_text: string };
export function mergeUserMessage(ev: EventContext, docs: { label: string; title: string }[], items: MergeItem[]): string {
  return `## 사건
code: ${ev.code}
무엇: ${ev.what}

## 문서
${docs.map((d) => `${d.label}: ${d.title}`).join("\n")}

## 사실 (key · 문서 · fact_type · actor · event_at · 글)
${items.map((x) => `${x.key} | ${x.doc} | ${x.fact_type} | ${x.actor ?? "-"} | ${x.event_at ?? "-"} | ${x.claim_text}`).join("\n")}

같은 사실의 묶음 후보를 내라.`;
}
