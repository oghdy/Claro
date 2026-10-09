# development · backend

## 현재 위치
**Phase 0 / Step 0.2c — 완료 (2026-10-09 · D30 반영). 다음: 0.2m**

## Phase 0 — 계약 확정
계약이 없으면 구현이 없다. Phase 0의 산출물은 코드가 아니라 `docs/contract/` 3종이다.

| Step | 내용 | 산출 | 세션 | 상태 |
|---|---|---|---|---|
| 0.0a | 프로토타입 역산 (있는 그대로) | `fixtures/*.observed.json` | S1 | ☑ 2026-09-20 |
| 0.0b | 오류 교정 → 골든 픽스처 | `fixtures/fomc-2026-09.article.json` | S2 | ☑ 2026-09-21 |
| 0.1a | ARTICLE_PACKAGE.md 작성 | 계약 1 | S3 | ☑ 2026-09-29 · D20 |
| 0.1b | 골든을 계약에 맞춰 재작성 (+게이지 → 대조) | 골든 v2 · invalid 재생성 · 검증 스크립트 | 새 세션 | ☑ 2026-09-29 · D23 (`logs/backend/phase-0-step-0-1b.md`) |
| 0.2a | CONCEPT_IDENTITY.md — 되돌리기 가장 어려운 계약 | 계약 3 | 새 세션 | ☑ 2026-09-30 · D25 (`logs/backend/phase-0-step-0-2a.md`) |
| 0.2b | DATA_MODEL.md — Fact · Source · 시간 · volatility · Claim · Bridge · Storyline · Event | 계약 2 | 새 세션 | ☑ `b832391` · `61a82b1` · 2026-10-09 |
| 0.2c | OBSERVATION.md — 독자 기록(knowledge_evidence · reading_plan_log · probe) · 교정 기록. **F-3 전에** | 계약 4 | 새 세션 | ☑ 2026-10-09 · D30 (`logs/backend/phase-0-step-0-2c.md`) |
| 0.2m | 이전 — 라이브러리 · 골든을 계약 모양으로. UUID 발급, 참조를 객체로, 프론트 검증기(`validate.ts:115` 문자열만 받음) 수정. **F-3 전에** | 라이브러리 v · 골든 v3 | — | ☐ 프롬프트 준비 2026-10-09 — a · b 둘로 나눔 (아래) |
| 0.3 | D1 기술 스택 결정 | DECISIONS D1 | 세션 아님 | ◐ 프론트 결정 2026-09-29 · 백엔드는 0.2 뒤 |
| 0.4~ | 스키마 구현 | 마이그레이션 | Step당 세션 | ☐ |

> **순서**: 0.2a → 0.2b → 0.2c. 0.2b 의 Concept 참조가 0.2a 에 기댄다.
> 0.2c 는 F-3(실제 독자 테스트) 전에 끝나야 한다 — 기록하지 않은 관찰은 복구 불가 (FINDINGS §9.4).
> 계약 도출 원천은 실물 또는 FINDINGS "확정" (D24).

---

## Step 0.0a — 프로토타입 역산

### 세션 개시 프롬프트 (복붙)

```
prototypes/ 의 슬라이드 프로토타입 2개를 JSON으로 역산해라.

읽을 것 (이것만):
  CLAUDE.md
  docs/FINDINGS.md  §4(콘텐츠 모델) §8(UI/UX)
  docs/content/concept-library.md
  prototypes/fomc-slides.html
  prototypes/ftc-slides.html

산출:
  fixtures/fomc-2026-09.observed.json
  fixtures/ftc-2026-08.observed.json

이 작업의 정의:
  HTML에 실제로 있는 구조를 JSON으로 옮기는 것. 그 이상도 이하도 아니다.

하지 말 것:
  - 고치지 마라. 오류가 보여도 그대로 옮겨라. 교정은 Step 0.0b의 일이다
  - 스키마를 설계하지 마라. 계약은 Step 0.1에서 이 산출물을 보고 쓴다
  - docs/contract/ 를 열지 마라. 비어 있는 게 정상이다
  - 블록 타입을 통합하거나 정리하지 마라. 둘로 보이면 둘로 남겨라

오류를 발견하면:
  고치지 말고 그대로 옮기되, 반드시 _findings 에도 적어라.
  "그대로 옮겼다"와 "발견했다"는 동시에 성립한다. 침묵하지 마라.

반드시 보존할 것:
  - h1의 줄바꿈 (작가가 리듬을 지정한 것이다)
  - <b> 등 인라인 강조
  - 슬라이드 순서와 장수
  - kicker 텍스트 (서사 기능 라벨이다. 장식이 아니다)
  - teaser(open_question)와 그 이동 대상
  - 입문/숙련이 각각 무엇을 담고 있는지 (부분집합이 아니다)

판단이 필요하면:
  멈추고 결정하지 마라. 출력 JSON 최상단 "_findings" 배열에 적어라.
  형식: { "question": "...", "observed": "...", "why_it_matters": "..." }
  예: 슬라이드와 블록의 층 관계 / 같은 fact 가 레벨마다 다른 문장으로 나타나는 경우.
  위는 예시다. **이 목록에 없는 것을 찾는 것이 이 배열의 목적이다.**
  이 배열이 비어 있으면 대충 한 것이다.

추가로 확인해 답할 것 (관찰 가능한 사실만. 설계하지 마라):
  프로토타입에 렌더 시점 계산이 있는가?
  (예: 날짜 간격을 시각적 길이로 표현, 수치를 막대/위치로 변환)
  있다면 어디서 무엇을 계산하는지, 없다면 없다고 적어라.

완료하면:
  logs/backend/phase-0-step-0a.md 에 엔트리 작성
  커밋: B-0.0a
```

### 완료 조건
- [x] FOMC 입문 8장 / 숙련 5장, FTC 7장이 전부 표현됨 — 13 + 7 = 20장
- [x] 블록 타입이 18종 이상 등장 (FOMC 13 + FTC 5 — 통합되면 덜 나온다)
      → DOM signature 기준 **18종** (FOMC 14 + FTC 11 − 공통 7). 각 파일 `_dom_inventory` 에 기계 추출값.
      → JSON block type 기준으로는 13종. kicker·h1·teaser를 슬라이드 필드로 올리고 `small`·`warn` 같은
         수식어를 variant/modifier 필드로 뒀기 때문이다. **통합이 아니라 층 선택이다 — 정보는 안 버렸다.**
         내가 한 선택은 `_transcription_notes` 에, 그 선택이 왜 내 몫이 아닌지는 `_findings` 첫 항목에 있다.
- [x] `_findings` 가 비어 있지 않다 — FOMC 22건 · FTC 17건
- [x] 검증: `observed.json` 의 슬라이드 수·순서가 원본 HTML과 일치 — 공백 제거 후 **문자 단위 대조 20장 전부 일치**
- [x] 로그 작성 / 커밋 — `logs/backend/phase-0-step-0a.md` (검증 출력 + 스크립트 전문 포함)
- [x] 완료일: 2026-09-20

### PM 검수 결과 (2026-09-20)
**통과.** 블록 통합 없음(`_dom_inventory` 에 원시 보존). 텍스트 대조 재현됨.
`docs/contract/` 미열람 확인. `_findings` 를 DECISIONS 승격하지 않고 PM 에게 넘긴 것도 규칙대로다.

S1 이 PM.md 를 읽지 않고도 속도계 오류(FOMC-16)를 독립적으로 찾아냈다.
"미리 주지 않는다" 장치가 작동한 것으로 본다.

---

## Step 0.0b — 오류 교정 → 골든 픽스처

### 세션 개시 프롬프트 (복붙)

