# logs/backend · B-E3 — 짧은 이야기 · 번호 없는 이야기를 계약으로 (D80 · D86)

## B-E3 · 2026-11-14 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음. push = 배포는 검사가 다 지난 뒤 한 번.
같은 때 돈 S-2 (`3881b79`) · PM D87 (`a89ccb4`)이 내 작업 중에 커밋됐다 — 그 파일 (`packages/pipeline/src/collect*` · `data/collect/` · `logs/pipeline/S-2*` · `docs/development-pipeline.md` · DECISIONS · PM.md) 0줄.
**고친 곳**: `docs/contract/EPISODE.md` · `packages/contract/src/episode.ts` · `validate-episode.ts` · `index.ts` · `test/episode.test.ts` · 골든 넷째 `fixtures/episode-short-privacy-yeonghun.json` (새) · 위반 4 `fixtures/invalid/episode-short-*.json` (새) ·
lab 의 짧은 이야기 (`apps/web/src/app/lab/today/short/data.ts` · `Short.tsx` · `page.tsx` 주석 · `types.ts` 지움 · `lab/today/data.ts` · `page.tsx` · `check.ts`) · 이 로그 · `docs/development-backend.md` B-E3 줄.
**안 건드린 것 (0줄 — `git diff HEAD` 로 확인)**: 긴 이야기 골든 셋 · 다른 계약 파일 (ARTICLE_PACKAGE · DATA_MODEL · CONCEPT_IDENTITY · OBSERVATION) · packages/pipeline · packages/db · 실제 주소 (`/` · `/s/*` · `apps/web/src/episode/`) · e2e · DECISIONS.

**한 줄 답**: 짧은 이야기는 **따로 선 타입 `ShortStory`** — 장면 넷 · 시리즈에 놓이되 번호 · 시리즈 줄 칸이 없다 (선반) · 같은 사건의 긴 이야기를 `sibling` 으로 · 그 이야기의 도구 카드를 `tools_from` 으로 가리킨다 · 풀이는 입구 + 뒤집기만 (`why: "short"`).
긴 이야기 (`Episode`)는 고를 수 있는 칸 `weight?: "long"` 하나만 더했다 — 칸이 없으면 긴 이야기라 골든 셋이 한 글자도 안 바뀌고 지나고, 실제 주소 · 파이프라인이 읽는 `number` · `track` 은 그대로다.

---

## ① 더한 칸 — 모양 · 까닭 · 실물 대응

| UX-7 ③ (lab `types.ts` 「모자람」) | 계약 (EPISODE §1 · §13) | 까닭 |
|---|---|---|
| 1 짧은 조립 — 장면 넷 | `ShortStory.scenes: ShortScenes { cover, where, why, keep }` · `ShortSceneId` · 조립 칸 없음 (차례 고정) | 실물 그대로. 긴 이야기의 장면 칸은 없다 — 넣으면 `SCHEMA_KEY`. 다른 장면 수는 미확인 |
| 2 무게 | `StoryWeight = "long" \| "short"` · ShortStory `weight: "short"` (필수) · Episode `weight?: "long"` (없으면 긴 이야기) | 골든 셋 0자 · `validateStory` 가 `weight` 로 가른다 · TS 에서 `s.weight === "short"` 로 좁혀진다 (F-E2) |
| 3 번호 없는 이야기 (선반) | ShortStory 는 `series: Series` 만 — `number` · `track` · `previous` 칸이 없다 | 같은 Series 모양 (Episode 와 같은 칸 이름 — 오늘 화면이 `series_id` 하나로 묶는다). 넣으면 `SCHEMA_KEY` |
| 4 같은 사건의 곁 이야기 | `sibling: Sibling { episode: EpisodeRef, label, note }` | `previous` (시간이 흐른 앞 화)와 뜻이 다르다. code 가 아니라 그 판 (UUID + 판) — 가리킨 카드의 글이 그 판의 것이어야 짧은 이야기가 통째로 불변 |
| 5 다른 이야기의 도구 가리키기 | `tools_from: ToolsFrom { episode: EpisodeRef, keys: ToolKey[] }` · `tools` · `pickup` · `map` 칸 없음 | 글을 새로 쓰지 않는다 (글자 그대로 · 비용 0). 실물은 `tools_from.episode` = `sibling.episode` 인데 묶지 않았다 — 도구는 다른 사건의 이야기에서도 올 수 있다 (D79 ②) |
| 6 체험이 없는 까닭 = 무게 | `NoLabWhy` 에 `"short"` · `solve: ShortSolve { entry: SolveEntry, plain: PlainFlip }` (체험 칸 없음) | lab 은 `why: null` 로 `PLAIN_WHY` 하나에 걸렸다 (check.ts T5). 이제 짧은 이야기의 까닭은 `short` · 긴 이야기는 `short` 를 못 쓴다 |

