# development · pipeline

파이프라인 A (FINDINGS §3.1 · §7) — 사건마다 기사 한 판을 만드는 반자동 도구. 서버가 아니라 사람이 돌린다 (D1).
**작업은 PM 이 서브에이전트에게 지시하고, 서브에이전트가 로그를 쓰고, PM 이 확인한 뒤 도윤에게 보고한다** (D39).

## 현재 위치
**Phase 1 시작 (2026-10-30 · D39).** P-1 끝 — PM 검수 대기 (`logs/pipeline/P-1.md` 의 _open).

## 원칙 (FINDINGS 확정에서)
- **완전 자동화는 불가능하다. 초안을 만들고 게이트에 사람이 선다** (§10.1). 각 스테이지의 기준은 "모든 오류를 막는가"가 아니라 **"편집 시간을 줄이는가"**
- **제일 지루하고 제일 안 틀리는 것부터** (§10.4): 소스 수집 · 저장 · 해시 · span → Coverage 슬롯 → Deep Fact Graph 초안 → Derived Claim · 반증 후보 → Goal 후보 → 집필. **집필이 마지막이다**
- 각 단계는 정해진 JSON 만 받고 JSON 만 낸다. 실패하면 그 단계만 다시. LLM 이 이전 결과를 임의로 고치지 못한다 (§3.2)
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
| P-3 | 사실 추출 + span → Deep Fact Graph 초안 (+ BLS API · 9월 골든으로 추출 품질 재기) | 2 · 3 | 있음 | ☑ 2026-11-10 — PM 검수 대기 (`logs/pipeline/P-3.md` · 10월 사실 332 = 모델 299 + BLS 33 · 구절 없음 0 · 모양 틀림 10 · 9월 비교 저장된 골든 47 중 찾음+일부 Sonnet 35 · Opus 41 · 국채 표 칸 오류 · 비용 $4.77 · _open P3-a ~ l) |
| P-4 | Coverage 슬롯 점검 · 스토리라인 상태 | 4 · 5 | 있음 | ☐ |
| P-5 | Derived Claim + 반증 후보 (빈 슬롯은 재수집) | 6 | 있음 | ☐ |
| P-6 | 요점(Goal) 후보 → 게이트 2 (도윤) | 7 | 있음 | ☐ |
| P-7 | KC 역산 · 사실 선택 · 집필 · 레드팀 · 블록 분할 → 계약 패키지 → 검사 → 게이트 3 | 8 ~ 13 | 있음 | ☐ |
| — | 그 기사로 F-3 (D37 구조) | | | ☐ |

**도윤이 준비할 것 (P-3 전)**: Claude API 키 — 비밀 값이다. 채팅에 붙이지 않고 `apps/web/.env.deploy` 처럼 git 밖 파일에. 사용 한도를 걸어 둔다.

---

## 잔일 (급하지 않다)
- P1-a · m6: SourceDocument 에 해시 · 가져온 주소 · 가져온 때 · 받은 판 (계약 — 다음 백엔드 손질 때)
- P1-h: 못 찾은 구절 17 을 저장한 원문에서 글자 그대로 다시 적기 (콘텐츠 · 교정 기록)
- `p1 --check` 가 못 가져온 문서를 다시 요청한다 — P-2 방식으로 맞춘다 (D41)
- 남은 기계 검증용 26: 못 가져온 문서(BLS 7 · CENTCOM 3 · CME 2 …)에만 기댄 사실 13 + 표기 때문에 못 찾은 10

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
