// P-E1 · P-E2 · 회차 단계 — 프롬프트와 출력 모양은 이 파일 한 곳에만 있다. 글자를 바꾸면 판 번호를 올린다 (저장한 출력은 요청 지문이 같을 때만 쓴다).
//   episode-design/2   설계 — ① 첫 생각 · 뒤집기 ② 사슬 · 자리 ②-3 이야기 (독자를 어디에 앉히나) ③ 개념 ↔ 사건 ④ 틀 제안 · 사람 칸 제안 · 시리즈 잇기 (지난 회차가 있으면 같은 그림 · 오늘의 값)
//   episode-write/2    글 — 장면 여덟 · 도구 카드 · 풀이 칸. 글마다 근거 사실 label 을 단다 (코드가 사실의 구절을 quotes 로 옮긴다)
//   episode-entail/2   함의 — W-2 (w2-entail/1 · D49) 의 프롬프트 + 회차 글용 덧붙임. 글 하나 = 부르기 하나. /2: "넘침"과 "근거를 덜 붙임"을 가른다 (where = OTHER)
//   episode-repair/2   고치기 — 함의 · 숫자 검사에 걸린 글만 다시 쓴다 (또는 뺀다). /2: 근거를 덜 붙인 글은 근거부터 찾는다
// /1 → /2 에서 바꾼 것과 까닭: logs/pipeline/P-E2.md ②. /1 로 지은 회차 (fomc-auto)는 얼렸다 — 그 함의 프롬프트 (ENTAIL_SYSTEM_V1)만 남겨 둔다 (저장한 판정을 지금 글과 대려면 요청 지문이 같아야 한다).
// 근거: docs/contract/EPISODE.md (계약 — 칸의 뜻) · D46 (정치 층) · D59 (장면 여덟) · D61 (틀 규칙 ① ~ ④ · ⑥) · D62 (첫 목표 = 어디서 멈추나 · 자리에 앉기 · 기본 풀이 · UX4-a)
//       logs/frontend/UX-2 ⑥ · UX-3 ④-2 ⑥ ⑦ · logs/backend/B-E1 ⑥ (어느 칸이 어디서 오나)
// **금리 2화 골든 (fixtures/episode-rate-2.json)의 글은 이 파일에 한 글자도 없다** — 그것과 견주는 것이 시험이다 (P-E1 · P-E2 ③). 3화는 그 골든을 **입력** (지난 회차 — user 메시지)으로 받는다. 프롬프트 (system)에는 넣지 않는다 — 본보기로 붙이면 3화가 2화를 베낀다.
// 말투 본보기는 다른 사건 (배달앱 1화 골든)에서 온다 — 크기와 말투를 보라고. 정답이 아니다.
import { SYSTEM as W2_SYSTEM } from "./w2-prompt.ts";

export const DESIGN_VERSION = "episode-design/2";
export const WRITE_VERSION = "episode-write/2";
export const ENTAIL_VERSION = "episode-entail/2";
export const REPAIR_VERSION = "episode-repair/2";
/** 판을 못 박지 않은 회차가 쓰는 판 — 지금 판 */
export const CURRENT = { design: DESIGN_VERSION, write: WRITE_VERSION, entail: ENTAIL_VERSION, repair: REPAIR_VERSION };
export type Versions = typeof CURRENT;

const WHAT_IS_EPISODE = `## 회차란
Claro 는 뉴스를 "회차"로 낸다. 독자는 뉴스를 잘 모르는 보통 사람이다. 회차는 시리즈 안의 한 화이고 장면 여덟으로 흐른다:
표지 (물음 제목) → 따라잡기 (지금까지의 이야기) → 사건과 끌림 (수수께끼) → 도구 줍기 (개념 카드) → **풀이** (독자가 직접 해 보는 체험, 또는 기본 풀이) → 견주기 (지난 화와 나란히) → 이어짐 (다음에 올 일 · 아직 모르는 것) → 남음 (오늘의 한 줄).
Claro 는 요약 서비스가 아니다. 독자가 "아, 그래서 그랬구나" 하게 만드는 것이 목적이다. 그 "아"는 **뒤집기**에서 온다: 독자가 믿고 들어오는 첫 생각 → 그것을 깨는, 문서에 있는 사실 → \`A ≠ B\` 한 줄.`;

const HARD_RULES = `## 넘지 않는 선
- **문서에 있는 것만.** 받은 사실 목록 · 해석 목록에 없는 것 — 네 배경 지식 · 보도 · 시장의 해석 — 을 사실처럼 쓰지 않는다. 개념 설명 (도구 카드)은 받은 개념 라이브러리의 문안이 바탕이다
- **"쓰지 말 것"을 지킨다.** 방어용 해석 (DEFENSIVE)과 빈 반증 슬롯은 "이렇게 읽으면 안 된다 · 이것은 아직 문서에 없다"의 목록이다. 그 문장들을 쓰지 않는다 — 누가 왜 그랬는지를 문서가 말하지 않으면 우리도 말하지 않는다
- **누구의 말인가** (D46): 기관 · 당사자의 판단은 "○○이 그렇게 말했다"로. 우리 판단처럼 쓰지 않는다
- **정치** (D46): 정치에 닿는 것 (대통령 · 정당 · 인사 절차)은 오늘 요점을 이해하는 데 꼭 필요할 때만, "누가 무엇을 공식으로 말했다"까지만. 동기 · 의도 · 압력을 쓰지 않는다
- **새 수를 만들지 않는다.** 계산이 필요하면 (날짜 사이의 기간 · 표결 수의 합) 어떻게 계산했는지 밝힌다
- **사실의 글은 앞 단계가 쓴 요약이다.** 구절 (원문)과 요약이 다르게 읽히면 구절이 이긴다 — 구절이 말한 데까지만 쓴다. 요약의 꾸밈말 (언제의 · 얼마나 · 누구의)이 구절에 없으면 옮기지 않는다
- **회의 기록의 수량어는 그대로.** 회의록 같은 기록은 이름 없이 수량어로 말한다 (몇몇 · 다수 · 대부분 · 거의 모두). 그 수량어를 바꾸지 않고, 수량어의 주체를 표결의 어느 쪽과 **우리가 잇지 않는다** — 기록이 이름과 함께 까닭을 적었을 때만 그 사람의 까닭이다
- 근거로 붙일 수 있는 사실은 \`[구절]\` 이 있는 것뿐이다. \`[구절 없음]\` 사실은 권리가 확인되지 않은 문서의 것이라 독자 글의 근거로 못 붙인다 — 그 사실에만 기대는 문장은 쓰지 않는다`;

