#!/usr/bin/env python3
"""P-4 Coverage 점검 · 스토리라인 새 판을 기계로 확인한다.

    python3 scripts/verify-coverage.py            # 10월 사건 (FOMC-20261028)
    python3 scripts/verify-coverage.py --report   # + 슬롯 표 한 줄씩

읽는 것: packages/pipeline/data/events/<code>/p4/coverage.json (p4.ts 가 짓는다) · p3/graph.json · packages/pipeline/coverage-schema.json ·
         p4/raw/*.json (모델 출력) · packages/pipeline/data/storylines/SL-iran-war/v2.json · fixtures/store.json (스토리라인 v1 — 읽기만)
  A. 모양     slot_checks 가 DATA_MODEL §1 SlotCheck 필드 그대로 · status 확정 다섯 · FOUND 면 facts 1 개 이상이고 그래프의 사실 · 나머지는 facts 없음 ·
              NOT_EXTRACTED 의 sources 는 그 사건의 Source · STORYLINE_STALE 이면 storyline (불변식 24) (CV_SHAPE)
  B. 스키마   스키마의 요소마다 SlotCheck 한 줄 · 빈 요소의 상태 = 스키마 if_empty · 슬롯의 채움 / 일부 / 빔 = 요소에서 계산한 것 (CV_SCHEMA · CV_STATE)
  C. 붙임     그래프 사실마다 per_fact 가 있다 · 모델 사실의 요소 = 저장한 모델 출력 (출력 해시 · 사실 글의 해시가 맞는 것) · 표 사실의 요소 = 표 규칙 ·
              요소의 facts = 그 요소가 붙은 사실 전부 (CV_ASSIGN)
  D. 최신     coverage.json 의 graph_sha256 = 지금 그래프 (CV_STALE)
  E. 스토리라인 v2 — Storyline 한 줄 (골든과 같은 id · code) · StorylineVersion 1 부터 빠짐없이 · v1 줄 = 골든 · Storyline.version = 최대 ·
              **사실을 옮겨 적지 않는다 (P-5 · D44 P4-b — 한 사실은 한 곳에)**: v2 에 Fact · FactSource 가 없다 · _fact_refs 가 지금 그래프의 사실을 가리킨다 (fact_id 가 있고 label 이 같다 · 겹치지 않는다) ·
              W-4 — v2 줄의 event_facts (계약 StorylineVersion.event_facts) = _fact_refs 의 fact_id 와 같은 사실 · 같은 순서 · 원소는 사건 소유 사실 (event_id 가 있다) ·
              판들 사이에서 겹치지 않는다 (불변식 34) ·
              _graph_sha256 = 지금 그래프 (CV_STORYLINE)
  F. 권리     권리 미확인 문서(전문이 캐시에만)의 구절 글이 v2 · coverage 에 없다 (CV_RIGHTS)

exit 0 OK · 1 FAIL
"""
import hashlib, json, os, re, sys, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)
CODE = 'FOMC-20261028'
STATUSES = ('FOUND', 'NOT_EXTRACTED', 'SOURCE_UNAVAILABLE', 'NOT_APPLICABLE', 'STORYLINE_STALE')
SLOTCHECK_FIELDS = ['slot', 'status', 'facts', 'sources', 'storyline']
STORYLINE_FIELDS = ['storyline_id', 'code', 'title', 'version', 'ongoing']
VERSION_FIELDS = ['storyline_id', 'version', 'created_at', 'change', 'event_facts']   # event_facts — W-4 P5-b (DATA_MODEL §9.2)
FACT_FIELDS = ['fact_id', 'label', 'claim_text', 'fact_type', 'actor', 'volatility', 'as_of', 'event_at', 'event_id', 'storyline_id', 'storyline_version', 'extraction_model', 'extraction_version']
FS_FIELDS = ['fact_id', 'source_id', 'section', 'span_start', 'span_end']
ASSIGN_VERSION = 'p4-assign/1'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def rj(p):
    return json.load(open(p, encoding='utf-8'))


def is_uuid(x):
    try:
        uuid.UUID(str(x))
        return True
    except ValueError:
        return False


