# CONCEPT_IDENTITY

## CHANGELOG
| 날짜 | 변경 | 세션 |
|---|---|---|
| 2026-09-20 | 생성 (빈 껍데기) | PM |
| 2026-09-30 | 초안 — 라이브러리 10개 · 버전 이력 6건 · 골든 concept span 21 · FINDINGS §4.3 §4.4 §9.4 §9.5 확정에서 도출. **게이트 전** | B-0.2a |
| 2026-09-30 | 게이트 반영 (D25) — ConceptRef 에 `part`, 브리지 검사를 part 로 · PROVISIONAL 도 만들 때 `code` · Topic 두지 않음(생기면 Concept 밖) · 명제 나누기는 콘텐츠 레인 C-4 (마감 F-3) · 이름 옮김 수용 | B-0.2a |
| 2026-10-09 | 실물에 맞춤 (C-4 · D32 뒤) — 이 문서 속 실물의 수는 도출한 날의 기록이라고 밝힘(지금 수는 검사가 센다) · §4.1 명제를 나눈 3건(evidence 0 예외) · §4.2 · §8 표 13행 · §3.2 · §16 골든 고정 C-0002@4 · C-0012@1 · §15 Q-C1~6 판정됨(D32) · §17 _open-m. 규칙은 안 바뀜 | B-0.2m-a |

> **상태: 게이트 통과 (D25 · 2026-09-30). _open 4개 모두 판정됨 (§15).**
> 되돌리기 가장 어려운 계약이다 (FINDINGS §9.5). 잘못되면 에러 없이 데이터가 조용히 썩는다.
> 그래서 불변식(§13)마다 누가 어디서 확인하는지 적었고, 지금 확인할 수 있는 것은 스크립트가 확인한다.
>
> **원천 (D24)**
> - 실물 — `docs/content/concept-library.md` (개념 10 · CHANGELOG 버전 6건 · git 3판 `15f39c6` `0ca16ee` `0eb4a3b`) ·
>   골든 `fixtures/fomc-2026-09.article.json` 의 concept span 21 · `logs/correction-log.csv` 개념 행 7 · C-1 / C-1b 로그
> - 확정 — FINDINGS §4.3 · §4.4 · §9.4 · §9.5
>
> **이 문서 속 실물의 수 · 글자는 도출한 날(2026-09-30)의 기록이다.** "라이브러리 10개" · "버전 6건" · "10/10" 같은 수는 그날 센 것이고, 실물이 바뀌어도 따라 고치지 않는다.
> 지금 수는 `verify-concept-identity.py` 가 실물에서 센다 (2026-10-09 기준 개념 13 · 버전 이력 9건). 실물이 바뀌어 **규칙의 근거**가 달라진 곳만 날짜를 붙여 덧붙인다 (§4.1 · §8) — 0.2m-a
>
> **표시** — **실물** 근거 있음 · **확정 §x** FINDINGS 확정에서 옴 · **실물 없음** 확정에서 왔지만 사례가 없다. 첫 사례가 나오면 다시 본다 ·
> **미확인** 둘 다 아니라 정하지 않았다 · **D25** 게이트 판정 (§15)
>
> **검사** — `python3 scripts/verify-concept-identity.py` (`--report` 로 §16 이전 목록과 골든 문안 대조)

---

## 0. 범위

Concept = 독자에게 설명하는 개념 하나. Evidence Layer 의 Concept Atom 이다 (FINDINGS §4.1).

**이 계약이 주인인 것** — Concept · ConceptVersion · ConceptRef · ConceptAlias · ConflictingAlias · ConceptRelation · ConceptCandidate,
그리고 개념 쪽의 브리지 자리(BridgeSlot).

**안 넣는 것**
- 사용자 쪽 기록 — knowledge_evidence · user_concept_state · reading_plan_log · probe → **0.2c**. 여기서는 그쪽이 지켜야 할 제약만 적는다 (§8 · §13-11)
- Fact · Claim · Bridge · Storyline · Source → **0.2b**. Bridge 가 BridgeSlot 을 어떻게 가리키는지도 0.2b
- FINDINGS §9.6 의 보류 항목 전부. 사용자 상태를 셈하는 방식, 개념 사이로 번지는 추정, 설명 여부를 가르는 문턱 — 이 계약에는 숫자 문턱이 하나도 없다
- 저장 기술 · 테이블 설계 (D1 백엔드 OPEN). 여기는 모양과 불변식만
- 개념 문안 자체. 문안은 콘텐츠 레인이 쓴다 (C-1 · C-1b)

---

## 1. 한눈에

```ts
UUID = string

Concept {                          // 정체성. 버전이 올라도 그대로인 것 (§2)
  concept_id:     UUID             // 확정 §9.5. 불변 · 재사용 없음. 기계 참조의 유일한 키
  code:           string           // "C-0002". 불변 · 재사용 없음. 사람이 부르는 이름표 (실물). 만들 때 붙인다 — PROVISIONAL 도 (D25)
  canonical_name: string           // "INFLATION_LEVEL_VS_RATE". 유일. 바뀔 수 있고 옛 이름은 alias 로
  concept_type:   string           // 관측 5개 (§8). 어휘 닫기 미확인
  status:         "CANONICAL" | "PROVISIONAL" | "MERGED" | "DEPRECATED"
  merged_into:    UUID | null      // status 가 MERGED 일 때만
  version:        integer          // 가장 큰 ConceptVersion.version
  domain:         string           // "MONETARY" · "REGULATORY" (관측). 탐색 묶음 — Topic 아님 (§8)
}

ConceptVersion {                   // 문안 한 벌. 한 번 만들면 고치지도 지우지도 않는다 (§3)
  concept_id:   UUID
  version:      integer            // 1부터 1씩
  created_on:   string             // 날짜
  change:       string             // 한 줄. v1 은 "생성"
  basis:        string             // 게이트 · 결정. 예 "C-1b 게이트 (D19)"
  proposition:  string             // 명제 — 이 개념이 무엇인지의 기준 (§4)
  full:         FullStep[]         // 1개 이상
  refresher:    string
  analogies:    Analogy[]          // 0개 이상
  boundary:     BoundaryLine[]     // 0개 이상
  bridge_slots: BridgeSlot[]       // 0개 이상 (§6)
  authoring:    Authoring          // 독자에게 안 보인다
}

FullStep     { label: string | null, title: string | null, text: string }   // label "①". 단계가 하나면 null
Analogy      { name: string, text: string, requires: string[], limits: string[] }
BoundaryLine { case: string, applies: boolean }
BridgeSlot   { label: string, after: string, need: string, why: string }
Authoring    { notes: string[], reuse_expected: string | null, first_source: string | null }

ConceptRef {                       // 발행물이 개념을 가리키는 모양 (§3.2)
  concept_id: UUID
  version:    integer              // 기사를 쓸 때 쓴 버전
  part:       string | null        // 어느 문안을 재료로 썼나 (D25). null = 문안을 옮기지 않은 언급
}

ConceptAlias     { alias: string, language: string, concept_id: UUID, source: string | null }
ConflictingAlias { alias: string, concept_id: UUID, conflicts_with_meaning: string }

ConceptRelation {
  from_id:           UUID          // 선행 관계면 from 이 to 의 선행
  to_id:             UUID
  relation_type:     "REQUIRED_PREREQUISITE" | "HELPFUL_PREREQUISITE" | "RELATED"
  strength:          null          // 자리만 둔다 (§9)
  source:            string        // 누가 적었나
  generator_model:   string | null
  validation_status: string        // 어휘 미확인
}

ConceptCandidate {                 // Resolver 입력 기록 (§11). 실물 없음
  candidate_text:       string
  embedding:            number[]
  candidate_context:    string
  suggested_concept_id: UUID | null
  match_score:          number
  status:               string     // 어휘 미확인
}
```

---

## 2. 식별 — `concept_id` 와 `code` (질문 1)

| | `concept_id` | `code` |
|---|---|---|
| 모양 | UUID | `C-` + 숫자 4자리 이상 (실물은 4자리) |
| 원천 | **확정 §9.5** | **실물** — 라이브러리 10개, 골든 refs, D19, correction-log, C-1 · C-1b 로그 |
| 바뀌나 | 안 바뀐다 | 안 바뀐다. 라이브러리 규칙 "한번 부여한 `concept_id`는 절대 바꾸지 않는다" 가 가리키던 것이 바로 이것이다 |
| 재사용 | 없음 | 없음. MERGED · DEPRECATED 가 돼도 번호를 돌려받지 않는다 |
| 쓰는 곳 | 기계가 저장하는 모든 참조 — ConceptRef · alias · relation · candidate · (0.2c) evidence | 사람 — 로그 · 게이트 · correction-log · 대화 |

