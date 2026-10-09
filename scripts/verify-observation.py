#!/usr/bin/env python3
"""OBSERVATION.md 를 기계로 확인한다 (B-0.2c).

    python3 scripts/verify-observation.py            # 검사
    python3 scripts/verify-observation.py --report   # + correction-log.csv 를 이 계약 모양으로 옮기면 행마다 무엇이 되나 (0.2m 입력)

네 곳을 본다.
  A. 계약 문서   확정 §9.4 · §10.3 의 칸과 값이 다 있다. §9.6 보류 항목 · 값을 매기는 칸 · 사람을 알아볼 칸 · 방향을 적는 칸 ·
                 probe 를 놓을 자리를 정하는 칸이 없다. 다른 계약의 타입을 다시 정의하지 않았다. 실물 없는 절에 "실물 없음".
                 계약이 실물이라고 적은 수(§4.2 골든 · §8 CSV)가 실물과 같다
  B. 로그        0.2c 로그 머리 요약에 질문 8개가 [계약 반영 / _open / 미확인] 과 근거를 갖는다
  C. 교정 기록   실물 CSV 14행을 **메모리 안에서** 이 계약 모양으로 옮기고(초안 대응) 불변식 20 · 21 을 돌린다
  D. 시험 원장   독자 기록은 실물이 한 줄도 없다. 골든을 읽는 가짜 독자 하나의 원장을 메모리 안에서 만들어 불변식 1 ~ 19 를 돌린다.
                 가짜 독자 · 가짜 물음은 검사를 시험하려는 것이다 — 관찰이 아니다. 파일로 남기지 않는다

exit 0 OK · 1 FAIL
"""
import copy, csv, importlib.util, io, json, os, re, sys, uuid
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/OBSERVATION.md')
OTHERS = [os.path.join(ROOT, 'docs/contract', n) for n in ('ARTICLE_PACKAGE.md', 'CONCEPT_IDENTITY.md', 'DATA_MODEL.md')]
LOG = os.path.join(ROOT, 'logs/backend/phase-0-step-0-2c.md')
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')
CSV_PATH = os.path.join(ROOT, 'logs/correction-log.csv')
DEVCONTENT = os.path.join(ROOT, 'docs/development-content.md')


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VC = _load('vc', 'scripts/verify-concept-identity.py')      # ts 타입 파서 · 절 나누기 · §9.6 금지어 · 라이브러리 · 문안 대조

# ── A. 계약 문서 ─────────────────────────────────────────────────────────────
REQUIRED_FIELDS = {
    # 확정 §9.4 knowledge_evidence (response · is_correct 는 아래 MOVED)
    'KnowledgeEvidence': ('event_id', 'user_id', 'concept_id', 'timestamp', 'evidence_type', 'position', 'article_id',
                          'interaction_id', 'probe_id', 'content_block_id', 'exposure_context', 'model_version',
                          'content_version'),
    # 확정 §9.4 reading_plan_log
    'ReadingPlanLog': ('plan_id', 'user_id', 'article_id', 'article_version', 'created_at', 'level', 'estimator_version',
                       'selected_blocks', 'skipped_blocks', 'block_decisions', 'narrative_form', 'probe_plan',
                       'session_id', 'reading_id', 'level_chosen_by'),
    'BlockDecision': ('concept_id', 'version', 'decision', 'reason'),
    'ReadingEvent': ('event_id', 'user_id', 'session_id', 'reading_id', 'plan_id', 'seq', 'occurred_at', 'type',
                     'slide_index', 'from_plan_id'),
    'ProbeExposure': ('exposure_id', 'user_id', 'session_id', 'probe_id', 'probe_version', 'probe_type', 'position',
                      'plan_id', 'shown_at'),
    'ProbeResponse': ('interaction_id', 'exposure_id', 'user_id', 'responded_at'),
    'Probe': ('probe_id', 'version', 'targets', 'prompt'),
    'ArticleRef': ('article_id', 'article_version'),
    'SlideLoc': ('slide_index', 'block_index'),
    # 실물 CSV 8열 + 확정 §10.3
    'CorrectionEntry': ('correction_id', 'date', 'event_code', 'gate', 'occasion', 'stage', 'targets', 'error_type',
                        'type_note', 'what_was_wrong', 'what_i_changed', 'caught_by', 'check', 'catch_note',
                        'time_spent_min', 'after_publication', 'replacements'),
    'CorrectionTarget': ('kind', 'code', 'where'),
    'Replacement': ('kind', 'old_id', 'old_version', 'new_id', 'new_version'),
}
MOVED = {'response': ('KnowledgeEvidence', 'ProbeResponse'), 'is_correct': ('KnowledgeEvidence', 'ProbeResponse')}   # _open-2
POSITIONS = {'PRE', 'POST', 'DELAYED'}                                        # 확정 §9.4
PROBE_TYPES = {'DIAGNOSTIC', 'ACTIVE', 'AUDIT', 'COMPREHENSION'}             # 확정 §9.4
DECISIONS = {'SKIP', 'REFRESHER', 'FULL'}                                    # 확정 §9.4
GATES = {'GATE_1', 'GATE_2', 'GATE_3', 'GATE_4'}                             # 확정 §10.2
CATCH_CONFIRMED = {'BACKGROUND_KNOWLEDGE', 'SOURCE_RECHECK', 'PLAIN_READING', 'OTHER_READER'}   # 확정 §10.3
EVENT_TYPES = {'SLIDE_ENTERED', 'LEVEL_SWITCHED', 'CLOSED'}
CSV_HEADER = ['date', 'event_id', 'stage', 'error_type', 'what_was_wrong', 'what_i_changed', 'source_of_catch', 'time_spent_min']
LEDGERS = ('ReadingPlanLog', 'ReadingEvent', 'KnowledgeEvidence', 'ProbeExposure', 'ProbeResponse', 'Probe')
# 값을 매기는 칸 — 원장은 사실만 (확정 §9.4)
VALUATION = re.compile(r'(?:^|_)(weight|score|confidence|mastery|strength|threshold|level_estimate|known|state)(?:$|_)', re.I)
# 사람을 알아볼 칸 (§3)
PERSONAL = re.compile(r'(?:^|_)(name|email|phone|device|ip|addr|address|agent|account|location)(?:$|_)', re.I)
# 방향 · 손짓 (D26 OPEN)
DIRECTION = re.compile(r'NEXT|PREV|BACK|FORWARD|UP\b|DOWN|LEFT|RIGHT|SWIPE|SCROLL|direction|gesture|delta', re.I)
# 놓을 자리 (D18 OPEN) — 물음과 계획에는 자리 칸이 없다
PLACEMENT = re.compile(r'slide|loc|slot|place|after|before|where', re.I)
NO_REAL_TITLES = ('probe', 'Replacement')
MARKS = ('계약 반영', '_open', '미확인')


