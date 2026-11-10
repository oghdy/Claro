# development · pipeline

파이프라인 A (FINDINGS §3.1 · §7) — 사건마다 기사 한 판을 만드는 반자동 도구. 서버가 아니라 사람이 돌린다 (D1).
**작업은 PM 이 서브에이전트에게 지시하고, 서브에이전트가 로그를 쓰고, PM 이 확인한 뒤 도윤에게 보고한다** (D39).

## 현재 위치
**2026-11-11 · P-5 까지 끝. 10월 회의록(11/18 무렵)을 기다린다 (D45 · 도윤).** 회의록이 나오면 수집 → P-3b → P-4 → P-5 를 다시 돌리고 P-6 (요점 · 게이트 2 — 도윤).
정치는 D46 (공식 발언만 · 동기 해석 안 함 · 필요할 때만 · 양쪽). **그동안 잔일 W-1 ~ W-5 (D47)** — 아래 "잔일 Step". **도는 중: W-4 (Opus)** · W-3 · W-2 · W-1 닫힘 (D48 · D49 · D50). 회의록 날 명령: `pnpm --filter @claro/pipeline rerun FOMC-20261028 --doc MIN-10` (마른 실행) → `--go` (logs/pipeline/W-1.md ①).
사건 폴더: `packages/pipeline/data/events/FOMC-20261028/` (p3 · p4 · p5 · bls) · 스토리라인 `packages/pipeline/data/storylines/SL-iran-war/v2.json`
명령: `pnpm --filter @claro/pipeline p1 | p2 <code> | p3 | p4 | p5` (각각 `--check` 로 다시 돌려 같은지). 검사: `scripts/verify-source-pack · verify-fact-graph · verify-coverage · verify-claims .py`
비용 장부 23.43 달러 · **목표 기사 한 편 ≤ 3 달러 (D51)** (P-1 ~ P-5 16.70 + W-2 6.73 · W-3 0 · 크레딧 약 103 달러에서 · 콘솔 월 한도 권장 30 달러). 키: `packages/pipeline/.env.pipeline` (git 무시)
서브에이전트 모델은 PM 이 고른다 (D47): 기준 · 설계 = Fable · 분명한 일 = Opus.

## 원칙 (FINDINGS 확정에서)
- **완전 자동화는 불가능하다. 초안을 만들고 게이트에 사람이 선다** (§10.1). 각 스테이지의 기준은 "모든 오류를 막는가"가 아니라 **"편집 시간을 줄이는가"**
- **제일 지루하고 제일 안 틀리는 것부터** (§10.4): 소스 수집 · 저장 · 해시 · span → Coverage 슬롯 → Deep Fact Graph 초안 → Derived Claim · 반증 후보 → Goal 후보 → 집필. **집필이 마지막이다**
- 각 단계는 정해진 JSON 만 받고 JSON 만 낸다. 실패하면 그 단계만 다시. LLM 이 이전 결과를 임의로 고치지 못한다 (§3.2)
- **구절이 원문에 있다 ≠ 그 구절에서 이 글이 나온다 (D42).** 표 · 시계열은 코드가 읽는다 · 수량어는 대응표대로 · 사실 추출은 Opus
- **API 비용 (D51)**: 기사 한 편 ≤ 3 달러 목표 · 급하지 않은 부르기는 배치 · 실험은 결정에 필요한 만큼 (지시마다 재기 상한) · 결과를 바꾸는 절감은 잰 뒤
- **검사는 겹으로 (D49)**: ① 코드 (수 · 날짜 · 수량어 · 표의 칸) ② 의미 대조 (주체 · 범위 · 인과 · 조건 · 시점 — Opus medium) ③ 값 대조 (같은 수를 다른 1차와) ④ 사람 (게이트 3). 한 겹이 다른 겹을 대신하지 않는다
- 1차 출처 필수 (D27). 원문 대조는 필수 (§5.5) — FOMC 골든에서 손으로 한 번 돌리자 틀린 사실 8건이 나왔다 (D28)
- 출력은 계약 모양이다 (`docs/contract/*`). 지금까지 만든 검사(`scripts/*.py` · `packages/*` 테스트)가 파이프라인의 결과에도 그대로 돈다
- **자동 수집의 예절 (D40 · D41)**: 정직한 User-Agent 만 · 공식 API 는 그 이용 안내대로 (robots 는 긁어 가는 것에 대한 규칙) · 웹 페이지는 robots · 약관이 막으면 우회하지 않고 "못 가져옴" · 보도로 대신하지 않는다 · 권리가 확인되지 않은 원문 전문은 git(공개 저장소)에 넣지 않는다
- 게이트에서 사람이 고친 것은 전부 `logs/correction-log.jsonl` 에 (§10.3) — 3개월 뒤 무엇을 자동화할지의 근거다

## Phase 1 다음 — 도윤에게 물을 것
10월 FOMC 로 한 바퀴(P-7 까지)가 돌면 **두 번째 기사를 다른 분야로** 한다 — 그때 PM 이 도윤에게 어느 분야 · 어느 사건으로 할지 묻는다 (도윤 요청 2026-10-30).

## Phase 1 의 끝
파이프라인이 **최신 사건 하나**로 기사 한 판을 만들고, 그 기사가 FOMC 골든과 같은 검사를 통과하고, 그 기사로 실제 독자 테스트(F-3 — D37 의 화면 · 물음 구조를 그대로)를 한다.
독자 반응을 본 뒤에 정하는 것: 글쓰기 틀 · 기사당 레벨 수 (D21) · 개인화 (D39).

## Step
| Step | 내용 | 스테이지 (§7) | LLM | 상태 |
|---|---|---|---|---|
| P-1 | **원문 저장 · 해시 · span** — FOMC 골든의 출처 31 을 실제로 저장하고, 구절 69개의 글자 위치를 기계가 찾는다. 권리 대장 | 1 · 2 (기계 부분) | 없음 | ☑ 2026-10-30 — PM 검수 대기 (`logs/pipeline/P-1.md` · 저장 17 · 못 가져옴 14 · 구절 82 중 찾음 34 · 기계 검증용 55 → 26) |
| P-2 | 사건 선정 (게이트 1 — 도윤) + 그 사건의 1차 자료 수집 · 저장 | 0 · 1 | 없음 | ☑ 2026-10-30 — PM 검수 대기 (`logs/pipeline/P-2.md` · 사건: 10월 FOMC (도윤) · 10/28 동결 10-2 · 목록 33: 저장 28 · 못 가져옴 5 · 빈 슬롯 5 · BLS API 는 api.bls.gov robots `Disallow: /` 로 부르지 않음 — _open P2-a) |
| P-3 | 사실 추출 + span → Deep Fact Graph 초안 (+ BLS API · 9월 골든으로 추출 품질 재기) | 2 · 3 | 있음 | ☑ 2026-11-10 — P-3 (`logs/pipeline/P-3.md` · Sonnet · 칸 틀림 · 수량어 틀림 → D42). **P-3b ☑ 2026-11-10 — PM 검수 대기** (`logs/pipeline/P-3b.md` · Opus · 표 5 문서는 코드가 읽음 (table-rules.json) · 수량어 대응표 · 수 대조 · 묶기 R3. 10월 사실 662 = 모델 420 + 표 209 + BLS 33 · 칸 틀림 0 · 수량어 틀림 0 · 국채 10/28 10 Yr 5.05. 9월 저장된 골든 47 중 찾음+일부 42 (89%) · 글 틀림 0 · 비용 $5.07 · _open P3b-a ~ g — 분기 날짜를 프롬프트로 해에 맞춘 것(지시와 어긋남) 포함) |
| P-4 | Coverage 슬롯 점검 · 빈 슬롯 다시 모으기 · 스토리라인 상태 | 4 · 5 | 있음 | ☑ 2026-11-10 — PM 검수 대기 (`logs/pipeline/P-4.md` · 스키마 `fomc-hold/1` (동결 논리 · 이력 으로 고침 · 요소 45 = SlotCheck) · 슬롯 15: 채움 10 · 일부 5 · 빔 0 · 요소 FOUND 40 · NOT_EXTRACTED 2 (CAL — P3b-e) · SOURCE_UNAVAILABLE 3 (반대자 표결 설명 · 10월 회의록 · FedWatch) · 다시 모음 9 문서 (베이지북 본문 · Hammack 11/5 · 2026 성명문 5 · 백악관 6/19 · 10/25) → 그래프 784 · SL-iran-war v2 (사실 94 · 6/19 MOU 가 골든에 빠진 그림) · 비용 $2.93 · _open P4-a ~ k) |
| P-5 | Derived Claim + 반증 후보 (빈 슬롯은 재수집) | 6 | 있음 | ☑ 2026-11-10 — PM 검수 대기 (`logs/pipeline/P-5.md` · P-4 잔일: CAL 일정 표 규칙 (`fomc_calendar` · S05.d · S15.a FOUND → 채움 12 · 일부 3) · v2 는 그래프 사실을 가리킨다 (`_fact_refs` 94) · 판 `p3-extract/3` (앞 판 출력은 요청 지문이 같을 때만) · label 장부. 해석 후보 14 (일반 13 · `_d5` 1) · 물음 74: NOT_REFUTED 38 · SCOPED 26 · UNRESOLVED 10 · 판정 VALID 1 · WITH SCOPE 4 · 검사 안 됨 5 · 계약 표 밖 4 · 빈 반증 슬롯 10 (회의록 11/18 이 7) · 다시 모음 WH-COOK-1007 · 새 검사 verify-claims · 비용 $3.94 · _open P5-a ~ l) |
| P-6 | 요점(Goal) 후보 → 게이트 2 (도윤) | 7 | 있음 | ☐ |
| P-7 | KC 역산 · 사실 선택 · **의미 대조 (독자에게 가는 사실 — D43)** · 집필 · 레드팀 · 블록 분할 → 계약 패키지 → 검사 → 게이트 3 | 8 ~ 13 | 있음 | ☐ |
| — | 그 기사로 F-3 (D37 구조) | | | ☐ |

