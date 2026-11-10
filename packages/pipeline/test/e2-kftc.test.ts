// E2-1 — 두 번째 사건 (공정위 배달앱 제재). FOMC 아닌 사건에서 새로 생긴 길: HWP 읽기 · 읽지 않는 형식에서 멈추기 · 공공누리 · 법령 권리 · hold_text
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extract, sha256 } from "../src/extract.ts";
import { isCfb, paraText } from "../src/hwp.ts";
import { canStore, registryRow, rightsOf } from "../src/rights.ts";

const u16 = (codes: number[]) => {
  const b = new Uint8Array(codes.length * 2);
  const dv = new DataView(b.buffer);
  codes.forEach((c, i) => dv.setUint16(i * 2, c, true));
  return b;
};

describe("HWP 문단 글 (hwp.ts paraText)", () => {
  it("글자 제어 1칸 · 묶음 제어 8칸 · 탭은 공백 · 문단 끝은 줄바꿈", () => {
    const ko = [..."가나"].map((c) => c.charCodeAt(0));
    // "가" + 탭(9 — 8칸 묶음) + "나" + 확장 제어 11 (표 · 8칸) + 묶음 빈칸 30 + "가" + 문단 끝 13
    const rec = u16([ko[0]!, 9, 0, 0, 0, 0, 0, 0, 9, ko[1]!, 11, 1, 2, 3, 4, 5, 6, 11, 30, ko[0]!, 13]);
    expect(paraText(rec)).toBe("가 나 가\n");
  });
  it("CFB 서명", () => {
    expect(isCfb(new Uint8Array(512))).toBe(false);
    const b = new Uint8Array(512);
    b.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(isCfb(b)).toBe(true);
  });
});

describe("읽지 않는 형식은 HTML 로 풀지 않는다 (extract.ts)", () => {
  it("ZIP (HWPX) → 오류", async () => {
    await expect(extract(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]), "application/x-msdownload")).rejects.toThrow(/ZIP/);
  });
  it("NUL 이 든 바이너리 → 오류 · HTML 은 그대로", async () => {
    await expect(extract(new Uint8Array([1, 0, 2, 0, 3]), "application/octet-stream")).rejects.toThrow(/바이너리/);
    const r = await extract(new TextEncoder().encode("<html><body><p>가</p><p>나</p></body></html>"), "text/html; charset=UTF-8");
    expect(r).toMatchObject({ kind: "HTML", text: "가\n나" });
  });
});

describe("권리 — 공공누리 제1유형 · 한국 법령 (D53)", () => {
  it("발행처로 가른다", () => {
    expect(rightsOf("ftc.go.kr")).toBe("KOGL_TYPE1");
    expect(rightsOf("law.go.kr")).toBe("KR_STATUTE");
    expect(rightsOf("news.coupang.com")).toBe("UNCONFIRMED");
    expect(canStore("KOGL_TYPE1") && canStore("KR_STATUTE") && canStore("US_FEDERAL_17USC105")).toBe(true);
    expect(canStore("UNCONFIRMED")).toBe(false);
  });
  it("권리 행 — 값이 있는 칸에는 근거가 있다 (불변식 30)", () => {
    const k = registryRow("ftc.go.kr", "2026-11-11", "x");
    expect(k).toMatchObject({ can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true });
    expect(k.basis).toContain("공공누리 제1유형");
    const l = registryRow("law.go.kr", "2026-11-11", "x");
    expect(l).toMatchObject({ can_store: true, can_quote: true, can_transform: null, commercial_use: null });
    expect(l.basis).toContain("저작권법 제7조");
  });
});

describe("사건 폴더 KFTC-20261029-DELIVERY-APPS", () => {
  const dir = new URL("../data/events/KFTC-20261029-DELIVERY-APPS/", import.meta.url);
  const pack = JSON.parse(readFileSync(new URL("pack.json", dir), "utf8"));
  const docs = JSON.parse(readFileSync(new URL("store.documents.json", dir), "utf8"));
  const rec = JSON.parse(readFileSync(new URL("fetch.json", dir), "utf8"));
  const items = new Map(pack.items.map((i: { label: string }) => [i.label, i]));
  const inRepo = new Map(docs.source_documents.map((d: { source_id: string; text: string }) => [d.source_id, d.text]));

  it("git 에 든 원문 = 권리가 허락하고 hold_text 가 없는 것만 · 해시 = 기록", () => {
    for (const d of rec.documents) {
      const held = !!(items.get(d.label) as { hold_text?: string }).hold_text;
      expect(inRepo.has(d.source_id), d.label).toBe(canStore(d.rights) && !held);
      if (inRepo.has(d.source_id)) expect(sha256(inRepo.get(d.source_id) as string), d.label).toBe(d.text_sha256);
    }
  });
  it("HWP 하나 (2020 요기요) — 뽑은 방법이 HWP 의 것 · 캐시 바이트가 있으면 다시 뽑아 같은 해시", async () => {
    const d = rec.documents.find((x: { label: string }) => x.label === "SL-YGY-2020");
    expect(d.kind).toBe("HWP");
    expect(d.extractor).toMatch(/^e2-hwp5\//);
    const bin = new URL("../.cache/events/KFTC-20261029-DELIVERY-APPS/raw/SL-YGY-2020.bin", import.meta.url);
    if (!existsSync(bin)) return; // 다른 기계 — 캐시 없음
    const r = await extract(new Uint8Array(readFileSync(bin)), d.fetch.content_type);
    expect(sha256(r.text)).toBe(d.text_sha256);
  });
});
