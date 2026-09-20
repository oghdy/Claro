> ⚠️ **이 문서는 명세가 아니다.**
> 손으로 3건 만들어보고 "여기까지 알아낸 것"을 정리한 현황 문서다.
> 안에 있는 "미정 / 결정 필요 / 미검증"은 빈칸이 아니라 **의도적 보류**다. 채우지 마라.
> 구현이 따라야 할 규격은 `/docs/contract/` 이며, 이 문서는 그것을 쓰기 위한 입력 자료다.

# Claro — 마스터 문서

> **작성일**: 2026-09-19
> **용도**: Claude Code 인수인계. 이 문서만 읽고 작업을 시작할 수 있도록 작성됨
> **현 단계**: 수동 프로토타이핑 3건 완료 → 자동화 착수 직전
> **코드**: 아직 한 줄도 없음

---

# 0. 이 문서를 읽는 법

세 종류의 정보가 섞여 있다. 표시를 구분해서 읽을 것.

| 표시 | 의미 |
|---|---|
| **확정** | 실제 제작 2~3회로 검증됨. 바꾸려면 근거 필요 |
| **미정** | 의도적으로 안 정함. 데이터 없이 정하면 틀림 |
| **결정 필요** | 사람(도윤)의 판단이 있어야 진행 가능 |

**가장 중요한 원칙 하나:**

> **지금 확정해야 하는 것은 나중에 바꾸기 어려운 것뿐이다.
> 로그에서 재계산 가능한 것은 지금 확정하지 않는다.**

이 문서에 "미정"이 많은 것은 미완성이 아니라 설계 방침이다.

---

# 1. 서비스 정의

## 1.1 본질

Claro는 요약 서비스가 아니다. 뉴스를 짧게 만드는 게 아니라 **뉴스와 독자 사이의 지식 거리를 없애는 것**이 목표다.

내부 원칙:

> **충분히 깊게 조사하고, 필요한 것만 남긴 뒤,
> 읽다 보면 사건의 그림이 저절로 머릿속에 그려지도록 쓴다.**

세 부분 모두가 요건이다. 그리고 우선순위는 이 순서다.

1. **읽으면 저절로 이해되는가** — 본질
2. **그 이해가 나중에 철거되지 않는가** — 본질의 지속 조건
3. **틀리지 않는가** — 필요조건이지 목적이 아님

⚠️ 설계 논의는 구조적으로 3번으로 쏠린다. 정확성에는 검증 절차가 있지만 가독성에는 없기 때문이다. 무언가를 추가할 때마다 물을 것:

> **이게 독자가 글을 더 술술 읽게 만드는가, 아니면 우리가 틀리지 않게만 만드는가?**

## 1.2 정확성 vs 재미는 대립이 아니다

실제 제작에서 확인된 바로, **깊은 팩트가 좋은 서사의 재료**였다. 9월 FOMC 기사의 반전("이미 갈려 있었다")은 6월 SEP을 찾아냈기 때문에 생겼다. 얕게 팠으면 반전이 없었다.

대신 진짜 경계선은 여기다.

| 단순화 유형 | 판정 |
|---|---|
| **확장 가능** — 나중에 더 배우면 그 위에 쌓인다 | 문제없음 |
| **철거 필요** — 나중에 "그거 틀린 거였네"가 된다 | 금지 |

판별 질문: **나중에 더 배웠을 때, 지금 배운 걸 버려야 하나?**

이건 윤리 규칙이 아니라 제품 요구사항이다. "쓸수록 뉴스가 읽힌다"가 성립하려면 설명이 누적돼야 하고, 철거형 단순화는 누적을 파괴한다.

---

# 2. 지금까지의 산출물

| 파일 | 내용 |
|---|---|
| `claro-technical-overview.md` | 초기 기술 개요 (일부 내용은 이 문서로 대체됨) |
| `fomc-2026-09-brief.md` | FOMC 9월 — Fact Graph, Coverage, Goal, Fact 배분 |
| `fomc-2026-09-core-drafts.md` | FOMC Core 3종(A/B/C) + 팩트체크 + 레드팀 |
| `ftc-personalized-pricing-brief.md` | FTC 개인화 가격 — B형 전체 제작 결과 |
| `screwworm-c-type-brief.md` | 스크루웜 — C형 전체 제작 결과 |
| `claro-concept-library.md` | **Concept Atom 10개. 계속 갱신할 것** |
| `claro-ftc-slides.html` | 슬라이드 UI 프로토타입 (7장) |
| `claro-fomc-slides.html` | 슬라이드 UI 프로토타입 (입문 8장 / 숙련 5장 전환) |

**제작 완료 사건 3건**: FOMC(2026-09-16), FTC 개인화 가격(2026-08-19), 미국 스크루웜(진행 중)

---

# 3. 아키텍처 — **확정**

## 3.1 두 파이프라인 분리

```
A. ARTICLE COMPILATION PIPELINE
   사건마다 하루 한 번 / 비싸고 느려도 됨 / 모든 사용자 공통
              ↓
        Article Package
              ↓
B. PERSONALIZATION PIPELINE
   사용자가 기사를 열 때 / 매우 빨라야 함 / 사용자마다 다름
```

**비용 구조가 이 분리의 핵심이다.** A는 사용자 수와 무관한 고정비다. B에서 사용자 요청마다 LLM을 부르면 비용이 사용자 수에 선형으로 붙는다.

목표: **기본 읽기 경로에서 사용자당 LLM 호출 0.**
단, "사용자 생애 0"은 아니다. 자유 질문 같은 탈출구는 필요하며, **일일 상한을 제품 스펙에 처음부터 넣는다.**

⚠️ 단 초기 비용 추정(월 $30~90)은 **폐기**. 파이프라인이 9단계에서 대폭 늘어나면서 기사당 토큰이 10~20배가 됐다. 실제 소스 팩으로 재측정 필요. (§12 결정 필요 항목)

## 3.2 DAG, 에이전트 회의 아님

각 단계는 지정된 JSON만 입력받고 JSON만 출력한다. 실패하면 해당 단계만 재실행. LLM이 이전 결과를 임의로 고칠 수 없게 한다.

## 3.3 절대 원칙

> **Personalization changes scaffolding, not truth.**

단, 초기 해석은 틀렸다. 정확히는:

