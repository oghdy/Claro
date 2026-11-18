# logs/frontend · F-E9 — 실제 반영: 새 시작 화면 · 달력 화면 · 이야기 끝 → 달력 (D148)

## F-E9 · 2026-11-18 · 서브에이전트 (새 세션) · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`) · **모델 API 0** · `docs/PM.md` 안 읽음.
도윤: "응 좋아 실제 반영 ㄱㄱ · 개념 지도 컨텐츠는 더 나중에 디벨롭하자" (D148). 확정된 lab 판 (`/lab/start` · `/lab/start/days` · `/lab/start/end` — UX-13b)을 **새로 디자인하지 않고** 실제 `/` · 새 `/days` · 실제 이야기의 끝으로 옮겼다.

**한 줄 답**: 실제 `/` 는 lab 시작 화면과 **픽셀 단위로 같다** (390 · 360 폭 둘 다 다른 픽셀 0). `/days` 는 lab 달력과 같고 (다른 곳은 줄 오른쪽 화살표의 안티에일리어싱뿐 — 차이 ≤ 16/255), 실제 이야기의 끝은 **먹색 단추 하나 "다른 이야기 보기 →" → `/days?d=<그날>`** 이다 (누를 것: 긴 이야기 6 → 2 · 짧은 이야기 2 → 1). e2e 92 통과 · 임시 줄 시험 셋 (새 날 · 12월 · 틀린 자리).

## ① 바뀐 화면 셋

| 주소 | 앞 | 뒤 |
|---|---|---|
| `/` | 옛 첫 화면 (키 4,401px — 한마디 큰 글 · 카드 열 · 지난 이야기 · 이어지는 이야기 · 개념 지도 먹색 판 · 소개) | **시작 화면** (한 장 844px): Claro 표 · 작은 회색 한마디 · "오늘의 이야기 N편" (`bundle()` 의 맨 위 묶음 · 머리 날짜 규칙 · `TODAY_SCRIPT` 그대로) · 이야기마다 "이야기 속으로 들어가기 →" (첫째 먹색 채움 · 둘째부터 먹색 테) · 문 둘 "지난 이야기" → `/days` · "개념 지도" → `/map` · 맨 아래 미리보기 한 줄. `force-static` · 메타 · OG 그대로 |
| `/days` (새) | 404 | **달력 화면**: 머리 막대 ‹ "첫 화면으로" → `/` · "지난 이야기" · 달력 (누를 날 = 옅은 면 동그라미 · 고른 날 = 먹색 · 가장 새 날도 누름) · 고른 날의 줄 (줄마다 동그란 →) · 낸 날이 없는 이야기는 접힌 "그 전". **처음 고른 날 = 바로 위 지난 날** · `?d=YYYY-MM-DD` 면 그날 (이야기가 없는 날 · 엉뚱한 값은 처음 규칙). 달 넘기기 ‹ › 는 달이 둘 이상일 때만 (lab 규칙). `?many=1` 견본은 넣지 않았다 |
| 실제 이야기의 끝 (`/s/*` · `/short/*` — kit 의 `real` + 새 `exits`) | 긴: 감색 큰 "내 개념 지도 보기" · 다음 화 · 다른 시리즈 상자 셋 · "처음부터 다시" · "첫 화면으로" (누를 것 6) · 짧은: 작은 밑줄 글 둘 (누를 것 2) · 첫 장 ‹ 는 늘 `/` | 맨 아래 **먹색 단추 하나 "다른 이야기 보기 →"** → `/days?d=<그 이야기의 day>` (day 없는 이야기는 `/days`) · "내 개념 지도 보기"는 지도 아래 작은 글 한 줄 (오른쪽 · 화살표) · "저장되지 않아요"는 작은 회색 · 다른 시리즈 · 처음부터 다시 · 첫 화면으로 뺌 · **다음 화** (번호를 보이는 시리즈 — 지금은 금리 2화의 예고)는 먹색 단추 아래 조용한 한 줄 · 첫 장 ‹ = **가장 새 날의 이야기 → `/` · 그 밖 → `/days?d=<그날>`** (낸 날 없음 → `/days`) |

