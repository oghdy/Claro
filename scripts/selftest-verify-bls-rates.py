#!/usr/bin/env python3
"""verify-bls-rates 자체 시험 — 실물(10월 rates.json · 9월 bls-rates.json)은 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-bls-rates.py
"""
import copy, hashlib, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vbr', os.path.join(ROOT, 'scripts/verify-bls-rates.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

base = V.load()
OCT, SEP = 'FOMC-20261028', 'FOMC-20260916'


def rate(b, code, label):
    return next(x for x in b['rates'][code]['rates'] if x['label'] == label)


def set_index(b, series, year, period, new):
    """응답 글의 지수 한 칸을 바꾼다 (다른 응답을 받은 것처럼 — sha 도 맞춰 둔다. 판 검사가 아니라 값 검사가 잡아야 한다)"""
    text = b['bls']['source_documents'][0]['text']
    d = json.loads(text)
    old = next(x for s in d['Results']['series'] if s['seriesID'] == series for x in s['data'] if x['year'] == year and x['period'] == period)['value']
    blk = V.blocks(text)[series]
    cps = list(text)
    sub = ''.join(cps[blk[0]:blk[1]])
    needle = f'"year":"{year}","period":"{period}"'
    at = sub.index(needle)
    vat = sub.index(f'"value":"{old}"', at)
    sub = sub[:vat] + f'"value":"{new}"' + sub[vat + len(f'"value":"{old}"'):]
    assert len(new) == len(old)  # 글자 수가 같아야 다른 입력의 span 이 그대로다
    text = ''.join(cps[:blk[0]]) + sub + ''.join(cps[blk[1]:])
    b['bls']['source_documents'][0]['text'] = text
    h = hashlib.sha256(text.encode('utf-8')).hexdigest()
    b['bls']['fetch']['text_sha256'] = h
    for code in b['rates']:
        b['rates'][code]['source']['text_sha256'] = h
    return old


def m_index_cell(b):        # 지수 한 칸 (9월 CPI 계절조정 안 함 336.940 → 337.940) — 입력 · 값이 어긋난다
    set_index(b, 'CUUR0000SA0', '2026', 'M09', '337.940')


def m_index_cell_follow(b):  # 지수 한 칸을 바꾸고 입력의 값 · 구절도 따라 고쳤다 — 그래도 저장한 변화율(3.7)은 다시 계산(4.0)과 다르다
    set_index(b, 'CUUR0000SA0', '2026', 'M09', '337.940')
    text = b['bls']['source_documents'][0]['text']
    for i in rate(b, OCT, 'RATE-CPI_ALL_12M-2026M09')['inputs'][:1]:
        i['value'] = '337.940'
        i['passage'] = ''.join(list(text)[i['span_start']:i['span_end']])


def m_value(b):             # 저장한 변화율 손으로
    rate(b, OCT, 'RATE-CPI_CORE_12M-2026M09')['value'] = '2.5'


def m_unrounded(b):         # 반올림 전 값 손으로
    rate(b, OCT, 'RATE-CPI_ALL_1M-2026M09')['unrounded'] = '0.6500'


def m_neg_zero(b):          # "-0.0" (6월 근원 전월 대비 −0.0167)
    rate(b, SEP, 'RATE-CPI_CORE_1M-2026M06')['value'] = '-0.0'


def m_sa_for_12m(b):        # 1년 전 대비를 계절조정 지수로 (BLS 방식 아님)
    for i in rate(b, OCT, 'RATE-CPI_ALL_12M-2026M09')['inputs']:
        i['series'] = 'CUSR0000SA0'


def m_period(b):            # 입력 달이 한 달 밀림
    rate(b, OCT, 'RATE-PAYROLL_1M-2026M09')['inputs'][1]['month'] = '2026-07'


def m_missing_row(b):       # 한 줄 빠짐
    b['rates'][OCT]['rates'].pop(0)


def m_span(b):              # 구절 위치가 다른 칸
    i = rate(b, OCT, 'RATE-CPI_ALL_1M-2026M09')['inputs'][0]
    i['span_start'] += 1