> **모든 사용자는 동일한 Fact Graph를 공유한다.
> 어떤 사실을 전면에 보여줄지는 달라질 수 있다.**

이 수정이 없으면 숙련자 뷰가 구조적으로 초보자 뷰의 부분집합이 되어 절대 더 풍부해질 수 없다.

```
Beginner = fewer facts  + more scaffolding
Advanced = more facts   + less scaffolding
```

---

# 4. 콘텐츠 모델 — **확정**

## 4.1 두 레이어

### Evidence Layer (규격화한다)

- **Fact Atom** — 실제로 일어난 일. 출처와 원문 위치를 물고 있다
- **Concept Atom** — 개념 설명. 전역, 재사용, 버전 관리
- **Bridge Atom** — 연결
  - `CONCEPT_BRIDGE` — 개념 → 오늘 사건
  - `STORY_BRIDGE` — 이전 사건 → 오늘 사건
- **Derived Claim** — 사실들로부터 도출한 해석. Fact가 아니다

### Writing Layer (규격화하지 않는다)

질문, 비유, 리듬, 공감, 긴장, 순서, 문체.
**새로운 사실을 만들 수 없다.** 그 외에는 자유.

## 4.2 Atom은 글이 아니다

```
Atom    = 작가에게 주는 재료
Article = 그 재료로 새로 쓴 하나의 글
```

블록을 순서대로 이어붙이면 정확한 설명 자료는 되지만 읽고 싶은 글은 되지 않는다.

**→ 최종 글은 LLM이 한 번에 쓴다.** 좋은 문장은 앞 문장이 뒷 문장의 리듬을 결정하므로 문단별 독립 생성으로는 만들 수 없다. Writer에게 주는 제약:
- 주어진 사실 밖의 사건 정보 추가 금지
- Common Goal에 반드시 도달
- 지정된 defensive fact는 의미가 드러나야 함
- 독자는 뉴스 초보
- 사전처럼 쓰지 말고 하나의 이야기처럼

## 4.3 Concept Atom 규율

**시간에 독립적**이어야 한다. 현재 국면에 대한 가정이 들어가면 그건 Bridge다.

| | |
|---|---|
| ❌ | "지금 연준은 물가가 높아서 금리를 내리지 않고 있다" |
| ❌ 헤더 | "왜 연준은 금리를 안 내릴까?" |
| ✅ | "금리가 오르면 차입 비용이 올라 소비를 억제한다" |
| ✅ 헤더 | "금리는 경제에 어떻게 영향을 줄까?" |

프레이밍 질문은 전부 Bridge의 몫.

**버전 관리**: 설명은 개선된다. `version`을 올리고 Article Package는 발행 당시 버전을 pin. `concept_id`는 절대 변경하지 않는다.

## 4.4 비유 규율

- **비유는 독자가 경험할 수 없는 것에만 쓴다.** 통화정책 전달경로는 경험 불가 → 비유 필요. "회의에서 투표했다"는 누구나 앎 → 비유가 방해
- **비유에는 한계선을 함께 저장한다.** 비유는 반드시 어딘가에서 깨진다. 그 지점이 곧 **다음 단계(중급) 콘텐츠**가 된다
- **개념을 먼저 설명하고 비유를 붙인다.** 비유로 개념을 대신하지 않는다

## 4.5 한 문장에 개념 하나 — 압축 금지

**2026-09-18 실제 독자 검증에서 발견.** 사실이 전부 맞아도 연결이 생략되면 읽히지 않는다. 정확성 검증은 이 문제를 못 잡는다. 이미 아는 사람 눈에는 압축된 문장이 압축돼 보이지 않기 때문이다.

- 한 문장에 새 개념은 하나만
- 추상 개념 앞에 구체적 예를 먼저
- 한 단계를 건너뛰고도 말이 되면, 그 단계는 독자에게만 없는 것

**실제 사례**: "연준이 보는 숫자는 1년에 몇 퍼센트씩 오르고 있는가입니다. 원하는 속도는 시속 2, 지금은 3%대입니다." → 두 문장에 (수준/속도 구분 + 자동차 비유 + 목표/현재 비교) 세 개가 겹쳐 있어 이해되지 않음. 4단계로 풀자 바로 이해됨. 수정본은 `claro-concept-library.md` C-0002 참조.

---

# 5. 사실과 출처 — **확정**

## 5.1 Primary-source-first

- **1차 자료** → Fact Layer 구축
- **뉴스 매체** → 오늘 무엇이 중요한지 발견하는 discovery / ranking 신호

취재 기반 특종은 MVP에서 다루지 않는다.

⚠️ **"1차 자료를 쓰면 저작권 문제가 사라진다"는 사실이 아니다.** 미국 연방정부 저작물은 원칙적으로 보호되지 않지만 지역 연은·국제기구는 자체 저작권을 주장한다.

```
source_registry
  source / access_method / can_ingest / can_store / can_quote
  can_transform / commercial_use / attribution_required
  terms_url / last_reviewed_at
```

## 5.2 Primary source ≠ neutral source

공식 발표를 사실로 옮겨 적으면 안 된다.

```
OFFICIAL_ACTION       실제로 취해진 조치
OFFICIAL_CLAIM        기관이 주장한 것
OFFICIAL_LIMIT        기관이 자기 권한 한계를 밝힌 것
MEASUREMENT           측정된 수치
COURT_RULING
COMPANY_DISCLOSURE
INDEPENDENT_OBSERVATION
```

백악관이 "우리 정책으로 물가가 안정됐다"고 하면 Fact는 `물가가 안정됐다`가 아니라 `백악관이 그렇게 주장했다`.

## 5.3 Fact ↔ Source는 N:M

**2026-09-18에 발견된 오류.** 사실의 공개 시점을 "우리가 읽은 문서의 공개일"로 잡으면 안 된다. 7월 회의록(8/19 공개)에 기록된 7월 29일 당시 시장 가격은 7월 29일에 공개적으로 알 수 있던 정보다.

```
event_at                  사건이 일어난 시점
source.published_at       그 문서가 공개된 시점
first_verified_public_at  확보한 공개 출처 중 가장 이른 시점
ingested_at               우리가 수집한 시점
```

단 **publicly knowable**과 **Claro가 검증 가능한 출처를 확보함**은 다르다. 후자가 없으면 그 시점 기사에 쓸 수 없다.