**그대로인 것**: lab 시안 (`/lab/start*` · `/lab/home-days/*` · `/lab/today*` · `/lab/episode/*`) · `/lab/local/*` 미리 보기의 끝과 ‹ (kit 에 `exits` 를 안 주면 옛 갈래 그대로) · `/map` 의 내용 · 이야기 글 · `STORIES` 줄 · 계약 · 골든 · packages. 확인 (빌드한 서버에서 끝까지 넘김):
```
/lab/local/MOTIR-20261113-OIL-PRICE-CAP/oil-1 200 · 첫 장 ‹ / · 끝 keep · end-go 0 · 누를 것 6: 내 개념 지도 보기 | 다른 시리즈누가 값을 정하나싸게  → /s/price/1 | 다른 시리즈금리는 어디로2화 ·  → /s/rate/2 | 다른 시리즈내 정보는 누가 지키나 → /s/privacy/1 | 처음부터 다시 | 첫 화면으로 → /
/lab/local/MOE-20261118-SUNEUNG-ALERT/suneung-alert 200 · 첫 장 ‹ / · 끝 keep · end-go 0 · 누를 것 2: 처음부터 다시 | 첫 화면으로 → /
/lab/today/short 200 · 첫 장 ‹ /lab/today · 끝 keep · end-go 0 · 누를 것 4: 내 개념 지도 보기 | 같은 발표의 긴 이야기해킹은 당한 → /lab/episode/pipc | 처음부터 다시 | 오늘의 이야기로 돌아가기 → /lab/today
/lab/episode/fomc 200 · 첫 장 ‹ (없음) · 끝 keep · end-go 0 · 누를 것 5: 내 개념 지도 보기 | 다른 시리즈… | 처음부터 다시
/lab/start 200 · /lab/start/days 200 · /lab/start/end 200 · /lab/start/end?k=long 200 · /lab/home-days/e 200 · 페이지 오류 0
```

## ② 옮긴 파일 · 뺀 코드 · 남긴 코드

**새 파일 (실제 자리 — lab 파일을 실제가 import 하지 않는다)**
- `apps/web/src/app/days/page.tsx` — 달력 화면 (lab `StartDays` 에서 견본 `many` 를 뺀 것). `?d=` 를 읽어 **요청마다 그린다** (고른 날의 줄이 첫 HTML 에 있게 — 스크립트 없이도 맞고 다른 날이 먼저 보였다 바뀌는 깜박임이 없다 · _open b). 데이터베이스 0 · 저장 0. `?d=constructor` 같은 값이 객체의 물려받은 칸에 걸리지 않게 `Object.hasOwn` 으로 본다 (lab 은 `days[pick]` — `constructor` 를 넣으면 화면이 섰을 것)
- `apps/web/src/app/days/days.css` — lab `home-days.css` 의 `.hf-*` · `.hc-row*` + `start.css` 의 `.sp-days …` 덮어쓰기를 **합친 값** (보이는 것은 같다). 쓰지 않는 표시 (가장 새 날의 테 · 숫자 아래 점)는 뺐다
- `apps/web/src/app/start.css` — lab `start.css` 의 시작 화면 몫 (견본 띠 · 달력 · 끝 견본 몫은 뺌). 글자 하나 안 바꿈 → `/` 와 `/lab/start` 가 픽셀 같다
- `apps/web/src/episode/home/Calendar.tsx` — **실제 화면의 첫 클라이언트 부품** (`"use client"` 하나). lab 달력에서 `newest` (테) 를 빼고, 줄 오른쪽의 동그란 → 를 CSS 그림 (`::before` · `::after` 마스크)에서 **줄 안의 요소** (`.hc-row-go` + svg)로 (UX-13b _open i). `Row` 를 "그 전"의 줄도 같이 쓴다. 글은 `HOME` 에서
- `apps/web/src/episode/home/days.ts` — 달력의 셈 (`byDay` · `keyOf` · `dayLabel` · `monthOf` · `monthKeys`) + 길 (`DAYS` · `daysHref` · **`exitsOf(line)`** — 이야기의 나가는 길 하나를 정하는 곳)

