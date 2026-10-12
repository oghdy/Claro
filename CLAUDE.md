# Claro

뉴스와 독자 사이의 지식 거리를 없애는 서비스. 요약 서비스가 아니다.

## 시작 전 읽을 것
- 모든 세션: 이 파일 + `docs/FINDINGS.md` §1(본질), §15(잊지 말 것)
- 백엔드: `docs/contract/` 전체
- 프론트: `docs/contract/ARTICLE_PACKAGE.md` + `fixtures/`
- 자기 레인의 `docs/development-*.md`에서 배정된 Step 확인

## 읽지 말 것
- `docs/findings/deprecated/` — 폐기된 초기 문서. 낡은 정보다.
- `docs/PM.md` — PM 전용. 작업 세션이 스스로 발견해야 할 내용이 들어 있다.
  미리 읽으면 관찰이 아니라 받아쓰기가 된다.

## 절대 하지 말 것 (FINDINGS §14 / §9.6)
아래는 "설계 미완"이 아니라 **의도적 보류**다. 구현도 설계도 하지 마라.
- Beta 분포, forgetting half-life, graph propagation, Explanation Need 공식
- evidence weight 값, SKIP/REFRESHER/FULL threshold
- 추상 `KnowledgeEstimator` 인터페이스 — 지식 상태 조회는 함수 하나, 호출 지점 하나
- shadow / A/B 인프라, 리뷰 큐 UI
- Resolver 임계값 하드코딩 (HIGH/AMBIGUOUS/LOW 구간만)

**미정 항목을 마주치면 임의로 정하지 말고 `docs/DECISIONS.md`에 OPEN으로 올리고 멈춘다.**
배정된 Step의 범위 밖으로 나가지 마라. 개선하고 싶은 게 보이면 적어두고 넘어가라.

## 계약은 실물에서 도출한다
`docs/contract/*` 의 내용은 **상상으로 쓰지 않는다.** `fixtures/` · `docs/content/` 의 실물,
또는 `docs/FINDINGS.md` 에서 **"확정"** 으로 표시된 항목에서 도출한다 (D24). 둘 다 아니면 "미확인"이다.
FINDINGS 의 "미정" · "보류" · "결정 필요"는 원천이 아니다.
빈 껍데기인 계약 파일을 보고 "설계가 덜 됐네" 하고 채우지 마라. 채울 Step이 따로 있다.

## 계약 규칙
- 계약 파일(`docs/contract/*`)은 백엔드 세션만 쓴다. 프론트는 읽기 전용
- 한 타입은 정확히 한 파일에만 정의한다. 복제 금지
- 수정 시 파일 상단 CHANGELOG에 날짜 + 한 줄 필수

## 픽스처 규칙
- `fixtures/*.json` — 골든. **깨끗해야 한다.** 알려진 위반을 넣지 마라
- `fixtures/invalid/*.json` — 일부러 위반. 스키마가 **거부해야** 정상

## Step 끝낼 때
1. 검증 명령 실행. **결과를 로그에 붙인다.** "통과했습니다"만 쓰지 마라
2. `logs/{레인}/` 에 엔트리 append
3. `docs/development-*.md` 체크박스 + 완료일
4. 커밋. 메시지 접두사 = Task ID (예: `B-0.1.1`)

## 같은 작업 트리에서 여러 세션이 동시에 일한다
- `git add -A` · `git add .` 금지. **파일을 하나씩 지정**한다. 커밋 전 `git status` 로 남의 미커밋 파일을 확인하고 건드리지 않는다
- **커밋도 파일을 지정한다: `git commit -m "…" -- <파일들>`.** 그냥 `git commit` 은 스테이지에 올라가 있는 것을 전부 싣는다 — 다른 세션이 `git rm` · `git mv` · `git add` 해 둔 것까지 (2026-10-12 에 실제로 일어났다)
- `git stash` · `git pull --rebase --autostash` · `git checkout -- <폴더>` · `git reset --hard` 금지 — 다른 세션이 고치는 중인 파일을 치우거나 되돌린다.
  push 가 거절되면 `git pull --no-rebase` (merge) 로 받는다
- 교정 기록은 `logs/correction-log.jsonl` 에 쓴다. `logs/correction-log.csv` 는 얼렸다
