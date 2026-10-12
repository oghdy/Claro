-- 원장의 규칙 — 손으로 쓴 마이그레이션 (B-0.4a). 0000 이 만든 테이블 위에 얹는다.
-- 1) 덧붙이기만 한다: 고치기 · 지우기 · 비우기를 데이터베이스가 막는다 (OBSERVATION §1 · 불변식 1 · DATA_MODEL §11)
-- 2) 줄을 넣을 때 다른 줄을 봐야 하는 불변식과, jsonb 칸에 담긴 모양 (OBSERVATION §11)
-- 3) 화면이 직접 읽고 쓰지 못하게: RLS 를 켜고 정책을 두지 않는다. Supabase 의 anon · authenticated 역할이 있으면 권한을 거둔다 (D1)
-- 실패는 전부 'CODE: 글' 로 낸다. CODE 는 scripts/verify-observation.py 의 것과 같은 이름을 쓴다.

create function public.claro_shape(j jsonb, spec jsonb, what text) returns void
language plpgsql immutable set search_path = '' as $$
declare
  k text;
  kind text;
  v jsonb;
begin
  if j is null or jsonb_typeof(j) <> 'object' then
    raise exception 'LEDGER_SHAPE: % 는 객체여야 한다', what;
  end if;
  for k in select jsonb_object_keys(j) loop
    if not spec ? k then
      raise exception 'LEDGER_FIELD: % 에 계약에 없는 칸 "%" (불변식 1)', what, k;
    end if;
  end loop;
  for k, kind in select * from jsonb_each_text(spec) loop
    if not j ? k then
      raise exception 'LEDGER_SHAPE: % 에 칸 "%" 이 없다', what, k;
    end if;
    v := j -> k;
    if jsonb_typeof(v) = 'null' then
      if right(kind, 1) <> '?' then
        raise exception 'LEDGER_SHAPE: %.% 는 null 일 수 없다', what, k;
      end if;
    elsif rtrim(kind, '?') = 'uuid' then
      if jsonb_typeof(v) <> 'string' or (v #>> '{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'LEDGER_SHAPE: %.% 는 UUID 여야 한다', what, k;
      end if;
    elsif rtrim(kind, '?') = 'int' then
      if jsonb_typeof(v) <> 'number' or (v #>> '{}') !~ '^-?[0-9]+$' then
        raise exception 'LEDGER_SHAPE: %.% 는 정수여야 한다', what, k;
      end if;
    elsif rtrim(kind, '?') = 'string' then
      if jsonb_typeof(v) <> 'string' then
        raise exception 'LEDGER_SHAPE: %.% 는 글이어야 한다', what, k;
      end if;
    end if;
  end loop;
end $$;
--> statement-breakpoint
create function public.claro_shape_array(j jsonb, spec jsonb, what text) returns void
language plpgsql immutable set search_path = '' as $$
declare
  el jsonb;
begin
  if j is null or jsonb_typeof(j) <> 'array' then
    raise exception 'LEDGER_SHAPE: % 는 목록이어야 한다', what;
  end if;
  for el in select * from jsonb_array_elements(j) loop
    perform public.claro_shape(el, spec, what || '[]');
  end loop;
end $$;
--> statement-breakpoint
-- ── 1) 덧붙이기만 한다
create function public.claro_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'LEDGER_APPEND_ONLY: % 는 덧붙이기만 한다 — % 거부 (OBSERVATION §1 · 불변식 1)', tg_table_name, tg_op;
end $$;
--> statement-breakpoint
create trigger article_record_append_only before update or delete on public.article_record
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger article_record_no_truncate before truncate on public.article_record
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger reading_plan_log_append_only before update or delete on public.reading_plan_log
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger reading_plan_log_no_truncate before truncate on public.reading_plan_log
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger reading_event_append_only before update or delete on public.reading_event
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger reading_event_no_truncate before truncate on public.reading_event
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_append_only before update or delete on public.probe
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_no_truncate before truncate on public.probe
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_exposure_append_only before update or delete on public.probe_exposure
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_exposure_no_truncate before truncate on public.probe_exposure
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_response_append_only before update or delete on public.probe_response
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger probe_response_no_truncate before truncate on public.probe_response
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
create trigger knowledge_evidence_append_only before update or delete on public.knowledge_evidence
  for each row execute function public.claro_append_only();
--> statement-breakpoint
create trigger knowledge_evidence_no_truncate before truncate on public.knowledge_evidence
  for each statement execute function public.claro_append_only();
--> statement-breakpoint
-- ── 2) 줄을 넣을 때
-- 기사 한 판 — 통째로 넣는다. 안의 모양은 발행 검사(packages/contract · scripts/verify-article.py)가 본다. 여기서는 객체인지만
create function public.claro_article_record_check() returns trigger
language plpgsql set search_path = '' as $$
begin
  if json_typeof(new.package) <> 'object' or json_typeof(new.authoring) <> 'object'
      or json_typeof(new.package -> 'levels') is distinct from 'array' then
    raise exception 'ARTICLE_SHAPE: package · authoring 은 객체이고 package.levels 는 목록이다 (DATA_MODEL §11)';
  end if;
  return new;
