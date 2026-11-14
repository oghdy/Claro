// S-2 · 추천 10 (모델) 과 아침 한 장 (사람). 모델을 부르는 것은 collect.ts 다 (llm.ts 를 불러 쓴다) — 이 파일은 요청 만들기 · 출력 확인 · 한 장 그리기 · 사람이 고른 것 확인.
// 네트워크 0 · 파일 0 — 글자를 받아 글자를 낸다.
import { sha256 } from "./extract.ts";
import type { CallReq } from "./llm.ts";
import type { Origin, Row } from "./collect-sources.ts";
import type { CalEntry, Tag, WatchResult } from "./collect-wait.ts";
import { CATEGORIES, LEAD_CLIP, RECOMMEND_EFFORT, RECOMMEND_MAX_TOKENS, RECOMMEND_MODEL, RECOMMEND_SCHEMA, RECOMMEND_SYSTEM, RECOMMEND_VERSION, type Category, type Rec, type RecommendOut } from "./recommend-prompt.ts";

/** 그날 후보 한 줄 — 목록 줄 + 번호 · 국내/해외 · 권리 어림 · 같은 발표가 실린 다른 곳 · 꼬리표 */
export type Candidate = Row & { id: string; origin: Origin; rights_hint: string; also_at: { source: string; org: string; url: string }[]; tags: Tag[] };
export type SourceReport = { id: string; name: string; origin: Origin; status: "됨" | "robots 가 막음" | "못 받음" | "줄 0"; requests: number; rows: number; in_window: number; why: string };
export type Day = {
  version: string; pick: string; window: string; made_at: string;
  sources: SourceReport[];
  candidates: Candidate[];
  calendar: { due: CalEntry[]; ahead: CalEntry[]; unknown: { what: string; why: string }[] };
  watch: WatchResult[];
  stories: { code: string; name: string; gist: string }[];   // 그 아침에 알던 이야기 (collect-wait asOf)
};
/** 저장한 모델 출력 — 어느 요청에서 나왔나 · 얼마였나 */
export type RecommendRaw = { prompt_version: string; model: string | null; model_requested: string; effort: string; mode: string; batch_id: string | null; request_sha256: string; at: string; usage: unknown; cost_usd: number; output: RecommendOut };

const tagSay = (t: Tag): string =>
  t.type === "이어질 거리" ? `[이어질 거리: 「${t.name}」${t.item ? ` — ${t.item}` : ""} · 맞은 글자 ${t.matched.join(" · ")}]`
  : t.type === "같은 기관" ? `[같은 기관뿐: 「${t.name}」]`
  : t.type === "달력" ? `[달력: ${t.what}]`
  : `[어제 넘친 것: ${t.from}]`;
const attachSay = (c: Candidate) => (c.attach == null ? "" : c.attach ? ` | 첨부 ${c.attach_names.length ? c.attach_names.slice(0, 3).join(" / ") : "있음"}` : " | 첨부 없음");
const timeSay = (c: Candidate) => (c.at ? `${c.date} ${new Date(Date.parse(c.at) + 9 * 3600_000).toISOString().slice(11, 16)}` : c.date);

/** 모델에 보내는 글 — 이야기 셋 · 달력 · 후보 줄 */
export function userText(day: Day): string {
  const L: string[] = [];
  L.push(`# 오늘 아침`, day.window, "");
  L.push(`# 지금 낸 이야기 (이어짐을 볼 때)`);
  for (const s of day.stories) L.push(`- 「${s.name}」: ${s.gist}`);
  if (!day.stories.length) L.push("- 아직 없다");
  L.push("", `# 달력`);
  L.push(day.calendar.due.length ? day.calendar.due.map((e) => `- 창에 든 것 (어제 일): ${e.date}${e.approx ? " 무렵" : ""} ${e.what}`).join("\n") : "- 창에 든 것: 없음");
  if (day.calendar.ahead.length) L.push(day.calendar.ahead.map((e) => `- 다가오는 것: ${e.date}${e.approx ? " 무렵" : ""} ${e.what}`).join("\n"));
  L.push("", `# 후보 ${day.candidates.length} (id | 국내/해외 | 기관 | 갈래 | 제목 | 첨부 | 꼬리표 | 첫 문단 앞머리)`);
  for (const c of day.candidates) {
    const lead = c.lead ? ` | ${c.lead.slice(0, LEAD_CLIP)}${c.lead.length > LEAD_CLIP ? "…" : ""}` : "";
    const others = [...new Set(c.also_at.map((a) => a.org))].filter((o) => o !== c.org);
    const also = others.length ? ` (+ ${others.join(" · ")})` : "";
    L.push(`${c.id} | ${c.origin} | ${c.org}${also} | ${c.kind ?? "-"} | ${c.title}${attachSay(c)}${c.tags.length ? ` | ${c.tags.map(tagSay).join(" ")}` : ""}${lead}`);
  }
  return L.join("\n");
}

