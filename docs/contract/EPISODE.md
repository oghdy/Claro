# EPISODE

## CHANGELOG
| 날짜 | 변경 | 세션 |
|---|---|---|
| 2026-11-11 | 생성 — 회차 계약. 실물 둘 (배달앱 「누가 값을 정하나」 1화 · 금리 「금리는 어디로」 2화 — `apps/web/src/app/lab/episode/` 의 시안 `9bf4ede`) 과 시안 타입 (`kit/types.ts` · `kit/frames/types.ts`) · 시안 검사 (`check.ts` A ~ E) · D46 · D57 ~ D62 에서 도출. 골든 `fixtures/episode-price-1.json` · `episode-rate-2.json` · 위반 픽스처 29. **게이트 전** | B-E1 |
| 2026-11-12 | **넘겨 보기 틀** — `PagesFrame` · `PageCard` · `PagesCaption` (§1 · §7.8) · 불변식 21 ~ 24 (`PAGES_CARDS` · `PAGES_CARD_SRC` · `PAGES_WHEN` · `PAGES_STAR` · `PAGES_FUTURE` · `PAGES_ORDER`) · 서는 조합에 `[pages]` (불변식 15). 셋째 실물 하나 (개인정보위 「내 정보는 누가 지키나」 1화 — 시안 `/lab/episode/pipc`)에서 도출 — 그 실물에 없는 것은 미확인 (§10). 골든 셋째 `fixtures/episode-privacy-1.json` · 위반 픽스처 9. `Lab.seen_title` 의 첫 실물 · 조립에서 따라잡기와 견주기를 둘 다 보이는 첫 실물 (규칙은 그대로 미확인). **다른 틀 · 다른 칸은 바꾸지 않았다** | UX-5 |
| 2026-11-12 | **지난 회차 칸 셋 — 실물 전 · 3화에서 확인** (D75 · P-E2 ⑦ N-1 ~ N-3): 지난 회차를 가리키는 칸 `Episode.previous?: EpisodeRef` (§3.4) · 지난 회차에서 온 구절의 키 꼴 `<code>:<key>` (§4.5) · 같은 그림의 지난 값 `ReachedNode` · `StoppedNode` 의 `before?: ChainBefore` · `SeatSide.before?: SeatBefore` (§7.9). 불변식 25 · 26 (`PREV_MISSING` · `PREV_VALUE_SRC` · `PREV_KEY`) · 지난 회차를 받으면 대 보는 것 (`PREV_MISMATCH` · 알림 `PREVIOUS_NOT_CHECKED`) · 위반 픽스처 셋. 모양은 P-E2 가 지어 본 이어 쓰기 (`review.json` 의 `carry` · `packages/pipeline/src/episode.ts`)에 맞췄다. **고를 수 있는 칸 (`?`)이라 골든 셋은 0자 · 다른 칸은 바꾸지 않았다** | UX-6 |
| 2026-11-14 | **짧은 이야기 · 번호 없는 이야기 (D80 · D86)** — 따로 선 타입 `ShortStory` (+ `Sibling` · `ToolsFrom` · 장면 넷 `ShortScenes` · `ShortSolve`) · 무게 (`StoryWeight` · Episode 에 고를 수 있는 칸 `weight?: "long"` — 없으면 긴 이야기) · `NoLabWhy` 에 `"short"` · `ShortSceneId` · §13 · 불변식 27 ~ 29 (`PLAIN_WHY` · `SCHEMA_KEY` · `REF_TOOL` · `ID_RANGE` · `SIBLING_MISMATCH` · 알림 `SIBLING_NOT_CHECKED` · `TOOLS_FROM_NOT_CHECKED`) · 검증 `validateShortStory` · `validateStory`. 실물 하나 (UX-7 짧은 이야기 — 영훈의료재단 · `lab/today/short`)에서 도출 · 골든 넷째 `fixtures/episode-short-privacy-yeonghun.json` · 위반 픽스처 4. 덧붙임 · 개념 이야기 · 첫 이야기가 나중에 "1화"가 되는 판 처리는 칸 없음 (미확인 · §13.7). **긴 이야기의 다른 칸 · 골든 셋은 바꾸지 않았다** | B-E3 |

> **상태: 게이트 전 (B-E1 · 2026-11-11).** _open 은 §11.
> 회차 (Episode) = Claro 가 기사를 내는 새 모양 (D59). 시리즈 안의 한 화 · 장면 여덟 · 가운데에 독자가 직접 해 보는 풀이.
> 이 계약은 **파이프라인이 회차 하나를 내려면 무엇을 내야 하는가**를 정한다 (D60 · D62 — 첫 시험은 손으로 만든 금리 2화를 다시 만들어 견주는 것).
> **ARTICLE_PACKAGE 를 바꾸지 않는다.** 본 화면 (`/`) 은 지금의 기사 모양 그대로이고, 회차는 그 옆에 나란히 선다 (§2.2).
>
> **원천 (D24)**
> - 실물 — 시안의 두 회차 데이터 (`episodes/delivery/data.ts` · `episodes/fomc/data.ts` @ `9bf4ede` — 지금은 골든 픽스처 둘) ·
>   시안 타입 `EpisodeData` · `Solve` · 틀 셋 · 시안 검사 `check.ts` 의 규칙 A ~ E 와 망가뜨린 견본 12 ·
>   `logs/frontend/UX-1.md` ④ ⑥ · `UX-2.md` ⑤ · `UX-3.md` ⑥ · `UX-4.md` ② ③ ⑥
> - 결정 — D46 (정치 층) · D57 (조립) · D59 (장면 여덟) · D61 (체험 틀 규칙 ① ~ ④ · ⑥) · D62 (그림은 개념의 것 · UX4-a · 그림을 본 독자용 머리말)
> - **원천이 아닌 것** — 조용히 견본 (`/lab/episode/quiet` — 실제 사건이 아니다) · UX-3 의 종이 위 카드 14건 (회차로 만들지 않았다) · 틀 여섯 가운데 코드가 없는 셋 (넘겨 보기 · 숫자 만지기 · 가르기)
>
> - **셋째 실물 (UX-5 · 2026-11-12)** — 개인정보위 과징금 「내 정보는 누가 지키나」 1화 (`fixtures/episode-privacy-1.json` · 재료 `logs/pipeline/E3-1.md` ③ · D69). **넘겨 보기 칸 (§7.8 · 불변식 21 ~ 24)만** 이 실물에서 더했다. 아래의 "실물 둘" · "두 회차"는 B-E1 때의 말 그대로 두었다 — 셋째 골든도 같은 모양을 통과한다
> - **지난 회차 칸 셋 (UX-6 · 2026-11-12) — 실물 전 · 3화에서 확인.** 같은 시리즈의 회차 둘이 아직 없다 (§10). 3화 (「금리는 어디로」 · 10월 회의록 · 11/18 무렵)가 첫 실물이다.
>   원천은 실물 회차가 아니라 결정 (D61 ② "같은 그림 · 오늘 값만" · D62 ③ "3화에서 지난 값을 옆에" · D30 판 가리키기 · D75)과 P-E2 가 지어 본 이어 쓰기 (`logs/pipeline/P-E2.md` ⑦ · `review.json` 의 `carry` — 시험 "이어 쓰기" 넷)다.
>   그래서 칸은 전부 **고를 수 있는 칸 (`?`)** 이고 표시는 **실물 전** — 3화가 나오면 다시 본다 (모양 · `?` 를 `| null` 로 바꿀지 — §11 E-16)
> - **넷째 실물 (B-E3 · 2026-11-14) — 짧은 이야기.** UX-7 의 「병원이 털렸다는데, 어디가 털린 걸까」 (영훈의료재단 — 개인정보위 같은 발표의 병원 쪽 · `apps/web/src/app/lab/today/short/` 의 lab 꼴 「모자람 1 ~ 6」 · `logs/frontend/UX-7.md` ③) ·
>   오늘 화면의 번호 규칙 (`number ≥ 2` 에서 "이어지는 이야기") · 결정 D79 ① ③ · D86. **짧은 이야기 (ShortStory)와 무게 · 번호 없는 이야기 칸은 §13 에만** — 실물이 하나라 표시는 전부 **실물 하나**. 긴 이야기 (Episode)의 칸은 고를 수 있는 칸 `weight?` 하나 말고 그대로다 (골든 셋 0자)
>
> **표시** — **실물** 두 회차에 있다 · **실물 하나** 한 회차에만 있다 · **실물 없음** 결정에서 왔지만 회차 실물이 없다 (첫 실물이 나오면 다시 본다) · **실물 전** 결정과 파이프라인의 시험에서 왔고 다음 회차 (3화)가 첫 실물이다 — 고를 수 있는 칸 · **미확인** 정하지 않았다 (§10)
>
> **검사** — `pnpm --filter @claro/contract test` (`test/episode.test.ts` — 골든 넷 (긴 셋 · 짧은 하나) 통과 · `fixtures/invalid/episode-*.json` 전부 거부 · `test/contract-docs.test.ts` — 이 문서의 타입 블록 ↔ 코드의 칸 목록).
> 검증기는 `packages/contract/src/validate-episode.ts` 의 `validateEpisode(회차, { documents })` · 짧은 이야기는 `validateShortStory(이야기, { documents, episodes })` · 어느 쪽인지 모르면 `validateStory` (§13.1).

---

## 0. 범위

**이 계약이 주인인 것** — Episode · Series · TrackItem · EpisodeRef · EpisodeText · EpisodeDoc · EpisodeQuote · Tool · Pickup · Assembly · 장면 여덟의 글 (Scenes 와 그 아래) ·
ToolMap · Solve · SolveEntry · Flip · Lab · PictureRef · 틀 넷 (ToggleFrame · ChainFrame · SeatsFrame · PagesFrame) · 같은 그림의 지난 값 (ChainBefore · SeatBefore) · 기본 풀이 셋 (PlainFlip · PlainThree · PlainQuiet) ·
짧은 이야기 (ShortStory · Sibling · ToolsFrom · ShortScenes 와 장면 넷 · ShortSolve — §13 · B-E3).

**안 넣는 것**
- **지식 상태.** 독자가 무엇을 아는지 · 누가 "처음 온 독자"인지 · 어느 도구를 접을지 판정하는 것은 이 계약에 없다. 회차는 **조립마다 어느 장면을 보이나**만 적는다 (§5).
  시안의 두 독자 고정값 (`readers` — 아는 개념 · 0화를 읽었나)은 시안 전용이고 계약이 아니다. 회차에 넣으면 거부한다 (`SCHEMA_KEY`)
- 그림 부품 — 표지 그림 · 도구의 작은 그림 · **켜고 끄기의 그림** (§7.3). 코드다. 회차는 이름으로 가리키기만 한다
- 공통 화면 글 ("이거 알아요?" · "알아요" · "내 개념 지도" …) — 화면의 것 (시안 `kit/chrome.ts`)
- Fact · Source · SourceDocument · Event · Storyline → DATA_MODEL. Concept · ConceptRef → CONCEPT_IDENTITY. 여기서는 가리키기만 한다
- 읽기 기록 · "이거 알아요?" 의 답 → OBSERVATION 에도 아직 없다 (**미확인** — D64)
- FINDINGS §9.6 보류 항목 전부. 이 계약에는 문턱 값이 하나도 없다
- 저장 기술 · 테이블 (packages/db 는 건드리지 않았다) · 발행 절차 · 발행 시각

---

## 1. 한눈에

