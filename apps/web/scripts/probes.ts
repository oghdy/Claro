// 물음 넷(판 1)을 데이터베이스에 넣는다.   pnpm --filter @claro/web probes        (셸의 DATABASE_URL · CLARO_PGLITE_DIR)
//                                          pnpm --filter @claro/web deploy:probes (.env.deploy 의 데이터베이스)
// 물음의 원본은 src/study/probes.ts 다 (DECISIONS D37 의 글자 그대로). 이미 있는 판은 건드리지 않는다 — 글자가 다르면 멈춘다 (고쳐 쓰지 않는다. 새 판을 더한다).
// **데이터베이스가 못 지키는 불변식을 여기서 지킨다** (요점 · 개념의 테이블이 없다):
//   23  goal_ref 가 있는 요점이고, 물음의 event_id 가 그 요점의 사건과 같다 — fixtures/store.json 의 goals
//   18  target 의 개념이 leaf 이고 · MERGED 가 아니고 · 그 버전이 있다. 그리고 **지금 버전**이다 (D37) — docs/content/concept-library.json
import { probe } from "@claro/db";
import { and, eq } from "drizzle-orm";
import { loadRaw } from "../src/lib/load";
import { db } from "../src/server/db";
import { probeProblems, type GoalRow } from "../src/server/probe-check";
import { PROBES, PROBE_LABELS } from "../src/study/probes";

const goals = (loadRaw("store.json") as { goals: GoalRow[] }).goals;
const problems = PROBE_LABELS.flatMap((label) => probeProblems(PROBES[label], goals).map((m) => `${label}: ${m}`));
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
/** 칸의 순서와 상관없이 같은 값인가 — jsonb 는 키의 순서를 바꿔 돌려준다 */
const sorted = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sorted(x)])) : v;
const same = (a: unknown, b: unknown) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const d = await db();
for (const label of PROBE_LABELS) {
  const p = PROBES[label];
  const row = { ...p, targets: [...p.targets], choices: p.choices ? [...p.choices] : null };
  const [had] = await d.select().from(probe).where(and(eq(probe.probe_id, p.probe_id), eq(probe.version, p.version)));
  if (!had) {
    await d.insert(probe).values(row);
    console.log(`${label} v${p.version}  넣었다 — ${p.prompt}`);
  } else if (same(had, row)) console.log(`${label} v${p.version}  이미 있다`);
  else {
    console.error(`${label} v${p.version}  데이터베이스의 판과 글자가 다르다 — 판은 고치지 않는다. version 을 올려 새 판으로 넣는다`);
    process.exit(1);
  }
}
process.exit(0);
