# logs/frontend · UX-6 — 3화를 받을 자리 (계약 칸 셋 · 지난 값 화면 · 답 감추기 · 3화 주소)

## UX-6 · 2026-11-12 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · 배포 안 함 · `docs/PM.md` 안 읽음.
레인: 프론트 (`apps/web/src/app/lab/episode/`) + 백엔드 (계약 `docs/contract/EPISODE.md` 의 **3화 칸 셋만** — `packages/contract/src/episode.ts` · `validate-episode.ts` · `test/episode.test.ts` · `fixtures/invalid/episode-*` 새 셋).
안 건드린 것: EPISODE.md 의 다른 칸 · 다른 계약 파일 · **골든 셋 (0자)** · 세 회차의 독자 글 (0자) · `fomc-auto/` · packages/pipeline · packages/db · 본 화면 `/` · packages/tokens. 기존 위반 픽스처 38 은 다시 써도 글자 그대로 (`git diff` 0).

**한 줄 답**: 3화가 들어올 자리가 섰다. 계약에 **고를 수 있는 칸 셋** (지난 회차 `previous` · 같은 그림의 지난 값 `before` · 지난 회차에서 온 구절의 키 `<code>:<key>` — 전부 **실물 전 · 3화에서 확인**)이 생겼고, 고리 · 쪽 그림은 지난 값이 있으면 "지난 화" 한 줄을 오늘 값 옆에 놓는다.
체험 아래의 답 (도구 · `≠` · 문서가 말한 것)은 **체험을 마치기 전에는 접혀** 있다 (세 회차). `/lab/episode/rate-3` 은 파일이 생기면 그리고, 없으면 "회의록을 기다리는 중이에요 · 11/18 무렵" 한 장이다 — **요청마다 읽어서 다시 빌드하지 않아도 된다.**

---

## 폰에서 여는 법

같은 와이파이에서 — 맥에서 `pnpm --filter @claro/web phone` 을 켜 둔 동안 (**다시 빌드해 켜 둔 채로 끝냈다** · 포트 3200). 맥 주소 `172.16.103.170` (바뀌었으면 `ipconfig getifaddr en0`).

- **지난 값 견본 (새것 · 실제 아님)**: `http://172.16.103.170:3200/lab/episode/carry` — 풀이 장면 · "이 그림을 본 독자"로 바로 열린다. 그대로 두자 쪽을 눌러 본다 (초록 줄) · 둘째 줄 `이 그림을 본 독자` 를 끄면 처음 보는 독자 (밟은 뒤에 "지난 화"가 나온다)
- **3화 주소 (새것)**: `http://172.16.103.170:3200/lab/episode/rate-3` — 지금은 기다리는 한 장
- **답 감추기 (세 회차)**: `/lab/episode` · `/lab/episode/fomc` · `/lab/episode/pipc` 에서 `5/7` 풀이까지 — 체험 아래가 점선 칸 "체험을 마치면 여기가 열려요"로 접혀 있다. 체험을 끝내면 열리고, `그냥 열어 보기` 로도 열린다

---

## ① 계약 칸 셋 (EPISODE.md — 백엔드 레인 몫 · 이것만)

**셋 다 고를 수 있는 칸 (`?`) · 표시 "실물 전 · 3화에서 확인"** (D24 — 같은 시리즈의 회차 둘이 아직 없다. 원천은 결정 D61 ② · D62 ③ · D30 · D75 와 P-E2 가 지어 본 이어 쓰기). CHANGELOG 한 줄. 골든 셋은 칸이 비어 그대로 통과한다.

| # | 칸 | 모양 | 까닭 | P-E2 의 것과 |
|---|---|---|---|---|
| N-2 | **지난 회차** (§3.4) | `Episode.previous?: EpisodeRef` · `EpisodeRef { episode_id: UUID, episode_version: integer }` (`track` 다음 자리) | D30 의 ArticleRef 와 같은 방식. code 가 아니라 UUID + 판 — 3화가 가리키는 것은 "그때 읽은 2화의 그 판"이다 (2화에 새 판이 생겨도 3화의 지난 값은 그 판의 값). 같은 시리즈의 **앞 화** (바로 앞 화인지는 걸지 않았다 — 파이프라인은 지금 바로 앞 화만 받는다) | `_source.previous` (주석 · code 만) → 칸으로 |
| N-3 | **지난 회차에서 온 구절의 키** (§4.5) | `<그 구절이 처음 실린 회차의 code>:<그 회차에서의 키>` — 예 `fomc:omo.2023`. 이 회차의 구절은 `:` 없이. **앞머리는 하나** (4화가 3화에서 다시 받아도 `fomc:omo.2023`). 코드 `CARRIED_KEY` · `carriedKey(지난 code, 키)` | 키의 꼴이 둘 (`F001` · `omo.2023`)인 것 자체보다 **사건이 다른 회차끼리 키가 부딪치는 것**이 문제다 — 4화 (12월 사건)의 `F001` 과 3화 (10월 사건)의 `F001` 은 다른 사실인데 `carryT` 는 `quotes[k] = q` 로 덮어쓴다. (처음 실린 회차의 code · 키)는 회차를 넘어 구절 하나를 가리킨다 (code 는 유일 · 불변) | `carryT` 가 키를 그대로 옮긴다 → 앞머리를 붙여야 한다 (⑤) |
| N-1 | **같은 그림의 지난 값** (§7.9) | 고리 `ReachedNode` · `StoppedNode` 의 `before?: ChainBefore { reach: "full" \| "part" \| "none", value: EpisodeText }` · 쪽 `SeatSide.before?: SeatBefore { group: EpisodeText, why: "in-doc" \| "not-yet" }` | **같은 그림** = 지난 회차에 같은 kind 의 틀이 같은 `picture.id` 로 있고, 지난 값은 그 틀의 **같은 id** 의 고리 · 쪽에 붙는다 (이름은 그림의 말이라 다듬어질 수 있고 id 는 설계 프롬프트가 "바꾸지 않는다"고 한 것). 고리는 **닿은 데 (`reach`)가 바뀐 것**이 가장 큰 소식이라 따로 · 쪽은 `not-yet → in-doc` 이 "지난 화의 약속에 답했다"다. 값은 그 회차의 것 그대로 (글 · 근거까지). 달라졌든 아니든 싣는다 — 같은지는 화면이 본다 | `review.json` 의 `carry` `{ where, name, before: "<값> (<reach>)", today }` · `"<group> · 까닭 <why>"` 를 칸으로 나눴다. `carryPairs` 처럼 같은 id 면 다 싣는다 |

