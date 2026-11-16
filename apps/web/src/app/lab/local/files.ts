// 로컬 세션 판의 자리를 읽는다 (L-1 · D125 · D129) — 사건 폴더의 `local/<code>/`.
//   긴 이야기    episode.json (계약의 Episode) + screen.json (화면 칸 — 없어도 된다) + meta.json (아래) + README.md
//   짧은 이야기  story.json   (계약의 ShortStory — 옛 꼴 · D104)                      + meta.json + README.md
// `local/<code>/` 가 없으면 파이프라인이 낸 짧은 이야기의 자리 (`shorts/<code>/story.json`)를 본다 — 이미 있는 짧은 이야기를 같은 미리 보기 · 검사로 볼 수 있게 (읽기만).
// **node 의 fs 를 쓴다** — 미리 보기 주소의 서버 쪽 (빌드할 때 한 번 · page.tsx)과 스크립트 (scripts/check-local.ts · shots-story.ts)만 읽는다. 브라우저 묶음에 들어가지 않는다.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * meta.json — 계약에 없는, 이야기 곁의 손 칸 (스킬 「오늘 이야기 만들기」가 쓴다).
 *   breakers  깨는 사실의 구절 키 (법 5 — 쓰기 전에 적어 둔다). 풀이 전의 글 · 도구 · 근거에 달리면 검사가 막는다
 *   ban       깨는 말 (정규식 글자열 — 없어도 된다). 풀이 전의 글 · 그 글이 기대는 구절에 이 말이 있으면 검사가 막는다
 *   line      올릴 때 이야기 목록 (catalog.tsx STORIES)에 손으로 적을 한 줄의 값 — 미리 보기도 이 값으로 그린다 (실제와 같게)
 */
export interface LocalMeta {
  breakers?: string[];
  ban?: string[];
  line?: { day?: string; place?: string; category?: string; unpromised?: boolean };
}

export interface LocalStory {
  event: string;
  code: string;
  /** 저장소 뿌리에서의 길 */
  dir: string;
  /** local = 로컬 세션 판의 자리 · shorts = 파이프라인이 낸 짧은 이야기의 자리 (읽기만) */
  from: "local" | "shorts";
  kind: "long" | "short";
  file: unknown;
  screen: unknown | null;
  meta: LocalMeta | null;
  /** 이 사건의 저장된 문서 (store.documents.json — 권리가 git 을 허락한 것만) — 저장소 뿌리에서의 길. 없으면 null */
  store: string | null;
}

const EVENTS = "packages/pipeline/data/events";
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const json = (f: string): unknown => JSON.parse(readFileSync(f, "utf8"));

/** 이야기 하나 — 없으면 null. root = 저장소 뿌리 */
export function readLocal(root: string, event: string, code: string): LocalStory | null {
  if (!NAME.test(event) || !NAME.test(code)) return null;
  const at = (...p: string[]) => path.join(root, EVENTS, event, ...p);
  const store = existsSync(at("store.documents.json")) ? `${EVENTS}/${event}/store.documents.json` : null;
  const local = at("local", code);
  const opt = (f: string) => (existsSync(path.join(local, f)) ? json(path.join(local, f)) : null);
  if (existsSync(path.join(local, "episode.json")))
    return { event, code, dir: `${EVENTS}/${event}/local/${code}`, from: "local", kind: "long", file: json(path.join(local, "episode.json")), screen: opt("screen.json"), meta: opt("meta.json") as LocalMeta | null, store };
  if (existsSync(path.join(local, "story.json")))
    return { event, code, dir: `${EVENTS}/${event}/local/${code}`, from: "local", kind: "short", file: json(path.join(local, "story.json")), screen: null, meta: opt("meta.json") as LocalMeta | null, store };
  if (existsSync(at("shorts", code, "story.json"))) {
    const file = json(at("shorts", code, "story.json"));
    // 옛 꼴 (장면 넷 — ShortStory)만 받는다. 같은 폴더에 있는 새 꼴 시험판 (한 흐름 — FlowStory · 보류 D104)은 이 화면이 그리지 않는다
    if (file && typeof file === "object" && "scenes" in file) return { event, code, dir: `${EVENTS}/${event}/shorts/${code}`, from: "shorts", kind: "short", file, screen: null, meta: null, store };
  }
  return null;
}

/** 미리 보기가 설 이야기 전부 — 사건 폴더마다 local/* (+ local 에 없는 shorts/*) */
export function listLocal(root: string): { event: string; code: string }[] {
  const out: { event: string; code: string }[] = [];
  const dirs = (d: string) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name) : []);
  for (const event of dirs(path.join(root, EVENTS))) {
    const codes = new Set([...dirs(path.join(root, EVENTS, event, "local")), ...dirs(path.join(root, EVENTS, event, "shorts"))]);
    for (const code of [...codes].sort()) if (readLocal(root, event, code)) out.push({ event, code });
  }
  return out;
}
