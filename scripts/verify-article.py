"""골든 article 픽스처 검증 (B-0.0b).

    python3 scripts/verify-article.py            # 골든 + fixtures/invalid/*.json
    python3 scripts/verify-article.py --report   # _fact_refs 가 빈/부분 문장 목록까지 출력
    python3 scripts/verify-article.py PATH ...   # 특정 파일만

검사
  D9   골든에 observed 전용 키(_findings 등)가 없다
  D15  resolves 키가 없다 / 마지막 제외 모든 슬라이드에 teaser (QA①) / goto == index+1 (선형 불변식)
  주석 모든 내용 단위가 _fact_refs 로 덮여 있고, span 을 이어붙이면 원문과 같다. ID 는 브리프·concept-library 에 있다
  D8   VOLATILE 은 as_of 필수 / DERIVED 의 출처는 전부 STABLE / DERIVED 는 published_at 으로 재계산해 불변식 확인

파일에 "_violation" 이 있으면 invalid 픽스처로 보고, 선언한 code 로 거부돼야 통과다.
또 골든과 정확히 한 군데만 달라야 한다(위반 하나만 주입).
"""
import calendar, datetime as dt, glob, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
BRIEF = os.path.join(ROOT, 'docs/findings/fomc-2026-09-brief.md')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')

FORBIDDEN_TOP = ('_findings', '_dom_inventory', '_transcription_notes', '_render_time_computation')
KINDS_WITH_REFS = ('fact', 'partial', 'derived_claim')
KINDS_NO_REFS = ('writing', 'unsupported', 'brief_text')
KINDS = KINDS_WITH_REFS + KINDS_NO_REFS + ('concept',)
SPLIT_TYPES = ('callout', 'closing', 'quote')


def strip(h):
    h = re.sub(r'<br\s*/?>', ' ', h)
    h = re.sub(r'<[^>]+>', '', h)
    return re.sub(r'\s+', ' ', h).strip()


def nows(s):
    return re.sub(r'\s+', '', s)


def known_ids():
    brief = open(BRIEF, encoding='utf-8').read()
    ids = set(re.findall(r'^\| (F\d\d) \|', brief, re.M)) | set(re.findall(r'^### (DC-[A-Z])\b', brief, re.M))
    lib = open(LIBRARY, encoding='utf-8').read()
    concepts = set(re.findall(r'^### (C-\d{4})\b', lib, re.M))
    return ids, concepts


# ---------------------------------------------------------------- 단위
def content_units(slide):
    """_fact_refs 로 덮여야 하는 단위: (where, plain text)"""
    out = [('h1', strip(slide['h1'].replace('\n', ' ')))]
    for i, b in enumerate(slide['blocks']):
        t = b['type']
        if t == 'body_text':
            out += [(f'blocks/{i}/paragraphs/{j}', strip(p['html'])) for j, p in enumerate(b['paragraphs'])]
        elif t in ('callout', 'closing'):
            out.append((f'blocks/{i}', strip(b['html'])))
        elif t == 'quote':
            if b.get('tag'):
                out.append((f'blocks/{i}/tag', b['tag']))
            out.append((f'blocks/{i}', strip(b['html'])))
        elif t == 'votes':
            out += [(f'blocks/{i}/cards/{j}', f"{c['when']} {c['tally']} {strip(c['what_html'])}") for j, c in enumerate(b['cards'])]
        elif t == 'timeline':
            out += [(f'blocks/{i}/items/{j}', f"{x['when']} {strip(x['html'])}") for j, x in enumerate(b['items'])]
        elif t == 'stats':
            out += [(f'blocks/{i}/rows/{j}', f"{r['k']} {r['v']}") for j, r in enumerate(b['rows'])]
        elif t == 'gauge':
            out += [(f'blocks/{i}/labels/{j}', f"{l['value_text']} {l['caption']}") for j, l in enumerate(b['labels'])]
        elif t == 'end_actions':
            pass
        else:
            raise ValueError(f'모르는 블록 타입 {t}')
    return out


def unit_text(slide, where):
    if where == 'kicker':
        return slide['kicker']
    if where == 'teaser':
        return slide['teaser']['qtext'] if slide.get('teaser') else None
    return dict(content_units(slide)).get(where)


# ---------------------------------------------------------------- D8 재계산
def date_range(v, published_at):
    if v == 'published_at':
        v = published_at
    if v is None:
        return None
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}', v):
        d = dt.date.fromisoformat(v)
        return (d, d)
    if re.fullmatch(r'\d{4}-\d{2}', v):
        y, m = map(int, v.split('-'))
        return (dt.date(y, m, 1), dt.date(y, m, calendar.monthrange(y, m)[1]))
    return None


