# DATA_MODEL

## CHANGELOG
| 날짜 | 변경 | 세션 |
|---|---|---|
| 2026-09-20 | 생성 (빈 껍데기) | PM |
| 2026-09-30 | 초안 — 브리프 3건 사실 표 · FOMC DC-A~E · 골든 `_` 주석(대기 13 · 끊긴 F 연결 · `_volatility` · `_attribution_refs`) · FINDINGS §4.1 §5 §6.2 §7.1 §7.2 §9.2 확정에서 도출. **게이트 전** | B-0.2b |
| 2026-10-09 | 게이트 반영 (D27) — `fact_type` 7값으로 닫음(딱 맞지 않던 세 무리의 행선지 확정) · 발행하려면 Fact 마다 1차 출처 · Event · Storyline 도 UUID + `code` · §16 판정됨 · §17 레인(C-3 · C-5 · 파이프라인) · 독자 글 1건(“올리자” 따옴표) 반영 | B-0.2b |

> **상태: 게이트 통과 (D27 · 2026-10-03). _open 3개 모두 판정됨 (§16).**
> ARTICLE_PACKAGE 는 사실 · 해석 · 브리지 · 사건을 참조로만 가리켰다. 이 계약이 그 참조가 가리키는 것의 주인이다.
>
> **원천 (D24)**
> - 실물 — `docs/findings/fomc-2026-09-brief.md` (F01~F38 · DC-A~E · Source Pack · Coverage) ·
>   `ftc-personalized-pricing-brief.md` · `screwworm-c-type-brief.md` (사실 표 · 타입 · 변동성 열) ·
>   골든 `fixtures/fomc-2026-09.article.json` 의 `_refs_pending` 13 · `_fact_refs_dropped` · `_volatility` 29 · `_attribution_refs` 2 ·
>   `fixtures/ftc-2026-08.observed.json` 의 인용 블록
> - 확정 — FINDINGS §4.1 · §5.1 ~ §5.5 · §6.2 상태 코드 · §7.1 · §7.2 · §9.2 · D8 · D20 · D22 · D23 · D25
>
> **표시** — **실물** 근거 있음 · **확정 §x** FINDINGS 확정에서 옴 · **실물 없음** 확정에서 왔지만 사례가 없다. 첫 사례가 나오면 다시 본다 ·
> **미확인** 둘 다 아니라 정하지 않았다 · **D27** 게이트 판정 (§16)
>
> **검사** — `python3 scripts/verify-data-model.py` (`--report` 로 골든 이전 목록 · 게이트 3 후보) ·
> 자체 시험 `python3 scripts/selftest-verify-data-model.py`

---

## 0. 범위

**이 계약이 주인인 것** — Fact · FactSource · Source · SourceDocument · SourceRegistry · DerivedClaim · CounterCheck · Bridge ·
Event · Storyline · StorylineVersion · TimeExpression · ArticleRecord · ArticleAuthoring · SlotCheck,
그리고 참조 모양 FactRef · ClaimRef · BridgeRef · SourceRef · EventRef · StorylineRef.

**안 넣는 것**
- Concept 과 그 참조(ConceptRef) · 브리지 자리(BridgeSlot) → CONCEPT_IDENTITY. 여기서는 가리키기만 한다
- 패키지 모양(레벨 · 슬라이드 · 블록 · span) → ARTICLE_PACKAGE. 여기서는 span 의 `refs` 가 무엇을 가리키는지만
- 사용자 쪽 기록 — knowledge_evidence · reading_plan_log · probe · correction_log → **0.2c**
- Coverage Schema 설계(슬롯 정의 · 유형별 스키마). 여기서는 §6.2 확정 상태 코드가 Fact 에 닿는 곳만 (§12)
- FINDINGS §9.6 보류 항목 전부. 이 계약에는 숫자 문턱이 하나도 없다
- 저장 기술 · 테이블 설계 (D1 백엔드 OPEN). 여기는 모양과 불변식만
- 사실 · 해석 · 출처를 채우는 일 — 콘텐츠 레인 (C-3 · C-5)과 파이프라인. 계약은 자리만 만든다 (§17)

---

## 1. 한눈에

```ts
UUID        = string
EventId     = UUID                 // Event.event_id (D27). 사람이 부르는 이름은 Event.code
StorylineId = UUID                 // Storyline.storyline_id (D27)
TimePoint   = string               // ISO 8601, 아는 만큼만: "2026" · "2026-02" · "2026-09-16" · "2026-09-16T14:00-04:00" (§5)

FactRef      = UUID                // Fact.fact_id
ClaimRef     = UUID                // DerivedClaim.claim_id
BridgeRef    = UUID                // Bridge.bridge_id
SourceRef    = UUID                // Source.source_id — 패키지에는 나오지 않는다
EventRef     = EventId
StorylineRef = StorylineId

FactType = "OFFICIAL_ACTION" | "OFFICIAL_CLAIM" | "OFFICIAL_LIMIT" | "MEASUREMENT"
         | "COURT_RULING" | "COMPANY_DISCLOSURE" | "INDEPENDENT_OBSERVATION"

Fact {                              // 사실 하나. 수집 단위 — Deep Fact Graph 의 노드 (§3). 발행물이 가리키면 고치지 않는다
  fact_id:            UUID
  label:              string        // "F31". 소유자(사건 · 스토리라인) 안에서 유일. 사람이 부르는 이름 (실물)
  claim_text:         string        // 확정 §5.5. 사실 문장
  fact_type:          FactType      // 확정 §5.2 — 7값으로 닫는다 (§3.2 · D27)
  actor:              string | null // 누가 했나 · 말했나. OFFICIAL_CLAIM · OFFICIAL_LIMIT 이면 필수 (§3.3)
  volatility:         "STABLE" | "VOLATILE"   // 확정 §5.4 · D8. Fact 에는 DERIVED 가 없다 (§6)
  as_of:              TimePoint | null        // VOLATILE 이면 필수. 이 값이 "지금 값"이던 때 (§6.2)
  event_at:           TimePoint | null        // 확정 §5.3. 사건이 일어난 때
  event_id:           EventId | null          // 소유 — event_id · storyline_id 중 정확히 하나 (§9.3)
  storyline_id:       StorylineId | null
  storyline_version:  integer | null          // storyline_id 가 있으면 필수. 이 사실이 붙은 스토리라인 버전
  extraction_model:   string | null           // 확정 §5.5. 사람이 뽑았으면 null (실물 전부)
  extraction_version: string | null
}

FactSource {                        // Fact ↔ Source 는 N:M (확정 §5.3). 원문 위치는 이 쌍에 붙는다 (확정 §5.5)
  fact_id:    UUID
  source_id:  UUID
  section:    string | null         // source_section
  span_start: integer               // SourceDocument.text 안 글자 위치. 실물 없음
  span_end:   integer
}

Source {                            // 문서 하나 (§4)
  source_id:    UUID
  label:        string              // "S1" · "P3" — Source Pack 안 이름 (실물)
  title:        string              // "FOMC Statement (9/16)"
  publisher:    string              // 낸 곳. SourceRegistry.source 를 가리킨다
  url:          string | null
  kind:         "PRIMARY" | "SECONDARY"   // 확정 §5.1 — 1차 자료 / 뉴스 매체
  language:     string              // 원문 언어 "en". 기사는 "ko" — 인용은 번역이다 (§10)
  published_at: TimePoint           // 확정 §5.3. 실물 "9/16 14:00 ET" — 시각 · 시간대까지 안다
  ingested_at:  TimePoint           // 확정 §5.3. Claro 가 수집한 때
}

SourceDocument {                    // 원문 보관 (확정 §5.5). 한 번 보관하면 바뀌지 않는다
  source_id: UUID
  text:      string                 // span_start · span_end 가 가리키는 글
}

SourceRegistry {                    // 확정 §5.1 필드 그대로. 발행처 하나에 한 행. 실물 없음
  source:               string      // 발행처 — Source.publisher 와 같은 값
  access_method:        string
  can_ingest:           boolean | null   // null = 아직 검토 안 함. 값 모양은 이름에서 읽었다 — 채운 실물이 없다
  can_store:            boolean | null
  can_quote:            boolean | null
  can_transform:        boolean | null
  commercial_use:       boolean | null
  attribution_required: boolean | null
  terms_url:            string | null
  last_reviewed_at:     TimePoint | null
}

DerivedClaim {                      // 사실에서 끌어낸 해석. Fact 가 아니다 (확정 §4.1). 발행물이 가리키면 고치지 않는다
  claim_id:  UUID
  label:     string                 // "DC-C" (실물)
  event_id:  EventId
  statement: string                 // 반증을 거친 뒤의 문장. 범위를 좁혔으면 좁힌 문장
  kind:      "ASSERTED" | "DEFENSIVE"   // DEFENSIVE = 우리 주장이 아니라 독자가 만들 오독을 막는 것 (실물 DC-B)
  basis:     FactRef[]              // 1개 이상. 이 해석이 기대는 사실 — 골든 _fact_refs_dropped 가 여기로 (§7)
  checks:    CounterCheck[]         // 반증 기록 (확정 §7.2). 발행하려면 1개 이상
}                                   // 판정(VALID …)은 저장하지 않는다 — checks 에서 나온다 (§7.3)

CounterCheck {
  question:    string               // 반증 후보 — "9월에도 반대가 있었나?"
  slot:        string | null        // 이 물음에 답할 Coverage 슬롯 (확정 §7.2). 브리프는 슬롯 이름을 적지 않았다
  recollected: boolean              // 그래프 밖에서 다시 모았나 (확정 §7.2 — 6월 SEP)
  answer:      string
  facts:       FactRef[]            // 답이 된 사실. NOT_REFUTED · SCOPED 는 발행하려면 1개 이상
  outcome:     "NOT_REFUTED" | "SCOPED" | "UNRESOLVED"
}

Bridge {                            // 연결 (확정 §4.1). 글이 아니다 — 문장은 기사가 쓴다
  bridge_id:       UUID
  label:           string
  bridge_type:     "CONCEPT_BRIDGE" | "STORY_BRIDGE"
  event_id:        EventId          // 오늘 사건 — 브리지가 잇는 곳
  concept_id:      UUID | null      // CONCEPT_BRIDGE 면 필수 — CONCEPT_IDENTITY 의 개념
  concept_version: integer | null   // CONCEPT_BRIDGE 면 필수
  slot:            string | null    // 채우는 BridgeSlot 의 label (CONCEPT_IDENTITY §6.2). 슬롯 없는 개념 브리지는 null
  from_event:      EventId | null   // STORY_BRIDGE 면 필수 — 이전 사건. 실물 없음
  facts:           FactRef[]        // 1개 이상. 브리지가 오늘 사건에서 가져온 사실 (실물: ④ 브리지 → F31 · F10)
}

Event {
  event_id:     EventId
  code:         string              // "FOMC-20260916". 유일 · 불변 · 재사용 없음 — Concept 의 code 와 같은 방식 (D27)
  title:        string
  occurred_at:  TimePoint | null    // "그런 날짜가 없다" 면 null (실물: 스크루웜 브리프 §0)
  storyline_id: StorylineId | null
}

Storyline {                         // 버전이 오르는 독립 객체. 자체 사실을 갖는다 (확정 §9.2)
  storyline_id: StorylineId
  code:         string              // "SL-iran-war". 유일 · 불변 · 재사용 없음 (D27)
  title:        string
  version:      integer             // 가장 큰 StorylineVersion.version
  ongoing:      boolean             // "아직 진행 중인가" — 여기가 답한다 (D8 규칙 5). 실물 없음
}

StorylineVersion {                  // 한 번 만들면 고치지 않는다. 실물 없음
  storyline_id: StorylineId
  version:      integer             // 1부터 1씩
  created_at:   TimePoint
  change:       string              // 한 줄. 무엇이 붙었나
}

ArticleRecord {                     // 발행 한 번 = 하나. 통째로 불변 (§11)
  package:   ArticlePackage         // ARTICLE_PACKAGE — 프론트로 가는 부분
  authoring: ArticleAuthoring       // 프론트로 가지 않는다
}

ArticleAuthoring {
  time_expressions: TimeExpression[]   // 골든 _volatility 가 여기로 (§6)
  storylines:       StorylinePin[]     // 발행 때 확인한 스토리라인 버전 (§9.4)
  notes:            string[]           // 저작 메모 — 골든 _published_at_basis 같은 것
}

StorylinePin { storyline_id: StorylineId, version: integer }

TimeExpression {                    // 패키지 글 속 시간 조각 하나 — 저작 데이터 (§6.3)
  at:                 TextLocator
  class:              "DERIVED" | "VOLATILE"   // D8. STABLE 은 적지 않는다
  facts:              FactRef[]     // VOLATILE: 그 값을 말하는 사실. 1개 이상, 모두 VOLATILE. DERIVED 는 []
  value_at_authoring: number | null // DERIVED
  check:              "==" | ">" | null   // DERIVED. 실물 두 값 ("3년 넘게" 는 >)
  formula:            Formula | null      // DERIVED
  inputs:             DerivedInput[]      // DERIVED — 계산에 쓴 날짜들
}

TextLocator  { level: string, path: string, fragment: string }   // level = Level.id, path = 레벨 안 경로, fragment = 그 글 속 조각
DerivedInput { key: string, what: string, value: TimePoint, fact: FactRef | null }
Formula      { op: string, from: string | null, to: string | null, of: string | null, offset: integer | null }

SlotCheck {                         // Coverage 슬롯 하나의 점검 결과 — Fact 에 닿는 부분만 (§12)
  slot:      string                 // 슬롯 이름. 슬롯 정의 · 모양은 미확인
  status:    "FOUND" | "NOT_EXTRACTED" | "SOURCE_UNAVAILABLE" | "NOT_APPLICABLE" | "STORYLINE_STALE"
  facts:     FactRef[]              // FOUND 면 1개 이상, 나머지는 []
  sources:   SourceRef[]            // NOT_EXTRACTED — 있는데 못 뽑은 자료
  storyline: StorylineRef | null    // STORYLINE_STALE 이면 필수
}
```