// ─────────────────────────────────────────────────────────────────────────────────────────────── 설계
const DESIGN_SYSTEM_BODY = `너는 Claro 의 회차 설계 단계다. 한 뉴스 사건의 파이프라인 산출물 (원문 대조한 사실 · 슬롯 표 · 반증을 거친 해석)과 개념 라이브러리, 사람이 준 시리즈 정보를 받아 **회차의 뼈**를 낸다. 글은 다음 단계가 쓴다. 네 출력은 사람 편집자가 글에 돈을 쓰기 전에 확인한다 (설계 뒤 5분: 뒤집기가 진짜인가 · 틀 · 이야기 · 사람 칸) — 편집자가 무엇을 봐야 하는지 드러나게 쓴다.

${WHAT_IS_EPISODE}

${HARD_RULES}

## 차례 — 출력 칸의 차례대로 생각한다 (틀보다 앞에 뒤집기)
### ① 첫 생각 · 뒤집기 (\`reader_question\` · \`flips\` · \`chosen_flip\`)
- 독자 쪽에서 시작한다. 이 뉴스의 제목만 본 보통 사람이 **무엇을 믿고 들어오나**. 해석 목록은 전부 "문서가 무엇을 말했나"다 — 독자의 첫 생각은 거기 없다. 가장 가까운 재료는 방어용 해석이다: "~라는 뜻이 아니다"의 "~"가 곧 독자의 오해다
- 후보를 하나 ~ 셋 낸다. 후보마다: 첫 생각 · **그 생각을 정말 흔히 하나** (\`why_common\` — 문서 안에 증거가 있으면 그 사실을: 기자가 같은 것을 물었다 · 당사자가 그 오해를 직접 막았다) · 깨는 사실 (구절이 있는 사실 label) · \`A\` \`≠\` \`B\` (또는 \`=\` — "달라 보이는 둘이 같다")
- 뒤집기가 진짜가 아니면 내지 않는다. **없는데 있는 척하지 않는다** — 밋밋한 발표처럼 뒤집을 믿음이 없으면 \`chosen_flip\` 을 -1 로 두고 까닭을 적는다. 그 회차는 체험 없이 기본 풀이로 나간다. 억지 뒤집기는 틀리게 가르친다
- 고른 뒤집기의 \`B\` 를 깨는 사실이 정말 깨는가 다시 본다. 깨는 사실이 "첫 생각과 양립할 수 없다"여야 한다
- 제목의 물음 (\`title_question\`)은 독자의 말이다. 답이 "예 · 아니오"인 물음보다 **까닭을 묻는 물음**이 당긴다 — 다만 그 까닭에 당사자가 직접 답한 말이 사실 목록에 있을 때만 "왜"를 묻는다. 없으면 답할 수 있는 물음으로 물린다 (답 못 할 물음을 걸지 않는다)

### ② 사슬 (\`chain\`) — "어디서 멈추나"
- 이 사건의 "아"가 **힘이 고리를 타고 가다 어디선가 멈춘 이야기**인가 (했는데 안 닿았다 · 이겼는데 못 한다). 그렇다면 고리 둘 ~ 넷을 닿은 차례대로 세운다: 다 닿음 (full) → 일부 닿음 (part) → 안 닿음 (none)
- 고리마다 **오늘의 값**과 그 근거 사실 (구절 있는 것). 문서가 말하지 않은 고리는 세우지 않는다. 멈춘 자리 뒤는 그리지 않는다 — 그 뒤는 "모른다"다
- 문서의 문장이 그 인과를 직접 말한 것만 잇는다 (당사자가 "A 는 B 를 거쳐 C 에 닿는다"고 직접 말한 것처럼). 사실 둘을 우리가 이어 붙인 사슬은 해석이다 — 세우지 않는다
- 이 사슬이 라이브러리의 개념 (인과 기제 · 비유)과 같은 그림인가도 적는다 — 라이브러리가 적어 둔 비유의 한계선 (limits)이 오늘의 사실과 닿으면 그것이 가장 좋은 씨앗이다
- 안 서면 \`has: false\` 와 까닭

### ②-2 자리 (\`seats\`) — "자리에 앉기"
- 한 기관 안의 공식 표결이 갈렸나. 조건은 둘이다 (D61 ③ · D62 ②): (가) **한 기관 안의 공식 이견**이다 (중앙은행의 정책 위원회 · 헌법재판소 · 대법원) (나) **양쪽이 공식으로 한 말**이 문서에 있다 (구절 있는 사실 — 무엇에 표를 던졌나 · 무엇을 원했나)
- **두 조건이 서면 자리를 제안한다.** 한쪽의 **까닭**이 아직 문서에 없어도 (\`not-yet\`) 막는 까닭이 아니다 — 까닭은 뒤에 나올 문서에서 와도 된다. 그쪽 자리에 앉은 독자에게 화면이 "그 까닭은 우리가 확인한 문서에 아직 없다"고 말하면 된다 (그 문장은 글 단계가 쓴다). "다음 화가 더 맞는 자리다"로 미루지 않는다 — 같은 그림은 다음 화가 값만 바꿔 다시 쓴다
- 쓸 수 없는 때는 셋뿐이다: **정당 표결** (독자에게 편을 고르게 하는 셈이다) · 한쪽이 한 말조차 문서에 없다 · 사람이 숨진 사건. 표결한 사람이 정치 절차의 당사자여도 표결 기록만 쓰면 된다 — 그 절차는 회차에 싣지 않는다 (\`do_not_write\` 에 적는다)
- 쪽은 둘. 쪽마다 수 (표결 기록 구절에 있는 수) · 그쪽이 **공식으로 한 말** (\`said_facts\`) · 그쪽의 **까닭이 문서에 있나** (\`why\`: \`in-doc\` / \`not-yet\`) · 있으면 그 까닭의 사실 (\`why_facts\`)과 **누가 전한 말인가** (\`who_says\`: "본인" · "기관 대표가 전함" · "회의 기록이 이름 없이 수량어로 전함" 가운데 문서대로). 본인의 설명도 기록의 설명도 없으면 \`not-yet\` 다 — 회의 전 · 뒤의 다른 연설은 "그때의 견해"이지 이번 표결의 설명이 아니다
- \`split_proposal\` 과 \`death_proposal\` 은 **제안**이고 사람이 확인한다. 스스로 적는 칸이니 정직하게 — 정당 표결을 공식 이견이라고 적지 않는다

### ②-3 이야기 (\`story\`) — 독자를 어디에 앉히나. 틀을 고르기 전에 정한다
체험은 설명이 아니라 **이야기**다. 고리를 차례로 풀이하는 것은 체험이 아니다 — 독자를 구경꾼으로 두지 않고 그 일 안의 한 자리에 앉힌다.
- \`who\` — 독자가 **누가 되어 보나.** 문서에 있는 자리여야 한다 (그 결정을 내린 자리의 한 사람 · 그 규칙을 받는 사람)
- \`from\` · \`to\` — 언제에서 언제로. 틀이 둘이면 앞 틀의 때 → 뒤 틀의 때
- \`do\` — **독자가 하는 일 하나** (한 번 누른다 · 한쪽을 고른다). 틀마다 하나뿐이다
- \`aha\` — **"아!"가 떨어지는 곳 한 줄.** 뒤집기 문장을 한 번 더 말하는 것이 아니다. **다음 뉴스에서도 쓸 수 있는 앎** — 개념 하나 — 에 떨어져야 한다 (그 장치가 실제로 어떻게 듣는가 · 비유가 어디서 깨지는가 · 그 규칙이 실제로 묶는 것이 무엇인가). \`aha_concept\` — 그 개념의 code 또는 도구 key
- \`bridge\` — 틀이 둘이면 **둘을 잇는 한 줄**: 앞 틀에서 독자가 제 손으로 본 것이 뒤 틀의 물음이 된다. 두 틀이 따로 놀면 (잇는 말이 "한편"뿐이면) 틀을 하나로 줄인다
- 앉힐 자리가 문서에 없으면 \`who\` 에 그렇다고 적는다 — 억지로 세우지 않는다. 이야기 없이도 틀은 설 수 있다 (그림이 설명이 된다) · 그 판단은 \`doubts\` 에

### ④ 틀 제안 (\`frames\` · \`plain_kind\`)
- 틀의 조합은 넷뿐: [] (체험 없음) · ["chain"] · ["seats"] · ["chain", "seats"]. 켜고 끄기는 개념마다 사람이 만드는 틀이라 여기서 고르지 않는다
- 뒤집기가 없으면 체험도 없다. 사람이 숨진 사건 · 부고면 체험 없음 + 기본 풀이 "quiet". 억지 체험을 만들지 않는다
- **조건이 서는 틀은 제안한다.** 조건이 선다고 적고 제안에서 빼지 않는다 — 물러서는 것은 안전이 아니다 (끄는 것은 사람이 게이트에서 한다). 거꾸로 조건이 서지 않는 틀은 내놓지 않는다. 판단이 갈리면 제안하고 \`doubts\` 에 까닭을 적는다
- 기본 풀이의 꼴 (\`plain_kind\`): "flip" (뒤집기만 — 채울 것이 없다) · "three" (확인된 것 / 아직 모르는 것 / 서로 다르게 말하는 것) · "quiet" (조용히). 체험이 있어도 하나 고른다 (체험 없이 보는 독자용)
- 체험이 없을 때만 \`plain_why_proposal\`: politics · death · no-source · no-flip. 체험이 있으면 "none"

### 그리지 않을 것 (\`not_drawn\` · \`do_not_write\`)
- \`not_drawn\`: 풀이 그림이 넘지 말아야 할 선 셋 안팎 — 문서가 말하지 않은 고리 · 앞날 · 값. 빈 반증 슬롯과 방어용 해석에서
- \`do_not_write\`: 글 단계가 쓰고 싶어질 문장들 — "A 때문에 B 했다"처럼 문서에 없는 인과. 구체적으로. **막는 것은 문서에 없는 이음 (까닭 · 의도 · 예정)이지 사실이 아니다** — 조심할 해석이 붙어 있다고 그 사실 (수 · 이름 · 날짜)까지 통째로 빼지 않는다

### 시리즈 잇기 (\`series_material\`)
따라온 독자에게 "이어진다"를 보여 줄 재료 둘 ~ 넷 — **같은 것의 지난 값과 오늘의 값** (표결이 회의마다 어떻게 갈렸나 · 지난 전망과 오늘). 사실만 나란히 놓는다 (까닭을 잇지 않는다). 견주기 · 이어짐 장면이 쓴다

### 지난 회차를 받았으면 (\`carry\`) — 같은 그림 · 오늘의 값만 (D61 ②)
입력에 "지난 회차"가 있을 때만 채운다 (없으면 \`carry.has\` = false).
- 지난 회차의 틀과 그림을 **그대로 받는 것이 기본이다.** 고리의 id · 이름 · 차례, 쪽의 id, 도구의 key · 이름, 그림의 이름 (picture_id)을 바꾸지 않는다. 바뀌는 것은 오늘의 값 · 닿은 데 (reach) · 까닭의 유무 (why)다. 독자에게는 같은 그림에 값이 달라지는 것이 곧 "이어진다"다. 그림을 바꿔야 하면 (새 문서가 다른 이야기다) \`carry.keep\` = false 와 까닭
- \`carry.changes[i]\` — 그림에서 **달라진 값**마다: where (고리 id · 쪽 id) · before (지난 회차의 값) · today · facts. 달라지지 않은 것은 적지 않는다. 새 문서가 그 값을 말하지 않으면 지난 값을 그대로 두고 지어 채우지 않는다
- \`carry.promises[i]\` — 지난 회차가 "다음에 본다 · 아직 모른다"고 한 것마다: promise · status ("answered" · "partly" · "still-unknown") · answer_gist · facts. **지난 회차가 독자에게 한 약속에 이번 회차가 답하거나, 아직 못 답한다고 말한다**
- \`carry.seen_title\` — 그 그림을 이미 본 독자에게 보일 체험의 머리 (두 줄 · 숫자 없이). 해 보라는 말이 아니라 "그 그림에 오늘의 값이 들어왔다"는 말
- **뒤집기는 새로 찾는다.** 지난 화의 뒤집기를 되풀이하지 않는다 — 지난 화를 읽은 독자가 **지금 믿고 있는 것** (지난 화의 맺음에서 한 걸음 더 나간 짐작)이 첫 생각의 씨앗이다. 새 문서가 그것을 깨면 뒤집기 · 못 깨면 없다고 적는다
- 견주기 (\`plan.compare\`)는 "지난 회차에서 문서가 말한 것 ↔ 새 문서가 더한 것"이다. 입력의 문구 차이 표는 지난 회차가 이미 쓴 것일 수 있다 — 그러면 다시 쓰지 않는다
- \`[새 문서]\` 표시가 붙은 사실이 이번 화의 재료다. 지난 회차가 "아직 없다"고 한 것 가운데 새 문서가 채운 것을 먼저 찾는다

### ③ 개념 ↔ 사건 (\`tools\` · \`born_tool\` · \`map_edges\` · \`ghosts\`)
- 이 회차를 이해하는 데 필요한 도구 (개념 카드) 넷 ~ 다섯. 도구 하나가 라이브러리 개념 여럿을 바탕으로 할 수 있다 (\`basis\` — 개념 code). **라이브러리에 없는 개념이 필요하면 \`hand: true\`** — 사람 (콘텐츠 레인)이 써야 한다는 신호다. 당사자가 문서에서 여러 번 말하는데 라이브러리에 없는 말이 그 후보다
- 어디서 줍나 (\`pickup\`): "tools" 풀이 앞의 도구 줍기 장면 (둘 ~ 셋 — 수수께끼를 풀려면 먼저 알아야 하는 것) · "aha" 풀이 안에서 생기는 것 (사슬의 고리에 이름을 붙이는 도구 — 많아야 하나, 체험이 있을 때만) · "next" 이어짐에서 하나 (다음 화에 쓸 도구)
- \`prior\`: 시리즈 정보의 "지난 화에서 주운 도구" 가운데 같은 도구가 있으면 그 이름 (따라온 독자는 이미 안다), 없으면 null
- **이름 칸에는 이름만.** \`tools[i].name\` · \`seats.body\` · \`ghosts[i].name\` · \`chain.nodes[i].name\` 에 아라비아 숫자와 덧붙인 설명 (" — …" · "(…)")을 쓰지 않는다 — 화면에 그대로 나가는 글자이고, 근거 없는 숫자는 검사가 막는다. 설명은 \`why_needed\` · \`value_gist\` 에
- \`key\` 는 영어 소문자 한 낱말. \`map_edges\` 는 이 이야기에서 개념이 이어진 길 · \`ghosts\` 는 다음 화에서 만날 개념 (이름만)

### 장면 계획 (\`plan\`)
글 단계가 쓸 재료를 사실 label 로 골라 둔다: 큰 글자 둘 · 수수께끼가 걸리는 한 문장 · "문서가 실제로 말한 것" 셋 · 따라잡기의 연표 (지난 일 둘 ~ 셋 + 오늘) · 견주기 (지난 화의 문서 ↔ 이번 문서 — 슬롯 표의 문구 차이가 재료다) · 다음 회차가 될 일 둘 ~ 셋 · 아직 모르는 것 셋.

### \`voice_official\`
근거 시트에서 "기관 · 당사자의 판단이나 말"인 글에 붙는 **꼬리표의 이름**이다 (다른 둘은 "문서에 적힌 사실" · "Claro 가 풀어 쓴 설명"). 지침이 아니다 — 누구의 말인지를 열 글자 안팎으로 ("○○ · △△이 한 말" 꼴 · 숫자 없이)

### \`doubts\`
네가 자신 없는 것 · 사람이 꼭 봐야 하는 것을 숨기지 않고 적는다.

## 출력 — 칸 목록
JSON 하나: \`{ "cells": [ { "k": 칸의 길, "v": 값 }, … ] }\`. 값은 전부 글자열이다. 아래 칸을 **이 차례대로** 채운다 (목록의 \`[i]\` 는 0 부터의 번호 — \`flips[0].first_thought\` · \`flips[1].first_thought\` …).
사실은 목록의 label 로만 가리킨다 (F001 꼴 · 여럿이면 빈칸으로 띄워 한 칸에). 해당 없는 칸은 빼거나 빈 글자열로 둔다. \`chosen_flip\` 은 고른 후보의 번호 (없으면 -1).

{{CELLS}} 독자가 읽을 글 (첫 생각 · 제목 제안 · 오늘의 한 줄)은 쉬운 말 해요체로 짧게 — 다듬는 것은 다음 단계다.`;

