# F-E6 — 실제 `/s/oil/1` 을 메운 판으로 (D125 ③)

2026-11-16 · 작업 세션 모델: Fable 5.2 · 모델 API 0

## ① 주소

| 주소 | 무엇 |
|---|---|
| `/s/oil/1` | **메운 판 (판 2)** — `packages/pipeline/data/events/MOTIR-20261113-OIL-PRICE-CAP/local/oil-1/episode.json` + 그 곁의 `screen.json` (화면 칸 셋) |
| `/` | 맨 위 큰 카드의 제목 · 한 줄 · 그림이 새것 (「최고가격이 그대로면, 주유소 값도 못 넘을까요」) |
| `/s/price/1` · `/s/rate/2` · `/s/privacy/1` · `/short/meta-gallery` · `/short/license-notice` | 그대로 (④) |
| `/lab/episode/oil-replot` · `-b` · `-b2` | 글 · 차례 · 화면 칸 그대로. **표지 그림만 새 그림** (같은 `OIL_LOOK` — 지시문 5 가 받는 것) |

파이프라인이 낸 판 1 (`episodes/oil-1/episode.json`)은 그 자리에 그대로다 — 실제 화면에서만 내려왔다 (`episode oil-1 --check` 그대로 같다 · ⑥).

## ② 바꾼 것

**이야기 목록 (`apps/web/src/episode/catalog.tsx`)**
- 기름값 줄의 회차 파일을 `local/oil-1/episode.json` 으로. `day` · `place` · `category` · `unpromised` 그대로
- 손 칸 하나 `LongLine.screen` (계약에 없는 칸 — `unpromised` 처럼 주석에 적었다) · `screenOf(file)` — `screen.json` 을 읽어 꼴만 본다 (모르는 칸 · 빈 글 · 구절 키 목록이 아니면 빌드가 선다)
- catalog 는 여전히 `kit/Episode` 를 읽지 않는다 — 칸의 타입 `ScreenSlots` 를 `kit/types.ts` 에 뒀다 (catalog 가 이미 읽던 파일)

**화면 칸 (kit)**
- `kit/Episode.tsx` 의 시안 칸 `replot` → **`screen`** (`ScreenSlots` — news · veil · burst). 동작 한 줄도 안 바꿨다 — 이름과 주석만 ("시안 전용" → "이야기마다 고르는 화면 칸 · 안 주면 그대로")
- `Screen.tsx` 의 `LongScreen` 이 `screen={line.screen}` 을 준다 — 기름값 줄에만 값이 있고 나머지는 `undefined`
- `kit/frames/Steps.tsx` · `LabCard.tsx` — `veil` 주석만
- lab 셋 (`oil-replot` · `-b` · `-b2`)의 `data.ts` · 화면 부품 — 타입 이름 · 넘기는 이름만 (`replot=` → `screen=`). 글 · 값 0
- **CSS 0 줄.** `.ep-news` 의 꾸밈 (작은 점 + 굵게)은 첫째 시안 폴더의 CSS 에만 있다. 도윤이 고른 b2 는 그 꾸밈 없이 얇은 한 줄로 섰고 (`logs/frontend/UX-11b/b2-01-cover.png`), 실제 화면도 **b2 와 똑같이** 선다 (`v2-01-cover.png`) → _open a

**검사**
- `lab/episode/check.ts` **S8** (새로) — 실제 화면의 화면 칸: `news` 구절 키가 그 회차에 있고 글의 숫자가 그 구절에 있다 / `burst` 인용이 구절을 이은 글자 그대로고, 그 글이 저장된 문서 한 편 안에 **이어진 채로** 있다 · 머리 · 덧말의 숫자 · 말한 이 / `veil` 키가 그 회차 사슬의 멈춘 고리 (reach: none)다 · 가린 말에 숫자 없음
  - 거꾸로 시험 (임시 — `screen.json` 을 고친 사본 다섯을 스크래치에 두고 catalog 가 그것을 읽게 한 뒤 되돌림. 커밋 안 함): 없는 구절 키 · 받쳐지지 않는 숫자 ("13번째") · 인용 한 낱말 바꿈 · 구절 차례 뒤집어 이음 · 멈추지 않은 고리 (`refiner`) → **다섯 다 FAIL** (S8 이 그 자리를 짚는다)
