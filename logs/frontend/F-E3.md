# logs/frontend · F-E3 — 작은 손질: 병원 짧은 이야기 내림 · 카드의 체험 표시 뺌 (D91 · 작업 3)

## F-E3 · 2026-11-14 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음.
레인: 프론트 (`apps/web`).
**안 건드린 것 (0줄)**: 골든 · fixtures (병원 골든 `fixtures/episode-short-privacy-yeonghun.json` 은 지우지 않았다 — 0자) · 계약 (`docs/contract/*` · `packages/contract`) · `packages/pipeline` (면허 정지 파일은 읽기만) · `packages/db` · `packages/tokens` · 회차 글 · `/lab/play` · `/lab/short` (UX-8 · UX-9 시안) · `kit/Episode.tsx` · `kit/Short.tsx` · `scripts/shots-fe2.ts` (F-E2 의 기록 — 이제 `/short/pipc-hospital` 에서 멈춘다 · ⑤ F-E3-d).

**한 줄 답**: 실제 화면에서 병원 짧은 이야기가 사라졌다 — 첫 화면 카드 · `/short/pipc-hospital` (404) · 개인정보 남음의 "곁의 짧은 이야기" 길. 시안 `/lab/today` · `/lab/today/short` 에는 견본으로 그대로 남는다 (같은 자리 · 같은 화면). 카드에서 "체험 있음 · 없음"을 뺐다 (실제 + 시안 — 무게 "긴 이야기 · 짧은 이야기"만). 실제 짧은 이야기 e2e 는 「면허 정지…」 (홀로 선다)를 본다.

---

## ① 바꾼 것

### 1. 병원 짧은 이야기 — 실제 목록에서 내림 (D91 ① 한 사건 = 이야기 하나)
- `apps/web/src/episode/catalog.tsx` — `STORIES` 에서 `short(yeonghun, …)` 한 줄과 그 import 둘 (골든 · 표지 그림)을 뺐다. 목록 위 설명에 "곁 이야기 (같은 사건의 짧은 판)는 목록에 올리지 않는다 · 병원은 F-E3 에서 내렸다 · 시안에만 남는다"를 적었다.
  목록 한 곳이라 저절로 사라진 것: 첫 화면 카드 (편 수 "네 편 · 긴 셋, 짧은 하나") · `/short/pipc-hospital` (`generateStaticParams` 에 없음 + `shortOf` 없음 → `notFound()` → **404**) · `/s/privacy/1` 남음 장면의 "이 이야기 곁의 짧은 이야기" 길 (`kit/Episode.tsx` 의 `beside` 가 목록의 짧은 이야기 중 `sibling` 이 이 긴 이야기인 것 — 이제 0) · "개념으로 이어져요" 의 개인정보 ↔ 병원 묶음.
  `/map` 은 원래 짧은 이야기를 따로 그리지 않는다 (주제마다 긴 이야기의 지도 — 병원의 개념은 개인정보 지도에 이미 있던 것) → 화면 그대로 · 지도 셋.
