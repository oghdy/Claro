# logs/backend · Phase 0 / Step 0.4b — 화면이 읽기 기록을 남긴다 (API + 화면 · 외부 DB 없이)

## B-0.4b · 2026-10-13 · **[GATE]**

독자 글 0자 변경 (`compare-reader-text` 등록 안 된 차이 0 · 화면 문자 대조 4벌 일치 — 본 화면이 이제 데이터베이스에서 온 패키지를 그린다). 화면에 보이는 것 0 변경 (`Reader.tsx` · `SlideView.tsx` · `reader.css` · `copy.ts` · `motions.ts` 불변).
외부 DB 에 연결하지 않았다. 배포하지 않았다. 비밀 값 없음. 물음(probe)의 화면 · KnowledgeEvidence 를 쓰는 길 없음.

---

### 화면의 순간 → 사건 → 원장의 줄

화면이 아는 순간은 셋이고 전부 `Reader.tsx` 의 `notice` 를 지난다 (F-2b). 그것을 `reader/record.ts` 가 줄로 옮긴다. **`Reader.tsx` 는 한 글자도 안 바뀌었다.**

| 독자가 한 것 | 화면의 순간 (`notice`) | 화면이 만드는 줄 | 원장에 남는 것 |
|---|---|---|---|
| 독자별 링크(`/?r=<user_id>`)로 기사를 열었다 | `slide` 입문 0 | **plan** (입문 · `DEFAULT`) → `SLIDE_ENTERED` 0 · seq 0 | `reading_plan_log` 1줄 — 화면이 보낸 칸 아홉 + 서버가 채운 여섯 (`block_decisions` 는 **서버가 패키지에서 계산**) · `reading_event` 1줄 |
| 장의 끝(물음 버튼 · 마지막 장은 끝 묶음)이 화면에 나왔다 | `end` 레벨 i | `SLIDE_END_SHOWN` i | 1줄. 한 장에 한 번 — 화면이 한 번만 낸다 |
| 물음 버튼을 눌렀다 | (`end` i — 아직이면) → `slide` i+1 | `SLIDE_ENTERED` i+1 | 1줄. 어떻게 왔는지는 없다 |
| 지나온 길에서 k 장을 골랐다 · "처음부터 다시 보기" · ← 키 | `slide` k | `SLIDE_ENTERED` k | 1줄 — 앞으로 간 것과 같은 사건이다. 이미 나온 끝은 다시 안 남는다 |
| 레벨을 바꿨다 (처음 가는 레벨) | `level` A>B → `slide` B 0 | **plan** (B · `READER`) → `LEVEL_SWITCHED` (`plan_id` = B · `from_plan_id` = A) → `SLIDE_ENTERED` 0 | plan 1줄 + 사건 2줄 |
| 레벨을 바꿨다 (돌아온 레벨) | `level` B>A → `slide` A (읽던 자리) | `LEVEL_SWITCHED` → `SLIDE_ENTERED` (읽던 자리) | 사건 2줄. **plan 은 있던 것을 다시 쓴다** (열람 · 레벨에 하나) |
| 같은 탭에서 새로고침했다 | `slide` (되살린 자리) | **없다** — 지금 장이 바뀐 것이 아니다 | 0줄. 같은 `reading_id` · 같은 plan · 다음 seq 가 이어진다. 이미 적은 끝은 다시 안 적는다 |
| 층을 켰다 · 문장을 눌렀다 · 지나온 길을 펼쳤다 | (순간이 아니다) | 없다 | 0줄 |
| 화면을 떠났다 | (화면이 듣지 않는다) | 없다 — `CLOSED` 를 내지 않는다 | 0줄. 멈춘 장은 마지막 `SLIDE_ENTERED` 에서 나온다 |
| 링크에 번호가 없다 · 모양이 UUID 가 아니다 | 순간은 똑같이 온다 | 기록기가 없다 — **서버를 부르지 않는다** | 0줄 |
| 링크의 번호가 대응표에 없다 | 〃 | plan 을 한 번 보낸다 → 서버가 `not_recorded` → 그 뒤로 보내지 않는다 | 0줄. 서버 로그에 `UNKNOWN_READER` |
| `/test/…` 로 열었다 (대응표에 있는 번호여도) | 〃 | 기록하는 코드를 쓰지 않는다 | 0줄. 요청 0 · 열람 번호도 안 만든다 |

**누가 무엇을 만드나**

