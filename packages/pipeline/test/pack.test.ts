import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256 } from "../src/extract.ts";
import { cpLength } from "../src/match.ts";
import { SOURCE_FIELDS } from "../src/pack.ts";
import { allowed, parseRobots } from "../src/robots.ts";

describe("robots.txt (robots.ts · RFC 9309)", () => {
  const txt = `# c
User-agent: Googlebot
Disallow: /

User-agent: *
Disallow: /archive/
Allow: /archive/ok/
Disallow: /*?s=
Disallow: /end$
Disallow:
`;
  it("우리 이름의 무리가 없으면 * 무리 · 빈 Disallow 는 규칙이 아니다", () => {
    const r = parseRobots(txt, "claropipeline");
    expect(r.map((x) => x.pattern)).toEqual(["/archive/", "/archive/ok/", "/*?s=", "/end$"]);
  });
  it("가장 긴 규칙이 이긴다 · * · $", () => {
    const r = parseRobots(txt, "claropipeline");
    expect(allowed(r, "/archive/x").ok).toBe(false);
    expect(allowed(r, "/archive/ok/x").ok).toBe(true);
    expect(allowed(r, "/page?s=1").ok).toBe(false);
    expect(allowed(r, "/end").ok).toBe(false);
    expect(allowed(r, "/end/more").ok).toBe(true);
    expect(allowed(r, "/news").ok).toBe(true);
  });
  it("우리 이름의 무리가 있으면 그 무리만", () => {
    const r = parseRobots("User-agent: ClaroPipeline\nDisallow: /x\n\nUser-agent: *\nDisallow: /\n", "claropipeline");
    expect(allowed(r, "/y").ok).toBe(true);
    expect(allowed(r, "/x").ok).toBe(false);
  });
  it("api.bls.gov 의 robots (2026-10-30 받은 그대로) — 다 막힌다", () => {
    expect(allowed(parseRobots("User-agent: *\nDisallow: /\n", "claropipeline"), "/publicAPI/v1/timeseries/data/").ok).toBe(false);
  });
});

describe("사건 폴더 FOMC-20261028 — 저장소 · 원문 · 기록이 맞는가 (verify-source-pack 과 같은 것을 TS 로)", () => {
  const dir = new URL("../data/events/FOMC-20261028/", import.meta.url);
  const pack = JSON.parse(readFileSync(new URL("pack.json", dir), "utf8"));
  const store = JSON.parse(readFileSync(new URL("store.json", dir), "utf8"));
  const docs = JSON.parse(readFileSync(new URL("store.documents.json", dir), "utf8"));
  const rec = JSON.parse(readFileSync(new URL("fetch.json", dir), "utf8"));
  const p1docs = JSON.parse(readFileSync(new URL("../../../fixtures/store.documents.json", import.meta.url), "utf8"));
  const byLabel = new Map(rec.documents.map((d: { label: string }) => [d.label, d]));

  it("목록 항목마다 기록 하나 · 저장한 것만 Source", () => {
    expect(rec.documents.map((d: { label: string }) => d.label)).toEqual(pack.items.map((i: { label: string }) => i.label));
    const stored = rec.documents.filter((d: { status: string }) => d.status === "STORED").map((d: { label: string }) => d.label);
    expect(store.sources.map((s: { label: string }) => s.label)).toEqual(stored);
    for (const s of store.sources) expect(Object.keys(s)).toEqual([...SOURCE_FIELDS]);
  });
  it("원문의 해시 · 길이 = 기록 (저장소 것 · P-1 것)", () => {
    const all = new Map([...p1docs.source_documents, ...docs.source_documents].map((d: { source_id: string; text: string }) => [d.source_id, d.text]));
    for (const d of rec.documents.filter((x: { status: string; text_in: string }) => x.status === "STORED" && x.text_in !== "cache")) {
      const t = all.get(d.source_id)!;
      expect(sha256(t), d.label).toBe(d.text_sha256);
      expect(cpLength(t), d.label).toBe(d.text_length);
    }
  });
  it("권리 미확인 문서의 전문은 저장소 파일에 없다 · 요청하지 않기로 한 것은 요청 기록이 없다", () => {
    const inRepo = new Set(docs.source_documents.map((d: { source_id: string }) => d.source_id));
    for (const d of rec.documents) {
      if (d.rights !== "US_FEDERAL_17USC105") expect(inRepo.has(d.source_id), d.label).toBe(false);
    }
    for (const it of pack.items.filter((i: { skip?: string }) => i.skip)) expect((byLabel.get(it.label) as { fetch: unknown }).fetch).toBeNull();
  });
});
