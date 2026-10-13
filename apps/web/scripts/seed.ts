// 골든 한 판을 데이터베이스에 넣는다.   pnpm --filter @claro/web seed
// 어느 데이터베이스인지는 src/server/db.ts 가 정한다 (지금은 PGlite 폴더 — CLARO_PGLITE_DIR). 서버가 꺼져 있을 때 돌린다
import { db } from "../src/server/db";
import { goldenKey, seedGolden } from "../src/server/golden";

const added = await seedGolden(await db());
const { article_id, article_version } = goldenKey();
console.log(`${added ? "넣었다" : "이미 있다"} — article_record ${article_id} v${article_version}`);
process.exit(0);
