// E3-1 — 세 번째 사건 (개인정보위 과징금). 새로 생긴 길: 공공누리 표시가 사이트가 아니라 문서 안에만 있는 발행처 (권리 미확인 그대로 · 본 것을 근거에) · 법령 판 둘 · 고시
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256 } from "../src/extract.ts";
import { canStore, CHECKED_NOT_STORABLE, registryRow, rightsOf } from "../src/rights.ts";

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

  it("git 에 든 원문 = 법령 (law.go.kr) 만 · 해시 = 기록", () => {
    for (const d of rec.documents) {
      expect(inRepo.has(d.source_id), d.label).toBe(d.publisher === "law.go.kr");
      if (inRepo.has(d.source_id)) expect(sha256(inRepo.get(d.source_id) as string), d.label).toBe(d.text_sha256);
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
