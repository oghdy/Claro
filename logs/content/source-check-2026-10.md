# logs/content · C-3 — 골든 FOMC 기사 사실 출처 대조

## C-3 [GATE] · 2026-10-09 · 보조 세션 · 판정 대기(도윤)

대상: `fixtures/fomc-2026-09.article.json` (입문 9장 · 숙련 5장)이 닿는 사실, `docs/findings/fomc-2026-09-brief.md` 사실 표 F01~F38.
읽은 것: CLAUDE.md · FINDINGS §5 · §9.2 · DECISIONS D8 · D22 · D23 · D27 · DATA_MODEL §3 · §4 · §5 · §9 · §10 · §17 · 브리프 · 골든 · `verify-data-model.py --report` 출력.
**골든 · 브리프 · 계약은 한 글자도 고치지 않았다.** 해석(claim)은 검토하지 않았다 — 해석 문장 안에 든 사실 부분만 대조했다.
이란 전쟁 사실은 `docs/findings/storyline-iran-war.md` 에 따로 적었다.

방법: 1차 문서를 직접 열어 글을 읽었다(연준 · BLS · BEA · 재무부 · EIA · CME · AAA). 검색 요약을 구절로 옮기지 않았다.
직접 열지 못한 문서는 그렇게 적었다. 구절은 원문 그대로다. 글자 위치는 적지 않았다.

---

## 맨 앞 — [다름] · [못 찾음]

### [다름] — 독자 글에 닿는 것 (도윤 판정 필요)

| # | 어디 | 골든의 글 | 원문이 말하는 것 | 무엇이 다른가 |
|---|---|---|---|---|
| D-1 | 숙련 5장 · F30 · DC-E | "7월 취업자는 오히려 23,000명 줄었습니다." | BLS 8/7 첫 발표 -23,000. **9/4 발표에서 +21,000 으로 수정.** 10/2 발표에서 다시 -10,000 | 8/7 수치로는 일치. 그러나 **발행일(9/16) 기준 최신 공식 수치는 "늘었다"(+21,000)** 였다. 골든은 as_of 2026-08-07 을 달았지만 글은 현재 사실처럼 읽힌다. DC-E("고용은 겉보기만큼 단단하지 않다")가 이 숫자에 기대고 있다. 또 BLS 는 8/7 발표에서 이 수치를 "changed little"(변화가 거의 없다)이라고 썼다 — "줄었다"고 쓰지 않았다 |
| D-2 | 숙련 3장 타임라인 | "9월 초 — 시장, 인상 확률 90% 이상 반영." | CME: 8/31 "35% → 66%". 회의 전 주(CPI 발표 전) "~58%" | **9월 초에 90% 가 아니었다.** CME 자료로는 9월 둘째 주에도 약 58% 였다. 90% 라는 숫자는 9/16 기자회견에서 기자가 한 말에만 있다 (M-1) |
| D-3 | 숙련 3장 타임라인 | "9월 초 — … 10년물 4.6% 돌파" | 재무부 일별 금리: 10년물이 4.6% 를 처음 넘은 날은 5/18. 7/20 이후로는 한 번도 4.6% 아래로 내려가지 않았다. 9월 초는 4.77~4.80%, 9/15 는 5.00% | **4.6% 돌파는 9월 초의 일이 아니다.** 9월에 새로 넘은 선은 4.9%(9/10) · 5.0%(9/15)다. 브리프 F35 "회의 직전 4.6% 이상"은 참이지만 크게 낮춰 말한 것이다 |
| D-4 | 숙련 4장 · F13 | "2027년에 추가 인상을 찍은 참가자는 8명뿐" | 점도표: 2027년 말 4.375% 에 8명. 그런데 **2026년 말에 이미 4명이 4.375%** 다 | 원문이 말하는 것은 "2027년 말 금리를 4.375% 로 본 참가자가 8명"이다. 점도표는 개인을 잇지 않는다. 그 8명 중 최대 4명은 2026년에 이미 그 자리에 있을 수 있어서, "2027년에 추가로 올린다고 본 사람"은 4~8명 사이다. "4명은 인하"(3.625% 3명 + 3.125% 1명)는 일치 |
| D-5 | 숙련 5장 · DC-E | "의장은 이를 노동공급 감소로 설명했고" | 잭슨홀: "When labor supply is **barely growing**, monthly job gains are naturally going to run low." | 원문은 "거의 늘지 않는다"다. "감소"가 아니다. 브리프 DC-E 도 "노동공급 감소"라고 적었다 |
| D-6 | 입문 2장 | "여름 동안 나온 물가 지표는 **시장이 걱정하던 것보다** 좋았습니다." | 잭슨홀: "this summer's PCE and CPI readings were **better than expected**" | 원문은 "예상보다"다. 누구의 예상인지, 걱정이었는지는 원문에 없다. 숙련 2장 "예상보다 나았습니다"는 일치 |
| D-7 | 입문 8장 · 숙련 5장 · F37 | "회의가 열린 날에는 … 경유 가격이 사상 최고치를 기록했어요." / "회의 당일 경유 가격은 사상 최고였습니다." | EIA 주간 조사: 9/14(월) $6.285 — 1994년 시작된 시리즈의 최고치(명목). 단 **9/7 주에 이미 종전 기록(2022-06-20 $5.810)을 넘었고**, 9/21 주에 $6.529 로 다시 넘었다 | 9/16 당일 기준 가장 최근 공식 수치가 사상 최고였다는 것까지는 일치. **"회의 당일에 기록했다"는 못 맞춘다** — EIA 는 주 1회(월요일) 잰다. 일별 수치를 재는 AAA 의 9/16 값은 못 찾았다 (AAA 가 지금 보여주는 최고 기록은 9/22 $6.5276). "명목 기준"이라는 단서도 원문에 있다 (물가를 반영하면 2022년 이후 최고) |
| D-8 | 입문 4장 · 숙련 2장 · F31 `as_of` | `as_of: "2026-08-30"` (브리프 "T-17") | BEA 공개: 2026-08-26 (수) 08:30 EDT | **수치(3.3%)는 일치. 날짜가 다르다** — 8/26 = T-21. 8/30 은 일요일이다. 독자 글이 아니라 골든 주석이지만 `as_of` 는 발행 검사가 쓰는 값이다 |

### [다름] — 브리프에만 있고 골든에 닿지 않는 것

| # | 브리프 | 원문 | 무엇이 다른가 |
|---|---|---|---|
| D-9 | F35 "연초 대비 1%p 이상 상승" | 재무부: 1/2 4.19% → 9/15 5.00% | 0.81%p 다. 1%p 에 못 미친다 |
| D-10 | F35 "7월 회의 대비 약 40bp" | 7/29 4.67% → 9/15 5.00% = 33bp (7/28 4.61% 기준이면 39bp). 9월 회의록: "increased around 35 basis points" | 기준일에 따라 33~39bp. 연준 자신은 "약 35bp" |
| D-11 | F34 "연설 직후 2년물 4.22% → 4.30%" | 재무부 종가: 8/27 4.20% → 8/28 4.34% | 종가로는 +14bp. 4.22 → 4.30 은 장중 값일 수 있으나 그 출처를 못 찾았다 |
| D-12 | Source Pack S3 "기자회견 전문 (**preliminary**)" | 같은 주소의 문서가 지금은 "**FINAL**" 이다 | DATA_MODEL §4.1 이 예고한 그대로다 — 같은 주소, 다른 글. 아래 구절은 전부 FINAL 에서 뽑았다. preliminary 는 지금 그 주소에 없다 |