- **lab 은 남긴다 — 어떻게 (내 판단 · 까닭)**: 시안 `/lab/today` 는 같은 목록 (`STORIES`)을 읽고, `/lab/today/short` 는 목록에서 code 로 찾았다 (`ShortScreen` → `shortOf`). 목록에서 빼면 시안 카드가 사라지고 시안 짧은 이야기 화면이 빈 화면이 된다. 그래서
  - `src/app/lab/today/short/data.ts` 에 시안 전용 줄 `HOSPITAL` 하나 (골든을 이미 읽어 검증해 둔 `SHORT` + 표지 그림 + 내리기 전 꼬리표 "국내 · 기술" 그대로).
  - `src/app/lab/today/data.ts` 가 `STORIES` 에서 **곁의 긴 이야기 (개인정보) 바로 아래**에 그 줄을 끼운다 → 시안 카드 차례가 F-E2 때와 같다 (배달앱 · 금리 · 개인정보 · **병원** · 면허 정지 · 견본 자리). 개념으로 이어짐 (개인정보 ↔ 병원)도 시안 목록으로 센다. 개인정보가 목록에 없으면 멈춘다 (빈 견본을 조용히 그리지 않게).
  - `src/episode/Screen.tsx` — `ShortScreen` (code → 목록에서 찾음 · 실제 주소 전용)과 `ShortLineScreen` (줄 하나 → 화면)으로 나눴다. 안의 일은 글자 그대로 옮겼다 (곁 이야기 · 도구를 목록의 긴 이야기에서 찾는 것 그대로). 실제 화면은 전과 같은 길로 선다.
  - `src/app/lab/today/short/LabShort.tsx` (새 · 11줄 · `"use client"`) — 시안 줄을 `ShortLineScreen` 에 올린다. 서버 페이지가 표지 그림 (함수)을 클라이언트 부품에 넘길 수 없어서 이 작은 다리가 필요했다.
  - 까닭: **실제 목록을 한 곳으로 둔 채** (catalog 에 "lab 전용" 칸을 만들지 않는다 — 만들면 실제 주소 쪽 코드가 시안을 알게 된다) 시안 쪽에서만 견본을 든다. 대안 "catalog 에 LAB_SHORTS 를 두고 `shortOf` 가 같이 찾기"는 `dynamicParams` 때문에 `/short/pipc-hospital` 이 다시 살아날 수 있어 버렸다.

### 2. 카드의 "체험 있음 · 없음" 뺌 (D91 ②) — 실제 + 시안
- `src/episode/today/cards.tsx` — `Weight` 가 무게 (`긴 이야기` · `짧은 이야기`)만 그린다 (`lab` 인자 · `<span data-lab>` 뺌). `CardCopy` 에서 `lab` · `noLab` 칸을 뺐다 → 실제 `/` 와 시안 `/lab/today` 가 같은 부품이라 둘 다 같이 빠진다.
- `src/episode/home-copy.ts` (실제) · `src/app/lab/today/copy.ts` (시안) — `lab: "체험 있음"` · `noLab: "체험 없음"` 두 줄씩 뺐다.
- `src/episode/kit/chrome.ts` — `besideNote` "짧은 이야기 · 체험 없음" → "짧은 이야기" (곁 이야기 길의 작은 글 — 지금은 그 길이 그려지지 않는다. 다음에 곁 이야기가 생겨도 체험 표시가 다시 나오지 않게).
- `src/episode/today/today.css` — 그 `<span>` 만 쓰던 규칙 둘 (`.td-weight span::before` 가운뎃점 · `.td-weight span[data-lab]` 강조색)을 지웠다. **색 값 · 토큰은 0자** — 그릴 것이 없어진 규칙을 걷은 것뿐이다 (palette 의 덮는 규칙 생성기는 `today.css` 를 읽지 않는다 — `check.ts` T8 OK).
- 무게는 그대로: 카드 아래 "긴 이야기" / "짧은 이야기" 한 낱말 (굵게).
- 남긴 것: 회차 화면 안의 "체험" 말 (풀이 장면의 "체험을 마치면 여기가 열려요" · 시안 스위치 "체험 없이 보기")은 카드의 표시가 아니라 손대지 않았다. `lab/today/check.ts` · `lab/episode/check.ts` 가 콘솔에 찍는 "체험 있음 / 없음"은 데이터 (`solve.lab`) 보고라 그대로.

## ② 실제 주소 확인

(배포 뒤 — 아래 "배포 확인"에 붙인다)

## ③ e2e 를 어떻게 바꿨나

