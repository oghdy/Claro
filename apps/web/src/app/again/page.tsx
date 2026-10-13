import type { Metadata } from "next";
import { AgainStudy } from "../../study/Study";
import "../../study/study.css";

export const metadata: Metadata = { title: "Claro" };

// 며칠 뒤 — 같은 물음 셋을 다시 (D37). 두 무리 공통. 기사를 다시 보여주지 않는다. "며칠"은 코드에 없다 — 도윤이 이 링크를 보내는 날이 그날이다
export default function Page() {
  return <AgainStudy />;
}