end $$;
--> statement-breakpoint
-- ReadingPlanLog — 불변식 3 · 4 · 5 · 7, block_decisions · probe_plan · SlideLoc 의 모양. (불변식 6 의 값 대조는 여기 없다 — 로그의 표)
create function public.claro_reading_plan_log_check() returns trigger
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
  if exists (select 1 from public.reading_plan_log p where p.reading_id = new.reading_id and p.level = new.level) then
    raise exception 'PLAN_DUPLICATE: 한 열람에 같은 레벨의 plan 이 둘이다 (불변식 3)';
  end if;
  if exists (select 1 from public.reading_plan_log p where p.reading_id = new.reading_id
             and (p.user_id, p.session_id, p.article_id, p.article_version)
                 is distinct from (new.user_id, new.session_id, new.article_id, new.article_version)) then
    raise exception 'PLAN_READING: 한 열람의 plan 들이 다른 독자 · 세션 · 판을 가리킨다 (불변식 3)';
  end if;
  if new.level_chosen_by = 'DEFAULT'
      and exists (select 1 from public.reading_plan_log p where p.reading_id = new.reading_id) then
    raise exception 'PLAN_DEFAULT: 첫 plan 이 아닌데 DEFAULT 다 (불변식 7)';
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
  if new.estimator_version is null and (new.selected_blocks is not null or new.skipped_blocks is not null
      or exists (select 1 from jsonb_array_elements(new.block_decisions) d where d ->> 'reason' <> 'STATIC_LEVEL')) then
    raise exception 'PLAN_STATIC: 정적 레벨 plan 이 블록 선택이나 다른 reason 을 가졌다 (불변식 5)';
  end if;
  return new;
end $$;
--> statement-breakpoint
-- ReadingEvent — 불변식 8 · 9 · 10 · 11 · 22. 한 열람의 사건은 seq 순서대로만 들어온다
create function public.claro_reading_event_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  p public.reading_plan_log%rowtype;
  f public.reading_plan_log%rowtype;
  prev public.reading_event%rowtype;
  n_events integer;
  cur_plan uuid;
  switch_seq integer := -1;
  here integer;
  n_slides integer;
