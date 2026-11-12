# logs/frontend · F-E1 — 실제 주소를 회차 형식으로 (D76)

## F-E1 · 2026-11-12 · 서브에이전트 · 검수 대기(PM)

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`). 모델 API 호출 0 · 비용 0 · `docs/PM.md` 안 읽음.
레인: 프론트 (`apps/web` · `packages/tokens`).
안 건드린 것: 계약 (`docs/contract/*` · `packages/contract`) · **골든 셋 · fixtures (0자)** · 세 회차의 독자 글 (0자) · packages/pipeline · packages/db · Vercel 설정 (`vercel.json`) · 환경 변수 · 도메인 · Supabase · `robots.ts` · 뿌리 `layout.tsx` 의 robots 메타.

**한 줄 답**: 실제 주소 `/` 가 종이 톤의 첫 화면 (Claro 두 줄 · 오늘의 회차 · 시리즈 셋)이 됐고, 골든 회차 셋이 `/s/<시리즈>/<n>` 에 섰다 — 시안과 **같은 부품 한 벌** (`apps/web/src/episode/`)이고, 실제 화면에는 시안 띠 · 독자 스위치 · 풀이 스위치가 없다 (독자는 처음 온 독자).
옛 검은 화면 (9월 FOMC 기사)은 `/archive/fomc-2026-09` 로 옮겼고 한 글자도 바꾸지 않았다 — 이미 나간 번호 링크 `/?r=<UUID>` 는 그리로 넘어간다.

---

## ① 실제 주소

| 무엇 | 주소 | 비고 |
|---|---|---|
| 첫 화면 | `/` | 정적 · 데이터베이스 안 읽음 |
| 「누가 값을 정하나」 1화 | `/s/price/1` | 골든 `fixtures/episode-price-1.json` |
| 「금리는 어디로」 2화 | `/s/rate/2` | 골든 `fixtures/episode-rate-2.json` |
| 「내 정보는 누가 지키나」 1화 | `/s/privacy/1` | 골든 `fixtures/episode-privacy-1.json` |
| 옛 B5 화면 (9월 FOMC 기사 · 다크) | `/archive/fomc-2026-09` | 옛 `/` 그대로 · 기록 · 물음 흐름 그대로 |
| 번호가 있는 옛 링크 | `/?r=<UUID>` → 307 → `/archive/fomc-2026-09?r=<UUID>` | `next.config.ts` `redirects` |
| 그 밖 | `/news` · `/again` · `/api/*` · `/lab/episode/*` | 그대로 |

**주소 꼴 `/s/<시리즈 code>/<회차 번호>` 의 까닭**
- 둘 다 **계약의 칸**이다 (`Series.code` · `Episode.number` — EPISODE §3). 주소를 위해 새 이름을 짓지 않았다. 회차의 `code` (`delivery` · `fomc` · `pipc`)는 사건의 이름이라 주소에 쓰지 않았다 — 독자에게 회차는 "금리는 어디로 2화"지 "fomc" 가 아니다
- **이어진다**가 주소에 보인다: `/s/rate/2` 다음은 `/s/rate/3`. 3화가 오면 주소를 지을 일이 없다
- 짧다 — 지인에게 보낼 때 한 줄. `s` 는 series
- `check.ts` S7 이 `real === /s/<series.code>/<number>` 를 본다. 목록에 없는 주소 (`/s/rate/3` · `/s/rate/1` · `/s/price/2`)는 404

## ② 첫 화면 설계와 까닭 (`apps/web/src/app/page.tsx` · `home.css` · 글은 `src/episode/home-copy.ts`)

위에서 아래로:
1. **Claro** 글자표 + 오른쪽에 작은 `미리보기` 꼬리표
2. **"뉴스 하나가 / 이야기 한 편이 돼요"** + 두 줄 — "Claro는 뉴스를 줄여 주는 곳이 아니에요. 물음 하나를 따라 들어가서, 직접 눌러 보고, 그 뉴스를 읽는 데 필요한 개념을 주워서 나와요." · "읽는 동안 주운 개념은 내 지도에 붙고, 이야기는 다음 화로 이어져요."
3. **오늘의 회차** — 먹색 테두리의 큰 카드 하나: 시리즈 이름 · **그 회차의 표지 그림** · N화 · 제목 · 한 줄 (dek) · 날 (meta) · 먹색 단추 "이 회차 읽기". 지금은 배달앱 1화 (11월 9일 발표 — 셋 가운데 가장 늦다)
4. **시리즈** — 카드 셋. 시리즈 이름 · 부제 (`series.sub`) · **시리즈 줄** (0화 → 지나온 화 → 지금 → 다음 화 — 회차 표지의 것과 같은 데이터 · 같은 모양) · "최근 회차 N화 읽기 →". 카드 전체가 최근 회차로 가는 길
5. 맨 아래 한 줄 — "지금은 미리보기예요. 읽은 기록은 아직 저장하지 않아서, 화면을 닫으면 지도가 처음으로 돌아가요."

까닭:
- **시안의 결 그대로** — 새 부품을 거의 만들지 않았다. 첫 화면은 회차 화면과 같은 뿌리 (`.ep-root` — 종이 · 글꼴 · 폭 480)에, 표지의 부품 (`.ep-series` · `.ep-cover-art` · `.ep-episode-no` · `.ep-meta` · `.ep-track`)을 그대로 쓴다. 첫 화면에서 회차로 들어가도 화면이 바뀐 느낌이 없다 — 오늘의 회차 카드가 곧 그 회차 표지의 작은 판이다
- **오늘의 회차를 가장 크게** — 첫 화면에 온 사람이 할 일은 하나 (들어가기)다. 화면에서 가장 무거운 것 (먹색 테두리 · 먹색 단추)을 그 하나에만 썼다. 시리즈 카드는 가는 선
- **시리즈 카드에 시리즈 줄** — "이어진다"를 말로 하지 않고 보인다: 지나온 화 · 지금 · "다음 화 — 회의록이 나오면". 금리 카드의 넷 (0화 · 1화 · 2화 · 다음 화)이 가장 잘 보인다
- **Claro 소개는 두 줄** — 요약 서비스가 아니라는 것 · 들어가는 이야기 · 쌓인다 · 이어진다. **과장하지 않으려고** "쌓인다"는 "읽는 동안 주운 개념은 내 지도에 붙고"로 썼다 (지금 지도는 화면 안에서만 자란다 — 저장하지 않는다)
- 움직임은 한 번 (덩이 다섯이 차례로 올라온다 — CSS) · 동작 줄이기를 켜면 없다. 첫 화면에는 스크립트가 필요 없다 (서버가 그린 HTML 그대로)
- 색 · 글자 크기는 시안의 것만 썼다 (제목 33 · 카드 제목 29 · 본문 16). 새 색 0

**글은 어디서 오나**: 회차 · 시리즈의 글 (제목 · 한 줄 · 날 · 시리즈 이름 · 부제 · 시리즈 줄)은 **골든에서 글자 그대로** 읽는다. 화면의 글 (소개 · 단추 · 꼬리표)은 `home-copy.ts` — 숫자가 없다 (`check.ts` S4).
**"가장 최근 발표"를 무엇으로 고르나**: 계약에 발행 시각 칸이 없다 (EPISODE §10 미확인 — "발행 시각 · 언어"). 그래서 회차마다 **손으로 적은 날** `announced` (`src/episode/episodes/*/data.ts` — 표지 meta 글의 날을 옮겼다: 11-09 · 10-28 · 10-29)로 고른다. 독자에게 보이지 않는다 · `check.ts` S7 이 그 달 · 날이 표지 meta 글에 있는지 본다 → **_open F-E1-c**

## ③ kit 를 한 벌로 — 무엇을 옮겼나 · 시안 주소는

| 옛 자리 (`apps/web/src/app/lab/episode/`) | 새 자리 (`apps/web/src/episode/`) |
|---|---|
| `kit/` (Episode · ConceptMap · chrome · parts · shelf · types · frames/*) | `kit/` — `git mv` (내용은 아래 바뀐 것만) |
| `episode.css` | `episode.css` |
| `episodes/delivery` · `fomc` · `pipc` (data · 화면 · 표지 그림 · css) | `episodes/delivery` · `fomc` · `pipc` |
| — | `catalog.tsx` (실제 화면에 나가는 회차 · 주소 · 오늘의 회차) · `home-copy.ts` (첫 화면 글) |

시안에 남은 것 (`lab/episode/`): 주소 여덟의 `page.tsx` · 견본 둘 (`episodes/quiet-sample` · `carry-sample`) · `fomc-auto/` · `rate-3/` · `check.ts` · `shots.ts` · `diff.mjs` — import 길만 바꿨다.

**시안 주소는 그대로 있다 — 같은 부품을 쓴다** (실제 주소로 넘기지 않았다). 까닭: 시안 주소에만 있는 것이 있다 — **따라온 독자 조립 · 체험 없이 보기 · 이 그림을 본 독자**. 도윤 · PM 이 그것을 보는 자리가 시안이다. 둘이 갈라지지 않는 까닭은 부품이 하나이기 때문이다: `Episode` 에 **`real` 하나**가 생겼고 (`<DeliveryEpisode real />`), 다른 것은 전부 같은 코드다.

`real` 이 바꾸는 것 (`kit/Episode.tsx` · `ConceptMap.tsx` · `shelf.ts` · `chrome.ts`):
| | 시안 (`/lab/episode/*`) | 실제 (`/s/*`) |
|---|---|---|
| 맨 위 "시안" 띠 · 독자 스위치 · 다른 회차 단추 | 있다 | **없다** |
| 풀이 장면의 스위치 둘 (체험 없이 보기 · 이 그림을 본 독자) | 있다 | **없다** |
| 독자 | 둘 (스위치) | **처음 온 독자** (고정) |
| `근거` 단추 | 맨 위 띠 | **위쪽 줄** (장수 왼쪽) |
| 위쪽 줄의 `‹` (첫 장에서) | 꺼져 있다 | **첫 화면 `/` 으로** |
| 다른 시리즈로 가는 길 (남음 장면 · 지도의 책장) | 시안 주소 | **실제 주소** (`hrefOf`) |
| 남음 장면의 한 줄 | "다음에 이 개념들이 나오면 접어 둘게요. …" | **"지금은 미리보기라, 이 지도는 아직 저장되지 않아요. 화면을 닫으면 처음으로 돌아가요."** (아래 ⑤) |
| 남음 장면 맨 아래 | 처음부터 다시 | 처음부터 다시 · **첫 화면으로** |
| 위쪽 줄의 안전 영역 (노치) | 시안 띠가 받는다 | 위쪽 줄이 받는다 |

`EpisodeData` (화면 전용 칸 — 계약 아님)에 둘이 생겼다: `real` (실제 주소) · `announced` (발표된 날 — 손으로). `path` 는 그대로 시안 주소다.

## ④ 토큰 · 옛 화면

**토큰 (UX1-a)** — 종이 톤이 `packages/tokens` 로 갔다.
- `values.ts` 에 `paper` (색 열둘 — UX-1 의 `--ep-*` 값을 **글자 그대로**: 종이 · 면 · 글 셋 · 선 둘 · 감색 셋 · 이끼색 둘) · `paperLayout` (좌우 22 · 폭 480). `tokens` 묶음에도 들어갔다
- `css.ts` 의 `cssVariables()` 가 `--p-*` 를 같이 낸다 (`--p-paper` … `--p-moss-soft` · `--p-page-x` · `--p-column`)
- `episode.css` 의 `--ep-*` 는 이제 값이 아니라 **`var(--p-*)`** 다 (이름은 그대로 — 1,700줄의 CSS 를 다시 쓰지 않았다). 값은 토큰 한 곳에만 있다. `--ep-ease` 는 이미 있던 `--m-ease-out` (같은 곡선)
- 화면 테두리색 (`themeColor`)도 토큰에서 (`paper.paper`) — 실제 주소 넷
- **D26 의 다크 (`color` → `--c-*`)는 그대로 두었다** — 주석만 "옛 화면의 것 (`/archive/fomc-2026-09` · `/news` · `/again`)"으로. 값 0자
- 남은 것: `episode.css` · `frames.css` · 회차 css 안에 색을 직접 적은 곳 (흰 글자 `#fff` · 물음 버튼 화살표 `#f0a184` 등 hex 35줄 + 그림자의 `rgba(30, 26, 22, …)`)과 글자 크기 · 간격은 토큰으로 옮기지 않았다 → **_open F-E1-d**

**옛 B5 화면** — `app/page.tsx` → `app/archive/fomc-2026-09/page.tsx` (`git mv` · import 길 + 주석만). `src/reader/*` · `src/study/*` · `src/server/*` · API 는 0자, 단 하나: `study/flows.ts` 의 `PATHS.claro` 가 `/` → `/archive/fomc-2026-09` (`scripts/reader.ts` 가 독자 링크를 찍을 때 쓰는 주소).
- **이미 나간 번호 링크가 깨지지 않게**: `/?r=<UUID>` → `/archive/fomc-2026-09?r=<UUID>` (307 · `next.config.ts` `redirects` — `r` 이 있을 때만. 번호 없는 `/` 는 새 첫 화면). 이것은 지시에 없던 것이다 — **스스로 내린 판단** (D36 · D37 의 링크를 받은 사람이 있을 수 있다)
- e2e 는 옛 화면을 새 주소로 따라간다: `e2e/reader.ts` 에 `OLD = "/archive/fomc-2026-09"` 하나 · `record` · `study` · `record-own-server` · `api` · `ledger` 가 그것을 쓴다. 옛 화면의 시험 56 가운데 뜻이 바뀐 것은 없다 (주소만 — 배포 빌드 시험에는 새 주소 넷을 더 넣었다: 200 · robots 메타)

## ⑤ 실제 화면에서 뺀 것 · 남긴 것 · 3화를 실제 주소에서 받는 길 (안)

**뺀 것**: 맨 위 "시안" 띠 · 독자 스위치 · `체험 없이 보기` · `이 그림을 본 독자` · `fomc-auto` (파이프라인 시험판) · 조용히 견본 · 지난 값 견본 (`carry`) · 3화 자리 (`rate-3`) — 뒤의 넷은 `/s` 에 주소가 없다 (404 · e2e 가 본다). 시안 주소에는 전부 그대로 있다.
**남긴 것**: 근거 (위쪽 줄의 `근거` → 문장에 점선 밑줄 → 누르면 원문 구절 · 문서 이름) · 개념 지도 (위쪽 줄의 단추 · 남음 장면) · 시리즈 사이를 오가는 길 (남음 장면의 "다른 시리즈" 둘 · 지도의 책장 · 첫 화면) · 움직임 · 동작 줄이기 (`MotionConfig reducedMotion="user"` 그대로) · 답 감추기 (UX-6 — 그대로) · "이거 알아요?" (처음 온 독자가 스스로 누른 것 — 화면 안에서만).

**고친 화면 글 하나 (회차 글이 아니다 — `kit/chrome.ts`)**: 남음 장면의 "다음에 이 개념들이 나오면 접어 둘게요. 새로 필요한 것만 꺼낼게요." 는 실제 화면에서 **지킬 수 없는 약속**이다 (읽은 기록이 없다 — 다음에 와도 접히지 않는다). 실제 화면에서는 그 자리에 "지금은 미리보기라, 이 지도는 아직 저장되지 않아요. 화면을 닫으면 처음으로 돌아가요." 가 보인다. 시안은 그대로. → 도윤에게 (⑦ 3)

**두 독자 조립**: 실제 화면은 처음 온 독자만이다. 독자가 누구인지 묻지도 추정하지도 않는다. (안은 ⑦ 1)

**3화를 실제 주소에서 받는 길 (안)** — `/s/rate/3`
- 시안의 `/lab/episode/rate-3` 은 **요청마다 파일을 읽는다** (회의록 날 다시 빌드하지 않으려고). 배포 서버에는 그 파일이 없어 늘 기다리는 화면이다 (UX6-g). **실제 주소는 그 길을 쓰지 않는 것이 맞다**: 실제 주소에 나가는 것은 게이트를 지난 것이어야 하고 (D76 "게이트 둘을 지난 뒤"), 요청마다 읽으면 "파일이 생긴 순간 = 공개"가 된다
- 안: **3화도 골든 셋과 같은 길로** — ① 파이프라인이 `episode.json` 을 낸다 (P-E3) ② 사람 확인 · PM 게이트 ③ 그 파일을 저장소에 커밋하고 `src/episode/episodes/` 에 화면 묶음 하나 (data · 표지 그림 · 도구 그림은 금리 2화 것을 그대로 — `rate-3/Rate3Episode.tsx` 가 이미 그렇게 한다) + `catalog.tsx` 의 `LIVE` 에 한 줄 ④ push = 배포. 그러면 `/s/rate/3` 이 서고, 첫 화면의 오늘의 회차 · 금리 카드 · 다른 회차의 "다른 시리즈" 길이 **저절로** 3화로 바뀐다 (전부 `LIVE` 를 읽는다)
- 그때 정할 것 (지금 정하지 않았다): 한 시리즈에 실제 회차가 둘이 되면 — 책장 (`SHELF`)은 시리즈마다 최근 회차 하나를 가리켜야 하고 (지금은 회차 = 시리즈라 그대로 된다) · 첫 화면 시리즈 줄의 지나온 화 (2화)를 누를 수 있게 할지 · `/s/rate/2` 의 "다음 화"에서 3화로 가는 길 → **_open F-E1-e**
- 3화 전까지 `/s/rate/3` 은 404 다. "회의록을 기다리는 중" 화면을 실제 주소에 두지 않았다 — 첫 화면 금리 카드의 "다음 화 · 회의록이 나오면" (골든의 시리즈 줄)이 이미 그 말을 한다

## ⑥ 배포 확인

(push 뒤에 채운다 — 아래 "배포 뒤")

## ⑦ 도윤에게 물을 것 (추천과 함께)

1. **따라온 독자 — 독자가 스스로 고르는 단추 ("이 시리즈를 따라왔어요")를 둘까?** (D66 과 함께)
   **추천: 지금은 두지 않는다 (처음 온 독자만).** 까닭 — 지금 "따라온 독자" 조립은 둘을 한꺼번에 바꾼다: ⓐ 장면 (0화 대신 지난 이야기 두 줄 · 견주기 장면이 생긴다) ⓑ **아는 도구 셋을 접는다 — 그 셋은 시안이 손으로 정한 값**이다. 독자가 "따라왔어요"를 눌러도 그것은 "지난 화를 읽었다"까지만 말해 주지, 어느 도구를 아는지는 말해 주지 않는다 — 단추 하나로 ⓑ 까지 바꾸면 **추정**이다.
   둔다면 이렇게: 표지의 "이 시리즈가 처음이시네요…" 아래에 작은 글 단추 "이 시리즈를 따라왔어요" → **ⓐ 만 바뀐다** (지난 이야기 · 견주기). 도구는 그대로 "이거 알아요?" 로 묻는다 (독자가 누른 대로 접힌다). 그러려면 부품에서 ⓐ 와 ⓑ 를 떼어야 한다 (지금은 `reader` 하나에 묶여 있다) — 작은 일이지만 "누가 어느 조립을 받나"를 정하는 일이라 D66 없이 하지 않았다. 개인정보 1화는 둘째 독자가 "건너온 독자"라 단추의 말이 다르다
2. **"미리보기" 표시 — 지금 넣어 두었다. 이대로 둘까?**
   넣은 곳 셋: 첫 화면 오른쪽 위 작은 꼬리표 · 첫 화면 맨 아래 한 줄 · 남음 장면의 한 줄. 회차 화면의 위쪽 줄에는 넣지 않았다 (읽는 동안 내내 보이면 시안 띠와 다를 것이 없다).
   **추천: 그대로.** 지인이 보고 "다시 왔더니 지도가 비었네"가 되기 전에 먼저 말해 두는 것이 낫다. 빼려면 `home-copy.ts` 의 두 줄 + `chrome.ts` 의 한 줄
3. **남음 장면의 약속 한 줄** — 실제 화면에서 "다음에 이 개념들이 나오면 접어 둘게요"를 "지금은 미리보기라, 이 지도는 아직 저장되지 않아요…"로 바꿔 보였다 (⑤). **추천: 그대로** — "쌓인다"가 진짜가 될 때 (D64) 원래 줄로 돌린다. 다르게 쓰고 싶으면 그 한 줄
4. **첫 화면의 Claro 소개 두 줄 · 제목 ("뉴스 하나가 / 이야기 한 편이 돼요")** — 내가 썼다. 도윤의 말로 바꾸고 싶으면 `home-copy.ts`. **추천: 폰으로 한 번 보고**
5. **금리 카드의 "1화 · 3년 만에 금리를 올렸어요" 를 옛 화면 (`/archive/fomc-2026-09`)으로 이을까?** 그 1화가 바로 옛 화면의 9월 기사다. **추천: 잇지 않는다** — 형식이 다르다 (검은 화면 · 회차가 아니다). 종이 톤에서 들어갔다가 검은 화면이 나오면 "이어진다"가 아니라 "다른 곳에 왔다"로 읽힌다. 그래서 첫 화면 어디에도 옛 화면으로 가는 길을 두지 않았다 (주소로만 열린다)
6. **공유했을 때 보이는 그림 (OG 그림)** — 없다 (제목 · 설명만). 만들려면 표지 그림 + 제목으로 한 장씩 (한글 글꼴을 그림 만드는 쪽에 실어야 한다). **추천: 다음에** — 카카오톡 · 메시지에서 제목과 설명은 지금도 나온다. 그리고 지금 `robots` 가 전부 막고 있다 (그대로 두었다)

## ⑧ _open

- **F-E1-a** 따라온 독자를 실제 화면에 보일지 · 어떻게 (⑦ 1) — D66 과 함께 도윤
- **F-E1-b** "미리보기" 표시 (⑦ 2) · 남음 장면의 한 줄 (⑦ 3) · 첫 화면 글 (⑦ 4) — 도윤
- **F-E1-c** 오늘의 회차를 고르는 날 `announced` 는 손으로 적은 값이다 — 계약에 발행 시각 칸이 없다 (EPISODE §10). 회차를 발행할 때 그 칸이 생기면 그것으로 바꾼다 (백엔드). "가장 최근 **발표**"로 골랐다 (결정일이 아니라) — 배달앱은 10-29 결정 · 11-09 발표
- **F-E1-d** 토큰으로 간 것은 종이 톤의 **색** · 좌우 여백 · 폭이다. 글자 크기 · 간격 · 모서리 · CSS 안에 직접 적은 색 (hex 35줄 등)은 `episode.css` · `frames.css` 에 그대로 — 앱 (D1)이 회차 화면을 그릴 때 옮긴다
- **F-E1-e** 한 시리즈에 실제 회차가 둘이 될 때 (3화): 책장 · 첫 화면의 지나온 화 · 회차 사이의 길 (⑤)
- **F-E1-f** 골든의 `_source.screen` 이 아직 시안 주소다 (`/lab/episode` · `/fomc` · `/pipc`) — fixtures 를 건드리지 않았다. 주석 칸이라 화면에 쓰이지 않는다. 백엔드가 다음에 골든을 만질 때
- **F-E1-g** 옛 화면의 번호 링크 넘기기 (`/?r=` → 옛 화면)는 스스로 내린 판단 (④) — 0.5 실험 (D36 · D37)의 링크가 이제 필요 없으면 지워도 된다
- **F-E1-h** 실제 화면은 아무것도 기록하지 않는다 (노출 · 읽기 · "이거 알아요?" 전부). 회차를 읽은 기록의 모양은 D64
- **F-E1-i** 회차 화면은 스크립트가 있어야 넘어간다 (물음 버튼 · 체험). 스크립트 없이 열면 표지만 보인다 (등장 효과가 풀리지 않을 수 있다 — 옛 화면은 `noscript` 로 풀었다). 확인하지 않았다
- **F-E1-j** 실제 기기 (iOS Safari)에서 보지 않았다 — Chrome 의 390×844 뿐. 위쪽 줄의 안전 영역 (`env(safe-area-inset-top)`)은 노치 있는 폰에서 도윤이 한 번
- UX-6 의 _open (c 답 감추기 범위 · d 처음 보는 독자에게 지난 값)은 그대로 — 실제 주소에서도 같은 부품이라 같이 바뀐다

### 스스로 내린 판단 — 수용 여부는 PM
- 주소 꼴 `/s/<series.code>/<number>` (①)
- 시안 주소를 남기고 같은 부품을 쓰게 함 (③) — 실제 주소로 넘기지 않았다
- `--ep-*` 이름을 남기고 값만 토큰으로 (④)
- 번호 링크 넘기기 · `PATHS.claro` 를 새 주소로 (④)
- 남음 장면의 약속 한 줄을 실제 화면에서 바꿔 보임 (⑤) · "미리보기" 표시를 넣음 (⑦ 2)
- 실제 화면의 첫 장 `‹` 를 첫 화면으로 가는 길로 · 남음 장면에 "첫 화면으로"
- `/s/rate/3` 대기 화면을 실제 주소에 두지 않음 (⑤)
- 새 e2e `e2e/episode.spec.ts` (6) · 스크린샷 스크립트 `scripts/shots-fe1.ts`

---

## 검사 (붙인 그대로)

`pnpm -s typecheck`
```
packages/tokens typecheck: Done
packages/contract typecheck: Done
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck$ tsc -p .
apps/web typecheck: Done
```

`pnpm -s test` (끝난 뒤 `logs/frontend/F-2b/` 의 다시 찍힌 그림은 파일 하나씩 `git checkout -- <파일>`)
```
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  121 passed (121)
packages/pipeline test:  Test Files  11 passed (11)
packages/pipeline test:       Tests  125 passed (125)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   ✓   4 e2e/episode.spec.ts:24:1 › 첫 화면 — 종이 톤 · 시리즈 셋 · 오늘의 회차 (가장 최근 발표) · 옛 화면이 아니다 (1.3s)
apps/web test:   ✓  19 e2e/episode.spec.ts:50:1 › 번호가 있는 옛 링크 (/?r=) 는 옛 화면으로 넘어간다 — 번호는 그대로 따라간다 (300ms)
apps/web test:   ✓  20 e2e/episode.spec.ts:57:3 › /s/price/1 — 누가 값을 정하나 1화: 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 시안의 것이 없다 (4.9s)
apps/web test:   ✓  22 e2e/episode.spec.ts:57:3 › /s/rate/2 — 금리는 어디로 2화: 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 시안의 것이 없다 (4.4s)
apps/web test:   ✓  23 e2e/episode.spec.ts:57:3 › /s/privacy/1 — 내 정보는 누가 지키나 1화: 처음 온 독자의 조립을 끝까지 · 골든의 글 그대로 · 시안의 것이 없다 (4.5s)
apps/web test:   ✓  25 e2e/episode.spec.ts:117:1 › 시안 주소는 그대로 시안이다 — 같은 부품 · 시안 띠 · 시안 주소끼리 오간다. 실제 주소에 없는 것 (파이프라인 시험판 · 견본)은 /s 에 없다
apps/web test:   ✓  52 e2e/record-own-server.spec.ts:118:1 › 배포(Vercel) 빌드 — /test/* 가 닫혀 있다 · /api/peek 가 없다 · 검색을 막는다 · 일반 기사 흐름은 바깥 기사의 링크만 싣는다
apps/web test:   62 passed (3.1m)
```
웹 62 = 옛 화면 · API 56 (F-E1 전과 같은 수 — 주소만 새 주소로) + 새 6 (`e2e/episode.spec.ts`).
첫 번째로 돌렸을 때는 새 시험 셋이 떨어졌다 (59 passed · 3 failed) — 화면이 아니라 **시험이** 장면이 바뀌는 동안 (앞 장면이 물러나는 0.2초) 글을 읽었다. 이 장면의 첫 글이 보일 때까지 기다리게 고쳐 다시 돌린 것이 위다.

`pnpm --filter @claro/contract test`
```
 Test Files  5 passed (5)
      Tests  121 passed (121)
```

시안 `check.ts` — `pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts` (끝 다섯 줄) · `fomc-auto/check.ts` · `rate-3/check.ts` (끝 줄)
```
■ 공통 화면 글 (kit/chrome.ts) · 첫 화면 글 (home-copy.ts)
실제 주소: /s/price/1 · /s/rate/2 · /s/privacy/1 — 오늘의 회차 /s/price/1 (발표 2026-11-09)
OK — 숫자가 든 글이 없다

OK — 회차 3 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글
OK — 계약 검증을 지났고 (구절은 전부 저장된 문서에 있고, 글의 숫자는 전부 근거 구절 · 계산 · 화면 번호 중 하나다. 풀이 칸의 규칙도 맞다), 화면 쪽 검사도 맞다
OK — 대기 화면의 글 (숫자는 밝혀 둔 날짜 하나 · 화면 번호뿐)
```

`next build` (주소 표)
```
┌ ○ /
├ ○ /again
├ ƒ /api/…  (여덟 — 그대로)
├ ○ /archive/fomc-2026-09
├ ○ /lab/episode
├ ○ /lab/episode/carry
├ ○ /lab/episode/fomc
├ ○ /lab/episode/fomc-auto
├ ○ /lab/episode/pipc
├ ○ /lab/episode/quiet
├ ƒ /lab/episode/rate-3
├ ○ /news
├ ○ /robots.txt
├   /s/[series]/[n]
│ ├ ● /s/price/1
│ ├ ● /s/rate/2
│ └ ● /s/privacy/1
├ ○ /test/moments
└ ○ /test/unknown-type
```
배포와 같은 빌드 (`VERCEL=1`)는 위 e2e 52 가 따로 지어 본다 — `/` · 옛 화면 · `/s/price/1` 200 · 일곱 주소의 robots 메타 `noindex, nofollow`.

**회차 셋의 글이 골든과 한 글자도 다르지 않은가** — 둘로 봤다.
1. 골든을 건드리지 않았다: `git diff -- fixtures | wc -l` → `0` (`packages/contract` · `packages/pipeline` · `packages/db` · `docs/contract` 도 0)
2. 화면이 골든의 글을 그대로 보인다: `e2e/episode.spec.ts` 가 골든 파일을 읽어, 처음 온 독자의 장면 일곱을 끝까지 넘기며 장면마다 화면의 글에 골든의 글이 들어 있는지 본다 (빈칸 · 줄바꿈 · 굵게 표시만 빼고 글자 그대로 — 표지: 제목 · 한 줄 · 날 · 처음 온 독자 안내 · 물음 · 시리즈 줄 / 0화: 이름표 · 제목 · 칸마다 머리와 글 / 사건: 이름표 · 제목 · 첫 문단 · 인용 · 수수께끼 / 도구: 이름표 · 제목 · 도구 이름 / 풀이: 제목 · 들머리 · (연 뒤) 문서가 말한 것 · 판정 · 누구의 말 / 이어짐 · 남음). 근거 시트의 구절도 골든의 구절 가운데 하나인지 본다
보지 않은 것: 따라온 독자의 글 (실제 화면에 나가지 않는다) · 도구 카드 안의 글 ("이거 알아요?" 에 답해야 펼쳐진다) · 체험 틀 안의 글 — 이것들은 시안과 같은 부품 · 같은 골든이라 UX-4 ~ UX-6 의 확인 그대로다.

실제 주소 (로컬 · `next start`)
```
200 /                200 /s/price/1       200 /s/rate/2        200 /s/privacy/1
404 /s/rate/3        404 /s/x/1           200 /archive/fomc-2026-09
200 /lab/episode  · /fomc · /pipc · /rate-3 · /carry · /quiet · /fomc-auto
200 /news            200 /again           200 /robots.txt
307 /?r=<UUID> → /archive/fomc-2026-09?r=<UUID>
```
메타 (`/s/rate/2`)
```
<title>물가가 높다면서, 왜 안 올렸을까 — 금리는 어디로 2화 · Claro</title>
<meta name="description" content="미국 중앙은행이 금리를 그대로 뒀어요. 그런데 같은 날 낸 성명문에는 “물가는 여전히 높다”고 적혀 있었어요."/>
<meta name="robots" content="noindex, nofollow, nocache"/>
<meta property="og:title" content="물가가 높다면서, 왜 안 올렸을까"/>
<meta property="og:description" content="미국 중앙은행이 금리를 그대로 뒀어요. …"/>
<meta property="og:site_name" content="Claro · 금리는 어디로 2화"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary"/>
```
첫 화면: `<title>Claro — 뉴스 하나가 이야기 한 편이 돼요</title>` · `og:title` 같은 글 · `og:type website` · robots 그대로.

## 스크린샷 — `logs/frontend/F-E1/` (390×844 · `apps/web/scripts/shots-fe1.ts`)

`local-*` = 배포 전 로컬 (`next build` + `next start`) · `live-*` = 배포 뒤 실제 주소 (같은 스크립트 · 같은 이름)
- 첫 화면: `home-1` (맨 위 — 소개 · 오늘의 회차) · `home-2` · `home-3` (시리즈 셋) · `home-4` (맨 아래)
- 회차 셋 (`price-1` · `rate-2` · `privacy-1`)마다: `-cover` (표지) · `-lab` · `-lab-2` (체험) · `-lab-gate` (답 감추기) · `-keep` · `-keep-end` (남음 — 다른 시리즈 · 첫 화면으로) · `-map` (지도 · 책장)
- `rate-2-source` (근거 — 문장을 누르면 원문 구절)
- `archive-fomc-2026-09` (옛 B5 의 새 주소)

## 파일

- 새: `apps/web/src/app/page.tsx` (첫 화면) · `home.css` · `apps/web/src/app/s/[series]/[n]/page.tsx` · `apps/web/src/episode/catalog.tsx` · `home-copy.ts` · `apps/web/e2e/episode.spec.ts` · `apps/web/scripts/shots-fe1.ts`
- 옮김 (`git mv`): `app/page.tsx` → `app/archive/fomc-2026-09/page.tsx` · `app/lab/episode/kit/**` · `episode.css` · `episodes/{delivery,fomc,pipc}/**` → `src/episode/`
- 고침: `src/episode/kit/{Episode.tsx,ConceptMap.tsx,shelf.ts,types.ts,chrome.ts}` · `src/episode/episode.css` · `src/episode/episodes/*/{data.ts,index.tsx}` · `app/lab/episode/**` (import 길 · `check.ts` S7) · `packages/tokens/src/{values.ts,css.ts}` · `next.config.ts` · `src/study/flows.ts` · `e2e/{reader,ledger,record.spec,study.spec,record-own-server.spec,api.spec}.ts`
- 문서: 이 로그 · `docs/development-frontend.md` 의 F-E1 줄
