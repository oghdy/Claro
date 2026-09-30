# logs/backend · Phase 0 / Step 0.2a — CONCEPT_IDENTITY

## B-0.2a · 2026-09-30 · **[GATE] → 게이트 통과 D25** (반영은 맨 아래)

### 질문 8개 — 처리 요약

| # | 질문 | 표시 | 근거 (실물 · FINDINGS 확정) | 계약 |
|---|---|---|---|---|
| 1 | `concept_id` — "C-0002" 와 UUID, 무엇이 불변인가 | **계약 반영** (+ _open-2) | 확정 §9.5 (UUID) · 라이브러리 규칙 "한번 부여한 concept_id 는 절대 바꾸지 않는다" · 실물 C-0001~C-0010, 골든 refs, D19, correction-log 가 전부 "C-XXXX" 로 부른다 | §2 — 둘 다 불변 · 1:1. 키는 UUID `concept_id` 하나, "C-0002" 는 `code`(값 그대로). PROVISIONAL 의 code → _open-2 |
| 2 | 버전 고정 — concept Ref 가 정확히 무엇을 가리키나 | **계약 반영** (+ _open-1) | 확정 §4.3 (발행 당시 버전 pin) · 실물: 골든 refs 22개가 버전 없는 "C-XXXX" · C-0002 v2→v3 에서 ④ 소멸 · C-1b 로그 "`_concept_ref` 가 없는 단계를 가리키게 된다" | §3 — `ConceptRef { concept_id, version }`. 골든 = C-0001@1 · C-0002@3 · C-0003@1 · C-0005@3. 어느 문안(part)까지 → _open-1 |
| 3 | 버전을 올릴 때 / 새 개념을 만들 때 | **계약 반영** (명제 문구만 고치는 경우 미확인) | 실물: 버전 6건(C-1b 4 + B-0.0b 2) · git 3판 `15f39c6` `0ca16ee` `0eb4a3b` 에서 명제 10줄 글자 불변 · 확정 §9.5 (evidence 는 leaf 명제 단위, 애매하면 자른다) · D19 | §4 — 명제가 같으면 버전, 명제의 뜻이 바뀌면 새 개념 |
| 4 | `conflicting_alias` — "dynamic pricing" | **계약 반영** | 확정 §9.5 (conflicting_alias 스키마) · 실물 C-0010 aliases "dynamic pricing(주법 용례)" + 🚨 용어 충돌 경고 | §7 — alias 행 + 충돌 별칭 행 둘. 충돌 별칭 일치만으로는 LINK 안 함. 이름 겹침엔 충돌 표시 필수(불변식 9) |
| 5 | "브리지 필수" 표시와 검사 | **계약 반영** (검사 빈틈 → _open-1 · 모양 일부 0.2b) | 실물: C-0002 v3 🔗 메모 · ANALOGY 🚨 규칙 · 골든 입문 4장 ③→④ bridge→속도계 · D19 "④ 를 옮길 때의 제약" · §4.5 (2026-09-18 독자 검증) | §6 — `BridgeSlot { label, after, need, why }` + `Analogy.requires`. 검사 = 불변식 13 (글자 대조) |
| 6 | Topic 과 leaf KC — 10개는 각각 무엇인가 | **계약 반영** (Topic 표현 → _open-3) | 확정 §9.5 (Topic/KC 분리, evidence 는 leaf) · §9.4 · 실물: 10개 모두 명제 하나, C-0004 `FOMC_ROLE` = §9.5 leaf 예시, 라이브러리 규칙 6 (도메인은 mastery 없음), §12.4 (C-0009 도메인 넘어 재사용) | §8 — 10개 전부 leaf. 도메인은 `domain` 필드이지 Topic 아님. Topic 은 실물 없음 |
| 7 | 문안 필드 — 명제 · FULL · REFRESHER · ANALOGY · BOUNDARY · 비유 한계선 | **계약 반영** (BOUNDARY "함께 제시" 상대 · 명제 노출은 미확인) | 실물: 라이브러리 필드 인벤토리 (10/10/10/2/1/3) · C-1 린트 ① 절차 6 · C-1b "명제 ∪ FULL" · C-1 린트 ② 범위 (정밀도 1/11) · 확정 §4.4 (한계선 저장) | §5 — 보이는 필드 / `authoring` 을 구조로 가름. 린트 ① 은 같은 버전 안에서 대조 |
| 8 | 소유 — ARTICLE_PACKAGE §6 layer "concept" 와의 짝 | **계약 반영** | ARTICLE_PACKAGE §6 ("Ref 의 모양은 0.2", span 하나에 layer 하나) · 실물: 골든 concept span 21 (문안 그대로 16 · 아님 5 · 개념 둘 가리키는 헤드라인 1) · 라이브러리 재사용 표 ↔ used_in 어긋남 | §12 — concept 층 refs = ConceptRef. 라이브러리 문안을 옮긴 span 은 concept 층 + 그 개념(불변식 14). used_in 은 계산 |

§9.6 보류 항목 — 계약에 없다 (검사 A 가 단어 · 수치로 확인). merge · split · PROVISIONAL · Resolver · Topic 절에 "실물 없음" (검사 A).

### 게이트에서 먼저 볼 것

1. **_open-4 — 마감이 있다.** C-0002 · C-0003 (약하게 C-0009) 의 명제가 주장 둘을 묶고 있다. evidence 가 0 인 지금 나누면 문안 편집이고,
   첫 독자 기록(F-3) 뒤에는 split 이 영원히 불가능하다. 나눌지는 콘텐츠 판정이라 계약은 정하지 않았다. **추천: 콘텐츠 레인에 넘기고 마감 F-3 전**
2. **_open-1 — 브리지 검사는 지금 반쯤 장님이다.** 글자 대조라서 골든은 잡지만, LLM 이 ③ 을 바꿔 말한 기사에서는 ④ 가 빠져도 **조용히 통과**한다.
   셀프테스트 마지막 행이 그것을 실제로 보인다 (③ 과 비유를 둘 다 바꿔 말하고 ④ 를 뺀 사본 → 통과).
   ③ 만 바꿔 말하면 비유가 문안 그대로라 잡힌다 — 반쯤 막혀 있는 셈이다. ConceptRef 에 `part` 를 넣으면 막힌다. **추천: (b)**
