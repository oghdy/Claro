# logs/backend · B-E1 — 회차 계약 (두 실물에서)

## B-E1 · 2026-11-11 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`). 모델 API 호출 0 · 비용 0 · 새 문서 수집 0 · 배포 안 함. `docs/PM.md` 안 읽음.
고친 곳: `docs/contract/EPISODE.md` (새 계약) · `packages/contract` (타입 · 검증기 · 시험) · `fixtures/episode-*.json` (골든 2) · `fixtures/invalid/episode-*.json` (위반 29) ·
`apps/web/src/app/lab/episode/` (시안이 계약을 쓰게) · `scripts/verify-article.py` (3줄 — 회차 위반 픽스처를 건너뛴다) · `docs/DECISIONS.md` (OPEN 넷) · 이 로그 · `docs/development-backend.md`.
**안 건드린 것**: ARTICLE_PACKAGE · DATA_MODEL · CONCEPT_IDENTITY · OBSERVATION 0자 · 기존 골든 · 기존 invalid 3 · 본 화면 (`/`) · packages/db · packages/pipeline · packages/tokens · 개념 라이브러리 0자.

**한 줄 답**: 회차 계약이 섰다 — `docs/contract/EPISODE.md`. 두 실물 (배달앱 1화 · 금리 2화)이 **같은 타입 하나 (`Episode`)** 의 골든 픽스처가 됐고, 시안은 그 골든을 읽어 그린다 (화면 픽셀 차이 0 — ⑤).
불변식 20 · 위반 픽스처 29 (전부 거부). **지식 상태 · 임계값 · 추정기는 계약에 없다** — 조립은 "어느 장면을 보이나"만 적는다.

---

## ① 계약 한눈에

```
Series (독자가 따라가는 묶음) ─┐
                               ├─ Episode ──event_ref──▶ Event (DATA_MODEL) ◀──event_ref── ArticlePackage (본 화면 `/` — 그대로)
          회차 번호 · 시리즈 줄 ─┘     │                     ▲
                                      │                     └── Storyline (사실의 흐름 — 시리즈가 아니다)
                                      ├─ docs ──source_id──▶ SourceDocument (DATA_MODEL · 저장된 원문)
                                      ├─ quotes ─ 그 원문의 글 그대로
                                      ├─ tools[].basis ──▶ ConceptRef (CONCEPT_IDENTITY) — [] 이면 손으로
                                      ├─ scenes (장면 여덟) · assembly (조립 둘 — 어느 장면을)
                                      ├─ solve.entry → lab.frames[].picture.id ──▶ 그림 부품 (코드 — 계약 밖)
                                      └─ map (개념 지도 — 선의 뜻은 미확인)
```

| 타입 | 무엇 | 실물 |
|---|---|---|
| `Episode` | 회차 하나 = 발행 한 번 · `episode_id` + `episode_version` · `code` · `event_ref` · `series` · `number` · `track` · `docs` · `quotes` · `voice_labels` · `tools` · `pickup` · `assembly` · `scenes` · `solve` · `map` | 둘 |
| `Series` · `TrackItem` | 시리즈 (UUID + code + 이름 · 부제) · 시리즈 줄 (지난 화 · 지금 · 다음 화) | 둘 |
| `EpisodeText` | 독자가 읽는 글 한 덩이 `{ t, src?, calc?, ui?, voice? }` | 글 94 / 129 |
| `EpisodeDoc` · `EpisodeQuote` | 근거 문서 (SourceDocument 의 `source_id`) · 구절 (그 문서의 글 그대로) | 문서 6 / 8 · 구절 39 / 41 |
| `Tool` · `Pickup` · `ToolMap` | 도구 (개념 카드 · `basis: ConceptRef[]`) · 어느 장면에서 줍나 · 지도 | 도구 4 / 5 |
| `Assembly` · `Scenes` (여덟) | 조립 둘 (`new` · `follower`) · 장면 여덟의 글 | 둘이 같은 모양 |
| `Solve` = `SolveEntry` + `Lab \| null` + `PlainSolve \| null` | 풀이 칸 — 입구 (첫 생각 · 깨는 사실 · 뒤집기 · 그리지 않을 것 · 누구의 말 · 사망) + 체험 + 기본 풀이 | 둘 |
| `ToggleFrame` · `ChainFrame` · `SeatsFrame` · `PictureRef` | 틀 셋 · 그림 부품을 가리키는 이름 | 켜고 끄기 1 · 고리 1 · 자리 1 |
| `PlainFlip` · `PlainThree` · `PlainQuiet` | 기본 풀이 가 · 나 · 다 | 가 1 · 나 1 · 다 0 (견본뿐 — 골든 아님) |

코드: `packages/contract/src/episode.ts` (TypeScript 타입 + **같은 칸 목록을 값으로** `EPISODE_SHAPES` — 타입 식이 문서의 글자 그대로다) · `validate-episode.ts` (`validateEpisode` · `parseEpisode` · `solveProblems`).
검증기는 `EPISODE_SHAPES` 의 타입 식을 읽어 모양을 본다 — 문서 ↔ 표 ↔ 검증이 한 줄기다. 문서의 타입 블록과 표가 어긋나면 `test/contract-docs.test.ts` 가 실패하고, 표와 TypeScript 타입의 칸 이름이 어긋나면 컴파일이 안 된다 (`Shape<T>`).

---

## ② UX1-b 의 판단과 까닭