### `e2e/episode.spec.ts` (실제 주소)
- `SHORT` = 골든 넷째 (병원) → **`packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice/story.json`** (catalog 가 읽는 그 파일 · 읽기만). 병원 골든은 `GONE` 으로 남겨 "없다"를 본다.
- 첫 화면: 카드 차례 `[delivery, fomc, pipc, license-notice]` (병원 · 다섯째 줄 뺌) · 편 수 "긴 이야기 셋, 짧은 이야기 하나." · 긴 카드 셋 · 짧은 카드에 **"체험 있음 · 없음"이 없다** (`/체험\s*(있음|없음)/` — 카드마다 + 목록 전체) · 짧은 카드 꼬리표 "국내 · 나라와 법" · `card-pipc-hospital` 0 · 첫 화면 글에 병원 제목 없음.
- 긴 이야기 셋: "곁의 짧은 이야기" 길 (`[data-testid^=beside-]`)이 **셋 다 0** (전: 개인정보에만 1) · 남음 장면 글에 병원 제목 없음.
- 짧은 이야기 시험을 「면허 정지…」로 다시 씀 — 홀로 선 것부터 확인 (`sibling` · `tools_from` null · `tool_lead` · `map_note` · `gain_label` null) → `/short/pipc-hospital` **404** → og:title · robots · 제목에 번호 없음 → **장면 넷의 글이 파일 그대로** (표지: 주제 · 제목 · 한 줄 · 날 · hint · 물음 · "짧은 이야기" / 무엇을 봤나: 머리 · 풀이 제목 · 첫 생각 · 깨는 사실 · 본문 둘 · 뒤집기 넷 + 풀이 · 모르는 것 · 물음 / 문서가 말한 것: 머리 · 제목 · lead · 짚은 것 셋 (머리 · 몸) · 판단 · 누구의 말 · 물음 / 남음: 머리 · 제목 · 한 줄 · 위원장의 말) → **근거 구절** (무엇을 봤나: 깨는 사실을 누르면 구절 둘 `p07` · `p13` 이 파일의 글 그대로 · 문서 이름 / 문서가 말한 것: 첫 문장의 구절이 파일의 구절 가운데 하나) → **도구 없음** (`.ep-tools` · `tool-*` 0) → 남음에 **지도 · 만난 개념 · 지도 단추 · 곁 이야기 길 없음** · 첫 화면 길 `/`.
  전의 "이 지도는 아직 저장되지 않아요" 확인은 뺐다 — 홀로 선 짧은 이야기는 지도가 없어 그 줄이 지도와 같이 안 나온다 (`kit/Short.tsx` 그대로).
- 마지막 시험의 404 목록에 `/short/pipc-hospital` · `/s/privacy/pipc-hospital` · `/s/appeal/1` 를 넣었다. 시안 `/lab/today/short` 가 시안으로 서는 것은 그대로 본다.

### `e2e/today.spec.ts` (시안)
- 카드 차례 `[delivery, fomc, pipc, pipc-hospital, license-notice, empty]` — 견본이 내리기 전 자리에 남는다 · 병원 → `/lab/today/short` · 면허 정지 → `/short/license-notice`.
- "체험 있음"을 기대하던 줄 → **없다**를 본다 (무게 둘만).
- 개념으로 이어짐 묶음 1 (개인정보 ↔ 병원 — 시안 목록으로 센다).
- 시안 짧은 이야기 시험 (장면 넷 · 근거 · 도구 셋 · 지도 · 곁 이야기 `/lab/episode/pipc`)은 **한 글자도 안 고치고** 지난다 → 견본 화면이 그대로다.

## ④ 골든 글에 남은 것 — 자리만 (고치지 않았다 · 다음 골든 손질 때)

| 골든 | 자리 | 글 | 왜 걸리나 |
|---|---|---|---|
| `fixtures/episode-privacy-1.json` | `scenes.next.coming[2].head` | "병원 쪽 이야기는 따로" | 실제 `/s/privacy/1` 의 "이어짐" 장면에 그대로 보인다 — 이제 따로 된 이야기가 실제 화면에 없다 (F-E2-a 에 적힌 그 자리) |
| 같은 파일 | `scenes.next.coming[2].body.t` | "영훈의료재단은 꼴이 달라요. … 회원가입이 꼭 필요한지부터 다시 보라고 당부했어요." | 글 자체는 사실 (구절이 받친다) — 머리만 "따로"를 약속한다. 손질 때 머리를 "병원 쪽은 꼴이 달라요" 같은 말로 바꾸면 몸은 그대로 둘 수 있어 보인다 (추천일 뿐) |
| `fixtures/episode-short-privacy-yeonghun.json` | `sibling.note` | "대교 쪽 이야기 · 긴 이야기 · 체험 있음" | 시안 `/lab/today/short` 남음의 곁 이야기 길에 "체험 있음"이 보인다 — 카드에서 뺀 표시가 골든 글로 남았다 (시안에만 · 실제엔 없음) |

