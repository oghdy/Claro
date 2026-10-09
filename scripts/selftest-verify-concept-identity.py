"""verify-concept-identity.py 가 실제로 실패할 수 있는지 — 일부러 망가뜨린 사본으로 확인한다 (B-0.2a).

    python3 scripts/selftest-verify-concept-identity.py

계약 · 로그 · 라이브러리 · 골든의 사본(메모리 안, 파일로 남기지 않는다)에 위반을 하나씩 넣고
기대한 code 만 나오는지 본다 (다른 code 가 섞이면 실패). 망가뜨리지 않은 원본은 통과해야 한다.
"빈틈" 행은 망가뜨렸는데 **못 잡는 것**이 기대값이다 — 계약 §6.3 이 적은 빈틈을 실제로 보인다.

골든은 아직 refs 가 "C-XXXX" 다. part 기반 검사(D25)를 시험하려고 골든을 ConceptRef 모양으로 옮긴 사본(mgold)을
메모리 안에서 만든다 — part 는 검사 C 가 글자 대조로 찾은 것, concept_id 는 시험용 UUID(uuid5).
진짜 UUID 발급은 라이브러리 이전 작업이다 (계약 §16).
"""
import copy, importlib.util, json, os, re, sys, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vci', os.path.join(ROOT, 'scripts/verify-concept-identity.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

read = lambda p: open(p, encoding='utf-8').read()
CONTRACT, LIBRARY, LOG = read(V.CONTRACT), read(V.LIBRARY), read(V.LOG)
GOLD = json.load(open(V.GOLDEN, encoding='utf-8'))          # 0.2m-a 뒤로 concept refs 는 ConceptRef 다
LIB = V.parse_library(LIBRARY)
_STORE = json.load(open(V.STORE, encoding='utf-8'))
UID = {c['code']: c['concept_id'] for c in _STORE['concepts']}
ID_MAP = {u: code for code, u in UID.items()}
CUR = {c['code']: c['version'] for c in LIB['concepts']}
MGOLD = GOLD                                                # 옛 이름 — "ConceptRef 로 옮긴 골든". 이제 골든 그 자체다


def sub(text, old, new, count=1):
    assert old in text, f'사본을 만들 수 없다 — 원본에 없는 문자열: {old[:40]!r}'
    return text.replace(old, new, count)


def concept_block(lib, code):
    """라이브러리에서 한 개념 절(### 부터 --- 앞까지)"""
    m = re.search(rf'^### {code} · .*?(?=^---\s*$)', lib, re.M | re.S)
    assert m, code
    return m.group()


def lib_in(code, old, new):
    def f(lib):
        blk = concept_block(lib, code)
        return lib.replace(blk, sub(blk, old, new))
    return f


def bump_version(code):
    """그 개념의 `version` 줄을 한 버전 올린다 — 글자가 아니라 자리(메타 줄)로 찾는다. 라이브러리 버전이 올라도 사본이 만들어진다"""
    def f(lib):
        blk = concept_block(lib, code)
        m = re.search(r'^- `version`: v(\d+) \((\d{4}-\d{2}-\d{2})\)$', blk, re.M)
        assert m, f'{code}: version 줄이 없다'
        return lib.replace(blk, blk.replace(m.group(), f'- `version`: v{int(m.group(1)) + 1} ({m.group(2)})', 1))
    return f


def drop_field_body(code, field):
    """그 개념의 **FIELD** 머리 바로 아래 인용 블록(본문)을 지운다 — 문안 글자에 기대지 않는다"""
    def f(lib):
        blk = concept_block(lib, code)
        m = re.search(rf'^(\*\*{field}\*\*[^\n]*\n)((?:>[^\n]*\n)+)', blk, re.M)
        assert m, f'{code}: {field} 본문이 없다'
        return lib.replace(blk, blk.replace(m.group(), m.group(1), 1))
    return f


def gold_slide(fn):
    def f(g):
        g = copy.deepcopy(g)
        fn(g['levels'][0]['slides'][3]['blocks'][0]['paragraphs'], g)
        return g
    return f


def reword_3_and_analogy(ps, g, part=True):
    """입문 4장: ③ 두 문장과 속도계 두 문장을 바꿔 말한다. part=False 면 part 를 null 로"""
    for sp, t in ((ps[0]['body'][0], '연준은 1년에 2% 정도 오르는 걸 적당하다고 봐요. '),
                  (ps[0]['body'][1], '0%도 아니고 딱 2%예요.'),
                  (ps[2]['body'][0], '자동차 계기판을 떠올려 보세요. '),
                  (ps[2]['body'][1], '바늘이 지금 속도, 연준이 원하는 눈금은 2예요.')):
        sp['text'] = t
        if not part:
            for r in sp['refs']:
                r['part'] = None


