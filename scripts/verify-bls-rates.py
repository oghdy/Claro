#!/usr/bin/env python3
"""W-3 BLS 변화율 · 증감을 기계로 확인한다 — bls-rates.ts 와 따로 짠 계산으로 다시 계산해 견준다.

    python3 scripts/verify-bls-rates.py            # 10월 rates.json · 9월 bls-rates.json
    python3 scripts/verify-bls-rates.py --report   # + 계산값 · 대조 한 줄씩

읽는 것: packages/pipeline/data/events/FOMC-20261028/bls/{bls.json, rates.json} · packages/pipeline/data/p3-golden/FOMC-20260916/bls-rates.json ·
         fixtures/store.json (9월 골든 — 대조의 정답) · packages/pipeline/data/events/FOMC-20261028/p3/graph.json (연준 인용 — 대조)
  A. 판     source 가 bls.json 의 그 응답 (source_id · label · 받은 때 · sha256 = sha256(SourceDocument.text)) · vintage.fetched = 받은 날 (BR_VINTAGE)
  B. 입력   입력마다 span 의 글 = passage · passage 의 year · period · value = 입력 · section 의 시리즈 블록 안 · fact_id 가 있으면 그 사실의 _key 와 맞다 ·
            vintage.footnotes = 입력 각주의 합 (BR_INPUT)
  C. 규칙   BLS 발표 방식 — 1년 전 대비는 계절조정 안 한 시리즈 (CUUR · WPU) · 전월 대비 · 증감은 계절조정 (CUSR · WPS · CES · LNS) · 입력 달 = 그 달과 lag 달 전 ·
            사건의 달 × 측정마다 정확히 한 줄 (BR_RULE)
  D. 값     Decimal 로 다시 계산 — (지금/전 − 1) × 100 · 소수 한 자리 ROUND_HALF_UP · "-0.0" 없음 · 증감 = 차 (BR_VALUE)
  E. 대조   골든 조각이 fixtures 의 그 사실 글에 있다 (없으면 ERROR) · 연준 조각이 그래프에 없으면 WARN · 정답 수가 조각 안에 있다 (천 명은 ",000") ·
            computed · match 를 다시 계산해 같다 ·
            tally = 줄에서 센 것 (BR_COMPARE)
  F. 자리   계산값이 사실 그래프에 들어가지 않았다 — 계약에 자리가 없다 (W-3 _open W3-a). RATE- label 이 그래프에 없다 (BR_PLACE)

exit 0 OK · 1 FAIL
"""
import copy, hashlib, json, os, re, sys
from decimal import Decimal, ROUND_HALF_UP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)
SRC_EVENT = 'FOMC-20261028'
FILES = {
    'FOMC-20261028': ('packages/pipeline/data/events/FOMC-20261028/bls/rates.json', 'graph', ['2026-08', '2026-09']),
    'FOMC-20260916': ('packages/pipeline/data/p3-golden/FOMC-20260916/bls-rates.json', 'golden', ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']),
}
# BLS 발표 방식 — bls-rates.ts MEASURES 와 따로 적는다 (한쪽이 바뀌면 여기서 걸린다)
RULES = {
    'CPI_ALL_1M': ('CUSR0000SA0', 'pct', 1), 'CPI_ALL_12M': ('CUUR0000SA0', 'pct', 12),
    'CPI_CORE_1M': ('CUSR0000SA0L1E', 'pct', 1), 'CPI_CORE_12M': ('CUUR0000SA0L1E', 'pct', 12),
    'CPI_ENERGY_1M': ('CUSR0000SA0E', 'pct', 1),
    'PPI_FD_1M': ('WPSFD4', 'pct', 1), 'PPI_FD_12M': ('WPUFD4', 'pct', 12),
    'PAYROLL_1M': ('CES0000000001', 'diff', 1), 'TEMP_LAYOFF_1M': ('LNS13023653', 'diff', 1),
}
NSA = ('CUUR', 'WPU')  # 계절조정 안 함 — 1년 전 대비에만
RATE_FIELDS = ['label', 'measure', 'ko', 'month', 'op', 'lag', 'value', 'unit', 'unrounded', 'inputs', 'vintage']
INPUT_FIELDS = ['role', 'series', 'month', 'value', 'footnotes', 'fact_id', 'fact_label', 'source_id', 'section', 'span_start', 'span_end', 'passage']
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def rj(p):
    return json.load(open(p, encoding='utf-8'))


def load():
    d = R('packages/pipeline/data/events', SRC_EVENT)
    return {
        'bls': rj(os.path.join(d, 'bls/bls.json')),
        'rates': {code: rj(R(f[0])) for code, f in FILES.items()},
        'golden': {f['label']: f['claim_text'] for f in rj(R('fixtures/store.json'))['facts']},
        'graph': rj(os.path.join(d, 'p3/graph.json')),
    }


def back(ym, k):
    y, m = int(ym[:4]), int(ym[5:7]) - k
    while m <= 0:
        m += 12
        y -= 1
    while m > 12:
        m -= 12
        y += 1
    return f'{y:04d}-{m:02d}'


def months_between(a, b):
    return (int(b[:4]) - int(a[:4])) * 12 + int(b[5:7]) - int(a[5:7])


def series_data(text):
    """응답을 JSON 으로 읽어 시리즈 → {(year, period): (value, footnotes)} — bls-rates.ts 의 정규식 길과 다른 길"""
    out = {}
    for s in json.loads(text)['Results']['series']:
        out[s['seriesID']] = {(x['year'], x['period']): (x['value'], [f['text'] for f in x['footnotes'] if f and f.get('text')]) for x in s['data']}
    return out


def blocks(text):
    cps = list(text)
    flat = ''.join(cps)
    hits = [(m.group(1), m.start()) for m in re.finditer(r'"seriesID"\s*:\s*"([^"]+)"', flat)]
    return {h[0]: (h[1], hits[i + 1][1] if i + 1 < len(hits) else len(cps)) for i, h in enumerate(hits)}


def pct(to, frm, places):
    v = (Decimal(to) / Decimal(frm) - 1) * 100
    q = v.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = f'{q:.{places}f}'
    return '0.' + '0' * places if q == 0 else s


def diff(to, frm):
    q = Decimal(to) - Decimal(frm)
    return '0' if q == 0 else str(q)


def avg(data, series, a, b):
    to, frm = data[series].get((b[:4], 'M' + b[5:7])), data[series].get((a[:4], 'M' + a[5:7]))
    if not to or not frm:
        return None
    v = ((Decimal(to[0]) - Decimal(frm[0])) / months_between(a, b)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
    return f'{v:.1f}'


def check(b):
    errs, warns = [], []
    E = lambda c, m: errs.append((c, m))
    bls = b['bls']
    src, doc = bls['sources'][0], bls['source_documents'][0]
    text = doc['text']
    cps = list(text)
    data = series_data(text)
    blk = blocks(text)
    keys = {f['fact_id']: f['_key'] for f in bls['facts']}
    graph_labels = {f['label'] for f in b['graph']['facts']}
    graph_text = {f['label']: f['claim_text'] for f in b['graph']['facts']}

    for code, (rel, against, months) in FILES.items():
        r = b['rates'][code]
        # A. 판
        s = r.get('source', {})
        if s.get('source_id') != src['source_id'] or s.get('label') != src['label'] or s.get('fetched_at') != bls['fetch']['fetched_at'] \
                or s.get('text_sha256') != bls['fetch']['text_sha256'] or sha(text) != bls['fetch']['text_sha256']:
            E('BR_VINTAGE', f'{code}: source 가 bls.json 의 응답과 다르다 (id · label · 받은 때 · sha256)')
        fetched = bls['fetch']['fetched_at'][:10]
        # C. 사건의 달 × 측정마다 한 줄
        want = {(k, m) for k in RULES for m in months}
        have = [(x.get('measure'), x.get('month')) for x in r.get('rates', [])]
        if sorted(have) != sorted(want) or len(set(have)) != len(have):
            E('BR_RULE', f'{code}: 줄이 (측정 {len(RULES)} × 달 {months}) 와 다르다 — 빠짐 {sorted(want - set(have))[:3]} · 넘침 {sorted(set(have) - want)[:3]}')
        for x in r.get('rates', []):
            lab = x.get('label', '?')
            if list(x.keys()) != RATE_FIELDS:
                E('BR_RULE', f'{code} {lab}: 필드 {list(x.keys())}')
                continue
            rule = RULES.get(x['measure'])
            if not rule:
                E('BR_RULE', f'{code} {lab}: 모르는 측정 {x["measure"]}')
                continue
            series, kind, lag = rule
            ins = x['inputs']
            # C. 규칙
            if lag == 12 and not series.startswith(NSA) or lag == 1 and series.startswith(NSA):
                E('BR_RULE', f'{code} {lab}: 규칙 표가 BLS 방식과 어긋남')
            if x['lag'] != lag or x['op'] != {'pct': 'pct_change', 'diff': 'level_change'}[kind]:
                E('BR_RULE', f'{code} {lab}: op · lag = {x["op"]} · {x["lag"]} — BLS 방식 {kind} · {lag}')
            if len(ins) != 2 or [i.get('role') for i in ins] != ['to', 'from']:
                E('BR_RULE', f'{code} {lab}: 입력은 to · from 둘')
                continue
            if any(i.get('series') != series for i in ins):
                E('BR_RULE', f'{code} {lab}: 입력 시리즈 {[i.get("series") for i in ins]} — BLS 방식은 {series} ({"계절조정 안 함" if lag == 12 else "계절조정"})')
            if ins[0].get('month') != x['month'] or ins[1].get('month') != back(x['month'], lag):
                E('BR_RULE', f'{code} {lab}: 입력 달 {ins[0].get("month")} · {ins[1].get("month")} — {x["month"]} 와 {lag} 달 전이어야')
            if x['label'] != f'RATE-{x["measure"]}-{x["month"][:4]}M{x["month"][5:]}':
                E('BR_RULE', f'{code} {lab}: label 모양')
            # B. 입력 — 원문에서
            for i in ins:
                if list(i.keys()) != INPUT_FIELDS:
                    E('BR_INPUT', f'{code} {lab}: 입력 필드 {list(i.keys())}')
                    continue
                if i['source_id'] != src['source_id']:
                    E('BR_INPUT', f'{code} {lab}: 입력 source_id 가 그 응답이 아니다')
                if ''.join(cps[i['span_start']:i['span_end']]) != i['passage']:
                    E('BR_INPUT', f'{code} {lab}: {i["series"]} {i["month"]} span 의 글 ≠ passage')
                bl = blk.get(i['section'])
                if i['section'] != i['series'] or not bl or not (bl[0] <= i['span_start'] and i['span_end'] <= bl[1]):
                    E('BR_INPUT', f'{code} {lab}: {i["series"]} {i["month"]} 구절이 그 시리즈 블록 밖')
                m = re.match(r'"year"\s*:\s*"(\d{4})"\s*,\s*"period"\s*:\s*"M(\d\d)".*?"value"\s*:\s*"([^"]*)"', i['passage'])
                if not m or f'{m.group(1)}-{m.group(2)}' != i['month'] or m.group(3) != i['value']:
                    E('BR_INPUT', f'{code} {lab}: {i["series"]} {i["month"]} 구절의 해 · 달 · 값 ≠ 입력 ({i["value"]})')
                got = data.get(i['series'], {}).get((i['month'][:4], 'M' + i['month'][5:]))
                if not got or got[0] != i['value'] or got[1] != i['footnotes']:
                    E('BR_INPUT', f'{code} {lab}: {i["series"]} {i["month"]} 값 · 각주가 응답(JSON 으로 읽은 것)과 다르다 — 응답 {got}')
                if i['fact_id'] is not None and keys.get(i['fact_id']) != f'{i["series"]}|{i["month"][:4]}|M{i["month"][5:]}':
                    E('BR_INPUT', f'{code} {lab}: fact_id 가 그 값의 BLS 사실이 아니다')
            v = x['vintage']
            if v.get('source_label') != src['label'] or v.get('fetched') != fetched or v.get('footnotes') != list(dict.fromkeys(ins[0]['footnotes'] + ins[1]['footnotes'])):
                E('BR_VINTAGE', f'{code} {lab}: vintage (판 {v.get("source_label")} · {v.get("fetched")} · 각주) 가 입력 · 응답과 다르다')
            # D. 값 — 응답에서 따로 읽은 값으로
            a = data.get(series, {}).get((x['month'][:4], 'M' + x['month'][5:]))
            f = data.get(series, {}).get((back(x['month'], lag)[:4], 'M' + back(x['month'], lag)[5:]))
            if not a or not f:
                E('BR_VALUE', f'{code} {lab}: 응답에 입력 값이 없다')
                continue
            want_v = pct(a[0], f[0], 1) if kind == 'pct' else diff(a[0], f[0])
            want_u = pct(a[0], f[0], 4) if kind == 'pct' else None
            if x['value'] != want_v or x['unrounded'] != want_u:
                E('BR_VALUE', f'{code} {lab}: 값 {x["value"]} (반올림 전 {x["unrounded"]}) — 다시 계산 {want_v} ({want_u})')
            if x['value'].startswith('-0') and Decimal(x['value']) == 0:
                E('BR_VALUE', f'{code} {lab}: "-0.0"')
            # F. 자리
            if x['label'] in graph_labels:
                E('BR_PLACE', f'{code} {lab}: 계산값이 사실 그래프에 있다 — 계약에 자리가 없다 (W3-a)')

        # E. 대조
        rows = r.get('compare', {}).get('rows', [])
        by = {(x['measure'], x['month']): x['value'] for x in r.get('rates', [])}
        texts = b['golden'] if against == 'golden' else graph_text
        for c in rows:
            anchored = c['fragment'] in texts.get(c['against'], '')
            if not anchored:
                if against == 'golden':
                    E('BR_COMPARE', f'{code}: 골든 {c["against"]} 글에 조각 "{c["fragment"]}" 이 없다 — 정답이 골든에 묶이지 않았다')
                else:
                    warns.append(f'{code}: 그래프 {c["against"]} 글에 조각 "{c["fragment"]}" 이 없다 (그래프를 다시 지어 label 이 바뀌었나) — 대조 안 됨')
            if c['kind'] != 'none' and not re.search(r'(?<![\d.])' + re.escape(c['expected'].lstrip('-')) + r'(?![\d.]|,\d)|(?<![\d.])' + re.escape(c['expected'].lstrip('-')) + r',000(?![\d])', c['fragment']):
                E('BR_COMPARE', f'{code}: {c["against"]} 정답 {c["expected"]} 이 조각 "{c["fragment"]}" 에 없다')
            if c['kind'] == 'rate':
                comp = by.get((c['measure'], c['month']))
            elif c['kind'] == 'level':
                got = data.get(c['series'], {}).get((c['month'][:4], 'M' + c['month'][5:]))
                comp = got[0] if got else None
            elif c['kind'] == 'avg':
                comp = avg(data, c['series'], c['from'], c['to'])
            else:
                comp = None
            match = None
            if c['kind'] != 'none' and anchored and comp is not None:
                if c['kind'] == 'avg' and c.get('approx'):
                    match = (Decimal(comp) / c['approx']).quantize(Decimal(1), rounding=ROUND_HALF_UP) * c['approx'] == Decimal(c['expected'])
                else:
                    match = comp == c['expected']
            if c.get('anchored') != anchored or c.get('computed') != comp or c.get('match') != match:
                E('BR_COMPARE', f'{code}: {c["against"]} "{c["fragment"]}" — 저장 (조각 {c.get("anchored")} · 계산 {c.get("computed")} · 같음 {c.get("match")}) ≠ 다시 (조각 {anchored} · 계산 {comp} · 같음 {match})')
        t = r.get('compare', {}).get('tally', {})
        want_t = {'rows': len(rows), 'compared': sum(c.get('match') is not None for c in rows), 'match': sum(c.get('match') is True for c in rows),
                  'differ': sum(c.get('match') is False for c in rows), 'not_compared': sum(c['kind'] == 'none' for c in rows), 'anchor_lost': sum(not c.get('anchored') for c in rows)}
        if t != want_t:
            E('BR_COMPARE', f'{code}: tally {t} ≠ 줄에서 센 것 {want_t}')
    return errs, warns


def main():
    print('verify-bls-rates')
    b = load()
    errs, warns = check(b)
    for code, (rel, against, months) in FILES.items():
        r = b['rates'][code]
        t = r['compare']['tally']
        print(f'  {code} {os.path.basename(rel)}: 계산 {len(r["rates"])} (달 {months[0]} ~ {months[-1]} · 측정 {len(RULES)}) · 판 {r["source"]["label"]} {r["source"]["fetched_at"][:10]} · '
              f'대조({"9월 골든" if against == "golden" else "연준 인용"}) {t["rows"]} 줄 — 견줌 {t["compared"]} · 같음 {t["match"]} · 다름 {t["differ"]} · 대조 안 함 {t["not_compared"]}')
        if '--report' in sys.argv:
            for x in r['rates']:
                print(f'    {x["label"]} {x["value"]} {x["unit"]} ({x["inputs"][0]["value"]} ÷ {x["inputs"][1]["value"]})')
            for c in r['compare']['rows']:
                print(f'    {c["against"]} "{c["fragment"]}" 글 {c.get("expected", "-")} · 계산 {c["computed"]} · {({True: "같음", False: "다름", None: "대조 안 함"})[c["match"]]}')
    for w in warns:
        print(f'  WARN {w}')
    for cde, m in errs:
        print(f'  ERROR {cde}: {m}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
