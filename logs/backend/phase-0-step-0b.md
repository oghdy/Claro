# logs/backend · Phase 0 / Step 0.0b — 오류 교정 → 골든 픽스처

## B-0.0b · 2026-09-21 · S2 · **[GATE] 도윤 에디토리얼 게이트 대기 — 완료 아님**

### 산출
| 파일 | 내용 |
|---|---|
| `fixtures/fomc-2026-09.article.json` | 골든. 입문 **9장**(8→9) · 숙련 5장. 교정 5건 + `_` 주석 |
| `fixtures/invalid/volatile-missing-asof.json` | 골든 + 위반 1개: VOLATILE 에서 `as_of` 제거 |
| `fixtures/invalid/derived-from-volatile.json` | 골든 + 위반 1개: DERIVED 출처 하나를 VOLATILE 로 |
| `logs/correction-log.csv` | 5행 (교정 1건당 1줄, `time_spent_min` 비움) |
| `scripts/verify-article.py` | D9 · D15 QA① · 주석 커버리지 · D8 불변식. invalid 는 선언한 code 로 거부돼야 통과 |
| `scripts/diff-observed-article.py` | observed ↔ article 슬라이드별 diff |

observed(`fixtures/fomc-2026-09.observed.json`)는 건드리지 않았다. `python3 scripts/verify-observed.py` 여전히 PASS.

---

### 검증

```bash
python3 scripts/verify-article.py
```
```
PASS  fixtures/fomc-2026-09.article.json
   WARN  basic[7] blocks/0/paragraphs/0 "반년 넘게": DERIVED 출처 ['war_start'] 가 브리프 밖
   WARN  adv[4] blocks/0/paragraphs/0 "201일째": DERIVED 불변식 검증 불가 — 개전일이 브리프에 없고 기사 안 출처("2월 말")는 기간이다. 2/28 이면 201, 2/21 이면 208
   WARN  adv[4] blocks/0/paragraphs/0 "201일째": DERIVED 출처 ['war_start'] 가 브리프 밖
PASS  fixtures/invalid/derived-from-volatile.json  — 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic[6] blocks/1/paragraphs/1 "3주 뒤에": 출처 ['minutes'] 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/levels/0/slides/6/_volatility/2/derived_from/0/volatility']
PASS  fixtures/invalid/volatile-missing-asof.json  — 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic[3] blocks/0/paragraphs/1 "지금 미국은 3%대": VOLATILE 인데 as_of 가 없다 (D8)
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
```

- **WARN 3개는 일부러 남겼다.** 전부 같은 원인이다 — 이란 전쟁 개시일이 브리프에 없다. 아래 "_fact_refs 가 빈 문장" 참조.
- invalid 두 개는 **선언한 code 하나로만** 거부되고, 골든과 **정확히 한 군데만** 다르다(스크립트가 확인).

**스크립트가 실제로 실패할 수 있는지** — 골든을 한 군데씩 깨뜨린 사본 7개로 확인했다(사본은 커밋하지 않음):

| 주입 | 검출 |
|---|---|
| 최상단에 `_findings` | `D9_OBSERVED_KEY` |
| 입문 5장 teaser 제거 | `D15_QA1_NO_TEASER` |
| 숙련 2장 goto 2→3 | `D15_NONLINEAR` |
| 슬라이드에 `resolves` 키 | `D15_RESOLVES` |
| 입문 1장 본문 한 문장 변경 | `FACTREF_SPAN_MISMATCH` |
| `_fact_refs` 에 `F99` | `FACTREF_UNKNOWN_ID` |
| `_published_at` = 2027-03-01 | `DERIVED_INVARIANT_FAIL` × 13 |

---

### 교정 5건

| # | 무엇을 | 적용 | error_type |
|---|---|---|---|
| 1 | 입문 3장 속도계 | C-0002 FULL ①~④ 뒤에 ANALOGY. **두 장으로 분할** (아래 레이아웃) | 압축 |
| 2 | 숙련 12 : 0 ↔ 18명 중 16명 | 숙련 4장 dim 문단 앞에 **C-0005 REFRESHER 한 문장** | 압축 |
| 3 | PCE 3.7% 라벨 | 행 라벨에 **"헤드라인"** | 오독 미방어 |
| 4 | dot / 명 | "dot은 8개뿐" → **"참가자는 8명뿐"** | 압축 |
| 5 | 발행 시점 고정 표현 | **본문 변경 없음.** `_published_at` + `_volatility` (DERIVED 18 · VOLATILE 11) | 시점 앵커 누락 *(신규)* |