def set_ref(level, slide, path, **kv):
    def f(g):
        g = copy.deepcopy(g)
        o = g['levels'][level]['slides'][slide]
        for k in path:
            o = o[k]
        o['refs'][0].update(kv) if kv else o['refs'][0].pop('part')
        return g
    return f


def contract_section(title_start, old, new):
    def f(c):
        i = c.index(title_start)
        j = c.find('\n## ', i + 1)
        j = len(c) if j < 0 else j
        return c[:i] + sub(c[i:j], old, new, count=10 ** 6) + c[j:]
    return f


# (이름, 대상, 망가뜨리기, 기대 code)
CASES = [
    # ── A. 계약 문서
    ('§9.6 — 계약에 posterior 가 들어옴', 'contract',
     lambda c: sub(c, '## 14. 미확인', '사용자 posterior 로 설명 여부를 정한다\n\n## 14. 미확인'), {'CONTRACT_HELD_TERM'}),
    ('§9.6 — 계약에 half-life', 'contract',
     lambda c: sub(c, '## 14. 미확인', 'forgetting half-life 는 30일\n\n## 14. 미확인'), {'CONTRACT_HELD_TERM'}),
    ('§9.6 — Resolver 구간에 수치 (HIGH ≥ 0.85)', 'contract',
     lambda c: sub(c, '| HIGH | 확실한 매칭 |', '| HIGH | 확실한 매칭 (0.85 이상) |'), {'CONTRACT_HELD_TERM'}),
    ('§9.6 — 관계에 LLM 수치 0.82', 'contract',
     lambda c: sub(c, '- `strength` — **자리만 둔다.', '- `strength` — 기본 0.82. **자리만 둔다.'), {'CONTRACT_HELD_TERM'}),
    ('§9.5 필드 — Concept.merged_into 삭제', 'contract',
     lambda c: sub(c, '  merged_into:    UUID | null      // status 가 MERGED 일 때만\n', ''), {'CONTRACT_FIELD'}),
    ('§9.5 필드 — ConflictingAlias.conflicts_with_meaning 삭제', 'contract',
     lambda c: sub(c, 'ConflictingAlias { alias: string, concept_id: UUID, conflicts_with_meaning: string }',
                   'ConflictingAlias { alias: string, concept_id: UUID }'), {'CONTRACT_FIELD'}),
    ('§4.3 — ConceptRef 에서 version 삭제 (버전 고정 없음)', 'contract',
     lambda c: sub(c, '  version:    integer              // 기사를 쓸 때 쓴 버전\n', ''), {'CONTRACT_FIELD'}),
    ('D25 — ConceptRef 에서 part 삭제', 'contract',
     lambda c: sub(c, '  part:       string | null        // 어느 문안을 재료로 썼나 (D25). null = 문안을 옮기지 않은 언급\n', ''),
     {'CONTRACT_FIELD'}),
    ('§9.5 enum — status 에 ACTIVE 추가', 'contract',
     lambda c: sub(c, '"MERGED" | "DEPRECATED"', '"MERGED" | "DEPRECATED" | "ACTIVE"'), {'CONTRACT_ENUM'}),
    ('§9.5 enum — relation_type 에서 RELATED 삭제', 'contract',
     lambda c: sub(c, ' | "RELATED"\n', '\n'), {'CONTRACT_ENUM'}),
    ('D24 — merge 절에서 "실물 없음" 삭제', 'contract',
     contract_section('## 10. status', '실물 없음', '사례 있음'), {'CONTRACT_NO_REAL'}),
    ('D24 — Resolver 절에서 "실물 없음" 삭제', 'contract',
     contract_section('## 11. Resolver', '실물 없음', '확인됨'), {'CONTRACT_NO_REAL'}),
    ('§9.5 Resolver — AMBIGUOUS 구간 삭제', 'contract',
     contract_section('## 11. Resolver', 'AMBIGUOUS', '보류'), {'CONTRACT_RESOLVER'}),
    ('0.2b 침범 — 계약 타입 블록에 Bridge 정의', 'contract',
     lambda c: sub(c, 'UUID = string\n', 'UUID = string\n\nBridge {\n  bridge_id: UUID\n}\n'), {'CONTRACT_FOREIGN_TYPE'}),
    ('0.2c 침범 — knowledge_evidence 스키마 정의', 'contract',
     lambda c: sub(c, 'UUID = string\n', 'UUID = string\n\nknowledge_evidence {\n  event_id: UUID\n}\n'),
     {'CONTRACT_FOREIGN_TYPE'}),
    # ── 로그 머리 요약
    ('로그 — 질문 5 행의 표시 지움', 'log',
     lambda l: re.sub(r'^\| 5 \|.*$', lambda m: re.sub(r'계약 반영|_open|미확인', '—', m.group()), l, count=1,
                      flags=re.M), None),
    ('로그 — 질문 8 행 삭제', 'log', lambda l: re.sub(r'^\| 8 \|.*\n', '', l, count=1, flags=re.M), {'LOG_QUESTION'}),
    # ── B. 라이브러리
    ('§13-2 — C-0004 를 C-0003 으로 (code 겹침)', 'library',
     lambda t: sub(t, '### C-0004 · `FOMC_ROLE`', '### C-0003 · `FOMC_ROLE`'), {'LIB_DUP', 'LIB_RELATION_TARGET'}),
    ('§13-3 — canonical_name 겹침', 'library',
     lambda t: sub(t, '### C-0009 · `FEDERAL_VS_STATE`', '### C-0009 · `POLICY_STATEMENT_VS_RULE`'), {'LIB_DUP'}),
    ('§13-4 — status ACTIVE', 'library', lib_in('C-0007', '`status`: CANONICAL', '`status`: ACTIVE'), {'LIB_STATUS'}),
    ('§13-5 — C-0002 버전을 하나 올림, CHANGELOG 에 그 버전 없음', 'library',
     bump_version('C-0002'), {'LIB_VERSION'}),
    ('§13-5 — CHANGELOG 에서 C-0005 v2 줄 삭제 (v2 이력 빠짐)', 'library',
     lambda t: sub(t, ' · C-0005 v2 — REFRESHER 교체', ' · REFRESHER 교체'), {'LIB_VERSION'}),
    ('§13-7 — C-0009 REFRESHER 본문 삭제', 'library',
     drop_field_body('C-0009', 'REFRESHER'), {'LIB_MISSING'}),
    ('§13-8 — 🔗 슬롯이 없는 단계 뒤 (③ → ⑤ 바로 다음)', 'library',
     lib_in('C-0002', '③ 바로 다음에', '⑤ 바로 다음에'), {'LIB_BRIDGE_SLOT'}),
    ('§13-8 — 🔗 브리지 메모 통째 삭제 → 비유가 없는 ④ 를 요구', 'library',
     lib_in('C-0002', '> 🔗 **④ 지금 상태 — 브리지 몫. 기사가 붙인다**', '> 메모'), {'LIB_ANALOGY_REQUIRES'}),
    ('§13-9 — "dynamic pricing" 을 C-0001 alias 에도 (충돌 표시 없음)', 'library',
     lib_in('C-0001', '통화정책 전달\n', '통화정책 전달, dynamic pricing\n'), {'LIB_ALIAS_COLLISION'}),
    ('§13-9 — 다른 개념의 canonical_name 을 alias 로 (C-0006 에 FOMC_ROLE)', 'library',
     lib_in('C-0006', '경제전망요약\n', '경제전망요약, FOMC_ROLE\n'), {'LIB_ALIAS_COLLISION'}),
    ('§13-9 — C-0010 alias 에서 dynamic pricing 삭제 (충돌 별칭이 붙을 alias 없음)', 'library',
     lib_in('C-0010', ' dynamic pricing(주법 용례),', ''), {'LIB_CONFLICT_ALIAS'}),
    ('§13-10 — prereq 가 없는 개념 C-0099', 'library',
     lib_in('C-0006', '`prereq`: C-0004', '`prereq`: C-0099'), {'LIB_RELATION_TARGET'}),
    ('§13-10 — 선행 순환 (C-0003 → C-0001 추가)', 'library',
     lib_in('C-0001', '`prereq_of`: C-0003', '`prereq_of`: C-0003\n- `prereq`: C-0003'), {'LIB_RELATION_CYCLE'}),
    # ── C. 골든
    ('§13-12 — 옛 문자열 "C-0002" 를 ref 로 (code 는 참조에 쓰지 않는다)', 'gold',
     lambda g: (lambda g: (g['levels'][0]['slides'][2]['headline'][0].__setitem__('refs', ['C-0002']), g)[1])(
         copy.deepcopy(g)), {'GOLD_REF_SHAPE'}),
    ('§13-14 — ③ 문안 span 의 refs 를 C-0003 으로', 'gold',
     gold_slide(lambda ps, g: ps[0]['body'][0]['refs'][0].update(concept_id=UID['C-0003'], version=CUR['C-0003'], part=None)),
     {'GOLD_REF_SOURCE'}),
    ('§13-14 — C-0001 FULL 문안을 fact 층으로', 'gold',
     lambda g: (lambda g: (g['levels'][0]['slides'][4]['blocks'][0]['paragraphs'][0]['body'][0]
                           .__setitem__('layer', 'fact'), g)[1])(copy.deepcopy(g)), {'GOLD_REF_SOURCE'}),
    ('§13-13 — ④ 브리지 두 span 삭제 (③ → 속도계)', 'gold',
     gold_slide(lambda ps, g: ps.pop(1)), {'GOLD_BRIDGE_ORDER', 'GOLD_ANALOGY_ORDER'}),
    ('§13-13 — 속도계를 ④ 앞으로 (문단 순서 바꿈)', 'gold',
     gold_slide(lambda ps, g: ps.insert(1, ps.pop(2))), {'GOLD_BRIDGE_ORDER', 'GOLD_ANALOGY_ORDER'}),
    ('§13-13 — ③ 과 ④ 사이에 writing span 하나 ("바로 다음" 위반)', 'gold',
     gold_slide(lambda ps, g: ps[1]['body'].insert(0, {'text': '그럼 지금은요? ', 'layer': 'writing', 'refs': []})),
     {'GOLD_BRIDGE_ORDER'}),
    ('§13-13 — ④ 브리지 두 span 을 fact 층으로 (브리지가 없다)', 'gold',
     gold_slide(lambda ps, g: [sp.__setitem__('layer', 'fact') for sp in ps[1]['body']]),
     {'GOLD_BRIDGE_ORDER', 'GOLD_ANALOGY_ORDER'}),
    ('§13-13 — 속도계를 ③ 앞 장(입문 3장)으로', 'gold',
     lambda g: (lambda g: (g['levels'][0]['slides'][2]['blocks'][0]['paragraphs'].append(
         g['levels'][0]['slides'][3]['blocks'][0]['paragraphs'].pop(2)), g)[1])(copy.deepcopy(g)),
     {'GOLD_ANALOGY_ORDER'}),
    # ── C'. ConceptRef 로 옮긴 골든 사본 (mgold) — part 기반 (D25)
    ('D25 — 게이트 전 빈틈: ③ · 비유를 바꿔 말하고 ④ 지움. part 가 있으니 이제 잡힌다', 'mgold',
     gold_slide(lambda ps, g: (reword_3_and_analogy(ps, g), ps.pop(1))), {'GOLD_BRIDGE_ORDER', 'GOLD_ANALOGY_ORDER'}),
    ('D25 — ③ 만 바꿔 말하고 ④ 지움, 비유도 뺌 (글자 대조로는 아무 단서가 없다)', 'mgold',
     gold_slide(lambda ps, g: (reword_3_and_analogy(ps, g), ps.pop(2), ps.pop(1))), {'GOLD_BRIDGE_ORDER'}),
    ('빈틈 — 바꿔 말한 ③ · 비유에 part null 을 달고 ④ 지움. 게이트 3 몫이라 기계는 못 잡는다', 'mgold',
     gold_slide(lambda ps, g: (reword_3_and_analogy(ps, g, part=False), ps.pop(1))), set()),
    ('§13-14 — 글자 그대로인 ③ span 에 part null', 'mgold',
     gold_slide(lambda ps, g: ps[0]['body'][0]['refs'][0].__setitem__('part', None)), {'GOLD_PART_MISMATCH'}),
    ('§13-14 — 글자 그대로인 C-0005 REFRESHER span 에 part "FULL"', 'mgold',
     set_ref(1, 3, ['blocks', 1, 'paragraphs', 1, 'body', 0], part='FULL'), {'GOLD_PART_MISMATCH'}),
    ('§13-12 — 그 버전에 없는 part (헤드라인에 "FULL:⑤")', 'mgold',
     set_ref(0, 2, ['headline', 0], part='FULL:⑤'), {'GOLD_PART_UNKNOWN'}),
    ('§13-12 — 없는 버전 (C-0002 의 지금 버전 + 1)', 'mgold', set_ref(0, 2, ['headline', 0], version=CUR['C-0002'] + 1),
     {'GOLD_REF_VERSION'}),
    ('§13-12 — 풀 수 없는 concept_id', 'mgold',
     set_ref(0, 2, ['headline', 0], concept_id='00000000-0000-0000-0000-000000000000'), {'GOLD_REF_UNKNOWN'}),
    ('§3.2 — ConceptRef 에 part 필드가 없다', 'mgold', set_ref(0, 2, ['headline', 0]), {'GOLD_REF_SHAPE'}),
]


