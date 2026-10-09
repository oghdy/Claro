# logs/backend · Phase 0 / Step 0.2m-a — 이전: 라이브러리 · 골든을 계약 모양으로

## B-0.2m-a · 2026-10-09 · **[GATE]**

커밋: `f8f6dce` (1/5 계약을 실물에) · `409dc05` (2/5 라이브러리) · `38e17fd` (3/5 골든) · `7efe93e` (4/5 packages/contract) · 이 커밋 (5/5 · 로그)

### 물음 a ~ g — 처리 요약

| # | 물음 | 표시 | 근거 (실물 · 확정) | 어디에 |
|---|---|---|---|---|
| a | D26 — 마지막을 뺀 모든 슬라이드 뒤에 open_question 이 반드시 하나 있어야 한다. ARTICLE_PACKAGE 가 요구하나 · D18 의 전제 | **계약 반영** (이미 요구한다 — 규칙은 안 바뀜) | ARTICLE_PACKAGE §5 "길이는 정확히 `slides.length − 1`, 모든 `text` 는 비어 있지 않다" · 불변식 2 (D15 QA①). 골든 9장 · 8개 / 5장 · 4개. `verify-article.py` `OQ_LENGTH` · `OQ_EMPTY`, 프론트 검증기 `OQ_LENGTH` · `STRING_EMPTY` 가 이미 막는다 | ARTICLE_PACKAGE §5 에 D26 주석 — 바뀐 것은 무게다 (깨지면 독자가 다음 장으로 못 간다). D18 의 전제 "질문이 별도 슬라이드"는 사라졌다고 적음 — D18 자체는 PM |
| b | 반증 기록의 답이 발행 뒤 문서에만 기댈 때 발행할 수 있나 (D29-6) | **계약 반영** — 못 한다 | 확정 §5.3 ("그 시점 기사에 쓸 수 없다") · DATA_MODEL §2.3 (발행물이 가리키는 것은 고치지 않는다 → 판정도 발행 때의 것) · 0.2b 의 검사가 처음부터 `checks[].facts` 를 "닿는 Fact"로 셌다. **이 골든에서는 사라졌다** — DC-A 물음 2 는 C-3b 의 발행 전 문서 셋에서 이끌어낸 답이다 | DATA_MODEL §7.3 · §14 ("패키지가 닿는 Fact"의 뜻을 글로 적음). 글로 적은 것은 새로라 게이트에서 확인 |
| c | VOLATILE 값이 바뀌어 생긴 새 Fact 와 옛 Fact 의 앞뒤를 잇는 기록의 자리 | **_open** (-m7) | 확정에 없다. 실물 1 — F30 (8/7 발표 -23,000) → F39 (9/4 발표 +21,000). 틀린 것이 아니라 OBSERVATION §9 는 받지 않는다 | DATA_MODEL §15 의 줄을 "자리가 없다"로 고침 · §19 _open-m7. 저장소에서는 두 사실의 주석 글로만 이어져 있다 |
| d | Comprehension Goal 을 가리킬 타입이 없다 | **_open** (-m8) | 확정 §7.3 (Common 한 문장 · Deep · Goal 도 반증 통과) + 실물 브리프 §5 가 있다. 모양은 읽히지만(`{ goal_id, event_id, kind, statement, claims }`) OBSERVATION 의 Probe 가 가리켜야 해서 여기서 정하지 않았다 | DATA_MODEL §15 · §19 _open-m8. 저장소 DC-C 주석에 "이 해석이 Common Goal" |
| e-1 | span 의 `_source_note` | **계약 반영** — 새 칸 없음 | 실물 16개의 내용은 둘이다: 1차 문서 약칭(→ 그 사실의 FactSource) · 왜 고쳤나(→ `authoring.notes`, 교정 사유는 correction-log 에 이미 있다). ArticleAuthoring.`notes` 가 그 자리다 (§1) | DATA_MODEL §11 표에 한 줄. 골든에서 `_source_note` 0 |
| e-2 | 사실 ID 없는 "바뀌는 값"을 적을 자리 | **계약 반영** — 자리는 이미 있다. 막혀 있던 것은 사실이 없어서였다 | 불변식 16 (VOLATILE 조각은 VOLATILE 사실을 가리킨다). C-3 · C-3b 에 1차 구절이 있어 사실을 만들었고(F39 ~ F43) 시간 조각 7개를 적었다 | record `authoring.time_expressions` 23 → 30 |
| e-3 | "201일째"의 `war_start` | **계약 반영** (저작 데이터) — "2026-02" → "2026-02-28" | C-3 [일치] · WH-0408 구절. 재계산 PASS (UNVERIFIABLE 풀림). 단서: 구절은 **명령한 날**이다 (CC-FS 는 직접 못 열었다) | DATA_MODEL §6.4 · record |
| f-1 | 입문 4장 ③ 두 span 에 C-0012 참조를 더할지 | **_open** (-m5) — 더하지 않았다 | ③ 의 글은 C-0002 FULL ③ 그대로다 (`part` = 무엇을 재료로 썼나, §3.3). 결과: OBSERVATION §4.2 로 셈하면 입문에서 C-0012 는 SKIP | CONCEPT_IDENTITY §17 |
| f-2 | C-0010 BOUNDARY 가 FULL · REFRESHER 와 함께 나오는지의 검사 (Q-C2) | **_open** (-m4) · 검사는 **미확인** (실물 없음) | 규칙은 D32 가 정했다. 규칙이 사는 곳이 저작 메모뿐이다(§5.1 은 규칙을 구조 필드로 올리라고 한다). C-0010 을 쓰는 패키지가 없다 | CONCEPT_IDENTITY §17 |
| g-1 | alias 를 빼거나 제시 규칙만 바뀐 것이 버전을 올리는 일인가 | alias — **계약 반영** (아니다. 이미 §3.1 · §7.1 "alias 는 버전이 없다") / 제시 규칙 · 저작 메모 — **_open** (-m2) | 계약 글자로는 오른다(ConceptVersion 이 `authoring` 을 품은 스냅숏). 실물은 안 올렸다(C-0010 v2). 가리키는 발행물 · 독자 기록이 없어 지금은 해가 없다 | CONCEPT_IDENTITY §17. 저장소는 실물대로 v2 |
| g-2 | 명제가 바뀐 버전의 사유를 담을 칸 | **_open** (-m3) | 실물 3 (C-0002 v4 · C-0003 v2 · C-0009 v2). 지금은 `basis` · `change` 글에 있다. 불변식 6 이 이 3건에서 깨져 있고 예외임을 기계가 모른다 | CONCEPT_IDENTITY §4.1 (3건을 실물로 적음) · §17 |

### 게이트에서 먼저 볼 것

1. **`verify-observation` 이 FAIL 이 됐다 — 이 세션이 골든을 옮긴 결과다. 고치지 않았다 (0.2m-b 의 파일).**
   OBSERVATION §4.2 의 실물 표가 `C-0003 | SKIP | SKIP` 을 글자로 적고 검사가 골든과 댄다. D32 대로 그 참조 셋이 C-0012@1 이 됐다. 표의 그 줄을 `C-0012` 로 바꾸면 통과한다 (계산값: C-0001 FULL/SKIP · C-0002 FULL/SKIP · C-0005 SKIP/REFRESHER · C-0012 SKIP/SKIP).
   1단계에서 없앤 것과 같은 모양이다 — 계약이 살아 있는 실물의 글자를 적었다. `REPL_PENDING` (Replacement 6건의 concept_id 대기)도 이제 채울 수 있다 — UUID 는 `docs/content/concept-library.json` · md 의 `concept_id` 줄
2. **e2e 1건 실패 — 이 이전 탓이 아니다.** `lab/a 숙련 — 375×667 에서 끝까지 읽힌다` (독자 글 단위 53/55). 이전 전 골든(`409dc05`) + 옛 검증기로 같은 테스트를 돌려도 같은 실패다. C-5 2차(R4 · R10)가 숙련 3 · 5장을 늘린 뒤 e2e 가 돌지 못했었다(`3de2974` — 3100 포트). `apps/web/src/lab` 은 건드리지 않았다. 나머지 77 통과. 도윤이 고른 B5 는 통과한다
3. **대기 21 → 0. 전부 기록에 있던 재료로 채웠다 — 그 과정에서 사람이 볼 판단이 여섯 있다** (아래 "판단한 것" 1 ~ 6): 나눈 셋의 처리 · 새 사실 23개의 `claim_text` 를 이 세션이 적었다 · N1 ~ N5 를 DerivedClaim 다섯으로(묶지 않았다) · 입문 8장 제목 → N5 · 문안이 아닌 concept span 5개의 `part` · 반증 물음 하나를 UNRESOLVED 로
4. **불변식 25 를 바꿨다 (잠정 · _open-m1).** 대기 span 을 계약의 글자 표와 대조하지 않는다. 잃는 것은 selftest 의 "빈틈" 줄이 보인다
5. **발행 검사에서 막히는 것 61 — 독자에게 닿는 것은 5건, 문장으로는 일곱 곳이다** (아래)
6. **브리프는 한 글자도 안 고쳤다.** C-5 가 "브리프 쪽 (0.2m)"으로 넘긴 것(F32 나누기 · F35 · F34 · F36 · S3 preliminary · DC-C statement · DC-E "노동공급 감소" · POST probe 보기 B · §6 방어 표)은 브리프에는 그대로 남아 있다. 저장소에는 반영됐다(나눔 · `_c3` 주석 · 좁힌 statement). 브리프를 고칠지는 PM

### `verify-data-model --report` — 발행에서 막히는 것 61건

| 갈래 | 건 | 무엇 |
|---|---|---|
| **독자에게 닿는 것** | **5** | `FACT_NO_PRIMARY` 1 · `FACT_NOT_YET_PUBLIC` 2 · `CLAIM_UNCHECKED` 2 |
| 기계 검증용 (파이프라인) | 56 | `FACT_NO_SOURCE_SPAN` 50 (원문 위치) · `FACT_PUBLIC_UNPROVEN` 4 (살아 있는 페이지 · 날짜 없는 글 — F03 · F37b · F43 · IR06) · `QUOTE_SPAN_MISSING` 2 (인용 블록 — 원문은 하나로 확인됐고 위치만 없다) |

