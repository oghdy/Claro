// S-2 · 후보 모으기 — 출처 목록과 목록 읽기 (모델 없음). D86 · S-1 ② "뼈로 쓸 것"에서 시작한다.
//
//   - 출처마다: 주소 · 날짜로 가르는 법 · 국내 / 해외 · 권리 어림 (판정이 아니다 — 판정은 PM · D40 · D53). robots 는 받을 때마다 robots.ts 로 묻는다 (collect.ts)
//   - 여기 있는 것은 **목록 쪽을 읽는 함수**뿐이다 (글자 → 줄). 네트워크는 collect.ts 가 한다 — 그래서 시험이 네트워크 없이 돈다
//   - 받는 것은 목록 쪽 (제목 · 날짜 · 주소)까지다. 보도자료 본문 · 첨부는 받지 않는다. 정책브리핑 목록에 딸려 오는 첫 문단 (lead)은 git 밖 캐시에만 둔다 (D40 · 권리)
//   - 써 보니 안 되는 곳은 EXCLUDED 에 까닭과 함께 적는다 — 넣지 않는다 (우회하지 않는다)
import { rightsOf } from "./rights.ts";

export const COLLECT_VERSION = "s2-collect/1";

export type Origin = "국내" | "해외";
/** 목록 한 줄 — 출처가 준 그대로 (아직 "오늘" 창으로 거르지 않았다) */
export type Row = {
  source: string;            // 출처 id (SOURCES 의 id)
  native_id: string;         // 그 게시판의 번호 (newsId · nttSn · nttId · 주소)
  org: string;               // 낸 기관 (부처 이름 · 기관 이름)
  title: string;
  url: string;
  date: string;              // 낸 곳이 적은 날 — 한국 날짜 YYYY-MM-DD (시각이 있으면 한국 시각으로 바꾼 날)
  at: string | null;         // 시각이 있으면 ISO (UTC). 목록에 날짜뿐이면 null
  kind: string | null;       // 보도 · 참고 · 설명 / Monetary Policy 같은 갈래 (있으면)
  dept: string | null;       // 부서 · 발표자 (있으면)
  attach: boolean | null;    // 첨부 있나 — 목록에서 알 수 없으면 null
  attach_names: string[];    // 첨부 이름 (목록이 주면)
  lead: string | null;       // 목록에 딸려 온 첫 문단 — **git 에 넣지 않는다** (캐시 · 모델 입력에만)
};

export type Source = {
  id: string;
  name: string;
  origin: Origin;
  /** 날짜로 가르는 법 — date: 주소에 날짜를 넣는다 · paged: 최신부터 쪽을 넘기며 날짜를 본다 · feed: 한 파일에 최근 것이 다 있다 */
  by: "date" | "paged" | "feed";
  /** 목록 주소. date — 그날 · 쪽 / paged — 쪽 / feed — 하나 */
  url: (a: { date: string; page: number }) => string;
  parse: (body: string) => Row[];
  /** 한 쪽에 이만큼이면 다음 쪽이 있을 수 있다 (date · paged) */
  page_size: number;
  /** 권리 어림 — 그 기관 문서를 git 에 둘 수 있나에 대해 **지금 아는 것**. 판정이 아니다 */
  rights_hint: string;
  /** 지난 날짜도 열리나 — feed 는 최근 것만 준다 */
  past: string;
  note: string;
};

// ── 글자 다듬기 ──────────────────────────────────────────────────────────────────────────────────────
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…", ndash: "–", mdash: "—", sim: "∼", rarr: "→", times: "×" };
export function strip(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/&amp;/g, "&")
    .replace(/[\s ]+/g, " ")
    .trim();
}
const dotDate = (s: string) => s.trim().replace(/\./g, "-").replace(/-$/, "");   // 2026.11.12 → 2026-11-12
const abs = (base: string, href: string) => new URL(href.replace(/&amp;/g, "&"), base).toString();

// ── 시각 ─────────────────────────────────────────────────────────────────────────────────────────────
/** 어떤 시간대의 벽시계 시각 → UTC ms (서머타임은 Intl 이 안다) */
export function wallToUtc(tz: string, y: number, mo: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const seen = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  return guess - (seen - guess);
}
/** UTC ms → 한국 날짜 · 시각 */
export function kst(ms: number): { date: string; time: string } {
  const s = new Date(ms + 9 * 3600_000).toISOString();
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
}

