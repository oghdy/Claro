// 런타임 검증기 — 프론트가 받은 패키지를 믿고 그려도 되는지 본다.
//
// 확인하는 것 = §9 불변식 중 프론트가 믿고 쓰는 것
//   1  levels 1~3, id 어휘 · 겹침 · 순서, slides ≥ 1, blocks ≥ 1
//   2  open_questions.length == slides.length − 1, text 비어 있지 않음
//   3  다른 슬라이드를 가리키는 필드 없음 — 계약에 없는 필드는 전부 실패라서 함께 잡힌다
//   4  모든 블록에 type · text, 원형이면 text == linearize(block)
//   6  모든 span 에 layer (5개 중 하나), refs 는 그 층의 Ref 목록 — concept 층은 ConceptRef { concept_id, version, part },
//      나머지 층은 UUID 문자열 (DATA_MODEL §2.2 · CONCEPT_IDENTITY §3.2). 모양만 본다
//   7  인라인 서식은 <b> 와 \n 뿐, <b> 는 span 을 넘지 않는다
//   8  emphasized 항목을 <b> 로 통째 감싸지 않는다
//
// 확인하지 않는 것
//   5  원형 목록 밖 type — 실패가 아니라 경고. 프론트는 text 로 그린다 (§7.9 · D14)
//   6  refs 개수 · 가리킨 것이 있는가 — 프론트는 layer 만 읽는다(§6.2). 백엔드 발행 검사가 본다
//   9  시간 필드 — 계약에 없는 필드는 3 에서 이미 실패
//   10 `_` 필드 — 픽스처 주석이다. 무시하고, 돌려주는 패키지에서는 뺀다
import { inlineFormatProblem } from "./inline";
import { linearize } from "./linearize";
import {
  BLOCK_TYPES,
  LAYERS,
  LEVEL_IDS,
  WEIGHTS,
  type ArticlePackage,
  type Block,
} from "./types";