이전 전(시험 사본)은 68건이었다 — REFS_PENDING 19 · 1차 출처 없는 사실 8 · 반증 3 · DERIVED 입력 5 · 인용 원문 2 가 사라졌다.

**독자에게 닿는 5건이 닿는 문장**

| 막히는 것 | 왜 | 닿는 문장 |
|---|---|---|
| F36 "시장은 인상 확률을 90% 이상 반영" — 1차 출처 없음 · 공개 시점 없음 (2건) | C-3 M-1 [못 찾음]. 브리프 DC-B 의 근거에 들어 있다 (골든 글은 C-5 에서 이미 뺐다) | DC-B 를 가리키는 세 span — 입문 7장 "다만 그 세 사람이 나머지를 설득한 건지 … 아직 알 수 없습니다." · 숙련 3장 "내부 역학은 3주 뒤 회의록 전까지 확인 불가." · "현재 확실한 것은 순서뿐입니다." 글은 맞다 — **해석의 근거 목록**에 죽은 사실이 남아 있다. DC-B 의 근거에서 F36 을 빼고 F42 · F43 (CME 66% · 58%)으로 바꾸면 풀린다. 브리프의 근거를 고쳐 적는 일이라 하지 않았다 |
| F44 "9월 회의록은 10/7 에 공개됨" — 가장 이른 출처가 발행 뒤 | C-3 M-4. 9/16 에 공개 예정일을 알린 문서를 못 찾았다 | 입문 7장 "회의 내부 기록은 3주 뒤에 공개돼요." · 숙련 3장 "3주 뒤 회의록" (DERIVED 입력) |
| DC-I — 반증 미결 | C-5 N4 물음 3 "다른 이유는?" 에 발행 시점 근거가 없다 (로그에 outcome 이 없어 UNRESOLVED 로 옮겼다 — 판단 6) | 입문 8장 "연준이 확신이 없다고 본 이유의 하나가 여기 있습니다." |
| DC-J — 같은 미결 (N5 는 N4 의 물음을 그대로 쓴다) | 같음 | 입문 8장 제목 "이란 전쟁이 어디로 갈지 모릅니다" · 숙련 5장 "1. 물가 전망의 큰 변수가 전쟁입니다." |

### 1단계 — 계약이 살아 있는 실물의 글자 · 수를 적고 검사가 대조하는 곳

| 어디 | 무엇을 적었나 | 검사가 대조하나 | 한 것 |
|---|---|---|---|
| DATA_MODEL §17 대기 표 ↔ `verify-data-model` (불변식 25) | 골든 대기 13 문장의 글자 · 층 · need | **한다** — 이번 빨간불 | **실물에서 계산하기 + 날짜 붙은 기록으로.** 계약은 어휘(need 넷 · 붙는 층)만. 표는 "2026-10-03 시점의 기록". 잠정 → _open-m1 |
| CONCEPT_IDENTITY 의 "10개" · "6건" · "10/10" · "8/10" … (20여 곳) | 라이브러리의 수 | 안 한다 (글만 어긋났다) | **날짜 붙은 기록으로.** 머리에 "도출한 날의 기록 · 지금 수는 검사가 센다". 규칙의 근거가 달라진 곳만 날짜를 붙여 덧붙임 (§4.1 명제를 나눈 3건 · §8 표) |
| `selftest-verify-concept-identity` ↔ 라이브러리의 글자 | "`version`: v3 (2026-09-29)" · C-0009 REFRESHER 문장 | — (사본을 못 만들어 멈춤) | **글자 대신 자리로 찾기** (`bump_version` · `drop_field_body`). 고치다 구멍 하나를 찾았다 — 운영 노트가 달린 개념은 REFRESHER 본문을 지워도 통과했다(노트를 본문으로 읽음). 막았다 |
| DATA_MODEL "64 건" 표 · "`_volatility` 29" · "골든 24" 등 | 수 | 안 한다 | 머리에 "도출한 날의 기록". 64 건 표는 제목에 날짜 |
| **OBSERVATION §4.2 실물 표 · §8 "1~N행"** ↔ `verify-observation` | 골든의 block_decisions · CSV 집계 | **한다** — 위 "먼저 볼 것" 1 | 0.2m-b 의 파일이라 손대지 않았다. 같은 처방(실물에서 계산 · 표는 기록)을 권한다 |
| ARTICLE_PACKAGE §6 표 "골든 fact 64 · claim 30 …" · §12 | 수 (0.1b 시점이라고 적혀 있다) | 안 한다 (`verify-contract-coverage` 는 얼린 판 `c46871d` 을 읽는다) | 그대로 |

남는 원칙 하나: **검사가 실물끼리 대는 것은 좋다** (브리프 ↔ 저장소 · md ↔ 저장소 · 기록 ↔ 구절 — 이번에 넣었다). 나쁜 것은 계약 **문서의 글**이 실물의 글자를 들고 있는 것이다.

### 한 일

**2단계 — 라이브러리** (`409dc05`)
- `docs/content/concept-library.json` — Concept 13 (UUID 발급) · ConceptVersion 13 (지금 버전의 문안 한 벌씩) · ConceptAlias 31 · ConflictingAlias 1 · ConceptRelation 9 · `_version_history` 22줄
- md 는 사람이 읽고 쓰는 면으로 남겼다. 개념마다 `concept_id` 줄(같은 UUID) · "concept_id" 라 부르던 것을 `code` 로 (D25). **문안은 0자 바뀜**
- 기계 대조: `compare-concept-text.py` — 이전 전 md(git) ↔ 저장소 ↔ 지금 md, 44 단위 · 2661자 · 차이 0. `verify-concept-identity` 의 `STORE_TEXT` 가 계속 지킨다 — md 문안을 고치고 저장소에 새 버전을 안 만들면 실패한다

**3단계 — 골든** (`38e17fd`)
- `fixtures/fomc-2026-09.article.json` — 패키지. refs 를 층별 Ref 로(fact 68 · claim 30 · bridge 2 = UUID, concept 21 = ConceptRef 22개) · `event_ref` UUID · `_` 주석은 `_source` 하나만 남음
- `fixtures/fomc-2026-09.record.json` — `article_id` · `article_version` 1 · `authoring` (시간 조각 30 = DERIVED 17 · VOLATILE 13 · 스토리라인 핀 1 · 저작 메모 25)
- `fixtures/store.json` — Event 1 · Storyline 1 (v1) · Source 31 · Fact 62 · FactSource 78 (1차 구절 69) · DerivedClaim 10 · Bridge 1
- C-0002 는 v4 · `C-0003` 을 가리키던 셋은 C-0012@1 · 브리지는 (C-0002, 4, ④)
- 기계 대조: `compare-reader-text.py --before 409dc05` — 독자 글 117 단위 · 3378자 · span 127 (경계 · 층) · 블록 text 28 · **차이 0** (허용된 차이 없이). open_question 12개 포함. 옛 골든(`c46871d`)과의 대조도 등록 안 된 차이 0

**4단계 — packages/contract** (`7efe93e`)
- `types.ts` — `Ref = FactRef | ClaimRef | BridgeRef | ConceptRef` · `event_ref: EventRef`
- `validate.ts` — concept 층이면 ConceptRef 모양(필드 셋 · version 양의 정수 · part 문자열 또는 null), 나머지 층이면 문자열
- 테스트 +1 (사례 9). **apps/web 은 바뀐 파일 0** — 패키지 파일이 그대로 패키지라 `loadPackage` · e2e · lab 이 그대로 읽는다. 화면은 refs 를 읽지 않는다

**5단계**
- invalid 3건 — 골든 한 벌의 한 파일 + 위반 1개 (`_violation.of` 가 갈아 끼울 파일): `volatile-missing-asof` (저장소 — as_of 는 이제 사실에 있다) · `derived-from-volatile` (record) · `ref-label-not-uuid` (패키지 — 새로)
- 검사 스크립트 — `verify-article` (층별 Ref · record 의 D8) · `verify-data-model` (메모리 안 시험 사본을 버리고 실물 저장소를 읽는다 + 원천 대조) · `verify-concept-identity` (저장소 절 · 옛 문자열 ref 는 실패)
- 망가뜨린 사본 — selftest 세 벌 (아래) + 실제 파일을 고쳐 본 9건 (아래)

### 판단한 것 — 지시에 글자로 없던 것

1. **나눈 셋 (DATA_MODEL §3.3 "나눈다").** 브리프를 고치지 않고 저장소에서 나눴다. 절은 브리프 글의 부분 문자열 그대로다(그래서 F32a 는 "…말하며"로 끝난다 — 다듬지 않았다).
   F32 뒷부분("이전보다 명확한 인상 가능성 신호를 보냄")과 F37 앞부분("이란 전쟁으로 연료 가격이 급등")은 **Fact 로 만들지 않았다** — 계약 §3.3 이 해석 · 주장한 쪽 없는 인과라고 갈랐고 C-3 이 [못 찾음]으로 판정했다. 저장소 `_not_facts` 에 적혀 있다. 그래서 "나누면 41"이 아니라 39
2. **새 사실 23개의 `claim_text` 는 이 세션이 적었다.** C-3 · C-3b · 스토리라인 문서의 수치 · 구절을 한국어 한 문장으로 옮겨 적은 것이다(독자 글이 아니다). 구절(`_passage`)은 기록에 글자 그대로 있어야 하고 검사가 댄다 — 지어낼 수 없다. 문장 자체는 사람이 한 번 봐야 한다.
   `fact_type` · `actor` · `event_at` · `volatility` 도 행마다 정했다: 미국이 스스로 밝힌 자기 행위(작전 명령 IR01 · 공격 IR03 ~ 05)는 OFFICIAL_ACTION, "이란이 휴전에 동의했다"는 백악관 발표(IR02)는 OFFICIAL_CLAIM. 발표된 통계 · 시장 확률은 VOLATILE + `as_of` = 발표일
