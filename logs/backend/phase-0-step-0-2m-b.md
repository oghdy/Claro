# logs/backend · Phase 0 / Step 0.2m-b — 교정 기록 이전 · OBSERVATION 을 D26 에 맞춘다

## B-0.2m-b · 2026-10-09 · **[GATE]**

### _open 5개 — 게이트에서 정할 것 (계약 §16)

| # | 물음 | 실물이 말하는 것 | 추천 | 계약의 뜻이 바뀌나 |
|---|---|---|---|---|
| **6** | 마지막으로 닿은 장을 끝까지 읽었는지를 남기나 | D26 으로 "다음 장에 들어감 = 앞 장을 끝냄". 남는 것은 마지막 장(요점 문장)과 멈춘 장. B5 는 장마다 그 순간을 이미 판정한다 (`check` → `data-ready` — 물음 버튼을 내보내는 판정) | (a) 읽기 사건 하나를 더해 **장마다** "이 장의 끝이 나왔다"를 남긴다 | **바뀐다** — `ReadingEvent.type` 에 값이 하나 는다. 그래서 타입은 안 고쳤다 |
| **7** | 새로고침이 새 열람인가 | 답 없음 — 본 화면도 B5 도 저장하는 코드가 없다 (`localStorage` · `sessionStorage` · 쿠키 0건) | (a) 화면을 따른다 — 자리를 되살리면 같은 열람, 1장부터면 새 열람 | 안 바뀐다. 열람의 뜻을 한 줄 더 적는다 |
| **8** | 시험 · 개발 중의 줄을 어떻게 가르나 | 답 없음 — `/` · `/lab/*` · `/test/*` 를 가르는 것은 경로뿐 (`process.env` 0건) | (a) 줄에 표시를 두지 않고 섞이지 않게 — 시험 경로는 기록하지 않고, 실제 독자는 배정표(D31)의 `user_id` 로 가른다 | 안 바뀐다 |
| **9** | 옮긴 교정 기록을 어디에 어떤 파일로 | CSV 한 칸에 목록이 안 들어간다 | (a) `logs/correction-log.jsonl` — 지금 옮겨 둔 자리. 판정되면 CSV 를 얼리고 새 교정은 jsonl 에 | 안 바뀐다. development-content "correction_log" 절을 고쳐야 한다 (콘텐츠 레인 문서 — 안 고쳤다) |
| **10** | 이름 있는 사람 검사(반증 검사 · D15 선형 읽기 점검 · 1차 원문 대조)를 어디에 적나 | 28행 가운데 10행이 "반증 검사 + 1차 원문 대조", 3행이 "D15 선형 읽기 점검". `check` 는 기계 검사에만 쓸 수 있다(불변식 20) | (a) `check` 를 기계 검사에 묶지 않는다 — "잡은 절차의 이름" | **바뀐다** — 불변식 20. 그래서 안 고쳤다. 초안 대응은 지금 어휘 안에서 했다 |

### 게이트에서 먼저 볼 것
1. **_open-6 이 F-3 에 가장 가깝다.** 지금 계약대로면 결론(요점 문장)이 있는 마지막 장을 **읽은 독자와 열자마자 떠난 독자가 같다.** F-3 의 물음은 그 요점을 묻는다.
   화면은 그 순간을 이미 알고 있으니 남기는 비용이 작다. F-2b 가 본 화면으로 옮길 때 같이 넣어야 한다
2. **`caught_by` 초안 대응 가운데 10행은 내가 고른 것이다 (_open-10).** "반증 검사 + 1차 원문 대조"를 `SOURCE_RECHECK` 로 두었다 — 반증 검사가 여섯 값에 없어서다.
   D29 는 그 가운데 넷을 "잡은 것은 건너뛰었던 반증 검사"라 했다. `SOURCE_RECHECK` 25 가운데 **1차 원문 대조만으로 잡은 것은 15** 다
3. **`type_note` 를 옮기지 않았다.** 계약 §15-7 은 "유형: …" 문단을 `what_i_changed` 에서 떼어 옮기라고 했는데, 지시는 글을 한 글자도 바꾸지 말라고 했다. 글을 지켰다 — 6행의 문단은 `what_i_changed` 안에 그대로 있고 `type_note` 는 전부 null
4. **CSV 와 jsonl 이 둘 다 있는 동안은 원본이 CSV 다.** 새 교정은 CSV 에 덧붙이고(지금 규칙 그대로) 검사가 "아직 안 옮긴 행"을 WARN 으로 센다. _open-9 가 정해지면 하나로 줄인다
5. `time_spent_min` — 42행 전부 비었다. D30 이 "지금부터 적는다"고 한 뒤의 28행도 비었다

### 1. 계약을 실물에 맞추고, 행이 늘어도 안 깨지게

**고른 안 — 날짜 붙은 기록으로 두되, 그 기록이 가리키는 행만 견준다.** 계약의 뜻은 안 바뀐다.

