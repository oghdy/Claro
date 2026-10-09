"""골든 픽스처 검증 — ARTICLE_PACKAGE §9 불변식 + 층별 Ref + D8 (B-0.1b · 0.2m-a 에서 계약 모양으로).

    python3 scripts/verify-article.py             # 골든 한 벌 + fixtures/invalid/*.json
    python3 scripts/verify-article.py --report    # 층 분포 · 대기 span 목록까지 출력
    python3 scripts/verify-article.py --publish   # §9-10 까지: 패키지에 `_` 필드가 하나라도 있으면 실패 (발행 검사)

골든 한 벌 (0.2m-a)
  fixtures/fomc-2026-09.article.json   ArticlePackage — 프론트로 가는 것 (+ 픽스처 주석 `_source`)
  fixtures/fomc-2026-09.record.json    ArticleRecord 의 나머지 — article_id · article_version · authoring. `_package` 가 위 파일을 가리킨다
  fixtures/store.json                  패키지의 참조가 가리키는 것 — Event · Storyline · Source · Fact · FactSource · DerivedClaim · Bridge
  docs/content/concept-library.json    Concept · ConceptVersion (CONCEPT_IDENTITY)

계약 §9 (발행 불변식)
  1  levels 1~3개, id 는 basic · intermediate · advanced 중 하나·겹치지 않음·그 순서. slides ≥ 1, blocks ≥ 1
  2  open_questions.length == slides.length − 1, 모든 text 가 비어 있지 않다 (D15 QA①)
  3  다른 슬라이드를 가리키는 필드가 없다 (resolves · goto · index 류, D15)
  4  모든 블록에 type · text, text == linearize(block) (D14 규칙 1 · 6)
  5  type 이 원형 5개 안에 있다
  6  모든 span 에 layer. writing 이면 refs 가 비고, 나머지는 1개 이상이며 **그 층의 Ref** 다 (DATA_MODEL §2.2) —
       fact → Fact 의 UUID · claim → DerivedClaim 의 UUID · bridge → Bridge 의 UUID · concept → ConceptRef { concept_id, version, part }
     가리킨 것이 저장소에 있어야 한다. 옛 문자열("F31" · "DC-C" · "C-0002")은 Ref 가 아니다
     `_refs_pending` 이 있는 span 은 픽스처에서만 허용하고 WARN 으로 센다 — 대기 표시 없이 비면 실패 (§6.2)
  7  인라인 서식은 <b> 와 \\n 뿐, <b> 는 span 을 넘지 않는다
  8  emphasized 항목은 <b> 로 통째 감싸지 않는다
  9  시간 공식이나 읽는 시각에 기대는 필드가 패키지에 없다 (D8) — 저작 데이터는 record 의 authoring 에 있다
  10 발행물에는 `_` 필드가 없다 — 픽스처에서는 허용, --publish 에서만 검사한다
D8 (record.authoring.time_expressions — DATA_MODEL §6.3)
  조각이 그 글에 정확히 한 번 / VOLATILE 조각은 as_of 가 있는 VOLATILE 사실을 가리킨다 /
  DERIVED 의 입력 사실은 전부 STABLE / DERIVED 는 published_at 으로 재계산해 불변식 확인
D9  골든에 observed 전용 키(_findings 등)가 없다
스키마 각 개체가 계약이 정한 필드만 갖는다. 옛 저작 주석(`_volatility` · `_fact_refs_dropped` …)이 패키지에 남으면 실패

fixtures/invalid/*.json — `_violation { code, of }` 가 있다. `of` 는 골든 한 벌 중 그 파일이 갈아 끼우는 파일이다.
선언한 code 로만 거부돼야 통과다. 또 그 골든 파일과 정확히 한 군데만 달라야 한다(위반 하나만 주입).
"""
import calendar, datetime as dt, glob, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
RECORD = os.path.join(ROOT, 'fixtures/fomc-2026-09.record.json')
STORE = os.path.join(ROOT, 'fixtures/store.json')
CONCEPTS = os.path.join(ROOT, 'docs/content/concept-library.json')
GOLDEN_SET = {os.path.basename(p): p for p in (GOLDEN, RECORD, STORE)}
UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
# 0.2m-a 에서 자리를 옮긴 저작 주석 — 패키지에 남아 있으면 안 된다 (DATA_MODEL §11)
OLD_ANNOTATIONS = ('_volatility', '_published_at_basis', '_fact_refs_dropped', '_attribution_refs', '_source_note')
PENDING_NEEDS = {'Bridge': {'bridge'}, 'DerivedClaim': {'claim'}, 'Fact 출처': {'fact'}, 'Fact 승격': {'fact'}}   # DATA_MODEL §17

