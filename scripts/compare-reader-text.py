"""옛 골든 → 새 골든 독자 글 대조 (B-0.1b).

    python3 scripts/compare-reader-text.py                  # 옛 골든 = git c46871d, 새 골든 = fixtures/
    python3 scripts/compare-reader-text.py --old PATH --new PATH

독자가 읽는 글자가 하나도 바뀌지 않았는지 문자 단위로 본다.
  대조하는 것  kicker · headline · 본문 문단 · 인용(출처 표시 + 글) · 목록(라벨 + 글) ·
              대조(라벨 + 값 + 글) · 표(라벨 + 값) · open_question
  허용하는 변환  `<br>` → `\\n` (계약 §6). 그 밖에는 한 글자라도 다르면 실패다.
  허용된 차이  ALLOWED 에 적힌 승인된 수정만 (지금 2건 — D23 #16 · D27 “올리자”). 위치 · 바꾼 부분이 정확히 맞아야 한다
              `<b>` 는 글의 일부로 대조한다 — 굵기 위치도 바뀌면 안 된다
  대조하지 않는 것 (계약이 버린다)  teaser 기호(Q · ·) · end_actions · 눈금 · 색 · modifier · style
  모양 대응도 본다  블록 종류 · 문단 무게(dim → secondary …) · 강조(hit → emphasized) · 장수 · 문단 수 · 항목 수

옛 골든의 span 경계는 대조하지 않는다 — 새 골든의 span 이음이 옛 글과 같은지만 본다.
이 스크립트는 변환기와 코드를 나누지 않는다 (변환기는 일회성이라 커밋하지 않았다).
"""
import difflib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD_REV = 'c46871d'                        # 옛 모양의 마지막 골든 (B-0.1a D22 반영 커밋)
OLD_REL = 'fixtures/fomc-2026-09.article.json'
NEW_DEFAULT = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
LEVEL_MAP = {'basic': 'basic', 'adv': 'advanced'}       # D20

# 허용된 차이 — 도윤이 승인한 독자 글 수정. 여기 적힌 것 말고는 한 글자도 달라선 안 된다.
# 위치가 같고, 옛 글에서 `old` 를 정확히 한 번 `new` 로 바꾼 결과가 새 글과 같아야 한다(다른 글자가 더 바뀌면 실패)
ALLOWED = [
    {'where': 'basic[7] blocks/1 p0', 'old': '연준이 “확신이 없다”고 말한', 'new': '연준이 확신이 없다고 본',
     'why': 'D23 · 0.1b PM 검수 #16 — 해석에 원문 표시(따옴표)를 단 것. 도윤 승인 2026-09-29'},
    {'where': 'basic[6] blocks/0 0.body', 'old': '세 명만\n“올리자”고 반대', 'new': '세 명만\n올리자고 반대',
     'why': 'D27 · 0.2b 인용 검사 — 바꿔 말한 것에 발언 표시(따옴표)를 단 것. 따옴표만 뺐다. 도윤 승인'},
]


def br(h):
    return re.sub(r'<br\s*/?>', '\n', h)


def rt(spans):
    return ''.join(s['text'] for s in spans)


# ---------------------------------------------------------------- 옛 모양 → (모양, 독자 글 단위)
def old_blocks(s):
    """[(kind, shape_note, units[(label, text)])]   end_actions 는 뺀다"""
    out = []
    for i, b in enumerate(s['blocks']):
        t = b['type']
        if t == 'body_text':
            out.append(('prose', [('secondary' if 'dim' in p.get('classes', []) else 'normal') for p in b['paragraphs']],
                        [(f'p{j}', br(p['html'])) for j, p in enumerate(b['paragraphs'])]))
        elif t == 'callout':
            out.append(('prose', ['callout'], [('p0', br(b['html']))]))
        elif t == 'closing':
            out.append(('prose', ['conclusion'], [('p0', br(b['html']))]))
        elif t == 'quote':
            out.append(('quote', [], [('attribution', b['tag']), ('body', br(b['html']))]))
        elif t == 'votes':
            u, sh = [], []
            for j, c in enumerate(b['cards']):
                u += [(f'{j}.label', c['when']), (f'{j}.value', c['tally']), (f'{j}.body', br(c['what_html']))]
                sh.append(c.get('modifier') == 'hit')
            out.append(('contrast', sh, u))
        elif t == 'gauge':                         # 게이지 → 두 값 대조 (D20): caption → label, value_text → value
            u, sh = [], []
            for j, l in enumerate(b['labels']):
                u += [(f'{j}.label', l['caption']), (f'{j}.value', l['value_text'])]
                sh.append(False)
            out.append(('contrast', sh, u))
        elif t == 'timeline':
            u = []
            for j, x in enumerate(b['items']):
                u += [(f'{j}.label', x['when']), (f'{j}.body', br(x['html']))]
            out.append(('list', [True] * len(b['items']), u))
        elif t == 'stats':
            u = []
            for j, r in enumerate(b['rows']):
                u += [(f'{j}.label', r['k']), (f'{j}.value', r['v'])]
            out.append(('sheet', [], u))
        elif t == 'end_actions':
            continue
        else:
            raise SystemExit(f'옛 골든: 모르는 블록 {t}')
    return out


