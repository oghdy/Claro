# logs/frontend · UX-13b — 시작 화면 다듬기 "잡스 바이브" (D146)

## UX-13b · 2026-11-18 · 서브에이전트 (새 세션) · 검수 대기(PM) → 도윤

**작업 세션 모델: Fable 5.2** (`claude-fable-5-2`) · **모델 API 0** · `docs/PM.md` 안 읽음.
도윤: "둘째 이야기는 들어가기 버튼이 없으니까 허전함 … 사용자가 딱 보고 이게 뭐 하는 기능인지 바로 알아야 하고, 한 화면에서 어떤 행동을 해야 할지 고민하면 안 됌. 이야기 다 읽으면 그 달력 화면으로 돌아오게 해 주셈. UI/UX 철학이 잡스 바이브라고 생각하면 쉬움."
고친 파일 (전부 lab `apps/web/src/app/lab/start/`): `Start.tsx` · `start.css` · `page.tsx` · `days/page.tsx` · `shots.ts` · 새 파일 `end/page.tsx` (이야기 끝 견본) · 이 로그 · 그림 `logs/frontend/UX-13b/` (17장). 실제 화면 · kit · `/lab/home-days/*` 는 0줄.

**한 줄 답**: 시작 화면에서 가장 큰 글이 **오늘 첫 이야기의 제목** 하나가 됐고, **이야기마다 같은 말 · 같은 꼴의 들어가기 단추**가 붙었다 (첫째 먹색 · 둘째부터 먹색 테). 달력은 누를 날이 옅은 동그라미로 서고 줄마다 동그란 들어가기가 붙었다. 이야기 끝은 **먹색 단추 하나 "다른 이야기 보기" → 달력** 으로 설계했다 (견본 그림 · 실제 kit 은 안 고침).

## ① 주소

- 시작 화면: `/lab/start` — 견본 `?n=1` · `?n=3` · `?n=4` (오늘 이야기가 하나 · 셋 · 넷일 때) · `?n=long` (오늘 묶음에 긴 이야기가 있을 때)
- 달력 화면: `/lab/start/days` — `?d=2026-11-18` (그날을 골라 둔 채로 — 이야기 끝에서 올 때) · `?many=1` (일주일 견본)
- 이야기 끝 견본 (설계 그림): `/lab/start/end` (짧은 이야기) · `/lab/start/end?k=long` (긴 이야기)

## ② 잣대 셋으로 걸린 것 → 고친 것

잣대: ① 보자마자 무엇을 하는지 안다 (설명 글 없이) ② 지금 할 일이 하나로 분명하다 ③ 누를 것은 누를 것처럼 보인다.

### 시작 화면

| 걸린 것 | 잣대 | 어떻게 |
|---|---|---|
| 둘째 이야기가 글줄뿐 — 눌리는 줄인지 안 보임 (도윤이 짚음 · UX-13 _open a) | ③ | **이야기마다 들어가기 단추** (③ 아래) |
| 화면에서 가장 큰 글이 한마디 (31px 두 줄)였다 — 누를 것이 아닌 글이 가장 크고, 첫 제목 (26px)과 다툼 (UX-13 _open b) | ② | 한마디를 **작은 회색 한 줄** (15px · Claro 표 바로 아래 · `tagline` 의 줄바꿈만 빈칸으로)로 내림. 이제 가장 큰 글 = 첫 이야기 제목, 가장 진한 곳 = 그 아래 먹색 단추 |
| 한마디 아래 "궁금한 물음 하나를 골라, 따라 들어가 보세요." — 무엇을 하라는 설명 글 | ① | **뺌**. 단추의 말 ("이야기 속으로 들어가기")이 같은 일을 한다 |
| 오른쪽 위 "미리보기" — 누를 수 없는데 메뉴처럼 보임 | ③ (거꾸로) | **뺌**. 미리보기라는 사실은 맨 아래 글이 말한다 |
| 한마디와 오늘 사이 가는 선 | 덜어 내기 | 뺌 (여백으로 가름). 선은 이야기와 이야기 사이에만 |
| 문 둘 — 키 140px 상자 + 회색 설명 한 줄씩 ("날짜별로 보기" · "이야기에서 주운 개념" — UX-13 이 새로 적은 글 · _open d). 화면에서 면이 있는 유일한 곳이라 이야기보다 눈이 먼저 감 | ① ② | 키 **101px** 로 낮추고 설명 줄 둘을 **뺌** — 그림 (점 달력 · 점 지도) + 이름 + 화살표면 안다. 화살표는 이름 옆 (오른쪽 아래)으로 |
| 맨 아래 미리보기 글 세 문장 (두 줄) | 덜어 내기 | **앞의 두 문장만** ("지금은 미리보기예요. 아직 날마다 새 이야기를 내지는 못해요.") — 한 줄. 셋째 문장 (지도가 처음으로 돌아간다)은 지도가 없는 이 화면의 일이 아니고 `/map` · 이야기 끝이 이미 말한다 (_open c) |
| 긴 이야기가 오늘 묶음일 때 제목 아래 소개 네 줄 (`dek`) — 문이 첫 장 끝에 걸림 (UX-13 _open c) | ② | **뺌**. 긴 이야기도 짧은 이야기와 같은 꼴 (꼬리에 "긴 이야기"만). 들어가면 표지가 바로 말한다. `?n=long` 이 한 장 (844px)에 든다 |