- 계약 §8 의 수는 "계약 모양이 어디서 나왔나"의 근거다. 버리면 근거가 사라지고, 살아 있는 집계로 두면 행이 늘 때마다 깨진다
- **교정 기록은 덧붙이기만 한다** (계약 §1). 그래서 "1~14행의 집계"는 영원히 참이다. 표 머리에 **"1~N행"**을 적고, 검사는 **CSV 의 첫 N행만** 센다
- 지금 전체의 집계는 계약에 적지 않는다 — `--report` 가 실물에서 센다
- 덤: 이 방식은 "옛 행이 바뀌거나 사라졌다"를 잡는다. 전에는 못 잡던 것이다 (망가뜨린 사본 4개)

| 다른 안 | 왜 안 골랐나 |
|---|---|
| 검사에서 뺀다 | 0.2c 에서 이 검사가 초안의 틀린 수 넷을 잡았다. 빼면 계약이 실물이라고 적은 수를 아무도 안 본다 |
| 전부 실물에서 계산 (계약에 수를 안 적는다) | "stage 한 열에 세 가지가 섞였다"는 수와 함께 있어야 근거가 된다 |

- §8.1 · §8.2 = 1~14행 (초안이 본 것). §8.3 의 발견 칸 표 = 1~42행 (이번에 옮긴 것 — `SOURCE_RECHECK` 의 첫 실물이 여기 있다)
- CSV 에 행이 늘면: **통과 + WARN** (`MIGRATION_BEHIND`). CSV 가 줄거나 옮긴 행의 글자가 바뀌면: FAIL

### 2. `correction-log.csv` → `logs/correction-log.jsonl` — 42행

| 칸 | 옮긴 방식 |
|---|---|
| `what_was_wrong` · `what_i_changed` · `catch_note`(← `source_of_catch`) · `date` · `error_type` · `event_code`(← `event_id`) | 글자 그대로. 검사가 CSV 와 글자 단위로 견준다 (`MIGRATION_TEXT`) |
| `correction_id` | UUID 42개 발급 |
| `gate` · `occasion` · `stage` · `targets` · `caught_by` · `check` | **초안 — 사람이 확인한다.** 행마다 `_draft` 에 칸 이름. 검사 WARN `CORR_DRAFT` 42 |
| `type_note` | 전부 null (위 3) |
| `replacements` | CONCEPT_VERSION 6건. `old_id` · `new_id` 는 **대기** — Concept UUID 는 0.2m-a 가 발급한다. `_pending` 에 code. 검사 WARN `REPL_PENDING` 6 |
| `after_publication` · `time_spent_min` | 전부 false · 전부 null |

**초안 대응 (42행)**

| | 1~14행 (0.2c 초안 그대로) | 15~32행 C-5 (18) | 33~42행 C-5 2차 (10) | 합 |
|---|---|---|---|---|
| `SOURCE_RECHECK` | 0 | 18 (1차 원문 대조만 13 · 반증 검사와 같이 5) | 7 (1차 원문 대조만 2 · 반증 검사와 같이 5) | **25** |
| `ARTIFACT_COMPARE` | 7 | 0 | 3 (D15 선형 읽기 점검) | 10 |
| `AUTOMATED_CHECK` | 4 | 0 | 0 | 4 |
| `PLAIN_READING` | 3 | 0 | 0 | 3 |

- `gate` — 15~42행은 전부 null, `occasion` 은 "C-5 게이트 (D29)" 18 · "C-5 2차 게이트 (D29)" 10. `stage` 열의 "게이트(C-5 · D29)"는 편집 게이트 넷 가운데 어느 것인지 말하지 않는다 — 게이트 3(최종 검토)에 가깝지만 정하지 않았다
- `targets` — 15~42행은 전부 ARTICLE (골든의 글 · 주석을 고쳤다). `where` 는 `what_was_wrong` 의 머리("입문 8장 키커" · "숙련 3장 타임라인" · "입문 6장 뒤 질문")에서. 32행만 "저작 데이터 (F31 as_of)"
- FACT target 은 여전히 0 이다. C-3 이 브리프의 사실을 고친 것은 CSV 에 행으로 없다
- 유형 — 42행: 원문 불일치 14 · 레이어 혼입 9 · 압축 7 · 팩트 누락 5 · 오독 미방어 3 · 축약 변질 3 · 시점 앵커 누락 1. "원문 불일치"와 "팩트 누락"의 첫 실물

### 3. D26 위에서 다시 본 것

