# logs/backend · Phase 0 / Step 0.4a — 스키마: 독자 기록 원장 + 기사 한 판

## B-0.4a · 2026-10-12 · **[GATE]**

커밋: `0d54f88` (0 잔일) · `d1b07a6` (1 · 2 스키마 · 계약 타입) · `ee02e84` (3 테스트) · 이 커밋 (4 문서 · 로그).
독자 글 0자 변경 (`compare-reader-text` 등록 안 된 차이 0 · 화면 문자 대조 4벌 일치). `apps/web` 은 건드리지 않았다. 외부 DB 에 연결하지 않았다. 비밀 값 없음.

---

### _open — 게이트에서 정할 것

| # | 물음 | 지금 해 둔 것 | 왜 물음인가 |
|---|---|---|---|
| **1** | **읽기 사건은 `seq` 순서대로만 들어간다 — 그대로 둘 것인가** | 데이터베이스가 "이 열람의 다음 seq"가 아닌 줄을 거부한다 (`EVENT_SEQ` · 불변식 8 "0부터 1씩") | 화면이 seq 를 붙여 보내고 **한 줄이 길에서 사라지면, 그 열람의 뒤따르는 사건이 전부 거부된다** — 기록하지 않은 관찰은 복구할 수 없다 (§9.4). 서버가 받는 순서대로 seq 를 붙이면 이 일이 안 생기지만, 그러면 순서를 정하는 것이 도착 순서가 된다. "seq 는 누가 만드나"(아래 0.4b 물음)와 한 물음이다 |
| **2** | **데이터베이스가 사건의 뜻까지 거부한다 — 그대로 둘 것인가** | 불변식 9 · 10 · 11 · 22 (지금 plan · 지금 장 · 전환 다음 · CLOSED 뒤)를 넣을 때 트리거가 본다. 지시("데이터베이스가 지킬 수 있는 것은 데이터베이스가")대로다 | 화면에 버그가 있어 계약과 다른 순서로 사건을 내면 **그 독자의 그 줄은 남지 않는다.** 계약을 지키는 원장 ↔ 틀렸어도 남는 관찰. 대안은 "받고, 어긋난 줄을 따로 센다"인데 그러려면 원장에 계약 밖의 줄이 들어간다. F-3 은 20 ~ 30명이라 한 사람의 줄이 크다 |
| **3** | **`identity.reader` 를 원장과 같은 데이터베이스에 두어도 되나** | 다른 schema (`identity`) · 원장에서 가는 FK 없음 · RLS · Data API 에 안 내놓는다 | OBSERVATION §3 은 "대응표는 원장에도 저장소에도 두지 않는다", D1 은 "원장 밖의 표 하나에만", 지시는 "원장과 떨어진 곳". schema 가 달라도 **같은 백업 · 같은 덤프에 실린다** — 원장을 누군가에게 통째로 넘길 때 같이 나간다. 칸은 셋뿐이다 (`user_id` · `label` · `created_at`). 더 담을 것은 D31 |
| **4** | **교정 기록 51 ~ 54행 — `CLAIM` 으로 적힌 요점 넷을 `GOAL` 로 고칠 것인가** | 고치지 않았다. 어휘에 `GOAL` 을 더했고(OBSERVATION §8.2), 그 넷은 `where` 로 가른다고 계약에 적었다 | 교정 기록은 덧붙이기만 한다 (§1). 고치면 그 규칙을 처음 어기는 줄이 되고, 안 고치면 요점을 고친 줄을 셀 때마다 예외 넷이 따라다닌다. 42행의 `_draft` 는 "확인하면 지운다"는 약속이 처음부터 있었지만 이 넷에는 없다 |
| **5** | **BLS 발표문 FAQ 구절("약 122,000 이면 통계적으로 유의")을 F40 의 글에 넣었다 — 사실을 따로 만들 것인가** | F40 (8월 고용 · MEASUREMENT)의 글 끝에 한 문장. 구절은 출처 줄로 달았다 | 잰 값이 아니라 잰 쪽의 설명이다. 잔일은 "사실의 글을 넓힌다"였고 사실을 새로 만드는 것은 범위 밖이라 넓혔다. `fact_type` 이 한 사실 안에서 섞인다 |
| **6** | **시각의 글자** | `timestamptz` 로 담는다. 같은 순간이 나온다 — 글자는 다를 수 있다 (소수 초 끝자리 0 이 떨어진다 · UTC 가 아닌 오프셋은 `Z` 로 바뀐다) | 계약은 `Timestamp = string` ("UTC, 초 단위 이상"). 넣은 글자 그대로가 필요하면 `text` 여야 하는데, 그러면 "보여주기 전에 답함"(불변식 13)을 데이터베이스가 글자로 견주게 된다 |

