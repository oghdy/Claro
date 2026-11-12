# logs/backend · B-E2 — 문서 단위 권리를 계약으로 (D70)

## B-E2 · 2026-11-12 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 모델 API 호출 0 · 비용 0 · 배포 안 함. `docs/PM.md` 안 읽음.
네트워크는 `p2 PIPC-… --check` 의 정해진 다시 받기 12 뿐 (E3-1b 와 같다). 사용 한도로 한 번 끊겼다가 같은 작업 트리에서 이어 했다 (미커밋 그대로였다).
고친 곳: `docs/contract/DATA_MODEL.md` · `packages/contract/src/data-model.ts` · `packages/contract/test/rights.test.ts` (새) · `packages/pipeline/src/rights.ts` · `pack.ts` ·
`packages/pipeline/test/e3-pipc.test.ts` · PIPC `store.json` (다시 냄) · `scripts/verify-data-model.py` · `verify-source-pack.py` · 두 selftest · 이 로그 · `docs/development-backend.md` B-E2 줄.
**안 건드린 것**: EPISODE.md · episode.ts · validate-episode.ts · fixtures (골든 · invalid) · apps/web · `packages/contract/src/index.ts` (data-model.ts 가 이미 `export *` 라 필요 없었다) ·
P-E1 파일 (llm.ts · episode*.ts · pipeline package.json · verify-ledger.py · FOMC episode 폴더 · data/series · fomc-auto) · pack.json (사람이 쓴 입력) · 다른 사건 폴더 0자.

**한 줄 답**: 문서 단위 권리는 **따로 된 타입 `DocumentRights` (+ 근거 `DocumentRightsBasis`)** — Source 하나에 많아야 한 행 · 그 문서에 한해 발행처 행보다 칸마다 앞선다.
실물 셋 (pipc PDF) 이 PIPC `store.json` 의 `document_rights` 행이 됐고, 발행처 행 (pipc.go.kr) 의 can_* 은 null 그대로다. FOMC · KFTC 산출물 0자.

---

## ① 어디에 뒀나 · 까닭

| 자리 | 실물 (pipc PDF 셋) 에 | 판단 |
|---|---|---|
| Source 의 칸 | 맞지만 무겁다 — 65 개 Source 중 3 만 쓴다 | 권리가 서지와 섞인다. 모든 Source 행 (골든 · FOMC · KFTC) 에 칸이 늘어 산출물이 다 바뀐다 |
| SourceRegistry 의 문서 행 | 어긋난다 | 열쇠가 발행처 · 문서 둘이 된다 (`source` = `Source.publisher` 가 깨짐). 모든 행에 칸이 는다. `basis` 가 글이라 해시를 기계가 댈 수 없다 (E3-1b 는 글 속 해시를 부분 문자열로 댔다) |
| **따로 된 타입** | **맞다** | 있는 타입 · 행 그대로 (0자). 권리 칸 다섯이 SourceRegistry 와 같은 이름 · 같은 뜻 → 읽는 쪽이 칸마다 고른다. 근거를 칸으로 둬 받은 바이트 해시를 기계가 댄다 |

```ts
DocumentRights { source_id: UUID, rights: "KOGL_TYPE1", can_store · can_quote · can_transform · commercial_use · attribution_required: boolean | null,
                 basis: DocumentRightsBasis, last_reviewed_at: TimePoint }
DocumentRightsBasis { bytes_sha256, page, pages, image, image_sha256, seen }
```