```ts
QuoteKey   = string                // Episode.quotes 의 키 — "st10.vote" · 지난 회차에서 온 구절은 "fomc:omo.2023" (§4.5 · 실물 전)
DocLabel   = string                // Episode.docs 의 키 — "ST-10"
ToolKey    = string                // Tool.key — "rate"
Id         = string                // 가리키는 이름 — 독자 글이 아니다
SourceText = string                // 원문 · 문서 이름 — 독자 글의 숫자 규칙 밖이다
Fragment   = string                // 다른 글 속의 조각 — 그 글이 숫자 규칙을 받는다
TextBody   = string                // 글 한 덩이의 글자 — 숫자는 불변식 9 가 본다
Note       = string                // 적어 둔 말 — 어떻게 계산했나 (calc) · 그리지 않을 것 (not_drawn). 숫자 규칙 밖이다
Point      = [number, number]      // 지도 위의 자리 — 가로 · 세로 (0 ~ 100)
Edge       = [ToolKey, ToolKey]
SceneId    = "cover" | "zero" | "event" | "tools" | "aha" | "compare" | "next" | "keep"
TrackState = "past" | "now" | "next"
Voice      = "fact" | "official" | "explain"
NoLabWhy   = "politics" | "death" | "no-source" | "no-flip" | "short"   // short = 무게 — 짧은 이야기라서 (§13.6)
StoryWeight = "long" | "short"     // 무게 — 긴 이야기 (Episode) / 짧은 이야기 (ShortStory) (§13.1)
ShortSceneId = "cover" | "where" | "why" | "keep"   // 짧은 이야기의 장면 넷 — 차례 고정 (§13.2)
Frame      = ToggleFrame | ChainFrame | SeatsFrame | PagesFrame   // kind 로 가른다
ChainNode  = ReachedNode | StoppedNode                   // reach 로 가른다
PlainSolve = PlainFlip | PlainThree | PlainQuiet         // kind 로 가른다

Episode {                           // 회차 하나 = 발행 한 번. 통째로 불변 (§2.3)
  episode_id:      UUID             // 불변. 실물 없음 — ArticleRecord.article_id (D30) 와 같은 방식
  episode_version: integer          // 1부터. (episode_id · episode_version) 은 전체에서 유일. 무엇이 새 판을 만드나는 미확인
  code:            Id               // 사람이 부르는 이름 — "delivery" · "fomc" (실물). 유일 · 불변
  event_ref:       EventRef         // 이 회차가 다루는 사건 — DATA_MODEL Event 의 UUID (§2.2)
  weight?:         "long"           // 무게 — 없으면 긴 이야기 (골든 셋은 이 칸이 없다). 짧은 이야기는 ShortStory (§13.1)
  series:          Series           // 이 회차가 든 시리즈 (§3)
  number:          integer          // 몇 화인가 — 1부터. 0화는 회차가 아니다 (§3.2)
  track:           TrackItem[]      // 시리즈 줄 — 지난 화 · 지금 · 다음 화 (§3.3)
  previous?:       EpisodeRef       // 지난 회차 — 이 회차가 그림 · 구절을 이어 받은 같은 시리즈의 앞 화 (§3.4). 실물 전 · 3화에서 확인
  docs:            Record<DocLabel, EpisodeDoc>      // 근거 문서 (§4.2)
  quotes:          Record<QuoteKey, EpisodeQuote>    // 근거 구절 — 저장된 문서의 글 그대로 (§4.2)
  voice_labels:    VoiceLabels      // 누구의 말 꼬리표의 이름 — 회차마다 다르다 (§4.4)
  tools:           Tool[]           // 도구 (개념). 차례 = 지도 · "남음"에 나오는 차례 (§6)
  pickup:          Pickup           // 어느 장면에서 어느 도구를 줍나 (§6.2)
  assembly:        Assembly         // 조립 둘 — 어느 장면을 보이나 (§5)
  scenes:          Scenes           // 장면 여덟의 글 (§5)
  solve:           Solve            // 풀이 칸 — 입구 + 체험 | 기본 풀이 (§7)
  map:             ToolMap          // 개념 지도 (§6.3)
}

Series {                            // 시리즈 — 독자가 따라가는 이야기의 묶음. Storyline 이 아니다 (§2.1)
  series_id: UUID                   // 실물 없음 — D27 방식 (UUID + code)
  code:      Id                     // "price" · "rate" (실물). 유일 · 불변
  name:      string                 // "금리는 어디로"
  sub:       string                 // "연준과 물가, 그리고 브레이크"
}

TrackItem {                         // 시리즈 줄의 한 줄
  no:    EpisodeText                // "0화" · "1화" · "다음 화" — 화면 번호 (ui)
  title: EpisodeText
  state: TrackState
}

EpisodeRef { episode_id: UUID, episode_version: integer }   // 회차 하나의 한 판을 가리킨다 — OBSERVATION ArticleRef 와 같은 방식 (D30). 실물 전

EpisodeText {                       // 독자가 읽는 글 한 덩이 (§4.1). 굵게는 **이렇게**, 줄바꿈은 \n
  t:      TextBody
  src?:   QuoteKey[]                // 이 글의 근거 구절들
  calc?:  Record<string, Note>      // 구절의 수로 계산한 수 — { 수: 어떻게 }
  ui?:    true                      // 사실이 아닌 화면 번호 (0화 · 1화)
  voice?: Voice                     // 누구의 말인가 (§4.4)
}

EpisodeDoc {                        // 근거 문서 하나 — DATA_MODEL SourceDocument 를 가리킨다
  source_id: UUID                   // SourceDocument.source_id (= Source.source_id)
  name:      SourceText             // 근거 시트에 보이는 문서 이름 — "연준 FOMC 성명문 (2026-10-28)"
}

EpisodeQuote {
  doc:   DocLabel
  quote: SourceText                 // 그 문서의 글 그대로 (불변식 8)
}

VoiceLabels { fact: string, official: string, explain: string }

Tool {                              // 도구 = 이 회차에서 독자가 줍는 개념 카드 (§6.1)
  key:   ToolKey                    // 회차 안에서 유일
  name:  string                     // "기준금리"
  short: EpisodeText                // 접혔을 때의 한 줄
  body:  EpisodeText[]              // 펼쳤을 때
  use:   EpisodeText                // 이 회차에서 어디에 쓰이나 — 지도에서 보인다
  basis: ConceptRef[]               // 설명의 바탕이 된 개념 라이브러리의 개념들 (CONCEPT_IDENTITY §3.2). [] = 손으로 썼다
}

Pickup {                            // 장면을 지나면 그 장면의 도구를 주운 것이다
  tools: ToolKey[]                  // 도구 줍기 장면 — "이거 알아요?" 의 차례
  aha:   ToolKey[]                  // 풀이에서 생기는 도구 (실물 하나: 금리 "금융 여건")
  next:  ToolKey[]                  // 이어짐에서 하나 더 (실물 둘 다 하나)
}

Assembly {                          // 같은 회차 · 다른 조립 (§5.2). 독자마다 새로 쓰지 않는다
  new:      SceneId[]               // 이 시리즈가 처음인 독자의 조립
  follower: SceneId[]               // 따라온 독자의 조립
}

Scenes {
  cover:   CoverScene
  zero:    ZeroScene
  event:   EventScene
  tools:   ToolsScene
  aha:     AhaScene
  compare: CompareScene
  next:    NextScene
  keep:    KeepScene
}

CoverScene {                        // 표지
  episode:      EpisodeText         // "2화" (ui)
  title:        string              // 물음 제목
  dek:          EpisodeText
  meta:         EpisodeText         // "2026년 10월 28일 결정 · 표결 10 대 2"
  new_hint:     EpisodeText         // new 조립에만 — "이 시리즈가 처음이시네요 …"
  recap_label:  string              // follower 조립에만 — "지난 이야기"
  recap:        EpisodeText[]       // follower 조립에만 — 두 줄
  ask_new:      string              // 물음 버튼 — 조립마다
  ask_follower: string
}

ZeroScene {                         // 따라잡기 — 지금까지의 이야기 (0화 · 지난 화의 요지). 실물 둘은 new 조립에만 · 셋째는 두 조립 모두 (§3.2 · §5.2)
  kicker: EpisodeText
  title:  EpisodeText
  beats:  Beat[]                    // 연표 — 마지막 칸이 오늘
  ask:    string
}

Beat { when: EpisodeText, head: string, body: EpisodeText }

EventScene {                        // 사건과 끌림
  kicker:      EpisodeText
  title:       string
  lead:        EpisodeText
  figures:     Figure[]             // 큰 글자 (실물 둘 다 둘)
  figure_note: EpisodeText
  quote_label: string               // 수수께끼가 걸리는 한 문장
  quote:       EpisodeText
  quote_note:  string
  riddle:      EpisodeText[]
  ask:         string
}

Figure { who: string, amount: EpisodeText, tag: string }

ToolsScene {                        // 도구 줍기 — 도구는 pickup.tools
  kicker:         string
  title_new:      string
  title_follower: string
  sub_new:        EpisodeText
  sub_follower:   EpisodeText
  ask:            string
}

AhaScene {                          // 풀이 장면에서 풀이 (체험 · 기본 풀이)와 상관없이 나오는 글. 나머지는 solve (§7)
  kicker:       string
  real_label:   string              // "실제로 연준이 말한 것"
  real:         RealItem[]          // 문서가 말한 것 (실물 둘 다 셋)
  verdict:      EpisodeText
  ask_new:      string
  ask_follower: string
}

RealItem { head: EpisodeText, body: EpisodeText }

CompareScene {                      // 견주기 — follower 조립에만
  kicker: string
  title:  string
  lead:   EpisodeText
  cols:   EpisodeText[]             // 정확히 둘 — 무엇과 무엇을
  rows:   CompareRow[]
  body:   EpisodeText[]
  ask:    string
}

CompareRow { label: string, a: EpisodeText, b: EpisodeText }

NextScene {                         // 이어짐
  kicker:        string
  title:         string
  lead:          EpisodeText
  line:          LineItem[]         // 지나온 줄
  here_label:    string             // "지금 여기"
  tool_lead:     string             // pickup.next 의 도구 앞의 말
  coming_label:  string
  coming:        Coming[]           // 다음 회차가 될 일들
  unknown_label: string
  unknown:       EpisodeText[]      // 아직 모르는 것
  unknown_note:  EpisodeText
  ask:           string
}

LineItem { when: EpisodeText, what: string, state: TrackState }
Coming { head: string, body: EpisodeText }

KeepScene {                         // 남음
  kicker:    string
  title:     string
  line:      string                 // 오늘의 한 줄
  next_body: EpisodeText            // 다음 화 예고
}

ToolMap {                           // 개념 지도 — 자리 · 선은 손으로 놓았다. 선의 뜻은 미확인 (§6.3 · D65)
  where_today: EpisodeText          // "2화에서 주움" (ui)
  at:          Record<ToolKey, Point>
  edges:       Edge[]
  ghosts:      Ghost[]              // 다음 화에서 만날 개념 (점선)
}

Ghost { name: string, at: Point, from: ToolKey }

Solve {                             // 풀이 장면 = 입구 + [체험 | 기본 풀이] + 문서가 말한 것 (scenes.aha.real) + 누구의 말 (entry.whose)
  entry: SolveEntry
  lab:   Lab | null                 // 체험. 없으면 기본 풀이로 나간다
  plain: PlainSolve | null          // 기본 풀이. 체험이 없으면 있어야 한다 (불변식 12)
}

SolveEntry {                        // 틀의 입구 — 모든 풀이에 공통 (§7.1)
  first_thought: EpisodeText        // 첫 생각 — 독자가 믿고 들어오는 한 줄
  breaker:       EpisodeText        // 깨는 사실 — 구절이 있어야 한다 (불변식 11)
  flip:          Flip | null        // 뒤집기 `A ≠ B`. 없으면 틀을 고를 수 없다 (불변식 14)
  not_drawn:     Note[]             // 그리지 않을 것 — 독자에게 보이지 않는다 (만드는 쪽의 선)
  whose:         EpisodeText        // 누구의 말 — "여기까지는 ○○의 판단" (D46)
  death:         boolean            // 사람이 숨진 사건 · 부고인가 (D61 ④) — 사람이 채운다 (§8)
}

Flip { label: string, a: string, op: string, b: string, note: EpisodeText }

Lab {                               // 체험 — 틀을 차례로 잇는다 (§7.2)
  title:      string                // 풀이 장면의 머리 — "회의 자리에\n앉아 볼게요"
  seen_title: string | null         // 이 그림을 본 독자에게 보일 머리 (D62 ③). null 이면 title. 실물 하나 — 셋째 골든 (첫 두 골든은 null)
  setup:      EpisodeText[]         // 준비 글 — 그림을 본 독자에게는 빠진다 (D61 ②)
  frames:     Frame[]               // 서는 조합만 (불변식 15)
  born:       Born | null           // 풀이에서 생기는 도구 (실물 하나)
}

Born { lead: string, tool: ToolKey }

PictureRef {                        // 그림 부품을 가리킨다. 같은 id 가 다시 쓰는 단위다 (D61 ②)
  id:   Id                          // "mfn-tie" · "rate-brake" · "fomc-seats" · "daekyo-breach"
  tool: ToolKey                     // 이 그림이 붙은 도구 (개념) — 실물 셋 다 있다. 개념에 붙지 않은 그림은 미확인
}

ToggleFrame {                       // 켜고 끄기 — 그림은 여기 없다. picture.id 가 가리키는 개념의 그림 부품(코드)에 있다 (§7.3)
  kind:    "toggle"
  picture: PictureRef
  tabs:    ToggleTabs               // 꺼졌을 때 · 켜졌을 때
  device:  ToggleDevice             // 장치(규칙)의 말
  action:  string                   // 독자가 누를 행동 하나
  again:   string
  go_on:   string                   // 켜진 쪽으로 넘어가는 말
  state:   ToggleState              // 그림 아래의 한 줄
  caption: ToggleCaption
}

ToggleTabs { off: string, on: string }
ToggleDevice { on: string, off: string }
ToggleState { idle: string, moved: string, blocked: string }
ToggleCaption { off_before: EpisodeText, off_after: EpisodeText, on_before: EpisodeText, on_after: EpisodeText }

ChainFrame {                        // 어디서 멈추나 — 밀면 힘이 고리를 타고 가다 어느 고리에서 멈춘다 (§7.4)
  kind:    "chain"
  picture: PictureRef
  tab:     EpisodeText | null       // 틀을 이을 때 탭의 이름 (불변식 19)
  nodes:   ChainNode[]              // 둘 ~ 넷 · 닿은 차례대로 · 멈춘 자리 하나 이상 (불변식 18)
  unknown: string                   // 모르는 고리 앞의 말 — "닿을까?". 그 뒤는 그리지 않는다
  action:  string
  again:   string
  caption: ChainCaption
  go_on:   EpisodeText | null       // 다음 틀로 넘어가는 말 (뒤에 틀이 있으면)
}

ReachedNode {                       // 힘이 닿은 고리
  id:    Id
  name:  string
  reach: "full" | "part"
  idle:  string                     // 밀기 전의 말
  after: EpisodeText                // 민 뒤 — **오늘의 값.** 구절이 있어야 한다 (불변식 18 · UX4-e)
  before?: ChainBefore              // 같은 그림의 지난 값 — 지난 회차의 같은 고리 (§7.9). 실물 전 · 3화에서 확인
}

StoppedNode {                       // 힘이 닿지 않은 고리 — 밀기 전에도 뒤에도 같은 말이다
  id:    Id
  name:  string
  reach: "none"
  still: EpisodeText                // 오늘의 값. 구절이 있어야 한다
  before?: ChainBefore              // 같은 그림의 지난 값 (§7.9). 실물 전
}

ChainBefore {                       // 지난 회차의 같은 고리 — 그 회차의 값 그대로 (§7.9 · 불변식 25). 실물 전
  reach: "full" | "part" | "none"   // 그때 힘이 닿은 데
  value: EpisodeText                // 그때의 값 (after · still) — 근거 구절까지 그대로. 구절이 있어야 한다
}

ChainCaption { before: EpisodeText, after: EpisodeText }

SeatsFrame {                        // 자리에 앉기 — 한쪽 자리에 앉아 그쪽의 문서에 적힌 말을 듣는다 (§7.5)
  kind:    "seats"
  picture: PictureRef
  tab:     EpisodeText | null
  ground:  SeatsGround              // 쓸 수 있는 조건 (D61 ③) — 사람이 채운다 (§8)
  label:   string                   // 자리 그림의 이름 — "회의 자리"
  you:     string                   // 내 자리에 적히는 글자 — "나"
  sides:   SeatSide[]               // 정확히 둘 — 수가 많은 쪽부터
  other:   string                   // 다른 쪽에도 앉아 보는 단추의 말
  result:  EpisodeText              // 실제 결과 한 줄
  caption: SeatsCaption
}

SeatsGround {
  body:   string                    // 어느 기관의 표결인가 — 한 기관
  split:  "official-dissent" | "party-vote"   // 한 기관 안의 공식 이견 / 정당 표결. party-vote 면 이 틀을 쓸 수 없다 (불변식 16)
  record: QuoteKey[]                // 표결이 적힌 공식 기록. 쪽마다의 수가 이 구절에 있어야 한다
}

SeatSide {
  id:           Id
  choose:       string              // 고르는 단추의 말
  group:        EpisodeText         // 갈린 뒤 그쪽 자리 위의 말
  count:        integer             // 그쪽에 앉은 사람 수 — 사실이다
  said:         EpisodeText         // 그쪽이 공식으로 한 말 — 구절이 있어야 한다
  why:          "in-doc" | "not-yet"   // 그쪽의 까닭이 문서에 있나 (UX4-a · D62 ②)
  not_yet_note: Fragment | null     // not-yet 이면 필수 — said.t 안에서 "그 까닭은 아직 문서에 없다"고 말하는 문장 (불변식 17)
  before?:      SeatBefore          // 같은 그림의 지난 값 — 지난 회차의 같은 쪽 (§7.9). 실물 전 · 3화에서 확인
}

SeatBefore {                        // 지난 회차의 같은 쪽 — 그 회차의 값 그대로 (§7.9). 실물 전
  group: EpisodeText                // 그때 그쪽 자리 위의 말 ("올리자 · 2명")
  why:   "in-doc" | "not-yet"       // 그때 그쪽의 까닭이 문서에 있었나 — not-yet → in-doc 이 "지난 화의 약속에 답했다"다
}

SeatsCaption { before: EpisodeText }

PagesFrame {                        // 넘겨 보기 — 일의 차례를 한 칸씩 넘긴다 (§7.8). 실물 하나
  kind:    "pages"
  picture: PictureRef               // 이 차례의 이름. 그림은 칸들 자체다 — 따로 그림 부품이 없다 (§7.8)
  label:   string                   // 차례의 이름 — "대교에서 있었던 일의 차례"
  cards:   PageCard[]               // 셋 이상 · 넘기는 차례대로 · ★ 하나 · 앞날 칸 없음 (불변식 21 ~ 24)
  ask:     string                   // ★ 칸을 넘기기 직전, 그 카드의 뒷면에 보이는 물음
  action:  string                   // 넘기는 단추의 말
  again:   string
  caption: PagesCaption
}

PageCard {                          // 넘겨 보기의 한 칸
  id:      Id
  when:    EpisodeText | null       // 때 — 문서에 있는 만큼만 ("2024년 8월"). 문서에 없으면 null
  no_date: string | null            // when 이 null 이면 필수 — 때의 자리에 보이는 글 ("날짜 없음"). when 이 있으면 null (불변식 22)
  head:    string                   // 한 줄 머리
  body:    EpisodeText              // 그 칸에서 있었던 일. 구절이 있어야 한다 (불변식 21)
  state:   TrackState               // past | now. next (앞날)면 거부 — 사람이 채운다 (§8 · 불변식 24)
  star:    boolean                  // "아!" 칸인가 — 정확히 하나 (불변식 23). 사람이 고른다 (§8)
}

PagesCaption { before: EpisodeText, after: EpisodeText }

PlainFlip {                         // 가. 뒤집기만 — 새로 채울 칸이 없다. 입구 (첫 생각 · 깨는 사실 · 뒤집기)와 scenes.aha 가 화면이 된다
  kind:  "flip"
  why:   NoLabWhy | null            // 체험이 없는 까닭. 체험이 있으면 null (불변식 12)
  title: string
}

PlainThree {                        // 나. 세 칸 — 확인된 것 / 아직 모르는 것 / 서로 다르게 말하는 것
  kind:        "three"
  why:         NoLabWhy | null
  title:       string
  lead:        EpisodeText
  known:       EpisodeText[]
  unknown:     EpisodeText[]
  differ:      Differ[]             // 양쪽을 나란히 — 둘 이상이거나 빔 (불변식 20 · D46 ④)
  differ_note: EpisodeText | null
}

Differ { who: EpisodeText, says: EpisodeText }

PlainQuiet {                        // 다. 조용히 — 무슨 일 → 지금 아는 것 → 다음에 나올 것. 실물 없음 (견본뿐)
  kind:   "quiet"
  why:    NoLabWhy | null
  title:  string
  what:   EpisodeText[]
  known:  EpisodeText[]
  coming: EpisodeText[]
  ask:    string                    // 낮춘 물음 말 — 장면의 물음 (scenes.aha.ask_*) 대신
}

// ── 짧은 이야기 (§13 · B-E3) — 실물 하나: UX-7 영훈의료재단 (골든 넷째). 글과 근거 (§4) · 입구 (§7.1) · 뒤집기만 (§7.7) 은 위의 타입 그대로

ShortStory {                        // 짧은 이야기 하나 = 발행 한 번. 통째로 불변. 장면 넷 · 번호 없음 (선반) · 체험 없음 (§13)
  episode_id:      UUID             // Episode 와 같은 방식 · 같은 이름 공간 — EpisodeRef 가 가리킬 수 있다
  episode_version: integer          // 1부터
  code:            Id               // "pipc-hospital" (실물). 회차의 code 와 겹치지 않는다 · 불변
  event_ref:       EventRef         // 이 이야기가 다루는 사건 — 곁 이야기와 같다 (§13.4)
  weight:          "short"          // 무게 (§13.1)
  series:          Series           // 선반 — 이 이야기가 놓인 시리즈. 번호 · 시리즈 줄 · 지난 회차 칸이 없다 (§13.3)
  sibling:         Sibling          // 같은 사건의 곁 이야기 (§13.4)
  docs:            Record<DocLabel, EpisodeDoc>
  quotes:          Record<QuoteKey, EpisodeQuote>
  voice_labels:    VoiceLabels
  tools_from:      ToolsFrom        // 다른 이야기의 도구 — 제 도구 · 줍는 자리 · 지도가 없다 (§13.5)
  scenes:          ShortScenes      // 장면 넷의 글 (§13.2)
  solve:           ShortSolve       // 입구 + 뒤집기만. 체험 칸이 없다 (§13.6)
}

Sibling {                           // 같은 사건의 곁 이야기 — 긴 이야기의 한 판 (실물: 대교 쪽 「내 정보는 누가 지키나」 1화)
  episode: EpisodeRef
  label:   string                   // "같은 발표의 긴 이야기" — 남음 장면의 길 위에
  note:    string                   // "대교 쪽 이야기 · 긴 이야기 · 체험 있음"
}

ToolsFrom {                         // 다른 이야기의 도구 — 그 이야기의 Tool 카드를 글자 그대로 (새로 쓰지 않는다)
  episode: EpisodeRef
  keys:    ToolKey[]                // 그 이야기의 Tool.key. 차례 = 화면의 차례 · 하나 이상 · 겹침 없음 (불변식 29)
}

ShortScenes { cover: ShortCoverScene, where: ShortWhereScene, why: ShortWhyScene, keep: ShortKeepScene }

ShortCoverScene {                   // 표지 — 번호 자리에 무게의 이름 ("짧은 이야기" — 화면의 글)
  title: string                     // 물음 제목
  dek:   EpisodeText
  meta:  EpisodeText
  hint:  EpisodeText                // 곁 이야기와 한 묶음이라는 말
  ask:   string
}

ShortWhereScene {                   // 어디가 — 머리는 solve.plain.title · 입구 (첫 생각 · 깨는 사실) · 뒤집기는 solve 에서
  kicker:  string
  body:    EpisodeText[]            // 깨는 사실 아래의 글
  unknown: EpisodeText              // 문서에 없는 것을 없다고 말한다 (UX7-j)
  ask:     string
}

ShortWhyScene {                     // 문서가 말한 것 — 가리킨 도구 (tools_from)가 여기서 접혀 보인다
  kicker:     string
  title:      string
  lead:       EpisodeText
  real_label: string
  real:       RealItem[]
  verdict:    EpisodeText
  tool_lead:  string                // 가리킨 도구 앞의 말
  ask:        string
}

ShortKeepScene {                    // 남음 — 다음 화 예고가 없다. 곁 이야기로 가는 길 (sibling)
  kicker:       string
  title:        string
  line:         string              // 남는 한 줄
  advice_label: string
  advice:       EpisodeText
  map_note:     string
  gain_label:   string
}

ShortSolve {                        // 풀이 = 입구 + 기본 풀이 "뒤집기만" (§13.6)
  entry: SolveEntry
  plain: PlainFlip                  // why = "short" (불변식 27)
}
```