3. **N1 ~ N5 → DerivedClaim DC-F ~ DC-J.** C-5 가 "0.2m 판단"으로 넘긴 둘(N2 를 DC-B 로 묶기 · N3 ~ N5 를 하나로 묶기)은 **묶지 않았다** — 묶으려면 `statement` 를 새로 써야 한다. 로그의 문장 · 근거 · 물음 그대로 다섯이다. label 은 이어 붙였다
4. **입문 8장 제목 "이란 전쟁이 어디로 갈지 모릅니다" → DC-J (N5 "전쟁은 물가 전망의 큰 불확실성이다").** D29-4 는 "N3 ~ N5 중 하나"까지만 정했다. 키커 "큰 변수" · 숙련 5장 "큰 변수가 전쟁"과 같은 말이라 N5 로 골랐다
5. **문안을 글자 그대로 옮기지 않은 concept span 5개의 `part`** (CONCEPT_IDENTITY §16 "옮길 때 판정한다"):
   입문 3장 제목 "연준이 보는 건 물가가 아니라 속도예요" → C-0002 `null` · 입문 4장 제목 "연준이 원하는 속도는 1년에 2%예요" → C-0002 `null` + C-0012 `null` · 대조 항목 "연준이 원하는 속도" · "2%" → C-0012 `null` · 입문 5장 제목 "금리는 그 차의 브레이크예요" → C-0001 `ANALOGY:브레이크 페달` (계약의 예대로).
   4장 제목을 `FULL:③` 으로 달아 봤다가 되돌렸다 — 제목이 "마지막 ③ span"이 되어 브리지 순서 검사(불변식 13)의 뜻이 달라진다
6. **반증 물음 하나를 UNRESOLVED 로 옮겼다.** N4 물음 3 "다른 이유는?" — 로그는 "발행 시점 근거 없음"이라고만 적고 outcome 을 적지 않았다. C-5 가 "없음"을 UNRESOLVED 로 적던 방식대로 했다. 그 결과 DC-I · DC-J 가 발행에서 막힌다. "하나다"라는 문장이 이미 다른 이유를 열어 두므로 반증이 아니라고 보면 이 물음은 빠질 수 있다 — 사람이 정한다
7. **해석의 근거(`basis`)** — DC-E 에 F39 · F40 을 더했다(좁힌 문장이 9/4 수치에 선다). DC-J 에 F37b 를 더했다(골든의 두 span 이 달고 있던 끊긴 연결 — 옮기면서 잃지 않으려고). DC-B 는 브리프 그대로 두었다(F36 포함 — 위 "닿는 5건")
8. **파일 배치.** ArticleRecord 를 한 파일로 만들지 않고 패키지 파일을 그대로 두었다. 이유 둘 — `verify-observation.py`(0.2m-b)가 그 파일을 `gold['levels']` 로 읽고 md 의 `concept_id` 줄에서 UUID 를 읽도록 이미 짜여 있었다 · 프론트가 바뀌지 않는다. record 가 `_package` 로 가리킨다 (DATA_MODEL §11 에 적음)
9. **Source 31.** 브리프 S3(기자회견 preliminary)와 지금 그 주소의 FINAL 은 다른 Source 로 두었다(§4.1). 브리프가 뽑은 사실(F20 ~ F27)은 둘 다에 걸린다 — 구절은 FINAL 에서. 살아 있는 페이지(달력 · 목표금리 이력 · 재무부 금리 · EIA 시리즈)와 날짜 없는 글(CME-2)의 `published_at` 은 아는 만큼만(해 · 달) 적었다 → 그 출처에만 선 사실 4개는 공개 시점이 증명되지 않는다 (`FACT_PUBLIC_UNPROVEN`). `ingested_at` 은 브리프 것 2026-09-18 · C-3 것 2026-10-09
10. **시간 조각 7개를 새로 적었다** (전부 VOLATILE · 숙련 3 · 5장) — C-5 가 "사실 ID 가 없어 못 적었다 (_open)"고 남긴 것. 개전일 입력 값을 2026-02-28 로 (물음 e-3)
11. **스토리라인 `SL-iran-war` 버전 1.** `created_at` 을 발행일(2026-09-16)로 적었다 — 발행 때 고정한 판이다. `ongoing: true`. 발행 뒤의 전개는 붙이지 않았다
12. **버린 것** — concept span 의 끊긴 연결 1개(숙련 4장 C-0005 REFRESHER 의 F02 · 계약 §18 대로) · `_attribution_refs` 2 · 인용 블록의 F32 (서지가 대신한다 · §10.1)
13. **옮기지 않은 것** — Coverage 15 슬롯 → SlotCheck (브리프 표에 슬롯을 채운 사실이 없다) · SourceDocument · SourceRegistry (실물 없음) · FTC · 스크루웜 브리프
14. **검사에 더한 것** — 원천 대조(`BRIEF_TEXT` · `BRIEF_MISSING` · `PASSAGE_NOT_IN_RECORD`) · 저장소 모양을 계약 타입 블록에서 읽어 대조(`STORE_SHAPE` — 계약에서 칸을 지우면 저장소가 걸린다) · 한 판에 한 버전(`CONCEPT_VERSION_MIXED`) · 브리지 버전 = 패키지 버전 · 공개 시점을 "뒤다"와 "증명 못 함"으로 가름 · 인용을 "원문이 하나가 아니다"와 "위치가 없다"로 가름 · 옛 문자열 ref 는 실패
15. **계약 글에 더한 문장** — "패키지가 닿는 Fact"의 뜻 (DATA_MODEL §14) · 반증 답과 불변식 11 (§7.3) · "한 패키지 안에서 한 개념은 한 버전" (CONCEPT_IDENTITY 불변식 12 — OBSERVATION §4.2 가 기대던 것) · D26 주석 (ARTICLE_PACKAGE §5). 타입은 하나도 안 바꿨다
16. **읽기 목록 밖을 읽은 곳** — `golden-correction-2026-10.md` 의 §1 · §2 · §5 와 "2차" §1 · §2 (반증 기록과 N1 ~ N5 가 거기에만 있다) · OBSERVATION §4.2 · §6 · §9 (물음 c · d · f)

### 틀린 곳 · 관찰 — 고치지 않았다 (독자 글 · 문안 0자)

- **입문 5장 제목이 비유를 개념보다 먼저 낸다** — "금리는 그 차의 브레이크예요"(C-0001 비유) 다음에 FULL 이 온다. FINDINGS §4.4 "개념을 먼저, 비유는 뒤에". 앞 장의 속도계를 잇는 말이라 읽히기는 한다. C-0001 비유에는 `requires` 가 없어 기계는 보지 않는다 — 게이트 3
- **DC-F 물음 2 의 답이 낡았다** — "7월 근원 3.3 하나뿐. 6월 · 8월 수치 없음"은 C-5 1차의 기록이고, 그 뒤 C-3b 가 6 ~ 8월 CPI 를 모았다(F46 · F47 · F41). 로그 그대로 옮겼다
- **F13 의 `claim_text` 는 브리프의 틀린 말 그대로다** — "2027년에 추가 인상을 찍은 dot은 8개뿐" (C-3 D-4 [다름]). 골든 글은 C-5 가 고쳤다("2027년 말 금리를 4.1%보다 높게 본 참가자는 18명 중 8명"). 독자가 근거를 누르면 옛 말이 나온다. F09 "노동력 증가" · F35 · F37b "회의 당일"도 같다 — 전부 `_c3` 주석이 달려 있다. 발행 전이라 고칠 수 있는 사실이지만(§2.3) 이번 지시는 "옮기기만"이다 → 사실 교정을 누가 하나 (PM)
- **입문 4장 "지금 미국은 3%대"의 근거 사실** — 브리지의 `facts` 는 골든이 달고 있던 F31(근원 PCE 3.3) · F10 그대로다. C-5 2차: 전체 CPI 3.4 · 전체 PCE 3.7 · 근원 PCE 3.3 어느 것으로도 맞고 식품 · 에너지 제외 CPI(2.4)로만 2%대다
- `lint-concepts.py` 1 hit — C-0002 속도계 "지금 오르는 속도고". 이전 전과 같다 (줄 번호만 L77 → L79)
- `_refs_pending` 의 `until` 은 여전히 `"0.2"` 만 받는다 (ARTICLE_PACKAGE §6.2 글자). 대기가 0 이라 쓰는 곳이 없다. 다음 교정에서 대기가 생기면 이 값이 뜻을 잃는다

### 넘길 것

| 누구 | 무엇 |
|---|---|
| 0.2m-b | OBSERVATION §4.2 표의 `C-0003` 줄 → `C-0012` (검사 FAIL) · Replacement 6건의 concept_id |
| PM | _open-m1 ~ m8 (DATA_MODEL §19 · CONCEPT_IDENTITY §17) · 판단 1 ~ 7 · D18 의 전제 · 브리프를 고칠지 · 저장소 사실의 교정을 누가 하나 · e2e lab/a |
| 프론트 (F-2b) | `Ref` 타입이 유니언이 됐다 (쓰는 곳 없음). 층 설명에서 근거를 펼치려면 `fixtures/store.json` · `concept-library.json` 에서 푼다. `logs/frontend` 의 그림은 여전히 C-5 이전 골든의 글이다 |
| 파이프라인 | 원문 위치 50 · 공개 시점 증명 4 · 인용 위치 2. 저장소의 `_passage` 69개가 첫 일감이다 — 문서를 저장하고 그 구절을 찾아 `span_start` · `span_end` 를 채운다 |

### 하지 않은 것
- 독자 글 · 개념 문안 수정 (0자 — 대조 출력 아래)
- OBSERVATION.md · `logs/correction-log.csv` · `scripts/verify-observation.py` · `selftest-verify-observation.py`
- 브리프 · 스토리라인 문서 · 콘텐츠 로그 수정
- apps/web (바뀐 파일 0) · lab · 디자인
- 금지 항목 — 가중치 · 임계값 · 추정기 · 리뷰 큐. 계약에 숫자 문턱을 넣지 않았다 (검사 A 가 본다)
- 타입 추가 · 변경 — _open-m6 ~ m8 의 칸은 만들지 않았다

---

## 검증 — 출력

### 독자 글 · 문안이 안 바뀌었다

