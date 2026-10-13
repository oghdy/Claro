# packages/db — Supabase 에 올릴 때

**올렸다** (2026-10-13) — Supabase · Vercel: https://claro-lime-one.vercel.app. 0.5 (물음 화면)에서 마이그레이션이 아홉이 됐고 물음 넷이 더해진다 — 올린 결과는 `logs/backend/phase-0-step-0-5.md` 올릴 때 이 문서를 본다 — 맨 앞의 §0 부터. 올린 결과는 `logs/backend/phase-0-step-0-4c.md` 에 적는다.
PGlite 와 이 Mac 의 Postgres 18 에서 돌려 봤다. Supabase 에서 확인한 것은 `logs/backend/phase-0-step-0-4c.md` 의 표에 있다.

비밀 값(접속 문자열 · 키)은 저장소에 넣지 않는다. 이 문서에는 **이름만** 있다.

---

## 0. 배포 — 한눈에 (0.4c · 지금 코드 기준)

**무엇이 어디서 도나**

| 무엇 | 어디 | 데이터베이스에 기대나 |
|---|---|---|
| 기사 화면 (`/`) | Vercel — **정적 페이지.** 빌드할 때 `fixtures/` 에서 패키지와 판의 키를 읽어 HTML 에 싣는다 | **아니다.** 데이터베이스가 죽어도 뜬다 (D35) |
| 기록 API (`/api/plans` · `/api/events`) · `/api/articles/…` | Vercel 의 서버 함수 (서울 `icn1` — `apps/web/vercel.json`) | 그렇다 — `DATABASE_URL`. 죽어 있으면 5xx 로 답하고, 화면은 줄을 쥐고 있다가 다시 보낸다 |
| `/api/peek` | **배포에 없다** (Vercel 에서는 언제나 404) | — |
| 마이그레이션 · 골든 넣기 · 독자 올리기 · 올린 뒤 확인 · 원장 보기 | **도윤의 컴퓨터** — `apps/web/.env.deploy` 의 접속 값으로 | 그렇다 |

**도윤이 만드는 것** (계정이 필요하다)

| 무엇 | 어디서 |
|---|---|
| Supabase 프로젝트 | 만들었다 (organization "Claro" · 프로젝트 "Claro" · 서울). Data API 꺼짐 · automatic RLS 켜짐 |
| `apps/web/.env.deploy` | 자기 컴퓨터에. 저장소에 안 들어간다 (`.gitignore` 의 `.env.*`). **`.env` 라는 이름을 쓰지 않는다** — Next 가 `.env` 를 스스로 읽어서, 개발 서버 · 테스트 서버가 배포된 데이터베이스에 쓰게 된다 |
| Vercel 프로젝트 | 이 저장소를 잇는다. Root Directory = `apps/web` |
| 독자의 이름표 ↔ 사람 | **저장소 · 데이터베이스 밖** (§6) |

**환경 변수 — 이름만. 값은 이 문서 · 저장소 · 채팅 어디에도 적지 않는다**

| 이름 | 무엇 | 어디에 |
|---|---|---|
| `DATABASE_URL` | Postgres 접속 문자열. 코드가 읽는 곳은 `apps/web/src/server/db.ts` 하나다 | **`.env.deploy`** — 테이블 주인(`postgres`)의 것. 세션 방식 풀러(Session pooler · 포트 5432). 도윤의 컴퓨터에만 있다. **Vercel** 의 환경 변수 (Production) — **API 전용 역할(`claro_api`)의 것.** 거래 방식 풀러(6543). `deploy:role` 이 만들어 `apps/web/.env.vercel` 에 써 준다 — 주인의 값을 Vercel 에 넣지 않는다 |
| `DATABASE_MIGRATE_URL` | 마이그레이션만 다른 접속으로 돌릴 때. 없으면 `DATABASE_URL` 을 쓴다 | `.env.deploy` — 안 넣어도 된다 |
| `CLARO_SITE` | 독자 링크의 앞부분 (배포된 주소). 비밀이 아니다 | `.env.deploy` |
| `CLARO_PGLITE_DIR` | PGlite 폴더 — 개발 · 테스트 · `pnpm phone` 에서만. `DATABASE_URL` 이 없을 때만 본다 | 배포에는 없다 |
| `CLARO_PEEK` | `1` 이면 `/api/peek` 가 원장을 내어 준다 — 이 컴퓨터에서만 | **배포에 넣지 않는다.** 넣어도 Vercel 에서는 404 다 (테스트가 지킨다) |