def aliases(text):
    """```ts 블록의  Name = "A" | "B"  →  {Name: {A, B}}"""
    out = {}
    for block in re.findall(r'```ts\n(.*?)```', text, re.S):
        for m in re.finditer(r'^(\w+)\s*=\s*(.+?)\s*(?://.*)?$', block, re.M):
            vals = set(re.findall(r'"([^"]+)"', m.group(2)))
            if vals:
                out[m.group(1)] = vals
    return out


def enum_of(types, al, t, f):
    expr = types.get(t, {}).get(f, '')
    vals = set(re.findall(r'"([^"]+)"', expr))
    for name, v in al.items():
        if re.search(rf'\b{name}\b', expr):
            vals |= v
    return vals


def sec_by_num(text, num):
    for h, body in VC.sections(text):
        if re.match(rf'^{re.escape(num)}[ .]', h):
            return h, body
    return None, ''


def table_rows(body):
    rows, seen_sep = [], False
    for line in body.splitlines():
        if not line.startswith('|'):
            if rows:
                break
            seen_sep = False
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-+:?', c) for c in cells):
            seen_sep = True
            continue
        if seen_sep:
            rows.append(cells)
    return rows


def devcontent_error_types(text):
    _, body = next(((h, b) for h, b in VC.sections(text) if h.strip() == '오류 유형'), (None, ''))
    return [r[0].strip('*') for r in table_rows(body)]


def read_csv(text):
    rd = csv.reader(io.StringIO(text))
    header = next(rd)
    return header, [dict(zip(header, r)) for r in rd if r]


def check_contract(text, others_text, devcontent_text, csv_text, gold, lib):
    errs = []
    types, al = VC.ts_types(text), aliases(text)
    for t, fields in REQUIRED_FIELDS.items():
        if t not in types:
            errs.append(('CONTRACT_FIELD', f'타입 {t} 가 계약 타입 블록에 없다'))
            continue
        for f in fields:
            if f not in types[t]:
                errs.append(('CONTRACT_FIELD', f'{t}.{f} 가 없다'))
    for f, homes in MOVED.items():
        if not any(f in types.get(h, {}) for h in homes):
            errs.append(('CONTRACT_FIELD', f'확정 §9.4 의 `{f}` 가 {" · ".join(homes)} 어디에도 없다'))
    for (t, f), want, exact in ((('KnowledgeEvidence', 'position'), POSITIONS, True),
                                (('ProbeExposure', 'position'), POSITIONS, True),
                                (('ProbePlanItem', 'position'), POSITIONS, True),
                                (('ProbeExposure', 'probe_type'), PROBE_TYPES, True),
                                (('ProbePlanItem', 'probe_type'), PROBE_TYPES, True),
                                (('BlockDecision', 'decision'), DECISIONS, True),
                                (('CorrectionEntry', 'gate'), GATES, True),
                                (('ReadingEvent', 'type'), EVENT_TYPES, True),
                                (('CorrectionEntry', 'caught_by'), CATCH_CONFIRMED, False)):
        got = enum_of(types, al, t, f)
        if (got != want) if exact else not (want <= got):
            errs.append(('CONTRACT_ENUM', f'{t}.{f} 값 {sorted(got)} — 확정 {sorted(want)}'))
    # 유형 9종 = development-content 유형 표 (실물)
    want_types = set(devcontent_error_types(devcontent_text))
    got_types = enum_of(types, al, 'CorrectionEntry', 'error_type')
    if got_types != want_types:
        errs.append(('CONTRACT_ERROR_TYPES', f'error_type {sorted(got_types ^ want_types)} 가 유형 표와 다르다'))
    # 하지 말 것
    for pat in VC.HELD:
        for m in re.finditer(pat, text, re.I):
            errs.append(('CONTRACT_HELD_TERM', f'L{text[:m.start()].count(chr(10)) + 1} "{m.group()}" — §9.6 보류 항목은 넣지 않는다'))
    for t, fields in types.items():
        if re.fullmatch(r'user_?concept_?state', t, re.I) or re.search(r'estimator$', t, re.I):
            errs.append(('CONTRACT_FOREIGN_TYPE', f'{t} 를 정의했다 — 이 계약의 것이 아니다'))
        for f, expr in fields.items():
            if t in LEDGERS and VALUATION.search(f):
                errs.append(('CONTRACT_VALUATION', f'{t}.{f} — 원장에 값을 매기는 칸을 두지 않는다 (확정 §9.4)'))
            if PERSONAL.search(f):
                errs.append(('CONTRACT_PERSONAL', f'{t}.{f} — 사람을 알아볼 칸을 두지 않는다 (§3)'))
            if t == 'ReadingEvent' and (DIRECTION.search(f) or any(DIRECTION.search(v) for v in re.findall(r'"([^"]+)"', expr))):
                errs.append(('CONTRACT_DIRECTION', f'ReadingEvent.{f} — 방향 · 손짓에 기대는 칸이나 값 (D26 OPEN)'))
            if t in ('Probe', 'ProbePlanItem', 'ProbeTarget') and (PLACEMENT.search(f) or 'SlideLoc' in expr):
                errs.append(('CONTRACT_PROBE_PLACEMENT', f'{t}.{f} — probe 를 놓을 자리를 정하지 않는다 (D18 OPEN)'))
    foreign = set()
    for o in others_text:
        foreign |= set(VC.ts_types(o))
    for t in types:
        if t in foreign:
            errs.append(('CONTRACT_FOREIGN_TYPE', f'{t} 는 다른 계약의 타입이다 — 한 타입은 한 파일에만'))
    secs = VC.sections(text)
    for topic in NO_REAL_TITLES:
        hit = [(h, b) for h, b in secs if topic.lower() in h.lower()]
        if not hit:
            errs.append(('CONTRACT_NO_REAL', f'"{topic}" 절이 없다'))
        for h, b in hit:
            if '실물 없음' not in h + b:
                errs.append(('CONTRACT_NO_REAL', f'"{h}" 절에 "실물 없음" 표시가 없다 (D24)'))
    if not re.search(r'^\| 20\d\d-\d\d-\d\d \| .+ \| B-0\.2c', text, re.M):
        errs.append(('CONTRACT_CHANGELOG', 'CHANGELOG 에 B-0.2c 행이 없다'))
    h, body = sec_by_num(text, '14')
    if not h or not [r for r in table_rows(body) if re.search(r'\d', r[0])]:
        errs.append(('CONTRACT_OPEN', '§14 _open 표가 없다'))
    # 계약이 실물이라고 적은 수 = 실물
    header, rows = read_csv(csv_text)
    _, b81 = sec_by_num(text, '8.1')
    for col in header:
        if f'`{col}`' not in b81:
            errs.append(('CONTRACT_CSV_COLUMN', f'실물 열 `{col}` 이 §8.1 표에 없다'))
    _, b82 = sec_by_num(text, '8.2')
    said = {r[0].strip('`'): r[1] for r in table_rows(b82)}
    real = {k: str(v) for k, v in Counter(r['stage'] for r in rows).items()}
    if said != real:
        errs.append(('CONTRACT_REAL_MISMATCH', f'§8.2 stage 표 {said} ≠ 실물 {real}'))
    _, b83 = sec_by_num(text, '8.3')
    said = {r[0].split('`')[1]: int(re.match(r'\d+', r[2]).group()) for r in table_rows(b83) if '`' in r[0]}
    real = Counter(m['caught_by'] for m in DRAFT_MAP)
    if {k: v for k, v in said.items() if v} != dict(real) or sum(said.values()) != len(rows):
        errs.append(('CONTRACT_REAL_MISMATCH', f'§8.3 caught_by 표 {said} ≠ 초안 대응 {dict(real)} (실물 {len(rows)}행)'))
    _, b42 = sec_by_num(text, '4.2')
    tabs = [r for r in table_rows(b42.split('**실물**')[-1]) if re.match(r'C-\d{4}', r[0])]
    said = {r[0]: tuple(re.match(r'\**(\w+)', c).group(1) for c in r[1:3]) for r in tabs}
    dec = derive_decisions(gold, lib)
    real = {code: (dec['basic'][code][0], dec['advanced'][code][0]) for code in dec['basic']}
    if said != real:
        errs.append(('CONTRACT_REAL_MISMATCH', f'§4.2 골든 표 {said} ≠ 골든에서 계산 {real}'))
    return errs


