# Claro — 기술 소개서

> 문서 상태: 2026년 9월 14일 기준. **지금까지 논의에서 확정된 것만** 담았다.
> 아직 확정하지 않기로 한 항목은 마지막 장에 따로 모았다.

---

## 1. 이 서비스가 하려는 것

Claro는 요약 서비스가 아니다. 뉴스를 짧게 만드는 것이 목표가 아니라, **뉴스와 독자 사이의 지식 거리를 없애는 것**이 목표다.

내부 원칙은 한 문장으로 둔다.

> **충분히 깊게 조사하고, 필요한 것만 남긴 뒤, 읽다 보면 사건의 그림이 저절로 머릿속에 그려지도록 쓴다.**

세 부분 모두가 요건이다.

- **충분히 깊게 조사한다** — 사실을 얕게 모으면 좋은 글이 나올 수 없다. 실제 제작에서 확인된 바로, 이야기의 반전은 대부분 깊은 조사에서 나온다.
- **필요한 것만 남긴다** — 편집이 핵심 기술이다. 무엇을 버려도 되는지, 무엇을 빼면 오해가 생기는지를 판단한다.
- **저절로 그려지도록 쓴다** — 독자가 노력해서 해석해야 하는 글은 실패다.

정확성과 가독성은 대립하지 않는다. 정확성은 **더 흥미로운 진짜 이야기를 발견하는 수단**이다.

---

## 2. 아키텍처의 근본 구조

시스템을 두 개의 파이프라인으로 나눈다.

```
A. ARTICLE COMPILATION PIPELINE
   사건마다 하루 한 번 / 비싸고 느려도 됨 / 모든 사용자 공통
              ↓
        Article Package
              ↓
B. PERSONALIZATION PIPELINE
   사용자가 기사를 열 때 / 매우 빨라야 함 / 사용자마다 다름
```

이 분리가 정확성·비용·디버깅·확장성을 동시에 해결한다.

**비용 구조상의 핵심**: A는 사용자 수와 무관한 고정비다. 사용자가 100명이든 100만 명이든 오늘 만드는 사건 수는 같다. B에서 사용자 요청마다 LLM을 호출하면 비용이 사용자 수에 선형으로 붙는다.

목표는 **기본 읽기 경로에서 사용자당 LLM 호출 0**이다. 다만 이것은 "사용자 생애 LLM 호출 0"이 아니다. 자유 질문 같은 탈출구는 필요하고, 대신 **일일 상한을 제품 스펙에 처음부터 넣는다.**

파이프라인 A는 에이전트들이 대화하는 형태가 아니라 **DAG**로 만든다. 각 단계는 지정된 JSON만 입력받고 JSON만 출력한다. 실패하면 해당 단계만 다시 돌린다.

---

## 3. 콘텐츠 모델 — 두 개의 레이어

가장 중요한 구조적 결정이다.

### Evidence Layer (규격화한다)

- **Fact Atom** — 실제로 일어난 일. 출처와 원문 위치를 물고 있다.
- **Concept Atom** — 개념 설명. 전역, 재사용, 버전 관리.
- **Bridge Atom** — 개념·이전 사건과 오늘 사건을 잇는 연결.
  - `CONCEPT_BRIDGE` — 개념 → 오늘 사건
  - `STORY_BRIDGE` — 이전 사건 → 오늘 사건
- **Derived Claim** — 사실들로부터 도출한 해석. Fact가 아니다.

### Writing Layer (규격화하지 않는다)

질문, 비유, 리듬, 공감, 긴장, 순서, 문체.

**Writing Layer는 새로운 사실을 만들 수 없다.** 그 외에는 자유다.

### Atom은 글이 아니다

```
Atom   = 작가에게 주는 재료
Article = 그 재료로 새로 쓴 하나의 글
```

블록을 순서대로 이어붙이면 정확한 설명 자료는 되지만 읽고 싶은 글은 되지 않는다. 최종 글은 **긴장과 호기심을 고려해 다시 배치해서 쓴다.** 좋은 문장은 앞 문장이 뒷 문장의 리듬을 결정하므로, 문단별 독립 생성으로는 만들 수 없다.

### Concept Atom의 규율