- **둘 다 불변이다.** 1:1 이고, 그 대응도 바뀌지 않는다
- **참조의 키는 `concept_id` 하나다.** 기계가 저장하는 참조에 `code` 를 쓰지 않고, 함께 싣지도 않는다.
  같은 것이 두 곳에 있으면 어긋난다 — D22 가 `Level.label` 을 뺀 이유와 같다. 실물에서도 이미 봤다: 라이브러리가 두 곳에 적은 `prereq` · `used_in` 은 git 첫 판(`15f39c6`)부터 어긋나 있었다 (§9 · §12)
- **왜 키가 UUID 인가** — 확정 §9.5 가 정했다. 실물 쪽 이유 하나: Resolver 는 사람 없이 PROVISIONAL 개념을 만든다 (§9.5 "파이프라인을 막지 않는다").
  순번 `code` 는 한 곳에서 번호를 세야 하지만 UUID 는 만드는 쪽이 바로 만든다
- **기존 개념** — 이전할 때 UUID 를 한 번 발급하고 `code` 는 그대로 둔다 (0.2m-a 에서 발급 — §16). 지금까지 `concept_id` 라고 부르던 "C-0002" 는 이 계약의 `code` 다.
  이름을 옮겨 적을 뿐 **값은 하나도 바뀌지 않는다** (§16)
- `canonical_name` 은 식별자가 아니다. 유일하지만 바뀔 수 있고, 바뀌면 옛 이름을 alias 로 넣는다 (라이브러리 규칙 · 실물)
- **`code` 는 개념을 만들 때 붙인다 — PROVISIONAL 도 (D25).** 게이트 · correction-log 는 사람이 부르는 이름으로 돈다.
  합쳐지는 PROVISIONAL 은 번호를 태운다. 번호가 비는 것은 문제가 아니다 (재사용하지 않는다)
- **이름 옮김 수용 (D25)** — UUID = `concept_id`, "C-0002" = `code`. 문서들이 "C-0002" 를 concept_id 라 부르던 것은 라이브러리를 옮길 때 정리한다

---

## 3. 버전과 고정 (질문 2)

### 3.1 버전 = 문안 한 벌

ConceptVersion 은 한 개념의 문안 전부(§5 필드)를 통째로 담은 스냅숏이다.

- 1부터 1씩. **한 번 만든 버전은 고치지 않고 지우지 않는다** — 발행된 패키지가 영원히 가리키기 때문이다 (확정 §9.2 · §4.3)
- `Concept.version` = 가장 큰 버전 번호
- 버전마다 날짜 · 변경 한 줄 · 근거. **실물**: 라이브러리 CHANGELOG 한 줄이 정확히 이 셋을 적는다
  (예: `2026-09-29 · C-0002 v3 — FULL ④ 를 브리지로 이관 … · C-1b 게이트 (D19)`)
- **버전 밖**(개념에 붙고 버전이 없다): `status` · `merged_into` · `canonical_name` · `domain` · `concept_type` · alias · 충돌 별칭 · 관계.
  **실물**: git 3판 동안 버전이 6번 올랐는데 alias · type · prereq · status 는 한 번도 안 바뀌었다. 버전은 문안에만 있었다

### 3.2 `ConceptRef` — 발행물이 개념을 가리키는 모양

```
ConceptRef { concept_id, version, part }   // 기사를 쓸 때 쓴 버전과 그 버전의 어느 문안. 최신이 아니어도 쓴 버전을 적는다
```

**왜 버전까지 (실물)**
- 골든 concept span 은 `"C-0002"` 만 가리킨다. C-0002 는 v2 → v3 에서 FULL ④ 를 잃었다 (C-1b). 버전이 없으면 이 참조는 오늘의 라이브러리를 가리키고, 골든이 기대던 단계는 거기 없다
- 이미 한 번 일어났다. C-1b 로그: 옛 골든 `_concept_ref` 주석이 "버전을 pin 하지 않아서, v3 반영 뒤에는 이 주석이 없는 단계를 가리키게 된다"
- 반대 방향도 있다. 2026-09-18 에 기사가 발행됐다면 ④ "그런데 지금 미국은 3%대입니다" 는 **C-0002 v1 의 문안**이었다. 그 기사를 몇 년 뒤에 열어도 v1 이 나와야 한다 → 옛 버전은 지우지 않는다

**규칙**
- 발행 뒤 ConceptRef 는 바뀌지 않는다. 개념이 MERGED 가 되어도 패키지는 옛 `concept_id` 를 그대로 갖고, 푸는 쪽이 redirect 를 따른다 (§10.2)
- 골든은 **C-0001@1 · C-0002@4 · C-0005@3 · C-0012@1** 에 고정한다 (D32). 골든의 라이브러리 문안 span 이 이 버전들과 글자 그대로 같다 (검사 C). §16
  - C-0002 는 v3 과 v4 의 FULL 글자가 같다. @3 에 고정하면 그 버전의 명제에 떼어 낸 주장(→ C-0011)이 남으므로 @4 다
  - 도출 시점(2026-09-30)에 `C-0003` 을 가리키던 셋은 전부 "연준 2%"를 말한다 — 그 주장은 2026-10-09 부터 C-0012 다
- 0.2c 에 넘기는 것: §9.4 의 `content_version` 은 ConceptRef.`version` 과 같은 뜻이어야 한다. 모양은 0.2c

### 3.3 `part` — 어느 문안을 재료로 썼나 (D25)

| `part` | 가리키는 것 | 골든 실물 |
|---|---|---|
| `"FULL:③"` | FULL 의 한 단계 (단계 `label` 이 있을 때) | C-0002 ① 4 · ② 3 · ③ 2 span |
| `"FULL"` | FULL 전체 (단계가 하나일 때) | C-0001 3 span |
| `"REFRESHER"` | REFRESHER | C-0005 2 span |
| `"ANALOGY:속도계"` | 비유 하나 (`name` 으로) | C-0002 2 span |
| `"BOUNDARY"` | BOUNDARY | — |
| `null` | 문안을 옮기지 않은 언급 — 헤드라인 요약, 대조 항목 이름 등 | 헤드라인 3 · 대조 항목 2 (§16 에서 판정) |

- **왜** — 독자 검증을 통과한 유일한 흐름(①②③④ → 비유)을 지키는 장치다 (§6.3). 파이프라인 기사는 LLM 이 새로 쓰므로(§4.2) 글자로는 어느 단계인지 알 수 없다.
  집필 단계는 어떤 재료를 썼는지 이미 안다 — 붙이는 비용이 거의 없다 (D25). §9.4 `block_decisions` 의 FULL · REFRESHER 와 같은 말을 쓴다
- `part` 는 **무엇을 재료로 썼나**이지 글자가 같은가가 아니다. 바꿔 말한 문장도 그 문안을 옮긴 것이면 `part` 를 단다
- `part` 는 가리킨 **그 버전**에 있는 문안 이름이다. 없는 이름이면 실패 (불변식 12)
- ConceptRef 하나에 `part` 하나. span 이 한 개념의 두 문안을 섞으면 span 을 나눈다 — span 경계는 데이터다 (ARTICLE_PACKAGE §6)
- 라이브러리 문안이 **글자 그대로** 있는 span 은 `part` 가 그 문안이어야 한다 (불변식 14, 기계)
- **바꿔 말한 문장에 `part` 를 `null` 로 달아 빠져나가는 것은 기계가 못 본다 — 게이트 3 이 본다**

---

## 4. 버전을 올릴 때 · 새 개념을 만들 때 (질문 3)

> **명제가 같으면 버전. 명제의 뜻이 바뀌면 새 개념.**

### 4.1 실물 — 문안을 고친 6건 (2026-09). 명제는 안 바뀌었다

| 날짜 | 개념 | 버전 | 바꾼 필드 | 무엇을 | correction-log |
|---|---|---|---|---|---|
| 2026-09-21 | C-0002 | v1→v2 | FULL ④ | 시점 문장 "그런데 지금 미국은 3%대입니다." 삭제 | 레이어 혼입 |
| 2026-09-21 | C-0005 | v1→v2 | REFRESHER | "참가자 전원" → 투표권과 관계없이 참가자들이 | 축약 변질 |
| 2026-09-29 | C-0010 | v1→v2 | REFRESHER · BOUNDARY | 빠진 추정 대상(지불 의향) 복원 | 축약 변질 ×2 |
| 2026-09-29 | C-0008 | v1→v2 | REFRESHER | "이건" (이 사건의 문서) 제거, 일반형으로 | 레이어 혼입 |
| 2026-09-29 | C-0005 | v2→v3 | FULL | "각자" · 한 회의의 값(12대0 · 18 · 9) 제거 | 레이어 혼입 |
| 2026-09-29 | C-0002 | v2→v3 | FULL · ANALOGY 규칙 | ④ 전체를 브리지로 이관, 🔗 브리지 메모 추가 | 레이어 혼입 |