### 달력 화면

| 걸린 것 | 잣대 | 어떻게 |
|---|---|---|
| 이야기 있는 날 = 굵은 숫자 + 아래 작은 점 — 누를 날인지 약함 | ③ | 이야기 있는 날에 **옅은 면 동그라미** (38px · 먹 9%) — 단추처럼 보인다. 점은 면이 대신하니 뺌 |
| 표시가 넷 (없는 날 · 있는 날 · 가장 새 날의 테 · 고른 날) — 테가 무슨 뜻인지 설명 글 ("가장 새 이야기예요")이 있어야 앎 | ① | 표시를 **셋으로**: 회색 숫자 (못 누름) · 옅은 동그라미 (누를 날) · 먹색 (고른 날). 테와 그 설명 글을 뺌 (UX-13 의 새 글자 하나가 또 사라짐) |
| 고른 날의 이야기 줄 · "그 전"의 줄이 글줄뿐 | ③ | **줄마다 오른쪽에 동그란 들어가기** (40px · 먹색 테 + 화살표 — 시작 화면 둘째 단추와 같은 테 · 같은 화살표). 줄 전체가 링크 |
| 이야기 끝에서 오면 어느 날이 골라져 있어야 하나 | ② | `?d=YYYY-MM-DD` — 방금 읽은 이야기의 날을 골라 둔다 (그날의 다른 이야기가 바로 보임). 없으면 UX-13 그대로 (바로 위 지난 날) |

`Calendar.tsx` · `home-days.css` 는 0줄 — 달력의 바뀐 꼴은 `start.css` 의 `.sp-days …` 덮어쓰기와 `newest={null}` 로만 했다.

## ③ 오늘 이야기의 들어가기 — 꼴과 까닭

- **꼴**: 이야기마다 제목 · 꼬리 아래에 알약 단추 하나 — 말은 전부 `HOME.go` "이야기 속으로 들어가기 →" 그대로. **첫 이야기만 먹색으로 채움** (48px) · **둘째부터는 같은 꼴의 먹색 테 단추** (44px). 제목도 첫째 26px · 둘째부터 20px. 이야기 사이는 가는 선 하나. 줄 전체가 링크라 제목을 눌러도 들어간다
- **까닭 (잣대 ②)**: 셋을 폰에서 나란히 봤다 — (가) 첫째 먹색 + 나머지 테 (나) 전부 먹색 · 같은 크기 (다) 첫째 먹색 + 나머지는 오른쪽 동그란 화살표.
  (나)는 까만 단추 둘이 똑같이 소리쳐서 "어느 것부터?"를 독자에게 넘긴다. (다)는 가장 깔끔하지만 둘째에 "들어가기"라는 말이 없어 도윤이 짚은 허전함이 반쯤 남는다. (가)는 **말과 꼴이 같아 둘 다 틀림없이 단추**이고, 진한 것은 하나라 "고민되면 이것부터"가 선다 — (가)로 했다. (나) · (다)의 그림은 견줌으로만 봤고 남기지 않았다