### 잔일 Step (D47 — 회의록을 기다리는 동안)
| Step | 내용 | 서브에이전트 모델 | 상태 |
|---|---|---|---|
| W-2 | 의미 대조 (D43) — 판정 단계 + 시험 묶음 · Opus ↔ Fable 견줌 · 상한 8 달러 | Fable | ☑ 2026-11-11 — **닫힘 (D49 — 이 단계 모델 Opus medium)** (`logs/pipeline/W-2.md` · `w2` 명령 · 프롬프트 `w2-entail/1` · 판정 ENTAILED / NEEDS_CONTEXT / EXCEEDS / CONTRADICTS / CANNOT_JUDGE + 가리킨 부분(글자 그대로 · 코드가 확인) · 글을 고쳐 쓰지 않음. 시험 묶음 107: 맞는 예 56 · 구절 부족 16 · 넘침 · 어긋남 31 (교정 전 골든 4 · Sonnet 수량어 2 · 10월 F449 · 일부러 24). **medium — Opus: 잘못 막음 2 · 구절 부족 16/16 · 넘침 28/31 · $1.05 / Fable: 1 · 15/16 · 27/31 · $1.50** (high: Opus 3 · 16 · 28 · $1.13 / Fable 1 · 15 · 28 · $2.72). 둘 다 놓침: 연준 수량어 Several → 일부 2 (코드 검사가 막는다) · F449. 원문이 저장된 맞는 예 49 에서 잘못 막음 0. 비용 $6.73 · 새 검사 verify-entailment (사본 18) · _open W2-a ~ k — 모델은 고르지 않았다) |
| W-3 | BLS 지수 → 변화율 (BLS 방식 그대로 · 9월 골든 대조) · API 비용 0 | Opus | ☑ 2026-11-11 — **닫힘 (D48)** (`logs/pipeline/W-3.md` · `bls-rates` 명령 · 10월 계산 18 (9월 · 8월 × 측정 9 — 9월 CPI 1년 전 3.7% · 근원 2.6% · 취업자 +60천) + 9월 54 · **9월 골든 대조 34: CPI 23/23 같음 · PPI 3 · 취업자 3 다름 (받은 날 판 — 고쳐진 시리즈)** · 연준 인용 9/9 같음 · **계약 자리 없음 → 그래프 0 · 계산 기록 `bls/rates.json` · _open W3-a (추천: 계산된 수 타입 — W-4)** · 9월 CPI 회의 전 공개 미확인 (W3-c · 10/1 셧다운 F217) · 검사 verify-bls-rates · 사본 18) |
| W-1 | 회의록 다시 돌리기 한 번에 (+ `bls-rates` · W3-c 체크포인트) · 해석 한 문장 검사 (P5-e) · `p1 --check` · 상한 2 달러 | Opus | ☑ 2026-11-11 — **닫힘 (D50)** (`logs/pipeline/W-1.md` · **`rerun <code> --doc <LABEL>` (기본 마른 실행 · `--go` 로 돈다)** — 수집 → 추출 · 묶음 → bls-rates → 붙이기 · Unslotted → 해석 · 반증, 단계마다 verify-* · 실패하면 멈춤 · 바뀐 것만 부름. **마른 시험 (WH-COOK-1007 을 새 문서인 척): 다섯 단계 끝까지 · 모델 0 · 전부 `--check` 같다** · 회의록 날 예상 부르기 6 · 대략 $2.9 · P-5 판 `p5-derive/2` · `p5-counter/2` (부르지 않음 — 한 문장 · "주장은 남기고 범위를 단다" · 회의록 = `[뒤 · 회의 기록]` (after 갈래 아님 · p3 판 그대로) · 체크포인트) · 한 문장 검사 CL_SENTENCE (/1 은 WARN 13 — 해석 원래 문장도 11/14 가 두 문장 이상) · W3-c = `checkpoints.json` (반증 부르기에 같이) · `p1 --check` 못 가져옴 13 요청 0 · 비용 $0 · _open W1-a (llm.ts STEP 을 그날 바꾼다) ~ j) |
| W-4 | 계약 잔일 — 가져온 기록 (P1-a · J5) · **계산된 수 타입 (W3-a · D48)** · §7.3 줄 (P5-c · D50 규칙) · 스토리라인 판 → 사건 사실 (P5-b) · API 0 | Opus | ⏳ 도는 중 (2026-11-11) |
| W-6 | **API 비용 줄이기 (D51)** — 장부 분석 · 배치 (값이 반) · 캐시가 먹는지 · effort · 보내는 양 (안) · 정답이 있는 곳에서 작게 잼 (상한 4 달러) · W1-a · 목표 한 편 ≤ 3 달러 | Opus | ☐ W-4 뒤 |
| W-5 | 사실 추출 잔일 (P3b-b (a) · c · d · f) + **판 올려 10월 사실 다시 뽑기 (W-6 의 배치 길로 ≈ 1.8 달러 · D50 · D51)** + W2-b (`w2-entail/2` · Opus medium 다시 잼) + F046 · F449 확인 + 끝에 `rerun --pretend-new` | Opus | ☐ W-6 뒤 |

**도윤이 준비할 것 (P-3 전)**: Claude API 키 — 비밀 값이다. 채팅에 붙이지 않고 `apps/web/.env.deploy` 처럼 git 밖 파일에. 사용 한도를 걸어 둔다.

---

## 잔일 (급하지 않다)
- P1-a · m6: SourceDocument 에 해시 · 가져온 주소 · 가져온 때 · 받은 판 (계약 — 다음 백엔드 손질 때)
- P1-h: 못 찾은 구절 17 을 저장한 원문에서 글자 그대로 다시 적기 (콘텐츠 · 교정 기록)
- P-5 잔일: 계약 §7.3 표 밖 4 건 (P5-c) · v2 참조 모양 (P5-b) · 해석 한 문장 검사 (P5-e) · BLS 지수에서 변화율 계산 (P4-k · DERIVED)
- P-3b 잔일: 영어 수 낱말이 글에 남음 (P3b-c) · 표의 창에 스토리라인 시작일 (P3b-d) · CAL 일정 줄 (P3b-e — P-4 에서 S05.d · S15.a 가 이것 때문에 NOT_EXTRACTED · P4-f) · bp · %p 표기 차이로 안 묶임 (P3b-f) · P3-e · f · g
- `p1 --check` 가 못 가져온 문서를 다시 요청한다 — P-2 방식으로 맞춘다 (D41)
- 남은 기계 검증용 26: 못 가져온 문서(BLS 7 · CENTCOM 3 · CME 2 …)에만 기댄 사실 13 + 표기 때문에 못 찾은 10

## W-6 · API 비용 줄이기

### 서브에이전트 지시 (Opus · W-4 뒤에 보낸다)
```
너는 Claro 프로젝트의 작업 세션이다. Step W-6 (API 비용 줄이기)을 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`. 커밋 전 `git status` 로 남의 미커밋을 보고 건드리지 마라.

## 왜
도윤: "API 비용을 잘 쓸 수 있게 해야 한다. 처음엔 유저가 많이 모이지 않는다." (D51)
지금 기사 한 편 몫이 약 6 ~ 7 달러 (P-7 집필 빼고). 장부(`packages/pipeline/data/p3-calls.jsonl`)를 보면 **출력 토큰(생각 토큰 포함)이 돈의 대부분**이다 — P-3b 출력 18만 토큰 ≈ 3.6 달러 / 5.07. P-5 는 입력 56만 토큰 (그래프 전체를 여러 번 보낸다).
목표: **품질을 지키면서 기사 한 편 ≤ 3 달러** (P-7 빼고). 품질은 이미 있는 정답으로 잰다 — 정답 없이 싼 쪽으로 옮기지 않는다 (D2).

## 먼저 읽을 것
- CLAUDE.md · docs/DECISIONS.md D2 · D42 · D43 · D47 · D49 · D50 · **D51**
- docs/development-pipeline.md · logs/pipeline/P-3b.md (9월 골든 비교 방법) · W-2.md (시험 묶음) · W-1.md (rerun)
- packages/pipeline/src/llm.ts · p3.ts · p4.ts · p5.ts · w2.ts · rerun.ts · data/p3-calls.jsonl (장부)
- **claude-api 스킬을 먼저 불러라** — Message Batches · prompt caching · effort 의 지금 사용법 (모델마다 다르다. 추측하지 마라)

## 할 일
1. **장부 분석** — 단계별 · 호출별로 돈이 어디로 가나 (입력 · 캐시 · 출력). 기사 한 편 몫을 단계별로 표로
2. **배치 (Message Batches · 값이 반)** — 급하지 않은 부르기를 배치로 보내는 길을 llm.ts 에 (결과는 지금처럼 저장 → 그 뒤는 결정적). rerun 의 기본을 배치로 하되 `--now` 로 즉시도 되게. 마른 실행이 배치 예상 비용을 보여 주게
3. **캐싱** — 같은 앞부분(지시 · 스키마 · 그래프)을 여러 번 보내는 곳에 캐시가 실제로 먹는지 장부의 cache_read 로 확인하고, 안 먹으면 까닭(앞부분이 바뀌는 것)을 고친다. 특히 P-5 (그래프를 여러 번)
4. **보내는 양 줄이기** — P-5 가 그래프 전체를 보내야 하나? 해석 · 반증에 필요한 사실만 보내는 안 (슬롯 표 · 대표 사실). 이건 품질에 닿는다 — 안을 내고, 바꿀 거면 아래 5 로 잰다
5. **effort · 모델 재기 (작게)** — 단계마다 지금 effort 가 필요한지. 정답이 있는 곳에서만 잰다:
   - 사실 추출: 9월 골든 비교 (P-3b 방법) — 문서 몇 개 표본으로. effort 낮춤 · 배치가 결과를 바꾸는지
   - 의미 대조: W-2 시험 묶음 — Opus low vs medium · Sonnet 5.5 medium
   - P-4 · P-5 는 정답이 없다 — effort 만, 앞 결과와 나란히 놓고 사람이 볼 표로 (바꾸지 말고 안만)
   - **재기에 쓰는 돈 상한 4 달러.** 바꾸는 판정은 PM 이 한다 — 표와 추천만
6. **새 기본값은 PM 판정 뒤** — 이 Step 에서는 배치 · 캐시 수리처럼 결과를 바꾸지 않는 것만 기본으로 켠다. effort · 모델 · 보내는 양 바꾸기는 안 + 잰 결과까지
7. llm.ts 의 STEP 상수 · 상한을 부르는 쪽이 넘기게 (W1-a) — rerun 이 단계 이름 · 상한을 받게

