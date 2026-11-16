# F-E7 — 뉴스 한 줄을 눈에 띄게 (D127)

2026-11-16 · 작업 세션 모델: Opus 5.5 · 모델 API 0 (장부 $34.85 그대로)

## ① 바꾼 것 — 꼴 · 까닭

**꼴 (kit — `apps/web/src/episode/episode.css` `.ep-news`)** — 굵게 (750) · **옅은 강조 바탕 띠** (`--ep-accent-soft`) · 띠 안 왼쪽에 **강조색 점** (`--ep-accent` · 7px) · 먹색 글 (`--ep-ink`) · 17px (제목 35px 의 반) · 줄 높이 1.4 · 띠는 글 길이만큼 (`width: fit-content` · `max-width: 100%` — 길면 꺾여도 칸 안). 제목 바로 위 (사이 14px)에 붙어 한 덩이로.
- 새 색 0 — 종이 토큰 셋 (`--ep-accent-soft` · `--ep-accent` · `--ep-ink`)뿐.
- `kit/Episode.tsx` 0 줄 — 클래스 · 자리는 F-E6 그대로 (`<motion.p className="ep-news" data-testid="cover-news">`). CSS 만 더했다.

**까닭**
- 도윤 "뉴스 한 줄 눈에 띄게" — 앞의 꼴은 꾸밈 0 (17px · 굵기 400 · 바탕 없음)이라 제목에 눌렸다 (F-E6 _open a).
- 시안 셋을 같은 폰 크기로 덧입혀 견줬다 (켜 둔 "앞" 빌드에 CSS 만 얹어 — 커밋 안 함): **A** 점 (강조 + 옅은 테) + 굵게 18px · **B** A + 형광펜 밑줄 · **C** 옅은 강조 바탕 띠 + 점 + 굵게. **C 를 골랐다**:
  - A 는 첫째 시안의 꼴 (점 + 굵게)과 거의 같다 — 굵어졌지만 제목과 같은 먹색 · 같은 바탕이라 "제목 위의 작은 제목"으로 읽혔다. 법 3 "제목 두 층" (위 = 오늘 무슨 일 · 아래 = 큰 물음)의 **두 층이 한눈에 갈리는 것**은 C 였다.
  - B 의 형광펜은 글 한 군데를 짚는 표시 (`.ep-riddle strong` 이 이미 쓴다)로 읽혀 "오늘의 뉴스"라는 자리가 안 섰다.
  - C 의 띠는 뼈대에 이미 있는 말이다 — 옅은 강조 바탕 = "새것" (도구의 상태 꼬리표 `.ep-tool-status` · 남음의 새 개념). 강조 = 새것 · 지금 (토큰 values.ts). 표지 그림의 주유기 몸통도 같은 색이라 그림과 한 벌로 보인다.
  - 띠 + 점 + 굵게 셋 다 넣되 띠의 높이는 글 한 줄 + 7px 위아래뿐 — 단추처럼 보이지 않게 (단추는 먹색 · 크다).

**첫 화면 카드 (`src/episode/home/cards.tsx` · `src/app/home.css`)**
- 긴 이야기 카드에 `line.screen?.news` 가 있으면 **주제 이름 아래 · 제목 바로 위**에 `<p class="ep-news hm-news" data-testid="card-news">` (글 = `screen.json` 의 `news.t` 그대로 · `Rich`).
- 꼴은 표지의 `.ep-news` 그대로 쓰고 `home.css` `.hm-card .hm-news` 가 작게만 한다: 14px · 점 6px · 띠 안쪽 4px 10px · 모서리 9px.
- catalog 의 손 칸 `screen` 에서 읽는다 — cards.tsx 는 `kit/Episode` 를 읽지 않는다 (catalog 규칙 그대로 · 읽는 것은 원래 읽던 `../catalog` · `../kit/parts` 의 `Rich` 뿐).
- 뉴스 한 줄이 없는 카드는 `null` — DOM 0 변화 (②).

