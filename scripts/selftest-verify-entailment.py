#!/usr/bin/env python3
"""verify-entailment 자체 시험 — 실물(packages/pipeline/data/w2)은 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-entailment.py
"""
import copy, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('ven', os.path.join(ROOT, 'scripts/verify-entailment.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

base = V.load()


def case(b, pred):
    return next(c for c in b['cases']['cases'] if pred(c))


def raw_with(b, pred):
    """(줄, 출력) — 출력을 고친 뒤 put() 으로 되넣는다"""
    for lines in b['raws'].values():
        for l in lines:
            if l.get('ok') and l.get('output'):
                j = json.loads(l['output'])
                if pred(l, j):
                    return l, j
    raise AssertionError('그런 출력이 없다')


def put(l, j):
    l['output'] = json.dumps(j, ensure_ascii=False)


def m_span_shift(b):        # 구절의 span 한 글자 밀기
    p = case(b, lambda c: c['passages'][0]['span_start'] is not None)['passages'][0]
    p['span_start'] += 1; p['span_end'] += 1


def m_passage_edit(b):      # 구절 글을 고친다 (원문에 없는 구절로 시험)
    p = case(b, lambda c: c['passages'][0]['span_start'] is not None)['passages'][0]
    p['passage'] = p['passage'].replace(' ', '  ', 1)


def m_no_source(b):         # 없는 문서
    case(b, lambda c: True)['passages'][0]['source_label'] = 'NOPE-00'


def m_dup_id(b):            # id 겹침
    b['cases']['cases'][1]['id'] = b['cases']['cases'][0]['id']


def m_expect(b):            # 맞는 예에 BAD
    case(b, lambda c: c['group'] == 'RIGHT')['expect'] = 'BAD'


def m_corrupt_same_text(b):   # 망가뜨린 글이 바탕과 같다 (틀린 예가 사실은 맞는 예)
    c = case(b, lambda c: c['kind'].startswith('corrupt-'))
    c['fact']['claim_text'] = case(b, lambda x: x['id'] == c['base'])['fact']['claim_text']
    c['changed'] = [c['fact']['claim_text'][:3]]


def m_corrupt_other_passage(b):   # 망가뜨린 글이 바탕과 다른 구절을 단다
    c = case(b, lambda c: c['kind'].startswith('corrupt-'))
    c['passages'] = copy.deepcopy(case(b, lambda x: x['group'] == 'RIGHT' and x['id'] != c['base'])['passages'])


def m_changed_missing(b):   # BAD 인데 넘친 부분이 글에 없다
    case(b, lambda c: c['expect'] == 'BAD')['changed'] = ['이 말은 글에 없다']


def m_changed_in_base(b):   # 넘친 부분이라던 말이 바탕 글에도 있다
    c = case(b, lambda c: c['kind'].startswith('corrupt-'))
    bt = case(b, lambda x: x['id'] == c['base'])['fact']['claim_text']
    common = next(w for w in bt.split() if w in c['fact']['claim_text'])
    c['changed'] = [common]


def m_part_rewritten(b):    # 모델이 part 를 글에 없는 말로 (고쳐 쓰기)
    l, j = raw_with(b, lambda l, j: j['issues'])
    j['issues'][0]['part'] += ' (고친 말)'
    put(l, j)


def m_verdict_mismatch(b):  # issues 가 있는데 ENTAILED
    l, j = raw_with(b, lambda l, j: j['verdict'] == 'EXCEEDS')
    j['verdict'] = 'ENTAILED'
    put(l, j)


def m_raw_enum(b):          # 값 집합 밖 verdict
    l, j = raw_with(b, lambda l, j: True)
    j['verdict'] = 'MOSTLY_FINE'
    put(l, j)


def m_raw_unknown(b):       # 시험 묶음에 없는 예
    next(iter(b['raws'].values()))[0]['case_id'] = 'X-000'


def m_raw_secret(b):        # 키가 출력에 남았다
    next(iter(b['raws'].values()))[0]['error'] = 'sk-ant-api03-XXXX'


def m_report_stale(b):      # 시험 묶음을 바꾸고 보고서를 다시 짓지 않았다
    b['cases_sha'] = '0' * 64


def m_report_count(b):      # 보고서의 잡은 수를 올린다
    b['report']['runs'][0]['summary']['wrong_bad']['caught'] += 1


def m_report_row(b):        # 놓친 것을 잡았다고 적는다
    run = b['report']['runs'][0]
    row = next(r for r in run['rows'] if not r.get('missing') and not r['correct'])
    row['correct'] = True


def m_report_verdict(b):    # 보고서의 판정이 저장한 출력에 없다
    run = b['report']['runs'][0]
    row = next(r for r in run['rows'] if not r.get('missing') and r['verdict'] == 'ENTAILED')
    row['verdict'] = 'EXCEEDS'


MUT = [
    (m_span_shift, 'CASE_SPAN'), (m_passage_edit, 'CASE_SPAN'), (m_no_source, 'CASE_NO_SOURCE'), (m_dup_id, 'CASE_SHAPE'), (m_expect, 'CASE_EXPECT'),
    (m_corrupt_same_text, 'CASE_BASE'), (m_corrupt_other_passage, 'CASE_BASE'), (m_changed_missing, 'CASE_CHANGED'), (m_changed_in_base, 'CASE_CHANGED'),
    (m_part_rewritten, 'RAW_PART'), (m_verdict_mismatch, 'RAW_VERDICT'), (m_raw_enum, 'RAW_SHAPE'), (m_raw_unknown, 'RAW_UNKNOWN_CASE'), (m_raw_secret, 'RAW_SECRET'),
    (m_report_stale, 'REPORT_STALE'), (m_report_count, 'REPORT_COUNT'), (m_report_row, 'REPORT_ROW'), (m_report_verdict, 'REPORT_ROW'),
]

bad = 0
p0 = V.check(base)
print(f"실물: {'통과' if not p0 else '실패 ' + str(p0[:3])}")
bad += bool(p0)
for fn, code in MUT:
    b = copy.deepcopy(base)
    fn(b)
    codes = {c for c, _, _ in V.check(b)}
    ok = code in codes
    print(f"{'ok  ' if ok else 'MISS'} {fn.__name__:26} → {code:18} (나온 것: {' · '.join(sorted(codes)) or '없음'})")
    bad += not ok
print(f'selftest-verify-entailment: 망가뜨린 사본 {len(MUT)} — {"전부 잡았다" if not bad else f"실패 {bad}"}')
sys.exit(1 if bad else 0)