# ── B. 로그 ──────────────────────────────────────────────────────────────────
def check_log(text):
    errs, rows = [], {}
    for line in text.splitlines()[:80]:
        m = re.match(r'^\|\s*([1-8])\s*\|(.*)\|\s*$', line)
        if m and m.group(1) not in rows:
            rows[m.group(1)] = m.group(2)
    for q in '12345678':
        if q not in rows:
            errs.append(('LOG_QUESTION', f'질문 {q} 행이 로그 머리(80줄 안)에 없다'))
            continue
        if not any(mk in rows[q] for mk in MARKS):
            errs.append(('LOG_QUESTION', f'질문 {q}: [계약 반영 / _open / 미확인] 표시가 없다'))
        if not re.search(r'§\d|D\d\d|correction-log|ArticleReader|F-1|F-2a|골든', rows[q]):
            errs.append(('LOG_QUESTION', f'질문 {q}: 근거(실물 또는 FINDINGS 절)가 없다'))
    return errs


# ── 골든 → block_decisions (§4.2) ───────────────────────────────────────────
def decision_of(parts):
    if any(p and p.startswith('FULL') for p in parts):
        return 'FULL'
    return 'REFRESHER' if 'REFRESHER' in parts else 'SKIP'


def derive_decisions(gold, lib):
    """{level: {code: (decision, version)}} — 골든은 아직 code 문자열만 가리킨다. part 는 문안 대조로 얻는다 (0.2m 이 채운다)"""
    idx = VC.parts(lib)
    ver = {c['code']: int(c['version']) for c in lib['concepts']}
    seen, codes = {}, set()
    for lid, spans in VC.level_spans(gold):
        seen[lid] = defaultdict(set)
        for _, sp in spans:
            if sp.get('layer') != 'concept':
                continue
            hit = VC.match_part(sp, idx)
            for code in sp['refs']:
                codes.add(code)
                seen[lid][code].add(hit[1] if hit and hit[0] == code else None)
    return {lid: {c: (decision_of(seen[lid].get(c, set())), ver[c]) for c in sorted(codes)} for lid in seen}


# ── C. 교정 기록 — 실물 14행을 이 계약 모양으로 (초안 대응. 0.2m 에서 사람이 확인한다) ────
def UID(kind, key):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'claro-trial/{kind}/{key}'))


