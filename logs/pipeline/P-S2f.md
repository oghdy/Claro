# logs/pipeline · P-S2f — Fable 대조군: 같은 새 프롬프트, 글 모델만 바꿔서 (D101 PS2-f)

## P-S2f · 2026-11-15 · 서브에이전트 · 검수 대기 (PM)

**작업 세션 모델: Opus 5.5** (`claude-opus-5-5`). 코드 안 모델: 대조 글 = Fable 5.2 medium (한 번 · 배치) · 함의 = 부르지 않음 (볼 글 0). **이 Step 0.149 달러 → P-S2 0.629 / 상한 1.** `docs/PM.md` 안 읽음 · 새 원문 받기 0 · 프롬프트 0자 · 옛 `short*.ts` · 옛 `shorts/license-notice/` · apps/web · 계약 · 골든 · `llm.ts` · `episode*.ts` 0줄 · PM 의 `license-notice-flow/` (human.json · story.json · review.json · sheet.md) · `logs/correction-log.jsonl` 0줄.

> **이 로그는 짝을 밝힌다** — X · Y (`logs/pipeline/P-S2f/X.md` · `Y.md`)를 먼저 읽고 여기로. 짝은 `logs/pipeline/P-S2f/key.json` 에도 있다.

---

## 한 장 요약

| | |
|---|---|
| **결과** | **Fable 의 첫 출력이 비었다.** 같은 요청 (system · user · schema · effort · max_tokens · 판이 글자 단위로 같고 model 만 다름)에 Fable 은 뼈의 줄기 후보 다섯 줄 (`stems[0..4]`)만 쓰고 `rows: []` 로 끝냈다 (`stop_reason` `end_turn` · 출력 토큰 3,804 가운데 보이는 글 511자). 표지 · 흐름 · 남음이 없다 → 계약 검증 실패 7 (`STRING_EMPTY`) · 줄 문제 31 · 읽는 길 0자 |
| **짝** | **X = Fable (`license-notice-flow-fable`) · Y = Sonnet (`license-notice-flow` /3 첫 출력)** — 동전 `secrets.randbelow(2)` = 1 |
| **눈 가린 통독** | **서지 않는다** — 한쪽 (X)이 비었다. X · Y 파일은 지시대로 같은 꼴로 냈다 (X 는 빈 줄 그대로 + 비었다는 한 줄) |
| **다시 불렀나** | **아니다** — 지시가 "글 부르기 한 번 · 견줄 것은 첫 출력"이다. 다시 부를지는 PM (PS2f-a · 값 ≈ 0.15 + 함의 ≈ 0.08 → Step ≈ 0.86 / 1) |
| **기본 동작** | `write_model` 칸이 없으면 지금 그대로 — `license-notice-flow` 의 글 요청 지문이 P-S2 /3 출력을 낸 요청과 같다 (`02a40d56…`) · human.json 없이 다시 지은 story · review 가 바꾸기 전 · 뒤 · `ce1af9d` 셋 다 글자 단위로 같다 |

---

## ① 바꾼 코드 — 칸 하나 (`packages/pipeline/src/short-flow.ts`)

- 사람 입력 `data/shorts/<code>.json` 에 **`write_model?`** (고를 수 있는 칸). `FlowInput` 에 한 줄.
- `writeModelOf(input)` → `{ write, repair }` — 칸이 없으면 `FLOW_MODELS.write.model` · `FLOW_MODELS.repair.model` 그대로. 있으면 **글과 고치기가 함께** 그 모델로. 가격을 모르는 모델 (`llm.ts PRICE` 에 없음)은 `loadFlow` 에서 멈춘다 (부르기 전에).
- 쓰는 곳 셋: `writeReq` 의 model · `repairReq` 의 model · `storyFile` 의 `made_by` 글 (고치기 모델 이름). effort · max_tokens · 함의 (`FLOW_MODELS.entail` — Opus low) · 원장 꼴 · raw 이름 규칙은 그대로.
- **고치기도 따라가게 한 까닭**: 고친 글은 글 사이에 끼워지는 독자 글이다 — 한 편 안에서 결이 섞이지 않게. P-S2 ③ 이 고치기를 Opus → Sonnet 으로 둔 까닭 ("독자가 읽는 글을 내는 단계라서")과 같다. 이번 대조 판은 고치기를 부르지 않았다 (지시).
- 새 입력 `data/shorts/license-notice-flow-fable.json` — `license-notice-flow.json` 과 읽는 칸 (event · pick · docs · cite_label)이 글자 그대로 같고 `code` · `write_model: "claude-fable-5-2"` 둘만 다르다 (+ 사람 메모 `_p_s2f`).
- 시험 (`test/short-flow.test.ts` +4): 칸 없음 = FLOW_MODELS · 칸 있음 = 글 · 고치기 함께 · 모르는 모델 멈춤 / `license-notice-flow` 글 요청 지문 = 저장된 /3 의 `request_sha256` / 걸린 덩이가 있을 때 고치기 요청의 모델만 바뀌고 나머지 요청은 같다 / 대조군 입력 · 글 요청이 model 하나만 다르고 저장된 Fable 출력이 그 요청에서 나왔다 · 함의 모델 그대로.

