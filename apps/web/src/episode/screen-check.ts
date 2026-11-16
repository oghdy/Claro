// 화면 칸 (kit/types 의 ScreenSlots — news · veil · burst · 계약에 없는 손 칸)의 검사 — **한 곳이다** (L-1).
// 실제 화면의 것 (lab/episode/check.ts S8 — 이야기 목록의 LongLine.screen)과 로컬 판의 것 (scripts/check-local.ts — local/<code>/screen.json)이 같은 이 함수를 부른다.
//   news  구절 키가 그 회차의 구절에 있다 · 글의 숫자가 그 구절에 있다
//   burst 인용의 구절 키가 있다 · 인용 글이 그 구절을 이은 글자 그대로다 (빈칸 · 따옴표만 무시) · 그 글이 저장된 문서 한 편의 글 안에 그대로 있다 · 머리 · 덧말의 숫자는 그 구절의 수만 · 말한 이 (voice)가 회차에 있다 · 뒤집기가 있는 회차다
//   veil  키가 그 회차 사슬의 **멈춘 고리** (reach: none)다 · 가린 말에 숫자가 없다
// 화면 (브라우저)은 이 파일을 읽지 않는다 — 검사 스크립트만 부른다.
import type { Episode } from "@claro/contract";
import { isSteps } from "./kit/frames/LabCard";
import type { ScreenSlots } from "./kit/types";

export interface StoredDocument {
  source_id: string;
  text: string;
}

/** 화면 칸 하나 (이야기 하나의 것)를 그 회차 · 저장된 문서에 대 본다. errors = 틀린 것 (앞에 `S8 <at>` 가 붙는다) · said = 본 것 (한 줄로 이어 찍는다) */
export function screenProblems(ep: Episode, slots: ScreenSlots, documents: readonly StoredDocument[], at: string): { errors: string[]; said: string[] } {
  const errors: string[] = [];
  const said: string[] = [];
  const norm = (x: string) => x.replace(/[“”"]/g, "").replace(/\s+/g, "");
  const nums = (x: string) => (x.replace(/,/g, "").match(/\d+/g) ?? []).map((n) => String(Number(n)));
  const quoteOf = (k: string) => ep.quotes[k]?.quote ?? "";
  const keys = (where: string, src: readonly string[] | undefined) => {
    if (!src?.length) errors.push(`S8 ${at} ${where}: 근거 구절이 없다`);
    for (const k of src ?? []) if (!(k in ep.quotes)) errors.push(`S8 ${at} ${where}: 구절 ${k} 가 이 회차에 없다`);
  };
  const grounded = (where: string, text: string, src: readonly string[] | undefined) => {
    const have = new Set((src ?? []).flatMap((k) => nums(quoteOf(k))));
    for (const n of nums(text)) if (!have.has(n)) errors.push(`S8 ${at} ${where}: 숫자 ${n} 을 받치는 구절이 없다 — "${text}"`);
  };
  if (slots.news) {
    keys("news", slots.news.src);
    grounded("news", slots.news.t, slots.news.src);
    said.push(`news "${slots.news.t}" (${slots.news.src?.join(" + ")})`);
  }
  if (slots.burst) {
    const { quote, label, note } = slots.burst;
    keys("burst.quote", quote.src);
    const joined = norm((quote.src ?? []).map(quoteOf).join(""));
    if (norm(quote.t) !== joined) errors.push(`S8 ${at} burst.quote: 구절 (${quote.src?.join(" + ")})을 이은 글자 그대로가 아니다 — "${quote.t}"`);
    const docIds = new Set((quote.src ?? []).map((k) => ep.docs[ep.quotes[k]?.doc ?? ""]?.source_id));
    const doc = docIds.size === 1 ? documents.find((d) => d.source_id === [...docIds][0]) : undefined;
    if (!doc) errors.push(`S8 ${at} burst.quote: 구절들이 저장된 문서 한 편을 가리키지 않는다`);
    else if (!norm(doc.text).includes(norm(quote.t))) errors.push(`S8 ${at} burst.quote: 저장된 문서 (${doc.source_id})의 글 그대로가 아니다 — 이은 자리가 문서에서 이어져 있지 않다`);
    for (const [where, x] of [["burst.label", label], ["burst.note", note]] as const) grounded(where, x, quote.src);
    if (quote.voice && !(quote.voice in ep.voice_labels)) errors.push(`S8 ${at} burst.quote: 말한 이 "${quote.voice}" 가 이 회차에 없다`);
    if (!ep.solve.entry.flip || !ep.solve.lab) errors.push(`S8 ${at} burst: 체험 · 뒤집기가 없는 회차다 — 화면이 이 칸을 그리지 않는다`);
    said.push(`burst = 구절 ${quote.src?.join(" + ")} 을 이은 글자 그대로${doc ? ` · 문서 ${doc.source_id} 에 그대로 있다` : ""} · 상자 ${slots.burst.box ? "남김" : "없음"}`);
  }
  if (slots.veil) {
    const frames = ep.solve.lab?.frames ?? [];
    const still = frames.flatMap((f) => (f.kind === "chain" ? f.nodes.filter((n) => n.reach === "none").map((n) => n.id) : []));
    if (!isSteps(frames)) errors.push(`S8 ${at} veil: 체험이 사슬 틀이 아니다 — 가릴 고리가 없다`);
    for (const [id, word] of Object.entries(slots.veil)) {
      if (!still.includes(id)) errors.push(`S8 ${at} veil.${id}: 이 회차 사슬의 멈춘 고리 (reach: none — ${still.join(" · ") || "없음"})가 아니다`);
      if (/\d/.test(word)) errors.push(`S8 ${at} veil.${id}: 가린 말에 숫자가 있다 — "${word}"`);
    }
    said.push(`veil ${Object.keys(slots.veil).join(" · ")} (멈춘 고리 ${still.join(" · ")})`);
  }
  return { errors, said };
}