3. **질문 1 의 이름 옮김.** 지금까지 `concept_id` 라고 부르던 "C-0002" 를 이 계약은 `code` 라고 부른다. `concept_id` 는 확정 §9.5 대로 UUID 다.
   **값은 하나도 바뀌지 않는다** — 이전 때 UUID 를 한 번 발급할 뿐. 라이브러리 규칙("concept_id 는 절대 바꾸지 않는다")이 지키려던 것은 그대로 지켜진다.
   다만 문서들이 쓰는 "concept_id" 라는 말의 뜻이 바뀌므로 확인이 필요하다
4. _open-2 (PROVISIONAL 의 code) · _open-3 (Topic 위치) — 추천 있음. 둘 다 독자 영향 없음
5. 콘텐츠 레인 질문 Q-C1~Q-C6 — 계약 모양은 안 바뀌지만 라이브러리를 옮기기 전에 답이 필요하다 (계약 §15)

### 산출

| 파일 | 내용 |
|---|---|
| `docs/contract/CONCEPT_IDENTITY.md` | 계약. §1 타입 · §2~§12 질문별 · §13 불변식 15 · §14 미확인 · §15 _open 4 + 콘텐츠 질문 6 · §16 이전 목록 |
| `scripts/verify-concept-identity.py` | 계약 검사 (A 계약 문서 · B 라이브러리 · C 골든). `--report` 로 이전 목록 · 골든 문안 대조 |
| `scripts/selftest-verify-concept-identity.py` | 망가뜨린 사본 39개로 검사가 실제로 실패하는지 (메모리 안, 파일 안 남김) |
| `logs/backend/phase-0-step-0-2a.md` | 이 파일 |

라이브러리 · 골든 · 다른 계약 · DECISIONS 는 고치지 않았다. concept_id(= 지금의 "C-XXXX") 값은 하나도 바꾸지 않았다.

### 읽은 것 — 지시 목록 밖을 연 것
지시 목록은 다 읽었다. 목록 밖으로 연 것과 이유:
- `git log` / `git show` 로 라이브러리 옛 판 3개 — 질문 3 의 근거("명제가 바뀐 적이 있나")는 CHANGELOG 로는 알 수 없다. 같은 실물 파일의 이력이다
- ARTICLE_PACKAGE §1 (`Span.refs: Ref[]`) · §9 (불변식 6) — §6 이 가리키는 Ref 정의와 발행 불변식을 확인하려고. 고치지 않았다
- `scripts/lint-concepts.py` · `scripts/verify-article.py` · `scripts/selftest-verify-article.py` · `packages/contract/src/types.ts` 의 Ref — 파서 형식과 "다른 계약들처럼" 의 검사 모양을 맞추려고. 고치지 않았다
- `logs/backend/phase-0-step-0-1b.md` — 로그 형식
- `docs/development-backend.md` — Step 0.2a 절 · 체크박스
- PM.md · deprecated · 브리프 · DATA_MODEL 은 열지 않았다

### 도출하며 판단한 것 — 멈추지 않은 이유
_open 으로 올리지 않고 계약에 넣은 판단. 게이트에서 뒤집을 수 있다.
| 판단 | 근거 | 왜 _open 이 아닌가 |
|---|---|---|
| 버전 밖: status · alias · 관계 · domain · type · canonical_name | 실물 — 6번 버전이 오르는 동안 이것들은 안 바뀌었다 | 실물이 그렇게 움직였다 |
| 브리지 "바로 다음" 을 엄격하게 (writing 하나도 불가) | 라이브러리 문구 "③ 바로 다음에" · 골든 모양 | 라이브러리 문구를 그대로 옮겼다. 느슨하게 하는 쪽이 판단이다 |
| merge 가 B 의 것을 지우거나 옮기지 않는다 | 확정 §9.5 "merge 는 evidence remap 으로 되돌릴 수 있다" | 되돌릴 수 있으려면 B 가 남아야 한다 — 확정에서 따라 나온다 |
| 충돌 별칭 일치만으로는 LINK 안 함 | 확정 §9.5 가 conflicting_alias 를 둔 이유 ("다른 것의 같은 이름") | 표가 있는 이유 그 자체. 수치 문턱이 아니라 구간 규칙 |
| `strength` 는 자리만, 값 없음 | 확정 §9.5 "LLM 이 준 수치 쓰지 않는다. 신뢰도는 관측이 결정" + §9.6 (관계를 타고 번지는 강도 보류) | 값을 정하는 쪽이 §9.6 침범 |
| 보이는 필드 / `authoring` 을 구조로 가름 | 실물 — C-1 린트 ② 가 빈 줄 · ⚠️ 모양 추측으로 갈랐다 (파일 전체면 정밀도 1/11) · 프롬프트 "비유 한계선은 독자에게 안 보이는 저작 메모" | 필드 목록은 실물 그대로, 묶는 방식만 정했다 |
| 선행 관계 순환 금지 | 선행 관계의 정의 (A 를 알아야 B, B 를 알아야 A 면 둘 다 못 배운다) | 논리. 수치 없음 |
| code 형식 "4자리 이상" | 실물 4자리 · 기사당 신규 3~6개(§12.4) | 자릿수 상한을 두지 않는 것뿐 |

### 라이브러리 → 계약 — 0.2 이후 작업 목록
계약 §16 이 본문이다. 아래는 스크립트가 라이브러리에서 뽑은 개념별 목록 (`--report`, 검증 절 2).
요약 — **빠지는 것**: `used_in`(계산으로), 양쪽에 적던 `prereq`/`prereq_of`(관계 한 번으로), 라이브러리 절 위치로만 있던 `domain`(필드로).
**바뀌는 것**: "C-XXXX" → `code` + 새 UUID · 버전 문자열 → ConceptVersion + CHANGELOG 한 줄 · 🔗 메모 → BridgeSlot · 🚨 비유 규칙 → `requires` ·
🚨 용어 충돌 → ConflictingAlias · alias 괄호 → `source` · 운영 노트 · reuse_expected · first_source → `authoring`.
**사람이 답해야 하는 것**: _open-4 · Q-C1 ~ Q-C6.