대안은 전부 `correction-log.csv` 에 있다. 게이트에서 고를 것은 맨 아래 "게이트 질문"에 모았다.

#### #1 — 왜 두 장인가 (측정)
한 장에 ①~④ + 비유 + 게이지 + 기존 dim 문장을 다 넣은 버전을 프로토타입 CSS 로 렌더해 쟀다.
teaser 구분선까지 남는 여백:

| 뷰포트 | observed 3장 | 한 장 버전 | **두 장 버전 (채택)** 3장 / 4장 |
|---|---|---|---|
| 375×812 | 142 | **−30 (겹침)** | 157 / 68 |
| 390×844 | 157 | **−15 (겹침)** | 172 / 82 |

나누는 자리는 ② 뒤다. 3장 = "속도를 본다"(①②), 4장 = "목표 속도와 지금 속도"(③④) — 장마다 개념 하나.
4장 끝에 비유가 오므로 5장 h1 "금리는 **그 차의** 브레이크예요"의 "그 차"가 여전히 앞 장을 가리킨다.

**D15**: 3장 teaser "그럼 어느 속도가 적당한 거죠?" → 4장 h1 "연준이 원하는 속도는 1년에 2%예요"가 바로 답한다.
4장 teaser 는 observed 의 "그럼 금리는 뭔가요?" 그대로이고 5장(브레이크)이 답한다. QA② 판정은 게이트 몫이다.

#### #2 — 왜 FULL 이 아니라 REFRESHER 인가
처음엔 C-0005 FULL 앞 두 문장("정책 표결은 투표권을 가진 12명이 합니다. 반면 경제 전망은 … 각자 제출해요.")을 넣었다.
REFRESHER 의 "참가자 전원"이 같은 문단의 F20(의장 미제출)과 부딪친다고 봤기 때문이다. 렌더해 보니:

| 뷰포트 | observed 숙련 4장 | FULL 두 문장 | **REFRESHER (채택)** |
|---|---|---|---|
| 375×812 | 23 | **−12 (겹침)** | **0** |
| 390×844 | 38 | 3 | 14 |

그래서 다시 따졌다. "참가자 전원"은 §1.2 의 판별 질문("나중에 더 배우면 버려야 하나?")에 **아니오**다 —
의장이 빠질 수 있다는 건 그 위에 쌓이는 정보이고, 그 예외가 두 문장 뒤(F20)에 바로 나온다. 확장 가능 단순화로 보고 REFRESHER 로 바꿨다.

⚠️ **채택안도 375×812 에서 여백이 0px 이다.** 마지막 줄이 teaser 점선에 닿는다. observed 는 23px 였다.
§8.5 "시각 요소 크기"가 미정이라 레이아웃은 교정 범위가 아니라고 보고 여기서 멈췄다.

#### #5 — 왜 본문을 안 바꿨나
D8 규칙 2: "렌더 시점 계산은 없다. 프론트는 `value_at_authoring` 을 출력한다." 즉 "201일째"는 **문장으로는 그대로 두는 게 D8 적용**이다.
빠져 있던 것은 문장이 아니라 **기준 시각과 분류**다. 그래서 주석만 붙였다.

- `_published_at = 2026-09-16` — observed 에 발행 시각이 없어서 역산했다. 본문이 회의 당일을 "지금"으로 쓴다
  ("회의 내부 기록은 3주 뒤" = 회의록 T+21 까지 정확히 21일). 정책은 D6(OPEN)
- DERIVED 는 전부 공식 + 출처 + 기록된 불변식을 갖고, 스크립트가 `published_at` 으로 다시 계산한다
- VOLATILE 은 전부 브리프의 T-오프셋에서 `as_of` 를 뽑았다

| 발행일을 바꾸면 | 깨지는 DERIVED |
|---|---|
| 2026-09-16 (채택) | 없음 ("201일째"는 UNVERIFIABLE) |
| 2026-09-18 (브리프 작성 기준 시각) | **"201일째"** — 2월 어느 날 시작이든 FAIL |
| 2026-09-23 | "201일째", "3주 뒤" ×2 |

→ **"201일째"는 "9/16 발행 + 2/28 개전"일 때만 맞는 값이다.** 둘 다 데이터에 없다.

