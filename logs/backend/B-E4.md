# logs/backend · B-E4 — 짧은 이야기 새 꼴을 계약으로 (D95 · D98 · D99 ①)

## B-E4 · 2026-11-15 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음 · 비밀 (키 · .env) 출력 0. 같은 때 돈 다른 세션 없음.
**고친 곳**: `docs/contract/EPISODE.md` (CHANGELOG · 머리 · §0 · §1 · §4.3 · §8 · §9 · §10 · §11 · **§14 새 절**) · `packages/contract/src/episode.ts` · `validate-episode.ts` · `index.ts` · `test/episode.test.ts` ·
골든 다섯째 `fixtures/episode-short-obesity-who.json` (새) · 위반 7 `fixtures/invalid/episode-flow-*.json` (새) · lab `apps/web/src/app/lab/short-b/data.ts` (골든을 읽게) · 이 로그 · `docs/development-backend.md` B-E4 줄.
**안 건드린 것 (0줄 · 0자 — `git diff HEAD` · `git hash-object` 로 확인 · 아래 ②)**: 옛 꼴 `ShortStory` 의 칸 · 골든 넷 (긴 셋 · 짧은 넷째) · `license-notice` · 옛 꼴을 읽는 코드 (web `src/episode/*` · `app/short/[code]` · `lab/today/*` · pipeline `short*.ts`) · 다른 계약 파일 · packages/pipeline · packages/db · e2e · lab 의 다른 견본 (`lab/short` · `lab/short-a` — 대 보기만) · `docs/development-pipeline.md` · `docs/development-frontend.md` · DECISIONS.

**한 줄 답**: 짧은 이야기 새 꼴 = **따로 선 타입 `FlowStory`** — 표지 (제목 · 한 줄 · 날 · 물음 단추 하나 — 넷 다 글 한 덩이) + **흐름 = 덩이의 차례** (`p` · `cite` · `flip` · `pick` · 뼈는 글 문단의 표시 `beat`) + 남음 (한 줄 · 제 낱말 · 누구의 말) + 그리지 않을 것.
옛 꼴과는 **`form: "flow"` 칸 하나로** 가른다 (무게는 둘 다 `short` · 옛 꼴에는 칸이 없다) — `validateStory` 가 세 꼴을 가르고, 옛 꼴을 읽는 코드는 0줄이다. 선반 · 번호 · 곁 이야기 · 다른 이야기의 도구 · 풀이 · 카테고리 · 사망 칸은 만들지 않았다 (실물에 없다 · D91 ① · 카테고리는 카탈로그).
골든 = B (글 0자 · 구절 12/12 다시 대조) · **견본 셋 (B · A · UX-8)을 계약이 다 받는다** · 불변식 31 ~ 36 (여섯) · 위반 7.

---

## ① 새 꼴 한눈에 — 모양 · 까닭 · 대응 표

```
FlowStory { episode_id · episode_version · code · event_ref · weight: "short" · form: "flow" · docs · quotes · voice_labels (§4 그대로)
            cover: FlowCover { title · dek · meta · ask }                       ← 넷 다 EpisodeText
            flow:  FlowBlock[]  = FlowPara { kind "p", beat: FlowBeat | null, text }
                                | FlowCite { kind "cite", label, text }          ← 구절 안의 글 그대로 (35)
                                | FlowFlip { kind "flip", label, a, op "≠"|"=", b, note }   ← 정확히 하나 (33)
                                | FlowPick { kind "pick", ask, options: FlowOption { key, label, reply }[] }   ← 없거나 하나 (34)
            keep:  FlowKeep { line_label · line · words_label · words: FlowWord { key · name · short · body }[] · whose }
            not_drawn: Note[] }
FlowBeat = "first_thought" | "breaker" | "name" | "land"     (뒤집기 · 고르기는 덩이 자체가 표시)
```

**까닭 (판단마다)**