A, C = 'ARTICLE', 'CONCEPT'
_S1 = '0.0b 교정 (S1 역산)'
DRAFT_MAP = [   # CSV 행 순서 그대로
    dict(gate=None, occasion=_S1, stage='writing', targets=[(A, '입문 3장')], caught_by='ARTIFACT_COMPARE', check=None, repl=[]),
    dict(gate=None, occasion=_S1, stage='writing', targets=[(A, '숙련 4장')], caught_by='ARTIFACT_COMPARE', check=None, repl=[]),
    dict(gate=None, occasion=_S1, stage='writing', targets=[(A, '숙련 4장')], caught_by='ARTIFACT_COMPARE', check=None, repl=[]),
    dict(gate=None, occasion=_S1, stage='writing', targets=[(A, '숙련 4장')], caught_by='ARTIFACT_COMPARE', check=None, repl=[]),
    dict(gate=None, occasion=_S1, stage=None, targets=[(A, '저작 데이터')], caught_by='ARTIFACT_COMPARE', check=None, repl=[]),
    dict(gate='GATE_3', occasion='게이트 3', stage=None, targets=[(C, 'C-0005', 'REFRESHER'), (A, '숙련 4장')],
         caught_by='PLAIN_READING', check=None, repl=[('C-0005', 1, 2)]),
    dict(gate='GATE_3', occasion='S2 교정', stage=None, targets=[(C, 'C-0002', 'FULL ④'), (A, '입문 4장')],
         caught_by='ARTIFACT_COMPARE', check=None, repl=[('C-0002', 1, 2)]),
    dict(gate=None, occasion='C-1 린트', stage=None, targets=[(C, 'C-0010', 'REFRESHER')], caught_by='AUTOMATED_CHECK',
         check='lint-1', repl=[('C-0010', 1, 2)]),
    dict(gate=None, occasion='C-1b 게이트', stage=None, targets=[(C, 'C-0010', 'BOUNDARY')], caught_by='PLAIN_READING',
         check=None, repl=[]),                                                 # 같은 v2 — 위 행이 Replacement 를 갖는다
    dict(gate=None, occasion='C-1 린트', stage=None, targets=[(C, 'C-0008', 'REFRESHER')], caught_by='AUTOMATED_CHECK',
         check='lint-1', repl=[('C-0008', 1, 2)]),
    dict(gate=None, occasion='C-1 판정', stage=None, targets=[(C, 'C-0005', 'FULL')], caught_by='ARTIFACT_COMPARE',
         check=None, repl=[('C-0005', 2, 3)]),
    dict(gate=None, occasion='C-1 린트', stage=None, targets=[(C, 'C-0002', 'FULL ④')], caught_by='AUTOMATED_CHECK',
         check='lint-2', repl=[('C-0002', 2, 3)]),
    dict(gate=None, occasion='0.1b PM 검수', stage=None, targets=[(A, '입문 8장')], caught_by='PLAIN_READING', check=None, repl=[]),
    dict(gate=None, occasion='0.2b 게이트', stage=None, targets=[(A, '입문 7장')], caught_by='AUTOMATED_CHECK',
         check='quote-check', repl=[]),
]


def migrate_csv(rows):
    out = []
    for i, (r, m) in enumerate(zip(rows, DRAFT_MAP)):
        changed, _, note = r['what_i_changed'].partition(' 유형: ')
        targets = [{'kind': t[0], 'code': r['event_id'] if t[0] == A else t[1], 'where': t[-1]} for t in m['targets']]
        out.append({
            'correction_id': UID('correction', i), 'date': r['date'], 'event_code': r['event_id'] or None,
            'gate': m['gate'], 'occasion': m['occasion'], 'stage': m['stage'], 'targets': targets,
            'error_type': r['error_type'], 'type_note': note or None, 'what_was_wrong': r['what_was_wrong'],
            'what_i_changed': changed, 'caught_by': m['caught_by'], 'check': m['check'],
            'catch_note': r['source_of_catch'] or None,
            'time_spent_min': int(r['time_spent_min']) if r['time_spent_min'] else None, 'after_publication': False,
            'replacements': [{'kind': 'CONCEPT_VERSION', 'old_id': UID('concept', c), 'old_version': a,
                              'new_id': UID('concept', c), 'new_version': b} for c, a, b in m['repl']],
        })
    return out


def check_csv(header, rows, enums):
    errs = []
    if header != CSV_HEADER:
        errs.append(('CSV_HEADER', f'실물 열 {header} ≠ 계약이 출발한 열 {CSV_HEADER}'))
        return errs
    if len(rows) != len(DRAFT_MAP):
        errs.append(('CSV_ROWS', f'실물 {len(rows)}행 ≠ 초안 대응 {len(DRAFT_MAP)}행 — 대응을 다시 적어야 한다'))
    for i, r in enumerate(rows, 1):
        if r['error_type'] not in enums['error_type']:
            errs.append(('CSV_ERROR_TYPE', f'{i}행 error_type "{r["error_type"]}" 이 9종에 없다'))
        if not re.fullmatch(r'\d{4}-\d\d-\d\d', r['date']):
            errs.append(('CSV_DATE', f'{i}행 date "{r["date"]}"'))
    return errs


def keys_ok(kind, row, types, errs, code):
    extra = set(row) - set(types.get(kind, {}))
    if extra:
        errs.append((code, f'{kind} 줄에 계약에 없는 칸 {sorted(extra)} (불변식 1)'))