| 물음 | 답 | 계약 |
|---|---|---|
| 장 안에서 끝까지 읽었는지 — 남는 것은 무엇인가 | 다음 장의 `SLIDE_ENTERED` 가 앞 장을 끝냈다는 기록이 된다. **남는 것은 "마지막으로 닿은 장"이다** — 마지막 장(물음 버튼이 없다. 요점 문장이 거기 있다)과, 읽다 멈춘 장. B5 는 그 순간을 이미 판정한다 | §5.4 다시 씀 · §12 · **_open-6** |
| 새로고침이 새 열람인가 | 실물이 답을 주지 않는다 | §12 · **_open-7** |
| 시험 줄 가르기 | 실물이 답을 주지 않는다 | §12 · **_open-8** |
| 읽기 사건이 여전히 방향 · 손짓을 모르나 | **모른다.** B5 에서 지금 장이 바뀌는 길 넷(`ask` · `jump` · 다시 보기 / 왼쪽 화살표 · 레벨 전환)이 전부 `SLIDE_ENTERED` 다. 타입 · 불변식 불변. 검사 A 의 방향 낱말 검사 그대로 통과 | §5.1 표 |
| "지나온 길"로 되돌아가는 것이 지금 사건으로 적히나 | **적힌다.** `jump(k)` → `slide_index` k 의 `SLIDE_ENTERED`. 되돌아갔다는 것은 `seq` 순서에서 나온다. 시험 원장이 이미 그 모양을 갖는다 (입문 4장 → … → 입문 4장) | §5.1 |
| 지나온 길을 **펼쳐 본 것** · 층 켜기 · 문장 누르기 | 지금 장을 안 바꾼다 — 사건이 아니다. 남길지는 미확인 | §13 |
| 레벨 전환 | 본 화면(F-1)은 떠났던 장으로, B5 는 언제나 1장으로. F-2b 가 정한다. 사건 모양은 같다 | §5.3 |
| D18 | 전제가 바뀌었다는 것만 적었다 — 질문은 슬라이드가 아니라 버튼이고, 누른 뒤 다음 화면의 머리다. 자리는 설계하지 않았다 | §6 |

숫자(시간 · 기준값)를 넣지 않았다. B5 의 판정이 쓰는 값들(화면 안에 얼마나 들어왔나 · 기다리는 시간)은 계약에 옮기지 않았다 — "끝이 나왔다"는 화면의 판정을 가리킬 뿐이다.

### 산출

| 파일 | 내용 |
|---|---|
| `docs/contract/OBSERVATION.md` | CHANGELOG · 머리말 · §0 · §5.1 · §5.3 · §5.4 · §6 (D18 전제) · §8 (1~N행) · §12 표 · §13 · §15 (옮겼다) · **§16 _open 5** · 타입 블록 주석의 낡은 수. **타입 · 불변식은 안 바뀌었다** |
| `logs/correction-log.jsonl` | 새 파일. 42줄. 자리 · 형식은 _open-9 |
| `scripts/verify-observation.py` | 옮긴 파일을 읽는다(스크립트 안의 대응표를 없앴다) · CSV ↔ jsonl 글자 대조 · "1~N행" 집계 · WARN · 골든의 개념 참조가 객체가 되어도 읽는다 (0.2m-a 대비) |
| `scripts/selftest-verify-observation.py` | 사본 78 → 87 |
| `logs/backend/phase-0-step-0-2m-b.md` | 이 파일 |

`logs/correction-log.csv` 는 그대로다 (`git diff` 0줄). 다른 계약 · 골든 · 라이브러리 · `apps/` · `packages/` 는 고치지 않았다.
같은 작업 트리에 0.2m-a 의 고치는 중인 파일이 있다 (DATA_MODEL · verify-data-model · verify-concept-identity 등) — 건드리지 않았고 커밋에 넣지 않았다.

### 다른 곳과 맞지 않는 것 — 고치지 않았다
| 어디 | 무엇 |
|---|---|
| `docs/development-content.md` "correction_log" 절 | "`logs/correction-log.csv`. 게이트에서 개입할 때마다 1줄" · 발견 칸 이름 `source_of_catch`. _open-9 가 정해지면 고쳐야 한다 |
| 같은 절의 유형 표 "레이어 혼입" 뜻 | "Concept 에 Bridge 내용이 섞임". 실물 9행 가운데 5행은 다른 모양이다 — 해석 → 원문 표시(2) · 해석 → 사실 층(1) · 한쪽의 주장 → 일어난 일(2). 표가 따라가지 않았다 |
| `verify-observation.py` 가 `verify-concept-identity.py` 를 불러 쓴다 | 0.2m-a 가 그 파일을 고치는 중이다. 지금 작업 트리 상태로는 통과한다. 0.2m-a 가 라이브러리 파서 · 골든 참조 모양을 바꾸면 `derive_decisions` (계약 §4.2 표 검사)가 영향을 받는다 — 객체 참조를 읽게 해 두었지만 실물로 확인하지 못했다 |
| D30 PM-4 | "지금부터 걸린 시간을 적는다" 뒤의 28행도 `time_spent_min` 이 비었다 |

### 검증

모든 명령은 저장소 루트에서. 잘라내지 않고 붙였다.

