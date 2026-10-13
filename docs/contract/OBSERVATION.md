# OBSERVATION

## CHANGELOG
| 날짜 | 변경 | 세션 |
|---|---|---|
| 2026-10-09 | 초안 — FINDINGS §8.3 §9.3 §9.4 §9.5 §10.2 §10.3 확정 · `logs/correction-log.csv` 14행 · development-content 유형 표 9종 · `apps/web/src` 본 화면이 낼 수 있는 사건 · F-1 / F-2a 로그에서 도출. **게이트 전** | B-0.2c |
| 2026-10-09 | 게이트 반영 (D30) — _open 5개 모두 초안대로 닫음 · `response` · `is_correct` 자리 옮김 승인 · ArticleRef 의 짝이 DATA_MODEL 에 생김 · 독자 운영은 D31 · 미확인 셋을 §12 "F-3 전에 닫혀야 하는 것"으로 · 명제를 못 나누게 되는 순간 = 첫 KnowledgeEvidence 줄 | B-0.2c |
| 2026-10-09 | 0.2m-b — §8 의 집계를 "1~N행" 기준의 날짜 붙은 기록으로(행이 늘어도 안 깨진다) · 교정 기록 42행을 `logs/correction-log.jsonl` 로 옮김(SOURCE_RECHECK 첫 실물) · D26 반영: 읽기 사건의 실물을 B5 로, §5.4 · §12 를 "물음 버튼을 눌러야 넘어간다" 위에서 다시 씀 · D18 전제 바뀜 · _open 5개 (§16). **게이트 전** | B-0.2m-b |
| 2026-10-09 | 0.2m-a 뒤 맞춤 — §4.2 골든 표를 커밋 `03b6c3c` 에 묶인 기록으로 (C-4 뒤 C-0003 → C-0012) · Replacement 6건에 concept_id · 골든에 판의 키가 발급됨. 타입 · 불변식 불변 | B-0.2m-b |
| 2026-10-12 | 게이트 반영 (D33) — 읽기 사건 `SLIDE_END_SHOWN`(장의 끝이 화면에 나왔다 · 불변식 22) · 열람은 화면을 따른다 · 줄에 시험 표시를 두지 않는다 · 교정 기록의 원본은 jsonl, CSV 는 얼림 · `check` = 잡은 절차의 이름(불변식 20) · Probe 가 요점을 가리킨다(`goal_ref`: GoalRef) · §12 를 지금 상태로 · §16 판정됨 | B-0.2n-b |
| 2026-10-12 | 잔일 (D33 C-6 검수 · development-backend "계약 · 저장소 잔일") — CorrectionTarget.`kind` 에 `GOAL` (요점. 51 ~ 54행은 어휘에 없던 때라 `CLAIM` 으로 적혀 있다 — 원장은 고치지 않는다) · §8.4 `check` 이름 둘: `사실 글 ↔ 1차 구절 대조` · `요점 ↔ 해석 대조`. 다른 타입 · 불변식 불변 | B-0.4a |
| 2026-10-13 | 게이트 반영 (D34) — **원장은 받고, 검사는 읽을 때 한다.** 읽기 사건의 불변식 8 을 "온전한 열람의 성질"로 고쳐 씀 ((열람 · `seq`)는 유일하기만 하면 된다 — 빈 곳 · 뒤바뀐 도착 순서를 받는다) · 불변식 9 · 10 · 11 · 22 는 넣을 때 거부하는 조건이 아니라 읽을 때 열람마다 보는 성질 (§11 머리 · §5.5) · §3 대응표의 이름표는 사람을 알아볼 수 없는 부호 · §4.1 · §12 를 지금 화면(F-2b · 0.4b)에 맞춤. **타입의 칸 · 값은 하나도 안 바뀌었다** | B-0.4b |
| 2026-10-13 | 게이트 반영 (D35) — **plan 도 받는다**: 불변식 3 · 5 · 7 은 넣을 때 거부하는 조건이 아니라 읽을 때 열람마다 보는 성질 (§11 plan 머리 · §5.5). plan 이 거부되면 그 레벨의 사건이 전부 따라 거부되기 때문이다 · §3 기록은 사람이 처음 손을 댄 뒤부터 보낸다 (미리보기 로봇) · §2.1 화면은 판의 키를 빌드할 때 싣는다. 타입의 칸 · 값 불변 | B-0.4c |
| 2026-10-13 | F-3 첫 회의 물음 (D37) — §6 물음의 첫 실물 넷 (판 1) · §6.1 형식: 고르기 · 쓰기, "잘 모르겠다"는 보기의 하나, `is_correct` 는 서버가 가리고 쓴 답은 null · §6.3 답은 "다음"을 누를 때 한 번 정해진다 · 물음은 기사 앞뒤의 따로 선 화면이라 `shown_at_loc` 은 null · §3 동의 전에는 기록하지 않는다 (동의는 원장 밖) · 무리를 적는 칸이 없다 · §12 · §13 을 지금 상태로. **타입의 칸 · 값 불변** | B-0.5 |

> **상태: 게이트 통과 — 0.2c (D30, §14) · 0.2m-b (D33, §16). 열린 _open 없음.**
> 기록하지 않은 관찰은 복구할 수 없다 (확정 §9.4). 이 계약은 두 가지 기록의 모양을 정한다 —
> **독자 기록**(독자가 무엇을 했나 · 시스템이 무엇을 보여줬나)과 **교정 기록**(게이트에서 무엇을 고쳤나).
> 독자 기록은 실제 독자의 것이 아직 한 줄도 없다 (0.4b: 화면이 읽기 기록을 남긴다 — 이 컴퓨터에서, 시험 독자로만). 교정 기록은 실물이 있다 — 초안은 첫 14행에서 나왔고, 그 뒤로 늘었다 (§8).
>
> **원천 (D24)**
> - 실물 — `logs/correction-log.jsonl` (원본 · D33) · 얼린 `logs/correction-log.csv` (8열 · 42행. 초안 때는 14행이었다) · `docs/development-content.md` "correction_log" 절 (유형 9종 · 유형 규칙) ·
>   `apps/web/src` 본 화면 (`ArticleReader.tsx` — 레벨 전환 · 지금 장 계산 · 마지막 장) · `lab/b5/ReaderB5.tsx` (D26 의 기준 구현) · `logs/frontend/F-1.md` · `F-2a.md` ·
>   골든 `fixtures/fomc-2026-09.article.json` 의 concept span 21 (레벨마다 어느 개념의 어느 문안이 있나)
> - 확정 — FINDINGS §8.3 · §9.3 · §9.4 · §9.5 · §10.2 · §10.3 · D17 · D20 · D25 · D26 · D27 · D33
> - **원천이 아닌 것** — FINDINGS §13(단계 계획)은 "확정" 표시가 없다. Phase 1 게이트에서 온 것은 §12 에 모으고 **미확인**으로 둔다
>
> **표시** — **실물** 근거 있음 · **확정 §x** FINDINGS 확정에서 옴 · **실물 없음** 확정에서 왔지만 사례가 없다. 첫 사례가 나오면 다시 본다 ·
> **미확인** 둘 다 아니라 정하지 않았다 · **D30** · **D33** 게이트 판정 (§14 · §16)
>
> **검사** — `python3 scripts/verify-observation.py` (`--report` 로 옮긴 교정 기록을 행마다) ·
> 자체 시험 `python3 scripts/selftest-verify-observation.py`

---

## 0. 범위

**이 계약이 주인인 것** — KnowledgeEvidence · ExposureContext · ReadingPlanLog · BlockDecision · ProbePlanItem · ReadingEvent ·
Probe · ProbeTarget · ProbeExposure · ProbeResponse · CorrectionEntry · CorrectionTarget · Replacement,
그리고 가리키는 모양 ArticleRef · SlideLoc.

**안 넣는 것**
- **기록을 해석한 값 전부.** 증거 한 줄이 얼마만큼의 뜻인지, 며칠이 지나면 어떻게 되는지, 한 개념의 증거가 다른 개념에 닿는지,
  언제 SKIP · REFRESHER · FULL 로 가르는지 — FINDINGS §9.6 보류 항목이다. 이 계약에는 숫자가 하나도 없다
- **`user_concept_state`.** 원장에서 언제든 다시 셈하는 projection 이다 (확정 §9.4). 모양을 정하지 않는다.
  지식 상태를 읽는 길은 함수 하나 · 호출 지점 하나이고, 그 함수의 모양도 여기 없다
- **probe 를 어디에 놓을지** (D18 OPEN). 여기는 "물었다 · 답했다"가 남는 모양만
- **넘기는 방식** (D26 — 정해졌다: 한 번에 한 장, 물음 버튼으로). 그래도 읽기 사건은 방향 · 손짓을 모른다 (§5)
- 화면 구현 · 사건 전송 · 저장 기술 · 테이블 설계 (D1 백엔드 OPEN)
- Concept · ConceptRef → CONCEPT_IDENTITY. Fact · Claim · Bridge · Event · ArticleRecord 와 그 참조 → DATA_MODEL.
  레벨 · 슬라이드 · 블록 → ARTICLE_PACKAGE. 여기서는 가리키기만 한다

---

## 1. 한눈에