### 범위 밖 관찰 (고치지 않음)
1. **FINDINGS §12.4 ↔ 라이브러리** — §12.4 는 스크루웜에서 C-0009 재사용 + 신규 3개라고 하는데 라이브러리에는 10개뿐이고 재사용 표에도 스크루웜 행이 없다 (Q-C6)
2. **라이브러리가 이미 어긋난 곳 둘** — 관계를 양쪽에 적는 곳(C-0001→C-0003 · C-0004→C-0006 이 한쪽에만), `used_in`(C-0004 · C-0006 없음). 둘 다 "한 곳에 한 번" 규칙의 실물 근거로 썼다. 스크립트가 WARN 으로 센다
3. **골든 입문 4장 헤드라인이 C-0002 · C-0003 둘을 가리킨다** — 0.1b 로그 #4 "하나로 줄이려면 PM 결정". 계약은 둘 다 허용한다(개념 둘 가리키는 span). 줄일 필요가 생기지 않았다
4. **`lint-concepts.py` 의 본문/메모 구분은 빈 줄 · ⚠️ 모양에 기댄다** — 이번 스크립트도 같은 방식으로 라이브러리를 읽는다. 저장이 생기면 둘 다 구조 필드를 읽게 된다 (§16)
5. **C-0002 FULL 머리 문구** "독자에게는 반드시 4단계로" 는 사람용 규칙 문장이다. 계약에서는 BridgeSlot 이 같은 말을 기계가 읽는 모양으로 한다 — 옮기면 문구는 메모로 남긴다

---

## 검증 — 출력 그대로

### 1) 계약 검사 — A 계약 문서 · B 라이브러리 · C 골든

```
$ python3 scripts/verify-concept-identity.py
verify-concept-identity
  계약   docs/contract/CONCEPT_IDENTITY.md
  실물   docs/content/concept-library.md — 개념 10 · CHANGELOG 버전 6건
         fixtures/fomc-2026-09.article.json — 문안 그대로 16 span · 문안 아님 5 span (concept 층)

  WARN  LIB_RELATION_ONE_SIDE: C-0001→C-0003 는 C-0001.prereq_of 에만 있고 C-0003.prereq 에는 없다 — 양쪽에 적는 구조가 이미 어긋났다 (§9: 한 번만 적는다)
  WARN  LIB_RELATION_ONE_SIDE: C-0004→C-0006 는 C-0006.prereq 에만 있고 C-0004.prereq_of 에는 없다 — 양쪽에 적는 구조가 이미 어긋났다 (§9: 한 번만 적는다)
  WARN  LIB_USED_IN_DRIFT: C-0004: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  LIB_USED_IN_DRIFT: C-0006: 재사용 표는 FOMC-20260916 에서 생성이라는데 used_in 은 없음 — 저장하지 않고 계산한다 (§12)
  WARN  GOLD_UNPINNED: concept span 21 의 ref 22개가 버전 없는 "C-XXXX" — ConceptRef 로 이전 전 (§16)

OK
exit=0
```

WARN 5 건은 실물 그대로다 — 라이브러리를 고치지 않았으므로 남는다. 넷은 "한 곳에 한 번" 규칙(§9 · §12)의 근거이고, 하나는 골든 이전 전(§16)이라 남는다.

### 2) 이전 목록 · 골든 문안 대조 — `--report`

```
$ python3 scripts/verify-concept-identity.py --report
라이브러리 → 계약 (§16)
  C-0001 RATE_TO_SPENDING           MONETARY   code C-0001 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · 비유 `브레이크 페달` 한계선 1 · alias 3 · relation C-0001→C-0003
                                        버림(계산) ['used_in']  저작 메모로 ['first_source']
  C-0002 INFLATION_LEVEL_VS_RATE    MONETARY   code C-0002 + UUID 발급 · v3 (2026-09-29) · FULL 단계 ①·②·③ · 브리지 슬롯 ④ after ③ · 비유 `속도계` 한계선 2 requires ①②③④ · alias 3 · relation C-0002→C-0003
                                        버림(계산) ['used_in']  
  C-0003 CB_INFLATION_TARGET        MONETARY   code C-0003 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · alias 3 · relation C-0001→C-0003 C-0002→C-0003
                                        버림(계산) ['used_in']  
  C-0004 FOMC_ROLE                  MONETARY   code C-0004 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · alias 2 · relation C-0004→C-0006
  C-0005 VOTERS_VS_PARTICIPANTS     MONETARY   code C-0005 + UUID 발급 · v3 (2026-09-29) · FULL 단계 1 · alias 2
                                        버림(계산) ['used_in']  저작 메모로 ['⚠️ 운영 노트']
  C-0006 SEP_ROLE                   MONETARY   code C-0006 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · alias 4 · relation C-0004→C-0006
                                        저작 메모로 ['⚠️ 운영 노트']
  C-0007 AGENCY_AUTHORITY_LIMIT     REGULATORY code C-0007 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · alias 3
                                        버림(계산) ['used_in']  저작 메모로 ['reuse_expected']
  C-0008 POLICY_STATEMENT_VS_RULE   REGULATORY code C-0008 + UUID 발급 · v2 (2026-09-29) · FULL 단계 1 · alias 4
                                        버림(계산) ['used_in']  저작 메모로 ['reuse_expected']
  C-0009 FEDERAL_VS_STATE           REGULATORY code C-0009 + UUID 발급 · v1 (2026-09-18) · FULL 단계 1 · alias 3
                                        버림(계산) ['used_in']  저작 메모로 ['reuse_expected']
  C-0010 PERSONALIZED_PRICING       REGULATORY code C-0010 + UUID 발급 · v2 (2026-09-29) · FULL 단계 1 · BOUNDARY 2줄 · alias 5 · source 있음 ['dynamic pricing(주법 용례)', 'personalized algorithmic pricing(뉴욕 용례)'] · ConflictingAlias ['dynamic pricing']
                                        버림(계산) ['used_in']  저작 메모로 ['🚨 용어 충돌 경고']

골든 concept span — 어느 문안인가 (버전 = 지금 라이브러리)
  C-0001@1 FULL       3 span  basic slides/4/blocks/0/paragraphs/0/body/0 …
  C-0002@3 ANALOGY    2 span  basic slides/3/blocks/0/paragraphs/2/body/0 …
  C-0002@3 FULL:①     4 span  basic slides/2/blocks/0/paragraphs/0/body/0 …
  C-0002@3 FULL:②     3 span  basic slides/2/blocks/0/paragraphs/1/body/0 …
  C-0002@3 FULL:③     2 span  basic slides/3/blocks/0/paragraphs/0/body/0 …
  C-0005@3 REFRESHER  2 span  advanced slides/3/blocks/1/paragraphs/1/body/0 …

브리지 슬롯 (§6.3)
  basic: C-0002 ③ slides/3/blocks/0/paragraphs/0/body/1 → 브리지 ④ slides/3/blocks/0/paragraphs/1/body/0 "그런데 지금 미국은 3%대입니다."
```

