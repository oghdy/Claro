# logs/backend · Phase 0 / Step 0.2c — OBSERVATION

## B-0.2c · 2026-10-09 · **[GATE]**

### 질문 8개 — 처리 요약

| # | 질문 | 표시 | 근거 (실물 · FINDINGS 확정) | 계약 |
|---|---|---|---|---|
| 1 | knowledge_evidence — 사실만 · 개념을 무엇으로 · 본 문안 버전 | **계약 반영** (+ _open-2 · 실물 없음) | 확정 §9.4 (칸 15 · "사실만 기록") · 확정 §9.5 (leaf 에만 · "알고 있어요" · merge 는 되돌릴 수 있다 · `interaction_id` 로 중복 제거) · CONCEPT_IDENTITY §3.2 · §8 · §10.2 가 넘긴 제약 셋 | §7 — 값을 매기는 칸 없음. `evidence_type` 은 한 일의 종류 둘(PROBE_RESPONSE · SELF_REPORT_KNOWN). `concept_id` = leaf Concept UUID, 기록할 때 MERGED 아님. `content_version` = ConceptVersion.version. merge 뒤에는 원장을 고치지 않고 읽을 때 따라간다. **`response` · `is_correct` 는 ProbeResponse 로 옮겼다 → _open-2** |
| 2 | reading_plan_log — 정적 레벨 · SKIP / REFRESHER / FULL 이 `part` 와 같은 말인가 | **계약 반영** (`narrative_form` 미확인) | 확정 §9.4 (칸 12) · 확정 §9.3 · CONCEPT_IDENTITY §3.3 (D25 "같은 말을 쓴다") · 실물: `ArticleReader.tsx` (`pkg.levels[0]` 먼저 · `switchLevel`) · 골든 concept span 21 을 문안 대조 | §4 — plan = (열람 · 레벨)마다 하나. **같은 말이다**: FULL ⇔ `part` 가 FULL 로 시작, REFRESHER ⇔ REFRESHER 만, SKIP ⇔ 둘 다 없음. 골든에서 계산: 입문 C-0001 · C-0002 FULL / C-0003 · C-0005 SKIP, 숙련 C-0005 REFRESHER / 나머지 SKIP. 정적이면 `estimator_version` · `selected_blocks` · `skipped_blocks` null |
| 3 | 읽기 사건 — 완독 · 멈춘 장 · 레벨 전환 · 방향 | **계약 반영** | 확정 §8.3 (완독 · "몇 장에서 이탈") · 실물: `Deck` 의 `onIndex(cur)` · `switchLevel` · `positions` · "처음부터 다시 보기" · F-1 로그(FOMC-21) · F-2a 로그(스냅이 꼬리를 삼킨다 · B 는 물음이 버튼) · D26 OPEN | §5 — 사건 셋: `SLIDE_ENTERED`(지금 장이 됐다 — 어떻게 왔는지 모른다) · `LEVEL_SWITCHED` · `CLOSED`(실물 없음). 완독 · 멈춘 장은 칸이 아니라 계산. `slide_index` 는 plan 안에서만 뜻이 있고, 멈춘 장은 **열람** 단위로 본다 — 전환으로 떠난 plan 은 "바꿨다"로 센다 |
| 4 | probe — 유형 넷 · 위치 셋 · 무응답 · 세션 예산 | **계약 반영** (전부 실물 없음 · 자리는 D18 그대로) | 확정 §9.4 (유형 넷 · 위치 · "무응답은 증거가 아니다" · "세션 단위") · D18 OPEN · D17 | §6 — Probe(판) · ProbeExposure(물었다) · ProbeResponse(답했다). 유형 · 위치는 물음이 아니라 **묻기**에 붙는다. 응답 없는 노출에서 증거 0 (불변식 15). `session_id` 로 센다 — 몇 개까지인지는 없다. **놓을 자리를 정하는 칸이 없다** (검사 A). `shown_at_loc` 은 나온 뒤의 기록 |
| 5 | 무엇을 봤는지 가리키기 — 패키지 ID · ArticleRecord 와의 짝 | **_open** (-1) + 계약 반영 (자리) | 확정 §9.4 (`article_id` · `article_version` · `content_block_id`) · 확정 §9.2 · ARTICLE_PACKAGE §4 ("위치에서 나온다") · §10 · DATA_MODEL §11 · §15 (ID 미확인) · 실물: 골든에 `event_ref` 뿐, 화면은 파일 이름으로 읽는다 | §2 — 판은 ArticleRef(`article_id` + `article_version`) = ArticleRecord 하나. **ArticleRecord 쪽에 칸이 없다 → _open-1.** 레벨은 `LevelId`, 자리는 SlideLoc(위치) — 새 ID 를 만들지 않는다 |
| 6 | 독자 식별 — 익명 · 저장하지 않는 것 | **계약 반영** (최소) + **_open** (-3) | 확정 §9.4 (`user_id` — 이름만) · F-1 로그(화면은 아무것도 기억하지 않는다) | §3 — 뜻 없는 UUID. 이름 · 연락처 · 계정 · 기기 · 주소 칸이 어느 타입에도 없다 (검사 A). 며칠 뒤에도 같은 값이어야 한다. 대응표 · 동의 · 보관 · 배경 → _open-3 |
| 7 | 교정 기록 — stage · 유형 칸 / 발견 칸 · 대체 | **계약 반영** (+ _open-5 · 발행 뒤는 실물 없음) | 실물: correction-log.csv 14행 8열 · development-content 유형 표 9종 · 유형 규칙 · 확정 §10.2 · §10.3 · DATA_MODEL §2.3 · CONCEPT_IDENTITY §4.1 (버전 6건) · D27 (교정 기록은 code 로) | §8 · §9 — `stage` 한 열 → `gate`(잡은 게이트) · `occasion`(잡은 때) · `targets[].kind`(있던 곳) · `stage`(생긴 단계, 어휘 미확인). 유형 9종 + `type_note`. 발견 = `caught_by`(닫힌 값) + `check`(검사 이름 — 자동화는 이걸 센다) + `catch_note`. Replacement — 실물은 CONCEPT_VERSION 6건 |
| 8 | F-3 에 필요한 최소 | **계약 반영** (목록) + **_open** (-4) · **미확인** | FINDINGS §13 Phase 1 게이트 — **"확정" 표시가 없다** (D24) · 확정 §9.4 · D25 (명제 나누기 마감 = 첫 증거) | §12 — 반드시: 같은 `user_id` · 판과 레벨 · 물음의 판 · 노출과 응답 · `SLIDE_ENTERED`. 미뤄도 됨: `block_decisions`(유일하게 되살릴 수 있다) · 자기 보고 · 유형 셋 · 예산. 일반 기사 · 무리 배정은 타입에 없다 → _open-4 |