### 기본 그대로인 증거 — human.json 없는 입력으로 다시 짓기 (시험 · 바꾸기 전 / 뒤)
PM 이 `license-notice-flow/human.json` 을 넣는 중이라 `build()` 는 그것을 읽는다. 그래서 human = null 로 짓는 작은 스크립트 (`build` 와 같은 차례 — 저장된 글 · 고치기 · 함의 판정 · `review`)를 바꾸기 **전**에 한 번, **뒤**에 한 번 돌려 출력 (글 요청 지문 · story 본문 · review)을 댔다.
```
$ node nohuman.ts license-notice-flow > nohuman.before.json      # 바꾸기 전
  write_request: claude-sonnet-5-5 · medium · 24000 · short-flow-write/3
    request_sha256 02a40d56220e918071acee687b9ac53cb91a0e8054631aa73db45a07b5a81026
    system_sha256  d5934cd88cf5282580e5d85b57c682db7ff3ca8f933b3a6e6a34f575f54755cf
    user_sha256    293de879cffd855682b5a13c71699a76e1a1478227479d1341dbed0d6f092c6b
  stored /3 raw request_sha256 02a40d56220e918071acee687b9ac53cb91a0e8054631aa73db45a07b5a81026
  story == ce1af9d story.json 본문 (_source 뺌): True
  review == ce1af9d review.json: True
$ node nohuman.ts license-notice-flow > nohuman.after.json       # 바꾼 뒤
$ cmp nohuman.before.json nohuman.after.json
cmp: before == after (byte-identical)
d0016f86931f71d0bcfcd84d539cb369906cd8d834ce7d7df37c05385e824a22   (전)
d0016f86931f71d0bcfcd84d539cb369906cd8d834ce7d7df37c05385e824a22   (뒤)
```
→ 이 칸 때문에 `license-notice-flow` 의 다시 짓기 결과는 한 글자도 안 바뀐다. (지금 `--check` 가 "다르다"인 것은 PM 의 human.json 때문 — 아래 검증.)

---

## ② 같은 요청인가 — system · user 해시 · 모델만 다름

```
$ node reqcmp.ts
 license-notice-flow       claude-sonnet-5-5 · medium · 24000 · short-flow-write/3
   system d5934cd88cf5282580e5d85b57c682db7ff3ca8f933b3a6e6a34f575f54755cf
   user   293de879cffd855682b5a13c71699a76e1a1478227479d1341dbed0d6f092c6b
   schema 8799b8b02a82e8684c02bed2c62f5553ecf10d6360fd917f1bcd839455e80ece
   request_sha256 02a40d56220e918071acee687b9ac53cb91a0e8054631aa73db45a07b5a81026
 license-notice-flow-fable claude-fable-5-2 · medium · 24000 · short-flow-write/3
   system d5934cd88cf5282580e5d85b57c682db7ff3ca8f933b3a6e6a34f575f54755cf
   user   293de879cffd855682b5a13c71699a76e1a1478227479d1341dbed0d6f092c6b
   schema 8799b8b02a82e8684c02bed2c62f5553ecf10d6360fd917f1bcd839455e80ece
   request_sha256 4e15a38558a7492803118ae1d9b28c8ae8ada2b7d81add82f2ebfe61b8c9dfe9
다른 칸: model, request_sha256
Fable 요청의 model 만 Sonnet 으로 되돌린 request_sha256 == Sonnet 요청: true
Sonnet 요청 == 저장된 /3 출력의 request_sha256: true
```
- 저장된 두 raw 의 `input_sha256` (user) 도 같다: `293de879…` (Sonnet `write.claude-sonnet-5-5.medium.02a40d56220e.json` · Fable `write.claude-fable-5-2.medium.4e15a38558a7.json`).
- **다른 것 하나 더 — 길**: Sonnet /3 은 즉시 (P-S2 가 바로 읽으려고) · Fable 은 **배치**. 까닭: 즉시 추정 0.60 → 0.480 + 0.60 이 멈춤 0.95 를 넘어 `callMany` 가 보내지 않는다. 배치 · 즉시는 같은 `requestParams` 를 보낸다 (길은 요청 지문에 들지 않는다) — 출력의 분포를 바꾸지 않는다.
- 함의 요청 (`FLOW_MODELS.entail` — Opus low · `short-flow-entail/1`)은 그대로다. 이번에는 볼 글이 0 이라 부르지 않았다.