**불변식 · 코드 · 위반 픽스처 (꼭 필요한 것만)**
| # | 무엇 | 코드 | 픽스처 |
|---|---|---|---|
| 25 | 지난 값 (`before`)이나 지난 회차에서 온 구절 (`x:k`)이 있는데 `previous` 가 없으면 거부 · 고리의 지난 값에 구절 (오늘 값과 같은 규칙 — 불변식 18) · `previous` 의 판 ≥ 1 · 이 회차 자신이 아니다 (`ID_RANGE`) | `PREV_MISSING` · `PREV_VALUE_SRC` | `episode-before-no-previous` · `episode-before-value-no-src` |
| 26 | 지난 회차에서 온 구절의 키 — 앞머리 하나 · 이 회차의 code 가 아니다 | `PREV_KEY` | `episode-quote-key-double-prefix` (`rate-3:fomc:omo.2023` — 3화 → 4화로 이어 쓰며 앞머리를 또 붙인 꼴) |
| — | **지난 회차를 받으면 대 본다** (`validateEpisode(ep, { documents, previous })` — 문서를 받아야 보는 8 처럼): 받은 회차가 그 판인가 · 같은 시리즈의 앞 화인가 · 같은 그림 (kind · `picture.id` · 고리 · 쪽 id)인가 · 지난 값이 그 회차의 값과 글자 · 닿은 데 · 까닭 · 근거 (키는 앞머리를 붙여) 그대로인가 · 옮겨 온 구절이 그 회차의 구절 그대로 (글 · 문서)인가. 안 받으면 알림 `PREVIOUS_NOT_CHECKED` | `PREV_MISMATCH` | 픽스처 없이 시험 (픽스처는 문서만 받는다) |

- 시험 (`packages/contract/test/episode.test.ts`): 위반 셋 + 픽스처 없이 셋 — 손 2화를 지난 회차로 받는 **"3화 꼴" 회차를 시험 안에서 만든다** (글은 2화 그대로 · 고리 셋 · 쪽 둘에 지난 값 · `fomc:` 구절) → 통과 · 지난 회차를 주면 대 보고 통과 · 판 / 그림 / 닿은 데 / 까닭 / 근거 키 / 앞 화 / 구절의 글이 어긋나면 `PREV_MISMATCH`. contract 115 → **121**
- 문서: §0 · §1 (타입 블록) · §2.2 덧붙임 · **§3.4 · §4.5 · §7.9 (새)** · §7.6 · §9 (25 · 26 · 대 보기 · 보지 않는 것) · §10 (실물 전 칸 셋 한 줄) · §11 **E-16 ~ E-19** · §12 한 줄. 문서의 타입 블록 ↔ 코드의 칸 목록 시험 (`contract-docs.test.ts`) 그대로 통과
- **안 넣은 것**: 켜고 끄기 · 넘겨 보기 · 자리의 실제 결과 (`result`)의 지난 값 (E-19) · 쪽의 지난 수 · 지난 말 (E-18) · 지난 회차가 정말 저장소에 있나 (발행 검사) · 지난 회차에서 왔는데 `:` 없이 적은 구절 (꼴로는 못 가린다 — 지난 회차를 받으면 `before` 의 근거로 걸린다)

---

## ② 지난 값 화면 (`kit/frames/Steps.tsx` — 어디서 멈추나 · 자리에 앉기)