def new_blocks(s):
    out = []
    for b in s['blocks']:
        t = b['type']
        if t == 'prose':
            out.append(('prose', [p['weight'] for p in b['paragraphs']],
                        [(f'p{j}', rt(p['body'])) for j, p in enumerate(b['paragraphs'])]))
        elif t == 'quote':
            out.append(('quote', [], [('attribution', b['attribution']), ('body', rt(b['body']))]))
        elif t in ('contrast', 'list', 'sheet'):
            seq = b['rows'] if t == 'sheet' else b['items']
            u, sh = [], []
            for j, it in enumerate(seq):
                for f in ('label', 'value', 'body'):
                    if f in it:
                        u.append((f'{j}.{f}', rt(it[f])))
                if t == 'contrast':
                    sh.append(bool(it.get('emphasized')))
                elif t == 'list':
                    sh.append(b['ordered'])
            out.append((t, sh, u))
        else:
            raise SystemExit(f'새 골든: 모르는 블록 {t}')
    return out


def old_units(doc):
    """{level_id: [ {kicker, headline, blocks, open_question} ]}"""
    res = {}
    for lv in doc['levels']:
        sl = []
        for s in lv['slides']:
            sl.append({'kicker': s['kicker'], 'headline': s['h1'], 'blocks': old_blocks(s),
                       'oq': s['teaser']['qtext'] if s.get('teaser') else None})
        res[LEVEL_MAP[lv['id']]] = sl
    return res


def new_units(doc):
    res = {}
    for lv in doc['levels']:
        sl = []
        n = len(lv['slides'])
        for i, s in enumerate(lv['slides']):
            oq = lv['open_questions'][i]['text'] if i < len(lv['open_questions']) else None
            sl.append({'kicker': s['kicker'], 'headline': rt(s['headline']), 'blocks': new_blocks(s), 'oq': oq})
        res[lv['id']] = sl
    return res


# ---------------------------------------------------------------- 대조
def show_diff(a, b):
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    parts = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != 'equal':
            parts.append(f'[{op}] 옛 {a[i1:i2]!r} → 새 {b[j1:j2]!r}  (옛 {i1}~{i2}, 새 {j1}~{j2})')
    return '; '.join(parts)


def compare(old, new):
    fails, n_units, n_chars, allowed_hit = [], 0, 0, []

    def eq(where, a, b):
        nonlocal n_units, n_chars
        n_units += 1
        n_chars += len(a)
        if a != b:
            for al in ALLOWED:
                if al['where'] == where and a.count(al['old']) == 1 and a.replace(al['old'], al['new']) == b:
                    allowed_hit.append(al)
                    return
            fails.append(f'{where}: 글자가 다르다 — {show_diff(a, b)}')

    def same(where, a, b, what):
        if a != b:
            fails.append(f'{where}: {what} 다르다 — 옛 {a} / 새 {b}')

    ou, nu = old_units(old), new_units(new)
    same('levels', list(ou), list(nu), '레벨 id 가')
    for lid in ou:
        so, sn = ou[lid], nu.get(lid)
        if sn is None:
            continue
        same(lid, len(so), len(sn), '장수가')
        for i, (a, b) in enumerate(zip(so, sn)):
            w = f'{lid}[{i}]'
            eq(f'{w} kicker', a['kicker'], b['kicker'])
            eq(f'{w} headline', a['headline'], b['headline'])
            if a['oq'] is None or b['oq'] is None:
                same(f'{w} open_question', a['oq'], b['oq'], '있고 없음이')
            else:
                eq(f'{w} open_question', a['oq'], b['oq'])
            same(w, len(a['blocks']), len(b['blocks']), '블록 수가')
            for j, (ba, bb) in enumerate(zip(a['blocks'], b['blocks'])):
                wb = f'{w} blocks/{j}'
                same(wb, ba[0], bb[0], '블록 종류가')
                same(wb, ba[1], bb[1], '모양(무게·강조·순서)이')
                same(wb, [l for l, _ in ba[2]], [l for l, _ in bb[2]], '글 단위 목록이')
                for (la, ta), (lb, tb) in zip(ba[2], bb[2]):
                    eq(f'{wb} {la}', ta, tb)
    return fails, n_units, n_chars, ou, allowed_hit


def load(arg, rel_default=None):
    if arg is None:
        out = subprocess.run(['git', 'show', f'{OLD_REV}:{OLD_REL}'], cwd=ROOT, capture_output=True, check=True)
        return json.loads(out.stdout.decode('utf-8'))
    return json.load(open(arg, encoding='utf-8'))


def main(argv):
    old_p = new_p = None
    it = iter(argv)
    for a in it:
        if a == '--old':
            old_p = next(it)
        elif a == '--new':
            new_p = next(it)
        else:
            raise SystemExit(__doc__)
    old = load(old_p)
    new = json.load(open(new_p or NEW_DEFAULT, encoding='utf-8'))
    fails, n_units, n_chars, ou, allowed_hit = compare(old, new)
    dropped = sum(1 for lv in old['levels'] for s in lv['slides'] for b in s['blocks'] if b['type'] == 'end_actions')
    print(f'옛 골든 {old_p or OLD_REV} → 새 골든 {new_p or os.path.relpath(NEW_DEFAULT, ROOT)}')
    print(f'  레벨 {len(ou)} · 슬라이드 {sum(len(v) for v in ou.values())} · 독자 글 단위 {n_units}개 · {n_chars}자 대조')
    print(f'  허용된 차이 {len(allowed_hit)}/{len(ALLOWED)}건 (그 밖의 차이는 전부 실패):')
    for al in allowed_hit:
        print(f"    {al['where']}: {al['old']!r} → {al['new']!r}  ({al['why']})")
    print(f'  계약이 버리는 것 (대조 밖): end_actions {dropped}개 · teaser 기호 · 눈금 · modifier · style')
    for f in fails:
        print('  FAIL', f)
    print('\nOK — 독자 글 불변' if not fails else f'\n{len(fails)}건 실패')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
