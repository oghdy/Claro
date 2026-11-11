// E3-1 — 세 번째 사건 (개인정보위 과징금). 새로 생긴 길: 공공누리 표시가 사이트가 아니라 문서 안에만 있는 발행처 (발행처는 미확인 그대로 · 본 것을 근거에) · 법령 판 둘 · 고시
// E3-1b — 문서 단위 권리 (D69): 문서 안에 공공누리 제1유형 표시를 본 문서만 git (pack.json doc_rights). 같은 발행처의 다른 문서는 캐시
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256 } from "../src/extract.ts";
import { canStore, CHECKED_NOT_STORABLE, docRightsProblems, registryRow, rightsOf, rightsOfItem, type DocRights } from "../src/rights.ts";

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
    expect(r.basis).toContain("X (받은 바이트 sha256 " + "a".repeat(64));
    expect(r.last_reviewed_at).toBe("2026-11-12");
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
    for (const i of pipc.filter((x) => x.doc_rights)) {
      expect(row.basis, i.label).toContain(i.label);
      expect(row.basis, i.label).toContain(i.doc_rights!.image.stream_sha256);
    }
    for (const l of ["PR-1029", "SL-FINE-1204", "M21-AGENDA"]) expect(row.basis).not.toContain(`${l} (`);
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