---

## 2. 식별과 참조 (질문 9)

### 2.1 키

| 무엇 | 키 | 사람이 부르는 이름 | 근거 |
|---|---|---|---|
| Fact · DerivedClaim · Bridge · Source | UUID | `label` — "F31" · "DC-C" · "S1". 소유자 안에서만 유일 | 아래 · D27 |
| Event | UUID (`event_id`) | `code` — "FOMC-20260916". 전체에서 유일 · 불변 | D27. code 값은 실물 — 골든 `event_ref` |
| Storyline | UUID (`storyline_id`) | `code` — "SL-iran-war". 전체에서 유일 · 불변 | D27. code 값은 실물 — 도윤 관찰 · development-content C-3 |
| Concept | CONCEPT_IDENTITY §2 (UUID + `code`) | "C-0002" | D25 |

- **왜 label 을 키로 쓰지 않나 — 실물에서 이미 부딪혔다.**
  - 세 브리프가 모두 `DC-A` 를 쓴다. 해석 셋이 같은 이름이다
  - 스크루웜 브리프는 사실 `S01`~`S34` 와 출처 `S1`~`S6` 을 같은 글자로 쓴다
  - F37(이란 · 경유 가격)은 FOMC 브리프에 번호를 받았지만 FOMC 사건이 아니라 SL-iran-war 소속이다(도윤 관찰). 소유자를 키에 넣으면("FOMC-20260916/F37") 소유가 바뀔 때 키가 바뀐다
- **왜 UUID 인가** — 파이프라인이 사건마다 사실 20~30개 이상(확정 §7.1)을 사람 없이 만든다. 한 곳에서 번호를 셀 필요가 없다. CONCEPT_IDENTITY 와 같은 방식이다 (D25 수용)
- **Event · Storyline 도 UUID 다 (D27 — 초안의 추천을 뒤집었다).** 초안은 "사건 선정은 3회 모두 사람이 했다"를 근거로 사람이 붙인 문자열을 키로 쓰자고 했다.
  사건을 누가 고르나(D3)는 OPEN 이다 — 정해지지 않은 결정의 가정이 되돌릴 수 없는 키 체계에 들어가면 안 된다.
  지금 통일하는 비용은 골든 `event_ref` 하나(0.2m)이고, 나중에 바꾸면 옛 발행물과 새 발행물이 영원히 다른 키를 쓴다
- **사람이 부르는 이름은 `code` 로 그대로 남는다** — "FOMC-20260916" · "SL-iran-war". 유일 · 불변 · 재사용 없음, 만들 때 붙인다. Concept 의 `code`(D25)와 같은 방식이다.
  correction-log · 게이트 · 로그는 code 로 부른다. `label` 과 다른 점: label 은 소유자 안에서만 유일하고, code 는 전체에서 유일하다
- **label · code 는 참조에 쓰지 않는다.** 기계가 저장하는 참조는 UUID 키 하나다. 같은 것을 두 곳에 두면 어긋난다 (D22 · CONCEPT_IDENTITY §2 와 같은 이유). 참조 방식이 프로젝트 전체에서 하나다

### 2.2 참조 모양 — 층이 정한다

ARTICLE_PACKAGE 의 span 은 층 하나에 refs 를 싣는다. refs 가 무엇인지는 **층이 정한다** — 모양을 따로 적지 않는다.

| span `layer` | `refs` 원소 | 정의 | 가리키는 것 |
|---|---|---|---|
| `fact` | FactRef | 이 계약 | Fact — 그 문장이 말하는 사실 |
| `claim` | ClaimRef | 이 계약 | DerivedClaim — 그 해석. 해석이 기대는 사실은 Claim 의 `basis` 가 안다 |
| `bridge` | BridgeRef | 이 계약 | Bridge — 그 연결. 브리지가 품은 사실은 Bridge 의 `facts` 가 안다 |
| `concept` | ConceptRef `{ concept_id, version, part }` | CONCEPT_IDENTITY §3.2 | 개념의 한 버전 · 한 문안 |
| `writing` | 없음 (`[]`) | — | — |

패키지 최상단 `event_ref` 는 EventRef 다 — Event 의 UUID 이지 code 가 아니다 (D27).

- **FactRef · ClaimRef · BridgeRef 는 키 하나다.** Fact · Claim · Bridge 는 버전이 없다 — 발행물이 가리키면 고치지 않기 때문이다(§2.3). ConceptRef 만 버전과 `part` 를 갖는다: 개념 문안은 발행 뒤에도 고쳐 쓰이고(C-1b 실물 6건), 기사는 쓴 버전을 고정해야 한다
- **층이 원소 모양을 정하므로** "refs 는 그 층의 atom 만"(ARTICLE_PACKAGE §6)이 모양으로도 지켜진다. Claim span 에 FactRef 를 넣으면 풀리지 않는다
- SourceRef 는 패키지에 나오지 않는다. 원문은 Fact 를 거쳐서 닿는다 (§4 · §10)

### 2.3 발행 뒤에는 고치지 않는다 (확정 §9.2)

- 발행된 ArticleRecord 가 가리키는 Fact · DerivedClaim · Bridge · Source · SourceDocument 는 고치지도 지우지도 않는다.
  패키지가 불변이면 그 참조가 가리키는 것도 불변이어야 한다 — CONCEPT_IDENTITY §3.1 이 옛 개념 버전을 지우지 않는 것과 같은 이유
- 발행 전 초안은 고칠 수 있다. 실물: DC-C 는 반증에서 범위가 좁혀졌다(브리프 §4)
- 틀린 것이 나중에 드러나면 → 새 Fact(또는 Claim)를 만들고 스토리라인에 붙인다(§9). 무엇을 대체하는지의 기록은 correction_log → **0.2c**
- VOLATILE 값이 바뀌면(48건 → 52건) 그것도 새 Fact 다. 옛 Fact 는 그 `as_of` 로 계속 맞다

---

## 3. Fact (질문 1)

### 3.1 필드 — 어디서 왔나

| 필드 | 원천 |
|---|---|
| `claim_text` · `fact_type` · `volatility` · `extraction_model` · `extraction_version` | **확정 §5.5** `fact_claim` 그대로 |
| `source_id` · `source_section` · `source_span_start` · `source_span_end` | **확정 §5.5** — 단 Fact 가 아니라 **FactSource** 에 (§4.2). 확정 §5.3 이 Fact ↔ Source 를 N:M 으로 정했으므로 원문 위치는 (사실, 출처) 쌍마다 다르다 |
| `event_at` | **확정 §5.3** |
| `as_of` | **확정 §5.4** "VOLATILE 한 fact 는 기준 시각을 명시" · D8 "as_of 필수" · 실물 골든 VOLATILE 주석 (§6.2) |
| `actor` | **확정 §5.2** "Fact 는 '물가가 안정됐다'가 아니라 '백악관이 그렇게 주장했다'" · 실물 (§3.3) |
| `label` · 소유 (`event_id` · `storyline_id`) | 실물 — 브리프 ID · 도윤 관찰 (§2.1 · §9) |

- `claim_text` 는 한국어다(실물 — 브리프 사실 표 전부). 원문은 영어다(Source Pack 전부 미국 정부 문서). §5.5 의 "숫자 · 날짜 원문 리터럴 일치" 는
  언어가 다른 두 글을 대야 한다 — 원문을 보관한 적이 없어 대 본 적이 없다 → **미확인** (§15)
- `extraction_model` — 브리프 38 + 45 + 34 개는 전부 사람이 뽑았다 → `null`. 스테이지 2(Claim 추출)는 "스키마만"이다 (FINDINGS §7 표)
- **`first_verified_public_at` 은 저장하지 않는다 — 계산한다** (§5.1). 확정 §5.3 의 정의("확보한 공개 출처 중 가장 이른 시점")가 곧 계산식이다
- **수집과 선택은 다르다 (확정 §7.1).** Fact 는 Deep Fact Graph 의 노드 — 모은 것이다. 이 기사에 무엇을 앞세웠는지(Core / Deep, 지지 / 방어)는 기사 쪽 선택이다.
  패키지 refs 는 Fact 를 가리킨다. 선택 기록의 모양은 **미확인** (실물: FOMC 브리프 §6 Core 표 하나)

### 3.2 `fact_type` — FINDINGS §5.2 의 7값 (확정). 브리프 타입은 여기로 옮긴다

