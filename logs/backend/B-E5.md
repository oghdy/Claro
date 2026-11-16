# logs/backend · B-E5 — 맨 글자열의 숫자를 근거로 받기 (D119 · D120)

## B-E5 · 2026-11-16 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음 · 비밀 (키 · .env) 출력 0.
**고친 곳**: `docs/contract/EPISODE.md` (CHANGELOG · §4.1 · §4.3 · §9 (10 의 줄 · 아래 말 둘) · §11 E-30 · **E-35 새 줄** · §14.2 · §14.4 · §14.9 표 5 · §14.10) · `packages/contract/src/validate-episode.ts` · `packages/contract/test/episode.test.ts` ·
`fixtures/invalid/episode-bare-digit.json` (`_violation` 의 `rule` · `what` 두 줄만 — 몸은 그대로) · `packages/pipeline/test/short.test.ts` (기대한 코드 한 줄 — ③ 끝) · 이 로그 · `docs/development-backend.md` B-E5 줄.
**안 건드린 것 (0자 — ④)**: 골든 다섯 · 이야기 글 (pipeline 데이터 · lab 회차 · 실제 이야기) · 타입 · 칸 (`episode.ts` 0줄) · 다른 불변식 · 화면 코드 · 파이프라인 src · 프롬프트 (`*-prompt.ts`) · lab `check.ts` · DECISIONS.

**한 줄 답**: 불변식 10 = **맨 글자열의 숫자는 같은 이야기의 근거 있는 글 (9 가 구절 · `calc` 로 받친 EpisodeText — `ui` 빼고)에 같은 수가 있을 때만.** 9 의 숫자 읽기 함수를 그대로 쓰고 (`digitsOf` · `inPool`), 세 꼴이 같은 검사기 (`groundProblems`)를 지난다. 규칙은 넓어지기만 했다 — 지금 이야기 전부 결과가 글자 하나 다르지 않다. 이제 **26 칸** (oil-replot-b 12 · oil-1 13 · meta-gallery 1 — 그 가운데 화면의 도구 수 4 칸은 우연히 받쳐짐)을 아라비아 숫자로 바꿔도 계약이 받는다.

---

## ① 새 규칙 한눈에

| | 전 (B-E1 ~ B-E4) | 지금 (B-E5) |
|---|---|---|
| 글 | 맨 글자열 (`string` 칸)에는 숫자가 없다 | 맨 글자열의 숫자는 **같은 이야기의 근거 있는 글**에 같은 수가 있을 때만 |
| 근거 있는 글 | — | 불변식 9 가 ① 구절 (`src`) · ② `calc` 로 받친 EpisodeText 의 수. ③ 화면 번호 (`ui`)의 수는 **받침이 아니다** · 근거를 잃은 글 (`NUMBER_UNGROUNDED`)의 수도 아니다 |
| 읽는 법 | — | §4.3 그대로 — 쉼표 떼기 · 숫자 토막 · 앞 0 떼기 · 연도 (맨 글자열의 2026 ↔ 받친 글의 26). **코드도 9 의 함수 그대로** |
| 언제 거부 | 모양 (1)에서 먼저 멈춤 | 근거 (3 · 8 · 4 · 9)와 함께 — 받칠 글이 근거를 잃으면 `NUMBER_UNGROUNDED` 와 `BARE_DIGIT` 이 같이 난다 |
| 코드 | `BARE_DIGIT` | `BARE_DIGIT` (이름 그대로 · 말: "맨 글자열의 숫자 n 이 근거 있는 글에 없다") |
| 꼴 | 셋 다 (모양 검사가 같다) | 셋 다 (근거 검사가 같다) |

