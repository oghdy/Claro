// P-E1 — 계약 검증으로 가는 다리. episode.ts 가 웹 패키지의 tsx 로 돌린다:  tsx episode-validate.ts <{ episode, documents } 가 든 JSON 파일>
// 파이프라인은 node 의 타입 지우기로 도는데 (import 에 확장자가 있어야 한다) 계약 패키지 (packages/contract)는 확장자 없는 import 를 쓴다 — 그래서 따로 돌린다.
// 검증 규칙은 여기 없다. packages/contract/src/validate-episode.ts 의 validateEpisode 를 그대로 부르고 결과를 JSON 으로 낸다.
import { readFileSync } from "node:fs";
import { validateEpisode } from "../../contract/src/validate-episode";

const { episode, documents } = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { episode: unknown; documents: { source_id: string; text: string }[] };
const r = validateEpisode(episode, { documents });
process.stdout.write(JSON.stringify(r.ok ? { ok: true, errors: [], warnings: r.warnings, stats: r.stats } : { ok: false, errors: r.errors, warnings: r.warnings, stats: null }));