- **basis 의 다섯 (지시) ↔ 칸**: 파일 = `source_id` 의 그 문서 · 받은 바이트 sha256 = `bytes_sha256` · 쪽 = `page` / `pages` · 그림 = `image` ("Im5 객체 47 · 167×64 · DCTDecode") · 그림 sha256 = `image_sha256` · + 무엇을 봤나 = `seen` (D70 "무엇을 봤나")
- **`image` 를 글 하나로** — E3-1b-c (그림 칸이 PDF 모양) 를 계약에 굳히지 않으려고. 다시 확인할 값은 해시 쪽이다. 쪽 안의 자리 · 본 방법 · 제3자 글은 계약 칸이 아니다 — `pack.json` 의 `doc_rights` 에 그대로
- **`can_ingest` 칸은 없다** — 표시는 문서를 받아 연 뒤에야 보인다. 받아도 되나는 발행처 행이 말한다 (그래서 앞선다는 칸 다섯에만)
- **앞선다 = 칸마다**: 문서 행의 값 (참 · 거짓) 이 있으면 그것, null 이면 발행처 행의 값. 문서 행이 없으면 발행처 행 그대로. 불변식 35 에 어긋난 행 · 한 문서에 두 행은 아무것도 허락하지 않는다
- **저장소 파일의 `document_rights` 목록은 행이 있을 때만** — 없으면 빈 목록과 같다. 그래서 골든 (`fixtures/store.json`) · FOMC · KFTC `store.json` 이 바뀌지 않는다 (검사는 `OPTIONAL_STORE_TYPES` 로 읽는다)
- 발행처 행의 `basis` 는 발행처 단위 근거 + 문서 이름만 가리킨다 — 해시는 문서 행 한 곳 (전에는 발행처 근거 글에 해시까지 1,375자 → 746자)
- 다른 표시 (공공누리 2 ~ 4 유형 등) 는 행을 만들지 않는다 — `rights` 는 KOGL_TYPE1 하나 (D53)

## ② 불변식 · 시험

**DATA_MODEL §14 (이어서 35 ~ 37) · 고친 문구**
- 20 — "(발행) 그 Source 가 `can_quote` — 발행처 행 또는 그 문서의 문서 단위 행 (불변식 36)". §10.1 규칙 · §4.4 "원문은 `can_store` 가 참인 것만 공개 저장소에 (P-1) — 발행처 행 또는 문서 단위 행" · SourceDocument 근거 문구도 같이
- **35** 행 — 있는 Source · Source 하나에 한 행 · `basis` 필수 (두 해시 = sha256 · 1 ≤ page ≤ pages · image · seen) · TimePoint · KOGL_TYPE1 이면 칸 다섯이 참 · 어긋난 행은 아무것도 허락하지 않는다
- **36** 문서의 권리 = 문서 행 (칸마다 · null 이면 발행처 행) · 없으면 발행처 행 — **그 문서에 한해**. 원문 저장 · 인용 블록이 이것으로 읽는다
- **37** `basis.bytes_sha256` = 파이프라인 기록의 받은 바이트 해시 · `pages` = 뽑은 글의 쪽 수 · 행은 목록의 `doc_rights` 에서 나온다. 그림 해시는 기계가 매번 대지 않는다 (_open B-E2-a)
- §4.4 새 단락 (실물 · 규칙 · 자리 표 · 앞선다 · 근거 · 제3자 글 · HWPX) · §0 · §1 타입 · §15 네 줄 · §21 _open · CHANGELOG 한 줄

**검사 — 계약 쪽 한 곳**
- `verify-data-model.py` — `document_rights_problems` · `document_rights_table_problems` · `valid_document_rights` · `effective_rights` (새 · `DOC_RIGHTS`) · `SOURCE_DOC_NOT_STORABLE` · `QUOTE_NOT_ALLOWED` 가 `effective_rights` 로 · `KOGL_TYPE1` 을 읽게 닫힌 값 정규식에 숫자 (`[A-Z][A-Z0-9_]*`)
- `verify-source-pack.py` — **겹치던 것을 하나로**: 행의 칸 · 해시 모양 · 쪽 범위 · 제1유형 칸은 `VD.document_rights_table_problems` 에 맡긴다 (전의 `DOC_RIGHTS` · `HEX64` 지움). 원문 저장은 `VD.effective_rights`.
  `PACK_DOC_RIGHTS` 에 남은 것은 파이프라인 쪽뿐 — 행 = 목록의 `doc_rights` 를 옮긴 것 (칸마다) · 목록에 없이 행이 없다 · 받은 바이트 = 기록 · 쪽 수 = 뽑은 글 (37) · where · third_party · seen_by · 발행처가 이미 git 이면 필요 없다 · 기록의 권리 = doc_rights.
  지운 것: "발행처 행 근거 글이 문서 · 그림 해시를 말한다" (해시가 문서 행으로 옮겨 갔다)