```ts
UUID      = string
Timestamp = string                 // "2026-10-09T05:12:33Z" — UTC, 초 단위 이상

// ── 가리키기 (§2) ──────────────────────────────────────────────────────────
ArticleRef {                       // 발행 한 번 = ArticleRecord 하나 (DATA_MODEL §11)
  article_id:      UUID            // 확정 §9.4. ArticleRecord 의 `article_id` (DATA_MODEL §11 · D30)
  article_version: integer         // 확정 §9.4 · §9.2 "ArticlePackage v1"
}

SlideLoc {                         // 그 판 · 그 레벨 안의 자리. 위치로 가리킨다
  slide_index: integer             // 0부터. Level.slides 배열의 위치
  block_index: integer | null      // 0부터. 슬라이드 전체면 null. 확정 §9.4 content_block_id 의 자리
}

// ── 시스템이 무엇을 보여줬나 (§4) ──────────────────────────────────────────
ReadingPlanLog {
  plan_id:           UUID
  user_id:           UUID          // §3
  session_id:        UUID          // 한 번 앉아서 읽은 묶음. 경계는 미확인 (§6.4)
  reading_id:        UUID          // 기사 한 건을 한 번 연 것. 같은 열람 안에서 레벨마다 plan 하나
  article_id:        UUID
  article_version:   integer
  created_at:        Timestamp
  level:             LevelId       // ARTICLE_PACKAGE §3 의 id 그대로
  level_chosen_by:   "DEFAULT" | "READER"     // 실물 — 지금 화면은 첫 레벨을 먼저 보여주고 독자가 바꾼다
  estimator_version: string | null // 정적 레벨이면 null (확정 §9.3). 실물 없음
  selected_blocks:   SlideLoc[] | null        // 정적 레벨이면 null — 레벨 전체가 선택이다. 실물 없음
  skipped_blocks:    SlideLoc[] | null        // 위와 같다
  block_decisions:   BlockDecision[]          // 이 기사가 닿는 개념마다 하나 (§4.2)
  narrative_form:    string | null            // 확정 §9.4 가 이름만 두었다. 어휘 · 원천 미확인
  probe_plan:        ProbePlanItem[]          // 0개 이상. 자리는 적지 않는다 (D18)
}

BlockDecision {
  concept_id: UUID
  version:    integer              // 그 기사가 쓴 ConceptVersion — ConceptRef.version 과 같은 수
  decision:   "SKIP" | "REFRESHER" | "FULL"   // 확정 §9.4. ConceptRef.part 와 같은 말 (§4.2)
  reason:     string               // 정적 레벨이면 "STATIC_LEVEL". 다른 값은 실물 없음
}

ProbePlanItem { probe_id: UUID, probe_version: integer, probe_type: ProbeType, position: Position }

// ── 독자가 무엇을 했나 — 읽기 (§5) ─────────────────────────────────────────
ReadingEvent {
  event_id:     UUID
  user_id:      UUID
  session_id:   UUID
  reading_id:   UUID
  plan_id:      UUID               // 사건이 일어난 레벨의 plan
  seq:          integer            // 한 열람 안에서 유일. 온전한 열람이면 0부터 1씩 (불변식 8 · D34). 순서는 이것으로 정한다
  occurred_at:  Timestamp
  type:         "SLIDE_ENTERED" | "SLIDE_END_SHOWN" | "LEVEL_SWITCHED" | "CLOSED"
  slide_index:  integer | null     // SLIDE_ENTERED · SLIDE_END_SHOWN 일 때만
  from_plan_id: UUID | null        // LEVEL_SWITCHED 일 때만 — 떠난 레벨의 plan
}

// ── 독자가 무엇을 했나 — 개념에 대해 (§7) ──────────────────────────────────
KnowledgeEvidence {
  event_id:         UUID
  user_id:          UUID
  concept_id:       UUID           // leaf 개념. 기록할 때 MERGED 가 아니다 (CONCEPT_IDENTITY §8 · §10.2)
  content_version:  integer        // 그 개념의 ConceptVersion.version — 물음이 겨눈 판 · 독자가 본 판
  timestamp:        Timestamp
  evidence_type:    "PROBE_RESPONSE" | "SELF_REPORT_KNOWN"   // 한 일의 종류만. 실물 없음
  position:         Position | null          // PROBE_RESPONSE 면 필수
  interaction_id:   UUID           // 독자의 행동 한 번. 여러 줄이 같은 값을 가질 수 있다
  probe_id:         UUID | null    // PROBE_RESPONSE 면 필수
  article_id:       UUID | null    // 기사 안에서 일어났으면 그 판. plan 이 있으면 plan 의 것과 같다
  article_version:  integer | null
  content_block_id: SlideLoc | null          // 기사 안이면 어느 자리에서
  exposure_context: ExposureContext
  model_version:    string | null  // 확정 §9.4 가 이름만 두었다. 지금은 모델이 없다 — null. 뜻 미확인
}

ExposureContext {                  // 이 증거를 읽으려면 무엇을 봐야 하나 — 복사하지 않고 가리킨다 (§7.3)
  session_id: UUID
  reading_id: UUID | null          // 기사 밖(며칠 뒤 다시 묻기)이면 null
  plan_id:    UUID | null
}

// ── probe (§6) — 전부 실물 없음 ───────────────────────────────────────────
Position  = "PRE" | "POST" | "DELAYED"                              // 확정 §9.4
ProbeType = "DIAGNOSTIC" | "ACTIVE" | "AUDIT" | "COMPREHENSION"     // 확정 §9.4

Probe {                            // 물음 한 판. 만든 뒤 고치지 않는다
  probe_id:       UUID
  version:        integer          // 1부터 1씩. 글자가 하나라도 바뀌면 새 판
  created_on:     string           // 날짜
  event_id:       UUID | null      // 어느 사건의 물음인가
  goal_ref:       GoalRef | null   // 어느 요점에서 만들었나 — DATA_MODEL 의 Goal (D33). 요점에서 나오지 않은 물음이면 null
  targets:        ProbeTarget[]    // 0개 이상 (§6.1)
  prompt:         string
  choices:        string[] | null  // 고르는 물음이면
  correct_choice: integer | null   // choices 의 위치
}

ProbeTarget { concept_id: UUID, version: integer }

ProbeExposure {                    // 물음을 보여줬다. 답이 없어도 남는다
  exposure_id:   UUID
  user_id:       UUID
  session_id:    UUID              // 예산은 세션 단위로 센다 (확정 §9.4)
  probe_id:      UUID
  probe_version: integer
  probe_type:    ProbeType         // 왜 물었나. 물음의 속성이 아니라 묻기의 속성이다 (§6.2)
  position:      Position
  plan_id:       UUID | null       // 기사를 읽는 중이면
  shown_at_loc:  SlideLoc | null   // 실제로 나온 자리. 놓을 자리를 정하는 칸이 아니다 (D18)
  shown_at:      Timestamp
}

ProbeResponse {                    // 독자가 답했다. 답 하나 = 행동 한 번
  interaction_id: UUID
  exposure_id:    UUID
  user_id:        UUID
  responded_at:   Timestamp
  response:       string           // 고른 것 또는 쓴 글. 그대로
  is_correct:     boolean | null   // 가릴 수 없으면 null
}

// ── 교정 기록 (§8 · §9) ───────────────────────────────────────────────────
CorrectionEntry {
  correction_id:     UUID
  date:              string        // "YYYY-MM-DD" — 실물
  event_code:        string | null // Event.code "FOMC-20260916" — 실물 전부. 사람이 쓰는 기록은 code 로 부른다 (D27)
  gate:              "GATE_1" | "GATE_2" | "GATE_3" | "GATE_4" | null   // 확정 §10.2. 편집 게이트 밖이면 null
  occasion:          string        // 언제 개입했나 — "0.0b 교정" · "C-1 린트" · "0.2b 게이트". 실물
  stage:             string | null // 오류가 생긴 파이프라인 단계. 어휘 미확인 (§8.2)
  targets:           CorrectionTarget[]   // 1개 이상. 무엇을 고쳤나
  error_type:        "팩트 누락" | "Goal 왜곡" | "오독 미방어" | "스토리라인 stale" | "압축" | "시점 앵커 누락" | "원문 불일치" | "축약 변질" | "레이어 혼입"
  type_note:         string | null // 왜 이 유형인가 — 성격과 처방 (유형 규칙). 실물은 what_i_changed 글 안에 적었다
  what_was_wrong:    string
  what_i_changed:    string
  caught_by:         "BACKGROUND_KNOWLEDGE" | "SOURCE_RECHECK" | "PLAIN_READING" | "OTHER_READER" | "AUTOMATED_CHECK" | "ARTIFACT_COMPARE"
  check:             string | null // 잡은 절차의 이름 — "lint-1" · "반증 검사" (D33). 기계 검사면 필수. 자동화는 이 칸으로 센다
  catch_note:        string | null // 발견 경위. 실물의 source_of_catch 글 그대로
  time_spent_min:    integer | null       // 실물에서 한 번도 적지 않았다
  after_publication: boolean       // 발행된 것을 고쳤나. 실물 전부 false — 발행된 기사가 없다
  replacements:      Replacement[] // 0개 이상 (§9)
}

CorrectionTarget {
  kind:  "ARTICLE" | "CONCEPT" | "FACT" | "CLAIM" | "GOAL" | "BRIDGE"   // 실물 ARTICLE · CONCEPT · FACT · CLAIM (43행부터). GOAL · BRIDGE 실물 없음 (§8.2)
  code:  string                    // 사람이 부르는 이름 — "FOMC-20260916" · "C-0002" · "F31" · "DC-C" · "COMMON"
  where: string | null             // "입문 3장" · "REFRESHER" 같은 자리. 글
}

Replacement {                      // 무엇이 무엇을 대신하나. 옛 것은 고치지도 지우지도 않는다
  kind:    "FACT" | "CLAIM" | "BRIDGE" | "CONCEPT_VERSION"
  old_id:  UUID                    // Fact · Claim · Bridge 의 키. CONCEPT_VERSION 이면 concept_id
  old_version: integer | null      // CONCEPT_VERSION 일 때만
  new_id:  UUID | null             // null = 대신할 것 없이 거둔다. 실물 없음
  new_version: integer | null      // CONCEPT_VERSION 일 때만
}
```

`LevelId` 는 ARTICLE_PACKAGE §3 이, `GoalRef` 는 DATA_MODEL §2 가 주인이다. 여기서 다시 정의하지 않는다.

**원장은 덧붙이기만 한다.** KnowledgeEvidence · ReadingPlanLog · ReadingEvent · ProbeExposure · ProbeResponse · CorrectionEntry 의 줄은
쓴 뒤에 고치지도 지우지도 않는다. 확정 §9.4: 모델은 나중에 원장에서 다시 셈한다 — 원장이 바뀌면 다시 셈한 값이 예전과 달라진다.

---

## 2. 무엇을 봤는지 가리키기 (질문 5)

기록은 "어느 기사의 어느 판 · 어느 레벨 · 어느 슬라이드"를 가리켜야 한다.

### 2.1 기사의 판 — ArticleRef

- **확정 §9.4** 가 `article_id` · `article_version` 을 적었고, **확정 §9.2** 가 "ArticlePackage v1 ← 변하지 않음"이라 했다
- **가리키는 것은 ArticleRecord 하나다** — 발행 한 번 (DATA_MODEL §11). 패키지와 저작 데이터가 함께 불변이라 한 번 가리키면 영원히 같은 글이다
- **짝은 DATA_MODEL §11 에 있다 (D30).** ArticleRecord 가 `article_id` · `article_version` 을 갖는다 — 불변이고, 둘의 짝은 전체에서 유일하다.
  이 칸이 없으면 독자 기록을 한 줄도 쓸 수 없다
- **골든에 발급됐다 (0.2m-a).** `fixtures/fomc-2026-09.record.json` 이 `article_id` · `article_version` 을 갖는다.
  화면은 빌드할 때 패키지와 이 키를 같이 싣는다 (D35 — 첫 화면은 데이터베이스를 읽지 않는다. 판은 불변이다). 같은 판이 데이터베이스에도 있어야 plan 이 그것을 가리킬 수 있다
- `event_ref` 로 대신할 수 없다. 사건 하나에 기사가 하나라는 근거가 없고, 같은 기사를 고쳐 다시 내면 판이 달라진다
- **무엇이 새 판을 만드나 — 미확인.** 확정 §9.2 는 늦게 온 사실을 원 기사가 아니라 스토리라인에 붙인다고 했다. 판이 2 가 되는 실물이 없다

### 2.2 레벨과 자리 — 위치로 가리킨다

- 레벨은 `LevelId`. plan 이 갖는다. 한 plan 은 한 레벨이다
- 슬라이드는 `slide_index`, 블록은 `block_index`. **ID 를 새로 만들지 않는다** — ARTICLE_PACKAGE §4: "순서는 배열 순서다. `index` 필드는 두지 않는다 — 위치에서 나온다".
  판이 불변이라 (판 · 레벨 · 위치)는 언제 풀어도 같은 글을 가리킨다
- 확정 §9.4 의 `content_block_id` 가 이 자리다. 이름은 그대로 두고 모양만 SlideLoc 으로 정했다
- open_question 은 슬라이드 사이에 있다 (D17). `slide_index` i 와 i+1 사이의 물음을 가리킬 일이 생기면 그때 정한다 — 지금은 가리키는 기록이 없다. **미확인**
- span 을 가리키는 기록은 없다. 문장을 눌러 층을 본 것(B5)을 남길지는 **미확인** (§13)

---

## 3. 독자 (질문 6)

- **확정 §9.4** 가 `user_id` 를 적었다. 그 밖은 아무것도 정해지지 않았다
- `user_id` 는 **뜻 없는 UUID** 다. 사람 · 기기 · 계정에서 계산해 만들지 않는다
- **원장에 넣지 않는 것** — 이름 · 연락처 · 계정 · 기기 식별값 · 접속 주소 · 위치. 이 계약의 어느 타입에도 그런 칸이 없다
- **같은 사람은 며칠 뒤에도 같은 `user_id` 여야 한다.** DELAYED 는 같은 사람에게 다시 묻는 것이다 (확정 §9.4 "며칠 뒤 재정답").
  화면은 독자를 기억하지 않는다 — `user_id` 는 독자별 링크에서 온다 (D34. 며칠 뒤 되찾는 방법은 D31)
- **계약은 여기까지다 — 원장에 사람을 알아볼 값이 없다 (D30).**
  누가 어느 `user_id` 인지의 대응표 · 동의 · 보관 기간 · 독자의 배경(뉴스를 얼마나 보나) · 며칠 뒤 같은 `user_id` 를 되찾는 방법은
  계약 밖이다 → **D31 (OPEN).** 대응표는 원장에도 저장소에도 두지 않는다