begin
  select * into p from public.reading_plan_log where plan_id = new.plan_id;
  if not found or p.reading_id <> new.reading_id or p.user_id <> new.user_id or p.session_id <> new.session_id then
    raise exception 'EVENT_PLAN: seq % 의 plan 이 그 열람 · 독자 · 세션의 것이 아니다 (불변식 8)', new.seq;
  end if;
  select count(*) into n_events from public.reading_event e where e.reading_id = new.reading_id;
  if new.seq is distinct from n_events then
    raise exception 'EVENT_SEQ: seq % — 이 열람의 다음 seq 는 % 다. 0부터 1씩 (불변식 8)', new.seq, n_events;
  end if;
  if n_events = 0 then
    cur_plan := new.plan_id;
  else
    select * into prev from public.reading_event e where e.reading_id = new.reading_id and e.seq = n_events - 1;
    if prev.type = 'CLOSED' then
      raise exception 'EVENT_CLOSED: seq % — CLOSED 뒤에 사건이 있다 (불변식 11)', new.seq;
    end if;
    select e.seq, e.plan_id into switch_seq, cur_plan from public.reading_event e
      where e.reading_id = new.reading_id and e.type = 'LEVEL_SWITCHED' order by e.seq desc limit 1;
    if not found then
      switch_seq := -1;
      select e.plan_id into cur_plan from public.reading_event e where e.reading_id = new.reading_id and e.seq = 0;
    end if;
    if prev.type = 'LEVEL_SWITCHED' and (new.type <> 'SLIDE_ENTERED' or new.plan_id <> cur_plan) then
      raise exception 'EVENT_SWITCH: seq % — 전환 바로 다음은 새 plan 의 SLIDE_ENTERED 다 (불변식 10)', new.seq;
    end if;
  end if;
  if new.type = 'SLIDE_ENTERED' then
    select json_array_length(l -> 'slides') into n_slides
      from public.article_record a, json_array_elements(a.package -> 'levels') l
      where a.article_id = p.article_id and a.article_version = p.article_version and l ->> 'id' = p.level;
    if new.slide_index is null or new.slide_index < 0 or new.slide_index >= coalesce(n_slides, 0) then
      raise exception 'EVENT_SLIDE: seq % slide_index % — 그 레벨의 범위 밖 (불변식 9)', new.seq, new.slide_index;
    end if;
    if new.plan_id <> cur_plan then
      raise exception 'EVENT_CURRENT_PLAN: seq % — 지금 plan 이 아닌 plan 의 사건이다 (불변식 9)', new.seq;
    end if;
  elsif new.type = 'SLIDE_END_SHOWN' then
    select e.slide_index into here from public.reading_event e
      where e.reading_id = new.reading_id and e.type = 'SLIDE_ENTERED' and e.seq > switch_seq order by e.seq desc limit 1;
    if new.plan_id <> cur_plan or here is null or new.slide_index is null or new.slide_index <> here then
      raise exception 'EVENT_END: seq % — 끝이 나온 장(%)이 지금 장(%)이 아니다 (불변식 22)', new.seq, new.slide_index, here;
    end if;
    if exists (select 1 from public.reading_event e
               where e.plan_id = new.plan_id and e.type = 'SLIDE_END_SHOWN' and e.slide_index = new.slide_index) then
      raise exception 'EVENT_END: seq % — 같은 plan 의 같은 장에 끝이 두 번 나왔다 (불변식 22)', new.seq;
    end if;
  elsif new.type = 'LEVEL_SWITCHED' then
    select * into f from public.reading_plan_log where plan_id = new.from_plan_id;
    if not found or new.from_plan_id <> cur_plan or f.reading_id <> new.reading_id or f.level = p.level then
      raise exception 'EVENT_SWITCH: seq % — 지금 plan 에서 같은 열람의 다른 레벨 plan 으로 (불변식 10)', new.seq;
    end if;
  end if;
  return new;
end $$;
--> statement-breakpoint
-- Probe — 판은 1부터 1씩 (§1). targets · choices 의 모양
create function public.claro_probe_check() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.version <> coalesce((select max(pr.version) from public.probe pr where pr.probe_id = new.probe_id), 0) + 1 then
    raise exception 'PROBE_VERSION: 물음의 판은 1부터 1씩이다 (OBSERVATION §1 Probe.version)';
  end if;
  perform public.claro_shape_array(new.targets, '{"concept_id": "uuid", "version": "int"}', 'Probe.targets');
  if new.choices is not null and (jsonb_typeof(new.choices) <> 'array'
      or exists (select 1 from jsonb_array_elements(new.choices) c where jsonb_typeof(c) <> 'string')) then
    raise exception 'LEDGER_SHAPE: Probe.choices 는 글의 목록이어야 한다';
  end if;
  if new.correct_choice is not null and (new.choices is null or new.correct_choice < 0
      or new.correct_choice >= jsonb_array_length(new.choices)) then
    raise exception 'PROBE_CHOICE: correct_choice 는 choices 의 위치다 (OBSERVATION §1)';
  end if;
  return new;
