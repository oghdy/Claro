#!/usr/bin/env python3
"""verify-source-pack 자체 시험 — 실물 사건 폴더(FOMC-20261028)는 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-source-pack.py
"""
import copy, importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vsp', os.path.join(ROOT, 'scripts/verify-source-pack.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

CODE = 'FOMC-20261028'
contract = open(V.CONTRACT, encoding='utf-8').read()
p1_store, p1_docs = V.read_json(V.P1_STORE), V.read_json(V.P1_DOCS)
base = V.load_event(os.path.join(V.EVENTS, CODE))


def rec(b, label):
    return next(x for x in b['fetch']['documents'] if x['label'] == label)


def src(b, label):
    return next(x for x in b['store']['sources'] if x['label'] == label)


def item(b, label):
    return next(x for x in b['pack']['items'] if x['label'] == label)


def doc(b, label):
    sid = rec(b, label)['source_id']
    return next(d for d in b['docs']['source_documents'] if d['source_id'] == sid)


def m_hash(b):            # 원문 한 글자 바꾸기
    d = doc(b, 'ST-10')
    d['text'] = d['text'].replace('10 – 2', '11 – 1', 1)


def m_unstorable(b):      # 권리 미확인(클리블랜드 연은) 전문을 공개 저장소 파일에
    x = rec(b, 'SP-HAM-1012')
    b['docs']['source_documents'].append({'source_id': x['source_id'], 'text': 'x'})


def m_cache_into_repo(b):  # 기록이 권리 미확인 문서를 저장소에 둔다고 적는다
    rec(b, 'SP-LOG-1001')['text_in'] = 'store.documents.json'


def m_skip_requested(b):  # 요청하지 않기로 한 BLS 를 요청했다
    rec(b, 'CPI-09')['fetch'] = {'http_status': 403}


def m_evidence(b):        # 공개 시각의 증거 글이 저장한 글에 없다
    item(b, 'TSY-IR-1008')['published_evidence'] = 'October 9, 2026'


def m_published_drift(b):  # Source 의 공개 시각이 목록과 다르다
    src(b, 'BB-10')['published_at'] = '2026-10-15'


def m_p1_row(b):          # P-1 과 같은 문서인데 행이 다르다
    src(b, 'ST-09')['ingested_at'] = '2026-10-30'


def m_p1_doc(b):          # P-1 의 글이라는데 해시가 다르다
    rec(b, 'SEP-09')['text_sha256'] = '0' * 64


def m_unstored_source(b):  # 못 가져온 문서를 Source 행으로
    s = copy.deepcopy(src(b, 'ST-10'))
    s.update(label='CC-1005', source_id='00000000-0000-4000-8000-000000000000')
    b['store']['sources'].append(s)


def m_record_missing(b):   # 목록 항목의 기록이 없다
    b['fetch']['documents'] = [x for x in b['fetch']['documents'] if x['label'] != 'MIN-09']


def m_shape(b):            # Event 에 계약에 없는 칸
    b['store']['events'][0]['extra'] = 1


def m_event_code(b):       # 폴더와 다른 code
    b['store']['events'][0]['code'] = 'FOMC-20261029'


def m_fact(b):             # P-2 에 사실을 넣었다
    b['store']['facts'] = [{'fact_id': 'x'}]


def m_slot(b):             # 목록에 없는 슬롯
    item(b, 'ST-10')['slots'].append('없는 슬롯')


def m_no_why(b):           # 못 가져온 까닭 없음
    rec(b, 'CC-1010')['why'] = None


def m_cache_hash(b):       # 캐시 글이 기록의 해시와 다르다 (이 기계에 캐시가 있을 때만 시험된다)
    if 'SP-WIL-0922' in b['cache']:
        b['cache']['SP-WIL-0922'] += 'x'
    else:
        rec(b, 'SP-WIL-0922')['text_in'] = 'store.documents.json'


def m_secondary(b):        # 1차가 아닌 Source
    src(b, 'BEA-08')['kind'] = 'SECONDARY'


CASES = [
    ('원문 한 글자', m_hash, 'PACK_DOC_HASH'),
    ('권리 미확인 전문을 저장소에', m_unstorable, 'PACK_DOC_NOT_STORABLE'),
    ('기록이 권리 미확인 문서를 저장소에', m_cache_into_repo, 'PACK_DOC_NOT_STORABLE'),
    ('요청하지 않기로 한 BLS 를 요청', m_skip_requested, 'PACK_SKIP_REQUESTED'),
    ('증거 글 없음', m_evidence, 'PACK_PUBLISHED'),
    ('Source 공개 시각 ≠ 목록', m_published_drift, 'PACK_PUBLISHED'),
    ('P-1 행과 다름', m_p1_row, 'PACK_P1_ROW'),
    ('P-1 글 해시 다름', m_p1_doc, 'PACK_P1_DOC'),
    ('못 가져온 문서가 Source', m_unstored_source, 'PACK_SOURCE_UNSTORED'),
    ('기록 없음', m_record_missing, 'PACK_RECORD_MISSING'),
    ('Event 칸 남음', m_shape, 'PACK_SHAPE'),
    ('Event code ≠ 폴더', m_event_code, 'PACK_EVENT'),
    ('사실을 넣음', m_fact, 'PACK_NOT_EMPTY'),
    ('없는 슬롯', m_slot, 'PACK_SLOT'),
    ('까닭 없음', m_no_why, 'PACK_NO_WHY'),
    ('캐시 해시 다름', m_cache_hash, 'PACK_DOC'),
    ('2차 Source', m_secondary, 'PACK_KIND'),
]


def main():
    fails = 0
    errs, warns = V.check(base, contract, p1_store, p1_docs)
    ok = not errs
    print(f'  {"ok  " if ok else "FAIL"} 실물 {CODE} 통과' + ('' if ok else f' — {errs[:3]}'))
    fails += not ok
    for name, mut, want in CASES:
        b = copy.deepcopy(base)
        mut(b)
        errs, _ = V.check(b, contract, p1_store, p1_docs)
        hit = any(c.startswith(want) for c, _ in errs)
        print(f'  {"ok  " if hit else "FAIL"} {name} → {want}' + ('' if hit else f' (나온 것 {[c for c, _ in errs][:4]})'))
        fails += not hit
    print(f'\nselftest-verify-source-pack: 사본 {len(CASES)} · ' + ('OK' if not fails else f'FAIL {fails}'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
