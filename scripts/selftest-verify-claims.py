#!/usr/bin/env python3
"""verify-claims 자체 시험 — 실물(10월 p5/claims.json)은 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-claims.py
"""
import copy, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vcl', os.path.join(ROOT, 'scripts/verify-claims.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

base = V.load()


def c0(b):
    return b['claims']['claims'][0]


def with_outcome(b, o):
    return next((c, k) for c in b['claims']['claims'] for k in c['checks'] if k['outcome'] == o)


def m_basis_unknown(b):     # 그래프에 없는 근거 사실 (해석에 근거 사실 없이 쓰기)
    c0(b)['basis'][0] = '00000000-0000-4000-8000-000000000000'


def m_basis_empty(b):       # 근거 없음
    c0(b)['basis'] = []
    c0(b)['_basis_labels'] = []


def m_check_fact_unknown(b):  # 답의 사실이 그래프에 없다
    c, k = with_outcome(b, 'NOT_REFUTED')
    k['facts'] = ['00000000-0000-4000-8000-000000000000']


def m_notref_nofacts(b):    # NOT_REFUTED 인데 답의 사실이 없다 (9월 DC-A 둘째 답 — 배경 지식에서 온 답)
    c, k = with_outcome(b, 'NOT_REFUTED')
    k['facts'], k['_labels'] = [], []
    k.pop('_after_event_facts', None)
    k.pop('_after_event_only', None)


def m_outcome(b):           # 계약 셋 밖 outcome
    c, k = with_outcome(b, 'SCOPED')
    k['outcome'] = 'PARTIAL'


def m_verdict_stored(b):    # 판정을 저장 (§7.3 — 검사 없는 VALID 가 생긴다)
    c = c0(b)
    items = list(c.items())
    c.clear()
    c.update(items[:7] + [('verdict', 'VALID')] + items[7:])


def m_no_checks(b):         # 반증 기록 없음
    c0(b)['checks'] = []


def m_scoped_unnarrowed(b):  # SCOPED 가 있는데 원래 문장 그대로
    c, _ = with_outcome(b, 'SCOPED')
    c['statement'] = c.pop('_statement_before', c['statement'])


def m_missing(b):           # UNRESOLVED 인데 무엇이 답할지 없음
    for grp in ('claims', 'claims_d5'):
        for c in b['claims'][grp]:
            for k in c['checks']:
                if k['outcome'] == 'UNRESOLVED':
                    k.pop('_missing', None)
                    return
    raise SystemExit('실물에 UNRESOLVED 가 없다 — 사본을 만들 수 없다')


def m_empty_slots(b):       # 빈 반증 슬롯 목록에서 하나를 뺌
    b['claims']['empty_counter_slots'] = b['claims']['empty_counter_slots'][1:]


def m_d5(b):                # 정치 해석이 일반 해석 목록에
    c0(b)['statement'] += ' 백악관은 이에 대해 말하지 않았다.'
    c0(b).setdefault('_statement_before', c0(b)['statement'])


def m_after(b):             # 회의 뒤 사실 표시를 지움
    for grp in ('claims', 'claims_d5'):
        for c in b['claims'][grp]:
            for k in c['checks']:
                if k.get('_after_event_facts'):
                    k.pop('_after_event_facts')
                    k.pop('_after_event_only', None)
                    return
    raise SystemExit('실물에 회의 뒤 사실을 쓴 답이 없다 — 사본을 만들 수 없다')


def m_slot(b):              # 없는 슬롯
    c0(b)['checks'][0]['slot'] = '없는 슬롯 / S99.z 무엇'


def m_stale(b):             # 그래프가 바뀜
    b['graph_sha256'] = '0' * 64


def m_hand_statement(b):    # 해석 문장을 손으로 고침
    c = c0(b)
    if '_statement_before' in c:
        c['_statement_before'] += ' (고침)'
    else:
        c['statement'] += ' (고침)'


def m_hand_answer(b):       # 반증 답을 손으로 고침
    c0(b)['checks'][0]['answer'] += ' (고침)'


def m_raw_tamper(b):        # 저장한 모델 출력을 고침
    n = b['claims']['derive_raw']
    b['raws'][n] = dict(b['raws'][n], output=b['raws'][n]['output'] + ' ')


def m_number(b):            # 해석 문장에 사실에 없는 수
    c = c0(b)
    c['statement'] += ' 시장은 87.5% 를 반영했다.'
    c.setdefault('_statement_before', c['statement'])


def m_label_dup(b):         # label 겹침
    b['claims']['claims'][1]['label'] = c0(b)['label']


CASES = [
    ('그래프에 없는 근거 사실', m_basis_unknown, 'CL_BASIS'),
    ('근거 없음', m_basis_empty, 'CL_BASIS'),
    ('답의 사실이 그래프에 없다', m_check_fact_unknown, 'CL_BASIS'),
    ('NOT_REFUTED 인데 답의 사실 없음', m_notref_nofacts, 'CL_CHECK'),
    ('outcome 셋 밖', m_outcome, 'CL_SHAPE'),
    ('판정을 저장', m_verdict_stored, 'CL_SHAPE'),
    ('반증 기록 없음', m_no_checks, 'CL_CHECK'),
    ('SCOPED 인데 좁히지 않음', m_scoped_unnarrowed, 'CL_CHECK'),
    ('UNRESOLVED 인데 missing 없음', m_missing, 'CL_CHECK'),
    ('빈 반증 슬롯 목록 빠짐', m_empty_slots, 'CL_CHECK'),
    ('정치 해석이 일반 목록에', m_d5, 'CL_D5'),
    ('회의 뒤 사실 표시 지움', m_after, 'CL_AFTER'),
    ('없는 슬롯', m_slot, 'CL_SLOT'),
    ('그래프가 바뀜', m_stale, 'CL_STALE'),
    ('해석 문장 손으로', m_hand_statement, 'CL_RAW'),
    ('반증 답 손으로', m_hand_answer, 'CL_RAW'),
    ('모델 출력 고침', m_raw_tamper, 'CL_RAW'),
    ('label 겹침', m_label_dup, 'CL_SHAPE'),
    ('사실에 없는 수 (9월 "90%" 같은)', m_number, 'CL_NUMBER'),
]


def main():
    print('selftest-verify-claims')
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
