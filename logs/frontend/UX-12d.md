# logs/frontend · UX-12d — 진짜 달력 꼴 (D142)

## UX-12d · 2026-11-18 · 서브에이전트 (UX-12 세션에 이어서) · 검수 대기(PM) → 도윤

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`) · **모델 API 0** · `docs/PM.md` 안 읽음.
도윤: "아니면 실제로 달력 모양으로 해서 하는 건 어떰. 지금은 세로로 줄 세운 건데."
고친 파일: `apps/web/src/app/lab/home-days/HomeDays.tsx` (판 `e` — `DaysCalendar` 더함 · 띠의 길) · `days.ts` (`monthOf` · `monthKeys` 더함) · `home-days.css` (`.hf-*` 더함 — `.hd-*` · `.hc-*` · `.he-*` 0줄). 새 파일: `Calendar.tsx` (`"use client"` — 날 고르기) · `e/page.tsx` · `shots-d.ts` · 이 로그 · 그림 `logs/frontend/UX-12d/`.

**한 줄 답**: 이번 달 7칸 달력 (칸 = 날 숫자 + 이야기가 있으면 점 하나) + 그 아래 고른 날의 이야기 둘쯤. 처음부터 11월 17일이 골라져 있어 제목이 바로 보인다. **지난 칸의 키가 언제나 같다** (603px — 지금도 · 일주일 쌓여도 · 한 달 쌓여도). 지금 (날 셋)은 달력 서른 칸 가운데 셋만 진해서 **조금 비어 보인다**. 일주일 쌓인 견본은 점이 줄지어 서서 달력다워진다.

## ① 주소

- 달력 판: `/lab/home-days/e` · 일주일 견본 `/lab/home-days/e?many=1`
- 견줌: `/lab/home-days/d` (그대로 — 띠에 "달력 판" 길 하나만 더함). 띠에서 d ↔ e · 견본을 오간다. `/a` · `/b` · `/c` 는 띠까지 그대로

## ② 달력 꼴 (무엇을 · 까닭)

| | 꼴 | 까닭 |
|---|---|---|
| **달력** | 머리 "11월" · 요일 줄 (일 ~ 토 · 작은 회색) · 7칸 격자 · 칸 48px (360 폭에서 칸 폭 약 45px) | 달력 앱의 꼴 그대로. 달 · 1일의 요일 · 날 수는 달력의 셈 (`days.ts monthOf` — UTC) |
| **칸 표시** | 날 숫자 + 이야기가 있으면 **아래 점 하나** (편 수는 안 적는다) | 칸이 45px 라 글이 안 든다. 점 여럿 (편마다 하나)도 생각했지만 하루 둘쯤이라 정보가 거의 없고 눈만 바쁘다. 편 수는 고른 날 목록 머리의 "2편"이 말한다 |
| **이야기 있는 날** | 숫자가 먹색 · 굵게 · `button` (`aria-pressed` · 이름 "11월 17일 화요일, 이야기 2편") | 누를 수 있는 날만 진하다 |
| **빈 날** | 숫자가 옅은 회색 · **누를 수 없다** (`button` 이 아니다) | "이날은 이야기가 없어요"를 보려고 누르게 하는 것보다 처음부터 누를 곳이 아닌 게 조용하다. 앞으로 올 날 (19일 ~)도 같은 꼴 — 따로 가르지 않았다 |
| **고른 날** | **먹색 동그라미** (숫자는 종이색) | 강조를 한 곳에 — 색은 먹 그대로 (감색을 쓰지 않았다: 지난 칸의 색 있는 글자는 머리 "지난 이야기" 하나 그대로) |
| **처음 고른 날** | **바로 위 지난 날** (지금 11/17) — 서버가 그 목록까지 그려 보낸다 (스크립트 없이도 제목 둘이 보인다 — 아래 재기) | d 의 "바로 위 지난 날 펼침"과 같은 뜻. 목록이 비어 보이지 않게 |
| **"오늘" (가장 새 날)** | **가는 먹색 테** (11/18). 눌 수 있다 → 그날 이야기 둘이 같은 줄 꼴로 + 회색 "맨 위에 있는 이야기예요" | 테만 있고 안 눌리면 가장 눈에 띄는 칸이 죽은 칸이 된다. 맨 위 오늘 묶음과 겹치지만 달력은 "언제 무엇이 있었나"라 빠지면 이상하다. **"오늘"이라고 적지 않았다** — 테는 가장 새 `day` 지 읽는 날이 아니다 (정적 페이지 · _open b) |
| **고른 날 목록** | 머리 "11월 17일 화요일 · 2편" (15px) + 줄 (c · d 의 줄 그대로 — 제목 + 회색 한 줄 · `.hc-row` 를 그대로 쓴다) · `aria-live="polite"` | 줄은 손대지 않았다. 달력 아래라 폭이 넓어 d 에서 두 줄이던 제목이 한 줄로 돌아왔다 |
| **"그 전"** | 달력 **밖** · 목록 아래 접힌 한 줄 ("그 전 · 4편 ⌄" — `<details>` · 자바스크립트 없음) | 날짜가 없는 넷이다 — 달력 칸에 넣으면 날짜를 지어내는 것 |
| **달 넘기기** | 이야기가 있는 달이 **둘 이상일 때만** 머리 오른쪽에 ‹ › 가 선다 (지금은 11월뿐이라 없다) | 갈 곳 없는 화살표를 두지 않는다. **견본도 11/11 ~ 11/17 이라 11월 안이다 — 화살표는 화면에서 본 적이 없다** (코드만 있다 · _open a) |
| 상자 · 빨간 글 · 줄마다 꺾쇠 · 새 색 · 이어지는 이야기 칸 | 없음 | d 그대로 |

## ③ 폰 그림 · 내 눈으로 본 것 (d ↔ e)

`logs/frontend/UX-12d/` (390×844 · 같은 자리): `1-rest` 지난 칸 첫 화면 · `2-other` 다른 날을 누른 뒤 (d: 15일을 더 펼침 · e: 15일을 누름) · `3-many` 일주일 견본 · `4-newest-before-e` 가장 새 날을 누르고 "그 전"을 편 것 · `5-whole` 지난 칸 통째 · `360-1-rest` 360 폭.

- **지금 (날 셋뿐) 달력이 비어 보이나 — 조금 그렇다.** `1-rest-e`: 서른 칸 가운데 15 · 17 · 18 셋만 진하고 나머지 스물일곱은 옅은 회색 숫자다. 못생기지는 않았다 (달력은 원래 그렇다) — 그러나 **이야기 여섯 편을 보이려고 달력 (머리 · 요일 줄 · 다섯 줄 — 약 320px)을 쓴다.** 같은 내용이 d 에서는 370px 전체다. 지금은 e 가 d 보다 **길다** (603 ↔ 370px)
- **일주일 쌓이면** (`3-many-e`): 11 ~ 18 에 점이 줄지어 서고 진한 숫자가 두 줄을 채운다 — 달력다워진다. 키는 그대로 603px. d 는 755px 로 늘어 있다. **쌓일수록 e 가 이긴다** — 한 달이면 d 는 날짜 줄 서른 (2,000px 넘게), e 는 여전히 603px
- **d 보다 예쁜가**: 꼴 자체는 e 가 더 "물건" 같다 — 익숙한 달력이고 고른 날 동그라미 · 테 · 점의 위계가 깨끗하다. 다만 **첫눈에 들어오는 것이 이야기 제목이 아니라 숫자 서른 개다.** d 는 지난 칸에 들어서자마자 제목이 보이고, e 는 달력을 지나 아래 (지난 칸 머리에서 약 410px 아래)에서 제목이 나온다. Claro 의 주인공은 날짜가 아니라 이야기다 — 내 눈에는 **지금 분량에서는 d 가 낫고, 날이 두 주쯤 쌓이면 e 가 낫다**
- **한 번 더 누르는 값이 큰가**: 어제 것은 값이 없다 (처음부터 보인다). **그 앞날은 d 와 같다** — d 도 접힌 날은 눌러야 한다. 다른 점: d 는 여러 날을 **같이** 펼쳐 둘 수 있고, e 는 **한 번에 하루**다 (다른 날을 누르면 앞의 목록이 바뀐다). 그리고 e 는 누르는 곳 (달력)과 바뀌는 곳 (아래 목록)이 떨어져 있다 — 390×844 에서는 둘이 한 화면에 들어서 바뀌는 것이 보인다 (`2-other-e`)
- **넘침 · 잘림**: 가로 넘침 0 · 잘린 글 0 (390 · 360). 360 에서 칸 폭 약 45px · 칸 키 48px — 누를 곳은 손가락 크기
- **접근성**: 날 칸은 `button` · `aria-pressed` · 이름 "11월 17일 화요일, 이야기 2편" (가장 새 날은 ", 가장 새 이야기") · 키보드 Enter 로 고름 (아래 재기) · 목록은 `aria-live`. 화면 읽기 프로그램으로 직접 들어 보지는 않았다
- 그림 왼쪽 아래 검은 "N" 은 개발 서버의 표시 (배포에는 없다)

재기 (`shots-d.ts` 출력 그대로 — rest = 지난 이야기 칸의 키 px · e 의 foldMin = 달력 칸 키):
```
1-rest-d 200 {"overflowX":0,"rest":370,"rows":8,"rowMin":64,"foldMin":76,"clipped":0}
3-many-d 200 {"overflowX":0,"rest":755,"rows":18,"rowMin":64,"foldMin":76,"clipped":0}
1-rest-e 200 {"overflowX":0,"rest":603,"rows":6,"rowMin":66,"foldMin":48,"clipped":0}
e 처음 고른 날 2026-11-17 · 11월 17일 화요일, 이야기 2편
e 2026-11-15 누름 → 2026-11-15 최고가격이 그대로면, 주유소 값도 못 넘을까요 | 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
e 가장 새 날 누름 → 11월 18일 수요일
2편
맨 위에 있는 이야기예요
e 키보드 Enter (17일) → 2026-11-17
e 첫 줄 → /short/suneung-cheating
3-many-e 200 {"overflowX":0,"rest":603,"rows":6,"rowMin":66,"foldMin":48,"clipped":0}
e-many 처음 고른 날 2026-11-17 · 11월 17일 화요일, 이야기 2편
e-many 2026-11-14 누름 → 2026-11-14 해킹은 당한 건데, 왜 회사가 벌을 받을까 | 면허 정지가 취소됐다는데, 잘못이 없었다는 걸까
폭 390 페이지 오류 0
360-1-rest-d 200 {"overflowX":0,"rest":370,"rows":8,"rowMin":64,"foldMin":76,"clipped":0}
360-3-many-d 200 {"overflowX":0,"rest":755,"rows":18,"rowMin":64,"foldMin":76,"clipped":0}
360-1-rest-e 200 {"overflowX":0,"rest":603,"rows":6,"rowMin":66,"foldMin":48,"clipped":0}
360-3-many-e 200 {"overflowX":0,"rest":603,"rows":6,"rowMin":66,"foldMin":48,"clipped":0}
폭 360 페이지 오류 0
스크립트 없이 e — 고른 날 2026-11-17 · 제목 수능장 Wi-Fi 차단, 정말 정해진 걸까 | 미국, AI 칩 원격 사용 막았다는데, 접속 금지?
```
(e 의 rows 6 = 화면에 그려진 줄: 고른 날 둘 + "그 전" 넷. 나머지 날의 줄은 누를 때 그린다)

## ④ 실제 `/` 0 변화

커밋 전 `git status --short` (`.claude/launch.json` 은 남의 것 — 안 건드림 · 안 실음):
```
 M apps/web/src/app/lab/home-days/HomeDays.tsx
 M apps/web/src/app/lab/home-days/days.ts
 M apps/web/src/app/lab/home-days/home-days.css