---

## ③ 잰 값 — 두 첫 출력 (고치기 · 사람 손 전 · 같은 셈)

| | **Y = Sonnet 5.5** (`license-notice-flow` /3 첫 출력) | **X = Fable 5.2** (`license-notice-flow-fable` 첫 출력) |
|---|---|---|
| 출력 | 뼈 32 줄 · 글 23 줄 (JSON 5,855자) | **뼈 5 줄 (`stems[0..4]`) · 글 0 줄** (JSON 511자) |
| 끝난 까닭 · 출력 토큰 | `end_turn` · 7,856 | `end_turn` · 3,804 (보이는 글 511자 — 나머지는 생각으로 본다) |
| 줄 문제 (`parseFlow`) | 0 | **31** (빈 뼈 · 빈 줄 · 값이 enum 밖) |
| `validateFlowStory` | **통과** (알림 0 · 덩이 10 · 뼈 `first_thought → breaker → name → flip → land` · 고르기 0 · 낱말 1 · 구절 10) | **실패 7** — `STRING_EMPTY` `/voice_labels/official` · `/cover/{title,dek,meta,ask}/t` · `/keep/{line,whose}/t` |
| 함의 (Opus low · 위험한 글) | 12 / 12 판정 · **걸림 3** (`flow[9].text` UNDER_SOURCED · `keep.line` UNDER_SOURCED · `keep.words[0].body[0]` EXCEEDS) · NEEDS_CONTEXT 1 | 위험한 글 **0** — 부르지 않음 |
| 기계 알림 (`flowNotices`) | **5** (말투: "재결" · "당사자" ×2 · "밝혔다" (헛짚음) · "에 따르면") | **4** (단추가 물음으로 안 끝남 · `about` 이 news 가 아님 · 글 문단 0 · 낱말 0 — 다 빈 출력 탓) |
| 글자 (읽는 길 빈칸 뺌 + 접힌 낱말 카드) | **1,012 + 125** · 덩이 10 (글 문단 8) | **0 + 0** · 덩이 0 |
| 비용 — 글 | 0.1151 (즉시 · 입력 2,143 · 캐시 쓰기 12,888 · 출력 7,856) | **0.1491** (배치 · 입력 2,143 · 캐시 쓰기 12,888 · 출력 3,804) |
| 비용 — 함의 | 0.0790 (배치 · 12 건 · P-S2 에서) | 0 |
| 비용 — 한 편 첫 출력까지 | 0.194 | 0.149 (쓸 수 있는 글 없음) |

- Fable 의 다섯 줄기 후보는 Sonnet 의 것과 같은 재료다 (날짜의 차례 · ㄱ씨 이틀 · ㄴ씨 같은 날 · ㄷ씨 열하루 · 동의 표시). 그 뒤 `chosen` 부터 끝까지가 없다.
- **비용 견줌 (같은 길로 바꿔 본 값)**: Fable 글을 즉시로 불렀다면 0.298 · Sonnet /3 을 배치로 불렀다면 0.058. 입력은 같으므로 차이는 값표 (입력 4배 · 출력 4배)와 출력 길이에서 온다. 정상 출력이 Sonnet 만큼 (≈ 7,900 토큰)이었다면 Fable 배치 ≈ 0.23.
- `story.json` · `review.json` (`license-notice-flow-fable/`)은 짓기 명령의 결과 그대로 커밋한다 (막힘 38 · 낼 수 있나 false). `sheet.md` 는 만들지 않았다 (대조 판은 사람 확인을 하지 않는다).

### 원장 (P-S2f 가 더한 줄 — 하나)
`data/p3-calls.jsonl` +1 — `step P-S2` · `license-notice-flow-fable:FLOW-WRITE` · `claude-fable-5-2` medium · `short-flow-write/3` · `request_sha256 4e15a385…` · 배치 `msgbatch_012sbiwH8Q7DBT6htcw1WPor` · `cost_usd 0.149092`. 줄 전체는 `key.json` 에.

---

## ④ _open

