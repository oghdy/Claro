// 원문 → 글 (P-1). **뽑는 방법은 이 파일 한 곳에만 있다.** 바꾸면 EXTRACTOR 를 올린다 — 같은 입력이면 같은 글 · 같은 해시.
//
//   HTML → 글   htmlparser2 로 읽어 <body> 의 글자만. script · style · noscript · template · svg · iframe · object · head 와 주석은 버린다.
//               블록 요소(p · div · li · h1~h6 · tr · br …)의 경계는 줄바꿈. 표의 한 줄(tr)은 한 줄로, 칸(td · th)은 " | " 로 잇는다.
//               글자 참조(&rsquo; · &nbsp; …)는 풀어서 그 글자로. 인라인 요소(a · span · strong · sup …)는 경계 없이 잇는다.
//               HTML 소스의 줄바꿈 · 탭은 공백이다 (<pre> 안에서만 줄바꿈을 지킨다)
//   PDF  → 글   pdfjs-dist 의 getTextContent. 쪽마다 항목의 글을 잇고, 항목이 줄 끝(hasEOL)이면 줄바꿈. 쪽 사이는 줄바꿈 하나.
//               쪽이 시작하는 글자 위치를 따로 돌려준다 (C-3 의 "3쪽" 과 대 보려고)
//   공백 정리   (둘 다) 줄바꿈이 아닌 모든 공백 글자(NBSP · 탭 · 얇은 공백 …)를 보통 공백으로 → 줄마다 공백 묶음을 하나로 · 앞뒤 공백을 떼고 →
//               빈 줄은 버린다 → 줄은 "\n" 하나로 잇는다. 글 끝에 줄바꿈을 두지 않는다. 유니코드 정규화(NFC 등)는 하지 않는다 — 글자를 바꾸지 않는다
//
// 따옴표 모양 · 대시 · 줄임표는 **바꾸지 않는다.** 원문 글자 그대로다. 구절 맞추기의 규칙은 match.ts (match-rules.json) 에 따로 있다.
import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";

export const EXTRACTOR = "p1-extract/1 (htmlparser2 12.0.0 · pdfjs-dist 6.4.299)";

type Node = { type: string; name?: string; data?: string; children?: Node[] };

const DROP = new Set(["script", "style", "noscript", "template", "svg", "iframe", "object", "head", "canvas", "select", "button"]);
const BLOCK = new Set([
  "address", "article", "aside", "blockquote", "body", "caption", "center", "dd", "details", "dialog", "div", "dl", "dt", "fieldset",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "html", "legend", "li", "main",
  "menu", "nav", "ol", "p", "pre", "section", "summary", "table", "tbody", "tfoot", "thead", "ul",
]);
const NL = "\u0000"; // 블록 경계 표시 — 공백 정리에서 줄바꿈이 된다 (원문에 U+0000 은 없다고 본다. 있으면 tidy 가 지운다)

function walk(n: Node, out: string[], pre = false): void {
  if (n.type === "text") {
    // HTML 글 속의 줄바꿈 · 탭은 공백이다 (화면에 보이는 대로). <pre> 안에서만 줄바꿈을 지킨다
    out.push(pre ? (n.data ?? "") : (n.data ?? "").replace(/[\t\n\r\f]/g, " "));
    return;
  }
  if (n.type === "comment" || n.type === "directive") return;
  const name = (n.name ?? "").toLowerCase();
  if (n.type === "script" || n.type === "style" || DROP.has(name)) return;
  if (name === "br") {
    out.push(NL);
    return;
  }
  if (name === "tr") {
    out.push(NL);
    const cells = (n.children ?? []).filter((c) => c.type === "tag" && ["td", "th"].includes((c.name ?? "").toLowerCase()));
    cells.forEach((c, i) => {
      if (i > 0) out.push(" | ");
      const inner: string[] = [];
      for (const k of c.children ?? []) walk(k, inner, pre);
      out.push(inner.join("").split(NL).join(" ")); // 칸 안의 줄바꿈은 공백 — 한 줄 = 표의 한 줄
    });
    out.push(NL);
    return;
  }
  const block = BLOCK.has(name);
  if (block) out.push(NL);
  for (const c of n.children ?? []) walk(c, out, pre || name === "pre");
  if (block) out.push(NL);
}

/** 공백 정리 — HTML · PDF 공통 */
export function tidy(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .split(NL).join("\n")
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/gu, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function findBody(n: Node): Node | null {
  if (n.type === "tag" && (n.name ?? "").toLowerCase() === "body") return n;
  for (const c of n.children ?? []) {
    const b = findBody(c);
    if (b) return b;
  }
  return null;
}

export function htmlToText(html: string): string {
  const doc = parseDocument(html, { decodeEntities: true, lowerCaseTags: true }) as unknown as Node;
  const root = findBody(doc) ?? doc;
  const out: string[] = [];
  walk(root, out);
  return tidy(out.join(""));
}

export async function pdfToText(bytes: Uint8Array): Promise<{ text: string; pages: number[] }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes.slice(), disableFontFace: true, verbosity: 0 });
  const doc = await task.promise;
  const pageTexts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let s = "";
    for (const it of tc.items) {
      if ("str" in it) s += it.str + (it.hasEOL ? "\n" : "");
    }
    pageTexts.push(tidy(s));
  }
  await task.destroy();
  const pages: number[] = [];
  let text = "";
  for (const t of pageTexts) {
    if (text.length > 0 && t.length > 0) text += "\n";
    pages.push(text.length);
    text += t;
  }
  return { text, pages };
}

/** 응답의 글자 인코딩 — Content-Type 의 charset, 없으면 <meta charset>, 없으면 utf-8 */
export function decodeHtml(bytes: Uint8Array, contentType: string | null): string {
  const fromHeader = /charset=([\w-]+)/i.exec(contentType ?? "")?.[1];
  const head = new TextDecoder("latin1").decode(bytes.slice(0, 4096));
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  const label = (fromHeader ?? fromMeta ?? "utf-8").toLowerCase();
  return new TextDecoder(label).decode(bytes);
}

export function isPdf(bytes: Uint8Array, contentType: string | null): boolean {
  return (contentType ?? "").toLowerCase().includes("application/pdf") || new TextDecoder("latin1").decode(bytes.slice(0, 5)) === "%PDF-";
}

export async function extract(bytes: Uint8Array, contentType: string | null): Promise<{ kind: "HTML" | "PDF"; text: string; pages: number[] | null }> {
  if (isPdf(bytes, contentType)) {
    const r = await pdfToText(bytes);
    return { kind: "PDF", text: r.text, pages: r.pages };
  }
  return { kind: "HTML", text: htmlToText(decodeHtml(bytes, contentType)), pages: null };
}

export const sha256 = (b: Uint8Array | string): string => createHash("sha256").update(b).digest("hex");
