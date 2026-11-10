// P-5 · 해석(Derived Claim) 후보와 반증 — 프롬프트는 이 파일 한 곳에만 있다. 글자를 바꾸면 판(DERIVE_VERSION · COUNTER_VERSION)을 올린다.
//   p5-derive/1   사실 그래프 · 슬롯 표 · 스토리라인에서 해석 후보를 낸다 (statement · 근거 사실 · 어느 물음에 답하나 · 정치 표시)
//   p5-counter/1  해석마다 "이 해석을 약하게 만들 사실이 있다면 무엇인가" 를 묻고 그래프에서 답을 찾는다 (물음 · 답 · 답의 사실 · outcome) — 따로 부른다:
//                 해석을 낸 부르기가 자기 해석을 반증하면 확인으로 끝나기 쉽다 (반증은 다른 자리에서)
// 근거: FINDINGS §4.1 (해석은 사실이 아니다) · §5.2 · §7.2 (반증은 재수집을 트리거) · §7.6 (방어용) · D23 (층 판정) · D29 (좁혀서 참 ≠ 독자 그림) ·
//       D33-b (발행 뒤 문서에만 기댄 답) · D44 (정치 임시 규칙) · DATA_MODEL §7 (DerivedClaim · CounterCheck)
// 9월 사람이 쓴 해석 · 반증(fixtures/store.json claims)을 본보기로 넣는다 — 크기와 잘게 나눔을 보라고. 10월 사건의 정답이 아니다 (다른 사건이다)

export const DERIVE_VERSION = "p5-derive/1";
export const COUNTER_VERSION = "p5-counter/1";

const COMMON_RULES = `## 해석이란 (D23 층 판정)
- 사실을 바꿔 말하거나 반올림한 것은 해석이 아니다 — 그것은 사실이다. 내지 않는다
- 해석 = 사실들에서 끌어낸 **추론 · 평가 · 비교 · 원인 비중 · 일반화**. 예: "왜 이번엔 멈췄나" · "9월과 무엇이 달라졌나" · "반대는 무엇을 뜻하나(뜻하지 않나)"
- 애매하면 해석으로 본다

## 정치 — 임시 규칙 (D44 · 도윤이 D5 를 정하기 전까지)
- 의장 교체 · Cook 이사 관련 청문 절차 · 대통령 · 백악관의 말 · 연준 독립성 같은 것에 대해 **동기 · 의도 · 압력에 대한 해석을 만들지 않는다**. "누가 무엇을 공식적으로 말했다" 까지만
- 정치에 닿는 해석은 d5: true 로 표시한다 (따로 모은다 — 사람이 D5 를 정한 뒤 본다)
- "정치가 결정에 영향을 줬다 / 주지 않았다" 를 우리 판단으로 쓰지 않는다. 의장이 그렇게 말했다는 사실이 있을 뿐이다

## 반대자
- 반대자(Cook · Hammack) 본인의 표결 설명은 그래프에 없다 (슬롯 S03.b 비어 있음 · 10월 회의록은 아직). **반대 이유를 지어내지 않는다.** 회의 전 · 뒤 연설은 "그 사람이 그때 그렇게 말했다" 이지 "그래서 반대했다" 가 아니다

## 때 — 발행 시점
- 사실 목록의 [뒤] 표시 = 그 사실의 가장 이른 출처가 사건 날짜 뒤에 공개됐다 (회의 뒤 연설 · 받은 날 판 통계). 회의 때 위원들이 알 수 없던 것이다. 해석의 근거로는 회의 때 알 수 있던 사실을 먼저 쓴다

## 쓰지 않는 것
- 사실 목록에 없는 것 — 네 배경 지식 · 다른 데서 아는 것 · 보도 · 시장의 해석. 사실 label 은 목록에 있는 것만
- 새 수 — 차이 · 변화율 · 평균을 네가 계산하지 않는다. 사실에 있는 수를 나란히 놓는 것은 된다 (예: "9월 SEP 중앙값 4.1 · 지금 범위 3-3/4~4%")
- 시장 · 전문가가 "그렇게 봤다" — 그런 1차가 목록에 없다`;

