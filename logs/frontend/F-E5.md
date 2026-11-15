# logs/frontend · F-E5 — 11/15 오늘 두 편을 실제 주소에 (D107 ~ D111)

## F-E5 · 2026-11-15 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음.
레인: 프론트 (`apps/web`).
안 건드린 것: 계약 · 골든 · fixtures · `packages/*` (0줄 — 이야기의 글 · 근거 · 지도 자리는 파이프라인 파일 그대로 읽기만) · tokens (새 색 0) · lab 화면 (`src/app/lab/*` 0줄) · 지난 이야기 넷의 화면 동작 · `.claude/`.

**한 줄 답**: 실제 `/` 의 맨 위가 "오늘의 이야기 — 두 편"이 됐다 (긴 「기름값 최고가격, 누구의 값을 묶은 걸까」 `/s/oil/1` · 짧은 「사진 때문에 수억 유로라는데, 사진을 가져간 걸까」 `/short/meta-gallery`). 지난 넷은 그 아래 "지난 이야기"로 내려갔다. 1화라 번호 · 시리즈 줄 · 다음 화가 숨고, 지도의 다음 화 개념 둘은 보이지 않고, "다음 회차가 될 일들"은 "남은 일들"이다.

---

## ① 주소

- 실제: **https://claro-lime-one.vercel.app/** · **/s/oil/1** · **/short/meta-gallery** (지도 `/map` 에도 기름값 한 장이 는다)
- 이 Mac 에서: `pnpm --filter @claro/web dev` → `http://localhost:3100/`
- 그림 다시 찍기: 서버를 켜 두고 `pnpm --filter @claro/web exec tsx scripts/shots-fe5.ts http://localhost:<포트> local`

## ② 바꾼 것

| 파일 | 무엇 |
|---|---|
| `apps/web/src/episode/catalog.tsx` | STORIES 맨 위에 두 줄 (긴 → 짧은 · `day: "2026-11-15"` · 국내 / 돈 · 해외 / 기술) · `OIL_LOOK` · `LongLine.unpromised` (손으로 적는 화면 칸 — 아래 ④) + `unpromised(ep)` · `episodeOf(file, stores)` (구절이 기대는 문서 파일 — 화면은 안 읽고 검사가 읽는다) |
| `apps/web/src/episode/episodes/oil/Art.tsx` · `Glyph.tsx` (새) | 표지 그림 · 도구 다섯의 작은 그림 (③) |
| `apps/web/src/episode/home/cards.tsx` | 짧은 이야기 작은 그림 `GalleryFace` + 표 (code → 그림)에 한 줄 |
| `apps/web/src/episode/kit/ConceptMap.tsx` | 실제 화면 + `unpromised` 인 이야기만: ghosts (점 · 선)과 범례의 그 칸을 그리지 않는다 |
| `apps/web/src/episode/kit/Episode.tsx` | 이어짐 장면: 실제 화면 + `unpromised` 면 `coming_label` 자리에 `CHROME.next.leftLabel` |
| `apps/web/src/episode/kit/chrome.ts` | 화면 말 한 줄 `next.leftLabel: "남은 일들"` |
| `apps/web/e2e/episode.spec.ts` | 카드 여섯 · 묶음 · 머리 (시계 고정 — 11/15 "오늘의 이야기" · 11/16 "11월 15일의 이야기") · `/s/oil/1` 끝까지 · `/short/meta-gallery` 끝까지 (짧은 이야기 시험을 두 편에 돌림) · 1화 숨김 · ghosts · 콘솔 오류 0 |
| `apps/web/e2e/today.spec.ts` | 시안 (`/lab/today`)이 같은 목록을 읽어 카드 둘 · 지도 한 장이 는 것 — **기대하는 수만** 맞췄다 (시안 코드 0줄) |
| `apps/web/scripts/shots-fe5.ts` (새) | 폰 그림 찍기 + 가로 넘침 · 콘솔 오류 세기 |

