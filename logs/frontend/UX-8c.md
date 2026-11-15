# UX-8c — 새 꼴 짧은 이야기를 폰으로 읽을 lab 화면 (D99 ③ · D101 PS2-o)

## UX-8c · 2026-11-15 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음 · 비밀 (키 · .env) 출력 0.
**같은 때 돈 다른 일 (건드리지 않음)**: PM — `license-notice-flow/` 의 human.json · story.json · review.json · sheet.md · `logs/correction-log.jsonl` / P-S2f — `packages/pipeline/*` · `logs/pipeline/P-S2f*` · `docs/development-pipeline.md` · `scripts/verify-ledger.py`. story.json 은 **읽기만** 했다 (빌드 · 시험이 읽는다).
**고친 곳**: 새 `apps/web/src/app/lab/flow/` (layout · `license-notice/` page · data · shots) · 새 `apps/web/src/app/lab/short/flow.ts` (되돌리기 한 곳) · `apps/web/src/app/lab/short-b/data.ts` (되돌리기를 위 파일로 옮김 — 보이는 것 0) · 새 e2e `apps/web/e2e/lab-flow.spec.ts` · 그림 `logs/frontend/UX-8c/` 아홉 · 이 로그 · `docs/development-frontend.md` UX-8c 줄.
**안 건드린 것 (0줄)**: `lab/short/Light.tsx` · `lab/short/types.ts` (git 해시 HEAD 와 같음 — `69879320` · `8db4e569`) · `lab/short-b` 의 page · layout · check · shots · 실제 주소 (`/` · `/s/*` · `/short/*` · `src/episode/*` · `catalog.tsx`) · 계약 · 골든 · packages/* (`git diff` 0줄).

---

## ① 폰에서 여는 법

**`https://claro-lime-one.vercel.app/lab/flow/license-notice`** (배포 확인 ⑤). 로컬: `pnpm --filter @claro/web dev` → `http://localhost:3100/lab/flow/license-notice`.
- 표지 (「면허 정지가 취소된 건 / 운전자가 억울해서였을까」 · 짧은 이야기 · 나라와 법) → 물음 단추 하나 ("그럼 왜 취소됐냐고요?") → 한 흐름이 끝까지 (이 한 편에는 고르기가 없다 — PS2-a · 그래서 기다림 없이 바로 이어진다) → 남는 한 줄 · 낱말 카드 하나 (사전 통지서 · 접혀서) · 누구의 말 → **견줘 읽기 = 옛 꼴 `/short/license-notice`** ("같은 원문 · 앞서 낸 글" · 「면허 정지가 취소됐다는데, 잘못이 없었다는 걸까」).
- 오른쪽 위 "근거" 를 켜고 글을 누르면 저장된 문서의 구절이 아래에서 뜬다 (시안 · 색 스위치는 `/lab/short-b` 와 같다).
- **주소 꼴 `/lab/flow/<옛 code>`** — `flow` 는 계약의 꼴 이름 (`form: "flow"`). 뒤는 옛 주소 `/short/license-notice` 와 같은 이름이라 둘을 나란히 놓고 말하기 쉽다 (이야기의 code 는 `license-notice-flow` — 주소에 flow 가 두 번 서지 않게). 한 편뿐이라 `[code]` 동적 주소는 만들지 않았다 (UX8c-e).

## ② 어떻게 읽나 — story.json → 계약 → lab 꼴

```
packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice-flow/story.json   (빌드할 때 import — 글은 코드에 0자)
  → parseFlowStory(story, { documents: store.documents.json 의 source_documents })   계약 검증 — 모양 · 숫자 · 뼈의 차례 · 뒤집기 · 고르기 · 문서의 문장 · 낱말 + 구절이 저장된 문서의 글 그대로 (불변식 8)
                                                                                    · `_source` (만든 모델 · "파이프라인" 이 적힌 칸)는 계약이 걷어 낸다 (`_` 칸) → 화면 · 페이지 데이터에 안 실린다
  → toLight(FLOW, { event_code, category: "나라와 법" })   apps/web/src/app/lab/short/flow.ts — lab 꼴로 되돌리기 (칸의 이름 · 자리만)
  → <Light story={LIGHT} compare={COMPARE} />            apps/web/src/app/lab/short/Light.tsx 그대로
```

- **되돌리기를 한 곳으로 옮겼다** — B-E4 가 `lab/short-b/data.ts` 안에 둔 `toBlock` + `LIGHT` 짓기를 **글자 그대로** `lab/short/flow.ts` 의 `toLight(story, { event_code, category })` 로 (lab 꼴 `types.ts` 옆 — lab 꼴의 일이다). short-b 와 이 화면이 같은 것을 부른다 (복제 0). 칸의 차례도 그대로 짓는다 (아래 ③ 의 바이트 대조).
- **시안 전용 값 (`lab/flow/license-notice/data.ts`)**: 사건 이름 `ACRC-20261028-LICENSE-NOTICE` · 카테고리 "나라와 법" (계약에서는 카탈로그의 값 — EPISODE §14.7) · 문서 파일 (`store.documents.json` — 근거 시트는 이야기의 `quotes` · `docs` 를 쓰니 파일 경로는 시트에 안 쓰이고, **계약 검증에 문서를 주는 데** 쓴다) · 견줘 읽기 (`/short/license-notice` · "같은 원문 · 앞서 낸 글" · 제목은 **옛 story.json 에서 읽는다** — 옮겨 적지 않음).
- **PM 손질이 그대로 실린다**: 화면 코드에 이야기의 글이 0자 — story.json 을 다시 지으면 다음 빌드가 그것을 그린다. e2e 도 story.json 을 읽어 댄다 (글을 시험에 옮겨 적지 않음 — 제목 · 흐름 덩이마다 차례 · 뒤집기의 두 말 · 한 줄 · 누구의 말). 그림 스크립트도 글자로 고르지 않는다.
- story.json 이 계약을 어기면 **빌드가 멈춘다** (틀린 글을 보이느니 멈춤 — short-b 와 같은 방식에 문서 대조를 더함 · UX8c-d).
- 레이아웃 `lab/flow/layout.tsx` = `export { default } from "../short/layout"` (같은 CSS · 색 스위치 — 복제 0).
- **페이지에 모델 이름 · "파이프라인" · 비용 말 0** — 보이는 글 · HTML (RSC 데이터 포함) · 그 페이지의 JS 조각 여덟을 다 훑었다 (아래 ④). 화면 글은 `lab/short/data.ts` 의 `LIGHT_CHROME` 그대로 ("시안" · "짧은 이야기" · "견줘 읽기 (시안에서만)" …).

## ③ short-b 그림이 그대로인가 — 앞 · 뒤 대조

**lab 꼴 객체** — 바꾸기 전 (`b161300` 의 short-b/data.ts) · 뒤 (`toLight` 를 부르는 data.ts) 의 `{ LIGHT, COMPARE }` 를 tsx 로 JSON 덤프:
```
shortb-before.json 1fd037ae0a2352df96bf5718805153fbe0a84dc123e0ef0ea5fd90ee1e402968
shortb-after.json  1fd037ae0a2352df96bf5718805153fbe0a84dc123e0ef0ea5fd90ee1e402968   (cmp — BYTE-IDENTICAL · 칸의 차례까지)
```
**그림 픽셀** — 앞 빌드 (`CLARO_DIST=.next-ux8c-before` · HEAD 그대로) · 뒤 빌드 (`.next-ux8c-after`)를 따로 띄워 (3221 · 3222) `short-b/shots.ts` 로 같은 열 장을 찍어 댐 (PIL RGBA · `ImageChops.difference`). 같은 서버를 두 번 찍어 흔들리지 않음을 먼저:
```
같은 서버 두 번 (흔들림):  10 장 · 같음 10 · 다름 0
앞 (HEAD b161300) ↔ 뒤 (UX-8c):  10 장 · 같음 10 · 다름 0
찍은 것: 1-cover · 2-story-first-thought · 3-story-cite-name · 4-story-flip · 5-story-pick-before · 6-story-pick-after · 7-story-land-oneline · 8-story-words-whose · 9-compare · 10-source-sheet
```
**두 빌드의 보이는 글** (HTML 에서 script · style · 태그를 걷은 글):
```
/                        앞 200 · 뒤 200 · 보이는 글 1154자 · 같음 True
/short/license-notice    앞 200 · 뒤 200 · 보이는 글 273자 · 같음 True
/s/rate/2                앞 200 · 뒤 200 · 보이는 글 307자 · 같음 True
/lab/short               앞 200 · 뒤 200 · 보이는 글 241자 · 같음 True
/lab/short-a             앞 200 · 뒤 200 · 보이는 글 269자 · 같음 True
/lab/short-b             앞 200 · 뒤 200 · 보이는 글 241자 · 같음 True
/lab/today               앞 200 · 뒤 200 · 보이는 글 1402자 · 같음 True
/map                     앞 200 · 뒤 200 · 보이는 글 349자 · 같음 True
/lab/flow/license-notice 앞 404 · 뒤 200 (새)
```
서버 둘은 찍은 뒤 껐다 (`lsof -ti tcp:3221,3222` 빔 · 끝 코드 143) · 빌드 폴더 둘 지움 · 대조 그림은 scratchpad (git 밖).

## ④ 검사 (붙인 그대로 · 2026-11-15)

`pnpm install` (시작 전 — Already up to date).

**새 한 편이 계약을 지나나** (tsx — data.ts 를 불러서 · 따로 `validateFlowStory` 에 문서를 줘서):
```
validate ok: true {"quotes":10,"docs":1,"texts":20,"texts_with_digits":2,"exempt":[],"blocks":10,"beats":["first_thought","breaker","name","flip","land"],"picks":0,"words":1} warnings: 0
title: 면허 정지가 취소된 건 / 운전자가 억울해서였을까 | ask: 그럼 왜 취소됐냐고요? | category: 나라와 법
flow: p:first_thought → p:breaker → cite → p → p:name → p → flip:flip → p → p → p:land
compare: [{"href":"/short/license-notice","kind":"같은 원문 · 앞서 낸 글","title":"면허 정지가 취소됐다는데, 잘못이 없었다는 걸까"}]
has _source: false
```

**페이지에 모델 · 만든 길 · 비용 말** (뒤 빌드 3222):
```
/lab/flow/license-notice 200 · HTML 32740 자 · 보이는 글 216 자
  HTML (RSC 포함) 에 모델 · 만든 길 말: 없음 · 보이는 글에 비용 말: 없음
  <title>: Claro 시안 — 짧은 이야기 · 면허 정지가 취소된 건 운전자가 억울해서였을까
그 페이지가 부르는 JS 조각 8 — 파이프라인 · sonnet · fable · claude- : 0 건
```

**`pnpm -s typecheck`**
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
```

**`pnpm -s test` 의 web 부분** (`pnpm --filter @claro/web test` — 제 빌드 `.next-test`)
```
  ✓   3 e2e/lab-flow.spec.ts:17:1 › 새 꼴 짧은 이야기 — story.json 그대로: 제목 → 한 흐름 · 뒤집기 하나 · 남는 한 줄 · 견줘 읽기 (옛 꼴) · 콘솔 오류 0 (1.5s)
  …
  75 passed (3.1m)
exit 0
```
(74 → 75: 새 1. **처음 돌렸을 때 새 시험만 떨어졌다** — 콘솔 오류 `Failed to load resource: … 404` 하나. 찾아보니 사이트에 favicon 이 없어 브라우저가 부르는 `/favicon.ico` 의 404 (`curl` 404 · 페이지가 부르는 요청이 아니라 Playwright 의 response 에는 안 잡힘 · 콘솔 메시지의 `location().url` 이 `/favicon.ico`). 그 하나만 빼게 고친 뒤 새 시험 따로 1 passed → 다시 전부 75 passed · UX8c-a.)
e2e 가 `logs/frontend/F-2b/` 그림 여섯 (png 5 · webm 1)을 다시 찍었다 → 하나씩 `git checkout -- <파일>` 로 되돌림 — 커밋에 없다.

**`lab/short-b/check.ts`** (되돌리기를 옮긴 뒤 — 숫자 · 글자 수가 B-E4 때와 같다)
```
■ 짧은 이야기 다시 쓰기 (B) — 어른 셋 중 하나가 비만이라는데, 그 한 명은 누구일까 (obesity-who · lab 전용 꼴)
  구절 12 (문서 1 — git 의 store.documents.json) · 글 덩이 24 (한 번 읽을 때 22) — 숫자가 든 글 18
  빈칸 뺀 글자 913 (읽는 길 — 표지 · 흐름 한쪽 가지 · 한 줄 · 누구의 말) + 접힌 낱말 카드 152 · 문단 6 · 고르기 1 · 물음 단추 1 (표지) · 낱말 비만율 · 퍼센트포인트 (%p)
  뼈: first_thought → breaker → name → flip → try → land → 남는 한 줄 · 그리지 않을 것 6

OK — 구절 대조 · 숫자 · 그리지 않을 것 · 술술 읽히는 꼴 · 뼈의 차례 · 크기
```

**그림** `logs/frontend/UX-8c/` — 390×844 · 2배 (`lab/flow/license-notice/shots.ts` · 뒤 빌드 3222 · 페이지 오류 0): `1-cover` · `2-story-1` ~ `2-story-5` (화면 높이의 4/5 씩 끝까지 — 첫 생각 · 깨는 사실 · 문서의 문장 · 이름 붙이기 · 나머지 두 사건 · 뒤집기 · 진술서 · 내려앉기 · 한 줄) · `3-words-whose` (낱말 카드 펼침 · 누구의 말) · `4-compare` (견줘 읽기) · `5-source-sheet` (깨는 사실의 근거 — 발표문 #1 구절).

## ⑤ 배포 확인

(push 뒤 — 다음 커밋 "UX-8c 배포 확인"에서 적는다)

## ⑥ _open

| # | 무엇 | 지금 | 다른 길 |
|---|---|---|---|
| UX8c-a | **사이트에 favicon 이 없다** — 브라우저가 스스로 부르는 `/favicon.ico` 가 404 → 크롬 콘솔에 오류 한 줄 (실제 주소 `/` 도 같다 · 이 Step 전부터). e2e · 그림 스크립트는 그 하나만 (`location().url` 이 `/favicon.ico`) 빼고 나머지 콘솔 오류를 다 잡는다 — 뺀 것 말고는 0 | 뺐다 (e2e 주석) | favicon (`app/icon.*`)을 더하면 실제 주소 전체가 바뀐다 → 이 Step 밖 · 프론트 손질 때 |
| UX8c-b | **표지 그림이 비만 견본의 막대 그림이다** — `Light.tsx` 가 `CoverArt` (`lab/short/Art.tsx` — 막대 둘 · 자 · ≠)를 고정으로 그린다. 글자 · 숫자는 없지만 면허 이야기와 상관없는 그림 | 그대로 (`Light.tsx` 0줄) | `Light.tsx` 에 그림 칸 하나 (D99 ④ 갈아 끼우기에서 kit 로 옮길 때 — `catalog.tsx` 의 `Art` 처럼) |
| UX8c-c | 견줘 읽기 안내 "같은 무게의 다른 두 편이에요" — 한 편만 가리켜도 "두 편" (short-b 와 같음 · UX-8b-B ⑥) | 그대로 | `lab/short/data.ts` `LIGHT_CHROME` (→ `/lab/short` 의 보이는 글도 바뀐다) |
| UX8c-d | **story.json 이 계약을 어기면 빌드가 멈춘다** — 사이트 전체 배포가 멈춘다 (틀린 글을 보이느니 멈춤 · short-b 와 같은 방식 + 문서 대조) | 그렇게 둠 | PM 이 story.json 을 다시 지은 뒤 push 전에 `pnpm --filter @claro/web build` 한 번 (또는 파이프라인의 `--check`) |
| UX8c-e | **Fable 대조군 (P-S2f · `license-notice-flow-fable/`)도 같은 화면으로 볼지** — 지금은 한 편만. 둘째는 data.ts 하나 더 (story.json 경로만 다르고 `toLight` 그대로) · 도윤이 눈 가리고 견준다면 주소 · 제목에 모델이 드러나지 않게 (예: `/lab/flow/license-notice-2`) | 안 만듦 (범위 밖) | PM 판단 |
| UX8c-f | 고르기 든 새 꼴 실물이 아직 없다 (PS2-a) — 이 화면은 고르기가 있으면 첫째를 골라 이어가도록 e2e · 그림 스크립트를 짰지만 실물로 돌려 본 적은 없다 (short-b 가 고르기 길을 본다) | — | 고르기 든 한 편이 나오면 |

B-E4-c (short-b `check.ts` 머리 주석 "계약 검증을 쓸 수 없다")는 그대로 — check.ts 0줄.
