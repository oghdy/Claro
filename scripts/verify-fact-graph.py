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
  --- P-3b (D42) — 구절이 원문에 있다 ≠ 그 구절에서 이 글이 나온다 ---
  E. 칸       표 사실(_table)마다: 머리 줄 · 줄이 원문의 한 줄 그대로 · 구절 안에 있다 · '|' 로 나눈 머리 칸[h] = 칸 이름 · 줄 칸[r] = 값 ·
              r - h = 표의 정해진 값 (packages/pipeline/table-rules.json offsets) · 글에 "칸 이름 값" 이 그대로 · 날짜(event_at)를 줄에서 다시 낸 것과 같다 ·
              사건 날 뒤의 줄이 아니다 · 읽는 방법이 그 문서의 규칙과 같다 (FG_CELL · FG_AFTER)
  F. 표와 모델 표 문서(TABLE)에 모델 사실이 없다 · 글 안의 표(MIXED)의 줄에 모델 사실의 span 이 없다 · 모델이 받은 글(input_sha256) = 검사가 표를 가려 다시 낸 글 (FG_TABLE_MODEL)
  G. 수량어   모델 사실의 글 수량어가 구절의 수량어와 대응표대로 (packages/pipeline/fact-check-rules.json) (FG_QUANTIFIER)
  H. 수       모델 사실의 글 숫자가 구절 · 문서 공개일 · 제목에 있다 (FG_NUMBER)
  I. 묶기     묶인 사실들의 fact_type · event_at 이 같고 글의 수 · 수량어가 같다 (FG_MERGE)

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
]
EVENT_DATES = {'FOMC-20261028': '2026-10-28', 'FOMC-20260916': '2026-09-16'}
TABLE_RULES = json.load(open(os.path.join(ROOT, 'packages/pipeline/table-rules.json'), encoding='utf-8'))
CHECK_RULES = json.load(open(os.path.join(ROOT, 'packages/pipeline/fact-check-rules.json'), encoding='utf-8'))
SUB = {'treasury_par_yield': 'treasury_par_yield', 'eia_daily': 'eia_history', 'eia_weekly': 'eia_history', 'sep_table1': 'sep', 'sep_dots': 'sep', 'sep_risk': 'sep', 'omo_rates': 'omo_rates', 'pipe_blocks': 'pipe_blocks'}
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
        meta = {m['source_id']: m for m in rj(R('fixtures/store.json'))['sources']}
        for x in rec['documents']:
            if x['status'] == 'STORED':
                b['docs'][x['source_id']] = {'label': x['label'], 'text': p1.get(x['source_id']), 'in_git': True, 'sha': x['text_sha256'], 'meta': meta.get(x['source_id'], {})}
    else:
        d = R('packages/pipeline/data/events', code)
        own = {x['source_id']: x['text'] for x in rj(os.path.join(d, 'store.documents.json'))['source_documents']}
        meta = {m['source_id']: m for m in rj(os.path.join(d, 'store.json'))['sources']}
        for x in rj(os.path.join(d, 'fetch.json'))['documents']:
            if x['status'] != 'STORED':
                continue
            if x['text_in'] == 'cache':
                cp = R('packages/pipeline/.cache/events', code, 'text', safe(x['label']) + '.txt')
                t = open(cp, encoding='utf-8').read() if os.path.exists(cp) else None
            else:
                t = own.get(x['source_id']) if x['text_in'] == 'store.documents.json' else p1.get(x['source_id'])
            b['docs'][x['source_id']] = {'label': x['label'], 'text': t, 'in_git': x['text_in'] != 'cache', 'sha': x['text_sha256'], 'meta': meta.get(x['source_id'], {})}
        bls = rj(os.path.join(d, 'bls/bls.json'))
        if bls:
            for s, sd in zip(bls['sources'], bls['source_documents']):
                b['docs'][s['source_id']] = {'label': s['label'], 'text': sd['text'], 'in_git': True, 'sha': bls['fetch']['text_sha256'], 'meta': s, 'bls': True}
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



# ── P-3b 규칙 (table-rules.json · fact-check-rules.json 을 읽는다 — 파이프라인 src/tables.ts · src/checks.ts 와 따로 다시 짠 것) ──
def cells(line):
    return [c.strip() for c in line.split('|')]


def clean(s):
    return re.sub(r'(?<=[A-Za-z])\d+$', '', s)


