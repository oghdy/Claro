// 테스트의 독자들 — 대응표(identity.reader)에 미리 올려 두는 user_id (e2e/setup-db.ts). 테스트마다 다른 독자를 써서 원장이 섞이지 않는다.
// 이름표는 부호다. 실제 독자가 아니다 — 테스트용 데이터베이스(.data/test*)에만 있다
const id = (n: number) => `e2e00000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const READERS = {
  finish: id(1), // 입문을 끝까지
  levels: id(2), // 레벨을 바꿨다 돌아온다
  back: id(3), // 지나온 길로 되돌아간다
  refresh: id(4), // 4장에서 새로고침
  slow: id(5), // 서버가 느리다 · 답이 안 온다
  killed: id(6), // 서버를 죽였다 살린다
  testRoute: id(7), // /test 경로 — 대응표에 있어도 기록하지 않는다
  api: id(8), // API 를 직접 부른다 (망가뜨린 것)
  skip: id(9), // 화면이 seq 를 건너뛴다
  twice: id(10), // 화면이 같은 사건을 두 번 보낸다
  still: id(11), // 움직임 줄이기
  robot: id(12), // 미리보기 로봇 — 열고, 기다리고, 떠난다
  twin: id(13), // 탭을 복제한다
  dbdown: id(14), // 데이터베이스가 죽은 채 첫 화면을 연다
} as const;

/** 대응표에 없는 user_id */
export const STRANGER = id(999);