**D8 분류 기준**(내가 정한 것 — S3/S4 가 확정해야 함):
- STABLE: 결정·표결·공개 문서의 내용(성명문, SEP, 연설). D8 표의 "3.75~4.00%"와 같은 부류
- VOLATILE: 변하는 시계열에서 읽은 값 — 시장 가격·확률(F35·F36), 경유 가격(F37), 지표 발표치(F30·F31, 개정될 수 있음),
  그리고 "지금 미국은 3%대"처럼 최근 값을 "지금"으로 말하는 것
- DERIVED: 날짜 차이·연도 환산("올해"=published_at 의 연도)
- 주석 **안 한 것**: "이어지고 있어요", "아직 알 수 없습니다", "현재 확실한 것은 순서뿐" — 값이 아니라 유효성이다.
  D8 규칙 5 에 따라 storyline_ref / STORYLINE_STALE 소관. 10/7 회의록이 나오면 전부 stale 이 된다

**VOLATILE 자연 사례가 있었다.** "지금 미국은 3%대"(F31) 외 10건. invalid 는 만들어낸 값 없이 골든의 실제 값에 주입했다.

---

### 새로 쓴 문장 — 교정 vs 재집필 경계 (게이트 판정 대상)

라이브러리에도 브리프에도 없는, 내가 쓴 문장은 **2개**다.

| 위치 | 문장 | 근거 |
|---|---|---|
| 입문 3장 teaser | 그럼 어느 속도가 적당한 거죠? | 다음 장 ③ "…2% 정도면 **적당하다**고 봅니다"에 맞춤 |
| 입문 4장 h1 | 연준이 원하는 속도는⏎1년에 2%예요 | observed 게이지 라벨 "연준이 원하는 속도" + FULL ③ "1년에 2%". 줄바꿈 위치도 내가 정했다 |

"물가 목표는 2%"(C-0003 REFRESHER)도 후보였지만, 바로 앞 장 h1 이 "연준이 보는 건 **물가가 아니라** 속도예요"라서
"물가 목표"라고 쓰면 방금 가른 두 개념을 다시 섞는다. "속도"로 썼다.

**라이브러리 문안을 옮기며 바꾼 것** (단어는 안 바꿨다):
- C-0002 단계 제목(① 두 가지를 갈라놓기 / ② 연준이 보는 쪽 / ③ 목표가 있다 / ④ 지금 상태)은 뺐다 — 작가용 라벨로 읽혀서
- ① 은 라이브러리 원문에서 문장마다 줄이 나뉘어 있지만 Markdown 에서는 한 문단이다. 한 문단으로 옮겼다
- 곧은 따옴표 → 굽은 따옴표(이 기사의 다른 인용과 맞춤), `**` → `<b>`

**기계적 변경**: 입문 5~9장 index·goto +1, `levels[0].slide_count` 8→9, `chrome.counter_initial_static_text` "1/8"→"1/9".
observed 의 `_findings` · `_dom_inventory` · `_transcription_notes` 에 더해 `_render_time_computation` 도 가져오지 않았다(프로토타입 분석이지 기사가 아니다).

---

### `_fact_refs` 가 빈/부분 문장 — 이 작업의 부산물

모든 내용 단위(h1 · 문단 · 카드 · 행 · 라벨 · 인용)를 문장 단위로 브리프 ID 에 매핑했다. 스크립트가 span 을 이어붙여 원문과 같은지 확인한다.
teaser · kicker · end_actions 는 구조라서 제외했다.