`page.tsx` · `home.css` · `home-copy.ts` 는 0줄 — 날로 묶기 (`bundle`) · "오늘 / 11월 15일" 머리 규칙 · "지난 이야기" 칸은 F-E2 · F-E4 가 만들어 둔 그대로 섰다.

## ③ 그림 — 무엇을 그렸나 · 까닭

- **표지 그림 (`oil/Art.tsx`)**: 왼쪽에 정유소 탱크, 그 위에 **천장 (들보)** 이 걸려 있고, 들보는 오른쪽 **주유기 앞에서 끝난다**. 끝나는 자리에 감색 동그라미 **≠**. 주유기와 그 위의 가격표는 천장 밖에 서 있고 **가격표가 천장보다 높이** 솟아 있다. 탱크 → 주유기 사이의 감색 점선은 기름이 넘어가는 길 (체험의 사슬).
  까닭: 이야기의 뒤집기가 "석유 최고가격 ≠ 주유소 가격표의 천장"이다 — 천장이 **사슬의 어디까지 덮나**를 한 장으로. ≠ 는 개인정보 표지와 같은 그림말 (배달앱 = · 금리 ‖ 의 자리).
- **숫자 · 글자 없음** — 가격표 둘 (주유기 화면 · 솟은 표)에는 선 하나만. 주유소 쪽에 값을 그리지 않는다 (P-T1 "그리지 않을 것").
- **결**: 지난 셋과 같은 클래스만 썼다 (`ep-art-phone` · `-bowl` · `-tag` · `-tagline` · `-steam` · `-chain` · `-eq` · `-eqline` · `-shadow` · `-ink`) — 선 굵기 2.2 · 종이 면 · 옅은 감색 면 하나 · 감색 동그라미 하나. **새 CSS 0줄 · 새 색 0**.
- **글리프 (`oil/Glyph.tsx`)** — 24 칸 · 선 1.8: 최고가격 = 천장 선 아래에서 멈춘 화살 · 공급가격과 판매가격 = 값표 둘 · 고시 = 문서 · 묶이는 자리 = 꺾쇠가 덮는 칸과 밖의 점선 칸 · 손실 보전 = 받침에 채워 넣는 화살.
- **짧은 이야기 카드의 작은 그림 (`GalleryFace`)**: 폰 한 대 + 사진첩 칸 넷 + 감색 물음. PM 의 예는 "동의 표시"였는데 **물음표로 뒀다** — 작은 그림의 규칙이 "물건 하나 + 물음 하나 · 뜻을 싣지 않는다" (F-E4)이고, 체크 표시는 "동의를 받았다"로 읽힌다 (이야기는 그 반대). 짧은 이야기 화면의 표지 그림은 기본 그림 (문서 + 물음) 그대로다 — 면허 이야기와 같다.

## ④ 1화 · ghosts 확인

- **번호 화면 규칙 (D88 E-20)** — 고친 것 없이 섰다 (`catalog.numbered("oil")` = false): 표지의 "1화" 자리에 "긴 이야기" · "시리즈" 대신 "주제" · 시리즈 줄 없음 · 장면 머리의 "0화 · " "1화 · " 떼임 · 남음의 "다음 화" 없음 · 제목 (`<title>`)에 번호 없음 · 첫 화면 카드에 번호 · "지난 이야기 30초" 없음 · "이어지는 이야기" 칸에 안 뜸. e2e 가 본다.
- **ghosts ("수출 물량 제한" · "제세금")** — 안 보인다: 남음의 작은 지도 · 펼친 지도 · `/map` 셋 다 점 0 · 선 0 · 범례의 "아직 안 주운 것" 칸 없음 · 그 이름이 화면 글에 없음 (e2e + 그림 `local-oil-map.png` · `local-map-1.png`).
- **"다음 회차가 될 일들" → "남은 일들"** (`local-oil-next-1.png`) — 아래 항목 머리들이 "남은 일 · …" 이라 그대로 이어 읽힌다.
- **어떻게 (최소로 · 까닭)**: 목록의 줄에 손으로 적는 칸 하나 `unpromised: true` (기름값에만). 번호 없는 이야기 전부 (`bare`)에 걸지 않았다 — **배달앱 · 개인정보도 1화지만 ghosts 와 "다음 회차가 될 일들"이 지금 그대로 보여야 한다** (지난 이야기의 화면 동작을 바꾸지 말 것). e2e 가 지난 셋은 ghosts 둘씩 · 파일의 `coming_label` 그대로임을 같이 본다. 시안 (`real` 없음)에는 아무 영향이 없다. 데이터 (episode.json 의 `map.ghosts` · `coming_label`)는 0자.