end $$;
--> statement-breakpoint
-- ProbeExposure — 불변식 12
create function public.claro_probe_exposure_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  p public.reading_plan_log%rowtype;
begin
  if not exists (select 1 from public.probe pr where pr.probe_id = new.probe_id and pr.version = new.probe_version) then
    raise exception 'EXPOSURE_PROBE: 노출이 없는 물음 판을 가리킨다 (불변식 12)';
  end if;
  if new.shown_at_loc is not null then
    perform public.claro_shape(new.shown_at_loc, '{"slide_index": "int", "block_index": "int?"}', 'ProbeExposure.shown_at_loc');
  end if;
  if new.plan_id is not null then
    select * into p from public.reading_plan_log where plan_id = new.plan_id;
    if not found or p.user_id <> new.user_id or p.session_id <> new.session_id then
      raise exception 'EXPOSURE_PLAN: 노출의 plan 이 그 독자 · 세션의 것이 아니다 (불변식 12)';
    end if;
    if exists (select 1 from jsonb_array_elements(p.probe_plan) i
               where i ->> 'probe_id' = new.probe_id::text and (i ->> 'probe_version')::integer = new.probe_version
                 and (i ->> 'probe_type', i ->> 'position') is distinct from (new.probe_type, new.position)) then
      raise exception 'EXPOSURE_PLAN: 노출의 유형 · 위치가 계획과 다르다 (불변식 12)';
    end if;
  end if;
  return new;
end $$;
--> statement-breakpoint
-- ProbeResponse — 불변식 13
create function public.claro_probe_response_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  x public.probe_exposure%rowtype;
begin
  select * into x from public.probe_exposure where exposure_id = new.exposure_id;
  if not found or x.user_id <> new.user_id or new.responded_at < x.shown_at then
    raise exception 'RESPONSE_EXPOSURE: 응답이 가리키는 노출이 없거나, 독자가 다르거나, 보여주기 전에 답했다 (불변식 13)';
  end if;
  if exists (select 1 from public.probe_response r where r.exposure_id = new.exposure_id) then
    raise exception 'RESPONSE_TWICE: 노출 하나에 응답이 둘이다 (불변식 13)';
  end if;
  return new;
end $$;
--> statement-breakpoint
-- KnowledgeEvidence — 불변식 15 · 16(많아야 하나 · target 에만) · 17 · 19. (불변식 18 은 여기 없다 — 개념의 테이블이 없다)
create function public.claro_knowledge_evidence_check() returns trigger
language plpgsql set search_path = '' as $$
declare
  p public.reading_plan_log%rowtype;
  r public.probe_response%rowtype;
  x public.probe_exposure%rowtype;
  ctx_plan uuid;