| | 이 그림을 본 독자 (`seen`) | 처음 보는 독자 (체험) |
|---|---|---|
| 고리 | **처음부터** — 고리마다 이름 아래 한 줄: 같으면 "지난 화와 같아요" · 다르면 "**지난 화** ◐ 그때의 값" (작은 점 = 그때 닿은 데 — 고리의 점과 같은 말: 빔 · 반 · 참) | **밟은 뒤에만** — 힘이 그 고리에 닿을 즈음 (고리마다 0.8초씩) 나온다. 다음 틀 (자리)로 넘어가 이미 일어난 일로 남은 고리에는 처음부터 |
| 쪽 | 자리 그림 아래 "**지난 화** [그대로 두자 · 0명] [올리자 · 12명]" · 쪽을 누르면 그쪽이 한 말 아래에, 그쪽이 `not-yet → in-doc` 이면 초록 줄 "지난 화에 ‘아직 문서에 없다’던 이 쪽의 까닭이 이번에 들어왔어요." | **앉은 뒤에만** 같은 줄 · 앉은 쪽이 `not-yet → in-doc` 이면 초록 줄 |
| 머리 | "전에 해 본 그림이에요. **지난 화의 값 옆에 오늘의 값을 놓았어요.**" (지난 값이 있을 때만 — 없으면 전처럼 "오늘의 값만 볼게요") | 그대로 |

**까닭**
- 그림을 본 독자에게는 **달라진 것이 곧 오늘의 소식**이다 (D61 ② "같은 그림에 값이 달라지는 것이 곧 이어진다"). 그래서 처음부터 · 오늘 값 바로 옆에.
- 처음 보는 독자에게 밟기 전에 지난 값이 보이면 오늘의 값을 미리 알려 주는 셈이다 (체험이 먼저 — ③ 의 답 감추기와 같은 뜻). 그렇다고 아예 빼면 3화의 처음 온 독자는 "지난번과 무엇이 달라졌나"를 모른다 — 3화의 뉴스는 **바뀐 것**이다. 그래서 밟은 · 앉은 **뒤에** 조용한 한 줄로.
- "지난 화와 같아요"를 따로 둔 것: 같은 값을 두 번 읽히지 않으려고. 3화는 같은 10월 표결이라 쪽의 수가 같고 **까닭만 바뀔** 공산이 크다 — 그 바뀜은 초록 줄이 짚는다 (D61 ⑨ "자리에 앉기의 뒷절반이 채워지는 문서").
- 지난 값은 근거 시트로 열지 않는다 — 오늘 값 (고리의 칩)도 맨 글자로 그려 왔다 (같은 결). `근거`를 켜도 그림 안은 그대로다.
- **지난 값이 없는 회차 (골든 셋)에서는 DOM 이 한 개도 늘지 않는다** (고리 · 쪽에 `before` 가 있을 때만 그린다) — 아래 픽셀 대조.

**견본 — `/lab/episode/carry` (`episodes/carry-sample/` · 실제 아님 · 맨 위에 크게)**
금리 2화 (골든)에 **시안에서만** 지난 회차 칸과 지난 값을 붙였다 — 골든 · 회차 글 0자. "지난 화" = 9월 (1화). 1화는 본 화면의 기사라 체험 그림이 없었으므로 **어느 회차에도 실린 적 없는 값**이다. 다만 값은 지어내지 않았다 (계약 검증 · 구절 대조 통과 — `check.ts` S6):
| 자리 | 지난 값 | 근거 (이 회차가 이미 싣고 있는 구절) |
|---|---|---|
| 기준금리 | 다 닿음 · 올렸어요 → 오늘과 같다 ("지난 화와 같아요") | `st09.raise` 9월 성명문 |
| 돈 빌리는 형편 | 안 닿음 · 아직 그대로 → 오늘 일부 | `pc10.cond` "Since our policy action in September, we have started to see some changes" (9월 조치 **뒤에** 조이기 시작) |
| 물가 | 안 닿음 · 여전히 높음 → 오늘과 같다 | `st09.infl` "Inflation remains elevated." |
| 그대로 두자 쪽 | 그대로 두자 · 0명 · 까닭 아직 → 오늘 10명 · 까닭 있음 → **초록 줄** | `st09.vote` "12 – 0" (9월엔 아무도 그 자리에 앉지 않았다 — 그쪽의 까닭이 적힌 문서도 없다) |
| 올리자 쪽 | 올리자 · 12명 · 까닭 있음 → 오늘 2명 · 아직 | `st09.vote` · `st09.infl` |
- 지난 회차 칸은 자리 표시 UUID (`…0000000000c1`) — 가리키는 회차가 없다 (1화는 회차가 아니다). 그래서 알림 `PREVIOUS_NOT_CHECKED` 가 나는 것이 맞다 (S6 가 본다).
- P-E2 의 `episodes/rate-2b` 는 설계 출력뿐이고 `carry.has = false` 라 지난 값이 없다 — 견본은 2화 데이터 쪽으로 했다.
- 3화가 나오면 이 견본은 지운다 (실물이 지난 값을 싣는다).

---

## ③ 답 감추기 (D74 f) — 세 회차