## ⑤ 폰 그림 · 내 눈으로 본 것 (390×844 · 2배 · `logs/frontend/F-E5/local-*.png` 34 장)

`shots-fe5.ts` 가 센 것: **가로 넘침 0 · 콘솔 오류 0** · `/` `/s/oil/1` `/short/meta-gallery` `/map` 전부 200.

- **첫 화면** (`home-1 ~ 6`): 머리 "오늘의 이야기 / 두 편이에요. 긴 이야기 하나, 짧은 이야기 하나." → 큰 카드 (기름값 · 표지 그림 · 단추) → 낮은 카드 (메타 · 해외는 이끼색) → "지난 이야기" 아래 넷. 카드 여섯 · 겹침 없음. 개념 판에 "기름값은 어디서 묶이나" 줄이 맨 위에 붙었다 (도구 다섯 — 두 줄로 접힌다). 화면이 더 길어졌다 (F-E4 _open b 그대로).
- **`/s/oil/1` 표지** (`oil-cover-1`): 그림 → "긴 이야기" → 제목 두 줄 → 한 줄 → 날 → 귀띔 → 물음 단추가 한 화면에 든다. 위쪽 줄의 "긴 이야기 · 기름값은 어디서 묶이나"가 "근거" 단추에 **바짝 붙는다** (겹치지는 않는다 — 주제 이름이 지난 셋보다 길다 · _open c).
- **체험** (`oil-aha-chain-before` · `-after`): 누르기 전 — 고리 셋 (최고가격 고시 "값을 정해요" · 정유사 공급가격 "여기일까요?" · 주유소 판매가격 "적용 대상에서 제외") · 단추 "천장 걸어 보기". 누른 뒤 — 위 두 고리에 불 ("휘발유 1,784원" · "최고액 지정 대상") · 주유소 고리는 그대로 비고 그 앞에 "? 주유소가 받는 값은? 오늘 문서엔 없어요" · 아래 풀이 · "묶이는 자리" 새 도구 카드. 글 잘림 없음.
- **이어짐 · 남음 · 지도** (`oil-next-1 · 2` · `oil-keep-1 · 2` · `oil-map`): "남은 일들" 아래 셋 · "아직 모르는 것" · 한 줄 · 지도에 개념 다섯 (ghost 없음). **지도의 "공급가격과 판매가격" 알약이 지도 칸의 오른쪽 테두리에 닿는다** (화면 밖으로는 안 나간다 — 자리 [79, 41] 과 긴 이름 · 데이터의 자리라 안 고쳤다 · _open b).
- **`/short/meta-gallery`** (`meta-cover-1` → `meta-keep-1`): 표지 (제목 세 줄 · 한 줄 다섯 줄 — 한 화면에 든다) → 무슨 일인가 → 문서가 말한 것 → 남음. 독자 글은 한국어. **근거 시트** (`meta-where-sheet`): 구절은 영어 원문 그대로 ("The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies." …) · 그 아래 출처에 **기관 이름 · 문서 이름 · 날짜 · 주소** 가 다 보인다 ("Garante per la protezione dei dati personali (이탈리아 개인정보 감독기구) 보도자료 「The Garante has fined Meta Platforms Ireland Limited 805 million euros」 — 영어판에서 발췌 (… https://www.garanteprivacy.it/…)") — 긴 주소는 줄바꿈되어 넘치지 않는다 (D109 의 출처 표시 조건).
- 내가 읽다 걸린 글 (고치지 않았다 — 이야기의 글 · 공통 화면 말): 표지의 "이 시리즈가 처음이시네요. 지금까지의 이야기부터 짧게 볼게요." · 이어짐의 "오늘은 이 시리즈의 한 회차예요." (1화뿐인 주제에서 — D89 a 와 같은 숙제) · 이어짐 줄 끝의 "다음 / ?" 칸.

