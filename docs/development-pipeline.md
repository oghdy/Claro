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
- 게이트에서 사람이 고친 것은 전부 `logs/correction-log.jsonl` 에 (§10.3) — 3개월 뒤 무엇을 자동화할지의 근거다

## Phase 1 의 끝
파이프라인이 **최신 사건 하나**로 기사 한 판을 만들고, 그 기사가 FOMC 골든과 같은 검사를 통과하고, 그 기사로 실제 독자 테스트(F-3 — D37 의 화면 · 물음 구조를 그대로)를 한다.
독자 반응을 본 뒤에 정하는 것: 글쓰기 틀 · 기사당 레벨 수 (D21) · 개인화 (D39).

## Step
| Step | 내용 | 스테이지 (§7) | LLM | 상태 |
|---|---|---|---|---|
| P-1 | **원문 저장 · 해시 · span** — FOMC 골든의 출처 31 을 실제로 저장하고, 구절 69개의 글자 위치를 기계가 찾는다. 권리 대장 | 1 · 2 (기계 부분) | 없음 | ☑ 2026-10-30 — PM 검수 대기 (`logs/pipeline/P-1.md` · 저장 17 · 못 가져옴 14 · 구절 82 중 찾음 34 · 기계 검증용 55 → 26) |
| P-2 | 사건 선정 (게이트 1 — 도윤) + 그 사건의 1차 자료 수집 · 저장 | 0 · 1 | 없음 / 약간 | ☐ |
| P-3 | 사실 추출 + span → Deep Fact Graph 초안 | 2 · 3 | 있음 | ☐ |
| P-4 | Coverage 슬롯 점검 · 스토리라인 상태 | 4 · 5 | 있음 | ☐ |
| P-5 | Derived Claim + 반증 후보 (빈 슬롯은 재수집) | 6 | 있음 | ☐ |
| P-6 | 요점(Goal) 후보 → 게이트 2 (도윤) | 7 | 있음 | ☐ |
| P-7 | KC 역산 · 사실 선택 · 집필 · 레드팀 · 블록 분할 → 계약 패키지 → 검사 → 게이트 3 | 8 ~ 13 | 있음 | ☐ |
| — | 그 기사로 F-3 (D37 구조) | | | ☐ |

**도윤이 준비할 것 (P-3 전)**: Claude API 키 — 비밀 값이다. 채팅에 붙이지 않고 `apps/web/.env.deploy` 처럼 git 밖 파일에. 사용 한도를 걸어 둔다.

---

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
