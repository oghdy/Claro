"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, animate, motion, useAnimationControls, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { DELIVERY } from "../../../episode/episodes/delivery/data";
import { PICTURES } from "../../../episode/kit/frames/pictures";
import type { ToggleFrame } from "../../../episode/kit/frames/types";
import { Txt } from "../../../episode/kit/parts";
import type { T } from "../../../episode/kit/types";
import { PRICE } from "./copy";

// UX-9 — 배달앱의 진짜 체험: **내가 값을 정한다 → 요구가 그 값을 되돌린다.**
// 지금 체험 (kit/frames/Toggle)은 같은 단추를 두 번 누른다 (요구 없을 때 · 있을 때). 여기서는
//   ① 새 앱의 값표를 **내 손으로 끌어 내려** 값을 정한다 (얼마나 내릴지 내가 고른다) → 그 값으로 판다 (손님이 옮겨 온다)
//   ② 큰 앱의 요구가 온다 → 내가 내려 둔 값표가 **제자리로 끌려 올라가고**, 내가 정했던 자리는 점선으로 남는다
//   ③ 다시 끌어 내린다 → 이번에는 **두 값표가 같이 끌려 내려오다가** 튕겨 돌아간다 (묶였다)
// 그림 · 글은 골든의 켜고 끄기 틀 그대로다 (같은 그림 부품 mfn-tie · 같은 caption 넷 가운데 셋). 새 글은 ./copy.ts 의 PRICE 뿐이고 사실이 없다.
// 그리지 않는 것 (골든 not_drawn): 메뉴값 · 수수료의 숫자 — 값표의 높낮이와 글자뿐이다. 눈금 셋 (같은 값 · 조금 싸게 · 더 싸게)에도 수가 없다.
// 채점하지 않는다 — 어느 눈금에 놓아도 맞고 틀림이 없다. 독자 기록 없음 — 고른 값은 이 부품 안에만 있다.

type Stage = "set" | "sold" | "tied" | "blocked";
const STEP = 24;
const MAX = 2;
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

