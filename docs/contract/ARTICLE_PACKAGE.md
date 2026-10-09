# ARTICLE_PACKAGE

## CHANGELOG
| 날짜 | 변경 | 세션 |
|---|---|---|
| 2026-09-20 | 생성 (빈 껍데기) | PM |
| 2026-09-28 | 초안 — 골든(FOMC)과 FTC observed 에서 도출. **도윤 게이트 전** | S3 · B-0.1a |
| 2026-09-29 | 게이트 반영 (D20) — `scale` 제거(원형 5) · 판단 색 금지 · 순서 목록 간격 · open_question 형태 자유 · 레벨 어휘 3단계 · 층 판정 규칙 · 픽스처의 0.2 대기 표시 | S3 · B-0.1a |
| 2026-09-29 | D22 반영 — 이란 규칙은 사실 서술 문장에만(전망 문장은 `claim`, `need: "DerivedClaim"`) · `Level.label` 제거 | S3 · B-0.1a |
| 2026-09-30 | 참조 문구를 DATA_MODEL · CONCEPT_IDENTITY 에 맞춤 — §0 저장 구조의 주인 · §1 `event_ref: EventRef`, `refs` 원소는 층이 정한다 · §6 층별 Ref 표 · 골든 층 수를 0.1b 이후로(concept 20 → 21 등) · §6.2 대기의 행선지. 규칙은 안 바뀜 | B-0.2b |
| 2026-10-09 | D27 반영 — `event_ref` 는 Event 의 UUID (골든의 문자열은 code). 참조 문구만 | B-0.2b |
| 2026-10-09 | D30 반영 — §2 · §10 "패키지 자체의 ID" 가 DATA_MODEL §11 (ArticleRecord `article_id` · `article_version`)을 가리키게. 가리키는 문구만 | B-0.2c |

> **상태: 게이트 통과 (D20 · D22, 2026-09-29).**
> 근거는 두 실물뿐이다 — `fixtures/fomc-2026-09.article.json`(골든, 주 입력), `fixtures/ftc-2026-08.observed.json`(블록 모양만).
> 둘에 없는 것은 넣지 않았다. **미확인** = 두 실물에 근거가 없다. 편집 판단이 걸렸던 _open 5개는 D20 이 판정했다(§11).
> 골든은 아직 이 모양이 아니다. 맞추는 일은 Step 0.1b 다(§12).

---

## 0. 범위

Article Package = 백엔드가 프론트에 넘기는 완성 기사 한 벌.

- **모든 사용자에게 같다.** 레벨을 전부 담아 보낸다. 누구에게 어느 레벨을 보여줄지는 개인화이고 이 문서 밖이다
  (FINDINGS §3.3 — Fact Graph 는 하나이고, 전면에 내세우는 사실이 다를 뿐이다)
- **발행 후 바뀌지 않는다.** 읽는 시점에 따라 달라지는 값이 없다 (D8 규칙 1)
- **넣는 것** — 프론트가 받아서 그리는 데 필요한 것: 읽는 순서, 글, 블록 구조, 문장마다 출처 층(§8.4)
- **안 넣는 것**
  - Fact · Claim · Bridge · Storyline · Event · Source 의 저장 구조 → **DATA_MODEL**, Concept → **CONCEPT_IDENTITY**.
    여기서는 참조(Ref)로만 가리킨다. 참조 모양은 층마다 다르다(§6) — 키 하나인 것(FactRef · ClaimRef · BridgeRef · EventRef)도 있고,
    버전과 문안까지 가리키는 것(ConceptRef `{ concept_id, version, part }`)도 있다
  - probe, 개인화(레벨 선택·기본값), 사용자 상태(진행·완독), D18
  - 프론트 UI — 브랜드, 레벨 전환 버튼, 진행바, 장수 표시, 스크롤·키보드, 마지막 장의 버튼(`end_actions`)
  - 저작 데이터 — D8 공식·불변식·as_of, 교정 이력 (§8)

---

## 1. 한눈에

```ts
ArticlePackage {
  event_ref:    EventRef         // DATA_MODEL §2 — Event 의 UUID (D27). 골든의 "FOMC-20260916" 은 그 Event 의 code — 0.2m 에서 UUID 로
  title:        string           // 기사 제목
  lang:         "ko"
  published_at: Date             // D8 DERIVED 의 기준 시각. 발행 시각 정책은 D6(OPEN)
  levels:       Level[]          // 1개 이상
}

Level {
  id:             "basic" | "intermediate" | "advanced"   // D20. 기사마다 1~3개, 겹치지 않는다
  slides:         Slide[]        // 1개 이상. 배열 순서 = 읽는 순서
  open_questions: OpenQuestion[] // 길이 = slides.length − 1
}

Slide {
  kicker:   string               // 서사 기능 라벨. 표시 문자열 하나
  headline: RichText             // \n 은 작가가 정한 줄바꿈
  blocks:   Block[]              // 1개 이상
}

OpenQuestion { text: string }    // open_questions[i] 는 slides[i] 와 slides[i+1] 사이에 있다

RichText = Span[]
Span {
  text:  string                  // 인라인 서식은 <b>…</b> 와 \n 둘뿐
  layer: "fact" | "claim" | "concept" | "bridge" | "writing"
  refs:  Ref[]                   // 원소 모양은 층이 정한다 (§6 표). writing 이면 [], 나머지는 1개 이상
}                                // 픽스처에서만: _refs_pending { until: "0.2", need } — §6.2. 발행물엔 없다

Block = Prose | Quote | List | Contrast | Sheet     // 원형 5개 (D20)
// 모든 블록 공통: { type: string, text: string }   text = 정규 텍스트 = linearize(block)
```

---

## 2. 패키지

| 필드 | 뜻 | 근거 |
|---|---|---|
| `event_ref` | 이 기사가 다루는 사건. 모양은 0.2 | 골든 `event_hint` |
| `title` | 기사 제목. 브랜드("Claro — ")는 빼고 프론트가 붙인다 | 두 프로토타입의 `<title>` |
| `lang` | `"ko"` | 두 프로토타입 `lang="ko"` |
| `published_at` | DERIVED 값("201일째", "올해")이 계산된 기준 시각 (§8) | 골든 `_published_at` · D8 |
| `levels` | 레벨 배열 (§3). 1~3개 (D20) | 골든 2개, FTC 1개 |

패키지 자체의 ID·버전은 두지 않는다 — 판을 가리키는 키는 ArticleRecord 의 `article_id` · `article_version` 이다 (DATA_MODEL §11 · D30).

---

## 3. 레벨 — 필터가 아니라 별도 선택 (FOMC-12)

- 레벨마다 `slides` 와 `open_questions` 를 **통째로** 갖는다. 다른 레벨의 슬라이드를 참조하거나 공유하지 않는다
  - 근거: 숙련은 입문의 부분집합이 아니다. 양쪽 다 상대에 없는 사실을 갖는다 (S1, FINDINGS §8.3)
