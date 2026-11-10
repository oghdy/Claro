#!/usr/bin/env python3
"""P-3 Deep Fact Graph 초안을 기계로 확인한다 — 구절이 원문에 있다 · 사실 모양이 계약대로다.

    python3 scripts/verify-fact-graph.py            # 그래프 전부 (10월 사건 · 9월 비교용 둘)
    python3 scripts/verify-fact-graph.py --report   # + 그래프마다 수

그래프 = packages/pipeline/src/p3.ts 가 저장한 모델 출력에서 지은 것 (graph*.json). 검사는 그 파일을 원문 · 모델 출력 기록과 댄다.
  A. 모양     facts · fact_sources 가 DATA_MODEL §1 Fact · FactSource 의 필드 그대로 (_ 주석은 뺀다) · fact_type 7값 · volatility 2값 ·
              OFFICIAL_CLAIM · OFFICIAL_LIMIT 은 actor 필수 (§3.4) · VOLATILE 은 as_of 필수 (D8) · as_of · event_at 은 TimePoint ·
              fact_id 는 UUID 이고 겹치지 않는다 · label 이 겹치지 않는다 · 소유 = 그 사건 하나 (§9.3) · 뽑은 모델 · 판이 적혀 있다
  B. 구절     사실마다 FactSource 가 하나 이상 · Source 가 그 사건의 것 · span 이 글 안 · **span 의 글 = 구절** (match-rules.json 규칙) ·
              구절이 글에 한 번만 (section 이 있으면 그 블록 안에서 — BLS 시리즈) · 구절 없음 · 여럿 · 모양 틀림으로 갈린 사실은 그래프에 없다
  C. 출력     그래프가 기댄 모델 출력 파일이 있고 · 출력의 sha256 = 기록 · 그 출력이 읽은 원문의 sha256 = 지금 원문 · 프롬프트 판이 같다
  D. 권리     권리 미확인 문서(전문이 캐시에만)의 구절 글 · 모델 출력 글이 저장소 파일에 없다 (P-1 · D40). 캐시가 이 기계에 없으면 WARN

exit 0 OK (WARN 은 있을 수 있다) · 1 FAIL
"""
import glob, hashlib, importlib.util, json, os, re, sys, uuid
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/DATA_MODEL.md')


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VD = _load('vd', 'scripts/verify-data-model.py')   # canon · tp_range · sha256_text · VC.ts_types
FACT_TYPES = ('OFFICIAL_ACTION', 'OFFICIAL_CLAIM', 'OFFICIAL_LIMIT', 'MEASUREMENT', 'COURT_RULING', 'COMPANY_DISCLOSURE', 'INDEPENDENT_OBSERVATION')
TP = re.compile(r'^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2}))?)?)?$')
R = lambda *p: os.path.join(ROOT, *p)
GRAPHS = [
    ('FOMC-20261028', 'packages/pipeline/data/events/FOMC-20261028/p3/graph.json'),
    ('FOMC-20260916', 'packages/pipeline/data/p3-golden/FOMC-20260916/graph.json'),
    ('FOMC-20260916', 'packages/pipeline/data/p3-golden/FOMC-20260916/graph.claude-opus-5-5.json'),
]
safe = lambda label: re.sub(r'[^\w.-]', '_', label)


def rj(p, dflt=None):
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else dflt