- 골든 concept span 21 중 16 이 라이브러리 문안과 글자 그대로 같고, 그 버전이 모두 **지금 라이브러리 버전**이다 → 골든 고정값 C-0001@1 · C-0002@3 · C-0005@3.
  C-0003 은 문안 그대로인 span 이 없다 (헤드라인 · 대조 항목뿐) — 쓰인 버전은 v1 하나뿐이라 @1
- C-0002 ④ 브리지는 ③ 마지막 span 바로 다음에 있다

### 3) 검사가 실제로 실패하는가 — 망가뜨린 사본 39개

```
$ python3 scripts/selftest-verify-concept-identity.py
== verify-concept-identity.py — 사본 39개 (+ 원본)
  PASS  망가뜨리지 않은 원본은 통과해야 한다
        기대 — / 실제 —
  PASS  §9.6 — 계약에 posterior 가 들어옴
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — 계약에 half-life
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — Resolver 구간에 수치 (HIGH ≥ 0.85)
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — 관계에 LLM 수치 0.82
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.5 필드 — Concept.merged_into 삭제
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §9.5 필드 — ConflictingAlias.conflicts_with_meaning 삭제
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §4.3 — ConceptRef 에서 version 삭제 (버전 고정 없음)
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §9.5 enum — status 에 ACTIVE 추가
        기대 ['CONTRACT_ENUM'] / 실제 ['CONTRACT_ENUM']
  PASS  §9.5 enum — relation_type 에서 RELATED 삭제
        기대 ['CONTRACT_ENUM'] / 실제 ['CONTRACT_ENUM']
  PASS  D24 — merge 절에서 "실물 없음" 삭제
        기대 ['CONTRACT_NO_REAL'] / 실제 ['CONTRACT_NO_REAL']
  PASS  D24 — Resolver 절에서 "실물 없음" 삭제
        기대 ['CONTRACT_NO_REAL'] / 실제 ['CONTRACT_NO_REAL']
  PASS  §9.5 Resolver — AMBIGUOUS 구간 삭제
        기대 ['CONTRACT_RESOLVER'] / 실제 ['CONTRACT_RESOLVER']
  PASS  0.2b 침범 — 계약 타입 블록에 Bridge 정의
        기대 ['CONTRACT_FOREIGN_TYPE'] / 실제 ['CONTRACT_FOREIGN_TYPE']
  PASS  0.2c 침범 — knowledge_evidence 스키마 정의
        기대 ['CONTRACT_FOREIGN_TYPE'] / 실제 ['CONTRACT_FOREIGN_TYPE']
  PASS  로그 — 질문 5 행의 표시 지움
        기대 ['LOG_QUESTION'] / 실제 ['LOG_QUESTION']
  PASS  로그 — 질문 8 행 삭제
        기대 ['LOG_QUESTION'] / 실제 ['LOG_QUESTION']
  PASS  §13-2 — C-0004 를 C-0003 으로 (code 겹침)
        기대 ['LIB_DUP', 'LIB_RELATION_TARGET'] / 실제 ['LIB_DUP', 'LIB_RELATION_TARGET']
  PASS  §13-3 — canonical_name 겹침
        기대 ['LIB_DUP'] / 실제 ['LIB_DUP']
  PASS  §13-4 — status ACTIVE
        기대 ['LIB_STATUS'] / 실제 ['LIB_STATUS']
  PASS  §13-5 — C-0002 v4, CHANGELOG 에 v4 없음
        기대 ['LIB_VERSION'] / 실제 ['LIB_VERSION']
  PASS  §13-5 — CHANGELOG 에서 C-0005 v2 줄 삭제 (v2 이력 빠짐)
        기대 ['LIB_VERSION'] / 실제 ['LIB_VERSION']
  PASS  §13-7 — C-0009 REFRESHER 본문 삭제
        기대 ['LIB_MISSING'] / 실제 ['LIB_MISSING']
  PASS  §13-8 — 🔗 슬롯이 없는 단계 뒤 (③ → ⑤ 바로 다음)
        기대 ['LIB_BRIDGE_SLOT'] / 실제 ['LIB_BRIDGE_SLOT']
  PASS  §13-8 — 🔗 브리지 메모 통째 삭제 → 비유가 없는 ④ 를 요구
        기대 ['LIB_ANALOGY_REQUIRES'] / 실제 ['LIB_ANALOGY_REQUIRES']
  PASS  §13-9 — "dynamic pricing" 을 C-0001 alias 에도 (충돌 표시 없음)
        기대 ['LIB_ALIAS_COLLISION'] / 실제 ['LIB_ALIAS_COLLISION']
  PASS  §13-9 — 다른 개념의 canonical_name 을 alias 로 (C-0006 에 FOMC_ROLE)
        기대 ['LIB_ALIAS_COLLISION'] / 실제 ['LIB_ALIAS_COLLISION']
  PASS  §13-9 — C-0010 alias 에서 dynamic pricing 삭제 (충돌 별칭이 붙을 alias 없음)
        기대 ['LIB_CONFLICT_ALIAS'] / 실제 ['LIB_CONFLICT_ALIAS']
  PASS  §13-10 — prereq 가 없는 개념 C-0099
        기대 ['LIB_RELATION_TARGET'] / 실제 ['LIB_RELATION_TARGET']
  PASS  §13-10 — 선행 순환 (C-0003 → C-0001 추가)
        기대 ['LIB_RELATION_CYCLE'] / 실제 ['LIB_RELATION_CYCLE']
  PASS  §13-12 — concept ref 가 라이브러리에 없다 (헤드라인 → C-0099)
        기대 ['GOLD_REF_UNKNOWN'] / 실제 ['GOLD_REF_UNKNOWN']
  PASS  §13-14 — ③ 문안 span 의 refs 를 C-0003 으로
        기대 ['GOLD_REF_SOURCE'] / 실제 ['GOLD_REF_SOURCE']
  PASS  §13-14 — C-0001 FULL 문안을 fact 층으로
        기대 ['GOLD_REF_SOURCE'] / 실제 ['GOLD_REF_SOURCE']
  PASS  §13-13 — ④ 브리지 두 span 삭제 (③ → 속도계)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — 속도계를 ④ 앞으로 (문단 순서 바꿈)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — ③ 과 ④ 사이에 writing span 하나 ("바로 다음" 위반)
        기대 ['GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_BRIDGE_ORDER']
  PASS  §13-13 — ④ 브리지 두 span 을 fact 층으로 (브리지가 없다)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — 속도계를 ③ 앞 장(입문 3장)으로
        기대 ['GOLD_ANALOGY_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER']
  PASS  ③ 을 바꿔 말하고 ④ 를 지움 — 비유가 문안 그대로라 비유 쪽에서 잡힌다
        기대 ['GOLD_ANALOGY_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER']
  PASS  알려진 빈틈 (_open-1) — ③ 과 비유를 둘 다 바꿔 말하고 ④ 를 지움. 못 잡는 것이 기대값
        기대 — (못 잡음) / 실제 —

OK
exit=0
```

