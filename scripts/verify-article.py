"""골든 article 픽스처 검증 — 계약 §9 불변식 + D8 (B-0.1b, 계약 ARTICLE_PACKAGE.md 모양).

    python3 scripts/verify-article.py             # 골든 + fixtures/invalid/*.json
    python3 scripts/verify-article.py --report    # 층 분포 · 0.2 대기 span 목록 · 끊긴 F 연결까지 출력
    python3 scripts/verify-article.py --publish   # §9-10 까지: `_` 필드가 하나라도 있으면 실패 (발행 검사)
    python3 scripts/verify-article.py PATH ...    # 특정 파일만

계약 §9 (발행 불변식)
  1  levels 1~3개, id 는 basic · intermediate · advanced 중 하나·겹치지 않음·그 순서. slides ≥ 1, blocks ≥ 1
  2  open_questions.length == slides.length − 1, 모든 text 가 비어 있지 않다 (D15 QA①)
  3  다른 슬라이드를 가리키는 필드가 없다 (resolves · goto · index 류, D15)
  4  모든 블록에 type · text, text == linearize(block) (D14 규칙 1 · 6)
  5  type 이 원형 5개 안에 있다
  6  모든 span 에 layer. writing 이면 refs 가 비고, 나머지는 1개 이상이며 그 층의 Ref 다.
     `_refs_pending` (0.2 대기) 이 있는 span 은 픽스처에서만 허용하고 WARN 으로 센다 — 대기 표시 없이 비면 실패 (§6.2)
  7  인라인 서식은 <b> 와 \\n 뿐, <b> 는 span 을 넘지 않는다
  8  emphasized 항목은 <b> 로 통째 감싸지 않는다
  9  시간 공식이나 읽는 시각에 기대는 필드가 없다 (D8) — 패키지 필드로는 못 들어오고, `_volatility` 주석은 아래 D8 검사를 받는다
  10 발행물에는 `_` 필드가 없다 — 픽스처에서는 허용, --publish 에서만 검사한다
D8 (`_volatility` 주석, 슬라이드 · open_question 에 붙는다. where 는 그 개체 기준 경로)
  VOLATILE 은 as_of 필수 / DERIVED 의 출처는 전부 STABLE / DERIVED 는 published_at 으로 재계산해 불변식 확인
D9  골든에 observed 전용 키(_findings 등)가 없다
스키마 각 개체가 계약이 정한 필드만 갖는다 (옛 모양의 index · label · slide_count · teaser 등이 남으면 실패)

파일에 "_violation" 이 있으면 invalid 픽스처로 보고, 선언한 code 로만 거부돼야 통과다.
또 골든과 정확히 한 군데만 달라야 한다(위반 하나만 주입).
"""
import calendar, datetime as dt, glob, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
BRIEF = os.path.join(ROOT, 'docs/findings/fomc-2026-09-brief.md')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')

FORBIDDEN_TOP = ('_findings', '_dom_inventory', '_transcription_notes', '_render_time_computation')
LEVEL_IDS = ('basic', 'intermediate', 'advanced')
LAYERS = ('fact', 'claim', 'concept', 'bridge', 'writing')
BLOCK_TYPES = ('prose', 'quote', 'list', 'contrast', 'sheet')
WEIGHTS = ('normal', 'secondary', 'callout', 'conclusion')
# 계약 §9-3 — 다른 슬라이드를 가리키는 필드 / §9-9 — 시간 공식·읽는 시각에 기대는 필드
POINTER_KEY = re.compile(r'^(resolves|goto\w*|index|\w+_index|next_slide|target_slide)$')
D8_KEYS = ('formula', 'as_of', 'as_of_basis', 'derived_from', 'value_at_authoring', 'volatility', 'invariant',
           'check', 'class', 'now', 'render', 'recompute')
# 0.2 대기 사유는 층과 맞아야 한다 — claim 은 Derived Claim 도출이 필요하다(D22), bridge 는 Bridge 정의가 필요하다
NEED_FOR_LAYER = {'claim': {'DerivedClaim'}, 'bridge': {'Bridge'}}