FORBIDDEN_TOP = ('_findings', '_dom_inventory', '_transcription_notes', '_render_time_computation')
LEVEL_IDS = ('basic', 'intermediate', 'advanced')
LAYERS = ('fact', 'claim', 'concept', 'bridge', 'writing')
BLOCK_TYPES = ('prose', 'quote', 'list', 'contrast', 'sheet')
WEIGHTS = ('normal', 'secondary', 'callout', 'conclusion')
# 계약 §9-3 — 다른 슬라이드를 가리키는 필드 / §9-9 — 시간 공식·읽는 시각에 기대는 필드
POINTER_KEY = re.compile(r'^(resolves|goto\w*|index|\w+_index|next_slide|target_slide)$')
D8_KEYS = ('formula', 'as_of', 'as_of_basis', 'derived_from', 'value_at_authoring', 'volatility', 'invariant',
           'check', 'class', 'now', 'render', 'recompute')

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


class Known:
    """참조가 가리킬 수 있는 것 — 저장소(store.json)와 개념 저장소에서"""

    def __init__(self, store, concepts):
        self.store = store
        self.facts = {f['fact_id']: f for f in store.get('facts', [])}
        self.claims = {c['claim_id']: c for c in store.get('claims', [])}
        self.bridges = {b['bridge_id']: b for b in store.get('bridges', [])}
        self.events = {e['event_id']: e for e in store.get('events', [])}
        self.storylines = {x['storyline_id']: x for x in store.get('storylines', [])}
        self.concepts = {c['concept_id']: c for c in concepts.get('concepts', [])}
        self.parts = {}                                  # concept_id → 지금 버전의 part 이름
        for v in concepts.get('versions', []):
            c = self.concepts.get(v['concept_id'])
            if not c or c['version'] != v['version']:
                continue
            ps = {f'FULL:{st["label"]}' if st['label'] else 'FULL' for st in v['full']} | {'REFRESHER'}
            ps |= {f'ANALOGY:{a["name"]}' for a in v['analogies']} | ({'BOUNDARY'} if v['boundary'] else set())
            self.parts[v['concept_id']] = ps

    def layer_of(self, ref):
        """그 UUID 가 어느 층의 것인가 (층 섞임을 가려 말하려고)"""
        for name, pool in (('fact', self.facts), ('claim', self.claims), ('bridge', self.bridges), ('concept', self.concepts)):
            if ref in pool:
                return name
        return None


def read_json(path):
    return json.load(open(path, encoding='utf-8'))


def known_ids(store=None, concepts=None):
    return Known(read_json(STORE) if store is None else store, read_json(CONCEPTS) if concepts is None else concepts)