- **무엇을**: 풀이 장면에서 체험 **아래 전부** — 풀이에서 생기는 도구 (금융 여건 · ‘다했다면’ 단서 …) · 뒤집기 `≠` · 문서가 말한 것 · 누구의 말 · **물음 버튼**. 지시의 "도구 카드 · `≠`" 보다 넓게 잡았다: "실제로 연준이 말한 것"의 셋 · 위원회가 짚은 것 셋도 체험의 답을 먼저 말한다 (금리: 10 대 2 · 의장의 판단 / 개인정보: 알림 뒤 대응 소홀). 물음 버튼까지 접은 것은 체험을 건너뛴 독자가 뒤집기를 못 보고 다음 장으로 가지 않게.
- **어떻게**: 그 자리에 점선 칸 하나 — "**체험을 마치면 여기가 열려요.** 답은 위에서 직접 해 본 다음에 볼게요." + `그냥 열어 보기`. 흐리게 (blur)는 버렸다 — 큰 `≠` 는 흐려도 읽히고, 화면이 무겁다. 접기는 장면이 짧아져 스크롤해도 답이 없다.
- **언제 열리나** (틀 부품의 `onDone` — 체험을 마쳤을 때 한 번): 켜고 끄기 = 켜진 쪽에서 눌러 **막혔다** (두 번째 누름) · 고리 → 자리 = **앉았다** · 넘겨 보기 = **여섯 칸을 다 넘겼다** · 또는 `그냥 열어 보기` (독자를 가두지 않는다 — 체험이 어려운 독자 · 읽기 도구 독자). 한 번 열리면 `처음으로` · `다시 해 보기` 를 눌러도 다시 접지 않는다 (화면이 튀지 않게).
- **`이 그림을 본 독자` · `체험 없이 보기`**: 처음부터 열려 있다 (그 독자에게는 감출 답이 없다).
- **동작 줄이기**: 열릴 때 글이 아래에서 올라오는 움직임은 기존 장면의 것 (`rise`) 그대로 — 뼈대의 `MotionConfig reducedMotion="user"` 가 동작 줄이기를 켠 기기에서는 옮김을 끄고 나타나기만 한다.
- 그림: `logs/frontend/UX-6/{delivery,fomc,pipc}-gate-1-closed.png` (접힘) → `-gate-2-opened.png` · `-gate-3-opened-b.png` (마친 뒤)

---

## ④ 3화 주소 — `/lab/episode/rate-3` (`fomc-auto/` 다섯 파일을 본떠: `page.tsx` · `data.ts` · `Rate3Episode.tsx` · `check.ts` · `rate3.css`)

- 읽는 파일: `packages/pipeline/data/events/FOMC-20261028/episodes/rate-3/episode.json` (+ 있으면 `review.json` 의 `follower_known` · `publishable`). 출력 폴더는 `rate.json` 의 `rate-3` 에 `dir` 이 없어 기본 `episodes/rate-3` — 이름이 맞는다.
- **요청마다 읽는다** (`export const dynamic = "force-dynamic"` · 서버에서 `node:fs`). 회의록 날 세션은 **파일만 만들면** 폰 서버를 다시 빌드하지 않아도 이 주소가 바뀐다.
- 파일이 없으면: 기다리는 한 장 — 시리즈 · 흐린 표지 그림 · "3화 / 회의록을 기다리는 중이에요" · `11/18 무렵` · 세 줄 (2화에서 본 회의의 회의록이 나오면 파이프라인이 3화를 만든다 · 같은 그림을 받아 오늘 값만 바꾸고 지난 값을 옆에 · 2화가 "아직 문서에 없다"고 한 반대 둘의 까닭을 회의록에서 찾는다) · 지난 화 (2화) · 지난 값 견본으로 가는 길 둘.
  "11/18 무렵"은 지시문 그대로이고, 손 2화의 구절 `cal.minutes` ("released three weeks after the date of the policy decision") + `st10.date` (10월 28일) → 11월 18일. 시안 전용 글의 숫자 규칙 (S4)에서 이 하나만 밝혀 둔 예외로 받는다.
- 파일이 있으면: `validateEpisode(파일, { previous: 손 2화 })` — **지난 회차와 대 보기까지** 지나면 공통 뼈대에 그대로 올린다 (맨 위 녹색 띠 "파이프라인이 만든 3화 · 사람 확인 전" — `review.json` 의 `publishable` 이 true 면 "사람이 확인함"). 못 지나면 그리지 않고 오류를 보인다 (fomc-auto 와 같다). 표지 · 도구 그림은 손 2화의 것 (같은 시리즈 · 같은 도구 key — `episodes/fomc/index.tsx` 의 `Glyph` 를 내보내게 한 단어).
- **읽는 길은 돈 안 들이고 시험했다** (임시 폴더 · 커밋 안 함 — 파이프라인 폴더에 파일을 만들지 않았다): 파일 없음 → `waiting` · 손 2화를 이어 받은 3화 꼴 → `ok` (지난 회차 칸 · 알림) · 지난 값을 틀리게 → `broken` (`PREV_MISMATCH … 지난 회차: part · “일부에서 조여짐” / 적은 것: full`) · 깨진 JSON → `broken`. 아래 검사.
- `check.ts`: 파일이 없으면 "회의록을 기다리는 중"으로 0 · 있으면 문서 대조 + 지난 회차 대 보기 + 지난 회차 칸이 찼나 (비었으면 "화면에 지난 값이 안 나간다"고 적는다) + S2 ~ S4.

---

## ⑤ 회의록 날 세션에게 (P-E2 ① 7 뒤 — 파이프라인 코드를 고치지 않았다 · 맞출 것)

