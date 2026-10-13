"use client";

import { useCallback, useRef } from "react";
import type { ArticlePackage } from "@claro/contract";
import type { ArticleKey } from "./place";
import { Reader, type ReaderMoment } from "./Reader";
import { createRecorder, type Recorder } from "./record";

/**
 * 본 화면 — 읽는 화면(Reader)에 읽기 기록을 붙인 것. 화면에 보이는 것은 Reader 그대로다.
 * 기록기는 첫 순간이 올 때 만든다 (브라우저에서만 · 링크에 독자 번호가 있을 때만). 기록에서 무슨 일이 나도 화면에는 닿지 않는다.
 * 시험 경로(/test)는 Reader 를 바로 쓴다 — 기록하지 않는다 (OBSERVATION §3).
 */
export function RecordedReader({ pkg, article }: { pkg: ArticlePackage; article: ArticleKey }) {
  const recorder = useRef<Recorder | null | undefined>(undefined);
  const onMoment = useCallback(
    (m: ReaderMoment) => {
      try {
        if (recorder.current === undefined) recorder.current = createRecorder(pkg, article);
        recorder.current?.note(m);
      } catch {
        recorder.current = null; // 기록을 못 하게 됐다 — 읽는 것은 그대로다
      }
    },
    [pkg, article],
  );
  return <Reader pkg={pkg} onMoment={onMoment} />;
}
