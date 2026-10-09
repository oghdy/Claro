#!/usr/bin/env python3
"""DATA_MODEL.md 를 기계로 확인한다 (B-0.2b · 0.2m-a 에서 실물 저장소로).

    python3 scripts/verify-data-model.py            # 검사
    python3 scripts/verify-data-model.py --report   # + 게이트 3 후보 · 발행 검사에서 막히는 것 (독자에게 닿는 것 / 기계 검증용)

네 곳을 본다.
  A. 계약 문서   확정 필드 · enum (§5.1 · §5.2 · §5.3 · §5.5 · §6.2 · §4.1 · D8) 이 다 있다. §9.6 보류 항목이 없다.
                 다른 계약 · 0.2c 의 타입을 정의하지 않았다. 실물 없는 구조 절에 "실물 없음".
                 세 브리프의 모든 사실 타입이 §3.3 표에 있다. 공식 op 표 = 실물 7개
  B. 로그        0.2b 로그 머리 요약에 질문 10개가 [계약 반영 / _open / 미확인] 과 근거를 갖는다
  C. 원천        저장소(fixtures/store.json)가 원천을 옮기기만 했는가 —
                 브리프 사실 F01~F38 의 claim_text 가 브리프 글자 그대로다 (나눈 것은 그 글의 부분) ·
                 `_passage`(1차 구절)가 C-3 기록 · 스토리라인 문서에 글자 그대로 있다 · 개체 필드가 계약 타입과 같다
  D. 모델        골든 한 벌(article · record · store) + 개념 저장소를 계약 모양 그대로 읽어 불변식을 돌린다.
                 지금 검사는 통과해야 하고, 발행 검사에서 막히는 것은 WARN 으로 센다 — 콘텐츠 · 파이프라인이 채울 것

exit 0 OK (WARN 은 있을 수 있다) · 1 FAIL
"""
import calendar, copy, datetime as dt, importlib.util, json, os, re, sys, uuid
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/DATA_MODEL.md')
LOG = os.path.join(ROOT, 'logs/backend/phase-0-step-0-2b.md')
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')
# 저장소의 1차 구절(`_passage`)이 글자 그대로 있어야 하는 기록 — 구절을 지어내지 못하게 한다
RECORDS = [os.path.join(ROOT, p) for p in ('logs/content/source-check-2026-10.md', 'docs/findings/storyline-iran-war.md',
                                           'logs/content/golden-correction-2026-10.md')]
BRIEFS = {
    'FOMC': os.path.join(ROOT, 'docs/findings/fomc-2026-09-brief.md'),
    'FTC': os.path.join(ROOT, 'docs/findings/ftc-personalized-pricing-brief.md'),
    '스크루웜': os.path.join(ROOT, 'docs/findings/screwworm-c-type-brief.md'),
}


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VA = _load('va', 'scripts/verify-article.py')              # 선형화 · D8 재계산 · 경로 풀기
VC = _load('vc', 'scripts/verify-concept-identity.py')      # ts 타입 파서 · 절 나누기 · §9.6 금지어 · 라이브러리

# ── A. 계약 문서 ─────────────────────────────────────────────────────────────
REQUIRED_FIELDS = {
    # 확정 §5.5 fact_claim · §5.3 event_at · §5.4 as_of · §5.2 actor · 소유 (실물)
    'Fact': ('fact_id', 'label', 'claim_text', 'fact_type', 'actor', 'volatility', 'as_of', 'event_at', 'event_id',
             'storyline_id', 'storyline_version', 'extraction_model', 'extraction_version'),
    'FactSource': ('fact_id', 'source_id', 'section', 'span_start', 'span_end'),            # §5.5 · §5.3 N:M
    'Source': ('source_id', 'label', 'title', 'publisher', 'url', 'kind', 'language', 'published_at', 'ingested_at'),
    'SourceDocument': ('source_id', 'text'),                                                   # §5.5 원문 보관
    'SourceRegistry': ('source', 'access_method', 'can_ingest', 'can_store', 'can_quote', 'can_transform',
                       'commercial_use', 'attribution_required', 'terms_url', 'last_reviewed_at'),   # §5.1
    'DerivedClaim': ('claim_id', 'label', 'event_id', 'statement', 'kind', 'basis', 'checks'),
    'CounterCheck': ('question', 'slot', 'recollected', 'answer', 'facts', 'outcome'),           # §7.2
    'Bridge': ('bridge_id', 'label', 'bridge_type', 'event_id', 'concept_id', 'concept_version', 'slot',
               'from_event', 'facts'),
    'Event': ('event_id', 'code', 'title', 'occurred_at', 'storyline_id'),                     # code — D27
    'Storyline': ('storyline_id', 'code', 'title', 'version', 'ongoing'),                      # §9.2 · code — D27                              # §9.2
    'StorylineVersion': ('storyline_id', 'version', 'created_at', 'change'),
    'ArticleRecord': ('article_id', 'article_version', 'package', 'authoring'),     # D30
    'ArticleAuthoring': ('time_expressions', 'storylines', 'notes'),
    'StorylinePin': ('storyline_id', 'version'),
    'TimeExpression': ('at', 'class', 'facts', 'value_at_authoring', 'check', 'formula', 'inputs'),
    'SlotCheck': ('slot', 'status', 'facts', 'sources', 'storyline'),                         # §6.2
}
FACT_TYPES = {'OFFICIAL_ACTION', 'OFFICIAL_CLAIM', 'OFFICIAL_LIMIT', 'MEASUREMENT', 'COURT_RULING',
              'COMPANY_DISCLOSURE', 'INDEPENDENT_OBSERVATION'}                               # 확정 §5.2