# 개체별 허용 필드 (`_` 로 시작하는 필드는 픽스처 주석이라 따로 다룬다)
KEYS = {
    'package':  ({'event_ref', 'title', 'lang', 'published_at', 'levels'}, {'event_ref', 'title', 'lang', 'published_at', 'levels'}),
    'level':    ({'id', 'slides', 'open_questions'}, {'id', 'slides', 'open_questions'}),
    'slide':    ({'kicker', 'headline', 'blocks'}, {'kicker', 'headline', 'blocks'}),
    'oq':       ({'text'}, {'text'}),
    'span':     ({'text', 'layer', 'refs'}, {'text', 'layer', 'refs'}),
    'prose':    ({'type', 'text', 'paragraphs'}, {'type', 'text', 'paragraphs'}),
    'para':     ({'body', 'weight'}, {'body', 'weight'}),
    'quote':    ({'type', 'text', 'attribution', 'body'}, {'type', 'text', 'attribution', 'body'}),
    'list':     ({'type', 'text', 'ordered', 'items'}, {'type', 'text', 'ordered', 'items'}),
    'listitem': ({'label', 'body', 'emphasized'}, {'body'}),
    'contrast': ({'type', 'text', 'items'}, {'type', 'text', 'items'}),
    'citem':    ({'label', 'value', 'body', 'emphasized'}, {'label'}),
    'sheet':    ({'type', 'text', 'rows'}, {'type', 'text', 'rows'}),
    'row':      ({'label', 'value'}, {'label', 'value'}),
}


def nows(s):
    return re.sub(r'\s+', '', s)


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def known_ids():
    brief = open(BRIEF, encoding='utf-8').read()
    facts = set(re.findall(r'^\| (F\d\d) \|', brief, re.M))
    dcs = set(re.findall(r'^### (DC-[A-Z])\b', brief, re.M))
    lib = open(LIBRARY, encoding='utf-8').read()
    concepts = set(re.findall(r'^### (C-\d{4})\b', lib, re.M))
    return facts, dcs, concepts


# ---------------------------------------------------------------- 선형화 (계약 §7.3 ~ §7.7)
def rt(spans):
    return ''.join(s['text'] for s in spans)


def nl(s):                                            # §7.1-7 항목 안의 \n 은 공백
    return s.replace('\n', ' ')


