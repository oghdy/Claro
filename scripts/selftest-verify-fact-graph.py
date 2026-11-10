#!/usr/bin/env python3
"""verify-fact-graph 자체 시험 — 실물 그래프(10월 · 9월)는 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.
P-3b: 칸 (FG_CELL · FG_AFTER) · 표와 모델 (FG_TABLE_MODEL) · 수량어 (FG_QUANTIFIER) · 수 (FG_NUMBER) · 묶기 (FG_MERGE) 사본을 더했다.
P-5: 일정 (FG_CELL — fomc_calendar) · 앞 판 출력 (FG_RAW) · label 장부 (FG_LABEL) 사본을 더했다.

    python3 scripts/selftest-verify-fact-graph.py
"""
import copy, importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vfg', os.path.join(ROOT, 'scripts/verify-fact-graph.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

contract = open(V.CONTRACT, encoding='utf-8').read()
BASES = [V.load(code, rel) for code, rel in V.GRAPHS]
base = BASES[0]   # 10월 — BLS · 권리 미확인 문서가 있다


def lab(b, label):
    return next(d for d in b['docs'].values() if d['label'] == label)


def sid(b, label):
    return next(s for s, d in b['docs'].items() if d['label'] == label)


def fs_of(b, src_label, pred=lambda r: True):
    s = sid(b, src_label)
    return next(r for r in b['graph']['fact_sources'] if r['source_id'] == s and pred(r))


def fact(b, pred):
    return next(f for f in b['graph']['facts'] if pred(f))


def m_shift(b):             # span 한 글자 밀기
    r = fs_of(b, 'ST-10')
    r['span_start'] += 1
    r['span_end'] += 1


def m_invented(b):          # 모델이 지어낸 구절 (span 은 그대로)
    r = fs_of(b, 'PC-10')
    r['_passage'] = r['_passage'].replace('the', 'a', 1) + ' indeed'


def m_unknown_source(b):    # 없는 Source
    fs_of(b, 'MIN-09')['source_id'] = '00000000-0000-4000-8000-000000000000'


def m_actor(b):             # OFFICIAL_CLAIM 인데 actor 없음
    fact(b, lambda f: f['fact_type'] == 'OFFICIAL_CLAIM')['actor'] = None


def m_asof(b):              # VOLATILE 인데 as_of 없음
    fact(b, lambda f: f['volatility'] == 'VOLATILE')['as_of'] = None


def m_enum(b):              # 7값 밖의 fact_type
    b['graph']['facts'][0]['fact_type'] = 'HISTORICAL_CONTEXT'


def m_shape(b):             # 계약에 없는 칸
    b['graph']['facts'][0]['confidence'] = 0.9


def m_no_source(b):         # 출처 없는 사실
    fid = b['graph']['facts'][0]['fact_id']
    b['graph']['fact_sources'] = [r for r in b['graph']['fact_sources'] if r['fact_id'] != fid]


def m_timepoint(b):         # 분기 표기 — TimePoint 가 아니다
    b['graph']['facts'][1]['event_at'] = '2026-Q2'


def m_label(b):             # label 겹침
    b['graph']['facts'][1]['label'] = b['graph']['facts'][0]['label']


def m_owner(b):             # 다른 사건의 사실
    b['graph']['facts'][2]['event_id'] = '15661514-6b4a-4da8-8879-47430c6be5a9'


def m_extraction(b):        # 뽑은 모델이 없다
    fact(b, lambda f: f.get('extraction_model'))['extraction_model'] = None


def m_rights(b):            # 권리 미확인(클리블랜드 연은) 구절 글을 저장소 파일에
    r = fs_of(b, 'SP-HAM-1012')
    r['_passage'] = 'x'


def m_raw_sha(b):           # 모델 출력 기록의 sha256 이 그래프와 다르다
    bf = b['graph']['built_from'][0]
    b['raw'][bf['raw']]['output_sha256'] = '0' * 64


def m_raw_text(b):          # 모델 출력 글이 바뀌었다 (sha256 은 그대로)
    bf = b['graph']['built_from'][0]
    b['raw'][bf['raw']]['output'] += ' '


def m_doc_changed(b):       # 원문이 바뀌었다 — 모델이 읽은 글과 다르다
    lab(b, 'ST-10')['sha'] = '0' * 64


def m_bucket(b):            # 구절 없음으로 갈린 것이 그래프에 들어 있다
    f = b['graph']['facts'][0]
    b['graph']['no_passage'].append({'key': f['_from'][0], 'source_label': f['_from'][0].split('#')[0], 'passages': []})