- 접속 문자열은 풀러의 것을 쓴다. Supabase 의 직접 연결(`db.<프로젝트>.supabase.co`)은 IPv6 뿐이라 집 · Vercel 에서 안 닿을 수 있다
- 거래 방식 풀러는 준비된 문장을 못 쓴다 — `db.ts` 가 `prepare: false` 로 연다. 마이그레이션은 거래 방식 풀러로 돌리지 않는다
- `DATABASE_URL` 도 `CLARO_PGLITE_DIR` 도 없으면 서버는 데이터베이스를 열지 않고 실패한다 (5xx) — 조용히 임시 폴더에 쓰지 않는다

**명령 — 전부 `.env.deploy` 를 읽는다. 접속 값은 출력하지 않는다**

| 차례 | 명령 | 무엇 |
|---|---|---|
| 1 | `pnpm --filter @claro/web deploy:migrate` | 마이그레이션 아홉을 한 번에 (§1). 대상의 서버 이름 · 데이터베이스 이름과 적용된 개수를 낸다 |
| 2 | `pnpm --filter @claro/web deploy:verify` | §4 "올린 뒤 확인"을 그대로 돌린다 — 테이블 9 · RLS · 정책은 API 역할의 17개뿐 · 화면 키의 권한 0 · 덧붙이기만 |
| 3 | (대시보드) Data API 에서 schema 빼기 | §2 의 겹 3. 프로젝트를 만들 때 Data API 를 껐으면 이미 된 것이다 — 꺼져 있는지만 본다 |
| 4 | `pnpm --filter @claro/web deploy:seed` | 골든 한 판 (있으면 아무것도 안 한다) |
| 4-2 | `pnpm --filter @claro/web deploy:probes` | 물음 넷 (판 1 · D37). 넣기 전에 요점 · 개념을 확인한다 (불변식 23 · 18). 있으면 아무것도 안 한다 — 글자가 다르면 멈춘다 |
| 5 | `pnpm --filter @claro/web deploy:reader R-00` | 독자 하나를 올리고 **링크 셋**을 낸다 — 읽기 (Claro 무리) · 일반 기사 무리 · 며칠 뒤 (공통). `CLARO_SITE` 가 앞에 붙는다. 어느 독자에게 어느 링크를 보냈는지는 명단에 (데이터베이스에 무리를 적지 않는다) |
| 6 | `pnpm --filter @claro/web deploy:role` | API 전용 역할에 새 비밀번호를 걸고 그 접속 값을 `apps/web/.env.vercel` 에 쓴다 (화면에는 안 낸다). 그 값으로 붙어 읽기는 되고 고치기 · 지우기 · 트리거 끄기는 안 되는 것을 본다. **다시 돌리면 비밀번호가 바뀐다** — Vercel 의 값도 다시 넣는다 |
| 7 | Vercel 에 `DATABASE_URL` (`.env.vercel` 의 값)을 넣고 배포 | |
| 볼 때 | `pnpm --filter @claro/web deploy:answers` (`… deploy:answers R-03` 한 사람) | **독자의 답** — 독자마다 동의한 때 · 물음마다 언제 어느 위치에서 보여줬나 · 답 (쓴 글은 그대로) · 답하지 않음. 쓴 답을 가리는 것은 사람의 일이다 — 판정을 적는 칸은 없다 |
| 볼 때 | `pnpm --filter @claro/web deploy:ledger` | 원장에 남은 것 — 열람마다 plan · 사건 · 완독 · 끝이 나온 완독 · 멈춘 장 · 계약에 맞는가 |

**배포된 화면이 보여주는 판 = 빌드할 때의 `fixtures/` 다.** 그 판이 데이터베이스에 없으면 (`deploy:seed` 를 안 돌렸으면) plan 이 `PLAN_ARTICLE` 로 거부되고 기록이 한 줄도 안 남는다 — 읽기는 된다.
판을 바꿔 배포하면 seed 도 다시 돌린다 (새 판이 덧붙는다. 옛 판은 그대로 있다).

**돌려 본 것 · 안 돌려 본 것** — PGlite 와 이 Mac 의 Postgres 18 (Postgres.app)에서 `packages/db` 테스트 전부와 화면의 끝에서 끝까지 테스트를 돌렸다 (`logs/backend/phase-0-step-0-4c.md` 의 표).
`0001` 의 "anon · authenticated 권한 거두기"는 그 역할이 있는 Supabase 에서 처음 실행된다 — `deploy:verify` 가 결과를 본다.

---

## 1. 마이그레이션 — 적용 순서

