#!/usr/bin/env python3
"""CONCEPT_IDENTITY.md 를 기계로 확인한다 (B-0.2a).

    python3 scripts/verify-concept-identity.py            # 검사
    python3 scripts/verify-concept-identity.py --report   # + 라이브러리 → 계약 이전 목록 · 골든 문안 대조

네 곳을 본다.
  D. 저장소      docs/content/concept-library.json 이 계약 모양(§1)이고 md 와 같은 것을 말한다 — 키(UUID · code · 이름) ·
                 지금 버전의 문안 한 벌 · 독자 글은 md 와 **글자 단위로** 같다 · alias · 충돌 별칭 · 관계(한 쌍 한 번)
  A. 계약 문서   §9.5 확정 필드 · enum 이 다 있다. §9.6 보류 항목이 없다. 실물 없는 구조(merge · split ·
                 PROVISIONAL · Resolver · Topic) 절에 "실물 없음". 0.2b · 0.2c 타입을 정의하지 않았다.
                 0.2a 로그 머리 요약에 질문 8개가 [계약 반영 / _open / 미확인] 과 근거를 갖는다
  B. 라이브러리  계약 불변식 중 지금 라이브러리 md 에서 확인할 수 있는 것 — §13 의 2 · 3 · 4 · 5 · 7 · 8 · 9 · 10
  C. 골든        concept span refs 가 라이브러리에 있다(12) · 라이브러리 문안을 옮긴 span 은 concept 층이고
                 그 개념을 그 part 로 refs 에 갖는다(14) · 브리지 슬롯 순서(13)
                 refs 는 ConceptRef {concept_id, version, part} 다 — 순서 검사는 part 로 (D25). part null 은 게이트 3.
                 옛 모양 "C-XXXX" 는 골든을 옮긴 뒤(0.2m-a)로 실패다

exit 0 OK (WARN 은 있을 수 있다) · 1 FAIL
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/CONCEPT_IDENTITY.md')
LIBRARY = os.path.join(ROOT, 'docs/content/concept-library.md')
STORE = os.path.join(ROOT, 'docs/content/concept-library.json')      # 계약 모양 저장소 (0.2m-a) — concept_id(UUID) 는 여기에만
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
LOG = os.path.join(ROOT, 'logs/backend/phase-0-step-0-2a.md')

# ── A. 계약 문서 ─────────────────────────────────────────────────────────────
# FINDINGS §9.5 스키마 (확정) + ConceptRef (§4.3 확정: 발행 당시 버전 pin)
REQUIRED_FIELDS = {
    'Concept': ('concept_id', 'canonical_name', 'concept_type', 'status', 'merged_into', 'version', 'domain'),
    'ConceptAlias': ('alias', 'language', 'concept_id', 'source'),
    'ConflictingAlias': ('alias', 'concept_id', 'conflicts_with_meaning'),
    'ConceptRelation': ('from_id', 'to_id', 'relation_type', 'strength', 'source', 'generator_model',
                        'validation_status'),
    'ConceptCandidate': ('candidate_text', 'embedding', 'candidate_context', 'suggested_concept_id',
                         'match_score', 'status'),
    'ConceptRef': ('concept_id', 'version', 'part'),                   # part — D25 (_open-1 → b)
}
REQUIRED_ENUMS = {
    ('Concept', 'status'): {'CANONICAL', 'PROVISIONAL', 'MERGED', 'DEPRECATED'},
    ('ConceptRelation', 'relation_type'): {'REQUIRED_PREREQUISITE', 'HELPFUL_PREREQUISITE', 'RELATED'},
}
RESOLVER_WORDS = ('HIGH', 'AMBIGUOUS', 'LOW', 'LINK', 'PROVISIONAL', 'CREATE')
# §9.6 보류 · CLAUDE.md "절대 하지 말 것" — 계약에 이 말이 나오면 안 된다
HELD = (r'posterior', r'\bbeta\b', r'half[- ]?life', r'반감기', r'forgetting', r'망각', r'propagat',
        r'\bweight', r'가중치', r'\bprior\b', r'concentration', r'explanation need', r'knowledgeestimator',
        r'\bdecay\b',
        r'(?<![\w.])0\.\d{2,}',                                   # 0.82 같은 수치 (Step 번호 0.2a 등은 한 자리)
        r'(?:HIGH|AMBIGUOUS|LOW|임계|문턱|threshold)[^\n]{0,20}(?<![\w.§])0?\.\d'      # 구간 옆 소수 (§7.2 같은 절 번호는 아님)
        r'|(?<![\w.§])0?\.\d[^\n]{0,20}(?:HIGH|AMBIGUOUS|LOW)')
# 실물 없는 구조 — 제목에 이 말이 들어간 절이 하나 이상 있고, 그런 절마다 "실물 없음"
NO_REAL_TOPICS = ('merge', 'split', 'PROVISIONAL', 'Resolver', 'Topic')
# 0.2b · 0.2c 소관 — 이 계약의 타입 블록에 정의되면 안 된다
FOREIGN_TYPES = ('Fact', 'Claim', 'Bridge', 'Storyline', 'Source', 'Event', 'KnowledgeEvidence',
                 'knowledge_evidence', 'UserConceptState', 'user_concept_state', 'ReadingPlanLog',
                 'reading_plan_log', 'Probe')
MARKS = ('계약 반영', '_open', '미확인')

TYPE_START = re.compile(r'^(\w+)\s*\{')
FIELD_LINE = re.compile(r'^\s+(\w+)\??\s*:\s*([^/]*?)\s*(//.*)?$')


def ts_types(text):
    """```ts 블록에서 {타입: {필드: 타입식}}"""
    out = {}
    for block in re.findall(r'```ts\n(.*?)```', text, re.S):
        cur = None
        for line in block.splitlines():
            one = re.match(r'^(\w+)\s*\{(.*)\}\s*(//.*)?$', line)          # 한 줄 타입 { a: T, b: U }
            if one:
                cur = out.setdefault(one.group(1), {})
                for part in one.group(2).split(','):
                    f = re.match(r'^\s*(\w+)\??\s*:\s*(.+?)\s*$', part)
                    if f:
                        cur[f.group(1)] = f.group(2)
                cur = None
                continue
            m = TYPE_START.match(line)
            if m:
                cur = out.setdefault(m.group(1), {})
                continue
            if line.startswith('}'):
                cur = None
                continue
            f = FIELD_LINE.match(line)
            if cur is not None and f:
                cur[f.group(1)] = f.group(2)
    return out


def sections(text):
    """[(제목, 본문)] — ## · ### 제목 단위. 본문은 같은 층 이상의 다음 제목까지 (## 는 아래 ### 를 품는다)"""
    lines = text.splitlines()
    heads = [(i, len(m.group(1)), m.group(2).strip()) for i, l in enumerate(lines)
             for m in [re.match(r'^(#{2,3}) (.*)$', l)] if m]
    out = []
    for k, (i, lv, h) in enumerate(heads):
        end = next((j for j, lv2, _ in heads[k + 1:] if lv2 <= lv), len(lines))
        out.append((h, '\n'.join(lines[i + 1:end])))
    return out


def check_contract(text):
    errs = []
    types = ts_types(text)
    for t, fields in REQUIRED_FIELDS.items():
        if t not in types:
            errs.append(('CONTRACT_FIELD', f'타입 {t} 가 계약 타입 블록에 없다'))
            continue
        for f in fields:
            if f not in types[t]:
                src = {'ConceptRef': '§4.3 확정 · D25'}.get(t, 'FINDINGS §9.5 확정')
                errs.append(('CONTRACT_FIELD', f'{t}.{f} 가 없다 ({src})'))
    for (t, f), want in REQUIRED_ENUMS.items():
        got = set(re.findall(r'"([A-Z_]+)"', types.get(t, {}).get(f, '')))
        if got != want:
            errs.append(('CONTRACT_ENUM', f'{t}.{f} 값 {sorted(got)} ≠ 확정 {sorted(want)}'))
    for t in types:
        if t in FOREIGN_TYPES:
            errs.append(('CONTRACT_FOREIGN_TYPE', f'{t} 를 정의했다 — 0.2b · 0.2c 소관'))
    for pat in HELD:
        for m in re.finditer(pat, text, re.I):
            line = text[:m.start()].count('\n') + 1
            errs.append(('CONTRACT_HELD_TERM', f'L{line} "{m.group()}" — §9.6 보류 항목은 넣지 않는다'))
    secs = sections(text)
    for topic in NO_REAL_TOPICS:
        hit = [(h, b) for h, b in secs if topic.lower() in h.lower()]
        if not hit:
            errs.append(('CONTRACT_NO_REAL', f'"{topic}" 절이 없다'))
        for h, b in hit:
            if '실물 없음' not in h + b:
                errs.append(('CONTRACT_NO_REAL', f'"{h}" 절에 "실물 없음" 표시가 없다 (D24)'))
    res = [b for h, b in secs if 'Resolver' in h]
    for w in RESOLVER_WORDS:
        if not any(w in b for b in res):
            errs.append(('CONTRACT_RESOLVER', f'Resolver 절에 {w} 가 없다 (§9.5 3구간)'))
    if not re.search(r'^\| 20\d\d-\d\d-\d\d \| .+ \| B-0\.2a', text, re.M):
        errs.append(('CONTRACT_CHANGELOG', 'CHANGELOG 에 B-0.2a 행이 없다'))
    return errs


def check_log(text):
    """로그 머리 요약 — 질문 1~8 행마다 표시 하나 이상 + 근거"""
    errs = []
    rows = {}
    for i, line in enumerate(text.splitlines()[:80]):
        m = re.match(r'^\|\s*([1-8])\s*\|(.*)\|\s*$', line)
        if m and m.group(1) not in rows:
            rows[m.group(1)] = m.group(2)
    for q in '12345678':
        if q not in rows:
            errs.append(('LOG_QUESTION', f'질문 {q} 행이 로그 머리(80줄 안)에 없다'))
            continue
        cells = [c.strip() for c in rows[q].split('|')]
        if not any(mk in c for c in cells for mk in MARKS):
            errs.append(('LOG_QUESTION', f'질문 {q}: [계약 반영 / _open / 미확인] 표시가 없다'))
        if not re.search(r'§\d|D\d\d|concept-library|fixtures|git|correction-log|C-1', rows[q]):
            errs.append(('LOG_QUESTION', f'질문 {q}: 근거(실물 또는 FINDINGS 절)가 없다'))
    return errs


# ── B. 라이브러리 ────────────────────────────────────────────────────────────
CONCEPT_H = re.compile(r'^### (\S+) · `([^`]+)`')
DOMAIN_H = re.compile(r'^## 도메인: .*`(\w+)`')
META = re.compile(r'^- `(\w+)`: (.*)$')
PROP = re.compile(r'^\*\*명제\*\*: (.*)$')
FIELD_H = re.compile(r'^\*\*([A-Z]+)\*\*(.*)$')
CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩'
NOTE_MARKS = ('⚠️', '🚨', '🔗')
STATUS = REQUIRED_ENUMS[('Concept', 'status')]


def clean(line):
    return line.lstrip('>').strip().replace('**', '')


def parse_library(text):
    """-> {'concepts': [dict], 'changelog': {(code, n): date}, 'created': {code: event}}"""
    lines = text.splitlines()
    concepts, domain, cur = [], None, None
    field, blocks_since = None, 0
    i = 0
    while i < len(lines):
        line = lines[i]
        d = DOMAIN_H.match(line)
        if d:
            domain, cur = d.group(1), None
        m = CONCEPT_H.match(line)
        if m:
            cur = {'code': m.group(1), 'name': m.group(2), 'domain': domain, 'line': i + 1, 'meta': {},
                   'prop': None, 'fields': {}, 'notes': []}
            concepts.append(cur)
            field = None
            i += 1
            continue
        if cur is None:
            i += 1
            continue
        if line.startswith('## ') or line.strip() == '---':
            cur = None
            i += 1
            continue
        mm = META.match(line)
        if mm:
            cur['meta'][mm.group(1)] = mm.group(2).strip()
        p = PROP.match(line)
        if p:
            cur['prop'] = p.group(1).strip()
        f = FIELD_H.match(line)
        if f:
            field = f.group(1)
            cur['fields'][field] = {'head': f.group(2).strip(), 'body': None}
            blocks_since = 0
        if line.startswith('>'):
            block = []
            while i < len(lines) and lines[i].startswith('>'):
                block.append(clean(lines[i]))
                i += 1
            body = [b for b in block if b]
            # 필드 머리 다음 첫 인용 블록이 본문이다. 단 메모 표시(⚠️ · 🚨 · 🔗)로 시작하면 본문이 아니라 메모다 —
            # 본문이 빠진 개념에서 운영 노트를 본문으로 읽지 않는다 (0.2m-a: C-0009 REFRESHER 를 지워도 통과하던 구멍)
            if field and blocks_since == 0 and not (body and body[0].startswith(NOTE_MARKS)):
                cur['fields'][field]['body'] = body
            elif body:
                cur['notes'].append({'field': field, 'lines': body})
            blocks_since += 1
            continue
        i += 1

    changelog = {}
    for line in lines:
        m = re.match(r'^- (\d{4}-\d{2}-\d{2}) · (.*)$', line)
        if m:
            for code, n in re.findall(r'(C-\d+) v(\d+)', m.group(2)):
                changelog[(code, int(n))] = m.group(1)

    created = {}      # 재사용 추적 표 "신규 생성" 칸의 범위
    for m in re.finditer(r'^\| (\S+-\d+) \|.*?\| (C-\d+)~(\d+) \|', text, re.M):
        lo, hi = int(m.group(2)[2:]), int(m.group(3))
        for n in range(lo, hi + 1):
            created[f'C-{n:04d}'] = m.group(1)

    for c in concepts:
        c['full'] = full_steps(c)
        c['aliases'] = split_aliases(c['meta'].get('aliases', ''))
        c['slots'] = bridge_slots(c)
        c['analogy'] = analogy(c)
        # 🚨 용어 충돌 경고 안에서 "… 의미로 쓰인다" 줄의 `이름` 만 (경고 본문의 `conflicting_alias` 같은 필드 이름은 뺀다)
        c['conflict_terms'] = [t for n in c['notes'] if n['lines'][0].startswith('🚨') and '충돌' in n['lines'][0]
                               for l in n['lines'] if '의미' in l for t in re.findall(r'`([^`]+)`', l)]
        vm = re.match(r'^v(\d+) \((\d{4}-\d{2}-\d{2})\)$', c['meta'].get('version', ''))
        c['version'], c['version_date'] = (int(vm.group(1)), vm.group(2)) if vm else (None, None)
    return {'concepts': concepts, 'changelog': changelog, 'created': created}


def full_steps(c):
    """FULL 본문 → [(label | None, title | None, [줄])]"""
    body = (c['fields'].get('FULL') or {}).get('body') or []
    steps = []
    for line in body:
        m = re.match(rf'^([{CIRCLED}])\s*(.*)$', line)
        if m:
            steps.append((m.group(1), m.group(2) or None, []))
        elif steps:
            steps[-1][2].append(line)
        else:
            steps.append((None, None, [line]))
    return steps


def split_aliases(s):
    out = []
    for a in (x.strip() for x in s.split(',') if x.strip()):
        m = re.match(r'^(.*?)\((.*)\)$', a)
        out.append((m.group(1).strip(), m.group(2).strip()) if m else (a, None))
    return out


def bridge_slots(c):
    out = []
    for n in c['notes']:
        if n['lines'][0].startswith('🔗'):
            lab = re.search(rf'[{CIRCLED}]', n['lines'][0])
            aft = re.search(rf'([{CIRCLED}])\s*바로 다음', ' '.join(n['lines']))
            out.append({'label': lab.group() if lab else None, 'after': aft.group(1) if aft else None,
                        'text': ' '.join(n['lines'])})
    return out


def analogy(c):
    f = c['fields'].get('ANALOGY')
    if not f:
        return None
    name = re.search(r'`([^`]+)`', f['head'])
    requires, limits = [], []
    for n in c['notes']:
        if n['field'] != 'ANALOGY':
            continue
        first = n['lines'][0]
        if first.startswith('🚨') and '뒤에만' in first:
            requires = re.findall(rf'[{CIRCLED}]', first)
        limits += [l for l in n['lines'] if l.startswith('⚠️') and '비유 한계선' in l]   # 한 블록에 여러 줄일 수 있다
    return {'name': name.group(1) if name else None, 'body': f['body'] or [], 'requires': requires,
            'limits': limits, 'conditional': '조건부' in f['head']}


def raw_library(text):
    """md 의 독자 글을 **글자 그대로** 꺼낸다 (굵게 표시 `**` · 줄바꿈 포함) → {code: {...}}

    parse_library 는 대조하기 좋게 `**` 를 뗀다. 이 함수는 떼지 않는다 — 저장소(JSON)와 글자 단위로 대려는 것이다.
      prop       명제 한 줄
      FULL       [(label | None, title | None, text)] — 단계 안의 줄은 \n 으로 잇는다
      REFRESHER  text
      ANALOGY    (name, text)
      BOUNDARY   [줄]
    """
    out, cur, field, taken = {}, None, None, False
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = CONCEPT_H.match(line)
        if m:
            cur = out.setdefault(m.group(1), {})
            field = None
        elif cur is not None and (line.startswith('## ') or line.strip() == '---'):
            cur = None
        elif cur is not None:
            p = PROP.match(line)
            if p:
                cur['prop'] = p.group(1).strip()
            f = FIELD_H.match(line)
            if f:
                field, taken = f.group(1), False
                cur['_head_' + field] = f.group(2).strip()
            if line.startswith('>'):
                block = []
                while i < len(lines) and lines[i].startswith('>'):
                    block.append(re.sub(r'^> ?', '', lines[i]))
                    i += 1
                first = next((b for b in block if b.strip()), '')
                if field and not taken and not first.replace('**', '').startswith(NOTE_MARKS):
                    taken = True
                    if field == 'FULL':
                        steps = []
                        for b in block:
                            h = re.match(rf'^\*\*([{CIRCLED}])\s*(.*?)\*\*$', b)
                            if h:
                                steps.append([h.group(1), h.group(2) or None, []])
                            elif b.strip() == '':
                                continue
                            elif steps:
                                steps[-1][2].append(b)
                            else:
                                steps.append([None, None, [b]])
                        cur['FULL'] = [(a, t, '\n'.join(ls)) for a, t, ls in steps]
                    elif field == 'BOUNDARY':
                        cur['BOUNDARY'] = [b for b in block if b.strip()]
                    elif field == 'ANALOGY':
                        name = re.search(r'`([^`]+)`', cur['_head_ANALOGY'])
                        cur['ANALOGY'] = (name.group(1) if name else None, '\n'.join(b for b in block if b.strip()))
                    else:
                        cur[field] = '\n'.join(b for b in block if b.strip())
                continue
        i += 1
    return out


BOUNDARY_ARROW = {True: ' → 해당', False: ' → 해당 없음'}


def reader_texts_md(text):
    """{(code, part): 글} — md 에서. part 이름은 계약 §3.3 (+ 'PROPOSITION')"""
    out = {}
    for code, c in raw_library(text).items():
        out[(code, 'PROPOSITION')] = c.get('prop')
        for label, _, body in c.get('FULL', []):
            out[(code, f'FULL:{label}' if label else 'FULL')] = body
        if 'REFRESHER' in c:
            out[(code, 'REFRESHER')] = c['REFRESHER']
        if 'ANALOGY' in c:
            out[(code, f'ANALOGY:{c["ANALOGY"][0]}')] = c['ANALOGY'][1]
        if 'BOUNDARY' in c:
            out[(code, 'BOUNDARY')] = '\n'.join(c['BOUNDARY'])
    return out


def reader_texts_store(store):
    """{(code, part): 글} — 저장소(JSON)의 **지금 버전**에서. reader_texts_md 와 같은 키"""
    code = {c['concept_id']: c['code'] for c in store['concepts']}
    cur = {c['concept_id']: c['version'] for c in store['concepts']}
    out = {}
    for v in store['versions']:
        if cur.get(v['concept_id']) != v['version']:
            continue
        k = code[v['concept_id']]
        out[(k, 'PROPOSITION')] = v['proposition']
        for st in v['full']:
            out[(k, f'FULL:{st["label"]}' if st['label'] else 'FULL')] = st['text']
        out[(k, 'REFRESHER')] = v['refresher']
        for a in v['analogies']:
            out[(k, f'ANALOGY:{a["name"]}')] = a['text']
        if v['boundary']:
            out[(k, 'BOUNDARY')] = '\n'.join(b['case'] + BOUNDARY_ARROW[b['applies']] for b in v['boundary'])
    return out


def norm_alias(s):
    return re.sub(r'\s+', '', s).lower()


def relations(lib):
    """라이브러리 prereq · prereq_of → {(from, to): [적힌 곳]}. from 이 to 의 선행"""
    edges = {}
    for c in lib['concepts']:
        for k in ('prereq', 'prereq_of'):
            for t in re.findall(r'C-\d+', c['meta'].get(k, '')):
                e = (t, c['code']) if k == 'prereq' else (c['code'], t)
                edges.setdefault(e, []).append(f"{c['code']}.{k}")
    return edges


def check_library(lib):
    errs, warns = [], []
    codes = [c['code'] for c in lib['concepts']]
    known = set(codes)
    for c in lib['concepts']:
        cid = c['code']
        if not re.match(r'^C-\d{4,}$', cid):
            errs.append(('LIB_CODE', f'{cid}: code 형식이 C- + 숫자 4자리 이상이 아니다 (§13-2)'))
        if not re.match(r'^[A-Z][A-Z0-9_]*$', c['name']):
            errs.append(('LIB_CODE', f'{cid}: canonical_name "{c["name"]}" 형식'))
        st = c['meta'].get('status')
        if st not in STATUS:
            errs.append(('LIB_STATUS', f'{cid}: status "{st}" 는 네 값 밖 (§13-4)'))
        for what, ok in (('명제', c['prop']), ('FULL', c['full']),
                         ('REFRESHER', (c['fields'].get('REFRESHER') or {}).get('body')),
                         ('type', c['meta'].get('type')), ('domain', c['domain'])):
            if not ok:
                errs.append(('LIB_MISSING', f'{cid}: {what} 가 없다 (§13-7)'))
        if c['version'] is None:
            errs.append(('LIB_VERSION', f'{cid}: version "{c["meta"].get("version")}" 을 읽을 수 없다'))
        else:
            for n in range(2, c['version'] + 1):
                if (cid, n) not in lib['changelog']:
                    errs.append(('LIB_VERSION', f'{cid}: v{n} 이 CHANGELOG 에 없다 — 버전 이력이 빠졌다 (§13-5)'))
            if c['version'] > 1 and lib['changelog'].get((cid, c['version'])) not in (None, c['version_date']):
                errs.append(('LIB_VERSION', f'{cid}: v{c["version"]} 날짜 {c["version_date"]} ≠ CHANGELOG '
                                            f'{lib["changelog"][(cid, c["version"])]}'))
        labels = {s[0] for s in c['full'] if s[0]}
        for s in c['slots']:
            if not s['after'] or s['after'] not in labels:
                errs.append(('LIB_BRIDGE_SLOT', f'{cid}: 브리지 슬롯 {s["label"]} 의 after "{s["after"]}" 가 '
                                                f'FULL 단계 {sorted(labels)} 에 없다 (§13-8)'))
            if not s['label'] or s['label'] in labels:
                errs.append(('LIB_BRIDGE_SLOT', f'{cid}: 브리지 슬롯 label "{s["label"]}" 이 없거나 FULL 단계와 겹친다'))
        if c['analogy']:
            slots = {s['label'] for s in c['slots']}
            for r in c['analogy']['requires']:
                if r not in labels | slots:
                    errs.append(('LIB_ANALOGY_REQUIRES', f'{cid}: 비유 "{c["analogy"]["name"]}" 가 {r} 뒤에만 쓰인다는데 '
                                                         f'{r} 는 FULL 단계도 브리지 슬롯도 아니다 (§13-8)'))
        own = {norm_alias(a) for a, _ in c['aliases']}
        for t in c['conflict_terms']:
            if norm_alias(t) not in own:
                errs.append(('LIB_CONFLICT_ALIAS', f'{cid}: 충돌 별칭 "{t}" 가 이 개념의 alias 에 없다 (§13-9)'))
    for dup in sorted({x for x in codes if codes.count(x) > 1}):
        errs.append(('LIB_DUP', f'code {dup} 가 두 번 이상 (§13-2)'))
    names = [c['name'] for c in lib['concepts']]
    for dup in sorted({x for x in names if names.count(x) > 1}):
        errs.append(('LIB_DUP', f'canonical_name {dup} 가 두 번 이상 (§13-3)'))

    # 이름 겹침 — 같은 이름이 두 개념 이상의 alias(또는 다른 개념의 canonical_name · code)
    owners = {}
    for c in lib['concepts']:
        for a, _ in c['aliases']:
            owners.setdefault(norm_alias(a), set()).add(c['code'])
    for c in lib['concepts']:
        for n in (c['name'], c['code']):
            if norm_alias(n) in owners:
                owners[norm_alias(n)] = owners[norm_alias(n)] | {c['code']}
    declared = {(c['code'], norm_alias(t)) for c in lib['concepts'] for t in c['conflict_terms']}
    for a, who in sorted(owners.items()):
        if len(who) > 1:
            missing = [w for w in sorted(who) if (w, a) not in declared]
            if missing:
                errs.append(('LIB_ALIAS_COLLISION', f'이름 "{a}" 가 {sorted(who)} 에 겹치는데 {missing} 에 충돌 별칭 '
                                                    f'표시가 없다 (§13-9)'))

    edges = relations(lib)
    for (a, b), where in sorted(edges.items()):
        for x in (a, b):
            if x not in known:
                errs.append(('LIB_RELATION_TARGET', f'{"/".join(where)}: {x} 가 라이브러리에 없다 (§13-10)'))
        if len(where) == 1 and a in known and b in known:
            other = f'{b}.prereq' if where[0].endswith('prereq_of') else f'{a}.prereq_of'
            warns.append(('LIB_RELATION_ONE_SIDE', f'{a}→{b} 는 {where[0]} 에만 있고 {other} 에는 없다 — '
                                                   f'양쪽에 적는 구조가 이미 어긋났다 (§9: 한 번만 적는다)'))
    graph = {}
    for a, b in edges:
        graph.setdefault(a, set()).add(b)
    for cyc in cycles(graph):
        errs.append(('LIB_RELATION_CYCLE', f'선행 관계 순환 {" → ".join(cyc)} (§13-10)'))

    for c in lib['concepts']:
        ev = lib['created'].get(c['code'])
        used = c['meta'].get('used_in')
        if ev and (not used or ev not in used):
            warns.append(('LIB_USED_IN_DRIFT', f'{c["code"]}: 재사용 표는 {ev} 에서 생성이라는데 used_in 은 '
                                               f'{used or "없음"} — 저장하지 않고 계산한다 (§12)'))
    return errs, warns


def cycles(graph):
    seen, out = set(), []

    def dfs(n, path):
        if n in path:
            out.append(path[path.index(n):] + [n])
            return
        if n in seen:
            return
        seen.add(n)
        for m in sorted(graph.get(n, ())):
            dfs(m, path + [n])
    for n in sorted(graph):
        dfs(n, [])
    return out


# ── D. 저장소 (concept-library.json) ─────────────────────────────────────────
UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
STORE_TYPES = {'concepts': 'Concept', 'versions': 'ConceptVersion', 'aliases': 'ConceptAlias',
               'conflicting_aliases': 'ConflictingAlias', 'relations': 'ConceptRelation'}
NESTED_TYPES = {'full': 'FullStep', 'analogies': 'Analogy', 'boundary': 'BoundaryLine', 'bridge_slots': 'BridgeSlot'}
PREREQ = ('REQUIRED_PREREQUISITE', 'HELPFUL_PREREQUISITE')


def id_map_of(store):
    return {c['concept_id']: c['code'] for c in store['concepts']}


def check_store(store, lib, library_text, contract_text):
    """저장소가 계약 모양이고(§1), md 와 같은 것을 말하는가. md 는 사람이 읽고 쓰는 면, 저장소는 기계가 푸는 면이다.

    독자 글(명제 · FULL · REFRESHER · ANALOGY · BOUNDARY)은 **글자 단위로** 같아야 한다 — md 를 고치고 저장소에
    새 버전을 안 만들면 여기서 실패한다 (§3.1 — 한 번 만든 버전은 고치지 않는다)."""
    errs, warns = [], []
    E = lambda c, m: errs.append((c, m))
    types = ts_types(contract_text)
    # 모양 — 계약 타입 블록의 필드 그대로 (`_` 는 픽스처 주석)
    def shape(o, t, w):
        want, got = set(types.get(t, {})), {k for k in o if not k.startswith('_')}
        if want != got:
            E('STORE_SHAPE', f'{w}: {t} 필드가 계약과 다르다 — 없음 {sorted(want - got)} · 남음 {sorted(got - want)} (§1)')
    for key, t in STORE_TYPES.items():
        if not isinstance(store.get(key), list):
            E('STORE_SHAPE', f'{key} 가 없다')
            return errs, warns
        for i, o in enumerate(store[key]):
            shape(o, t, f'{key}[{i}]')
    for i, v in enumerate(store['versions']):
        for k, t in NESTED_TYPES.items():
            for j, o in enumerate(v.get(k) or []):
                shape(o, t, f'versions[{i}].{k}[{j}]')
        if isinstance(v.get('authoring'), dict):
            shape(v['authoring'], 'Authoring', f'versions[{i}].authoring')
    if errs:
        return errs, warns
    if 'used_in' in json.dumps(store, ensure_ascii=False):
        E('STORE_USED_IN', 'used_in 이 저장소에 있다 — 저장하지 않고 발행 패키지에서 계산한다 (§13-15)')
    # 1 · 2 · 3 — 키
    cs = store['concepts']
    ids, codes, names = [c['concept_id'] for c in cs], [c['code'] for c in cs], [c['canonical_name'] for c in cs]
    for c in cs:
        if not isinstance(c['concept_id'], str) or not UUID_RE.match(c['concept_id']):
            E('STORE_KEY', f'{c["code"]}: concept_id {c["concept_id"]!r} 가 UUID 가 아니다 (§13-1)')
        if not re.match(r'^C-\d{4,}$', str(c['code'])):
            E('STORE_KEY', f'code {c["code"]!r} 형식 (§13-2)')
        if c['status'] not in STATUS:
            E('STORE_STATUS', f'{c["code"]}: status {c["status"]!r} (§13-4)')
        if (c['status'] == 'MERGED') != (c['merged_into'] is not None):
            E('STORE_STATUS', f'{c["code"]}: merged_into 는 MERGED 일 때만 있다 (§13-4)')
    for what, xs in (('concept_id', ids), ('code', codes), ('canonical_name', names)):
        for d in sorted({x for x in xs if xs.count(x) > 1}):
            E('STORE_KEY', f'{what} {d} 가 두 번 이상 (§13-1~3)')
    if errs:                                             # 키가 깨지면 그 아래(버전 · alias · 관계가 가리키는 것)는 뜻이 없다
        return errs, warns
    code = id_map_of(store)
    # md 와 같은 개념 · 같은 메타
    md = {c['code']: c for c in lib['concepts']}
    if set(codes) != set(md):
        E('STORE_MD_SET', f'개념이 md 와 다르다 — 저장소에만 {sorted(set(codes) - set(md))} · md 에만 {sorted(set(md) - set(codes))}')
    for c in cs:
        m = md.get(c['code'])
        if not m:
            continue
        for k, a, b in (('concept_id', c['concept_id'], m['meta'].get('concept_id')), ('canonical_name', c['canonical_name'], m['name']), ('concept_type', c['concept_type'], m['meta'].get('type')),
                        ('status', c['status'], m['meta'].get('status')), ('domain', c['domain'], m['domain']),
                        ('version', c['version'], m['version'])):
            if a != b:
                E('STORE_MD_META', f'{c["code"]}: {k} 저장소 {a!r} ≠ md {b!r}')
    # 5 · 7 — 버전: 지금 버전의 스냅숏이 정확히 하나, 이력이 1..N
    vs = {}
    for v in store['versions']:
        if v['concept_id'] not in code:
            E('STORE_VERSION', f'버전이 없는 개념 {v["concept_id"]} 을 가리킨다')
            continue
        vs.setdefault(code[v['concept_id']], []).append(v)
    hist = {(h['code'], h['version']) for h in store.get('_version_history', [])}
    for c in cs:
        mine = [v for v in vs.get(c['code'], []) if v['version'] == c['version']]
        if len(mine) != 1:
            E('STORE_VERSION', f'{c["code"]}: 지금 버전 v{c["version"]} 의 문안이 {len(mine)}벌 — 정확히 하나 (§3.1 · §13-5)')
            continue
        v = mine[0]
        if any(x['version'] > c['version'] for x in vs[c['code']]):
            E('STORE_VERSION', f'{c["code"]}: Concept.version 보다 큰 버전이 있다 (§13-5)')
        for k in ('created_on', 'change', 'basis', 'proposition', 'refresher'):
            if not (isinstance(v[k], str) and v[k].strip()):
                E('STORE_VERSION', f'{c["code"]}@{v["version"]}: {k} 가 비었다 (§13-5 · §13-7)')
        if not v['full']:
            E('STORE_VERSION', f'{c["code"]}@{v["version"]}: FULL 단계가 없다 (§13-7)')
        m = md.get(c['code'])
        if m and m['version_date'] and v['created_on'] != m['version_date']:
            E('STORE_VERSION', f'{c["code"]}@{v["version"]}: created_on {v["created_on"]} ≠ md {m["version_date"]}')
        miss = [n for n in range(1, c['version'] + 1) if (c['code'], n) not in hist]
        if miss:
            E('STORE_VERSION', f'{c["code"]}: 버전 이력에 v{miss} 가 없다 — 1부터 빠짐없이 (§13-5)')
        # 8 — 슬롯 · requires
        labels = {st['label'] for st in v['full'] if st['label']}
        slots = {sl['label'] for sl in v['bridge_slots']}
        for sl in v['bridge_slots']:
            if sl['after'] not in labels or sl['label'] in labels:
                E('STORE_SLOT', f'{c["code"]}: 슬롯 {sl["label"]} after {sl["after"]} — FULL 단계 {sorted(labels)} (§13-8)')
        for a in v['analogies']:
            bad = [r for r in a['requires'] if r not in labels | slots]
            if bad:
                E('STORE_SLOT', f'{c["code"]}: 비유 {a["name"]} requires {bad} 가 단계도 슬롯도 아니다 (§13-8)')
        if m:
            if [(sl['label'], sl['after']) for sl in v['bridge_slots']] != [(sl['label'], sl['after']) for sl in m['slots']]:
                E('STORE_MD_META', f'{c["code"]}: 브리지 슬롯이 md 와 다르다')
            want = m['analogy']['requires'] if m['analogy'] else None
            got = v['analogies'][0]['requires'] if v['analogies'] else None
            if want != got:
                E('STORE_MD_META', f'{c["code"]}: 비유 requires 저장소 {got} ≠ md {want}')
    # 독자 글 — 글자 단위
    a, b = reader_texts_md(library_text), reader_texts_store(store)
    for k in sorted(set(a) | set(b)):
        if a.get(k) != b.get(k):
            E('STORE_TEXT', f'{k[0]} {k[1]}: 저장소의 글이 md 와 다르다 — md {a.get(k)!r:.60} / 저장소 {b.get(k)!r:.60}')
    # 9 — alias · 충돌 별칭
    md_al = {(c['code'], x, src) for c in lib['concepts'] for x, src in c['aliases']}
    st_al = set()
    for x in store['aliases']:
        if x['concept_id'] not in code:
            E('STORE_ALIAS', f'alias {x["alias"]!r} 가 없는 개념을 가리킨다')
            continue
        if x['language'] not in ('ko', 'en'):
            E('STORE_ALIAS', f'alias {x["alias"]!r}: language {x["language"]!r}')
        st_al.add((code[x['concept_id']], x['alias']))
    if st_al != {(c, x) for c, x, _ in md_al}:
        d1, d2 = st_al - {(c, x) for c, x, _ in md_al}, {(c, x) for c, x, _ in md_al} - st_al
        E('STORE_ALIAS', f'alias 가 md 와 다르다 — 저장소에만 {sorted(d1)} · md 에만 {sorted(d2)}')
    owners = {}
    for c0, x in st_al:
        owners.setdefault(norm_alias(x), set()).add(c0)
    for c in cs:
        for n in (c['canonical_name'], c['code']):
            if norm_alias(n) in owners:
                owners[norm_alias(n)].add(c['code'])
    declared = {(code.get(x['concept_id']), norm_alias(x['alias'])) for x in store['conflicting_aliases']}
    for x in store['conflicting_aliases']:
        if (code.get(x['concept_id']), x['alias']) not in st_al:
            E('STORE_CONFLICT', f'충돌 별칭 {x["alias"]!r} 가 그 개념의 alias 에 없다 (§13-9)')
    for al, who in sorted(owners.items()):
        miss = [w for w in sorted(who) if (w, al) not in declared]
        if len(who) > 1 and miss:
            E('STORE_CONFLICT', f'이름 "{al}" 가 {sorted(who)} 에 겹치는데 {miss} 에 ConflictingAlias 가 없다 (§13-9)')
    md_conf = {(c['code'], norm_alias(t)) for c in lib['concepts'] for t in c['conflict_terms']}
    if declared != md_conf:
        E('STORE_CONFLICT', f'충돌 별칭이 md 와 다르다 — 저장소 {sorted(declared)} / md {sorted(md_conf)}')
    # 10 — 관계: 양 끝 · 한 번 · 순환 없음 · md 의 prereq 줄과 같은 선행 관계
    seen, graph, st_edges = set(), {}, set()
    for r in store['relations']:
        a, b = code.get(r['from_id']), code.get(r['to_id'])
        if not a or not b:
            E('STORE_RELATION', f'관계의 끝 {r["from_id"] if not a else r["to_id"]} 이 없다 (§13-10)')
            continue
        if r['relation_type'] not in REQUIRED_ENUMS[('ConceptRelation', 'relation_type')]:
            E('STORE_RELATION', f'{a}→{b}: relation_type {r["relation_type"]!r}')
        if r['strength'] is not None:
            E('STORE_RELATION', f'{a}→{b}: strength 에 값이 있다 — 자리만 둔다 (§9)')
        pair = frozenset((a, b))
        if pair in seen or a == b:
            E('STORE_RELATION', f'{a}–{b}: 한 쌍은 한 번만 적는다 (§13-10)')
        seen.add(pair)
        if r['relation_type'] in PREREQ:
            graph.setdefault(a, set()).add(b)
            st_edges.add((a, b))
    for cyc in cycles(graph):
        E('STORE_RELATION', f'선행 관계 순환 {" → ".join(cyc)} (§13-10)')
    md_edges = set(relations(lib))
    if st_edges != md_edges:
        E('STORE_RELATION', f'선행 관계가 md 의 prereq 줄과 다르다 — 저장소에만 {sorted(st_edges - md_edges)} · md 에만 {sorted(md_edges - st_edges)}')
    return errs, warns


# ── C. 골든 ─────────────────────────────────────────────────────────────────
def norm_text(t):
    t = re.sub(r'</?b>', '', t)
    t = t.translate(str.maketrans({'“': '"', '”': '"', '‘': "'", '’': "'"})).replace('\n', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def sentences(t):
    return [s for s in re.split(r'(?<=[.?!])\s+', norm_text(t)) if s]


def parts(lib):
    """{(code, part): {문장}} — part = 'FULL:①' · 'FULL' · 'REFRESHER' · 'ANALOGY:속도계' · 'BOUNDARY' (계약 §3.2)"""
    out = {}
    for c in lib['concepts']:
        for label, _, body in c['full']:
            out[(c['code'], f'FULL:{label}' if label else 'FULL')] = set(sentences(' '.join(body)))
        for k in ('REFRESHER', 'BOUNDARY'):
            b = (c['fields'].get(k) or {}).get('body')
            if b:
                out[(c['code'], k)] = set(sentences(' '.join(b)))
        if c['analogy'] and c['analogy']['body']:
            out[(c['code'], f'ANALOGY:{c["analogy"]["name"]}')] = set(sentences(' '.join(c['analogy']['body'])))
    return out


def level_spans(d):
    """레벨마다 읽는 순서의 [(경로, span)] — JSON 순서 = 읽는 순서 (kicker · headline · blocks)"""
    def walk(o, path):
        if isinstance(o, list):
            if o and all(isinstance(x, dict) and 'layer' in x for x in o):
                for i, sp in enumerate(o):
                    yield f'{path}/{i}', sp
                return
            for i, x in enumerate(o):
                yield from walk(x, f'{path}/{i}')
        elif isinstance(o, dict):
            for k, v in o.items():
                if not k.startswith('_'):
                    yield from walk(v, f'{path}/{k}')
    for lv in d['levels']:
        yield lv['id'], list(walk(lv['slides'], 'slides'))


def match_part(sp, idx):
    ss = sentences(sp['text'])
    if not ss:
        return None
    for key, pool in idx.items():
        if all(s in pool for s in ss):
            return key
    return None


def check_golden(gold, lib, id_map=None):
    """id_map = {concept_id: code}. 라이브러리에 UUID 가 생기기 전에는 셀프테스트만 넘긴다"""
    errs, warns, report = [], [], []
    known = {c['code']: c for c in lib['concepts']}
    id_map = id_map or {}
    idx = parts(lib)
    valid = {}                                            # code → 지금 버전의 part 이름들
    for code, part in idx:
        valid.setdefault(code, set()).add(part)
    legacy, pinned, cspans, verbatim, loose, nullpart = 0, 0, 0, {}, 0, 0
    for lvid, spans in level_spans(gold):
        tagged = []                                       # (경로, span, {(code, part)} 이 span 이 옮긴 문안)
        for path, sp in spans:
            key = match_part(sp, idx)
            claimed, refcodes = set(), {}
            if sp.get('layer') == 'concept':
                cspans += 1
                for r in sp.get('refs', []):
                    if isinstance(r, str):                # 옛 모양 "C-XXXX" — 골든을 옮겼다 (0.2m-a). 이제 Ref 가 아니다
                        legacy += 1
                        errs.append(('GOLD_REF_SHAPE', f'{lvid} {path}: concept ref {r!r} 는 ConceptRef 가 아니다 — '
                                                       f'code 는 참조에 쓰지 않는다 (§2 · §3.2 · §13-12)'))
                        continue
                    if not isinstance(r, dict) or set(r) != {'concept_id', 'version', 'part'}:
                        errs.append(('GOLD_REF_SHAPE', f'{lvid} {path}: concept ref {r!r} 는 ConceptRef '
                                                       f'{{concept_id, version, part}} 가 아니다 (§3.2)'))
                        continue
                    pinned += 1
                    code = id_map.get(r['concept_id'])
                    if code not in known:
                        errs.append(('GOLD_REF_UNKNOWN', f'{lvid} {path}: concept_id {r["concept_id"]} 를 풀 수 없다 (§13-12)'))
                        continue
                    cur = known[code]['version']
                    if not isinstance(r['version'], int) or not 1 <= r['version'] <= cur:
                        errs.append(('GOLD_REF_VERSION', f'{lvid} {path}: {code}@{r["version"]} — 버전은 1~{cur} (§13-12)'))
                        continue
                    refcodes[code] = r['part']
                    if r['part'] is None:
                        nullpart += 1
                    elif r['version'] != cur:
                        warns.append(('GOLD_PART_OLD', f'{lvid} {path}: {code}@{r["version"]} part {r["part"]} — '
                                                       f'옛 버전 문안이 저장소에 없어 part 를 확인하지 못했다 (§14)'))
                        claimed.add((code, r['part']))
                    elif r['part'] not in valid.get(code, ()):
                        errs.append(('GOLD_PART_UNKNOWN', f'{lvid} {path}: {code}@{cur} 에 part "{r["part"]}" 가 없다 '
                                                          f'— {sorted(valid.get(code, ()))} (§3.2)'))
                    else:
                        claimed.add((code, r['part']))
                if key is None:
                    loose += 1
            if key:
                code, part = key
                verbatim.setdefault(key, []).append(f'{lvid} {path}')
                if sp.get('layer') != 'concept' or code not in refcodes:
                    errs.append(('GOLD_REF_SOURCE', f'{lvid} {path}: {code} {part} 문안인데 layer={sp.get("layer")} '
                                                    f'refs={sp.get("refs")} (§13-14)'))
                elif refcodes[code] != part:
                    errs.append(('GOLD_PART_MISMATCH', f'{lvid} {path}: {code} {part} 문안 그대로인데 '
                                                       f'part={refcodes[code]!r} (§13-14)'))
            tagged.append((path, sp, claimed))
        # 브리지 슬롯 순서 (§6.3 · §13-13) — span 이 옮긴 문안(claimed) 으로 본다
        for c in lib['concepts']:
            steps = {st[0] for st in c['full'] if st[0]}
            ana_part = f'ANALOGY:{c["analogy"]["name"]}' if c['analogy'] else None
            for s in c['slots']:
                if s['after'] not in steps or s['label'] in steps:
                    continue                                  # 슬롯 자체가 틀렸다 — LIB_BRIDGE_SLOT 이 이미 말한다
                aft = [i for i, t in enumerate(tagged) if (c['code'], f'FULL:{s["after"]}') in t[2]]
                ana = [i for i, t in enumerate(tagged) if (c['code'], ana_part) in t[2]]
                needs = c['analogy'] and s['label'] in c['analogy']['requires']
                if not aft:
                    if ana and needs:
                        errs.append(('GOLD_ANALOGY_ORDER', f'{lvid}: {c["code"]} 비유를 썼는데 {s["after"]} 가 없다'))
                    continue
                last = aft[-1]
                # 규칙 1 — 마지막 단계 span 바로 다음이 bridge
                nxt = tagged[last + 1] if last + 1 < len(tagged) else None
                if not nxt or nxt[1].get('layer') != 'bridge':
                    got = f'{nxt[1].get("layer")} "{nxt[1]["text"][:20]}"' if nxt else '끝'
                    errs.append(('GOLD_BRIDGE_ORDER', f'{lvid} {tagged[last][0]}: {c["code"]} {s["after"]} 바로 다음이 '
                                                      f'브리지 {s["label"]} 가 아니라 {got}'))
                else:
                    report.append(f'  {lvid}: {c["code"]} {s["after"]} {tagged[last][0]} → 브리지 {s["label"]} '
                                  f'{nxt[0]} "{nxt[1]["text"].strip()}"')
                # 규칙 2 — 비유는 단계 뒤에 나온 첫 브리지보다 뒤 (붙어 있는지는 규칙 1 이 본다)
                bridge_at = next((i for i in range(last + 1, len(tagged)) if tagged[i][1].get('layer') == 'bridge'), None)
                if needs:
                    for i in ana:
                        if bridge_at is None or i <= bridge_at:
                            errs.append(('GOLD_ANALOGY_ORDER', f'{lvid} {tagged[i][0]}: {c["code"]} 비유가 '
                                                               f'{s["after"]} + 브리지 {s["label"]} 보다 먼저'))
    return errs, warns, {'verbatim': verbatim, 'loose': loose, 'bridge': report, 'pinned': pinned,
                         'legacy': legacy, 'nullpart': nullpart}


# ── 실행 ────────────────────────────────────────────────────────────────────
def run(contract_text, library_text, gold, log_text, id_map=None, store=None):
    lib = parse_library(library_text)
    errs, warns = [], []
    errs += check_contract(contract_text)
    errs += check_log(log_text)
    e, w = check_library(lib)
    errs += e
    warns += w
    if store is not None:                                # 저장소가 있으면 concept_id 는 거기서 푼다
        e, w = check_store(store, lib, library_text, contract_text)
        errs += e
        warns += w
        if id_map is None and not any(c in ('STORE_SHAPE', 'STORE_KEY') for c, _ in e):
            id_map = id_map_of(store)                    # 키가 멀쩡하면 골든의 참조는 풀 수 있다 (다른 저장소 오류와 섞이지 않게)
    e, w, rep = check_golden(gold, lib, id_map)
    errs += e
    warns += w
    return errs, warns, lib, rep


def migration_report(lib):
    out = []
    edges = relations(lib)
    for c in lib['concepts']:
        ch = [f'code {c["code"]} + UUID 발급', f'v{c["version"]} ({c["version_date"]})']
        ch.append('FULL 단계 ' + ('·'.join(s[0] for s in c['full']) if c['full'][0][0] else '1'))
        if c['slots']:
            ch.append('브리지 슬롯 ' + ', '.join(f'{s["label"]} after {s["after"]}' for s in c['slots']))
        a = c['analogy']
        if a:
            ch.append(f'비유 `{a["name"]}` 한계선 {len(a["limits"])}' + (f' requires {"".join(a["requires"])}'
                                                                     if a['requires'] else ''))
        if 'BOUNDARY' in c['fields']:
            ch.append(f'BOUNDARY {len(c["fields"]["BOUNDARY"]["body"] or [])}줄')
        ctx = [f'{x}({y})' for x, y in c['aliases'] if y]
        ch.append(f'alias {len(c["aliases"])}' + (f' · source 있음 {ctx}' if ctx else ''))
        if c['conflict_terms']:
            ch.append(f'ConflictingAlias {sorted(set(c["conflict_terms"]))}')
        rel = [f'{a}→{b}' for (a, b) in edges if c['code'] in (a, b)]
        if rel:
            ch.append('relation ' + ' '.join(sorted(rel)))
        drop = [k for k in ('used_in',) if k in c['meta']]
        memo = [k for k in ('first_source', 'reuse_expected') if k in c['meta']]
        memo += [n['lines'][0].split(':')[0][:12] for n in c['notes']
                 if not n['lines'][0].startswith(('🔗',)) and '비유 한계선' not in n['lines'][0]
                 and not ('뒤에만' in n['lines'][0])]
        out.append(f'  {c["code"]} {c["name"]:<26} {c["domain"]:<10} ' + ' · '.join(ch))
        if drop or memo:
            out.append(f'  {"":<38}' + (f'버림(계산) {drop}  ' if drop else '') + (f'저작 메모로 {memo}' if memo else ''))
    return out


def main():
    report = '--report' in sys.argv
    read = lambda p: open(p, encoding='utf-8').read()
    store = json.load(open(STORE, encoding='utf-8')) if os.path.exists(STORE) else None
    errs, warns, lib, rep = run(read(CONTRACT), read(LIBRARY), json.load(open(GOLDEN, encoding='utf-8')),
                                read(LOG) if os.path.exists(LOG) else '', store=store)
    print('verify-concept-identity')
    print(f'  계약   {os.path.relpath(CONTRACT, ROOT)}')
    print(f'  실물   {os.path.relpath(LIBRARY, ROOT)} — 개념 {len(lib["concepts"])} · '
          f'CHANGELOG 버전 {len(lib["changelog"])}건')
    if store is not None:
        n = len(reader_texts_store(store))
        same = sum(1 for k, v in reader_texts_md(read(LIBRARY)).items() if reader_texts_store(store).get(k) == v)
        print(f'         {os.path.relpath(STORE, ROOT)} — 개념 {len(store["concepts"])} (UUID) · 버전 문안 {len(store["versions"])}벌 · '
              f'alias {len(store["aliases"])} · 충돌 별칭 {len(store["conflicting_aliases"])} · 관계 {len(store["relations"])}')
        print(f'         독자 글 md ↔ 저장소 — {n} 단위 중 글자까지 같은 것 {same}')
    print(f'         {os.path.relpath(GOLDEN, ROOT)} — 문안 그대로 {sum(len(v) for v in rep["verbatim"].values())} span · '
          f'문안 아님 {rep["loose"]} span (concept 층)')
    print(f'         concept refs — ConceptRef {rep["pinned"]} (part null {rep["nullpart"]}) · "C-XXXX" {rep["legacy"]}')
    if report:
        print('\n라이브러리 → 계약 (§16)')
        print('\n'.join(migration_report(lib)))
        print('\n골든 concept span — 어느 문안인가 (버전 = 지금 라이브러리)')
        ver = {c['code']: c['version'] for c in lib['concepts']}
        for (code, part), where in sorted(rep['verbatim'].items()):
            print(f'  {code}@{ver[code]} {part:<10} {len(where)} span  {where[0]}' + (' …' if len(where) > 1 else ''))
        print('\n브리지 슬롯 (§6.3)')
        print('\n'.join(rep['bridge']) or '  (없음)')
    print()
    for code, msg in warns:
        print(f'  WARN  {code}: {msg}')
    for code, msg in errs:
        print(f'  ERROR {code}: {msg}')
    print('\nFAIL' if errs else '\nOK')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
