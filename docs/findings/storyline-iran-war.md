# 이란 전쟁 스토리라인 — 사실과 1차 출처

> C-3 (2026-10-09). 골든 FOMC 기사가 닿는 이란 전쟁 사실의 1차 출처 대조.
> 이 사실들은 FOMC 사건이 아니라 이란 전쟁 스토리라인(`SL-iran-war`) 소속이다 (2026-09-21 도윤 관찰 · DATA_MODEL §9.3).
> **파일을 나눈 것일 뿐 스토리라인 스키마 · 버전을 정한 것이 아니다.** 사실 ID 도 붙이지 않았다.
> 골든 · 브리프 · 계약은 고치지 않았다. 해석(claim)은 보지 않았다.
> 전체 [다름] · [못 찾음] 목록은 `logs/content/source-check-2026-10.md` 맨 앞.

## 먼저 — 이 스토리라인에서 조심할 것

**1차 출처가 전쟁 당사자다 (FINDINGS §5.2 — primary source ≠ neutral source).**
아래 문서는 전부 미국 정부(백악관 · 중부사령부)와 미국 통계기관(EIA)의 것이다. 이란 정부 · 이스라엘 정부 · 중재국 · 유엔의 1차 문서는 **확보하지 못했다.**
그래서 "휴전에 합의했다" · "이란이 휴전을 어겼다"는 사실이 아니라 **미국 정부가 그렇게 말했다는 사실**이다 (`OFFICIAL_CLAIM`).
날짜(언제 발표했나 · 언제 공격했다고 밝혔나)는 그 문서로 확인된다. 누가 먼저 어겼는지는 확인되지 않는다.

## [다름] · [못 찾음] — 이 파일 몫

| # | 골든 | 판정 | 내용 |
|---|---|---|---|
| I-1 | 입문 8장 "4월에 휴전 합의가 **한 번** 있었지만" | **[못 찾음]** ("한 번") | 4/8 휴전은 확인. 그 뒤로 합의가 더 없었다는 것은 1차로 확인하지 못했다. 6월 · 7월 CENTCOM 발표는 "the ceasefire" · "the agreement with Iran"이 그때까지 살아 있는 것으로 쓴다. 2차 자료에는 6월의 추가 합의문 이야기가 있다 — 1차를 못 찾아 적지 않는다 |
| I-2 | 입문 8장 · 숙련 5장 · F37 "회의 당일 경유 가격 사상 최고" | **[다름]** (날짜 정밀도) | EIA 는 주 1회 잰다. 9/14(월) 조사값이 당시 사상 최고(명목)였다. 9/16 당일 수치는 못 찾았다. 기록은 9/7 주에 이미 깨졌고 9/21 주에 다시 깨졌다 — 로그 D-7 |
| I-3 | F37 앞부분 "이란 전쟁으로 연료 가격이 급등" (인과) | **[못 찾음]** (그 말 그대로는) | 인과를 말한 1차는 있으나 "이란 전쟁"이라고 이름 붙이지 않는다. 연준 회의록은 "geopolitical developments", EIA 는 러시아 · 중국 · 중동의 정제 감소를 든다 (아래 4). DATA_MODEL §3.3 이 이 부분을 "누구의 주장인지 없음"으로 갈라 두었다 |
| I-4 | "휴전" · "공격이 반복" 의 **이란 쪽** 1차 | **[못 찾음]** | 위 "조심할 것" |

---

## 1차 문서

| 약칭 | 기관 · 제목 · 날짜 | URL | 열람 |
|---|---|---|---|
| WH-0408 | The White House · "Peace Through Strength: Operation Epic Fury Crushes Iranian Threat as Ceasefire Takes Hold" · 2026-04-08 | https://www.whitehouse.gov/releases/2026/04/peace-through-strength-operation-epic-fury-crushes-iranian-threat-as-ceasefire-takes-hold/ | 직접 |
| CC-FS | U.S. Central Command · "Operation Epic Fury Fact Sheet" · 2026-03-23 | https://www.centcom.mil/Portals/6/Documents/Publications/260323-Operation%20Epic%20Fury%20Fact%20Sheet.pdf | **직접 못 열었다** (403). 검색 결과에 뜬 조각만 봤다 |
| CC-0626 | U.S. Central Command · "U.S. Strikes Iran in Response to Attack on Commercial Vessel" · 2026-06-26 | https://www.centcom.mil/MEDIA/PUBLIC-RELEASES/Article/4528341/us-strikes-iran-in-response-to-attack-on-commercial-vessel/ | 직접 |
| CC-0707 | U.S. Central Command · "U.S. Forces Complete New Round of Retaliatory Strikes Against Iran" · 2026-07-07 | https://www.centcom.mil/MEDIA/PUBLIC-RELEASES/Article/4535772/us-forces-complete-new-round-of-retaliatory-strikes-against-iran/ | 직접 |
| CC-0901 | U.S. Central Command · "CENTCOM Completes Strikes on IRGC Targets in Iran" · 2026-09-01 | https://www.centcom.mil/MEDIA/PUBLIC-RELEASES/Article/4588389/centcom-completes-strikes-on-irgc-targets-in-iran/ | 직접 |
| EIA-B | U.S. Energy Information Administration · "Europe Brent Spot Price FOB" (일별) | https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D | 직접 |
| EIA-D | U.S. Energy Information Administration · "Weekly U.S. No 2 Diesel Retail Prices" | https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_NUS_DPG&f=W | 직접 |
| EIA-T | U.S. Energy Information Administration · Today in Energy (경유 가격) · 2026-09-18 | https://www.eia.gov/todayinenergy/detail.php?id=68164 | 직접 |
| MIN-09 | FOMC · "Minutes of the Federal Open Market Committee, September 15–16, 2026" · 공개 2026-10-07 | https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm | 직접 |
| MIN-07 | FOMC · "Minutes of the Federal Open Market Committee, July 28–29, 2026" · 공개 2026-08-19 | https://www.federalreserve.gov/monetarypolicy/fomcminutes20260729.htm | 직접 |

