"use client";

import { useState } from "react";
import { LayoutGroup, motion, useAnimationControls } from "motion/react";
import { CHROME } from "../chrome";
import { Rich } from "../parts";
import { PICTURES } from "./pictures";
import type { ToggleFrame } from "./types";

// 틀: 켜고 끄기 — 독자가 같은 버튼을 두 번 누른다.
//   꺼졌을 때: 누르면 된다 (움직이는 자리의 표가 내려가고 알갱이가 옮겨 온다)
//   켜졌을 때: 같은 버튼 → 막힌다. 두 표가 묶여 있다
// UX-1 의 배달앱 풀이(episodes/delivery/Mechanism.tsx)를 그대로 옮겼다 — 모양 · 움직임 값은 한 글자도 바꾸지 않았고, 글과 그림의 수만 데이터로 뺐다.
// 그림에는 숫자가 없다 — 지어낸 값을 쓰지 않으려고. 높낮이와 글자로만 말한다 (drawn 의 수는 높낮이 · 점의 수일 뿐이다).
//
// seen: 이 그림을 본 독자 (D61 ②) — 탭 · 버튼 · 설명 없이 그림의 끝 모습(켜졌고 · 막혔다)만. "다시 해 보기"로 처음처럼 해 볼 수 있다.

type Rule = "off" | "on";
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

export function ToggleCard({ frame: f, seen = false }: { frame: ToggleFrame; seen?: boolean }) {
  const [redo, setRedo] = useState(false);
  const still = seen && !redo;
  const [rule, setRule] = useState<Rule>("off");
  const [done, setDone] = useState<Record<Rule, boolean>>({ off: false, on: false });
  const tag = useAnimationControls();
  const link = useAnimationControls();

  // 그림은 틀의 데이터가 아니다 — 개념의 그림 부품 (pictures.ts). 계약의 틀은 이름만 가리킨다
  const st = PICTURES[f.picture.id]!;
  const [big, small] = st.sides;
  const guests = Array.from({ length: st.drawn.tokens }, (_, i) => i);
  const on = still || rule === "on";
  const lowered = !still && rule === "off" && done.off;
  const blocked = still || (rule === "on" && done.on);
  // 알갱이 — 버티는 자리에 많고 움직이는 자리에 적다. 움직이는 자리가 더 싸지면 몇이 옮겨 온다
  const inSmall = lowered ? st.drawn.startInMover + st.drawn.moved : st.drawn.startInMover;

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

  const caption = rule === "off" ? (done.off ? f.caption.off_after : f.caption.off_before) : done.on ? f.caption.on_after : f.caption.on_before;

  return (
    <LayoutGroup>
      <div className="ep-lab" data-rule={on ? "on" : "off"} data-seen={still ? "" : undefined} data-picture={f.picture.id} data-testid="lab">
        {still ? (
          <p className="fr-seen">{CHROME.seen.label}</p>
        ) : (
          <div className="ep-lab-tabs" role="tablist">
            {(["off", "on"] as const).map((r) => (
              <button key={r} type="button" role="tab" aria-selected={rule === r} onClick={() => setRule(r)} data-testid={`lab-tab-${r}`}>
                {f.tabs[r]}
              </button>
            ))}
          </div>
        )}

        <div className="ep-lab-stage">
          {on ? (
            <motion.p className="ep-lab-rule" initial={still ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {f.device.on}
            </motion.p>
          ) : (
            <p className="ep-lab-rule" data-none>
              {f.device.off}
            </p>
          )}

          <div className="ep-lab-apps">
            <div className="ep-app" data-app="big">
              <h3>{big.name}</h3>
              <p className="ep-app-fee">
                <i style={{ width: `${st.drawn.bars[0]}%` }} />
                <span>{big.bar}</span>
              </p>
              <div className="ep-app-rail">
                <div className="ep-app-tag">{st.tag}</div>
              </div>
              <div className="ep-app-guests" aria-label={`${st.tokens} ${guests.length - inSmall}`}>
                {guests.slice(inSmall).map((g) => (
                  <motion.span key={g} layoutId={`guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>

            <div className="ep-lab-link" aria-hidden="true">
              {on ? (
                <motion.span animate={link} initial={still ? false : { scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}>
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
              <div className="ep-app-rail">
                <motion.div animate={{ y: lowered ? 26 : 0 }} transition={SPRING}>
                  <motion.div className="ep-app-tag" data-low={lowered ? "" : undefined} animate={tag}>
                    {st.tag}
                  </motion.div>
                </motion.div>
              </div>
              <div className="ep-app-guests" aria-label={`${st.tokens} ${inSmall}`}>
                {guests.slice(0, inSmall).map((g) => (
                  <motion.span key={g} layoutId={`guest-${g}`} transition={SPRING} />
                ))}
              </div>
            </div>
          </div>

          <p className="ep-lab-state" data-kind={lowered ? "low" : blocked ? "blocked" : "same"}>
            {lowered ? `${small.name}: ${f.state.moved}` : blocked ? f.state.blocked : f.state.idle}
          </p>
        </div>

        {still ? (
          <button type="button" className="ep-link fr-redo" onClick={() => setRedo(true)} data-testid="seen-redo">
            {CHROME.seen.redo}
          </button>
        ) : (
          <>
            <div className="ep-lab-actions">
              <motion.button type="button" className="ep-lab-act" onClick={act} whileTap={{ scale: 0.97 }} disabled={lowered} data-testid="lab-act">
                {f.action}
              </motion.button>
              {done[rule] ? (
                <button type="button" className="ep-link" onClick={() => setDone((d) => ({ ...d, [rule]: false }))}>
                  {f.again}
                </button>
              ) : null}
            </div>

            <p className="ep-lab-caption" aria-live="polite" data-testid="lab-caption">
              <Rich text={caption.t} />
            </p>

            {rule === "off" && done.off ? (
              <motion.button type="button" className="ep-lab-nextrule" onClick={() => setRule("on")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }} data-testid="lab-go-on">
                {f.go_on}
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            ) : null}
          </>
        )}
      </div>
    </LayoutGroup>
  );
}
