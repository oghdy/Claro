import type { ArticlePackage, LevelId } from "@claro/contract";

// 읽던 자리 — 레벨마다 지금 장과 "끝을 본 장", 그리고 지금 레벨.
//   레벨을 바꾸면: 처음 가는 레벨은 1장, 돌아온 레벨은 읽던 자리 (도윤 · 2026-10-12, F-2b 물음 4)
//   새로고침하면: 되살린다. 같은 탭 안에서만 — 탭을 닫거나 며칠 뒤 다시 열면 1장이다 (물음 7). 그래서 sessionStorage 다
// **저장은 이 파일에서만 한다.** 되살린 것은 같은 열람이다 (D33) — 그래서 열람 번호와 그 열람의 기록이 이어 가는 것도 여기에 같이 든다 (아래 ReadingState · B-0.4b).
// 화면(Reader)은 기록을 만들지 않는다. 화면이 다시 그려지는 데 필요한 것(Place)과, 기록이 같은 열람을 이어 가는 데 필요한 것(ReadingState)은 따로 든다.

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

// ── 열람 — 읽기 기록(record.ts)이 새로고침을 넘어 이어 가는 것 (OBSERVATION §4.1 · D33 · D34)
// 같은 탭에서 되살리면 같은 열람이다: 같은 reading_id · 이어지는 seq · 같은 plan · 이미 적은 "끝"은 다시 적지 않는다 · 못 보낸 줄은 그대로 쥐고 있다.

/** 아직 못 보낸 줄 — 보낼 순서대로. row 는 서버가 받는 모양 그대로다 */
export interface Unsent {
  kind: "plan" | "event";
  id: string;
  row: Record<string, unknown>;
}

export interface ReadingState {
  reading_id: string;
  /** 다음 사건의 seq */
  seq: number;
  /** 레벨 → 그 레벨의 plan_id. 한 열람에서 레벨마다 하나다 */
  plans: Partial<Record<LevelId, string>>;
  /** 마지막으로 적은 "지금 장" — 되살린 장을 새로 들어간 장으로 다시 적지 않으려고 든다 */
  at: { level: LevelId; index: number } | null;
  /** 끝이 나왔다고 이미 적은 장 — 레벨마다 */
  ended: Partial<Record<LevelId, number[]>>;
  unsent: Unsent[];
  /** 서버가 "기록하지 않는 독자"라고 답했다 — 이 열람은 더 보내지 않는다 */
  off: boolean;
}

/** 판의 키 — 패키지가 아니라 ArticleRecord 의 것이다 */
export interface ArticleKey {
  article_id: string;
  article_version: number;
}

const SESSION = "claro:session";
const readingKey = (a: ArticleKey) => `claro:reading:${a.article_id}:${a.article_version}`;

/** 세션 = 탭 하나 (F-3 동안의 운영 규칙 · D34). 이 탭에 이미 있으면 그것을, 없으면 `make` 가 만든 것을 든다 */
export function sessionId(make: () => string): string {
  try {
    const had = window.sessionStorage.getItem(SESSION);
    if (had) return had;
    const id = make();
    window.sessionStorage.setItem(SESSION, id);
    return id;
  } catch {
    return make(); // 저장소를 못 쓰면 화면을 새로 그릴 때마다 새 세션이다
  }
}

export function loadReading(a: ArticleKey): ReadingState | null {
  try {
    const raw = window.sessionStorage.getItem(readingKey(a));
    const s = raw ? (JSON.parse(raw) as ReadingState) : null;
    return s && typeof s.reading_id === "string" && Number.isInteger(s.seq) && Array.isArray(s.unsent) ? s : null;
  } catch {
    return null;
  }
}

export function saveReading(a: ArticleKey, state: ReadingState): void {
  try {
    window.sessionStorage.setItem(readingKey(a), JSON.stringify(state));
  } catch {
    /* 기억하지 못할 뿐이다 — 새로고침하면 새 열람이 된다 */
  }
}
