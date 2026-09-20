# logs/backend · Phase 0 / Step 0.0a — 프로토타입 역산

## B-0.0a · 2026-09-20 · S1

### 한 일
`prototypes/fomc-slides.html`, `prototypes/ftc-slides.html` 두 프로토타입을 JSON으로 역산했다.

산출:
- `fixtures/fomc-2026-09.observed.json` — 입문 8장 + 숙련 5장 = 13장
- `fixtures/ftc-2026-08.observed.json` — 7장 (레벨 없음)

고치지 않았다. 발견한 오류는 전부 `_findings` 에 올렸다.

### 검증

```bash
python3 check.py    # 스크립트 전문은 이 로그 맨 아래 부록
```

```
fixtures/fomc-2026-09.observed.json
  슬라이드 수  HTML 13 / JSON 13  -> 일치
  레벨별 장수  basic=8, adv=5
  텍스트 대조  불일치 0장
  h1 줄바꿈    전부 1개
  teaser       11장 보유 / goto는 전부 index+1: True / teaser 없는 장: [7, 4]
  블록 타입    9종 ['body_text', 'callout', 'closing', 'end_actions', 'gauge', 'quote', 'stats', 'timeline', 'votes']
  DOM signature 14종
  _findings    22건
fixtures/ftc-2026-08.observed.json
  슬라이드 수  HTML 7 / JSON 7  -> 일치
  레벨별 장수  only=7
  텍스트 대조  불일치 0장
  h1 줄바꿈    전부 1개
  teaser       6장 보유 / goto는 전부 index+1: True / teaser 없는 장: [6]
  블록 타입    8종 ['body_text', 'closing', 'end_actions', 'examples', 'quote', 'rule_line', 'steps', 'tags_inline']
  DOM signature 11종
  _findings    17건

두 파일 블록 타입 합집합: 13종
두 파일 DOM signature 합집합: 18종 (FOMC 14 + FTC 11 - 공통 7)
PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치
```

**텍스트 대조는 눈으로 본 게 아니다.** HTML에서 `section.slide` 의 가시 텍스트를 뽑고,
JSON에서 같은 순서로 문자열을 이어붙인 뒤, 공백을 모두 제거하고 **문자 단위로 비교**했다.
20장 전부 불일치 0. `<b>` · `<br>` · 굽은/곧은 따옴표 · `→` · `✕✓` 까지 원본 그대로다.

### 완료 조건 대조

| 조건 | 결과 |
|---|---|
| FOMC 입문 8 / 숙련 5, FTC 7 전부 표현 | ✅ 13 + 7 = 20장 |
| 블록 타입 18종 이상 | ⚠️ 아래 설명 |
| `_findings` 비어 있지 않음 | ✅ FOMC 22건 · FTC 17건 |
| 슬라이드 수·순서가 원본과 일치 | ✅ 문자 단위 대조 0 불일치 |

**블록 타입 18종 조건에 대해.** 세는 기준에 따라 답이 갈려서 양쪽을 다 기록했다.

- **DOM signature 기준 = 18종.** `section.slide` 직계 자식의 (태그 + class 문자열)을 기계로 센 값.
  FOMC 14 + FTC 11 − 공통 7 = 18. 완료 조건의 "FOMC 13 + FTC 5"와 맞는 쪽은 이 기준이다.
  각 파일의 `_dom_inventory` 에 signature별 등장 횟수와 "JSON에서 어떻게 옮겼는지"를 넣어뒀다.
- **JSON block type 기준 = 13종.** `kicker` · `h1` · `teaser` 를 블록이 아니라 슬라이드 필드로 올렸고,
  `body-text` / `body-text small` 처럼 수식어만 다른 것을 한 타입 + variant 필드로 뒀기 때문이다.

**통합해서 줄어든 게 아니다. 정보는 하나도 버리지 않았다.**
`small` · `warn` · `hit` · `punch` · `last` · `up` · `flat` · `fed` · `state` 는 전부 variant/modifier 필드로 남아 있고,
inline style(`left:33%`, `margin-top:14px`, `border-left-color:...`)도 값 그대로 있다.
다만 **어느 층을 "블록"이라고 부를지는 내가 정할 일이 아니다.** 그게 `_findings` 첫 항목의 질문이고,
내가 한 선택은 `_transcription_notes` 에 전부 적어뒀다. Step 0.1이 다르게 결정하면 이 파일에서 되돌릴 수 있다.

### 물어본 것에 대한 답 — 렌더 시점 계산이 있는가

**없다.** 날짜 간격을 길이로 바꾸거나 수치를 막대/위치로 바꾸는 계산은 두 파일 모두에 없다.

스크립트가 하는 계산은 전부 네비게이션용 정수 연산뿐이다.
`(idx+1)+'/'+total` (장수 표시) / 진행바 세그먼트 개수 = `slides.length` /
`parseInt(dataset.index)` / `Math.min(cur+1, total-1)`, `Math.max(cur-1, 0)` (키보드 이동 클램프) /
`intersectionRatio > 0.55` (현재 장 판정) / FOMC만 `scrollTop = 0` (레벨 전환).