// ── 목록 읽기 ────────────────────────────────────────────────────────────────────────────────────────
const KOREA = "https://www.korea.kr";
/** 정책브리핑 보도자료 — `<li>` 마다 제목 · 첫 문단 · 날짜 · 부처 */
export function parseKoreaPress(html: string): Row[] {
  const out: Row[] = [];
  for (const m of html.matchAll(/<li>\s*<a href="\/briefing\/pressReleaseView\.do\?newsId=(\d+)[^"]*">([\s\S]*?)<\/a>\s*<\/li>/g)) {
    const body = m[2]!;
    const title = strip(/<strong>([\s\S]*?)<\/strong>/.exec(body)?.[1] ?? "");
    const lead = strip(/<span class="lead">([\s\S]*?)<\/span>\s*<span class="source">/.exec(body)?.[1] ?? "");
    const src = /<span class="source">\s*<span>([\d.]+)<\/span>\s*<span>([\s\S]*?)<\/span>/.exec(body);
    if (!title || !src) continue;
    out.push({ source: "korea-press", native_id: m[1]!, org: strip(src[2]!), title, url: `${KOREA}/briefing/pressReleaseView.do?newsId=${m[1]}`, date: dotDate(src[1]!), at: null, kind: "보도자료", dept: null, attach: null, attach_names: [], lead: lead || null });
  }
  return out;
}
/** 정책브리핑 부처 브리핑 — 표 (부처 · 주제 · 등록일 · 발표자). S1-m: 보도자료 쪽과 따로다 (배달앱은 여기에 있었다) */
export function parseKoreaBriefing(html: string): Row[] {
  const out: Row[] = [];
  for (const m of html.matchAll(/<tr>\s*<td>([^<]*)<\/td>\s*<td class="subject">([\s\S]*?)<\/td>\s*<td>([\d.]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    const id = /policyBriefingView\.do\?newsId=(\d+)/.exec(m[2]!)?.[1];
    const title = strip(/<strong>([\s\S]*?)<\/strong>/.exec(m[2]!)?.[1] ?? "");
    if (!id || !title) continue;
    out.push({ source: "korea-briefing", native_id: id, org: strip(m[1]!), title, url: `${KOREA}/briefing/policyBriefingView.do?newsId=${id}`, date: dotDate(m[3]!), at: null, kind: "부처 브리핑", dept: strip(m[4]!) || null, attach: null, attach_names: [], lead: null });
  }
  return out;
}
/** 공정위 보도자료 — 표 (번호 · 구분 · 제목 · 부서 · 등록일 · 첨부) */
export function parseKftc(html: string): Row[] {
  const out: Row[] = [];
  for (const m of html.matchAll(/<tr>\s*<td>(\d+)<\/td>\s*<td>([^<]*)<\/td>\s*<td class="p-subject">([\s\S]*?)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([\d-]+)<\/td>\s*<td class="p-file">([\s\S]*?)<\/td>/g)) {
    const sn = /nttSn=(\d+)/.exec(m[3]!)?.[1];
    const title = strip(/<span class="p-table__text">([\s\S]*?)<\/span>/.exec(m[3]!)?.[1] ?? "");
    if (!sn || !title) continue;
    out.push({ source: "kftc-press", native_id: sn, org: "공정거래위원회", title, url: `https://www.ftc.go.kr/www/selectBbsNttView.do?key=12&bordCd=3&nttSn=${sn}`, date: m[5]!, at: null, kind: strip(m[2]!) || null, dept: strip(m[4]!) || null, attach: /downloadBbsFileAll|previewBbsAtchmnfl/.test(m[6]!), attach_names: [], lead: null });
  }
  return out;
}
/** 금감원 보도자료 — 표 (번호 · 제목 · 부서 · 날짜 · 첨부 이름들) */
export function parseFss(html: string): Row[] {
  const out: Row[] = [];
  for (const m of html.matchAll(/<td class="title"><a href="([^"]*nttId=(\d+)[^"]*)">([\s\S]*?)<\/a><\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>\s*([\d-]+)\s*<\/td>\s*<td>([\s\S]*?)<\/tr>/g)) {
    const names = [...m[6]!.matchAll(/<span class="name">([\s\S]*?)<\/span>/g)].map((x) => strip(x[1]!));
    out.push({ source: "fss-press", native_id: m[2]!, org: "금융감독원", title: strip(m[3]!), url: `https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=${m[2]}&menuNo=200218`, date: m[5]!, at: null, kind: "보도자료", dept: strip(m[4]!) || null, attach: names.length > 0, attach_names: names, lead: null });
  }
  return out;
}
/** 개인정보위 결정문 — 표 (번호 · 회의 구분 · 제목 · 의결일). **제목에 회사 이름이 없다** — 사건 번호로 맞춘다 (S-1 ⑥). 후보가 아니라 기다림 목록의 확인 거리 */
export function parsePipcDecisions(html: string): Row[] {
  const out: Row[] = [];
  for (const m of html.matchAll(/<tr>\s*<td>(\d+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td class="boardTitle"><a href="([^"]*idxId=([\w-]+)[^"]*)">([\s\S]*?)<\/a><\/td>\s*<td>([\d-]+)<\/td>/g)) {
    out.push({ source: "pipc-decisions", native_id: m[1]!, org: "개인정보보호위원회", title: strip(m[5]!), url: `https://www.pipc.go.kr/np/default/agenda.do?op=view&mCode=E030010000&idxId=${m[4]}`, date: m[6]!, at: null, kind: strip(m[2]!) || null, dept: null, attach: null, attach_names: [], lead: null });
  }
  return out;
}
/** 연준 보도자료 — `/json/ne-press.json` (그 사이트의 목록 쪽이 읽는 파일 · 전 기간). d = 미 동부 벽시계 시각 */
export function parseFedJson(body: string): Row[] {
  const out: Row[] = [];
  let list: { d?: string; t?: string; pt?: string; l?: string; stub?: string }[];
  try { list = JSON.parse(body.replace(/^﻿/, "")); } catch { return out; }
  for (const x of list) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):\d{2} (AM|PM)$/.exec(x.d ?? "");
    const href = x.l || x.stub;   // 다른 기관과 함께 낸 것은 l 이 비고 stub (그 기관 주소)이 있다
    if (!m || !x.t || !href) continue;
    const h = (Number(m[4]) % 12) + (m[6] === "PM" ? 12 : 0);
    const ms = wallToUtc("America/New_York", Number(m[3]), Number(m[1]), Number(m[2]), h, Number(m[5]));
    out.push({ source: "fed-press", native_id: href, org: "미 연준 (Federal Reserve Board)", title: x.t.trim(), url: abs("https://www.federalreserve.gov", href), date: kst(ms).date, at: new Date(ms).toISOString(), kind: x.pt ?? null, dept: null, attach: null, attach_names: [], lead: null });
  }
  return out;
}
/** RSS — item 마다 제목 · 주소 · pubDate */
export const parseRss = (source: string, org: string) => (xml: string): Row[] => {
  const out: Row[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1]!;
    const title = strip(/<title>([\s\S]*?)<\/title>/.exec(it)?.[1] ?? "");
    const link = strip(/<link>([\s\S]*?)<\/link>/.exec(it)?.[1] ?? "");
    const ms = Date.parse(strip(/<pubDate>([\s\S]*?)<\/pubDate>/.exec(it)?.[1] ?? "").replace(/ Z$/, " GMT"));
    if (!title || !link || Number.isNaN(ms)) continue;
    out.push({ source, native_id: link, org, title, url: link, date: kst(ms).date, at: new Date(ms).toISOString(), kind: null, dept: null, attach: null, attach_names: [], lead: null });
  }
  return out;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export type FomcMeeting = { year: number; label: string; last_day: string; sep: boolean; minutes_released: string | null };
/** 연준 회의 달력 (`fomccalendars.htm`) — 그해 회의 줄: 날짜 · 점도표 회의(*) · 회의록이 나왔으면 나온 날. 기다림 목록의 "날짜 있는 것" 재료 */
export function parseFomcCalendar(html: string, year: number): FomcMeeting[] {
  const text = strip(html);
  const a = text.indexOf(`${year} FOMC Meetings`);
  if (a < 0) return [];
  const b = text.indexOf(`${year - 1} FOMC Meetings`, a);
  const part = text.slice(a, b < 0 ? undefined : b);
  const re = new RegExp(`\\b(${MONTHS.join("|")})(?:/(${MONTHS.join("|")}))? (\\d{1,2})(?:-(\\d{1,2}))?(\\*)?(?= |$)`, "g");
  const heads = [...part.matchAll(re)].filter((m) => !/Released $/.test(part.slice(Math.max(0, m.index! - 9), m.index!)));
  return heads.map((m, i) => {
    const seg = part.slice(m.index!, heads[i + 1]?.index ?? part.length);
    const mon = MONTHS.indexOf(m[2] ?? m[1]!) + 1;
    const day = Number(m[4] ?? m[3]);
    const rel = /Minutes:[^()]*\(Released (\w+) (\d{1,2}), (\d{4})\)/.exec(seg);
    const iso = (y: number, mo: number, d: number) => `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { year, label: m[0]!.replace("*", ""), last_day: iso(year, mon, day), sep: m[5] === "*", minutes_released: rel ? iso(Number(rel[3]), MONTHS.indexOf(rel[1]!) + 1, Number(rel[2])) : null };
  });
}

// ── 출처 목록 ────────────────────────────────────────────────────────────────────────────────────────
const usFederal = (host: string) => (rightsOf(host) === "US_FEDERAL_17USC105" ? "미 연방 정부 저작물 (rights.ts US_FEDERAL — 17 U.S.C. §105)" : "미 연방 기관 — rights.ts 표에는 아직 없다 (판정 필요)");
export const SOURCES: Source[] = [
  {
    id: "korea-press", name: "정책브리핑 보도자료 (전 부처)", origin: "국내", by: "date", page_size: 20,
    url: ({ date, page }) => `${KOREA}/briefing/pressReleaseList.do?pageIndex=${page}&startDate=${date}&endDate=${date}&period=direct`,
    parse: parseKoreaPress,
    rights_hint: "문서마다 다르다 — 본문 쪽의 공공누리 줄을 봐야 한다 (1유형 · 4유형 · 줄 없음을 다 봤다 · S1-a). 고른 뒤 문서 단위로",
    past: "열린다 (주소에 날짜)", note: "국내 후보의 대부분. 원안위 · 금융위 · 공정위 · 개인정보위 같은 부처 · 위원회 자료가 여기에 다 실린다. 쪽당 20 · 첫 문단이 딸려 온다 (캐시에만)",
  },
  {
    id: "korea-briefing", name: "정책브리핑 부처 브리핑", origin: "국내", by: "date", page_size: 10,
    url: ({ date, page }) => `${KOREA}/briefing/policyBriefingList.do?pageIndex=${page}&startDate=${date}&endDate=${date}&period=direct`,
    parse: parseKoreaBriefing,
    rights_hint: "문서마다 다르다 (배달앱 브리핑에는 1유형 표시가 있었다 · S1-m). 고른 뒤 문서 단위로",
    past: "열린다 (주소에 날짜)", note: "브리핑을 한 것 = 그 부처가 크게 본 것. 보도자료와 제목이 다를 때가 많아 따로 뜬다 (하루 0 ~ 10)",
  },
  {
    id: "kftc-press", name: "공정위 보도자료", origin: "국내", by: "paged", page_size: 50,
    url: ({ page }) => `https://www.ftc.go.kr/www/selectBbsNttList.do?bordCd=3&key=12&pageUnit=50&pageIndex=${page}`,
    parse: parseKftc,
    rights_hint: rightsOf("ftc.go.kr") === "KOGL_TYPE1" ? "공공누리 제1유형 (rights.ts KOGL_TYPE1 — 사이트 꼬리말)" : "미확인",
    past: "열린다 (쪽을 넘긴다)", note: "구분 (보도 · 참고 · 설명) · 부서 · 첨부가 목록에 있다. 정책브리핑에도 실리면 이쪽을 남긴다",
  },
  {
    id: "fss-press", name: "금감원 보도자료", origin: "국내", by: "date", page_size: 10,
    url: ({ date, page }) => `https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218&pageIndex=${page}&sdate=${date}&edate=${date}`,
    parse: parseFss,
    rights_hint: "미확인 — 판정 필요 (금감원은 부처가 아니라 정책브리핑에 없다)",
    past: "열린다 (주소에 날짜)", note: "S-1 ⑥ 이 더하라고 한 곳 (제재 · 조사 결과 · 해킹 대응). 첨부 이름이 목록에 있다",
  },
  {
    id: "fed-press", name: "미 연준 보도자료", origin: "해외", by: "feed", page_size: 0,
    url: () => "https://www.federalreserve.gov/json/ne-press.json",
    parse: parseFedJson,
    rights_hint: usFederal("federalreserve.gov"),
    past: "열린다 (전 기간이 한 파일)", note: "시각이 있다 (미 동부) → 한국 시각으로 바꿔 창에 넣는다. robots.txt 없음 (404)",
  },
  {
    id: "ecb-press", name: "유럽중앙은행 (ECB) 보도 · 연설", origin: "해외", by: "feed", page_size: 0,
    url: () => "https://www.ecb.europa.eu/rss/press.html",
    parse: parseRss("ecb-press", "유럽중앙은행 (ECB)"),
    rights_hint: "미확인 — 판정 필요 (S1-h)",
    past: "최근 15건만 (2주쯤) — 그보다 앞은 못 연다", note: "절반은 연설 (사람 이름: 제목). 결정 날만 쓸모가 있다",
  },
  {
    id: "boe-news", name: "영국은행 (Bank of England) 소식", origin: "해외", by: "feed", page_size: 0,
    url: () => "https://www.bankofengland.co.uk/rss/news",
    parse: parseRss("boe-news", "영국은행 (Bank of England)"),
    rights_hint: "미확인 — 판정 필요 (S1-h)",
    past: "최근 50건 (넉 달쯤)", note: "금리 결정 · 위원회 기록",
  },
  {
    id: "nasa-news", name: "NASA 소식", origin: "해외", by: "feed", page_size: 0,
    url: () => "https://www.nasa.gov/news-release/feed/",
    parse: parseRss("nasa-news", "NASA"),
    rights_hint: usFederal("nasa.gov"),
    past: "최근 10건만 (하루 이틀) — 지난 날은 못 연다", note: "S-1 이 '날짜를 못 가른다'던 곳 — RSS 에는 시각이 있다. 그림 글 (image-article)이 섞인다. 과학 쪽은 이 하나뿐이다",
  },
];

/** 써 보니 안 되는 곳 — 넣지 않는다. 까닭을 적어 둔다 (2026-11-14 · 우리 신원 표시로 물은 것) */
export const EXCLUDED: { name: string; url: string; why: string }[] = [
  { name: "공정위 의결서", url: "https://case.ftc.go.kr/ocp/co/ltfr.do", why: "robots.txt `User-agent: *` `Disallow: /` — 자동 확인을 만들지 않는다. D86: 사람이 주 1회 눈으로" },
  { name: "국회 의안정보", url: "https://likms.assembly.go.kr", why: "robots.txt `Disallow: /` (S-1 · D84 에서 PM 이 다시 확인)" },
  { name: "미 FTC 보도자료", url: "https://www.ftc.gov/news-events/news/press-releases", why: "목록 · RSS (`/feeds/press-release.xml`) · robots.txt 모두 우리 신원 표시에 403 ('abusive automated request') — S-1 은 열람 도구로 봤다. 우회하지 않는다" },
  { name: "미 BLS 발표 일정 · 보도자료", url: "https://www.bls.gov/schedule/news_release/", why: "robots.txt 까지 403 (Access Denied — D40 의 그 문제). 발표 날짜는 달력 파일 (calendar.json)에 사람이 적는다. 값은 공식 API (bls.ts)" },
  { name: "미 SEC 보도자료", url: "https://www.sec.gov/news/pressreleases.rss", why: "RSS 는 200 인데 robots.txt 가 403 (Request Rate Threshold — 연락처 없는 신원 표시를 거절). 규칙을 읽을 수 없는 곳이라 넣지 않았다 (S-1: 3주 내내 후보 0)" },
  { name: "한국거래소", url: "https://open.krx.co.kr", why: "robots.txt 는 `Allow: /` 인데 쪽이 403. 사이드카 · 서킷브레이커는 '개념으로' — 원문은 규정 (law.go.kr · 거래소 규정)" },
  { name: "한국은행 보도자료", url: "https://www.bok.or.kr/portal/bbs/B0000501/list.do?menuNo=201264", why: "robots 는 `/portal/` 을 허용하나 목록이 스크립트로 그려져 빈 표가 온다 (줄 0). 금통위 날짜는 달력 파일에 사람이 적는다" },
  { name: "원자력안전위", url: "https://www.nssc.go.kr", why: "따로 넣지 않는다 — 위원회 보도자료가 정책브리핑에 실린다 (게시판 주소는 못 찾았다)" },
  { name: "대법원 · 헌재 · EU 집행위 · NIH · WHO", url: "-", why: "S-1 ② 그대로 (robots 일부 막음 · 스크립트 목록 · 403 · 권리) — 이 Step 에서 다시 열어 보지 않았다" },
];
