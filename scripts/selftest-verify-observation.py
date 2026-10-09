"""verify-observation.py 가 실제로 실패할 수 있는지 — 일부러 망가뜨린 사본으로 확인한다 (B-0.2c).

    python3 scripts/selftest-verify-observation.py

계약 · 로그 · 교정 기록 CSV · 옮긴 파일(jsonl) · 옮긴 교정 기록 · 시험 원장의 사본에 위반을 하나씩 넣고 기대한 code 만 나오는지 본다
(다른 code 가 섞이면 실패). 망가뜨리지 않은 원본은 통과해야 한다. 사본은 전부 메모리 안이다 — 파일로 남기지 않는다.

시험 원장은 가짜 독자 하나다 (독자 기록의 실물이 없다). 검사를 시험하려는 것이지 관찰이 아니다.
"빈틈" 행은 망가뜨렸는데 **못 잡는 것**이 기대값이다 — 계약이 불변식으로 두지 않은 것을 실제로 보인다.
"""
import copy, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vo', os.path.join(ROOT, 'scripts/verify-observation.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

read = lambda p: open(p, encoding='utf-8').read()
CONTRACT, LOG, CSVT, LIBT, DEV = read(V.CONTRACT), read(V.LOG), read(V.CSV_PATH), read(V.LIBRARY), read(V.DEVCONTENT)
JSONLT = read(V.JSONL_PATH)
STORE = json.loads(read(V.STORE))
PINNED = V.load_pinned(V.pinned_rev(CONTRACT))
OTHERS = [read(p) for p in V.OTHERS]
GOLD = json.load(open(V.GOLDEN, encoding='utf-8'))
LIB = V.VC.parse_library(LIBT)
TYPES, ENUMS = V.enums_from(CONTRACT)
ENTRIES = V.load_entries(JSONLT)
LEDGER = V.build_ledger(GOLD, LIB, STORE)


def sub(old, new):
    def f(text):
        assert old in text, f'사본을 만들 수 없다 — 원본에 없는 문자열: {old[:50]!r}'
        return text.replace(old, new, 1)
    return f


def m_(fn):
    def f(o):
        o = copy.deepcopy(o)
        fn(o)
        return o
    return f


def plan(L, lv):
    return next(p for p in L['plans'] if p['level'] == lv)


def ev(L, seq):
    return L['events'][seq]


def fact_repl(e, old='f1', new='f2', published=True):
    e['after_publication'] = published
    e['replacements'].append({'kind': 'FACT', 'old_id': V.UID('fact', old), 'old_version': None,
                              'new_id': V.UID('fact', new), 'new_version': None})


def pre_after_explanation(L):
    # 설명이 있는 장(입문 3장)에 닿은 뒤에 물었는데 PRE 라고 적었다 — 계약은 "견줄 수 있다"고만 했다 (§7.3)
    L['exposures'][0]['position'] = 'PRE'
    for v in L['evidence'][:2]:
        v['position'] = 'PRE'


def switch_is_not_dropout(L):
    # 숙련으로 바꾼 뒤의 사건을 다 지운다 — 입문 4장에서 바꾸고 끝. 그래도 원장은 맞다. 계산이 "바꿨다"를 말한다
    L['events'] = L['events'][:6]