**고친 파일**
- `apps/web/src/app/page.tsx` — 시작 화면 (lab `StartHome` 에서 견본 `?n=` 을 뺀 것 → 정적 그대로). 162줄 빠짐 · 113줄 들어옴
- `apps/web/src/episode/home-copy.ts` — lab 의 화면 글을 그리로: `line` (한마디의 한 줄 꼴) · `n` "{n}편" · `month` · `doors` (읽기 도구) · `foot` (미리보기 앞 두 문장) · `dayLabel` "{m}월 {d}일 {w}요일" · `before` "그 전" · `weekdays` · `prevMonth` · `nextMonth` · `cell` (읽기 도구) · `daysMetaTitle` "지난 이야기 · Claro" (새 글자 — 탭 제목). "지난 이야기" · "개념 지도" · "첫 화면으로"는 이미 있던 `restLabel` · `conceptLabel` · `mapBack` 그대로
- `apps/web/src/episode/kit/types.ts` — `Exits { home; more }` (한 곳에만)
- `apps/web/src/episode/kit/Episode.tsx` — `exits?` 칸 · Keep 에 `exits` 갈래 (지도 · 주운 개념은 옛 갈래와 같은 조각을 함께 씀) · 첫 장 ‹ = `exits.home` (이름: `/` 면 "첫 화면으로" · 달력이면 "지난 이야기")
- `apps/web/src/episode/kit/Short.tsx` — 같은 것 (끝 · ‹)
- `apps/web/src/episode/kit/chrome.ts` — `keep.more` "다른 이야기 보기" (도윤이 받은 말) · `chrome.days` "지난 이야기" (‹ 의 읽기 도구 이름 — 달력 화면 제목 그대로)
- `apps/web/src/episode/kit/parts.tsx` — `EndArrow` (lab 단추의 화살표 그대로 — 긴 · 짧은 이야기가 같이 씀)
- `apps/web/src/episode/episode.css` — `.ep-end-*` (lab `.sp-end-*` 의 값 그대로 + 다음 화 줄 `.ep-end-next`)
- `apps/web/src/episode/Screen.tsx` — **이야기가 제 day 를 아는 길**: 실제 주소 (`LongScreen` · `ShortScreen` real)만 `exits={exitsOf(line)}` 를 준다 (`catalog.tsx` 의 `Line.day` → `exitsOf` → props). `catalog.tsx` 는 0줄 (임시 줄 시험 때만 고쳤다 되돌림)
- e2e 셋 · 스킬 줄 하나 (③ · 아래)

**뺀 코드**: 실제 `/` 에서 쓰던 `HomeLongCard` · `HomeShortCard` · `sharedConcepts` · `Arrow` · `countWord` · `countNoun` · `latestPerSeries` · `nextOf` · `realPath` 의 import 와 fomc · pipc css import · e2e 도우미의 `LIST.cont` (`stories-dump.ts` — 이제 아무도 안 읽음).
**남긴 코드 (다른 곳이 쓴다 — 지우지 않음)**:
- `HOME` 의 옛 글 (`count` · `countRecent` · `tally` · `cont*` · `concept*` · `mapGo` · `about*` · `preview` · `previewTag` · `tagline` · `sub` · `recap`) — lab `/lab/home-days/*` (`HomeDays.tsx`)가 전부 쓴다 · `tagline` · `preview` 는 lab `Start.tsx` 도 · `mapTitle` · `mapNote` · `mapBack` 은 `/map`
- `episode/home/cards.tsx` (`HomeLongCard` · `HomeShortCard`) · `app/home.css` (`.hm-*` — `.hm-cont` · `.hm-map` 포함) — lab `HomeDays.tsx` 가 import 한다
- `countWord` · `countNoun` — lab `HomeDays.tsx` · `episode/today/concepts.ts` 의 `sharedConcepts` — lab `/lab/today` · e2e 도우미
- kit 의 옛 끝 갈래 (`ep-map-button` · `ep-nextup` · `other-*` · `ep-restart` · `home-link` · `to-today`) — lab 시안 · `/lab/local` 미리 보기가 쓴다 (지시문: 그 끝은 그대로)
- lab 의 `Calendar.tsx` · `days.ts` · `home-days.css` · `start.css` · `Start.tsx` — 0줄 (lab 시안이 쓴다 · 지울 때 같이)

## ③ e2e — 고친 것 · 뺀 것 · 새 것 · 까닭

F-E8 의 뜻 그대로: **그날 값은 목록 (`e2e/stories.ts` → `stories-dump.ts`)에서**. 도우미에 줄마다 `code` · `title` (한 줄 제목 · `**` 뺌) · `numbered` 를 더했다 (화면 함수 `oneLine` · `numbered` 그대로).
시험 수: 앞 90 → 뒤 **92** (새 둘). 바뀐 파일: `e2e/episode.spec.ts` · `e2e/stories-dump.ts` · `e2e/lab-local.spec.ts`.