**왜 Episode 를 넓히지 않고 따로 세웠나 (§13.1 · _open E-22)**
- 실물에서 겹치는 것은 글과 근거 (§4) · 입구 (§7.1) · 뒤집기만 (§7.7) · RealItem 뿐 — 이것은 같은 타입을 그대로 쓴다 (다시 정의 0). 뼈대 (장면 · 번호 · 도구의 자리 · 지도 · 조립)는 다 다르다 (UX-7 ③ 의 결론 그대로)
- Episode 를 고를 수 있는 칸투성이로 만들면 긴 이야기의 불변식 (장면 여덟 · 조립 · 시리즈 줄 · 줍는 자리)마다 "짧지 않으면"이 붙고 빠진 칸이 안 걸린다
- 실제 주소 (`/s/<시리즈>/<번호>` — `catalog.tsx`) · 파이프라인 (`prev.number + 1`) · 시안 · e2e 가 `number` · `track` · `scenes.zero` 를 그대로 읽는다 — 그 코드를 0줄로 두려면 Episode 칸을 바꾸면 안 된다

**옮기며 고친 셋 (§13.8 · _open E-23)** — lab `shelf {series_id, code, name}` → `series` (Series 통째로 · `sub` 는 긴 이야기 골든의 값 — 짧은 이야기 화면에는 안 보인다) · `scenes.cover.weight_label` ("짧은 이야기") → 계약에서 빼 화면의 글로 (`weight` 에서 나오는 이름 · lab 은 `SHORT_CHROME.weightLabel`) · `sibling.code` · `tools_from.episode` (code `pipc`) → EpisodeRef.

**검증기**: `validateShortStory(이야기, { documents, episodes })` · `parseShortStory` · `validateStory` (weight 로 가름) · `solveProblems` 에 네째 인자 `weight` (기본 `"long"` — 부르는 곳 0줄 바뀜). 모양 검사 (`shapeProblems`) · 근거 검사 (`groundProblems` — 3 · 8 · 4 · 9)를 긴 이야기와 함께 쓰게 함수로 뺐다 — 긴 이야기의 결과 · 차례는 같다 (기존 시험 121 그대로 지남).

## ② 번호 규칙 · 미확인