- git 3판(2026-09-30 까지)에서 **명제 10줄은 한 글자도 안 바뀌었다**. alias · type · prereq · status 도 그대로다
- 6건 모두 같은 모양이다: **명제는 맞았고 문안이 명제를 벗어났다 → 문안을 명제 쪽으로 되돌렸다.**
  D19 기준("재사용돼도 독자 그림이 틀리지 않는가")을 적용할 때 잣대가 된 것도 명제다 — C-1b 는 린트 ① 을 "명제 ∪ FULL" 기준으로 돌렸다

**실물 — 명제를 나눈 3건 (2026-10-09 · C-4 · D32). 독자 기록 0 인 시점의 예외다 (§10.3)**

| 개념 | 버전 | 명제 | 떼어 낸 주장 → 새 개념 | 따라간 alias |
|---|---|---|---|---|
| C-0002 | v3→v4 | "수준이 아니라 상승률" 하나로 줄임. FULL · 슬롯 · REFRESHER · 비유 문안은 v3 그대로 | "내려오는 중이어도 목표보다 높을 수 있다" → C-0011 | — |
| C-0003 | v1→v2 | 일반 규칙 하나로. FULL · REFRESHER 새로 | "연준의 목표는 2%" → C-0012 | "2% 목표" → C-0012 |
| C-0009 | v1→v2 | "따로 규율" 하나로. FULL 둘째 문장 · REFRESHER 새로 | "주가 더 강한 규제를 두기도" → C-0013 | "주법" → C-0013 |

- 앞의 6건과 **다른 모양**이다 — 문안이 아니라 명제가 바뀌었다. §4.2 규칙대로면 새 개념이어야 하지만, 그 개념을 가리키는 독자 기록이 하나도 없어(0.2c 원장 0줄) 조용히 바뀔 증거가 없었다.
  떼어 낸 주장은 새 개념이 됐고(C-0011 · C-0012 · C-0013), 옛 개념은 남은 주장 하나를 계속 가리킨다. **첫 KnowledgeEvidence 줄 뒤에는 이렇게 할 수 없다** (§10.3 · D30)
- 사유는 그 버전의 `basis` 에 글로 적혀 있다 ("evidence 0 예외"). 사유를 담는 구조 칸은 없다 → §17 _open-m3
- alias 는 주장을 따라갔다 — 뺀 것이 아니다. alias 는 버전 밖이라(§3.1) 버전과 무관하다

### 4.2 규칙

| 바뀌는 것 | 무엇으로 | 근거 |
|---|---|---|
| FULL · REFRESHER · 비유 · BOUNDARY · 비유 한계선 · 브리지 슬롯 · 저작 메모 — 명제는 그대로 | **버전** | 실물 6건 |
| 명제의 뜻 — 가리키는 대상 · 주장 · 범위 | **새 개념.** 옛 개념은 그대로 둔다 | 확정 §9.5 (evidence 는 leaf 명제 단위). 실물 없음 |
| 명제 하나가 사실 주장 둘이었음이 드러남 | **새 개념들.** split 이 아니다 (§10.3). 그 개념에 독자 기록이 0 이면 옛 개념의 명제를 남은 주장으로 줄일 수 있다 (예외 — §10.3) | 확정 §9.5. 실물 3 — 2026-10-09 (§4.1), 전부 예외 쪽 |
| 명제 문구만 (뜻은 같음) | **미확인** — 실물 없음. 뜻이 같은지는 사람(게이트)이 판정한다 | — |
| 이름 (`canonical_name`) | 버전 아님. 옛 이름은 alias | 라이브러리 규칙 |

**왜 명제가 경계인가**
- 독자의 "알고 있어요" 는 leaf 명제 단위로 받는다 (확정 §9.5). evidence 가 **무엇에 대한** 증거인지를 정하는 것이 명제다
- 명제가 같으면 v1 에서 받은 evidence 는 v3 에서도 같은 것에 대한 증거다. 문안만 나아졌다
- 명제의 뜻을 바꾸면서 버전만 올리면 v1 의 evidence 가 **다른 주장의 증거로 조용히 바뀐다.** 에러는 나지 않는다. §9.5 가 경계한 썩는 방식이 이것이다
- 애매하면 새 개념 (확정 §9.5 "애매하면 잘게 자른다")

**경계에 선 실물 — C-0002 v3.** ④ 를 브리지로 옮기자 명제 후반부("상승률이 내려오는 중이어도 목표보다 높을 수 있다")를 말하는 FULL 문안이 없어졌다 (C-1b 관찰 1).
명제는 그대로라 규칙상 버전이 맞다. 대신 이 명제가 주장 둘을 묶고 있다는 신호다 → **D25: 콘텐츠 레인 C-4 가 판정, 마감 F-3** (§10.3).
**2026-10-09 에 풀렸다 (D32)** — v4 가 명제를 앞 절 하나로 줄였고 후반부는 C-0011 이 됐다 (§4.1)

---

## 5. 문안 필드 (질문 7)

### 5.1 필드 — 라이브러리에 실제로 있는 것

| 필드 | 라이브러리 | 실물 개수 | 독자에게 | 규칙 |
|---|---|---|---|---|
| `proposition` | **명제** | 10/10 | **미확인** — 화면에 나간 실물 없음 | 정체성의 기준 (§4). 시간 독립 (§4.3) |
| `full` | **FULL** | 10/10. 단계가 나뉜 것 1 (C-0002 ①②③) | 보인다 | 단계 1개 이상. 단계 이름("두 가지를 갈라놓기")은 저작용 — 골든은 싣지 않았다 (correction-log 1행, 대안 (b) 미채택) |
| `refresher` | **REFRESHER** | 10/10 | 보인다 | 원자 주장마다 같은 버전의 명제 ∪ FULL 에서 나온다 (린트 ①, D19) |
| `analogies[].text` | **ANALOGY** | 2 (C-0001 `브레이크 페달` · C-0002 `속도계`) | 보인다. 이름은 저작용 | 개념을 먼저, 비유는 뒤에 (§4.4). `requires` 가 있으면 그 뒤에만 (§6) |
| `analogies[].limits` | ⚠️ 비유 한계선 | 3 (C-0001 1 · C-0002 2) | **안 보인다** — 저작 메모 | 비유에 붙는다. 비유가 깨지는 지점 = 다음 단계(중급) 재료 (§4.4). 0.1a FOMC-17 이 물은 "비유와 한계선이 한 단위인가" → 예, 개념 버전 안에서 한 단위 |
| `boundary` | **BOUNDARY** | 1 (C-0010, 2줄) | 보인다 | 줄마다 {경우, 해당 / 해당 없음}. 린트 ① 준용 (C-1b). "반드시 함께 제시" — 무엇과 함께인지 **미확인** (C-1 관찰 4) → Q-C2 |
| `bridge_slots` | 🔗 브리지 메모 | 1 (C-0002 ④) | 슬롯은 안 보인다. 기사가 채운 브리지가 보인다 | §6 |
| `authoring.notes` | ⚠️ 운영 노트 · 🚨 경고 | C-0005 · C-0006 운영 노트, C-0002 · C-0010 🚨 | 안 보인다 | 자유 글. **기계가 지켜야 할 규칙은 여기 두지 않는다** — 규칙이 되면 구조 필드로 올린다: C-0002 🚨 → `requires`, C-0010 🚨 → ConflictingAlias |
| `authoring.reuse_expected` | `reuse_expected` | 3 (C-0007~0009) | 안 보인다 | 린트 ① 이 반례를 찾는 범위로 쓴다 (C-1 절차 3) |
| `authoring.first_source` | `first_source` | 1 (C-0001) | 안 보인다 | 읽는 소비자가 없다 — 저작 메모로 둔다 |
| — | `used_in` | 8/10 | — | **저장하지 않는다.** 발행 패키지에서 계산한다 (§12) |
| — | `prereq` · `prereq_of` | 4 | — | 문안이 아니라 관계다 → ConceptRelation (§9) |

### 5.2 린트가 이 구조에 기대는 곳