관계 한 장:

```
Series (독자가 따라가는 묶음) ─┐
                               ├─ Episode ──event_ref──▶ Event (DATA_MODEL) ◀──event_ref── ArticlePackage (본 화면 `/`)
          회차 번호 · 시리즈 줄 ─┘     │                     ▲                                ▲
                                      ├─ previous ──▶ 지난 회차 (EpisodeRef — 실물 전 · §3.4)
                                      │                     └── Storyline (사실의 흐름 — 시리즈가 아니다. §2.1)
                                      ├─ docs ──source_id──▶ SourceDocument (DATA_MODEL · 저장된 원문)
                                      ├─ quotes ─ 그 원문의 글 그대로
                                      ├─ tools[].basis ──▶ ConceptRef (CONCEPT_IDENTITY) — [] 이면 손으로
                                      ├─ scenes (장면 여덟) · assembly (조립 둘 — 어느 장면을)
                                      ├─ solve.entry → lab.frames[].picture.id ──▶ 그림 부품 (코드 — 계약 밖)
                                      └─ map (개념 지도)

ShortStory (짧은 이야기 — §13) ──event_ref──▶ Event (곁 이야기와 같은 사건)
     ├─ series (선반 — 번호 · 시리즈 줄 없음)
     ├─ sibling.episode ──────▶ 긴 이야기 (Episode)의 한 판 — 같은 사건 · 다른 쪽
     ├─ tools_from.episode ───▶ 그 이야기의 Tool 카드 (글자 그대로 · 지도도 그 이야기의 것)
     ├─ docs · quotes (§4 그대로) · scenes (장면 넷)
     └─ solve (입구 + 뒤집기만 · why = short)
```

---

## 2. 이미 있는 계약과의 관계 (UX1-b)

### 2.1 Series 는 Storyline 이 아니다 — 따로 둔다

**판단: 다른 것이다.** 시리즈는 **독자가 따라가는 묶음**이고, 스토리라인은 **사실의 흐름**이다. 서로를 가리키는 칸도 지금은 두지 않는다.

- **실물이 이미 어긋나 있다.** 금리 2화가 든 시리즈는 「금리는 어디로」인데, DATA_MODEL 의 스토리라인은 "이란 전쟁" (`SL-iran-war`) 하나뿐이고 FOMC 사건들을 묶는 스토리라인은 없다
  (DATA_MODEL §9.1 "FOMC 사건들을 묶는 스토리라인의 실물은 없다" · UX2-h). 10월 사건 (`FOMC-20261028`)의 사실 그래프는 `SL-iran-war` v2 가 가리키는 사실 (유가 · 경유)을 품고 있지만,
  금리 2화는 이란 전쟁을 **일부러 넣지 않았다** (D46 ③ — 오늘 요점에 필요하지 않다). 같은 사건이 스토리라인 하나에 닿으면서 그 스토리라인과 상관없는 시리즈에 들어 있다
- **하는 일이 다르다.** 스토리라인은 자체 사실을 갖고 · 버전이 오르고 · 발행물이 그 버전을 고정한다 (DATA_MODEL §9.2 · §9.4) — 저작 쪽의 것이고 독자에게 이름이 보이지 않는다.
  시리즈는 독자에게 보이는 이름 · 부제 · 회차의 차례다 — "쌓인다 · 이어진다"의 단위 (D57). 사실을 갖지 않는다
- **수가 다르다.** 한 회차는 시리즈 **하나**에 든다 (실물 둘). 한 기사는 스토리라인 **여럿**을 고정할 수 있다 (DATA_MODEL §9.2 — 갱신 주기가 다른 스토리라인이 한 기사에서 만난다)
- **같다고 두면 생기는 일**: 시리즈 이름을 바꾸거나 회차를 다른 시리즈로 옮기는 편집이 사실의 소유 · 버전 (DATA_MODEL 불변식 7 · 13)을 건드리게 된다
- **이어지는 곳은 있다 — 미확인으로 둔다.** 시리즈의 "따라잡기"와 "지나온 줄"은 회차가 쌓이면 지난 사건들의 요지다 (UX2-d). 그 재료가 스토리라인 (또는 지난 회차)에서 오는지는 같은 시리즈의 회차가 둘 이상 생길 때 정한다 (§10)

### 2.2 Episode 는 ArticlePackage 의 형제다 — 둘 다 Event 를 가리킨다

**판단: Episode 는 ArticlePackage 를 품지도 · 대신하지도 않는다. 같은 사건 (Event)을 다른 모양으로 낸 발행물이다.**

- **모양이 다르다.** ArticlePackage 는 레벨 1 ~ 3 × 슬라이드 × 블록 (원형 5) × span (층 5)이다. Episode 는 장면 여덟 × 조립 둘 × 풀이 칸이다.
  레벨이 없고 (조립이 그 자리 — D57), 블록 원형이 없고 (장면마다 칸이 정해져 있다), span 의 층 대신 글 한 덩이의 꼬리표 셋 (§4.4)이다.
  한쪽을 다른 쪽의 특수한 꼴로 만들 수 없다 — ARTICLE_PACKAGE 의 불변식 (`open_questions.length == slides.length − 1` · `text == linearize(block)`)이 회차에서는 뜻이 없다
- **`event_ref`** — 둘 다 DATA_MODEL Event 의 UUID 다 (D27). 실물: 배달앱 1화 → `KFTC-20261029-DELIVERY-APPS` · 금리 2화 → `FOMC-20261028` (둘 다 `packages/pipeline/data/events/*/store.json` 에 Event 가 있다).
  한 사건에 ArticlePackage 와 Episode 가 둘 다 있을 수 있다 — 지금은 겹치는 사건이 없다 (본 화면의 기사는 9월 FOMC, 회차는 10월 FOMC 와 배달앱)
- **회차끼리 · 회차와 기사끼리 가리키지 않는다.** 금리 2화의 시리즈 줄 "1화 · 3년 만에 금리를 올렸어요"는 본 화면의 9월 기사 (ArticlePackage)다 — 회차 (Episode)가 아니다.
  그래서 `track` 은 글 (번호 · 제목 · 상태)만 싣고 아무것도 가리키지 않는다. 지난 화를 무엇으로 가리킬지는 **미확인** (§10)
- **덧붙임 (UX-6 · 실물 전)**: 회차가 **지난 회차 (Episode)** 의 그림 · 구절을 이어 받았으면 그 회차를 `previous` 로 가리킨다 (§3.4). 회차가 아닌 지난 화 (본 화면의 기사)는 여전히 가리키지 않는다 — `track` 은 그대로 글이다
- **본 화면은 그대로다.** ArticlePackage · ArticleRecord · 기존 골든 · 본 화면 (`/`)은 한 글자도 바뀌지 않았다. 본 화면을 회차로 옮기는 것은 뒤의 Step 이다

### 2.3 판 (version) — ArticleRecord 의 방식을 따른다. 저작 데이터의 자리는 미확인

- **`episode_id` (UUID) · `episode_version` (정수 · 1부터).** ArticleRecord 의 `article_id` · `article_version` (D30)과 같은 방식이다 — 둘 다 불변이고 짝이 전체에서 유일하다.
  **실물 없음**: 시안에는 `id: "fomc"` 글자뿐이었다 (그것은 `code` 로 남겼다). 골든 둘에 UUID 를 발급했고 판은 1 이다
- **발행 한 번 = Episode 하나. 통째로 불변.** 회의록이 나와 반대쪽의 까닭이 채워지는 것은 2화의 새 판이 아니라 **3화**다 (D61 ⑨ · D62 ②). 무엇이 같은 회차의 새 판을 만드나는 **미확인** — ArticleRecord 도 같다 (DATA_MODEL §11)
- **ArticleRecord 같은 겉 (record + authoring)을 만들지 않았다.** 회차의 저작 데이터 (시간 표현 · 스토리라인 핀 · 메모)는 실물이 없다 — 시안의 회차에는 D8 의 DERIVED · VOLATILE 표시가 없고,
  "6주 뒤" 같은 계산은 `calc` 로 글에 붙어 있다. 그래서 `episode_id` · `episode_version` 을 Episode 에 바로 뒀다. 저작 데이터가 생기면 그 자리를 다시 본다 (§10)
- **독자 기록이 회차를 가리키는 모양 (OBSERVATION ArticleRef 의 짝)은 미확인.** 회차를 읽은 기록은 아직 한 줄도 없다

### 2.4 왜 새 파일인가

회차의 타입은 전부 이 파일에만 있다 (한 타입은 한 파일에). ARTICLE_PACKAGE 에 넣지 않은 까닭은 §2.2 — 그 계약의 불변식 · 범위 ("모든 사용자에게 같다" · 레벨)와 회차가 맞지 않고, 본 화면이 그 계약을 그대로 쓰고 있다.
DATA_MODEL 에 넣지 않은 까닭 — 그 계약은 저장되는 사실 쪽 (Fact · Source · Storyline)의 주인이고 프론트로 가는 모양은 싣지 않는다.

---

## 3. 시리즈 · 회차 · 번호

### 3.1 Series

- 회차가 품는다 (`Episode.series`). 실물 둘: `price` 「누가 값을 정하나」 · `rate` 「금리는 어디로」
- `series_id` 는 UUID · `code` 는 사람이 부르는 이름 — Event · Storyline · Concept 과 같은 방식 (D27). **실물 없음** (시안은 `id: "rate"` 글자 하나였다 — `code` 가 됐다)
- **같은 시리즈의 회차가 둘인 실물이 없다.** 그래서 시리즈가 따로 저장되는 객체인지 · 회차마다 품는 값이 어긋나면 어느 쪽이 맞는지는 정하지 않았다 (§10). 지금은 회차가 발행 때의 시리즈 표기를 품는다

### 3.2 0화는 회차가 아니다

**판단: 0화 ("지금까지의 이야기")는 Episode 의 한 종류가 아니다.** 실물 둘에서 0화는 두 곳에만 있다.
1. **따라잡기 장면** `scenes.zero` — 회차 **안의** 한 장면이고 new 조립에만 나온다. 금리 2화에서는 "0화와 1화 · 지금까지의 이야기"다 — 0화에 지난 회차의 요지가 붙는다 (UX-2 ⑤)
2. **시리즈 줄의 한 줄** `track[0]` — "0화 · 지금까지의 이야기 · past"

따로 발행된 0화 (표지 · 도구 · 풀이를 가진)는 없다. 그래서 `number` 는 1부터이고 (불변식 2), 0화를 회차로 내는 길은 **미확인**이다 — D57 의 "시리즈마다 0화 하나"가 독립된 발행물이 될지는 그 실물이 생길 때 다시 본다.

### 3.3 번호와 시리즈 줄

- `number` — 몇 화인가 (정수). 독자가 읽는 글자는 `scenes.cover.episode` ("2화" · ui)이고, 시리즈 줄의 지금 (`now`) 줄과 같아야 한다 (불변식 7).
  `number` 와 그 글자의 대응 ("N화")은 검사하지 않는다 — 글자의 꼴은 글의 일이다
- `track` — 지난 화 · 지금 · 다음 화. `state` 가 `now` 인 줄이 정확히 하나. 다음 화의 `no` 는 번호가 아닐 수 있다 (실물 "다음 화")
- **번호를 언제 보이나 · 붙이나 (D86 — 둘째 이야기가 실제로 생겼을 때만)는 §13.3.** 칸은 그대로다 — 화면이 `number ≥ 2` 일 때만 번호 · 시리즈 줄을 보인다 (UX-7 실물). 번호가 없는 이야기는 짧은 이야기 (ShortStory)뿐이다

### 3.4 지난 회차 — `previous` (N-2 · **실물 전 · 3화에서 확인**)

- **`previous?: EpisodeRef { episode_id, episode_version }`** — 이 회차가 그림 · 구절을 이어 받은 회차의 **한 판**. OBSERVATION 의 `ArticleRef { article_id, article_version }` 와 같은 방식이다 (D30) — 회차는 통째로 불변이고 (§2.3) 판이 오르면 다른 회차가 된다.
  지금까지는 파이프라인이 픽스처 주석 `_source.previous` 에 지난 회차의 **code** 만 적었다 (검증기가 무시한다) — 그것을 칸으로 올렸다. code 가 아니라 UUID + 판인 까닭: 3화가 가리키는 것은 "2화"가 아니라 "그때 읽은 2화의 그 판"이다 (2화에 새 판이 생겨도 3화의 지난 값은 그 판의 값이다)
- **고를 수 있는 칸이다.** 시리즈의 첫 화 · 지난 화가 회차가 아닌 화 (금리 2화의 1화 = 본 화면의 기사)에는 없다. 골든 셋 다 없다
- **있어야 하는 때** (불변식 25): 같은 그림의 지난 값 (`before` — §7.9)이 있거나, 지난 회차에서 온 구절 (`code:key` — §4.5)이 있으면. 무엇의 지난 값인지 · 어디서 온 구절인지 모르면 화면이 "지난 화"라고 말할 수 없다
- **같은 시리즈의 앞 화다.** 바로 앞 화 (N − 1화)인지는 걸지 않았다 — 파이프라인은 지금 바로 앞 화만 받는다 (`episode.ts` 의 `prev.number + 1`). 검증기는 지난 회차를 받았을 때만 시리즈 · 앞뒤를 댄다 (`PREV_MISMATCH`)
- "이 그림을 본 독자"가 누구인가 (D64 · D66)는 이 칸으로 정해지지 않는다 — 어느 회차가 그 그림을 썼는지가 데이터에 생겼을 뿐이다. 지식 상태는 여전히 이 계약 밖이다 (§0)

---

## 4. 글과 근거

### 4.1 EpisodeText — 독자가 읽는 글 한 덩이

- 독자가 읽는 글 가운데 **숫자가 들 수 있는 글은 전부** EpisodeText 다. 맨 글자열 (`string` 칸 — 머리 · 꼬리표 · 버튼의 말)에는 숫자가 없다 (불변식 10) — 숫자가 근거 검사를 비켜 가지 못하게
- 서식은 둘뿐: `**굵게**` 와 `\n`. ARTICLE_PACKAGE 의 `<b>…</b>` 와 다르다 — 실물이 그렇다 (§11 _open E-6)
- `src` — 근거 구절들. `calc` — 구절의 수로 계산한 수와 그 방법 (`{ "6": "9월 16일 → 10월 28일 = 42일" }`). `ui` — 화면 번호. 셋 다 없어도 된다 (숫자가 없는 글)

### 4.2 근거 — 구절은 저장된 문서의 글 그대로