- lab 검사 셋의 "실제 화면이 시안 칸을 모른다" (oil-replot R7 · -b / -b2 R3)는 이제 거짓이라 고쳤다: 화면 칸을 넘기는 곳 = 기름값 시안 폴더들 + `episode/Screen.tsx` (목록의 `line.screen` 만) · 실제 화면 · 목록이 시안 폴더 (`oil-replot*`)를 읽지 않는다
  - oil-replot R7 의 "목록에 같은 id · 같은 판 번호가 없다"는 뺐다 — 실제 판 2 와 첫째 시안이 둘 다 `episode_version: 2` 다 (다른 글 · _open c)

**e2e**
- `episode.spec.ts` — `LIVE` 의 기름값 파일을 `local/oil-1` 로 (끝까지 걷는 시험 · 첫 화면 카드가 새 글을 본다) + 새 시험 둘:
  - `/s/oil/1 = 메운 판` — 새 제목 (og · 화면 · 첫 화면 카드 · 판 1 제목 없음) · 뉴스 한 줄이 제목 위 · 장면 여섯 · "지금까지의 이야기" 없음 · 누르기 전 멈춘 고리 `idle` + 가린 말 · 꼬리표 / 점선 / 문서 문장 없음 → 누른 뒤 꼬리표 · 문서 문장 (머리 · 덧말) · `.ep-flip` 0 · 뒤집기 풀이는 문장으로 · 근거 시트 (구절 둘 · 문서 이름) · 가로 넘침 0 · 콘솔 오류 0
  - `화면 칸은 기름값에만` — 배달 · 금리 2화 · 개인정보: 뉴스 한 줄 0 · 금리 2화 사슬의 멈춘 고리 (`infl`)가 **누르기 전부터 `still` + 제 꼬리표 + 점선** (가림 0) · 답을 열면 "뒤집어 보면" 상자 그대로 · 문서 문장 칸 0
- lab spec 셋의 "실제 /s/oil/1 은 그대로" 시험 → "실제 주소에 시안의 것 (띠 · 시안으로 가는 길)이 새지 않는다"로 (실제 판의 내용은 `episode.spec.ts` 가 본다)

**그 밖** — `scripts/shots-fe6.ts` (폰 그림 · 뼈 뜨기 — 테스트 아님)

## ③ 그림 (`src/episode/episodes/oil/Art.tsx`)

- **앞**: 정유소 탱크 위에 천장 들보 → 주유기 앞에서 끝남 → 그 끝에 "≠". **답을 그렸다** (천장이 누구 위에 있고 어디서 끝나는지).
- **뒤 (물음의 그림)**: 천장 들보가 **왼쪽 화면 밖에서 들어와** 주유기 쪽으로 간다. 주유기 위에서는 **점선**이고 오른쪽 화면 밖으로 나간다. 가격표 바로 위, 그 점선 위에 **물음표 하나**. 왼쪽 아래에는 차 한 대 (기름 넣으러 온 독자의 자리 — 정유사도 주유소도 아니다).
- 까닭: 제목의 물음 ("주유소 값도 못 넘을까요")이 곧 그림의 말이 되게. 뺀 것 — 탱크 (천장이 누구 위에 있는지) · 들보가 끝나는 자리 · ≠. 들보가 실선에서 점선으로 바뀌는 것은 "닿는지 모른다"지 "안 닿는다"가 아니다 — 다만 그렇게 읽히는지는 도윤의 눈이 맞다 (_open b).
- 숫자 · 글자 없음 · ≠ / = 없음 · **새 색 0 · CSS 0** — 지난 그림들의 클래스만 (`ep-art-tag` · `-chain` · `-phone` · `-bowl` · `-ink` · `-tagline` · `-eq` · `-eqline` · `-shadow`). 선 굵기 그대로 (2.2 · 점선 2.4 · 물음표 3.4).
- **글리프**: 판 2 의 도구 넷 `cap` · `supply` · `scope` · `settle` 전부 `Glyph.tsx` 에 있다 — 그림은 안 고쳤다. `notice` 는 판 1 · 첫째 시안이 써서 남겼다 (주석만).
- 첫 화면 큰 카드도 같은 그림 (`v2-00-home.png`).

