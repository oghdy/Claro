#!/usr/bin/env python3
"""P-3 9월 비교 — 골든 사실 60 (fixtures/store.json) 과 파이프라인이 뽑은 사실을 견준 판정을 검사하고 센다.

    python3 scripts/compare-p3-golden.py            # 표
    python3 scripts/compare-p3-golden.py --detail   # + 골든 사실마다 판정

판정은 사람(P-3 세션)이 했다 — packages/pipeline/data/p3-golden/FOMC-20260916/compare.json. 이 스크립트는 판정을 만들지 않는다.
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
            for e in cmp_.get(kind, {}).get(model, []):
                k = e['key'] if isinstance(e, dict) else e
                if k not in by_key:
                    errs.append(f'{model} {kind}: {k} 가 그래프에 없다')
        c = Counter(j['status'] for j in jd.values())
        extra = [f for f in g['facts'] if f['fact_id'] not in used]
        extra_src = Counter(f['_from'][0].split('#')[0] for f in extra)
        after = sum(1 for f in g['facts'] if f.get('_after_event'))
        te = cmp_.get('text_errors', {}).get(model, [])
        te_matched = [e for e in te if e['key'] in {k for j in jd.values() for k in j.get('keys', [])}]
        calls = [l for l in ledger if l['event'] == 'FOMC-20260916' and l['model_requested'] == model and l['ok']]
        rows.append((model, c, len(g['facts']), len(extra), extra_src, after, te, te_matched, len(cmp_.get('passage_short', {}).get(model, [])), calls, g['counts']))
        if '--detail' in sys.argv:
            print(f'\n{model}')
            for label in golden:
                j = jd.get(label, {})
                print(f'  {label:<5} {j.get("status", "?"):<16} {", ".join(j.get("keys", [])):<32} {j.get("note", "")[:90]}')
    print('\n| | ' + ' | '.join(r[0] for r in rows) + ' |')
    print('|---|' + '---|' * len(rows))
    line = lambda name, f: print(f'| {name} | ' + ' | '.join(f(r) for r in rows) + ' |')
    stored_n = sum(1 for lb, f in golden.items() if any(r['source_id'] in stored for r in gfs.get(f['fact_id'], [])))
    line('찾음 (FOUND)', lambda r: str(r[1]['FOUND']))
    line('일부 (PARTIAL)', lambda r: str(r[1]['PARTIAL']))
    line('놓침 — 원문 저장됨', lambda r: str(r[1]['MISSED_STORED']))
    line('놓침 — 원문 저장 안 됨', lambda r: str(r[1]['MISSED_UNSTORED']))
    line(f'저장된 원문이 있는 골든 {stored_n} 중 찾음 + 일부', lambda r: f'{r[1]["FOUND"] + r[1]["PARTIAL"]} ({(r[1]["FOUND"] + r[1]["PARTIAL"]) / stored_n:.0%})')
    line('뽑은 사실 (묶은 뒤)', lambda r: str(r[2]))
    line('더 뽑음 (골든에 없는 것)', lambda r: str(r[3]))
    line('  그중 사건 뒤 표시 (_after_event)', lambda r: str(r[5]))
    line('글이 틀린 것 (짝지은 것 중)', lambda r: str(len(r[7])))
    line('글이 틀린 것 (더 뽑은 것 · 표본 22 + 국채 표 대조)', lambda r: str(len(r[6]) - len(r[7])))
    line('구절 부족 (본 것 중)', lambda r: str(r[8]))
    line('구절 없음 · 여럿 · 모양 틀림', lambda r: f'{r[10]["no_passage"]} · {r[10]["multiple"]} · {r[10]["bad_shape"]}')
    line('호출 · 입력 / 출력 토큰', lambda r: f'{len(r[9])} · {sum(l["usage"]["input_tokens"] + l["usage"]["cache_read_input_tokens"] + l["usage"]["cache_creation_input_tokens"] for l in r[9]):,} / {sum(l["usage"]["output_tokens"] for l in r[9]):,}')
    line('대략 비용', lambda r: f'${sum(l["cost_usd"] for l in r[9]):.2f}')
    line('걸린 시간 (호출 합)', lambda r: f'{sum(l["duration_ms"] for l in r[9]) / 1000:.0f}초')
    for r in rows:
        print(f'\n{r[0]} — 더 뽑은 것의 문서별: ' + ' · '.join(f'{k} {v}' for k, v in sorted(r[4].items(), key=lambda x: -x[1])))
        for e in r[6]:
            print(f'  글이 틀림 {e["key"]} [{e["kind"]}] {e["what"]}')
    for w in warns:
        print('  WARN  ' + w)
    for e in errs:
        print('  ERROR ' + e)
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