## ⑥ 검사 결과 (붙인 그대로 · 2026-11-15)

```
$ pnpm -s typecheck
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm -s --filter '!@claro/web' test          (contract · pipeline · db)
 Test Files  5 passed (5)
      Tests  150 passed (150)
 Test Files  15 passed (15)
      Tests  182 passed (182)
 Test Files  3 passed (3)
      Tests  101 passed (101)

$ pnpm -s test          (apps/web 에서 — playwright e2e 전부)
  ✓   e2e/episode.spec.ts › 첫 화면 = 오늘 — 종이 톤 · 이야기 여섯 (11/15 의 둘 + 지난 넷 · 글은 파일 그대로) · …
  ✓   e2e/episode.spec.ts › 11/15 의 두 편 — 새 두 주소가 열린다 (200) · 콘솔 오류가 없다 (첫 화면 · 긴 이야기 · 짧은 이야기 · 지도)
  ✓   e2e/episode.spec.ts › /s/oil/1 — 기름값은 어디서 묶이나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 · …
  ✓   e2e/episode.spec.ts › /short/meta-gallery — 짧은 이야기 (홀로 선다): 장면 넷 · 파일의 글 그대로 · 근거 구절 · …
  78 passed (3.3m)

$ pnpm --filter @claro/web exec tsx src/app/lab/today/check.ts
OK — 짧은 이야기 (계약 검증 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts
실제 주소: /s/oil/1 · /short/meta-gallery · /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 2026-11-15 2 편 · 지난 이야기 4 편
번호 화면 규칙 (D88 E-20): oil 번호 없음 (긴 이야기 1화) · price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
```

- 뿌리의 `pnpm -s test` 한 번 대신 **web 과 나머지를 나눠 돌렸다** (web e2e 를 두 번 돌리지 않으려고) — 합은 같다: contract 150 · pipeline 182 · db 101 · web e2e 78 (75 → 78: 콘솔 오류 시험 1 · 긴 이야기 1 · 짧은 이야기 1).
- **처음에 `lab/episode/check.ts` 가 FAIL 82 였다** (`DOC_MISSING` — 기름값 회차의 구절을 대 볼 문서 파일을 목록이 안 줬다: `episodeOf` 가 `stores: []`). 검사를 느슨하게 하지 않고 `episodeOf(file, stores)` 로 그 사건의 `store.documents.json` 을 줬다 → 구절 82 · 문서 13 전부 저장된 문서와 대 봐 OK.
- e2e 가 다시 찍은 `logs/frontend/F-2b/*` 여덟 파일은 하나씩 `git checkout -- <파일>` 로 되돌렸다.
- 띄운 서버 (그림용 3210 · 시험용 3101) 꺼짐 확인 (`pgrep -fl "next start"` → 없음) · 그림용 빌드 폴더 `.next-fe5` 지움.

## ⑦ 배포 확인

커밋 `6dd60c8` (46 파일 — 코드 11 · 로그 1 · 그림 34 · 파일 하나씩 지정) → push (`074fac7..6dd60c8 main`) → 1분 남짓 뒤 실제 주소가 바뀌었다 (push 직후 한 번은 새 두 주소가 404 — 옛 판 · 23:30 에 아래 그대로).

