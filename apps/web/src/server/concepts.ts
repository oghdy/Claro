// 개념 라이브러리 — 빌드할 때 싣는다 (docs/content/concept-library.json). 개념의 테이블은 아직 없다 (0.4a).
// 증거 줄을 쓰기 전에 **넣는 쪽이** 불변식 18 을 지킨다: 개념이 leaf 이고 · 기록할 때 MERGED 가 아니고 · 그 버전이 있다 (데이터베이스는 못 본다).
// 라이브러리의 개념은 전부 leaf 다 — Topic 은 Concept 밖에 생긴다 (CONCEPT_IDENTITY §8). 그래서 "라이브러리에 있다"가 "leaf 다"이다
import library from "../../../../docs/content/concept-library.json" with { type: "json" };

const concepts = new Map((library.concepts as { concept_id: string; code: string; status: string }[]).map((c) => [c.concept_id, c]));
const versions = new Set((library.versions as { concept_id: string; version: number }[]).map((v) => `${v.concept_id}@${v.version}`));

/** 이 개념 · 이 버전에 증거를 적어도 되나. 되면 null, 안 되면 까닭 (파이썬 검사와 같은 이름) */
export function evidenceProblem(concept_id: string, version: number): "EVIDENCE_CONCEPT" | "EVIDENCE_VERSION" | null {
  const c = concepts.get(concept_id);
  if (!c || c.status === "MERGED") return "EVIDENCE_CONCEPT";
  return versions.has(`${concept_id}@${version}`) ? null : "EVIDENCE_VERSION";
}
