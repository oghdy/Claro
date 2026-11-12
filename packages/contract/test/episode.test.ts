// 회차 계약 (docs/contract/EPISODE.md) — 골든 셋은 통과하고, fixtures/invalid/episode-*.json 은 전부 거부된다 (B-E1 · 셋째 골든과 넘겨 보기 틀은 UX-5 · 지난 회차 칸 셋은 UX-6 — 실물 전).
// invalid 픽스처는 아래 표(VIOLATIONS)가 원본이다: 골든 + 위반 하나. 파일이 표와 어긋나면 실패한다.
// 표를 고쳤으면 `WRITE_EPISODE_INVALID=1 pnpm --filter @claro/contract test` 로 파일을 다시 쓴다.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseEpisode, solveProblems, validateEpisode } from "../src";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const read = (p: string): any => JSON.parse(readFileSync(root(p), "utf-8"));

const PRICE = "episode-price-1.json";
const RATE = "episode-rate-2.json";
// 셋째 골든 — 개인정보위 과징금 「내 정보는 누가 지키나」 1화. 넘겨 보기 틀의 첫 실물 (UX-5)
const PRIVACY = "episode-privacy-1.json";
// 저장된 문서 — 골든 셋의 근거가 여기 있다 (전부 git 에 있다: 공공누리 제1유형 · 법령 · 미국 연방 저작물 · 문서 안 공공누리 표시 — D70)
const documents = [
  "fixtures/store.documents.json",
  "packages/pipeline/data/events/FOMC-20261028/store.documents.json",
  "packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json",
  "packages/pipeline/data/events/PIPC-20261028-SAFETY-MEASURES/store.documents.json",
].flatMap((p) => read(p).source_documents as { source_id: string; text: string }[]);

const golden = (name: string) => read(`fixtures/${name}`);
const codes = (doc: unknown) => {
  const r = validateEpisode(doc, { documents });
  return r.ok ? [] : [...new Set(r.errors.map((e) => e.code))].sort();
};

describe("골든", () => {
  it("배달앱 1화 — 통과 · 경고 없음", () => {
    const r = validateEpisode(golden(PRICE), { documents });
    if (!r.ok) throw new Error(r.errors.map((e) => `${e.code} ${e.path} ${e.message}`).join("\n"));
    expect(r.warnings).toEqual([]);
    expect(r.stats).toMatchObject({ quotes: 39, docs: 6, texts: 94, texts_with_digits: 39, tools: 4, tools_from_library: 0 });
    expect(r.stats.exempt).toHaveLength(7);
    expect(r.episode.solve.lab?.frames.map((f) => f.kind)).toEqual(["toggle"]);
  });

  it("금리 2화 — 통과 · 알림 하나 (반대쪽의 까닭은 아직 문서에 없다 — UX4-a)", () => {
    const r = validateEpisode(golden(RATE), { documents });
    if (!r.ok) throw new Error(r.errors.map((e) => `${e.code} ${e.path} ${e.message}`).join("\n"));
    expect(r.warnings.map((w) => [w.code, w.path])).toEqual([["SEAT_WHY_NOT_YET", "/solve/lab/frames/1/sides/1"]]);
    expect(r.stats).toMatchObject({ quotes: 41, docs: 8, texts: 129, texts_with_digits: 68, tools: 5, tools_from_library: 4 });
    expect(r.stats.exempt).toHaveLength(18);
    expect(r.episode.solve.lab?.frames.map((f) => f.kind)).toEqual(["chain", "seats"]);
  });

  it("개인정보 1화 — 통과 · 경고 없음 · 넘겨 보기 하나 (칸 여섯 · ★ 하나 · 날짜 없음 둘 · 마지막 칸이 지금)", () => {
    const r = validateEpisode(golden(PRIVACY), { documents });
    if (!r.ok) throw new Error(r.errors.map((e) => `${e.code} ${e.path} ${e.message}`).join("\n"));
    expect(r.warnings).toEqual([]);
    expect(r.stats).toMatchObject({ quotes: 44, docs: 8, texts: 105, texts_with_digits: 29, tools: 5, tools_from_library: 0 });
    expect(r.stats.exempt).toHaveLength(6); // 전부 화면 번호 (0화 · 1화) — 계산한 수는 없다
    const frames = r.episode.solve.lab!.frames;
    expect(frames.map((f) => f.kind)).toEqual(["pages"]);
    const f = frames[0]!;
    if (f.kind !== "pages") throw new Error("넘겨 보기가 아니다");
    expect(f.cards).toHaveLength(6);
    expect(f.cards.map((c) => c.star)).toEqual([false, false, false, true, false, false]);
    expect(f.cards.map((c) => (c.when ? "때" : c.no_date))).toEqual(["날짜 없음", "때", "때", "날짜 없음", "때", "때"]);
    expect(f.cards.map((c) => c.state)).toEqual(["past", "past", "past", "past", "past", "now"]);
    // 이 그림을 본 독자용 머리말의 첫 실물 (D62 ③) · 기본 풀이는 뒤집기만
    expect(r.episode.solve.lab!.seen_title).not.toBeNull();
    expect(r.episode.solve.plain).toMatchObject({ kind: "flip", why: null });
    // 조립 — 다른 시리즈를 따라온 독자는 따라잡기도 견주기도 본다 (조립 규칙은 미확인 — D66)
    expect(r.episode.assembly.follower).toEqual(["cover", "zero", "event", "tools", "aha", "compare", "next", "keep"]);
  });

  it("`_` 필드를 무시하고, 돌려주는 회차에는 남기지 않는다", () => {
    for (const name of [PRICE, RATE, PRIVACY]) {
      expect(JSON.stringify(golden(name))).toMatch(/"_source"/);
      expect(JSON.stringify(parseEpisode(golden(name), { documents }))).not.toMatch(/"_/);
    }
  });

  it("문서를 주지 않으면 구절 대조(불변식 8)를 건너뛰고 그렇다고 알린다", () => {
    const r = validateEpisode(golden(PRICE));
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.code)).toEqual(["QUOTES_NOT_CHECKED"]);
  });

  it("두 골든이 같은 모양으로 다른 것을 싣는다 — 장면 여덟 · 조립 둘 · 틀 셋", () => {
    const [a, b] = [parseEpisode(golden(PRICE)), parseEpisode(golden(RATE))];
    for (const e of [a, b]) {
      expect(Object.keys(e.scenes)).toEqual(["cover", "zero", "event", "tools", "aha", "compare", "next", "keep"]);
      expect(e.assembly.new).toEqual(["cover", "zero", "event", "tools", "aha", "next", "keep"]);
      expect(e.assembly.follower).toEqual(["cover", "event", "tools", "aha", "compare", "next", "keep"]);
    }
    expect([a.number, b.number]).toEqual([1, 2]);
    expect([a.solve.plain?.kind, b.solve.plain?.kind]).toEqual(["flip", "three"]);
    expect([a.solve.entry.flip?.op, b.solve.entry.flip?.op]).toEqual(["=", "≠"]);
  });
});