REQUIRED_ENUMS = {
    ('Fact', 'volatility'): {'STABLE', 'VOLATILE'},                                            # §5.4 · D8
    ('TimeExpression', 'class'): {'DERIVED', 'VOLATILE'},                                      # D8
    ('Bridge', 'bridge_type'): {'CONCEPT_BRIDGE', 'STORY_BRIDGE'},                             # §4.1
    ('SlotCheck', 'status'): {'FOUND', 'NOT_EXTRACTED', 'SOURCE_UNAVAILABLE', 'NOT_APPLICABLE', 'STORYLINE_STALE'},
    ('Source', 'kind'): {'PRIMARY', 'SECONDARY'},                                              # §5.1
    ('DerivedClaim', 'kind'): {'ASSERTED', 'DEFENSIVE'},                                       # 실물 DC-B
    ('CounterCheck', 'outcome'): {'NOT_REFUTED', 'SCOPED', 'UNRESOLVED'},                      # 실물 DC-A · C · B
}
OPS = {'days_inclusive', 'weeks', 'months', 'months_round', 'years', 'years_floor', 'year_of'}   # 실물 7
# 다른 계약 · 0.2c 의 타입 — 이 계약의 타입 블록에 정의되면 안 된다
FOREIGN_TYPES = ('Concept', 'ConceptVersion', 'ConceptRef', 'ConceptAlias', 'ConflictingAlias', 'ConceptRelation',
                 'BridgeSlot', 'ArticlePackage', 'Level', 'Slide', 'Span', 'Block', 'OpenQuestion',
                 'KnowledgeEvidence', 'knowledge_evidence', 'UserConceptState', 'user_concept_state',
                 'ReadingPlanLog', 'reading_plan_log', 'Probe', 'probe', 'CorrectionLog', 'correction_log')
# 실물이 없는 구조 — 이 번호의 절에 "실물 없음"
NO_REAL_SECTIONS = ('3.2', '4.2', '4.4', '8.2', '9.2')
TYPE_MARKERS = ('행마다', '나눈다')                      # D27 — _open-1 은 닫혔다. 7값이거나 이 둘이어야 한다
MARKS = ('계약 반영', '_open', '미확인')
# 대기 어휘 → 붙을 수 있는 층 (ARTICLE_PACKAGE §6.2 · 불변식 25)
PENDING_NEEDS = {'Bridge': {'bridge'}, 'DerivedClaim': {'claim'}, 'Fact 출처': {'fact'}, 'Fact 승격': {'fact'}}


def ts_aliases(text):
    """```ts 블록의 `Name = "A" | "B"` (여러 줄 이어짐 포함) → {Name: {값}}"""
    out = {}
    for block in re.findall(r'```ts\n(.*?)```', text, re.S):
        cur = None
        for line in block.splitlines():
            m = re.match(r'^(\w+)\s*=\s*(.*)$', line)
            if m:
                cur = m.group(1)
                out[cur] = set(re.findall(r'"([A-Z_]+)"', m.group(2)))
                continue
            if cur and re.match(r'^\s+\|', line):
                out[cur] |= set(re.findall(r'"([A-Z_]+)"', line))
                continue
            cur = None
    return out


def sec_by_num(text, num):
    """'### 3.3 …' / '## 3. …' 형태의 절 본문 (다음 같은 층 이상 제목까지)"""
    for h, body in VC.sections(text):
        if re.match(rf'^{re.escape(num)}[ .]', h):
            return h, body
    return None, ''


def table_rows(body):
    """마크다운 표의 데이터 행 → [[칸]] (머리 · 구분선 제외)"""
    rows, head = [], True
    for line in body.splitlines():
        if not line.startswith('|'):
            head = True
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if head:
            head = False
            continue
        if all(re.fullmatch(r':?-+:?', c) for c in cells):
            continue
        rows.append(cells)
    return rows


def type_map(text):
    """§3.3 표 → {브리프 타입: fact_type 칸}"""
    _, body = sec_by_num(text, '3.3')
    out = {}
    for cells in table_rows(body):
        if len(cells) < 3:
            continue
        for t in re.split(r'\s*·\s*', cells[0]):
            if re.fullmatch(r'[A-Z_]+', t):
                out[t] = cells[2].replace('*', '')
    return out


def op_table(text):
    _, body = sec_by_num(text, '6.4')
    return {m.group(1) for cells in table_rows(body) for m in [re.match(r'^`(\w+)`$', cells[0])] if m}


def brief_types():
    """{브리프 타입: [(브리프, 행 ID)]} — 사실 표의 Type 열"""
    out = defaultdict(list)
    for name, path in BRIEFS.items():
        col = None
        for line in open(path, encoding='utf-8').read().splitlines():
            if line.startswith('| ID |'):
                cells = [c.strip() for c in line.strip().strip('|').split('|')]
                col = cells.index('Type') if 'Type' in cells else None
                continue
            m = re.match(r'^\| ([FGS]\d\d) \|', line)
            if m and col is not None:
                cells = [c.strip() for c in line.strip().strip('|').split('|')]
                out[cells[col].strip('*')].append((name, m.group(1)))
    return out


