#!/usr/bin/env python3
"""W-2 의미 대조 검사 — 시험 묶음 · 저장한 모델 출력 · 보고서를 TS 를 부르지 않고 다시 본다.

    python3 scripts/verify-entailment.py [--report]

무엇을 막나 (code)
  A 시험 묶음 (packages/pipeline/data/w2/cases.json)
    CASE_SHAPE          칸 · 값 집합 · id 겹침
    CASE_SPAN           구절의 span 글이 저장된 원문과 다르다 (없는 구절로 시험한다)
    CASE_NO_SOURCE      구절의 문서가 store 에 없다
    CASE_BASE           망가뜨린 글이 바탕 예와 구절 · 칸이 다르다 / 글이 같다 / 바탕이 맞는 예가 아니다
    CASE_CHANGED        BAD 인데 changed 가 없다 · 글에 없다 · 바탕 글에도 있다
    CASE_EXPECT         group 과 expect 가 안 맞는다
  B 저장한 모델 출력 (raw/*.jsonl)
    RAW_SHAPE           출력이 JSON 이 아니다 · 값 집합 밖
    RAW_PART            issue 의 part 가 사실의 글에 글자 그대로 없다 (모델이 글을 고쳐 썼다)
    RAW_VERDICT         verdict 가 issues 에서 정해지는 값과 다르다
    RAW_UNKNOWN_CASE    시험 묶음에 없는 예의 출력
    RAW_SECRET          키처럼 생긴 글자
  C 보고서 (report.json) — raw 에서 다시 세어 같아야 한다
    REPORT_STALE        cases.json 의 해시가 보고서와 다르다
    REPORT_COUNT        맞는 예 · 틀린 예의 수가 다시 센 것과 다르다
    REPORT_ROW          예 하나의 verdict · correct · pointed 가 다시 낸 것과 다르다
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W2 = os.path.join(ROOT, 'packages/pipeline/data/w2')
VERDICTS = ['ENTAILED', 'NEEDS_CONTEXT', 'EXCEEDS', 'CONTRADICTS', 'CANNOT_JUDGE']
KINDS = ['QUANTITY', 'CAUSE', 'SCOPE', 'TIME', 'ACTOR', 'CONDITION', 'DETAIL']
WHERES = ['CONTEXT', 'NOWHERE', 'CONFLICT']
GROUP_EXPECT = {'RIGHT': {'OK', 'SHORT'}, 'WRONG': {'SHORT', 'BAD'}, 'EDGE': {None}, 'PREVIEW': {None}}
STORES = {
    'FOMC-20260916': ('fixtures/store.json', ['fixtures/store.documents.json']),
    'FOMC-20261028': ('packages/pipeline/data/events/FOMC-20261028/store.json',
                      ['packages/pipeline/data/events/FOMC-20261028/store.documents.json', 'fixtures/store.documents.json']),
}


def rj(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def load(w2=W2):
    docs = {}
    for ev, (store, dps) in STORES.items():
        texts = {}
        for dp in dps:
            for d in rj(os.path.join(ROOT, dp))['source_documents']:
                texts.setdefault(d['source_id'], d['text'])
        docs[ev] = {s['label']: texts.get(s['source_id']) for s in rj(os.path.join(ROOT, store))['sources']}
    raws = {}
    rd = os.path.join(w2, 'raw')
    for name in sorted(os.listdir(rd)) if os.path.isdir(rd) else []:
        if name.endswith('.jsonl'):
            with open(os.path.join(rd, name), encoding='utf-8') as f:
                raws[name] = [json.loads(l) for l in f if l.strip()]
    with open(os.path.join(w2, 'cases.json'), 'rb') as f:
        cases_sha = hashlib.sha256(f.read()).hexdigest()
    rp = os.path.join(w2, 'report.json')
    return {'cases': rj(os.path.join(w2, 'cases.json')), 'cases_sha': cases_sha, 'docs': docs, 'raws': raws,
            'report': rj(rp) if os.path.exists(rp) else None}


def derive(issues):
    w = [i.get('where') for i in issues]
    if 'CONFLICT' in w:
        return 'CONTRADICTS'
    if 'NOWHERE' in w:
        return 'EXCEEDS'
    return 'NEEDS_CONTEXT' if issues else 'ENTAILED'


def overlaps(claim, a, b):
    def pos(x):
        out, i = [], claim.find(x) if x else -1
        while i >= 0:
            out.append((i, i + len(x)))
            i = claim.find(x, i + 1)
        return out
    return any(s1 < e2 and s2 < e1 for s1, e1 in pos(a) for s2, e2 in pos(b))


def score(c, j):
    v = j['verdict']
    outcome = 'PASS' if v == 'ENTAILED' else 'FLAG' if v == 'NEEDS_CONTEXT' else 'BLOCK'
    if c['group'] == 'RIGHT':
        return v, outcome != 'BLOCK', None
    if c['expect'] == 'SHORT':
        return v, outcome != 'PASS', None
    if c['expect'] == 'BAD':
        ok = v in ('EXCEEDS', 'CONTRADICTS')
        pointed = ok and any(i['where'] != 'CONTEXT' and any(overlaps(c['fact']['claim_text'], i['part'], ch) for ch in c.get('changed') or [])
                             for i in j['issues'])
        return v, ok, pointed
    return v, True, None


def check(b):
    P = []
    add = lambda code, where, msg: P.append((code, where, msg))
    cases = b['cases']['cases']
    by = {}
    for c in cases:
        cid = c.get('id', '?')
        if cid in by:
            add('CASE_SHAPE', cid, 'id 가 겹친다')
        by[cid] = c
        f = c.get('fact') or {}
        if not isinstance(f.get('claim_text'), str) or not f.get('claim_text') or not f.get('fact_type') or not c.get('passages') or c.get('kind') not in b['cases']['kinds']:
            add('CASE_SHAPE', cid, '글 · fact_type · 구절 · kind 가 모자라다')
            continue
        if c.get('group') not in GROUP_EXPECT or c.get('expect') not in GROUP_EXPECT[c['group']]:
            add('CASE_EXPECT', cid, f"group {c.get('group')} 에 expect {c.get('expect')}")
        for p in c['passages']:
            texts = b['docs'].get(p.get('event'), {})
            if p.get('source_label') not in texts:
                add('CASE_NO_SOURCE', cid, f"{p.get('event')} · {p.get('source_label')}")
                continue
            if p.get('span_start') is None:
                continue
            t = texts[p['source_label']]
            if t is None or t[p['span_start']:p['span_end']] != p['passage']:   # 파이썬 str = 코드 포인트
                add('CASE_SPAN', cid, f"{p['source_label']} {p['span_start']}–{p['span_end']}")
        if c.get('expect') == 'BAD':
            ch = c.get('changed') or []
            if not ch or any(x not in f['claim_text'] for x in ch):
                add('CASE_CHANGED', cid, 'changed 가 없거나 글에 없다')
    for c in cases:
        if not c.get('kind', '').startswith('corrupt-'):
            continue
        base = by.get(c.get('base'))
        if base is None or base.get('group') != 'RIGHT':
            add('CASE_BASE', c['id'], '바탕 예가 없거나 맞는 예가 아니다')
            continue
        if c['passages'] != base['passages'] or c['fact']['claim_text'] == base['fact']['claim_text'] or c['fact']['fact_type'] != base['fact']['fact_type']:
            add('CASE_BASE', c['id'], '구절 · fact_type 이 바탕과 다르거나 글이 바탕과 같다')
        if any(x in base['fact']['claim_text'] for x in c.get('changed') or []):
            add('CASE_CHANGED', c['id'], 'changed 가 바탕 글에도 있다 — 넘친 부분이 아니다')

    # B — 저장한 출력. 예마다 (요청 지문이 같은 것 가운데) 마지막 줄을 쓴다 — 보고서와 대 볼 때는 보고서가 쓴 verdict 와 견준다
    judged = {}
    for name, lines in b['raws'].items():
        for n, l in enumerate(lines):
            where = f'{name}:{n + 1}'
            if re.search(r'sk-ant-|x-api-key|authorization', json.dumps(l), re.I):
                add('RAW_SECRET', where, '키처럼 생긴 글자')
            c = by.get(l.get('case_id'))
            if c is None:
                add('RAW_UNKNOWN_CASE', where, str(l.get('case_id')))
                continue
            if not l.get('ok') or l.get('output') is None:
                continue
            try:
                j = json.loads(l['output'])
                assert j['verdict'] in VERDICTS and isinstance(j['issues'], list) and isinstance(j['note'], str)
                assert all(i['kind'] in KINDS and i['where'] in WHERES and isinstance(i['part'], str) and isinstance(i['why'], str) for i in j['issues'])
            except Exception:
                add('RAW_SHAPE', where, '출력의 모양')
                continue
            for i in j['issues']:
                if not i['part'] or i['part'] not in c['fact']['claim_text']:
                    add('RAW_PART', where, f"{c['id']}: \"{i['part']}\"")
            if j['verdict'] != 'CANNOT_JUDGE' and j['verdict'] != derive(j['issues']):
                add('RAW_VERDICT', where, f"{c['id']}: {j['verdict']} ≠ {derive(j['issues'])}")
            judged.setdefault((l['model_requested'], l['effort']), {}).setdefault(c['id'], []).append((l['request_sha256'], j))

    # C — 보고서
    rep = b['report']
    if rep is not None:
        if rep.get('cases_sha256') != b['cases_sha']:
            add('REPORT_STALE', 'report.json', 'cases.json 이 보고서를 지은 뒤에 바뀌었다 — 다시 짓는다')
        for run in rep['runs']:
            key = (run['model'], run['effort'])
            got = {'right': [0, 0], 'short': [0, 0], 'bad': [0, 0, 0]}
            for row in run['rows']:
                c = by.get(row['id'])
                if c is None or row.get('missing'):
                    continue
                cands = [j for _, j in judged.get(key, {}).get(row['id'], []) if j['verdict'] == row['verdict'] and [i['part'] for i in j['issues']] == [i['part'] for i in row['issues']]]
                if not cands:
                    add('REPORT_ROW', f"{run['model']} · {run['effort']}", f"{row['id']}: 보고서의 판정이 저장한 출력에 없다")
                    continue
                v, ok, pointed = score(c, cands[-1])
                if ok != row['correct'] or (pointed is not None and bool(pointed) != bool(row['pointed'])):
                    add('REPORT_ROW', f"{run['model']} · {run['effort']}", f"{row['id']}: correct · pointed 가 다시 낸 것과 다르다")
                if c['group'] == 'RIGHT':
                    got['right'][0] += 1; got['right'][1] += (not ok)
                elif c['group'] == 'WRONG' and c['expect'] == 'SHORT':
                    got['short'][0] += 1; got['short'][1] += ok
                elif c['group'] == 'WRONG':
                    got['bad'][0] += 1; got['bad'][1] += ok; got['bad'][2] += bool(pointed)
            s = run['summary']
            want = {'right': [s['right']['n'], s['right']['false_block']], 'short': [s['wrong_short']['n'], s['wrong_short']['caught']],
                    'bad': [s['wrong_bad']['n'], s['wrong_bad']['caught'], s['wrong_bad']['pointed']]}
            if got != want:
                add('REPORT_COUNT', f"{run['model']} · {run['effort']}", f'보고서 {want} ≠ 다시 센 것 {got}')
    return P


def main():
    b = load()
    P = check(b)
    cases = b['cases']['cases']
    if '--report' in sys.argv:
        from collections import Counter
        for k, n in Counter((c['group'], c['kind']) for c in cases).items():
            print(f'  {k[0]:8} {k[1]:24} {n}')
        for name, lines in b['raws'].items():
            print(f'  raw {name}: {len(lines)} 줄')
    for code, where, msg in P:
        print(f'FAIL {code} [{where}] {msg}')
    print(f"verify-entailment: 시험 예 {len(cases)} · 저장한 출력 {sum(len(v) for v in b['raws'].values())} 줄 ({len(b['raws'])} 파일) · "
          f"보고서 {'있음' if b['report'] else '없음'} — {'문제 ' + str(len(P)) if P else '통과'}")
    sys.exit(1 if P else 0)


if __name__ == '__main__':
    main()
