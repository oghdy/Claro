import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArticlePackage, type ArticlePackage } from "@claro/contract";

const FIXTURES = path.join(process.cwd(), "../../fixtures");

/** 빌드 시점에 읽고 검증한다. 계약을 어기면 빌드가 실패한다. `_` 주석은 빠진 채로 돌아온다. */
export function loadRaw(name: string): unknown {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), "utf-8"));
}

export function loadPackage(name: string): ArticlePackage {
  return parseArticlePackage(loadRaw(name));
}

/** 지금 화면이 보여주는 판 — 골든의 record 파일 (판의 키 · 저작 데이터 · 패키지 파일 이름). 화면(빌드할 때)과 seed 가 같은 것을 읽는다 */
export const GOLDEN_RECORD = "fomc-2026-09.record.json";