- **짧은 이야기에는 번호가 없다** (칸이 없다). 같은 발표의 곁 이야기는 "2화"가 아니다 (UX-7 ⑤ 4 · D86 "추천대로")
- **긴 이야기는 칸 그대로 `number ≥ 1`.** 화면이 번호 · 시리즈 줄 · 지난 이야기를 보이는 것은 `number ≥ 2` 일 때뿐이다 (UX-7 오늘 화면의 규칙 — 실물). `number` 1 은 주제 이름만. **화면의 규칙 — 검증기가 보지 않는다.** 그래서 지금 "번호 없는 이야기"는 두 꼴: 짧은 이야기 (칸 없음) · 1화인 긴 이야기 (칸은 1 · 화면이 숨김 — 배달앱 · 개인정보)
- **미확인 (칸을 만들지 않았다 · _open E-20)**: ① 첫 이야기가 나중에 "1화"가 되는 일 — 둘째가 생기면 첫 이야기의 판이 오르나 (번호 · 줄을 단 새 판) / 화면만 바뀌나 (카탈로그가 둘째를 보고 "1화"를 단다). 첫 이야기가 짧은 이야기일 때도 같은 물음 ② 번호 칸이 없는 긴 이야기 (새 시리즈의 첫 긴 이야기가 "1화" 글 · 시리즈 줄 · "다음 화"를 싣지 않는 꼴) ③ 1화인 긴 이야기의 화면 안쪽 ("1화" · 0화 장면 머리 · "다음 화" 예고 — UX7-b) — 화면 (F-E2)이 정한다
- 실물 없는 것 — **칸을 만들지 않았다** (§13.7): 덧붙임 (후속 문서 한 줄) · 개념 이야기 (1차 문서 없는 큰 뉴스 → 개념으로) · 홀로 선 짧은 이야기 (곁 이야기 없음 — _open E-21) · 번호 있는 짧은 이야기 · 짧은 이야기의 작은 체험 · 세 칸 / 조용히 (사람이 숨진 사건은 짧은 이야기로 못 낸다 — `DEATH_NOT_QUIET`) · 다른 장면 수 · 짧은 이야기끼리의 곁 이야기 · 개념 라이브러리를 바로 가리키기

## ③ 골든 넷째 · 구절 대조 결과

`fixtures/episode-short-privacy-yeonghun.json` — 「병원이 털렸다는데, 어디가 털린 걸까」 · code `pipc-hospital` · `episode_id` `2d13e9bf-…` 발급 · 판 1 · 곁 이야기 = 도구의 이야기 = 「내 정보는 누가 지키나」 1화 (`pipc` `07e9819c-…` 1판) · 도구 `safety` · `fine` · `order`.
만든 법: lab `data.ts` 의 `SHORT` 를 그대로 JSON 으로 덤프 (tsx) → 칸의 이름과 자리만 옮김 (scratchpad 의 파이썬 — 글자는 손대지 않음). 그다음 lab 이 이 골든을 읽게 바꿨다 (아래 ⑤).

**글 0자 대조** (lab 덤프 ↔ 골든 — 글자열 잎 전부 · 개수까지):
```
lab 글자열 131 · 골든 글자열 133 · 같은 것 128
  lab 에만: ['.sibling.code', '.tools_from.episode'] 'pipc' 2                       ← EpisodeRef 로
  lab 에만: ['.scenes.cover.weight_label'] '짧은 이야기' 1                          ← 화면의 글로 (E-23)
  골든에만: ['.episode_id'] '2d13e9bf-a9b0-458f-ae8f-faf4aa5a645a' 1                ← 발급
  골든에만: ['.weight', '.solve.plain.why'] 'short' 1                               ← why null → short
  골든에만: ['.series.sub'] '털린 곳과 벌, 그리고 지킬 의무' 1                       ← Series 통째로 (긴 이야기 골든의 값)
  골든에만: ['.sibling.episode.episode_id', '.tools_from.episode.episode_id'] '07e9819c-2740-4b63-8add-1946bf22cb73' 2
글 덩이 (t · src · calc · ui · voice 까지 통째로) lab 18 · 골든 18 · 자리 옮겨 같은 것 18
lab 이 읽는 SHORT (바꾼 뒤) == 골든 (_source 뺀 것): True
```
독자가 읽는 글 · 구절 · 숫자 차이 0. 다른 것은 위 여섯 (칸 · 가리키는 값)뿐이다.