**까닭 (D119)**: 도윤 "유월 열두 번째 이렇게 쓰지 말고 6월 12번째 이런 식으로". 10 이 숫자를 아예 막아서 쓰는 세션이 머리 · 꼬리표에 한글 수를 썼고 같은 화면의 본문 "6월"과 섞였다 (UX-10b ⑥ · O4).
10 의 뜻 — **근거 없는 수가 근거 검사 (9)를 비켜 가지 못하게** — 은 그대로다: 맨 글자열의 수는 늘 본문 어딘가의 문서 근거에 기댄다. 한글 수 ("열두")는 계약이 막지 않는다 (뜻이 갈리는 말이 많다 · 쓰는 법에 둔다 — 지시 그대로).
**보지 않는 것**: 그 수가 같은 것의 수인가 — 수만 댄다 (E-35 · ⑥).

## ② 바꾼 코드 · 셋 꼴에 같게 됐나

`packages/contract/src/validate-episode.ts` (+38 −21 남짓)
- **숫자 읽기를 함수 둘로 꺼냈다** — `digitsOf(t)` (굵게 `**` 떼고 숫자 토막) · `inPool(n, pool)` (같은 수 · 또는 연도 2026 ↔ 26). 9 가 쓰던 식 (`runs(item.t.replace(/\*\*/g, ""))` · `pool.includes(n) || 연도 …`)을 그대로 옮긴 것 — 9 의 결과는 같다 (같은 규칙을 두 번 짜지 않았다)
- `shapeProblems` (모양 · 1) — `case "string"` 에서 바로 `BARE_DIGIT` 을 내던 것을 **숫자가 든 맨 글자열을 모으기만** (`bare: {path, value}[]`) 하게 바꿨다. 이름 · 원문 · 조각 · 적어 둔 말 (`Id` · `SourceText` · `Fragment` · `Note` …)은 전처럼 밖이다
- `groundProblems` (근거 · 3 · 8 · 4 · 9) — 9 를 지난 수를 `backed` 에 모으고 (`ui` 글은 9 가 건너뛰므로 들어가지 않는다), 끝에 **10**: 맨 글자열의 수 (한 칸에 같은 수는 한 번)마다 `inPool(n, backed)` 가 아니면 `BARE_DIGIT`
- **셋 꼴**: `validateEpisode` · `validateShortStory` · `validateFlowStory` 셋 다 원래 `shapeProblems` → `groundProblems` 를 지났다 — 세 부르는 곳에 `shape.bare` 를 넘긴 것뿐이다 (꼴마다 따로 짠 곳 0). 시험이 꼴마다 받침 · 막힘을 본다 (③)
- 통계 (`stats`)는 바꾸지 않았다 — 파이프라인 `review.json` 이 품고 있어 `--check` 가 글자 단위로 같게
- 머리 주석: 10 의 글 · "보지 않는 것"에 "같은 것의 수인가" · 불변식 번호 주석 (`1 · 10 · 28` → `1 · 28` 등)

## ③ 시험 · 픽스처 짝