- 레벨끼리 공유하는 것은 Fact Graph 뿐이다 — 같은 사실은 같은 `Ref` 로 가리킨다 (§3.3)
- 같은 사실·같은 원문을 레벨마다 다른 글로 쓸 수 있다. 인용도 레벨마다 다르게 자를 수 있다 (FOMC-11).
  원문의 어느 구간인지는 Fact 의 일 → 0.2
- **`id` 는 `basic` · `intermediate` · `advanced` 셋 중 하나다 (D20).** FINDINGS §9.3 의 3단계(입문 · 중급 · 숙련)와 같은 말이다 —
  독자가 고르는 단계와 기사의 단계가 같은 어휘를 쓴다. 골든의 `adv` 는 `advanced` 가 된다
- **레벨의 표시 이름(입문 · 중급 · 숙련)은 패키지에 없다 (D22).** 프론트가 `id` 에서 한 곳에서 정한다.
  발행된 패키지는 바뀌지 않아서(§0) 이름을 넣어 두면, 나중에 이름을 바꿀 때 옛 기사만 옛 이름을 영원히 갖는다
- 기사는 레벨 1~3개. 한 기사 안에서 `id` 는 겹치지 않고, 배열은 basic → intermediate → advanced 순서다. 배열 순서 = 전환 UI 에 놓는 순서
- **레벨이 하나인 기사를 허용한다** — FTC 가 실제로 그랬다 (FTC-15). 그 레벨의 `id` 는 **그 기사가 쓰인 레벨**이다(FTC = `basic`).
  `"only"` 같은 별도 값은 쓰지 않는다. 레벨이 하나인지는 `levels.length == 1` 로 안다 — 이때 프론트는 전환 UI 를 그리지 않는다
- 기사마다 레벨을 몇 개 만들지는 D21 (OPEN) 이 정한다. 계약은 1~3개를 모두 받는다
- 어느 레벨을 먼저 보여줄지는 개인화 — 범위 밖

---

## 4. 슬라이드 (D13)

- 슬라이드와 블록은 2층이다. 슬라이드 = `kicker` · `headline` · 블록 1개 이상
- 순서는 배열 순서다. `index` 필드는 두지 않는다 — 위치에서 나온다
- **장수는 `slides.length` 다. 저장하지 않는다** (FOMC-10). open_question 은 장수에 들어가지 않는다 —
  D17 로 질문이 따로 한 화면을 차지하게 되더라도 마찬가지다. 진행바와 "3/7" 이 무엇을 세는지는 프론트
- `kicker` — **표시 문자열 하나** (FOMC-4)
  - 관측된 세 기능(서사 역할 · 출처 라벨 · 개념 표시) 중 **개념 표시는 span 의 `layer: concept` + `refs` 가 맡는다**.
    0.0b 게이트가 ①①② 대신 ①②③ 을 골랐다 = kicker 의 번호는 개념 ID 가 아니라 독자용이다
  - 서사 역할("첫 번째 반전", "핵심")과 출처 라벨("9월 SEP")은 둘 다 독자에게 보이는 라벨이라 나누지 않는다.
    서사 역할을 따로 읽을 소비자가 실물에 없다 — 구조화는 미확인
- `headline` — RichText. `\n` 은 작가가 정한 리듬이라 보존한다 (관측 20장 모두 1개였지만 개수는 규칙이 아니다)

---

## 5. open_question (D15 · D16 · D17)

- **슬라이드 사이의 독립 데이터다 (D17).** 슬라이드의 필드가 아니다.
  `levels[].open_questions[i]` 는 `slides[i]` 와 `slides[i+1]` **사이**에 있다
  - 프로토타입처럼 슬라이드 아래에 붙일지, 한 화면으로 따로 띄울지는 프론트가 정한다. 어느 쪽이든 계약은 그대로다
- **teaser 만 open_question 이다 (D16).** 본문 수사의문문("이상하죠. 왜 올렸을까요?")은 본문 span(`layer: writing`)이다
- **읽기 흐름은 선형이다 (D15)**
  - `open_questions[i]` 에는 `slides[i+1]` 이 답한다. 다른 슬라이드를 가리킬 방법이 없다 — `resolves` · `goto` 같은 필드를 두지 않는다
  - 길이는 정확히 `slides.length − 1`, 모든 `text` 는 비어 있지 않다 = D15 QA① (기계 검사)
  - 다음 슬라이드가 실제로 답했는가 = QA② — 의미 판정, 게이트 3
- `text` 만 둔다. 프로토타입의 `Q` / `·` 기호, 구분선, 이동 인덱스는 데이터가 아니다
- **형태는 자유다 (D20).** 질문형("…?"), 목차형(숙련의 명사구), 평서 예고("그런데, 반전이 하나 있어요") 모두 된다.
  **단 답이 안 난 물음이 담겨 있어야 한다** — 물음이 없는 평서문은 넘길 힘이 없다(§8.2). 레벨에 묶지 않는다. 형태 필드는 없다
  - 물음이 담겼는지는 기계로 못 본다 — 게이트 3 (D15 QA② 와 같은 판정)

---

## 6. RichText 와 출처 층 (FINDINGS §8.4)

문장 단위로 "이건 원문 / 이건 우리 해석"을 보여주려면 글 안에 출처가 들어 있어야 한다.
그래서 본문 글은 문자열이 아니라 **span 의 배열**이다.

- span = 출처가 하나인 가장 작은 글 조각. 보통 한 문장
- **경계는 데이터다.** 계약에 문장 분할 규칙은 없다
  (0.0b 관찰 — 골든의 `where` 경로 방식이 분할 규칙을 사실상 계약으로 만들고 있었다)
- RichText 의 글 = span `text` 를 순서대로 이은 것
- 인라인 서식은 둘뿐이다
  - `<b>…</b>` — 강조. span 경계를 넘지 않는다
  - `\n` — 줄바꿈. (골든은 headline 에 `\n`, 본문에 `<br>` 을 썼다 → `\n` 하나로)
  - 그 밖의 태그 · class · style 은 없다

| `layer` | 뜻 | `refs` 원소 → 가리키는 것 | 근거 (골든 span 수, 0.1b 이후) |
|---|---|---|---|
| `fact` | 사실 서술 | FactRef → Fact (DATA_MODEL §3) | 골든 fact 64 |
| `claim` | 사실에서 끌어낸 해석 (Derived Claim) | ClaimRef → DerivedClaim (DATA_MODEL §7) | 골든 claim 30 |
| `concept` | 개념 설명 | ConceptRef → 개념 버전의 한 문안 (CONCEPT_IDENTITY §3.2) | 골든 concept 21 |
| `bridge` | 개념을 오늘 사건에 잇는 문장 | BridgeRef → Bridge (DATA_MODEL §8) | 골든 bridge 2 — 입문 4장 "그런데 지금 미국은 3%대입니다" · "목표보다 빠르게 오르고 있어요". FINDINGS §4.1 `CONCEPT_BRIDGE` |
| `writing` | 사실 주장이 없는 글 — 질문, 리듬, 전환 | 없음 (`[]`) | 골든 writing 6 |

