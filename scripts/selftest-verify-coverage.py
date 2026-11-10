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


def m_bad_source(b):        # NOT_EXTRACTED 의 sources 가 이 사건의 Source 가 아님
    sc(b, 'NOT_EXTRACTED')['sources'] = ['00000000-0000-4000-8000-000000000000']


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


def m_sl_owner(b):          # v2 사실이 사건 소유도 가짐
    b['v2']['facts'][0]['event_id'] = b['graph']['event_id']


def m_sl_text(b):           # v2 사실의 글이 원래 그래프 사실과 다름
    b['v2']['facts'][1]['claim_text'] += ' (고침)'


def m_sl_span(b):           # v2 FactSource span 한 글자 밀기
    b['v2']['fact_sources'][0]['span_start'] += 1


def m_rights(b):            # 권리 미확인 문서의 구절 글이 v2 에
    r = copy.deepcopy(b['v2']['fact_sources'][0])
    r['source_id'] = next(iter(b['cache_sources']))
    r['_passage'] = 'some passage'
    b['v2']['fact_sources'].append(r)


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
    ('v2 사실 소유 둘', m_sl_owner, 'CV_STORYLINE'),
    ('v2 사실 글 ≠ 그래프', m_sl_text, 'CV_STORYLINE'),
    ('v2 span 밀기', m_sl_span, 'CV_STORYLINE'),
    ('권리 미확인 구절 글', m_rights, 'CV_RIGHTS'),
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
