// 독자의 답을 꺼내 본다 — 데이터베이스를 바로 읽는다 (읽기만).   pnpm --filter @claro/web deploy:answers          (.env.deploy · 전원)
//                                                               pnpm --filter @claro/web deploy:answers R-03     (한 사람)
// 독자마다: 동의한 때 · 물음마다 (언제 · 어느 위치에서 보여줬나 · 답 — 쓴 글은 그대로 · 서버가 가린 맞음/틀림 · 답하지 않았으면 "답하지 않음").
// **쓴 답(P1)을 가리는 것은 사람의 일이다** — 여기에 그 판정을 적는 칸은 없다. 도윤이 읽고 원장 밖(명단)에 적는다 (D37).
// 점수 · 정답률을 내지 않는다. 무리(Claro · 일반 기사)는 여기 없다 — 명단에 있다. 다만 직후 물음이 plan 을 가리키면 "Claro 를 읽은 뒤"라고 적는다 (원장의 사실이다)
import { db } from "../src/server/db";
import { peekLedger } from "../src/server/ledger";
import { labelOf } from "../src/study/probes";

const only = process.argv.slice(2);
const L = await peekLedger(await db());
const when = (t: string) => new Date(t).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
for (const r of L.readers) {
  if (only.length && !only.includes(r.label)) continue;
  const shown = L.exposures.filter((x) => x.user_id === r.user_id);
  const agreed = L.consents.filter((c) => c.user_id === r.user_id);
  console.log(`\n${r.label}  동의 ${agreed.length ? agreed.map((c) => when(c.consented_at)).join(" · ") : "없음"}  ·  열람 ${L.readings.filter((x) => x.user_id === r.user_id).length}  ·  보여준 물음 ${shown.length}`);
  for (const x of shown) {
    const a = L.responses.find((s) => s.exposure_id === x.exposure_id);
    const mark = !a ? "" : a.is_correct === null ? "" : a.is_correct ? "  [맞음]" : "  [틀림]";
    const evidence = a ? L.evidence.filter((e) => e.interaction_id === a.interaction_id).length : 0;
    console.log(`  ${when(x.shown_at)}  ${x.position.padEnd(7)} ${labelOf(x.probe_id) ?? x.probe_id} v${x.probe_version}${x.plan_id ? "  (Claro 를 읽은 뒤)" : ""}${evidence ? `  증거 ${evidence}줄` : ""}`);
    console.log(a ? `      ${a.response.split("\n").join("\n      ")}${mark}` : "      (답하지 않음)");
  }
}
process.exit(0);