- **D34 — 데이터베이스에 두는 대응표(`identity.reader`)의 이름표는 사람을 알아볼 수 없는 부호다** ("R-07").
  원장과 같은 데이터베이스의 다른 schema 에 `user_id` ↔ 이름표만 둔다 — 이름 · 연락처를 담지 않는다. **누가 R-07 인지는 저장소 · 데이터베이스 밖에 둔다** (위 줄 그대로).
  지키려는 것: 원장의 백업을 받은 사람이 독자가 누구인지 모른다. 원장의 줄은 이 표를 가리키지 않는다. 로그인을 붙일 때 다시 본다
- **이 표에 없는 `user_id` 의 줄 · `user_id` 없는 요청은 기록하지 않는다 (D34).** 읽기는 된다. 링크 없이 온 사람도 같다
- **동의 전에는 아무것도 기록하지 않는다 (D37).** 독자가 안내를 읽고 "시작할게요"를 누르기 전의 plan · 읽기 사건 · 노출 · 응답은 만들지도 받지도 않는다.
  눌렀다는 사실과 때는 **원장 밖**에 둔다 (대응표 옆 — 이 계약의 타입이 아니다). 원장의 줄은 그것을 가리키지 않는다
- **무리(Claro · 일반 기사)를 적는 칸이 없다 (D37 · D30).** 두 무리는 주소로 가른다. 누가 어느 무리인지는 배정표(도윤의 명단)에만 있다.
  원장에서 보이는 것은 사실뿐이다 — 직후 물음의 노출이 plan 을 가리키면 그 독자는 그 판을 읽은 뒤에 답한 것이다
- **기록은 사람이 처음 손을 댄 뒤부터 보낸다 (D35).** 터치 · 휠 · 키 · 클릭. 그 전의 줄은 화면이 쥐고 있다가 그때 같이 보낸다 — `occurred_at` 은 일어난 때 그대로다.
  손을 대지 않고 떠나면 0줄이다. 메신저의 미리보기 로봇이 독자의 링크를 열어도 그 독자의 열람으로 남지 않게 하려는 것이다.
  **잃는 것**: 열고 아무것도 건드리지 않은 채 떠난 사람. 원장에 열람이 없다는 것은 "열지 않았다"와 "열고 손대지 않았다"를 가르지 못한다
- **줄에 시험 · 실제를 가르는 표시를 두지 않는다 (D33).** 어느 타입에도 그런 칸이 없다 — 표시가 있으면 표시를 잘못 단 줄이 생긴다. 섞이지 않게 한다:
  - 시험 경로(지금은 `/test`. `/lab` 은 F-2b 가 지웠다)는 **기록을 남기지 않는다**
  - 개발 중인 화면은 실제 독자의 원장에 쓰지 않는다
  - 본 화면을 연 사람이 실제 독자인지는 **`user_id` 가 배정표(D31)에 있는가**로 가른다. 배정표에 없는 `user_id` 의 줄은 독자 기록으로 세지 않는다

---

## 4. reading_plan_log — 시스템이 무엇을 보여줬나 (질문 2)

확정 §9.4: 이것이 없으면 독자가 한 일을 읽을 수 없다. "FULL 설명 뒤의 정답과 SKIP 뒤의 정답은 완전히 다른 의미다."

### 4.1 정적 레벨에서 plan 은 무엇인가

- **확정 §9.3**: MVP 는 독자가 고르는 3단계 정적 레벨이다. 시스템이 고르는 것이 없다. 그래서 plan = **"이 독자에게 이 판의 이 레벨을 보여줬다"**
- **열람은 화면을 따른다 (D33).** 열람 = 화면이 기사를 처음부터 한 번 보여준 것.
  새로고침 뒤 화면이 **읽던 자리를 되살리면 같은 열람**이고(`reading_id` 그대로, `seq` 이어서), **1장부터 다시 보여주면 새 열람**이다.
  기록이 화면과 다른 말을 하지 않게 하려는 것이다. 새 열람이어도 `user_id` · `session_id` 가 같아 이어 볼 수 있다.
  자리를 되살릴지는 화면의 일이다. **지금 화면은 같은 탭에서 되살린다** (D26 닫힘 · F-2b) — 그래서 같은 탭의 새로고침은 같은 열람이고,
  탭을 닫았다 다시 열면 1장부터라 새 열람이다. 되살린 장은 지금 장이 **바뀐** 것이 아니다 — `SLIDE_ENTERED` 를 다시 남기지 않는다 (§5.1)
- **plan 은 (열람 · 레벨)마다 하나다.** 기사를 열면 첫 레벨의 plan 이 생기고, 레벨을 바꾸면 그 레벨의 plan 이 생긴다.
  같은 열람에서 먼저 보던 레벨로 돌아오면 그 plan 을 다시 쓴다 — 보여주는 것이 같기 때문이다
- `level_chosen_by` — **실물**: 화면은 `pkg.levels[0]` 을 먼저 그리고(`ArticleReader.tsx`), 독자가 버튼으로 바꾼다.
  깊이는 독자가 선언하는 값이다 (확정 §9.1). 그냥 놓인 레벨과 독자가 고른 레벨은 다른 사실이다
- `estimator_version` · `selected_blocks` · `skipped_blocks` — 정적 레벨에서는 셋 다 null. **실물 없음.**
  레벨이 곧 선택이고, 판이 불변이라 (판 · 레벨)에서 그대로 나온다. 같은 것을 두 번 적지 않는다
- `narrative_form` — 확정 §9.4 "서사 형식도 기록". 패키지에 그런 칸이 없고 어휘도 없다. **미확인.** 채울 원천이 생길 때까지 null
- `probe_plan` — 물으려던 것. 실제로 물은 것은 ProbeExposure 다 (§6). 둘은 다른 사실이다 — 물으려 했지만 못 물은 것이 있다.
  **자리는 적지 않는다** (D18)

### 4.2 `block_decisions` — ConceptRef.part 와 같은 말을 쓴다

확정 §9.4 의 값은 SKIP · REFRESHER · FULL 이다. CONCEPT_IDENTITY §3.3 (D25)이 "`block_decisions` 의 FULL · REFRESHER 와 같은 말을 쓴다"고 했다. 그대로 잇는다.

| `decision` | 그 레벨의 concept span 이 가진 `part` |
|---|---|
| `FULL` | 그 개념의 `FULL` 또는 `FULL:…` 이 하나라도 있다 |
| `REFRESHER` | `FULL` 은 없고 `REFRESHER` 가 있다 |
| `SKIP` | 둘 다 없다 — 그 개념의 span 이 아예 없거나, `part` 가 `null` · `ANALOGY:…` · `BOUNDARY` 뿐이다 |

- **목록에 오르는 개념** = 그 판의 패키지가 **어느 레벨에서든** 가리키는 개념 전부. 그래야 SKIP 이 남는다
- `version` = 그 패키지의 ConceptRef.`version`. 한 판 안에서 한 개념은 한 버전이다
- **실물** — 골든 `03b6c3c` (0.2m-a 가 옮긴 뒤. 참조가 ConceptRef 라 `part` 를 그대로 읽는다).
  **이 표는 그 커밋의 골든에 대한 기록이다.** 골든이 바뀌어도 이 표는 안 바뀌고, 검사는 그 커밋의 골든으로 견준다:

| 개념 | 입문 | 숙련 |
|---|---|---|
| C-0001 | FULL + 비유 (5장) | SKIP |
| C-0002 | FULL ①②③ + 비유 (3 · 4장) | SKIP |
| C-0005 | SKIP | REFRESHER (4장) |
| C-0012 | **SKIP** — 4장에 이름만 나온다 (`part` null) | SKIP |

- **C-0012 가 보여주는 것**: 언급됐지만 설명 문안은 안 나온 개념이 SKIP 이다. 세 값은 "설명을 얼마나 보여줬나"이지 "나왔나"가 아니다.
  (초안 때는 이 자리가 C-0003 이었다 — C-4 가 명제를 나누면서 그 언급이 C-0012 의 것이 됐다. D32)
- FULL 의 일부 단계만 나온 경우(①만)를 FULL 로 볼지 — 실물 없음. 지금 규칙으로는 FULL 이다. **미확인**
- **정적 레벨에서는 이 값이 패키지에서 계산된다.** 그래도 plan 에 적는다 — 추정기가 생기면 계산되지 않는 값이 되고, 그때 옛 plan 과 새 plan 이 같은 모양이어야 한다.
  적은 값은 패키지에서 계산한 값과 같아야 한다 (불변식 6)
- `reason` — 확정 §9.4 "+ reason". 정적 레벨에서는 `"STATIC_LEVEL"` 하나. 다른 값은 **실물 없음**

---

## 5. 읽기 사건 (질문 3)

### 5.1 사건 넷

| `type` | 뜻 | 실물 |
|---|---|---|
| `SLIDE_ENTERED` | 이 슬라이드가 **지금 장**이 됐다 | B5: `ask(i)` · `jump(k)` 가 `setIdx` 로 지금 장을 바꾼다. 본 화면(F-1): `Deck` 의 `onIndex(cur)` |
| `SLIDE_END_SHOWN` | 지금 장의 **끝이 화면에 나왔다** (D33 · §5.4) | B5: `check(i)` 가 `data-ready` 를 다는 순간 — 물음 버튼(마지막 장은 끝 묶음)을 내보낸다. **기록으로는 아직 안 남긴다** |
| `LEVEL_SWITCHED` | 독자가 레벨을 바꿨다 | B5: `onLevel(id)`. 본 화면: `switchLevel(next)` |
| `CLOSED` | 화면을 떠난 것을 알았다 | **실물 없음** — 어느 화면도 떠나는 것을 듣지 않는다 |

- **`SLIDE_ENTERED` 는 어떻게 왔는지를 모른다.** "지금 장이 i 가 됐다" 하나다. 방향 · 손짓 · 앞뒤를 적는 칸이 없다
- **D26 이 정해진 뒤에도 그대로다 (실물 B5 로 확인).** 지금 장이 바뀌는 길은 넷이고 넷 다 같은 사건이다:

| 독자가 한 것 (B5) | 사건 |
|---|---|
| 물음 버튼을 눌렀다 (`ask(i)`) — 앞으로 가는 유일한 길 | `SLIDE_ENTERED` i+1 |
| 지나온 길에서 지나온 자리를 골랐다 (`jump(k)`) — 뒤로 가는 길 | `SLIDE_ENTERED` k |
| "처음부터 다시 보기" (`jump(0)`) · 키보드 왼쪽 화살표 (`jump(idx − 1)`) | `SLIDE_ENTERED` 0 · idx − 1 |
| 레벨을 바꿨다 (`onLevel`) | `LEVEL_SWITCHED` → 새 plan 의 `SLIDE_ENTERED` (§5.3) |

- **"지나온 길"로 되돌아가는 것도 지금 사건으로 적힌다.** 따로 칸이 필요 없다 — `slide_index` 가 앞 사건보다 작은 `SLIDE_ENTERED` 다.
  되돌아갔다는 것은 `seq` 순서에서 나온다
- 지금 장이 **바뀔 때** 한 번 남긴다. 열자마자 첫 장도, 레벨을 바꿔 들어간 장도 남긴다
- 지나온 길을 **펼쳐 본 것**(장수를 눌렀다) · 층 표시를 켠 것 · 문장을 눌러 본 것은 지금 장을 바꾸지 않는다 — 사건이 아니다. 남길지는 **미확인** (§13)
- `seq` 로 순서를 정한다. 기기의 시계는 믿지 않는다
- **`seq` 는 화면이 붙인다 (D34).** 일어난 순서를 아는 것은 기기다. `occurred_at` 도 기기의 시각이다 — 보낸 때 · 받은 때가 아니라 일어난 때

### 5.2 완독 · 멈춘 장 — 적지 않고 계산한다

- **완독** = 그 열람의 어느 plan 에서든 `slide_index == slides.length − 1` 인 `SLIDE_ENTERED` 가 있다.
  확정 §8.3: 슬라이드가 블록이면 완독 정의가 깔끔해진다 — 마지막 슬라이드에 닿은 것. **이 정의는 그대로다**