## 5.4 volatility 필드 — **신규 (C형에서 발견)**

```
volatility: STABLE | VOLATILE
```

FOMC의 "3.75~4.00%"는 다음 회의까지 안 변한다. 스크루웜의 "48건"은 내일 변한다.

VOLATILE한 fact는 (a) 기준 시각을 명시하거나 (b) 기사의 뼈대로 쓰지 않는다.

## 5.5 원문 대조는 필수

LLM 추출 결과만 저장하면 안 된다. `source_document` 자체를 보관하고 모든 Fact가 원문 위치를 물고 있어야 한다.

```
fact_claim
  claim_text / fact_type / volatility
  source_id / source_section / source_span_start / source_span_end
  extraction_model / extraction_version
```

검증은 혼합:
- **Deterministic** — 숫자·날짜·비율의 원문 리터럴 일치 (코드)
- **Semantic entailment** — 저렴한 모델 1차, 애매한 것만 상위 모델

⚠️ **entailment 검사는 누락과 조합으로 인한 왜곡을 잡지 못한다.** 실제로 우리가 낸 오류 중 이 검사에 걸린 것은 0건이다. 별도 QA 필요.

---

# 6. 사건 유형 — **확정 (2축)**

## 6.1 초기 A/B/C 분류는 축을 잘못 잡았다

3건 제작 후 두 축으로 분리해야 함이 확인됐다.

### 축 1 · 서사 구조

| 축 | 이야기의 원천 | 사례 |
|---|---|---|
| **시간축 (델타)** | 지난번 대비 무엇이 달라졌나 | FOMC |
| **경계축 (범위)** | 무엇이 해당하고 무엇이 아닌가 | FTC 규제 |
| **상태축 (지속)** | 지금 어디까지 왔고 막을 수 있나 | 스크루웜 |

**상태축에서는 현재 수치가 이야기가 아니다.** 수치는 매일 변하고 곧 낡는다. 이야기는 **제약 조건**에서 나온다.

**경계축에서는 "무엇이 금지되나"보다 "무엇이 금지되지 않나"가 더 중요한 슬롯이다.** 규제 뉴스의 최대 오독은 거의 항상 적용 범위를 넓게 읽는 것이다.

**상태축·경계축은 델타가 없어도 서사가 성립한다.**

### 축 2 · 자료 가용성

```
공적 기관 관여 있음  →  1차 자료 풍부. Claro가 다룰 수 있음
공적 기관 관여 없음  →  1차 자료 빈약. ⚠️ 미검증 영역
```

**"C형은 1차 자료가 약할 것"이라는 가설은 틀렸다.** 스크루웜은 정부 대응 사건이라 USDA·CDC·주정부 자료가 FOMC보다 풍부했다.

진짜 위험한 건 **공적 기관이 관여하지 않는 사건**이다. **아직 한 번도 해보지 않았다.** (§12 미검증 항목)

## 6.2 Coverage Schema는 유형마다 새로 만들어야 한다

3건 모두 **0% 재사용.** 매번 처음부터 슬롯 15개 안팎을 설계했다.

> **사건 유형 확장의 병목은 팩트 추출이 아니라 스키마 설계다.**

### 상태 코드 — **확정**

```
FOUND
NOT_EXTRACTED        자료는 있는데 우리가 못 뽑음   ← 파이프라인 실패
SOURCE_UNAVAILABLE   필요한 자료 자체를 확보 못 함   ← 콘텐츠 결손
NOT_APPLICABLE
STORYLINE_STALE      참조하는 진행 중 사건의 현재 상태를 확인 안 함
```

두 번째와 세 번째를 뭉뚱그리면 진짜 결손과 작업 누락이 구분되지 않는다.

### Unslotted Notable — **확정**

Coverage Schema는 **놓치지 않기 위한 체크리스트**다. 예상 못 한 것은 슬롯이 없어 감지되지 않는다. 소스 팩 검토 마지막에 반드시 열린 질문을 던진다.

> 이 Source Pack 안에, 기존 슬롯 어디에도 들어가지 않지만 이전과 달라졌거나 이례적인 사실이 있는가?

**실제 사례**: 7월 FOMC 회의록에 의장이 연 8회 회의를 6회로 줄이자고 제안한 내용이 있었으나 슬롯이 없어 놓쳤다.

### 현재 보유 스키마

| 유형 | 슬롯 수 | 상태 |
|---|---|---|
| 통화정책형 | 15 | 작성 완료 |
| 규제 정책형 | 15 | 작성 완료 |
| 진행 중 상황형 | 14 | 작성 완료 |

**Coverage Schema는 스코프 도구이기도 하다. 스키마가 있는 유형만 파이프라인을 태운다.**

---

# 7. 파이프라인 — 스테이지별 상태

| # | 스테이지 | 상태 | 비고 |
|---|---|---|---|
| 0 | **사건 선정** | ❌ **공백** | 3회 모두 사람이 선택. 로직 0회 |
| 1 | Source Pack 구성 | ✅ 확정 | 유형별로 다름 |
| 2 | Claim 추출 + span | ⚠️ 스키마만 | 자동 추출 미검증 |
| 3 | Deep Fact Graph | ✅ 확정 | 수집과 선택 분리 |
| 4 | Coverage Schema 점검 | ✅ 확정 | 유형마다 신규 작성 필요 |
| 5 | Storyline 상태 확인 | ✅ 확정 | 이란 건에서 발견 |
| 6 | Derived Claim + 반증 | ✅ 확정 | |
| 7 | Comprehension Goal + 검증 | ✅ 확정 | |
| 8 | KC 역산 | ✅ 확정 | Goal에서 역산. Fact에서 뽑으면 실패 |
| 9 | Fact 선택 (Core/Deep) | ✅ 확정 | 지지적/방어적 |
| 10 | 서사 형식 결정 | ⚠️ 규칙만 | 미검증 |
| 11 | 집필 | ⚠️ 수동만 | LLM 원샷 0회 |
| 12 | 레드팀 | ✅ 확정 | 3회 중 3회 오류 검출 |
| 13 | 블록 분할 + open_question | ⚠️ 2회 | 사람에게 미검증 |
| 14 | 렌더링 | ⚠️ 프로토타입 | 형식 합의, 디테일 남음 |