## 하지 말 것
- 그래프 · 해석을 손으로 고치기 · 10월 사건 전체 다시 뽑기 (W-5 가 한다 — 이 Step 이 만든 배치 길로)
- fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정 · docs/PM.md 읽기
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/W-6.md` — 맨 앞에 ① 기사 한 편 몫 표 (지금 → 배치 · 캐시 뒤 → 안을 다 받으면) ② 잰 결과 (품질 · 비용) ③ 켠 것 / 안으로만 둔 것 ④ 비용 ⑤ _open. "작업 세션 모델: Opus 5.5" 를 적어라
- 검사: 파이썬 검사 전부 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림은 하나씩 `git checkout -- <파일>`) · `rerun FOMC-20261028 --doc WH-COOK-1007 --pretend-new --go` 끝까지 (모델 0) · 새 검사 + 망가뜨린 사본
- docs/development-pipeline.md 의 W-6 줄 · 커밋 접두사 `W-6` · 파일 지정 (`git commit -m … -- <파일들>`) · push (거절되면 `git pull --no-rebase`). stash · autostash · reset --hard 금지
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 한 편 몫 (전 → 후) · 잰 결과 · 추천 · 비용 · _open
```

## W-4 · 계약 잔일

### 서브에이전트 지시 (Opus)
```
너는 Claro 프로젝트의 작업 세션이다 — 백엔드 레인 (계약을 쓰는 레인). Step W-4 (계약 잔일)를 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`. 지금 다른 서브에이전트는 돌지 않는다 (도윤이 따로 세션을 열 수는 있다 — 커밋 전 `git status` 로 남의 미커밋을 보고 건드리지 마라).

## 왜
파이프라인(P-1 ~ P-5 · W-1 ~ W-3)이 만든 실물이 계약 밖에 기록을 두고 있다. P-7 에서 **계약 패키지**를 만들기 전에 계약이 실물을 담아야 한다. 계약은 실물에서 도출한다 (D24) — 지금 그 실물이 있다.
독자 글은 바뀌지 않는다.

## 먼저 읽을 것
- CLAUDE.md — 특히 "계약 규칙" (백엔드만 쓴다 · 한 타입은 한 파일 · CHANGELOG 한 줄) · "계약은 실물에서 도출한다"
- docs/contract/DATA_MODEL.md 전부 · ARTICLE_PACKAGE.md 의 VolatileRef · DERIVED 부분 · CONCEPT_IDENTITY · OBSERVATION 은 목차만
- docs/DECISIONS.md D8 · D24 · D27 · D33 · D40 · D44 · D45 · **D48 (W3-a)** · **D50 (P5-c 판정 규칙)**
- logs/pipeline/P-1.md (P1-a · J5) · P-5.md (P5-b · P5-c) · W-3.md (③ · W3-a) · W-1.md 맨 앞
- packages/contract (types · data-model · validate) · scripts/verify-data-model.py · selftest · fixtures/store.json
- packages/pipeline/data/ — 실물: `fomc-2026-09.sources.json` · `events/FOMC-20261028/` (store.documents.json · bls/rates.json) · `p3-golden/FOMC-20260916/bls-rates.json` · `storylines/SL-iran-war/v2.json`

## 할 일 (넷)
1. **P1-a · J5 — SourceDocument 의 가져온 기록**: 해시(sha256) · 가져온 주소(리다이렉트 뒤) · 가져온 때 · 뽑은 방법(판) · 권리 근거. 지금 파이프라인 기록 파일에 있는 칸에서 도출. 파이프라인 출력이 새 칸을 채우게 (손으로가 아니라 코드로)
2. **W3-a — "계산된 수" 타입** (D48 의 안 (a)): 입력은 그래프 사실 (FactRef — 지수의 두 달) · op (실물: 1년 전 대비 변화율 · 전월 대비 변화율 · 수준의 차) · 반올림 · 값 · 단위 · 입력이 VOLATILE 이면 결과도 VOLATILE (as_of = 입력의 as_of) · **불변식: 다시 계산 == 기록값**. 입력 사실이 그래프에 있어야 하니 bls.ts 가 기준 달(1년 전 · 전월)의 지수도 사실로 만들게 한다. `bls/rates.json` 을 이 모양으로 그래프 곁(또는 안)에 — 자리는 네가 안을 낸다. 기사의 사실 표시에 어떻게 보일지(“BLS 지수에서 BLS 방식으로 계산”)는 ARTICLE_PACKAGE 를 읽고 안만 — 화면은 고치지 마라
   - 기존 DERIVED (TimeExpression · 날짜 계산 op 7) 와 한 타입으로 합칠지 따로 둘지는 실물로 판단하고 까닭을 적어라 (한 타입은 한 파일)
3. **P5-c — §7.3 판정 표에 줄을 더한다 (D50 의 규칙)**: "DEFENSIVE 이고 UNRESOLVED 가 있고, 나머지가 NOT_REFUTED · SCOPED 뿐 → 방어용 (발행 가능). SCOPED 가 있으면 statement 는 좁힌 문장이어야 한다". 실물 4 건 (DC-08 · 11 · 13 · 14) 에 대 보고 그 판정이 독자에게 이상해 보이는 것이 있으면 그 건만 _open. 계약 문서 · TS 판정 함수 · verify-claims 의 계산을 같이
4. **P5-b — 스토리라인 판이 사건 그래프의 사실을 가리키는 모양** (v2 `_fact_refs`): 계약에 "StorylineVersion 이 사건 사실을 가리킨다"를 넣는다 (P5-b (a)). 사실 소유는 그대로 (한 사실은 한 곳에)

## 하지 말 것
- 독자 글 · 골든 패키지의 독자 글 · 개념 라이브러리 · apps/web 화면 · packages/db 스키마 (계약이 바뀌어 db 타입 검사가 깨지면 그 사실만 적고 _open)
- 사실 그래프를 손으로 고치기 · 모델 호출 (이 Step 은 API 비용 0)
- CLAUDE.md 금지 항목 · docs/PM.md 읽기 (PM 전용)
- fixtures 의 골든을 새 칸 때문에 바꿔야 하면: 새 칸은 선택(optional)으로 두거나, 골든에 채울 수 있는 값이 실물로 있으면 채운다 (지어내지 마라). 판단이 필요하면 _open
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/backend/W-4.md` — 맨 앞에 ① 계약에 더한 것 (타입 · 불변식 · 표의 줄 — 각각 어느 실물에서 도출했나) ② 파이프라인 출력이 바뀐 것 ③ P5-c 실물 4 건의 판정 ④ _open. "작업 세션 모델: Opus 5.5" 를 적어라
- 계약 파일마다 CHANGELOG 한 줄 (날짜 · 세션 W-4)
- 검사: 파이썬 검사 전부 (verify-data-model · selftest · verify-claims · verify-bls-rates · verify-fact-graph · verify-entailment …) · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 `git checkout -- <파일>`) · 새 불변식마다 망가뜨린 사본 (계산값 한 자리 바꾸면 실패 · 해시 바꾸면 실패 · 판정 표의 새 줄)
- `pnpm --filter @claro/pipeline rerun FOMC-20261028 --doc WH-COOK-1007 --pretend-new --go` 가 끝까지 도는지 (W-1 의 마른 시험 — 모델 0)
- docs/development-pipeline.md 의 "잔일 Step" 표 W-4 줄 · 커밋 접두사 `W-4` · **파일 지정 (`git commit -m … -- <파일들>`)** · push (거절되면 `git pull --no-rebase`). stash · autostash · reset --hard 금지
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 계약에 더한 것 · P5-c 4 건 · 검사 · _open · 꼭 볼 것
```

## W-1 · 회의록 다시 돌리기 준비

### 서브에이전트 지시 (Opus)
```
너는 Claro 프로젝트의 작업 세션이다. Step W-1 (회의록 다시 돌리기 준비)을 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`.
**같은 작업 트리에서 W-2 세션(의미 대조)이 동시에 일한다** — 그쪽의 미커밋 파일: `packages/pipeline/src/llm.ts` · `src/w2*.ts` · `test/w2.test.ts` · `data/w2/` · `data/p3-calls.jsonl` · `package.json` 의 `w2` 줄. **건드리지 말고, 커밋에 싣지 마라.**
`package.json` 에 네 줄을 더해야 하면 W-3 이 한 방법(임시 인덱스로 네 줄만 커밋 — `logs/pipeline/W-3.md` 끝에 적혀 있다)을 쓴다. `llm.ts` 를 고쳐야 하면 멈추고 _open.

## 왜
10월 회의록이 11/18 무렵 나온다 (D45). 나오면 수집(P-2 도구) → 사실 추출(P-3b) → Coverage · 스토리라인(P-4) → 해석 · 반증(P-5)을 **다시** 돌리고 P-6 (요점 · 도윤 게이트 2)으로 간다.
그날 코드를 고치느라 며칠을 쓰지 않게, 지금 **명령 한 번으로 돌게** 준비한다. 회의록이 아직 없으니 진짜로 다시 돌리지는 않는다 — 준비와 마른 시험까지.

## 먼저 읽을 것
- CLAUDE.md · docs/FINDINGS.md §3.2 · §7 · §7.2 · §10.1
- docs/DECISIONS.md D40 · D41 · D42 · D43 · D44 · D45 · D47 · **D48**
- docs/development-pipeline.md · logs/pipeline/P-2.md · P-3b.md · P-4.md · P-5.md 의 맨 앞과 _open (특히 P5-e · P5-g) · logs/pipeline/W-3.md (W3-b · W3-c)
- packages/pipeline/src (p1 · pack · p3 · p4 · p5 · bls-rates) · package.json · data/events/FOMC-20261028/