```
fixtures/fomc-2026-09.observed.json 을 교정해 골든 픽스처를 만들어라.

읽을 것 (이것만):
  CLAUDE.md
  docs/DECISIONS.md                      D8 · D9 · D13 · D15 · D16
  docs/FINDINGS.md                       §4.5(한 문장에 개념 하나) §7.7(편집 규칙)
  docs/content/concept-library.md        C-0002 · C-0005
  docs/findings/fomc-2026-09-brief.md    사실 ID(F01~)와 출처
  fixtures/fomc-2026-09.observed.json

산출:
  fixtures/fomc-2026-09.article.json            골든
  fixtures/invalid/volatile-missing-asof.json
  fixtures/invalid/derived-from-volatile.json
  logs/correction-log.csv                       교정 1건당 1줄 append
  logs/backend/phase-0-step-0b.md

교정 대상 — 이 다섯 개만 고친다:
  1. 입문 3장 속도계.
     C-0002 는 "4단계를 먼저 제시한 뒤에만 비유를 쓴다"고 못박았다.
     observed 는 4단계 없이 비유가 먼저 나온다. 실제 독자가 이해하지 못한 그 형태다.
  2. 숙련 1장 "12 : 0" 과 숙련 4장 "18명 중 16명"이 설명 없이 나란히 나온다.
     C-0005 가 "독자가 반드시 멈춘다"고 금지한 패턴이다.
  3. 숙련 4장 "2026년 PCE 전망 3.7%" 에 헤드라인/근원 표기가 없다.
     브리프 F15(헤드라인 3.7%) / F16(근원 3.4%). 사실 충돌이 아니라 라벨 누락이다.
  4. 숙련 4장 "dot 은 8개뿐, 4명은 오히려" — 같은 것을 세는 단위가 한 문장에 둘이다.
  5. 발행 시점에 고정된 시간 표현 ("201일째", "3주 뒤" 등). D8 을 적용한다.

교정 원칙:
  - 최소 변경. 교정이지 재집필이 아니다. 위 다섯 개와 무관한 문장은 건드리지 마라
  - 새 사실을 만들지 마라. 브리프에 있는 사실만 쓴다
  - 새 문장이 필요하면 concept-library 의 FULL / REFRESHER 문안을 먼저 가져다 쓴다
  - 고치는 방법이 둘 이상이면 (예: 2번 — 개념 설명 추가 vs 인원수 행을 빼고
    §7.7 대로 중앙값 비교만 남기기) 가장 작은 변경을 적용하고,
    대안을 correction-log 에 같이 적어라. 최종 선택은 도윤이 게이트에서 한다
  - 장수가 늘어나도 된다. 늘어난 슬라이드도 D15 를 지켜야 한다:
    마지막 제외 모든 슬라이드에 teaser 가 있고, 다음 슬라이드가 그 질문에 답한다

구조에 대해:
  - observed 의 구조를 그대로 쓴다. 스키마를 새로 설계하지 마라
  - 교정하면서 필요해진 정보(사실 출처, volatility, 개념 참조)는
    "_" 로 시작하는 주석 필드로 붙여라. 예: "_fact_refs", "_volatility", "_concept_ref"
    무엇을 정식 필드로 올릴지는 다음 Step 이 정한다
  - 슬라이드 문장이 브리프의 어느 사실에도 대응하지 않으면
    "_fact_refs" 를 비우고 로그에 적어라. 그게 이 작업의 부산물 중 가장 중요하다
  - observed 의 _findings / _dom_inventory / _transcription_notes 는 가져오지 마라.
    골든은 깨끗해야 한다 (D9)

invalid fixture:
  골든을 복사하고 위반을 딱 하나만 주입해라. 무엇을 위반했는지 "_violation" 에 적어라.
    volatile-missing-asof   VOLATILE 인 값에서 as_of 를 뺀다
    derived-from-volatile   DERIVED 값의 출처 중 하나를 VOLATILE 로 바꾼다
  FOMC 에 자연스러운 VOLATILE 사례가 없으면 만들어도 된다. invalid 는 원래 인공적이다.

correction-log.csv:
  error_type 은 기존 5종(팩트 누락 / Goal 왜곡 / 오독 미방어 / 스토리라인 stale / 압축)
  중에서 고르되, 맞는 게 없으면 억지로 넣지 말고 새 이름을 쓰고 로그에 이유를 적어라.
  time_spent_min 은 비워라. 도윤의 게이트 시간을 적는 칸이다.

하지 말 것:
  - 다섯 개 외의 교정. 다른 문제가 보이면 로그에 적고 넘어가라
  - resolves 필드 만들기 (D15)
  - docs/contract/ 열기
  - FTC 건드리기. 골든은 FOMC 만이다

완료하면:
  observed ↔ article 의 슬라이드별 diff 를 로그에 붙여라
  scripts/ 에 검증 스크립트를 남겨라 (최소: D15 QA① + 골든에 _findings 가 없는지)
  커밋: B-0.0b [GATE]
  → 도윤 에디토리얼 게이트를 통과해야 완료다. 세션이 완료를 선언하지 마라
```

### 완료 조건
- [x] 교정 5건 전부 반영, 각각 correction-log 1줄
- [x] 다섯 개 외 문장 변경 없음 (diff 로 확인) — `scripts/diff-observed-article.py`, 로그에 전문
- [x] 마지막 제외 모든 슬라이드에 teaser (D15 QA①) — 스크립트로 (`scripts/verify-article.py`)
- [x] 골든에 `_findings` · `_dom_inventory` · `_transcription_notes` 없음 — 스크립트로
- [x] invalid 2건, 각각 위반 정확히 1개 — 스크립트가 골든과 1군데 차이 + 선언 code 로만 거부를 확인
- [x] **게이트: 도윤 승인** — 교정 vs 재집필 경계, 2번 대안 선택 — 게이트 3 통과, 판정자 도윤
- [x] 완료일: 2026-09-21

### PM 확인 사항 (S2 종료 후)
- `_fact_refs` 가 빈 문장 목록 — 사실 누락인지 작가가 지어낸 건지 분류
- `_` 주석 필드 목록 → S3 입력으로 정리
- 게이트 결과를 correction-log 에 반영

---

## Step 0.1a — ARTICLE_PACKAGE.md 작성

### 세션 개시 프롬프트 (복붙)

```
골든 픽스처에서 Article Package 계약을 도출해라.
Article Package = 백엔드가 프론트에 넘기는 완성 기사 한 벌의 모양이다.
모든 사용자에게 같다. 개인화는 여기 들어오지 않는다.

읽을 것 (이것만):
  CLAUDE.md
  docs/DECISIONS.md                   D8 · D9 · D11 ~ D18
  docs/FINDINGS.md                    §3.3 · §4.1 ~ 4.2 · §8
  docs/development-backend.md         "Step 0.1a 가 답해야 할 것" 절
  fixtures/fomc-2026-09.article.json  골든. 주 입력이다
  fixtures/ftc-2026-08.observed.json  경계축 블록 어휘. 블록 모양만 본다
  logs/backend/phase-0-step-0b.md     "S3 입력" 절만 (_ 주석 필드 목록)

산출:
  docs/contract/ARTICLE_PACKAGE.md
  logs/backend/phase-0-step-0-1a.md

이 작업의 정의:
  골든과 FTC observed 에 실제로 있는 것에서 계약을 도출한다.
  둘에 없는 것을 계약에 넣지 마라. 필요해 보이면 "미확인"으로 적어라.

이미 확정된 제약 (DECISIONS):
  D13 · D17  슬라이드와 블록은 2층. open_question 은 슬라이드 사이의 독립 데이터다
  D15        읽기 흐름은 선형. resolves 필드 없음. 비선형 참조 불허
  D16        open_question 은 teaser 에서만 나온다
  D8 · D12   DERIVED 는 value_at_authoring 을 내보낸다. 렌더 시점 계산 없음
  D11        상태축 블록 어휘는 미확인이라고 계약에 명시한다
  D14        블록 — 아래

D14 — 블록:
  1. S1 의 블록 타입(FOMC 9 · FTC 8)은 일부러 최대로 쪼갠 목록이다.
     한 층 아래의 원형을 찾는 게 네 일이다. "재사용률 0%"를 근거로 쓰지 마라.
     D14 에 참고안이 있다. 참고안이지 정답이 아니다
  2. 원형마다 근거 기사를 적어라 (FOMC / FTC / 둘 다).
     한 기사에서만 나온 원형은 "근거 1건"이라고 표시해라
  3. 모든 블록은 정규 텍스트를 가진다. 옵션이 아니다
  4. 극성 · 순서 · 강조처럼 의미를 가진 표시는 정규 텍스트에 글자로 살아 있어야 한다
  5. 시각 블록은 정규 텍스트가 말하지 않는 것을 말할 수 없다
  6. 블록당 정답 표현은 하나다. 시각 데이터와 텍스트를 둘 다 독립 저장하지 마라.
     어느 쪽을 정답으로 둘지는 네가 실물을 보고 정하고, 이유를 적어라

범위:
  넣는다  프론트가 받아서 그리는 데 필요한 것
          (예: 문장이 원문 인용인지 우리 해석인지 — §8.4)
  뺀다    Fact · Concept · Storyline 자체의 저장 구조. Step 0.2 소관이다.
          여기서는 ID 로 참조하고, 그 값이 어디서 오는지는 "0.2 에서 정의"로 남겨라.
          같은 타입을 두 계약에 정의하면 안 된다

골든을 고치지 마라:
  골든은 계약과 모양이 달라도 된다. 계약에 맞춰 다시 쓰는 건 Step 0.1b 다.
  대신 계약 끝에 "골든과 다른 점" 목록을 남겨라. 그게 0.1b 의 작업 목록이 된다.
  게이지 눈금 [33, 62] (D14 규칙 5 위반)도 그 목록에 넣어라.

판단이 필요하면:
  멈추고 정하지 마라. 로그에 "_open" 으로 적어라. 도윤이 게이트에서 정한다.
  편집 판단이 걸린 것은 계약에서 선택지를 열어둔다.
  예: 게이지를 실제 값 기반 척도로 살릴지, 두 값 비교로 바꿀지.

하지 말 것:
  - D18 (질문 슬라이드 = probe) 설계. OPEN 이다
  - probe · 개인화 · 사용자 상태
  - docs/contract/DATA_MODEL.md · CONCEPT_IDENTITY.md 열기 · 쓰기
  - 골든 · observed · invalid 수정

완료하면:
  "Step 0.1a 가 답해야 할 것" 표의 항목마다 [계약 반영 / _open / 0.2 로 / 범위 밖] 표시
  원형 목록과 각 원형의 근거 기사를 로그 맨 앞에 요약
  커밋: B-0.1a [GATE]
  → 도윤 게이트를 통과해야 완료다. 세션이 완료를 선언하지 마라
```

