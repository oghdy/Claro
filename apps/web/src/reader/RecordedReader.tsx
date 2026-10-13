"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type { ArticlePackage } from "@claro/contract";
import type { ArticleKey } from "./place";
import { Reader, type ReaderMoment } from "./Reader";
import { createRecorder, type Recorder } from "./record";

/**
 * 읽는 화면(Reader)에 읽기 기록을 붙인 것. 화면에 보이는 것은 Reader 그대로다 — `after` 가 있으면 마지막 장의 끝 묶음에 그것 하나가 더해진다.
 * **동의한 독자의 화면에서만 쓴다** (study/Study.tsx). 기록기는 첫 순간이 올 때 만든다. 기록에서 무슨 일이 나도 화면에는 닿지 않는다.
 * 시험 경로(/test) · 링크 없이 온 사람은 Reader 를 바로 쓴다 — 기록하지 않는다 (OBSERVATION §3).
 */
export function RecordedReader({ pkg, article, user_id, after }: { pkg: ArticlePackage; article: ArticleKey; user_id: string; after?: ReactNode }) {
  const recorder = useRef<Recorder | null | undefined>(undefined);
  const onMoment = useCallback(
    (m: ReaderMoment) => {
      try {
        if (recorder.current === undefined) recorder.current = createRecorder(pkg, article, user_id);
        recorder.current?.note(m);
      } catch {
        recorder.current = null; // 기록을 못 하게 됐다 — 읽는 것은 그대로다
      }
    },
    [pkg, article, user_id],
  );
  return <Reader pkg={pkg} onMoment={onMoment} after={after} />;
}