# ── D. 저장소 (concept-library.json) — 0.2m-a
STORE = json.load(open(V.STORE, encoding='utf-8'))
SCODE = {c['code']: c['concept_id'] for c in STORE['concepts']}


def st_(fn):
    def f(st):
        st = copy.deepcopy(st)
        fn(st)
        return st
    return f


def concept(st, code):
    return next(c for c in st['concepts'] if c['code'] == code)


def version(st, code):
    return next(v for v in st['versions'] if v['concept_id'] == SCODE[code])


STORE_CASES = [
    # (이름, 대상 'store' | 'library', 변형, 기대 code)
    ('§13-1 — concept_id 가 code 문자열', 'store', st_(lambda st: concept(st, 'C-0004').__setitem__('concept_id', 'C-0004')),
     {'STORE_KEY'}),
    ('§13-1 — 두 개념이 같은 concept_id', 'store',
     st_(lambda st: concept(st, 'C-0004').__setitem__('concept_id', SCODE['C-0001'])), {'STORE_KEY'}),
    ('§13-4 — MERGED 인데 merged_into 없음', 'store', st_(lambda st: concept(st, 'C-0007').__setitem__('status', 'MERGED')),
     {'STORE_STATUS'}),
    ('§1 — Concept 에 계약에 없는 필드 (label)', 'store', st_(lambda st: concept(st, 'C-0001').__setitem__('label', '금리')),
     {'STORE_SHAPE'}),
    ('§1 — ConceptVersion 에서 basis 삭제', 'store', st_(lambda st: version(st, 'C-0001').pop('basis')), {'STORE_SHAPE'}),
    ('§13-15 — used_in 을 저장소에 저장', 'store',
     st_(lambda st: version(st, 'C-0001')['authoring']['notes'].append('used_in: FOMC-20260916')), {'STORE_USED_IN'}),
    ('독자 글 — 저장소 C-0002 FULL ③ 한 글자 바꿈 ("딱" → "꼭")', 'store',
     st_(lambda st: (lambda step: step.__setitem__('text', step['text'].replace('딱', '꼭')))(version(st, 'C-0002')['full'][2])),
     {'STORE_TEXT'}),
    ('독자 글 — 저장소 C-0002 FULL ② 굵게 표시만 뺌', 'store',
     st_(lambda st: (lambda step: step.__setitem__('text', step['text'].replace('**', '')))(version(st, 'C-0002')['full'][1])),
     {'STORE_TEXT'}),
    ('독자 글 — 저장소 C-0010 BOUNDARY 극성 뒤집음', 'store',
     st_(lambda st: version(st, 'C-0010')['boundary'][0].__setitem__('applies', True)), {'STORE_TEXT'}),
    ('독자 글 — md 의 C-0001 REFRESHER 를 고치고 저장소에 새 버전을 안 만듦', 'library',
     lib_in('C-0001', '약해지는 방향으로 작용합니다.', '약해집니다.'), {'STORE_TEXT'}),
    ('§13-1 — md 의 concept_id 줄을 다른 UUID 로 (두 곳이 어긋남)', 'library',
     lambda t: sub(t, SCODE['C-0006'], '00000000-0000-4000-8000-000000000000'), {'STORE_MD_META'}),
    ('§13-5 — 저장소 버전만 올림 (문안 한 벌이 없다)', 'store', st_(lambda st: concept(st, 'C-0001').__setitem__('version', 2)),
     {'STORE_VERSION', 'STORE_MD_META', 'STORE_TEXT'}),
    ('§13-5 — 버전 이력에서 C-0005 v2 삭제', 'store',
     st_(lambda st: st['_version_history'].remove(next(h for h in st['_version_history'] if (h['code'], h['version']) == ('C-0005', 2)))),
     {'STORE_VERSION'}),
    ('§13-8 — 슬롯 after 를 ⑤ 로', 'store', st_(lambda st: version(st, 'C-0002')['bridge_slots'][0].__setitem__('after', '⑤')),
     {'STORE_SLOT', 'STORE_MD_META'}),
    ('§13-8 — 비유 requires 에서 ④ 를 뺌 (속도계가 브리지 없이도 된다)', 'store',
     st_(lambda st: version(st, 'C-0002')['analogies'][0]['requires'].remove('④')), {'STORE_MD_META'}),
    ('§13-9 — ConflictingAlias 삭제 (다른 것의 같은 이름이 사라진다)', 'store', st_(lambda st: st['conflicting_aliases'].clear()),
     {'STORE_CONFLICT'}),
    ('§13-9 — 같은 alias 를 두 개념에 (충돌 표시 없음)', 'store',
     st_(lambda st: st['aliases'].append(dict(st['aliases'][0], concept_id=SCODE['C-0004']))), {'STORE_CONFLICT', 'STORE_ALIAS'}),
    ('§13-10 — 같은 쌍을 거꾸로 한 번 더 (C-0003 → C-0002)', 'store',
     st_(lambda st: st['relations'].append(dict(st['relations'][0], from_id=st['relations'][0]['to_id'], to_id=st['relations'][0]['from_id']))),
     {'STORE_RELATION'}),
    ('§9 — strength 에 값', 'store', st_(lambda st: st['relations'][0].__setitem__('strength', 1)), {'STORE_RELATION'}),
    ('§13-10 — 관계의 끝이 없는 개념', 'store',
     st_(lambda st: st['relations'][0].__setitem__('to_id', '00000000-0000-4000-8000-000000000000')), {'STORE_RELATION'}),
    ('§13-10 — 선행 관계 하나를 뺌 (md 의 prereq 줄과 어긋남)', 'store', st_(lambda st: st['relations'].pop(0)), {'STORE_RELATION'}),
]