**lab 셋 (kit 꼴이 바뀌어 같이 바뀜 — 동작 · 글 0)**
- `/lab/episode/oil-replot-b` · `-b2`: 표지 뉴스 한 줄이 실제와 같은 띠가 됐다 (b2 = 실제와 글자까지 같다).
- `/lab/episode/oil-replot` (첫째 시안): 제 CSS (`oil-replot.css` 의 `.ep-news` — 점 + 굵게 · 사이 8px · 바깥 여백 2px 0 10px)가 뼈대 위에 덧입혀져 **띠 + 그 시안의 여백**으로 선다. `oil-replot.css` 는 안 고쳤다.
- `oil-replot/check.ts` R7 의 한 줄 — "`.ep-news` 의 CSS 가 뼈대 (episode.css)에 있으면 FAIL (시안 폴더에만)" — 이제 거짓이라 뺐다 (주석으로 까닭). 나머지 R7 (화면 칸을 넘기는 곳 · 실제 화면이 시안 폴더를 안 읽음)은 그대로.

**e2e (`apps/web/e2e/episode.spec.ts` — `/s/oil/1 = 메운 판` 시험에 더함)**
- 첫 화면 카드: `card-news` 가 보이고 글 = `screen.json` 의 `news.t` · 주제 이름 아래 · 제목 위 · 굵게 (≥ 700) · 바탕 = `rgb(247, 223, 210)` (종이 토큰 accentSoft) · **폰에서 한 줄** (글 조각의 줄 상자 수 = 1) · 카드 칸 안 · `card-news` 는 화면에 **1 개뿐** · 기름값이 아닌 카드 안 `.ep-news` **0**.
- 표지: 굵게 · 같은 바탕 · **제목보다 작게** · 카드의 것보다 크게 · 폰에서 한 줄 · 화면 (390) 안. (글 = `screen.json` · 제목 위 · 겹침 없음은 F-E6 시험 그대로)
- 다른 실제 이야기의 표지에 `cover-news` · `.ep-news` 0 은 F-E6 의 "화면 칸은 기름값에만" 시험이 그대로 본다.

**그 밖** — `apps/web/scripts/shots-fe7.ts` (폰 그림 · 뼈 · 견줌 그림 — 테스트 아님).

## ② 다른 이야기 0 변화의 증거

방법: 고치기 **앞** (`79000a1` 그대로)과 **뒤**를 각각 `next build` (`CLARO_DIST=.next-fe7a` · `.next-fe7b`) + `next start` (3411 · 3412)로 세우고 같은 것을 떠서 견줬다 (움직임 줄임).

1. **뼈 (DOM)** — `shots-fe6.ts same` (다른 긴 이야기 셋 × 장면 여덟 = 24 · 짧은 이야기 둘 × 넷 = 8 → 32 파일) + `shots-fe7.ts same` (첫 화면 카드 여섯 → 6 파일) = **38 파일 · `diff -rq` → 37 같음**. 다른 1 = 기름값 카드뿐, 3 줄 더함:

```
$ diff bones-before/home-card-oil-1.html bones-after/home-card-oil-1.html
52a53,55
> <p class="ep-news hm-news" data-testid="card-news">
> <span>석유 최고가격, 12번째도 그대로</span>
> </p>
```

2. **그림 (픽셀)** — 뼈가 같아도 CSS 가 바뀌면 다를 수 있어 그림도 견줬다 (`cmp` — 바이트까지):
   - 다른 이야기 표지 · 첫 장 다섯 (`/s/price/1` · `/s/rate/2` · `/s/privacy/1` · `/short/meta-gallery` · `/short/license-notice`) → **5/5 같다**
   - 첫 화면의 다른 카드 다섯 (`card-meta-gallery` · `-delivery` · `-fomc` · `-pipc` · `-license-notice`) + 첫 화면 전체 (긴 그림) → **6/6 같다**. 단, 기름값 카드를 앞 · 뒤 둘 다 치우고 찍었다 — 그 카드가 36px 커져서 아래 카드들이 소수점 아래 자리까지 밀리면 글자의 번짐이 달라진다 (치우지 않고 찍으면 카드 다섯이 다 "다름" — 자리만 밀린 것). 카드 자체는 그대로다.