패키지 최상단 `event_ref` 는 EventRef 다 — Event 의 UUID 이고, 사람이 부르는 이름(code)이 아니다 (D27). Ref 의 정의는 DATA_MODEL §2.2 · CONCEPT_IDENTITY §3.2 에 있다 — 이 계약은 가리키기만 한다.

- **span 하나에 layer 하나.** `refs` 는 그 층의 atom 만 가리킨다 — Claim span 에 Fact ID 를 섞지 않는다
  (0.0b 관찰: 골든 17 span 이 `F-*` 와 `DC-*` 를 섞었다). Claim 이 어떤 Fact 에 기대는지는 Claim 이 안다 → DATA_MODEL §7 (`basis`). 브리지가 품은 사실도 같다 → DATA_MODEL §8 (`facts`)
- `fact` · `claim` · `concept` · `bridge` 는 refs 가 1개 이상이다 (픽스처의 0.2 대기만 예외 — §6.2). 층이 맞게 붙었는지(사실을 말하는 글을 `writing` 으로 달지 않았는지)는 기계로 못 본다 — 게이트
- **원문(인용)은 층이 아니라 블록이다** → §7.4. 원문도 결국 어떤 Fact 의 원문 구간이라 span 층은 `fact` 다
- 층을 어떻게 보여줄지(색, 밑줄, 탭하면 근거)는 프론트가 정한다. 근거 내용을 펼치려면 Ref 를 풀어야 한다 — 무엇으로 풀리는지는 DATA_MODEL §2.2, 프론트가 푸는 경로(API)는 이 계약 밖이다

### 6.1 층 판정 규칙 — 사실인지 해석인지 애매하면 `claim` 으로 단다 (D20)

독자는 span 마다 "이건 사실 / 이건 Claro 의 해석" 표시를 본다(§8.4). 판정이 갈리면 `claim` 이다.
- 해석을 `fact` 로 달면 → 독자가 우리 추론을 1차 자료처럼 믿는다. FINDINGS §5.2 가 가장 경계한 실수다
- 사실을 `claim` 으로 달면 → 조금 보수적일 뿐 독자를 속이지 않는다

두 실수의 비용이 같지 않아서 애매하면 `claim` 이다. 골든만이 아니라 파이프라인이 모든 기사에 쓰는 규칙이다.
- 한 문장에 사실과 추론이 섞였으면 — 추론이 하나라도 있으면 `claim`. refs 는 Claim 만(§6 "span 하나에 layer 하나")

### 6.2 0.2 대기 표시 — 픽스처에서만 (D20)

0.2 가 ID 체계를 정하기 전에는 refs 를 채울 수 없는 span 이 있다(골든: 브리지 2, 브리프 산문 1, 이란 전쟁 4 — 사실 3 · 전망 1).
0.1b 를 0.2 보다 먼저 하기 위해 그런 span 은 **픽스처에서만** 이렇게 표시한다.
(0.2b 가 참조 모양을 정했다. D23 이후 대기 13 이 각각 어디서 풀리는지는 DATA_MODEL §17. 표시 규칙은 그대로다)

```json
{ "text": "그런데 지금 미국은 3%대입니다.", "layer": "bridge", "refs": [],
  "_refs_pending": { "until": "0.2", "need": "Bridge" } }
```

- `refs` 는 빈 배열로 둔다. 가짜 ID 를 넣지 않는다 — `refs` 에는 언제나 실제 Ref 만 들어간다
- `need` 는 0.2 가 무엇을 만들어야 채워지는지 한 마디로 적는다 (예: `"Bridge"` · `"Fact 승격"` · `"Fact 출처"` · `"DerivedClaim"`)
  - `"DerivedClaim"` 은 근거 없는 **해석**이다. 근거 없는 사실은 출처를 채우면 되지만, 해석은 Derived Claim 도출과 반증 검사(FINDINGS §7.2)를 거쳐야 채워진다 (D22)
- `_` 로 시작하므로 계약 필드가 아니라 픽스처 주석이다. 프론트는 읽지 않는다 — 층(`layer`)만 있으면 그릴 수 있다
- **발행 불변식은 그대로다.** 대기 span 은 refs 가 비어 있어 §9-6 에 걸리고, 발행물에는 `_` 필드가 없다(§9-10). 대기 표시가 있으면 발행하지 않는다
- 픽스처 검증은 대기 span 을 **실패가 아니라 WARN 으로 세고 개수를 보고한다.** 조용히 두면 썩는다 — 0 이 될 때까지 보이게 둔다
- 대기 표시 없이 refs 가 비어 있으면 픽스처에서도 실패다

---

## 7. 블록 — 원형 층 (D14)

### 7.1 공통 규칙

1. **`type` 은 원형 이름이다.** 원형 목록은 이 계약이 닫는다(§7.2). 새 원형은 계약 개정으로만 늘어난다
2. **모든 블록에 `text`(정규 텍스트)가 있다. 옵션이 아니다** (D14 규칙 1)
3. **정답 표현은 구조다. `text` 는 구조에서 계산한 값이고, 싣되 불변식으로 묶는다** (D14 규칙 6)

   `text == linearize(block)` — 발행할 때 검사하고, 안 맞으면 발행하지 않는다. D8 의 `value_at_authoring` 과 같은 방식이다
   - **왜 구조가 정답인가** — 시각은 필드(순서, 라벨, 값, 짚는 항목)가 필요하다. 구조 → 글은 결정적이지만 글 → 구조는 아니다.
     글에서 필드를 거꾸로 뽑는 순간 거기서 어긋남이 숨는다
   - **왜 `text` 도 싣는가** — 프론트가 모르는 원형이 왔을 때 그릴 것이 있어야 하고(D14 이유 1),
     스크린리더 · 질문 기능 · 검색 · 검증이 전부 글에서 돈다(이유 2~5). 싣지 않으면 소비자마다 선형화를 따로 짠다
   - **왜 "둘 다 독립 저장"이 아닌가** — `text` 는 사람이 쓰지 않는다. 구조를 고치고 `text` 를 안 고치면 발행이 막힌다.
     화면엔 3.4%, 질문 기능엔 3.3% 인 상태가 만들어질 수 없다
