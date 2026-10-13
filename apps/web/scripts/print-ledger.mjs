// 원장에 남은 것을 사람이 읽는 줄로 낸다 — scripts/ledger.mjs (켜져 있는 이 컴퓨터의 서버에게 묻는다) · scripts/ledger-db.ts (데이터베이스를 바로 읽는다) 가 같이 쓴다.
// 열람마다: 누구(이름표) · 보여준 레벨(plan) · 사건을 seq 순서로 · 원장에서 센 값(완독 · 멈춘 장) · 계약에 맞는가. 세고 견주기만 한다
const NAMES = { basic: "입문", intermediate: "중급", advanced: "숙련" };

export function printLedger(data) {
  const label = Object.fromEntries(data.readers.map((r) => [r.user_id, r.label]));
  console.log(`원장 — plan ${data.rows.reading_plan_log}줄 · 읽기 사건 ${data.rows.reading_event}줄 · 열람 ${data.readings.length} · 대응표의 독자 ${data.readers.length}`);
  for (const r of data.readings) {
    const level = Object.fromEntries(r.plans.map((p) => [p.plan_id, p.level]));
    console.log(`\n열람 ${r.reading_id}  독자 ${label[r.user_id] ?? "(대응표에 없다)"}  세션 ${r.session_id.slice(0, 8)}`);
    for (const p of r.plans)
      console.log(`  plan  ${NAMES[p.level]} · ${p.level_chosen_by} · ${p.created_at} · 개념 ${p.block_decisions.map((d) => d.decision).join(" ")}`);
    for (const e of r.events) {
      const what = e.type === "LEVEL_SWITCHED" ? `${NAMES[level[e.from_plan_id]]} → ${NAMES[level[e.plan_id]]}`
        : e.slide_index === null ? "" : `${NAMES[level[e.plan_id]]} ${e.slide_index + 1}장`;
      console.log(`  ${String(e.seq).padStart(3)}  ${e.occurred_at}  ${e.type.padEnd(15)} ${what}`);
    }
    const s = r.summary, c = r.check;
    if (s) {
      const at = s.stopped_at ? `${NAMES[s.stopped_at.level]} ${s.stopped_at.slide_index + 1}장` : "—";
      console.log(`  계산  완독 ${s.completed} · 끝이 나온 완독 ${s.completed_to_end} · 멈춘 장 ${at} (끝이 나온 뒤 ${s.stopped_end_shown}) · 전환으로 떠난 레벨 [${s.switched_from.map((l) => NAMES[l]).join(", ")}]`);
    }
    if (c) {
      console.log(`  계약  ${c.conforms ? "맞는다" : "어긋난다"}${c.missing_seq.length ? ` · 빈 seq ${c.missing_seq.join(", ")}` : ""}`);
      for (const i of c.issues) console.log(`        ${i.code}: ${i.message}`);
    }
  }
}