### 완료 조건
- [x] `ARTICLE_PACKAGE.md` 에 D13 · D15 · D16 · D17 · D8 · D11 · D14 가 모두 반영됨
- [x] 원형마다 근거 기사 표시, 근거 1건 원형 식별됨 — sheet (scale 은 D20 으로 제거)
- [x] 모든 원형에 정규 텍스트 정의 + 정답 표현 방향과 이유 — 계약 §7.1-3
- [x] "골든과 다른 점" 목록 (게이지 포함) — 계약 §12 · 부록 A
- [x] findings 표 전 항목에 처리 표시 — 아래 표 "처리 (S3)" 열
- [x] Fact · Concept 저장 구조를 정의하지 않음 (0.2 침범 없음) — `scripts/verify-contract-coverage.py` 7번
- [x] **게이트: 도윤 승인** — D20, 판정자 PM (도윤 위임)
- [x] 완료일: 2026-09-29

### PM 확인 사항 (S3 종료 후)
- "한 타입 한 파일" — ARTICLE_PACKAGE 가 Fact 구조를 몰래 정의하지 않았는지
- 근거 1건 원형이 과하게 일반화되지 않았는지 (§13)
- `_open` 목록을 도윤 게이트 질문으로 정리

---

## Step 0.1a 게이트 반영 — S3 세션에 보낼 것

```
0.1a 게이트 판정이 나왔다. D20 (docs/DECISIONS.md) 을 읽고 계약에 반영해라.
판정자: PM (도윤 위임).

ARTICLE_PACKAGE.md 에 반영할 것:
  1. _open-1 → (b). scale 원형을 뺀다. 원형 5개. Block 유니언에서 Scale 제거.
     §7.8 은 지우지 말고 "척도 — 미확인. 두 번째 사례 전까지 두지 않는다 (D20)" 로 §10 에 옮겨라.
     §12 항목 8 을 "게이지 → contrast 두 항목. 글자는 그대로" 로
  2. _open-2 → (a). 판단을 싣는 색 금지, 판단이 필요하면 글(claim)로.
     sheet v_modifier · callout warn · 그라데이션은 패키지에 없다
  3. _open-3 → (a). §7.5 에 "순서 목록의 간격은 순서만 뜻한다. 간격이 의미를 가지면 작가가 글로 쓴다"
  4. _open-4 → 형태 자유, 단 답이 안 난 물음이 담겨야 한다. 레벨에 묶지 않는다. 형태 필드 없음.
     물음이 담겼는지는 게이트 3
  5. _open-5 → Level.id 는 "basic" | "intermediate" | "advanced". 기사는 1~3개.
     레벨이 하나면 그 기사가 쓰인 레벨. "only" 는 쓰지 않는다
  6. §6 에 층 판정 규칙: "사실인지 해석인지 애매하면 claim 으로 단다" + 이유 (D20)
  7. §6 · §9-6 에 대기 표시: 0.2 이전 **픽스처에서만** refs 에 0.2 대기 표시를 허용한다.
     모양은 네가 정해라. 발행 불변식은 그대로 — 대기 표시가 있으면 발행하지 않는다
  8. §11 _open 표를 "판정됨 → D20" 으로 바꾼다
  9. §12 항목 6 · 11 을 D20 규칙대로 고친다.
     항목 11: _volatility · _published_at_basis 는 픽스처에 _ 주석으로 남긴다
     (0.2 가 자리를 정할 때까지 D8 검증과 invalid 가 이걸 쓴다)
  10. CHANGELOG 한 줄

scripts/verify-contract-coverage.py 도 맞게 고쳐라 (원형 5개, §11 판정됨, §12 게이지 항목).
돌려서 전부 PASS 인 것을 로그에 붙여라.

logs/backend/phase-0-step-0-1a.md 에 한 줄: "게이트 판정 D20, 판정자 PM (도윤 위임), 2026-09-29"
docs/development-backend.md 0.1a 게이트 항목 체크 + 완료일
커밋: B-0.1a 게이트 반영 → push
```

---

## Step 0.1a 후속 (D22) — S3 세션에 보낼 것

```
D22 (docs/DECISIONS.md) 를 읽고 계약에 반영해라. 네가 올린 두 건의 판정이다.

  1. §12-6 이란 시나리오 문장("이 전쟁이 끝나면 … 훨씬 나빠질 수도 있어요")은 claim.
     refs 는 _refs_pending { until: "0.2", need: "DerivedClaim" }.
     이란 규칙("fact, refs 대기")은 사실을 서술한 문장에만 적용한다고 §12-6 에 적어라
  2. Level.label 을 뺀다. 표시 이름은 프론트가 id 에서 가져온다.
     레벨이 하나인 기사는 levels.length == 1 로 안다. §1 · §3 · 부록 A 를 맞춰라
  3. verify-contract-coverage.py 를 맞게 고치고, 돌린 결과를 로그에 붙여라
  4. CHANGELOG 한 줄

목록 밖에서 한 세 가지(body 선택 · id 순서 · _refs_pending 모양)는 수용됐다 (D22).
커밋: B-0.1a D22 반영 → push
```

---

## Step 0.1b — 골든을 계약에 맞춰 다시 쓴다

### 세션 개시 프롬프트 (복붙) — 위 D22 반영 커밋이 올라온 뒤에

```
골든 픽스처를 ARTICLE_PACKAGE 계약 모양으로 다시 써라.

읽을 것 (이것만):
  CLAUDE.md
  docs/DECISIONS.md                   D8 · D9 · D14 · D15 · D17 · D20 · D22
  docs/contract/ARTICLE_PACKAGE.md    전부. 특히 §6 · §9 · §12 작업 목록 · 부록 A
  fixtures/fomc-2026-09.article.json  지금 골든
  fixtures/invalid/*.json
  scripts/verify-article.py · scripts/diff-observed-article.py

산출:
  fixtures/fomc-2026-09.article.json   계약 모양
  fixtures/invalid/*.json              새 골든에서 다시 만든다 (골든 + 위반 1개)
  scripts/verify-article.py            계약 §9 불변식 + D8 검사로 개정
  scripts/ 에 옛 골든 → 새 골든 독자 글 대조 스크립트
  logs/backend/phase-0-step-0-1b.md

가장 중요한 규칙 — 독자가 읽는 글자는 하나도 바뀌지 않는다:
  바뀌는 건 모양뿐이다. 게이지도 contrast 두 항목이 될 뿐 글자는 그대로다.
  옛 골든과 새 골든의 독자 글(kicker · headline · 본문 · 인용 · 목록 · 대조 · 표 · open_question)을
  문자 단위로 대조하는 스크립트를 만들어라. <br>→\n 같은 서식 변환 외에 한 글자라도 다르면 실패다.

작업은 계약 §12 목록대로 한다. 판단이 필요한 곳은 D20 규칙을 따른다:
  - 사실인지 해석인지 애매하면 claim 으로 단다
  - F · DC 섞인 span: 추론이 하나라도 있으면 claim, refs 는 DC 만.
    끊긴 F 연결은 _ 주석에 남긴다 (0.2 가 쓴다)
  - partial: 브리프 사실이 그 문장을 다 말하면 fact, 넘어서면 claim
  - 이란 전쟁 unsupported 4: 글은 그대로. 사실을 서술한 문장은 fact, refs 0.2 대기.
    단 시나리오·전망 문장("이 전쟁이 끝나면 … 나빠질 수도 있어요")은 claim, refs 0.2 대기 (D22)
  - 브리프 산문 1 ("회의 내부 기록은 3주 뒤에 공개돼요"): fact, refs 0.2 대기
  - 브리지 후보 2: bridge, refs 0.2 대기
  - 0.2 대기 표시는 계약 §6 의 방식대로. 검증 스크립트는 WARN 으로 세고 개수를 로그에 적는다
  - _volatility · _published_at_basis 는 _ 주석으로 남긴다. D8 검증과 invalid 가 계속 쓴다

판정이 애매했던 span 은 전부 목록으로 남겨라 — [원래 kind · 붙인 layer · 이유 한 줄].
PM 이 이 목록만 검수한다.

하지 말 것:
  - 독자 글 수정. 문장이 이상해 보여도 로그에 적고 넘어가라
  - 계약 수정. 계약과 안 맞는 게 보이면 로그에 적고 멈춰라
  - DATA_MODEL · CONCEPT_IDENTITY 열기 · 쓰기
  - observed · FTC 건드리기

완료하면:
  검증: 계약 §9 불변식 전부 · D8 · invalid 2건이 선언한 위반으로만 거부 · 독자 글 불변
  검증 스크립트가 실제로 실패할 수 있는지 일부러 망가뜨린 사본으로 확인
  결과 출력을 로그에 그대로 붙여라
  커밋: B-0.1b → push
```

### 완료 조건
- [x] 새 골든이 계약 §9 불변식 전부 통과
- [x] 독자 글 불변 대조 PASS (115단위 · 3294자)
- [x] invalid 2건 재생성, 각각 선언한 위반으로만 거부
- [x] 0.2 대기 표시 개수가 WARN 으로 보고됨 (D23 반영 후 13 span)
- [x] 애매했던 층 판정 목록 (34건, 로그)
- [x] **PM 검수** (D20 — 독자 글이 안 바뀌므로 에디토리얼 게이트 없음) — D23 으로 반영, 독자 글 1건 수정은 도윤 승인
- [x] 완료일: 2026-09-29

---

## Step 0.2m-a — 이전: 라이브러리 · 골든을 계약 모양으로 (새 세션)

입력이 확정됐다 (2026-10-09): 골든 글 `3de2974` (C-5 2차 반영) · 라이브러리 `a48e0ad` (C-4 반영) · 계약 넷 · D26.

