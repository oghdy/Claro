# logs/pipeline · P-T2 — 11/15 오늘의 해외 짧은 이야기: 이탈리아 Garante → 메타 (D107 ~ D109)

## P-T2 · 2026-11-15 · 서브에이전트 · 확인지에서 멈춤 (PM — 편집자 자리) → 도윤

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`). 코드 안 모델은 ③ 에 따로. 부르기 18 · **0.327 달러 / 상한 2** (목표 0.5 안쪽 — 지켰다). 자동 발행 없음 · `human.json` 없음 (PM 몫) · `docs/PM.md` 안 읽음.
**기관 누리집에 요청 0** — Garante 의 문서 · robots.txt 는 S-3 가 받아 둔 캐시의 바이트만 썼다 (②).
새 파일: `packages/pipeline/data/events/GPDP-20261114-META-GALLERY/` (소스 팩 넷 · `shorts/meta-gallery/`) · `packages/pipeline/data/shorts/meta-gallery.json` (사람 입력) · `packages/pipeline/test/p-t2.test.ts` · 이 로그.
고친 기존 파일 셋 (전부 **더하기** — 기존 판정 · 기존 출력 0 변화): `packages/pipeline/src/rights.ts` (권리 갈래 하나) · `scripts/verify-source-pack.py` (git 에 둘 수 있는 권리 목록에 그 이름 하나) · `packages/pipeline/src/short.ts` (문서의 토막만 구절로 내는 선택 칸 `part` — ②). 장부 `p3-calls.jsonl` 은 P-T1 과 같이 덧붙였다 (그대로 실었다).
**계약 파일 0줄** (`docs/contract/*` · `packages/contract/*`) — 발행처 단위 행 (SourceRegistry)의 있는 칸으로 섰다 (②). `short-prompt.ts` · 모델 · `verify-ledger.py` · apps/web · 골든 · 옛 `shorts/license-notice*` · 석유 사건 · `data/series/` · `episodes/` 0줄.

---

## ① 한 장 요약

| | |
|---|---|
| **이야기** | 「사진 때문에 수억 유로라는데, 사진을 가져간 걸까」 (`meta-gallery`) — `packages/pipeline/data/events/GPDP-20261114-META-GALLERY/shorts/meta-gallery/story.json` · 계약 `validateShortStory` 통과 (알림 0) · 구절 20 / 28 · 글 덩이 19 · 숫자가 든 글 6 |
| **뒤집기** | 첫 생각 "사진 때문에 이렇게 큰 과징금이라면, 내 사진을 몰래 가져가 AI 학습에라도 썼겠구나" → 깨는 사실 "문서에는 이번 절차가 AI 학습 문제를 다루지 않았다고 적혀 있다 · 기구가 문제 삼은 건 **따로 동의를 받지 않고 닿았다**는 것" → **“큰 과징금을 받은 까닭” ≠ “사진을 가져다 썼다”**. 모델이 본 세기 strong. **S-3 의 뒤집기가 그대로 섰다** — 받치는 글자 둘: `p12` "Any access to the information it contains therefore requires free and informed consent, regardless of whether the data is transmitted or any harm occurs." · `p14` "The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies." 사진이 서버로 갔는지 · AI 에 쓰였는지는 글이 "어느 쪽으로도 말하지 않을게요"라고 적는다 (`where.unknown`) |
| **비용** | **0.327 달러** — 글 0.200 (Fable · 배치) + 함의 0.096 (Opus low · 12 + 다시 2 + 다시 1 · 배치) + 고치기 0.031 (Opus · 두 번 · 배치). 전부 배치. P-S1 (0.362)보다 조금 쌌다 — 짧은 이야기 n = 2 |
| **권리** | 새 갈래 **`REUSE_CITED_UNALTERED`** (기관의 재사용 허락 — 출처 표시 · 글을 바꾸지 않음 · D109 PM 판정) · 발행처 `garanteprivacy.it` 한 줄 · 보관한 글 = 받은 쪽에서 뽑은 글 그대로 (9,816자 — 메뉴 · 이탈리아 말 본문 · 영어판 · 꼬리말) · 구절은 영어판 토막만 |
| **낼 수 있나** | **false** — 계약 통과 · 함의 걸림 0 · 막힘 0 · **사람 확인 아직** |
| **확인지** | `packages/pipeline/data/events/GPDP-20261114-META-GALLERY/shorts/meta-gallery/sheet.md` |

---

## ② 소스 팩 · 권리

사건 `GPDP-20261114-META-GALLERY` (`occurred_at` 2026-11-14 = 발표일 · 결정한 날 · 결정문 번호는 문서에 없다). 문서 하나:

| 문서 | 무엇 | 권리 | 자리 |
|---|---|---|---|
| `GPDP-10321080` | Garante 보도자료 (Doc-Web 10321080 · 이탈리아 말 본문 + 같은 쪽의 영어판 · `https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10321080`) · 117,152 바이트 · sha256 `96d88c8f…5270` (S-3 가 적은 해시와 같다) · 뽑은 글 9,816자 sha256 `111a8508e16c…` | `REUSE_CITED_UNALTERED` | **git** (`store.documents.json`) |

**다시 받지 않았다 — 어떻게 했나.** `pack.ts` 는 고치지 않았다. ① S-3 캐시 (`.cache/s3/garante-10321080.html`)를 `pack.ts` 의 캐시 자리 (`.cache/events/GPDP-20261114-META-GALLERY/raw/GPDP-10321080.bin` + 메타 `.json`)에 그대로 옮기고 ② 네트워크를 막는 작은 앞 붙임 (scratchpad · git 밖 — `fetch` 를 갈아 끼워 `robots.txt` 요청에는 S-3 캐시의 바이트를 주고 그 밖의 요청은 전부 오류)을 달아 `node --import … src/pack.ts GPDP-20261114-META-GALLERY` 로 돌렸다. 그래서 기록에 적힌 것 가운데 **옮겨 적은 값이 셋** 있다 (pack.json `_what` 에도 적었다): 문서의 `fetched_at` = S-3 캐시 파일의 시각 (21:29:39 KST) · `content_type` = `text/html` (S-3 가 응답 머리를 남기지 않았다) · robots 의 `fetched_at` = 캐시 바이트를 읽은 때 (실제로 받은 때는 21:29:35 KST). `p2 … --check` 는 **돌리지 않았다** (새로 받는다).
```
$ node --import <scratchpad>/offline-fetch.mjs src/pack.ts GPDP-20261114-META-GALLERY
pack GPDP-20261114-META-GALLERY — 소스 팩
  목록 1 — 저장 1 (store.documents.json 1 · P-1 것 그대로 0 · 캐시만 0) · 못 가져옴 0
  GPDP-10321080 HTML    9816자 111a8508e16c store.documents.json · 살아 있는 페이지
```

### 더한 권리 갈래 — `REUSE_CITED_UNALTERED` (rights.ts · 더하기만)
- **근거 문장** (기관의 조건 쪽 「Regole del sito」 — "CONDIZIONI PER IL RIUSO DEI CONTENUTI · Condizioni generali" · S-3 캐시 `.cache/s3/garante-regole.html` sha256 `50411155…45fc` 에서 글자 그대로): "I contenuti possono essere riutilizzati citando la fonte ("Garante per la protezione dei dati personali"), con il link al documento originale e la data di consultazione. Il testo non va alterato, ed estratti o sintesi vanno segnalati come tali."
- **조건 주소** `https://www.garanteprivacy.it/home/footer/regole-del-sito` (D109 에 적힌 주소) · **본 날** 2026-11-15 · **판정** PM (D109).
- **자리 — 발행처 단위** (`ftc.go.kr` 의 공공누리 꼬리말과 같은 꼴: 사이트가 스스로 밝힌 조건 글이 근거). 문서 단위 권리 (`DocumentRights` · D70)는 근거 칸이 PDF 안 그림 모양 (쪽 · 그림 · 그림 해시 필수)이라 웹 쪽의 조건 글을 적을 수 없다 → 계약을 넓히지 않고 발행처 행으로 섰다.
- **발행처 행의 칸** (`store.json` `source_registry`): `can_store` 참 · `can_quote` 참 · `attribution_required` 참 · **`can_transform` 거짓** ("Il testo non va alterato") · `commercial_use` null (조건이 말하지 않는다) · `can_ingest` null · `terms_url` = 조건 주소 · `last_reviewed_at` 2026-11-15 · `basis` = 근거 문장 + 같은 조건 글의 나머지.
- **고친 줄**: `Rights` 에 이름 하나 · `STORABLE` 에 하나 · 표 `REUSE_CITED_UNALTERED` (발행처 → 기관 · 근거 문장 · 조건 주소 · 본 날 · 나머지 조건) · `rightsOf` 의 끝에 한 갈래 (앞의 셋이 먼저) · `registryRow` 에 한 갈래 · `verify-source-pack.py` `STORABLE_RIGHTS` 에 이름 하나.
- **기존 판정 0 변화** — 시험 (`p-t2.test.ts`): 연방 · 공공누리 · 법령 · 미확인 발행처가 전과 같다 · 앞선 사건 다섯의 기록 문서 74 가운데 새 갈래로 읽히는 것이 없고 발행처 판정이 기록과 같다 · `verify-source-pack` 사건 일곱 OK · 자가 시험 사본 39 OK · 골든 0자.
- **같은 조건 글의 나머지를 어떻게 지켰나**
  | 조건 | 우리 것 |
  |---|---|
  | 출처 이름 · 원문 링크 · 본 날짜 | 문서의 보이는 이름 (`story.json` `docs.GPDP-10321080.name`) 한 줄에 다 넣었다 — "Garante per la protezione dei dati personali (이탈리아 개인정보 감독기구) 보도자료 「…」 — 영어판에서 발췌 (2026-11-14 · Doc-Web 10321080 · 2026-11-15 에 봄 · https://www.garanteprivacy.it/…/docweb/10321080)". 화면의 근거 시트 (`apps/web/src/episode/kit/Short.tsx` `SourceSheet` — 읽기만 했다)는 구절마다 이 `name` 을 `<cite>` 로 그대로 보인다 → **기관 이름 · 문서 주소 · 본 날짜가 근거 시트에 보인다** (주소는 글자다 — 누르는 링크가 아니다 · PT2-c) |
  | 글을 바꾸지 않는다 · 발췌는 발췌라고 | git 의 글은 뽑은 그대로 · 구절은 그 글의 글자 그대로 (계약 검증이 댄다) · 이름에 "발췌" |
  | 도구가 만든 답은 원문과 따로 · 기관의 말로 돌리지 않는다 | 이야기 글은 우리 글 (꼬리표 "기구의 판단" / 풀이) · 구절은 근거 시트에 따로. 우리 번역임을 화면이 따로 말하지는 않는다 (PT2-c) |
  | 자연인의 이름이 든 문서는 뺀다 | 이 문서에 자연인의 이름이 없다 (회사 · 소비자 단체 · 기관). **갈래는 발행처 단위라 다음 Garante 문서는 사람이 이름을 보고 `hold_text` 로 뺀다** — 기계가 막지 않는다 (PT2-a) |
  | AI 모델 학습은 허락 밖 | 학습하지 않는다. 문서를 모델 입력으로 읽혀 이야기를 썼다 (S3-a — PM 판정 D109 안으로 봤다) |
  | 자동 받기 = 연락처 든 신원 표시 | 다시 받지 않았다 (요청 0) |

### 구절 — 영어판 토막만 (short.ts 에 선택 칸 하나)
보관한 글은 쪽 전체라 메뉴 · 이탈리아 말 본문 · 영어판 · 꼬리말이 한 글이고, 옛 구절 끊기 (`passagesOf`)는 한국어 보도자료의 규칙 (빈 줄 · 줄머리 · "다." 뒤)이라 이 글을 그대로 넣으면 메뉴부터 한 덩이가 된다. 그래서 사람 입력에 **선택 칸 `docs.<label>.part = { after, before }`** 를 더했다: 줄이 글자 그대로 `after` 인 곳의 다음 줄부터 `before` 인 줄 앞까지 · 줄마다 한 토막 · 라틴 글자 문장의 끝에서도 끊는다. `part` 가 없으면 한 글자도 달라지지 않는다 (`short license-notice --check` 같음 · 옛 구절 18 그대로 — 시험). 이 문서는 `after: "_______"` · `before: "Scheda"` → **구절 28** (제목 · 문장 · 목록 줄 · 날짜 줄 — 뒤집기를 받치는 문장 둘이 각각 한 토막).
`short-prompt.ts` · 프롬프트 · 모델은 고치지 않았다. 사람 입력의 `human_note` (글 단계에 전할 말 — 있던 칸)에 적은 것: 구절은 영어 · 글은 한국어 · 돈은 유로로만 · "805 million → 8억 500만"은 calc 에 · 서버 전송 / AI 학습은 어느 쪽으로도 쓰지 않는다 · 이탈리아의 일이다.

---

## ③ 단계별 — 모델 · 비용

| 단계 | 프롬프트 | 모델 · effort | 길 | 부르기 | 입력 (캐시 쓰기 · 읽기) | 출력 | 값 (달러) |
|---|---|---|---|---|---|---|---|
| 구절 끊기 | — | 모델 없음 | — | 0 | — | 28 토막 | 0 |
| **뼈 + 글** | `short-write/1` (그대로) | `claude-fable-5-2` · medium | 배치 (123초) | 1 | 2,089 (8,515 · 0) | 7,448 | **0.1999** |
| 함의 — 위험한 글 12 / 19 | `episode-entail/2` (그대로) | `claude-opus-5-5` · low | 배치 | 12 | | | 0.0768 |
| 고치기 1 — 걸린 글 2 | `episode-repair/2` (그대로) | `claude-opus-5-5` · medium | 배치 | 1 | 3,747 (1,751 · 0) | 804 | 0.0199 |
| 함의 — 고친 글 2 | `episode-entail/2` | Opus · low | 배치 | 2 | | | 0.0144 |
| 고치기 2 — 걸린 글 1 | `episode-repair/2` | Opus · medium | 배치 | 1 | 2,980 (0 · 1,751) | 535 | 0.0115 |
| 함의 — 고친 글 1 | `episode-entail/2` | Opus · low | 배치 | 1 | | | 0.0047 |
| 짓기 · 계약 검증 · 확인지 | — | 모델 없음 | — | 0 | | | 0 |
| **합** | | | | **18** | 함의 합: 17,341 (4,448 · 62,272) → 4,381 | | **0.3271** |

- 장부 `p3-calls.jsonl` 의 `step: "P-T2"` 줄 18 · 합 0.327129 · `verify-ledger` OK (상한 2 — 16%).
- 함의가 본 것 12 = 근거 있는 글 전부 (숫자 · 한글 수 · 기관의 판단 · 인과). 건너뛴 것 = 근거 없는 글 7 (물음 · 귀띔 · 없다는 말 · 머리).
- **고치기를 두 번 돌렸다** (지시문은 한 번을 그렸다): 첫 고치기가 `cover.dek` 에 "…닿았기 때문이에요"를 넣었고 다시 본 함의가 그 인과를 걸었다 (문서는 과징금과 접근을 나란히 적을 뿐 "때문에"로 잇지 않는다). 막힌 확인지를 넘기느니 한 번 더 (0.016 달러) — 둘째 고치기 뒤 걸림 0.

---

## ④ 확인지 · 걸린 것

`packages/pipeline/data/events/GPDP-20261114-META-GALLERY/shorts/meta-gallery/sheet.md` — `short meta-gallery --sheet` (결정적). PM 이 같은 폴더 `human.json` 에 적는다 (꼴은 확인지 끝 · P-S1 ⑤ 와 같다). 지금: 계약 통과 · 막힘 0 · 함의 못 본 글 0 · 사람 확인 아직.

### 기계가 고친 것 — 둘 (셋째 줄은 같은 칸의 둘째 고침)
| 칸 | 앞 | 걸린 까닭 (함의 EXCEEDS) | 뒤 |
|---|---|---|---|
| `where.body[0]` | **페이스북 앱에는** 2023년부터 … | 문서는 안드로이드용 앱에 한정한다 | **안드로이드용 페이스북 앱에는** … (근거에 p03 더함) |
| `cover.dek` (1) | … 사진과 영상에 **닿은 일 때문이에요.** | "동의 없이 · 알리지 않고"라는 단서가 빠져 닿은 것만으로 과징금인 듯 읽힌다 | … 따로 동의를 받지도, 제대로 알리지도 않고 … **닿았기 때문이에요.** |
| `cover.dek` (2) | (위의 뒤) | 문서는 "때문에"로 잇지 않는다 | **감독기구는** … 닿았다고 **밝혔어요.** |

### PM 이 볼 것 (작업 세션이 읽고 걸린 곳 — 고치지 않았다)
1. **뒤집기** — 선다고 봤다. 다만 앞쪽 말 "큰 과징금을 받은 까닭"이 길고 밋밋하다 (손 견본은 한 마디). 줄인다면 `“8억 유로의 까닭” ≠ “사진을 가져다 썼다”` 쯤 — 숫자가 들면 맨 글자열 규칙 (숫자 금지)에 걸리니 "과징금의 까닭"처럼.
2. **첫 생각이 AI 까지 간다** ("AI 학습에라도 썼겠구나") — 문서가 AI 를 글자로 말하니 (p14) 받쳐지지만, 보통 독자의 첫 생각은 "사진을 가져갔구나"까지일 수 있다. 표지의 물음도 "내 사진을 가져가 AI에 쓴 건가요?"다.
3. **S-3 의 가장 센 글자 ("보냈는지 · 피해가 있는지와 상관없이")가 깨는 사실이 아니라 뒤집기의 풀이에 들어갔다** (`entry.flip_note` ← p11 p12). 깨는 사실은 p14 (AI 는 다루지 않았다) + p03. 순서를 바꿀지는 편집자 눈.
4. **"기구"** 라는 줄임이 열 번 넘게 나온다 ("기구는 … 기구가 …") — 표지는 "이탈리아 개인정보 감독기구" · 고친 `cover.dek` 은 "감독기구". 낯선 말이면 "감독기구"로 맞출 만하다.
5. **`keep.title` "작은 뒤집기 하나가 남았어요"** — 손 견본 (영훈)의 글자 그대로다. 같은 선반의 두 이야기가 같은 머리를 갖게 된다.
6. **숫자 여섯 글** — 8억 500만 (805 million · calc) · 2023년 · 2025년 7월 · 60일 · 약 2,000만 명 (20 million · calc) · 2026년 · 날짜 줄. 구절과 대 봤다 — 맞다. "0.47%" · "30일 · 90일" · "2019년 결정"은 글에 안 썼다.
7. **한국 이야기가 없다** — 문서에 없어서다 (그리지 않을 것 셋째 줄). "그래서 내 폰은?"을 독자가 물을 텐데 답이 없다 (S-3 ⑤ 의 정보통신망법 조문은 받지 않았다 — PT2-d).
8. **`entry.whose`** 가 네 문장이다 (기계가 센 것) — 메타의 말이 무엇뿐인지 적느라 길어졌다 (관할 이의 · AI 부인).
9. **선반** — 「내 정보는 누가 지키나」 (privacy)에 놓자는 제안. 곁 이야기 · 가리킨 도구는 없다 (홀로 선 꼴 — PT2-e).
10. 확인지 머리의 "고른 곳 **S-2 아침 한 장** 2026-11-15-news W1"은 `short.ts` 의 붙박이 말이다 — 실제로는 S-3 의 뉴스 고르기다 (글자만 · 고치지 않았다).

### 통독 (확인지 ⑧ 그대로)
- **표지 · 제목** 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
- **표지 · 한 줄** 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 감독기구는 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았다고 밝혔어요.
- **표지 · 날** 2026년 11월 14일 발표 · 로마 / **귀띔** 발표 하나를 놓고 짧게 볼게요.
- **Q** 내 사진을 가져가 AI에 쓴 건가요?
- **머리** 문제가 된 건 허락 없이 닿은 것이었어요
- **이렇게 생각하기 쉬워요** 사진 때문에 이렇게 큰 과징금이라면, 내 사진을 몰래 가져가 AI 학습에라도 썼겠구나 싶어요.
- **그런데 문서에는** 그런데 문서에는 이번 절차가 사진을 AI 학습에 쓰는 문제를 다루지 않았다고 적혀 있어요. 기구가 문제 삼은 건, 앱이 폰 안의 사진과 영상에 **따로 동의를 받지 않고 닿았다**는 것이에요.
- **아래 글 1** 안드로이드용 페이스북 앱에는 2023년부터 ‘갤러리에서 추천 받기’라는 기능이 있었어요. 페이스북을 보는 동안, 내 폰 갤러리에 있는 사진과 영상을 “이거 올려 볼래요?” 하듯 추천으로 보여 주는 기능이에요.
- **아래 글 2** 조사는 2025년 7월에 시작됐어요. 볼차노 소비자보호센터가 민원을 냈고, 기구가 직접 기술 분석을 했어요.
- **뒤집기** **“큰 과징금을 받은 까닭” ≠ “사진을 가져다 썼다”**
- **뒤집기의 풀이** 기구는 메타가 어긴 조항이 스마트폰을 한 사람의 사적인 영역의 일부로 보호한다고 짚었어요. 그래서 폰 안의 정보에 닿는 것은 어떤 경우든, 자료가 전송됐는지나 피해가 생겼는지와 상관없이 **자유롭게, 충분히 알고 한 동의**가 있어야 한다고 했어요.
- **문서에 없는 것** 사진이 회사 쪽으로 넘어갔는지, AI 학습에 쓰였는지는 이 문서에 없어요. 문서는 이번 절차가 그 문제를 다루지 않았고 메타는 부인한다고만 적었어요. 그래서 여기서도 어느 쪽으로도 말하지 않을게요.
- **Q** 허락은 받지 않았나요?
- **머리** 허락을 받긴 했는데, 무엇을 허락하는지 알 수 없었어요
- **이끄는 글** 기구가 들여다본 건 허락을 어떻게 받았느냐였어요. 점검에서 드러난 것은 세 가지예요.
- **짚은 것 1** **허락 하나에 다 묶였어요** — 갤러리에 닿는 허락을 권한 하나로 받았어요. 그 권한 하나가 앱 전체에, 목적이 서로 다른 여러 기능에 함께 통했고요.
- **짚은 것 2** **안내가 두루뭉술했어요** — 허락을 받기 전에 나온 안내는 “다른 기능 켜기”라는 일반적인 말이었어요. 기구는 이 안내로는 사용자가 갤러리 추천까지 허락한다는 것을 알 수 없다고 봤어요.
- **짚은 것 3** **처음부터 켜져 있었어요** — 이 기능은 기본으로 켜져 있었어요. 허락을 전부 주면 앱이 기기의 사진 보관함 전체를 계속 읽을 수 있어요. 그런데 실제로 어떤 정보가 쓰이는지는 사용자도 기구도 확인할 수 없다고 했어요.
- **판정** 기구는 메타가 구체적인 동의를 받지 않았고 제대로 알리지도 않았다고 보고, 8억 500만 유로의 과징금을 매겼어요. 60일 안에 이 기능만을 위한 **별도의 동의**를 받고, 기능을 기본으로 꺼 두라고도 했어요. 금액을 정할 때는 이탈리아의 안드로이드 사용자 약 2,000만 명이 관련됐다는 점 등을 고려했다고 해요.
- **누구의 말** 여기까지는 **이탈리아 개인정보 감독기구의 판단**이에요. 메타의 말은 기구가 문서에 옮겨 적은 것만 있어요. 관할이 아일랜드 기구에 있다고 이의를 냈다는 것, AI 학습 이용을 부인한다는 것이에요. 메타가 직접 낸 입장은 우리가 확인한 문서에 없어서 싣지 않았어요.
- **Q** 그래서 무엇이 남나요?
- **남음 · 머리** 작은 뒤집기 하나가 남았어요
- **남는 한 줄** 이 과징금의 까닭은 가져다 썼느냐가 아니었다. 기구가 물은 것은 폰 안에 닿기 전의 허락이었다.
- **감독기구의 말** 기구는 메타에 이 기능이 무엇을 위한 것인지, 갤러리에 닿는다는 것, 끄는 방법을 사용자에게 분명히 설명하라고 했어요. 이미 동의한 사람에게도 기능을 기본으로 꺼 두라고 했고요. 2026년에 새로 나온, 갤러리 내용을 클라우드에서 처리하는 기능은 따로 살펴볼 수 있다고도 밝혔어요.
- 기계가 센 것 — 독자 글 덩이 19 · 빈칸 뺀 글자 1,210 (손 견본 영훈 875 · license-notice 1,071)

---

## ⑤ 화면 (다음 Step)이 쓸 것

- **story.json** `packages/pipeline/data/events/GPDP-20261114-META-GALLERY/shorts/meta-gallery/story.json` (`ShortStory` · `code: "meta-gallery"` · `weight: "short"` · `series.code: "privacy"` · `sibling: null` · `tools_from: null` — 홀로 선 꼴: `tool_lead` · `map_note` · `gain_label` 은 `null`). **PM 이 `human.json` 을 적은 뒤 `short meta-gallery` 를 다시 돌린 판을 쓴다** (고침이 얹힌다 · `_source.human_gate`).
- **catalog 한 줄** (license-notice 줄의 꼴): `short(metaGallery, { place: "해외", category: "기술", day: "2026-11-15" })`
- 근거 시트: 구절은 영어 원문 그대로 (20개) · 문서 이름이 길다 (기관 이름 · 발췌 표시 · 본 날짜 · 주소가 한 줄 — 좁은 화면에서 줄바꿈을 본다. 주소는 글자다).
- 선반: 이미 있는 `privacy` — 그 선반에 긴 이야기 (1화)와 짧은 이야기 (영훈)가 있다. 이 이야기는 다른 사건이라 곁 이야기 묶음이 아니다.

---

## ⑥ _open

| | 무엇 | 내 생각 |
|---|---|---|
| PT2-a | 새 갈래가 **발행처 단위**다 — Garante 의 조건은 "자연인의 이름이 든 문서는 뺀다"를 달고 있는데 기계는 `garanteprivacy.it` 문서를 전부 git 가능으로 읽는다 | 지금은 문서 하나 (이름 없음 — 눈으로 봤다). 둘째 문서가 생기면 사람이 보고 `hold_text` · 날마다 볼 곳이 되면 문서 단위로 좁힐지 (계약 `DocumentRights` 의 근거 칸이 PDF 그림 모양이라 계약을 넓혀야 한다 — 백엔드) |
| PT2-b | `can_transform: false` 로 적었다 — 우리는 글을 옮겨 (번역 · 풀이) 이야기를 쓴다 | 조건은 "발췌 · 요약은 그렇다고 밝히면 된다"다 → 원문 글 자체를 바꿔 싣지 않는 한 안으로 읽었다 (D109 의 결). 이 칸을 읽어 무엇을 막는 코드는 지금 없다 |
| PT2-c | 화면에 **원문 링크가 글자로만** 보인다 (근거 시트는 `name` 만 보인다 — 계약 `docs` 에 주소 칸이 없다) · "우리 번역 · 풀이"라는 말이 화면에 따로 없다 | 기관 조건은 "링크"를 말한다. 누를 수 있는 링크 · 번역 표시는 화면 Step 또는 계약의 칸 (E — `docs.*.url`)으로 |
| PT2-d | **한국 쪽 답이 없다** ("내 폰은?") — S-3 ⑤ 의 정보통신망법 접근권한 조문을 받지 않았다 (지시문 밖 · 짧은 이야기는 문서 하나만 받는다) | 낼 때 PM 이 볼 것. 다음 이야기감 |
| PT2-e | 같은 선반의 긴 이야기 (privacy 1화)의 도구 (과징금 · 동의 …)를 가리키지 않았다 — `tools_from: null` | 사람이 고르는 칸이다 (키 · 글 셋). 가리키면 지도에 붙는다 — PM |
| PT2-f | `short.ts` 에 선택 칸 `part` 를 더했다 (한국어 보도자료가 아닌 첫 실물 — 웹 쪽 · 영어) | `part` 없으면 0 변화 (시험 · `--check`). 영어 문장 끊기는 이 문서 하나에 맞춘 규칙이다 (". " 뒤 대문자) — 약어 (U.S. …)가 든 문서가 오면 다시 본다 |
| PT2-g | 기록의 옮겨 적은 값 셋 (문서 `fetched_at` · `content_type` · robots `fetched_at`) — 다시 받지 않으려고 | pack.json `_what` 에 적었다. S-3 가 응답 머리를 남겼다면 없었을 일 — 다음부터 받을 때 메타를 같이 남긴다 |
| PT2-h | 고치기를 두 번 돌렸다 (지시문은 한 번) | 0.016 달러 · 막힘 0 으로 넘기려고. 세 번째는 돌리지 않을 생각이었다 |
| PT2-i | 확인지 머리의 "S-2 아침 한 장"이 붙박이 말이다 (S-3 에서 온 이야기) | 글자만. 다음 손질 때 |

---

## 검사 결과

```
$ pnpm --filter @claro/pipeline test
 Test Files  15 passed (15)
      Tests  182 passed (182)
   Duration  6.96s (tests 78%, transform 12%, import 10%)
$ pnpm --filter @claro/contract test
 Test Files  5 passed (5)
      Tests  150 passed (150)
$ pnpm -s typecheck
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done
(exit 0)
$ pnpm --filter @claro/pipeline short meta-gallery --check
$ node src/short.ts meta-gallery --check
short meta-gallery --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
$ pnpm --filter @claro/pipeline short license-notice --check
$ node src/short.ts license-notice --check
short license-notice --check — 다시 지은 것이 파일과 글자 단위로 같다 (story.json · review.json)
$ python3 scripts/verify-source-pack.py
verify-source-pack
  ACRC-20261028-LICENSE-NOTICE: 목록 2 — 저장 2 (cache 1, store.documents.json 1) · 못 가져옴 0 · Source 2 · Event 1
  FOMC-20261028: 목록 43 — 저장 38 (cache 5, fixtures/store.documents.json 10, store.documents.json 23) · 못 가져옴 5 · Source 38 · Event 1
  GPDP-20261114-META-GALLERY: 목록 1 — 저장 1 (store.documents.json 1) · 못 가져옴 0 · Source 1 · Event 1
  KDCA-20261109-OBESITY: 목록 2 — 저장 2 (cache 1, store.documents.json 1) · 못 가져옴 0 · Source 2 · Event 1
  KFTC-20261029-DELIVERY-APPS: 목록 15 — 저장 15 (cache 3, store.documents.json 12) · 못 가져옴 0 · Source 15 · Event 1
  MOTIR-20261113-OIL-PRICE-CAP: 목록 14 — 저장 14 (cache 1, store.documents.json 13) · 못 가져옴 0 · Source 14 · Event 1
  PIPC-20261028-SAFETY-MEASURES: 목록 12 — 저장 12 (cache 3, store.documents.json 9) · 못 가져옴 0 · Source 12 · Event 1

OK
$ python3 scripts/selftest-verify-source-pack.py   (끝 줄)
selftest-verify-source-pack: 사본 39 · OK
$ python3 scripts/verify-ledger.py
verify-ledger: 장부 1001 줄 (배치 388) · 합 $33.42 · 저장 출력 981
OK (ERROR 0 · WARN 0)
```

비밀 값: 이 Step 은 `.env*` 의 내용을 출력 · 로그 · 커밋하지 않았다 (`llm.ts` 가 읽어 부르기만).
