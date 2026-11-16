# F-E8 — e2e 를 이야기 목록에서 읽게 (D131 L1-a · D132)

2026-11-16 · 작업 세션 모델: Opus 5.5 · 모델 API 0 · 실제 화면 0 변화 (`apps/web/src` 0 줄 — 바뀐 것은 e2e 둘 · 새 e2e 도우미 둘 · 스킬 문서 줄 둘)

## ① 손으로 박은 곳 — 앞 → 뒤

`e2e/*.spec.ts` 열여덟을 다 봤다. 그날 값에 묶인 곳은 `episode.spec.ts` · `today.spec.ts` 둘뿐이다 (`lab-local.spec.ts` 의 기름값 · 메타는 그 이야기의 미리 보기 시험 · 나머지는 옛 화면 · 기록 · api — 목록을 안 읽는다).

| # | 곳 | 앞 (손으로) | 뒤 (목록에서) |
|---|---|---|---|
| 1 | episode · 읽는 날의 시각 `DAY` | `"2026-11-15T12:00:00+09:00"` · `"2026-11-16T12:00…"` | `noonKst(LIST.day)` · `noonKst(LIST.day, 1)` |
| 2 | episode · 서버가 그린 머리 | `/data-day="2026-11-15"…>11월 15일의 이야기</h1>/` | `data-day="${DAY}"` · `dayTitle(DAY)` (화면의 글 `HOME.titleDay` 에 그날) |
| 3 | episode · 머리 `data-day` | `"2026-11-15"` | `DAY` |
| 4 | episode · 다음 날의 머리 | `"11월 15일의 이야기"` | `dayTitle(DAY)` |
| 5 | episode · 카드 차례 (전부) | 여섯 id 를 손으로 | `[...TOP, ...REST]` (`bundle()`) **+ "목록의 차례 = 화면의 차례"** (`STORIES` 차례) |
| 6 | episode · 그날의 묶음 | `["card-oil-1", "card-meta-gallery"]` | `TOP` |
| 7 | episode · 지난 이야기 | 넷을 손으로 | `REST` (비면 "지난 이야기" 머리도 없음) |
| 8 | episode · 편 수 | `"긴 이야기 하나, 짧은 이야기 하나."` | `HOME.tally` + `countNoun` (`TOP` 의 긴 · 짧은 수) |
| 9 | episode · 맨 위 카드 | `data-lead` 1 개 · `card-oil-1` | `TOP[0]` 이 긴 이야기면 그 카드 1 개 · 짧은 이야기면 0 개 (화면 규칙 그대로) |
| 10 | episode · 카드마다 그림 | `LIVE` + `SHORTS` 의 여섯 | `LIST.all` (지금은 같은 여섯 · 새 카드도 본다) |
| 11 | episode · 이어지는 이야기 | `cont-` 1 개 | `LIST.cont` (`latestPerSeries` + `numbered`) — `cont-rate` 의 글 · track 은 그대로 |
| 12 | episode · `/map` 지도 장 수 | `LIVE.length` (4) | `LIST.maps.length` (`latestPerSeries`) |
| 13 | episode · `/map` 다음 화 개념 수 | `LIVE` 의 손 값 합 | `LIST.maps` 의 합 (`unpromised` 면 0) + `LIVE` 넷의 지도마다 수가 손 값과 같은지 대 봄 |
| 14 | episode · 시험 "11/15 의 두 편 — 새 두 주소" | `"/s/oil/1"` · `"/short/meta-gallery"` | `TOP` 의 주소 · 이름 "가장 새 묶음 (목록에서) — 그날의 새 주소…" |
| 15 | episode · 뉴스 한 줄 카드 | `card-news` 1 개 · `:not(card-oil-1)` | `screen.news` 가 있는 줄 (`LIST.all[].news`) — 수 · 글 그대로 · 나머지 카드 0 (기름값이 그 안에 있는지도) |
| 16 | today · 시안 카드 차례 | 여덟 id 를 손으로 | `LIST.lab.cards` (시안의 `TODAY`) + 뜻 셋: 견본 · 빈 자리를 빼면 실제 목록 차례 · 견본은 `card-pipc` 바로 아래 · 빈 자리는 맨 끝 |
| 17 | today · 개념으로 이어짐 | `li` 1 · `a` 2 | `LIST.lab.concepts` (`sharedConcepts`) + 견본 · 개인정보가 한 묶음 (1) |
| 18 | today · 이어지는 이야기 | `cont-` 1 개 | `LIST.lab.cont` |
| 19 | today · 시안 지도 장 수 | 4 | `LIST.maps.length` |
| 20 | today · 형광펜 검사의 `.td-go` | 늘 있다고 봄 | **맨 위 줄이 긴 이야기일 때만** (큰 카드의 단추) + 단추 수 1 / 0 — ③ 의 임시 줄 시험 1 이 찾았다 (맨 위가 짧은 이야기면 단추가 없어 `getComputedStyle(null)` 로 섰다) |