def load(code, rel):
    """그래프 하나 → 검사가 읽는 묶음. docs = source_id → {label, text|None, in_git}"""
    gpath = R(rel)
    b = {'code': code, 'rel': rel, 'graph': rj(gpath), 'docs': {}, 'raw': {}, 'cache_raw': {}, 'cache_passages': None}
    p1 = {d['source_id']: d['text'] for d in rj(R('fixtures/store.documents.json'))['source_documents']}
    if code == 'FOMC-20260916':
        rec = rj(R('packages/pipeline/data/fomc-2026-09.sources.json'))
        for x in rec['documents']:
            if x['status'] == 'STORED':
                b['docs'][x['source_id']] = {'label': x['label'], 'text': p1.get(x['source_id']), 'in_git': True, 'sha': x['text_sha256']}
    else:
        d = R('packages/pipeline/data/events', code)
        own = {x['source_id']: x['text'] for x in rj(os.path.join(d, 'store.documents.json'))['source_documents']}
        for x in rj(os.path.join(d, 'fetch.json'))['documents']:
            if x['status'] != 'STORED':
                continue
            if x['text_in'] == 'cache':
                cp = R('packages/pipeline/.cache/events', code, 'text', safe(x['label']) + '.txt')
                t = open(cp, encoding='utf-8').read() if os.path.exists(cp) else None
            else:
                t = own.get(x['source_id']) if x['text_in'] == 'store.documents.json' else p1.get(x['source_id'])
            b['docs'][x['source_id']] = {'label': x['label'], 'text': t, 'in_git': x['text_in'] != 'cache', 'sha': x['text_sha256']}
        bls = rj(os.path.join(d, 'bls/bls.json'))
        if bls:
            for s, sd in zip(bls['sources'], bls['source_documents']):
                b['docs'][s['source_id']] = {'label': s['label'], 'text': sd['text'], 'in_git': True, 'sha': bls['fetch']['text_sha256']}
    rawdir = os.path.join(os.path.dirname(gpath), 'raw')
    for p in glob.glob(os.path.join(rawdir, '*.json')):
        b['raw'][os.path.basename(p)] = rj(p)
    cdir = R('packages/pipeline/.cache/p3', code)
    for p in glob.glob(os.path.join(cdir, 'raw', '*.json')):
        b['cache_raw'][os.path.basename(p)] = open(p, encoding='utf-8').read()
    model = (b['graph'] or {}).get('model')
    b['cache_passages'] = rj(os.path.join(cdir, f'graph-passages.{model}.json'))
    return b


def blocks(text):
    """BLS 응답 — seriesID 블록의 범위 (코드 포인트)"""
    hits = [(m.group(1), m.start()) for m in re.finditer(r'"seriesID"\s*:\s*"([^"]+)"', text)]
    return {sid: (a, hits[i + 1][1] if i + 1 < len(hits) else len(text)) for i, (sid, a) in enumerate(hits)}