- **하나일 때** (`?n=1`): 제목 + 먹색 단추 하나 + 문 둘 — 가장 분명하다 (화면 844 · 문 아래 끝 525)
- **셋일 때** (`?n=3`): 같은 꼴이 그대로 선다. 화면 키 964 (견본 띠 90 포함 → 띠 없이 약 874) — **문 둘이 접는 선에 걸리고 살짝 내려야 한다**
- **넷일 때** (`?n=4`): 1146 (띠 빼고 약 1056) — 넷째 이야기부터 첫 장 밖. 오늘 이야기가 주인이라 문이 밀리는 건 받아들였다 (UX-13 _open g — 줄이려면 셋째부터 동그란 단추 줄로 좁히는 길이 있다 · _open b)

## ④ 이야기 끝 → 달력 (설계 · 코드는 F-E9)

**지금 끝 장면** (그림 `10-end-now-long-*` · `11-end-now-short-*`):
- 긴 이야기 `/s/oil/1` — 화면 키 1365 · **누를 것 6**: 감색 큰 단추 "내 개념 지도 보기" · "다른 시리즈" 테 상자 셋 · 밑줄 글 "처음부터 다시" · "첫 화면으로" (`/`). 가장 큰 단추가 나가는 길이 아니라 지도이고, 나가는 길은 맨 아래 작은 밑줄 글이다 (잣대 ② ③ 에 걸림)
- 짧은 이야기 `/short/suneung-alert` — 누를 것 2: 작은 밑줄 글 "처음부터 다시" · "첫 화면으로". 다 읽었는데 **단추가 하나도 없다** (잣대 ③)

**끝에서 할 일 하나 = "다른 이야기 보기" → 달력 화면** (견본 `12-end-sample-short` · `13-end-sample-long-*`):
- 맨 아래 **먹색 알약 단추 하나** (폭 가득 · 56px) "다른 이야기 보기 →" → 달력 화면, **방금 읽은 이야기의 날을 골라 둔 채로** (`…/days?d=<그 이야기의 day>` · day 없는 이야기는 `?d` 없이). 짧은 이야기는 화면 맨 아래에 붙는다
- **남길 것**: 물음 · 제목 · 한 줄 · (짧은) 덧붙인 것 · (긴) 지도 + 주운 개념 — 읽은 보람은 그대로. "내 개념 지도 보기"는 감색 큰 단추에서 **지도 바로 아래 작은 글 한 줄** (오른쪽 · 화살표)로 내림 — 지도에 딸린 일이지 끝의 할 일이 아니다 (머리 막대의 지도 단추도 그대로 있다). "저장되지 않아요" 글은 작은 회색으로
- **뺄 것**: "다른 시리즈" 상자 전부 (달력이 그 일을 한다) · "첫 화면으로" (먹색 단추가 대신) · "처음부터 다시" (_open d)
- **이어지는 것**: 다음 화가 목록에 실제로 있는 번호 시리즈 (`next-episode` — 지금은 금리 1화 → 2화 꼴)와 "다음 화" 예고 (`ep-nextup`)는 견본에 안 그렸다 — 먹색 단추 아래 조용한 한 줄로 남기는 것을 권한다 (_open e)
- **머리 막대의 ‹** (첫 장에서): 이야기가 사는 곳으로 — **가장 새 날의 이야기 = 시작 화면** · **그 밖의 이야기 = 달력 화면 (그날 골라 둠)**. 독자가 들어온 길과 거의 늘 같다 (기록 없이 정해지는 규칙). 달력 화면의 ‹ 는 시작 화면 (지금 그대로)
- 단추의 말 "다른 이야기 보기"는 지시문의 보기 그대로다 — 새 글자라 도윤이 정할 일 (_open a)

**F-E9 가 고칠 곳**:
- `apps/web/src/episode/kit/Episode.tsx` — `Keep` (567 ~ 671줄): `ep-map-button` (614 ~ 621) → 작은 글 · `others.map` 다른 시리즈 (649 ~ 658) 뺌 · `ep-restart` · `home-link` (659 ~ 668) → 먹색 단추 하나 · 머리 막대 `bar-home` 의 `href="/"` (826줄)
- `apps/web/src/episode/kit/Short.tsx` — `home` (126줄 · `href: "/"`) · 끝의 `ep-restart` · `to-today` (300 ~ 307) → 먹색 단추 · `bar-home` (320줄)
- `apps/web/src/episode/kit/chrome.ts` — `keep.home` · `chrome.home` 의 말 · 새 단추의 말
- `apps/web/e2e/episode.spec.ts` — `home-link` (451줄) · `to-today` (540줄) · `other-*` 시험
- 이야기가 제 `day` 를 알아야 한다 (`catalog.tsx` 의 `Line.day` → 화면으로) · 실제 달력 주소 (lab 의 `DAYS` · `?d=`) · 단추 꼴은 `start.css` 의 `.sp-end-go`