- **린트 ① (D19)** — REFRESHER 의 원자 주장마다 명제 ∪ FULL 에서 뒷받침을 찾는다 (C-1 절차 6 → C-1b 에서 명제 ∪ FULL). BOUNDARY 도 같은 기준으로 봤다 (C-1b).
  → 명제 · FULL · REFRESHER · BOUNDARY 는 **따로 꺼낼 수 있는 필드**여야 하고, **같은 버전 안에서** 대조한다. 린트 결과는 (`concept_id`, `version`) 에 붙는다
- **린트 ②** — 시간 지시어. 독자에게 보이는 글(FULL · REFRESHER · 비유 글)만 본다. 저작 메모는 뺀다
  (C-1: 파일 전체를 훑으면 11줄 중 9줄이 메모라 정밀도 1/11).
  → 보이는 필드와 저작 메모가 **구조로 갈려 있어야** 린트 범위가 파서의 추측(빈 줄 · ⚠️ 모양)에 기대지 않는다. 지금 `lint-concepts.py` 는 그 추측으로 가른다
- **시간 독립 (§4.3)** 은 보이는 필드 전부에 걸린다. 저작 메모에는 안 걸린다.
  단 저작 메모가 "기사에 시점 문장을 붙여라" 고 요구하면 그 문장은 브리지의 몫이다 — C-0002 한계선 ① 이 그렇다 → Q-C1

---

## 6. 브리지 슬롯 (질문 5)

### 6.1 실물

C-0002 v3 는 FULL ①②③ 만 갖는다. ④ "지금 상태" 는 기사가 브리지로 붙인다 (D19).
독자가 보는 ①②③④ → 비유 는 **2026-09-18 실제 독자 검증을 통과한 유일한 흐름**이다 (§4.5).

| 어디 | 무엇 |
|---|---|
| 라이브러리 🔗 메모 | "③ 바로 다음에, 현재 상승률을 ③ 의 목표와 견주는 한두 문장을 붙인다 … ④ 를 빼거나 앞으로 옮기지 않는다" |
| 라이브러리 ANALOGY 🚨 | "이 비유는 ①②③ 과 기사의 ④ 브리지를 먼저 제시한 뒤에만 쓴다" |
| 골든 입문 4장 | ③ `blocks[0].paragraphs[0]` → ④ bridge 2 span `paragraphs[1]` (refs 0.2 대기) → 속도계 `paragraphs[2]` |

**빠뜨리면** — 개념 문안만 이어 붙인 기사는 ③ 다음에 곧바로 속도계가 온다. 틀린 문장은 하나도 없다. 그래서 정확성 검사는 못 잡는다.
§4.5 가 말한 실패 그대로다: "한 단계를 건너뛰고도 말이 되면, 그 단계는 독자에게만 없는 것".

### 6.2 자리

```
BridgeSlot { label: "④", after: "③", need: "현재 상승률을 ③ 의 목표와 견주는 한두 문장", why: "2026-09-18 독자 검증 통과 흐름" }
Analogy    { name: "속도계", …, requires: ["①", "②", "③", "④"] }
```

- **개념 버전 안에 있다.** 슬롯을 더하거나 옮기면 버전이 오른다 — C-0002 v3 가 실물이다
- `after` 는 같은 버전 FULL 단계의 `label`. 슬롯 `label` 은 FULL 단계 `label` 과 겹치지 않는다 — 독자 번호(①~④)는 잇되, 개념 문안이 아님을 가른다
- `need` · `why` 는 저작 메모다. 채우는 문장의 모양은 계약이 정하지 않는다 — C-1b 가 "④ 틀"(안 B)을 고르지 않았다. 브리지 형식은 브리지를 다루는 쪽의 일이다
- `requires` — 이 비유 앞에 반드시 있어야 하는 FULL 단계 · 슬롯의 `label`
- 브리지가 슬롯을 어떻게 가리키는지 — (`concept_id`, `version`, 슬롯 `label`) 을 Bridge 가 갖는 모양 → **0.2b**

### 6.3 검사 — 불변식 13

기사 한 레벨의 span 을 읽는 순서로 늘어놓았을 때, 개념 X@v 의 슬롯 S (`after` = A) 에 대해:

1. ConceptRef (X, v, `part` = "FULL:A") 를 가진 span 이 있으면, 그중 마지막 span **바로 다음 span** 이 `bridge` 층이다 (0.2b 이후: 그 Bridge 가 (X, v, S) 를 채운다)
2. `requires` 에 S 가 있는 비유 — ConceptRef (X, v, `part` = "ANALOGY:이름") — 를 가진 span 은 모두 단계 A 뒤에 나온 첫 `bridge` span 보다 뒤에 있다. 단계 A 없이 그 비유를 쓰면 실패다
   (1 과 2 는 따로 본다 — ③ 과 ④ 사이에 무언가 끼면 1 만, ④ 가 없으면 둘 다 걸린다)

- **"바로 다음"** — 라이브러리 문구("③ 바로 다음에")를 그대로 옮겼다. 사이에 `writing` span 하나가 끼어도 실패다. 느슨하게 할 실물이 생기면 다시 본다
- **"옮긴 span" = `part` 로 찾는다 (D25).** 글자가 같을 필요가 없다. 바꿔 말한 ③ 도 `part: "FULL:③"` 이면 ③ 이다
- 게이트 전 초안은 글자 대조로 찾았고, 빈틈이 있었다 — ③ 과 비유를 **둘 다** 바꿔 말하고 ④ 를 빼면 조용히 통과했다.
  `part` 로 바꾼 뒤 같은 사본이 **잡힌다** (0.2a 로그, 망가뜨린 사본)
- **남은 빈틈 — `part: null`.** 바꿔 말한 ③ 에 `part` 를 null 로 달면 규칙 1 이 그 span 을 못 본다. **이것은 게이트 3 이 본다.** 기계가 잡는 것은 글자 그대로인데 `part` 가 틀린 경우뿐이다 (불변식 14)
- **옮기기 전 픽스처** — refs 가 버전 · `part` 없는 `"C-XXXX"` 인 골든은 `part` 가 없으므로 글자 대조로 대신 찾는다. WARN 으로 세고, 골든을 ConceptRef 로 옮기면 사라진다 (§16)
- 이 검사는 게이트 3 을 대신하지 않는다. 브리지 자리에 문장이 있는지만 본다. 그 문장이 ③ 의 목표와 지금을 견주는지는 사람이 본다

---

## 7. 별칭과 충돌 별칭 (질문 4)

### 7.1 `ConceptAlias` — 같은 것의 다른 이름 (확정 §9.5 · 실물 10/10)

- 개념당 2~5개. 한국어와 영어가 섞여 있다. `language` 는 라이브러리에 없다 → 이전 때 채운다
- `source` — 라이브러리 alias 의 괄호가 바로 이것이다: "dynamic pricing(**주법 용례**)" · "personalized algorithmic pricing(**뉴욕 용례**)". 그 이름이 쓰이는 출처 · 맥락.
  괄호 없는 alias 의 `source` 는 기록이 없다 — **미확인**, 이전 때 "concept-library 2026-09" 로 남긴다
- alias 는 버전이 없다 (§3.1)

### 7.2 `ConflictingAlias` — 다른 것의 같은 이름 (확정 §9.5 · 실물 C-0010)

`dynamic pricing` 은 두 정반대 뜻으로 쓰인다.

| 용례 | 뜻 | C-0010 인가 |
|---|---|---|
| 일반 (우버 할증) | 수요 · 공급에 따른 가격 변동 | 아니다 |
| 메릴랜드 HB 895 | 개인화 가격을 가리키는 법률 용어 | 그렇다 |

→ 두 행이 된다.
```
ConceptAlias     { alias: "dynamic pricing", language: "en", concept_id: <C-0010>, source: "주법 용례 (메릴랜드 HB 895)" }
ConflictingAlias { alias: "dynamic pricing", concept_id: <C-0010>,
                   conflicts_with_meaning: "수요·공급에 따른 가격 변동(우버 할증). 이 개념이 아니다" }
```

- 뜻: "이 이름은 이 개념을 가리키기도 하지만, 다른 뜻으로도(더 흔히) 쓰인다"
- 다른 뜻이 라이브러리의 개념이 아닐 수 있다 — 지금 수급 가격 개념은 없다. 그래서 `conflicts_with_meaning` 은 글이다. 다른 뜻의 개념이 생겼을 때 그 ID 를 가리킬지는 실물 없음 — **미확인**
- **Resolver: 충돌 별칭과 일치한 것만으로는 LINK 하지 않는다** (§11). 이 표가 있는 이유 자체다.
  alias 표만 있으면 "dynamic pricing" 을 쓴 우버 할증 기사가 C-0010 에 붙고, 그 기사를 읽은 독자의 evidence 가 개인화 가격에 쌓인다. 에러 없이
