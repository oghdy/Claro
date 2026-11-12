// E3-1 — 세 번째 사건 (개인정보위 과징금). 새로 생긴 길: 공공누리 표시가 사이트가 아니라 문서 안에만 있는 발행처 (발행처는 미확인 그대로 · 본 것을 근거에) · 법령 판 둘 · 고시
// E3-1b — 문서 단위 권리 (D69): 문서 안에 공공누리 제1유형 표시를 본 문서만 git (pack.json doc_rights). 같은 발행처의 다른 문서는 캐시
// B-E2 — 그 권리가 계약 행으로 (store.json document_rights · DATA_MODEL DocumentRights · D70). 해시는 그 행 한 곳 · 발행처 행 근거 글은 문서 이름만
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256 } from "../src/extract.ts";
import { canStore, CHECKED_NOT_STORABLE, docRightsProblems, documentRightsRow, registryRow, rightsOf, rightsOfItem, type DocRights } from "../src/rights.ts";

describe("권리 — pipc.go.kr (E3-1)", () => {
  it("발행처 단위 공공누리 목록에 없다 → 미확인 · git 에 두지 않는다", () => {
    expect(rightsOf("pipc.go.kr")).toBe("UNCONFIRMED");
    expect(canStore(rightsOf("pipc.go.kr"))).toBe(false);
  });
  it("권리 행의 근거가 본 것을 말한다 — 꼬리말 글 · 문서 안 표시 · _open", () => {
    const r = registryRow("pipc.go.kr", "2026-11-11", "x");
    expect(r.can_store).toBeNull();
    expect(r.basis).toContain("All right reserved.");
    expect(r.basis).toContain("E3-1-a");
    expect(CHECKED_NOT_STORABLE["pipc.go.kr"]).toContain("공공누리 제1유형");
  });
  it("문서 단위 권리 — doc_rights 가 있는 문서만 KOGL_TYPE1 · 없는 문서는 발행처의 권리 (E3-1b)", () => {
    const dr = { rights: "KOGL_TYPE1", mark: "m", raw_sha256: "a".repeat(64), page: 1, pages: 2, where: "w", third_party: "t", seen_by: "s", checked_at: "2026-11-12",
      image: { name: "Im1", xref: 1, width: 1, height: 1, filter: "DCTDecode", stream_sha256: "b".repeat(64) } } as DocRights;
    expect(rightsOfItem({ publisher: "pipc.go.kr", doc_rights: dr })).toBe("KOGL_TYPE1");
    expect(rightsOfItem({ publisher: "pipc.go.kr" })).toBe("UNCONFIRMED");
    expect(docRightsProblems({ label: "X", publisher: "pipc.go.kr", doc_rights: dr })).toEqual([]);
    expect(docRightsProblems({ label: "X", publisher: "ftc.go.kr", doc_rights: dr })[0]).toContain("이미 git");
    expect(docRightsProblems({ label: "X", publisher: "pipc.go.kr", doc_rights: { ...dr, rights: "KOGL_TYPE2" as "KOGL_TYPE1" } })[0]).toContain("제1유형만");
    const r = registryRow("pipc.go.kr", "2026-11-11", "x", [{ label: "X", doc_rights: dr }]);
    expect(r.can_store).toBeNull();
    expect(r.basis).toContain("document_rights");
    expect(r.basis).toContain(": X.");
    expect(r.basis).not.toContain("a".repeat(64));      // 해시는 문서 단위 행 한 곳 (B-E2)
    expect(r.last_reviewed_at).toBe("2026-11-12");
  });
  it("B-E2 — doc_rights → 계약의 문서 단위 행: 공공누리 제1유형 칸 다섯이 참 · 다시 확인할 값만 옮긴다 (자리 · 본 방법 · 제3자 글은 목록에)", () => {
    const dr = { rights: "KOGL_TYPE1", mark: "m", raw_sha256: "a".repeat(64), page: 1, pages: 2, where: "w", third_party: "t", seen_by: "s", checked_at: "2026-11-12",
      image: { name: "Im1", xref: 7, width: 3, height: 4, filter: "DCTDecode", stream_sha256: "b".repeat(64) } } as DocRights;
    expect(documentRightsRow("0b2e0000-0000-4000-8000-000000000001", dr)).toEqual({
      source_id: "0b2e0000-0000-4000-8000-000000000001", rights: "KOGL_TYPE1",
      can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true,
      basis: { bytes_sha256: "a".repeat(64), page: 1, pages: 2, image: "Im1 객체 7 · 3×4 · DCTDecode", image_sha256: "b".repeat(64), seen: "m" },
      last_reviewed_at: "2026-11-12",
    });
  });
  it("법령 행은 고시 · 별표도 말한다 (저작권법 제7조)", () => {
    const l = registryRow("law.go.kr", "2026-11-11", "x");
    expect(l.basis).toContain("저작권법 제7조");
    expect(l.basis).toContain("고시");
  });
});