def check(b, contract_text):
    errs, warns = [], []
    E = lambda c, m: errs.append((c, m))
    W = lambda c, m: warns.append((c, m))
    g, code = b['graph'], b['code']
    w0 = f'{code} {os.path.basename(b["rel"])}'
    if g is None:
        E('FG_FILE', f'{w0}: 그래프 파일이 없다')
        return errs, warns
    types = VD.VC.ts_types(contract_text)
    # A. 모양
    want_f, want_fs = set(types['Fact']), set(types['FactSource'])
    ids, labels = Counter(), Counter()
    for f in g['facts']:
        w = f'{w0} {f.get("label")}'
        got = {k for k in f if not k.startswith('_')}
        if got != want_f:
            E('FG_SHAPE', f'{w}: Fact 필드가 계약과 다르다 — 없음 {sorted(want_f - got)} · 남음 {sorted(got - want_f)}')
        if f.get('fact_type') not in FACT_TYPES:
            E('FG_ENUM', f'{w}: fact_type {f.get("fact_type")!r}')
        if f.get('volatility') not in ('STABLE', 'VOLATILE'):
            E('FG_ENUM', f'{w}: volatility {f.get("volatility")!r}')
        if f.get('fact_type') in ('OFFICIAL_CLAIM', 'OFFICIAL_LIMIT') and not f.get('actor'):
            E('FG_ACTOR', f'{w}: {f["fact_type"]} 인데 actor 가 없다 (DATA_MODEL §3.4)')
        if f.get('volatility') == 'VOLATILE' and not f.get('as_of'):
            E('FG_ASOF', f'{w}: VOLATILE 인데 as_of 가 없다 (D8)')
        for k in ('as_of', 'event_at'):
            if f.get(k) is not None and not TP.match(str(f[k])):
                E('FG_TIMEPOINT', f'{w}: {k} {f[k]!r} 가 TimePoint 가 아니다')
        try:
            uuid.UUID(str(f.get('fact_id')))
        except ValueError:
            E('FG_ID', f'{w}: fact_id 가 UUID 가 아니다')
        ids[f.get('fact_id')] += 1
        labels[f.get('label')] += 1
        if f.get('event_id') != g.get('event_id') or f.get('storyline_id') is not None or f.get('storyline_version') is not None:
            E('FG_OWNER', f'{w}: 소유가 이 사건 하나가 아니다 (event_id · storyline_id — §9.3)')
        if not f.get('extraction_version') or (not f.get('extraction_model') and not str(f.get('extraction_version')).startswith('p3-bls')):
            E('FG_EXTRACTION', f'{w}: 뽑은 모델 · 판이 없다 (§5.5 extraction_model · extraction_version)')
    for k, n in ids.items():
        if n > 1:
            E('FG_ID', f'{w0}: fact_id {k} 가 {n}번')
    for k, n in labels.items():
        if n > 1:
            E('FG_ID', f'{w0}: label {k} 가 {n}번')
    # B. 구절
    facts = {f['fact_id']: f for f in g['facts']}
    have_src = Counter()
    cp = (b['cache_passages'] or {}).get('passages', {})
    seen_pi = Counter()
    for i, r in enumerate(g['fact_sources']):
        w = f'{w0} fact_sources[{i}]'
        got = {k for k in r if not k.startswith('_')}
        if got != want_fs:
            E('FG_SHAPE', f'{w}: FactSource 필드가 계약과 다르다 — 없음 {sorted(want_fs - got)} · 남음 {sorted(got - want_fs)}')
        if r.get('fact_id') not in facts:
            E('FG_UNKNOWN', f'{w}: 없는 사실 {r.get("fact_id")}')
            continue
        have_src[r['fact_id']] += 1
        d = b['docs'].get(r.get('source_id'))
        if d is None:
            E('FG_SOURCE_UNKNOWN', f'{w}: 이 사건의 저장된 원문이 아닌 Source {r.get("source_id")}')
            continue
        w = f'{w0} {facts[r["fact_id"]]["label"]} ← {d["label"]}'
        s, e = r.get('span_start'), r.get('span_end')
        if not (isinstance(s, int) and isinstance(e, int)):
            E('FG_SPAN', f'{w}: span 이 정수가 아니다')
            continue
        if not d['in_git'] and '_passage' in r:
            E('FG_RIGHTS', f'{w}: 권리 미확인 문서의 구절 글이 저장소 파일에 있다 — 캐시에만 (P-1 · D40)')
        passage = r.get('_passage')
        if passage is None and not d['in_git']:
            k = r.get('_from', '')
            pi = seen_pi[k]
            seen_pi[k] += 1
            passage = cp.get(f'{k}/{pi}')
        t = d['text']
        if t is None or passage is None:
            W('FG_PASSAGE_NOT_HERE', f'{w}: 원문 또는 구절이 이 기계의 캐시에 없다 — 구절을 대 보지 못했다')
            continue
        if not (0 <= s < e <= len(t)):
            E('FG_SPAN', f'{w}: span {s}–{e} 이 글({len(t)}자) 밖')
            continue
        if VD.canon(t[s:e]) != VD.canon(passage):
            E('FG_PASSAGE', f'{w}: span 의 글이 구절과 다르다 — span {t[s:e][:60]!r} · 구절 {passage[:60]!r}')
            continue
        hay, at = t, 0
        if r.get('section'):
            bl = blocks(t).get(r['section'])
            if bl is None or not (bl[0] <= s and e <= bl[1]):
                E('FG_SPAN', f'{w}: section {r["section"]} 블록 밖의 span')
                continue
            hay, at = t[bl[0]:bl[1]], bl[0]
        n = VD.occurrences(VD.canon(hay), VD.canon(passage))
        if n != 1:
            E('FG_PASSAGE_NOT_UNIQUE', f'{w}: 구절이 {"글" if not r.get("section") else "블록"}에 {n}번 — 위치를 고를 수 없다')
    for fid, f in facts.items():
        if not have_src[fid]:
            E('FG_NO_SOURCE', f'{w0} {f["label"]}: 출처(FactSource)가 없다 — 구절이 확인된 사실만 그래프에 둔다')
    in_graph = {k for f in g['facts'] for k in f.get('_from', [])}
    for bucket in ('no_passage', 'multiple', 'bad_shape'):
        for c in g.get(bucket, []):
            if c['key'] in in_graph:
                E('FG_BUCKET', f'{w0}: {bucket} 의 {c["key"]} 가 그래프 사실에 들어 있다')
            if not b['docs'].get(next((sid for sid, d in b['docs'].items() if d['label'] == c['source_label']), ''), {}).get('in_git', True):
                if any('text' in p for p in c.get('passages', [])):
                    E('FG_RIGHTS', f'{w0}: {bucket} {c["key"]} — 권리 미확인 문서의 구절 글이 저장소 파일에 있다')
    # C. 출력
    by_label = {d['label']: d for d in b['docs'].values()}
    for bf in g.get('built_from', []):
        w = f'{w0} {bf["source_label"]}'
        raw = b['raw'].get(bf['raw'])
        if raw is None:
            E('FG_RAW', f'{w}: 모델 출력 파일 {bf["raw"]} 가 없다')
            continue
        if raw.get('prompt_version') != g.get('prompt_version') or raw.get('output_sha256') != bf.get('output_sha256'):
            E('FG_RAW', f'{w}: 모델 출력 기록이 그래프와 다르다 (프롬프트 판 · 출력 sha256)')
        d = by_label.get(bf['source_label'])
        if d is None or raw.get('text_sha256') != d['sha']:
            E('FG_RAW', f'{w}: 모델이 읽은 원문의 sha256 이 지금 원문과 다르다')
        if raw.get('output_in') == 'here':
            if raw.get('output') is None or VD.sha256_text(raw['output']) != raw.get('output_sha256'):
                E('FG_RAW', f'{w}: 모델 출력 글의 sha256 이 기록과 다르다')
            if d is not None and not d['in_git']:
                E('FG_RIGHTS', f'{w}: 권리 미확인 문서의 모델 출력 글이 저장소 파일에 있다')
        else:
            if raw.get('output') is not None:
                E('FG_RIGHTS', f'{w}: output_in cache 인데 출력 글이 저장소 파일에 있다')
            c = b['cache_raw'].get(bf['raw'])
            if c is None:
                W('FG_RAW_NOT_HERE', f'{w}: 모델 출력이 이 기계의 캐시에 없다')
            elif VD.sha256_text(c) != raw.get('output_sha256'):
                E('FG_RAW', f'{w}: 캐시의 모델 출력이 기록의 sha256 과 다르다')
    cnt = g.get('counts', {})
    if cnt.get('verified', 0) + cnt.get('no_passage', 0) + cnt.get('multiple', 0) + cnt.get('bad_shape', 0) != cnt.get('candidates', -1):
        E('FG_COUNTS', f'{w0}: 후보 수 ≠ 확인됨 + 구절 없음 + 여럿 + 모양 틀림')
    return errs, warns


