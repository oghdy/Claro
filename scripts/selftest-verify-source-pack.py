#!/usr/bin/env python3
"""verify-source-pack 자체 시험 — 실물 사건 폴더(FOMC-20261028 · E2-1 의 KFTC-20261029-DELIVERY-APPS · E3-1 의 PIPC-20261028-SAFETY-MEASURES)는 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

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


def m_unstorable(b):      # 권리 미확인(클리블랜드 연은) 전문을 공개 저장소 파일에 (칸은 다 갖춘 채로)
    x = rec(b, 'SP-HAM-1012')
    b['docs']['source_documents'].append({'source_id': x['source_id'], 'sha256': V.VD.sha256_text('x'), 'fetched_url': x['url'],
                                          'fetched_at': '2026-11-10T00:00:00.000Z', 'extractor': 'p1-extract/1', 'text': 'x'})


def m_doc_sha(b):          # W-4 불변식 29 — SourceDocument.sha256 한 자리
    d = doc(b, 'ST-10')
    d['sha256'] = ('1' if d['sha256'][0] != '1' else '2') + d['sha256'][1:]


def m_doc_url(b):          # W-4 불변식 29 — 받은 주소를 기록과 다르게
    doc(b, 'ST-10')['fetched_url'] = 'https://www.federalreserve.gov/other.htm'


def m_doc_field(b):        # W-4 — SourceDocument 에서 extractor 칸을 뺌
    doc(b, 'ST-10').pop('extractor')


def m_reg_basis(b):        # W-4 불변식 30 — 연방 정부 행의 근거를 지움
    next(r for r in b['store']['source_registry'] if r['can_store'] is True)['basis'] = None


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


# E2-1 — 두 번째 사건 (한국 · 공공누리 · 법령 · hold_text)
CODE2 = 'KFTC-20261029-DELIVERY-APPS'
base2 = V.load_event(os.path.join(V.EVENTS, CODE2))


def m2_held_into_repo(b):  # 제3자 글 때문에 캐시에만 두기로 한 PDF 를 기록이 저장소에 있다고 한다
    rec(b, 'PR-1109-PDF')['text_in'] = 'store.documents.json'


def m2_unconfirmed_into_repo(b):  # 회사 입장문(권리 미확인)을 저장소에
    rec(b, 'CO-CPNG-1109')['text_in'] = 'store.documents.json'


def m2_kogl_lost(b):       # 공공누리 행의 근거를 지움 — 값이 있는데 근거 없음 (불변식 30)
    next(r for r in b['store']['source_registry'] if r['source'] == 'ftc.go.kr')['basis'] = None


def m2_evidence(b):        # 한국어 증거 글 — 보도시점 한 글자
    item(b, 'SL-CD-0618')['published_evidence'] = '보도시점 2026. 6. 19.(목) 12:00'


CASES2 = [
    ('E2-1 hold_text 문서를 저장소에', m2_held_into_repo, 'PACK_DOC_HELD'),
    ('E2-1 회사 입장문을 저장소에', m2_unconfirmed_into_repo, 'PACK_DOC_NOT_STORABLE'),
    ('E2-1 공공누리 행 근거 없음', m2_kogl_lost, 'PACK_REGISTRY'),
    ('E2-1 한국어 증거 글 다름', m2_evidence, 'PACK_PUBLISHED'),
]

# E3-1 — 세 번째 사건 (공공누리 표시가 문서 안에만 있는 발행처 = 권리 미확인 · 법령 판 둘 · 고시)
CODE3 = 'PIPC-20261028-SAFETY-MEASURES'
base3 = V.load_event(os.path.join(V.EVENTS, CODE3))


def m3_pipc_into_repo(b):  # 공공누리가 사이트에 없는 발행처(pipc.go.kr)의 보도자료를 기록이 저장소에 있다고 한다
    rec(b, 'PR-1029-PDF')['text_in'] = 'store.documents.json'


def m3_law_text(b):        # 위반 기간 판 법률의 원문 한 글자 (제64조의2 단서 "다한" → "다 한")
    d = doc(b, 'LAW-PIPA-2024')
    d['text'] = d['text'].replace('조치를 다한 경우', '조치를 다 한 경우', 1)


def m3_evidence(b):        # 본문의 요일 오기를 증거 글로 — 저장한 PDF 머리는 "(목) 11:00" 이 맞고 "(수) 11:00" 은 없다
    item(b, 'PR-1029-PDF')['published_evidence'] = '보도시점 2026.10.29.(수) 11:00'


CASES3 = [
    ('E3-1 개인정보위 보도자료를 저장소에', m3_pipc_into_repo, 'PACK_DOC_NOT_STORABLE'),
    ('E3-1 법령 원문 한 글자', m3_law_text, 'PACK_DOC_HASH'),
    ('E3-1 증거 글 요일 다름', m3_evidence, 'PACK_PUBLISHED'),
]

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
    ('W-4 SourceDocument sha256 한 자리', m_doc_sha, 'PACK_DOC_HASH'),
    ('W-4 SourceDocument 받은 주소 ≠ 기록', m_doc_url, 'PACK_DOC_RECORD'),
    ('W-4 SourceDocument 칸 빠짐', m_doc_field, 'PACK_SHAPE'),
    ('W-4 권리 행 근거 없음', m_reg_basis, 'PACK_REGISTRY'),
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
    errs, _ = V.check(base2, contract, p1_store, p1_docs)
    ok = not errs
    print(f'  {"ok  " if ok else "FAIL"} 실물 {CODE2} 통과' + ('' if ok else f' — {errs[:3]}'))
    fails += not ok
    for name, mut, want in CASES2:
        b = copy.deepcopy(base2)
        mut(b)
        errs, _ = V.check(b, contract, p1_store, p1_docs)
        hit = any(c.startswith(want) for c, _ in errs)
        print(f'  {"ok  " if hit else "FAIL"} {name} → {want}' + ('' if hit else f' (나온 것 {[c for c, _ in errs][:4]})'))
        fails += not hit
    errs, _ = V.check(base3, contract, p1_store, p1_docs)
    ok = not errs
    print(f'  {"ok  " if ok else "FAIL"} 실물 {CODE3} 통과' + ('' if ok else f' — {errs[:3]}'))
    fails += not ok
    for name, mut, want in CASES3:
        b = copy.deepcopy(base3)
        mut(b)
        errs, _ = V.check(b, contract, p1_store, p1_docs)
        hit = any(c.startswith(want) for c, _ in errs)
        print(f'  {"ok  " if hit else "FAIL"} {name} → {want}' + ('' if hit else f' (나온 것 {[c for c, _ in errs][:4]})'))
        fails += not hit
    print(f'\nselftest-verify-source-pack: 사본 {len(CASES) + len(CASES2) + len(CASES3)} · ' + ('OK' if not fails else f'FAIL {fails}'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