| 시험 | 무엇을 | 까닭 |
|---|---|---|
| **고침** 첫 화면 (episode 100줄) | 카드 열 · 지난 이야기 카드 · `cont-rate` · `recap-fomc` · 카드마다 그림 · `.hm-tally` · `to-map` → **오늘 묶음** `story-<code>` 의 차례 = `TOP` · 주소 · 들어가기 말 `HOME.go` · 제목 · 번호 규칙 · 첫째만 `data-lead` + 단추 채움 / 둘째부터 테 · 편 수 `HOME.n` · 문 둘 (`door-days` → `/days` · `door-map` → `/map`) · **없다**: `.td-card` · `card-*` · `#td-rest` · `cont-*` · `to-map` · `.hm-map` · `.hm-about` · `.hm-preview` · 옛 글 (이어지는 이야기 · 개념 지도 판 · 소개 · `sub`) · 지난 이야기의 제목 · 한마디 = `HOME.line` · 미리보기 = `HOME.foot` | 첫 화면의 꼴이 바뀌었다. 지키던 뜻 (가장 새 날 · 같은 날은 목록의 위 · **목록의 차례 = 화면의 차례** · 그날이면 "오늘의 이야기" · 다음 날은 날짜 · 매일 약속 없음 · 읽는 시간 없음 · OG · 개념 지도 장 수 · ghost 수)은 그대로 본다 (지도는 `to-map` 대신 문 ② 로 들어가 본다) |
| **고침** 가장 새 묶음 · 콘솔 오류 | 주소 목록에 `/days` · `/days?d=<그날>` 더함 | 새 실제 화면 |
| **고침** `/s/oil/1` 메운 판 | 첫 화면 카드의 새 제목 · 카드의 뉴스 한 줄 (꼴 · 자리 · 한 줄 · 다른 카드엔 없음) · "표지 > 카드의 뉴스 한 줄" 크기 견줌 **뺌** → 달력 화면의 줄 `row-oil-1` 이 새 제목 · 거기엔 뉴스 한 줄의 꼴이 없음 · 그 줄을 눌러 표지로 | 첫 화면의 카드 (F-E7 의 카드 뉴스 한 줄 포함)가 시작 화면에 없다 — lab 판에 없는 꼴이라 옮기지 않았다 (_open d). 표지의 뉴스 한 줄 시험 (꼴 · 자리 · 근거)은 그대로 |
| **고침** 긴 이야기 넷 (LIVE) | `bar-home` `/` → **‹ 규칙** (`backOf`) · `.ep-nextup` → `next-up` / `next-episode` (번호 시리즈 · 목록에 다음 화가 있나로 갈림) · `other-*` 주소 · `home-link` **뺌** → `end-go` 말 · 주소 `/days?d=<그날>` · 먹색 단추 하나 · `other-*` · `home-link` · `.ep-restart` · 큰 지도 단추 없음 · 다음 화 줄이 단추 **아래** | 끝 장면 · ‹ 가 바뀌었다. 지도 (작은 글 `open-map`) · 책장의 다른 시리즈 주소 · ghost 시험은 그대로 |
| **고침** 짧은 이야기 둘 (SHORTS) | `bar-home` `/` → ‹ 규칙 · `to-today` `/` **뺌** → `end-go` (말 · 주소) · 끝 장면에서 누를 것 = 단추 하나 · 눌러서 `/days?d=<그날>` · 그날이 골라져 있다 | 같음 |
| **새** 달력 화면 `/days` | 처음 고른 날 = 바로 위 지난 날 (`FIRST`) · 누를 날 = 보이는 달의 낸 날 전부 (가장 새 날 포함) · 눌린 날 하나 · 달 넘기기는 달이 둘 이상일 때만 · 날마다 눌러서 줄 (목록의 차례 · 주소 · 제목 · 번호 규칙 · 편 수) · "그 전" (처음 접힘 · 편 수 · 펴면 낸 날 없는 줄 · 목록의 차례) · `?d=` 낸 날마다 · 엉뚱한 값 넷 (`nope` · `2026-01-01` · `constructor` · `<그날>x`) → 처음 규칙 · ‹ → `/` · **스크립트 없이** (첫 HTML) 처음 고른 날 · `?d=<가장 새 날>` 의 줄 | 새 화면 · 값은 전부 목록에서 |
| **새** 이야기 끝 → 달력 | **목록의 이야기마다** 첫 장 ‹ 의 주소 · 이름 · 가장 새 날의 첫 이야기 + 지난 날의 첫 이야기를 끝까지 (`toEnd` — 긴 · 짧은 둘 다) → 먹색 단추 하나 · 주소 · 없는 것 · 눌러서 그날이 골라진 달력 + 그 줄 · 콘솔 오류 0 | LIVE · SHORTS 는 손으로 고른 이야기들이라 (지금은 다 지난 날) 가장 새 날 쪽 (‹ → `/`)을 못 본다 — 목록에서 고른다 |
| **고침** lab-local "미리 보기는 실제 화면에 새지 않는다" | 주소에 `/days` 더함 | 새 실제 화면 |

**그대로 둔 것**: 번호 링크 (`/?r=`) · 화면 칸은 기름값에만 · 시안 주소 · today.spec (시안의 `to-today` · `to-map` · `cont-rate` 는 lab 의 것) · lab-local 의 나머지.

### 임시 줄 시험 (붙인 그대로)