export const DERIVE_SYSTEM = `너는 Claro 의 해석 단계다. 한 뉴스 사건의 사실 그래프(1차 문서에서 뽑아 원문 대조한 사실)와 Coverage 슬롯 표를 받아, 독자가 이 사건을 이해하는 데 필요한 **해석(Derived Claim) 후보**를 낸다. 사람이 게이트에서 본다. 다음 단계가 해석마다 반증을 찾는다.

Claro 는 요약 서비스가 아니다. 독자가 "왜 이렇게 됐나" 를 이해하게 하는 것이 목적이고, 그 "왜" 를 말하는 문장이 해석이다. 해석은 기사에 쓰이기 전에 반증을 거쳐야 하므로, 여기서 낸 해석만 기사에 들어갈 수 있다.

${COMMON_RULES}

## 무엇을 내나
- 독자가 이 사건에서 물을 물음에 답하는 해석 — 특히: 왜 이번엔 금리를 바꾸지 않았나 · 9월(인상)과 무엇이 달라졌나 · 반대 둘은 무엇을 뜻하나 · 앞으로에 대해 위원회가 무엇을 말했나(말하지 않았나) · 물가 · 고용 · 외부 충격이 결정과 어떻게 이어지나
- **방어용(DEFENSIVE)** 해석도 — 우리 주장이 아니라 독자가 자연스럽게 만들 오독을 막는 것 (예 9월 DC-B "세 명의 반대가 위원회를 움직였다는 증거는 없다"). 과대 · 과소 두 방향을 본다 (§7.6)
- 한 해석 = 한 주장. 둘을 이어 붙이지 않는다 (9월 본보기의 크기). 숫자를 채우려고 만들지 않는다 — 사실이 받치는 만큼만. 많아야 14
- statement: 한국어 한 문장. 주어를 분명히 ("연준이 든 이유는 …" · "참가자 전망으로는 …" — 누구의 판단인지가 범위다)
- basis: 이 해석이 기대는 사실 label (1개 이상 · 목록에 있는 것만). 해석의 모든 부분이 근거 사실에서 나와야 한다
- question: 이 해석이 답하는 독자의 물음 (짧게)
- element: 그 물음과 가장 가까운 Coverage 요소 id
- d5 · d5_why: 정치에 닿으면 true 와 한 줄 까닭 (아니면 false · null)
- note: 사람이 알아야 할 것 (근거가 얇다 · 회의 뒤 사실에 기댄다 등). 없으면 null`;

export const COUNTER_SYSTEM = `너는 Claro 의 반증 단계다. 다른 단계가 낸 해석(Derived Claim) 후보를 받아, 해석마다 **"이 해석을 약하게 만들 사실이 있다면 무엇인가"** 를 묻고 사실 그래프에서 답을 찾는다. 너는 해석을 지키는 쪽이 아니다 — 깨뜨리려는 쪽이다. 해석이 살아남으면 그것은 네가 찾지 못해서여야 한다.

실제로 있었던 일 (9월 기사): "분열이 이번 회의에서 시작됐다" 는 해석이 직전 전망(6월 SEP)을 보지 않아 틀렸다. 반증 슬롯이 비어 있었고, 다시 모으자 반증이 나왔다. 그래서 답이 그래프에 없으면 "없음" 으로 덮지 말고 비었다고 적어야 한다 — 사람이 1차 자료를 다시 모은다.

${COMMON_RULES}

## 물음 — 해석마다 2 ~ 7개 (9월 본보기의 깊이)
약하게 만드는 방향을 고루 본다:
- 반대 방향의 사실 — 해석과 다른 쪽을 가리키는 측정값 · 발언 (같은 문서 안의 단서 포함)
- 범위 — 누구의 판단인가 (성명문 · 의장 · 참가자 · 한 위원) · 언제 기준인가 · 어느 지표 · 어느 비교 기준(직전 회의 · 연초 · 전망)인가
- 다른 설명 — 같은 사실이 다른 해석도 받치나
- 빠진 것 — 그 해석이 서려면 있어야 할 사실이 그래프에 있나 (없으면 UNRESOLVED)
- 때 — 회의 때 알 수 있던 사실인가 ([뒤] 사실에만 기대지 않나)
- 독자 그림 — 문장이 참이어도 독자가 얻을 그림이 틀리지 않나

## 답 · outcome
- answer: 사실들이 말하는 것을 짧게. 사실 목록에 있는 것만. 새 수를 계산하지 않는다
- facts: 답이 된 사실 label (목록에 있는 것만)
- outcome (하나):
  NOT_REFUTED — 반증을 찾지 못했다 · 사실이 해석을 받친다. facts 1개 이상
  SCOPED — 해석이 그대로는 너무 넓다 · 범위를 좁히면 선다. facts 1개 이상
  UNRESOLVED — 답할 사실이 그래프에 없다. facts 는 비어도 된다. missing 에 **어떤 1차 문서가 답할 수 있는지** (발행처 · 문서 · 대략 날짜)
  REFUTED — 사실이 해석을 깬다 (좁혀도 서지 않는다). facts 1개 이상
- element: 이 물음에 답할 Coverage 요소 id (없으면 null)

## 좁힌 문장 — 9월의 교훈 (C-5 · D29)
"좁혀서 참이 되는 문장" 과 "독자가 맞는 그림을 얻는 것" 은 다르다. 9월에 "7월 고용 지표는 엇갈렸다" 로 좁혀 참으로 만들었지만, 발행일에 이미 8월 고용이 나와 있었고 독자는 "고용이 엇갈린다" 는 틀린 그림을 얻을 뻔했다.
- SCOPED 가 하나라도 있으면 narrowed_statement 에 **좁힌 문장** (한 문장 · 원래 해석의 주장을 지키되 반증이 요구한 범위를 넣는다). 없으면 null
- reader_picture: 좁힌 문장(없으면 원래 문장)을 읽은 독자가 **그래도 잘못 가질 수 있는 그림** 과 그것을 막을 사실 label. 없으면 "없음"

## 출력
results: 받은 해석마다 하나 (빠짐없이 · key 그대로)`;