§9.6 보류 항목 — 계약에 없다 (검사 A 가 낱말 · 수치로 확인). `user_concept_state` · 추정기 타입 없음. 값을 매기는 칸 없음. 숫자 없음.

### 게이트에서 먼저 볼 것

1. **_open-1 — ArticleRecord 를 가리킬 칸이 없다.** 다른 계약 둘이 미확인으로 남긴 것이 여기서 막힌다. 이 칸 없이는 독자 기록이 한 줄도 안 써진다.
   초안: `article_id` UUID + `article_version` 정수(확정 §9.4 의 이름 그대로). DATA_MODEL 의 ArticleRecord 가 가져야 한다 — **이 세션은 다른 계약을 고치지 않았다**
2. **_open-2 — 확정 §9.4 의 칸 둘(`response` · `is_correct`)의 자리를 옮겼다.** 요점을 묻는 물음이 leaf 개념을 안 겨누면 증거 줄이 없고, 응답이 증거 줄에만 있으면 그 답이 사라진다.
   F-3 의 물음이 바로 그 요점 물음이다. 확정된 것을 건드린 유일한 곳이다
3. **위에서 따라 나오는 것 — F-3 에서 KnowledgeEvidence 가 한 줄도 안 생길 수 있다.** 물음이 요점만 묻으면 그렇다.
   D25 는 "첫 실제 독자 기록 = 첫 evidence"로 명제 나누기 마감을 F-3 으로 잡았다. 물음이 개념을 겨누는지에 따라 그 마감이 진짜인지가 갈린다 — 물음을 쓰는 쪽(콘텐츠 레인)이 알아야 한다
4. **_open-4 — §13 은 "확정"이 아니다.** 일반 기사를 읽힌 것 · 무리 배정을 원장에 남길지 정하지 않았다. 타입에 없다.
   어느 쪽이든 일반 기사 뒤의 답은 ProbeExposure · ProbeResponse 로 남는다. **무엇을 읽은 뒤의 답인지**가 원장에 없을 뿐이다
5. **_open-3 — 독자.** 원장은 뜻 없는 UUID 만 갖는다. 며칠 뒤 같은 사람을 다시 찾으려면 대응표가 어딘가 있어야 한다 — 누가 어디에 두는지, 동의 · 보관
6. **_open-5 — `caught_by`.** 확정 §10.3 의 네 값과 글자가 같은 실물이 0/14 다. 실물은 대조 7 · 기계 검사 4 · 읽다가 3
7. **`time_spent_min` 이 14행 모두 비었다.** 확정 §10.1 의 판단 기준("편집 시간을 줄이는가")을 재는 칸이다. 되살릴 수 없다. 계약 문제가 아니라 기록 습관이다

### 산출

| 파일 | 내용 |
|---|---|
| `docs/contract/OBSERVATION.md` | 계약 (새 파일). §1 타입 15 · §2 ~ §9 질문별 · §10 다른 계약과의 짝 · §11 불변식 21 · §12 F-3 최소 · §13 미확인 · §14 _open 5 · §15 CSV 이전 목록 |
| `scripts/verify-observation.py` | 계약 검사 — A 계약 문서 · B 로그 · C 실물 CSV 를 메모리 안에서 이 모양으로 옮겨 불변식 20 · 21 · D 가짜 독자 하나의 원장으로 불변식 1 ~ 19. `--report` 로 행마다 이전 결과 |
| `scripts/selftest-verify-observation.py` | 망가뜨린 사본 (메모리 안, 파일 안 남김) |
| `logs/backend/phase-0-step-0-2c.md` | 이 파일 |