### 세션 개시 프롬프트 (복붙)

```
라이브러리와 골든을 계약 모양으로 옮긴다 (Step 0.2m-a). 계약 넷이 다 정해졌고, 골든의 글과 라이브러리 문안도 확정됐다.
지금 골든과 라이브러리는 계약 이전의 모양이다 (문자열 참조 "C-0002" · "F31" · UUID 없음). 실제 독자 기록(F-3)이 시작되기 전에 옮겨야 한다.

읽을 것 (이것만):
  CLAUDE.md
  docs/FINDINGS.md          §8.2 · §9.2 · §9.5
  docs/DECISIONS.md         D8 · D15 · D16 · D17 · D22 · D23 · D25 · D26 · D27 · D29 · D30 · D32
  docs/contract/            넷 전부. 특히 CONCEPT_IDENTITY §16 · DATA_MODEL §17 · §18 (이전 목록)
  docs/content/concept-library.md
  docs/findings/fomc-2026-09-brief.md · docs/findings/storyline-iran-war.md
  fixtures/                 골든 · invalid
  logs/content/golden-correction-2026-10.md   "C-5 [GATE] 반영" 절과 "2차 반영" 절만 — §17 표에서 어긋난 줄 · _source_note · 새 사실
  logs/content/concept-split-2026-10.md       끝의 "반영" 절만 — 계약과 어긋난 줄의 표 · 백엔드에 넘길 것 14개
  logs/content/source-check-2026-10.md        새 사실의 1차 구절이 필요할 때만 찾아본다
  scripts/                  기존 검사
  packages/contract/src     프론트의 타입 · 검증기 (같은 계약의 두 번째 구현)
  docs/development-frontend.md  "0.2m (이전) 때 프론트가 할 것"

지금 빨간불 (먼저 확인해라):
  verify-data-model FAIL — DATA_MODEL §17 표가 골든의 옛 문장을 글자로 적고 있다
  selftest-verify-concept-identity 멈춤 — 라이브러리의 옛 글자("version: v3")를 찾는다
  (verify-observation FAIL 은 네 일이 아니다 — 0.2m-b 가 고친다)

할 일 — 이 순서로, 단계마다 커밋:
  1. 계약을 실물에 맞춘다. DATA_MODEL §17 · CONCEPT_IDENTITY 의 실물 수 · selftest.
     **같은 일이 다음 교정 때 또 생기지 않게 해라** — 계약 문서가 살아 있는 실물의 글자 · 개수를 적어 두고 검사가 그것을 대조하는 곳을 찾아,
     어떻게 할지 안을 내라 (날짜 붙은 기록으로 두기 / 검사에서 빼기 / 실물에서 계산하기). 계약의 뜻이 바뀌는 선택이면 _open
  2. 라이브러리 → CONCEPT_IDENTITY §16 목록대로. 개념 13개에 UUID. code · 문안 · 버전 이력은 그대로.
     **독자 글(FULL · REFRESHER · ANALOGY · BOUNDARY)은 한 글자도 바꾸지 마라.** 옮기기 전후 문안을 기계로 대조해 보여라
  3. 골든 → DATA_MODEL §18 목록대로. ConceptRef { concept_id, version, part } · C-0002 는 v4 에 고정 · C-0003 을 가리키던 셋은 C-0012@1 ·
     article_id · article_version · Event · Storyline 의 UUID + code · Fact · Claim · Bridge 참조.
     저작 데이터(사실 · 해석 · 반증 기록)를 브리프와 C-3 · C-5 기록에서 옮긴다 — **있는 것만.** 1차 구절이 기록에 없는 사실은 만들지 말고 대기로 남겨라
     **독자 글은 한 글자도 바꾸지 마라** — compare-reader-text 로 이전 전후 차이 0 을 보여라. open_question 8 · 4 개도
  4. packages/contract 를 따라가게 한다 — 타입 · validate.ts (refs 가 문자열만 통과한다) · 테스트.
     apps/web 은 typecheck · test 가 통과하는 데 필요한 최소만. **화면에 보이는 것은 0 바뀐다.** apps/web/src/lab 은 건드리지 마라
  5. invalid 재생성 · 검사 전부 통과 · 망가뜨린 사본으로 새 검사가 진짜 실패하는지

정하지 말고 답하거나 _open 으로 올릴 물음 (실물 · 확정으로 답이 나오면 계약에 반영하고, 아니면 게이트에서 정한다):
  a. D26 — 넘어가는 방법이 물음 버튼 하나뿐이다. 그러면 마지막을 뺀 모든 슬라이드 뒤에 open_question 이 반드시 하나 있어야 한다.
     ARTICLE_PACKAGE 가 지금 그것을 요구하나 (골든은 9장 · 8개, 5장 · 4개로 맞는다). D18 의 전제("질문이 별도 슬라이드")가 바뀐 것도 같이
  b. 반증 기록의 답이 발행 뒤 문서에만 기댈 때 발행할 수 있나 (D29-6)
  c. VOLATILE 값이 바뀌어 생긴 새 Fact 와 옛 Fact 의 앞뒤를 잇는 기록의 자리 (DATA_MODEL §15 는 OBSERVATION 을 가리키는데 거기엔 틀린 것만 있다)
  d. Comprehension Goal 을 가리킬 타입이 없다 (OBSERVATION Probe 가 요점을 못 가리킨다)
  e. span 의 `_source_note` (C-5 가 새로 쓴 주석 키) · 사실 ID 없는 "바뀌는 값"(숙련 3장 "60% 안팎")을 적을 자리 · "201일째"의 war_start (C-3 이 2/28 을 확인했다)
  f. 입문 4장 ③ 두 span 에 C-0012 참조를 더할지 (D32 1-2) · C-0010 BOUNDARY 가 FULL · REFRESHER 와 함께 나오는지의 검사 (Q-C2)
  g. alias 를 빼거나 제시 규칙만 바뀐 것이 버전을 올리는 일인가 · 명제가 바뀐 버전의 사유("evidence 0 예외")를 담을 칸

하지 말 것:
  - 독자 글 · 개념 문안 수정. 틀린 곳이 보이면 로그에 적어라
  - OBSERVATION.md · logs/correction-log.csv · scripts/verify-observation.py (0.2m-b 가 같은 시간에 고친다)
  - apps/web 의 화면 · lab · 디자인. 금지 항목(가중치 · 임계값 · 추정기)
  - 브리프를 고쳐 쓰는 것 — 브리프는 원천 자료다. 옮기기만 한다

완료하면:
  - 검사 전부의 결과를 로그에 (verify-article · compare-reader-text · verify-contract-coverage · verify-concept-identity · verify-data-model ·
    각 selftest · lint-concepts · pnpm -s typecheck · pnpm -s test). pnpm test 가 logs/frontend 의 그림을 바꾸면 되돌린다
  - `verify-data-model --report` 의 "발행에서 막히는 것"이 몇 건 남았고, 그 가운데 독자에게 닿는 것이 무엇인지
  - 물음 a ~ g 마다 [계약 반영 / _open / 미확인] + 근거를 로그 맨 앞에
  - logs/backend/phase-0-step-0-2m-a.md · development-backend.md 체크
  커밋: B-0.2m-a [GATE] → push. 파일은 하나씩 지정해서 add (같은 작업 트리에 다른 세션이 있다)
```

## Step 0.2m-b — 교정 기록 이전 · OBSERVATION 을 D26 에 맞춘다 (0.2c 세션에 이어서)

### 보낼 것 (복붙) — 기존 0.2c 세션에. 닫혔으면 새 세션에 "먼저 읽을 것" 한 줄을 붙여서

```
0.2c 의 후속이다 (Step 0.2m-b). 세 가지를 한다. docs/DECISIONS.md D26 · D29 · D30 · D31 을 먼저 읽어라.
(새 세션이면 먼저: CLAUDE.md · docs/contract/OBSERVATION.md · logs/backend/phase-0-step-0-2c.md · logs/correction-log.csv ·
 docs/development-content.md 의 "correction_log" 절 · docs/development-frontend.md 의 "F-2b 에 넘길 것")

1. 지금 verify-observation 이 FAIL 이다 — 계약 §8 이 "실물 14행"의 집계를 적어 두었는데 CSV 가 42행이 됐다 (C-5 가 28행을 더했다).
   계약을 실물에 맞추고, **행이 늘 때마다 깨지지 않게 해라** (날짜 붙은 기록으로 두기 / 검사에서 빼기 / 실물에서 계산하기 — 안을 내고, 계약의 뜻이 바뀌면 _open)
2. logs/correction-log.csv 를 계약 모양으로 옮긴다 (OBSERVATION §15 목록). 42행 전부.
   - 어디에 어떤 파일로 두는지는 계약이 "미확인"으로 남겼다 — 안을 내고 _open. 정해질 때까지 CSV 원본은 지우지 마라
   - caught_by · occasion · targets 는 행마다 네가 초안을 적고 "사람이 확인한다" 표시. 글(what_was_wrong · what_i_changed · catch_note)은 한 글자도 바꾸지 마라
   - 새 28행에는 C-3 의 1차 원문 대조로 잡은 것이 있다 — SOURCE_RECHECK 의 첫 실물이다
3. D26 이 정해졌다: 한 번에 한 장, 넘어가는 방법은 물음 버튼 하나, 물음 버튼은 그 장을 다 읽었을 때 나온다.
   §12 "F-3 전에 닫혀야 하는 것" 셋을 이 결정 위에서 다시 봐라:
   - 장 안에서 끝까지 읽었는지 — 이 구조에서는 다음 장에 들어간 것이 앞 장을 끝낸 것이다. 그러면 남는 것은 무엇인가 (마지막 장 — 요점 문장이 거기 있다)
   - 새로고침이 새 열람인가 · 시험 줄 가르기 — 실물(apps/web/src, lab/b5)이 답을 주면 반영하고, 아니면 안을 내고 _open
   - 읽기 사건이 여전히 방향 · 손짓을 모르는지, "지나온 길"로 되돌아가는 것이 지금 사건으로 적히는지 확인
   숫자(시간 · 기준값)는 넣지 마라. probe 를 놓는 자리는 여전히 설계하지 마라 (D18 — 전제가 바뀌었다는 것만 적어라)

하지 말 것: 다른 계약 · 골든 · 라이브러리 · apps · packages 수정 (0.2m-a 가 같은 시간에 골든과 다른 계약을 옮긴다). 금지 항목

완료하면: verify-observation · selftest 결과 + 망가뜨린 사본 · _open 목록을 로그 맨 앞에 · logs/backend/phase-0-step-0-2m-b.md
  커밋: B-0.2m-b [GATE] → push. 파일은 하나씩 지정해서 add
```