def check_contract(text, btypes):
    errs = []
    types, aliases = VC.ts_types(text), ts_aliases(text)
    for t, fields in REQUIRED_FIELDS.items():
        if t not in types:
            errs.append(('CONTRACT_FIELD', f'타입 {t} 가 계약 타입 블록에 없다'))
            continue
        for f in fields:
            if f not in types[t]:
                errs.append(('CONTRACT_FIELD', f'{t}.{f} 가 없다'))
    ft = types.get('Fact', {}).get('fact_type', '')
    got = aliases.get(ft.strip(), set(re.findall(r'"([A-Z_]+)"', ft)))
    if got != FACT_TYPES:
        errs.append(('CONTRACT_ENUM', f'Fact.fact_type 값 {sorted(got)} ≠ 확정 §5.2 {sorted(FACT_TYPES)}'))
    for (t, f), want in REQUIRED_ENUMS.items():
        got = set(re.findall(r'"([A-Z_]+)"', types.get(t, {}).get(f, '')))
        if got != want:
            errs.append(('CONTRACT_ENUM', f'{t}.{f} 값 {sorted(got)} ≠ {sorted(want)}'))
    for w in ('STABLE', 'DERIVED', 'VOLATILE'):                                  # D8 값 셋은 그대로
        if w not in text:
            errs.append(('CONTRACT_ENUM', f'D8 값 {w} 가 계약에 없다'))
    for t in types:
        if t in FOREIGN_TYPES:
            errs.append(('CONTRACT_FOREIGN_TYPE', f'{t} 를 정의했다 — CONCEPT_IDENTITY · ARTICLE_PACKAGE · 0.2c 소관'))
    for pat in VC.HELD:
        for m in re.finditer(pat, text, re.I):
            errs.append(('CONTRACT_HELD_TERM', f'L{text[:m.start()].count(chr(10)) + 1} "{m.group()}" — §9.6 보류 항목은 넣지 않는다'))
    for num in NO_REAL_SECTIONS:
        h, body = sec_by_num(text, num)
        if h is None:
            errs.append(('CONTRACT_NO_REAL', f'§{num} 절이 없다'))
        elif '실물 없음' not in body:
            errs.append(('CONTRACT_NO_REAL', f'"{h}" 절에 "실물 없음" 표시가 없다 (D24)'))
    tm = type_map(text)
    for t, where in sorted(btypes.items()):
        if t not in tm:
            errs.append(('CONTRACT_TYPE_MAP', f'브리프 타입 {t} ({where[0][0]} {where[0][1]} …) 가 §3.3 표에 없다'))
        elif not (tm[t] in FACT_TYPES or any(k in tm[t] for k in TYPE_MARKERS)):
            errs.append(('CONTRACT_TYPE_MAP', f'§3.3 {t} → {tm[t]!r} 가 7값도 표시(행마다 · 나눈다)도 아니다 (D27)'))
    # D27 — Event · Storyline 키도 UUID. _open 은 §16 에서 전부 "판정됨 → D27"
    for alias in ('EventId', 'StorylineId'):
        if not re.search(rf'^{alias}\s*=\s*UUID\b', text, re.M):
            errs.append(('CONTRACT_FIELD', f'{alias} 가 UUID 가 아니다 (D27 — 사람이 부르는 이름은 code)'))
    h16, b16 = sec_by_num(text, '16.')
    for n, line in enumerate(text.splitlines(), 1):
        if re.search(r'_open-\d', line) and not ('판정됨' in line and line in b16):
            errs.append(('CONTRACT_OPEN_LEFT', f'L{n}: 판정 안 된 _open 이 남았다 — {line.strip()[:50]}'))
    if h16 is None or 'D27' not in h16:
        errs.append(('CONTRACT_OPEN_LEFT', '§16 제목이 "판정됨 → D27" 이 아니다'))
    ops = op_table(text)
    if ops != OPS:
        errs.append(('CONTRACT_OP', f'§6.4 op {sorted(ops)} ≠ 실물 {sorted(OPS)}'))
    if not re.search(r'^\| 20\d\d-\d\d-\d\d \| .+ \| B-0\.2b', text, re.M):
        errs.append(('CONTRACT_CHANGELOG', 'CHANGELOG 에 B-0.2b 행이 없다'))
    return errs


def check_log(text):
    """로그 머리 요약 — 질문 1~10 행마다 표시 하나 이상 + 근거"""
    errs, rows = [], {}
    for line in text.splitlines()[:100]:
        m = re.match(r'^\|\s*(\d{1,2})\s*\|(.*)\|\s*$', line)
        if m and m.group(1) not in rows:
            rows[m.group(1)] = m.group(2)
    for q in map(str, range(1, 11)):
        if q not in rows:
            errs.append(('LOG_QUESTION', f'질문 {q} 행이 로그 머리(100줄 안)에 없다'))
            continue
        if not any(mk in rows[q] for mk in MARKS):
            errs.append(('LOG_QUESTION', f'질문 {q}: [계약 반영 / _open / 미확인] 표시가 없다'))
        if not re.search(r'§\d|D\d|브리프|골든|fixtures|실물', rows[q]):
            errs.append(('LOG_QUESTION', f'질문 {q}: 근거(실물 또는 FINDINGS 절)가 없다'))
    return errs


QMARKS = '"“”‘’\'「」'


