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
| D8 | volatility 값 집합 | OPEN — 아래 |

---

## D8 · volatility 를 2값에서 3값으로

**상태**: OPEN
**제기**: 2026-09-20, 픽스처 역산 준비 중
**배경**: FINDINGS §5.4는 `STABLE | VOLATILE` 2값. 픽스처에 "이란 전쟁 201일째"를
넣으려 하자 둘 중 어디에도 안 맞는다는 게 드러났다.

- "48건" — 조회해야만 알 수 있다
- "201일째" — 개전일(STABLE)에서 계산된다

운영상 완전히 다르다. 파생값은 재계산하면 정확하므로 immutable한 ArticlePackage에
안전하게 들어갈 수 있다. 조회형은 못 그런다.

**제안**
```
STABLE     안 변함                        3.75~4.00%
DERIVED    변하지만 STABLE fact에서 계산   201일째
VOLATILE   조회해야만 알 수 있음           48건 → as_of 필수
```

**미해결 쟁점** (확정 전 답해야 함)
1. DERIVED의 유효 조건 — 전쟁이 끝나면 "566일째"는 산술적으로 맞지만 거짓이 된다
2. 재계산 기준 시계 — `now()` 인가 `published_at` 인가
3. DERIVED-from-VOLATILE 허용 여부
4. `render` 함수 어휘를 계약 enum으로 닫을 것인가

**메타**: 스키마를 먼저 만들었으면 마이그레이션이었을 것을, 픽스처를 먼저 쓰려다
발견했다. Step 0.0(픽스처 선행) 결정의 첫 실증 사례.