```
$ python3 scripts/compare-reader-text.py --before 409dc05      # 이전 전후, 허용된 차이 없이
이전 전 git 409dc05:fixtures/fomc-2026-09.article.json → 이전 후 fixtures/fomc-2026-09.article.json  (허용된 차이 없음)
  독자 글 단위 117개 · 3378자 · span 127개(경계 · 층) · 블록 text 28개 대조

OK — 차이 0
```

```
$ python3 scripts/compare-reader-text.py                       # 옛 골든(c46871d) 대비 — 등록된 29건 말고는 0
옛 골든 c46871d → 새 골든 fixtures/fomc-2026-09.article.json
  레벨 2 · 슬라이드 14 · 독자 글 단위 115개 · 3294자 대조
  허용된 차이 29/29건 (그 밖의 차이는 전부 실패):
    … (허용된 차이 29건의 목록 — 이전 전과 같다. 생략)
    advanced[4] blocks/1 p0: '인상을 둘러싼 내부 긴장이\n전망에서 실제 행동으로 옮겨왔다는 점' → '인상 의견이\n소수의견에서 실제 결정으로 옮겨왔다는 점'  (C-5 · D29 도윤 승인 2026-10-09 · logs/content/golden-correction-2026-10.md P24 A — DC-A 가 말하는 것으로 좁힘 (F29 는 1차 대조 안 됨))
  계약이 버리는 것 (대조 밖): end_actions 2개 · teaser 기호 · 눈금 · modifier · style

OK — 등록 안 된 차이 0 (허용된 차이 밖의 독자 글 불변)
```

```
$ python3 scripts/compare-concept-text.py                      # 라이브러리: 이전 전 md ↔ 저장소 ↔ 지금 md (sha256 앞 10자)
옛 글  git f8f6dce:docs/content/concept-library.md — 44 단위
새 글  docs/content/concept-library.json — 44 단위 · 지금 md — 44 단위

  = C-0001 ANALOGY:브레이크 페달    69자  d519b6cb81  d519b6cb81  d519b6cb81
  = C-0001 FULL              121자  732b2dd83a  732b2dd83a  732b2dd83a
  = C-0001 PROPOSITION        41자  e59d82d804  e59d82d804  e59d82d804
  = C-0001 REFRESHER          48자  bbddf92dd5  bbddf92dd5  bbddf92dd5
  = C-0002 ANALOGY:속도계        57자  1155a5aa29  1155a5aa29  1155a5aa29
  = C-0002 FULL:①             88자  487a593c4a  487a593c4a  487a593c4a
  = C-0002 FULL:②             72자  188d2466e2  188d2466e2  188d2466e2
  = C-0002 FULL:③             63자  d95e47cc5a  d95e47cc5a  d95e47cc5a
  = C-0002 PROPOSITION        43자  dd40570b3c  dd40570b3c  dd40570b3c
  = C-0002 REFRESHER          32자  eab192d414  eab192d414  eab192d414
  = C-0003 FULL              105자  d213d0c877  d213d0c877  d213d0c877
  = C-0003 PROPOSITION        51자  7f3d9d042a  7f3d9d042a  7f3d9d042a
  = C-0003 REFRESHER          44자  51d637c756  51d637c756  51d637c756
  = C-0004 FULL               80자  413f311779  413f311779  413f311779
  = C-0004 PROPOSITION        29자  3ffa801842  3ffa801842  3ffa801842
  = C-0004 REFRESHER          26자  9033270bb3  9033270bb3  9033270bb3
  = C-0005 FULL              150자  ebac5efe20  ebac5efe20  ebac5efe20
  = C-0005 PROPOSITION        46자  5ce9377afb  5ce9377afb  5ce9377afb
  = C-0005 REFRESHER          58자  fb3e31ac14  fb3e31ac14  fb3e31ac14
  = C-0006 FULL               95자  821d7f8243  821d7f8243  821d7f8243
  = C-0006 PROPOSITION        39자  5b6baebb3d  5b6baebb3d  5b6baebb3d
  = C-0006 REFRESHER          29자  398bf894ae  398bf894ae  398bf894ae
  = C-0007 FULL              110자  e8d49ac804  e8d49ac804  e8d49ac804
  = C-0007 PROPOSITION        41자  a9d9dfce10  a9d9dfce10  a9d9dfce10
  = C-0007 REFRESHER          28자  289f310a86  289f310a86  289f310a86
  = C-0008 FULL              135자  14aac3b499  14aac3b499  14aac3b499
  = C-0008 PROPOSITION        64자  1be8b021a8  1be8b021a8  1be8b021a8
  = C-0008 REFRESHER          68자  f48a440648  f48a440648  f48a440648
  = C-0009 FULL               79자  fda4580a81  fda4580a81  fda4580a81
  = C-0009 PROPOSITION        40자  3cbfb18f52  3cbfb18f52  3cbfb18f52
  = C-0009 REFRESHER          42자  223439b781  223439b781  223439b781
  = C-0010 BOUNDARY           73자  3d76439515  3d76439515  3d76439515
  = C-0010 FULL               76자  675a2a585c  675a2a585c  675a2a585c
  = C-0010 PROPOSITION        64자  4d4e366887  4d4e366887  4d4e366887
  = C-0010 REFRESHER          35자  0233edbc05  0233edbc05  0233edbc05
  = C-0011 FULL              122자  6fc48dd7c7  6fc48dd7c7  6fc48dd7c7
  = C-0011 PROPOSITION        31자  a1d75005f8  a1d75005f8  a1d75005f8
  = C-0011 REFRESHER          38자  8f05692065  8f05692065  8f05692065
  = C-0012 FULL               45자  1798c9f8a1  1798c9f8a1  1798c9f8a1
  = C-0012 PROPOSITION        18자  a61058293f  a61058293f  a61058293f
  = C-0012 REFRESHER          17자  7253539922  7253539922  7253539922
  = C-0013 FULL               88자  2a6b1e6c1f  2a6b1e6c1f  2a6b1e6c1f
  = C-0013 PROPOSITION        36자  a7e6aca412  a7e6aca412  a7e6aca412
  = C-0013 REFRESHER          25자  744799ce04  744799ce04  744799ce04

OK — 44 단위 · 2661자 · 다른 것 0
```

### 검사

```
$ python3 scripts/verify-article.py
PASS  골든 한 벌 — fixtures/fomc-2026-09.article.json · fixtures/fomc-2026-09.record.json · fixtures/store.json
   대기 span 0
PASS  fixtures/invalid/derived-from-volatile.json  — fomc-2026-09.record.json 를 갈아 끼움 · 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic slides/6/blocks/1/paragraphs/1/body "3주 뒤에": 입력 ['minutes'] 의 사실이 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/authoring/time_expressions/5/inputs/0/fact']
PASS  fixtures/invalid/ref-label-not-uuid.json  — fomc-2026-09.article.json 를 갈아 끼움 · 거부 기대 REF_SHAPE
   검출: ['REF_SHAPE']
   REF_SHAPE: basic[0]/headline/0: fact 층의 Ref 'F01' 가 UUID 가 아니다 — label · code 는 참조에 쓰지 않는다 (DATA_MODEL §2.1)
   골든과 다른 곳 1군데: ['/levels/0/slides/0/headline/0/refs/0']
PASS  fixtures/invalid/volatile-missing-asof.json  — store.json 를 갈아 끼움 · 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic slides/3/blocks/0/paragraphs/1/body "지금 미국은 3%대": 사실 F31 이 VOLATILE 인데 as_of 가 없다 (D8 · DATA_MODEL §6.2)
   VOLATILE_MISSING_AS_OF: basic slides/3/blocks/1/items/1/value "3%대": 사실 F31 이 VOLATILE 인데 as_of 가 없다 (D8 · DATA_MODEL §6.2)
   VOLATILE_MISSING_AS_OF: advanced slides/1/blocks/0/paragraphs/0/body "7월 근원 PCE는 전년 대비 3.3%": 사실 F31 이 VOLATILE 인데 as_of 가 없다 (D8 · DATA_MODEL §6.2)
   골든과 다른 곳 1군데: ['/facts/29/as_of']

OK
```

```
$ python3 scripts/verify-article.py --report | sed -n 1,3p
PASS  골든 한 벌 — fixtures/fomc-2026-09.article.json · fixtures/fomc-2026-09.record.json · fixtures/store.json
   대기 span 0
  층별 span 수: {'bridge': 2, 'claim': 30, 'concept': 21, 'fact': 68, 'writing': 6} (합 127)
```

```
$ python3 scripts/verify-contract-coverage.py
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

```
$ python3 scripts/verify-concept-identity.py
verify-concept-identity
  계약   docs/contract/CONCEPT_IDENTITY.md
  실물   docs/content/concept-library.md — 개념 13 · CHANGELOG 버전 10건
         docs/content/concept-library.json — 개념 13 (UUID) · 버전 문안 13벌 · alias 31 · 충돌 별칭 1 · 관계 9
         독자 글 md ↔ 저장소 — 44 단위 중 글자까지 같은 것 44
         fixtures/fomc-2026-09.article.json — 문안 그대로 16 span · 문안 아님 5 span (concept 층)
         concept refs — ConceptRef 22 (part null 5) · "C-XXXX" 0

  WARN  LIB_USED_IN_DRIFT: C-0004: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  LIB_USED_IN_DRIFT: C-0006: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)

OK
```

```
$ python3 scripts/verify-data-model.py --report
verify-data-model
  계약   docs/contract/DATA_MODEL.md
  원천   브리프 3 — 사실 타입 30종 · FOMC 사실 38 · 1차 구절 기록 3 파일
  저장소 fixtures/store.json — Fact 62 (브리프에서 39 · 새로 23) · FactSource 78 (1차 구절 69) · Source 31 · DerivedClaim 10 · Bridge 1 · Event 1 · Storyline 1
  골든   대기 span 0 · 시간 조각 30 ({'DERIVED': 17, 'VOLATILE': 13}) · 인용 2 · 스토리라인 핀 1 · 저작 메모 25
  발행 검사에서 막히는 것 61 — 독자에게 닿는 것 5 · 기계 검증용 56
         CLAIM_UNCHECKED 2 · FACT_NOT_YET_PUBLIC 2 · FACT_NO_PRIMARY 1 · FACT_NO_SOURCE_SPAN 50 · FACT_PUBLIC_UNPROVEN 4 · QUOTE_SPAN_MISSING 2