```
$ curl -s -o … -w "%{http_code}" https://claro-lime-one.vercel.app<주소>   +   <title>
200 /                    — <title>Claro — 뉴스 하나가 이야기 한 편이 돼요</title>
200 /s/oil/1             — <title>기름값 최고가격, 누구의 값을 묶은 걸까 — 기름값은 어디서 묶이나 · Claro</title>
200 /short/meta-gallery  — <title>사진 때문에 수억 유로라는데, 사진을 가져간 걸까 — 내 정보는 누가 지키나 · 짧은 이야기 · Claro</title>
200 /map                 — <title>개념 지도 · Claro</title>

/ 의 카드 (HTML 의 차례): card-oil-1 · card-meta-gallery · card-delivery · card-fomc · card-pipc · card-license-notice
/ 의 머리 (서버가 그린 글): <h1 data-day="2026-11-15" data-testid="head">11월 15일의 이야기</h1>   ← 읽는 기기가 한국 날짜 11/15 면 "오늘의 이야기"로 바뀐다
/ 에 두 제목이 있다: "기름값 최고가격" 1 · "사진 때문에 수억 유로라는데" 1
og:title — /s/oil/1 "기름값 최고가격, 누구의 값을 묶은 걸까" · /short/meta-gallery "사진 때문에 수억 유로라는데, 사진을 가져간 걸까"
```

- 제목에 "1화"가 없다 (번호 규칙). 실제 주소의 폰 그림은 찍지 않았다 (같은 커밋의 빌드를 이 Mac 에서 찍은 것이 ⑤ — PM 이 폰 크기로 본다).
- **11/16 0시 (한국 시각)부터 머리는 "11월 15일의 이야기"다** — 규칙대로다 (거짓 "오늘" 없음). 이 로그의 배포 줄을 싣는 둘째 push (로그만) 가 한 번 더 배포를 돌린다 — 화면은 같다.

## ⑧ _open (PM · 도윤이 정할 것)

- **a `unpromised` 는 화면 쪽에 손으로 적는 칸이다** (계약에 "다음 화가 정해졌나" 칸이 없다 — 사람 입력 `series/oil.json` 의 `next_document` 에 글로만 있다). 같은 일이 또 생기면 계약의 칸으로 올릴지 (백엔드). **배달앱 · 개인정보 (둘 다 1화 · 다음 화 미정)의 ghosts 와 "다음 회차가 될 일들"은 그대로 뒀다** — 같은 규칙을 걸지는 PM (걸려면 목록의 두 줄에 `unpromised: true` 만 더하면 된다).
- **b 지도의 "공급가격과 판매가격"이 지도 칸 오른쪽 테두리에 닿는다** (자리 [79, 41] · 이름이 길다). 자리는 파이프라인 파일의 것이라 안 고쳤다 — 자리를 왼쪽으로 옮기거나 (파이프라인) 지도 부품이 가장자리를 피하게 (화면) 할지.
- **c 위쪽 줄의 "긴 이야기 · 기름값은 어디서 묶이나"가 "근거" 단추에 바짝 붙는다** (390 폭 · 겹치지는 않음). 더 긴 주제 이름이 오면 넘친다 — 말줄임을 걸지.
- **d 1화뿐인 주제의 공통 화면 말** — "이 시리즈가 처음이시네요…" · "오늘은 이 시리즈의 한 회차예요…" · 이어짐 줄의 "다음 / ?" (D89 a 그대로 · 이야기 파일의 글이라 0자).
- **e 짧은 이야기 카드의 작은 그림을 "동의 표시" 대신 물음표로 뒀다** (③ 의 까닭). 표지 그림은 기본 그림.
- **f 시안 `/lab/today` · `/lab/today/map` 에도 두 편이 뜬다** (같은 목록을 읽어서 — 시안 코드는 0줄 · 시험의 수만 고쳤다). 시안에서는 `real` 이 없어 기름값 지도의 ghosts 둘이 **겹쳐서** 보인다 (자리가 같다 [58, 8]) — 시안이라 그대로 뒀다.
- **g 화면이 더 길어졌다** (카드 여섯 + 개념 판 넷 — F-E4 _open b · f).
- **h 실제 아이폰 미확인** (이 Mac 의 Chrome 390×844 로만 봤다 — F-E4 h 그대로).