판정 없이도 0.4b 는 시작할 수 있다. 1 · 2 는 0.4b 가 API 를 쓰기 전에, 3 은 Supabase 에 올리기 전에 정해져야 한다.

---

### 계약 타입 ↔ 테이블

**칸 이름을 하나도 바꾸지 않았다.** 더한 칸 0 · 뺀 칸 0. 대응표는 타입 → 테이블 이름과, 계약의 타입 식 → Postgres 타입뿐이다.

| 계약 타입 | 테이블 | 칸 | 키 |
|---|---|---|---|
| ArticleRecord (DATA_MODEL §11) | `public.article_record` | 4 | (`article_id` · `article_version`) |
| ReadingPlanLog | `public.reading_plan_log` | 15 | `plan_id` |
| ReadingEvent | `public.reading_event` | 10 | `event_id` |
| KnowledgeEvidence | `public.knowledge_evidence` | 14 | `event_id` |
| Probe | `public.probe` | 9 | (`probe_id` · `version`) |
| ProbeExposure | `public.probe_exposure` | 10 | `exposure_id` |
| ProbeResponse | `public.probe_response` | 6 | `interaction_id` |
| — (계약 밖 · D31) | `identity.reader` | 3 | `user_id` |

| 테이블이 없는 계약 타입 | 어디에 |
|---|---|
| BlockDecision · ProbePlanItem · SlideLoc · ProbeTarget · ExposureContext | 그것을 품는 칸에 `jsonb` 로. 모양(칸 이름 · 타입 · 계약에 없는 칸)은 넣을 때 트리거가 본다 |
| ArticleRef | 타입만. 칸으로는 `article_id` · `article_version` 두 칸이고 FK 다 |
| CorrectionEntry · CorrectionTarget · Replacement | 타입만 (`packages/contract`). 테이블 없음 — 원본은 `logs/correction-log.jsonl` (지시) |
| ArticlePackage · ArticleAuthoring | `article_record.package` · `.authoring` 에 통째로 (`json`) |

| 계약의 타입 식 | Postgres | |
|---|---|---|
| `UUID` · `GoalRef` | `uuid` | 기본값 없음 — 쓰는 쪽이 만든다 |
| `integer` | `integer` | |
| `Timestamp` | `timestamp with time zone` | _open-6 |
| `string` · `LevelId` · `Position` · `ProbeType` · `"A" \| "B"` | `text` (+ CHECK) | 닫힌 값은 Postgres enum 이 아니라 CHECK 다. 목록은 `@claro/contract` 의 상수에서 만든다 — 스키마에 다시 적지 않았다 |
| `boolean` | `boolean` | |
| `X[]` · `SlideLoc` · `ExposureContext` | `jsonb` | |
| `ArticlePackage` · `ArticleAuthoring` | **`json`** | `jsonb` 는 키 순서를 바꾸고 다시 쓴다. `json` 은 넣은 글자 그대로다 — "넣고 꺼내면 글자 그대로"를 데이터베이스 안의 글자로도 확인했다 |
| `Probe.created_on` (`string // 날짜`) | `date` | 이름은 그대로, 타입만 날짜 |

**어긋나면 걸리는 곳 — 세 겹**

| 무엇과 무엇 | 어디서 | 언제 |
|---|---|---|
| 계약 문서의 타입 블록 ↔ `packages/contract` 의 칸 목록 (이름 · 순서 · 타입 식 · null · 닫힌 값) | `packages/contract/test/contract-docs.test.ts` — 문서를 읽어 글자로 댄다 | `pnpm test` |
| 칸 목록 ↔ TS 타입 | `satisfies TypeDesc<T>` (칸이 빠지거나 남거나 null 여부가 다르면 컴파일 실패) | `pnpm typecheck` |
| TS 타입 ↔ 테이블 | `packages/db/src/contract-check.ts` — 테이블에서 읽은 줄의 타입과 계약 타입이 정확히 같아야 한다 | `pnpm typecheck` |
| 칸 목록 ↔ Drizzle 스키마 ↔ **마이그레이션을 적용한 실제 데이터베이스** (이름 · 순서 · Postgres 타입 · null) | `packages/db/test/contract-tables.test.ts` | `pnpm test` |

---

### 불변식마다 — 어디서 지키나

"DB" = 마이그레이션이 만든 제약 · 트리거. 넣는 순간에 거부한다. **"없다"는 지금 아무 데서도 안 지킨다는 뜻이다** (파이썬 `check_ledger` 는 메모리 안의 시험 원장만 본다 — 실제 원장을 읽지 않는다).

