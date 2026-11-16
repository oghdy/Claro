// L-1 — 미리 보기 주소 (/lab/local/<사건>/<code>)를 폰 크기 (390×844)로 **장면마다** 찍는 한 명령. 스킬 「오늘 이야기 만들기」의 ⑦ (게이트 점검이 이 그림을 읽는다).
// 지금까지 Step 마다 따로 있던 shots-ux10 · ux10b · ux11b · fe6 의 "처음부터 끝까지 눌러 가며 찍기"를 하나로 모았다 (그 파일들은 그 Step 의 기록이라 그대로 둔다).
//   pnpm --filter @claro/web story:shots <사건>/<code>                         빌드하고 (.next-local) 서버를 띄워 (3320) 찍고 끈다 → apps/web/.data/shots/<code>/ (git 밖)
//   pnpm --filter @claro/web story:shots <사건>/<code> <나갈 폴더>              나갈 곳을 정해서 (저장소에 남길 그림일 때)
//   pnpm --filter @claro/web story:shots <사건>/<code> <나갈 폴더> --base <주소>  이미 켜 둔 서버 · 배포된 주소를 찍는다 (빌드 · 서버 없음) 예: --base https://claro-lime-one.vercel.app
//   … --path /s/oil/1                                                           미리 보기 대신 다른 주소 (실제 주소 — 올린 뒤 확인)
// 번호는 장면의 자리다 — 긴: 01 표지 · 02 지금까지 · 03 오늘의 사건 · 04 도구 · 05 풀이 누르기 전 · 06 풀이 누른 뒤 (+ 근거 시트) · 07 이어짐 · 08 남음 / 짧은: 01 표지 · 02 무슨 일 · 03 문서가 말한 것 · 04 남음.
// 한 장면이 화면보다 길면 -b · -c … 로 내려가며 찍는다. 끝에 잰 것을 찍는다: 뉴스 한 줄 · 큰 제목이 몇 줄인가 · 가로 넘침 · 콘솔 오류. 테스트가 아니다 (e2e/ 에 넣지 않았다).
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Locator } from "@playwright/test";

const WEB = path.join(import.meta.dirname, "..");
const PORT = 3320;
const argv = process.argv.slice(2);
const opt = (name: string) => {
  const i = argv.indexOf(name);
  return i < 0 ? undefined : argv.splice(i, 2)[1];
};
const baseArg = opt("--base");
const pathArg = opt("--path");
const [target, outArg] = argv;
const [event, code] = (target ?? "").split("/");
if (!event || !code) {
  console.log("쓰는 법: pnpm --filter @claro/web story:shots <사건>/<code> [나갈 폴더] [--base <주소>] [--path <주소 길>]");
  process.exit(2);
}
// pnpm 은 스크립트를 apps/web 에서 돌린다 — 나갈 폴더가 상대 길이면 부른 자리 (INIT_CWD)에서 센다
const OUT = outArg ? path.resolve(process.env.INIT_CWD ?? process.cwd(), outArg) : path.join(WEB, ".data/shots", code);
const URL_PATH = pathArg ?? `/lab/local/${event}/${code}`;
mkdirSync(OUT, { recursive: true });

// ─────────────────────────────────────────────────────────── 서버 (--base 가 없을 때만)
let server: ChildProcess | null = null;
const stop = () => {
  if (server && !server.killed) server.kill("SIGTERM");
  server = null;
};
process.on("exit", stop);
for (const s of ["SIGINT", "SIGTERM"] as const) process.on(s, () => (stop(), process.exit(1)));