Concept Atom은 **시간에 독립적**이어야 한다. 현재 정책 국면에 대한 가정을 담으면 안 된다.

| | 예시 |
|---|---|
| ❌ 나쁜 Concept | "지금 연준은 물가가 높아서 금리를 내리지 않고 있다" |
| ❌ 나쁜 헤더 | "왜 연준은 금리를 안 내릴까?" |
| ✅ 좋은 Concept | "금리가 오르면 차입 비용이 올라 소비와 투자를 억제하는 방향으로 작용할 수 있다" |
| ✅ 좋은 헤더 | "금리는 경제에 어떻게 영향을 줄까?" |

프레이밍 질문은 전부 Bridge의 몫이다. 이 규율이 없으면 Concept Library가 작성 시점의 국면에 절여져 몇 달 뒤 조용히 틀려진다.

Concept Atom은 개선될 수 있으므로 **버전을 두고**, Article Package는 발행 당시 검증된 버전을 pin한다.

### 비유의 사용 기준

> **비유는 독자가 경험할 수 없는 것에만 쓴다.**

통화정책 전달경로는 경험할 수 없으므로 비유가 필요하다("금리는 경제의 브레이크 페달"). "회의에서 투표를 하고 별도로 각자 전망을 적어냈다"는 누구나 아는 일이므로 비유가 오히려 방해가 된다 — 그냥 장면으로 쓴다.

비유가 잘 만들어지지 않으면, 사건을 덜 이해했거나 애초에 비유가 필요 없는 대상이다.

---

## 4. 사실과 출처

### Primary-source-first

- **1차 자료** → Fact Layer 구축
- **뉴스 매체** → 오늘 무엇이 중요한지 발견하는 discovery / ranking 신호

취재 기반 특종은 MVP에서 다루지 않는다. 정책·경제·중앙은행·법원·기업·규제 영역은 1차 자료가 충분히 풍부하다.

**"1차 자료를 쓰면 저작권 문제가 사라진다"는 것은 사실이 아니다.** 미국 연방정부 저작물은 원칙적으로 보호되지 않지만, 지역 연은이나 국제기구는 자체 저작권을 주장한다. 따라서 출처별 권리를 DB에 기록한다.

```
source_registry
  source / access_method / can_ingest / can_store / can_quote
  can_transform / commercial_use / attribution_required
  terms_url / last_reviewed_at
```

### Primary source ≠ neutral source

공식 발표를 사실로 옮겨 적으면 안 된다. Fact에는 유형이 붙는다.

```
OFFICIAL_ACTION       실제로 취해진 조치
OFFICIAL_CLAIM        기관이 주장한 것
MEASUREMENT           측정된 수치
COURT_RULING
COMPANY_DISCLOSURE
INDEPENDENT_OBSERVATION
```

백악관이 "우리 정책으로 물가가 안정됐다"고 발표하면, Fact는 `물가가 안정됐다`가 아니라 `백악관이 그렇게 주장했다`이다.

### Fact ↔ Source는 N:M

하나의 사실이 여러 출처에 나타난다. 따라서 시간 필드를 분리한다.

```
event_at                  사건이 일어난 시점
source.published_at       그 문서가 공개된 시점
first_verified_public_at  확보한 공개 출처 중 가장 이른 시점
ingested_at               우리가 수집한 시점
```

**실제 제작에서 발견된 오류**: 사실의 공개 시점을 "우리가 그 사실을 읽은 문서의 공개일"로 잡으면 안 된다. 7월 회의록(8월 19일 공개)에 기록된 7월 29일 당시 시장 가격은, 7월 29일에 공개적으로 알 수 있었던 정보다.

다만 **publicly knowable**과 **Claro가 검증 가능한 출처를 확보함**은 다르다. 후자가 없으면 그 시점 기사에 쓸 수 없다.

### 원문 대조는 필수 단계

LLM 추출 결과만 저장하면 안 된다. `source_document` 자체를 보관하고, 모든 Fact가 원문 위치를 물고 있어야 한다.

```
fact_claim
  claim_text / fact_type
  source_id / source_section / source_span_start / source_span_end
  extraction_model / extraction_version
```

검증은 혼합으로 한다.