임시 줄은 `catalog.tsx` 의 `STORIES` 맨 위 (C 만 맨 아래). 앞에 `git pull --no-rebase` ("Already up to date."). F-E8 꼴 — 지금 이야기 파일을 펼쳐 code · id 만 바꾼 새 이야기:
```ts
short({ ...metaGallery, episode_id: "00000000-0000-4000-8000-00000000fe9a", code: "fe9-short" }, { place: "해외", category: "기술", day: "2026-11-19" }),
```
`pnpm exec playwright test e2e/episode.spec.ts e2e/today.spec.ts e2e/lab-local.spec.ts` 로 돌렸다 (23 개).

**0 · 지금 목록** → `23 passed (53.0s)`

**A · 새 날 (11/19) 한 줄** — dump: `day 2026-11-19 top ['card-fe9-short'] rest ['card-suneung-alert', 'card-ai-hacking-tool', 'card-suneung-cheating', 'card-chip-remote', 'card-oil-1', 'card-meta-gallery', 'card-delivery', 'card-fomc', 'card-pipc', 'card-license-notice']`
첫 돌림 — **하나 섰다** (내 새 시험이 놓친 곳):
```
  1) e2e/episode.spec.ts:100:1 › 첫 화면 = 시작 화면 (F-E9 · UX-13b 판) — …
    Error: 없다: 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
    Expected substring: not "사진때문에수억유로라는데,사진을가져간걸까"
    Received string:        "Claro뉴스하나가이야기한편이돼요오늘의이야기1편내정보는누가지키나사진때문에수억유로라는데,사진을가져간걸까해외기술이야기속으로들어가기지난이야기개념지도지금은미리보기예요.아직날마다새이야기를내지는못해요."
  1 failed
  22 passed (50.7s)
```
→ "지난 이야기의 제목이 시작 화면에 없다"를 글자로 봤는데, 임시 줄이 메타를 펼친 것이라 **오늘 이야기와 지난 이야기의 제목이 같았다**. 그날 이야기와 글자가 같은 제목은 빼고 보게 고쳤다 (줄 수 · 차례는 `story-<code>` 로 이미 본다). 고친 뒤 같은 임시 줄로 → **`23 passed (51.4s)`**

**B · 12월 (2026-12-01) 한 줄** (달이 둘 — 달 넘기기가 선다) → **`23 passed (51.8s)`** (e2e 를 고치지 않고)

**C · 거꾸로 — 새 날 (11/19) 줄을 목록 맨 아래에 (틀린 자리)** — 서야 맞다:
```
  ✘   3 e2e/episode.spec.ts:100:1 › 첫 화면 = 시작 화면 (F-E9 · UX-13b 판) — …
    Error: 목록의 차례 = 화면의 차례 (새 이야기는 목록 맨 위에 적는다)
    > 110 |   expect([...TOP, ...REST].map((x) => x.id), "목록의 차례 = 화면의 차례 (새 이야기는 목록 맨 위에 적는다)").toEqual(LIST.all.map((x) => x.id));
  1 failed
  22 passed (53.5s)
```

**줄을 뺐다** — `git diff` 로 임시 줄 하나뿐인 것을 보고 `git checkout -- apps/web/src/episode/catalog.tsx` (그 파일 하나) → `git diff --stat` 빈 것. ⑥ 의 전체 e2e (지금 목록 · 92 통과)가 "줄을 빼고 다시 통과"다.

## ④ 달 넘기기 시험 (임시 목록 — 12월 날 하나 · B 의 줄로 빌드해 눌렀다 · 커밋 안 함)

```
/ 머리 2026-12-01 · 1편 · /short/fe9-short
처음 (/days): 달 11월 · ‹ 못 누름 · › 누름 · 누를 날 2026-11-15 2026-11-17 2026-11-18 · 고른 날 2026-11-18
› 누름: 달 12월 · ‹ 누름 · › 못 누름 · 누를 날 2026-12-01 · 고른 날 2026-11-18
12월 1일 누름: 달 12월 · ‹ 누름 · › 못 누름 · 누를 날 2026-12-01 · 고른 날 2026-12-01
  줄: /short/fe9-short
‹ 누름: 달 11월 · ‹ 못 누름 · › 누름 · 누를 날 2026-11-15 2026-11-17 2026-11-18 · 고른 날 2026-12-01
/days?d=2026-12-01: 달 12월 · ‹ 누름 · › 못 누름 · 누를 날 2026-12-01 · 고른 날 2026-12-01
가장 새 날 이야기의 ‹ → /
11/18 이야기의 ‹ → /days?d=2026-11-18
페이지 오류 0
```
그림: `logs/frontend/F-E9/9-temp-december-nov.png` · `9-temp-december-dec.png` (임시 목록의 그림 — 실제 아님). 처음 달 = 처음 고른 날의 달 (11월) · 끝 달에서 › 는 꺼진다 · 12월 1일은 12월 1일 화요일 칸 (lead 2). 걸리는 것: 달을 넘겨도 아래 줄은 고른 날 (11/18) 그대로다 — lab 규칙 그대로 (_open f).