- 기대 code 만 나와야 PASS 다. 다른 code 가 섞이면 FAIL 로 친다
- **마지막 행은 빈틈을 보이는 행이다** — 망가뜨렸는데 못 잡는 것이 기대값이다 (계약 §6.3 · _open-1)
- 처음 돌렸을 때 FAIL 4 가 나왔다. 무엇이 틀렸고 어떻게 고쳤는지:
  | 행 | 원인 | 고친 곳 |
  |---|---|---|
  | 로그 질문 5 표시 지움 | 행에 "계약 반영" 과 "_open-1" 이 같이 있어서 하나만 지운 사본은 여전히 표시가 있었다 — **사본이 약했다** | 셀프테스트 — 행의 표시를 전부 지운다 |
  | ③ → ⑤ 바로 다음 | 라이브러리 오류가 골든 검사에 한 번 더 번졌다 (원인 하나에 에러 둘) | 검사 C — 틀린 슬롯은 골든 검사에서 건너뛴다 (LIB_BRIDGE_SLOT 이 이미 말한다) |
  | ③ 과 ④ 사이에 writing · ④ 를 fact 로 | 규칙 2(비유는 브리지 뒤)가 규칙 1(바로 다음)의 결과에 기대고 있었다 | 검사 C — 규칙 2 는 단계 뒤 **첫 bridge span** 을 따로 찾는다. writing 사본은 규칙 1 만 걸린다. fact 사본은 브리지가 아예 없으므로 둘 다 걸리는 것이 맞다 → 기대값을 고쳤다 |
  | 알려진 빈틈 | ③ 만 바꿔 말한 사본을 **잡았다** — 비유가 문안 그대로라 규칙 2 가 걸렸다 | 셀프테스트 — 이 행은 "잡힌다" 로 두고, ③ 과 비유를 둘 다 바꿔 말한 진짜 빈틈 행을 더했다. 계약 §6.3 빈틈 설명도 이 결과대로 고쳤다 |

### 4) 기존 검사 — 안 깨졌는가

이번에 라이브러리 · 골든 · ARTICLE_PACKAGE 를 고치지 않았으므로 결과가 이전과 같아야 한다.

```
$ python3 scripts/verify-article.py
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
exit=0

$ python3 scripts/lint-concepts.py
hits
  C-0002 ANALOGY   L73   지금  계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
  1 hits
exit=1

$ python3 scripts/verify-contract-coverage.py
PASS  10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위

OK
exit=0

$ python3 scripts/selftest-verify-article.py

OK
exit=0
```

- `lint-concepts.py` 1 hit (exit 1) 은 C-1b 반영 때와 같은 C-0002 ANALOGY 오탐이다 (C-1 판정: "그 순간" 으로 바꿔도 뜻이 같다). 기대값 그대로
- `verify-article.py` 는 WARN 줄을 줄였다 (`tail -3`). 0.2 대기 13 span 은 그대로다

## 완료 조건
- [x] 8개 질문 전부 처리 표시 + 근거 — 맨 앞 표
- [x] §9.6 보류 항목 없음 — 검사 A (`CONTRACT_HELD_TERM` 0)
- [x] 실물 없는 구조에 "실물 없음" 표시 — 검사 A (`CONTRACT_NO_REAL` 0)
- [x] 라이브러리 → 계약 이전 목록 — 계약 §16 + `--report`
- [x] 검증 스크립트 + 일부러 망가뜨린 사본
- [x] **게이트** — D25 (아래 "게이트 반영")

---

## B-0.2a 게이트 반영 · 2026-09-30 · D25 (PM, 도윤 위임)

