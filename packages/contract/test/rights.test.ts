// 문서 단위 권리 (B-E2 · DATA_MODEL §4.4 · 불변식 35 · 36 · D70). 실물: 개인정보위 — 발행처 행은 미확인 (null) · 보도자료 PDF 안에 공공누리 제1유형 표시
// 값은 PIPC-20261028-SAFETY-MEASURES 의 실물 (store.json 의 pipc.go.kr 행 · PR-1029-PDF 의 문서 단위 행) 그대로 — source_id 만 시험용
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { documentRightsProblems, documentRightsTableProblems, sourceRights, type DocumentRights, type SourceRegistry } from "../src";

const PDF = { source_id: "0b2e0000-0000-4000-8000-000000000001", publisher: "pipc.go.kr" };      // PR-1029-PDF — 표시를 봤다
const PAGE = { source_id: "0b2e0000-0000-4000-8000-000000000002", publisher: "pipc.go.kr" };     // PR-1029 게시물 페이지 — 같은 발행처 · 표시 없음
const LAW = { source_id: "0b2e0000-0000-4000-8000-000000000003", publisher: "law.go.kr" };

const pipc: SourceRegistry = {
  source: "pipc.go.kr", access_method: "공개 웹 페이지 — HTTP GET", can_ingest: null, can_store: null, can_quote: null, can_transform: null,
  commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: "2026-11-12", basis: "권리 미확인 (발행처 단위) — …",
};
const law: SourceRegistry = { ...pipc, source: "law.go.kr", can_store: true, can_quote: true, basis: "저작권법 제7조 — …" };
const row: DocumentRights = {
  source_id: PDF.source_id, rights: "KOGL_TYPE1",
  can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true,
  basis: {
    bytes_sha256: "ce98046efbca01f1f81b4792b153ad70e0c7f878bd4e647fbb2ad2762887b460", page: 4, pages: 5, image: "Im5 객체 47 · 167×64 · DCTDecode",
    image_sha256: "30fd9bd9851fbef6d2f77cef7b68359263042491db86c7b7dbfbad8786cda851",
    seen: "공공누리 제1유형 그림 — 'OPEN' 과 칸 하나 (사람 모양 · '출처표시')",
  },
  last_reviewed_at: "2026-11-12",
};
const reg = [pipc, law];

describe("문서 단위 권리 — 그 문서에 한해 발행처 행보다 앞선다 (불변식 36)", () => {
  it("문서 행이 있는 문서만 저장 · 인용할 수 있다 — 권리 칸 다섯이 참, can_ingest 는 발행처 행", () => {
    const r = sourceRights(PDF, reg, [row]);
    expect(r).toEqual({ can_ingest: null, can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true, by: "DOCUMENT" });
  });
  it("같은 발행처의 다른 문서는 여전히 막힌다 — 발행처 행 (null) 그대로", () => {
    const r = sourceRights(PAGE, reg, [row]);
    expect(r.by).toBe("PUBLISHER");
    expect([r.can_store, r.can_quote]).toEqual([null, null]);
  });
  it("문서 행이 없으면 아무것도 바뀌지 않는다 (다른 발행처 · 다른 사건)", () => {
    expect(sourceRights(PDF, reg, [])).toMatchObject({ can_store: null, can_quote: null, by: "PUBLISHER" });
    expect(sourceRights(LAW, reg, [row])).toMatchObject({ can_store: true, can_quote: true, can_transform: null, by: "PUBLISHER" });
    expect(sourceRights({ ...LAW, publisher: "nowhere.example" }, reg, [])).toMatchObject({ can_store: null, by: null });
  });
  it("칸마다 — 문서 행의 값이 발행처 행의 값을 이긴다 (거짓도). null 이면 발행처 행", () => {
    const strict: SourceRegistry = { ...pipc, can_quote: false, can_ingest: true, basis: "시험" };
    expect(sourceRights(PDF, [strict], [row])).toMatchObject({ can_quote: true, can_ingest: true, by: "DOCUMENT" });
  });
});