**그대로 둔 것 (그 이야기를 지키는 시험)**: `LIVE` 넷 (글 · 주소 · 번호 · 꼬리표 · 약속 없음 · 다른 이야기로 가는 길) · `SHORTS` 둘 · 기름값 메운 판 (뉴스 한 줄의 꼴 · 가림 · 문서 문장) · 화면 칸은 기름값에만 (`LIVE.slice(1)`) · 병원 내림 · 옛 번호 링크 · 시안 주소 404 · 금리 2화 시리즈 줄 (`cont-rate` · track 3) · 시안의 색 스위치.
**이름 · 주석**: 시험 이름의 "11/15" 둘을 날짜 없는 이름으로 · 두 파일 머리에 F-E8 줄 (무엇을 목록에서 읽고 무엇을 그대로 두는지).

## ② 목록에서 끌어내는 법

- **`apps/web/e2e/stories-dump.ts`** (tsx 로 돈다 · 시험 파일 아님) — catalog 의 `STORIES` · `bundle()` · `hrefOfLine` · `latestPerSeries()` · `numbered()` · `unpromised()` 와 시안의 `TODAY` · `sharedConcepts()` 를 **그대로 불러** JSON 하나로 낸다 (`day` · `all` · `top` · `rest` · `maps` · `cont` · `lab`). 카드마다 `id` (`card-<code>`) · `kind` · `href` · `day` · `at` (목록의 차례) · `news`. 화면이 쓰는 함수 그대로라 화면과 시험이 규칙을 두 번 짜지 않는다.
- **`apps/web/e2e/stories.ts`** — 그 JSON 을 `LIST` 로 (`execFileSync` · 0.2초) + `noonKst(day, plus)` (그날 · 다음 날의 한낮 한국 시각) · `dayTitle(day)` (`HOME.titleDay` 에 그날을 넣은 것).
- **왜 tsx 를 거치나** — Playwright 의 로더는 catalog 가 읽는 이야기 파일을 못 읽는다. 처음에 바로 import 해 봤다:
  ```
  TypeError: Module "file:///…/GPDP-20261114-META-GALLERY/shorts/meta-gallery/story.json" needs an import attribute of "type: json"
  ```
  catalog 의 import 줄에 `with { type: "json" }` 를 붙이는 것은 catalog 를 고치는 일 (하지 말 것) · `playwright.config.ts` 에 로더 훅을 거는 것은 모든 e2e 에 걸리는 일이라 둘 다 안 했다. 웹서버 명령이 이미 `tsx e2e/setup-db.ts` 를 쓴다 — 같은 도구.