| # | 불변식 (OBSERVATION §11) | 어디서 | 못 지키는 부분 |
|---|---|---|---|
| 1 | 계약에 있는 칸만. 고치지도 지우지도 않는다 | **DB** — 테이블에 그 칸뿐이다 (없는 칸은 SQL 이 실패) · `jsonb` 안은 트리거 (`LEDGER_FIELD` · `LEDGER_SHAPE`) · 고치기 · 지우기 · 비우기는 트리거 (`LEDGER_APPEND_ONLY`). **+ `appendLedger`** — Drizzle 의 insert 는 모르는 칸을 조용히 버린다. 쓰는 쪽은 이 함수만 쓴다 | 테이블 주인은 트리거를 끌 수 있다 (`SUPABASE.md` §5) |
| 2 | `user_id` 는 뜻 없는 UUID. 사람을 알아볼 값 · 시험 표시 칸이 없다 | **DB** — 그런 칸이 없다 (테스트가 verify-observation 과 같은 낱말로 본다). 대응표는 다른 schema 이고 원장에서 가는 FK 가 없다 | "뜻 없는"(사람 · 기기에서 계산하지 않았다)은 값만 보고 알 수 없다 → `user_id` 를 만드는 쪽 (D31). 독자가 `response` 에 자기 이름을 쓰는 것도 못 막는다 |
| 3 | (열람 · 레벨)마다 plan 하나. 한 열람의 plan 은 독자 · 세션 · 판이 같다 | **DB** — UNIQUE + 트리거 (`PLAN_DUPLICATE` · `PLAN_READING`) | |
| 4 | `level` 이 그 판의 패키지에 있다 | **DB** — 트리거가 `article_record.package` 를 읽는다 (`PLAN_LEVEL`). 없는 판은 `PLAN_ARTICLE` + FK | |
| 5 | 정적 레벨이면 블록 선택 null · reason 전부 `STATIC_LEVEL` | **DB** — 트리거 (`PLAN_STATIC`) | |
| 6 | `block_decisions` 는 개념마다 정확히 하나, 값이 패키지에서 계산한 것과 같다 | **절반만 DB** — 모양 · `decision` 값 · 같은 개념 두 번 (`PLAN_DECISIONS`) | **값이 패키지와 같은가 · 빠진 개념이 없는가 — 없다.** 0.4b: 서버가 plan 을 패키지에서 계산해 쓰면 검사가 아니라 계산이 된다. 그 함수(§4.2 를 TS 로)는 아직 없다 |
| 7 | 한 열람의 첫 plan 만 `DEFAULT` | **DB** — 트리거 (`PLAN_DEFAULT`). "첫"은 **넣은 순서**다 (`created_at` 이 아니다) | |
| 8 | `seq` 0부터 1씩. plan 이 그 열람 · 독자 · 세션의 것 | **DB** — UNIQUE + 트리거 (`EVENT_SEQ` · `EVENT_PLAN`) | _open-1 |
| 9 | `SLIDE_ENTERED` — 장이 범위 안 · 지금 plan | **DB** — CHECK + 트리거 (`EVENT_SLIDE` · `EVENT_CURRENT_PLAN`) | _open-2 |
| 10 | `LEVEL_SWITCHED` — 지금 plan 에서 같은 열람의 다른 레벨로. 바로 다음은 새 plan 의 `SLIDE_ENTERED` | **DB** — CHECK + 트리거 (`EVENT_SWITCH`) | 전환이 **마지막 줄인 채 끝난 열람**은 못 본다 — 다음 줄이 안 온 것이다 |
| 11 | `CLOSED` 는 마지막. 방향 · 손짓 칸이 없다 | **DB** — 트리거 (`EVENT_CLOSED`) · 칸이 없다 | |
| 22 | `SLIDE_END_SHOWN` — 지금 장 · 한 plan 의 한 장에 한 번 | **DB** — 트리거 + 부분 유일 색인 (`EVENT_END`) | |
| 12 | 노출의 물음 판이 있다. plan 과 독자 · 세션이 같고 계획과 유형 · 위치가 같다 | **DB** — FK + 트리거 (`EXPOSURE_PROBE` · `EXPOSURE_PLAN`) | |
| 13 | 응답은 있는 노출 · 같은 독자 · 보여준 뒤. 노출 하나에 하나 | **DB** — FK · UNIQUE + 트리거 (`RESPONSE_EXPOSURE` · `RESPONSE_TWICE`) | |
| 14 | 놓을 자리를 정하는 칸이 없다 | **DB** — 칸이 없다. `probe_plan` 안에 자리 칸을 넣어도 거부 (`LEDGER_FIELD`) | `shown_at_loc` 을 "나온 뒤에 적었는가"는 값만 보고 알 수 없다 |
| 23 | `goal_ref` 가 있는 Goal 이고 사건이 같다 | **없다** — 요점 · 사건의 테이블이 없다 (지시: 가리키는 값만). 물음의 실물도 0 | 물음을 넣는 쪽이 `fixtures/store.json` 의 goals 와 댄다 — 0.4b 물음 |
| 15 | `PROBE_RESPONSE` — `probe_id` · `position` 이 있고 응답 하나를 가리키며 그 노출과 같다. 응답 없는 노출에서 나온 줄은 없다 | **DB** — CHECK + 트리거 (`EVIDENCE_NO_RESPONSE` · `EVIDENCE_PROBE`) | |
| 16 | 응답마다 target 마다 **정확히** 하나 | **절반만 DB** — target 에만 · 많아야 하나 (`EVIDENCE_TARGETS` · 부분 유일 색인) | **빠짐없이 — 없다.** 줄은 하나씩 들어온다. 0.4b: 응답과 그 증거 줄을 한 거래로 쓴다 |
| 17 | `SELF_REPORT_KNOWN` — `probe_id` null | **DB** — CHECK | |
| 18 | `concept_id` 는 leaf · MERGED 아님 · 있는 버전 | **없다** — 개념 라이브러리의 테이블이 없다 (지시) | 0.4b: 증거 줄을 쓰기 전에 `docs/content/concept-library.json` 과 댄다. F-3 의 물음이 요점만 물으면 증거 줄이 0 이라 닿지 않는다 (§12) |
| 19 | 증거의 독자 · 세션 · 열람 · 판이 plan 과 같다. plan 이 없으면 판 · 자리도 null | **DB** — 트리거 (`EVIDENCE_CONTEXT`) + FK | |
| 20 · 21 | 교정 기록 | `scripts/verify-observation.py` 가 `logs/correction-log.jsonl` 에 돌린다 | 테이블이 없다 |
| DATA_MODEL 26 | ArticleRecord 는 불변 · (`article_id` · `article_version`) 유일 | **DB** — PK + 덧붙이기 트리거. 패키지가 계약을 지키는가는 `appendArticle` (검증기 + `_` 주석 거부) | 저작 데이터가 가리키는 사실 · 스토리라인이 있는가는 발행 검사 (`verify-data-model.py`) |