**구절 다시 대조** — check.ts 와 따로, 파이썬으로 git 의 `PIPC-20261028-SAFETY-MEASURES/store.documents.json` 에 댔다 (`git ls-files` 로 git 에 있는 파일인지부터):
```
문서 9b054485-d71c-49ac-93b4-41599be9fa74 · sha256(text)=같음 · https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq=248613&chrClsCd=   (개인정보 보호법)
문서 ae47d854-a6af-4378-90d3-f51f1a8dcfbd · sha256(text)=같음 · https://pipc.go.kr/np/cmm/fms/FileDown.do?atchFileId=FILE_00    (개인정보위 보도자료 PDF — 문서 안 공공누리 제1유형 · D70)
  ✓ pr.when (글자 그대로)            ✓ pr.decide (빈칸 · 줄바꿈만 다름)   ✓ pr.judge (빈칸 · 줄바꿈만 다름)     ✓ pr.yh.head (글자 그대로)
  ✓ pr.yh.hack (빈칸 · 줄바꿈만 다름) ✓ pr.yh.signup (빈칸 · 줄바꿈만 다름) ✓ pr.yh.order (빈칸 · 줄바꿈만 다름) ✓ pr.need (빈칸 · 줄바꿈만 다름)
  ✓ pr.table.yh (빈칸 · 줄바꿈만 다름) ✓ law.9 (글자 그대로)              ✓ pr.yh.nofw (빈칸 · 줄바꿈만 다름)  ✓ pr.yh.pw (빈칸 · 줄바꿈만 다름)
  ✓ pr.salt (글자 그대로)            ✓ pr.sqli (글자 그대로)             ✓ pr.who (글자 그대로)             ✓ pr.mean.path (빈칸 · 줄바꿈만 다름)
  ✓ pr.mean.habit (빈칸 · 줄바꿈만 다름) ✓ pr.need2 (빈칸 · 줄바꿈만 다름)
구절 18 · 맞음 18 (글자 그대로 6) · 틀림 0
```
(빈칸 · 줄바꿈만 다른 12 는 PDF 에서 뽑은 글의 줄바꿈 — 계약 불변식 8 과 같은 대조다.) 계약 검증도 같은 결과: 구절 18 · 문서 2 · 글 18 · 숫자가 든 글 3 (전부 근거 구절 안의 수 · 계산 · 화면 번호 0) · 경고 0 (문서 + 곁 이야기를 받아).

## ④ 불변식 · 위반

| # | 불변식 | 코드 | 위반 픽스처 (골든 넷째 + 하나) |
|---|---|---|---|
| 27 | 무게 — 짧은 이야기의 체험 없는 까닭은 `short` · 긴 이야기는 `short` 를 못 쓴다 | `PLAIN_WHY` | `episode-short-why-not-weight` (null — lab 꼴 그대로) · 긴 쪽은 시험 (금리 2화 체험 뺌 + short · 배달앱 체험 있는데 short) |
| 28 | 짧은 이야기에 번호 · 시리즈 줄 · 체험 · 장면 넷 밖의 장면 칸이 없다 (모양) | `SCHEMA_KEY` | `episode-short-numbered` (2화 + 시리즈 줄) · `episode-short-eight-scenes` (긴 이야기의 장면 여섯을 더함) · `episode-short-with-lab` (대교 넘겨 보기를 붙임) |
| 29 | 다른 이야기를 가리키기 — 도구 하나 이상 · 겹침 없음 · 판 ≥ 1 · 자신이 아니다 · 받으면 같은 사건 · 도구가 거기 | `REF_TOOL` · `ID_RANGE` · `SIBLING_MISMATCH` | 픽스처 없이 (시험 — 받아야 보는 것이 반이다 · `PREV_MISMATCH` 와 같은 방식) |