| 값 | 누가 | |
|---|---|---|
| `user_id` | 링크 (`/?r=`) | 도윤이 `pnpm --filter @claro/web reader R-07` 로 올릴 때 생긴 뜻 없는 UUID. 주소에 들어가는 것은 이것뿐이다 |
| `session_id` | 화면 | 탭 하나 = 세션 하나 (`sessionStorage`). 새로고침해도 같다. 탭을 닫으면 끝난다 |
| `reading_id` · `plan_id` · `event_id` | 화면 | `crypto.getRandomValues` 로 만든 UUID v4 (`randomUUID` 는 http 로 여는 폰에서 없다) |
| `seq` | 화면 | 열람 안에서 0부터. 새로고침을 넘어 이어진다 (`place.ts`) |
| `occurred_at` · plan 의 `created_at` | 화면 | **일어난 때** — 기기의 시각. 보낸 때 · 받은 때가 아니다. 순서는 seq 가 정한다 (§5.1) |
| `level_chosen_by` | 화면 | 그 열람의 첫 plan 이고 그 레벨이 패키지의 첫 레벨이면 `DEFAULT`, 아니면 `READER` |
| `article_id` · `article_version` | 서버 → 화면 | 화면은 기사를 받을 때 같이 받는다 (`page.tsx` → `RecordedReader`) |
| `block_decisions` | **서버** | 패키지에서 계산 (`deriveBlockDecisions`). 화면이 이 칸을 보내면 그 plan 을 거부한다 |
| `estimator_version` · `selected_blocks` · `skipped_blocks` · `narrative_form` · `probe_plan` | 서버 | null · null · null · null · `[]` (정적 레벨) |

---

### 끊겼을 때 무엇이 남는지

**읽는 것이 먼저다.** 순간이 오면 줄을 만들어 쥐고(`sessionStorage`) 바로 돌아간다. 보내는 것은 그 뒤에 따로 한다 — 넘어가는 움직임은 어느 경우에도 서버를 기다리지 않는다.
(잰 값: 물음을 눌러 다음 장이 자리 잡기까지 — 서버가 살아 있을 때 983ms · 요청이 전부 끊길 때 980 · 984 · 983ms · 답이 4초 늦을 때 963ms)

| 무슨 일 | 화면 | 원장 |
|---|---|---|
| 서버가 죽었다 · 답이 없다 (10초) · 5xx | 그대로 넘어간다. 줄을 쥐고 있다가 다시 보낸다 — 1 · 2 · 5 · 15 · 30초 뒤, 연결이 돌아오면, 화면으로 돌아오면, 다음 순간이 오면 | 살아나면 전부 들어간다. seq 가 이어지고 계약에 맞는 열람이다. 시각은 일어난 때 그대로 |
| 서버 프로세스가 갑자기 죽었다 (SIGKILL) | 〃 | **죽기 전의 줄은 남아 있다** (PGlite 폴더를 다시 열면 그대로). 죽은 동안의 줄은 살아난 뒤 들어간다 |
| 서버는 넣었는데 답이 길에서 사라졌다 | 못 보낸 줄로 알고 다시 보낸다 | 한 줄이다. 같은 `event_id` · `plan_id` 를 다시 받으면 성공(`duplicate`)이다 |
| 쥐고 있는 채로 새로고침했다 | 쥐고 있던 줄이 그대로 있다 — 되살린 뒤 보낸다 | 빠진 줄 없이 들어간다 |
| 쥐고 있는 채로 **탭을 닫았다** | 떠나면서 한 번 더 보낸다 (`keepalive`). 그것도 못 가면 **사라진다** — 쥔 곳이 탭과 함께 없어진다 | 보낸 데까지만 남는다. 끝에서 사라진 줄은 빈 seq 로도 안 보인다 — 알 수 없다 |
| 한 줄만 거부됐다 (모양 · 참조) | 그 줄을 버린다 (다시 보내도 같다). 나머지는 간다 | 나머지 줄은 남는다. 빈 seq 가 "사건이 하나 사라졌다"로 남고, 읽을 때 `EVENT_SEQ` 가 나온다 |
| plan 이 거부됐다 | 〃 | **그 plan 을 가리키는 사건이 전부 참조로 거부된다** (`EVENT_PLAN`) — _open-3 |
| 저장소를 못 쓰는 브라우저 (개인 정보 보호 모드 등) | 읽는 데는 지장이 없다. 줄은 메모리에만 쥔다 | 새로고침하면 새 열람 · 새 세션이 된다 |
| 데이터베이스가 죽어 **기사를 못 읽는다** | **첫 화면이 안 뜬다** — _open-5 | — |

거부한 줄은 원장에 없다. 서버 로그에만 남는다: `[claro] ledger {"refused":"ReadingEvent","code":"LEDGER_FIELD","id":"…","detail":"…"}` — 줄의 종류 · 까닭 · 줄의 키뿐이다.

---

### _open — 게이트에서 정할 것