| 무엇 | 꼴 | 고침 (골든을 고쳐 넣어 본 것 — 골든 파일은 그대로) | 결과 |
|---|---|---|---|
| ① 받쳐진 수 | 긴 (배달앱 1화) | 큰 글자 꼬리표 "2026년 10월 29일 · 잠정" · "11월 09일 발표" (앞 0) · 단추 "3,311억 원은 어디서 나왔죠?" (쉼표) | 지난다 |
| ① 받쳐진 수 | 옛 짧은 (영훈) | 단추 "10월 28일에 진료 기록이 털린 건가요?" · 남는 한 줄 "188,481명이 털린 곳은 …" | 지난다 |
| ① 받쳐진 수 | 새 짧은 (비만 B) | 문서의 문장 이름표 "질병관리청 11월 9일 발표문에서" | 지난다 |
| ① 계산으로 받친 글 | 새 짧은 | 본문에 "차이는 19.6%p예요" + `calc {"19.6": "42.5 − 22.9"}` · 뒤집기 이름표 "19.6%p 차이를 뒤집어 보면" → 지난다 · **calc 를 떼면** 글 `NUMBER_UNGROUNDED` ×2 + 이름표 `BARE_DIGIT` ×2 (근거 잃은 글은 받침이 아니다 · 둘이 같이 난다) | 지난다 / 넷 |
| ② 받쳐지지 않은 수 | 긴 | "잠정 · 역대 2위" (2 를 받친 글이 없다 — 2020 · 2023 은 다른 토막) | `BARE_DIGIT` |
| ② | 옛 짧은 | 남음 머리 "작은 뒤집기 7개가 …" · 남는 한 줄 "18만 8,481명이 털렸다." (본문은 188,481 — 토막 18 · 8481 이 없다) | `BARE_DIGIT` · ×2 |
| ② | 새 짧은 | `words_label` "… 낱말 8개" · (있던 시험) 문서의 문장 이름표 "발표문 8쪽에서" | `BARE_DIGIT` |
| ③ `ui` 만 | 긴 (금리 2화) | 단추 "1화 다음은 어떻게 됐죠?" — 1 은 "1화" (`ui`)에만 | `BARE_DIGIT` |
| ③ `ui` 만 | 긴 (개인정보 1화) | 남음 머리 "0화부터 1화까지" — 0 · 1 다 `ui` 에만 | `BARE_DIGIT` ×2 |
| ③ 같은 이야기 안에서만 | 긴 (배달앱 1화) | 같은 단추 "1화 다음은 …" — 배달앱은 1 을 구절로 받친 글이 있다 | 지난다 |
| 골든 다섯 | 셋 다 | 그대로 | 지난다 |

- **위반 픽스처 `episode-bare-digit.json` — 여전히 거부.** 받칠 수 있는지 먼저 대 봤다: 배달앱 1화의 근거 있는 글의 수 = 1 4 5 6 7 8 9 10 11 12 13 16 29 34 44 45 58 63 75 80 90 94 1602 2020 2023 2024 2025 2026 2027 3008 3311 6800 — **2 가 없다**. 그래서 몸 (골든 + "잠정 · 역대 2위")은 그대로 두고 `_violation` 의 `rule` (새 규칙의 글) · `what` (2 를 받친 글이 없다 · B-E5 에서 다시 대 봤다)만 고쳤다. `WRITE_EPISODE_INVALID=1` 로 표에서 다시 썼다 — 회차 위반 53 파일 가운데 다른 52 는 바이트 그대로 (`git status` 에 M 은 이 하나)
- 있던 시험 하나를 고쳤다: 새 꼴 "문서의 문장 이름표에 숫자 → `BARE_DIGIT`"이 "발표문 **2쪽**에서"였다 — 2 는 "2명 중 1명"이 받쳐 이제 지난다 → **8쪽** (받친 글 없음)으로
- **파이프라인 시험 한 줄** (`packages/pipeline/test/short.test.ts:122`): 깨는 사실 "결정이 2일 먼저였어요." (근거 없음) + 남는 한 줄 "2일 먼저였다." + 없는 구절 키 → 전에는 모양에서 멈춰 `["BARE_DIGIT"]` 하나였다. 이제 근거와 함께 보므로 `["BARE_DIGIT", "NUMBER_UNGROUNDED", "REF_QUOTE"]` (받칠 글 — 깨는 사실의 2 — 이 근거가 없어 맨 글자열의 2 도 걸린다). 기대한 코드 · 주석만 고쳤다 — 그 시험의 나머지 (고친 뒤 통과)는 그대로 지난다
- contract 시험 150 → **156** (새 describe 하나에 6 — ① 셋 · ② · ③ · 골든) · pipeline 182 그대로 (한 줄 고침)

## ④ 안 깨진 것

**골든 다섯 0자** — `git diff --stat fixtures/episode-*.json` 빈칸 · 해시가 HEAD 와 같다:

| 골든 | 지금 = HEAD |
|---|---|
| `episode-price-1.json` | `b2514cd869b9` |
| `episode-privacy-1.json` | `98c421e01c91` |
| `episode-rate-2.json` | `28feb2c4a656` |
| `episode-short-obesity-who.json` | `7565b06a8d44` |
| `episode-short-privacy-yeonghun.json` | `00e038fa1bf9` |