describe("문서 행의 칸 · 근거 (불변식 35) — 어긋난 행은 아무것도 허락하지 않는다", () => {
  it("실물 모양은 통과한다", () => {
    expect(documentRightsProblems(row)).toEqual([]);
    expect(documentRightsTableProblems([row], new Set([PDF.source_id]))).toEqual([]);
  });
  it("basis 가 없으면 거부 — 그 문서도 발행처 행으로 돌아간다", () => {
    const bad = { ...row, basis: null } as unknown as DocumentRights;
    expect(documentRightsProblems(bad).join(" ")).toContain("basis 가 없다");
    expect(sourceRights(PDF, reg, [bad])).toMatchObject({ can_store: null, can_quote: null, by: "PUBLISHER" });
  });
  it.each([
    ["받은 바이트 해시 없음", { bytes_sha256: "" }],
    ["그림 해시가 sha256 이 아니다", { image_sha256: "30fd9bd9851f" }],
    ["쪽이 쪽 수보다 크다", { page: 6 }],
    ["쪽이 0", { page: 0 }],
    ["그림 이름 없음", { image: "" }],
    ["본 것 없음", { seen: " " }],
  ])("basis — %s", (_name, change) => {
    const bad = { ...row, basis: { ...row.basis, ...change } };
    expect(documentRightsProblems(bad)).not.toEqual([]);
    expect(sourceRights(PDF, reg, [bad]).by).toBe("PUBLISHER");
  });
  it("basis 의 칸이 빠졌다", () => {
    const { image_sha256: _i, ...basis } = row.basis;
    expect(documentRightsProblems({ ...row, basis }).join(" ")).toContain('"image_sha256" 이 없다');
  });
  it("근거가 말하는 칸 — 공공누리 제1유형인데 변경 불가 · 칸이 null 이면 거부 (D53)", () => {
    expect(documentRightsProblems({ ...row, can_transform: false })).toHaveLength(1);
    expect(documentRightsProblems({ ...row, attribution_required: null })).toHaveLength(1);
  });
  it("다른 표시 (공공누리 제2유형) · 본 날 없음 · 계약에 없는 칸", () => {
    expect(documentRightsProblems({ ...row, rights: "KOGL_TYPE2" })).not.toEqual([]);
    expect(documentRightsProblems({ ...row, last_reviewed_at: "11/12" })).not.toEqual([]);
    expect(documentRightsProblems({ ...row, where: "본문 끝" })).toEqual(['계약에 없는 칸 "where"']);
  });
  it("Source 하나에 두 행 · 없는 Source — 표가 거부하고, 두 행이면 그 문서도 발행처 행으로", () => {
    const two = [row, { ...row, basis: { ...row.basis, page: 5 } }];
    expect(documentRightsTableProblems(two, new Set([PDF.source_id])).join(" ")).toContain("2개");
    expect(sourceRights(PDF, reg, two).by).toBe("PUBLISHER");
    expect(documentRightsTableProblems([row], new Set([PAGE.source_id])).join(" ")).toContain("없는 Source");
  });
});

describe("실물 — PIPC-20261028-SAFETY-MEASURES 의 store.json (pack.ts 가 낸 것)", () => {
  const store = JSON.parse(readFileSync(new URL("../../pipeline/data/events/PIPC-20261028-SAFETY-MEASURES/store.json", import.meta.url), "utf8")) as {
    sources: { source_id: string; label: string; publisher: string }[]; source_registry: SourceRegistry[]; document_rights: DocumentRights[];
  };
  it("문서 단위 행 셋이 불변식 35 를 지킨다", () => {
    expect(store.document_rights).toHaveLength(3);
    expect(documentRightsTableProblems(store.document_rights, new Set(store.sources.map((s) => s.source_id)))).toEqual([]);
  });
  it("표시를 본 PDF 셋만 저장 · 인용할 수 있다 — 같은 발행처의 게시물 · 일정 페이지는 발행처 행 (null) 그대로", () => {
    const by = Object.fromEntries(store.sources.filter((s) => s.publisher === "pipc.go.kr").map((s) => [s.label, sourceRights(s, store.source_registry, store.document_rights)]));
    expect(Object.entries(by).filter(([, r]) => r.can_quote === true && r.can_store === true && r.by === "DOCUMENT").map(([l]) => l).sort())
      .toEqual(["PR-1029-PDF", "SL-SKT-0828", "SL-STATS-0515"]);
    for (const l of ["PR-1029", "SL-FINE-1204", "M21-AGENDA"]) expect(by[l], l).toMatchObject({ can_store: null, can_quote: null, by: "PUBLISHER" });
  });
});
