import type { Metadata } from "next";
import Link from "next/link";
import { DIRECTIONS } from "../../lab/directions";
import { CHOREOGRAPHY, type MotionId } from "../../reader/motions";
import "../../lab/lab-index.css";

const MOTIONS = Object.entries(CHOREOGRAPHY) as [MotionId, (typeof CHOREOGRAPHY)[MotionId]][];
// logs/frontend/F-2b.md 의 "움직임 안" 과 같은 말
const MOTION_NOTES: Record<MotionId, string> = {
  a: "누른 물음이 가볍게 떠올라 맨 위에 앉는다. 읽던 글은 살짝 위로 빠지고, 물음이 자리에 닿을 즈음 답이 한 덩이씩 올라온다. 물음이 주인공이다.",
  b: "화면 전체가 한 장의 종이처럼 위로 흐른다. 읽던 글 · 물음 · 새 글이 같은 속도로 올라가고 물음만 맨 위에 걸려 남는다. 스크롤해서 내려온 느낌에 가장 가깝다.",
  c: "가장 조용하고 빠르다. 읽던 글은 제자리에서 물러나고 물음은 짧게 올라간다. 움직임이 눈에 덜 띄고 다음 글이 가장 먼저 읽힌다.",
};

export const metadata: Metadata = { title: "Claro lab — 움직임 안 3개 · 디자인 방향" };

// F-2a 첫 화면 — 세 방향으로 가는 길과 비교표. 정답을 고르는 곳이 아니라 반응할 재료다.
export default function Page() {
  return (
    <main className="lab-index">
      <h1>움직임 안 3개 — 본 화면 (F-2b)</h1>
      <p className="lede">
        흐름은 정해졌다 (D26 · B5). 물음을 눌렀을 때 넘어가는 움직임만 셋으로 만들었다. 폰에서 하나씩 눌러 보고 골라 주세요. 셋 다 같은 본 화면이다.
      </p>
      <ul className="dirs">
        {MOTIONS.map(([id, c]) => (
          <li key={id}>
            <Link href={`/?m=${id}`}>
              <b>
                {id.toUpperCase()} · {c.name}
              </b>
              <span>열기 →</span>
            </Link>
            <p>{MOTION_NOTES[id]}</p>
          </li>
        ))}
      </ul>
      <h1 style={{ marginTop: 56 }}>디자인 방향 3개 (F-2a — 지난 탐색)</h1>
      <p className="lede">
        같은 골든(9월 FOMC, 입문 9장 · 숙련 5장)을 세 가지로 그렸다. 폰으로 넘겨 보고 반응해 주세요 — &ldquo;A 의 전환 + C 의 글꼴&rdquo;처럼.
      </p>
      <ul className="dirs">
        {DIRECTIONS.map((d) => (
          <li key={d.id}>
            <Link href={`/lab/${d.id}`}>
              <b>{d.name}</b>
              <span>열기 →</span>
            </Link>
            <p>{d.paragraph}</p>
            <dl>
              {d.axes.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <p className="note">
        <Link href="/lab/b2">B2 — B 에 층 표시(꼬리표 · 글꼴)를 섞어 본 것 →</Link> (2026-10-03, 시험)
        <br />
        <Link href="/lab/b3">B3 — 전환 · 배치를 다듬어 본 것 →</Link> (2026-10-09, 시험)
        <br />
        <Link href="/lab/b4">B4 — B3 + 물음 버튼으로만 넘기기 →</Link> (2026-10-09, 시험)
        <br />
        <Link href="/lab/b5">B5 — 물음을 따라가는 여정 (막대 없음 · 물음이 다음 화면의 머리) →</Link> (2026-10-09, 시험)
      </p>
      <h2>비교</h2>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th />
              {DIRECTIONS.map((d) => (
                <th key={d.id}>{d.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["무엇을 우선했나", "priority"],
                ["맞는 독자", "reader"],
                ["포기한 것", "gaveUp"],
                ["위험", "risk"],
              ] as const
            ).map(([label, key]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                {DIRECTIONS.map((d) => (
                  <td key={d.id}>{d[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">본 화면은 <Link href="/">/</Link> — B5 를 옮긴 것이다 (F-2b).</p>
    </main>
  );
}