골든 대기 span 0 — 실물에서 센다 (불변식 25)

인용 (§10.1) — 출처 표시 · body 사실
  basic 6장 blocks/1  "8월 말 · 의장 연설"  body ['F33']
  advanced 2장 blocks/1  "8/28 잭슨홀"  body ['F33']

게이트 3 후보 — 본문 따옴표 (§10.2)
  basic 3장 concept ['(개념)']  '“라면이 2000원이다”는 그냥 가격입니다.'
  basic 3장 concept ['(개념)']  '“라면값이 작년보다 5% 올랐다”는 오르는 속도예요.'
  basic 6장 claim   ['DC-C']  '연준이 던진 질문은 “물가가 나빠졌는가”가 아니었습니다.'

게이트 3 후보 — OFFICIAL_CLAIM 사실만 가리키는 fact span 24 (§3.4 — 주장한 쪽을 글이 밝히나)
  basic 6장 ['F33']  '기저 물가가 목표를 향해 분명하게, 충분히 빠른 속도로 가고 있다는 확신이 있어야 한다.'
  basic 6장 ['F33']  '그렇지 않다면 아직 할 일이 남아 있는 것이다.'
  basic 9장 ['F12']  '위원들 대부분이 올해 안에 한 번 더 올릴 수 있다고 봤습니다.'
  basic 9장 ['F11']  '다만 연준이 함께 내놓은 전망에서 올해 말 금리와 내년 말 금리는 같은 수준이에요.'
  basic 9장 ['F54']  '참고로 연준 자신도 물가가 2%로 돌아오는 건 2029년으로 보고 있어요.'
  advanced 2장 ['F33']  '기저 물가가 목표를 향해 분명하게, 충분히 빠른 속도로 가고 있다는 확신이 있어야 한다.'
  advanced 2장 ['F24', 'F32a']  '의장은 여름 지표가 기저 흐름의 의미 있는 개선을 보여주지는 않는다고 평가했습니다.'
  advanced 2장 ['F16']  '9월 전망에서 올해 근원 PCE는 오히려 3.3% → 3.4%로 올라갔고요.'
  advanced 3장 ['F32a', 'F33']  '8/28'
  advanced 3장 ['F33']  '잭슨홀 — 의장이 기준을 명시'
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
  advanced 4장 ['F11', 'F13']  '2027년 말 금리를 4.1%보다 높게 본 참가자는 18명 중 8명, 4명은 오히려 인하를'
  advanced 5장 ['F07']  '성명문도 지정학적 전개로 인한 불확실성을 명시했어요.'

발행 검사에서 막히는 것 — 독자에게 닿는 것: 5
  FACT_NO_PRIMARY 1
    Fact F36: 1차 출처가 없다 (불변식 9 · _open-2)
  FACT_NOT_YET_PUBLIC 2
    Fact F36: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)
    Fact F44: 가장 이른 출처가 발행일 뒤다 (불변식 11 · §5.3)
  CLAIM_UNCHECKED 2
    Claim DC-I: 반증 기록이 없거나 ASSERTED 인데 미결 — 판정이 안 나온다 (§7.3)
    Claim DC-J: 반증 기록이 없거나 ASSERTED 인데 미결 — 판정이 안 나온다 (§7.3)

발행 검사에서 막히는 것 — 기계 검증용 — 파이프라인이 채운다 (D27): 56
  FACT_NO_SOURCE_SPAN 50
    Fact F01: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F02: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F03: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    Fact F04: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)
    … 46개 더
  FACT_PUBLIC_UNPROVEN 4
    Fact F03: 출처의 공개 시점이 발행일 앞인지 증명되지 않는다 — 정밀도가 모자라다 (불변식 11 · §5.2)
    Fact F37b: 출처의 공개 시점이 발행일 앞인지 증명되지 않는다 — 정밀도가 모자라다 (불변식 11 · §5.2)
    Fact F43: 출처의 공개 시점이 발행일 앞인지 증명되지 않는다 — 정밀도가 모자라다 (불변식 11 · §5.2)
    Fact IR06: 출처의 공개 시점이 발행일 앞인지 증명되지 않는다 — 정밀도가 모자라다 (불변식 11 · §5.2)
  QUOTE_SPAN_MISSING 2
    basic 6장 인용: 공통 Source 는 있으나 원문 위치(span)가 없다 — 어느 구간인지 기계가 모른다 (불변식 19)
    advanced 2장 인용: 공통 Source 는 있으나 원문 위치(span)가 없다 — 어느 구간인지 기계가 모른다 (불변식 19)


OK
```

```
$ python3 scripts/lint-concepts.py
lint-concepts  docs/content/concept-library.md
terms  지금 현재 올해 이번   fields  FULL REFRESHER ANALOGY

coverage
  C-0001 RATE_TO_SPENDING           FULL REFRESHER ANALOGY
  C-0002 INFLATION_LEVEL_VS_RATE    FULL REFRESHER ANALOGY
  C-0003 CB_INFLATION_TARGET        FULL REFRESHER
  C-0004 FOMC_ROLE                  FULL REFRESHER
  C-0005 VOTERS_VS_PARTICIPANTS     FULL REFRESHER
  C-0006 SEP_ROLE                   FULL REFRESHER
  C-0011 INFLATION_FALLING_VS_AT_TARGET FULL REFRESHER
  C-0012 FED_INFLATION_TARGET_2PCT  FULL REFRESHER
  C-0007 AGENCY_AUTHORITY_LIMIT     FULL REFRESHER
  C-0008 POLICY_STATEMENT_VS_RULE   FULL REFRESHER
  C-0009 FEDERAL_VS_STATE           FULL REFRESHER
  C-0010 PERSONALIZED_PRICING       FULL REFRESHER
  C-0013 STATE_STRICTER_THAN_FEDERAL FULL REFRESHER
  13 concepts · 28 fields

hits
  C-0002 ANALOGY   L81   지금  계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
  1 hits
```

```
$ python3 scripts/verify-observation.py | tail -8        # 0.2m-b 의 검사 — 위 "먼저 볼 것" 1
  골든   advanced block_decisions — C-0001@1 SKIP · C-0002@4 SKIP · C-0005@3 REFRESHER · C-0012@1 SKIP
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 13 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']

  WARN  CORR_DRAFT: 42행의 gate · occasion · targets · caught_by 가 초안이다 — 사람이 확인한다 (`_draft`)
  WARN  REPL_PENDING: Replacement 6건이 concept_id 대기 — 0.2m-a 가 라이브러리에 UUID 를 발급한 뒤 채운다 (`_pending`)
FAIL CONTRACT_REAL_MISMATCH: §4.2 골든 표 {'C-0001': ('FULL', 'SKIP'), 'C-0002': ('FULL', 'SKIP'), 'C-0003': ('SKIP', 'SKIP'), 'C-0005': ('SKIP', 'REFRESHER')} ≠ 골든에서 계산 {'C-0001': ('FULL', 'SKIP'), 'C-0002': ('FULL', 'SKIP'), 'C-0005': ('SKIP', 'REFRESHER'), 'C-0012': ('SKIP', 'SKIP')}
1개 실패
```

### 프론트

```
$ pnpm -s typecheck
$ pnpm -r typecheck
Scope: 3 of 4 workspace projects
packages/contract typecheck$ tsc -p .
packages/contract typecheck: Done
apps/web typecheck$ tsc -p .
apps/web typecheck: Done
```

```
$ pnpm -s test        # 요약 줄만. logs/frontend 의 그림 116개가 바뀌어 되돌렸다 (git checkout -- logs/frontend)
packages/contract test:  Test Files  1 passed (1)
packages/contract test:       Tests  15 passed (15)
apps/web test:   lab/a basic: 쓸기 20번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/a advanced: 쓸기 12번 · 독자 글 단위 53/55 을 화면 안에서 봄 · 못 본 것: 12-0 인상 | 2. 고용 숫자는 한 달로 읽기 어렵습니다.
apps/web test:   ✘  44 e2e/lab-read.spec.ts:12:5 › lab/a 숙련 — 375×667 에서 끝까지 읽힌다 (14.3s)
apps/web test:   lab/b basic: 쓸기 17번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/b advanced: 쓸기 12번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:   lab/b2 basic: 쓸기 17번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/b2 advanced: 쓸기 12번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:   lab/b3 basic: 쓸기 22번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/b3 advanced: 쓸기 13번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:   lab/b4 basic: 쓸기 22번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/b4 advanced: 쓸기 13번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:   lab/b5 basic: 쓸기 22번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/b5 advanced: 쓸기 14번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:   lab/c basic: 쓸기 16번 · 독자 글 단위 62/62 을 화면 안에서 봄
apps/web test:   lab/c advanced: 쓸기 11번 · 독자 글 단위 55/55 을 화면 안에서 봄
apps/web test:       49 |       console.log(`  lab/${dir} ${lv.id}: 쓸기 ${swipes}번 · 독자 글 단위 ${seen}/${total} 을 화면 안에서 봄${missing.length ? " · 못 본 것: " + missing.join(" | ") : ""}`);
apps/web test:   1 failed
apps/web test:   77 passed (5.2m)
[ELIFECYCLE] Test failed. See above for more details.
```

같은 테스트를 이전 전 골든으로 (패키지 파일과 `packages/contract/src` 를 `409dc05` 로 잠깐 되돌려 돌린 뒤 복구):
```
$ cd apps/web && npx playwright test e2e/lab-read.spec.ts -g "lab/a 숙련"
  1 failed
    e2e/lab-read.spec.ts:12:5 › lab/a 숙련 — 375×667 에서 끝까지 읽힌다