**근거 — 파이썬 selftest 가 망가뜨린 원장 44개를 그대로 데이터베이스에 넣어 봤다** (`packages/db/test/ledger.test.ts` 의 `DB_VERDICT` 표).
파이썬이 실패로 잡는 41개 가운데 **데이터베이스가 35개를 거부하고 6개를 받는다** — 그 여섯이 위 표의 "없다" · "절반만"이다 (불변식 6 ×2 · 16 ×1 · 18 ×3).
파이썬이 통과시키는 3개는 데이터베이스도 받는다 — 데이터베이스가 계약보다 엄한 곳은 없다. 파이썬에 사본이 늘면 표와 어긋나 테스트가 실패한다.

---

### 0.4b (API) 가 받아야 할 것 — 설계가 아니라 물음

**화면이 아는 것** (F-2b: `Reader.tsx` 의 `notice` 한 곳 — 장이 바뀌었다 · 레벨을 바꿨다 · 이 장의 끝이 나왔다)

| 물음 | 원장이 요구하는 것 |
|---|---|
| `seq` 는 누가 만드나 — 화면인가 서버인가 | 한 열람 안에서 0부터 1씩, **그 순서대로만 들어간다** (_open-1). 화면이 만들면 재전송 · 순서 뒤바뀜 · 빠진 줄을 어떻게 하나 |
| `occurred_at` 은 누구의 시계인가 | 계약은 "기기의 시계는 믿지 않는다. 순서는 seq" (§5.1). 칸은 하나다 — 기기 시각과 서버 시각을 둘 다 담을 자리는 없다 |
| `event_id` · `plan_id` · `reading_id` · `session_id` 는 누가 만드나 | 전부 기본값 없는 UUID 다. 같은 줄을 두 번 보냈을 때(재전송) 같은 `event_id` 면 PK 가 막는다 — 그것을 성공으로 볼지 |
| plan 은 누가 · 언제 만드나 | 사건보다 **먼저** 있어야 한다 (FK). 레벨을 바꾸면 `LEVEL_SWITCHED` 가 새 plan 을 가리키므로 그 plan 이 먼저다. 돌아온 레벨은 **있던 plan 을 다시 쓴다** (같은 열람 · 같은 레벨에 둘은 거부) |
| `block_decisions` 는 누가 채우나 | 패키지에서 계산되는 값이다 (§4.2). 계산하는 TS 함수가 없다 — 파이썬 `derive_decisions` 뿐이다. 비워 두는 것(`[]`)을 데이터베이스는 받는다 (불변식 6 의 못 지키는 부분) |
| 화면이 판의 키(`article_id` · `article_version`)를 어떻게 아나 | 화면은 패키지를 파일 이름으로 읽는다. 패키지 안에는 키가 없다 (ARTICLE_PACKAGE §2) |
| 새로고침으로 되살린 열람 — `reading_id` 와 다음 `seq` 를 화면이 어떻게 이어 가나 | 같은 탭에서 되살리면 같은 열람이다 (D26 닫힘). 화면이 저장하는 것은 레벨 · 장뿐이다 (`reader/place.ts`) |
| `user_id` 는 어디서 오나 — 링크인가 | D31. 대응표(`identity.reader`)에 없는 `user_id` 의 줄을 API 가 받을 것인가, 거부할 것인가. 데이터베이스는 받는다 |
| 세션의 경계 | 미확인 (§6.4). 탭 하나 = 세션 하나인가 |
| `CLOSED` 를 낼 것인가 | 화면이 떠나는 것을 듣지 않는다. 없어도 멈춘 장은 나온다 |
| 거부된 줄을 어떻게 하나 | 데이터베이스는 `CODE: 글` 로 거부한다. 화면에 돌려주나 · 버리나 · 어딘가에 남기나 (_open-2) |