| # | 무엇 | 지금 | 누가 |
|---|---|---|---|
| **PS2f-a** | **Fable 첫 출력이 비어 눈 가린 통독이 서지 않는다.** 같은 요청을 한 번 더 부를지 — 값 ≈ 0.15 (배치) + 함의 ≈ 0.08 → Step ≈ 0.86 / 1. 부르면 견줌은 "첫 출력"이 아니라 "첫 쓸 만한 출력"이 된다 (Sonnet 은 /1 · /2 · /3 셋 다 첫 번에 계약을 넘었다 — 그것도 견줄 값이다) | 지시 ("한 번")대로 다시 부르지 않았다 | **PM** |
| PS2f-b | **다시 부를 때의 함정** — raw 파일 이름이 `write.<모델>.<effort>.<요청 지문 12자>` 라 **같은 요청을 다시 부르면 첫 출력 파일을 덮어쓴다**. 원장 줄은 남지만 `verify-ledger` 는 raw → 원장만 대 보므로 조용히 사라진다. 다시 부르기 전에 첫 파일을 옮기거나 (`readRaws` 는 이름이 아니라 `called_at` 으로 줄 세운다 — 예: `….try1.json`) `saveRaw` 이름에 차례를 붙인다 (이 Step 밖이라 고치지 않았다) | 그대로 | PM (다시 부르면 그 세션) |
| PS2f-c | **출력 모양이 이른 끝을 막지 않는다** — `FLOW_WRITE_SCHEMA` 는 줄의 목록 둘 (`bone` · `rows`)이고 최소 수 · 빠진 줄을 스키마가 막지 않는다 (줄 문제는 짓기에서 잡아 막힘으로 사람에게 간다). Sonnet 3/3 은 다 채웠고 Fable 1/1 은 뼈 다섯 줄에서 끝났다 — 모양 탓인지 모델 탓인지는 n = 1 로 못 가른다. 하루 돌리기에서는 "줄 문제 > 0 이면 글을 다시 부른다" 같은 길이 있을 수 있다 (프롬프트 · 모양을 고치는 것은 이 Step 밖) | 그대로 | PM |
| PS2f-d | **P-S2 실물 시험 둘이 지금 실패한다** — `저장한 출력에서 다시 지으면 story.json 과 같다` · `확인지 …` (`not_judged` 10). 둘 다 PM 의 **미커밋 `human.json`** 을 `build()` 가 읽어서다 (사람 고친 글 → story 가 파일과 다름 · 고친 글의 함의가 아직). human = null 로는 바꾸기 전 · 뒤 · `ce1af9d` 가 글자 단위로 같다 (①). PM 이 human.json · 다시 지은 story/review (+ 고친 글 `--entail-call`)를 커밋하면 풀린다 | 이 Step 은 그 파일을 안 건드렸다 | PM |
| PS2f-e | **눈가림의 한계** — PM 은 D101 에서 Sonnet /3 (고치기 뒤 판)을 이미 읽었다. Y 는 고치기 전 판이라 몇 곳 ("세 건이" · "사건 셋이" · 낱말 카드 풀이)이 다를 뿐 거의 같다. 다음 대조에서 눈가림을 지키려면 PM 이 읽지 않은 글끼리 (둘 다 새로 부른 출력) 견줘야 한다 | — | PM |
| PS2f-f | 고치기 모델이 `write_model` 을 따라가게 한 판단 (①) · 대조 입력에 사람 메모 `_p_s2f` 한 칸 · 대조 판의 story/review 를 커밋한 것 | 그렇게 했다 | PM (수용 여부) |
| PS2f-g | `pnpm --filter @claro/pipeline test` 첫 판에서 `p3.test.ts` "두 번 지으면 글자 단위로 같다"가 시간 초과 (5,155ms > 5,000) — 다른 세션이 함께 돌 때. 혼자 돌리면 19 / 19 · 다시 돌린 전체에서도 통과. 이번 바꿈과 무관 | 그대로 | — |

---

## 파일
- `packages/pipeline/src/short-flow.ts` (칸 `write_model` · `writeModelOf` · 쓰는 곳 셋)
- `packages/pipeline/test/short-flow.test.ts` (+4 시험)
- `packages/pipeline/data/shorts/license-notice-flow-fable.json` (대조 입력)
- `packages/pipeline/data/events/ACRC-20261028-LICENSE-NOTICE/shorts/license-notice-flow-fable/` — `raw/write.claude-fable-5-2.medium.4e15a38558a7.json` · `story.json` · `review.json`
- `packages/pipeline/data/p3-calls.jsonl` (+1)
- `logs/pipeline/P-S2f/X.md` · `Y.md` · `key.json` · 이 로그 · `docs/development-pipeline.md` (P-S2f 줄)

