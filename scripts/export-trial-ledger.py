#!/usr/bin/env python3
"""verify-observation 의 시험 원장(가짜 독자 하나)과 selftest 의 망가뜨린 사본을 JSON 으로 내보낸다 (B-0.4a).

    python3 scripts/export-trial-ledger.py > /dev/null

packages/db 의 테스트가 읽는다 — 같은 원장을 데이터베이스에 넣어 보고, 원장에서 센 값(완독 · 멈춘 장)을 여기 값과 견준다.
원장을 여기서 다시 만들지 않는다. 만드는 곳은 verify-observation.py 의 build_ledger 하나다.
가짜 독자다. 관찰이 아니다 — 파일로 남기지 않는다 (표준 출력으로만).
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


S = _load('selftest_vo', 'scripts/selftest-verify-observation.py')
V = S.V


def summary(L):
    try:
        s = V.reading_summary(L, L['plans'][0]['reading_id'])
    except Exception:                      # 망가뜨린 사본 가운데는 셀 수 없는 것이 있다 (없는 plan 등)
        return None
    return dict(s, stopped_at=list(s['stopped_at']) if s['stopped_at'] else None)


def main():
    cases = []
    for name, target, mutate, want in S.CASES:
        if target != 'ledger':
            continue
        L = mutate(S.LEDGER)
        cases.append({'name': name, 'python_codes': sorted(want), 'ledger': L, 'summary': summary(L) if not want else None})
    json.dump({'article_id': V.ARTICLE_ID, 'article_version': V.ARTICLE_V, 'ledger': S.LEDGER, 'summary': summary(S.LEDGER),
               'cases': cases}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == '__main__':
    sys.exit(main())