### 판정 → 계약 어디에
| # | D25 판정 | 계약 |
|---|---|---|
| _open-1 | (b) ConceptRef 에 `part` | §1 타입 · §3.2 · **§3.3 새 절** (part 어휘 · 규칙 · null = 게이트 3) · §6.3 (브리지 검사를 part 로) · §12 · §13-12 · 13 · 14 · §16 골든 이전에 part |
| _open-2 | (a) `code` 는 만들 때 — PROVISIONAL 도 | §1 · §2 · §11 |
| _open-3 | (c) Topic 두지 않음. 생기면 Concept 밖 | §8 · §14 (새 행) |
| _open-4 | 계약은 명제를 나누지 않는다. 콘텐츠 레인 C-4 가 판정, 마감 F-3 (첫 evidence 전) | §4.1 끝 · §8 표 · §10.3 · §16 |
| 이름 옮김 | 수용 — UUID = `concept_id`, "C-0002" = `code` | §2 |
| §15 | "_open — 판정됨 → D25" 표. 콘텐츠 질문 Q-C1~Q-C6 은 "→ C-4 (D25)" 로 남김 | §15 |
| CHANGELOG | 한 줄 | 상단 |

- _open-4 문구: 지시는 "C-4 가 판정", D25 본문은 "나눈다(기본값). C-4 가 초안, 도윤이 문안 선택". 둘을 같이 적었다 — "계약은 나누지 않는다 · D25: 나눈다(기본값) · C-4 가 판정(초안 C-4, 문안 도윤) · 마감 F-3"
- 상태 머리말: "초안 · 게이트 전" → "게이트 통과 (D25)". §15 밖에 남은 `_open-N` 은 없다
- NO_REAL 검사가 "PROVISIONAL" 이 제목에 든 절을 찾는다. _open-2 절이 표로 바뀌며 사라져서 §10.1 제목을 "status (확정 §9.5) — PROVISIONAL · MERGED · DEPRECATED 는 실물 없음" 으로 바꿨다. 내용은 그대로

### part — 계약에 넣은 모양 (§3.3)
`"FULL:③"` (단계 label 이 있을 때) · `"FULL"` · `"REFRESHER"` · `"ANALOGY:속도계"` · `"BOUNDARY"` · `null` (문안을 옮기지 않은 언급).
- part 는 **무엇을 재료로 썼나**다. 바꿔 말해도 그 문안을 옮겼으면 단다
- ConceptRef 하나에 part 하나. 한 span 이 한 개념의 두 문안을 섞으면 span 을 나눈다 (span 경계는 데이터 — ARTICLE_PACKAGE §6)
- 글자 그대로인 span 은 part 가 그 문안이어야 한다 (불변식 14, 기계). **바꿔 말한 문장에 null 을 달아 빠져나가는 것은 게이트 3**
- 골든 이전 때: 글자 그대로 16 span 은 검사 C 가 찾은 part 그대로. 나머지 5 span(헤드라인 3 · 대조 2)은 그때 판정 — 예: 입문 5장 헤드라인 "금리는 그 차의 브레이크예요" 는 C-0001 비유를 바꿔 말한 것으로 보인다

### 검사를 어떻게 바꿨나
- 검사 A: `ConceptRef` 필수 필드에 `part`
- 검사 C: refs 두 모양을 받는다
  - **ConceptRef** `{concept_id, version, part}` — 모양(`GOLD_REF_SHAPE`) · 개념(`GOLD_REF_UNKNOWN`) · 버전 1~현재(`GOLD_REF_VERSION`) · 현재 버전의 part 이름(`GOLD_PART_UNKNOWN`) · 글자 그대로인데 part 가 다름(`GOLD_PART_MISMATCH`). 브리지 순서는 **part 로** 본다. 옛 버전을 가리킨 part 는 옛 문안이 저장소에 없어 WARN(`GOLD_PART_OLD`)
  - **"C-XXXX"** (지금 골든) — part 가 없어 글자 대조로 대신한다. `GOLD_UNPINNED` WARN 으로 센다. 계약 §6.3 에 적었다
- concept_id 를 푸는 표(`id_map`)는 라이브러리에 UUID 가 생기기 전이라 셀프테스트만 넘긴다. 셀프테스트는 골든을 ConceptRef 로 옮긴 사본(mgold)을 메모리에서 만든다 — part 는 검사 C 가 찾은 것, concept_id 는 시험용 uuid5. **진짜 UUID 발급은 라이브러리 이전 작업이다** (§16)

### 빈틈이 이제 잡히는가 — 망가뜨린 사본
| 사본 | 게이트 전 (글자 대조) | 지금 (part) |
|---|---|---|
| ③ · 비유를 바꿔 말하고 ④ 삭제 | 못 잡음 | **잡음** — `GOLD_BRIDGE_ORDER` · `GOLD_ANALOGY_ORDER` |
| ③ 을 바꿔 말하고 ④ · 비유 삭제 | 못 잡음 (단서 없음) | **잡음** — `GOLD_BRIDGE_ORDER` |
| 바꿔 말한 ③ · 비유에 part null + ④ 삭제 | 못 잡음 | 못 잡음 — **게이트 3** (계약 §3.3 · §6.3) |
| 옮기기 전 골든("C-XXXX")에서 ③ · 비유 바꿔 말하고 ④ 삭제 | 못 잡음 | 못 잡음 — part 가 없는 픽스처. 골든을 옮기면 사라진다 |