def doc_rule(url):
    for r in TABLE_RULES['documents']:
        if url and re.search(r['url'], url):
            return r
    return None


def pipe_blocks(text):
    """글 안의 표 덩어리 — 머리 줄 '| …' (첫 칸 빈 칸) + 칸 수가 같은 줄들 ('| ' 로 시작하고 칸 수가 다른 줄은 단위 설명). (머리 줄 번호, 마지막 줄 번호)"""
    ls, out, i = text.split('\n'), [], 0
    while i < len(ls):
        head = cells(ls[i])
        if re.match(r'^\| \S', ls[i]) and len(head) >= 2 and head[0] == '':
            j, rows = i + 1, 0
            while j < len(ls) and '|' in ls[j]:
                c = cells(ls[j])
                if ls[j].startswith('| ') and len(c) != len(head):
                    pass
                elif len(c) == len(head) and c[0] != '':
                    rows += 1
                else:
                    break
                j += 1
            if rows:
                out.append((i, j - 1))
                i = j
                continue
        i += 1
    return out


def masked(text):
    ls = text.split('\n')
    for a, z in reversed(pipe_blocks(text)):
        ls[a:z + 1] = [TABLE_RULES['mask_line']]
    return '\n'.join(ls)


def line_ranges(text):
    out, at = [], 0
    for t in text.split('\n'):
        out.append((at, at + len(t)))
        at += len(t) + 1
    return out


_Q = CHECK_RULES['quantifiers']
_EN = sorted(((w, c['id']) for c in _Q['classes'] for w in c['en']), key=lambda x: -len(x[0]))
_KO = sorted(((w, c['id']) for c in _Q['classes'] for w in c['ko']), key=lambda x: -len(x[0]))
_alt = lambda ws: '|'.join(re.escape(w) for w in sorted(set(ws), key=len, reverse=True))
_ENN = _alt(w for n in _Q['nouns'] for w in n['en'])
_KON = '(?<![가-힣])(?:' + _alt(w for n in _Q['nouns'] for w in n['ko']) + ')'
_EN_RE = re.compile(r'\b(' + '|'.join(re.escape(w) for w, _ in _EN) + r')\s+(?:of\s+(?:the\s+|these\s+|those\s+)?)?(?:[A-Za-z-]+\s+){0,2}?(' + _ENN + r')\b', re.I)
_KQ = '|'.join(re.escape(w) for w, _ in _KO)
_KO_FWD = re.compile(r'(' + _KQ + r')\s*(?:명의|명|의)?\s*(?:[가-힣A-Za-z]+\s+)?' + _KON)
_KO_REV = re.compile(_KON + r'\s*(?:들)?\s*(?:중\s*)?(?:의\s*)?(' + _KQ + ')')


def en_matches(passages):
    ids = {w.lower(): i for w, i in _EN}
    return [(ids[m.group(1).lower()], m.group(2).lower()) for p in passages for m in _EN_RE.finditer(p)]


def en_q(passages):
    return sorted({i for i, _ in en_matches(passages)})


def pair_re(en):
    return re.compile('(?<![가-힣])(?:' + _alt(next(n['ko'] for n in _Q['nouns'] if en in n['en'])) + ')')


def ko_q(claim):
    ids = dict(_KO)
    return sorted({ids[m.group(1)] for m in list(_KO_FWD.finditer(claim)) + list(_KO_REV.finditer(claim))})


def quantifier_problem(claim, passages):
    E, K = en_q(passages), ko_q(claim)
    extra = [k for k in K if k not in E]
    if extra:
        return f'글의 수량어 {extra} 가 구절에 없다 (구절 {E})'
    rest = claim
    for w, _ in _KO:
        rest = rest.replace(w, ' ')
    for bw in _Q['ko_banned']:
        if re.search(re.escape(bw) + r'\s*(?:의\s*)?' + _KON + '|' + _KON + r'\s*(?:들)?\s*(?:중\s*)?(?:의\s*)?' + re.escape(bw), rest):
            return f'대응표에 없는 말 {bw!r}'
    if not K and any(pair_re(n).search(claim) for _, n in en_matches(passages)):
        return f'구절의 수량어 {E} 를 글에서 뺐다'
    return None