def check_corrections(entries, types, enums):
    errs = []
    replaced = {}
    for i, e in enumerate(entries, 1):
        keys_ok('CorrectionEntry', e, types, errs, 'CORR_FIELD')
        for f in ('gate', 'error_type', 'caught_by'):
            if e[f] is not None and e[f] not in enums[f]:
                errs.append(('CORR_ENUM', f'{i}행 {f} "{e[f]}"'))
        if e['caught_by'] is None or e['error_type'] is None or not e['occasion']:
            errs.append(('CORR_ENUM', f'{i}행 caught_by · error_type · occasion 은 비울 수 없다'))
        if not e['targets']:
            errs.append(('CORR_TARGET', f'{i}행 targets 가 비었다 (불변식 20)'))
        for t in e['targets']:
            if t['kind'] not in enums['target_kind']:
                errs.append(('CORR_TARGET', f'{i}행 target kind "{t["kind"]}"'))
        if (e['caught_by'] == 'AUTOMATED_CHECK') != bool(e['check']):
            errs.append(('CORR_CHECK', f'{i}행 caught_by {e["caught_by"]} · check {e["check"]!r} (불변식 20)'))
        if e['after_publication'] and not e['replacements']:
            errs.append(('CORR_PUBLISHED', f'{i}행 발행 뒤 교정인데 무엇이 대신하는지 없다 (불변식 20)'))
        for rp in e['replacements']:
            if rp['kind'] not in enums['replacement_kind']:
                errs.append(('REPL_SHAPE', f'{i}행 Replacement kind "{rp["kind"]}"'))
                continue
            if rp['kind'] == 'CONCEPT_VERSION':
                if rp['old_version'] is None or rp['new_version'] is None or rp['new_id'] != rp['old_id'] \
                        or rp['new_version'] <= rp['old_version']:
                    errs.append(('REPL_SHAPE', f'{i}행 CONCEPT_VERSION 은 같은 개념의 더 큰 버전으로 (불변식 21)'))
                    continue
                old, new = (rp['old_id'], rp['old_version']), (rp['new_id'], rp['new_version'])
            else:
                if not e['after_publication']:
                    errs.append(('REPL_BEFORE_PUBLICATION', f'{i}행 {rp["kind"]} 의 Replacement 는 발행 뒤에만 (불변식 20)'))
                if rp['old_version'] is not None or rp['new_version'] is not None or rp['new_id'] == rp['old_id']:
                    errs.append(('REPL_SHAPE', f'{i}행 {rp["kind"]} — 버전 칸은 null, 옛 것과 새 것은 다르다 (불변식 21)'))
                    continue
                old, new = (rp['old_id'], None), (rp['new_id'], None) if rp['new_id'] else None
            if (rp['kind'], old) in replaced:
                errs.append(('REPL_TWICE', f'{i}행 옛 것 {old[0][:8]}… 을 대신하는 것이 둘이다 (불변식 21)'))
            replaced[(rp['kind'], old)] = new
    for (kind, start), _ in replaced.items():
        cur, seen = start, set()
        while cur is not None and (kind, cur) in replaced:
            if cur in seen:
                errs.append(('REPL_CYCLE', f'{kind} {start[0][:8]}… 를 따라가면 돈다 (불변식 21)'))
                break
            seen.add(cur)
            cur = replaced[(kind, cur)]
    return errs


# ── D. 시험 원장 — 가짜 독자 하나 ────────────────────────────────────────────
ARTICLE_ID, ARTICLE_V = UID('article', 'FOMC-20260916'), 1


def build_ledger(gold, lib):
    cid = {c['code']: UID('concept', c['code']) for c in lib['concepts']}
    concepts = {cid[c['code']]: {'code': c['code'], 'version': int(c['version']), 'status': 'CANONICAL', 'leaf': True}
                for c in lib['concepts']}
    dec = derive_decisions(gold, lib)
    package = {'levels': {lv['id']: len(lv['slides']) for lv in gold['levels']},
               'decisions': {lid: {cid[c]: v for c, v in d.items()} for lid, d in dec.items()}}
    U, S, S2, R = UID('user', 1), UID('session', 1), UID('session', 2), UID('reading', 1)
    P = {lid: UID('plan', lid) for lid in package['levels']}

    def plan(lid, by, at):
        return {'plan_id': P[lid], 'user_id': U, 'session_id': S, 'reading_id': R, 'article_id': ARTICLE_ID,
                'article_version': ARTICLE_V, 'created_at': at, 'level': lid, 'level_chosen_by': by,
                'estimator_version': None, 'selected_blocks': None, 'skipped_blocks': None,
                'block_decisions': [{'concept_id': c, 'version': v, 'decision': d, 'reason': 'STATIC_LEVEL'}
                                    for c, (d, v) in package['decisions'][lid].items()],
                'narrative_form': None, 'probe_plan': []}
    plans = [plan('basic', 'DEFAULT', '2026-10-20T01:00:00Z'), plan('advanced', 'READER', '2026-10-20T01:04:00Z')]
    # 입문 1~4장 → 숙련으로 바꿔 끝까지 → 입문으로 돌아와 떠났던 4장 → 닫음
    steps = [('SLIDE_ENTERED', 'basic', i, None) for i in range(4)] + [('LEVEL_SWITCHED', 'advanced', None, 'basic')] \
        + [('SLIDE_ENTERED', 'advanced', i, None) for i in range(package['levels']['advanced'])] \
        + [('LEVEL_SWITCHED', 'basic', None, 'advanced'), ('SLIDE_ENTERED', 'basic', 3, None), ('CLOSED', 'basic', None, None)]
    events = [{'event_id': UID('rev', n), 'user_id': U, 'session_id': S, 'reading_id': R, 'plan_id': P[lid], 'seq': n,
               'occurred_at': f'2026-10-20T01:{n:02d}:00Z', 'type': t, 'slide_index': i,
               'from_plan_id': P[frm] if frm else None} for n, (t, lid, i, frm) in enumerate(steps)]
    c2, c3 = cid['C-0002'], cid['C-0003']
    probes = [{'probe_id': UID('probe', 'X'), 'version': 1, 'created_on': '2026-10-19', 'event_id': None,
               'targets': [{'concept_id': c2, 'version': concepts[c2]['version']}, {'concept_id': c3, 'version': concepts[c3]['version']}],
               'prompt': '시험', 'choices': ['가', '나'], 'correct_choice': 0},
              {'probe_id': UID('probe', 'G'), 'version': 1, 'created_on': '2026-10-19', 'event_id': None, 'targets': [],
               'prompt': '시험 — 요점', 'choices': None, 'correct_choice': None}]

    def exposure(key, probe, pos, lid, sess, at):
        return {'exposure_id': UID('exp', key), 'user_id': U, 'session_id': sess, 'probe_id': UID('probe', probe),
                'probe_version': 1, 'probe_type': 'COMPREHENSION', 'position': pos, 'plan_id': P[lid] if lid else None,
                'shown_at_loc': None, 'shown_at': at}
    exposures = [exposure(1, 'X', 'POST', 'basic', S, '2026-10-20T01:20:00Z'),
                 exposure(2, 'G', 'POST', 'basic', S, '2026-10-20T01:21:00Z'),
                 exposure(3, 'X', 'DELAYED', None, S2, '2026-10-24T01:00:00Z')]        # 답하지 않았다 — 증거 0
    responses = [{'interaction_id': UID('int', 1), 'exposure_id': UID('exp', 1), 'user_id': U,
                  'responded_at': '2026-10-20T01:20:30Z', 'response': '가', 'is_correct': True},
                 {'interaction_id': UID('int', 2), 'exposure_id': UID('exp', 2), 'user_id': U,
                  'responded_at': '2026-10-20T01:22:00Z', 'response': '시험 답', 'is_correct': None}]   # 요점 물음 — 증거 0

    def ev(key, concept, etype, pos, inter, probe, at):
        return {'event_id': UID('ev', key), 'user_id': U, 'concept_id': concept, 'content_version': concepts[concept]['version'],
                'timestamp': at, 'evidence_type': etype, 'position': pos, 'interaction_id': inter, 'probe_id': probe,
                'article_id': ARTICLE_ID, 'article_version': ARTICLE_V, 'content_block_id': None,
                'exposure_context': {'session_id': S, 'reading_id': R, 'plan_id': P['basic']}, 'model_version': None}
    evidence = [ev(1, c2, 'PROBE_RESPONSE', 'POST', UID('int', 1), UID('probe', 'X'), '2026-10-20T01:20:30Z'),
                ev(2, c3, 'PROBE_RESPONSE', 'POST', UID('int', 1), UID('probe', 'X'), '2026-10-20T01:20:30Z'),
                dict(ev(3, c2, 'SELF_REPORT_KNOWN', None, UID('int', 3), None, '2026-10-20T01:02:30Z'),
                     content_block_id={'slide_index': 2, 'block_index': None})]
    return {'package': package, 'concepts': concepts, 'plans': plans, 'events': events, 'probes': probes,
            'exposures': exposures, 'responses': responses, 'evidence': evidence}