**1. `python3 scripts/verify-observation.py --report`** — exit 0 (WARN 2)
```
verify-observation
  계약   docs/contract/OBSERVATION.md — 타입 15 · 칸 105
  실물   correction-log.jsonl 42행 (CSV 에서 옮김) — gate {'None': 40, 'GATE_3': 2} · caught_by {'ARTIFACT_COMPARE': 10, 'PLAIN_READING': 3, 'AUTOMATED_CHECK': 4, 'SOURCE_RECHECK': 25}
         target {'ARTICLE': 37, 'CONCEPT': 7} · Replacement 6 · 유형 {'압축': 7, '오독 미방어': 3, '시점 앵커 누락': 1, '축약 변질': 3, '레이어 혼입': 9, '원문 불일치': 14, '팩트 누락': 5} · time_spent_min 적힌 행 0
  골든   basic block_decisions — C-0001@1 FULL · C-0002@4 FULL · C-0003@2 SKIP · C-0005@3 SKIP
  골든   advanced block_decisions — C-0001@1 SKIP · C-0002@4 SKIP · C-0003@2 SKIP · C-0005@3 REFRESHER
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 13 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']

correction-log.jsonl — 행마다 (gate · occasion · targets · caught_by 는 초안. 사람이 확인한다)
   1 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [입문 3장] | caught_by ARTIFACT_COMPARE | 대신 —
   2 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 —
   3 2026-09-21 오독 미방어 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 —
   4 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 —
   5 2026-09-21 시점 앵커 누락 | gate None · occasion "0.0b 교정 (S1 역산)" · stage None
     target ARTICLE FOMC-20260916 [저작 데이터] | caught_by ARTIFACT_COMPARE | 대신 —
   6 2026-09-21 축약 변질 | gate GATE_3 · occasion "게이트 3" · stage None
     target CONCEPT C-0005 [REFRESHER] + ARTICLE FOMC-20260916 [숙련 4장] | caught_by PLAIN_READING | 대신 v1→v2
   7 2026-09-21 레이어 혼입 | gate GATE_3 · occasion "S2 교정" · stage None
     target CONCEPT C-0002 [FULL ④] + ARTICLE FOMC-20260916 [입문 4장] | caught_by ARTIFACT_COMPARE | 대신 v1→v2
   8 2026-09-29 축약 변질 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0010 [REFRESHER] | caught_by AUTOMATED_CHECK (lint-1) | 대신 v1→v2
   9 2026-09-29 축약 변질 | gate None · occasion "C-1b 게이트" · stage None
     target CONCEPT C-0010 [BOUNDARY] | caught_by PLAIN_READING | 대신 —
  10 2026-09-29 레이어 혼입 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0008 [REFRESHER] | caught_by AUTOMATED_CHECK (lint-1) | 대신 v1→v2
  11 2026-09-29 레이어 혼입 | gate None · occasion "C-1 판정" · stage None
     target CONCEPT C-0005 [FULL] | caught_by ARTIFACT_COMPARE | 대신 v2→v3
  12 2026-09-29 레이어 혼입 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0002 [FULL ④] | caught_by AUTOMATED_CHECK (lint-2) | 대신 v2→v3
  13 2026-09-29 레이어 혼입 | gate None · occasion "0.1b PM 검수" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by PLAIN_READING | 대신 —
  14 2026-10-09 레이어 혼입 | gate None · occasion "0.2b 게이트" · stage None
     target ARTICLE FOMC-20260916 [입문 7장] | caught_by AUTOMATED_CHECK (quote-check) | 대신 —
  15 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 7장] | caught_by SOURCE_RECHECK | 대신 —
  16 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장 키커] | caught_by SOURCE_RECHECK | 대신 —
  17 2026-10-09 레이어 혼입 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장 제목] | caught_by SOURCE_RECHECK | 대신 —
  18 2026-10-09 레이어 혼입 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by SOURCE_RECHECK | 대신 —
  19 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by SOURCE_RECHECK | 대신 —
  20 2026-10-09 오독 미방어 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by SOURCE_RECHECK | 대신 —
  21 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by SOURCE_RECHECK | 대신 —
  22 2026-10-09 오독 미방어 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 9장] | caught_by SOURCE_RECHECK | 대신 —
  23 2026-10-09 압축 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 2장] | caught_by SOURCE_RECHECK | 대신 —
  24 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 3장 타임라인] | caught_by SOURCE_RECHECK | 대신 —
  25 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 3장 타임라인] | caught_by SOURCE_RECHECK | 대신 —
  26 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 3장 타임라인] | caught_by SOURCE_RECHECK | 대신 —
  27 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by SOURCE_RECHECK | 대신 —
  28 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장] | caught_by SOURCE_RECHECK | 대신 —
  29 2026-10-09 레이어 혼입 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장] | caught_by SOURCE_RECHECK | 대신 —
  30 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장] | caught_by SOURCE_RECHECK | 대신 —
  31 2026-10-09 팩트 누락 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장 결론] | caught_by SOURCE_RECHECK | 대신 —
  32 2026-10-09 원문 불일치 | gate None · occasion "C-5 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [저작 데이터 (F31 as_of)] | caught_by SOURCE_RECHECK | 대신 —
  33 2026-10-09 팩트 누락 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 2장 제목] | caught_by SOURCE_RECHECK | 대신 —
  34 2026-10-09 원문 불일치 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 2장] | caught_by SOURCE_RECHECK | 대신 —
  35 2026-10-09 팩트 누락 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장 둘째 문단] | caught_by SOURCE_RECHECK | 대신 —
  36 2026-10-09 원문 불일치 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 5장] | caught_by SOURCE_RECHECK | 대신 —
  37 2026-10-09 압축 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 6장 뒤 질문] | caught_by ARTIFACT_COMPARE | 대신 —
  38 2026-10-09 원문 불일치 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 7장 뒤 질문] | caught_by SOURCE_RECHECK | 대신 —
  39 2026-10-09 압축 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [입문 8장 뒤 질문] | caught_by ARTIFACT_COMPARE | 대신 —
  40 2026-10-09 압축 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 4장 뒤 질문] | caught_by ARTIFACT_COMPARE | 대신 —
  41 2026-10-09 팩트 누락 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 2장] | caught_by SOURCE_RECHECK | 대신 —
  42 2026-10-09 팩트 누락 | gate None · occasion "C-5 2차 게이트 (D29)" · stage None
     target ARTICLE FOMC-20260916 [숙련 3장 타임라인] | caught_by SOURCE_RECHECK | 대신 —

  WARN  CORR_DRAFT: 42행의 gate · occasion · targets · caught_by 가 초안이다 — 사람이 확인한다 (`_draft`)
  WARN  REPL_PENDING: Replacement 6건이 concept_id 대기 — 0.2m-a 가 라이브러리에 UUID 를 발급한 뒤 채운다 (`_pending`)
OK
```

