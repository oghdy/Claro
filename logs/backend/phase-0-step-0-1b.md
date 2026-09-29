# logs/backend · Phase 0 / Step 0.1b — 골든을 계약에 맞춰 다시 쓴다

## B-0.1b · 2026-09-29 · **PM 검수 대기** (D20 — 독자 글이 안 바뀌므로 도윤 게이트 없음)

`fixtures/fomc-2026-09.article.json` 을 `docs/contract/ARTICLE_PACKAGE.md` §12 목록대로 계약 모양으로 다시 썼다.
**독자가 읽는 글자는 하나도 바뀌지 않았다** — 115개 글 단위 · 3294자를 옛 골든(git `c46871d`)과 문자 단위로 대조했고 차이가 없다(아래 검증).
변환은 일회성 변환기로 했고(커밋 안 함), 옛 골든과의 글자 대조는 별도 스크립트가 독립적으로 한다.

### PM 이 먼저 볼 것

1. **0.2 대기가 계약 §12-6 의 7건이 아니라 15건이다.** 7건(브리지 2 · 브리프 산문 1 · 이란 사실 3 · 이란 전망 1)은 계약 그대로다.
   나머지 **8건**은 `partial` 을 "넘어서면 `claim`"으로 갈랐더니 생겼다 — 그 문장들은 F 만 있고 붙일 DC 가 없다.
   `claim` 의 refs 는 DC 만 받으므로(§6) `refs: []` + `_refs_pending {need: "DerivedClaim"}` 로 둘 수밖에 없었다(D22: 근거 없는 해석은 Derived Claim 도출이 필요).
   §12-6 은 이 경우를 세지 않았다. **멈추지 않고 §6.2 · D22 의 규칙대로 처리했다** — 아래 목록 #1 · 7 · 11 · 16 · 19 · 25 · 29 · 31.
   `fact` 로 뒤집을 문장이 있으면 그 span 의 `layer` 를 `fact` 로 바꾸고, `_refs_pending` 을 지우고, `refs` 에 `_fact_refs_dropped` 의 F 를 되돌리면 된다. 그만큼 대기가 준다.
2. **가장 경계에 있던 둘** — #19("2% 근처", F19 는 2.3%)와 #31(이란 규칙과 partial 규칙 사이). 각 행의 이유 참고.

### 산출

| 파일 | 내용 |
|---|---|
| `fixtures/fomc-2026-09.article.json` | 계약 모양 골든. 입문 9장 · 숙련 5장, span 122개 |
| `fixtures/invalid/volatile-missing-asof.json` · `derived-from-volatile.json` | 새 골든 + 위반 1개씩. `_violation` 선언은 그대로 |
| `scripts/verify-article.py` | 계약 §9 불변식 10개 + D8 + D9 + 스키마(계약 밖 필드 거부) |
| `scripts/compare-reader-text.py` | **옛 골든 → 새 골든 독자 글 대조.** 옛 골든은 git `c46871d` 에서 읽는다 |
| `scripts/selftest-verify-article.py` | 두 스크립트가 실제로 실패하는지 — 망가뜨린 사본 72 + 19개 (메모리 안, 파일 안 남김) |
| `scripts/diff-observed-article.py` | 새 골든 모양에 맞춤 (§12-13). observed → 골든 독자 글 diff, 같은 4장이 바뀐 것으로 나온다 |
| `scripts/verify-contract-coverage.py` | **범위 밖 수정 — 아래 "계약과 안 맞거나 범위 밖" 참고** |

### 층 분포 (새 골든)

`fact 59 · claim 34 · concept 21 · bridge 2 · writing 6` (span 122). 복합 단위(대조 항목 · 목록 항목 · 표 행)는 필드마다 span 이 생겨 옛 103 span 보다 많다.

## 판정이 애매했던 span — PM 검수 목록 (34건)

