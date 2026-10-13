// 물음을 넣기 전에 **넣는 쪽이** 지키는 불변식 — 데이터베이스는 못 본다 (요점 · 개념의 테이블이 없다). scripts/probes.ts 가 넣기 전에 부른다.
//   23  goal_ref 가 있는 요점이고, 물음의 event_id 가 그 요점의 사건과 같다
//   18  target 의 개념이 leaf 이고 · MERGED 가 아니고 · 그 버전이 있다. 그리고 그 개념의 **지금 버전**이다 (D37 — 새 물음은 지금 문안을 겨눈다)
import type { Probe } from "@claro/contract";
import library from "../../../../docs/content/concept-library.json" with { type: "json" };
import { evidenceProblem } from "./concepts";

export interface GoalRow {
  goal_id: string;
  label: string;
  event_id: string;
}

/** 어긋난 곳마다 글 하나. 넣어도 되면 [] */
export function probeProblems(p: Probe, goals: GoalRow[]): string[] {
  const out: string[] = [];
  if (p.goal_ref !== null) {
    const goal = goals.find((g) => g.goal_id === p.goal_ref);
    if (!goal) out.push("PROBE_GOAL: goal_ref 가 저장소에 없는 요점이다 (불변식 23)");
    else if (goal.event_id !== p.event_id) out.push(`PROBE_GOAL: 물음의 사건이 요점(${goal.label})의 사건과 다르다 (불변식 23)`);
  }
  for (const t of p.targets) {
    const bad = evidenceProblem(t.concept_id, t.version);
    const now = (library.concepts as { concept_id: string; code: string; version: number | string }[]).find((c) => c.concept_id === t.concept_id);
    if (bad) out.push(`${bad}: target 이 leaf 가 아니거나 · MERGED 이거나 · 없는 버전이다 (불변식 18)`);
    else if (Number(now!.version) !== t.version) out.push(`PROBE_TARGET_VERSION: ${now!.code} 의 지금 버전은 ${now!.version} 인데 물음은 ${t.version} 을 겨눈다`);
  }
  if (p.choices && p.correct_choice !== null && !(p.correct_choice >= 0 && p.correct_choice < p.choices.length)) out.push("PROBE_CHOICE: correct_choice 가 보기의 위치가 아니다");
  if (!p.choices && p.correct_choice !== null) out.push("PROBE_CHOICE: 보기가 없는데 correct_choice 가 있다");
  return out;
}