**서버가 채우거나 지켜야 하는 것**

| 물음 | |
|---|---|
| 기사 한 판을 누가 넣나 | `appendArticle` 이 있다. 골든을 넣는 스크립트 · 넣는 때는 없다. 판이 없으면 plan 이 한 줄도 안 들어간다 |
| 물음(Probe)을 누가 넣나 | 물음이 0 개다. `goal_ref` 가 있는 Goal 인지(불변식 23)는 넣는 쪽이 본다 |
| 응답과 증거 줄 | 한 거래로 쓰지 않으면 "target 둘인데 증거 줄 하나"가 생긴다 (불변식 16). 증거 줄을 쓰기 전에 개념이 leaf · MERGED 아님 · 있는 버전인지 (불변식 18) |
| 쓰는 길 | `appendLedger` 만 — Drizzle 의 insert 를 직접 쓰면 계약에 없는 칸이 조용히 사라진다 |
| 완독 · 멈춘 장 | `readingSummary(db, reading_id)` — 계산이다. 칸으로 저장하지 않는다 |
| 접속 | 드라이버 · 풀러 · 어느 역할로 (`packages/db/SUPABASE.md` §5). 이 패키지에는 PGlite 만 있다 |
| 시험 경로는 기록하지 않는다 (§3) | 본 화면만 API 를 부른다는 것을 어디서 보이나 |

---

### 한 일

**0 · 잔일** (`0d54f88`) — "계약 · 저장소 잔일" 표에서 "미룬 _open" · "42행 초안 확인"을 뺀 여섯

| 잔일 | 한 것 |
|---|---|
| F36 · F29b 를 `_not_facts` 로 | 두 글을 사실에서 내렸다 (글자는 브리프 그대로 · 옛 키는 `_fact_id_was`). F29b 의 출처 줄 1개도. Fact 62 → 60. `BRIEF_MISSING` 은 "브리프 사실 전체가 `_not_facts` 에 **글자 그대로, 까닭과 함께** 있으면 통과"로 풀었다 — 조용히 버리면 여전히 실패한다 (사본 4개: 글을 고침 · 기록을 지움 · 까닭 없음 · 나눈 뒷절의 기록을 지움) |
| `check` 이름 표 | §8.4 에 `사실 글 ↔ 1차 구절 대조`. WARN `CHECK_NAME_UNKNOWN` 이 꺼졌다 |
| 반증 답이 사실의 글보다 넓은 곳 넷 | 사실 다섯(F40 · F46 · F47 · F41 · F48)의 글에 답이 쓰는 값을 더하고, 구절을 출처 줄로 달았다 (11줄 — 구절 8 · C-3b 가 표에서 읽어 적은 줄 3. 전부 기록에 글자 그대로 있다 — `PASSAGE_NOT_IN_RECORD` 가 본다). 앞의 글은 `_text_before_0_4a`. **답 · outcome 은 한 글자도 안 바꿨다.** FactSource 80 → 90 (F29b 의 것 −1 · 새로 +11) |
| 숙련 4장 span 에 F01 | refs 가 F11 · F13 · F01. 글자 0자. invalid 사본 둘을 골든과 한 곳만 다르게 다시 만들었다 |
| DATA_MODEL §7.4 표 | Deep A 에 DC-G. 표를 "`e6ff2ca` 의 저장소에 대한 날짜 붙은 기록"으로 적었다 — 저장소가 바뀌어도 표가 안 깨진다 (D33 의 처방 그대로). 요점 문장은 계약에 옮겨 적지 않았다 |
| 교정 기록 target 어휘 · 절차 이름 | `CorrectionTarget.kind` 에 `GOAL` · §8.4 에 `요점 ↔ 해석 대조`. 51 ~ 54행은 안 고쳤다 (_open-4). `verify-data-model` 의 요점 검사는 `GOAL` · `CLAIM` 둘 다 받는다 |