| 판단 | 까닭 | _open |
|---|---|---|
| 옛 `ShortStory` 를 고치지 않고 새 타입을 옆에 | 옛 꼴을 읽는 코드가 실제 주소에 떠 있다 (`/short/license-notice`) — D99 "옆에 세우고 → 쓰고 → 갈아 끼우고 → 내린다". 겹치는 것은 §4 (글과 근거)뿐 — 그대로 씀 (다시 정의 0) | E-26 |
| 가르는 칸 `form: "flow"` (새 꼴에만 · 필수) | 무게가 둘 다 `short` 라 하나 더 필요. 옛 꼴에 칸을 더하지 않아야 옛 골든 · `license-notice` 0자 (긴 이야기의 `weight?` 와 같은 방식). `validateStory` 는 `form` 칸이 **있으면** 새 꼴로 본다 (값이 틀려도 새 꼴의 모양이 거부 — 알아듣기 쉬운 오류) | E-26 |
| 표지 넷 · 뒤집기 두 말 · 고르기 (물음 · 고를 것 · 받는 말) · 남는 한 줄이 전부 `EpisodeText` | 숫자가 주인공인 이야기 (UX-8 ⑦ 5) — 맨 글자열이면 숫자 금지 (10). lab 꼴도 단추만 빼고 이렇게 썼고, A 는 단추의 숫자 (30 ~ 40) 때문에 꼴 밖 `ASK_SRC` 를 지었다 → 단추도 글 한 덩이 | E-30 |
| 뼈의 표시는 글 문단 (`p`)에만 · 뒤집기 · 고르기는 덩이 자체 | lab 의 `flip` · `pick` 덩이의 `beat` 는 늘 같은 값 ("flip" · "try") — 같은 것을 두 번 적지 않는다 (E-9). `cite` 에 표시를 단 실물 없음 → 칸 없음 | E-31 |
| 없으면 뺀 칸 (lab 의 `beat?`) → `null` 을 적는다 | 이 계약의 방식 (§12) | — |
| 제 낱말 `FlowWord` (지도 · 줍는 장면 · `basis` 없음) | 실물 셋이 제 낱말 둘씩. 옛 꼴은 다른 이야기의 카드를 가리키기만 (E-24 — 홀로 서면 낱말을 둘 데가 없었다) · 낱말 → 개념 지도는 미확인 (UX-8 ⑧ 4) | §10 |
| 선반 · 곁 이야기 · 다른 이야기의 도구 칸 없음 | 실물에 없다 (D24). 곁 이야기는 D91 ① "한 사건 = 이야기 하나". 선반은 P-S1 이 지어내야 했던 칸 (UX-8 ⑦ 2) — 나중에 `?` 로 더하면 골든을 안 깬다 | E-28 |
| 풀이 · 장면 칸 없음 | 입구 → 흐름 속 표시 · 뒤집기만 → `flip` 덩이 · `why.real[]` · `keep.advice` · `where.unknown` 이 보고서 꼴의 뿌리 (UX-8 ⑥ ⑦) | — |
| **카테고리 — 카탈로그에 (이야기에 칸 없음)** | ① 긴 이야기 · 옛 꼴과 한 곳 (`catalog.tsx` `category` — "계약에 칸이 없다") ② 이야기는 통째로 불변인데 카테고리는 낸 뒤 다시 매기는 값 (D89 ④ 배달앱 기술 → 생활) ③ 다섯이 MVP 판 (D86 — 고칠 수 있다) — 닫힌 값을 계약에 박으면 바꿀 때마다 계약이 바뀐다 ④ 꼬리표 · 낸 날과 함께 아침 고르기의 값 (D89 b) | E-27 |
| 사망 칸 없음 | 실물에 없다 · 새 꼴은 "조용히"를 못 낸다 → 사람이 숨진 사건은 새 꼴로 안 낸다 (D61 ④ · D86 부고 · 재난 안 다룸 — 아침 고르기가 거른다). 옛 꼴의 기계 가드 (`death` 필수)가 없어진 것 — PM 판단 | E-29 |
| 남음의 이름표 둘을 이야기에 | 견본 셋이 같은 글이지만 옛 꼴 이름표 (`advice_label` · `real_label`)와 같은 자리 | E-34 |
| §4.3 `calc` 의 키도 숫자 토막으로 | 셋 다 `calc { "27.9": "35.4 − 7.5 …" }` (10년 전 값 — 그래프 그림에만) — 검증기가 키를 글자 그대로 대서 글의 27 이 근거 없음으로 걸렸다. 글은 숫자 토막으로 읽는데 키만 글자 그대로였다 → 키도 토막으로. 골든 넷은 정수 키뿐이라 결과 같음 (시험 135 → 그대로 통과) | E-32 |

**lab 꼴 (`lab/short/types.ts` `LightStory`) → 계약**

| lab | 계약 | |
|---|---|---|
| `code` · `weight` · `docs` · `quotes` · `voice_labels` · `keep` (+ `Word`) · `not_drawn` | 같다 (`Word` → `FlowWord`) | + `episode_id` 발급 · 판 1 · `form: "flow"` |
| `event_code` "KDCA-20261109-OBESITY" | `event_ref` `8a74dbc0-…` (그 사건의 `store.json` Event) | |
| `category` "과학과 몸" | — | 카탈로그 (E-27) |
| `cover { title, dek, meta: T, ask: string }` | `FlowCover` — `ask` 도 `{ t }` | E-30 |
| `Block` `p` (`beat?`) · `cite` (`beat?`) · `flip` (`beat: "flip"`) · `pick` (`beat: "try"`) | `FlowPara` (`beat \| null`) · `FlowCite` (표시 없음) · `FlowFlip` · `FlowPick` (+ `FlowOption`) | E-31 |
| `Beat` 여섯 | `FlowBeat` 넷 (+ 덩이 둘) | `Beat` 이름은 긴 이야기의 연표 칸 (`ZeroScene.beats`)이 이미 쓴다 — 그래서 `Flow*` 앞머리 |

**UX-8 ⑦ 안 맞음 일곱 → 계약**