**지금 이야기 전부 — 저장된 문서를 받아 새 계약으로 · 바꾸기 전 계약 (HEAD 의 `packages/contract/src` 를 스크래치에 풀어)으로 둘 다 돌려 대 봤다 — 결과가 줄마다 같다** (이야기 파일은 전부 0자):

| 이야기 | 꼴 | 새 계약 | 전 계약 |
|---|---|---|---|
| `oil-1` (실제 `/s/oil/1`) | 긴 | 통과 · 알림 0 · 글 101 · 숫자 든 글 54 | 같음 |
| `meta-gallery` (실제 `/short/meta-gallery`) | 옛 짧은 | 통과 · 알림 0 · 글 19 · 숫자 든 글 6 | 같음 |
| `license-notice` (실제 `/short/license-notice`) | 옛 짧은 | 통과 · 알림 0 · 글 19 · 숫자 든 글 4 | 같음 |
| `license-notice-flow` | 새 짧은 | 통과 · 알림 0 · 글 20 · 숫자 든 글 2 | 같음 |
| lab `oil-replot` | 긴 | 통과 · 알림 0 · 글 95 · 숫자 든 글 49 | 같음 |
| lab `oil-replot-b` | 긴 | 통과 · 알림 0 · 글 89 · 숫자 든 글 47 | 같음 |
| (덤) `license-notice-flow-fable` | 새 짧은 | 실패 7 (`STRING_EMPTY` — 비어 있는 Fable 견줌 판) | **같음** — 전부터 실패 · 그 `review.json` 에 `ok: false` 로 적혀 있다 · `--check` 같다 |

**lab `check.ts` 열 · 파이프라인 `--check` 여섯 — 바꾸기 전 (기준)과 바꾼 뒤의 출력이 글자 단위로 같다** (`diff` 빈칸 · 아래 검사). `episode rate-2b` · `rate-3 --check` 둘은 **바꾸기 전에도** 멈춘다 — 저장한 모델 출력이 없다 ("--write-call 을 먼저" · "--design-call 을 먼저") · 모델 API 없이는 못 도는 것이라 뺐다.

## ⑤ 이제 숫자로 바꿀 수 있는 곳 (맨 글자열의 한글 수 — 글은 고치지 않았다)

방법: 이야기마다 맨 글자열 (`string` 칸) 전부를 모양 표로 모아 (oil-1 78 · meta-gallery 22 · oil-replot-b 72) 한글 수가 든 칸을 골랐다. 칸마다 **아라비아 숫자로 바꾼 글을 메모리에서만 넣어 새 계약으로 돌렸고**, 받친 글을 찾아 적었다. 이야기마다 **전부 한꺼번에 바꿔도 받는다.**
"뜻" = 받친 글의 수가 같은 것의 수인가 (계약은 안 본다 — E-35). 바꿀지 · 어떻게 쓸지는 다음 Step (쓰기 — Sonnet)의 일이다.

**lab `oil-replot-b` — 12 칸 (전부 받는다)**