---

## Step 0.2c 게이트 반영 (D30) — 0.2c 세션에 보낼 것

```
0.2c 게이트 판정이 나왔다. docs/DECISIONS.md D30 · D31 을 읽어라. 초안은 통과다. _open 5개는 전부 네 초안대로다.

OBSERVATION.md 에 반영:
  1. §14 _open 5개를 "D30 으로 정해짐"으로 닫는다. 본문의 "_open-N" 표시도 같이
     - _open-2: 확정 §9.4 의 response · is_correct 자리를 옮긴 것이 판정으로 승인됐다고 §7.4 에 적는다
     - _open-3: 대응표 · 동의 · 보관 · 독자 배경 · user_id 되찾기는 계약 밖 → D31 (OPEN). 계약은 "원장에 사람을 알아볼 값이 없다"까지
     - _open-4: 타입에 넣지 않는다. F-3 은 user_id 로 묶인 배정표로 돌린다 (D31). §12 에 "배정표가 F-3 전에 있어야 한다"를 적는다
  2. §13 미확인 가운데 셋을 §12 "F-3 전에 닫혀야 하는 것"으로 옮긴다 — 기록하지 않으면 복구할 수 없는 것들이다:
     장 안에서 끝까지 읽었는지 (§5.4 · D26 뒤) / 새로고침이 새 열람인가 / 시험 · 개발 중에 생긴 줄 가르기.
     **모양은 지금 정하지 마라.** 무엇이 정해져야 하는지와 언제까지인지만 옮긴다
  3. §7.2 또는 §12 에: 명제를 못 나누게 되는 순간은 첫 KnowledgeEvidence 줄이다 (D30-2)
  4. CHANGELOG

DATA_MODEL.md (이번에 한해 고친다 — _open-1):
  ArticleRecord 에 article_id (UUID) · article_version (정수). 불변 · 유일. "무엇이 새 판을 만드나"는 미확인으로.
  ARTICLE_PACKAGE §10 의 "패키지 자체의 ID — 미확인"에는 가리키는 한 줄만. 두 파일 모두 CHANGELOG
  골든에는 아직 넣지 마라 (0.2m 의 일). 검사에서는 "0.2m 대기" WARN 으로

하지 말 것:
  - 골든 · 라이브러리 · correction-log.csv · apps 수정
  - probe 놓는 자리 (D18) · 넘기는 방향 (D26) 에 기대는 내용
  - 숫자 (시간 · 개수 · 기준값)

완료 조건:
  verify-observation · selftest-verify-observation · verify-data-model · selftest-verify-data-model ·
  verify-article · verify-concept-identity · verify-contract-coverage 결과를 로그에 붙인다. 회귀 없음
  커밋: B-0.2c 게이트 반영 (D30) → push. 파일은 하나씩 지정해서 add (같은 작업 트리에 다른 세션이 있다)
```

**0.2m 프롬프트에 실을 것 (D29 · D30)**: 골든에 article_id · version 발급 · correction-log 이전 11항목 (OBSERVATION §15) ·
VOLATILE 값이 바뀐 Fact 의 앞뒤를 잇는 기록의 자리 · Goal 을 가리킬 타입 · 반증 기록의 답이 발행 뒤 문서에만 기댈 때 (D29-6).
뒤의 셋은 물음으로만 싣는다 — PM 이 답을 정하지 않는다.

---

## Step 0.2c — OBSERVATION.md 작성

### 세션 개시 프롬프트 (복붙)

```
관찰 기록 계약(OBSERVATION)을 써라. 두 가지를 담는다:
독자가 무엇을 했고 시스템이 무엇을 보여줬는지의 기록, 그리고 게이트에서 무엇을 고쳤는지의 기록.
첫 실제 독자 테스트(F-3) 전에 있어야 한다 — 기록하지 않은 관찰은 복구할 수 없다 (FINDINGS §9.4).

읽을 것 (이것만):
  CLAUDE.md                 특히 "절대 하지 말 것"
  docs/FINDINGS.md          §8.3 · §9.1 ~ §9.6 · §10.3 · §13 (Phase 1 게이트)
  docs/DECISIONS.md         D17 · D18 · D20 · D21 · D24 · D25 · D26 · D27
  docs/contract/ARTICLE_PACKAGE.md    §1 · §3 · §4 · §5 · §10
  docs/contract/CONCEPT_IDENTITY.md   §3 · §8 · §10
  docs/contract/DATA_MODEL.md         §2 · §11
  logs/correction-log.csv             실물. 교정 기록
  docs/development-content.md         "correction_log" 절 (오류 유형 · 유형 규칙)
  apps/web/src (lab 제외)             실물. 지금 화면이 실제로 만들 수 있는 읽기 사건
  logs/frontend/F-1.md · logs/frontend/F-2a.md   레벨 전환 · 넘기는 방식 · 층 표시

산출:
  docs/contract/OBSERVATION.md   (새 파일. 다른 계약과 같은 머리말 · CHANGELOG)
  logs/backend/phase-0-step-0-2c.md

도출 원칙 (D24): 실물 또는 FINDINGS "확정". 둘 다 아니면 "미확인". 실물 없는 구조엔 "실물 없음".
  독자 기록은 아직 한 줄도 없다. FINDINGS §9.4 확정이 주 원천이고, 실물은 화면이 실제로 낼 수 있는 사건이다.

반드시 답할 것:
  1. knowledge_evidence — 독자가 무엇을 했나 (§9.4 확정). **사실만 기록한다. 가중치 · 해석은 넣지 않는다.**
     개념은 무엇으로 가리키나 — evidence 는 leaf 에만 (CONCEPT_IDENTITY §8). 그때 본 문안 버전은 어떻게 남기나
  2. reading_plan_log — 시스템이 무엇을 보여줬나 (§9.4 확정). 이게 없으면 1 을 해석할 수 없다.
     MVP 는 독자가 고르는 정적 레벨이다 (§9.3). 개념마다 무엇을 보여줬는지(SKIP · REFRESHER · FULL)는
     ConceptRef.part (D25) 와 같은 말을 쓰는가
  3. 읽기 사건 — 완독은 마지막 슬라이드 도달이다 (§8.3). "몇 장에서 멈췄나".
     레벨 전환이 이탈로 기록되면 안 된다 (FOMC-21 · F-1 로그).
     넘기는 방향은 아직 안 정했다 (D26) — 방향에 기대지 않는 사건으로 정의해라
  4. probe — 유형 넷과 위치 PRE · POST · DELAYED (§9.4 확정). 무응답은 증거가 아니다. 예산은 세션 단위다.
     **어디에 놓을지는 D18 이 OPEN 이다. 놓는 자리를 설계하지 마라.** 기록의 모양만
  5. 무엇을 봤는지 가리키기 — 기록이 "어느 기사의 어느 판 · 어느 레벨 · 어느 슬라이드"를 가리켜야 한다.
     패키지 자체의 ID 는 ARTICLE_PACKAGE §10 에 미확인으로 남아 있다. ArticleRecord (DATA_MODEL §11) 와 어떻게 짝이 되나
  6. 독자를 무엇으로 식별하나 — F-3 은 20~30명이다 (§13). 익명인가, 무엇을 저장하지 않는가
  7. 교정 기록 — 실물 CSV 의 열을 그대로 출발점으로. stage 값이 들쭉날쭉하다(writing · data_model · 게이트 3 · concept_library …).
     유형 칸(성격 · 처방)과 발견 칸(무엇이 잡았나)의 구분 (development-content 유형 규칙).
     발행 뒤 사실이 틀린 것으로 드러났을 때 무엇이 무엇을 대체했는지 (DATA_MODEL §2.3 이 여기로 넘겼다)
  8. F-3 에 필요한 최소 — §13 Phase 1 게이트(같은 요점으로 만든 물음, Claro 와 일반 기사 비교, 며칠 뒤 재확인)를
     돌리려면 위 기록 중 무엇이 반드시 있어야 하나. 나머지는 미뤄도 되는가

하지 말 것 — CLAUDE.md 가 금지한 것 그대로:
  - 가중치 · 임계값 · 반감기 · 전파 · 설명 필요도 공식. user_concept_state 스키마 (그건 언제든 다시 계산하는 캐시다)
  - 추정기 인터페이스, shadow · A/B 기반 시설
  - 화면 구현 · 사건 전송 코드. 계약만 쓴다
  - 다른 계약 수정. 맞지 않는 곳은 로그에 적어라
  - 골든 · 라이브러리 · apps/ 수정

판단이 필요하면 멈추고 로그에 _open 으로. 게이트에서 정한다.

완료하면:
  - 8개 질문마다 [계약 반영 / _open / 미확인] + 근거를 로그 맨 앞에
  - 기존 correction-log.csv 를 이 계약 모양으로 옮기면 무엇이 바뀌는지 목록 (0.2m 입력)
  - 프론트가 이 계약대로 기록을 남기려면 화면에 무엇이 더 필요한지 목록 (F-3 입력). 구현하지 마라
  - 검증 스크립트 + 일부러 망가뜨린 사본. 기존 검사도 다시 돌려라
  커밋: B-0.2c [GATE] → push
```