## 7.1 수집과 선택을 분리한다 — **확정**

초기 설계 최대 오류. Fact Layer라는 이름 아래 두 가지가 섞여 있었다.

```
Primary Sources → Source Documents → Claim Extraction + span 검증
        ↓
DEEP FACT GRAPH          ← 사실을 충분히 모은다 (사건당 20~30개 이상)
        ↓
Coverage Schema 점검 + Unslotted 탐색
        ↓
Storyline 상태 확인
        ↓
Derived Claim + Counterevidence Search
        ↓
COMPREHENSION GOAL (+ Goal 자체의 반증 검사)
        ↓
KC 역산 → Criticality
        ↓
Fact 선택 (지지적 / 방어적)
        ↓
집필 (LLM 원샷)
        ↓
레드팀 → 블록 분할 → 렌더링
```

`Fact Atom`은 원자료 추출의 결과물이 아니라 **Deep Fact Graph에서 이 뷰에 쓰려고 선택된 표현 단위**다.

## 7.2 Counterevidence Search는 재수집을 트리거해야 한다 — **확정**

자기 그래프만 뒤지면 이미 수집한 반증만 찾는다. 실제로 6월 SEP은 그래프에 없었고, 검색해서 찾았기 때문에 들어왔다.

```
Claim: "분열이 이번 회의에서 시작됐다"
→ 이 주장을 반증할 수 있는 슬롯은? (직전 정책 전망, 과거 반대표 이력)
→ 슬롯 상태 확인 → EMPTY
→ 수집 → 반증 확보 → claim 수정
```

**Coverage Schema와 Counterevidence Search를 연결해야 한다.**

## 7.3 Comprehension Goal — **확정**

- **Common Goal** — 모든 뷰가 반드시 도달해야 하는 **한 문장**. POST probe와 A/B 비교 지표는 여기서만 나온다
- **Deep Goal** — 심화 뷰의 보조 목표. 품질 관리용, 비교 지표 아님

**Goal 자체가 counterevidence QA를 통과해야 한다.** 잘못된 Goal로 시작하면 이후 모든 블록이 그 왜곡을 물고 간다.

**C형 특이사항**: 상태축 사건은 트리거가 없어서 **"왜 오늘 읽어야 하는가"를 편집자가 만들어야 한다.** Stage 0과 Stage 7이 붙는다.

## 7.4 KC는 Goal에서 역산한다 — **확정**

**FOMC 1차에서 이 순서를 어겨 BLOCKING 개념 두 개를 빠뜨렸다.** Fact를 보고 익숙한 개념부터 뽑았고, 정작 Goal에 필요한 제도 개념(SEP_ROLE, VOTERS_VS_PARTICIPANTS)을 놓쳤다.

검사 방법:
> Goal 문장의 각 명사를 초보자가 이해하는가?
> Goal 안에서 비교되는 두 대상의 차이를 이해하는가?

## 7.5 Criticality는 범주 — **확정**

`0.83` 같은 값은 가짜 정밀도다.

```
BLOCKING     모르면 핵심 사건 자체를 이해할 수 없다
SUPPORTING   핵심은 이해되지만 왜 중요한지 이해하기 어렵다
ENRICHING    알면 좋지만 없어도 지장 없다
```

**Criticality는 Comprehension Goal에 상대적이다.** 기사 전체의 고정값이 아니다.

## 7.6 Fact 선택 — 두 종류 — **확정**

### Supportive Include
Goal이나 Derived Claim을 뒷받침한다. `supporting_fact_ids`를 따라가면 되므로 기계적 판단 가능.

### Defensive Include
없어도 문장은 성립하지만 **빼면 독자가 자연스럽게 틀린 결론을 내린다.**

**방향이 두 개다 (C형에서 발견):**

| 방향 | 사례 |
|---|---|
| 과대 인식 방어 | "물가가 급등해서 올렸다" / "사람이 위험하다" |
| **과소 인식 방어** | "48건이면 별거 아니네" ← 방어를 한쪽으로만 쌓으면 반대 왜곡 발생 |

**검사 방법 (편집 red-team):**
> 초고를 쓴 뒤, 원자료를 안 봤다고 가정하고 글만 읽는다.
> 이 글만 읽으면 어떤 결론을 내릴까? 3~5개 적는다.
> 각각을 Deep Fact Graph와 대조한다. 충돌하면 defensive include다.

⚠️ 기존 Counterevidence Search는 Derived Claim에만 돈다. 방어적 누락은 **선택 결과 전체에 대해** 돌려야 발견된다.

## 7.7 편집 규칙 — **확정**

> 없애도 이야기의 의미가 그대로인 정보는 버린다.
> 없애는 순간 독자가 사건을 잘못 이해하게 되는 정보는 남긴다.

**설명이 필요한 숫자를 넣기 전에, 설명이 필요 없는 숫자로 같은 말을 할 수 있는지 먼저 본다.**
→ FOMC 2차에서 점도표 인원수(16/18) 대신 중앙값 비교(올해 말 = 내년 말)를 썼고, 요점이 더 잘 전달됐다. 동시에 `VOTERS_VS_PARTICIPANTS` 개념 설명이 불필요해졌다.

**Knowledge granularity ≠ Presentation granularity.** KC는 잘게 유지하되 UI는 여러 KC를 묶어 하나의 자연스러운 설명 블록으로 보여준다.

## 7.8 QA — **확정**

| QA | 질문 |
|---|---|
| **Source Fidelity** | 이 Fact가 실제 원문에 있는가 |
| **Coverage** | Goal 설명에 중요한 슬롯이 비어 있는가 |
| **Counterevidence** | 이 Derived Claim을 약화하는 사실이 있는가 (재수집 트리거 포함) |
| **Frame Consistency** | 현재 국면과 맞지 않는 프레임을 쓰고 있는가 |
| **Goal Sufficiency** | 선택된 블록만 읽고 Common Goal에 도달할 수 있는가 |
| **Requirement Consistency** | 같은 기사를 여러 번 분석했을 때 결과가 안정적인가 |
| **Flow** | 마지막을 제외한 모든 블록에 open_question이 있고, 모두 이후에 해소되는가 |

핵심 확장:
> **"사실은 맞는데 잘못된 이야기를 만들었나?"**

