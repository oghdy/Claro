// 원문 가져오기 (P-1). 정직한 User-Agent 하나로 GET 한 번, 리다이렉트는 따라간다. 막히면 막힌 대로 적는다 — 우회하지 않는다.
// 받은 바이트는 git 밖 캐시(packages/pipeline/.cache/raw)에 둔다. 캐시가 있으면 다시 받지 않는다 (--refetch 가 아니면).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sha256 } from "./extract.ts";

export const USER_AGENT = "ClaroPipeline/0.1 (source archiving for fact checks; +https://github.com/oghdy/Claro)";

export type Fetched = {
  requested_url: string;
  fetched_at: string;            // ISO 8601 UTC — 응답을 받은 때
  final_url: string;             // 리다이렉트 뒤
  redirected: boolean;
  http_status: number;
  content_type: string | null;
  last_modified: string | null;  // 응답 머리의 Last-Modified (있으면). 공개 시각의 증명이 아니다 — 그 파일이 마지막으로 바뀐 때라고 서버가 말한 것
  raw_sha256: string;
  raw_bytes: number;
  error: string | null;          // 네트워크 오류
};

export function cacheDir(root: string, ...parts: string[]): string {
  const d = join(root, "packages/pipeline/.cache", ...parts);
  mkdirSync(d, { recursive: true });
  return d;
}

const safe = (label: string) => label.replace(/[^\w.-]/g, "_");

export function readCached(root: string, label: string): { meta: Fetched; bytes: Uint8Array } | null {
  const d = cacheDir(root, "raw");
  const m = join(d, `${safe(label)}.json`);
  const b = join(d, `${safe(label)}.bin`);
  if (!existsSync(m) || !existsSync(b)) return null;
  return { meta: JSON.parse(readFileSync(m, "utf8")), bytes: new Uint8Array(readFileSync(b)) };
}

const lastHit = new Map<string, number>();

export async function fetchOnce(url: string): Promise<{ meta: Fetched; bytes: Uint8Array }> {
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + 1500 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf,*/*" }, signal: AbortSignal.timeout(60_000) });
    const bytes = new Uint8Array(await res.arrayBuffer());
    return {
      bytes,
      meta: {
        requested_url: url, fetched_at: new Date().toISOString(), final_url: res.url, redirected: res.redirected || res.url !== url,
        http_status: res.status, content_type: res.headers.get("content-type"), last_modified: res.headers.get("last-modified"),
        raw_sha256: sha256(bytes), raw_bytes: bytes.length, error: null,
      },
    };
  } catch (e) {
    const bytes = new Uint8Array();
    return {
      bytes,
      meta: {
        requested_url: url, fetched_at: new Date().toISOString(), final_url: url, redirected: false, http_status: 0, content_type: null,
        last_modified: null, raw_sha256: sha256(bytes), raw_bytes: 0, error: String((e as Error).cause ?? (e as Error).message ?? e),
      },
    };
  }
}

export function writeCached(root: string, label: string, got: { meta: Fetched; bytes: Uint8Array }): void {
  const d = cacheDir(root, "raw");
  writeFileSync(join(d, `${safe(label)}.bin`), got.bytes);
  writeFileSync(join(d, `${safe(label)}.json`), JSON.stringify(got.meta, null, 2) + "\n");
}

export function writeCachedText(root: string, label: string, text: string): string {
  const p = join(cacheDir(root, "text"), `${safe(label)}.txt`);
  writeFileSync(p, text);
  return p;
}

export function readCachedText(root: string, label: string): string | null {
  const p = join(root, "packages/pipeline/.cache/text", `${safe(label)}.txt`);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