- **Deterministic** — 숫자·날짜·비율의 원문 리터럴 일치 (코드)
- **Semantic entailment** — 추출된 주장이 원문 구간에서 도출되는가 (저렴한 모델 1차, 애매한 것만 상위 모델)

단, **entailment 검사는 누락과 조합으로 인한 왜곡을 잡지 못한다.** 이건 별도 QA의 몫이다.

### 사건 유형별 Source Pack

한 사건의 공식 자료 묶음을 유형별로 정의한다. FOMC의 경우:

```
T0   Statement + Implementation Note + SEP(해당 회의) + Press Conference
T+21 Minutes
```

이전 회의의 같은 네 종류가 Storyline context가 된다.

---

## 5. 수집과 선택을 분리한다

이것이 초기 설계의 가장 큰 오류였다. Fact Layer라는 이름 아래 두 가지 일이 섞여 있었다.

```
Primary Sources
      ↓
Source Documents
      ↓
Claim Extraction + Source-span Verification
      ↓
DEEP FACT GRAPH        ← 사실을 충분히 모은다 (사건당 20~30개 이상)
      ↓
Coverage Schema 점검
      ↓
Derived Claim + Counterevidence Search
      ↓
COMPREHENSION GOAL
      ↓
선택된 Fact Atom + Concept Atom + Bridge Atom
      ↓
글쓰기
```

`Fact Atom`은 원자료 추출의 결과물이 아니라 **Deep Fact Graph에서 이 뷰에 쓰려고 선택된 표현 단위**다.

### 그래서 원칙이 수정된다

기존:

> Personalization changes scaffolding, not truth.

이 원칙은 여전히 맞지만, 여기에 "모든 사용자가 동일한 사실 subset을 본다"까지 붙어 있었던 것이 문제였다. 정확한 표현은:

> **모든 사용자는 동일한 Fact Graph를 공유한다.
> 어떤 사실을 전면에 보여줄지는 달라질 수 있다.**

이 수정이 없으면 숙련자용 뷰가 구조적으로 초보자용 뷰의 부분집합이 되어, 절대 더 풍부해질 수 없다.

```
Beginner = fewer facts  + more scaffolding
Advanced = more facts   + less scaffolding
```

---

## 6. Coverage Schema

"뉴스를 완벽하게 수집했나"가 아니라 **"이 종류의 사건을 이해하려면 보통 무엇을 확인해야 하는가"**의 체크리스트다.

FOMC 예시 슬롯: 현재 정책결정 / 표결 / 반대표 방향 / 직전 회의 결정 / 직전 정책 전망 / 물가 평가 / 실제 물가 수치 / 고용·성장 / 반대파 논리 / 외부 충격 / 시장 기대 / 위원회 향후 전망 / 커뮤니케이션 변화 / 역사적 희소성 / 다음 일정

각 슬롯의 상태는 네 가지로 구분한다.

```
FOUND
NOT_EXTRACTED        자료는 있는데 우리가 못 뽑음  ← 파이프라인 실패
SOURCE_UNAVAILABLE   필요한 자료 자체를 확보 못 함  ← 콘텐츠 결손
NOT_APPLICABLE
```

이 둘을 뭉뚱그리면 진짜 결손과 작업 누락이 구분되지 않는다.

### Unslotted Notable

Coverage Schema는 **놓치지 않기 위한 체크리스트**다. 예상하지 못한 것은 슬롯 자체가 없어서 감지되지 않는다. 그래서 소스 팩 검토 마지막에 반드시 열린 질문을 던진다.

> 이 Source Pack 안에, 기존 슬롯 어디에도 들어가지 않지만 이전과 달라졌거나 이례적인 사실이 있는가?

Coverage Schema는 스코프 도구이기도 하다. **스키마가 있는 사건 유형만 파이프라인을 태운다.** 이것이 MVP 범위를 정의한다.

---

## 7. Derived Claim과 Comprehension Goal

### Derived Claim

Fact를 연결해 만든 해석은 Fact가 아니다. 별도 층으로 둔다.

```
FACTS → DERIVED CLAIM → BRIDGE ATOM
```

각 Derived Claim에는 `supporting_fact_ids`, `contradicting_fact_ids`, `scope`, `derivation_type`이 붙는다.