다른 계약 · 골든 · 라이브러리 · `apps/` · `correction-log.csv` · DECISIONS 는 고치지 않았다. 독자 기록 · 물음 · 교정 행을 하나도 새로 만들지 않았다 (시험 원장의 가짜 독자는 파일로 남지 않는다).

### 도출하며 판단한 것 — 멈추지 않은 이유
_open 으로 올리지 않고 계약에 넣은 판단. 게이트에서 뒤집을 수 있다.

| 판단 | 근거 | 왜 _open 이 아닌가 |
|---|---|---|
| 슬라이드 · 블록을 ID 가 아니라 위치로 가리킨다 | ARTICLE_PACKAGE §4 "`index` 필드는 두지 않는다 — 위치에서 나온다" · 판은 불변 | 게이트를 통과한 계약에서 따라 나온다. ID 를 만들면 패키지 계약을 바꿔야 한다 |
| plan = (열람 · 레벨)마다 하나. 돌아오면 같은 plan | 확정 §9.4 plan 에 `level` 이 하나 · 실물 `positions` (레벨마다 자리를 기억) | 보여주는 것이 같으면 같은 plan 이다 |
| `level_chosen_by` 추가 | 실물 — 화면이 첫 레벨을 먼저 그린다 · 확정 §9.1 (깊이는 독자가 선언) | 지금 화면이 실제로 만드는 차이다. 안 적으면 되살릴 수 없다 |
| 정적 레벨이면 블록 선택 둘은 null | 확정 §9.3 · 판 불변 | 같은 것을 두 번 적지 않는다 (D22 와 같은 이유) |
| `block_decisions` 는 계산되어도 적는다 | 확정 §9.4 가 plan 의 칸으로 적었다 | 추정기가 생기면 계산이 안 된다. 불변식 6 이 두 곳을 묶는다 |
| 언급만 된 개념(`part` null)은 SKIP | 확정 값이 셋뿐 · 실물 골든 C-0003 | 세 값은 "설명을 얼마나 보여줬나"다 |
| 완독 · 멈춘 장 · 이탈을 칸으로 두지 않는다 | 확정 §8.3 "공짜로 나온다" | 사건에서 계산된다. DATA_MODEL 이 판정을 저장하지 않은 것과 같은 방식 (D27 수용) |
| `LEVEL_SWITCHED` 를 따로 둔다 (plan 이 바뀐 것에서 알 수 있어도) | 실물 `switchLevel` — 독자가 버튼을 누른 사건 · FOMC-21 | "이탈로 읽히면 안 된다"를 불변식 9 · 10 으로 검사할 수 있게 |
| `seq` 추가 | — | 기기 시계로는 한 열람 안의 순서를 못 믿는다 |
| `evidence_type` 을 한 일의 종류 둘로 | 확정 §9.4 (probe 응답) · 확정 §9.5 ("알고 있어요") | `PRE_PROBE_CORRECT` 식 묶음은 `position` · 응답과 같은 말을 두 번 한다 |
| merge 뒤 — 원장은 그대로, 읽을 때 따라간다 | 확정 §9.5 "merge 는 되돌릴 수 있다" · CONCEPT_IDENTITY §10.2 "B 의 것은 아무것도 지우거나 옮기지 않는다" | 원장을 고쳐 쓰면 되돌릴 수 없다. CONCEPT_IDENTITY §10.2 가 여기로 넘긴 물음의 답 |
| 유형 · 위치를 Probe 가 아니라 노출에 | 확정 §9.4 — 넷은 목적이고(AUDIT = 무작위 뽑기), 같은 물음이 며칠 뒤 다시 나온다 | 물음에 붙이면 같은 물음을 POST 와 DELAYED 로 못 쓴다 |
| `session_id` 를 두되 경계는 미확인 | 확정 §9.4 "세션 단위" | 셀 칸이 없으면 예산을 볼 수 없다. 경계를 정할 화면이 없다 |
| `stage` 한 열을 넷으로 | 실물 6종 | 실물이 세 가지를 섞었다. 행을 어디에 넣을지는 0.2m 에서 사람이 확인한다 |
| `event_id` 열 → `event_code` | 실물 14/14 가 code · DATA_MODEL §2.1 · D27 | 이름이 같으면 UUID 와 섞인다 |
| `type_note` 추가 | 유형 규칙 (성격과 처방) · 실물 3행 | 실물이 이미 쓰고 있다 |
| FACT · CLAIM · BRIDGE 의 Replacement 는 발행 뒤에만 | DATA_MODEL §2.3 "발행 전 초안은 고칠 수 있다" | 발행 전에는 대신할 옛 것이 남지 않는다 |
| 값이 바뀐 것(VOLATILE)은 교정이 아니다 | DATA_MODEL §2.3 "옛 Fact 는 그 as_of 로 계속 맞다" | 틀린 것이 없다 |

### 다른 계약 · 문서와 맞지 않는 곳 — 고치지 않았다