- `packages/contract` — `SourceRegistry` · `DocumentRights` · `DocumentRightsBasis` 타입 (`DATA_MODEL_TYPES` — contract-docs 시험이 문서와 글자로 댄다) · `documentRightsProblems` · `documentRightsTableProblems` · `sourceRights` · `isTimePoint` · `DOCUMENT_RIGHTS_GRANTS`
- 파이프라인 — `rights.ts` `documentRightsRow(source_id, doc_rights)` (계약 타입을 `import type` 으로 — 노드 타입 지우기에서 지워진다 · `RegistryRow = SourceRegistry & { basis: string }`) · `pack.ts` 가 `document_rights` 를 행이 있을 때만 쓴다

**시험**
- `packages/contract/test/rights.test.ts` (18) — 문서 행이 있는 문서만 통과 (칸 다섯 참 · `by: DOCUMENT`) · **같은 발행처의 다른 문서는 null 그대로** · 다른 발행처 · 행 없음 그대로 · 문서 행의 참이 발행처 행의 거짓을 이긴다 · **basis 없으면 거부 → 그 문서도 발행처 행으로** · basis 칸 여섯 가지 · 칸 빠짐 · 제1유형인데 변경 불가 / null · 제2유형 · 날 · 계약 밖 칸 · 두 행 · 없는 Source · **실물 PIPC store.json — 셋만 DOCUMENT, 게시물 · 일정 셋은 PUBLISHER null**
- `selftest-verify-data-model` 151 → **163** — publish: 발행처 null + SYN 문서 행 → 통과 · 발행처 거짓 + 문서 행 → 통과 · 다른 문서 (SIBLING) 에만 → QUOTE_NOT_ALLOWED · basis 없음 → QUOTE_NOT_ALLOWED / docs: CME-2 원문 + 그 문서 행 → UNRECORDED 만 · CME-1 에만 → NOT_STORABLE · basis 없음 → DOC_RIGHTS + NOT_STORABLE · 칸 거짓 · 그림 해시 · 없는 Source · 두 행 → DOC_RIGHTS / contract: basis 칸 뺌 → CONTRACT_FIELD · 제2유형 → CONTRACT_ENUM / bundle: 칸 빠진 행 → STORE_SHAPE
- `selftest-verify-source-pack` 32 → **39** (기대 code 를 튜플로 — 전부 나와야 한다) — 행 지움 → NOT_STORABLE + DOC_RIGHTS · basis 지움 · 다른 문서로 옮김 · 제1유형인데 변경 불가 · 두 행 → DOC_RIGHTS + NOT_STORABLE · 받은 바이트 · 쪽 수 → DOC_RIGHTS · FOMC 연은 연설에 손으로 쓴 행 → DOC_RIGHTS.
  고친 둘: "문서 단위 권리를 지움" → 이제 목록만 지운 것 (행은 그대로) 이라 DOC_RIGHTS · "근거 글에 문서가 빠짐" → "store.json 행을 지움" 으로 바꿈
- `packages/pipeline/test/e3-pipc.test.ts` 8 → 11 — `documentRightsRow` 옮김 · store.json `document_rights` = PDF 셋의 `documentRightsRow` 그대로 · 받은 바이트 = 기록 · 게시물 · 일정에 행 없음 · **FOMC · KFTC store.json 에 `document_rights` 칸이 없다** · 발행처 근거 글에 해시가 없다

## ③ 산출물 변화

**PIPC `store.json` (다시 냄 — `p2 PIPC-20261028-SAFETY-MEASURES`)** — md5 `c303cdc8…` → `a1b08b84…` · 58 줄 더함 · 2 줄 바꿈. 한 번 더 돌림 → 같은 md5 (멱등)
- 더함: `document_rights` 3 행 (source_registry 다음) — PR-1029-PDF (`ce98046e…` · 4/5 · Im5 객체 47 · `30fd9bd9…`) · SL-SKT-0828 (`4cb4dc66…` · 8/13 · Im10 객체 80 · `da6de292…`) · SL-STATS-0515 (`5889fc59…` · 3/5 · Im4 객체 38 · `b895c79a…`). 칸 다섯 참 · `last_reviewed_at` 2026-11-12. 값은 pack.json `doc_rights` 그대로
- 바꿈: `_what` 끝에 한 문장 (document_rights 가 있을 때만) · pipc.go.kr 행 `basis` — 해시 · 쪽 · 그림을 빼고 "그 문서에 한해 문서 단위 행이 앞선다 (store.json document_rights …): PR-1029-PDF · SL-SKT-0828 · SL-STATS-0515". 그 행의 can_* null · `last_reviewed_at` 2026-11-12 그대로
- `store.documents.json` · `fetch.json` md5 같음 (`38c8ae62…` · `7aed0d5e…`) — 원문 · 글 해시 · source_id · 받은 때 0자