## ④ 다른 실제 이야기 0 변화의 증거

방법: 고치기 **앞** (커밋 `1fd78ac` 그대로)과 **뒤**를 각각 `next build` + `next start` 로 세우고, `shots-fe6.ts same` 이 다른 실제 이야기를 **처음부터 끝까지 눌러 가며** 장면마다 화면의 뼈 (`.ep-root` 의 `outerHTML` — 태그 · 클래스 · `data-*` · 글. 움직임의 `style` 만 뺌 · 움직임 줄임)를 떠서 `diff -r`.

- 긴 이야기 셋 (`/s/rate/2` · `/s/price/1` · `/s/privacy/1`) × 장면 여덟 (표지 · 지금까지 · 사건 · 도구 · 풀이 앞 · 풀이 뒤 · 이어짐 · 남음) = 24 + 짧은 이야기 둘 × 장면 넷 = 8 → **32 파일**
- **29 파일 글자까지 같다.** 다른 것은 3 파일 · 한 줄씩 — 세 긴 이야기의 **남음 장면에 있는 "다른 이야기" 길의 기름값 제목**:

```
98c98   (s-price-1-08-keep · s-privacy-1-08-keep 103 · s-rate-2-08-keep 111 — 셋 다 같은 한 줄)
< <em>기름값 최고가격, 누구의 값을 묶은 걸까</em>
---
> <em>최고가격이 그대로면, 주유소 값도 못 넘을까요</em>
```

기름값 이야기의 제목이 바뀐 것이 그 길에 비친 것이다 (책장 `kit/shelf.ts` 가 목록에서 읽는다). 다른 이야기의 화면 동작 · 글은 0.

- CSS: `episode.css` · `frames.css` 0 줄 (git diff 없음). `packages/*` · `fixtures/` · `docs/contract/` · `local/oil-1/*` 0 줄.
- e2e 가 같은 것을 계속 본다 (② — "화면 칸은 기름값에만").

## ⑤ 폰 그림 · 내 눈으로 본 것 (390×844 · 2배 · `logs/frontend/F-E6/` 42 장)

`shots-fe6.ts read` 가 센 것: **가로 넘침 0 · 콘솔 / 페이지 오류 0** (앞 · 뒤 둘 다).

| 자리 | 앞 (판 1 — `v1-NN`) | 뒤 (판 2 — `v2-NN`) |
|---|---|---|
| 00 첫 화면 | 카드 제목 「기름값 최고가격, 누구의 값을 묶은 걸까」 · ≠ 그림 | 「최고가격이 그대로면, 주유소 값도 못 넘을까요」 (두 줄) · 물음 그림 · 한 줄 넉 줄. 카드가 한 화면에 든다 (단추까지) |
| 01 표지 | 1/7 · 단추 "이 이야기, 어디서 시작됐죠?" (누르면 3월) | 1/6 · 그림 → "긴 이야기" → **뉴스 한 줄** (얇게) → 제목 두 줄 → 한 줄 넉 줄 → 날 → 귀띔 → 단추 "주유소 값도 못 넘는 게 맞죠?" 가 한 화면에 든다. 겹침 없음 |
| 02 지금까지 | 있다 (두 화면) | **없다** (그림 없음 — 표지 다음이 사건) |
| 03 오늘의 사건 | — | 큰 숫자 둘 (1,784원 · 1,800원대) 나란히 · 꼬리표 · 6월 인용 석 줄. 넘침 없음 |
| 04 도구 | 도구 여럿 | 도구 2개 (최고가격 · 공급가격과 판매가격) — "두 번 매겨져요" 한글 그대로 |
| 05 풀이 앞 | 주유소 고리에 "적용 대상에서 제외" 가 처음부터 보인다 | 고리 셋이 **같은 꼴** — "값을 정해요" · "여기일까요?" · **"여기까지일까요?"**. 꼬리표 · 점선 없음 |
| 06 풀이 뒤 | "뒤집어 보면" 상자 | 주유소 고리에 꼬리표 "적용 대상에서 제외" + 그 앞 "? 주유소가 받는 값은? 오늘 문서엔 없어요" → 아래에 **문서 문장** (검은 칸 · 넉 줄) → 풀이 한 문단 → 새 도구 "묶이는 자리" → "실제로 산업부가 말한 것" 셋 → 누구의 말. 상자 없음 |
| 06 근거 시트 | — | 문서 문장을 누르면 구절 둘 (F054.1 · F054.2) + "산업통상부 보도참고자료 · 최고가격제 시행 첫 발표 (3월 12일)" · "산업부가 한 말" |
| 07 이어짐 | — | 줄 (3월 13일 → 6월 27일 → 11월 13일 지금 여기 → 다음 ?) · 새 도구 "손실 보전" · "남은 일들" |
| 08 남음 | — | 한 줄 석 줄 · 지도에 도구 넷 · "오늘 새로 주운 개념 4" |