| 물음 | 판단 | 까닭 (EPISODE.md §2 · §3) |
|---|---|---|
| **Series = Storyline 인가** | **다르다. 따로 둔다. 서로 가리키는 칸도 지금은 없다** | ① 실물이 이미 어긋난다 — 금리 2화는 「금리는 어디로」에 들었는데 스토리라인은 "이란 전쟁" 하나뿐이고 FOMC 를 묶는 스토리라인은 없다. 10월 사건의 사실은 `SL-iran-war` v2 에 닿지만 2화는 전쟁을 **일부러 뺐다** (D46 ③) ② 하는 일이 다르다 — 스토리라인은 사실을 갖고 · 버전이 오르고 · 발행물이 버전을 고정한다 (저작 쪽 · 독자에게 안 보인다). 시리즈는 독자에게 보이는 이름 · 차례다 ③ 수가 다르다 — 회차는 시리즈 하나 · 기사는 스토리라인 여럿 ④ 같다고 두면 시리즈 이름 · 소속을 바꾸는 편집이 사실의 소유 · 버전을 건드린다 |
| **Episode ↔ ArticlePackage** | **형제다. 품지도 대신하지도 않는다. 나란히 선다** | 모양이 안 겹친다 (레벨 × 슬라이드 × 블록 × span ↔ 장면 여덟 × 조립 둘 × 풀이 칸). ARTICLE_PACKAGE 의 불변식 (`open_questions` 길이 · `text == linearize`)이 회차에서는 뜻이 없다. 본 화면은 그 계약을 그대로 쓴다 — **한 글자도 안 바꿨다** |
| **회차는 Event 를 가리키나** | **가리킨다 — `event_ref: EventRef` (UUID · D27)** | 실물: 두 회차의 문서 저장소가 사건 폴더다 (`FOMC-20261028` · `KFTC-20261029-DELIVERY-APPS`) — 두 Event 다 `store.json` 에 있다. 골든에 그 UUID 를 넣었다 |
| **ArticleRecord · 판** | **`episode_id` (UUID) + `episode_version` (1부터) — D30 방식 그대로. record + authoring 겉은 만들지 않았다** | 회차의 저작 데이터 (시간 표현 · 스토리라인 핀)는 실물이 없다 — "6주 뒤"는 `calc` 로 글에 붙어 있다. 무엇이 새 판을 만드나는 미확인 (ArticleRecord 도 같다). 회의록이 오면 2화의 새 판이 아니라 **3화**다 (D61 ⑨) |
| **0화는 회차의 한 종류인가** | **아니다.** 0화는 ① 따라잡기 장면 (`scenes.zero` — new 조립에만) ② 시리즈 줄의 한 줄 — 두 곳에만 있다 | 따로 발행된 0화 (표지 · 도구 · 풀이를 가진)가 실물에 없다. 금리 2화의 따라잡기는 "0화와 1화"다 — 0화에 지난 회차의 요지가 붙는다. 그래서 `number ≥ 1` (불변식 2 · 위반 픽스처 `episode-number-zero`). 독립된 0화는 미확인 |
| **회차 번호는 어디에** | `Episode.number` (정수) + 독자가 읽는 글자 `scenes.cover.episode` ("2화") = 시리즈 줄의 `now` 줄 (불변식 7) | 실물에는 글자뿐이었다. 수와 글자의 대응 ("N화")은 검사하지 않는다 — 글의 일 |
| 지난 화를 무엇으로 가리키나 | **가리키지 않는다 (미확인)** — `track` 은 글만 | 금리 2화의 "1화"는 회차가 아니라 본 화면의 9월 기사 (ArticlePackage)다. 가리킬 것이 한 종류가 아니다 |
| 왜 새 파일인가 | `docs/contract/EPISODE.md` | 한 타입은 한 파일. ARTICLE_PACKAGE 는 범위 ("모든 사용자에게 같다" · 레벨)와 불변식이 안 맞고 본 화면이 쓰는 중 · DATA_MODEL 은 저장되는 사실 쪽의 주인 |

---

## ③ 불변식 20 과 위반 픽스처 29

전부 `validateEpisode` 가 본다. 픽스처 = 골든 + 위반 하나 (`_violation { code, of, rule, what, made_from }`). 원본은 `packages/contract/test/episode.test.ts` 의 표 — 파일이 표와 어긋나면 시험이 실패한다.

| # | 불변식 | 코드 | 픽스처 (`fixtures/invalid/`) |
|---|---|---|---|
| 1 | 모양 — 계약의 칸 전부 · 그것만 · 타입대로 | `SCHEMA_KEY` · `SCHEMA_TYPE` · `SCHEMA_MISSING` · `STRING_EMPTY` · `SCHEMA_LENGTH` | `episode-toggle-picture-as-data` (켜고 끄기에 그림 데이터) · `episode-knowledge-state-in-episode` (회차에 `readers.known`) · `episode-concept-ref-not-pinned` (바탕을 이름 글자로) |
| 2 | 판 ≥ 1 · 번호 ≥ 1 (0화는 회차가 아니다) | `ID_RANGE` | `episode-number-zero` |
| 3 | 구절의 문서가 `docs` 에 | `REF_DOC` | `episode-quote-doc-missing` |
| 4 | 글의 `src` 가 `quotes` 에 | `REF_QUOTE` | `episode-src-not-a-quote` |
| 5 | 도구를 가리키는 것이 `tools` 에 · 도구마다 지도의 자리 · 줍는 장면 하나 | `REF_TOOL` | `episode-pickup-unknown-tool` |
| 6 | 조립은 장면 여덟의 차례대로 (cover … aha … keep) | `ASSEMBLY_ORDER` | `episode-assembly-out-of-order` |
| 7 | 시리즈 줄의 `now` 가 하나 · 표지 번호와 같다 | `TRACK_NOW` | `episode-track-two-now` |
| 8 | **구절은 저장된 문서에 그대로** | `QUOTE_VERBATIM` · `DOC_MISSING` | `episode-quote-not-verbatim` |
| 9 | **숫자는 근거 셋 중 하나** (구절 · 계산 · 화면 번호) | `NUMBER_UNGROUNDED` | `episode-number-ungrounded` |
| 10 | 맨 글자열에 숫자 없음 | `BARE_DIGIT` | `episode-bare-digit` |
| 11 | 깨는 사실에 구절 | `BREAKER_SRC` | `episode-breaker-no-src` |
| 12 | 체험이 없으면 기본 풀이 + 까닭 넷 중 하나 · 체험이 있으면 까닭 없음 | `SOLVE_EMPTY` · `PLAIN_WHY` | `episode-no-lab-no-why` |
| 13 | **D61 ④ 사망이면 체험 없음 + "조용히"** | `DEATH_LAB` · `DEATH_NOT_QUIET` · `DEATH_WHY` | `episode-death-with-lab` · `episode-death-not-quiet` |
| 14 | **뒤집기가 없으면 틀을 고를 수 없다** (D61 ⑥) | `NO_FLIP` | `episode-no-flip-with-lab` |
| 15 | 틀의 조합은 넷뿐 | `FRAME_COMBO` | `episode-frame-combo` |
| 16 | **D61 ③ 자리에 앉기는 한 기관 안의 공식 이견에만** (정당 표결이면 거부) · 쪽마다 한 말에 구절 · 수가 표결 기록에 | `SEATS_PARTY_VOTE` · `SEATS_COUNT` · `SEATS_SAID_SRC` · `SEATS_RECORD` · `SEATS_SIDES` | `episode-seats-party-vote` · `episode-seats-count-not-in-record` · `episode-seats-said-no-src` |
| 17 | **UX4-a — `not-yet` 인 쪽은 "그 까닭은 아직 문서에 없다"는 글이 화면에 반드시** | `SEATS_NOT_YET` | `episode-seats-not-yet-unsaid` (가리키지 않음) · `episode-seats-not-yet-not-on-screen` (그 문장을 글에서 뺌) |
| 18 | 고리 둘 ~ 넷 · 닿은 차례대로 · 멈춘 자리 · 오늘의 값에 구절 (UX4-e) | `CHAIN_NODES` · `CHAIN_ORDER` · `CHAIN_NO_STOP` · `CHAIN_VALUE_SRC` | `episode-chain-no-stop` · `episode-chain-out-of-order` · `episode-chain-value-no-src` |
| 19 | 틀을 이으면 탭 · 넘어가는 말 | `FRAME_TAB` | `episode-frames-no-tab` |
| 20 | **D46 ④ 서로 다르게 말하는 것은 양쪽** (둘 이상이거나 빔) · 저마다 구절 | `DIFFER_ONE_SIDE` · `DIFFER_SRC` | `episode-differ-one-side` · `episode-differ-no-src` |

