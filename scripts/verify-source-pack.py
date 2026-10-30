#!/usr/bin/env python3
"""사건 소스 팩(P-2)을 기계로 확인한다 — packages/pipeline/data/events/<code>/

    python3 scripts/verify-source-pack.py            # 모든 사건 폴더
    python3 scripts/verify-source-pack.py --report   # + 사건마다 목록 표

한 폴더 = 사건 하나: pack.json (사람이 쓴 목록) · store.json (계약 모양) · store.documents.json (원문) · fetch.json (가져온 기록).
  A. 모양     store.json 의 개체가 DATA_MODEL §1 타입의 필드 그대로다 (verify-data-model 과 같은 파서) · Event 는 하나, code = 폴더 이름 ·
              사실 · 해석 · 요점 · 슬롯 점검은 비어 있다 (P-2 는 수집만 — P-3 이후)
  B. 목록     pack.json 항목마다 기록이 정확히 하나 · 저장한 것만 Source 가 된다 · 슬롯은 목록의 슬롯 이름 · 요청하지 않기로 한 항목(skip)은
              요청 기록이 없다 (D40 — 막힌 곳을 다시 두드리지 않는다) · 막힌 것은 까닭이 있다
  C. 원문     저장한 글의 sha256 · 길이 = 기록 · 권리가 can_store 가 아닌 발행처의 전문은 저장소에 없다 (공개 저장소) ·
              P-1 과 같은 글이면 fixtures/store.documents.json 의 그 글이고 Source 행이 P-1 행과 칸마다 같다 ·
              권리 미확인 원문은 git 밖 캐시 — 이 기계에 없으면 WARN, 해시가 다르면 FAIL
  D. 공개 시각 Source.published_at 은 TimePoint 이고, P-1 과 같은 문서가 아니면 pack.json 의 증거 글이 저장한 글에 그대로 있다 (지어내지 않는다)

exit 0 OK (WARN 은 있을 수 있다) · 1 FAIL
"""
import glob, hashlib, importlib.util, json, os, re, sys, uuid
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVENTS = os.path.join(ROOT, 'packages/pipeline/data/events')
CONTRACT = os.path.join(ROOT, 'docs/contract/DATA_MODEL.md')
P1_STORE = os.path.join(ROOT, 'fixtures/store.json')
P1_DOCS = os.path.join(ROOT, 'fixtures/store.documents.json')
CACHE = os.path.join(ROOT, 'packages/pipeline/.cache/events')
SOURCE_FIELDS = ('source_id', 'label', 'title', 'publisher', 'url', 'kind', 'language', 'published_at', 'ingested_at')
EMPTY_IN_P2 = ('facts', 'fact_sources', 'claims', 'goals', 'bridges', 'slot_checks', 'storylines', 'storyline_versions', 'source_documents')


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VD = _load('vd', 'scripts/verify-data-model.py')     # STORE_TYPES · tp_range · sha256_text · VC.ts_types


def read_json(p, dflt=None):
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else dflt


def load_event(d):
    """폴더 → 검사가 읽는 묶음. 원문 · P-1 원문 · 캐시 글은 따로 넘긴다 (자체 시험이 바꿔 끼운다)"""
    code = os.path.basename(d.rstrip('/'))
    safe = lambda label: re.sub(r'[^\w.-]', '_', label)
    b = {'code': code, 'pack': read_json(os.path.join(d, 'pack.json')), 'store': read_json(os.path.join(d, 'store.json')),
         'docs': read_json(os.path.join(d, 'store.documents.json'), {'source_documents': []}),
         'fetch': read_json(os.path.join(d, 'fetch.json'))}
    b['cache'] = {}
    for x in (b['fetch'] or {}).get('documents', []):
        if x.get('text_in') == 'cache':
            p = os.path.join(CACHE, code, 'text', safe(x['label']) + '.txt')
            if os.path.exists(p):
                b['cache'][x['label']] = open(p, encoding='utf-8').read()
    return b


