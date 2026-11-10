#!/usr/bin/env python3
"""P-5 해석(Derived Claim) 후보 · 반증 기록을 기계로 확인한다.

    python3 scripts/verify-claims.py            # 10월 사건 (FOMC-20261028)
    python3 scripts/verify-claims.py --report   # + 해석마다 판정 (checks 에서 계산 — 저장하지 않는다)

읽는 것: packages/pipeline/data/events/<code>/p5/claims.json (p5.ts 가 짓는다) · p5/raw/*.json (모델 출력) · p3/graph.json · p4/coverage.json ·
         store.json · bls/bls.json (출처 공개일) · docs/contract/DATA_MODEL.md (DerivedClaim · CounterCheck 필드)
  A. 모양     claims · claims_d5 · dropped 가 DerivedClaim 필드 그대로 (_ 주석은 뺀다) · checks 는 CounterCheck 필드 그대로 · kind 2값 · outcome 3값 (dropped 만 REFUTED) ·
              claim_id UUID 이고 겹치지 않는다 · label 이 겹치지 않는다 · event_id = 그래프의 사건 · **판정을 저장하지 않는다** (§7.3) (CL_SHAPE)
  B. 근거     basis 가 1개 이상 · 전부 그래프의 사실 · _basis_labels 와 같은 사실 · checks 의 facts 도 그래프의 사실 · _labels 와 같은 사실 (CL_BASIS)
  C. 반증     해석마다 checks 1개 이상 · NOT_REFUTED · SCOPED 는 facts 1개 이상 · UNRESOLVED 는 무엇이 답할지(_missing) · SCOPED 가 있으면 statement 가 좁힌 문장 (_statement_before 가 원래 것) ·
              empty_counter_slots = UNRESOLVED 물음 전부 (CL_CHECK)
  D. 출력     claims.json 의 graph_sha256 = 지금 그래프 (CL_STALE) · 모델 출력 파일의 sha256 = 기록 · 해석의 문장 · 종류 · 근거 = 해석 출력 · 물음 · 답 · outcome · 답의 사실 = 반증 출력 ·
              출력이 가리킨 label 이 부를 때의 사실(fact_id · 글 sha256)과 같다 (CL_RAW)
  E. 때       _after_event_facts · _basis_after_event = 가장 이른 출처 공개일이 사건 날짜 뒤인 사실 (D33-b 표시) (CL_AFTER)
  F. 정치     정치 낱말(p5.ts D5_WORDS 와 같은 목록)이 문장 · 물음에 있는 해석은 claims_d5 에 (D44) (CL_D5)
  G. 슬롯     checks 의 slot 은 null 이거나 coverage 의 요소 ("슬롯 이름 / 요소 id 무엇") (CL_SLOT)
  H. 수       statement 의 아라비아 숫자가 근거 · 답의 사실(글 · event_at · as_of)에 있다. "N월" 은 영어 달 이름 · "-NN" 날짜로도 된다 — 해석이 새 수를 만들지 않는다 (CL_NUMBER)
  I. 한 문장  statement 가 한 문장 (P5-e · W-1) — 그 문장을 낸 출력(좁힌 문장이면 반증 · 아니면 해석)의 판이 /2 부터 실패. 앞 판(/1) 은 WARN 으로 센다 (CL_SENTENCE)
              문장 수 규칙은 p5.ts sentenceCount 와 같은 뜻을 여기서 따로 짠다: 마침표 · 물음표 · 느낌표 (뒤 따옴표 · 괄호) 다음 공백이나 끝 · 머리글자("D. Cook" · "U.S.")와
              인용 뒤 조사("'…다.' 고 했다")는 끝이 아니다
  J. 체크포인트 events/<code>/checkpoints.json 의 OPEN 물음 — /2 반증 출력을 썼으면 claims.json checkpoints 에 답이 있고 반증 출력과 같다 · ANSWERED 는 사실 1개 이상 · UNRESOLVED 는 _missing (CL_CHECKPOINT)

exit 0 OK · 1 FAIL
"""
import glob, hashlib, importlib.util, json, os, re, sys, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)
CODE = 'FOMC-20261028'
EVENT_DATE = '2026-10-28'
# 짓기에 쓸 수 있는 판 — p5-prompt.ts DERIVE_VERSION · COUNTER_VERSION (지금) + P5_COMPAT (앞 판). claims.json 의 derive_version · counter_version 이 실제로 쓴 판
DERIVE_VERSIONS, COUNTER_VERSIONS = ('p5-derive/1', 'p5-derive/2'), ('p5-counter/1', 'p5-counter/2')
vno = lambda v: int(str(v).rsplit('/', 1)[-1])
_END = re.compile(r'[.!?。]["\'”’)\]]*(?=\s|$)')