**`--check`** (캐시 바이트 다시 뽑기 + 새로 받기 12):
```
  PR-1029-PDF  캐시 바이트 다시 뽑기  같음  08bcdcc2ae44d94c (기록 08bcdcc2ae44d94c)
  PR-1029-PDF  새로 받기             글 같음 · 바이트 같음 · 표시를 본 바이트와 같음
  SL-SKT-0828  캐시 바이트 다시 뽑기  같음  9c0fc5cc6c11a146 (기록 9c0fc5cc6c11a146)
  SL-SKT-0828  새로 받기             글 같음 · 바이트 같음 · 표시를 본 바이트와 같음
  SL-STATS-0515 캐시 바이트 다시 뽑기  같음  00e5b920ea4b53a7 (기록 00e5b920ea4b53a7)
  SL-STATS-0515 새로 받기             글 같음 · 바이트 같음 · 표시를 본 바이트와 같음
  LAW-* 여섯     캐시 바이트 다시 뽑기  같음 · 새로 받기  글 같음 · 바이트 같음
  PR-1029 · M21-AGENDA · SL-FINE-1204  캐시 바이트 다시 뽑기  같음 · 새로 받기  글 다름 · 바이트 다름 (살아 있는 페이지 — 예외 · 조회수 · 사이트 메뉴)
```
`--check` 뒤 세 파일 md5 그대로 (아무것도 쓰지 않음).

**FOMC · KFTC — 그대로** (B-E2 코드로 `p2` 를 다시 돌려 봄 · 네트워크 0 — 전부 기록 · 캐시 재사용)
- FOMC-20261028 `store.json` · `store.documents.json` · `fetch.json` md5 같음 (`8cc28530…` · `d72ec0db…` · `13a7d26a…`). 골든 `fixtures/store.json` · `store.documents.json` 같음
- KFTC-20261029-DELIVERY-APPS — `store.documents.json` · `fetch.json` 같음. **`store.json` 은 한 줄 달라졌다 — B-E2 때문이 아니다**: law.go.kr 행 `basis` 가 "법률 · 대통령령 본문" → "… 본문과 별표 · 행정규칙(고시) 본문" (E3-1 `739a20a` 가 `rights.ts` KR_STATUTE 글을 넓히고 KFTC 를 다시 내지 않았다). `document_rights` 칸 · `_what` 은 그대로.
  다른 사건의 권리 글이라 **되돌려 두었다** (커밋 안 함 · 사본에서 복원) → _open B-E2-c

## ④ 검사 결과

`pnpm --filter @claro/contract test`:
```
 Test Files  5 passed (5)
      Tests  115 passed (115)
```
(중간에 한 번 EPISODE.md ↔ episode.ts 시험 5 개가 깨졌었다 — UX-5 가 `PagesFrame` 을 코드에 먼저 넣은 중간 상태. 고치지 않았다. 마지막 실행에서는 통과)

