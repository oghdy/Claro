"use client";

import type { ReactNode } from "react";
import { ShortLineScreen } from "../../../../episode/Screen";
import { HOSPITAL } from "./data";

// 시안의 짧은 이야기 화면 (F-E3). 견본 (병원)은 실제 목록 (episode/catalog.tsx STORIES)에서 내렸다 — 한 사건 = 이야기 하나 (D91 ①).
// 그래서 주소의 이름 (code)으로 목록에서 찾지 않고 ./data.ts 의 줄을 바로 화면 부품에 올린다. 표지 그림 (부품)은 서버 페이지에서 넘길 수 없어 여기서 붙인다.
export function LabShort({ top }: { top?: ReactNode }) {
  return <ShortLineScreen line={HOSPITAL} top={top} />;
}
