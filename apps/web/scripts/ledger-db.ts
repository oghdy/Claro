// 원장에 남은 것을 본다 — 데이터베이스를 바로 읽는다 (읽기만).   pnpm --filter @claro/web deploy:ledger   (.env.deploy 의 데이터베이스)
// 배포된 서버에는 원장을 내어 주는 길이 없다 (/api/peek 는 이 컴퓨터에서만). 그래서 접속 값을 가진 사람이 자기 컴퓨터에서 이렇게 본다.
// 완독 · 끝이 나온 완독 · 멈춘 장 · "계약에 맞는가"는 칸이 아니다 — packages/db 의 readingSummary · checkReading 이 원장에서 센다
import { db } from "../src/server/db";
import { peekLedger } from "../src/server/ledger";
import { printLedger } from "./print-ledger.mjs";

printLedger(JSON.parse(JSON.stringify(await peekLedger(await db()))));
process.exit(0);