- 같은 이름(대소문자 · 공백 무시)이 두 개념 이상의 alias 이거나 다른 개념의 `canonical_name` 과 같으면, 그 개념마다 ConflictingAlias 가 있어야 한다. 충돌 별칭의 이름은 그 개념의 alias 에 있다 (불변식 9). 실물 라이브러리: 겹침 0
- 두 번째 후보 — 뉴욕 용례가 "지불 의향 추정" 을 요건으로 하는지 확인되지 않았다 (C-1b 관찰 5) → Q-C3

---

## 8. Topic 과 leaf KC (질문 6)

- **확정 §9.5**: Topic 과 KC 를 나눈다. **evidence 는 leaf KC 에만.** "알고 있어요" 도 leaf 명제 단위로 받는다
- **라이브러리의 개념은 전부 leaf 다** (도출 시점 10개, 2026-10-09 기준 13개). 모두 명제 하나를 갖는다 — "안다 / 모른다" 를 물을 수 있는 단위다.
  C-0004 `FOMC_ROLE` 은 §9.5 가 leaf 예시로 든 이름과 같다

| code | canonical_name | concept_type | domain | 층 |
|---|---|---|---|---|
| C-0001 | RATE_TO_SPENDING | causal_mechanism | MONETARY | leaf |
| C-0002 | INFLATION_LEVEL_VS_RATE | concept | MONETARY | leaf (도출 시점 명제 둘 묶음 → 2026-10-09 나눔, C-0011) |
| C-0003 | CB_INFLATION_TARGET | institution_rule | MONETARY | leaf (도출 시점 명제 둘 묶음 → 2026-10-09 나눔, C-0012) |
| C-0004 | FOMC_ROLE | entity | MONETARY | leaf |
| C-0005 | VOTERS_VS_PARTICIPANTS | institution_rule | MONETARY | leaf |
| C-0006 | SEP_ROLE | institution_rule | MONETARY | leaf |
| C-0007 | AGENCY_AUTHORITY_LIMIT | civic_structure | REGULATORY | leaf |
| C-0008 | POLICY_STATEMENT_VS_RULE | civic_structure | REGULATORY | leaf |
| C-0009 | FEDERAL_VS_STATE | civic_structure | REGULATORY | leaf |
| C-0010 | PERSONALIZED_PRICING | concept | REGULATORY | leaf |
| C-0011 | INFLATION_FALLING_VS_AT_TARGET | concept | MONETARY | leaf — 2026-10-09 신규 (D32) |
| C-0012 | FED_INFLATION_TARGET_2PCT | institution_rule | MONETARY | leaf — 2026-10-09 신규 (D32) |
| C-0013 | STATE_STRICTER_THAN_FEDERAL | civic_structure | REGULATORY | leaf — 2026-10-09 신규 (D32) |

표는 2026-10-09 의 기록이다. 지금 목록은 `verify-concept-identity.py --report`. C-0009 도 2026-10-09 에 나눴다(→ C-0013). C-0010 · C-0008 의 명제도 두 문장이다 — FTC 기사가 독자에게 갈 때 본다 (D32)

- **도메인은 Topic 이 아니다.** `domain` 필드다 (확정 §9.5 스키마). 라이브러리 규칙 6: "도메인 묶음은 탐색용이며 mastery 를 갖지 않는다". ID 가 없으니 evidence 가 붙을 수 없다
- `domain` 은 개념이 태어난 묶음이지 쓰이는 범위가 아니다 — C-0009 는 REGULATORY 인데 PUBLIC_HEALTH(스크루웜)에서 재사용됐다 (§12.4)
- **Topic 은 실물 없음. 지금 두지 않는다 (D25).** §9.5 의 예(Federal Reserve)뿐이고 쓸 곳이 없다
- **생기면 Concept 밖에 둔다 (D25).** evidence 는 Concept 만 가리키므로 Topic 에 evidence 가 붙을 수 없다 — 검사가 아니라 구조가 막는다.
  Topic 과 leaf 를 잇는 관계는 확정 `relation_type` 셋에 없다. 묶음이 자기 leaf 목록을 갖는 모양이 될 것이다 — 그때 정한다 (§14)
- `concept_type` (관측 5개: causal_mechanism · concept · institution_rule · entity · civic_structure) 은 leaf 인지와 상관없다. entity 인 C-0004 도 leaf 다.
  어휘를 닫을지는 **미확인** — 읽는 소비자가 §12.4 관찰 하나뿐이다
- **0.2c 에 넘기는 제약**: evidence 의 `concept_id` 는 leaf 만 가리킨다. MERGED 개념에는 새로 기록하지 않는다 (§10.2)

---

## 9. 관계 — prerequisite (확정 §9.5)

- `relation_type` — REQUIRED_PREREQUISITE · HELPFUL_PREREQUISITE · RELATED. 범주형
- 방향 — 선행 관계면 `from` 이 `to` 의 선행이다 (`from` 을 알아야 `to` 가 이해된다). RELATED 는 방향 뜻이 없고 한 번만 적는다
- `strength` — **자리만 둔다. 값을 넣지 않는다.** LLM 이 준 수치는 쓰지 않고, 신뢰도는 관측이 정한다 (확정 §9.5). 관측에서 어떻게 정하는지는 이 계약 밖이다
- `source` 누가 적었나 (라이브러리 · 사람 · 모델) · `generator_model` 모델이 제안했으면 그 모델 · `validation_status` 어휘 **미확인**
- **관계는 한 곳에 한 번 적는다.** 실물이 이유다 — 라이브러리는 양쪽에 적는다 (`prereq_of` / `prereq`). 그래서 벌써 두 군데가 어긋났다:
  - C-0001 `prereq_of: C-0003` — C-0003 `prereq` 에는 C-0002 뿐이다
  - C-0006 `prereq: C-0004` — C-0004 에는 `prereq_of` 가 없다
- 실물 관계 (합집합): C-0001→C-0003 · C-0002→C-0003 · C-0004→C-0006. REQUIRED 인지 HELPFUL 인지는 라이브러리에 없다 → Q-C4
- 선행 관계(REQUIRED · HELPFUL)에는 순환이 없다 (불변식 10)
- C-0006 운영 노트 "둘을 함께 다루는 기사에서는 C-0005와 세트로 필요" — RELATED 후보 → Q-C4

---

## 10. status · merge · split

### 10.1 status (확정 §9.5) — PROVISIONAL · MERGED · DEPRECATED 는 실물 없음

| 값 | 뜻 | 실물 |
|---|---|---|
| CANONICAL | 정상 | 10/10 |
| PROVISIONAL | Resolver 가 애매할 때 만든 개념. 파이프라인을 막지 않는다 | **실물 없음** |
| MERGED | 다른 개념으로 합쳐졌다. `merged_into` 가 그 개념 | **실물 없음** |
| DEPRECATED | 새 기사에 쓰지 않는다 | **실물 없음.** 언제 쓰는지 · 그 evidence 를 어떻게 하는지 **미확인** |

- PROVISIONAL → CANONICAL: 사람이 FLAG 를 보고 올린다. 그동안 막지 않는다 (실물 없음)
- CANONICAL · PROVISIONAL → MERGED · DEPRECATED (실물 없음)

### 10.2 merge — 실물 없음

확정 §9.5 순서: B → `merged_into` A (redirect) · evidence 를 A 로 remap · `interaction_id` 로 중복 제거 · 사용자 상태를 로그에서 다시 셈한다.
합산하지 않는다 — 같은 interaction 이 두 중복 개념에 기록됐을 수 있다.

이 계약이 정하는 것 (구조만):
- B.`status` = MERGED, B.`merged_into` = A. redirect 를 따라가면 순환 없이 MERGED 아닌 개념에서 끝난다
- **B 의 것은 아무것도 지우거나 옮기지 않는다** — 버전 · alias · 관계 · `code`. merge 가 되돌릴 수 있어야 하기 때문이다 (§9.5 "merge 는 되돌릴 수 있다"). 푸는 쪽이 redirect 를 따른다
- 발행된 ConceptRef (B@v) 는 고치지 않는다. B@v 문안도 그대로 남는다 (§3)
- 새 기사는 MERGED 개념을 가리키지 않는다 (불변식 12). 새 evidence 도 B 에 기록하지 않는다 (0.2c 제약)
- 0.2c 가 정할 것 — remap 을 원장에 쓸지 읽을 때 할지, remap 뒤 `content_version` 이 B 의 버전을 가리키는 문제
- 절차 세부 (누가 · 언제 · 되돌리는 방법) — 실물 없음, **미확인**