## ⑤ 폰 그림 · 내 눈으로 본 것

`logs/frontend/UX-13b/` (390×844 · 2배). 앞 (UX-13)은 `logs/frontend/UX-13/1-start.png` · `3-days.png` (커밋 `4a3977f`).
`1-start` · `360-1-start` · `2-start-one` · `3-start-three` · `4-start-four` · `5-start-long` · `6-days` · `7-days-other-before` (15일 누름 + "그 전" 폄) · `8-days-from-end` (`?d=`) · `9-days-many` · `10-end-now-long-top/bottom` · `11-end-now-short-top/bottom` · `12-end-sample-short` · `13-end-sample-long-top/bottom`.

- **시작 ① 무엇을 하는지**: 위에서 Claro · 한 줄 · "오늘의 이야기 2편" · 이야기 둘 (각각 단추) · 문 둘. 설명 글이 한 줄도 없어도 읽힌다. 점 달력 그림 + "지난 이야기"는 바로 읽힌다 · 점 지도 그림은 여전히 "개념 지도"라는 이름에 기댄다
- **시작 ② 할 일 하나**: 앞 그림은 눈이 큰 한마디 → 제목 → 단추 → 문으로 네 번 옮겨 갔다. 지금은 제목 → 먹색 단추에서 멈춘다. 둘째 이야기의 테 단추는 분명히 단추지만 먹색보다 한 걸음 뒤다 — 다투지 않는다
- **시작 ③ 누를 것**: 단추 둘 · 문 둘 — 넷 다 면이나 테가 있다. 누를 수 없는 글 (한 줄 · 머리 · 미리보기 글)은 전부 면 없는 글이다
- **솔직히 걸리는 것**: ⓐ 문 아래로 **빈 자리가 크다** (문 아래 끝 616 / 844 — 180px 쯤). 담백하지만 휑하게 볼 수도 있다 (셋일 땐 그 자리가 찬다) ⓑ "이야기 속으로 들어가기"가 두 번 적힌다 — 같은 말이라 분명하지만 되풀이다 ⓒ 360 폭에서 첫 제목이 두 줄 (화면은 한 장 그대로) ⓓ 그림이 여전히 하나도 없다 (UX-13 과 같음)
- **달력**: 15 · 17 · 18 이 동그라미로 서서 "여기를 누른다"가 설명 없이 보인다. 견본 (`9-days-many`)은 동그라미 여덟이 줄지어 더 분명하다. 줄 오른쪽 동그란 화살표는 한눈에 단추다. 제목이 두 줄인 줄 (`7-…`)도 단추와 안 겹친다. 걸리는 것: 화면 제목은 "지난 이야기"인데 가장 새 날 (18)도 여기 있다 — 이야기 끝에서 오면 더 어긋난다 (_open f)
- **끝 견본**: 짧은 이야기 — 글 두 덩이 아래 먹색 단추 하나, 다른 누를 것 0. 지금 그림 (작은 밑줄 글 둘)과 견주면 차이가 가장 크다. 긴 이야기 — 지도 · 주운 개념 · 작은 "내 개념 지도 보기 →" · 회색 글 · 먹색 단추. 누를 것 6 → 2
- 넘침 · 잘림: 가로 넘침 0 · 잘린 글 0 (390 · 360). 누를 곳: 단추 48 · 44 · 문 101 · 달력 칸 48 · 줄 66 이상 · 끝 단추 56. 그림 왼쪽 아래 검은 "N" 은 개발 서버 표시 (배포에 없음)

