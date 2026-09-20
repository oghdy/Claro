# Claro

뉴스와 독자 사이의 지식 거리를 없애는 서비스. 요약 서비스가 아니다.

## 시작 전 읽을 것
- 모든 세션: 이 파일 + `docs/FINDINGS.md` §1(본질), §15(잊지 말 것)
- 백엔드: `docs/contract/` 전체
- 프론트: `docs/contract/ARTICLE_PACKAGE.md` + `fixtures/`
- 자기 레인의 `docs/development-*.md`에서 배정된 Step 확인

## 읽지 말 것
- `docs/findings/deprecated/` — 폐기된 초기 문서. 낡은 정보다.

## 절대 하지 말 것 (FINDINGS §14 / §9.6)
아래는 "설계 미완"이 아니라 **의도적 보류**다. 구현도 설계도 하지 마라.
- Beta 분포, forgetting half-life, graph propagation, Explanation Need 공식
- evidence weight 값, SKIP/REFRESHER/FULL threshold
- 추상 `KnowledgeEstimator` 인터페이스 — 지식 상태 조회는 함수 하나, 호출 지점 하나
- shadow / A/B 인프라, 리뷰 큐 UI
- Resolver 임계값 하드코딩 (HIGH/AMBIGUOUS/LOW 구간만)

**미정 항목을 마주치면 임의로 정하지 말고 `docs/DECISIONS.md`에 OPEN으로 올리고 멈춘다.**
배정된 Step의 범위 밖으로 나가지 마라. 개선하고 싶은 게 보이면 적어두고 넘어가라.

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