`pnpm -s typecheck`:
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
```
`pnpm -s test` (rc 0):
```
packages/contract test:       Tests  115 passed (115)
packages/pipeline test:       Tests  106 passed (106)
packages/db test:       Tests  101 passed (101)
apps/web test:   56 passed (3.1m)
```
apps/web 시험이 `logs/frontend/F-2b/motion-375x667.webm` 을 다시 찍었다 → 그 파일만 `git checkout --`. `logs/frontend/UX-5/` 는 UX-5 것 (안 건드림).

파이썬 검사 전부 (`scripts/verify-*.py` · `selftest-*.py` 24) — 모두 rc 0:
```
verify-article OK · verify-bls-rates OK · verify-claims OK · verify-concept-identity OK · verify-contract-coverage OK · verify-coverage OK · verify-data-model OK ·
verify-entailment 통과 · verify-fact-graph OK · verify-ledger OK (ERROR 0 · WARN 0) · verify-observation OK · verify-observed PASS · verify-source-pack OK ·
selftest: article OK · bls-rates 34/34 · claims 29/29 · concept-identity OK · coverage 25/25 · data-model 사본 163개 · OK · entailment 18 전부 · fact-graph 43 OK ·
ledger 10 OK · observation 106 + 2 OK · source-pack 사본 39 · OK
```
`python3 scripts/verify-source-pack.py`:
```
verify-source-pack
  FOMC-20261028: 목록 43 — 저장 38 (cache 5, fixtures/store.documents.json 10, store.documents.json 23) · 못 가져옴 5 · Source 38 · Event 1
  KFTC-20261029-DELIVERY-APPS: 목록 15 — 저장 15 (cache 3, store.documents.json 12) · 못 가져옴 0 · Source 15 · Event 1
  PIPC-20261028-SAFETY-MEASURES: 목록 12 — 저장 12 (cache 3, store.documents.json 9) · 못 가져옴 0 · Source 12 · Event 1

OK
```

## ⑤ _open

| # | 무엇 | 지금 | 판정할 것 |
|---|---|---|---|
| **B-E2-a** | 그림 해시 (`image_sha256`) 를 기계가 다시 대지 않는다 | 받은 바이트 해시만 기계가 댄다 (불변식 37). PDF 안 그림을 꺼낼 도구가 저장소 의존에 없다 | (a) 그대로 — 바이트가 같으면 그 안의 그림도 같다 (b) 검사가 캐시 바이트에서 그림을 꺼내 댄다 (의존 하나). **추천 (a)** → DATA_MODEL §21 |
| **B-E2-b** | 문서 단위 권리가 두 곳 — 사람의 입력 (`pack.json` `doc_rights`) 과 계약 행 (`store.json` `document_rights`) | 검사가 칸마다 댄다 (PACK_DOC_RIGHTS). 입력에만 자리 · 본 방법 · 제3자 글 | (a) 그대로 — `published_at` 처럼 목록 → 산출물 (b) 입력을 계약 모양으로 — 계약 밖 칸이 갈 곳이 없다. **추천 (a)** → DATA_MODEL §21 |
| **B-E2-c** | KFTC `store.json` 이 `rights.ts` 와 한 줄 어긋나 있다 (law.go.kr basis — E3-1 이 글을 넓힌 뒤 다시 내지 않음) | 되돌려 두었다 (다른 사건 폴더를 바꾸지 말라는 지시) · `verify-source-pack` 은 글 내용을 대지 않아 통과 | KFTC 를 다시 낼 때 (E2 의 P-3 전 등) 한 줄이 따라 바뀐다 — 뜻은 같다 (법령 본문 → 본문 · 별표 · 고시). PM 이 그때 받으면 된다 |
| B-E2-d (알림) | EPISODE.md §4.2 "캐시에만 있는 문서의 구절은 실을 수 없다" — PIPC PDF 셋은 이제 git · 문서 단위 행이 있다 | EPISODE.md 는 UX-5 몫이라 안 건드림 | UX-5 · 세 번째 회차가 PDF 셋의 구절을 실을 때 근거는 DATA_MODEL `DocumentRights` (회차 구절은 인용 블록이 아니라 불변식 20 밖 — 권리는 원문 저장 쪽) |

이 밖에 계약에서 "미확인"으로 둔 것 (DATA_MODEL §15): 다른 표시 · HWPX / HTML 안 표시 (E3-1b-c) · 문서 행 + hold_text 의 인용 · 같은 주소에서 다시 받은 바이트가 다를 때.
남겨 둔 잔일 (지시 밖): §4.4 첫 줄 "SourceRegistry … 실물 없음 — 채운 행이 하나도 없다" 는 P-1 부터 낡았다 (권리 행 실물이 있다). 검사 `NO_REAL_SECTIONS` 가 §4.4 의 "실물 없음" 을 요구해 함께 손봐야 한다.