`[원래 kind · 붙인 layer · 이유 한 줄]`. 위치: 입문/숙련[슬라이드 0부터] · b블록/p문단. 요약 —
mixed F·DC **17**(#2 3 8 9 10 17 18 20 21 22 23 24 26 27 32 33 34) · partial **12**(#1 3 7 11 16 19 25 29 31 32 33 34 — 이 중 4건이 mixed 와 겹침) ·
이란 **4**(#13 14 15 30) · 브리프 산문 **1**(#12) · 브리지 **2**(#5 6) · concept 특이 **2**(#4 28).

| # | 위치 | 문장 | 원래 kind (refs) | 붙인 layer (refs) | 이유 |
|---|---|---|---|---|---|
| 1 | 입문[0] b0/p1 | 3년 넘게 연준은 금리를 그대로 두거나 내리기만 했어요. | partial (F03) | **claim** (—) · 대기 `DerivedClaim` | F03 은 '인상 없음'까지만 말한다. '내리기만'의 인하는 브리프에 없어 넘어선다 → claim. F 뿐이라 붙일 DC 가 없다 → 대기 |
| 2 | 입문[1] h1 | 아니요. 오히려 나은 편이었어요 | derived_claim (F32, DC-C) | **claim** (DC-C) | F32 사실 + DC-C 해석('나은 편') 섞임 → claim, refs 는 DC-C 만 |
| 3 | 입문[1] b0/p0 | 여름 동안 나온 물가 지표는 시장이 걱정하던 것보다 좋았습니다. | partial (F32, DC-C) | **claim** (DC-C) | partial + F32·DC-C 섞임. '시장이 걱정하던' 비교 대상은 브리프에 없다 → claim DC-C |
| 4 | 입문[3] h1 | 연준이 원하는 속도는 1년에 2%예요 | concept (—) | **concept** (C-0002, C-0003) | 옛 concept 필드는 C-0002 인데 note 는 '명제는 C-0003'(슬라이드 `_concept_ref` 도 둘). 둘 다 단다 — 하나로 줄이려면 PM 결정 |
| 5 | 입문[3] b0/p1 | 그런데 지금 미국은 3%대입니다. | fact (F31) | **bridge** (—) · 대기 `Bridge` | D20 브리지 후보. 옛 kind fact(F31). F31 은 `_fact_refs_dropped`. VOLATILE '지금' 주석은 그대로 |
| 6 | 입문[3] b0/p1 | 목표보다 빠르게 오르고 있어요. | fact (F10, F31) | **bridge** (—) · 대기 `Bridge` | D20 브리지 후보. 옛 kind fact(F10·F31) + concept C-0002 ④ (D19: ④ 는 브리지로 이동). F10·F31 은 `_fact_refs_dropped` |
| 7 | 입문[3] b2/p0 | 그리고 이 속도는 여름 내내 크게 줄지 않았어요. | partial (F24, F32) | **claim** (—) · 대기 `DerivedClaim` | 의장 평가(F24·F32)를 사실 서술로 옮겼고 '여름 내내' 실측 추이는 브리프에 없다 → 넘어섬 → claim, 대기 |
| 8 | 입문[5] b0/p0 | 연준이 던진 질문은 “물가가 나빠졌는가”가 아니었습니다. | derived_claim (DC-C, F33) | **claim** (DC-C) | F33 은 요약 서술 + DC-C 해석 섞임 → claim DC-C |
| 9 | 입문[5] b2/p0 | 그것도 브레이크를 더 밟을 이유가 됩니다. | derived_claim (DC-C, F33) | **claim** (DC-C) | DC-C 해석 + F33 섞임 → claim DC-C |
| 10 | 입문[6] h1 | 7월엔 셋만 그렇게 봤어요. 이번엔 전원이었고요. | derived_claim (F28, F02, DC-A) | **claim** (DC-A) | F28·F02 사실 + DC-A 해석('전원이었고요') 섞임 → claim DC-A |
| 11 | 입문[6] b1/p0 | 그 사이 8월 말 의장이 앞의 기준을 밝혔고, 시장은 인상 가능성을 90% 넘게 반영하기 시작했어요. | partial (F33, F36) | **claim** (—) · 대기 `DerivedClaim` | F36 은 T-1 '반영하고 있었음'. '반영하기 시작'은 브리프에 없다 → 넘어섬 → claim, 대기 |
| 12 | 입문[6] b1/p1 | 회의 내부 기록은 3주 뒤에 공개돼요. | brief_text (—) | **fact** (—) · 대기 `Fact 승격` | 브리프 §1 '아직 없는 것'(회의록 T+21)의 산문. F-ID 없음 → fact, 대기 'Fact 승격' (D20) |
| 13 | 입문[7] b0/p0 | 2월 말에 시작돼 반년 넘게 이어지고 있어요. | unsupported (—) | **fact** (—) · 대기 `Fact 출처` | 이란 전쟁 사실 서술 — D20·D22 이란 규칙: 글 그대로, fact, 대기 'Fact 출처'. 개전 시점·기간이 브리프 밖 |
| 14 | 입문[7] b0/p0 | 4월에 휴전 합의가 한 번 있었지만 이후 공격이 반복되면서 기름값은 크게 올랐다 내렸다를 되풀이했습니다. | unsupported (—) | **fact** (—) · 대기 `Fact 출처` | 이란 전쟁 사실 서술 — 같은 규칙. 4월 휴전·공격 반복·유가 등락이 브리프 밖 |
| 15 | 입문[7] b1 | 이 전쟁이 끝나면 물가는 저절로 내려갈 수도, 더 커지면 훨씬 나빠질 수도 있어요. | unsupported (—) | **claim** (—) · 대기 `DerivedClaim` | 이란 전망 문장 — D22: 사실이 아니라 우리 전망 → claim, 대기 'DerivedClaim'. 브리프 DC-A~E 에 없다 |
| 16 | 입문[7] b1 | 연준이 “확신이 없다”고 말한 이유의 상당 부분이 여기 있습니다. | partial (F07, F33) | **claim** (—) · 대기 `DerivedClaim` | '확신이 없다'에 인용 부호가 붙었지만 그런 발언은 브리프에 없고, '상당 부분'은 원인 비중 해석 → claim, 대기. 글은 안 고침 |
| 17 | 입문[8] h1 | 한 번은 더. 그런데 긴 흐름은 아니에요 | derived_claim (F11, F12, DC-D) | **claim** (DC-D) | F11·F12 사실 + DC-D 해석 섞임 → claim DC-D |
| 18 | 입문[8] b0/p1 | 올해 한 번쯤 더 올리고, 내년에는 대체로 그 자리. | derived_claim (F11, F12, DC-D) | **claim** (DC-D) | F11·F12 + DC-D 섞임 → claim DC-D |
| 19 | 입문[8] b0/p2 | 참고로 연준 자신도 물가가 2% 근처로 돌아오는 건 내년 말쯤으로 보고 있어요. | partial (F19) | **claim** (—) · 대기 `DerivedClaim` | **경계.** F19 는 2027년 말 PCE 2.3%, '2% 근처'는 느슨한 옮김. 사실로 볼 여지가 있으나 애매하면 claim(D20) → 대기. fact+F19 로 뒤집으면 대기 1건 줄어든다 |
| 20 | 입문[8] b1 | 내려오고는 있는데 충분히 빠르지 않다고 본 거예요. | derived_claim (DC-C, F33) | **claim** (DC-C) | DC-C 해석 + F33 섞임 → claim DC-C |
| 21 | 숙련[0] b1/p0 | 7주 만에 소수의견이 전원 합의가 됐습니다. | derived_claim (F28, F02, DC-A) | **claim** (DC-A) | F28·F02 사실 + DC-A('전원 합의가 됐다') 섞임 → claim DC-A |
| 22 | 숙련[1] h1 | 악화가 아니라 개선 속도가 기준이었습니다 | derived_claim (DC-C, F33) | **claim** (DC-C) | DC-C + F33 섞임 → claim DC-C |
| 23 | 숙련[1] b0/p0 | 여름 물가 지표는 예상보다 나았습니다. | fact (F32, DC-C) | **claim** (DC-C) | **원래 kind=fact.** refs 에 DC-C 가 섞여 있다('예상보다 나았다'는 브리프의 해석 DC-C) → 추론이 있어 claim |
| 24 | 숙련[1] b0/p0 | 7월 근원 PCE는 전년 대비 3.3%로, 6월 전망치와 사실상 같았고요. | fact (F31, F16, DC-C) | **claim** (DC-C) | **원래 kind=fact.** F31·F16 + DC-C('사실상 같았다' 해석) → claim. 3.3%(F31)와 3.3%(F16) 표기 문제는 옛 note 그대로(안 고침) |
| 25 | 숙련[2] b0/항목3 라벨 | 9월 초 | partial (F35, F36) | **claim** (—) · 대기 `DerivedClaim` | 타임라인 셋째 항목을 라벨/본문으로 나눴다. 본문(시장 90%+ · 10년물 4.6%)은 F35·F36 이 다 말하므로 fact(F35·F36). 라벨 '9월 초'만 브리프(둘 다 T-1=9/15)와 다르다 → claim, 대기. 옛 span 은 항목 통째 partial 이었다 |
| 26 | 숙련[3] h1 | 한 번 더. 그리고 내년은 제자리 | derived_claim (F11, F12, DC-D) | **claim** (DC-D) | F11·F12 + DC-D 섞임 → claim DC-D |
| 27 | 숙련[3] b1/p0 | 2026년과 2027년 중앙값이 같다는 것이 핵심입니다. | derived_claim (F11, DC-D) | **claim** (DC-D) | F11 + DC-D('핵심입니다') 섞임 → claim DC-D |
| 28 | 숙련[3] b1/p1 | 표결은 투표권자 12명이 하고, 전망은 투표권과 관계없이 참가자들이 냅니다. | concept (F02) | **concept** (C-0005) | 옛 kind=concept(C-0005 REFRESHER)인데 refs 에 F02 가 있었다. 층은 kind 대로 concept, F02 는 `_fact_refs_dropped` |
| 29 | 숙련[4] b0/p0 | 1. 물가의 큰 부분이 전쟁에 달려 있습니다. | partial (F07, F37) | **claim** (—) · 대기 `DerivedClaim` | '큰 부분'은 브리프에 없는 비중 해석(F07·F37 은 불확실성·경유 최고) → claim, 대기 |
| 30 | 숙련[4] b0/p0 | 이란 전쟁은 201일째. | unsupported (—) | **fact** (—) · 대기 `Fact 출처` | 이란 전쟁 사실 서술('201일째', DERIVED) → fact, 대기 'Fact 출처'. 개전일이 브리프에 없어 D8 재계산은 UNVERIFIABLE WARN |
| 31 | 숙련[4] b0/p0 | 4월 휴전 이후에도 공격이 반복되며 유가는 크게 등락했고, 회의 당일 경유 가격은 사상 최고였습니다. | partial (F37) | **claim** (—) · 대기 `DerivedClaim` | **이란 규칙과의 경계.** 경유 최고(F37)만 브리프에 있고 나머지(4월 휴전 · 공격 반복 · 유가 등락)는 브리프 밖 사실 서술. partial 규칙(넘어서면 claim)을 문자 그대로 적용 → claim, 대기. 이란 규칙대로라면 fact + 'Fact 출처'가 더 맞고, 지금은 need 가 'DerivedClaim' 이라 0.2 가 엉뚱한 일을 받는다 |
| 32 | 숙련[4] b0/p1 | 그런데 실업률은 4.2%에서 4.1%로 내려갔죠. | partial (F30, DC-E) | **claim** (DC-E) | F30 사실 + DC-E 본문에만 있는 6월 4.2% 섞임 → claim DC-E |
| 33 | 숙련[4] b0/p1 | 의장은 이를 노동공급 감소로 설명했고, 성명문은 고용 증가가 노동력 증가와 보조를 맞췄다고 썼습니다. | partial (DC-E, F09) | **claim** (DC-E) | DC-E(P3 출처 언급) + F09 섞임 → claim DC-E |
| 34 | 숙련[4] b1 | 따라서 이번 회의의 변화는 금리 숫자가 아니라 인상을 둘러싼 내부 긴장이 전망에서 실제 행동으로 옮겨왔다는 점입니다. | partial (F28, F02, DC-A) | **claim** (DC-A) | F28·F02 + DC-A 섞임. '전망에서 실제 행동으로'는 F29 를 전제하는데 숙련 본문에 F29 없음(옛 note) |

요약: 대기 15 = `Bridge` 2 · `DerivedClaim` 9 · `Fact 출처` 3 · `Fact 승격` 1. `DerivedClaim` 9 = 이란 전망 1 + partial 8.
mixed 17 은 전부 `claim` 이 됐고 refs 는 DC 만 남았다 — 끊긴 F 는 span 의 `_fact_refs_dropped` 에 있다(`--report` 로 목록).

### 목록에 없지만 원래 kind 를 그대로 옮긴 것 중 눈에 띈 것 (안 고침 — 독자 글 불변)

- 입문 8장 h1 "이란 전쟁이 어디로 갈지 모릅니다" — 원래 `fact`(F07·F37). F07 은 "불확실성이 높다"이고 문장은 우리의 표현에 가깝다. 그대로 `fact`
- 인용 블록 body(입문 6장 · 숙련 2장) — 계약 §7.4 가 인용 글을 `fact` 로 정했으니 `fact`(F33). 그런데 브리프 F33 은 요약 서술이고 원문(P3) 문장이 브리프에 없어 원문 대조는 아직 못 한다(옛 note)
- 입문 9장 "위원들 대부분이…" — 옛 note: SEP 제출자에는 투표권 없는 참가자도 있다(C-0005). 교정 범위 밖이라 `fact` 그대로
- 게이지 둘째 항목 "지금 미국 3%대" — `fact`(F31), VOLATILE(as_of 8/30). 눈금이 없어졌으니 글자만 남았다

### 계약과 안 맞거나 범위 밖에서 한 것

1. **(위 "먼저 볼 것" 1)** §12-6 의 "0.2 대기 7" 밖에 partial → claim 8건이 생겼다. 규칙대로 처리, PM 확인 요청
2. **인용 출처 표시에 refs 를 실을 곳이 없다.** §7.4 의 `attribution` 은 문자열이라 옛 tag 의 `F32,F33`(8/28 잭슨홀 연설)이 갈 자리가 없다. 버리지 않고 quote 블록의 `_attribution_refs` 로 남겼다
3. **`_` 주석 이름 두 개를 새로 썼다** — `_fact_refs_dropped`(span 하나에 layer 하나라 refs 에서 뺀 F 연결. 0.2 가 Claim → Fact 로 옮긴다) · `_attribution_refs`. 계약이 `_` 이름을 닫지는 않았다(§9-10 "등"). 발행물에는 없다
4. **`scripts/verify-contract-coverage.py` 를 손댔다 (범위 밖).** 검사 1 이 골든 파일을 읽어 부록 A 커버리지를 확인하는데, 골든이 계약 모양이 되면서 옛 모양 경로가 사라져 FAIL 했다.
   부록 A 는 옛 모양 경로의 대응표라서, 옛 골든을 git `c46871d` 에서 읽도록 세 줄만 바꿨다. 결과는 137개 경로 그대로 PASS
5. `_volatility` 는 슬라이드 · `open_question` 개체에 `_` 주석으로 남겼다. `where` 는 그 개체 기준 경로(`headline`, `blocks/1/items/1/value`, `text` …)로 고쳤다. 입문 6장(0부터 5) teaser 의 "두 달 전" 은 `open_questions[5]` 에 붙었다
6. 골든에서 뺀 것(계약 §12 · 부록 A): `chrome` · `interaction` · `end_actions` 2개 · teaser 기호 `Q`/`·` · callout `warn` · stats `up`/`flat` · 게이지 눈금 `[33, 62]` · 그라데이션. `_source` 는 픽스처 이력으로 남기고 `restructured` 를 더했다
7. 문장이 이상해 보이는 곳은 안 고쳤다: 숙련 3장 타임라인 셋째 항목 라벨 "9월 초"(브리프는 9/15, FOMC-22) · 입문 8장 callout 의 `“확신이 없다”`(그런 발언은 브리프에 없다) · 숙련 2장 "6월 전망치와 사실상 같았고요"와 뒤 문단 "3.3% → 3.4%"의 3.3% 두 개(옛 note) · 숙련 5장 "201일째"(개전일이 브리프에 없어 UNVERIFIABLE)
8. `DATA_MODEL` · `CONCEPT_IDENTITY` 는 열지 않았다. observed · FTC 는 건드리지 않았다. 계약 · DECISIONS 는 수정하지 않았다.
   판정에 브리프 `docs/findings/fomc-2026-09-brief.md` 의 F 표 한 줄씩(F03 · F19 · F32~F36)을 대조했다 — 검증 스크립트가 원래 읽는 파일이다

## 검증 — 출력 그대로

### 1) 계약 §9 불변식 · D8 · invalid 2건 — `python3 scripts/verify-article.py`

```
$ python3 scripts/verify-article.py
PASS  fixtures/fomc-2026-09.article.json
   WARN  0.2 대기 15 span — Bridge 2 · DerivedClaim 9 · Fact 승격 1 · Fact 출처 3
   WARN  basic[7] blocks/0/paragraphs/0/body "반년 넘게": DERIVED 출처 ['war_start'] 가 브리프 밖
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 불변식 검증 불가 — 개전일이 브리프에 없고 기사 안 출처("2월 말")는 기간이다. 2/28 이면 201, 2/21 이면 208
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 출처 ['war_start'] 가 브리프 밖
PASS  fixtures/invalid/derived-from-volatile.json  — 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic[6] blocks/1/paragraphs/1/body "3주 뒤에": 출처 ['minutes'] 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/levels/0/slides/6/_volatility/2/derived_from/0/volatility']
PASS  fixtures/invalid/volatile-missing-asof.json  — 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic[3] blocks/0/paragraphs/1/body "지금 미국은 3%대": VOLATILE 인데 as_of 가 없다 (D8)
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
exit=0
```

`--report` 의 층 분포 · 0.2 대기 목록:

```
$ python3 scripts/verify-article.py --report   (일부: 층별 · 대기)
  층별 span 수: {'bridge': 2, 'claim': 34, 'concept': 21, 'fact': 59, 'writing': 6} (합 122)
  대기 [claim  DerivedClaim] basic[0]/blocks/0/paragraphs/1/body/1 "3년 넘게 연준은 금리를 그대로 두거나 내리"
  대기 [bridge Bridge] basic[3]/blocks/0/paragraphs/1/body/0 "그런데 지금 미국은 3%대입니다. "
  대기 [bridge Bridge] basic[3]/blocks/0/paragraphs/1/body/1 "목표보다 빠르게 오르고 있어요."
  대기 [claim  DerivedClaim] basic[3]/blocks/2/paragraphs/0/body/0 "그리고 이 속도는 여름 내내 크게 줄지 않았"
  대기 [claim  DerivedClaim] basic[6]/blocks/1/paragraphs/0/body/0 "그 사이 8월 말 의장이 앞의 기준을 밝혔고"
  대기 [fact   Fact 승격] basic[6]/blocks/1/paragraphs/1/body/1 "회의 내부 기록은 3주 뒤에 공개돼요."
  대기 [fact   Fact 출처] basic[7]/blocks/0/paragraphs/0/body/0 "2월 말에 시작돼 반년 넘게 이어지고 있어요"
  대기 [fact   Fact 출처] basic[7]/blocks/0/paragraphs/0/body/1 "4월에 휴전 합의가 한 번 있었지만 이후 공"
  대기 [claim  DerivedClaim] basic[7]/blocks/1/paragraphs/0/body/1 "<b>이 전쟁이 끝나면 물가는 저절로 내려갈"
  대기 [claim  DerivedClaim] basic[7]/blocks/1/paragraphs/0/body/2 "연준이 “확신이 없다”고 말한 이유의 상당 "
  대기 [claim  DerivedClaim] basic[8]/blocks/0/paragraphs/2/body/0 "참고로 연준 자신도 물가가 2% 근처로 돌아"
  대기 [claim  DerivedClaim] advanced[2]/blocks/0/items/3/label/0 "9월 초"
  대기 [claim  DerivedClaim] advanced[4]/blocks/0/paragraphs/0/body/0 "<b>1. 물가의 큰 부분이 전쟁에 달려 있"
  대기 [fact   Fact 출처] advanced[4]/blocks/0/paragraphs/0/body/1 "이란 전쟁은 201일째. "
  대기 [claim  DerivedClaim] advanced[4]/blocks/0/paragraphs/0/body/2 "4월 휴전 이후에도 공격이 반복되며 유가는 "
```

발행 검사(§9-10) — 골든은 발행물이 아니라서 `_` 주석 때문에 거부돼야 한다:

```
$ python3 scripts/verify-article.py fixtures/fomc-2026-09.article.json --publish
FAIL  fixtures/fomc-2026-09.article.json
   ERROR UNDERSCORE_IN_PUBLISH: /_source: 발행물에 `_` 필드가 있다 (§9-10)
   ERROR UNDERSCORE_IN_PUBLISH: /_published_at_basis: 발행물에 `_` 필드가 있다 (§9-10)
   ... (UNDERSCORE_IN_PUBLISH 57건 — 위 3건과 같은 종류, 다른 code 없음)
FAIL  (exit=1 이 정상)
```

### 2) 독자 글 불변 — `python3 scripts/compare-reader-text.py`

```
$ python3 scripts/compare-reader-text.py
옛 골든 c46871d → 새 골든 fixtures/fomc-2026-09.article.json
  레벨 2 · 슬라이드 14 · 독자 글 단위 115개 · 3294자 대조
  계약이 버리는 것 (대조 밖): end_actions 2개 · teaser 기호 · 눈금 · modifier · style

OK — 독자 글 불변
exit=0
```

### 3) 검증 스크립트가 실제로 실패하는가 — `python3 scripts/selftest-verify-article.py`

망가뜨리지 않은 골든은 통과하고, 위반을 하나씩 넣은 사본은 **기대한 code 만** 나와야 통과다(다른 code 가 섞이면 실패).
compare 쪽은 글자 · 공백 · `<b>` 위치 · `<br>` · 순서 · 무게 · 강조를 바꾼 사본이 실패해야 하고, span 경계만 바꾼 사본은 통과해야 한다.

```
$ python3 scripts/selftest-verify-article.py
== verify-article.py — 사본 72개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 골든은 통과해야 한다
        기대 — / 실제 —
  PASS  골든을 --publish 로 검사하면 `_` 때문에 거부 (§9-10 — 골든은 발행물이 아니다)
        기대 ['UNDERSCORE_IN_PUBLISH'] / 실제 ['UNDERSCORE_IN_PUBLISH']
  PASS  §9-1 levels 0개
        기대 ['LEVELS_COUNT'] / 실제 ['LEVELS_COUNT']
  PASS  §9-1 levels 4개
        기대 ['LEVELS_COUNT'] / 실제 ['LEVELS_COUNT']
  PASS  §9-1 레벨 id 옛 값 adv
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 레벨 id 겹침
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 레벨 순서 뒤바뀜 (advanced → basic)
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 slides 비움
        기대 ['SLIDES_EMPTY'] / 실제 ['SLIDES_EMPTY']
  PASS  §9-1 blocks 비움
        기대 ['BLOCKS_EMPTY'] / 실제 ['BLOCKS_EMPTY']
  PASS  §9-2 open_question 하나 삭제 (길이 ≠ 장수 − 1)
        기대 ['OQ_LENGTH'] / 실제 ['OQ_LENGTH']
  PASS  §9-2 open_question 하나 추가
        기대 ['OQ_LENGTH'] / 실제 ['OQ_LENGTH']
  PASS  §9-2 open_question text 빈 문자열
        기대 ['OQ_EMPTY'] / 실제 ['OQ_EMPTY']
  PASS  §9-3 슬라이드에 resolves
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 open_question 에 goto_index
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 슬라이드에 index
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 `_` 주석 안의 goto (주석에도 없어야 한다)
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-4 블록 text 삭제
        기대 ['BLOCK_NO_TEXT'] / 실제 ['BLOCK_NO_TEXT']
  PASS  §9-4 text 한 글자 바꿈 (구조는 그대로)
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 구조만 고침 (span 수치 3.7→3.8), text 는 그대로 — 화면 3.8 / 질문 3.7
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 강조를 구조에서만 뺌 (hit → emphasized 제거), text 는 그대로
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 목록 순서를 구조에서만 바꿈 (항목에 붙은 _volatility where 도 어긋나 VOL_SPAN 이 같이 나온다)
        기대 ['TEXT_MISMATCH', 'VOL_SPAN'] / 실제 ['TEXT_MISMATCH', 'VOL_SPAN']
  PASS  §9-4 ordered 뒤집음 (번호가 글자로 남아야 한다)
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-5 type=gauge (옛 관측 타입)
        기대 ['BLOCK_TYPE'] / 실제 ['BLOCK_TYPE']
  PASS  §9-5 type=scale (두지 않기로 한 원형)
        기대 ['BLOCK_TYPE'] / 실제 ['BLOCK_TYPE']
  PASS  §9-6 layer 옛 이름 derived_claim
        기대 ['SPAN_LAYER'] / 실제 ['SPAN_LAYER']
  PASS  §9-6 writing 인데 refs
        기대 ['REFS_WRITING'] / 실제 ['REFS_WRITING']
  PASS  §9-6 fact 인데 refs 비었고 대기 표시도 없음
        기대 ['REFS_EMPTY'] / 실제 ['REFS_EMPTY']
  PASS  §9-6 대기 span 의 _refs_pending 만 지움 (조용히 두면 안 된다)
        기대 ['REFS_EMPTY'] / 실제 ['REFS_EMPTY']
  PASS  §9-6 claim span 에 Fact ID (층 섞임)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 fact span 에 DC ID (층 섞임)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 fact span 에 F·DC 혼합 (D20 — 섞으면 안 된다)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 없는 Fact ID
        기대 ['REF_UNKNOWN'] / 실제 ['REF_UNKNOWN']
  PASS  §9-6 없는 개념 ID
        기대 ['REF_UNKNOWN'] / 실제 ['REF_UNKNOWN']
  PASS  §9-6 refs 와 대기 표시가 동시에
        기대 ['PENDING_WITH_REFS'] / 실제 ['PENDING_WITH_REFS']
  PASS  §9-6 writing 에 대기 표시
        기대 ['PENDING_INVALID'] / 실제 ['PENDING_INVALID']
  PASS  §9-6 대기 표시 until 이 0.2 가 아님
        기대 ['PENDING_INVALID'] / 실제 ['PENDING_INVALID']
  PASS  §9-6 claim 의 need 가 Fact 출처 (D22 — claim 은 DerivedClaim)
        기대 ['PENDING_NEED_LAYER'] / 실제 ['PENDING_NEED_LAYER']
  PASS  §9-6 span 에 layer 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  §9-6 _fact_refs_dropped 에 없는 ID
        기대 ['DROPPED_UNKNOWN'] / 실제 ['DROPPED_UNKNOWN']
  PASS  §6 인용 글이 fact 가 아님
        기대 ['QUOTE_LAYER'] / 실제 ['QUOTE_LAYER']
  PASS  span text 빈 문자열 (그 span 에 붙은 _volatility 도 같이 걸린다)
        기대 ['SPAN_EMPTY', 'VOL_SPAN'] / 실제 ['SPAN_EMPTY', 'VOL_SPAN']
  PASS  §9-7 span 안에 <br>
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-7 span 안에 <i>
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-7 <b> 가 span 을 넘는다
        기대 ['BOLD_CROSSES_SPAN'] / 실제 ['BOLD_CROSSES_SPAN']
  PASS  §9-7 kicker 에 태그
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-8 emphasized 항목을 <b> 로 통째 감쌈
        기대 ['EMPHASIZED_DOUBLE'] / 실제 ['EMPHASIZED_DOUBLE']
  PASS  §9-9 슬라이드에 as_of (읽는 시각 필드)
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  §9-9 블록에 formula
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  §9-9 패키지에 now
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  D8 published_at 이 날짜가 아님
        기대 ['D8_NO_PUBLISHED_AT'] / 실제 ['D8_NO_PUBLISHED_AT']
  PASS  D8 published_at 을 10/16 으로 (모든 DERIVED 를 다시 계산해야 한다)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D8 VOLATILE 의 as_of 삭제
        기대 ['VOLATILE_MISSING_AS_OF'] / 실제 ['VOLATILE_MISSING_AS_OF']
  PASS  D8 as_of 형식 오류
        기대 ['VOLATILE_BAD_AS_OF'] / 실제 ['VOLATILE_BAD_AS_OF']
  PASS  D8 DERIVED 출처를 VOLATILE 로
        기대 ['DERIVED_FROM_VOLATILE'] / 실제 ['DERIVED_FROM_VOLATILE']
  PASS  D8 value_at_authoring 을 틀리게 (3주 → 4주)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D8 기록된 invariant 가 재계산과 다름
        기대 ['DERIVED_INVARIANT_MISMATCH'] / 실제 ['DERIVED_INVARIANT_MISMATCH']
  PASS  D8 class 오류
        기대 ['VOL_CLASS'] / 실제 ['VOL_CLASS']
  PASS  D8 where 경로가 가리키는 글에 span 이 없다
        기대 ['VOL_SPAN'] / 실제 ['VOL_SPAN']
  PASS  D8 where 경로가 없다
        기대 ['VOL_SPAN'] / 실제 ['VOL_SPAN']
  PASS  D8 open_question 의 DERIVED 를 깸 (두 달 전 → 3)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D9 최상단에 _findings
        기대 ['D9_OBSERVED_KEY'] / 실제 ['D9_OBSERVED_KEY']
  PASS  스키마 옛 필드 Level.label 이 남음 (D22)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 필드 slide_count
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 teaser 가 슬라이드에 남음
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 h1
        기대 ['SCHEMA_KEY', 'SCHEMA_MISSING'] / 실제 ['SCHEMA_KEY', 'SCHEMA_MISSING']
  PASS  스키마 event_hint 가 남고 event_ref 없음
        기대 ['SCHEMA_KEY', 'SCHEMA_MISSING'] / 실제 ['SCHEMA_KEY', 'SCHEMA_MISSING']
  PASS  스키마 옛 chrome 이 남음
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 title 에 브랜드
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 contrast 항목에 value · body 둘 다 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  스키마 prose weight 오류 (warn 은 판단 색이라 없다)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 sheet 행에 v_modifier (판단 색)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 quote 에 attribution 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  §9-10 발행 검사에서는 `_` 필드가 하나라도 있으면 실패
        기대 ['UNDERSCORE_IN_PUBLISH'] / 실제 ['UNDERSCORE_IN_PUBLISH']
  → 전부 기대대로

== compare-reader-text.py — 사본 19개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 새 골든은 옛 골든과 글이 같다
        기대 115단위 3294자 / 실제 OK
  PASS  본문 한 글자 (금리를→금리은)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [replace] 옛 '를' → 새 '은'  (옛 24~25, 새 24~25)
  PASS  마침표 하나 삭제
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [delete] 옛 '.' → 새 ''  (옛 40~41, 새 40~40)
  PASS  공백 하나 추가 (독자 눈엔 안 보여도 글자다)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [insert] 옛 '' → 새 ' '  (옛 45~45, 새 45~46)
  PASS  <b> 위치 이동 (굵기도 글이다)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [delete] 옛 '<b>' → 새 ''  (옛 45~48, 새 45~45); [insert] 옛 ''
  PASS  <br> → 공백 (headline 줄바꿈 소실)
        기대 실패해야 함 / 실제 1건 — basic[0] headline: 글자가 다르다 — [replace] 옛 '\n' → 새 ' '  (옛 9~10, 새 9~10)
  PASS  kicker 변경
        기대 실패해야 함 / 실제 1건 — basic[2] kicker: 글자가 다르다 — [replace] 옛 '①' → 새 '②'  (옛 13~14, 새 13~14)
  PASS  open_question 한 글자
        기대 실패해야 함 / 실제 1건 — basic[0] open_question: 글자가 다르다 — [delete] 옛 '?' → 새 ''  (옛 13~14, 새 13~13)
  PASS  게이지 값 2% → 2.0%
        기대 실패해야 함 / 실제 1건 — basic[3] blocks/1 0.value: 글자가 다르다 — [insert] 옛 '' → 새 '.0'  (옛 1~1, 새 1~3)
  PASS  게이지 라벨 바꿈
        기대 실패해야 함 / 실제 1건 — basic[3] blocks/1 1.label: 글자가 다르다 — [replace] 옛 '지금' → 새 '현재'  (옛 0~2, 새 0~2)
  PASS  표 값 4.1% → 4.2%
        기대 실패해야 함 / 실제 1건 — advanced[3] blocks/0 0.value: 글자가 다르다 — [replace] 옛 '1' → 새 '2'  (옛 2~3, 새 2~3)
  PASS  인용 출처 표시 변경
        기대 실패해야 함 / 실제 1건 — basic[5] blocks/1 attribution: 글자가 다르다 — [replace] 옛 '연설' → 새 '발언'  (옛 10~12, 새 10~12)
  PASS  목록 라벨 변경
        기대 실패해야 함 / 실제 1건 — advanced[2] blocks/0 0.label: 글자가 다르다 — [replace] 옛 '9' → 새 '8'  (옛 3~4, 새 3~4)
  PASS  문단 순서 뒤바뀜
        기대 실패해야 함 / 실제 3건 — basic[0] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 ['normal', 'secondary'] / 새 ['secondary', 'normal
  PASS  슬라이드 하나 삭제
        기대 실패해야 함 / 실제 41건 — basic: 장수가 다르다 — 옛 9 / 새 8
  PASS  블록 하나 삭제
        기대 실패해야 함 / 실제 1건 — basic[1]: 블록 수가 다르다 — 옛 2 / 새 1
  PASS  문단 무게 secondary → normal (dim 소실)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 ['normal', 'secondary'] / 새 ['normal', 'normal']
  PASS  강조 제거 (hit 소실)
        기대 실패해야 함 / 실제 1건 — basic[6] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 [False, True] / 새 [False, False]
  PASS  목록 ordered 뒤집음
        기대 실패해야 함 / 실제 1건 — advanced[2] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 [True, True, True, True, True] / 새 [False, Fal
  PASS  span 을 쪼개도 이음이 같으면 통과 (경계는 새 데이터)
        기대 통과해야 함 / 실제 0건
  → 전부 기대대로

OK
exit=0
```

### 4) 계약 커버리지 (부록 A) — `python3 scripts/verify-contract-coverage.py`

```
$ python3 scripts/verify-contract-coverage.py
PASS  1. 관측 경로 137개가 부록 A(91행)에 있다
PASS  2. D8 · D11 · D12 · D13 · D14 · D15 · D16 · D17 · D20 · D22 언급
PASS  3. 원형 5개 = prose · quote · list · contrast · sheet (scale 없음), Block 유니언 일치, 근거 1건 표시
      [('prose', '둘 다'), ('quote', '둘 다'), ('list', '둘 다'), ('contrast', '둘 다'), ('sheet', '근거 1건')]
PASS  4. 원형마다 절이 있고 "정규 텍스트"가 정의돼 있다
PASS  5. §11 의 _open 5개가 전부 "판정됨 → D20", §11 밖에 남은 _open 없음
PASS  6. §12 에 "게이지 → contrast 두 항목. 글자는 그대로" + 버리는 눈금 [33, 62]
PASS  7. 0.2 소관 타입을 정의하지 않음
PASS  8. 0.1a 표 20행 전부 처리 표시 (계약 반영 / _open / 0.2 로 / 범위 밖)
PASS  9. D20 — 레벨 어휘 · 층 판정 규칙 · 0.2 대기 표시(§6 · §9) · 척도 미확인
PASS  10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위

OK
exit=0
```

### 5) observed → 새 골든 (0.0b 게이트가 고친 곳이 그대로 나오는지) — `python3 scripts/diff-observed-article.py`

옛 스크립트를 옛 골든에 돌린 결과와 바뀐 슬라이드 집합이 같다: 입문 3 · 4 · 5장(0부터 2 · 3 · 4) · 숙련 4장(0부터 3). 요약줄:

```

요약: 본문이 바뀐 슬라이드 [('basic', 2), ('basic', 3), ('basic', 4), ('advanced', 3)]
      - 단위 10개 / + 단위 17개 (슬라이드 삭제 0)
```

(옛: `- 단위 9개 / + 단위 16개`. 새 단위가 필드 단위라 게이지 항목이 4단위가 되어 1씩 다르다. 글 차이는 같다.)

## 남은 것 · 다음
- **PM 검수** — 위 34건. 독자 그림에 영향이 있다고 보이면 도윤에게 (D20)
- 0.2 — 대기 15 span 을 채운다. WARN 이 0 이 될 때까지 `verify-article.py` 가 센다. 프론트 레인은 이 골든으로 열린다


---

## B-0.1b · 2026-09-29 · PM 검수 반영 (D23)

D23 — `partial` · `unsupported` 는 출처 커버리지 분류이지 층이 아니다. "브리프를 넘어선다"를 사실 / 추론으로 가른다. 독자 글 수정 1건(도윤 승인).

### 1. 층 판정 뒤집기 (위 34건 목록 기준)

| # | 위치 | 전 | 후 |
|---|---|---|---|
| 1 | 입문[0] b0/p1 "3년 넘게 … 내리기만 했어요." | claim · 대기 DerivedClaim | **fact** (F03). `_refs_pending` · `_fact_refs_dropped` 정리 |
| 19 | 입문[8] b0/p2 "참고로 … 내년 말쯤으로 보고 있어요." | claim · 대기 DerivedClaim | **fact** (F19). 정리 |
| 25 | 숙련[2] b0/항목3 라벨 "9월 초" | claim · 대기 DerivedClaim | **fact** · 대기 `Fact 출처` (날짜 서술 — 브리프는 9/15 만). 끊긴 F 는 애초에 라벨에 안 달았다 |
| 31 | 숙련[4] b0/p0 "4월 휴전 이후에도 … 사상 최고였습니다." | claim (한 span) · 대기 DerivedClaim · dropped F37 | **span 둘로 (글자 그대로):** `4월 휴전 이후에도 … 크게 등락했고, ` → **fact** · 대기 `Fact 출처` / `회의 당일 경유 가격은 사상 최고였습니다. ` → **fact** (F37). 쪼갠 경계의 공백은 앞 조각 끝에 붙는 기존 규칙 그대로 |

#7 · #11 · #16 · #29 는 `claim` 그대로(대기 DerivedClaim), #4 concept 참조 둘(C-0002 · C-0003)은 그대로.
`_volatility` 의 "경유 가격은 사상 최고"(VOLATILE, F37)는 같은 문단에 있어 `where` 가 그대로 맞는다.

### 2. 독자 글 수정 1건 (도윤 승인)

입문 8장 callout: `연준이 “확신이 없다”고 말한 이유` → `연준이 확신이 없다고 본 이유`. 층은 `claim` · 대기 `DerivedClaim` 그대로(원인 비중은 해석).
- `compare-reader-text.py` 에 이 한 건만 `ALLOWED` 로 명시했다 — 위치(`basic[7] blocks/1 p0`) · 옛 글에서 바꾼 부분이 정확히 일치하고, 결과가 새 글과 같아야 통과. 글자가 하나라도 더 바뀌거나 다른 위치에 적용되면 실패한다(selftest 4건)
- `logs/correction-log.csv` 1행 추가: stage=게이트(0.1b PM 검수) · error_type=레이어 혼입 · source_of_catch=0.1b 층 판정 + PM 검수 · time_spent_min 비움. 유형은 지시대로 두었다

### 3. 대기 합계 — 13 확인

`Bridge 2 · DerivedClaim 5 · Fact 출처 5 · Fact 승격 1` = 13. DerivedClaim 5 = 이란 전망 + #7 · #11 · #16 · #29. 층 분포는 `fact 64 · claim 30 · concept 21 · bridge 2 · writing 6` (span 123 — #31 이 하나 늘었다).
D23 이 말한 대로 `claim` span 은 DC refs 1개 이상이어야 발행된다(§9-6). 이미 그렇게 검사하고 있어서 스크립트는 안 바꿨다 — 대기 5개 전부가 발행 전에 DC 를 얻어야 한다.

### 4. 검증 — 다시 돌린 출력 그대로

`python3 scripts/verify-article.py`
```
$ python3 scripts/verify-article.py
PASS  fixtures/fomc-2026-09.article.json
   WARN  0.2 대기 13 span — Bridge 2 · DerivedClaim 5 · Fact 승격 1 · Fact 출처 5
   WARN  basic[7] blocks/0/paragraphs/0/body "반년 넘게": DERIVED 출처 ['war_start'] 가 브리프 밖
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 불변식 검증 불가 — 개전일이 브리프에 없고 기사 안 출처("2월 말")는 기간이다. 2/28 이면 201, 2/21 이면 208
   WARN  advanced[4] blocks/0/paragraphs/0/body "201일째": DERIVED 출처 ['war_start'] 가 브리프 밖
PASS  fixtures/invalid/derived-from-volatile.json  — 거부 기대 DERIVED_FROM_VOLATILE
   검출: ['DERIVED_FROM_VOLATILE']
   DERIVED_FROM_VOLATILE: basic[6] blocks/1/paragraphs/1/body "3주 뒤에": 출처 ['minutes'] 가 STABLE 이 아니다 — D8 규칙 4: VOLATILE 로 강등해야 한다
   골든과 다른 곳 1군데: ['/levels/0/slides/6/_volatility/2/derived_from/0/volatility']
PASS  fixtures/invalid/volatile-missing-asof.json  — 거부 기대 VOLATILE_MISSING_AS_OF
   검출: ['VOLATILE_MISSING_AS_OF']
   VOLATILE_MISSING_AS_OF: basic[3] blocks/0/paragraphs/1/body "지금 미국은 3%대": VOLATILE 인데 as_of 가 없다 (D8)
   골든과 다른 곳 1군데: ['/levels/0/slides/3/_volatility/0/as_of']

OK
exit=0
```

`--report` 의 층 분포 · 대기 목록:
```
$ python3 scripts/verify-article.py --report   (일부: 층별 · 대기)
  층별 span 수: {'bridge': 2, 'claim': 30, 'concept': 21, 'fact': 64, 'writing': 6} (합 123)
  대기 [bridge Bridge] basic[3]/blocks/0/paragraphs/1/body/0 "그런데 지금 미국은 3%대입니다. "
  대기 [bridge Bridge] basic[3]/blocks/0/paragraphs/1/body/1 "목표보다 빠르게 오르고 있어요."
  대기 [claim  DerivedClaim] basic[3]/blocks/2/paragraphs/0/body/0 "그리고 이 속도는 여름 내내 크게 줄지 않았"
  대기 [claim  DerivedClaim] basic[6]/blocks/1/paragraphs/0/body/0 "그 사이 8월 말 의장이 앞의 기준을 밝혔고"
  대기 [fact   Fact 승격] basic[6]/blocks/1/paragraphs/1/body/1 "회의 내부 기록은 3주 뒤에 공개돼요."
  대기 [fact   Fact 출처] basic[7]/blocks/0/paragraphs/0/body/0 "2월 말에 시작돼 반년 넘게 이어지고 있어요"
  대기 [fact   Fact 출처] basic[7]/blocks/0/paragraphs/0/body/1 "4월에 휴전 합의가 한 번 있었지만 이후 공"
  대기 [claim  DerivedClaim] basic[7]/blocks/1/paragraphs/0/body/1 "<b>이 전쟁이 끝나면 물가는 저절로 내려갈"
  대기 [claim  DerivedClaim] basic[7]/blocks/1/paragraphs/0/body/2 "연준이 확신이 없다고 본 이유의 상당 부분이"
  대기 [fact   Fact 출처] advanced[2]/blocks/0/items/3/label/0 "9월 초"
  대기 [claim  DerivedClaim] advanced[4]/blocks/0/paragraphs/0/body/0 "<b>1. 물가의 큰 부분이 전쟁에 달려 있"
  대기 [fact   Fact 출처] advanced[4]/blocks/0/paragraphs/0/body/1 "이란 전쟁은 201일째. "
  대기 [fact   Fact 출처] advanced[4]/blocks/0/paragraphs/0/body/2 "4월 휴전 이후에도 공격이 반복되며 유가는 "
```

발행 검사(§9-10) — 골든은 발행물이 아니라서 `_` 때문에 거부돼야 한다:
```
$ python3 scripts/verify-article.py fixtures/fomc-2026-09.article.json --publish
FAIL  fixtures/fomc-2026-09.article.json
   ERROR UNDERSCORE_IN_PUBLISH: /_source: 발행물에 `_` 필드가 있다 (§9-10)
   ERROR UNDERSCORE_IN_PUBLISH: /_published_at_basis: 발행물에 `_` 필드가 있다 (§9-10)
   ... (UNDERSCORE_IN_PUBLISH 52건, 다른 code 없음)
exit=1 (정상)
```

`python3 scripts/compare-reader-text.py` — 허용된 차이 1건 말고는 불변:
```
$ python3 scripts/compare-reader-text.py
옛 골든 c46871d → 새 골든 fixtures/fomc-2026-09.article.json
  레벨 2 · 슬라이드 14 · 독자 글 단위 115개 · 3294자 대조
  허용된 차이 1/1건 (그 밖의 차이는 전부 실패):
    basic[7] blocks/1 p0: '연준이 “확신이 없다”고 말한' → '연준이 확신이 없다고 본'  (D23 · 0.1b PM 검수 #16 — 해석에 원문 표시(따옴표)를 단 것. 도윤 승인 2026-09-29)
  계약이 버리는 것 (대조 밖): end_actions 2개 · teaser 기호 · 눈금 · modifier · style

OK — 독자 글 불변
exit=0
```

`python3 scripts/selftest-verify-article.py` — 망가뜨린 사본이 기대대로 실패하는가 (허용된 차이 케이스 4건 추가):
```
$ python3 scripts/selftest-verify-article.py
== verify-article.py — 사본 72개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 골든은 통과해야 한다
        기대 — / 실제 —
  PASS  골든을 --publish 로 검사하면 `_` 때문에 거부 (§9-10 — 골든은 발행물이 아니다)
        기대 ['UNDERSCORE_IN_PUBLISH'] / 실제 ['UNDERSCORE_IN_PUBLISH']
  PASS  §9-1 levels 0개
        기대 ['LEVELS_COUNT'] / 실제 ['LEVELS_COUNT']
  PASS  §9-1 levels 4개
        기대 ['LEVELS_COUNT'] / 실제 ['LEVELS_COUNT']
  PASS  §9-1 레벨 id 옛 값 adv
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 레벨 id 겹침
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 레벨 순서 뒤바뀜 (advanced → basic)
        기대 ['LEVEL_ID'] / 실제 ['LEVEL_ID']
  PASS  §9-1 slides 비움
        기대 ['SLIDES_EMPTY'] / 실제 ['SLIDES_EMPTY']
  PASS  §9-1 blocks 비움
        기대 ['BLOCKS_EMPTY'] / 실제 ['BLOCKS_EMPTY']
  PASS  §9-2 open_question 하나 삭제 (길이 ≠ 장수 − 1)
        기대 ['OQ_LENGTH'] / 실제 ['OQ_LENGTH']
  PASS  §9-2 open_question 하나 추가
        기대 ['OQ_LENGTH'] / 실제 ['OQ_LENGTH']
  PASS  §9-2 open_question text 빈 문자열
        기대 ['OQ_EMPTY'] / 실제 ['OQ_EMPTY']
  PASS  §9-3 슬라이드에 resolves
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 open_question 에 goto_index
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 슬라이드에 index
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-3 `_` 주석 안의 goto (주석에도 없어야 한다)
        기대 ['POINTER_FIELD'] / 실제 ['POINTER_FIELD']
  PASS  §9-4 블록 text 삭제
        기대 ['BLOCK_NO_TEXT'] / 실제 ['BLOCK_NO_TEXT']
  PASS  §9-4 text 한 글자 바꿈 (구조는 그대로)
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 구조만 고침 (span 수치 3.7→3.8), text 는 그대로 — 화면 3.8 / 질문 3.7
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 강조를 구조에서만 뺌 (hit → emphasized 제거), text 는 그대로
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-4 목록 순서를 구조에서만 바꿈 (항목에 붙은 _volatility where 도 어긋나 VOL_SPAN 이 같이 나온다)
        기대 ['TEXT_MISMATCH', 'VOL_SPAN'] / 실제 ['TEXT_MISMATCH', 'VOL_SPAN']
  PASS  §9-4 ordered 뒤집음 (번호가 글자로 남아야 한다)
        기대 ['TEXT_MISMATCH'] / 실제 ['TEXT_MISMATCH']
  PASS  §9-5 type=gauge (옛 관측 타입)
        기대 ['BLOCK_TYPE'] / 실제 ['BLOCK_TYPE']
  PASS  §9-5 type=scale (두지 않기로 한 원형)
        기대 ['BLOCK_TYPE'] / 실제 ['BLOCK_TYPE']
  PASS  §9-6 layer 옛 이름 derived_claim
        기대 ['SPAN_LAYER'] / 실제 ['SPAN_LAYER']
  PASS  §9-6 writing 인데 refs
        기대 ['REFS_WRITING'] / 실제 ['REFS_WRITING']
  PASS  §9-6 fact 인데 refs 비었고 대기 표시도 없음
        기대 ['REFS_EMPTY'] / 실제 ['REFS_EMPTY']
  PASS  §9-6 대기 span 의 _refs_pending 만 지움 (조용히 두면 안 된다)
        기대 ['REFS_EMPTY'] / 실제 ['REFS_EMPTY']
  PASS  §9-6 claim span 에 Fact ID (층 섞임)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 fact span 에 DC ID (층 섞임)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 fact span 에 F·DC 혼합 (D20 — 섞으면 안 된다)
        기대 ['REF_WRONG_LAYER'] / 실제 ['REF_WRONG_LAYER']
  PASS  §9-6 없는 Fact ID
        기대 ['REF_UNKNOWN'] / 실제 ['REF_UNKNOWN']
  PASS  §9-6 없는 개념 ID
        기대 ['REF_UNKNOWN'] / 실제 ['REF_UNKNOWN']
  PASS  §9-6 refs 와 대기 표시가 동시에
        기대 ['PENDING_WITH_REFS'] / 실제 ['PENDING_WITH_REFS']
  PASS  §9-6 writing 에 대기 표시
        기대 ['PENDING_INVALID'] / 실제 ['PENDING_INVALID']
  PASS  §9-6 대기 표시 until 이 0.2 가 아님
        기대 ['PENDING_INVALID'] / 실제 ['PENDING_INVALID']
  PASS  §9-6 claim 의 need 가 Fact 출처 (D22 — claim 은 DerivedClaim)
        기대 ['PENDING_NEED_LAYER'] / 실제 ['PENDING_NEED_LAYER']
  PASS  §9-6 span 에 layer 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  §9-6 _fact_refs_dropped 에 없는 ID
        기대 ['DROPPED_UNKNOWN'] / 실제 ['DROPPED_UNKNOWN']
  PASS  §6 인용 글이 fact 가 아님
        기대 ['QUOTE_LAYER'] / 실제 ['QUOTE_LAYER']
  PASS  span text 빈 문자열 (그 span 에 붙은 _volatility 도 같이 걸린다)
        기대 ['SPAN_EMPTY', 'VOL_SPAN'] / 실제 ['SPAN_EMPTY', 'VOL_SPAN']
  PASS  §9-7 span 안에 <br>
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-7 span 안에 <i>
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-7 <b> 가 span 을 넘는다
        기대 ['BOLD_CROSSES_SPAN'] / 실제 ['BOLD_CROSSES_SPAN']
  PASS  §9-7 kicker 에 태그
        기대 ['INLINE_FORMAT'] / 실제 ['INLINE_FORMAT']
  PASS  §9-8 emphasized 항목을 <b> 로 통째 감쌈
        기대 ['EMPHASIZED_DOUBLE'] / 실제 ['EMPHASIZED_DOUBLE']
  PASS  §9-9 슬라이드에 as_of (읽는 시각 필드)
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  §9-9 블록에 formula
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  §9-9 패키지에 now
        기대 ['D8_FIELD'] / 실제 ['D8_FIELD']
  PASS  D8 published_at 이 날짜가 아님
        기대 ['D8_NO_PUBLISHED_AT'] / 실제 ['D8_NO_PUBLISHED_AT']
  PASS  D8 published_at 을 10/16 으로 (모든 DERIVED 를 다시 계산해야 한다)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D8 VOLATILE 의 as_of 삭제
        기대 ['VOLATILE_MISSING_AS_OF'] / 실제 ['VOLATILE_MISSING_AS_OF']
  PASS  D8 as_of 형식 오류
        기대 ['VOLATILE_BAD_AS_OF'] / 실제 ['VOLATILE_BAD_AS_OF']
  PASS  D8 DERIVED 출처를 VOLATILE 로
        기대 ['DERIVED_FROM_VOLATILE'] / 실제 ['DERIVED_FROM_VOLATILE']
  PASS  D8 value_at_authoring 을 틀리게 (3주 → 4주)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D8 기록된 invariant 가 재계산과 다름
        기대 ['DERIVED_INVARIANT_MISMATCH'] / 실제 ['DERIVED_INVARIANT_MISMATCH']
  PASS  D8 class 오류
        기대 ['VOL_CLASS'] / 실제 ['VOL_CLASS']
  PASS  D8 where 경로가 가리키는 글에 span 이 없다
        기대 ['VOL_SPAN'] / 실제 ['VOL_SPAN']
  PASS  D8 where 경로가 없다
        기대 ['VOL_SPAN'] / 실제 ['VOL_SPAN']
  PASS  D8 open_question 의 DERIVED 를 깸 (두 달 전 → 3)
        기대 ['DERIVED_INVARIANT_FAIL'] / 실제 ['DERIVED_INVARIANT_FAIL']
  PASS  D9 최상단에 _findings
        기대 ['D9_OBSERVED_KEY'] / 실제 ['D9_OBSERVED_KEY']
  PASS  스키마 옛 필드 Level.label 이 남음 (D22)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 필드 slide_count
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 teaser 가 슬라이드에 남음
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 옛 h1
        기대 ['SCHEMA_KEY', 'SCHEMA_MISSING'] / 실제 ['SCHEMA_KEY', 'SCHEMA_MISSING']
  PASS  스키마 event_hint 가 남고 event_ref 없음
        기대 ['SCHEMA_KEY', 'SCHEMA_MISSING'] / 실제 ['SCHEMA_KEY', 'SCHEMA_MISSING']
  PASS  스키마 옛 chrome 이 남음
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 title 에 브랜드
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 contrast 항목에 value · body 둘 다 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  스키마 prose weight 오류 (warn 은 판단 색이라 없다)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 sheet 행에 v_modifier (판단 색)
        기대 ['SCHEMA_KEY'] / 실제 ['SCHEMA_KEY']
  PASS  스키마 quote 에 attribution 없음
        기대 ['SCHEMA_MISSING'] / 실제 ['SCHEMA_MISSING']
  PASS  §9-10 발행 검사에서는 `_` 필드가 하나라도 있으면 실패
        기대 ['UNDERSCORE_IN_PUBLISH'] / 실제 ['UNDERSCORE_IN_PUBLISH']
  → 전부 기대대로

== compare-reader-text.py — 사본 23개 (+ 정상 골든 대조)
  PASS  망가뜨리지 않은 새 골든은 옛 골든과 글이 같다
        기대 115단위 3294자 / 실제 OK
  PASS  본문 한 글자 (금리를→금리은)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [replace] 옛 '를' → 새 '은'  (옛 24~25, 새 24~25)
  PASS  마침표 하나 삭제
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [delete] 옛 '.' → 새 ''  (옛 40~41, 새 40~40)
  PASS  공백 하나 추가 (독자 눈엔 안 보여도 글자다)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [insert] 옛 '' → 새 ' '  (옛 45~45, 새 45~46)
  PASS  <b> 위치 이동 (굵기도 글이다)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [delete] 옛 '<b>' → 새 ''  (옛 45~48, 새 45~45); [insert] 옛 ''
  PASS  <br> → 공백 (headline 줄바꿈 소실)
        기대 실패해야 함 / 실제 1건 — basic[0] headline: 글자가 다르다 — [replace] 옛 '\n' → 새 ' '  (옛 9~10, 새 9~10)
  PASS  kicker 변경
        기대 실패해야 함 / 실제 1건 — basic[2] kicker: 글자가 다르다 — [replace] 옛 '①' → 새 '②'  (옛 13~14, 새 13~14)
  PASS  open_question 한 글자
        기대 실패해야 함 / 실제 1건 — basic[0] open_question: 글자가 다르다 — [delete] 옛 '?' → 새 ''  (옛 13~14, 새 13~13)
  PASS  게이지 값 2% → 2.0%
        기대 실패해야 함 / 실제 1건 — basic[3] blocks/1 0.value: 글자가 다르다 — [insert] 옛 '' → 새 '.0'  (옛 1~1, 새 1~3)
  PASS  게이지 라벨 바꿈
        기대 실패해야 함 / 실제 1건 — basic[3] blocks/1 1.label: 글자가 다르다 — [replace] 옛 '지금' → 새 '현재'  (옛 0~2, 새 0~2)
  PASS  표 값 4.1% → 4.2%
        기대 실패해야 함 / 실제 1건 — advanced[3] blocks/0 0.value: 글자가 다르다 — [replace] 옛 '1' → 새 '2'  (옛 2~3, 새 2~3)
  PASS  인용 출처 표시 변경
        기대 실패해야 함 / 실제 1건 — basic[5] blocks/1 attribution: 글자가 다르다 — [replace] 옛 '연설' → 새 '발언'  (옛 10~12, 새 10~12)
  PASS  목록 라벨 변경
        기대 실패해야 함 / 실제 1건 — advanced[2] blocks/0 0.label: 글자가 다르다 — [replace] 옛 '9' → 새 '8'  (옛 3~4, 새 3~4)
  PASS  문단 순서 뒤바뀜
        기대 실패해야 함 / 실제 3건 — basic[0] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 ['normal', 'secondary'] / 새 ['secondary', 'normal
  PASS  슬라이드 하나 삭제
        기대 실패해야 함 / 실제 41건 — basic: 장수가 다르다 — 옛 9 / 새 8
  PASS  블록 하나 삭제
        기대 실패해야 함 / 실제 1건 — basic[1]: 블록 수가 다르다 — 옛 2 / 새 1
  PASS  문단 무게 secondary → normal (dim 소실)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 ['normal', 'secondary'] / 새 ['normal', 'normal']
  PASS  강조 제거 (hit 소실)
        기대 실패해야 함 / 실제 1건 — basic[6] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 [False, True] / 새 [False, False]
  PASS  목록 ordered 뒤집음
        기대 실패해야 함 / 실제 1건 — advanced[2] blocks/0: 모양(무게·강조·순서)이 다르다 — 옛 [True, True, True, True, True] / 새 [False, Fal
  PASS  허용된 차이 #16 을 되돌리면(옛 글 그대로) 통과 — 허용은 승인된 새 글만 강제하지 않는다
        기대 통과해야 함 / 실제 0건
  PASS  허용된 위치에서 승인된 것과 다르게 고침 (본 → 봤다)
        기대 실패해야 함 / 실제 1건 — basic[7] blocks/1 p0: 글자가 다르다 — [delete] 옛 '“' → 새 ''  (옛 86~87, 새 86~86); [delete] 옛 '”' 
  PASS  허용된 위치에서 승인된 수정 + 글자 하나 더
        기대 실패해야 함 / 실제 1건 — basic[7] blocks/1 p0: 글자가 다르다 — [delete] 옛 '“' → 새 ''  (옛 86~87, 새 86~86); [delete] 옛 '”' 
  PASS  승인된 수정을 다른 문장에 적용 (허용은 위치 한 곳만)
        기대 실패해야 함 / 실제 1건 — basic[0] blocks/0 p0: 글자가 다르다 — [insert] 옛 '' → 새 ' 확신이 없다고 본'  (옛 12~12, 새 12~22)
  PASS  span 을 쪼개도 이음이 같으면 통과 (경계는 새 데이터)
        기대 통과해야 함 / 실제 0건
  → 전부 기대대로

OK
exit=0
```

`python3 scripts/verify-contract-coverage.py`
```
$ python3 scripts/verify-contract-coverage.py
PASS  1. 관측 경로 137개가 부록 A(91행)에 있다
PASS  2. D8 · D11 · D12 · D13 · D14 · D15 · D16 · D17 · D20 · D22 언급
PASS  3. 원형 5개 = prose · quote · list · contrast · sheet (scale 없음), Block 유니언 일치, 근거 1건 표시
      [('prose', '둘 다'), ('quote', '둘 다'), ('list', '둘 다'), ('contrast', '둘 다'), ('sheet', '근거 1건')]
PASS  4. 원형마다 절이 있고 "정규 텍스트"가 정의돼 있다
PASS  5. §11 의 _open 5개가 전부 "판정됨 → D20", §11 밖에 남은 _open 없음
PASS  6. §12 에 "게이지 → contrast 두 항목. 글자는 그대로" + 버리는 눈금 [33, 62]
PASS  7. 0.2 소관 타입을 정의하지 않음
PASS  8. 0.1a 표 20행 전부 처리 표시 (계약 반영 / _open / 0.2 로 / 범위 밖)
PASS  9. D20 — 레벨 어휘 · 층 판정 규칙 · 0.2 대기 표시(§6 · §9) · 척도 미확인
PASS  10. D22 — Level.label 제거 · 이란 전망 문장 claim · 이란 규칙 범위

OK
exit=0
```

`python3 scripts/diff-observed-article.py` — 이번엔 입문 8장(0부터 7)도 바뀐 것으로 나온다. #16 수정이라 정상이다:
```

요약: 본문이 바뀐 슬라이드 [('basic', 2), ('basic', 3), ('basic', 4), ('basic', 7), ('advanced', 3)]
      - 단위 11개 / + 단위 18개 (슬라이드 삭제 0)
```

invalid 2건은 새 골든에서 다시 만들었다(골든 + 위반 1개, 위 verify 출력에서 각자 선언한 코드로만 거부).