**두 어휘는 다른 축을 쟀다.** §5.2 는 **이 사실이 어떤 종류의 기록인가**(누가 무엇을 했나 · 말했나 · 쟀나)를 묻는다.
브리프 타입 30개 중 상당수는 **기사에서 무슨 역할을 하나**를 적었다 — `HISTORICAL_CONTEXT` · `NEXT_EVENT` · `EXTERNAL_SHOCK` · `PRIOR_*` · `EXCLUSION` · `CONSTRAINT`.
역할은 Coverage 슬롯의 몫이다(FTC 브리프 §3 "명시적 제외 대상" 슬롯, 스크루웜 §3 "대응의 제약 조건" 슬롯이 실물). 한 필드에 두 축을 담지 않는다.

그래서 `fact_type` 은 §5.2 의 7값이고, **7값으로 닫는다 (D27).** 값을 더하면 그때마다 "이건 한 것인가 주장한 것인가"를 다시 정해야 한다. 확정 §5.2 의 요점이 이 필드에 산다:
**기관이 "주장한 것"은 사실이 아니라 "주장했다는 사실"이다** — `OFFICIAL_CLAIM` 인 사실은 참이라는 뜻이 아니라 그 기관이 그렇게 말했다는 뜻이다.

| `fact_type` | 뜻 (확정 §5.2) | 실물 |
|---|---|---|
| `OFFICIAL_ACTION` | 실제로 취해진 조치 | 있음 |
| `OFFICIAL_CLAIM` | 기관이 주장한 것 — 평가 · 전망 · 발언 포함 | 있음 |
| `OFFICIAL_LIMIT` | 기관이 자기 권한 한계를 밝힌 것. **기관이 스스로 밝힌 한계**로 읽는다 — 권한 · 지식 · 입장 (D27) | 있음 (FTC G03 · G26 · G29) |
| `MEASUREMENT` | 측정된 수치 | 있음 |
| `COURT_RULING` | 판결 | 실물 없음 |
| `COMPANY_DISCLOSURE` | 기업 공시 | 실물 없음 |
| `INDEPENDENT_OBSERVATION` | 기관 밖의 관찰 (연구 · 보도가 직접 잰 것) | 실물 없음 |

### 3.3 브리프 타입 → fact_type

세 브리프의 모든 타입. `scripts/verify-data-model.py` 가 브리프에 이 표에 없는 타입이 생기면 실패한다.
"행마다" = 같은 브리프 타입 안에 성격이 다른 사실이 섞였다. "나눈다" = 사실 하나에 두 종류가 묶였다 — 0.2m 에서 두 Fact 로.

| 브리프 타입 | 브리프 · 행 | `fact_type` | 이유 |
|---|---|---|---|
| POLICY_ACTION | FOMC F01 F05 · FTC G01 | OFFICIAL_ACTION | |
| VOTE | FOMC F02 · FTC G02 | OFFICIAL_ACTION | 표결은 취해진 조치다 |
| PRIOR_VOTE | FOMC F28 | OFFICIAL_ACTION | "이전"은 `event_at` 이 말한다 |
| PROCESS | FOMC F20 | OFFICIAL_ACTION | 의장이 전망을 내지 않았다 — 기관 절차상의 행위 |
| NEXT_EVENT | FOMC F38 | OFFICIAL_ACTION | 기관이 정해 공표한 일정 |
| POLICY_CONTENT | FTC G05 G07 | OFFICIAL_ACTION | 발표 문서가 요구하는 것 — 문서의 내용이 곧 조치 |
| DEFINITION | FTC G10 G14 | OFFICIAL_ACTION | 같음 (정책안이 정한 정의) |
| EXCLUSION | FTC G11 G12 G13 | OFFICIAL_ACTION | 같음. "해당 없음"이라는 역할은 슬롯이 맡는다 |
| EVENT | 스크루웜 S01 | OFFICIAL_ACTION | USDA 가 첫 사례를 **확인**했다 |
| HISTORY | 스크루웜 S14 | OFFICIAL_ACTION | 1966년 박멸 선언 |
| OFFICIAL_CLAIM | FOMC F04 F21~F27 · FTC G04 G06 · 스크루웜 S07 S08 S11 | OFFICIAL_CLAIM | |
| OFFICIAL_ASSESSMENT | FOMC F06~F10 · 스크루웜 S06 | OFFICIAL_CLAIM | 기관의 평가는 기관의 주장이다 — §5.2 의 백악관 예 그대로 |
| PROJECTION | FOMC F11 F14~F19 · 스크루웜 S19 | OFFICIAL_CLAIM | 전망은 미래에 대한 주장이다. 사실은 "그렇게 전망했다" |
| POLICY_OUTLOOK | FOMC F12 F13 | OFFICIAL_CLAIM | 같음 |
| POLICY_SIGNAL | FOMC F32 F33 | OFFICIAL_CLAIM | 의장의 발언. **F32 는 나눈다** — "이전보다 명확한 인상 가능성 신호를 보냄"은 발언이 아니라 읽은 쪽의 해석이다 |
| EVIDENCE | FTC G27 G28 | OFFICIAL_CLAIM | FTC 가 연구를 인용했다는 사실. 연구 자체를 출처로 삼으면 INDEPENDENT_OBSERVATION |
| OFFICIAL_LIMIT | FTC G03 | OFFICIAL_LIMIT | |
| LEGAL_NATURE | FTC G08 G09 | OFFICIAL_LIMIT | 문서 스스로 밝힌 구속력 · 집행 요건의 한계 |
| SELF_LIMIT | FTC G26 G29 | OFFICIAL_LIMIT | 권한이 아니라 지식 · 입장의 한계지만("잘 알려져 있지 않다" · "입장을 밝히지 않겠다") 기관이 스스로 밝힌 한계다 (D27) |
| MACRO_DATA | FOMC F30 F31 | MEASUREMENT | |
| MARKET_CONTEXT | FOMC F34 F35 | MEASUREMENT | |
| MARKET_EXPECTATION | FOMC F36 | MEASUREMENT | 시장 가격에서 읽은 확률 |
| STATUS | 스크루웜 S02~S05 S15 S17 S20 | **행마다** | 건수(S02~S04) MEASUREMENT · "USDA 는 ~ 밝힘"(S15) OFFICIAL_CLAIM · 시설 건설 · 투입(S17 S20) OFFICIAL_ACTION · S05(감염 동물 종류)는 그것을 말한 기관 자료의 OFFICIAL_CLAIM (D27) |
| CONSTRAINT | 스크루웜 S16 S18 | **행마다** | S18 "최소 2027년까지 가동 안 됨" OFFICIAL_CLAIM(전망). S16 "생산량이 확산에 못 미치는 것이 핵심 제약"은 누구의 평가인지 브리프에 없다 — 기관 평가면 OFFICIAL_CLAIM, 아니면 사실이 아니라 **Derived Claim** |
| HISTORICAL_CONTEXT | FOMC F03 | OFFICIAL_ACTION | "2023년 7월 이후 첫 인상" — 조치 기록들을 대어 본 결과다. 1차 조치 기록을 출처로 삼는다 (D27). 지금 출처는 "다수 보도"뿐 (§4.3) |
| FACT · METHOD · MECHANISM | 스크루웜 S09 S10 · S12 · S13 | OFFICIAL_CLAIM | 과학 · 배경 지식(기생 부위, 승인 약물, 불임곤충기법 원리)은 그것을 말한 기관 자료의 주장으로 적는다 — "CDC 에 따르면". 보수적일 뿐 독자를 속이지 않는다 (D27). 연구를 직접 출처로 삼으면 INDEPENDENT_OBSERVATION |
| PRIOR_OUTLOOK | FOMC F29 | **나눈다** | 6/17 동결 12대0(OFFICIAL_ACTION) + 같은 날 SEP 분포 9/8/1(OFFICIAL_CLAIM) |
| EXTERNAL_SHOCK | FOMC F37 | **나눈다** | "이란 전쟁으로 연료 가격이 급등"(인과 — 누구의 주장인지 없음) + "경유 가격이 최고치"(MEASUREMENT). 소유는 SL-iran-war (§9) |
| (타입 없음) | FTC G15~G25 G30~G45 · 스크루웜 S21~S34 | 행마다 | 브리프가 타입을 적지 않았다. 0.2m 에서 행마다 |

### 3.4 `actor` — 누가 (확정 §5.2)

- `OFFICIAL_CLAIM` · `OFFICIAL_LIMIT` 이면 **필수**. 주장한 쪽이 사실의 일부다 — "주장했다는 사실"에서 빠질 수 없는 주어다
- **실물이 왜 필드로 필요한지 보여준다**: FOMC F06~F10("경제활동이 견조한 속도로 확장 중" · "인플레이션은 여전히 높은 수준")은 `claim_text` 에 주어가 없다.
  누가 말했는지는 표 제목 "공식 경제 평가 (S1)" 에만 있다. 표를 벗어나 사실 하나만 떼면 기관의 평가가 맨 사실처럼 읽힌다 — §5.2 가 가장 경계한 모양이다
- 다른 타입은 `null` 이어도 된다. 모양(문자열인지, 기관 · 인물을 가리키는 ID 인지)은 **미확인** — 기관 · 인물 객체의 실물이 없다
- 기사 글이 주장한 쪽을 밝히는지는 기계가 못 본다 → **게이트 3.** `--report` 가 후보를 뽑는다: OFFICIAL_CLAIM 사실만 가리키는 `fact` span (골든 24)

---

## 4. Source (질문 2)

### 4.1 원문을 보관한다 (확정 §5.5)

- `Source` = 문서 하나의 서지. `SourceDocument` = 그 문서의 글 전문. LLM 추출 결과만 저장하지 않는다
- **한 번 보관한 원문은 바뀌지 않는다.** span 위치가 그 글을 가리키기 때문이다. 같은 주소의 문서가 바뀌면 새 Source 다.
  **실물**: FOMC S3 "기자회견 전문 (**preliminary**)" — 확정본이 나오면 다른 글이다. 이미 뽑은 사실은 preliminary 를 계속 가리킨다
- 원문 언어는 `Source.language` 에 (§10 인용)

### 4.2 원문 위치와 N:M (확정 §5.3 · §5.5)

- `FactSource` 한 행 = (사실, 출처) 한 쌍 + 그 출처 안의 위치. 사실 하나가 출처 여럿에, 출처 하나가 사실 여럿에 걸린다
- 확정 §5.3 의 실물(2026-09-18 오류): 7월 29일 시장 가격은 7월 회의록(8/19 공개)에 있었다. 같은 사실이 다른 공개일의 출처 둘에 있을 수 있다 — 그래서 공개 시점은 쌍이 아니라 출처에서 읽고, 사실의 공개 시점은 계산한다(§5)
- `span_start` · `span_end` — `SourceDocument.text` 안 글자 위치. **실물 없음** — 세 브리프 어디에도 원문 위치가 없다. 사실 117개 모두 출처 ID 까지만(또는 그것도 없이) 있다

### 4.3 1차 · 2차 (확정 §5.1)