| # | 옛 꼴 | 새 꼴 |
|---|---|---|
| 1 | 장면 넷 고정 · 칸 전부 필수 | 장면 없음 — 표지 + 흐름 (덩이의 차례 — 수 · 종류는 글이 정함) + 남음 |
| 2 | 선반 필수 | 칸 없음 · 카테고리는 카탈로그 |
| 3 | 체험 칸 없음 | 고르기 덩이 — 없거나 하나 · 둘 중 고름 · 받는 말에 구절 (34) |
| 4 | 도구는 가리키기만 | 제 낱말 — 흐름에서 굵게 이름 붙어야 (36) |
| 5 | 제목 · 뒤집기 · 단추 · 한 줄이 맨 글자열 (숫자 금지) | 전부 글 한 덩이 — 숫자에 근거 (9) |
| 6 | 당부 · `where.unknown` 필수 | 칸 없음 — 없다는 말은 누구의 말 안에 (사람) |
| 7 | 입구 칸 (`solve.entry`) | 흐름 속 표시 `beat` + 뒤집기 · 고르기 덩이 — 11 · 14 → 11 · 32 · 33 |

## ② 옛 꼴과 함께 서는 법 — 가르는 칸 · 닿은 코드

| `weight` | `form` | 꼴 | 검증 |
|---|---|---|---|
| 없음 · `"long"` | — | 긴 이야기 Episode | `validateEpisode` |
| `"short"` | 없음 | 옛 꼴 ShortStory (장면 넷 · §13) | `validateShortStory` |
| `"short"` | 있음 | 새 꼴 FlowStory (§14) | `validateFlowStory` |

- TS: `Story = Episode | ShortStory | FlowStory` · `StoryValidation` 에 `FlowStoryValidation` (`{ ok, story, warnings, stats }`). 둘 다 contract 밖에서 쓰는 곳 0 (grep — `validateStory` · `Story` · `StoryValidation` 은 contract 의 시험만 쓴다) → 넓혀도 닿는 코드 0
- **옛 꼴을 읽는 코드 0줄** — `git diff --stat HEAD -- packages/pipeline apps/web/src/episode apps/web/src/app/short apps/web/src/app/lab/today packages/db` 빔. 골든 넷 · `license-notice` 의 git 해시 그대로:
```
fixtures/episode-price-1.json                 HEAD b2514cd869b9 · 지금 b2514cd869b9
fixtures/episode-rate-2.json                  HEAD 28feb2c4a656 · 지금 28feb2c4a656
fixtures/episode-privacy-1.json               HEAD 98c421e01c91 · 지금 98c421e01c91
fixtures/episode-short-privacy-yeonghun.json  HEAD 00e038fa1bf9 · 지금 00e038fa1bf9
…/license-notice/story.json                   HEAD 4e14b15de549 · 지금 4e14b15de549
```
- 계약 코드에서 바뀐 옛 동작은 **하나** — §4.3 `calc` 키 읽기 (`groundProblems` 의 `calcRuns`). 긴 이야기 · 옛 꼴 골든 넷 · `license-notice` · 위반 46 의 결과가 같다 (시험 그대로 통과 · 위반 파일 바이트 그대로 — `git status` 에 M 0)
- 실제 주소의 보이는 글이 같다 (아래 ③ 의 빌드 앞 · 뒤 대조 — `/` · `/short/license-notice` · `/s/*` · `/map` …)

## ③ 골든 · 구절 대조 · 견본 셋을 받나 · lab 이 골든을 읽게

**골든 다섯째** `fixtures/episode-short-obesity-who.json` — code `obesity-who` · `episode_id` `7de8de13-9a46-4012-8201-956da65adc42` 발급 · 판 1 · `event_ref` = `KDCA-20261109-OBESITY/store.json` 의 Event `8a74dbc0-cb10-4219-9636-9f6783aa2975`.
만든 법: lab `short-b/data.ts` @ `f352901` 의 `LIGHT` 를 tsx 로 JSON 덤프 → 파이썬으로 칸의 이름과 자리만 옮김 (scratchpad `to_flow.py` — 글자는 손대지 않음 · lab 의 칸이 남거나 모르는 칸이 있으면 멈추게 assert).

**글 0자 대조** (lab 덤프 ↔ 골든 — 글자열 잎 전부 · 개수까지):
```
lab 글자열 140 · 골든 글자열 139 · 같은 것 136
  lab 에만: ['.event_code'] 'KDCA-20261109-OBESITY' 1                ← event_ref (UUID)
  lab 에만: ['.category'] '과학과 몸' 1                               ← 카탈로그의 값 (E-27)
  lab 에만: ['.flow[5].kind', '.flow[5].beat'] 'flip' 1               ← 뒤집기 덩이의 beat (늘 같은 값 — E-31)
  lab 에만: ['.flow[6].beat'] 'try' 1                                 ← 고르기 덩이의 beat
  골든에만: ['.episode_id'] '7de8de13-9a46-4012-8201-956da65adc42' 1   ← 발급
  골든에만: ['.event_ref'] '8a74dbc0-cb10-4219-9636-9f6783aa2975' 1
  골든에만: ['.form'] 'flow' 1                                        ← 가르는 칸
글 덩이 (t · src · calc · voice 통째로) lab 24 · 골든 25 · 같은 것 24
  골든에만 덩이: {"t": "그 한 명이 누구냐고요?"}                        ← 표지 단추 (lab 은 맨 글자열 — 글자는 같다)
읽는 차례의 글 36 · 36 — 차례까지 같음: True
구절 같음: True · 문서 같음: True · 누구의 말 꼬리표 같음: True · 그리지 않을 것 같음: True
뼈 (lab):   first_thought → breaker → name → flip → try → land
뼈 (골든):  first_thought → breaker → name → flip → try → land
```
독자가 읽는 글 · 구절 · 숫자 차이 0. 다른 것은 위 일곱 (칸 · 가리키는 값)뿐.