```

### 망가뜨린 사본 — 새 검사가 진짜 실패하는가

실제 파일을 한 군데씩 고쳐 돌리고 되돌렸다 (끝에 `git status` 로 확인). 9번은 **못 잡는 것**이다 — `part: null` 인 언급이 어느 개념을 가리키는지는 사람이 본다.
```
$ bash broken.sh
# 1) 저장소의 브리프 사실 한 글자 (F01 "3.75~4.00%" → "3.75~4.0%")
  ERROR BRIEF_TEXT: F01: claim_text 가 브리프와 다르다 — 브리프는 원천이다. 옮기기만 한다
         브리프 'FOMC가 목표범위를 25bp 올려 3.75~4.00%로 인상'
         저장소 'FOMC가 목표범위를 25bp 올려 3.75~4.0%로 인상'
FAIL

# 2) 저장소의 1차 구절 한 낱말 ("12 – 0 vote" → "12 – 0 decision")
  ERROR PASSAGE_NOT_IN_RECORD: F02: 1차 구절이 기록(C-3 · 스토리라인 문서)에 글자 그대로 없다 — 'by a 12 – 0 decision'
FAIL

# 3) 개념 저장소의 독자 글 한 글자 (C-0002 FULL ③ "딱 2%예요" → "꼭 2%예요")
  ERROR STORE_TEXT: C-0002 FULL:③: 저장소의 글이 md 와 다르다 — md '연준은 이 속도가 1년에 **2%** 정도면 적당하다고 봅니다. 아예 안 오르는 것도 원하지 않고, 딱 2 / 저장소 '연준은 이 속도가 1년에 **2%** 정도면 적당하다고 봅니다. 아예 안 오르는 것도 원하지 않고, 꼭 2
FAIL
  ≠ C-0002 FULL:③             63자  d95e47cc5a  217dfd3216  d95e47cc5a
FAIL — 44 단위 · 2661자 · 다른 것 1

# 4) md 의 문안만 고치고 저장소에 새 버전을 안 만듦 (C-0004 REFRESHER "기구" → "회의")
  ERROR STORE_TEXT: C-0004 REFRESHER: 저장소의 글이 md 와 다르다 — md 'FOMC는 연준에서 금리를 결정하는 회의입니다.' / 저장소 'FOMC는 연준에서 금리를 결정하는 기구입니다.'
FAIL

# 5) 골든의 독자 글 한 글자 (입문 1장 "올렸어요" → "올렸습니다") — 참조는 그대로
  FAIL basic[0] headline: [replace] 옛 '어요' → 새 '습니다'  (옛 16~18, 새 16~19)
  FAIL span 경계 · 층이 다르다 — 127 → 127 span, 첫 차이 [(('basic/slides/0/headline/0', '미국이 3년 만에\n금리를 올렸어요', 'fact'), ('basic/slides/0/headline/0', '미국이 3년 만에\n금리를 올렸습니다', 'fact'))]

2건 실패

# 6) 골든의 ③ span 하나를 C-0002@3 으로 (D32 는 @4 에 고정)
  ERROR CONCEPT_VERSION_MIXED: C-0002: 한 패키지가 버전 [3, 4] 를 섞어 가리킨다 — 한 판 안에서 한 개념은 한 버전
FAIL
  WARN  GOLD_PART_OLD: basic slides/3/blocks/0/paragraphs/0/body/0: C-0002@3 part FULL:③ — 옛 버전 문안이 저장소에 없어 part 를 확인하지 못했다 (§14)
OK

# 7) 골든의 C-0002 참조를 전부 @3 으로 (브리지는 @4)
  ERROR BRIDGE_CONCEPT: Bridge C-0002 ④: C-0002@4 의 슬롯을 채운다는데 패키지는 C-0002@[3] 를 가리킨다 — 같은 버전이어야 한다 (§8.2)
FAIL

# 8) ③ 다음의 브리지 두 span 을 writing 으로 (④ 가 사라진다)
  ERROR GOLD_BRIDGE_ORDER: basic slides/3/blocks/0/paragraphs/0/body/1: C-0002 ③ 바로 다음이 브리지 ④ 가 아니라 writing "그런데 지금 미국은 3%대입니다. "
  ERROR GOLD_ANALOGY_ORDER: basic slides/3/blocks/0/paragraphs/2/body/0: C-0002 비유가 ③ + 브리지 ④ 보다 먼저
  ERROR GOLD_ANALOGY_ORDER: basic slides/3/blocks/0/paragraphs/2/body/1: C-0002 비유가 ③ + 브리지 ④ 보다 먼저
FAIL

# 9) 입문 4장 대조표의 참조를 다시 C-0003 으로 (D32 는 C-0012) — 개념은 있으니 기계는 통과시킨다
PASS  골든 한 벌 — fixtures/fomc-2026-09.article.json · fixtures/fomc-2026-09.record.json · fixtures/store.json
OK
OK
```

```
$ python3 scripts/selftest-verify-data-model.py
PASS  원본 (계약 · 로그 · 골든 한 벌 · 모델) → 통과
PASS  가짜 재료로 다 채운 사본 — 발행 검사 → 통과
PASS  [contract] D30 — ArticleRecord.article_id 삭제 → ['CONTRACT_FIELD', 'STORE_SHAPE']
PASS  [contract] §5.4 — Fact.as_of 삭제 → ['CONTRACT_FIELD', 'STORE_SHAPE']
PASS  [contract] §5.5 — FactSource.span_start 삭제 → ['CONTRACT_FIELD', 'STORE_SHAPE']
PASS  [contract] §5.3 — Source.ingested_at 삭제 → ['CONTRACT_FIELD', 'STORE_SHAPE']
PASS  [contract] §5.1 — SourceRegistry.can_quote 삭제 → ['CONTRACT_FIELD']
PASS  [contract] §5.2 — FactType 에 BACKGROUND 추가 (D27 이 닫은 7값을 연다) → ['CONTRACT_ENUM']
PASS  [contract] §5.2 — FactType 에서 OFFICIAL_LIMIT 삭제 → ['CONTRACT_ENUM']
PASS  [contract] D8 — TimeExpression.class 에 STABLE 추가 → ['CONTRACT_ENUM']
PASS  [contract] D8 — Fact.volatility 에 DERIVED 추가 → ['CONTRACT_ENUM']
PASS  [contract] §6.2 — SlotCheck.status 에서 STORYLINE_STALE 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §4.1 — Bridge.bridge_type 에서 STORY_BRIDGE 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §5.1 — Source.kind 에서 SECONDARY 삭제 → ['CONTRACT_ENUM']
PASS  [contract] D27 — Event.code 삭제 (사람이 부르는 이름이 없다) → ['CONTRACT_FIELD', 'STORE_SHAPE']
PASS  [contract] D27 — EventId 를 다시 문자열로 (초안의 추천) → ['CONTRACT_FIELD']
PASS  [contract] D27 — §3.3 에 _open-1 표시가 다시 들어옴 → ['CONTRACT_OPEN_LEFT', 'CONTRACT_TYPE_MAP']
PASS  [contract] D27 — §16 의 _open-2 행에서 "판정됨" 삭제 → ['CONTRACT_OPEN_LEFT']
PASS  [contract] §9.6 — 계약에 posterior → ['CONTRACT_HELD_TERM']
PASS  [contract] §9.6 — 계약에 half-life → ['CONTRACT_HELD_TERM']
PASS  [contract] 0.2a 침범 — 타입 블록에 Concept 정의 → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] 0.2c 침범 — 타입 블록에 KnowledgeEvidence 정의 → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] D24 — §4.4 권리 절에서 "실물 없음" 전부 삭제 → ['CONTRACT_NO_REAL']
PASS  [contract] D24 — §9.2 Storyline 절에서 "실물 없음" 전부 삭제 → ['CONTRACT_NO_REAL']
PASS  [contract] §3.3 — SELF_LIMIT 행 삭제 (브리프 타입이 표 밖) → ['CONTRACT_TYPE_MAP']
PASS  [contract] §3.3 — PROJECTION 을 FORECAST 로 (7값도 표시도 아님) → ['CONTRACT_TYPE_MAP']
PASS  [contract] §6.4 — year_of 행 삭제 (골든이 쓰는 op) → ['CONTRACT_OP']
PASS  [contract] CHANGELOG — B-0.2b 행 전부 삭제 → ['CONTRACT_CHANGELOG']
PASS  [log] 로그 — 질문 10 행 삭제 → ['LOG_QUESTION']
PASS  [log] 로그 — 질문 4 행의 표시 지움 → ['LOG_QUESTION']
PASS  [bundle] R-1 — published_at 에 시각 → ['GOLD_PUBLISHED_AT_SHAPE', 'PUBLISHED_AT_SHAPE']
PASS  [bundle] 원천 — 브리프 사실 F01 의 글자를 고침 (3.75~4.00% → 3.75~4.0%) → ['BRIEF_TEXT']
PASS  [bundle] 원천 — 브리프의 틀린 숫자를 저장소에서 슬쩍 고침 (F36 90% → 60%) → ['BRIEF_TEXT']
PASS  [bundle] 원천 — 나눈 사실 F32a 를 다듬어 씀 (말하며 → 말함) → ['BRIEF_TEXT']
PASS  [bundle] 원천 — 브리프 사실 F38 을 저장소에서 뺌 (골든이 안 쓴다고 버리지 않는다) → ['BRIEF_MISSING']
PASS  [bundle] 원천 — 나누고 남은 절(F32 뒷부분)의 기록을 지움 → ['BRIEF_MISSING']
PASS  [bundle] 원천 — 1차 구절을 고쳐 씀 (기록에 없는 글) → ['PASSAGE_NOT_IN_RECORD']
PASS  [bundle] 원천 — 1차 구절을 지어냄 → ['PASSAGE_NOT_IN_RECORD']
PASS  [bundle] §1 — Fact 에 계약에 없는 필드 (source) → ['STORE_SHAPE']
PASS  [bundle] §1 — Fact 에서 actor 삭제 → ['STORE_SHAPE']
PASS  [bundle] §6.3 — 시간 조각에 옛 필드 where → ['STORE_SHAPE']
PASS  [bundle] §6.2 — as_of 를 시간 조각에 다시 적음 (사실의 속성이다) → ['STORE_SHAPE']
PASS  [bundle] §11 — record 에 article_id 가 없다 → ['STORE_SHAPE']
PASS  [bundle] 불변식 25 — 대기 need 가 어휘 밖 ("나중에") → ['GOLD_PENDING_NEED']
PASS  [bundle] 불변식 25 — fact span 의 대기 need 가 Bridge (층과 안 맞는다) → ['GOLD_PENDING_NEED']
PASS  [bundle] 빈틈 — 채워진 span 하나를 다시 대기로 돌림. 계약 글과 대조하지 않으므로 FAIL 이 아니다 — 대기 수가 늘 뿐 (_open-m1) → 통과  빈틈
PASS  [model] 불변식 26 — ArticleRecord 의 article_id 가 code 문자열 → ['RECORD_KEY']
PASS  [model] 불변식 26 — ArticleRecord 에 article_version 이 없다 → ['RECORD_KEY']
PASS  [model] 불변식 4 — F01 fact_type 을 브리프 타입 POLICY_ACTION 그대로 → ['FACT_TYPE']
PASS  [model] 불변식 5 — OFFICIAL_CLAIM F24 의 actor 삭제 → ['FACT_ACTOR']
PASS  [model] 불변식 6 — VOLATILE F31 의 as_of 삭제 → ['FACT_AS_OF']
PASS  [model] 불변식 6 — STABLE F01 에 as_of → ['FACT_AS_OF']
PASS  [model] §6.1 — F11 을 Fact 에서 DERIVED 로 (D8 가정) → 그 사실로 계산한 "올해" 조각도 걸린다 → ['DERIVED_FROM_VOLATILE', 'FACT_VOLATILITY']
PASS  [model] 불변식 7 — F37 이 사건 · 스토리라인 둘 다 소유 → ['FACT_OWNER']
PASS  [model] 불변식 7 — F37 이 없는 스토리라인 버전 2 에 붙음 → ['FACT_OWNER']
PASS  [model] 불변식 1 — 한 사건 안에 label F01 이 둘 → ['LABEL_DUP']
PASS  [model] 불변식 1 — Claim 키가 Fact 키와 같다 → ['KEY_DUP']
PASS  [model] D27 — 패키지 event_ref 가 code 문자열 ("FOMC-20260916") — 브리지의 사건과도 어긋난다 → ['BRIDGE_EVENT', 'EVENT_REF']
PASS  [model] D27 — 두 사건이 같은 code → ['CODE_DUP']
PASS  [model] 불변식 1 — Event 의 키가 code 문자열 → ['KEY_SHAPE']
PASS  [model] 불변식 14 — 스토리라인 버전 2 인데 버전 줄은 1 뿐 → ['STORYLINE_VERSION']
PASS  [model] 불변식 15 — 시간 조각 "올해 말 금리" → "올해" (그 글에 두 번) → ['TE_LOCATOR']
PASS  [model] 불변식 16 — VOLATILE 조각의 사실을 지움 → ['TE_VOLATILE_FACTS']
PASS  [model] §6.4 — op 를 decades 로 → ['TE_OP']
PASS  [model] 불변식 2 — fact span 에 ClaimRef → ['REF_UNRESOLVED']
PASS  [model] 불변식 2 — claim span 에 FactRef (층 섞기) → ['REF_UNRESOLVED']
PASS  [model] 불변식 2 — concept span 에 "C-0002" 문자열 → ['REF_UNRESOLVED']
PASS  [model] CONCEPT_IDENTITY 불변식 12 — ③ span 하나만 C-0002@3 으로 (한 판에 두 버전) → ['CONCEPT_VERSION_MIXED']
PASS  [model] §8.2 — 패키지의 C-0002 참조를 전부 @3 으로, 브리지는 @4 그대로 (D32 는 @4 에 고정) → ['BRIDGE_CONCEPT']
PASS  [model] 불변식 22 — DC-C basis 비움 → ['CLAIM_NO_BASIS']
PASS  [model] 불변식 18 — 브리지 facts 비움 (F31 을 품지 않은 브리지) → ['BRIDGE_NO_FACTS']
PASS  [model] 불변식 18 — 브리지 슬롯 ⑤ (C-0002 의 지금 버전에 없다) → ['BRIDGE_CONCEPT', 'BRIDGE_SLOT_ORDER']
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
PASS  [publish] 불변식 9 — F03 출처가 2차뿐 (D27 — 1차 필수) → ['FACT_NO_PRIMARY']
PASS  [publish] 불변식 11 — F28 의 유일한 출처가 발행 뒤 공개 (§5.3 7월 회의록 사례) → ['FACT_NOT_YET_PUBLIC']
PASS  [publish] 불변식 11 — 출처 공개일이 월 정밀도라 증명 못 함 ("2026-09") → ['FACT_PUBLIC_UNPROVEN']
PASS  [publish] 불변식 19 — 인용의 원문은 하나인데 원문 위치가 없다 → ['FACT_NO_SOURCE_SPAN', 'QUOTE_SPAN_MISSING']
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