- 짧은 이야기에 그대로 걸리는 것: 1 · 2 (판) · 3 · 4 · 8 · 9 · 10 · 11 · 13 · 14 — 시험: 뒤집기 없음 → `NO_FLIP` · 깨는 사실 구절 뗌 → `BREAKER_SRC` · 사망 → `DEATH_NOT_QUIET` + `DEATH_WHY` (짧은 이야기로 못 낸다)
- 알림 둘 더: `SIBLING_NOT_CHECKED` · `TOOLS_FROM_NOT_CHECKED` (가리킨 긴 이야기를 안 주면)
- 회차 위반 픽스처 41 → **45** (전부 `WRITE_EPISODE_INVALID=1` 로 표에서 씀 — 기존 41 파일은 바이트 그대로 · `git status` 에 M 0). contract 시험 121 → **132**

## ⑤ 긴 이야기 골든이 그대로인가 · lab 을 계약 타입으로

- **골든 셋 0자**: `git rev-parse HEAD:<파일>` = `git hash-object <파일>` — price-1 `b2514cd869b9` · rate-2 `28feb2c4a656` · privacy-1 `98c421e01c91` (셋 다 diff 0줄). 시험의 통계 · 경고 그대로 (배달앱 39 · 94 / 금리 41 · 129 · SEAT_WHY_NOT_YET / 개인정보 44 · 105)
- **lab 짧은 이야기가 계약 타입을 쓰게 바꿨다 (판단)** — 한 타입은 한 곳에 (lab 의 `ShortStory` 와 계약의 `ShortStory` 가 둘이 되면 안 된다 · B-E1 이 회차 시안에 한 것과 같다). `short/data.ts` = `parseShortStory(골든, { episodes: [PIPC] })` + 시안 전용 (문서 파일 자리 · 화면의 글) · `types.ts` 지움 · `Short.tsx` 는 칸 자리만 (`S.shelf` → `S.series` · `S.entry` / `S.plain` → `S.solve.*` · `weight_label` → 화면의 글) · `lab/today/data.ts` · `page.tsx` 두 줄 · `check.ts` 는 T1 (git) · T3 (화면 글) · T4 (그리지 않을 것) 만 남기고 이야기 쪽을 계약 검증 (T5 — 경고 없이 지나야 한다)으로 옮겼다
- **화면 그림 0 차이** — 바꾸기 전 (`867c9da` + S-2 미커밋 · `next build` → `.next-be3-before`)과 뒤 (`.next-be3-after`)를 같은 스크립트로 찍어 픽셀로 댔다 (390×844 · 2배 · 움직임 줄임). 종이 · 안개 × (오늘 4 · 짧은 이야기 표지 2 · 어디가 2 · 어디가 근거 시트 3 · 문서가 말한 것 2 · 도구 펼침 · 근거 켬 · 근거 시트 5 · 남음 2 · 지도) = 46 장. 같은 서버를 두 번 찍어 46/46 같음을 먼저 확인했다 (찍기가 흔들리지 않는다)
```
before 46 · after 46
같음 46 · 다름 0
```
  미리 지은 쪽의 보이는 글 (HTML 에서 태그를 걷은 글)도 댔다: `/` · `/s/price/1` · `/s/rate/2` · `/s/privacy/1` · `/lab/today` · `/lab/today/short` · `/lab/episode/pipc` · `/archive/fomc-2026-09` — 8 다 같음. 그림 · 스크립트 · 빌드 폴더는 scratchpad · `.next-be3-*` (git 밖 · 끝에 지움)

## ⑥ F-E2 (실제 `/` 를 "오늘"로) 가 쓸 것