⚠️ **아직 못 잡는 것**: 비유가 만드는 그림. 비유는 사실 문장이 아니라 entailment·span 검사에 안 걸리는데 독자 머릿속 그림은 바꾼다. 현재 유일한 방어는 Concept Library의 `비유 한계선` 필드.

---

# 8. UI / UX — **확정된 부분**

## 8.1 기사 = 하나의 모험

한 페이지 스크롤이 아니라 **슬라이드 단위**. 세로 스크롤 스냅 + 상단 세그먼트 진행바 + 장수 표시(`3/7`).

## 8.2 넘기는 장치는 미해결 질문 하나뿐

각 슬라이드 끝에 **답이 안 난 질문이 정확히 하나** 남는다. 그게 다음 슬라이드로 넘기는 힘이며, 자극적 후킹이 아니라 이해의 자연스러운 다음 단계다.

```
각 블록:
  content
  open_question     이 블록을 읽고 나면 남는 질문
  resolves          이 블록이 답하는 이전 질문
```

**QA**: 마지막 블록 제외 모든 블록에 open_question이 있는가 / 모든 open_question이 이후에 resolves 되는가.
open_question이 없는 블록은 **넘길 이유가 없는 블록**이므로 앞뒤와 합친다.

**중간에 긴장을 한 번 푼다.** 계속 조이면 피로해진다. (FTC 5장 "우버 할증은 아니에요")

## 8.3 개인화가 UI 구조로 나타난다

슬라이드가 블록이면 **개인화가 슬라이드 개수로 보인다.**

```
입문:  8장  (개념 설명 슬라이드 포함)
숙련:  5장  (개념 빠지고, 대신 사실이 늘어남)
```

프로토타입에서 실제로 작동 확인됨. 숙련 뷰는 입문의 부분집합이 아니라 **다른 사실 집합**이었다.

**부수 효과**: 완독 정의가 깔끔해진다. "몇 장에서 이탈했는가"가 공짜로 나온다.

## 8.4 소스 레이어를 시각적으로 구분

"AI가 작성했습니다" 배지보다 강한 표기가 가능하다. Fact Layer가 source span을 물고 있으므로 **문장 단위로** "이건 원문 / 이건 우리 해석"을 표시할 수 있다. 프로토타입에서 원문 인용 태그, 연방/주 구분 pill로 시연.

## 8.5 아직 안 정한 것

- 시각 요소 크기 (현재 프로토타입은 "더 큼지막하게" 필요)
- 라이트/다크 톤 중 기본값
- 프로브를 슬라이드에 어떻게 자연스럽게 넣을지
- 스토리라인("지난 이야기") 블록의 접힘 처리

---

# 9. 개인화 — **확정 / 보류**

## 9.1 세 축

| 축 | 질문 | 결정 방식 |
|---|---|---|
| **Time** | 이 시점까지 무엇이 알려져 있는가 | 소스 가용성 |
| **Depth** | 그중 몇 개의 사실을 보여줄 것인가 | **사용자 선언** (추정 불필요) |
| **Scaffolding** | 사실 사이를 얼마나 설명할 것인가 | 추정 대상 |

**Depth와 Scaffolding은 직교한다.** 시장 프라이싱을 보여줄지는 "이 사람이 그 개념을 아는가"로 정해지지 않는다. 오히려 아는 사람일수록 보고 싶어 한다.

→ **Depth는 명시적 컨트롤, 추정 모델은 Scaffolding만 담당.**

## 9.2 Article Package는 immutable, Storyline은 versioned mutable

```
발행 시점:  ArticlePackage v1 (storyline_snapshot = S_v5)  ← 변하지 않음
3주 뒤:     Storyline → S_v6
```

늦게 도착한 사실은 원 기사를 고치지 않고 Storyline에 붙인다. 옛 기사를 다시 열면 "이후 새로 확인된 내용"을 별도로 보여줄 수 있다.

**Storyline은 참조 배열이 아니라 자체 사실을 갖는 first-class object.**

⚠️ 서로 다른 갱신 주기를 가진 storyline이 한 기사에서 만난다. FOMC 스토리라인은 7주마다, 이란 전쟁 스토리라인은 며칠마다 움직인다.

## 9.3 MVP 개인화 — **확정: 3단계 정적 레벨**

사용자가 직접 선택하는 입문/중급/숙련. Bayesian 모델 없음.

## 9.4 관찰 인프라 — **Day 1부터 정확히 남긴다**

모델은 나중에 replay로 재계산할 수 있지만 **기록하지 않은 관찰은 복구 불가.**

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

reading_plan_log
  plan_id / user_id / article_id / article_version / created_at
  level / estimator_version
  selected_blocks[] / skipped_blocks[]
  block_decisions[]      concept_id → SKIP|REFRESHER|FULL + reason
  narrative_form         ← 서사 형식도 기록
  probe_plan[]
```

`PRE_PROBE_CORRECT → +2.0` 같은 해석은 learner-model version이 담당한다. 그래야 가중치를 나중에 바꿀 수 있다.

`user_concept_state`는 **cache/projection**. 언제든 날리고 재계산 가능. decay를 컬럼에 파괴적으로 적용하지 않는다.

### Probe 유형 — **확정**

| 유형 | 목적 |
|---|---|
| `DIAGNOSTIC` | 초기 선행지식 측정 |
| `ACTIVE` | information gain 최대화 |
| `AUDIT` | 무작위·층화 sampling, calibration 검증용 |
| `COMPREHENSION` | 설명 이후 이해 확인 |

**AUDIT 슬롯이 반드시 있어야 한다.** ACTIVE만 돌리면 모델이 애매해하는 지점만 물어 calibration 측정이 편향된다.

- 설명 **전** probe → 선행지식 증거
- 설명 **후** probe → 습득 증거 (짧은 half-life) + 설명 품질 평가 입력
- 며칠 뒤 재정답 → 장기 지식으로 승격
- **무응답은 증거가 아니다.** 설명 미펼침도 MVP에서는 0 evidence

**Probe 예산은 기사당이 아니라 세션 단위.** 기사 6개에 3개씩이면 하루 18문제가 되어 퀴즈 앱이 된다.

## 9.5 Concept Identity — **확정**

되돌리기 가장 어려운 부분. 여기가 무너지면 **에러 없이 조용히** 데이터가 썩는다.

### Topic과 KC 분리

```
Federal Reserve          ← TOPIC. evidence 기록 금지
├─ FED_ROLE              ← LEAF KC
├─ FOMC_ROLE             ← LEAF KC
└─ FED_FUNDS_RATE_ROLE   ← LEAF KC
```

> **Evidence는 leaf KC에만 기록한다.** UI의 "알고 있어요" 버튼도 leaf proposition 단위로 받는다.

### Merge-friendly, Split-hostile

merge는 evidence remap으로 되돌릴 수 있으나 **split은 불가능하다.** 자기보고 evidence를 여러 자식 중 어디로 보낼지 결정할 방법이 없다.

> **애매하면 무조건 잘게 자른다.**

### 스키마

```
concept
  concept_id (UUID) / canonical_name / concept_type
  status: CANONICAL | PROVISIONAL | MERGED | DEPRECATED
  merged_into / version / domain

