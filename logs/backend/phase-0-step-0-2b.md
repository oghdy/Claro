# logs/backend · Phase 0 / Step 0.2b — DATA_MODEL

## B-0.2b · 2026-09-30 · **[GATE]**

### 질문 10개 — 처리 요약

| # | 질문 | 표시 | 근거 (실물 · FINDINGS 확정) | 계약 |
|---|---|---|---|---|
| 1 | Fact — 필드와 fact_type 어휘 하나로 | **계약 반영** (+ _open-1) | 확정 §5.5 `fact_claim` 필드 · 확정 §5.2 7값과 "주장했다는 사실" · 실물: 브리프 3건 타입 30종(사실 117) · F06~F10 은 글에 주어가 없다 · F29 F32 F37 은 한 행에 두 종류 | §3 — `fact_type` = §5.2 7값. 브리프 타입 30종 → 표(§3.3). 브리프 타입의 상당수는 "기사에서 무슨 역할"이라 축이 다르다 → 슬롯 몫. `actor` 필드(OFFICIAL_CLAIM · LIMIT 필수). 딱 맞지 않는 세 무리(SELF_LIMIT · HISTORICAL_CONTEXT · 배경 지식) → _open-1 |
| 2 | Source — 원문 보관 · span · N:M · 권리 | **계약 반영** (+ _open-2 · span 과 권리는 실물 없음) | 확정 §5.1 (1차/2차 · source_registry 10필드) · §5.3 (N:M · 7월 회의록 사례) · §5.5 (원문 보관 · span) · 실물: Source Pack 표 · S3 "preliminary" · FTC S4~S6 "2차 경유" · F03 "다수 보도" | §4 — Source · SourceDocument(불변) · FactSource(쌍마다 span) · SourceRegistry(확정 필드 그대로). 1차 출처 필수 여부 → _open-2 |
| 3 | 시간 — §5.3 네 필드 · R-1 `published_at` 모양 | **계약 반영** (값은 D6 OPEN) | 확정 §5.3 · D8 규칙 1 · 실물: 골든 `"2026-09-16"` · 계산 op 7개 전부 날짜 단위 · Source Pack "9/16 14:00 ET" · 골든을 9/17 · 9/18 로 다시 계산 → "201일째" 하나만 깨짐 | §5 — event_at(Fact) · published_at · ingested_at(Source) · first_verified_public_at 은 계산. R-1 = `"YYYY-MM-DD"`. 어느 날짜 · 시간대인지는 D6 |
| 4 | volatility — 어디에 붙나 · 저작 데이터의 자리 | **계약 반영** | D8 (값 셋 · 규칙 1~5) · 확정 §5.4 · §5.5 · 실물: 스크루웜 "변동성" 열 · 골든 `_volatility` 29 (S2: F11 "2026년" STABLE / "올해" DERIVED) · VOLATILE 11 개에서 같은 사실은 언제나 같은 as_of | §6 — 두 곳: Fact(STABLE · VOLATILE + as_of) / TimeExpression(DERIVED · VOLATILE, 글 조각). DERIVED 는 Fact 에 없다. `_volatility` → ArticleAuthoring.time_expressions |
| 5 | DerivedClaim — 기대는 사실 · 반증 기록 | **계약 반영** | 확정 §4.1 · §7.2 · D20 · D22 · D23 · 실물: 브리프 DC-A~E (근거 · 반증 물음 · VALID WITH SCOPE · 방어용) · 골든 `_fact_refs_dropped` (DC 있는 span 17 — 전부 브리프 근거 안) | §7 — `basis` · `kind`(ASSERTED/DEFENSIVE) · `checks`(CounterCheck). 판정은 저장하지 않고 checks 에서 계산 — 검사 없는 VALID(DC-D · DC-E)가 구조로 막힌다 |
| 6 | Bridge — 두 종류 · BridgeSlot 과의 짝 | **계약 반영** (STORY_BRIDGE 는 실물 없음) | 확정 §4.1 · CONCEPT_IDENTITY §6 (C-0002 v3 슬롯 ④) · 실물: 골든 입문 4장 bridge 2 span · 끊긴 F31 · F10 | §8 — Bridge = (concept_id, concept_version, slot) + `facts`. F31 은 Bridge 가 품는다(span 에 안 넣는다). CONCEPT_IDENTITY 불변식 13 의 뒷부분(그 브리지가 그 슬롯을 채우는가)을 채움 |
| 7 | Storyline · Event — 독립 객체 · 버전 · 패키지가 버전을 고정하나 | **계약 반영** (버전 이력 · `ongoing` 실물 없음) | 확정 §9.2 · §6.2 STORYLINE_STALE · D8 규칙 5 · ARTICLE_PACKAGE §0 · 실물: 도윤 관찰(이란 사실은 SL-iran-war 소속) · 골든 event_ref · 스크루웜 "그런 날짜가 없다" · 9/16 하루에 FOMC 결정 + 경유 최고치 | §9 — Fact 소유 = 사건 XOR 스토리라인. 고정은 **필요하다** — 단 패키지가 아니라 ArticleRecord.authoring.storylines (프론트가 그리는 데 안 쓴다) |
| 8 | 인용 — 출처 표시가 가리키는 것 · 인용부호 | **계약 반영** (번역 표시는 미확인) | ARTICLE_PACKAGE §7.4 · D23 #16 · 확정 §5.1 can_quote · §5.5 · 실물: 골든 `_attribution_refs` 2 (같은 원문에 레벨마다 다른 표시) · FOMC 인용 따옴표 없음 / FTC observed 있음 · 본문 따옴표 4 곳 | §10 — 표시 글 → body FactRef → FactSource → Source 하나. F32 는 Source 서지가 대신. 인용 블록 따옴표는 **표시**(body 에 안 넣음). 본문 따옴표는 글이지만 누군가의 말로 읽히면 fact + 원문 필요 (게이트 3) |
| 9 | 참조 모양 — FactRef · ClaimRef · BridgeRef · ARTICLE_PACKAGE 문구 | **계약 반영** (+ _open-3 ID 체계) | CONCEPT_IDENTITY §3.2 (ConceptRef) · D25 · ARTICLE_PACKAGE §6 "span 하나에 layer 하나" · 실물: 세 브리프 모두 `DC-A` · 스크루웜 S01 vs 출처 S1 · F37 소유 이동 | §2 — 층이 원소 모양을 정한다. Fact · Claim · Bridge 는 키 하나(버전 없음 — 발행 뒤 불변). ARTICLE_PACKAGE §0 · §1 · §6 · CHANGELOG 고침. ID 형식 → _open-3 |
| 10 | 골든 대기 13 — 계약으로 풀리는 것 / 콘텐츠 대기 | **계약 반영** (분류 · 채우기는 안 함) | D20 · D22 · D23 · 실물: 골든 `_refs_pending` 13 · development-content C-2 · C-3 · C-5 | §17 — 이 계약으로 3 (브리지 2 · 사실 승격 1 — 단 승격한 사실은 출처가 Source Pack 에 없다) / 콘텐츠 10 (사실 출처 5 = C-2·C-3 넷 + **레인 없는 "9월 초"** · 해석 5 = C-5) |

§9.6 보류 항목 — 계약에 없다 (검사 A 가 단어 · 수치로 확인). 실물 없는 구조(§3.2 의 세 값 · §4.2 span · §4.4 권리 · §8.2 STORY_BRIDGE · §9.2 버전 이력)에 "실물 없음" (검사 A).

### 게이트에서 먼저 볼 것

