"""ARTICLE_PACKAGE.md 가 실물과 결정을 빠짐없이 다뤘는지 본다 (B-0.1a).

    python3 scripts/verify-contract-coverage.py

계약의 옳고 그름이 아니라 **빠짐**을 잡는다.
  1. 골든의 모든 경로, FTC observed 의 블록 경로가 부록 A 에 있다
  2. 계약이 D8 · D11 ~ D17 을 언급한다
  3. 근거 기사가 하나뿐인 원형에 "근거 1건"이 적혀 있다 (§7.2)
  4. 원형마다 절이 있고 그 절에 "정규 텍스트"가 있다 (D14 규칙 1)
  5. 본문에서 쓴 _open-N 이 전부 §11 에 정의돼 있다
  6. §12 "골든과 다른 점"에 게이지 눈금 [33, 62] 이 있다
  7. 0.2 소관 타입(Fact · Claim · Concept · Bridge · Storyline · Event · Source)을 정의하지 않았다
  8. development-backend.md 의 "Step 0.1a 가 답해야 할 것" 표 항목마다 처리 표시가 있다
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/ARTICLE_PACKAGE.md')
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
FTC = os.path.join(ROOT, 'fixtures/ftc-2026-08.observed.json')
DEVDOC = os.path.join(ROOT, 'docs/development-backend.md')

MARKS = ('계약 반영', '_open', '0.2 로', '범위 밖')
REQUIRED_D = ('D8', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17')
FORBIDDEN_TYPES = ('Fact', 'Claim', 'Concept', 'Bridge', 'Storyline', 'Event', 'Source')


def leaf_paths(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from leaf_paths(v, f'{p}.{k}')
    elif isinstance(o, list):
        for v in o:
            yield from leaf_paths(v, f'{p}[]')
    else:
        yield p


def observed_paths(path, blocks_only=False):
    d = json.load(open(path, encoding='utf-8'))
    out = set()
    for lv in d['levels']:
        for s in lv['slides']:
            for b in s['blocks']:
                out |= {f"block:{b['type']}{p}" for p in leaf_paths(b)}
            if not blocks_only:
                for k, v in s.items():
                    if k != 'blocks':
                        out |= {f'slide.{k}{p}' for p in leaf_paths(v)}
        if not blocks_only:
            out |= {f'level.{k}' for k in lv if k != 'slides'}
    if not blocks_only:
        for k, v in d.items():
            if k != 'levels':
                out |= {f'top.{k}{p}' for p in leaf_paths(v)}
    return out


def section(text, heading_re):
    m = re.search(heading_re, text, re.M)
    if not m:
        return ''
    level = len(re.match(r'#+', m.group(0)).group(0))
    rest = text[m.end():]
    end = re.search(rf'^#{{1,{level}}} ', rest, re.M)
    return rest[:end.start()] if end else rest


def main():
    c = open(CONTRACT, encoding='utf-8').read()
    fails, lines = 0, []

    def report(ok, name, detail=''):
        nonlocal fails
        fails += not ok
        lines.append(f"{'PASS' if ok else 'FAIL'}  {name}" + (f'\n      {detail}' if detail else ''))

    # 1. 부록 A 커버리지
    appx = section(c, r'^## 부록 A')
    entries = re.findall(r'^\| `([^`]+)` \|', appx, re.M)
    exact = {e for e in entries if not e.endswith('.*')}
    prefixes = [e[:-2] for e in entries if e.endswith('.*')]
    def covered(p):
        return p in exact or any(p == x or p.startswith(x + '.') or p.startswith(x + '[') for x in prefixes)
    obs = observed_paths(GOLDEN) | observed_paths(FTC, blocks_only=True)
    miss = sorted(p for p in obs if not covered(p))
    unused = sorted(e for e in exact if e not in obs)
    report(not miss, f'1. 관측 경로 {len(obs)}개가 부록 A({len(entries)}행)에 있다',
           f'빠진 경로: {miss}' if miss else '')
    if unused:
        lines.append(f'WARN  부록 A 에만 있고 실물에 없는 경로: {unused}')

    # 2. 결정 언급
    absent = [d for d in REQUIRED_D if not re.search(rf'\b{d}\b', c)]
    report(not absent, f'2. {" · ".join(REQUIRED_D)} 언급', f'없음: {absent}' if absent else '')

    # 3. 근거 1건 표시
    tbl = section(c, r'^### 7\.2 ')
    rows = re.findall(r'^\| `(\w+)` [^|]*\|[^|]*\|[^|]*\| ([^|]+) \|', tbl, re.M)
    bad = [t for t, ev in rows if '둘 다' not in ev and '근거 1건' not in ev]
    report(rows and not bad, f'3. 원형 {len(rows)}개 — 근거 기사 하나뿐인 원형에 "근거 1건"',
           f'표시 없음: {bad}' if bad else f'{[(t, "둘 다" if "둘 다" in ev else "근거 1건") for t, ev in rows]}')

    # 4. 원형마다 절 + 정규 텍스트
    no_sec = []
    for t, _ in rows:
        sec = section(c, rf'^### 7\.\d+ `{t}`')
        if '정규 텍스트' not in sec:
            no_sec.append(t)
    report(rows and not no_sec, '4. 원형마다 절이 있고 "정규 텍스트"가 정의돼 있다',
           f'없음: {no_sec}' if no_sec else '')

    # 5. _open 정의
    used = set(re.findall(r'_open-(\d+)', c))
    defined = set(re.findall(r'^\| _open-(\d+) \|', section(c, r'^## 11\. '), re.M))
    report(used and used <= defined, f'5. 쓰인 _open {sorted(used, key=int)} 이 §11 에 정의됨',
           f'정의 없음: {sorted(used - defined)}' if used - defined else '')

    # 6. 게이지 위반이 골든과 다른 점에
    diff = section(c, r'^## 12\. ')
    report('[33, 62]' in diff, '6. §12 에 게이지 눈금 [33, 62]')

    # 7. 0.2 타입 정의 금지
    code = '\n'.join(re.findall(r'```ts\n(.*?)```', c, re.S))
    defs = [t for t in FORBIDDEN_TYPES if re.search(rf'^\s*{t}\s*\{{', code, re.M)]
    report(not defs, '7. 0.2 소관 타입을 정의하지 않음', f'정의됨: {defs}' if defs else '')

    # 8. findings 처리 표시
    dev = open(DEVDOC, encoding='utf-8').read()
    s01 = section(dev, r'^## Step 0\.1a 가 답해야 할 것')
    body_rows = [r for r in re.findall(r'^\|(.+)\|\s*$', s01, re.M)
                 if not re.match(r'\s*(#|관찰|---)', r.split('|')[0]) and not set(r) <= set('-| ')]
    unmarked = [r.split('|')[0].strip() or r.split('|')[1].strip()[:20] for r in body_rows
                if not any(m in r.split('|')[-1] for m in MARKS)]
    report(body_rows and not unmarked, f'8. 0.1a 표 {len(body_rows)}행 전부 처리 표시 ({" / ".join(MARKS)})',
           f'표시 없음: {unmarked}' if unmarked else '')

    print('\n'.join(lines))
    print('\nOK' if not fails else f'\n{fails}개 실패')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