def sentences(text):
    """문장 수 (I) — p5.ts sentenceCount 와 같은 뜻 · 따로 짠 것"""
    t = text.strip()
    if not t:
        return 0
    n = 1
    for m in _END.finditer(t):
        if re.search(r'(^|[\s.(])[A-Z]$', t[max(0, m.start() - 3):m.start()]):
            continue
        rest = t[m.end():]
        if re.match(r'\s*(?:이라고|라고|라며|이라는|라는|고|며|는|란)(?=[\s,.]|$)', rest):   # 인용 안의 마침표 — "'…필요하다.' 고 했다"
            continue
        if rest.strip():
            n += 1
    return n
D5_WORDS = ["정치", "백악관", "대통령", "Trump", "트럼프", "청문", "독립성", "의장 교체", "의장이 바뀌", "취임", "Powell", "중간선거", "선거", "정치적 압력"]
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

spec = importlib.util.spec_from_file_location('vd', R('scripts/verify-data-model.py'))
VD = importlib.util.module_from_spec(spec)
spec.loader.exec_module(VD)
TYPES = VD.VC.ts_types(open(R('docs/contract/DATA_MODEL.md'), encoding='utf-8').read())


def rj(p):
    return json.load(open(p, encoding='utf-8'))


def load(code=CODE):
    d = R('packages/pipeline/data/events', code)
    gt = open(os.path.join(d, 'p3/graph.json'), encoding='utf-8').read()
    raws = {}
    for p in glob.glob(os.path.join(d, 'p5/raw/*.json')):
        raws[os.path.basename(p)[:-5]] = rj(p)
    srcs = {s['source_id']: s for s in rj(os.path.join(d, 'store.json'))['sources'] + rj(os.path.join(d, 'bls/bls.json'))['sources']}
    cpp = os.path.join(d, 'checkpoints.json')
    return {'claims': rj(os.path.join(d, 'p5/claims.json')), 'graph': json.loads(gt), 'graph_sha256': sha(gt), 'raws': raws,
            'checkpoints': rj(cpp)['checkpoints'] if os.path.exists(cpp) else [], 'warn': [],
            'coverage': rj(os.path.join(d, 'p4/coverage.json')), 'sources': srcs}


def verdict(kind, outs):
    if not outs:
        return '검사 안 됨'
    if 'REFUTED' in outs:
        return '반증됨 (계약 밖)'
    if kind == 'DEFENSIVE' and all(o == 'UNRESOLVED' for o in outs):
        return '방어용'
    if 'UNRESOLVED' in outs:
        return '계약 표 밖 (DEFENSIVE + UNRESOLVED 와 다른 outcome — _open P5-c)' if kind == 'DEFENSIVE' else '검사 안 됨'
    return 'VALID' if all(o == 'NOT_REFUTED' for o in outs) else 'VALID WITH SCOPE'


def claim_sha(statement, kind, basis):
    return sha(json.dumps([statement, kind, basis], ensure_ascii=False, separators=(',', ':')))