def m_bls_section(b):       # BLS 구절이 다른 시리즈 블록에
    r = fs_of(b, 'BLS-API-1110')
    r['section'] = 'LNS14000000' if r['section'] != 'LNS14000000' else 'CES0000000001'


def m_not_unique(b):        # 짧은 구절 — 글에 여러 번
    r = fs_of(b, 'ST-10')
    t = lab(b, 'ST-10')['text']
    i = t.index('Committee')
    r.update(span_start=i, span_end=i + len('Committee'), _passage='Committee')


def m_counts(b):            # 수가 맞지 않는다
    b['graph']['counts']['verified'] += 1


# ── P-3b ────────────────────────────────────────────────────────────────────────────────────────────
def tsy(b, day='2026-10-28'):
    return fact(b, lambda f: f.get('_table', {}).get('handler') == 'treasury_par_yield' and f['event_at'] == day)


def m_cell_7yr(b):          # P-3 의 오류 그대로 — "10 Yr" 칸에 7 Yr 값 (글 · 주석 모두 4.95)
    f = tsy(b)
    c10 = next(c for c in f['_table']['cells'] if c['col'] == '10 Yr')
    c7 = next(c for c in f['_table']['cells'] if c['col'] == '7 Yr')
    f['claim_text'] = f['claim_text'].replace(f'10 Yr {c10["value"]}', f'10 Yr {c7["value"]}')
    c10['value'] = c7['value']


def m_cell_shift(b):        # 머리 칸 번호를 하나 밀기 (값 · 글은 그대로)
    c = next(c for c in tsy(b)['_table']['cells'] if c['col'] == '10 Yr')
    c['h'] -= 1


def m_cell_claim(b):        # 주석은 맞고 글만 틀림
    f = tsy(b)
    f['claim_text'] = f['claim_text'].replace('10 Yr 5.05', '10 Yr 4.95')


def m_cell_group(b):        # SEP 묶음 머리를 바꿈 (Median → Range)
    f = fact(b, lambda f: f.get('_table', {}).get('handler') == 'sep_table1' and f['_table']['group']['shown'] == 'Median')
    f['_table']['group'].update(index=3, col='Range3', shown='Range')
    f['claim_text'] = f['claim_text'].replace('· Median:', '· Range:')


def m_cell_date(b):         # 표 사실의 날짜가 줄과 다름
    tsy(b, '2026-10-27')['event_at'] = '2026-10-26'


def m_after(b):             # 사건 날 뒤의 줄 (10/29 — 국채 표에 있다)
    f = tsy(b)
    t = lab(b, 'TSY')['text']
    row = next(l for l in t.split('\n') if l.startswith('10/29/2026 |'))
    old = f['_table']['row_line']
    f['_table']['row_line'] = row
    for r in b['graph']['fact_sources']:
        if r['fact_id'] == f['fact_id'] and r.get('_passage') == old:
            i = t.index(row)
            r.update(_passage=row, span_start=i, span_end=i + len(row))
    vals = V.cells(row)
    for c in f['_table']['cells']:
        f['claim_text'] = f['claim_text'].replace(f'{c["shown"]} {c["value"]}', f'{c["shown"]} {vals[c["r"]]}')
        c['value'] = vals[c['r']]
    f['event_at'] = '2026-10-29'


def m_table_model(b):       # 표 문서에 모델 사실 (표 주석을 떼고 모델이 뽑은 것처럼)
    f = tsy(b)
    del f['_table']
    f.update(extraction_model='claude-opus-5-5', extraction_version='p3-extract/2')


def m_input_unmasked(b):    # BEA 를 표를 가리지 않고 모델에 보냈다 (모델이 받은 글의 sha256 = 원문)
    bf = next(x for x in b['graph']['built_from'] if x['source_label'] == 'BEA-08')
    bf['input_sha256'] = lab(b, 'BEA-08')['sha']
    b['raw'][bf['raw']]['input_sha256'] = lab(b, 'BEA-08')['sha']


def q_fact(b):
    return fact(b, lambda f: f['claim_text'].startswith('여러 참가자') and '_table' not in f)


def m_quant_some(b):        # P-3 의 오류 그대로 — several → 일부
    f = q_fact(b)
    f['claim_text'] = f['claim_text'].replace('여러 참가자', '일부 참가자', 1)