내가 읽다 걸린 곳 (고치지 않았다):
- **위쪽 줄의 "긴 이야기 · 기름값은 어디서 묶이나" 가 "근거" 단추에 바짝 붙는다** (겹치지는 않는다) — F-E5 _open c 그대로.
- **남음의 지도**: "공급가격과 판매가격" 알약이 지도 칸의 오른쪽 테두리에 닿는다 (F-E5 _open b 그대로 · 데이터의 자리). **"손실 보전" 알약이 흐리다** — 아래에는 "새로 주운 개념 4" 에 들어 있는데 지도에서는 덜 주운 것처럼 보인다. b2 시안 (`UX-11b/b2-08-keep.png`)도 똑같다 — 뼈대의 동작이고 이번에 바뀐 것이 아니다 (_open d).
- 표지의 뉴스 한 줄은 제목에 눌려 가볍다 (UX-10b ⑦ 3 과 같은 관찰) — b2 그대로 (_open a).
- 풀이 뒤가 길다 (화면 넷 — `v2-06-aha-after` ~ `-d`). 글의 길이라 안 건드렸다.

## ⑥ 검사 결과 (붙인 그대로 · 2026-11-16)

```
$ pnpm -s typecheck
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts   (끝부분)
■ 화면 칸 (이야기 목록의 손 칸 screen — 계약에 없다)
/s/oil/1 (oil-1 · 판 2): news "석유 최고가격, 12번째도 그대로" (F001.1 + F001.2) / burst = 구절 F054.1 + F054.2 을 이은 글자 그대로 · 문서 5879685d-486d-4b25-b8f6-eb510069957b 에 그대로 있다 · 상자 없음 / veil station (멈춘 고리 station)
화면 칸을 주는 이야기 1 · 안 주는 긴 이야기 3 (/s/price/1 · /s/rate/2 · /s/privacy/1)
OK — 화면 칸의 구절 · 숫자 · 문서 글 · 멈춘 고리가 맞다
…
실제 주소: /s/oil/1 · /short/meta-gallery · /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 2026-11-15 2 편 · 지난 이야기 4 편
번호 화면 규칙 (D88 E-20): oil 번호 없음 (긴 이야기 1화) · price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글

$ … tsx src/app/lab/episode/oil-replot/check.ts
R7 화면 칸을 넘기는 곳: app/lab/episode/oil-replot/OilReplot.tsx · app/lab/episode/oil-replot-b/OilReplotB.tsx · app/lab/episode/oil-replot-b2/OilReplotB2.tsx · episode/Screen.tsx — 실제 화면은 이야기 목록의 손 칸 (line.screen)만 · 목록은 이 시안 폴더를 읽지 않는다
OK — 계약 검증 (구절 · 숫자 · 풀이 칸)을 지났고, 차례 · 답 먼저 금지 · 화면 칸의 검사도 맞다
$ … tsx src/app/lab/episode/oil-replot-b/check.ts
R3 실제 화면 파일 (…Screen.tsx · …catalog.tsx · …/s/[series]/[n]/page.tsx)이 기름값 시안 폴더를 읽지 않는다 · 이 판은 lab 주소 하나에만 선다
OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 실제 화면은 이 시안 폴더를 읽지 않음
$ … tsx src/app/lab/episode/oil-replot-b2/check.ts
OK — 계약 검증 (구절 · 숫자) · 풀이 전의 글에 깨는 사실 없음 · 1화는 지금까지의 이야기 없이 시작 · 실제 화면은 이 시안 폴더를 읽지 않음

$ pnpm -s --filter @claro/pipeline episode oil-1 --check
episode oil-1 --check — episode.json · review.json 같다

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
apps/web test: (기름값 · 화면 칸 · 다른 실제 주소에 닿는 줄만 — 전체는 87 줄)
apps/web test:   ✓   3 e2e/episode.spec.ts:56:1 › 첫 화면 = 오늘 — 종이 톤 · 이야기 여섯 (11/15 의 둘 + 지난 넷 · 글은 파일 그대로) · 병원 짧은 이야기 없음 · 체험 표시 없음 · 번호는 금리에만 · 시안의 것이 없다 · 머리가 날짜를 속이지 않는다 (1.6s)
apps/web test:   ✓  17 e2e/episode.spec.ts:138:1 › 11/15 의 두 편 — 새 두 주소가 열린다 (200) · 콘솔 오류가 없다 (첫 화면 · 긴 이야기 · 짧은 이야기 · 지도) (2.3s)
apps/web test:   ✓   2 e2e/lab-oil-replot-b2.spec.ts:15:1 › 메운 판 — 표지 → 오늘의 사건 → 도구 → 풀이 (답은 누른 뒤) → 이어짐 → 남음 · 지금까지의 이야기 없음 · 콘솔 오류 0 (4.5s)
apps/web test:   ✓   1 e2e/lab-oil-replot-b.spec.ts:15:1 › 둘째 판 — 표지 → 오늘의 사건 → 도구 → 풀이 (답은 누른 뒤) → 이어짐 → 남음 · 지금까지의 이야기 없음 · 콘솔 오류 0 (4.6s)
apps/web test:   ✓  22 e2e/lab-oil-replot-b2.spec.ts:77:1 › 실제 /s/oil/1 에 이 시안의 것 (맨 위 띠 · 시안으로 가는 길)이 새지 않는다 — 실제 주소는 F-E6 부터 메운 판이다 (제 자리의 파일을 읽는다 · episode.spec.ts 가 본다) (246ms)
apps/web test:   ✓  19 e2e/lab-oil-replot.spec.ts:39:1 › 다시 짠 판 — 오늘의 일부터 · 답은 누른 뒤에만 · 문서의 문장이 터진다 · 콘솔 오류 0 (2.9s)
apps/web test:   ✓  23 e2e/lab-oil-replot-b.spec.ts:75:1 › 실제 /s/oil/1 에 이 시안의 것 (맨 위 띠 · 시안으로 가는 길)이 새지 않는다 — 실제 주소는 F-E6 부터 메운 판이다 (제 자리의 파일을 읽는다 · episode.spec.ts 가 본다) (301ms)
apps/web test:   ✓  25 e2e/lab-oil-replot.spec.ts:95:1 › 실제 /s/oil/1 에 이 시안의 것 (맨 위 띠 · 이 판의 제목)이 새지 않는다 — 실제 주소는 F-E6 부터 메운 판이다 (episode.spec.ts 가 본다) (325ms)
apps/web test:   ✓  27 e2e/lab-oil-replot.spec.ts:106:1 › 다른 실제 주소 · 회차 시안에는 화면 칸 (뉴스 한 줄)이 없다 (439ms)
apps/web test:   ✓  21 e2e/episode.spec.ts:175:1 › /s/oil/1 = 메운 판 (판 2 · F-E6) — 새 제목 · 제목 위 뉴스 한 줄 · 지금까지의 이야기 없음 · 멈춘 고리는 누르기 전에 가려져 있다 → 누른 뒤 꼬리표 · 문서 문장 · "뒤집어 보면" 상자 없음 · 근거 시트 · 콘솔 오류 0 · 첫 화면 카드 제목 (3.9s)
apps/web test:   ✓  32 e2e/episode.spec.ts:264:1 › 화면 칸 (뉴스 한 줄 · 고리 가림 · 문서 문장)은 기름값에만 선다 — 다른 실제 긴 이야기는 그대로: 뉴스 한 줄 없음 · 사슬의 멈춘 고리는 처음부터 제 꼬리표로 · 누른 뒤 "뒤집어 보면" 상자 그대로 (4.2s)
apps/web test:   ✓  36 e2e/episode.spec.ts:298:3 › /s/oil/1 — 기름값은 어디서 묶이나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다 (4.0s)
apps/web test:   ✓  38 e2e/episode.spec.ts:298:3 › /s/price/1 — 누가 값을 정하나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다 (4.9s)
apps/web test:   ✓  41 e2e/episode.spec.ts:298:3 › /s/rate/2 — 금리는 어디로 2화 (번호 보임): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다 (4.4s)
apps/web test:   ✓  42 e2e/episode.spec.ts:298:3 › /s/privacy/1 — 내 정보는 누가 지키나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 번호 화면 규칙 · 시안의 것이 없다 (4.4s)
apps/web test:   87 passed (3.5m)
```

