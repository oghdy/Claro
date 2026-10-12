# packages/db — Supabase 에 올릴 때

**아직 올리지 않았다.** Supabase 프로젝트가 없다 (D1 "도윤이 할 것"). 이 문서는 0.4b 가 올릴 때 볼 것이다.
아래는 PGlite(프로세스 안 Postgres)에서만 돌려 본 것이다 — **실제 Supabase 에서 확인한 것은 하나도 없다.** 올린 뒤 "올린 뒤 확인" 절을 그대로 돌린다.

비밀 값(접속 문자열 · 키)은 저장소에 넣지 않는다. 이 문서에는 **이름만** 있다.

---

## 1. 마이그레이션 — 적용 순서

`migrations/meta/_journal.json` 의 순서대로, 둘 다, 한 번에.

| 순서 | 파일 | 무엇 | 어떻게 만들었나 |
|---|---|---|---|
| 1 | `0000_ledger_tables.sql` | schema `identity` · 테이블 8 (원장 6 · `article_record` · `identity.reader`) · PK · FK · UNIQUE · CHECK | `pnpm generate` (drizzle-kit 이 `src/schema.ts` 에서) — 손으로 고치지 않는다 |
| 2 | `0001_ledger_rules.sql` | 고치기 · 지우기 · 비우기를 막는 트리거 · 넣을 때의 불변식 검사 · RLS 켜기 · anon / authenticated 권한 거두기 | 손으로 썼다 (`drizzle-kit generate --custom`) |

- **0000 만 적용된 상태로 두지 않는다.** 그 사이의 원장은 고칠 수 있고 지울 수 있다. 둘을 같은 실행에서 적용한다 (Drizzle 의 migrator 는 저널에 있는 것을 전부 적용한다)
- 적용은 Drizzle 의 migrator 로 (`drizzle-orm/<드라이버>/migrator` 의 `migrate` 또는 `drizzle-kit migrate`). 적용한 것은 `drizzle.__drizzle_migrations` 에 남는다. Supabase 대시보드의 SQL 편집기에 붙여 넣지 않는다 — 저널과 어긋난다
- 마이그레이션은 **직접 연결**로 돌린다 (거래 방식 풀러를 거치지 않는다). 어느 드라이버를 쓸지는 0.4b 가 정한다 — 이 패키지에는 테스트용 PGlite 만 있다
- **이미 적용한 마이그레이션 파일은 고치지 않는다.** 스키마를 바꾸려면 `src/schema.ts` 를 고치고 `pnpm generate` 로 새 파일을 만든다. 트리거 · 함수를 바꾸려면 새 `--custom` 파일에서 `create or replace` 한다
- 확장 기능은 쓰지 않는다. UUID 는 쓰는 쪽이 만들어 넣는다 (기본값이 없다 — 테스트가 본다)

## 2. 화면에서 직접 못 쓰게 — 기록은 우리 API 만 쓴다 (D1)

Supabase 는 `public` 의 테이블을 Data API (PostgREST)로 내놓고, 화면에 들어가는 키(anon)로 읽고 쓸 수 있게 기본 권한을 준다. 세 겹으로 막는다.

| 겹 | 무엇 | 어디서 |
|---|---|---|
| 1 | **RLS 를 켜고 정책을 하나도 두지 않는다** — 테이블 8개 전부. 정책이 없으면 주인이 아닌 역할은 한 줄도 못 읽고 못 쓴다 | `0001` 이 한다. 테스트가 본다 (RLS 켜짐 8 · 정책 0) |
| 2 | **`anon` · `authenticated` 의 권한을 거둔다** — 테이블 8개와 schema `identity` | `0001` 이 한다 (그 역할이 있을 때만. PGlite 에는 없어서 **이 줄은 한 번도 실행된 적이 없다**) |
| 3 | **Data API 가 내놓는 schema 에서 뺀다** — `identity` 는 넣지 않는다. 우리는 Data API 를 쓰지 않으므로 `public` 도 빼거나 Data API 를 끈다 | Supabase 대시보드 (Project Settings → API). **사람이 한다** |

덧붙여 사람이 한 번 할 것 (대시보드 SQL 이 아니라 새 `--custom` 마이그레이션으로 넣을지는 0.4b):

```sql
-- 앞으로 public 에 생기는 테이블도 화면 키에 열리지 않게
alter default privileges in schema public revoke all on tables from anon, authenticated;
```

- **정책을 "임시로" 더하지 않는다.** 정책이 하나라도 생기면 화면이 원장을 직접 쓸 수 있다. 계약 검사는 API 한 곳에서 일어나야 한다 (D1)
- **화면 코드에 들어가면 안 되는 것**: 접속 문자열 · service_role 키. 둘 다 RLS 를 건너뛴다. `NEXT_PUBLIC_` 으로 시작하는 이름에 넣지 않는다
- **RLS 는 테이블 주인과 service_role 을 막지 않는다.** 그 둘에게서 원장을 지키는 것은 트리거다 — 고치기 · 지우기 · 비우기는 **어느 역할이든** 거부된다.
  트리거도 주인은 끌 수 있다 (`alter table … disable trigger`). 그것까지 막으려면 API 가 주인이 아닌 역할로 접속해야 한다 → 아래 "0.4b 가 정할 것"

## 3. 환경 변수 — 이름만

| 이름 | 무엇 | 어디에 |
|---|---|---|
| `DATABASE_URL` | API 가 쓰는 Postgres 접속 문자열 | 서버만 (Vercel 환경 변수). 화면 번들에 안 들어간다 |
| `DATABASE_MIGRATE_URL` | 마이그레이션을 돌릴 때 쓰는 직접 연결 | 마이그레이션을 돌리는 곳만. 배포된 서버에는 필요 없다 |

- 이름은 이 문서가 붙인 것이다. 0.4b 가 바꿔도 된다 — 아직 읽는 코드가 없다 (`drizzle.config.ts` 는 접속하지 않는다)
- Supabase Auth 의 값(프로젝트 주소 · anon 키)은 로그인을 붙일 때 생긴다. F-3 은 로그인 없이 독자별 링크다 (D1) — 지금은 없다
- `.env` 는 `.gitignore` 에 있다. 예시 파일을 만들지 않았다

## 4. 올린 뒤 확인 — 그대로 돌린다

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

## 5. 0.4b 가 정할 것 (여기서 정하지 않았다)

- **API 가 어느 역할로 접속하나.** 지금 설계로는 테이블 주인이다 (RLS 를 안 탄다). 주인이 아닌 전용 역할에 `insert` · `select` 만 주면 트리거를 끌 수 없어 한 겹이 더 생긴다 — 대신 마이그레이션과 API 의 접속이 갈린다
- **드라이버와 풀러** — 서버리스(Vercel)에서 거래 방식 풀러를 쓰면 준비된 문장을 못 쓴다
- **`identity.reader` 를 같은 데이터베이스에 두는 것** — 원장과 schema 는 다르지만 같은 백업 · 같은 덤프에 실린다 (로그의 _open)
- Postgres 판 — 쓰는 기능은 plpgsql · json / jsonb · 부분 유일 색인 · 트리거뿐이라 판을 타지 않을 것으로 보지만 **PGlite 한 곳에서만 돌렸다**