```
  kind 별 문장 수: {'brief_text': 1, 'concept': 19, 'derived_claim': 19, 'fact': 41, 'partial': 12, 'unsupported': 4, 'writing': 6}
  partial     basic[0] blocks/0/paragraphs/1    3년 넘게 연준은 금리를 그대로 두거나 내리기만 했어요.
              └ F03 은 "2023년 7월 이후 첫 인상" — 인상이 없었다는 데까지만. "내리기만 했어요"가 말하는 인하는 브리프에 없다
  partial     basic[1] blocks/0/paragraphs/0    여름 동안 나온 물가 지표는 시장이 걱정하던 것보다 좋았습니다.
              └ 브리프는 "예상보다 나았다"(DC-C). "시장이 걱정하던"이라는 비교 대상은 브리프에 없다
  partial     basic[3] blocks/2/paragraphs/0    그리고 이 속도는 여름 내내 크게 줄지 않았어요.
              └ 의장 평가(F24·F32)를 사실 서술로 옮겼다. 여름 동안의 실측 추이는 브리프에 없다(F31 은 7월 한 점)
  partial     basic[6] blocks/1/paragraphs/0    그 사이 8월 말 의장이 앞의 기준을 밝혔고, 시장은 인상 가능성을 90% 넘게 반영하기 시작했어요.
              └ F36 은 회의 직전(T-1)에 "반영하고 있었음". 언제부터 "반영하기 시작"했는지는 브리프에 없다
  brief_text  basic[6] blocks/1/paragraphs/1    회의 내부 기록은 3주 뒤에 공개돼요.
              └ 브리프 §1 "아직 없는 것": 9월 회의록 = 10월 초, T+21. F-ID 가 없다
  unsupported basic[7] blocks/0/paragraphs/0    2월 말에 시작돼 반년 넘게 이어지고 있어요.
              └ 개전 시점(2월 말)과 지속 기간은 브리프에 없다
  unsupported basic[7] blocks/0/paragraphs/0    4월에 휴전 합의가 한 번 있었지만 이후 공격이 반복되면서 기름값은 크게 올랐다 내렸다를 되풀이했습니다.
              └ 4월 휴전 합의·공격 반복·유가 등락은 브리프에 없다. F37("연료 가격 급등")과는 방향만 겹친다
  unsupported basic[7] blocks/1                 이 전쟁이 끝나면 물가는 저절로 내려갈 수도, 더 커지면 훨씬 나빠질 수도 있어요.
              └ 시나리오 해석. 대응하는 DC 가 없다
  partial     basic[7] blocks/1                 연준이 “확신이 없다”고 말한 이유의 상당 부분이 여기 있습니다.
              └ “확신이 없다”에 인용 부호가 붙어 있지만 그런 발언은 브리프에 없다(F33 은 확신 "기준"). 원인 비중("상당 부분")도 브리프에 없는 해석
  partial     basic[8] blocks/0/paragraphs/2    참고로 연준 자신도 물가가 2% 근처로 돌아오는 건 내년 말쯤으로 보고 있어요.
              └ F19 는 2027년 말 PCE 2.3%. "2% 근처"는 2.3% 를 느슨하게 옮긴 것
  partial     adv[2] blocks/0/items/3         9월 초 시장, 인상 확률 90% 이상 반영. 10년물 4.6% 돌파
              └ 브리프 시점은 둘 다 T-1(9/15). "9월 초"는 브리프와 다르다 — FOMC-22(S3)
  partial     adv[4] blocks/0/paragraphs/0    1. 물가의 큰 부분이 전쟁에 달려 있습니다.
              └ 비중("큰 부분")은 브리프에 없는 해석
  unsupported adv[4] blocks/0/paragraphs/0    이란 전쟁은 201일째.
              └ 개전일이 브리프에 없다. D8 DERIVED 불변식을 검증할 수 없다
  partial     adv[4] blocks/0/paragraphs/0    4월 휴전 이후에도 공격이 반복되며 유가는 크게 등락했고, 회의 당일 경유 가격은 사상 최고였습니다.
              └ 회의 당일 경유 최고치만 F37. 4월 휴전·공격 반복·유가 등락은 브리프에 없다
  partial     adv[4] blocks/0/paragraphs/1    그런데 실업률은 4.2%에서 4.1%로 내려갔죠.
              └ 6월 실업률 4.2% 는 DC-E 본문에만 있고 F-ID 가 없다
  partial     adv[4] blocks/0/paragraphs/1    의장은 이를 노동공급 감소로 설명했고, 성명문은 고용 증가가 노동력 증가와 보조를 맞췄다고 썼습니다.
              └ "의장=노동공급 감소" 설명은 DC-E 가 P3 출처로 언급만 한다 — F-ID 없음
  partial     adv[4] blocks/1                 따라서 이번 회의의 변화는 금리 숫자가 아니라 인상을 둘러싼 내부 긴장이 전망에서 실제 행동으로 옮겨왔다는 점입니다.
              └ "전망에서 실제 행동으로"는 6월 SEP 분열(F29)을 전제하는데 F29 는 숙련 본문 어디에도 없다
```

`kind` 는 이렇게 썼다: `fact` 브리프 F 로 뒷받침 / `derived_claim` DC 로 뒷받침 / `partial` refs 는 있으나 일부가 브리프에 없음 /
`brief_text` 브리프 산문에는 있으나 F-ID 없음 / `unsupported` 사실 주장인데 브리프에 없음 / `concept` 라이브러리 문안 / `writing` 사실 주장 아님.