// ─────────────────────────────────────────────────────────── 위반 — 골든 + 하나

interface Violation {
  file: string;
  of: string;
  code: string;
  /** 같이 날 수밖에 없는 코드 (글에서 구절을 떼면 그 글의 숫자도 근거를 잃는다) */
  also?: string[];
  rule: string;
  what: string;
  mutate: (e: any) => void;
}
const seats = (e: any) => e.solve.lab.frames[1];
const chain = (e: any) => e.solve.lab.frames[0];
const pages = (e: any) => e.solve.lab.frames[0];
// 지난 회차 칸 (UX-6 · 실물 전) — 위반 픽스처에 쓰는 지난 회차. 실제 회차가 아니다 (픽스처는 지난 회차를 받지 않는다 — 대 보기는 "픽스처 없이"에서)
const SOME_PREVIOUS = { episode_id: "00000000-0000-4000-8000-000000000002", episode_version: 1 };

const VIOLATIONS: Violation[] = [
  {
    file: "episode-toggle-picture-as-data.json", of: PRICE, code: "SCHEMA_KEY",
    rule: "§9-1 · §7.3 — 켜고 끄기의 그림은 데이터가 아니다. 틀은 개념의 그림 부품을 이름(picture.id)으로 가리킬 뿐이다 (UX-4 ③-1 · D62)",
    what: "켜고 끄기 틀에 그림 데이터(stage — 자리 · 막대 · 알갱이의 수)를 넣었다 (UX-4 시안의 모양)",
    mutate: (e) => (e.solve.lab.frames[0].stage = { kind: "pair", sides: [{ name: "큰 앱", bar: "수수료 높음" }, { name: "새 앱", bar: "수수료 낮음" }], tag: "메뉴값", tie: "=", tokens: "손님" }),
  },
  {
    file: "episode-knowledge-state-in-episode.json", of: RATE, code: "SCHEMA_KEY",
    rule: "§9-1 · §5 — 회차는 지식 상태를 싣지 않는다. 조립은 어느 장면을 보이나만 적는다 (CLAUDE.md 절대 하지 말 것)",
    what: "회차에 독자의 아는 개념(readers.follower.known)을 넣었다 (시안 전용 고정값의 모양)",
    mutate: (e) => (e.readers = { follower: { known: ["rate", "target", "dots"] } }),
  },
  {
    file: "episode-concept-ref-not-pinned.json", of: RATE, code: "SCHEMA_TYPE",
    rule: "§9-1 · §4 — 도구의 바탕은 ConceptRef { concept_id, version, part } 다 (CONCEPT_IDENTITY §3.2). 이름으로 가리키지 않는다",
    what: "도구 '기준금리'의 바탕을 라이브러리의 이름 글자(canonical_name)로 적었다 (UX-2 시안의 모양)",
    mutate: (e) => (e.tools[0].basis = ["FOMC_ROLE", "RATE_TO_SPENDING"]),
  },
  {
    file: "episode-number-zero.json", of: PRICE, code: "ID_RANGE",
    rule: "§9-2 · §3 — 회차 번호는 1부터다. 0화는 회차가 아니라 따라잡기 장면(scenes.zero)과 시리즈 줄의 한 줄이다",
    what: "회차 번호를 0 으로",
    mutate: (e) => (e.number = 0),
  },
  {
    file: "episode-quote-doc-missing.json", of: PRICE, code: "REF_DOC",
    rule: "§9-3 — 구절의 doc 은 이 회차의 docs 에 있다",
    what: "구절 pr.entrant 가 docs 에 없는 문서(CO-CPNG-1109 — git 에 없는 기업 입장문)를 가리킨다",
    mutate: (e) => (e.quotes["pr.entrant"].doc = "CO-CPNG-1109"),
  },
  {
    file: "episode-src-not-a-quote.json", of: RATE, code: "REF_QUOTE",
    rule: "§9-4 — 글의 src 는 이 회차의 구절이다",
    what: "기본 풀이의 글 하나가 이 회차에 없는 구절을 가리킨다",
    mutate: (e) => (e.solve.plain.unknown[2].src = ["없는.구절"]),
  },
  {
    file: "episode-pickup-unknown-tool.json", of: RATE, code: "REF_TOOL",
    rule: "§9-5 — 줍는 도구는 tools 에 있고, 도구마다 줍는 장면이 정확히 하나다",
    what: "이어짐에서 줍는 도구를 tools 에 없는 것(minutes)으로 — 점도표는 줍는 장면이 없어졌다",
    mutate: (e) => (e.pickup.next = ["minutes"]),
  },
  {
    file: "episode-assembly-out-of-order.json", of: PRICE, code: "ASSEMBLY_ORDER",
    rule: "§9-6 — 조립은 장면을 고르고 뺄 뿐, 장면 여덟의 차례를 바꾸지 못한다 (D59)",
    what: "따라온 독자의 조립에서 풀이를 도구 줍기 앞에 놓았다",
    mutate: (e) => (e.assembly.follower = ["cover", "event", "aha", "tools", "compare", "next", "keep"]),
  },
  {
    file: "episode-track-two-now.json", of: RATE, code: "TRACK_NOW",
    rule: "§9-7 — 시리즈 줄에 지금(now)은 정확히 하나다",
    what: "지난 화(1화)도 now 로",
    mutate: (e) => (e.track[1].state = "now"),
  },
  {
    file: "episode-quote-not-verbatim.json", of: RATE, code: "QUOTE_VERBATIM",
    rule: "§9-8 — 구절은 저장된 문서의 글 그대로다 (빈칸 · 줄바꿈만 무시)",
    what: "성명문 구절 “Inflation remains elevated.” 를 “Inflation remains high.” 로 바꿔 적었다",
    mutate: (e) => (e.quotes["st10.infl"].quote = "Inflation remains high."),
  },
  {
    file: "episode-number-ungrounded.json", of: RATE, code: "NUMBER_UNGROUNDED",
    rule: "§9-9 — 글의 숫자는 근거 구절 · 계산 · 화면 번호 중 하나에 있다",
    what: "기본 풀이의 글에 지어낸 수(7명)를 넣었다",
    mutate: (e) => (e.solve.plain.known[1].t = "표결은 10 대 2였어요. 반대한 둘 말고도 7명이 망설였어요."),
  },
  {
    file: "episode-bare-digit.json", of: PRICE, code: "BARE_DIGIT",
    rule: "§9-10 — 맨 글자열에는 숫자가 없다. 숫자가 든 글은 근거를 달 수 있는 EpisodeText 여야 한다",
    what: "사건 장의 큰 글자 꼬리표(맨 글자열)에 수를 넣었다",
    mutate: (e) => (e.scenes.event.figures[0].tag = "잠정 · 역대 2위"),
  },
  {
    file: "episode-breaker-no-src.json", of: PRICE, code: "BREAKER_SRC",
    rule: "§9-11 — 깨는 사실은 문서에 있는 사실이다. 구절이 있어야 한다",
    what: "깨는 사실에서 근거 구절을 뗐다",
    mutate: (e) => delete e.solve.entry.breaker.src,
  },
  {
    file: "episode-no-lab-no-why.json", of: RATE, code: "PLAIN_WHY",
    rule: "§9-12 — 체험이 없으면 까닭이 넷 중 하나로 적혀 있다 (D61 ①)",
    what: "체험을 뺐는데 기본 풀이에 까닭이 없다",
    mutate: (e) => (e.solve.lab = null),
  },
  {
    file: "episode-death-with-lab.json", of: RATE, code: "DEATH_LAB",
    rule: "§9-13 · D61 ④ — 사람이 숨진 사건 · 부고는 체험이 없다",
    what: "사람이 숨진 사건이라고 적고(death) 체험을 그대로 뒀다",
    mutate: (e) => ((e.solve.entry.death = true), (e.solve.plain = null)),
  },
  {
    file: "episode-death-not-quiet.json", of: RATE, code: "DEATH_NOT_QUIET",
    rule: "§9-13 · D61 ④ — 사람이 숨진 사건의 기본 풀이는 \"조용히\"다",
    what: "사람이 숨진 사건이라고 적고 체험을 뺐지만, 기본 풀이가 세 칸이다",
    mutate: (e) => ((e.solve.entry.death = true), (e.solve.lab = null), (e.solve.plain.why = "death")),
  },
  {
    file: "episode-no-flip-with-lab.json", of: RATE, code: "NO_FLIP",
    rule: "§9-14 · D61 ⑥ — 뒤집기가 없으면 틀을 고를 수 없다. 기본 풀이로 간다",
    what: "뒤집기를 지웠는데 체험(틀 둘)이 그대로 있다",
    mutate: (e) => (e.solve.entry.flip = null),
  },
  {
    file: "episode-frame-combo.json", of: RATE, code: "FRAME_COMBO",
    rule: "§9-15 — 틀의 조합은 서는 것만: 켜고 끄기 하나 · 고리 · 자리 · 고리 → 자리",
    what: "자리에 앉기를 어디서 멈추나 앞에 놓았다",
    mutate: (e) => e.solve.lab.frames.reverse(),
  },
  {
    file: "episode-seats-party-vote.json", of: RATE, code: "SEATS_PARTY_VOTE",
    rule: "§9-16 · D61 ③ — 자리에 앉기는 한 기관 안의 공식 이견에만. 정당 표결이면 거부 — 양쪽 공식 입장을 글로 나란히",
    what: "자리에 앉기의 표결을 정당 표결(party-vote)로",
    mutate: (e) => (seats(e).ground.split = "party-vote"),
  },
  {
    file: "episode-seats-count-not-in-record.json", of: RATE, code: "SEATS_COUNT",
    rule: "§9-16 — 쪽마다의 사람 수는 표결이 적힌 공식 기록(구절)에 있다",
    what: "그대로 두자 쪽의 수를 10 → 9 로",
    mutate: (e) => (seats(e).sides[0].count = 9),
  },
  {
    file: "episode-seats-said-no-src.json", of: RATE, code: "SEATS_SAID_SRC", also: ["NUMBER_UNGROUNDED"],
    rule: "§9-16 · D46 — 쪽마다 그쪽이 공식으로 한 말에 구절이 있다",
    what: "올리자 쪽이 한 말에서 근거 구절을 뗐다 (그 글의 숫자도 근거를 잃는다)",
    mutate: (e) => delete seats(e).sides[1].said.src,
  },
  {
    file: "episode-seats-not-yet-unsaid.json", of: RATE, code: "SEATS_NOT_YET",
    rule: "§9-17 · UX4-a (D62 ②) — 까닭이 아직 문서에 없는 쪽(not-yet)은 그렇다고 말하는 글을 가리켜야 한다",
    what: "올리자 쪽은 not-yet 인데 not_yet_note 가 없다",
    mutate: (e) => (seats(e).sides[1].not_yet_note = null),
  },
  {
    file: "episode-seats-not-yet-not-on-screen.json", of: RATE, code: "SEATS_NOT_YET",
    rule: "§9-17 · UX4-a (D62 ②) — \"그 까닭은 아직 문서에 없다\"는 글이 화면에 (그쪽이 한 말 안에) 반드시 있다",
    what: "올리자 쪽이 한 말에서 \"…까닭을 직접 설명한 글은 … 아직 없어요\" 문장을 뺐다 — 독자는 반쪽인 줄 모른다",
    mutate: (e) => (seats(e).sides[1].said.t = "2명이 앉은 쪽이에요. 쿡, 해맥 두 위원이 “이번에 0.25%포인트 올리자”고 했어요."),
  },
  {
    file: "episode-chain-no-stop.json", of: RATE, code: "CHAIN_NO_STOP",
    rule: "§9-18 — 힘이 닿지 않은 고리가 하나는 있어야 \"어디서 멈추나\"다. 문서가 말하지 않은 끝을 그리지 않는다",
    what: "마지막 고리(물가)까지 힘이 닿았다고 그렸다",
    mutate: (e) => (chain(e).nodes[2] = { id: "infl", name: "물가가 오르는 속도", reach: "part", idle: "아직 그대로", after: { t: "느려지기 시작", src: ["st10.infl"] } }),
  },
  {
    file: "episode-chain-out-of-order.json", of: RATE, code: "CHAIN_ORDER",
    rule: "§9-18 — 고리는 닿은 차례대로다 (다 닿음 → 일부 → 안 닿음)",
    what: "첫 두 고리의 차례를 바꿨다",
    mutate: (e) => chain(e).nodes.splice(0, 2, chain(e).nodes[1], chain(e).nodes[0]),
  },
  {
    file: "episode-chain-value-no-src.json", of: RATE, code: "CHAIN_VALUE_SRC",
    rule: "§9-18 · UX4-e — 고리의 오늘의 값(after · still)에는 구절이 있다",
    what: "가운데 고리의 값 \"일부에서 조여짐\"에서 구절을 뗐다 (UX-4 시안의 맨 글자열과 같은 처지)",
    mutate: (e) => delete chain(e).nodes[1].after.src,
  },
  {
    file: "episode-frames-no-tab.json", of: RATE, code: "FRAME_TAB",
    rule: "§9-19 — 틀을 이으면 틀마다 탭 이름이 있다",
    what: "이은 둘째 틀(자리에 앉기)의 탭 이름을 뺐다",
    mutate: (e) => (seats(e).tab = null),
  },
  {
    file: "episode-differ-one-side.json", of: RATE, code: "DIFFER_ONE_SIDE",
    rule: "§9-20 · D46 ④ — 서로 다르게 말하는 것은 양쪽을 나란히 (둘 이상이거나 빔)",
    what: "세 칸의 셋째 칸에 한쪽(10명)의 말만 남겼다",
    mutate: (e) => e.solve.plain.differ.pop(),
  },
  {
    file: "episode-differ-no-src.json", of: RATE, code: "DIFFER_SRC",
    rule: "§9-20 · D46 ① — 그쪽이 공식으로 한 말에는 구절이 있다",
    what: "10명 쪽이 한 말에서 근거 구절을 뗐다",
    mutate: (e) => delete e.solve.plain.differ[0].says.src,
  },
  // ── 넘겨 보기 (UX-5 · §7.8 · 불변식 21 ~ 24 · 15) — 셋째 골든 + 위반 하나
  {
    file: "episode-pages-too-few.json", of: PRIVACY, code: "PAGES_CARDS",
    rule: "§9-21 — 넘겨 보기의 칸은 셋 이상이다. ★ 칸의 앞과 뒤가 있어야 차례가 선다",
    what: "칸을 둘만 남겼다 (알림 · ★ 대응 소홀)",
    mutate: (e) => (pages(e).cards = pages(e).cards.slice(2, 4)),
  },
  {
    file: "episode-pages-card-no-src.json", of: PRIVACY, code: "PAGES_CARD_SRC",
    rule: "§9-21 — 칸마다 한 줄에 구절이 있다. 문서에 없는 칸은 그리지 않는다",
    what: "★ 칸 (대응을 소홀히 했어요)에서 근거 구절을 뗐다",
    mutate: (e) => delete pages(e).cards[3].body.src,
  },
  {
    file: "episode-pages-undated-unsaid.json", of: PRIVACY, code: "PAGES_WHEN",
    rule: "§9-22 — 때가 문서에 없는 칸은 \"날짜 없음\"을 화면에 밝힌다 (no_date)",
    what: "첫 칸 (열려 있던 길)은 때가 없는데 no_date 도 비웠다 — 독자는 그 칸에 날짜가 없는 줄 모른다",
    mutate: (e) => (pages(e).cards[0].no_date = null),
  },
  {
    file: "episode-pages-when-and-no-date.json", of: PRIVACY, code: "PAGES_WHEN",
    rule: "§9-22 — 때 (when)와 \"날짜 없음\" (no_date)은 둘 중 정확히 하나다",
    what: "때가 있는 칸 (첫 번째 유출 · 2024년 8월)에 \"날짜 없음\"도 적었다",
    mutate: (e) => (pages(e).cards[1].no_date = "날짜 없음"),
  },
  {
    file: "episode-pages-no-star.json", of: PRIVACY, code: "PAGES_STAR",
    rule: "§9-23 — ★ 칸 (\"아!\")이 정확히 하나다",
    what: "★ 칸의 표시를 뗐다 — 차례만 있고 \"아!\"가 없다",
    mutate: (e) => (pages(e).cards[3].star = false),
  },
  {
    file: "episode-pages-two-stars.json", of: PRIVACY, code: "PAGES_STAR",
    rule: "§9-23 — ★ 칸 (\"아!\")이 정확히 하나다",
    what: "둘째 유출 칸에도 ★ 을 달았다",
    mutate: (e) => (pages(e).cards[4].star = true),
  },
  {
    file: "episode-pages-future-card.json", of: PRIVACY, code: "PAGES_FUTURE",
    rule: "§9-24 · UX-3 — 넘겨 보기는 다음 칸 (앞날)을 그리지 않는다",
    what: "마지막에 \"의결서가 나오면\" 칸 (state: next)을 더했다 — 구절이 있어도 아직 일어나지 않은 일이다",
    mutate: (e) => pages(e).cards.push({ id: "record", when: null, no_date: "날짜 없음", head: "의결서가 나오면", body: { t: "이유와 계산을 적은 의결서가 나와요.", src: ["notice.record"] }, state: "next", star: false }),
  },
  {
    file: "episode-pages-now-not-last.json", of: PRIVACY, code: "PAGES_ORDER",
    rule: "§9-24 — 지금 (now)은 마지막 칸에만 온다",
    what: "둘째 칸 (첫 번째 유출)을 지금이라고 적었다 — 그 뒤에 칸이 넷 더 있다",
    mutate: (e) => (pages(e).cards[1].state = "now"),
  },
  // ── 지난 회차 칸 셋 (UX-6 · §3.4 · §4.5 · §7.9 · 불변식 25 · 26 — 실물 전) — 금리 2화 + 위반 하나
  {
    file: "episode-before-no-previous.json", of: RATE, code: "PREV_MISSING",
    rule: "§9-25 · §7.9 — 같은 그림의 지난 값이 있으면 지난 회차 칸(previous)이 있다. 무엇의 지난 값인지 모르면 화면이 '지난 화'라고 말할 수 없다",
    what: "가운데 고리(돈 빌리는 형편)에 지난 값을 달았는데 지난 회차 칸이 없다",
    mutate: (e) => (chain(e).nodes[1].before = { reach: "none", value: { t: "아직 그대로", src: ["pc10.cond"] } }),
  },
  {
    file: "episode-before-value-no-src.json", of: RATE, code: "PREV_VALUE_SRC",
    rule: "§9-25 · §7.9 — 고리의 지난 값에도 구절이 있다 (오늘의 값과 같은 규칙 — 불변식 18)",
    what: "지난 회차 칸을 두고 가운데 고리의 지난 값을 구절 없이 적었다",
    mutate: (e) => ((e.previous = SOME_PREVIOUS), (chain(e).nodes[1].before = { reach: "none", value: { t: "아직 그대로" } })),
  },
  {
    file: "episode-quote-key-double-prefix.json", of: RATE, code: "PREV_KEY",
    rule: "§9-26 · §4.5 — 지난 회차에서 온 구절의 키는 <처음 실린 회차의 code>:<키> 하나다. 앞머리를 거듭 붙이지 않는다",
    what: "시리즈 줄의 지난 화 제목이 기대는 구절(omo.2023)을 앞머리 둘(rate-3:fomc:omo.2023)로 옮겨 실었다 — 3화 → 4화로 이어 쓰며 앞머리를 또 붙인 꼴",
    mutate: (e) => {
      e.previous = SOME_PREVIOUS;
      e.quotes["rate-3:fomc:omo.2023"] = e.quotes["omo.2023"];
      e.track[1].title.src = ["rate-3:fomc:omo.2023", "omo.2026"];
    },
  },
  {
    file: "episode-pages-combo.json", of: PRIVACY, code: "FRAME_COMBO",
    rule: "§9-15 — 넘겨 보기는 혼자 선다. 다른 틀과 잇는 것은 실물이 없다",
    what: "넘겨 보기 틀을 둘 이었다",
    mutate: (e) => e.solve.lab.frames.push(JSON.parse(JSON.stringify(pages(e)))),
  },
];