- 금리 2화 (`/s/rate/2`)는 위 둘 다에 들어 있다 — 0 변화 (도윤 "금리 쪽은 일단 냅둬").
- `local/oil-1/*` · catalog · 계약 · `packages/*` · `fixtures/` · `kit/Episode.tsx` · lab 화면 부품 0 줄 (git diff 에 없음).

## ③ 폰 그림 · 내 눈으로 본 것 (390×844 · 2배 · `logs/frontend/F-E7/` 8 장)

| 파일 | 무엇 |
|---|---|
| `before-cover.png` · `after-cover.png` | `/s/oil/1` 표지 한 화면 |
| `before-cover-zoom.png` · `after-cover-zoom.png` | 표지의 "긴 이야기" ~ 제목 (확대) |
| `before-home.png` · `after-home.png` | 첫 화면 `/` 한 화면 |
| `before-home-card.png` · `after-home-card.png` | 첫 화면 맨 위 큰 카드 (기름값) 한 장 |

`shots-fe7.ts read` 가 잰 것 (글 조각의 줄 상자 수 · 오른쪽 끝 · 콘솔 오류):

```
앞  표지 뉴스 한 줄: 줄 1 · 17px · 굵기 400 · 폭 346px · 오른쪽 끝 368 / 칸 390 · 바탕 rgba(0, 0, 0, 0) · 가로 넘침 false
    표지: 뉴스 한 줄 아래 끝 394 · 제목 위 끝 411 (사이 17px)
    표지: 물음 단추 아래 끝 831 / 화면 844 (한 화면에 든다)
    첫 화면 카드 뉴스 한 줄: 뉴스 한 줄 없음 · 콘솔 · 페이지 오류 0
뒤  표지 뉴스 한 줄: 줄 1 · 17px · 굵기 750 · 폭 246px · 오른쪽 끝 268 / 칸 390 · 바탕 rgb(247, 223, 210) · 가로 넘침 false
    표지: 뉴스 한 줄 아래 끝 391 · 제목 위 끝 405 (사이 14px)
    표지: 물음 단추 아래 끝 826 / 화면 844 (한 화면에 든다)
    첫 화면 카드 뉴스 한 줄: 줄 1 · 14px · 굵기 750 · 폭 200px · 오른쪽 끝 240 / 칸 368 · 바탕 rgb(247, 223, 210) · 가로 넘침 false · 콘솔 · 페이지 오류 0
```

본 것:
- **표지 (뒤)**: 그림 → "긴 이야기" (감색 글) → **띠 안의 "● 석유 최고가격, 12번째도 그대로"** → 제목 두 줄 → 한 줄 넉 줄 → 날 → 귀띔 → 단추. 띠가 그림 아래에서 눈이 처음 멈추는 자리다. 제목과 사이 14px — 한 덩이로 읽히고, 띠 덕에 "오늘 일"과 "물음"이 두 층으로 갈린다.
- **한 줄에 든다** — 띠 폭 246px (칸 346px 의 71%) · 꺾임 0 · 넘침 0 · 겹침 0. 띠가 앞의 여백 (위 17 + 아래 17)보다 작게 먹어서 표지 전체가 5px 짧아졌다 — **단추까지 한 화면에 그대로 든다** (826 / 844).
- **카드 (뒤)**: 주제 이름 (감색) → 띠 (작게 · 14px) → 제목 → 한 줄 → 꼬리표 → 단추. 띠 폭 200px (카드 글 칸 310px 안) · 한 줄 · 넘침 0. 카드가 36px 커졌다 (553 → 589px) — 카드 한 장은 여전히 한 화면 안.
- **걸린 곳 (고치지 않음)**: 첫 화면 **첫 화면 (스크롤 전)** 에서 큰 카드의 단추 "이야기 속으로 들어가기" 가 앞에는 거의 다 보였는데 (위 끝 ≈ 798) 뒤에는 거의 다 아래로 밀렸다 (위 끝 ≈ 833 — 11px 남짓만 보임 · 둘 다 그림에서 어림). 카드가 36px 커진 몫 → _open a.
- "긴 이야기" (감색 글) 바로 아래 띠의 점 (감색)까지 강조색이 위아래로 둘 붙는다 — 폰에서 시끄럽지는 않았다 (글자 색과 점 하나). 도윤의 눈 → _open b.