- `docs` 가 문서를, `quotes` 가 그 문서의 한 구절을 싣는다. 글은 `src` 로 구절을 가리킨다
- `EpisodeDoc.source_id` 는 DATA_MODEL **SourceDocument** 의 키다 (= Source.source_id). 구절은 그 문서의 `text` 에 **그대로** 있어야 한다 — 빈칸 · 줄바꿈만 무시하고 댄다 (불변식 8).
  검증기는 저장된 문서를 받아야 이것을 볼 수 있다 (`validateEpisode(ep, { documents })`). 안 주면 건너뛰고 그렇다고 알린다 — 화면은 문서 없이 회차를 받는다
- **권리**: 골든의 문서는 전부 git 에 있다 — 배달앱 6 (공공누리 제1유형 · 법령 — D53) · 금리 8 (미국 연방 저작물 — D40 · D41). 캐시에만 있는 문서 (첨부 PDF · 기업 입장문)의 구절은 실을 수 없다 (UX1-g)
- **구절과 Fact 의 관계는 미확인.** DATA_MODEL 은 사실마다 원문 위치를 FactSource (`span_start` · `span_end`)로 갖는다. 회차의 구절은 사실을 거치지 않고 문서를 바로 가리킨다 — 손으로 쓴 시안이 그렇다.
  파이프라인이 회차를 낼 때 구절이 Fact (p3)에서 오게 할지는 P-E1 이 정한다 (§11 _open E-2)

### 4.3 숫자 — 근거 셋 중 하나 (불변식 9)

글의 숫자마다: ① `src` 구절 안에 그 숫자가 있거나 ② `calc` 에 밝혔거나 ③ `ui` (화면 번호)다.
- 숫자 토막으로 댄다 — 쉼표를 떼고 숫자가 아닌 것으로 끊는다 ("3,311억" → 3311 · "3.75" → 3 · 75). 앞의 0 은 뗀다. 연도는 글의 2026 ↔ 구절의 ’26 을 받는다
- 영어 원문의 읽기 규칙 둘 (구절 쪽에만): 달 이름 → 수 (October = 10) · 분수 → 소수 (3-3/4 = 3.75 · 1/4 = 0.25). 영어로 쓴 수 (three · eight)는 읽지 않는다 — `calc` 로 밝힌다
- **보지 않는 것**: 글의 뜻이 구절에서 나오는가 (의미 대조 — 사람 · W-2) · 한글로 쓴 수 ("여섯 가지")

### 4.4 누구의 말 — 꼬리표 셋 (D46)

| `voice` | 뜻 | 화면 |
|---|---|---|
| `fact` | 문서에 적힌 사실 | 근거를 열면 `voice_labels.fact` — "문서에 적힌 사실" |
| `official` | 기관 · 당사자의 판단 · 말 — 누가 말했는지와 함께 (D46 ①) | `voice_labels.official` — 회차마다 다르다: "공정위의 판단" · "연준 · 위원이 한 말" |
| `explain` | Claro 가 풀어 쓴 설명 | `voice_labels.explain` |

- 없어도 된다 (실물: 표지 · 머리 · 큰 글자에는 없다). ARTICLE_PACKAGE 의 층 다섯 (`fact` · `claim` · `concept` · `bridge` · `writing`)과 다른 어휘다 — 대응은 **미확인** (§11 _open E-3)
- 풀이 장면의 끝에는 늘 `solve.entry.whose` — "여기까지는 ○○의 판단"

### 4.5 지난 회차에서 온 구절 — 키의 꼴 (N-3 · **실물 전 · 3화에서 확인**)

이어 쓰는 회차는 지난 회차의 글 몇 덩이 (시리즈 줄의 지난 화 제목 · 같은 그림의 지난 값)를 **근거 구절째** 받는다. 그 구절의 키를 그대로 두면 한 회차의 `quotes` 에 키의 꼴이 둘이 되고 (파이프라인의 `F001` · 손 2화의 `omo.2023`), **사건이 다른 회차끼리는 키가 부딪친다** — 4화 (12월 사건)의 `F001` 과 3화 (10월 사건)의 `F001` 은 다른 사실이다.

- **꼴: `<그 구절이 처음 실린 회차의 code>:<그 회차에서의 키>`** — 예 `fomc:omo.2023` (손 2화 `fomc` 의 `omo.2023`). 이 회차의 구절은 `:` 없이 쓴다
- **앞머리는 하나.** 3화가 2화에서 받은 `fomc:omo.2023` 을 4화가 다시 받으면 그대로 `fomc:omo.2023` 이다 (`rate-3:fomc:omo.2023` 이 아니다). 그래서 (처음 실린 회차의 code · 키) 가 회차를 넘어 구절 하나를 가리킨다 — code 는 유일 · 불변이다 (§1)
- 코드: `CARRIED_KEY` (꼴) · `carriedKey(지난 회차의 code, 키)` (옮길 때의 키 — 이미 옮겨 온 키는 그대로) — `packages/contract/src/episode.ts`
- 옮겨 온 구절도 이 회차의 `quotes` · `docs` 에 있다 — 글의 `src` 는 이 회차의 구절만 가리킨다 (불변식 4). 문서 (`docs` 의 라벨)는 옮겨도 라벨을 바꾸지 않는다 — 같은 라벨이 다른 문서를 가리키면 지난 회차를 받았을 때 `PREV_MISMATCH` 로 걸린다
- 검증기가 보는 것 (불변식 25 · 26): `:` 가 든 키가 있으면 `previous` 가 있다 · 앞머리는 하나 · 앞머리가 이 회차의 code 가 아니다. **보지 않는 것**: 지난 회차에서 왔는데 `:` 없이 적은 구절 (꼴로는 이 회차의 구절과 같아 보인다) — 지난 회차를 받으면 `before` 의 근거로 걸린다 (`PREV_MISMATCH`)
- **구절 ↔ Fact (§4.2 · E-2)와는 따로다.** 이 꼴은 회차 사이에서 키가 부딪치지 않게 할 뿐이다

---

## 5. 장면 여덟과 두 조립

### 5.1 장면 여덟 — 차례는 고정이다 (D59)

`cover` 표지 → `zero` 따라잡기 → `event` 사건과 끌림 → `tools` 도구 줍기 → `aha` 풀이 → `compare` 견주기 → `next` 이어짐 → `keep` 남음.
회차는 여덟 장면의 글을 **전부** 싣는다 (실물 둘). 장면의 모양과 차례는 화면의 것이고 회차가 바꾸지 못한다.

### 5.2 조립 — "어느 장면을 보이나"만 적는다

같은 회차 · 다른 조립이다. 독자마다 새로 쓰지 않는다 — 장면을 고르고, 접고, 글의 갈래를 고를 뿐이다 (D57).

| | `new` — 이 시리즈가 처음인 독자 | `follower` — 따라온 독자 | 어디에 적혀 있나 |
|---|---|---|---|
| 장면 | 표지 · **따라잡기** · 사건 · 도구 · 풀이 · 이어짐 · 남음 (7) | 표지 · 사건 · 도구 · 풀이 · **견주기** · 이어짐 · 남음 (7) | `assembly` (실물 둘이 같다) |
| 빠지는 것 | 견주기 | 따라잡기 | `assembly` |
| 더해지는 것 | 표지의 `new_hint` | 표지의 `recap_label` · `recap` (지난 이야기 두 줄) | `scenes.cover` |
| 갈리는 글 | `ask_new` · `title_new` · `sub_new` | `ask_follower` · `title_follower` · `sub_follower` | `scenes.cover` · `tools` · `aha` |
| 접히는 것 | 도구마다 "이거 알아요?" — 누른 대로 | 아는 도구는 접혀서 아래에 · 새 도구가 위에 펼쳐져 | **회차에 없다** — 화면의 규칙 + 독자의 지식 상태 |

- **회차가 적는 것은 위 표의 앞 네 줄뿐이다.** 조립 이름 둘과 그 조립이 보이는 장면 · 글의 갈래
- **회차가 적지 않는 것**: 누가 `new` 이고 누가 `follower` 인가 · 독자가 어느 도구를 아는가 · 접을지 뺄지. 이것은 지식 상태다 — 이 계약 밖이고, 지금은 어디에도 정해져 있지 않다 (**미확인** — D66 · UX1-e).
  시안은 손으로 적은 고정값 둘로 보여 줄 뿐이다 (추정 0)
- 조립은 **차례를 바꾸지 못한다** — 장면 여덟의 차례에서 빼기만 한다. `cover` 로 시작하고 `keep` 으로 끝나며 `aha` 가 있다 (불변식 6)
- 조립이 둘뿐인가 · `new` 에 따라잡기가 꼭 있어야 하나 · `follower` 에 견주기가 꼭 있어야 하나 — 실물 둘이 그럴 뿐이다. 규칙으로 걸지 않았다 (**미확인**)
- 셋째 골든 (개인정보 1화 — UX-5)의 `follower` 는 **다른 시리즈를 따라온 독자**다: 이 시리즈는 처음이라 따라잡기도 보고, 다른 시리즈의 회차와 견주기도 본다 (장면 여덟 전부). 위 표의 "빠지는 것"이 실물 둘의 것일 뿐임을 보여 준다 — 조립이 무엇을 뜻하는지 (같은 시리즈를 따라왔나 · 다른 시리즈를 읽었나)는 여전히 **미확인** (D66)
- **"이 그림을 본 독자"** 는 조립이 아니다 — 풀이 칸 안의 일이다 (§7.6)

---

## 6. 도구와 지도

### 6.1 Tool — 도구는 라이브러리의 개념이 아니라, 개념을 바탕으로 쓴 이 회차의 카드다

- 도구 하나가 라이브러리의 개념 **여럿**을 바탕으로 한다. 실물: 금리 2화의 "기준금리" = `FOMC_ROLE` + `RATE_TO_SPENDING` · "물가 목표" = `INFLATION_LEVEL_VS_RATE` + `FED_INFLATION_TARGET_2PCT`.
  그래서 도구는 Concept 과 1 : 1 이 아니고, 이 계약의 타입이다 (`key` 는 회차 안의 이름)
- **`basis: ConceptRef[]`** — 바탕이 된 개념의 그 버전 (CONCEPT_IDENTITY §3.2 — 발행물이 개념을 가리키는 모양 그대로). **`[]` = 손으로 썼다** (라이브러리에 없는 개념 — UX1-f · UX2-b).
  실물: 금리 2화 5 가운데 4 가 라이브러리 바탕 (C-0001@1 · C-0002@4 · C-0004@1 · C-0005@3 · C-0006@1 · C-0012@1) · "금융 여건"과 배달앱 1화 4 는 손으로
- **`part` 는 골든에서 전부 `null` 이다.** 시안은 "라이브러리의 설명을 바탕으로 말투만 해요체로" 썼고 어느 문안 (FULL · REFRESHER · ANALOGY)을 옮겼는지 적지 않았다.
  CONCEPT_IDENTITY §3.3 은 "바꿔 말한 문장도 그 문안을 옮긴 것이면 `part` 를 단다"고 한다 — 골든의 `null` 은 "모른다"이지 "옮기지 않았다"가 아니다 (§11 _open E-4)
- 가리킨 개념 · 버전이 라이브러리에 있는지는 이 검증기가 보지 않는다 (라이브러리가 있어야 한다 — 백엔드 발행 검사)
- 도구의 작은 그림은 회차에 없다 — 화면이 `key` 로 고른다 (코드)
- **독자의 개념 지도는 무엇을 단위로 쌓이나 — 미확인.** 도구 (회차의 `key`)인가 라이브러리의 개념인가. 시안은 "다른 시리즈에서 주운 도구"를 시리즈 code + `key` 로 가리킨다 (시안 전용). 관찰 기록의 일이다 (D64)

### 6.2 Pickup — 어느 장면에서 줍나

- 도구를 줍는 자리는 셋이다 (UX2-f): 도구 줍기 장면 (`tools`) · 풀이에서 (`aha`) · 이어짐에서 (`next`). 도구마다 정확히 한 곳 (불변식 5)
- 풀이에서 줍는 도구는 체험이 낳는다 (`solve.lab.born`). **체험이 없는 회차에서 그 도구를 어디서 줍나는 미확인** (UX4-d) — 실물 둘 다 체험이 있다
- 처음 온 독자에게 풀이에서 생긴 도구는 "이거 알아요?"를 묻지 않는다 · 알던 독자에게 접을지는 화면과 지식 상태의 일이다 (UX2-f)

### 6.3 ToolMap — 자리와 선. 선의 뜻은 정하지 않았다

- `at` — 도구마다의 자리 · `edges` — 선 · `ghosts` — 다음 화에서 만날 개념 (점선). 전부 손으로 놓았다 (배치를 계산하지 않는다)
- **선이 무슨 뜻인가는 미확인이다 (UX1-d → D65 OPEN).** 시안의 선은 "이 이야기에서 개념이 이어진 길"이다. 선수 지식 (CONCEPT_IDENTITY §9 prerequisite) 같은 뜻을 싣지 않았다. 이 계약은 선의 뜻을 정하지 않고 실물의 모양만 받는다
- 지도는 시리즈를 넘어 하나다 (다른 시리즈에서 주운 것이 같이 보인다) — 그것은 독자의 것이고 회차에 없다. 지도의 자리가 회차의 것인지 시리즈의 것인지도 **미확인** (UX-2 ⑤ — 회차가 하나씩뿐이라 회차에 있다)
- `ghosts[].name` 은 글자다 — 다음 화의 도구를 가리키지 않는다 (아직 없는 회차다)

---

## 7. 풀이

풀이 장면 = **입구** (`solve.entry`) + **[체험 `lab` | 기본 풀이 `plain`]** + 문서가 말한 것 (`scenes.aha.real` · `verdict`) + 누구의 말 (`entry.whose`).

### 7.1 입구 — 모든 풀이에 공통 (D61 ⑥ "뒤집기 찾기")

| 칸 | 뜻 | 실물 |
|---|---|---|
| `first_thought` | 첫 생각 — 독자가 믿고 들어오는 한 줄 | "…올리지 않았다면 이제 괜찮다는 뜻 같아요." |
| `breaker` | 깨는 사실 — 그것을 깨는, 문서에 있는 사실. 구절 필수 | "…성명문은 물가가 여전히 높다고 적었어요…" |
| `flip` | 뒤집기 `A` 기호 `B` + 한 문단. **없으면 (`null`) 틀을 고를 수 없다** | `=` 하나 (배달앱) · `≠` 하나 (금리) |
| `not_drawn` | 그리지 않을 것 — 문서가 말하지 않은 고리 · 앞날 · 값. 독자에게 보이지 않고 검사도 읽지 않는다 (사람이 그림과 댄다 — UX4-h) | 회차마다 셋 |
| `whose` | 누구의 말 (D46) | "여기까지는 **공정위가 내린 판단**이에요. …" |
| `death` | 사람이 숨진 사건 · 부고인가 (D61 ④) | 둘 다 `false` |

### 7.2 체험 — 틀을 잇는다

- `frames` 의 조합은 다섯뿐이다 (불변식 15): `[toggle]` (실물: 배달앱 1화) · `[chain, seats]` (실물: 금리 2화) · 그 부분인 `[chain]` · `[seats]` (**실물 없음** — 화면 부품은 받는다) · `[pages]` (실물: 개인정보 1화 — UX-5).
  켜고 끄기 · 넘겨 보기를 다른 틀과 잇는 것 · 틀 셋을 잇는 것은 없다 (UX4-i)
- 틀을 이으면 틀마다 `tab`, 앞 틀에 `go_on` (불변식 19). 앞 틀의 그림은 뒤 틀에서도 남는다 — 이미 일어난 일로 (화면의 일)
- `born` — 풀이에서 생기는 도구. 그 도구는 `pickup.aha` 에 있어야 한다 (불변식 5)
- 틀 여섯 (D61 ⑤) 가운데 **넷이 계약에 있다** — 실물이 있는 것만. 넘겨 보기는 §7.8 (UX-5). 숫자 만지기 · 가르기는 그 회차가 생길 때 (D24)

### 7.3 켜고 끄기 — 그림은 데이터가 아니다

- **틀의 그림 (자리 둘 · 막대 · 값표 · 옮겨 가는 알갱이 · 묶는 기호)은 이 계약에 없다.** 그 그림은 틀의 것이 아니라 **개념 (최혜대우)의 것**이고 코드다 (UX-4 ③-1 · D62).
  `picture.id` ("mfn-tie")가 그 그림 부품을 가리키고, `picture.tool` 이 그 개념의 도구를 가리킨다. 틀에 그림 데이터 (`stage`)를 넣으면 거부한다 (`SCHEMA_KEY`)
- 회차가 싣는 것은 뼈의 글이다 — 탭 둘 · 장치의 말 · 누를 행동 · 그림 아래 한 줄 · 설명 넷 · 넘어가는 말. 구절이 붙는 것은 `caption` 의 넷이다
- **이 뼈의 글 가운데 어디까지가 개념의 것 (라이브러리에 한 번)이고 어디부터가 오늘의 값인가는 미확인** (UX4-g · D67). UX-4 ② 의 눈으로는 `device.on` 과 `caption` 이 오늘의 값이고 나머지는 개념마다 한 번이다 — 실물이 하나라 가르지 않았다. 지금은 전부 회차에 있다
- 파이프라인의 첫 목표가 아니다 (D62 ①) — 켜고 끄기는 사람이 개념마다 한 번 만든다