def m_fact(b):              # 입력이 다른 사실을 가리킴
    x = rate(b, OCT, 'RATE-CPI_ALL_1M-2026M09')
    x['inputs'][0]['fact_id'] = rate(b, OCT, 'RATE-CPI_CORE_1M-2026M09')['inputs'][0]['fact_id']


def m_vintage(b):           # 판이 다른 응답
    b['rates'][OCT]['source']['text_sha256'] = '0' * 64


def m_vintage_foot(b):      # 각주(판의 표시)를 지움
    rate(b, OCT, 'RATE-PPI_FD_1M-2026M09')['vintage']['footnotes'] = []


def m_golden_anchor(b):     # 정답 조각이 골든 글에 없다
    b['rates'][SEP]['compare']['rows'][0]['fragment'] = '전월 대비 0.5%'


def m_match_flip(b):        # 다른 것을 같다고
    next(c for c in b['rates'][SEP]['compare']['rows'] if c['match'] is False)['match'] = True


def m_expected(b):          # 정답 값을 계산에 맞춰 고침 (PPI 0.4 → 0.5)
    c = next(c for c in b['rates'][SEP]['compare']['rows'] if c['match'] is False and c['kind'] == 'rate')
    c['expected'] = c['computed']


def m_expected_all(b):      # 정답을 계산에 맞추고 같음 · tally 까지 맞춤 — 조각의 수와 어긋나는 것으로 잡는다
    c = next(c for c in b['rates'][SEP]['compare']['rows'] if c['match'] is False and c['kind'] == 'rate')
    c['expected'], c['match'] = c['computed'], True
    t = b['rates'][SEP]['compare']['tally']
    t['match'] += 1
    t['differ'] -= 1


def m_tally(b):             # 세기 손으로
    b['rates'][SEP]['compare']['tally']['match'] += 1


def m_place(b):             # 계산값을 그래프에 넣음 (계약에 자리가 없다)
    b['graph']['facts'].append({'label': 'RATE-CPI_ALL_12M-2026M09', 'claim_text': 'x'})


CASES = [
    ('지수 한 칸 바꿈', m_index_cell, 'BR_INPUT'),
    ('지수 한 칸 + 입력 따라 고침', m_index_cell_follow, 'BR_VALUE'),
    ('변화율 손으로', m_value, 'BR_VALUE'),
    ('반올림 전 값 손으로', m_unrounded, 'BR_VALUE'),
    ('-0.0', m_neg_zero, 'BR_VALUE'),
    ('1년 전 대비를 계절조정으로', m_sa_for_12m, 'BR_RULE'),
    ('입력 달 밀림', m_period, 'BR_RULE'),
    ('한 줄 빠짐', m_missing_row, 'BR_RULE'),
    ('구절 위치', m_span, 'BR_INPUT'),
    ('다른 사실', m_fact, 'BR_INPUT'),
    ('다른 판', m_vintage, 'BR_VINTAGE'),
    ('각주 지움', m_vintage_foot, 'BR_VINTAGE'),
    ('골든 조각 없음', m_golden_anchor, 'BR_COMPARE'),
    ('다름을 같음으로', m_match_flip, 'BR_COMPARE'),
    ('정답을 계산에 맞춤', m_expected, 'BR_COMPARE'),
    ('정답을 계산에 맞춤 + 같음 · tally 도', m_expected_all, 'BR_COMPARE'),
    ('tally 손으로', m_tally, 'BR_COMPARE'),
    ('그래프에 넣음', m_place, 'BR_PLACE'),
]


def main():
    print('selftest-verify-bls-rates')
    errs, _ = V.check(copy.deepcopy(base))
    bad = 0
    if errs:
        print(f'  FAIL 실물이 통과하지 않는다: {errs[:3]}')
        bad += 1
    else:
        print('  ok   실물 통과')
    for name, mut, want in CASES:
        b = copy.deepcopy(base)
        mut(b)
        errs, _ = V.check(b)
        codes = {c for c, _ in errs}
        ok = want in codes
        bad += not ok
        print(f'  {"ok  " if ok else "FAIL"} {name} → {want}{"" if ok else f" (나온 것 {sorted(codes) or "없음"})"}')
    print(f'\n{len(CASES) + 1 - bad}/{len(CASES) + 1}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