def check(b, contract_text, p1_store, p1_docs):
    """-> (errs, warns)"""
    errs, warns = [], []
    E = lambda c, m: errs.append((c, m))
    W = lambda c, m: warns.append((c, m))
    code, pack, st, docs, fr = b['code'], b['pack'], b['store'], b['docs'], b['fetch']
    for name, v in (('pack.json', pack), ('store.json', st), ('fetch.json', fr)):
        if v is None:
            E('PACK_FILE_MISSING', f'{code}: {name} 가 없다')
    if errs:
        return errs, warns
    # A. 모양
    types = VD.VC.ts_types(contract_text)

    def shape(o, t, w):
        want, got = set(types.get(t, {})), ({k for k in o if not k.startswith('_')} if isinstance(o, dict) else set())
        if want != got:
            E('PACK_SHAPE', f'{w}: {t} 필드가 계약과 다르다 — 없음 {sorted(want - got)} · 남음 {sorted(got - want)} (DATA_MODEL §1)')
    for key, t in VD.STORE_TYPES.items():
        if not isinstance(st.get(key), list):
            E('PACK_SHAPE', f'{code}: store.json 에 {key} 가 없다')
            continue
        for i, o in enumerate(st[key]):
            shape(o, t, f'{code} {key}[{i}]')
    for key in EMPTY_IN_P2:
        if st.get(key):
            E('PACK_NOT_EMPTY', f'{code}: store.json {key} 가 비어 있지 않다 — P-2 는 수집만 한다 (사실 · 해석은 P-3 이후 · 원문은 store.documents.json)')
    ev = st.get('events', [])
    if len(ev) != 1 or ev[0].get('code') != code or pack.get('event', {}).get('code') != code:
        E('PACK_EVENT', f'{code}: Event 는 하나 · code = 폴더 이름 = pack.json event.code')
    for o in ev:
        try:
            uuid.UUID(o.get('event_id', ''))
        except ValueError:
            E('PACK_EVENT', f'{code}: event_id 가 UUID 가 아니다 (D27)')
        if o.get('occurred_at') is not None and VD.tp_range(o['occurred_at']) is None:
            E('PACK_EVENT', f'{code}: occurred_at 이 TimePoint 가 아니다')
    # B. 목록 ↔ 기록 ↔ Source
    items = {i['label']: i for i in pack.get('items', [])}
    if len(items) != len(pack.get('items', [])):
        E('PACK_LABEL_DUP', f'{code}: pack.json label 이 겹친다')
    slots = set(pack.get('slots', []))
    for it in items.values():
        for s in it.get('slots', []):
            if s not in slots:
                E('PACK_SLOT', f'{code} {it["label"]}: 목록에 없는 슬롯 "{s}"')
        for k in ('title', 'publisher', 'url', 'why', 'url_basis'):
            if not it.get(k):
                E('PACK_ITEM', f'{code} {it["label"]}: {k} 가 없다 — 무엇 · 누가 · 주소 · 왜 · 주소를 어떻게 확인했나')
    for e in pack.get('empty', []):
        if e.get('slot') not in slots:
            E('PACK_SLOT', f'{code}: 빈 슬롯 "{e.get("slot")}" 가 목록의 슬롯이 아니다')
    recs = {}
    for x in fr.get('documents', []):
        if x['label'] in recs:
            E('PACK_RECORD_DUP', f'{code} {x["label"]}: 기록이 두 번')
        recs[x['label']] = x
    for lab in items:
        if lab not in recs:
            E('PACK_RECORD_MISSING', f'{code} {lab}: 가져온 기록이 없다')
    for lab in recs:
        if lab not in items:
            E('PACK_RECORD_UNKNOWN', f'{code} {lab}: 목록에 없는 기록')
    src = {s['label']: s for s in st.get('sources', [])}
    sid = {s['source_id']: s for s in st.get('sources', [])}
    if len(sid) != len(st.get('sources', [])):
        E('PACK_SOURCE_DUP', f'{code}: source_id 가 겹친다')
    reg = {r['source']: r for r in st.get('source_registry', [])}
    p1src = {s['label']: s for s in p1_store.get('sources', [])}
    for lab, x in recs.items():
        it = items.get(lab, {})
        w = f'{code} {lab}'
        if it.get('skip') and (x.get('fetch') is not None or x.get('status') != 'NOT_FETCHED'):
            E('PACK_SKIP_REQUESTED', f'{w}: 요청하지 않기로 한 항목인데 요청 기록이 있다 (D40)')
        if x['status'] == 'NOT_FETCHED':
            if not x.get('why'):
                E('PACK_NO_WHY', f'{w}: 못 가져온 까닭이 없다')
            if lab in src:
                E('PACK_SOURCE_UNSTORED', f'{w}: 저장하지 않은 문서가 Source 행이다 — ingested_at 이 없다')
            continue
        if x['status'] != 'STORED':
            E('PACK_STATUS', f'{w}: status {x["status"]!r}')
            continue
        s = src.get(lab)
        if not s or s['source_id'] != x.get('source_id'):
            E('PACK_SOURCE_MISSING', f'{w}: 저장한 문서의 Source 행이 없다 (또는 source_id 가 기록과 다르다)')
            continue
        if s.get('url') != it.get('url') or s.get('publisher') != it.get('publisher'):
            E('PACK_SOURCE_DRIFT', f'{w}: Source 의 주소 · 발행처가 목록과 다르다')
        if s.get('publisher') not in reg:
            E('PACK_REGISTRY', f'{w}: 발행처 {s.get("publisher")} 의 권리 행이 없다')
        if s.get('kind') != 'PRIMARY':
            E('PACK_KIND', f'{w}: 소스 팩은 1차만 (D27) — kind {s.get("kind")!r}')
        if VD.tp_range(s.get('published_at')) is None or VD.tp_range(s.get('ingested_at')) is None:
            E('PACK_TIMEPOINT', f'{w}: published_at · ingested_at 이 TimePoint 가 아니다')
    for lab in src:
        if lab not in recs:
            E('PACK_SOURCE_UNKNOWN', f'{code} {lab}: 기록 없는 Source')
    # C. 원문
    texts = {}
    by_sid = {x.get('source_id'): x for x in recs.values() if x.get('source_id')}
    for sid_, n in Counter(d['source_id'] for d in docs.get('source_documents', [])).items():
        if n > 1:
            E('PACK_DOC_DUP', f'{code}: SourceDocument {sid_} 가 {n}번')
    for d in docs.get('source_documents', []):
        x = by_sid.get(d['source_id'])
        if x is None or d['source_id'] not in sid:
            E('PACK_DOC_UNKNOWN', f'{code}: 원문 {d["source_id"]} — 기록 · Source 에 없다')
            continue
        w = f'{code} {x["label"]}'
        if reg.get(sid[d['source_id']]['publisher'], {}).get('can_store') is not True:
            E('PACK_DOC_NOT_STORABLE', f'{w}: 발행처가 can_store 가 아니다 — 권리 미확인 전문을 공개 저장소에 두지 않는다')
        if x.get('text_in') != 'store.documents.json':
            E('PACK_DOC_UNRECORDED', f'{w}: 기록은 원문이 {x.get("text_in")} 에 있다고 한다')
        if VD.sha256_text(d['text']) != x.get('text_sha256') or len(d['text']) != x.get('text_length'):
            E('PACK_DOC_HASH', f'{w}: 글의 sha256 · 길이가 기록과 다르다 — 한 번 보관한 원문은 바뀌지 않는다 (§4.1)')
        texts[x['label']] = d['text']
    p1text = {d['source_id']: d['text'] for d in p1_docs.get('source_documents', [])}
    for lab, x in recs.items():
        if x['status'] != 'STORED':
            continue
        w = f'{code} {lab}'
        if x.get('rights') != 'US_FEDERAL_17USC105' and x.get('text_in') != 'cache':
            E('PACK_DOC_NOT_STORABLE', f'{w}: 권리 미확인 문서의 전문은 캐시에만 (text_in {x.get("text_in")!r})')
        if x.get('text_in') == 'store.documents.json' and lab not in texts:
            E('PACK_DOC_MISSING', f'{w}: 기록은 store.documents.json 에 있다고 하는데 없다')
        if x.get('text_in') == 'fixtures/store.documents.json':
            t = p1text.get(x.get('source_id'))
            if t is None or VD.sha256_text(t) != x.get('text_sha256') or not x.get('same_as_p1'):
                E('PACK_P1_DOC', f'{w}: P-1 의 같은 글이라는데 fixtures/store.documents.json 에 그 해시의 글이 없다')
            else:
                texts[lab] = t
            p = p1src.get(x.get('same_as_p1'))
            s = src.get(lab)
            if p is None or s is None or any(p.get(k) != s.get(k) for k in SOURCE_FIELDS):
                E('PACK_P1_ROW', f'{w}: P-1 과 같은 문서인데 Source 행이 P-1 행과 다르다 — 한 Source 를 두 모양으로 두지 않는다')
        if x.get('text_in') == 'cache':
            t = b['cache'].get(lab)
            if t is None:
                W('PACK_TEXT_NOT_HERE', f'{w}: 권리 미확인 원문이 이 기계의 캐시에 없다 (p2 를 돌리면 생긴다)')
            elif VD.sha256_text(t) != x.get('text_sha256'):
                E('PACK_DOC_HASH', f'{w}: 캐시의 글이 기록의 해시와 다르다')
            else:
                texts[lab] = t
    # D. 공개 시각 — 증거 글
    for lab, it in items.items():
        x = recs.get(lab, {})
        if x.get('status') != 'STORED' or x.get('same_as_p1'):
            if x.get('same_as_p1') and it.get('published_at'):
                E('PACK_PUBLISHED', f'{code} {lab}: P-1 과 같은 문서 — published_at 을 목록에 적지 않는다')
            continue
        ev_ = it.get('published_evidence')
        s = src.get(lab, {})
        if not it.get('published_at') or not ev_ or s.get('published_at') != it.get('published_at'):
            E('PACK_PUBLISHED', f'{code} {lab}: published_at 과 증거 글이 목록에 있고 Source 와 같아야 한다')
        elif lab in texts and ev_ not in texts[lab]:
            E('PACK_PUBLISHED', f'{code} {lab}: 증거 글 {ev_[:40]!r} 이 저장한 글에 없다')
    return errs, warns