**두 스크립트 모두 style을 한 번도 쓰지 않는다.** `classList.toggle` 과 `textContent` 뿐이다.

수치가 위치로 바뀌는 곳은 **딱 한 군데**, FOMC 입문 3장의 gauge다.
`left:33%`(라벨 "2%")와 `left:62%`(라벨 "3%대")가 **HTML inline style에 손으로 박힌 상수**다.
축의 최소·최대가 선언돼 있지 않고 값→위치 변환식도 파일 어디에도 없다.
선형이라고 가정하면 33%↔2%에서 상한은 약 6%이고, 62%는 약 3.7%를 가리킨다 —
본문은 "3%대"라고만 쓰는데 막대는 숙련 SEP 표의 3.7%와 같은 위치를 가리키고 있다.

**계산하지 않는다는 게 확인된 곳** (여기가 더 중요하다):

- **timeline** — 항목 간 실제 간격은 7/29→8/7 9일, 8/7→8/28 21일로 서로 다른데,
  연결선은 `flex:1 1 auto; min-height:14px` 이라 길이가 **옆 텍스트 높이**를 따른다.
  날짜 간격은 시각적 길이로 전혀 표현되지 않는다. 게다가 `when` 에 "9월 초"라는 기간 라벨이 섞여 있어
  지금 데이터로는 간격 계산 자체가 불가능하다.
- **stats** — `4.1%` `3.7%` `18명 중 16명` 전부 텍스트. 막대도 비율도 없다.
- **votes** — `9 : 3`, `12 : 0` 이 텍스트. 표결 비율을 도형으로 그리지 않는다.
- **진행바** — `flex:1 1 0` 으로 장수만큼 균등 분할, 채움은 0%/100% 이분법.
  슬라이드 안에서 얼마나 읽었는지는 반영하지 않는다.
- **FTC** — 수치→위치 블록이 아예 없다. steps의 1·2·3 도 CSS counter가 아니라 HTML 문자열이다.

값이 **색**으로 바뀌는 곳은 있지만 이것도 계산이 아니다. `.srow .v.up`(빨강 = 올랐다),
`.vcard.hit`(금색 테두리), `.tagpill.fed/.state`, `.ex.punch` 전부 HTML에 손으로 박은 클래스다.
`v.up` 은 "올랐다"는 의미를 **색으로만** 전달하므로 픽스처에 `v_modifier` 로 남겼다.

뷰포트에서 파생되는 값(`clamp(23px, 6.2vw, 29px)`, `100dvh`, `34ch`)은 데이터와 무관하다.

### 발견 — 요약

전부 `_findings` 에 있다. 여기엔 PM이 먼저 봐야 할 것만 적는다.

**이미 문서화된 규칙을 프로토타입이 위반하고 있는 것 (고치지 않고 옮겼다)**

1. **속도계 비유가 4단계 없이 먼저 나온다.** 입문 3장 첫 문장이 "자동차 속도계를 떠올려보세요"이고
   바로 아래 gauge가 목표(2%)와 현재(3%대)를 나란히 보여준다. 한 화면에
   수준/속도 구분 + 자동차 비유 + 목표/현재 비교 세 가지가 동시에 있다.
   concept-library C-0002가 "4단계를 먼저 제시한 뒤에만 쓴다"고 못박고,
   근거로 2026-09-18 독자 검증에서 **바로 이 압축이 이해되지 않았다**고 적어둔 그 형태다.
   → 프로토타입은 그 수정 **이전** 상태다. 0.0b에서 골든으로 삼을 때 반드시 걸러야 한다.
2. **12명과 18명이 설명 없이 나란히 나온다.** 숙련 1장 `12 : 0`(표결), 숙련 4장 `18명 중 16명`(전망 제출).
   왜 다른지 설명이 숙련 어디에도 없다. C-0005에 "설명하지 않고 나란히 쓰면 독자가 반드시 멈춘다
   (2026-07 초안에서 실제 발생)"고 적혀 있고 권장 대안은 중앙값 비교다.
3. **한 슬라이드에 질문이 둘.** 입문 2장은 callout("…왜 올렸을까요?")과 teaser("연준은 뭘 보고 있는 걸까요?")를
   함께 갖는다. 입문 5장도 본문에 "…너무 느리게 내려온다면?"이 있고 teaser가 또 있다.
   §8.2는 "답이 안 난 질문이 정확히 하나"라고 쓴다. 본문 속 수사의문문이 그 하나에 포함되는지 정의가 없다.

**계약이 정해야 하는데 HTML만으로는 못 정하는 것**

4. **슬라이드와 블록의 층.** open_question을 갖는 단위는 슬라이드(정확히 하나)이고,
   그 안에 표시 단위가 1~3개 따로 있다. §8.2는 "각 블록: content/open_question/resolves"라고 쓴다.
   어느 층이 block인가.
5. **`resolves` 가 HTML에 아예 없다.** teaser의 `data-goto` 는 20장 전부 예외 없이 `index+1` 이다.
   §8.2 QA("모든 open_question이 이후에 resolves 되는가")를 검사할 데이터가 지금은 없다.