| # | 물음 | 지금 해 둔 것 | 왜 물음인가 |
|---|---|---|---|
| **1** | **독자 링크의 모양 — `/?r=<user_id>` 로 가도 되나** | 주소의 `r` 에 `user_id` (뜻 없는 UUID) 그대로. 이름표("R-07")는 주소에 넣지 않았다 — 옆 번호를 짐작할 수 있다 | 다른 안: `/#r=…` (서버 · 접속 기록에 안 남는다. 일부 메신저가 `#` 뒤를 떼면 기록이 안 된다) · `/r/<user_id>` (경로). 링크를 메신저에 붙이면 **미리보기 로봇이 화면을 열 수 있다** — 스크립트까지 돌리는 로봇이면 그 독자의 원장에 "1장에 들어갔다"가 남는다. 본 적은 없다. 링크를 남에게 넘기면 그 사람도 같은 독자로 적힌다 (로그인이 없다 — D1) |
| **2** | **되살린 장을 `SLIDE_ENTERED` 로 다시 적지 않는다 — 맞나** | 새로고침 뒤 0줄. 계약 §5.1 "지금 장이 **바뀔 때** 한 번"을 따랐고 §4.1 에 한 줄 적었다 | F-2b 가 넘긴 물음이다 ("되살린 slide 를 새 사건으로 적을지는 기록 계약이 정한다"). 이렇게 하면 **새로고침이 있었다는 사실이 원장에 남지 않는다.** 적으면 남지만 같은 장에 두 번 들어간 것처럼 보인다 |
| **3** | **plan 은 여전히 뜻으로 거부한다 — 그대로 둘 것인가** | D34 는 읽기 사건(불변식 8 ~ 11 · 22)만 옮겼다. plan 의 불변식 3 · 5 · 7 (`PLAN_DUPLICATE` · `PLAN_READING` · `PLAN_STATIC` · `PLAN_DEFAULT`)은 넣을 때 거부한다 | plan 이 거부되면 **그 레벨의 사건이 전부** 참조(`EVENT_PLAN`)로 거부된다 — D34 가 사건에서 없앤 바로 그 일이다. 지금 화면에서는 일어나지 않는다 (plan 을 사건보다 먼저, 차례대로 보낸다). 일어나는 길: 탭을 복제하면 두 탭이 같은 열람 번호 · 같은 seq 를 쓴다 |
| **4** | **`/api/peek` — 원장을 내어 주는 길을 두어도 되나** | `CLARO_PEEK=1` 일 때만 있고, Vercel 에서는 그 값이 있어도 404 다. 읽기만 한다. 화면이 아니다 (JSON) | PGlite 는 한 프로세스만 연다 — 켜져 있는 서버에게 묻지 않으면 테스트도 도윤도 원장을 볼 수 없다. 지시의 "분석 화면 · 관리 화면 금지"에 화면은 아니라고 봤지만, 원장이 API 로 나가는 길이 하나 생긴 것은 사실이다. 0.4c 에서 실제 Postgres 가 되면 지워도 된다 (SQL 로 본다) |
| **5** | **기사를 데이터베이스에서 요청마다 읽는다 — 첫 화면이 데이터베이스에 기댄다** | `/` 가 정적 페이지에서 요청마다 그리는 페이지가 됐다 (지시: "기사 한 판을 내려준다 — 패키지 + 판의 키") | "읽는 것이 먼저다"를 기록에서는 지켰는데 **기사를 받는 데서는 한 걸음 물러났다.** 판은 불변이라 한 번 읽고 계속 써도 된다 — 0.4c 에서 캐시를 둘지 |
| **6** | **장의 범위(불변식 9 "`slide_index` 가 그 레벨 안")를 읽을 때로 옮겼다** | 레벨에 없는 장(입문 10장)도 받는다. 읽을 때 `EVENT_SLIDE` | 지시는 "9 · 10 · 11 · 22 는 넣을 때 거부하지 않는다"이고 동시에 "참조는 넣을 때 막는다"다. 없는 장을 가리키는 것은 참조로도 읽힌다. 화면이 그렇게 말했다는 사실을 남기는 쪽을 골랐다 |
| **7** | **세션 = 탭 하나 — 계약에 적을 것인가** | 화면은 그렇게 한다. 계약 §6.4 "세션 경계 미확인"은 안 고쳤다 (D34: "F-3 동안의 운영 규칙") | 탭을 닫고 같은 링크를 다시 열면 새 세션 · 새 열람이다. 같은 날 다시 읽은 것과 며칠 뒤 다시 읽은 것이 세션으로는 안 갈린다 — 시각으로만 갈린다 |

판정 없이도 0.4c 는 시작할 수 있다. 1 은 독자에게 링크를 주기 전에, 3 은 실제 독자가 읽기 전에 정해져야 한다.

**D34 의 "PM 의 답" 가운데 뒤집은 것은 없다.** 더한 것 하나: `plan_id` 와 plan 의 `created_at` 도 화면이 만든다 (답의 목록에는 없었다) —
서버가 plan 번호를 돌려줄 때까지 기다리면 서버가 죽었을 때 사건을 만들 수 없다.

---

### 0.4c (배포)에 필요한 것 → `packages/db/SUPABASE.md` §0