def linearize(b):
    t = b['type']
    if t == 'prose':
        return '\n\n'.join(rt(p['body']) for p in b['paragraphs'])
    if t == 'quote':
        return f"[{b['attribution']}] {rt(b['body'])}"
    lines = []
    if t == 'list':
        for n, it in enumerate(b['items'], 1):
            head = f'{n}. ' if b['ordered'] else '- '
            core = (nl(rt(it['label'])) + ' — ' if it.get('label') else '') + nl(rt(it['body']))
            lines.append(head + (f'<b>{core}</b>' if it.get('emphasized') else core))
    elif t == 'contrast':
        for it in b['items']:
            core = ' '.join(nl(rt(it[k])) for k in ('value', 'body') if it.get(k))
            lines.append(nl(rt(it['label'])) + ': ' + (f'<b>{core}</b>' if it.get('emphasized') else core))
    elif t == 'sheet':
        for r in b['rows']:
            lines.append(f"{nl(rt(r['label']))}: {nl(rt(r['value']))}")
    else:
        raise ValueError(t)
    return '\n'.join(lines)


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
class Checker:
    def __init__(self, ids, publish=False):
        self.facts, self.dcs, self.concepts = ids
        self.publish = publish
        self.errs = []                 # (code, msg)
        self.warns = []                # 문자열
        self.pending = []              # (경로, layer, need, 문장 앞부분)
        self.dropped = []              # (경로, 끊긴 F refs)
        self.layers = {}               # layer → span 수

    def E(self, code, msg):
        self.errs.append((code, msg))

    # ---- 키
    def keys(self, obj, kind, path):
        allowed, required = KEYS[kind]
        if not isinstance(obj, dict):
            self.E('SCHEMA_TYPE', f'{path}: 객체가 아니다')
            return False
        for k in obj:
            if k.startswith('_'):
                if self.publish:
                    self.E('UNDERSCORE_IN_PUBLISH', f'{path}/{k}: 발행물에 `_` 필드가 있다 (§9-10)')
            elif POINTER_KEY.match(k):
                self.E('POINTER_FIELD', f'{path}/{k}: 다른 슬라이드를 가리키는 필드 (§9-3 · D15)')
            elif k in D8_KEYS:
                self.E('D8_FIELD', f'{path}/{k}: 시간 공식 · 읽는 시각에 기대는 필드가 패키지에 있다 (§9-9 · D8)')
            elif k not in allowed:
                self.E('SCHEMA_KEY', f'{path}/{k}: 계약에 없는 필드 ({kind})')
        miss = [k for k in required if k not in obj]
        if 'text' in miss and kind in BLOCK_TYPES:        # 블록 text 없음은 §9-4 의 code 하나로만 센다
            self.E('BLOCK_NO_TEXT', f'{path}: text 가 없다 (§9-4)')
            miss.remove('text')
        if miss:
            self.E('SCHEMA_MISSING', f'{path}: 필수 필드 없음 {miss} ({kind})')
        return not miss

    def plain_str(self, v, path, what):
        if not isinstance(v, str) or not v.strip():
            self.E('STRING_EMPTY', f'{path}: {what} 이 비었거나 문자열이 아니다')
        elif '<' in v or '>' in v:
            self.E('INLINE_FORMAT', f'{path}: {what} 에 태그가 있다 — 표시 문자열 하나여야 한다')

    # ---- RichText / span
    def rich(self, spans, path):
        if not isinstance(spans, list) or not spans:
            self.E('RICHTEXT_EMPTY', f'{path}: RichText 가 비었다')
            return
        for i, sp in enumerate(spans):
            self.span(sp, f'{path}/{i}')

    def span(self, sp, path):
        if not self.keys(sp, 'span', path):
            return
        text, layer, refs = sp['text'], sp['layer'], sp['refs']
        if not isinstance(text, str) or not text:
            self.E('SPAN_EMPTY', f'{path}: span text 가 비었다')
            text = ''
        # 7 — 인라인 서식
        rest = re.sub(r'</?b>', '', text)
        if '<' in rest or '>' in rest:
            self.E('INLINE_FORMAT', f'{path}: <b> 와 \\n 밖의 태그가 있다 — {text[:30]!r}')
        depth = 0
        for m in re.finditer(r'</?b>', text):
            depth += 1 if m.group(0) == '<b>' else -1
            if depth not in (0, 1):
                self.E('INLINE_FORMAT', f'{path}: <b> 가 중첩되거나 먼저 닫힌다')
                break
        if depth != 0:
            self.E('BOLD_CROSSES_SPAN', f'{path}: <b> 가 span 을 넘는다 — {text[:30]!r}')
        # 6 — layer · refs
        if layer not in LAYERS:
            self.E('SPAN_LAYER', f'{path}: layer={layer!r}')
            return
        self.layers[layer] = self.layers.get(layer, 0) + 1
        if not isinstance(refs, list) or any(not isinstance(x, str) for x in refs):
            self.E('SPAN_REFS', f'{path}: refs 가 문자열 목록이 아니다')
            return
        if len(set(refs)) != len(refs):
            self.E('REFS_DUP', f'{path}: refs 에 중복 {refs}')
        pend = sp.get('_refs_pending')
        where = f'{path} "{text[:24]}"'
        if layer == 'writing':
            if refs:
                self.E('REFS_WRITING', f'{path}: writing 인데 refs 가 있다 {refs}')
            if pend is not None:
                self.E('PENDING_INVALID', f'{path}: writing 은 기다릴 refs 가 없다')
        else:
            check = {'fact': (self.facts, r'F\d\d'), 'claim': (self.dcs, r'DC-[A-Z]'),
                     'concept': (self.concepts, r'C-\d{4}')}.get(layer)
            for r in refs:
                if check is None:
                    break                                   # bridge — Ref 모양은 0.2
                if not re.fullmatch(check[1], r):
                    self.E('REF_WRONG_LAYER', f'{path}: {layer} span 에 그 층이 아닌 Ref {r!r} — refs 는 그 층의 atom 만 (§6)')
                elif r not in check[0]:
                    self.E('REF_UNKNOWN', f'{path}: 브리프/개념 라이브러리에 없는 ID {r}')
            if not refs:
                if pend is None:
                    self.E('REFS_EMPTY', f'{path}: {layer} 인데 refs 가 비었고 0.2 대기 표시도 없다 (§9-6)')
                else:
                    ok = (isinstance(pend, dict) and pend.get('until') == '0.2'
                          and isinstance(pend.get('need'), str) and pend['need'].strip()
                          and set(pend) == {'until', 'need'})
                    if not ok:
                        self.E('PENDING_INVALID', f'{path}: _refs_pending 모양이 {{until:"0.2", need}} 가 아니다')
                    else:
                        allowed = NEED_FOR_LAYER.get(layer)
                        if allowed and pend['need'] not in allowed:
                            self.E('PENDING_NEED_LAYER', f'{path}: {layer} 의 need 는 {sorted(allowed)} 여야 한다 — {pend["need"]!r} (D22)')
                        self.pending.append((where, layer, pend['need']))
            elif pend is not None:
                self.E('PENDING_WITH_REFS', f'{path}: refs 가 있는데 _refs_pending 이 남아 있다')
        d = sp.get('_fact_refs_dropped')
        if d is not None:
            bad = [x for x in d if x not in self.facts] if isinstance(d, list) else ['?']
            if bad:
                self.E('DROPPED_UNKNOWN', f'{path}: _fact_refs_dropped 에 브리프에 없는 ID {bad}')
            self.dropped.append((where, d))

    # ---- 블록
    def emphasized(self, it, fields, path):
        if 'emphasized' in it and it['emphasized'] is not True:
            self.E('SCHEMA_KEY', f'{path}/emphasized: true 만 허용')
        if it.get('emphasized') is True:
            for f in fields:
                if f in it and isinstance(it[f], list) and it[f]:
                    t = rt(it[f]).strip()
                    if re.fullmatch(r'<b>(?:(?!</?b>).)*</b>', t, re.S):
                        self.E('EMPHASIZED_DOUBLE', f'{path}/{f}: emphasized 항목을 <b> 로 통째 감쌌다 — 강조를 두 번 적었다 (§9-8)')

    def block(self, b, path):
        t = b.get('type') if isinstance(b, dict) else None
        if t not in BLOCK_TYPES:
            self.E('BLOCK_TYPE', f'{path}: type={t!r} 이 원형 목록에 없다 (§9-5)')
            return
        if 'text' in b and not isinstance(b['text'], str):
            self.E('BLOCK_NO_TEXT', f'{path}: text 가 문자열이 아니다 (§9-4)')
        ok = self.keys(b, t, path) and isinstance(b.get('text'), str)
        try:
            if t == 'prose':
                if not b.get('paragraphs'):
                    self.E('SCHEMA_MISSING', f'{path}: paragraphs 가 비었다')
                for j, p in enumerate(b.get('paragraphs', [])):
                    if self.keys(p, 'para', f'{path}/paragraphs/{j}'):
                        if p['weight'] not in WEIGHTS:
                            self.E('SCHEMA_KEY', f'{path}/paragraphs/{j}: weight={p["weight"]!r}')
                        self.rich(p['body'], f'{path}/paragraphs/{j}/body')
            elif t == 'quote':
                if 'attribution' in b:
                    self.plain_str(b['attribution'], f'{path}/attribution', 'attribution')
                if 'body' in b:
                    self.rich(b['body'], f'{path}/body')
                    for sp in b['body'] if isinstance(b['body'], list) else []:
                        if isinstance(sp, dict) and sp.get('layer') != 'fact':
                            self.E('QUOTE_LAYER', f'{path}/body: 인용 글의 span 은 layer fact 다 (§7.4)')
            elif t == 'list':
                if not isinstance(b.get('ordered'), bool):
                    self.E('SCHEMA_MISSING', f'{path}: ordered 가 불리언이 아니다')
                if not b.get('items'):
                    self.E('SCHEMA_MISSING', f'{path}: items 가 비었다')
                for j, it in enumerate(b.get('items', [])):
                    if self.keys(it, 'listitem', f'{path}/items/{j}'):
                        if 'label' in it:
                            self.rich(it['label'], f'{path}/items/{j}/label')
                        self.rich(it['body'], f'{path}/items/{j}/body')
                        self.emphasized(it, ('label', 'body'), f'{path}/items/{j}')
            elif t == 'contrast':
                if not b.get('items'):
                    self.E('SCHEMA_MISSING', f'{path}: items 가 비었다')
                for j, it in enumerate(b.get('items', [])):
                    if self.keys(it, 'citem', f'{path}/items/{j}'):
                        if 'value' not in it and 'body' not in it:
                            self.E('SCHEMA_MISSING', f'{path}/items/{j}: value 와 body 중 하나 이상')
                        for f in ('label', 'value', 'body'):
                            if f in it:
                                self.rich(it[f], f'{path}/items/{j}/{f}')
                        self.emphasized(it, ('value', 'body'), f'{path}/items/{j}')
            elif t == 'sheet':
                if not b.get('rows'):
                    self.E('SCHEMA_MISSING', f'{path}: rows 가 비었다')
                for j, r in enumerate(b.get('rows', [])):
                    if self.keys(r, 'row', f'{path}/rows/{j}'):
                        self.rich(r['label'], f'{path}/rows/{j}/label')
                        self.rich(r['value'], f'{path}/rows/{j}/value')
        except (KeyError, TypeError, AttributeError) as e:
            self.E('SCHEMA_TYPE', f'{path}: 구조가 계약과 다르다 ({type(e).__name__} {e})')
            return
        # 4 — text == linearize(block)
        if ok and isinstance(b.get('text'), str) and not any(c in ('SCHEMA_TYPE', 'SCHEMA_MISSING') for c, m in self.errs if m.startswith(path)):
            try:
                want = linearize(b)
            except (KeyError, TypeError) as e:
                self.E('SCHEMA_TYPE', f'{path}: 선형화 못 한다 ({e})')
                return
            if b['text'] != want:
                self.E('TEXT_MISMATCH', f'{path}: text != linearize(block)\n         text      {b["text"]!r}\n         linearize {want!r}')