- **끝이 나온 완독** = 완독이고, 그 마지막 장의 `SLIDE_END_SHOWN` 이 있다 (D33). 완독 가운데 결론의 끝까지 화면에 나온 것을 가른다 —
  마지막 장을 열자마자 떠난 독자는 완독이지만 끝이 나온 완독은 아니다
- **멈춘 장** = 그 열람에서 `seq` 가 가장 큰 `SLIDE_ENTERED` 의 (레벨 · `slide_index`).
  **가장 멀리 간 장** = plan 마다 `slide_index` 의 최댓값. 확정 §8.3 "몇 장에서 이탈했는가가 공짜로 나온다"
- **멈춘 장에서 끝이 나왔나** = 멈춘 장의 (plan · `slide_index`)에 `SLIDE_END_SHOWN` 이 있는가 (D33).
  있으면 물음 버튼이 나온 뒤에 안 누른 것이고, 없으면 그 장을 읽다 만 것이다
- 완독 여부 · 멈춘 장 · 머문 시간을 **칸으로 두지 않는다.** 사건에서 나온다. 두 곳에 두면 어긋난다
- **이탈은 사건이 아니다.** 사건이 더 오지 않은 것이다. `CLOSED` 는 들을 수 있을 때만 오고, 없다고 해서 읽고 있다는 뜻이 아니다.
  끝나지 않은 열람과 떠난 열람을 가르는 시간은 **미확인** — 이 계약에 숫자를 두지 않는다

### 5.3 레벨 전환은 이탈이 아니다 (FOMC-21 · F-1 로그)

- 레벨끼리는 슬라이드를 공유하지 않는다 (ARTICLE_PACKAGE §3). "입문 4장 = 숙련 몇 장"이라는 대응이 데이터에 없다.
  그래서 `slide_index` 는 **plan 안에서만** 뜻이 있다. 서로 다른 plan 의 `slide_index` 를 견주지 않는다
- 레벨을 바꾸면: `LEVEL_SWITCHED`(`plan_id` = 새 레벨의 plan · `from_plan_id` = 떠난 plan) → 새 plan 의 `SLIDE_ENTERED`.
  **실물**: 본 화면(F-1)은 처음 여는 레벨은 0, 돌아온 레벨은 떠났던 장 (`positions`). B5 는 레벨을 바꾸면 언제나 0 이다 (`key={level.id}`).
  어느 쪽으로 옮길지는 F-2b 가 정한다 — 사건은 들어간 장을 그대로 적을 뿐이라 어느 쪽이어도 모양이 같다
- **입문 4장에서 숙련으로 넘어간 것은 "입문을 4장에서 그만뒀다"가 아니다.** 멈춘 장과 완독은 plan 이 아니라 **열람** 단위로 본다 (§5.2).
  `LEVEL_SWITCHED` 로 떠난 plan 은 "끝까지 안 갔다"로 세지 않고 "바꿨다"로 센다 — 떠난 장은 그 직전 `SLIDE_ENTERED` 에 남아 있다
- 전환 뒤의 사건은 다음 전환까지 새 plan 의 것이다 (불변식 9)

### 5.4 닿았다 ≠ 끝이 나왔다 ≠ 읽었다

기록이 말할 수 있는 것은 셋 가운데 앞의 둘이다.

| | 무엇이 말하나 | 뜻 |
|---|---|---|
| **닿았다** | `SLIDE_ENTERED` | 이 장이 지금 장이 됐다 |
| **끝이 나왔다** | `SLIDE_END_SHOWN` (D33) | 이 장의 끝이 화면에 나왔다 — 화면이 물음 버튼(마지막 장은 끝 묶음)을 내보냈다 |
| **읽었다** | **아무것도 말하지 않는다** | 기록은 화면에 무엇이 나왔는지를 안다. 독자의 눈이 어디 있었는지는 모른다 |

- **끝이 나왔다 ≠ 읽었다.** 짧은 장은 열자마자 끝이 화면 안에 있다. 긴 장은 끝까지 내려야 나오지만 내린 것이 읽은 것은 아니다.
  이 사건을 "읽었다"로 옮겨 적지 않는다 — 읽었는지는 물음(§6)이 묻는다
- **`SLIDE_END_SHOWN` 은 사실 하나만 적는다** — 어느 열람의 어느 plan 의 어느 장에서 끝이 나왔나. 얼마나 머물렀는지 · 얼마만큼 보였는지 같은 값은 없다.
  언제 "끝이 나왔다"고 볼지는 **화면의 판정**이다 (D26: 물음 버튼은 그 장을 다 읽었을 때 나온다). 계약은 그 판정을 정하지 않고, 화면이 판정한 때를 적는다.
  화면이 물음 버튼을 내보낸 때와 이 사건이 어긋나면 안 된다 — 같은 판정 하나에서 나와야 한다
- **장마다 남긴다. 한 plan 의 한 장에 한 번** — 그 장의 끝이 처음 나왔을 때 (불변식 22). 지나온 길로 돌아온 장은 끝이 이미 나왔던 장이라 다시 남기지 않는다.
  **실물** B5: `data-ready` 는 장마다 한 번 붙고 떼지 않는다
- **D26 과의 관계** — 물음 버튼을 눌러야 다음 장으로 간다. 그래서 처음 가는 장 i+1 의 `SLIDE_ENTERED` 앞에는 i 장의 `SLIDE_END_SHOWN` 이 있다.
  마지막 장과 멈춘 장에는 뒤따르는 `SLIDE_ENTERED` 가 없다 — 이 사건이 없으면 "닿았다"만 남는 곳이 바로 그 둘이다 (§5.2)
- 위 관계를 불변식으로 올리지는 않았다. 본 화면(F-1)은 아직 스크롤로 넘긴다 — F-2b 가 옮긴 뒤에 볼 일이다 (§13)

---

### 5.5 원장은 받는다 — 검사는 읽을 때 한다 (D34)

기준은 하나다: **기록하지 않은 관찰은 복구할 수 없다** (확정 §9.4). 원장의 읽기 사건은 "화면이 무엇이 일어났다고 말했나"의 기록이다.

| | 무엇 | 어긋나면 |
|---|---|---|
| **넣을 때 막는다** | **모양** — 칸 · 타입 · 닫힌 값 · `slide_index` / `from_plan_id` 가 `type` 에 맞게 있는가 · plan 에 담긴 모양. **참조** — `plan_id` 가 그 열람 · 독자 · 세션의 plan 인가, `from_plan_id` 가 있는 plan 인가 · plan 이 있는 판의 있는 레벨을 가리키는가 (불변식 4). **유일** — `event_id`, (`reading_id` · `seq`), `plan_id`. **덧붙이기만** | 그 줄은 원장에 없다 |
| **읽을 때 본다** | **사건의 뜻** — `seq` 가 0부터 1씩인가 (불변식 8) · 지금 plan · 범위 안의 장 (9) · 전환의 앞뒤 (10) · `CLOSED` 가 마지막 (11) · 끝은 지금 장에 한 번 (22). **plan 의 뜻 (D35)** — (열람 · 레벨)에 하나, 같은 독자 · 세션 · 판 (3) · 정적 레벨 (5) · 첫 plan 만 `DEFAULT` (7) · 적힌 값이 패키지에서 계산한 값과 같은가 (6) | 줄은 원장에 **있다.** 그 열람이 "계약에 맞지 않는다"로 세어진다 |

- **빈 `seq` 는 사실이다** — "사건이 하나 사라졌다". 한 줄이 길에서 사라졌다고 뒤따르는 사건을 버리지 않는다. 뒤바뀌어 도착한 사건도 받는다 — 순서는 도착이 아니라 `seq` 다
- **계약과 다른 순서도 사실이다** — 화면의 버그다. 지우면 그 버그를 볼 수 없다
- **분석은 계약에 맞는 열람만 쓴다.** 읽는 쪽이 열람마다 "계약에 맞는가 · 어디가 어긋났는가"를 낸다. 맞지 않는 열람의 줄을 고치거나 지우지 않는다 (불변식 1)
- 완독 · 멈춘 장(§5.2)의 계산은 어긋난 열람에서도 값이 나온다. 그 값을 쓸지는 읽는 쪽이 "계약에 맞는가"와 함께 본다
- **plan 을 뜻으로 거부하지 않는 까닭 (D35)** — plan 하나가 거부되면 그 plan 을 가리키는 사건이 전부 참조로 따라 거부된다. 탭을 복제하면 두 탭이 같은 열람에서 같은 레벨의 plan 을 따로 만든다.
  그래도 두 탭이 같은 `seq` 를 쓰는 것은 남는다 — (`reading_id` · `seq`)는 유일해서 나중에 온 쪽이 거부된다
- 같은 `event_id` · `plan_id` 를 두 번 보내면 원장에는 한 줄이다 — 화면은 못 보낸 줄을 다시 보낸다. 다시 보낸 것은 새 사건이 아니다

---

## 6. probe (질문 4) — 실물 없음

**물음의 첫 실물 — F-3 첫 회의 넷 (D37 · 판 1).** P0 (읽기 전 · 얼마나 알고 왔나) · P1 (요점을 제 말로 — 쓰기) · P2 (요점을 고르기로) · P3 (개념 C-0002 를 겨눈다).
글자의 원본은 DECISIONS D37 의 표이고 코드의 원본은 `apps/web/src/study/probes.ts` 다 — 이 계약에 물음의 글을 옮겨 적지 않는다 (D33).
**물음은 기사 앞과 뒤에 따로 선 화면이다 (D37 — D18 을 닫았다).** 기사 안의 자리가 아니다. 이 계약에 놓을 자리를 정하는 칸은 여전히 없다 (불변식 14).
아래의 "실물 없음"은 이 넷이 쓰지 않는 것들이다 — target 이 둘인 물음 · ACTIVE · AUDIT · `probe_plan` 에 적힌 물음.

**D18 의 전제가 바뀌었다 (D26).** D18 은 "질문이 별도 슬라이드가 되면 그 자리가 PRE probe 자리가 될 수 있다"고 물었다.
D26 에서 질문은 슬라이드가 아니라 **버튼**이고, 누른 뒤에는 다음 화면의 머리다. 이 계약은 그 사실만 적는다 — 자리는 여전히 정하지 않는다.

### 6.1 Probe — 물음 한 판

- **실물 없음.** 판을 고치지 않는다. 글자가 바뀌면 새 `version`. 노출 · 응답은 본 판을 적는다 — 두 사람이 같은 물음을 받았는지는 (`probe_id` · `version`)이 같은가로 안다
- `targets` — 이 물음이 겨누는 leaf 개념과 그 버전. **0개일 수 있다** — 기사의 요점을 묻는 물음은 개념 하나에 닿지 않을 수 있다 (§7.4)
- **`goal_ref` — 어느 요점에서 만든 물음인가 (D33).** DATA_MODEL 의 Goal 을 GoalRef(= `Goal.goal_id`)로 가리킨다.
  두 사람이 **같은 요점으로** 물음을 받았다는 것은 `goal_ref` 가 같은가로 보인다 (같은 물음을 받았는지는 `probe_id` · `version`).
  요점은 COMMON 하나와 DEEP 여럿이다 — 어느 것에서 나왔는지가 이 칸에 남는다. 요점에서 나오지 않은 물음(개념만 겨누는 물음)이면 null
  - `event_id` 는 그대로 둔다. `goal_ref` 가 있으면 그 Goal 의 `event_id` 와 같아야 한다 (불변식 23)
  - `goal_ref` 는 **물음이 어디서 나왔나**이지 물음을 어디에 놓나가 아니다 (D18)
- **형식 (D37 의 실물)** — 고르기(`choices` 가 있다)와 쓰기(`choices` null). "잘 모르겠다"는 따로 둔 칸이 아니라 **보기의 하나**다 — 고르면 응답이 남고, 맞은 것이 아니다.
  정답이 없는 고르기도 있다 (P0 — `correct_choice` null). 보기의 순서는 판에 적힌 그대로 보여준다 (두 무리 · 두 시점이 같은 물음을 받았다는 것이 먼저다)