**PM 분류용 요약** (사실 누락인지 작가가 지어낸 건지는 내가 판정하지 않았다):

1. **이란 전쟁 서사 전체가 브리프 밖이다.** 개전 시점(2월 말), 지속 기간(반년·201일), 4월 휴전 합의, 공격 반복, 유가 등락.
   두 레벨 모두에 있다(입문 8장, 숙련 5장). 브리프 F37 은 "연료 가격 급등 + 회의 당일 경유 최고치"뿐이다.
   D8 의 대표 예시("201일째")가 바로 여기서 검증 불가가 된다.
2. **인용 부호가 붙었는데 브리프에 그 발언이 없다.** 입문 8장 “확신이 없다”. 잭슨홀 인용(입문 6장, 숙련 2장)도
   브리프 F33 은 요약이라 원문 대조(§5.5)를 할 수 없다.
3. **F-ID 없이 브리프 산문에만 있는 사실이 기사에 쓰였다.** 회의록 T+21(§1), 6월 실업률 4.2%·의장의 노동공급 설명(DC-E 본문).
   Fact 로 승격할 후보.
4. **숙련 마지막 문장이 본문에 없는 사실에 기댄다.** "전망에서 실제 행동으로"는 6월 SEP 분열(F29)이 전제인데 F29 는 숙련 어디에도 없다.
5. 그 밖의 `partial` 은 표현을 세게 옮긴 경우다 — "예상보다" → "시장이 걱정하던 것보다", 2.3% → "2% 근처", T-1 → "9월 초",
   "반영하고 있었음" → "반영하기 시작했어요".

---

### observed ↔ article 슬라이드별 diff

```bash
python3 scripts/diff-observed-article.py
```
```

=== basic (입문)  observed 8장 → article 9장 ===

 obs[0] → art[0]  본문 변경 없음

 obs[1] → art[1]  본문 변경 없음

 obs[2] → art[2]  ■ 변경
    - b0 body_text[small] p0             자동차 속도계를 떠올려보세요. 연준이 보는 숫자는 물건이 얼마나 비싼가가 아니라 <b>1년에 몇 퍼센트씩 오르고 있는가</b>입니다.
    - b1 gauge marks                     33 62
    - b1 gauge l0.target@33              <b>2%</b> 연준이 원하는 속도
    - b1 gauge l1.now@62                 <b>3%대</b> 지금 미국
    - b2 body_text[small][margin-top:4px] p0.dim 그리고 이 속도는 여름 내내 크게 줄지 않았어요.
    - teaser                             Q 그럼 금리는 뭔가요?
    + b0 body_text[small] p0             라면이 2000원이라고 해봅시다. 작년엔 1900원이었어요. “라면이 2000원이다”는 그냥 가격입니다. “라면값이 작년보다 5% 올랐다”는 오르는 속도예요.
    + b0 body_text[small] p1             연준이 보는 건 첫 번째가 아니라 두 번째입니다. 라면이 얼마인지는 보지 않아요. <b>얼마나 빠르게 비싸지고 있는지</b>를 봅니다.
    + teaser                             Q 그럼 어느 속도가 적당한 거죠?

 (없음) → art[3]  ■ 새 슬라이드
    + kicker                             이것만 알고 가면 돼요 ①
    + h1                                 연준이 원하는 속도는⏎1년에 2%예요
    + b0 body_text[small] p0             연준은 이 속도가 1년에 <b>2%</b> 정도면 적당하다고 봅니다. 아예 안 오르는 것도 원하지 않고, 딱 2%예요.
    + b0 body_text[small] p1             그런데 지금 미국은 3%대입니다. 목표보다 빠르게 오르고 있어요.
    + b0 body_text[small] p2             자동차 속도계에 빗댈 수 있습니다. 계기판 숫자가 지금 오르는 속도고, 연준이 맞추려는 눈금이 2예요.
    + b1 gauge marks                     33 62
    + b1 gauge l0.target@33              <b>2%</b> 연준이 원하는 속도
    + b1 gauge l1.now@62                 <b>3%대</b> 지금 미국
    + b2 body_text[small][margin-top:4px] p0.dim 그리고 이 속도는 여름 내내 크게 줄지 않았어요.
    + teaser                             Q 그럼 금리는 뭔가요?

 obs[3] → art[4]  본문 변경 없음  (기계적: index 3→4, goto 4→5)

 obs[4] → art[5]  본문 변경 없음  (기계적: index 4→5, goto 5→6)

 obs[5] → art[6]  본문 변경 없음  (기계적: index 5→6, goto 6→7)

 obs[6] → art[7]  본문 변경 없음  (기계적: index 6→7, goto 7→8)

 obs[7] → art[8]  본문 변경 없음  (기계적: index 7→8)

=== adv (숙련)  observed 5장 → article 5장 ===

 obs[0] → art[0]  본문 변경 없음

 obs[1] → art[1]  본문 변경 없음

 obs[2] → art[2]  본문 변경 없음

 obs[3] → art[3]  ■ 변경
    - b0 stats r4.up                     2026년 PCE 전망 (3월 2.7%) | 3.7%
    + b0 stats r4.up                     2026년 헤드라인 PCE 전망 (3월 2.7%) | 3.7%
    - b1 body_text[small][margin-top:14px] p1.dim 2027년에 추가 인상을 찍은 dot은 8개뿐, 4명은 오히려 인하를 봤습니다. 의장은 이번에도 자기 전망치를 제출하지 않았고요.
    + b1 body_text[small][margin-top:14px] p1.dim 표결은 12명, 전망 제출은 참가자 전원이라 인원이 다릅니다. 2027년에 추가 인상을 찍은 참가자는 8명뿐, 4명은 오히려 인하를 봤습니다. 의장은 이번에도 자기 전망치를 제출하지 않았고요.

 obs[4] → art[4]  본문 변경 없음

요약: 본문이 바뀐 슬라이드 [('basic', 2), ('basic', 3), ('adv', 3)]
      - 단위 8개 / + 단위 15개 (슬라이드 삭제 0)
```