(같은 손질 때 볼 것 — F-E2-a 그대로: 개인정보 · 배달앱의 "이 시리즈가 처음이시네요" · "한 회차예요" · "다음 회차가 될 일들")

## ⑤ _open

- **F-E3-a 첫 화면 "개념으로 이어져요"가 비었다** — 실제 목록에서 함께 가진 개념 묶음은 개인정보 ↔ 병원 하나뿐이었다 (F-E2-f). 이제 머리 · 한 줄 ("같은 개념을 만나는 이야기끼리는 서로 이어져요.") · "개념 지도 보기" 단추만 남는다 (빈 `<ul>` — 눈에 보이는 빈 칸은 없다 · 그림 `local-home-3` 로 봤다). 지도로 가는 입구로는 선다. **고치지 않았다** — 고르는 것은 화면 글 (말을 바꿀지 · 묶음이 없으면 구역을 접고 단추만 둘지) 이라 PM · 도윤. 긴 이야기끼리 같은 개념이 생기면 (예: 금리 3화 · 퍼센트포인트) 저절로 찬다
- **F-E3-b `/map` 의 글 "짧은 이야기에서 만난 개념은 같은 주제의 지도에 붙어요"** (`home-copy.ts` `mapNote`) — 규칙으로는 참이지만 지금 실제의 짧은 이야기 (면허 정지)는 만나는 개념이 없다 (`tools_from` null). 손대지 않음
- **F-E3-c 홀로 선 짧은 이야기의 남음 장면** — 지도 · 만난 개념 · "아직 저장되지 않아요" 줄 없이 한 줄 · 위원장의 말 · "처음부터 다시" · "첫 화면으로"로 끝난다 (그림 `short-4-keep-end`). F-E2-d (화면으로 못 봤다)는 P-S1 이후 이미 실물로 서 있었고 이번 e2e 가 처음으로 끝까지 본다. 허전한지는 D91 ③ (면허 정지를 새 꼴로 다시 쓰거나 내리기)과 같이
- **F-E3-d `scripts/shots-fe2.ts`** 는 F-E2 의 기록이라 손대지 않았다 — 지금 돌리면 `/short/pipc-hospital` 에서 멈춘다. 이번 그림은 새 `scripts/shots-fe3.ts`
- F-E2 의 _open (a 골든의 시리즈 · 회차 말 · b 손 값 꼬리표 · c 자정 · e 한 시리즈 둘 · j 실제 아이폰)은 그대로

### 스스로 내린 판단 — 수용 여부는 PM
- lab 견본을 catalog 가 아니라 **시안 쪽 (`lab/today/short/data.ts`)에 줄 하나**로 · 자리는 곁의 긴 이야기 바로 아래 (①-1)
- `Screen.tsx` 를 `ShortScreen` / `ShortLineScreen` 둘로 나눔 + 시안 다리 `LabShort.tsx` (①-1)
- `besideNote` 에서도 "체험 없음" 뺌 · 그 `<span>` 의 CSS 두 규칙 걷음 (①-2)
- "개념으로 이어져요"가 비는 것을 그대로 둠 (F-E3-a)

## 파일

