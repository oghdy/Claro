# logs/frontend · UX-12c — 이어지는 이야기 빼고 · 날짜마다 구분되게 (D140)

## UX-12c · 2026-11-18 · 서브에이전트 (UX-12 세션에 이어서) · 검수 대기(PM) → 도윤

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`) · **모델 API 0** · `docs/PM.md` 안 읽음.
도윤: "저 이어지는 이야기 부분이 꼭 있어야 할까. 저거 없는 게 더 이쁠 것 같은데. 그리고 그 날짜마다 좀 구분 가게 더 예쁘게."
고친 파일: `apps/web/src/app/lab/home-days/HomeDays.tsx` (판 `d` — `DaysDated` 더함 · d 에서 이어지는 이야기 칸 없음 · 띠의 길) · `days.ts` (`dayParts` 더함) · `home-days.css` (`.he-*` 더함 — `.hd-*` · `.hc-*` 0줄). 새 파일: `d/page.tsx` · `shots-c.ts` · 이 로그 · 그림 `logs/frontend/UX-12c/`.

**한 줄 답**: 날짜가 글 한 줄에서 **왼쪽 칸의 큰 숫자**가 됐다 ("17" + 작은 "11월 · 화"). 그날의 이야기는 오른쪽 칸에 놓인다 — 날마다 왼쪽 숫자 하나 + 오른쪽 한 덩이. 펼친 날은 숫자가 먹색, 접힌 날은 회색. 이어지는 이야기 칸은 d 에 없다 — 지난 이야기 다음이 바로 개념 지도다.

## ① 주소

- 날짜 판: `/lab/home-days/d` · 일주일 견본 `/lab/home-days/d?many=1`
- 견줌: `/lab/home-days/c` (그대로 — 띠에 "날짜 판" 길 하나만 더함). 띠에서 c ↔ d · 견본을 오간다. `/a` · `/b` 는 띠까지 그대로

## ② 날짜 꼴 · 이어지는 이야기 뺀 자리

**날짜 꼴 (c → d)**:

| | 담백 판 (c) | 날짜 판 (d) | 까닭 |
|---|---|---|---|
| 날짜 | 글 한 줄 "11월 17일" (17px) | **왼쪽 칸 (58px)에 큰 날 숫자** "17" (28px · 800) + 아래 작은 "11월 · 화" (11.5px) | 날이 바뀌는 자리가 글이 아니라 **모양**으로 걸린다. 달은 줄마다 같아서 작게, 날 숫자만 크게. 요일은 날짜에서 계산 (`days.ts dayParts` — 달력의 날을 UTC 로 센다 · 지어낸 것 없음) |
| 이야기의 자리 | 날짜 줄 **아래** (왼쪽 끝이 날짜와 같다) | 날짜 **오른쪽 칸** (첫 제목이 숫자와 같은 높이에서 시작) | c 는 날짜와 제목이 같은 왼쪽 줄에 서서 크기 차이로만 갈렸다. d 는 왼쪽 칸 = 날 · 오른쪽 칸 = 이야기 — 칸이 다르다 |
| 펼친 날 / 접힌 날 | 날짜 글의 톤 (먹 ↔ 짙은 회색) — 차이가 작았다 (UX-12b _open b) | **숫자가 먹색 ↔ 회색** (`ink` ↔ `muted`) · 접힌 날은 오른쪽에 "2편"만 | 28px 숫자라 톤 차이가 한눈에 보인다. 바탕 · 세로 줄은 더하지 않았다 (담백) |
| 접힌 날의 키 | 58px | 76px | 숫자 + 달 · 요일 두 층이 들어가야 해서. 한 화면에 드는 날은 줄지만 (견본 지난 칸 648 → 755px) 날 하나하나가 덩이로 읽힌다 |
| 펼친 날의 "2편" | 보임 | 숨김 | 그 자리에 제목이 온다 (아래에 이야기가 그만큼 보인다) |
| "그 전" | 날짜와 같은 글 | 숫자 자리에 "그 전" (15px · 숫자 없음 · 달 · 요일 없음) | 날이 아니라서 숫자를 지어내지 않는다. 같은 왼쪽 칸에 서서 꼴은 이어진다 |
| 줄 (제목 + 회색 한 줄) | — | **c 그대로** (글 · 크기 · 색) | 담백은 지킨다 |
| 상자 · 빨간 글 · 줄마다 꺾쇠 · 새 색 | 없음 | **없음** | 그대로. 지난 칸의 색 있는 글자는 머리 "지난 이야기" 하나 |

**치른 값**: 오른쪽 칸이 왼쪽 칸 (58px) + 꺾쇠 자리 (28px)만큼 좁아져 **긴 제목이 두 줄이 된다** (390 에서 "미국, AI 칩 원격 사용 막았다는데, 접속 / 금지?" · "최고가격이 그대로면, 주유소 값도 못 / 넘을까요" — c 에서는 한 줄). 잘리지는 않는다.
**누르는 곳**: 접힌 날은 줄 전체 (76px). 펼친 날은 왼쪽 날짜 칸 (58×76) · 오른쪽 꺾쇠가 접기 · 제목 줄은 그 이야기로 (64px 이상) — 펼친 날의 접는 자리가 c 보다 좁다 (_open c).

**이어지는 이야기 뺀 자리**: d 에서는 그 칸 (머리 · 한마디 · 금리 시리즈 카드 — 폰 한 장쯤)이 통째로 없다. 지난 이야기의 마지막 선 다음 44px (`.hm .td-sec` 의 원래 간격 그대로) 뒤에 개념 지도의 먹색 판이 온다 (`5-below-c` ↔ `5-below-d`). 여백을 따로 손대지 않았다 — 종이 → 선 목록 → 먹색 판으로 넘어가는 자리가 어색하지 않았다. 개념 지도 · 소개 · 맨 아래 글은 실제 그대로.

## ③ 폰 그림 · 내 눈으로 본 것

`logs/frontend/UX-12c/` (390×844 · 같은 자리 · `-c` ↔ `-d`): `1-rest` 지난 칸 첫 화면 · `2-open2` 하나 더 펼친 것 · `3-many` 일주일 견본 · `4-whole` 지난 칸 통째 · `5-below` 지난 칸 아래 (다음 칸으로 넘어가는 곳) · `360-1-rest` 360 폭.

- **날이 한 덩이씩 갈리나 — 그렇다.** `3-many-d` 는 왼쪽에 17 · 16 · 15 … 11 이 세로로 서서 달력처럼 읽힌다. `3-many-c` 는 같은 꼴의 글 줄 아홉이라 날이 "목록의 줄"이었다
- **펼친 날 / 접힌 날**: `2-open2-d` 에서 먹색 숫자 (17 · 15) ↔ 회색 "그 전", `3-many-d` 에서 먹색 17 ↔ 회색 16 ~ 11 — 한눈에 갈린다 (c 의 _open 이 풀렸다)
- **c 보다 예쁜가**: 내 눈에는 그렇다 — 큰 숫자가 리듬을 만든다. 다만 **"11월 · 화"가 날마다 되풀이**돼 견본에서는 "11월"이 여덟 번 보인다 (작고 옅지만 되풀이는 되풀이 · _open a)
- **여전히 담백한가**: 상자 · 색 · 꺾쇠는 c 그대로라 담백하다. c 보다 **글자 무게는 늘었다** (28px 숫자) · 지난 칸은 조금 길어졌다 (지금 353 → 370px · 견본 648 → 755px). 대신 이어지는 이야기 칸이 빠져 화면 전체는 한 장쯤 짧아졌다
- **이어지는 이야기 뺀 자리** (`5-below-d`): 지난 칸 → 개념 지도로 바로 넘어간다. 빈 자리 · 겹침 없음. 솔직히: 금리가 이어지는 이야기라는 것 · 다음 날짜 예고 ("11월 18일 무렵")는 첫 화면에서 사라진다 (_open b)
- **넘침 · 잘림**: 가로 넘침 0 · 잘린 글 0 (390 · 360). 360 에서도 숫자 칸 · 제목 · 꺾쇠가 안 겹친다
- 그림 왼쪽 아래 검은 "N" 은 개발 서버의 표시 (배포에는 없다)

재기 (`shots-c.ts` 출력 그대로 — rest = 지난 이야기 칸의 키 px):
```
1-rest-c 200 {"overflowX":0,"rest":353,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
2-open2-c {"overflowX":0,"rest":498,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
3-many-c 200 {"overflowX":0,"rest":648,"rows":18,"rowMin":66,"foldMin":58,"clipped":0}
1-rest-d 200 {"overflowX":0,"rest":370,"rows":8,"rowMin":64,"foldMin":76,"clipped":0}
2-open2-d {"overflowX":0,"rest":501,"rows":8,"rowMin":64,"foldMin":76,"clipped":0}
d 첫 줄 → /short/suneung-cheating
3-many-d 200 {"overflowX":0,"rest":755,"rows":18,"rowMin":64,"foldMin":76,"clipped":0}
폭 390 페이지 오류 0
360-1-rest-c 200 {"overflowX":0,"rest":353,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
360-3-many-c 200 {"overflowX":0,"rest":648,"rows":18,"rowMin":66,"foldMin":58,"clipped":0}
360-1-rest-d 200 {"overflowX":0,"rest":370,"rows":8,"rowMin":64,"foldMin":76,"clipped":0}
360-3-many-d 200 {"overflowX":0,"rest":755,"rows":18,"rowMin":64,"foldMin":76,"clipped":0}
폭 360 페이지 오류 0
```

## ④ 실제 `/` 0 변화

커밋 전 `git status --short` (`.claude/launch.json` 은 남의 것 — 안 건드림 · 안 실음):
```
 M apps/web/src/app/lab/home-days/HomeDays.tsx
 M apps/web/src/app/lab/home-days/days.ts
 M apps/web/src/app/lab/home-days/home-days.css
?? .claude/launch.json
?? apps/web/src/app/lab/home-days/d/
?? apps/web/src/app/lab/home-days/shots-c.ts
?? logs/frontend/UX-12c.md
?? logs/frontend/UX-12c/
```
`git diff --stat HEAD -- apps/web/src/app/page.tsx apps/web/src/app/home.css apps/web/src/episode apps/web/e2e apps/web/src/app/lab/home-days/a apps/web/src/app/lab/home-days/b apps/web/src/app/lab/home-days/c packages fixtures docs/contract` → (빈 줄)
- `/a` · `/b` · `/c`: `DaysOpen` · `DaysFold` · `DaysPlain` · `.hd-*` · `.hc-*` 0줄 · 이어지는 이야기 칸 그대로 (`cont` 는 d 에서만 빈다). 달라진 것은 c 의 띠에 "날짜 판" 길 하나. 그림의 `-c` 재기가 UX-12b 의 c 와 같다 (353 · 498 · 648)
- e2e 의 지금 시험 90 그대로 통과 (⑤) · 새 e2e 없음
- `pnpm -s test` 가 다시 찍은 `logs/frontend/F-2b/` 그림 7 은 하나씩 `git checkout -- <파일>` · 내 개발 서버가 만든 `apps/web/AGENTS.md` · `CLAUDE.md` 는 지움

## ⑤ 검사 결과

```
$ pnpm -s typecheck                  (exit 0)
apps/web typecheck: Done

$ pnpm -s test                       (exit 0)
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
- 폰 그림은 개발 서버 (`next dev -p 3212` · 따로 둔 빌드 폴더)에서. 서버는 껐고 빌드 폴더는 지웠다

## ⑥ 실제로 옮길 때 할 일 (UX-12 로그 ⑥ 에 더해)

1. **이어지는 이야기 칸을 `app/page.tsx` 에서 뺀다** — `cont` 셈 · 그 `<section className="td-sec hm-cont">` 통째. 그러면 `page.tsx` 에서 `nextOf` · `realPath` · `latestPerSeries` 가운데 **`nextOf` · `realPath` 는 안 쓰게 된다** (`latestPerSeries` 는 개념 지도의 `topics` 가 쓴다 · `numbered` 는 작은 줄의 "N화"가 쓴다). `catalog.tsx` 의 `nextOf` 자체는 남는다 — 회차 화면 (`kit/Episode.tsx`)이 쓴다
2. **화면 글** `home-copy.ts` 의 `contLabel` · `contNote` · `contNext` · `contGo` 가 실제에서 안 쓰이게 된다 (시안 `/lab/today` 는 제 `copy.ts` 를 쓴다 — 거기는 그대로)
3. **css** — `home.css` 의 `.hm-cont` · `.hm-h2` 는 이 칸만 쓴다 (지울 수 있다). `today.css` 의 `.td-series*` · `.td-next` · `.td-secnote` 는 시안 `/lab/today` 가 쓰니 남긴다
4. **e2e** — `episode.spec.ts` 가 실제 `/` 의 `[data-testid^=cont-]` 가 `LIST.cont` 와 같은지 · `cont-rate` 의 시리즈 줄을 본다 (134 ~ 줄) → 그 대목을 "이어지는 이야기 칸이 없다"로 바꾼다. `e2e/stories.ts` · `stories-dump.ts` 의 `cont` 값은 `today.spec.ts` (시안 `/lab/today` — 칸이 남는다)가 쓰니 지우지 않는다
5. **금리가 이어진다는 것을 첫 화면에서 어디에 남길지** — 작은 줄의 회색 "금리는 어디로 · 2화 · 긴 이야기"가 유일한 자취가 된다. 다음 화 예고 (날짜가 잡힌 것)는 회차 화면의 "이어짐" 장면에만 남는다
6. **날짜 꼴** — `dayParts` 를 `catalog.tsx` 의 묶는 함수 곁으로 · `.he-*` → `home.css` · "{m}월" · "그 전"을 `home-copy.ts` 로. 접힌 판 가 · 나 · 담백 (`DaysOpen` · `DaysFold` · `DaysPlain` · `.hd-*` · `.hc-*`)은 그때 지운다
7. **맨 위 오늘 묶음의 머리** ("오늘의 이야기" / "11월 18일의 이야기")는 글 한 줄 그대로다 — 아래 지난 칸만 큰 숫자가 된다. 둘을 맞출지 (오늘도 숫자로)는 정하지 않았다 (_open d)

## ⑦ _open

- **a "11월"의 되풀이** — 날마다 "11월 · 화". 달을 빼고 요일만 두면 ("화") 더 담백하지만 달이 바뀌는 주에 (11/30 → 12/1) 어느 달인지가 안 보인다. 달이 바뀌는 날에만 달을 적는 규칙도 가능 — 만들지 않았다
- **b 이어지는 이야기가 빠지면 잃는 것** — 금리의 시리즈 줄 (0화 · 1화 · 2화) · 다음 이야기 날짜 예고 · "뉴스는 한 번으로 끝나지 않아요" 한마디. 도윤의 말대로 뺐다. D79 ("시리즈는 결과다")의 첫 화면 자취가 작은 줄의 "2화"만 남는다
- **c 펼친 날의 접는 자리가 좁다** — 왼쪽 날짜 칸과 오른쪽 꺾쇠뿐 (제목 줄은 이야기로 간다). 날짜 칸이 58×76 이라 손가락 크기는 된다
- **d 오늘 묶음의 머리와 꼴이 다르다** (⑥ 7)
- **e 긴 제목이 두 줄** — 오른쪽 칸이 좁아진 값 (②). 제목 글자를 줄이면 한 줄에 들지만 제목이 주인공이라 그대로 뒀다
- **f 국내 / 해외 빠짐 · 긴 이야기가 묻힘 · 한 달 쌓이면** — UX-12b _open a · d · f 그대로 (d 가 76px 줄이라 한 달이면 c 보다 더 길다)