`migrations/meta/_journal.json` 의 순서대로, **아홉 다**, 한 번에. 명령: `pnpm --filter @claro/web deploy:migrate` (`apps/web/src/server/db.ts` 의 `migrateDatabase`).

| 순서 | 파일 | 무엇 | 어떻게 만들었나 |
|---|---|---|---|
| 1 | `0000_ledger_tables.sql` | schema `identity` · 테이블 8 (원장 6 · `article_record` · `identity.reader`) · PK · FK · UNIQUE · CHECK | `pnpm generate` (drizzle-kit 이 `src/schema.ts` 에서) — 손으로 고치지 않는다 |
| 2 | `0001_ledger_rules.sql` | 고치기 · 지우기 · 비우기를 막는 트리거 · 넣을 때의 불변식 검사 · RLS 켜기 · anon / authenticated 권한 거두기 | 손으로 썼다 (`drizzle-kit generate --custom`) |
| 3 | `0002_reading_event_end_index.sql` | D34 — "한 plan 의 한 장에 끝은 한 번"의 부분 유일 색인을 뗀다 (같은 장의 끝이 두 번 와도 받는다) | `pnpm generate` |
| 4 | `0003_reading_event_accepts.sql` | D34 — 읽기 사건을 넣을 때 보는 것을 **참조**(그 열람 · 독자 · 세션의 plan 인가)만 남긴다. `seq` 순서 · 지금 plan · 지금 장 · 전환 다음 · CLOSED 뒤는 넣을 때 보지 않는다 | 손으로 썼다 (`create or replace`) |
| 5 | `0004_plan_reading_level_unique.sql` | D35 — (열람 · 레벨) 유일 제약을 뗀다 (탭을 복제하면 같은 열람 · 같은 레벨의 plan 이 둘 온다) | `pnpm generate` |
| 6 | `0005_reading_plan_accepts.sql` | D35 — plan 을 넣을 때 보는 것을 **모양 · 참조**(있는 판 · 그 판의 레벨)만 남긴다. 불변식 3 · 5 · 7 은 넣을 때 보지 않는다 | 손으로 썼다 (`create or replace`) |
| 7 | `0006_api_role.sql` | API 전용 역할 `claro_api` (로그인 없이 만든다) · 원장 · 판에 넣기 · 읽기 권한과 그 역할만의 RLS 정책 15개 · 대응표는 읽기만 | 손으로 썼다 |
| 8 | `0007_consent.sql` | `identity.consent` — 동의를 눌렀다는 사실과 때 (D37). **원장이 아니다** | `pnpm generate` |
| 9 | `0008_consent_rules.sql` | 그 표의 RLS · API 역할의 넣기 · 읽기 (정책 2 — 모두 17) · 화면 키의 권한 거두기 | 손으로 썼다 |

- **0001 · 0003 까지만 적용된 상태로 두지 않는다.** 그 상태의 원장은 빈 `seq` · 계약과 다른 순서의 사건(0001 까지) · 복제된 탭의 plan(0003 까지)을 **거부한다** — 화면이 보낸 관찰이 사라진다 (D34)
- **0000 만 적용된 상태로 두지 않는다.** 그 사이의 원장은 고칠 수 있고 지울 수 있다. 둘을 같은 실행에서 적용한다 (Drizzle 의 migrator 는 저널에 있는 것을 전부 적용한다)
- 적용은 Drizzle 의 migrator 로 (`drizzle-orm/<드라이버>/migrator` 의 `migrate` 또는 `drizzle-kit migrate`). 적용한 것은 `drizzle.__drizzle_migrations` 에 남는다. Supabase 대시보드의 SQL 편집기에 붙여 넣지 않는다 — 저널과 어긋난다
- 마이그레이션은 **직접 연결**로 돌린다 (거래 방식 풀러를 거치지 않는다). 드라이버는 postgres.js 다 (0.4c). Supabase 에서는 세션 방식 풀러(5432)로 돌린다 — 직접 연결은 IPv6 뿐이다
- **이미 적용한 마이그레이션 파일은 고치지 않는다.** 스키마를 바꾸려면 `src/schema.ts` 를 고치고 `pnpm generate` 로 새 파일을 만든다. 트리거 · 함수를 바꾸려면 새 `--custom` 파일에서 `create or replace` 한다
- 확장 기능은 쓰지 않는다. UUID 는 쓰는 쪽이 만들어 넣는다 (기본값이 없다 — 테스트가 본다)

## 2. 화면에서 직접 못 쓰게 — 기록은 우리 API 만 쓴다 (D1)