/** 한 날의 요청. est_usd — 넉넉한 어림 (즉시 값): 입력 글자 수를 토큰으로 넉넉히 + 출력 상한 전부 */
export function recommendReq(day: Day, price: { in: number; out: number }): CallReq {
  const user = userText(day);
  const est_usd = ((RECOMMEND_SYSTEM.length + user.length) * 1.1 * price.in + RECOMMEND_MAX_TOKENS * price.out) / 1e6;
  return {
    event: `PICK-${day.pick}`, source_label: "RECOMMEND", prompt_version: RECOMMEND_VERSION, text_sha256: sha256(user),
    model: RECOMMEND_MODEL, effort: RECOMMEND_EFFORT, system: RECOMMEND_SYSTEM, user, schema: RECOMMEND_SCHEMA, max_tokens: RECOMMEND_MAX_TOKENS, est_usd,
  };
}

/** 출력 확인 — 모양은 structured outputs 가 지킨다. 여기서는 뜻: 목록에 있는 id 인가 · 겹치나 · 10 을 넘나. 문제는 고치지 않고 적는다 (사람이 한 장에서 본다) */
export function checkOutput(text: string, day: Day): { out: RecommendOut | null; problems: string[] } {
  let out: RecommendOut;
  try { out = JSON.parse(text) as RecommendOut; } catch { return { out: null, problems: ["모델 출력이 JSON 이 아니다"] }; }
  const ids = new Set(day.candidates.map((c) => c.id));
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const r of out.recommended) {
    if (!ids.has(r.id)) problems.push(`추천 ${r.id} — 후보 목록에 없는 id`);
    if (seen.has(r.id)) problems.push(`추천 ${r.id} — 두 번 나왔다`);
    seen.add(r.id);
    const c = day.candidates.find((x) => x.id === r.id);
    if (c && c.origin !== r.origin) problems.push(`추천 ${r.id} — 국내/해외가 목록 (${c.origin})과 다르다 (${r.origin})`);
    if (c && r.link.level !== "하" && !c.tags.some((t) => t.type === "이어질 거리" || t.type === "달력")) problems.push(`추천 ${r.id} — 이어짐 ${r.link.level} 인데 글자가 맞은 꼬리표가 없다 (사람이 본다)`);
  }
  if (out.recommended.length > 10) problems.push(`추천 ${out.recommended.length} — 10 을 넘는다`);
  for (const a of out.also) if (!ids.has(a.id)) problems.push(`아깝게 뺀 것 ${a.id} — 후보 목록에 없는 id`);
  for (const k of out.concept_candidates) for (const id of k.from_ids) if (!ids.has(id)) problems.push(`개념으로 후보 — 후보 목록에 없는 id ${id}`);
  return { out, problems };
}

// ── 아침 한 장 (markdown) ────────────────────────────────────────────────────────────────────────────
const g = (label: string, x: { level: string; why: string }) => `${label} **${x.level}** — ${x.why}`;
const link = (c: Candidate) => `[${c.org}${c.kind && c.kind !== "보도자료" ? ` · ${c.kind}` : ""} · ${timeSay(c)}](${c.url})`;

function recBlock(r: Rec, c: Candidate | undefined): string[] {
  if (!c) return [`- [ ] **${r.id}** (후보 목록에 없는 id — 모델이 틀렸다)`];
  const L = [`- [ ] **${c.id}** · ${r.form === "긴" ? "**긴**" : "짧은"} · ${r.origin} — **${c.title}**`];
  L.push(`  - ${r.one_line}`);
  L.push(`  - 뒤집기 후보: ${r.flip_line || "(안 보임)"}`);
  L.push(`  - ${g("닿음", r.reach)}`, `  - ${g("오해 거리", r.flip)}`, `  - ${g("원문", r.source)}`, `  - ${g("이어짐", r.link)}`);
  L.push(`  - ${r.form === "긴" ? "긴" : "짧은"} 이야기인 까닭: ${r.form_why}`);
  const tags = c.tags.filter((t) => t.type !== "같은 기관").map(tagSay);
  if (r.follow || tags.length) L.push(`  - 이어질 거리: ${[r.follow, ...tags].filter(Boolean).join(" ")}`);
  L.push(`  - ${link(c)}${c.attach ? " · 첨부 있음" : ""}${c.also_at.length ? ` · 같은 발표: ${c.also_at.map((a) => `[${a.org}](${a.url})`).join(" ")}` : ""}`);
  L.push(`  - 권리 어림: ${c.rights_hint}`);
  return L;
}