def report(b):
    recs = {x['label']: x for x in b['fetch']['documents']}
    print(f'\n{b["code"]} — 목록 {len(recs)}')
    for it in b['pack']['items']:
        x = recs.get(it['label'], {})
        st = '저장' if x.get('status') == 'STORED' else '못 가져옴'
        where = x.get('text_in') or ''
        print(f'  {it["label"]:<13} {st:<5} {where:<30} {", ".join(it["slots"])[:60]}')
    have = {s for it in b['pack']['items'] if recs.get(it['label'], {}).get('status') == 'STORED' for s in it['slots']}
    print('  슬롯 — 저장한 문서가 있는 것 ' + str(len(have)) + ' / ' + str(len(b['pack']['slots'])) +
          ('' if have >= set(b['pack']['slots']) else ' · 문서 없음: ' + ', '.join(s for s in b['pack']['slots'] if s not in have)))


def main():
    contract = open(CONTRACT, encoding='utf-8').read()
    p1_store, p1_docs = read_json(P1_STORE, {'sources': []}), read_json(P1_DOCS, {'source_documents': []})
    dirs = sorted(d for d in glob.glob(os.path.join(EVENTS, '*')) if os.path.isdir(d))
    print('verify-source-pack')
    allerr = []
    for d in dirs:
        b = load_event(d)
        errs, warns = check(b, contract, p1_store, p1_docs)
        recs = (b['fetch'] or {}).get('documents', [])
        c = Counter(x['status'] for x in recs)
        tin = Counter(x.get('text_in') for x in recs if x['status'] == 'STORED')
        print(f'  {b["code"]}: 목록 {len(recs)} — 저장 {c["STORED"]} ({", ".join(f"{k} {v}" for k, v in sorted(tin.items()))}) · 못 가져옴 {c["NOT_FETCHED"]} · '
              f'Source {len((b["store"] or {}).get("sources", []))} · Event {len((b["store"] or {}).get("events", []))}')
        if '--report' in sys.argv and not errs:
            report(b)
        for cde, m in warns:
            print(f'  WARN  {cde}: {m}')
        for cde, m in errs:
            print(f'  ERROR {cde}: {m}')
        allerr += errs
    if not dirs:
        print('  사건 폴더 없음')
    print('\nFAIL' if allerr else '\nOK')
    return 1 if allerr else 0


if __name__ == '__main__':
    sys.exit(main())