# ---------------------------------------------------------------- D8 주석
def resolve(obj, path):
    try:
        for tok in path.split('/'):
            obj = obj[int(tok)] if isinstance(obj, list) else obj[tok]
    except (KeyError, IndexError, ValueError, TypeError):
        return None
    return obj


def plain_of(x):
    if isinstance(x, list):
        return strip_tags(''.join(s.get('text', '') for s in x if isinstance(s, dict)))
    return strip_tags(x) if isinstance(x, str) else None


def check_volatility(obj, tag, pub, errs, warns):
    E = lambda code, msg: errs.append((code, msg))
    for v in obj.get('_volatility', []):
        w = f'{tag} {v.get("where")} "{v.get("span")}"'
        txt = plain_of(resolve(obj, v['where'])) if isinstance(v.get('where'), str) else None
        if txt is None or v['span'] not in txt:
            E('VOL_SPAN', f'{w}: where 가 가리키는 글에 span 이 없다')
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
            if pub is None:                          # published_at 이 없으면 재계산할 기준이 없다 — 위에서 이미 실패로 셌다
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


def check(doc, ids, publish=False):
    """-> (errs, warns, checker). errs: (code, msg) 목록"""
    c = Checker(ids, publish)
    for k in FORBIDDEN_TOP:
        if k in doc:
            c.E('D9_OBSERVED_KEY', f'최상단에 {k} 가 있다')

    def walk(o, path=''):                              # 3 — `_` 주석 안까지 포함해 어디에도 없다
        if isinstance(o, dict):
            for k, v in o.items():
                if POINTER_KEY.match(k):
                    c.E('POINTER_FIELD', f'{path}/{k}: 다른 슬라이드를 가리키는 필드 (§9-3 · D15)')
                walk(v, f'{path}/{k}')
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f'{path}/{i}')
    walk(doc)
    # keys() 도 POINTER 를 잡으므로 같은 위치를 두 번 세지 않게 중복 제거는 하지 않고 code 로 묶어 본다

    if not c.keys(doc, 'package', ''):
        return c.errs, c.warns, c
    pub = doc['published_at']
    try:
        dt.date.fromisoformat(pub)
    except (TypeError, ValueError):
        c.E('D8_NO_PUBLISHED_AT', f'published_at={pub!r} 가 날짜(YYYY-MM-DD)가 아니다')
        pub = None
    if doc['lang'] != 'ko':
        c.E('SCHEMA_KEY', f'lang={doc["lang"]!r}')
    if not isinstance(doc['title'], str) or not doc['title'].strip() or doc['title'].startswith('Claro'):
        c.E('SCHEMA_KEY', 'title 이 비었거나 브랜드("Claro — ")가 붙어 있다 (§2)')
    if not isinstance(doc['event_ref'], str) or not doc['event_ref']:
        c.E('SCHEMA_KEY', 'event_ref 가 비었다')

    levels = doc['levels']
    # 1
    if not isinstance(levels, list) or not 1 <= len(levels) <= 3:
        c.E('LEVELS_COUNT', f'levels 는 1~3개여야 한다 — {len(levels) if isinstance(levels, list) else levels!r}')
        return c.errs, c.warns, c
    ids_ = [lv.get('id') if isinstance(lv, dict) else None for lv in levels]
    if any(i not in LEVEL_IDS for i in ids_) or len(set(ids_)) != len(ids_) \
            or [i for i in LEVEL_IDS if i in ids_] != ids_:
        c.E('LEVEL_ID', f'레벨 id {ids_} — basic · intermediate · advanced 중, 겹치지 않고 그 순서여야 한다 (§9-1 · D20)')

    for lv in levels:
        if not c.keys(lv, 'level', f'levels/{lv.get("id") if isinstance(lv, dict) else "?"}'):
            continue
        lid = lv['id']
        slides, oqs = lv['slides'], lv['open_questions']
        if not isinstance(slides, list) or not slides:
            c.E('SLIDES_EMPTY', f'{lid}: slides 가 비었다')
            continue
        # 2
        if not isinstance(oqs, list) or len(oqs) != len(slides) - 1:
            c.E('OQ_LENGTH', f'{lid}: open_questions {len(oqs) if isinstance(oqs, list) else "?"}개, 슬라이드 {len(slides)}장 — 길이는 slides − 1 (D15 QA①)')
        for i, oq in enumerate(oqs if isinstance(oqs, list) else []):
            if c.keys(oq, 'oq', f'{lid}/open_questions/{i}'):
                if not isinstance(oq['text'], str) or not oq['text'].strip():
                    c.E('OQ_EMPTY', f'{lid}/open_questions/{i}: text 가 비었다 (D15 QA①)')
                elif '<' in oq['text'] or '>' in oq['text']:
                    c.E('INLINE_FORMAT', f'{lid}/open_questions/{i}: text 에 태그가 있다')
                check_volatility(oq, f'{lid}/open_questions/{i}', pub, c.errs, c.warns)
        for i, s in enumerate(slides):
            path = f'{lid}[{i}]'
            if not c.keys(s, 'slide', path):
                continue
            c.plain_str(s['kicker'], f'{path}/kicker', 'kicker')
            c.rich(s['headline'], f'{path}/headline')
            if not isinstance(s['blocks'], list) or not s['blocks']:
                c.E('BLOCKS_EMPTY', f'{path}: blocks 가 비었다 (§9-1)')
                continue
            for j, b in enumerate(s['blocks']):
                c.block(b, f'{path}/blocks/{j}')
            check_volatility(s, path, pub, c.errs, c.warns)
    return c.errs, c.warns, c


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