### 7.4 어디서 멈추나

- 고리 둘 ~ 넷 · **닿은 차례대로** (`full` → `part` → `none`) · **멈춘 자리가 하나는 있다** (불변식 18). 힘이 닿지 않은 뒤는 그리지 않는다 — `unknown` ("닿을까?")이 그 선이다
- **고리의 오늘의 값 (`after` · `still`)은 구절이 붙는 글이다** (UX4-e). 시안에서는 맨 글자열이었다 — 계약에서 EpisodeText 로 올렸다. 골든의 구절은 시안의 주석에 적혀 있던 그대로다:
  금리 = 9월에 올렸다 (`st09.raise`) · 금융 여건 = 일부에서 조여졌다 (`pc10.cond`) · 물가 = 여전히 높다 (`st10.infl`). 화면의 글자는 같다
- `idle` (밀기 전의 말) · `name` · `action` 은 그림의 말이다 — 개념마다 한 번일 것들 (§7.3 과 같은 미확인)
- 가지 (고리가 갈라지는 것) · 넷짜리의 박자는 **실물 없음** (UX4-i)

### 7.5 자리에 앉기 — 조건 칸이 있다

- **`ground` — 쓸 수 있는 조건 (D61 ③).** `split` 이 `official-dissent` (한 기관 안의 공식 이견 — 연준 · 헌재 · 대법 · 금통위)일 때만 선다. `party-vote` 면 거부 — 정당 표결은 양쪽 공식 입장을 글로 나란히 (기본 풀이 "세 칸").
  `body` 는 그 한 기관 · `record` 는 표결이 적힌 구절 — 쪽마다의 `count` 가 그 구절에 있어야 한다 (불변식 16)
- **쪽은 둘이다** (세 쪽 이상은 실물 없음). 쪽마다 `said` — 그쪽이 **공식으로 한 말**, 구절 필수
- **`why` 와 `not_yet_note` (UX4-a · D62 ②).** 조건은 "양쪽이 공식으로 한 말이 문서에 있으면 된다 · 까닭은 뒤 문서에서 와도 된다"이다.
  까닭이 아직 없는 쪽 (`not-yet`)은 허용한다 — **다만 화면에 "그 까닭은 아직 문서에 없다"는 글이 반드시 있어야 한다.**
  그것을 기계가 볼 수 있게: `not_yet_note` 에 그 문장을 적고, 그 문장이 `said.t` 안에 **글자 그대로** 있어야 한다 (불변식 17). 그쪽에 앉으면 (또는 그림을 본 독자가 그쪽을 누르면) `said` 가 화면에 나온다.
  실물: 금리 2화의 올리자 쪽 — "다만 두 사람이 이번 표결의 까닭을 직접 설명한 글은, 우리가 확인한 문서에 아직 없어요." 검증기는 이 쪽이 반쪽이라고 **알린다** (경고 `SEAT_WHY_NOT_YET`) — 3화 (회의록)가 채운다
- 어느 쪽을 골라도 "맞았다 · 틀렸다"가 없다 (화면의 일)

### 7.6 "이 그림을 본 독자" — 다시 쓰기 (D61 ②)

- 같은 `picture.id` 를 본 독자에게는 준비 글 (`setup`) · 탭 · 누르기가 빠지고 그림의 끝 모습과 오늘의 값만 보인다 (UX-4 ⑤). 무엇이 빠지는지는 화면의 규칙이다 — 회차가 따로 적지 않는다
- **`lab.seen_title`** — 그 독자에게 보일 머리 (D62 ③). 지금 머리 ("회의 자리에 앉아 볼게요")는 앉지 않는 독자에게 안 맞는다 (UX4-f). **실물 없음**: 골든 둘 다 `null` 이고, `null` 이면 `title` 이 나온다.
  독자 글을 새로 쓰지 않았다 — 칸만 만들었다
- 누가 "그 그림을 본 독자"인가는 지식 상태다 — 회차에 없다. 지난 회차의 값을 옆에 놓는 것 (UX4-c)은 **§7.9 (실물 전 — 3화가 첫 실물)**
- **넘겨 보기에서의 다시 쓰기는 §7.8** — 같은 차례 (`picture.id`)의 다음 문서에서만 선다. `seen_title` 의 첫 실물도 그 골든이다 ("일의 차례를 펼쳐 놓을게요")

### 7.7 기본 풀이 — 체험 없음 (D61 ①)

| 꼴 | 화면 | 채울 칸 | 실물 |
|---|---|---|---|
| 가. `flip` 뒤집기만 | 첫 생각 → 깨는 사실 → `A ≠ B` 를 크게 → 문서가 말한 것 → 누구의 말 | **없다** — 입구가 차면 나온다 | 배달앱 1화 |
| 나. `three` 세 칸 | 확인된 것 / 아직 모르는 것 / 서로 다르게 말하는 것 | `lead` · `known` · `unknown` · `differ` · `differ_note` | 금리 2화 |
| 다. `quiet` 조용히 | 무슨 일 → 지금 아는 것 → 다음에 나올 것. 눌러 보기 없음 · 물음 말도 낮춘다 | `what` · `known` · `coming` · `ask` | **실물 없음** (견본뿐 — 골든이 아니다) |

- **`why` — 체험이 없는 까닭**: `politics` (당파 표결 — D46 · D61 ③) · `death` (D61 ④) · `no-source` (틀을 채울 문서가 없다) · `no-flip` (뒤집을 믿음이 없다). **넷 다 실물 없음** — 실물 둘은 체험이 있다.
  다섯째 `short` (무게 — 짧은 이야기라서)는 짧은 이야기에만 쓴다 (§13.6 · 불변식 27 — 실물 하나: 골든 넷째). 긴 이야기는 이 까닭을 적을 수 없다
- **실물 둘은 체험과 기본 풀이를 둘 다 갖는다** — 도윤이 "체험 없이 보기"로 견줘 보려고 (UX-4 ④). 체험이 있으면 까닭이 없으니 `why` 는 `null` 이다 (시안의 `"demo"` 는 계약의 값이 아니다).
  제품이 체험이 있는 회차에도 기본 풀이를 같이 낼지는 **미확인** — 계약은 받기만 한다
- 세 칸의 셋째 칸은 **양쪽을 나란히** — 둘 이상이거나 빔 (불변식 20 · D46 ④). 한쪽만 있으면 거부

### 7.8 넘겨 보기 — 일의 차례를 한 칸씩 (UX-5 · 실물 하나)

실물: 개인정보 1화 — 대교에서 있었던 일 여섯 칸 (열려 있던 길 → 첫 유출 → 알림 → **★ 대응을 소홀히** → 같은 방식으로 또 → 위원회의 결정). 재료는 `logs/pipeline/E3-1.md` ③-2 그대로다.
독자가 하는 것: 뒤집힌 카드를 눌러 한 장씩 넘긴다. 넘긴 칸은 한 줄로 접혀 위에 쌓이고, 다 넘기면 차례 전체가 한 화면에 남는다 (화면의 일 — 시안 `kit/frames/Pages.tsx`).

- **칸 (`cards`)은 넘기는 차례대로 · 셋 이상** (불변식 21). 위쪽 끝은 정하지 않았다 — 실물은 여섯이고 UX-3 의 종이 위 어림 ("3 ~ 5")을 이미 넘었다 (**미확인**)
- **칸마다 구절** — `body` 는 구절이 붙는 글이다 (불변식 21). 문서에 없는 칸 (회사가 알게 된 때 · 신고 · 조사 착수)은 만들지 않는다. 실물의 여섯 칸은 전부 보도자료 한 문서의 구절이다
- **때는 문서에 있는 만큼만 — 없으면 "날짜 없음"을 밝힌다** (불변식 22). `when` 은 글이다 ("2024년 8월" — 달까지만 있으면 달까지. 그 수는 불변식 9 가 구절에 댄다).
  문서에 때가 없는 칸은 `when: null` 이고 **`no_date` 가 그 자리에 보인다** ("날짜 없음"). 둘 중 정확히 하나다. 실물: 여섯 가운데 둘이 날짜 없음 (열려 있던 길 — 상태 · ★ 대응 소홀 — 판단)
- **★ 칸 (`star`)이 정확히 하나 · 첫 칸이 아니다** (불변식 23). "아!"는 그 앞 칸이 만든 기대 위에 선다 (실물: 알림이 왔어요 → ★). `ask` 는 ★ 칸을 넘기기 직전 그 카드의 뒷면에 보이는 물음이다
- **앞날 칸 금지** (불변식 24 · UX-3 "다음 칸을 그려야 할 때 쓰지 않는다"). 칸마다 `state` 를 스스로 적는다 — `past` · `now` 만 서고 **`next` 면 거부한다**. `now` (이 회차의 사건)는 마지막 칸에만 온다 (실물: 여섯째 칸 "위원회의 결정").
  다음에 올 일 (의결서 · 공표)은 넘겨 보기가 아니라 이어짐 장면 (`scenes.next.coming`)에 있다
- **칸 사이에는 차례만 있다.** 까닭 (이 칸 때문에 다음 칸이)은 계약에 칸이 없다 — 화면도 화살표를 그리지 않는다. 문서가 차례만 말했기 때문이다 (실물의 `not_drawn` 첫 줄 — "그때 막았으면 둘째는 없었다").
  문서가 까닭을 말하는 차례가 나오면 다시 본다 (**미확인**)
- **그림은 칸들 자체다 — 개념의 것도 틀의 것도 아니고 사건의 것이다.** 켜고 끄기처럼 따로 만든 그림 부품이 없고 (화면 검사 S1 은 이 틀을 보지 않는다), 고리 · 자리처럼 값만 갈아 끼울 뼈 (고리의 이름 · 자리의 수)도 없다 — 칸 전부가 오늘의 값이다.
  `picture.id` 는 그 차례의 이름 ("daekyo-breach")이고 `picture.tool` 은 그 차례가 걸리는 도구다 (실물: 안전조치의무)
- **"이 그림을 본 독자" (§7.6)** — 넘기기 · 준비 글 없이 차례 전체가 펼쳐져 있고, 칸을 누르면 그 칸의 글이 나온다 (화면의 일). **다시 쓰기 (D61 ②)는 같은 차례의 다음 문서에서만 선다**: 의결서가 나오면 같은 `picture.id` 에 칸이 더해지고 "날짜 없음"이 날짜로 바뀐다 — 그것이 "값만 바뀐 같은 그림"이다 (**실물 없음** — 다음 회차).
  다른 사건 (다른 회사의 유출)에는 서지 않는다 — 칸이 전부 새것이라 "본 그림"이 없다
- **미확인 (이 실물에 없다)**: 전 → 후 꼴 (고쳐진 문구 둘 — UX-3 의 SK하이닉스 · 성명문 대조) · 넘겨 보기를 다른 틀과 잇기 (`tab` · `go_on` 칸이 없다 — 넣으면 `SCHEMA_KEY`) · 갈래가 둘인 차례 (두 회사를 나란히) · 때를 기계가 읽는 칸 (차례가 때의 차례인지는 검증기가 보지 않는다 — 사람) · 칸의 `voice` 를 꼭 달아야 하나 (실물은 여섯 다 달았다)

### 7.9 같은 그림의 지난 값 — `before` (N-1 · **실물 전 · 3화에서 확인**)

D61 ② "같은 체험 그림은 다시 쓴다 — 오늘 값만 바꿔" · D62 ③ "그림을 본 독자는 그림 + 오늘 값 (3화에서 지난 값을 옆에)". **같은 그림에 값이 달라지는 것이 곧 "이어진다"** 인데, 지금까지는 오늘 값만 화면에 나갔다 — 파이프라인은 지난 값을 `review.json` 의 `carry` 에만 실었다 (P-E2 ⑦ N-1).

- **무엇이 같은 그림인가** — 지난 회차 (`previous`)에 **같은 kind 의 틀**이 **같은 `picture.id`** 로 있다. 지난 값은 그 틀의 **같은 `id`** 의 고리 · 쪽에 붙는다 (고리의 이름 · 쪽의 고르는 말은 그림의 말이라 지난 회차의 것을 받는다 — P-E2 ② "그림의 말만 그대로" · PE2-i).
  이름이 아니라 id 로 대는 까닭: 고리의 이름은 그림의 말이라 다듬어질 수 있고, id 는 P-E2 의 설계 프롬프트가 "바꾸지 않는다"고 한 것이다
- **고리 — `ChainBefore { reach, value }`**: 그때 힘이 닿은 데와 그때의 값 (`after` 또는 `still`) — 글 · 근거 구절까지 그 회차의 것 그대로 (구절의 키는 §4.5 꼴). P-E2 의 `carry` 가 `"<값> (<reach>)"` 로 적던 것을 칸으로 나눴다. **닿은 데가 바뀐 것** (안 닿음 → 일부)이 고리 그림에서 가장 큰 오늘의 소식이라 `reach` 를 따로 둔다
- **쪽 — `SeatBefore { group, why }`**: 그때 그쪽 자리 위의 말 (수가 든 글 — 근거는 불변식 9 가 본다)과 그때 까닭이 문서에 있었나. P-E2 의 `carry` 가 `"<group> · 까닭 <why>"` 로 적던 것. **`not-yet` → `in-doc` 이 "지난 화가 '아직 문서에 없다'고 한 약속에 이번 화가 답했다"** 이다 (UX4-a · 3화 = 회의록이 반대 둘의 까닭을 채우는 회차 — D61 ⑨). 그때의 `said` 는 싣지 않는다 — `why` 가 그 뜻을 다 싣고, 그때의 말은 지난 회차에 있다
- **달라졌든 아니든 싣는다.** 같은 id 의 고리 · 쪽이 지난 회차에 있으면 `before` 를 단다 (P-E2 의 `carryPairs` 와 같다 — 바뀐 것만 고르지 않는다). 같은지 다른지는 화면이 오늘 값과 대 본다 ("지난 화와 같아요")
- **고를 수 있는 칸이다** — 지난 회차가 없거나 그 고리 · 쪽이 새것이면 없다. 켜고 끄기 · 넘겨 보기에는 두지 않았다: 켜고 끄기의 그림은 개념의 것이라 다시 쓸 때 오늘의 값이 거의 없고 (UX-4 ⑤), 넘겨 보기의 다시 쓰기는 같은 차례에 칸이 더해지는 꼴이라 (§7.8) 모양이 다르다 — 그 실물이 나올 때 (§10)
- 검증기 (불변식 25): `before` 가 있으면 `previous` 가 있다 · 고리의 지난 값에 구절 (오늘의 값과 같은 규칙 — 불변식 18). **지난 회차를 받으면** (`validateEpisode(ep, { previous })`) 대 본다 — 받은 회차가 `previous` 의 그 판인가 · 같은 시리즈의 앞 화인가 · 같은 그림 (kind · `picture.id` · 고리 · 쪽 id)인가 · 지난 값이 그 회차의 값과 글자 · 닿은 데 · 까닭 · 근거 (키는 §4.5 로 옮겨) 그대로인가 · 옮겨 온 구절이 그 회차의 구절 그대로인가 (`PREV_MISMATCH`). 안 받으면 알림 `PREVIOUS_NOT_CHECKED`
- **화면 (시안 `kit/frames/Steps.tsx`)**: "이 그림을 본 독자"에게는 처음부터 · 처음 보는 독자에게는 밀거나 앉은 **뒤에** 고리 · 쪽마다 "지난 화" 한 줄 (같으면 "지난 화와 같아요"). 쪽은 자리 그림 아래 "지난 화" 칩 (그때 자리 위의 말) · 고른 쪽이 `not-yet` → `in-doc` 이면 "지난 화에 ‘아직 문서에 없다’던 이 쪽의 까닭이 이번에 들어왔어요." 무엇을 어떻게 보이나는 화면의 일이다 — 회차는 값만 싣는다

---

## 8. 스스로 적는 칸 — 사람이 채운다

검증기는 "적은 값이 금지된 값인가"만 본다. **참인지는 못 본다** (UX-4 ⑥). 그래서 아래 칸은 파이프라인이 채우게 두지 않는다 — AI 는 틀을 내놓으려는 쪽으로 기운다 (UX-3 ⑦-2).