_N = CHECK_RULES['numbers']
_WORDS = {**_N['number_words'], **_N['ordinals'], **_N['month_names']}
_WORD_RE = re.compile(r'\b(' + '|'.join(re.escape(w) for w in sorted(_WORDS, key=len, reverse=True)) + r')\b', re.I)


def _norm(t):
    t = t.replace(',', '')
    if '.' not in t:
        return str(int(t))
    a, b = t.split('.')
    return f'{int(a)}.{b}'


def num_tokens(s):
    for k, v in _N['fractions'].items():
        s = s.replace(k, ' ' + v)
    s = re.sub(r'([0-9]),(?=[0-9]{3}(?![0-9]))', r'\1', s)
    return [_norm(m.group(0)) for m in re.finditer(r'[0-9]+(?:\.[0-9]+)?', s)]


def passage_numbers(texts):
    out = set()
    for t in texts:
        out.update(num_tokens(t))
        out.update(str(_WORDS[m.group(1).lower()]) for m in _WORD_RE.finditer(t))
    return out


def numbers_missing(claim, passages, allowed):
    have = passage_numbers(list(passages) + list(allowed))
    for ko, en in _N['one_units'].items():
        if any(re.search(r'\b' + en, p, re.I) for p in passages):
            claim = re.sub(r'(?<![0-9.])1\s*' + ko, ' ', claim)
    return sorted({x for x in num_tokens(claim) if x not in have})


def number_set(claim):
    return sorted(passage_numbers([re.sub(r'[A-Za-z]+', ' ', claim)]))


_MON = {m: i + 1 for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}
_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']


def table_date(t, f, passages, doc):
    """표 줄에서 날짜를 다시 낸다 — 파이프라인과 따로. 낼 수 없으면 None (pipe_blocks)"""
    import datetime
    h, row = t['handler'], cells(t['row_line'])
    if h == 'treasury_par_yield':
        m, d, y = row[0].split('/')
        return f'{y}-{m}-{d}'
    if h == 'eia_daily':
        m = re.match(r'^(\d{4}) ([A-Z][a-z]{2})- ?(\d{1,2}) to', row[0])
        start = datetime.date(int(m.group(1)), _MON[m.group(2).lower()], int(m.group(3)))
        k = t['cells'][0]['r']
        return (start + datetime.timedelta(days=k - 1)).isoformat()
    if h == 'eia_weekly':
        y, mon = row[0].split('-')
        mm, dd = row[t['cells'][0]['r'] - 1].split('/')
        yy = int(y) - 1 if int(mm) == 12 and _MON[mon.lower()] == 1 else int(y)
        return f'{yy}-{mm}-{dd}'
    if h == 'omo_rates':
        y = passages[-1].split('\n')[0].strip()
        m = re.match(r'^([A-Z][a-z]+) (\d{1,2})\*?$', row[0])
        return f'{y}-{_MONTHS.index(m.group(1).lower()) + 1:02d}-{int(m.group(2)):02d}'
    if h in ('sep_table1', 'sep_dots', 'sep_risk'):
        tm = re.search(r'Table 1\. .*, ([A-Z][a-z]+) (\d{4})', doc['text'])
        vm, vy = _MONTHS.index(tm.group(1).lower()) + 1, int(tm.group(2))
        pm = re.match(r'^([A-Z][a-z]+) projections?$', row[0]) if h != 'sep_dots' else None
        if not pm or _MONTHS.index(pm.group(1).lower()) + 1 == vm:
            return str(doc['meta'].get('published_at', ''))[:10]
        m = _MONTHS.index(pm.group(1).lower()) + 1
        return f'{vy - 1 if m > vm else vy}-{m:02d}'
    return None