def pending_summary(c):
    from collections import Counter
    n = Counter(need for _, _, need in c.pending)
    return f'0.2 대기 {len(c.pending)} span — ' + ' · '.join(f'{k} {v}' for k, v in sorted(n.items())) if c.pending else ''


def report(c):
    print('  층별 span 수:', dict(sorted(c.layers.items())), f'(합 {sum(c.layers.values())})')
    for where, layer, need in c.pending:
        print(f'  대기 [{layer:<6} {need}] {where}')
    for where, d in c.dropped:
        print(f'  끊긴 F 연결 {d} — {where}')


def main(argv):
    rep = '--report' in argv
    publish = '--publish' in argv
    paths = [a for a in argv if not a.startswith('--')] or \
        [GOLDEN] + sorted(glob.glob(os.path.join(ROOT, 'fixtures/invalid/*.json')))
    ids = known_ids()
    golden = json.load(open(GOLDEN, encoding='utf-8'))
    failed = 0
    for p in paths:
        doc = json.load(open(p, encoding='utf-8'))
        rel = os.path.relpath(p, ROOT)
        errs, warns, c = check(doc, ids, publish)
        viol = doc.get('_violation')
        if viol is None:
            print(f'{"PASS" if not errs else "FAIL"}  {rel}')
            for code, m in errs:
                print(f'   ERROR {code}: {m}')
            if c.pending:
                print(f'   WARN  {pending_summary(c)}')
            for w in warns:
                print(f'   WARN  {w}')
            failed += bool(errs)
            if rep and not errs:
                report(c)
        else:
            codes = sorted({code for code, _ in errs})
            diffs = leaf_diff(golden, doc)
            ok = codes == [viol['code']] and len(diffs) == 1
            print(f'{"PASS" if ok else "FAIL"}  {rel}  — 거부 기대 {viol["code"]}')
            print(f'   검출: {codes}')
            for code, m in errs:
                print(f'   {code}: {m}')
            print(f'   골든과 다른 곳 {len(diffs)}군데: {diffs}')
            failed += not ok
    print('\nOK' if not failed else f'\n{failed}개 실패')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