| 칸 | 무엇을 스스로 적나 | 검증기가 하는 일 |
|---|---|---|
| `solve.entry.death` | 사람이 숨진 사건 · 부고인가 | 빠뜨리지 못하게 (필수 칸) · `true` 면 체험 금지 · 조용히 |
| `SeatsGround.split` | 한 기관 안의 공식 이견인가 정당 표결인가 | `party-vote` 면 거부. 정당 표결을 `official-dissent` 라고 적으면 통과한다 |
| `SeatSide.why` · `not_yet_note` | 그쪽의 까닭이 문서에 있나 · 없다고 말하는 문장은 어느 것인가 | 문장이 `said` 안에 있는지만. 그 문장이 정말 그 뜻인지는 못 본다 |
| `PlainSolve.why` | 체험이 없는 까닭 | 넷 중 하나인지 · 사망과 맞는지 |
| `solve.entry.flip` | 뒤집기가 진짜인가 (UX-3 ⑦-1) | 있는지 없는지만 |
| `solve.entry.not_drawn` | 그림이 넘지 말아야 할 선 | 읽지 않는다 |
| `PageCard.state` | 그 칸이 이미 일어난 일인가 · 이 회차의 사건인가 · 앞날인가 | `next` 면 거부. 앞날의 일을 `past` 라고 적으면 통과한다 |
| `PageCard.star` | 어느 칸이 "아!"인가 (UX-3 ⑥ "어느 칸이 아!인지만 고른다") | 정확히 하나인지 · 첫 칸이 아닌지만. 그 칸이 정말 뒤집는 칸인지는 못 본다 |
| `PageCard.when` · `no_date` · 칸의 차례 | 때가 문서에 있나 · 칸이 때의 차례대로인가 | 둘 중 하나인지 · 때의 수가 구절에 있는지 (불변식 9)만. 차례는 못 본다 |
| 무게 (Episode 인가 ShortStory 인가 · `weight`) | 긴 이야기로 낼까 짧은 이야기로 낼까 — 아침 고르기에서 사람이 (D86 "긴 0 ~ 2 + 짧은 나머지" · D3) | 모양만 — 짧은 이야기에 긴 이야기의 장면 · 번호 · 체험 칸이 있으면 거부 (불변식 28) · 까닭이 무게와 맞는지 (27) |
| `ShortStory.sibling` | 같은 사건의 어느 긴 이야기 곁인가 | 가리킨 이야기를 받으면 같은 사건 (`event_ref`)인지만 |

파이프라인 단계마다 어느 칸을 채우는지 (p3 · p4 · p5 · 라이브러리 · 사람)는 `logs/backend/B-E1.md` ⑥.

---

## 9. 불변식

검증기 `validateEpisode` 가 본다. 코드는 거부할 때 나오는 이름이고, 픽스처는 `fixtures/invalid/` 의 파일이다 (골든 + 위반 하나).

| # | 불변식 | 코드 | 원천 | 픽스처 |
|---|---|---|---|---|
| 1 | 모양 — 계약의 칸 전부 · 그것만 · 타입대로. 빈 글자열 없음. 견주기의 칸 머리는 둘 | `SCHEMA_KEY` · `SCHEMA_MISSING` · `SCHEMA_TYPE` · `STRING_EMPTY` · `SCHEMA_LENGTH` | §1 | `episode-toggle-picture-as-data` · `episode-knowledge-state-in-episode` · `episode-concept-ref-not-pinned` |
| 2 | `episode_version` ≥ 1 · `number` ≥ 1 (0화는 회차가 아니다) | `ID_RANGE` | §2.3 · §3.2 | `episode-number-zero` |
| 3 | 구절의 `doc` 이 `docs` 에 있다 | `REF_DOC` | check D | `episode-quote-doc-missing` |
| 4 | 글의 `src` 가 `quotes` 에 있다 | `REF_QUOTE` | check D | `episode-src-not-a-quote` |
| 5 | 도구를 가리키는 것 (`pickup` · `map` · `born` · `picture.tool`)이 `tools` 에 있다 · `key` 가 겹치지 않는다 · 도구마다 지도의 자리 · 줍는 장면이 정확히 하나 · `born.tool` 은 `pickup.aha` 에 | `REF_TOOL` | check D · E8 | `episode-pickup-unknown-tool` |
| 6 | 조립은 장면 여덟의 차례대로 · `cover` 로 시작 · `keep` 으로 끝 · `aha` 포함 · 겹침 없음 | `ASSEMBLY_ORDER` | D59 | `episode-assembly-out-of-order` |
| 7 | 시리즈 줄에 `now` 가 정확히 하나 · 그 `no` 가 표지의 번호와 같다 | `TRACK_NOW` | 실물 둘 | `episode-track-two-now` |
| 8 | **구절은 저장된 문서의 글 그대로** (빈칸 · 줄바꿈만 무시). 문서가 저장돼 있다 | `QUOTE_VERBATIM` · `DOC_MISSING` | check A | `episode-quote-not-verbatim` |
| 9 | **글의 숫자는 근거 셋 중 하나** — 구절 · 계산 (`calc`) · 화면 번호 (`ui`) (§4.3) | `NUMBER_UNGROUNDED` | check B | `episode-number-ungrounded` |
| 10 | 맨 글자열 (`string` 칸)에는 숫자가 없다 | `BARE_DIGIT` | check C | `episode-bare-digit` |
| 11 | 깨는 사실에 구절이 있다 (사망이 아니면) | `BREAKER_SRC` | check E1 | `episode-breaker-no-src` |
| 12 | 체험도 기본 풀이도 없으면 안 된다 · 체험이 없으면 기본 풀이의 `why` 가 넷 중 하나 · 체험이 있으면 `why` 는 `null` | `SOLVE_EMPTY` · `PLAIN_WHY` | D61 ① · check E2 | `episode-no-lab-no-why` |
| 13 | **D61 ④ — 사망이면 체험 없음 + 기본 풀이 "조용히"** + `why: death`. 거꾸로 `why: death` 면 `death` | `DEATH_LAB` · `DEATH_NOT_QUIET` · `DEATH_WHY` | D61 ④ · check E3 | `episode-death-with-lab` · `episode-death-not-quiet` |
| 14 | **뒤집기가 없으면 틀을 고를 수 없다** — `flip` 이 `null` 이면 체험도 "뒤집기만"도 없다 | `NO_FLIP` | D61 ⑥ · check E4 | `episode-no-flip-with-lab` |
| 15 | 틀의 조합은 `[toggle]` · `[chain]` · `[seats]` · `[chain, seats]` · `[pages]` 뿐 | `FRAME_COMBO` | check E5 · UX-4 ② · UX-5 | `episode-frame-combo` · `episode-pages-combo` |
| 16 | **D61 ③ — 자리에 앉기는 한 기관 안의 공식 이견에만** (`party-vote` 면 거부) · 표결 기록 구절이 있다 · 쪽은 둘 · 쪽마다 한 말에 구절 · 쪽마다의 수가 표결 기록에 | `SEATS_PARTY_VOTE` · `SEATS_RECORD` · `SEATS_SIDES` · `SEATS_SAID_SRC` · `SEATS_COUNT` | D61 ③ · D46 · check E6 | `episode-seats-party-vote` · `episode-seats-count-not-in-record` · `episode-seats-said-no-src` |
| 17 | **UX4-a — `not-yet` 인 쪽은 `not_yet_note` 가 있고 그 문장이 `said.t` 안에 글자 그대로 있다.** `in-doc` 이면 `null` | `SEATS_NOT_YET` | D62 ② | `episode-seats-not-yet-unsaid` · `episode-seats-not-yet-not-on-screen` |
| 18 | 고리 둘 ~ 넷 · 닿은 차례대로 · 멈춘 자리 하나 이상 · 오늘의 값 (`after` · `still`)에 구절 | `CHAIN_NODES` · `CHAIN_ORDER` · `CHAIN_NO_STOP` · `CHAIN_VALUE_SRC` | check E7 · UX4-e | `episode-chain-no-stop` · `episode-chain-out-of-order` · `episode-chain-value-no-src` |
| 19 | 틀을 이으면 틀마다 `tab` · 뒤에 틀이 있는 고리에 `go_on` | `FRAME_TAB` | check E8 | `episode-frames-no-tab` |
| 20 | **D46 ④ — 서로 다르게 말하는 것은 양쪽**: `differ` 는 둘 이상이거나 빔 · 저마다 한 말에 구절 | `DIFFER_ONE_SIDE` · `DIFFER_SRC` | D46 · check E9 | `episode-differ-one-side` · `episode-differ-no-src` |
| 21 | **넘겨 보기 — 칸 셋 이상 · `id` 가 겹치지 않는다 · 칸마다 한 줄 (`body`)에 구절** | `PAGES_CARDS` · `PAGES_CARD_SRC` | UX-5 실물 · UX-3 ⑥ | `episode-pages-too-few` · `episode-pages-card-no-src` |
| 22 | **칸의 때 — `when` 이 있거나, 없으면 `no_date` ("날짜 없음")가 화면에 있다.** 둘 중 정확히 하나 | `PAGES_WHEN` | UX-5 실물 · E3-1-f | `episode-pages-undated-unsaid` · `episode-pages-when-and-no-date` |
| 23 | **★ 칸이 정확히 하나 · 첫 칸이 아니다** | `PAGES_STAR` | UX-5 실물 · UX-3 ⑥ | `episode-pages-no-star` · `episode-pages-two-stars` |
| 24 | **앞날 칸 금지 — `state: next` 면 거부** · 지금 (`now`)은 마지막 칸에만 | `PAGES_FUTURE` · `PAGES_ORDER` | UX-3 ④ ("다음 칸을 그려야 할 때 쓰지 않는다") · UX-5 실물 | `episode-pages-future-card` · `episode-pages-now-not-last` |
| 25 | **지난 값 · 지난 회차에서 온 구절이 있으면 지난 회차 칸이 있다** — `before` 나 `code:key` 구절이 있는데 `previous` 가 없으면 거부 · 고리의 지난 값 (`before.value`)에 구절 · `previous` 의 판 ≥ 1 이고 이 회차 자신이 아니다 (`ID_RANGE`). **실물 전** | `PREV_MISSING` · `PREV_VALUE_SRC` | D61 ② · D62 ③ · P-E2 ⑦ N-1 · N-2 (UX-6) | `episode-before-no-previous` · `episode-before-value-no-src` |
| 26 | **지난 회차에서 온 구절의 키는 `<처음 실린 회차의 code>:<키>`** — 앞머리 하나 · 이 회차의 code 가 아니다 (§4.5). **실물 전** | `PREV_KEY` | P-E2 ⑦ N-3 (UX-6) | `episode-quote-key-double-prefix` |
| 27 | **무게 — 짧은 이야기의 체험이 없는 까닭은 무게 (`short`)다.** 거꾸로 긴 이야기 (Episode)는 체험이 없는 까닭을 무게라고 적을 수 없다. **실물 하나** | `PLAIN_WHY` | D79 ③ · UX-7 ③ 모자람 6 (B-E3) | `episode-short-why-not-weight` |
| 28 | **짧은 이야기에는 번호 · 시리즈 줄 · 체험 · 장면 넷 밖의 장면 칸이 없다** — 넣으면 모양이 거부한다 (불변식 1 — 칸이 없다). **실물 하나** | `SCHEMA_KEY` | D86 · UX-7 ③ 모자람 1 · 3 · 6 · UX-7 ⑤ 4 (B-E3) | `episode-short-numbered` · `episode-short-eight-scenes` · `episode-short-with-lab` |
| 29 | **다른 이야기를 가리키기** — 가리킨 도구 (`tools_from.keys`) 하나 이상 · 겹침 없음 · 가리킨 이야기 (`sibling` · `tools_from`)의 판 ≥ 1 · 이 이야기 자신이 아니다. **가리킨 이야기를 받으면**: 곁 이야기가 같은 사건 · 도구가 그 이야기에 있다. **실물 하나** | `REF_TOOL` · `ID_RANGE` · `SIBLING_MISMATCH` | UX-7 ③ 모자람 4 · 5 (B-E3) | 픽스처 없이 (시험 — 받아야 보는 것이 반이다) |

- **짧은 이야기 (`validateShortStory`)가 보는 것**: 1 · 2 (판만 — 번호가 없다) · 3 · 4 · 8 · 9 · 10 · 11 · 13 · 14 · 27 ~ 29. 그 칸이 없어 안 보는 것: 5 ~ 7 · 12 (긴 이야기 쪽) · 15 ~ 26 (체험 · 넘겨 보기 · 지난 회차)
- 알림 (거부가 아니다): `SEAT_WHY_NOT_YET` — 그 쪽은 반쪽이다 (금리 2화에 하나) · `QUOTES_NOT_CHECKED` — 저장된 문서를 받지 못해 8 을 보지 않았다 · `PREVIOUS_NOT_CHECKED` — `previous` 가 있는데 지난 회차를 받지 못해 아래를 보지 않았다 ·
  `SIBLING_NOT_CHECKED` · `TOOLS_FROM_NOT_CHECKED` — 짧은 이야기가 가리킨 긴 이야기를 받지 못해 같은 사건인지 · 도구가 거기 있는지 보지 않았다 (29)
- **지난 회차를 받으면 (`validateEpisode(ep, { previous })` — 실물 전 · §7.9)**: 받은 회차가 `previous` 의 그 판인가 · 같은 시리즈의 앞 화인가 · `before` 가 붙은 틀이 같은 그림 (kind · `picture.id`)이고 그 고리 · 쪽 id 가 지난 회차에 있나 · 지난 값이 그 회차의 값 그대로인가 · 옮겨 온 구절이 그 회차의 구절 그대로인가 → 아니면 `PREV_MISMATCH`. 문서를 받아야 보는 8 처럼, 지난 회차를 받아야 본다 — 위반 픽스처는 문서만 받으므로 이 코드는 시험이 픽스처 없이 본다
- `_` 로 시작하는 칸은 픽스처 주석이다. 무시하고, 돌려주는 회차에서는 뺀다 (ARTICLE_PACKAGE §9-10 과 같다)
- **검증기가 보지 않는 것**: 글의 뜻이 구절에서 나오는가 · §8 의 칸이 참인가 · ConceptRef 가 가리킨 개념 · `event_ref` 의 사건이 있는가 (저장소가 있어야 한다 — 발행 검사) · 그림 부품이 있는가 (코드 — 시안 `check.ts` S1) · `previous` 가 가리키는 회차가 있는가 (저장소 — 발행 검사. 받으면 위처럼 댄다) · 지난 회차에서 왔는데 `:` 없이 적은 구절 (§4.5)

---

## 10. 미확인

실물 둘에 없어 정하지 않은 것. 채우지 않는다 — 첫 실물이 나오면 다시 본다.

| 무엇 | 왜 못 정했나 | 언제 |
|---|---|---|
| 같은 시리즈의 회차 둘 — Series 가 따로 저장되나 · 따라잡기 · 지나온 줄이 어디서 오나 (UX2-d) · 지도의 자리가 시리즈의 것인가 | 시리즈마다 회차가 하나뿐이다 | 금리 3화 |
| **실물 전 칸 셋 (UX-6)** — 지난 회차를 가리키는 칸 (§3.4) · 지난 회차에서 온 구절의 키 (§4.5) · 같은 그림의 지난 값 (§7.9). 칸은 있다 — 모양 · `?` 를 그대로 둘지 · 바로 앞 화만 받나 · 켜고 끄기 · 넘겨 보기의 지난 값은 정하지 않았다 | 결정과 P-E2 의 시험에서 왔다 — 회차 실물이 아직 없다 | 금리 3화 (11/18 무렵) |
| 독립된 0화 | 0화는 장면과 시리즈 줄의 한 줄로만 있다 (§3.2) | 그 실물이 생길 때 |
| 무엇이 회차의 새 판을 만드나 · 저작 데이터 (시간 표현 · 스토리라인 핀)의 자리 · 발행 시각 · 언어 | 판이 둘인 실물 · 저작 데이터의 실물이 없다 (§2.3). ArticlePackage 의 `published_at` · `lang` 에 해당하는 칸도 실물에 없다 | 회차를 발행할 때 |
| 독자 기록이 회차를 가리키는 모양 · "이거 알아요?" 의 답 (UX1-c) | 회차를 읽은 기록이 없다 · D64 OPEN | OBSERVATION 개정 |
| 누가 어느 조립을 받나 · 조립이 둘뿐인가 · 접을지 뺄지 (UX1-e) | 지식 상태다 · D4 · D21 과 함께 — D66 OPEN | 도윤 |
| 지도의 선의 뜻 (UX1-d) | D65 OPEN | 도윤 |
| 구절 ↔ Fact (FactSource) · `voice` ↔ ARTICLE_PACKAGE 의 층 | 손으로 쓴 시안은 사실을 거치지 않았다 (§4.2 · §4.4) | P-E1 |
| 개념의 그림 부품이 어디에 사나 · 틀의 글 가운데 개념의 것 (UX4-g · UX3-b) | 켜고 끄기의 실물이 하나다 — D67 OPEN | 둘째 개념 체험 |
| 개념에 붙지 않은 그림 (`picture.tool` 이 없는) · 체험 없는 회차에서 풀이의 도구를 줍는 자리 (UX4-d) | 실물 없음 | 그 회차 |
| 틀 숫자 만지기 · 가르기 · 고리의 가지 · 자리의 세 쪽 · 켜고 끄기를 잇기 (UX4-i) | 실물 없음 | 그 회차 |
| 넘겨 보기 — 전 → 후 꼴 (고쳐진 문구) · 다른 틀과 잇기 · 갈래가 둘인 차례 · 칸 수의 위쪽 끝 · 때를 기계가 읽는 칸 (차례 검사) · 칸 사이의 까닭 · 같은 차례에 칸이 더해지는 다음 회차 (다시 쓰기 — 지난 칸과 새 칸을 어떻게 가르나) (§7.8) | 실물이 하나다 (개인정보 1화) | 의결서가 나오는 회차 · 둘째 넘겨 보기 |
| 기본 풀이 "조용히" · `why` 넷 (`short` 밖의) | 견본뿐이다 — 타입과 불변식 13 은 D61 ④ 에서 왔다 (**실물 없음**) | 그 회차 |
| **번호 (B-E3 · §13.3)** — 번호 칸이 없는 긴 이야기 · **첫 이야기가 나중에 "1화"가 되는 일** (발행된 이야기의 판이 오르나 · 화면만 바뀌나 — 짧은 이야기가 첫 이야기일 때도) · 번호 있는 짧은 이야기 · 1화인 긴 이야기의 화면 안쪽 ("1화" · 시리즈 줄 · "다음 화" — UX7-b) | 실물은 번호 없는 짧은 이야기 하나와 1화인 긴 이야기 둘 (칸은 1 · 오늘 화면이 숨김)뿐이다. 같은 시리즈에 둘째가 생긴 실물이 회차로는 없다 | 같은 시리즈의 둘째가 실제로 생길 때 · _open E-20 |
| **홀로 선 짧은 이야기** (곁 이야기 없음 — S-1 의 짧은 이야기 대부분) — 도구를 어디서 (제 카드 · 다른 이야기 · 개념 라이브러리) · 지도 · 남음 장면의 길 · 짧은 이야기끼리의 곁 이야기 | 실물은 곁 이야기가 있는 하나다 (§13.4) | P-S1 의 첫 짧은 이야기 · _open E-21 |
| 짧은 이야기의 다른 장면 수 · 조립이 갈리나 · 작은 체험 · 세 칸 / 조용히 (사람이 숨진 사건) · 다른 사건 이야기에서 가져온 도구 · 개념 라이브러리를 바로 가리키기 | 실물 하나 (§13.2 · §13.5 · §13.6) | 그 짧은 이야기 |
| 덧붙임 (후속 문서 한 줄) · 개념 이야기 (1차 문서 없는 큰 뉴스 → 개념으로) | **실물 없음 — 칸을 만들지 않았다** (§13.7) | 실물 생길 때 |
| 체험이 있는 회차에 기본 풀이를 같이 내나 | 시안의 견주기 스위치 때문에 실물 둘이 그렇다 (§7.7) | 도윤 (D62 ④) |
| 큰 글자 · 문서가 말한 것 · 다음 일의 개수 (둘 · 셋 · 셋) | 실물 둘이 같지만 규칙으로 걸 근거가 없다 | — |