def check_p3b(b, g, w0, E, W):
    """E · F · G · H · I — P-3b 검사"""
    code = b['code']
    ev_date = EVENT_DATES[code]
    facts = {f['fact_id']: f for f in g['facts']}
    srcs = {}
    cp = (b['cache_passages'] or {}).get('passages', {})
    seen = Counter()
    for r in g['fact_sources']:
        p = r.get('_passage')
        if p is None and r.get('_passage_in') == 'cache':
            k = r.get('_from', '')
            p = cp.get(f'{k}/{seen[k]}')
            seen[k] += 1
        srcs.setdefault(r['fact_id'], []).append((r, p))
    for fid, f in facts.items():
        w = f'{w0} {f["label"]}'
        rows = srcs.get(fid, [])
        is_bls = str(f.get('extraction_version', '')).startswith('p3-bls')
        t = f.get('_table')
        doc = b['docs'].get(rows[0][0]['source_id']) if rows else None
        if doc is None:
            continue
        rule = doc_rule(doc['meta'].get('url'))
        # E. 칸
        if t is not None:
            passages = [p for _, p in rows]
            if not str(f.get('extraction_version', '')).startswith('p3-tables') or f.get('extraction_model'):
                E('FG_CELL', f'{w}: 표 사실인데 뽑은 판이 표 읽기가 아니다')
            if rule is None or SUB.get(t['handler']) != rule['handler']:
                E('FG_CELL', f'{w}: 읽는 방법 {t["handler"]} 가 문서 {doc["label"]} 의 규칙 ({rule and rule["handler"]}) 과 다르다')
                continue
            lines = set(doc['text'].split('\n'))
            if t['header_line'] not in lines or t['row_line'] not in lines:
                E('FG_CELL', f'{w}: 머리 줄 · 줄이 원문의 한 줄이 아니다')
                continue
            if any(p is None for p in passages):
                W('FG_PASSAGE_NOT_HERE', f'{w}: 구절이 이 기계에 없다 — 칸을 대 보지 못했다')
                continue
            if t['row_line'] not in passages[-1].split('\n') or not any(t['header_line'] in p.split('\n') for p in passages):
                E('FG_CELL', f'{w}: 머리 줄 · 줄이 구절 안에 없다')
            hc, rc = cells(t['header_line']), cells(t['row_line'])
            off = TABLE_RULES['offsets'][t['handler']]
            for c in t['cells']:
                ok = 0 <= c['h'] < len(hc) and 0 <= c['r'] < len(rc) and c['r'] - c['h'] == off and hc[c['h']] == c['col'] and rc[c['r']] == c['value'] and c['shown'] == clean(c['col'])
                if not ok:
                    E('FG_CELL', f'{w}: 칸 짝이 원문과 다르다 — 머리[{c["h"]}]={hc[c["h"]] if 0 <= c["h"] < len(hc) else None!r} 줄[{c["r"]}]={rc[c["r"]] if 0 <= c["r"] < len(rc) else None!r} · 적힌 것 {c["col"]!r} {c["value"]!r} (r-h 는 {off} 이어야)')
                elif f'{c["shown"]} {c["value"]}' not in f['claim_text']:
                    E('FG_CELL', f'{w}: 글에 "{c["shown"]} {c["value"]}" 가 없다')
            gr = t.get('group')
            if gr:
                gc = cells(gr['line'])
                if gr['line'] not in lines or not (0 <= gr['index'] < len(gc)) or gc[gr['index']] != gr['col'] or gr['shown'] != clean(gr['col']) or gr['shown'] not in f['claim_text']:
                    E('FG_CELL', f'{w}: 묶음 머리 (Median · Central Tendency · Range) 짝이 원문과 다르다')
                per = (len(hc)) // (len(gc) - 1)
                if any(c['h'] // per != gr['index'] - 1 for c in t['cells']):
                    E('FG_CELL', f'{w}: 칸이 묶음 머리 {gr["col"]} 의 범위 밖이다')
            d = table_date(t, f, passages, doc)
            if d is not None and f.get('event_at') != d:
                E('FG_CELL', f'{w}: event_at {f.get("event_at")} ≠ 줄의 날짜 {d}')
            if f.get('event_at') and str(f['event_at'])[:10] > ev_date:
                E('FG_AFTER', f'{w}: 사건 날({ev_date}) 뒤의 표 줄')
            continue
        if is_bls:
            continue
        # F. 표와 모델
        if rule and rule['kind'] == 'TABLE':
            E('FG_TABLE_MODEL', f'{w}: 표 문서 {doc["label"]} 에 모델 사실이 있다 — 표는 코드가 읽는다 (D42)')
            continue
        if rule and rule['kind'] == 'MIXED' and doc['text'] is not None:
            lr = line_ranges(doc['text'])
            regions = [(lr[a][0], lr[z][1]) for a, z in pipe_blocks(doc['text'])]
            for r, _ in rows:
                if r['source_id'] == doc_id(b, doc) and any(r['span_start'] < e and s < r['span_end'] for s, e in regions):
                    E('FG_TABLE_MODEL', f'{w}: 모델 사실의 구절이 글 안의 표 줄에 있다 ({doc["label"]})')
        # G · H — 머리 사실(첫 _from)의 구절로
        head = f.get('_from', [None])[0]
        hp = [p for r, p in rows if r.get('_from') == head]
        if any(p is None for p in hp):
            W('FG_PASSAGE_NOT_HERE', f'{w}: 구절이 이 기계의 캐시에 없다 — 수량어 · 수를 대 보지 못했다')
            continue
        q = quantifier_problem(f['claim_text'], hp)
        if q:
            E('FG_QUANTIFIER', f'{w}: {q} — {f["claim_text"][:80]}')
        hdoc = b['docs'].get(next((r['source_id'] for r, _ in rows if r.get('_from') == head), None)) or doc
        miss = numbers_missing(f['claim_text'], hp, [str(hdoc['meta'].get('published_at', '')), str(hdoc['meta'].get('title', ''))])
        if miss:
            E('FG_NUMBER', f'{w}: 글의 수 {miss} 가 구절 · 문서 공개일 · 제목에 없다 — {f["claim_text"][:80]}')
        # I. 묶기
        if len(f.get('_from', [])) > 1:
            for c in f.get('_merge_conflicts', []):
                if ' fact_type:' in c or ' event_at:' in c:
                    E('FG_MERGE', f'{w}: 묶인 사실의 {c}')
            for o in f.get('_other_texts', []):
                txt = o.split(': ', 1)[1]
                if number_set(txt) != number_set(f['claim_text']) or ko_q(txt) != ko_q(f['claim_text']):
                    E('FG_MERGE', f'{w}: 묶인 사실의 글의 수 · 수량어가 다르다 — {o[:80]}')
    # F. 모델이 받은 글 = 검사가 표를 가려 다시 낸 글
    by_label = {d['label']: d for d in b['docs'].values()}
    for bf in g.get('built_from', []):
        d = by_label.get(bf['source_label'])
        if d is None or d['text'] is None:
            continue
        rule = doc_rule(d['meta'].get('url'))
        if rule and rule['kind'] == 'TABLE':
            E('FG_TABLE_MODEL', f'{w0} {bf["source_label"]}: 표 문서를 모델에 보냈다 (D42)')
            continue
        want = VD.sha256_text(masked(d['text']) if rule and rule['kind'] == 'MIXED' else d['text'])
        if bf.get('input_sha256') != want:
            E('FG_TABLE_MODEL', f'{w0} {bf["source_label"]}: 모델이 받은 글의 sha256 이 검사가 다시 낸 글과 다르다 (표를 가리지 않았나)')
    raw_by = {bf['source_label']: b['raw'].get(bf['raw']) for bf in g.get('built_from', [])}
    for lab, raw in raw_by.items():
        bf = next(x for x in g['built_from'] if x['source_label'] == lab)
        if raw is not None and raw.get('input_sha256') != bf.get('input_sha256'):
            E('FG_TABLE_MODEL', f'{w0} {lab}: 모델 출력 기록의 input_sha256 이 그래프와 다르다')


def doc_id(b, doc):
    return next(s for s, d in b['docs'].items() if d is doc)


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
        if not f.get('extraction_version') or (not f.get('extraction_model') and not str(f.get('extraction_version')).startswith(('p3-bls', 'p3-tables'))):
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
    for bucket in ('no_passage', 'multiple', 'bad_shape', 'quantifier_mismatch', 'number_mismatch'):
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
    if sum(cnt.get(k, 0) for k in ('verified', 'no_passage', 'multiple', 'bad_shape', 'quantifier_mismatch', 'number_mismatch')) != cnt.get('candidates', -1):
        E('FG_COUNTS', f'{w0}: 후보 수 ≠ 확인됨 + 구절 없음 + 여럿 + 모양 틀림 + 수량어 어긋남 + 수 어긋남')
    in_graph = {k for f in g['facts'] for k in f.get('_from', [])}
    for bucket in ('quantifier_mismatch', 'number_mismatch'):
        for c in g.get(bucket, []):
            if c['key'] in in_graph:
                E('FG_BUCKET', f'{w0}: {bucket} 의 {c["key"]} 가 그래프 사실에 들어 있다')
    check_p3b(b, g, w0, E, W)
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