export function PriceCard({ onDone }: { onDone: () => void }) {
  const f = DELIVERY.solve.lab!.frames[0] as ToggleFrame;
  const st = PICTURES[f.picture.id]!;
  const [big, small] = st.sides;
  const [stage, setStage] = useState<Stage>("set");
  /** 내가 정한 값 — 눈금 (0 같은 값 · 1 조금 싸게 · 2 더 싸게) */
  const [level, setLevel] = useState(0);
  const y = useMotionValue(0);
  const still = useReducedMotion();
  const link = useAnimationControls();
  const shake = useAnimationControls();
  const tied = stage === "tied" || stage === "blocked";

  useEffect(() => {
    if (stage === "blocked") onDone();
  }, [stage, onDone]);

  const to = (v: number) => animate(y, v, still ? { duration: 0 } : SPRING);
  const place = (n: number) => {
    const next = Math.max(0, Math.min(MAX, n));
    setLevel(next);
    void to(next * STEP);
  };
  /** 묶인 값표를 내리려 했다 — 같이 내려오다가 튕겨 돌아간다 */
  const bounce = (from: number) => {
    setStage("blocked");
    if (still) y.set(0);
    else void animate(y, [from, Math.max(from, 14), -3, 0], { duration: 0.55, times: [0, 0.3, 0.72, 1] });
    void link.start({ scale: [1, 1.28, 1], transition: { duration: 0.45 } });
    void shake.start({ x: [0, -5, 5, -3, 0], transition: { duration: 0.4, delay: 0.12 } });
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (tied) return info.offset.y > 8 ? bounce(y.get()) : void to(0);
    place(Math.round(y.get() / STEP));
  };
  const down = () => (tied ? bounce(0) : place(level + 1));
  const reset = () => {
    setStage("set");
    setLevel(0);
    y.set(0);
  };
  const demand = () => {
    setStage("tied");
    void to(0);
  };

  const guests = Array.from({ length: st.drawn.tokens }, (_, i) => i);
  const inSmall = stage === "sold" ? st.drawn.startInMover + st.drawn.moved : st.drawn.startInMover;
  const caption: T = stage === "set" ? (level === 0 ? PRICE.set : PRICE.picked) : stage === "sold" ? f.caption.off_after : stage === "tied" ? PRICE.tied : f.caption.on_after;
  const state = stage === "sold" ? `${small.name}: ${f.state.moved}` : stage === "blocked" ? f.state.blocked : stage === "tied" ? f.state.idle : level === 0 ? f.state.idle : `${small.name}: ${PRICE.levels[level]}`;
  const canDrag = stage !== "sold";

  return (
    <LayoutGroup>
      <div className="ep-lab pl-price" data-rule={tied ? "on" : "off"} data-stage={stage} data-level={level} data-testid="lab">
        <div className="ep-lab-stage">
          {tied ? (
            <motion.p className="ep-lab-rule" initial={{ opacity: 0, y: -14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} data-testid="price-demand">
              {f.device.on}
            </motion.p>
          ) : (
            <p className="ep-lab-rule" data-none>
              {f.device.off}
            </p>
          )}

          <motion.div className="ep-lab-apps" animate={shake}>
            <div className="ep-app" data-app="big">
              <h3>{big.name}</h3>
              <p className="ep-app-fee">
                <i style={{ width: `${st.drawn.bars[0]}%` }} />
                <span>{big.bar}</span>
              </p>
              <div className="ep-app-rail pl-rail">
                {/* 묶였을 때 — 새 앱의 값표를 끌면 이 값표도 같이 움직인다 */}
                <motion.div className="ep-app-tag" style={{ y: tied ? y : 0 }}>
                  {st.tag}
                </motion.div>
              </div>
              <div className="ep-app-guests" aria-label={`${st.tokens} ${guests.length - inSmall}`}>
                {guests.slice(inSmall).map((g) => (
                  <motion.span key={g} layoutId={`pl-guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>

            <div className="ep-lab-link" aria-hidden="true">
              {tied ? (
                <motion.span animate={link} initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}>
                  {st.tie}
                </motion.span>
              ) : null}
            </div>

            <div className="ep-app" data-app="small">
              <h3>{small.name}</h3>
              <p className="ep-app-fee">
                <i style={{ width: `${st.drawn.bars[1]}%` }} />
                <span>{small.bar}</span>
              </p>
              <div className="ep-app-rail pl-rail" data-drag={canDrag ? "" : undefined}>
                {/* 눈금 — 수가 없다. 자리뿐이다 */}
                {[0, 1, 2].map((n) => (
                  <i key={n} className="pl-notch" style={{ top: 8 + n * STEP + 14 }} data-on={!tied && level === n ? "" : undefined} aria-hidden="true" />
                ))}
                {/* 내가 정했던 값 — 요구가 온 뒤에도 그 자리에 남는다 */}
                {tied && level > 0 ? (
                  <motion.span className="pl-ghost" style={{ top: 8 + level * STEP }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} data-testid="price-ghost">
                    {PRICE.mine}
                  </motion.span>
                ) : null}
                <motion.div
                  className="ep-app-tag pl-tag"
                  data-low={!tied && level > 0 ? "" : undefined}
                  style={{ y }}
                  drag={canDrag ? "y" : false}
                  dragConstraints={{ top: 0, bottom: MAX * STEP }}
                  dragElastic={0.12}
                  dragMomentum={false}
                  onDragEnd={onDragEnd}
                  whileDrag={{ scale: 1.08 }}
                  data-testid="price-tag"
                >
                  {st.tag}
                  {canDrag ? (
                    <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 3v13M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </motion.div>
              </div>
              <div className="ep-app-guests" aria-label={`${st.tokens} ${inSmall}`}>
                {guests.slice(0, inSmall).map((g) => (
                  <motion.span key={g} layoutId={`pl-guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>
          </motion.div>

          <p className="ep-lab-state" data-kind={stage === "blocked" ? "blocked" : stage === "sold" || (stage === "set" && level > 0) ? "low" : "same"} data-testid="price-state">
            {state}
          </p>
        </div>

        {/* 끌기를 못 하는 손 · 읽기 도구를 위한 같은 일 — 단추로 */}
        {canDrag ? (
          <div className="pl-steps">
            <span>{PRICE.dragHint}</span>
            {!tied ? (
              <button type="button" onClick={() => place(level - 1)} disabled={level === 0} aria-label={PRICE.up} data-testid="price-up">
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            <button type="button" onClick={down} disabled={!tied && level === MAX} aria-label={PRICE.down} data-testid="price-down">
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 4v12M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}

        {stage === "set" ? (
          <div className="ep-lab-actions">
            <motion.button type="button" className="ep-lab-act" onClick={() => setStage("sold")} whileTap={{ scale: 0.97 }} disabled={level === 0} data-testid="price-commit">
              {PRICE.commit}
            </motion.button>
          </div>
        ) : null}

        <p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption">
          <Txt item={caption} />
        </p>

        {stage === "sold" ? (
          <motion.button type="button" className="ep-lab-nextrule" onClick={demand} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }} data-testid="lab-go-on">
            {f.go_on}
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        ) : null}
        {stage === "blocked" ? (
          <div className="pl-after">
            <span>{PRICE.retry}</span>
            <button type="button" className="ep-link" onClick={reset} data-testid="price-reset">
              {f.again}
            </button>
          </div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
