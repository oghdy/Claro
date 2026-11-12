"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CHROME } from "../chrome";
import { rise, Txt } from "../parts";
import type { PlainQuiet, PlainThree, SolveEntry } from "./types";

// 기본 풀이 — 체험이 없는 회차의 풀이 (UX-3 ⑤ · D61 ①). 억지 체험을 만들지 않는다.
//   가. 뒤집기만   첫 생각 → 깨는 사실 → `A ≠ B` 를 크게. 손짓은 근거 열어 보기뿐 (PlainFlipLead — 그 뒤는 장면의 "문서가 말한 것 · 누구의 말"이 잇는다)
//   나. 세 칸      확인된 것 / 아직 모르는 것 / 서로 다르게 말하는 것 — 차례로 연다 (PlainThreeCards)
//   다. 조용히     무슨 일 → 지금 아는 것 → 다음에 나올 것. 눌러 보기 없음 (PlainQuietBody)
// 색은 옳고 그름을 싣지 않는다 (D20). 서로 다르게 말하는 것은 같은 무게로 나란히 놓는다 (D46 ④).

/** 가. 뒤집기만 — 입구의 글 셋이 그대로 화면이 된다 */
export function PlainFlipLead({ entry }: { entry: SolveEntry }) {
  const c = CHROME.plain;
  return (
    <>
      <motion.div className="pl-thought" variants={rise} data-testid="plain-flip">
        <h2>{c.thought}</h2>
        <p>
          <Txt item={entry.first_thought} />
        </p>
      </motion.div>
      <motion.div className="pl-thought" data-kind="breaker" variants={rise}>
        <h2>{c.breaker}</h2>
        <p>
          <Txt item={entry.breaker} />
        </p>
      </motion.div>
    </>
  );
}

/** 나. 세 칸 — 첫 칸은 열려 있고, 단추로 다음 칸을 연다. 가운데 칸("아직 모르는 것")이 이 꼴의 맛이다 */
export function PlainThreeCards({ plain: p }: { plain: PlainThree }) {
  const c = CHROME.plain;
  const [open, setOpen] = useState(1);
  const labels = [c.known, c.unknown, c.differ] as const;
  const state = (i: number) => (i < open ? "open" : "closed");
  return (
    <motion.div className="pl-three" variants={rise} data-testid="plain-three">
      <section className="pl-card" data-kind="known" data-state={state(0)}>
        <h2>{labels[0]}</h2>
        <ul>
          {p.known.map((k) => (
            <li key={k.t}>
              <Txt item={k} />
            </li>
          ))}
        </ul>
      </section>

      <section className="pl-card" data-kind="unknown" data-state={state(1)}>
        <h2>{labels[1]}</h2>
        {open > 1 ? (
          <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {p.unknown.map((k) => (
              <li key={k.t}>
                <Txt item={k} />
              </li>
            ))}
          </motion.ul>
        ) : null}
      </section>

      <section className="pl-card" data-kind="differ" data-state={state(2)}>
        <h2>{labels[2]}</h2>
        {open > 2 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {p.differ.length ? (
              <div className="pl-differ">
                {p.differ.map((d) => (
                  <div key={d.who.t}>
                    <strong>
                      <Txt item={d.who} />
                    </strong>
                    <p>
                      <Txt item={d.says} />
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-none">{c.differNone}</p>
            )}
            {p.differ_note ? (
              <p className="pl-note">
                <Txt item={p.differ_note} />
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </section>

      {open < 3 ? (
        <motion.button type="button" className="ep-lab-nextrule pl-open" onClick={() => setOpen((n) => n + 1)} whileTap={{ scale: 0.98 }} data-testid="plain-open">
          {c.open} · {labels[open]}
        </motion.button>
      ) : null}
    </motion.div>
  );
}

/** 다. 조용히 — 차례대로 놓기만 한다 */
export function PlainQuietBody({ plain: p }: { plain: PlainQuiet }) {
  const c = CHROME.plain;
  const parts = [
    [c.quietWhat, p.what],
    [c.quietKnown, p.known],
    [c.quietComing, p.coming],
  ] as const;
  return (
    <div className="pl-quiet" data-testid="plain-quiet">
      {parts.map(([label, items]) => (
        <motion.section key={label} variants={rise}>
          <h2>{label}</h2>
          {items.map((k) => (
            <p key={k.t}>
              <Txt item={k} />
            </p>
          ))}
        </motion.section>
      ))}
    </div>
  );
}