concept_alias
  alias / language / concept_id / source

conflicting_alias                    ← 신규 (FTC에서 발견)
  alias / concept_id / conflicts_with_meaning

concept_relation
  from_id / to_id / relation_type / strength
  source / generator_model / validation_status

concept_candidate
  candidate_text / embedding / candidate_context
  suggested_concept_id / match_score / status
```

**`conflicting_alias`가 필요한 이유**: `dynamic pricing`이 두 정반대 의미로 쓰인다. 일반 용례는 수급 기반 변동(우버 할증), 메릴랜드 법은 개인화 가격. 현재 alias 구조는 "같은 것의 다른 이름"만 표현하고 **"다른 것의 같은 이름"을 표현하지 못한다.**

### Resolver

```
확실한 매칭    → LINK
애매함        → PROVISIONAL KC 생성 + FLAG   ← 파이프라인을 막지 않는다
명백히 새로움  → CREATE
```

1인 개발에서 리뷰 큐가 파이프라인을 막으면 운영 불가능하다. merge가 안전하게 설계돼 있으므로 차단할 이유가 없다.

임계값은 **미정**. embedding 모델마다 분포가 다르므로 `HIGH / AMBIGUOUS / LOW` 구간만 두고 실제 값은 validation set으로 정한다. 유사도 하나만 보지 않고 **label + definition + graph neighborhood + article usage context**를 함께 본다.

### Merge

posterior를 합산하지 않는다. 같은 interaction이 두 중복 개념에 기록됐을 수 있어 이중 계산된다.

```
concept B → merged_into A (redirect)
knowledge_evidence를 canonical A로 remap
interaction_id 기준 dedupe
posterior replay
```

### prerequisite edge

LLM이 준 `0.82` 같은 값은 쓰지 않는다. 초기에는 범주형.

```
REQUIRED_PREREQUISITE / HELPFUL_PREREQUISITE / RELATED
```

**LLM은 후보를 제안하고, 신뢰도는 관측이 결정한다.**

## 9.6 보류 — 로그에서 재계산 가능하므로 지금 정하지 않음

| 항목 | 상태 | 참고 |
|---|---|---|
| Beta 분포 / learner state 수식 | 보류 | |
| KC별 모집단 prior 및 concentration | 보류 | base rate는 prior mean으로만, concentration은 작게 |
| forgetting half-life | 보류 | |
| Graph propagation 사용 여부와 강도 | 보류 | runtime inference로, max pooling, confidence는 안 올림 |
| Explanation Need 공식 | 보류 | `criticality × (1 − posterior lower quantile)` 방향 |
| SKIP/REFRESHER/FULL threshold | 보류 | |
| evidence weight 값 | 보류 | |

⚠️ `Criticality × Gap × Uncertainty`는 방향이 뒤집힌다. "모른다는 것을 확신하는" 경우의 설명 필요도를 깎는다. 쓰지 말 것.

---

# 10. 운영 모델 — **확정**

## 10.1 완전 자동화는 불가능하다

실제 제작 3건에서 발견한 오류 8개 중 **파이프라인 체크가 잡은 것은 0건이다.** 전부 "소스 팩 안에 없는 걸 알아채는" 종류였고, 파이프라인은 정의상 소스 팩 안에서만 검증한다.

> **파이프라인을 정확하게 만들려 하지 말고, 초안을 만들게 하고 게이트에 사람이 선다.**

각 스테이지의 판단 기준이 바뀐다.

| 사람 게이트 없을 때 | 사람 게이트 있을 때 |
|---|---|
| 이 단계가 모든 오류를 막는가? (답 불가, 무한 확장) | 이 단계가 **편집 시간을 줄이는가?** (측정 가능, 유한) |

## 10.2 게이트 4개

| # | 게이트 | 시간 | 질문 |
|---|---|---|---|
| 1 | **사건 선정** | 아침 15분 | 1차 자료가 확보됐나 / 설명하면 이해가 늘어나나 |
| 2 | **Goal 승인** | 건당 3분 | 요점이 맞나 ← **여기가 가장 중요** |
| 3 | **최종 검토** | 건당 5분 | 이 글만 읽으면 뭘 잘못 알까 / 진행 중 사건 상태가 이대로인가 |
| 4 | **이해 검증** | 별도 | 압축된 곳이 있는가 ← **본인이 못 함** |

**게이트 2가 가장 중요하다.** Goal이 틀리면 뒤가 전부 틀린다. "6월 만장일치 → 7월 분열"이 Goal이 됐으면 기사 전체가 잘못됐을 것이다.

**게이트 4는 다른 셋과 성격이 다르다.** 이미 아는 사람은 압축된 문장이 압축돼 보이지 않는다. **뉴스를 잘 안 보는 실제 독자**가 읽어야 작동한다. 2~3명을 정해 돌아가며.

가장 확실한 검출법: **"방금 읽은 거 한 문장으로 말해봐."** 못 하면 그 앞이 문제고, 어디서 못 하는지 보면 어느 슬라이드가 압축됐는지 바로 나온다.

**하루 총 소요: 15분 + 8분 × 4건 ≈ 50분.**

## 10.3 correction_log — **필수, 아직 미구현**

자동화의 연료. 게이트에서 개입할 때마다 기록.

```
correction_log
  date / event_id / stage
  what_was_wrong
  what_i_changed
  source_of_catch     내 배경지식 | 소스 재확인 | 그냥 읽어보니 | 타인 독해
  time_spent
