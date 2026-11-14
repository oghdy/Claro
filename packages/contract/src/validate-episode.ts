// 회차 검증기 — docs/contract/EPISODE.md §9 불변식을 코드로 (B-E1).
//
// 보는 것 (번호 = §9)
//   1  모양 — 계약의 칸 전부 · 그것만 · 타입 식대로 (EPISODE_SHAPES). 빈 글자열 없음. 견주기의 칸 머리 둘 · 자리의 쪽 둘
//   2  episode_version ≥ 1 · number ≥ 1
//   3  구절의 doc 이 docs 에 있다                      4  글의 src · 표결 기록이 quotes 에 있다
//   5  도구를 가리키는 것이 전부 tools 에 있다 · 도구마다 지도의 자리 · 줍는 장면 하나
//   6  조립 — 장면 여덟의 차례대로 · cover 로 시작 · keep 으로 끝 · aha 포함
//   7  시리즈 줄에 now 가 정확히 하나 · 그 번호가 표지의 번호와 같다
//   8  구절은 저장된 문서의 글 그대로 (빈칸 · 줄바꿈만 무시) — **documents 를 줄 때만** (안 주면 경고 QUOTES_NOT_CHECKED)
//   9  글의 숫자는 근거 셋 중 하나 — 구절 · 계산(calc) · 화면 번호(ui)
//   10 맨 글자열(독자가 읽는 string)에는 숫자가 없다
//   11 깨는 사실에 구절 (사망이 아니면)                 12 체험이 없으면 기본 풀이 + 까닭 · 체험이 있으면 까닭 없음
//   13 D61 ④ 사망이면 체험 없음 · 조용히 · 까닭 death   14 D61 ⑥ 뒤집기가 없으면 틀도 "뒤집기만"도 없다
//   15 틀의 조합이 서는 것이다                          16 D61 ③ 자리에 앉기는 한 기관 안의 공식 이견에만 · 쪽마다 한 말에 구절 · 수가 표결 기록에
//   17 UX4-a 까닭이 아직 없는 쪽(not-yet)은 "아직 문서에 없다"는 글이 그쪽의 말 안에 있다
//   18 고리 둘 ~ 넷 · 닿은 차례대로 · 멈춘 자리 · 오늘의 값(after · still)에 구절
//   19 틀을 이으면 탭 · 넘어가는 말                     20 D46 ④ 서로 다르게 말하는 것은 둘 이상(또는 빔) · 저마다 구절
//   21 넘겨 보기 — 칸 셋 이상 · id 가 겹치지 않는다 · 칸마다 한 줄(body)에 구절
//   22 칸의 때 — when 이 있거나, 없으면 no_date("날짜 없음")가 있다. 둘 중 정확히 하나
//   23 ★ 칸이 정확히 하나 · 첫 칸이 아니다           24 앞날 칸 금지 (state: next 거부) · 지금(now)은 마지막 칸에만
//   25 지난 값 (before) · 지난 회차에서 온 구절 (`code:key`)이 있으면 지난 회차 칸 (previous)이 있다 · 고리의 지난 값에 구절   (실물 전 — UX-6)
//   26 지난 회차에서 온 구절의 키 꼴 — 앞머리 하나 · 이 회차의 code 가 아니다                                                    (실물 전 — UX-6)
//   지난 회차를 받으면 (ctx.previous) 대 본다 — 같은 회차 · 같은 시리즈 · 같은 그림 (kind · picture.id · 고리 · 쪽 id) · 지난 값 · 옮겨 온 구절이 그 회차의 것 그대로 (PREV_MISMATCH)
//
// 짧은 이야기 (ShortStory · §13 · B-E3) — validateShortStory. 위의 1 · 2 (판) · 3 · 4 · 8 · 9 · 10 · 11 · 13 · 14 를 같이 보고, 더해서
//   27 무게 — 짧은 이야기의 체험이 없는 까닭은 무게 (short) · 긴 이야기의 까닭은 무게가 아니다 (PLAIN_WHY)
//   28 짧은 이야기에는 번호 · 시리즈 줄 · 체험 · 장면 넷 밖의 장면 칸이 없다 — 모양 (1) 이 거부한다 (SCHEMA_KEY)
//   29 다른 이야기를 가리키기 — 도구 하나 이상 · 겹침 없음 (REF_TOOL) · 가리킨 이야기의 판 ≥ 1 · 자신이 아니다 (ID_RANGE)
//      가리킨 이야기를 받으면 (ctx.episodes) 대 본다 — 곁 이야기가 같은 사건 (SIBLING_MISMATCH) · 도구가 그 이야기에 있다 (REF_TOOL)
//   validateStory — weight 가 "short" 면 짧은 이야기로, 아니면 (칸이 없으면) 긴 이야기로 본다
//
// 보지 않는 것
//   글의 뜻이 구절에서 나오는가 (의미 대조 — 사람 · W-2) · 한글로 쓴 수 ("여섯 가지") · 그림 부품이 있는가 (코드 — 화면 쪽 검사)
//   split · death · not_yet_note 가 **참인가** — 스스로 적는 칸이다. 검사는 빠뜨리지 못하게 할 뿐이다 (사람이 채운다 — §8)
//   ConceptRef 가 가리킨 개념 · 버전이 있는가 · event_ref 의 사건이 있는가 — 백엔드 발행 검사 (저장소가 있어야 한다)
//   `_` 필드 — 픽스처 주석이다. 무시하고, 돌려주는 회차에서는 뺀다
import { isUUID } from "./describe";
import {
  CARRIED_KEY,
  EPISODE_ALIASES,
  EPISODE_SHAPES,
  EPISODE_UNIONS,
  FRAME_COMBOS,
  SCENE_IDS,
  carriedKey,
  type ChainBefore,
  type Episode,
  type EpisodeDoc,
  type EpisodeRef,
  type EpisodeText,
  type EpisodeQuote,
  type SeatBefore,
  type ShortStory,
  type Solve,
  type Tool,
  type StoryWeight,
} from "./episode";
import { stripAnnotations, type Issue } from "./validate";