| 칸 | 지금 | 바꾼 글 (예) | 받친 글 (근거 있는 EpisodeText) | 뜻 |
|---|---|---|---|---|
| `scenes.zero.beats[1].head` | 백오십 원을 내리다 | 150원을 내리다 | `zero.beats[1].body` "7차에서 150원을 내려" | 같다 |
| `scenes.zero.beats[2].head` | 그리고 열두 번째 | 그리고 12번째 | `cover.dek` "12차 석유 최고가격" · `zero.beats[2].body` | 같다 |
| `scenes.event.figures[0].who` | 산업부 · 열두 번째 최고가격 (휘발유 리터당) | 산업부 · 12번째 최고가격 … | 같음 (12차) | 같다 |
| `scenes.event.figures[1].who` | 산업부 · 유월에 내다본 주유소 가격 | 산업부 · 6월에 내다본 … | `event.figure_note` "6월에 상한을 1,784원으로" · `zero.beats[1].when` "6월 27일" | 같다 |
| `scenes.event.figures[1].tag` | 유월의 전망 | 6월의 전망 | 같음 | 같다 |
| `scenes.event.quote_label` | 유월 발표에 적힌 문장 | 6월 발표에 적힌 문장 | 같음 | 같다 |
| `scenes.tools.title_new` | 풀기 전에, 도구 둘만 챙겨요 | … 도구 2개만 챙겨요 | `zero.beats[0].body` "2주 동안" · `aha.real[2].body` "2차 시행" | **다르다** — 화면의 도구 수 (우연히 받쳐짐) |
| `scenes.tools.title_follower` | 오늘 새로 필요한 도구는 둘이에요 | … 2개예요 | 같음 | **다르다** (같은 까닭) |
| `scenes.next.line[1].what` | 백오십 원 인하 | 150원 인하 | `zero.beats[1].body` | 같다 |
| `scenes.next.line[2].what` | 열두 번째 값, 동결 | 12번째 값, 동결 | `cover.dek` | 같다 |
| `scenes.next.coming[1].head` | 남은 일 · 사 주의 적용 기간 | 남은 일 · 4주의 적용 기간 | `cover.meta` "4주간 적용" · `aha.real[0].body` | 같다 |
| `scenes.keep.line` | 열두 번째로 그대로 둔 최고가격은 … | 12번째로 그대로 둔 … | `cover.dek` | 같다 |

**실제 `oil-1` — 13 칸 (전부 받는다)**

| 칸 | 지금 | 바꾼 글 (예) | 받친 글 | 뜻 |
|---|---|---|---|---|
| `scenes.zero.beats[2].head` | 백오십 원을 내리다 | 150원을 내리다 | `zero.beats[2].body` "7차에서 150원을 내려" | 같다 |
| `scenes.zero.beats[3].head` | 그리고 열두 번째 | 그리고 12번째 | `cover.dek` "12차" · `zero.beats[3].body` | 같다 |
| `scenes.event.figures[0].who` | 산업부 · 열두 번째 최고가격 (휘발유 리터당) | 산업부 · 12번째 최고가격 … | 같음 | 같다 |
| `scenes.event.figures[1].who` | 산업부 · 유월 일곱 번째 값 때 내다본 주유소 가격 | 산업부 · 6월 7번째 값 때 … | `tools[3].body[2]` "6월 7차 때는" · `zero.beats[2].body` "7차에서" | 같다 |
| `scenes.event.figures[1].tag` | 유월의 전망 | 6월의 전망 | `tools[3].body[2]` · `zero.beats[2].when` "6월 27일" | 같다 |
| `scenes.event.quote_note` | 산업부가 삼월 첫 발표에 적은 문장 … | 산업부가 3월 첫 발표에 … | `zero.title` "상한은 3월에 시작됐고" | 같다 |
| `scenes.tools.title_new` | 풀기 전에, 도구 세 개만 챙겨요 | … 도구 3개만 챙겨요 | `tools[4].body[2]` "분기(3개월)" · `zero.title` "3월" | **다르다** — 화면의 도구 수 |
| `scenes.tools.title_follower` | 오늘 새로 필요한 도구는 셋이에요 | … 3개예요 | 같음 | **다르다** |
| `scenes.next.title` | 사 주 동안은 이 값이에요. … | 4주 동안은 이 값이에요. … | `cover.meta` "4주간 적용" · `zero.beats[2].body` "4주 동안" | 같다 |
| `scenes.next.line[1].what` | 둘째 값, 인상 | 2번째 값, 인상 | `tools[3].body[2]` "2차 시행" · `zero.beats[0].body` | 같다 |
| `scenes.next.line[2].what` | 백오십 원 인하 | 150원 인하 | `zero.beats[2].body` | 같다 |
| `scenes.next.line[3].what` | 열두 번째 값, 동결 | 12번째 값, 동결 | `cover.dek` | 같다 |
| `scenes.next.coming[0].head` | 남은 일 · 사 주의 적용 기간 | 남은 일 · 4주의 적용 기간 | `cover.meta` | 같다 |