1. **_open-3 — ID 체계. 되돌리기 어렵다.** 발행물의 refs 가 이 키를 영원히 갖는다. 추천 (a): Fact · Claim · Bridge · Source 는 UUID + label, Event · Storyline 은 사람 이름 그대로.
   label 을 키로 쓸 수 없다는 것은 실물이 이미 보였다 — 세 브리프가 모두 `DC-A`, 스크루웜은 사실 `S01` 과 출처 `S1`, F37 은 FOMC 브리프 번호인데 이란 스토리라인 소속
2. **발행 검사에 걸리는 것이 대기 13 보다 훨씬 많다.** 골든을 이 계약으로 옮긴 시험 사본에 발행 검사를 돌리면 **64 개가 막힌다** (검증 절 1).
   가장 큰 것은 원문 위치다 — FOMC 브리프 사실 38 개 중 원문 위치가 있는 것은 **0**, 출처 문서 ID 도 없는 것이 12 (Storyline 표 F28~F38 전체 + F03 "다수 보도"). 골든이 닿는 사실 25 개가 전부 걸린다.
   FINDINGS §7 표 스테이지 2(Claim 추출 + span)가 "스키마만"인 그대로다. 계약이 틀린 게 아니라 **손으로 만든 골든이 출처 작업을 건너뛰었다** — F-3(첫 실제 독자) 전에 누가 채울지 정해야 한다
3. **C-5 가 5 개보다 크다.** 대기 해석 5 에 더해 — 브리프 DC-D · DC-E 는 반증 기록이 없다(골든이 이미 8 span 에서 가리킨다) · DC-A 둘째 반증 답("셋 다 2026년 투표권자")은 F-ID 가 없다 · DC-C 는 "범위를 좁혀야 정확하다"면서 문장을 안 좁혔다.
   계약이 판정을 기록에서 계산하게 해서(§7.3) 이것들이 드러났다 — 판정을 따로 적을 수 있었다면 "VALID" 로 조용히 지나갔다
4. **레인이 없는 대기 둘** — 숙련 3장 "9월 초"(FOMC 날짜, C-2 · C-3 는 이란만) · 입문 7장 "3주 뒤" 로 승격할 사실(출처가 Source Pack 에 없다)
5. **본문 따옴표 하나가 D23 #16 과 같은 모양이다** — 입문 7장 대조 "세 명만 “올리자”고 반대"(fact F28). F28 은 "25bp 인상을 원해 반대"다. "올리자"는 그 사람들 말을 옮긴 게 아니라 바꿔 말한 것인데 따옴표가 발언으로 읽히게 한다. 독자 글 수정이라 고치지 않았다 → 도윤
6. _open-1 · _open-2 — 추천 있음. _open-1 은 독자에게 안 보이는 필드다. _open-2 는 추천대로면 F03 에 1차 출처가 필요하다
7. **R-1 과 D6** — 모양은 날짜(`YYYY-MM-DD`)로 닫았다. D6 이 "KST 다음날"을 고르면 골든 "201일째"가 202 가 된다 (DERIVED 18 중 이것 하나)

### 산출

| 파일 | 내용 |
|---|---|
| `docs/contract/DATA_MODEL.md` | 계약. §1 타입 · §2~§13 질문별 · §14 불변식 25 · §15 미확인 · §16 _open 3 · §17 대기 13 · §18 이전 목록 |
| `docs/contract/ARTICLE_PACKAGE.md` | §0 · §1 · §6 의 참조 문구 · CHANGELOG 만 (질문 9). 규칙은 안 바뀜 |
| `scripts/verify-data-model.py` | 계약 검사 — A 계약 문서 · B 로그 · C 골든(옮길 때 잃는 것이 없나) · D 시험 사본(골든 + 브리프를 이 모양으로 메모리 안에서 옮겨 불변식). `--report` 로 이전 목록 · 게이트 3 후보 · 발행에서 막히는 것 |
| `scripts/selftest-verify-data-model.py` | 망가뜨린 사본으로 검사가 실제로 실패하는지 (메모리 안, 파일 안 남김) |
| `logs/backend/phase-0-step-0-2b.md` | 이 파일 |

골든 · 브리프 · 라이브러리 · CONCEPT_IDENTITY · DECISIONS 는 고치지 않았다. 사실 · 해석 · 출처를 하나도 새로 만들지 않았다 (시험 사본의 가짜 재료는 파일로 남지 않는다).

### 도출하며 판단한 것 — 멈추지 않은 이유
_open 으로 올리지 않고 계약에 넣은 판단. 게이트에서 뒤집을 수 있다.
| 판단 | 근거 | 왜 _open 이 아닌가 |
|---|---|---|
| volatility 를 두 곳에 (Fact 2값 / 글 조각 3값) | S2 관찰(F11 "2026년" STABLE · "올해" DERIVED) · D8 규칙 1(DERIVED 는 published_at 기준 = 기사마다 다름) · 스크루웜 변동성 열 | DERIVED 가 사실의 속성일 수 없다는 것은 D8 규칙 1 에서 따라 나온다. 값 셋은 그대로 |
| `as_of` 를 Fact 에 | 실물 — VOLATILE 11 개에서 같은 사실은 언제나 같은 as_of | 실물이 그렇게 움직였다. 한 곳에만 둔다 (D22 와 같은 이유) |
| 판정을 저장하지 않고 checks 에서 계산 | 실물 — DC-D · DC-E 는 VALID 인데 반증 기록이 없다 · D23 "검사 안 거친 해석 5" · 확정 §7.2 | 같은 것을 두 곳에 두지 않는다. 판정 어휘는 실물(VALID · VALID WITH SCOPE · 방어용) 그대로 |
| 스토리라인 핀을 패키지가 아니라 ArticleRecord 에 | ARTICLE_PACKAGE §0 (패키지 = 프론트가 그리는 데 필요한 것, Storyline 은 안 넣는다) · 확정 §9.2 | 게이트를 통과한 계약에서 따라 나온다. 핀이 **필요한가**는 §9.2 · §6.2 가 답했다 |
| ArticleRecord = 패키지 + 저작 데이터 | 실물 — 골든 파일 한 벌이 이미 이 모양(패키지 + `_` 주석) · ARTICLE_PACKAGE §12-11 | 이름을 붙였을 뿐 모양은 실물이다 |
| `actor` 필드 | 확정 §5.2 · 실물 F06~F10 (주어가 표 제목에만) | "주장했다는 사실"의 주어. 모양(문자열 / ID)은 미확인으로 남겼다 |
| `first_verified_public_at` 은 계산 | 확정 §5.3 의 정의가 곧 식 | 저장하면 출처가 붙을 때마다 어긋날 수 있다 |
| 발행에 DERIVED PASS 필수 (UNVERIFIABLE 불가) | D8 규칙 3 "불변식" | "맞음을 보이라"는 규칙이다. 증명 못 한 것은 보인 것이 아니다 |
| 인용 블록 따옴표 = 표시 | 실물 FOMC(없음) · ARTICLE_PACKAGE §9-8 (강조를 두 번 적지 않는다) · D22 (표시를 한 곳에서) | 블록 타입이 이미 원문이라 말한다. FTC observed 는 옮길 때 뗀다 |
| 본문 따옴표 = 글, 단 발언으로 읽히면 fact + 원문 | D23 #16 | D23 이 정한 것을 옮겼다. 기계 판정은 없고 게이트 3 |
| Fact · Claim · Bridge 는 발행 뒤 불변, 틀리면 새 것 | 확정 §9.2 · CONCEPT_IDENTITY §3.1 과 같은 논리 | 패키지가 불변이면 그 참조도 불변이어야 한다 |
| 공식 op 를 실물 7개로 닫음 | S2(6개) + 골든 `year_of` | ARTICLE_PACKAGE 원형 5개와 같은 방식 — 새 것은 계약 개정 |
| Coverage 는 확정 5 코드만, PARTIAL 은 미확인 | 확정 §6.2 · 지시("Fact 에 닿는 부분만") | PARTIAL 을 어떻게 할지는 슬롯 설계의 일 |

