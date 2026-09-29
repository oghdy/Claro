"""observed ↔ article 슬라이드별 독자 글 diff (B-0.0b → B-0.1b 에서 새 골든 모양에 맞춤).

    python3 scripts/diff-observed-article.py

observed(프로토타입 옮겨 적기)와 골든(계약 모양)이 **독자에게 보이는 글**에서 어디가 다른지 본다 —
0.0b 게이트가 고친 곳이 여기 나온다. 비교 단위는 compare-reader-text.py 와 같다:
kicker · headline · 블록 안 글(문단 · 인용 · 목록 · 대조 · 표) · open_question.
관측 전용 표시(variant · modifier · style · 눈금 · teaser 기호 · end_actions)는 계약이 버려서 비교하지 않는다.
슬라이드는 headline 으로 정렬하고(kicker 는 바뀔 수 있다 — 게이트에서 ①①②→①②③), 덱 안에서 headline 이 겹치면 멈춘다.
"""
import difflib, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBS = os.path.join(ROOT, 'fixtures/fomc-2026-09.observed.json')
ART = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')

_spec = importlib.util.spec_from_file_location('compare_reader_text', os.path.join(ROOT, 'scripts/compare-reader-text.py'))
CRT = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(CRT)


def units(s):
    out = [('kicker', s['kicker']), ('headline', s['headline'].replace('\n', '⏎'))]
    for j, (kind, _shape, us) in enumerate(s['blocks']):
        out += [(f'b{j} {kind} {lab}', txt.replace('\n', '⏎')) for lab, txt in us]
    if s['oq'] is not None:
        out.append(('open_question', s['oq']))
    return out


def main():
    obs = CRT.old_units(json.load(open(OBS, encoding='utf-8')))
    art = CRT.new_units(json.load(open(ART, encoding='utf-8')))
    changed_slides = []
    total = {'changed': 0, 'added': 0, 'removed': 0}
    for lid in art:
        so, sa = obs[lid], art[lid]
        for deck in (so, sa):
            hs = [s['headline'] for s in deck]
            if len(hs) != len(set(hs)):
                sys.exit(f"{lid}: headline 이 겹쳐 슬라이드를 정렬할 수 없다")
        print(f"\n=== {lid}  observed {len(so)}장 → article {len(sa)}장 ===")
        sm = difflib.SequenceMatcher(a=[s['headline'] for s in so], b=[s['headline'] for s in sa], autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            pairs = []
            if op in ('equal', 'replace'):
                pairs += list(zip(range(i1, i2), range(j1, j2)))
            if op in ('replace', 'insert') and (j2 - j1) > (i2 - i1):
                pairs += [(None, j) for j in range(j1 + (i2 - i1), j2)]
            if op in ('replace', 'delete') and (i2 - i1) > (j2 - j1):
                pairs += [(i, None) for i in range(i1 + (j2 - j1), i2)]
            for i, j in pairs:
                if j is None:
                    print(f'\n obs[{i}] → (삭제)')
                    total['removed'] += 1
                    changed_slides.append((lid, f'obs{i}'))
                    continue
                if i is None:
                    print(f'\n (없음) → art[{j}]  ■ 새 슬라이드')
                    for lab, txt in units(sa[j]):
                        print(f'    + {lab:<34} {txt}')
                        total['added'] += 1
                    changed_slides.append((lid, j))
                    continue
                ua, ub = units(so[i]), units(sa[j])
                if ua == ub:
                    print(f"\n obs[{i}] → art[{j}]  본문 변경 없음")
                    continue
                print(f"\n obs[{i}] → art[{j}]  ■ 변경")
                changed_slides.append((lid, j))
                um = difflib.SequenceMatcher(a=ua, b=ub, autojunk=False)
                for uop, x1, x2, y1, y2 in um.get_opcodes():
                    if uop == 'equal':
                        continue
                    for lab, txt in ua[x1:x2]:
                        print(f'    - {lab:<34} {txt}')
                        total['removed'] += 1
                    for lab, txt in ub[y1:y2]:
                        print(f'    + {lab:<34} {txt}')
                        total['added'] += 1
    print(f"\n요약: 본문이 바뀐 슬라이드 {changed_slides}")
    print(f"      - 단위 {total['removed']}개 / + 단위 {total['added']}개 (슬라이드 삭제 {sum(1 for c in changed_slides if str(c[1]).startswith('obs'))})")
    return 0


if __name__ == '__main__':
    sys.exit(main())