### 10.3 split — 없다 (실물 없음)

확정 §9.5: split 은 불가능하다. 자기보고 evidence 를 여러 자식 중 어디로 보낼지 정할 방법이 없다.

- 이 계약에는 split 연산이 없다. **어떤 연산도 한 개념의 evidence 를 여러 개념으로 나누지 않는다**
- 한 개념이 사실 둘이었다고 드러나면 새 leaf 개념을 만든다. 옛 개념과 그 evidence 는 그대로 둔다. 옛 개념을 DEPRECATED 로 둘지 등 절차는 **미확인**
- **지금은 예외다.** evidence 가 아직 0 이다 (0.2c 전, 독자 기록 없음). 지금 명제를 나누는 것은 split 이 아니라 문안 편집이다.
  가장 싼 시점이 지금이고, 첫 evidence 가 기록되는 순간 끝난다
- **이 계약은 명제를 나누지 않는다.** D25: 나눈다(기본값, §9.5 "애매하면 잘게 자른다"). **콘텐츠 레인 C-4 가 판정한다** — C-4 가 초안, 도윤이 문안 선택.
  **마감 F-3 (첫 실제 독자 기록 = 첫 evidence) 전.** 대상 C-0002 · C-0003 · C-0009(약). **2026-10-09 에 끝났다 (D32 · §4.1).**
  마감의 정확한 뜻은 "그 개념의 첫 KnowledgeEvidence 줄"이다 (D30).
  제약: 독자가 보는 4단계 흐름(①②③④ → 비유)은 바뀌지 않는다 — 나누는 것은 KC 의 경계이지 독자 글이 아니다.
  C-0002 를 나누면 둘째 주장("내려오는 중이어도 목표보다 높을 수 있다")의 FULL 이 새로 필요하다 (지금은 ④ 브리지가 말한다)
- 애매하면 잘게 자른다 (확정 §9.5 · 라이브러리 규칙 5)

---

## 11. Resolver · ConceptCandidate — 실물 없음

기사가 언급한 개념을 라이브러리에 붙이는 단계 (파이프라인 A). 지금 10개는 사람이 만들었다. Resolver 가 만든 개념은 없다.

| 구간 | 판정 | 동작 |
|---|---|---|
| HIGH | 확실한 매칭 | LINK — 기존 개념 |
| AMBIGUOUS | 애매함 | PROVISIONAL 개념 생성 + FLAG. **파이프라인을 막지 않는다** |
| LOW | 명백히 새로움 | CREATE — 새 개념 |

- 구간을 가르는 값은 두지 않는다 — 확정 §9.5 가 미정으로 두었다 (embedding 모델마다 분포가 다르다, validation set 으로 정한다). CLAUDE.md: 하드코딩 금지
- 보는 것: label + definition + graph neighborhood + article usage context. 유사도 하나만 보지 않는다 (확정 §9.5)
- 충돌 별칭과 일치한 것만으로는 HIGH 가 아니다 (§7.2)
- MERGED 개념에 매칭되면 redirect 를 따라간 개념에 LINK 한다
- ConceptCandidate 필드는 §1 (확정 §9.5). `status` 어휘 · embedding 모델 **미확인**. `match_score` 는 기록일 뿐, 이 계약은 그 값으로 아무것도 정하지 않는다
- AMBIGUOUS 가 만든 PROVISIONAL 에도 만들 때 `code` 를 붙인다 (D25 · §2)

---

## 12. ARTICLE_PACKAGE 와의 짝 (질문 8)

이 계약이 Concept 의 주인이다. ARTICLE_PACKAGE 는 span 을 갖고, 이 계약은 span 이 가리키는 것을 갖는다.

| ARTICLE_PACKAGE §6 | 이 계약 |
|---|---|
| `layer: "concept"` — 개념 설명 | span 이 설명하는 개념 |
| `refs` — "Ref 의 모양은 0.2" | concept 층의 Ref = **ConceptRef** `{ concept_id, version, part }` (§3.2 · §3.3). 1개 이상. 다른 층의 Ref 는 0.2b |
| "span 하나에 layer 하나. refs 는 그 층의 atom 만" | concept 층 refs 에는 ConceptRef 만 |

- **span 글은 라이브러리 문안과 같지 않아도 된다.** 실물: 골든 concept span 21 중 16 은 라이브러리 문장 그대로, 5 는 아니다 — 헤드라인 3("연준이 보는 건\n물가가 아니라 속도예요" 등) · 대조 항목 2("연준이 원하는 속도" · "2%"). 기사는 재료로 새로 쓴 글이다 (§4.2)
- 한 span 이 개념 둘을 가리킬 수 있다 — 실물: 입문 4장 헤드라인 → C-0002 · C-0003. ConceptRef 마다 `part` 가 따로다
- 글자가 달라도 문안을 재료로 썼으면 `part` 를 단다 (§3.3). 헤드라인 요약처럼 문안을 옮기지 않은 언급은 `part: null`
- **반대로, 라이브러리 문안을 그대로 옮긴 span 은 concept 층이고 그 개념을 그 `part` 로 refs 에 갖는다** (불변식 14). 골든 16 span 모두 층 · 개념이 맞다
- **발행할 때** (불변식 12) — 가리킨 (`concept_id`, `version`) 이 있고, `part` 는 그 버전에 있는 문안 이름이거나 null 이며, 그 개념은 leaf 이고 status 가 CANONICAL 또는 PROVISIONAL
- **발행한 뒤** — 패키지의 ConceptRef 는 바뀌지 않는다. 개념이 MERGED · DEPRECATED 가 되어도 패키지는 유효하다. 고정한 버전의 문안이 남아 있기 때문이다 (§3.1)
- **`used_in` 은 저장하지 않는다.** 발행 패키지의 ConceptRef 에서 계산한다.
  실물: 라이브러리 재사용 표는 FOMC 가 C-0001~0006 을 만들었다고 하는데, C-0004 · C-0006 에는 `used_in` 이 없다. 두 곳에 적으니 벌써 어긋났다
- 프론트는 concept 층 표시만 있으면 그린다 (ARTICLE_PACKAGE §6). ConceptRef 를 풀어 개념을 펼쳐 보여주는 경로는 이 계약 밖이다
- 브리지 — 패키지의 `bridge` span 과 개념의 BridgeSlot 이 짝이다 (§6). Bridge 가 슬롯을 가리키는 모양은 0.2b

---

## 13. 불변식

(기계) 지금 `scripts/verify-concept-identity.py` 가 확인 · (0.4) 저장이 생기면 · (0.2c) 그쪽 계약이 받는다 · (게이트) 사람

1. `concept_id` 는 UUID 다. 바뀌지 않고 재사용되지 않는다 (0.4)
2. `code` 는 `C-` + 숫자 4자리 이상이고 유일하다. 바뀌지 않고 재사용되지 않는다 (기계: 형식 · 유일)
3. `canonical_name` 은 유일하다. 바뀌면 옛 이름이 alias 가 된다 (기계: 유일)
4. `status` 는 네 값 중 하나. `merged_into` 는 MERGED 일 때만 있다. redirect 는 순환 없이 MERGED 아닌 개념에서 끝난다 (기계: 값. 나머지 0.4)
5. 버전은 1부터 1씩 빠짐없이 있고, 한 번 만들면 고치지 않는다. `Concept.version` = 최대 버전. 버전마다 날짜 · 변경 한 줄 · 근거가 있다
   (기계: 라이브러리 CHANGELOG 에 v2 ~ vN 이 다 있고 현재 버전 날짜가 맞다)
6. 한 개념의 버전 사이에 명제의 뜻이 같다 (게이트. 명제 문구가 바뀐 버전은 기계가 골라 올린다 — 0.4)
7. 버전마다 명제 · FULL(단계 1개 이상) · REFRESHER 가 있다 (기계)
8. 브리지 슬롯의 `after` 는 같은 버전 FULL 단계에 있고, 슬롯 `label` 은 단계 `label` 과 겹치지 않는다. 비유의 `requires` 는 단계 · 슬롯 `label` 만 가리킨다 (기계)
9. 정규화한 이름이 두 개념 이상의 alias(또는 다른 개념의 `canonical_name` · `code`)이면 그 개념마다 ConflictingAlias 가 있다. ConflictingAlias 의 이름은 그 개념의 alias 에 있다 (기계)
10. 관계의 양 끝이 있다. 선행 관계에 순환이 없다. 한 쌍은 한 번 적는다 (기계: 양 끝 · 순환. 한 번 — 라이브러리는 양쪽에 적으므로 어긋난 곳을 WARN)
11. evidence 는 leaf 에만 기록한다. MERGED 개념에는 새로 기록하지 않는다 (0.2c)
12. 발행물의 concept 층 refs 는 ConceptRef 이고, 가리킨 (`concept_id`, `version`) 이 있고, `part` 는 그 버전의 문안 이름이거나 null 이며, 발행 때 그 개념은 leaf · CANONICAL 또는 PROVISIONAL 이다. 발행 뒤 고치지 않는다
    (기계: 모양 · 개념 · 버전 범위 · 현재 버전의 `part` 이름. "C-XXXX" 모양은 골든을 옮기기 전까지 WARN 으로 센다)