4. **극성 · 순서 · 강조는 `text` 에 글자로 남는다** (D14 규칙 2) — 원형마다 선형화 규칙이 보장한다
5. **시각은 선형화에 들어가는 필드만 쓴다** (D14 규칙 3). 예외는 명제를 더하지 않는 두 가지뿐이다
   - 문단 `weight` (§7.3)
   - 대조 항목을 **위치로** 구분하는 것 (첫째와 둘째에 다른 색). 항목의 뜻으로 색을 고르지 않는다

   **판단을 싣는 색은 없다 (D20).** "나쁘게 올랐다", "경고" 같은 판단이 필요하면 글로 쓴다 — 그 글은 `claim` 층이다.
   Claro 는 해석을 해석이라고 보여주는 서비스라서 겉모양 속에 해석을 숨기지 않는다
6. **렌더 시점 계산 없음** (D8 · D12). 프론트는 값을 계산하지 않고 받은 글을 그린다
7. 선형화에서 항목 안의 `\n` 은 공백으로 바꾼다 — 항목 하나가 한 줄이 되게

### 7.2 원형 목록 — 5개 (D20)

| 원형 `type` | 뜻 | 관측 타입 | 근거 기사 |
|---|---|---|---|
| `prose` 문단 | 서식 있는 글 문단 | body_text · callout · closing | **둘 다** |
| `quote` 인용 | 출처가 있는 남의 말 그대로 | quote (출처가 있는 것만) | **둘 다** |
| `list` 목록 | 짧은 항목을 늘어놓는다. 순서가 뜻일 수 있다 | timeline · steps · examples | **둘 다** |
| `contrast` 대조 | 두 항목을 맞대어 읽게 한다 | votes · gauge · tags_inline · rule_line · (quote 를 빌린 경계선) | **둘 다** |
| `sheet` 이름-값 표 | 이름 붙은 값 여러 개 | stats | FOMC — **근거 1건** |

D14 참고안과 다른 곳 (이유는 로그 맨 앞)
- 극성 목록(rule_line)을 따로 두지 않았다 → `contrast`. 극성은 라벨 글자("✕", "해당 없음")에 들어 있다.
  항목이 셋 이상인 극성 목록은 라벨 달린 `list` 로 쓸 수 있다
- 강조 문단(callout) · 마무리(closing) → `prose` 의 `weight`. 모양이 같고 무게만 다르다
- 순서 목록 · 순서 없는 목록 → `list` 하나에 `ordered`
- `end_actions` 는 블록이 아니다 → 프론트 UI (§0)
- 척도(gauge) → `contrast` 두 항목 (D20). 척도 원형은 두 번째 사례 전까지 두지 않는다 (§10.1)

**상태축 블록 어휘는 미확인이다 (D11).** 위 목록은 시간축(FOMC) · 경계축(FTC) 두 기사에서만 나왔다.
스크루웜(상태축)은 슬라이드가 없어 대보지 못했다. 브리프로 보면 지도(확산 경로)가 새로 필요할 수 있다 — 검증 안 됨.
세 번째 축 기사가 나오면 이 절을 개정한다.

### 7.3 `prose` — 문단

```ts
Prose  { type: "prose", text, paragraphs: { body: RichText, weight: Weight }[] }
Weight = "normal" | "secondary" | "callout" | "conclusion"
```

| `weight` | 관측 | 근거 |
|---|---|---|
| `normal` | body_text 문단 | 둘 다 |
| `secondary` | `dim` — 부연 | 둘 다 |
| `callout` | callout 상자 — 멈추고 짚기 | FOMC — 근거 1건 |
| `conclusion` | closing — 마지막 장의 결론 | 둘 다 |

- **정규 텍스트**: 문단 글을 `\n\n` 으로 잇는다. weight 는 넣지 않는다
- weight 는 명제를 더하지 않는 무게라 시각 규칙의 예외다(§7.1-5). callout 의 `warn`(빨간 테두리)은 무게가 아니라 판단 색이라 패키지에 없다 (D20). 경고가 필요하면 글로 쓴다
- 관측: `conclusion` 은 세 덱 모두 마지막 장에 정확히 하나 있었다. 규칙으로 두지는 않는다

### 7.4 `quote` — 인용

```ts
Quote { type: "quote", text, attribution: string, body: RichText }
```

- 출처가 있는 남의 말 그대로일 때만 쓴다. **출처가 없으면 인용이 아니다**
  (FTC-11: FTC 5장의 경계선은 인용 블록을 빌린 대조였다 → `contrast`)
- `attribution` — 독자에게 보이는 출처 표시("8월 말 · 의장 연설", "FTC 원문"). 필수
- `body` 의 span 은 `layer: fact`, refs 는 그 원문을 가진 Fact. 원문의 어느 구간인지는 0.2
- 인용부호가 `body` 글에 들어가는가 → 0.2 (FOMC-6). 관측: FOMC 는 없음, FTC 는 있음
- **정규 텍스트**: `[{attribution}] {body}`

### 7.5 `list` — 목록

```ts
List { type: "list", text, ordered: boolean,
       items: { label?: RichText, body: RichText, emphasized?: true }[] }
```

| 관측 | `ordered` | `label` | 근거 |
|---|---|---|---|
| timeline (7/29 → 9/16) | true | 날짜 | FOMC |
| steps (요구 사항 1·2·3) | true | 없음 | FTC |
| examples (예시 셋, 셋째 강조) | false | 없음 | FTC |

- **순서는 배열 순서다. 번호는 저장하지 않는다** — 선형화가 붙인다 (FTC-16)
- `label` 은 글이다. 날짜 형식이 아니다 — "9월 초" 같은 기간도 들어간다. 프론트는 label 로 계산하지 않는다 (FOMC-22, D12)
- `emphasized` — 한 항목을 짚는다(examples 의 punch). 같은 항목을 `<b>` 로 통째 감싸지 않는다 — 두 번 적으면 어긋난다
- **정규 텍스트**: 항목마다 한 줄, `\n` 으로 잇는다
  - `ordered`: `{n}. {label} — {body}` (label 이 없으면 `{n}. {body}`)
  - 아니면: `- {label} — {body}` (label 이 없으면 `- {body}`)
  - `emphasized` 항목은 번호·기호 뒤를 `<b>…</b>` 로 감싼다
- **순서 목록의 간격은 순서만 뜻한다. 간격이 의미를 가지면 작가가 글로 쓴다 (D20).** 날짜 간격을 길이로 그리지 않는다 — 등간격으로 그려도 된다.
  "점점 빨라졌다"처럼 간격이 요점이면 그 말을 본문에 쓴다

### 7.6 `contrast` — 대조

```ts
Contrast { type: "contrast", text,
           items: { label: RichText, value?: RichText, body?: RichText, emphasized?: true }[] }
           // value 와 body 중 하나 이상
```