def load(code=CODE):
    d = R('packages/pipeline/data/events', code)
    graph_text = open(os.path.join(d, 'p3/graph.json'), encoding='utf-8').read()
    raws = []
    rawdir = os.path.join(d, 'p4/raw')
    if os.path.isdir(rawdir):
        for n in sorted(os.listdir(rawdir)):
            if n.startswith('assign.') and n.endswith('.json'):
                raws.append(rj(os.path.join(rawdir, n)))
    fetch = rj(os.path.join(d, 'fetch.json'))
    return {
        'code': code, 'coverage': rj(os.path.join(d, 'p4/coverage.json')), 'graph': json.loads(graph_text), 'graph_sha256': sha(graph_text),
        'schema': rj(R('packages/pipeline/coverage-schema.json')), 'raws': raws,
        'sources': {s['label']: s['source_id'] for s in rj(os.path.join(d, 'store.json'))['sources'] + rj(os.path.join(d, 'bls/bls.json'))['sources']},
        'cache_sources': {x['source_id'] for x in fetch['documents'] if x.get('text_in') == 'cache'},
        'golden': rj(R('fixtures/store.json')),
        'v2': rj(R('packages/pipeline/data/storylines/SL-iran-war/v2.json')),
    }


def fact_docs(f):
    if f.get('_from'):
        return list(dict.fromkeys(k.split('#')[0] for k in f['_from']))
    return ['BLS-API-1110'] if f['label'].startswith('BLS-') else []


def is_table(f):
    return bool(f.get('_table')) or f['label'].startswith('BLS-')


def table_elements(schema, f):
    doc = fact_docs(f)[0]
    for r in schema['table_rules']['rules']:
        if r['doc'] == doc and (not r.get('match') or re.search(r['match'], f['claim_text'])):
            return sorted(r['elements'])
    return []