**2. `python3 scripts/selftest-verify-observation.py`** — exit 0. 망가뜨린 사본 87 (계약 24 · 로그 2 · CSV 6 · 옮긴 파일 2 · 옮긴 교정 기록 14 · 시험 원장 38 · 다른 계약 1) + 계산 1 + 원본 1.
기대값이 "통과"인 것 다섯 — CSV 에 행이 늘었다(WARN 만) · 옮긴 파일의 `_` 주석 · 발행 뒤 FACT 대신 · PRE 를 설명 뒤에 적음(**빈틈**, 0.2c 와 같다) · 입문 4장에서 숙련으로 바꾸고 끝
```
PASS  원본 (계약 · 로그 · 교정 기록 · 시험 원장) → 통과
PASS  [contract] §9.4 — KnowledgeEvidence.content_version 삭제 → ['CONTRACT_FIELD', 'LEDGER_FIELD']
PASS  [contract] §9.4 — ReadingPlanLog.block_decisions 삭제 → ['CONTRACT_FIELD', 'LEDGER_FIELD']
PASS  [contract] §9.4 — response 가 어디에도 없다 → ['CONTRACT_FIELD', 'LEDGER_FIELD']
PASS  [contract] §9.4 — 위치에 값 추가 (MID) → ['CONTRACT_ENUM']
PASS  [contract] §9.4 — AUDIT 유형 삭제 → ['CONTRACT_ENUM']
PASS  [contract] §9.4 — decision 에 값 추가 (PARTIAL) → ['CONTRACT_ENUM']
PASS  [contract] §10.3 — 타인 독해 값 삭제 → ['CONTRACT_ENUM']
PASS  [contract] 증거에 값을 매기는 칸 (score) → ['CONTRACT_VALUATION']
PASS  [contract] §9.6 — 본문에 보류 항목 낱말 → ['CONTRACT_HELD_TERM']
PASS  [contract] user_concept_state 를 정의 → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] 다른 계약의 타입을 다시 정의 (ConceptRef) → ['CONTRACT_FOREIGN_TYPE']
PASS  [contract] 독자 기기 칸 (device_id) → ['CONTRACT_PERSONAL']
PASS  [contract] D26 — 읽기 사건에 방향 값 (SWIPED_UP) → ['CONTRACT_DIRECTION', 'CONTRACT_ENUM']
PASS  [contract] D26 — 읽기 사건에 방향 칸 (direction) → ['CONTRACT_DIRECTION']
PASS  [contract] D18 — 계획에 놓을 자리 (after_slide) → ['CONTRACT_PROBE_PLACEMENT']
PASS  [contract] D18 — 물음에 놓을 자리 (SlideLoc) → ['CONTRACT_PROBE_PLACEMENT']
PASS  [contract] Probe 절(§6.1)에서 "실물 없음" 삭제 → ['CONTRACT_NO_REAL']
PASS  [contract] 유형 표에 없는 유형 추가 → ['CONTRACT_ERROR_TYPES']
PASS  [contract] §8.1 — 실물 열 하나를 표에서 삭제 → ['CONTRACT_CSV_COLUMN']
PASS  [contract] §8.2 — 실물과 다른 행 수 → ['CONTRACT_REAL_MISMATCH']
PASS  [contract] §8.2 — 어느 행까지의 집계인지 안 적음 → ['CONTRACT_SNAPSHOT']
PASS  [contract] §8.3 — 옮긴 파일과 다른 수 → ['CONTRACT_REAL_MISMATCH']
PASS  [contract] §4.2 — 골든과 다른 decision (C-0003 입문 FULL) → ['CONTRACT_REAL_MISMATCH']
PASS  [contract] CHANGELOG 행 삭제 → ['CONTRACT_CHANGELOG']
PASS  [others] D30 — DATA_MODEL ArticleRecord 에서 article_version 이 사라짐 → ['CONTRACT_PAIR']
PASS  [log] 로그 — 질문 3 행 삭제 → ['LOG_QUESTION']
PASS  [log] 로그 — 질문 6 표시 삭제 → ['LOG_QUESTION']
PASS  [csv] CSV — 열 이름이 바뀜 → ['CONTRACT_CSV_COLUMN', 'CSV_HEADER']
PASS  [csv] CSV — 행이 늘었다 (아직 안 옮김) — 통과해야 한다. WARN 만 → 통과
PASS  [csv] CSV — 옮긴 행의 글자 하나가 바뀜 → ['MIGRATION_TEXT']
PASS  [csv] CSV — 마지막 행이 사라짐 → ['MIGRATION_ROWS']
PASS  [csv] CSV — 옛 행(3행)이 사라짐 → ['CONTRACT_REAL_MISMATCH', 'MIGRATION_ROWS', 'MIGRATION_TEXT']
PASS  [jsonl] 옮긴 파일 — catch_note 글자를 고침 → ['MIGRATION_TEXT']
PASS  [jsonl] 옮긴 파일 — 행 순서가 바뀜 → ['MIGRATION_ROWS', 'MIGRATION_TEXT']
PASS  [csv] CSV — 9종에 없는 유형 → ['CSV_ERROR_TYPE', 'MIGRATION_TEXT']
PASS  [corr] 기계 검사가 잡았는데 check 가 없다 → ['CORR_CHECK']
PASS  [corr] 사람이 잡았는데 check 가 있다 → ['CORR_CHECK']
PASS  [corr] targets 가 비었다 → ['CORR_TARGET']
PASS  [corr] 계약에 없는 칸 (severity) → ['CORR_FIELD']
PASS  [corr] gate 값이 넷 밖 (GATE_5) → ['CORR_ENUM']
PASS  [corr] 발행 뒤 교정인데 대신한 것이 없다 → ['CORR_PUBLISHED']
PASS  [corr] 발행 전에 FACT 를 대신했다 → ['REPL_BEFORE_PUBLICATION']
PASS  [corr] 발행 뒤 FACT 대신 — 통과해야 한다 → 통과
PASS  [corr] 옛 것과 새 것이 같은 FACT → ['REPL_SHAPE']
PASS  [corr] 개념 버전을 낮은 버전으로 대신 → ['REPL_SHAPE']
PASS  [corr] 같은 옛 것을 두 번 대신 (C-0010 v1 — 9행에도) → ['REPL_TWICE']
PASS  [corr] 대기 표시 없이 old_id 가 비었다 → ['REPL_SHAPE']
PASS  [corr] 옮긴 파일의 `_` 주석 칸 — 통과해야 한다 → 통과
PASS  [corr] 대신하기가 돈다 (f1 → f2 → f1) → ['REPL_CYCLE']
PASS  [ledger] 증거 줄에 값을 매기는 칸 (weight) → ['LEDGER_FIELD']
PASS  [ledger] plan 에 독자 이름 칸 → ['LEDGER_FIELD']
PASS  [ledger] 읽기 사건에 방향 칸 → ['LEDGER_FIELD']
PASS  [ledger] 패키지에 없는 레벨 (intermediate) → ['EVENT_SLIDE', 'PLAN_LEVEL']
PASS  [ledger] 한 열람에 같은 레벨 plan 둘 → ['PLAN_DUPLICATE']
PASS  [ledger] 정적 레벨인데 selected_blocks 를 채움 → ['PLAN_STATIC']
PASS  [ledger] 정적 레벨인데 reason 이 다름 → ['PLAN_STATIC']
PASS  [ledger] 숙련 plan 이 C-0002 를 FULL 로 적음 (패키지는 SKIP) → ['PLAN_DECISIONS']
PASS  [ledger] SKIP 인 개념을 목록에서 뺌 → ['PLAN_DECISIONS']
PASS  [ledger] decision 값이 셋 밖 (PARTIAL) → ['PLAN_DECISIONS']
PASS  [ledger] 바꿔서 연 레벨이 DEFAULT → ['PLAN_DEFAULT']
PASS  [ledger] 한 열람의 plan 이 다른 판을 가리킴 → ['PLAN_READING']
PASS  [ledger] seq 가 건너뜀 → ['EVENT_SEQ']
PASS  [ledger] 레벨에 없는 장 (입문 10장) → ['EVENT_SLIDE']
PASS  [ledger] SLIDE_ENTERED 에 slide_index 가 없다 → ['EVENT_SLIDE']
PASS  [ledger] 전환 없이 다른 레벨의 사건 → ['EVENT_CURRENT_PLAN']
PASS  [ledger] 같은 레벨로 전환 → ['EVENT_SWITCH']
PASS  [ledger] 전환 바로 다음이 SLIDE_ENTERED 가 아니다 → ['EVENT_SWITCH']
PASS  [ledger] CLOSED 뒤에 사건 → ['EVENT_CLOSED']
PASS  [ledger] 계약에 없는 사건 (SWIPED_UP) → ['EVENT_TYPE']
PASS  [ledger] 없는 물음 판을 가리키는 노출 → ['EXPOSURE_PROBE']
PASS  [ledger] 유형이 넷 밖 (QUIZ) → ['EXPOSURE_ENUM']
PASS  [ledger] 노출의 유형이 계획과 다르다 → ['EXPOSURE_PLAN']
PASS  [ledger] 보여주기 전에 답함 → ['RESPONSE_EXPOSURE']
PASS  [ledger] 노출 하나에 응답 둘 → ['RESPONSE_TWICE']
PASS  [ledger] 무응답 노출에서 증거 줄 → ['EVIDENCE_NO_RESPONSE']
PASS  [ledger] 응답을 지웠는데 증거 줄이 남음 → ['EVIDENCE_NO_RESPONSE']
PASS  [ledger] target 둘인데 증거 줄 하나 → ['EVIDENCE_TARGETS']
PASS  [ledger] 요점 물음의 답에 증거 줄을 붙임 (target 0) → ['EVIDENCE_TARGETS']
PASS  [ledger] 증거의 위치가 노출과 다름 → ['EVIDENCE_PROBE', 'EVIDENCE_TARGETS']
PASS  [ledger] 자기 보고인데 probe_id → ['EVIDENCE_PROBE']
PASS  [ledger] 없는 문안 버전 (C-0002 v9) → ['EVIDENCE_VERSION']
PASS  [ledger] MERGED 개념에 기록 → ['EVIDENCE_CONCEPT', 'EVIDENCE_TARGETS']
PASS  [ledger] leaf 가 아닌 것에 기록 → ['EVIDENCE_CONCEPT', 'EVIDENCE_TARGETS']
PASS  [ledger] 증거의 판이 plan 과 다름 → ['EVIDENCE_CONTEXT']
PASS  [ledger] plan 없이 기사 자리를 적음 → ['EVIDENCE_CONTEXT']
PASS  [ledger] 설명 장에 닿은 뒤인데 PRE 라고 적음 → 통과  빈틈
PASS  [ledger] 입문 4장에서 숙련으로 바꾸고 끝 — 원장은 맞다 → 통과
PASS  [계산] 입문 4장에서 숙련으로 바꾸고 끝 → 멈춘 장 ('advanced', 0) · 입문은 "바꿨다"(['basic']) · 입문에서 가장 멀리 3

사본 87개 + 계산 1 · OK
```

