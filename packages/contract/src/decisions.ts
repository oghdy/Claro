// plan 의 block_decisions 를 패키지에서 계산한다 (OBSERVATION §4.2 · 불변식 6). 정적 레벨에서만 맞는 계산이다 — 값을 매기지 않는다.
// 같은 계산이 scripts/verify-observation.py derive_decisions 에 있다. 골든에서 둘이 같은 값을 내는지 packages/db 의 테스트가 본다.
import { STATIC_LEVEL_REASON, type BlockDecision } from "./observation";
import type { ArticlePackage, ConceptRef, LevelId, Span } from "./types";

/** 레벨의 모든 span — 읽는 순서. RichText 가 어느 칸에 있든 찾는다 (모르는 블록 안이어도) */
function* spans(o: unknown): Generator<Span> {
  if (Array.isArray(o)) {
    if (o.length && o.every((x) => x !== null && typeof x === "object" && "layer" in x)) yield* o as Span[];
    else for (const x of o) yield* spans(x);
  } else if (o !== null && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) if (!k.startsWith("_")) yield* spans(v);
  }
}

function decisionOf(parts: Set<string | null>): BlockDecision["decision"] {
  if ([...parts].some((p) => p?.startsWith("FULL"))) return "FULL";
  return parts.has("REFRESHER") ? "REFRESHER" : "SKIP";
}

/**
 * 레벨마다 — 그 판이 **어느 레벨에서든** 가리키는 개념 전부에 하나씩 (그래야 SKIP 이 남는다). concept_id 순서.
 * `version` 은 그 패키지의 ConceptRef.version 이다 — 한 판 안에서 한 개념은 한 버전이다.
 */
export function deriveBlockDecisions(pkg: ArticlePackage): Partial<Record<LevelId, BlockDecision[]>> {
  const version = new Map<string, number>();
  const seen = new Map<LevelId, Map<string, Set<string | null>>>();
  for (const level of pkg.levels) {
    const parts = new Map<string, Set<string | null>>();
    seen.set(level.id, parts);
    for (const sp of spans(level.slides)) {
      if (sp.layer !== "concept") continue;
      for (const ref of sp.refs as ConceptRef[]) {
        version.set(ref.concept_id, ref.version);
        if (!parts.has(ref.concept_id)) parts.set(ref.concept_id, new Set());
        parts.get(ref.concept_id)!.add(ref.part);
      }
    }
  }
  const concepts = [...version.keys()].sort();
  const out: Partial<Record<LevelId, BlockDecision[]>> = {};
  for (const [level, parts] of seen)
    out[level] = concepts.map((concept_id) => ({
      concept_id,
      version: version.get(concept_id)!,
      decision: decisionOf(parts.get(concept_id) ?? new Set()),
      reason: STATIC_LEVEL_REASON,
    }));
  return out;
}