- **뜻은 값으로 다시 본다** (값만 목록에서 · 규칙은 시험이 본다 — 첫 화면 시험 머리):
  - 머리의 날 = 목록에 적힌 날 가운데 가장 늦은 날 · 맨 위 묶음은 다 그날 · 지난 이야기는 그날보다 앞 (날 없는 것 포함) · 지난 이야기는 새 날이 위 · **같은 날이면 목록의 위가 먼저** (묶음 안 · 지난 이야기 안 둘 다)
  - **목록의 차례 = 화면의 차례** — 새 이야기를 목록 맨 위가 아닌 곳에 적으면 선다 (③ 시험 4 로 확인)
  - 그날이면 "오늘의 이야기" · 다음 날이면 날짜 그대로 (시계 고정 둘 — 앞과 같음)

## ③ 임시 줄 시험 (붙인 그대로)

임시 줄은 `catalog.tsx` 의 `STORIES` 맨 위 (시험 4 만 맨 아래). 같은 이야기를 그대로 한 번 더 넣으면 `card-<code>` 가 둘이 되어 그 이야기의 시험이 엄격 모드로 선다 (같은 주소 · 같은 key) — 실제로 일어나지 않는 꼴이라, **지금 이야기 파일을 펼쳐 code · id 만 바꾼 새 이야기**로 했다 (줄 하나에 끝나는 가장 작은 꼴 · 새 파일 0):

```ts
// 1 · 3 · 4 — 짧은 이야기 한 줄
short({ ...metaGallery, episode_id: "00000000-0000-4000-8000-00000000fe0a", code: "fe8-short" }, { place: "해외", category: "기술", day: "2026-11-17" }),
// 2 — 보통의 하루 (새 시리즈 긴 이야기 + 짧은 이야기) — 위 줄 앞에 한 줄 더
long(episodeOf({ ...oil1, episode_id: "00000000-0000-4000-8000-00000000fe08", code: "fe8-1", series: { ...oil1.series, series_id: "00000000-0000-4000-8000-00000000fe09", code: "fe8", name: "임시 주제" } }, ["packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/store.documents.json"]), { place: "국내", category: "돈", day: "2026-11-17", unpromised: true, screen: screenOf(oil1Screen) }),
```

**0 · 지금 목록 (임시 줄 없음)** — `pnpm exec playwright test e2e/episode.spec.ts e2e/today.spec.ts` → `18 passed (44.7s)`

**2 · 새 날 (11/17) 긴 + 짧은 — 고치기 앞 spec 사본도 같이 돌림** (`git show HEAD:…` 를 `_old-*.f-e8.ts` 로 · 임시 설정 — 둘 다 지웠다)
```
$ dump: day 2026-11-17 · top [card-fe8-1, card-fe8-short] · rest [card-oil-1, card-meta-gallery, card-delivery, card-fomc, card-pipc, card-license-notice]
        maps 5 (fe8 0 · oil 0 · price 2 · rate 2 · privacy 2) · news [card-fe8-1, card-oil-1] · lab concepts [[/s/fe8/1, /s/oil/1], [/lab/episode/pipc, /lab/today/short]]
  4 failed
    e2e/_old-episode.f-e8.ts:57:1 › 첫 화면 = 오늘 — … 이야기 여섯 (11/15 의 둘 + 지난 넷 …   (Error: 서버가 그린 머리는 날짜다 · Expected pattern: /<h1[^>]*data-day="2026-11-15"[^>]*>11월 15일의 이야기<\/h1>/)
    e2e/_old-episode.f-e8.ts:193:1 › /s/oil/1 = 메운 판 …                                    (Error: 뉴스 한 줄은 기름값 카드 하나에만 · Expected: 1 · Received: 2)
    e2e/_old-today.f-e8.ts:16:1 › 오늘 — 긴 이야기 셋 …                                       (toEqual — + "card-fe8-1", + "card-fe8-short")
    e2e/_old-today.f-e8.ts:145:1 › 개념 지도 견본 — 주제마다 지도 한 장 (넷)                   (Expected: 4 · Received: 5)
  32 passed (46.1s)          ← 새 spec 18 개 전부 통과 (실패 넷은 다 앞 spec 사본)
```
**1 · 새 날 (11/17) 짧은 이야기 하나 (맨 위가 짧은 이야기)** — 앞 · 새 spec 같이
```
  4 failed
    e2e/_old-episode.f-e8.ts:57:1 › 첫 화면 = 오늘 …     (서버가 그린 머리는 날짜다)
    e2e/_old-today.f-e8.ts:16:1 › 오늘 — 긴 이야기 셋 …   (카드 차례)
    e2e/_old-today.f-e8.ts:56:1 › 색 시안 …               (page.evaluate: TypeError: Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.)
    e2e/today.spec.ts:65:1 › 색 시안 …                    (같은 것 — 새 spec 에서 놓친 곳. 형광펜 검사가 맨 위 큰 카드의 단추 .td-go 를 늘 있다고 봤다 → ① 20 으로 고침)
  32 passed (44.4s)
```
→ 고친 뒤 새 spec 만: **`18 passed (43.5s)`**

