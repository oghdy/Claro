#!/usr/bin/env python3
"""verify-ledger 자체 시험 — 실물 장부는 통과하고, 망가뜨린 사본은 그 code 로 실패해야 한다.

    python3 scripts/selftest-verify-ledger.py
"""
import copy, importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vl', os.path.join(ROOT, 'scripts/verify-ledger.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

base = V.load()


def first(b, pred):
    return next(l for l in b['lines'] if pred(l))


def batch_line(b):
    """배치 줄 — 실물에 없으면 마지막 줄을 배치로 바꿔 만든다 (값 · batch_id 를 맞춰 둔다)"""
    l = next((x for x in b['lines'] if x.get('mode') == 'batch'), None)
    if l is None:
        l = next(x for x in reversed(b['lines']) if x['usage'])
        l['mode'], l['batch_id'] = 'batch', 'msgbatch_selftest'
        l['cost_usd'] = round(V.cost(l['model_requested'], l['usage'], 'batch'), 6)
    return l


def m_cost(b):           # 값을 손으로 (반으로 줄였는데 배치가 아니다)
    l = first(b, lambda x: x['usage'] and x.get('mode') != 'batch')
    l['cost_usd'] = round(l['cost_usd'] / 2, 6)


def m_batch_full(b):     # 배치인데 즉시 값을 적었다
    l = batch_line(b)
    l['cost_usd'] = round(V.cost(l['model_requested'], l['usage'], 'now'), 6)


def m_batch_noid(b):     # 배치 줄에 batch_id 가 없다
    l = batch_line(b)
    del l['batch_id']


def m_mode(b):           # 모르는 길
    b['lines'][0]['mode'] = 'fast'


def m_step(b):           # Step 이 비었다
    b['lines'][3]['step'] = ''


def m_key(b):            # 키가 오류 메시지에 남았다
    b['lines'][5]['error'] = '401 — key ' + 'sk-' + 'ant-' + 'X' * 16   # 가짜 값 (저장소 검색에 걸리지 않게 나눠 적는다)


def m_budget(b):         # W-6 상한(4)을 넘는 줄
    l = copy.deepcopy(first(b, lambda x: x['usage'] and x['model_requested'] == 'claude-opus-5-5'))
    l.update(step='W-6', at=b['lines'][-1]['at'], mode='batch', batch_id='msgbatch_selftest2')
    l['usage'] = dict(l['usage'], output_tokens=500_000)
    l['cost_usd'] = round(V.cost(l['model_requested'], l['usage'], 'batch'), 6)
    b['lines'].append(l)


def m_order(b):          # 장부의 줄을 바꿔 끼웠다 (덧붙이기만이 아니다)
    b['lines'][10], b['lines'][11] = b['lines'][11], b['lines'][10]
    if b['lines'][10]['at'] <= b['lines'][11]['at']:
        b['lines'][10]['at'], b['lines'][11]['at'] = '2026-12-31T00:00:00.000Z', b['lines'][11]['at']


def m_raw(b):            # 배치로 받았다는 저장 출력의 batch_id 가 장부에 없다
    name = next(iter(b['raws']))
    b['raws'][name][0] = dict(b['raws'][name][0], mode='batch', batch_id='msgbatch_nowhere')


def m_shape(b):          # 칸이 빠졌다
    del b['lines'][7]['request_sha256']


CASES = [(m_cost, 'LG_COST'), (m_batch_full, 'LG_COST'), (m_batch_noid, 'LG_SHAPE'), (m_mode, 'LG_SHAPE'), (m_step, 'LG_SHAPE'), (m_key, 'LG_SECRET'),
         (m_budget, 'LG_BUDGET'), (m_order, 'LG_ORDER'), (m_raw, 'LG_RAW'), (m_shape, 'LG_SHAPE')]


def main():
    P, _ = V.check(base)
    errs = [p for p in P if p[0] == 'ERROR']
    ok = not errs
    print(f'실물 — {"통과" if ok else "실패 " + str(errs[:3])}')
    for f, code in CASES:
        b = copy.deepcopy(base)
        f(b)
        got = {p[1] for p in V.check(b)[0] if p[0] == 'ERROR'}
        hit = code in got
        ok &= hit
        print(f'  {"잡음" if hit else "놓침"} {f.__name__:<14} → {code}{"" if hit else f" (나온 것 {sorted(got)})"}')
    print(f'selftest-verify-ledger: 사본 {len(CASES)} · {"OK" if ok else "FAIL"}')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