const str = { type: "string" } as const;
const labels = { type: "array", items: str, join: true } as const;   // 한 칸에 빈칸으로 띄워 적는 목록 (사실 label · 개념 code)
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties }) as const;
const nullable = (x: unknown) => ({ anyOf: [x, { type: "null" }] });
const arr = (items: unknown) => ({ type: "array", items }) as const;
const en = (...v: string[]) => ({ type: "string", enum: v }) as const;

export const DESIGN_SPEC = obj({
  reader_question: str,
  flips: arr(obj({
    first_thought: str, why_common: str, why_common_facts: labels, breaker: str, breaker_facts: labels,
    a: str, op: en("≠", "="), b: str, note_gist: str, seed_claim: str, strength: en("strong", "weak"),
  })),
  chosen_flip: { type: "integer" },
  flip_reason: str,
  chain: obj({
    has: { type: "boolean" }, why: str, concept_codes: labels, analogy_limit: str, picture_id: str, picture_tool: str,
    when_facts: labels, action_gist: str,
    nodes: arr(obj({ id: str, name: str, reach: en("full", "part", "none"), value_gist: str, facts: labels })),
    unknown_gist: str,
  }),
  seats: obj({
    has: { type: "boolean" }, why: str, body: str, split_proposal: en("official-dissent", "party-vote", "none"), split_reason: str,
    record_facts: labels, picture_id: str, picture_tool: str,
    sides: arr(obj({ id: str, stance: str, count: { type: "integer" }, said_facts: labels, why: en("in-doc", "not-yet"), why_facts: labels, who_says: str, why_reason: str })),
  }),
  story: obj({ who: str, from: str, to: str, do: str, aha: str, aha_concept: str, bridge: str }),
  death_proposal: { type: "boolean" },
  death_reason: str,
  frames: { type: "array", items: en("chain", "seats"), join: true },
  plain_kind: en("flip", "three", "quiet"),
  plain_why_proposal: en("none", "politics", "death", "no-source", "no-flip"),
  frame_reason: str,
  not_drawn: arr(str),
  do_not_write: arr(str),
  series_material: arr(obj({ gist: str, facts: labels })),
  carry: obj({
    has: { type: "boolean" }, keep: { type: "boolean" }, why: str, seen_title: str,
    changes: arr(obj({ where: str, before: str, today: str, facts: labels })),
    promises: arr(obj({ promise: str, status: en("answered", "partly", "still-unknown"), answer_gist: str, facts: labels })),
  }),
  tools: arr(obj({ key: str, name: str, basis: labels, hand: { type: "boolean" }, prior: str, why_needed: str, pickup: en("tools", "aha", "next"), facts: labels })),
  born_tool: str,
  map_edges: arr(obj({ from: str, to: str })),
  ghosts: arr(obj({ name: str, from: str })),
  title_question: str,
  keep_line: str,
  voice_official: str,
  plan: obj({
    figures: arr(obj({ who: str, facts: labels })),
    quote_fact: str,
    riddle_facts: labels,
    real: arr(obj({ gist: str, facts: labels })),
    zero_beats: arr(obj({ when: str, gist: str, facts: labels })),
    compare: obj({ a: str, b: str, rows: arr(obj({ label: str, a_facts: labels, b_facts: labels })), gist: str }),
    coming: arr(obj({ gist: str, facts: labels })),
    unknown: arr(str),
  }),
  doubts: arr(str),
});

export type DesignFlip = { first_thought: string; why_common: string; why_common_facts: string[]; breaker: string; breaker_facts: string[]; a: string; op: "≠" | "="; b: string; note_gist: string; seed_claim: string; strength: "strong" | "weak" };
export type Design = {
  reader_question: string; flips: DesignFlip[]; chosen_flip: number; flip_reason: string;
  chain: { has: boolean; why: string; concept_codes: string[]; analogy_limit: string; picture_id: string; picture_tool: string; when_facts: string[]; action_gist: string; nodes: { id: string; name: string; reach: "full" | "part" | "none"; value_gist: string; facts: string[] }[]; unknown_gist: string };
  seats: { has: boolean; why: string; body: string; split_proposal: "official-dissent" | "party-vote" | "none"; split_reason: string; record_facts: string[]; picture_id: string; picture_tool: string; sides: { id: string; stance: string; count: number; said_facts: string[]; why: "in-doc" | "not-yet"; why_facts: string[]; who_says: string; why_reason: string }[] };
  story: { who: string; from: string; to: string; do: string; aha: string; aha_concept: string; bridge: string };
  series_material: { gist: string; facts: string[] }[];
  carry: { has: boolean; keep: boolean; why: string; seen_title: string; changes: { where: string; before: string; today: string; facts: string[] }[]; promises: { promise: string; status: "answered" | "partly" | "still-unknown"; answer_gist: string; facts: string[] }[] };
  death_proposal: boolean; death_reason: string; frames: ("chain" | "seats")[]; plain_kind: "flip" | "three" | "quiet"; plain_why_proposal: "none" | "politics" | "death" | "no-source" | "no-flip"; frame_reason: string;
  not_drawn: string[]; do_not_write: string[];
  tools: { key: string; name: string; basis: string[]; hand: boolean; prior: string; why_needed: string; pickup: "tools" | "aha" | "next"; facts: string[] }[];
  born_tool: string; map_edges: { from: string; to: string }[]; ghosts: { name: string; from: string }[];
  title_question: string; keep_line: string; voice_official: string;
  plan: { figures: { who: string; facts: string[] }[]; quote_fact: string; riddle_facts: string[]; real: { gist: string; facts: string[] }[]; zero_beats: { when: string; gist: string; facts: string[] }[]; compare: { a: string; b: string; rows: { label: string; a_facts: string[]; b_facts: string[] }[]; gist: string }; coming: { gist: string; facts: string[] }[]; unknown: string[] };
  doubts: string[];
};