**3. 다른 검사** — 이 Step 은 그 검사들이 읽는 파일을 고치지 않았다. 0.2m-a 가 같은 시간에 그 파일들을 고치는 중이라 여기서 돌린 결과는 0.2m-a 의 중간 상태를 재는 것이 된다 — 돌리지 않았다.

### 남은 일
- **게이트** — _open 5개
- 판정 뒤: _open-6 · 10 이 (a) 면 타입 · 불변식 20 개정 / _open-9 가 (a) 면 CSV 를 얼리고 development-content 절을 고친다
- 0.2m-a 뒤: jsonl 의 `_pending` 6건에 concept_id · `verify-observation` 을 옮긴 골든 · 라이브러리로 다시 돌린다
- 사람 확인: jsonl 42행의 `_draft`


---

## 0.2m-a 뒤 맞춤 · 2026-10-09

같은 지시문이 한 번 더 왔다. Step 은 `5c8ced4` 로 끝나 있었다. 다시 하지 않고 **지금 상태를 쟀더니 `verify-observation` 이 FAIL 이었다** — 0.2m-a 가 골든과 라이브러리를 옮긴 뒤다.
위 "다른 곳과 맞지 않는 것"에 "실물로 확인하지 못했다"고 적어 둔 그 자리다.

### 무엇이 깨졌나
```
FAIL CONTRACT_REAL_MISMATCH: §4.2 골든 표 {C-0001 · C-0002 · C-0003 · C-0005} ≠ 골든에서 계산 {C-0001 · C-0002 · C-0005 · C-0012}
selftest: 사본 87개 + 계산 1 · 32개 실패 (전부 이 하나에서 번진 것)
```
- 검사가 틀린 게 아니다. **골든이 바뀌었다** — C-4(D32)가 명제를 나누면서 입문 4장의 "이름만 나오는" 언급이 C-0003 에서 C-0012 의 것이 됐다
- 객체 참조(ConceptRef)는 지난번에 넣어 둔 길로 읽혔다. `part` 를 문안 대조 없이 그대로 읽는다
- **1번과 같은 병이다** — 계약이 살아 있는 실물의 값을 적어 두었다. CSV 는 덧붙이기만 해서 "1~N행"으로 묶었는데, 골든은 덧붙이기가 아니라 고쳐 쓰인다