| 파일 | 무엇 |
|---|---|
| `apps/web/src/episode/catalog.tsx` | 병원 줄 · import 둘 뺌 · 설명 |
| `apps/web/src/episode/Screen.tsx` | `ShortLineScreen` 으로 나눔 |
| `apps/web/src/episode/today/cards.tsx` | 무게만 · `CardCopy` 에서 `lab` · `noLab` 뺌 |
| `apps/web/src/episode/today/today.css` | 체험 표시 규칙 둘 걷음 |
| `apps/web/src/episode/home-copy.ts` | `lab` · `noLab` 뺌 |
| `apps/web/src/episode/kit/chrome.ts` | `besideNote` |
| `apps/web/src/app/lab/today/data.ts` | 시안 목록 = 실제 목록 + 견본 (곁의 긴 이야기 아래) |
| `apps/web/src/app/lab/today/copy.ts` | `lab` · `noLab` 뺌 |
| `apps/web/src/app/lab/today/short/data.ts` | 시안 전용 줄 `HOSPITAL` |
| `apps/web/src/app/lab/today/short/LabShort.tsx` | 새 — 시안 줄을 화면에 |
| `apps/web/src/app/lab/today/short/page.tsx` | `LabShort` 를 씀 |
| `apps/web/e2e/episode.spec.ts` · `apps/web/e2e/today.spec.ts` | ③ |
| `apps/web/scripts/shots-fe3.ts` | 새 — 그림 찍기 (F-E2 의 것과 같은 꼴) |
| `logs/frontend/F-E3.md` · `logs/frontend/F-E3/` | 이 로그 · 그림 |
| `docs/development-frontend.md` | F-E3 줄 ☑ |

## 검사 (붙인 그대로)

작업 폴더 그대로 (2026-11-14 · 남의 미커밋 없음 — `git status` 로 확인).

**`pnpm -s typecheck`**
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
```

**`pnpm -s test`** (끝에 `exit 0`)
```
packages/contract test:       Tests  135 passed (135)
packages/pipeline test:       Tests  156 passed (156)
packages/db test:             Tests  101 passed (101)
apps/web test:   ✓   3 e2e/episode.spec.ts:39:1 › 첫 화면 = 오늘 — 종이 톤 · 이야기 넷 (긴 셋 + 짧은 하나 · 글은 파일 그대로) · 병원 짧은 이야기 없음 · 체험 표시 없음 …
apps/web test:   ✓  20 e2e/episode.spec.ts:108:3 › /s/price/1 — 누가 값을 정하나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 …
apps/web test:   ✓  26 e2e/episode.spec.ts:108:3 › /s/rate/2 — 금리는 어디로 2화 (번호 보임): 처음 온 독자의 조립을 끝까지 …
apps/web test:   ✓  27 e2e/episode.spec.ts:108:3 › /s/privacy/1 — 내 정보는 누가 지키나 1화 (번호 없음): 처음 온 독자의 조립을 끝까지 …
apps/web test:   ✓  30 e2e/episode.spec.ts:192:1 › /short/license-notice — 짧은 이야기 (홀로 선다): 장면 넷 · 파일의 글 그대로 · 근거 구절 · 번호 없음 · 곁 이야기 길 없음 · …
apps/web test:   ✓  32 e2e/episode.spec.ts:259:1 › 시안 주소는 그대로 시안이다 — 같은 부품 · 시안 띠 · 시안 주소끼리 오간다 …
apps/web test:   ✓  54 e2e/today.spec.ts:16:1 › 오늘 — 긴 이야기 셋 (골든의 글 그대로) · 짧은 이야기 (견본 병원 + 실제 목록의 면허 정지) …
apps/web test:   ✓  60 e2e/today.spec.ts:115:1 › 짧은 이야기 — 장면 넷 · 번호 없음 · 근거를 누르면 원문 구절 · 지도에 도구 셋 · 긴 이야기로 가는 길 (한 글자도 안 고침)
apps/web test:   74 passed (3.2m)
exit 0
```
web e2e 74 (새 0 · 고친 것 4 — 첫 화면 · 긴 이야기 셋 (곁 길 0) · 짧은 이야기 (면허 정지로 다시 씀) · 시안 오늘). 시험이 다시 찍은 F-2b 그림 (`desktop-basic-1` · `desktop-basic-9` · `motion-375x667.webm` · `se-basic-1` · `x-basic-1` · `x-basic-9`)은 파일 하나씩 `git checkout -- <파일>` 로 되돌렸다.

**lab `check.ts` 여섯** (`pnpm -s exec tsx <파일>` · apps/web 에서 · 전부 exit 0)
```
src/app/lab/today/check.ts
  ■ 오늘 — 카드
    긴 이야기  누가 값을 정하나 (주제 이름만 — 번호 없음) · 체험 있음 → /lab/episode
    긴 이야기  금리는 어디로 · 2화 (이어지는 이야기 — 번호 · 시리즈 줄 · 지난 이야기) · 체험 있음 → /lab/episode/fomc
    긴 이야기  내 정보는 누가 지키나 (주제 이름만 — 번호 없음) · 체험 있음 → /lab/episode/pipc
    짧은 이야기 내 정보는 누가 지키나 (주제 이름만 — 번호 없음) · 체험 없음 → /lab/today/short
    짧은 이야기 처분은 어떻게 뒤집히나 (주제 이름만 — 번호 없음) · 체험 없음 → /short/license-notice
    자리만     견본 자리 — 글 없음
    개념으로 이어짐: 과징금 · 시정명령 · 안전조치의무 — 해킹은 당한 건데, 왜 회사가 벌을 받을까 ↔ 병원이 털렸다는데, 어디가 털린 걸까
  OK overrides.css 가 최신이다 (규칙 44)
  OK — 짧은 이야기 (계약 검증 · 그리지 않을 것) · 오늘 (번호 규칙) · 색 시안 (AA · Claude 결 · 눈 피로) · 덮는 규칙
  (콘솔의 "체험 있음 / 없음"은 검사가 데이터 solve.lab 을 읽어 찍는 보고다 — 카드의 글이 아니다)
