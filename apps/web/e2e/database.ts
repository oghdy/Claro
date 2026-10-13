// 테스트 서버가 쓸 데이터베이스 — 환경 변수로. 용도마다 따로 (web: 테스트 서버 · own: 테스트가 직접 켜고 죽이는 서버)
//   기본            PGlite 폴더 .data/test-<용도> (외부 DB 없음)
//   CLARO_TEST_PG   있으면 실제 Postgres 의 claro_test_<용도> (예: CLARO_TEST_PG=postgres://localhost:5432 pnpm test)
// DATABASE_URL 을 반드시 정한다 (PGlite 면 빈 값) — 서버가 .env 파일의 접속 값을 집어 쓰는 일이 없게
/** 일반 기사 무리가 읽을 바깥 기사 — 테스트에서만 쓰는 주소 (빌드할 때 굳는다). 실제 주소는 도윤이 src/study/flows.ts 에 적는다 */
export const TEST_OUTSIDE_URL = "https://example.com/claro-test-outside-article";

export function testDatabase(use: string): Record<string, string> {
  const pg = process.env.CLARO_TEST_PG;
  return { NEXT_PUBLIC_CLARO_TEST_OUTSIDE_URL: TEST_OUTSIDE_URL, ...database(use, pg) };
}

function database(use: string, pg: string | undefined): Record<string, string> {
  if (!pg) return { DATABASE_URL: "", CLARO_PGLITE_DIR: `.data/test-${use}` };
  // 서버는 배포에서처럼 API 전용 역할(claro_api — 넣기 · 읽기만)로 붙는다. 데이터베이스를 만들고 채우는 것(e2e/setup-db.ts)만 주인으로 한다
  const api = new URL(`${pg}/claro_test_${use}`);
  api.username = "claro_api";
  api.password = "claro_test";
  return { DATABASE_URL: api.href, CLARO_TEST_OWNER_URL: `${pg}/claro_test_${use}`, CLARO_PGLITE_DIR: "" };
}
