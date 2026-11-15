// P-T2 — 권리 갈래 하나 더하기 (기관의 재사용 허락: 출처 표시 · 글을 바꾸지 않음 — D109) · 문서의 토막만 구절로 (살아 있는 웹 쪽 · 영어판).
// 더하기만이다 — 기존 발행처 · 문서의 판정과 한국어 보도자료의 구절 끊기는 그대로여야 한다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { REUSE_CITED_UNALTERED, STORABLE, canStore, registryRow, rightsOf } from "../src/rights.ts";
import { load, passagesOf } from "../src/short.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

describe("P-T2 권리 — 재사용 허락 (출처 표시 · 글을 바꾸지 않음)", () => {
  it("Garante 는 새 갈래다 — git 에 둘 수 있다 · 근거 문장 · 조건 주소 · 본 날이 있다", () => {
    expect(rightsOf("garanteprivacy.it")).toBe("REUSE_CITED_UNALTERED");
    expect(canStore("REUSE_CITED_UNALTERED")).toBe(true);
    const g = REUSE_CITED_UNALTERED["garanteprivacy.it"]!;
    expect(g.basis).toContain("I contenuti possono essere riutilizzati citando la fonte");
    expect(g.basis).toContain("Il testo non va alterato");
    expect(g.terms_url).toMatch(/^https:\/\/www\.garanteprivacy\.it\//);
    expect(g.seen_at).toBe("2026-11-15");
  });
  it("발행처 행 — 보관 · 인용 · 출처 표시는 참 · 변경은 거짓 · 조건이 말하지 않는 칸은 null", () => {
    const r = registryRow("garanteprivacy.it", "2026-11-15", "x");
    expect(r).toMatchObject({ can_store: true, can_quote: true, can_transform: false, attribution_required: true, commercial_use: null, can_ingest: null, last_reviewed_at: "2026-11-15" });
    expect(r.terms_url).toBe(REUSE_CITED_UNALTERED["garanteprivacy.it"]!.terms_url);
    expect(r.basis).toContain("Il testo non va alterato");
  });
  it("기존 판정은 그대로다 — 발행처마다 · 저장된 사건의 문서마다", () => {
    expect(rightsOf("federalreserve.gov")).toBe("US_FEDERAL_17USC105");
    expect(rightsOf("ftc.go.kr")).toBe("KOGL_TYPE1");
    expect(rightsOf("law.go.kr")).toBe("KR_STATUTE");
    for (const p of ["pipc.go.kr", "korea.kr", "news.coupang.com", "cmegroup.com", "garante.example"]) expect(rightsOf(p), p).toBe("UNCONFIRMED");
    expect(STORABLE.slice(0, 3)).toEqual(["US_FEDERAL_17USC105", "KOGL_TYPE1", "KR_STATUTE"]);
    // 앞선 사건 다섯의 기록 — 새 갈래로 읽히는 문서가 없고, 발행처의 판정이 기록과 같다 (문서 단위 권리가 없는 문서)
    for (const code of ["ACRC-20261028-LICENSE-NOTICE", "FOMC-20261028", "KDCA-20261109-OBESITY", "KFTC-20261029-DELIVERY-APPS", "PIPC-20261028-SAFETY-MEASURES"]) {
      const pack = readJson<{ items: { label: string; publisher: string; doc_rights?: unknown }[] }>(`packages/pipeline/data/events/${code}/pack.json`);
      const rec = readJson<{ documents: { label: string; rights: string }[] }>(`packages/pipeline/data/events/${code}/fetch.json`);
      for (const d of rec.documents) {
        expect(d.rights, `${code} ${d.label}`).not.toBe("REUSE_CITED_UNALTERED");
        const it0 = pack.items.find((i) => i.label === d.label)!;
        if (!it0.doc_rights) expect(rightsOf(it0.publisher), `${code} ${d.label}`).toBe(d.rights);
      }
    }
  });
  it("실물 — Garante 보도자료는 바꾸지 않은 글로 git 에 있고 발행처 행이 보관을 말한다", () => {
    const dir = "packages/pipeline/data/events/GPDP-20261114-META-GALLERY";
    const rec = readJson<{ documents: { label: string; rights: string; text_in: string; fetch: { raw_sha256: string } }[] }>(`${dir}/fetch.json`).documents[0]!;
    expect(rec).toMatchObject({ label: "GPDP-10321080", rights: "REUSE_CITED_UNALTERED", text_in: "store.documents.json" });
    expect(rec.fetch.raw_sha256).toBe("96d88c8f57cc26c49dafe12ed18af67180801e96e4e287309b43a35bf5c35270");   // S-3 가 받아 둔 바이트 — 다시 받지 않았다
    const store = readJson<{ source_registry: { source: string; can_store: boolean | null; can_transform: boolean | null }[] }>(`${dir}/store.json`);
    expect(store.source_registry).toHaveLength(1);
    expect(store.source_registry[0]).toMatchObject({ source: "garanteprivacy.it", can_store: true, can_transform: false });
  });
});

describe("P-T2 구절 — 문서의 토막만 (docs.*.part)", () => {
  const text = ["메뉴", "Italiano. Testo che non serve.", "_______", "Title of the release", "First sentence about €805 million. Second sentence follows it.", "The checks revealed that:", "- one thing;", "Rome, 14 November 2026", "Scheda", "Footer line that is long enough"].join("\n");
  it("after 다음 줄부터 before 앞까지 · 줄마다 한 토막 · 라틴 문장 끝에서 끊는다 · 글자와 자리는 그대로", () => {
    const ps = passagesOf(text, "D", "s", { after: "_______", before: "Scheda" });
    expect(ps.map((p) => p.quote)).toEqual(["Title of the release", "First sentence about €805 million.", "Second sentence follows it.", "The checks revealed that:", "- one thing;", "Rome, 14 November 2026"]);
    const cps = [...text];
    for (const p of ps) expect(cps.slice(p.span_start, p.span_end).join("")).toBe(p.quote);
  });
  it("part 가 없으면 전과 같다 — 옛 실물 (license-notice)의 구절 18 · part 의 줄이 문서에 없으면 구절이 없다", () => {
    expect(load("license-notice").passages.size).toBe(18);
    expect(passagesOf(text, "D", "s", { after: "없는 줄", before: "Scheda" })).toEqual([]);
  });
  it("실물 — meta-gallery 의 구절은 영어판 토막뿐이고 뒤집기를 받치는 문장이 한 토막이다", () => {
    const x = load("meta-gallery");
    const qs = [...x.passages.values()].map((p) => p.quote);
    expect(qs[0]).toBe("The Garante has fined Meta Platforms Ireland Limited 805 million euros");
    expect(qs.at(-1)).toBe("Rome, 14 November 2026");
    expect(qs).toContain("Any access to the information it contains therefore requires free and informed consent, regardless of whether the data is transmitted or any harm occurs.");
    expect(qs).toContain("The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies.");
    expect(qs.some((q) => /Il Garante|Scheda|Salta/.test(q))).toBe(false);
    const doc = [...x.texts.values()][0]!, cps = [...doc];
    for (const p of x.passages.values()) expect(cps.slice(p.span_start, p.span_end).join("")).toBe(p.quote);
  });
});