### 골든 · 브리프 → 이 계약 — 0.2m 입력
계약 §18 이 본문이다. 요약:
- **골든 — 잃는 것 없이 옮겨진다** (검사 C 통과). `_fact_refs_dropped` 24 중 DC 있는 claim 17 은 전부 브리프 근거 안 → 지운다 · 대기 claim 4 → C-5 근거 후보 · bridge 2 → Bridge.facts (F31 · F10) ·
  **갈 곳 없는 1** (숙련 4장 concept span 의 F02 — 버린다, 게이트 확인) · `_volatility` 29 → time_expressions, VOLATILE as_of → Fact 5 개 · `_attribution_refs` → 버린다 (F32 는 Source 서지가 대신) ·
  `_published_at_basis` → notes · SL-iran-war 핀 추가 · 파일 한 벌 → ArticleRecord
- **FOMC 브리프** — 사실 38 (F29 · F32 · F37 을 나누면 41) · Source 8 · DC 5 · 슬롯 15. **원문 위치 0 / 38**, 출처 문서 ID 없음 12 (F03 + F28~F38)
- **시험 사본의 발행 검사가 막는 것 64** — 원문 위치 25 · 1차 출처 9 · 공개 시점 증명 9 · 대기 11 · DERIVED 입력 사실 4 + 증명 1 · 반증 기록 2 + 답 사실 1 · 인용 원문 2.
  0.2m 이 모양을 옮겨도 이 64 는 콘텐츠(출처 · 반증)를 채워야 풀린다
- **다른 곳** — `verify-article.py` 의 ID 문자열 검사 · `packages/contract` 의 ConceptRef(객체) · ARTICLE_PACKAGE 의 남은 "→ 0.2" 문구 (§2 · §3 · §7.4 · §8 · §10 · §12 · 부록 A)와 §1 `published_at: Date` · §12-6 "대기 7"(지금 13)

### 검증

모든 명령은 저장소 루트에서. 출력은 잘라내지 않고 붙였다 (verify-data-model `--report` 의 긴 목록만 앞부분).

**1. `python3 scripts/verify-data-model.py --report`**
```
verify-data-model
  계약   docs/contract/DATA_MODEL.md
  실물   브리프 3 — 사실 타입 30종 · FOMC 사실 38 · DC 5
         골든 — 대기 13 ({'Bridge': 2, 'DerivedClaim': 5, 'Fact 승격': 1, 'Fact 출처': 5}) · 시간 조각 29 ({'DERIVED': 18, 'VOLATILE': 11}) · 인용 2
         끊긴 F 연결 — DC 있는 claim 17 · 대기 claim 4 · bridge 2 · 그 밖 1
  시험 사본 — Fact 38 · Claim 5 · Bridge 1 · Source 8 · 시간 조각 29
         발행 검사에서 막히는 것 64 — CHECK_NO_FACTS 1 · CLAIM_UNCHECKED 2 · DERIVED_INPUT_NO_FACT 4 · DERIVED_UNVERIFIED 1 · FACT_NOT_YET_PUBLIC 9 · FACT_NO_PRIMARY 9 · FACT_NO_SOURCE_SPAN 25 · QUOTE_NO_COMMON_SOURCE 2 · REFS_PENDING 11

골든 VOLATILE → Fact.as_of (§6.2)
  F30 as_of 2026-08-07
  F31 as_of 2026-08-30
  F35 as_of 2026-09-15
  F36 as_of 2026-09-15
  F37 as_of 2026-09-16

끊긴 F 연결 — 대기 claim (C-5 근거 후보) · bridge (Bridge.facts) · 그 밖
  claim  basic 4장 ['F24', 'F32']  "그리고 이 속도는 여름 내내 크게 줄지 않았어요."
  claim  basic 7장 ['F33', 'F36']  "그 사이 8월 말 의장이 앞의 기준을 밝혔고, 시장은 "
  claim  basic 8장 ['F07', 'F33']  "연준이 확신이 없다고 본 이유의 상당 부분이 여기 있습"
  claim  advanced 5장 ['F07', 'F37']  "<b>1. 물가의 큰 부분이 전쟁에 달려 있습니다.</"
  bridge basic 4장 ['F31']  "그런데 지금 미국은 3%대입니다. "
  bridge basic 4장 ['F10', 'F31']  "목표보다 빠르게 오르고 있어요."
  concept advanced 4장 ['F02']  "표결은 투표권자 12명이 하고, 전망은 투표권과 관계없"  ← 갈 곳 없음

인용 (§10.1) — 출처 표시 · body 사실 · 표시에만 있던 사실(→ Source 서지)
  basic 6장 blocks/1  "8월 말 · 의장 연설"  body ['F33']  표시만 ['F32']
  advanced 2장 blocks/1  "8/28 잭슨홀"  body ['F33']  표시만 ['F32']

게이트 3 후보 — 본문 따옴표 (§10.2)
  basic 3장 concept ['C-0002']  '“라면이 2000원이다”는 그냥 가격입니다.'
  basic 3장 concept ['C-0002']  '“라면값이 작년보다 5% 올랐다”는 오르는 속도예요.'
  basic 6장 claim   ['DC-C']  '연준이 던진 질문은 “물가가 나빠졌는가”가 아니었습니다.'
  basic 7장 fact    ['F28']  '동결. 세 명만\n“올리자”고 반대'

게이트 3 후보 — OFFICIAL_CLAIM 사실만 가리키는 fact span 24 (§3.4 — 주장한 쪽을 글이 밝히나)
  basic 6장 ['F33']  '기저 물가가 목표를 향해 분명하게, 충분히 빠른 속도로 가고 있다는 확신이 있어야 한다.'
  basic 6장 ['F33']  '그렇지 않다면 아직 할 일이 남아 있는 것이다.'
  basic 9장 ['F12']  '위원들 대부분이 올해 안에 한 번 더 올릴 수 있다고 봤습니다.'
  basic 9장 ['F11']  '다만 연준이 함께 내놓은 전망에서 올해 말 금리와 내년 말 금리는 같은 수준이에요.'
  basic 9장 ['F19']  '참고로 연준 자신도 물가가 2% 근처로 돌아오는 건 내년 말쯤으로 보고 있어요.'
  advanced 2장 ['F33']  '기저 물가가 목표를 향해 분명하게, 충분히 빠른 속도로 가고 있다는 확신이 있어야 한다.'
  advanced 2장 ['F24', 'F32']  '의장은 여름 지표가 기저 흐름의 의미 있는 개선을 보여주지는 않는다고 평가했습니다.'
  advanced 2장 ['F16']  '9월 전망에서 올해 근원 PCE는 오히려 3.3% → 3.4%로 올라갔고요.'
  advanced 3장 ['F32', 'F33']  '8/28'
  advanced 3장 ['F32', 'F33']  '잭슨홀 — 의장이 인상 기준을 명시'
  advanced 4장 ['F11']  '2026년 말 정책금리 중앙값'
  advanced 4장 ['F11']  '4.1%'
  advanced 4장 ['F11']  '2027년 말 정책금리 중앙값'
  advanced 4장 ['F11']  '4.1%'
  advanced 4장 ['F12']  '연내 추가 인상 예상'
  advanced 4장 ['F12']  '18명 중 16명'
  advanced 4장 ['F12']  '두 번 더 예상'
  advanced 4장 ['F12']  '4명'
  advanced 4장 ['F15']  '2026년 헤드라인 PCE 전망 (3월 2.7%)'
  advanced 4장 ['F15']  '3.7%'
  advanced 4장 ['F17']  '2026년 실업률 전망 (3월 4.4%)'
  advanced 4장 ['F17']  '4.1%'
  advanced 4장 ['F13']  '2027년에 추가 인상을 찍은 참가자는 8명뿐, 4명은 오히려 인하를 봤습니다.'
  advanced 5장 ['F07']  '성명문도 지정학적 전개로 인한 불확실성을 명시했어요.'

시험 사본 발행 검사 — 막히는 것 (§18: 0.2m · 콘텐츠가 채울 것)
  CHECK_NO_FACTS 1
    Claim DC-A: 반증 "반증 후보: "9월에도 반대가 있었나?" →" 의 답에 사실이 없다 (§7.3)
  CLAIM_UNCHECKED 2
    Claim DC-D: 반증 기록이 없거나 ASSERTED 인데 미결 — 판정이 안 나온다 (§7.3)
    Claim DC-E: 반증 기록이 없거나 ASSERTED 인데 미결 — 판정이 안 나온다 (§7.3)
  DERIVED_INPUT_NO_FACT 4
    TE basic slides/6/blocks/1/paragraphs/1/body "3주 뒤에": 입력 ['minutes'] 에 사실이 없다 (§6.4)
    TE basic slides/7/blocks/0/paragraphs/0/body "반년 넘게": 입력 ['war_start'] 에 사실이 없다 (§6.4)
    TE advanced slides/2/blocks/1/paragraphs/0/body "3주 뒤": 입력 ['minutes'] 에 사실이 없다 (§6.4)
    TE advanced slides/4/blocks/0/paragraphs/0/body "201일째": 입력 ['war_start'] 에 사실이 없다 (§6.4)
  DERIVED_UNVERIFIED 1
    TE advanced slides/4/blocks/0/paragraphs/0/body "201일째": 재계산으로 증명 못 한다 (§6.4)
  FACT_NOT_YET_PUBLIC 9
    Fact F03: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F28: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F30: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F31: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F32: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F33: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    … 3개 더
  FACT_NO_PRIMARY 9
    Fact F03: 1차 출처가 없다 (불변식 9 · _open-2)
    Fact F28: 1차 출처가 없다 (불변식 9 · _open-2)
    Fact F30: 1차 출처가 없다 (불변식 9 · _open-2)
    Fact F31: 1차 출처가 없다 (불변식 9 · _open-2)
    Fact F32: 1차 출처가 없다 (불변식 9 · _open-2)
    Fact F33: 1차 출처가 없다 (불변식 9 · _open-2)
    … 3개 더
  FACT_NO_SOURCE_SPAN 25
    Fact F01: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F02: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F03: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F07: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F09: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F10: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    … 19개 더
  QUOTE_NO_COMMON_SOURCE 2
    basic 6장 인용: body 사실들이 원문 위치를 가진 공통 Source 가 없다 (불변식 19)
    advanced 2장 인용: body 사실들이 원문 위치를 가진 공통 Source 가 없다 (불변식 19)
  REFS_PENDING 11
    basic slides/3/blocks/2/paragraphs/0/body/0 claim "그리고 이 속도는 여름 내내 ": refs 가 비었다
    basic slides/6/blocks/1/paragraphs/0/body/0 claim "그 사이 8월 말 의장이 앞의": refs 가 비었다
    basic slides/6/blocks/1/paragraphs/1/body/1 fact "회의 내부 기록은 3주 뒤에 ": refs 가 비었다
    basic slides/7/blocks/0/paragraphs/0/body/0 fact "2월 말에 시작돼 반년 넘게 ": refs 가 비었다
    basic slides/7/blocks/0/paragraphs/0/body/1 fact "4월에 휴전 합의가 한 번 있": refs 가 비었다
    basic slides/7/blocks/1/paragraphs/0/body/1 claim "<b>이 전쟁이 끝나면 물가는": refs 가 비었다
    … 5개 더


OK
```