Supabase 는 `public` 의 테이블을 Data API (PostgREST)로 내놓고, 화면에 들어가는 키(anon)로 읽고 쓸 수 있게 기본 권한을 준다. 세 겹으로 막는다.

| 겹 | 무엇 | 어디서 |
|---|---|---|
| 1 | **RLS 를 켜고, 정책은 API 전용 역할(`claro_api`)에게만 준다** (읽기 · 넣기 — `0006`). 화면 키의 역할에게는 정책이 하나도 없다 — 한 줄도 못 읽고 못 쓴다 | `0001` · `0006`. 테스트가 본다 (RLS 켜짐 9 · 정책 17 전부 `claro_api`) |
| 2 | **`anon` · `authenticated` 의 권한을 거둔다** — 테이블 8개와 schema `identity` | `0001` 이 한다 (그 역할이 있을 때만. PGlite 에는 없어서 **이 줄은 한 번도 실행된 적이 없다**) |
| 3 | **Data API 가 내놓는 schema 에서 뺀다** — `identity` 는 넣지 않는다. 우리는 Data API 를 쓰지 않으므로 `public` 도 빼거나 Data API 를 끈다 | Supabase 대시보드 (Project Settings → API). **사람이 한다** |

덧붙여 사람이 한 번 할 것 (대시보드 SQL 이 아니라 새 `--custom` 마이그레이션으로 넣을지는 0.4c):

```sql
-- 앞으로 public 에 생기는 테이블도 화면 키에 열리지 않게
alter default privileges in schema public revoke all on tables from anon, authenticated;
```

- **`claro_api` 밖의 역할에 정책을 "임시로" 더하지 않는다.** `anon` · `authenticated` 에 정책이 하나라도 생기면 화면이 원장을 직접 쓸 수 있다. 계약 검사는 API 한 곳에서 일어나야 한다 (D1)
- **화면 코드에 들어가면 안 되는 것**: 접속 문자열 · service_role 키. 둘 다 RLS 를 건너뛴다. `NEXT_PUBLIC_` 으로 시작하는 이름에 넣지 않는다
- **RLS 는 테이블 주인과 service_role 을 막지 않는다.** 그 둘에게서 원장을 지키는 것은 트리거다 — 고치기 · 지우기 · 비우기는 **어느 역할이든** 거부된다.
  트리거도 주인은 끌 수 있다 (`alter table … disable trigger`). 그래서 **배포된 서버는 주인이 아닌 역할(`claro_api`)로 접속한다** — 그 역할은 트리거를 끌 수 없다 (§5)

## 3. 환경 변수 — 이름만

§0 의 표로 옮겼다. `.env` · `.env.*` 는 `.gitignore` 에 있다. 예시 파일은 만들지 않았다 — 이름은 §0 에, 값은 도윤의 손에만 있다.
Supabase Auth 의 값(프로젝트 주소 · anon 키)은 로그인을 붙일 때 생긴다. F-3 은 로그인 없이 독자별 링크다 (D1) — 지금은 없다.

## 4. 올린 뒤 확인 — 그대로 돌린다

`pnpm --filter @claro/web deploy:verify` 가 아래를 돌리고 OK / FAIL 로 낸다 (`apps/web/scripts/verify-database.ts`). 손으로 돌리려면:

```sql
-- 테이블 8 · RLS 전부 켜짐 · 정책 0
select n.nspname, c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind = 'r' and n.nspname in ('public', 'identity') order by 1, 2;
select count(*) from pg_policies where schemaname in ('public', 'identity');            -- 0

-- 화면 키의 역할에 남은 권한이 없다
select grantee, table_schema, table_name, privilege_type from information_schema.role_table_grants
 where grantee in ('anon', 'authenticated') and table_schema in ('public', 'identity');  -- 0행

-- 원장은 덧붙이기만 한다 (되돌리는 거래 안에서)
begin; update article_record set article_version = article_version; rollback;           -- LEDGER_APPEND_ONLY 로 실패해야 한다
```

그리고 화면에 들어가는 키로 Data API 를 불러 본다 — `article_record` · `reading_event` 가 **읽히지도 않아야** 한다.

## 5. 0.4c 가 정한 것 · 남긴 것

- **드라이버와 풀러** — postgres.js · `prepare: false` · 접속은 인스턴스마다 3개까지. Vercel 은 거래 방식 풀러로 붙는다
- **API 는 전용 역할 `claro_api` 로 접속한다** (D35 "0.4c 1 ~ 3" 판정). 넣기 · 읽기만 된다. 고치기 · 지우기 · 비우기는 권한이 없고, 주인이 아니라 트리거를 끌 수도 테이블을 바꿀 수도 없다. 대응표에는 쓰지 못한다.
  역할은 `0006` 이 만들고 비밀번호는 `deploy:role` 이 건다. 마이그레이션 · 골든 넣기 · 독자 올리기는 주인(`.env.deploy`)이 한다 — 그 값은 도윤의 컴퓨터를 떠나지 않는다