def check(b):
    errs = []
    E = lambda c, m: errs.append((c, m))
    cj, g = b['claims'], b['graph']
    facts = {f['fact_id']: f for f in g['facts']}
    by_label = {f['label']: f for f in g['facts']}
    first = {}
    for r in g['fact_sources']:
        day = str(b['sources'][r['source_id']]['published_at'])[:10]
        first[r['fact_id']] = min(first.get(r['fact_id'], day), day)
    after = lambda fid: first.get(fid, '') > EVENT_DATE
    want_c, want_k = list(TYPES['DerivedClaim']), list(TYPES['CounterCheck'])
    slots = {f'{s["name"]} / {e["id"]} {e["what"]}' for s in b['coverage']['slots'] for e in s['elements']}

    # D — 최신
    if cj.get('graph_sha256') != b['graph_sha256']:
        E('CL_STALE', 'claims.json 이 지은 그래프와 지금 그래프가 다르다 — p5 를 다시')

    rows = [('claims', c) for c in cj.get('claims', [])] + [('claims_d5', c) for c in cj.get('claims_d5', [])] + [('dropped', c) for c in cj.get('dropped', [])]
    ids, labels = set(), set()
    unresolved = []
    for grp, c in rows:
        w = f'{grp} {c.get("label")}'
        # A
        if [k for k in c if not k.startswith('_')] != want_c:
            E('CL_SHAPE', f'{w}: DerivedClaim 필드가 계약과 다르다 — {[k for k in c if not k.startswith("_")]} (판정은 저장하지 않는다 · §7.3)')
            continue
        try:
            uuid.UUID(str(c['claim_id']))
        except ValueError:
            E('CL_SHAPE', f'{w}: claim_id 가 UUID 가 아니다')
        if c['claim_id'] in ids or c['label'] in labels:
            E('CL_SHAPE', f'{w}: claim_id · label 이 겹친다')
        ids.add(c['claim_id'])
        labels.add(c['label'])
        if c['event_id'] != g['event_id']:
            E('CL_SHAPE', f'{w}: event_id 가 이 사건이 아니다')
        if c['kind'] not in ('ASSERTED', 'DEFENSIVE'):
            E('CL_SHAPE', f'{w}: kind {c["kind"]!r}')
        # B
        if not c['basis']:
            E('CL_BASIS', f'{w}: 근거 사실이 없다')
        if any(x not in facts for x in c['basis']):
            E('CL_BASIS', f'{w}: 그래프에 없는 근거 사실')
        if [by_label.get(l, {}).get('fact_id') for l in c.get('_basis_labels', [])] != c['basis']:
            E('CL_BASIS', f'{w}: _basis_labels 가 basis 와 다른 사실을 가리킨다')
        # E
        ba = [l for l in c.get('_basis_labels', []) if l in by_label and after(by_label[l]['fact_id'])]
        if ba != c.get('_basis_after_event', []):
            E('CL_AFTER', f'{w}: _basis_after_event {c.get("_basis_after_event", [])} ≠ 계산 {ba}')
        # C
        if not c['checks']:
            E('CL_CHECK', f'{w}: 반증 기록이 없다')
        outs = []
        for i, k in enumerate(c['checks']):
            wk = f'{w} 물음 {i + 1}'
            if [x for x in k if not x.startswith('_')] != want_k:
                E('CL_SHAPE', f'{wk}: CounterCheck 필드가 계약과 다르다')
                continue
            ok_out = ('NOT_REFUTED', 'SCOPED', 'UNRESOLVED') + (('REFUTED',) if grp == 'dropped' else ())
            if k['outcome'] not in ok_out:
                E('CL_SHAPE', f'{wk}: outcome {k["outcome"]!r}')
            outs.append(k['outcome'])
            if not isinstance(k['recollected'], bool):
                E('CL_SHAPE', f'{wk}: recollected 가 참거짓이 아니다')
            if any(x not in facts for x in k['facts']):
                E('CL_BASIS', f'{wk}: 그래프에 없는 답의 사실')
            if [by_label.get(l, {}).get('fact_id') for l in k.get('_labels', [])] != k['facts']:
                E('CL_BASIS', f'{wk}: _labels 가 facts 와 다른 사실을 가리킨다')
            if k['outcome'] in ('NOT_REFUTED', 'SCOPED', 'REFUTED') and not k['facts']:
                E('CL_CHECK', f'{wk}: {k["outcome"]} 인데 답의 사실이 없다 (§7.3)')
            if k['outcome'] == 'UNRESOLVED':
                unresolved.append((c['label'], k['question']))
                if not k.get('_missing'):
                    E('CL_CHECK', f'{wk}: UNRESOLVED 인데 무엇이 답할지(_missing)가 없다')
            fa = [l for l in k.get('_labels', []) if l in by_label and after(by_label[l]['fact_id'])]
            if fa != k.get('_after_event_facts', []) or (bool(fa) and len(fa) == len(k.get('_labels', []))) != bool(k.get('_after_event_only')):
                E('CL_AFTER', f'{wk}: 회의 뒤 사실 표시가 계산과 다르다 ({fa})')
            if k['slot'] is not None and k['slot'] not in slots:
                E('CL_SLOT', f'{wk}: slot {k["slot"][:40]!r} 가 coverage 의 요소가 아니다')
        if 'SCOPED' in outs and ('_statement_before' not in c or c['_statement_before'] == c['statement']):
            E('CL_CHECK', f'{w}: SCOPED 가 있는데 statement 가 좁힌 문장이 아니다')
        if grp != 'dropped' and 'REFUTED' in outs:
            E('CL_CHECK', f'{w}: 반증된 해석이 해석 목록에 있다')
        # F
        text = f'{c["statement"]} {c.get("_question", "")}'
        if grp == 'claims' and any(wd in text for wd in D5_WORDS):
            E('CL_D5', f'{w}: 정치 낱말 {[wd for wd in D5_WORDS if wd in text]} — claims_d5 에 있어야 (D44)')
        if grp == 'claims_d5' and not c.get('_d5'):
            E('CL_D5', f'{w}: claims_d5 인데 _d5 표시가 없다')
    # H
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    for grp, c in rows:
        ids = set(c['basis']) | {i for k in c['checks'] for i in k['facts']}
        hay = ' '.join(f'{facts[i]["claim_text"]} {facts[i].get("event_at") or ""} {facts[i].get("as_of") or ""}' for i in ids if i in facts)
        for m in re.finditer(r'\d+(?:\.\d+)?(월)?', c['statement']):
            n = m.group(0).rstrip('월')
            if n in hay:
                continue
            if m.group(1) and n.isdigit() and 1 <= int(n) <= 12 and (months[int(n) - 1] in hay.lower() or f'-{int(n):02d}' in hay):
                continue
            E('CL_NUMBER', f'{grp} {c["label"]}: 문장의 수 {m.group(0)} 가 근거 · 답의 사실에 없다')
    if sorted(unresolved) != sorted((x['claim'], x['question']) for x in cj.get('empty_counter_slots', [])):
        E('CL_CHECK', 'empty_counter_slots 가 UNRESOLVED 물음 전부와 다르다')

    # D — 모델 출력과 대 보기
    raws = b['raws']
    for name, r in raws.items():
        if sha(r['output']) != r['output_sha256']:
            E('CL_RAW', f'{name}: 출력의 sha256 이 기록과 다르다')
    dr = raws.get(cj.get('derive_raw', ''))
    if not dr or dr.get('prompt_version') not in DERIVE_VERSIONS or dr.get('prompt_version') != cj.get('derive_version'):
        E('CL_RAW', f'해석 출력 {cj.get("derive_raw")} 이 없다 (또는 판이 claims.json derive_version 과 다르다)')
        return errs
    dclaims = json.loads(dr['output'])['claims']
    key_of = {f'DC-{i + 1:02d}': d for i, d in enumerate(dclaims)}
    counters = sorted([raws[n] for n in cj.get('counter_raws', []) if n in raws and raws[n].get('prompt_version') in COUNTER_VERSIONS], key=lambda r: r['called_at'])
    if len(counters) != len(cj.get('counter_raws', [])):
        E('CL_RAW', '반증 출력 파일이 없다')
    if counters and ' + '.join(sorted({r['prompt_version'] for r in counters})) != cj.get('counter_version'):
        E('CL_RAW', f'claims.json counter_version {cj.get("counter_version")!r} 가 쓴 반증 출력의 판과 다르다')

    def refs_ok(r, ls, w):
        for l in ls:
            f = by_label.get(l)
            ref = r['refs'].get(l)
            if not f or not ref or ref[0] != f['fact_id'] or ref[1] != sha(f['claim_text']):
                E('CL_RAW', f'{w}: {l} 이 부를 때의 사실과 다르다')

    for grp, c in rows:
        w = f'{grp} {c["label"]}'
        d = key_of.get(c['label'])
        if not d:
            E('CL_RAW', f'{w}: 해석 출력에 없는 label')
            continue
        before = c.get('_statement_before', c['statement'])
        if before != d['statement'] or c['kind'] != d['kind'] or c.get('_basis_labels') != d['basis']:
            E('CL_RAW', f'{w}: 문장 · 종류 · 근거가 해석 출력과 다르다 (손으로 고쳤나)')
        refs_ok(dr, d['basis'], w)
        res = None
        for r in counters:
            sent = {x['key']: x['claim_sha256'] for x in r.get('claims', [])}
            if sent.get(d['key']) != claim_sha(d['statement'], d['kind'], d['basis']):
                continue
            for x in json.loads(r['output'])['results']:
                if x['key'] == d['key']:
                    res = (x, r)
        if not res:
            E('CL_RAW', f'{w}: 이 해석의 반증 출력이 없다')
            continue
        x, r = res
        if '_statement_before' in c and c['statement'] != (x.get('narrowed_statement') or '').strip():
            E('CL_RAW', f'{w}: 좁힌 문장이 반증 출력과 다르다')
        # I — 한 문장
        frm = r['prompt_version'] if '_statement_before' in c else dr['prompt_version']
        ns = sentences(c['statement'])
        if ns != 1:
            if vno(frm) >= 2:
                E('CL_SENTENCE', f'{w}: 문장이 {ns} 개 — 한 문장이어야 한다 (P5-e · {frm})')
            else:
                b['warn'].append(f'{c["label"]} {ns}')
        if len(x['checks']) != len(c['checks']):
            E('CL_RAW', f'{w}: 물음 수가 반증 출력과 다르다')
            continue
        for i, (k, o) in enumerate(zip(c['checks'], x['checks'])):
            if (k['question'], k['answer'], k['outcome'], k.get('_labels')) != (o['question'], o['answer'], o['outcome'], [l for l in o['facts'] if l in by_label]):
                E('CL_RAW', f'{w} 물음 {i + 1}: 반증 출력과 다르다 (손으로 고쳤나)')
            refs_ok(r, o['facts'], f'{w} 물음 {i + 1}')

    # J — 체크포인트 (사람이 둔 확인할 물음 · W3-c)
    cps = {k['id']: k for k in b['checkpoints']}
    got = {k.get('id'): k for k in cj.get('checkpoints', [])}
    for i in got:
        if i not in cps:
            E('CL_CHECKPOINT', f'claims.json checkpoints 의 {i} 가 checkpoints.json 에 없다')
    v2 = [r for r in counters if vno(r['prompt_version']) >= 2]
    for k in cps.values():
        a = got.get(k['id'])
        if a is None:
            if k.get('status') == 'OPEN' and v2:
                E('CL_CHECKPOINT', f'체크포인트 {k["id"]} (OPEN) — /2 반증 출력을 썼는데 답이 claims.json 에 없다')
            continue
        src = None
        for r in counters:
            if not any(y.get('id') == k['id'] for y in r.get('checkpoints', [])):
                continue
            for y in json.loads(r['output']).get('checkpoints', []):
                if y.get('id') == k['id']:
                    src = (y, r)
        if not src:
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: 답이 반증 출력에 없다 (손으로 적었나)')
            continue
        y, r = src
        if (a.get('answer'), a.get('outcome'), a.get('_labels')) != (y['answer'], y['outcome'], [l for l in y['facts'] if l in by_label]):
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: 답이 반증 출력과 다르다 (손으로 고쳤나)')
        if [by_label.get(l, {}).get('fact_id') for l in a.get('_labels', [])] != a.get('facts'):
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: _labels 가 facts 와 다른 사실을 가리킨다')
        if a.get('outcome') == 'ANSWERED' and not a.get('facts'):
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: ANSWERED 인데 답의 사실이 없다')
        if a.get('outcome') == 'UNRESOLVED' and not a.get('_missing'):
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: UNRESOLVED 인데 무엇이 답할지(_missing)가 없다')
        if a.get('outcome') not in ('ANSWERED', 'UNRESOLVED'):
            E('CL_CHECKPOINT', f'체크포인트 {k["id"]}: outcome {a.get("outcome")!r}')
        refs_ok(r, y['facts'], f'체크포인트 {k["id"]}')
    return errs