| 관측 | `label` | `value` | `body` | 근거 |
|---|---|---|---|---|
| votes | 7월 29일 / 9월 16일 | 9 : 3 / 12 : 0 | 동결… / 인상… | FOMC |
| gauge (D20 — 척도 대신) | 연준이 원하는 속도 / 지금 미국 | 2% / 3%대 | — | FOMC |
| tags_inline | 연방·FTC / 주·메릴랜드 | — | 공개 의무 / 금지 | FTC |
| rule_line 두 줄 | ✕ / ✓ | — | 금지하라 / 숨기지 마라 | FTC |
| quote 를 빌린 경계선 | 해당 없음 / 이번 사안 | — | 시장 상황 때문에 모두에게… / 나에 대한 추정 때문에 나에게만… | FTC |

- 항목들은 **같은 물음에 대한 다른 답**이다 — 무엇이 달라졌나, 어디가 다른가, 어느 쪽인가
- **극성은 라벨 글자다** (D14 규칙 2). ✕/✓ 를 빼면 어느 쪽이 되고 안 되는지 사라진다 → 라벨에 글자로 둔다.
  극성을 따로 enum 으로 두지 않는다 — 라벨과 enum 이 어긋날 수 있다
  - 기호 라벨("✕")도 글자지만 스크린리더에서는 뜻이 흐려진다. 말("해당 없음")로 쓸지는 작가 판단
- **게이지는 두 값 대조다 (D20).** 독자가 알아야 할 것 — 원하는 속도 2% / 지금 3%대 — 만 말한다. 글자는 그대로이고 속도계 비유는 본문 글에 남는다.
  눈금 · 축 · 그라데이션은 없다. 축 범위("0~6%")는 입문 독자에게 설명이 필요한 숫자라 쓰지 않는다(FINDINGS §7.7)
- **관측된 대조는 다섯 건 모두 두 항목이다.** 세 항목 이상은 미확인
  (FTC-13: 셋째 관할 뉴욕은 산문에 있었다. 구조에 넣을지 산문에 둘지는 작가 판단이고 계약은 둘 다 허용한다)
- 연속한 rule_line 두 줄은 대조 블록 하나다 (FTC-17)
- `emphasized` — 초점 항목 (votes 의 hit, rule_line 둘째 줄의 통째 굵게)
- 범주 색(tags 의 fed/state)은 두지 않는다. 범주는 이미 라벨 글자에 있다. 항목 구분은 위치로 (§7.1-5)
- **정규 텍스트**: 항목마다 `{label}: {value} {body}` — 없는 쪽은 빼고 공백 하나로 잇는다(`{label}: {value}` · `{label}: {body}`). `emphasized` 는 `: ` 뒤를 `<b>…</b>` 로 감싼다. `\n` 으로 잇는다

### 7.7 `sheet` — 이름-값 표 (근거 1건)

```ts
Sheet { type: "sheet", text, rows: { label: RichText, value: RichText }[] }
```

- 관측: 숙련 4장 SEP 표 6행 (FOMC 만)
- 대조와 다른 점: 행마다 묻는 것이 다르다(2026 중앙값, 2027 중앙값, 인상 예상 인원 …). 대조는 같은 물음에 두 답
- 값에 색으로 방향·판단을 입히지 않는다 (D20). 관측된 `up`(빨강)은 판단 색이라 패키지에 없다. "1%p 올랐다" 같은 방향·판단이 필요하면 글로 — `claim`.
  `flat` 은 보이는 차이가 없는 표시라 버린다
- **정규 텍스트**: 행마다 `{label}: {value}`, `\n` 으로 잇는다
- 근거 1건이다. 두 번째 사례가 나오기 전에는 넓히지 않는다 — 열 3개 이상, 머리행, 강조 행은 미확인

### 7.8 (척도 → §10.1 로 옮김, D20)

게이지는 `contrast` 두 항목이 됐다(§7.6). 척도 원형은 두지 않는다. 판정과 초안 내용은 §10.1.

### 7.9 모르는 `type` 이 왔을 때

프론트는 `text` 를 문단으로 그린다(`<b>` 와 `\n` 만 해석한다).
원형은 계약이 닫지만, 백엔드가 먼저 배포되는 순간은 생긴다. 그때의 안전장치다.

### 7.10 표시 변형 판정 (FOMC-9)

기준은 D14 규칙 3 — **시각이 글에 없는 명제(수량 · 관계 · 판단)를 더하면 안 된다.**
무게 · 배치처럼 명제를 더하지 않는 것은 표시다.

| 관측 | 기사 | 판정 | 계약 |
|---|---|---|---|
| `<b>` 구절 강조 | 둘 다 | 강조 — 뜻이 있다 | span 인라인 `<b>` |
| `<br>` · headline `\n` | 둘 다 | 작가의 줄 리듬 | `\n` 하나로 |
| 문단 `dim` | 둘 다 | 무게 (부연) | `weight: secondary` |
| callout 상자 | FOMC | 무게 (짚기) | `weight: callout` |
| closing 큰 세리프 | 둘 다 | 무게 (결론) | `weight: conclusion` |
| `small` 변형, `margin-top` 등 style | 둘 다 | 표시 | 버린다 |
| votes `hit`, examples `punch`, rule_line 통째 `<b>` | 둘 다 | 항목 강조 | `emphasized` → 선형화에 `<b>` |
| rule_line ✕/✓ | FTC | **극성 — 뜻이 있다** | 대조 `label` 글자 |
| steps 번호 | FTC | 순서 표시 | 배열 순서, 선형화가 번호를 붙인다 |
| timeline 연결선 · `is_last` | FOMC | 표시 | 버린다. 간격은 순서만 뜻한다 (D20) |
| tags `fed`/`state` 색 | FTC | 범주 — 이미 라벨 글자에 있다 | 버린다. 위치로 구분 |
| stats `flat` | FOMC | 표시 (보이는 차이 없음) | 버린다 |
| stats `up` 빨강 | FOMC | **판단** — "나쁘게 올랐다"가 글에 없다 | 버린다 — 판단 색 금지 (D20). 필요하면 글로 |
| callout `warn` 빨강 테두리 | FOMC | **판단** — 경고 | 버린다 — 판단 색 금지 (D20). 필요하면 글로 |
| gauge 눈금 `[33, 62]` | FOMC | **수량 — 글에 없다 (규칙 3 위반)** | 버린다 — 게이지는 `contrast` 두 항목 (D20) |
| gauge 그라데이션 | FOMC | **판단** — 초록→빨강 | 버린다 — 판단 색 금지 (D20) |
| 경계선 quote 의 왼쪽 선 색 | FTC | 인용이 아님을 색으로만 표시 | 버린다 — `contrast` 로 |
| teaser `Q` / `·` | 둘 다 | 형태 표시 | 버린다. 형태는 자유 (D20) |
| examples 점 | FTC | 표시 | 버린다 |

---

## 8. 시간 표현 (D8 · D12)