def brief_facts(path):
    """FOMC 브리프 사실 표 → {F: {text, btype, src}} — src 는 출처 열 또는 표 제목 괄호의 S-ID"""
    out, col, sec_src = {}, None, None
    for line in open(path, encoding='utf-8').read().splitlines():
        h = re.match(r'^###\s+(.*)$', line)
        if h:
            m = re.search(r'\((S\d)\)', h.group(1))
            sec_src = m.group(1) if m else None
            continue
        if line.startswith('| ID |'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            col = {k: cells.index(k) for k in ('Type', '출처') if k in cells}
            continue
        m = re.match(r'^\| (F\d\d) \|', line)
        if m:
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            src = cells[col['출처']] if '출처' in col else sec_src
            out[m.group(1)] = {'text': cells[1].replace('**', ''), 'btype': cells[col['Type']].strip('*'),
                               'src': src if src and re.fullmatch(r'[SP]\d', src) else None, 'src_note': src}
    return out


def golden_spans(pkg):
    """[(레벨 id, 장 번호(1부터), 레벨 기준 경로, span)] — 읽는 순서"""
    for lid, spans in VC.level_spans(pkg):
        for path, sp in spans:
            n = int(path.split('/')[1]) + 1
            yield lid, n, path, sp


def level_of(g, lid):
    return next(lv for lv in g['levels'] if lv['id'] == lid)


def count_in(text, frag):
    return len(re.findall(re.escape(frag), text)) if text is not None else 0


# ── C. 원천 — 저장소가 옮기기만 했는가 ───────────────────────────────────────
STORE_TYPES = {'events': 'Event', 'storylines': 'Storyline', 'storyline_versions': 'StorylineVersion', 'sources': 'Source',
               'source_documents': 'SourceDocument', 'source_registry': 'SourceRegistry', 'facts': 'Fact',
               'fact_sources': 'FactSource', 'claims': 'DerivedClaim', 'bridges': 'Bridge', 'slot_checks': 'SlotCheck'}


def check_origin(store, record, contract_text, fb, records_text):
    """-> errs. 모양(계약 타입의 필드 그대로) · 브리프 글자 · 1차 구절"""
    errs = []
    E = lambda c, m: errs.append((c, m))
    types = VC.ts_types(contract_text)

    def shape(o, t, w):
        want, got = set(types.get(t, {})), ({k for k in o if not k.startswith('_')} if isinstance(o, dict) else set())
        if want != got:
            E('STORE_SHAPE', f'{w}: {t} 필드가 계약과 다르다 — 없음 {sorted(want - got)} · 남음 {sorted(got - want)} (§1)')
    for key, t in STORE_TYPES.items():
        if not isinstance(store.get(key), list):
            E('STORE_SHAPE', f'저장소에 {key} 가 없다')
            continue
        for i, o in enumerate(store[key]):
            shape(o, t, f'{key}[{i}]')
            if t == 'DerivedClaim' and isinstance(o, dict):
                for j, k in enumerate(o.get('checks', [])):
                    shape(k, 'CounterCheck', f'{key}[{i}].checks[{j}]')
    rec = {k for k in record if not k.startswith('_')}
    if rec != set(types['ArticleRecord']) - {'package'} or not isinstance(record.get('_package'), str):
        E('STORE_SHAPE', 'record 는 { article_id, article_version, authoring } + `_package`(패키지 파일 이름) 다 (§11)')
    auth = record.get('authoring', {})
    shape(auth, 'ArticleAuthoring', 'record.authoring')
    for i, te in enumerate(auth.get('time_expressions', []) if isinstance(auth, dict) else []):
        shape(te, 'TimeExpression', f'time_expressions[{i}]')
        shape(te.get('at', {}), 'TextLocator', f'time_expressions[{i}].at')
        for x in te.get('inputs', []):
            shape(x, 'DerivedInput', f'time_expressions[{i}].inputs')
        if te.get('formula') is not None:
            shape(te['formula'], 'Formula', f'time_expressions[{i}].formula')
    for i, p in enumerate(auth.get('storylines', []) if isinstance(auth, dict) else []):
        shape(p, 'StorylinePin', f'record.authoring.storylines[{i}]')
    if errs:
        return errs
    # 브리프 사실 — 글자 그대로. 나눈 것(`_split_of`)은 브리프 글의 부분 문자열이다. 브리프의 F 는 전부 어딘가에 있다
    labels = {f['label']: f for f in store['facts']}
    notf = ' '.join(x.get('label', '') for x in store.get('_not_facts', []))
    for lab, b in sorted(fb.items()):
        if lab in labels:
            if labels[lab]['claim_text'] != b['text']:
                E('BRIEF_TEXT', f'{lab}: claim_text 가 브리프와 다르다 — 브리프는 원천이다. 옮기기만 한다\n         브리프 {b["text"]!r}\n         저장소 {labels[lab]["claim_text"]!r}')
            continue
        parts = [f for l, f in labels.items() if re.fullmatch(re.escape(lab) + '[a-z]', l)]
        if not parts:
            E('BRIEF_MISSING', f'{lab}: 브리프 사실이 저장소에 없다 (나눈 것도 없다)')
        for f in parts:
            if f['claim_text'] not in b['text'] or '_split_of' not in f:
                E('BRIEF_TEXT', f'{f["label"]}: 나눈 사실의 claim_text 는 브리프 {lab} 글의 부분이어야 한다 (§3.3 "나눈다")')
        if len(parts) == 1 and lab not in notf:
            E('BRIEF_MISSING', f'{lab}: 나눈 절이 하나뿐인데 나머지 절이 `_not_facts` 에 적혀 있지 않다 — 조용히 버리지 않는다')
    for f in store['facts']:
        if '_brief_type' in f and f['label'][:3] not in fb:
            E('BRIEF_TEXT', f'{f["label"]}: 브리프에서 왔다는데(`_brief_type`) 브리프에 그 F 가 없다')
    for x in store.get('_not_facts', []):
        if not any(x['text'] in b['text'] for b in fb.values()):
            E('BRIEF_TEXT', f'_not_facts {x.get("label")}: 브리프에 없는 글이다')
    # 1차 구절 — 기록에 글자 그대로
    fid = {f['fact_id']: f['label'] for f in store['facts']}
    for x in store['fact_sources']:
        p_ = x.get('_passage')
        if p_ is not None and p_ not in records_text:
            E('PASSAGE_NOT_IN_RECORD', f'{fid.get(x["fact_id"], x["fact_id"])}: 1차 구절이 기록(C-3 · 스토리라인 문서)에 글자 그대로 없다 — {p_[:50]!r}')
    return errs


def golden_report(pkg, store):
    """게이트 3 후보 — 기계가 못 가리는 것을 뽑아만 둔다 (§3.4 · §10.2)"""
    rep = defaultdict(list)
    F = {f['fact_id']: f for f in store['facts']}
    C = {c['claim_id']: c for c in store['claims']}
    name = lambda r: (F.get(r) or C.get(r) or {}).get('label', r) if isinstance(r, str) else '(개념)'
    for lid, n, path, sp in golden_spans(pkg):
        if any(c in sp['text'] for c in '“”"'):
            rep['inline_quote'].append((lid, n, sp['layer'], [name(r) for r in sp['refs']], sp['text']))
        if sp['layer'] == 'fact' and sp['refs'] and all(F.get(r, {}).get('fact_type') == 'OFFICIAL_CLAIM' for r in sp['refs']):
            rep['claim_fact'].append((lid, n, [name(r) for r in sp['refs']], sp['text']))
    for lv in pkg['levels']:
        for i, s in enumerate(lv['slides']):
            for j, b in enumerate(s['blocks']):
                if b.get('type') == 'quote':
                    rep['quote'].append((f'{lv["id"]} {i + 1}장 blocks/{j}', b['attribution'],
                                         sorted({name(r) for sp in b['body'] for r in sp['refs']})))
    return rep


# ── D. 모델 ──────────────────────────────────────────────────────────────────
def load_model(b):
    """골든 한 벌 → check_model 이 읽는 모양. 옮기지 않는다 — 파일에 있는 그대로다 (0.2m-a)"""
    st, rec, pkg = b['store'], b['record'], b['package']
    m = {'facts': {f['fact_id']: f for f in st['facts']}, 'fact_sources': st['fact_sources'],
         'sources': {s_['source_id']: s_ for s_ in st['sources']},
         'documents': {d['source_id']: d['text'] for d in st['source_documents']},
         'registry': {r['source']: r for r in st['source_registry']},
         'claims': {c['claim_id']: c for c in st['claims']}, 'bridges': {x['bridge_id']: x for x in st['bridges']},
         'events': {e['event_id']: e for e in st['events']}, 'storylines': {x['storyline_id']: x for x in st['storylines']},
         'storyline_versions': st['storyline_versions'], 'slots': st['slot_checks']}
    m['pending'] = [(lid, path, sp['layer'], sp['_refs_pending'].get('need')) for lid, n, path, sp in golden_spans(pkg)
                    if isinstance(sp.get('_refs_pending'), dict)]
    m['record'] = {'article_id': rec.get('article_id'), 'article_version': rec.get('article_version'),
                   'package': strip_underscore(pkg), 'authoring': rec['authoring']}
    m['concept_codes'] = {c['concept_id']: c['code'] for c in b['concepts']['concepts']}
    return m


def strip_underscore(o):
    if isinstance(o, dict):
        return {k: strip_underscore(v) for k, v in o.items() if not k.startswith('_')}
    if isinstance(o, list):
        return [strip_underscore(x) for x in o]
    return o


def tp_range(v):
    """TimePoint → (가장 이른 날, 가장 늦은 날). 모르면 None"""
    if not isinstance(v, str):
        return None
    m = re.match(r'^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?', v)
    if not m:
        return None
    y, mo, d = int(m.group(1)), m.group(2), m.group(3)
    if d:
        x = dt.date(y, int(mo), int(d))
        return (x, x)
    if mo:
        return (dt.date(y, int(mo), 1), dt.date(y, int(mo), calendar.monthrange(y, int(mo))[1]))
    return (dt.date(y, 1, 1), dt.date(y, 12, 31))


def verdict(c):
    """§7.3 — 판정은 checks 에서 계산한다"""
    outs = [k['outcome'] for k in c['checks']]
    if not outs:
        return None
    if c['kind'] == 'DEFENSIVE' and set(outs) == {'UNRESOLVED'}:
        return 'DEFENSIVE'
    if 'UNRESOLVED' in outs:
        return None
    return 'VALID_WITH_SCOPE' if 'SCOPED' in outs else 'VALID'


def check_model(m, lib, publish=False):
    """-> (errs, held). held = 발행 검사에서만 막히는 것 (지금은 WARN, publish=True 면 errs 로)"""
    errs, held = [], []
    E = lambda c, msg: errs.append((c, msg))
    P = lambda c, msg: (errs if publish else held).append((c, msg))
    F, C, B, S = m['facts'], m['claims'], m['bridges'], m['sources']
    pkg, auth = m['record']['package'], m['record']['authoring']
    # 26 — ArticleRecord 의 키 (D30)
    aid, av = m['record'].get('article_id'), m['record'].get('article_version')
    try:
        ok = str(uuid.UUID(str(aid))) == aid
    except ValueError:
        ok = False
    if not ok or type(av) is not int or av < 1:
        E('RECORD_KEY', f'ArticleRecord 의 article_id {aid!r} · article_version {av!r} — UUID 와 양의 정수 (불변식 26)')
    # 1 — 키 · label
    seen = Counter()
    for kind, key in (('facts', 'fact_id'), ('claims', 'claim_id'), ('bridges', 'bridge_id'), ('sources', 'source_id')):
        for k, v in m[kind].items():
            if k != v[key]:
                E('KEY_MISMATCH', f'{kind} {k} 의 {key} 가 {v[key]}')
            seen[k] += 1
    for kind, key in (('events', 'event_id'), ('storylines', 'storyline_id')):
        for k, v in m[kind].items():
            seen[k] += 1
    for k in seen:
        if not VA.UUID_RE.match(str(k)):
            E('KEY_SHAPE', f'키 {k!r} 가 UUID 가 아니다 (불변식 1)')
    for k, n in seen.items():
        if n > 1:
            E('KEY_DUP', f'키 {k} 가 {n}번')
    # 14 — StorylineVersion 은 1부터 1씩 빠짐없이, Storyline.version = 최대
    for sid, sl in m['storylines'].items():
        vs = sorted(v['version'] for v in m['storyline_versions'] if v['storyline_id'] == sid)
        if vs != list(range(1, sl['version'] + 1)):
            E('STORYLINE_VERSION', f'{sl["code"]}: 버전 {vs} — 1부터 {sl["version"]} 까지 빠짐없이 (불변식 14)')
    codes = Counter(x['code'] for kind in ('events', 'storylines') for x in m[kind].values())
    for c, n in codes.items():
        if n > 1:
            E('CODE_DUP', f'code {c} 가 {n}번 — 전체에서 유일해야 한다 (§2.1 · D27)')
    if pkg.get('event_ref') not in m['events']:
        E('EVENT_REF', f'패키지 event_ref {pkg.get("event_ref")!r} 가 Event 의 키(UUID)가 아니다 — code 는 참조에 쓰지 않는다 (§2.2 · D27)')
    owner_labels = Counter((f['event_id'] or f['storyline_id'], f['label']) for f in F.values())
    for (o, lab), n in owner_labels.items():
        if n > 1:
            E('LABEL_DUP', f'{o} 안에 label {lab} 가 {n}번')
    # 4 ~ 7 — Fact
    for f in F.values():
        w = f'Fact {f["label"]}'
        if f['fact_type'] not in FACT_TYPES:
            E('FACT_TYPE', f'{w}: fact_type={f["fact_type"]!r} (§3.2)')
        if f['fact_type'] in ('OFFICIAL_CLAIM', 'OFFICIAL_LIMIT') and not f['actor']:
            E('FACT_ACTOR', f'{w}: {f["fact_type"]} 인데 actor 가 없다 — 주장한 쪽이 사실의 일부다 (§3.4)')
        if f['volatility'] not in ('STABLE', 'VOLATILE'):
            E('FACT_VOLATILITY', f'{w}: volatility={f["volatility"]!r} — Fact 에는 STABLE · VOLATILE 만 (§6.1)')
        elif (f['volatility'] == 'VOLATILE') != bool(f['as_of']):
            E('FACT_AS_OF', f'{w}: {f["volatility"]} 인데 as_of={f["as_of"]!r} — VOLATILE 이면 필수, STABLE 이면 없다 (§6.2)')
        if bool(f['event_id']) == bool(f['storyline_id']):
            E('FACT_OWNER', f'{w}: event_id · storyline_id 중 정확히 하나 (§9.3)')
        elif f['storyline_id']:
            sl = m['storylines'].get(f['storyline_id'])
            if not sl or not isinstance(f['storyline_version'], int) or not 1 <= f['storyline_version'] <= sl['version']:
                E('FACT_OWNER', f'{w}: 스토리라인 {f["storyline_id"]} 버전 {f["storyline_version"]} 이 없다')
        elif f['event_id'] not in m['events']:
            E('FACT_OWNER', f'{w}: 사건 {f["event_id"]} 이 없다')
    # 2 — span refs 는 층이 정한 Ref
    reach_f, reach_c, reach_b = set(), set(), set()
    pend = {(l, p) for l, p, _, _ in m.get('pending', [])}
    for lid, spans in VC.level_spans(pkg):
        for path, sp in spans:
            L, refs = sp['layer'], sp['refs']
            if L == 'writing':
                continue
            if not refs:
                (P if (lid, path) in pend else E)('REFS_PENDING', f'{lid} {path} {L} "{sp["text"][:16]}": refs 가 비었다')
                continue
            pool = {'fact': F, 'claim': C, 'bridge': B}.get(L)
            for r in refs:
                if L == 'concept':
                    if not (isinstance(r, dict) and r.get('concept_id') in m['concept_codes']):
                        E('REF_UNRESOLVED', f'{lid} {path}: concept 층 ref {r!r} 가 ConceptRef 가 아니다')
                elif not isinstance(r, str) or r not in pool:
                    E('REF_UNRESOLVED', f'{lid} {path}: {L} 층 ref {r!r} 가 {L} 저장소에 없다 (§2.2)')
                else:
                    {'fact': reach_f, 'claim': reach_c, 'bridge': reach_b}[L].add(r)
    for c in reach_c:
        reach_f |= set(C[c]['basis']) | {x for k in C[c]['checks'] for x in k['facts']}
    for b in reach_b:
        reach_f |= set(B[b]['facts'])
    for te in auth['time_expressions']:
        reach_f |= set(te['facts']) | {x['fact'] for x in te['inputs'] if x['fact']}
    reach_f &= set(F)
    # 22 · 23 — DerivedClaim
    for c in C.values():
        w = f'Claim {c["label"]}'
        if not c['basis']:
            E('CLAIM_NO_BASIS', f'{w}: basis 가 비었다 (§7.2)')
        bad = [x for x in c['basis'] + [y for k in c['checks'] for y in k['facts']] if x not in F]
        if bad:
            E('REF_UNRESOLVED', f'{w}: 없는 사실 {bad}')
        if c['claim_id'] in reach_c:
            if verdict(c) is None:
                P('CLAIM_UNCHECKED', f'{w}: 반증 기록이 없거나 ASSERTED 인데 미결 — 판정이 안 나온다 (§7.3)')
            for k in c['checks']:
                if k['outcome'] in ('NOT_REFUTED', 'SCOPED') and not k['facts']:
                    P('CHECK_NO_FACTS', f'{w}: 반증 "{k["question"][:24]}" 의 답에 사실이 없다 (§7.3)')
    # 18 — Bridge
    slots = {c['code']: (c['version'], {s['label']: s['after'] for s in c['slots']}) for c in lib['concepts']}
    for b in B.values():
        w = f'Bridge {b["label"]}'
        if not b['facts'] or any(x not in F for x in b['facts']):
            E('BRIDGE_NO_FACTS', f'{w}: facts 가 비었거나 없는 사실을 가리킨다 (§8.2)')
        if b['bridge_type'] == 'CONCEPT_BRIDGE':
            code = m['concept_codes'].get(b['concept_id'])
            if not code or not isinstance(b['concept_version'], int):
                E('BRIDGE_CONCEPT', f'{w}: CONCEPT_BRIDGE 인데 개념 · 버전이 없다')
            elif b['slot'] is not None:
                cur, sl = slots[code]
                if b['concept_version'] != cur:
                    P('BRIDGE_CONCEPT', f'{w}: {code}@{b["concept_version"]} — 지금 라이브러리는 v{cur}. 옛 버전 슬롯은 기계가 못 본다')
                elif b['slot'] not in sl:
                    E('BRIDGE_CONCEPT', f'{w}: {code}@{cur} 에 슬롯 {b["slot"]} 이 없다 (CONCEPT_IDENTITY §6.2)')
        elif b['bridge_type'] == 'STORY_BRIDGE':
            if b['from_event'] not in m['events']:
                E('BRIDGE_STORY', f'{w}: STORY_BRIDGE 인데 from_event 가 없다')
        else:
            E('BRIDGE_TYPE', f'{w}: bridge_type={b["bridge_type"]!r}')
        if b['bridge_id'] in reach_b and b['event_id'] != pkg['event_ref']:
            E('BRIDGE_EVENT', f'{w}: event_id {b["event_id"]} ≠ 패키지 event_ref {pkg["event_ref"]}')
    # 18 뒷부분 — CONCEPT_IDENTITY §6.3 규칙 1 의 bridge span 은 (X, v, S) 를 채우는 Bridge 를 가리킨다
    for lid, spans in VC.level_spans(pkg):
        for code, (cur, sl) in slots.items():
            for label, after in sl.items():
                hits = [i for i, (_, sp) in enumerate(spans) if sp['layer'] == 'concept' and any(
                    isinstance(r, dict) and m['concept_codes'].get(r['concept_id']) == code and r['version'] == cur
                    and r.get('part') == f'FULL:{after}' for r in sp['refs'])]
                if not hits or hits[-1] + 1 >= len(spans):
                    continue
                path, nxt = spans[hits[-1] + 1]
                if nxt['layer'] != 'bridge':
                    continue                           # 층 자체는 CONCEPT_IDENTITY 불변식 13 이 본다
                ok = any(r in B and m['concept_codes'].get(B[r]['concept_id']) == code and B[r]['concept_version'] == cur
                         and B[r]['slot'] == label for r in nxt['refs'])
                if not ok:
                    E('BRIDGE_SLOT_ORDER', f'{lid} {path}: {code}@{cur} {after} 다음 브리지가 슬롯 {label} 을 채우는 Bridge 가 아니다 (불변식 18)')
    # 12 — published_at
    pub = pkg.get('published_at')
    if not (isinstance(pub, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', pub)):
        E('PUBLISHED_AT_SHAPE', f'published_at={pub!r} — "YYYY-MM-DD" (§5.3)')
        pub = None
    # 15 ~ 17 — TimeExpression
    for te in auth['time_expressions']:
        a = te['at']
        w = f'TE {a["level"]} {a["path"]} "{a["fragment"]}"'
        try:
            txt = VA.plain_of(VA.resolve(level_of(pkg, a['level']), a['path']))
        except StopIteration:
            txt = None
        if count_in(txt, a['fragment']) != 1:
            E('TE_LOCATOR', f'{w}: 그 글에 조각이 정확히 한 번 있어야 한다 (불변식 15)')
        if te['class'] == 'VOLATILE':
            if not te['facts'] or any(F.get(x, {}).get('volatility') != 'VOLATILE' for x in te['facts']):
                E('TE_VOLATILE_FACTS', f'{w}: VOLATILE 조각은 VOLATILE 사실을 1개 이상 가리킨다 (불변식 16)')
        elif te['class'] == 'DERIVED':
            ins = te['inputs']
            vol = [x['key'] for x in ins if x['fact'] and F.get(x['fact'], {}).get('volatility') != 'STABLE']
            if vol:
                E('DERIVED_FROM_VOLATILE', f'{w}: 입력 {vol} 의 사실이 STABLE 이 아니다 — D8 규칙 4')
                continue
            if te['formula']['op'] not in OPS:
                E('TE_OP', f'{w}: op {te["formula"]["op"]!r} (§6.4)')
                continue
            if pub is None:
                continue
            f = {k: v for k, v in te['formula'].items() if v is not None}
            entry = {'formula': f, 'value_at_authoring': te['value_at_authoring'], 'check': te['check'],
                     'derived_from': [{'key': x['key'], 'value': x['value']} for x in ins]}
            got = VA.evaluate(entry, pub)
            if got == 'FAIL':
                E('DERIVED_INVARIANT_FAIL', f'{w}: recompute(published_at) != value_at_authoring (D8 규칙 3)')
            elif got == 'UNVERIFIABLE':
                P('DERIVED_UNVERIFIED', f'{w}: 재계산으로 증명 못 한다 (§6.4)')
            nofact = [x['key'] for x in ins if not x['fact']]
            if nofact:
                P('DERIVED_INPUT_NO_FACT', f'{w}: 입력 {nofact} 에 사실이 없다 (§6.4)')
        else:
            E('TE_CLASS', f'{w}: class={te["class"]!r} (§6.1)')
    # 8 · 9 · 11 — 발행: 패키지가 닿는 사실의 출처 · 1차 · 공개 시점
    fs = defaultdict(list)
    for x in m['fact_sources']:
        fs[x['fact_id']].append(x)
    for k in sorted(reach_f, key=lambda k: F[k]['label']):
        f, links = F[k], fs.get(k, [])
        w = f'Fact {f["label"]}'
        spanned = [x for x in links if isinstance(x['span_start'], int) and isinstance(x['span_end'], int)
                   and x['source_id'] in m['documents'] and 0 <= x['span_start'] < x['span_end'] <= len(m['documents'][x['source_id']])]
        if not spanned:
            P('FACT_NO_SOURCE_SPAN', f'{w}: 원문 위치(FactSource + SourceDocument)가 없다 (불변식 8 · §5.5)')
        if not any(S.get(x['source_id'], {}).get('kind') == 'PRIMARY' for x in links):
            P('FACT_NO_PRIMARY', f'{w}: 1차 출처가 없다 (불변식 9 · _open-2)')
        dates = [tp_range(S[x['source_id']]['published_at']) for x in links if x['source_id'] in S]
        dates = [d for d in dates if d]
        pubd = dt.date.fromisoformat(pub) if pub else None
        if pub and not dates:
            P('FACT_NOT_YET_PUBLIC', f'{w}: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)')
        elif pub and min(d[0] for d in dates) > pubd:
            P('FACT_NOT_YET_PUBLIC', f'{w}: 가장 이른 출처가 발행일 뒤다 (불변식 11 · §5.3)')
        elif pub and min(d[1] for d in dates) > pubd:       # 정밀도가 모자라 앞뒤가 갈리지 않는다 — 증명 못 한 것 (§5.2)
            P('FACT_PUBLIC_UNPROVEN', f'{w}: 출처의 공개 시점이 발행일 앞인지 증명되지 않는다 — 정밀도가 모자라다 (불변식 11 · §5.2)')
    # 13 — 스토리라인 핀
    pins = {p['storyline_id']: p['version'] for p in auth['storylines']}
    for sid in sorted({F[k]['storyline_id'] for k in reach_f if F[k]['storyline_id']}):
        cur = m['storylines'][sid]['version']
        if pins.get(sid) != cur:
            P('STORYLINE_STALE', f'{m["storylines"][sid]["code"]}: 핀 {pins.get(sid)} ≠ 최신 {cur} (불변식 13 · §9.4)')
    # 19 · 20 · 21 — 인용
    for lv in pkg['levels']:
        for i, s in enumerate(lv['slides']):
            for j, b in enumerate(s['blocks']):
                if b.get('type') != 'quote':
                    continue
                w = f'{lv["id"]} {i + 1}장 인용'
                t = VA.strip_tags(''.join(sp['text'] for sp in b['body'])).strip()
                if t and (t[0] in QMARKS or t[-1] in QMARKS):
                    E('QUOTE_MARKS', f'{w}: body 가 따옴표로 싸여 있다 (불변식 21)')
                ids = {r for sp in b['body'] for r in sp['refs'] if r in F}
                anysrc = set.intersection(*[{x['source_id'] for x in fs.get(r, [])} for r in ids]) if ids else set()
                common = set.intersection(*[{x['source_id'] for x in fs.get(r, []) if isinstance(x['span_start'], int)}
                                            for r in ids]) if ids else set()
                if not anysrc:
                    P('QUOTE_NO_COMMON_SOURCE', f'{w}: body 사실들에 공통 Source 가 없다 — 인용 하나 = 원문 하나 (불변식 19)')
                elif not common:
                    P('QUOTE_SPAN_MISSING', f'{w}: 공통 Source 는 있으나 원문 위치(span)가 없다 — 어느 구간인지 기계가 모른다 (불변식 19)')
                elif not any(m['registry'].get(S[x]['publisher'], {}).get('can_quote') is True for x in common):
                    P('QUOTE_NOT_ALLOWED', f'{w}: 원문 발행처가 can_quote 가 아니다 (불변식 20 · §5.1)')
    # 24 — 슬롯
    for sl in m['slots']:
        w = f'Slot {sl["slot"]}'
        if (sl['status'] == 'FOUND') != bool(sl['facts']):
            E('SLOT_FACTS', f'{w}: {sl["status"]} 인데 facts {len(sl["facts"])}개 (§12)')
        if sl['status'] == 'STORYLINE_STALE' and sl['storyline'] not in m['storylines']:
            E('SLOT_STORYLINE', f'{w}: STORYLINE_STALE 인데 스토리라인이 없다')
    return errs, held


# ── 실행 ────────────────────────────────────────────────────────────────────
# 발행 검사에서 막히는 것을 둘로 가른다 (D27) — 독자에게 닿는 것 / 기계 검증용(파이프라인)
READER_FACING = ('REFS_PENDING', 'FACT_NO_PRIMARY', 'FACT_NOT_YET_PUBLIC', 'CLAIM_UNCHECKED', 'CHECK_NO_FACTS',
                 'DERIVED_UNVERIFIED', 'DERIVED_INPUT_NO_FACT', 'QUOTE_NO_COMMON_SOURCE', 'STORYLINE_STALE', 'BRIDGE_CONCEPT')
MACHINE_ONLY = ('FACT_NO_SOURCE_SPAN', 'FACT_PUBLIC_UNPROVEN', 'QUOTE_SPAN_MISSING', 'QUOTE_NOT_ALLOWED')


def run(contract_text, log_text, bundle, lib_text, records_text=None):
    """bundle = verify-article.load_bundle() 의 것 — {package, record, store, concepts}"""
    lib = VC.parse_library(lib_text)
    fb = brief_facts(BRIEFS['FOMC'])
    if records_text is None:
        records_text = ''.join(open(p, encoding='utf-8').read() for p in RECORDS)
    errs = check_contract(contract_text, brief_types()) + check_log(log_text)
    warns, rep = [], defaultdict(list)
    e = check_origin(bundle['store'], bundle['record'], contract_text, fb, records_text)
    errs += e
    model = None
    if not e:                                           # 모양이 깨졌으면 모델을 읽지 않는다
        pkg = bundle['package']
        if not (isinstance(pkg.get('published_at'), str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', pkg['published_at'])):
            errs.append(('GOLD_PUBLISHED_AT_SHAPE', f'published_at={pkg.get("published_at")!r} — "YYYY-MM-DD" 여야 한다 (§5.3 · R-1)'))
        for lid, n, path, sp in golden_spans(pkg):
            pend = sp.get('_refs_pending')
            if isinstance(pend, dict):
                need = pend.get('need')
                if need not in PENDING_NEEDS or sp['layer'] not in PENDING_NEEDS[need]:
                    errs.append(('GOLD_PENDING_NEED', f'{lid} {n}장 "{sp["text"][:20]}": {sp["layer"]} 층에 need {need!r} — 어휘 · 층이 맞지 않는다 (불변식 25)'))
                rep['pending_list'].append((lid, n, sp['text'], sp['layer'], need, path))
        rep.update(golden_report(pkg, bundle['store']))
        model = load_model(bundle)
        me, held = check_model(model, lib)
        errs += me
        rep['held'] = held
    return errs, warns, rep, model, lib


def main():
    report = '--report' in sys.argv
    read = lambda p: open(p, encoding='utf-8').read()
    bundle = VA.load_bundle()
    errs, warns, rep, model, lib = run(read(CONTRACT), read(LOG) if os.path.exists(LOG) else '', bundle, read(LIBRARY))
    fb = brief_facts(BRIEFS['FOMC'])
    st = bundle['store']
    print('verify-data-model')
    print(f'  계약   {os.path.relpath(CONTRACT, ROOT)}')
    print(f'  원천   브리프 3 — 사실 타입 {len(brief_types())}종 · FOMC 사실 {len(fb)} · 1차 구절 기록 {len(RECORDS)} 파일')
    nb = sum(1 for f in st['facts'] if '_brief_type' in f)
    print(f'  저장소 {os.path.relpath(VA.STORE, ROOT)} — Fact {len(st["facts"])} (브리프에서 {nb} · 새로 {len(st["facts"]) - nb}) · '
          f'FactSource {len(st["fact_sources"])} (1차 구절 {sum(1 for x in st["fact_sources"] if "_passage" in x)}) · Source {len(st["sources"])} · '
          f'DerivedClaim {len(st["claims"])} · Bridge {len(st["bridges"])} · Event {len(st["events"])} · Storyline {len(st["storylines"])}')
    if model:
        auth = model['record']['authoring']
        vol = Counter(t['class'] for t in auth['time_expressions'])
        held = Counter(c for c, _ in rep['held'])
        rf = sum(v for k, v in held.items() if k in READER_FACING)
        print(f'  골든   대기 span {len(rep["pending_list"])} · 시간 조각 {sum(vol.values())} ({dict(sorted(vol.items()))}) · 인용 {len(rep["quote"])} · '
              f'스토리라인 핀 {len(auth["storylines"])} · 저작 메모 {len(auth["notes"])}')
        print(f'  발행 검사에서 막히는 것 {sum(held.values())} — 독자에게 닿는 것 {rf} · 기계 검증용 {sum(held.values()) - rf}')
        print('         ' + ' · '.join(f'{k} {v}' for k, v in sorted(held.items())))
    if report:
        report_out(rep, model)
    print()
    for code, msg in warns:
        print(f'  WARN  {code}: {msg}')
    for code, msg in errs:
        print(f'  ERROR {code}: {msg}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


def report_out(rep, model):
    print(f'\n골든 대기 span {len(rep["pending_list"])} — 실물에서 센다 (불변식 25)')
    for lid, n, t, layer, need, _ in rep['pending_list']:
        print(f'  {lid:<8} {n}장 {layer:<6} {need:<12} "{VA.strip_tags(t).strip()[:36]}"')
    print('\n인용 (§10.1) — 출처 표시 · body 사실')
    for w, a, body in rep['quote']:
        print(f'  {w}  "{a}"  body {body}')
    print('\n게이트 3 후보 — 본문 따옴표 (§10.2)')
    for lid, n, L, refs, t in rep['inline_quote']:
        print(f'  {lid} {n}장 {L:<7} {refs}  {t.strip()!r}')
    print(f'\n게이트 3 후보 — OFFICIAL_CLAIM 사실만 가리키는 fact span {len(rep["claim_fact"])} (§3.4 — 주장한 쪽을 글이 밝히나)')
    for lid, n, refs, t in rep['claim_fact']:
        print(f'  {lid} {n}장 {refs}  {VA.strip_tags(t).strip()[:50]!r}')
    if model:
        by = defaultdict(list)
        for c, msg in rep['held']:
            by[c].append(msg)
        for title, group in (('독자에게 닿는 것', READER_FACING), ('기계 검증용 — 파이프라인이 채운다 (D27)', MACHINE_ONLY)):
            print(f'\n발행 검사에서 막히는 것 — {title}: {sum(len(by[c]) for c in group)}')
            for c in group:
                if not by[c]:
                    continue
                print(f'  {c} {len(by[c])}')
                for msg in by[c][: 40 if group is READER_FACING else 4]:
                    print(f'    {msg}')
                if group is MACHINE_ONLY and len(by[c]) > 4:
                    print(f'    … {len(by[c]) - 4}개 더')
        other = [c for c in by if c not in READER_FACING + MACHINE_ONLY]
        if other:
            print(f'\n  (갈래 밖) {other}')


if __name__ == '__main__':
    sys.exit(main())