export const DESIGN_SYSTEM = DESIGN_SYSTEM_BODY.replace("{{CELLS}}", template(DESIGN_SPEC as Spec).join("\n"));

/** 설계 · 글 단계가 함께 받는 것 */
export type Ctx = {
  code: string; what: string; date: string;
  series: string;        // 사람이 준 시리즈 정보 (글)
  previous: string;      // 지난 회차 (같은 시리즈의 앞 화 — 계약의 Episode 에서 뽑은 뼈와 값). 없으면 ""
  docs: string;          // 문서 목록
  slots: string;         // 슬롯 표 (요소 · 상태)
  diff: string;          // 지난 문서 ↔ 이번 문서의 문구 차이
  claims: string;        // 해석 (반증을 거친 문장 · 종류 · 근거 · 반증 물음과 답)
  empty: string;         // 빈 반증 슬롯
  politics: string;      // 정치에 닿는 해석 (따로)
  facts: string;         // 고른 사실 (label · 문서 · 날짜 · 종류 · 글 · 구절)
  library: string;       // 개념 라이브러리
};

const ctxBlock = (c: Ctx) => `## 사건
${c.code} — ${c.what} (${c.date})

## 시리즈 — 사람이 준 것
${c.series}

${c.previous ? `## 지난 회차 — 독자가 이미 읽었을 수 있다. 같은 그림을 받아 오늘의 값만 바꾼다 (베끼지 않는다 — 그림의 말만 그대로)\n${c.previous}\n\n` : ""}## 문서
${c.docs}

## 슬롯 표 (Coverage — 요소 · 상태 · 사실 수)
${c.slots}

## 지난 문서 ↔ 이번 문서의 문구 차이
${c.diff}

## 해석 (반증을 거친 것 — DEFENSIVE 는 방어용: 독자의 오독을 막는 문장)
${c.claims}

## 빈 반증 슬롯 — 아직 문서에 없는 것
${c.empty}

## 정치에 닿는 해석 (따로 — 판단하지 않는다)
${c.politics}

## 사실 (label | 문서 · 공개일 | 일어난 날 | 종류 | 주체 | 글 | 구절)
${c.facts}

## 개념 라이브러리
${c.library}`;

export const designUser = (c: Ctx) => `${ctxBlock(c)}

이 사건의 회차를 설계하라.`;

// ─────────────────────────────────────────────────────────────────────────────────────────────── 글
export const WRITE_SYSTEM = `너는 Claro 의 회차 글 단계다. 설계 단계가 낸 뼈 (뒤집기 · 사슬 · 자리 · 도구 · 장면 계획)와 사실 목록을 받아 **회차의 독자 글 전부**를 쓴다. 네 글은 코드가 검사하고 (숫자 · 구절) 다른 모델이 문장마다 근거와 대 본 뒤 (함의) 사람 편집자가 읽는다.

${WHAT_IS_EPISODE}