**구절 다시 대조** — 계약 검증과 따로, 파이썬으로 git 의 `KDCA-20261109-OBESITY/store.documents.json` 에 (`git ls-files --error-unmatch` 로 git 에 있는 파일인지부터):
```
문서 PR-1109 2332a609-e0a7-425b-879e-052d206ad5b1 · 글 6580자 · sha256(text)=bd1432b4eea4
  ✓ pr.when (글자 그대로)   ✓ pr.title (글자 그대로)   ✓ pr.head (글자 그대로)
  ✓ pr.what (빈칸 · 줄바꿈만 다름)   ✓ pr.survey (글자 그대로)   ✓ pr.def (빈칸 · 줄바꿈만 다름)
  ✓ pr.trend (빈칸 · 줄바꿈만 다름)   ✓ pr.sex (빈칸 · 줄바꿈만 다름)   ✓ pr.men (빈칸 · 줄바꿈만 다름)
  ✓ pr.women (빈칸 · 줄바꿈만 다름)   ✓ pr.table.name (글자 그대로)   ✓ pr.rates (글자 그대로)
구절 12 · 맞음 12 (글자 그대로 6) · 틀림 0
문서의 문장 flow[2] — 구절 ['pr.men'] 안에 그대로: True · 문서 안에 그대로: True
```
계약 검증 (`validateFlowStory` · 문서를 받아): 통과 · 경고 0 · 구절 12 · 문서 1 · 글 25 · 숫자가 든 글 18 · 계산 2 (27.9) · 덩이 9 · 고르기 1 · 낱말 2.

**견본 셋을 받나** — A · UX-8 도 같은 `to_flow.py` 로 옮겨 (scratchpad · 커밋하지 않음) 문서를 받아 대 봄:
```
■ B (골든) — 통과 · 경고 0 · 글 25 · 숫자 18 · 덩이 9  · 뼈 first_thought → breaker → name → flip → try → land
■ A        — 통과 · 경고 0 · 글 27 · 숫자 21 · 덩이 11 · 뼈 first_thought → try → breaker → name → flip → land
■ UX-8     — 통과 · 경고 0 · 글 28 · 숫자 21 · 덩이 12 · 뼈 first_thought → breaker → name → name → flip → try → land → land
(셋 다 validateStory 도 새 꼴로 가른다)
```
- **처음 대 봤을 때는 셋 다 거부** — `NUMBER_UNGROUNDED` 27 (B 3 · A 1 · UX-8 8 — UX-8 은 54.8 의 54 · 8 도). 원인은 계약이 좁았던 것: `calc` 키 "27.9" 를 글자 그대로 대서 글의 숫자 토막 27 과 안 맞았다 → §4.3 키도 토막으로 (E-32). 견본이 어긋난 것이 아니다 (lab 검사 L4 는 키를 토막으로 읽었다)
- **A 의 표지 단추** (30 ~ 40): lab 꼴이 맨 글자열이라 A 가 꼴 밖 `ASK_SRC = ["pr.men"]` 에 근거를 적었다 → `cover.ask.src` 로 옮겨 통과. 옮기지 않으면 `NUMBER_UNGROUNDED` · 맨 글자열로 두면 `BARE_DIGIT` — **계약이 좁았던 것** (lab 꼴의 좁음을 A 가 꼴 밖으로 메웠다) → 단추를 글 한 덩이로 (E-30)
- A 의 고르기 자리 (첫 생각 바로 뒤)는 B · UX-8 과 다르다 → 고르기의 자리를 걸지 않고 "첫 생각 뒤 · 첫 내려앉기 앞" 만 (불변식 32)
- **UX-8 (개념 강의가 된 판 · D95)도 통과한다** — 꼴이 줄기를 못 본다는 실물. 계약 §14.6 ① 에 사람 게이트의 일로 적었다

