#!/usr/bin/env python3
"""DATA_MODEL.md 를 기계로 확인한다 (B-0.2b).

    python3 scripts/verify-data-model.py            # 검사
    python3 scripts/verify-data-model.py --report   # + 골든 이전 목록 · 게이트 3 후보 · 시험 사본 발행 검사에서 막히는 것

네 곳을 본다.
  A. 계약 문서   확정 필드 · enum (§5.1 · §5.2 · §5.3 · §5.5 · §6.2 · §4.1 · D8) 이 다 있다. §9.6 보류 항목이 없다.
                 다른 계약 · 0.2c 의 타입을 정의하지 않았다. 실물 없는 구조 절에 "실물 없음".
                 세 브리프의 모든 사실 타입이 §3.3 표에 있다. 공식 op 표 = 실물 7개
  B. 로그        0.2b 로그 머리 요약에 질문 10개가 [계약 반영 / _open / 미확인] 과 근거를 갖는다
  C. 골든        지금 모양(`_` 주석)이 이 계약으로 잃는 것 없이 옮겨지는가 —
                 R-1 날짜 모양 · 대기 13 = §17 표 · 끊긴 F 연결 ⊆ 브리프 DC 근거 · VOLATILE as_of 가 사실마다 하나 ·
                 시간 조각이 그 글에 한 번 · 인용 출처 표시 ⊇ body refs · 인용 body 에 따옴표 없음
  D. 시험 사본   골든 + FOMC 브리프를 이 계약 모양으로 **메모리 안에서** 옮기고(시험용 UUID) 불변식을 돌린다.
                 지금 검사는 통과해야 하고, 발행 검사에서 막히는 것은 WARN 으로 센다 (§18 — 0.2m · 콘텐츠가 채울 것).
                 진짜 이전은 0.2m 이다. 이 사본은 파일로 남기지 않는다

exit 0 OK (WARN 은 있을 수 있다) · 1 FAIL
"""
import calendar, copy, datetime as dt, importlib.util, json, os, re, sys, uuid
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/DATA_MODEL.md')
LOG = os.path.join(ROOT, 'logs/backend/phase-0-step-0-2b.md')
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')
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
    'Event': ('event_id', 'title', 'occurred_at', 'storyline_id'),
    'Storyline': ('storyline_id', 'title', 'version', 'ongoing'),                              # §9.2
    'StorylineVersion': ('storyline_id', 'version', 'created_at', 'change'),
    'ArticleRecord': ('package', 'authoring'),
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
TYPE_MARKERS = ('_open-1', '행마다', '나눈다')
MARKS = ('계약 반영', '_open', '미확인')


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


def pending_table(text):
    """§17 표 → [(레벨, 장, 글, layer, need)]"""
    _, body = sec_by_num(text, '17.')
    out = []
    for cells in table_rows(body):
        if len(cells) >= 5 and cells[0].isdigit():
            lv, n = cells[1].split()
            out.append((lv, int(n), cells[2], cells[3], cells[4]))
    return out


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
            errs.append(('CONTRACT_TYPE_MAP', f'§3.3 {t} → {tm[t]!r} 가 7값도 표시(_open-1 · 행마다 · 나눈다)도 아니다'))
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


# ── C. 골든 ──────────────────────────────────────────────────────────────────
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


def brief_sources(path):
    """Source Pack 표 (S1~S4 · P1~P4) → {label: {title, published_at}}"""
    out = {}
    t0 = dt.date(2026, 9, 16)
    for line in open(path, encoding='utf-8').read().splitlines():
        m = re.match(r'^\| ([SP]\d) \| (.*?) \| (.*?) \|', line)
        if not m:
            continue
        when = m.group(3)
        t = re.search(r'(\d{1,2})/(\d{1,2})(?: (\d{1,2}):(\d{2}) ET)?', when)
        tm = re.search(r'T-(\d+)', when)
        if t:
            d = dt.date(2026, int(t.group(1)), int(t.group(2))).isoformat()
            pub = f'{d}T{int(t.group(3)):02d}:{t.group(4)}-04:00' if t.group(3) else d
        elif tm:
            pub = (t0 - dt.timedelta(days=int(tm.group(1)))).isoformat()
        else:
            pub = None
        out[m.group(1)] = {'title': m.group(2), 'published_at': pub}
    return out