**파일 이름은 그대로다** — `episodes/rate-3/episode.json` · `review.json` 만 생기면 `/lab/episode/rate-3` 이 그린다. 계약 칸은 **고를 수 있는 칸**이라 아래를 안 해도 화면은 선다 (지난 값이 안 보일 뿐) — 해야 3화가 "이어진다"를 보인다.

| # | 지금 (P-E2 · `packages/pipeline/src/episode.ts`) | 계약 (UX-6) | 맞출 것 |
|---|---|---|---|
| 1 | `_source.previous: x.prev.code` (주석) | `previous: { episode_id, episode_version }` (회차 맨 위 · `track` 다음) | `episode` 에 `previous: { episode_id: x.prev.episode_id, episode_version: x.prev.episode_version }` — `Prev` 타입에 두 칸을 더한다 (JSON 에는 이미 있다 · 손 2화 `d9556ce2-…` v1) |
| 2 | `carryT` 가 구절을 **지난 키 그대로** 옮긴다 (`quotes[k] = q` — `omo.2023`) | `fomc:omo.2023` (`<처음 실린 회차의 code>:<키>` · 이미 `x:k` 면 그대로) | `const ck = (k) => (k.includes(":") ? k : x.prev.code + ":" + k)` · `quotes[ck(k)] = q` · 돌려주는 글의 `src` 도 `ck` 로. 파이프라인은 계약 패키지를 바로 못 읽는다 (확장자 없는 import — `episode-validate.ts` 주석) → 한 줄을 옮겨 적는다 (계약의 `carriedKey` 와 같은 식). 문서 라벨은 그대로 (`docs[q.doc] ??= …`) |
| 3 | 지난 값 ↔ 오늘 값은 `review.json` 의 `carry` (`carryPairs` — 글자열)에만 | 고리 `before: { reach, value }` · 쪽 `before: { group, why }` | `keepPicture` 이고 지난 회차에 같은 kind · 같은 `picture.id` 의 틀이 있으면 — 고리마다 같은 id 의 지난 고리 `pn` 이 있으면 `before: { reach: pn.reach, value: carryT(pn.reach === "none" ? pn.still : pn.after) }` · 쪽마다 `before: { group: carryT(ps.group), why: ps.why }`. **달라졌든 아니든** 싣는다 (`carryPairs` 와 같다). `review.json` 의 `carry` 는 그대로 둬도 된다 (확인지 몫) |
| 4 | 계약 검증 다리 (`episode-validate.ts`)가 `{ documents }` 만 넘긴다 | `{ documents, previous }` 를 받으면 같은 그림 · 지난 값 · 옮겨 온 구절을 대 본다 (`PREV_MISMATCH`) | 다리에 `previous` (손 2화 JSON — `x.prev` 그대로 · `_source` 는 무시된다)를 넘기면 짓는 자리에서 걸린다. 안 넘겨도 화면 쪽 (`/lab/episode/rate-3` · `rate-3/check.ts`)이 대 본다 |
| 5 | 손 2화의 code 는 `fomc` · 3화는 `rate-3` | 앞머리가 이 회차의 code 면 `PREV_KEY` | 그대로 맞는다 (`fomc:` ≠ `rate-3`) |

- 1 ~ 3 을 같이 해야 한다: 3 만 하고 2 를 안 하면 지난 값의 근거 키가 `st09.raise` 로 남아 대 보기에서 `PREV_MISMATCH` 가 난다 (지난 회차의 값이라면 `fomc:st09.raise`).
- 3화의 쪽은 같은 10월 표결이라 수가 같을 것이다 — 그래도 `before` 를 단다. 화면은 같은 수를 "지난 화" 칩으로 보이고, 올리자 쪽이 `not-yet → in-doc` 이면 초록 줄을 띄운다 (게이트 1 에서 사람이 `sides.raise = in-doc` 으로 정했을 때).
- 맞춘 뒤: `pnpm --filter @claro/web exec tsx src/app/lab/episode/rate-3/check.ts` (문서 대조 + 대 보기 + "지난 회차 칸: previous … · 지난 값 고리 … 쪽 … · 옮겨 온 구절 …") → 폰에서 `/lab/episode/rate-3` 의 풀이 장면 · `이 그림을 본 독자`. 지난 값 견본 (`/lab/episode/carry`)과 `episodes/carry-sample/` 은 그때 지워도 된다.

---

## ⑥ _open