**Counterevidence Search는 자기 그래프만 뒤져서는 안 된다.** 이미 수집한 반증만 찾게 되기 때문이다. 반증 탐색은 Coverage Schema와 연결되어 재수집을 트리거할 수 있어야 한다.

```
Claim: "분열이 이번 회의에서 시작됐다"
→ 이 주장을 반증할 수 있는 슬롯은? (직전 정책 전망, 과거 반대표 이력)
→ 슬롯 상태 확인 → EMPTY
→ 수집 → 반증 확보 → claim 수정
```

### Comprehension Goal이 앞에 온다

```
Deep Fact Graph
      ↓
이 사건에서 실제로 주목할 만한 것은 무엇인가
      ↓
COMPREHENSION GOAL (후보)
      ↓
Counterevidence QA          ← Goal 자체도 반증 검사를 통과해야 한다
      ↓
VALIDATED GOAL
      ↓
Knowledge Requirement 역산
      ↓
Criticality (Goal 기준)
```

Goal 구조는 다음과 같다.

- **Common Goal** — 모든 뷰가 반드시 도달해야 하는 하나의 문장. **POST probe와 A/B 비교 지표는 이것에서만 나온다.**
- **Deep Goal** — 심화 뷰의 보조 목표. 품질 관리용이며 비교 지표로 쓰지 않는다.

### KC는 Fact가 아니라 Goal에서 역산한다

실제 제작에서 이 순서를 어겨 BLOCKING 개념을 두 개 빠뜨렸다. Fact를 보고 익숙한 개념(금리, 물가, FOMC)부터 뽑았고, 정작 Goal에 필요한 제도 개념을 놓쳤다.

검사 방법은 단순하다.

> Goal 문장의 각 명사를 초보자가 이해하는가?
> Goal 안에서 비교되는 두 대상의 차이를 이해하는가?

여기서 걸리는 것이 KC 후보다.

### Criticality는 숫자가 아니라 범주

`0.83` 같은 값은 정밀해 보이는 가짜 정밀도다.

```
BLOCKING     모르면 핵심 사건 자체를 이해할 수 없다
SUPPORTING   핵심은 이해되지만 왜 중요한지 이해하기 어렵다
ENRICHING    알면 좋지만 없어도 이해에 지장 없다
```

Criticality는 기사 전체에 고정된 값이 아니라 **Comprehension Goal에 상대적**이다.

---

## 8. 편집 — 무엇을 남기는가

사실을 남기는 이유는 두 가지이며, 성격이 다르다.

### Supportive Include

Goal이나 Derived Claim을 뒷받침한다. `supporting_fact_ids`를 따라가면 되므로 기계적으로 판단 가능하다.

### Defensive Include

없어도 문장은 성립하지만, **빼면 독자가 자연스럽게 틀린 결론을 내린다.**

이것이 훨씬 어렵다. 독자의 기본 추론을 모델링해야 하기 때문이다. 현재 검사 방법은 편집 red-team으로 둔다.

> 초고를 쓴 뒤, 원자료를 안 봤다고 가정하고 글만 읽는다.
> 이 글만 읽으면 어떤 결론을 내릴까? 3~5개 적는다.
> 각각을 Deep Fact Graph와 대조한다. 충돌하면 그 사실은 defensive include다.

**주의**: 기존 Counterevidence Search는 Derived Claim에 대해서만 돈다. 방어적 누락은 **선택 결과 전체에 대해** 돌려야만 발견된다.

### 편집 규칙

> 없애도 이야기의 의미가 그대로인 정보는 버린다.
> 없애는 순간 독자가 사건을 잘못 이해하게 되는 정보는 남긴다.

숫자를 줄이는 것이 목적이 아니다. 실제 제작에서 물가 수치 네 종류는 전부 사실이었지만 버렸고, 숫자가 세 개인 전망 분포는 남겼다. 후자를 빼면 잘못된 서사가 자동으로 만들어지기 때문이다.

---

## 9. 세 개의 축

콘텐츠는 두 축이 아니라 세 축이다.