**2. `python3 scripts/selftest-verify-data-model.py`** — 망가뜨린 사본 80 (계약 23 · 로그 2 · 골든 11 · 시험 사본 29 · 발행 검사 15) + 원본 2. "빈틈" 2 는 못 잡는 것이 기대값이다
```
PASS  원본 (계약 · 로그 · 골든 · 시험 사본) → 통과
PASS  가짜 재료로 다 채운 사본 — 발행 검사 → 통과
PASS  [contract] §5.4 — Fact.as_of 삭제 → ['CONTRACT_FIELD']
PASS  [contract] §5.5 — FactSource.span_start 삭제 → ['CONTRACT_FIELD']
PASS  [contract] §5.3 — Source.ingested_at 삭제 → ['CONTRACT_FIELD']
PASS  [contract] §5.1 — SourceRegistry.can_quote 삭제 → ['CONTRACT_FIELD']
PASS  [contract] §5.2 — FactType 에 BACKGROUND 추가 (_open-1 (b) 를 게이트 전에) → ['CONTRACT_ENUM']
PASS  [contract] §5.2 — FactType 에서 OFFICIAL_LIMIT 삭제 → ['CONTRACT_ENUM']
PASS  [contract] D8 — TimeExpression.class 에 STABLE 추가 → ['CONTRACT_ENUM']
PASS  [contract] D8 — Fact.volatility 에 DERIVED 추가 → ['CONTRACT_ENUM']
PASS  [contract] §6.2 — SlotCheck.status 에서 STORYLINE_STALE 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §4.1 — Bridge.bridge_type 에서 STORY_BRIDGE 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §5.1 — Source.kind 에서 SECONDARY 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §9.6 — 계약에 posterior → ['CONTRACT_HELD_TERM']
PASS  [contract] §9.6 — 계약에 half-life → ['CONTRACT_HELD_TERM']
PASS  [contract] 0.2a 침범 — 타입 블록에 Concept 정의 → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] 0.2c 침범 — 타입 블록에 KnowledgeEvidence 정의 → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] D24 — §4.4 권리 절에서 "실물 없음" 전부 삭제 → ['CONTRACT_NO_REAL']
PASS  [contract] D24 — §9.2 Storyline 절에서 "실물 없음" 전부 삭제 → ['CONTRACT_NO_REAL']
PASS  [contract] §3.3 — SELF_LIMIT 행 삭제 (브리프 타입이 표 밖) → ['CONTRACT_TYPE_MAP']
PASS  [contract] §3.3 — PROJECTION 을 FORECAST 로 (7값도 표시도 아님) → ['CONTRACT_TYPE_MAP']
PASS  [contract] §6.4 — year_of 행 삭제 (골든이 쓰는 op) → ['CONTRACT_OP', 'GOLD_OP_UNKNOWN']
PASS  [contract] CHANGELOG — B-0.2b 행 삭제 → ['CONTRACT_CHANGELOG']
PASS  [contract] §17 — 6 번 행 need 를 Fact 승격으로 → ['GOLD_PENDING_TABLE']
PASS  [contract] §17 — 11 번 행(이란 전망) 삭제 → ['GOLD_PENDING_TABLE']
PASS  [log] 로그 — 질문 10 행 삭제 → ['LOG_QUESTION']
PASS  [log] 로그 — 질문 4 행의 표시 지움 → ['LOG_QUESTION']
PASS  [gold] R-1 — published_at 에 시각 → ['GOLD_PUBLISHED_AT_SHAPE']
PASS  [gold] §6.2 — F31 as_of 를 한 곳만 바꿈 (사실의 속성이 조각마다 다르다) → ['GOLD_ASOF_CONFLICT']
PASS  [gold] 불변식 15 — 시간 조각 "올해 말 금리" → "올해" (그 글에 두 번) → ['GOLD_FRAGMENT_AMBIGUOUS']
PASS  [gold] 불변식 16 — VOLATILE 조각의 사실을 지움 → ['GOLD_VOLATILE_NO_FACT']
PASS  [gold] §7.2 — DC-C span 의 끊긴 연결에 F38 추가 (브리프 DC-C 근거 밖 → 옮기면 잃는다) → ['GOLD_DROPPED_NOT_IN_BASIS']
PASS  [gold] §10.1 — 인용 출처 표시에서 body 사실 F33 삭제 → ['GOLD_ATTRIBUTION']
PASS  [gold] §10.2 — 인용 body 를 따옴표로 쌈 (FTC observed 모양) → ['GOLD_QUOTE_MARKS']
PASS  [gold] §17 — 브리지 대기 need 를 Fact 출처로 → ['GOLD_PENDING_TABLE']
PASS  [gold] §17 — "9월 초" 대기를 몰래 채움 (표와 골든이 어긋남) → ['GOLD_PENDING_TABLE']
PASS  [gold] §6.4 — op 를 decades 로 → ['GOLD_OP_UNKNOWN']
PASS  [gold] §6.3 — DERIVED 입력 하나에 사실 둘 → ['GOLD_INPUT_MULTI']
PASS  [model] 불변식 4 — F01 fact_type 을 브리프 타입 POLICY_ACTION 그대로 → ['FACT_TYPE']
PASS  [model] 불변식 5 — OFFICIAL_CLAIM F24 의 actor 삭제 → ['FACT_ACTOR']
PASS  [model] 불변식 6 — VOLATILE F31 의 as_of 삭제 → ['FACT_AS_OF']
PASS  [model] 불변식 6 — STABLE F01 에 as_of → ['FACT_AS_OF']
PASS  [model] §6.1 — F11 을 Fact 에서 DERIVED 로 (D8 가정) → 그 사실로 계산한 "올해" 조각도 걸린다 → ['DERIVED_FROM_VOLATILE', 'FACT_VOLATILITY']
PASS  [model] 불변식 7 — F37 이 사건 · 스토리라인 둘 다 소유 → ['FACT_OWNER']
PASS  [model] 불변식 7 — F37 이 없는 스토리라인 버전 2 에 붙음 → ['FACT_OWNER']
PASS  [model] 불변식 1 — 한 사건 안에 label F01 이 둘 → ['LABEL_DUP']
PASS  [model] 불변식 1 — Claim 키가 Fact 키와 같다 → ['KEY_DUP']
PASS  [model] 불변식 2 — fact span 에 ClaimRef → ['REF_UNRESOLVED']
PASS  [model] 불변식 2 — claim span 에 FactRef (층 섞기) → ['REF_UNRESOLVED']
PASS  [model] 불변식 2 — concept span 에 "C-0002" 문자열 → ['REF_UNRESOLVED']
PASS  [model] 불변식 22 — DC-C basis 비움 → ['CLAIM_NO_BASIS']
PASS  [model] 불변식 18 — 브리지 facts 비움 (F31 을 품지 않은 브리지) → ['BRIDGE_NO_FACTS']
PASS  [model] 불변식 18 — 브리지 슬롯 ⑤ (C-0002@3 에 없다) → ['BRIDGE_CONCEPT', 'BRIDGE_SLOT_ORDER']
PASS  [model] 불변식 18 — CONCEPT_BRIDGE 인데 개념 없음 → ['BRIDGE_CONCEPT', 'BRIDGE_SLOT_ORDER']
PASS  [model] 불변식 18 — 브리지가 다른 사건의 것 → ['BRIDGE_EVENT']
PASS  [model] 불변식 18 — ③ 바로 다음 bridge span 이 ④ 가 아닌 브리지(C-0001, 슬롯 없음)를 가리킴 → ['BRIDGE_SLOT_ORDER']
PASS  [model] 불변식 15 — 시간 조각이 글에 없다 → ['TE_LOCATOR']
PASS  [model] 불변식 15 — 시간 조각 경로가 다른 장 → ['TE_LOCATOR']
PASS  [model] 불변식 16 — VOLATILE 조각이 STABLE 사실(F01)을 가리킴 → ['TE_VOLATILE_FACTS']
PASS  [model] D8 규칙 4 — DERIVED 입력이 VOLATILE 사실(F31) → ['DERIVED_FROM_VOLATILE']
PASS  [model] D8 규칙 3 — "3년 만에" 기록값을 4 로 → ['DERIVED_INVARIANT_FAIL']
PASS  [model] 불변식 12 — 패키지 published_at 에 시각 → ['PUBLISHED_AT_SHAPE']
PASS  [model] 불변식 21 — 인용 body 를 따옴표로 쌈 → ['QUOTE_MARKS']
PASS  [model] 불변식 24 — FOUND 인데 사실 없음 → ['SLOT_FACTS']
PASS  [model] 불변식 24 — STORYLINE_STALE 인데 스토리라인 없음 → ['SLOT_STORYLINE']
PASS  [model] 빈틈 — 본문에 지어낸 발언 따옴표 ("연준은 “확신이 없다”고 말했어요") — 게이트 3 → 통과  빈틈
PASS  [model] 빈틈 — 기관 평가를 맨 사실처럼 ("지정학적 불확실성은 여전히 큽니다." → F07, 성명문이라는 말 없음) — 게이트 3 → 통과  빈틈
PASS  [publish] 불변식 8 — F01 원문 위치 없음 (출처 문서만 안다) → ['FACT_NO_SOURCE_SPAN']
PASS  [publish] 불변식 9 — F03 출처가 2차뿐 (_open-2 (a)) → ['FACT_NO_PRIMARY']
PASS  [publish] 불변식 11 — F28 의 유일한 출처가 발행 뒤 공개 (§5.3 7월 회의록 사례) → ['FACT_NOT_YET_PUBLIC']
PASS  [publish] 불변식 11 — 출처 공개일이 월 정밀도라 증명 못 함 ("2026-09") → ['FACT_NOT_YET_PUBLIC']
PASS  [publish] 불변식 13 — SL-iran-war 가 v2 로 올랐는데 핀은 v1 → ['STORYLINE_STALE']
PASS  [publish] 불변식 13 — 핀 없음 → ['STORYLINE_STALE']
PASS  [publish] 불변식 23 — DC-D 반증 기록 없음 (브리프 실물 그대로) → ['CLAIM_UNCHECKED']
PASS  [publish] 불변식 23 — ASSERTED DC-C 에 미결 반증 → ['CLAIM_UNCHECKED']
PASS  [publish] 불변식 23 — DC-A 반증 답에 사실 없음 (브리프 실물: "셋 다 투표권자") → ['CHECK_NO_FACTS']
PASS  [publish] 불변식 17 — 개전일이 월 정밀도 ("201일째" 증명 못 함) → ['DERIVED_UNVERIFIED']
PASS  [publish] 불변식 17 — DERIVED 입력에 사실 없음 → ['DERIVED_INPUT_NO_FACT']
PASS  [publish] 불변식 19 — 인용 한 블록의 두 문장이 서로 다른 원문 → ['QUOTE_NO_COMMON_SOURCE']
PASS  [publish] 불변식 20 — 원문 발행처가 인용 불가 → ['QUOTE_NOT_ALLOWED']
PASS  [publish] 불변식 20 — 권리 검토 안 된 발행처 (null) → ['QUOTE_NOT_ALLOWED']
PASS  [publish] ARTICLE_PACKAGE §6.2 — 대기 span 이 발행에 남음 → ['REFS_PENDING']

사본 80개 · OK
```