| 어디 | 무엇 |
|---|---|
| DATA_MODEL §11 · ARTICLE_PACKAGE §10 | ArticleRecord 에 `article_id` · `article_version` 이 없다. 독자 기록이 가리킬 곳이 없다 (_open-1) |
| DATA_MODEL §15 "대체(supersede) 관계 … correction_log (0.2c)" | 이 계약의 Replacement 는 **틀린 것**의 대체만 적는다. VOLATILE 값이 바뀌어 생긴 새 Fact 와 옛 Fact 를 잇는 기록은 여기 없다 — 교정이 아니기 때문이다. 그 앞뒤가 필요한지, 필요하면 어디인지는 DATA_MODEL 의 일이다 |
| DATA_MODEL (Goal) | Comprehension Goal 이 타입으로 없다 (FOMC 는 DC-C 가 Common Goal, D27). 요점에서 만든 물음이 요점을 가리킬 수 없다 — `Probe.event_id` 까지만 |
| ARTICLE_PACKAGE | 서사 형식 칸이 없다. 확정 §9.4 `narrative_form` 을 채울 원천이 없다 |
| CONCEPT_IDENTITY §3.3 | 맞다 — `decision` 은 `part` 에서 계산된다. 단 골든이 아직 `part` 를 안 갖는다 (0.2m). 검사는 문안 대조로 `part` 를 얻었다 |
| CONCEPT_IDENTITY §10.3 · D25 | "첫 실제 독자 기록 = 첫 evidence". 이 계약에서는 독자 기록(plan · 읽기 사건 · 응답)이 증거 줄보다 먼저 생길 수 있다. 명제를 못 나누게 되는 순간은 **첫 KnowledgeEvidence 줄**이다 |
| FINDINGS §10.3 `source_of_catch` 네 값 | 실물 14행 가운데 글자가 같은 것이 없다 (_open-5) |
| FINDINGS §9.4 knowledge_evidence | `response` · `is_correct` 를 ProbeResponse 로 옮겼다 (_open-2). `article_version` · `session_id` · `reading_id` · `seq` · `level_chosen_by` 는 확정 목록에 없던 칸이다 |
| `logs/correction-log.csv` 열 이름 `event_id` | 값은 Event 의 code 다 |
| development-content 유형 표 "원문 불일치" (C-3 · 2026-10-09) | 유형은 표에 있는데 그 유형의 행이 CSV 에 없다. C-3 이 찾은 것을 행으로 적을지 정해지지 않았다 |
| development-content 유형 표 "레이어 혼입" 뜻 | "Concept 에 Bridge 내용이 섞임"인데 실물 2행(0.1b · 0.2b)은 해석에 원문 표시가 붙은 것이다. 유형의 뜻이 넓어졌다 — 표가 따라가지 않았다 |

### `correction-log.csv` 를 이 계약 모양으로 옮기면 바뀌는 것 — 0.2m 입력
계약 §15 가 본문이다. `--report` 가 행마다 찍는다 (검증 1).

1. 행마다 `correction_id` 발급 (14)
2. `event_id` 열 → `event_code` (값 그대로)
3. `stage` 열이 사라지고 넷으로 — `gate`: GATE_3 2행 · null 12행 / `occasion`: 14행 전부 채움 / `stage`: "writing" 4행 · null 10행 / 있던 곳은 `targets`
4. `targets` 가 생긴다 — ARTICLE 만 7행 · CONCEPT 7행 (그 가운데 게이트 3 의 2행은 골든도 같이 고쳐 target 이 둘)
5. `source_of_catch` 가 셋으로 — `catch_note`(글 그대로) · `caught_by`(ARTIFACT_COMPARE 7 · AUTOMATED_CHECK 4 · PLAIN_READING 3 — 초안) · `check`(lint-1 2 · lint-2 1 · quote-check 1)
6. `what_i_changed` 의 "유형: …" 문단 3개(7 · 10 · 13행) → `type_note`
7. `replacements` 가 생긴다 — CONCEPT_VERSION 6건 (C-0002 1→2 · 2→3 / C-0005 1→2 · 2→3 / C-0008 1→2 / C-0010 1→2). 9행(C-0010 BOUNDARY)은 8행과 같은 v2 라 Replacement 를 갖지 않는다
8. `after_publication` 14행 전부 false · `time_spent_min` 14행 전부 null
9. **사람이 확인할 것** — 행마다 `occasion` · `caught_by` (초안 대응은 이 세션이 글을 읽고 붙인 것이다) · 7행의 `gate` (stage 는 "게이트 3", 발견 칸은 "S2 교정 중")
10. 파일 모양 — `targets` · `replacements` 는 목록이라 CSV 한 칸에 안 들어간다. 무엇으로 둘지는 0.2m

### 프론트가 이 계약대로 기록하려면 화면에 더 필요한 것 — F-3 입력
구현하지 않았다. 지금 화면(`apps/web/src`, lab 제외)은 기록을 하나도 남기지 않는다.