def reading_summary(L, reading_id):
    """§5.2 · §5.3 — 적지 않고 계산한다"""
    plans = {p['plan_id']: p for p in L['plans']}
    evs = sorted((e for e in L['events'] if e['reading_id'] == reading_id), key=lambda e: e['seq'])
    entered = [e for e in evs if e['type'] == 'SLIDE_ENTERED']
    furthest = defaultdict(int)
    for e in entered:
        lv = plans[e['plan_id']]['level']
        furthest[lv] = max(furthest[lv], e['slide_index'])
    return {
        'completed': any(i == L['package']['levels'][lv] - 1 for lv, i in furthest.items()),
        'stopped_at': (plans[entered[-1]['plan_id']]['level'], entered[-1]['slide_index']) if entered else None,
        'furthest': dict(furthest),
        'switched_from': [plans[e['from_plan_id']]['level'] for e in evs if e['type'] == 'LEVEL_SWITCHED'],
    }


def check_ledger(L, types, enums):
    errs = []
    pkg, concepts = L['package'], L['concepts']
    plans = {p['plan_id']: p for p in L['plans']}
    for kind, key in (('ReadingPlanLog', 'plans'), ('ReadingEvent', 'events'), ('Probe', 'probes'),
                      ('ProbeExposure', 'exposures'), ('ProbeResponse', 'responses'), ('KnowledgeEvidence', 'evidence')):
        for row in L[key]:
            keys_ok(kind, row, types, errs, 'LEDGER_FIELD')
    # plan (불변식 3 ~ 7)
    by_reading = defaultdict(list)
    for p in L['plans']:
        by_reading[p['reading_id']].append(p)
        if p['level'] not in pkg['levels']:
            errs.append(('PLAN_LEVEL', f'plan 의 레벨 "{p["level"]}" 이 그 판에 없다 (불변식 4)'))
            continue
        static = p['estimator_version'] is None
        if static and (p['selected_blocks'] is not None or p['skipped_blocks'] is not None
                       or any(d['reason'] != 'STATIC_LEVEL' for d in p['block_decisions'])):
            errs.append(('PLAN_STATIC', f'정적 레벨 plan({p["level"]})이 블록 선택이나 다른 reason 을 가졌다 (불변식 5)'))
        got = {d['concept_id']: (d['decision'], d['version']) for d in p['block_decisions']}
        if any(d['decision'] not in enums['decision'] for d in p['block_decisions']):
            errs.append(('PLAN_DECISIONS', f'plan({p["level"]}) decision 값이 확정 셋 밖이다'))
        elif len(got) != len(p['block_decisions']) or (static and got != pkg['decisions'][p['level']]):
            errs.append(('PLAN_DECISIONS', f'plan({p["level"]}) block_decisions 가 패키지에서 계산한 값과 다르다 (불변식 6)'))
    for rid, ps in by_reading.items():
        if len({p['level'] for p in ps}) != len(ps):
            errs.append(('PLAN_DUPLICATE', '한 열람에 같은 레벨의 plan 이 둘이다 (불변식 3)'))
        if len({(p['user_id'], p['session_id'], p['article_id'], p['article_version']) for p in ps}) != 1:
            errs.append(('PLAN_READING', '한 열람의 plan 들이 다른 독자 · 세션 · 판을 가리킨다 (불변식 3)'))
        first = min(ps, key=lambda p: p['created_at'])
        if any(p['level_chosen_by'] == 'DEFAULT' and p is not first for p in ps):
            errs.append(('PLAN_DEFAULT', '첫 plan 이 아닌데 DEFAULT 다 (불변식 7)'))
    # 읽기 사건 (불변식 8 ~ 11)
    by_r = defaultdict(list)
    for e in L['events']:
        by_r[e['reading_id']].append(e)
    for rid, evs in by_r.items():
        evs.sort(key=lambda e: e['seq'])
        if [e['seq'] for e in evs] != list(range(len(evs))):
            errs.append(('EVENT_SEQ', 'seq 가 0부터 1씩이 아니다 (불변식 8)'))
        cur, expect_enter = None, False
        for n, e in enumerate(evs):
            p = plans.get(e['plan_id'])
            if e['type'] not in enums['event_type']:
                errs.append(('EVENT_TYPE', f'seq {e["seq"]} type "{e["type"]}" — 계약에 없는 사건 (불변식 11)'))
                continue
            if not p or p['reading_id'] != rid or (p['user_id'], p['session_id']) != (e['user_id'], e['session_id']):
                errs.append(('EVENT_PLAN', f'seq {e["seq"]} 의 plan 이 그 열람 · 독자 · 세션의 것이 아니다 (불변식 8)'))
                continue
            if cur is None:
                cur = e['plan_id']
            if expect_enter and (e['type'] != 'SLIDE_ENTERED' or e['plan_id'] != cur):
                errs.append(('EVENT_SWITCH', f'seq {e["seq"]} — 전환 바로 다음은 새 plan 의 SLIDE_ENTERED 다 (불변식 10)'))
            expect_enter = False
            if e['type'] == 'SLIDE_ENTERED':
                if e['from_plan_id'] is not None or e['slide_index'] is None \
                        or not 0 <= e['slide_index'] < pkg['levels'].get(p['level'], 0):
                    errs.append(('EVENT_SLIDE', f'seq {e["seq"]} slide_index {e["slide_index"]} — 그 레벨의 범위 밖 (불변식 9)'))
                if e['plan_id'] != cur:
                    errs.append(('EVENT_CURRENT_PLAN', f'seq {e["seq"]} — 지금 plan 이 아닌 plan 의 사건이다 (불변식 9)'))
            elif e['type'] == 'LEVEL_SWITCHED':
                frm = plans.get(e['from_plan_id'])
                if e['slide_index'] is not None or not frm or e['from_plan_id'] != cur or frm['reading_id'] != rid \
                        or frm['level'] == p['level']:
                    errs.append(('EVENT_SWITCH', f'seq {e["seq"]} — 지금 plan 에서 같은 열람의 다른 레벨 plan 으로 (불변식 10)'))
                cur, expect_enter = e['plan_id'], True
            elif e['type'] == 'CLOSED' and n != len(evs) - 1:
                errs.append(('EVENT_CLOSED', f'seq {e["seq"]} — CLOSED 뒤에 사건이 있다 (불변식 11)'))
        if expect_enter:
            errs.append(('EVENT_SWITCH', '전환 뒤에 SLIDE_ENTERED 가 없다 (불변식 10)'))
    # probe (불변식 12 ~ 14)
    probes = {(p['probe_id'], p['version']): p for p in L['probes']}
    exps = {x['exposure_id']: x for x in L['exposures']}
    for x in L['exposures']:
        if (x['probe_id'], x['probe_version']) not in probes:
            errs.append(('EXPOSURE_PROBE', '노출이 없는 물음 판을 가리킨다 (불변식 12)'))
        if x['position'] not in enums['position'] or x['probe_type'] not in enums['probe_type']:
            errs.append(('EXPOSURE_ENUM', f'노출의 position · probe_type 값 ({x["position"]} · {x["probe_type"]})'))
        if x['plan_id'] is not None:
            p = plans.get(x['plan_id'])
            if not p or (p['user_id'], p['session_id']) != (x['user_id'], x['session_id']):
                errs.append(('EXPOSURE_PLAN', '노출의 plan 이 그 독자 · 세션의 것이 아니다 (불변식 12)'))
            elif any(i['probe_id'] == x['probe_id'] and i['probe_version'] == x['probe_version']
                     and (i['probe_type'], i['position']) != (x['probe_type'], x['position']) for i in p['probe_plan']):
                errs.append(('EXPOSURE_PLAN', '노출의 유형 · 위치가 계획과 다르다 (불변식 12)'))
    resp, per_exp = {}, Counter()
    for r in L['responses']:
        x = exps.get(r['exposure_id'])
        per_exp[r['exposure_id']] += 1
        resp[r['interaction_id']] = r
        if not x or x['user_id'] != r['user_id'] or r['responded_at'] < x['shown_at']:
            errs.append(('RESPONSE_EXPOSURE', '응답이 가리키는 노출이 없거나, 독자가 다르거나, 보여주기 전에 답했다 (불변식 13)'))
    if any(n > 1 for n in per_exp.values()):
        errs.append(('RESPONSE_TWICE', '노출 하나에 응답이 둘이다 (불변식 13)'))
    # 증거 (불변식 15 ~ 19)
    rows_by_inter = defaultdict(list)
    for v in L['evidence']:
        c = concepts.get(v['concept_id'])
        if v['evidence_type'] not in enums['evidence_type']:
            errs.append(('EVIDENCE_TYPE', f'evidence_type "{v["evidence_type"]}"'))
            continue
        if not c or not c['leaf'] or c['status'] == 'MERGED':
            errs.append(('EVIDENCE_CONCEPT', '증거가 leaf 가 아니거나 MERGED 인 개념을 가리킨다 (불변식 18)'))
            continue
        if not 1 <= v['content_version'] <= c['version']:
            errs.append(('EVIDENCE_VERSION', f'{c["code"]} 에 버전 {v["content_version"]} 이 없다 (불변식 18)'))
        ctx = v['exposure_context']
        if ctx['plan_id'] is not None:
            p = plans.get(ctx['plan_id'])
            if not p or (p['user_id'], p['session_id'], p['reading_id'], p['article_id'], p['article_version']) != \
                    (v['user_id'], ctx['session_id'], ctx['reading_id'], v['article_id'], v['article_version']):
                errs.append(('EVIDENCE_CONTEXT', '증거의 독자 · 세션 · 열람 · 판이 plan 과 다르다 (불변식 19)'))
        elif v['article_id'] is not None or v['article_version'] is not None or v['content_block_id'] is not None:
            errs.append(('EVIDENCE_CONTEXT', 'plan 이 없는데 기사 판 · 자리를 적었다 (불변식 19)'))
        if v['evidence_type'] == 'PROBE_RESPONSE':
            r = resp.get(v['interaction_id'])
            x = exps.get(r['exposure_id']) if r else None
            if not r:
                errs.append(('EVIDENCE_NO_RESPONSE', '응답 없는 증거 — 무응답은 증거가 아니다 (불변식 15)'))
            elif v['probe_id'] != x['probe_id'] or v['position'] != x['position'] or v['user_id'] != r['user_id']:
                errs.append(('EVIDENCE_PROBE', '증거의 물음 · 위치 · 독자가 그 응답의 노출과 다르다 (불변식 15)'))
            else:
                rows_by_inter[v['interaction_id']].append((v['concept_id'], v['content_version']))
        elif v['probe_id'] is not None:
            errs.append(('EVIDENCE_PROBE', 'SELF_REPORT_KNOWN 인데 probe_id 가 있다 (불변식 17)'))
    for iid, r in resp.items():
        x = exps.get(r['exposure_id'])
        pr = probes.get((x['probe_id'], x['probe_version'])) if x else None
        if pr and sorted(rows_by_inter.get(iid, [])) != sorted((t['concept_id'], t['version']) for t in pr['targets']):
            errs.append(('EVIDENCE_TARGETS', '응답의 증거 줄이 그 물음의 targets 와 하나씩 맞지 않는다 (불변식 16)'))
    return errs


