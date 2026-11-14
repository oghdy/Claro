// UX-9 진짜 체험 시안의 검사 — 새 체험이 **더한 글** (./copy.ts)이 지킬 것을 지키는지 본다. 골든 · 계약은 그대로다 (그쪽은 lab/episode/check.ts · contract test 가 본다).
//   pnpm --filter @claro/web exec tsx src/app/lab/play/check.ts [--read]     (--read: 더한 글을 차례대로 찍는다)
// 보는 것
//   P1  새 사실 0 — 받는 말의 src 가 그 회차 골든의 구절 키다 · 글의 숫자가 그 구절 안에 있다 (계약 불변식 4 · 9 와 같은 대조). 맨 글자열 (단추 · 물음 · 까닭)에는 숫자가 없다 (불변식 10)
//   P2  채점하지 않는다 — "정답 · 오답 · 맞았 · 틀렸 · 맞혔 · 점수 · 잘했" 이 더한 글에 없다
//   P3  반사실이 없다 — "막았으면 · 막았다면 · 했더라면 · 였다면 · 않았다면 · 않았을 · 없었을" (개인정보의 그리지 않을 것 1번 · D91). 골든의 맺는 글이 그 말을 **부정하는** 문장으로 화면에 그대로 있다
//   P4  금리 — 미 연준의 금리를 한국의 대출 이자로 잇지 않는다: "한국 · 우리나라 · 내 대출 · 대출 이자 · 주택담보 · 이자가" 가 없다
//   P5  D61 — ③ 자리의 바탕이 한 기관 안의 공식 이견이다 (골든 seats 틀의 ground.split) · 표의 쪽은 골든의 두 쪽뿐이고 "내린다"는 쪽이 아니다 (side: null) · 까닭이 아직 문서에 없는 쪽에 앉으면 그 문장이 보인다 (said 를 그대로 보인다 — not_yet_note 가 said 안에 있다)
//        ④ 세 회차 모두 사람이 숨진 사건이 아니다 (entry.death === false)
//   P6  고를 것마다 받는 말이 있다 — 표 셋 × 까닭 둘 · 칸 여섯. 받는 말의 길이가 고른 것에 따라 크게 다르지 않다 (긴 쪽이 짧은 쪽의 두 배를 넘지 않는다 — 길이가 "정답"을 귀띔하지 않게)
//   P7  넘기기 전에 보이는 ★ 칸의 이름이 판단을 미리 말하지 않는다 (칸의 머리와 다르고 · 골든에 이미 있는 말이다)
//   P8  실제 화면이 이 시안을 읽지 않는다 — src/episode · src/app/s · src/app/short · src/app/page.tsx · src/app/map 이 lab/play 의 것을 가져오지 않는다 (import) · 뼈대의 끼움 자리 (play)를 주는 곳은 lab/play 뿐이다
// 보지 않는 것: 받는 말의 뜻이 구절에서 나오는가 · 재미있는가 (사람 — 폰으로 해 본다)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DELIVERY } from "../../../episode/episodes/delivery/data";
import { FOMC } from "../../../episode/episodes/fomc/data";
import { PIPC } from "../../../episode/episodes/pipc/data";
import type { EpisodeData, T } from "../../../episode/kit/types";
import { PRICE, PRIVACY, RATE } from "./copy";

const WEB = path.join(import.meta.dirname, "../../../..");
let failed = 0;
const fail = (code: string, message: string) => {
  failed += 1;
  console.log(`  FAIL ${code} ${message}`);
};
const READ = process.argv.includes("--read");

type Item = { where: string; ep: EpisodeData; text: string; item?: T };
const items: Item[] = [];
const str = (ep: EpisodeData, where: string, text: string) => items.push({ where, ep, text });
const txt = (ep: EpisodeData, where: string, item: T) => items.push({ where, ep, text: item.t, item });

