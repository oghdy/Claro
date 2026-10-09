"""옛 골든 → 새 골든 독자 글 대조 (B-0.1b).

    python3 scripts/compare-reader-text.py                  # 옛 골든 = git c46871d, 새 골든 = fixtures/
    python3 scripts/compare-reader-text.py --old PATH --new PATH

독자가 읽는 글자가 하나도 바뀌지 않았는지 문자 단위로 본다.
  대조하는 것  kicker · headline · 본문 문단 · 인용(출처 표시 + 글) · 목록(라벨 + 글) ·
              대조(라벨 + 값 + 글) · 표(라벨 + 값) · open_question
  허용하는 변환  `<br>` → `\\n` (계약 §6). 그 밖에는 한 글자라도 다르면 실패다.
  허용된 차이  ALLOWED 에 적힌 승인된 수정만 (D23 #16 · D27 “올리자” · C-5 P 번호 16건 — D29). 위치 · 바꾼 부분이 정확히 맞아야 한다
              한 글 단위에 여러 건이 걸리면 그중 적용된 건들만으로 새 글이 정확히 설명돼야 한다 (남는 글자가 있으면 실패)
              ALLOWED_INSERTED — 승인된 새 줄 (2차 R10 한 건). 위치 · 글자가 정확히 맞는 한 줄만 빼고 나머지를 옛 글과 대조한다
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
# 같은 위치에 여러 건이면 그중 어느 묶음을 적용한 결과든 새 글과 같으면 된다 — 각 `old` 는 옛 글에 정확히 한 번 있어야 한다
C5 = 'C-5 · D29 도윤 승인 2026-10-09 · logs/content/golden-correction-2026-10.md '
ALLOWED = [
    {'where': 'basic[7] blocks/1 p0', 'old': '연준이 “확신이 없다”고 말한', 'new': '연준이 확신이 없다고 본',
     'why': 'D23 · 0.1b PM 검수 #16 — 해석에 원문 표시(따옴표)를 단 것. 도윤 승인 2026-09-29'},
    {'where': 'basic[6] blocks/0 0.body', 'old': '세 명만\n“올리자”고 반대', 'new': '세 명만\n올리자고 반대',
     'why': 'D27 · 0.2b 인용 검사 — 바꿔 말한 것에 발언 표시(따옴표)를 단 것. 따옴표만 뺐다. 도윤 승인'},
    {'where': 'basic[6] blocks/1 p0', 'old': '시장은 인상 가능성을 90% 넘게 반영하기 시작했어요.', 'new': '시장도 인상 쪽으로 기울기 시작했어요.',
     'why': C5 + 'P4 B — D-2 · M-1 (90% 는 기자 발언. CME 58~66%)'},
    {'where': 'basic[7] kicker', 'old': '가장 큰 변수', 'new': '큰 변수',
     'why': C5 + 'P6 A — "가장"을 말한 1차가 없다'},
    {'where': 'basic[7] blocks/0 p0', 'old': '4월에 휴전 합의가 한 번 있었지만 이후 공격이', 'new': '4월에 미국이 휴전을 발표했지만 이후에도 공격이',
     'why': C5 + 'P7 B — I-1 "한 번" [못 찾음] · §5.2 한쪽 당사자의 발표'},
    {'where': 'basic[7] blocks/0 p1', 'old': '회의가 열린 날에는', 'new': '회의가 열린 주에는',
     'why': C5 + 'P8 A — D-7 (EIA 주간 조사)'},
    {'where': 'basic[7] blocks/1 p0', 'old': '물가는 저절로 내려갈 수도', 'new': '물가는 한결 나아질 수도',
     'why': C5 + 'P9 PM 안 (D29) — "저절로"가 반증에 걸림'},
    {'where': 'basic[7] blocks/1 p0', 'old': '이유의 상당 부분이', 'new': '이유의 하나가',
     'why': C5 + 'P10 A — 비중을 말한 1차가 없다 (ST-09 "in part")'},
    {'where': 'basic[8] blocks/0 p2', 'old': '물가가 2% 근처로 돌아오는 건 내년 말쯤으로', 'new': '물가가 2%로 돌아오는 건 2029년으로',
     'why': C5 + 'P11 A — SEP-09: 2027년 2.3 · 2029년 2.0'},
    {'where': 'advanced[1] blocks/0 p0', 'old': '6월 전망치와 사실상 같았고요.', 'new': '6월에 낸 연말 전망치와 같은 숫자였고요.',
     'why': C5 + 'P13 A — 12개월 실적과 4분기 전망은 재는 것이 다르다'},
    {'where': 'advanced[2] blocks/0 1.body', 'old': '<b>23,000명 감소</b>,', 'new': '<b>23,000명 감소</b>(9/4 증가로 수정),',
     'why': C5 + 'P16 B — D-1 (BLS 9/4: -23,000 → +21,000)'},
    {'where': 'advanced[2] blocks/0 2.body', 'old': '의장이 인상 기준을 명시', 'new': '의장이 기준을 명시',
     'why': C5 + 'P14 A — M-2 (JH "not to a decision")'},
    {'where': 'advanced[2] blocks/0 3.body', 'old': '인상 확률 90% 이상 반영. 10년물 4.6% 돌파', 'new': '인상 확률 60% 안팎 반영',
     'why': C5 + 'P15 B — D-2 · D-3 · M-1'},
    {'where': 'advanced[3] blocks/1 p1', 'old': '2027년에 추가 인상을 찍은 참가자는 8명뿐,', 'new': '2027년 말 금리를 4.1%보다 높게 본 참가자는 18명 중 8명,',
     'why': C5 + 'P17 B — D-4 (점도표는 사람을 잇지 않는다) · DC-D 물음 1 ("뿐")'},
    {'where': 'advanced[4] blocks/0 p0', 'old': '물가의 큰 부분이 전쟁에 달려 있습니다.', 'new': '물가 전망의 큰 변수가 전쟁입니다.',
     'why': C5 + 'P18 A — 비중을 말한 1차가 없다 (MIN-07 "clouded the inflation outlook")'},
    {'where': 'advanced[4] blocks/0 p0', 'old': '4월 휴전 이후에도', 'new': '4월 휴전 발표 이후에도',
     'why': C5 + 'P20 A — §5.2 한쪽 당사자의 발표'},
    {'where': 'advanced[4] blocks/0 p0', 'old': '회의 당일 경유 가격은', 'new': '회의가 열린 주 경유 가격은',
     'why': C5 + 'P20 A — D-7 (EIA 주간 조사)'},
    {'where': 'advanced[4] blocks/1 p0', 'old': '인상을 둘러싼 내부 긴장이\n전망에서 실제 행동으로 옮겨왔다는 점', 'new': '인상 의견이\n소수의견에서 실제 결정으로 옮겨왔다는 점',
     'why': C5 + 'P24 A — DC-A 가 말하는 것으로 좁힘 (F29 는 1차 대조 안 됨)'},
    # ---- 2차 (D29 끝 · 도윤 "추천대로") — 로그 "## 2차" 의 R 번호
    {'where': 'basic[1] headline', 'old': '오히려 나은 편이었어요', 'new': '크게 달라지지 않았어요',
     'why': C5 + 'R1 A — 8월 CPI 를 넣으면 "나은 편"이 서지 않는다 (DC-C 물음 4)'},
    {'where': 'basic[1] blocks/0 p0', 'old': '시장이 걱정하던 것보다 좋았습니다.', 'new': '눈에 띄게 나빠지지 않았습니다.',
     'why': C5 + 'R2 A — D-6 · "예상보다"는 8/28 까지의 말'},
    {'where': 'basic[5] open_question', 'old': '두 달 전엔 왜 안 올렸죠?', 'new': '두 달 전에도 그렇게 봤나요?',
     'why': C5 + 'R5 A (Q1) — 7장이 "왜"에 답하지 않는다 (D15)'},
    {'where': 'basic[6] open_question', 'old': '물가는 왜 안 내려오고 있죠?', 'new': '물가는 왜 빨리 안 내려오죠?',
     'why': C5 + 'R6 A (Q2) — 9장 결론 "내려오고는 있는데"와 부딪힘'},
    {'where': 'basic[7] open_question', 'old': '이제 계속 오르나요?', 'new': '그럼 금리는 계속 오르나요?',
     'why': C5 + 'R7 A — 주어가 없어 앞 장의 기름값 · 물가로 읽힌다'},
    {'where': 'advanced[3] open_question', 'old': '남는 두 가지 긴장', 'new': '남는 두 가지 불확실성',
     'why': C5 + 'R8 A — 5장 제목의 낱말과 맞춤'},
    {'where': 'advanced[1] blocks/0 p0', 'old': '여름 물가 지표는 예상보다 나았습니다.', 'new': '8월 말까지 나온 여름 물가 지표는 예상보다 나았습니다.',
     'why': C5 + 'R9 A — "예상보다"는 8/28 까지의 말'},
    {'where': 'advanced[4] blocks/0 p1', 'old': '고용은 겉보기만큼 단단하지 않습니다.', 'new': '고용 숫자는 한 달로 읽기 어렵습니다.',
     'why': C5 + 'R4 A (P21) — DC-E. 8월 고용을 넣으면 "단단하지 않다"도 "엇갈린다"도 서지 않는다'},
    {'where': 'advanced[4] blocks/0 p1', 'old': '7월 취업자는 오히려 23,000명 줄었습니다. 그런데 실업률은 4.2%에서 4.1%로 내려갔죠.',
     'new': '7월 취업자는 거의 늘지 않았는데 8월에는 162,000명 늘었습니다. 실업률은 그 사이 4.1%에서 움직이지 않았죠.',
     'why': C5 + 'R4 A (P22) — D-1 · BLS-08 (7월 +21,000 수정 · 8월 +162,000 · 실업률 4.1 그대로)'},
    {'where': 'advanced[4] blocks/0 p1', 'old': '의장은 이를 노동공급 감소로 설명했고,', 'new': '의장은 취업자가 적게 느는 것을 노동공급이 거의 늘지 않는 탓으로 설명했고,',
     'why': C5 + 'R4 A (P23) — D-5 (JH "barely growing")'},
]

# 허용된 삽입 — 승인된 새 항목(목록 · 대조 · 표의 한 줄). 새 골든의 그 블록 `at` 번째 항목이 `units` 와 글자까지 같아야 하고,
# 그 항목을 뺀 나머지가 옛 글과 맞아야 한다. 등록된 줄이 없거나 글자가 다르면 그대로 대조해서 실패한다
ALLOWED_INSERTED = [
    {'where': 'advanced[2] blocks/0', 'at': 4,
     'units': {'label': '9/4 · 9/11', 'body': '8월 고용 162,000명 증가 · 8월 소비자물가 전월 대비 0.4%'},
     'why': C5 + 'R10 A — 타임라인에 회의 직전의 가장 새 지표 둘이 없었다 (팩트 누락 · BLS-08 · CPI-08)'},
]


def drop_inserted(block, ins):
    """(kind, shape, units) 에서 등록된 항목을 빼고 뒤 항목 번호를 당긴다. 글자가 등록된 것과 다르면 None"""
    kind, sh, units = block
    at = ins['at']
    got = {l.split('.', 1)[1]: t for l, t in units if l.split('.', 1)[0] == str(at)}
    if got != ins['units'] or at >= len(sh):
        return None
    out = []
    for l, t in units:
        j, f = l.split('.', 1)
        if int(j) == at:
            continue
        out.append((f'{int(j) - 1}.{f}' if int(j) > at else l, t))
    return (kind, sh[:at] + sh[at + 1:], out)


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
            here = [al for al in ALLOWED if al['where'] == where]
            for mask in range(1, 1 << len(here)):            # 그 위치의 허용 건 중 어느 묶음이든 — 승인된 글을 강제하지는 않는다
                pick, cur = [al for k, al in enumerate(here) if mask >> k & 1], a
                if all(a.count(al['old']) == 1 for al in pick):
                    for al in pick:
                        cur = cur.replace(al['old'], al['new'])
                    if cur == b:
                        allowed_hit.extend(pick)
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
                for ins in ALLOWED_INSERTED:
                    if ins['where'] == wb and bb[0] in ('list', 'contrast', 'sheet') and len(bb[1]) == len(ba[1]) + 1:
                        cut = drop_inserted(bb, ins)
                        if cut is not None:
                            bb = cut
                            allowed_hit.append({'where': f"{wb} (+{ins['at']}번째 줄)", 'old': '', 'why': ins['why'],
                                                'new': ' — '.join(ins['units'].values())})
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
    print(f'  허용된 차이 {len(allowed_hit)}/{len(ALLOWED) + len(ALLOWED_INSERTED)}건 (그 밖의 차이는 전부 실패):')
    for al in allowed_hit:
        print(f"    {al['where']}: {al['old']!r} → {al['new']!r}  ({al['why']})")
    print(f'  계약이 버리는 것 (대조 밖): end_actions {dropped}개 · teaser 기호 · 눈금 · modifier · style')
    for f in fails:
        print('  FAIL', f)
    print('\nOK — 등록 안 된 차이 0 (허용된 차이 밖의 독자 글 불변)' if not fails else f'\n{len(fails)}건 실패')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