export type ExemplarClaim = { label: string; kind: string; statement: string; checks: { question: string; answer: string; outcome: string; n: number }[] };

export function exemplarBlock(ex: ExemplarClaim[]): string {
  return ex.map((c) => `${c.label} (${c.kind}) ${c.statement}\n${c.checks.map((k) => `  - 물음 "${k.question}" → ${k.answer} [${k.outcome} · 사실 ${k.n}]`).join("\n")}`).join("\n");
}

export type Ctx = {
  code: string; what: string; date: string; prev_meeting: string;
  docs: string;      // 문서 범례 (label · 제목 · 발행처 · 공개일)
  slots: string;     // 슬롯 표 (요소 · 상태 · 사실 label)
  unslotted: string; // Unslotted 묶음 (P-4)
  storyline: string; // 스토리라인 v2 가 가리키는 사실
  facts: string;     // 사실 목록 (label | 문서 | event_at | fact_type | actor | 글) — [뒤] 표시
  exemplars: string; // 9월 본보기
};

const ctxBlock = (c: Ctx) => `## 사건
code: ${c.code}
무엇: ${c.what}
사건 날짜: ${c.date} · 직전 회의: ${c.prev_meeting}

## 문서 (label · 제목 · 발행처 · 공개일)
${c.docs}

## Coverage 슬롯 표 (요소 id · 무엇을 묻나 · 상태 · 붙은 사실 label)
${c.slots}

## 어느 슬롯에도 안 붙은 사실 묶음 (P-4 Unslotted — 후보일 뿐)
${c.unslotted}

## 스토리라인 SL-iran-war (이란 전쟁) v2 가 아는 사실 (그래프의 사실)
${c.storyline}

## 사실 그래프 (label | 문서 | event_at | fact_type | actor | 글) — [뒤] = 가장 이른 출처가 사건 날짜 뒤
${c.facts}

## 본보기 — 9월 FOMC (다른 사건) 에서 사람이 쓴 해석과 반증. 크기 · 잘게 나눔 · 물음의 깊이만 본다. 내용을 옮기지 않는다
${c.exemplars}`;

export const deriveUser = (c: Ctx) => `${ctxBlock(c)}

이 사건의 해석 후보를 내라.`;

export const counterUser = (c: Ctx, claims: { key: string; statement: string; kind: string; basis: string[] }[]) => `${ctxBlock(c)}

## 반증할 해석 (key · kind · statement · 근거 사실)
${claims.map((x) => `${x.key} (${x.kind}) ${x.statement}\n  근거: ${x.basis.join(" ")}`).join("\n")}

해석마다 반증을 찾아라.`;

const nullable = (t: object) => ({ anyOf: [t, { type: "null" }] });

export function deriveSchema(elementIds: string[]) {
  return {
    type: "object", additionalProperties: false, required: ["claims"],
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["key", "statement", "kind", "basis", "question", "element", "d5", "d5_why", "note"],
          properties: {
            key: { type: "string" }, statement: { type: "string" }, kind: { type: "string", enum: ["ASSERTED", "DEFENSIVE"] },
            basis: { type: "array", items: { type: "string" } }, question: { type: "string" }, element: { type: "string", enum: elementIds },
            d5: { type: "boolean" }, d5_why: nullable({ type: "string" }), note: nullable({ type: "string" }),
          },
        },
      },
    },
  } as const;
}

export function counterSchema(elementIds: string[]) {
  return {
    type: "object", additionalProperties: false, required: ["results"],
    properties: {
      results: {
        type: "array",
        items: {
          type: "object", additionalProperties: false, required: ["key", "checks", "narrowed_statement", "reader_picture"],
          properties: {
            key: { type: "string" },
            checks: {
              type: "array",
              items: {
                type: "object", additionalProperties: false, required: ["question", "element", "answer", "facts", "outcome", "missing"],
                properties: {
                  question: { type: "string" }, element: nullable({ type: "string", enum: elementIds }), answer: { type: "string" },
                  facts: { type: "array", items: { type: "string" } }, outcome: { type: "string", enum: ["NOT_REFUTED", "SCOPED", "UNRESOLVED", "REFUTED"] },
                  missing: nullable({ type: "string" }),
                },
              },
            },
            narrowed_statement: nullable({ type: "string" }), reader_picture: { type: "string" },
          },
        },
      },
    },
  } as const;
}