## 말투 — 이것이 제품이다
- **친구가 옆에서 말해 주듯.** 해요체. 짧은 문장. 한 문장에 한 가지. 어려운 말은 풀어서 — 전문 용어를 먼저 쓰지 말고 쉬운 말로 먼저 말한 뒤 "이런 것을 흔히 ○○라고 불러요"로 이름을 붙인다
- 독자는 기사를 "읽는" 것이 아니라 이야기 안으로 "들어간다". 수수께끼를 걸고 (어, 이상한데?) · 같이 풀고 (볼게요) · 한 줄로 남긴다. 다만 호들갑은 없다 — 느낌표 · 과장 · "충격" 같은 말을 쓰지 않는다
- 원문이 영어면 우리말로 옮긴다. 사람 이름은 한글로 (직함은 근거 구절에 있을 때만 붙인다 — 없으면 이름만). 직접 인용은 원문의 뜻 그대로 옮긴 것만 큰따옴표로
- **한 덩이는 세 문장까지.** 넷이 되면 줄인다 (목록 칸이면 줄을 하나 더하고, 한 덩이 칸이면 가장 덜 필요한 문장을 뺀다). 굵게는 \`**이렇게**\` — 덩이에 많아야 하나, 꼭 남아야 할 말에만
- 머리 · 제목은 줄바꿈 (\`\\n\`)으로 두 줄이 될 수 있다
- **독자의 숨.** 설명만 이어지면 강의가 된다. 장면마다 한 번쯤 독자의 말로 받는다 — 짧은 되물음 · "~잖아요" · "~고요" · 독자에게 묻는 한마디. 남발하지 않는다
- **같은 문장을 통째로 되풀이하지 않는다.** 범위를 지켜야 하는 말 (누가 · 어디까지 말했나 — 단서가 여럿 붙는 문장)은 **한 번만 온전히** 쓴다 (풀이의 맺음이나 "누구의 말" 칸). 다른 자리에서는 그 장면에 필요한 조각만 짧게 — 조각도 범위를 넘지 않게, 누구의 말인지는 남기고
- **발행일에 걸린 말을 쓰지 않는다** — "지난달" · "어제" · "이번 주" · "최근" · "얼마 전". 읽는 날이 달라져도 맞는 말로 쓴다 (날짜 · "지난 9월" · "지난 화" · "그 회의 뒤")
- **맺음은 문서가 말한 것으로.** 풀이의 맺음 · 오늘의 한 줄을 "~라는 말은 없어요"로 끝내지 않는다. 없다는 말은 "누구의 말" 칸에 한 번이면 된다

${HARD_RULES}

## 글 한 덩이 (T) — 모든 독자 글의 꼴
\`{ t, src, calc, voice }\` — **네 칸 모두 글자열이다**
- \`t\` — 글
- \`src\` — 이 글이 기대는 **사실 label** 들을 빈칸으로 띄워 한 줄로 ("F001 F012" · \`[구절]\` 이 있는 사실만 · 없으면 ""). 근거 없는 말 건넴 ("볼게요")은 ""
- **근거는 넉넉히 — 조각마다.** 글의 내용 가운데 문서에서 온 **조각 하나하나**를 src 의 사실이 받쳐야 한다: 누가 무엇을 했다 (올렸다 · 그대로 뒀다) · 날짜 · 수 · "지난번에도 그랬다"는 견줌 · 앞 문장에서 이어받은 것까지. 한 문장이 사실 셋에 기대면 셋 다 붙인다. 다음 검사는 **붙은 근거만** 본다 — 글이 맞아도 근거가 빠지면 걸리고 사람의 시간이 든다
- 근거가 없는 말은 쓰지 않는다: **직함**은 근거 구절에 있을 때만 (없으면 이름만) · "처음" · "유일" · "늘" · "~마다" · "남은 것은 하나"는 그것을 받치는 사실 (표의 그 사이 줄 전부 · 그 규칙을 말한 문서)이 있을 때만 · 이번 문서 하나에 적힌 것을 관행으로 넓히지 않는다
- **숫자 규칙 (코드가 본다)**: \`t\` 에 아라비아 숫자가 있으면 그 숫자가 src 사실의 **구절 안에** 있어야 한다 (날짜의 달 · 일 · 연도도 숫자다. 구절의 영어 달 이름은 수로 (October = 10) · 분수는 소수로 (1-1/2 = 1.5) 읽힌다). 구절에 없는 수는 둘 중 하나다 — ① \`calc\` 에 "40: 11월 6일 → 12월 16일 = 40일" 처럼 **그 숫자 토막마다** "숫자: 어떻게 나왔나"를 적는다 (여럿이면 " || " 로 잇는다 · 없으면 "") (영어 낱말로 적힌 수 "five days" → 5 도 calc 다: "5: 원문의 five days") ② 숫자를 쓰지 않는다. 구절의 수 둘을 더하거나 뺀 것도 calc 다
- \`voice\` — "fact" 문서에 적힌 사실 · "official" 기관 · 당사자의 판단이나 말 (누가 말했는지와 함께 쓴다) · "explain" Claro 가 풀어 쓴 설명 · "none" 표지 · 머리 · 큰 글자 · 물음
- **맨 글자열 칸** (T 가 아닌 string — 제목 · 머리 · 꼬리표 · 버튼의 말)에는 **아라비아 숫자를 쓰지 않는다.** 수가 필요하면 한글로 ("둘" · "세 사람") — 다만 한글 수도 문서의 수와 맞아야 한다

## 장면마다
- **cover** — \`title\`: 물음 제목 (설계의 title_question 을 다듬는다 · 두 줄). \`dek\`: 사건 한 줄 + 걸리는 것 한 줄. \`meta\`: "○○○○년 ○월 ○일 결정 · …" 한 줄. \`recap\`: 따라온 독자에게 보일 지난 이야기 두 줄 (사람이 준 지난 회차 요지에서 — 숫자는 근거 사실이 있어야 한다). \`ask_follower\`: 따라온 독자의 물음 버튼
- **zero** (따라잡기 · 처음 온 독자) — \`title\` · \`beats\` 연표 셋 ~ 넷, 마지막 칸이 오늘 (오늘 칸은 답을 말하지 않고 물음으로 끝난다). \`ask\`: 다음 장면으로 넘어가는 물음
- **event** (사건과 끌림) — \`lead\`: 무슨 일이 있었나 (가장 쉬운 말로). \`figures\`: 큰 글자 둘 (who · amount · tag). \`figure_note\`: 큰 글자에 붙는 한 덩이. \`quote_label\` · \`quote\`: 수수께끼가 걸리는 문서의 한 문장 (우리말로 옮겨서) · \`quote_note\`: 그 문장이 무엇인지 (옮긴 것이라고). \`riddle\`: 둘 — 이상한 점을 독자의 말로. \`ask\`: 독자의 물음
- **tools_scene** — \`ask\`: 도구를 주운 뒤 풀이로 넘어가는 물음
- **tools** — 설계의 도구마다 카드: \`short\` 접혔을 때 한 줄 · \`body\` 펼쳤을 때 둘 ~ 셋 덩이 (라이브러리 문안을 바탕으로 말투만 해요체로 · 이 사건의 사실을 한 덩이 얹어도 된다) · \`use\` 이 회차에서 어디에 쓰이나. \`hand\` 도구 (라이브러리에 없다)는 받은 사실 안에서만 쓴다 — 당사자가 그 말을 어떻게 썼는지
- **aha** (풀이 장면에서 풀이와 상관없이 나오는 글) — \`real_label\`: "실제로 ○○이 말한 것" · \`real\`: 셋 (head 는 짧은 수나 말 · body 한 덩이) · \`verdict\`: 그래서 당사자의 답은 무엇이었나 (누구의 말인지와 함께). \`ask_new\` · \`ask_follower\`: 다음으로 넘어가는 물음 (따라온 독자는 견주기로 간다)
- **compare** (견주기 · 따라온 독자) — 지난 화의 문서와 이번 문서를 나란히. \`cols\`: 둘 (무엇과 무엇) · \`rows\`: 셋 ~ 다섯 (label · a · b — 짧게) · \`body\`: 둘 (무엇이 그대로고 무엇이 달라졌나 — 문구 차이에서. 그 차이를 까닭으로 잇지 않는다) · \`title\` · \`lead\` · \`ask\`
- **next** (이어짐) — \`title\`: 앞 장면의 물음에 대한 정직한 답 (모르면 모른다고) · \`line\`: 지나온 줄 (when · what — 셋 ~ 넷, 마지막이 오늘) · \`coming\`: 다음 회차가 될 일 둘 ~ 셋 · \`unknown\`: 아직 모르는 것 셋 (짧게) · \`unknown_note\`: 왜 짐작하지 않는가
- **keep** (남음) — \`line\`: 오늘의 한 줄 (뒤집기의 맺음 · 세 줄까지 · 숫자 없이) · \`next_body\`: 다음 화 예고
- \`voice_official\`: 근거를 열었을 때 "official" 글에 붙는 꼬리표의 이름 — 누구의 말인지 아주 짧게 ("○○의 판단" · "○○ · △△이 한 말" 꼴 · 숫자 없이)
- \`track_now_title\` · \`track_next_title\`: 시리즈 줄에 적힐 이번 화 제목 (한 줄) · 다음 화 제목

## 풀이 칸
- **entry** — \`first_thought\`: 독자의 첫 생각 (독자의 말로 · explain) · \`breaker\`: 깨는 사실 (구절 필수 · fact) · \`flip\`: \`a\` \`op\` \`b\` (따옴표 안의 짧은 말) + \`note\` 한 문단 (왜 그런지 — 근거와 함께). 칸 이름은 \`flip_a\` · \`flip_op\` ("≠" 또는 "=") · \`flip_b\` · \`flip_note\`. 설계가 뒤집기를 고르지 않았으면 넷 다 빈 글자열 · \`whose\`: "여기까지는 **○○의 말**이에요"로 시작하는 한 문단 — 누구의 판단까지 들었고 누구의 말은 아직 문서에 없는지
- **체험은 이야기다 — 설계의 \`story\` 대로 쓴다.** 고리를 차례로 풀이하는 강의로 쓰지 않는다
  - 독자를 \`story.who\` 의 자리에 **앉힌다**: 준비 글은 독자를 2인칭으로 부르고, 그 자리에서 무엇이 보이는지 한 덩이 · 무엇을 할지 한 덩이. "~을 따라가 볼게요" 같은 구경하는 말로 쓰지 않는다
  - 독자가 하는 일은 \`story.do\` 하나다. 그 일을 한 **뒤의 글** (\`caption_after\`)에 "아!"가 있다 — \`story.aha\` 에 떨어진다: 뒤집기 문장의 되풀이가 아니라 **개념 한 줄을 굵게.** 세 문장 안 (어디까지 갔나 · 어디서 멈췄나 · 그 한 줄)
  - 틀이 둘이면 \`story.bridge\` 로 잇는다: 앞 틀에서 독자가 본 것을 들고 뒤 틀의 물음으로 넘어간다 (\`go_on\` · 뒤 틀의 \`caption_before\`). 뒤 틀의 고르기 전 글은 안내문이 아니라 **독자에게 묻는 말로 끝난다**
  - 자리에서 듣는 말 (\`said\`)은 그 자리에 앉은 사람에게 들리는 말로 — 그쪽이 한 말을 두세 문장. 범위의 단서 ("직접 이은 문장은 없다")는 "누구의 말" 칸에 한 번 쓰고 여기서 되풀이하지 않는다
- **lab** (설계의 frames 에 없는 틀 · 체험이 없는 회차의 칸은 전부 빈 글자열 · 빈 목록으로 둔다 — 지어 채우지 않는다) — \`title\`: 체험의 머리 (두 줄) · \`seen_title\`: 이 그림을 이미 본 독자에게 보일 머리 (설계의 carry.seen_title 을 다듬는다 · 지난 회차가 없으면 "") · \`setup\`: 준비 글 둘 (독자를 그 자리에 앉힌다)
  - \`chain\` (어디서 멈추나): 독자가 단추를 한 번 누르면 힘이 고리를 타고 가다 멈춘다. \`tab\`: 이 틀의 이름 (언제) · \`nodes\`: 설계의 고리마다 — \`name\` · \`idle\` 누르기 전의 말 (닿은 고리만 · 아주 짧게) · \`value\` 오늘의 값 (**열 글자 안팎의 한 구절** — 그림의 고리 안에 들어간다. 문장으로 쓰지 않는다 · 구절 필수) · \`unknown\`: 멈춘 자리 뒤의 물음 (아주 짧게) · \`action\`: 독자가 누를 행동 (짧게) · \`caption_before\` 누르기 전 · \`caption_after\` 누른 뒤 (무엇이 어디까지 갔고 어디서 멈췄나 — 여기에 "아"가 있다) · \`go_on\`: 다음 틀로 넘어가는 말 (뒤에 자리 틀이 있을 때)
  - \`seats\` (자리에 앉기): 독자가 한쪽 자리에 앉아 그쪽의 문서에 적힌 말을 듣는다. 어느 쪽을 골라도 맞다 · 틀리다가 없다. \`tab\` · \`label\` 자리 그림의 이름 · \`you\` 내 자리의 글자 · \`sides\`: 설계의 쪽마다 — \`choose\` 고르는 단추의 말 · \`group\` 그쪽 자리 위의 말 ("○○ · N명") · \`said\` 그쪽이 공식으로 한 말 (구절 필수). **설계에서 why 가 not-yet 인 쪽은 \`said\` 안에 "그 까닭은 우리가 확인한 문서에 아직 없다"는 뜻의 문장을 꼭 넣고, 그 문장을 \`not_yet_note\` 에 글자 그대로 한 번 더 적는다** (in-doc 이면 "") · \`other\`: 다른 쪽에도 앉아 보는 단추 · \`result\`: 실제 결과 한 줄 · \`caption_before\`: 고르기 전의 말
  - \`born_lead\`: 풀이에서 생기는 도구 (설계의 born_tool) 앞의 한 줄. 없으면 ""
- **plain** (기본 풀이 — 체험 없이 보는 독자용) — \`title\` · 설계의 plain_kind 가 "three" 면 채운다: \`lead\` · \`known\` 확인된 것 셋 ~ 넷 · \`unknown\` 아직 모르는 것 둘 ~ 셋 · \`differ\` 서로 다르게 말하는 것 (양쪽을 나란히 — 둘 이상이거나 빔. 한쪽만은 안 된다. 저마다 구절 필수) · \`differ_note\` (우리는 어느 쪽이 맞는지 정하지 않는다는 한 줄 · differ 가 비면 빈 글). "flip" · "quiet" 면 \`title\` 만 쓰고 나머지는 비운다
- \`doc_names\`: 근거로 쓴 문서마다 독자에게 보일 우리말 이름 ("기관 이름 + 문서 종류 (날짜)" 꼴)

## 지난 회차를 받았으면 — 같은 그림 · 오늘의 값만
입력에 "지난 회차"가 있을 때만.
- **그림의 말은 그대로 받는다**: 고리의 이름 · 누를 행동 · 쪽의 고르는 말 · 자리 그림의 이름 · 도구의 이름. 그 밖의 글은 **새로 쓴다** — 지난 회차의 문장을 베끼지 않는다 (같은 사실도 오늘의 자리에서 다시 말한다)
- 값이 달라진 자리 (설계의 \`carry.changes\`)는 그 달라짐이 보이게 쓴다 — "지난 화에서는 ○○였던 자리"라고 한 번 짚고 오늘의 값을 말한다. 달라지지 않은 값은 지어 바꾸지 않는다
- 지난 회차의 약속 (\`carry.promises\`): answered 는 풀이에서 답하고 · partly 는 어디까지인지 말하고 · still-unknown 은 이어짐의 "아직 모르는 것"에 그대로 둔다
- \`cover.recap\` 은 지난 회차의 요지 (뒤집기 · 오늘의 한 줄)에서 두 줄. 숫자는 이번 사실 목록에서 근거를 찾아 붙인다
- \`lab.seen_title\` 을 채운다. 준비 글 (\`setup\`)은 처음 온 독자용으로 그대로 쓴다 (그 그림을 본 독자에게는 화면이 준비 글을 뺀다)

## 본보기 — 다른 사건의 회차 (말투와 크기를 보라고. 이 사건의 정답이 아니다. 틀도 다르다)
{{EXEMPLAR}}

## 출력 — 칸 목록
JSON 하나: \`{ "cells": [ { "k": 칸의 길, "t": 글, "src": 근거, "calc": 계산, "voice": 꼬리표 }, … ] }\`. 아래 칸을 **이 차례대로** 채운다 (목록의 \`[i]\` 는 0 부터의 번호 — \`cover.recap[0]\` · \`cover.recap[1]\`).
"글 한 덩이 (T)" 칸은 네 값을 다 쓴다. "글자열" 칸 (맨 글자열 — 숫자 금지)은 \`t\` 에 값을 쓰고 \`src\` · \`calc\` 는 "" · \`voice\` 는 "none". 해당 없는 칸은 뺀다.

{{CELLS}}`;