def load_bundle(replace=None):
    """골든 한 벌 → {package, record, store, concepts}. replace = {파일 이름: 내용} 이면 그 파일만 갈아 끼운다 (invalid 픽스처)"""
    replace = replace or {}
    get = lambda p: replace[os.path.basename(p)] if os.path.basename(p) in replace else read_json(p)
    record = get(RECORD)
    pkg_name = record.get('_package', os.path.basename(GOLDEN))
    package = replace[pkg_name] if pkg_name in replace else read_json(os.path.join(ROOT, 'fixtures', pkg_name))
    return {'package': package, 'record': record, 'store': get(STORE), 'concepts': read_json(CONCEPTS)}


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
    def __init__(self, known, publish=False):
        self.known = known
        self.publish = publish
        self.errs = []                 # (code, msg)
        self.warns = []                # 문자열
        self.pending = []              # (경로, layer, need, 문장 앞부분)
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
                if k in OLD_ANNOTATIONS:
                    self.E('OLD_ANNOTATION', f'{path}/{k}: 옛 저작 주석이 패키지에 남았다 — record 의 authoring · 저장소로 옮겨야 한다 (DATA_MODEL §11)')
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
        if not isinstance(refs, list):
            self.E('SPAN_REFS', f'{path}: refs 가 목록이 아니다')
            return
        K = self.known
        ok = True
        for r in refs:                                  # 원소 모양은 층이 정한다 (DATA_MODEL §2.2)
            if layer == 'concept':
                if not isinstance(r, dict) or set(r) != {'concept_id', 'version', 'part'}:
                    self.E('SPAN_REFS', f'{path}: concept 층의 Ref 는 ConceptRef {{concept_id, version, part}} 다 — {r!r}')
                    ok = False
            elif not isinstance(r, str):
                self.E('SPAN_REFS', f'{path}: {layer} 층의 Ref 는 UUID 문자열 하나다 — {r!r}')
                ok = False
        if not ok:
            return
        keys = [json.dumps(r, sort_keys=True, ensure_ascii=False) for r in refs]
        if len(set(keys)) != len(keys):
            self.E('REFS_DUP', f'{path}: refs 에 중복')
        pend = sp.get('_refs_pending')
        where = f'{path} "{text[:24]}"'
        if layer == 'writing':
            if refs:
                self.E('REFS_WRITING', f'{path}: writing 인데 refs 가 있다 {refs}')
            if pend is not None:
                self.E('PENDING_INVALID', f'{path}: writing 은 기다릴 refs 가 없다')
        else:
            pool = {'fact': K.facts, 'claim': K.claims, 'bridge': K.bridges}.get(layer)
            for r in refs:
                if layer == 'concept':
                    c = K.concepts.get(r['concept_id'])
                    if c is None:
                        self.E('REF_UNKNOWN', f'{path}: concept_id {r["concept_id"]!r} 가 개념 저장소에 없다')
                    elif not isinstance(r['version'], int) or isinstance(r['version'], bool) or not 1 <= r['version'] <= c['version']:
                        self.E('REF_VERSION', f'{path}: {c["code"]}@{r["version"]!r} — 버전은 1~{c["version"]}')
                    elif r['part'] is not None and r['version'] == c['version'] and r['part'] not in K.parts.get(r['concept_id'], ()):
                        self.E('REF_PART', f'{path}: {c["code"]}@{r["version"]} 에 part {r["part"]!r} 가 없다 (CONCEPT_IDENTITY §3.3)')
                elif r in pool:
                    continue
                elif K.layer_of(r):
                    self.E('REF_WRONG_LAYER', f'{path}: {layer} span 에 {K.layer_of(r)} 의 Ref — refs 는 그 층의 atom 만 (§6)')
                elif not UUID_RE.match(r):
                    self.E('REF_SHAPE', f'{path}: {layer} 층의 Ref {r!r} 가 UUID 가 아니다 — label · code 는 참조에 쓰지 않는다 (DATA_MODEL §2.1)')
                else:
                    self.E('REF_UNKNOWN', f'{path}: {r} 가 {layer} 저장소에 없다')
            if not refs:
                if pend is None:
                    self.E('REFS_EMPTY', f'{path}: {layer} 인데 refs 가 비었고 대기 표시도 없다 (§9-6)')
                else:
                    ok = (isinstance(pend, dict) and pend.get('until') == '0.2'
                          and isinstance(pend.get('need'), str) and pend['need'].strip()
                          and set(pend) == {'until', 'need'})
                    if not ok:
                        self.E('PENDING_INVALID', f'{path}: _refs_pending 모양이 {{until:"0.2", need}} 가 아니다')
                    else:
                        if pend['need'] not in PENDING_NEEDS:
                            self.E('PENDING_NEED_LAYER', f'{path}: need {pend["need"]!r} 가 대기 어휘 {sorted(PENDING_NEEDS)} 밖이다 (DATA_MODEL §17)')
                        elif layer not in PENDING_NEEDS[pend['need']]:
                            self.E('PENDING_NEED_LAYER', f'{path}: {layer} 층에 need {pend["need"]!r} — 층과 맞지 않는다 (D22 · DATA_MODEL §17)')
                        self.pending.append((where, layer, pend['need']))
            elif pend is not None:
                self.E('PENDING_WITH_REFS', f'{path}: refs 가 있는데 _refs_pending 이 남아 있다')

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