src/app/lab/episode/check.ts
  실제 주소: /s/price/1 · /s/rate/2 · /s/privacy/1 · /short/license-notice — 첫 화면 맨 위 묶음 낸 날 없음 (최근 이야기) 4 편 · 지난 이야기 0 편
  번호 화면 규칙 (D88 E-20): price 번호 없음 (긴 이야기 1화) · rate 번호 보임 (긴 이야기 2화) · privacy 번호 없음 (긴 이야기 1화)
  OK — 회차 3 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
src/app/lab/short/check.ts         OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
src/app/lab/play/check.ts          OK — 새 사실 0 · 채점 없음 · 반사실 없음 · 한국 대출 이자 없음 · D61 ③ ④ · 고를 것마다 받는 말 · ★ 칸의 이름 · 실제 화면과 떨어져 있음
src/app/lab/episode/rate-3/check.ts     OK — 대기 화면의 글 (숫자는 밝혀 둔 날짜 하나 · 화면 번호뿐)
src/app/lab/episode/fomc-auto/check.ts  OK — 계약 검증을 지났고 (…) 화면 쪽 검사도 맞다
```

**`next build`** (apps/web · exit 0)
```
✓ Compiled successfully in 1959ms
✓ Generating static pages using 9 workers (33/33) in 193ms
├   /short/[code]
│ └ ● /short/license-notice          ← 병원 (/short/pipc-hospital) 이 빠졌다
├   /s/[series]/[n]
│ ├ ● /s/price/1
│ ├ ● /s/rate/2
│ └ ● /s/privacy/1
├ ○ /lab/today
├ ○ /lab/today/short                 ← 견본은 그대로 정적
```

**로컬 (next start 3310 · 배포 전)** — `curl`
```
200 /   200 /short/license-notice   404 /short/pipc-hospital   200 /s/privacy/1   200 /map
200 /lab/today   200 /lab/today/short   200 /lab/today/map
```
로컬 그림 (`scripts/shots-fe3.ts http://localhost:3310 local <스크래치 폴더>` — 커밋하지 않음)으로 첫 화면 · 개인정보 남음 끝 · 면허 정지 남음 끝 · 시안 오늘 · 시안 짧은 이야기 남음을 눈으로 봤다. 콘솔 오류는 `/favicon.ico` 404 (원래 없는 파일 — 이번과 상관없음) · `/short/pipc-hospital` 404 (맞다) 뿐.

