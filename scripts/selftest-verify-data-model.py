"""verify-data-model.py 가 실제로 실패할 수 있는지 — 일부러 망가뜨린 사본으로 확인한다 (B-0.2b).

    python3 scripts/selftest-verify-data-model.py

계약 · 로그 · 골든 · 시험 사본(골든 + FOMC 브리프를 이 계약 모양으로 옮긴 것)의 사본에 위반을 하나씩 넣고
기대한 code 만 나오는지 본다 (다른 code 가 섞이면 실패). 망가뜨리지 않은 원본은 통과해야 한다.
사본은 전부 메모리 안이다 — 파일로 남기지 않는다.

발행 검사(불변식 8 · 9 · 11 · 13 · 17 · 19 · 20 · 23)는 지금 시험 사본에서 **막히는 것이 정상**이다(출처 · 반증이 비었다).
그 검사가 제대로 무는지 보려고 가짜 재료로 다 채운 사본(`publishable`)을 만들어 발행 검사를 통과시킨 뒤 하나씩 망가뜨린다.
가짜 재료(SYN 출처 · 시험 사실 · 시험 반증)는 검사를 시험하려는 것이다 — 콘텐츠가 아니다.

"빈틈" 행은 망가뜨렸는데 **못 잡는 것**이 기대값이다 — 계약이 게이트 3 으로 넘긴 것을 실제로 보인다.
"""
import copy, importlib.util, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vdm', os.path.join(ROOT, 'scripts/verify-data-model.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

read = lambda p: open(p, encoding='utf-8').read()
CONTRACT, LOG, LIBT = read(V.CONTRACT), read(V.LOG), read(V.LIBRARY)
GOLD = json.load(open(V.GOLDEN, encoding='utf-8'))
LIB = V.VC.parse_library(LIBT)
FB, CB, SB = V.brief_facts(V.BRIEFS['FOMC']), V.brief_claims(V.BRIEFS['FOMC']), V.brief_sources(V.BRIEFS['FOMC'])
BASE = V.build_model(GOLD, CONTRACT, FB, CB, SB, LIB)
FID = {f['label']: k for k, f in BASE['facts'].items()}
CID = {c['label']: k for k, c in BASE['claims'].items()}
BID = next(iter(BASE['bridges']))


def sub(text, old, new, count=1):
    assert old in text, f'사본을 만들 수 없다 — 원본에 없는 문자열: {old[:50]!r}'
    return text.replace(old, new, count)


def section(num, old, new):
    """계약의 한 절 안에서만 바꾼다"""
    def f(c):
        h, body = V.sec_by_num(c, num)
        assert h, num
        return c.replace(body, sub(body, old, new), 1)
    return f


def g_(fn):
    def f(g):
        g = copy.deepcopy(g)
        fn(g)
        return g
    return f


def slide(g, lv, i):
    return g['levels'][lv]['slides'][i]


def vol(g, lv, i, span):
    return next(v for v in slide(g, lv, i)['_volatility'] if v['span'] == span)


def m_(fn):
    def f(m):
        m = copy.deepcopy(m)
        fn(m)
        return m
    return f


def span_at(m, lv, path):
    o = V.level_of(m['record']['package'], lv)
    for tok in path.split('/'):
        o = o[int(tok)] if isinstance(o, list) else o[tok]
    return o


def te(m, frag):
    return next(t for t in m['record']['authoring']['time_expressions'] if t['at']['fragment'] == frag)