def main():
    contract = open(CONTRACT, encoding='utf-8').read()
    print('verify-fact-graph')
    allerr = []
    for code, rel in GRAPHS:
        b = load(code, rel)
        errs, warns = check(b, contract)
        g = b['graph'] or {}
        c = g.get('counts', {})
        print(f'  {code} {os.path.basename(rel)}: {g.get("model")} · 사실 {len(g.get("facts", []))} (모델 {c.get("facts_after_merge")} + BLS {c.get("bls_facts")}) · '
              f'FactSource {len(g.get("fact_sources", []))} · 구절 없음 {c.get("no_passage")} · 여럿 {c.get("multiple")} · 모양 틀림 {c.get("bad_shape")}')
        if '--report' in sys.argv and g:
            print('    fact_type ' + ' · '.join(f'{k} {v}' for k, v in Counter(f['fact_type'] for f in g['facts']).most_common()) +
                  ' | volatility ' + ' · '.join(f'{k} {v}' for k, v in Counter(f['volatility'] for f in g['facts']).most_common()))
        for cde, m in warns:
            print(f'  WARN  {cde}: {m}')
        for cde, m in errs:
            print(f'  ERROR {cde}: {m}')
        allerr += errs
    print('\nFAIL' if allerr else '\nOK')
    return 1 if allerr else 0


if __name__ == '__main__':
    sys.exit(main())