**lab `/lab/short-b` 가 골든을 읽게 바꿨다 (판단)** — 한 이야기의 글이 두 곳 (lab `data.ts` · 골든)에 있으면 갈라진다. B-E3 이 병원 짧은 이야기에 한 것과 같다.
`short-b/data.ts` = `parseFlowStory(골든)` → lab 꼴로 되돌림 (`toBlock` — 칸의 이름 · 자리만) + 시안 전용 (카테고리 · 사건 이름 · 문서 파일 · 화면 글 · 견줘 읽기 — 끝의 셋은 바이트 그대로). `Light.tsx` · `check.ts` · `page.tsx` · `lab/short/types.ts` 0줄.
```
lab 꼴 LIGHT — 바꾸기 전 (f352901 의 data.ts 덤프) 8145자 · 뒤 (골든 → lab 꼴) 8145자 · 글자 단위로 같음 (칸의 차례까지): true
```
**그림 0 차이** — 바꾸기 전 (`next build` → `.next-be4-before`)과 뒤 (`.next-be4-after`)를 따로 띄워 (3211 · 3212) `short-b/shots.ts` 로 같은 열 장을 찍어 픽셀로 댐 (PIL RGBA · `ImageChops.difference`). 같은 서버를 두 번 찍어 흔들리지 않음을 먼저 확인:
```
같은 서버 두 번 (흔들림 확인): 10 장 · 같음 10 · 다름 0
앞 (f352901 의 data.ts) ↔ 뒤 (골든을 읽는 data.ts): 10 장 · 같음 10 · 다름 0
찍은 것: 1-cover · 2-story-first-thought · 3-story-cite-name · 4-story-flip · 5-story-pick-before · 6-story-pick-after · 7-story-land-oneline · 8-story-words-whose · 9-compare · 10-source-sheet
```
두 빌드의 보이는 글 (HTML 에서 script · style · 태그를 걷은 글)도 댐:
```
/                        앞 200 · 뒤 200 · 보이는 글 1154자 · 같음 True
/short/license-notice    앞 200 · 뒤 200 · 보이는 글 273자 · 같음 True
/s/privacy/1             앞 200 · 뒤 200 · 보이는 글 274자 · 같음 True
/s/rate/2                앞 200 · 뒤 200 · 보이는 글 307자 · 같음 True
/s/price/1               앞 200 · 뒤 200 · 보이는 글 246자 · 같음 True
/lab/today               앞 200 · 뒤 200 · 보이는 글 1402자 · 같음 True
/lab/today/short         앞 200 · 뒤 200 · 보이는 글 313자 · 같음 True
/lab/short               앞 200 · 뒤 200 · 보이는 글 241자 · 같음 True
/lab/short-a             앞 200 · 뒤 200 · 보이는 글 269자 · 같음 True
/lab/short-b             앞 200 · 뒤 200 · 보이는 글 241자 · 같음 True
/map                     앞 200 · 뒤 200 · 보이는 글 349자 · 같음 True
```
서버 둘은 찍은 뒤 껐다 (`lsof -ti tcp:3211,3212` 빔) · 빌드 폴더 둘 지움 · 그림은 scratchpad (git 밖).

## ④ 불변식 · 위반 픽스처 짝

| # | 불변식 (실물 셋에서) | 코드 | 위반 픽스처 (골든 다섯째 + 하나) |
|---|---|---|---|
| 31 | 새 꼴에는 장면 · 선반 · 번호 · 곁 이야기 · 가리킨 도구 · 풀이 · 체험 · 카테고리 · 사망 칸이 없다 (모양) | `SCHEMA_KEY` | `episode-flow-with-scenes` (병원 짧은 이야기의 장면 넷을 더 실음) |
| 32 | 뼈의 차례 — 첫 덩이 첫 생각 · 끝 덩이 내려앉기 · 첫 생각 하나 · 깨는 사실 하나 · 이름 ≥ 1 · 첫 생각 → 깨는 사실 → 이름 → 뒤집기 → 내려앉기 · 고르기는 첫 생각 뒤 · 첫 내려앉기 앞 | `FLOW_ORDER` | `episode-flow-flip-before-name` (뒤집기를 이름 붙이기 앞에) |
| 33 | 뒤집기 정확히 하나 · 뒤쪽 말에 구절 | `FLOW_FLIP` | `episode-flow-no-flip` |
| 34 | 고르기 없거나 하나 · 고를 것 둘 · key 겹침 없음 · 받는 말마다 구절 | `FLOW_PICK` | `episode-flow-two-picks` |
| 35 | 문서의 문장은 근거 구절 안의 글 그대로 · 구절이 있다 | `CITE_VERBATIM` | `episode-flow-cite-not-verbatim` (관청 말을 다듬어 적음 — 수는 구절에 다 있어 숫자 검사는 지남) |
| 36 | 낱말 key 겹침 없음 · 낱말마다 흐름의 문단에서 굵게 이름 붙음 (끝 괄호 떼고) | `FLOW_WORD` | `episode-flow-word-unnamed` (`**비만율**` 굵게를 뗌) |
| 9 (그대로) | 글의 숫자는 구절 · calc (키도 토막) · ui | `NUMBER_UNGROUNDED` | `episode-flow-flip-number-ungrounded` (뒤집기 말에 3명 중 2명) |
| 11 (그대로) | 깨는 사실 (`beat: breaker`)에 구절 | `BREAKER_SRC` | 픽스처 없이 (시험) |