### 지시 7 — ARTICLE_PACKAGE §6 등이 ConceptRef(part 포함)와 맞는가 — **고치지 않고 적는다**
| 곳 | 문구 | 맞나 |
|---|---|---|
| §0 (L27) | "여기서는 `Ref`(ID)로만 가리킨다" | **안 맞는다.** ConceptRef 는 ID 하나가 아니라 `{concept_id, version, part}` 다. part 가 들어가며 "ID" 가 더 멀어졌다 |
| §1 (L63) | `refs: Ref[]` "Ref 의 모양은 0.2" | 모순은 없다. 다만 concept 층 Ref = ConceptRef 라고 가리키는 문구가 아직 없다 |
| §6 표 (L155) | `concept` → refs 가 가리키는 것 "Concept" · 근거 "골든 concept 20" | "Concept" 은 넓게 맞다 (part 는 Concept 버전 안의 문안). **근거 숫자가 낡았다** — 지금 골든 concept span 은 21 (0.1b 이후). part 와 무관 |
| §6 | "span 하나에 layer 하나. refs 는 그 층의 atom 만" · "1개 이상" | 맞다 |
| §6.2 (L184) | "가짜 ID 를 넣지 않는다 — refs 에는 실제 Ref 만" | 맞다 |
| §3 (L90) | "같은 사실은 같은 `Ref` 로 가리킨다" | 사실에 한정된 문장이라 충돌은 없다. **개념에는 그대로 옮기면 안 된다** — 같은 개념도 part 가 다르면 Ref 가 다르다 |
| §9-6 | "그 층의 Ref 다" | 맞다 |
| (계약 밖) `packages/contract/src/validate.ts` | `SPAN_REFS` — refs 가 문자열 목록이 아니면 거부 | **안 맞는다.** 골든을 ConceptRef 로 옮기는 순간 프론트 검증기가 거부한다. 프론트는 refs 를 읽지 않으므로 모양 검사만 풀면 된다. 골든 이전 전에 프론트 레인 |
| (계약 밖) `scripts/verify-article.py` | concept refs 를 `C-\d{4}` 문자열로 본다 | 골든 이전 때 같이 |

계약 §16 "다른 곳" 표에 §0 · validate.ts 행을 더했다.

### 검증 — 출력 그대로

```
$ python3 scripts/verify-concept-identity.py
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
exit=0
```
WARN 5 는 게이트 전과 같다 (라이브러리 · 골든을 고치지 않았다). `GOLD_UNPINNED` 문구가 "브리지 검사는 글자 대조로 대신했다" 로 바뀌었다.