begin
  perform public.claro_shape(new.exposure_context,
    '{"session_id": "uuid", "reading_id": "uuid?", "plan_id": "uuid?"}', 'KnowledgeEvidence.exposure_context');
  if new.content_block_id is not null then
    perform public.claro_shape(new.content_block_id, '{"slide_index": "int", "block_index": "int?"}', 'KnowledgeEvidence.content_block_id');
  end if;
  ctx_plan := (new.exposure_context ->> 'plan_id')::uuid;
  if ctx_plan is not null then
    select * into p from public.reading_plan_log where plan_id = ctx_plan;
    if not found or (p.user_id, p.session_id, p.reading_id, p.article_id, p.article_version)
        is distinct from (new.user_id, (new.exposure_context ->> 'session_id')::uuid,
                          (new.exposure_context ->> 'reading_id')::uuid, new.article_id, new.article_version) then
      raise exception 'EVIDENCE_CONTEXT: 증거의 독자 · 세션 · 열람 · 판이 plan 과 다르다 (불변식 19)';
    end if;
  elsif new.article_id is not null or new.article_version is not null or new.content_block_id is not null then
    raise exception 'EVIDENCE_CONTEXT: plan 이 없는데 기사 판 · 자리를 적었다 (불변식 19)';
  end if;
  if new.evidence_type = 'PROBE_RESPONSE' then
    if new.probe_id is null or new.position is null then
      raise exception 'EVIDENCE_PROBE: PROBE_RESPONSE 인데 probe_id · position 이 없다 (불변식 15)';
    end if;
    select * into r from public.probe_response where interaction_id = new.interaction_id;
    if not found then
      raise exception 'EVIDENCE_NO_RESPONSE: 응답 없는 증거 — 무응답은 증거가 아니다 (불변식 15)';
    end if;
    select * into x from public.probe_exposure where exposure_id = r.exposure_id;
    if new.probe_id <> x.probe_id or new.position <> x.position or new.user_id <> r.user_id then
      raise exception 'EVIDENCE_PROBE: 증거의 물음 · 위치 · 독자가 그 응답의 노출과 다르다 (불변식 15)';
    end if;
    if not exists (select 1 from public.probe pr, jsonb_array_elements(pr.targets) t
                   where pr.probe_id = x.probe_id and pr.version = x.probe_version
                     and t ->> 'concept_id' = new.concept_id::text and (t ->> 'version')::integer = new.content_version) then
      raise exception 'EVIDENCE_TARGETS: 증거의 개념 · 버전이 그 물음의 targets 에 없다 (불변식 16)';
    end if;
    if exists (select 1 from public.knowledge_evidence v
               where v.interaction_id = new.interaction_id and v.concept_id = new.concept_id and v.evidence_type = 'PROBE_RESPONSE') then
      raise exception 'EVIDENCE_TARGETS: 한 응답의 한 target 에 증거 줄이 둘이다 (불변식 16)';
    end if;
  elsif new.evidence_type = 'SELF_REPORT_KNOWN' and new.probe_id is not null then
    raise exception 'EVIDENCE_PROBE: SELF_REPORT_KNOWN 인데 probe_id 가 있다 (불변식 17)';
  end if;
  return new;
end $$;
--> statement-breakpoint
create trigger article_record_check before insert on public.article_record
  for each row execute function public.claro_article_record_check();
--> statement-breakpoint
create trigger reading_plan_log_check before insert on public.reading_plan_log
  for each row execute function public.claro_reading_plan_log_check();
--> statement-breakpoint
create trigger reading_event_check before insert on public.reading_event
  for each row execute function public.claro_reading_event_check();
--> statement-breakpoint
create trigger probe_check before insert on public.probe
  for each row execute function public.claro_probe_check();
--> statement-breakpoint
create trigger probe_exposure_check before insert on public.probe_exposure
  for each row execute function public.claro_probe_exposure_check();
--> statement-breakpoint
create trigger probe_response_check before insert on public.probe_response
  for each row execute function public.claro_probe_response_check();
--> statement-breakpoint
create trigger knowledge_evidence_check before insert on public.knowledge_evidence
  for each row execute function public.claro_knowledge_evidence_check();
--> statement-breakpoint
-- ── 3) 화면이 직접 읽고 쓰지 못하게 (D1 — 기록은 우리 API 만 쓴다). 정책이 없으면 RLS 는 전부 막는다. 테이블 주인(API 가 쓰는 역할)은 RLS 를 안 탄다
alter table public.article_record enable row level security;
--> statement-breakpoint
alter table public.reading_plan_log enable row level security;
--> statement-breakpoint
alter table public.reading_event enable row level security;
--> statement-breakpoint
alter table public.probe enable row level security;
--> statement-breakpoint
alter table public.probe_exposure enable row level security;
--> statement-breakpoint
alter table public.probe_response enable row level security;
--> statement-breakpoint
alter table public.knowledge_evidence enable row level security;
--> statement-breakpoint
alter table identity.reader enable row level security;
--> statement-breakpoint
-- Supabase 는 public 의 새 테이블에 anon · authenticated 권한을 기본으로 준다. 그 역할이 있으면 거둔다 (없는 Postgres 에서는 아무 일도 안 한다)
do $$
declare
  r text;
  t text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      foreach t in array array['article_record', 'reading_plan_log', 'reading_event', 'probe', 'probe_exposure', 'probe_response', 'knowledge_evidence'] loop
        execute format('revoke all on table public.%I from %I', t, r);
      end loop;
      execute format('revoke all on schema identity from %I', r);
      execute format('revoke all on table identity.reader from %I', r);
    end if;
  end loop;
end $$;