처음 돌렸을 때 5 개가 기대와 달랐다 — 전부 시험 쪽 기대값이 틀렸다 (검사가 맞았다):
- 슬롯 ⑤ · 개념 없음 → `BRIDGE_CONCEPT` 에 더해 `BRIDGE_SLOT_ORDER` 도 난다. ③ 다음 브리지가 ④ 를 못 채우니 맞다 → 기대값에 더함
- FactType 에서 OFFICIAL_LIMIT 을 빼도 `CONTRACT_TYPE_MAP` 은 안 난다 — §3.3 표는 계약 enum 이 아니라 확정 §5.2 7값에 대 본다. 맞다 → 기대값에서 뺌
- §4.4 "실물 없음" 은 두 번 나온다 — 사본이 하나만 지웠다 → 둘 다 지우게 고침
- "빈틈" 사본이 시간 조각("3년 만에")이 있는 헤드라인을 고쳐 `TE_LOCATOR` 가 났다 → 시간 조각 없는 span 으로 옮김

**3. 기존 검사 — 회귀 없음**

`python3 scripts/verify-article.py`
```
PASS  fixtures/fomc-2026-09.article.json
   WARN  0.2 대기 13 span — Bridge 2 · DerivedClaim 5 · Fact 승격 1 · Fact 출처 5
   WARN  basic[7] blocks/0/paragraphs/0/body "반년 넘게": DERIVED 출처 ['war_start'] 가 브리프 밖
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 불변식 검증 불가 — 개전일이 브리프에 없고 기사 안 출처("2월 말")는 기간이다. 2/28 이면 201, 2/21 이면 208
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 출처 ['war_start'] 가 브리프 밖
PASS  fixtures/invalid/derived-from-volatile.json  — 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic[6] blocks/1/paragraphs/1/body "3주 뒤에": 출처 ['minutes'] 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/levels/0/slides/6/_volatility/2/derived_from/0/volatility']
PASS  fixtures/invalid/volatile-missing-asof.json  — 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic[3] blocks/0/paragraphs/1/body "지금 미국은 3%대": VOLATILE 인데 as_of 가 없다 (D8)
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
```
`python3 scripts/selftest-verify-article.py` (끝 3줄)
```
  → 전부 기대대로

OK
```
`python3 scripts/verify-concept-identity.py`
```
verify-concept-identity
  계약   docs/contract/CONCEPT_IDENTITY.md
  실물   docs/content/concept-library.md — 개념 10 · CHANGELOG 버전 6건
         fixtures/fomc-2026-09.article.json — 문안 그대로 16 span · 문안 아님 5 span (concept 층)
         concept refs — ConceptRef 0 (part null 0) · "C-XXXX" 22

  WARN  LIB_RELATION_ONE_SIDE: C-0001→C-0003 는 C-0001.prereq_of 에만 있고 C-0003.prereq 에는 없다 — 양쪽에 적는 구조가 이미 어긋났다 (§9: 한 번만 적는다)
  WARN  LIB_RELATION_ONE_SIDE: C-0004→C-0006 는 C-0006.prereq 에만 있고 C-0004.prereq_of 에는 없다 — 양쪽에 적는 구조가 이미 어긋났다 (§9: 한 번만 적는다)
  WARN  LIB_USED_IN_DRIFT: C-0004: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  LIB_USED_IN_DRIFT: C-0006: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  GOLD_UNPINNED: concept span 21 의 ref 22개가 버전 · part 없는 "C-XXXX" — 브리지 검사는 글자 대조로 대신했다. ConceptRef 로 이전 전 (§16)

OK
```
`python3 scripts/selftest-verify-concept-identity.py` (끝 3줄)
```
        기대 ['GOLD_REF_SHAPE'] / 실제 ['GOLD_REF_SHAPE']

OK
```
`python3 scripts/verify-contract-coverage.py` — ARTICLE_PACKAGE §0 · §1 · §6 을 고친 뒤
```
PASS  1. 관측 경로 137개가 부록 A(91행)에 있다
PASS  2. D8 · D11 · D12 · D13 · D14 · D15 · D16 · D17 · D20 · D22 언급
PASS  3. 원형 5개 = prose · quote · list · contrast · sheet (scale 없음), Block 유니언 일치, 근거 1건 표시
      [('prose', '둘 다'), ('quote', '둘 다'), ('list', '둘 다'), ('contrast', '둘 다'), ('sheet', '근거 1건')]
PASS  4. 원형마다 절이 있고 "정규 텍스트"가 정의돼 있다
PASS  5. §11 의 _open 5개가 전부 "판정됨 → D20", §11 밖에 남은 _open 없음
PASS  6. §12 에 "게이지 → contrast 두 항목. 글자는 그대로" + 버리는 눈금 [33, 62]
PASS  7. 0.2 소관 타입을 정의하지 않음
PASS  8. 0.1a 표 20행 전부 처리 표시 (계약 반영 / _open / 0.2 로 / 범위 밖)
PASS  9. D20 — 레벨 어휘 · 층 판정 규칙 · 0.2 대기 표시(§6 · §9) · 척도 미확인
PASS  10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위

OK
```
`python3 scripts/compare-reader-text.py` (끝 2줄) · `python3 scripts/verify-observed.py` (끝 1줄)
```

OK — 독자 글 불변
PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치
```
`python3 scripts/lint-concepts.py` — **exit 1 은 회귀가 아니다.** "1 걸림"이 이 스크립트의 정상 출력이다: C-0002 ANALOGY "지금" 오탐 1 건, C-1 판정 그대로 (concept-rewrite 로그가 "1 hits" 를 기대값으로 적었다). 입력(라이브러리)을 고치지 않았다
```
lint-concepts  docs/content/concept-library.md
terms  지금 현재 올해 이번   fields  FULL REFRESHER ANALOGY

coverage
  C-0001 RATE_TO_SPENDING           FULL REFRESHER ANALOGY
  C-0002 INFLATION_LEVEL_VS_RATE    FULL REFRESHER ANALOGY
  C-0003 CB_INFLATION_TARGET        FULL REFRESHER
  C-0004 FOMC_ROLE                  FULL REFRESHER
  C-0005 VOTERS_VS_PARTICIPANTS     FULL REFRESHER
  C-0006 SEP_ROLE                   FULL REFRESHER
  C-0007 AGENCY_AUTHORITY_LIMIT     FULL REFRESHER
  C-0008 POLICY_STATEMENT_VS_RULE   FULL REFRESHER
  C-0009 FEDERAL_VS_STATE           FULL REFRESHER
  C-0010 PERSONALIZED_PRICING       FULL REFRESHER
  10 concepts · 22 fields

hits
  C-0002 ANALOGY   L73   지금  계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
  1 hits
exit 1
```
`pnpm typecheck`
```
$ pnpm -r typecheck
Scope: 3 of 4 workspace projects
packages/contract typecheck$ tsc -p .
packages/contract typecheck: Done
apps/web typecheck$ tsc -p .
apps/web typecheck: Done
```
`pnpm test` (끝 3줄) — exit 0
```
apps/web test:   ✓  33 e2e/lab-read.spec.ts:12:5 › lab/c 숙련 — 375×667 에서 끝까지 읽힌다 (15.8s)
apps/web test:   33 passed (1.9m)
apps/web test: Done
```
`pnpm test` 의 e2e 가 `logs/frontend/F-2a/` 스크린샷 · 영상 7 개를 다시 썼다. 세션 시작 때 깨끗했던 파일이라 `git checkout` 으로 되돌렸다 — 이 커밋에 없다.