- 픽스처가 없는 코드 (`SCHEMA_MISSING` · `STRING_EMPTY` · `DOC_MISSING` · `DEATH_WHY` · 체험이 있는데 까닭을 적음 · `in-doc` 인데 "아직 없다"를 가리킴)는 시험 안에서 골든을 한 군데 망가뜨려 본다 (`episode.test.ts` "픽스처 없이 보는 것")
- 시안 `check.ts` 의 망가뜨린 견본 12 는 전부 픽스처가 됐다 (E6 ×3 · E3 ×2 · E2 · E4 · E7 · E5 · E9 · B · D). 견본의 "고리가 다 닿았다"는 시안에서 E7 의 **차례** 규칙으로 잡혔었다 (`full → part → full`) — 픽스처는 멈춘 자리 (`CHAIN_NO_STOP`)와 차례 (`CHAIN_ORDER`)를 따로 낸다
- **UX4-a 를 어떻게 기계가 보게 했나** (불변식 17): `SeatSide.not_yet_note` 에 "아직 없다"고 말하는 **문장**을 적고, 그 문장이 그쪽이 한 말 (`said.t`) 안에 **글자 그대로** 있어야 한다. 그쪽에 앉으면 `said` 가 화면에 나온다 — 그래서 "화면에 그 글이 반드시"가 선다. 독자 글은 안 바꿨다 (문장은 이미 2화에 있었다). 한계: 그 문장이 정말 그 뜻인지는 못 본다 (§8 — 스스로 적는 칸). 다른 길은 _open E-5
- **검증기가 못 보는 것** (계약 §8 · §9 끝): `split` · `death` · `why` 가 **참인가** · 글의 뜻이 구절에서 나오는가 · 개념 · 사건이 저장소에 있는가 · 그림 부품이 있는가 (시안 `check.ts` S1 이 본다)

---

## ④ 실물 둘에 없어 "미확인"으로 둔 칸 (계약 §10)

| 무엇 | 왜 |
|---|---|
| 같은 시리즈의 회차 둘 — Series 가 따로 저장되나 · 지난 화를 무엇으로 가리키나 · 따라잡기 / 지나온 줄이 어디서 오나 (UX2-d) · 같은 그림의 지난 값 (UX4-c) · 지도의 자리가 시리즈의 것인가 | 시리즈마다 회차가 하나뿐 — 3화가 첫 실물 |
| 독립된 0화 | 장면과 시리즈 줄의 한 줄로만 있다 |
| 새 판을 만드는 것 · 저작 데이터의 자리 · **발행 시각 · 언어** (ArticlePackage 의 `published_at` · `lang` 에 해당하는 칸이 실물에 없다 — 만들지 않았다) | 실물 없음 |
| 독자 기록이 회차를 가리키는 모양 · "이거 알아요?" 의 답 · 지도가 쌓이는 단위 | D64 OPEN |
| 누가 어느 조립을 받나 · 조립이 둘뿐인가 · 접을지 뺄지 | D66 OPEN — 지식 상태 |
| 지도의 선의 뜻 | D65 OPEN |
| 구절 ↔ Fact (FactSource) · `voice` ↔ 층 다섯 | 손으로 쓴 시안은 사실을 거치지 않았다 — P-E1 |
| 그림 부품의 자리 · 틀의 글 가운데 개념의 것 · `basis[].part` | D67 OPEN |
| 개념에 붙지 않은 그림 · 체험 없는 회차에서 풀이의 도구를 줍는 자리 (UX4-d) | 실물 없음 |
| 틀 넘겨 보기 · 숫자 만지기 · 가르기 · 고리의 가지 · 자리의 세 쪽 | 실물 없음 — 계약에 타입이 없다 |
| **실물 없음인데 타입은 있는 것** (결정에서 왔다): 기본 풀이 "조용히" (`PlainQuiet`) · `why` 넷 · `[chain]` / `[seats]` 홑 조합 · `Lab.seen_title` (골든 둘 다 `null`) · `episode_id` / `series_id` (발급) | D61 ① ④ · D62 ③ · D27 · D30 |

---

## ⑤ 시안이 계약을 쓰게 바꾼 것 · 픽셀 대조