def brief_claims(path):
    """DC 절 → {DC: {kind, basis, checks[{question, facts, outcome}]}}"""
    text = open(path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^### (DC-[A-Z]) — (.*?)$(.*?)(?=^### |^## |\Z)', text, re.M | re.S):
        dc, head, body = m.group(1), m.group(2), m.group(3)
        kind = 'DEFENSIVE' if '방어용' in head else 'ASSERTED'
        checks = []
        for line in body.splitlines():
            if line.startswith('반증 후보'):
                outcome = 'SCOPED' if 'SCOPE' in body else 'NOT_REFUTED'
                checks.append({'question': line, 'facts': re.findall(r'F\d\d', line), 'outcome': outcome})
        if kind == 'DEFENSIVE' and '나와야' in body and not checks:
            checks.append({'question': '(브리프) 반대파가 위원회를 움직였나', 'facts': [], 'outcome': 'UNRESOLVED'})
        body_wo_check = '\n'.join(l for l in body.splitlines() if not l.startswith('반증 후보'))
        basis = list(dict.fromkeys(re.findall(r'F\d\d', body_wo_check)))
        out[dc] = {'kind': kind, 'basis': basis, 'checks': checks, 'all': set(re.findall(r'F\d\d', body))}
    return out


def golden_spans(g):
    """[(레벨 id, 장 번호(1부터), 레벨 기준 경로, span)] — 읽는 순서"""
    for lid, spans in VC.level_spans(g):
        for path, sp in spans:
            n = int(path.split('/')[1]) + 1
            yield lid, n, path, sp


def vol_entries(g):
    """[(레벨 id, 레벨 기준 글 경로, entry)] — 슬라이드 · open_question 에 붙은 _volatility"""
    for lv in g['levels']:
        for i, s in enumerate(lv['slides']):
            for v in s.get('_volatility', []):
                yield lv['id'], f'slides/{i}/{v["where"]}', v
        for i, q in enumerate(lv['open_questions']):
            for v in q.get('_volatility', []):
                yield lv['id'], f'open_questions/{i}/{v["where"]}', v


def level_of(g, lid):
    return next(lv for lv in g['levels'] if lv['id'] == lid)


def count_in(text, frag):
    return len(re.findall(re.escape(frag), text)) if text is not None else 0


def check_golden(g, contract_text, facts, claims):
    errs, warns, rep = [], [], defaultdict(list)
    E = lambda c, m: errs.append((c, m))
    # R-1 — published_at 은 날짜만 (§5.3)
    if not (isinstance(g.get('published_at'), str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', g['published_at'])):
        E('GOLD_PUBLISHED_AT_SHAPE', f'published_at={g.get("published_at")!r} — "YYYY-MM-DD" 여야 한다 (§5.3 · R-1)')
    # 대기 = §17 표
    pend = [(lid, n, sp['text'], sp['layer'], sp['_refs_pending'].get('need'), path)
            for lid, n, path, sp in golden_spans(g) if isinstance(sp.get('_refs_pending'), dict)]
    table = pending_table(contract_text)
    left = list(pend)
    for row in table:
        lv, n, txt, layer, need = row
        prefix = VA.strip_tags(txt.replace('…', '')).strip()
        hit = next((p for p in left if p[0] == lv and p[1] == n and p[3] == layer and p[4] == need
                    and VA.strip_tags(p[2]).strip().startswith(prefix)), None)
        if hit:
            left.remove(hit)
        else:
            E('GOLD_PENDING_TABLE', f'§17 행 {lv} {n} "{txt[:20]}" {layer}/{need} 가 골든 대기에 없다')
    for p in left:
        E('GOLD_PENDING_TABLE', f'골든 대기 {p[0]} {p[1]} "{p[2][:20]}" {p[3]}/{p[4]} 가 §17 표에 없다')
    rep['pending'] = Counter(p[4] for p in pend)
    # 끊긴 F 연결 — DC 있는 claim span 은 그 DC 의 브리프 근거 안이어야 잃는 것이 없다 (§7.2)
    for lid, n, path, sp in golden_spans(g):
        d = sp.get('_fact_refs_dropped')
        if not d:
            continue
        if sp['layer'] == 'claim' and sp['refs']:
            pool = set().union(*(claims.get(r, {}).get('all', set()) for r in sp['refs']))
            miss = [f for f in d if f not in pool]
            if miss:
                E('GOLD_DROPPED_NOT_IN_BASIS', f'{lid} {n}장 "{sp["text"][:20]}": 끊긴 {miss} 가 {sp["refs"]} 의 브리프 근거에 없다 — 옮기면 잃는다')
            rep['dropped_claim'].append((lid, n, sp['text'], d))
        elif sp['layer'] == 'claim':
            rep['dropped_pending'].append((lid, n, sp['text'], d))
        elif sp['layer'] == 'bridge':
            rep['dropped_bridge'].append((lid, n, sp['text'], d))
        else:
            rep['dropped_other'].append((lid, n, sp['layer'], sp['text'], d))
    # _volatility — 조각이 한 번 · VOLATILE as_of 가 사실마다 하나 · op 가 표 안
    as_of = defaultdict(set)
    ops = op_table(contract_text)
    for lid, path, v in vol_entries(g):
        txt = VA.plain_of(VA.resolve(level_of(g, lid), path))
        k = count_in(txt, v['span'])
        if k != 1:
            E('GOLD_FRAGMENT_AMBIGUOUS', f'{lid} {path} "{v["span"]}": 그 글에 {k}번 나온다 — 한 번이어야 어느 조각인지 안다 (불변식 15)')
        rep['vol'].append((lid, path, v['class']))
        if v['class'] == 'VOLATILE':
            if not v.get('refs'):
                E('GOLD_VOLATILE_NO_FACT', f'{lid} {path} "{v["span"]}": VOLATILE 인데 가리키는 사실이 없다')
            for r in v.get('refs', []):
                as_of[r].add(v.get('as_of'))
        elif v['class'] == 'DERIVED':
            if v['formula']['op'] not in ops:
                E('GOLD_OP_UNKNOWN', f'{lid} {path}: op {v["formula"]["op"]!r} 가 §6.4 표에 없다')
            for x in v['derived_from']:
                if len(x.get('refs', [])) > 1:
                    E('GOLD_INPUT_MULTI', f'{lid} {path} 입력 {x["key"]}: 사실이 {x["refs"]} — 입력 하나에 사실 하나')
    for f, s in sorted(as_of.items()):
        if len(s) != 1:
            E('GOLD_ASOF_CONFLICT', f'{f}: as_of 가 {sorted(map(str, s))} — 사실의 속성이면 하나여야 한다 (§6.2)')
    rep['as_of'] = {f: next(iter(s)) for f, s in as_of.items() if len(s) == 1}
    # 인용 (§10)
    for lv in g['levels']:
        for i, s in enumerate(lv['slides']):
            for j, b in enumerate(s['blocks']):
                if b.get('type') != 'quote':
                    continue
                w = f'{lv["id"]} {i + 1}장 blocks/{j}'
                body = set(r for sp in b['body'] for r in sp['refs'])
                attr = set(b.get('_attribution_refs', []))
                if not body <= attr:
                    E('GOLD_ATTRIBUTION', f'{w}: 출처 표시 사실 {sorted(attr)} 가 body 사실 {sorted(body)} 을 품지 않는다')
                rep['quote'].append((w, b['attribution'], sorted(body), sorted(attr - body)))
                t = VA.strip_tags(''.join(sp['text'] for sp in b['body'])).strip()
                if t and (t[0] in QMARKS or t[-1] in QMARKS):
                    E('GOLD_QUOTE_MARKS', f'{w}: 인용 body 가 따옴표로 싸여 있다 — 인용부호는 표시다 (§10.2)')
    # 게이트 3 후보
    tm = type_map(contract_text)
    for lid, n, path, sp in golden_spans(g):
        if any(c in sp['text'] for c in '“”"') and not path.startswith('x'):
            rep['inline_quote'].append((lid, n, sp['layer'], sp['refs'], sp['text']))
        if sp['layer'] == 'fact' and sp['refs'] and all(tm.get(facts.get(r, {}).get('btype')) == 'OFFICIAL_CLAIM'
                                                         for r in sp['refs']):
            rep['claim_fact'].append((lid, n, sp['refs'], sp['text']))
    return errs, warns, rep


# ── D. 시험 사본 ─────────────────────────────────────────────────────────────
EVENT = 'FOMC-20260916'
IRAN = 'SL-iran-war'
IRAN_FACTS = {'F37'}
UID = lambda kind, label: str(uuid.uuid5(uuid.NAMESPACE_URL, f'claro-selftest:{kind}:{label}'))


def default_type(btype, tm):
    """시험 사본용 — §3.3 표가 7값이면 그것, _open-1 은 추천안 (a), 행마다 · 나눈다는 보수적으로 OFFICIAL_CLAIM (D20 비대칭)"""
    v = tm.get(btype, '')
    if v in FACT_TYPES:
        return v
    return {'SELF_LIMIT': 'OFFICIAL_LIMIT', 'HISTORICAL_CONTEXT': 'OFFICIAL_ACTION'}.get(btype, 'OFFICIAL_CLAIM')


def build_model(g, contract_text, facts_b, claims_b, sources_b, lib):
    """골든 + FOMC 브리프 → 이 계약 모양 (메모리 안, 시험용 UUID). 채울 재료가 없는 곳은 비워 둔다 — 지어내지 않는다"""
    tm = type_map(contract_text)
    as_of = {}
    for lid, path, v in vol_entries(g):
        if v['class'] == 'VOLATILE':
            for r in v['refs']:
                as_of[r] = v['as_of']
    m = {'facts': {}, 'fact_sources': [], 'sources': {}, 'documents': {}, 'registry': {}, 'claims': {},
         'bridges': {}, 'events': {}, 'storylines': {}, 'storyline_versions': [], 'slots': []}
    m['events'][EVENT] = {'event_id': EVENT, 'title': '2026-09-16 FOMC', 'occurred_at': '2026-09-16', 'storyline_id': None}
    m['storylines'][IRAN] = {'storyline_id': IRAN, 'title': '이란 전쟁', 'version': 1, 'ongoing': True}
    m['storyline_versions'].append({'storyline_id': IRAN, 'version': 1, 'created_at': g['published_at'], 'change': '생성'})
    for lab, s in sources_b.items():
        sid = UID('source', lab)
        m['sources'][sid] = {'source_id': sid, 'label': lab, 'title': s['title'], 'publisher': 'federalreserve.gov',
                             'url': None, 'kind': 'PRIMARY', 'language': 'en', 'published_at': s['published_at'],
                             'ingested_at': '2026-09-18'}
    for lab, f in facts_b.items():
        fid = UID('fact', lab)
        ft = default_type(f['btype'], tm)
        iran = lab in IRAN_FACTS
        m['facts'][fid] = {
            'fact_id': fid, 'label': lab, 'claim_text': f['text'], 'fact_type': ft,
            'actor': 'FOMC' if ft in ('OFFICIAL_CLAIM', 'OFFICIAL_LIMIT') else None,
            'volatility': 'VOLATILE' if lab in as_of else 'STABLE', 'as_of': as_of.get(lab),
            'event_at': None, 'event_id': None if iran else EVENT, 'storyline_id': IRAN if iran else None,
            'storyline_version': 1 if iran else None, 'extraction_model': None, 'extraction_version': None}
        if f['src']:                                   # 출처 문서는 알지만 원문 위치는 없다 (§4.2 실물 없음)
            m['fact_sources'].append({'fact_id': fid, 'source_id': UID('source', f['src']), 'section': None,
                                      'span_start': None, 'span_end': None})
    fid = {m['facts'][k]['label']: k for k in m['facts']}
    for dc, c in claims_b.items():
        cid = UID('claim', dc)
        m['claims'][cid] = {'claim_id': cid, 'label': dc, 'event_id': EVENT, 'statement': dc, 'kind': c['kind'],
                            'basis': [fid[x] for x in c['basis'] if x in fid],
                            'checks': [{'question': k['question'], 'slot': None, 'recollected': False, 'answer': '',
                                        'facts': [fid[x] for x in k['facts'] if x in fid], 'outcome': k['outcome']}
                                       for k in c['checks']]}
    cid = {m['claims'][k]['label']: k for k in m['claims']}
    # 브리지 — 골든 bridge span 의 끊긴 F 연결이 재료. 개념 버전은 지금 라이브러리 (CONCEPT_IDENTITY §3.2 골든 = C-0002@3)
    ver = {c['code']: c['version'] for c in lib['concepts']}
    bfacts = []
    for lid, n, path, sp in golden_spans(g):
        if sp['layer'] == 'bridge':
            bfacts += [fid[x] for x in sp.get('_fact_refs_dropped', []) if x in fid]
    bid = UID('bridge', 'C-0002④')
    m['bridges'][bid] = {'bridge_id': bid, 'label': 'C-0002 ④', 'bridge_type': 'CONCEPT_BRIDGE', 'event_id': EVENT,
                         'concept_id': UID('concept', 'C-0002'), 'concept_version': ver['C-0002'], 'slot': '④',
                         'from_event': None, 'facts': list(dict.fromkeys(bfacts))}
    # 패키지 — `_` 를 떼고 refs 를 층별 Ref 로. 대기 span 은 브리지만 채운다 (나머지는 콘텐츠 몫이라 비워 둔다)
    pkg = strip_underscore(g)
    idx = VC.parts(lib)
    pending = []
    for (lid, spans), (_, gspans) in zip(VC.level_spans(pkg), VC.level_spans(g)):
        for (path, sp), (_, gsp) in zip(spans, gspans):
            L = sp['layer']
            if L == 'fact':
                sp['refs'] = [fid[r] for r in sp['refs']]
            elif L == 'claim':
                sp['refs'] = [cid[r] for r in sp['refs']]
            elif L == 'bridge':
                sp['refs'] = [bid]
            elif L == 'concept':
                key = VC.match_part(sp, idx)
                sp['refs'] = [{'concept_id': UID('concept', r), 'version': ver[r],
                               'part': key[1] if key and key[0] == r else None} for r in sp['refs']]
            if L != 'writing' and not sp['refs']:
                pending.append((lid, path, L, gsp['_refs_pending']['need']))
    tes = []
    for lid, path, v in vol_entries(g):
        te = {'at': {'level': lid, 'path': path, 'fragment': v['span']}, 'class': v['class'], 'facts': [],
              'value_at_authoring': None, 'check': None, 'formula': None, 'inputs': []}
        if v['class'] == 'VOLATILE':
            te['facts'] = [fid[r] for r in v['refs']]
        else:
            f = v['formula']
            te.update(value_at_authoring=v['value_at_authoring'], check=v['check'],
                      formula={'op': f['op'], 'from': f.get('from'), 'to': f.get('to'), 'of': f.get('of'),
                               'offset': f.get('offset')},
                      inputs=[{'key': x['key'], 'what': x['what'], 'value': x['value'],
                               'fact': fid[x['refs'][0]] if x.get('refs') else None} for x in v['derived_from']])
        tes.append(te)
    m['record'] = {'package': pkg, 'authoring': {'time_expressions': tes, 'storylines': [{'storyline_id': IRAN, 'version': 1}],
                                                 'notes': [g.get('_published_at_basis', '')]}}
    m['pending'] = pending
    m['concept_codes'] = {UID('concept', c['code']): c['code'] for c in lib['concepts']}
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
    # 1 — 키 · label
    seen = Counter()
    for kind, key in (('facts', 'fact_id'), ('claims', 'claim_id'), ('bridges', 'bridge_id'), ('sources', 'source_id')):
        for k, v in m[kind].items():
            if k != v[key]:
                E('KEY_MISMATCH', f'{kind} {k} 의 {key} 가 {v[key]}')
            seen[k] += 1
    for k, n in seen.items():
        if n > 1:
            E('KEY_DUP', f'키 {k} 가 {n}번')
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
        if pub and not dates:
            P('FACT_NOT_YET_PUBLIC', f'{w}: first_verified_public_at 이 없다 — 출처가 없다 (불변식 11)')
        elif pub and min(d[1] for d in dates) > dt.date.fromisoformat(pub):
            P('FACT_NOT_YET_PUBLIC', f'{w}: 가장 이른 출처가 발행일 뒤다 (불변식 11 · §5.3)')
    # 13 — 스토리라인 핀
    pins = {p['storyline_id']: p['version'] for p in auth['storylines']}
    for sid in sorted({F[k]['storyline_id'] for k in reach_f if F[k]['storyline_id']}):
        cur = m['storylines'][sid]['version']
        if pins.get(sid) != cur:
            P('STORYLINE_STALE', f'{sid}: 핀 {pins.get(sid)} ≠ 최신 {cur} (불변식 13 · §9.4)')
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
                common = set.intersection(*[{x['source_id'] for x in fs.get(r, []) if isinstance(x['span_start'], int)}
                                            for r in ids]) if ids else set()
                if not common:
                    P('QUOTE_NO_COMMON_SOURCE', f'{w}: body 사실들이 원문 위치를 가진 공통 Source 가 없다 (불변식 19)')
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
def run(contract_text, log_text, g, lib_text):
    lib = VC.parse_library(lib_text)
    fb = brief_facts(BRIEFS['FOMC'])
    cb = brief_claims(BRIEFS['FOMC'])
    sb = brief_sources(BRIEFS['FOMC'])
    errs = check_contract(contract_text, brief_types()) + check_log(log_text)
    e, warns, rep = check_golden(g, contract_text, fb, cb)
    errs += e
    model = None
    if not e:                                           # 골든이 이 계약으로 옮겨지지 않으면 시험 사본을 만들지 않는다
        model = build_model(g, contract_text, fb, cb, sb, lib)
        me, held = check_model(model, lib)
        errs += me
        rep['held'] = held
    return errs, warns, rep, model, lib


def main():
    report = '--report' in sys.argv
    read = lambda p: open(p, encoding='utf-8').read()
    g = json.load(open(GOLDEN, encoding='utf-8'))
    errs, warns, rep, model, lib = run(read(CONTRACT), read(LOG) if os.path.exists(LOG) else '', g, read(LIBRARY))
    fb = brief_facts(BRIEFS['FOMC'])
    print('verify-data-model')
    print(f'  계약   {os.path.relpath(CONTRACT, ROOT)}')
    bt = brief_types()
    print(f'  실물   브리프 3 — 사실 타입 {len(bt)}종 · FOMC 사실 {len(fb)} · DC {len(brief_claims(BRIEFS["FOMC"]))}')
    vol = Counter(c for _, _, c in rep.get('vol', []))
    print(f'         골든 — 대기 {sum(rep["pending"].values())} ({dict(sorted(rep["pending"].items()))}) · '
          f'시간 조각 {sum(vol.values())} ({dict(sorted(vol.items()))}) · 인용 {len(rep.get("quote", []))}')
    print(f'         끊긴 F 연결 — DC 있는 claim {len(rep["dropped_claim"])} · 대기 claim {len(rep["dropped_pending"])} · '
          f'bridge {len(rep["dropped_bridge"])} · 그 밖 {len(rep["dropped_other"])}')
    if model:
        held = Counter(c for c, _ in rep['held'])
        print(f'  시험 사본 — Fact {len(model["facts"])} · Claim {len(model["claims"])} · Bridge {len(model["bridges"])} · '
              f'Source {len(model["sources"])} · 시간 조각 {len(model["record"]["authoring"]["time_expressions"])}')
        print(f'         발행 검사에서 막히는 것 {sum(held.values())} — ' + ' · '.join(f'{k} {v}' for k, v in sorted(held.items())))
    if report:
        report_out(rep, model, fb)
    print()
    for code, msg in warns:
        print(f'  WARN  {code}: {msg}')
    for code, msg in errs:
        print(f'  ERROR {code}: {msg}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


def report_out(rep, model, fb):
    print('\n골든 VOLATILE → Fact.as_of (§6.2)')
    for f, a in sorted(rep['as_of'].items()):
        print(f'  {f} as_of {a}')
    print('\n끊긴 F 연결 — 대기 claim (C-5 근거 후보) · bridge (Bridge.facts) · 그 밖')
    for lid, n, t, d in rep['dropped_pending']:
        print(f'  claim  {lid} {n}장 {d}  "{t[:30]}"')
    for lid, n, t, d in rep['dropped_bridge']:
        print(f'  bridge {lid} {n}장 {d}  "{t[:30]}"')
    for lid, n, L, t, d in rep['dropped_other']:
        print(f'  {L:<6} {lid} {n}장 {d}  "{t[:30]}"  ← 갈 곳 없음')
    print('\n인용 (§10.1) — 출처 표시 · body 사실 · 표시에만 있던 사실(→ Source 서지)')
    for w, a, body, extra in rep['quote']:
        print(f'  {w}  "{a}"  body {body}  표시만 {extra}')
    print('\n게이트 3 후보 — 본문 따옴표 (§10.2)')
    for lid, n, L, refs, t in rep['inline_quote']:
        print(f'  {lid} {n}장 {L:<7} {refs}  {t.strip()!r}')
    print(f'\n게이트 3 후보 — OFFICIAL_CLAIM 사실만 가리키는 fact span {len(rep["claim_fact"])} (§3.4 — 주장한 쪽을 글이 밝히나)')
    for lid, n, refs, t in rep['claim_fact']:
        print(f'  {lid} {n}장 {refs}  {VA.strip_tags(t).strip()[:50]!r}')
    if model:
        print('\n시험 사본 발행 검사 — 막히는 것 (§18: 0.2m · 콘텐츠가 채울 것)')
        by = defaultdict(list)
        for c, msg in rep['held']:
            by[c].append(msg)
        for c, msgs in sorted(by.items()):
            print(f'  {c} {len(msgs)}')
            for msg in msgs[:6]:
                print(f'    {msg}')
            if len(msgs) > 6:
                print(f'    … {len(msgs) - 6}개 더')


if __name__ == '__main__':
    sys.exit(main())