- 새 꼴이 그대로 받는 것: 1 · 2 (판) · 3 · 4 · 8 · 9 · 10 · 11. **크기 (문단 · 문장 · 글자 · 낱말 수 · 받는 말 길이)는 불변식이 아니다** — §14.8 (UX-8 ⑥ 12 · lab L6 · L8 · P-S2 · 사람). **줄기는 뉴스인가는 기계가 못 본다** — §14.6 ① · §8 표
- 픽스처 없이 보는 것 (시험 7 개 · 고친 곳마다 그 코드만 걸리게 — 구절을 떼면 숫자가 같이 걸리는 둘은 밝혀 둠): 첫 덩이가 첫 생각 아님 · 끝 덩이가 내려앉기 아님 · 깨는 사실 둘 · 이름 없음 · 내려앉기가 뒤집기 앞 · 고르기가 내려앉기 뒤 → `FLOW_ORDER` / A 의 자리 (첫 생각 바로 뒤) · 고르기 없음 → 통과 / 깨는 사실 구절 없음 → `BREAKER_SRC` · 뒤쪽 말 구절 없음 · 뒤집기 둘 → `FLOW_FLIP` / 받는 말 구절 없음 (+ 숫자) · 고를 것 셋 · key 겹침 → `FLOW_PICK` / 문서의 문장 구절 없음 (+ 숫자) → `CITE_VERBATIM` · 낱말 key 겹침 · 괄호까지 적고 굵게 없음 → `FLOW_WORD` / 선반 · 곁 이야기 · 풀이 · 카테고리 · 사망 · cite 에 표시 → `SCHEMA_KEY` · 글 문단에 `beat: "flip"` · `op "→"` · 모르는 덩이 `list` → `SCHEMA_TYPE` · 문서 문장 이름표에 숫자 → `BARE_DIGIT` · `not_drawn` 뺌 → `SCHEMA_MISSING` / `calc` "27.9" 를 빼면 `NUMBER_UNGROUNDED` · 골든 넷 그대로
- 세 꼴 가르기: 새 꼴에서 `form` 뺌 → 옛 꼴로 읽혀 `SCHEMA_KEY` + `SCHEMA_MISSING` · 옛 꼴에 `form` 담 → 새 꼴로 읽혀 같은 둘 · `form: "scenes"` → `SCHEMA_TYPE`
- 회차 위반 픽스처 46 → **53** (`WRITE_EPISODE_INVALID=1` 로 표에서 씀 — 기존 46 파일 바이트 그대로 · `git status` 에 M 0) · contract 시험 135 → **150**

## ⑤ P-S2 (파이프라인)가 낼 것 — 칸마다 누가

| 칸 | 누가 | 메모 |
|---|---|---|
| `episode_id` · `episode_version` · `code` · `event_ref` · `weight` · `form` | 코드 (사람 입력의 code · 사건) | P-S1 의 `uuidFrom` 그대로 |
| `docs` | 코드 + 사람 입력 (어느 문서 · 보일 이름) | git 에 전문이 있는 문서만 (권리 — D70) |
| `quotes` | **코드** — 저장된 문서를 끊은 토막 (P-S1 그대로 · 모델이 구절을 쓰지 않는다) | 글이 가리킨 것만 싣는다 |
| `voice_labels` | 코드 (화면 말) + 기관 이름 (`official` — "질병관리청의 발표") | |
| `cover.title` · `dek` · `meta` · `ask` | 모델 (글 — 덩이마다 근거 키) | 단추는 하나 · 첫 생각이 그 물음을 받는다 |
| `flow` — 덩이의 수 · 종류 · 차례 · 글 · `beat` · 근거 키 | **모델** — 칸 마흔 채우기가 아니라 "차례 있는 덩이의 목록" (UX-8 ⑥ 파이프라인으로 옮길 때) | `validateFlowStory` 가 차례 (32) · 뒤집기 (33) · 고르기 (34) · 낱말 (36) · 숫자를 기계로 본다 → 고치기 고리에 넣을 수 있다 |
| `cite.text` | 모델이 구절 키 + 어느 문장인지 고르고 **코드가 구절에서 글자를 옮기는 편이 안전** (제안) | 모델이 옮겨 적으면 35 에 걸린다 — 프롬프트의 일 |
| 화면 말 (`flip.label` "뒤집어 보면" · `cite.label` "<기관> 발표문에서" · `line_label` · `words_label`) | 코드 (견본 셋과 같은 글) | E-34 |
| `pick` (물음 · 고를 것 둘 · 받는 말) | 모델 | 채점하지 않기 · 가지마다 길이 맞춤 = 쓰는 법 · 사람 (B 의 받는 말은 "아니에요 / 맞아요"로 시작 — _open B-E4-a) |
| `keep.line` · `keep.whose` · `keep.words` | 모델 | 한 줄은 뉴스에 대한 것 (D95 ③) · 낱말은 흐름에서 굵게 이름 붙인 것만 (36) · 1 ~ 2 는 쓰는 법 |
| `not_drawn` | 모델 제안 → **사람** | §8 |
| 함의 (글의 뜻이 구절에서 나오나) | 모델 (Opus low) → 사람 | **앞 덩이를 같이 준다** (PS1-d · D99 ②) — 덩이가 차례로 있으니 앞 덩이를 붙이기 쉽다 |
| 무게 · 꼴 · 카테고리 · 국내/해외 · 낸 날 | **사람** (아침 고르기 · D86) → `catalog.tsx` | 이야기에 칸 없음 (카테고리 — E-27) |
| 사람 게이트 | **사람** | 맞나 + 술술 + **무엇에 대한 이야기인가 (줄기는 뉴스 — D95 ④)** · 사람이 숨진 사건은 새 꼴로 안 낸다 (E-29) |