| 파일 | 무엇 |
|---|---|
| `kit/types.ts` | 회차 타입을 지웠다 → `@claro/contract` 에서 가져온다 (`T` = `EpisodeText` · `Concept` = `Tool`). 남은 것은 시안 전용: `ReaderFixture` (두 독자의 고정값) · `LabOnly` (주소 · 문서 파일의 자리) · `EpisodeData = Episode & LabOnly` |
| `kit/frames/types.ts` | 풀이 칸 타입을 지웠다 → 계약에서. 남은 것: `PairStage` (그림 부품의 모양 — 계약 밖) |
| `kit/frames/pictures.ts` (새 파일) | **켜고 끄기의 그림** `mfn-tie` (자리 둘 · 막대 · 알갱이의 수) — 회차 데이터에서 나와 코드로. 계약의 틀은 `picture.id` 로 가리킨다 |
| `episodes/*/data.ts` | 글 · 근거 · 풀이 칸이 전부 빠졌다 (468 + 594 줄 → 33 + 32 줄). `parseEpisode(골든 픽스처)` + 시안 전용 (두 독자 · 주소) |
| `kit/Episode.tsx` · `ConceptMap.tsx` · `parts.tsx` · `shelf.ts` · `frames/*.tsx` | 칸 이름만 (snake_case · `copy` → `scenes` · `concepts` → `tools` · `layer` → `voice` …). 고리의 값은 `.t` 로 읽는다. `seen_title` 이 있으면 그림을 본 독자의 머리로 (지금은 둘 다 `null` — 화면 그대로). 모양 · 움직임 값 0자 |
| `check.ts` | **계약 검증을 부른다** (`validateEpisode` — 저장된 문서를 읽어 구절 대조까지) + 화면 쪽만: S1 그림 부품이 있다 · S2 틀 조합을 세울 화면 부품이 있다 · S3 두 독자 고정값이 가리키는 것이 있다 · S4 시안 전용 글에 숫자 없음 · S5 조용히 견본이 계약의 풀이 규칙에 맞다. 규칙 A ~ E 와 망가뜨린 견본 12 는 계약으로 갔다 (겹치지 않는다) |
| `shots.ts` · `diff.mjs` · `episode.css` · `frames.css` · 표지 그림 · 도구 그림 | 0자 |

**독자 글**: 골든은 시안 데이터 (`9bf4ede`)를 변환 스크립트로 옮겼다 (손으로 다시 치지 않았다). 변환하며 대 본 수 — 구절 39 / 41 · 문서 6 / 8 · 숫자가 든 글 39 / 68 · 밝혀 둔 예외 7 / 18 — 전부 UX-4 로그의 수와 같다.
글 수만 금리가 126 → 129 다 (고리의 값 셋이 맨 글자열에서 `EpisodeText` 가 됐다 — 글자는 같다).

**픽셀 대조** — `shots.ts` (390×844) 로 **바꾸기 전의 빌드** (UX-4 의 것 · 포트 3200 에 떠 있던 것)를 먼저 `all` 로 찍고 (96장: 두 회차 × 두 독자의 모든 장면 74 + 체험 없이 보기 · 그림을 본 독자 · 조용히 견본 22), 바꾼 뒤 다시 빌드해 같은 차례로 찍어 `diff.mjs` 로 견줬다.
결과는 아래 "검증" 에 붙인 그대로.

---

## ⑥ 파이프라인이 낼 것 — 계약 칸마다 (UX-4 ② 를 계약 칸으로)

**p3** 사실 (낱개 · 구절 · fact_type) · **p4** 슬롯 (`statement_diff` 등) · **p5** 해석 (방어용 · 반증 기록 · 빈 슬롯) · **라이브러리** 개념 · **글** = 쉬운 말로 쓰는 새 단계 (D60 — 지금 없다. 재료를 옆에) · **사람**.
첫 목표는 데이터만으로 서는 것 — 어디서 멈추나 · 자리에 앉기 · 기본 풀이 (D62 ①).