재기 (`shots.ts` 출력 그대로):
```
start 200 {"overflowX":0,"page":844,"stories":2,"go":[48,44],"doors":[101,101],"doorsBottom":616,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
  머리: 오늘의 이야기 · 이야기마다 단추: /short/suneung-alert [이야기 속으로 들어가기] · /short/ai-hacking-tool [이야기 속으로 들어가기]
start?n=1 200 {"overflowX":0,"page":844,"stories":1,"go":[48],"doors":[101,101],"doorsBottom":525,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
start?n=3 200 {"overflowX":0,"page":964,"stories":3,"go":[48,44,44],"doors":[101,101],"doorsBottom":888,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
start?n=4 200 {"overflowX":0,"page":1146,"stories":4,"go":[48,44,44,44],"doors":[101,101],"doorsBottom":1070,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
start?n=long 200 {"overflowX":0,"page":844,"stories":2,"go":[48,44],"doors":[101,101],"doorsBottom":767,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
days 200 {"overflowX":0,"page":796,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":6,"rowMin":66,"cellMin":48,"clipped":0}
  처음 고른 날 2026-11-17 · 누를 날 2026-11-15 2026-11-17 2026-11-18
  2026-11-15 누름 → 2026-11-15 최고가격이 그대로면, 주유소 값도 못 넘을까요 | 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
days?d=2026-11-18 200 {"overflowX":0,"page":796,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":6,"rowMin":66,"cellMin":48,"clipped":0}
  ?d=2026-11-18 → 고른 날 2026-11-18 11월 18일 수요일 2편
days?many=1 200 {"overflowX":0,"page":796,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":6,"rowMin":66,"cellMin":48,"clipped":0}
실제 끝 /s/oil/1 keep 키 1365 · 누를 것 6 : 내 개념 지도 보기 | 다른 시리즈누가 값을 정하→/s/price/1 | 다른 시리즈금리는 어디로2→/s/rate/2 | 다른 시리즈내 정보는 누가→/s/privacy/1 | 처음부터 다시 | 첫 화면으로→/
실제 끝 /short/suneung-alert keep 키 796 · 누를 것 2 : 처음부터 다시 | 첫 화면으로→/
end 200 {"overflowX":0,"page":702,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
end?k=long 200 {"overflowX":0,"page":1003,"stories":0,"go":[],"doors":[],"doorsBottom":null,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
시작 · 이야기 1 의 단추 → /short/suneung-alert
시작 · 이야기 2 의 단추 → /short/ai-hacking-tool
문 ① 지난 이야기 → /lab/start/days
달력 · 첫 줄의 동그란 단추 → /short/suneung-cheating
달력의 ‹ → /lab/start
문 ② 개념 지도 → /map
끝 견본의 단추 → /lab/start/days?d=2026-11-18 · 고른 날 2026-11-18
실제 / 200 키 4401
폭 390 페이지 오류 0
360-start 200 {"overflowX":0,"page":844,"stories":2,"go":[48,44],"doors":[101,101],"doorsBottom":649,"rows":0,"rowMin":null,"cellMin":null,"clipped":0}
폭 360 페이지 오류 0
스크립트 없이 start — 머리 11월 18일의 이야기 · 이야기 2 · 단추 2 · 문 /lab/start/days /map
스크립트 없이 days — 고른 날 2026-11-17 · 제목 수능장 Wi-Fi 차단, 정말 정해진 걸까 | 미국, AI 칩 원격 사용 막았다는데, 접속 금지?
```
(실제 `/` 의 키 4401 은 UX-13 때와 같다)

## ⑥ 실제 0 변화

커밋 전 `git status --short` (`.claude/launch.json` 은 남의 것 — 안 건드림 · 안 실음):
```
 M apps/web/src/app/lab/start/Start.tsx
 M apps/web/src/app/lab/start/days/page.tsx
 M apps/web/src/app/lab/start/page.tsx
 M apps/web/src/app/lab/start/shots.ts
 M apps/web/src/app/lab/start/start.css
?? .claude/launch.json
?? apps/web/src/app/lab/start/end/
?? logs/frontend/UX-13b.md
?? logs/frontend/UX-13b/
```
`git diff --stat HEAD -- apps/web/src/app/page.tsx apps/web/src/app/home.css apps/web/src/app/map apps/web/src/app/s apps/web/src/app/short apps/web/src/episode apps/web/e2e apps/web/src/app/lab/home-days packages fixtures docs/contract` → (빈 줄)
- 고친 것은 `apps/web/src/app/lab/start/` 안뿐이다. kit (`Episode.tsx` · `Short.tsx` · `chrome.ts` · `ConceptMap.tsx` · `parts.tsx`) · `catalog.tsx` · `home-copy.ts` · `Calendar.tsx` · `days.ts` · `home-days.css` 는 불러 쓰기만 했다 (끝 견본이 kit 의 `ConceptMap` · `CHROME` 을 읽는다)
- e2e 의 지금 시험 90 그대로 통과 (⑦) · 새 e2e 없음 · 실제 `/` 키 4401 (UX-13 때와 같음)
- `pnpm -s test` 가 다시 찍은 `logs/frontend/F-2b/` 그림 7 은 하나씩 `git checkout -- <파일>` · 개발 서버가 만든 `apps/web/AGENTS.md` · `CLAUDE.md` 는 지움

