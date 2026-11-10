#!/usr/bin/env python3
"""verify-coverage 자체 시험 — 실물(10월 coverage.json · SL-iran-war v2)은 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-coverage.py
"""
import copy, importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vcv', os.path.join(ROOT, 'scripts/verify-coverage.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

base = V.load()


def sc(b, status):
    return next(x for x in b['coverage']['slot_checks'] if x['status'] == status)


def view(b, eid):
    return next(e for s in b['coverage']['slots'] for e in s['elements'] if e['id'] == eid)


def model_fact(b):
    return next(f for f in b['graph']['facts'] if not V.is_table(f) and b['coverage']['per_fact'][f['fact_id']]['elements'])


def table_fact(b, doc):
    return next(f for f in b['graph']['facts'] if V.is_table(f) and V.fact_docs(f)[0] == doc)


def m_found_empty(b):       # FOUND 인데 facts 없음
    sc(b, 'FOUND')['facts'] = []


def m_status(b):            # 확정 다섯 밖 (PARTIAL)
    sc(b, 'FOUND')['status'] = 'PARTIAL'


def m_facts_on_empty(b):    # SOURCE_UNAVAILABLE 인데 facts
    sc(b, 'SOURCE_UNAVAILABLE')['facts'] = [b['graph']['facts'][0]['fact_id']]


def m_unknown_fact(b):      # 그래프에 없는 사실
    sc(b, 'FOUND')['facts'].append('00000000-0000-4000-8000-000000000000')


def m_field(b):             # SlotCheck 필드 하나 빠짐
    del b['coverage']['slot_checks'][0]['storyline']


def m_stale_no_ref(b):      # STORYLINE_STALE 인데 storyline 없음
    x = sc(b, 'SOURCE_UNAVAILABLE')
    x['status'] = 'STORYLINE_STALE'


def m_bad_source(b):        # NOT_EXTRACTED 의 sources 가 이 사건의 Source 가 아님 (P-5 뒤 실물에 NOT_EXTRACTED 가 없어 빈 요소 하나를 바꿔 만든다)
    x = sc(b, 'SOURCE_UNAVAILABLE')
    x['status'], x['sources'] = 'NOT_EXTRACTED', ['00000000-0000-4000-8000-000000000000']


def m_missing_element(b):   # 스키마 요소 하나의 SlotCheck 가 없다
    b['coverage']['slot_checks'].pop(3)


def m_if_empty(b):          # 빈 요소의 상태가 스키마와 다르다 (SOURCE_UNAVAILABLE → NOT_APPLICABLE)
    x = sc(b, 'SOURCE_UNAVAILABLE')
    x['status'] = 'NOT_APPLICABLE'
    eid = x['slot'].split(' / ')[1].split(' ')[0]
    view(b, eid)['status'] = 'NOT_APPLICABLE'


def m_state(b):             # 일부인 슬롯을 채움으로
    next(s for s in b['coverage']['slots'] if s['state'] == '일부')['state'] = '채움'


def m_model_assign(b):      # 모델 사실의 요소를 손으로 바꿈
    f = model_fact(b)
    b['coverage']['per_fact'][f['fact_id']]['elements'] = ['S15.b']


def m_table_assign(b):      # 표 사실(국채)을 다른 요소로
    f = table_fact(b, 'TSY')
    b['coverage']['per_fact'][f['fact_id']]['elements'] = ['S10.b']


def m_raw_tamper(b):        # 저장한 모델 출력을 고침 (해시가 안 맞는다)
    b['raws'][0]['output'] = b['raws'][0]['output'].replace('"elements":[', '"elements":["S15.b",', 1) + ' '


def m_graph_changed(b):     # 그래프가 바뀌었는데 coverage 를 다시 짓지 않음
    b['graph_sha256'] = '0' * 64


def m_sl_gap(b):            # 판 번호에 구멍
    b['v2']['storyline_versions'][-1]['version'] = 3
    b['v2']['storylines'][0]['version'] = 3


def m_sl_v1(b):             # 골든 v1 줄을 고침
    b['v2']['storyline_versions'][0]['change'] = '고친 줄'


def m_sl_copy(b):           # v2 가 사실을 옮겨 적음 (P-4 의 모양 — 두 벌)
    b['v2']['facts'] = [dict(b['graph']['facts'][0])]