| # | 무엇 | 지금 | 선택지 · 누가 |
|---|---|---|---|
| **UX6-a** | **지난 회차 칸 셋을 `?` 로** (계약 §12 의 "없으면 `null`" 과 다르다 — E-16) | 실물 전 칸으로 골든을 고치지 않으려고 | 3화가 나온 뒤 `\| null` 로 (골든 셋에 칸이 더해진다) — PM · 3화 뒤 |
| **UX6-b** | **구절 키의 앞머리가 code** · 지난 회차 칸은 UUID + 판 (E-17) | 읽을 수 있게 · 짧게. 지난 회차를 받기 전에는 앞머리가 그 회차인지 못 본다 | `EpisodeRef` 에 `code` 도 · 또는 앞머리를 UUID 로 — PM |
| **UX6-c** | **답 감추기를 체험 아래 전부 (물음 버튼까지)로** 넓혔다 — 지시는 "도구 카드 · `≠`" | "실제로 … 말한 것"도 답을 먼저 말한다 · 체험을 건너뛴 독자가 뒤집기 없이 넘어가지 않게. `그냥 열어 보기` 로 언제든 | 도구 · `≠` 만 접는다 — 도윤이 폰에서 보고 |
| **UX6-d** | **처음 보는 독자에게도 지난 값을 (밟은 · 앉은 뒤에)** 보인다 | 3화의 뉴스는 바뀐 것이라 처음 온 독자도 알아야 한다고 봤다 | 그림을 본 독자에게만 — 도윤 |
| UX6-e | 쪽의 지난 값에 수 · 그때의 말이 없다 (E-18) — 화면은 지난 자리 그림을 다시 그리지 않고 칩으로 | P-E2 의 `carry` 와 같다 | `count` 를 더해 지난 화의 자리 그림 (12 : 0 → 10 : 2 가 움직이는 것) — 3화는 같은 표결이라 지금은 쓸 데가 적다 |
| UX6-f | 견본의 "그대로 두자 · 0명 · 까닭 아직" — 9월에 아무도 앉지 않은 쪽을 쪽으로 세웠다 | 12 – 0 은 사실이고 그쪽의 까닭이 적힌 문서도 없다 · 초록 줄 (`not-yet → in-doc`)을 견본에서 보이려고 | 그 쪽의 지난 값을 빼고 올리자 쪽만 — 견본이라 3화 뒤 지운다 |
| UX6-g | 3화 주소는 **요청마다 서버에서 파일을 읽는다** (lab 의 다른 주소는 빌드할 때 굳는다) | "파일만 생기면 된다"를 지키려고. 배포 (Vercel)에서는 그 파일이 서버 묶음에 없어 늘 기다리는 화면이다 | F-E1 이 lab 주소를 실제 주소로 옮길 때 `fomc-auto` 와 같이 뺀다 (development-frontend F-E1 "파이프라인 시험판 뺌") |
| UX6-h | 켜고 끄기 · 넘겨 보기의 지난 값 · 자리의 실제 결과의 지난 값은 칸이 없다 (E-19) | 실물이 없다 | 그 실물이 나올 때 |
| UX6-i | 지난 값 견본이 시안 줄의 "건너가기"에는 없다 (책장에 안 올렸다) | 회차가 아니라 견본이다 (조용히 견본과 같다) | — |

### 스스로 내린 판단 — 수용 여부는 PM
| # | 판단 | 까닭 |
|---|---|---|
| J1 | 지난 값을 고리 · 쪽마다 붙였다 (틀에 모아 두는 표가 아니라) | 화면이 고리 · 쪽마다 읽는다 · 같은 id 로 대는 것이 칸의 자리와 맞는다 · P-E2 의 `carry.where` (`chain.<id>` · `seats.<id>`)와 같은 단위 |
| J2 | "지난 값은 그 회차의 값 그대로" — 대 보기에서 글자 · 닿은 데 · 까닭 · 근거 키까지 같아야 한다 | 지난 값을 다시 쓰면 "지난 화에서는 이랬다"가 지난 화와 달라진다. 다시 쓴 지난 값이 필요하면 칸이 아니라 글 ("지난 화에서는 ○○였던 자리" — 글 /2 의 규칙)로 |
| J3 | `previous` 를 바로 앞 화로 걸지 않고 "앞 화"로 | 바로 앞 화만 받는 것은 파이프라인의 지금 규칙일 뿐 · 계약에 걸 근거가 없다 |
| J4 | 시안 전용 `start` (처음 열 장면 · 풀이 스위치)를 뼈대 (`Episode`)에 더했다 | 견본 주소가 지난 값이 보이는 화면으로 바로 열리게. 없으면 전과 같다 (세 회차 · fomc-auto 는 넘기지 않는다) |
| J5 | `shots.ts` 에 `carry` · `gate` · `rate3` · `SHOTS_SLOW` · `throughGate` · 넘겨 보기 `labclip` · `diff.mjs` 에 다른 줄의 범위 | 접힌 아래가 물음 버튼을 감춰 따라온 독자의 걸음이 멈춘다 · 전후를 움직임이 덜 끝난 채 찍지 않게 |

---

## 검사 (붙인 그대로)