- 패키지는 `published_at` 을 싣는다. DERIVED 값은 이 시각 기준으로 계산돼 있다
- **DERIVED · VOLATILE 값은 글로만 나간다.** span `text` 에 적힌 그대로가 `value_at_authoring` 이다. 공식 · 출처 · as_of 는 패키지에 없다
- 프론트는 시간 계산을 하지 않는다. 오늘 날짜로 다시 세지 않는다 (D8 규칙 1 · 2)
- 공식 · 불변식 · as_of 는 발행 전에 백엔드가 검사하는 저작 데이터다. 어디에 붙는지(span 인가 fact 인가)는 0.2 (S4 표)
- VOLATILE 값의 기준 시점을 독자에게 보여줄지 — 미확인 (프로토타입에 없다)
- "아직 진행 중인가"는 패키지의 속성이 아니다 (D8 규칙 5)

---

## 9. 불변식

발행할 때 기계로 검사한다.

1. `levels` 1~3개. `id` 는 basic · intermediate · advanced 중 하나이고 겹치지 않으며 그 순서로 놓인다 (D20). 레벨마다 `slides` ≥ 1, 슬라이드마다 `blocks` ≥ 1
2. `open_questions.length == slides.length − 1`, 모든 `text` 가 비어 있지 않다 (D15 QA①)
3. 어디에도 다른 슬라이드를 가리키는 필드가 없다 — `resolves` · `goto` · 인덱스 류 (D15)
4. 모든 블록에 `type` 과 `text`, 그리고 `text == linearize(block)` (D14 규칙 1 · 6)
5. `type` 이 §7.2 목록에 있다
6. 모든 span 에 `layer`. `writing` 이면 refs 가 비어 있고, 나머지는 1개 이상이며 그 층의 Ref 다 (§6).
   **0.2 대기 표시(`_refs_pending`)가 있는 span 은 refs 가 비어 있으므로 발행되지 않는다.** 대기 표시는 픽스처에서만 허용하고, 픽스처 검증은 WARN 으로 센다 (§6.2 · D20)
7. 인라인 서식은 `<b>` 와 `\n` 뿐이고, `<b>` 는 span 을 넘지 않는다
8. `emphasized` 항목은 `<b>` 로 통째 감싸지 않는다 — 강조를 두 번 적지 않는다
9. 시간 공식이나 읽는 시각에 기대는 필드가 없다 (D8)
10. 발행물에는 `_` 로 시작하는 필드가 없다. `_` 는 픽스처 주석이다 (`_refs_pending` · `_volatility` · `_published_at_basis` 등)

QA② — 다음 장이 실제로 답했는가 — 는 기계 검사가 아니다. 게이트 3.

---

## 10. 미확인

두 실물에 근거가 없어 정하지 않은 것.

| 항목 | 이유 |
|---|---|
| 상태축 블록 어휘 | D11. 스크루웜 슬라이드가 없다 |
| **척도** | **미확인. 두 번째 사례 전까지 두지 않는다 (D20)** — §10.1 |
| 대조 세 항목 이상 | 관측 4건 모두 두 항목 |
| `sheet` 확장 (열 3개 이상, 머리행, 강조 행) | 근거 1건 |
| 스토리라인("지난 이야기") 블록 | FINDINGS §8.5 미정. 실물 없음 |
| 본문 속 짧은 인용("물가가 나빠졌는가")을 원문으로 표시할지 | 본문에 있으나 구분 표시가 없었다. FOMC-6(0.2)과 함께 |
| VOLATILE 기준 시점을 독자에게 보일지 | §8 |
| 패키지 자체의 ID · 버전 | 패키지에는 없다. 판은 ArticleRecord 의 `article_id` · `article_version` 으로 가리킨다 → DATA_MODEL §11 (D30) |
| kicker 서사 역할의 구조화 | 읽을 소비자가 없다 |
| 이미지 · 지도 · 도표 | 실물에 없다 |

### 10.1 척도 — 미확인. 두 번째 사례 전까지 두지 않는다 (D20)

0.1a 초안의 §7.8 을 옮겨 둔다. 척도가 필요한 두 번째 기사가 나오면 여기서 다시 시작한다.

**관측** — 입문 4장 게이지. 글은 "2% 연준이 원하는 속도" · "3%대 지금 미국". 그 위에 눈금 위치 `[33, 62]` 와 초록→빨강 그라데이션.
글은 두 값만 말하는데 눈금 위치는 "목표와 현재 사이 거리가 이만큼"이라는 비율을 말했다 — D14 규칙 3 위반.
축의 최소·최대는 어디에도 없었고, 선형이라고 보면 62% 는 약 3.7% 자리인데 글은 "3%대"라고만 했다.

**판정 (D20)** — 두 값 대조로 바꾼다(§7.6). 독자가 알아야 할 것 — 원하는 속도 2% / 지금 3%대 — 만 말하고 글자는 그대로다.
속도계 비유는 본문 글에 남는다. 프론트 계산이 없어 D12 도 그대로다. 근거 1건 원형이 하나 준다.

**척도를 다시 들인다면 필요한 것** (초안의 선택지 (a))
| | |
|---|---|
| 모양 | `Scale { type: "scale", text, axis: { min, max, unit }, points: { label: RichText, value: number }[] }` |
| 정규 텍스트 | 축과 모든 값을 숫자로. 예: "0~6% 눈금 — 연준이 원하는 속도: 2%, 지금 미국: 3.3%" |
| 글 | 위치가 가리키는 값을 글이 말해야 한다("3%대" → 실제 값). **축 범위를 고르는 것도 그림을 바꾸는 편집 판단**이고, 축 숫자가 입문 독자에게 설명을 요구한다 |
| 프론트 | 위치 = (value − min) / (max − min). 첫 프론트 계산 — D12 개정 |
| 색 | 좋음→나쁨 그라데이션은 판단 색이라 못 쓴다 (D20) |

---

## 11. _open — 판정됨 → D20

2026-09-29 게이트. 판정자 PM (도윤 위임). 판단 순서는 ① 독자가 느끼는 것 ② 기술적 무리 · 유지보수 · 병목.

| # | 무엇 | 판정 | 계약에서 |
|---|---|---|---|
| _open-1 | 게이지 (FOMC-14) | 판정됨 → D20: (b) 두 값 대조. `scale` 원형 없음 | §7.6 · §10.1 |
| _open-2 | 판단을 싣는 색 — sheet `up` · callout `warn` · 게이지 그라데이션 | 판정됨 → D20: (a) 금지. 판단은 글로(`claim`) | §7.1-5 · §7.3 · §7.7 |
| _open-3 | 순서 목록의 등간격 (FOMC-22) | 판정됨 → D20: (a) 허용. 간격은 순서만 뜻한다 | §7.5 |
| _open-4 | open_question 의 형태 (FOMC-3) | 판정됨 → D20: 형태 자유, 답이 안 난 물음이 담겨야 한다. 레벨에 묶지 않는다 | §5 |
| _open-5 | 레벨 `id` 어휘 (FTC-15) | 판정됨 → D20: basic · intermediate · advanced, 기사당 1~3개. 레벨이 하나면 쓰인 레벨 | §3 |

