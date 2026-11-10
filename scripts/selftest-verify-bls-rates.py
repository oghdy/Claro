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
    b['bls']['source_documents'][0]['sha256'] = h          # W-4 — SourceDocument 도 해시 칸을 갖는다
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


# ── W-4 · 계산된 수 (ComputedNumber — DATA_MODEL §6.5 · 불변식 31 ~ 33) · SourceDocument (불변식 29) ─────────────
def comp(b, label='RATE-CPI_ALL_12M-2026M09'):
    return next(c for c in b['rates'][OCT]['computed'] if c['label'] == label)


def gfact(b, fid):
    return next(f for f in b['graph']['facts'] if f['fact_id'] == fid)


def m_c_value(b):           # 계산값 한 자리 바꿈 (3.7 → 3.8)
    c = comp(b)
    c['value'] = c['value'][:-1] + str((int(c['value'][-1]) + 1) % 10)


def m_c_value_both(b):      # 계산값과 계산 기록을 같이 바꿈 — 다시 계산이 잡는다
    m_c_value(b)
    rate(b, OCT, 'RATE-CPI_ALL_12M-2026M09')['value'] = comp(b)['value']


def m_c_fact_gone(b):       # 입력 사실이 그래프에 없다
    comp(b)['inputs'][1]['fact'] = '00000000-0000-4000-8000-000000000000'


def m_c_swap(b):            # to · from 을 바꿈
    c = comp(b)
    c['inputs'][0]['fact'], c['inputs'][1]['fact'] = c['inputs'][1]['fact'], c['inputs'][0]['fact']


def m_c_input_value(b):     # 입력 값을 원문에 없는 수로 (값만 — 계산도 맞춰 둔다)
    c = comp(b)
    c['inputs'][1]['value'] = '324.900'
    c['value'] = V.pct(c['inputs'][0]['value'], '324.900', 1)


def m_c_other_series(b):    # from 을 다른 시리즈의 같은 달 사실로 (계절조정 CPI 2025-09 는 없으니 근원 1년 전 사실)
    c = comp(b)
    other = next(f for f in b['bls']['facts'] if f['_key'] == 'CUUR0000SA0L1E|2025|M09')
    c['inputs'][1]['fact'] = other['fact_id']


def m_c_stable(b):          # 입력은 VOLATILE 인데 결과를 STABLE 로
    c = comp(b)
    c['volatility'], c['as_of'] = 'STABLE', None


def m_c_as_of(b):           # as_of 를 다른 날로
    comp(b)['as_of'] = '2026-10-28'


def m_c_op(b):              # pct 를 level 로 — places · unit 이 op 와 안 맞는다
    comp(b)['op'] = 'level_change_1m'


def m_c_missing(b):         # 계산된 수 하나가 빠짐
    b['rates'][OCT]['computed'].pop()


def m_c_extra_field(b):     # 계약에 없는 칸 (판정을 저장)
    comp(b)['verdict'] = 'OK'


def m_c_in_sep(b):          # 9월 측정 파일에 계산된 수
    b['rates'][SEP]['computed'] = copy.deepcopy(b['rates'][OCT]['computed'])


def m_c_dup_id(b):          # computed_id 겹침
    b['rates'][OCT]['computed'][1]['computed_id'] = b['rates'][OCT]['computed'][0]['computed_id']


def m_doc_sha(b):           # bls.json SourceDocument 의 sha256 한 자리
    d = b['bls']['source_documents'][0]
    d['sha256'] = ('1' if d['sha256'][0] != '1' else '2') + d['sha256'][1:]


def m_doc_time(b):          # 받은 때를 날짜만으로
    b['bls']['source_documents'][0]['fetched_at'] = '2026-11-10'


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
    ('W-4 계산값 한 자리 바꿈', m_c_value, 'BR_COMPUTED_VALUE'),
    ('W-4 계산값 + 계산 기록 같이 바꿈 (다시 계산이 잡는다)', m_c_value_both, 'BR_COMPUTED_VALUE'),
    ('W-4 입력 사실이 그래프에 없다', m_c_fact_gone, 'BR_COMPUTED_INPUT'),
    ('W-4 to · from 바꿈', m_c_swap, 'BR_COMPUTED_INPUT'),
    ('W-4 입력 값이 원문에 없다 (계산은 맞춤)', m_c_input_value, 'BR_COMPUTED_INPUT'),
    ('W-4 두 입력이 다른 계열', m_c_other_series, 'BR_COMPUTED_INPUT'),
    ('W-4 VOLATILE 입력인데 STABLE', m_c_stable, 'BR_COMPUTED_VOLATILE'),
    ('W-4 as_of 다른 날', m_c_as_of, 'BR_COMPUTED_VOLATILE'),
    ('W-4 op 와 places · unit 이 안 맞다', m_c_op, 'BR_COMPUTED_VALUE'),
    ('W-4 계산된 수 하나 빠짐', m_c_missing, 'BR_COMPUTED'),
    ('W-4 계약에 없는 칸', m_c_extra_field, 'BR_COMPUTED'),
    ('W-4 9월 측정 파일에 계산된 수', m_c_in_sep, 'BR_COMPUTED'),
    ('W-4 computed_id 겹침', m_c_dup_id, 'BR_COMPUTED'),
    ('W-4 SourceDocument sha256 한 자리 (불변식 29)', m_doc_sha, 'BR_SOURCE_DOC'),
    ('W-4 SourceDocument 받은 때가 날짜만', m_doc_time, 'BR_SOURCE_DOC'),
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
