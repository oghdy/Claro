// 테스트 서버가 쓸 데이터베이스 — 환경 변수로. 용도마다 따로 (web: 테스트 서버 · own: 테스트가 직접 켜고 죽이는 서버)
//   기본            PGlite 폴더 .data/test-<용도> (외부 DB 없음)
//   CLARO_TEST_PG   있으면 실제 Postgres 의 claro_test_<용도> (예: CLARO_TEST_PG=postgres://localhost:5432 pnpm test)
// DATABASE_URL 을 반드시 정한다 (PGlite 면 빈 값) — 서버가 .env 파일의 접속 값을 집어 쓰는 일이 없게
export function testDatabase(use: string): Record<string, string> {
  const pg = process.env.CLARO_TEST_PG;
  return pg ? { DATABASE_URL: `${pg}/claro_test_${use}`, CLARO_PGLITE_DIR: "" } : { DATABASE_URL: "", CLARO_PGLITE_DIR: `.data/test-${use}` };
}