| 계약 칸 | 어디서 | |
|---|---|---|
| `episode_id` · `episode_version` · `code` · `number` | 발행 절차 (기계) | 번호 = 시리즈의 다음 수 |
| `event_ref` | 사건 (`store.json` 의 Event) | 이미 있다 |
| `series` | **사람** (시리즈를 만들 때 한 번) | 사건 → 시리즈를 잇는 단계가 없다 (UX-2 ⑥ "시리즈 잇기") |
| `track` | 시리즈 + 지난 회차의 제목 → 기계 · 다음 화 제목은 글 | 지난 화를 가리키는 모양은 미확인 |
| `docs` · `quotes` | **p3** — 사실의 원문 위치 (FactSource) → 구절 | 구절 ↔ Fact 는 _open E-2. 권리: git 에 있는 문서만 |
| `voice_labels` | 글 (기관 이름 — p3 `actor`) | |
| `EpisodeText.src` · `calc` · `voice` | 글을 쓸 때 함께 — src = 쓴 사실의 구절 · calc = ComputedNumber 방식 (날짜 차 · 합) · voice = p3 `fact_type` (OFFICIAL_CLAIM → official · 사실 → fact · 풀어 쓴 것 → explain) | 불변식 8 · 9 가 기계로 받친다 |
| `tools[]` `name` · `short` · `body` · `use` | **라이브러리** (문안) → 글 (말투 · 이 회차에서의 쓰임). 라이브러리에 없으면 **사람** (콘텐츠 — Atom 규율) | 금리 5 중 4 가 라이브러리 바탕 |
| `tools[].basis` | **라이브러리** — 개념 ↔ 사건 연결 (새 단계 ③) | `part` 는 집필 단계가 안다 (E-4) |
| `pickup` | 글 (어느 도구를 풀이 앞에 · 풀이에서 · 이어짐에서) — 기계가 제안 | |
| `assembly` | 고정값 (실물 둘이 같다) — 규칙은 D66 | |
| `scenes.cover` · `event` | 글 — 재료 p3 (결정 · 표결 · 금액) · 끌림 (수수께끼)은 **p5 방어용 해석의 뒤집은 꼴** (새 단계 "끌림") | 제목 (물음)은 사람이 본다 |
| `scenes.zero` (따라잡기) | 시리즈의 지난 사건들 — p3 (스토리라인 · 지난 사건의 사실) → 글 | 회차가 쌓이면 지난 회차에서 (미확인) |
| `scenes.aha.real` · `verdict` | **p3** (당사자가 한 말 · 수) → 글 | |
| `scenes.compare` | **p4 `statement_diff`** (지난 문서 ↔ 이번 문서) → 글 | 금리 2화가 그대로 됐다 (UX-2 ⑥) |
| `scenes.next` `line` · `coming` · `unknown` | p3 (날짜) · **p5 빈 슬롯** (아직 모르는 것) · 다음 문서 일정 (p3) | |
| `scenes.keep` | 글 (오늘의 한 줄 = 뒤집기의 맺음) | |
| `map.at` · `edges` · `ghosts` | **사람** (손으로 놓는다) | D65 OPEN |
| `solve.entry.first_thought` | **없다** — p5 방어용 해석의 뒤집은 꼴 (UX3-a) · 문서 밖이면 라이브러리 "흔한 오해" (지금 없다) → 글 | 새 단계 ① |
| `solve.entry.breaker` | **p3** (사실은 있다 — 어느 것이 깨는 사실인지 고르는 것이 없다) → 글 | 구절 필수 (불변식 11) |
| `solve.entry.flip` | **p5 방어용 해석** → 글 · **사람이 진짜인지 본다** (UX-3 ⑦-1) | 없으면 `null` → 기본 풀이 (불변식 14) |
| `solve.entry.not_drawn` | **p5 빈 슬롯 · 반증 기록** | 가장 잘 돼 있다 |
| `solve.entry.whose` | p3 `fact_type` · `actor` (D46) → 글 | |
| **`solve.entry.death`** | **사람** | 스스로 적는 칸 (§8) |
| `lab.title` · `setup` · `seen_title` | 글 · 개념 체험이면 라이브러리 | `seen_title` 은 실물 없음 |
| `ChainFrame.nodes[]` `id` · `name` · 차례 · `idle` | **라이브러리** (개념의 그림 — 고리의 이름과 차례) · 지금 없다 = 새 단계 ② "사슬 엮기" | |
| `ChainFrame.nodes[]` `reach` · `after` · `still` (오늘의 값) | **p3** ("올렸다" ST-09 · "일부에서 조여졌다" PC-10 · "여전히 높다" ST-10) | 구절 필수 (불변식 18). **3화는 이 값 셋과 자리의 `said` · `why` 만 바꾸면 선다** |
| `ChainFrame.unknown` | **p5 빈 슬롯** | |
| `ChainFrame.action` · `again` | 사람 → 라이브러리 (비유 — 브레이크) | |
| `ChainFrame.tab` · `go_on` · `caption` | p3 (날짜 → 계산) · 글 | |
| `SeatsFrame.ground.body` · `record` | **p3** | |
| **`SeatsFrame.ground.split`** | **사람** (AI 는 틀을 내놓으려는 쪽으로 기운다 — UX-3 ⑦-2) | 스스로 적는 칸 |
| `SeatSide.count` · `group` · `said` | **p3** (표결 수 · 반대자 · 양쪽 말) — 채움: 높음 | 수는 표결 기록에 (불변식 16) |
| **`SeatSide.why`** · `not_yet_note` | p5 빈 슬롯이 "까닭이 문서에 없다"를 준다 → **사람이 확인** | 불변식 17 |
| `SeatsFrame.choose` · `label` · `you` · `other` · `result` | 글 (공통에 가깝다) · `result` = p3 | |
| `ToggleFrame` 전부 + 그림 부품 | **사람 — 개념마다 한 번** (D62 ①). 오늘의 값은 `device.on` · `caption` (p3) | 파이프라인의 첫 목표가 아니다 |
| `picture.id` · `picture.tool` · `born` | 라이브러리 (개념 ↔ 그림) — 새 단계 ③ | D67 OPEN |
| **`plain.why`** | **사람** | 스스로 적는 칸 |
| `PlainFlip` | **채울 것이 없다** — 입구가 차면 나온다 | |
| `PlainThree` `known` · `unknown` · `differ` | p3 · **p5 빈 슬롯** · p3 (양쪽 공식 말 — 둘 이상이거나 빔) | |
| `PlainQuiet` | p3 · 다음 문서 일정 · 글 | 실물 없음 |

**사람이 채워야 하는 칸** (파이프라인이 채우게 두면 안 되는 것): `solve.entry.death` · `SeatsGround.split` · `SeatSide.why` (확인) · `plain.why` · 뒤집기가 진짜인가 (`flip`) · 그림이 `not_drawn` 을 넘지 않았나 · `map` 의 자리와 선 · `series` · 켜고 끄기 한 벌 (개념마다 한 번) · 라이브러리에 없는 도구.

---

## ⑦ OPEN 으로 올린 것 (`docs/DECISIONS.md`)

| ID | 무엇 | 어디서 |
|---|---|---|
| **D64** | "이거 알아요?" 의 답이 관찰 기록에서 무엇인가 · 독자의 지도가 쌓이는 단위 (도구인가 라이브러리 개념인가) · 독자 기록이 회차를 가리키는 모양 | UX1-c · UX2-g |
| **D65** | 개념 지도의 선의 뜻 · 자리는 누구의 것인가 | UX1-d |
| **D66** | 조립 규칙 — 누가 어느 조립을 받나 · 조립이 둘뿐인가 · 접을지 뺄지 (D4 · D21 과 함께) | UX1-e |
| **D67** | 개념의 그림 부품 · 틀의 글 가운데 개념의 것을 어디에 두나 · `basis[].part` | UX3-b · UX4-g |

넷 다 정하지 않았다. 계약의 그 칸은 "미확인"이다 (실물의 모양만 받았다).

---

## ⑧ _open (계약 §11 과 같은 번호) · 스스로 내린 판단