- EIA-T(9/18) · MIN-09(10/7)는 발행일(9/16) 뒤에 나왔다. 발행 시점 기사의 출처가 될 수 없다. EIA-D 의 9/14 조사값은 그 주에 공개됐다.
- 권리는 확인하지 않았다.

---

## 1. 개전일 — 2026년 2월 28일

골든: 입문 8장 "2월 말에 시작돼 반년 넘게 이어지고 있어요." · 숙련 5장 "이란 전쟁은 201일째." · DERIVED 입력 `war_start` ("2026-02")

| 1차 | 원문 구절 | 판정 |
|---|---|---|
| WH-0408 | Chairman of the Joint Chiefs of Staff General Dan Caine: "On February 28, the President of the United States ordered the Joint Force to execute Operation Epic Fury with the direction to accomplish three distinct military objectives" | **[일치]** — "2월 말" |
| WH-0408 | "in just 38 days, the greatest fighting force the world has ever known has met those objectives" (4/8 자) | 2/28 시작과 어긋나지 않는다 (참고) |
| CC-FS (조각만) | "commenced Operation Epic Fury against Iran at the direction of the President of the United States on Feb. 28, 2026 at 1:15am" | 직접 못 열어 **판정에 쓰지 않았다.** 파이프라인이 문서를 받으면 이 구절을 찾을 것 |

**DERIVED 대조**
- "201일째" — 2026-02-28 부터 2026-09-16 까지 첫날을 넣어 세면 **201**. 골든 값과 **[일치]**. `UNVERIFIABLE` 의 원인(개전일 없음)이 풀린다
- "반년 넘게" — 2/28 → 9/16 은 6개월 19일. **[일치]**
- WH-0408 의 구절은 **명령한 날**이다. 공격이 시작된 날 · 시각을 적은 것은 CC-FS 인데 직접 확인하지 못했다. 날짜가 하루 어긋날 여지는 CC-FS 를 열어야 닫힌다
- D27 메모 그대로: 발행일을 한국 시간 다음 날(9/17)로 잡으면 202 가 된다. 개전일 쪽도 시간대가 있다 (미 동부 2/28 새벽 = 테헤란 2/28 오전 — 같은 날)

## 2. 4월 휴전

골든: 입문 8장 "4월에 휴전 합의가 한 번 있었지만" · 숙련 5장 "4월 휴전 이후에도"

| 1차 | 원문 구절 | 판정 |
|---|---|---|
| WH-0408 (2026-04-08) | "Iran has now agreed to a ceasefire and reopening the Strait of Hormuz as the Trump Administration negotiates a broader peace agreement" | "4월에 휴전 합의" **[일치]** — 단 한쪽 당사자의 발표다 |
| — | — | "한 번" **[못 찾음]** (I-1) |

- 휴전의 기간 · 조건 · 중재국은 이 문서에 없다. 2차 자료에는 있으나 옮기지 않는다.

## 3. 이후 공격 반복

골든: 입문 8장 "이후 공격이 반복되면서" · 숙련 5장 "4월 휴전 이후에도 공격이 반복되며"

| 1차 | 원문 구절 | 판정 |
|---|---|---|
| CC-0626 | "U.S. Central Command (CENTCOM) forces conducted strikes against Iran, June 26, as a powerful response to yesterday's attack on a commercial ship that was transiting the Strait of Hormuz." · "The unwarranted aggression against commercial shipping by Iranian forces clearly violated the ceasefire." | **[일치]** |
| CC-0707 | "completed a new round of offensive strikes against Iran, July 7, hitting over 80 targets" · "Iran recently attacked three commercial vessels transiting the strait" · "a clear and dangerous violation of the ceasefire" | **[일치]** |
| CC-0901 | "successfully completed a wave of strikes against Iranian military targets Sept. 1." · "The strikes follow recent attempted attacks by the IRGC against commercial shipping in the Strait of Hormuz and against American service members." | **[일치]** — 발행일(9/16) 보름 전까지 이어졌다 |

