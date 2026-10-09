"""라이브러리 이전 전후 독자 글 대조 (B-0.2m-a).

    python3 scripts/compare-concept-text.py                 # 옛 = git f8f6dce 의 md, 새 = 저장소(JSON) + 지금 md
    python3 scripts/compare-concept-text.py --old-rev REV

개념 문안(명제 · FULL 단계 · REFRESHER · ANALOGY · BOUNDARY)이 이전에서 한 글자도 바뀌지 않았는지 본다.
  옛 글   이전 직전 커밋의 docs/content/concept-library.md
  새 글   docs/content/concept-library.json 의 지금 버전  +  지금의 md (md 도 규칙 문구 말고는 안 바뀌어야 한다)
굵게 표시(`**`) · 줄바꿈까지 글의 일부로 댄다. 변환이 없다 — 한 글자라도 다르면 실패다.
exit 0 차이 0 · 1 차이 있음
"""
import hashlib, importlib.util, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD_REV = 'f8f6dce'                       # 이전 직전 (0.2m-a 1/5). md 는 C-4 반영(a48e0ad) 뒤로 그대로다
MD_REL = 'docs/content/concept-library.md'
spec = importlib.util.spec_from_file_location('vc', os.path.join(ROOT, 'scripts/verify-concept-identity.py'))
VC = importlib.util.module_from_spec(spec)
spec.loader.exec_module(VC)


def main(argv):
    rev = argv[argv.index('--old-rev') + 1] if '--old-rev' in argv else OLD_REV
    old_md = subprocess.run(['git', 'show', f'{rev}:{MD_REL}'], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
    old = VC.reader_texts_md(old_md)
    new_md = VC.reader_texts_md(open(os.path.join(ROOT, MD_REL), encoding='utf-8').read())
    store = json.load(open(VC.STORE, encoding='utf-8'))
    new = VC.reader_texts_store(store)
    sha = lambda t: hashlib.sha256((t or '').encode('utf-8')).hexdigest()[:10]
    bad = 0
    print(f'옛 글  git {rev}:{MD_REL} — {len(old)} 단위')
    print(f'새 글  {os.path.relpath(VC.STORE, ROOT)} — {len(new)} 단위 · 지금 md — {len(new_md)} 단위\n')
    for k in sorted(set(old) | set(new) | set(new_md)):
        a, b, c = old.get(k), new.get(k), new_md.get(k)
        ok = a == b == c
        bad += not ok
        print(f'  {"=" if ok else "≠"} {k[0]} {k[1]:<16} {len(a or ""):>4}자  {sha(a)}  {sha(b)}  {sha(c)}' + ('' if ok else f'\n      옛   {a!r}\n      저장소 {b!r}\n      md   {c!r}'))
    total = sum(len(v or '') for v in old.values())
    print(f'\n{"OK" if not bad else "FAIL"} — {len(old)} 단위 · {total}자 · 다른 것 {bad}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
