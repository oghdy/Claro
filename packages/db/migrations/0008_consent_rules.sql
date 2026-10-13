-- 동의 표(identity.consent)의 규칙 — 손으로 쓴 마이그레이션 (B-0.5 · D37).
-- 원장이 아니다. 그래도 화면이 직접 읽고 쓰지 못하게 하는 것은 원장과 같다: RLS 를 켜고, 정책은 API 전용 역할에게만 (넣기 · 읽기).
-- 고치기 · 지우기 권한은 API 역할에게 없다 — 동의를 거두는 일(지우기)은 주인이 한다 (도윤이 손으로. 화면에 그 길이 아직 없다)
alter table identity.consent enable row level security;
--> statement-breakpoint
grant select, insert on identity.consent to claro_api;
--> statement-breakpoint
create policy claro_api_select on identity.consent for select to claro_api using (true);
--> statement-breakpoint
create policy claro_api_insert on identity.consent for insert to claro_api with check (true);
--> statement-breakpoint
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table identity.consent from %I', r);
    end if;
  end loop;
end $$;