const invalidPath = (file: string) => root(`fixtures/invalid/${file}`);
const build = (v: Violation) => {
  const { _source, ...body } = golden(v.of);
  v.mutate(body);
  return {
    _violation: { code: v.code, ...(v.also ? { also: v.also } : {}), of: v.of, rule: v.rule, what: v.what, made_from: `fixtures/${v.of} + 위반 1개 (${v.code.startsWith("PREV_") ? "UX-6" : v.of === PRIVACY ? "UX-5" : "B-E1"} · packages/contract/test/episode.test.ts 의 표)` },
    ...body,
  };
};

describe("위반은 거부한다 — fixtures/invalid/episode-*.json", () => {
  if (process.env.WRITE_EPISODE_INVALID) for (const v of VIOLATIONS) writeFileSync(invalidPath(v.file), JSON.stringify(build(v), null, 2) + "\n");

  it("표의 파일이 전부 있고, 폴더에 표 밖의 episode-* 파일이 없다", () => {
    const onDisk = readdirSync(root("fixtures/invalid")).filter((f) => f.startsWith("episode-")).sort();
    expect(onDisk).toEqual(VIOLATIONS.map((v) => v.file).sort());
  });

  it.each(VIOLATIONS.map((v) => [v.file, v] as const))("%s", (_file, v) => {
    expect(existsSync(invalidPath(v.file))).toBe(true);
    const doc = JSON.parse(readFileSync(invalidPath(v.file), "utf-8"));
    // 파일 = 골든 + 표의 위반 하나
    expect(doc).toEqual(build(v));
    const { _violation, ...body } = doc;
    expect(_violation.code).toBe(v.code);
    expect(codes(body)).toEqual([v.code, ...(v.also ?? [])].sort());
  });

  it("불변식의 코드마다 픽스처가 하나 이상 있다", () => {
    const covered = new Set(VIOLATIONS.map((v) => v.code));
    for (const code of [
      "SCHEMA_KEY", "SCHEMA_TYPE", "ID_RANGE", "REF_DOC", "REF_QUOTE", "REF_TOOL", "ASSEMBLY_ORDER", "TRACK_NOW", "QUOTE_VERBATIM", "NUMBER_UNGROUNDED", "BARE_DIGIT",
      "BREAKER_SRC", "PLAIN_WHY", "DEATH_LAB", "DEATH_NOT_QUIET", "NO_FLIP", "FRAME_COMBO", "SEATS_PARTY_VOTE", "SEATS_COUNT", "SEATS_SAID_SRC", "SEATS_NOT_YET",
      "CHAIN_NO_STOP", "CHAIN_ORDER", "CHAIN_VALUE_SRC", "FRAME_TAB", "DIFFER_ONE_SIDE", "DIFFER_SRC",
      "PAGES_CARDS", "PAGES_CARD_SRC", "PAGES_WHEN", "PAGES_STAR", "PAGES_FUTURE", "PAGES_ORDER",
      "PREV_MISSING", "PREV_VALUE_SRC", "PREV_KEY",
    ])
      expect(covered.has(code), code).toBe(true);
  });
});