교정 기록 3줄을 덧붙였다 (55 ~ 57행): FACT F36 · F29b (원문 불일치 · `사실 글 ↔ 1차 구절 대조`) · FACT 다섯 (팩트 누락) · ARTICLE 숙련 4장 (팩트 누락). `time_spent_min` 은 null — 재지 않았다.

**1 · `packages/db`** (`d1b07a6`) — `src/schema.ts` (Drizzle) → `migrations/0000_ledger_tables.sql` (drizzle-kit 이 만든 것 그대로) + `migrations/0001_ledger_rules.sql` (손으로: 덧붙이기 트리거 · 불변식 검사 · RLS)

**2 · 계약 타입** (`d1b07a6`) — `packages/contract/src/observation.ts` (OBSERVATION 의 타입 15 전부) · `data-model.ts` (ArticleRecord 와 그것이 품는 모양 · GoalRef 만) · `describe.ts`. 계약 문서가 원본이다 — 테스트가 문서를 읽어 댄다

**3 · 테스트** (`ee02e84`) — PGlite. 외부 DB 없음. `packages/db` 75개 · `packages/contract` +9개

**4 · 문서** — `packages/db/SUPABASE.md` (적용 순서 · 화면에서 직접 못 쓰게 하는 세 겹 · 환경 변수 이름 · 올린 뒤 확인). **실제 Supabase 에서 확인한 것은 없다**고 맨 위에 적었다

---

### 스스로 내린 판단

1. **닫힌 값은 Postgres enum 이 아니라 `text` + CHECK.** 목록은 계약 상수에서 만든다. `jsonb` 안의 닫힌 값(`decision` · `probe_plan` 의 유형 · 위치)은 트리거의 SQL 에 글자로 적혀 있다 — 계약 목록의 값을 전부 넣어 보고 밖의 값을 거부하는지 테스트가 본다
2. **패키지는 `json`, 원장의 담긴 모양은 `jsonb`.** 패키지는 글자 그대로가 먼저이고, 원장은 트리거가 안을 읽는다
3. **계약의 주석에서 온 검사 셋** — 번호 붙은 불변식이 아니다: 물음의 판은 1부터 1씩 (`PROBE_VERSION` — "1부터 1씩. 글자가 하나라도 바뀌면 새 판") · `correct_choice` 는 `choices` 의 위치 (`PROBE_CHOICE`) · `slide_index` 는 SLIDE_ENTERED · SLIDE_END_SHOWN 일 때만, `from_plan_id` 는 LEVEL_SWITCHED 일 때만 (§1 의 칸 주석)
4. **`knowledge_evidence` 의 (`article_id` · `article_version`)에 FK.** 계약은 "plan 이 있으면 plan 의 것과 같다"까지다. plan 이 없으면 null 이어야 하므로(불변식 19) 있는 값은 언제나 있는 판이다
5. **계약이 요구하지 않아 안 본 것** — `probe_plan` 의 물음 판이 있는가 · `ExposureContext.plan_id` 가 null 인데 `reading_id` 가 있는 경우 · SELF_REPORT_KNOWN 의 `position` (미확인 §13) · 증거의 `timestamp` 와 응답 시각의 관계
6. **계산은 뷰가 아니라 TS 함수** (`readingSummary`). 스키마에 계산한 값이 보이는 자리를 두지 않았다 — 뷰 0 (테스트가 본다)
7. **ORM 을 믿지 않는 길 하나를 만들었다** (`appendLedger` · `appendArticle`). 지시의 범위(스키마와 검사)를 반 걸음 넘는다 — Drizzle 이 모르는 칸을 버리는 것을 보고, "계약에 없는 칸 → 거부"가 그 길에서는 거짓이 되어서다. API 는 아니다
8. **`appendArticle` 은 `_` 주석이 남은 패키지를 거부한다.** 픽스처 파일을 그대로 넣으면 `_source` 가 딸려 들어간다. 테스트는 주석을 뺀 사본을 넣고, 뺀 것이 `_` 칸뿐임을 따로 보인다
9. **`pnpm-workspace.yaml` 에 `allowBuilds: esbuild: false`.** drizzle-kit 이 esbuild 를 끌고 오는데 pnpm 이 설치 스크립트를 묻는다. 안 돌려도 `pnpm generate` 가 된다 — 꺼 두었다
10. **읽으라는 목록 밖에서 읽은 것**: DATA_MODEL §1 의 ArticleAuthoring · TimeExpression 등 일곱 타입 (ArticleRecord 의 TS 타입에 필요) · `logs/content/store-correction-2026-10.md` · `source-check-2026-10.md` 의 C-3b 절 (잔일의 근거 구절) · `selftest-verify-*.py` · `verify-data-model.py` (잔일). `docs/PM.md` · deprecated 는 안 열었다