def run_store_cases():
    ok = True
    base = V.run(CONTRACT, LIBRARY, GOLD, LOG, None, STORE)[0]
    print(f'\n== 저장소 — 사본 {len(STORE_CASES)}개')
    print(f'  {"PASS" if not base else "FAIL"}  망가뜨리지 않은 저장소는 통과해야 한다')
    print(f'        기대 — / 실제 {sorted({c for c, _ in base}) or "—"}')
    ok &= not base
    for name, target, fn, want in STORE_CASES:
        lib_text, st = (fn(LIBRARY), STORE) if target == 'library' else (LIBRARY, fn(STORE))
        errs = V.run(CONTRACT, lib_text, GOLD, LOG, None, st)[0]
        got = {c for c, _ in errs if c.startswith('STORE_')}
        passed = got == want
        ok &= passed
        print(f'  {"PASS" if passed else "FAIL"}  {name}')
        print(f'        기대 {sorted(want)} / 실제 {sorted(got) or "—"}')
        if not passed:
            for c, m in errs:
                print(f'          {c}: {m}')
    return ok


def main():
    base = V.run(CONTRACT, LIBRARY, GOLD, LOG, ID_MAP)[0]
    ok = not base
    print(f'== verify-concept-identity.py — 사본 {len(CASES)}개 (+ 원본)')
    print(f'  {"PASS" if not base else "FAIL"}  망가뜨리지 않은 원본은 통과해야 한다')
    print(f'        기대 — / 실제 {sorted({c for c, _ in base}) or "—"}')
    for name, target, fn, want in CASES:
        want = {'LOG_QUESTION'} if want is None else want
        args = {'contract': CONTRACT, 'library': LIBRARY, 'gold': GOLD, 'mgold': MGOLD, 'log': LOG}
        args[target] = fn(args[target])
        gold = args['mgold'] if target == 'mgold' else args['gold']
        errs = V.run(args['contract'], args['library'], gold, args['log'], ID_MAP)[0]
        got = {c for c, _ in errs}
        passed = got == want
        ok &= passed
        print(f'  {"PASS" if passed else "FAIL"}  {name}')
        print(f'        기대 {sorted(want) or "— (못 잡음)"} / 실제 {sorted(got) or "—"}')
        if not passed:
            for c, m in errs:
                print(f'          {c}: {m}')
    ok &= run_store_cases()
    print('\nOK' if ok else '\nFAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
