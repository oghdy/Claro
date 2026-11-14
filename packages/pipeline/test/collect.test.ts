// S-2 — 후보 모으기 · 기다림 목록 · 추천의 확인 · 한 장. 네트워크 0 · 모델 0. 목록 쪽 글자는 실제 쪽의 꼴을 본뜬 지어낸 줄이다 (원문이 아니다).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXCLUDED, SOURCES, parseFedJson, parseFomcCalendar, parseFss, parseKftc, parseKoreaBriefing, parseKoreaPress, parsePipcDecisions, parseRss, strip, wallToUtc, type Row } from "../src/collect-sources.ts";
import { asOf, calendarFor, fomcEntries, inWindow, mergeCalendar, tagsOf, watchResults, windowOf, type CalEntry, type Calendar, type Waitlist } from "../src/collect-wait.ts";
import { assignIds, dedupe, publicCopy } from "../src/collect.ts";
import { checkOutput, checkPicks, emptyPicks, recommendReq, renderSheet, userText, type Candidate, type Day } from "../src/recommend.ts";
import { RECOMMEND_SCHEMA, RECOMMEND_SYSTEM, type RecommendOut } from "../src/recommend-prompt.ts";
import { allowed, parseRobots } from "../src/robots.ts";
import { requestParams } from "../src/llm.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const json = <T>(p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8")) as T;
const WL = json<Waitlist>("packages/pipeline/data/collect/waitlist.json");
const CAL = json<Calendar>("packages/pipeline/data/collect/calendar.json");
const row = (o: Partial<Row>): Row => ({ source: "korea-press", native_id: "1", org: "어느 부", title: "제목", url: "https://www.korea.kr/x", date: "2026-11-12", at: null, kind: null, dept: null, attach: null, attach_names: [], lead: null, ...o });