## ⑤ 폰 그림 · 내 눈으로 본 것

`logs/frontend/F-E9/` (390×844 · 2배). 앞 = 배포 (`2a93a3f` — 옛 실제 화면) · 뒤 = 이 커밋의 빌드 (`next build` + `next start` · 개발 서버 표시 없음).
- 앞: `0-before-1-start` · `0-before-oil-end-top/bottom` · `0-before-suneung-end-top/bottom` · `0-before-rate-end-top/bottom` (`/days` 는 404)
- 뒤: `1-start` · `360-1-start` · `2-days` · `3-days-15-before` (15일 누름 + 그 전 폄) · `4-days-d` (`?d=2026-11-15`) · `5-oil-end-top/bottom` · `6-suneung-end-top/bottom` · `7-rate-end-top/bottom` (다음 화 있는 이야기) · `9-temp-december-*` (④)

**lab 판과 같은지 — 같은 빌드의 `/lab/start*` 를 같은 꼴로 찍어 픽셀을 견줬다** (PIL):
```
1-start vs lab-1-start: size (780, 1688) · 다른 픽셀(>16) 0 · bbox None
2-days vs lab-2-days: size (780, 1688) · 다른 픽셀(>16) 0 · bbox (681, 1040, 703, 1189)
3-days-15-before vs lab-3-days-15-before: size (780, 1688) · 다른 픽셀(>16) 0 · bbox (681, 1040, 703, 1641)
4-days-d vs lab-4-days-d: size (780, 1688) · 다른 픽셀(>16) 0 · bbox (681, 1040, 703, 1213)
360-1-start vs lab-360-1-start: size (720, 1688) · 다른 픽셀(>16) 0 · bbox None
```
(`/days` 의 bbox 는 줄 오른쪽 동그란 → 의 화살표 칸뿐 — lab 은 CSS 마스크 · 실제는 svg 선이라 가장자리 안티에일리어싱이 16/255 안쪽으로 다르다)

재기 (뒤 · 붙인 그대로):
```
/ 200 {"overflowX":0,"page":844,"stories":2,"go":[48,44],"doors":[101,101],"doorsBottom":616,"rows":0,"rowMin":null,"cellMin":null,"endGo":[],"clipped":0}
  머리: 오늘의 이야기 · 이야기: /short/suneung-alert [이야기 속으로 들어가기] · /short/ai-hacking-tool [이야기 속으로 들어가기]
  문: 지난 이야기 → /days · 개념 지도 → /map
/days 200 {"overflowX":0,"page":796,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":6,"rowMin":66,"cellMin":48,"endGo":[],"clipped":0}
  처음 고른 날 2026-11-17 · 누를 날 2026-11-15 2026-11-17 2026-11-18 · 달 넘기기 0
  2026-11-15 누름 → 2026-11-15 최고가격이 그대로면, 주유소 값도 못 넘을까요 | 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
  ?d=2026-11-15 → 고른 날 2026-11-15 11월 15일 일요일 2편
  ?d=2026-11-18 → 고른 날 2026-11-18 11월 18일 수요일 2편
  ?d=nope → 고른 날 2026-11-17 11월 17일 화요일 2편
  ?d=2026-11-16 → 고른 날 2026-11-17 11월 17일 화요일 2편
  달력의 ‹ → /
/s/oil/1 첫 장 ‹ → /days?d=2026-11-15 · 끝 keep · 키 1003 · {"overflowX":0,…,"endGo":[56],"clipped":0}
  누를 것 2: 내 개념 지도 보기 | 다른 이야기 보기 → /days?d=2026-11-15
  끝 단추 "지난 이야기 · Claro" → /days?d=2026-11-15 · 고른 날 2026-11-15
/short/suneung-alert 첫 장 ‹ → / · 끝 keep · 키 796 · {"overflowX":0,…,"endGo":[56],"clipped":0}
  누를 것 1: 다른 이야기 보기 → /days?d=2026-11-18
  끝 단추 "지난 이야기 · Claro" → /days?d=2026-11-18 · 고른 날 2026-11-18
/s/rate/2 첫 장 ‹ → /days · 끝 keep · 키 1064 · {"overflowX":0,…,"endGo":[56],"clipped":0}
  누를 것 2: 내 개념 지도 보기 | 다른 이야기 보기 → /days
  끝 단추 "지난 이야기 · Claro" → /days · 고른 날 2026-11-17
360 / {"overflowX":0,"page":844,"stories":2,"go":[48,44],"doors":[101,101],"doorsBottom":649,"rows":0,"rowMin":null,"cellMin":null,"endGo":[],"clipped":0}
스크립트 없이 / — 머리 11월 18일의 이야기 · 이야기 2 · 문 /days /map
스크립트 없이 /days — 고른 날 2026-11-17 · 수능장 Wi-Fi 차단, 정말 정해진 걸까 | 미국, AI 칩 원격 사용 막았다는데, 접속 금지?
스크립트 없이 /days?d=2026-11-15 — 고른 날 2026-11-15 · 최고가격이 그대로면, 주유소 값도 못 넘을까요 | 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
페이지 오류 0
```
앞 (배포 — 같은 재기): `/` 키 4401 · `/days` 404 · `/s/oil/1` 끝 키 1365 · 누를 것 6 · `/short/suneung-alert` 끝 누를 것 2 (처음부터 다시 · 첫 화면으로 → /) · `/s/rate/2` 끝 키 1479 · 누를 것 6.
lab 의 같은 재기: `/lab/start` 844 · 616 · [48,44] · [101,101] — `/` 와 같다 · `/lab/start/days` 796 · rows 6 · 66 · 48 — `/days` 와 같다 · 끝 견본 `?k=long` 키 1003 — 실제 `/s/oil/1` 끝 1003 과 같다.