def m_quant_drop(b):        # 수량어를 뺐다 — 모두로 읽힌다
    f = q_fact(b)
    f['claim_text'] = f['claim_text'].replace('여러 참가자는', '참가자들은', 1)


def m_quant_banned(b):      # 대응표에 없는 말
    f = q_fact(b)
    f['claim_text'] = f['claim_text'].replace('여러 참가자', '다수의 참가자', 1)


def m_number(b):            # 구절에 없는 수
    f = fact(b, lambda f: f['_from'][0].startswith('ST-10#') and '_table' not in f)
    f['claim_text'] += ' (7.77%)'


def m_year(b):              # 구절에 없는 해를 붙였다
    f = fact(b, lambda f: f['_from'][0].startswith('MIN-09#') and '2019' not in f['claim_text'] and '_table' not in f)
    f['claim_text'] = '2019년 ' + f['claim_text']


def m_merge(b):             # 묶인 사실의 글의 수가 다르다
    f = fact(b, lambda f: f['_from'][0].startswith('ST-10#') and '_table' not in f)
    f['_from'].append('PC-10#0')
    f['_other_texts'] = ['PC-10#0: 위원회는 목표 범위를 3-1/2~3-3/4%로 유지함']


def m_bucket_q(b):          # 수량어 어긋남으로 갈린 것이 그래프에
    f = q_fact(b)
    b['graph']['quantifier_mismatch'].append({'key': f['_from'][0], 'source_label': f['_from'][0].split('#')[0], 'passages': []})


def cal_fact(b, days):
    return next(f for f in b['graph']['facts'] if (f.get('_table') or {}).get('handler') == 'fomc_calendar' and f['_table']['cells'][0]['value'] == days)


def m_cal_star(b):          # 10월 회의에 * 를 붙임 (주석 · 글 모두 — "10월에도 SEP 가 있었다")
    f = cal_fact(b, '27-28')
    f['_table']['cells'][0]['value'] = '27-28*'
    f['claim_text'] = f['claim_text'].replace('27-28 회의: * 표시 없음 (경제 전망 SEP 각주가 붙지 않은 회의)', '27-28* 회의: * 표시 있음')


def m_cal_month(b):         # 12월 날을 다른 달로 (다음 회의를 잘못 적음)
    f = cal_fact(b, '8-9*')
    f['_table']['row_line'] = 'November'
    f['_table']['cells'][0]['col'] = f['_table']['cells'][0]['shown'] = 'November'
    f['claim_text'] = f['claim_text'].replace('December', 'November')


def m_cal_year(b):          # 다른 해의 덩어리
    cal_fact(b, '8-9*')['_table']['header_line'] = '2027 FOMC Meetings'


def m_cal_stable(b):        # 잠정 날짜를 STABLE 로
    f = cal_fact(b, '8-9*')
    f['volatility'], f['as_of'] = 'STABLE', None


def m_compat_after(b):      # 회의 뒤 문서를 앞 판(/2) 출력으로 — 그 갈래가 /2 에 없었다
    bf = next(x for x in b['graph']['built_from'] if x['source_label'] == 'SP-HAM-1105')
    bf['prompt_version'], bf['compat'] = 'p3-extract/2', True
    b['raw'][bf['raw']] = dict(b['raw'][bf['raw']], prompt_version='p3-extract/2')


def m_compat_req(b):        # 앞 판 출력인데 요청 지문이 출력 기록과 다르다
    bf = next(x for x in b['graph']['built_from'] if x.get('compat'))
    bf['request_sha256'] = '0' * 64


def m_extraction_ver(b):    # 모델 사실의 extraction_version 이 그 출력의 판과 다르다
    bf = next(x for x in b['graph']['built_from'] if x.get('compat'))
    f = next(f for f in b['graph']['facts'] if not f.get('_table') and f.get('_from', [''])[0].split('#')[0] == bf['source_label'])
    f['extraction_version'] = 'p3-extract/3'


def m_ledger(b):            # 장부와 다른 label (문서를 더하고 순서대로 다시 붙인 것처럼)
    f = next(f for f in b['graph']['facts'] if f['label'] == 'F564')
    f['label'] = 'F999'


