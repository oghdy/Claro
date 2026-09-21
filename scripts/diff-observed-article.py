"""observed ↔ article 슬라이드별 diff (B-0.0b).

    python3 scripts/diff-observed-article.py

독자에게 보이는 단위(kicker · h1 · 블록 안 문장/행/카드 · teaser)와 블록 속성(variant, style, modifier)을
비교한다. "_" 로 시작하는 주석 필드는 비교하지 않는다. 슬라이드는 kicker+h1 로 정렬하고,
index / goto_index 가 밀리기만 한 것은 따로 "기계적" 으로 표시한다.
"""
import difflib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBS = os.path.join(ROOT, 'fixtures/fomc-2026-09.observed.json')
ART = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')


def units(s):
    out = [('kicker', s['kicker']), ('h1', s['h1'].replace('\n', '⏎'))]
    for i, b in enumerate(s['blocks']):
        t = b['type']
        attrs = ''.join(f'[{b[k]}]' for k in ('variant', 'modifier', 'style_attr') if b.get(k))
        head = f'b{i} {t}{attrs}'
        if t == 'body_text':
            for j, p in enumerate(b['paragraphs']):
                cls = ''.join('.' + c for c in p.get('classes', []))
                out.append((f'{head} p{j}{cls}', p['html']))
        elif t in ('callout', 'closing'):
            out.append((head, b['html']))
        elif t == 'quote':
            out.append((f'{head} tag', b.get('tag') or ''))
            out.append((head, b['html']))
        elif t == 'votes':
            for j, c in enumerate(b['cards']):
                out.append((f'{head} c{j}' + (f'.{c["modifier"]}' if c.get('modifier') else ''),
                            f"{c['when']} | {c['tally']} | {c['what_html']}"))
        elif t == 'timeline':
            for j, x in enumerate(b['items']):
                out.append((f'{head} i{j}', f"{x['when']} | {x['html']}"))
        elif t == 'stats':
            for j, r in enumerate(b['rows']):
                out.append((f'{head} r{j}' + (f'.{r["v_modifier"]}' if r.get('v_modifier') else ''), f"{r['k']} | {r['v']}"))
        elif t == 'gauge':
            out.append((f'{head} marks', ' '.join(str(m['left_percent']) for m in b['marks'])))
            for j, l in enumerate(b['labels']):
                out.append((f'{head} l{j}.{l["role"]}@{l["left_percent"]}', f"{l['value_html']} {l['caption']}"))
        elif t == 'end_actions':
            out.append((f'{head} check', b['check']))
            for j, x in enumerate(b['buttons']):
                out.append((f'{head} btn{j}→{x["goto_index"]}', x['label']))
        else:
            out.append((head, json.dumps(b, ensure_ascii=False)))
    if s.get('teaser'):
        out.append(('teaser', f"{s['teaser']['qmark']} {s['teaser']['qtext']}"))
    return out


def key(s):
    return (s['kicker'], s['h1'])


def main():
    obs = json.load(open(OBS, encoding='utf-8'))
    art = json.load(open(ART, encoding='utf-8'))
    changed_slides = []
    total = {'changed': 0, 'added': 0, 'removed': 0}
    for lo, la in zip(obs['levels'], art['levels']):
        so, sa = lo['slides'], la['slides']
        print(f"\n=== {la['id']} ({la.get('label')})  observed {len(so)}장 → article {len(sa)}장 ===")
        sm = difflib.SequenceMatcher(a=[key(s) for s in so], b=[key(s) for s in sa], autojunk=False)
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
                    changed_slides.append((la['id'], f'obs{i}'))
                    continue
                if i is None:
                    print(f'\n (없음) → art[{j}]  ■ 새 슬라이드')
                    for lab, txt in units(sa[j]):
                        print(f'    + {lab:<34} {txt}')
                        total['added'] += 1
                    changed_slides.append((la['id'], j))
                    continue
                a, b = so[i], sa[j]
                mech = []
                if a['index'] != b['index']:
                    mech.append(f"index {a['index']}→{b['index']}")
                ga = (a.get('teaser') or {}).get('goto_index')
                gb = (b.get('teaser') or {}).get('goto_index')
                if ga != gb:
                    mech.append(f'goto {ga}→{gb}')
                ua, ub = units(a), units(b)
                if ua == ub:
                    print(f"\n obs[{i}] → art[{j}]  본문 변경 없음" + (f"  (기계적: {', '.join(mech)})" if mech else ''))
                    continue
                print(f"\n obs[{i}] → art[{j}]  ■ 변경" + (f"  (기계적: {', '.join(mech)})" if mech else ''))
                changed_slides.append((la['id'], j))
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