### [못 찾음]

| # | 무엇 | 찾은 곳 · 못 찾은 이유 |
|---|---|---|
| M-1 | F36 "시장은 인상 확률을 90% 이상 반영" (T-1) | 측정한 주체(CME FedWatch)의 9/15 수치를 못 찾았다. CME 가 공개 글로 남긴 것은 8/31 "66%" · 회의 전 주 "~58%" 뿐이다. 9월 회의록은 숫자 없이 "investors placed **high odds**" 라고만 쓴다. "90 percent"는 9/16 기자회견에서 기자(Fox Business)가 한 말이다 — 2차다. **"90% 이상"의 "이상"은 그 말에도 없다** |
| M-2 | F32 뒷부분 "이전보다 명확한 인상 가능성 신호를 보냄" | 연설에 그런 구절이 없다. 연설은 반대로 "I stand here today committed to a discipline, **not to a decision**." 이라고 한다. DATA_MODEL §3.3 이 이미 "읽은 쪽의 해석"이라고 갈랐다 — 사실로 둘 수 없다 |
| M-3 | F37 9/16 **당일** 경유 가격 | D-7 참조. AAA 일별 과거 값은 공개 페이지에 없다 |
| M-4 | "회의 내부 기록은 3주 뒤에 공개돼요" — **발행 시점에** 공개 예정일을 알린 문서 | 회의록이 10/7 에 나온 것은 확인했다(일치). 그러나 9/16 에 "10/7 에 나온다"를 알린 연준 문서는 못 찾았다. 지금 달력 페이지의 "Released October 07, 2026"은 나온 뒤에 붙은 표시다 |

### 일치하지만 도윤이 알아야 할 것 (판정 아님 · 메모)

