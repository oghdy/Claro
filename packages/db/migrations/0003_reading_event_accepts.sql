-- D34 (2026-10-13) — 원장은 받고, 검사는 읽을 때 한다. 손으로 쓴 마이그레이션 (B-0.4b).
-- 읽기 사건을 넣을 때 막는 것은 모양 · 참조 · 덧붙이기만이다:
--   모양      칸 · 타입 · 닫힌 값 · slide_index / from_plan_id 가 type 에 맞게 있는가 (0000 의 CHECK)
--   참조      plan_id · from_plan_id 가 있는 plan (0000 의 FK) · plan 이 그 열람 · 독자 · 세션의 것 (아래 EVENT_PLAN)
--   유일      event_id · (reading_id · seq) (0000 의 PK · UNIQUE)
--   덧붙이기만 (0001)
-- 넣을 때 **더는 보지 않는 것** — 0001 의 EVENT_SEQ · EVENT_SLIDE · EVENT_CURRENT_PLAN · EVENT_SWITCH · EVENT_CLOSED · EVENT_END,
-- 그리고 0002 가 뗀 부분 유일 색인(같은 장의 끝이 두 번). seq 의 빈 곳 · 뒤바뀐 도착 순서 · 계약과 다른 사건 순서를 받는다.
-- 화면의 버그나 끊긴 전송이 그 독자의 기록을 없애지 않게 하려는 것이다 (확정 §9.4 — 기록하지 않은 관찰은 복구할 수 없다).
-- 그 불변식(OBSERVATION 8 의 "0부터 1씩" · 9 · 10 · 11 · 22)은 읽을 때 열람마다 본다 — packages/db/src/check.ts.
create or replace function public.claro_reading_event_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  p public.reading_plan_log%rowtype;
begin
  select * into p from public.reading_plan_log where plan_id = new.plan_id;
  if not found or p.reading_id <> new.reading_id or p.user_id <> new.user_id or p.session_id <> new.session_id then
    raise exception 'EVENT_PLAN: seq % 의 plan 이 그 열람 · 독자 · 세션의 것이 아니다 (불변식 8)', new.seq;
  end if;
  return new;
end $$;