export interface Issue {
  code: string;
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; pkg: ArticlePackage; warnings: Issue[] }
  | { ok: false; errors: Issue[]; warnings: Issue[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** ConceptRef 의 모양 — 필드 셋이 정확히 있고 다른 필드는 없다 */
function isConceptRef(r: unknown): boolean {
  if (!isObj(r)) return false;
  const keys = Object.keys(r);
  return (
    keys.length === 3 &&
    typeof r.concept_id === "string" &&
    !!r.concept_id &&
    typeof r.version === "number" &&
    Number.isInteger(r.version) &&
    r.version >= 1 &&
    (r.part === null || (typeof r.part === "string" && !!r.part))
  );
}

/** `_` 로 시작하는 필드를 전부 뺀 사본 (§9-10) */
export function stripAnnotations<T>(v: T): T {
  if (Array.isArray(v)) return v.map(stripAnnotations) as T;
  if (isObj(v)) {
    const out: Obj = {};
    for (const [k, x] of Object.entries(v)) if (!k.startsWith("_")) out[k] = stripAnnotations(x);
    return out as T;
  }
  return v;
}

// 개체별 [허용 필드, 필수 필드] — `_` 필드는 여기 오기 전에 빠진다
const KEYS: Record<string, [string[], string[]]> = {
  package: [["event_ref", "title", "lang", "published_at", "levels"], ["event_ref", "title", "lang", "published_at", "levels"]],
  level: [["id", "slides", "open_questions"], ["id", "slides", "open_questions"]],
  slide: [["kicker", "headline", "blocks"], ["kicker", "headline", "blocks"]],
  oq: [["text"], ["text"]],
  span: [["text", "layer", "refs"], ["text", "layer", "refs"]],
  prose: [["type", "text", "paragraphs"], ["type", "text", "paragraphs"]],
  para: [["body", "weight"], ["body", "weight"]],
  quote: [["type", "text", "attribution", "body"], ["type", "text", "attribution", "body"]],
  list: [["type", "text", "ordered", "items"], ["type", "text", "ordered", "items"]],
  listitem: [["label", "body", "emphasized"], ["body"]],
  contrast: [["type", "text", "items"], ["type", "text", "items"]],
  citem: [["label", "value", "body", "emphasized"], ["label"]],
  sheet: [["type", "text", "rows"], ["type", "text", "rows"]],
  row: [["label", "value"], ["label", "value"]],
};

export function validateArticlePackage(input: unknown): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const E = (code: string, path: string, message: string) => errors.push({ code, path, message });
  const W = (code: string, path: string, message: string) => warnings.push({ code, path, message });

  const doc = stripAnnotations(input);

  function keys(o: unknown, kind: string, path: string): o is Obj {
    if (!isObj(o)) {
      E("SCHEMA_TYPE", path, `객체가 아니다 (${kind})`);
      return false;
    }
    const [allowed, required] = KEYS[kind]!;
    for (const k of Object.keys(o)) {
      if (!allowed.includes(k)) E("SCHEMA_KEY", `${path}/${k}`, `계약에 없는 필드 (${kind})`);
    }
    const miss = required.filter((k) => !(k in o));
    if (miss.length) E("SCHEMA_MISSING", path, `필수 필드 없음 ${miss.join(", ")} (${kind})`);
    return miss.length === 0;
  }

  function plain(v: unknown, path: string, what: string) {
    if (typeof v !== "string" || !v.trim()) E("STRING_EMPTY", path, `${what} 이 비었거나 문자열이 아니다`);
    else if (v.includes("<") || v.includes(">")) E("INLINE_FORMAT", path, `${what} 에 태그가 있다 — 표시 문자열 하나여야 한다`);
  }

  function rich(v: unknown, path: string) {
    if (!Array.isArray(v) || v.length === 0) {
      E("RICHTEXT_EMPTY", path, "RichText 가 비었거나 배열이 아니다");
      return;
    }
    v.forEach((sp, i) => span(sp, `${path}/${i}`));
  }

  function span(sp: unknown, path: string) {
    if (!keys(sp, "span", path)) return;
    const { text, layer, refs } = sp;
    if (typeof text !== "string" || !text) E("SPAN_EMPTY", path, "span text 가 비었다");
    else {
      const p = inlineFormatProblem(text);
      if (p) E(p.includes("넘는다") ? "BOLD_CROSSES_SPAN" : "INLINE_FORMAT", path, `${p} — ${JSON.stringify(text.slice(0, 30))}`);
    }
    if (!(LAYERS as readonly unknown[]).includes(layer)) E("SPAN_LAYER", path, `layer=${JSON.stringify(layer)}`);
    if (!Array.isArray(refs)) E("SPAN_REFS", path, "refs 가 목록이 아니다");
    else if (layer === "concept") {
      if (!refs.every(isConceptRef)) E("SPAN_REFS", path, "concept 층의 Ref 는 ConceptRef { concept_id, version, part } 다 (CONCEPT_IDENTITY §3.2)");
    } else if (refs.some((r) => typeof r !== "string" || !r))
      E("SPAN_REFS", path, `${String(layer)} 층의 Ref 는 UUID 문자열 하나다 (DATA_MODEL §2.2)`);
  }

  function emphasized(it: Obj, fields: string[], path: string) {
    if ("emphasized" in it && it.emphasized !== true) E("SCHEMA_KEY", `${path}/emphasized`, "true 만 허용");
    if (it.emphasized !== true) return;
    for (const f of fields) {
      const v = it[f];
      if (!Array.isArray(v) || !v.length) continue;
      const t = v.map((s) => (isObj(s) && typeof s.text === "string" ? s.text : "")).join("").trim();
      if (/^<b>(?:(?!<\/?b>)[\s\S])*<\/b>$/.test(t))
        E("EMPHASIZED_DOUBLE", `${path}/${f}`, "emphasized 항목을 <b> 로 통째 감쌌다 — 강조를 두 번 적었다 (§9-8)");
    }
  }

  function block(b: unknown, path: string) {
    if (!isObj(b)) {
      E("SCHEMA_TYPE", path, "블록이 객체가 아니다");
      return;
    }
    if (typeof b.type !== "string" || !b.type) {
      E("BLOCK_TYPE", path, "type 이 없다 (§9-4)");
      return;
    }
    if (typeof b.text !== "string" || !b.text) {
      E("BLOCK_NO_TEXT", path, "text 가 없다 (§9-4)");
      return;
    }
    if (!(BLOCK_TYPES as readonly string[]).includes(b.type)) {
      // §7.9 — 모르는 원형은 text 로 그린다. 그 text 도 서식 규칙은 지켜야 그릴 수 있다
      W("BLOCK_TYPE_UNKNOWN", path, `원형 목록 밖 type=${JSON.stringify(b.type)} — text 로 그린다 (§7.9)`);
      const p = inlineFormatProblem(b.text);
      if (p) E("INLINE_FORMAT", `${path}/text`, p);
      return;
    }
    const before = errors.length;
    if (!keys(b, b.type, path)) return;
    switch (b.type) {
      case "prose":
        if (!Array.isArray(b.paragraphs) || !b.paragraphs.length) E("SCHEMA_MISSING", path, "paragraphs 가 비었다");
        else
          b.paragraphs.forEach((p, j) => {
            const pp = `${path}/paragraphs/${j}`;
            if (!keys(p, "para", pp)) return;
            if (!(WEIGHTS as readonly unknown[]).includes(p.weight)) E("SCHEMA_KEY", `${pp}/weight`, `weight=${JSON.stringify(p.weight)}`);
            rich(p.body, `${pp}/body`);
          });
        break;
      case "quote":
        plain(b.attribution, `${path}/attribution`, "attribution");
        rich(b.body, `${path}/body`);
        break;
      case "list":
        if (typeof b.ordered !== "boolean") E("SCHEMA_TYPE", `${path}/ordered`, "불리언이 아니다");
        if (!Array.isArray(b.items) || !b.items.length) E("SCHEMA_MISSING", path, "items 가 비었다");
        else
          b.items.forEach((it, j) => {
            const ip = `${path}/items/${j}`;
            if (!keys(it, "listitem", ip)) return;
            if ("label" in it) rich(it.label, `${ip}/label`);
            rich(it.body, `${ip}/body`);
            emphasized(it, ["label", "body"], ip);
          });
        break;
      case "contrast":
        if (!Array.isArray(b.items) || !b.items.length) E("SCHEMA_MISSING", path, "items 가 비었다");
        else
          b.items.forEach((it, j) => {
            const ip = `${path}/items/${j}`;
            if (!keys(it, "citem", ip)) return;
            if (!("value" in it) && !("body" in it)) E("SCHEMA_MISSING", ip, "value 와 body 중 하나 이상");
            for (const f of ["label", "value", "body"]) if (f in it) rich(it[f], `${ip}/${f}`);
            emphasized(it, ["value", "body"], ip);
          });
        break;
      case "sheet":
        if (!Array.isArray(b.rows) || !b.rows.length) E("SCHEMA_MISSING", path, "rows 가 비었다");
        else
          b.rows.forEach((r, j) => {
            const rp = `${path}/rows/${j}`;
            if (!keys(r, "row", rp)) return;
            rich(r.label, `${rp}/label`);
            rich(r.value, `${rp}/value`);
          });
        break;
    }
    // 4 — 구조가 온전할 때만 선형화한다
    if (errors.length === before) {
      const want = linearize(b as unknown as Block);
      if (b.text !== want)
        E("TEXT_MISMATCH", path, `text != linearize(block)\n  text      ${JSON.stringify(b.text)}\n  linearize ${JSON.stringify(want)}`);
    }
  }

  if (!keys(doc, "package", "")) return { ok: false, errors, warnings };
  if (doc.lang !== "ko") E("SCHEMA_KEY", "/lang", `lang=${JSON.stringify(doc.lang)}`);
  plain(doc.title, "/title", "title");
  if (typeof doc.event_ref !== "string" || !doc.event_ref) E("SCHEMA_TYPE", "/event_ref", "event_ref 가 비었다");
  if (typeof doc.published_at !== "string" || !doc.published_at) E("SCHEMA_TYPE", "/published_at", "published_at 이 비었다");

  const levels = doc.levels;
  // 1
  if (!Array.isArray(levels) || levels.length < 1 || levels.length > 3) {
    E("LEVELS_COUNT", "/levels", "levels 는 1~3개여야 한다");
    return { ok: false, errors, warnings };
  }
  const ids = levels.map((lv) => (isObj(lv) ? lv.id : undefined));
  const ordered = LEVEL_IDS.filter((i) => ids.includes(i));
  if (ids.some((i) => !(LEVEL_IDS as readonly unknown[]).includes(i)) || new Set(ids).size !== ids.length || ordered.join() !== ids.join())
    E("LEVEL_ID", "/levels", `레벨 id ${JSON.stringify(ids)} — basic · intermediate · advanced 중, 겹치지 않고 그 순서 (§9-1)`);

  levels.forEach((lv, li) => {
    const lp = `/levels/${li}`;
    if (!keys(lv, "level", lp)) return;
    const { slides, open_questions: oqs } = lv;
    if (!Array.isArray(slides) || !slides.length) {
      E("SLIDES_EMPTY", `${lp}/slides`, "slides 가 비었다 (§9-1)");
      return;
    }
    // 2
    if (!Array.isArray(oqs) || oqs.length !== slides.length - 1)
      E("OQ_LENGTH", `${lp}/open_questions`, `길이는 slides.length − 1 = ${slides.length - 1} 이어야 한다 (D15 QA①)`);
    if (Array.isArray(oqs))
      oqs.forEach((oq, i) => {
        const op = `${lp}/open_questions/${i}`;
        if (keys(oq, "oq", op)) plain(oq.text, `${op}/text`, "open_question text");
      });
    slides.forEach((s, si) => {
      const sp = `${lp}/slides/${si}`;
      if (!keys(s, "slide", sp)) return;
      plain(s.kicker, `${sp}/kicker`, "kicker");
      rich(s.headline, `${sp}/headline`);
      if (!Array.isArray(s.blocks) || !s.blocks.length) E("BLOCKS_EMPTY", `${sp}/blocks`, "blocks 가 비었다 (§9-1)");
      else s.blocks.forEach((b, bi) => block(b, `${sp}/blocks/${bi}`));
    });
  });

  if (errors.length) return { ok: false, errors, warnings };
  return { ok: true, pkg: doc as unknown as ArticlePackage, warnings };
}

/** 검증을 통과한 패키지를 돌려주고, 아니면 모든 위반을 담아 던진다 */
export function parseArticlePackage(input: unknown): ArticlePackage {
  const r = validateArticlePackage(input);
  if (!r.ok) {
    const lines = r.errors.map((e) => `  ${e.code} ${e.path}: ${e.message}`).join("\n");
    throw new Error(`ArticlePackage 계약 위반 ${r.errors.length}건\n${lines}`);
  }
  return r.pkg;
}