**실제 `meta-gallery` — 1 칸 (받는다)**

| 칸 | 지금 | 바꾼 글 (예) | 받친 글 | 뜻 |
|---|---|---|---|---|
| `scenes.cover.title` | 사진 때문에 수억 유로라는데, 사진을 가져간 걸까 | 사진 때문에 8억 유로가 넘는다는데, … | `cover.dek` · `why.verdict` "8억 500만 유로" | 같다 — 다만 "수억"은 정한 수가 아니다 (8억 500만 → "8억"으로 줄일지 · 어떻게 쓸지는 쓰는 일) |

- 합 **26 칸** — oil-replot-b 12 · oil-1 13 · meta-gallery 1. 그 가운데 **화면의 도구 수 4 칸** (oil-replot-b 2 · oil-1 2)은 문서의 수가 아닌데 다른 수 (2주 · 2차 / 3월 · 3개월)가 우연히 받친다 — 계약은 받지만 그대로 한글 ("도구 둘")로 둘지는 쓰는 법 (E-35)
- 한글 수지만 숫자로 바꾸지 않는 게 자연스러운 말 (목록에서 뺐다 — 쓰는 법): "수수께끼 **하나**" · "숫자 **하나**" · "**한** 줄" · "**한** 문장" · "**첫** 발표"
- (덤 — 맨 글자열이 아니라 지금도 숫자를 쓸 수 있던 칸) 글 한 덩이 (EpisodeText) 안의 한글 수 (어림): oil-replot-b 5 (`tools[0].body[1]` · `zero.title` "열두 번째" · `tools[1].short` · `body[0]` "두 번" · `compare.rows[1].a` "두 배") · oil-1 2 (`zero.title` "열두 번째" · `compare.rows[1].a` "두 배") · meta-gallery 3 ("세 가지" · "한 사람" ×2). 이 칸은 숫자를 쓰면 9 가 구절에 댄다 (`src` 에 그 수가 있어야 한다)
- (덤 — 계약 밖) oil-replot-b 의 시안 전용 글 `REPLOT.news` "석유 최고가격, **열두 번째**도 그대로" (`data.ts:17` · `src` 있음)는 lab 검사 R4 가 숫자를 막는다 ("제목 위 한 줄에 숫자가 있다") — ⑥ B-E5-b

## ⑥ _open