---

## 11. _open — 게이트에서 판정할 것

| # | 무엇 | 지금 계약 | 다른 길 |
|---|---|---|---|
| E-1 | **칸 이름을 snake_case 로 바꿨다** (시안은 camelCase — `firstThought` → `first_thought`). 다른 계약 셋과 맞추려고 | 시안 코드도 따라 바꿨다 (화면 픽셀 0) | 시안 이름 그대로 |
| E-2 | **구절이 Fact 를 거치지 않는다** (§4.2). 파이프라인이 낸 회차는 p3 의 사실 · FactSource 에서 구절을 뽑을 수 있다 | `quotes` 는 문서와 글자만 | 구절에 `fact: FactRef` 를 더한다 — P-E1 이 실물을 낸 뒤 |
| E-3 | `voice` 셋과 ARTICLE_PACKAGE 층 다섯의 대응 — `official` ≈ OFFICIAL_CLAIM 인 사실 · `explain` ≈ concept · bridge · writing | 따로 둔다 | 본 화면을 회차로 옮길 때 하나로 |
| E-4 | **골든의 `basis[].part` 가 전부 `null`** — "모른다"의 뜻이다 (§6.1). CONCEPT_IDENTITY §3.3 의 `null` ("옮기지 않은 언급")과 뜻이 어긋난다 | 그대로 뒀다 (지어내지 않았다) | 콘텐츠 레인이 도구 4 의 문안을 대 보고 `part` 를 단다 · 또는 도구에는 `part` 를 요구하지 않는다고 정한다 |
| E-5 | **`not_yet_note` — 화면에 그 글이 있는지를 "그 문장이 `said` 안에 있다"로 봤다** (불변식 17). 독자 글을 고치지 않으려고 | `said.t` 의 조각 | 따로 보이는 칸 (`why_note: EpisodeText`)으로 — 화면 · 독자 글이 바뀐다 |
| E-6 | 굵게가 `**…**` 다 (ARTICLE_PACKAGE 는 `<b>…</b>`) | 실물 그대로 | 본 화면을 옮길 때 하나로 |
| E-7 | **체험이 있는 회차의 기본 풀이 `why` 를 `null` 로** (시안의 `"demo"` 를 계약에 들이지 않았다) | 체험 + 기본 풀이를 받는다 | 체험이 있으면 기본 풀이를 금지 — 골든에서 기본 풀이 글 (금리 13 덩이)이 빠진다 |
| E-8 | **`episode_id` · `series_id` 를 발급했다** (골든 둘 · UUID). `code` 는 시안의 글자 (`fomc` · `rate`) 그대로 — Event 의 code (`FOMC-20261028`) 같은 규칙은 정하지 않았다 | 그대로 | code 규칙을 정한다 (예: `rate-2`) |
| E-9 | `tools[]` 의 차례 = 지도 · "남음"의 차례. 시안에는 `conceptOrder` · `toolOrder` · `lateTool` · `pickedAfter` 넷이 있었다 — 같은 것을 두 번 적고 있어 `tools` 의 차례와 `pickup` 하나로 줄였다 | 줄였다 | — |
| E-13 | **넘겨 보기에도 `picture: PictureRef` 를 뒀다** (UX-5). 이 틀의 그림은 개념의 것이 아니라 사건의 것이라 `tool` 이 억지일 수 있다 (실물은 안전조치의무에 걸었다) | 다른 틀과 같은 모양 — `picture.id` 가 다시 쓰는 단위 | `picture` 를 빼고 차례의 이름 (`id`)만 · 또는 `PictureRef.tool` 을 없어도 되는 칸으로 (다른 틀의 칸이 바뀐다) |
| E-14 | **앞날 칸 금지를 스스로 적는 칸 (`PageCard.state`)으로 봤다** — `SeatsGround.split` 과 같은 방식 (금지된 값을 적으면 거부). 회차에 발행일이 없어 날짜로는 못 본다 | `TrackState` 를 다시 썼다 (`next` 거부) | 때를 기계가 읽는 칸 (`at`) + 사건일과 견주기 — DATA_MODEL 의 때 타입 · 발행일 칸이 생길 때 |
| E-15 | **셋째 골든의 근거 문서 여덟 가운데 하나가 다른 사건의 문서다** — 견주기 장면이 「누가 값을 정하나」 1화의 공정위 보도자료 구절 둘 (git · 공공누리 제1유형)을 다시 쓴다. 금리 2화가 9월 문서를 쓰는 것과 같은 꼴 | 받는다 (계약은 문서가 어느 사건의 것인지 보지 않는다) | 회차의 구절은 그 사건의 소스 팩에서만 — 견주기를 같은 사건 안 (대교 ↔ 영훈)으로 바꾼다 |
| E-10 | 고리의 `after` · `still` 에 구절을 달았다 (UX4-e) — 구절은 시안 주석의 것. `voice` 는 달지 않았다 | 구절만 | `voice` 도 (금리 = fact · 금융 여건 = official) |
| E-16 | **지난 회차 칸 셋을 `?` (빼도 되는 칸)로 뒀다 (UX-6).** 이 계약은 "없으면 `null` 을 적는다" (§12)인데, 그러면 골든 셋에 `previous: null` · `before: null` 을 더해야 한다 — 실물 전 칸으로 골든을 고치지 않으려고 | `?` | 3화가 나온 뒤 `\| null` 로 (골든 셋에 칸이 더해진다) |
| E-17 | **구절 키의 앞머리가 회차의 code 다** (§4.5) — `previous` 는 UUID + 판인데 키는 code 로 가리킨다. 키를 읽을 수 있게 · 짧게. 그래서 검증기는 지난 회차를 받기 전에는 앞머리가 그 회차인지 못 본다 | code | `EpisodeRef` 에 `code` 도 둔다 (D30 의 ArticleRef 에는 없다) · 또는 앞머리를 UUID 로 (읽기 어렵다) |
| E-18 | **쪽의 지난 값에 수 (`count`) · 그때의 말 (`said`)을 두지 않았다** — P-E2 의 `carry` 가 `group` · `why` 만 적었다. 화면은 자리 위의 말로 그때의 수를 보인다 (점을 다시 그리지 않는다) | `group` · `why` | `count` 를 더해 지난 화의 자리 그림을 그린다 (3화는 같은 표결이라 수가 같다) |
| E-19 | **지난 값은 고리 · 쪽에만** — 켜고 끄기 · 넘겨 보기 · 자리의 실제 결과 (`result`) · 머리 (`label`)에는 없다 | 고리 · 쪽 | 그 실물이 나올 때 (§10) |
| E-20 | **번호 (B-E3)** — 짧은 이야기는 번호 칸이 없고, 긴 이야기는 `number ≥ 1` 그대로다 (화면이 `number ≥ 2` 일 때만 보인다 — §13.3). **첫 이야기가 나중에 "1화"가 되는 일** (판이 오르나 · 화면만 바뀌나) · 번호 칸 없는 긴 이야기는 미확인 | 칸을 바꾸지 않았다 (실제 주소 `/s/<시리즈>/<번호>` · 파이프라인 `prev.number + 1` 그대로) | 긴 이야기의 `number` · `track` 을 고를 수 있게 — 새 시리즈의 첫 긴 이야기가 "1화" 글 · 시리즈 줄 · "다음 화"를 싣지 않게 (실제 주소 · 파이프라인 · 시안이 함께 바뀐다). 둘째가 생길 때 첫 이야기의 판을 올린다 · 또는 카탈로그가 둘째를 보고 화면에서만 "1화"를 단다 |
| E-21 | **`sibling` · `tools_from` 이 필수다** — 실물이 곁 이야기가 있는 하나라서 (§13.4) | 필수 | `\| null` — 홀로 선 짧은 이야기 (그때 도구 · 지도 · 남음 장면의 길을 함께 · P-S1) |
| E-22 | **짧은 이야기를 따로 선 타입으로 뒀다** (§13.1) — Episode 를 넓히지 않았다 | `ShortStory` (+ Episode 의 `weight?: "long"`) | Episode 하나에 무게로 가르는 고를 수 있는 칸 (장면 · 번호 · 도구 · 지도) — Episode 를 읽는 코드가 다 바뀐다 |
| E-23 | **옮기며 고친 셋** (§13.8) — lab 의 `shelf` (Series 의 셋)을 `series` (Series 통째로 — `sub` 는 긴 이야기 골든의 값) · `scenes.cover.weight_label` ("짧은 이야기")을 빼 화면의 글로 · `sibling` · `tools_from` 을 code 가 아니라 EpisodeRef 로 | 그렇게 했다 | lab 그대로 (`shelf` · `weight_label` · code) — E-17 (code 로 가리키기)과 같은 물음 |

---

## 12. 실물 → 이 계약 — 옮겼다 (B-E1 · 2026-11-11)

독자가 읽는 글은 한 글자도 바꾸지 않았다. 바뀐 것은 칸의 이름과 자리다.

| 시안 (`9bf4ede`) | 이 계약 | |
|---|---|---|
| `id` | `code` | + `episode_id` · `episode_version` · `event_ref` · `number` 발급 |
| `path` · `short` · `stores` · `readers` | — | 시안 전용. 계약에 없다 (`readers` = 지식 상태의 고정값) |
| `series { id, name, sub, episodes }` | `series { series_id, code, name, sub }` + `track` | |
| `docs[label] { store, source_id, name }` | `docs[label] { source_id, name }` | 저장소 파일의 자리는 계약 밖 |
| `sources` | `quotes` | |
| `T { t, src, calc, ui, layer }` | `EpisodeText { t, src, calc, ui, voice }` | |
| `layerLabels` | `voice_labels` | |
| `concepts{}` · `conceptOrder` · `from: [canonical_name] \| "hand"` | `tools[]` (차례 포함) · `basis: ConceptRef[]` | 이름 글자 → 개념의 UUID · 버전 (라이브러리 `docs/content/concept-library.json` 의 지금 버전) · `part: null` |
| `toolOrder` · `lateTool` · `pickedAfter` | `pickup { tools, aha, next }` | 같은 것을 한 곳에 |
| `copy.*` (장면의 글) · `copy.map.whereToday` | `scenes.*` · `map.where_today` | |
| `solve.entry` · `solve.lab` · `solve.plain` | 같다 | `picture.concept` → `picture.tool` · `born.concept` → `born.tool` |
| `ToggleFrame.stage` (그림: 자리 · 막대 · 알갱이의 수) | — | **계약에 없다** — 개념의 그림 부품 (시안 `kit/frames/pictures.ts`) |
| `ChainNode.after` · `still` (맨 글자열) | EpisodeText + 구절 | UX4-e |
| `SeatSide.why` | + `not_yet_note` | UX4-a |
| `Lab` | + `seen_title: null` | D62 ③ |
| `PlainSolve.why: "demo"` | `null` | 시안 전용 값 |
| 없으면 뺀 칸 (`tab?` · `goOn?` · `born?` · `differNote?`) | `null` 을 적는다 | `EpisodeText` 의 `src` · `calc` · `ui` · `voice` 만 뺄 수 있다 — UX-6 이 더한 실물 전 칸 셋 (`previous` · 고리 · 쪽의 `before`)도 뺄 수 있다 (E-16) |

셋째 골든 `fixtures/episode-privacy-1.json` (구절 44 · 문서 8 · 글 105 · 도구 5 — 전부 손으로)은 옮긴 것이 아니라 처음부터 이 계약의 모양으로 썼다 (UX-5). 시안 `/lab/episode/pipc` 가 그것을 읽어 그린다.

골든: `fixtures/episode-price-1.json` (구절 39 · 문서 6 · 글 94 · 도구 4) · `fixtures/episode-rate-2.json` (구절 41 · 문서 8 · 글 129 — 시안의 126 + 고리의 값 3 · 도구 5).
시안 (`/lab/episode` · `/lab/episode/fomc`)은 이 골든을 읽어 그린다.

---

## 13. 짧은 이야기 · 번호 없는 이야기 (B-E3 · D79 · D80 · D86 — 실물 하나)

실물: UX-7 의 짧은 이야기 「병원이 털렸다는데, 어디가 털린 걸까」 — 영훈의료재단 (대전선병원 · 유성선병원). 개인정보위 2026-10-28 의결 · 10-29 발표의 병원 쪽이고, 같은 발표의 대교 쪽이 「내 정보는 누가 지키나」 1화 (긴 이야기 · 골든 셋째)다.
lab 의 꼴 (`apps/web/src/app/lab/today/short/types.ts` 의 「모자람 1 ~ 6」 · `logs/frontend/UX-7.md` ③ 표) · 오늘 화면의 번호 규칙 (`number ≥ 2` 에서 "이어지는 이야기"를 읽음) · 결정 D79 ① ③ (시리즈는 결과 · 무게 둘) · D86 (번호 · 시리즈 줄은 둘째 이야기가 실제로 생겼을 때만 · 긴 0 ~ 2 + 짧은 나머지 · "정할 것은 추천대로" = UX-7 ⑤ 2 ~ 4).
골든 넷째 `fixtures/episode-short-privacy-yeonghun.json`. 실물이 하나라 이 절의 칸은 전부 **실물 하나**다.

| UX-7 ③ | 모자란 것 | 이 계약 | |
|---|---|---|---|
| 모자람 2 | 무게 | `weight` — ShortStory 는 `"short"` (필수) · Episode 는 고를 수 있는 칸 `weight?: "long"` (없으면 긴 이야기) | §13.1 |
| 모자람 1 | 짧은 조립 (장면 넷) | ShortStory 의 `scenes` = 장면 넷 (`ShortScenes`) · 조립 칸 없음 (차례 고정) | §13.2 |
| 모자람 3 | 번호 없는 이야기 (선반) | ShortStory 는 `series` (Series 그대로)만 — `number` · `track` · `previous` 칸이 없다 | §13.3 |
| 모자람 4 | 같은 사건의 곁 이야기 | `sibling: Sibling { episode: EpisodeRef, label, note }` | §13.4 |
| 모자람 5 | 다른 이야기의 도구 가리키기 | `tools_from: ToolsFrom { episode: EpisodeRef, keys }` — `tools` · `pickup` · `map` 칸이 없다 | §13.5 |
| 모자람 6 | 체험이 없는 까닭 = 무게 | `NoLabWhy` 에 `"short"` · `solve` = `ShortSolve { entry, plain: PlainFlip }` — 체험 칸이 없다 | §13.6 |

### 13.1 무게 — 모양이 둘이다. `weight` 로 가른다

