import type { Metadata } from "next";
import { NewsStudy } from "../../study/Study";
import "../../study/study.css";

export const metadata: Metadata = { title: "Claro" };

// 일반 기사 무리 — 물음만 있는 화면 (D37). 기사는 바깥 주소로 보낸다 (study/flows.ts OUTSIDE_ARTICLE). 우리 화면에 남의 기사 글을 싣지 않는다
export default function Page() {
  return <NewsStudy />;
}