도윤이 만들 것 (Supabase 프로젝트 · Data API 에서 schema 빼기 · Vercel 프로젝트 · 이름표 ↔ 사람은 저장소 밖) · 환경 변수 이름 넷 · 적용 순서 다섯 걸음 · 코드에서 고칠 곳 (접속은 `apps/web/src/server/db.ts` 의 `open()` 한 곳) · 돌려 보지 않은 것.
이름표가 부호라는 것은 §6, 원장 보는 법은 §7.

### 도윤이 폰에서 읽어 보고 원장을 보는 법

```bash
pnpm --filter @claro/web phone     # 켠다 — 골든을 넣고, 독자 R-00 의 링크를 내고, 빌드하고, 3200 에서 연다
pnpm --filter @claro/web ledger    # 다른 터미널에서 — 원장에 남은 것
```

첫 명령이 `R-00  http://<이 컴퓨터의 주소>:3200/?r=…` 를 낸다. 같은 공유기의 폰에서 그 주소를 연다. 원장은 `apps/web/.data/phone` 에 쌓인다 (저장소에 안 들어간다. 지우면 처음부터).
돌려 본 것 (이 컴퓨터의 브라우저로 1장을 읽은 뒤):

```
원장 — plan 1줄 · 읽기 사건 2줄 · 열람 1 · 대응표의 독자 1

열람 <reading_id>  독자 R-00  세션 1e126007
  plan  입문 · DEFAULT · 2026-10-13T05:45:51.150Z · 개념 FULL SKIP SKIP FULL
    0  2026-10-13T05:45:51.150Z  SLIDE_ENTERED   입문 1장
    1  2026-10-13T05:45:52.184Z  SLIDE_END_SHOWN 입문 1장
  계산  완독 false · 끝이 나온 완독 false · 멈춘 장 입문 1장 (끝이 나온 뒤 true) · 전환으로 떠난 레벨 []
  계약  맞는다
```

독자를 더 올리려면 서버를 끄고 `CLARO_PGLITE_DIR=.data/phone pnpm --filter @claro/web reader R-01 R-02` (PGlite 는 한 프로세스만 연다). 이름표는 부호만 받는다 — 이름을 넣으면 거부한다.
**실제 폰에서는 돌려 보지 않았다.** 이 컴퓨터의 Chrome 으로만 봤다.

---

### D34 반영 — 원장은 받고, 검사는 읽을 때 한다

| | 한 것 |
|---|---|
| 1 `seq` | (열람 · seq) 유일만 남겼다. "이 열람의 다음 seq 가 아니면 거부"를 뗐다 (`0003`). 빈 곳 · 거꾸로 도착한 순서를 받는다. 계약 불변식 8 을 "온전한 열람이면 0부터 1씩"으로 고쳐 썼다 |
| 2 사건의 뜻 | 불변식 9 · 10 · 11 · 22 를 넣을 때 보지 않는다 (`0003` — 트리거에 `EVENT_PLAN` 만 남겼다 · `0002` — "한 장에 끝은 한 번"의 유일 색인을 뗐다). **읽을 때 보는 검사**: `packages/db/src/check.ts` `checkReading(db, reading_id)` → `{ conforms, issues: [{ code, seq, message }], missing_seq }`. 불변식 6 (`block_decisions` 가 패키지에서 계산한 값과 같은가)도 여기서 본다 |
| 3 이름표 | `identity.reader.label` 은 사람을 알아볼 수 없는 부호다 — 계약 §3 · `SUPABASE.md` §6 · 스키마 주석. 올리는 스크립트가 부호 모양이 아니면 거부한다 |
| 계약 | OBSERVATION CHANGELOG · §1 `seq` 주석 · §3 · §4.1 · §5.1 · **§5.5 (새 절 — 넣을 때 막는 것 / 읽을 때 보는 것)** · §11 읽기 사건 머리 + 불변식 8 · §12 를 지금 상태로. **타입의 칸 · 값은 하나도 안 바뀌었다** |
| 파이썬 | `check_ledger` 의 읽기 사건 검사가 "읽을 때 보는 검사"라고 적었다 (코드 · `EVENT_SEQ` 의 글). 판정은 안 바뀌었다 — TS 의 `checkReading` 이 같은 CODE 를 내는지 테스트가 사본마다 댄다 |

**망가뜨린 원장 44개 — 다시 셌다** (`packages/db/test/ledger.test.ts` 의 `VERDICT` 표)

| | 0.4a | **0.4b (D34 뒤)** | |
|---|---|---|---|
| 넣을 때 막는다 | 35 | **26** | 모양 · 참조 · 덧붙이기만 · plan 과 물음 쪽의 불변식 |
| 읽을 때 잡는다 | — | **11** | 읽기 사건 9 (seq 건너뜀 1 · 레벨에 없는 장 1 · 지금 plan 아님 1 · 전환 2 · CLOSED 뒤 1 · 끝 3) + `block_decisions` 값 2 |
| 아무도 못 잡는다 | 6 | **4** | 불변식 16 "빠짐없이" 1 · 불변식 18 (개념이 leaf · MERGED 아님 · 있는 버전) 3. **전부 증거 줄의 것이다 — 증거를 쓰는 길은 아직 없다** |
| 맞는 원장 (파이썬도 통과) | 3 | 3 | |