| 축 | 질문 | 결정 방식 |
|---|---|---|
| **Time** | 이 시점까지 무엇이 알려져 있는가 | 소스 가용성 |
| **Depth** | 그중 몇 개의 사실을 보여줄 것인가 | **사용자 선언** (추정 불필요) |
| **Scaffolding** | 사실 사이를 얼마나 설명할 것인가 | 추정 대상 |

Depth와 Scaffolding은 직교한다. 시장 프라이싱을 보여줄지는 "이 사람이 그 개념을 아는가"로 정해지지 않는다 — 오히려 아는 사람일수록 보고 싶어 한다. 따라서 **Depth는 명시적 컨트롤로 두고, 추정 모델은 Scaffolding만 담당한다.**

Time 축의 함의: 기사는 완성된 정적 문서가 아니라 **살아 있는 Storyline의 한 시점 snapshot**이다.

### Article Package는 immutable, Storyline은 versioned mutable

```
발행 시점:  ArticlePackage v1 (storyline_snapshot = S_v5)  ← 변하지 않는다
3주 뒤:     Storyline → S_v6
```

늦게 도착한 사실은 원 기사를 조용히 고치는 것이 아니라 Storyline에 붙인다. 사용자가 옛 기사를 다시 열면 "이후 새로 확인된 내용"을 별도로 보여줄 수 있다.

Storyline은 참조 배열이 아니라 **자체 사실을 갖는 first-class object**다.

---

## 10. QA

"틀린 사실을 추가했나?" 하나로는 부족하다. 실제 제작에서 발생한 왜곡은 **추가가 아니라 누락과 프레이밍**에서 나왔고, 기존 fact checker는 그것을 통과시켰다.

| QA | 질문 |
|---|---|
| **Source Fidelity** | 이 Fact가 실제 원문에 있는가 |
| **Coverage** | Goal 설명에 중요한 슬롯이 비어 있는가 |
| **Counterevidence** | 이 Derived Claim을 약화하는 사실이 있는가 |
| **Frame Consistency** | 현재 국면과 맞지 않는 프레임을 쓰고 있는가 |
| **Goal Sufficiency** | 선택된 블록만 읽고 Common Goal에 도달할 수 있는가 |
| **Requirement Consistency** | 같은 기사를 여러 번 분석했을 때 결과가 안정적인가 |

핵심 확장:

> **"사실은 맞는데 잘못된 이야기를 만들었나?"**

뉴스 설명 서비스에서는 이쪽이 더 중요할 수 있다.

---

## 11. 관찰 인프라

개인화 모델은 보류하지만, **관찰 데이터는 Day 1부터 정확히 남긴다.** 모델은 나중에 replay로 재계산할 수 있지만 기록하지 않은 관찰은 복구할 수 없다.

### 두 개의 source of truth

```
knowledge_evidence   사용자가 무엇을 했나
reading_plan_log     시스템이 무엇을 보여줬나
```

둘 다 필요하다. 후자가 없으면 POST probe를 해석할 수 없다. FULL 설명 뒤의 정답과 SKIP 뒤의 정답은 완전히 다른 의미다.

```
knowledge_evidence
  event_id / user_id / concept_id / timestamp
  evidence_type          ← 사실만 기록. weight는 박지 않는다
  position               PRE / POST / DELAYED
  article_id / interaction_id / probe_id / content_block_id
  response / is_correct
  exposure_context / model_version / content_version
```

`PRE_PROBE_CORRECT → +2.0` 같은 해석은 현재 learner-model version이 담당한다. 그래야 가중치도 나중에 바뀔 수 있다.

`user_concept_state`는 **cache/projection**이며 언제든 날리고 재계산할 수 있다. decay를 컬럼에 파괴적으로 적용하지 않는다.

### Probe

같은 질문이라도 위치에 따라 다른 것을 측정한다.

| 유형 | 목적 |
|---|---|
| `DIAGNOSTIC` | 초기 선행지식 측정 |
| `ACTIVE` | information gain 최대화 |
| `AUDIT` | 무작위·층화 sampling, calibration 검증용 |
| `COMPREHENSION` | 설명 이후 이해 확인 |

**AUDIT 슬롯이 반드시 있어야 한다.** ACTIVE만 돌리면 모델이 애매해하는 지점만 물어보게 되어 calibration 측정이 편향된다.