| # | 무엇 | 지금 | 계약 |
|---|---|---|---|
| 1 | **며칠 뒤에도 같은 `user_id`** | 독자를 모른다. 새로고침하면 읽던 자리도 잊는다 | §3 · _open-3 |
| 2 | **판의 ID 를 화면이 알아야 한다** | `loadPackage("fomc-2026-09.article.json")` — 파일 이름. 패키지에 ID 가 없다 | §2.1 · _open-1 |
| 3 | 열 때 `session_id` · `reading_id` 를 만든다 | 없다 | §4.1 |
| 4 | plan 을 남긴다 — 열 때 첫 레벨(`DEFAULT`), `switchLevel` 에서 처음 가는 레벨(`READER`) | `switchLevel` 은 자리만 기억한다 | §4 |
| 5 | `block_decisions` 를 계산한다 — concept span 의 `part` 에서 | 프론트 검증기가 concept ref 를 문자열로만 받는다(`validate.ts:115`). `part` 가 없다 | §4.2 · 0.2m 뒤. **미뤄도 된다 (§12)** |
| 6 | `SLIDE_ENTERED` — 지금 장이 **바뀔 때** 한 번 | `Deck` 이 스크롤할 때마다 `onIndex(cur)` 를 부른다. 같은 값도 계속 올린다. 열자마자의 0 과 돌아온 자리(`startAt`)도 사건이어야 한다 | §5.1 |
| 7 | `LEVEL_SWITCHED` | `switchLevel` 이 있다. 사건은 안 남긴다 | §5.3 |
| 8 | `CLOSED` — 떠나는 것을 듣는다 | 안 듣는다 | §5.1. 미뤄도 된다 |
| 9 | 사건을 보낼 곳과, 못 보냈을 때 쥐고 있을 곳 | 없다 (백엔드 D1 OPEN) | 범위 밖 — 없으면 1 ~ 8 이 뜻이 없다 |
| 10 | **물음을 보여주고 답을 받는 화면** | 없다. 마지막 장에 "처음부터 다시 보기"뿐 (D18 OPEN) | §6. F-3 을 종이로 돌리면 화면은 없어도 되지만, 그때도 노출 · 응답은 이 모양으로 옮겨 적어야 한다 |
| 11 | "알고 있어요" | 없다 | §7.1. 미뤄도 된다 |
| 12 | 장 안에서 끝까지 내렸는지 | 긴 장에서 스냅이 꼬리를 건너뛴다 (F-2a). `SLIDE_ENTERED` 는 닿은 것만 안다 | §5.4 미확인 — D26 뒤 |
| 13 | 새로고침이 새 열람인지 | 새로고침하면 전부 처음부터 | §13 미확인. 정하지 않으면 한 사람이 읽다 만 열람 둘로 남는다 |
| 14 | `/lab` · `/test` 에서 생긴 줄을 가르기 | 화면에 시험 경로가 있다 | §13 미확인 |

D26 이 어느 쪽으로 정해져도 6 · 7 은 그대로다 — 사건이 방향을 모른다. B(가로 카드)의 "물음 버튼을 눌러 다음 장"도 `SLIDE_ENTERED` 다.

### 적어두고 넘어간 것 (범위 밖)
- 층 표시를 열어 본 것(F-2a A 렌즈 · B 문장 누르기)을 남기면 "독자가 출처를 궁금해했나"를 볼 수 있다. D26 뒤에
- 교정 기록의 "대안:"(6행) · "미처리 / 범위 밖"을 따로 칸으로 빼면 남긴 일을 추적할 수 있다. 실물은 글 안에 있다
- `verify-concept-identity.py` 의 `HELD` 낱말 목록을 그대로 빌려 썼다. 세 검사가 같은 목록을 본다

### 검증

모든 명령은 저장소 루트에서. 1 · 2 는 잘라내지 않고 붙였다. 3 은 기존 검사 — 종료 코드와 마지막 줄들.