## 할 일
1. **다시 돌리기 한 번에** — 사건 코드와 "새로 더할 문서"(회의록)를 받아, 수집 → 사실 추출 → (BLS 변화율 기록 `bls-rates`) → Coverage · 스토리라인 → 해석 · 반증 을 차례로 도는 명령. 이름 · 모양은 네가 안을 낸다.
   - **앞 단계의 저장된 출력은 그대로 쓰고, 새 문서 · 바뀐 입력에 닿는 부분만 다시 부른다** (모델 비용). 무엇을 다시 부르고 무엇을 재사용하는지를 실행 전에 보여 주는 마른 실행(dry-run)과 예상 비용
   - 단계마다 멈추고 검사(verify-*)를 돌린다. 검사가 실패하면 거기서 멈춘다 — 다음 단계로 넘기지 않는다
   - 사람이 고친 것은 `logs/correction-log.jsonl` 로 (§10.3) — 게이트는 그대로 사람이다
   - 회의록의 자리: 연준 회의록은 사건 뒤 문서다. D33-b (발행 뒤 문서) 와 P-4 의 "회의 뒤 문서" 범위 · 판(PROMPT_VERSION)을 확인하라
2. **해석 한 문장 검사 (P5-e)** — P-5 의 좁힌 문장이 2 ~ 3 문장으로 미끄러졌다. 코드 검사(문장 수)와 프롬프트 손질(주장은 남기고 범위를 단다)을 넣되 **판을 올리고 다시 부르지는 마라** — 회의록 때 한 번에 돈다. 망가뜨린 사본으로 검사가 실패하는지
3. **`p1 --check` 가 못 가져온 문서를 다시 요청한다** — P-2 방식(D41)으로 맞춘다: 못 가져옴으로 기록된 것은 다시 두드리지 않는다
4. **W3-c 체크포인트** — 9월 CPI · PPI 가 회의(10/28) 전에 공개됐는지 우리 출처로 모른다 (10/1 셧다운 · F217). 다시 돌릴 때 회의록에서 이것을 확인하도록 P-5 다시 돌리기의 물음 목록(또는 P-4 슬롯)에 넣는 자리를 만든다 — 지금은 자리만
5. **마른 시험**: 회의록 대신 **이미 저장된 문서 하나를 "새 문서"인 척** 넣어 명령이 끝까지 도는지 (모델 호출 없이 — 저장된 출력 재사용으로). 진짜 모델 호출이 필요한 곳에서는 마른 실행만

## 비용 · 비밀
- 이 Step 상한 **2 달러** (원칙은 0 — 마른 시험은 모델 없이). 키는 `packages/pipeline/.env.pipeline` — 값을 남기지 마라

## 하지 말 것
- 진짜로 10월 사건 전체를 다시 돌리기 · 그래프 · 해석을 손으로 고치기
- 해석 · 요점 · 집필 · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정 (모양이 모자라면 _open)
- W-2 의 파일 · docs/PM.md 읽기 (PM 전용)
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/W-1.md` — 맨 앞에 ① 명령과 회의록이 왔을 때 할 일 (도윤 · PM 이 그날 그대로 따라 할 수 있게, 5 줄 안쪽) ② 마른 시험 결과 ③ 한 문장 검사 · p1 --check ④ W3-c 자리 ⑤ 비용 ⑥ _open. "작업 세션 모델: Opus 5.5" 를 적어라
- 검사: 파이썬 검사 전부 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 `git checkout -- <파일>`) · 새 검사 + 망가뜨린 사본
- docs/development-pipeline.md 의 "잔일 Step" 표의 W-1 줄 (그 줄만 — 다른 세션도 같은 파일을 고친다. 커밋 직전에 다시 읽고 고쳐라) · 커밋 접두사 `W-1` · **파일 지정 (`git commit -m … -- <파일들>`)** · push (거절되면 `git pull --no-rebase`). stash · autostash · reset --hard 금지
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 명령 · 마른 시험 · 비용 · _open · 꼭 볼 것
```

## W-2 · 의미 대조

### 서브에이전트 지시 (Fable)
```
너는 Claro 프로젝트의 작업 세션이다. Step W-2 (의미 대조)를 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`.
**같은 작업 트리에서 W-3 세션이 동시에 일한다** — 그쪽은 `packages/pipeline/src/bls.ts` · 변화율 코드 · `data/events/FOMC-20261028/` 를 고친다. 너는 그 파일들을 고치지 마라 (읽기는 된다).

## 왜
사실 그래프(P-3b)는 숫자 · 날짜 · 수량어 · 표의 칸을 코드가 막는다. 그러나 **글의 뜻이 구절보다 많은 것**은 못 막는다 — 10월 표본 15 중 4 (주어 · 맥락이 구절 밖, P3b-b).
독자는 사실 표시를 "원문 확인"으로 읽는다 (D27). 구절이 원문에 있다 ≠ 그 구절이 이 글을 말한다 (D42).
PM 판정 D43: **의미 대조를 만든다 — 단 독자에게 가는 사실에만 (P-7 의 사실 선택 뒤, 30 개 안팎).** 지금 만들고, 정답이 있는 곳에서 잰다.

## 먼저 읽을 것
- CLAUDE.md · docs/FINDINGS.md §5 전부 (특히 §5.5) · §10.1 · §11
- docs/DECISIONS.md D27 · D28 · D42 · **D43** · D2 (모델 배치 OPEN — 잰다, 정하지 않는다)
- docs/development-pipeline.md · logs/pipeline/P-3.md · P-3b.md 의 맨 앞과 ⑤ (P3b-b · 표본 15 와 구절 부족 4 의 이름)
- logs/content/source-check-2026-10.md · golden-correction-2026-10.md — 9월 골든에서 **사람이 원문과 대 보고 찾은 틀린 사실** (D28 의 D-1 ~ D-8 등). 이것이 자연스러운 "틀린 예"다
- fixtures/store.json — 9월 사실 · fact_sources (`_passage`) · span
- packages/pipeline (P-3 의 llm.ts · 저장한 모델 출력에서 결정적으로 도는 방식 — 같은 모양으로)

## 할 일
1. **판정 단계** — 입력: 사실 하나 (글 · fact_type · actor · 시점) + 그 구절 + 구절이 든 문장 전체(코드가 원문에서 넓힌다 — 주어가 앞 줄에 있는 경우). 출력: 판정 (예: 글이 구절에서 나온다 / 넘친다 / 어긋난다 / 판단 못 함) + 넘치거나 어긋난 **부분**과 까닭. 이름 · 값 집합은 네가 안을 내라.
   - 글을 고쳐 쓰지 마라 — 고치는 것은 사람이다 (게이트 3). 넘친 부분을 가리키기만
   - 모델 출력은 저장하고, 그 뒤(집계 · 검사)는 저장한 출력에서 결정적으로 (P-3 처럼)
2. **잰다 — 정답이 있는 시험 묶음**을 만든다 (자리는 네가 안을 낸다):
   - 맞는 예: 9월 골든의 사실 (사람이 1차 대조를 거친 것) · P-3b 의 9월 · 10월 표본 가운데 "구절 부족 0" 인 것
   - 틀린 예: ① P3b-b 의 구절 부족 4 ② 9월 골든 교정 전의 틀린 글 (C-3 · C-5 기록에서 — 구절이 저장된 것만) ③ **일부러 망가뜨린 글**: 같은 구절에 글만 넘치게 — 수량어 키우기 · 인과 붙이기 · 범위 넓히기 · 시점 바꾸기 · 주어 바꾸기 · 조건 지우기. 각 꼴 몇 개씩
   - 표: 틀린 예를 얼마나 잡나 · 맞는 예를 얼마나 잘못 막나 (꼴별로). **놓친 것은 하나하나 적어라**
3. **모델 비교 (D2 — 잰다)**: 같은 시험 묶음에 `claude-opus-5-5` 와 `claude-fable-5-2` 를 돌려 잡는 수 · 잘못 막는 수 · 비용 · 시간을 나란히. 고르지 마라 — PM 이 판정한다. claude-api 스킬을 먼저 불러 지금의 SDK 사용법을 따른다 (Fable 은 thinking 설정이 다르다)
4. 10월 그래프에서 **보기로** 사실 몇 개에 돌려 봐도 된다 (읽기만 — 그래프를 고치지 마라)

## 비용 · 비밀
- 상한 **8 달러**. 넘을 것 같으면 멈춘다. 키는 `packages/pipeline/.env.pipeline` — 값을 출력 · 로그 · 커밋에 남기지 마라
- 권리 미확인 문서의 구절 · 모델 출력은 git 밖 캐시에만 (P-3 처럼)

## 하지 말 것
- 사실 그래프 · 사실 글 · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정 (모양이 모자라면 _open)
- P-7 의 사실 선택 · 집필 · 이 단계를 파이프라인 명령에 잇기 (W-1 이 한다)
- bls.ts · data/events/FOMC-20261028/ 고치기 (W-3)
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/W-2.md` — 맨 앞에 ① 판정 모양 ② 시험 묶음 (맞는 예 · 틀린 예 꼴별 수) ③ 결과 표 (모델별 · 꼴별 잡음 · 잘못 막음) ④ 놓친 것 하나하나 ⑤ 비용 ⑥ _open. 그다음 프롬프트 (그대로) · 검사 출력
- 검사: 파이썬 검사 전부 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 `git checkout -- <파일>`) · 새 검사가 있으면 망가뜨린 사본
- docs/development-pipeline.md 의 W-2 줄 · 커밋 접두사 `W-2` · **파일 지정 (`git commit -m … -- <파일들>`)** · push (거절되면 `git pull --no-rebase`). stash · autostash · reset --hard 금지
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 시험 묶음 · 모델별 결과 · 놓친 것의 꼴 · 비용 · _open · 꼭 볼 것
```

## W-3 · BLS 변화율

### 서브에이전트 지시 (Opus)
```
너는 Claro 프로젝트의 작업 세션이다. Step W-3 (BLS 변화율)을 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`.
**같은 작업 트리에서 W-2 세션이 동시에 일한다** — 그쪽은 의미 대조 코드(새 파일)와 그 시험 묶음을 만든다. 네가 만들지 않은 새 파일은 건드리지 마라.

## 왜
독자는 "소비자물가지수 324.1"이 아니라 "물가가 1년 전보다 3.1% 올랐다"를 읽는다. 지금 10월 그래프의 BLS 사실 33 은 **지수 수준 · 받은 날 판뿐**이다 (P3-g · P4-k · P5-g).
그래서 P-5 의 "회의 직전 지표가 무엇을 말했나" 물음이 약했다. 9월 기사의 같은 자리(DC-C 의 8월 CPI)는 변화율이었다.