**2 다시 (고친 spec 으로)** — **`18 passed (44.3s)`**

**3 · 같은 날 (11/15) 짧은 이야기를 맨 위에 하나 더** — dump: `top [card-fe8-short, card-oil-1, card-meta-gallery]` (맨 위가 짧은 이야기 → 큰 카드 0) → **`18 passed (44.8s)`**

**4 · 거꾸로 — 새 날 (11/17) 줄을 목록 맨 아래에 (틀린 자리)** — 시험이 서야 맞다
```
  ✘   2 e2e/episode.spec.ts:70:1 › 첫 화면 = 오늘 — 종이 톤 · 카드는 목록 그대로 …
    Error: 목록의 차례 = 화면의 차례 (새 이야기는 목록 맨 위에 적는다)
  1 failed
  17 passed (44.5s)
```

**줄을 뺐다** — `git checkout -- apps/web/src/episode/catalog.tsx` (그 파일 하나 · 앞에 `git diff` 로 임시 줄 하나뿐인 것을 봄) → `git diff --stat` 빈 것 · 임시 사본 · 임시 설정 셋 지움 → ④ 의 전체 시험 (지금 목록)이 "줄을 빼고 다시 통과"다.

## ④ 검사 (붙인 그대로)

```
$ pnpm -s typecheck
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm -s test        (exit=0 · 끝부분 · 시험 이름은 줄임)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:       Tests  101 passed (101)
apps/web test:   90 passed (3.4m)
apps/web test:   ✓   5 e2e/episode.spec.ts:70:1 › 첫 화면 = 오늘 — 종이 톤 · 카드는 목록 그대로 …
apps/web test:   ✓  23 e2e/episode.spec.ts:165:1 › 가장 새 묶음 (목록에서) — 그날의 새 주소가 열린다 …
apps/web test:   ✓  24 e2e/episode.spec.ts:219:1 › /s/oil/1 = 메운 판 …
apps/web test:   ✓  72 e2e/today.spec.ts:65:1 › 색 시안 — …
apps/web test:   ✓  79 e2e/today.spec.ts:157:1 › 개념 지도 견본 — 주제마다 지도 한 장 (목록의 주제 수)
  (logs/frontend/F-2b 의 그림 일곱이 다시 찍혀 하나씩 `git checkout -- <파일>`)

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts   (exit=0 · 끝부분)
실제 주소: /s/oil/1 · /short/meta-gallery · /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 2026-11-15 2 편 · 지난 이야기 4 편
번호 화면 규칙 (D88 E-20): oil 번호 없음 (긴 이야기 1화) · price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
OK — 숫자가 든 글이 없다
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
```
e2e 수는 앞과 같다 (90 — 시험을 더하지도 빼지도 않았다). 남은 서버 · 백그라운드 0 (3101 듣는 것 없음).

## 스킬 문서 (`.claude/skills/today-story/SKILL.md`)