### 하지 않은 것

- API · 화면 · 로그인 · 배포. `apps/web` 불변 (`git diff 51955be -- apps` 0줄)
- `user_concept_state` · 가중치 · 임계값 · 추정기 · A/B 의 테이블 · 칸 · 인터페이스. 사실 저장소 · 개념 라이브러리 · 교정 기록의 테이블. 요점 · 해석의 테이블
- 물음을 놓는 자리 · 물음 문안. 물음은 여전히 0 개다
- §4.2 의 `block_decisions` 계산을 TS 로 옮기기 (0.4b 물음)
- 운영용 Postgres 드라이버. 실제 Supabase 연결
- 미룬 _open (m4 ~ m7) · 교정 기록 42행의 초안 확인

---

### 검증

**파이썬 검사 14종** — 전부 앞과 같은 exit

```
verify-article            exit=0 | OK
verify-concept-identity   exit=0 | OK
verify-data-model         exit=0 | OK
verify-observation        exit=0 | OK
verify-contract-coverage  exit=0 | OK
selftest-verify-article            exit=0 | OK
selftest-verify-concept-identity   exit=0 | OK
selftest-verify-data-model         exit=0 | 사본 116개 · OK            (113 → 116)
selftest-verify-observation        exit=0 | 사본 106개 + 계산 2 · OK
lint-concepts             exit=1 |   1 hits                             (알려진 오탐 — D33. 스크립트 · 라이브러리 불변)
compare-reader-text       exit=0 | OK — 등록 안 된 차이 0 (허용된 차이 밖의 독자 글 불변)
compare-concept-text      exit=0 | OK — 44 단위 · 2661자 · 다른 것 0
verify-observed           exit=0 | PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치
diff-observed-article     exit=0
```

```
$ python3 scripts/verify-data-model.py
  저장소 fixtures/store.json — Fact 60 (브리프에서 37 · 새로 23) · FactSource 90 (1차 구절 82) · Source 31 · DerivedClaim 10 · Goal 4 · Bridge 1 · Event 1 · Storyline 1
  발행 검사에서 막히는 것 56 — 독자에게 닿는 것 1 · 기계 검증용 55
         FACT_NOT_YET_PUBLIC 1 · FACT_NO_SOURCE_SPAN 49 · FACT_PUBLIC_UNPROVEN 4 · QUOTE_SPAN_MISSING 2
OK
$ python3 scripts/verify-observation.py
  계약   docs/contract/OBSERVATION.md — 타입 15 · 칸 106
  실물   correction-log.jsonl 57행 (원본. 얼린 CSV 에서 옮긴 것 42) …
         check {'None': 17, 'lint-1': 2, 'lint-2': 1, 'quote-check': 1, '1차 원문 대조': 20, '반증 검사': 10, 'D15 선형 읽기 점검': 3, '사실 글 ↔ 1차 구절 대조': 3}
         target {'ARTICLE': 38, 'CONCEPT': 7, 'FACT': 14, 'CLAIM': 5} …
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 22 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']
              끝이 나온 완독 True · 멈춘 장의 끝이 나온 뒤였나 True
  WARN  CORR_DRAFT: 42행의 gate · occasion · targets · caught_by · check 가 초안이다 — 사람이 확인한다 (`_draft`)
OK
```

**`pnpm -s typecheck`** — 4 패키지 (tokens · contract · db · web) 전부 Done, 오류 0

**`pnpm -s test`**

```
packages/contract test:  Test Files  2 passed (2)
packages/contract test:       Tests  24 passed (24)          (15 → 24)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  75 passed (75)                (새로. 2.4초)
apps/web test:   basic · 켬: 슬라이드 9 · 독자 글 단위 62개 · 1920자 대조 — 일치
apps/web test:   advanced · 켬: 슬라이드 5 · 독자 글 단위 55개 · 1458자 대조 — 일치
apps/web test:   basic · 줄임: 슬라이드 9 · 독자 글 단위 62개 · 1920자 대조 — 일치
apps/web test:   advanced · 줄임: 슬라이드 5 · 독자 글 단위 55개 · 1458자 대조 — 일치
apps/web test:   19 passed (2.2m)
```