## 먼저 읽을 것
- CLAUDE.md · docs/FINDINGS.md §5.4 · §6 · §7
- docs/DECISIONS.md D8 · D27 · D40 · **D41 (BLS 는 공식 API v1)** · D42 · D44 · D45
- docs/contract/DATA_MODEL.md — Fact (volatility 주석: "Fact 에는 DERIVED 가 없다") · §6 · DERIVED 의 formula · inputs 모양 · TimePoint
- docs/development-pipeline.md · logs/pipeline/P-3.md (BLS 부분 · J1) · P-3b.md · P-4.md (P4-k) · P-5.md (P5-g)
- packages/pipeline/src/bls.ts · p3.ts · tables.ts · data/events/FOMC-20261028/bls/bls.json

## 할 일
1. **변화율을 코드가 계산한다** — BLS 가 발표하는 방법 그대로:
   - CPI · 근원 CPI: 1년 전 대비 (계절조정 안 된 지수) · 전월 대비 (계절조정 지수). 반올림은 BLS 발표 방식대로 (소수 한 자리)
   - 고용: 전월 대비 증감 (수준의 차) · 실업률은 그대로
   - 9월 사건(FOMC-20260916)에도 같은 계산을 돌려 **9월 골든의 변화율 사실과 맞는지** 대 보라 — 정답 대조다. 연준 문서(성명 · 회의록 · 연설)가 인용한 수치가 있으면 그것과도 대 보라
   - 13 달 넘는 자료가 필요하면 BLS API v1 의 연도 범위를 넓힌다 (하루 25 회 안 · 정직한 User-Agent · D41)
2. **받은 날 판 ≠ 첫 발표** — API 는 지금의 수정된 값을 준다. 계산값마다 어느 판의 지수로 했는지 적어라. 회의 당일 위원들이 본 값(첫 발표)과 다를 수 있다는 것을 기록에 남겨라 — 고치지는 않는다
3. **계산값이 어디에 사나** — 계약을 읽고 찾아라: 사실로 둘지, DERIVED 계산(formula · inputs)으로 둘지. **계약에 맞는 자리가 없으면 계약을 고치지 말고 _open 으로 안을 내고 그 부분만 멈춰라.** 자리가 있으면 그래프(또는 그 곁)에 넣는다 — 손으로가 아니라 코드로, 다시 돌리면 같은 결과
4. 모델 호출은 하지 않는다 (API 비용 0). 그래프를 다시 짓는 것은 저장된 모델 출력에서만

## 하지 말 것
- 해석 · 요점 · 집필 · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정
- 그래프를 손으로 고치기 · bls.gov 웹 페이지 우회 수집 (robots 로 막혀 있다)
- W-2 의 파일
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/W-3.md` — 맨 앞에 ① 계산한 변화율 표 (시리즈 · 달 · 값 · 쓴 지수 · 판) ② 9월 골든 · 연준 인용과의 대조 결과 ③ 계산값이 사는 자리 (또는 _open) ④ 그래프에 생긴 변화 (수) ⑤ _open
- 검사: 파이썬 검사 전부 (verify-fact-graph · verify-coverage · verify-claims 포함) · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 `git checkout -- <파일>`) · 변화율 계산의 검사 + 망가뜨린 사본 (지수 한 칸 바꾸면 실패)
- docs/development-pipeline.md 의 W-3 줄 · 커밋 접두사 `W-3` · **파일 지정 (`git commit -m … -- <파일들>`)** · push (거절되면 `git pull --no-rebase`). stash · autostash · reset --hard 금지
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 변화율 몇 개 · 9월 대조 · 자리 · _open · 꼭 볼 것
```

## P-5 · 해석 후보 · 반증

### 서브에이전트 지시
```
너는 Claro 프로젝트의 작업 세션이다. Step P-5 를 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`.

## 목표
10월 FOMC 사건(`FOMC-20261028`)의 **해석(Derived Claim) 후보와 그 반증 기록**을 만든다 — FINDINGS §7 스테이지 6.
해석은 사실들에서 끌어낸 말이다 ("왜 동결했나", "9월과 무엇이 달라졌나"). 해석마다 **그것을 약하게 만들 사실을 찾고**, 없으면 다시 모은다 (§7.2).
요점(Goal) · 글은 아직 아니다 (P-6 · P-7). 해석은 **후보**다 — 사람이 게이트에서 본다.

## 먼저 읽을 것
- CLAUDE.md · docs/FINDINGS.md §1.1 · §1.2 · §5.2 · §7 · §7.2 · §7.3 · §7.6 · §10.1 · §11
- docs/DECISIONS.md D23 (층 판정) · D27 · D28 · D29 (C-5 — 반증 기록을 실제로 어떻게 했나의 본보기) · D42 · D43 · **D44**
- docs/contract/DATA_MODEL.md — DerivedClaim · CounterCheck (물음 · 답 · 답의 근거 사실 · outcome) · 판정은 저장하지 않고 기록에서 계산 (§7.2 · §7.3)
- fixtures/store.json — 9월의 claims (DC-A ~ DC-J) 와 checks — 모양과 잘게 나눔의 본보기
- logs/content/golden-correction-2026-10.md §2 — 사람이 9월 해석을 반증한 기록 (무엇을 물었고 무엇에 걸렸나)
- docs/development-pipeline.md · logs/pipeline/P-4.md 맨 앞 · packages/pipeline · data/events/FOMC-20261028/ · data/storylines/

## 먼저 — P-4 잔일 (D44)
1. CAL (FOMC 일정 페이지)을 표 규칙으로 — "10월엔 새 SEP 없음" · "다음 회의 12/8-9" 가 사실로 (P4-f)
2. 스토리라인 v2 가 사실을 **옮겨 적지 않고 그래프의 사실을 가리키게** (P4-b — 한 사실은 한 곳에)
3. 회의 뒤 문서용 범위를 더한 프롬프트의 판(PROMPT_VERSION)을 올린다 (P4-j — 무엇으로 뽑았는지가 기록에 남아야 다시 돌릴 수 있다)

## 할 일
1. **해석 후보** — 사실 그래프 · 슬롯 표 · 스토리라인에서 Opus 가 해석 후보를 낸다. 해석마다:
   - `statement` (한 문장) · 근거 사실 (fact_id — 그래프에 있는 것만) · 어느 슬롯의 물음에 답하나
   - 9월 사람이 쓴 해석의 크기 · 잘게 나눔을 본보기로. 숫자를 채우려고 만들지 마라
2. **반증** — 해석마다 "이 해석을 약하게 만들 사실이 있다면 무엇인가"를 묻고, 그래프에서 찾는다. 계약의 CounterCheck 모양 (물음 · 답 · 근거 사실 · outcome).
   - 답이 그래프에 없으면 **빈 반증 슬롯** — 1차 자료를 다시 모은다 (P-2 의 도구 · 예절 D40 · D41). 다시 모아도 없으면 UNRESOLVED
   - 9월 C-5 의 교훈: "좁혀서 참이 되는 문장"과 "독자가 맞는 그림을 얻는 것"은 다르다. 범위를 좁힌(SCOPED) 해석은 **좁힌 문장**을 같이 내라
   - 발행 뒤 문서에만 기댄 답으로는 발행할 수 없다 (D33-b) — 사건 날(10/28) 뒤 문서를 근거로 쓴 답은 표시
3. **정치 (D5 는 OPEN — D44 의 임시 규칙)**: 의장 교체 · Cook 관련 청문 절차 · 대통령의 말 같은 것에 대해
   - **동기 · 의도 · 압력에 대한 해석을 만들지 마라.** 누가 무엇을 공식적으로 말했다(OFFICIAL_CLAIM)는 사실까지만
   - 정치에 닿는 해석 후보는 만들되 `_d5` 표시를 달고 따로 모아라 — 도윤이 D5 를 정한 뒤 본다
4. 해석 후보가 몇이든, **9월의 반증 기록과 비슷한 깊이**인지 스스로 본보기 하나(9월 DC-C 등)와 견줘 로그에 적어라

## 비용 · 비밀
- 이 Step 상한 **10 달러**. 넘을 것 같으면 멈춘다. 키는 `packages/pipeline/.env.pipeline` — 값을 남기지 마라

## 하지 말 것
- 요점(Goal) · 집필 · 개념 문안 · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정 (모양이 모자라면 _open)
- 그래프를 손으로 고치기 · 우회 수집 · 보도로 1차를 대신하기 · 해석에 근거 사실 없이 쓰기
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/P-5.md` — 맨 앞에 ① 해석 후보 표 (statement · 근거 · outcome 계산값 · 좁힌 문장) ② 빈 반증 슬롯과 다시 모은 결과 ③ `_d5` 묶음 ④ 9월 본보기와의 견줌 ⑤ 비용 ⑥ _open
- 검사: 파이썬 전부 · verify-fact-graph · verify-coverage · verify-source-pack · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림은 하나씩 되돌린다) · 새 검사 (해석의 근거가 그래프에 있다 · 반증 기록 모양) + 망가뜨린 사본
- docs/development-pipeline.md 의 P-5 줄 · 커밋 접두사 `P-5` · 파일 지정 (`git commit -m … -- <파일들>`) · push (거절되면 `git pull --no-rebase`)
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 해석 수 · outcome 분포 · 빈 반증 · `_d5` · 비용 · _open · 꼭 볼 것
```

## P-4 · Coverage 점검 · 스토리라인 상태