### 완료 조건
- [x] 8개 질문 처리 표시 + 근거
- [x] CLAUDE.md 금지 항목 없음 (가중치 · 임계값 · 추정기)
- [x] probe 를 놓는 자리를 설계하지 않음 (D18)
- [x] correction-log 이전 목록 · 프론트에 필요한 것 목록
- [x] 검증 스크립트 + 망가뜨린 사본, 회귀 없음
- [x] **게이트** — D30 (2026-10-09). 반영: _open 5개 초안대로 · ArticleRecord `article_id` · `article_version` (DATA_MODEL) · 미확인 셋 → F-3 전 · 독자 운영은 D31
- [x] 완료일: 2026-10-09

---

## Step 0.2b 게이트 반영 (D27) — 0.2b 세션에 보낼 것

```
0.2b 게이트 판정이 나왔다. D27 (docs/DECISIONS.md) 을 읽고 반영해라. 판정자: PM (도윤 위임).

  1. _open-1 → (a). fact_type 은 7값으로 닫는다
  2. _open-2 → (a). 발행하려면 Fact 마다 1차 출처
  3. _open-3 → Fact · Claim · Bridge · Source 는 추천대로 UUID + label.
     **Event · Storyline 도 UUID + code 로 한다 (추천과 다르다).** code 는 지금 쓰는 문자열
     ("FOMC-20260916" · "SL-iran-war") 그대로이고 유일 · 불변 — Concept 의 code 와 같은 방식. 이유는 D27.
     §2.1 · §9 · §13 · §18 을 맞추고, ARTICLE_PACKAGE 의 event_ref 문구도 맞춰라 (참조 문구 범위)
  4. "도출하며 판단한 것" 표의 판단들은 수용됐다
  5. §16 을 "판정됨 → D27" 로. CHANGELOG 한 줄
  6. §17 의 레인: "9월 초" · "3주 뒤" · 1차 출처 없는 사실 · 인용 원문 · DERIVED 입력 사실 → 콘텐츠 C-3.
     해석 5 · DC-A~E 기록 · DC-C 범위 → C-5. 원문 위치(span) · 공개 시점 증명 → 파이프라인 (손으로 안 한다)
  7. 독자 글 수정 1건 (도윤 승인): 입문 7장 대조의
     세 명만 “올리자”고 반대  →  세 명만 올리자고 반대   (따옴표만 뺀다. 줄바꿈은 그대로)
     - 골든을 고치고 invalid 2건을 다시 만든다
     - compare-reader-text 의 허용된 차이에 이 한 건을 더한다 (2건이 된다. 그 밖의 차이는 여전히 실패)
     - correction-log 1행: stage = 게이트(0.2b) · error_type = 레이어 혼입 (해석이 원문 표시를 달았다) ·
       source_of_catch = 0.2b 인용 검사 · time_spent_min 비움

검증 스크립트 전부(기존 것 포함) 다시 돌려 로그에 붙이고, development-backend.md 0.2b 체크 + 완료일
커밋: B-0.2b 게이트 반영 → push
```

---

## Step 0.2b — DATA_MODEL.md 작성

### 세션 개시 프롬프트 (복붙)

```
데이터 계약(DATA_MODEL)을 써라. 사실 · 출처 · 시간 · 해석 · 브리지 · 스토리라인이 저장되는 모양이다.
ARTICLE_PACKAGE 는 이것들을 ID 로만 가리켰다. 이 계약이 그 주인이다.

읽을 것 (이것만):
  CLAUDE.md
  docs/FINDINGS.md          §4.1 · §5 전부 · §6.2 상태 코드 · §7.1 · §7.2 · §9.2
  docs/DECISIONS.md         D6 · D8 · D20 · D22 · D23 · D24 · D25
  docs/contract/ARTICLE_PACKAGE.md    §0 · §1 · §6 · §7.4 · §8 · §9 · §12
  docs/contract/CONCEPT_IDENTITY.md   §1 · §3 · §6 · §12 (ConceptRef · BridgeSlot 과의 짝)
  docs/findings/fomc-2026-09-brief.md       실물: F01~F37 · DC-A~E · Storyline · Coverage
  docs/findings/ftc-personalized-pricing-brief.md · docs/findings/screwworm-c-type-brief.md   사실 표 · 유형 비교용
  fixtures/fomc-2026-09.article.json   _refs_pending · _fact_refs_dropped · _volatility · _attribution_refs
  docs/development-backend.md          "Step 0.2 가 답해야 할 것 (S4)" 표 · "계약 변경 요청" R-1

산출:
  docs/contract/DATA_MODEL.md
  logs/backend/phase-0-step-0-2b.md

도출 원칙 (D24): 실물 또는 FINDINGS "확정". 둘 다 아니면 "미확인". 실물 없는 구조엔 "실물 없음".

반드시 답할 것:
  1. Fact — 필드와 fact_type 어휘. 브리프(POLICY_ACTION · VOTE · HISTORICAL_CONTEXT …)와
     FINDINGS §5.2(OFFICIAL_ACTION · OFFICIAL_CLAIM · MEASUREMENT …)가 다르다. 하나로.
     §5.2 확정: 기관이 "주장한 것"은 사실이 아니라 "주장했다는 사실"이다
  2. Source — 원문 보관 · 원문 위치(span) · Fact ↔ Source N:M · source_registry 권리 필드 (§5.1 · §5.3 · §5.5 확정)
  3. 시간 — §5.3 의 네 필드. 그리고 R-1: 패키지 published_at 이 JSON 에서 어떤 모양인가 (날짜만 / 시각). D6 은 OPEN 이다
  4. volatility — D8 값 셋은 그대로. 어디에 붙나: S2 가 본 것은 "문장 조각"이다
     (F11 "2026년"은 STABLE, 본문 "올해"는 DERIVED — 같은 사실, 다른 분류).
     공식 · as_of 같은 저작 데이터의 자리, 골든 _volatility 가 옮겨갈 곳
  5. DerivedClaim — 기대는 사실(골든 _fact_refs_dropped 가 갈 곳), 반증 기록 (§7.2 확정). 실물: 브리프 DC-A~E
  6. Bridge — CONCEPT_BRIDGE / STORY_BRIDGE (§4.1 확정). CONCEPT_IDENTITY 의 BridgeSlot 과 어떻게 짝이 되나.
     실물: 골든 브리지 2개 — 그중 "그런데 지금 미국은 3%대입니다"는 사실(F31)을 품고 있다
  7. Storyline · Event — 독립 객체, 버전이 있다 (§9.2 확정). 실물: 이란 사실은 FOMC 사건이 아니라 SL-iran-war 소속 (도윤 관찰).
     §9.2 는 "발행된 기사가 스토리라인 버전을 고정한다"고 했는데 ARTICLE_PACKAGE 에 그 필드가 없다 — 필요한가
  8. 인용 — 인용 블록의 출처 표시가 어느 사실 · 원문을 가리키나 (골든 _attribution_refs), 인용부호는 글인가 표시인가 (FOMC-6)
  9. 참조 모양 — FactRef · ClaimRef · BridgeRef. ConceptRef(0.2a)와 함께 ARTICLE_PACKAGE 의 "Ref(ID)" 문구를 맞춰라.
     0.2a 가 찾은 불일치: §0 "Ref(ID)로만 가리킨다" / §1 Ref 타입 / §6 표의 "골든 concept 20"(지금 21).
     **ARTICLE_PACKAGE 는 이 항목에 한해 직접 고쳐도 된다** — §0 · §1 · §6 의 참조 문구와 CHANGELOG 만
  10. 골든 대기 13 — 이 계약으로 풀리는 것(브리지 2 · 사실 승격 1)과, 콘텐츠 작업을 기다리는 것
      (사실 출처 5 → C-2 · C-3, 해석 도출 5 → 반증 절차)을 목록으로. 콘텐츠 작업을 대신 하지 마라

하지 말 것:
  - knowledge_evidence · reading_plan_log · probe · correction_log (0.2c)
  - Concept 구조 (0.2a 에 있다. 가리키기만)
  - Coverage Schema 전체 설계 — 슬롯 상태 코드(§6.2 확정)가 Fact 에 닿는 부분만. 나머지는 미확인
  - FINDINGS §9.6 보류 항목
  - 골든 · 브리프 · 라이브러리 수정. ARTICLE_PACKAGE 는 위 9번 범위만

판단이 필요하면 멈추고 로그에 _open 으로. 게이트에서 정한다.

완료하면:
  - 10개 질문마다 [계약 반영 / _open / 미확인] + 근거를 로그 맨 앞에
  - 골든 · 브리프를 이 계약 모양으로 옮길 때의 작업 목록 (0.2m 입력)
  - 검증 스크립트 + 일부러 망가뜨린 사본으로 실제로 실패하는지 확인. 기존 검사도 다시 돌려라
  커밋: B-0.2b [GATE] → push
```