- **`is_correct` 는 넣는 쪽(서버)이 가린다 — 화면이 보낸 값을 받지 않는다.** 고르는 물음이고 `correct_choice` 가 있으면 고른 것과 견준다. 쓴 답 · 정답 없는 물음은 null 이다.
  **쓴 답을 기계로 가리지 않는다** — 사람이 읽고 가린다. 그 판정을 적는 칸은 이 계약에 없다 (원장 밖 — D37). 나중에 원장 안으로 들일지는 **미확인**

### 6.2 유형과 위치는 묻기의 속성이다

- **유형 넷 (확정 §9.4)** — DIAGNOSTIC 초기 선행지식 · ACTIVE 가장 알고 싶은 것 · AUDIT 무작위 뽑기 · COMPREHENSION 설명 뒤 이해.
  넷은 **왜 물었나**다. 같은 물음을 AUDIT 으로도 ACTIVE 로도 물을 수 있다. 그래서 `probe_type` 은 Probe 가 아니라 ProbePlanItem · ProbeExposure 에 있다
- **AUDIT 자리가 반드시 있어야 한다 (확정 §9.4).** 값이 어휘에 있다. 어떻게 뽑는지는 이 계약 밖이다
- **위치 셋 (확정 §9.4)** — PRE 설명 전 · POST 설명 뒤 · DELAYED 며칠 뒤. 같은 물음이 POST 로도 DELAYED 로도 나온다. 그래서 `position` 도 노출에 있다.
  "며칠"이 며칠인지는 적지 않는다 — 두 노출의 `shown_at` 차이가 사실이고, 그것을 어떻게 읽을지는 원장 밖이다
- plan 에 적은 것과 노출에 적은 것이 같은 물음이면 `probe_type` · `position` 이 같다 (불변식 12)

### 6.3 물었다 · 답했다 · 답하지 않았다

- **ProbeExposure** — 보여줬다. 답이 없어도 남는다. 이것이 있어야 "답하지 않았다"를 안다
- **ProbeResponse** — 답했다. 노출 하나에 많아야 하나
- **무응답은 증거가 아니다 (확정 §9.4).** 응답 없는 노출에서는 KnowledgeEvidence 가 **한 줄도** 나오지 않는다 (불변식 15).
  틀렸다고도, 모른다고도 적지 않는다. 설명을 펼치지 않은 것도 같다 — 증거 0
- `shown_at_loc` 은 **실제로 나온 자리의 기록**이다. 어디에 놓을지 정하는 칸이 아니다. 자리가 정해지지 않았으면 null.
  **D37 의 물음은 전부 null 이다** — 기사의 장 · 블록 안에 나온 것이 아니라 따로 선 화면에 나왔다
- **`plan_id` — 무엇을 본 뒤의 물음인가.** 직후 물음이 그 판을 읽은 바로 뒤에 나왔으면 방금 읽던 레벨의 plan 을 가리킨다. 읽기 전 물음 · 기사 밖의 물음(바깥 기사를 읽은 독자 · 며칠 뒤)은 null 이다
- **답은 한 번 정해진다.** 노출 하나에 응답은 많아야 하나라서(불변식 13) 화면은 독자가 "다음"을 누를 때 응답을 적는다 — 그 전에 고른 것을 바꾼 일은 남지 않고, 누른 뒤에는 고칠 길이 없다.
  건너뛰면 노출만 남는다. 고르고 나서 건너뛴 것도 답이 아니다

### 6.4 예산은 세션 단위다

- 확정 §9.4: "기사당이 아니라 세션 단위". 그래서 ProbeExposure 에 `session_id` 가 있다 — 한 세션의 노출을 셀 수 있다
- **몇 개까지인지는 이 계약에 없다.**
- **세션의 경계 — 미확인.** 기사를 여럿 잇달아 읽는 화면이 없다(본 화면은 기사 하나). 손으로 돌리는 테스트에서는 한 번 앉은 것이 한 세션이다

---

## 7. knowledge_evidence — 독자가 무엇을 했나 (질문 1)

### 7.1 사실만 적는다

- 확정 §9.4: `evidence_type` 은 사실만. 그 한 줄이 얼마만큼의 뜻인지는 원장 밖의 셈이 정한다. 그래야 나중에 바꿀 수 있다
- **이 타입에는 값을 매기는 칸이 없다.** 점수 · 확신 · 등급 · "안다 / 모른다" 판정 — 없다. 계약에 없는 칸을 가진 줄은 실패다 (불변식 1)
- `evidence_type` 은 **한 일의 종류**다. 실물 없음 — 확정에서 온 둘:
  - `PROBE_RESPONSE` — 물음에 답했다 (확정 §9.4)
  - `SELF_REPORT_KNOWN` — "알고 있어요"를 눌렀다 (확정 §9.5 — leaf 명제 단위로 받는다). 지금 화면에 그 버튼이 없다
- §9.4 가 예로 든 `PRE_PROBE_CORRECT` 같은 묶음 값은 쓰지 않는다. 위치는 `position`, 맞았는지는 응답에 이미 있다. 같은 것을 두 칸에 적으면 어긋난다
- 읽은 것 · 닿은 것 · 머문 것은 증거가 아니다. 그것은 plan 과 읽기 사건에 있다 (§4 · §5)

### 7.2 개념은 무엇으로 가리키나

- `concept_id` — Concept 의 UUID. `code`("C-0002")가 아니다 (CONCEPT_IDENTITY §2 · D25)
- **leaf 에만 (확정 §9.5).** Topic 은 Concept 밖에 생기므로(D25) 가리킬 방법이 없다 — 구조가 막는다
- **기록할 때 MERGED 가 아니다** (CONCEPT_IDENTITY §10.2). 그 뒤에 합쳐져도 줄은 그대로다
- **merge 뒤 — 원장을 고치지 않고 읽을 때 따라간다.** CONCEPT_IDENTITY §10.2 가 여기로 넘긴 물음이다.
  B 가 A 로 합쳐져도 B 를 가리킨 줄은 B 를 가리킨 채 남고, 읽는 쪽이 `merged_into` 를 따라 A 로 읽는다.
  확정 §9.5: merge 는 되돌릴 수 있어야 한다 — 원장을 A 로 고쳐 쓰면 되돌릴 때 어느 줄이 B 였는지 모른다.
  `content_version` 은 줄에 적힌 `concept_id`(B)의 버전이다. B 의 버전은 지워지지 않으므로(CONCEPT_IDENTITY §3.1) 언제나 풀린다
- **한 행동이 여러 줄이 될 수 있다.** 물음이 개념 둘을 겨누면 응답 하나에 두 줄이고, 둘은 같은 `interaction_id` 를 갖는다.
  확정 §9.5 가 merge 에서 `interaction_id` 로 중복을 걷는 것이 이 때문이다 — 두 개념이 하나로 합쳐지면 같은 행동이 두 번 세어진다
- **명제를 못 나누게 되는 순간은 그 개념의 첫 KnowledgeEvidence 줄이다 (D30).** 첫 독자도, F-3 도 아니다.
  plan · 읽기 사건 · 노출 · 응답은 개념을 증거로 가리키지 않는다 — 그것들만 있는 동안에는 명제를 나누는 것이 아직 문안 편집이다 (CONCEPT_IDENTITY §10.3).
  요점만 묻는 물음뿐이면 F-3 에서 그 줄이 안 생긴다. 그래도 명제 나누기(C-4)는 F-3 전에 끝낸다 (D30) — 물음이 개념을 겨눌지는 D31 에서 정해진다

### 7.3 그때 본 문안 버전

- `content_version` = ConceptVersion.`version`. CONCEPT_IDENTITY §3.2 가 넘긴 제약 그대로다 — ConceptRef.`version` 과 같은 수
- `PROBE_RESPONSE` — 그 물음이 겨눈 버전 (`ProbeTarget.version`)
- `SELF_REPORT_KNOWN` — 독자가 누른 자리의 판이 그 개념에 쓴 버전 (`BlockDecision.version`)
- **무엇을 본 뒤였나는 복사하지 않고 가리킨다** — `exposure_context` 가 plan 과 열람을 가리킨다.
  그 개념을 FULL 로 보여준 레벨이었는지는 plan 의 `block_decisions` 가, 그 장에 실제로 닿았는지는 그 열람의 `SLIDE_ENTERED` 가 말한다.
  SKIP 뒤의 정답과 FULL 뒤의 정답은 이렇게 갈린다
- `position` 은 묻는 쪽이 적은 값이다. 기사 안에서 물었으면 읽기 사건과 견줄 수 있다 — PRE 인데 설명이 있는 장에 이미 닿았는지

### 7.4 응답은 ProbeResponse 에 한 번 (D30)

확정 §9.4 는 `response` · `is_correct` 를 knowledge_evidence 의 칸으로 적었다. 이 계약은 둘을 ProbeResponse 로 옮겼다.
- 요점을 묻는 물음이 leaf 개념을 하나도 겨누지 않으면 증거 줄이 없다. 응답이 증거 줄에만 있으면 **그 답은 어디에도 남지 않는다**
- 개념 둘을 겨눈 물음의 답이 두 줄에 복사된다
- ProbeResponse 에 한 번 두면 증거 줄은 `interaction_id` 로 그 응답을 가리킨다. 거꾸로는 되살릴 수 없다

응답은 **실물 없음.** 확정된 칸의 자리를 옮긴 것이고, **게이트 판정으로 승인됐다 (D30).**
F-3 의 물음은 요점을 묻는다("한 문장으로 말해봐") — 응답이 증거 줄에만 있으면 가장 보고 싶은 답이 남지 않는다.
옮긴 것은 자리뿐이다. 확정 §9.4 의 뜻(사실만 적고, 나중에 다시 셈할 수 있게)은 그대로다

---

## 8. 교정 기록 — 실물에서 (질문 7)

확정 §10.3: 게이트에서 개입할 때마다 한 줄. 자동화의 연료다.

**이 절의 수는 날짜 붙은 기록이다.** 표마다 "1~N행"이라고 적은 그 행들의 집계이고, 계약의 모양이 **어디서 나왔는지**를 보여준다.
교정 기록은 덧붙이기만 하므로 그 N행은 바뀌지 않는다 — 행이 늘어도 이 절은 맞는 채로 남는다 (검사가 그 N행만 견준다).
지금 전체의 집계는 계약에 적지 않는다. `verify-observation.py --report` 가 실물에서 센다.
- §8.1 · §8.2 — 초안(B-0.2c)이 본 **1~14행**
- §8.3 의 발견 칸 표 — 0.2m-b 가 옮긴 **1~42행** (15~42행은 C-5 · C-5 2차 게이트의 28행)

### 8.1 실물의 열 → 이 계약

| 실물 열 | 실물 (1~14행) | 이 계약 |
|---|---|---|
| `date` | 14/14 `YYYY-MM-DD` | `date` |
| `event_id` | 14/14 Event 의 **code** ("FOMC-20260916") — UUID 가 아니다 | `event_code`. 이름이 `event_id` 면 DATA_MODEL 의 UUID 와 섞인다 |
| `stage` | 6종이 한 열에 — 아래 §8.2 | `gate` · `occasion` · `stage` · `targets[].kind` 로 가른다 |
| `error_type` | 5종 사용 (유형 표는 9종) | `error_type` — 9종으로 닫는다 |
| `what_was_wrong` | 글 | `what_was_wrong` |
| `what_i_changed` | 글. 3행이 "유형: …" 으로 왜 그 유형인지를 같이 적었다 | `what_i_changed` + `type_note` |
| `source_of_catch` | 글. 확정 §10.3 의 네 값과 글자가 같은 행이 0/14 | `caught_by` + `check` + `catch_note` (§8.3) |
| `time_spent_min` | 0/14 — 전부 비었다 | `time_spent_min` (null 허용) |
| — | 행마다 ID 가 없다 | `correction_id` |
| — | 무엇을 고쳤는지가 글 속에만 있다 ("C-0010 REFRESHER v1") | `targets` |
| — | 무엇이 무엇을 대신했는지가 글 속에만 있다 ("C-0010 v2") | `replacements` (§9) |