- **읽기**: 짧은 이야기 = `parseShortStory(골든, { documents, episodes })` (빌드 때 경고 없이 — lab check T5 처럼) · 긴 이야기와 섞인 목록이면 `validateStory` · TS `Story = Episode | ShortStory` 를 `weight === "short"` 로 가른다 (긴 이야기 골든은 칸이 없다 — `undefined` 면 긴 이야기)
- **카드**: 무게로 꼴을 가른다 (짧은 이야기 = 얇은 카드 · 체험 없음). 읽는 시간은 내지 않는다 (D82). 시리즈 (선반)는 둘 다 `series` — 오늘 화면의 "아직 한 편인 주제"는 `series.series_id` (code)로 긴 · 짧은 이야기를 묶는다
- **번호**: `number ≥ 2` 인 긴 이야기에만 "N화" · 시리즈 줄 · 지난 이야기 30초 (UX-7 규칙 그대로 — 계약은 칸만). 짧은 이야기는 번호 칸이 없다. **1화인 긴 이야기의 화면 안쪽** (표지 `cover.episode` "1화" · `track` · `scenes.zero.kicker` "0화 · …" · `scenes.event.kicker` "1화 · 오늘의 사건" · `map.where_today` "1화에서 주움" · 남음의 "다음 화" 예고)은 골든의 글이다 — 숨길지 · 어떻게 보일지는 F-E2 가 정한다 (UX7-b · _open E-20). 번호 글은 전부 `ui: true` 라 골라낼 수 있다
- **주소**: 실제 주소 `/s/<시리즈 code>/<번호>` 는 번호가 없는 짧은 이야기에 안 맞는다 — 짧은 이야기의 `code` ("pipc-hospital" · 유일 · 불변)로 새 길 (F-E2 가 정함). `episode_id` 는 회차와 한 이름 공간이다
- **곁 이야기**: `sibling.episode` (UUID + 판) → 카탈로그에서 그 긴 이야기의 실제 주소 (지금은 `/s/privacy/1`). 길 위의 글은 `sibling.label` · `note` + 그 이야기의 표지 제목. 거꾸로 (긴 이야기 → 곁의 짧은 이야기)는 계약에 칸이 없다 — 카탈로그가 짧은 이야기들의 `sibling` 을 읽는다
- **도구 · 지도**: `tools_from` 의 카드를 가리킨 이야기의 `tools` 에서 꺼내 **접어서** (펼치면 그 카드 글 그대로) · 근거 시트는 카드 글의 구절을 가리킨 이야기의 `quotes` 에서 · 지도는 가리킨 이야기의 `map` 에 만난 도구만 켬 (`where_today` 는 화면의 글 "짧은 이야기에서 만남") — 시안 `lab/today/short/Short.tsx` 가 그대로 본보기 (kit 부품만 씀)
- **화면의 글 (계약 밖)**: 무게의 이름 "짧은 이야기" (표지 번호 자리 · 위 띠) · "이렇게 생각하기 쉬워요" · "긴 이야기와 같은 도구" 등 — lab `SHORT_CHROME`
- **아직 없는 것**: 발행 시각 칸 ("오늘"의 경계 · 차례 — F-E1-c · UX7-h 그대로 미확인) · 독자 기록 (D64)
- (P-S1 몫 — 짧은 이야기를 파이프라인이 낼 때) 사람이 정하는 칸: 무게 · 곁 이야기 · 뒤집기가 진짜인가 · 그리지 않을 것 (§8). 홀로 선 짧은 이야기 (곁 이야기 · 가리킬 도구가 없는)는 지금 계약으로 못 낸다 — E-21 을 먼저

## ⑦ _open