- 설명 **전** probe → 선행지식 증거
- 설명 **후** probe → 습득 증거 (짧은 half-life) + 설명 품질 평가 입력
- 며칠 뒤 재정답 → 장기 지식으로 승격

**무응답은 증거가 아니다.** 설명을 펼치지 않은 것도 MVP에서는 0 evidence로 둔다.

Probe 예산은 기사당이 아니라 **세션 단위**로 잡는다. 기사 6개에 3개씩이면 하루 18문제가 되어 퀴즈 앱이 된다.

Probe는 퀴즈처럼 보이면 안 된다. 기사 흐름 안의 자연스러운 대화형 블록으로 넣는다.

---

## 12. 개념 식별 (Concept Identity)

되돌리기 가장 어려운 부분이므로 Day 1에 확정한다. 여기가 무너지면 **에러 없이 조용히** 데이터가 썩는다.

### Topic과 Knowledge Component를 분리한다

```
Federal Reserve          ← TOPIC. evidence 기록 금지
├─ FED_ROLE              ← LEAF KC
├─ FOMC_ROLE             ← LEAF KC
├─ FED_DUAL_MANDATE      ← LEAF KC
└─ FED_FUNDS_RATE_ROLE   ← LEAF KC
```

> **Evidence는 leaf KC에만 기록한다. Parent는 탐색·그룹핑용이며 mastery를 갖지 않는다.**

UI의 "알고 있어요" 버튼도 leaf proposition 단위로 받는다.

### Merge-friendly, Split-hostile

merge는 evidence remap으로 안전하게 되돌릴 수 있지만, **split은 되돌릴 수 없다.** 자기보고 evidence를 여러 자식 중 어디로 보낼지 결정할 방법이 없기 때문이다.

> **애매하면 무조건 잘게 자른다.**

### 스키마

```
concept
  concept_id (UUID) / canonical_name / concept_type
  status: CANONICAL | PROVISIONAL | MERGED | DEPRECATED
  merged_into / version

concept_alias
  alias / language / concept_id / source

concept_relation
  from_id / to_id / relation_type / strength
  source / generator_model / validation_status

concept_candidate
  candidate_text / embedding / candidate_context
  suggested_concept_id / match_score / status
```

### Resolver 동작

```
확실한 매칭    → LINK
애매함        → PROVISIONAL KC 생성 + FLAG   ← 파이프라인을 막지 않는다
명백히 새로움  → CREATE
```

1인 개발에서 리뷰 큐가 파이프라인을 막으면 운영이 불가능하다. merge가 안전하게 설계되어 있으므로 차단할 이유가 없다.

임계값은 지금 확정하지 않는다. embedding 모델마다 분포가 다르므로 `HIGH / AMBIGUOUS / LOW` 구간만 두고 실제 값은 validation set으로 정한다. 유사도 하나만 보지 않고 **label + definition + graph neighborhood + article usage context**를 함께 본다.

### Merge

posterior를 합산하지 않는다. 같은 interaction이 두 중복 개념에 기록됐을 수 있어 이중 계산된다.

```
concept B → merged_into A (redirect)
knowledge_evidence를 canonical A로 remap
interaction_id 기준 dedupe
posterior replay
```

`knowledge_evidence`가 immutable log라는 결정이 여기서 값을 한다.

### prerequisite edge

LLM이 준 `0.82` 같은 값은 쓰지 않는다. 초기에는 범주형으로 둔다.

```
REQUIRED_PREREQUISITE / HELPFUL_PREREQUISITE / RELATED
```

실제 probe 데이터가 쌓이면 edge 강도를 데이터에서 학습한다. **LLM은 후보를 제안하고, 신뢰도는 관측이 결정한다.**

---

## 13. 단계 계획

### Phase 0 — 되돌리기 어려운 것만 (며칠 규모)

스키마 결정이지 도구 제작이 아니다. rights registry는 테이블 하나이지 규정 준수 시스템이 아니고, merge는 SQL 스크립트이지 관리 UI가 아니다.