def m_sl_unknown(b):        # 그래프에 없는 사실을 가리킴
    b['v2']['_fact_refs'][0]['fact_id'] = '00000000-0000-4000-8000-000000000000'


def m_sl_label(b):          # 가리키는 label 이 그래프와 다름
    b['v2']['_fact_refs'][1]['label'] = 'F999'


def m_sl_graph(b):          # 그래프가 바뀌었는데 v2 를 다시 짓지 않음
    b['v2']['_graph_sha256'] = '0' * 64


def m_ef_drift(b):          # W-4 — v2 줄의 event_facts 가 _fact_refs 와 다르다 (하나 뺌)
    b['v2']['storyline_versions'][1]['event_facts'].pop()


def m_ef_v1(b):             # W-4 불변식 34 — 같은 사실을 v1 에도 (판들 사이 겹침 · v1 은 골든과도 달라진다)
    b['v2']['storyline_versions'][0]['event_facts'] = [b['v2']['storyline_versions'][1]['event_facts'][0]]


def m_ef_field(b):          # W-4 — v2 줄에 event_facts 칸이 없다 (P-5 의 모양)
    b['v2']['storyline_versions'][1].pop('event_facts')


def m_rights(b):            # 구절 글이 v2 에
    b['v2']['_fact_refs'][0]['_passage'] = 'some passage'


CASES = [
    ('FOUND 인데 facts 없음', m_found_empty, 'CV_SHAPE'),
    ('확정 다섯 밖 상태', m_status, 'CV_SHAPE'),
    ('빈 요소에 facts', m_facts_on_empty, 'CV_SHAPE'),
    ('그래프에 없는 사실', m_unknown_fact, 'CV_SHAPE'),
    ('SlotCheck 필드 빠짐', m_field, 'CV_SHAPE'),
    ('STORYLINE_STALE 인데 storyline 없음', m_stale_no_ref, 'CV_SHAPE'),
    ('NOT_EXTRACTED sources 가 남의 것', m_bad_source, 'CV_SHAPE'),
    ('스키마 요소 하나 빠짐', m_missing_element, 'CV_SCHEMA'),
    ('빈 요소 상태 ≠ 스키마 if_empty', m_if_empty, 'CV_SCHEMA'),
    ('슬롯 상태 손으로', m_state, 'CV_STATE'),
    ('모델 사실 요소 손으로', m_model_assign, 'CV_ASSIGN'),
    ('표 사실 요소 ≠ 표 규칙', m_table_assign, 'CV_ASSIGN'),
    ('모델 출력 고침', m_raw_tamper, 'CV_ASSIGN'),
    ('그래프가 바뀜', m_graph_changed, 'CV_STALE'),
    ('스토리라인 판 구멍', m_sl_gap, 'CV_STORYLINE'),
    ('골든 v1 줄 고침', m_sl_v1, 'CV_STORYLINE'),
    ('v2 가 사실을 옮겨 적음', m_sl_copy, 'CV_STORYLINE'),
    ('v2 가 없는 사실을 가리킴', m_sl_unknown, 'CV_STORYLINE'),
    ('v2 label ≠ 그래프', m_sl_label, 'CV_STORYLINE'),
    ('v2 가 옛 그래프', m_sl_graph, 'CV_STORYLINE'),
    ('권리 미확인 구절 글', m_rights, 'CV_RIGHTS'),
    ('W-4 event_facts ≠ _fact_refs', m_ef_drift, 'CV_STORYLINE'),
    ('W-4 event_facts 가 판 둘에', m_ef_v1, 'CV_STORYLINE'),
    ('W-4 event_facts 칸 없음', m_ef_field, 'CV_STORYLINE'),
]


def main():
    print('selftest-verify-coverage')
    bad = 0
    errs = V.check(base)
    print(f'  {"PASS" if not errs else "FAIL"}  실물 — 오류 {len(errs)}')
    if errs:
        bad += 1
        for c, m in errs[:5]:
            print(f'        {c}: {m}')
    for name, mut, want in CASES:
        b = copy.deepcopy(base)
        mut(b)
        codes = {c for c, _ in V.check(b)}
        ok = want in codes
        bad += 0 if ok else 1
        print(f'  {"PASS" if ok else "FAIL"}  {name} → {want}{"" if ok else f" (나온 것 {sorted(codes)})"}')
    print(f'\n{len(CASES) + 1 - bad}/{len(CASES) + 1} {"OK" if not bad else "FAIL"}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