lab 셋 (뒤 · 움직임 줄임 · 1배로 확인만 — 커밋 안 함): b · b2 는 실제와 같은 띠 (b2 띠 폭 246px — 실제와 같다) · 첫째 시안은 띠 + 제 여백. 겹침 · 넘침 0.

## ④ 검사 (붙인 그대로 · 2026-11-16)

```
$ pnpm -s typecheck
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts   (화면 칸 · 끝부분)
■ 화면 칸 (이야기 목록의 손 칸 screen — 계약에 없다)
/s/oil/1 (oil-1 · 판 2): news "석유 최고가격, 12번째도 그대로" (F001.1 + F001.2) / burst = 구절 F054.1 + F054.2 을 이은 글자 그대로 · 문서 5879685d-486d-4b25-b8f6-eb510069957b 에 그대로 있다 · 상자 없음 / veil station (멈춘 고리 station)
화면 칸을 주는 이야기 1 · 안 주는 긴 이야기 3 (/s/price/1 · /s/rate/2 · /s/privacy/1)
OK — 화면 칸의 구절 · 숫자 · 문서 글 · 멈춘 고리가 맞다
…
실제 주소: /s/oil/1 · /short/meta-gallery · /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 2026-11-15 2 편 · 지난 이야기 4 편
번호 화면 규칙 (D88 E-20): oil 번호 없음 (긴 이야기 1화) · price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
OK — 숫자가 든 글이 없다
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글

$ … tsx src/app/lab/episode/oil-replot/check.ts
R7 화면 칸을 넘기는 곳: app/lab/episode/oil-replot/OilReplot.tsx · app/lab/episode/oil-replot-b/OilReplotB.tsx · app/lab/episode/oil-replot-b2/OilReplotB2.tsx · episode/Screen.tsx — 실제 화면은 이야기 목록의 손 칸 (line.screen)만 · 목록은 이 시안 폴더를 읽지 않는다
OK — 계약 검증 (구절 · 숫자 · 풀이 칸)을 지났고, 차례 · 답 먼저 금지 · 화면 칸의 검사도 맞다
$ … tsx src/app/lab/episode/oil-replot-b/check.ts
OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 실제 화면은 이 시안 폴더를 읽지 않음
$ … tsx src/app/lab/episode/oil-replot-b2/check.ts
OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 실제 화면은 이 시안 폴더를 읽지 않음

$ python3 scripts/verify-ledger.py
verify-ledger: 장부 1067 줄 (배치 454) · 합 $34.85 · 저장 출력 1047
OK (ERROR 0 · WARN 0)

$ pnpm -s test
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  Test Files  15 passed (15)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test: (뉴스 한 줄 · 첫 화면 · 기름값 시안에 닿는 줄만 — 전체는 87 줄 · 제목 줄은 잘랐다)
apps/web test:   ✓   4 e2e/episode.spec.ts:57:1 › 첫 화면 = 오늘 — 종이 톤 · 이야기 여섯 (11/15 의 둘 + 지난 넷 · 글은 파일 그대로) · … (1.4s)
apps/web test:   ✓  21 e2e/episode.spec.ts:193:1 › /s/oil/1 = 메운 판 (판 2 · F-E6) — 새 제목 · 제목 위 뉴스 한 줄 (눈에 띄게 — 표지 · 첫 화면 카드 · F-E7) · … (3.9s)
apps/web test:   ✓  32 e2e/episode.spec.ts:307:1 › 화면 칸 (뉴스 한 줄 · 고리 가림 · 문서 문장)은 기름값에만 선다 — 다른 실제 긴 이야기는 그대로: 뉴스 한 줄 없음 · … (4.1s)
apps/web test:   ✓  36 e2e/episode.spec.ts:341:3 › /s/oil/1 — 기름값은 어디서 묶이나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다 (4.0s)
apps/web test:   ✓   3 e2e/lab-oil-replot-b.spec.ts:15:1 › 둘째 판 — 표지 → 오늘의 사건 → 도구 → 풀이 (답은 누른 뒤) → 이어짐 → 남음 · 지금까지의 이야기 없음 · 콘솔 오류 0 (4.2s)
apps/web test:   ✓   5 e2e/lab-oil-replot-b2.spec.ts:15:1 › 메운 판 — 표지 → 오늘의 사건 → 도구 → 풀이 (답은 누른 뒤) → 이어짐 → 남음 · 지금까지의 이야기 없음 · 콘솔 오류 0 (4.4s)
apps/web test:   ✓  18 e2e/lab-oil-replot.spec.ts:39:1 › 다시 짠 판 — 오늘의 일부터 · 답은 누른 뒤에만 · 문서의 문장이 터진다 · 콘솔 오류 0 (2.9s)
apps/web test:   ✓  27 e2e/lab-oil-replot.spec.ts:106:1 › 다른 실제 주소 · 회차 시안에는 화면 칸 (뉴스 한 줄)이 없다 (446ms)
apps/web test:   87 passed (3.4m)
exit 0
```