사본 100개 · OK
```

```
$ python3 scripts/selftest-verify-concept-identity.py     # 기대 · 실제 줄은 뺐다 (전부 같다)
== verify-concept-identity.py — 사본 47개 (+ 원본)
  PASS  망가뜨리지 않은 원본은 통과해야 한다
  PASS  §9.6 — 계약에 posterior 가 들어옴
  PASS  §9.6 — 계약에 half-life
  PASS  §9.6 — Resolver 구간에 수치 (HIGH ≥ 0.85)
  PASS  §9.6 — 관계에 LLM 수치 0.82
  PASS  §9.5 필드 — Concept.merged_into 삭제
  PASS  §9.5 필드 — ConflictingAlias.conflicts_with_meaning 삭제
  PASS  §4.3 — ConceptRef 에서 version 삭제 (버전 고정 없음)
  PASS  D25 — ConceptRef 에서 part 삭제
  PASS  §9.5 enum — status 에 ACTIVE 추가
  PASS  §9.5 enum — relation_type 에서 RELATED 삭제
  PASS  D24 — merge 절에서 "실물 없음" 삭제
  PASS  D24 — Resolver 절에서 "실물 없음" 삭제
  PASS  §9.5 Resolver — AMBIGUOUS 구간 삭제
  PASS  0.2b 침범 — 계약 타입 블록에 Bridge 정의
  PASS  0.2c 침범 — knowledge_evidence 스키마 정의
  PASS  로그 — 질문 5 행의 표시 지움
  PASS  로그 — 질문 8 행 삭제
  PASS  §13-2 — C-0004 를 C-0003 으로 (code 겹침)
  PASS  §13-3 — canonical_name 겹침
  PASS  §13-4 — status ACTIVE
  PASS  §13-5 — C-0002 버전을 하나 올림, CHANGELOG 에 그 버전 없음
  PASS  §13-5 — CHANGELOG 에서 C-0005 v2 줄 삭제 (v2 이력 빠짐)
  PASS  §13-7 — C-0009 REFRESHER 본문 삭제
  PASS  §13-8 — 🔗 슬롯이 없는 단계 뒤 (③ → ⑤ 바로 다음)
  PASS  §13-8 — 🔗 브리지 메모 통째 삭제 → 비유가 없는 ④ 를 요구
  PASS  §13-9 — "dynamic pricing" 을 C-0001 alias 에도 (충돌 표시 없음)
  PASS  §13-9 — 다른 개념의 canonical_name 을 alias 로 (C-0006 에 FOMC_ROLE)
  PASS  §13-9 — C-0010 alias 에서 dynamic pricing 삭제 (충돌 별칭이 붙을 alias 없음)
  PASS  §13-10 — prereq 가 없는 개념 C-0099
  PASS  §13-10 — 선행 순환 (C-0003 → C-0001 추가)
  PASS  §13-12 — 옛 문자열 "C-0002" 를 ref 로 (code 는 참조에 쓰지 않는다)
  PASS  §13-14 — ③ 문안 span 의 refs 를 C-0003 으로
  PASS  §13-14 — C-0001 FULL 문안을 fact 층으로
  PASS  §13-13 — ④ 브리지 두 span 삭제 (③ → 속도계)
  PASS  §13-13 — 속도계를 ④ 앞으로 (문단 순서 바꿈)
  PASS  §13-13 — ③ 과 ④ 사이에 writing span 하나 ("바로 다음" 위반)
  PASS  §13-13 — ④ 브리지 두 span 을 fact 층으로 (브리지가 없다)
  PASS  §13-13 — 속도계를 ③ 앞 장(입문 3장)으로
  PASS  D25 — 게이트 전 빈틈: ③ · 비유를 바꿔 말하고 ④ 지움. part 가 있으니 이제 잡힌다
  PASS  D25 — ③ 만 바꿔 말하고 ④ 지움, 비유도 뺌 (글자 대조로는 아무 단서가 없다)
  PASS  빈틈 — 바꿔 말한 ③ · 비유에 part null 을 달고 ④ 지움. 게이트 3 몫이라 기계는 못 잡는다
  PASS  §13-14 — 글자 그대로인 ③ span 에 part null
  PASS  §13-14 — 글자 그대로인 C-0005 REFRESHER span 에 part "FULL"
  PASS  §13-12 — 그 버전에 없는 part (헤드라인에 "FULL:⑤")
  PASS  §13-12 — 없는 버전 (C-0002 의 지금 버전 + 1)
  PASS  §13-12 — 풀 수 없는 concept_id
  PASS  §3.2 — ConceptRef 에 part 필드가 없다