```
$ pnpm -s typecheck
packages/tokens typecheck: Done · packages/contract typecheck: Done · packages/pipeline typecheck: Done · packages/db typecheck: Done · apps/web typecheck: Done   (rc=0)

$ pnpm --filter @claro/contract test
 Test Files  5 passed (5)
      Tests  121 passed (121)          (115 → 121: 위반 픽스처 셋 · 픽스처 없이 셋)
$ WRITE_EPISODE_INVALID=1 … (표에서 픽스처를 다시 씀) → 기존 38 은 git diff 0 · 새 셋만 생김

$ pnpm -s test   → rc=0
packages/contract test:  Test Files  5 passed (5)    Tests  121 passed (121)
packages/pipeline test:  Test Files  11 passed (11)  Tests  125 passed (125)
packages/db test:        Test Files  3 passed (3)    Tests  101 passed (101)
apps/web test:   56 passed (3.1m)
  (logs/frontend/F-2b 의 그림 · 영상 6개가 다시 찍혔다 — 하나씩 git checkout -- <파일> 로 되돌렸다)

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts   (줄 고름)
■ 누가 값을 정하나 · 1화 (delivery)   구절 39 (문서 6) · 글 94 … OK
■ 금리는 어디로 · 2화 (fomc)          구절 41 (문서 8) · 글 129 … 알림 SEAT_WHY_NOT_YET (그대로) · OK
■ 내 정보는 누가 지키나 · 1화 (pipc)  구절 44 (문서 8) · 글 105 … OK
■ 조용히 견본 — OK
■ 지난 값 견본 — 실제 아님 (episodes/carry-sample · /lab/episode/carry)
지난 값 5: rate full “올렸어요” (st09.raise) / cond none “아직 그대로” (pc10.cond) / infl none “여전히 높음” (st09.infl) / wait “그대로 두자 · 0명” · 까닭 not-yet / raise “올리자 · 12명” · 까닭 in-doc
  알림 — PREVIOUS_NOT_CHECKED /previous
  알림 — SEAT_WHY_NOT_YET /solve/lab/frames/1/sides/1
OK — 계약 검증을 지났고 (지난 값의 구절도 저장된 문서에 있다), 견본 띠에 숫자가 없다
■ 공통 화면 글 (kit/chrome.ts) — OK
OK — 회차 3 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/fomc-auto/check.ts
… 풀이 칸: 체험 [chain → seats] · 기본 풀이 three … · 알림 raise not-yet
OK — 계약 검증을 지났고 … 화면 쪽 검사도 맞다          (fomc-auto 0자 — 새 칸이 비어도 그대로 지난다)

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/rate-3/check.ts
■ 금리는 어디로 · 3화 (rate-3 · 파이프라인)
회의록을 기다리는 중 — packages/pipeline/data/events/FOMC-20261028/episodes/rate-3/episode.json 이 아직 없다 (P-E2 ① 7 · `pnpm --filter @claro/pipeline episode rate-3` 이 짓는다). 주소는 기다리는 한 장을 그린다
OK — 대기 화면의 글 (숫자는 밝혀 둔 날짜 하나 · 화면 번호뿐)

$ tsx <임시 시험 — 커밋 안 함> <임시 폴더>       3화 주소의 읽는 길 (loadRate3 — 임시 폴더를 저장소 뿌리로)
파일 없음 → waiting
3화 꼴 → ok previous d9556ce2-9e3a-441f-83b1-0378eee9714e · 알림 QUOTES_NOT_CHECKED /quotes, SEAT_WHY_NOT_YET /solve/lab/frames/1/sides/1 · known [] · publishable null
지난 값이 틀림 → broken PREV_MISMATCH /solve/lab/frames/0/nodes/1/before: 고리 "cond" 의 지난 값이 지난 회차의 값과 다르다 — 지난 회차: part · “일부에서 조여짐” (fomc:pc10.cond) / 적은 것: full · “일부에서 조여짐” (fomc:pc10.cond)
깨진 JSON → broken

$ 폰 서버 빌드 (pnpm --filter @claro/web phone) — 경로 표
├ ○ /lab/episode/carry     (새)
├ ƒ /lab/episode/rate-3    (새 — 요청마다)
✓ Ready · LAN 200: http://172.16.103.170:3200/lab/episode · /fomc · /pipc · /carry · /rate-3 · /fomc-auto · /quiet (아래)

$ python3 scripts/verify-*.py   (13개) → 전부 rc=0
```