e2e 가 `logs/frontend/F-2b/` 의 그림 5 · 영상 1 을 다시 썼다 (두 번 돌려 두 번). 그 여섯 파일만 이름을 적어 되돌렸다.

**완독 · 멈춘 장 — 원장에서 센 값 = 파이썬 값** (`packages/db/test/ledger.test.ts`)

| 원장 | 완독 | 끝이 나온 완독 | 멈춘 장 | 멈춘 장의 끝 | 전환으로 떠난 레벨 |
|---|---|---|---|---|---|
| 시험 열람 | true | true | basic 3 | true | basic · advanced |
| 끝이 나온 사건이 없다 | true | **false** | basic 3 | false | basic · advanced |
| 입문 4장에서 숙련으로 바꾸고 끝 | false | false | **advanced 0** | false | basic |

값은 파이썬이 표준 출력으로 낸 것을 테스트가 그 자리에서 읽어 댄다 (`scripts/export-trial-ledger.py` — 원장을 다시 만들지 않는다. 만드는 곳은 `build_ledger` 하나다).

**망가뜨린 것 — 검사가 실제로 실패하는가** (손으로 망가뜨리고 돌린 뒤 되돌렸다)

| 망가뜨린 것 | `typecheck` | `test` |
|---|---|---|
| 스키마에 계약에 없는 칸 (`reading_event.dwell_ms`) | `contract-check.ts(19,10): error TS2344: Type 'false' does not satisfy the constraint 'true'` | 4 실패 |
| 스키마에서 칸을 뺌 (`knowledge_evidence.model_version`) | `contract-check.ts(20,10): error TS2344` | 2 실패 |
| null 여부를 바꿈 (`slide_index` not null) | `contract-check.ts(19,10): error TS2344` | 1 실패 |
| 타입을 바꿈 (`seq` text) | `contract-check.ts(19,10): error TS2344` | — |
| 마이그레이션에서 `reading_event` 의 덧붙이기 트리거를 뺌 | — | 5 실패 |
| 계약 문서에 칸을 더함 · 뺌 · 닫힌 값을 바꿈 · null 을 뺌 | — | `contract-docs.test.ts` 의 "망가뜨리면 실패한다" 4개가 늘 돌린다 |

**원장 줄 고치기 · 지우기 · 계약에 없는 칸 · 없는 판을 가리키는 plan** — 전부 거부 (테스트 이름 그대로)

```
reading_plan_log · reading_event · probe · probe_exposure · probe_response · knowledge_evidence
  — 고치기 거부 · 지우기 거부 · 비우기(truncate) 거부            → LEDGER_APPEND_ONLY (18개)
article_record — 고치기 · 지우기 · 비우기 · 있으면 고치기(upsert) 거부   → LEDGER_APPEND_ONLY
값이 같아도 고치기는 거부한다 (아무것도 안 바꾸는 update)
계약에 없는 칸 — 테이블마다                                       → LEDGER_FIELD (6)
계약에 없는 칸 — 담긴 모양 안 (block_decisions · probe_plan · targets · exposure_context · SlideLoc)  → LEDGER_FIELD (6)
없는 판을 가리키는 plan (없는 article_id · 있는 기사의 없는 판 v7)   → PLAN_ARTICLE
```

### 알고 가는 빈 곳

- **PGlite 한 곳에서만 돌렸다.** 실제 Supabase(Postgres) · 여러 접속이 동시에 쓰는 경우는 돌려 보지 않았다. 같은 열람에 두 줄이 동시에 들어오면 하나는 UNIQUE(`reading_id` · `seq`)가 막는다 — 그렇게 설계했지만 본 적은 없다
- `0001` 의 "anon · authenticated 권한 거두기"는 그 역할이 없는 PGlite 에서 **한 번도 실행되지 않았다**
- 트리거는 줄마다 그 열람의 사건을 다시 읽는다. 열람 하나에 사건이 수십 개라 문제없을 크기지만 재지 않았다. `reading_event(reading_id, seq)` 의 UNIQUE 색인이 받친다
- `drizzle-kit` 이 만든 `0000` 과 `src/schema.ts` 가 어긋났는지(스키마만 고치고 `pnpm generate` 를 안 돌린 경우)를 직접 보는 검사는 없다. 실제 데이터베이스의 칸 ↔ 계약은 테스트가 보므로 칸이 어긋나면 걸린다. CHECK · 색인만 어긋나면 안 걸린다