?? .claude/launch.json
?? apps/web/src/app/lab/home-days/Calendar.tsx
?? apps/web/src/app/lab/home-days/e/
?? apps/web/src/app/lab/home-days/shots-d.ts
?? logs/frontend/UX-12d.md
?? logs/frontend/UX-12d/
```
`git diff --stat HEAD -- apps/web/src/app/page.tsx apps/web/src/app/home.css apps/web/src/episode apps/web/e2e apps/web/src/app/lab/home-days/a apps/web/src/app/lab/home-days/b apps/web/src/app/lab/home-days/c apps/web/src/app/lab/home-days/d packages fixtures docs/contract` → (빈 줄)
- `/a` ~ `/d`: 그 판들의 부품 · css (`.hd-*` · `.hc-*` · `.he-*`) 0줄. 달라진 것은 d 의 띠에 "달력 판" 길 하나. 그림의 `-d` 재기가 UX-12c 의 d 와 같다 (370 · 755)
- e2e 의 지금 시험 90 그대로 통과 (⑤) · 새 e2e 없음
- `pnpm -s test` 가 다시 찍은 `logs/frontend/F-2b/` 그림 7 은 하나씩 `git checkout -- <파일>` · 내 개발 서버가 만든 `apps/web/AGENTS.md` · `CLAUDE.md` 는 지움

## ⑤ 검사 결과

```
$ pnpm -s typecheck                  (exit 0)
apps/web typecheck: Done