describe("사건 폴더 PIPC-20261028-SAFETY-MEASURES", () => {
  const dir = new URL("../data/events/PIPC-20261028-SAFETY-MEASURES/", import.meta.url);
  const pack = JSON.parse(readFileSync(new URL("pack.json", dir), "utf8"));
  const docs = JSON.parse(readFileSync(new URL("store.documents.json", dir), "utf8"));
  const rec = JSON.parse(readFileSync(new URL("fetch.json", dir), "utf8"));
  const store = JSON.parse(readFileSync(new URL("store.json", dir), "utf8"));
  const inRepo = new Map(docs.source_documents.map((d: { source_id: string; text: string }) => [d.source_id, d.text]));

  it("git 에 든 원문 = 법령 (law.go.kr) + 문서 안 표시를 본 개인정보위 문서만 · 해시 = 기록", () => {
    const items = new Map(pack.items.map((i: { label: string }) => [i.label, i]));
    for (const d of rec.documents) {
      const marked = !!(items.get(d.label) as { doc_rights?: DocRights }).doc_rights;
      expect(inRepo.has(d.source_id), d.label).toBe(d.publisher === "law.go.kr" || marked);
      if (inRepo.has(d.source_id)) expect(sha256(inRepo.get(d.source_id) as string), d.label).toBe(d.text_sha256);
    }
  });
  it("E3-1b — (i) 표시를 본 PDF 셋만 git (표시를 본 바이트 = 받은 바이트) (ii) 같은 발행처의 게시물 · 일정 페이지는 캐시 · 발행처 행은 null 그대로", () => {
    const pipc = pack.items.filter((i: { publisher: string }) => i.publisher === "pipc.go.kr") as { label: string; doc_rights?: DocRights }[];
    const where = (label: string) => rec.documents.find((x: { label: string }) => x.label === label);
    expect(pipc.filter((i) => i.doc_rights).map((i) => i.label).sort()).toEqual(["PR-1029-PDF", "SL-SKT-0828", "SL-STATS-0515"]);
    for (const i of pipc) {
      const d = where(i.label);
      expect(d.text_in, i.label).toBe(i.doc_rights ? "store.documents.json" : "cache");
      expect(d.rights, i.label).toBe(i.doc_rights ? "KOGL_TYPE1" : "UNCONFIRMED");
      if (i.doc_rights) expect(i.doc_rights.raw_sha256, i.label).toBe(d.fetch.raw_sha256);
      expect(docRightsProblems({ publisher: "pipc.go.kr", ...i }), i.label).toEqual([]);
    }
    const row = store.source_registry.find((r: { source: string }) => r.source === "pipc.go.kr");
    expect(row.can_store).toBeNull();
    for (const i of pipc.filter((x) => x.doc_rights)) expect(row.basis, i.label).toContain(i.label);
    for (const l of ["PR-1029 ", "SL-FINE-1204", "M21-AGENDA"]) expect(row.basis).not.toContain(l);
  });
  it("B-E2 — store.json document_rights = 표시를 본 PDF 셋의 계약 행 (doc_rights 그대로 옮김 · 받은 바이트 = 기록) · 게시물 · 일정 페이지에는 행이 없다", () => {
    const sid = (label: string) => rec.documents.find((x: { label: string }) => x.label === label).source_id as string;
    const marked = pack.items.filter((i: { doc_rights?: DocRights }) => i.doc_rights) as { label: string; doc_rights: DocRights }[];
    expect(store.document_rights).toEqual(marked.map((i) => documentRightsRow(sid(i.label), i.doc_rights)));
    for (const i of marked) expect(store.document_rights.find((r: { source_id: string }) => r.source_id === sid(i.label)).basis.bytes_sha256, i.label)
      .toBe(rec.documents.find((x: { label: string }) => x.label === i.label).fetch.raw_sha256);
    for (const l of ["PR-1029", "SL-FINE-1204", "M21-AGENDA"]) expect(store.document_rights.some((r: { source_id: string }) => r.source_id === sid(l)), l).toBe(false);
  });
  it("B-E2 — 문서 단위 권리가 없는 사건 (FOMC · KFTC) 의 store.json 에는 document_rights 칸이 없다 (산출물 그대로)", () => {
    for (const code of ["FOMC-20261028", "KFTC-20261029-DELIVERY-APPS"]) {
      const s = JSON.parse(readFileSync(new URL(`../data/events/${code}/store.json`, import.meta.url), "utf8"));
      expect("document_rights" in s, code).toBe(false);
    }
  });
  it("Event 하나 · 의결일 · 목록 = Source (못 가져온 것 없음)", () => {
    expect(store.events).toHaveLength(1);
    expect(store.events[0].occurred_at).toBe("2026-10-28");
    expect(store.sources).toHaveLength(pack.items.length);
  });
  it("법률은 두 판 — 위반 기간 (2024-03-15 시행) · 의결일 (2026-09-11 시행). 면책 단서는 두 판 모두에", () => {
    const text = (label: string) => inRepo.get(rec.documents.find((x: { label: string }) => x.label === label).source_id) as string;
    expect(text("LAW-PIPA-2024")).toContain("[시행 2024. 3. 15.]");
    expect(text("LAW-PIPA")).toContain("[시행 2026. 9. 11.]");
    for (const l of ["LAW-PIPA-2024", "LAW-PIPA"]) expect(text(l), l).toContain("안전성 확보에 필요한 조치를 다한 경우에는 그러하지 아니하다");
    expect(text("LAW-PIPA-2024")).not.toContain("100분의 10을 초과하지 아니하는 범위");
    expect(text("LAW-PIPA")).toContain("100분의 10을 초과하지 아니하는 범위");
  });
});
