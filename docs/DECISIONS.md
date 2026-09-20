# DECISIONS

결정 로그. append-only. 수정하지 말고 새 항목으로 뒤집는다.
D1~D7은 `docs/FINDINGS.md` §12.1에서 이월.

| ID | 항목 | 상태 |
|---|---|---|
| D1 | 기술 스택 전반 | OPEN — Step 0.3에서 결정 |
| D2 | 모델 배치 (단계별 강/약) | OPEN — 토큰 측정 후 |
| D3 | 사건 선정 주체 | OPEN |
| D4 | MVP 개인화 범위 | OPEN |
| D5 | 정치 층 처리 방침 | OPEN |
| D6 | 발행 시각 | OPEN |
| D7 | Depth 컨트롤 노출 방식 | OPEN |
| D8 | volatility 값 집합 | **DECIDED** 2026-09-20 |

---

## D8 · volatility 를 2값에서 3값으로

**상태**: DECIDED · 2026-09-20
**배경**: FINDINGS §5.4는 `STABLE | VOLATILE` 2값. 픽스처에 "이란 전쟁 201일째"를
넣으려 하자 둘 중 어디에도 안 맞는다는 게 드러났다.

### 결정
```
STABLE     안 변함                        3.75~4.00%
DERIVED    STABLE fact에서 계산됨          201일째
VOLATILE   조회해야만 알 수 있음           48건 → as_of 필수
```

**규칙**
1. DERIVED 는 `published_at` 기준으로만 계산한다. `now()` 재계산 금지 —
   같은 ArticlePackage 가 읽는 시점마다 다른 값을 보이면 immutable 이 아니다 (§9.2 위반)
2. 따라서 **렌더 시점 계산은 없다.** 프론트는 `value_at_authoring` 을 출력한다.
   공식은 발행 시 1회 검증용으로만 존재한다
3. `recompute(published_at) == value_at_authoring` 은 회귀 테스트가 아니라 **불변식**이다.
   안 맞으면 즉시 실패
4. 전파: 소스 중 하나라도 VOLATILE 이면 DERIVED 를 쓸 수 없다. VOLATILE 로 강등
5. 유효성("아직 진행 중인가")은 Fact 의 속성이 아니다. `storyline_ref` 가 답하고,
   §6.2 `STORYLINE_STALE` 이 이미 담당한다

### 기각된 안
- `derived_from.open_while` — `storyline_ref` 를 다른 이름으로 중복 정의한 것.
  Fact 스키마에 storyline 생명주기를 밀어넣는다
- `now()` 재계산 / 열림·닫힘에 따른 시계 분기 — immutable 위반. 복잡도 3배인데
  해결하려는 문제는 storyline 장치가 이미 풀고 있다

### S3 로 넘기는 것
- `render` 함수 어휘를 enum 으로 닫는다. 단 (2)에 따라 프론트가 구현할 어휘가
  아니라 파이프라인 내부 검증 함수명이므로, `ARTICLE_PACKAGE.md` 가 아니라
  `DATA_MODEL.md` 소관일 가능성이 높다. S3 가 확인할 것
- `derived_from` 의 정확한 필드 구조

### invalid fixture
- `volatile-missing-asof.json` (S2) · `derived-from-volatile.json` (S2)
- `merged-without-target.json` (S4) · `conflicting-alias-collapse.json` (S4)
  → 아래 둘은 CONCEPT_IDENTITY 가 없으면 쓸 수 없다. S2 에 주지 마라

### 메타
스키마를 먼저 만들었으면 마이그레이션이었을 것을, 픽스처를 쓰려다 발견했다.
Step 0.0(픽스처 선행) 결정의 첫 실증 사례.

---

## D9 · 골든 픽스처에 알려진 결함을 남기지 않는다

**상태**: DECIDED · 2026-09-20

골든 픽스처는 (a) 프론트 렌더 대상 (b) 파이프라인 diff 대상 (c) 계약 도출 원천
셋 다 "이게 정답"을 전제한다. 알려진 위반을 남기면 파이프라인이 같은 위반을 했을 때
diff 가 "일치"라고 말한다. 결함이 정답의 정의가 된다.

→ 골든은 깨끗하게. 위반 데이터는 `fixtures/invalid/` 에 별도 파일로.
→ 스키마 Task 완료 조건인 "제약 위반 데이터가 거부되는지"가 이것으로 검증된다.

---

## D10 · 세션 경계는 게이트 경계에 맞춘다

**상태**: DECIDED · 2026-09-20

Phase 단위는 너무 크다. Step 단위로 하되, Step 을 이렇게 정의한다.

> **Step = (1) 게이트를 안 넘고 (2) 읽을 계약이 고정돼 있고
> (3) 끝나면 검증 가능한 산출물이 남는 최대 단위**

세션이 작업 중간에 결정을 만나면 멈추거나 스스로 정한다. 후자가 §9.5 의 조용한 부패다.
게이트에서 끊으면 이 상황이 안 생긴다. 애매하면 잘게 자른다.

**S2~S4 프롬프트를 미리 쓰지 않는다.** 아직 모르는 스키마를 가정하게 되고,
S1 이 끝나면 다시 써야 한다. S1 산출물을 보고 쓴다.