== 저장소 — 사본 21개
  PASS  망가뜨리지 않은 저장소는 통과해야 한다
  PASS  §13-1 — concept_id 가 code 문자열
  PASS  §13-1 — 두 개념이 같은 concept_id
  PASS  §13-4 — MERGED 인데 merged_into 없음
  PASS  §1 — Concept 에 계약에 없는 필드 (label)
  PASS  §1 — ConceptVersion 에서 basis 삭제
  PASS  §13-15 — used_in 을 저장소에 저장
  PASS  독자 글 — 저장소 C-0002 FULL ③ 한 글자 바꿈 ("딱" → "꼭")
  PASS  독자 글 — 저장소 C-0002 FULL ② 굵게 표시만 뺌
  PASS  독자 글 — 저장소 C-0010 BOUNDARY 극성 뒤집음
  PASS  독자 글 — md 의 C-0001 REFRESHER 를 고치고 저장소에 새 버전을 안 만듦
  PASS  §13-1 — md 의 concept_id 줄을 다른 UUID 로 (두 곳이 어긋남)
  PASS  §13-5 — 저장소 버전만 올림 (문안 한 벌이 없다)
  PASS  §13-5 — 버전 이력에서 C-0005 v2 삭제
  PASS  §13-8 — 슬롯 after 를 ⑤ 로
  PASS  §13-8 — 비유 requires 에서 ④ 를 뺌 (속도계가 브리지 없이도 된다)
  PASS  §13-9 — ConflictingAlias 삭제 (다른 것의 같은 이름이 사라진다)
  PASS  §13-9 — 같은 alias 를 두 개념에 (충돌 표시 없음)
  PASS  §13-10 — 같은 쌍을 거꾸로 한 번 더 (C-0003 → C-0002)
  PASS  §9 — strength 에 값
  PASS  §13-10 — 관계의 끝이 없는 개념
  PASS  §13-10 — 선행 관계 하나를 뺌 (md 의 prereq 줄과 어긋남)

OK
```

```
$ python3 scripts/selftest-verify-article.py              # 기대 · 실제 줄은 뺐다 (전부 같다)
== verify-article.py — 사본 94개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 골든 한 벌은 통과해야 한다 (대기 0)
  PASS  골든을 --publish 로 검사하면 `_` 때문에 거부 (§9-10 — 골든은 발행물이 아니다)
  PASS  §9-1 levels 0개
  PASS  §9-1 levels 4개
  PASS  §9-1 레벨 id 옛 값 adv
  PASS  §9-1 레벨 id 겹침
  PASS  §9-1 레벨 순서 뒤바뀜 (advanced → basic)
  PASS  §9-1 slides 비움
  PASS  §9-1 blocks 비움
  PASS  §9-2 open_question 하나 삭제 (길이 ≠ 장수 − 1)
  PASS  §9-2 open_question 하나 추가
  PASS  §9-2 open_question text 빈 문자열
  PASS  §9-3 슬라이드에 resolves
  PASS  §9-3 open_question 에 goto_index
  PASS  §9-3 슬라이드에 index
  PASS  §9-3 `_` 주석 안의 goto (주석에도 없어야 한다)
  PASS  §9-4 블록 text 삭제
  PASS  §9-4 text 한 글자 바꿈 (구조는 그대로)
  PASS  §9-4 구조만 고침 (span 수치 3.7→3.8), text 는 그대로 — 화면 3.8 / 질문 3.7
  PASS  §9-4 강조를 구조에서만 뺌 (hit → emphasized 제거), text 는 그대로
  PASS  §9-4 목록 순서를 구조에서만 바꿈 (그 항목을 가리키던 시간 조각의 자리도 어긋나 VOL_SPAN 이 같이 나온다)
  PASS  §9-4 ordered 뒤집음 (번호가 글자로 남아야 한다)
  PASS  §9-5 type=gauge (옛 관측 타입)
  PASS  §9-5 type=scale (두지 않기로 한 원형)
  PASS  §9-6 layer 옛 이름 derived_claim
  PASS  §9-6 writing 인데 refs
  PASS  §9-6 fact 인데 refs 비었고 대기 표시도 없음
  PASS  §9-6 bridge 인데 refs 비었고 대기 표시도 없음 (조용히 두면 안 된다)
  PASS  §6.2 span 하나를 대기로 돌림 — 픽스처에서는 실패가 아니라 WARN 으로 센다
  PASS  §9-6 claim span 에 Fact 의 Ref (층 섞임)
  PASS  §9-6 fact span 에 DerivedClaim 의 Ref (층 섞임)
  PASS  §9-6 fact span 에 Fact · Claim 혼합 (D20 — 섞으면 안 된다)
  PASS  §9-6 bridge span 에 개념의 UUID (층 섞임)
  PASS  §9-6 저장소에 없는 UUID
  PASS  DATA_MODEL §2.1 옛 문자열 label "F31" 을 Ref 로 (label 은 참조에 쓰지 않는다)
  PASS  DATA_MODEL §2.1 옛 문자열 "DC-C" 를 Ref 로
  PASS  §9-6 concept span 에 옛 문자열 "C-0002" (ConceptRef 가 아니다)
  PASS  §9-6 fact span 에 ConceptRef 객체 (그 층의 Ref 는 UUID 하나다)
  PASS  CONCEPT_IDENTITY §3.2 ConceptRef 에 part 가 없다
  PASS  CONCEPT_IDENTITY §3.2 ConceptRef 에 code 를 함께 실음 (같은 것을 두 곳에)
  PASS  §9-6 없는 개념
  PASS  CONCEPT_IDENTITY 불변식 12 없는 버전 (지금 버전 + 1)
  PASS  CONCEPT_IDENTITY 불변식 12 그 버전에 없는 part
  PASS  §9-6 refs 에 같은 Ref 두 번
  PASS  §9-6 refs 와 대기 표시가 동시에
  PASS  §9-6 writing 에 대기 표시
  PASS  §9-6 대기 표시 until 이 0.2 가 아님
  PASS  §9-6 claim 의 need 가 Fact 출처 (D22 — claim 은 DerivedClaim)
  PASS  DATA_MODEL §17 대기 need 가 어휘 밖
  PASS  §9-6 span 에 layer 없음
  PASS  DATA_MODEL §11 옛 저작 주석이 span 에 남음 (_fact_refs_dropped)
  PASS  DATA_MODEL §11 옛 저작 주석이 슬라이드에 남음 (_volatility)
  PASS  DATA_MODEL §2.2 event_ref 가 code 문자열
  PASS  §6 인용 글이 fact 가 아님
  PASS  span text 빈 문자열 (그 글을 가리키던 시간 조각도 같이 걸린다)
  PASS  §9-7 span 안에 <br>
  PASS  §9-7 span 안에 <i>
  PASS  §9-7 <b> 가 span 을 넘는다
  PASS  §9-7 kicker 에 태그
  PASS  §9-8 emphasized 항목을 <b> 로 통째 감쌈
  PASS  §9-9 슬라이드에 as_of (읽는 시각 필드)
  PASS  §9-9 블록에 formula
  PASS  §9-9 패키지에 now
  PASS  D8 published_at 이 날짜가 아님
  PASS  D8 published_at 을 10/16 으로 (모든 DERIVED 를 다시 계산해야 한다)
  PASS  D8 VOLATILE 사실의 as_of 삭제 (저장소)
  PASS  D8 조각이 가리키지 않는 VOLATILE 사실의 as_of 삭제 (저장소)
  PASS  D8 as_of 형식 오류
  PASS  D8 VOLATILE 조각이 STABLE 사실을 가리킴
  PASS  D8 VOLATILE 조각에 사실이 없다
  PASS  D8 DERIVED 의 입력 사실을 VOLATILE 로 (저장소 — 회의록 공개일)
  PASS  D8 DERIVED 입력이 VOLATILE 사실을 가리킴 (record)
  PASS  D8 value_at_authoring 을 틀리게 (3주 → 4주)
  PASS  D8 개전일을 하루 앞으로 (201일째 → 202)
  PASS  D8 class 오류
  PASS  D8 at 이 가리키는 글에 조각이 없다
  PASS  D8 at 경로가 없다
  PASS  D8 조각이 그 글에 두 번 ("올해")
  PASS  D8 open_question 의 DERIVED 를 깸 (두 달 전 → 3)
  PASS  DATA_MODEL 불변식 26 article_id 가 code 문자열
  PASS  DATA_MODEL 불변식 26 article_version 이 없다
  PASS  DATA_MODEL §1 authoring 에 옛 칸
  PASS  D9 최상단에 _findings
  PASS  스키마 옛 필드 Level.label 이 남음 (D22)
  PASS  스키마 옛 필드 slide_count
  PASS  스키마 옛 teaser 가 슬라이드에 남음
  PASS  스키마 옛 h1
  PASS  스키마 event_hint 가 남고 event_ref 없음
  PASS  스키마 옛 chrome 이 남음
  PASS  스키마 title 에 브랜드
  PASS  스키마 contrast 항목에 value · body 둘 다 없음
  PASS  스키마 prose weight 오류 (warn 은 판단 색이라 없다)
  PASS  스키마 sheet 행에 v_modifier (판단 색)
  PASS  스키마 quote 에 attribution 없음
  PASS  §9-10 발행 검사에서는 `_` 필드가 하나라도 있으면 실패
  → 전부 기대대로

== compare-reader-text.py — 사본 26개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 새 골든은 옛 골든과 글이 같다
  PASS  본문 한 글자 (금리를→금리은)
  PASS  마침표 하나 삭제
  PASS  공백 하나 추가 (독자 눈엔 안 보여도 글자다)
  PASS  <b> 위치 이동 (굵기도 글이다)
  PASS  <br> → 공백 (headline 줄바꿈 소실)
  PASS  kicker 변경
  PASS  open_question 한 글자
  PASS  게이지 값 2% → 2.0%
  PASS  게이지 라벨 바꿈
  PASS  표 값 4.1% → 4.2%
  PASS  인용 출처 표시 변경
  PASS  목록 라벨 변경
  PASS  문단 순서 뒤바뀜
  PASS  슬라이드 하나 삭제
  PASS  블록 하나 삭제
  PASS  문단 무게 secondary → normal (dim 소실)
  PASS  강조 제거 (hit 소실)
  PASS  목록 ordered 뒤집음
  PASS  허용된 차이 #16 을 되돌리면(옛 글 그대로) 통과 — 허용은 승인된 새 글만 강제하지 않는다
  PASS  허용된 위치에서 승인된 것과 다르게 고침 (본 → 봤다)
  PASS  허용된 위치에서 승인된 수정 + 글자 하나 더
  PASS  허용된 삽입 줄(R10)의 글자를 바꿈
  PASS  허용된 삽입 줄(R10)을 다른 자리로 옮김
  PASS  등록 안 된 줄을 하나 더 끼움
  PASS  승인된 수정을 다른 문장에 적용 (허용은 위치 한 곳만)
  PASS  span 을 쪼개도 이음이 같으면 통과 (경계는 새 데이터)
  → 전부 기대대로

OK
```