**세 회차 풀이 그림 — 답 감추기 말고는 같은가** (전 = 지금 커밋 `d1b73d2` 를 임시 폴더에 풀어 따로 빌드한 서버 · 후 = 이 Step 의 폰 서버 빌드 · 같은 `shots.ts` 차례 `walk` · `extras` · `labclip` · `SHOTS_SLOW=2` · `diff.mjs` 위 0px부터)
```
$ node src/app/lab/episode/diff.mjs <전> <후> <sharp> 0
181장 — 같음 143 · 다름 30 · 없음 8 · 뒤에만 있음 10
```
| 무엇 | 장 | 결과 | 까닭 |
|---|---|---|---|
| 표지 · 따라잡기 · 사건 · 도구 · 견주기 · 이어짐 · 남음 (세 회차 × 두 독자) · 이 그림을 본 독자 · 체험 없이 보기 (세 회차) | 112 | **같음 112** | 지난 값이 없는 회차라 그림에 붙는 것이 없다 · 접힘은 체험 모드에만 |
| **체험을 마친 뒤의 풀이 장면 전체** (`*-new-05-aha-open*` — 처음 온 독자가 누르는 단계를 다 한 뒤 위에서부터) | 11 | **같음 10 · 다름 1** (`delivery-new-05-aha-open` 3픽셀 — 손님 점의 용수철 움직임이 덜 멎음) | 다 하고 나면 전과 같다 — 접은 것이 그대로 열린다 |
| 풀이 그림만 오린 것 (`labclip` — 누르는 단계마다 · 본 독자 · 체험 없이) | 20 | 같음 15 · 다름 5 (`fomc-clip-1` 6픽셀 ≤2/255 · `pipc-clip-1 · 4 · 5 · 6` ≤151픽셀 ≤14/255 — 글자 · 모서리의 반투명 테두리) | 장면이 짧아져 카드가 놓인 화면 위치가 달라졌다 (글자 안티에일리어싱). 그림 · 글 · 움직임은 그대로 |
| 누르는 단계 (`*-lab-*` — 풀이 그림을 화면 위쪽으로 민 뒤) | 18 | 같음 2 (넘겨 보기를 다 넘긴 뒤 둘) · 다름 16 (줄 92 부터) | 장면이 짧아져 그림을 위쪽으로 다 밀지 못한다 (스크롤 끝) → 검은 줄 아래 화면 전체가 밀려 찍혔다. 그림 자체는 위 `labclip` 이 본다 · 다 마쳐 열린 뒤 (넘겨 보기 둘)는 같다 |
| 풀이 장면을 위에서부터 (`*-aha` · `-b` · `-c` · `-d` — 체험 전) | 20 | 같음 4 (배달앱 · 금리의 첫 화면) · 다름 8 · 없음 8 | **답 감추기** — 체험 아래가 점선 칸 하나로 접혀 장면이 짧다 |
| 따라온 독자의 `*-aha-open*` | 10 | 후에만 | 접힌 것을 "그냥 열어 보기"로 연 장면 (새 걸음) |
- 전에 `SHOTS_SLOW` 없이 견줬을 때는 이어짐 · 견주기 몇 장이 움직임이 덜 끝난 채 찍혀 달랐다 (1 ~ 217/255) — 기다림을 두 배로 하니 사라졌다 (같은 화면). 콘솔 오류 1 (404 — 전 · 후 같다 · 이 Step 과 무관)

## 스크린샷 — `logs/frontend/UX-6/` (390×844 · 폰 서버 빌드에서)

- **지난 값 (견본 · 실제 아님)**: `carry-seen` (`-b` · `-c` · `-d`) 그림을 본 독자 — 풀이 장면 전체 · `carry-seen-lab` 고리 셋의 "지난 화" (같다 둘 · 다르다 하나) + 쪽의 칩 · `carry-seen-wait` 그대로 두자 쪽 — 초록 줄 · `carry-seen-raise` 올리자 쪽 · 처음 보는 독자 `carry-lab-1-before` (밟기 전 — 지난 값 없음) → `carry-lab-2-pressed` (밟은 뒤 — 고리마다 나온다) → `carry-lab-3-oct` (자리 · 앉기 전) → `carry-lab-4-wait` · `-5-wait-b` (앉은 뒤 — 칩 · 초록 줄)
- **답 감추기 전 · 후 (세 회차 · 처음 온 독자)**: `delivery-gate-1-closed` → `delivery-gate-2-opened` · `-3-opened-b` · `fomc-gate-*` · `pipc-gate-*`
- **3화 대기 화면**: `rate3` · `rate3-b`

## 파일

| 파일 | 무엇 |
|---|---|
| `docs/contract/EPISODE.md` | 칸 셋 (위 ①) · CHANGELOG 한 줄 |
| `packages/contract/src/episode.ts` | `EpisodeRef` · `ChainBefore` · `SeatBefore` · `previous?` · `before?` · `CARRIED_KEY` · `carriedKey` · 칸 목록 |
| `packages/contract/src/validate-episode.ts` | 불변식 25 · 26 · 지난 회차 대 보기 (`previousProblems` · `EpisodeContext.previous`) |
| `packages/contract/test/episode.test.ts` · `fixtures/invalid/episode-{before-no-previous,before-value-no-src,quote-key-double-prefix}.json` (새 3) | 위반 셋 · 픽스처 없이 셋 |
| `apps/web/src/app/lab/episode/kit/frames/Steps.tsx` · `frames.css` | 지난 값 ("지난 화" 한 줄 · 칩 · 초록 줄) · `onDone` |
| `kit/frames/Toggle.tsx` · `Pages.tsx` · `LabCard.tsx` | `onDone` (체험을 마쳤다) |
| `kit/Episode.tsx` · `episode.css` · `kit/chrome.ts` | 답 감추기 (`LabGate`) · 시안 전용 `start` · 공통 글 (`carry` · `gate` · `seen.labelCarry`) |
| `episodes/carry-sample/` (새 — `data.ts` · `index.tsx` · `carry.css`) · `carry/page.tsx` (새) | 지난 값 견본 (실제 아님) |
| `rate-3/` (새 — `page.tsx` · `data.ts` · `Rate3Episode.tsx` · `check.ts` · `rate3.css`) | 3화 주소 |
| `episodes/fomc/index.tsx` | `Glyph` 를 내보낸다 (한 단어 · 그림 0자) |
| `check.ts` · `shots.ts` · `diff.mjs` | S6 지난 값 견본 · 찍는 차례 · 다른 줄의 범위 |
| `logs/frontend/UX-6.md` · `logs/frontend/UX-6/` · `docs/development-frontend.md` | 이 로그 · 그림 · UX-6 줄 |