| # | 무엇 | 누가 |
|---|---|---|
| E-1 | **칸 이름을 snake_case 로 바꿨다** — 다른 계약 셋 (`event_ref` · `open_questions` · `concept_id`)과 맞추려고. 시안 코드의 칸 이름도 따라 바뀌었다 (화면 픽셀 0) | PM |
| E-2 | 구절이 Fact 를 거치지 않는다 — P-E1 이 낸 회차에서 `fact: FactRef` 를 더할지 | PM → P-E1 |
| E-3 | `voice` 셋 ↔ ARTICLE_PACKAGE 층 다섯 | 본 화면을 옮길 때 |
| E-4 | **골든의 `basis[].part` 가 전부 `null`** ("모른다") — CONCEPT_IDENTITY §3.3 의 `null` 과 뜻이 어긋난다. 지어내지 않았다. 개념 버전은 라이브러리의 **지금** 버전을 적었다 (C-0001@1 · C-0002@4 · C-0004@1 · C-0005@3 · C-0006@1 · C-0012@1) — UX-2 가 쓴 날 (11/11)과 같다 | 콘텐츠 · PM |
| E-5 | `not_yet_note` 를 `said.t` 의 조각으로 봤다 (불변식 17) — 독자 글 · 화면을 안 바꾸는 길. 따로 보이는 칸으로 만드는 길도 있다 | PM |
| E-6 | 굵게가 `**…**` (ARTICLE_PACKAGE 는 `<b>`) | 본 화면을 옮길 때 |
| E-7 | **체험이 있는 회차의 기본 풀이를 받는다 (`why: null`)** — 시안의 `"demo"` 를 계약에 들이지 않으려고. 금지하면 골든에서 기본 풀이 글이 빠진다 (금리 13 덩이 — 세 칸의 유일한 실물) | PM · 도윤 (D62 ④) |
| E-8 | `episode_id` · `series_id` 발급 · `code` 는 시안의 글자 (`fomc` · `rate`) 그대로 — code 규칙은 안 정했다 | PM |
| E-9 | `conceptOrder` · `toolOrder` · `lateTool` · `pickedAfter` 넷을 `tools[]` 의 차례 + `pickup` 하나로 줄였다 (같은 것을 두 번 적고 있었다 — 변환할 때 넷이 서로 맞는지 대 보고 줄였다) | PM |
| E-10 | 고리의 값에 구절을 달았다 (UX4-e) — 시안 주석에 적혀 있던 구절 셋. `voice` 는 안 달았다 | PM |
| E-11 | **`scripts/verify-article.py` 를 3줄 고쳤다** — 그 검사가 `fixtures/invalid/*.json` 을 전부 "기사 골든 한 벌의 위반"으로 읽어서, 회차 위반 픽스처 29 가 FAIL 이 된다. `episode-` 로 시작하는 파일을 건너뛰게 했다 (기존 3 건은 PASS 그대로 — 아래 검증) | PM |
| E-12 | 위반 픽스처가 통짜 파일 29 (1.5 MB) 다 — 기존 방식 (골든 + 위반 하나 · 통짜)을 따랐다. 무겁다면 "골든 + 고친 곳" 꼴로 줄일 수 있다 | PM |
| E-13 | 조용히 견본 (`episodes/quiet-sample/`)은 골든이 아니다 — 계약 타입 (`SolveEntry` · `PlainQuiet`)으로 타입만 맞췄고, `check.ts` S5 가 계약의 풀이 규칙을 대 본다 | — |
| E-14 | 시안의 따라온 독자 고정값 · 책장 (`kit/shelf.ts`)은 "다른 시리즈의 도구"를 시리즈 `code` + 도구 `key` 로 가리킨다 — 계약의 것이 아니다 (D64) | — |
| E-15 | 픽셀 대조에서 긴 장면 다섯 (이어짐 · 견주기)은 UX-4 때와 똑같이 찍는 때의 떨림으로 "같다"를 픽셀로 못 보인다 (UX4-j) — 같은 빌드를 두 번 찍어 그 다섯이 똑같이 다른 것을 보였다 | 다음에 `shots.ts` 를 만질 때 |

---

## 검증 (붙인 그대로)

```
$ pnpm -s typecheck
$ pnpm -r typecheck
Scope: 5 of 6 workspace projects
packages/contract typecheck$ tsc -p .
packages/pipeline typecheck$ tsc -p .
packages/tokens typecheck$ tsc -p .
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck$ tsc -p .
packages/db typecheck: Done
apps/web typecheck$ tsc -p .
apps/web typecheck: Done
```

```
$ pnpm -s test        (exit 0 — 끝줄들)
packages/contract test:  Test Files  4 passed (4)
packages/contract test:       Tests  86 passed (86)
packages/pipeline test:  Test Files  9 passed (9)
packages/pipeline test:       Tests  87 passed (87)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   56 passed (3.1m)
```
packages/contract 는 40 → 86 (회차 41 · 문서 ↔ 코드 5). `logs/frontend/F-2b/` 의 그림 여섯 (`desktop-basic-1` · `desktop-basic-9` · `se-basic-1` · `x-basic-1` · `x-basic-9` · `motion-375x667.webm`)이 다시 찍혀서 **파일 하나씩** `git checkout -- <파일>` 로 되돌렸다.

**골든 통과 · invalid 전부 거부** — `packages/contract/test/episode.test.ts`:
```
$ pnpm --filter @claro/contract exec vitest run --reporter=verbose test/episode.test.ts
 ✓ test/episode.test.ts > 골든 > 배달앱 1화 — 통과 · 경고 없음 13ms
 ✓ test/episode.test.ts > 골든 > 금리 2화 — 통과 · 알림 하나 (반대쪽의 까닭은 아직 문서에 없다 — UX4-a) 14ms
 ✓ test/episode.test.ts > 골든 > `_` 필드를 무시하고, 돌려주는 회차에는 남기지 않는다 18ms
 ✓ test/episode.test.ts > 골든 > 문서를 주지 않으면 구절 대조(불변식 8)를 건너뛰고 그렇다고 알린다 1ms
 ✓ test/episode.test.ts > 골든 > 두 골든이 같은 모양으로 다른 것을 싣는다 — 장면 여덟 · 조립 둘 · 틀 셋 2ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > 표의 파일이 전부 있고, 폴더에 표 밖의 episode-* 파일이 없다 0ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-toggle-picture-as-data.json 1ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-knowledge-state-in-episode.json 1ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-concept-ref-not-pinned.json 2ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-number-zero.json 9ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-quote-doc-missing.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-src-not-a-quote.json 8ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-pickup-unknown-tool.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-assembly-out-of-order.json 7ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-track-two-now.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-quote-not-verbatim.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-number-ungrounded.json 7ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-bare-digit.json 1ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-breaker-no-src.json 8ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-no-lab-no-why.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-death-with-lab.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-death-not-quiet.json 7ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-no-flip-with-lab.json 10ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-frame-combo.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-seats-party-vote.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-seats-count-not-in-record.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-seats-said-no-src.json 8ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-seats-not-yet-unsaid.json 5ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-seats-not-yet-not-on-screen.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-chain-no-stop.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-chain-out-of-order.json 8ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-chain-value-no-src.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-frames-no-tab.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-differ-one-side.json 6ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > episode-differ-no-src.json 9ms
 ✓ test/episode.test.ts > 위반은 거부한다 — fixtures/invalid/episode-*.json > 불변식의 코드마다 픽스처가 하나 이상 있다 0ms
 ✓ test/episode.test.ts > 픽스처 없이 보는 것 > 빠진 칸 · 빈 글 · 모르는 갈래 2ms
 ✓ test/episode.test.ts > 픽스처 없이 보는 것 > 체험이 있는데 체험이 없는 까닭을 적음 → PLAIN_WHY · 까닭이 사망인데 death 가 아님 → DEATH_WHY 13ms
 ✓ test/episode.test.ts > 픽스처 없이 보는 것 > 저장된 문서에 없는 문서 → DOC_MISSING 5ms
 ✓ test/episode.test.ts > 픽스처 없이 보는 것 > 까닭이 문서에 있다면서(in-doc) '아직 없다'는 글을 가리킴 → SEATS_NOT_YET 5ms
 ✓ test/episode.test.ts > 픽스처 없이 보는 것 > 체험 없는 회차 (조용히) — 사망 · 체험 없음 · 뒤집기 없음이 함께 선다 (풀이 칸만 — 실물 회차 없음) 0ms
 Test Files  1 passed (1)
      Tests  41 passed (41)
```