- `kind: PRIMARY` — 1차 자료. Fact 를 짓는다. `SECONDARY` — 뉴스 매체. 오늘 무엇이 중요한지 찾는 신호다 (확정 §5.1)
- 실물에서 2차가 사실의 출처로 쓰였다: FOMC F03 "출처: 다수 보도" · FTC S4~S6 "2차 자료 경유 — 1차 원문을 직접 읽지 않았다. Core 에서는 2차 자료가 일치하는 사실만 썼다" · 스크루웜 S6 "보도"
- **발행하려면 Fact 마다 PRIMARY 출처가 1개 이상 있어야 한다 (D27 · 불변식 9).** 독자는 `fact` 표시를 "원문 확인"으로 읽는다(§8.4). 2차 보도끼리의 일치는 같은 원 보도를 옮긴 결과일 수 있다
- **1차 = 그 사실을 만들었거나 측정한 주체의 자료 (D27).** 실물의 2차 사실(F03 · FTC 주법 · 6(b))은 1차가 공개돼 있다 — 없는 게 아니라 안 읽은 것이다
- 공적 기관이 관여하지 않는 사건(FINDINGS §6.1 축 2 · 미검증)에서 1차가 정말 없으면 그때 이 불변식을 다시 본다

### 4.4 권리 (확정 §5.1)

- `SourceRegistry` — 확정 §5.1 필드 그대로, 발행처마다 한 행. **실물 없음** — 채운 행이 하나도 없다. 브리프의 "성격" 열("미국 정부 저작물" · "주정부 자료" · "2차")이 가장 가까운 실물이다
- "1차 자료를 쓰면 저작권 문제가 사라진다"는 사실이 아니다 (확정 §5.1) — 지역 연은 · 국제기구는 자체 저작권을 주장한다
- 이 계약이 권리를 쓰는 곳: **인용 블록은 `can_quote` 가 참인 출처에서만** (§10 · 불변식 20)
- `can_store` 가 거짓인 발행처는 원문 보관(§5.5)과 부딪힌다 — 그 출처로 Fact 를 지을 수 있는지 **미확인** (실물 없음)

---

## 5. 시간 (질문 3)

### 5.1 네 필드의 자리 (확정 §5.3)

| 확정 §5.3 | 이 계약 | 저장 |
|---|---|---|
| `event_at` 사건이 일어난 시점 | `Fact.event_at` | 저장 |
| `source.published_at` 그 문서가 공개된 시점 | `Source.published_at` | 저장 |
| `first_verified_public_at` 확보한 공개 출처 중 가장 이른 시점 | Fact 에서 계산 = 그 Fact 의 FactSource 가 가리키는 Source 들의 `published_at` 중 가장 이른 것 | **저장 안 함** |
| `ingested_at` 우리가 수집한 시점 | `Source.ingested_at` | 저장 |

- `first_verified_public_at` 을 계산하는 이유 — 정의가 곧 식이다. 저장하면 출처가 붙을 때마다 고쳐야 하고, 안 고치면 어긋난다
- **publicly knowable 과 "Claro 가 검증 가능한 출처를 확보함"은 다르다 (확정 §5.3).** 발행 규칙은 후자로 잰다 (불변식 11):
  패키지가 닿는 모든 Fact 는 `first_verified_public_at ≤ published_at`. 출처가 없는 Fact 는 이 값이 없다 — 그 시점 기사에 쓸 수 없다
- `ingested_at` 은 발행 규칙에 쓰지 않는다. 늦게 수집해도 공개일이 앞이면 그때 공개였다. 쓰임새는 관찰 · 감사 — 0.2c

### 5.2 TimePoint — 아는 만큼만

- ISO 8601 문자열을 **정밀도를 줄여** 쓴다: `"2026"` · `"2026-02"` · `"2026-09-16"` · `"2026-09-16T14:00-04:00"`
- **실물**: 골든 DERIVED 입력이 `"2023-07"` · `"2026-02"` · `"2026-07-29"` 를 섞는다 · Source Pack 은 "9/16 14:00 ET" 처럼 시각과 시간대까지 안다 ·
  스크루웜 S25 "2023~" 는 구간이다 → **구간은 미확인** (시작만 적을지, 모양을 따로 둘지)
- 정밀도가 다른 두 값을 비교할 때 앞뒤가 갈리지 않으면(예: `"2026-09"` 와 `"2026-09-16"`) **증명 못 한 것**으로 본다. D8 의 UNVERIFIABLE 과 같다

### 5.3 R-1 — 패키지 `published_at` 의 JSON 모양

**`"YYYY-MM-DD"` — 날짜만.**

- **실물**: 골든 `"2026-09-16"`. `published_at` 의 일은 DERIVED 값의 기준이다(ARTICLE_PACKAGE §2 · D8 규칙 1). 골든의 계산 op 7개가 전부 날짜 단위다(§6.4) — 시각을 쓰는 식이 없다
- TimePoint 의 날짜 정밀도다. 시각 · 시간대는 싣지 않는다
- **값은 D6(발행 시각, OPEN)이 정한다. 모양은 D6 과 무관하다** — 어느 날짜를 적을지가 D6 이다. 어느 시간대의 날짜로 자를지도 D6 이다
  - 실물로 본 영향: 회의는 9/16 14:00 ET = 9/17 03:00 KST. 골든 값을 `2026-09-17` 로 바꿔 다시 계산하면 **DERIVED 18 중 1 개("201일째")만 깨진다** — 202일째가 된다. 18 로 바꿔도 같은 하나다
  - 시각이 필요한 식("6시간 전")이 생기면 그때 모양을 넓힌다. 지금은 실물이 없다
- 프론트는 이 값을 읽지 않는다 (D12). `packages/contract` 가 비어 있지 않은 문자열로 받는 것은 그대로 맞다
- 날짜와 시각이 있는 Source `published_at` 을 비교할 때 시각을 날짜로 자르는 시간대 — D6

---

## 6. volatility (질문 4)

### 6.1 붙는 곳이 둘이다

S2 가 본 것: **같은 사실이 조각마다 다르게 분류된다.** F11 을 "2026년"이라 쓰면 STABLE, "올해"라 쓰면 DERIVED.
D8 은 이것을 사실의 속성으로 두었는데, DERIVED 는 사실의 속성일 수가 없다 — "올해"는 발행일에 기대고, 사실은 여러 기사가 나눠 쓴다.

| 어디 | 값 | 무엇을 말하나 | 근거 |
|---|---|---|---|
| `Fact.volatility` | `STABLE` · `VOLATILE` | 다시 조회하면 값이 바뀌는 사실인가 | 확정 §5.4 · §5.5 (`fact_claim.volatility`) · 실물 스크루웜 브리프 "변동성" 열(S01 STABLE · S02 VOLATILE …) |
| `TimeExpression.class` | `DERIVED` · `VOLATILE` | 기사 글의 이 조각이 발행일 기준 계산인가 / 바뀌는 값을 말하는가 | D8 · 실물 골든 `_volatility` 29 (DERIVED 18 · VOLATILE 11) |

- **D8 의 값 셋은 그대로다.** STABLE · DERIVED · VOLATILE. 사실에는 둘만 걸리고(사실은 발행일로 계산되지 않는다), 조각에는 셋 다 걸린다 — STABLE 조각은 적지 않는다(골든도 적지 않았다)
- 조각의 분류는 사실의 분류에서 나온다(D8 규칙 4 — 출처가 VOLATILE 이면 DERIVED 를 못 쓴다). 두 곳이 같은 것을 두 번 적는 게 아니다: 사실은 "값이 바뀌나", 조각은 "이 글이 발행일에 기대나"다

### 6.2 `as_of` 는 Fact 에 있다

- **실물**: 골든 VOLATILE 주석 11개에서 같은 사실은 언제나 같은 `as_of` 다 — F31 `2026-08-30` ×3 · F30 `2026-08-07` ×3 · F36 `2026-09-15` ×2 · F37 `2026-09-16` ×2 · F35 `2026-09-15` ×1.
  조각의 속성이 아니라 사실의 속성이다. 한 곳에만 둔다
- VOLATILE 인 Fact 는 `as_of` 필수 (확정 §5.4 (a) · D8). VOLATILE 조각은 자기 사실의 `as_of` 를 쓴다 — 조각에 따로 적지 않는다
- 실물의 `as_of` 는 모두 **그 값이 공개된 날**이다(브리프 "시점" 열 — F30 은 "8/7 발표"). `first_verified_public_at` 과 같은 값일 수 있지만 브리프에 출처가 없어 대 볼 수 없다 → **미확인**
- `as_of` 를 독자에게 보일지 — ARTICLE_PACKAGE §10 미확인 그대로

### 6.3 TimeExpression — 골든 `_volatility` 가 옮겨갈 곳

공식 · 입력 · 기록값은 **저작 데이터**다(ARTICLE_PACKAGE §0 · §8). 패키지에 없고 `ArticleAuthoring.time_expressions` 에 있다.

| 골든 `_volatility` | TimeExpression | |
|---|---|---|
| 슬라이드 · open_question 에 붙은 배열 | `authoring.time_expressions` 하나로 | 붙는 곳이 위치로 대신된다 |
| `where` (슬라이드 기준) + `span` | `at { level, path, fragment }` — `path` 는 레벨 기준 (`slides/3/blocks/0/paragraphs/1/body`) | 패키지는 불변이라 경로가 썩지 않는다 |
| `class` | `class` | STABLE 없음 |
| `refs` (VOLATILE) | `facts` | |
| `as_of` · `as_of_basis` | Fact 로 (§6.2) | |
| `value_at_authoring` · `check` · `formula` | 그대로 | |
| `derived_from[] { key, what, value, refs, volatility, note, brief_loc }` | `inputs[] { key, what, value, fact }` | `volatility` 는 그 Fact 의 것 (두 번 안 적는다). `note` · `brief_loc` 은 `authoring.notes` 로 |
| `invariant` (PASS · UNVERIFIABLE) | 저장 안 함 | 발행 때 계산한다 (D8 규칙 3) |

- `fragment` 는 그 글 안에서 **한 번만** 나와야 한다 — 두 번 나오면 어느 조각인지 모른다 (불변식 15). 골든 29개 모두 한 번씩이다
- **span 에 붙이지 않는 이유** — span 은 출처 층의 단위이고, 시간 조각은 span 보다 작다("지금 미국은 3%대" 는 bridge span 의 일부). 패키지에 저작 필드를 넣을 수도 없다 (ARTICLE_PACKAGE §9-9)

### 6.4 공식

| `op` | 계산 | 골든 |
|---|---|---|
| `days_inclusive` | 두 날짜 사이 날 수 + 1 | "201일째" |
| `weeks` | 날 수 / 7, 반올림 | "7주 만에" · "3주 뒤" |
| `months` | 날 수 / 30.4375 | "반년 넘게" (`>`) |
| `months_round` | 날 수 / 30.4375, 반올림 | "두 달 사이" |
| `years` | 날 수 / 365.25 | "3년 넘게" (`>`) |
| `years_floor` | 날 수 / 365.25, 내림 | "3년 만에" |
| `year_of` | `of` 의 연도 + `offset` | "올해" · "내년" · "연내" |

- **실물 7개.** S2 는 6개로 충분했다고 적었고(S4 표), 골든은 여기에 `year_of` 를 더 쓴다. 새 op 는 계약 개정으로만 는다
- `from` · `to` · `of` 는 입력의 `key` 이거나 `"published_at"`
- **발행하려면 재계산이 PASS 여야 한다.** 월 정밀도 입력 때문에 증명 못 한 것(UNVERIFIABLE)도 발행하지 않는다 — D8 규칙 3 은 "맞음"을 보이라는 불변식이다.
  실물: "201일째" 는 개전일이 "2026-02" 뿐이라 UNVERIFIABLE (2/28 이면 201, 2/21 이면 208). C-3 이 개전일을 확인하면 풀린다