**4. D6 영향 — 골든 `published_at` 을 바꿔 다시 계산** (`verify-article.py` 에 사본을 넣어, 파일 안 남김)
```
== 2026-09-17
   ERROR DERIVED_INVARIANT_FAIL: advanced[4] blocks/0/paragraphs/0/body "201일째": recompute(published_at) != value_at_authoring (D8 규칙 3)
== 2026-09-18
   ERROR DERIVED_INVARIANT_FAIL: advanced[4] blocks/0/paragraphs/0/body "201일째": recompute(published_at) != value_at_authoring (D8 규칙 3)
```
DERIVED 18 중 이것 하나만 날 단위라 깨진다. 나머지(주 · 달 · 해)는 하루 이틀에 안 바뀐다.

### 읽은 것 — 지시 목록 밖을 연 것
지시 목록은 다 읽었다. 목록 밖으로 연 것과 이유:
- FINDINGS §1 · §9.6 · §14 · §15 (CLAUDE.md 가 모든 세션에 요구) · §7 표 (스테이지 상태 — §7.1 바로 위) · §12.1 (D6 의 원문 — DECISIONS 에 D6 절이 없고 표 한 줄뿐이다)
- `docs/development-content.md` 작업 표 — C-2 · C-3 · C-5 가 무엇을 맡았는지 (질문 10 의 행선지). 고치지 않았다
- `fixtures/ftc-2026-08.observed.json` 의 인용 블록 — FOMC-6 실물 ("FTC 는 있음")
- `scripts/verify-article.py` · `verify-concept-identity.py` · `verify-contract-coverage.py` · 두 selftest — 검사 모양을 맞추고 재사용하려고. 고치지 않았다
- `packages/contract/src/types.ts` 의 Ref — 프론트가 받는 모양 확인. 고치지 않았다
- `logs/backend/phase-0-step-0-2a.md` — 로그 형식
- PM.md · deprecated · 라이브러리 본문 · FOMC core-drafts 는 열지 않았다 (라이브러리는 스크립트가 CONCEPT_IDENTITY 파서로 읽는다)