# ── 가짜 재료로 다 채운 사본 — 발행 검사를 시험하려는 것 ──────────────────────
def publishable(m):
    m = copy.deepcopy(m)
    syn = V.UID('source', 'SYN')
    m['sources'][syn] = {'source_id': syn, 'label': 'SYN', 'title': '시험', 'publisher': 'synthetic', 'url': None,
                         'kind': 'PRIMARY', 'language': 'en', 'published_at': '2026-09-01', 'ingested_at': '2026-09-01'}
    m['documents'][syn] = 'x' * 100
    m['registry']['synthetic'] = {'source': 'synthetic', 'can_quote': True}
    n = 0

    def new_fact(label):
        fid = V.UID('fact', label)
        m['facts'][fid] = {'fact_id': fid, 'label': label, 'claim_text': '시험', 'fact_type': 'MEASUREMENT', 'actor': None,
                           'volatility': 'STABLE', 'as_of': None, 'event_at': None, 'event_id': V.EVENT_ID,
                           'storyline_id': None, 'storyline_version': None, 'extraction_model': None,
                           'extraction_version': None}
        return fid
    # 대기 span — 가짜 사실 · 해석으로 채운다
    for lid, path, layer, need in m['pending']:
        sp = span_at(m, lid, path)
        n += 1
        fid = new_fact(f'SYN-F{n}')
        if layer == 'fact':
            sp['refs'] = [fid]
        else:
            cid = V.UID('claim', f'SYN-C{n}')
            m['claims'][cid] = {'claim_id': cid, 'label': f'SYN-C{n}', 'event_id': V.EVENT_ID, 'statement': '시험',
                                'kind': 'ASSERTED', 'basis': [fid],
                                'checks': [{'question': '시험', 'slot': None, 'recollected': False, 'answer': '',
                                            'facts': [fid], 'outcome': 'NOT_REFUTED'}]}
            sp['refs'] = [cid]
    m['pending'] = []
    # DERIVED 입력 — 가짜 사실, 개전일은 날짜까지
    for t in m['record']['authoring']['time_expressions']:
        for x in t['inputs']:
            if not x['fact']:
                n += 1
                x['fact'] = new_fact(f'SYN-F{n}')
                if x['key'] == 'war_start':
                    x['value'] = '2026-02-28'
    # 반증 — 비었거나 사실 없는 답
    for c in m['claims'].values():
        if not c['checks']:
            c['checks'] = [{'question': '시험', 'slot': None, 'recollected': False, 'answer': '',
                            'facts': list(c['basis'][:1]), 'outcome': 'NOT_REFUTED'}]
        for k in c['checks']:
            if k['outcome'] in ('NOT_REFUTED', 'SCOPED') and not k['facts']:
                k['facts'] = list(c['basis'][:1])
    # 모든 사실에 SYN 원문 위치
    for fid in m['facts']:
        m['fact_sources'].append({'fact_id': fid, 'source_id': syn, 'section': None, 'span_start': 0, 'span_end': 10})
    return m


PUB = publishable(BASE)
SYN = V.UID('source', 'SYN')


def add_source(m, label, **kv):
    sid = V.UID('source', label)
    m['sources'][sid] = dict(m['sources'][SYN], source_id=sid, label=label, **kv)
    m['documents'][sid] = 'y' * 100
    return sid


def only_source(m, fact_label, sid):
    fid = FID[fact_label]
    m['fact_sources'] = [x for x in m['fact_sources'] if x['fact_id'] != fid]
    m['fact_sources'].append({'fact_id': fid, 'source_id': sid, 'section': None, 'span_start': 0, 'span_end': 10})


def unspan(m, fact_label):
    for x in m['fact_sources']:
        if x['fact_id'] == FID[fact_label] and x['source_id'] == SYN:
            x['span_start'] = x['span_end'] = None


def second_bridge(m):
    b2 = V.UID('bridge', 'other')
    m['bridges'][b2] = dict(m['bridges'][BID], bridge_id=b2, label='다른 브리지', concept_id=V.UID('concept', 'C-0001'),
                            concept_version=1, slot=None)
    span_at(m, 'basic', 'slides/3/blocks/0/paragraphs/1/body/0')['refs'] = [b2]


def bump_storyline(m):
    m['storylines'][V.IRAN_ID]['version'] = 2
    m['storyline_versions'].append({'storyline_id': V.IRAN_ID, 'version': 2, 'created_at': '2026-09-16', 'change': '시험'})