/** 사람이 아침에 보는 한 장. rec 이 없으면 (모델을 안 불렀으면) 목록만 */
export function renderSheet(day: Day, rec: { out: RecommendOut; problems: string[]; cost_usd: number; model: string } | null): string {
  const by = new Map(day.candidates.map((c) => [c.id, c]));
  const L: string[] = [];
  L.push(`# 오늘 고르기 — ${day.pick}`, "", `> ${day.window}`, `> 후보 ${day.candidates.length} (국내 ${day.candidates.filter((c) => c.origin === "국내").length} · 해외 ${day.candidates.filter((c) => c.origin === "해외").length})${rec ? ` · 추천 ${rec.out.recommended.length} (${rec.model} · $${rec.cost_usd.toFixed(3)})` : " · 추천 없음 (모델을 부르지 않았다)"}`, "");
  L.push(`**고르는 법 (D86)** — 보통 3 ~ 5편 (약속 아님 · 좋은 것이 없으면 적게) · 긴 0 ~ 2 · 한 카테고리 최대 2 (넘친 것은 내일로 → picks.json 의 tomorrow) · 해외는 약하면 비운다 · 뒤집기는 첨부를 열어 진짜인지 본다 · 쏠림 (금리)은 감으로. 추천의 순서에는 뜻이 없다.`, "");

  const trouble = day.sources.filter((s) => s.status !== "됨");
  if (trouble.length) L.push(`**오늘 못 본 곳**: ${trouble.map((s) => `${s.name} (${s.status} — ${s.why})`).join(" · ")}`, "");

  L.push(`## 달력 · 기다림 목록`);
  if (!day.calendar.due.length && !day.calendar.ahead.length) L.push(`- 달력: 창에 든 것도 다가오는 것도 없다`);
  for (const e of day.calendar.due) {
    const hit = day.candidates.filter((c) => c.tags.some((t) => t.type === "달력" && t.what === e.what));
    L.push(`- **어제 일 (창에 들었다)** ${e.date}${e.approx ? " 무렵" : ""} — ${e.what}${e.story ? ` · 이야기 ${day.stories.find((s) => s.code === e.story)?.name ?? e.story}` : ""} → ${hit.length ? `후보 ${hit.map((c) => c.id).join(" · ")}` : `**목록에 안 떴다 — 직접 연다**: ${e.url}`}`);
  }
  for (const e of day.calendar.ahead) L.push(`- 다가오는 것 ${e.date}${e.approx ? " 무렵" : ""} — ${e.what}`);
  for (const w of day.watch) L.push(`- 「${w.story}」 ${w.head}: **${w.state}** — ${w.say}${w.state === "사람이 본다" || w.state === "왔다" ? ` (${w.url})` : ""}`);
  const follow = day.candidates.filter((c) => c.tags.some((t) => t.type === "이어질 거리" || t.type === "어제 넘친 것"));
  if (follow.length) {
    L.push("", `**글자가 맞은 이어질 거리 (모델 없음 — 기관 + 하나 더)**`);
    for (const c of follow) L.push(`- ${c.id} ${c.title} ${c.tags.filter((t) => t.type !== "같은 기관").map(tagSay).join(" ")}${rec && !rec.out.recommended.some((r) => r.id === c.id) ? " — *추천에는 없다*" : ""}`);
  }
  L.push("");

  if (rec) {
    L.push(`## 추천 ${rec.out.recommended.length}`);
    if (rec.out.note) L.push("", `> 모델의 한마디: ${rec.out.note}`);
    for (const cat of CATEGORIES) {
      const rs = rec.out.recommended.filter((r) => r.category === cat);
      if (!rs.length) continue;
      L.push("", `### ${cat} (${rs.length})`);
      for (const r of rs) L.push(...recBlock(r, by.get(r.id)));
    }
    const empty = CATEGORIES.filter((cat) => !rec.out.recommended.some((r) => r.category === cat));
    if (empty.length) L.push("", `*추천이 없는 칸: ${empty.join(" · ")}*`);
    if (rec.out.concept_candidates.length) {
      L.push("", `## 개념으로 낼 후보 (큰 일인데 1차 문서가 없는 것 — 모델은 머리기사를 모른다 · 목록에 남은 흔적만 봤다)`);
      for (const k of rec.out.concept_candidates) L.push(`- **${k.concept}** — ${k.big_news} · 원문이 될 것: ${k.source_hint}${k.from_ids.length ? ` · 흔적: ${k.from_ids.join(" · ")}` : ""}`);
    }
    if (rec.out.also.length) {
      L.push("", `## 아깝게 뺀 것`);
      for (const a of rec.out.also) { const c = by.get(a.id); L.push(`- ${a.id} ${c ? `**${c.title}** (${c.org})` : "(목록에 없는 id)"} — ${a.why}${c ? ` · [원문 쪽](${c.url})` : ""}`); }
    }
    if (rec.problems.length) L.push("", `## 기계가 본 이상한 점`, ...rec.problems.map((p) => `- ${p}`));
    L.push("");
  }

  L.push(`## 고른 것을 적는 곳`, "", `같은 폴더의 \`picks.json\` — \`picked\` 에 고른 id · 긴/짧은 · (붙일 이야기가 있으면) follow, \`tomorrow\` 에 내일로 넘길 id. 적은 뒤 같은 명령을 다시 돌리면 규칙에 대 본 결과를 보여 준다 (막지는 않는다).`, "");

  L.push(`## 후보 전부 (${day.candidates.length}) — 추천 밖에서 건질 때`, "");
  const orgs = [...new Set(day.candidates.map((c) => c.org))];
  for (const org of orgs) {
    const cs = day.candidates.filter((c) => c.org === org);
    L.push(`**${org}** (${cs.length})`);
    for (const c of cs) L.push(`- ${c.id} [${c.title}](${c.url})${c.kind && c.kind !== "보도자료" ? ` · ${c.kind}` : ""}${c.at ? ` · ${timeSay(c)}` : ""}${c.attach ? " · 첨부" : ""}${c.tags.length ? ` ${c.tags.map(tagSay).join(" ")}` : ""}`);
  }
  if (day.calendar.unknown.length) L.push("", `## 달력에 못 적은 것 (사람이 적는다 — data/collect/calendar.json)`, ...day.calendar.unknown.map((u) => `- ${u.what} — ${u.why}`));
  L.push("", `## 출처`, "", `| 곳 | 결과 | 물은 횟수 | 목록 줄 | 창에 든 것 |`, `|---|---|---|---|---|`, ...day.sources.map((s) => `| ${s.name} | ${s.status}${s.why ? ` — ${s.why}` : ""} | ${s.requests} | ${s.rows} | ${s.in_window} |`), "");
  return L.join("\n");
}