계약 쪽에서 P-S2 에 줄 것: `validateFlowStory(이야기, { documents })` (`short-validate.ts` 가 지금 `validateShortStory` 를 부르듯) · `FlowStory` 타입 · 골든 다섯째를 본보기로 (본보기가 하나면 주제를 베낀다 — UX-8 ⑥ · A 를 다른 결의 견본으로 같이 줄 수 있다 · 셋 다 같은 뉴스라는 점은 그대로 약점).

## ⑥ D99 ④ (갈아 끼우기)에서 지울 것 — 옛 꼴

- **계약** (`packages/contract` · EPISODE.md): `ShortStory` · `Sibling` · `ToolsFrom` · `ShortScenes` · `ShortCoverScene` · `ShortWhereScene` · `ShortWhyScene` · `ShortKeepScene` · `ShortSolve` · `ShortSceneId` / `SHORT_SCENE_IDS` · `NoLabWhy` 의 `"short"` (쓸 곳이 없어진다 — 지울지 판단) · `validateShortStory` · `parseShortStory` · `shortRefProblems` · `ShortStoryStats` · `ShortStoryValidation` · `solveProblems` 의 넷째 인자 `weight` · `EpisodeContext.episodes` · 코드 `SIBLING_MISMATCH` · `SHORT_ALONE` · 알림 `SIBLING_NOT_CHECKED` · `TOOLS_FROM_NOT_CHECKED` · `validateStory` 의 옛 갈래 · `Story` 의 `ShortStory` · EPISODE §13 전부 · 불변식 27 ~ 30 · §8 의 옛 꼴 줄 셋 · §10 의 옛 꼴 줄 · _open E-21 ~ E-25 (E-20 은 긴 이야기 쪽이 남는다) · **이름 정리** (`FlowStory` → `ShortStory` · `form` 을 남기나 — E-26)
- **픽스처 · 시험**: 골든 넷째 `fixtures/episode-short-privacy-yeonghun.json` · 위반 5 (`episode-short-numbered` · `-eight-scenes` · `-with-lab` · `-why-not-weight` · `-alone-tool-text`) · `test/episode.test.ts` 의 옛 꼴 묶음 (SHORT · `episodes` 를 받는 시험 · `license-notice` 실물 시험)
- **화면** (`apps/web`): `episode/kit/Short.tsx` (장면 넷 — lab `Light.tsx` 를 kit 으로) · `episode/Screen.tsx` 의 짧은 이야기 (`sibling` · `tools_from` → `longByRef`) · `episode/catalog.tsx` 의 `ShortData` · `short()` (`parseShortStory`) · `episode/today/cards.tsx` · `app/short/[code]/page.tsx` 의 `story.series.name` (새 꼴은 선반이 없다 → 카테고리) · `episode/today/concepts.ts` (`tools_from` 으로 개념 잇기 — 새 꼴은 제 낱말 · 지도 길은 미확인) · `episode/kit/Episode.tsx` 의 곁 짧은 이야기 찾기 · `episode/kit/chrome.ts` 의 `SHORT_CHROME` (장면 넷의 글) · e2e (`episode.spec.ts` · `today.spec.ts` 의 짧은 이야기 장면 넷 · `card-pipc-hospital`)
- **lab**: `/lab/today/short` (병원 — D99 ④ "내림") · `lab/today/short/data.ts` 의 `HOSPITAL` · `lab/today/data.ts` · `page.tsx` 의 그 줄 · `lab/today/check.ts` T5 · `lab/short/types.ts` (`LightStory` — 계약에 `FlowStory` 가 생겼다 · kit 이 계약 타입을 바로 그리면 한 타입은 한 곳에) · `lab/short-b/data.ts` 의 되돌리기 (`toBlock`) · 견본 `lab/short` · `lab/short-a` 의 data (남길지 — 파이프라인 본보기로 쓸지)
- **파이프라인**: `short-prompt.ts` 의 옛 꼴 (`CELLS` · 장면 넷) · `short.ts` 의 ShortStory 짓기 · `short-validate.ts` (→ `validateFlowStory`) · `test/short.test.ts` · `license-notice` (새 꼴로 다시 쓰거나 내림 — D91 · D99 ③)

## ⑦ _open