- Concept identity (UUID / alias / provisional / merge redirect / version)
- Content model (Fact / Concept / Bridge / Derived Claim, versioning)
- Source & rights (source_document, span, fact_type, N:M, 시간 필드 4종)
- `knowledge_evidence` schema
- `reading_plan_log` schema
- Probe type 구분

### Phase 1 — MVP

파이프라인 A + 로그인 시 간단한 calibration + **3단계 정적 레벨**(BEGINNER / INTERMEDIATE / ADVANCED) + probe/evidence 로깅.

지식 상태를 읽는 함수는 **코드 전체에서 호출 지점을 하나로 모은다.** 추상 인터페이스는 만들지 않는다. 두 번째 구현체가 없을 때 설계한 인터페이스는 거의 반드시 틀린다.

**Phase 1 게이트는 절대 수치가 아니라 비교군으로 잡는다.** `POST comprehension ≥ 75%`는 probe 난이도의 함수일 뿐이다.

```
Event A:  Group 1 → Claro     Group 2 → 일반 기사
Event B:  Group 1 → 일반 기사  Group 2 → Claro
```

동일 Common Goal 기반 probe 사용. 20~30명 규모, 손으로 돌려도 된다. 통계적 유의성보다 **effect size + 정성 인터뷰**를 본다.

부가 측정: 전이 효과 — Claro로 A를 읽은 사람이 **일반 기사로 된 B**를 더 잘 이해하는가. 이것이 "쓸수록 뉴스가 읽힌다"는 주장의 직접 증거다.

`완독`은 정의를 과하게 붙이지 않고 **terminal content block 도달**로 둔다. 별도로 active interaction, time-to-terminal, cards skipped를 저장한다.

### Phase 2 — Adaptive는 shadow로

Bayesian 모델이 production rendering에 영향을 주지 않은 채 매 interaction마다 예측만 남긴다.

**Shadow가 검증하는 것과 못 하는 것을 구분한다.**

- 검증함: 상태 추정 모델이 정확한가 (Brier / calibration)
- 검증 못 함: 그 상태로 개인화하면 이해도가 올라가는가 (반사실이라 관측 불가)

Shadow는 A/B의 **전제조건이지 대체재가 아니다.**

A/B 전에 값싸게 먼저 볼 수 있는 지표가 있다. **Weighted Policy Divergence** — 두 정책이 실제로 얼마나 다르게 행동하는가. criticality 등급으로 가중하고(BLOCKING 3 / SUPPORTING 2 / ENRICHING 1), 결정 거리도 가중한다(SKIP↔FULL 2 / 나머지 1). 특히 **기사 중 최소 하나의 BLOCKING KC에서 정책이 갈리는 비율**을 본다. 이것이 3%면 A/B를 돌릴 이유가 거의 없다.

### Phase 3 — A/B

비교 대상의 차이가 **Personalization Planner 하나뿐**이어야 한다.

```
Control:   calibration 결과로 자동 배정한 3단계
Treatment: KC 단위 adaptive
```

Control을 자기선택으로 두면 self-selection 효과와 granularity 효과가 섞인다. 자기선택 자체가 궁금하면 3-arm으로 본다.

동일 ArticlePackage / 동일 Fact Layer / 동일 Common Goal probe. Depth는 고정하고 Scaffolding만 비교한다.

측정: Comprehension / Calibration / Redundancy / Missing support.

분석 단위는 사용자가 아니라 probe 응답으로 잡되, 한 사용자의 응답들은 독립이 아니므로 mixed-effects 구조를 전제한다.

---

## 14. 제품 결정

- **하루 발행 개수를 고정하지 않는다.** 7개를 약속하면 품질 낮은 뉴스를 채워 넣게 된다. 1차 자료 커버리지에 따라 3개인 날도 있고 8개인 날도 있다. "적게 보여준다"는 숫자를 맞추는 것이 아니다.
- **자유 질문은 열린 인터넷으로 보내지 않는다.** Article Fact Layer / 관련 Concept Atom / Storyline context만 컨텍스트로 준다. 답변은 source-grounded.
- **자유 질문에는 semantic answer cache를 둔다.** 같은 기사에서 사람들은 비슷한 질문을 한다.
- **Concept Library는 매일 재생성하지 않는다.** 기존 개념은 재사용하고 새 개념만 생성·검증·삽입한다. 오래 운영할수록 기사당 생성 비용이 내려간다.
- **Storyline도 매번 재생성하지 않는다.** 오늘 발생한 노드만 추가한다. 시간이 지나면 자체적인 뉴스 세계관 DB가 자산이 된다.

