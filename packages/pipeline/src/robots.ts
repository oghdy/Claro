// robots.txt (P-2 · D40 "robots · 약관이 막으면 우회하지 않고 못 가져옴"). RFC 9309 의 뜻 그대로, 이 도구에 필요한 만큼만.
//
//   - 우리 이름(USER_AGENT 의 첫 낱말 "ClaroPipeline")에 맞는 무리가 있으면 그 무리, 없으면 "*" 무리의 규칙을 쓴다
//   - Allow · Disallow 중 경로에 맞는 가장 긴 규칙이 이긴다. 길이가 같으면 Allow. "*" 는 아무 글자 · 끝의 "$" 는 경로 끝
//   - 빈 Disallow 는 규칙이 아니다 (= 다 된다)
//   - robots.txt 가 4xx (없음 · 막힘) → 다 된다 (RFC 9309 §2.3.1.3). 5xx · 네트워크 오류 → 다 막힌 것으로 본다 (§2.3.1.4)
// 받은 robots.txt 는 기록에 해시 · 상태로 남긴다 — 그때 무엇이 우리를 막았는지 / 안 막았는지.
import { USER_AGENT } from "./fetch.ts";
import { sha256 } from "./extract.ts";

export const ROBOTS_VERSION = "p2-robots/1 (RFC 9309 — 가장 긴 규칙 · 같으면 Allow · 4xx 는 허용 · 5xx 는 막힘)";
export const AGENT_TOKEN = (USER_AGENT.split("/")[0] ?? "").toLowerCase(); // "claropipeline"

type Rule = { allow: boolean; pattern: string };

export function parseRobots(txt: string, token = AGENT_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let cur: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = (m[1] ?? "").toLowerCase();
    const val = (m[2] ?? "").trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === "allow" || key === "disallow") {
      if (val === "") continue;
      cur.rules.push({ allow: key === "allow", pattern: val });
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && token.startsWith(a)));
  const use = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return use.flatMap((g) => g.rules);
}

function patternRe(p: string): RegExp {
  const end = p.endsWith("$");
  const body = (end ? p.slice(0, -1) : p).split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp("^" + body + (end ? "$" : ""));
}

export function allowed(rules: Rule[], pathAndQuery: string): { ok: boolean; rule: string | null } {
  let best: Rule | null = null;
  for (const r of rules) {
    if (!patternRe(r.pattern).test(pathAndQuery)) continue;
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow && !best.allow)) best = r;
  }
  return { ok: best ? best.allow : true, rule: best ? `${best.allow ? "Allow" : "Disallow"}: ${best.pattern}` : null };
}

export type RobotsRecord = { host: string; url: string; fetched_at: string; http_status: number; sha256: string | null; error: string | null; reading: string };

const seen = new Map<string, { rec: RobotsRecord; rules: Rule[] | "ALL" | "NONE" }>();

export async function robotsFor(url: string): Promise<{ rec: RobotsRecord; rules: Rule[] | "ALL" | "NONE" }> {
  const u = new URL(url);
  const hit = seen.get(u.host);
  if (hit) return hit;
  const rurl = `${u.protocol}//${u.host}/robots.txt`;
  const fetched_at = new Date().toISOString();
  let out: { rec: RobotsRecord; rules: Rule[] | "ALL" | "NONE" };
  try {
    const res = await fetch(rurl, { redirect: "follow", headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
    const txt = await res.text();
    if (res.status >= 200 && res.status < 300) {
      out = { rec: { host: u.host, url: rurl, fetched_at, http_status: res.status, sha256: sha256(txt), error: null, reading: "규칙을 읽었다" }, rules: parseRobots(txt) };
    } else if (res.status >= 400 && res.status < 500) {
      out = { rec: { host: u.host, url: rurl, fetched_at, http_status: res.status, sha256: null, error: null, reading: "4xx — 규칙 없음으로 본다 (RFC 9309 §2.3.1.3)" }, rules: "NONE" };
    } else {
      out = { rec: { host: u.host, url: rurl, fetched_at, http_status: res.status, sha256: null, error: null, reading: "5xx 등 — 다 막힌 것으로 본다 (RFC 9309 §2.3.1.4)" }, rules: "ALL" };
    }
  } catch (e) {
    out = { rec: { host: u.host, url: rurl, fetched_at, http_status: 0, sha256: null, error: String((e as Error).message ?? e), reading: "닿지 않음 — 다 막힌 것으로 본다 (RFC 9309 §2.3.1.4)" }, rules: "ALL" };
  }
  seen.set(u.host, out);
  return out;
}

export async function robotsAllows(url: string): Promise<{ ok: boolean; why: string; rec: RobotsRecord }> {
  const { rec, rules } = await robotsFor(url);
  const u = new URL(url);
  if (rules === "NONE") return { ok: true, why: rec.reading, rec };
  if (rules === "ALL") return { ok: false, why: `robots.txt ${rec.reading}`, rec };
  const a = allowed(rules, u.pathname + u.search);
  return { ok: a.ok, why: a.rule ? `robots.txt 규칙 "${a.rule}"` : "robots.txt 에 맞는 규칙 없음 — 된다", rec };
}