`time_spent_min` 이 한 번도 안 적혔다. 확정 §10.1 의 판단 기준("이 단계가 편집 시간을 줄이는가")은 이 칸으로 잰다 — 지금은 잴 수 없다.

### 8.2 `stage` — 한 열에 세 가지가 섞였다

| 실물 값 | 행 (1~14행) | 실제로 말한 것 |
|---|---|---|
| `writing` | 4 | 오류가 **생긴** 단계 (집필) |
| `data_model` | 1 | 오류가 **있던** 곳 (저작 데이터) |
| `concept_library` | 5 | 오류가 **있던** 곳 (개념 라이브러리) |
| `게이트 3` | 2 | **잡은** 게이트 |
| `게이트(0.1b PM 검수)` | 1 | **잡은** 때 — 편집 게이트가 아니라 계약 Step 의 검수 |
| `게이트(0.2b)` | 1 | 위와 같다 |

- **잡은 게이트 → `gate`.** 확정 §10.2 의 넷. 편집 게이트 밖에서 잡았으면 null (1~14행 가운데 12)
- **잡은 때 → `occasion`.** 글. 실물의 "0.1b PM 검수" · "0.2b 게이트" · `source_of_catch` 의 "S1 역산" · "C-1" 이 여기다
- **있던 곳 → `targets[].kind`.** 실물은 기사(골든)와 개념 둘이다. FACT · CLAIM · BRIDGE 는 **실물 없음** —
  "원문 불일치" 행이 15행부터 생겼지만(C-3 · C-5) 전부 골든의 글을 고친 것이라 target 은 기사다
- **생긴 단계 → `stage`.** 확정 §10.3: "지금 스테이지를 추측으로 설계하고 있다. 이 로그가 쌓이면 측정으로 정할 수 있다."
  파이프라인 단계 어휘가 없다 — **미확인.** 실물 값은 `writing` 하나. 모르면 null
- **`GOAL` — 요점 (0.4a).** DATA_MODEL 의 Goal 을 label("COMMON" · "DEEP-A")로 부른다. 요점은 해석이 아니다 — 물음을 만드는 문장이라 따로 센다.
  **51 ~ 54행은 요점을 고친 줄인데 `CLAIM` 으로 적혀 있다** (그때 어휘에 `GOAL` 이 없었다 — `where` 에 그렇게 적었다). 원장은 고치지 않는다 (§1). 요점을 고친 줄을 셀 때는 그 넷을 `where` 로 더한다. `GOAL` 로 적힌 줄은 아직 없다
- 15행부터의 `stage` 값(`게이트(C-5 · D29)` 등)도 같은 방식으로 갈랐다 — 잡은 때라서 `occasion` 이고 `gate` 는 null 이다. 새 값이 생겨도 이 표는 늘리지 않는다

### 8.3 유형 칸과 발견 칸

유형 규칙 (development-content, 2026-09-29): **유형은 오류의 성격과 처방으로 정한다. 무엇이 잡았는지는 발견 칸이 적는다.
어떤 검사를 자동화할지는 발견 칸으로 센다.** 처음에 "유형은 잡는 검사로 나눈다"고 했다가 두 칸이 같은 말을 하게 되어 고친 규칙이다.

- **`error_type` — 9종 (실물: 유형 표).** 팩트 누락 · Goal 왜곡 · 오독 미방어 · 스토리라인 stale · 압축 (확정 §10.3) ·
  시점 앵커 누락 · 원문 불일치 · 축약 변질 · 레이어 혼입 (실물). 새 유형은 새 검사가 필요할 때만 만든다 — 계약 개정이다
- **`type_note`** — 왜 이 유형인가. 증상이 같은 다른 유형이 있을 때 처방으로 가른 이유를 적는다. 실물 3행이 이 글을 `what_i_changed` 안에 넣었다
  (시점 앵커 누락 / 레이어 혼입 · 축약 변질 / 레이어 혼입). "생기는 방식"(정의 조건 탈락 · 한 회의의 값 …)도 여기 글로 적는다 — 유형을 쪼개지 않는다
- **`caught_by` — 무엇이 잡았나.** 세려면 닫힌 값이어야 한다. 확정 §10.3 의 넷에 실물 둘을 더했다 (D30 — 여섯 값. 대조와 1차 원문 재확인을 합치지 않는다):

| `caught_by` | 원천 | 실물 (1~42행 · 초안 대응) |
|---|---|---|
| `BACKGROUND_KNOWLEDGE` 내 배경지식 | 확정 §10.3 | 0 |
| `SOURCE_RECHECK` 소스 재확인 | 확정 §10.3 | 25 — **첫 실물 (15행부터).** C-3 · C-3b 의 1차 원문 대조. 이 가운데 10행은 반증 검사가 먼저 걸었다 (§8.4) |
| `PLAIN_READING` 그냥 읽어보니 | 확정 §10.3 | 3 — "인접 문장과의 모순" · "C-1b 판정" · "0.1b 층 판정 + PM 검수" |
| `OTHER_READER` 타인 독해 | 확정 §10.3 | 0 |
| `AUTOMATED_CHECK` 기계 검사 | 실물 | 4 — 린트 ① 2 · 린트 ② 1 · 0.2b 인용 검사 1 |
| `ARTIFACT_COMPARE` 다른 산출물 · 규칙과 대조 | 실물 | 10 — 라이브러리 2 · 브리프 3 · 규칙(D8 · §4.3) 2 · D15 선형 읽기 점검 3 |

- **`SOURCE_RECHECK` 가 실물을 얻었다.** 초안 때(1~14행)는 0 이었다 — 1차 원문 대조를 한 번도 돌리지 않았기 때문이다 (D28 · D30).
  대조(`ARTIFACT_COMPARE`)와 합치지 않은 이유가 여기서 보인다: 14행까지의 대조 7건은 전부 **우리가 만든 것끼리**(브리프 · 라이브러리 · 규칙) 견준 것이었다
- **`check` — 잡은 절차의 이름 (D33).** 기계 검사에 묶지 않는다. 린트도, 사람(세션)이 돌린 정해진 절차도 이름이 있으면 여기 적는다.
  `caught_by` 가 `AUTOMATED_CHECK` 면 필수이고, 그 밖에는 이름 있는 절차가 잡았을 때 적는다 (없으면 null — 그냥 읽다가 · 한 번뿐인 대조).
  **자동화 근거는 이 칸의 같은 값을 센다** (실물: 린트 ① 이 4건을 잡아 "파이프라인에 넣을 근거가 생겼다" — development-content). 이름은 §8.4
- **`catch_note`** — 실물 `source_of_catch` 의 글을 그대로 옮긴다. 잃는 것이 없다 (검사가 글자 단위로 견준다)
- 유형과 발견은 서로를 정하지 않는다. 린트 ① 은 축약 변질도 레이어 혼입도 잡았다 (실물)

### 8.4 `check` 의 이름 — 한 절차에 이름 하나

| 이름 | 절차 | 실물 (1~42행) |
|---|---|---|
| `lint-1` | 린트 ① — REFRESHER ⊆ (명제 ∪ FULL) | 2 |
| `lint-2` | 린트 ② — 개념 문안 속 현재 상태 | 1 |
| `quote-check` | 0.2b 인용 검사 — 본문 따옴표가 누군가의 말로 읽히나 | 1 |
| `1차 원문 대조` | 사실 문장을 1차 원문과 견준다 (C-3 · C-3b) | 15 |
| `반증 검사` | 해석 · 요점에 반증 물음을 던진다 (확정 §7.2 · C-5) | 10 |
| `D15 선형 읽기 점검` | 물음마다 다음 장이 답했는지 본다 (D15 QA②) | 3 |
| `사실 글 ↔ 1차 구절 대조` | 저장소 사실의 글(`claim_text`)을 그 사실의 1차 구절과 나란히 놓고 본다 (C-6). 기계가 할 수 있는 검사다 | 0 — 첫 실물은 47행 (C-6) |
| `요점 ↔ 해석 대조` | 요점 문장을 그것이 가리키는 해석(반증 뒤의 문장)과 나란히 놓고 본다 (DATA_MODEL §7.4 "사람이 본다") | 0 — 51 ~ 54행이 이 절차였지만 이름이 없던 때라 `check` 가 null 이다. 원장은 고치지 않는다 |

- **같은 절차는 언제나 같은 글자로 적는다.** 이름이 둘로 갈리면 세는 값이 갈린다. 이 표에 없는 이름이 원장에 나오면 검사가 WARN 을 낸다 — 새 절차면 표에 더한다
- **한 행을 두 절차가 잡았으면 — `check` 는 그 문장을 먼저 건 절차 하나다.** 실물 10행(`catch_note` "반증 검사 … + 1차 원문 대조")이 그 모양이다:
  반증 물음이 그 문장을 걸었고, 1차 원문이 답을 줬다. 그래서 `check` 는 `반증 검사`, 무엇으로 가렸는지는 `caught_by` 가 `SOURCE_RECHECK` 로 말한다.
  두 칸이 서로 다른 것을 적으므로 모양(값 하나)을 바꾸지 않아도 둘 다 남는다. 글은 `catch_note` 에 그대로 있다
- 이렇게 적으면 D28 의 발견(1차 원문 대조를 안 돌렸다)은 `check` = `1차 원문 대조` 15 로, D29 의 발견(반증을 건너뛰었다)은 `check` = `반증 검사` 10 으로 따로 세어진다 (D33)
- **1~14행의 대조 7 · 읽다가 3 은 `check` 가 null 이다.** S1 역산 · C-1 판정처럼 한 번뿐인 일이었고 되풀이할 이름 있는 절차가 아니었다
- 42행의 `check` 는 `caught_by` 와 함께 **초안이다 — 사람이 확인한다** (`_draft`)

---

## 9. 무엇이 무엇을 대신했나 — Replacement

DATA_MODEL §2.3 이 여기로 넘겼다: "틀린 것이 나중에 드러나면 새 Fact(또는 Claim)를 만들고 스토리라인에 붙인다. 무엇을 대체하는지의 기록은 correction_log."

- **옛 것은 고치지도 지우지도 않는다.** 대신하는 것은 새로 만들어지고, Replacement 가 둘을 잇는다. 발행된 패키지는 옛 것을 가리킨 채 남는다 (확정 §9.2)
- **실물은 `CONCEPT_VERSION` 뿐이다 — 6건 (1~42행).** C-0002 1→2 · 2→3, C-0005 1→2 · 2→3, C-0008 1→2, C-0010 1→2 (CONCEPT_IDENTITY §4.1).
  전부 발행 전이다. CSV 에는 "C-0010 v2:" 같은 글로만 있었다 — 옮긴 파일에서 Replacement 가 됐다 (§15)
- **`FACT` · `CLAIM` · `BRIDGE` — 실물 없음.** 발행된 기사가 없다
- **발행 뒤 (`after_publication` = true) — 실물 없음**
  - 대신한 것이 하나 이상 있어야 한다 (불변식 20). 발행된 것이 틀렸는데 무엇이 대신하는지 없으면 기록이 아니다
  - `FACT` · `CLAIM` · `BRIDGE` 의 Replacement 는 **발행 뒤에만** 있다. 발행 전 초안은 그냥 고친다 (DATA_MODEL §2.3) — 대신할 옛 것이 남지 않는다
  - `new_id` 가 null 이면 대신할 것 없이 거둔 것이다. 그런 일이 있는지는 실물 없음
  - **누가 틀린 것을 봤나는 적지 않는다 — 원장에서 나온다.** 옛 Fact 를 가리킨 판 → 그 판의 plan → 그 장에 닿은 `SLIDE_ENTERED`
  - 독자에게 고쳤다고 알리는 방법 — **미확인**
