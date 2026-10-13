-- API 전용 역할 — 넣기 · 읽기만 (D35 "0.4c 1 ~ 3" 판정 2). 손으로 쓴 마이그레이션 (B-0.4c).
-- 배포된 서버는 테이블 주인이 아니라 이 역할로 접속한다. 이 역할은:
--   할 수 있다   원장 여섯 · article_record 에 넣기 · 읽기. 대응표(identity.reader) 읽기
--   할 수 없다   고치기 · 지우기 · 비우기 (권한이 없다 — 트리거보다 먼저 막힌다) · **트리거 끄기 · 테이블 바꾸기** (주인이 아니다) ·
--               대응표에 쓰기 (독자를 올리는 것은 주인이 한다) · 다른 schema
-- 여기서는 로그인 못 하는 역할로 만든다. 비밀번호는 저장소에 없다 — 올린 사람이 따로 건다 (apps/web/scripts/api-role.ts).
-- RLS 는 그대로 켜져 있다. 정책은 이 역할에게만 준다 — 화면 키의 역할(anon · authenticated)에게는 여전히 정책도 권한도 없다.
do $$
begin
  create role claro_api nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
exception when duplicate_object or unique_violation then
  null; -- 역할은 데이터베이스가 아니라 서버의 것이다 — 이미 있으면 그대로 쓴다
end $$;
--> statement-breakpoint
grant usage on schema public to claro_api;
--> statement-breakpoint
grant usage on schema identity to claro_api;
--> statement-breakpoint
grant select on identity.reader to claro_api;
--> statement-breakpoint
create policy claro_api_select on identity.reader for select to claro_api using (true);
--> statement-breakpoint
do $$
declare
  t text;
begin
  foreach t in array array['article_record', 'reading_plan_log', 'reading_event', 'probe', 'probe_exposure', 'probe_response', 'knowledge_evidence'] loop
    execute format('grant select, insert on public.%I to claro_api', t);
    execute format('create policy claro_api_select on public.%I for select to claro_api using (true)', t);
    execute format('create policy claro_api_insert on public.%I for insert to claro_api with check (true)', t);
  end loop;
end $$;