13. 브리지 슬롯 순서 — §6.3 (기계: `part` 로. "C-XXXX" 픽스처는 글자 대조로 대신. `part: null` 로 빠져나가는 것은 게이트 3)
14. 라이브러리 문안을 그대로 옮긴 span 은 concept 층이고, 그 개념을 refs 에 가지며, 그 ConceptRef 의 `part` 가 그 문안이다 (기계)
15. `used_in` 은 저장하지 않는다 (0.4)

---

## 14. 미확인

| 항목 | 이유 |
|---|---|
| 명제가 독자 화면에 나가는가 | 실물에 없다. "알고 있어요" 버튼(§9.5)이 명제 글을 보여줄지는 UI 가 정한다 |
| 명제 문구만 고치는 버전 | 실물 없음. 6건 모두 명제 불변 |
| BOUNDARY "반드시 함께 제시" 의 상대 | 라이브러리가 적지 않았다 (C-1 관찰 4) → Q-C2 |
| 괄호 없는 alias 의 `source` | 기록 없음 |
| `concept_type` 어휘를 닫을지 | 소비자가 §12.4 관찰 하나 |
| 충돌 별칭의 다른 뜻을 개념 ID 로 가리킬지 | 다른 뜻의 개념이 아직 없다 |
| `validation_status` · candidate `status` 어휘 · embedding 모델 | 확정 §9.5 가 이름만 두었다. 실물 없음 |
| DEPRECATED 를 언제 쓰고 그 evidence 를 어떻게 하는지 | 실물 없음 |
| merge · 새 개념으로 나누기의 절차 세부 | 실물 없음 |
| 옛 버전(v1 · v2) 문안을 저장소로 옮길지 | 발행물이 아직 없어 가리키는 것이 없다. 필요해지면 git 3판에서 꺼낸다. 그 전에는 옛 버전을 가리킨 `part` 를 기계가 확인하지 못한다 (WARN) |
| Topic — 모양 · leaf 와 잇는 방법 | 지금 두지 않는다 (D25). 생기면 Concept 밖. 확정 `relation_type` 셋에 묶음 관계가 없어 그때 정한다 |

---

## 15. _open — 판정됨 → D25

2026-09-30 게이트. 판정자 PM (도윤 위임). 판단 순서 ① 독자 ② 기술.

| # | 무엇 | 판정 | 계약에서 |
|---|---|---|---|
| _open-1 | ConceptRef 가 어느 문안까지 가리키나 | 판정됨 → D25: **(b) `part` 추가**. 브리지 검사를 `part` 로. `part: null` 로 빠져나가는 것은 게이트 3 | §1 · §3.3 · §6.3 · §12 · §13-12~14 |
| _open-2 | PROVISIONAL 에도 `code` 를 붙이나 | 판정됨 → D25: **(a) 만들 때 붙인다** | §1 · §2 · §11 |
| _open-3 | Topic 을 어디에 두나 | 판정됨 → D25: **(c) 지금 두지 않는다. 생기면 Concept 밖에** | §8 · §14 |
| _open-4 | 첫 evidence 전에 명제를 나눌 것인가 | 판정됨 → D25: **나눈다 (기본값). 계약은 나누지 않는다 — 콘텐츠 레인 C-4 가 판정, 마감 F-3 (첫 evidence 전)** | §4.2 · §8 · §10.3 |
| — | 이름 옮김 (UUID = `concept_id`, "C-0002" = `code`) | 판정됨 → D25: **수용** | §2 |

### 콘텐츠 레인 질문 → C-4 (D25) — 계약 모양은 안 바뀐다. 라이브러리를 옮길 때 답이 있어야 한다

**판정됨 → D32 (2026-10-09).** Q-C1 저작 메모(슬롯 아님 — BridgeSlot 에 "after 없음"은 필요 없다) · Q-C2 FULL · REFRESHER 둘 다와 함께 · Q-C3 **미확인으로 남음**(FTC 기사 1차 대조 때) ·
Q-C4 종류는 라이브러리 "선행 관계 — 후보" 표대로(후보일 뿐) · Q-C5 alias 뺌 · Q-C6 10개(스크루웜 3개는 이름뿐이라 넣지 않는다). 아래 표는 물음의 기록이다.

| # | 질문 | 출처 |
|---|---|---|
| Q-C1 | C-0002 비유 한계선 ① "쓸 때마다 현재 전망상 목표 복귀 시점을 한 문장으로" — 두 번째 브리지 슬롯(자리 제약 없이 필수)인가, 저작 메모인가. 골든은 5장 뒤에 `claim`(대기 DerivedClaim)으로 있다. 슬롯이면 BridgeSlot 에 "after 없음" 이 필요하다 — 그때 계약을 고친다 | C-1 빈틈 D · C-1b 안 B #6 |
| Q-C2 | C-0010 BOUNDARY "반드시 함께 제시" — FULL 과만인가, REFRESHER 와도인가 | C-1 관찰 4 |
| Q-C3 | "personalized algorithmic pricing(뉴욕 용례)" 가 지불 의향 추정을 요건으로 하나. 아니면 두 번째 충돌 별칭 | C-1b 관찰 5 |
| Q-C4 | 선행 관계 3개의 REQUIRED / HELPFUL. C-0003 쪽에 C-0001 이 빠진 것은 누락인가 의도인가. C-0005 ↔ C-0006 을 RELATED 로 둘지 | §9 |
| Q-C5 | C-0005 alias "12명 18명" — 18 은 한 회의의 값이다. alias 로 둘지 | C-1b 관찰 2 |
| Q-C6 | FINDINGS §12.4 는 스크루웜에서 신규 개념 3개를 만들었다고 하는데 라이브러리에 없다. 옮길 대상이 10개인가 13개인가 | §12.4 ↔ 라이브러리 |

---

## 16. 라이브러리 → 이 계약 — 옮겼다 (0.2m-a · 2026-10-09)

**옮긴 결과**
- 저장소 `docs/content/concept-library.json` — Concept · ConceptVersion · ConceptAlias · ConflictingAlias · ConceptRelation 이 §1 모양 그대로. 개념마다 `concept_id`(UUID) 발급
- `docs/content/concept-library.md` 는 사람이 읽고 쓰는 면으로 남는다. 개념마다 `concept_id` 줄에 같은 UUID. **md 의 문안을 고치면 저장소에 새 버전을 만들어야 한다** —
  검사가 md 와 저장소의 독자 글을 글자 단위로 댄다 (`verify-concept-identity.py` 의 STORE_TEXT · 이전 전후 대조는 `compare-concept-text.py`)
- 버전마다 문안 한 벌은 **지금 버전만** 옮겼다 (§14). 옛 버전은 이력 줄(날짜 · 변경 · 근거)만 저장소의 `_version_history` 에 있다
- alias `language` 는 글자로 채웠다(한글이 있으면 `ko`, 아니면 `en`). 괄호 없는 alias 의 `source` 는 "concept-library 2026-09"
- 관계는 라이브러리 "선행 관계 — 후보" 표에서 한 쌍에 한 번. `validation_status` 는 어휘가 미확인이라 실물의 말 그대로 `"후보"` 를 적었다 (§14)
- `used_in` 은 옮기지 않았다 (계산한다)
- 아래 표들은 **옮기기 전에 세운 목록의 기록**이다 (도출 시점 10개 기준). 지금 것은 `python3 scripts/verify-concept-identity.py --report`

### 옮기기 전 목록 (기록)

