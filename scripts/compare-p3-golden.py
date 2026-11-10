#!/usr/bin/env python3
"""P-3 · P-3b 9월 비교 — 골든 사실 60 (fixtures/store.json) 과 파이프라인이 뽑은 사실을 견준 판정을 검사하고 센다.
P-3b: 판정의 models = 지금 그래프와 대 본다 · p3 = P-3 (2014a27) 의 얼린 판정 — 그래프가 다시 지어져 수만 센다. 표에 나란히

    python3 scripts/compare-p3-golden.py            # 표
    python3 scripts/compare-p3-golden.py --detail   # + 골든 사실마다 판정

판정은 사람(P-3 · P-3b 세션)이 했다 — packages/pipeline/data/p3-golden/FOMC-20260916/compare.json. 이 스크립트는 판정을 만들지 않는다.
검사하는 것:
  - 골든 사실 60 이 모델마다 하나씩 판정돼 있다 · status 는 네 값
  - MISSED_UNSTORED ⇔ 그 골든 사실의 출처가 하나도 저장되지 않았다 (P-1 기록). 저장된 출처가 있으면 "놓침"은 MISSED_STORED 다
  - FOUND · PARTIAL 은 가리킨 사실(key = _from)이 그 모델의 그래프에 있다 · MISSED 는 가리키지 않는다
  - 구절 겹침 (기계 근거): 골든 span 과 뽑은 span 이 같은 원문에서 겹치는데 MISSED 로 판정했으면 WARN — 판정을 다시 본다
  - 글이 틀린 것 · 구절 부족 목록의 key 가 그래프에 있다
exit 0 OK · 1 FAIL
"""
import json, os, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
STATUSES = ('FOUND', 'PARTIAL', 'MISSED_STORED', 'MISSED_UNSTORED')
LEDGER = 'packages/pipeline/data/p3-calls.jsonl'


