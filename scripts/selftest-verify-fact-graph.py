#!/usr/bin/env python3
"""verify-fact-graph 자체 시험 — 실물 그래프(10월 · 9월 둘)는 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

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


CASES = [
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