describe("픽스처 없이 보는 것", () => {
  it("빠진 칸 · 빈 글 · 모르는 갈래", () => {
    const a = golden(RATE);
    delete a.solve.entry.death;
    expect(codes(a)).toEqual(["SCHEMA_MISSING"]);
    const b = golden(RATE);
    b.scenes.keep.title = " ";
    expect(codes(b)).toEqual(["STRING_EMPTY"]);
    const c = golden(RATE);
    c.solve.lab.frames[0].kind = "scale"; // 저울 — 뺀 틀 (D61 ⑤)
    expect(codes(c)).toEqual(["SCHEMA_TYPE"]);
    const d = golden(RATE);
    d.solve.plain.why = "demo"; // 시안 전용 값 — 계약에 없다
    expect(codes(d)).toEqual(["SCHEMA_TYPE"]);
  });

  it("체험이 있는데 체험이 없는 까닭을 적음 → PLAIN_WHY · 까닭이 사망인데 death 가 아님 → DEATH_WHY", () => {
    const a = golden(PRICE);
    a.solve.plain.why = "no-source";
    expect(codes(a)).toEqual(["PLAIN_WHY"]);
    const b = golden(RATE);
    b.solve.lab = null;
    b.solve.plain.why = "death";
    expect(codes(b)).toEqual(["DEATH_WHY"]);
  });

  it("저장된 문서에 없는 문서 → DOC_MISSING", () => {
    const a = golden(PRICE);
    a.docs["PR-1109"].source_id = "00000000-0000-4000-8000-000000000000";
    expect(codes(a)).toEqual(["DOC_MISSING"]);
  });

  it("까닭이 문서에 있다면서(in-doc) '아직 없다'는 글을 가리킴 → SEATS_NOT_YET", () => {
    const a = golden(RATE);
    seats(a).sides[1].why = "in-doc";
    expect(codes(a)).toEqual(["SEATS_NOT_YET"]);
  });

  it("넘겨 보기 — ★ 칸이 첫 칸 → PAGES_STAR · 칸의 id 가 겹침 → PAGES_CARDS · 넘겨 보기에 탭 칸 → SCHEMA_KEY (잇는 실물이 없다)", () => {
    const a = golden(PRIVACY);
    pages(a).cards[3].star = false;
    pages(a).cards[0].star = true;
    expect(codes(a)).toEqual(["PAGES_STAR"]);
    const b = golden(PRIVACY);
    pages(b).cards[2].id = "first";
    expect(codes(b)).toEqual(["PAGES_CARDS"]);
    const c = golden(PRIVACY);
    pages(c).tab = { t: "대교" };
    expect(codes(c)).toEqual(["SCHEMA_KEY"]);
  });

  // ── 지난 회차 칸 셋 (UX-6 · 실물 전) — 금리 2화 (손 · 골든)를 지난 회차로 받는 "3화 꼴" 회차를 만들어 본다. 3화의 실물이 아니다 (글은 2화 그대로)
  const RATE_ID = golden(RATE).episode_id;
  /** 2화를 이어 받은 3화 꼴: 같은 그림 · 고리 셋 · 쪽 둘에 지난 값 (2화의 값 그대로 · 구절은 fomc: 꼴로 옮김) · 시리즈 줄의 지난 화 구절도 fomc: 꼴 */
  const third = () => {
    const prev = golden(RATE);
    const e = golden(RATE);
    delete e._source;
    Object.assign(e, { episode_id: "00000000-0000-4000-8000-000000000003", code: "rate-3", number: 3, previous: { episode_id: RATE_ID, episode_version: 1 } });
    e.scenes.cover.episode = { t: "3화", ui: true };
    e.track[2].no = { t: "3화", ui: true };
    const carry = (t: any) => {
      for (const k of t.src ?? []) e.quotes[`fomc:${k}`] = prev.quotes[k];
      return { ...t, src: (t.src ?? []).map((k: string) => `fomc:${k}`) };
    };
    e.track[1].title = carry(prev.track[1].title); // 이 회차의 다른 글은 제 구절 (omo.2023 …)을 그대로 쓴다 — 같은 구절이 두 키로 있어도 된다
    chain(e).nodes.forEach((n: any, i: number) => {
      const p = chain(prev).nodes[i];
      n.before = { reach: p.reach, value: carry(p.reach === "none" ? p.still : p.after) };
    });
    seats(e).sides.forEach((s: any, i: number) => {
      const p = seats(prev).sides[i];
      s.before = { group: carry(p.group), why: p.why };
    });
    return e;
  };
  const previous = parseEpisode(golden(RATE), { documents });
  const codesWith = (doc: unknown, ctx: object) => {
    const r = validateEpisode(doc, { documents, ...ctx });
    return r.ok ? [] : [...new Set(r.errors.map((x) => x.code))].sort();
  };
  const fail = (r: ReturnType<typeof validateEpisode>) => (r.ok ? "" : r.errors.map((x) => `${x.code} ${x.path} ${x.message}`).join("\n"));

  it("지난 회차 칸 셋이 다 찬 3화 꼴 — 통과 · 지난 회차를 안 주면 알림 PREVIOUS_NOT_CHECKED · 주면 대 보고 통과 · 칸이 없는 골든 셋도 그대로", () => {
    const a = validateEpisode(third(), { documents });
    expect(fail(a)).toBe("");
    expect(a.warnings.map((w) => w.code).sort()).toEqual(["PREVIOUS_NOT_CHECKED", "SEAT_WHY_NOT_YET"]);
    const b = validateEpisode(third(), { documents, previous });
    expect(fail(b)).toBe("");
    expect(b.warnings.map((w) => w.code)).toEqual(["SEAT_WHY_NOT_YET"]);
    for (const name of [PRICE, RATE, PRIVACY]) expect(codes(golden(name)), name).toEqual([]);
  });

  it("지난 회차를 받으면 대 본다 → PREV_MISMATCH (다른 판 · 다른 그림 · 지난 값 · 까닭 · 근거가 그 회차의 것이 아님 · 앞 화가 아님 · 옮겨 온 구절의 문서가 다름)", () => {
    const a = third();
    a.previous.episode_version = 2;
    expect(codesWith(a, { previous })).toEqual(["PREV_MISMATCH"]);
    const b = third();
    chain(b).picture.id = "rate-brake-2";
    expect(codesWith(b, { previous })).toEqual(["PREV_MISMATCH"]);
    const c = third();
    chain(c).nodes[1].before.reach = "full"; // 2화에서는 일부 (part) 였다
    expect(codesWith(c, { previous })).toEqual(["PREV_MISMATCH"]);
    const d = third();
    seats(d).sides[1].before.why = "in-doc"; // 2화에서는 아직 (not-yet) 이었다
    expect(codesWith(d, { previous })).toEqual(["PREV_MISMATCH"]);
    const f = third();
    chain(f).nodes[1].before.value.src = ["pc10.cond"]; // 이 회차의 구절 키 — 지난 회차의 값이라면 fomc:pc10.cond
    expect(codesWith(f, { previous })).toEqual(["PREV_MISMATCH"]);
    const g = third();
    g.number = 2;
    g.scenes.cover.episode = { t: "2화", ui: true };
    g.track[2].no = { t: "2화", ui: true };
    expect(codesWith(g, { previous })).toEqual(["PREV_MISMATCH"]);
    const h = third();
    h.quotes["fomc:omo.2023"] = { doc: "CAL", quote: "The FOMC holds eight regularly scheduled meetings during the year and other meetings as needed." }; // 문서에는 있는 구절 — 지난 회차의 그 구절이 아니다
    expect(codesWith(h, {})).toEqual([]);
    expect(codesWith(h, { previous })).toEqual(["PREV_MISMATCH"]);
  });

  it("지난 회차 칸 — 지난 회차에서 온 구절인데 previous 없음 → PREV_MISSING · 쪽의 지난 값만 있어도 → PREV_MISSING · 앞머리가 이 회차의 code → PREV_KEY · 지난 회차가 자신 → ID_RANGE", () => {
    const a = third();
    delete a.previous;
    chain(a).nodes.forEach((n: any) => delete n.before);
    seats(a).sides.forEach((s: any) => delete s.before);
    expect(codesWith(a, {})).toEqual(["PREV_MISSING"]); // fomc:omo.2023 · fomc:omo.2026 만 남았다
    const b = golden(RATE);
    seats(b).sides[1].before = { group: { t: "올리자 · 2명", src: ["st10.vote"] }, why: "not-yet" };
    expect(codes(b)).toEqual(["PREV_MISSING"]);
    const c = golden(RATE);
    c.previous = SOME_PREVIOUS;
    c.quotes["fomc:omo.2023"] = c.quotes["omo.2023"];
    c.track[1].title.src = ["fomc:omo.2023", "omo.2026"];
    expect(codes(c)).toEqual(["PREV_KEY"]); // 금리 2화의 code 가 fomc 다 — 제 구절에 제 앞머리
    const d = third();
    d.previous.episode_id = d.episode_id;
    expect(codesWith(d, {})).toEqual(["ID_RANGE"]);
  });

  it("체험 없는 회차 (조용히) — 사망 · 체험 없음 · 뒤집기 없음이 함께 선다 (풀이 칸만 — 실물 회차 없음)", () => {
    const t = (s: string) => ({ t: s });
    const r = solveProblems(
      {
        entry: { first_thought: t("가"), breaker: t("나"), flip: null, not_drawn: [], whose: t("다"), death: true },
        lab: null,
        plain: { kind: "quiet", why: "death", title: "라", what: [t("마")], known: [t("바")], coming: [t("사")], ask: "아" },
      },
      null,
    );
    expect(r.errors).toEqual([]);
  });
});