---

## 15. 의도적으로 확정하지 않은 것

기준은 하나다.

> **지금 확정해야 하는 것은 나중에 바꾸기 어려운 것뿐이다.
> 로그에서 재계산 가능한 것은 지금 확정하지 않는다.**

`knowledge_evidence`가 immutable log이므로 아래는 전부 나중에 replay로 재계산할 수 있다.

| 항목 | 상태 |
|---|---|
| Beta 분포 / learner state 수식 | 보류 |
| KC별 모집단 prior 및 concentration | 보류 |
| forgetting half-life | 보류 |
| Graph propagation 사용 여부와 강도 | 보류 |
| Explanation Need 공식 | 보류 |
| SKIP / REFRESHER / FULL threshold | 보류 |
| evidence weight 값 | 보류 |
| Adaptive planner | Phase 2 |
| A/B | shadow 통과 후 |

참고로 검토 과정에서 확인된 것들:

- `Criticality × Gap × Uncertainty`는 방향이 뒤집힌다. "모른다는 것을 확신하는" 경우의 설명 필요도를 깎는다. 대신 posterior의 보수적 lower quantile을 쓰면 튜닝 포인트가 하나로 줄어든다.
- 모집단 prior를 pseudo-count까지 크게 잡으면 "전체 사용자에 대해 잘 안다"를 "이 개인에 대해 잘 안다"로 잘못 변환한다. base rate는 prior mean으로만 쓰고 concentration은 작게 유지한다.
- Graph propagation은 사용자 상태에 영구 기록하지 않고 **runtime inference**로 계산한다. 허브 노드 오염이 원천적으로 사라지고 A/B 토글도 공짜가 된다. 상관된 이웃 증거는 합산하지 않고 **max pooling**으로 시작한다. graph support는 confidence를 올리지 않는다.

이 셋은 방향만 기록해두고 Phase 2에서 실제 데이터로 결정한다.

---

## 16. 지금 열려 있는 가장 중요한 질문

기술적 미해결 항목이 아니라 **제품의 본질에 대한 것**이다.

지금까지 여러 라운드에 걸쳐 다듬은 것은 거의 전부 "틀리지 않는 Claro"였다. 정확성에는 검증 절차(원문 대조, coverage, counterevidence)가 있어서 계속 굴러갔지만, **가독성과 흐름에는 검증 절차가 없어서 한 번도 반복되지 않았다.**

초기 설계에 있던 비유와 호기심 유도 구조가 실제 시제품에서 조용히 사라진 것이 그 증거다.

따라서 다음 라운드의 목표는 스키마가 아니다.

> **동일한 Fact Set, 동일한 Common Goal로 서사 방식만 다른 글 세 편을 쓰고, 어느 것이 가장 읽히는지 본다.**
>
> A. 질문 연쇄형 — 독자 머릿속 질문을 따라간다
> B. 반전 중심형 — 숨은 맥락으로 예상을 뒤집는다
> C. 인물 중심형 — 사람으로 진입해 구조로 확장한다

평가는 comprehension이 아니라 흐름을 본다. 어디서 멈추고 싶었는지 / 가장 기억나는 부분 / 다시 읽은 문장 / 다음 문장이 궁금해진 순간 / 없어도 될 것 같았던 부분. 설문보다 옆에서 관찰하는 것이 낫다. 읽고 30분 뒤에 "무슨 일이었는지 말해봐"를 시켜보면, 재현된 이야기 구조가 글의 구조를 따라가는지로 흐름의 성공을 판단할 수 있다.

세 글에서 Fact가 동일하기 때문에, 이 실험이 측정하는 것은 순수하게 글쓰기다.

앞으로 무엇을 추가하든 이 질문을 붙인다.

> **이것이 독자가 글을 더 술술 읽게 만드는가, 아니면 우리가 틀리지 않게만 만드는가?**

둘 다 필요하지만 예산은 유한하다.