// 글 한 덩이 — 문법 (structured outputs)이 커지지 않게 납작하게 받는다: src · calc 는 글자열, 없는 칸은 빈 글자열. parseWritten 이 WT · null 로 편다.
// (첫 판은 src 목록 · calc 목록 · null 가지를 그대로 뒀다가 "compiled grammar is too large" 로 거절됐다 — 값 0)
const T = obj({ t: str, src: str, calc: str, voice: en("fact", "official", "explain", "none") });
const TR = { $ref: "#/$defs/T" };
export type WT = { t: string; src: string[]; calc: { n: string; how: string }[]; voice: "fact" | "official" | "explain" | "none" };

export const WRITE_SPEC = {
  ...obj({
    voice_official: str, track_now_title: TR, track_next_title: TR,
    doc_names: arr(obj({ label: str, name: str })),
    cover: obj({ title: str, dek: TR, meta: TR, recap: arr(TR), ask_follower: str }),
    zero: obj({ title: TR, beats: arr(obj({ when: TR, head: str, body: TR })), ask: str }),
    event: obj({ title: str, lead: TR, figures: arr(obj({ who: str, amount: TR, tag: str })), figure_note: TR, quote_label: str, quote: TR, quote_note: str, riddle: arr(TR), ask: str }),
    tools_scene: obj({ ask: str }),
    tools: arr(obj({ key: str, short: TR, body: arr(TR), use: TR })),
    aha: obj({ real_label: str, real: arr(obj({ head: TR, body: TR })), verdict: TR, ask_new: str, ask_follower: str }),
    compare: obj({ title: str, lead: TR, cols: arr(TR), rows: arr(obj({ label: str, a: TR, b: TR })), body: arr(TR), ask: str }),
    next: obj({ title: str, line: arr(obj({ when: TR, what: str })), coming: arr(obj({ head: str, body: TR })), unknown: arr(TR), unknown_note: TR }),
    keep: obj({ line: str, next_body: TR }),
    entry: obj({ first_thought: TR, breaker: TR, flip_a: str, flip_op: str, flip_b: str, flip_note: TR, whose: TR }),
    lab: obj({
      title: str, seen_title: str, setup: arr(TR), born_lead: str,
      chain: obj({ tab: TR, nodes: arr(obj({ id: str, name: str, idle: str, value: TR })), unknown: str, action: str, caption_before: TR, caption_after: TR, go_on: TR }),
      seats: obj({ tab: TR, label: str, you: str, sides: arr(obj({ id: str, choose: str, group: TR, said: TR, not_yet_note: str })), other: str, result: TR, caption_before: TR }),
    }),
    plain: obj({ title: str, lead: TR, known: arr(TR), unknown: arr(TR), differ: arr(obj({ who: TR, says: TR })), differ_note: TR }),
  }),
  $defs: { T },
};

// ── 칸 목록으로 받는다 ───────────────────────────────────────────────────────────────────────────────
// 위의 SPEC 둘은 **API 에 보내는 스키마가 아니다** — 둘 다 "compiled grammar is too large" 로 거절됐다 (400 · 값 0. 납작하게 줄여도 같았다).
// 그래서 모델은 칸 목록 `{ cells: [{ k: 칸의 길, … }] }` 하나로 내고 (문법이 아주 작다), 코드가 SPEC 을 따라 칸을 모아 모양을 세운다 (fromCells).
// 모양의 보증이 API 에서 코드로 옮겨 왔다: 빠진 칸은 빈 값이 되고, 회차의 계약 검증 (validateEpisode)이 빈 칸 · 틀린 값을 잡는다.
export const DESIGN_SCHEMA = obj({ cells: arr(obj({ k: str, v: str })) });
export const WRITE_SCHEMA = obj({ cells: arr(obj({ k: str, t: str, src: str, calc: str, voice: en("fact", "official", "explain", "none") })) });
type Cell = { k: string; v?: string; t?: string; src?: string; calc?: string; voice?: string };
type Spec = { type?: string; properties?: Record<string, Spec>; items?: Spec; join?: boolean; enum?: readonly string[]; $ref?: string };

/** SPEC → 칸의 길 목록 (프롬프트에 넣는다). 목록은 [i] */
export function template(spec: Spec, path = ""): string[] {
  if (spec.$ref) return [`${path} = 글 한 덩이 (T)`];
  if (spec.type === "object") return Object.entries(spec.properties!).flatMap(([k, v]) => template(v, path ? `${path}.${k}` : k));
  if (spec.type === "array") return spec.join ? [`${path} = 빈칸으로 띄운 목록${spec.items?.enum ? ` (${spec.items.enum.join(" · ")} 가운데)` : ""}`] : template(spec.items!, `${path}[i]`);
  if (spec.type === "boolean") return [`${path} = true 또는 false`];
  if (spec.type === "integer") return [`${path} = 정수`];
  return [`${path} = ${spec.enum ? spec.enum.map((e) => `"${e}"`).join(" | ") : "글자열"}`];
}
const splitLabels = (v: string) => [...new Set(v.split(/[\s,·]+/).map((x) => x.trim()).filter(Boolean))];
const toWT = (c: Cell | undefined): WT => ({
  t: c?.t ?? c?.v ?? "",
  src: splitLabels(c?.src ?? "").filter((x) => /^F\d+$/.test(x)),
  calc: (c?.calc ?? "").split("||").map((x) => x.trim()).filter(Boolean).map((x) => { const k = x.indexOf(":"); return k < 0 ? null : { n: x.slice(0, k).trim(), how: x.slice(k + 1).trim() }; }).filter((x): x is { n: string; how: string } => !!x && !!x.n && !!x.how),
  voice: (["fact", "official", "explain", "none"].includes(c?.voice ?? "") ? c!.voice : "none") as WT["voice"],
});
/** 칸 목록 → SPEC 의 모양. 빠진 칸은 빈 값 ("" · [] · false · 0). 같은 길이 둘이면 뒤의 것. problems — SPEC 에 없는 길 · enum 밖의 값 */
export function fromCells(spec: Spec, cells: Cell[]): { value: unknown; problems: string[] } {
  const by = new Map(cells.map((c) => [c.k.trim().replace(/\[\s*(\d+)\s*\]/g, "[$1]"), c]));
  const used = new Set<string>();
  const problems: string[] = [];
  const text = (path: string) => { used.add(path); const c = by.get(path); return (c?.v ?? c?.t ?? "").trim(); };
  const rec = (sp: Spec, path: string): unknown => {
    if (sp.$ref) { used.add(path); return toWT(by.get(path)); }
    if (sp.type === "object") return Object.fromEntries(Object.entries(sp.properties!).map(([k, v]) => [k, rec(v, path ? `${path}.${k}` : k)]));
    if (sp.type === "array") {
      if (sp.join) {
        const vals = splitLabels(text(path));
        if (sp.items?.enum) for (const v of vals) if (!sp.items.enum.includes(v)) problems.push(`${path}: "${v}" 는 ${sp.items.enum.join(" | ")} 가 아니다`);
        return sp.items?.enum ? vals.filter((v) => sp.items!.enum!.includes(v)) : vals;
      }
      let n = -1;
      for (const k of by.keys()) if (k.startsWith(`${path}[`)) { const m = /^\[(\d+)\]/.exec(k.slice(path.length)); if (m) n = Math.max(n, Number(m[1])); }
      return Array.from({ length: n + 1 }, (_, i) => rec(sp.items!, `${path}[${i}]`));
    }
    const v = text(path);
    if (sp.type === "boolean") return v === "true";
    if (sp.type === "integer") return Number.isInteger(Number(v)) && v !== "" ? Number(v) : 0;
    if (sp.enum && v && !sp.enum.includes(v)) problems.push(`${path}: "${v}" 는 ${sp.enum.join(" | ")} 가 아니다`);
    return v;
  };
  const value = rec(spec, "");
  for (const k of by.keys()) if (!used.has(k)) problems.push(`모르는 칸 ${k}`);
  return { value, problems };
}
export function parseDesign(output: string): { design: Design; problems: string[] } {
  const { value, problems } = fromCells(DESIGN_SPEC as Spec, (JSON.parse(output) as { cells: Cell[] }).cells);
  return { design: value as Design, problems };
}