def evaluate(entry, published_at):
    """'PASS' | 'FAIL' | 'UNVERIFIABLE'"""
    f = entry['formula']
    src = {s['key']: s['value'] for s in entry['derived_from']}
    val, chk = entry['value_at_authoring'], entry['check']
    ok = {'==': lambda a: a == val, '>': lambda a: a > val, '>=': lambda a: a >= val}[chk]

    if f['op'] == 'year_of':
        r = date_range(f['of'], published_at)
        results = [ok(r[0].year + f['offset'])]
        if 'target_year' in src:
            results.append(int(src['target_year']) == val)
        return 'PASS' if all(results) else 'FAIL'

    ra = date_range(src.get(f['from'], f['from']), published_at)
    rb = date_range(src.get(f['to'], f['to']), published_at)
    if ra is None or rb is None:
        return 'UNVERIFIABLE'
    ops = {
        'days_inclusive': lambda a, b: (b - a).days + 1,
        'weeks':          lambda a, b: round((b - a).days / 7),
        'months_round':   lambda a, b: round((b - a).days / 30.4375),
        'months':         lambda a, b: (b - a).days / 30.4375,
        'years':          lambda a, b: (b - a).days / 365.25,
        'years_floor':    lambda a, b: math.floor((b - a).days / 365.25),
    }
    fn = ops[f['op']]
    # 월 단위 값은 양 끝을 다 넣어본다. 전부 맞으면 PASS, 전부 틀리면 FAIL, 섞이면 UNVERIFIABLE
    outs = {ok(fn(a, b)) for a in set(ra) for b in set(rb)}
    return 'PASS' if outs == {True} else 'FAIL' if outs == {False} else 'UNVERIFIABLE'


# ---------------------------------------------------------------- 검사
def check(doc, ids, concepts):
    errs, warns = [], []            # errs: (code, msg)
    E = lambda code, msg: errs.append((code, msg))

    for k in FORBIDDEN_TOP:
        if k in doc:
            E('D9_OBSERVED_KEY', f'최상단에 {k} 가 있다')

    def walk(o, path=''):
        if isinstance(o, dict):
            for k, v in o.items():
                if k == 'resolves':
                    E('D15_RESOLVES', f'{path}/{k}')
                walk(v, f'{path}/{k}')
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f'{path}/{i}')
    walk(doc)

    pub = doc.get('_published_at')
    if not pub:
        E('D8_NO_PUBLISHED_AT', '_published_at 이 없다')

    for lv in doc['levels']:
        slides = lv['slides']
        if lv.get('slide_count') != len(slides):
            E('SLIDE_COUNT', f"{lv['id']}: slide_count={lv.get('slide_count')} 실제 {len(slides)}")
        for pos, s in enumerate(slides):
            tag = f"{lv['id']}[{pos}]"
            last = pos == len(slides) - 1
            if s['index'] != pos:
                E('INDEX', f'{tag}: index={s["index"]}')
            t = s.get('teaser')
            if not last and not (t and t.get('qtext')):
                E('D15_QA1_NO_TEASER', f'{tag}: 마지막이 아닌데 teaser 가 없다')
            if last and t:
                E('D15_LAST_HAS_TEASER', f'{tag}: 마지막 슬라이드에 teaser')
            if t and t.get('goto_index') != pos + 1:
                E('D15_NONLINEAR', f'{tag}: goto_index={t.get("goto_index")} (선형 불변식은 {pos + 1})')

            # ---- _fact_refs
            units = content_units(s)
            by_where = {}
            for r in s.get('_fact_refs', []):
                by_where.setdefault(r['where'], []).append(r)
                if r['kind'] not in KINDS:
                    E('FACTREF_KIND', f'{tag} {r["where"]}: kind={r["kind"]}')
                bad = [x for x in r['refs'] if x not in ids]
                if bad:
                    E('FACTREF_UNKNOWN_ID', f'{tag} {r["where"]}: 브리프에 없는 ID {bad}')
                if r['kind'] in KINDS_WITH_REFS and not r['refs']:
                    E('FACTREF_EMPTY', f'{tag} {r["where"]}: kind={r["kind"]} 인데 refs 가 비었다')
                if r['kind'] in KINDS_NO_REFS and r['refs']:
                    E('FACTREF_NONEMPTY', f'{tag} {r["where"]}: kind={r["kind"]} 인데 refs 가 있다')
                if r['kind'] == 'concept' and r.get('concept') not in concepts:
                    E('CONCEPT_UNKNOWN', f'{tag} {r["where"]}: concept={r.get("concept")}')
                if r.get('concept') and r['concept'] not in concepts:
                    E('CONCEPT_UNKNOWN', f'{tag} {r["where"]}: concept={r["concept"]}')
            for where, text in units:
                got = by_where.pop(where, None)
                if not got:
                    E('FACTREF_UNCOVERED', f'{tag} {where}: 주석 없음 — "{text[:40]}"')
                elif nows(''.join(r['span'] for r in got)) != nows(text):
                    E('FACTREF_SPAN_MISMATCH', f'{tag} {where}: span 을 이어붙인 것이 원문과 다르다')
            for where in by_where:
                E('FACTREF_DANGLING', f'{tag} {where}: 가리키는 단위가 없다')
            for c in s.get('_concept_ref', []):
                if c not in concepts:
                    E('CONCEPT_UNKNOWN', f'{tag} _concept_ref {c}')

            # ---- _volatility (D8)
            for v in s.get('_volatility', []):
                w = f'{tag} {v["where"]} "{v["span"]}"'
                txt = unit_text(s, v['where'])
                if txt is None or v['span'] not in txt:
                    E('VOL_SPAN', f'{w}: span 이 원문에 없다')
                cls = v.get('class')
                if cls not in ('STABLE', 'DERIVED', 'VOLATILE'):
                    E('VOL_CLASS', f'{w}: class={cls}')
                if cls == 'VOLATILE':
                    if not v.get('as_of'):
                        E('VOLATILE_MISSING_AS_OF', f'{w}: VOLATILE 인데 as_of 가 없다 (D8)')
                    elif not re.fullmatch(r'\d{4}-\d{2}(-\d{2})?', v['as_of']):
                        E('VOLATILE_BAD_AS_OF', f'{w}: as_of={v["as_of"]}')
                if cls == 'DERIVED':
                    vs = [x for x in v['derived_from'] if x.get('volatility') != 'STABLE']
                    if vs:
                        E('DERIVED_FROM_VOLATILE',
                          f'{w}: 출처 {[x["key"] for x in vs]} 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다')
                        continue
                    got = evaluate(v, pub)
                    if got == 'FAIL':
                        E('DERIVED_INVARIANT_FAIL', f'{w}: recompute(published_at) != value_at_authoring (D8 규칙 3)')
                    elif got != v.get('invariant'):
                        E('DERIVED_INVARIANT_MISMATCH', f'{w}: 기록 {v.get("invariant")} / 재계산 {got}')
                    if got == 'UNVERIFIABLE':
                        warns.append(f'{w}: DERIVED 불변식 검증 불가 — {v.get("note", "")}')
                    outside = [x['key'] for x in v['derived_from'] if not x['refs'] and not x.get('brief_loc')]
                    if outside:
                        warns.append(f'{w}: DERIVED 출처 {outside} 가 브리프 밖')
    return errs, warns


