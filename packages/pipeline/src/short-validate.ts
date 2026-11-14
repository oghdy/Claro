// P-S1 — 계약 검증으로 가는 다리 (episode-validate.ts 와 같은 까닭 · 같은 방식). short.ts 가 웹 패키지의 tsx 로 돌린다:  tsx short-validate.ts <{ story, documents, episodes? } 가 든 JSON 파일>
// 검증 규칙은 여기 없다. packages/contract/src/validate-episode.ts 의 validateShortStory 를 그대로 부르고 결과를 JSON 으로 낸다.
import { readFileSync } from "node:fs";
import { validateShortStory } from "../../contract/src/validate-episode";

const { story, documents } = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { story: unknown; documents: { source_id: string; text: string }[] };
const r = validateShortStory(story, { documents });
process.stdout.write(JSON.stringify(r.ok ? { ok: true, errors: [], warnings: r.warnings, stats: r.stats } : { ok: false, errors: r.errors, warnings: r.warnings, stats: null }));
