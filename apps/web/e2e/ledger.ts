// 원장에 남은 것을 읽는다 — 켜져 있는 테스트 서버의 /api/peek (CLARO_PEEK=1 일 때만 있다). 독자 하나의 열람들
import { expect, type APIRequestContext } from "@playwright/test";

export interface PeekReading {
  reading_id: string;
  user_id: string;
  session_id: string;
  plans: Record<string, any>[];
  events: Record<string, any>[];
  summary: {
    completed: boolean; completed_to_end: boolean; stopped_at: { level: string; slide_index: number } | null;
    stopped_end_shown: boolean; furthest: Record<string, number>; switched_from: string[];
  };
  check: { conforms: boolean; issues: { code: string; seq: number | null }[]; missing_seq: number[] };
}

export async function readings(request: APIRequestContext, user_id: string, base = ""): Promise<PeekReading[]> {
  const res = await request.get(`${base}/api/peek?user_id=${user_id}`);
  expect(res.status(), "/api/peek").toBe(200);
  return (await res.json()).readings;
}

/** 사건을 seq 순서로, 사람이 읽는 줄로 — "ENTERED basic 0" · "END basic 0" · "SWITCHED basic>advanced" */
export function lines(r: PeekReading): string[] {
  const level = Object.fromEntries(r.plans.map((p) => [p.plan_id, p.level]));
  return r.events.map((e) =>
    e.type === "LEVEL_SWITCHED" ? `SWITCHED ${level[e.from_plan_id]}>${level[e.plan_id]}`
      : `${e.type === "SLIDE_ENTERED" ? "ENTERED" : e.type === "SLIDE_END_SHOWN" ? "END" : e.type} ${level[e.plan_id]} ${e.slide_index}`);
}

/** 그 독자의 열람이 하나이고 사건이 n 줄이 될 때까지 기다린다 (화면은 보내는 것을 기다리지 않는다 — 원장이 조금 늦다) */
export async function settledLedger(request: APIRequestContext, user_id: string, n: number, timeout = 15_000, base = ""): Promise<PeekReading> {
  await expect.poll(async () => (await readings(request, user_id, base)).map((r) => r.events.length), { timeout, message: `원장의 사건 수 ${n}` }).toEqual([n]);
  return (await readings(request, user_id, base))[0]!;
}

export const PLAN_FIELDS = [
  "plan_id", "user_id", "session_id", "reading_id", "article_id", "article_version", "created_at", "level", "level_chosen_by",
  "estimator_version", "selected_blocks", "skipped_blocks", "block_decisions", "narrative_form", "probe_plan",
];
export const EVENT_FIELDS = ["event_id", "user_id", "session_id", "reading_id", "plan_id", "seq", "occurred_at", "type", "slide_index", "from_plan_id"];

/** 물음 쪽 — 그 독자의 동의 · 노출 · 응답 · 증거. 보여준 순서대로 */
export interface PeekStudy {
  consents: Record<string, any>[];
  exposures: Record<string, any>[];
  responses: Record<string, any>[];
  evidence: Record<string, any>[];
  probes: Record<string, any>[];
  readings: PeekReading[];
}
export async function study(request: APIRequestContext, user_id: string, base = ""): Promise<PeekStudy> {
  const res = await request.get(`${base}/api/peek?user_id=${user_id}`);
  expect(res.status(), "/api/peek").toBe(200);
  return res.json();
}

/** 화면이 아직 못 보낸 줄의 수 (보낼 줄 — study/outbox.ts) */
export const unsent = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (JSON.parse(sessionStorage.getItem("claro:outbox") ?? "null")?.unsent ?? []).length as number);

/**
 * 독자의 링크로 기사에 들어간다 — 독자처럼: 안내를 읽고 "시작할게요"를 누르고, 읽기 전 물음은 건너뛴다. 이미 지나온 화면이면(새로고침 · 복제) 그대로 기사다.
 * 누르는 것이 곧 "사람이 손을 댔다"이다 (D35)
 */
export async function enter(page: import("@playwright/test").Page, user_id: string, base = "") {
  await page.goto(`${base}/?r=${user_id}`);
  await page.locator(".study, .r-deck").first().waitFor();
  if (await page.locator(".study").isVisible()) {
    await page.locator(".s-go").click(); // 알겠어요, 시작할게요
    await page.locator(".s-skip").click(); // 읽기 전 물음 — 건너뛰기
  }
  await page.locator(".r-deck").waitFor();
  await page.evaluate(() => document.fonts.ready);
}