- 옛 것 하나를 대신하는 것은 하나다. 따라가면 돌지 않고 끝난다 (불변식 21)
- **값이 바뀐 것은 교정이 아니다.** VOLATILE 사실이 48건에서 52건이 되면 새 Fact 이고, 옛 Fact 는 그 `as_of` 로 계속 맞다 (DATA_MODEL §2.3).
  틀린 것이 없으니 CorrectionEntry 가 없다. 그 앞뒤를 잇는 기록이 어디 있는지는 DATA_MODEL §15 "대체 관계"가 이 계약을 가리키지만 **여기에는 틀린 것의 기록만 있다** — 로그에 적었다

---

## 10. 다른 계약과의 짝

| 이 계약 | 가리키는 것 | 주인 | 상태 |
|---|---|---|---|
| ArticleRef | ArticleRecord 의 `article_id` · `article_version` | DATA_MODEL §11 | 맞다 (D30). 골든 기록에 발급됐다 (0.2m-a) |
| `level` | Level.`id` | ARTICLE_PACKAGE §3 | 맞다 |
| SlideLoc | `slides[i]` · `blocks[j]` | ARTICLE_PACKAGE §4 | 맞다 — 위치 |
| `concept_id` · `content_version` · BlockDecision | Concept · ConceptVersion | CONCEPT_IDENTITY §2 · §3 | 맞다 |
| `decision` | ConceptRef.`part` | CONCEPT_IDENTITY §3.3 | 맞다 — 골든이 `part` 를 갖는다 (0.2m-a). 기계로 계산된다 |
| `event_code` | Event.`code` | DATA_MODEL §2.1 | 맞다 (D27: 교정 기록은 code 로 부른다) |
| Replacement | Fact · Claim · Bridge 의 키 · ConceptVersion | DATA_MODEL §2 · CONCEPT_IDENTITY §3 | 맞다 |
| Probe.`event_id` | Event | DATA_MODEL §9 | 맞다 |
| Probe.`goal_ref` | Goal (`goal_id`) — GoalRef | DATA_MODEL §2 · §7.4 | 맞다 (D33) |
| `narrative_form` | — | — | 가리킬 곳이 없다 — 미확인 |

---

## 11. 불변식

**모든 원장**
1. 줄은 계약에 있는 칸만 갖는다. 줄을 고치거나 지우지 않는다
2. `user_id` 는 뜻 없는 UUID. 원장 어디에도 사람을 알아볼 값이 없고, 시험 · 실제를 가르는 칸도 없다 (§3 · D33)

**plan** — 3 · 5 · 7 은 **계약에 맞는 열람의 성질**이다. 원장이 plan 을 받는 조건이 아니다 — 어긴 plan 도 원장에 남고, 읽을 때 열람마다 본다 (§5.5 · D35). 넣을 때 막는 것은 4 와 줄의 모양 · 유일이다.
"첫 plan"은 `created_at` 이 가장 이른 것이다
3. (`reading_id` · `level`)마다 plan 은 하나. 한 열람의 plan 은 `user_id` · `session_id` · `article_id` · `article_version` 이 같다
4. `level` 이 그 판의 패키지에 있다
5. `estimator_version` 이 null 이면 `selected_blocks` · `skipped_blocks` 도 null 이고 모든 `reason` 이 `"STATIC_LEVEL"` 이다
6. `block_decisions` 는 그 판이 가리키는 개념마다 정확히 하나. 정적 레벨이면 `decision` · `version` 이 패키지에서 계산한 값(§4.2)과 같다
7. 한 열람의 첫 plan 만 `level_chosen_by` 가 `DEFAULT` 일 수 있다

**읽기 사건** — 8 의 앞 문장과 9 · 10 · 11 · 22 는 **온전한 · 계약에 맞는 열람의 성질**이다. 원장이 줄을 받는 조건이 아니다 — 어긴 줄도 원장에 남고, 읽을 때 열람마다 본다 (§5.5 · D34).
넣을 때 막는 것은 8 의 뒷 문장(참조)과 줄의 모양 · 유일 · 불변식 1 이다
8. **온전한 열람이면** 한 열람 안에서 `seq` 는 0부터 1씩이다 — 빈 곳은 사건이 사라졌다는 사실이다. 원장에서는 (`reading_id` · `seq`)가 유일하기만 하면 된다.
   `plan_id` 는 그 열람의 plan 이고 `user_id` · `session_id` 가 plan 과 같다
9. `SLIDE_ENTERED` — `slide_index` 가 그 plan 레벨의 `slides` 범위 안, `from_plan_id` 는 null. 그 plan 은 **지금 plan** 이다
   (첫 사건의 plan, 그 뒤로는 가장 최근 `LEVEL_SWITCHED` 의 `plan_id`)
10. `LEVEL_SWITCHED` — `from_plan_id` 가 지금 plan 이고 `plan_id` 는 같은 열람의 다른 레벨 plan, `slide_index` 는 null. 바로 다음 사건은 새 plan 의 `SLIDE_ENTERED`
11. `CLOSED` 는 그 열람의 마지막 사건이다. 방향 · 손짓을 적는 칸이나 값이 없다
22. `SLIDE_END_SHOWN` — `slide_index` 가 **지금 장**(지금 plan 의 가장 최근 `SLIDE_ENTERED`)이고 `from_plan_id` 는 null. 한 plan 의 한 장에 많아야 한 번 (D33)

**probe**
12. 노출의 (`probe_id` · `probe_version`)이 있는 판이다. `plan_id` 가 있으면 `user_id` · `session_id` 가 plan 과 같고,
    그 plan 의 `probe_plan` 에 같은 물음이 있으면 `probe_type` · `position` 이 같다
13. 응답은 있는 노출을 가리키고 `user_id` 가 같으며 `responded_at` ≥ `shown_at`. 노출 하나에 응답은 많아야 하나
14. 물음 · 계획 · 노출 어디에도 놓을 자리를 정하는 칸이 없다 (D18). `shown_at_loc` 은 나온 뒤에 적는다
23. `goal_ref` 가 있으면 있는 Goal 이고, 물음의 `event_id` 가 그 Goal 의 `event_id` 와 같다 (0.4 — 물음의 실물이 없다)

**증거**
15. `PROBE_RESPONSE` — `probe_id` · `position` 이 있고, `interaction_id` 가 ProbeResponse 하나를 가리키며, 그 노출의 물음 · 위치와 같다.
    **응답 없는 노출에서 나온 줄은 없다**
16. `PROBE_RESPONSE` 줄은 응답마다, 그 물음의 `targets` 마다 정확히 하나. `concept_id` · `content_version` 이 그 target 과 같다
17. `SELF_REPORT_KNOWN` — `probe_id` 가 null
18. `concept_id` 는 leaf 이고 기록할 때 MERGED 가 아니다. `content_version` 은 그 개념에 있는 버전이다
19. `exposure_context.plan_id` 가 있으면 `user_id` · `session_id` · `reading_id` · `article_id` · `article_version` 이 그 plan 과 같다. 없으면 `article_id` · `article_version` · `content_block_id` 도 null

**교정**
20. `targets` 1개 이상. `caught_by` 가 `AUTOMATED_CHECK` 면 반드시 `check` 가 있다. 그 밖에는 있어도 되고 없어도 된다 — 있으면 빈 글이 아니다 (D33).
    `after_publication` 이면 `replacements` 1개 이상. `FACT` · `CLAIM` · `BRIDGE` 의 Replacement 는 `after_publication` 일 때만
21. Replacement — 옛 것과 새 것이 다르다. `CONCEPT_VERSION` 이면 두 버전이 있고 새 버전이 더 크며 `new_id` 는 `old_id` 와 같다. 그 밖에는 버전 칸이 null.
    옛 것 하나를 대신하는 것은 전체에서 하나. 따라가면 돌지 않는다

---

## 12. F-3 에 필요한 최소 (질문 8)

FINDINGS §13 Phase 1 게이트 — 두 사건 · 두 무리를 엇갈려 Claro 와 일반 기사를 읽히고, 같은 요점으로 만든 물음을 묻고, 며칠 뒤 다시 확인한다.
**§13 은 "확정" 표시가 없다.** 그래서 그 설계에서만 나오는 것(무리 · 일반 기사)은 타입에 넣지 않는다 (D30).

**반드시 있어야 하는 것** — 없으면 그날의 관찰이 사라진다

| 무엇 | 왜 | 이 계약 |
|---|---|---|
| 며칠 뒤에도 같은 `user_id` | 며칠 뒤 다시 묻는 것은 같은 사람이어야 한다 | §3. 되찾는 방법은 D31 |
| 무엇을 읽혔나 — 판 · 레벨 | 같은 답이 무엇을 읽은 뒤의 답인지 | ReadingPlanLog 의 `article_id` · `article_version` · `level` · `level_chosen_by`. 판의 ID 는 0.2m 이 골든에 발급한 뒤 |
| 물음의 판 | 두 무리가 **같은** 물음을 받았다는 증명 | Probe (`probe_id` · `version` · 글) |
| 물었다 · 답했다 | 무응답과 오답을 가른다. POST 와 DELAYED 를 가른다 | ProbeExposure (`position` · `shown_at`) · ProbeResponse |
| 어디까지 닿았나 | 요점이 있는 장에 닿지 않고 답한 것을 가른다 | ReadingEvent `SLIDE_ENTERED` · `LEVEL_SWITCHED` |
| 마지막 장의 끝이 나왔나 | 결론(요점 문장)의 끝이 화면에 나온 독자와 열자마자 떠난 독자를 가른다 | ReadingEvent `SLIDE_END_SHOWN` (D33) |
| 물음이 어느 요점에서 나왔나 | 두 무리가 **같은 요점으로** 물음을 받았다는 증명 | Probe `goal_ref` (D33) |

**미뤄도 되는 것**

| 무엇 | 왜 미뤄도 되나 |
|---|---|
| `block_decisions` | 정적 레벨에서는 (판 · 레벨)에서 계산된다. 판과 레벨만 남아 있으면 나중에 채워도 같은 값이다. **유일하게 되살릴 수 있는 칸** |
| `SELF_REPORT_KNOWN` | 버튼이 없다 |
| DIAGNOSTIC · ACTIVE · AUDIT | 뽑는 쪽이 없다. F-3 의 물음은 손으로 고른다 |
| `probe_plan` · `estimator_version` · `selected_blocks` · `skipped_blocks` · `narrative_form` · `model_version` | 채울 것이 없다 — 빈 목록 · null |
| `CLOSED` | 없어도 멈춘 장은 나온다 |
| 세션 예산 | 손으로 돌리면 한 번 앉은 것이 한 세션이다 |
| KnowledgeEvidence | 물음이 leaf 개념을 겨눌 때만 줄이 생긴다. **요점만 묻는 물음뿐이면 F-3 에서 한 줄도 안 생긴다** (§7.2 · §7.4) |

**F-3 전에 닫혀야 하는 것 — 지금 상태 (D33 뒤)**

**닫혔다 — 계약에서**

| 무엇 | 어떻게 닫혔나 |
|---|---|
| 장을 끝까지 읽었는지 | `SLIDE_END_SHOWN` — 장의 끝이 화면에 나왔다 (§5.4 · D33). "읽었다"는 기록이 말하지 않는다 |
| 새로고침이 새 열람인가 | 화면을 따른다 (§4.1 · D33) |
| 시험 · 개발 줄 가르기 | 줄에 표시를 두지 않는다. 시험 경로는 기록하지 않고 실제 독자는 배정표의 `user_id` 로 (§3 · D33) |
| 판을 가리키는 키 | `article_id` · `article_version` — 골든 기록에 발급됐다 (§2.1 · D30 · 0.2m-a) |
| 응답의 자리 | ProbeResponse (§7.4 · D30) |
| 물음이 요점을 가리키는 길 | `goal_ref` (§6.1 · D33) |
| 명제 나누기 | C-4 가 끝냈다 (D32). 못 나누게 되는 순간은 첫 KnowledgeEvidence 줄이다 (§7.2) |