def main():
    print('verify-claims')
    b = load()
    errs = check(b)
    cj = b['claims']
    c = cj['counts']
    print(f'  {CODE} p5/claims.json: 후보 {c["candidates"]} — 해석 {c["claims"]} · _d5 {c["claims_d5"]} · 반증됨 {c["dropped"]} · 물음 {c["checks"]} '
          f'(NOT_REFUTED {c["NOT_REFUTED"]} · SCOPED {c["SCOPED"]} · UNRESOLVED {c["UNRESOLVED"]} · REFUTED {c["REFUTED"]}) · 빈 반증 슬롯 {c["empty_counter_slots"]}')
    if '--report' in sys.argv:
        for grp in ('claims', 'claims_d5', 'dropped'):
            for x in cj.get(grp, []):
                outs = [k['outcome'] for k in x['checks']]
                print(f'    {x["label"]}{" _d5" if grp == "claims_d5" else ""} [{x["kind"]} · {verdict(x["kind"], outs)}] {" ".join(outs)}')
    if b['warn']:
        print(f'  WARN CL_SENTENCE: 앞 판(/1) 출력의 문장이 한 문장이 아니다 {len(b["warn"])} — {" · ".join(b["warn"])} (P5-e — 다시 돌리기에서 /2 로 부르면 실패가 된다)')
    cps = b['checkpoints']
    if cps:
        print(f'  체크포인트 {len(cps)}: ' + ' · '.join(f'{k["id"]} {k.get("status")}{" — 답 " + next((a["outcome"] for a in cj.get("checkpoints", []) if a.get("id") == k["id"]), "없음 (/2 반증 전)")}' for k in cps))
    for cde, m in errs:
        print(f'  ERROR {cde}: {m}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