export interface EpisodeStats {
  quotes: number;
  docs: number;
  texts: number;
  texts_with_digits: number;
  /** 숫자가 구절이 아니라 계산 · 화면 번호로 밝혀진 글 */
  exempt: string[];
  tools: number;
  tools_from_library: number;
}

export type EpisodeValidation =
  | { ok: true; episode: Episode; warnings: Issue[]; stats: EpisodeStats }
  | { ok: false; errors: Issue[]; warnings: Issue[] };

/** 짧은 이야기 — 도구는 제 것이 없고 다른 이야기를 가리킨다 (tools_from) */
export interface ShortStoryStats {
  quotes: number;
  docs: number;
  texts: number;
  texts_with_digits: number;
  exempt: string[];
  tools_from: number;
}

export type ShortStoryValidation =
  | { ok: true; story: ShortStory; warnings: Issue[]; stats: ShortStoryStats }
  | { ok: false; errors: Issue[]; warnings: Issue[] };

export type StoryValidation = EpisodeValidation | ShortStoryValidation;

export interface EpisodeContext {
  /** 저장된 문서 (DATA_MODEL SourceDocument 의 source_id · text). 주면 불변식 8 을 본다 */
  documents?: readonly { source_id: string; text: string }[];
  /** 지난 회차 (Episode.previous 가 가리키는 것 — 계약 검증을 지난 회차). 주면 같은 그림 · 지난 값 · 옮겨 온 구절을 대 본다 (§7.9 · PREV_MISMATCH) */
  previous?: Episode;
  /** 짧은 이야기만 — 가리킨 긴 이야기들 (sibling · tools_from — 계약 검증을 지난 회차). 주면 같은 사건 · 도구가 그 이야기에 있는지 대 본다 (§13 · 불변식 29) */
  episodes?: readonly Episode[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

// ─────────────────────────────────────────────────────────── 숫자 읽기 (불변식 9 · 16)

const squash = (s: string) => s.replace(/\s+/g, "");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 영어 구절의 달 이름 · 분수를 수로 — "October 28" = 10 · "3-3/4" = 3.75 · "1/4" = 0.25. 구절 쪽에만 쓴다 */
const english = (s: string) =>
  MONTHS.reduce((out, m, i) => out.replace(new RegExp(`\\b${m}\\b`, "g"), ` ${i + 1} `), s)
    .replace(/(\d+)-(\d)\/(\d)/g, (_, whole: string, a: string, b: string) => String(Number(whole) + Number(a) / Number(b)))
    .replace(/(?<![\d.])(\d)\/(\d)(?![\d.])/g, (_, a: string, b: string) => String(Number(a) / Number(b)));
/** 숫자 토막 — 쉼표를 떼고, 숫자가 아닌 것으로 끊는다. 앞의 0 은 뗀다 ("09" = "9") */
const runs = (s: string) => (s.replace(/(\d),(?=\d)/g, "$1").match(/\d+/g) ?? []).map((n) => String(Number(n)));

const hasSrc = (t: EpisodeText) => (t.src?.length ?? 0) > 0;

// ─────────────────────────────────────────────────────────── 풀이 칸의 규칙 (불변식 11 ~ 20)

/**
 * 풀이 칸만 본다 — 회차가 아닌 풀이 견본(시안의 조용히 견본)에도 쓴다. ep 가 없으면 구절 · 도구를 가리키는 것은 보지 않는다.
 * weight — 무게 (불변식 27): 긴 이야기 (기본) 는 체험이 없는 까닭이 무게일 수 없고, 짧은 이야기 (ShortStory 의 풀이) 는 까닭이 무게다
 */
export function solveProblems(solve: Solve, ep: { quotes: Record<string, EpisodeQuote>; tools: readonly Tool[] } | null, base = "/solve", weight: StoryWeight = "long"): { errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const E = (code: string, path: string, message: string) => errors.push({ code, path: `${base}${path}`, message });
  const { entry, lab, plain } = solve;
  const pool = (keys: readonly string[]) => keys.flatMap((k) => runs(english(ep?.quotes[k]?.quote ?? "")));

  // 11
  if (!entry.death && !hasSrc(entry.breaker)) E("BREAKER_SRC", "/entry/breaker", "깨는 사실에 근거 구절이 없다");
  // 12 · 27 (무게 — B-E3)
  if (!lab && !plain) E("SOLVE_EMPTY", "", "체험도 기본 풀이도 없다");
  if (weight === "short") {
    if (plain && !entry.death && plain.why !== "short") E("PLAIN_WHY", "/plain/why", `짧은 이야기인데 체험이 없는 까닭이 무게(short)가 아니다 — ${plain.why} (불변식 27)`);
  } else {
    if (!lab && plain && plain.why === null) E("PLAIN_WHY", "/plain/why", "체험이 없는 회차인데 까닭이 없다 — 정치 · 사망 · 자료 · 뒤집기 없음 가운데 하나여야 한다");
    if (!lab && plain?.why === "short") E("PLAIN_WHY", "/plain/why", "긴 이야기인데 체험이 없는 까닭을 무게(short)라고 적었다 — 무게는 짧은 이야기의 까닭이다 (불변식 27)");
  }
  if (lab && plain && plain.why !== null) E("PLAIN_WHY", "/plain/why", `체험이 있는데 체험이 없는 까닭(${plain.why})을 적었다`);
  // 13 — D61 ④
  if (entry.death) {
    if (lab) E("DEATH_LAB", "/lab", "사람이 숨진 사건인데 체험이 있다 (D61 ④)");
    if (plain && plain.kind !== "quiet") E("DEATH_NOT_QUIET", "/plain/kind", `사람이 숨진 사건인데 기본 풀이가 "조용히"가 아니다 — ${plain.kind} (D61 ④)`);
    if (plain && !lab && plain.why !== null && plain.why !== "death") E("DEATH_WHY", "/plain/why", `사람이 숨진 사건인데 까닭이 ${plain.why} 다`);
  } else if (plain?.why === "death") E("DEATH_WHY", "/plain/why", "까닭이 사망인데 entry.death 가 아니다");
  // 14 — D61 ⑥
  if (!entry.flip && lab) E("NO_FLIP", "/lab", "뒤집기가 없는데 틀을 골랐다 — 뒤집기가 없으면 기본 풀이다 (D61 ⑥)");
  if (!entry.flip && plain?.kind === "flip") E("NO_FLIP", "/plain/kind", "뒤집기가 없는데 꼴이 뒤집기만(flip)이다");
  // 20 — D46 ④
  if (plain?.kind === "three") {
    if (plain.differ.length === 1) E("DIFFER_ONE_SIDE", "/plain/differ", "서로 다르게 말하는 것이 한쪽뿐이다 — 둘 이상을 나란히 놓거나 비운다 (D46 ④)");
    plain.differ.forEach((d, i) => hasSrc(d.says) || E("DIFFER_SRC", `/plain/differ/${i}/says`, "그쪽이 한 말에 근거 구절이 없다"));
  }
  if (!lab) return { errors, warnings };

  // 15
  const kinds = lab.frames.map((f) => f.kind);
  if (!FRAME_COMBOS.some((c) => c.join() === kinds.join())) E("FRAME_COMBO", "/lab/frames", `서는 조합이 아니다 — [${kinds.join(", ")}] (켜고 끄기 하나 · 고리 · 자리 · 고리 → 자리 · 넘겨 보기 하나)`);
  if (lab.born && ep && !ep.tools.some((t) => t.key === lab.born!.tool)) E("REF_TOOL", "/lab/born/tool", `도구 "${lab.born.tool}" 가 이 회차에 없다`);

  lab.frames.forEach((f, i) => {
    const at = `/lab/frames/${i}`;
    if (ep && !ep.tools.some((t) => t.key === f.picture.tool)) E("REF_TOOL", `${at}/picture/tool`, `그림이 붙은 도구 "${f.picture.tool}" 가 이 회차에 없다`);
    // 19
    if (lab.frames.length > 1 && (f.kind === "chain" || f.kind === "seats")) {
      if (!f.tab) E("FRAME_TAB", `${at}/tab`, "틀을 이었는데 탭 이름이 없다");
      if (f.kind === "chain" && i < lab.frames.length - 1 && !f.go_on) E("FRAME_TAB", `${at}/go_on`, "뒤에 틀이 있는데 넘어가는 말이 없다");
    }
    // 18
    if (f.kind === "chain") {
      if (f.nodes.length < 2 || f.nodes.length > 4) E("CHAIN_NODES", `${at}/nodes`, `고리가 ${f.nodes.length}개다 — 둘 ~ 넷`);
      const rank = { full: 0, part: 1, none: 2 } as const;
      if (f.nodes.some((n, k) => k > 0 && rank[n.reach] < rank[f.nodes[k - 1]!.reach])) E("CHAIN_ORDER", `${at}/nodes`, `고리가 닿은 차례대로가 아니다 — ${f.nodes.map((n) => n.reach).join(" → ")}`);
      if (!f.nodes.some((n) => n.reach === "none")) E("CHAIN_NO_STOP", `${at}/nodes`, `멈춘 자리가 없다 — 힘이 닿지 않은 고리가 하나는 있어야 "어디서 멈추나"다`);
      f.nodes.forEach((n, k) => {
        const value = n.reach === "none" ? n.still : n.after;
        if (!hasSrc(value)) E("CHAIN_VALUE_SRC", `${at}/nodes/${k}/${n.reach === "none" ? "still" : "after"}`, `고리 "${n.id}" 의 오늘의 값에 근거 구절이 없다`);
      });
    }
    // 21 ~ 24 — 넘겨 보기 (UX-5 · §7.8)
    if (f.kind === "pages") {
      if (f.cards.length < 3) E("PAGES_CARDS", `${at}/cards`, `칸이 ${f.cards.length}개다 — 셋 이상이어야 "아!" 칸의 앞과 뒤가 선다`);
      if (new Set(f.cards.map((c) => c.id)).size !== f.cards.length) E("PAGES_CARDS", `${at}/cards`, "칸의 id 가 겹친다");
      f.cards.forEach((c, k) => {
        const cp = `${at}/cards/${k}`;
        // 21
        if (!hasSrc(c.body)) E("PAGES_CARD_SRC", `${cp}/body`, `칸 "${c.id}" 의 한 줄에 근거 구절이 없다 — 문서에 없는 칸은 그리지 않는다`);
        // 22
        if (c.when === null && c.no_date === null) E("PAGES_WHEN", `${cp}/no_date`, `칸 "${c.id}" 에 때가 없는데, "날짜 없음"이라고 독자에게 말하는 글(no_date)도 없다`);
        if (c.when !== null && c.no_date !== null) E("PAGES_WHEN", `${cp}/no_date`, `칸 "${c.id}" 에 때(when)가 있는데 "날짜 없음"(no_date)도 적었다 — 둘 중 하나다`);
        // 24
        if (c.state === "next") E("PAGES_FUTURE", `${cp}/state`, `칸 "${c.id}" 는 앞날이다 — 넘겨 보기는 다음 칸(아직 일어나지 않은 일)을 그리지 않는다 (UX-3)`);
        if (c.state === "now" && f.cards.slice(k + 1).some((x) => x.state !== "next")) E("PAGES_ORDER", `${cp}/state`, `지금(now)인 칸 "${c.id}" 뒤에 칸이 더 있다 — 지금은 마지막 칸에만 온다`);
      });
      // 23
      const stars = f.cards.filter((c) => c.star).length;
      if (stars !== 1) E("PAGES_STAR", `${at}/cards`, `★ 칸이 ${stars}개다 — 정확히 하나`);
      else if (f.cards[0]!.star) E("PAGES_STAR", `${at}/cards/0/star`, "★ 칸이 첫 칸이다 — 그 앞에 넘길 칸이 하나는 있어야 한다");
    }
    // 16 — D61 ③ · 17 — UX4-a
    if (f.kind === "seats") {
      if (f.ground.split !== "official-dissent")
        E("SEATS_PARTY_VOTE", `${at}/ground/split`, `한 기관 안의 공식 이견이 아니다 (split: ${f.ground.split}) — 정당 표결에는 자리에 앉기를 쓰지 않는다. 양쪽 공식 입장을 글로 나란히 (D61 ③)`);
      if (!f.ground.record.length) E("SEATS_RECORD", `${at}/ground/record`, "표결이 적힌 공식 기록(구절)이 없다");
      if (f.sides.length !== 2) E("SEATS_SIDES", `${at}/sides`, `쪽이 ${f.sides.length}개다 — 둘이어야 한다 (셋 이상은 실물 없음)`);
      const record = pool(f.ground.record);
      f.sides.forEach((side, k) => {
        const sp = `${at}/sides/${k}`;
        if (!hasSrc(side.said)) E("SEATS_SAID_SRC", `${sp}/said`, `"${side.id}" 쪽이 공식으로 한 말에 근거 구절이 없다`);
        if (ep && f.ground.record.length && !record.includes(String(side.count))) E("SEATS_COUNT", `${sp}/count`, `"${side.id}" 쪽의 수 ${side.count} 이 표결 기록 구절에 없다`);
        if (side.why === "not-yet") {
          if (!side.not_yet_note) E("SEATS_NOT_YET", `${sp}/not_yet_note`, `"${side.id}" 쪽의 까닭이 아직 문서에 없는데(not-yet), 그렇다고 독자에게 말하는 글을 가리키지 않았다 (UX4-a)`);
          else if (!side.said.t.includes(side.not_yet_note)) E("SEATS_NOT_YET", `${sp}/not_yet_note`, `"${side.id}" 쪽: not_yet_note 가 그쪽이 한 말(said) 안에 글자 그대로 없다 — 화면에 보이지 않는다 (UX4-a)`);
          else warnings.push({ code: "SEAT_WHY_NOT_YET", path: `${base}${sp}`, message: `"${side.id}" 쪽의 까닭은 아직 문서에 없다 (not-yet) — 그 문서가 나올 때까지 이 쪽은 반쪽이다` });
        } else if (side.not_yet_note !== null) E("SEATS_NOT_YET", `${sp}/not_yet_note`, `"${side.id}" 쪽의 까닭이 문서에 있다면서(in-doc) "아직 없다"는 글을 가리켰다`);
      });
    }
  });
  return { errors, warnings };
}

// ─────────────────────────────────────────────────────────── 모양 (불변식 1 · 10) — 긴 이야기 · 짧은 이야기가 같이 쓴다

type Texts = { path: string; item: EpisodeText }[];

/** 1 · 10 — 타입 식을 읽어 값을 본다. 지나간 글 한 덩이 (EpisodeText)를 모아 돌려준다 */
function shapeProblems(root: string, doc: unknown): { errors: Issue[]; texts: Texts } {
  const errors: Issue[] = [];
  const E = (code: string, path: string, message: string) => errors.push({ code, path, message });
  const texts: Texts = [];

  function fits(type: string, v: unknown, path: string): void {
    if (type.endsWith(" | null")) {
      if (v !== null) fits(type.slice(0, -" | null".length), v, path);
      return;
    }
    if (v === null || v === undefined) return void E("SCHEMA_TYPE", path, `${type} 자리에 값이 없다`);
    if (type.endsWith("[]")) {
      if (!Array.isArray(v)) return void E("SCHEMA_TYPE", path, `${type} 이 아니다 — 목록이어야 한다`);
      return v.forEach((x, i) => fits(type.slice(0, -2), x, `${path}/${i}`));
    }
    const rec = /^Record<\w+, (.+)>$/.exec(type);
    if (rec) {
      if (!isObj(v)) return void E("SCHEMA_TYPE", path, `${type} 이 아니다`);
      for (const [k, x] of Object.entries(v)) fits(rec[1]!, x, `${path}/${k}`);
      return;
    }
    if (/^"[^"]*"( \| "[^"]*")*$/.test(type)) {
      if (typeof v !== "string" || !type.split(" | ").includes(`"${v}"`)) E("SCHEMA_TYPE", path, `${JSON.stringify(v)} 는 ${type} 이 아니다`);
      return;
    }
    switch (type) {
      case "string":
        if (typeof v !== "string" || !v.trim()) return void E("STRING_EMPTY", path, "비었거나 글자열이 아니다");
        // 10
        if (/\d/.test(v)) E("BARE_DIGIT", path, `맨 글자열에 숫자가 있다 — ${JSON.stringify(v)}. 숫자가 든 글은 EpisodeText 여야 한다 (근거를 달 수 있게)`);
        return;
      case "integer":
        if (!Number.isInteger(v)) E("SCHEMA_TYPE", path, "정수가 아니다");
        return;
      case "boolean":
        if (typeof v !== "boolean") E("SCHEMA_TYPE", path, "불리언이 아니다");
        return;
      case "true":
        if (v !== true) E("SCHEMA_TYPE", path, "true 만 허용 (아니면 칸을 뺀다)");
        return;
      case "UUID":
      case "EventRef":
        if (!isUUID(v)) E("SCHEMA_TYPE", path, `${type} 이 아니다 — ${JSON.stringify(v)}`);
        return;
      case "ConceptRef": {
        const ok = isObj(v) && Object.keys(v).length === 3 && isUUID(v.concept_id) && Number.isInteger(v.version) && (v.version as number) >= 1 && (v.part === null || (typeof v.part === "string" && !!v.part));
        if (!ok) E("SCHEMA_TYPE", path, "ConceptRef { concept_id, version, part } 가 아니다 (CONCEPT_IDENTITY §3.2)");
        return;
      }
      case "[number, number]":
        if (!Array.isArray(v) || v.length !== 2 || v.some((n) => typeof n !== "number" || !Number.isFinite(n))) E("SCHEMA_TYPE", path, "[가로, 세로] 가 아니다");
        return;
      case "[ToolKey, ToolKey]":
        if (!Array.isArray(v) || v.length !== 2 || v.some((n) => typeof n !== "string" || !n)) E("SCHEMA_TYPE", path, "[도구, 도구] 가 아니다");
        return;
    }
    const union = EPISODE_UNIONS[type];
    if (union) {
      const tag = isObj(v) ? v[union.tag] : undefined;
      const shape = typeof tag === "string" ? union.of[tag] : undefined;
      if (!shape) return void E("SCHEMA_TYPE", path, `${type} 의 갈래를 모른다 — ${union.tag}=${JSON.stringify(tag)} (${Object.keys(union.of).join(" · ")} 가운데 하나)`);
      return fits(shape, v, path);
    }
    const alias = (EPISODE_ALIASES as Record<string, string>)[type];
    if (alias === "string") {
      // 가리키는 이름 · 원문 · 조각 · 적어 둔 말 — 독자 글의 숫자 규칙(10) 밖이다
      if (typeof v !== "string" || !v.trim()) E("STRING_EMPTY", path, `${type} 이 비었거나 글자열이 아니다`);
      return;
    }
    if (alias) return fits(alias, v, path);
    const shape = (EPISODE_SHAPES as Record<string, Record<string, string>>)[type];
    if (!shape) throw new Error(`계약 표에 없는 타입 식: ${type}`);
    if (!isObj(v)) return void E("SCHEMA_TYPE", path, `객체가 아니다 (${type})`);
    const names = Object.keys(shape).map((k) => k.replace(/\?$/, ""));
    for (const k of Object.keys(v)) if (!names.includes(k)) E("SCHEMA_KEY", `${path}/${k}`, `계약에 없는 칸 (${type})`);
    for (const [k, t] of Object.entries(shape)) {
      const name = k.replace(/\?$/, "");
      if (!(name in v)) {
        if (!k.endsWith("?")) E("SCHEMA_MISSING", path, `칸 "${name}" 이 없다 (${type})`);
      } else fits(t, v[name], `${path}/${name}`);
    }
    if (type === "EpisodeText") texts.push({ path, item: v as unknown as EpisodeText });
  }
  fits(root, doc, "");
  return { errors, texts };
}

// ─────────────────────────────────────────────────────────── 근거 (불변식 3 · 8 · 4 · 9) — 긴 이야기 · 짧은 이야기가 같이 쓴다

function groundProblems(
  ep: { docs: Record<string, EpisodeDoc>; quotes: Record<string, EpisodeQuote> },
  texts: Texts,
  documents: EpisodeContext["documents"],
  E: (code: string, path: string, message: string) => void,
  warnings: Issue[],
): { exempt: string[]; withDigits: number } {
  // 3 · 8
  const textOf = documents ? new Map(documents.map((d) => [d.source_id, squash(d.text)])) : null;
  if (!textOf) warnings.push({ code: "QUOTES_NOT_CHECKED", path: "/quotes", message: "저장된 문서를 주지 않아 구절이 문서에 그대로 있는지(불변식 8)는 보지 않았다" });
  for (const [key, q] of Object.entries(ep.quotes)) {
    const ref = ep.docs[q.doc];
    if (!ref) {
      E("REF_DOC", `/quotes/${key}/doc`, `문서 "${q.doc}" 가 이 회차의 docs 에 없다`);
      continue;
    }
    if (!textOf) continue;
    const text = textOf.get(ref.source_id);
    if (text === undefined) E("DOC_MISSING", `/docs/${q.doc}`, `문서 ${ref.source_id} 가 저장된 문서에 없다`);
    else if (!text.includes(squash(q.quote))) E("QUOTE_VERBATIM", `/quotes/${key}`, `구절이 ${q.doc} 의 글에 없다 — "${q.quote.slice(0, 40)}…"`);
  }

  // 4 · 9
  const exempt: string[] = [];
  let withDigits = 0;
  for (const { path, item } of texts) {
    for (const k of item.src ?? []) if (!ep.quotes[k]) E("REF_QUOTE", `${path}/src`, `src "${k}" 가 이 회차의 구절이 아니다`);
    const want = runs(item.t.replace(/\*\*/g, ""));
    if (want.length === 0) continue;
    withDigits++;
    if (item.ui) {
      exempt.push(`${path}: "${item.t}" (ui)`);
      continue;
    }
    const pool = (item.src ?? []).flatMap((k) => runs(english(ep.quotes[k]?.quote ?? "")));
    const calc = Object.keys(item.calc ?? {});
    for (const n of want) {
      // 연도: 글의 2026 ↔ 구절의 ’26
      const ok = pool.includes(n) || (n.length === 4 && n.startsWith("20") && pool.includes(String(Number(n.slice(2))))) || calc.includes(n);
      if (!ok) E("NUMBER_UNGROUNDED", path, `숫자 ${n} 이 근거 구절에 없다 — "${item.t.slice(0, 50)}…" (src: ${(item.src ?? []).join(", ") || "없음"})`);
    }
    if (calc.length) exempt.push(`${path}: "${item.t.replace(/\n/g, " ").slice(0, 60)}${item.t.length > 60 ? "…" : ""}" (계산 — ${Object.entries(item.calc!).map(([n, how]) => `${n} = ${how}`).join(" · ")})`);
  }
  return { exempt, withDigits };
}

// ─────────────────────────────────────────────────────────── 회차 (긴 이야기)

export function validateEpisode(input: unknown, ctx: EpisodeContext = {}): EpisodeValidation {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const E = (code: string, path: string, message: string) => errors.push({ code, path, message });
  const doc = stripAnnotations(input);

  // 1 — 모양. 타입 식을 읽어 값을 본다
  const shape = shapeProblems("Episode", doc);
  if (shape.errors.length) return { ok: false, errors: shape.errors, warnings };
  const { texts } = shape;
  const ep = doc as Episode;

  if (ep.scenes.compare.cols.length !== 2) E("SCHEMA_LENGTH", "/scenes/compare/cols", "견주기의 칸 머리는 둘이다");
  // 2
  if (ep.episode_version < 1) E("ID_RANGE", "/episode_version", "판은 1부터다");
  if (ep.number < 1) E("ID_RANGE", "/number", "회차 번호는 1부터다 — 0화는 회차가 아니라 따라잡기 장면이다 (§3)");

  // 3 · 8 · 4 · 9
  const { exempt, withDigits } = groundProblems(ep, texts, ctx.documents, E, warnings);

  // 5
  const keys = ep.tools.map((t) => t.key);
  const need = (path: string, ids: readonly string[]) => ids.forEach((id) => keys.includes(id) || E("REF_TOOL", path, `도구 "${id}" 가 이 회차에 없다`));
  if (new Set(keys).size !== keys.length) E("REF_TOOL", "/tools", "도구의 key 가 겹친다");
  need("/pickup/tools", ep.pickup.tools);
  need("/pickup/aha", ep.pickup.aha);
  need("/pickup/next", ep.pickup.next);
  need("/map/at", Object.keys(ep.map.at));
  need("/map/edges", ep.map.edges.flat());
  need("/map/ghosts", ep.map.ghosts.map((g) => g.from));
  const picked = [...ep.pickup.tools, ...ep.pickup.aha, ...ep.pickup.next];
  for (const k of keys) {
    if (!ep.map.at[k]) E("REF_TOOL", "/map/at", `도구 "${k}" 의 자리가 지도에 없다`);
    const n = picked.filter((p) => p === k).length;
    if (n !== 1) E("REF_TOOL", "/pickup", `도구 "${k}" 를 줍는 장면이 ${n}곳이다 — 정확히 한 곳이어야 한다`);
  }
  const born = ep.solve.lab?.born;
  if (born && keys.includes(born.tool) && !ep.pickup.aha.includes(born.tool)) E("REF_TOOL", "/pickup/aha", `풀이에서 생기는 도구 "${born.tool}" 가 풀이에서 줍는 도구(pickup.aha)에 없다`);

  // 6
  for (const [who, list] of Object.entries(ep.assembly) as [string, string[]][]) {
    const idx = list.map((s) => SCENE_IDS.indexOf(s as (typeof SCENE_IDS)[number]));
    const ordered = idx.every((n, i) => i === 0 || n > idx[i - 1]!);
    if (!ordered || list[0] !== "cover" || list.at(-1) !== "keep" || !list.includes("aha"))
      E("ASSEMBLY_ORDER", `/assembly/${who}`, `조립이 장면 여덟의 차례가 아니다 — [${list.join(", ")}] (cover 로 시작 · keep 으로 끝 · aha 포함 · 겹침 없이 차례대로)`);
  }

  // 7
  const now = ep.track.filter((x) => x.state === "now");
  if (now.length !== 1) E("TRACK_NOW", "/track", `시리즈 줄에 지금(now)이 ${now.length}개다 — 정확히 하나`);
  else if (now[0]!.no.t !== ep.scenes.cover.episode.t) E("TRACK_NOW", "/track", `시리즈 줄의 지금 번호 "${now[0]!.no.t}" 가 표지의 번호 "${ep.scenes.cover.episode.t}" 와 다르다`);

  // 25 · 26 — 지난 회차 (실물 전 · 3화에서 확인 — UX-6 · §3.4 · §4.5 · §7.9)
  previousProblems(ep, ctx.previous, E, warnings);

  // 11 ~ 20
  const solve = solveProblems(ep.solve, ep);
  errors.push(...solve.errors);
  warnings.push(...solve.warnings);

  if (errors.length) return { ok: false, errors, warnings };
  const stats: EpisodeStats = {
    quotes: Object.keys(ep.quotes).length,
    docs: new Set(Object.values(ep.quotes).map((q) => q.doc)).size,
    texts: texts.length,
    texts_with_digits: withDigits,
    exempt,
    tools: ep.tools.length,
    tools_from_library: ep.tools.filter((t) => t.basis.length > 0).length,
  };
  return { ok: true, episode: ep, warnings, stats };
}

// ─────────────────────────────────────────────────────────── 지난 회차 (불변식 25 · 26 · PREV_MISMATCH)

type Before = { path: string; frame: number; id: string } & ({ kind: "chain"; before: ChainBefore } | { kind: "seats"; before: SeatBefore });

function previousProblems(ep: Episode, prev: Episode | undefined, E: (code: string, path: string, message: string) => void, warnings: Issue[]) {
  const befores: Before[] = [];
  (ep.solve.lab?.frames ?? []).forEach((f, i) => {
    if (f.kind === "chain") f.nodes.forEach((n, k) => n.before && befores.push({ path: `/solve/lab/frames/${i}/nodes/${k}/before`, kind: "chain", frame: i, id: n.id, before: n.before }));
    if (f.kind === "seats") f.sides.forEach((s, k) => s.before && befores.push({ path: `/solve/lab/frames/${i}/sides/${k}/before`, kind: "seats", frame: i, id: s.id, before: s.before }));
  });
  const carried = Object.keys(ep.quotes).filter((k) => k.includes(":"));
  // 25
  if (!ep.previous) {
    for (const b of befores) E("PREV_MISSING", b.path, `지난 값이 있는데 지난 회차 칸 (previous)이 없다 — 무엇의 지난 값인지 모른다`);
    for (const k of carried) E("PREV_MISSING", `/quotes/${k}`, `지난 회차에서 온 구절 (${k})인데 지난 회차 칸 (previous)이 없다`);
  } else {
    if (ep.previous.episode_version < 1) E("ID_RANGE", "/previous/episode_version", "지난 회차의 판은 1부터다");
    if (ep.previous.episode_id === ep.episode_id) E("ID_RANGE", "/previous/episode_id", "지난 회차가 이 회차 자신이다");
  }
  for (const b of befores) if (b.kind === "chain" && !hasSrc(b.before.value)) E("PREV_VALUE_SRC", `${b.path}/value`, `고리 "${b.id}" 의 지난 값에 근거 구절이 없다 — 오늘의 값과 같은 규칙 (불변식 18)`);
  // 26
  for (const k of carried) {
    const m = CARRIED_KEY.exec(k);
    if (!m) E("PREV_KEY", `/quotes/${k}`, `구절 키 "${k}" — 지난 회차에서 온 구절의 키는 \`<처음 실린 회차의 code>:<그 회차의 키>\` 하나다 (앞머리를 거듭 붙이지 않는다)`);
    else if (m[1] === ep.code) E("PREV_KEY", `/quotes/${k}`, `구절 키 "${k}" 의 앞머리가 이 회차의 code 다 — 이 회차의 구절은 앞머리 없이 쓴다`);
  }
  if (!ep.previous) return;
  if (!prev) {
    warnings.push({ code: "PREVIOUS_NOT_CHECKED", path: "/previous", message: "지난 회차를 주지 않아 같은 그림인지 · 지난 값이 그 회차의 값인지 · 옮겨 온 구절이 그 회차의 것인지는 보지 않았다" });
    return;
  }
  // 지난 회차를 받았다 — 대 본다
  const M = (path: string, message: string) => E("PREV_MISMATCH", path, message);
  if (prev.episode_id !== ep.previous.episode_id || prev.episode_version !== ep.previous.episode_version) return M("/previous", `받은 지난 회차 (${prev.code} · ${prev.episode_id} v${prev.episode_version})가 previous 칸이 가리키는 회차가 아니다`);
  if (prev.series.series_id !== ep.series.series_id) M("/previous", `지난 회차 ${prev.code} 는 다른 시리즈다 (${prev.series.code})`);
  if (prev.number >= ep.number) M("/previous", `지난 회차 ${prev.code} 는 ${prev.number}화 — 이 회차 (${ep.number}화)의 앞 화가 아니다`);
  const ck = (k: string) => carriedKey(prev.code, k);
  const sameSrc = (a: EpisodeText, b: EpisodeText) => JSON.stringify(a.src ?? []) === JSON.stringify((b.src ?? []).map(ck));
  for (const b of befores) {
    const frame = ep.solve.lab!.frames[b.frame]!;
    const pf = (prev.solve.lab?.frames ?? []).find((x) => x.kind === frame.kind && x.picture.id === frame.picture.id);
    if (!pf) {
      M(b.path, `같은 그림이 아니다 — 지난 회차 ${prev.code} 에 그림 "${frame.picture.id}" 인 ${frame.kind} 틀이 없다`);
      continue;
    }
    if (pf.kind === "chain" && b.kind === "chain") {
      const pn = pf.nodes.find((n) => n.id === b.id);
      const bv = b.before;
      if (!pn) M(b.path, `지난 회차의 그림 "${pf.picture.id}" 에 고리 "${b.id}" 가 없다`);
      else {
        const pv = pn.reach === "none" ? pn.still : pn.after;
        if (bv.reach !== pn.reach || bv.value.t !== pv.t || !sameSrc(bv.value, pv)) M(b.path, `고리 "${b.id}" 의 지난 값이 지난 회차의 값과 다르다 — 지난 회차: ${pn.reach} · “${pv.t}” (${(pv.src ?? []).map(ck).join(", ")}) / 적은 것: ${bv.reach} · “${bv.value.t}” (${(bv.value.src ?? []).join(", ")})`);
      }
    }
    if (pf.kind === "seats" && b.kind === "seats") {
      const ps = pf.sides.find((s) => s.id === b.id);
      const bv = b.before;
      if (!ps) M(b.path, `지난 회차의 그림 "${pf.picture.id}" 에 쪽 "${b.id}" 가 없다`);
      else if (bv.why !== ps.why || bv.group.t !== ps.group.t || !sameSrc(bv.group, ps.group)) M(b.path, `쪽 "${b.id}" 의 지난 값이 지난 회차의 값과 다르다 — 지난 회차: “${ps.group.t}” · 까닭 ${ps.why} / 적은 것: “${bv.group.t}” · 까닭 ${bv.why}`);
    }
  }
  for (const k of carried) {
    const m = CARRIED_KEY.exec(k);
    if (!m) continue;
    const pk = m[1] === prev.code ? m[2]! : k;
    const pq = prev.quotes[pk];
    const q = ep.quotes[k]!;
    if (!pq) M(`/quotes/${k}`, `지난 회차 ${prev.code} 에 구절 "${pk}" 가 없다`);
    else if (pq.quote !== q.quote || prev.docs[pq.doc]?.source_id !== ep.docs[q.doc]?.source_id) M(`/quotes/${k}`, `옮겨 온 구절이 지난 회차 ${prev.code} 의 구절 "${pk}" 와 다르다 (글 · 문서)`);
  }
}

/** 검증을 통과한 회차를 돌려주고, 아니면 모든 위반을 담아 던진다 */
export function parseEpisode(input: unknown, ctx?: EpisodeContext): Episode {
  const r = validateEpisode(input, ctx);
  if (!r.ok) {
    const lines = r.errors.map((e) => `  ${e.code} ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Episode 계약 위반 ${r.errors.length}건\n${lines}`);
  }
  return r.episode;
}

// ─────────────────────────────────────────────────────────── 짧은 이야기 (§13 · 불변식 27 ~ 29 · B-E3)

export function validateShortStory(input: unknown, ctx: EpisodeContext = {}): ShortStoryValidation {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const E = (code: string, path: string, message: string) => errors.push({ code, path, message });
  const doc = stripAnnotations(input);

  // 1 · 10 · 28 — 장면 넷 · 번호 · 시리즈 줄 · 체험 칸이 없다 (넣으면 SCHEMA_KEY)
  const shape = shapeProblems("ShortStory", doc);
  if (shape.errors.length) return { ok: false, errors: shape.errors, warnings };
  const s = doc as ShortStory;

  // 2 — 판 (번호는 없다)
  if (s.episode_version < 1) E("ID_RANGE", "/episode_version", "판은 1부터다");
  // 3 · 8 · 4 · 9
  const { exempt, withDigits } = groundProblems(s, shape.texts, ctx.documents, E, warnings);
  // 29 — 다른 이야기를 가리키기
  shortRefProblems(s, ctx.episodes, E, warnings);
  // 11 · 13 · 14 · 27 — 풀이 = 입구 + 뒤집기만 (체험 칸이 없다)
  const solve = solveProblems({ entry: s.solve.entry, lab: null, plain: s.solve.plain }, { quotes: s.quotes, tools: [] }, "/solve", "short");
  errors.push(...solve.errors);
  warnings.push(...solve.warnings);

  if (errors.length) return { ok: false, errors, warnings };
  const stats: ShortStoryStats = {
    quotes: Object.keys(s.quotes).length,
    docs: new Set(Object.values(s.quotes).map((q) => q.doc)).size,
    texts: shape.texts.length,
    texts_with_digits: withDigits,
    exempt,
    tools_from: s.tools_from.keys.length,
  };
  return { ok: true, story: s, warnings, stats };
}

function shortRefProblems(s: ShortStory, episodes: readonly Episode[] | undefined, E: (code: string, path: string, message: string) => void, warnings: Issue[]) {
  const keys = s.tools_from.keys;
  if (!keys.length) E("REF_TOOL", "/tools_from/keys", "가리킨 도구가 없다 — 하나 이상 (그 장면의 글이 도구를 말한다)");
  if (new Set(keys).size !== keys.length) E("REF_TOOL", "/tools_from/keys", "가리킨 도구가 겹친다");
  const refs: [string, EpisodeRef][] = [
    ["/sibling/episode", s.sibling.episode],
    ["/tools_from/episode", s.tools_from.episode],
  ];
  for (const [at, ref] of refs) {
    if (ref.episode_version < 1) E("ID_RANGE", `${at}/episode_version`, "가리킨 이야기의 판은 1부터다");
    if (ref.episode_id === s.episode_id) E("ID_RANGE", `${at}/episode_id`, "가리킨 이야기가 이 이야기 자신이다");
  }
  const find = (ref: EpisodeRef) => episodes?.find((e) => e.episode_id === ref.episode_id && e.episode_version === ref.episode_version);
  const sibling = find(s.sibling.episode);
  if (!sibling) warnings.push({ code: "SIBLING_NOT_CHECKED", path: "/sibling", message: "곁 이야기를 받지 못해 같은 사건인지는 보지 않았다" });
  else if (sibling.event_ref !== s.event_ref) E("SIBLING_MISMATCH", "/sibling/episode", `곁 이야기 ${sibling.code} 는 다른 사건 (${sibling.event_ref})이다 — 곁 이야기는 같은 사건의 이야기다`);
  const from = find(s.tools_from.episode);
  if (!from) warnings.push({ code: "TOOLS_FROM_NOT_CHECKED", path: "/tools_from", message: "도구를 가져온 이야기를 받지 못해 그 도구가 거기 있는지는 보지 않았다" });
  else keys.forEach((k, i) => from.tools.some((t) => t.key === k) || E("REF_TOOL", `/tools_from/keys/${i}`, `도구 "${k}" 가 ${from.code} 에 없다 — 다른 이야기의 도구는 가리키기만 한다 (새로 쓰지 않는다)`));
}

/** 검증을 통과한 짧은 이야기를 돌려주고, 아니면 모든 위반을 담아 던진다 */
export function parseShortStory(input: unknown, ctx?: EpisodeContext): ShortStory {
  const r = validateShortStory(input, ctx);
  if (!r.ok) {
    const lines = r.errors.map((e) => `  ${e.code} ${e.path}: ${e.message}`).join("\n");
    throw new Error(`ShortStory 계약 위반 ${r.errors.length}건\n${lines}`);
  }
  return r.story;
}

/** 이야기 하나 — weight 가 "short" 면 짧은 이야기, 아니면 (칸이 없거나 "long") 긴 이야기 (회차)로 본다 (§13.1) */
export function validateStory(input: unknown, ctx: EpisodeContext = {}): StoryValidation {
  return isObj(input) && input.weight === "short" ? validateShortStory(input, ctx) : validateEpisode(input, ctx);
}