- 4월 휴전 뒤 미국이 이란을 공격했다고 스스로 밝힌 날이 최소 셋(6/26 · 7/7 · 9/1)이다. "반복"은 미국 쪽 문서만으로 선다.
- "이란이 상선을 공격했다"는 CENTCOM 의 주장이다. 이란 쪽 문서는 없다 (I-4).
- 7월 중순 · 하순의 CENTCOM 발표가 여럿 더 있다(검색 결과 목록에서 제목만 확인). 열어 보지 않아 적지 않는다.
- FOMC 회의록도 같은 시기를 이렇게 적는다 — MIN-07: "Many participants noted that the recent re-escalation of the conflict in the Middle East significantly clouded the inflation outlook." · MIN-09: "an escalation of geopolitical tensions that pushed up energy prices"

## 4. 유가 등락 · 경유 가격

골든: 입문 8장 "기름값은 크게 올랐다 내렸다를 되풀이했습니다." · 숙련 5장 "유가는 크게 등락했고" · 입문 8장 · 숙련 5장 경유 최고치 (F37)

**원유 — EIA-B (Brent 현물, 달러/배럴)**

| 날짜 | 값 | |
|---|---|---|
| 2026-02-27 | 71.32 | 개전 직전 |
| 2026-03-02 | 77.24 | 개전 뒤 첫 거래일 |
| 2026-04-06 주의 첫 값 | 138.21 | 휴전 직전 고점. 그 주는 값이 넷뿐이라 4/6 인지 4/7 인지 표만으로는 가릴 수 없다 |
| 2026-04-17 | 98.63 | |
| 2026-04-30 | 124.24 | |
| 2026-07-02 | 68.53 | 저점 |
| 2026-07-23 | 105.32 | |
| 2026-08-26 | 87.77 | |
| 2026-09-15 | 130.80 | 회의 첫날 |
| 2026-09-16 | 127.84 | 회의 당일 |

→ 71 → 138 → 69 → 105 → 88 → 131. "크게 올랐다 내렸다를 되풀이" **[일치]**

**경유 — EIA-D (미국 소매 평균, 달러/갤런, 주간 · 월요일 조사)**

| 주 | 값 | |
|---|---|---|
| 2022-06-20 | 5.810 | 2026년 9월 전까지의 최고 (시리즈 시작 1994-03-21) |
| 2026-02-23 | 3.809 | 개전 직전 |
| 2026-04-06 | 5.643 | |
| 2026-07-06 | 4.578 | |
| 2026-08-31 | 5.599 | |
| 2026-09-07 | 5.967 | **종전 기록을 넘음** |
| 2026-09-14 | 6.285 | 회의 주 |
| 2026-09-21 | 6.529 | 다시 넘음 |
| 2026-10-05 | 6.199 | |

| 1차 | 원문 구절 | 판정 |
|---|---|---|
| EIA-T (2026-09-18) | "As of Monday, September 14, U.S. retail diesel prices averaged $6.29 per gallon (gal), according to our weekly Gasoline and Diesel Fuel Update. On an inflation-adjusted basis, this is the highest price since 2022, and the number is the highest on record in nominal price terms since EIA started publishing this series in 1994." | "사상 최고" **[일치]** (명목 기준) · "회의 당일" **[다름]** (I-2) |
| AAA "AAA Fuel Prices" (2026-10-08 조회) https://gasprices.aaa.com/ | "HIGHEST RECORDED AVERAGE PRICE … Diesel $6.5276 9/22/26" | 일별로 재는 곳의 최고 기록일은 9/22 다. 9/16 값은 페이지에 없다 **[못 찾음]** |

**인과 — "이란 전쟁으로 연료 가격이 급등" (F37 앞부분)**

| 1차 | 원문 구절 | 누구의 말인가 |
|---|---|---|
| MIN-09 | "They noted that ongoing geopolitical developments, which had pushed up prices for crude oil and refined fuel products, and surging AI-related investments were contributing to inflation pressures." | FOMC 참가자들 — `OFFICIAL_CLAIM`. "이란"이라고 하지 않는다 |
| MIN-07 | "higher energy and input costs stemming from the conflict in the Middle East" | 연준 직원 — `OFFICIAL_CLAIM`. "중동 분쟁" |
| EIA-T | "Global distillate fuel (including diesel) supplies are tight because of reduced global refining activity in Russia, China, and the Middle East." | EIA — 원인을 셋으로 든다. 이란 전쟁 하나가 아니다 |

→ 골든은 "이란 전쟁 **때문에** 올랐다"고 직접 쓰지 않고 순서로 놓았다("공격이 반복되면서 기름값은 …"). 사실 부분은 위로 선다. 인과의 무게는 C-5.

---

## 이 스토리라인에 아직 없는 것

- 이란 · 이스라엘 · 중재국 · 유엔의 1차 문서
- 개전 시각을 적은 문서(CC-FS)의 직접 확인
- 4/8 휴전의 조건과 그 뒤 합의 이력 ("한 번"인지)
- 9/16 당일 경유 일별 가격
- 발행일 이후의 전개 — 9/16 뒤로도 유가 · 경유값은 움직였다(Brent 10/2 135.51, 경유 9/21 6.529). FINDINGS §9.2 대로라면 이것은 원 기사를 고치지 않고 스토리라인에 붙는 사실이다. 여기서는 적어만 둔다
