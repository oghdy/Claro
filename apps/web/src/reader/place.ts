import type { ArticlePackage, LevelId } from "@claro/contract";

// 읽던 자리 — 레벨마다 지금 장과 "끝을 본 장", 그리고 지금 레벨.
//   레벨을 바꾸면: 처음 가는 레벨은 1장, 돌아온 레벨은 읽던 자리 (도윤 · 2026-10-12, F-2b 물음 4)
//   새로고침하면: 되살린다. 같은 탭 안에서만 — 탭을 닫거나 며칠 뒤 다시 열면 1장이다 (물음 7). 그래서 sessionStorage 다
// **저장은 이 파일에서만 한다.** 되살린 것은 같은 열람이다 (D33) — 읽기 기록을 붙이는 Step 은 열람 번호를 여기에 같이 넣으면 된다.
// 화면은 기록을 만들지 않는다. 여기 있는 것은 화면이 다시 그려지는 데 필요한 것뿐이다.

/** 한 레벨에서의 자리. ended[i] = i 장의 끝이 화면에 나온 적이 있다 (물음 버튼이 이미 나왔다 — 되살린 뒤 같은 순간을 두 번 내지 않으려고 같이 든다) */
export interface LevelPlace {
  idx: number;
  ended: boolean[];
}

export interface Place {
  level: LevelId;
  at: Partial<Record<LevelId, LevelPlace>>;
}

// 기사를 가리키는 키. 패키지에는 판의 ID 가 없다 (ARTICLE_PACKAGE §2 — article_id 는 ArticleRecord 에 있다).
// 지금은 사건 + 발행 시각으로 가른다. 화면이 판의 ID 를 받게 되면 그것으로 바꾼다
const key = (pkg: ArticlePackage) => `claro:place:${pkg.event_ref}:${pkg.published_at}`;

/** 저장된 자리. 없거나, 못 읽거나, 지금 패키지와 안 맞으면(레벨 · 장수) null — 그러면 1장부터다 */
export function loadPlace(pkg: ArticlePackage): Place | null {
  try {
    const raw = window.sessionStorage.getItem(key(pkg));
    if (!raw) return null;
    const p = JSON.parse(raw) as Place;
    const at: Place["at"] = {};
    for (const l of pkg.levels) {
      const v = p.at?.[l.id];
      const n = l.slides.length;
      if (v && Number.isInteger(v.idx) && v.idx >= 0 && v.idx < n && Array.isArray(v.ended) && v.ended.length === n)
        at[l.id] = { idx: v.idx, ended: v.ended.map(Boolean) };
    }
    return pkg.levels.some((l) => l.id === p.level) ? { level: p.level, at } : null;
  } catch {
    return null; // 저장소를 못 쓰는 브라우저(개인 정보 보호 모드 등) — 기억하지 않을 뿐 읽는 데는 지장이 없다
  }
}

export function savePlace(pkg: ArticlePackage, place: Place): void {
  try {
    window.sessionStorage.setItem(key(pkg), JSON.stringify(place));
  } catch {
    /* 위와 같다 */
  }
}