### 서브에이전트 지시
```
너는 Claro 프로젝트의 작업 세션이다. Step P-4 를 맡는다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**). 시작 전에 `pnpm install`.

## 목표
10월 FOMC 사건(`FOMC-20261028`)의 사실 그래프(P-3b, 662)가 **기사를 쓰기에 충분한가**를 본다 — FINDINGS §7 스테이지 4 · 5.
- Coverage 점검: 이런 사건에 있어야 할 슬롯이 사실로 채워졌는가. 빈 슬롯은 **다시 모은다** (§7.2 — 반증 슬롯이 비면 재수집)
- 스토리라인 상태: 이 사건이 걸쳐 있는 진행 중 이야기(이란 전쟁 · 9월 인상에서 이어지는 연준의 경로)가 지금 어디에 와 있나 (§11 의 "스토리라인 stale" 오류)
해석 · 요점 · 글은 아직 아니다 (P-5 ~).

## 먼저 읽을 것
- CLAUDE.md · docs/FINDINGS.md §5 · §6 전부 · §7 · §7.1 · §7.2 · §9.2 · §10.1 · §11
- docs/DECISIONS.md D27 · D40 · D41 · D42 · **D43**
- docs/development-pipeline.md · logs/pipeline/P-2.md · P-3.md · P-3b.md 의 맨 앞
- docs/findings/fomc-2026-09-brief.md §3 (Coverage Schema 15 슬롯) · docs/findings/storyline-iran-war.md
- docs/contract/DATA_MODEL.md — Event · Storyline · StorylineVersion · SlotCheck (있으면) · Fact
- fixtures/store.json — 9월의 storylines · slot_checks 모양
- packages/pipeline · packages/pipeline/data/events/FOMC-20261028/

## 할 일
1. **슬롯 표** — 9월 15 슬롯을 출발점으로. 10월은 **동결 회의**다 — 이름이 맞지 않는 슬롯(예 "인상 논리")은 이 사건에 맞게 고친 안을 내고 근거를 적어라 (§6.2 "유형마다 새로 만든다"). 슬롯마다: 채운 사실 · 상태 (채움 / 일부 / 빔) · 무엇이 비었나
   - 사실을 슬롯에 붙이는 일에 모델을 써도 된다 (Opus · D42). 붙인 근거를 적게 하고, 사람이 볼 수 있는 표로
   - **Unslotted 탐색**: 슬롯에 안 들어가는데 이 사건에서 중요해 보이는 사실 묶음 (9월 브리프의 "중간선거 직전" 같은 것)
2. **빈 슬롯 다시 모으기** — 빈 슬롯마다 1차 자료를 찾는다. 특히:
   - **반대자 본인의 설명** (Hammack · Cook — P-2 의 빈 슬롯. 회의 뒤 성명 · 연설)
   - 기자회견 녹취 FINAL (P-2 는 PRELIMINARY 였다)
   - 9/16 ~ 10/28 의 물가 · 고용 1차 발표 가운데 아직 없는 것
   P-2 의 도구로 저장 → P-3b 의 방식으로 사실 추출 → 그래프에 더한다. 예절 (D40 · D41): 정직한 User-Agent · 막히면 우회하지 않는다 · 권리 미확인 전문은 git 밖
3. **스토리라인 상태** — 두 줄기:
   - 이란 전쟁 (`SL-iran-war`, 9월 골든이 v1 에 고정): 9/16 이후 10/28 까지 무엇이 바뀌었나. P-2 가 찾은 6월 백악관 "Iran Agreement" 발표도 1차로 연다. 9월 골든이 그것과 어긋나는지 (9월 글은 "4월에 미국이 휴전을 발표했지만"이다) — **9월 골든은 고치지 마라.** 어긋나면 적어라 (발행된 글은 고치지 않고 스토리라인에 붙인다 — §9.2)
   - 연준의 경로: 9월 인상 → 10월 동결. 9월 기사의 요점 DEEP-B ("긴 인상 사이클의 시작이 아니다 — 올해 한 번 더")와 10월 결과가 어떻게 이어지나 — **해석하지 말고** 사실만 나란히
   - 스토리라인의 새 판(v2)을 계약 모양으로 만들 수 있으면 만들고, 모양이 모자라면 _open
4. **사실 수가 많다 (662)** — 사람이 다 볼 수 없다 (P3b-g). 슬롯 표가 사람이 보는 면이 되게 하라 — 슬롯마다 대표 사실 몇 개와 나머지 수

## 비용 · 비밀
- 이 Step 상한 **8 달러**. 넘을 것 같으면 멈춘다. 키는 `packages/pipeline/.env.pipeline` — 값을 남기지 마라

## 하지 말 것
- 해석 · 반증 · 요점 · 집필 · 개념 문안 · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정 (모양이 모자라면 _open)
- 그래프를 손으로 고치기 · 우회 수집 · 보도로 1차를 대신하기
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/P-4.md` — 맨 앞에 ① 슬롯 표 (10월 이름 · 상태 · 대표 사실 · 빈 것) ② 다시 모은 것과 그 결과 ③ 스토리라인 두 줄기의 상태 (9월 골든과 어긋나는 것이 있나) ④ Unslotted ⑤ 비용 ⑥ _open
- 검사: 파이썬 전부 · verify-fact-graph · verify-source-pack · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림은 하나씩 되돌린다) · 새 검사가 생기면 망가뜨린 사본
- docs/development-pipeline.md 의 P-4 줄 · 커밋 접두사 `P-4` · 파일 지정 · push
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 슬롯 상태 · 다시 모은 결과 · 스토리라인 · 비용 · _open · 꼭 볼 것
```

## P-3b · 사실 추출 고쳐 다시

### 서브에이전트 지시
```
너는 Claro 프로젝트의 작업 세션이다. Step P-3b 를 맡는다 — P-3 (사실 추출)을 고쳐 다시 돈다. PM(나)이 검수하고 도윤에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main, **공개 저장소**)

## 왜
P-3 은 잘 됐다 — 지어낸 구절 0 · 짝지은 사실의 글 틀림 0 · 9월 골든 대비 Sonnet 74% / Opus 87%. 그러나 **구절 검사를 통과했는데 틀린 사실**이 들어갔다:
국채 표의 "10년" 값을 7년 칸에서 읽음 (Sonnet 10월 4/4) · 회의록의 "several" 을 "일부"로 옮김 (Sonnet 3 건). Opus 는 둘 다 0 이었다.
구절이 원문에 있다는 것은 **그 구절에서 이 글이 나온다**는 증명이 아니다. 독자는 사실 표시를 "원문 확인"으로 읽는다 (D27).
PM 판정은 docs/DECISIONS.md **D42** 에 있다 — 먼저 읽어라.

## 먼저 읽을 것
- CLAUDE.md · docs/DECISIONS.md D2 · D27 · D40 · D41 · **D42**
- docs/development-pipeline.md · logs/pipeline/P-3.md 전부 (네 앞 세션의 기록 — _open P3-a ~ l, 판단 J1 ~)
- packages/pipeline (P-3 의 코드) · packages/pipeline/data/events/FOMC-20261028/

## 할 일 (D42 대로)
1. **표 · 시계열은 코드가 읽는다** (BLS 처럼 — J1). 국채 금리 표 · EIA 유가 표 등 구조가 있는 문서는 모델에 보내지 않고 코드가 칸 이름과 값을 짝지어 사실로 만든다. 어느 문서가 표인지의 규칙은 코드 한 곳에. 모델은 글(성명문 · 기자회견 · 회의록 · 연설)만
2. **사실 추출 모델은 `claude-opus-5-5`** (D42 — D2 의 이 단계만 정함). 프롬프트 판을 올린다
3. **연준의 수량어를 그대로 옮긴다** — 회의록의 "a few · some · several · many · most · all · a majority …" 를 한국어로 옮길 때 서로 섞이지 않는 대응표를 프롬프트와 코드 검사 양쪽에. 검사: 사실 글의 수량어가 구절의 수량어와 대응표대로 맞는지 (맞지 않으면 실패)
4. **글이 구절보다 많이 말하지 않는다 (P3-c)** — 프롬프트에 "사실 글의 모든 내용이 그 구절 안에 있어야 한다". 숫자는 코드가 대조: 사실 글의 숫자 · 날짜가 구절에 있는가
5. **같은 사실 묶기 (P3-a)** — 성명문 · 기자회견 · 회의록 · 연설에 같은 결정 · 같은 발언이 따로 있다. 묶는 방법의 안을 내고 (모델이 후보를 내고 코드가 규칙으로 확정하든, 결정적 규칙을 넓히든), 10월 그래프에 적용. 묶은 것과 안 묶은 것의 표본을 로그에
6. **스토리라인 문서의 범위 (P3-h)** — "직전 회의 이후" 범위가 스토리라인 문서(이란 전쟁)를 버렸다. 스토리라인 문서는 그 스토리라인의 범위로
7. 10월 사건 다시 추출 + **9월 골든 비교 다시** (같은 표 — 찾음 · 놓침 · 더 뽑음 · 글 틀림 · 칸 틀림 · 수량어 틀림). P-3 숫자와 나란히
8. 분기 날짜 (P3-d · "2026-Q2") — 계약 TimePoint 에 없다. **계약을 고치지 마라** — 지금처럼 따로 두고 _open 그대로

## 비밀 · 비용
- 키: `packages/pipeline/.env.pipeline` — 값을 출력 · 로그 · 커밋에 남기지 마라
- **이 Step 비용 상한 12 달러.** 넘을 것 같으면 멈추고 돌아와라
- 권리 미확인 문서(지역 연은 연설 4)를 API 로 보내는 것은 D42 대로 된다 — 모델 출력과 구절 글은 git 밖 캐시에만 (P-3 처럼)

## 하지 말 것
- 해석 · 반증 · 요점 · 집필 (P-4 ~) · fixtures · 골든 · 라이브러리 · apps/web · packages/db · 계약 수정
- 그래프를 손으로 고치기 — 틀린 것은 코드 · 프롬프트를 고쳐 다시 돌려서 고친다
- `pnpm install` 이 lockfile 을 바꾸면 그 까닭을 로그에 (P3-k)
판단이 필요하면 _open 으로 적고 그 부분만 멈춘다.

## 끝낼 때
- 로그 `logs/pipeline/P-3b.md` — 맨 앞에 ① P-3 ↔ P-3b 비교 표 (10월 · 9월) ② 칸 틀림 · 수량어 틀림 · 글이 구절보다 많음이 0 인가 ③ 묶기 결과 ④ 비용 ⑤ _open
- 검사: 파이썬 전부 · verify-fact-graph (새 검사 셋 — 칸 · 수량어 · 숫자) + 망가뜨린 사본 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 되돌린다)
- docs/development-pipeline.md 의 P-3 줄
- 커밋 접두사 `P-3b` · 파일 지정 · push (거절되면 `git pull --no-rebase`)
- **나(PM)에게**: 25줄 안쪽 한국어 요약 — 커밋 · 비교 숫자 · 비용 · _open · 꼭 볼 것
```

## P-3 · 사실 추출 → Deep Fact Graph 초안

### 서브에이전트 지시
```
너는 Claro 프로젝트의 작업 세션이다. Step P-3 을 맡는다. PM(나)이 결과를 검수하고 도윤(사람)에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main 브랜치, **공개 저장소**다)

