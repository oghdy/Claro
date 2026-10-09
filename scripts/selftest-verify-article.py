"""검증 스크립트가 실제로 실패할 수 있는지 — 일부러 망가뜨린 사본으로 확인한다 (B-0.1b).

    python3 scripts/selftest-verify-article.py

골든의 사본(메모리 안, 파일로 남기지 않는다)에 위반을 하나씩 주입하고
  · verify-article.py  가 기대한 code 로 거부하는지 (기대 code 만 나와야 통과)
  · compare-reader-text.py 가 독자 글 변경을 잡는지
를 본다. 망가뜨리지 않은 골든은 통과해야 한다.
"""
import copy, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(ROOT, 'scripts', name + '.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


V = load('verify-article')
C = load('compare-reader-text')
IDS = V.known_ids()
GOLD = json.load(open(V.GOLDEN, encoding='utf-8'))
OLD = C.load(None)


def relin(d):
    """블록 text 를 구조에서 다시 계산해 TEXT_MISMATCH 가 섞이지 않게 한다"""
    for lv in d['levels']:
        for s in lv['slides']:
            for b in s['blocks']:
                if b.get('type') in V.BLOCK_TYPES:
                    try:
                        b['text'] = V.linearize(b)
                    except Exception:
                        pass
    return d


def spans(d):
    """(레벨, 슬라이드, 경로, span) 전부"""
    def rich(x, path):
        if isinstance(x, list) and x and isinstance(x[0], dict) and 'layer' in x[0]:
            for i, sp in enumerate(x):
                yield path + [i], sp
    for lv in d['levels']:
        for s in lv['slides']:
            yield from ((lv, s, p, sp) for p, sp in rich(s['headline'], ['headline']))
            for bi, b in enumerate(s['blocks']):
                for k in ('paragraphs', 'items', 'rows'):
                    for j, it in enumerate(b.get(k, [])):
                        for f in ('body', 'label', 'value'):
                            if f in it:
                                yield from ((lv, s, p, sp) for p, sp in rich(it[f], ['blocks', bi, k, j, f]))
                if 'body' in b:
                    yield from ((lv, s, p, sp) for p, sp in rich(b['body'], ['blocks', bi, 'body']))


def find_span(d, layer, pred=lambda sp: True, pending=None, nth=0):
    hits = [sp for _, _, _, sp in spans(d) if sp['layer'] == layer and pred(sp)
            and (pending is None or ('_refs_pending' in sp) == pending)]
    return hits[nth]


def block_of(d, lv, si, type_, nth=0):
    return [b for b in d['levels'][lv]['slides'][si]['blocks'] if b['type'] == type_][nth]


def vol(d, lv, si, span):
    return next(v for v in d['levels'][lv]['slides'][si]['_volatility'] if v['span'] == span)


MUT = []          # (이름, 기대 code 집합, 변형 함수, publish)


def mut(name, codes, publish=False, relinearize=True):
    def deco(fn):
        MUT.append((name, set(codes), fn, publish, relinearize))
        return fn
    return deco


# ---------------------------------------------------------------- §9-1
@mut('§9-1 levels 0개', {'LEVELS_COUNT'})
def _(d): d['levels'] = []
@mut('§9-1 levels 4개', {'LEVELS_COUNT'})
def _(d): d['levels'] = d['levels'] + copy.deepcopy(d['levels'])
@mut('§9-1 레벨 id 옛 값 adv', {'LEVEL_ID'})
def _(d): d['levels'][1]['id'] = 'adv'
@mut('§9-1 레벨 id 겹침', {'LEVEL_ID'})
def _(d): d['levels'][1]['id'] = 'basic'
@mut('§9-1 레벨 순서 뒤바뀜 (advanced → basic)', {'LEVEL_ID'})
def _(d): d['levels'].reverse()
@mut('§9-1 slides 비움', {'SLIDES_EMPTY'})
def _(d): d['levels'][0]['slides'] = []
@mut('§9-1 blocks 비움', {'BLOCKS_EMPTY'})
def _(d): d['levels'][0]['slides'][2]['blocks'] = []
# ---------------------------------------------------------------- §9-2
@mut('§9-2 open_question 하나 삭제 (길이 ≠ 장수 − 1)', {'OQ_LENGTH'})
def _(d): d['levels'][0]['open_questions'].pop(3)
@mut('§9-2 open_question 하나 추가', {'OQ_LENGTH'})
def _(d): d['levels'][1]['open_questions'].append({'text': '하나 더?'})
@mut('§9-2 open_question text 빈 문자열', {'OQ_EMPTY'})
def _(d): d['levels'][0]['open_questions'][2]['text'] = ' '
# ---------------------------------------------------------------- §9-3
@mut('§9-3 슬라이드에 resolves', {'POINTER_FIELD'})
def _(d): d['levels'][0]['slides'][1]['resolves'] = 2
@mut('§9-3 open_question 에 goto_index', {'POINTER_FIELD'})
def _(d): d['levels'][0]['open_questions'][0]['goto_index'] = 1
@mut('§9-3 슬라이드에 index', {'POINTER_FIELD'})
def _(d): d['levels'][0]['slides'][0]['index'] = 0
@mut('§9-3 `_` 주석 안의 goto (주석에도 없어야 한다)', {'POINTER_FIELD'})
def _(d): d['levels'][0]['slides'][0]['_volatility'][0]['goto'] = 1
# ---------------------------------------------------------------- §9-4
@mut('§9-4 블록 text 삭제', {'BLOCK_NO_TEXT'}, relinearize=False)
def _(d): del block_of(d, 0, 0, 'prose')['text']
@mut('§9-4 text 한 글자 바꿈 (구조는 그대로)', {'TEXT_MISMATCH'}, relinearize=False)
def _(d):
    b = block_of(d, 1, 3, 'sheet'); b['text'] = b['text'].replace('4.1%', '4.2%', 1)
@mut('§9-4 구조만 고침 (span 수치 3.7→3.8), text 는 그대로 — 화면 3.8 / 질문 3.7', {'TEXT_MISMATCH'}, relinearize=False)
def _(d):
    row = block_of(d, 1, 3, 'sheet')['rows'][4]['value'][0]; assert row['text'] == '3.7%'; row['text'] = '3.8%'
@mut('§9-4 강조를 구조에서만 뺌 (hit → emphasized 제거), text 는 그대로', {'TEXT_MISMATCH'}, relinearize=False)
def _(d): del block_of(d, 0, 6, 'contrast')['items'][1]['emphasized']
@mut('§9-4 목록 순서를 구조에서만 바꿈 (항목에 붙은 _volatility where 도 어긋나 VOL_SPAN 이 같이 나온다)', {'TEXT_MISMATCH', 'VOL_SPAN'}, relinearize=False)
def _(d): b = block_of(d, 1, 2, 'list'); b['items'][0], b['items'][1] = b['items'][1], b['items'][0]
@mut('§9-4 ordered 뒤집음 (번호가 글자로 남아야 한다)', {'TEXT_MISMATCH'}, relinearize=False)
def _(d): block_of(d, 1, 2, 'list')['ordered'] = False
# ---------------------------------------------------------------- §9-5
@mut('§9-5 type=gauge (옛 관측 타입)', {'BLOCK_TYPE'})
def _(d): block_of(d, 0, 3, 'contrast')['type'] = 'gauge'
@mut('§9-5 type=scale (두지 않기로 한 원형)', {'BLOCK_TYPE'})
def _(d): block_of(d, 0, 3, 'contrast')['type'] = 'scale'
# ---------------------------------------------------------------- §9-6
@mut('§9-6 layer 옛 이름 derived_claim', {'SPAN_LAYER'})
def _(d): find_span(d, 'claim', lambda s: s['refs'])['layer'] = 'derived_claim'
@mut('§9-6 writing 인데 refs', {'REFS_WRITING'})
def _(d): find_span(d, 'writing')['refs'] = ['F01']
@mut('§9-6 fact 인데 refs 비었고 대기 표시도 없음', {'REFS_EMPTY'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['refs'] = []
@mut('§9-6 대기 span 의 _refs_pending 만 지움 (조용히 두면 안 된다)', {'REFS_EMPTY'})
def _(d): del find_span(d, 'bridge')['_refs_pending']
@mut('§9-6 claim span 에 Fact ID (층 섞임)', {'REF_WRONG_LAYER'})
def _(d): find_span(d, 'claim', lambda s: s['refs'])['refs'] = ['F01']
@mut('§9-6 fact span 에 DC ID (층 섞임)', {'REF_WRONG_LAYER'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['refs'] = ['DC-A']
@mut('§9-6 fact span 에 F·DC 혼합 (D20 — 섞으면 안 된다)', {'REF_WRONG_LAYER'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['refs'] = ['F01', 'DC-A']
@mut('§9-6 없는 Fact ID', {'REF_UNKNOWN'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['refs'] = ['F99']
@mut('§9-6 없는 개념 ID', {'REF_UNKNOWN'})
def _(d): find_span(d, 'concept')['refs'] = ['C-9999']
@mut('§9-6 refs 와 대기 표시가 동시에', {'PENDING_WITH_REFS'})
def _(d): find_span(d, 'fact', lambda s: s['refs'], pending=False)['_refs_pending'] = {'until': '0.2', 'need': 'Fact 출처'}
@mut('§9-6 writing 에 대기 표시', {'PENDING_INVALID'})
def _(d): find_span(d, 'writing')['_refs_pending'] = {'until': '0.2', 'need': 'Fact 출처'}
@mut('§9-6 대기 표시 until 이 0.2 가 아님', {'PENDING_INVALID'})
def _(d): find_span(d, 'bridge')['_refs_pending']['until'] = '0.3'
@mut('§9-6 claim 의 need 가 Fact 출처 (D22 — claim 은 DerivedClaim)', {'PENDING_NEED_LAYER'})
def _(d): find_span(d, 'claim', pending=True)['_refs_pending']['need'] = 'Fact 출처'
@mut('§9-6 span 에 layer 없음', {'SCHEMA_MISSING'})
def _(d): del find_span(d, 'fact', lambda s: s['refs'])['layer']
@mut('§9-6 _fact_refs_dropped 에 없는 ID', {'DROPPED_UNKNOWN'})
def _(d): find_span(d, 'claim', lambda s: '_fact_refs_dropped' in s)['_fact_refs_dropped'] = ['F99']
@mut('§6 인용 글이 fact 가 아님', {'QUOTE_LAYER'})
def _(d): block_of(d, 0, 5, 'quote')['body'][0].update(layer='claim', refs=['DC-C'])
@mut('span text 빈 문자열 (그 span 에 붙은 _volatility 도 같이 걸린다)', {'SPAN_EMPTY', 'VOL_SPAN'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['text'] = ''
# ---------------------------------------------------------------- §9-7 / §9-8
@mut('§9-7 span 안에 <br>', {'INLINE_FORMAT'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['text'] += '<br>'
@mut('§9-7 span 안에 <i>', {'INLINE_FORMAT'})
def _(d): find_span(d, 'fact', lambda s: s['refs'])['text'] = '<i>' + find_span(d, 'fact', lambda s: s['refs'])['text'] + '</i>'
@mut('§9-7 <b> 가 span 을 넘는다', {'BOLD_CROSSES_SPAN'})
def _(d): s = find_span(d, 'fact', lambda s: s['refs']); s['text'] = '<b>' + s['text']
@mut('§9-7 kicker 에 태그', {'INLINE_FORMAT'})
def _(d): d['levels'][0]['slides'][0]['kicker'] = '<b>오늘의 뉴스</b>'
@mut('§9-8 emphasized 항목을 <b> 로 통째 감쌈', {'EMPHASIZED_DOUBLE'})
def _(d):
    it = block_of(d, 0, 6, 'contrast')['items'][1]; it['body'][0]['text'] = '<b>' + it['body'][0]['text'] + '</b>'
# ---------------------------------------------------------------- §9-9 / D8
@mut('§9-9 슬라이드에 as_of (읽는 시각 필드)', {'D8_FIELD'})
def _(d): d['levels'][0]['slides'][3]['as_of'] = '2026-08-30'
@mut('§9-9 블록에 formula', {'D8_FIELD'})
def _(d): block_of(d, 0, 0, 'prose')['formula'] = {'op': 'weeks'}
@mut('§9-9 패키지에 now', {'D8_FIELD'})
def _(d): d['now'] = 'render'
@mut('D8 published_at 이 날짜가 아님', {'D8_NO_PUBLISHED_AT'})
def _(d): d['published_at'] = '지금'
@mut('D8 published_at 을 10/16 으로 (모든 DERIVED 를 다시 계산해야 한다)', {'DERIVED_INVARIANT_FAIL'})
def _(d): d['published_at'] = '2026-10-16'
@mut('D8 VOLATILE 의 as_of 삭제', {'VOLATILE_MISSING_AS_OF'})
def _(d): del vol(d, 0, 3, '지금 미국은 3%대')['as_of']
@mut('D8 as_of 형식 오류', {'VOLATILE_BAD_AS_OF'})
def _(d): vol(d, 0, 3, '지금 미국은 3%대')['as_of'] = '8월 말'
@mut('D8 DERIVED 출처를 VOLATILE 로', {'DERIVED_FROM_VOLATILE'})
def _(d): vol(d, 0, 6, '3주 뒤에')['derived_from'][0]['volatility'] = 'VOLATILE'
@mut('D8 value_at_authoring 을 틀리게 (3주 → 4주)', {'DERIVED_INVARIANT_FAIL'})
def _(d): vol(d, 0, 6, '3주 뒤에')['value_at_authoring'] = 4
@mut('D8 기록된 invariant 가 재계산과 다름', {'DERIVED_INVARIANT_MISMATCH'})
def _(d): vol(d, 0, 6, '3주 뒤에')['invariant'] = 'UNVERIFIABLE'
@mut('D8 class 오류', {'VOL_CLASS'})
def _(d): vol(d, 0, 3, '지금 미국은 3%대')['class'] = 'LIVE'
@mut('D8 where 경로가 가리키는 글에 span 이 없다', {'VOL_SPAN'})
def _(d): vol(d, 0, 3, '지금 미국은 3%대')['where'] = 'headline'
@mut('D8 where 경로가 없다', {'VOL_SPAN'})
def _(d): vol(d, 0, 3, '지금 미국은 3%대')['where'] = 'blocks/9/paragraphs/0/body'
@mut('D8 open_question 의 DERIVED 를 깸 (두 달 전 → 3)', {'DERIVED_INVARIANT_FAIL'})
def _(d): d['levels'][0]['open_questions'][5]['_volatility'][0]['value_at_authoring'] = 3
# ---------------------------------------------------------------- 스키마 · D9 · §9-10
@mut('D9 최상단에 _findings', {'D9_OBSERVED_KEY'})
def _(d): d['_findings'] = []
@mut('스키마 옛 필드 Level.label 이 남음 (D22)', {'SCHEMA_KEY'})
def _(d): d['levels'][0]['label'] = '입문'
@mut('스키마 옛 필드 slide_count', {'SCHEMA_KEY'})
def _(d): d['levels'][0]['slide_count'] = 9
@mut('스키마 옛 teaser 가 슬라이드에 남음', {'SCHEMA_KEY'})
def _(d): d['levels'][0]['slides'][0]['teaser'] = {'qtext': '?'}
@mut('스키마 옛 h1', {'SCHEMA_KEY', 'SCHEMA_MISSING'})
def _(d): s = d['levels'][0]['slides'][0]; s['h1'] = s.pop('headline')
@mut('스키마 event_hint 가 남고 event_ref 없음', {'SCHEMA_KEY', 'SCHEMA_MISSING'})
def _(d): d['event_hint'] = d.pop('event_ref')
@mut('스키마 옛 chrome 이 남음', {'SCHEMA_KEY'})
def _(d): d['chrome'] = {}
@mut('스키마 title 에 브랜드', {'SCHEMA_KEY'})
def _(d): d['title'] = 'Claro — ' + d['title']
@mut('스키마 contrast 항목에 value · body 둘 다 없음', {'SCHEMA_MISSING'})
def _(d): it = block_of(d, 0, 3, 'contrast')['items'][0]; del it['value']
@mut('스키마 prose weight 오류 (warn 은 판단 색이라 없다)', {'SCHEMA_KEY'})
def _(d): block_of(d, 0, 7, 'prose')['paragraphs'][0]['weight'] = 'warn'
@mut('스키마 sheet 행에 v_modifier (판단 색)', {'SCHEMA_KEY'})
def _(d): block_of(d, 1, 3, 'sheet')['rows'][4]['v_modifier'] = 'up'
@mut('스키마 quote 에 attribution 없음', {'SCHEMA_MISSING'})
def _(d): del block_of(d, 0, 5, 'quote')['attribution']
@mut('§9-10 발행 검사에서는 `_` 필드가 하나라도 있으면 실패', {'UNDERSCORE_IN_PUBLISH'}, publish=True)
def _(d): pass


def run_verify():
    rows, bad = [], 0
    errs, _, _ = V.check(copy.deepcopy(GOLD), IDS)
    ok = not errs
    rows.append(('PASS' if ok else 'FAIL', '망가뜨리지 않은 골든은 통과해야 한다', '—', '—' if ok else sorted({c for c, _ in errs})))
    bad += not ok
    errs, _, _ = V.check(copy.deepcopy(GOLD), IDS, publish=True)
    got = {c for c, _ in errs}
    ok = 'UNDERSCORE_IN_PUBLISH' in got and got <= {'UNDERSCORE_IN_PUBLISH'}
    rows.append(('PASS' if ok else 'FAIL', '골든을 --publish 로 검사하면 `_` 때문에 거부 (§9-10 — 골든은 발행물이 아니다)',
                 ['UNDERSCORE_IN_PUBLISH'], sorted(got)))
    bad += not ok
    for name, want, fn, publish, relinearize in MUT:
        d = copy.deepcopy(GOLD)
        try:
            fn(d)
            if relinearize:
                relin(d)
            errs, _, _ = V.check(d, IDS, publish)
            got = {c for c, _ in errs}
        except Exception as e:                                # 검증기가 죽는 것도 실패다
            got = {f'CRASH {type(e).__name__}: {e}'}
        ok = want <= got if publish else got == want          # 기대한 code 만 나와야 통과 (다른 code 가 섞이면 실패)
        rows.append(('PASS' if ok else 'FAIL', name, sorted(want), sorted(got)))
        bad += not ok
    return rows, bad


def run_compare():
    rows, bad = [], 0
    fails, n, ch, _, _ = C.compare(OLD, GOLD)
    ok = not fails
    rows.append(('PASS' if ok else 'FAIL', '망가뜨리지 않은 새 골든은 옛 골든과 글이 같다', f'{n}단위 {ch}자', 'OK' if ok else fails[:2]))
    bad += not ok

    def case(name, fn, expect_fail=True):
        nonlocal bad
        d = copy.deepcopy(GOLD)
        fn(d)
        f, _, _, _, _ = C.compare(OLD, d)
        ok = bool(f) == expect_fail
        rows.append(('PASS' if ok else 'FAIL', name, '실패해야 함' if expect_fail else '통과해야 함', f'{len(f)}건' + (f' — {f[0][:90]}' if f else '')))
        bad += not ok

    def s0(d): return d['levels'][0]['slides']
    def edit_span(d, lv, si, bi, k, j, fn, f='body'):
        for sp in d['levels'][lv]['slides'][si]['blocks'][bi][k][j][f]:
            sp['text'] = fn(sp['text'])
    case('본문 한 글자 (금리를→금리은)', lambda d: edit_span(d, 0, 0, 0, 'paragraphs', 0, lambda t: t.replace('금리를', '금리은', 1)))
    case('마침표 하나 삭제', lambda d: edit_span(d, 0, 0, 0, 'paragraphs', 0, lambda t: t.replace('올렸습니다.', '올렸습니다', 1)))
    case('공백 하나 추가 (독자 눈엔 안 보여도 글자다)', lambda d: edit_span(d, 0, 0, 0, 'paragraphs', 0, lambda t: t.replace('이제 ', '이제  ', 1)))
    case('<b> 위치 이동 (굵기도 글이다)', lambda d: edit_span(d, 0, 0, 0, 'paragraphs', 0, lambda t: t.replace('<b>3.75~4.00%</b>예요', '3.75~<b>4.00%</b>예요')))
    case('<br> → 공백 (headline 줄바꿈 소실)', lambda d: d['levels'][0]['slides'][0]['headline'][0].update(text='미국이 3년 만에 금리를 올렸어요'))
    case('kicker 변경', lambda d: s0(d)[2].update(kicker='이것만 알고 가면 돼요 ②'))
    case('open_question 한 글자', lambda d: d['levels'][0]['open_questions'][0].update(text='물가가 갑자기 나빠졌나요'))
    case('게이지 값 2% → 2.0%', lambda d: block_of(d, 0, 3, 'contrast')['items'][0]['value'][0].update(text='2.0%'))
    case('게이지 라벨 바꿈', lambda d: block_of(d, 0, 3, 'contrast')['items'][1]['label'][0].update(text='현재 미국'))
    case('표 값 4.1% → 4.2%', lambda d: block_of(d, 1, 3, 'sheet')['rows'][0]['value'][0].update(text='4.2%'))
    case('인용 출처 표시 변경', lambda d: block_of(d, 0, 5, 'quote').update(attribution='8월 말 · 의장 발언'))
    case('목록 라벨 변경', lambda d: block_of(d, 1, 2, 'list')['items'][0]['label'][0].update(text='7/28'))
    case('문단 순서 뒤바뀜', lambda d: block_of(d, 0, 0, 'prose')['paragraphs'].reverse())
    case('슬라이드 하나 삭제', lambda d: (d['levels'][0]['slides'].pop(4), d['levels'][0]['open_questions'].pop(4)))
    case('블록 하나 삭제', lambda d: d['levels'][0]['slides'][1]['blocks'].pop(1))
    case('문단 무게 secondary → normal (dim 소실)', lambda d: block_of(d, 0, 0, 'prose')['paragraphs'][1].update(weight='normal'))
    case('강조 제거 (hit 소실)', lambda d: block_of(d, 0, 6, 'contrast')['items'][1].pop('emphasized'))
    case('목록 ordered 뒤집음', lambda d: block_of(d, 1, 2, 'list').update(ordered=False))
    def s16(d): return d['levels'][0]['slides'][7]['blocks'][1]['paragraphs'][0]['body'][2]
    def ed16(d, fn):
        sp = s16(d); sp['text'] = fn(sp['text']); b = d['levels'][0]['slides'][7]['blocks'][1]; b['text'] = fn(b['text'])
    case('허용된 차이 #16 을 되돌리면(옛 글 그대로) 통과 — 허용은 승인된 새 글만 강제하지 않는다',
         lambda d: ed16(d, lambda t: t.replace('연준이 확신이 없다고 본', '연준이 “확신이 없다”고 말한')), expect_fail=False)
    case('허용된 위치에서 승인된 것과 다르게 고침 (본 → 봤다)', lambda d: ed16(d, lambda t: t.replace('없다고 본 이유', '없다고 봤던 이유')))
    case('허용된 위치에서 승인된 수정 + 글자 하나 더', lambda d: ed16(d, lambda t: t.replace('여기 있습니다', '바로 여기 있습니다')))
    case('허용된 삽입 줄(R10)의 글자를 바꿈', lambda d: block_of(d, 1, 2, 'list')['items'][4]['body'][0].update(text='8월 고용 262,000명 증가 · 8월 소비자물가 전월 대비 0.4%'))
    case('허용된 삽입 줄(R10)을 다른 자리로 옮김', lambda d: (lambda it: it.insert(1, it.pop(4)))(block_of(d, 1, 2, 'list')['items']))
    case('등록 안 된 줄을 하나 더 끼움', lambda d: (lambda it: it.insert(2, copy.deepcopy(it[1])))(block_of(d, 1, 2, 'list')['items']))
    case('승인된 수정을 다른 문장에 적용 (허용은 위치 한 곳만)',
         lambda d: d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'].__setitem__(
             0, {**d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'][0],
                 'text': d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'][0]['text'].replace('연준이', '연준이 확신이 없다고 본', 1)}))
    case('span 을 쪼개도 이음이 같으면 통과 (경계는 새 데이터)',
         lambda d: (lambda sp: (d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'].__setitem__(0, {**sp, 'text': sp['text'][:5]}),
                                d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'].insert(1, {**sp, 'text': sp['text'][5:]})))(
             d['levels'][0]['slides'][0]['blocks'][0]['paragraphs'][0]['body'][0]), expect_fail=False)
    return rows, bad


def main():
    total_bad = 0
    for title, fn in (('verify-article.py', run_verify), ('compare-reader-text.py', run_compare)):
        rows, bad = fn()
        print(f'== {title} — 사본 {len(rows) - 1}개 (+ 정상 골든 대조)')
        for st, name, want, got in rows:
            print(f'  {st}  {name}\n        기대 {want} / 실제 {got}')
        print(f'  → {"전부 기대대로" if not bad else f"{bad}건 어긋남"}\n')
        total_bad += bad
    print('OK' if not total_bad else f'{total_bad}건 실패')
    return 1 if total_bad else 0


if __name__ == '__main__':
    sys.exit(main())