// 배달앱
str(DELIVERY, "배달앱 · 귀띔", PRICE.dragHint);
str(DELIVERY, "배달앱 · 단추", `${PRICE.down} / ${PRICE.up} / ${PRICE.commit}`);
PRICE.levels.forEach((l) => str(DELIVERY, "배달앱 · 눈금", l));
str(DELIVERY, "배달앱 · 점선", PRICE.mine);
txt(DELIVERY, "배달앱 · 정하기 전", PRICE.set);
txt(DELIVERY, "배달앱 · 정한 뒤", PRICE.picked);
txt(DELIVERY, "배달앱 · 요구가 온 뒤", PRICE.tied);
str(DELIVERY, "배달앱 · 막힌 뒤", PRICE.retry);
// 금리
for (const k of ["slip", "ask", "whyAsk", "cast", "castWait", "opening", "mineLabel", "alone", "again", "first"] as const) str(FOMC, `금리 · ${k}`, RATE[k]);
for (const o of RATE.options) {
  str(FOMC, `금리 · 표 ${o.id}`, o.label);
  o.reasons.forEach((r, i) => str(FOMC, `금리 · 표 ${o.id} 까닭 ${i + 1}`, r));
  txt(FOMC, `금리 · 표 ${o.id} 첫 줄`, o.head);
  o.replies.forEach((r, i) => txt(FOMC, `금리 · 표 ${o.id} 까닭 ${i + 1} 받는 말`, r));
}
// 개인정보
str(PIPC, "개인정보 · 머리", PRIVACY.title);
txt(PIPC, "개인정보 · 준비 글", PRIVACY.setup);
for (const k of ["ask", "pinHint", "pin", "go", "goWait", "star", "compare", "noGrade", "again", "first"] as const) str(PIPC, `개인정보 · ${k}`, PRIVACY[k]);
for (const [id, r] of Object.entries(PRIVACY.replies)) txt(PIPC, `개인정보 · 칸 ${id} 받는 말`, r);

console.log(`■ 진짜 체험 시안 — 더한 글 ${items.length} 덩이 (배달앱 ${items.filter((x) => x.ep === DELIVERY).length} · 금리 ${items.filter((x) => x.ep === FOMC).length} · 개인정보 ${items.filter((x) => x.ep === PIPC).length})`);
if (READ) for (const x of items) console.log(`  [${x.where}] ${x.text.replace(/\n/g, " / ")}${x.item?.src ? `  ← ${x.item.src.join(" · ")}` : ""}`);

// P1
const digits = (s: string) => s.match(/\d+(?:[.,]\d+)*/g) ?? [];
let grounded = 0;
for (const x of items) {
  if (!x.item) {
    if (digits(x.text).length) fail("P1", `맨 글자열에 숫자 — ${x.where}: "${x.text}"`);
    continue;
  }
  for (const k of x.item.src ?? []) if (!x.ep.quotes[k]) fail("P1", `구절 키 ${k} 가 ${x.ep.code} 골든에 없다 — ${x.where}`);
  const pool = (x.item.src ?? []).map((k) => x.ep.quotes[k]?.quote ?? "").join(" ");
  for (const d of digits(x.text)) {
    if (!pool.includes(d)) fail("P1", `숫자 ${d} 가 근거 구절에 없다 — ${x.where}`);
    else grounded += 1;
  }
}

// P2 · P3 · P4
const GRADE = /정답|오답|맞았|틀렸|맞혔|점수|잘했/;
const COUNTER = /막았으면|막았다면|했더라면|였다면|않았다면|않았을|없었을/;
const KOREA = /한국|우리나라|내 대출|대출 이자|주택담보|이자가/;
for (const x of items) {
  if (GRADE.test(x.text)) fail("P2", `채점하는 말 — ${x.where}: "${x.text}"`);
  if (COUNTER.test(x.text)) fail("P3", `반사실 — ${x.where}: "${x.text}"`);
  if (x.ep === FOMC && KOREA.test(x.text)) fail("P4", `연준 금리를 한국 대출 이자로 — ${x.where}: "${x.text}"`);
}
const pages = PIPC.solve.lab?.frames[0];
if (pages?.kind !== "pages") fail("P3", "개인정보 골든의 틀이 넘겨 보기가 아니다");
else if (!/말한 건 아니에요/.test(pages.caption.after.t)) fail("P3", "골든의 맺는 글에 반사실을 부정하는 문장이 없다");