**1. `python3 scripts/verify-observation.py --report`** — exit 0
```
verify-observation
  계약   docs/contract/OBSERVATION.md — 타입 15 · 칸 105
  실물   correction-log.csv 14행 → CorrectionEntry — gate {'None': 12, 'GATE_3': 2} · caught_by {'ARTIFACT_COMPARE': 7, 'PLAIN_READING': 3, 'AUTOMATED_CHECK': 4}
         target {'ARTICLE': 9, 'CONCEPT': 7} · Replacement 6 · type_note 3 · time_spent_min 적힌 행 0
  골든   basic block_decisions — C-0001@1 FULL · C-0002@3 FULL · C-0003@1 SKIP · C-0005@3 SKIP
  골든   advanced block_decisions — C-0001@1 SKIP · C-0002@3 SKIP · C-0003@1 SKIP · C-0005@3 REFRESHER
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 13 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']

correction-log.csv → CorrectionEntry (초안 대응 — 0.2m 에서 사람이 확인한다)
   1 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [입문 3장] | caught_by ARTIFACT_COMPARE | 대신 — | type_note —
   2 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 — | type_note —
   3 2026-09-21 오독 미방어 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 — | type_note —
   4 2026-09-21 압축 | gate None · occasion "0.0b 교정 (S1 역산)" · stage writing
     target ARTICLE FOMC-20260916 [숙련 4장] | caught_by ARTIFACT_COMPARE | 대신 — | type_note —
   5 2026-09-21 시점 앵커 누락 | gate None · occasion "0.0b 교정 (S1 역산)" · stage None
     target ARTICLE FOMC-20260916 [저작 데이터] | caught_by ARTIFACT_COMPARE | 대신 — | type_note —
   6 2026-09-21 축약 변질 | gate GATE_3 · occasion "게이트 3" · stage None
     target CONCEPT C-0005 [REFRESHER] + ARTICLE FOMC-20260916 [숙련 4장] | caught_by PLAIN_READING | 대신 v1→v2 | type_note —
   7 2026-09-21 레이어 혼입 | gate GATE_3 · occasion "S2 교정" · stage None
     target CONCEPT C-0002 [FULL ④] + ARTICLE FOMC-20260916 [입문 4장] | caught_by ARTIFACT_COMPARE | 대신 v1→v2 | type_note 있음
   8 2026-09-29 축약 변질 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0010 [REFRESHER] | caught_by AUTOMATED_CHECK (lint-1) | 대신 v1→v2 | type_note —
   9 2026-09-29 축약 변질 | gate None · occasion "C-1b 게이트" · stage None
     target CONCEPT C-0010 [BOUNDARY] | caught_by PLAIN_READING | 대신 — | type_note —
  10 2026-09-29 레이어 혼입 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0008 [REFRESHER] | caught_by AUTOMATED_CHECK (lint-1) | 대신 v1→v2 | type_note 있음
  11 2026-09-29 레이어 혼입 | gate None · occasion "C-1 판정" · stage None
     target CONCEPT C-0005 [FULL] | caught_by ARTIFACT_COMPARE | 대신 v2→v3 | type_note —
  12 2026-09-29 레이어 혼입 | gate None · occasion "C-1 린트" · stage None
     target CONCEPT C-0002 [FULL ④] | caught_by AUTOMATED_CHECK (lint-2) | 대신 v2→v3 | type_note —
  13 2026-09-29 레이어 혼입 | gate None · occasion "0.1b PM 검수" · stage None
     target ARTICLE FOMC-20260916 [입문 8장] | caught_by PLAIN_READING | 대신 — | type_note 있음
  14 2026-10-09 레이어 혼입 | gate None · occasion "0.2b 게이트" · stage None
     target ARTICLE FOMC-20260916 [입문 7장] | caught_by AUTOMATED_CHECK (quote-check) | 대신 — | type_note —

OK
```
이 검사가 초안의 틀린 수 넷을 잡았다 (고친 뒤 통과): `concept_library` 4행이 아니라 5행 · "유형:" 문단 4개가 아니라 3개 · "대안:" 9행이 아니라 6행 · 절 둘에 "실물 없음" 빠짐.

**2. `python3 scripts/selftest-verify-observation.py`** — exit 0. 망가뜨린 사본 77 (계약 22 · 로그 2 · CSV 3 · 옮긴 교정 기록 12 · 시험 원장 38) + 계산 1 + 원본 1.
기대값이 "통과"인 셋 — 발행 뒤 FACT 대신(되어야 한다) · PRE 를 설명 뒤에 적음(**빈틈**: 계약이 불변식으로 두지 않았다, §7.3) · 입문 4장에서 숙련으로 바꾸고 끝(원장은 맞고, 계산이 "바꿨다"를 말한다)
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
PASS  [contract] §4.2 — 골든과 다른 decision (C-0003 입문 FULL) → ['CONTRACT_REAL_MISMATCH']
PASS  [contract] CHANGELOG 행 삭제 → ['CONTRACT_CHANGELOG']
PASS  [log] 로그 — 질문 3 행 삭제 → ['LOG_QUESTION']
PASS  [log] 로그 — 질문 6 표시 삭제 → ['LOG_QUESTION']
PASS  [csv] CSV — 열 이름이 바뀜 → ['CONTRACT_CSV_COLUMN', 'CSV_HEADER']
PASS  [csv] CSV — 9종에 없는 유형 → ['CORR_ENUM', 'CSV_ERROR_TYPE']
PASS  [csv] CSV — 행이 늘었는데 대응을 안 적음 → ['CONTRACT_REAL_MISMATCH', 'CSV_ROWS']
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

