import type { OpenQuestion } from "@claro/contract";

// 슬라이드 사이 (D17). open_questions[i] 는 slides[i] 와 slides[i+1] 사이에 있다.
// 지금은 앞 슬라이드 페이지 아래에 붙여 그린다. 한 화면으로 따로 띄우려면 Deck 에서 이 컴포넌트를 자기 페이지로 옮기면 된다.
// 형태 표시(Q · ·)는 데이터가 아니라서 붙이지 않는다 (§5)
export function Between({ question }: { question: OpenQuestion }) {
  return (
    <aside className="between" aria-label="다음 장으로">
      <p data-u="oq">{question.text}</p>
    </aside>
  );
}