- Postgres 판 — PGlite 0.5.8 과 Postgres 18.2 에서 같은 테스트가 통과했다. Supabase 의 판은 올릴 때 본다 (로그의 표)

## 6. 대응표 `identity.reader` — 이름표는 사람을 알아볼 수 없는 부호다 (D34)

- 칸은 셋이다: `user_id` (뜻 없는 UUID) · `label` · `created_at`. **`label` 에는 부호만 넣는다** — "R-07". 이름 · 별명 · 전화번호 · 메일 · 소속을 넣지 않는다
- **누가 R-07 인지는 저장소에도 데이터베이스에도 두지 않는다** (OBSERVATION §3 · D30). 도윤이 따로 갖고 있는다
- 지키려는 것: 원장의 백업 · 덤프를 받은 사람이 독자가 누구인지 모른다. 같은 데이터베이스라 이 표도 같은 백업에 실린다 — 그래서 여기에 사람을 알아볼 값이 있으면 안 된다
- 독자를 올리는 길은 `apps/web/scripts/reader.ts` 다 (`deploy:reader`). 부호 모양(글자 1 ~ 3 + `-` + 숫자)이 아니면 거부한다. 데이터베이스는 `label` 의 글을 막지 않는다 — SQL 로 직접 넣을 때는 사람이 지킨다
- 이 표에 없는 `user_id` 의 줄은 API 가 **기록하지 않는다** (읽기는 된다). 독자에게 주는 링크는 `…/?r=<user_id>` 다 — 주소에 들어가는 것은 뜻 없는 UUID 뿐이다
- 로그인(Supabase Auth)을 붙일 때 다시 본다 — 그때는 계정 ↔ `user_id` 가 이 자리에 온다 (D1)

### 동의 `identity.consent` (D37)

- 칸은 넷이다: `consent_id` (화면이 만든다 — 같은 누름을 다시 보내도 한 줄) · `user_id` · `notice_version` (어느 안내문을 보고 눌렀나) · `consented_at` (누른 때). **무리를 적는 칸이 없다**
- 원장이 아니다 — 계약(OBSERVATION)의 타입이 아니고 원장의 줄은 이 표를 가리키지 않는다. **API 는 이 표에 줄이 없는 독자의 plan · 사건 · 노출 · 응답을 받지 않는다** ("동의 전에는 기록하지 않는다")
- 동의를 거두는 길은 화면에 없다. 누가 그만두겠다고 하면 도윤이 주인의 접속으로 그 독자의 줄을 지운다 (이 표는 지울 수 있다. 원장의 줄은 지울 수 없다 — 그 독자의 줄을 분석에서 뺀다)
- 안내문의 글자를 바꾸면 `apps/web/src/study/copy.ts` 의 `NOTICE_VERSION` 과 `server/study.ts` 의 `NOTICE_VERSIONS` 를 올린다

## 7. 원장에 남은 것 보기

| 어디 | 어떻게 |
|---|---|
| 이 컴퓨터 (PGlite) | `pnpm --filter @claro/web phone` 으로 켜고 폰에서 읽은 뒤, 다른 터미널에서 **`pnpm --filter @claro/web ledger`** — 열람마다 plan · 사건 · 완독 · 멈춘 장 · 계약에 맞는가. PGlite 는 한 프로세스만 열어서, 켜져 있는 서버에게 묻는다 (`/api/peek` · `CLARO_PEEK=1` 일 때만) |
| Supabase | **`pnpm --filter @claro/web deploy:ledger`** — 같은 모양으로 낸다 (데이터베이스를 바로 읽는다. 읽기만). 대시보드의 Table Editor · SQL 편집기로 봐도 된다. `/api/peek` 는 배포에 없다 |

```sql
-- 열람마다 사건을 순서대로
select r.label, e.reading_id, e.seq, e.occurred_at, e.type, p.level, e.slide_index
  from reading_event e join reading_plan_log p using (plan_id) left join identity.reader r on r.user_id = e.user_id
 order by e.reading_id, e.seq;
```

완독 · 멈춘 장 · "계약에 맞는가"는 SQL 이 아니라 `packages/db` 의 `readingSummary` · `checkReading` 이 센다 (칸이 아니다 — 뷰도 없다).
