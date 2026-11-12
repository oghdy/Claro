#!/usr/bin/env python3
"""W-6 — 모델 부르기 장부(packages/pipeline/data/p3-calls.jsonl)와 배치로 받은 출력을 기계로 확인한다. 장부는 비용 판단의 근거다 (D51).

    python3 scripts/verify-ledger.py            # 검사
    python3 scripts/verify-ledger.py --report   # + Step 마다 합 · 길(즉시 · 배치)

  A. 모양   줄마다 칸이 있다 · step 이 비지 않았다 · mode 는 없음(W-6 앞 · 즉시) | "now" | "batch" · 배치 줄은 batch_id (msgbatch_…) (LG_SHAPE)
  B. 값     usage 에서 다시 계산한 값 = cost_usd — 가격은 아래 PRICE (llm.ts 와 따로 적는다 · 한쪽이 바뀌면 여기서 걸린다) · 배치는 반 (LG_COST)
  C. 키     키처럼 생긴 글자 없음 (LG_SECRET)
  D. 상한   Step 마다 합 ≤ 그 Step 의 상한 (DECISIONS · 지시의 값 — 아래 BUDGET). 모르는 Step 은 WARN (LG_BUDGET)
  E. 차례   장부는 덧붙이기만 한다 — at 이 줄 순서대로 줄지 않는다 (LG_ORDER)
  F. 배치 출력  저장한 모델 출력 가운데 배치로 받은 것(mode "batch")의 batch_id 가 장부의 배치 줄에 있다 · 그 출력의 cost_usd 가 장부의 그 줄들 가운데 하나와 같다 (LG_RAW)

exit 0 OK · 1 FAIL
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)
LEDGER = 'packages/pipeline/data/p3-calls.jsonl'
# US$ / 100만 토큰 (claude-api 스킬 표 2026-11-03) — 입력 · 출력 · 캐시 쓰기(5분) · 캐시 읽기
PRICE = {
    'claude-sonnet-5-5': (2, 10, 2.5, 0.1),
    'claude-opus-5-5': (4, 20, 5, 0.2),
    'claude-fable-5-2': (8, 40, 10, 0.2),
}
BATCH = 0.5
# Step 의 상한 (US$) — DECISIONS D42 · D43 · D44 · D45 · D47 (W-2) · D51 (W-6 재기 4) · D68 (P-E1 회차 단계 3) · D73 (P-E2 설계 /2 시험 1)
BUDGET = {'P-3': 15, 'P-3b': 12, 'P-4': 8, 'P-5': 10, 'W-2': 8, 'W-6': 4, 'P-E1': 3, 'P-E2': 1}
KEYS = ('at', 'step', 'event', 'source_label', 'model_requested', 'model', 'effort', 'prompt_version', 'request_sha256', 'text_sha256',
        'stop_reason', 'usage', 'duration_ms', 'cost_usd', 'ok', 'error', 'request_id')
RAW_GLOBS = ('packages/pipeline/data/events/*/p3/raw/*.json', 'packages/pipeline/data/events/*/p3/merge.*.json', 'packages/pipeline/data/events/*/p4/raw/*.json',
             'packages/pipeline/data/events/*/p5/raw/*.json', 'packages/pipeline/data/p3-golden/*/raw/*.json', 'packages/pipeline/data/p3-golden/*/merge.*.json',
             'packages/pipeline/data/w6/*/*.json', 'packages/pipeline/data/events/*/episode/raw/*.json', 'packages/pipeline/data/events/*/episodes/*/raw/*.json')
W2_RAW = ('packages/pipeline/data/w2/raw/*.jsonl', 'packages/pipeline/data/w6/w2/raw/*.jsonl', 'packages/pipeline/data/events/*/episode/raw/*.jsonl', 'packages/pipeline/data/events/*/episodes/*/raw/*.jsonl', 'packages/pipeline/data/episode-entail/raw/*.jsonl')


def load():
    lines = [json.loads(l) for l in open(R(LEDGER), encoding='utf-8') if l.strip()]
    raws = {}
    for g in RAW_GLOBS:
        for p in sorted(glob.glob(R(g))):
            raws[os.path.relpath(p, ROOT)] = [json.load(open(p, encoding='utf-8'))]
    for g in W2_RAW:
        for p in sorted(glob.glob(R(g))):
            raws[os.path.relpath(p, ROOT)] = [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
    return {'lines': lines, 'raws': raws}


def cost(model, u, mode):
    p = PRICE[model]
    c = (u['input_tokens'] * p[0] + u['output_tokens'] * p[1] + u['cache_creation_input_tokens'] * p[2] + u['cache_read_input_tokens'] * p[3]) / 1e6
    return c * BATCH if mode == 'batch' else c


def check(b):
    P = []
    add = lambda code, where, msg, level='ERROR': P.append((level, code, where, msg))
    sums, batch_ids, batch_costs = {}, set(), {}
    prev = ''
    for n, l in enumerate(b['lines']):
        w = f'p3-calls.jsonl:{n + 1}'
        miss = [k for k in KEYS if k not in l]
        if miss:
            add('LG_SHAPE', w, f'칸이 없다 {miss}')
            continue
        if not isinstance(l['step'], str) or not l['step'].strip():
            add('LG_SHAPE', w, 'step 이 비었다')
        mode = l.get('mode')
        if mode not in (None, 'now', 'batch'):
            add('LG_SHAPE', w, f'mode {mode!r}')
        if mode == 'batch':
            if not re.fullmatch(r'msgbatch_[A-Za-z0-9]+', str(l.get('batch_id', ''))):
                add('LG_SHAPE', w, f'배치 줄의 batch_id {l.get("batch_id")!r}')
            else:
                batch_ids.add(l['batch_id'])
                batch_costs.setdefault(l['batch_id'], []).append(l['cost_usd'])
        elif 'batch_id' in l:
            add('LG_SHAPE', w, '배치가 아닌 줄에 batch_id')
        if re.search(r'sk-ant-|x-api-key|authorization', json.dumps(l, ensure_ascii=False), re.I):
            add('LG_SECRET', w, '키처럼 생긴 글자')
        u = l['usage']
        if u is None:
            if l['cost_usd'] != 0:
                add('LG_COST', w, f'usage 가 없는데 cost_usd {l["cost_usd"]}')
        elif l['model_requested'] not in PRICE:
            add('LG_COST', w, f'가격을 모르는 모델 {l["model_requested"]}')
        else:
            want = cost(l['model_requested'], u, mode)
            if abs(want - l['cost_usd']) > 2e-6:
                add('LG_COST', w, f'cost_usd {l["cost_usd"]} ≠ 다시 계산 {want:.6f} ({mode or "now"})')
        if l['at'] < prev:
            add('LG_ORDER', w, f'at {l["at"]} 이 앞 줄 {prev} 보다 이르다 — 장부는 덧붙이기만')
        prev = max(prev, l['at'])
        sums[l['step']] = sums.get(l['step'], 0) + l['cost_usd']
    for s, v in sums.items():
        if s not in BUDGET:
            add('LG_BUDGET', s, f'상한을 모르는 Step (합 ${v:.2f}) — BUDGET 에 적는다', 'WARN')
        elif v > BUDGET[s] + 1e-9:
            add('LG_BUDGET', s, f'합 ${v:.4f} > 상한 ${BUDGET[s]}')
    for name, rs in b['raws'].items():
        for n, r in enumerate(rs):
            if r.get('mode') != 'batch':
                continue
            w = f'{name}:{n + 1}' if name.endswith('.jsonl') else name
            bid = r.get('batch_id')
            if bid is None and '/data/w6/' in '/' + name:
                # w6 의 잰 출력은 batch_id 를 적지 않았다 — 장부의 W-6 배치 줄 가운데 같은 값이 있는지만
                if not any(abs(c - r.get('cost_usd', -1)) < 2e-6 for l in b['lines'] if l.get('step') == 'W-6' and l.get('mode') == 'batch' for c in [l['cost_usd']]):
                    add('LG_RAW', w, f'cost_usd {r.get("cost_usd")} 가 장부의 W-6 배치 줄에 없다')
                continue
            if bid not in batch_ids:
                add('LG_RAW', w, f'batch_id {bid!r} 가 장부의 배치 줄에 없다')
            elif not any(abs(c - r.get('cost_usd', -1)) < 2e-6 for c in batch_costs[bid]):
                add('LG_RAW', w, f'cost_usd {r.get("cost_usd")} 가 장부의 배치 {bid} 줄에 없다')
    return P, sums


def main():
    b = load()
    P, sums = check(b)
    lines = b['lines']
    nb = sum(1 for l in lines if l.get('mode') == 'batch')
    print(f'verify-ledger: 장부 {len(lines)} 줄 (배치 {nb}) · 합 ${sum(l["cost_usd"] for l in lines):.2f} · 저장 출력 {sum(len(v) for v in b["raws"].values())}')
    if '--report' in sys.argv:
        for s, v in sums.items():
            ls = [l for l in lines if l['step'] == s]
            print(f'  {s:<6} ${v:7.3f} / 상한 {BUDGET.get(s, "?")} · 부르기 {len(ls)} (배치 {sum(1 for l in ls if l.get("mode") == "batch")})')
    for lv, code, w, msg in P:
        print(f'  {lv} {code} {w}: {msg}')
    errs = [p for p in P if p[0] == 'ERROR']
    print('FAIL' if errs else 'OK', f'(ERROR {len(errs)} · WARN {len(P) - len(errs)})')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
