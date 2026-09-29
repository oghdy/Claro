"""ARTICLE_PACKAGE.md 가 실물과 결정을 빠짐없이 다뤘는지 본다 (B-0.1a, D20 · D22 반영).

    python3 scripts/verify-contract-coverage.py

계약의 옳고 그름이 아니라 **빠짐**을 잡는다.
  1. 골든의 모든 경로, FTC observed 의 블록 경로가 부록 A 에 있다
  2. 계약이 D8 · D11 ~ D17 · D20 · D22 를 언급한다
  3. 원형은 정확히 5개(D20 — scale 없음), Block 유니언도 같고, 근거 기사 하나뿐인 원형에 "근거 1건"
  4. 원형마다 절이 있고 그 절에 "정규 텍스트"가 있다 (D14 규칙 1)
  5. §11 의 _open 5개가 전부 "판정됨 → D20" 이고, §11 밖에 남은 _open-N 이 없다
  6. §12 에 "게이지 → contrast 두 항목. 글자는 그대로" 와 버리는 눈금 [33, 62] 이 있다
  7. 0.2 소관 타입(Fact · Claim · Concept · Bridge · Storyline · Event · Source)을 정의하지 않았다
  8. development-backend.md 의 "Step 0.1a 가 답해야 할 것" 표 항목마다 처리 표시가 있다
  9. D20 이 정한 나머지가 계약에 있다 — 레벨 어휘 3단계, 층 판정 규칙, 0.2 대기 표시(§6 · §9), 척도 미확인(§10)
 10. D22 — Level 에 label 이 없고 단일 레벨은 levels.length == 1 로 안다.
     이란 전망 문장은 claim · need "DerivedClaim", 이란 규칙은 사실 서술 문장에만
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT = os.path.join(ROOT, 'docs/contract/ARTICLE_PACKAGE.md')
GOLDEN = os.path.join(ROOT, 'fixtures/fomc-2026-09.article.json')
FTC = os.path.join(ROOT, 'fixtures/ftc-2026-08.observed.json')
DEVDOC = os.path.join(ROOT, 'docs/development-backend.md')

MARKS = ('계약 반영', '_open', '0.2 로', '범위 밖')
REQUIRED_D = ('D8', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D20', 'D22')
IRAN_FORECAST = '이 전쟁이 끝나면 물가는 저절로 내려갈 수도, 더 커지면 훨씬 나빠질 수도 있어요'
PROTOTYPES = ('prose', 'quote', 'list', 'contrast', 'sheet')          # D20 — 5개
LEVEL_IDS = ('basic', 'intermediate', 'advanced')                    # D20
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

    # 3. 원형 5개 + 유니언 + 근거 1건 표시
    tbl = section(c, r'^### 7\.2 ')
    rows = re.findall(r'^\| `(\w+)` [^|]*\|[^|]*\|[^|]*\| ([^|]+) \|', tbl, re.M)
    names = [t for t, _ in rows]
    union = re.search(r'^Block = ([^/\n]+)', c, re.M)
    union_names = [x.strip() for x in union.group(1).split('|')] if union else []
    bad = [t for t, ev in rows if '둘 다' not in ev and '근거 1건' not in ev]
    ok = (sorted(names) == sorted(PROTOTYPES)
          and sorted(n.lower() for n in union_names) == sorted(PROTOTYPES) and not bad)
    detail = (f'표 {names} / 유니언 {union_names} / 근거 표시 없음 {bad}' if not ok
              else f'{[(t, "둘 다" if "둘 다" in ev else "근거 1건") for t, ev in rows]}')
    report(ok, f'3. 원형 {len(rows)}개 = {" · ".join(PROTOTYPES)} (scale 없음), Block 유니언 일치, 근거 1건 표시', detail)

    # 4. 원형마다 절 + 정규 텍스트
    no_sec = []
    for t, _ in rows:
        sec = section(c, rf'^### 7\.\d+ `{t}`')
        if '정규 텍스트' not in sec:
            no_sec.append(t)
    report(rows and not no_sec, '4. 원형마다 절이 있고 "정규 텍스트"가 정의돼 있다',
           f'없음: {no_sec}' if no_sec else '')

    # 5. _open 판정됨
    s11 = section(c, r'^## 11\. ')
    open_rows = re.findall(r'^\| _open-(\d+) \|(.*)$', s11, re.M)
    undecided = [n for n, rest in open_rows if '판정됨 → D20' not in rest]
    outside = sorted(set(re.findall(r'_open-(\d+)', c.replace(s11, ''))), key=int)
    ok = sorted(n for n, _ in open_rows) == ['1', '2', '3', '4', '5'] and not undecided and not outside
    report(ok, f'5. §11 의 _open {len(open_rows)}개가 전부 "판정됨 → D20", §11 밖에 남은 _open 없음',
           '' if ok else f'판정 표시 없음 {undecided} / §11 밖 참조 {outside}')

    # 6. 게이지 항목
    diff = section(c, r'^## 12\. ')
    need = ('게이지 → `contrast` 두 항목', '글자는 그대로', '[33, 62]')
    lacking = [x for x in need if x not in diff]
    report(not lacking, '6. §12 에 "게이지 → contrast 두 항목. 글자는 그대로" + 버리는 눈금 [33, 62]',
           f'없음: {lacking}' if lacking else '')

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

    # 9. D20 의 나머지
    lvl = re.search(r'^\s*id:\s*(.+?)\s*//', code, re.M)
    lvl_ids = re.findall(r'"(\w+)"', lvl.group(1)) if lvl else []
    s6 = section(c, r'^## 6\. ')
    s9 = section(c, r'^## 9\. ')
    s10 = section(c, r'^## 10\. ')
    checks = {
        f'Level.id = {" | ".join(LEVEL_IDS)}': lvl_ids == list(LEVEL_IDS),
        '§6 층 판정 규칙 "애매하면 claim"': bool(re.search(r'애매하면 `claim`', s6)),
        '§6 대기 표시 _refs_pending 정의': '_refs_pending' in s6 and '픽스처에서만' in s6,
        '§9 발행 불변식이 대기 표시를 막음': '_refs_pending' in s9 and '발행되지 않는다' in s9,
        '§10 척도 미확인 (D20)': bool(re.search(r'척도.*미확인.*D20', s10)),
    }
    miss9 = [k for k, v in checks.items() if not v]
    report(not miss9, '9. D20 — 레벨 어휘 · 층 판정 규칙 · 0.2 대기 표시(§6 · §9) · 척도 미확인',
           f'없음: {miss9}' if miss9 else '')

    # 10. D22
    level_block = re.search(r'^Level \{(.*?)^\}', code, re.M | re.S)
    s3 = section(c, r'^## 3\. ')
    s12 = section(c, r'^## 12\. ')
    forecast = next((l for l in s12.splitlines() if '전망 1' in l), '')
    forecast_next = s12.split(forecast, 1)[1].split('\n', 2)[1] if forecast else ''
    checks22 = {
        'Level 에 label 없음': bool(level_block) and 'label' not in level_block.group(1),
        '§3 단일 레벨 = levels.length == 1': 'levels.length == 1' in s3,
        '§12-6 이란 전망 문장 = claim · need "DerivedClaim"':
            IRAN_FORECAST in forecast and '`claim`' in forecast_next and '"DerivedClaim"' in forecast_next,
        '§12-6 이란 규칙은 사실 서술 문장에만': '사실을 서술한 문장에만' in s12,
        '§6.2 need 예에 "DerivedClaim"': '"DerivedClaim"' in section(c, r'^### 6\.2 '),
    }
    miss10 = [k for k, v in checks22.items() if not v]
    report(not miss10, '10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위',
           f'없음: {miss10}' if miss10 else '')

    print('\n'.join(lines))
    print('\nOK' if not fails else f'\n{fails}개 실패')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
