"use client";

import { PagesCard } from "./Pages";
import { StepsCard } from "./Steps";
import { ToggleCard } from "./Toggle";
import type { ChainFrame, Frame, SeatsFrame } from "./types";

// 체험 한 장 — 회차의 틀 데이터(solve.lab.frames)를 받아 맞는 틀 부품을 세운다. 회차는 화면 부품을 가져오지 않는다.
// 지금 서는 조합 (실물이 있는 것만 — D24):
//   [켜고 끄기]                                  배달앱 1화
//   [어디서 멈추나] · [자리에 앉기] · 그 둘을 이은 것     금리 2화
//   [넘겨 보기]                                  개인정보 1화 (UX-5)
// 켜고 끄기 · 넘겨 보기를 다른 틀과 잇는 것은 아직 없다 (실물이 없다 — 계약 불변식 15 가 그런 조합을 거부한다).

export const isSteps = (frames: readonly Frame[]): frames is readonly (ChainFrame | SeatsFrame)[] => frames.length > 0 && frames.every((f) => f.kind === "chain" || f.kind === "seats");
export const isToggle = (frames: readonly Frame[]) => frames.length === 1 && frames[0]!.kind === "toggle";
export const isPages = (frames: readonly Frame[]) => frames.length === 1 && frames[0]!.kind === "pages";

export function LabCard({ frames, seen }: { frames: readonly Frame[]; seen: boolean }) {
  const first = frames[0];
  if (frames.length === 1 && first?.kind === "toggle") return <ToggleCard frame={first} seen={seen} />;
  if (frames.length === 1 && first?.kind === "pages") return <PagesCard frame={first} seen={seen} />;
  if (isSteps(frames)) return <StepsCard frames={frames} seen={seen} />;
  return null;
}