| # | 무엇 | 지금 | 다른 길 |
|---|---|---|---|
| E-35 | **맨 글자열의 수는 수만 댄다** — 같은 것의 수인지 안 본다 (머리 "도구 2개"를 본문 "2주"가 받친다 — ⑤ 의 4 칸). 연도 규칙도 그대로라 맨 글자열의 2025 를 본문의 25 (다른 수)가 받칠 수 있다 — 9 와 같은 틈 | 수만 (9 와 같은 함수 · 규칙 하나) | 수 + 단위 (6월 ↔ 6월)까지 — 9 도 같이 바꿔야 한 규칙 (구절은 영어 · 표가 많아 단위가 안 맞는다) · 또는 화면 자체의 수 (도구 · 칸 개수)는 한글로 두라고 **쓰는 법**에 |
| B-E5-a | **파이프라인 프롬프트가 아직 "맨 글자열에는 아라비아 숫자를 쓰지 않는다"** — `episode-prompt.ts:275` (+ `:93` · `:286` · `:287` "숫자 없이") · `short-prompt.ts:95` (+ `:27` · `:43` · `:49`). 그리고 `episode.ts:588` 의 `bare()` 가 이름 칸 (`tools[].name` · `seats.ground.body` · `ghosts[].name`)의 숫자를 코드로 뗀다 (P-E2 — `BARE_DIGIT` 피하기) | 그대로 (지시: 프롬프트는 _open 에만 · 파이프라인은 지금 안 돌린다 — D110) | 파이프라인을 다시 돌릴 때 프롬프트 말을 "본문에 받친 수만"으로 · `bare()` 를 뺄지 (이름 칸은 숫자 없는 편이 낫다는 P-E2 의 판단도 있다) |
| B-E5-b | **lab · 화면 쪽 검사에 "숫자 없음" 규칙이 따로 있다** (계약 밖 · 이 Step 은 안 건드림): `lab/episode/check.ts` S4 (공통 화면 글 · 조종 칸 · 조용히 견본) · `oil-replot-b/check.ts` R4 (맨 위 띠 · burst · 제목 위 한 줄 `REPLOT.news` — `src` 가 있는데도) · `oil-replot/check.ts` (burst 등) · `lab/today/check.ts` T3 · T6 (화면 글) | 그대로 | 공통 화면 글 (chrome)은 근거가 없으니 그대로 숫자 없음이 맞다. 다만 `REPLOT.news` 처럼 구절이 붙은 시안 글은 다음 Step (Sonnet 판을 숫자로)에서 R4 를 "받친 수만"으로 맞춰야 "열두 번째"를 "12번째"로 바꿀 수 있다 |
| B-E5-c | **`BARE_DIGIT` 이 모양에서 멈추지 않는다** — 이제 근거 오류와 함께 난다 (파이프라인 시험 한 줄을 그에 맞춰 고쳤다). 파이프라인의 고치기 단계는 오류를 길 (`path`)로 글 덩이에 붙이므로 `BARE_DIGIT` (맨 글자열 길)은 전처럼 "글 덩이가 아닌 문제"로 사람에게 간다 — 동작 그대로 | 근거와 함께 | 모양 단계로 되돌림 (그러면 받칠 글의 근거 오류를 가린다 — 안 고름) |
| B-E5-d | **DECISIONS 는 건드리지 않았다** — E-35 를 D 번호로 올릴지는 PM | — | — |

---

## 검사 (붙인 그대로 · 2026-11-16)

`pnpm install` (시작 전 — "Already up to date"). 시작 때 contract 150 통과 · lab · 파이프라인 `--check` 기준을 먼저 떠 둠 (`baseline.txt`).

**`pnpm --filter @claro/contract test`**
```
 Test Files  5 passed (5)
      Tests  156 passed (156)
   Start at  13:59:43
   Duration  1.42s (tests 70%, transform 21%, import 8%, worker 1%)
```
(150 → 156: 새 describe "맨 글자열의 숫자 — 근거 있는 글에 같은 수가 있을 때만 (불변식 10 · B-E5)"의 6 · 있던 시험 하나 고침 (2쪽 → 8쪽) · contract-docs 는 그대로 지남 — 타입 블록은 안 건드렸다)

