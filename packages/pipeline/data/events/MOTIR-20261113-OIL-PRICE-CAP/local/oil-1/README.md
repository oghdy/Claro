# local/oil-1 — 기름값 1화, 로컬 세션이 쓴 판

파이프라인 산출물이 아니다. 로컬 세션 (Sonnet 5.5)이 손으로 쓰고 편집자 (Opus)가 빈 곳을 짚은 판이다 (모델 API 0). 파이프라인의 `../../episodes/oil-1/` 은 그대로 있고, 파이프라인 `--check` 는 그쪽만 본다.

- `episode.json` — 계약의 Episode (`episode_id` 그대로 · `episode_version: 2`). 같은 사건 · 같은 소스 팩 · 같은 구절
- `screen.json` — 계약에 없는 화면 칸 셋: `news` (제목 위 뉴스 한 줄) · `veil` (멈춘 고리 가림) · `burst` (풀이 뒤 문서 문장)
- 어디서 왔나: UX-10b → UX-11a → UX-11b (`apps/web/src/app/lab/episode/oil-replot-b2/`) → F-E6a (작은 글 손질 셋)
- 검사: `validateEpisode(episode, { documents })` 를 `../../store.documents.json` 의 `source_documents` 와 돌려 오류 0 · `screen.json` 의 구절이 문서 글 그대로인지 (로그 `logs/frontend/F-E6a.md`)