## ⑦ 배포 확인

(push 뒤에 채운다 — 로그만 싣는 둘째 커밋)

## ⑧ _open

- **a · 뉴스 한 줄의 꼴.** 실제 화면은 도윤이 고른 b2 와 똑같이 **꾸밈 없는 얇은 한 줄**이다 (CSS 0). UX-10 이 처음 그린 꼴 (작은 점 + 굵게 · `oil-replot.css` 의 `.ep-news`)은 첫째 시안에만 산다. 어느 쪽을 뼈대 (`episode.css`)의 것으로 삼을지 — 도윤이 폰에서 "오늘의 기사"로 읽히는지 보고 정할 것. 지금은 클래스 이름만 있고 뼈대에 규칙이 없다.
- **b · 새 표지 그림.** 들보가 주유기 앞에서 실선 → 점선으로 바뀐다. "닿는지 모른다"로 그렸지만 "거기서 끝난다"로 읽힐 수 있다. 다른 길: 들보를 화면 끝에서 끝까지 실선으로 두고 물음표만 (그러면 "닿는다"로 읽힐 수 있다). 도윤의 눈.
- **c · 판 번호.** 실제 판 2 (`local/oil-1`) · 첫째 시안 · b · b2 가 전부 같은 `episode_id` · `episode_version: 2` 다 (서로 다른 글). 화면은 id 로만 찾아서 탈이 없지만, 독자 기록이 판을 가리키게 되면 (D64 ~ D67) 시안의 판 번호가 걸린다.
- **d · 남음 지도의 흐린 알약.** 이어짐에서 주운 도구 ("손실 보전")가 지도에서는 흐리고 아래 "새로 주운 개념"에는 들어 있다. 뼈대의 동작 (b2 시안도 같다) — 이번 Step 밖.
- **e · 화면 칸의 자리.** `screen.json` 은 계약 밖의 손 칸이다 (`unpromised` · `day` · `place` 와 같은 처지). 둘째 이야기가 이 칸을 쓰게 되면 계약 (표지의 뉴스 한 줄 · 멈춘 고리의 누르기 전 말 · 풀이 뒤 문장)으로 올릴지 정해야 한다 — UX-10 ⑥ · UX-10b ⑥ 이 이미 적어 둔 숙제.
- **f · 금리 2화 사슬 가림** — 0 (지시문대로 · e2e 가 "누르기 전부터 꼬리표가 보인다"를 지킨다). 도윤에게 따로 물을 것 (D112 · UX-10 d).
- **g · `logs/frontend/F-2b/*` 여섯 장**이 `pnpm -s test` 때 다시 찍혔다 — 하나씩 `git checkout -- <파일>` 로 되돌렸다 (커밋에 없음).