## 목표
10월 FOMC 사건(`FOMC-20261028`)의 저장된 1차 자료에서 **사실을 뽑아 Deep Fact Graph 초안**을 만든다 (FINDINGS §7 스테이지 2 · 3).
파이프라인에서 처음으로 Claude API 를 부른다. 초안이다 — 사람이 게이트에서 본다 (§10.1 "초안을 만들게 하고 게이트에 사람이 선다").
같이: BLS 수치를 공식 API 로 받는다 (도윤 결정 D41).

## 먼저 읽을 것 (이것만)
- CLAUDE.md — "절대 하지 말 것" · "같은 작업 트리" (커밋은 `git commit -m … -- <파일들>`. stash · autostash · 폴더 단위 checkout 금지)
- docs/FINDINGS.md §3.2 · §5 전부 · §7 · §7.1 · §7.6 · §10.1 · §10.4 · §11
- docs/DECISIONS.md — D2 (모델 배치 · OPEN) · D27 · D28 · D33 · D39 · D40 · **D41 (BLS 는 공식 API v1 — 끝의 "도윤 선택")**
- docs/development-pipeline.md 전부
- logs/pipeline/P-1.md · P-2.md 의 맨 앞
- docs/contract/DATA_MODEL.md — Fact · FactSource · Source · SourceDocument 타입, §3 (fact_type 7값 · actor · OFFICIAL_CLAIM), §4, volatility (D8)
- fixtures/store.json — 9월 사건의 사실 60 개가 어떤 모양 · 어떤 잘게 나눔인지의 본보기 (손으로 만들고 1차 대조를 거친 것)
- packages/pipeline · packages/pipeline/data/events/FOMC-20261028/

## 할 일
1. **BLS** — 공식 API v1 (등록 · 키 없이). 정직한 User-Agent ("Claro pipeline" — 개인 정보 넣지 마라) · 하루 25회 안. 이 사건에 필요한 수치만 (9월 고용 · 실업률 · CPI · 근원 CPI 등 — 9월 브리프의 슬롯을 보고 고른다).
   받은 응답을 Source · SourceDocument 로 저장 (해시 · 가져온 때 · 주소). BLS 는 연방 정부 — git 에 둬도 된다 (D40)
2. **사실 추출** — 저장된 원문마다 Claude 에게 사실 후보를 뽑게 한다. 단계는 JSON 을 받고 JSON 을 낸다 (§3.2). 계약의 Fact · FactSource 모양으로.
   - **모든 사실은 원문 구절을 글자 그대로 달고, 그 구절의 위치는 코드가 원문에서 찾는다** (P-1 의 맞추기 규칙). 모델이 낸 구절이 원문에 없으면 그 사실은 버리지 말고 "구절 없음"으로 따로 모은다 — 지어낸 구절이 들어가면 안 된다
   - fact_type · actor · event_at · as_of · volatility 를 계약대로. "누가 그렇게 말했다"(OFFICIAL_CLAIM)와 "일어난 일"을 가른다 (§5.2)
   - 해석 · 인과 · 평가는 사실이 아니다 — 뽑지 마라 (DATA_MODEL §3.3)
   - 여러 문서가 같은 사실을 말하면 하나로 묶고 출처를 여럿 단다 (N:M · §5.3). 묶는 규칙은 코드에
   - 9월 사건처럼 사건당 20 ~ 30 개 이상을 목표로 하되 숫자를 채우려고 만들지 마라 (§7.1)
3. **얼마나 잘 뽑는가 — 정답이 있는 데서 잰다.** 9월 사건(FOMC-20260916)의 저장된 원문(P-1)에 같은 추출을 돌려 손으로 만든 사실 60 개와 견줘라:
   찾은 것 · 놓친 것 · 골든에 없는데 뽑은 것 · 글이 틀린 것. 놓친 것은 "원문이 저장 안 돼서"와 "저장됐는데 놓쳐서"를 갈라라. 이것이 이 단계를 믿을 수 있는지의 근거다
4. **모델 · 비용 기록 (D2 는 OPEN — 정하지 마라. 잰다)** — 호출마다 모델 · 입력 · 출력 토큰 · 걸린 시간 · 대략 비용을 기록. 기본은 `claude-sonnet-5-5`. 9월 비교에서 `claude-opus-5-5` 를 일부 문서에만 같이 돌려 차이를 보는 것은 해도 된다.
   **이 Step 전체 비용 상한 15 달러.** 넘을 것 같으면 멈추고 돌아와라. Claude API 코드는 `claude-api` 스킬을 먼저 불러 지금의 SDK 사용법을 따른다
5. 다시 돌리면 같은 입력에 대해 같은 결과가 나오는가 — 모델은 같지 않을 수 있다. 그래서 **모델의 출력을 저장하고, 그 뒤의 단계(위치 찾기 · 묶기 · 검사)는 저장한 출력에서 결정적으로** 돌게 하라

## 비밀 값
- API 키는 `packages/pipeline/.env.pipeline` 의 `ANTHROPIC_API_KEY` (도윤이 넣었다 · git 무시 확인됨). **값을 출력 · 로그 · 커밋 · 오류 메시지에 남기지 마라.** 요청 · 응답을 기록할 때 헤더를 빼라
- 키가 없거나 거절되면 멈추고 돌아와라

## 하지 말 것
- 해석(DerivedClaim) · 반증 · 요점 · 집필 · 개념 문안 (P-4 ~ P-7)
- fixtures/ · 골든 · 개념 라이브러리 · apps/web · packages/db · 계약 타입 수정 (칸이 모자라면 _open)
- 새 문서 수집 (P-2 의 팩 + BLS API 만) · 웹 페이지 우회 수집
- 모델 배치를 정하기 (D2 OPEN) · CLAUDE.md 금지 항목
판단이 필요하면 스스로 정하지 말고 로그에 _open 으로 적고 그 부분만 멈춘다. 나머지는 계속한다.

## 끝낼 때
- 로그 `logs/pipeline/P-3.md` — 맨 앞에 ① 10월 사건: 뽑은 사실 수 · 구절 확인됨 / 구절 없음 · 출처별 ② **9월 비교 표 (찾음 · 놓침 · 더 뽑음 · 글이 틀림)** ③ 비용 · 토큰 · 모델 ④ BLS ⑤ _open. 그다음 방법 · 프롬프트 (그대로) · 검사 출력
- 검사: 파이썬 검사 전부 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 되돌린다) · 새 검사 (구절이 원문에 있다 · 사실 모양이 계약대로) + 망가뜨린 사본
- docs/development-pipeline.md 의 P-3 줄 상태
- 커밋 접두사 `P-3` · 파일 지정 · push (거절되면 `git pull --no-rebase`)
- **나(PM)에게 돌려줄 것**: 25줄 안쪽 한국어 요약 — 커밋 · 숫자 · 9월 비교의 요점 · 비용 · _open · 내가 꼭 봐야 할 것
```

## P-2 · 10월 FOMC 소스 팩

### 서브에이전트 지시
```
너는 Claro 프로젝트의 작업 세션이다. Step P-2 를 맡는다. PM(나)이 결과를 검수하고 도윤(사람)에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main 브랜치, **공개 저장소**다)

## 목표
파이프라인이 처음으로 **새 사건**을 다룬다. 도윤이 게이트 1(사건 선정)에서 **2026년 10월 FOMC 회의 (10/27 ~ 28)** 를 골랐다.
이번 Step 은 그 사건의 **소스 팩**을 만드는 것이다 — 기사에 필요한 1차 자료를 찾아 목록으로 만들고, 가져와 저장한다 (FINDINGS §7 스테이지 0 · 1).
사실을 뽑지 않는다 (P-3). 해석 · 요점 · 글을 쓰지 않는다. LLM 을 파이프라인 코드 안에서 부르지 않는다.

## 먼저 읽을 것 (이것만)
- CLAUDE.md — "절대 하지 말 것" · "같은 작업 트리" (커밋은 `git commit -m … -- <파일들>`. stash · autostash · 폴더 단위 checkout 금지)
- docs/FINDINGS.md §5 전부 · §6.2 · §7 · §7.1 · §7.2 · §10.2 (게이트 1) · §10.4
- docs/DECISIONS.md — D27 · D28 · D39 · **D40 (자동 수집의 예절 · BLS)**
- docs/development-pipeline.md 전부
- logs/pipeline/P-1.md 맨 앞 (요약 · _open) — 같은 도구를 쓴다
- docs/findings/fomc-2026-09-brief.md — 9월 사건의 Source Pack · Coverage Schema (슬롯 15). 같은 유형이다 — 무엇이 필요했는지의 본보기
- logs/content/source-check-2026-10.md 의 문서 목록 — 9월에 실제로 쓴 1차 문서들의 종류
- docs/contract/DATA_MODEL.md — Event · Source · SourceDocument · SourceRegistry · Storyline 타입
- packages/pipeline (P-1 의 코드)

## 할 일
1. **사건이 실제로 일어났는지부터.** 연준의 10/28 성명문을 가져와 무엇을 결정했는지 한 줄로 (원문 구절과 함께). 성명문을 못 가져오면 멈추고 돌아와라
2. **소스 팩 목록** — 9월 브리프의 Coverage 슬롯과 C-3 의 문서 종류를 본보기로, 10월 사건에 필요한 1차 문서를 찾는다:
   - 그 회의의 것: 성명문 · 시행 노트 · 기자회견 (녹취가 나왔으면) · 표결
   - 그 사이의 것: 9월 회의록 (10/7) · 9/16 ~ 10/28 사이에 나온 물가 · 고용 지표의 1차 발표 · 의장 · 위원의 공개 발언 가운데 정책을 말한 것
   - 이어지는 이야기: 9월 기사(골든)가 걸쳐 있던 이란 전쟁 스토리라인(`docs/findings/storyline-iran-war.md`)의 그 뒤 — 1차 문서만
   - 각 항목: 무엇 · 누가 냈나 · 날짜 · 주소 · 왜 필요한가 (어느 슬롯) · 1차인가. **목록을 넓게 잡되 지어내지 마라** — 주소를 실제로 확인한 것만. 못 찾은 슬롯은 "빈 슬롯"으로
   - 문서를 찾는 데는 웹 검색을 써도 된다. 그러나 **기사 · 블로그는 문서를 찾는 길잡이일 뿐 출처가 아니다** (D27)