- **발행하려면 모든 입력에 `fact` 가 있어야 한다.** 실물: `war_start`(이란 개전 — C-3) · `minutes`(9월 회의록 공개 — 대기 "Fact 승격")가 지금 비어 있다

---

## 7. DerivedClaim (질문 5)

### 7.1 실물 — 브리프 DC-A ~ E

| | 판정 표시 | 근거 사실 | 반증 기록 |
|---|---|---|---|
| DC-A | ✅ VALID | F28 · F02 | 물음 둘 — "9월에도 반대가 있었나?" → 없음 / "7월 반대자가 9월엔 투표권이 없었나?" → 셋 다 투표권자 (**F-ID 없음**) |
| DC-B | ⚠️ 방어용 | F32 F33 F30 F31 F36 F26 | "실제 내부 역학은 9월 회의록이 나와야 알 수 있다" — 미결 |
| DC-C | ✅ VALID → **VALID WITH SCOPE** | F32 F31 F16 F33 · 반증에서 F15 | "실제로 물가 전망이 악화됐지 않나?" → 부분적으로 사실 → 범위를 좁힘 |
| DC-D | ✅ VALID | F12 F13 F11 F14 | **없음** |
| DC-E | ✅ VALID (Deep) | F30 F09 | **없음** |

FTC 는 A~E 중 방어용 1(D), 스크루웜은 A~D 중 방어용 2(C · D). 모양은 같다.

### 7.2 모양

- `basis` — 해석이 기대는 사실. **골든 `_fact_refs_dropped` 가 가는 곳이다.** 0.1b 는 claim span 에서 Fact 연결을 끊고(D20 "refs 는 DC 만") 그 연결을 주석으로 남겼다.
  이미 DC 가 있는 span 17 개의 끊긴 연결은 **전부 브리프 DC 근거 안에 있다** (검사 C — 옮길 때 잃는 것이 없다). DC 가 아직 없는 대기 span 4 개의 끊긴 연결은 (이란 전망 문장은 끊긴 연결도 없다) C-5 가 만들 DC 의 근거 후보다
- `kind` — `DEFENSIVE` 는 우리 주장이 아니라 **독자가 자동으로 만들 오독을 막는 것**이다(브리프 DC-B: "이건 우리가 주장할 claim 이 아니라…"). 방어적 포함(§7.6)의 짝이다
- `checks` — 반증 기록. 확정 §7.2: 반증 후보 → 답할 슬롯 → 슬롯 상태 → (비었으면) 다시 모으기 → claim 수정.
  브리프는 물음과 답을 적었고 슬롯 이름은 적지 않았다 → `slot` 은 null 이 될 수 있다. 슬롯 연결의 실물은 FINDINGS §7.2 의 예(6월 SEP) 하나다
- `outcome` 은 실물 셋: `NOT_REFUTED`(DC-A) · `SCOPED`(DC-C) · `UNRESOLVED`(DC-B). 반증이 이긴 경우(claim 을 버림)는 **미확인** — 버린 claim 을 남길지 실물이 없다
- "(Deep)" 은 claim 의 속성이 아니다 — 어느 층에 앞세웠나(선택, §3.1)다. 저장하지 않는다

### 7.3 판정은 계산한다

| checks | 판정 |
|---|---|
| 1개 이상, 전부 `NOT_REFUTED` | VALID |
| `SCOPED` 가 있고 `UNRESOLVED` 가 없다 | VALID WITH SCOPE |
| 없다 | **검사 안 됨** — 발행 불가 |
| ASSERTED 인데 `UNRESOLVED` 가 있다 | **검사 안 됨** — 발행 불가 |
| DEFENSIVE 이고 `UNRESOLVED` 만 있다 | 방어용 — 발행 가능. "어느 쪽도 단정할 수 없다"가 그 해석 자체다(DC-B) |

- **왜 저장하지 않나** — 브리프에는 VALID 가 적혔는데 반증 기록이 없는 해석이 둘 있다(DC-D · DC-E). 판정을 따로 적을 수 있으면 검사 없는 VALID 가 생긴다.
  D23 이 드러낸 구멍("반증 검사를 거치지 않은 해석이 5개")과 같은 모양이다. 판정을 기록에서 계산하면 그 구멍이 구조로 막힌다