| # | 무엇 | 지금 | 다른 길 |
|---|---|---|---|
| E-20 | **번호** — 첫 이야기가 나중에 "1화"가 되는 일 (판이 오르나 · 화면만 바뀌나) · 번호 칸 없는 긴 이야기 | 칸 그대로 (긴 = `number ≥ 1` · 짧은 = 칸 없음) · 보이는 것은 화면 규칙 `number ≥ 2` | 긴 이야기의 `number` · `track` 을 고를 수 있게 — 실제 주소 · 파이프라인 · 시안이 함께 바뀐다 (둘째가 실제로 생길 때 — 3화가 첫 기회는 아니다: 금리는 이미 2화) |
| E-21 | **`sibling` · `tools_from` 필수** — 실물이 곁 이야기가 있는 하나 | 필수 | `\| null` — 홀로 선 짧은 이야기 (S-1 의 짧은 이야기 대부분 · 도구 · 지도 · 남음 장면을 함께). **P-S1 전에 정해야 한다** |
| E-22 | 짧은 이야기를 따로 선 타입으로 (Episode 를 넓히지 않음) | `ShortStory` + Episode `weight?` | Episode 하나에 무게로 가르는 고를 수 있는 칸들 |
| E-23 | 옮기며 고친 셋 — `shelf` → `series` (Series 통째로 · `sub` 더해짐) · `weight_label` → 화면의 글 · code → EpisodeRef | 그렇게 했다 | lab 그대로 |
| B-E3-a | lab `types.ts` (「모자람 1 ~ 6」 주석)를 지웠다 — 한 타입은 한 곳에. 그 표는 `logs/frontend/UX-7.md` ③ · git 기록 · EPISODE §13 표에 남는다 | 지움 | 주석만 남긴 파일로 |
| B-E3-b | **DECISIONS 는 건드리지 않았다** — D80 을 닫는 것 · E-20 / E-21 을 D 번호로 올릴지는 PM 게이트 | — | E-20 · E-21 을 OPEN 으로 |
| B-E3-c | `solveProblems` 에 네째 인자 `weight` (기본 long) — 부르는 곳 (시안 check 둘) 0줄 · 파이프라인은 부르지 않는다 | 더함 | 짧은 이야기용 함수를 따로 |

---

## 검사 (붙인 그대로)