CASES = [
    # ── 계약 ──
    ('§9.4 — KnowledgeEvidence.content_version 삭제', 'contract', sub('  content_version:  integer', '  content_ver:      integer'), {'CONTRACT_FIELD', 'LEDGER_FIELD'}),
    ('§9.4 — ReadingPlanLog.block_decisions 삭제', 'contract', sub('  block_decisions:   BlockDecision[]', '  decisions:         BlockDecision[]'), {'CONTRACT_FIELD', 'LEDGER_FIELD'}),
    ('§9.4 — response 가 어디에도 없다', 'contract', sub('  response:       string', '  answer:         string'), {'CONTRACT_FIELD', 'LEDGER_FIELD'}),
    ('§9.4 — 위치에 값 추가 (MID)', 'contract', sub('Position  = "PRE" | "POST" | "DELAYED"', 'Position  = "PRE" | "MID" | "POST" | "DELAYED"'), {'CONTRACT_ENUM'}),
    ('§9.4 — AUDIT 유형 삭제', 'contract', sub('"DIAGNOSTIC" | "ACTIVE" | "AUDIT" | "COMPREHENSION"', '"DIAGNOSTIC" | "ACTIVE" | "COMPREHENSION"'), {'CONTRACT_ENUM'}),
    ('§9.4 — decision 에 값 추가 (PARTIAL)', 'contract', sub('"SKIP" | "REFRESHER" | "FULL"   // 확정', '"SKIP" | "PARTIAL" | "REFRESHER" | "FULL"   // 확정'), {'CONTRACT_ENUM'}),
    ('§10.3 — 타인 독해 값 삭제', 'contract', sub('"PLAIN_READING" | "OTHER_READER" | ', '"PLAIN_READING" | '), {'CONTRACT_ENUM'}),
    ('증거에 값을 매기는 칸 (score)', 'contract', sub('  model_version:    string | null', '  score:            number\n  model_version:    string | null'), {'CONTRACT_VALUATION'}),
    ('§9.6 — 본문에 보류 항목 낱말', 'contract', sub('**이 타입에는 값을 매기는 칸이 없다.**', '**이 타입에는 가중치 칸이 없다.**'), {'CONTRACT_HELD_TERM'}),
    ('user_concept_state 를 정의', 'contract', sub('ProbeTarget { concept_id: UUID, version: integer }', 'ProbeTarget { concept_id: UUID, version: integer }\nUserConceptState { user_id: UUID, concept_id: UUID }'), {'CONTRACT_FOREIGN_TYPE'}),
    ('다른 계약의 타입을 다시 정의 (ConceptRef)', 'contract', sub('ProbeTarget { concept_id: UUID, version: integer }', 'ConceptRef { concept_id: UUID, version: integer }\nProbeTarget { concept_id: UUID, version: integer }'), {'CONTRACT_FOREIGN_TYPE'}),
    ('독자 기기 칸 (device_id)', 'contract', sub('  session_id:        UUID          // 한 번 앉아서', '  device_id:         string\n  session_id:        UUID          // 한 번 앉아서'), {'CONTRACT_PERSONAL'}),
    ('D26 — 읽기 사건에 방향 값 (SWIPED_UP)', 'contract', sub('"SLIDE_ENTERED" | "LEVEL_SWITCHED" | "CLOSED"', '"SLIDE_ENTERED" | "SWIPED_UP" | "LEVEL_SWITCHED" | "CLOSED"'), {'CONTRACT_DIRECTION', 'CONTRACT_ENUM'}),
    ('D26 — 읽기 사건에 방향 칸 (direction)', 'contract', sub('  slide_index:  integer | null     // SLIDE_ENTERED', '  direction:    string\n  slide_index:  integer | null     // SLIDE_ENTERED'), {'CONTRACT_DIRECTION'}),
    ('D18 — 계획에 놓을 자리 (after_slide)', 'contract', sub('probe_type: ProbeType, position: Position }', 'probe_type: ProbeType, position: Position, after_slide: integer }'), {'CONTRACT_PROBE_PLACEMENT'}),
    ('D18 — 물음에 놓을 자리 (SlideLoc)', 'contract', sub('  prompt:         string', '  home:           SlideLoc\n  prompt:         string'), {'CONTRACT_PROBE_PLACEMENT'}),
    ('Probe 절(§6.1)에서 "실물 없음" 삭제', 'contract', sub('- **실물 없음.** 판을 고치지 않는다.', '- 판을 고치지 않는다.'), {'CONTRACT_NO_REAL'}),
    ('유형 표에 없는 유형 추가', 'contract', sub('"축약 변질" | "레이어 혼입"', '"축약 변질" | "레이어 혼입" | "기타"'), {'CONTRACT_ERROR_TYPES'}),
    ('§8.1 — 실물 열 하나를 표에서 삭제', 'contract', lambda t: '\n'.join(l for l in t.splitlines() if not l.startswith('| `what_was_wrong` |')), {'CONTRACT_CSV_COLUMN'}),
    ('§8.2 — 실물과 다른 행 수', 'contract', sub('| `writing` | 4 |', '| `writing` | 3 |'), {'CONTRACT_REAL_MISMATCH'}),
    ('§8.2 — 어느 행까지의 집계인지 안 적음', 'contract', sub('| 실물 값 | 행 (1~14행) |', '| 실물 값 | 행 |'), {'CONTRACT_SNAPSHOT'}),
    ('§8.3 — 옮긴 파일과 다른 수', 'contract', sub('| 확정 §10.3 | 25 —', '| 확정 §10.3 | 24 —'), {'CONTRACT_REAL_MISMATCH'}),
    ('§4.2 — 골든과 다른 decision (C-0012 입문 FULL)', 'contract', sub('| C-0012 | **SKIP** —', '| C-0012 | **FULL** —'), {'CONTRACT_REAL_MISMATCH'}),
    ('CHANGELOG 행 삭제', 'contract', lambda t: t.replace(' | B-0.2c |', ' | PM |'), {'CONTRACT_CHANGELOG'}),
    ('D30 — DATA_MODEL ArticleRecord 에서 article_version 이 사라짐', 'others', lambda o: [x.replace('  article_version: integer          // D30', '  edition:         integer          // D30') for x in o], {'CONTRACT_PAIR'}),
    # ── 로그 ──
    ('로그 — 질문 3 행 삭제', 'log', lambda t: '\n'.join(l for l in t.splitlines() if not l.startswith('| 3 |')), {'LOG_QUESTION'}),
    ('로그 — 질문 6 표시 삭제', 'log', lambda t: '\n'.join(l.replace('계약 반영', '반영').replace('_open', 'open').replace('미확인', '모름') if l.startswith('| 6 |') else l for l in t.splitlines()), {'LOG_QUESTION'}),
    # ── 교정 기록 CSV (실물) ──
    ('CSV — 열 이름이 바뀜', 'csv', sub('source_of_catch,time_spent_min', 'caught,time_spent_min'), {'CSV_HEADER', 'CONTRACT_CSV_COLUMN'}),
    ('CSV — 행이 늘었다 (아직 안 옮김) — 통과해야 한다. WARN 만', 'csv', lambda t: t + '2026-10-10,FOMC-20260916,새 게이트,압축,x,y,z,\n', set()),
    ('CSV — 옮긴 행의 글자 하나가 바뀜', 'csv', sub('속도계 비유가 C-0002 4단계 없이', '속도계 비유가 C-0002 네 단계 없이'), {'MIGRATION_TEXT'}),
    ('CSV — 마지막 행이 사라짐', 'csv', lambda t: '\n'.join(t.rstrip('\n').split('\n')[:-1]) + '\n', {'MIGRATION_ROWS'}),
    ('CSV — 옛 행(3행)이 사라짐', 'csv', lambda t: t.replace(next(l for l in t.split('\n') if 'FOMC-19' in l) + '\n', ''), {'MIGRATION_ROWS', 'MIGRATION_TEXT', 'CONTRACT_REAL_MISMATCH'}),
    ('옮긴 파일 — catch_note 글자를 고침', 'jsonl', sub('인접 문장과의 모순', '옆 문장과의 모순'), {'MIGRATION_TEXT'}),
    ('옮긴 파일 — 행 순서가 바뀜', 'jsonl', lambda t: '\n'.join(t.split('\n')[1::-1] + t.split('\n')[2:]), {'MIGRATION_TEXT', 'MIGRATION_ROWS'}),
    ('CSV — 9종에 없는 유형', 'csv', sub('FOMC-20260916,writing,압축,', 'FOMC-20260916,writing,문장 어색,'), {'CSV_ERROR_TYPE', 'MIGRATION_TEXT'}),
    # ── 옮긴 교정 기록 (불변식 20 · 21) ──
    ('기계 검사가 잡았는데 check 가 없다', 'corr', m_(lambda E: E[7].update(check=None)), {'CORR_CHECK'}),
    ('사람이 잡았는데 check 가 있다', 'corr', m_(lambda E: E[5].update(check='lint-1')), {'CORR_CHECK'}),
    ('targets 가 비었다', 'corr', m_(lambda E: E[0].update(targets=[])), {'CORR_TARGET'}),
    ('계약에 없는 칸 (severity)', 'corr', m_(lambda E: E[0].update(severity='high')), {'CORR_FIELD'}),
    ('gate 값이 넷 밖 (GATE_5)', 'corr', m_(lambda E: E[5].update(gate='GATE_5')), {'CORR_ENUM'}),
    ('발행 뒤 교정인데 대신한 것이 없다', 'corr', m_(lambda E: E[0].update(after_publication=True)), {'CORR_PUBLISHED'}),
    ('발행 전에 FACT 를 대신했다', 'corr', m_(lambda E: fact_repl(E[0], published=False)), {'REPL_BEFORE_PUBLICATION'}),
    ('발행 뒤 FACT 대신 — 통과해야 한다', 'corr', m_(lambda E: fact_repl(E[0])), set()),
    ('옛 것과 새 것이 같은 FACT', 'corr', m_(lambda E: fact_repl(E[0], 'f1', 'f1')), {'REPL_SHAPE'}),
    ('개념 버전을 낮은 버전으로 대신', 'corr', m_(lambda E: E[7]['replacements'][0].update(new_version=1)), {'REPL_SHAPE'}),
    ('같은 옛 것을 두 번 대신 (C-0010 v1 — 9행에도)', 'corr', m_(lambda E: E[8]['replacements'].append(dict(E[7]['replacements'][0]))), {'REPL_TWICE'}),
    ('대기 표시 없이 old_id 가 비었다', 'corr', m_(lambda E: E[7]['replacements'][0].update(old_id=None, new_id=None)), {'REPL_SHAPE'}),
    ('저장소에 없는 개념을 가리키는 Replacement', 'corr', m_(lambda E: E[7]['replacements'][0].update(old_id=V.UID('concept', 'x'), new_id=V.UID('concept', 'x'))), {'REPL_UNKNOWN'}),
    ('저장소에 없는 버전으로 대신 (C-0010 v9)', 'corr', m_(lambda E: E[7]['replacements'][0].update(new_version=9)), {'REPL_UNKNOWN'}),
    ('§4.2 — 어느 커밋의 골든인지 안 적음', 'contract', lambda t: __import__('re').sub(r'골든 `[0-9a-f]{7,40}`', '골든', t, count=1), {'CONTRACT_SNAPSHOT'}),
    ('옮긴 파일의 `_` 주석 칸 — 통과해야 한다', 'corr', m_(lambda E: E[0].update(_note='x')), set()),
    ('대신하기가 돈다 (f1 → f2 → f1)', 'corr', m_(lambda E: (fact_repl(E[0], 'f1', 'f2'), fact_repl(E[1], 'f2', 'f1'))), {'REPL_CYCLE'}),
    # ── 시험 원장 (불변식 1 ~ 19) ──
    ('증거 줄에 값을 매기는 칸 (weight)', 'ledger', m_(lambda L: L['evidence'][0].update(weight=2)), {'LEDGER_FIELD'}),
    ('plan 에 독자 이름 칸', 'ledger', m_(lambda L: L['plans'][0].update(reader_name='x')), {'LEDGER_FIELD'}),
    ('읽기 사건에 방향 칸', 'ledger', m_(lambda L: ev(L, 1).update(direction='up')), {'LEDGER_FIELD'}),
    ('패키지에 없는 레벨 (intermediate)', 'ledger', m_(lambda L: plan(L, 'advanced').update(level='intermediate')), {'PLAN_LEVEL', 'EVENT_SLIDE'}),
    ('한 열람에 같은 레벨 plan 둘', 'ledger', m_(lambda L: L['plans'].append(dict(plan(L, 'basic'), plan_id=V.UID('plan', 'dup'), level_chosen_by='READER', created_at='2026-10-20T01:30:00Z'))), {'PLAN_DUPLICATE'}),
    ('정적 레벨인데 selected_blocks 를 채움', 'ledger', m_(lambda L: plan(L, 'basic').update(selected_blocks=[])), {'PLAN_STATIC'}),
    ('정적 레벨인데 reason 이 다름', 'ledger', m_(lambda L: plan(L, 'basic')['block_decisions'][0].update(reason='ESTIMATED')), {'PLAN_STATIC'}),
    ('숙련 plan 이 C-0002 를 FULL 로 적음 (패키지는 SKIP)', 'ledger', m_(lambda L: next(d for d in plan(L, 'advanced')['block_decisions'] if L['concepts'][d['concept_id']]['code'] == 'C-0002').update(decision='FULL')), {'PLAN_DECISIONS'}),
    ('SKIP 인 개념을 목록에서 뺌', 'ledger', m_(lambda L: plan(L, 'basic')['block_decisions'].pop()), {'PLAN_DECISIONS'}),
    ('decision 값이 셋 밖 (PARTIAL)', 'ledger', m_(lambda L: plan(L, 'basic')['block_decisions'][0].update(decision='PARTIAL')), {'PLAN_DECISIONS'}),
    ('바꿔서 연 레벨이 DEFAULT', 'ledger', m_(lambda L: plan(L, 'advanced').update(level_chosen_by='DEFAULT')), {'PLAN_DEFAULT'}),
    ('한 열람의 plan 이 다른 판을 가리킴', 'ledger', m_(lambda L: plan(L, 'advanced').update(article_version=2)), {'PLAN_READING'}),
    ('seq 가 건너뜀', 'ledger', m_(lambda L: ev(L, 12).update(seq=20)), {'EVENT_SEQ'}),
    ('레벨에 없는 장 (입문 10장)', 'ledger', m_(lambda L: ev(L, 3).update(slide_index=9)), {'EVENT_SLIDE'}),
    ('SLIDE_ENTERED 에 slide_index 가 없다', 'ledger', m_(lambda L: ev(L, 2).update(slide_index=None)), {'EVENT_SLIDE'}),
    ('전환 없이 다른 레벨의 사건', 'ledger', m_(lambda L: ev(L, 2).update(plan_id=plan(L, 'advanced')['plan_id'])), {'EVENT_CURRENT_PLAN'}),
    ('같은 레벨로 전환', 'ledger', m_(lambda L: ev(L, 4).update(from_plan_id=plan(L, 'advanced')['plan_id'])), {'EVENT_SWITCH'}),
    ('전환 바로 다음이 SLIDE_ENTERED 가 아니다', 'ledger', m_(lambda L: (L['events'].__delitem__(slice(5, 10)), [e.update(seq=i) for i, e in enumerate(L['events'])])), {'EVENT_SWITCH'}),
    ('CLOSED 뒤에 사건', 'ledger', m_(lambda L: L['events'].append(dict(ev(L, 11), event_id=V.UID('rev', 13), seq=13))), {'EVENT_CLOSED'}),
    ('계약에 없는 사건 (SWIPED_UP)', 'ledger', m_(lambda L: ev(L, 2).update(type='SWIPED_UP')), {'EVENT_TYPE'}),
    ('없는 물음 판을 가리키는 노출', 'ledger', m_(lambda L: L['exposures'][2].update(probe_version=2)), {'EXPOSURE_PROBE'}),
    ('유형이 넷 밖 (QUIZ)', 'ledger', m_(lambda L: L['exposures'][2].update(probe_type='QUIZ')), {'EXPOSURE_ENUM'}),
    ('노출의 유형이 계획과 다르다', 'ledger', m_(lambda L: plan(L, 'basic')['probe_plan'].append({'probe_id': L['exposures'][0]['probe_id'], 'probe_version': 1, 'probe_type': 'AUDIT', 'position': 'POST'})), {'EXPOSURE_PLAN'}),
    ('보여주기 전에 답함', 'ledger', m_(lambda L: L['responses'][1].update(responded_at='2026-10-20T01:00:00Z')), {'RESPONSE_EXPOSURE'}),
    ('노출 하나에 응답 둘', 'ledger', m_(lambda L: L['responses'].append(dict(L['responses'][1], interaction_id=V.UID('int', 9)))), {'RESPONSE_TWICE'}),
    ('무응답 노출에서 증거 줄', 'ledger', m_(lambda L: L['evidence'].append(dict(L['evidence'][0], event_id=V.UID('ev', 9), interaction_id=V.UID('int', 9), position='DELAYED'))), {'EVIDENCE_NO_RESPONSE'}),
    ('응답을 지웠는데 증거 줄이 남음', 'ledger', m_(lambda L: L['responses'].pop(0)), {'EVIDENCE_NO_RESPONSE'}),
    ('target 둘인데 증거 줄 하나', 'ledger', m_(lambda L: L['evidence'].pop(1)), {'EVIDENCE_TARGETS'}),
    ('요점 물음의 답에 증거 줄을 붙임 (target 0)', 'ledger', m_(lambda L: L['evidence'].append(dict(L['evidence'][0], event_id=V.UID('ev', 9), interaction_id=L['responses'][1]['interaction_id'], probe_id=L['probes'][1]['probe_id']))), {'EVIDENCE_TARGETS'}),
    ('증거의 위치가 노출과 다름', 'ledger', m_(lambda L: L['evidence'][0].update(position='PRE')), {'EVIDENCE_PROBE', 'EVIDENCE_TARGETS'}),
    ('자기 보고인데 probe_id', 'ledger', m_(lambda L: L['evidence'][2].update(probe_id=L['probes'][0]['probe_id'])), {'EVIDENCE_PROBE'}),
    ('없는 문안 버전 (C-0002 v9)', 'ledger', m_(lambda L: L['evidence'][2].update(content_version=9)), {'EVIDENCE_VERSION'}),
    ('MERGED 개념에 기록', 'ledger', m_(lambda L: L['concepts'][L['evidence'][2]['concept_id']].update(status='MERGED')), {'EVIDENCE_CONCEPT', 'EVIDENCE_TARGETS'}),
    ('leaf 가 아닌 것에 기록', 'ledger', m_(lambda L: L['concepts'][L['evidence'][2]['concept_id']].update(leaf=False)), {'EVIDENCE_CONCEPT', 'EVIDENCE_TARGETS'}),
    ('증거의 판이 plan 과 다름', 'ledger', m_(lambda L: L['evidence'][2].update(article_version=2)), {'EVIDENCE_CONTEXT'}),
    ('plan 없이 기사 자리를 적음', 'ledger', m_(lambda L: L['evidence'][2]['exposure_context'].update(plan_id=None)), {'EVIDENCE_CONTEXT'}),
    # ── 빈틈 · 계산 ──
    ('설명 장에 닿은 뒤인데 PRE 라고 적음', 'ledger', m_(pre_after_explanation), set()),
    ('입문 4장에서 숙련으로 바꾸고 끝 — 원장은 맞다', 'ledger', m_(switch_is_not_dropout), set()),
]