**기존 기사 계약의 검사는 그대로** (회차 위반 픽스처 29 를 건너뛴다 — _open E-11):
```
$ python3 scripts/verify-article.py        (exit 0)
PASS  골든 한 벌 — fixtures/fomc-2026-09.article.json · fixtures/fomc-2026-09.record.json · fixtures/store.json
PASS  fixtures/invalid/derived-from-volatile.json  — fomc-2026-09.record.json 를 갈아 끼움 · 거부 기대 DERIVED_FROM_VOLATILE
PASS  fixtures/invalid/ref-label-not-uuid.json  — fomc-2026-09.article.json 를 갈아 끼움 · 거부 기대 REF_SHAPE
PASS  fixtures/invalid/volatile-missing-asof.json  — store.json 를 갈아 끼움 · 거부 기대 VOLATILE_MISSING_AS_OF
$ python3 scripts/selftest-verify-article.py     → OK
$ python3 scripts/verify-data-model.py           → OK
$ python3 scripts/verify-observation.py          → OK (WARN CORR_DRAFT 는 전부터 있던 것)
$ python3 scripts/verify-contract-coverage.py    → OK
```

**시안 `check.ts`** — 계약 검증을 부르고 화면 쪽만 따로 본다:
```
$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts

■ 누가 값을 정하나 · 1화 (delivery)
구절 39 (문서 6) · 글 94 — 숫자가 든 글 39
도구 4 — 개념 라이브러리 바탕 0 · 손으로 4
밝혀 둔 예외 7:
  /track/0/no: "0화" (ui)
  /track/1/no: "1화" (ui)
  /scenes/cover/episode: "1화" (ui)
  /scenes/zero/kicker: "0화 · 지금까지의 이야기" (ui)
  /scenes/zero/title: "같은 요구가, 6년 전에도 있었어요" (계산 — 6 = 2026 − 2020 (요기요 발표 2020년 · 이번 결정 2026년))
  /scenes/event/kicker: "1화 · 오늘의 사건" (ui)
  /map/where_today: "1화에서 주움" (ui)
풀이 칸: 체험 [toggle] · 기본 풀이 flip (까닭: 없음 — 체험이 있다) · 뒤집기 A = B · 사망 아니오
OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다

■ 금리는 어디로 · 2화 (fomc)
구절 41 (문서 8) · 글 129 — 숫자가 든 글 68
도구 5 — 개념 라이브러리 바탕 4 · 손으로 1
밝혀 둔 예외 18:
  /track/0/no: "0화" (ui)
  /track/1/no: "1화" (ui)
  /track/1/title: "3년 만에 금리를 올렸어요" (계산 — 3 = 2026 − 2023 (마지막 인상 2023년 7월 · 다시 올린 2026년 9월))
  /track/2/no: "2화" (ui)
  /tools/0/body/0: "미국 중앙은행인 연준이 정하는 금리예요. 연준 안의 회의(FOMC)가 한 해에 8번 정기적으로 모여서, 올릴…" (계산 — 8 = 원문의 “eight regularly scheduled meetings”)
  /tools/2/body/0: "금리는 한 사람이 정하지 않아요. 회의에서 투표권을 가진 **12명**이 표결로 정해요." (계산 — 12 = 10 + 2 (성명문의 “10 – 2 vote”))
  /scenes/cover/episode: "2화" (ui)
  /scenes/cover/recap/0: "지난 화에서 연준은 3년 만에 금리를 올렸어요. 9월 16일, 12 대 0이었어요." (계산 — 3 = 2026 − 2023 (마지막 인상 2023년 7월))
  /scenes/zero/kicker: "0화와 1화 · 지금까지의 이야기" (ui)
  /scenes/zero/title: "지난 회의에서는 3년 만에 올렸어요" (계산 — 3 = 2026 − 2023 (마지막 인상 2023년 7월 · 다시 올린 2026년 9월))
  /scenes/zero/beats/1/body: "금리는 그대로였어요. 그런데 투표한 12명 가운데 3명이 “지금 올려야 한다”며 반대했어요." (계산 — 12 = 9 + 3 (성명문의 “9 – 3 vote”))
  /scenes/zero/beats/3/body: "6주 뒤에 다시 모였어요. 물가는 아직 목표보다 높아요. 이번에도 올렸을까요?" (계산 — 6 = 9월 16일 → 10월 28일 = 42일)
  /scenes/event/kicker: "2화 · 오늘의 사건" (ui)
  /scenes/next/coming/0/body: "회의에서 오간 이야기를 적은 기록(회의록)은 결정 3주 뒤에 공개돼요. 이번 것은 11월 18일 무렵이에요.…" (계산 — 3 = 원문의 “three weeks” · 11 = 10월 28일 + 3주 · 18 = 10월 28일 + 21일 = 11월 18일)
  /scenes/next/coming/1/body: "다음 회의는 12월 8~9일이에요. 새 점도표도 이때 나와요. 9월 점도표에서는 18명 가운데 16명이 올해…" (계산 — 16 = 12 + 4 (2026년 말 금리를 4.125 · 4.375 로 본 사람 — 지금 범위의 가운데 3.875 보다 높다))
  /solve/lab/frames/0/go_on: "6주 뒤, 10월 회의로" (계산 — 6 = 9월 16일 → 10월 28일 = 42일)
  /solve/lab/frames/1/caption/before: "6주 뒤, 10월 회의예요. 12명이 같은 그림을 봤어요. 힘은 가운데까지 왔고, 물가는 아직 높아요. 당신…" (계산 — 6 = 9월 16일 → 10월 28일 = 42일 · 12 = 10 + 2)
  /map/where_today: "2화에서 주움" (ui)
풀이 칸: 체험 [chain → seats] · 기본 풀이 three (까닭: 없음 — 체험이 있다) · 뒤집기 A ≠ B · 사망 아니오
  알림 — /solve/lab/frames/1/sides/1: "raise" 쪽의 까닭은 아직 문서에 없다 (not-yet) — 그 문서가 나올 때까지 이 쪽은 반쪽이다
OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다

■ 조용히 견본 — 실제 사건 아님 (episodes/quiet-sample)
풀이 칸: 체험 없음 · 기본 풀이 quiet (까닭: death) · 뒤집기 없음 · 사망 예
OK — 숫자가 든 글이 없고, 풀이 칸의 규칙이 맞다

■ 공통 화면 글 (kit/chrome.ts)
OK — 숫자가 든 글이 없다

OK — 두 회차 (계약 + 화면 쪽) · 조용히 견본 · 공통 글
(exit 0)
```

