// 원장에 남은 것을 본다 — 켜져 있는 서버에게 묻는다.   pnpm --filter @claro/web ledger          (폰으로 보기 서버 · 3200)
//                                                      pnpm --filter @claro/web ledger 3100     (개발 서버)
// 열람마다: 누구(이름표) · 보여준 레벨(plan) · 사건을 seq 순서로 · 원장에서 센 값(완독 · 멈춘 장) · 계약에 맞는가.
// 서버가 CLARO_PEEK=1 로 켜져 있어야 한다 (`pnpm phone` 은 그렇게 켠다). 배포된 서버에는 이 길이 없다 — 실제 Postgres 는 SQL 로 본다
import { printLedger } from "./print-ledger.mjs";

const port = process.argv[2] ?? "3200";
let data;
try {
  const res = await fetch(`http://localhost:${port}/api/peek`);
  if (!res.ok) throw new Error(`${res.status} — 서버가 CLARO_PEEK=1 로 켜져 있나`);
  data = await res.json();
} catch (e) {
  console.error(`http://localhost:${port} 에서 원장을 못 읽었다: ${e.message}`);
  process.exit(1);
}
printLedger(data);