- diff 의 `obs[n]` `art[n]` 은 0부터 센 index 다. 이 로그 본문의 "n장"은 1부터 센다(`art[2]` = 입문 3장).
- 입문 3장의 `-` 게이지·dim 문장·teaser 는 **삭제가 아니라 4장으로 옮긴 것**이다(4장 `+` 에 같은 문자열이 그대로 있다).
- **교정 5건 밖의 문장 변경: 없음.** 바뀐 슬라이드는 입문 3장(#1), 입문 4장 신규(#1), 숙련 4장(#2 #3 #4) 셋뿐이다. #5 는 본문 변경이 없다.

---

### 범위 밖 발견 — 고치지 않고 적어둠

| # | 발견 | 행선지 제안 |
|---|---|---|
| 1 | C-0002 FULL ④ "그런데 **지금** 미국은 3%대입니다"는 개념 문안인데 현재 상태를 말한다. §4.3 기준으로는 Bridge | concept-library |
| 2 | C-0005 REFRESHER "참가자 전원" — 의장이 6월·9월 연속으로 안 냈다(F20). "참가자들이 각자"가 더 안전 | concept-library |
| 3 | 브리프 F13 문장 자체가 dot/명을 섞는다. 다음 작가가 또 옮긴다 | 브리프 |
| 4 | 숙련 2장 "3.3% → 3.4%"의 3.3%(6월 전망, F16)가 같은 슬라이드 7월 실적 3.3%(F31)와 구분 안 됨 | S3 또는 다음 교정 |
| 5 | 숙련 3장 timeline "9월 초" ↔ 브리프 T-1(9/15). 입문 7장 "반영하기 **시작**했어요"도 브리프에 없는 시점 | FOMC-22(S3) |
| 6 | 입문 9장 "**위원들** 대부분이" — SEP 제출자에는 투표권 없는 참가자도 있다. #2 와 같은 계열이지만 입문이라 범위 밖 | 다음 교정 |
| 7 | 게이지 눈금 62% 는 3.3%(F31)보다 3.7% 자리. `_fact_refs` 는 F31 로 달았다 | FOMC-14(S3) |
| 8 | 속도계 비유 한계선 ①(목표 복귀 시점)이 비유(입문 4장)에서 5장 뒤(입문 9장)에 있다. 분할 전후 거리 같음 | FOMC-17(S3) |
| 9 | 375×667(짧은 화면, `max-height:720px` 규칙 적용)에서는 **observed 도** 숙련 3~5장·입문 마지막 장이 넘친다(−12 ~ −52px). 입문 4장(신규)은 −2px | §8.5 / 프론트 |
| 10 | 같은 기간을 입문은 "두 달", 숙련은 "7주"로 쓴다(7/29→9/16, 49일). 틀린 건 아니다 | FOMC-11 과 같은 계열 |

---

### S3 입력 — 이번에 생긴 `_` 주석 필드

| 위치 | 필드 | 모양 |
|---|---|---|
| 최상단 | `_source` | derived_from · prototype · task · gate |
| 최상단 | `_published_at`, `_published_at_basis` | D8 DERIVED 의 기준 시각 |
| 슬라이드 | `_fact_refs[]` | `{where, span, refs[], kind, concept?, note?}` — 문장 단위 |
| 슬라이드 | `_volatility[]` DERIVED | `{where, span, class, value_at_authoring, check, formula{op, from/to 또는 of/offset}, derived_from[]{key, what, value, refs, brief_loc?, note?, volatility}, invariant}` |
| 슬라이드 | `_volatility[]` VOLATILE | `{where, span, class, refs, as_of, as_of_basis, note?}` |
| 슬라이드 | `_concept_ref[]` | concept_id 목록 |
| invalid | `_violation` | `{code, rule, where, what, golden}` |

S3 가 볼 만한 관찰:
- **DERIVED 는 fact 가 아니라 문장 조각(span)에 붙는다.** F11 의 "2026년"은 STABLE 인데 본문의 "올해"는 DERIVED 다. 같은 fact, 다른 분류
- `refs` 에 `DC-*` 를 F 와 섞어 넣었다. Derived Claim 을 fact 참조에 둘지 따로 둘지는 S3 결정
- `where` 경로와 문장 분할(`.?!` 뒤 공백, "1." 같은 번호 예외)이 사실상 계약이 됐다. 문장을 정식 단위로 올리면 분할 규칙도 계약에 들어간다
- `formula.op` 는 6개로 충분했다: `days_inclusive` · `weeks` · `months` · `months_round` · `years` · `years_floor` (+ `year_of`)

### error_type 신규 — "시점 앵커 누락"
기존 5종 중 가장 가까운 건 "스토리라인 stale"이지만, 그건 이야기가 이미 지나가 버린 **결과**다.
#5 는 그게 언제 일어날지 알 수 없게 만드는 **원인**(기준 시각·분류 부재)이고, 독자에게 보이는 문장은 하나도 틀리지 않았다. 억지로 넣지 않았다.
#3 은 "오독 미방어"로 넣었다 — 라벨이 빠져 독자가 두 지표를 같은 것으로 읽는 오독을 막지 못한 경우라서 무리가 없다고 봤다.
#4 는 "압축"으로 넣었다 — §4.5 판별("한 단계를 건너뛰고도 말이 되면")이 그대로 들어맞는다("dot 1개 = 1명").
다만 기계로 잡히는 오류라 "실제 독자만 잡는다"는 압축의 특성과는 다르다. 집계할 때 섞이는 게 문제면 "단위 혼용"으로 분리 가능.

---

### 게이트 질문 (도윤)

1. **#1 분할** — 두 장으로 나눈 것, 새 teaser·h1 두 문장이 교정 범위 안인가. kicker 를 ①① 로 둘지 ①②③ 으로 재번호할지
2. **#2 대안** — REFRESHER(채택, 375×812 여백 0px) / FULL 두 문장(정확, −12px) / §7.7 인원수 삭제
3. **#5 "201일째"** — 그대로 두고 UNVERIFIABLE 로 표시(채택) / 삭제 / 개전일을 1차 확인해 브리프에 추가
4. **`_published_at = 2026-09-16`** 역산을 받아들이는가 (D6 OPEN)
5. **D15 QA②** — 입문 3→4장, 4→5장의 teaser 가 다음 장에서 실제로 답해지는가 (읽어보고 판정)

### 완료 조건 대조
- [x] 교정 5건 전부 반영, 각각 correction-log 1줄
- [x] 다섯 개 외 문장 변경 없음 — 위 diff
- [x] 마지막 제외 모든 슬라이드에 teaser (D15 QA①) — `verify-article.py`
- [x] 골든에 `_findings` · `_dom_inventory` · `_transcription_notes` 없음 — `verify-article.py`
- [x] invalid 2건, 각각 위반 정확히 1개 — `verify-article.py` (골든과 1군데 차이 + 선언 code 로만 거부)
- [ ] **게이트: 도윤 승인**
- [ ] 완료일