$ pnpm -s test                       (첫 번째 — exit 1)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  ❯ test/p3.test.ts (19 tests | 1 failed) 7000ms
packages/pipeline test:       Tests  1 failed | 181 passed (182)

$ pnpm --filter @claro/pipeline test (그것만 다시 — 아무것도 안 고치고)
 Test Files  15 passed (15)
      Tests  182 passed (182)

$ pnpm -s test                       (두 번째 — exit 0)
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  Test Files  15 passed (15)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   90 passed (3.5m)

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts     (exit 0)
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
```
- **첫 번째 돌림에서 `packages/pipeline` 의 `test/p3.test.ts` 하나가 떨어졌다** (7000ms 가 찍혔다 — 어느 시험인지 · 왜인지는 그때 출력을 걸러 읽느라 못 봤다). 이번 일은 `packages/` 를 건드리지 않았고 (`git status --short packages` 빈 줄), 아무것도 안 고치고 다시 돌리니 두 번 다 통과했다. 시간에 걸리는 시험으로 보이지만 **확인한 것은 아니다** (_open h)
- 폰 그림은 개발 서버 (`next dev -p 3212` · 따로 둔 빌드 폴더)에서. 서버는 껐고 빌드 폴더는 지웠다

## ⑥ 실제로 옮길 때 할 일 (UX-12 ⑥ · UX-12c ⑥ 에 더해)

1. **실제 `/` 에 클라이언트 부품이 처음 생긴다** — 지금 `/` 는 `force-static` 이고 스크립트는 머리의 "오늘의 이야기" 한 줄뿐이다. `Calendar.tsx` 를 `src/episode/home/` 로 옮기면 페이지는 여전히 정적이지만 (첫 HTML 에 처음 고른 날의 목록이 실린다) React 가 그 섬을 살려야 한다. 달력에 실리는 것 (모든 날의 줄 — 제목 · 주제 이름 · 주소)이 페이지 데이터로 같이 간다: 한 달 60편쯤이면 몇 KB
2. **달 넘기기를 실제로 본다** — 12월 1일 이야기가 올라오는 날 처음 화살표가 선다. 그 전에 두 달짜리 목록으로 시험 (e2e — `e2e/stories.ts` 처럼 임시 줄) · 처음 보이는 달 = 처음 고른 날의 달
3. **"가장 새 날"의 테를 "오늘"로 읽게 둘지** — 실제로 옮기면 머리의 `TODAY_SCRIPT` 처럼 읽는 기기의 한국 날짜와 견줘 그날 칸에 테를 두를 수 있다 (그러면 진짜 "오늘"이다). 지금 시안은 가장 새 `day` 에 두른다
4. **e2e** — 지난 이야기 카드 (`card-<code>`)를 보는 시험이 달력으로 바뀐다: 점 있는 칸 = 목록의 날들 · 처음 고른 날 = 바로 위 지난 날 · 칸을 누르면 그날 줄 · 빈 날은 `button` 이 아니다 · "그 전"은 달력 밖 · 스크립트 없이도 처음 목록이 있다
5. **화면 글** → `home-copy.ts`: "{m}월" · 요일 일곱 · "{n}편" · "맨 위에 있는 이야기예요" · "앞 달" · "다음 달" · 칸 이름 "{day}, 이야기 {n}편" · "그 전". (S4 "home-copy 에 숫자 없음"은 `{n}` · `{m}` 이라 안 걸린다)
6. 묶는 것 (`monthOf` · `monthKeys` · `dayParts`) → `catalog.tsx` 의 `bundle` 곁 · `.hf-*` + 줄 `.hc-row*` → `home.css`. 나머지 판 (가 · 나 · 담백 · 날짜)은 그때 지운다
7. 이어지는 이야기 칸 빼기는 UX-12c ⑥ 1 ~ 5 그대로

## ⑦ _open

- **a 달 넘기기를 화면에서 못 봤다** — 지금도 견본도 11월 안이다. 코드 (`Calendar.tsx` 의 ‹ ›)는 있지만 눈으로 본 적 · 눌러 본 적이 없다. 견본을 지난달까지 늘리지는 않았다 (지시의 견본은 "지난 7일")
- **b 테 = 가장 새 날이지 읽는 날이 아니다** — 내일 새 이야기가 안 올라오면 테는 어제에 남는다. 그래서 "오늘"이라고 적지 않았다 (⑥ 3)
- **c 지금은 비어 보인다 · 제목이 달력 아래로 밀린다** (③) — 날이 쌓이기 전 몇 주를 어떻게 넘길지: 달력을 한 주 · 두 주만 보이는 꼴 (이야기가 있는 주만)이 사이 답일 수 있다. 만들지 않았다
- **d 한 번에 하루** — d 처럼 여러 날을 같이 펼쳐 볼 수 없다
- **e 앞으로 올 날과 지난 빈 날이 같은 꼴** — 19일 ~ 30일도 옅은 숫자다. 더 옅게 가를 수 있지만 톤이 셋이 된다
- **f 실제 `/` 에 첫 클라이언트 부품** (⑥ 1) — 지금까지 첫 화면은 React 없이도 다 됐다. 달력은 날 고르기에 스크립트가 꼭 필요하다 (없으면 처음 고른 날 + "그 전"만 보인다)
- **g 국내 / 해외 빠짐 · 긴 이야기가 묻힘 · 금리 시리즈 줄 사라짐** — UX-12b · UX-12c _open 그대로
- **h `packages/pipeline` `test/p3.test.ts` 가 한 번 떨어졌다** (⑤) — 다시 돌리면 통과. 이번 일과 닿는 데가 없다. 까닭은 안 캤다 (범위 밖)
