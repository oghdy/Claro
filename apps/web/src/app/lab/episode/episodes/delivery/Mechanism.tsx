"use client";

import { useState } from "react";
import { LayoutGroup, motion, useAnimationControls } from "motion/react";
import type { T } from "../../kit/types";
import { LAB } from "./data";

// "아!" 의 자리 — 독자가 가게 사장님이 되어 같은 버튼을 두 번 누른다.
//   요구가 없을 때: 새 앱에서 값을 내린다 → 손님이 옮겨 간다
//   요구가 있을 때: 같은 버튼 → 막힌다. 두 값이 묶여 있다
// 그림에는 숫자가 없다 — 지어낸 값(치킨 2만 원 같은)을 쓰지 않으려고. 높낮이와 "같은 값 / 더 싼 값" 글자로만 말한다.

type Rule = "off" | "on";
const GUESTS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

function Bold({ item }: { item: T }) {
  const parts = item.t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{parts.map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}</>;
}

export function Mechanism() {
  const c = LAB;
  const [rule, setRule] = useState<Rule>("off");
  const [done, setDone] = useState<Record<Rule, boolean>>({ off: false, on: false });
  const tag = useAnimationControls();
  const link = useAnimationControls();

  const lowered = rule === "off" && done.off;
  const blocked = rule === "on" && done.on;
  // 손님 여덟 — 큰 앱에 여섯 · 새 앱에 둘. 새 앱이 더 싸지면 셋이 옮겨 간다
  const inSmall = lowered ? 5 : 2;

  const act = () => {
    if (rule === "off") {
      setDone((d) => ({ ...d, off: true }));
      return;
    }
    setDone((d) => ({ ...d, on: true }));
    // 내려가려다 되돌아온다
    void tag.start({ y: [0, 13, -3, 0], transition: { duration: 0.55, times: [0, 0.35, 0.7, 1] } });
    void link.start({ scale: [1, 1.22, 1], transition: { duration: 0.45 } });
  };

  const caption = rule === "off" ? (done.off ? c.offAfter : c.offBefore) : done.on ? c.onAfter : c.onBefore;

  return (
    <LayoutGroup>
      <div className="ep-lab" data-rule={rule} data-testid="lab">
        <div className="ep-lab-tabs" role="tablist">
          {(["off", "on"] as const).map((r) => (
            <button key={r} type="button" role="tab" aria-selected={rule === r} onClick={() => setRule(r)} data-testid={`lab-tab-${r}`}>
              {r === "off" ? c.tabOff : c.tabOn}
            </button>
          ))}
        </div>

        <div className="ep-lab-stage">
          {rule === "on" ? (
            <motion.p className="ep-lab-rule" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {c.rule}
            </motion.p>
          ) : (
            <p className="ep-lab-rule" data-none>
              {c.noRule}
            </p>
          )}

          <div className="ep-lab-apps">
            <div className="ep-app" data-app="big">
              <h3>{c.big}</h3>
              <p className="ep-app-fee">
                <i style={{ width: "86%" }} />
                <span>{c.feeHigh}</span>
              </p>
              <div className="ep-app-rail">
                <div className="ep-app-tag">{c.price}</div>
              </div>
              <div className="ep-app-guests" aria-label={`${c.guests} ${GUESTS.length - inSmall}`}>
                {GUESTS.slice(inSmall).map((g) => (
                  <motion.span key={g} layoutId={`guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>

            <div className="ep-lab-link" aria-hidden="true">
              {rule === "on" ? (
                <motion.span animate={link} initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}>
                  =
                </motion.span>
              ) : null}
            </div>

            <div className="ep-app" data-app="small">
              <h3>{c.small}</h3>
              <p className="ep-app-fee">
                <i style={{ width: "34%" }} />
                <span>{c.feeLow}</span>
              </p>
              <div className="ep-app-rail">
                <motion.div animate={{ y: lowered ? 26 : 0 }} transition={SPRING}>
                  <motion.div className="ep-app-tag" data-low={lowered ? "" : undefined} animate={tag}>
                    {c.price}
                  </motion.div>
                </motion.div>
              </div>
              <div className="ep-app-guests" aria-label={`${c.guests} ${inSmall}`}>
                {GUESTS.slice(0, inSmall).map((g) => (
                  <motion.span key={g} layoutId={`guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>
          </div>

          <p className="ep-lab-state" data-kind={lowered ? "low" : blocked ? "blocked" : "same"}>
            {lowered ? `${c.small}: ${c.cheaper}` : blocked ? c.blocked : c.same}
          </p>
        </div>

        <div className="ep-lab-actions">
          <motion.button type="button" className="ep-lab-act" onClick={act} whileTap={{ scale: 0.97 }} disabled={lowered} data-testid="lab-act">
            {c.action}
          </motion.button>
          {done[rule] ? (
            <button type="button" className="ep-link" onClick={() => setDone((d) => ({ ...d, [rule]: false }))}>
              {c.again}
            </button>
          ) : null}
        </div>

        <p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption">
          <Bold item={caption} />
        </p>

        {rule === "off" && done.off ? (
          <motion.button type="button" className="ep-lab-nextrule" onClick={() => setRule("on")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }} data-testid="lab-go-on">
            {c.goOn}
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
