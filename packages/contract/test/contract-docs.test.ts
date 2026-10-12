import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DATA_MODEL_TYPES, OBSERVATION_ALIASES, OBSERVATION_TYPES, type FieldDesc } from "../src";

// 계약 문서가 원본이다. 문서의 타입 블록을 읽어 코드의 칸 목록과 글자로 댄다 — 어긋나면 실패한다.
const doc = (name: string) => readFileSync(fileURLToPath(new URL(`../../../docs/contract/${name}`, import.meta.url)), "utf-8");

type Parsed = Record<string, Record<string, string>>;

/** ```ts 블록의 `Name { field: type // 주석 }` → { Name: { field: type 식 } } */
function parseTypes(text: string): { types: Parsed; aliases: Record<string, string> } {
  const types: Parsed = {};
  const aliases: Record<string, string> = {};
  const norm = (s: string) => s.replace(/\/\/.*$/, "").replace(/\s+/g, " ").trim();
  for (const [, block] of text.matchAll(/```ts\n([\s\S]*?)```/g)) {
    const lines = block!.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const oneLine = /^(\w+)\s*\{(.+)\}\s*(?:\/\/.*)?$/.exec(line);
      if (oneLine) {
        types[oneLine[1]!] = Object.fromEntries(
          oneLine[2]!.split(",").map((f) => {
            const [, k, v] = /^\s*(\w+)\s*:\s*(.+?)\s*$/.exec(f)!;
            return [k!, norm(v!)];
          }),
        );
        continue;
      }
      const open = /^(\w+)\s*\{\s*(?:\/\/.*)?$/.exec(line);
      if (open) {
        const fields: Record<string, string> = {};
        for (i++; i < lines.length && !/^\}/.test(lines[i]!); i++) {
          const f = /^\s+(\w+)\s*:\s*(.+)$/.exec(lines[i]!);
          if (f) fields[f[1]!] = norm(f[2]!);
        }
        types[open[1]!] = fields;
        continue;
      }
      const alias = /^(\w+)\s*=\s*(.+)$/.exec(line);
      if (alias) aliases[alias[1]!] = norm(alias[2]!);
    }
  }
  return { types, aliases };
}

function compare(parsed: Parsed, code: Record<string, Record<string, FieldDesc>>) {
  for (const [name, fields] of Object.entries(code)) {
    const want = parsed[name];
    expect(want, `타입 ${name} 이 문서에 없다`).toBeDefined();
    expect(Object.keys(fields), `${name} 의 칸 이름 · 순서`).toEqual(Object.keys(want!));
    for (const [k, d] of Object.entries(fields)) {
      expect(d.type, `${name}.${k} 의 타입 식`).toBe(want![k]);
      expect(d.nullable, `${name}.${k} 가 null 을 받는가`).toBe(/\| null$/.test(want![k]!));
    }
  }
}

describe("OBSERVATION.md ↔ src/observation.ts", () => {
  const { types, aliases } = parseTypes(doc("OBSERVATION.md"));

  it("문서의 타입이 전부 코드에 있고, 코드의 타입이 전부 문서에 있다", () => {
    expect(Object.keys(OBSERVATION_TYPES).sort()).toEqual(Object.keys(types).sort());
  });

  it("타입마다 칸 이름 · 순서 · 타입 식 · null 여부가 문서와 같다", () => {
    compare(types, OBSERVATION_TYPES);
  });

  it("이름 붙인 닫힌 값 (Position · ProbeType)", () => {
    for (const [name, values] of Object.entries(OBSERVATION_ALIASES))
      expect(values.map((v) => `"${v}"`).join(" | "), name).toBe(aliases[name]);
  });
});

describe("DATA_MODEL.md ↔ src/data-model.ts (ArticleRecord 와 그것이 품는 모양만)", () => {
  const { types, aliases } = parseTypes(doc("DATA_MODEL.md"));

  it("옮긴 타입마다 칸 이름 · 순서 · 타입 식 · null 여부가 문서와 같다", () => {
    compare(types, DATA_MODEL_TYPES);
  });

  it("GoalRef · StorylineId · TimePoint 는 문서에서도 UUID · UUID · string 이다", () => {
    expect([aliases.GoalRef, aliases.StorylineId, aliases.TimePoint]).toEqual(["UUID", "UUID", "string"]);
  });
});

describe("망가뜨리면 실패한다", () => {
  const text = doc("OBSERVATION.md");
  const fails = (broken: string) => {
    expect(broken).not.toBe(text);
    expect(() => compare(parseTypes(broken).types, OBSERVATION_TYPES)).toThrow();
  };

  it("문서에 칸을 더함", () => fails(text.replace("  seq:          integer", "  dwell_ms:     integer\n  seq:          integer")));
  it("문서에서 칸을 뺌", () => fails(text.replace(/^  from_plan_id: UUID \| null.*\n/m, "")));
  it("문서의 닫힌 값을 바꿈", () => fails(text.replace('"LEVEL_SWITCHED" | "CLOSED"', '"LEVEL_SWITCHED" | "CLOSED" | "SWIPED"')));
  it("문서에서 null 을 뺌", () => fails(text.replace("is_correct:     boolean | null", "is_correct:     boolean")));
});
