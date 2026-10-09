import type { Metadata } from "next";
import Link from "next/link";
import { DIRECTIONS } from "../../lab/directions";
import "../../lab/lab-index.css";

export const metadata: Metadata = { title: "Claro lab — 디자인 방향 3개" };

// F-2a 첫 화면 — 세 방향으로 가는 길과 비교표. 정답을 고르는 곳이 아니라 반응할 재료다.
export default function Page() {
  return (
    <main className="lab-index">
      <h1>디자인 방향 3개</h1>
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
      <p className="note">본 화면(F-1)은 <Link href="/">/</Link> 에 그대로 있다.</p>
    </main>
  );
}