CASES = [
    ('10월 회의에 * (SEP 있음으로)', m_cal_star, 'FG_CELL'),
    ('다음 회의 달을 바꿈', m_cal_month, 'FG_CELL'),
    ('일정 다른 해 덩어리', m_cal_year, 'FG_CELL'),
    ('잠정 일정을 STABLE 로', m_cal_stable, 'FG_CELL'),
    ('회의 뒤 문서를 앞 판 출력으로', m_compat_after, 'FG_RAW'),
    ('앞 판 출력 요청 지문 다름', m_compat_req, 'FG_RAW'),
    ('모델 사실 extraction_version ≠ 출력 판', m_extraction_ver, 'FG_RAW'),
    ('label 이 장부와 다름', m_ledger, 'FG_LABEL'),
    ('span 한 글자 밀기', m_shift, 'FG_PASSAGE'),
    ('지어낸 구절', m_invented, 'FG_PASSAGE'),
    ('없는 Source', m_unknown_source, 'FG_SOURCE_UNKNOWN'),
    ('OFFICIAL_CLAIM actor 없음', m_actor, 'FG_ACTOR'),
    ('VOLATILE as_of 없음', m_asof, 'FG_ASOF'),
    ('7값 밖 fact_type', m_enum, 'FG_ENUM'),
    ('계약에 없는 칸', m_shape, 'FG_SHAPE'),
    ('출처 없는 사실', m_no_source, 'FG_NO_SOURCE'),
    ('분기 표기 event_at', m_timepoint, 'FG_TIMEPOINT'),
    ('label 겹침', m_label, 'FG_ID'),
    ('다른 사건 소유', m_owner, 'FG_OWNER'),
    ('뽑은 모델 없음', m_extraction, 'FG_EXTRACTION'),
    ('권리 미확인 구절 글을 저장소에', m_rights, 'FG_RIGHTS'),
    ('출력 sha256 다름', m_raw_sha, 'FG_RAW'),
    ('출력 글 바뀜', m_raw_text, 'FG_RAW'),
    ('원문 바뀜', m_doc_changed, 'FG_RAW'),
    ('구절 없음이 그래프에', m_bucket, 'FG_BUCKET'),
    ('BLS 다른 시리즈 블록', m_bls_section, 'FG_SPAN'),
    ('구절이 여러 번', m_not_unique, 'FG_PASSAGE_NOT_UNIQUE'),
    ('수 안 맞음', m_counts, 'FG_COUNTS'),
    ('국채 10 Yr 칸에 7 Yr 값 (P-3 오류)', m_cell_7yr, 'FG_CELL'),
    ('머리 칸 번호 밀기', m_cell_shift, 'FG_CELL'),
    ('주석은 맞고 글만 다른 칸', m_cell_claim, 'FG_CELL'),
    ('SEP 묶음 머리 바꿈', m_cell_group, 'FG_CELL'),
    ('표 사실 날짜가 줄과 다름', m_cell_date, 'FG_CELL'),
    ('사건 날 뒤의 표 줄', m_after, 'FG_AFTER'),
    ('표 문서에 모델 사실', m_table_model, 'FG_TABLE_MODEL'),
    ('BEA 표를 가리지 않고 모델에', m_input_unmasked, 'FG_TABLE_MODEL'),
    ('several → 일부 (P-3 오류)', m_quant_some, 'FG_QUANTIFIER'),
    ('수량어 빼기', m_quant_drop, 'FG_QUANTIFIER'),
    ('대응표에 없는 수량어', m_quant_banned, 'FG_QUANTIFIER'),
    ('구절에 없는 수', m_number, 'FG_NUMBER'),
    ('구절에 없는 해', m_year, 'FG_NUMBER'),
    ('묶인 사실의 수가 다름', m_merge, 'FG_MERGE'),
    ('수량어 어긋남이 그래프에', m_bucket_q, 'FG_BUCKET'),
]


def main():
    fails = 0
    for b in BASES:
        errs, warns = V.check(b, contract)
        ok = not errs
        print(f'  {"ok  " if ok else "FAIL"} 실물 {b["code"]} {os.path.basename(b["rel"])} 통과' + ('' if ok else f' — {errs[:3]}'))
        fails += not ok
    for name, mut, want in CASES:
        b = copy.deepcopy(base)
        mut(b)
        errs, _ = V.check(b, contract)
        hit = any(c == want for c, _ in errs)
        print(f'  {"ok  " if hit else "FAIL"} {name} → {want}' + ('' if hit else f' (나온 것 {[c for c, _ in errs][:4]})'))
        fails += not hit
    print(f'\nselftest-verify-fact-graph: 사본 {len(CASES)} · ' + ('OK' if not fails else f'FAIL {fails}'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
