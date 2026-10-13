-- D35 (2026-10-13) — plan 도 D34 대로: 넣을 때는 모양 · 참조 · 유일만. 손으로 쓴 마이그레이션 (B-0.4c).
-- plan 하나가 거부되면 그 plan 을 가리키는 사건이 전부 참조(EVENT_PLAN)로 거부된다 — D34 가 사건에서 없앤 바로 그 일이다. 탭 복제 하나로 일어난다.
-- 넣을 때 막는 것:
--   모양      칸 · 타입 · 닫힌 값 (0000 의 CHECK) · block_decisions · probe_plan · SlideLoc 의 담긴 모양 · decision 값 · 같은 개념 두 번
--   참조      있는 판 (PLAN_ARTICLE + FK) · 그 판에 있는 레벨 (PLAN_LEVEL — 불변식 4)
--   유일      plan_id (0000 의 PK)
-- 넣을 때 **더는 보지 않는 것** — 불변식 3 (PLAN_DUPLICATE · PLAN_READING. 0004 가 (열람 · 레벨) 유일 제약도 뗐다) · 5 (PLAN_STATIC) · 7 (PLAN_DEFAULT).
-- 읽을 때 열람마다 본다 — packages/db/src/check.ts.
create or replace function public.claro_reading_plan_log_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  pkg json;
begin
  select a.package into pkg from public.article_record a
    where a.article_id = new.article_id and a.article_version = new.article_version;
  if not found then
    raise exception 'PLAN_ARTICLE: plan 이 없는 판을 가리킨다 (% v%) (OBSERVATION §2.1)', new.article_id, new.article_version;
  end if;
  if not exists (select 1 from json_array_elements(pkg -> 'levels') l where l ->> 'id' = new.level) then
    raise exception 'PLAN_LEVEL: plan 의 레벨 "%" 이 그 판에 없다 (불변식 4)', new.level;
  end if;
  perform public.claro_shape_array(new.block_decisions,
    '{"concept_id": "uuid", "version": "int", "decision": "string", "reason": "string"}', 'ReadingPlanLog.block_decisions');
  if exists (select 1 from jsonb_array_elements(new.block_decisions) d where d ->> 'decision' not in ('SKIP', 'REFRESHER', 'FULL')) then
    raise exception 'PLAN_DECISIONS: decision 값이 SKIP · REFRESHER · FULL 밖이다 (확정 §9.4)';
  end if;
  if (select count(distinct d ->> 'concept_id') from jsonb_array_elements(new.block_decisions) d)
      <> jsonb_array_length(new.block_decisions) then
    raise exception 'PLAN_DECISIONS: block_decisions 에 같은 개념이 두 번 있다 (불변식 6 — 개념마다 정확히 하나)';
  end if;
  if new.selected_blocks is not null then
    perform public.claro_shape_array(new.selected_blocks, '{"slide_index": "int", "block_index": "int?"}', 'ReadingPlanLog.selected_blocks');
  end if;
  if new.skipped_blocks is not null then
    perform public.claro_shape_array(new.skipped_blocks, '{"slide_index": "int", "block_index": "int?"}', 'ReadingPlanLog.skipped_blocks');
  end if;
  perform public.claro_shape_array(new.probe_plan,
    '{"probe_id": "uuid", "probe_version": "int", "probe_type": "string", "position": "string"}', 'ReadingPlanLog.probe_plan');
  if exists (select 1 from jsonb_array_elements(new.probe_plan) i
             where i ->> 'probe_type' not in ('DIAGNOSTIC', 'ACTIVE', 'AUDIT', 'COMPREHENSION')
                or i ->> 'position' not in ('PRE', 'POST', 'DELAYED')) then
    raise exception 'PLAN_PROBE_PLAN: probe_plan 의 probe_type · position 값이 확정 밖이다 (확정 §9.4)';
  end if;
  return new;
end $$;