- 읽을 때 잡는 11개에서 TS 의 CODE = 파이썬의 CODE (사본마다)
- 넣을 때 거부한 26개 가운데 읽기 사건의 뜻(`EVENT_SEQ` · `EVENT_SLIDE` · `EVENT_CURRENT_PLAN` · `EVENT_SWITCH` · `EVENT_CLOSED` · `EVENT_END`)으로 거부한 것은 0 이다 (테스트가 본다)
- 읽기 사건 가운데 여전히 넣을 때 막는 넷: 장 번호가 없다 · 끝이 나온 장을 안 적음 · 계약에 없는 사건 (`SWIPED_UP`) — 모양 (CHECK) · 방향 · 머문 시간 칸 — 계약에 없는 칸

---

### 한 일

**`packages/contract`** — `decisions.ts` `deriveBlockDecisions(pkg)` (파이썬 `derive_decisions` 를 TS 로. 버전은 패키지의 ConceptRef 에서 읽는다) · `describe.ts` `fieldProblems` (받은 줄을 계약의 칸 목록과 댄다 — 칸이 전부 · 그것만 · 값의 타입) · `isUUID`

**`packages/db`** — `migrations/0002` (drizzle-kit) · `0003` (손으로 · `create or replace`) · `src/check.ts` · `src/append.ts` `ledgerRejection` (거부와 "못 넣었다"를 가른다 — 못 넣은 것은 화면이 다시 보낸다) · 스키마 주석

**`apps/web` — 서버**

| 길 | 무엇 |
|---|---|
| `GET /api/articles/[article_id]/[article_version]` | 기사 한 판 — `{ article_id, article_version, package }`. 저작 데이터는 안 내려간다 |
| `POST /api/plans` | plan 한 줄 (화면의 칸 아홉) → `{ status }`: `stored` · `duplicate` · `rejected` + code · `not_recorded` + code |
| `POST /api/events` | `{ events: ReadingEvent[] }` (200개까지) → 줄마다 `{ event_id, status, code? }`. 줄마다 따로 넣는다 — 하나가 거부돼도 나머지는 남는다 |
| `GET /api/peek` | 원장에 남은 것 (열람마다 plan · 사건 · 계산 · 계약에 맞는가). `CLARO_PEEK=1` 이고 Vercel 이 아닐 때만 — _open-4 |

- `src/server/db.ts` — **접속은 여기 한 곳.** PGlite (폴더는 `CLARO_PGLITE_DIR`). 열 때 마이그레이션을 스스로 돌린다. 추상화는 두지 않았다 — 함수 하나(`db()`)다
- `src/server/ledger.ts` — 위 길들이 부르는 함수. 쓰는 길은 `appendLedger` 뿐 · 계약 타입으로 검사한 뒤 넣는다 · 대응표에 없으면 기록하지 않는다 · 거부는 서버 로그에만
- `src/server/golden.ts` · `scripts/seed.ts` — 골든을 넣는다 (있으면 아무것도 안 한다). `scripts/reader.ts` — 독자를 올리고 링크를 낸다. `scripts/ledger.mjs` — 원장을 본다
- `src/app/page.tsx` — 기사를 데이터베이스에서 읽어 `RecordedReader` 에 넘긴다

**`apps/web` — 화면** (`src/reader`)

- `record.ts` (새로) — 순간 → 줄 → 쥐기 → 보내기. `RecordedReader.tsx` (새로) — `Reader` 에 기록기를 붙인 것. 본 화면만 쓴다
- `place.ts` — 열람(`ReadingState`: 열람 번호 · 다음 seq · 레벨별 plan · 마지막으로 적은 지금 장 · 이미 적은 끝 · 못 보낸 줄)과 세션 번호를 든다. **저장소를 쓰는 곳은 여전히 이 파일 하나다**
- `Reader.tsx` 불변. `/test/moments` · `/test/unknown-type` 불변

---

### 스스로 내린 판단