```
$ pnpm -s typecheck
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
exit 0

$ pnpm --filter @claro/contract test
 Test Files  5 passed (5)
      Tests  132 passed (132)          ← 121 + 11 (골든 넷째 셋 · 위반 넷 · 픽스처 없이 넷)
 ✓ 골든 > 짧은 이야기 (영훈) — 통과 · 가리킨 긴 이야기를 받으면 경고 없음 · 장면 넷 · 번호 · 시리즈 줄 · 체험 칸 없음 · 까닭 = 무게 (B-E3)
 ✓ 골든 > 짧은 이야기 — 가리킨 긴 이야기를 주지 않으면 같은 사건 · 도구를 보지 않고 그렇다고 알린다
 ✓ 골든 > 이야기 하나 (validateStory) — weight 가 short 면 짧은 이야기, 칸이 없거나 long 이면 긴 이야기
 ✓ 위반은 거부한다 > episode-short-numbered.json · episode-short-eight-scenes.json · episode-short-with-lab.json · episode-short-why-not-weight.json
 ✓ 픽스처 없이 > 무게 — 긴 이야기가 체험이 없는 까닭을 무게(short)라고 적음 → PLAIN_WHY · 체험이 있는데 short → PLAIN_WHY
 ✓ 픽스처 없이 > 짧은 이야기 — 가리킨 도구가 그 이야기에 없음 · 없음 · 겹침 → REF_TOOL (받았을 때만 · 안 받으면 알림)
 ✓ 픽스처 없이 > 짧은 이야기 — 곁 이야기가 다른 사건 → SIBLING_MISMATCH (받았을 때만) · 가리킨 이야기가 자신 · 판 0 → ID_RANGE
 ✓ 픽스처 없이 > 짧은 이야기 — 입구의 규칙은 그대로: 뒤집기 없음 → NO_FLIP · 깨는 사실에 구절 없음 → BREAKER_SRC · 사람이 숨진 사건 → 조용히가 아니라 거부
 (contract-docs — EPISODE.md 의 타입 블록 ↔ src/episode.ts 칸 목록 · 이름 붙인 식 (StoryWeight · ShortSceneId · NoLabWhy) 도 지남)

$ pnpm -s test
packages/contract test:       Tests  132 passed (132)
packages/pipeline test:       Tests  144 passed (144)
packages/db test:             Tests  101 passed (101)
apps/web test:   68 passed (3.1m)        ← today.spec 6 포함 ("짧은 이야기 — 장면 넷 · 번호 없음 · 근거를 누르면 원문 구절 · 지도에 도구 셋 · 긴 이야기로 가는 길" 지남)
exit 0
(e2e 가 다시 찍은 logs/frontend/F-2b 일곱 (png 6 · webm 1) 은 하나씩 git checkout -- <파일> 로 되돌렸다)

$ pnpm --filter @claro/web exec tsx src/app/lab/today/check.ts
■ 짧은 이야기 — 병원이 털렸다는데, 어디가 털린 걸까 (pipc-hospital · 골든 넷째 · 계약 ShortStory)
  계약 검증 OK (경고 0) — 구절 18 (문서 2 — 전부 git 의 store.documents.json) · 글 18 — 숫자가 든 글 3 · 맨 글자열 (그리지 않을 것 검사) 22
  무게 short · 장면 4 · 번호 없음 (선반: 내 정보는 누가 지키나) · 체험 없음 (까닭 short) · 뒤집기 A ≠ B · 다시 만나는 도구 safety · fine · order (긴 이야기 pipc 1판의 카드 그대로)
■ 오늘 — 카드
  긴 이야기  누가 값을 정하나 (주제 이름만 — 번호 없음) · 체험 있음 → /lab/episode
  긴 이야기  금리는 어디로 · 2화 (이어지는 이야기 — 번호 · 시리즈 줄 · 지난 이야기) · 체험 있음 → /lab/episode/fomc
  긴 이야기  내 정보는 누가 지키나 (주제 이름만 — 번호 없음) · 체험 있음 → /lab/episode/pipc
  짧은 이야기 내 정보는 누가 지키나 (주제 이름만 — 번호 없음) · 체험 없음 → /lab/today/short
  개념으로 이어짐: 과징금 · 시정명령 · 안전조치의무 — 해킹은 당한 건데, 왜 회사가 벌을 받을까 ↔ 병원이 털렸다는데, 어디가 털린 걸까
■ 색 시안 … (그대로 — 종이 · 미색 · 쑥 · 형광펜 · 신문 · 안개 · 밤 전부 AA · 규칙 지남)
■ 덮는 규칙
  OK overrides.css 가 최신이다 (규칙 44)
OK — 짧은 이야기 (계약 검증 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙
exit 0

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
… OK — 회차 3 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
exit 0
(fomc-auto/check.ts · rate-3/check.ts 도 OK — 검증기를 함수로 나눈 뒤 파이프라인 회차 · 기다리는 화면도 그대로)

골든 셋 0자 — git rev-parse HEAD:<파일> = git hash-object <파일>
fixtures/episode-price-1.json   b2514cd869b9 = b2514cd869b9 · diff 0줄
fixtures/episode-rate-2.json    28feb2c4a656 = 28feb2c4a656 · diff 0줄
fixtures/episode-privacy-1.json 98c421e01c91 = 98c421e01c91 · diff 0줄
git diff HEAD --stat -- fixtures/ (골든) · 다른 계약 넷 · packages/pipeline · packages/db · apps/web/src/episode · apps/web/src/app/page.tsx · apps/web/src/app/s → 0줄

짧은 이야기 화면 — 바꾸기 전 · 뒤 (next build 둘) 그림 46 장 픽셀 대조
before 46 · after 46
같음 46 · 다름 0
미리 지은 HTML 의 보이는 글 — / · /s/price/1 · /s/rate/2 · /s/privacy/1 · /lab/today · /lab/today/short · /lab/episode/pipc · /archive/fomc-2026-09 → 8 다 같음
```
띄운 서버 (3221 · 3222 — 대조용 next start)는 껐다. 빌드 폴더 `.next-be3-before` · `.next-be3-after` 는 지웠다. 그림 · 덤프 · 대조 스크립트는 scratchpad (git 밖).