**본 것**
- `/` (`1-start`) — lab 판 그대로: Claro · 작은 회색 한마디 · "오늘의 이야기 2편" · 첫 제목 (가장 큰 글) + 먹색 단추 · 둘째 제목 + 테 단추 · 문 둘 · 맨 아래 미리보기 한 줄. 한 장에 다 들고 넘침 · 잘림 0. 360 폭도 한 장 (첫 제목이 두 줄 · 문 아래 끝 649)
- `/days` (`2` · `3` · `4`) — 누를 날 셋이 옅은 동그라미 · 고른 날 먹색 · 줄마다 동그란 → · 두 줄 제목 (메타)도 단추와 안 겹침 · "그 전" 펴면 넷. `?d=2026-11-15` 로 오면 15일이 골라져 있다
- 긴 이야기 끝 (`5-oil-end-*`) — lab 끝 견본 (`/lab/start/end?k=long`)과 같은 꼴: 한 줄 · 지도 · 주운 개념 · 오른쪽 작은 "내 개념 지도 보기 →" · 회색 글 · 맨 아래 먹색 "다른 이야기 보기 →". 다른 시리즈 상자 · 밑줄 글 둘이 사라져 화면 키 1365 → 1003
- 짧은 이야기 끝 (`6-suneung-end-*`) — 글 두 덩이 아래 빈 자리 · 화면 맨 아래 먹색 단추 하나 (lab `12-end-sample-short` 와 같은 자리). 다 읽고 할 일이 하나로 보인다
- 다음 화 있는 이야기 끝 (`7-rate-end-bottom`) — 먹색 단추 아래 회색 한 줄 "**다음 화** 회의록이 나오면 열려요. 10명과 2명이 왜 갈렸는지 같이 볼게요." 단추와 다투지 않는다 (옛 점선 상자는 없다). 두 줄로 접힌다 (_open c)
- 첫 장 ‹ — 11/18 이야기는 `/` · 기름값 (11/15)은 `/days?d=2026-11-15` · 금리 (날 없음)는 `/days`
- 넘침 · 잘림: 가로 넘침 0 · 잘린 글 0 (390 · 360 · 끝 장면 셋)

## ⑥ 검사 결과 (붙인 그대로)

```
$ pnpm -s typecheck                         (exit 0)
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts     (exit 0 · 끝부분)
실제 주소: /short/suneung-alert · /short/ai-hacking-tool · /short/suneung-cheating · /short/chip-remote · /s/oil/1 · /short/meta-gallery · /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 2026-11-18 2 편 · 지난 이야기 8 편
번호 화면 규칙 (D88 E-20): oil 번호 없음 (긴 이야기 1화) · price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
OK — 숫자가 든 글이 없다
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글

$ pnpm -s test                              (exit 0 — 셋째 돌림 · 마지막 코드 그대로)
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  Test Files  15 passed (15)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   92 passed (3.6m)
```
- **앞의 두 돌림은 `packages/pipeline` `p3.test.ts` 5초 시간 초과에서 섰다** (알려진 부하 탓 — 그때 이 Mac 의 `mediaanalysisd` 가 CPU 220 ~ 330% · load 7). 붙인 그대로:
```
packages/pipeline test:  FAIL  test/p3.test.ts > P-3 짓기 — 저장한 모델 출력 · 원문에서 결정적으로 > 두 번 지으면 글자 단위로 같다 (10월 · 9월)
packages/pipeline test: Error: Test timed out in 5000ms.
packages/pipeline test:       Tests  1 failed | 181 passed (182)
```
  그 사이에 그 시험만 시간 한도를 늘려 돌리면 통과 (`✓ … 두 번 지으면 글자 단위로 같다 (10월 · 9월) 5479ms` · 19 passed) · db (101) · web (92) 도 따로 통과. 부하가 내려간 뒤 셋째 돌림이 위의 통과다. `packages/` 는 0줄 (`git diff --stat -- packages/` 빈 것)