def check(b):
    errs = []
    E = lambda c, m: errs.append((c, m))
    cov, g, schema = b['coverage'], b['graph'], b['schema']
    facts = {f['fact_id']: f for f in g['facts']}
    src_ids = set(b['sources'].values())
    elements = [(s, e) for s in schema['slots'] for e in s['elements']]
    eids = [e['id'] for _, e in elements]

    # D
    if cov.get('graph_sha256') != b['graph_sha256']:
        E('CV_STALE', 'coverage.json 이 지은 그래프와 지금 그래프가 다르다 — p4 를 다시')

    # A
    for i, sc in enumerate(cov.get('slot_checks', [])):
        w = f'slot_checks[{i}]'
        if list(sc.keys()) != SLOTCHECK_FIELDS:
            E('CV_SHAPE', f'{w}: 필드 {list(sc.keys())} ≠ SlotCheck {SLOTCHECK_FIELDS}')
            continue
        if sc['status'] not in STATUSES:
            E('CV_SHAPE', f'{w}: status {sc["status"]} 는 확정 다섯 밖')
        if sc['status'] == 'FOUND':
            if not sc['facts']:
                E('CV_SHAPE', f'{w}: FOUND 인데 facts 가 없다 (불변식 24)')
            for fid in sc['facts']:
                if fid not in facts:
                    E('CV_SHAPE', f'{w}: facts 의 {fid} 가 그래프에 없다')
        elif sc['facts']:
            E('CV_SHAPE', f'{w}: {sc["status"]} 인데 facts 가 있다 (불변식 24)')
        if sc['sources'] and sc['status'] != 'NOT_EXTRACTED':
            E('CV_SHAPE', f'{w}: NOT_EXTRACTED 가 아닌데 sources')
        for s in sc['sources']:
            if s not in src_ids:
                E('CV_SHAPE', f'{w}: sources 의 {s} 가 이 사건의 Source 가 아니다')
        if (sc['status'] == 'STORYLINE_STALE') != (sc['storyline'] is not None):
            E('CV_SHAPE', f'{w}: storyline 은 STORYLINE_STALE 일 때만 · 그때는 반드시')

    # B
    scs = cov.get('slot_checks', [])
    if len(scs) != len(elements):
        E('CV_SCHEMA', f'SlotCheck {len(scs)} 줄 ≠ 스키마 요소 {len(elements)}')
    view = {e['id']: e for s in cov.get('slots', []) for e in s['elements']}
    for k, (s, e) in enumerate(elements):
        sc = scs[k] if k < len(scs) else None
        if not sc or not sc.get('slot', '').startswith(f'{s["name"]} / {e["id"]} '):
            E('CV_SCHEMA', f'{e["id"]}: SlotCheck 줄이 없거나 순서가 다르다')
            continue
        v = view.get(e['id'])
        if not v or v['status'] != sc['status']:
            E('CV_SCHEMA', f'{e["id"]}: 슬롯 표의 상태와 SlotCheck 가 다르다')
        if sc['status'] not in ('FOUND',) and not (sc['status'] == 'STORYLINE_STALE' and e.get('storyline')):
            ie = schema['if_empty'].get(e['id'])
            if not ie or ie['status'] != sc['status']:
                E('CV_SCHEMA', f'{e["id"]}: 빈 요소의 상태 {sc["status"]} 가 스키마 if_empty 와 다르다')
            elif sc['status'] == 'NOT_EXTRACTED' and sorted(sc['sources']) != sorted(b['sources'].get(l) for l in ie.get('sources', [])):
                E('CV_SCHEMA', f'{e["id"]}: NOT_EXTRACTED sources 가 스키마와 다르다')
    for s in cov.get('slots', []):
        st = [e['status'] for e in s['elements']]
        ok = lambda x: x in ('FOUND', 'NOT_APPLICABLE')
        want = '채움' if all(ok(x) for x in st) else '일부' if any(x == 'FOUND' for x in st) else '빔'
        if s['state'] != want:
            E('CV_STATE', f'{s["id"]}: 상태 {s["state"]} ≠ 요소에서 계산한 {want}')

    # C
    per = cov.get('per_fact', {})
    raw_by_fact = {}
    for r in b['raws']:
        if r.get('prompt_version') != ASSIGN_VERSION:
            continue
        if sha(r['output']) != r['output_sha256']:
            E('CV_ASSIGN', f'assign 출력의 해시가 기록과 다르다 ({r["input_sha256"][:12]})')
            continue
        out = {a['key']: a for a in json.loads(r['output'])['assignments']}
        for it in r['items']:
            f = facts.get(it['fact_id'])
            if f and sha(f['claim_text']) == it['claim_sha256'] and it['key'] in out:
                raw_by_fact[it['fact_id']] = sorted(set(x for x in out[it['key']]['elements'] if x in eids))
    for fid, f in facts.items():
        p = per.get(fid)
        if not p:
            E('CV_ASSIGN', f'{f["label"]}: per_fact 가 없다')
            continue
        bad = [x for x in p['elements'] if x not in eids]
        if bad:
            E('CV_ASSIGN', f'{f["label"]}: 스키마에 없는 요소 {bad}')
        want = table_elements(schema, f) if is_table(f) else raw_by_fact.get(fid)
        if want is None:
            E('CV_ASSIGN', f'{f["label"]}: 모델 사실인데 그 글로 저장한 모델 출력이 없다')
            continue
        got = sorted(x for x in p['elements'] if not (x == 'S13.a' and '[코드]' in p['why']))
        if got != sorted(want):
            E('CV_ASSIGN', f'{f["label"]}: per_fact 요소 {got} ≠ {"표 규칙" if is_table(f) else "모델 출력"} {sorted(want)}')
    for sc, (s, e) in zip(scs, elements):
        members = sorted(fid for fid, p in per.items() if e['id'] in p['elements'])
        if sc['status'] == 'FOUND' and sorted(sc['facts']) != members:
            E('CV_ASSIGN', f'{e["id"]}: SlotCheck facts 가 per_fact 에서 그 요소가 붙은 사실과 다르다')
        if sc['status'] != 'FOUND' and members and not (sc['status'] == 'STORYLINE_STALE'):
            E('CV_ASSIGN', f'{e["id"]}: 붙은 사실 {len(members)} 이 있는데 {sc["status"]}')

    # E
    v2, golden = b['v2'], b['golden']
    gsl = next(s for s in golden['storylines'] if s['code'] == 'SL-iran-war')
    rows = v2.get('storylines', [])
    if len(rows) != 1 or [k for k in rows[0] if not k.startswith('_')] != STORYLINE_FIELDS:
        E('CV_STORYLINE', 'storylines 가 Storyline 한 줄 (계약 필드)이 아니다')
    else:
        row = rows[0]
        if row['storyline_id'] != gsl['storyline_id'] or row['code'] != gsl['code']:
            E('CV_STORYLINE', 'Storyline 의 id · code 가 골든과 다르다')
        vers = v2.get('storyline_versions', [])
        if [v['version'] for v in vers] != list(range(1, len(vers) + 1)):
            E('CV_STORYLINE', f'StorylineVersion 이 1 부터 빠짐없이가 아니다 {[v["version"] for v in vers]} (불변식 14)')
        if not vers or row['version'] != vers[-1]['version']:
            E('CV_STORYLINE', 'Storyline.version ≠ 가장 큰 StorylineVersion.version (불변식 14)')
        for v in vers:
            if [k for k in v if not k.startswith('_')] != VERSION_FIELDS or v['storyline_id'] != row['storyline_id']:
                E('CV_STORYLINE', f'StorylineVersion v{v.get("version")} 모양 · id')
        gv1 = [{k: x for k, x in v.items() if not k.startswith('_')} for v in golden['storyline_versions'] if v['storyline_id'] == gsl['storyline_id']]
        if [{k: x for k, x in v.items() if not k.startswith('_')} for v in vers if v['version'] == 1] != gv1:
            E('CV_STORYLINE', 'v1 줄이 골든과 다르다 — 골든의 판은 고치지 않는다')
        if 'facts' in v2 or 'fact_sources' in v2:
            E('CV_STORYLINE', 'v2 에 Fact · FactSource 가 있다 — 그래프의 사실을 옮겨 적지 않고 가리킨다 (D44 P4-b)')
        if v2.get('_graph_sha256') != b['graph_sha256']:
            E('CV_STORYLINE', 'v2 가 가리키는 그래프와 지금 그래프가 다르다 — p4 를 다시')
        refs = v2.get('_fact_refs', [])
        if not refs:
            E('CV_STORYLINE', 'v2 가 가리키는 사실이 없다')
        v2row = next((v for v in vers if v.get('version') == 2), {})
        if v2row.get('event_facts') != [r.get('fact_id') for r in refs]:
            E('CV_STORYLINE', 'v2 줄의 event_facts 가 _fact_refs 의 사실과 다르다 — 계약 칸이 원본이고 _fact_refs 는 그 주석 (W-4 P5-b)')
        all_ef = [x for v in vers for x in v.get('event_facts', [])]
        if len(set(all_ef)) != len(all_ef):
            E('CV_STORYLINE', 'event_facts 가 판들 사이에서 겹친다 (불변식 34)')
        for x in all_ef:
            o = facts.get(x)
            if o and (not o.get('event_id') or o.get('storyline_id')):
                E('CV_STORYLINE', f'event_facts 의 {o["label"]} 는 사건 소유 사실이 아니다 (불변식 34)')
        seen = set()
        for r in refs:
            o = facts.get(r.get('fact_id'))
            if not o:
                E('CV_STORYLINE', f'v2 _fact_refs {r.get("label")}: 그래프에 없는 사실')
                continue
            if o['label'] != r.get('label'):
                E('CV_STORYLINE', f'v2 _fact_refs {r.get("label")}: label 이 그래프({o["label"]})와 다르다')
            if r['fact_id'] in seen:
                E('CV_STORYLINE', f'v2 _fact_refs {r.get("label")}: 두 번')
            seen.add(r['fact_id'])
    # F
    if '_passage' in json.dumps(v2, ensure_ascii=False):
        E('CV_RIGHTS', 'v2 에 구절 글이 있다 — 구절은 그래프에만')
    if '_passage' in json.dumps(cov, ensure_ascii=False):
        E('CV_RIGHTS', 'coverage.json 에 구절 글이 있다 — 구절은 그래프에만')
    return errs


