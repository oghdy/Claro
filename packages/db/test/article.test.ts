import { linearize, stripAnnotations, type Block } from "@claro/contract";
import { beforeAll, describe, expect, it } from "vitest";
import { LedgerRejected, appendArticle, articleRecord } from "../src";
import { attempt, freshDb, goldenRaw, goldenRecord } from "./harness";

let t: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  t = await freshDb();
  await appendArticle(t.db, goldenRecord());
});

describe("기사 한 판 — 통째로 넣고 통째로 꺼낸다", () => {
  it("골든을 넣고 꺼내면 글자 그대로 같다 (키 순서까지)", async () => {
    const rows = await t.db.select().from(articleRecord);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows[0])).toBe(JSON.stringify(goldenRecord()));
  });

  it("데이터베이스 안의 글자도 넣은 글자다 (json 은 다시 쓰지 않는다)", async () => {
    const r = await t.client.query<{ p: string; a: string }>("select package::text as p, authoring::text as a from article_record");
    expect(r.rows[0]!.p).toBe(JSON.stringify(goldenRecord().package));
    expect(r.rows[0]!.a).toBe(JSON.stringify(goldenRecord().authoring));
  });

  it("독자 글 — 꺼낸 패키지의 모든 블록 text 가 픽스처 파일의 것과 같고 linearize 와도 같다", async () => {
    const [row] = await t.db.select().from(articleRecord);
    const fixture = goldenRaw().package;
    let n = 0;
    row!.package.levels.forEach((lv, i) =>
      lv.slides.forEach((s, j) =>
        s.blocks.forEach((b, k) => {
          expect(b.text).toBe(fixture.levels[i].slides[j].blocks[k].text);
          expect(linearize(b as Block)).toBe(b.text);
          n++;
        }),
      ),
    );
    expect(n).toBeGreaterThan(0);
    expect(row!.package.levels.map((l) => [l.id, l.slides.length, l.open_questions.length])).toEqual([
      ["basic", 9, 8],
      ["advanced", 5, 4],
    ]);
  });
});

describe("판은 불변이다 — 데이터베이스가 막는다", () => {
  const g = goldenRecord();
  const sql = (q: string) => attempt(t.client, async () => void (await t.client.query(q)));

  it("(article_id · article_version) 은 유일하다", async () => {
    expect(await attempt(t.client, () => appendArticle(t.db, g).then(() => {}))).toBe("UNIQUE article_record_article_id_article_version_pk");
  });
  it("고치기 거부", async () => {
    expect(await sql(`update article_record set package = '{"levels": []}'`)).toBe("LEDGER_APPEND_ONLY");
  });
  it("지우기 거부", async () => {
    expect(await sql("delete from article_record")).toBe("LEDGER_APPEND_ONLY");
  });
  it("비우기(truncate) 거부", async () => {
    expect(await sql("truncate article_record cascade")).toBe("LEDGER_APPEND_ONLY");
  });
  it("있으면 고치기(upsert) 거부", async () => {
    expect(
      await sql(
        `insert into article_record (article_id, article_version, package, authoring) values ('${g.article_id}', 1, '{"levels": []}', '{}')
         on conflict (article_id, article_version) do update set package = excluded.package`,
      ),
    ).toBe("LEDGER_APPEND_ONLY");
  });
  it("같은 기사의 다음 판은 들어간다 — 옛 판은 그대로다", async () => {
    await t.client.exec("begin");
    await appendArticle(t.db, { ...g, article_version: 2 });
    const rows = await t.db.select({ v: articleRecord.article_version }).from(articleRecord);
    await t.client.exec("rollback");
    expect(rows.map((r) => r.v).sort()).toEqual([1, 2]);
  });
});

describe("넣기 전에 — appendArticle 이 거부하는 것", () => {
  const rejects = async (record: unknown, code: string) => {
    const got = await appendArticle(t.db, record as never).then(
      () => null,
      (e) => e,
    );
    expect(got).toBeInstanceOf(LedgerRejected);
    expect((got as LedgerRejected).code).toBe(code);
  };

  it("계약에 없는 칸", () => rejects({ ...goldenRecord(), article_version: 3, slug: "fomc" }, "LEDGER_FIELD"));
  it("나눠 담은 것 (package 가 없다)", () => {
    const { package: _p, ...rest } = goldenRecord();
    return rejects({ ...rest, article_version: 3, levels: [] }, "LEDGER_FIELD");
  });
  it("픽스처 주석(`_source`)이 남은 패키지", () => {
    const raw = goldenRaw();
    return rejects({ ...goldenRecord(), article_version: 3, package: raw.package }, "ARTICLE_ANNOTATION");
  });
  it("계약을 어긴 패키지 (물음 하나를 뺌)", () => {
    const r = structuredClone(goldenRecord());
    r.article_version = 3;
    r.package.levels[0]!.open_questions.pop();
    return rejects(r, "ARTICLE_PACKAGE");
  });
  it("주석을 뺀 사본은 픽스처와 독자 글이 같다 (빼는 것은 `_` 칸뿐)", () => {
    const raw = goldenRaw().package;
    expect(JSON.stringify(stripAnnotations(raw))).toBe(JSON.stringify(goldenRecord().package));
    expect(JSON.stringify(raw)).toMatch(/"_source"/);
  });
});
