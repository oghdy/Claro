// 독자 하나를 대응표(identity.reader)에 올리고, 그 독자의 링크를 낸다.   pnpm --filter @claro/web reader R-07
//   - user_id 는 여기서 만든 뜻 없는 UUID 다. 사람 · 기기에서 계산하지 않는다 (OBSERVATION §3)
//   - 이름표는 **사람을 알아볼 수 없는 부호**만 받는다 ("R-07"). 이름 · 연락처를 넣지 않는다 — 누가 R-07 인지는 저장소 · 데이터베이스 밖에 (D34)
//   - 같은 이름표가 이미 있으면 새로 만들지 않고 그 링크를 다시 낸다
// 서버가 꺼져 있을 때 돌린다 (PGlite 는 한 프로세스만 연다)
import { randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";
import { reader } from "@claro/db";
import { eq } from "drizzle-orm";
import { db } from "../src/server/db";

const labels = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const port = process.env.CLARO_PORT ?? "3200";
if (!labels.length || labels.some((l) => !/^[A-Z]{1,3}-\d{1,4}$/.test(l))) {
  console.error('이름표는 부호만 받는다 — 글자 1~3 + "-" + 숫자 (예: R-07). 사람을 알아볼 값을 넣지 않는다');
  process.exit(1);
}
const lan = Object.values(networkInterfaces()).flat().find((n) => n && n.family === "IPv4" && !n.internal)?.address ?? "localhost";
const d = await db();
for (const label of labels) {
  let [row] = await d.select().from(reader).where(eq(reader.label, label));
  if (!row) [row] = await d.insert(reader).values({ user_id: randomUUID(), label }).returning();
  console.log(`${label}  http://${lan}:${port}/?r=${row!.user_id}`);
}
process.exit(0);