1. **마이그레이션을 고치지 않고 새로 얹었다** (`0002` · `0003`). 어디에도 적용된 적이 없어 `0001` 을 고쳐도 됐지만, "적용한 파일은 고치지 않는다"(SUPABASE §1)를 처음부터 지켰다. `0001` 에는 이제 안 쓰는 검사가 글로 남아 있다
2. **불변식 6 을 읽을 때 검사에 넣었다.** 지시는 사건의 뜻(9 · 10 · 11 · 22)만 말했다. API 로 들어온 plan 은 서버가 계산하니 늘 맞지만, 원장은 SQL 로도 쓸 수 있다 — 0.4a 의 "아무도 못 잡는 것" 여섯 가운데 둘이 이것이었다
3. **화면이 `block_decisions` 를 보내면 무시하지 않고 거부한다.** "계약에 없는 칸을 보낸다 → 거부"와 같은 규칙이다 (그 길에서 받는 칸은 아홉이다)
4. **줄마다 답한다. 묶음을 통째로 받거나 버리지 않는다.** 한 줄이 틀렸다고 같은 묶음의 맞는 줄을 버리면 D34 가 막으려던 일이 API 에서 다시 생긴다
5. **`not_recorded` 를 받으면 화면은 그 열람을 더 보내지 않는다** — 쥐고 있던 줄도 버린다. 대응표에 없는 번호로 계속 두드리지 않는다
6. **"같은 장이면 `SLIDE_ENTERED` 를 적지 않는다"를 기록기에 두었다.** 화면(`Reader`)은 되살린 자리도 `slide` 순간으로 낸다 (F-2b 의 테스트가 그것을 본다) — 화면을 고치지 않고 기록 쪽에서 계약 §5.1 을 지켰다.
   움직임 줄이기 설정에서 화면이 한 번 더 그려져도 첫 장이 두 번 남지 않는지 테스트를 두었다 (지금 화면에서는 이 규칙이 없어도 한 번이었다 — 규칙을 뺀 채 돌렸을 때 그 테스트는 통과했다. 새로고침 테스트는 실패했다)
7. **"끝"은 이 화면을 그리기 **전에** 적은 것만 거른다.** 같은 화면에서 끝이 두 번 오면 (화면의 버그) 그대로 두 번 적는다 — 원장은 받고, 읽을 때 `EVENT_END` 가 잡는다
8. **독자를 올리는 스크립트를 만들었다** (지시에 없다). 대응표에 독자가 없으면 "폰에서 읽어 보고 원장을 본다"가 안 된다
9. **PGlite 를 `apps/web` 의 의존성에 넣었다** (`dependencies`). 0.4c 에서 드라이버를 바꾸면 뺀다. 빌드에는 묶지 않는다 (`serverExternalPackages`)
10. **화면이 읽던 자리를 저장하는 키(`claro:place:…`)는 안 바꿨다** — 사건 + 발행 시각 그대로. 열람은 판의 키(`claro:reading:<article_id>:<version>`)로 따로 든다. `place.ts` 주석의 "판의 ID 를 받게 되면 바꾼다"는 남아 있다
11. **읽으라는 목록 밖에서 읽은 것**: `scripts/selftest-verify-observation.py` · `export-trial-ledger.py` · `verify-concept-identity.py` 의 `level_spans` (derive 가 부른다) · `apps/web/e2e/*` · `packages/db/test/*` · `docs/development-backend.md` 의 0.4b 절. `docs/PM.md` · deprecated 는 안 열었다

### 하지 않은 것

- 물음(probe)의 화면 · 문안 · 놓는 자리. KnowledgeEvidence · ProbeExposure · ProbeResponse 를 쓰는 길 (API 가 받는 것은 plan 과 읽기 사건뿐이다)
- 로그인 · 배포 · 실제 Supabase 연결. Postgres 드라이버
- 지식 상태 · 가중치 · 임계값 · 추정기. 완독 여부를 담는 칸 (`readingSummary` 가 센다 — 그대로)
- 화면 디자인 · 독자 글 · 골든. 사건에 방향 · 손짓 · 머문 시간
- 분석 화면 · 관리 화면. `CLOSED` 를 내는 것
- 탭 복제를 막는 것 · 첫 화면을 캐시하는 것 (_open-3 · 5)

---

### 검증

**`pnpm -s typecheck`** — 4 패키지 (tokens · contract · db · web) 전부 Done, 오류 0

**`pnpm -s test`**

```
packages/contract test:  Test Files  3 passed (3)
packages/contract test:       Tests  40 passed (40)          (24 → 40. fieldProblems)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  84 passed (84)                (75 → 84)
apps/web test:   basic · 켬: 슬라이드 9 · 독자 글 단위 62개 · 1920자 대조 — 일치
apps/web test:   advanced · 켬: 슬라이드 5 · 독자 글 단위 55개 · 1458자 대조 — 일치
apps/web test:   basic · 줄임: 슬라이드 9 · 독자 글 단위 62개 · 1920자 대조 — 일치
apps/web test:   advanced · 줄임: 슬라이드 5 · 독자 글 단위 55개 · 1458자 대조 — 일치
apps/web test:   넘어가는 시간 — 서버가 살아 있을 때 983ms · 죽었을 때 980 · 984 · 983ms · 4초 늦게 답할 때 963ms
apps/web test:   37 passed (2.6m)                            (19 → 37. 앞의 19개는 한 글자도 안 고쳤다)
```

e2e 가 `logs/frontend/F-2b/` 의 그림 5 · 영상 1 을 다시 썼다. 그 파일만 이름을 하나씩 적어 되돌렸다.