D20 은 이 밖에 두 가지를 더 정했다 — 층 판정 규칙(§6.1), 0.1b 를 0.2 보다 먼저 하기 위한 대기 표시(§6.2).

---

## 12. 골든과 다른 점 — Step 0.1b 작업 목록

골든(`fixtures/fomc-2026-09.article.json`)을 이 계약 모양으로 다시 쓸 때 할 일. 경로 하나하나의 대응은 부록 A.

1. **최상단** — `event_hint` → `event_ref`, `_published_at` → `published_at`, `_source.document_title` 에서 "Claro — " 를 뗀 것 → `title`,
   `_source.lang` → `lang`. `chrome` · `interaction` · `_source` 의 나머지는 패키지 밖
2. **레벨** — `slide_count` · `deck_element_id` · `hidden_attr` · `initially_visible` · `label`(D22) 을 뺀다. `open_questions` 배열을 새로 만든다. `id` `adv` → `advanced` (D20)
3. **teaser → `open_questions`** — `qtext` 만 옮긴다. `qmark` · `goto_index` · `wrapper` · `has_tear_divider` 는 버린다
4. **슬라이드** — `index` 를 뺀다. `h1` → `headline`(RichText)
5. **본문 글 → RichText** — 모든 글 필드를 span 배열로. `_fact_refs` 를 span 에 흡수한다. `<br>` → `\n`
6. **kind → layer** — D20 · D22 규칙대로(§6.1 · §6.2). 판정이 애매했던 span 은 목록으로 남겨 PM 이 검수한다
   - 그대로 넘어가는 것: fact → `fact`, derived_claim → `claim`, concept → `concept`, writing → `writing`
   - **F · DC 를 섞은 17 span** — 추론이 하나라도 있으면 `claim`, refs 는 DC 만. 끊긴 F 연결은 `_` 주석으로 남긴다(0.2 가 Claim → Fact 로 옮긴다)
   - `partial` 12 — 브리프 사실이 그 문장을 다 말하면 `fact`, 넘어서면 `claim`. note 는 QA 기록이지 패키지 값이 아니다
   - **0.2 대기 7** — 글은 그대로 두고 refs 는 §6.2 대기 표시
     - 이란 전쟁 사실 3 (입문 8장 둘 · 숙련 5장 "201일째") — `fact`, `need: "Fact 출처"`.
       도윤의 배경지식에서 온 사실이고 출처가 비어 있을 뿐이다. 보강은 C-2 · C-3 · 0.2
     - 이란 전쟁 전망 1 (입문 8장 callout "이 전쟁이 끝나면 물가는 저절로 내려갈 수도, 더 커지면 훨씬 나빠질 수도 있어요") —
       **`claim`**, `need: "DerivedClaim"` (D22). 사실이 아니라 우리가 한 전망이다. 브리프 DC-A~E 어디에도 없다
     - 브리프 산문 1 (입문 7장 "회의 내부 기록은 3주 뒤에 공개돼요") — `fact`, `need: "Fact 승격"`
     - 브리지 2 — "그런데 지금 미국은 3%대입니다", "목표보다 빠르게 오르고 있어요"(지금은 concept 과 fact 를 함께 달고 있다) — `bridge`, `need: "Bridge"`
   - **이란 규칙("글 그대로, `fact`, refs 대기")은 사실을 서술한 문장에만 적용한다 (D22).**
     해석 · 전망 문장은 §6.1 일반 규칙을 따른다 — `fact` 로 달면 독자가 우리 전망을 원문 사실로 읽는다
7. **블록 변환**
   - body_text → `prose` (`dim` → `secondary`, `small` · `style_attr` 버림)
   - callout → `prose` `weight: callout` (`warn` 은 버린다 — 판단 색, D20)
   - closing → `prose` `weight: conclusion`
   - quote → `quote` (`tag` → `attribution`, `quotation_marks_in_text` 는 0.2 FOMC-6 결과대로)
   - votes → `contrast` (`when` → label, `tally` → value, `what_html` → body, `hit` → `emphasized`)
   - timeline → `list` `ordered: true` (`when` → label, `is_last` · `has_connector_line` · `html_class` 버림)
   - stats → `sheet` (`k` → label, `v` → value, `v_modifier` 는 버린다 — `up` 은 판단 색, `flat` 은 표시, D20)
   - end_actions → 버린다 (패키지 밖)
8. **게이지 → `contrast` 두 항목. 글자는 그대로 (D20).**
   `caption` → label("연준이 원하는 속도" / "지금 미국"), `value_text` → value("2%" / "3%대"). body 는 없다.
   눈금 `[33, 62]`(D14 규칙 3 위반) · 축 · 그라데이션 · `role` 은 버린다
9. **모든 블록에 `text`** — 선형화 결과를 싣는다
10. `_concept_ref` 를 뺀다 — span 의 concept refs 에서 나온다
11. `_volatility` · `_published_at_basis` 는 **픽스처에 `_` 주석으로 남긴다 (D20).** 패키지 필드가 아니라 저작 데이터(§8)지만,
    0.2 가 자리를 정할 때까지 D8 검증과 invalid 두 건이 이걸 쓴다. `where` 경로는 새 모양에 맞게 고친다
12. `fixtures/invalid/` 두 건을 새 골든에서 다시 만든다 (골든 + 위반 1개)
13. `scripts/verify-article.py`(`where` 경로에 기댄다) · `scripts/diff-observed-article.py`(관측 → 골든 대응이 바뀐다)를 고친다

FTC observed 는 골든이 아니라 0.1b 대상이 아니다. 어휘 대응만 부록 A 에 적었다.

---

## 부록 A. 관측 경로 → 계약

`scripts/verify-contract-coverage.py` 가 두 실물의 모든 경로가 이 표에 있는지 확인한다. `.*` 는 그 아래 전부.