### 완료 조건
- [x] 10개 질문 처리 표시 + 근거 — 로그 맨 앞 표 (_open 3: fact_type 닫기 · 1차 출처 필수 · ID 체계)
- [x] ARTICLE_PACKAGE 참조 문구 정합 (§0 · §1 · §6) — `verify-contract-coverage.py` 통과
- [x] 대기 13 분류 (계약으로 풀림 / 콘텐츠 대기) — 계약 §17. 이 계약으로 3 · 콘텐츠 10 (레인 없는 것 2)
- [x] 0.2m 이전 작업 목록 — 계약 §18 + `verify-data-model.py --report`
- [x] 검증 스크립트 + 망가뜨린 사본, 기존 검사 회귀 없음 — `scripts/verify-data-model.py` · `scripts/selftest-verify-data-model.py` (사본 80)
- [x] **게이트** — D27 (2026-10-03). 반영: fact_type 7값 · 1차 출처 필수 · Event · Storyline 도 UUID + code · 레인(C-3 · C-5 · 파이프라인) · 독자 글 1건(“올리자”)
- [x] 완료일: 2026-10-09

---

## Step 0.2a 게이트 반영 (D25) — 0.2a 세션에 보낼 것

```
0.2a 게이트 판정이 나왔다. D25 (docs/DECISIONS.md) 를 읽고 계약에 반영해라. 판정자: PM (도윤 위임).

  1. _open-1 → (b). ConceptRef 에 part 추가. §3.2 · §6.3 · §12 · §13 을 맞추고,
     브리지 검사를 part 기반으로 바꿔라. 네가 찾은 빈틈(③ · 비유를 바꿔 말하고 ④ 를 뺌)이
     이제 잡히는 것을 일부러 망가뜨린 사본으로 보여라. part 가 null 로 빠져나가는 것은 게이트 3 이라고 적어라
  2. _open-2 → (a). code 는 만들 때 붙인다
  3. _open-3 → (c). Topic 은 두지 않는다. 생기면 Concept 밖에 둔다 (§8 · §14 에 적어라)
  4. _open-4 → 계약은 명제를 나누지 않는다. "콘텐츠 레인 C-4 가 판정, 마감 F-3 (첫 evidence 전)" 으로 적어라
  5. 이름 옮김(concept_id = UUID, code = "C-0002") 수용
  6. §15 를 "판정됨 → D25" 로. CHANGELOG 한 줄
  7. ARTICLE_PACKAGE §6 이 ConceptRef 를 가리키는 곳이 part 추가와 맞는지 확인하고,
     안 맞으면 고치지 말고 로그에 적어라 (ARTICLE_PACKAGE 수정은 따로 한다)

검증 스크립트 · 자체 시험을 맞게 고치고 결과를 로그에 붙여라.
docs/development-backend.md 0.2a 체크 + 완료일
커밋: B-0.2a 게이트 반영 → push
```

---

## Step 0.2a — CONCEPT_IDENTITY.md 작성

### 세션 개시 프롬프트 (복붙)

```
개념 정체성 계약(CONCEPT_IDENTITY)을 써라.
이 프로젝트에서 되돌리기 가장 어려운 계약이다 (FINDINGS §9.5): 잘못되면 에러 없이 조용히 데이터가 썩는다.
천천히, 근거를 대며 써라.

읽을 것 (이것만):
  CLAUDE.md
  docs/FINDINGS.md          §4.3 · §4.4 · §9.4 · §9.5 · §9.6 · §12.4
  docs/DECISIONS.md         D19 · D20 · D22 · D24
  docs/content/concept-library.md     실물. 개념 10개, 버전 이력, conflicting alias 사례
  docs/contract/ARTICLE_PACKAGE.md    §6 만 (concept span 과 Ref)
  logs/content/concept-lint-2026-09.md · logs/content/concept-rewrite-2026-09.md
  logs/correction-log.csv
  fixtures/fomc-2026-09.article.json  concept span 만 (layer: concept)

산출:
  docs/contract/CONCEPT_IDENTITY.md
  logs/backend/phase-0-step-0-2a.md

도출 원칙 (D24):
  원천은 실물 또는 FINDINGS 의 "확정" 항목이다. 둘 다 아니면 "미확인".
  - 실물: 라이브러리 10개 · 버전을 올린 사례 4건(C-1b) · conflicting alias 1건 · prereq 관계 · 골든의 concept span
  - FINDINGS 확정: §9.5 (UUID · alias · status · merge redirect · split 금지 · Resolver 3구간 · Topic/leaf)
  - §9.6 보류는 넣지 마라: 임계값 수치 · propagation · posterior · evidence weight
  merge · split · PROVISIONAL 은 실물 사례가 없다. 되돌리기 어려운 구조라 FINDINGS 확정대로 구조는 넣되,
  절차 세부에는 "실물 없음"을 표시해라.

반드시 답할 것:
  1. concept_id — 라이브러리는 사람이 읽는 "C-0002", FINDINGS §9.5 는 UUID. 둘의 관계와 어느 쪽이 불변인가
  2. 버전 고정 — 발행된 기사는 개념 버전을 고정해야 한다 (§4.3).
     실물: 골든이 C-0002 를 가리키는데 v2 → v3 에서 ④ 단계가 사라졌다. 버전을 안 고정하면 없는 단계를 가리킨다.
     ARTICLE_PACKAGE 의 concept Ref 가 정확히 무엇을 가리켜야 하나
  3. 버전을 올릴 때와 새 개념을 만들 때의 경계.
     실물: C-1b 네 건 — 문안 교체(C-0010 · C-0008), 양화사·회의값 제거(C-0005), 단계 하나를 브리지로 이전(C-0002)
  4. conflicting_alias — "dynamic pricing" 이 두 정반대 뜻으로 쓰인다 (C-0010)
  5. "브리지 필수" 표시 — C-0002 v3 는 ①②③ 만 갖고 ④ 는 기사가 브리지로 붙인다.
     빠뜨리면 실제 독자 검증을 통과한 유일한 흐름(2026-09-18 4단계)이 깨진다. 개념에 이걸 적을 자리와 검사 방법
  6. Topic 과 leaf KC (§9.5) — 라이브러리 10개는 각각 무엇인가. evidence 는 leaf 에만 (§9.4)
  7. 개념 문안의 필드 — 명제 · FULL · REFRESHER · ANALOGY · BOUNDARY · 비유 한계선.
     D19 린트 ①(REFRESHER ⊆ 명제 ∪ FULL)이 이 구조에 기댄다. 비유 한계선은 독자에게 안 보이는 저작 메모다
  8. 소유 — 이 계약이 Concept 의 주인이다. ARTICLE_PACKAGE §6 의 layer "concept" 와 어떻게 짝이 되나

하지 말 것:
  - knowledge_evidence · user_concept_state 스키마 (0.2c). "evidence 는 leaf 에만" 같은 제약만 적는다
  - Fact · Claim · Bridge · Storyline (0.2b). Bridge 가 Concept 을 어떻게 가리키는지는 "0.2b 에서"로 남긴다
  - 라이브러리 수정 · concept_id 변경
  - FINDINGS §9.6 보류 항목

판단이 필요하면 멈추고 로그에 _open 으로 적어라. 게이트에서 정한다.

완료하면:
  - 위 8개 질문마다 [계약 반영 / _open / 미확인] 과 근거(실물 또는 FINDINGS 절)를 로그 맨 앞에 요약
  - 라이브러리 10개를 이 계약 모양으로 옮기면 무엇이 빠지고 무엇이 바뀌는지 목록 (0.2 이후 작업 목록)
  - 계약을 기계로 확인하는 스크립트 (다른 계약들처럼), 일부러 망가뜨린 사본으로 실제로 실패하는지 확인
  커밋: B-0.2a [GATE] → push
```

### 완료 조건
- [x] 8개 질문 전부 처리 표시 + 근거 — 로그 맨 앞 표
- [x] §9.6 보류 항목 없음 — `scripts/verify-concept-identity.py` 검사 A
- [x] 실물 없는 구조에 "실물 없음" 표시 — 검사 A
- [x] 라이브러리 → 계약 이전 목록 — 계약 §16 + `--report`
- [x] 검증 스크립트 + 일부러 망가뜨린 사본 — `scripts/selftest-verify-concept-identity.py` (사본 39 → 게이트 반영 뒤 49)
- [x] **게이트** — D25 (2026-09-30). 반영: part · code · Topic · C-4 · 이름 옮김
- [x] 완료일: 2026-09-30

---

## Step 0.1a 가 답해야 할 것 (S3)