**닫혔다 — 화면 (F-2b · 0.4b)**

| 무엇 | 어떻게 닫혔나 |
|---|---|
| `SLIDE_END_SHOWN` 을 내는 것 | 화면이 물음 버튼(마지막 장은 끝 묶음)을 내보내는 그 판정에서 같이 낸다 (F-2b `notice` → 0.4b 가 사건으로) |
| 새로고침 뒤 자리를 되살릴지 | 같은 탭에서 되살린다 = 같은 열람 (D26 닫힘). `reading_id` · 다음 `seq` · plan · 이미 적은 끝을 같이 되살린다 (D34) |
| 시험 경로가 기록을 안 남기게 | `/test` 는 기록하는 코드를 쓰지 않는다. 본 화면만, 링크에 `user_id` 가 있을 때만 |
| 판의 키를 화면이 받는 것 | 화면은 기사를 서버에서 받을 때 `article_id` · `article_version` 을 같이 받는다 (D34) |
| 기록을 보낼 곳 | API 가 있다 (D1 — 기록은 우리 API 를 거쳐서만 쓴다). **배포는 아직이다** (0.4c) — 실제 독자의 줄은 0 이다 |

**닫혔다 — 물음의 화면 (0.5 · D37)**

| 무엇 | 어떻게 닫혔나 |
|---|---|
| 물음을 보여주고 답을 받는 화면 | 기사 앞(읽기 전 하나)과 뒤(직후 셋)의 따로 선 화면. 며칠 뒤는 따로 선 주소. 한 번에 물음 하나 · 건너뛸 수 있다 · 맞았는지 보여주지 않는다 |
| 물음의 판 · 어느 요점에서 나왔나 | 넷 (판 1). P0 ~ P2 는 COMMON 요점, P3 은 개념 C-0002 (`goal_ref` null · target 하나) |
| 일반 기사를 읽은 독자의 답 | 물음만 있는 주소에서 받는다. plan 이 없다 — 노출 · 응답 (· P3 의 증거 줄)만 남는다 |

**남았다 — 운영 (D31 OPEN)**
- **배정표가 F-3 전에 있어야 한다 (D30).** 누가 · 어느 사건을 · Claro 로 / 일반 기사로 읽었는지를 `user_id` 로 묶은 표다. 원장의 타입이 아니다.
  없으면 일반 기사 뒤의 답이 **무엇을 읽은 뒤의 답인지**가 사라진다 — 답 자체는 ProbeExposure · ProbeResponse 로 남는다.
  **실제 독자와 시험 줄을 가르는 것도 이 표다** (§3)
- 누가 어느 `user_id` 인지의 대응표 · 며칠 뒤 같은 `user_id` 를 되찾는 방법 · 동의 · 보관 · 독자 배경 (§3)
- 정성 인터뷰("한 문장으로 말해봐")를 어디에 적나. 거기서 나온 교정은 CorrectionEntry (`gate` GATE_4 · `caught_by` OTHER_READER)로 남는다
- ~~F-3 의 물음이 요점만 묻나, 개념도 겨누나~~ → D37: P3 이 C-0002 를 겨눈다. 그 물음의 첫 응답이 C-0002 의 첫 증거 줄이다 (§7.2)
- ~~F-3 의 물음 자체~~ → D37: 넷 (판 1). §6
- 쓴 답(P1)을 읽고 가린 판정 · 명단(부호 · 무리 · 보낸 날)은 도윤이 저장소 · 데이터베이스 밖에 둔다 (D37)

---

## 13. 미확인

| 항목 | 이유 |
|---|---|
| 무엇이 기사의 새 판을 만드나 | 판이 2 인 실물이 없다 (§2.1 · DATA_MODEL §15) |
| open_question · span 을 가리키는 모양 | 가리키는 기록이 없다 |
| 층 표시를 켠 것 · 문장을 눌러 본 것 · 지나온 길을 펼쳐 본 것을 남길지 | D26 의 화면(B5)에 셋 다 있다. 지금 장을 바꾸지 않아 읽기 사건이 아니다. 읽을 소비자가 없다 |
| 끝나지 않은 열람과 떠난 열람을 가르는 시간 | 숫자다. 원장에서 나중에 정할 수 있다 |
| 세션의 경계 | 기사 여럿을 읽는 화면이 없다 |
| `narrative_form` 의 어휘 · 원천 | 패키지에 칸이 없다 |
| `model_version` 의 뜻 | 확정 §9.4 가 이름만 두었다 |
| `reason` 의 다른 값 | 추정기가 없다 |
| FULL 의 일부 단계만 보여준 것 | 실물 없음 |
| 기사가 필요로 하지만 어느 레벨도 가리키지 않는 개념 | 기사의 KC 목록이 계약에 없다. `block_decisions` 에 오르지 않는다 |
| `SELF_REPORT_KNOWN` 의 `position` · "모르겠어요" 같은 반대 보고 | 버튼이 없다 |
| 쓴 답을 사람이 가린 판정을 원장 안에 둘지 · 그 절차 | D37: 도윤이 읽고 가린다 — 원장 밖. 형식과 "모르겠다"는 §6.1 에서 정해졌다 |
| "처음 가는 장 앞에는 앞 장의 `SLIDE_END_SHOWN` 이 있다"를 불변식으로 올릴지 | D26 의 화면에서는 따라 나온다. 본 화면이 아직 스크롤로 넘긴다 — F-2b 가 옮긴 뒤에 |
| 화면이 자리를 되살린 것을 사건으로 남길지 | 되살릴지가 안 정해졌다 (F-2b) |
| AUDIT 을 뽑은 방법의 기록 | 뽑는 쪽이 없다 |
| 파이프라인 단계(`stage`) 어휘 | 확정 §10.3 "추측으로 설계하고 있다" |
| 교정끼리의 앞뒤 (같은 문안을 두 번 고침) | 실물 1쌍 — C-0002 v2 · v3. 지금은 Replacement 의 버전으로 이어진다 |
| 고치지 않고 남긴 것 · 견준 대안을 따로 적을지 | 실물은 `what_i_changed` 글 안에 있다 ("대안:" 6행 · "미처리" · "범위 밖") |
| 대신할 것 없이 거두기 · 독자에게 알리기 | 발행 뒤 교정의 실물이 없다 |

---

## 14. _open — 판정됨 → D30

초안의 _open 5개는 0.2c 게이트(D30 · 2026-10-09)에서 모두 초안대로 정해졌다.

| # | 물음 | 판정 (D30) |
|---|---|---|
| **1** | ArticleRecord 를 무엇으로 가리키나 | **`article_id` UUID + `article_version` 정수.** DATA_MODEL 의 ArticleRecord 가 이 둘을 갖는다 (DATA_MODEL §11). 골든에는 0.2m 이 발급한다. "무엇이 새 판을 만드나"는 미확인으로 둔다 (§13) |
| **2** | 응답을 어디에 두나 | **ProbeResponse 에 한 번.** 확정 §9.4 의 `response` · `is_correct` 자리를 옮기는 것이 승인됐다 (§7.4). 증거 줄은 `interaction_id` 로 가리킨다 |
| **3** | 독자를 어디까지 익명으로 두나 | **원장에는 뜻 없는 UUID 만.** 계약은 "원장에 사람을 알아볼 값이 없다"까지다. 대응표 · 동의 · 보관 · 독자 배경 · `user_id` 되찾기는 계약 밖 → **D31 (OPEN)** |
| **4** | 일반 기사를 읽힌 것 · 무리 배정을 원장에 남기나 | **타입에 넣지 않는다.** F-3 은 `user_id` 로 묶인 배정표로 돌린다 (D31). 배정표는 F-3 전에 있어야 한다 (§12) |
| **5** | `caught_by` 어휘 | **여섯 값.** 대조(`ARTIFACT_COMPARE`)와 1차 원문 재확인(`SOURCE_RECHECK`)을 합치지 않는다 — 이 칸으로 자동화할 검사를 센다 |

초안이 스스로 내린 판단(0.2c 로그 "도출하며 판단한 것") — D30: **수용.**

---

## 15. 교정 기록의 원본 — `logs/correction-log.jsonl` (D33)

**원본은 `logs/correction-log.jsonl` 이다 (D33).** 한 줄에 CorrectionEntry 하나. 새 교정은 여기에 덧붙인다.
**`logs/correction-log.csv` 는 얼렸다** — 42행에서 멈춘 옛 원본이다. 지우지 않는다(옮긴 줄의 글을 견줄 기준이다). 새 행을 쓰지 않는다 — 검사가 실패로 잡는다.
CSV 에는 머리말을 적을 방법이 없어 `logs/correction-log.csv.FROZEN.md` 가 그렇게 말한다.

CSV 에서 옮긴 42줄:

| 무엇 | 어떻게 옮겼나 |
|---|---|
| 글 — `what_was_wrong` · `what_i_changed` · `source_of_catch`(→ `catch_note`) · `date` · `error_type` · `event_id`(→ `event_code`) | **한 글자도 바꾸지 않았다.** 검사가 CSV 와 글자 단위로 견준다 |
| `correction_id` | 행마다 UUID 를 발급했다 |
| `gate` · `occasion` · `stage` · `targets` · `caught_by` · `check` | **초안이다 — 사람이 확인한다 (D33: 초안 표시는 남긴다).** 행마다 `_draft` 에 그 칸 이름이 있다. 확인한 행에서 지운다. 검사는 WARN 으로 센다 |
| `type_note` | **옮기지 않았다 — 전부 null.** "유형: …" 문단(6행)을 떼어 내면 `what_i_changed` 의 글자가 바뀐다. 글은 그대로 두고, 이 칸은 새로 적는 행부터 쓴다 |
| `replacements` | CONCEPT_VERSION 6건 (C-0002 1→2 · 2→3 / C-0005 1→2 · 2→3 / C-0008 1→2 / C-0010 1→2). `old_id` · `new_id` 는 `docs/content/concept-library.json` 의 `concept_id` 다 (0.2m-a 가 발급한 뒤 채웠다) |
| `after_publication` | 전부 false |
| `time_spent_min` | 전부 null — CSV 에 한 번도 안 적혔다. 되살릴 수 없다 |

`_row`(CSV 의 몇째 행이었나) · `_draft` 는 CSV 에서 옮긴 줄의 주석이다. 새로 쓰는 줄에는 없다.  (ARTICLE_PACKAGE 의 `_` 주석과 같은 방식). 계약의 칸이 아니다 — 독자 원장에는 허용하지 않는다 (불변식 1).

---

## 16. _open — 판정됨 → D33

0.2m-b 가 올린 _open 5개는 0.2m 게이트(D33 · 2026-10-09)에서 모두 추천 (a) 로 정해졌다.

| # | 물음 | 판정 (D33) | 계약 |
|---|---|---|---|
| **6** | 마지막으로 닿은 장을 끝까지 읽었는지를 남기나 | **읽기 사건 하나를 더한다 — 장마다 "이 장의 끝이 화면에 나왔다".** 시간 · 기준값 없이 사실만 | `SLIDE_END_SHOWN` · §5.2 · §5.4 · 불변식 22 |
| **7** | 새로고침이 새 열람인가 | **화면을 따른다** — 자리를 되살리면 같은 열람, 1장부터면 새 열람. 되살릴지는 F-2b 가 도윤에게 묻는다 | §4.1 |
| **8** | 시험 · 개발 중의 줄을 어떻게 가르나 | **표시를 두지 않는다.** 시험 경로는 기록하지 않고, 실제 독자는 배정표(D31)의 `user_id` 로 가른다 | §3 · 불변식 2 |
| **9** | 교정 기록을 어디에 어떤 파일로 | **`logs/correction-log.jsonl`. CSV 는 얼린다** | §15 |
| **10** | 이름 있는 사람 검사를 어디에 적나 | **`check` = 잡은 절차의 이름** (기계 검사에 묶지 않는다) | §8.3 · §8.4 · 불변식 20 |

`type_note` 를 옮기지 않은 것 — D33: 수용.