def check_record(pkg, record, K, pub, errs, warns):
    """ArticleRecord 의 키 + authoring.time_expressions (D8 · DATA_MODEL §6.3). 깊은 검사는 verify-data-model.py"""
    E = lambda code, msg: errs.append((code, msg))
    aid, av = record.get('article_id'), record.get('article_version')
    if not (isinstance(aid, str) and UUID_RE.match(aid)) or type(av) is not int or av < 1:
        E('RECORD_KEY', f'article_id {aid!r} · article_version {av!r} — UUID 와 양의 정수 (DATA_MODEL 불변식 26)')
    auth = record.get('authoring')
    if not isinstance(auth, dict) or set(auth) != {'time_expressions', 'storylines', 'notes'}:
        E('RECORD_SHAPE', 'authoring 은 { time_expressions, storylines, notes } 다 (DATA_MODEL §1)')
        return
    levels = {lv.get('id'): lv for lv in pkg.get('levels', []) if isinstance(lv, dict)}
    for te in auth['time_expressions']:
        at = te.get('at') or {}
        w = f'{at.get("level")} {at.get("path")} "{at.get("fragment")}"'
        txt = plain_of(resolve(levels.get(at.get('level')), at['path'])) if isinstance(at.get('path'), str) and at.get('level') in levels else None
        if txt is None or not isinstance(at.get('fragment'), str) or len(re.findall(re.escape(at['fragment']), txt)) != 1:
            E('VOL_SPAN', f'{w}: at 이 가리키는 글에 조각이 정확히 한 번 있어야 한다 (DATA_MODEL 불변식 15)')
        cls = te.get('class')
        if cls not in ('DERIVED', 'VOLATILE'):
            E('VOL_CLASS', f'{w}: class={cls!r} — DERIVED · VOLATILE 만 적는다 (STABLE 은 적지 않는다)')
        if cls == 'VOLATILE':
            fs = [K.facts.get(x) for x in te.get('facts', [])]
            if not fs or any(f is None or f['volatility'] != 'VOLATILE' for f in fs):
                E('VOLATILE_NO_FACT', f'{w}: VOLATILE 조각은 VOLATILE 사실을 1개 이상 가리킨다 (DATA_MODEL 불변식 16)')
            for f in fs:
                if f is None or f['volatility'] != 'VOLATILE':
                    continue
                if not f.get('as_of'):
                    E('VOLATILE_MISSING_AS_OF', f'{w}: 사실 {f["label"]} 이 VOLATILE 인데 as_of 가 없다 (D8 · DATA_MODEL §6.2)')
                elif not re.fullmatch(r'\d{4}-\d{2}(-\d{2})?', f['as_of']):
                    E('VOLATILE_BAD_AS_OF', f'{w}: 사실 {f["label"]} as_of={f["as_of"]}')
        if cls == 'DERIVED':
            ins = te.get('inputs', [])
            vs = [x['key'] for x in ins if x.get('fact') and K.facts.get(x['fact'], {}).get('volatility') != 'STABLE']
            if vs:
                E('DERIVED_FROM_VOLATILE', f'{w}: 입력 {vs} 의 사실이 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다')
                continue
            if pub is None:                          # published_at 이 없으면 재계산할 기준이 없다 — 위에서 이미 실패로 셌다
                continue
            entry = {'formula': {k: v for k, v in te['formula'].items() if v is not None}, 'value_at_authoring': te['value_at_authoring'],
                     'check': te['check'], 'derived_from': [{'key': x['key'], 'value': x['value']} for x in ins]}
            got = evaluate(entry, pub)
            if got == 'FAIL':
                E('DERIVED_INVARIANT_FAIL', f'{w}: recompute(published_at) != value_at_authoring (D8 규칙 3)')
            elif got == 'UNVERIFIABLE':
                warns.append(f'{w}: DERIVED 불변식 검증 불가 — 입력의 정밀도가 모자라다')
            nofact = [x['key'] for x in ins if not x.get('fact')]
            if nofact:
                warns.append(f'{w}: DERIVED 입력 {nofact} 에 사실이 없다')
    for f in K.facts.values():                       # 조각이 가리키지 않아도 — VOLATILE 사실은 as_of 가 있다
        if f['volatility'] == 'VOLATILE' and not f.get('as_of') and not any(f['fact_id'] in te.get('facts', []) for te in auth['time_expressions']):
            E('VOLATILE_MISSING_AS_OF', f'사실 {f["label"]}: VOLATILE 인데 as_of 가 없다 (DATA_MODEL 불변식 6)')