def enums_from(text):
    types, al = VC.ts_types(text), aliases(text)
    e = lambda t, f: enum_of(types, al, t, f)
    return types, {
        'position': e('ProbeExposure', 'position'), 'probe_type': e('ProbeExposure', 'probe_type'),
        'decision': e('BlockDecision', 'decision'), 'event_type': e('ReadingEvent', 'type'),
        'evidence_type': e('KnowledgeEvidence', 'evidence_type'), 'gate': e('CorrectionEntry', 'gate'),
        'error_type': e('CorrectionEntry', 'error_type'), 'caught_by': e('CorrectionEntry', 'caught_by'),
        'target_kind': e('CorrectionTarget', 'kind'), 'replacement_kind': e('Replacement', 'kind'),
    }


def run(contract_text, log_text, csv_text, gold, library_text, others_text, devcontent_text):
    lib = VC.parse_library(library_text)
    types, enums = enums_from(contract_text)
    errs = check_contract(contract_text, others_text, devcontent_text, csv_text, gold, lib)
    errs += check_log(log_text)
    header, rows = read_csv(csv_text)
    errs += check_csv(header, rows, enums)
    entries = migrate_csv(rows) if header == CSV_HEADER else []
    errs += check_corrections(entries, types, enums)
    ledger = build_ledger(gold, lib)
    errs += check_ledger(ledger, types, enums)
    s = reading_summary(ledger, ledger['plans'][0]['reading_id'])
    # 입문 4장에서 숙련으로 바꿨다가 돌아온 독자 — 전환이 이탈로 읽히지 않는다 (§5.3)
    if not (s['completed'] and s['stopped_at'] == ('basic', 3) and s['switched_from'] == ['basic', 'advanced']):
        errs.append(('SUMMARY', f'시험 열람의 계산이 기대와 다르다: {s}'))
    return errs, entries, ledger, s