### 고친 것
| 파일 | 무엇 |
|---|---|
| `docs/contract/OBSERVATION.md` | §4.2 골든 표를 **커밋 하나에 묶인 기록**으로 (골든 `03b6c3c`) — 표를 지금 골든에 맞추고(C-0003 → C-0012 · C-0001 은 FULL + 비유), 어느 커밋의 골든인지 적었다. §2.1 · §10 — 골든에 판의 키가 발급됐다 (`fixtures/fomc-2026-09.record.json`) · `part` 가 채워졌다. §15 — Replacement 대기 해소. CHANGELOG. **타입 · 불변식 불변** |
| `scripts/verify-observation.py` | §4.2 표를 **그 커밋의 골든 · 저장소**(`git show`)로 견준다 — 골든이 또 바뀌어도 안 깨진다. 커밋을 안 적으면 `CONTRACT_SNAPSHOT`. 개념 UUID · 버전은 `docs/content/concept-library.json` 에서. Replacement 가 저장소에 있는 개념 · 버전을 가리키는가 (`REPL_UNKNOWN`) |
| `logs/correction-log.jsonl` | Replacement 6건의 `old_id` · `new_id` 에 0.2m-a 가 발급한 `concept_id`. `_pending` 0. **글은 안 건드렸다** (검사가 CSV 와 글자 단위로 견준다) |
| `scripts/selftest-verify-observation.py` | 사본 87 → 90 |