| # | 무엇 | 지금 | 다른 길 |
|---|---|---|---|
| E-26 | 새 타입 `FlowStory` + `form: "flow"` (옛 꼴 그대로) | 그렇게 함 | 옛 `ShortStory` 를 바꾼다 (D99 가 막은 길) · 이름 정리는 D99 ④ |
| E-27 | **카테고리를 카탈로그에** (이야기에 칸 없음) | 카탈로그 | `category: Category` 닫힌 값 다섯 (lab 꼴 그대로 — 그러면 두 곳) |
| E-28 | 선반 · 곁 이야기 · 다른 이야기의 도구 칸 없음 | 없음 | `\| null` 로 (옛 꼴처럼) |
| E-29 | **사망 칸 없음** — 옛 꼴의 기계 가드가 빠졌다 (아침 고르기 · 사람 게이트가 맡는다) | 없음 | `death: boolean` 필수 + 참이면 거부 |
| E-30 | 표지 단추를 글 한 덩이로 (A 의 숫자) | `EpisodeText` | `string` (A 가 못 들어온다) |
| E-31 | 뼈 표시는 `p` 에만 · `cite` 에 표시 칸 없음 | 그렇게 함 | lab 그대로 (넷 다 `beat?`) |
| E-32 | **§4.3 `calc` 키를 숫자 토막으로** (긴 이야기 · 옛 꼴에도 — 규칙 하나) | 그렇게 함 · 골든 넷 결과 같음 | 새 꼴의 골든 키를 "27"로 (근거 시트의 글이 바뀐다 — 안 됨) |
| E-33 | 고를 것 정확히 둘 | 둘 | 둘 이상 |
| E-34 | 남음의 이름표 둘을 이야기에 | 이야기에 | 화면의 글로 |
| B-E4-a | **B 의 받는 말이 채점한다** — "아니에요. 여성은 거의 거꾸로예요…" / "맞아요. 여성은 남성과…" (UX-8 ⑥ 10 · UX-9 ⑤ ③ "맞다 · 틀렸다로 받지 않는다"와 어긋남) | **글 0자 — 고치지 않았다** (B 의 글은 이 Step 의 범위 밖) | P-S2 프롬프트 · 사람 게이트에서 · 골든 손질 때 도윤 확인 뒤 |
| B-E4-b | 견본 셋이 **같은 사건 · 같은 문서 하나 · 숫자 뉴스**다 — 사람 · 사건 뉴스 · 문서 둘 이상에서 이 꼴이 서는지 미확인 (UX8-e) | §10 | D99 ③ 의 한 편 (`license-notice` 다시 쓰기)이 첫 시험 |
| B-E4-c | lab `short-b/check.ts` 머리 주석은 "lab 꼴이라 계약 검증을 쓸 수 없다" 그대로 — 이제 `data.ts` 가 `parseFlowStory` 를 지난다 (문서 대조는 check L2 그대로) | check.ts 0줄 | 다음 lab 손질 때 주석만 |
| B-E4-d | **DECISIONS 는 건드리지 않았다** — E-26 ~ E-34 를 D 번호로 올릴지 · 특히 E-27 (카테고리 자리) · E-29 (사망 가드)는 PM | — | — |

---

## 검사 (붙인 그대로 · 2026-11-15)

`pnpm install` (시작 전) · 시작 때 contract 135 통과를 먼저 확인.

**`pnpm --filter @claro/contract test`**
```
 Test Files  5 passed (5)
      Tests  150 passed (150)
   Start at  19:21:42
   Duration  1.24s (tests 68%, transform 22%, import 10%, worker 1%)
```
(135 → 150: 골든 새 꼴 1 · 위반 7 · 픽스처 없이 7 = 15 더함 · 세 꼴 가르기 · `_` 시험은 새 꼴을 넣어 고침 — contract-docs 14 는 그대로 지남: 문서의 타입 블록 ↔ `EPISODE_SHAPES` 의 칸 · 차례 · `FlowBeat` · `FlowBlock` 갈래까지)

**`pnpm -s typecheck`**
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
```

**`pnpm -s test`** (web e2e 는 제 빌드 `.next-test` 로 — 끝 `exit 0`)
```
packages/contract test:       Tests  150 passed (150)
packages/pipeline test:  Test Files  13 passed (13)
packages/pipeline test:       Tests  156 passed (156)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   74 passed (3.1m)
exit 0
```
e2e 가 `logs/frontend/F-2b/` 그림 일곱 (png 6 · webm 1)을 다시 찍었다 → 하나씩 `git checkout -- <파일>` 로 되돌림 (한 줄 반복은 자동 모드가 막아 파일마다 따로) — 커밋에 없다.

**lab `check.ts` 넷**
```
=== lab/today/check.ts
OK — 짧은 이야기 (계약 검증 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙
=== lab/short/check.ts
  뼈: first_thought → breaker → name → name → flip → try → land → land → 남는 한 줄 · 그리지 않을 것 6
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
=== lab/short-a/check.ts
  뼈: first_thought → try → breaker → name → flip → land → 남는 한 줄 · 그리지 않을 것 6
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기 · 줄기는 뉴스 (N1 ~ N3)
=== lab/short-b/check.ts          (골든을 읽는 data.ts 로 — 숫자 · 글자 수가 바꾸기 전과 같다)
  구절 12 (문서 1 — git 의 store.documents.json) · 글 덩이 24 (한 번 읽을 때 22) — 숫자가 든 글 18
  빈칸 뺀 글자 913 (읽는 길 — 표지 · 흐름 한쪽 가지 · 한 줄 · 누구의 말) + 접힌 낱말 카드 152 · 문단 6 · 고르기 1 · 물음 단추 1 (표지) · 낱말 비만율 · 퍼센트포인트 (%p)
  뼈: first_thought → breaker → name → flip → try → land → 남는 한 줄 · 그리지 않을 것 6
OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
```

**골든 넷 0자** — ② 의 해시 표 (HEAD = 지금 · 다섯 파일). **`license-notice --check`**
```
$ node src/short.ts license-notice --check
short license-notice --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
```

**띄운 서버 · 기다리기**: 3211 · 3212 (`next start`) 둘 — 찍은 뒤 `kill` (끝 코드 143) · `lsof` 빔. 기다리기는 `curl --retry` 한 번씩 (반복 스크립트 없음). 빌드 폴더 `.next-be4-*` 지움.