3. **가져와 저장** — P-1 의 도구로 (필요하면 넓혀라: 사건 하나 = 목록 하나를 받아 도는 모양). 사건마다 폴더 하나. 자리는 네가 안을 낸다
   - 해시 · 가져온 때 · 가져온 주소. 다시 돌려 같은 해시
   - **자동 수집의 예절 (D40)**: 정직한 User-Agent 만 · 막히면 우회하지 않고 "못 가져옴" · 권리가 확인되지 않은 전문은 git 에 넣지 않는다 (공개 저장소)
4. **BLS** — 공식 데이터 API 가 있는지, 등록 · 키 · 연락처 없이 쓸 수 있는지 BLS 자신의 문서로 확인하라. 쓸 수 있으면 이 사건에 필요한 수치(9월 고용 · 9월 CPI 등)를 그 길로 받는다. 이메일 · 연락처가 꼭 필요하면 **쓰지 말고 멈춰서 그 사실만 적어라** — 도윤이 정한다 (D40)
5. Event 한 줄 (계약 모양 — UUID + code, 예 "FOMC-20261028") 과 소스 팩의 Source 들을 계약 모양으로. 골든(fixtures/)에는 넣지 마라 — 새 사건의 자리에

## 하지 말 것
- 사실 추출 · 해석 · 요점 · 집필 · 개념 문안 (P-3 ~ P-7)
- fixtures/ · 골든 · 개념 라이브러리 · apps/web · packages/db · 계약 타입 수정 (칸이 모자라면 _open)
- 우회 수집 (브라우저인 척 · 막힌 곳 다시 두드리기) · 보도로 1차를 대신하기
- CLAUDE.md 금지 항목
판단이 필요하면 스스로 정하지 말고 로그에 _open 으로 적고 그 부분만 멈춘다. 나머지는 계속한다.

## 끝낼 때
- 로그 `logs/pipeline/P-2.md` — 맨 앞에 ① 사건이 무엇이었나 (한 줄 + 성명문 구절) ② 소스 팩 표 (저장 · 못 가져옴 · 빈 슬롯) ③ BLS 결과 ④ _open. 그다음 방법 · 검사 출력
- 검사: P-1 의 다시 돌리기(`--check`)가 새 사건에도 같은 해시 · 파이썬 검사 전부 · `pnpm -s typecheck` · `pnpm -s test` (logs/frontend 그림이 다시 찍히면 그 파일만 하나씩 되돌린다)
- docs/development-pipeline.md 의 P-2 줄 상태
- 커밋 접두사 `P-2` · 파일 지정 · push (거절되면 `git pull --no-rebase`)
- **나(PM)에게 돌려줄 것**: 25줄 안쪽 한국어 요약 — 커밋 · 사건 한 줄 · 숫자 · BLS · _open · 내가 꼭 봐야 할 것
```

## P-1 · 원문 저장 · 해시 · span

### 서브에이전트 지시 (PM 이 보낸 것)
`logs/pipeline/P-1.md` 머리에 그대로 옮겨 둔다.

```
너는 Claro 프로젝트의 작업 세션이다. Step P-1 을 맡는다. PM(나)이 결과를 검수하고 도윤(사람)에게 보고한다.
작업 폴더: /Users/hadohadopapi/Desktop/claro (git 저장소, main 브랜치, **공개 저장소**다)

## 목표
파이프라인의 첫 일감 (FINDINGS §10.4 자동화 1순위: "소스 수집 · 저장 · 해시 · span 매핑 — 지루함, 오류 없음").
FOMC 골든의 출처를 실제로 저장하고, 사실마다 적힌 1차 구절이 그 원문의 **몇 번째 글자부터 몇 번째까지인지**를 기계가 찾는다.
지금은 구절만 있고 위치가 없다 — `python3 scripts/verify-data-model.py --report` 의 "기계 검증용 55" (FACT_NO_SOURCE_SPAN 49 · FACT_PUBLIC_UNPROVEN 4 · QUOTE_SPAN_MISSING 2) 가 그것이다.
LLM 은 쓰지 않는다. 결정적인 코드다.

## 먼저 읽을 것 (이것만)
- CLAUDE.md — 특히 "절대 하지 말 것" · "같은 작업 트리" (커밋은 `git commit -m … -- <파일들>`, stash · autostash · 폴더 단위 checkout 금지)
- docs/FINDINGS.md §3.2 · §5 전부 · §10.4
- docs/DECISIONS.md — D1 (끝의 "백엔드 스택"), D27, D28, D33, D39
- docs/contract/DATA_MODEL.md — §1 의 Source · SourceDocument · SourceRegistry · FactSource 타입, §4, 불변식 (특히 8번 근처 "원문 위치"), §18 · §19
- docs/development-pipeline.md
- fixtures/store.json — sources (31) · fact_sources (90, `_passage` 69 개) · source_documents · source_registry (지금 비어 있다)
- logs/content/source-check-2026-10.md — C-3 · C-3b 가 각 문서를 어떻게 열었는지 (직접 열었나 · 어느 판 · PDF 인가)
- scripts/verify-data-model.py — 지금 무엇을 막는지

## 할 일
1. **원문을 가져와 저장한다** — store.json 의 Source 31 개. 코드는 TypeScript, 모노레포의 새 패키지 `packages/pipeline` (D1). 실행은 명령 하나.
   - 문서마다: 가져온 때 · 가져온 주소(리다이렉트 뒤) · 원문에서 뽑은 글(text) · 그 글의 해시(sha256). 뽑는 방법(HTML → 글, PDF → 글, 공백 정리)을 코드 한 곳에 두고 로그에 적는다. 같은 입력이면 같은 글 · 같은 해시가 나와야 한다
   - 살아 있는 페이지(달력 · 금리 표 · EIA 시리즈 등)는 9월과 지금 내용이 다를 수 있다. 다르면 다르다고 적는다 — 고치지 않는다
   - 못 가져온 것(막힘 · 없어짐 · 로그인)은 "못 가져옴"과 까닭. 보도로 대신하지 않는다
2. **저장소가 공개다 — 권리가 확인되지 않은 남의 글 전문을 git 에 넣지 마라.**
   - 미국 연방 정부의 저작물(federalreserve.gov · bls.gov · bea.gov · treasury.gov · eia.gov · whitehouse.gov 등)은 17 U.S.C. §105 로 저작권이 없다 — 전문을 저장소에 둬도 된다. 그 근거를 SourceRegistry 에 적는다
   - 그 밖(CME 등 민간)은 권리 **미확인**으로 두고 전문을 git 밖(gitignore 된 캐시)에만. git 에는 서지 · 해시 · span 만. 그러면 검사가 그 글을 어떻게 보나 — 안을 내라
   - 법적 판단을 더 하지 마라. 위 둘로 못 가르면 "미확인"
3. **구절의 위치를 찾는다** — FactSource 마다 `_passage` 가 그 Source 의 글 안 어디에 있는지 → `span_start` · `span_end` 를 store.json 에 채운다.
   - 맞추는 규칙(공백 · 따옴표 모양 · 줄바꿈)은 한 곳에. **느슨하게 맞추지 마라** — 글자가 다르면 "못 찾음"이다. 여러 곳이면 "여럿"으로 두고 위치를 고르지 않는다
   - 구절을 고치지 마라. 못 찾은 것은 표로 (Source · 구절 · 까닭 추정)
   - 인용 블록 2 (QUOTE_SPAN_MISSING) 도 같은 방식
4. **공개 시점** — FACT_PUBLIC_UNPROVEN 4 (살아 있는 페이지 · 날짜 없는 글). 저장한 원문에서 공개 시각을 증명할 수 있으면 채우고, 없으면 "증명 못 함" 그대로. 지어내지 마라
5. **검사** — `verify-data-model.py` 가 span 을 원문과 대는 검사를 갖게 (span 의 글 = `_passage`, 해시가 저장한 글과 같다). 망가뜨린 사본 (span 한 글자 밀기 · 해시 바꾸기 · 없는 Source) 이 실패해야 한다
6. 다시 돌렸을 때 같은 결과가 나오는지 (같은 해시 · 같은 span). 살아 있는 페이지는 예외 — 예외임을 표시

## 하지 말 것
- 독자 글 · 골든 패키지(fomc-2026-09.article.json) · 개념 라이브러리 · 사실의 글(claim_text) · 구절(`_passage`) 수정
- 계약의 타입을 바꾸는 것. 칸이 모자라면 멈추고 로그에 _open 으로
- LLM 호출 · 새 사실 조사 · 다른 사건
- apps/web · packages/db 수정. Supabase · 배포 건드리기
- CLAUDE.md 금지 항목 (가중치 · 임계값 · 추정기 …)
판단이 필요하면 스스로 정하지 말고 로그에 _open 으로 적고 그 부분만 멈춘다. 나머지는 계속한다.

## 끝낼 때
- 로그: `logs/pipeline/P-1.md` — 맨 앞에 ① 결과 요약 (저장 · 못 가져옴 · span 찾음 · 못 찾음 · 여럿 의 수) ② _open ③ 못 찾은 구절 표. 그다음 방법 · 검사 출력(잘라내지 말고)
- 검사 전부 돌려 결과를 로그에: `python3 scripts/` 의 verify-* · selftest-* · compare-* (lint-concepts 의 exit 1 · 1 hit 는 알려진 오탐) · `pnpm -s typecheck` · `pnpm -s test`. pnpm test 가 logs/frontend 의 그림을 다시 찍으면 그 파일만 하나씩 `git checkout -- <파일>` 로 되돌린다
- `python3 scripts/verify-data-model.py --report` 의 "기계 검증용"이 몇 건 남았는지 (전 55)
- docs/development-pipeline.md 의 P-1 줄 상태를 고친다
- 커밋: 접두사 `P-1` · 파일을 하나씩 지정 (`git commit -m … -- <파일들>`) · push (거절되면 `git pull --no-rebase`)
- **나(PM)에게 돌려줄 것**: 25줄 안쪽의 한국어 요약 — 커밋 해시 · 숫자 · _open · 내가 꼭 봐야 할 것. 자세한 것은 로그에 있으니 반복하지 마라
```