- `NOT_REFUTED` · `SCOPED` 는 답이 된 사실(`facts`)이 1개 이상이어야 발행한다. 실물: DC-A 둘째 답 "셋 다 2026년 투표권자"는 F-ID 가 없다 — 배경 지식에서 온 답이다(FINDINGS 오류 #4 와 같은 경로)
- `statement` 는 반증 뒤의 문장이다. DC-C 는 브리프가 "범위를 좁혀야 정확하다"고 하면서 제목 문장은 그대로 두었다 → 0.2m 에서 어느 문장을 넣을지는 C-5 (§18)

---

## 8. Bridge (질문 6)

### 8.1 실물

| | |
|---|---|
| FINDINGS §4.1 (확정) | `CONCEPT_BRIDGE` 개념 → 오늘 사건 · `STORY_BRIDGE` 이전 사건 → 오늘 사건 |
| CONCEPT_IDENTITY §6 | C-0002 v3 의 BridgeSlot `④` (after ③, "현재 상승률을 ③ 의 목표와 견주는 한두 문장") |
| 골든 입문 4장 | ③ → bridge 2 span("그런데 지금 미국은 3%대입니다." · "목표보다 빠르게 오르고 있어요.") → 속도계. refs 대기 "Bridge" |
| 골든 `_fact_refs_dropped` | 첫 span F31 · 둘째 span F10 · F31 |

### 8.2 모양

- **브리지 하나가 슬롯 하나를 채운다.** 골든 두 span 은 같은 Bridge 를 가리킨다 — 슬롯의 `need` 가 "한두 문장"이다
- **CONCEPT_IDENTITY 와의 짝** — Bridge 의 (`concept_id`, `concept_version`, `slot`) = 개념 버전 안의 BridgeSlot (`label`). CONCEPT_IDENTITY §6.2 가 0.2b 로 넘긴 모양이 이것이다.
  골든: (C-0002, 3, "④")
- **브리지는 사실을 품는다.** "그런데 지금 미국은 3%대입니다" 는 F31(7월 근원 PCE 3.3%)을 말한다. 그러나 span 하나에 층 하나라(ARTICLE_PACKAGE §6) span refs 에 F31 을 넣지 않는다 —
  Bridge 의 `facts` 가 갖는다. Claim 이 `basis` 로 사실을 갖는 것과 같은 방식이다. 독자가 브리지 문장의 근거를 누르면 Bridge → `facts` 로 F31 에 닿는다
- 브리지는 해석을 품지 않는다 — "목표보다 빠르게"는 3.3% 와 ③ 의 2% 를 대는 것이지 추론이 아니다. 해석을 품은 브리지의 실물이 나오면 다시 본다(**미확인**)
- 브리지가 품은 시간 조각은 TimeExpression 이 사실을 직접 가리킨다 — "지금 미국은 3%대" VOLATILE → F31 (층과 무관)
- 브리지 문장 자체는 저장하지 않는다. 글은 기사가 쓴다 (확정 §4.1 Writing Layer)
- `STORY_BRIDGE` — **실물 없음.** 골든의 "7월엔 셋만 … 이번엔 전원" 은 이전 사건을 오늘에 잇지만 해석(DC-A)으로 달렸다. 모양은 `from_event` + `facts` 까지만 둔다
- **슬롯 없는 개념 브리지**(`slot: null`) — FTC 브리프는 "Fact / Concept / Bridge 3층 그대로 작동"이라 적었지만 브리지 모양을 남기지 않았다. 실물 없음

### 8.3 검사 — CONCEPT_IDENTITY 불변식 13 의 뒷부분

CONCEPT_IDENTITY §6.3 규칙 1 은 "단계 A 를 옮긴 마지막 span 바로 다음이 `bridge` 층"까지 본다. 이 계약이 뒷부분을 채운다:
**그 bridge span 의 refs 가 가리키는 Bridge 는 (X, v, S) 를 채운다** (불변식 18). 빠지면 ④ 자리에 ④ 가 아닌 브리지 — 예컨대 다른 개념의 브리지 — 가 와도 통과한다.

---

## 9. Event · Storyline (질문 7)

### 9.1 Event

- 기사가 다루는 일 하나. 키는 UUID `event_id`, 사람이 부르는 이름은 `code` (D27 · §2.1). 골든 `event_ref` 의 "FOMC-20260916" 은 code 다 — 0.2m 에서 그 Event 의 UUID 로 바뀐다
- `occurred_at` 은 없을 수 있다. **실물**: 스크루웜 브리프 §0 "이 사건에는 그런 날짜가 없다. 6월 3일 첫 사례 이후 계속 진행 중". 스크루웜은 패키지가 없어 `event_ref` 가 무엇을 가리킬지 대 보지 못했다 → **미확인**
- Event 가 스토리라인에 속할 수 있다(`storyline_id`). FOMC 사건들을 묶는 스토리라인의 실물은 없다 — 브리프 "Storyline context" 표는 있지만 이름 · 버전이 없다

### 9.2 Storyline — 버전이 있는 독립 객체 (확정 §9.2)

- **자체 사실을 갖는다** — "참조 배열이 아니라 first-class object" (확정 §9.2). 늦게 도착한 사실은 원 기사를 고치지 않고 스토리라인에 붙인다
- 버전 = 사실이 붙는 단위. 사실이 붙을 때마다 버전이 오르고 StorylineVersion 한 행(날짜 · 한 줄)이 생긴다. 한 번 만든 버전은 고치지 않는다
- 버전 v 에서 아는 사실 = `storyline_id` 가 이 스토리라인이고 `storyline_version ≤ v` 인 Fact 전부. 목록을 버전에 따로 적지 않는다 — 사실 쪽 한 곳에만
- `ongoing` — "아직 진행 중인가"는 사실이 아니라 스토리라인이 답한다 (D8 규칙 5). **실물 없음**
- 갱신 주기가 다른 스토리라인이 한 기사에서 만난다 (확정 §9.2) — FOMC 는 7주, 이란 전쟁은 며칠. 기사 하나가 스토리라인 여럿을 고정할 수 있어야 한다(§9.4)
- 버전 이력의 실물은 없다 — 확정 §9.2 의 `S_v5 → S_v6` 예뿐. **실물 없음**

### 9.3 사실의 소유 — 사건 또는 스토리라인, 정확히 하나

- **실물 (도윤 관찰, 2026-09-21)**: 이란 사실은 FOMC 사건이 아니라 SL-iran-war 소속이다. 기사가 참조해야 할 사실을 스토리라인이 직접 갖는다
- 그래서 Fact 는 `event_id` · `storyline_id` 중 정확히 하나를 갖는다. 스토리라인 사실은 붙은 버전(`storyline_version`)도 갖는다
- 골든에서: F37(경유 가격 · 이란 전쟁) · 이란 대기 4 span 의 사실 → SL-iran-war. 나머지 F → FOMC-20260916 (브리프가 그렇게 묶었다). 여기 적은 이름은 code 이고, Fact 의 `event_id` · `storyline_id` 에는 UUID 가 들어간다
- 소유가 사건 → 스토리라인으로 옮겨가는 일은 발행 전에만 있다 — 발행 뒤에는 Fact 를 고치지 않는다(§2.3)

### 9.4 발행된 기사가 스토리라인 버전을 고정한다 — 필요하다. 패키지 밖에 둔다

**필요한가 — 필요하다.**
1. 확정 §9.2: "발행 시점: ArticlePackage v1 (storyline_snapshot = S_v5) ← 변하지 않음". 옛 기사를 다시 열면 "이후 새로 확인된 내용"을 따로 보여줄 수 있어야 한다 — 기준 버전이 있어야 "이후"가 있다
2. 확정 §6.2 `STORYLINE_STALE` — "참조하는 진행 중 사건의 현재 상태를 확인 안 함". 발행 때 무엇을 확인했는지 남아야 이 상태를 가릴 수 있다
3. `published_at` 으로 대신할 수 없다 — **실물**: 9/16 하루에 FOMC 결정과 경유 최고치(F37, SL-iran-war)가 같이 있다. 날짜만으로는 같은 날 붙은 버전의 앞뒤를 못 가린다(§5.3)

**어디에 — `ArticleRecord.authoring.storylines` (패키지 밖).**
- ARTICLE_PACKAGE §0: 패키지는 "프론트가 받아서 그리는 데 필요한 것"이고 Storyline 은 넣지 않는다. 프론트는 이 값으로 아무것도 그리지 않는다 — "이후 새로 확인된 내용"은 새 데이터라 어차피 패키지 밖에서 와야 하고, 그것을 계산하는 백엔드가 기록에서 기준 버전을 읽는다
- ArticleRecord 도 통째로 불변이라(§11) §9.2 의 "고정"이 그대로 지켜진다. §9.2 가 적은 `ArticlePackage (storyline_snapshot)` 은 계약 이전의 말이다 — 이 계약에서 그 자리는 ArticleRecord 다
- 발행 규칙 (불변식 13): 패키지가 닿는 사실의 스토리라인마다 핀이 있고, 핀 버전 = 그 스토리라인의 **발행 때 최신 버전**. 아니면 `STORYLINE_STALE`
- 골든: `SL-iran-war`(code) 하나 — 핀에는 그 UUID 가 들어간다. 버전 번호는 스토리라인을 만들 때(0.2m) 정한다

---

## 10. 인용 (질문 8)

### 10.1 인용 블록의 출처 표시는 무엇을 가리키나

**실물**
| 레벨 | `attribution` | body refs | `_attribution_refs` |
|---|---|---|---|
| 입문 6장 | "8월 말 · 의장 연설" | F33 · F33 | F32 · F33 |
| 숙련 2장 | "8/28 잭슨홀" | F33 | F32 · F33 |

- **같은 원문에 레벨마다 다른 표시가 붙었다.** `attribution` 은 독자에게 보이는 **글**이다(ARTICLE_PACKAGE §7.4) — 키가 아니다
- 그 글이 가리키는 것은 **원문 하나**다 — Warsh 잭슨홀 기조연설(Source Pack P3, 8/28). "8월 말" · "8/28" · "의장" · "연설" · "잭슨홀"은 전부 그 Source 의 서지다
- 그래서 **인용 블록의 출처 = body 의 FactRef → Fact → FactSource → Source.** 블록에 따로 Ref 를 싣지 않는다(패키지 모양 불변)
- 규칙 (불변식 19 · 20)
  - 인용 블록의 body 사실들은 **공통 Source 하나**에 원문 위치(FactSource)를 갖는다 — 인용 하나 = 원문 하나. 원문의 어느 구간인지가 그 span 이다 (ARTICLE_PACKAGE §3 · §7.4 가 0.2 로 넘긴 것)
  - 그 Source 의 발행처가 `can_quote` 이다 (확정 §5.1)
  - `attribution` 글이 그 Source 서지와 맞는지는 게이트 3 (날짜 · 화자 · 자리)
- 골든 `_attribution_refs` 의 F32 ("8/28 잭슨홀에서 Warsh 는 … 신호를 보냄")는 발언의 **자리**(날짜 · 행사)를 대던 사실이다. 그 일은 Source 서지가 한다 → 옮길 때 버린다. F33 은 body refs 에 이미 있다

### 10.2 인용부호는 글인가 표시인가 (FOMC-6)

**인용 블록 — 표시다. body 글에 넣지 않는다.**
- **실물**: FOMC 인용 2개는 body 에 따옴표가 없다. FTC observed 인용은 body 에 `"…"` 가 있다(`quotation_marks_in_text: true`) — FTC 를 옮길 때 뗀다
- 블록 타입(`quote`)이 이미 "원문"이라고 말한다. body 에 또 넣으면 두 번 적는 것이다 — ARTICLE_PACKAGE §9-8(강조를 두 번 적지 않는다)과 같은 규칙
- 따옴표 모양은 프론트가 한 곳에서 정한다 — 모든 인용이 같게 보인다 (D22 의 레벨 이름과 같은 이유)
- **원문 대조(§5.5)** — 인용 body 는 한국어, 원문은 영어다. 인용 글은 **번역**이고 글자 대조는 원문 쪽(FactSource span)에서 한다. 번역이 원문을 옮긴 것인지는 게이트 3 이다.
  번역이라는 표시를 독자에게 보일지는 **미확인**

**본문 속 따옴표 — 글이다. 단 누군가의 말로 읽히면 그 말이 원문에 있어야 한다.**
- D23 #16: 해석에 따옴표를 달자("'확신이 없다'고 말한") 독자는 원문으로 읽었다 — §8.4 의 약속을 가장 직접적으로 깬 사례였다. 독자에게 본문 따옴표는 원문 표시다
- 그래서 본문 따옴표 안이 **누군가 한 말로 읽히면** 그 span 은 `fact` 층이고 그 Fact 의 원문에 그 말(의 원어)이 있어야 한다. 누구의 말도 아닌 따옴표(예문 · 물음 이름 붙이기)는 글이다
- 기계는 어느 쪽인지 모른다 → 게이트 3. `--report` 가 골든의 본문 따옴표를 뽑는다. 지금 3 곳: 예문 2(“라면이 2000원이다” — concept) · 물음 이름 1(“물가가 나빠졌는가” — claim). 셋 다 발언을 옮긴 것이 아니다 (D27 확인)
- **고친 1 건 (D27 · 도윤 승인)** — 입문 7장 대조 "세 명만 “올리자”고 반대" → "세 명만 올리자고 반대" (fact F28). F28 은 "25bp 인상을 원해 반대"다. "올리자"는 그 사람들의 말을 옮긴 것이 아니라 바꿔 말한 것인데 따옴표가 발언으로 읽히게 했다 — D23 #16 과 같은 모양. 따옴표만 뺐다

---

## 11. ArticleRecord — 패키지와 저작 데이터

- **발행 한 번 = ArticleRecord 하나.** `package`(프론트로 간다) + `authoring`(가지 않는다). 둘 다 불변
- **실물**: 골든 파일 한 벌이 이미 이 모양이다 — 패키지 필드 + `_` 저작 주석. ARTICLE_PACKAGE §12-11 이 "`_volatility` · `_published_at_basis` 는 저작 데이터, 0.2 가 자리를 정할 때까지 `_` 주석"이라 했다.
  이 계약이 그 자리다: `_` 주석 → `authoring`
- 프론트는 `record.package` 만 받는다. `authoring` 은 발행 검사(D8 재계산 · 스토리라인 확인)와 뒤에 오는 백엔드 기능이 읽는다
- 패키지 자체의 ID · 저장 키 — **미확인** (ARTICLE_PACKAGE §10 과 같다. D1 백엔드 OPEN)

| 골든 `_` 주석 | 옮겨갈 곳 |
|---|---|
| `_volatility` | `authoring.time_expressions` + VOLATILE `as_of` → Fact (§6) |
| `_published_at_basis` | `authoring.notes` |
| `_fact_refs_dropped` | DerivedClaim `basis` · Bridge `facts` (§7 · §8). concept span 의 것 1개는 갈 곳이 없다 (§18) |
| `_refs_pending` | 채워지면 사라진다 (§17) |
| `_attribution_refs` | 버린다 — Source 서지가 대신한다 (§10.1) |
| `_source` | 픽스처의 출처 기록이다. 기사 데이터가 아니다 — 픽스처에 남는다 |

---

## 12. Coverage 슬롯 상태 — Fact 에 닿는 부분만 (확정 §6.2)

슬롯 정의 · 유형별 스키마는 이 계약 밖이다(**미확인** — Coverage Schema 문서화 작업). 확정 상태 코드 다섯이 Fact 와 어떻게 닿는지만:

| `status` | Fact 와의 관계 | 실물 |
|---|---|---|
| `FOUND` | 그 슬롯을 채운 사실 1개 이상 (`facts`) | FOMC 12 슬롯 |
| `NOT_EXTRACTED` | 자료는 있는데 못 뽑음 — `facts` 없음. 있는 자료를 `sources` 로 가리킬 수 있다 | FOMC "커뮤니케이션 변화"(S1 · P1 둘 다 있다) |
| `SOURCE_UNAVAILABLE` | 자료 자체를 확보 못 함 — `facts` 없음 | 실물 없음 |
| `NOT_APPLICABLE` | `facts` 없음 | FOMC "반대표 방향" |
| `STORYLINE_STALE` | 가리키는 스토리라인(`storyline`)의 현재 상태를 확인 안 함 | 실물 없음 — 이란 건에서 발견한 규칙이다(FINDINGS §7 표 스테이지 5) |

- NOT_EXTRACTED 와 SOURCE_UNAVAILABLE 을 뭉뚱그리면 진짜 결손과 작업 누락이 구분되지 않는다 (확정 §6.2) — 둘 다 `facts` 가 비지만 `sources` 가 가른다
- NOT_EXTRACTED 에 `sources` 를 필수로 둘지 **미확인**: 실물 "8월 CPI(9/11 발표) = NOT_EXTRACTED" 는 자료가 있다는 것을 알지만 Source Pack 에 없다
- **§7.2 와의 연결** — CounterCheck `slot` 이 이 슬롯 이름을 가리킨다. 반증 물음에 답할 슬롯이 비었으면 다시 모은다 (확정 §7.2)
- **실물이 확정 다섯 밖의 말을 쓴다**: `PARTIAL`(FOMC 실제 물가 수치 · FTC 적용 대상 · 업계 반응 · 스크루웜 다음 분기점) · "FOUND · VOLATILE" · "제외"(스크루웜 책임 소재) · §7.2 의 `EMPTY`.
  PARTIAL 은 한 슬롯 안에서 FOUND 와 NOT_EXTRACTED 가 섞인 것이다(FOMC: "7월 근원 PCE 확보, 8월 CPI NOT_EXTRACTED"). 슬롯을 나눌지 상태를 늘릴지는 Coverage Schema 의 일 → **미확인**. 이 계약은 확정 다섯만 둔다

---

## 13. ARTICLE_PACKAGE 와의 짝 (질문 9)

| ARTICLE_PACKAGE | 이 계약 |
|---|---|
| §0 "저장 구조 → 0.2. 여기서는 Ref 로만" | 저장 구조가 여기(와 CONCEPT_IDENTITY)에 있다. 패키지는 층별 Ref 로 가리킨다 (§2.2) |
| §1 `event_ref` | EventRef — Event 의 UUID (D27). 골든의 문자열은 `code` |
| §1 · §6 `refs: Ref[]` "Ref 의 모양은 0.2" | 층이 정한다 — FactRef · ClaimRef · BridgeRef · ConceptRef (§2.2) |
| §6 "Claim 이 어떤 Fact 에 기대는지는 Claim 이 안다 → 0.2" | DerivedClaim `basis` (§7) |
| §6.2 대기 `need` 넷 | §17 |
| §7.4 인용 — 원문 구간 · 인용부호 → 0.2 | §10 |
| §8 저작 데이터가 어디 붙나 → 0.2 | ArticleAuthoring (§6 · §11) |
| §2 `published_at` "기준 시각" · §1 `Date` | `"YYYY-MM-DD"` (§5.3) |

이번에 ARTICLE_PACKAGE 에서 고친 것은 §0 · §1 · §6 의 참조 문구와 CHANGELOG 뿐이다. 나머지 "→ 0.2" 문구(§2 · §3 · §7.4 · §8 · §10 · §12)와 §1 `published_at: Date` 는 그대로 두었다 — 지시 범위(§0 · §1 · §6 참조 문구) 밖이다. §18 목록.

---

## 14. 불변식

(기계) `scripts/verify-data-model.py` 가 지금 확인 · (0.4) 저장이 생기면 · (게이트) 사람 · (발행) 발행 검사.
지금은 발행물이 없다. `verify-data-model.py` 는 골든을 이 계약 모양으로 **메모리 안에서 옮긴 시험 사본**에 발행 검사를 돌려, 무엇이 막히는지 센다 (§18).

**식별 · 참조**
1. 모든 키는 UUID 이고 유일하며 바뀌지 않고 재사용되지 않는다. `label` 은 소유자 안에서, Event · Storyline 의 `code` 는 전체에서 유일하다. 패키지 `event_ref` 는 있는 Event 의 키다 — code 가 아니다 (기계: 시험 사본 · 0.4)
2. span refs 원소는 층이 정한 Ref 이고, 가리킨 것이 있다 — fact → Fact · claim → DerivedClaim · bridge → Bridge (기계)
3. 발행된 ArticleRecord 가 가리키는 Fact · DerivedClaim · Bridge · Source · SourceDocument 는 고치지 않는다 (0.4)

**Fact**
4. `fact_type` 은 7값 중 하나 (기계)
5. `OFFICIAL_CLAIM` · `OFFICIAL_LIMIT` 이면 `actor` 가 있다 (기계). 기사 글이 주장한 쪽을 밝히는지는 게이트 3 (`--report` 후보)
6. `VOLATILE` 이면 `as_of` 가 있다. `STABLE` 이면 없다 (기계)
7. `event_id` · `storyline_id` 중 정확히 하나. `storyline_id` 면 `storyline_version` 이 1 이상이고 그 스토리라인 버전 안이다 (기계)
8. (발행) 패키지가 닿는 Fact 는 원문 위치(FactSource)가 1개 이상이고, 그 Source 에 SourceDocument 가 있고 span 이 그 글 안이다 (확정 §5.5)
9. (발행) 패키지가 닿는 Fact 는 PRIMARY 출처가 1개 이상 (확정 §5.1 · D27)
10. 브리프 사실 표의 모든 타입이 §3.3 표에 있다 (기계)
11. (발행) 패키지가 닿는 Fact 의 `first_verified_public_at ≤ published_at` (확정 §5.3). 증명 못 하면 발행 안 한다

**시간 · 스토리라인**
12. 패키지 `published_at` 은 `YYYY-MM-DD` (기계)
13. (발행) 패키지가 닿는 사실의 스토리라인마다 핀이 있고, 핀 버전 = 발행 때 최신. 아니면 STORYLINE_STALE (§9.4)
14. StorylineVersion 은 1부터 1씩 빠짐없이, `Storyline.version` = 최대 (0.4)

**TimeExpression (D8)**
15. `at` 이 패키지의 글을 가리키고 `fragment` 가 그 글에 정확히 한 번 나온다 (기계)
16. VOLATILE — `facts` 1개 이상, 전부 VOLATILE Fact. DERIVED — 입력의 Fact 가 전부 STABLE (D8 규칙 4), 재계산 == 기록값 (D8 규칙 3) (기계)
17. (발행) DERIVED 재계산이 PASS (UNVERIFIABLE 불가) · 모든 입력에 `fact` (기계: 시험 사본은 WARN 으로 센다)

**Bridge**
18. Bridge `facts` 1개 이상 · CONCEPT_BRIDGE 면 `concept_id` · `concept_version` · 슬롯이 있으면 그 버전에 그 BridgeSlot 이 있다 · STORY_BRIDGE 면 `from_event` · `event_id` = 패키지 `event_ref`.
    CONCEPT_IDENTITY §6.3 규칙 1 의 bridge span 은 (X, v, S) 를 채우는 Bridge 를 가리킨다 (기계)

**인용**
19. 인용 블록 body 의 사실들은 공통 Source 하나에 FactSource 가 있다 (발행). 골든 이전 전: `_attribution_refs` ⊇ body refs (기계)
20. (발행) 그 Source 발행처가 `can_quote`. `attribution` 글이 그 서지와 맞는지는 게이트 3
21. 인용 블록 body 글이 따옴표로 시작하고 끝나지 않는다 (기계). 본문 따옴표가 누군가의 말로 읽히면 fact 층 + 원문에 그 말 — 게이트 3 (`--report` 후보)

**DerivedClaim**
22. `basis` 1개 이상 (기계). 골든 이전 전: DC 가 있는 claim span 의 `_fact_refs_dropped` ⊆ 브리프 그 DC 의 근거 (기계)
23. (발행) 판정(§7.3)이 VALID 또는 VALID WITH SCOPE, 또는 DEFENSIVE 이고 UNRESOLVED 만 · NOT_REFUTED · SCOPED 인 check 는 `facts` 1개 이상 (기계: 시험 사본은 WARN)

**Coverage**
24. FOUND 면 `facts` 1개 이상, 나머지 상태는 `facts` 없음. STORYLINE_STALE 이면 `storyline` (기계: 시험 사본에 슬롯이 들어오면. 지금은 0.4)

**대기**
25. 골든 대기 span 이 §17 표와 같다 — 글 · 층 · need (기계). 대기는 픽스처에서만 (ARTICLE_PACKAGE §6.2)

---

## 15. 미확인

| 항목 | 이유 |
|---|---|
| `actor` 의 모양 (문자열 / 기관 · 인물 ID) | 기관 · 인물 객체의 실물이 없다 |
| 원문 리터럴 대조를 언어가 다른 두 글에 어떻게 하나 | 원문을 보관한 적이 없다. "3.75~4.00%" 와 원문 표기가 같은지 대 본 적이 없다 |
| `as_of` 와 `first_verified_public_at` 이 같은 값인가 | 실물 `as_of` 는 모두 공개일이지만 브리프 사실에 출처가 없어 대 볼 수 없다 |
| TimePoint 구간 ("2023~") | 스크루웜 S25 하나. 쓰는 기사가 없다 |
| 시각이 필요한 DERIVED 식 | 실물 없음 (§5.3) |
| 선택 기록 (Core / Deep · 지지 / 방어) 의 모양 | 확정 §7.1 · §7.6 이 있지만 실물은 FOMC 브리프 §6 표 하나 |
| 반증이 이긴 claim 을 남기나 | outcome 실물은 셋뿐 |
| 해석을 품은 브리지 · 슬롯 없는 개념 브리지 · STORY_BRIDGE | §8.2 |
| 스토리라인 버전 이력 · `ongoing` 값 | 확정 §9.2 의 예 하나 |
| 날짜 없는 사건(상태축)의 `event_ref` | 스크루웜 패키지 없음 |
| `can_store` 가 거짓인 출처로 Fact 를 지을 수 있나 | 실물 없음. 확정 §5.1 과 §5.5 가 부딪힌다 |
| 번역 표시를 독자에게 보일지 | 프로토타입에 없다 |
| Coverage 슬롯 정의 · PARTIAL · NOT_EXTRACTED 의 `sources` 필수 여부 | §12 |
| 대체(supersede) 관계 — 새 Fact 가 옛 Fact 를 대신한다는 기록 | correction_log (0.2c) |
| ArticleRecord 의 저장 키 · 패키지 ID | D1 백엔드 OPEN · ARTICLE_PACKAGE §10 |

---

## 16. _open — 판정됨 → D27

2026-10-03 게이트. 판정자 PM (도윤 위임). 판단 순서 ① 독자 ② 기술.

| # | 무엇 | 판정 | 계약에서 |
|---|---|---|---|
| _open-1 | `fact_type` 을 §5.2 의 7값으로 닫는가 | 판정됨 → D27: **(a) 닫는다.** SELF_LIMIT → OFFICIAL_LIMIT(기관이 스스로 밝힌 한계) · HISTORICAL_CONTEXT → 1차 조치 기록을 출처로 OFFICIAL_ACTION · 배경 지식 → 말한 기관 자료의 OFFICIAL_CLAIM | §3.2 · §3.3 |
| _open-2 | 발행하려면 Fact 마다 1차 출처가 있어야 하는가 | 판정됨 → D27: **(a) 필수.** 1차 = 그 사실을 만들었거나 측정한 주체의 자료. 공적 기관이 없는 사건에서 1차가 정말 없으면 그때 다시 본다 | §4.3 · 불변식 9 |
| _open-3 | ID 체계 | 판정됨 → D27: Fact · Claim · Bridge · Source = UUID + `label` (추천대로). **Event · Storyline 도 UUID + `code` (추천과 다르다)** — 사건을 누가 고르나(D3)가 OPEN 인데 그 가정을 되돌릴 수 없는 키에 넣지 않는다 | §1 · §2.1 · §9 · §13 · §18 |
| — | 초안이 스스로 내린 판단 (0.2b 로그 "도출하며 판단한 것") | 판정됨 → D27: **수용** — volatility 두 곳 · 판정은 반증 기록에서 계산 · 스토리라인 핀은 ArticleRecord 에 · 발행 뒤 불변 · `published_at` = `"YYYY-MM-DD"` · 인용 블록 따옴표는 표시 · op 7개 | §5.3 · §6 · §7.3 · §9.4 · §10.2 |

D27 은 이 밖에 세 가지를 더 정했다 — 발행 검사가 막는 64 건을 누가 채우나(§17) · C-5 의 범위(§17) · 독자 글 수정 1건(§10.2, 도윤 승인).

---

## 17. 골든 대기 13 (질문 10)

`python3 scripts/verify-article.py` 가 WARN 으로 세는 13 span. 이 표는 `verify-data-model.py` 가 골든과 대조한다 (불변식 25).
**이 계약은 자리만 만든다.** 사실 · 해석 · 출처를 채우는 일은 하지 않았다.

| # | 레벨 · 장 | 글 | layer | need | 풀리는 곳 |
|---|---|---|---|---|---|
| 1 | basic 4 | 그런데 지금 미국은 3%대입니다. | bridge | Bridge | **이 계약** — Bridge 1개 (C-0002, 3, ④), `facts` F31 · F10. 0.2m 이 만든다 |
| 2 | basic 4 | 목표보다 빠르게 오르고 있어요. | bridge | Bridge | **이 계약** — 1 과 같은 Bridge |
| 3 | basic 7 | 회의 내부 기록은 3주 뒤에 공개돼요. | fact | Fact 승격 | **이 계약** 이 모양을 준다 — 브리프 §1 "아직 없는 것"(9월 회의록 → 10월 초, T+21)을 Fact 로. 출처가 Source Pack 에 없다 → 출처는 콘텐츠 **C-3** (D27) |
| 4 | basic 8 | 2월 말에 시작돼 반년 넘게 이어지고 있어요. | fact | Fact 출처 | 콘텐츠 **C-3** (개전일 — C-2 를 합쳤다, D27). 소유 SL-iran-war |
| 5 | basic 8 | 4월에 휴전 합의가 한 번 있었지만 … | fact | Fact 출처 | 콘텐츠 **C-3**. 소유 SL-iran-war |
| 6 | advanced 3 | 9월 초 | fact | Fact 출처 | 콘텐츠 **C-3** (D27). FOMC 쪽 날짜다 (D23 #25, 브리프는 9/15 만) |
| 7 | advanced 5 | 이란 전쟁은 201일째. | fact | Fact 출처 | 콘텐츠 **C-3** (개전일). 소유 SL-iran-war |
| 8 | advanced 5 | 4월 휴전 이후에도 공격이 반복되며 … | fact | Fact 출처 | 콘텐츠 **C-3**. 소유 SL-iran-war |
| 9 | basic 4 | 그리고 이 속도는 여름 내내 크게 줄지 않았어요. | claim | DerivedClaim | 콘텐츠 **C-5** — 도출 + 반증 (§7). 근거 후보 F24 · F32 |
| 10 | basic 7 | 그 사이 8월 말 의장이 앞의 기준을 밝혔고 … | claim | DerivedClaim | **C-5**. 근거 후보 F33 · F36 |
| 11 | basic 8 | 이 전쟁이 끝나면 물가는 저절로 내려갈 수도 … | claim | DerivedClaim | **C-5**. 근거 후보 없음 (D22) |
| 12 | basic 8 | 연준이 확신이 없다고 본 이유의 상당 부분이 … | claim | DerivedClaim | **C-5**. 근거 후보 F07 · F33 |
| 13 | advanced 5 | 1. 물가의 큰 부분이 전쟁에 달려 있습니다. | claim | DerivedClaim | **C-5**. 근거 후보 F07 · F37 |

- **이 계약으로 풀리는 것 3** — 브리지 2 (모양 + 채울 재료가 골든에 다 있다) · 사실 승격 1 (모양만. 출처는 C-3)
- **콘텐츠를 기다리는 것 10** — 사실 출처 5 (**C-3**) · 해석 도출 5 (**C-5**)
- 대기와 별개로 **C-5 가 받는 것 (D27)**: 브리프 DC-D · DC-E 는 반증 기록이 없다 · DC-A 둘째 반증 답은 F-ID 가 없다 · **DC-C 범위** — 브리프가 "범위를 좁혀야 정확하다"고 하고 문장을 안 좁혔다. DC-C 는 이 기사의 Common Goal 이라 C-5 의 첫 항목이다 (§7).
  골든이 이미 DC-D(5 span) · DC-E(3 span)를 가리키므로 발행 검사(불변식 23)에 걸린다

### 발행 검사가 막는 64 건 — 누가 채우나 (D27)

골든을 이 계약 모양으로 옮긴 시험 사본에 발행 검사를 돌리면 64 건이 막힌다 (`verify-data-model.py --report`). 계약이 틀린 게 아니라 손으로 만든 골든이 출처 작업을 건너뛰었다.

| 막히는 것 | 건 | 누가 | F-3 전에 |
|---|---|---|---|
| 대기 span (위 표에서 브리지 2 를 뺀 것) | 11 | C-3 (사실 6) · C-5 (해석 5) | 한다 |
| 1차 출처 없는 사실 | 9 | **C-3** | 한다 |
| 인용 블록의 원문 | 2 | **C-3** — 가장 급하다. "원문" 블록으로 나가는데 브리프에 연설 원문이 없다 | 한다 |
| DERIVED 입력 사실 · 증명 | 4 + 1 | **C-3** (개전일 · 회의록 공개일) | 한다 |
| 반증 기록 · 답의 근거 사실 | 2 + 1 | **C-5** | 한다 |
| 원문 위치 (span) | 25 | **파이프라인** — 손으로 안 한다. C-3 이 적은 원문 구절을 문서 저장 뒤 기계가 찾아 채운다 | 안 한다 |
| 공개 시점 증명 | 9 | **파이프라인** | 안 한다 |

---

## 18. 골든 · 브리프 → 이 계약 — 0.2m 작업 목록

`python3 scripts/verify-data-model.py --report` 가 목록과 수를 뽑는다. 골든 · 브리프는 이번에 고치지 않았다.

### 골든
| 지금 | 이 계약 | 비고 |
|---|---|---|
| `event_ref` "FOMC-20260916" | EventRef — **그 Event 의 UUID 로** (D27) | Event 행을 만들고 `code` 에 "FOMC-20260916" |
| fact refs `"F31"` 21 종 | FactRef (UUID) | Fact 발급 뒤 |
| claim refs `"DC-C"` 5 종 | ClaimRef (UUID) | |
| concept refs `"C-0002"` | ConceptRef | CONCEPT_IDENTITY §16 |
| bridge 대기 2 | BridgeRef 하나 | §17 #1 · #2 |
| `_fact_refs_dropped` — DC 있는 claim span 17 | 지운다 | 전부 브리프 DC 근거 안 (검사 C) |
| `_fact_refs_dropped` — 대기 claim span 4 | C-5 의 근거 후보 | §17 |
| `_fact_refs_dropped` — bridge span 2 | Bridge `facts` F31 · F10 | |
| `_fact_refs_dropped` — **concept span 1** (숙련 4장 "표결은 투표권자 12명이 하고 …", F02) | **갈 곳이 없다** | concept 층 refs 는 개념만. 버린다 — 독자 글 · 층은 그대로. 게이트에서 확인 |
| `_volatility` 29 | `authoring.time_expressions` 29 · `where` → `at` (레벨 기준 경로) | §6.3 |
| VOLATILE `as_of` | Fact F30 F31 F35 F36 F37 → `volatility: VOLATILE` + `as_of` | §6.2 |
| DERIVED 입력 `war_start` · `minutes` (refs 없음) | 입력 `fact` 대기 | C-3 (D27) |
| `_attribution_refs` 2 | 버린다 | §10.1 |
| `_published_at_basis` | `authoring.notes` | |
| (없음) | `authoring.storylines` — SL-iran-war 핀 (UUID) | §9.4. Storyline 행을 만들고 `code` 에 "SL-iran-war" |
| 파일 한 벌 | ArticleRecord `{ package, authoring }` | §11. 픽스처 파일 모양을 어떻게 나눌지는 0.2m |

### FOMC 브리프
| 지금 | 이 계약 | 비고 |
|---|---|---|
| F01~F38 | Fact 38 (나누면 41) | `label` = F-ID. `fact_type` 은 §3.3 |
| F29 · F32 · F37 | **나눈다** | 사실 하나에 두 종류 (§3.3). 브리프 수정 — C-3 |
| F06~F10 | `actor` "FOMC 성명문" | 글에 주어가 없다 (§3.4) |
| F37 | 소유 SL-iran-war | 도윤 관찰 |
| F28~F36 · F38 | 소유 FOMC-20260916 (브리프대로) | FOMC 스토리라인 객체는 실물이 없다 — 만들지는 PM |
| 출처 열 S1 (F01~F05) · 표 제목 (S1)(S2)(S3) · Storyline 표는 출처 없음 | FactSource | **원문 위치가 있는 사실 0 / 38.** 발행 검사(불변식 8)에 전부 걸린다. **손으로 채우지 않는다 (D27)** — C-3 은 사실마다 원문 구절을 그대로 적고, 글자 위치는 문서를 저장한 뒤 파이프라인이 구절을 찾아 채운다 |
| F03 "다수 보도" | PRIMARY 출처 필요 (D27) | C-3 |
| S1~S4 · P1~P4 | Source 8 — `kind` PRIMARY, 발행처 federalreserve.gov, `published_at` 은 Source Pack 표에서 | P2 는 "8/19 공개" |
| S3 preliminary | 확정본이 나오면 새 Source | §4.1 |
| DC-A~E | DerivedClaim 5 — `basis` 는 브리프 근거 · `kind` · `checks` | DC-C `statement`(좁힌 문장?) · DC-D · DC-E 반증 · DC-A 둘째 답의 F-ID → **C-5** |
| Coverage 15 슬롯 | SlotCheck — FOUND 12 · NOT_APPLICABLE 1 · NOT_EXTRACTED 1 · **PARTIAL 1** | PARTIAL 은 확정 코드 밖 (§12) |
| §1 "아직 없는 것" 9월 회의록 | Fact 승격 (§17 #3) | 출처 없음 |

### FTC · 스크루웜 브리프
골든 패키지가 없어 이번 이전 대상이 아니다. 옮길 때: §3.3 표 · 타입 없는 행 41 개(G15~G25 G30~G45 · S21~S34)는 행마다 · 스크루웜 "변동성" 열 → `Fact.volatility` (VOLATILE 4) ·
FTC 2차 경유 출처 S4~S6 → 1차를 읽어야 한다 (D27) · 세 브리프의 DC-A 등 label 충돌 → UUID (§2.1) · FTC observed 인용의 따옴표를 뗀다 (§10.2)

### 다른 곳 (이 계약을 따라 바뀔 것)
| 어디 | 무엇 | 누가 |
|---|---|---|
| `scripts/verify-article.py` | `F\d\d` · `DC-[A-Z]` 문자열 검사 · 브리프에서 ID 읽기 → Fact · Claim 저장소에서 | 0.2m |
| `packages/contract/src/types.ts` `Ref = string` · `validate.ts` `SPAN_REFS` | ConceptRef 는 객체다 (CONCEPT_IDENTITY §16 에 이미 있다). FactRef · ClaimRef · BridgeRef 는 문자열이라 그대로 | 프론트 레인, 골든 이전 전 |
| ARTICLE_PACKAGE §1 `published_at: Date` · §2 "기준 시각" | `string` `"YYYY-MM-DD"` 로 적는다 (§5.3) | ARTICLE_PACKAGE 수정 (이번 범위 밖) |
| ARTICLE_PACKAGE §2 · §3 · §7.4 · §8 · §10 · 부록 A 의 "→ 0.2" | 이 계약 절 번호로 | 같음 |
| ARTICLE_PACKAGE §12-6 "0.2 대기 7" | D23 이후 13 | 같음 |
| development-content | (D27 로 정해짐) "9월 초" · "3주 뒤" · 1차 출처 · 인용 원문 · DERIVED 입력 → C-3 · DC-D · DC-E · DC-A 둘째 답 · DC-C 범위 → C-5 | — |