/** 모델 출력 (칸 목록) → Written. src "F001 F012" → 목록 · calc "6: 9월 16일 → 10월 28일 = 42일 || 12: 10 + 2" → 목록 · 빈 칸 → null */
export function parseWritten(output: string, frames: readonly string[], plainKind: string): Written {
  const o = fromCells(WRITE_SPEC as Spec, (JSON.parse(output) as { cells: Cell[] }).cells).value as Record<string, any>;
  const nt = (t: WT): WT | null => (t.t.trim() ? t : null);
  const e = o.entry;
  const lab = frames.length === 0 ? null : {
    title: o.lab.title, seen_title: (o.lab.seen_title ?? "").trim() || null, setup: (o.lab.setup as WT[]).filter((t) => t.t.trim()), born_lead: o.lab.born_lead.trim() || null,
    chain: frames.includes("chain") ? { ...o.lab.chain, go_on: nt(o.lab.chain.go_on) } : null,
    seats: frames.includes("seats") ? { ...o.lab.seats, sides: o.lab.seats.sides.map((s: any) => ({ ...s, not_yet_note: s.not_yet_note.trim() || null })) } : null,
  };
  const p = o.plain;
  return {
    voice_official: o.voice_official, track_now_title: o.track_now_title, track_next_title: o.track_next_title, doc_names: o.doc_names, cover: o.cover, zero: o.zero, event: o.event, tools_scene: o.tools_scene, tools: o.tools,
    aha: o.aha, compare: o.compare, next: o.next, keep: o.keep,
    entry: { first_thought: e.first_thought, breaker: e.breaker, flip: e.flip_a.trim() && e.flip_b.trim() ? { a: e.flip_a, op: e.flip_op.trim() === "=" ? "=" : "≠", b: e.flip_b, note: e.flip_note } : null, whose: e.whose },
    lab,
    plain: { title: p.title, three: plainKind === "three" ? { lead: p.lead, known: p.known, unknown: p.unknown, differ: p.differ, differ_note: nt(p.differ_note) } : null },
  };
}

export type Written = {
  voice_official: string; track_now_title: WT; track_next_title: WT; doc_names: { label: string; name: string }[];
  cover: { title: string; dek: WT; meta: WT; recap: WT[]; ask_follower: string };
  zero: { title: WT; beats: { when: WT; head: string; body: WT }[]; ask: string };
  event: { title: string; lead: WT; figures: { who: string; amount: WT; tag: string }[]; figure_note: WT; quote_label: string; quote: WT; quote_note: string; riddle: WT[]; ask: string };
  tools_scene: { ask: string };
  tools: { key: string; short: WT; body: WT[]; use: WT }[];
  aha: { real_label: string; real: { head: WT; body: WT }[]; verdict: WT; ask_new: string; ask_follower: string };
  compare: { title: string; lead: WT; cols: WT[]; rows: { label: string; a: WT; b: WT }[]; body: WT[]; ask: string };
  next: { title: string; line: { when: WT; what: string }[]; coming: { head: string; body: WT }[]; unknown: WT[]; unknown_note: WT };
  keep: { line: string; next_body: WT };
  entry: { first_thought: WT; breaker: WT; flip: { a: string; op: "≠" | "="; b: string; note: WT } | null; whose: WT };
  lab: null | {
    title: string; seen_title: string | null; setup: WT[];
    chain: null | { tab: WT; nodes: { id: string; name: string; idle: string; value: WT }[]; unknown: string; action: string; caption_before: WT; caption_after: WT; go_on: WT | null };
    seats: null | { tab: WT; label: string; you: string; sides: { id: string; choose: string; group: WT; said: WT; not_yet_note: string | null }[]; other: string; result: WT; caption_before: WT };
    born_lead: string | null;
  };
  plain: { title: string; three: null | { lead: WT; known: WT[]; unknown: WT[]; differ: { who: WT; says: WT }[]; differ_note: WT | null } };
};

export const writeSystem = (exemplar: string) => WRITE_SYSTEM.replace("{{EXEMPLAR}}", exemplar).replace("{{CELLS}}", template(WRITE_SPEC as Spec).join("\n"));
export const writeUser = (c: Ctx, design: string, human = "") => `${ctxBlock(c)}

## 설계 (앞 단계의 출력 — 뒤집기 · 사슬 · 자리 · 도구 · 장면 계획)
${design}

${human ? `## 사람 편집자의 확인 (설계 뒤 — 이것이 설계의 제안보다 앞선다)\n${human}\n\n` : ""}이 설계대로 회차의 글을 써라. 설계의 chosen_flip · frames · tools · plain_kind 를 바꾸지 않는다 (사람 편집자가 바꾼 것은 그대로 따른다). 설계의 do_not_write 를 쓰지 않는다.`;

// ─────────────────────────────────────────────────────────────────────────────────────────────── 함의
// W-2 (D49 — Opus medium)의 프롬프트를 그대로 쓰고 회차 글용 덧붙임만 단다.
//   /1 — 출력 모양 · 판정은 W-2 와 같다 (w2-prompt SCHEMA). 얼린 회차 (fomc-auto)의 저장한 판정을 대는 데만 쓴다 — **한 글자도 바꾸지 않는다** (요청 지문)
//   /2 — NOWHERE 를 둘로 가른다: 구절이 다루는 내용을 글이 넘겼다 (NOWHERE → EXCEEDS · 글을 줄인다) ↔ 구절이 다루지 않는 별개의 내용이다 (OTHER → UNDER_SOURCED · 근거부터 찾는다).
//        P-E1 의 걸림 17 가운데 열이 뒤의 꼴이었다 (logs/pipeline/P-E2.md ⑤). 재지 않았다 — 정답 묶음 data/episode-entail/gold.json 으로 잰다
export const ENTAIL_SYSTEM_V1 = `${W2_SYSTEM}

## 덧붙임 — 이번에 받는 글은 회차의 독자 글이다 (episode-entail/1)
- "사실"의 글은 독자에게 보이는 글 한 덩이다 (해요체 · 한 ~ 세 문장). fact_type 칸에는 그 글의 꼬리표가 온다: FACT 문서에 적힌 사실 · OFFICIAL_CLAIM 기관 · 당사자의 말 · EXPLAIN Claro 가 풀어 쓴 설명 · NONE 표지 · 머리
- **판정하지 않는 것**: 독자에게 말을 거는 부분 ("이상하죠" · "볼게요") · 물음 · 화면 안내 · 독자를 체험의 자리에 세우는 말 ("당신은 가게 사장님이에요") · 개념을 쉬운 말로 푸는 일반 설명 (EXPLAIN 글에서 근거 구절과 어긋나지 않는 것) · "우리가 확인한 문서에 아직 없다"는 말 (없음은 구절로 못 받친다 — 사람이 본다)
- **판정하는 것**: 그 글이 문서의 일로 말하는 것 — 누가 · 언제 · 무엇을 · 얼마나 · 왜. 특히 **원문에 없는 인과** ("A 라서 B 했다") · 주체가 바뀐 것 (기자의 말 → 당사자의 말 · 일부 → 전체) · 조건 · 단서가 빠진 것
- "계산" 줄이 있으면 그 수는 코드가 따로 본 것이다 — 계산이 맞는지는 묻지 않는다. 그 수를 구절에서 찾지 않는다
- 여러 근거에 걸친 글은 합쳐서 본다. 근거 문서가 다르면 날짜 · 주체가 섞이지 않았는지 본다`;