describe("창 — 어제 낮 한국 + 밤사이 해외 · 월요일은 주말 (D86)", () => {
  it("평일 아침은 어제 하루 · 월요일 아침은 금 · 토 · 일", () => {
    expect(windowOf("2026-10-29").kr_dates).toEqual(["2026-10-28"]);
    expect(windowOf("2026-11-09").weekday).toBe("월");
    expect(windowOf("2026-11-09").kr_dates).toEqual(["2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(() => windowOf("11/9")).toThrow(/YYYY-MM-DD/);
  });
  it("FOMC 성명 (10/28 14:00 미 동부 = 10/29 03:00 한국)은 10/29 아침 창에 든다 · 낮에 나온 것은 내일로", () => {
    const fomc = parseFedJson(JSON.stringify([{ d: "10/28/2026 2:00:00 PM", t: "Federal Reserve issues FOMC statement", pt: "Monetary Policy", l: "/newsevents/pressreleases/monetary20261028a.htm" }]))[0]!;
    expect(fomc.at).toBe("2026-10-28T18:00:00.000Z");   // 서머타임 (UTC-4)
    expect(fomc.date).toBe("2026-10-29");
    expect(inWindow(windowOf("2026-10-29"), fomc)).toBe(true);
    expect(inWindow(windowOf("2026-10-28"), fomc)).toBe(false);
    expect(inWindow(windowOf("2026-10-30"), fomc)).toBe(false);
    // 11월 첫 일요일 뒤는 표준시 (UTC-5)
    expect(new Date(wallToUtc("America/New_York", 2026, 11, 12, 12, 45)).toISOString()).toBe("2026-11-12T17:45:00.000Z");
    // 날짜뿐인 국내 것: 어제 올라온 것만. 오늘 낮 것은 내일 아침에
    expect(inWindow(windowOf("2026-11-13"), row({ date: "2026-11-12" }))).toBe(true);
    expect(inWindow(windowOf("2026-11-13"), row({ date: "2026-11-13" }))).toBe(false);
  });
});

describe("목록 읽기 — 쪽의 꼴에서 줄을", () => {
  it("정책브리핑 보도자료 · 부처 브리핑", () => {
    const html = `<ul><li>
      <a href="/briefing/pressReleaseView.do?newsId=156000001&amp;pageIndex=1&amp;startDate=2026-11-12">
        <span class="text"><strong>가나다 &middot; 결과 발표</strong>
          <span class="lead">&nbsp;&nbsp;첫 문단이에요.&nbsp;</span>
          <span class="source"><span>2026.11.12</span><span>어느부</span></span></span></a></li></ul>`;
    expect(parseKoreaPress(html)).toEqual([row({ native_id: "156000001", org: "어느부", title: "가나다 · 결과 발표", url: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156000001", kind: "보도자료", lead: "첫 문단이에요." })]);
    const br = `<tbody><tr> <td>공정거래위원회</td> <td class="subject"><span class="vid_wrap"><a href="/briefing/policyBriefingView.do?newsId=156000002" class="flex"><strong>어떤 제재 브리핑 </strong></a></span></td> <td>2026.11.09</td> <td>아무개 과장</td> </tr></tbody>`;
    expect(parseKoreaBriefing(br)[0]).toMatchObject({ source: "korea-briefing", native_id: "156000002", org: "공정거래위원회", title: "어떤 제재 브리핑", date: "2026-11-09", dept: "아무개 과장" });
  });
  it("공정위 · 금감원 · 개인정보위 결정문", () => {
    const k = `<tbody><tr> <td>10976</td> <td>참고</td> <td class="p-subject"><a href="./selectBbsNttView.do?pageUnit=10&amp;key=12&amp;bordCd=3&amp;nttSn=48219"><span class="p-table__text">어느 합병 인가</span></a></td> <td>기업결합과</td> <td>2026-11-12</td> <td class="p-file"><a href="./downloadBbsFileAll.do?atchmnflNo=48219">파일다운로드</a></td> </tr></tbody>`;
    expect(parseKftc(k)[0]).toMatchObject({ source: "kftc-press", native_id: "48219", kind: "참고", dept: "기업결합과", date: "2026-11-12", attach: true, title: "어느 합병 인가" });
    const f = `<tr><td class="num">21000</td><td class="title"><a href="/fss/bbs/B0000188/view.do?nttId=249834&menuNo=200218&pageIndex=1">어떤 조치</a></td> <td>조사2국</td> <td> 2026-11-13 </td> <td><ul><li><a href="/x"><span class="name">261113_(보도자료) 어떤 조치.pdf</span></a></li></ul></td></tr>`;
    expect(parseFss(f)[0]).toMatchObject({ source: "fss-press", native_id: "249834", dept: "조사2국", date: "2026-11-13", attach: true, attach_names: ["261113_(보도자료) 어떤 조치.pdf"] });
    const p = `<tr> <td>2847</td> <td> 2소위원회 </td> <td class="boardTitle"><a href="?op=view&mCode=E030010000&idxId=2026-0861&schStr=">개인정보보호 법규 위반행위에 대한 시정조치에 관한 건(2025조이0027-01등 4건)</a></td> <td>2026-10-28</td> <td></td></tr>`;
    expect(parsePipcDecisions(p)[0]).toMatchObject({ native_id: "2847", kind: "2소위원회", date: "2026-10-28" });
  });
  it("RSS · 연준 달력", () => {
    const rss = `<item><title> Monetary policy decisions</title><link>https://www.ecb.europa.eu/x.html</link><pubDate>Thu, 29 Oct 2026 14:15:00 +0100</pubDate></item><item><title>날짜 없는 것</title><link>https://a/b</link></item>`;
    const r = parseRss("ecb-press", "ECB")(rss);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ title: "Monetary policy decisions", at: "2026-10-29T13:15:00.000Z", date: "2026-10-29" });
    expect(inWindow(windowOf("2026-10-30"), r[0]!)).toBe(true);
    const cal = `<h4>2026 FOMC Meetings</h4> September 15-16* Statement: PDF | HTML Minutes: PDF | HTML (Released October 07, 2026) October 27-28 Statement: PDF | HTML Implementation Note December 8-9* * Meeting associated with a Summary of Economic Projections. <h4>2025 FOMC Meetings</h4> January 28-29 Statement`;
    expect(parseFomcCalendar(cal, 2026)).toEqual([
      { year: 2026, label: "September 15-16", last_day: "2026-09-16", sep: true, minutes_released: "2026-10-07" },
      { year: 2026, label: "October 27-28", last_day: "2026-10-28", sep: false, minutes_released: null },
      { year: 2026, label: "December 8-9", last_day: "2026-12-09", sep: true, minutes_released: null },
    ]);
    expect(strip("a&nbsp;<b>b</b> &amp; c")).toBe("a b & c");
  });
});

describe("출처 목록 — robots 가 막는 곳은 넣지 않는다", () => {
  it("넣은 곳의 주소는 넣지 않기로 한 곳과 겹치지 않는다 · 출처마다 권리 어림 · 지난 날짜가 열리나를 적었다", () => {
    const bad = ["case.ftc.go.kr", "likms.assembly.go.kr", "www.ftc.gov", "www.bls.gov", "www.sec.gov", "open.krx.co.kr", "www.bok.or.kr"];
    for (const s of SOURCES) {
      const u = new URL(s.url({ date: "2026-11-12", page: 1 }));
      expect(bad).not.toContain(u.host);
      expect(s.rights_hint.length).toBeGreaterThan(5);
      expect(s.past.length).toBeGreaterThan(3);
    }
    for (const h of ["case.ftc.go.kr", "likms.assembly.go.kr", "ftc.gov", "bls.gov"]) expect(EXCLUDED.some((e) => e.url.includes(h))).toBe(true);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
  });
  it("공정위 의결서 · 국회의 robots (S-1 이 본 글자)는 우리를 막는다 · 정책브리핑 · 공정위 보도자료는 안 막는다", () => {
    expect(allowed(parseRobots("User-agent: *\nDisallow: /"), "/ocp/co/ltfr.do").ok).toBe(false);
    expect(allowed(parseRobots("User-agent: *\nDisallow: /\nUser-agent: Yeti\nAllow: /bill/"), "/bill/main.do").ok).toBe(false);
    expect(allowed(parseRobots("User-Agent: *\nAllow: /\nDisallow: "), "/briefing/pressReleaseList.do?pageIndex=1").ok).toBe(true);
    expect(allowed(parseRobots("User-agent: *\nDisallow: /www/search.do*"), "/www/selectBbsNttList.do?bordCd=3&key=12").ok).toBe(true);
  });
});

describe("기다림 목록 · 달력 · 꼬리표 (모델 없음)", () => {
  it("기다림 목록의 '남은 것'은 골든의 남음 장면과 글자가 같다 — 이야기 셋 전부", () => {
    expect(WL.stories.map((s) => s.code).sort()).toEqual(["price", "privacy", "rate"]);
    for (const s of WL.stories) {
      const ep = json<{ series: { name: string }; scenes: { next: { coming: { head: string }[] } } }>(s.fixture);
      expect(s.name).toBe(ep.series.name);
      expect(s.items.map((i) => i.head)).toEqual(ep.scenes.next.coming.map((c) => c.head));
    }
  });
  it("지난 날짜로 돌리면 그 아침에 알던 이야기만 — 그날 고른 사건이 '이어질 거리'로 새지 않는다", () => {
    expect(asOf(WL, "2026-10-29").stories.map((s) => s.code)).toEqual(["rate"]);            // 1화 (9월)만 알았다
    expect(asOf(WL, "2026-10-29").stories[0]!.gist).toMatch(/9월 16일/);
    expect(asOf(WL, "2026-10-29").wl.stories[0]!.items).toEqual([]);                           // 2화의 남은 것은 아직 없다
    expect(asOf(WL, "2026-10-30").stories.map((s) => s.code)).toEqual(["rate"]);            // 개인정보위는 이날 아침에 고른다 — 아직 이야기가 아니다
    expect(asOf(WL, "2026-10-30").stories[0]!.gist).toMatch(/10월 28일/);
    expect(asOf(WL, "2026-11-10").stories.map((s) => s.code)).toEqual(["rate", "privacy"]);
    expect(asOf(WL, "2026-11-13").stories.map((s) => s.code)).toEqual(["rate", "privacy", "price"]);
    const pipc = row({ org: "개인정보보호위원회", title: "안전조치 의무 위반 2개 사업자에 과징금" });
    expect(tagsOf(pipc, asOf(WL, "2026-10-30").wl, [])).toEqual([]);
    expect(tagsOf(pipc, asOf(WL, "2026-10-31").wl, []).map((t) => t.type)).toEqual(["이어질 거리"]);
  });
  it("이어질 거리 = 기관 + 하나 더. 기관만 같으면 '같은 기관'으로만 (D86)", () => {
    const samyang = tagsOf(row({ org: "개인정보보호위원회", title: "개인정보위, 안전조치 의무 위반한 어느 그룹 제재" }), WL, []);
    expect(samyang).toEqual([{ type: "이어질 거리", story: "privacy", name: "내 정보는 누가 지키나", item: null, matched: ["안전조치"] }]);
    expect(tagsOf(row({ org: "공정거래위원회", title: "어느 항공사 합병 인가" }), WL, [])).toEqual([{ type: "같은 기관", story: "price", name: "누가 값을 정하나" }]);
    expect(tagsOf(row({ org: "공정거래위원회", title: "쿠팡 끼워팔기 재심사 결과" }), WL, [])[0]).toMatchObject({ type: "이어질 거리", story: "price", item: "따로 남은 숙제" });
    expect(tagsOf(row({ org: "국토교통부", title: "배달 로봇 시범 운행" }), WL, [])).toEqual([]);   // 낱말은 맞아도 기관이 다르면 아니다
    const sched = tagsOf(row({ org: "미 연준 (Federal Reserve Board)", title: "Federal Reserve announces revised tentative schedule of Federal Open Market Committee meetings in 2027" }), WL, []);
    expect(sched[0]).toMatchObject({ type: "이어질 거리", story: "rate", item: "회의 방식도 바뀌어요" });
  });
  it("달력 — 연준 달력에서 읽은 줄이 사람이 어림으로 적은 줄을 갈음한다 · 창에 든 것과 다가오는 것", () => {
    const auto = fomcEntries([{ year: 2026, label: "October 27-28", last_day: "2026-10-28", sep: false, minutes_released: "2026-11-18" }, { year: 2026, label: "December 8-9", last_day: "2026-12-09", sep: true, minutes_released: null }]);
    const all = mergeCalendar(CAL.entries, auto);
    expect(all.filter((e) => e.date === "2026-11-18")).toHaveLength(1);
    expect(all.find((e) => e.date === "2026-11-18")!.approx).toBe(false);
    const d = calendarFor(windowOf("2026-10-29"), all);
    expect(d.due.map((e) => e.date)).toEqual(["2026-10-28"]);
    const fomc = row({ source: "fed-press", org: "미 연준 (Federal Reserve Board)", title: "Federal Reserve issues FOMC statement" });
    expect(tagsOf(fomc, WL, d.due).map((t) => t.type)).toEqual(["이어질 거리", "달력"]);
    expect(calendarFor(windowOf("2026-11-13"), all).ahead.map((e) => e.date)).toEqual(["2026-11-18"]);
    // 못 가져오는 곳 (BLS)은 기관 · 열쇠가 비어 있다 — 후보에 꼬리표를 붙이지 않고 한 장에 주소만 보인다
    const bls: CalEntry = CAL.entries.find((e) => e.date === "2026-11-10")!;
    expect(bls.orgs).toEqual([]);
    expect(tagsOf(fomc, WL, [bls])).toHaveLength(1);
  });
  it("날짜 없는 것의 확인 — 회의록 · 사건 번호 · 사람이 볼 것", () => {
    const pipc = [row({ source: "pipc-decisions", native_id: "2847", title: "시정조치에 관한 건(2025조이0027-01등 4건)", date: "2026-10-28" })];
    const w = watchResults(WL, { fomc: [{ year: 2026, label: "October 27-28", last_day: "2026-10-28", sep: false, minutes_released: null }], pipc }, "2026-11-16");
    expect(w.map((x) => [x.head, x.state])).toEqual([["회의록이 나오면", "아직"], ["의결서가 나오면", "아직"], ["대교가 공표하면", "확인할 곳 없음"], ["결정문이 나오면", "사람이 본다"]]);
    expect(w[3]!.say).toMatch(/오늘이 월요일/);
    const came = watchResults(WL, { fomc: null, pipc: [row({ native_id: "2900", title: "시정조치에 관한 건(2024조일0049)", date: "2026-10-28" })] }, "2026-11-17");
    expect(came.map((x) => x.state)).toEqual(["못 물었다", "왔다", "확인할 곳 없음", "사람이 본다"]);
  });
});

describe("겹친 것 · 번호 · git 에 두는 판", () => {
  it("같은 제목은 하나로 — 낸 기관의 게시판 줄을 남기고 첫 문단은 받는다", () => {
    const m = dedupe([row({ native_id: "9", org: "공정거래위원회", title: "가 나-다, 제재", lead: "첫 문단" }), row({ source: "kftc-press", native_id: "48219", org: "공정거래위원회", title: "가 나-다 제재", attach: true })]);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ source: "kftc-press", lead: "첫 문단", attach: true, also_at: [{ source: "korea-press" }] });
  });
  it("번호는 다시 돌려도 안 바뀐다 · 새 줄은 뒤 번호 · git 에 두는 판에는 첫 문단이 없다", () => {
    const a = assignIds([row({ native_id: "1" }), row({ native_id: "2" })], []);
    expect(a.map((x) => x.id)).toEqual(["c001", "c002"]);
    const b = assignIds([row({ native_id: "3" }), row({ native_id: "2" }), row({ native_id: "1" })], a);
    expect(b.map((x) => x.id)).toEqual(["c003", "c002", "c001"]);
    const day = mkDay();
    expect(day.candidates.some((c) => c.lead)).toBe(true);
    expect(JSON.stringify(publicCopy(day))).not.toMatch(/첫 문단 글/);
  });
});

const cand = (id: string, o: Partial<Candidate>): Candidate => ({ ...row({ native_id: id }), id, origin: "국내", rights_hint: "어림", also_at: [], tags: [], ...o });
function mkDay(): Day {
  return {
    version: "t", pick: "2026-11-13", window: windowOf("2026-11-13").say, made_at: "2026-11-13T00:00:00.000Z",
    sources: [{ id: "korea-press", name: "정책브리핑 보도자료", origin: "국내", status: "됨", requests: 1, rows: 2, in_window: 2, why: "" }, { id: "x", name: "어느 곳", origin: "해외", status: "robots 가 막음", requests: 1, rows: 0, in_window: 0, why: 'robots.txt 규칙 "Disallow: /"' }],
    candidates: [
      cand("c001", { org: "개인정보보호위원회", title: "안전조치 의무 위반 제재", lead: "첫 문단 글 ".repeat(40), tags: [{ type: "이어질 거리", story: "privacy", name: "내 정보는 누가 지키나", item: null, matched: ["안전조치"] }] }),
      cand("c002", { org: "어느 부", title: "어느 통계" }),
      cand("c003", { source: "fed-press", org: "미 연준", origin: "해외", title: "Some release", at: "2026-11-12T17:45:00.000Z" }),
    ],
    calendar: { due: [], ahead: [], unknown: [] }, watch: [], stories: asOf(WL, "2026-11-13").stories,
  };
}
const grade = (level: "상" | "중" | "하") => ({ level, why: "까닭" });
const OUT: RecommendOut = {
  recommended: [
    { id: "c001", one_line: "한 줄", category: "기술", origin: "국내", reach: grade("상"), flip: grade("상"), source: grade("상"), link: grade("상"), flip_line: "털렸다 ≠ 벌받는다", form: "짧은", form_why: "까닭", follow: "같은 조항" },
    { id: "c002", one_line: "한 줄", category: "생활", origin: "국내", reach: grade("중"), flip: grade("중"), source: grade("상"), link: grade("상"), flip_line: "", form: "긴", form_why: "까닭", follow: "" },
    { id: "c999", one_line: "없는 것", category: "돈", origin: "해외", reach: grade("하"), flip: grade("하"), source: grade("하"), link: grade("하"), flip_line: "", form: "짧은", form_why: "", follow: "" },
  ],
  concept_candidates: [], also: [{ id: "c003", why: "약하다" }], note: "해외가 약하다",
};

describe("추천 — 요청 · 출력 확인 · 한 장 · 사람이 고른 것", () => {
  it("프롬프트에 D86 의 규칙이 있고 숫자 점수는 없다 · 출력 모양은 structured outputs 가 받는 꼴", () => {
    for (const k of ["닿음", "오해 거리", "원문", "이어짐", "한 카테고리에서 하루 최대 2", "개념으로", "스포츠 · 문화 · 재난 · 부고", "고르는 것은 사람", "줄 세우지 마라", "점수를 매기지 마라"]) expect(RECOMMEND_SYSTEM).toContain(k);
    const walk = (o: unknown): void => {
      if (!o || typeof o !== "object") return;
      const x = o as { type?: string; additionalProperties?: boolean; required?: string[]; properties?: Record<string, unknown>; items?: unknown };
      if (x.type === "object") { expect(x.additionalProperties).toBe(false); expect([...(x.required ?? [])].sort()).toEqual(Object.keys(x.properties ?? {}).sort()); }
      Object.values(x.properties ?? {}).forEach(walk); walk(x.items);
    };
    walk(RECOMMEND_SCHEMA);
    expect(JSON.stringify(RECOMMEND_SCHEMA)).not.toMatch(/score|weight|"number"|"integer"/);
  });
  it("모델에 보내는 글 — 후보 줄 · 꼬리표 · 첫 문단은 잘라서. 요청에는 넉넉한 어림 값이 붙는다", () => {
    const day = mkDay();
    const u = userText(day);
    expect(u).toContain("c001 | 국내 | 개인정보보호위원회");
    expect(u).toContain("[이어질 거리: 「내 정보는 누가 지키나」 · 맞은 글자 안전조치]");
    expect(u.split("\n").find((l) => l.startsWith("c001"))!.length).toBeLessThan(400);
    const req = recommendReq(day, { in: 4, out: 20 });
    expect(req.event).toBe("PICK-2026-11-13");
    expect(req.est_usd).toBeGreaterThan(0.16);
    expect(requestParams(req).output_config.format.type).toBe("json_schema");
  });
  it("출력 확인 — 없는 id · 꼬리표 없는 이어짐을 적는다 (고치지 않는다)", () => {
    const { out, problems } = checkOutput(JSON.stringify(OUT), mkDay());
    expect(out!.recommended).toHaveLength(3);
    expect(problems).toEqual(["추천 c002 — 이어짐 상 인데 글자가 맞은 꼬리표가 없다 (사람이 본다)", "추천 c999 — 후보 목록에 없는 id"]);
    expect(checkOutput("{", mkDay()).out).toBeNull();
  });
  it("한 장 — 카테고리로 묶고 (줄 세우지 않는다) · 고르는 칸 · 못 본 곳 · 후보 전부. 첫 문단은 없다", () => {
    const day = mkDay();
    const md = renderSheet(publicCopy(day), { out: OUT, problems: ["추천 c999 — 후보 목록에 없는 id"], cost_usd: 0.1, model: "m" });
    expect(md).toContain("### 기술 (1)");
    expect(md).toContain("- [ ] **c001** · 짧은 · 국내 — **안전조치 의무 위반 제재**");
    expect(md).toContain("뒤집기 후보: 털렸다 ≠ 벌받는다");
    expect(md).toContain("닿음 **상** — 까닭");
    expect(md).toContain("**오늘 못 본 곳**: 어느 곳 (robots 가 막음");
    expect(md).toContain("## 후보 전부 (3)");
    expect(md).toContain("기계가 본 이상한 점");
    expect(md).not.toContain("첫 문단 글");
    expect(renderSheet(publicCopy(day), null)).toContain("추천 없음 (모델을 부르지 않았다)");
  });
  it("사람이 고른 것 — 빈 틀은 비어 있다 (기계가 채우지 않는다) · 규칙에 대 보고 알려 줄 뿐", () => {
    const p = emptyPicks("2026-11-13");
    expect(p.picked).toEqual([]);
    expect(p.picked_by).toBeNull();
    const say = checkPicks({ ...p, picked: [{ id: "c001", form: "긴" }, { id: "c002", form: "긴" }, { id: "c003", form: "긴" }, { id: "c777", form: "짧은" }] }, mkDay(), OUT);
    expect(say.join("\n")).toMatch(/c777 — 오늘 후보에 없는 id/);
    expect(say.join("\n")).toMatch(/긴 이야기 3 — D86 은 0 ~ 2/);
    expect(say.join("\n")).toMatch(/c003 — 추천 밖에서 골랐다/);
  });
});