- **판단: 짧은 이야기는 Episode 의 한 꼴이 아니라 따로 선 타입 (`ShortStory`)이다.**
  - 실물이 그렇다 — 겹치는 것은 글과 근거 (§4 전부) · 입구 (§7.1) · "뒤집기만" (§7.7)뿐이고 뼈대 (장면 · 번호 · 도구의 자리 · 지도 · 조립)가 다 다르다 (UX-7 ③ "모자란 것은 뼈대다")
  - Episode 를 넓히면 (장면 · 번호 · 도구 · 지도를 고를 수 있게) 긴 이야기의 불변식 (장면 여덟 · 조립 · 시리즈 줄 · 줍는 자리 · 지도)마다 "짧은 이야기가 아니면"이 붙고, 긴 이야기에서 빠진 칸이 거부되지 않는다
  - 지금 Episode 를 읽는 코드가 `number` · `track` · `scenes.zero` 를 그대로 읽는다 — 실제 주소 (`/s/<시리즈 code>/<번호>` · `apps/web/src/episode/catalog.tsx`) · 파이프라인 (`episode.ts` 의 `prev.number + 1`) · 시안 · e2e. **Episode 의 칸은 고를 수 있는 칸 `weight?` 하나 말고 바꾸지 않았다** — 골든 셋 0자 · 그 코드 0줄
- 같이 쓰는 타입 (EpisodeText · EpisodeDoc · EpisodeQuote · VoiceLabels · Series · EpisodeRef · SolveEntry · Flip · PlainFlip · RealItem)은 다시 정의하지 않는다 — 한 타입은 한 곳에
- **`weight`** — ShortStory 는 `"short"` (필수). Episode 는 `weight?: "long"` — **칸이 없으면 긴 이야기**다 (골든 셋은 칸이 없다). 이야기 하나를 받으면 `weight` 가 `"short"` 면 짧은 이야기, 아니면 긴 이야기다 (`validateStory` · 코드의 `Story = Episode | ShortStory`)
- `episode_id` · `episode_version` · `code` 는 Episode 와 같은 방식 · 같은 이름 공간 — EpisodeRef 가 어느 쪽이든 가리킬 수 있다 (독자 기록이 회차를 가리키는 모양은 여전히 미확인 — D64). 짧은 이야기도 발행 한 번 = 하나 · 통째로 불변 (§2.3). Event 를 가리키는 것 (`event_ref`)도 같다 — ArticlePackage · Episode 와 형제다 (§2.2)
- 무게는 사람이 정한다 — 아침 고르기 (D86 · D3 — 스스로 적는 칸 §8). 화면이 무게로 가르는 것: 카드의 꼴 · 장면 수 · 체험. 읽는 시간은 내지 않는다 (D82)

### 13.2 짧은 조립 — 장면 넷

- **표지 `cover` → 어디가 `where` → 문서가 말한 것 `why` → 남음 `keep`** (`ShortSceneId` · 코드 `SHORT_SCENE_IDS`). 차례는 고정이고 장면 넷의 글을 전부 싣는다. **조립 칸이 없다** — 실물은 조립이 하나다 (처음 온 독자 · 따라온 독자가 같은 넷을 본다. 짧은 이야기에서 조립이 갈리는지는 미확인)
- 장면마다 무엇이 화면이 되나 (시안 `lab/today/short/Short.tsx` — 넘어가는 법 · 글 부품 · 근거 시트 · 지도는 긴 이야기의 것 그대로):

| 장면 | 화면 | 칸 |
|---|---|---|
| `cover` 표지 | 시리즈 이름 (선반) · 무게의 이름 ("짧은 이야기" — 화면의 글) · 물음 제목 · 한 줄 · 날 · 곁 이야기와 한 묶음이라는 말 · 물음 | `series.name` · `scenes.cover` |
| `where` 어디가 | 물음 → 머리 (`solve.plain.title`) · 첫 생각 · 깨는 사실 · 아래 글 · 뒤집기 `A ≠ B` 크게 + 한 문단 · 문서에 없는 것은 없다고 · 물음 | `solve.entry` · `solve.plain` · `scenes.where` |
| `why` 문서가 말한 것 | 머리 · 이끄는 글 · 문서가 짚은 것 (`real`) · 판정 · 가리킨 도구 (접어서 — §13.5) · 누구의 말 (`solve.entry.whose`) · 물음 | `scenes.why` · `tools_from` · `solve.entry.whose` |
| `keep` 남음 | 남는 한 줄 · 당부 · 지도 (가리킨 이야기의 것 — §13.5) · 만난 도구 · 곁 이야기로 가는 길 · **다음 화 예고 없음** | `scenes.keep` · `sibling` |

- 긴 이야기의 장면 (따라잡기 · 사건과 끌림 · 도구 줍기 · 견주기 · 이어짐)은 칸이 없다 — 넣으면 거부 (불변식 28). **다른 장면 수 (셋 · 다섯)는 미확인** — 실물이 넷 하나다 (D79 ③ 의 "장면 서넛"은 어림이다)
- `scenes.cover` 에 무게의 이름이 없다 — lab 은 `weight_label: "짧은 이야기"` 로 실었지만 `weight` 에서 나오는 화면의 글이다 (긴 이야기의 "이거 알아요?" 같은 공통 화면 글 — §0). 화면이 단다 (E-23)

### 13.3 번호 없는 이야기 (선반) · 번호를 언제 붙이나

- **번호 없는 이야기 = 시리즈에 놓이되 번호 · 시리즈 줄이 없다.** ShortStory 의 `series` 는 Episode 의 `series` 와 같은 Series 다 (발행 때의 시리즈 표기를 품는다 — §3.1). `number` · `track` · `previous` 칸이 없다 — 넣으면 거부 (불변식 28).
  lab 은 `shelf: {series_id, code, name}` 으로 줄여 실었다 — 계약은 Series 하나로 (같은 묶음을 한 모양으로 · `sub` 는 긴 이야기 골든의 그 값이고 짧은 이야기 화면에는 안 보인다 — E-23)
- **번호를 언제 붙이나 (D86 — "번호 · 시리즈 줄은 둘째 이야기가 실제로 생겼을 때만")**
  - **짧은 이야기에는 번호가 없다.** 같은 발표의 곁 이야기는 "2화"가 아니다 — 곁 이야기에 번호를 주면 "이어진다"는 뜻이 흐려진다 (UX-7 ⑤ 4 · D86 "추천대로"). 번호는 시간이 흘러 다음 사건 · 다음 문서가 왔을 때의 것이다
  - **긴 이야기는 칸 그대로 — `number ≥ 1` · `track`.** 화면이 번호를 보이는 것은 `number ≥ 2` 일 때뿐이다 (UX-7 오늘 화면의 규칙 — 실물): 그때만 "N화" · 시리즈 줄 · 지난 이야기 30초. `number` 가 1 이면 주제 이름 (선반)만. **이것은 화면의 규칙이고 검증기는 보지 않는다** — 계약은 칸만 싣는다
  - 그래서 지금 "번호 없는 이야기"는 두 꼴로 보인다: 짧은 이야기 (칸이 없다) · 1화인 긴 이야기 (칸은 1 · 화면이 숨긴다 — 골든 첫째 · 셋째)
- **미확인 (실물 없음 — 칸을 만들지 않았다 · _open E-20)**
  1. **첫 이야기가 나중에 "1화"가 되는 일** — 같은 시리즈에 둘째가 생기면 첫 이야기의 **판이 오르나** (번호 · 시리즈 줄을 단 새 판) · **화면만 바뀌나** (카탈로그가 같은 시리즈의 둘째를 보고 "1화"를 단다). 첫 이야기가 짧은 이야기이고 다음 이야기가 이어지면 그 짧은 이야기가 "1화"가 되나도 같은 물음
  2. 번호 칸이 없는 긴 이야기 — 새 시리즈의 첫 긴 이야기가 "1화" 글 · 시리즈 줄 · "다음 화"를 싣지 않는 꼴. 지금은 1 을 적고 화면이 숨긴다
  3. 1화인 긴 이야기의 화면 안쪽 — 표지의 "1화" · 시리즈 줄 · 0화 장면의 머리 · 남음의 "다음 화" 예고 (UX7-b). 골든의 글이라 계약이 아니라 화면 (F-E2)이 정한다

### 13.4 같은 사건의 곁 이야기 — `sibling`

- `Sibling { episode: EpisodeRef, label, note }` — 같은 사건 (`event_ref`)을 다룬 **긴 이야기의 한 판**. 실물: 「내 정보는 누가 지키나」 1화 (`pipc` 1판 · 대교 쪽). `label` · `note` 는 남음 장면의 "곁 이야기로 가는 길" 위에 보이는 글이다 ("같은 발표의 긴 이야기" · "대교 쪽 이야기 · 긴 이야기 · 체험 있음"). 가는 곳의 제목은 그 이야기의 표지에서 읽는다
- **`previous` (§3.4)와 뜻이 다르다** — `previous` 는 같은 시리즈의 앞 화 (시간이 흐른 다음 사건 · 같은 그림의 지난 값)다. 곁 이야기는 같은 사건 · 같은 때의 다른 쪽이다. 번호도 그림도 이어 받지 않는다
- lab 은 회차의 `code` 로 가리켰다 — 계약은 EpisodeRef (UUID + 판 · `previous` 와 같은 방식 — D30). 가리킨 도구의 글 (§13.5)이 그 판의 글이어야 짧은 이야기가 통째로 불변이다 (E-23)
- 검증 (불변식 29): 가리킨 판 ≥ 1 · 이 이야기 자신이 아니다. **가리킨 긴 이야기를 받으면** (`validateShortStory(s, { episodes })`) 같은 사건인가 — 아니면 `SIBLING_MISMATCH`. 안 받으면 알림 `SIBLING_NOT_CHECKED`
- **긴 이야기 쪽에서 곁 이야기를 가리키는 칸은 없다.** 긴 이야기 골든의 "병원 쪽 이야기는 따로" (이어짐 장면 `coming[2]`)는 글일 뿐이다 (골든 0자). 거꾸로 찾기 (이 긴 이야기의 곁 이야기는?)는 카탈로그의 일이다 — 짧은 이야기의 `sibling` 을 읽는다
- **필수 칸이다** — 실물은 곁 이야기가 있는 하나다. 곁 이야기가 없는 짧은 이야기 (홀로 선 짧은 이야기)는 미확인 (_open E-21 · §10). 짧은 이야기끼리의 곁 이야기도 미확인

### 13.5 다른 이야기의 도구 — `tools_from`

- `ToolsFrom { episode: EpisodeRef, keys: ToolKey[] }` — 다른 이야기의 Tool 카드를 **가리키기만** 한다. 글을 새로 쓰지 않는다 (같은 개념을 두 번 쓰지 않는다 · 비용 0 · D79 ② "이어짐은 개념이 맡는다"). `keys` 의 차례 = 화면의 차례 (접힌 카드 · 만난 도구)
- 그래서 짧은 이야기에는 **`tools` · `pickup` · `map` 칸이 없다.** 화면이 하는 일 (시안): 문서가 말한 것 장면에서 가리킨 카드를 **접어서** 보인다 · 그 장면을 지나면 만난 것 (고정 — 지식 상태를 추정하지 않는다) · 지도는 가리킨 이야기의 `map` 에 이 이야기에서 만난 도구만 켠다 · 카드 글의 근거는 가리킨 이야기의 `quotes` 에서 찾는다 (카드의 글 · 구절은 그 이야기의 것이다)
- 실물에서는 `tools_from.episode` = `sibling.episode` (같은 긴 이야기)다. **둘을 하나로 묶지 않은 까닭**: 도구는 다른 사건의 이야기에서도 올 수 있다 (D79 ② — 과징금은 배달앱 이야기에도 있다). 그런 실물은 없다 — 받기만 한다 (미확인)
- 검증 (불변식 29): 하나 이상 · 겹침 없음 (`REF_TOOL`) · 가리킨 판 ≥ 1 · 자신이 아니다 (`ID_RANGE`). **가리킨 이야기를 받으면** 그 `tools` 에 key 가 있나 (`REF_TOOL`). 안 받으면 알림 `TOOLS_FROM_NOT_CHECKED`
- 개념 라이브러리를 바로 가리키는 길 (ConceptRef)은 없다 — 실물은 이야기의 카드를 가리켰다. "같은 개념"을 어떻게 맞추나 (UX7-c — 시안은 이름으로)는 D64 · D65 와 함께 미확인

### 13.6 풀이 — 체험이 없는 까닭 = 무게

- **`ShortSolve { entry, plain: PlainFlip }`** — 입구 (§7.1 그대로 — 첫 생각 · 깨는 사실 · 뒤집기 · 그리지 않을 것 · 누구의 말 · 사망) + 기본 풀이 "뒤집기만" (§7.7). **체험 칸이 없다** — 넣으면 거부 (불변식 28).
  실물: 첫 생각 "병원이 털렸다 → 진료 기록" → 깨는 사실 "문서가 가리킨 곳은 운영을 보조하는 홈페이지의 회원가입" → `“털리는 곳” ≠ “가장 중요한 시스템”`
- **`NoLabWhy` 에 `"short"` (무게).** 짧은 이야기에 체험이 없는 까닭은 정치 · 사망 · 자료 없음 · 뒤집기 없음이 아니라 "짧은 이야기라서"다 (UX-7 ③ 모자람 6 — lab 은 `null` 로 두어 `PLAIN_WHY` 하나에 걸렸다). 짧은 이야기의 `plain.why` 는 `"short"` · 긴 이야기의 까닭은 `"short"` 일 수 없다 (불변식 27)
- 짧은 이야기에도 뒤집기가 있어야 한다 — "뒤집기만"이 뒤집기를 요구한다 (불변식 14). 실물은 "작은 뒤집기 하나"다 (UX-7). 뒤집기 없는 짧은 이야기 (세 칸 · 조용히)는 미확인
- 기본 풀이의 꼴은 "뒤집기만" 하나다. 그래서 **사람이 숨진 사건은 짧은 이야기로 낼 수 없다** — D61 ④ 는 "조용히"를 요구한다 (`DEATH_NOT_QUIET`). D86 "부고 · 재난 당분간 안 다룬다"와 맞는다 (미확인 — 그 실물이 생길 때)
- 작은 체험 (UX-7 ⑤ 3 "눌러서 뒤집기 열기 정도")은 실물이 없다 — 칸이 없다

### 13.7 실물이 없는 것 — 칸을 만들지 않았다

| 무엇 | 어디서 나왔나 | 지금 |
|---|---|---|
| **덧붙임** — 후속 문서가 나오면 지난 이야기에 한 줄 | D83 ④ · D86 ("후속 → 새 회차 · 덧붙임 · 넘김") | 칸 없음 · 실물이 생길 때 (발행된 이야기는 통째로 불변이라 덧붙임이 새 판인지 따로 선 것인지부터 — §2.3) |
| **개념 이야기** — 큰 뉴스인데 1차 문서가 없으면 사건이 아니라 개념으로 ("사이드카는 무엇을 멈추나" — 원문은 규정) | D86 | 칸 없음 · 실물이 생길 때 (사건 (`event_ref`)이 없는 이야기 · 원문이 규정인 이야기의 모양) |
| 첫 이야기가 나중에 "1화"가 되는 판 처리 | D86 | §13.3 · _open E-20 |
| 홀로 선 짧은 이야기 · 번호 칸 없는 긴 이야기 · 번호 있는 짧은 이야기 · 짧은 이야기의 작은 체험 · 다른 장면 수 | D79 ③ · D84 · UX-7 ⑤ | §10 |

### 13.8 실물 → 이 계약 — 옮겼다 (B-E3 · 2026-11-14)

독자가 읽는 글 · 구절 · 숫자는 한 글자도 바꾸지 않았다 — lab `data.ts` 의 값을 그대로 덤프해 칸의 이름과 자리만 옮겼다 (글 덩이 18 · 구절 18 · 숫자가 든 글 3 이 같다 · `logs/backend/B-E3.md` ③).

| lab (`lab/today/short/types.ts` · `data.ts` @ `867c9da`) | 이 계약 | |
|---|---|---|
| `code` · `event_ref` · `docs` · `quotes` · `voice_labels` · `scenes.*` (아래 하나 빼고) | 같다 | + `episode_id` 발급 · `episode_version` 1 |
| `weight: "short"` | 같다 | Episode 에 고를 수 있는 칸 `weight?: "long"` |
| `shelf: {series_id, code, name}` | `series: Series` | `sub` 는 긴 이야기 골든의 그 값 (같은 시리즈) |
| `sibling: {code, label, note}` | `sibling: {episode: EpisodeRef, label, note}` | code `pipc` → 그 판 (UUID + 1) |
| `tools_from: {episode: code, keys}` | `tools_from: {episode: EpisodeRef, keys}` | |
| `entry` · `plain` | `solve: {entry, plain}` | `plain.why`: `null` → `"short"` |
| `scenes.cover.weight_label` ("짧은 이야기") | — | 무게의 이름 — 화면의 글 (E-23) |

골든 넷째 `fixtures/episode-short-privacy-yeonghun.json` (구절 18 · 문서 2 · 글 18 · 숫자가 든 글 3 · 가리킨 도구 3 — 긴 이야기 `pipc` 1판의 `safety` · `fine` · `order`). 시안 `/lab/today/short` 가 이것을 읽어 그린다 (lab 의 꼴 `types.ts` 는 지웠다 — 한 타입은 한 곳에).
