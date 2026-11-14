"use client";

import { Episode } from "../../../episode/kit/Episode";
import { CoverArt as DeliveryArt } from "../../../episode/episodes/delivery/Art";
import { Glyph as DeliveryGlyph } from "../../../episode/episodes/delivery/Glyph";
import { DELIVERY } from "../../../episode/episodes/delivery/data";
import { CoverArt as FomcArt } from "../../../episode/episodes/fomc/Art";
import { Glyph as FomcGlyph } from "../../../episode/episodes/fomc/Glyph";
import { FOMC } from "../../../episode/episodes/fomc/data";
import { CoverArt as PipcArt } from "../../../episode/episodes/pipc/Art";
import { Glyph as PipcGlyph } from "../../../episode/episodes/pipc/Glyph";
import { PIPC } from "../../../episode/episodes/pipc/data";
import { PRIVACY } from "./copy";
import { PriceCard } from "./PriceCard";
import { PrivacyCard } from "./PrivacyCard";
import { RateCard } from "./RateCard";

// UX-9 — 세 이야기의 **원래 회차 화면 그대로**에 체험 자리만 새 체험을 끼운다 (kit/Episode 의 시안 전용 칸 play).
// 회차의 글 · 근거 · 도구 · 장면의 차례 · 답 감추기는 골든 · 뼈대의 것 그대로다. 실제 주소 (/s/*) · 회차 시안 (/lab/episode/*)은 이 파일을 읽지 않는다.
// jump — 풀이 장면을 바로 연다 (도윤이 체험만 다시 해 볼 때 · 그림을 찍을 때). 없으면 표지부터.

const PRICE_PLAY = { Card: PriceCard };
const RATE_PLAY = { Card: RateCard };
// 개인정보 — 머리와 준비 글 둘째 줄이 바뀐다 (넘기기 전에 핀을 꽂으라는 말이 있어야 한다). 첫 줄은 골든 그대로
const PRIVACY_PLAY = { Card: PrivacyCard, title: PRIVACY.title, setup: [PIPC.solve.lab!.setup[0]!, PRIVACY.setup] };

export function PricePlay({ jump }: { jump?: boolean }) {
  return <Episode ep={DELIVERY} Art={DeliveryArt} Glyph={DeliveryGlyph} play={PRICE_PLAY} start={jump ? { scene: "aha" } : undefined} />;
}
export function RatePlay({ jump }: { jump?: boolean }) {
  return <Episode ep={FOMC} Art={FomcArt} Glyph={FomcGlyph} play={RATE_PLAY} start={jump ? { scene: "aha" } : undefined} />;
}
export function PrivacyPlay({ jump }: { jump?: boolean }) {
  return <Episode ep={PIPC} Art={PipcArt} Glyph={PipcGlyph} play={PRIVACY_PLAY} start={jump ? { scene: "aha" } : undefined} />;
}
