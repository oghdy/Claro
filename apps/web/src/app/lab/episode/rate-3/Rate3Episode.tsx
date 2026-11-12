"use client";

import { MotionConfig, motion } from "motion/react";
import { Episode } from "../kit/Episode";
import { CHROME } from "../kit/chrome";
import { Rich, rise, stagger } from "../kit/parts";
import { CoverArt } from "../episodes/fomc/Art";
import { Glyph } from "../episodes/fomc";
import type { EpisodeData, ReaderFixture, ReaderId } from "../kit/types";
import type { COPY, Rate3 } from "./data";

// 3화 — 파일이 있으면 공통 뼈대 (kit/Episode)에 그대로 올리고, 없으면 기다리는 한 장. 표지 그림 · 도구 그림은 손 2화의 것 (같은 시리즈 · 같은 그림).
// 두 독자는 **손으로 적은 고정값**이다 (지식 상태를 추정하지 않는다): 따라온 독자가 아는 도구 = 파이프라인이 review.json 에 적은 follower_known (fomc-auto 와 같다).

function readers(known: string[]): Record<ReaderId, ReaderFixture> {
  return {
    new: { id: "new", label: "처음 온 독자", note: "이 시리즈가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
    follower: { id: "follower", label: "따라온 독자", note: "지난 화를 읽음", known, readZero: true, elsewhere: [{ series: "price", concepts: ["fee", "mfn", "provisional"] }] },
  };
}

function Waiting({ copy }: { copy: typeof COPY }) {
  const w = copy.wait;
  return (
    <MotionConfig reducedMotion="user">
      <div className="ep-root" data-episode="rate-3" data-scene="wait">
        <div className="ep-demo" role="group" aria-label={CHROME.chrome.readersAria}>
          <span className="ep-demo-tag">{CHROME.chrome.draft}</span>
        </div>
        <div className="ep-scroll">
          <motion.main className="ep-scene r3-wait" variants={stagger} initial="hidden" animate="show" data-testid="rate3-wait">
            <motion.div className="ep-series" variants={rise}>
              <span>{CHROME.chrome.seriesTag}</span>
              <strong>{w.series}</strong>
            </motion.div>
            <motion.div className="ep-cover-art r3-art" variants={rise}>
              <CoverArt />
            </motion.div>
            <motion.p className="ep-episode-no" variants={rise}>
              {w.no}
            </motion.p>
            <motion.h1 className="ep-title ep-title-cover" variants={rise}>
              <Rich text={w.title} />
            </motion.h1>
            <motion.p className="r3-when" variants={rise}>
              {w.when}
            </motion.p>
            {w.body.map((b) => (
              <motion.p key={b} className="ep-p" variants={rise}>
                {b}
              </motion.p>
            ))}
            <motion.div className="r3-links" variants={rise}>
              {w.links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </motion.div>
          </motion.main>
        </div>
      </div>
    </MotionConfig>
  );
}

export function Rate3Episode({ data, copy }: { data: Rate3; copy: typeof COPY }) {
  if (data.state === "waiting") return <Waiting copy={copy} />;
  const b = copy.banner;
  return (
    <div className="auto-wrap r3-wrap">
      <p className="auto-banner" data-testid="rate3-banner">
        <strong>{b.tag}</strong>
        <span>{data.state === "ok" && data.publishable ? b.ready : b.review}</span>
        <a href="/lab/episode/fomc">{b.hand}</a>
      </p>
      {data.state === "ok" ? (
        <Episode ep={{ ...data.episode, path: "/lab/episode/rate-3", short: "금리 3화", stores: [], readers: readers(data.known) } satisfies EpisodeData} Art={CoverArt} Glyph={Glyph} />
      ) : (
        <div className="auto-broken">
          <p>{copy.broken}</p>
          <ul>
            {data.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
