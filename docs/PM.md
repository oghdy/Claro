# PM 세션

> **작업 세션은 이 파일을 읽지 마라.** PM 전용이다.
> 아래 "미기록 관찰"에는 작업 세션이 스스로 발견해야 할 내용이 들어 있다.
> 미리 읽으면 관찰이 아니라 받아쓰기가 된다.

## 새 PM 세션 개시 프롬프트 (복붙)

```
너는 Claro 프로젝트의 PM 세션이다. 구현은 하지 않는다.

읽을 것:
  CLAUDE.md
  docs/PM.md            ← 이 파일. 역할과 미기록 관찰
  docs/DECISIONS.md     ← 지금까지 정한 것 전부
  docs/development-*.md ← 각 레인 진행 상황
  logs/                 ← 완료된 작업 기록

docs/FINDINGS.md 는 지금 읽지 마라. 43KB다.
필요한 절만 그때그때 읽는다.

현재 위치는 docs/development-backend.md 맨 위에 적혀 있다.
```

## PM이 하는 일 / 안 하는 일

| 한다 | 안 한다 |
|---|---|
| Step 분할, 세션 개시 프롬프트 작성 | 구현 |
| 작업 세션 산출물 검수·분류 | 계약 **내용** 설계 |
| DECISIONS.md 관리 | 픽스처 작성 |
| "한 타입 한 파일" 정합성 감시 | 코드 리뷰 상세 |

**PM이 반복해서 저지른 실수**: 실물 없이 계약 내용을 설계한 뒤 작업 세션에
"확인할 사항"으로 넘기는 것. 그러면 세션이 PM 추론을 전제로 작업한다.
2026-09-20 에 두 번 발생(D8 `open_while`, D12 render). 추론이 생기면
**DECISIONS 에 OPEN 으로 내리고 작업 세션이 실물로 답하게 한다.**

## 인계 규칙

1. 판단을 대화에만 남기지 않는다. 문서에 없으면 사라진 것이다
2. PM 교체 전 아래 "미기록 관찰"을 갱신한다
3. 작업 세션 산출물을 받으면 **DECISIONS 승격 / 다음 세션 이관 / 폐기** 로 분류한다

---

# 미기록 관찰

PM 이 프로토타입·브리프를 직접 읽고 확인한 것. 아직 계약 문서가 없어 갈 곳이 없다.
해당 Step 이 끝나면 계약 문서로 옮기고 여기서 지운다.

## S1 검증 기준 — S1 에게 주지 않는다

S1 산출물을 받아서 이것과 대조한다. 미리 주면 S1 이 베껴 쓴다.

- 블록 클래스: FOMC 13종 + FTC 고유 5종 = **18종**.
  S1 출력이 이보다 적으면 **블록 통합이 일어난 것**이고 정보 손실이다. 다시 시킨다
  - FOMC: kicker · h1 · body-text(dim/small) · quote(+tag) · callout(+warn) ·
    closing · teaser · end-actions · gauge · votes/vcard · timeline · stats/srow
  - FTC 고유: examples(ex/punch) · steps(번호) · tagpill(fed/state)
- 장수: FOMC 입문 8 / 숙련 5 / FTC 7
- **슬라이드 1장 = 블록 3~5개.** FINDINGS §8.1 은 "슬라이드가 블록"처럼 읽히지만 실물은 2층이다.
  `open_question` 이 붙는 단위는 슬라이드다
- 입문/숙련은 교집합이 아니다. 숙련 전용 사실 13개 확인
  (근원 PCE 3.3%, 6월 전망 대비, 3.3→3.4 상향, Hammack·Kashkari·Logan 실명,
  8/7 고용 -23,000, 10년물 4.6%, 2026/2027 중앙값 동일, 18명 중 16명,
  2027 dot 8개, 4명 인하, 의장 전망 미제출, 201일째, 실업률 4.2→4.1)

## S2 입력 — 반드시 전달한다

- 🚨 **FOMC 입문 3번째 슬라이드(속도계)는 알려진 오류다.**
  FINDINGS §4.5 / 오류 #8 에서 실제 독자에게 "이해 불가" 판정을 받은 압축 버전이
  프로토타입에 그대로 살아 있다. `docs/content/concept-library.md` C-0002 는 이미
  "반드시 4단계로 나눠 제시한다"로 고쳐졌는데 슬라이드에 반영이 안 됐다.
  **S2 의 존재 이유가 이것이다.**
- 따라서 **"입문 8장"이라는 숫자 자체가 수정 전 산물이다.** 4단계로 풀면 9~10장이 된다
- "이란 전쟁 201일째" → D8 DERIVED 처리 대상
- invalid fixture 중 S2 담당: `volatile-missing-asof.json` · `derived-from-volatile.json`

## S3 입력

- **레벨에 따라 표현이 갈리는 것들** (같은 fact, 다른 문장)
  - 잭슨홀 인용: 입문 2문장 / 숙련 1문장으로 잘림. 출처 span 은 동일
  - 날짜 표기: "8월 말" vs "8/28"
  - 표결 카드 설명문: "세 명만 '올리자'고 반대" vs "3명 +25bp 주장"
  - `open_question` 형태: 입문 `Q 물가가 갑자기 나빠졌나요?` / 숙련 `· 무엇이 기준이었나`
    → **질문형 유도 자체가 scaffolding 이다.** FINDINGS §8.2 에 없는 내용
- → 함의: 레벨별 렌더 트리 2개 + 공통 Fact Graph 참조.
  FINDINGS §4.2 의 "LLM 원샷 집필"은 **레벨당 1회, 총 2회**라는 뜻이다. 어디에도 안 적혀 있다
- `data-goto` 가 전부 "바로 다음 장"이다. resolves 체인이 실물에선 선형이다
- D11: 상태축 블록 어휘 미확인을 계약에 명시할 것

## S4 입력

- **fact_type 어휘가 두 문서에서 다르다. 통합 필요**
  - `docs/findings/fomc-2026-09-brief.md`: `POLICY_ACTION` / `VOTE` / `HISTORICAL_CONTEXT`
  - `docs/FINDINGS.md` §5.2: `OFFICIAL_ACTION` / `OFFICIAL_CLAIM` / `MEASUREMENT` 등
- `concept-library.md` 가 이미 `FULL` / `REFRESHER` / `ANALOGY` 3단 구조와
  "비유 한계선" 필드를 갖고 있다. FINDINGS §9.6 의 SKIP/REFRESHER/FULL 과 대응된다.
  계약을 상상으로 쓰지 말고 이 파일에서 도출할 것
- invalid fixture 중 S4 담당: `merged-without-target.json` · `conflicting-alias-collapse.json`

---

# 다음 PM 이 바로 할 것

1. S1 세션 열기 (프롬프트: `docs/development-backend.md`)
2. S1 산출물을 위 "S1 검증 기준"과 대조
3. `_findings` 를 DECISIONS 승격 / S3 이관으로 분류
4. D12 답 확인 후 S2 프롬프트 작성