```
$ python3 scripts/selftest-verify-concept-identity.py
== verify-concept-identity.py — 사본 49개 (+ 원본 · ConceptRef 로 옮긴 골든)
  PASS  망가뜨리지 않은 원본은 통과해야 한다
        기대 — / 실제 —
  PASS  ConceptRef 로 옮긴 골든(mgold)도 통과하고, GOLD_UNPINNED 가 없어야 한다
        기대 — / 실제 — · WARN ['LIB_RELATION_ONE_SIDE', 'LIB_USED_IN_DRIFT']
  PASS  §9.6 — 계약에 posterior 가 들어옴
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — 계약에 half-life
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — Resolver 구간에 수치 (HIGH ≥ 0.85)
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.6 — 관계에 LLM 수치 0.82
        기대 ['CONTRACT_HELD_TERM'] / 실제 ['CONTRACT_HELD_TERM']
  PASS  §9.5 필드 — Concept.merged_into 삭제
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §9.5 필드 — ConflictingAlias.conflicts_with_meaning 삭제
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §4.3 — ConceptRef 에서 version 삭제 (버전 고정 없음)
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  D25 — ConceptRef 에서 part 삭제
        기대 ['CONTRACT_FIELD'] / 실제 ['CONTRACT_FIELD']
  PASS  §9.5 enum — status 에 ACTIVE 추가
        기대 ['CONTRACT_ENUM'] / 실제 ['CONTRACT_ENUM']
  PASS  §9.5 enum — relation_type 에서 RELATED 삭제
        기대 ['CONTRACT_ENUM'] / 실제 ['CONTRACT_ENUM']
  PASS  D24 — merge 절에서 "실물 없음" 삭제
        기대 ['CONTRACT_NO_REAL'] / 실제 ['CONTRACT_NO_REAL']
  PASS  D24 — Resolver 절에서 "실물 없음" 삭제
        기대 ['CONTRACT_NO_REAL'] / 실제 ['CONTRACT_NO_REAL']
  PASS  §9.5 Resolver — AMBIGUOUS 구간 삭제
        기대 ['CONTRACT_RESOLVER'] / 실제 ['CONTRACT_RESOLVER']
  PASS  0.2b 침범 — 계약 타입 블록에 Bridge 정의
        기대 ['CONTRACT_FOREIGN_TYPE'] / 실제 ['CONTRACT_FOREIGN_TYPE']
  PASS  0.2c 침범 — knowledge_evidence 스키마 정의
        기대 ['CONTRACT_FOREIGN_TYPE'] / 실제 ['CONTRACT_FOREIGN_TYPE']
  PASS  로그 — 질문 5 행의 표시 지움
        기대 ['LOG_QUESTION'] / 실제 ['LOG_QUESTION']
  PASS  로그 — 질문 8 행 삭제
        기대 ['LOG_QUESTION'] / 실제 ['LOG_QUESTION']
  PASS  §13-2 — C-0004 를 C-0003 으로 (code 겹침)
        기대 ['LIB_DUP', 'LIB_RELATION_TARGET'] / 실제 ['LIB_DUP', 'LIB_RELATION_TARGET']
  PASS  §13-3 — canonical_name 겹침
        기대 ['LIB_DUP'] / 실제 ['LIB_DUP']
  PASS  §13-4 — status ACTIVE
        기대 ['LIB_STATUS'] / 실제 ['LIB_STATUS']
  PASS  §13-5 — C-0002 v4, CHANGELOG 에 v4 없음
        기대 ['LIB_VERSION'] / 실제 ['LIB_VERSION']
  PASS  §13-5 — CHANGELOG 에서 C-0005 v2 줄 삭제 (v2 이력 빠짐)
        기대 ['LIB_VERSION'] / 실제 ['LIB_VERSION']
  PASS  §13-7 — C-0009 REFRESHER 본문 삭제
        기대 ['LIB_MISSING'] / 실제 ['LIB_MISSING']
  PASS  §13-8 — 🔗 슬롯이 없는 단계 뒤 (③ → ⑤ 바로 다음)
        기대 ['LIB_BRIDGE_SLOT'] / 실제 ['LIB_BRIDGE_SLOT']
  PASS  §13-8 — 🔗 브리지 메모 통째 삭제 → 비유가 없는 ④ 를 요구
        기대 ['LIB_ANALOGY_REQUIRES'] / 실제 ['LIB_ANALOGY_REQUIRES']
  PASS  §13-9 — "dynamic pricing" 을 C-0001 alias 에도 (충돌 표시 없음)
        기대 ['LIB_ALIAS_COLLISION'] / 실제 ['LIB_ALIAS_COLLISION']
  PASS  §13-9 — 다른 개념의 canonical_name 을 alias 로 (C-0006 에 FOMC_ROLE)
        기대 ['LIB_ALIAS_COLLISION'] / 실제 ['LIB_ALIAS_COLLISION']
  PASS  §13-9 — C-0010 alias 에서 dynamic pricing 삭제 (충돌 별칭이 붙을 alias 없음)
        기대 ['LIB_CONFLICT_ALIAS'] / 실제 ['LIB_CONFLICT_ALIAS']
  PASS  §13-10 — prereq 가 없는 개념 C-0099
        기대 ['LIB_RELATION_TARGET'] / 실제 ['LIB_RELATION_TARGET']
  PASS  §13-10 — 선행 순환 (C-0003 → C-0001 추가)
        기대 ['LIB_RELATION_CYCLE'] / 실제 ['LIB_RELATION_CYCLE']
  PASS  §13-12 — concept ref 가 라이브러리에 없다 (헤드라인 → C-0099)
        기대 ['GOLD_REF_UNKNOWN'] / 실제 ['GOLD_REF_UNKNOWN']
  PASS  §13-14 — ③ 문안 span 의 refs 를 C-0003 으로
        기대 ['GOLD_REF_SOURCE'] / 실제 ['GOLD_REF_SOURCE']
  PASS  §13-14 — C-0001 FULL 문안을 fact 층으로
        기대 ['GOLD_REF_SOURCE'] / 실제 ['GOLD_REF_SOURCE']
  PASS  §13-13 — ④ 브리지 두 span 삭제 (③ → 속도계)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — 속도계를 ④ 앞으로 (문단 순서 바꿈)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — ③ 과 ④ 사이에 writing span 하나 ("바로 다음" 위반)
        기대 ['GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_BRIDGE_ORDER']
  PASS  §13-13 — ④ 브리지 두 span 을 fact 층으로 (브리지가 없다)
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  §13-13 — 속도계를 ③ 앞 장(입문 3장)으로
        기대 ['GOLD_ANALOGY_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER']
  PASS  ③ 을 바꿔 말하고 ④ 를 지움 — 비유가 문안 그대로라 비유 쪽에서 잡힌다
        기대 ['GOLD_ANALOGY_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER']
  PASS  빈틈 — 옮기기 전 골든("C-XXXX", part 없음): ③ · 비유 바꿔 말하고 ④ 지움. 글자 대조라 못 잡는다 (WARN 으로 센다)
        기대 — (못 잡음) / 실제 —
  PASS  D25 — 게이트 전 빈틈: ③ · 비유를 바꿔 말하고 ④ 지움. part 가 있으니 이제 잡힌다
        기대 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_ANALOGY_ORDER', 'GOLD_BRIDGE_ORDER']
  PASS  D25 — ③ 만 바꿔 말하고 ④ 지움, 비유도 뺌 (글자 대조로는 아무 단서가 없다)
        기대 ['GOLD_BRIDGE_ORDER'] / 실제 ['GOLD_BRIDGE_ORDER']
  PASS  빈틈 — 바꿔 말한 ③ · 비유에 part null 을 달고 ④ 지움. 게이트 3 몫이라 기계는 못 잡는다
        기대 — (못 잡음) / 실제 —
  PASS  §13-14 — 글자 그대로인 ③ span 에 part null
        기대 ['GOLD_PART_MISMATCH'] / 실제 ['GOLD_PART_MISMATCH']
  PASS  §13-14 — 글자 그대로인 C-0005 REFRESHER span 에 part "FULL"
        기대 ['GOLD_PART_MISMATCH'] / 실제 ['GOLD_PART_MISMATCH']
  PASS  §13-12 — 그 버전에 없는 part (헤드라인에 "FULL:⑤")
        기대 ['GOLD_PART_UNKNOWN'] / 실제 ['GOLD_PART_UNKNOWN']
  PASS  §13-12 — 없는 버전 (C-0002@4)
        기대 ['GOLD_REF_VERSION'] / 실제 ['GOLD_REF_VERSION']
  PASS  §13-12 — 풀 수 없는 concept_id
        기대 ['GOLD_REF_UNKNOWN'] / 실제 ['GOLD_REF_UNKNOWN']
  PASS  §3.2 — ConceptRef 에 part 필드가 없다
        기대 ['GOLD_REF_SHAPE'] / 실제 ['GOLD_REF_SHAPE']

OK
exit=0
```
- 원본 둘(지금 골든 · ConceptRef 로 옮긴 사본)이 통과하고, 사본 49개가 기대 code 만 낸다. 옮긴 사본에는 `GOLD_UNPINNED` 가 없다
- "빈틈" 행 둘은 못 잡는 것이 기대값이다 — part null(게이트 3), 옮기기 전 골든

기존 검사 — 계약 밖 파일은 이번에 안 건드렸다.
```
$ python3 scripts/verify-article.py

OK
exit=0
$ python3 scripts/selftest-verify-article.py
OK
exit=0
$ python3 scripts/verify-contract-coverage.py
OK
exit=0
$ python3 scripts/lint-concepts.py
  C-0002 ANALOGY   L73   지금  계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
  1 hits
exit=1
```
`lint-concepts.py` 1 hit (exit 1) 은 C-0002 ANALOGY 오탐 — 기대값 그대로.

### 완료 조건
- [x] D25 다섯 판정 반영 · §15 "판정됨 → D25" · CHANGELOG
- [x] 브리지 검사를 part 로. 게이트 전 빈틈이 잡히는 사본 · part null 은 게이트 3 사본
- [x] ARTICLE_PACKAGE 대조 — 안 맞는 곳 2 (§0 "Ref(ID)", validate.ts) + 낡은 숫자 1 (§6 "concept 20"). 고치지 않음
- [x] **게이트** — D25 · 2026-09-30
