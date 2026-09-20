import json,re,sys
from html.parser import HTMLParser
def strip(h):
    h=re.sub(r'<br\s*/?>',' ',h); h=re.sub(r'<[^>]+>','',h)
    return re.sub(r'\s+',' ',h).strip()
class S(HTMLParser):
    def __init__(s):
        super().__init__(); s.sl=[]; s.d=0; s.b=None
    def handle_starttag(s,t,a):
        if t=='section' and 'slide' in dict(a).get('class','').split(): s.b=[]; s.d=1; return
        if s.b is not None:
            if t=='br': s.b.append(' ')
            else: s.d+=1
    def handle_endtag(s,t):
        if s.b is None or t in ('br','meta','link','img'): return
        s.d-=1
        if s.d==0: s.sl.append(re.sub(r'\s+',' ',''.join(s.b)).strip()); s.b=None
    def handle_data(s,x):
        if s.b is not None: s.b.append(x)
def jt(sl):
    o=[]
    if sl.get('kicker'): o.append(sl['kicker'])
    if sl.get('h1'): o.append(sl['h1'])
    for b in sl['blocks']:
        t=b['type']
        if t=='body_text': o+= [strip(p['html']) for p in b['paragraphs']]
        elif t in ('callout','closing'): o.append(strip(b['html']))
        elif t=='quote':
            if b.get('tag'): o.append(b['tag'])
            o.append(strip(b['html']))
        elif t=='gauge': [o.extend([l['value_text'],l['caption']]) for l in b['labels']]
        elif t=='votes': [o.extend([c['when'],c['tally'],strip(c['what_html'])]) for c in b['cards']]
        elif t=='timeline': [o.extend([i['when'],strip(i['html'])]) for i in b['items']]
        elif t=='stats': [o.extend([r['k'],r['v']]) for r in b['rows']]
        elif t=='end_actions': o.append(b['check']); o+=[x['label'] for x in b['buttons']]
        elif t=='examples': o+=[strip(e['html']) for e in b['items']]
        elif t=='rule_line': o+=[b['marker'],strip(b['html'])]
        elif t=='steps': [o.extend([s['n'],strip(s['html'])]) for s in b['items']]
        elif t=='tags_inline': o+=[p['label'] for p in b['pills']]
        else: sys.exit('UNKNOWN TYPE '+t)
    if sl.get('teaser'): o+=[sl['teaser']['qmark'],sl['teaser']['qtext'],'↓']
    return re.sub(r'\s+','',' '.join(o))
bad=0; types=set()
for h,j in [('prototypes/fomc-slides.html','fixtures/fomc-2026-09.observed.json'),
            ('prototypes/ftc-slides.html','fixtures/ftc-2026-08.observed.json')]:
    e=S(); e.feed(open(h,encoding='utf-8').read())
    d=json.load(open(j,encoding='utf-8'))
    js=[s for lv in d['levels'] for s in lv['slides']]
    ok = len(e.sl)==len(js)
    print(f'{j}')
    print(f'  슬라이드 수  HTML {len(e.sl)} / JSON {len(js)}  -> {"일치" if ok else "불일치"}')
    print(f'  레벨별 장수  ' + ', '.join(f"{lv['id']}={lv['slide_count']}" for lv in d['levels']))
    mm=[i for i,(a,b) in enumerate(zip(e.sl,js)) if re.sub(r'\s+','',a)!=jt(b)]
    print(f'  텍스트 대조  불일치 {len(mm)}장 {mm if mm else ""}')
    print(f'  h1 줄바꿈    ' + ('전부 1개' if all(s['h1'].count('\n')==1 for s in js) else 'NG'))
    print(f'  teaser       {sum(1 for s in js if s["teaser"])}장 보유 / '
          f'goto는 전부 index+1: {all(s["teaser"]["goto_index"]==s["index"]+1 for s in js if s["teaser"])} / '
          f'teaser 없는 장: {[s["index"] for s in js if not s["teaser"]]}')
    ts=[b['type'] for s in js for b in s['blocks']]; types|=set(ts)
    print(f'  블록 타입    {len(set(ts))}종 {sorted(set(ts))}')
    print(f'  DOM signature {d["_dom_inventory"]["distinct_signature_count"]}종')
    print(f'  _findings    {len(d["_findings"])}건')
    bad += 0 if ok else 1; bad += len(mm)
print(f'\n두 파일 블록 타입 합집합: {len(types)}종')
print('FAIL' if bad else 'PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치')