### 범위 밖 관찰 (고치지 않음)
1. **ARTICLE_PACKAGE 에 낡은 문구가 남았다** — §12-6 "0.2 대기 7"(D23 이후 13) · §6.2 첫 문단의 대기 목록(D20 시점) · §2 · §3 · §7.4 · §8 · §10 · 부록 A 의 "→ 0.2" · §1 `published_at: Date`. 지시 범위(§0 · §1 · §6 참조 문구)만 고쳤다
2. **FOMC 브리프 F38 이 있다** — 지시는 "F01~F37" 이라 했지만 브리프는 F38(다음 회의 10/27~28)까지 있다. 골든은 F38 을 안 쓴다
3. **숙련 3장 "9월 초"** — 붙은 사실들(F35 · F36)은 브리프에서 T-1(9/15)이다. "초"와 15일이 맞는지는 출처를 찾을 때 볼 것 (D23 #25)
4. **골든의 claim span 이 DC-B(방어용)를 3 번 가리킨다** — 방어용은 "우리가 주장할 claim 이 아니라"고 브리프가 썼다. 층은 `claim` 이 맞다(해석). 글이 "증거는 없다" 쪽으로 쓰였는지는 게이트 3
5. **§5.5 원문 리터럴 대조는 언어가 다른 두 글 사이다** — 사실 문장은 한국어, 원문은 영어. 원문을 보관해 대 본 적이 없어 미확인으로 남겼다. 원문 보관을 처음 할 때 가장 먼저 부딪힐 곳이다

---

## B-0.2b 게이트 반영 · 2026-10-09 · **D27** (판정 2026-10-03 · PM, 도윤 위임)

위 표의 "_open-N" · "게이트 전" 표시는 게이트 전 기록이다. 판정은 아래와 같다.

| # | 판정 (D27) | 반영 |
|---|---|---|
| _open-1 | (a) `fact_type` 은 7값으로 닫는다 | 계약 §3.2 · §3.3 — SELF_LIMIT → OFFICIAL_LIMIT("기관이 스스로 밝힌 한계") · HISTORICAL_CONTEXT → OFFICIAL_ACTION(1차 조치 기록) · FACT · METHOD · MECHANISM · S05 → 말한 기관의 OFFICIAL_CLAIM. §3.3 표에 _open 표시가 없다 — 검사가 7값 또는 "행마다" · "나눈다"만 받는다 |
| _open-2 | (a) 발행하려면 Fact 마다 1차 출처 | §4.3 · 불변식 9. "1차 = 그 사실을 만들었거나 측정한 주체의 자료" |
| _open-3 | Fact · Claim · Bridge · Source = UUID + `label`. **Event · Storyline 도 UUID + `code`** (추천을 뒤집음) | §1 (`EventId` · `StorylineId` = UUID, Event · Storyline 에 `code`) · §2.1 · §2.2 · §9.1 · §9.3 · §9.4 · §13 · 불변식 1 · §18. ARTICLE_PACKAGE §1 · §6 의 `event_ref` 문구 + CHANGELOG |
| — | "도출하며 판단한 것" 표 — 수용 | §16 표에 적음 |
| — | §16 → "판정됨 → D27" · CHANGELOG | 함 |
| — | 레인 | §17 — "9월 초" · "3주 뒤" · 개전일(C-2 를 합침) → C-3 / 해석 5 · DC-D · DC-E · DC-A 둘째 답 · DC-C 범위 → C-5 / 원문 위치 25 · 공개 시점 증명 9 → 파이프라인(손으로 안 한다). 64 건을 누가 채우는지 표로 |
| — | 독자 글 1건 (도윤 승인) | 아래 |

### 독자 글 수정 1건 — 입문 7장 대조
`세 명만\n“올리자”고 반대` → `세 명만\n올리자고 반대` (따옴표 두 글자만. 줄바꿈 · 층 fact · refs F28 그대로)
- `fixtures/fomc-2026-09.article.json` — span `text` 와 그 블록의 정규 텍스트(`text == linearize(block)`) 두 곳
- `fixtures/invalid/*.json` 2건 — 같은 두 곳을 고쳐 "골든 + 위반 1개"를 유지 (아래 verify-article: 골든과 다른 곳 1군데씩)
- `scripts/compare-reader-text.py` — 허용된 차이 1 → 2건. 그 밖의 차이는 여전히 실패 (selftest-verify-article 통과)
- `logs/correction-log.csv` 1행 — stage 게이트(0.2b) · error_type 레이어 혼입 · source_of_catch 0.2b 인용 검사 · time_spent_min 비움
- 계약 §10.2 — 본문 따옴표 후보 4 → 3, 고친 1건을 기록

### Event · Storyline 을 UUID 로 — 검사에 더한 것
- 계약 검사: `EventId` · `StorylineId` 가 UUID · Event · Storyline 에 `code` · 판정 안 된 `_open-N` 이 남지 않음(`CONTRACT_OPEN_LEFT`)
- 시험 사본: 사건 · 스토리라인 키를 시험용 UUID 로, 골든 `event_ref`("FOMC-20260916" = code)를 그 UUID 로 옮김. `EVENT_REF`(패키지가 code 를 참조에 씀) · `CODE_DUP`(code 겹침)
- 망가뜨린 사본 80 → 86. 새로 넣은 것:
```
PASS  [contract] §5.2 — FactType 에 BACKGROUND 추가 (D27 이 닫은 7값을 연다) → ['CONTRACT_ENUM']
PASS  [contract] D27 — Event.code 삭제 (사람이 부르는 이름이 없다) → ['CONTRACT_FIELD']
PASS  [contract] D27 — EventId 를 다시 문자열로 (초안의 추천) → ['CONTRACT_FIELD']
PASS  [contract] D27 — §3.3 에 _open-1 표시가 다시 들어옴 → ['CONTRACT_OPEN_LEFT', 'CONTRACT_TYPE_MAP']
PASS  [contract] D27 — §16 의 _open-2 행에서 "판정됨" 삭제 → ['CONTRACT_OPEN_LEFT']
PASS  [model] D27 — 패키지 event_ref 가 code 문자열 ("FOMC-20260916") — 브리지의 사건과도 어긋난다 → ['BRIDGE_EVENT', 'EVENT_REF']
PASS  [model] D27 — 두 사건이 같은 code → ['CODE_DUP']
PASS  [publish] 불변식 9 — F03 출처가 2차뿐 (D27 — 1차 필수) → ['FACT_NO_PRIMARY']
```

### 검증 — 전부 다시 돌림 (2026-10-09)

**`python3 scripts/verify-data-model.py`** — 64 건은 그대로다 (채우는 것은 C-3 · C-5 · 파이프라인)
```
verify-data-model
  계약   docs/contract/DATA_MODEL.md
  실물   브리프 3 — 사실 타입 30종 · FOMC 사실 38 · DC 5
         골든 — 대기 13 ({'Bridge': 2, 'DerivedClaim': 5, 'Fact 승격': 1, 'Fact 출처': 5}) · 시간 조각 29 ({'DERIVED': 18, 'VOLATILE': 11}) · 인용 2
         끊긴 F 연결 — DC 있는 claim 17 · 대기 claim 4 · bridge 2 · 그 밖 1
  시험 사본 — Fact 38 · Claim 5 · Bridge 1 · Source 8 · 시간 조각 29
         발행 검사에서 막히는 것 64 — CHECK_NO_FACTS 1 · CLAIM_UNCHECKED 2 · DERIVED_INPUT_NO_FACT 4 · DERIVED_UNVERIFIED 1 · FACT_NOT_YET_PUBLIC 9 · FACT_NO_PRIMARY 9 · FACT_NO_SOURCE_SPAN 25 · QUOTE_NO_COMMON_SOURCE 2 · REFS_PENDING 11


OK
```
`--report` 의 본문 따옴표 절 — 4 → 3
```
게이트 3 후보 — 본문 따옴표 (§10.2)
  basic 3장 concept ['C-0002']  '“라면이 2000원이다”는 그냥 가격입니다.'
  basic 3장 concept ['C-0002']  '“라면값이 작년보다 5% 올랐다”는 오르는 속도예요.'
  basic 6장 claim   ['DC-C']  '연준이 던진 질문은 “물가가 나빠졌는가”가 아니었습니다.'
```
**`python3 scripts/selftest-verify-data-model.py`** (끝 3줄. 전체 88줄 PASS — 원본 2 + 사본 86)
```
PASS  [publish] ARTICLE_PACKAGE §6.2 — 대기 span 이 발행에 남음 → ['REFS_PENDING']

사본 86개 · OK
```
처음 돌렸을 때 1 개가 기대와 달랐다: "CHANGELOG B-0.2b 행 삭제" 사본이 통과했다 — 이번에 B-0.2b 행이 둘이 됐는데 사본이 첫 행만 지웠다. 전부 지우게 고쳤다 (검사는 맞았다).

**`python3 scripts/verify-article.py`** — 골든 + invalid 2건
```
PASS  fixtures/fomc-2026-09.article.json
   WARN  0.2 대기 13 span — Bridge 2 · DerivedClaim 5 · Fact 승격 1 · Fact 출처 5
   WARN  basic[7] blocks/0/paragraphs/0/body "반년 넘게": DERIVED 출처 ['war_start'] 가 브리프 밖
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 불변식 검증 불가 — 개전일이 브리프에 없고 기사 안 출처("2월 말")는 기간이다. 2/28 이면 201, 2/21 이면 208
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 출처 ['war_start'] 가 브리프 밖
PASS  fixtures/invalid/derived-from-volatile.json  — 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic[6] blocks/1/paragraphs/1/body "3주 뒤에": 출처 ['minutes'] 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/levels/0/slides/6/_volatility/2/derived_from/0/volatility']
PASS  fixtures/invalid/volatile-missing-asof.json  — 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic[3] blocks/0/paragraphs/1/body "지금 미국은 3%대": VOLATILE 인데 as_of 가 없다 (D8)
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
```
**`python3 scripts/selftest-verify-article.py`** (끝 3줄)
```
  → 전부 기대대로

OK
```
**`python3 scripts/compare-reader-text.py`**
```
옛 골든 c46871d → 새 골든 fixtures/fomc-2026-09.article.json
  레벨 2 · 슬라이드 14 · 독자 글 단위 115개 · 3294자 대조
  허용된 차이 2/2건 (그 밖의 차이는 전부 실패):
    basic[6] blocks/0 0.body: '세 명만\n“올리자”고 반대' → '세 명만\n올리자고 반대'  (D27 · 0.2b 인용 검사 — 바꿔 말한 것에 발언 표시(따옴표)를 단 것. 따옴표만 뺐다. 도윤 승인)
    basic[7] blocks/1 p0: '연준이 “확신이 없다”고 말한' → '연준이 확신이 없다고 본'  (D23 · 0.1b PM 검수 #16 — 해석에 원문 표시(따옴표)를 단 것. 도윤 승인 2026-09-29)
  계약이 버리는 것 (대조 밖): end_actions 2개 · teaser 기호 · 눈금 · modifier · style

OK — 독자 글 불변
```
**`python3 scripts/verify-concept-identity.py`** (끝 4줄) · **selftest** (끝 1줄)
```
  WARN  LIB_USED_IN_DRIFT: C-0006: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  GOLD_UNPINNED: concept span 21 의 ref 22개가 버전 · part 없는 "C-XXXX" — 브리지 검사는 글자 대조로 대신했다. ConceptRef 로 이전 전 (§16)

OK
OK
```
**`python3 scripts/verify-contract-coverage.py`** (끝 3줄) — ARTICLE_PACKAGE `event_ref` 문구를 고친 뒤
```
PASS  10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위

OK
```
**`python3 scripts/verify-observed.py`** (끝 1줄) · **`diff-observed-article.py`** (끝 2줄 — 관측 대비 바뀐 단위가 11/18 → 12/19, 이번 1건)
```
PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치
요약: 본문이 바뀐 슬라이드 [('basic', 2), ('basic', 3), ('basic', 4), ('basic', 6), ('basic', 7), ('advanced', 3)]
      - 단위 12개 / + 단위 19개 (슬라이드 삭제 0)
```
**`python3 scripts/lint-concepts.py`** — exit 1 = "1 걸림", C-1 이 판정한 ANALOGY 오탐 그대로. 회귀 아님
```
hits
  C-0002 ANALOGY   L73   지금  계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
  1 hits
```
**`pnpm typecheck`** exit 0 · **`pnpm test`** exit 0 (끝 2줄)
```
apps/web test:   44 passed (2.5m)
apps/web test: Done
```
`pnpm test` 가 `logs/frontend/F-2a/` 스크린샷 · 영상 13 개를 다시 썼다 — `git checkout` 으로 되돌렸고 이 커밋에 없다.

### 고치지 않은 것 · 남은 것
- 골든 refs · `event_ref` 는 아직 옛 모양("F31" · "FOMC-20260916")이다. UUID 로 옮기는 것은 0.2m
- 이 로그 앞부분(게이트 전 기록)은 그대로 두었다 — "게이트에서 먼저 볼 것" 5 번(“올리자”)은 위에서 고쳤고, 4 번(레인 없는 대기)은 C-3 이 맡는다
- ARTICLE_PACKAGE 의 남은 "→ 0.2" 문구 · §1 `published_at: Date` · §12-6 "대기 7" 은 이번에도 범위 밖 (계약 §18)