def main():
    store, rec = J('fixtures/store.json'), J('packages/pipeline/data/fomc-2026-09.sources.json')
    cmp_ = J('packages/pipeline/data/p3-golden/FOMC-20260916/compare.json')
    stored = {d['source_id'] for d in rec['documents'] if d['status'] == 'STORED'}
    lab = {s['source_id']: s['label'] for s in store['sources']}
    gfs = defaultdict(list)
    for r in store['fact_sources']:
        gfs[r['fact_id']].append(r)
    golden = {f['label']: f for f in store['facts']}
    errs, warns = [], []
    ledger = [json.loads(l) for l in open(os.path.join(ROOT, LEDGER), encoding='utf-8') if l.strip()] if os.path.exists(os.path.join(ROOT, LEDGER)) else []
    print('compare-p3-golden — 9월 사건 (FOMC-20260916) · 골든 사실', len(golden))
    rows = []
    for model, m in cmp_['models'].items():
        g = J(m['graph'])
        # P-5 (P4-j): 그래프 판이 올랐어도, 판정이 가리킨 문서의 출력이 판정 때의 판 그대로(앞 판 출력을 같은 요청으로 쓴 것 — prompt_compat)면 판정은 그 출력에 대해 유효하다
        bf_ver = {x['source_label']: x.get('prompt_version') for x in g.get('built_from', [])}
        judged_docs = {k.split('#')[0] for j in m['judgements'].values() for k in j.get('keys', [])}
        compat_ok = m['prompt_version'] in (g.get('prompt_compat') or {}) and all(bf_ver.get(d) == m['prompt_version'] for d in judged_docs if d in bf_ver)
        if g.get('model') != m['model'] or (g.get('prompt_version') != m['prompt_version'] and not compat_ok):
            errs.append(f'{model}: 그래프의 모델 · 프롬프트 판 ({g.get("model")} · {g.get("prompt_version")}) 이 판정과 다르다')
        elif g.get('prompt_version') != m['prompt_version']:
            redone = sorted(d for d, v in bf_ver.items() if v != m['prompt_version'])
            warns.append(f'{model}: 그래프는 {g.get("prompt_version")} — 판정이 가리킨 문서의 출력은 {m["prompt_version"]} 그대로 (같은 요청). 다시 뽑은 문서 {redone} 는 판정 밖 (P-5 — CAL 일정은 이제 코드가 읽는다 · F38 판정은 모델 출력에 대한 것)')
        by_key = {}
        for f in g['facts']:
            for k in f.get('_from', []):
                by_key[k] = f
        spans = defaultdict(list)  # source_id → [(start, end, key)]
        for r in g['fact_sources']:
            if r.get('span_start') is not None:
                spans[r['source_id']].append((r['span_start'], r['span_end'], r.get('_from')))
        jd = m['judgements']
        if set(jd) != set(golden):
            errs.append(f'{model}: 판정한 골든 사실이 60 과 다르다 — 없음 {sorted(set(golden) - set(jd))} · 남음 {sorted(set(jd) - set(golden))}')
        used = set()
        for label, j in jd.items():
            st, keys = j.get('status'), j.get('keys', [])
            if st not in STATUSES:
                errs.append(f'{model} {label}: status {st!r}')
                continue
            f = golden.get(label)
            if f is None:
                continue
            srcs = gfs.get(f['fact_id'], [])
            any_stored = any(r['source_id'] in stored for r in srcs)
            if (st == 'MISSED_UNSTORED') == any_stored:
                errs.append(f'{model} {label}: {st} 인데 저장된 출처가 {"있다" if any_stored else "없다"} ({", ".join(lab[r["source_id"]] for r in srcs)})')
            if st in ('FOUND', 'PARTIAL'):
                if not keys:
                    errs.append(f'{model} {label}: {st} 인데 가리킨 사실이 없다')
                for k in keys:
                    if k not in by_key:
                        errs.append(f'{model} {label}: 가리킨 {k} 가 그래프에 없다')
                    else:
                        used.add(by_key[k]['fact_id'])
            elif keys:
                errs.append(f'{model} {label}: {st} 인데 사실을 가리킨다')
            # 기계 근거 — 겹치는 span
            over = sorted({k for r in srcs if r.get('span_start') is not None for (a, b, k) in spans.get(r['source_id'], []) if a < r['span_end'] and r['span_start'] < b})
            if st.startswith('MISSED') and over:
                warns.append(f'{model} {label}: MISSED 인데 구절이 겹치는 뽑은 사실이 있다 — {over} (판정을 다시 본다)')
            if st in ('FOUND', 'PARTIAL') and over and not set(over) & set(keys):
                warns.append(f'{model} {label}: 구절이 겹치는 {over} 를 가리키지 않았다 (가리킨 것 {keys})')
        for kind in ('text_errors', 'passage_short'):
            for e in cmp_.get(kind, {}).get(model, []) if not model.startswith('_') else []:
                k = e['key'] if isinstance(e, dict) else e
                if k not in by_key:
                    errs.append(f'{model} {kind}: {k} 가 그래프에 없다')
        c = Counter(j['status'] for j in jd.values())
        extra = [f for f in g['facts'] if f['fact_id'] not in used]
        extra_src = Counter(f['_from'][0].split('#')[0] for f in extra)
        after = sum(1 for f in g['facts'] if f.get('_after_event'))
        te = cmp_.get('text_errors', {}).get(model, [])
        te_matched = [e for e in te if e['key'] in {k for j in jd.values() for k in j.get('keys', [])}]
        calls = [l for l in ledger if l['event'] == 'FOMC-20260916' and l['model_requested'] == m['model'] and l['ok'] and l['prompt_version'] in (m['prompt_version'], g.get('merge_version'))]
        tab = sum(1 for f in g['facts'] if '_table' in f)
        rows.append({'name': model, 'c': c, 'facts': len(g['facts']), 'extra': len(extra), 'extra_src': extra_src, 'after': after, 'te_extra': len(te) - len(te_matched), 'te_paired': len(te_matched), 'te': te,
                     'ps': len(cmp_.get('passage_short', {}).get(model, [])), 'calls': calls, 'cnt': g['counts'], 'tab': tab, 'live': True,
                     'cell': sum(1 for e in te if e['kind'] == '표 칸 밀림'), 'quant': sum(1 for e in te if e['kind'] == '수량어'),
                     'qb': g['counts'].get('quantifier_mismatch', 0), 'nb': g['counts'].get('number_mismatch', 0), 'merges': g['counts'].get('merges', 0)})
        if '--detail' in sys.argv:
            print(f'\n{model}')
            for label in golden:
                j = jd.get(label, {})
                print(f'  {label:<5} {j.get("status", "?"):<16} {", ".join(j.get("keys", [])):<32} {j.get("note", "")[:90]}')
    # P-3 (얼린 판정) — 수만 센다
    frozen = []
    for name, m in cmp_.get('p3', {}).get('models', {}).items():
        jd = m['judgements']
        if set(jd) != set(golden):
            errs.append(f'P-3 {name}: 판정한 골든 사실이 60 과 다르다')
        sm = m['summary']
        frozen.append({'name': f'P-3 {name}', 'c': Counter(j['status'] for j in jd.values()), 'facts': sm['facts'], 'extra': sm['extra'], 'te_paired': sm['text_errors_paired'], 'te_extra': sm['text_errors_extra'],
                       'cell': sm['cell_errors'], 'quant': sm['quantifier_errors'], 'ps': sm['passage_short'], 'tab': 0, 'qb': '—', 'nb': '—', 'merges': '—', 'live': False,
                       'cost': sm['cost_usd'], 'sec': sm['seconds'], 'ncalls': sm['calls'], 'buckets': sm['no_passage_multiple_badshape']})
    allr = frozen + [dict(r, name=f'P-3b {r["name"]}') for r in rows]
    print('\n| | ' + ' | '.join(r['name'] for r in allr) + ' |')
    print('|---|' + '---|' * len(allr))
    line = lambda name, f: print(f'| {name} | ' + ' | '.join(str(f(r)) for r in allr) + ' |')
    stored_n = sum(1 for lb, f in golden.items() if any(r['source_id'] in stored for r in gfs.get(f['fact_id'], [])))
    line('찾음 (FOUND)', lambda r: r['c']['FOUND'])
    line('일부 (PARTIAL)', lambda r: r['c']['PARTIAL'])
    line('놓침 — 원문 저장됨', lambda r: r['c']['MISSED_STORED'])
    line('놓침 — 원문 저장 안 됨', lambda r: r['c']['MISSED_UNSTORED'])
    line(f'**저장된 원문이 있는 골든 {stored_n} 중 찾음 + 일부**', lambda r: f'**{r["c"]["FOUND"] + r["c"]["PARTIAL"]} ({(r["c"]["FOUND"] + r["c"]["PARTIAL"]) / stored_n:.0%})**')
    line('뽑은 사실 (묶은 뒤)', lambda r: r['facts'])
    line('  그중 표 사실 (코드)', lambda r: r['tab'])
    line('더 뽑음 (골든에 없는 것)', lambda r: r['extra'])
    line('글이 틀린 것 — 짝지은 것', lambda r: r['te_paired'])
    line('글이 틀린 것 — 더 뽑은 것 (표본)', lambda r: r['te_extra'])
    line('  칸 틀림', lambda r: r['cell'])
    line('  수량어 틀림', lambda r: r['quant'])
    line('구절 부족 (본 것 중)', lambda r: r['ps'])
    line('수량어 · 수 어긋남 — 코드가 그래프 밖으로', lambda r: f'{r["qb"]} · {r["nb"]}')
    line('구절 없음 · 여럿 · 모양 틀림', lambda r: r.get('buckets') or f'{r["cnt"]["no_passage"]} · {r["cnt"]["multiple"]} · {r["cnt"]["bad_shape"]}')
    line('묶기', lambda r: r['merges'])
    line('호출 (모델)', lambda r: r.get('ncalls') or len(r['calls']))
    line('대략 비용', lambda r: f'${r["cost"]:.2f}' if not r['live'] else f'${sum(l["cost_usd"] for l in r["calls"]):.2f}')
    line('걸린 시간 (호출 합)', lambda r: f'{r["sec"]}초' if not r['live'] else f'{sum(l["duration_ms"] for l in r["calls"]) / 1000:.0f}초')
    for r in rows:
        print(f'\n{r["name"]} — 더 뽑은 것의 문서별: ' + ' · '.join(f'{k} {v}' for k, v in sorted(r['extra_src'].items(), key=lambda x: -x[1])))
        for e in r['te']:
            print(f'  글이 틀림 {e["key"]} [{e["kind"]}] {e["what"]}')
    # 표본의 key 가 그래프에 있다
    for model, keys in ((k, v) for k, v in cmp_.get('sample', {}).items() if not k.startswith('_')):
        g = J(cmp_['models'][model]['graph'])
        have = {k for f in g['facts'] for k in f.get('_from', [])}
        for k in keys:
            if k not in have:
                errs.append(f'{model} 표본 {k} 가 그래프에 없다')
    for w in warns:
        print('  WARN  ' + w)
    for e in errs:
        print('  ERROR ' + e)
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