**끝에서 끝까지 — 브라우저(이 Mac 의 Chrome) → API → PGlite → 원장에서 센 값** (`apps/web/e2e/record.spec.ts` · `record-killed.spec.ts`)

| 독자가 한 것 | 원장에 남은 것 | 원장에서 센 값 |
|---|---|---|
| 입문을 끝까지 읽는다 | plan 1 (입문 · `DEFAULT` · FULL 2 · SKIP 2) · 사건 18 (장마다 들어감 + 끝 · seq 0 ~ 17) | 완독 true · **끝이 나온 완독 true** · 멈춘 장 입문 9장 (끝이 나온 뒤) · 계약에 맞는다 |
| 입문 2장 → 숙련 2장 → 입문으로 돌아온다 | plan 2 (입문 `DEFAULT` · 숙련 `READER`) · 사건 11 — 들어감 · 끝 ×2장, 전환, 들어감 · 끝 ×2장, 전환, 들어감(입문 2장) | 완독 false · 멈춘 장 입문 2장 · 전환으로 떠난 레벨 [입문, 숙련] · 맞는다 |
| 3장까지 갔다가 지나온 길로 1장, 다시 앞으로 | 사건 8 — 끝에 `SLIDE_ENTERED` 0 · `SLIDE_ENTERED` 1 (끝은 다시 안 남는다) | 멈춘 장 입문 2장 · 가장 멀리 3장 · 맞는다 |
| 4장에서 새로고침 → 5장으로 | 새로고침만으로는 0줄. 같은 `reading_id` · `session_id` · plan · seq 0 ~ 9 | 맞는다 · 빈 seq 없음 |
| 요청이 전부 끊긴 채 세 장을 넘긴다 → 푼다 | 끊긴 동안 4줄 그대로 → 풀리면 10줄 (화면은 아무것도 안 한다) | 맞는다. `occurred_at` 은 일어난 순서 그대로 |
| **서버 프로세스를 죽인 채**(SIGKILL) 세 장을 넘긴다 → 다시 켠다 | 죽기 전 4줄이 그대로 있다 → 켜지면 10줄. 화면은 그동안 6줄을 쥐고 있었다 | 맞는다 · 멈춘 장 입문 5장 |
| 링크 없이 · 모양이 다른 번호로 읽는다 | **요청 0** | — |
| 대응표에 없는 번호로 읽는다 | 요청 1 (`POST /api/plans`) 뒤로 0. 원장 0줄 | — |
| `/test/moments` · `/test/unknown-type` (대응표에 있는 번호로) | **요청 0** · 열람 · 세션 번호도 안 만든다 · 원장 0줄 | — |
| 움직임 줄이기로 읽는다 | 첫 장이 한 번만 남는다 | 맞는다 |

**망가뜨린 화면 · 망가뜨린 요청** (`record.spec.ts` · `api.spec.ts`)

| 망가뜨린 것 | 서버의 답 | 원장 |
|---|---|---|
| 화면이 seq 를 건너뛴다 (4 → 7) | `stored` | seq 0 1 2 3 7 8 — 뒤따르는 사건이 남는다. 읽을 때: 빈 seq [4, 5, 6] · `EVENT_SEQ` · 계약에 안 맞는다 |
| 화면이 같은 사건을 두 번 보낸다 (답이 사라졌다) | 두 번째는 `duplicate` (성공) | 한 줄 |
| 뒤바뀌어 도착한다 (seq 3 이 2 보다 먼저) | `stored` | 읽으면 seq 순서다 |
| 계약에 없는 칸 (`dwell_ms` · `direction`) · 빠진 칸 · 타입 (`seq: "3"`) · 계약에 없는 사건 (`SWIPED_UP`) | `LEDGER_FIELD` | 없다. **같은 묶음의 맞는 줄은 남는다** |
| 들어간 장이 없다 · 전환인데 떠난 plan 이 없다 | `CHECK …` | 없다 |
| 없는 plan · 다른 열람의 plan | `EVENT_PLAN` | 없다 |
| 같은 (열람 · seq)를 다른 사건이 | `UNIQUE reading_event_reading_seq` | 먼저 온 줄만 |
| 뜻이 틀린 순서 (지금 장이 아닌 끝 · 끝 두 번 · 전환 없이 다른 레벨 · 레벨에 없는 장 · 전환 뒤 `CLOSED` · `CLOSED` 뒤 사건) | 전부 `stored` | 9줄 다 있다. 읽을 때: `1 EVENT_END` · `3 EVENT_END` · `4 EVENT_CURRENT_PLAN` · `5 EVENT_SLIDE` · `7 EVENT_SWITCH` · `7 EVENT_CLOSED` |
| plan 에 `block_decisions` 를 넣어 보낸다 | `LEDGER_FIELD` | 없다 |
| 패키지에 없는 레벨 · 없는 판 · 같은 열람 같은 레벨에 다른 plan | `PLAN_LEVEL` · `PLAN_ARTICLE` · `PLAN_DUPLICATE` | 없다 |
| 대응표에 없는 `user_id` · `user_id` 없음 · 남의 번호로 내 plan 에 사건 | `UNKNOWN_READER` (`not_recorded`) | 0줄 |
| JSON 이 아니다 · `events` 가 목록이 아니다 | 400 | — |
| `PUT` · `PATCH` · `DELETE` | 405 | 고치는 · 지우는 길이 API 에 없다 |