- `pnpm -s test` 가 다시 찍은 `logs/frontend/F-2b/` 그림 · 영상은 돌릴 때마다 하나씩 `git checkout -- <파일>` · `apps/web/AGENTS.md` · `CLAUDE.md` 는 생기지 않았다 (개발 서버를 안 띄움 — `next build` + `next start` 로 찍었다)
- Short.tsx 의 지도 조각 겹침을 정리한 뒤 (화면 0 변화) typecheck · e2e 셋 (`23 passed (51.6s)`) · 위 셋째 전체 돌림을 다시 했다

## ⑦ 배포 확인

(push 뒤 — 아래에 붙인다)

## ⑧ _open

- **a `/lab/local` 미리 보기의 끝은 옛 꼴 그대로다** (지시문대로). 도윤이 "오늘 이야기"의 멈춤 2 에서 폰으로 읽을 때 끝에 다른 시리즈 · 처음부터 다시 · 첫 화면으로가 보이고, 올린 뒤의 실제 끝 (먹색 단추 하나)과 다르다. 미리 보기에도 `exits` 를 줄지 (그 이야기는 아직 목록에 없어 날을 meta.json 의 day 로 셈해야 한다) — 따로 정할 일
- **b `/days` 는 요청마다 그린다** (정적이 아니다 — `?d=` 를 첫 HTML 에 넣으려고). 깜박임 없이 맞는 길을 골랐다. 데이터베이스 0 · Vercel 함수가 한 번씩 돈다. 정적으로 두려면 `?d=` 를 클라이언트가 읽는 길 (처음엔 다른 날이 보였다 바뀜) · `/days/<날>` 같은 정적 주소 (지시문의 `?d=` 와 다름) 둘이 있다
- **c 다음 화 줄의 꼴은 lab 에 없던 것이다** (D148 PM "단추 아래 조용한 한 줄"을 내가 그렸다): 회색 14px · 머리 "다음 화"만 진한 회색 · 목록에 다음 화가 실제로 있으면 같은 줄이 링크 (`next-episode` — 지금 목록엔 그런 이야기가 없어 그림 없음). 금리 2화의 예고는 두 줄로 접힌다
- **d 시작 화면에 뉴스 한 줄 (F-E7 · D127 의 카드 뉴스 한 줄)이 없다** — lab 판에 없어 옮기지 않았다. 오늘 묶음에 `screen.news` 가 있는 긴 이야기가 오면 시작 화면의 제목 위에는 안 보인다 (표지에는 보인다). 되살릴지는 도윤 · PM
- **e 첫 장 ‹ 의 읽기 도구 이름** — 달력으로 갈 때 "지난 이야기" (`CHROME.chrome.days` — 달력 화면 제목 그대로). 눈에는 안 보이는 글
- **f 달을 넘겨도 아래 줄은 고른 날 그대로다** (lab 규칙 · ④). 12월로 넘기면 달력은 12월인데 줄은 11/18. 넘긴 달의 첫 누를 날을 골라 줄지는 따로
- **g 금리 2화처럼 낸 날이 없는 이야기의 끝** → `/days` (처음 고른 날 11/17) · ‹ 도 `/days`. 그 이야기는 "그 전"에 접혀 있어 돌아와도 안 보인다. "그 전"을 펼쳐 둔 채로 보낼지 (`?d=before` 같은 것)는 따로
- **h `pnpm -s test` 의 p3 시간 초과** — ⑥. 부하가 높을 때 두 번 섰고 (5.5초 > 5초) 부하가 내려간 뒤 통과. 이 Step 과 상관없는 곳이지만 한도가 빠듯하다
- UX-13b 의 _open 중 그대로 남은 것: b (오늘 이야기 셋 · 넷이면 한 장을 넘음) · f (달력 제목 "지난 이야기"인데 가장 새 날도 있음 · 이야기 끝에서 돌아오는 곳이 되어 더 어긋남) · h (문 아래 빈 자리 · 같은 단추 말 두 번)