def main():
    read = lambda p: open(p, encoding='utf-8').read()
    errs, entries, ledger, s = run(read(CONTRACT), read(LOG) if os.path.exists(LOG) else '', read(CSV_PATH),
                                   json.load(open(GOLDEN, encoding='utf-8')), read(LIBRARY),
                                   [read(p) for p in OTHERS], read(DEVCONTENT))
    types = VC.ts_types(read(CONTRACT))
    print('verify-observation')
    print(f'  계약   docs/contract/OBSERVATION.md — 타입 {len(types)} · 칸 {sum(len(f) for f in types.values())}')
    print(f'  실물   correction-log.csv {len(entries)}행 → CorrectionEntry — '
          f'gate {dict(Counter(str(e["gate"]) for e in entries))} · caught_by {dict(Counter(e["caught_by"] for e in entries))}')
    print(f'         target {dict(Counter(t["kind"] for e in entries for t in e["targets"]))} · '
          f'Replacement {sum(len(e["replacements"]) for e in entries)} · type_note {sum(1 for e in entries if e["type_note"])} · '
          f'time_spent_min 적힌 행 {sum(1 for e in entries if e["time_spent_min"] is not None)}')
    code = {c: v['code'] for c, v in ledger['concepts'].items()}
    for lid, d in ledger['package']['decisions'].items():
        print(f'  골든   {lid} block_decisions — ' + ' · '.join(f'{code[c]}@{v} {dec}' for c, (dec, v) in d.items()))
    print(f'  시험 원장 (가짜 독자 1) — plan {len(ledger["plans"])} · 읽기 사건 {len(ledger["events"])} · 물음 {len(ledger["probes"])} · '
          f'노출 {len(ledger["exposures"])} · 응답 {len(ledger["responses"])} · 증거 {len(ledger["evidence"])}')
    print(f'         계산 — 완독 {s["completed"]} · 멈춘 장 {s["stopped_at"]} · 가장 멀리 {s["furthest"]} · 전환으로 떠난 레벨 {s["switched_from"]}')
    if '--report' in sys.argv:
        print('\ncorrection-log.csv → CorrectionEntry (초안 대응 — 0.2m 에서 사람이 확인한다)')
        for i, e in enumerate(entries, 1):
            tg = ' + '.join(f'{t["kind"]} {t["code"]} [{t["where"]}]' for t in e['targets'])
            rp = ' · '.join(f'v{r["old_version"]}→v{r["new_version"]}' for r in e['replacements']) or '—'
            print(f'  {i:>2} {e["date"]} {e["error_type"]} | gate {e["gate"]} · occasion "{e["occasion"]}" · stage {e["stage"]}')
            print(f'     target {tg} | caught_by {e["caught_by"]}' + (f' ({e["check"]})' if e['check'] else '')
                  + f' | 대신 {rp} | type_note {"있음" if e["type_note"] else "—"}')
    print()
    for c, msg in errs:
        print(f'FAIL {c}: {msg}')
    print('OK' if not errs else f'{len(errs)}개 실패')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