```

### 오류 유형 (현재까지 관찰된 5종)

```
팩트 누락          중요한 사실이 Deep Fact Graph에 없었음
Goal 왜곡          요점 자체가 사실과 어긋남
오독 미방어        defensive include 누락
스토리라인 stale   참조한 진행 중 사건의 현재 상태가 다름
압축               문장은 맞지만 연결이 생략돼 못 따라감   ← 2026-09-18 신규
```

3개월 뒤 이 로그를 보면:
- **같은 유형이 반복** → 그 체크를 파이프라인에 넣을 근거
- **매번 다름** → 자동화 불가. 그 게이트는 사람이 계속 선다

**지금 스테이지를 추측으로 설계하고 있다. 이 로그가 쌓이면 측정으로 정할 수 있다.**

## 10.4 자동화 순서

correction_log가 없어도 지금 확실한 것: **제일 지루하고 제일 안 틀리는 것부터.**

```
1순위  소스 수집·저장·해시·span 매핑    지루함, 오류 없음
2순위  Coverage Schema 슬롯 채우기      기계적, 사람이 확인
3순위  Deep Fact Graph 초안             사람이 보강
4순위  Derived Claim + 반증 후보         사람이 판정
5순위  Goal 후보                        게이트 2
6순위  집필                             게이트 3
```

**집필이 마지막이다.** 직관에 반하지만 집필은 이상하면 바로 보인다. 반대로 팩트 누락은 안 보인다.

## 10.5 도메인 확장 계획

하루 3~5건을 내려면 도메인 3~4개가 필요하다. 단 **한 달에 하나씩** 늘린다.

```
1개월차   통화정책 + 규제       → 하루 1~2건 (있는 날만)
2개월차   + 기업/실적            → 하루 2~3건
3개월차   + 법원/판결            → 하루 3~4건
4개월차   + 기술정책             → 하루 4~5건
```

발행 개수가 자연스럽게 느는 것이 서비스 성장 서사가 되기도 한다.

## 10.6 제품 결정 — **확정**

- **하루 발행 개수를 고정하지 않는다.** 숫자를 약속하면 품질 낮은 뉴스를 채우게 된다
- **자유 질문은 열린 인터넷으로 보내지 않는다.** Article Fact Layer / 관련 Concept Atom / Storyline context만 컨텍스트로. source-grounded 답변
- **자유 질문에 semantic answer cache를 둔다**
- **Concept Library는 매일 재생성하지 않는다**
- **Storyline은 오늘 발생한 노드만 추가한다**
- **오류 신고 기능은 최소한으로.** 강점이 아니라 기본 요건
- **표기는 "AI 작성" 배지보다 소스 레이어 시각화가 낫다**

---

# 11. 실제 제작에서 발견한 오류 8건

> 파이프라인 설계의 근거가 되는 실증 자료. **8건 중 자동 체크가 잡은 것은 0건.**

| # | 오류 | 발견 경로 | 교훈 |
|---|---|---|---|
| 1 | 6월 SEP 누락 → "7월에 분열 시작" 서사 왜곡 | 외부 검색 | Counterevidence Search가 재수집을 트리거해야 함 |
| 2 | 12명(표결) vs 18명(전망) 혼동 | 글 읽다가 | KC를 Goal에서 역산해야 함 |
| 3 | 속도계 비유가 낙관적 그림 생성 | 레드팀 | 비유는 entailment 검사에 안 걸림. 한계선 저장 필요 |
| 4 | 이란 전쟁을 정적 사실로 평탄화 | **사용자 배경지식** | Storyline 상태 확인 단계 필요 |
| 5 | known_at을 "읽은 문서의 공개일"로 오인 | 외부 검증 | Fact↔Source N:M, 시간 필드 4종 |
| 6 | Warsh 기자회견 소스 팩 누락 | 외부 검증 | 유형별 Source Pack 정의 필요 |
| 7 | FTC 예시를 실제 사례처럼 제시 | 레드팀 | 강한 도입부가 사실보다 강한 그림을 만듦 |
| 8 | 속도계 4단계 압축 → 이해 불가 | **실제 독자 검증** | 정확성 검증으로는 못 잡음. 게이트 4 필요 |

**패턴**: 1·4·5·6은 "소스 팩 밖"에서 왔고, 3·7·8은 "사실은 맞는데 그림이 틀림"이다. 어느 쪽도 원문 대조·Coverage·entailment로 안 잡힌다.

---

# 12. 미정 / 결정 필요

## 12.1 사람의 판단이 필요한 것

| # | 항목 | 선택지 | 비고 |
|---|---|---|---|
| D1 | **기술 스택 전반** | — | 아직 아무것도 안 정함 |
| D2 | **모델 배치** | 단계별 강/약 모델 | 실제 토큰 수 측정 후 결정 |
| D3 | **사건 선정 주체** | 사람 / 알고리즘 | 초기엔 사람 권장 |
| D4 | **MVP 개인화 범위** | 토글만 / +calibration / +evidence 로깅 | 토글로 내고 로깅을 조용히 붙이는 안 |
| D5 | **정치 층 처리 방침** | 사건별 판단 / 일괄 제외 | 3건 모두 Core에서 제외했음 |
| D6 | **발행 시각** | — | T0 정의에 영향 |
| D7 | **Depth 컨트롤 노출 방식** | 상단 토글 / 설정 / 기사별 | 프로토타입은 상단 토글 |

## 12.2 데이터가 있어야 정할 수 있는 것

- 실제 기사당 토큰 비용 (초기 추정치 폐기됨)
- Resolver 임계값
- 서사 형식 선택 규칙의 유효성
- probe 개수와 배치
- Phase 1 성공 기준의 절대값

## 12.3 미검증 영역

| 항목 | 상태 |
|---|---|
| **공적 기관이 관여하지 않는 사건** | ⚠️ 한 번도 안 해봄. 가장 큰 미지 영역 |
| LLM 원샷 집필 | 0회 |
| Claim 자동 추출 + span 매핑 | 0회 |
| 슬라이드를 실제 독자가 읽는 경험 | 0회 |
| Concept Atom의 도메인 간 재사용 | 1회 (25%, ENRICHING 등급) |
| Coverage Schema 자동 채우기 | 0회 |
| 사건 선정 로직 | 0회 |

## 12.4 Concept Library 현황

| 사건 | 도메인 | 재사용 | 신규 | 재사용률 |
|---|---|---|---|---|
| FOMC | MONETARY | — | 6 | — |
| FTC | REGULATORY | 0 | 4 | 0% |
| 스크루웜 | PUBLIC_HEALTH | 1 (C-0009) | 3 | 25% |

**관찰**: 도메인이 다르면 재사용률이 0에 가깝다. "오래 운영할수록 기사당 비용이 내려간다"는 가정은 **도메인 안에서만** 성립할 가능성이 높다.

단 `civic_structure` 타입(C-0007 기관 권한 한계, C-0008 정책안 vs 규칙, C-0009 연방 vs 주)은 도메인을 넘을 후보다. 첫 재사용이 확인됐다.

---

# 13. 단계 계획

## Phase 0 — 되돌리기 어려운 것만 (며칠 규모)

**스키마 결정이지 도구 제작이 아니다.** rights registry는 테이블 하나이지 규정 준수 시스템이 아니고, merge는 SQL 스크립트이지 관리 UI가 아니다.

- [ ] Concept identity (UUID / alias / conflicting_alias / provisional / merge redirect / version)
- [ ] Content model (Fact / Concept / Bridge / Derived Claim, versioning)
- [ ] Source & rights (source_document, span, fact_type, volatility, N:M, 시간 필드 4종)
- [ ] `knowledge_evidence` schema
- [ ] `reading_plan_log` schema
- [ ] `correction_log` schema
- [ ] Probe type 구분

## Phase 1 — MVP

파이프라인 A(반자동) + 게이트 4개 + 3단계 정적 레벨 + probe/evidence 로깅.

지식 상태를 읽는 함수는 **코드 전체에서 호출 지점을 하나로 모은다.** 추상 인터페이스는 만들지 않는다. 두 번째 구현체가 없을 때 설계한 인터페이스는 거의 반드시 틀린다.

### Phase 1 게이트 — 절대 수치가 아니라 비교군

`POST comprehension ≥ 75%`는 probe 난이도의 함수일 뿐이다.

```
Event A:  Group 1 → Claro     Group 2 → 일반 기사
Event B:  Group 1 → 일반 기사  Group 2 → Claro
```

동일 Common Goal 기반 probe. 20~30명, 손으로 돌려도 된다. 통계적 유의성보다 **effect size + 정성 인터뷰.**

**부가 측정 — 전이 효과**: Claro로 A를 읽은 사람이 **일반 기사로 된 B**를 더 잘 이해하는가. "쓸수록 뉴스가 읽힌다"의 직접 증거이며, 1차 효과보다 강력한 결과다.

`완독`은 **terminal block 도달**로 정의. 슬라이드 UI에서는 "몇 장에서 이탈"이 공짜로 나온다.

## Phase 2 — Adaptive는 shadow

Bayesian 모델이 production rendering에 영향을 주지 않은 채 예측만 남긴다.

**Shadow가 검증하는 것과 못 하는 것:**
- 검증함: 상태 추정 모델이 정확한가 (Brier / calibration)
- 검증 못 함: 그 상태로 개인화하면 이해도가 올라가는가 (반사실)

**Shadow는 A/B의 전제조건이지 대체재가 아니다.**

### A/B 전에 값싸게 볼 지표 — Weighted Policy Divergence

두 정책이 실제로 얼마나 다르게 행동하는가. criticality로 가중(BLOCKING 3 / SUPPORTING 2 / ENRICHING 1), 결정 거리도 가중(SKIP↔FULL 2 / 나머지 1).

특히 **기사 중 최소 하나의 BLOCKING KC에서 정책이 갈리는 비율.** 3%면 A/B를 돌릴 이유가 거의 없다.

## Phase 3 — A/B

비교 대상의 차이가 **Personalization Planner 하나뿐**이어야 한다.

```
Control:   calibration 결과로 자동 배정한 3단계
Treatment: KC 단위 adaptive
```

Control을 자기선택으로 두면 self-selection 효과와 granularity 효과가 섞인다.

동일 ArticlePackage / Fact Layer / Common Goal probe. **Depth는 고정하고 Scaffolding만 비교.**

측정: Comprehension / Calibration / Redundancy / Missing support.
분석 단위는 probe 응답이되 한 사용자의 응답들은 독립이 아니므로 mixed-effects 전제.

---

# 14. 지금 착수할 것

## 즉시

1. **Phase 0 스키마 구현** — §13 체크리스트
2. **`correction_log` 생성** — 스프레드시트면 충분. 다음 사건부터 즉시 기록
3. **기술 스택 결정** (D1) — 미정
4. **실제 토큰 비용 측정** — 9월 FOMC 소스 팩(성명문+SEP+기자회견+회의록)으로 1회 측정

## 그 다음

5. 소스 수집·저장·span 매핑 자동화 (자동화 1순위)
6. Coverage Schema 슬롯 자동 채우기 (2순위)
7. 슬라이드 UI 디테일 (크기, 톤)
8. **FOMC 기사 3종을 실제 독자에게 읽히기** — 아직 안 함

## 하지 말 것

- Beta / propagation / prior / Need 공식 구현
- 추상 KnowledgeEstimator 인터페이스 설계
- shadow / A/B 인프라
- 도메인 4개 스키마 한꺼번에 작성
- 리뷰 큐 UI

---

# 15. 마지막 — 잊지 말 것

이 프로젝트는 설계 논의가 **구조적으로 정확성 쪽으로만 굴러간다.** 정확성에는 검증 절차가 있고 가독성에는 없기 때문이다. 실제로 여러 라운드 동안 초기 설계의 비유와 호기심 유도 구조가 조용히 사라졌다가 복구됐다.

그래서 무엇을 추가하든 이 질문을 붙인다.

> **이게 독자가 글을 더 술술 읽게 만드는가,
> 아니면 우리가 틀리지 않게만 만드는가?**

둘 다 필요하지만 예산은 유한하다.

그리고 이 스레드에서 가장 가치 있는 산출물 셋(FOMC·FTC·스크루웜 기사)은 **전부 손으로 만든 것**이다. 파이프라인이 만든 게 아니다. 그것이 출시 전에 얼마나 많은 파이프라인을 지어야 하는지에 대한 답이다.