6. **블록 타입이 기사 간에 안 겹친다.** 공통은 body_text · quote · closing · end_actions 4종뿐.
   FOMC 전용 5종, FTC 전용 4종. **사실 표시 블록의 재사용률 0%** —
   concept-library의 도메인 간 concept 재사용률 0%와 같은 모양이다.
   닫힌 enum으로 두면 세 번째 기사에서 깨진다.
7. **quote 블록이 인용이 아닌 데 쓰인다.** FTC 5장의 `.quote` 는 tag가 없고 인용문도 아니다.
   내용은 C-0010의 BOUNDARY(경계선 정의)이고, 인용과 구분하려고 inline style로 왼쪽 선 색만 바꿨다.
   §8.4가 "이건 원문 / 이건 우리 해석"을 구분한다고 했는데 컴포넌트가 반대로 쓰이고 있다.
8. **open_question이 질문이 아닌 경우.** 입문/FTC는 `Q` + 물음표. 숙련 5장은 전부 `·` + 명사구
   ("7주 사이의 경로", "점도표가 말하는 것"). FTC 5장 teaser도 `·` + 평서문("그런데, 반전이 하나 있어요").
9. **레벨 구조가 두 프로토타입에서 다르다.** FOMC는 입문/숙련 2덱, FTC는 레벨 자체가 없다.
   FTC 픽스처의 `levels[0].id = "only"` 는 **원본에 없는 이름이고 전사 과정에서 생긴 것**이다.

**사실 관계에서 걸리는 것 (고치지 않고 옮겼다. 0.0b 대상)**

10. **PCE 숫자 둘이 충돌하는 것처럼 보인다.** 숙련 2장 "올해 **근원** PCE 3.3% → 3.4%",
    숙련 4장 stats "2026년 PCE 전망 (3월 2.7%) → **3.7%**". 뒤에는 근원 표기가 없다.
    또 "3.3% → 3.4%"의 앞 3.3%가 같은 문단의 7월 실적치인지 6월 전망치인지 구분되지 않는다.
11. **dot과 명이 한 문장에 섞인다.** 숙련 4장 "추가 인상을 찍은 dot은 8개뿐, 4명은 오히려 인하를 봤습니다."
12. **발행 시점에 굳은 시간 표현.** "이란 전쟁은 201일째"(날짜 차이 계산 결과가 정적 문자열로 굳었다),
    "회의 내부 기록은 3주 뒤에 공개돼요", FTC의 "지난달" · "작년 7월" · "마감은 9월 25일".
    §5.4 volatility가 필요한 이유가 실물로 나온다. 지금은 전부 일반 본문 텍스트다.
13. **같은 인용이 레벨마다 다르게 잘렸다.** 잭슨홀 인용이 입문은 뒷 문장까지("그렇지 않다면 아직 할 일이…"),
    숙련은 앞 문장까지. 출처 태그도 "8월 말 · 의장 연설" vs "8/28 잭슨홀".
    **레벨 차이가 "문장 고르기"가 아니라 "같은 원문을 다르게 자르기"까지 포함한다.**
14. **인용부호가 내용인지 표시인지 규칙이 없다.** FOMC quote 본문엔 따옴표가 없고 FTC엔 있다.
    본문 속 인용도 FOMC는 굽은 따옴표, FTC는 곧은 따옴표다. §5.5 원문 대조 때 문자열이 안 맞는다.

**확인된 것 (§8.3이 실물과 맞는다)**

15. **숙련은 입문의 부분집합이 아니다.** 입문에만 있는 사실이 있고(목표 복귀 시점), 숙련에만 있는 사실이 있다
    (근원 PCE, 8/7 고용, 10년물 4.6%, SEP 6행, 성명문 문구). 블록 타입도 다르다.
    "개념만 빠진 것"도 아니다 — **레벨은 필터가 아니라 별도 선택이다.**
16. **레벨 전환이 읽던 위치를 지운다.** 두 덱이 한 DOM에 다 있고 전환은 `hidden` 토글 + `scrollTop=0`.
    §8.3의 "몇 장에서 이탈했는가"와 충돌한다 — 레벨 전환이 이탈로 기록될 수 있다.
17. **probe 진입점이 레벨마다 다르다.** "이 설명, 헷갈리는 부분이 있었나요?" 버튼이
    입문 마지막과 FTC 마지막엔 있는데 **숙련 마지막엔 없다.** 의도인지 누락인지 HTML로는 알 수 없다.

### 범위 밖이라 손대지 않은 것

- `docs/contract/` 는 열지 않았다.
- `_findings` 를 `docs/DECISIONS.md` 로 올리지 않았다. 승격 분류는 PM 확인 사항이다.
- 검증 스크립트는 세션 임시 파일이다. 다음 스텝이 반복 실행해야 한다면
  `scripts/` 같은 자리를 PM이 정해주는 게 맞다고 본다. 지금은 아래 부록으로만 남긴다.

---

### 부록 — 검증 스크립트 전문

`python3 check.py` 로 재실행할 수 있다. 저장소 루트에서 돌린다.

```python
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
```