async function serve(): Promise<string> {
  const base = `http://localhost:${PORT}`;
  if (await fetch(base).then(() => true, () => false)) throw new Error(`포트 ${PORT} 에 이미 서버가 있다 — 끄거나 --base ${base} 로 그 서버를 찍는다`);
  // 빌드 폴더 · 데이터베이스를 따로 쓴다 (.next-local · PGlite) — 개발 (3100) · 테스트 (3101) · 폰으로 보기 (3200)와 겹치지 않는다. 이야기 화면은 데이터베이스를 읽지 않는다
  const env = { ...process.env, CLARO_DIST: ".next-local", DATABASE_URL: "", CLARO_PGLITE_DIR: ".data/local" };
  const next = path.join(WEB, "node_modules/.bin/next");
  console.log("빌드 (.next-local) …");
  await new Promise<void>((ok, no) => {
    let log = "";
    const b = spawn(next, ["build"], { cwd: WEB, env });
    b.stdout.on("data", (d) => (log += d));
    b.stderr.on("data", (d) => (log += d));
    b.on("exit", (c) => (c === 0 ? ok() : no(new Error(`빌드가 섰다 (exit ${c}) — 이야기 파일이 계약 · 화면 칸의 꼴을 못 지나면 여기서 선다. story:check 를 먼저 돌린다\n${log.slice(-3000)}`))));
  });
  server = spawn(next, ["start", "-p", String(PORT)], { cwd: WEB, env, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    if (await fetch(base).then(() => true, () => false)) return base;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("서버가 30초 안에 뜨지 않았다");
}

// ─────────────────────────────────────────────────────────── 찍기
const LONG_NO: Record<string, string> = { cover: "01", zero: "02", event: "03", tools: "04", aha: "05", compare: "06x", next: "07", keep: "08" };
const SHORT_NO: Record<string, string> = { cover: "01", where: "02", why: "03", keep: "04" };
let failed = 0;
try {
  const BASE = (baseArg ?? (await serve())).replace(/\/$/, "");
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  const shots: string[] = [];
  let wide = 0;
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !m.location().url.endsWith("/favicon.ico") && errors.push(m.text()));
  const settle = (ms = 1500) => page.waitForTimeout(ms);
  const root = page.locator(".ep-root");
  const sceneId = async () => (await root.getAttribute("data-scene")) ?? "";

  /** 글이 몇 줄로 섰나 — 글 조각 (text node)의 줄 상자를 센다 (shots-fe7 의 재는 법) */
  const linesOf = async (el: Locator) =>
    (await el.count())
      ? el.first().evaluate((node) => {
          const tops = new Set<number>();
          const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          for (let t = walk.nextNode(); t; t = walk.nextNode()) {
            const r = document.createRange();
            r.selectNodeContents(t);
            for (const x of r.getClientRects()) if (x.width > 1) tops.add(Math.round(x.top));
          }
          return tops.size;
        })
      : null;

  /** 지금 장면을 위에서부터 화면 높이만큼씩 내려가며 찍는다 */
  async function shoot(name: string) {
    const scroller = page.locator(".ep-scroll");
    await scroller.evaluate((el) => el.scrollTo(0, 0));
    const { h, view, over } = await scroller.evaluate((el) => ({ h: el.scrollHeight, view: el.clientHeight, over: document.documentElement.scrollWidth > window.innerWidth || el.scrollWidth > el.clientWidth }));
    if (over) wide++;
    const n = Math.max(1, Math.ceil((h - 24) / (view - 80)));
    for (let i = 0; i < n; i++) {
      await scroller.evaluate((el, top) => el.scrollTo(0, top), i * (view - 80));
      await page.waitForTimeout(300);
      const file = `${name}${i ? `-${String.fromCharCode(97 + i)}` : ""}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      shots.push(file);
    }
  }

  const res = await page.goto(`${BASE}${URL_PATH}`);
  if (res?.status() !== 200) throw new Error(`${res?.status()} ${BASE}${URL_PATH} — 미리 보기 주소가 없다 (local/<code>/ 에 episode.json · story.json 이 있나 · 빌드에 실렸나)`);
  await settle(2200);
  const short = (await root.getAttribute("data-testid")) === "short";
  const NO = short ? SHORT_NO : LONG_NO;
  const news = await linesOf(page.getByTestId("cover-news"));
  const title = await linesOf(page.locator(".ep-title-cover"));
  // 미리 보기 띠 (맨 위 30px 남짓 — 실제 화면에는 없다)만큼은 빼고 잰다
  const bar = (await page.getByTestId("lp-bar").count()) ? await page.getByTestId("lp-bar").evaluate((el) => Math.round(el.getBoundingClientRect().height)) : 0;
  const askBottom = (await page.getByTestId("ask").first().evaluate((el) => Math.round(el.getBoundingClientRect().bottom))) - bar;
  const scenes: string[] = [];

  for (let guard = 0; guard < 12; guard++) {
    const id = await sceneId();
    scenes.push(id);
    const no = NO[id] ?? "99";
    if (!short && (id === "tools" || id === "next")) {
      // 처음 온 독자 — "이거 알아요?" 에 전부 "처음 들어요" (본문이 펴진다)
      const fresh = page.locator(".ep-tool-ask button[data-primary]");
      while (await fresh.count()) {
        await fresh.first().click();
        await page.waitForTimeout(250);
      }
      await settle(700);
    }
    if (!short && id === "aha") {
      await shoot(`05-aha-before`);
      if (await page.getByTestId("lab-act").count()) {
        await page.getByTestId("lab-act").click();
        await settle(3200);
        if (await page.getByTestId("lab-go-on").count()) {
          await page.getByTestId("lab-go-on").click();
          await settle(1500);
        }
        if (await page.locator(".fr-choose button").count()) {
          await page.locator(".fr-choose button").first().click();
          await settle(2000);
        }
      }
      if (await page.getByTestId("lab-gate-open").count()) {
        await page.getByTestId("lab-gate-open").click();
        await settle(1200);
      }
      await shoot(`06-aha-after`);
      // 근거 시트 — 근거를 켜고 터진 문서 문장 (없으면 풀이의 첫 근거 글)을 누른다
      await page.getByTestId("src-toggle").click();
      await settle(500);
      const burst = page.locator("[data-testid=burst] .ep-src-hit");
      const mark = (await burst.count()) ? burst.first() : page.locator(".ep-scene .ep-src-hit").first();
      if (await mark.count()) {
        await mark.scrollIntoViewIfNeeded();
        await mark.click();
        await settle(900);
        await page.screenshot({ path: path.join(OUT, `06-aha-after-sheet.png`) });
        shots.push("06-aha-after-sheet.png");
        await page.locator(".ep-sheet header button").click();
        await settle(500);
      }
      await page.getByTestId("src-toggle").click();
      await settle(400);
    } else {
      await shoot(`${no}-${id}`);
    }
    if (id === "keep" || (await page.getByTestId("ask").count()) === 0) break;
    await page.getByTestId("ask").first().click();
    await settle();
  }
  await browser.close();

  console.log(`찍음 ${shots.length} 장 → ${OUT}`);
  console.log(`주소 ${BASE}${URL_PATH} · ${short ? "짧은 이야기" : "긴 이야기"} · 장면 ${scenes.join(" → ")}`);
  console.log(`표지: 뉴스 한 줄 ${news === null ? "없음" : `${news} 줄`} · 큰 제목 ${title} 줄 · 물음 단추 아래 끝 ${askBottom} / 화면 844 (${askBottom <= 844 ? "한 화면에 든다" : "첫 화면 밖 — 내려야 보인다"}${bar ? ` · 미리 보기 띠 ${bar}px 뺌` : ""})`);
  if (news !== null && news > 1) console.log("경고 — 뉴스 한 줄이 폰에서 두 줄 이상이다 (D130 e) — 줄인다");
  if ((title ?? 0) > 2) console.log("경고 — 큰 제목이 폰에서 두 줄을 넘는다 (법 3)");
  console.log(`가로 넘침 ${wide} · 콘솔 · 페이지 오류 ${errors.length}`);
  for (const e of errors) console.log(`  ${e}`);
  for (const f of shots) console.log(`  ${f}`);
  failed = wide + errors.length;
} catch (e) {
  console.log(`FAIL — ${(e as Error).message}`);
  failed = 1;
} finally {
  stop();
}
process.exit(failed ? 1 : 0);