살아 있는 골든은 시험 원장을 만드는 데 계속 쓴다 — 거기서는 값을 **단정하지 않고 계산**하므로 골든이 바뀌어도 따라간다.

### 검증

**1. `python3 scripts/verify-observation.py`** — exit 0 (WARN 1 — `REPL_PENDING` 이 사라졌다)
```
verify-observation
  계약   docs/contract/OBSERVATION.md — 타입 15 · 칸 105
  실물   correction-log.jsonl 42행 (CSV 에서 옮김) — gate {'None': 40, 'GATE_3': 2} · caught_by {'ARTIFACT_COMPARE': 10, 'PLAIN_READING': 3, 'AUTOMATED_CHECK': 4, 'SOURCE_RECHECK': 25}
         target {'ARTICLE': 37, 'CONCEPT': 7} · Replacement 6 · 유형 {'압축': 7, '오독 미방어': 3, '시점 앵커 누락': 1, '축약 변질': 3, '레이어 혼입': 9, '원문 불일치': 14, '팩트 누락': 5} · time_spent_min 적힌 행 0
  골든   basic block_decisions — C-0001@1 FULL · C-0002@4 FULL · C-0005@3 SKIP · C-0012@1 SKIP
  골든   advanced block_decisions — C-0001@1 SKIP · C-0002@4 SKIP · C-0005@3 REFRESHER · C-0012@1 SKIP
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 13 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']

  WARN  CORR_DRAFT: 42행의 gate · occasion · targets · caught_by 가 초안이다 — 사람이 확인한다 (`_draft`)
OK
```

**2. `python3 scripts/selftest-verify-observation.py`** — exit 0 (새로 넣거나 바꾼 사본 · 마지막 줄. 실패 행 0)
```
PASS  [contract] §4.2 — 골든과 다른 decision (C-0012 입문 FULL) → ['CONTRACT_REAL_MISMATCH']
PASS  [corr] 대기 표시 없이 old_id 가 비었다 → ['REPL_SHAPE']
PASS  [corr] 저장소에 없는 개념을 가리키는 Replacement → ['REPL_UNKNOWN']
PASS  [corr] 저장소에 없는 버전으로 대신 (C-0010 v9) → ['REPL_UNKNOWN']
PASS  [contract] §4.2 — 어느 커밋의 골든인지 안 적음 → ['CONTRACT_SNAPSHOT']
사본 90개 + 계산 1 · OK
```

### 남은 일 (바뀐 것만)
- ~~jsonl 의 `_pending` 6건~~ — 채웠다
- 게이트 — _open 5개 그대로 (계약 §16)
- 사람 확인 — jsonl 42행의 `_draft`