- `logs/frontend/F-2b/*` 일곱 (`desktop-advanced-5-end.png` · `desktop-basic-1.png` · `desktop-basic-9.png` · `motion-375x667.webm` · `se-basic-1.png` · `x-basic-1.png` · `x-basic-9.png`)이 `pnpm -s test` 때 다시 찍혔다 — 하나씩 `git checkout -- <파일>` 로 되돌렸다 (커밋에 없음).

## ⑤ 배포 확인

(push 뒤 붙임)

## ⑥ _open

- **a · 첫 화면 첫 화면의 단추.** 큰 카드가 36px 커져서 스크롤 전 첫 화면에서 "이야기 속으로 들어가기" 단추가 거의 안 보인다 (앞에는 거의 다 보였다). 카드를 누르면 어디든 들어가지므로 길은 막히지 않는다. 줄이려면 카드의 그림 칸 (위 여백 20px · 아래 12px)이나 첫 인상 줄 사이를 손대야 하는데 이번 Step 밖 — 도윤이 폰에서 걸리면.
- **b · 강조색이 둘 붙는다.** 표지에서 "긴 이야기" (감색 글) 바로 아래 띠의 점 (감색). 지금은 깔끔하게 읽혔지만, 뉴스 한 줄이 있는 이야기에선 "긴 이야기" 무게 이름을 띠 쪽으로 옮기거나 빼는 길도 있다 (다른 이야기와 표지 꼴이 갈라진다 — 판단은 도윤 · PM).
- **c · 첫째 시안 (`oil-replot`)의 꼴**은 이제 뼈대 띠 + 제 CSS (점 + 굵게 · 여백)의 겹침이다. 그 시안의 `.ep-news` 를 지울지는 lab 정리 때 (지금은 lab 파일 0 줄 — 지시문대로).
- **d · 띠의 자리 = 계약 밖.** 뉴스 한 줄은 여전히 손 칸 (`screen.json`)이다 (F-E6 _open e). ④b 스킬이 `screen.news` 를 내게 되면 이 꼴은 그대로 따라온다 — 둘째 이야기부터는 카드 · 표지 둘 다 저절로.
- **e · 긴 뉴스 한 줄.** 지금 글 (빈칸 포함 18 자)은 표지 (띠 246 / 칸 346px) · 카드 (200 / 310px) 둘 다 한 줄이고 둘 다 30% 남짓 남는다. 더 긴 글은 띠 안에서 두 줄로 꺾인다 (꼴은 견딘다 — `max-width: 100%` · 점은 첫 줄). 몇 자까지 한 줄인지는 재지 않았다 — 법 v2 의 "뉴스 한 줄" 길이 잣대에 넣을지는 PM (④a).