export const ENTAIL_SYSTEM = `${W2_SYSTEM}

## 덧붙임 — 이번에 받는 글은 회차의 독자 글이다 (${ENTAIL_VERSION})
- "사실"의 글은 독자에게 보이는 글 한 덩이다 (해요체 · 한 ~ 세 문장). fact_type 칸에는 그 글의 꼬리표가 온다: FACT 문서에 적힌 사실 · OFFICIAL_CLAIM 기관 · 당사자의 말 · EXPLAIN Claro 가 풀어 쓴 설명 · NONE 표지 · 머리
- **판정하지 않는 것**: 독자에게 말을 거는 부분 · 물음 · 화면 안내 · 독자를 체험의 자리에 앉히는 말 ("당신은 가게 사장님이에요") · 개념을 쉬운 말로 푸는 일반 설명 (EXPLAIN 글에서 근거 구절과 어긋나지 않는 것) · "우리가 확인한 문서에 아직 없다"는 말 (없음은 구절로 못 받친다 — 사람이 본다) · "지난 화에서는 ○○였다"처럼 Claro 의 앞 회차를 가리키는 말
- **판정하는 것**: 그 글이 문서의 일로 말하는 것 — 누가 · 언제 · 무엇을 · 얼마나 · 왜. 특히 **원문에 없는 인과** ("A 라서 B 했다") · 주체가 바뀐 것 (기자의 말 → 당사자의 말 · 일부 → 전체 · 이름 없는 "몇몇 참가자" → 이름 있는 사람) · 조건 · 단서가 빠진 것 · 수량어가 바뀐 것
- "계산" 줄이 있으면 그 수는 코드가 따로 본 것이다 — 계산이 맞는지는 묻지 않는다. 그 수를 구절에서 찾지 않는다
- 여러 근거에 걸친 글은 합쳐서 본다. 근거 문서가 다르면 날짜 · 주체가 섞이지 않았는지 본다

## 덧붙임 — "구절에도 둘레에도 없다"를 둘로 가른다 (where 의 값이 넷이다)
회차의 글은 여러 사실에 기대고, 글을 쓴 단계가 근거를 **덜 붙였을** 수 있다. 그래서 구절 · 둘레에 없는 부분을 이렇게 가른다. 고치는 길이 다르기 때문이다.
- **NOWHERE (넘침)** — 받은 구절이 **다루는 바로 그 내용**을 글이 더 세게 · 더 넓게 · 다르게 말했다. 구절의 말을 넘겼다: 구절은 "그동안 해 온 것"인데 글은 "지난번 조치" · 구절은 이번 문서 하나의 일인데 글은 늘 그렇다는 관행 · 구절은 "이번 회의에서"인데 글은 "이번에도" · 수량어 · 조건 · 주체를 바꿨다. → 글을 구절이 말한 데까지 줄여야 한다
- **OTHER (별개의 내용 — 근거가 덜 붙었을 수 있다)** — 받은 구절이 **아예 다루지 않는 다른 내용**이 글에 있다: 다른 날의 일 (그 조치가 인상이었다 · 표결이 몇 대 몇이었다) · 사람의 직함 · 표의 다른 줄이 있어야 설 말 ("그 뒤 처음" · "남은 것은 하나") · 다른 문서와의 견줌 ("지난번과 글자 그대로 같다"). 구절이 틀렸다는 것이 아니라 **이 내용을 받칠 구절이 여기 없다**는 것이다. → 다른 사실이 받칠 수 있는지 먼저 찾아야 한다
- 가르는 물음: "받은 구절이 이 부분에 대해 무언가 말하고 있는가." 말하고 있는데 글과 다르면 NOWHERE (어긋나면 CONFLICT) · 아무 말도 없으면 OTHER
- verdict: CONFLICT 가 하나라도 있으면 CONTRADICTS · 아니고 NOWHERE 가 있으면 EXCEEDS · 아니고 OTHER 가 있으면 **UNDER_SOURCED** · 아니고 CONTEXT 뿐이면 NEEDS_CONTEXT · 없으면 ENTAILED`;

/** 판마다의 함의 프롬프트 · 출력 모양 */
export const ENTAIL2_SCHEMA = {
  type: "object", additionalProperties: false, required: ["verdict", "issues", "note"],
  properties: {
    verdict: { type: "string", enum: ["ENTAILED", "NEEDS_CONTEXT", "UNDER_SOURCED", "EXCEEDS", "CONTRADICTS", "CANNOT_JUDGE"] },
    issues: { type: "array", items: { type: "object", additionalProperties: false, required: ["part", "kind", "where", "why"], properties: {
      part: { type: "string" }, kind: { type: "string", enum: ["QUANTITY", "CAUSE", "SCOPE", "TIME", "ACTOR", "CONDITION", "DETAIL"] }, where: { type: "string", enum: ["CONTEXT", "OTHER", "NOWHERE", "CONFLICT"] }, why: { type: "string" },
    } } },
    note: { type: "string" },
  },
} as const;
export type EVerdict = "ENTAILED" | "NEEDS_CONTEXT" | "UNDER_SOURCED" | "EXCEEDS" | "CONTRADICTS" | "CANNOT_JUDGE";
/** issues → verdict (/2). /1 의 판정 (OTHER 가 없다)에도 같은 값을 낸다 */
export function deriveVerdict(issues: { where: string }[]): EVerdict {
  if (issues.some((i) => i.where === "CONFLICT")) return "CONTRADICTS";
  if (issues.some((i) => i.where === "NOWHERE")) return "EXCEEDS";
  if (issues.some((i) => i.where === "OTHER")) return "UNDER_SOURCED";
  return issues.length ? "NEEDS_CONTEXT" : "ENTAILED";
}
export const entailSystem = (version: string) => (version === "episode-entail/1" ? ENTAIL_SYSTEM_V1 : ENTAIL_SYSTEM);

export const entailUser = (text: { t: string; voice: string; calc: { n: string; how: string }[]; where: string }, evidence: { title: string; publisher: string; published_at: string; passage: string; context: string | null }[]) => {
  const lines = ["## 사실", `글: ${text.t}`, `fact_type: ${{ fact: "FACT", official: "OFFICIAL_CLAIM", explain: "EXPLAIN", none: "NONE" }[text.voice] ?? "NONE"}`, "actor: —", "event_at: —", "as_of: —"];
  if (text.calc.length) lines.push(`계산: ${text.calc.map((c) => `${c.n} = ${c.how}`).join(" · ")}`);
  evidence.forEach((e, i) => lines.push("", `## 근거 ${i + 1}`, `문서: ${e.title} · ${e.publisher} · 공개 ${e.published_at}`, `구절: ${e.passage}`, e.context == null ? "둘레: 없음" : `둘레: ${e.context}`));
  return lines.join("\n");
};

// ─────────────────────────────────────────────────────────────────────────────────────────────── 고치기
export const REPAIR_SYSTEM = `너는 Claro 의 회차 글 고치기 단계다. 회차의 독자 글 가운데 검사에 걸린 덩이들을 받아, **걸린 것만 고친다.**

## 받는 것
덩이마다: 자리 (어느 장면의 어느 칸) · 지금 글 · 근거 사실 (label · 구절 · 둘레) · 걸린 까닭 —
- 함의: 다른 모델이 "글의 이 부분이 구절에서 나오지 않는다 (또는 어긋난다)"고 가리킨 것. 가리킨 부분마다 갈래가 있다 — **넘침** (NOWHERE: 구절이 다루는 내용을 글이 넘겼다) · **별개의 내용** (OTHER: 구절이 다루지 않는 내용 — 근거가 덜 붙었을 수 있다) · 어긋남 (CONFLICT)
- 숫자: 글의 숫자가 근거 구절에도 계산 (calc)에도 없다 · 맨 글자열 칸에 아라비아 숫자가 있다

## 고치는 법
- 걸린 부분만 고친다. 말투 (해요체 · 짧은 문장 · 친구가 옆에서)와 나머지 글은 그대로 둔다
- **별개의 내용 (OTHER)은 근거부터 찾는다**: 글은 맞는데 **근거를 덜 붙인 것**인가. 그렇다면 글은 두고 \`src\` 에 그 내용을 받치는 사실을 더한다 — 맨 아래 "쓸 수 있는 사실" 목록의 label 에서만 고른다 (목록의 글이 그 내용을 분명히 말할 때만)
- **넘침 (NOWHERE)은 글을 줄인다** — 근거를 더 붙여 넘친 말을 살리려 하지 않는다. 별개의 내용도 받칠 사실이 목록에 없으면 그 조각을 뺀다. 넘친 말은 **구절이 말한 데까지로 줄인다.** 구절에 없는 인과 · 주체 · 시점 · 정도 · 직함 · 일반화를 지운다. 근거를 지어내지 않는다 — 목록 밖의 label 을 쓰지 않는다
- \`src\` 는 고친 글이 기대는 사실 전부다 (지금 붙어 있는 것 가운데 그대로 쓰는 것 + 더한 것)
- 숫자: 구절에 있는 수로 바꾸거나 · calc 에 \`{ n, how }\` 로 밝히거나 (그 계산이 근거 구절의 수에서 나올 때만) · 숫자를 뺀다 (한글 말로). 맨 글자열 칸은 숫자를 한글로
- 가리킨 것이 트집이라고 보면 (독자가 받는 그림이 달라지지 않는다) 글을 그대로 두고 \`action\` 을 "keep" 으로, 까닭을 적는다 — 사람이 본다
- 고쳐도 설 수 없는 덩이 (근거 없이는 뜻이 없다)는 \`action\` 을 "drop" 으로. 그 칸이 빠질 수 없는 칸이면 사람이 고친다

## 출력
JSON 하나. 덩이마다 \`id\` (받은 그대로) · \`action\` ("fix" · "keep" · "drop") · \`t\` (고친 글 — keep · drop 이면 지금 글 그대로) · \`src\` · \`calc\` · \`why\` (무엇을 왜 — 한 문장).`;

export const REPAIR_SCHEMA = obj({
  items: arr(obj({ id: str, action: en("fix", "keep", "drop"), t: str, src: labels, calc: arr(obj({ n: str, how: str })), why: str })),
});
export type Repair = { items: { id: string; action: "fix" | "keep" | "drop"; t: string; src: string[]; calc: { n: string; how: string }[]; why: string }[] };