사본 77개 + 계산 1 · OK
```

**3. 기존 검사 다시 — 회귀 없음**

| 명령 | exit | 마지막 줄 |
|---|---|---|
| `python3 scripts/verify-article.py` | 0 | `OK` |
| `python3 scripts/selftest-verify-article.py` | 0 | `OK` |
| `python3 scripts/verify-concept-identity.py` | 0 | `OK` (WARN 은 전과 같다 — GOLD_UNPINNED 등, 0.2m 대기) |
| `python3 scripts/selftest-verify-concept-identity.py` | 0 | `OK` |
| `python3 scripts/verify-data-model.py` | 0 | `OK` (발행 검사에서 막히는 것 64 — 전과 같다) |
| `python3 scripts/selftest-verify-data-model.py` | 0 | `사본 86개 · OK` |
| `python3 scripts/verify-contract-coverage.py` | 0 | `OK` |
| `python3 scripts/verify-observed.py` | 0 | `PASS — 슬라이드 수·순서·본문 텍스트가 원본 HTML과 일치` |
| `python3 scripts/compare-reader-text.py` | 0 | `OK — 독자 글 불변` |
| `python3 scripts/lint-concepts.py` | **1** | `1 hits` — **이 Step 전에도 exit 1 이었다** (이 Step 의 파일을 치우고 돌려 확인). C-0002 ANALOGY L73 "지금" 한 건. 라이브러리는 건드리지 않았다 |

`verify-data-model` · `verify-concept-identity` 의 전체 출력은 0.2b · 0.2a 로그와 같다 — 이 Step 은 그 검사가 읽는 파일을 하나도 고치지 않았다 (`git status`: 새 파일 넷뿐).

### 남은 일
- **게이트** — _open 5개 판정 (PM · 도윤)
- 0.2m — 계약 §15 (교정 기록 이전) · _open-1 판정 뒤 골든에 판 ID
- F-3 전 — 위 "프론트에 더 필요한 것" 1 · 2 · 3 · 4 · 6 · 7 · 9 · 10


---

## B-0.2c 게이트 반영 (D30) · 2026-10-09

초안은 통과했고 _open 5개는 모두 초안대로 정해졌다 (D30). 독자 운영은 D31 (OPEN)로 나갔다.

### 고친 것

| 파일 | 무엇 |
|---|---|
| `docs/contract/OBSERVATION.md` | §14 를 "판정됨 → D30"으로 닫고 본문의 `_open-N` 표시를 전부 판정으로 바꿈 (`grep -c "_open-"` = 0) · §7.4 — `response` · `is_correct` 자리 옮김이 판정으로 승인됨 · §3 — 계약은 "원장에 사람을 알아볼 값이 없다"까지, 나머지는 D31 · §12 — 배정표가 F-3 전에 있어야 한다 · **§13 미확인 셋을 §12 "F-3 전에 닫혀야 하는 것"으로 옮김**(장 안에서 끝까지 읽었는지 · 새로고침이 새 열람인가 · 시험 줄 가르기 — 무엇이 정해져야 하는지와 언제까지인지만. 모양은 안 정했다) · §7.2 — 명제를 못 나누게 되는 순간은 첫 KnowledgeEvidence 줄 · §2.1 · §10 — ArticleRef 의 짝이 생김 · CHANGELOG |
| `docs/contract/DATA_MODEL.md` | ArticleRecord 에 `article_id`(UUID) · `article_version`(정수) — 타입 블록 · §11 · 불변식 26 · §15 ("무엇이 새 판을 만드나" 미확인, 저장 키는 D1) · CHANGELOG. **이번 한 번만 고쳤다 (지시)** |
| `docs/contract/ARTICLE_PACKAGE.md` | §2 · §10 의 "패키지 자체의 ID" 가 DATA_MODEL §11 을 가리키는 한 줄씩 · CHANGELOG. 규칙은 안 바뀜 |
| `scripts/verify-data-model.py` | ArticleRecord 필수 칸에 둘 추가 · 시험 사본에 시험용 키 · 불변식 26 (`RECORD_KEY`) · 골든에 두 칸이 없으면 `ARTICLE_ID_PENDING` WARN ("0.2m 대기") |
| `scripts/selftest-verify-data-model.py` | 사본 3 추가 (86 → 89) |
| `scripts/verify-observation.py` | ArticleRef 의 두 칸이 DATA_MODEL ArticleRecord 에 같은 이름으로 있는가 (`CONTRACT_PAIR`) |
| `scripts/selftest-verify-observation.py` | 사본 1 추가 (77 → 78) · CHANGELOG 사본이 두 행을 다 바꾸게 |

골든 · 라이브러리 · `correction-log.csv` · `apps/` 는 고치지 않았다. 골든에 판 ID 를 넣지 않았다 (0.2m).
계약에 숫자(시간 · 개수 · 기준값)를 더하지 않았다. probe 를 놓는 자리 · 넘기는 방향에 기대는 내용도 없다 — §12 의 "D26 이 정해진 뒤"는 **언제**만 말한다.

### 판정이 계약의 어디에 들어갔나

| D30 | 계약 |
|---|---|
| _open-1 `article_id` + `article_version` | DATA_MODEL §1 · §11 · 불변식 26 / OBSERVATION §2.1 · §10 / ARTICLE_PACKAGE §2 · §10 |
| _open-2 응답은 ProbeResponse 에 | OBSERVATION §7.4 (승인) · §14 |
| _open-3 원장에는 뜻 없는 UUID 만 | OBSERVATION §3 · §12 → D31 |
| _open-4 타입에 넣지 않는다 · 배정표 | OBSERVATION §12 → D31 |
| _open-5 여섯 값 | OBSERVATION §8.3 · §15-6 |
| PM-1 미확인 셋 → F-3 전 | OBSERVATION §12 (표) · §5.4 · §13 에서 뺌 |
| PM-2 명제를 못 나누게 되는 순간 | OBSERVATION §7.2 · §12 |
| PM-3 0.2m 으로 | 그대로 — 골든 발급은 WARN 으로 보인다. VOLATILE 앞뒤 · Goal 타입은 계약에 넣지 않았다 (지시 밖) |

### 검증

모든 명령은 저장소 루트에서.

**1. `python3 scripts/verify-observation.py`** — exit 0
```
verify-observation
  계약   docs/contract/OBSERVATION.md — 타입 15 · 칸 105
  실물   correction-log.csv 14행 → CorrectionEntry — gate {'None': 12, 'GATE_3': 2} · caught_by {'ARTIFACT_COMPARE': 7, 'PLAIN_READING': 3, 'AUTOMATED_CHECK': 4}
         target {'ARTICLE': 9, 'CONCEPT': 7} · Replacement 6 · type_note 3 · time_spent_min 적힌 행 0
  골든   basic block_decisions — C-0001@1 FULL · C-0002@3 FULL · C-0003@1 SKIP · C-0005@3 SKIP
  골든   advanced block_decisions — C-0001@1 SKIP · C-0002@3 SKIP · C-0003@1 SKIP · C-0005@3 REFRESHER
  시험 원장 (가짜 독자 1) — plan 2 · 읽기 사건 13 · 물음 2 · 노출 3 · 응답 2 · 증거 3
         계산 — 완독 True · 멈춘 장 ('basic', 3) · 가장 멀리 {'basic': 3, 'advanced': 4} · 전환으로 떠난 레벨 ['basic', 'advanced']

