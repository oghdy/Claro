"""verify-concept-identity.py 가 실제로 실패할 수 있는지 — 일부러 망가뜨린 사본으로 확인한다 (B-0.2a).

    python3 scripts/selftest-verify-concept-identity.py

계약 · 로그 · 라이브러리 · 골든의 사본(메모리 안, 파일로 남기지 않는다)에 위반을 하나씩 넣고
기대한 code 만 나오는지 본다 (다른 code 가 섞이면 실패). 망가뜨리지 않은 원본은 통과해야 한다.
"알려진 빈틈" 행은 망가뜨렸는데 **못 잡는 것**이 기대값이다 — 계약 §6.3 · _open-1 이 적은 빈틈을 실제로 보인다.
"""
import copy, importlib.util, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('vci', os.path.join(ROOT, 'scripts/verify-concept-identity.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)

read = lambda p: open(p, encoding='utf-8').read()
CONTRACT, LIBRARY, LOG = read(V.CONTRACT), read(V.LIBRARY), read(V.LOG)
GOLD = json.load(open(V.GOLDEN, encoding='utf-8'))


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


def gold_slide(fn):
    def f(g):
        g = copy.deepcopy(g)
        fn(g['levels'][0]['slides'][3]['blocks'][0]['paragraphs'], g)
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
    ('§13-5 — C-0002 v4, CHANGELOG 에 v4 없음', 'library',
     lib_in('C-0002', '`version`: v3 (2026-09-29)', '`version`: v4 (2026-09-30)'), {'LIB_VERSION'}),
    ('§13-5 — CHANGELOG 에서 C-0005 v2 줄 삭제 (v2 이력 빠짐)', 'library',
     lambda t: sub(t, ' · C-0005 v2 — REFRESHER 교체', ' · REFRESHER 교체'), {'LIB_VERSION'}),
    ('§13-7 — C-0009 REFRESHER 본문 삭제', 'library',
     lib_in('C-0009', '> 연방과 주는 권한이 달라서 규제 강도가 다를 수 있습니다.\n', ''), {'LIB_MISSING'}),
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
    ('§13-12 — concept ref 가 라이브러리에 없다 (헤드라인 → C-0099)', 'gold',
     lambda g: (lambda g: (g['levels'][0]['slides'][2]['headline'][0].__setitem__('refs', ['C-0099']), g)[1])(
         copy.deepcopy(g)), {'GOLD_REF_UNKNOWN'}),
    ('§13-14 — ③ 문안 span 의 refs 를 C-0003 으로', 'gold',
     gold_slide(lambda ps, g: ps[0]['body'][0].__setitem__('refs', ['C-0003'])), {'GOLD_REF_SOURCE'}),
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
    ('③ 을 바꿔 말하고 ④ 를 지움 — 비유가 문안 그대로라 비유 쪽에서 잡힌다', 'gold',
     gold_slide(lambda ps, g: (ps[0]['body'][0].__setitem__('text', '연준은 1년에 2% 정도 오르는 걸 적당하다고 봐요. '),
                               ps[0]['body'][1].__setitem__('text', '0%도 아니고 딱 2%예요.'),
                               ps.pop(1))), {'GOLD_ANALOGY_ORDER'}),
    ('알려진 빈틈 (_open-1) — ③ 과 비유를 둘 다 바꿔 말하고 ④ 를 지움. 못 잡는 것이 기대값', 'gold',
     gold_slide(lambda ps, g: (ps[0]['body'][0].__setitem__('text', '연준은 1년에 2% 정도 오르는 걸 적당하다고 봐요. '),
                               ps[0]['body'][1].__setitem__('text', '0%도 아니고 딱 2%예요.'),
                               ps[2]['body'][0].__setitem__('text', '자동차 계기판을 떠올려 보세요. '),
                               ps[2]['body'][1].__setitem__('text', '바늘이 지금 속도, 연준이 원하는 눈금은 2예요.'),
                               ps.pop(1))), set()),
]


def main():
    base = V.run(CONTRACT, LIBRARY, GOLD, LOG)[0]
    ok = not base
    print(f'== verify-concept-identity.py — 사본 {len(CASES)}개 (+ 원본)')
    print(f'  {"PASS" if not base else "FAIL"}  망가뜨리지 않은 원본은 통과해야 한다')
    print(f'        기대 — / 실제 {sorted({c for c, _ in base}) or "—"}')
    for name, target, fn, want in CASES:
        want = {'LOG_QUESTION'} if want is None else want
        args = {'contract': CONTRACT, 'library': LIBRARY, 'gold': GOLD, 'log': LOG}
        args[target] = fn(args[target])
        errs = V.run(args['contract'], args['library'], args['gold'], args['log'])[0]
        got = {c for c, _ in errs}
        passed = got == want
        ok &= passed
        print(f'  {"PASS" if passed else "FAIL"}  {name}')
        print(f'        기대 {sorted(want) or "— (못 잡음)"} / 실제 {sorted(got) or "—"}')
        if not passed:
            for c, m in errs:
                print(f'          {c}: {m}')
    print('\nOK' if ok else '\nFAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