| 관측 경로 | 기사 | 계약에서 |
|---|---|---|
| `top.event_hint` | FOMC | `event_ref` |
| `top._published_at` | FOMC | `published_at` |
| `top._published_at_basis` | FOMC | 패키지 밖 — 저작 데이터 |
| `top._source.document_title` | FOMC | `title` ("Claro — " 제거) |
| `top._source.lang` | FOMC | `lang` |
| `top._source.corrected_on` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top._source.corrections` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top._source.derived_from` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top._source.gate` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top._source.prototype` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top._source.task` | FOMC | 패키지 밖 — 픽스처 이력 |
| `top.chrome.*` | FOMC | 패키지 밖 — 프론트 UI |
| `top.interaction.*` | FOMC | 패키지 밖 — 프론트 UI |
| `level.id` | FOMC | `levels[].id` — `adv` → `advanced` (D20) |
| `level.label` | FOMC | 버린다 — 표시 이름은 프론트가 `id` 에서 (D22) |
| `level.slide_count` | FOMC | 버린다 — `slides.length` |
| `level.deck_element_id` | FOMC | 버린다 — 프론트 |
| `level.hidden_attr` | FOMC | 버린다 — 프론트 |
| `level.initially_visible` | FOMC | 버린다 — 개인화 (범위 밖) |
| `slide.index` | FOMC | 버린다 — 배열 위치 |
| `slide.kicker` | FOMC | `slides[].kicker` |
| `slide.h1` | FOMC | `slides[].headline` (RichText) |
| `slide.teaser` | FOMC | `levels[].open_questions[]` — 마지막 장은 없음 |
| `slide.teaser.qtext` | FOMC | `open_questions[].text` |
| `slide.teaser.qmark` | FOMC | 버린다 — 형태 표시. 형태는 자유 (D20) |
| `slide.teaser.goto_index` | FOMC | 버린다 — 위치로 정해진다 (D15) |
| `slide.teaser.wrapper` | FOMC | 버린다 — 표시 |
| `slide.teaser.has_tear_divider` | FOMC | 버린다 — 표시 |
| `slide._fact_refs.*` | FOMC | Span `layer` · `refs` (§6, §12-6) |
| `slide._concept_ref.*` | FOMC | 버린다 — span refs 에서 나온다 |
| `slide._volatility.*` | FOMC | 패키지 밖 — 저작 데이터 (§8, 0.2) |
| `block:body_text.type` | 둘 다 | `prose` |
| `block:body_text.paragraphs[].html` | 둘 다 | `paragraphs[].body` |
| `block:body_text.paragraphs[].classes[]` | 둘 다 | `weight: secondary` (dim) |
| `block:body_text.variant` | FOMC | 버린다 — 표시 |
| `block:body_text.style_attr` | 둘 다 | 버린다 — 표시 |
| `block:callout.type` | FOMC | `prose` · `weight: callout` |
| `block:callout.html` | FOMC | `paragraphs[].body` |
| `block:callout.modifier` | FOMC | 버린다 — `warn` 은 판단 색 (D20) |
| `block:closing.type` | 둘 다 | `prose` · `weight: conclusion` |
| `block:closing.html` | 둘 다 | `paragraphs[].body` |
| `block:end_actions.*` | 둘 다 | 패키지 밖 — 프론트 UI · probe 진입은 범위 밖 |
| `block:gauge.type` | FOMC | `contrast` (D20) |
| `block:gauge.labels[].caption` | FOMC | `items[].label` |
| `block:gauge.labels[].value_text` | FOMC | `items[].value` |
| `block:gauge.labels[].value_html` | FOMC | 버린다 — `value_text` 와 같은 글 + 굵게(표시) |
| `block:gauge.labels[].role` | FOMC | 버린다 — 항목은 위치로 구분 |
| `block:gauge.labels[].left_percent` | FOMC | 버린다 — 눈금 (D14 규칙 3 위반) |
| `block:gauge.marks[].left_percent` | FOMC | 버린다 — 눈금 (D14 규칙 3 위반) |
| `block:gauge.scale.*` | FOMC | 버린다 — 축 없음, 그라데이션은 판단 색 (D20) |
| `block:gauge.comment_in_html` | FOMC | 버린다 — 전사 주석 |
| `block:quote.type` | 둘 다 | `quote` — 출처 없는 것은 `contrast` |
| `block:quote.html` | 둘 다 | `body` |
| `block:quote.tag` | 둘 다 | `attribution` |
| `block:quote.quotation_marks_in_text` | 둘 다 | 버린다 — 인용부호는 0.2 (FOMC-6) |
| `block:quote.quote_mark_style` | FTC | 버린다 — 인용부호는 0.2 (FOMC-6) |
| `block:quote.style_attr` | FTC | 버린다 — 경계선 → `contrast` |
| `block:quote.inner_p_style_attr` | FTC | 버린다 — 표시 |
| `block:quote.note` | FTC | 버린다 — 전사 주석 |
| `block:stats.type` | FOMC | `sheet` |
| `block:stats.rows[].k` | FOMC | `rows[].label` |
| `block:stats.rows[].v` | FOMC | `rows[].value` |
| `block:stats.rows[].v_modifier` | FOMC | 버린다 — `up` 은 판단 색, `flat` 은 표시 (D20) |
| `block:timeline.type` | FOMC | `list` · `ordered: true` |
| `block:timeline.items[].when` | FOMC | `items[].label` |
| `block:timeline.items[].html` | FOMC | `items[].body` |
| `block:timeline.items[].is_last` | FOMC | 버린다 — 표시 |
| `block:timeline.items[].has_connector_line` | FOMC | 버린다 — 표시. 간격은 순서만 뜻한다 (D20) |
| `block:timeline.html_class` | FOMC | 버린다 — 표시 |
| `block:votes.type` | FOMC | `contrast` |
| `block:votes.cards[].when` | FOMC | `items[].label` |
| `block:votes.cards[].tally` | FOMC | `items[].value` |
| `block:votes.cards[].what_html` | FOMC | `items[].body` |
| `block:votes.cards[].modifier` | FOMC | `items[].emphasized` (hit) |
| `block:examples.type` | FTC | `list` · `ordered: false` |
| `block:examples.items[].html` | FTC | `items[].body` |
| `block:examples.items[].modifier` | FTC | `items[].emphasized` (punch) |
| `block:examples.items[].bullet` | FTC | 버린다 — 표시 |
| `block:examples.html_class` | FTC | 버린다 — 표시 |
| `block:steps.type` | FTC | `list` · `ordered: true` |
| `block:steps.items[].html` | FTC | `items[].body` |
| `block:steps.items[].n` | FTC | 버린다 — 순서에서 나온다 (FTC-16) |
| `block:steps.html_class` | FTC | 버린다 — 표시 |
| `block:rule_line.type` | FTC | `contrast` — 연속 두 줄이 한 블록 (FTC-17) |
| `block:rule_line.marker` | FTC | `items[].label` — 극성 글자 |
| `block:rule_line.marker_class` | FTC | 버린다 — 극성은 label 글자에 |
| `block:rule_line.html` | FTC | `items[].body` (통째 `<b>` → `emphasized`) |
| `block:tags_inline.type` | FTC | `contrast` |
| `block:tags_inline.pills[].label` | FTC | `items[].label` + `items[].body` ("—" 앞 / 뒤) |
| `block:tags_inline.pills[].modifier` | FTC | 버린다 — 범주는 label 글자에 |
| `block:tags_inline.html_class` | FTC | 버린다 — 표시 |