**테스트가 실제로 실패하는가** — 손으로 망가뜨리고 돌린 뒤 되돌렸다

| 망가뜨린 것 | 결과 |
|---|---|
| 기록기에서 "같은 장이면 적지 않는다"를 뺌 + 서버가 모든 UUID 를 독자로 받음 + 서버가 `block_decisions` 를 화면 것 · 일부만 넣음 (셋을 한 번에) | `record.spec` · `api.spec` 17개 가운데 12개 실패 (새로고침 · 링크 없이 · 대응표 · plan 포함). **셋을 따로 돌리지는 않았다** |
| 기록기가 순간마다 서버를 **기다린다** (동기 요청) | "서버가 답하지 않는다" 실패 — `느릴 때 4984ms · Expected < 1686` |
| `/test/moments` 에 기록기를 붙임 | "/test 경로는 API 를 부르지 않는다" 실패 — 요청 15 |
| `checkReading` 에서 "끝이 두 번"을 뺌 | `packages/db` 3개 실패 (표 · 수 · 파이썬과 같은 말) |
| `0003` 에 "다음 seq 가 아니면 거부"를 되살림 | `packages/db` 6개 실패 |

**파이썬 검사 14종** — 전부 앞과 같은 exit

```
verify-article exit=0 | OK
verify-concept-identity exit=0 | OK
verify-data-model exit=0 | OK
verify-observation exit=0 | OK
verify-contract-coverage exit=0 | OK
selftest-verify-article exit=0 | OK
selftest-verify-concept-identity exit=0 | OK
selftest-verify-data-model exit=0 | 사본 116개 · OK
selftest-verify-observation exit=0 | 사본 106개 + 계산 2 · OK
lint-concepts exit=1 |   1 hits                                (알려진 오탐 — D33)
compare-reader-text exit=0 | OK — 등록 안 된 차이 0 (허용된 차이 밖의 독자 글 불변)
compare-concept-text exit=0 | OK — 44 단위 · 2661자 · 다른 것 0
verify-observed exit=0 | PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치
diff-observed-article exit=0
```

**`deriveBlockDecisions` (TS) = `derive_decisions` (파이썬)** — 골든에서. 값은 파이썬이 표준 출력으로 낸 것을 테스트가 그 자리에서 읽어 댄다 (`export-trial-ledger.py` 에 `decisions` 를 더했다)

```
basic     C-0001@1 FULL · C-0002@4 FULL · C-0005@3 SKIP      · C-0012@1 SKIP
advanced  C-0001@1 SKIP · C-0002@4 SKIP · C-0005@3 REFRESHER · C-0012@1 SKIP
```

### 알고 가는 빈 곳

- **실제 폰에서 본 적이 없다.** 이 Mac 의 Chrome (테스트는 375×667 터치 흉내)으로만 돌렸다. iOS Safari 에서 `keepalive` · `sessionStorage` · http 주소에서의 UUID 만들기가 그대로 되는지는 도윤이 `pnpm phone` 으로 읽어 봐야 안다
- **PGlite 한 곳에서만 돌렸다.** 실제 Postgres · 여러 접속 · 서버리스는 0.4c. "서버를 죽인다"는 PGlite 를 품은 프로세스를 죽인 것이다 — Supabase 가 끊기는 것과 같은 일은 아니다
- **탭을 닫으면 쥐고 있던 줄이 사라진다** (위 표). 끝에서 사라진 줄은 빈 seq 로도 안 보인다
- **탭 복제** — 두 탭이 같은 열람 번호 · 같은 seq 를 쓴다. 한쪽의 사건이 `UNIQUE reading_event_reading_seq` 로 거부된다 (_open-3)
- 서버 로그는 서버가 켜져 있는 동안의 표준 출력이다. 거부한 줄을 나중에 세려면 그 로그가 남아 있어야 한다 — Vercel 에서 얼마나 남는지는 0.4c
- 요청의 크기 · 횟수를 막는 것이 없다 (묶음 하나에 사건 200개까지만). 대응표의 `user_id` 를 아는 사람은 그 독자의 이름으로 줄을 넣을 수 있다 — 로그인이 없는 동안의 한계다 (D1)
- `/api/articles/…` 는 만들었지만 본 화면은 쓰지 않는다 (페이지가 같은 함수를 바로 부른다). 부르는 쪽은 테스트뿐이다 — Expo 앱이 생기면 쓴다 (D1)
- `0001` 의 "anon · authenticated 권한 거두기"는 여전히 한 번도 실행되지 않았다