def leaf_diff(a, b, path=''):
    if isinstance(a, dict) and isinstance(b, dict):
        out = []
        for k in set(a) | set(b):
            if k == '_violation':
                continue
            if k not in a or k not in b:
                out.append(f'{path}/{k}')
            else:
                out += leaf_diff(a[k], b[k], f'{path}/{k}')
        return out
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return [path]
        return [p for i in range(len(a)) for p in leaf_diff(a[i], b[i], f'{path}/{i}')]
    return [] if a == b else [path]


def report(doc):
    from collections import Counter
    cnt = Counter()
    rows = []
    for lv in doc['levels']:
        for s in lv['slides']:
            for r in s['_fact_refs']:
                cnt[r['kind']] += 1
                if r['kind'] in ('unsupported', 'partial', 'brief_text'):
                    rows.append(f"  {r['kind']:<11} {lv['id']}[{s['index']}] {r['where']:<24} {r['span']}\n"
                                f"  {'':<11} └ {r.get('note', '')}")
    print('  kind 별 문장 수:', dict(sorted(cnt.items())))
    print('\n'.join(rows))


def main(argv):
    rep = '--report' in argv
    paths = [a for a in argv if not a.startswith('--')] or \
        [GOLDEN] + sorted(glob.glob(os.path.join(ROOT, 'fixtures/invalid/*.json')))
    ids, concepts = known_ids()
    golden = json.load(open(GOLDEN, encoding='utf-8'))
    failed = 0
    for p in paths:
        doc = json.load(open(p, encoding='utf-8'))
        rel = os.path.relpath(p, ROOT)
        errs, warns = check(doc, ids, concepts)
        viol = doc.get('_violation')
        if viol is None:
            print(f'{"PASS" if not errs else "FAIL"}  {rel}')
            for c, m in errs:
                print(f'   ERROR {c}: {m}')
            for w in warns:
                print(f'   WARN  {w}')
            failed += bool(errs)
            if rep and not errs:
                report(doc)
        else:
            codes = sorted({c for c, _ in errs})
            diffs = leaf_diff(golden, doc)
            ok = codes == [viol['code']] and len(diffs) == 1
            print(f'{"PASS" if ok else "FAIL"}  {rel}  — 거부 기대 {viol["code"]}')
            print(f'   검출: {codes}')
            for c, m in errs:
                print(f'   {c}: {m}')
            print(f'   골든과 다른 곳 {len(diffs)}군데: {diffs}')
            failed += not ok
    print('\nOK' if not failed else f'\n{failed}개 실패')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
