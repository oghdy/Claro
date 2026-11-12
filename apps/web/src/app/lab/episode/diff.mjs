// 두 폴더의 같은 이름 PNG 를 픽셀로 견준다 (UX-4 — 풀이를 틀 부품으로 옮기기 전 · 후). 다른 픽셀 수와 가장 큰 채널 차이를 적는다.
//   node src/app/lab/episode/diff.mjs <전 폴더> <후 폴더> <sharp 가 있는 node_modules> [위에서 건너뛸 px]
// sharp 는 이 앱의 직접 의존이 아니다 (next 가 데려온 것) — 그래서 있는 곳을 셋째 인자로 준다:
//   ls -d ../../node_modules/.pnpm/sharp@*/node_modules
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(process.argv[4] + "/");
const sharp = require("sharp");
const [a, b] = [process.argv[2], process.argv[3]];
const SKIP = Number(process.argv[5] ?? 0);
const names = readdirSync(a).filter((f) => f.endsWith(".png")).sort();
let same = 0, diff = 0, missing = 0;
for (const n of names) {
  if (!existsSync(path.join(b, n))) { missing++; console.log(`없음  ${n}`); continue; }
  const [x, y] = await Promise.all([a, b].map((d) => sharp(path.join(d, n)).raw().toBuffer({ resolveWithObject: true })));
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) { diff++; console.log(`크기  ${n}`); continue; }
  let px = 0, max = 0, top = -1, bottom = -1;
  const ch = x.info.channels;
  // 넷째 인자: 위에서 이만큼(px · 이미지 픽셀)은 보지 않는다 — 시안 조종 칸(위쪽 줄)이 바뀐 것과 풀이 그림을 가르려고 (UX-5)
  for (let i = SKIP * x.info.width * ch; i < x.data.length; i += ch) {
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(x.data[i + c] - y.data[i + c]));
    if (d > 0) { px++; if (d > max) max = d; const row = Math.floor(i / ch / x.info.width); if (top < 0) top = row; bottom = row; }
  }
  // UX-6: 다른 픽셀이 있는 줄의 범위 (이미지 픽셀 · 위에서부터) — 어느 자리가 달라졌나 (예: 풀이 그림 아래만)
  if (px === 0) same++; else { diff++; console.log(`다름  ${n}  픽셀 ${px} (${(px / (x.info.width * x.info.height) * 100).toFixed(3)}%) · 가장 큰 차이 ${max}/255 · 줄 ${top}–${bottom} / ${x.info.height}`); }
}
const extra = readdirSync(b).filter((f) => f.endsWith(".png") && !names.includes(f));
console.log(`\n${names.length}장 — 같음 ${same} · 다름 ${diff} · 없음 ${missing}${extra.length ? ` · 뒤에만 있음 ${extra.length}` : ""}`);