### 원 findings (S1)
| # | 질문 | 비고 | 처리 (S3) |
|---|---|---|---|
| FOMC-3 | `open_question` 이 반드시 질문이어야 하나 (입문 `Q …?` / 숙련 `· 명사구`) | | **_open** (_open-4) — 계약은 `text` 만 둔다 (§5) |
| FOMC-4 | `kicker` 가 서사역할·출처·개념표시 세 가지를 한 문자열에 담고 있다. 쪼개나 | 0.0b 게이트 증거: 같은 개념이 두 장에 걸치자 ①①② — "개념 표시"와 "독자용 번호"가 부딪혔다 | **계약 반영** §4 — 표시 문자열 하나. 개념 표시는 span `concept` refs 가 맡는다 |
| FOMC-9 | 표시 변형 중 무엇이 의미이고 무엇이 순수 표시인가 (`stats.up` vs `margin-top`) | **D14 규칙 3 이 판정 기준이다.** 빨간색은 텍스트에 없는 판단을 더한다 | **계약 반영** §7.10 판정표 · 판단 색(`up`·`warn`·그라데이션)은 **_open** (_open-2) |
| FOMC-10 | `slide_count` 는 데이터인가 파생값인가 (완독 측정 기준값) | D17 로 질문이 슬라이드가 되면 장수 정의가 흔들린다 | **계약 반영** §4 — `slides.length`, 저장 안 함. open_question 은 세지 않는다 |
| FOMC-11 | 같은 인용이 레벨마다 다르게 잘린다. fact 하나에 레벨별 표현인가 | | **계약 반영** §3 — 레벨마다 독립된 글, 같은 Ref · 원문 구간은 **0.2 로** |
| FOMC-12 | 레벨은 필터가 아니라 별도 선택이다. 계약이 어떻게 담나 | §3.3 의 실물 시험 | **계약 반영** §3 — 레벨마다 slides · open_questions 를 통째로 |
| FOMC-14 | gauge 는 값을 받나 위치를 받나. 축 기준은 어디에 | **D14 위반 사례.** 선택지를 열어두고 도윤이 고른다 | **_open** (_open-1) §7.8 — 값 기반 척도 / 두 값 대조 |
| FOMC-17 | 비유와 한계선이 데이터상 한 단위인가. 속도계 한계선이 5장 뒤에 있다 | | **0.2 로** — 비유와 한계선의 묶음은 Concept 저장 구조. 패키지는 span 만 싣고 슬라이드 사이 참조는 없다 (D15) |
| FOMC-20 | 마지막 슬라이드 probe 진입점이 입문에만 있다. 레벨별로 다르게 두나 | D18 은 OPEN. 설계하지 않는다 | **범위 밖** — probe 진입(D18 OPEN). `end_actions` 는 패키지 밖 |
| FOMC-22 | timeline `when` 이 날짜와 기간 라벨("9월 초")을 섞는다 | 등간격 표시는 D14 규칙 3 게이트 판단 대상 | **계약 반영** §7.5 — label 은 글, 계산 없음 · 등간격은 **_open** (_open-3) |
| FTC-11 | `quote` 가 인용이 아닌 데 쓰인다. §8.4 소스 레이어 구분이 깨진다 | | **계약 반영** §7.4 — 출처 없으면 인용 아님 → `contrast` |
| FTC-12 | 출처 표시가 블록 타입에 따라 있다가 없다가 한다 | | **계약 반영** §6 — 출처는 블록 타입이 아니라 span `layer` |
| FTC-13 | 관할이 둘은 pill, 셋째는 산문 | | **계약 반영** §7.6 — 구조 / 산문 둘 다 허용. 3항 대조는 미확인 |
| FTC-15 | FTC 는 레벨이 없다. 레벨 1개 허용하나 (`id="only"` 는 S1 이 지어낸 이름) | | **계약 반영** §3 — 레벨 1개 허용 · `id` 는 **_open** (_open-5) |
| FTC-16 | `steps` 번호·기호가 데이터인가 렌더링인가 | D14 규칙 2: 순서는 정규 텍스트에 살아야 한다 | **계약 반영** §7.5 — 번호는 저장 안 함, 선형화가 붙인다 |
| FTC-17 | 연속한 `rule_line` 두 개가 대조 한 쌍이다. 한 블록인가 | D14 규칙 2: 극성은 정규 텍스트에 살아야 한다 | **계약 반영** §7.6 — 대조 블록 하나 |

### 0.0b 이후 추가된 관찰 — 설계 결정 아님. 관찰로만 전달한다
| 관찰 | 출처 | 처리 (S3) |
|---|---|---|
| **골든에 Bridge 를 표시할 자리가 없다.** C-0002 ④ 문장에서 concept 표시를 떼자 그 문장이 무엇인지 적을 필드가 없었다. FINDINGS §4.1 은 Bridge 를 Evidence Layer 로 정의했다 | S2 · correction-log 7행 | **계약 반영** §6 — `layer: bridge`. refs 모양은 0.2 |
| 이란 사실들은 FOMC 사건이 아니라 **SL-iran-war 소속**이다. 골든이 참조해야 할 사실을 스토리라인이 직접 소유한다 | 도윤 · 2026-09-21 | **0.2 로** — 패키지는 Ref 만 싣는다 |
| `refs` 에 `DC-*`(Derived Claim)를 `F-*` 와 섞어 넣었다 | S2 | **계약 반영** §6 — span 하나에 layer 하나, refs 는 그 층 것만 |
| 문장 분할 규칙(`.?!` 뒤 공백, "1." 예외)이 `where` 경로 때문에 사실상 계약이 됐다 | S2 | **계약 반영** §6 — span 경계는 데이터. 분할 규칙은 계약에 없다 |

## Step 0.2 가 답해야 할 것 (S4)
| # | 질문 |
|---|---|
| FOMC-6 | 인용부호가 내용인가 표시인가. §5.5 원문 대조에 직접 걸린다 |
| FOMC-8 | `concept_id` 가 HTML 에 전혀 없다. concept 참조를 어디에 다나 |
| — | `fact_type` 어휘 불일치 (브리프 `POLICY_ACTION/VOTE` vs FINDINGS §5.2 `OFFICIAL_ACTION/…`) |
| — | **volatility 는 fact 가 아니라 문장 조각(span)에 붙는다.** F11 "2026년"은 STABLE, 본문 "올해"는 DERIVED. D8 의 값 3개는 유지, 붙는 위치가 D8 가정과 다르다 (S2) |
| — | `formula.op` 6개로 충분했다: days_inclusive · weeks · months · months_round · years · years_floor (S2) |
| — | 이란 사실의 SL-iran-war 소속 — Fact 와 Storyline 의 소유 관계 (도윤 관찰) |

## 별도 처리

| # | 항목 | 행선지 |
|---|---|---|
| FOMC-21 | 레벨 전환 시 `scrollTop=0`. "몇 장에서 이탈"(§8.3) 측정과 충돌 | 프론트 레인 + 관찰 인프라 |
| FOMC-5 | 블록 타입 재사용률 0% | **D14 — 증거 아님** (S1 지시의 산물) |
| FOMC-1 | 슬라이드/블록 2층 | **D13 확정** |
| FOMC-2 | `resolves` 부재 | **D15 확정** — 필드 없음, 선형 불변식 |
| FOMC-13 | 한 슬라이드에 질문 둘 | **D16 확정** — teaser 만 센다 |

**S1이 먼저 봐달라고 올렸던 것** — 전부 해소됨 (2026-09-28)
- 속도계 · 12명/18명 → 0.0b 에서 교정
- `resolves` 부재 → D15
- 재사용률 0% → **D14. 증거로 쓰지 않는다** (S1 지시가 최대 분할을 보장한 결과)
- FTC `id="only"` → 아래 0.1a 표 FTC-15

---

## 검증 스크립트
`scripts/` 에 둔다. 세션 임시 파일로 남기지 마라. 재실행되지 않는 검증은 검증이 아니다.
- `scripts/verify-observed.py` — 0.0a 산출물을 원본 HTML 과 대조 (S1 작성, PM 이 로그 부록에서 이전)

## 계약 변경 요청 (프론트 → 백엔드)
> PM (2026-09-30): R-1 (`published_at` JSON 모양) 확인. **0.2b 에서 처리한다** — FINDINGS §5.3 시간 필드와 D6(발행 시각, OPEN)이 같이 걸린다.

<!-- 프론트 세션은 계약 파일을 직접 고치지 않고 여기에 적는다 -->
### R-1 · `published_at` 의 JSON 모양 (F-1, 2026-09-29) — 급하지 않음
- 계약 §1 은 `published_at: Date`, §2 는 "기준 **시각**"이라고 쓴다. 골든은 `"2026-09-16"`(날짜만, 문자열)이고
  `scripts/verify-article.py` 도 `date.fromisoformat` 으로 날짜만 받는다
- JSON 에는 `Date` 가 없으니 문자열 모양(날짜만 `YYYY-MM-DD` 인지, 시각 · 시간대가 붙는지)을 계약에 적어 달라. D6(발행 시각 정책, OPEN)과 묶일 수 있다
- 프론트는 지금 이 값을 읽지 않는다(계산 없음, D12). `packages/contract` 는 비어 있지 않은 문자열로만 받는다 — 막히는 것 없음
- **→ 0.2b 답 (D27 수용)**: `"YYYY-MM-DD"` 날짜만. 어느 날짜 · 어느 시간대로 자를지는 D6 (DATA_MODEL §5.3). `packages/contract` 는 그대로 맞다.
  ARTICLE_PACKAGE §1 의 `Date` 표기는 이번 수정 범위 밖이라 남아 있다