OK
```

**2. `python3 scripts/selftest-verify-observation.py`** — exit 0 (마지막 줄 · 새 사본)
```
PASS  [contract] CHANGELOG 행 삭제 → ['CONTRACT_CHANGELOG']
PASS  [others] D30 — DATA_MODEL ArticleRecord 에서 article_version 이 사라짐 → ['CONTRACT_PAIR']
사본 78개 + 계산 1 · OK
```
실패 행 없음 (`grep -c '^FAIL'` = 0).

**3. `python3 scripts/verify-data-model.py`** — exit 0 (요약 · WARN · 마지막 줄)
```
verify-data-model
  계약   docs/contract/DATA_MODEL.md
  실물   브리프 3 — 사실 타입 30종 · FOMC 사실 38 · DC 5
         골든 — 대기 13 ({'Bridge': 2, 'DerivedClaim': 5, 'Fact 승격': 1, 'Fact 출처': 5}) · 시간 조각 29 ({'DERIVED': 18, 'VOLATILE': 11}) · 인용 2
         끊긴 F 연결 — DC 있는 claim 17 · 대기 claim 4 · bridge 2 · 그 밖 1
  시험 사본 — Fact 38 · Claim 5 · Bridge 1 · Source 8 · 시간 조각 29
         발행 검사에서 막히는 것 64 — CHECK_NO_FACTS 1 · CLAIM_UNCHECKED 2 · DERIVED_INPUT_NO_FACT 4 · DERIVED_UNVERIFIED 1 · FACT_NOT_YET_PUBLIC 9 · FACT_NO_PRIMARY 9 · FACT_NO_SOURCE_SPAN 25 · QUOTE_NO_COMMON_SOURCE 2 · REFS_PENDING 11

  WARN  ARTICLE_ID_PENDING: 골든에 article_id · article_version 이 없다 — 0.2m 대기 (§11 · D30)

OK
```
발행 검사에서 막히는 것 64 — 전과 같다. WARN 은 `ARTICLE_ID_PENDING` 하나가 늘었다 (0.2m 대기).

**4. `python3 scripts/selftest-verify-data-model.py`** — exit 0 (새 사본 · 마지막 줄)
```
PASS  [contract] D30 — ArticleRecord.article_id 삭제 → ['CONTRACT_FIELD']
PASS  [model] 불변식 26 — ArticleRecord 의 article_id 가 code 문자열 → ['RECORD_KEY']
PASS  [model] 불변식 26 — ArticleRecord 에 article_version 이 없다 → ['RECORD_KEY']
사본 89개 · OK
```

**5. 나머지 — 회귀 없음**

| 명령 | exit | 마지막 줄 |
|---|---|---|
| `python3 scripts/verify-article.py` | 0 | `OK` |
| `python3 scripts/verify-concept-identity.py` | 0 | `OK` (WARN 은 전과 같다) |
| `python3 scripts/verify-contract-coverage.py` | 0 | `OK` |
| `python3 scripts/selftest-verify-article.py` | 0 | `OK` |
| `python3 scripts/selftest-verify-concept-identity.py` | 0 | `OK` |
| `python3 scripts/compare-reader-text.py` | 0 | `OK — 독자 글 불변` |

### 남은 일
- 0.2m — 골든에 `article_id` · `article_version` 발급 (`ARTICLE_ID_PENDING` 이 사라진다) · 계약 §15 교정 기록 이전
- F-3 전 — OBSERVATION §12 의 개정 셋 (D26 뒤) · D31