**`pnpm -s typecheck`**
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
typecheck exit=0
```

**`pnpm -s test`** (web e2e 는 제 빌드로 — 끝 `exit 0`)
```
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  Test Files  15 passed (15)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   83 passed (3.3m)
exit 0
```
e2e 가 `logs/frontend/F-2b/` 그림 일곱 (png 6 · webm 1)을 다시 찍었다 → 파일마다 `git checkout -- <파일>` 로 하나씩 되돌림 (`git status` 에 남은 것 없음)

**lab `check.ts` 열 · 파이프라인 `--check` 여섯** — 바꾸기 전 출력 (`baseline.txt`)과 바꾼 뒤 출력 (`after.txt`)을 `diff` → **빈칸 ("같다 (baseline 과 글자 단위로)")**. 바꾼 뒤의 줄:
```
=== lab/episode/check.ts
OK — 숫자가 든 글이 없다
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
=== lab/episode/oil-replot/check.ts
OK — 계약 검증 (구절 · 숫자 · 풀이 칸)을 지났고, 차례 · 답 먼저 금지 · 시안 전용 칸의 검사도 맞다
=== lab/episode/oil-replot-b/check.ts
OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 시안 칸은 실제 화면에서 꺼져 있음
=== lab/episode/rate-3/check.ts
OK — 대기 화면의 글 (숫자는 밝혀 둔 날짜 하나 · 화면 번호뿐)
=== lab/episode/fomc-auto/check.ts
OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다
=== lab/today/check.ts
OK — 짧은 이야기 (계약 검증 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙
=== lab/short/check.ts
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
=== lab/short-a/check.ts
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기 · 줄기는 뉴스 (N1 ~ N3)
=== lab/short-b/check.ts
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
=== lab/play/check.ts
OK — 새 사실 0 · 채점 없음 · 반사실 없음 · 한국 대출 이자 없음 · D61 ③ ④ · 고를 것마다 받는 말 · ★ 칸의 이름 · 실제 화면과 떨어져 있음
=== pipeline episode oil-1 --check
episode oil-1 --check — episode.json · review.json 같다
=== pipeline episode fomc-auto --check
episode fomc-auto --check — episode.json · review.json 같다
=== pipeline episode rate-2b --check
=== pipeline episode rate-3 --check
=== pipeline short license-notice --check
short license-notice --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
=== pipeline short meta-gallery --check
short meta-gallery --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
=== pipeline short-flow license-notice-flow --check
short-flow license-notice-flow --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
=== pipeline short-flow license-notice-flow-fable --check
short-flow license-notice-flow-fable --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
```
(`episode rate-2b --check` · `rate-3 --check` — 바꾸기 전에도 같은 자리에서 멈춤: "Error: --write-call 을 먼저 (claude-fable-5-2)" · "Error: --design-call 을 먼저 (rate-3 · episode-design/2)" — 저장한 모델 출력이 없다 · 모델 API 없이 못 도는 것)

**지금 이야기 전부 — 저장된 문서를 받아 `validateStory`** (스크래치 스크립트 · 새 계약. 전 계약 (HEAD 의 src)으로 돌린 출력과 줄마다 같다)
```
oil-1 (실제 /s/oil/1) — 통과 · 긴 이야기 · 알림 0 · 글 101 · 숫자 든 글 54
meta-gallery (실제 /short/meta-gallery · 옛 짧은 꼴) — 통과 · 옛 짧은 꼴 · 알림 0 · 글 19 · 숫자 든 글 6
license-notice (실제 /short/license-notice · 옛 짧은 꼴) — 통과 · 옛 짧은 꼴 · 알림 0 · 글 19 · 숫자 든 글 4
license-notice-flow (새 짧은 꼴) — 통과 · 새 짧은 꼴 · 알림 0 · 글 20 · 숫자 든 글 2
license-notice-flow-fable (새 짧은 꼴) — 실패 7 ·  · 알림 0
   STRING_EMPTY /voice_labels/official: 비었거나 글자열이 아니다
   STRING_EMPTY /cover/title/t: TextBody 이 비었거나 글자열이 아니다
   STRING_EMPTY /cover/dek/t: TextBody 이 비었거나 글자열이 아니다
   STRING_EMPTY /cover/meta/t: TextBody 이 비었거나 글자열이 아니다
   STRING_EMPTY /cover/ask/t: TextBody 이 비었거나 글자열이 아니다
   STRING_EMPTY /keep/line/t: TextBody 이 비었거나 글자열이 아니다
   STRING_EMPTY /keep/whose/t: TextBody 이 비었거나 글자열이 아니다
lab oil-replot — 통과 · 긴 이야기 · 알림 0 · 글 95 · 숫자 든 글 49
lab oil-replot-b — 통과 · 긴 이야기 · 알림 0 · 글 89 · 숫자 든 글 47
```

**골든 다섯 0자**
```
$ git diff --stat fixtures/episode-*.json
(빈칸)
```

**띄운 서버**: 없음 (e2e 가 띄운 것은 끝나며 닫힘 — `lsof -iTCP -sTCP:LISTEN` 에 node · next 없음). 백그라운드 기다리기 반복 없음.