## 검증 (붙인 그대로 · 2026-11-15)
```
$ pnpm --filter @claro/pipeline test
 ❯ test/short-flow.test.ts (19 tests | 2 failed)
     × 저장한 출력에서 다시 지으면 story.json 과 같다 · … (PM 의 미커밋 human.json — PS2f-d)
     × 확인지 — … 사람이 넘기기 전에는 낼 수 없다 (같은 까닭 — not_judged = 사람 고친 글)
 Test Files  1 failed | 13 passed (14)
      Tests  2 failed | 173 passed (175)       ← 앞 171 + P-S2f 4 (새 4 개는 다 통과)
 (첫 판: p3.test.ts 시간 초과 1 — 혼자: Tests 19 passed (19) · PS2f-g)

$ pnpm -s typecheck
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
typecheck exit 0

$ node src/short-flow.ts license-notice-flow-fable          # 새 code — validateFlowStory
short-flow license-notice-flow-fable — 글 claude-fable-5-2 · 덩이 0 (글 문단 0) · 글 덩이 6 (근거 있는 것 0 · 위험한 글 0) · 구절 0 / 18 · 읽는 길 0자
  계약 검증 실패 7 · 알림 0 · 함의 본 글 0 (걸림 0 · 아직 0) · 막힘 38 · 기계 알림 4 · 낼 수 있나 false
    /voice_labels/official STRING_EMPTY: 비었거나 글자열이 아니다
    /cover/title/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    /cover/dek/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    /cover/meta/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    /cover/ask/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    /keep/line/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    /keep/whose/t STRING_EMPTY: TextBody 이 비었거나 글자열이 아니다
    write 줄: 빈 뼈 chosen
    write 줄: 빈 뼈 chosen_why
    write 줄: 빈 뼈 dropped[i]
  … (줄 문제 31 · 알림 4)
$ node src/short-flow.ts license-notice-flow-fable --entail-call --step P-S2 --budget 1
short-flow license-notice-flow-fable --entail-call — 볼 글이 없다 (저장된 판정이 전부 지금 글 · 앞 덩이와 같다)
$ node src/short-flow.ts license-notice-flow-fable --check
short-flow license-notice-flow-fable --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
$ node src/short-flow.ts license-notice-flow --check
short-flow license-notice-flow --check — 다르다: …/license-notice-flow/story.json · …/license-notice-flow/review.json   ← PM 의 human.json (human = null 로는 같다 — ①)
$ node src/short.ts license-notice --check
short license-notice --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)

$ node src/short-flow.ts license-notice-flow-fable --write-call --step P-S2 --budget 1     # 글 부르기 한 번
short-flow license-notice-flow-fable --write-call — short-flow-write/3 · claude-fable-5-2 · medium · 구절 18 · 입력 15031 토큰 · 넉넉한 추정 $0.30 (배치) · Step "P-S2" $0.480 / $1
  배치 msgbatch_012sbiwH8Q7DBT6htcw1WPor — ended · 끝 1 · 오류 0 · 78초
  write.claude-fable-5-2.medium.4e15a38558a7: claude-fable-5-2 입력 2143 (캐시 쓰기 12888 · 읽기 0) · 출력 3804 · 79초 · $0.149 (배치)

$ python3 scripts/verify-ledger.py --report
verify-ledger: 장부 958 줄 (배치 355) · 합 $31.18 · 저장 출력 939
  P-S1   $  0.439 / 상한 3 · 부르기 18 (배치 12)
  P-S2   $  0.629 / 상한 1 · 부르기 20 (배치 16)
OK (ERROR 0 · WARN 0)

# 커밋 9076aa5 를 깨끗이 꺼낸 곳 (git worktree · PM 의 미커밋 human.json 없음)에서 — PS2f-d 의 두 실패가 이 Step 탓이 아님을 본다
$ git worktree add --detach <scratch>/wt HEAD && pnpm install --offline --frozen-lockfile
$ pnpm --filter @claro/pipeline test
 Test Files  1 failed | 13 passed (14)
      Tests  156 passed (156)
 FAIL  test/p3.test.ts — Error: SP-HAM-1012: 원문이 이 기계에 없다 (cache) — p2 를 먼저 돌린다   ← git 밖 캐시가 없는 곳이라 (이 Step 과 무관)
$ npx vitest run test/short-flow.test.ts
 Test Files  1 passed (1)
      Tests  19 passed (19)       ← P-S2 실물 둘 · P-S2f 넷 다 통과
$ git worktree remove --force <scratch>/wt
```