// ── 사람이 고른 것 ───────────────────────────────────────────────────────────────────────────────────
export type Picks = { _what: string; date: string; picked: { id: string; form: "긴" | "짧은"; follow?: string | null; note?: string }[]; tomorrow: string[]; picked_by: string | null; picked_at: string | null; memo: string };
export const emptyPicks = (date: string): Picks => ({
  _what: "S-2 · 그날 사람이 고른 것. 사람이 적는다 — 모델 · 코드는 이 파일을 채우지 않는다 (D86: 고르는 것은 사람). picked: 고른 id (같은 폴더 sheet.md 의 번호) · 긴/짧은 · follow (붙일 이야기 code — rate · privacy · price — 가 있으면). tomorrow: 좋은데 넘친 것 (내일 후보에 '어제 넘친 것'으로 다시 뜬다)",
  date, picked: [], tomorrow: [], picked_by: null, picked_at: null, memo: "",
});
/** 고른 것을 D86 에 대 본다 — 알려 줄 뿐 막지 않는다. 카테고리는 모델 추천에 있는 것만 안다 */
export function checkPicks(p: Picks, day: Day, out: RecommendOut | null): string[] {
  const ids = new Set(day.candidates.map((c) => c.id));
  const say: string[] = [];
  for (const x of [...p.picked.map((k) => k.id), ...p.tomorrow]) if (!ids.has(x)) say.push(`${x} — 오늘 후보에 없는 id`);
  const long = p.picked.filter((k) => k.form === "긴").length;
  say.push(`고른 것 ${p.picked.length} (긴 ${long} · 짧은 ${p.picked.length - long})${p.tomorrow.length ? ` · 내일로 ${p.tomorrow.length}` : ""} — 개수는 약속이 아니다`);
  if (long > 2) say.push(`긴 이야기 ${long} — D86 은 0 ~ 2`);
  const cat = new Map<Category, string[]>();
  for (const k of p.picked) { const r = out?.recommended.find((x) => x.id === k.id); if (r) cat.set(r.category, [...(cat.get(r.category) ?? []), k.id]); }
  for (const [c, xs] of cat) if (xs.length > 2) say.push(`${c} ${xs.length}편 (${xs.join(" · ")}) — 한 카테고리 하루 최대 2 · 넘친 것은 tomorrow 로`);
  const unknown = p.picked.filter((k) => ids.has(k.id) && !out?.recommended.some((x) => x.id === k.id)).map((k) => k.id);
  if (unknown.length) say.push(`${unknown.join(" · ")} — 추천 밖에서 골랐다 (카테고리를 몰라 상한은 못 봤다)`);
  if (!p.picked.some((k) => day.candidates.find((c) => c.id === k.id)?.origin === "해외")) say.push(`해외 0 — 약하면 비워도 된다 (한 주로 본다)`);
  return say;
}