### 10개 공통
| 라이브러리 | 계약 | 바뀜 / 빠짐 |
|---|---|---|
| `### C-0002 · \`KEY\`` | `code` + `canonical_name` | **UUID 를 새로 발급** (`concept_id`). code 값은 그대로 |
| 도메인 절 제목 | `domain` | 절 위치 → 필드 |
| `type` | `concept_type` | 이름만 |
| `status` | `status` | 그대로 (전부 CANONICAL) |
| `version: vN (날짜)` + CHANGELOG 한 줄 | Concept.`version` + ConceptVersion (`created_on` · `change` · `basis`) | 현재 버전 스냅숏 하나씩. 옛 버전 문안은 발행물이 없어 지금은 옮기지 않는다 (§14) |
| `aliases` | ConceptAlias | `language` 채움. 괄호 → `source` |
| `prereq` · `prereq_of` | ConceptRelation | 합집합으로 **한 번씩**. `relation_type` 사람 판정 (Q-C4). `source` = 라이브러리 |
| `used_in` | — | **버린다.** 계산한다 |
| `first_source` · `reuse_expected` · ⚠️ 운영 노트 · 🚨 | `authoring` | 저작 메모로 |

### 개념별
| code | 바뀌는 것 | 확인할 것 |
|---|---|---|
| C-0001 | 비유 `브레이크 페달` + 한계선 1 · `prereq_of` → 관계 1 · `first_source` → 메모 | C-0003 쪽 선행 표시 없음 (Q-C4) |
| C-0002 | FULL 단계 ①②③ (이름 3 → `title`, 저작용) · 🔗 → BridgeSlot ④ after ③ · 🚨 → 비유 `requires` ①②③④ · 한계선 2 · FULL 머리 문구 "독자에게는 반드시 4단계로" → 슬롯이 대신 말한다 | C-4 명제 나누기 (D25) · Q-C1 |
| C-0003 | `prereq` → 관계 | C-4 명제 나누기 (D25) · Q-C4 |
| C-0004 | `used_in` 이 없다 — 재사용 표와 어긋남, 계산으로 풀린다 | — |
| C-0005 | 운영 노트 → 메모 | Q-C5 |
| C-0006 | `prereq` → 관계 · 운영 노트 → 메모 · `used_in` 없음 (C-0004 와 같다) | Q-C4 |
| C-0007 · C-0008 | `reuse_expected` → 메모 | — |
| C-0009 | `reuse_expected` → 메모 | C-4 명제 나누기 (약, D25) |
| C-0010 | BOUNDARY 2줄 → {경우, 해당} · alias 괄호 2 → `source` · `dynamic pricing` → ConflictingAlias · 🚨 용어 충돌 경고 → 메모 (규칙은 ConflictingAlias 가 맡는다) | Q-C2 · Q-C3 |

### 골든
- concept span 21 의 refs 22개 `"C-XXXX"` → ConceptRef: **C-0001@1 · C-0002@4 · C-0005@3 · C-0012@1** (D32 — §3.2. 도출 시점의 목록은 C-0002@3 · C-0003@1 이었다)
- `part` — 글자 그대로인 16 span 은 검사 C 가 찾은 그대로: C-0002 `FULL:①` 4 · `FULL:②` 3 · `FULL:③` 2 · `ANALOGY:속도계` 2 · C-0001 `FULL` 3 · C-0005 `REFRESHER` 2.
  나머지 5 span(헤드라인 3 · 대조 항목 2)은 옮길 때 판정한다 — 바꿔 말한 문안이면 그 `part`, 요약 언급이면 null (§3.3).
  예: 입문 5장 헤드라인 "금리는 그 차의 브레이크예요" 는 C-0001 비유 `브레이크 페달` 을 바꿔 말한 것으로 보인다
- 입문 4장 브리지 2 span — Bridge 가 (C-0002, v4, ④) 를 채운다 (DATA_MODEL §8)

### 다른 곳 (이 계약을 따라 바뀔 것)
| 어디 | 무엇 | 누가 |
|---|---|---|
| ARTICLE_PACKAGE §1 · §6 `refs: Ref[]` "Ref 의 모양은 0.2" | concept 층 = ConceptRef (이 계약). 층별 Ref 유니언은 0.2b 가 Fact · Claim · Bridge 를 정할 때 같이 | 백엔드 0.2b |
| ARTICLE_PACKAGE §0 "`Ref`(ID)로만 가리킨다" | ConceptRef 는 ID 하나가 아니라 `{ concept_id, version, part }` 다 — 문구가 안 맞는다 (0.2a 게이트 반영 로그) | ARTICLE_PACKAGE 수정 (따로) |
| `packages/contract/src/types.ts` `Ref = string` · `validate.ts` `SPAN_REFS` | ConceptRef 는 문자열이 아니다. 골든을 옮기면 프론트 검증기가 `SPAN_REFS` 로 거부한다. 프론트는 refs 를 읽지 않으므로 모양 검사만 풀면 된다 | 골든 이전 전에 프론트 레인 |
| `scripts/verify-article.py` | concept refs 를 `C-\d{4}` 문자열로 본다 → ConceptRef | 골든 이전 때 |
| `scripts/lint-concepts.py` | 라이브러리 md 의 빈 줄 · ⚠️ 모양으로 본문과 메모를 가른다 → 구조 필드 | 저장이 생기면 |
| FINDINGS §4.5 "수정본은 C-0002 참조" | v3 라이브러리에는 3단계뿐이다. 4단계 전체는 골든 입문 3·4장 (C-1b 관찰 4) | PM |

---

## 17. _open — 0.2m-a (게이트 대기)

2026-10-09 이전(0.2m-a)에서 나온 것. 판정 전이다. 번호는 `_open-m` — §15 의 것과 다른 묶음이고 DATA_MODEL §19 와 이어 센다.

| # | 무엇 | 실물 · 계약이 말하는 것 | 정해야 하는 것 |
|---|---|---|---|
| _open-m2 | 독자 글이 아닌 것(저작 메모 · 제시 규칙)만 바뀌어도 버전이 오르나 | **계약 글자로는 오른다** — ConceptVersion 은 `authoring` 까지 품은 스냅숏이고(§1 · §3.1) §4.2 표가 저작 메모를 "버전" 줄에 둔다. **실물은 올리지 않았다** — C-0010 은 v2 인 채로 BOUNDARY 제시 규칙("FULL · REFRESHER 둘 다와")과 운영 노트 2 가 들어왔다 (C-4 · D32). 이 개념을 가리키는 발행물 · 독자 기록이 없어 지금은 해가 없다. alias 를 뺀 것(C-0005 "12명 18명")은 물음이 아니다 — alias 는 버전 밖이다 (§3.1 · §7.1) | (a) 저작 메모를 버전 밖(개념에 붙는 것)으로 뺀다 (b) 계약대로 올린다. 저장소는 실물대로 v2 에 지금 내용을 담았다 |
| _open-m3 | 명제가 바뀐 버전의 사유를 담을 칸 | 실물 3 (§4.1). 지금은 `basis` · `change` 글에 "evidence 0 예외"로 적혀 있다. 불변식 6("버전 사이에 명제의 뜻이 같다")은 이 3건에서 깨져 있고, 예외임을 기계가 알 방법이 없다. 옛 버전의 명제 글도 저장소에 없다 (§14) | 칸을 둘지(모양은 실물 3건 말고 근거가 없다) · 불변식 6 에 "그 개념의 독자 기록이 0 일 때만" 을 넣고 원장으로 확인할지 (0.4) |
| _open-m4 | BOUNDARY 가 FULL · REFRESHER 와 함께 나왔는지의 검사 (Q-C2) | 규칙은 D32 가 정했다(둘 다와 함께). 그런데 그 규칙이 사는 곳이 라이브러리의 머리 글(`authoring.notes`)뿐이다 — §5.1 "기계가 지켜야 할 규칙은 여기 두지 않는다. 규칙이 되면 구조 필드로 올린다". **검사는 만들지 않았다** — C-0010 을 쓰는 패키지가 없어(FTC 는 골든이 없다) 돌려 볼 실물이 없다 | 구조 칸의 모양 (비유의 `requires` 처럼) · 검사는 C-0010 을 쓰는 첫 패키지에서 |
| _open-m5 | 입문 4장 ③ 두 span 에 C-0012 참조를 더할지 (D32 1-2) | 더하지 않았다 — ③ 의 글은 C-0002 FULL ③ 그대로이고 `part` 는 "무엇을 재료로 썼나"다(§3.3). C-0012 의 문안을 옮긴 span 은 골든에 없다. **그 결과**: OBSERVATION §4.2 로 셈하면 입문에서 C-0012 는 SKIP 이다(헤드라인 · 대조 항목의 `part: null` 언급뿐) — 독자는 "연준의 목표는 2%"를 ③ 에서 배웠는데 기록은 C-0002 에만 간다 | (a) 그대로 (b) ③ span 에 C-0012@1 을 `part: null` 로 더한다 — 그래도 SKIP 이다 (c) 한 문안이 두 개념의 명제를 말할 때의 규칙을 정한다. 첫 KnowledgeEvidence 줄 전에 |