def codes(errs):
    return {c for c, _ in errs}


def run(target, mutate):
    if target == 'others':
        return codes(V.run(CONTRACT, LOG, CSVT, JSONLT, GOLD, LIBT, mutate(OTHERS), DEV, STORE, PINNED)[0])
    if target in ('contract', 'log', 'csv', 'jsonl'):
        c = mutate(CONTRACT) if target == 'contract' else CONTRACT
        l = mutate(LOG) if target == 'log' else LOG
        s = mutate(CSVT) if target == 'csv' else CSVT
        return codes(V.run(c, l, s, mutate(JSONLT) if target == 'jsonl' else JSONLT, GOLD, LIBT, OTHERS, DEV, STORE, PINNED)[0])
    if target == 'corr':
        return codes(V.check_corrections(mutate(ENTRIES), TYPES, ENUMS, STORE))
    return codes(V.check_ledger(mutate(LEDGER), TYPES, ENUMS))


def main():
    fails = 0
    got = run('contract', lambda t: t)
    ok = not got
    fails += not ok
    print(f'{"PASS" if ok else "FAIL"}  원본 (계약 · 로그 · 교정 기록 · 시험 원장) → {sorted(got) or "통과"}')
    for name, target, mutate, want in CASES:
        got = run(target, mutate)
        ok = got == want
        fails += not ok
        tag = '  빈틈' if not want and '빈틈' not in name and '통과해야' not in name and '원장은 맞다' not in name else ''
        print(f'{"PASS" if ok else "FAIL"}  [{target}] {name} → {sorted(got) or "통과"}' + (f'  (기대 {sorted(want)})' if not ok else '') + (tag if ok else ''))
    # 레벨 전환은 이탈이 아니다 — 계산이 그렇게 말하는가 (§5.3)
    L = m_(switch_is_not_dropout)(LEDGER)
    s = V.reading_summary(L, L['plans'][0]['reading_id'])
    ok = s['switched_from'] == ['basic'] and s['stopped_at'] == ('advanced', 0) and s['furthest']['basic'] == 3 and not s['completed']
    fails += not ok
    print(f'{"PASS" if ok else "FAIL"}  [계산] 입문 4장에서 숙련으로 바꾸고 끝 → 멈춘 장 {s["stopped_at"]} · 입문은 "바꿨다"({s["switched_from"]}) · 입문에서 가장 멀리 {s["furthest"]["basic"]}')
    print(f'\n사본 {len(CASES)}개 + 계산 1 · ' + ('OK' if not fails else f'{fails}개 실패'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
