# logs/frontend · UX-12b — 접힘 판을 담백하게 (D138)

## UX-12b · 2026-11-18 · 서브에이전트 (UX-12 세션에 이어서) · 검수 대기(PM) → 도윤

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`) · **모델 API 0** · `docs/PM.md` 안 읽음.
도윤: "접히는 형식이 좋거든? 근데 좀 더 담백했으면 좋겠어. 화면 하나에 꽉 차서 뭐가 너무 많아. 잘 정리되고 예쁘게."
고친 파일: `apps/web/src/app/lab/home-days/HomeDays.tsx` (판 `c` — `DaysPlain` 더함 · 띠의 길) · `home-days.css` (`.hc-*` 더함 — `.hd-*` 는 0줄). 새 파일: `c/page.tsx` · `shots-b.ts` · 이 로그 · 그림 `logs/frontend/UX-12b/`.

**한 줄 답**: 나에서 **상자 · 살짝 보이는 제목 · 긴/짧은 셈 · 빨간 주제 글 · 줄마다 꺾쇠 · 국내/해외 · 이끼색**을 뺐다. 남은 것은 가는 선 · 날짜 한 줄 · 제목 · 작은 회색 한 줄. 지난 이야기 칸에서 색 있는 글자는 칸 머리 "지난 이야기" 하나다.

## ① 주소

- 담백 판: `/lab/home-days/c` · 일주일 견본 `/lab/home-days/c?many=1`
- 견줌: `/lab/home-days/b` (그대로 — 띠에 "담백 판" 길 하나만 더했다) · 띠에서 b ↔ c · 견본을 오간다. `/a` 는 띠까지 그대로

## ② 무엇을 덜었나 (b → c)

| | 나 (b) | 담백 판 (c) | 까닭 |
|---|---|---|---|
| 날마다 | 둥근 상자 (바탕 카드 + 테두리) 하나씩 | **상자 없음** — 날 사이 가는 선 하나 | 상자가 날 수만큼 쌓이는 것이 "꽉 찬" 느낌의 몸통. 견본에서 상자 8 → 선 9 |
| 접힌 날짜 줄 | 두 층: 날짜 + "긴 1편 · 짧은 1편" / 살짝 보이는 제목 | **한 층**: 날짜 + "2편" + 꺾쇠 | 도윤이 "많다"고 한 가장 큰 덩어리. 제목은 펼치면 나온다 |
| 접힌 날의 날짜 글 | 먹색 800 | 한 톤 옅게 (`ink2` · 650) · 펼친 날만 먹색 750 | 상자가 없으니 펼친 날 / 접힌 날을 글의 무게로 가른다 |
| 꺾쇠 | 감색 · 날짜 줄 + 줄마다 | 회색 · **날짜 줄에만** | 줄마다 꺾쇠는 뺐다 — 제목 줄 전체가 눌린다 (48px 이상) |
| 펼친 줄 | 세 층: 빨간 주제 이름 / 제목 / 국내·해외 · 긴·짧은 · 줄 사이 선 | **두 층**: 제목 (16.5px · 먹) / 작은 회색 한 줄 · 줄 사이 선 없음 (여백으로) | 제목이 주인공 |
| 회색 한 줄에 남긴 것 | — | **주제 이름** (+ 이어지는 이야기면 "2화") · **긴 이야기일 때만 "긴 이야기"** | 주제 이름 = 이 이야기가 어느 선반인지 (Claro 가 이야기를 잇는 축). 짧은 이야기가 대부분이라 "짧은 이야기"는 적지 않는다 — 다른 것만 적는다 |
| 뺀 꼬리표 | 국내 / 해외 (해외 이끼색) | **뺌** | 한 줄에 셋이면 다시 시끄럽다 · 이끼색은 "먹 + 회색"에 안 맞는다. 맨 위 오늘 묶음의 카드와 이야기 안에는 그대로 있다 (_open a) |
| "2화" | 감색 딱지 | 회색 글 ("금리는 어디로 · 2화 · 긴 이야기") | 표시는 남기고 색만 뺐다 |
| 색 | 감색 (주제 글 · 꺾쇠 · 딱지) · 이끼색 · 카드 바탕 | **먹 + 회색** · 바탕은 종이 그대로 | 강조색은 칸 머리 한 곳 |
| 펼쳐 두는 날 | 바로 위 지난 날 하나 | 같다 | 다 접으면 날짜 줄뿐이라 열린다는 것이 안 보인다 (UX-12 ②) |
| 키 (390 · 지난 이야기 칸) | 400 · 견본 760 | **353** · 견본 **648** | 줄였는데도 키가 준 것은 접힌 줄이 한 층이 돼서다. 접힌 줄 자체는 58px 로 여백을 더 줬다 (b 는 64 인데 두 층) |

더한 것은 없다 (부품 · 글 · 색 0). 누를 곳: 날짜 줄 58px · 제목 줄 66px 이상. `<details>` — 자바스크립트 없음.

## ③ 폰 그림 · 내 눈으로 본 것

`logs/frontend/UX-12b/` (390×844 · 같은 자리 · `-b` ↔ `-c`): `1-rest` 지난 칸 첫 화면 · `2-open2` 하나 더 펼친 것 · `3-many` 일주일 견본 · `4-whole` 지난 칸 통째 · `360-1-rest` 360 폭.

- **b 보다 담백한가 — 그렇다.** `3-many-b` 는 둥근 상자 아홉이 화면을 메우고 상자마다 글이 두 줄 · 감색 꺾쇠가 줄지어 선다. `3-many-c` 는 날짜가 왼쪽에 한 줄로 서고 그 사이는 종이다 — 달력 목록처럼 읽힌다
- **날짜가 한눈에 갈리나**: 갈린다 — 줄마다 날짜 하나뿐이고 왼쪽 끝이 맞는다. "2편"은 작고 옅어서 날짜를 가리지 않는다
- **펼친 날 · 접힌 날**: 펼친 날은 날짜가 먹색 + 꺾쇠가 위로 + 아래에 제목. 접힌 날은 날짜가 한 톤 옅다. `2-open2-c` 에서 둘이 구별된다 — 다만 **톤 차이 (먹 ↔ 짙은 회색)는 작다**: 구별은 사실상 "아래에 제목이 있나"와 꺾쇠 방향이 한다 (_open b)
- **제목이 주인공인가**: 그렇다 — 펼친 날에서 가장 진하고 큰 글이 제목이다. 날짜 (17px · 750)와 제목 (16.5px · 650)의 크기가 가깝지만 날짜 옆 "2편" · 꺾쇠와 제목 아래 회색 줄이 둘을 가른다
- **솔직히 잃은 것**: ① 접힌 날에 무엇이 있었는지는 **눌러야만** 안다 (b 는 첫 제목이 보였다) ② 해외 이야기가 지난 칸에서는 표시가 없다 ③ 긴 이야기는 회색 "긴 이야기" 세 글자뿐이라 b 보다도 덜 띈다 (UX-12 _open a 가 더 세졌다)
- **넘침 · 잘림**: 가로 넘침 0 · 잘린 글 0 (390 · 360 · 네 화면 — 아래 재기). 360 에서도 제목이 한 줄에 든다 (꺾쇠가 없어 b 보다 줄 폭이 넓다 — b 는 360 에서 두 줄로 넘어가던 "미국, AI 칩 …"이 c 는 한 줄)
- 그림 왼쪽 아래 검은 "N" 은 개발 서버의 표시 (배포에는 없다)

재기 (`shots-b.ts` 출력 그대로):
```
1-rest-b 200 {"overflowX":0,"rest":400,"rows":8,"rowMin":86,"foldMin":52,"clipped":0}
2-open2-b {"overflowX":0,"rest":585,"rows":8,"rowMin":86,"foldMin":52,"clipped":0}
3-many-b 200 {"overflowX":0,"rest":760,"rows":18,"rowMin":86,"foldMin":52,"clipped":0}
1-rest-c 200 {"overflowX":0,"rest":353,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
2-open2-c {"overflowX":0,"rest":498,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
c 첫 줄 → /short/suneung-cheating
3-many-c 200 {"overflowX":0,"rest":648,"rows":18,"rowMin":66,"foldMin":58,"clipped":0}
폭 390 페이지 오류 0
360-1-rest-b 200 {"overflowX":0,"rest":422,"rows":8,"rowMin":86,"foldMin":52,"clipped":0}
360-3-many-b 200 {"overflowX":0,"rest":782,"rows":18,"rowMin":86,"foldMin":52,"clipped":0}
360-1-rest-c 200 {"overflowX":0,"rest":353,"rows":8,"rowMin":66,"foldMin":58,"clipped":0}
360-3-many-c 200 {"overflowX":0,"rest":648,"rows":18,"rowMin":66,"foldMin":58,"clipped":0}
폭 360 페이지 오류 0
```

## ④ 실제 `/` 0 변화

커밋 전 `git status --short` (`.claude/launch.json` 은 남의 것 — 안 건드림 · 안 실음):
```
 M apps/web/src/app/lab/home-days/HomeDays.tsx
 M apps/web/src/app/lab/home-days/home-days.css
?? .claude/launch.json
?? apps/web/src/app/lab/home-days/c/
?? apps/web/src/app/lab/home-days/shots-b.ts
?? logs/frontend/UX-12b.md
?? logs/frontend/UX-12b/
```
`git diff --stat HEAD -- apps/web/src/app/page.tsx apps/web/src/app/home.css apps/web/src/episode apps/web/e2e apps/web/src/app/lab/home-days/a apps/web/src/app/lab/home-days/b apps/web/src/app/lab/home-days/days.ts packages fixtures docs/contract` → (빈 줄)
- `/a` · `/b`: `DaysOpen` · `DaysFold` · `.hd-*` css 0줄. 달라진 것은 b 의 띠에 "담백 판" 길 하나 (a 의 띠는 그대로)
- e2e 의 지금 시험 90 그대로 통과 (⑤) · 새 e2e 없음
- `pnpm -s test` 가 다시 찍은 `logs/frontend/F-2b/` 그림 6 은 하나씩 `git checkout -- <파일>` · 내 개발 서버가 만든 `apps/web/AGENTS.md` · `CLAUDE.md` 는 지움

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

## ⑥ _open

- **a 국내 / 해외가 지난 칸에서 빠졌다** — D83 ② 의 꼬리표다. 담백함을 먼저 봤다. 되살리려면 회색 한 줄에 "해외"만 (국내는 안 적는 꼴 — 긴 이야기와 같은 규칙) 넣을 수 있다
- **b 펼친 날 / 접힌 날의 톤 차이가 작다** — 더 벌리면 (접힌 날을 `muted` 로) 날짜가 흐려져 "한눈에"가 준다. 지금 값으로 뒀다
- **c 접힌 날은 눌러야 안다** — 살짝 보이는 제목을 뺀 값. 도윤의 말 ("뭐가 너무 많다")을 따랐다
- **d 긴 이야기가 더 묻힌다** — UX-12 _open a 그대로 · 더 세짐
- **e 실제로 옮길 때** — UX-12 로그 ⑥ 그대로 + 작은 줄은 `DaysPlain` 의 줄 (`.hc-*`). 가 · 나 (`DaysOpen` · `DaysFold` · `.hd-*`)는 그때 지운다
- **f 한 달 쌓이면** — 선 목록이라 b 보다는 견디지만 날짜 줄 서른은 길다 (UX-12 _open f 그대로)