// P5
const seats = FOMC.solve.lab?.frames.find((f) => f.kind === "seats");
if (seats?.kind !== "seats") fail("P5", "금리 골든에 자리에 앉기 틀이 없다");
else {
  if (seats.ground.split !== "official-dissent") fail("P5", `자리의 바탕이 한 기관 안의 공식 이견이 아니다 — ${seats.ground.split}`);
  const ids = seats.sides.map((s) => s.id);
  for (const o of RATE.options) if (o.side !== null && !ids.includes(o.side)) fail("P5", `표 ${o.id} 가 골든에 없는 쪽 ${o.side} 를 가리킨다`);
  const sided = RATE.options.filter((o) => o.side !== null).map((o) => o.side);
  if (new Set(sided).size !== ids.length) fail("P5", "골든의 두 쪽이 표에 하나씩 있지 않다");
  if (RATE.options.filter((o) => o.side === null).length !== 1) fail("P5", "쪽이 아닌 표 (아무도 앉지 않은 쪽)는 하나다");
  for (const s of seats.sides) if (s.why === "not-yet" && !(s.not_yet_note && s.said.t.includes(s.not_yet_note))) fail("P5", `까닭이 아직 없는 쪽 ${s.id} 의 말에 그 문장이 없다`);
}
for (const ep of [DELIVERY, FOMC, PIPC]) if (ep.solve.entry.death) fail("P5", `${ep.code} — 사람이 숨진 사건에는 체험이 없다 (D61 ④)`);

// P6
const len = (t: T) => t.t.replace(/\s|\*/g, "").length;
const rateLens = RATE.options.flatMap((o) => o.replies.map((r) => len(o.head) + len(r)));
if (Math.max(...rateLens) > Math.min(...rateLens) * 2) fail("P6", `금리 — 받는 말의 길이가 고른 것에 따라 두 배 넘게 다르다 (${rateLens.join(" · ")})`);
if (pages?.kind === "pages") {
  for (const c of pages.cards) if (!PRIVACY.replies[c.id]) fail("P6", `개인정보 — 칸 ${c.id} 에 받는 말이 없다`);
  for (const id of Object.keys(PRIVACY.replies)) if (!pages.cards.some((c) => c.id === id)) fail("P6", `개인정보 — 받는 말 ${id} 의 칸이 골든에 없다`);
  const pinLens = pages.cards.map((c) => (PRIVACY.replies[c.id] ? len(PRIVACY.replies[c.id]!) : 0));
  if (Math.max(...pinLens) > Math.min(...pinLens) * 2) fail("P6", `개인정보 — 받는 말의 길이가 칸에 따라 두 배 넘게 다르다 (${pinLens.join(" · ")})`);
  // P7
  const star = pages.cards.find((c) => c.star);
  const face = PIPC.scenes.aha.real[1]?.head.t;
  if (!star || !face) fail("P7", "★ 칸 또는 그 칸의 다른 이름이 없다");
  else {
    if (face === star.head) fail("P7", "넘기기 전의 이름이 ★ 칸의 머리와 같다 (판단을 미리 말한다)");
    if (/소홀/.test(face)) fail("P7", `넘기기 전의 이름이 판단을 말한다 — "${face}"`);
  }
}

// P8
const grep = (pattern: string, dirs: string[]) => {
  try {
    return execFileSync("grep", ["-rln", pattern, ...dirs], { cwd: WEB, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
};
const real = grep('from "[^"]*lab/play', ["src/episode", "src/app/s", "src/app/short", "src/app/page.tsx", "src/app/map"]);
if (real.length) fail("P8", `실제 화면이 시안을 읽는다 — ${real.join(" · ")}`);
const givers = grep("play={", ["src"]).filter((f) => !f.startsWith("src/app/lab/play/"));
if (givers.length) fail("P8", `lab/play 밖에서 끼움 자리를 준다 — ${givers.join(" · ")}`);
const skeleton = readFileSync(path.join(WEB, "src/episode/kit/Episode.tsx"), "utf8");
if (!skeleton.includes("const swap = !seen && play ? play : null;")) fail("P8", "뼈대의 끼움 자리가 바뀌었다 — 안 주면 틀 부품이 서는지 다시 본다");

if (failed) {
  console.log(`\nFAIL — ${failed}`);
  process.exit(1);
}
console.log(`  숫자 ${grounded} (전부 근거 구절 안) · 금리 받는 말 길이 ${rateLens.join(" · ")} · 표 ${RATE.options.length} × 까닭 2 · 칸 ${Object.keys(PRIVACY.replies).length}`);
console.log("\nOK — 새 사실 0 · 채점 없음 · 반사실 없음 · 한국 대출 이자 없음 · D61 ③ ④ · 고를 것마다 받는 말 · ★ 칸의 이름 · 실제 화면과 떨어져 있음");