def main():
    print('verify-coverage')
    b = load()
    errs = check(b)
    c = b['coverage']['counts']
    print(f'  {CODE} p4/coverage.json: 슬롯 {c["slots"]} (채움 {c["slots_full"]} · 일부 {c["slots_partial"]} · 빔 {c["slots_empty"]}) · 요소 {c["elements"]} '
          f'(FOUND {c["FOUND"]} · NOT_EXTRACTED {c["NOT_EXTRACTED"]} · SOURCE_UNAVAILABLE {c["SOURCE_UNAVAILABLE"]} · NOT_APPLICABLE {c["NOT_APPLICABLE"]} · STORYLINE_STALE {c["STORYLINE_STALE"]}) · '
          f'사실 {c["facts"]} 중 요소 있음 {c["facts_with_element"]}')
    print(f'  SL-iran-war v2: 가리키는 그래프 사실 {len(b["v2"].get("_fact_refs", []))} · 판 {[v["version"] for v in b["v2"]["storyline_versions"]]}')
    if '--report' in sys.argv:
        for s in b['coverage']['slots']:
            print(f'    {s["id"]} {s["name"]} [{s["state"]}] ' + ' · '.join(f'{e["id"]} {e["status"]} {e["n"]}' for e in s['elements']))
    for cde, m in errs:
        print(f'  ERROR {cde}: {m}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
