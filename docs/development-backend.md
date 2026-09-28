# development · backend

## 현재 위치
**Phase 0 / Step 0.1a — S3 세션 대기. 프롬프트 준비됨**

## Phase 0 — 계약 확정
계약이 없으면 구현이 없다. Phase 0의 산출물은 코드가 아니라 `docs/contract/` 3종이다.

| Step | 내용 | 산출 | 세션 | 상태 |
|---|---|---|---|---|
| 0.0a | 프로토타입 역산 (있는 그대로) | `fixtures/*.observed.json` | S1 | ☑ 2026-09-20 |
| 0.0b | 오류 교정 → 골든 픽스처 | `fixtures/fomc-2026-09.article.json` | S2 | ☑ 2026-09-21 |
| 0.1a | ARTICLE_PACKAGE.md 작성 | 계약 1 | S3 | ☐ 프롬프트 준비됨 · 게이트 필수 |
| 0.1b | 골든을 계약에 맞춰 재작성 (+게이지 위반 수정) | 골든 v2 · invalid 재생성 | — | ☐ 0.1a 게이트 뒤 작성 |
| 0.2 | DATA_MODEL + CONCEPT_IDENTITY | 계약 2·3 | S4 | ☐ 미작성 |
| 0.3 | D1 기술 스택 결정 | DECISIONS D1 | 세션 아님 | ☐ |
| 0.4~ | 스키마 구현 | 마이그레이션 | Step당 세션 | ☐ |

> **0.1b · 0.2 프롬프트는 0.1a 게이트 뒤에 쓴다.** 계약이 확정되기 전에 쓰면 계약을 가정하게 된다.
> 프론트 레인은 **0.1b** 뒤에 열린다 (D14).

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
- [ ] `ARTICLE_PACKAGE.md` 에 D13 · D15 · D16 · D17 · D8 · D11 · D14 가 모두 반영됨
- [ ] 원형마다 근거 기사 표시, 근거 1건 원형 식별됨
- [ ] 모든 원형에 정규 텍스트 정의 + 정답 표현 방향과 이유
- [ ] "골든과 다른 점" 목록 (게이지 포함)
- [ ] findings 표 전 항목에 처리 표시
- [ ] Fact · Concept 저장 구조를 정의하지 않음 (0.2 침범 없음)
- [ ] **게이트: 도윤 승인**
- [ ] 완료일:

### PM 확인 사항 (S3 종료 후)
- "한 타입 한 파일" — ARTICLE_PACKAGE 가 Fact 구조를 몰래 정의하지 않았는지
- 근거 1건 원형이 과하게 일반화되지 않았는지 (§13)
- `_open` 목록을 도윤 게이트 질문으로 정리

---

## Step 0.1a 가 답해야 할 것 (S3)

### 원 findings (S1)
| # | 질문 | 비고 |
|---|---|---|
| FOMC-3 | `open_question` 이 반드시 질문이어야 하나 (입문 `Q …?` / 숙련 `· 명사구`) | |
| FOMC-4 | `kicker` 가 서사역할·출처·개념표시 세 가지를 한 문자열에 담고 있다. 쪼개나 | 0.0b 게이트 증거: 같은 개념이 두 장에 걸치자 ①①② — "개념 표시"와 "독자용 번호"가 부딪혔다 |
| FOMC-9 | 표시 변형 중 무엇이 의미이고 무엇이 순수 표시인가 (`stats.up` vs `margin-top`) | **D14 규칙 3 이 판정 기준이다.** 빨간색은 텍스트에 없는 판단을 더한다 |
| FOMC-10 | `slide_count` 는 데이터인가 파생값인가 (완독 측정 기준값) | D17 로 질문이 슬라이드가 되면 장수 정의가 흔들린다 |
| FOMC-11 | 같은 인용이 레벨마다 다르게 잘린다. fact 하나에 레벨별 표현인가 | |
| FOMC-12 | 레벨은 필터가 아니라 별도 선택이다. 계약이 어떻게 담나 | §3.3 의 실물 시험 |
| FOMC-14 | gauge 는 값을 받나 위치를 받나. 축 기준은 어디에 | **D14 위반 사례.** 선택지를 열어두고 도윤이 고른다 |
| FOMC-17 | 비유와 한계선이 데이터상 한 단위인가. 속도계 한계선이 5장 뒤에 있다 | |
| FOMC-20 | 마지막 슬라이드 probe 진입점이 입문에만 있다. 레벨별로 다르게 두나 | D18 은 OPEN. 설계하지 않는다 |
| FOMC-22 | timeline `when` 이 날짜와 기간 라벨("9월 초")을 섞는다 | 등간격 표시는 D14 규칙 3 게이트 판단 대상 |
| FTC-11 | `quote` 가 인용이 아닌 데 쓰인다. §8.4 소스 레이어 구분이 깨진다 | |
| FTC-12 | 출처 표시가 블록 타입에 따라 있다가 없다가 한다 | |
| FTC-13 | 관할이 둘은 pill, 셋째는 산문 | |
| FTC-15 | FTC 는 레벨이 없다. 레벨 1개 허용하나 (`id="only"` 는 S1 이 지어낸 이름) | |
| FTC-16 | `steps` 번호·기호가 데이터인가 렌더링인가 | D14 규칙 2: 순서는 정규 텍스트에 살아야 한다 |
| FTC-17 | 연속한 `rule_line` 두 개가 대조 한 쌍이다. 한 블록인가 | D14 규칙 2: 극성은 정규 텍스트에 살아야 한다 |

### 0.0b 이후 추가된 관찰 — 설계 결정 아님. 관찰로만 전달한다
| 관찰 | 출처 |
|---|---|
| **골든에 Bridge 를 표시할 자리가 없다.** C-0002 ④ 문장에서 concept 표시를 떼자 그 문장이 무엇인지 적을 필드가 없었다. FINDINGS §4.1 은 Bridge 를 Evidence Layer 로 정의했다 | S2 · correction-log 7행 |
| 이란 사실들은 FOMC 사건이 아니라 **SL-iran-war 소속**이다. 골든이 참조해야 할 사실을 스토리라인이 직접 소유한다 | 도윤 · 2026-09-21 |
| `refs` 에 `DC-*`(Derived Claim)를 `F-*` 와 섞어 넣었다 | S2 |
| 문장 분할 규칙(`.?!` 뒤 공백, "1." 예외)이 `where` 경로 때문에 사실상 계약이 됐다 | S2 |

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
<!-- 프론트 세션은 계약 파일을 직접 고치지 않고 여기에 적는다 -->
없음