**스크린샷 대조** (390×844 · `shots.ts` · `diff.mjs`)

① UX-4 의 `after/` (풀이 23장) ↔ 바꾼 뒤:
```
$ node src/app/lab/episode/diff.mjs logs/frontend/UX-4/after <바꾼 뒤> <sharp>

23장 — 같음 23 · 다름 0 · 없음 0 · 뒤에만 있음 73
```
② 바꾸기 전의 빌드 (UX-4 `9bf4ede` · 포트 3200 에 떠 있던 것)를 `all` 로 찍은 96장 ↔ 바꾼 뒤 96장 (두 회차 × 두 독자의 모든 장면 74 + 체험 없이 보기 · 그림을 본 독자 · 조용히 견본 22):
```
$ node src/app/lab/episode/diff.mjs <전> <후> <sharp>
다름  delivery-follower-05-compare.png  픽셀 186 (0.057%) · 가장 큰 차이 1/255
다름  delivery-new-06-next-b.png  픽셀 2509 (0.762%) · 가장 큰 차이 15/255
다름  delivery-new-06-next.png  픽셀 6161 (1.872%) · 가장 큰 차이 45/255
다름  delivery-plain-b.png  픽셀 611 (0.186%) · 가장 큰 차이 1/255
다름  fomc-new-06-next-b.png  픽셀 28183 (8.562%) · 가장 큰 차이 15/255
다름  fomc-new-06-next.png  픽셀 14680 (4.460%) · 가장 큰 차이 45/255
다름  fomc-seen-b.png  픽셀 356 (0.108%) · 가장 큰 차이 1/255

96장 — 같음 89 · 다름 7 · 없음 0
```
③ 바꾼 뒤의 **같은 빌드를 한 번 더** 찍어 견준 것 (찍는 쪽의 떨림):
```
$ node src/app/lab/episode/diff.mjs <후> <후를 한 번 더> <sharp>
다름  delivery-follower-05-compare.png  픽셀 237 (0.072%) · 가장 큰 차이 1/255
다름  delivery-new-06-next-b.png  픽셀 42101 (12.790%) · 가장 큰 차이 205/255
다름  delivery-new-06-next.png  픽셀 18553 (5.636%) · 가장 큰 차이 217/255
다름  delivery-plain-b.png  픽셀 598 (0.182%) · 가장 큰 차이 1/255
다름  fomc-new-06-next-b.png  픽셀 24099 (7.321%) · 가장 큰 차이 4/255
다름  fomc-new-06-next.png  픽셀 11667 (3.544%) · 가장 큰 차이 23/255

96장 — 같음 90 · 다름 6 · 없음 0
```
**읽는 법 — 정직하게**
- **89장은 픽셀까지 같다.** 풀이 장면 · 누르는 단계 · 표지 · 따라잡기 · 사건 · 도구 줍기 · 남음 · 기본 풀이 (세 칸을 여는 단계까지) · 그림을 본 독자 · 조용히 견본
- 다른 일곱 가운데 **다섯은 UX-4 때와 같은 파일**이다 (이어짐 · 견주기 — UX4-j). 같은 빌드를 두 번 찍어도 똑같이 다르다 (③) — 줄이 차례로 떠오르는 움직임이 찍는 때까지 안 끝난다
- **나머지 둘 (`delivery-plain-b` · `fomc-seen-b`)은 가장 큰 차이가 1/255 다.** 둘 다 화면 맨 아래 (y 773 ~ 830)의 "실제로 ○○이 말한 것" 줄이 떠오르는 끝자락이다 — 스위치를 누른 0.9초 뒤에 찍는데 그 줄은 차례가 늦다.
  `delivery-plain-b` 는 같은 빌드를 두 번 찍어도 다르다 (③ 598 픽셀). `fomc-seen-b` 는 같은 빌드를 다섯 번 찍어 네 번은 서로 같고 (전과는 356 픽셀) 한 번은 달랐다 (전과 10 픽셀) — 찍을 때마다 움직이는 자리다.
  **한계: 이 일곱 장은 "같다"를 픽셀로 보이지 못했다.** 바꾸기 전의 빌드는 다시 빌드하며 사라져 더 찍어 볼 수 없다. 그 장면들의 코드는 칸 이름만 바뀌었다
- 콘솔 오류 1 (`404`)은 바꾸기 전의 빌드에서도 같다 (UX4-l)

**폰 서버** — 다시 빌드해 띄워 뒀다 (포트 3200 · `pnpm --filter @claro/web phone` · 백그라운드). 빌드는 시안 코드를 다 바꾼 뒤의 것이다 (그 뒤로 고친 것은 주석뿐). 끄려면 `lsof -ti :3200 | xargs kill`.
```
$ curl LAN 주소 (192.168.45.45:3200)
200 lab/episode
200 lab/episode/fomc
200 lab/episode/quiet
200 (본 화면 /)
```