## ⑦ 검사 결과

```
$ pnpm -s typecheck                  (exit 0)
packages/pipeline typecheck: Done
packages/db typecheck: Done
apps/web typecheck: Done

$ pnpm --filter @claro/web exec tsx src/app/lab/episode/check.ts     (exit 0)
OK — 숫자가 든 글이 없다
OK — 회차 4 (계약 + 화면 쪽) · 조용히 견본 · 지난 값 견본 · 공통 글

$ pnpm -s test                       (exit 0 — 첫 돌림에)
packages/contract test:  Test Files  5 passed (5)
packages/contract test:       Tests  156 passed (156)
packages/pipeline test:  Test Files  15 passed (15)
packages/pipeline test:       Tests  182 passed (182)
packages/db test:  Test Files  3 passed (3)
packages/db test:       Tests  101 passed (101)
apps/web test:   90 passed (3.5m)
```
- `p3.test.ts` 시간 초과는 이번엔 안 났다 (한 번에 통과)
- 폰 그림은 개발 서버 (`next dev -p 3214` · 따로 둔 빌드 폴더 `.next-ux13b`)에서. 서버는 껐고 빌드 폴더는 지웠다
- 배포 확인은 아래 "push 뒤"

## ⑧ _open

- **a** 끝 단추의 말 "다른 이야기 보기" — 지시문의 보기를 그대로 썼다. 새 글자다 (도윤이 정할 일). 견본의 띠 글 · 견본 이름 (`?n=` 띠)도 lab 전용 새 글자
- **b** 오늘 이야기가 셋 · 넷이면 한 장을 넘는다 (띠 빼고 약 874 · 1056) — 문이 접는 선 아래로. 받아들일지, 셋째부터 좁은 줄 (동그란 단추)로 바꿀지
- **c** 미리보기 글을 두 문장으로 줄였다 ("화면을 닫으면 지도가 처음으로" 뺌) · 오른쪽 위 "미리보기" 표 뺌 · 한마디 아래 한 줄 (`sub`) 뺌 · 긴 이야기의 소개 한 줄 (`dek`) 뺌 — 덜어 낸 넷. 되살릴 것이 있나
- **d** 끝 장면에서 "처음부터 다시"를 뺐다 — 다시 읽으려면 달력에서 다시 들어간다. 작은 회색 글로 남기는 길도 있다
- **e** 다음 화가 실제로 있는 번호 시리즈의 끝 — "다음 화" 줄을 먹색 단추 아래 조용히 남길지 (권함), 그때는 다음 화가 먹색이어야 하는지. 견본에 안 그렸다 (지금 목록에 그 꼴의 가장 새 이야기가 없다)
- **f** 달력 화면의 제목이 "지난 이야기"인데 가장 새 날도 거기 있다 — 이야기 끝에서 돌아오는 곳이 되면 이름이 어긋난다 (새 글자가 필요해 안 고침). 방금 읽은 이야기도 그 줄에 그대로 보인다 (읽은 표시 없음 — 기록을 저장하지 않아서)
- **g** 머리 막대 ‹ 의 규칙 (가장 새 날 이야기 → 시작 · 그 밖 → 달력)은 글로만 남겼다. 더 단순하게 "‹ 는 늘 시작"으로 할 수도 있다
- **h** 시작 화면의 문 아래 빈 자리 (180px 쯤) · 같은 단추 말 두 번 · 그림 없음 — ⑤ 의 솔직한 것
- **i** `/lab/start` 가 `?n=` 을 읽느라 정적 → 요청마다 그리는 화면이 됐다 (lab 이라 괜찮다 — 실제로 옮길 때 견본 주소는 떼어 낸다) · 달력 줄의 동그란 단추는 CSS 그림 (`::before` · `::after`)이다 — 실제로 옮길 때는 Calendar 의 줄에 제대로 넣는다 · UX-13 의 달력 _open (달 넘기기 못 봄)은 그대로
