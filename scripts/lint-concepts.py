#!/usr/bin/env python3
"""Concept Atom 시간 지시어 린트 (C-1 ②).

docs/content/concept-library.md 의 FULL / REFRESHER / ANALOGY 본문에서
시간 지시어를 찾는다. FINDINGS §4.3: Concept 은 시간에 독립적이어야 한다.

단어를 잡을 뿐 의미는 판정하지 않는다. "그 순간" 같은 일반적 의미의 지시어도
걸린다. 걸린 것마다 사람이 [위반 / 오탐] 을 판정한다.

본문 = 필드 헤더(**FULL** 등) 다음에 오는 첫 번째 연속 인용(>) 블록.
그 뒤에 빈 줄을 두고 오는 인용 블록(⚠️ 비유 한계선, 🚨 경고, 운영 노트)은
편집 메모라 검사하지 않는다. 명제·BOUNDARY·메타데이터도 범위 밖.

한국어는 교착어라 부분 문자열로 찾는다("지금은", "이번에" 도 걸린다).

usage: python3 scripts/lint-concepts.py [library.md]
exit:  0 걸린 것 없음 · 1 걸린 것 있음 · 2 파싱 실패
"""
import re, sys
from pathlib import Path

TERMS = ('지금', '현재', '올해', '이번')
FIELDS = ('FULL', 'REFRESHER', 'ANALOGY')
NOTE_MARKS = ('⚠️', '🚨')
DEFAULT = Path(__file__).resolve().parent.parent / 'docs/content/concept-library.md'

CONCEPT = re.compile(r'^### (C-\d{4}) · `(\w+)`')
FIELD = re.compile(r'^\*\*([A-Z]+)\*\*')
SECTION_END = re.compile(r'^(## |---\s*$)')
SENT = re.compile(r'[^.?!]*[.?!]?')


def clean(line):
    return line.lstrip('>').strip().replace('**', '')


def parse(lines):
    """-> [(cid, key, {field: [(lineno, text)]})], [error]"""
    concepts, errors = [], []
    cur = None
    i = 0
    while i < len(lines):
        line = lines[i]
        m = CONCEPT.match(line)
        if m:
            cur = (m.group(1), m.group(2), {})
            concepts.append(cur)
            i += 1
            continue
        if SECTION_END.match(line):
            cur = None
        f = FIELD.match(line)
        if cur and f and f.group(1) in FIELDS:
            name, j = f.group(1), i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            body = []
            while j < len(lines) and lines[j].startswith('>'):
                t = clean(lines[j])
                if t:
                    body.append((j + 1, t))
                j += 1
            if not body:
                errors.append(f'{cur[0]} {name} L{i + 1}: 헤더 뒤에 인용 본문이 없다')
            elif body[0][1].startswith(NOTE_MARKS):
                errors.append(f'{cur[0]} {name} L{i + 1}: 본문 자리에 편집 메모가 있다')
            cur[2][name] = body
            i = j
            continue
        i += 1
    if not concepts:
        errors.append('개념 헤더(### C-XXXX · `KEY`)를 하나도 찾지 못했다')
    return concepts, errors


def sentence_at(text, pos):
    for m in SENT.finditer(text):
        if m.start() <= pos < m.end():
            return m.group().strip()
    return text


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    lines = path.read_text(encoding='utf-8').splitlines()
    concepts, errors = parse(lines)

    try:
        shown = path.resolve().relative_to(Path.cwd())
    except ValueError:
        shown = path
    print(f'lint-concepts  {shown}')
    print(f'terms  {" ".join(TERMS)}   fields  {" ".join(FIELDS)}')
    print()
    print('coverage')
    nfields = 0
    for cid, key, fields in concepts:
        nfields += len(fields)
        print(f'  {cid} {key:<26} {" ".join(f for f in FIELDS if f in fields)}')
    print(f'  {len(concepts)} concepts · {nfields} fields')
    for e in errors:
        print(f'  ERROR {e}')
    if errors:
        return 2

    hits = []
    for cid, _, fields in concepts:
        for name in FIELDS:
            for lineno, text in fields.get(name, []):
                for term in TERMS:
                    for m in re.finditer(term, text):
                        hits.append((cid, name, lineno, term, sentence_at(text, m.start())))

    print()
    print('hits')
    for cid, name, lineno, term, sent in hits:
        print(f'  {cid} {name:<9} L{lineno:<4} {term}  {sent}')
    print(f'  {len(hits)} hits')
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main())