def check(doc, known, publish=False, record=None):
    """-> (errs, warns, checker). errs: (code, msg) 목록. doc = 패키지, record = ArticleRecord 의 나머지 (있으면 D8 까지)"""
    c = Checker(known, publish)
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
    if doc['event_ref'] not in known.events:
        c.E('EVENT_REF', f'event_ref {doc["event_ref"]!r} 가 Event 의 키(UUID)가 아니다 — code 는 참조에 쓰지 않는다 (DATA_MODEL §2.2 · D27)')

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
    # 패키지의 뼈대(레벨 · 장 · 필드)가 깨졌으면 저작 데이터를 대지 않는다 — 자리를 못 찾는 것이 당연하다
    broken = {'LEVEL_ID', 'SLIDES_EMPTY', 'OQ_LENGTH', 'SCHEMA_MISSING', 'SCHEMA_KEY', 'SCHEMA_TYPE', 'BLOCKS_EMPTY'}
    if record is not None and not any(code in broken for code, _ in c.errs):
        check_record(doc, record, known, pub, c.errs, c.warns)
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
    return f'대기 {len(c.pending)} span — ' + ' · '.join(f'{k} {v}' for k, v in sorted(n.items())) if c.pending else ''


def report(c):
    print('  층별 span 수:', dict(sorted(c.layers.items())), f'(합 {sum(c.layers.values())})')
    for where, layer, need in c.pending:
        print(f'  대기 [{layer:<6} {need}] {where}')


def run_bundle(b, publish=False):
    return check(b['package'], Known(b['store'], b['concepts']), publish, b['record'])


def main(argv):
    rep = '--report' in argv
    publish = '--publish' in argv
    failed = 0
    gold = load_bundle()
    errs, warns, c = run_bundle(gold, publish)
    print(f'{"PASS" if not errs else "FAIL"}  골든 한 벌 — ' + ' · '.join(os.path.relpath(p, ROOT) for p in (GOLDEN, RECORD, STORE)))
    for code, m in errs:
        print(f'   ERROR {code}: {m}')
    print(f'   대기 span {len(c.pending)}' + (f' — {pending_summary(c)}' if c.pending else ''))
    for w in warns:
        print(f'   WARN  {w}')
    failed += bool(errs)
    if rep and not errs:
        report(c)
    for p in sorted(glob.glob(os.path.join(ROOT, 'fixtures/invalid/*.json'))):
        doc = read_json(p)
        rel = os.path.relpath(p, ROOT)
        viol = doc.get('_violation') or {}
        of = viol.get('of')
        if of not in GOLDEN_SET:
            print(f'FAIL  {rel}  — `_violation.of` 가 골든 한 벌의 파일 이름이 아니다: {of!r}')
            failed += 1
            continue
        body = {k: v for k, v in doc.items() if k != '_violation'}
        errs, _, _ = run_bundle(load_bundle({of: body}))
        codes = sorted({code for code, _ in errs})
        diffs = leaf_diff(read_json(GOLDEN_SET[of]), body)
        ok = codes == [viol['code']] and len(diffs) == 1
        print(f'{"PASS" if ok else "FAIL"}  {rel}  — {of} 를 갈아 끼움 · 거부 기대 {viol["code"]}')
        print(f'   검출: {codes}')
        for code, m in errs:
            print(f'   {code}: {m}')
        print(f'   골든과 다른 곳 {len(diffs)}군데: {diffs}')
        failed += not ok
    print('\nOK' if not failed else f'\n{failed}개 실패')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