# (이름, 대상, 망가뜨리기, 기대 code 집합)
# 대상: contract · log · gold → run() 전체 / model → check_model(시험 사본) / publish → check_model(publishable, 발행)
CASES = [
    ('D30 — ArticleRecord.article_id 삭제', 'contract',
     lambda c: sub(c, '  article_id:      UUID             // D30', '  record_key:      UUID             // D30'), {'CONTRACT_FIELD'}),
    # ── A. 계약 문서
    ('§5.4 — Fact.as_of 삭제', 'contract',
     lambda c: sub(c, '  as_of:              TimePoint | null        // VOLATILE 이면 필수. 이 값이 "지금 값"이던 때 (§6.2)\n', ''),
     {'CONTRACT_FIELD'}),
    ('§5.5 — FactSource.span_start 삭제', 'contract',
     lambda c: sub(c, '  span_start: integer               // SourceDocument.text 안 글자 위치. 실물 없음\n', ''), {'CONTRACT_FIELD'}),
    ('§5.3 — Source.ingested_at 삭제', 'contract',
     lambda c: sub(c, '  ingested_at:  TimePoint           // 확정 §5.3. Claro 가 수집한 때\n', ''), {'CONTRACT_FIELD'}),
    ('§5.1 — SourceRegistry.can_quote 삭제', 'contract',
     lambda c: sub(c, '  can_quote:            boolean | null\n', ''), {'CONTRACT_FIELD'}),
    ('§5.2 — FactType 에 BACKGROUND 추가 (D27 이 닫은 7값을 연다)', 'contract',
     lambda c: sub(c, '| "COURT_RULING" | "COMPANY_DISCLOSURE" | "INDEPENDENT_OBSERVATION"',
                   '| "COURT_RULING" | "COMPANY_DISCLOSURE" | "INDEPENDENT_OBSERVATION" | "BACKGROUND"'), {'CONTRACT_ENUM'}),
    ('§5.2 — FactType 에서 OFFICIAL_LIMIT 삭제', 'contract',
     lambda c: sub(c, '"OFFICIAL_CLAIM" | "OFFICIAL_LIMIT" | "MEASUREMENT"', '"OFFICIAL_CLAIM" | "MEASUREMENT"'),
     {'CONTRACT_ENUM'}),                              # §3.3 표는 계약 enum 이 아니라 확정 §5.2 7값에 대 본다
    ('D8 — TimeExpression.class 에 STABLE 추가', 'contract',
     lambda c: sub(c, 'class:              "DERIVED" | "VOLATILE"', 'class:              "STABLE" | "DERIVED" | "VOLATILE"'),
     {'CONTRACT_ENUM'}),
    ('D8 — Fact.volatility 에 DERIVED 추가', 'contract',
     lambda c: sub(c, 'volatility:         "STABLE" | "VOLATILE"', 'volatility:         "STABLE" | "DERIVED" | "VOLATILE"'),
     {'CONTRACT_ENUM'}),
    ('§6.2 — SlotCheck.status 에서 STORYLINE_STALE 삭제', 'contract',
     lambda c: sub(c, ' | "NOT_APPLICABLE" | "STORYLINE_STALE"\n', ' | "NOT_APPLICABLE"\n'), {'CONTRACT_ENUM'}),
    ('§4.1 — Bridge.bridge_type 에서 STORY_BRIDGE 삭제', 'contract',
     lambda c: sub(c, '"CONCEPT_BRIDGE" | "STORY_BRIDGE"\n', '"CONCEPT_BRIDGE"\n'), {'CONTRACT_ENUM'}),
    ('§5.1 — Source.kind 에서 SECONDARY 삭제', 'contract',
     lambda c: sub(c, '"PRIMARY" | "SECONDARY"   //', '"PRIMARY"   //'), {'CONTRACT_ENUM'}),
    ('D27 — Event.code 삭제 (사람이 부르는 이름이 없다)', 'contract',
     lambda c: sub(c, '  code:         string              // "FOMC-20260916". 유일 · 불변 · 재사용 없음 — Concept 의 code 와 같은 방식 (D27)\n', ''),
     {'CONTRACT_FIELD'}),
    ('D27 — EventId 를 다시 문자열로 (초안의 추천)', 'contract',
     lambda c: sub(c, 'EventId     = UUID ', 'EventId     = string '), {'CONTRACT_FIELD'}),
    ('D27 — §3.3 에 _open-1 표시가 다시 들어옴', 'contract',
     lambda c: sub(c, '| SELF_LIMIT | FTC G26 G29 | OFFICIAL_LIMIT |', '| SELF_LIMIT | FTC G26 G29 | **_open-1** |'),
     {'CONTRACT_OPEN_LEFT', 'CONTRACT_TYPE_MAP'}),
    ('D27 — §16 의 _open-2 행에서 "판정됨" 삭제', 'contract',
     lambda c: sub(c, '| _open-2 | 발행하려면 Fact 마다 1차 출처가 있어야 하는가 | 판정됨 → D27:', '| _open-2 | 발행하려면 Fact 마다 1차 출처가 있어야 하는가 | 추천:'),
     {'CONTRACT_OPEN_LEFT'}),
    ('§9.6 — 계약에 posterior', 'contract',
     lambda c: sub(c, '## 15. 미확인', '사실 신뢰는 posterior 로 갱신한다\n\n## 15. 미확인'), {'CONTRACT_HELD_TERM'}),
    ('§9.6 — 계약에 half-life', 'contract',
     lambda c: sub(c, '## 15. 미확인', 'VOLATILE 사실의 half-life 는 7일\n\n## 15. 미확인'), {'CONTRACT_HELD_TERM'}),
    ('0.2a 침범 — 타입 블록에 Concept 정의', 'contract',
     lambda c: sub(c, 'UUID        = string\n', 'UUID        = string\n\nConcept {\n  concept_id: UUID\n}\n'),
     {'CONTRACT_FOREIGN_TYPE'}),
    ('0.2c 침범 — 타입 블록에 KnowledgeEvidence 정의', 'contract',
     lambda c: sub(c, 'UUID        = string\n', 'UUID        = string\n\nKnowledgeEvidence {\n  event_id: UUID\n}\n'),
     {'CONTRACT_FOREIGN_TYPE'}),
    ('D24 — §4.4 권리 절에서 "실물 없음" 전부 삭제', 'contract',
     lambda c: (lambda h, b: c.replace(b, b.replace('실물 없음', '실물 있음'), 1))(*V.sec_by_num(c, '4.4')),
     {'CONTRACT_NO_REAL'}),
    ('D24 — §9.2 Storyline 절에서 "실물 없음" 전부 삭제', 'contract',
     lambda c: (lambda h, b: c.replace(b, b.replace('실물 없음', '확인됨'), 1))(*V.sec_by_num(c, '9.2')),
     {'CONTRACT_NO_REAL'}),
    ('§3.3 — SELF_LIMIT 행 삭제 (브리프 타입이 표 밖)', 'contract',
     lambda c: re.sub(r'^\| SELF_LIMIT \|.*\n', '', c, count=1, flags=re.M), {'CONTRACT_TYPE_MAP'}),
    ('§3.3 — PROJECTION 을 FORECAST 로 (7값도 표시도 아님)', 'contract',
     lambda c: sub(c, '| PROJECTION | FOMC F11 F14~F19 · 스크루웜 S19 | OFFICIAL_CLAIM |',
                   '| PROJECTION | FOMC F11 F14~F19 · 스크루웜 S19 | FORECAST |'), {'CONTRACT_TYPE_MAP'}),
    ('§6.4 — year_of 행 삭제 (골든이 쓰는 op)', 'contract',
     lambda c: re.sub(r'^\| `year_of` \|.*\n', '', c, count=1, flags=re.M), {'CONTRACT_OP', 'GOLD_OP_UNKNOWN'}),
    ('CHANGELOG — B-0.2b 행 전부 삭제', 'contract',
     lambda c: re.sub(r'^\| 20\d\d-\d\d-\d\d \| .*\| B-0\.2b \|\n', '', c, flags=re.M), {'CONTRACT_CHANGELOG'}),
    # ── B. 로그
    ('로그 — 질문 10 행 삭제', 'log', lambda l: re.sub(r'^\| 10 \|.*\n', '', l, count=1, flags=re.M), {'LOG_QUESTION'}),
    ('로그 — 질문 4 행의 표시 지움', 'log',
     lambda l: re.sub(r'^\| 4 \|.*$', lambda m: re.sub(r'계약 반영|_open|미확인', '—', m.group()), l, count=1, flags=re.M),
     {'LOG_QUESTION'}),
    # ── C. 골든
    ('R-1 — published_at 에 시각', 'gold', g_(lambda g: g.__setitem__('published_at', '2026-09-16T14:00:00-04:00')),
     {'GOLD_PUBLISHED_AT_SHAPE'}),
    ('§6.2 — F31 as_of 를 한 곳만 바꿈 (사실의 속성이 조각마다 다르다)', 'gold',
     g_(lambda g: vol(g, 0, 3, '3%대').__setitem__('as_of', '2026-09-11')), {'GOLD_ASOF_CONFLICT'}),
    ('불변식 15 — 시간 조각 "올해 말 금리" → "올해" (그 글에 두 번)', 'gold',
     g_(lambda g: vol(g, 0, 8, '올해 말 금리').__setitem__('span', '올해')), {'GOLD_FRAGMENT_AMBIGUOUS'}),
    ('불변식 16 — VOLATILE 조각의 사실을 지움', 'gold',
     g_(lambda g: vol(g, 0, 7, '경유 가격이 사상 최고치').__setitem__('refs', [])), {'GOLD_VOLATILE_NO_FACT'}),
    ('§7.2 — DC-C span 의 끊긴 연결에 F38 추가 (브리프 DC-C 근거 밖 → 옮기면 잃는다)', 'gold',
     g_(lambda g: slide(g, 0, 1)['headline'][0]['_fact_refs_dropped'].append('F38')), {'GOLD_DROPPED_NOT_IN_BASIS'}),
    ('§10.1 — 인용 출처 표시에서 body 사실 F33 삭제', 'gold',
     g_(lambda g: slide(g, 0, 5)['blocks'][1].__setitem__('_attribution_refs', ['F32'])), {'GOLD_ATTRIBUTION'}),
    ('§10.2 — 인용 body 를 따옴표로 쌈 (FTC observed 모양)', 'gold',
     g_(lambda g: (lambda b: (b[0].__setitem__('text', '“' + b[0]['text']), b[-1].__setitem__('text', b[-1]['text'] + '”')))(
         slide(g, 1, 1)['blocks'][1]['body'])), {'GOLD_QUOTE_MARKS'}),
    ('불변식 25 — 브리지 대기 need 를 Fact 출처로 (층과 안 맞는다)', 'gold',
     g_(lambda g: slide(g, 0, 3)['blocks'][0]['paragraphs'][1]['body'][0]['_refs_pending'].__setitem__('need', 'Fact 출처')),
     {'GOLD_PENDING_NEED'}),
    ('불변식 25 — 대기 need 가 어휘 밖 ("나중에")', 'gold',
     g_(lambda g: slide(g, 0, 3)['blocks'][0]['paragraphs'][1]['body'][0]['_refs_pending'].__setitem__('need', '나중에')),
     {'GOLD_PENDING_NEED'}),
    ('빈틈 — 대기 span 하나를 몰래 채움. 계약 글과 대조하지 않으므로 FAIL 이 아니다 — 대기 수(WARN)가 줄 뿐 (0.2m-a _open-m1)', 'gold',
     g_(lambda g: (lambda sp: (sp.pop('_refs_pending'), sp.__setitem__('refs', ['F36'])))(
         next(sp for _, _, _, sp in V.golden_spans(g) if sp.get('_refs_pending', {}).get('need') == 'Fact 출처'))), set()),
    ('§6.4 — op 를 decades 로', 'gold',
     g_(lambda g: vol(g, 0, 0, '3년 만에')['formula'].__setitem__('op', 'decades')), {'GOLD_OP_UNKNOWN'}),
    ('§6.3 — DERIVED 입력 하나에 사실 둘', 'gold',
     g_(lambda g: vol(g, 1, 0, '7주 만에')['derived_from'][0].__setitem__('refs', ['F28', 'F02'])), {'GOLD_INPUT_MULTI'}),
    # ── D. 시험 사본 (지금 검사)
    ('불변식 26 — ArticleRecord 의 article_id 가 code 문자열', 'model',
     m_(lambda m: m['record'].__setitem__('article_id', 'FOMC-20260916')), {'RECORD_KEY'}),
    ('불변식 26 — ArticleRecord 에 article_version 이 없다', 'model',
     m_(lambda m: m['record'].pop('article_version')), {'RECORD_KEY'}),
    ('불변식 4 — F01 fact_type 을 브리프 타입 POLICY_ACTION 그대로', 'model',
     m_(lambda m: m['facts'][FID['F01']].__setitem__('fact_type', 'POLICY_ACTION')), {'FACT_TYPE'}),
    ('불변식 5 — OFFICIAL_CLAIM F24 의 actor 삭제', 'model',
     m_(lambda m: m['facts'][FID['F24']].__setitem__('actor', None)), {'FACT_ACTOR'}),
    ('불변식 6 — VOLATILE F31 의 as_of 삭제', 'model',
     m_(lambda m: m['facts'][FID['F31']].__setitem__('as_of', None)), {'FACT_AS_OF'}),
    ('불변식 6 — STABLE F01 에 as_of', 'model',
     m_(lambda m: m['facts'][FID['F01']].__setitem__('as_of', '2026-09-16')), {'FACT_AS_OF'}),
    ('§6.1 — F11 을 Fact 에서 DERIVED 로 (D8 가정) → 그 사실로 계산한 "올해" 조각도 걸린다', 'model',
     m_(lambda m: m['facts'][FID['F11']].__setitem__('volatility', 'DERIVED')), {'FACT_VOLATILITY', 'DERIVED_FROM_VOLATILE'}),
    ('불변식 7 — F37 이 사건 · 스토리라인 둘 다 소유', 'model',
     m_(lambda m: m['facts'][FID['F37']].__setitem__('event_id', V.EVENT_ID)), {'FACT_OWNER'}),
    ('불변식 7 — F37 이 없는 스토리라인 버전 2 에 붙음', 'model',
     m_(lambda m: m['facts'][FID['F37']].__setitem__('storyline_version', 2)), {'FACT_OWNER'}),
    ('불변식 1 — 한 사건 안에 label F01 이 둘', 'model',
     m_(lambda m: m['facts'][FID['F02']].__setitem__('label', 'F01')), {'LABEL_DUP'}),
    ('불변식 1 — Claim 키가 Fact 키와 같다', 'model',
     m_(lambda m: m['claims'].__setitem__(FID['F01'], dict(m['claims'][CID['DC-A']], claim_id=FID['F01']))), {'KEY_DUP'}),
    ('D27 — 패키지 event_ref 가 code 문자열 ("FOMC-20260916") — 브리지의 사건과도 어긋난다', 'model',
     m_(lambda m: m['record']['package'].__setitem__('event_ref', V.EVENT)), {'EVENT_REF', 'BRIDGE_EVENT'}),
    ('D27 — 두 사건이 같은 code', 'model',
     m_(lambda m: m['events'].__setitem__('x', dict(m['events'][V.EVENT_ID], event_id='x'))), {'CODE_DUP'}),
    ('불변식 2 — fact span 에 ClaimRef', 'model',
     m_(lambda m: span_at(m, 'basic', 'slides/0/headline/0').__setitem__('refs', [CID['DC-A']])), {'REF_UNRESOLVED'}),
    ('불변식 2 — claim span 에 FactRef (층 섞기)', 'model',
     m_(lambda m: span_at(m, 'basic', 'slides/1/headline/0').__setitem__('refs', [FID['F32']])), {'REF_UNRESOLVED'}),
    ('불변식 2 — concept span 에 "C-0002" 문자열', 'model',
     m_(lambda m: span_at(m, 'basic', 'slides/3/blocks/0/paragraphs/0/body/0').__setitem__('refs', ['C-0002'])),
     {'REF_UNRESOLVED'}),
    ('불변식 22 — DC-C basis 비움', 'model', m_(lambda m: m['claims'][CID['DC-C']].__setitem__('basis', [])), {'CLAIM_NO_BASIS'}),
    ('불변식 18 — 브리지 facts 비움 (F31 을 품지 않은 브리지)', 'model',
     m_(lambda m: m['bridges'][BID].__setitem__('facts', [])), {'BRIDGE_NO_FACTS'}),
    ('불변식 18 — 브리지 슬롯 ⑤ (C-0002@3 에 없다)', 'model',
     m_(lambda m: m['bridges'][BID].__setitem__('slot', '⑤')), {'BRIDGE_CONCEPT', 'BRIDGE_SLOT_ORDER'}),   # ③ 다음 브리지가 ④ 를 못 채운다
    ('불변식 18 — CONCEPT_BRIDGE 인데 개념 없음', 'model',
     m_(lambda m: m['bridges'][BID].__setitem__('concept_id', None)), {'BRIDGE_CONCEPT', 'BRIDGE_SLOT_ORDER'}),
    ('불변식 18 — 브리지가 다른 사건의 것', 'model',
     m_(lambda m: m['bridges'][BID].__setitem__('event_id', 'FOMC-20260729')), {'BRIDGE_EVENT'}),
    ('불변식 18 — ③ 바로 다음 bridge span 이 ④ 가 아닌 브리지(C-0001, 슬롯 없음)를 가리킴', 'model',
     m_(second_bridge), {'BRIDGE_SLOT_ORDER'}),
    ('불변식 15 — 시간 조각이 글에 없다', 'model', m_(lambda m: te(m, '3년 만에')['at'].__setitem__('fragment', '4년 만에')),
     {'TE_LOCATOR'}),
    ('불변식 15 — 시간 조각 경로가 다른 장', 'model',
     m_(lambda m: te(m, '7주 만에')['at'].__setitem__('path', 'slides/3/blocks/1/paragraphs/0/body')), {'TE_LOCATOR'}),
    ('불변식 16 — VOLATILE 조각이 STABLE 사실(F01)을 가리킴', 'model',
     m_(lambda m: te(m, '경유 가격이 사상 최고치').__setitem__('facts', [FID['F01']])), {'TE_VOLATILE_FACTS'}),
    ('D8 규칙 4 — DERIVED 입력이 VOLATILE 사실(F31)', 'model',
     m_(lambda m: te(m, '3년 만에')['inputs'][0].__setitem__('fact', FID['F31'])), {'DERIVED_FROM_VOLATILE'}),
    ('D8 규칙 3 — "3년 만에" 기록값을 4 로', 'model',
     m_(lambda m: te(m, '3년 만에').__setitem__('value_at_authoring', 4)), {'DERIVED_INVARIANT_FAIL'}),
    ('불변식 12 — 패키지 published_at 에 시각', 'model',
     m_(lambda m: m['record']['package'].__setitem__('published_at', '2026-09-16T14:00:00-04:00')), {'PUBLISHED_AT_SHAPE'}),
    ('불변식 21 — 인용 body 를 따옴표로 쌈', 'model',
     m_(lambda m: (lambda b: (b[0].__setitem__('text', '"' + b[0]['text']), b[-1].__setitem__('text', b[-1]['text'] + '"')))(
         span_at(m, 'basic', 'slides/5/blocks/1/body'))), {'QUOTE_MARKS'}),
    ('불변식 24 — FOUND 인데 사실 없음', 'model',
     m_(lambda m: m['slots'].append({'slot': '표결', 'status': 'FOUND', 'facts': [], 'sources': [], 'storyline': None})),
     {'SLOT_FACTS'}),
    ('불변식 24 — STORYLINE_STALE 인데 스토리라인 없음', 'model',
     m_(lambda m: m['slots'].append({'slot': '외부 충격', 'status': 'STORYLINE_STALE', 'facts': [], 'sources': [],
                                     'storyline': None})), {'SLOT_STORYLINE'}),
    ('빈틈 — 본문에 지어낸 발언 따옴표 ("연준은 “확신이 없다”고 말했어요") — 게이트 3', 'model',
     m_(lambda m: span_at(m, 'basic', 'slides/5/blocks/0/paragraphs/0/body/0').__setitem__(
         'text', '연준은 “확신이 없다”고 말했어요.')), set()),
    ('빈틈 — 기관 평가를 맨 사실처럼 ("지정학적 불확실성은 여전히 큽니다." → F07, 성명문이라는 말 없음) — 게이트 3', 'model',
     m_(lambda m: span_at(m, 'advanced', 'slides/4/blocks/0/paragraphs/0/body/4').__setitem__(
         'text', '지정학적 불확실성은 여전히 큽니다.')), set()),
    # ── D. 발행 검사 (가짜 재료로 다 채운 사본을 하나씩 망가뜨린다)
    ('불변식 8 — F01 원문 위치 없음 (출처 문서만 안다)', 'publish', m_(lambda m: unspan(m, 'F01')), {'FACT_NO_SOURCE_SPAN'}),
    ('불변식 9 — F03 출처가 2차뿐 (D27 — 1차 필수)', 'publish',
     m_(lambda m: only_source(m, 'F03', add_source(m, 'NEWS', kind='SECONDARY'))), {'FACT_NO_PRIMARY'}),
    ('불변식 11 — F28 의 유일한 출처가 발행 뒤 공개 (§5.3 7월 회의록 사례)', 'publish',
     m_(lambda m: only_source(m, 'F28', add_source(m, 'LATE', published_at='2026-10-07'))), {'FACT_NOT_YET_PUBLIC'}),
    ('불변식 11 — 출처 공개일이 월 정밀도라 증명 못 함 ("2026-09")', 'publish',
     m_(lambda m: only_source(m, 'F28', add_source(m, 'MONTH', published_at='2026-09'))), {'FACT_NOT_YET_PUBLIC'}),
    ('불변식 13 — SL-iran-war 가 v2 로 올랐는데 핀은 v1', 'publish', m_(bump_storyline), {'STORYLINE_STALE'}),
    ('불변식 13 — 핀 없음', 'publish', m_(lambda m: m['record']['authoring'].__setitem__('storylines', [])),
     {'STORYLINE_STALE'}),
    ('불변식 23 — DC-D 반증 기록 없음 (브리프 실물 그대로)', 'publish',
     m_(lambda m: m['claims'][CID['DC-D']].__setitem__('checks', [])), {'CLAIM_UNCHECKED'}),
    ('불변식 23 — ASSERTED DC-C 에 미결 반증', 'publish',
     m_(lambda m: m['claims'][CID['DC-C']]['checks'].append({'question': '시험', 'slot': None, 'recollected': False,
                                                            'answer': '', 'facts': [], 'outcome': 'UNRESOLVED'})),
     {'CLAIM_UNCHECKED'}),
    ('불변식 23 — DC-A 반증 답에 사실 없음 (브리프 실물: "셋 다 투표권자")', 'publish',
     m_(lambda m: m['claims'][CID['DC-A']]['checks'][0].__setitem__('facts', [])), {'CHECK_NO_FACTS'}),
    ('불변식 17 — 개전일이 월 정밀도 ("201일째" 증명 못 함)', 'publish',
     m_(lambda m: te(m, '201일째')['inputs'][0].__setitem__('value', '2026-02')), {'DERIVED_UNVERIFIED'}),
    ('불변식 17 — DERIVED 입력에 사실 없음', 'publish',
     m_(lambda m: te(m, '3년 만에')['inputs'][0].__setitem__('fact', None)), {'DERIVED_INPUT_NO_FACT'}),
    ('불변식 19 — 인용 한 블록의 두 문장이 서로 다른 원문', 'publish',
     m_(lambda m: (span_at(m, 'basic', 'slides/5/blocks/1/body/1').__setitem__('refs', [FID['F32']]),
                   only_source(m, 'F32', add_source(m, 'OTHER')))), {'QUOTE_NO_COMMON_SOURCE'}),
    ('불변식 20 — 원문 발행처가 인용 불가', 'publish',
     m_(lambda m: m['registry']['synthetic'].__setitem__('can_quote', False)), {'QUOTE_NOT_ALLOWED'}),
    ('불변식 20 — 권리 검토 안 된 발행처 (null)', 'publish',
     m_(lambda m: m['registry']['synthetic'].__setitem__('can_quote', None)), {'QUOTE_NOT_ALLOWED'}),
    ('ARTICLE_PACKAGE §6.2 — 대기 span 이 발행에 남음', 'publish',
     m_(lambda m: (span_at(m, 'basic', 'slides/7/blocks/0/paragraphs/0/body/0').__setitem__('refs', []),
                   m['pending'].append(('basic', 'slides/7/blocks/0/paragraphs/0/body/0', 'fact', 'Fact 출처')))),
     {'REFS_PENDING'}),
]


