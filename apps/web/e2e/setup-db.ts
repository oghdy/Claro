// 테스트용 데이터베이스를 새로 만든다 — 골든 한 판 + 테스트의 독자들. 서버를 켜기 전에 돈다 (playwright.config.ts · e2e/record-killed.spec.ts).
// 폴더는 CLARO_PGLITE_DIR 이 정한다. 지우고 새로 만든다 — 테스트의 원장은 관찰이 아니다
import { rmSync } from "node:fs";
import { reader } from "@claro/db";
import { db } from "../src/server/db";
import { seedGolden } from "../src/server/golden";
import { READERS } from "./readers";

const dir = process.env.CLARO_PGLITE_DIR;
if (!dir || !/^\.data\/test/.test(dir)) throw new Error("CLARO_PGLITE_DIR 이 .data/test… 가 아니다 — 테스트용 폴더만 지운다");
rmSync(dir, { recursive: true, force: true });
const d = await db();
await seedGolden(d);
await d.insert(reader).values(Object.values(READERS).map((user_id, i) => ({ user_id, label: `T-${String(i + 1).padStart(2, "0")}` })));
process.exit(0);