- **인용 블록 번역에 원문에 없는 낱말 하나** — "**아직** 할 일이 남아 있는 것이다". 원문은 "Otherwise, we have work to do." 다. "아직"은 옮긴이가 넣었다. 또 원문 주어 "We"가 빠졌다. 뜻은 같다고 봤다 → [일치]. 게이트 3 에서 볼 것 (A)
- **입문 9장 "연준 자신도 물가가 2% 근처로 돌아오는 건 내년 말쯤"** — 수치(2027년 2.3%)는 일치(D23 #19 가 반올림으로 판정). 다만 같은 표에서 2.0% 가 되는 해는 **2029년**이고, 기자회견에서 기자가 바로 이것을 물었다("the median pushes the 2 percent target achievement out to 2029"). 또 이 전망은 참가자 18명의 것이고 의장은 내지 않았다 — "연준 자신"
- **입문 8장 헤드라인 "이란 전쟁이 어디로 갈지 모릅니다" (refs F07 · F37)** — 9월 성명문은 이란도 중동도 말하지 않는다. "geopolitical developments"다. 7월 성명문은 "the conflict in the Middle East"였다. 숙련 5장 "성명문도 지정학적 전개로 인한 불확실성을 명시했어요"는 일치
- **숙련 2장 "6월 전망치와 사실상 같았고요"** — 두 숫자(7월 실적 3.3% · 6월 SEP 3.3%)는 각각 일치. 단 앞은 12개월 변화율, 뒤는 4분기 대 4분기 전망이다. 견줄 수 있는지는 C-5
- **7월 근원 PCE 를 연준 직원은 다르게 적었다** — 9월 회의록: 근원 PCE 가 8월에 "**remained at 3.4 percent**". BEA 7월 수치는 3.3% 다. 어느 쪽이 맞는지 가리지 않았다. 9/30 BEA 방법 개편도 있다(회의록: 새 방법으로 8월 3.2%)
- **F03 날짜** — 연준 표는 발효일(2023-07-27)로 적는다. 결정은 7/26. "2023년 7월"은 어느 쪽이든 맞다
- **F30 은 발표 뒤 두 번 바뀌었다** — VOLATILE 사실이 실제로 움직인 첫 실물이다 (FINDINGS §5.4)

---

## 1차 문서 목록

| 약칭 | 기관 · 제목 · 날짜 | URL |
|---|---|---|
| ST-09 | Federal Reserve Board · "Federal Reserve issues FOMC statement" · 2026-09-16 14:00 EDT | https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm |
| ST-07 | Federal Reserve Board · "Federal Reserve issues FOMC statement" · 2026-07-29 14:00 EDT | https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm |
| ST-06 | Federal Reserve Board · "Federal Reserve issues FOMC statement" · 2026-06-17 14:00 EDT | https://www.federalreserve.gov/newsevents/pressreleases/monetary20260617a.htm |
| SEP-09 | Federal Reserve Board · "September 16, 2026: FOMC Projections materials, accessible version" · 2026-09-16 | https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260916.htm |
| SEP-03 | Federal Reserve Board · "March 18, 2026: FOMC Projections materials, accessible version" · 2026-03-18 | https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260318.htm |
| PC-09 | Federal Reserve Board · "Transcript of Chairman Warsh's Press Conference, September 16, 2026" (FINAL, 15쪽) | https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20260916.pdf |
| JH | Federal Reserve Board · Chairman Kevin Warsh, "In Our Time" · 잭슨홀 경제정책 심포지엄 · 2026-08-28 | https://www.federalreserve.gov/newsevents/speech/warsh20260828a.htm |
| MIN-09 | FOMC · "Minutes of the Federal Open Market Committee, September 15–16, 2026" · 공개 2026-10-07 | https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm |
| MIN-07 | FOMC · "Minutes of the Federal Open Market Committee, July 28–29, 2026" · 공개 2026-08-19 | https://www.federalreserve.gov/monetarypolicy/fomcminutes20260729.htm |
| OMO | Federal Reserve Board · "Open Market Operations" — 목표금리 변경 이력 표 | https://www.federalreserve.gov/monetarypolicy/openmarket.htm |
| CAL | Federal Reserve Board · "Meeting calendars and information" | https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm |
| BLS-07 | U.S. Bureau of Labor Statistics · "The Employment Situation — July 2026" (USDL-26-1291) · 2026-08-07 08:30 ET | https://www.bls.gov/news.release/archives/empsit_08072026.htm |
| BLS-08 | U.S. Bureau of Labor Statistics · "The Employment Situation — August 2026" · 2026-09-04 | https://www.bls.gov/news.release/archives/empsit_09042026.htm |
| BLS-09 | U.S. Bureau of Labor Statistics · "The Employment Situation — September 2026" · 2026-10-02 | https://www.bls.gov/news.release/archives/empsit_10022026.htm |
| BEA-07 | U.S. Bureau of Economic Analysis · "Personal Income and Outlays, July 2026" (BEA 26–39) · 2026-08-26 08:30 EDT | https://www.bea.gov/news/2026/personal-income-and-outlays-july-2026 |
| TSY | U.S. Department of the Treasury · "Daily Treasury Par Yield Curve Rates" 2026 | https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2026 |
| EIA-D | U.S. Energy Information Administration · "Weekly U.S. No 2 Diesel Retail Prices" | https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_NUS_DPG&f=W |
| EIA-T | U.S. Energy Information Administration · Today in Energy (경유 가격) · 2026-09-18 | https://www.eia.gov/todayinenergy/detail.php?id=68164 |
| CME-1 | CME Group · "Tech Earnings Wrap and Shifting Fed Rate Hike Probabilities" · 2026-08-31 | https://www.cmegroup.com/videos/2026/09/01/tech-earnings-wrap-and-shifting-fed-rate-hike-probabilities.html |
| CME-2 | CME Group · "September 2026 Rates Recap" (페이지 표시는 "September 1, 2026, unless otherwise specified". 해당 문단은 "next week's meeting" · "Thursday (PPI) and Friday (CPI)"라고 써서 9/7 주에 쓴 글로 읽힌다 — 정확한 작성일은 페이지에 없다) | https://www.cmegroup.com/newsletters/rates-recap/2026-09-rates-recap.html |
| AAA | AAA · "AAA Fuel Prices" (2026-10-08 조회) | https://gasprices.aaa.com/ |

- 9월 회의록(MIN-09)은 발행일(9/16) 뒤에 나왔다. 발행 시점 기사의 출처가 될 수 없다(불변식 11). 여기서는 대조에만 썼다.
- 권리(`can_quote` · `can_store`)는 확인하지 않았다. CME · AAA 는 민간이다.

---

## A. 인용 블록 2개 — 잭슨홀 연설

출처: **JH** — "The Economy Today" 절의 끝, "Conclusion" 바로 앞 문단.

원문 (영어, 그대로):
> Here is my standard: We must be confident that underlying inflation is moving to our objective, clearly and at sufficient speed. Otherwise, we have work to do. That's our job . . . our mandate . . . and our charge to keep.

| 블록 | 골든 body (번역) | 원문 문장 | 판정 |
|---|---|---|---|
| 입문 6장 · 1문 / 숙련 2장 | 기저 물가가 목표를 향해 분명하게, 충분히 빠른 속도로 가고 있다는 확신이 있어야 한다. | We must be confident that underlying inflation is moving to our objective, clearly and at sufficient speed. | **[일치]** — 번역. 주어 "We" 생략 |
| 입문 6장 · 2문 | 그렇지 않다면 아직 할 일이 남아 있는 것이다. | Otherwise, we have work to do. | **[일치]** — 번역. **"아직"은 원문에 없다** |

- 두 문장은 원문에서 붙어 있다. 사이에 뺀 것이 없다. 입문 블록이 두 문장을 이은 것은 원문 그대로다.
- 인용은 번역이다. 원문은 영어다(DATA_MODEL §10.2).
- `attribution` 대조: "8월 말 · 의장 연설" · "8/28 잭슨홀" — 날짜 2026-08-28 · 화자 Chairman Kevin Warsh · 자리 Jackson Hole, Wyoming. **[일치]**
- 같은 문장을 의장이 9/16 기자회견 모두발언에서 되풀이했다(PC-09 2쪽): "I defined the standard for action. We must be confident that underlying inflation is moving to our objective, clearly and at sufficient speed." — 인용 블록의 출처는 JH 다. 이것은 참고.
- 불변식 19(공통 Source 하나): F33 의 두 문장이 JH 한 문서의 한 문단에 있다. 채울 수 있다.

---

## B. 1차 출처가 없던 사실 9개

| F | 브리프 | 1차 | 원문 구절 | 판정 |
|---|---|---|---|---|
| F03 | 2023년 7월 이후 첫 인상 ("다수 보도") | OMO | 변경 이력 표 — 2026: "September 17 \| 25 \| 0 \| 3.75-4.00" · 2025: "December 11 \| 0 \| 25 \| 3.50-3.75", "October 30 \| 0 \| 25", "September 18 \| 0 \| 25" · 2024: "December 19 \| 0 \| 25", "November 8 \| 0 \| 25", "September 19 \| 0 \| 50" · 2023: "July 27 \| 25 \| 0 \| 5.25-5.50" (열: Date \| Increase \| Decrease \| Level) | **[일치]** — 2023-07-27 과 2026-09-17 사이에 Increase 행이 없다. 표의 날짜는 발효일 |
| F28 | 7/29 9대3 동결. Hammack · Kashkari · Logan 이 25bp 인상을 원해 반대 | ST-07 | "approved the following statement for release by a 9 – 3 vote" · "decided to maintain the target range for the federal funds rate at 3-1/2 to 3-3/4 percent" · "Voting against the monetary policy action were Beth M. Hammack, Neel Kashkari, and Lorie K. Logan, who preferred to raise the target range for the federal funds rate by 1/4 percentage point at this meeting." | **[일치]** |
| F30 | 8/7 발표 7월 고용: 취업자 -23,000 · 실업률 4.1% · 일시해고 +153,000 | BLS-07 | "Both nonfarm payroll employment (-23,000) and the unemployment rate (4.1 percent) changed little in July" · "the number of people on temporary layoff increased by 153,000 to 921,000 in July" | 8/7 수치 **[일치]**. 그 뒤 **[다름] D-1** |
| | (수정) | BLS-08 | "the change for July was revised up by 44,000, from -23,000 to +21,000" | |
| | (재수정) | BLS-09 | "The change in total nonfarm payroll employment for July was revised down by 31,000, from +21,000 to -10,000" | |
| F31 | 7월 근원 PCE 전년 대비 3.3% (T-17) | BEA-07 | "From the same month one year ago, the PCE price index for July increased 3.7 percent. Excluding food and energy, the PCE price index increased 3.3 percent from one year ago." | 수치 **[일치]** · 날짜 **[다름] D-8** |
| F32 | 잭슨홀: 여름 지표가 나아졌지만 기저 추세 개선을 뜻하진 않는다 / 이전보다 명확한 인상 신호 | JH | "And while this summer's PCE and CPI readings were better than expected, they do not tell me that underlying trends have meaningfully improved." | 앞부분 **[일치]** · 뒷부분 **[못 찾음] M-2** |
| F33 | 기준: 기저 물가가 명확하고 충분히 빠르게 간다는 확신이 없으면 할 일이 남았다 | JH | "Here is my standard: We must be confident that underlying inflation is moving to our objective, clearly and at sufficient speed. Otherwise, we have work to do." | **[일치]** |
| F35 | 회의 직전 10년물 4.6% 이상 · 7월 대비 약 40bp · 연초 대비 1%p 이상 | TSY | 10 Yr 열 — 01/02 4.19 · 07/28 4.61 · 07/29 4.67 · 09/01 4.79 · 09/08 4.80 · 09/10 4.95 · 09/14 4.97 · 09/15 5.00 · 09/16 5.01 | "4.6% 이상" 참 · 나머지 **[다름] D-3 · D-9 · D-10** |
| F36 | 시장은 인상 확률 90% 이상 반영 (T-1) | — | CME-1: "Expectations for a Fed rate hike have surged, jumping from 35% to as high as 66% following Fed Chair Kevin Warsh's remarks at the Jackson Hole Economic Policy Symposium, according to the CME FedWatch tool." · CME-2: "Markets are currently pricing a ~58% probability of a 25bp hike at next week's meeting" · MIN-09: "investors placed high odds on a 25 basis point increase in the target range for the federal funds rate at the September meeting" · PC-09 5쪽 (기자 Edward Lawrence): "So the market priced in a 90 percent chance of a rate hike today." | **[못 찾음] M-1** · "9월 초"는 **[다름] D-2** |
| F37 | 이란 전쟁으로 연료 가격 급등 · 회의 당일 경유 최고치 | EIA-T · EIA-D | → `docs/findings/storyline-iran-war.md` (소유 SL-iran-war) | **[다름] D-7** |

---

## C. 대기 사실 — FOMC 쪽 2개 (이란 4개는 storyline-iran-war.md)

| 골든 | 1차 | 원문 구절 | 판정 |
|---|---|---|---|
| 숙련 3장 "9월 초" (타임라인 라벨) | TSY · CME-1 · CME-2 | B 의 F35 · F36 줄 | **[다름] D-2 · D-3.** 이 라벨에 맞는 날짜가 원문에 없다. 인상 확률이 90% 가 된 날은 못 찾았고(늦어도 9/16, 빨라도 CPI 발표 9/11 이후), 10년물 4.6% 는 5월의 일이다 |
| 입문 7장 "회의 내부 기록은 3주 뒤에 공개돼요" · 숙련 3장 "3주 뒤 회의록" | CAL | 9월 회의 줄 — "Minutes: PDF \| HTML (Released October 07, 2026)" | **[일치]** — 9/16 + 21일 = 10/7. 단 발행 시점의 예고 문서는 **[못 찾음] M-4** |

---

## D. DERIVED 값의 입력 사실

| 키 | 골든 값 | 1차 | 원문 구절 | 판정 | 쓰는 조각 |
|---|---|---|---|---|---|
| `hike_prev` | 2023-07 | OMO | "July 27 \| 25 \| 0 \| 5.25-5.50" (2023) | **[일치]** | "3년 만에" · "3년 넘게" — 2023-07 → 2026-09-16 은 3년 1개월여 |
| `july_meeting` | 2026-07-29 | ST-07 | "July 29, 2026 … For release at 2:00 p.m. EDT" | **[일치]** | "두 달 사이" · "두 달 전" · "7주 만에" — 49일. PC-09 6쪽 "in the seven weeks since we last met" |
| `sept_meeting` | 2026-09-16 | ST-09 | "September 16, 2026 … For release at 2:00 p.m. EDT" | **[일치]** | 같음 |
| `minutes` | 2026-10-07 | CAL | "Released October 07, 2026" | **[일치]** (M-4 단서) | "3주 뒤" ×2 |
| `war_start` | 2026-02 | → storyline-iran-war.md | 2026-02-28 | **[일치]** — 날짜까지 확인 | "반년 넘게" · **"201일째"** — 2/28 부터 9/16 까지 첫날을 넣어 세면 201. `UNVERIFIABLE` 을 풀 수 있다 |
| `target_year` (F11 · F12 · F16 · F19) | 2026 · 2027 | SEP-09 | 표 1 의 열 "2026 \| 2027 \| 2028 \| 2029 \| Longer run" | **[일치]** | "올해" · "내년" · "연내" |

---

## E. 골든이 닿는 나머지 사실

### 성명문 (ST-09)

원문 전문 (짧다. 그대로):
> The Federal Open Market Committee approved the following statement for release by a 12 – 0 vote:
> The Committee decided to raise the target range for the federal funds rate by 1/4 percentage point to 3-3/4 to 4 percent, in support of the Federal Reserve's dual mandate. The Committee is continuing its policy of maintaining ample reserves in the banking system.
> Economic activity is expanding at a solid pace. While uncertainty remains elevated owing, in part, to geopolitical developments, domestic spending has been resilient. Productivity growth is strong, and capital investment is robust. Job gains have kept pace with the workforce, and the unemployment rate has changed little.
> Inflation remains elevated. Today's policy action will support a timelier return to the Committee's 2 percent goal. The Committee will deliver price stability.

| F | 브리프 | 구절 | 판정 |
|---|---|---|---|
| F01 | 25bp 올려 3.75~4.00% | "raise the target range for the federal funds rate by 1/4 percentage point to 3-3/4 to 4 percent" | **[일치]** |
| F02 | 12대0 만장일치 | "by a 12 – 0 vote" | **[일치]** — MIN-09 에 12명 이름, "Voting against this action: None." |
| F04 | 더 시의적절한 복귀를 뒷받침 | "Today's policy action will support a timelier return to the Committee's 2 percent goal." | **[일치]** (골든 미사용) |
| F05 | 충분한 지급준비금 유지 계속 | "The Committee is continuing its policy of maintaining ample reserves in the banking system." | **[일치]** (골든 미사용) |
| F06 | 경제활동 견조한 확장 | "Economic activity is expanding at a solid pace." | **[일치]** (골든 미사용) |
| F07 | 지정학적 전개 등으로 불확실성은 높지만 국내 지출 견조 | "While uncertainty remains elevated owing, in part, to geopolitical developments, domestic spending has been resilient." | **[일치]** — 이란을 이름으로 말하지 않는다 (메모) |
| F08 | 생산성 강하고 자본투자 견조 | "Productivity growth is strong, and capital investment is robust." | **[일치]** (골든 미사용) |
| F09 | 고용 증가가 노동력 증가와 보조 · 실업률 거의 불변 | "Job gains have kept pace with the workforce, and the unemployment rate has changed little." | **[일치]** — 원문은 "the workforce"(노동력)다. "노동력 **증가**"는 브리프가 보탠 말 |
| F10 | 인플레이션 여전히 높음 | "Inflation remains elevated." | **[일치]** |

### SEP (SEP-09 · SEP-03)

표 1 중앙값 (September 2026 줄 / June projection 줄):

| 변수 | 2026 | 2027 | 2028 | 2029 | Longer run | 6월: 2026 | 2027 | 2028 |
|---|---|---|---|---|---|---|---|---|
| Change in real GDP | 2.3 | 2.4 | 2.2 | 2.1 | 2.0 | 2.2 | 2.3 | 2.2 |
| Unemployment rate | 4.1 | 4.1 | 4.1 | 4.1 | 4.2 | 4.3 | 4.3 | 4.2 |
| PCE inflation | 3.7 | 2.3 | 2.1 | 2.0 | 2.0 | 3.6 | 2.3 | 2.0 |
| Core PCE inflation | 3.4 | 2.5 | 2.2 | 2.0 | | 3.3 | 2.5 | 2.1 |
| Federal funds rate | 4.1 | 4.1 | 3.9 | 3.6 | 3.2 | 3.8 | 3.6 | 3.4 |

그림 2 (점도표) — 금리 수준별 참가자 수:

| Midpoint | 2026 | 2027 | 2028 | 2029 | Longer run |
|---|---|---|---|---|---|
| 4.375 | 4 | 8 | | | |
| 4.125 | 12 | 6 | 4 | | |
| 3.875 | 2 | | 5 | 3 | 2 |
| 3.750 | | | | | 1 |
| 3.625 | | 3 | 3 | 7 | 2 |
| 3.500 | | | | | 2 |
| 3.375 | | | 1 | 2 | 1 |
| 3.250 | | | | | 2 |
| 3.125 | | 1 | 4 | 4 | 1 |
| 3.000 | | | | | 6 |
| 2.875 | | | | 1 | 1 |

(인상 뒤 목표범위 3.75~4.00% 의 중간값은 3.875%)

| F | 브리프 | 구절 · 값 | 판정 |
|---|---|---|---|
| F11 | 2026년 말 4.1% · 2027년도 4.1% | Federal funds rate 4.1 \| 4.1 | **[일치]** — PC-09 3쪽 "to be 4.1 percent at the end of this year and to remain there next year" |
| F12 | 18명 중 16명 연내 추가 인상 · 4명은 두 번 · 2명은 끝 | 2026 열: 4.375 에 4 · 4.125 에 12 · 3.875 에 2 | **[일치]** — 16 = 4 + 12 |
| F13 | 2027년 추가 인상 dot 8개뿐 · 4명은 인하 | 2027 열: 4.375 에 8 · 4.125 에 6 · 3.625 에 3 · 3.125 에 1 | 숫자 **[일치]** · 골든의 말 **[다름] D-4** |
| F14 | 2028년 인하 1회 · 2029년 최소 1회 | 4.1 → 3.9 → 3.6 | **[일치]** (골든 미사용) |
| F15 | 2026 PCE 3.7% (3월 2.7%) | 9월 3.7 · SEP-03 표 1 PCE inflation 2026: 2.7 | **[일치]** — 6월은 3.6 이었다 |
| F16 | 2026 근원 PCE 3.4% (6월 3.3%) | 9월 3.4 · June projection 3.3 | **[일치]** |
| F17 | 2026 실업률 4.1% (3월 4.4%) | 9월 4.1 · SEP-03 표 1 Unemployment rate 2026: 4.4 | **[일치]** — 6월은 4.3 이었다 |
| F18 | 실질 GDP 올해 2.3% · 내년 2.4% | 2.3 \| 2.4 | **[일치]** (골든 미사용) |
| F19 | 2027년 말 PCE 2.3% | PCE inflation 2027: 2.3 | **[일치]** (메모 참조 — 2.0 은 2029) |
| F20 | 의장은 이번에도 전망 미제출 | PC-09 3쪽: "It reflects the views of my colleagues on the Committee, but, as in June, I have not offered a projection of my own." · SEP-09 표 1 주: "Eighteen participants submitted information in conjunction with the September 15–16, 2026, meeting" | **[일치]** — "18명"도 여기서 나온다 |

### 기자회견 (PC-09, FINAL)

| F | 브리프 | 구절 (쪽) | 판정 |
|---|---|---|---|
| F21 | 만장일치가 결의를 보여준다 | "The Committee's unanimous vote shows our resolve to achieve price stability on a timelier basis." (3쪽) | **[일치]** (골든 미사용) |
| F22 | 목표를 웃돈 기간 "5년 반 이상" | "Stable prices have been the problem for now more than five and a half years." (11쪽) · 모두발언은 "for more than five years" (2쪽) · JH 는 "65 months" | **[일치]** (골든 미사용) |
| F23 | 개별 가격은 못 움직이나 번지는 것은 막겠다 | "We cannot affect any individual price … But what we can do, and will do, is ensure that any change in relative prices don't broaden out, don't have second- and third-order effects in the economy." (4쪽) | **[일치]** (골든 미사용) |
| F24 | 여름 지표가 기저 추세의 의미 있는 개선을 보여주지 않는다 | "This summer's inflation readings do not tell me that underlying trends have meaningfully improved." (2쪽) | **[일치]** — 숙련 2장 "의장은 … 평가했습니다" |
| F25 | 실업수당 청구가 완전고용 수준 · 고용 임무 양호 | "Unemployment claims, on a four-week moving average, are running at levels consistent with full employment. So the labor side of the Fed's congressional remit is in good shape." (2쪽) | **[일치]** (골든 미사용) |
| F26 | 7월 결정을 "시간을 벌기로 한 것"으로 설명 | "a good majority of my colleagues seven weeks ago thought seven weeks is a good investment. It's a way to buy time so we could make a wise decision." (6쪽) · "My commitment in July was to say, we want to buy a little bit of time." (13쪽) | **[일치]** (골든 미사용) |
| F27 | 장기 금리 상승 이유 셋 · 첫째 경제 강세 · 복합적 | "I'll give you three, three reasons, but I would say these things tend to be overdetermined. … First is economic strength." (12쪽) | **[일치]** (골든 미사용) |

### 그 밖 — 골든 글이 직접 말하는 사실

| 골든 | 1차 | 구절 | 판정 |
|---|---|---|---|
| 숙련 5장 "실업률은 4.2%에서 4.1%로 내려갔죠" | BLS-07 Summary table A | Unemployment rate — "June 2026 4.2 · July 2026 4.1 · Change -0.1" | **[일치]** — MIN-07: "The unemployment rate was 4.2 percent in June" |
| 숙련 5장 "성명문은 고용 증가가 노동력 증가와 보조를 맞췄다고 썼습니다" | ST-09 | "Job gains have kept pace with the workforce" | **[일치]** (F09 메모) |
| 숙련 4장 "표결은 투표권자 12명이 하고" | MIN-09 | "Voting for this action: Kevin Warsh, John C. Williams, Michael S. Barr, Michelle W. Bowman, Lisa D. Cook, Beth M. Hammack, Philip N. Jefferson, Neel Kashkari, Lorie K. Logan, Anna Paulson, Jerome H. Powell, and Christopher J. Waller." | **[일치]** — 12명. 단 MIN-09 는 발행 뒤 문서다. 발행 시점 출처는 ST-09 "12 – 0" |
| 숙련 3장 "Hammack · Kashkari · Logan 반대" | ST-07 | F28 줄 | **[일치]** |
| 입문 1장 "3년 넘게 연준은 금리를 그대로 두거나 내리기만 했어요" | OMO | F03 줄 — 2024 · 2025 는 Decrease 만 | **[일치]** |
| 입문 4장 "지금 미국은 3%대입니다" | BEA-07 | 근원 3.3 · 전체 3.7 | **[일치]** — 어느 쪽으로 읽어도 3%대. JH: "the 12-month change in the PCE price index, stands at 3.7 percent" |
| 브리프 F29 "6/17 12대0 동결" (골든 미사용) | ST-06 | "by a 12 – 0 vote" · "maintain the target range for the federal funds rate at 3-1/2 to 3-3/4 percent" | **[일치]**. "9/8/1"은 대조하지 않았다 — 골든이 닿지 않는다 |
| 브리프 F38 "다음 회의 10/27~28" (골든 미사용) | CAL | "October 27-28" | **[일치]** |

---

## 집계

| 묶음 | 일치 | 다름 | 못 찾음 |
|---|---|---|---|
| A 인용 블록 2 | 2 (번역 메모 1) | 0 | 0 |
| B 1차 없던 사실 9 | F03 · F28 · F33 | F30 · F31(날짜) · F35 · F37 | F32(뒷부분) · F36 |
| C 대기 사실 (FOMC 2) | "3주 뒤" | "9월 초" | — |
| D DERIVED 입력 6 | 6 | 0 | 0 |
| E 나머지 | 전부 | F13 의 말(D-4) · DC-E 안 사실(D-5) · 입문 2장(D-6) | — |

## 하지 않은 것
- 해석(claim) 검토 — C-5. D-1 · D-4 · D-5 · D-6 은 해석 문장 안의 **사실 부분**이 원문과 다르다는 것만 적었다. 해석이 서는지는 보지 않았다
- 원문 저장 · 글자 위치 — 파이프라인
- 권리 확인(`source_registry`)
- 브리프 F29 의 "9/8/1" · Unslotted Notable 세 건 — 골든이 닿지 않는다
- 6월 SEP 페이지는 9월 SEP 의 "June projection" 줄로 대신 읽었다. 6월 문서 자체의 표는 대조하지 않았다

## 검증 — 골든 · 브리프 · 계약을 건드리지 않았다
커밋 직전:
```
$ git status --short
 M docs/development-content.md
?? .claude/
?? docs/findings/storyline-iran-war.md
?? logs/content/source-check-2026-10.md

$ git diff --stat -- fixtures docs/contract docs/findings/fomc-2026-09-brief.md
(출력 없음)

$ python3 scripts/verify-data-model.py --report | tail -1
OK
```
`.claude/` 는 이 작업과 무관하다. 커밋에 넣지 않았다.
발행 검사에서 막히는 64건은 그대로다 — 이 Step 은 출처를 **찾아 적었을** 뿐 Fact · Source 를 만들지 않았다. 채우는 것은 0.2m · 파이프라인.

---

## C-3b [GATE] · 2026-10-09 · 보조 세션 · 판정 대기(PM)

대상: C-5 가 "없음"으로 적은 사실 3건 (`golden-correction-2026-10.md` §5) — DC-C 물음 4 · DC-E 물음 5 · DC-A 물음 2. D29.
읽은 것: CLAUDE.md · FINDINGS §5 · §7.2 · DECISIONS D27 · D28 · D29 · 이 파일의 C-3 · golden-correction §2 (DC-C · DC-A · DC-E) · §4 · §5.
**수치와 원문 문장만 적는다. 판정하지 않았다** — "나빠졌다 / 아니다"는 C-5 의 일이다. 위 C-3 의 내용은 고치지 않았다.
방법은 C-3 과 같다: 1차 문서를 직접 열어 글을 읽었다. 구절은 원문 그대로다.

### 맨 앞

- **1 · 8월 CPI — 찾음.** 수치와 요약 문장은 아래 표. 같은 기간(8/28 ~ 9/16)의 BLS 물가 지표 2건(8월 PPI · 8월 수입물가)도 찾았다
- **2 · 8월 고용 — 찾음.** 취업자 +162,000 · 실업률 4.1%
- **3 · 9월 성명문의 "Voting for …" 문단 — [못 찾음]. 그런 문단이 성명문에 없다.** HTML · PDF 둘 다 열었다. 9월 성명문은 "by a 12 – 0 vote"까지만 쓰고 이름을 하나도 적지 않는다. 7월 성명문도 찬성자 이름은 없고 반대자 문단만 있다. 발행일 전에 공개된 문서에서 찾은 것은 **셋이 2026년 위원이라는 것**(1월 회의록)과 "12 – 0"(ST-09)이다 — 이 둘을 이으면 무엇이 되는지는 적지 않았다

### 1차 문서 목록 (추가분)

| 약칭 | 기관 · 제목 · 날짜 | URL |
|---|---|---|
| CPI-08 | U.S. Bureau of Labor Statistics · "Consumer Price Index – August 2026" (USDL-26-1496) · 2026-09-11 08:30 ET | https://www.bls.gov/news.release/archives/cpi_09112026.htm |
| CPI-07 | U.S. Bureau of Labor Statistics · "Consumer Price Index – July 2026" (USDL-26-1378) · 2026-08-12 08:30 ET | https://www.bls.gov/news.release/archives/cpi_08122026.htm |
| CPI-06 | U.S. Bureau of Labor Statistics · "Consumer Price Index – June 2026" (USDL-26-1191) · 2026-07-14 08:30 ET | https://www.bls.gov/news.release/archives/cpi_07142026.htm |
| PPI-08 | U.S. Bureau of Labor Statistics · "Producer Price Indexes – August 2026" (USDL 26-1495) · 2026-09-10 08:30 ET | https://www.bls.gov/news.release/archives/ppi_09102026.htm |
| MXP-08 | U.S. Bureau of Labor Statistics · "U.S. Import and Export Price Indexes – August 2026" (USDL-26-1514) · 2026-09-16 08:30 ET | https://www.bls.gov/news.release/archives/ximpim_09162026.htm |
| BLS-08 | (C-3 목록과 같은 문서. USDL-26-1435 · 2026-09-04 08:30 ET) | https://www.bls.gov/news.release/archives/empsit_09042026.htm |
| ST-09-PDF | Federal Reserve Board · FOMC statement 2026-09-16 의 PDF 판 (2쪽 — 성명문 + Implementation Note) | https://www.federalreserve.gov/monetarypolicy/files/monetary20260916a1.pdf |
| IMPL-09 | Federal Reserve Board · "Implementation Note issued September 16, 2026" | https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a1.htm |
| MIN-01 | FOMC · "Minutes of the Federal Open Market Committee, January 27–28, 2026" · 공개 2026-02-18 (CAL: "Released February 18, 2026") | https://www.federalreserve.gov/monetarypolicy/fomcminutes20260128.htm |
| FOMC-ABOUT | Federal Reserve Board · "Federal Open Market Committee — About the FOMC" · 페이지 표시 "Last Update: October 07, 2026" | https://www.federalreserve.gov/monetarypolicy/fomc.htm |

전부 직접 열었다 (2026-10-09). ST-09 · ST-07 · CAL 도 다시 열었다.

---

### 1. 8월 CPI — DC-C 물음 4

**CPI-08 요약 (원문 그대로, 첫 네 문단):**
> The Consumer Price Index for All Urban Consumers (CPI-U) increased 0.4 percent on a seasonally adjusted basis in August after rising 0.1 percent in July, the U.S. Bureau of Labor Statistics reported today. Over the last 12 months, the all items index increased 3.4 percent before seasonal adjustment.
>
> The index for gasoline rose 3.9 percent in August, accounting for over one third of the monthly all items increase. The index for energy increased 2.1 percent over the month. The shelter index rose 0.3 percent in August after rising 0.1 percent in July. The index for food increased 0.1 percent over the month, as the index for food away from home increased 0.3 percent.
>
> The index for all items less food and energy rose 0.3 percent after increasing 0.2 percent in July. Indexes that increased over the month include communication, lodging away from home, airline fares, education, and used cars and trucks. Conversely, the index for medical care and the index for motor vehicle insurance were among the major indexes that decreased in August.
>
> The all items index rose 3.4 percent for the 12 months ending August as it did for the 12 months ending July. The all items less food and energy index rose 2.4 percent over the year, following a 2.5-percent increase over the 12 months ending July. The energy index increased 16.3 percent for the 12 months ending August. The food index increased 2.7 percent over the last year.

**6월 · 7월 · 8월 — 각 달의 발표문이 그 달에 대해 쓴 수치:**

| | 발표 | 전체 전월 대비 (계절조정) | 전체 전년 대비 (조정 전) | 근원 전월 대비 | 근원 전년 대비 | 에너지 전월 대비 | 에너지 전년 대비 |
|---|---|---|---|---|---|---|---|
| 6월 | CPI-06 · 7/14 | -0.4 | 3.5 | 0.0 | 2.6 | -5.7 | 15.7 |
| 7월 | CPI-07 · 8/12 | 0.1 | 3.4 | 0.2 | 2.5 | -1.5 | 14.7 |
| 8월 | CPI-08 · 9/11 | 0.4 | 3.4 | 0.3 | 2.4 | 2.1 | 16.3 |

("근원" = BLS 의 "all items less food and energy". BLS 는 "core"라는 말을 쓰지 않는다)

원문 구절:
- CPI-06: "The Consumer Price Index for All Urban Consumers (CPI-U) decreased 0.4 percent on a seasonally adjusted basis in June after rising 0.5 percent in May … This decline in the all items index was the largest 1-month decrease since April 2020 when it fell 0.8 percent. Over the last 12 months, the all items index increased 3.5 percent before seasonal adjustment." · "The index for energy fell 5.7 percent in June after rising 3.9 percent in May, 3.8 percent in April, and 10.9 percent in March." · "The index for all items less food and energy was unchanged in June." · "The all items index rose 3.5 percent for the 12 months ending June after rising 4.2 percent for the 12 months ending May. The all items less food and energy index rose 2.6 percent over the year, following a 2.9-percent increase over the 12 months ending May."
- CPI-07: "The Consumer Price Index for All Urban Consumers (CPI-U) increased 0.1 percent on a seasonally adjusted basis in July after falling 0.4 percent in June … Over the last 12 months, the all items index increased 3.4 percent before seasonal adjustment." · "The index for all items less food and energy rose 0.2 percent after being unchanged in June." · "The all items index rose 3.4 percent for the 12 months ending July after rising 3.5 percent for the 12 months ending June. The all items less food and energy index rose 2.5 percent over the year, following a 2.6-percent increase over the 12 months ending June. The energy index increased 14.7 percent for the 12 months ending July."
- CPI-08 Table A, "All items" 줄 (계절조정 전월 대비, 2월 → 8월 · 끝은 조정 전 12개월): "0.3 · 0.9 · 0.6 · 0.5 · -0.4 · 0.1 · 0.4 · 3.4". "All items less food and energy" 줄: "0.2 · 0.2 · 0.4 · 0.2 · 0.0 · 0.2 · 0.3 · 2.4". 6월 · 7월 값은 CPI-06 · CPI-07 이 쓴 값과 같다 (세 발표문 사이에 수정 없음)
- CPI-08 의 그 밖: "Gasoline (all types)" 8월 3.9 · 12개월 27.4 / "Shelter" 8월 0.3 · 12개월 3.0 (7월 발표 때 3.2 · 6월 발표 때 3.3) / "Services less energy services" 8월 0.3 · 12개월 3.0

**같은 기간(8/28 ~ 9/16)에 나온 다른 공식 물가 지표:**

| 문서 | 발표 | 원문 구절 |
|---|---|---|
| PPI-08 | 9/10 | "The Producer Price Index for final demand moved up 0.4 percent in August, seasonally adjusted … Final demand prices rose 0.1 percent in July and decreased 0.1 percent in June. … On an unadjusted basis, the index for final demand increased 5.4 percent for the 12 months ended in August." · "The index for final demand less foods, energy, and trade services rose 0.3 percent in August after moving up 0.4 percent in July. For the 12 months ended in August, prices for final demand less foods, energy, and trade services advanced 4.7 percent." · "Over three-fourths of the broad-based rise can be attributed to prices for final demand energy, which moved up 4.2 percent." · "Over a third of the August increase in the index for final demand goods can be traced to prices for diesel fuel, which jumped 24.1 percent." · Table A 의 12개월 변화(조정 전) — 5월 5.9 · 6월 5.6 · 7월 4.8 · 8월 5.4 |
| MXP-08 | **9/16 08:30 ET** (성명문 5시간 반 전) | "U.S. import prices increased 0.7 percent in August … following a 0.3-percent decrease in July. Higher prices for nonfuel imports more than offset lower prices for fuel imports in August." · "Prices for U.S. imports advanced 7.0 percent from August 2025 to August 2026, the largest over-the-year increase since the index rose 7.7 percent for the 12-month period ended August 2022." · "Fuel prices edged down 0.1 percent in August following a decrease of 6.6 percent in July and a decline of 3.7 percent in June." · "Nonfuel import prices rose 5.5 percent from August 2025 to August 2026, the largest over-the-year increase since the index advanced 5.9 percent for the 12-month period ended May 2022." |

- 8월 PCE(BEA)는 열지 않았다. C-3 의 BEA-07 이 8/26 발표였고 MIN-09 는 8월 PCE 를 9/30 개편과 함께 말한다 — 이 기간 밖으로 보이지만 **BEA 일정을 직접 확인하지는 않았다**
- 민간 지표 · 기대인플레이션 조사(미시간대 · 뉴욕 연은) · 연은별 지표는 찾지 않았다 — "공식 물가 지표"를 BLS · BEA 의 가격 지수로 읽었다
- 8월 CPI 에 대한 **예상치**는 BLS 문서에 없다. 찾지 않았다 (golden-correction §5 의 다른 줄이다)

---

### 2. 8월 고용 — DC-E 물음 5

**BLS-08 요약 (원문 그대로, 첫 문단):**
> Total nonfarm payroll employment increased by 162,000 in August, and the unemployment rate was unchanged at 4.1 percent, the U.S. Bureau of Labor Statistics reported today. Employment increased in food services and drinking places and in local government education. The information industry lost jobs.

| 항목 | 값 | 원문 구절 |
|---|---|---|
| 8월 취업자 수 변화 | +162,000 | "Total nonfarm payroll employment rose by 162,000 in August, higher than the average monthly gain of 31,000 over the prior 12 months." |
| 8월 실업률 | 4.1% (7월 4.1%) | "The unemployment rate was unchanged at 4.1 percent in August, and the number of unemployed people changed little at 7.0 million. Both measures changed little over the year." · Summary table A: Unemployment rate — "June 2026 4.2 · July 2026 4.1 · Aug. 2026 4.1 · Change 0.0" |
| 6월 · 7월 수정 | 6월 +20,000 → +31,000 · 7월 -23,000 → +21,000 | "The change in total nonfarm payroll employment for June was revised up by 11,000, from +20,000 to +31,000, and the change for July was revised up by 44,000, from -23,000 to +21,000. With these revisions, employment in June and July combined is 55,000 higher than previously reported." (뒷부분은 C-3 이 이미 옮겼다) |
| 3개월 평균 | 71 (천 명) | Summary table B, "3-month average change, in thousands" — Total nonfarm: "June 2026 81 · July 2026(p) 38 · Aug. 2026(p) 71" |
| 경제활동참가율 | 61.6% | "The labor force participation rate edged up to 61.6 percent in August but is down by 0.5 percentage point since January." · Summary table A: Civilian labor force — July 169,094 · Aug. 169,777 · Change 683 (천 명) |
| 업종 | | "Employment in food services and drinking places increased by 59,000 in August" · "Local government education added 42,000 jobs in August, largely offsetting a decrease in the prior month." · "Information employment declined by 23,000 in August" |
| 경제적 이유의 시간제 | -414,000 | "The number of people employed part time for economic reasons decreased by 414,000 to 4.4 million in August." |
| 시간당 임금 | +0.3% · 전년 대비 3.1% | "average hourly earnings for all employees on private nonfarm payrolls rose by 10 cents, or 0.3 percent, to $37.75. Over the year, average hourly earnings have increased by 3.1 percent." |

- BLS 가 발표문 FAQ 에 적은 것: "An over-the-month employment change of about 122,000 is statistically significant in the establishment survey"
- 8월 수치가 **10/2 발표(BLS-09)에서 수정됐는지는 보지 않았다.** C-3 은 BLS-09 에서 7월 재수정(-10,000)만 옮겼다. 발행일(9/16) 기준 최신 공식 수치는 위의 +162,000 이다
- 8월의 일시해고(temporary layoff) 수치는 발표문 본문에 없다 (7월 발표문에는 있었다 — F30)

---

### 3. 9월 성명문의 투표자 명단 — DC-A 물음 2

**[못 찾음] — 9월 성명문에 "Voting for …" 문단이 없다.**

| 문서 | 직접 열었나 | 무엇이 있고 없는가 |
|---|---|---|
| ST-09 (HTML) | 열었다 | 표결에 대한 말은 첫 문장 하나뿐이다: "The Federal Open Market Committee approved the following statement for release by a 12 – 0 vote:" — **위원 이름이 하나도 없다.** "Voting for" · "Voting against" 문단 없음. 전문은 위 C-3 의 E 절에 있는 그대로다 (다시 대조했다 — 같다) |
| ST-09-PDF | 열었다 | 같은 글. 1쪽 끝은 "-0-" · "Attachment" · 연락처. 이름 없음 |
| IMPL-09 | 열었다 | "The Board of Governors of the Federal Reserve System voted unanimously to raise the interest rate paid on reserve balances to 3.90 percent" · "the Federal Open Market Committee voted to direct the Open Market Desk …" — 이사회 표결이 만장일치라는 것까지. 이름 없음 |
| ST-07 | 열었다 | 7월 성명문도 **찬성자 이름은 적지 않는다.** "by a 9 – 3 vote" 와 반대자 문단뿐이다: "Voting against the monetary policy action were Beth M. Hammack, Neel Kashkari, and Lorie K. Logan, who preferred to raise the target range for the federal funds rate by 1/4 percentage point at this meeting." — 이 형식의 성명문은 반대가 있을 때만 이름을 적는 것으로 보인다 (두 건만 봤다) |

**발행일(9/16) 전에 공개된 문서에서 찾은, 셋의 2026년 투표권에 닿는 구절:**

| 문서 · 공개일 | 원문 구절 |
|---|---|
| MIN-01 · 2026-02-18 | "Annual Organizational Matters — The agenda for this meeting reported that advices of the election of the following members and alternate members of the Federal Open Market Committee for a term beginning January 27, 2026, were received and that these individuals executed their oaths of office. The elected members and alternate members were as follows: John C. Williams, President of the Federal Reserve Bank of New York, with Sushmita Shukla, First Vice President of the Federal Reserve Bank of New York, as alternate; Anna Paulson, President of the Federal Reserve Bank of Philadelphia, with Thomas I. Barkin, President of the Federal Reserve Bank of Richmond, as alternate; **Beth M. Hammack**, President of the Federal Reserve Bank of Cleveland, with Austan D. Goolsbee, President of the Federal Reserve Bank of Chicago, as alternate; **Lorie K. Logan**, President of the Federal Reserve Bank of Dallas, with Raphael W. Bostic, President of the Federal Reserve Bank of Atlanta, as alternate; **Neel Kashkari**, President of the Federal Reserve Bank of Minneapolis, with Mary C. Daly, President of the Federal Reserve Bank of San Francisco, as alternate." (굵은 글씨는 옮긴이) |
| ST-07 · 2026-07-29 | 위 반대자 문단 — 셋이 7월에 표를 냈다 |
| ST-09 · 2026-09-16 | "by a 12 – 0 vote" |
| FOMC-ABOUT · **공개 시점 증명 안 됨** | "The Federal Open Market Committee (FOMC) consists of twelve members--the seven members of the Board of Governors of the Federal Reserve System; the president of the Federal Reserve Bank of New York; and four of the remaining eleven Reserve Bank presidents, who serve one-year terms on a rotating basis." · "Committee membership changes at the first regularly scheduled meeting of the year." · "2026 Committee Members" 목록 12명 — "Kevin Warsh, Board of Governors, Chairman / John C. Williams, New York, Vice Chair / Michael S. Barr … / Michelle W. Bowman … / Lisa D. Cook … / Beth M. Hammack, Cleveland / Philip N. Jefferson … / Neel Kashkari, Minneapolis / Lorie K. Logan, Dallas / Anna Paulson, Philadelphia / Jerome H. Powell … / Christopher J. Waller …". 지금 페이지의 표시는 "Last Update: October 07, 2026" 이다 — **9/16 에 이 글이 이 모양이었는지는 확인하지 못했다** (C-3 의 M-4 와 같은 문제 · 파이프라인 "공개 시점 증명") |

- **"셋이 9월에 찬성표를 냈다"를 이름으로 적은 문서는 여전히 MIN-09(10/7) 하나다.** 발행일 기준으로 있는 것은 위 네 줄이다. 이것으로 DC-A 물음 2 가 풀리는지는 판정하지 않았다 — D29 판정 6 의 계약 물음과 같은 자리다
- 9/15 ~ 16 회의에 셋이 **참석**했다는 발행 시점 문서는 찾지 못했다 (참석자 명단은 회의록에만 있다). 기자회견 녹취(PC-09)의 표결 언급은 C-3 F21 의 "The Committee's unanimous vote shows our resolve …" (3쪽)이다 — 이름 없음. PC-09 는 다시 열지 않았다
- MIN-01 의 2026년 위원 명단은 1월 기준이다. 그 뒤 이사 쪽은 바뀌었다 (MIN-01 표결 명단의 Stephen I. Miran 이 9월 명단에 없고 Kevin Warsh 가 있다). 지역 연은 총재 넷은 1월 · 7월 · FOMC-ABOUT 에서 같다

---

### 하지 않은 것
- 판정 — 수치가 "나빠졌다 / 아니다", DC-C · DC-E · DC-A 의 `outcome`. C-5
- 8월 PCE · 예상치 · 민간 지표 · 8월 고용의 10/2 수정 여부 — 3건 밖
- 골든 · 브리프 · 계약 · golden-correction 로그 · 이 파일의 C-3 부분 수정
- 원문 저장 · 글자 위치 · 권리 확인 (C-3 과 같다)

### 검증 — 앞의 내용 · 골든 · 브리프 · 계약을 건드리지 않았다
커밋 직전:
```
$ git status --short
 M docs/development-content.md
 M logs/content/source-check-2026-10.md
?? .claude/

$ git diff --stat
 docs/development-content.md          |   2 +-
 logs/content/source-check-2026-10.md | 128 +++++++++++++++++++++++++++++++++++
 2 files changed, 129 insertions(+), 1 deletion(-)

$ git diff --stat -- fixtures docs/contract docs/findings logs/content/golden-correction-2026-10.md
(출력 없음)

$ git diff logs/content/source-check-2026-10.md | grep -c '^-[^-]'     # 이 파일에서 지워진 줄
0

$ python3 scripts/verify-data-model.py --report | tail -1
OK
```
(위 128 줄은 이 검증 절을 붙이기 전의 수다.) `.claude/` 는 이 작업과 무관하다. 커밋에 넣지 않았다.