- ⑧ 2 — "e2e 가 그날 묶음에 묶인 줄 … 그 값만 고친다" → **e2e 는 그날 값을 목록에서 읽는다 · 고칠 일이 없다 · e2e 를 고치지 않는다 · 그래도 서면 멈춘다** (어느 시험이 왜 섰는지 하루 기록에 붙이고 도윤에게) · 맨 위가 아닌 곳에 적어도 선다.
- "아직 정하지 않은 것" — "e2e 가 그날 묶음에 묶여 있다" 줄을 뺐다 · "2화" 줄에 한마디: 그 시리즈 1화의 이야기별 시험 ("번호 없음" · 다른 이야기로 가는 길)은 목록에서 읽지 않는다 → 2화는 그 시험을 고치는 Step 과 함께.

## ⑤ _open

- **F-E8-a 2화 (같은 시리즈의 둘째)** — 이야기별 시험 (`LIVE` 의 `numbered` 손 값 · 남음의 `other-<시리즈>` · 책장의 `shelf-<시리즈>` 주소)은 목록에서 읽지 않았다 (그 이야기를 지키는 시험). 기름값 2화가 오면 기름값 1화가 "1화"를 보이게 되어 그 시험이 선다 — 맞게 서는 것이다 (화면이 바뀐다). D89 e "한 시리즈 긴 이야기 둘의 길은 3화 때 e2e" 그대로. 스킬의 2화 줄에 적었다.
- **F-E8-b 콘솔 오류 시험의 범위** — "가장 새 묶음 — 새 주소" 시험이 그날의 주소만 본다 (앞의 뜻 그대로). 기름값 · 메타가 지난 이야기로 내려가면: 기름값은 메운 판 시험 · 긴 셋은 화면 칸 시험이 콘솔 오류를 계속 보지만, **짧은 이야기 (메타 · 면허)의 콘솔 오류는 아무 시험도 안 본다** (면허는 앞에서도 안 봤다). 목록의 모든 주소로 넓히는 것은 뜻을 넓히는 일이라 안 했다 — 하려면 그 시험의 `TOP` 을 `LIST.all` 로 (주소 넷 더 · 몇 초).
- **F-E8-c 시안 `/lab/today` 의 편 수 글이 "오늘은 undefined 편이에요."** — 지금 빌드에 그대로 있다 (`.next-test/server/app/lab/today.html` 에서 봄). 시안 `lab/today/copy.ts` 의 `COUNT_WORD` 가 다섯까지인데 시안 이야기가 일곱 (실제 여섯 + 견본 병원)이다 — F-E5 에서 두 편이 들어온 때부터. 시안만 (실제 첫 화면은 `home-copy.ts` 의 `countWord` 가 숫자로 떨어진다) · 범위 밖이라 안 고쳤다.
- **F-E8-d 날짜 머리 글을 짜는 몇 줄이 둘** — 화면 (`app/page.tsx` 의 `dayTitle` — export 안 됨)과 시험 (`e2e/stories.ts` 의 `dayTitle`). 둘 다 `HOME.titleDay` 를 쓰지만 m · d 를 떼는 줄은 두 번이다. `page.tsx` 를 건드리지 않으려고 둘로 뒀다 (함수를 `home-copy.ts` 로 옮기면 하나가 된다 — 화면 파일을 고치는 일).
- **F-E8-e `day` 가 하나도 없는 목록** — 화면은 "최근 이야기"로 떨어지지만 시험은 "목록에 낸 날이 적힌 이야기가 있다"에서 선다 (앞에서도 그 길은 시험하지 않았다). 지금 목록에서 일어날 일은 아니다.
- **F-E8-f 도우미가 시안 데이터를 읽는다** — `stories-dump.ts` 가 `app/lab/today/data.ts` (시안의 `TODAY`)를 부른다. 시안을 지우거나 옮기면 같이.