def codes(errs):
    return {c for c, _ in errs}


def run(target, mutate):
    if target in ('contract', 'log', 'gold'):
        c = mutate(CONTRACT) if target == 'contract' else CONTRACT
        l = mutate(LOG) if target == 'log' else LOG
        g = mutate(GOLD) if target == 'gold' else GOLD
        errs, _, _, _, _ = V.run(c, l, g, LIBT)
        return codes(errs)
    if target == 'model':
        return codes(V.check_model(mutate(BASE), LIB)[0])
    return codes(V.check_model(mutate(PUB), LIB, publish=True)[0])


def main():
    fails = 0
    base = {'원본 (계약 · 로그 · 골든 · 시험 사본)': run('gold', lambda g: g),
            '가짜 재료로 다 채운 사본 — 발행 검사': run('publish', lambda m: m)}
    for name, got in base.items():
        ok = not got
        fails += not ok
        print(f'{"PASS" if ok else "FAIL"}  {name} → {sorted(got) or "통과"}')
    for name, target, mutate, want in CASES:
        got = run(target, mutate)
        ok = got == want
        fails += not ok
        tag = '빈틈' if not want else ''
        print(f'{"PASS" if ok else "FAIL"}  [{target}] {name} → {sorted(got) or "통과"}' + (f'  (기대 {sorted(want)})' if not ok else '')
              + (f'  {tag}' if tag and ok else ''))
    print(f'\n사본 {len(CASES)}개 · ' + ('OK' if not fails else f'{fails}개 실패'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
