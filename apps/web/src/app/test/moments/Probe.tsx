"use client";

import type { ArticlePackage } from "@claro/contract";
import { Reader, type ReaderMoment } from "../../../reader/Reader";

// 화면이 아는 순간(Reader 의 notice)을 window.__moments 에 쌓는다 — 테스트가 읽는다. 아무 데도 보내지 않는다
export function Probe({ pkg }: { pkg: ArticlePackage }) {
  return (
    <Reader
      pkg={pkg}
      onMoment={(m) => {
        const w = window as unknown as { __moments?: ReaderMoment[] };
        (w.__moments ??= []).push(m);
      }}
    />
  );
}
