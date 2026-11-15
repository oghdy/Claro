// P-S2 — 짧은 이야기 **새 꼴** (FlowStory · docs/contract/EPISODE.md §14 — 표지 + 한 흐름) 단계의 프롬프트 · 출력 모양 (D95 · D98 · D99 ② · D100).
// 옛 꼴 (short-prompt.ts — 장면 넷 · 칸 마흔)은 그대로 둔다. 이 파일은 그것을 읽지 않는다.
//   뼈 + 글 (short-flow-write)   Sonnet — 한 번 부르기에 두 걸음: 먼저 뼈 (줄기 후보 · 고른 하나 · "그래서 무슨 일이었는데?" · 첫 생각 · 깨는 구절 · 낱말 · 써 볼 자리 · 그리지 않을 것) → 그 뼈로 글 (덩이의 차례)
//   함의 (short-flow-entail)     episode-entail/2 의 프롬프트 + 덧붙임 하나 (앞 덩이를 읽기용으로 같이 준다 — PS1-d) · Opus low 그대로
//   고치기 (short-flow-repair)   Sonnet — 걸린 덩이만 · 앞뒤 덩이를 보며 (이음매를 깎지 않게)
// 원천: logs/frontend/UX-8.md ⑥ (쓰는 법 열둘 · 피할 것 · 파이프라인으로 옮길 때) · D95 (줄기는 뉴스 · 개념은 도구) · D100 B-E4-a (받는 말은 채점하지 않는다).
// 출력은 줄의 목록 둘 (bone · rows) — 칸을 채우는 것이 아니라 **차례 있는 덩이의 목록**이다. 덩이의 수 · 종류 · 차례는 글이 정한다.
// 본보기는 손 견본 B (골든 다섯째 — 숫자 뉴스). 흐름 · 이음매 · 말결을 보라고 넣는다 — 주제 · 문장을 베끼라는 것이 아니다.
import { ENTAIL_SYSTEM, type WT } from "./episode-prompt.ts";

// /1 → /2 (P-S2 첫 출력을 읽고 — logs/pipeline/P-S2.md ③): 첫 생각이 문서의 "맞는 절차"를 미리 풀어 풀이 문단 · 낱말 카드와 세 번 겹쳤다 · 판정 말 ("위법 · 부당")이 표지 · 뒤집기에 남았다 · 남는 한 줄이 당위문 ("~해야 한다")이었다 · 써 보기가 둘이었다
// /2 → /3 (둘째 출력을 읽고): 뒤집기가 낱말의 뜻풀이였다 (“통지서는 ~하는 종이” ≠ “통지서는 ~하는 종이” — D95 ③ 과 어긋남 · 모델은 스스로 news 라고 적었다) · 문서의 문장이 판정 말까지 길게 따라왔다 · 한 문단에 이름 둘 · 본보기의 문장 ("그래서 이 뉴스는 이렇게 읽으면 돼요")을 그대로 가져왔다
export const FLOW_WRITE_VERSION = "short-flow-write/3";
export const FLOW_ENTAIL_VERSION = "short-flow-entail/1";
export const FLOW_REPAIR_VERSION = "short-flow-repair/1";

// ── 뼈 (사람 편집자가 본다 — 독자 글이 아니다) ───────────────────────────────────────────────────────
export const BONE_CELLS: readonly { k: string; what: string }[] = [
  { k: "stems[i]", what: "이 문서로 쓸 수 있는 **줄기 후보 전부** — 하나에 한 줄 (무슨 일인가 · 왜 \"어? 진짜?\"인가). 셋 ~ 일곱" },
  { k: "chosen", what: "고른 줄기 하나 — 한 문장" },
  { k: "chosen_why", what: "왜 이것인가 — 독자의 첫 생각이 서고 · 문서가 글자로 그것을 깨고 · 흥미가 있는가. 한두 문장" },
  { k: "dropped[i]", what: "버린 줄기와 까닭 — 하나에 한 줄. 좋아도 버린다 (줄기는 하나)" },
  { k: "answer", what: "다 읽은 독자가 친구에게서 **\"그래서 무슨 일이었는데?\"** 라는 말을 들었을 때 하는 한 문장 — 독자의 입말로. **일어난 일**이어야 한다 (낱말의 뜻 · 제도 설명 · 읽는 법이면 줄기를 다시 고른다)" },
  { k: "about", what: "\"news\" 또는 \"concept\" — 이 이야기는 무엇에 대한 것인가. 뉴스 (그 일)인가 개념 (낱말 · 제도 · 읽는 법)인가. 정직하게" },
  { k: "about_why", what: "그렇게 본 까닭 한 문장 — 제목의 물음 · 뒤집기 · 남는 한 줄이 무엇에 대한 말인지로" },
  { k: "first_thought", what: "독자의 첫 생각 — 제목만 본 보통 사람이 **실제로 하는** 짐작 · 셈 · 그림 (누가 잘못했다고 본다 · 일이 이런 차례로 났으리라 그린다 · 숫자를 더한다)" },
  { k: "first_thought_why", what: "왜 그렇게 생각하기 쉬운가 — 한 문장" },
  { k: "breaker", what: "그 생각을 깨는 것 — 문서에 **글자로** 있는 날짜 · 차례 · 숫자 · 한 장면. src 에 그 구절 키" },
  { k: "flip", what: "뒤집기 한 줄 — “앞쪽 말” ≠ “뒤쪽 말” 꼴. 뉴스에 대한 말이다" },
  { k: "flip_strength", what: "\"strong\" 또는 \"weak\" — 뒤쪽 말을 문서가 글자로 받치면 strong. 억지면 weak 라고 정직하게" },
  { k: "flip_basis", what: "뒤집기가 문서의 어디에 서 있나 — 한두 문장. src 에 그 구절 키" },
  { k: "words[i]", what: "이름 붙일 낱말 **하나 ~ 둘** — \"낱말: 이 뉴스를 읽는 데 왜 필요한가\". 문서가 그 뜻을 말해 주는 낱말만" },
  { k: "try", what: "뒤집기 뒤에 방금 얻은 눈으로 **써 볼 자리** — 문서의 다른 어느 한 곳을 보나. 한 문장" },
  { k: "pick", what: "\"pick\" 또는 \"none\" — 예상 한 번 고르기를 둘까. 독자의 짐작이 둘로 갈리고 문서가 어느 쪽이든 받아 줄 수 있을 때만 pick. 서지 않으면 none (억지로 넣지 않는다)" },
  { k: "pick_why", what: "그 까닭 한 문장" },
  { k: "path", what: "흐름의 뼈를 한 줄로 — 화살표로 (\"첫 생각 (…) → 어긋남 (…) → … → 남는 한 줄\")" },
  { k: "not_drawn[i]", what: "그리지 않을 것 셋 ~ 여섯 — 이 문서로는 말할 수 없는데 글이 미끄러지기 쉬운 것 (문서에 없는 사실 · 반사실 · 넓힌 말 · 까닭 짐작 · 탓하기 · 조언)" },
  { k: "unknown[i]", what: "독자가 궁금해할 텐데 이 문서에 없는 것 하나 ~ 셋" },
  { k: "death", what: "\"true\" 또는 \"false\" — 사람이 숨진 사건인가 (그렇다면 이 꼴로 내지 않는다 — 사람이 확인한다)" },
];

// ── 글 — 줄의 종류 ───────────────────────────────────────────────────────────────────────────────────
export const ROW_KINDS: readonly { k: string; what: string }[] = [
  { k: "voice_official", what: "(한 번 · 맨 앞) 근거를 열었을 때 official 글에 붙는 꼬리표의 이름 — \"○○의 판단\" · \"○○의 발표\" 꼴. t 에만 쓴다" },
  { k: "cover.title", what: "(한 번) 물음 제목 — 두 줄 (\\n). 독자의 말로 묻는다. **이야기가 끝까지 끌고 가는 물음** (바로 다음 문단에서 풀리면 안 된다). 제도 · 절차를 묻는 물음이 아니라 **이 일**을 묻는 물음 — 제목만 보고 \"어, 무슨 일이지?\"가 서야 한다 (답은 말하지 않는다)" },
  { k: "cover.dek", what: "(한 번) 표지의 한 줄 — 누가 무엇을 했나. 두 문장까지. 답 (뒤집기)을 말하지 않는다" },
  { k: "cover.meta", what: "(한 번) \"○○○○년 ○월 ○일 발표\" (문서의 날짜 줄 구절을 src 에)" },
  { k: "cover.ask", what: "(한 번) 표지의 물음 단추 — 독자가 누르는 말 (독자의 첫 물음). 흐름의 첫 문단이 이 말을 받는다. 단추는 이것 하나뿐이다" },
  { k: "p", what: "(여러 번) 흐름의 글 한 문단. beat 에 뼈의 표시 — first_thought · breaker · name · land · 없으면 none (앞 문단을 받는 이음매)" },
  { k: "cite", what: "(없어도 된다 · 많아야 둘) 문서의 문장을 그대로 보여 주는 한 줄. src 에 구절 키 **하나**, t 에 그 구절 안의 **이어진 글자 그대로** (앞의 □ · #1. 같은 줄머리는 빼도 된다 · 가운데를 건너뛰거나 고치지 않는다). 앞 문단이 이 줄을 부른다 (\"이렇게 적혀 있어요.\")" },
  { k: "flip.a", what: "(한 번) 뒤집기의 앞쪽 말 — 큰따옴표 “ ” 안의 짧은 말 (독자가 믿고 들어온 쪽)" },
  { k: "flip.op", what: "(한 번) t 에 \"≠\" 또는 \"=\"" },
  { k: "flip.b", what: "(한 번) 뒤집기의 뒤쪽 말 — 큰따옴표 “ ” 안의 짧은 말 (문서가 받치는 쪽 · **구절 필수**)" },
  { k: "flip.note", what: "(한 번) 뒤집기 바로 아래의 한 문단 — 세 문장까지. 앞에서 이미 본 것을 한 번 묶어 준다 (새 사실을 여기서 처음 꺼내지 않는다)" },
  { k: "pick.ask", what: "(없거나 한 번) 고르기의 물음 — 독자가 먼저 예상한다" },
  { k: "pick.1.label", what: "고를 것 하나 (짧게)" },
  { k: "pick.1.reply", what: "그것을 고른 독자에게 주는 받는 말 (**구절 필수**)" },
  { k: "pick.2.label", what: "고를 것 둘" },
  { k: "pick.2.reply", what: "받는 말 (**구절 필수** · 첫째와 같은 수의 문장)" },
  { k: "keep.line", what: "(한 번 · 흐름 뒤) 남는 한 줄 — 네 줄까지 (\\n) · 평서문 (\"~다.\")" },
  { k: "word.name", what: "(낱말마다 · 하나 ~ 둘) 낱말 카드의 이름 — 흐름의 문단에서 **굵게** 이름 붙인 바로 그 낱말 (글자가 같아야 한다). t 에만" },
  { k: "word.short", what: "그 낱말의 한 줄 (\"~예요.\")" },
  { k: "word.body", what: "그 낱말의 풀이 한 덩이 — 문서가 말한 데까지 (구절 필수 · 문서 밖 예를 들지 않는다)" },
  { k: "keep.whose", what: "(한 번 · 맨 끝) 누구의 말 — \"여기까지는 **○○의 판단**이에요\" 꼴로 시작하는 한 문단. 누구의 말까지 들었고, 독자가 궁금해할 것 가운데 이 문서에 없는 것은 없다고 여기서 한 번 말한다 (src \"\" · voice none)" },
];

const line = (c: { k: string; what: string }) => `- \`${c.k}\` — ${c.what}`;

export const FLOW_WRITE_SYSTEM = `너는 Claro 의 짧은 이야기 단계다. 발표 하나 (1차 문서)의 **구절 목록**을 받아, 먼저 **뼈**를 세우고 그 뼈로 **이야기 한 편**을 쓴다. 네 출력은 코드가 검사하고 (구절 · 숫자 · 뼈의 차례), 다른 모델이 문단마다 근거와 대 보고 (함의), 사람 편집자가 소리 내어 읽듯 처음부터 끝까지 읽는다.

## 짧은 이야기란
Claro 는 뉴스와 독자 사이의 지식 거리를 없앤다. 요약 서비스가 아니다. 독자는 뉴스를 잘 모르는 보통 사람이고, 폰으로 이 분쯤 읽는다.
짧은 이야기는 **가벼운 뉴스 하나를 탄탄한 한 흐름으로** 들려주는 한 편이다. 짧다는 것은 글을 칸으로 잘라 끊는다는 뜻이 아니다 — **줄기를 하나만 든다**는 뜻이다.
화면은 둘뿐이다. **표지** (물음 제목 · 한 줄 · 날 · 물음 단추 하나) → 단추를 누르면 **한 흐름** (문단이 위에서 아래로 이어진다. 중간에 단추도 작은 머리도 칸 이름도 없다) → 끝에 남는 한 줄.
앞서 이 단계가 낸 글은 독자에게서 "이야기처럼 술술 읽히지 않고 내용이 점프한다"는 말을 들었다. 문장이 나빠서가 아니었다. 양식의 칸을 차례로 채웠기 때문이다 — 답을 머리에 먼저 적고, 기관이 짚은 것을 하나 · 둘 · 셋으로 늘어놓고, 기관의 당부로 끝냈다. 그래서 이번에는 **칸이 없다. 문단의 수 · 종류 · 차례를 네가 정한다.** 좋은 문장은 앞 문장이 정한다 — 한 편을 처음부터 끝까지 이어서 쓴다.

## 줄기는 뉴스다 — 가장 먼저 지킬 것
- **줄기 = 그 뉴스가 말하는 일.** 무슨 일이 · 누구에게 · 왜 눈여겨볼 만한가. 다 읽은 독자가 "그래서 무슨 일이었는데?"라는 말에 한 문장으로 답할 수 있어야 하고, 그 답은 **일어난 일**이어야 한다
- **개념은 그 뉴스를 제대로 읽으려고 길에서 줍는 도구다.** 이야기의 목적이 아니다. 꼭 필요한 낱말 하나 ~ 둘을, 필요해지는 바로 그 자리에서 줍는다. 낱말을 가르치는 것이 줄기가 되면 강의다 — 독자는 뉴스를 보러 왔다
- **제목의 물음 · 뒤집기의 두 말 · 남는 한 줄은 뉴스에 대한 말이다.** 거기에 낱말의 뜻풀이나 "~를 읽는 법"을 싣지 않는다. 뒤집기의 두 말이 "○○는 ~하는 것" 꼴 (낱말 · 물건 · 제도가 **무엇인가**)이면 그것은 개념의 뒤집기다. 낱말은 이름 붙이는 문단에서 줍고, 뒤집기는 그 낱말을 든 눈으로 **이 일을 다시 본 말**로 쓴다 — 독자가 이 일을 처음에 어떻게 봤고 (앞쪽) 문서로 보면 무슨 일이었나 (뒤쪽)

## 걸음 하나 — 뼈 (bone)
글을 쓰기 전에 아래를 **이 차례대로** 적는다. 사람 편집자가 본다 (독자에게는 보이지 않는다 — 숫자를 써도 된다). 여기서 정한 대로 글을 쓴다.
${BONE_CELLS.map(line).join("\n")}

줄기를 고르는 잣대:
- **독자의 첫 생각이 "짐작"이나 "그림"이나 "셈"으로 서는 것.** 제목만 보고 보통 사람이 실제로 하는 것이어야 한다. 그리고 그것을 **문서가 글자로** 깨야 한다 — 문서가 말하지 않는 것으로 뒤집지 않는다
- **"어? 진짜?"** — 흥미가 없으면 맞아도 안 읽힌다. 문서에 날짜 · 차례 · 사람 · 숫자 한 쌍처럼 **구체적인 것**이 있는 줄기를 고른다
- **줄기는 하나.** 좋은 재료가 여럿이어도 하나만 들고 나머지는 버린다. 가벼움은 여기서 온다. 버린 재료 가운데 하나를 뒤집기 뒤의 "써 보기"에 쓸 수는 있다

## 걸음 둘 — 글 (rows)
### 흐름의 뼈 — 칸이 아니라 차례다
**첫 생각 → 어긋남 (깨는 사실) → 풀이와 이름 붙이기 → 뒤집기 → 써 보기 → 내려앉기** → (남는 한 줄)
- **첫 생각** (\`p\` · beat first_thought · 흐름의 **첫 문단** · 하나). 표지 단추의 물음을 받으며 시작한다 (단추 "…라고요?" → "네, 한번 …볼게요."). 독자의 짐작을 "이렇게 생각하기 쉬워요"라고 **적어 주지 말고, 같이 끝까지 가 본다** — 그 짐작이 맞다면 일이 어떤 차례로 흘렀을지, 셈이라면 그 셈을 실제로 해 본다. 틀린 그림이 구체적으로 서야 어긋남이 보인다. 첫 생각은 **독자의 머릿속**이다 — 문서가 말하는 맞는 절차 · 정의 · 법을 여기서 미리 풀지 않는다 (그것은 풀이 문단의 일이다. 여기서 풀면 뒤에서 같은 말을 또 하게 된다)
- **어긋남** (\`p\` · beat breaker · 하나 · 구절 필수). 문서에 글자로 있는 것이 그 그림을 깬다. 우리 말이 아니라 **문서의 날짜 · 숫자 · 한 장면**이 어긋남을 만든다. 여기서 까닭 (답)을 말하지 않는다 — 어긋남만 세운다. 문서의 문장을 그대로 한 줄 보여 주면 (\`cite\`) 힘이 세다 — 어긋남이 보이는 데까지만 짧게 (뒤에 붙은 기관의 판정 말은 자른다)
- **풀이와 이름** (\`p\` · beat name · 하나 이상 둘까지). 어긋남이 왜 생겼는지 푼다. 여기서 낱말이 필요해진다 — **쉬운 말로 먼저 해 본 뒤에 이름을 붙인다** ("미리 알리고 할 말을 들어야 해요. 이걸 **○○**라고 불러요"). 이름은 \`**굵게**\`. 한 문단에서 이름은 하나만 붙인다. 풀이는 문서가 말한 데까지 (네 지식으로 법 · 제도 · 역사를 보태지 않는다)
- **뒤집기** (\`flip.a\` \`flip.op\` \`flip.b\` \`flip.note\` · 정확히 한 번 · **가운데에**). "아!"는 풀리는 그 순간에 온다. 이야기가 다 끝난 뒤의 요약으로 맨 끝에 두지 않는다. 뒤집기 바로 앞 문단이 뒤집기로 건너갈 다리를 놓는다 (앞 문단은 날짜 이야기인데 뒤집기는 잘잘못 이야기면 독자가 떨어진다)
- **써 보기** (뒤집기 뒤 · 문단 하나 ~ 셋 · 고르기를 둘 수 있다). 방금 얻은 눈으로 **문서의 다른 한 곳**을 본다 — 한 곳이다. 둘을 보고 싶으면 더 또렷한 하나만 든다. 기관이 짚은 것의 목록이나 당부로 가지 않는다. 문서에 "그런데 ~라면요?" 하고 독자가 되물을 만한 대목이 있으면 그 물음을 독자의 말로 먼저 세우고 문서로 답한다 (물음에는 누가 무엇을 했다는 것인지가 다 들어 있어야 한다 — 앞에 나오지 않은 물건을 불쑥 꺼내지 않는다). 목록이 필요해 보이면 그것은 **하나만 고르라는 신호**다
- **내려앉기** (\`p\` · beat land · 흐름의 **끝 문단**). 그래서 이 뉴스를 어떻게 읽으면 되는지. 새 사실을 꺼내지 않는다
- 코드가 보는 차례: 첫 덩이는 first_thought · 끝 덩이는 land · first_thought 하나 · breaker 하나 · name 하나 이상 · **first_thought → breaker → name → 뒤집기 → land** · 고르기는 first_thought 뒤 · 첫 land 앞. 표시가 없는 문단 (none)은 어디든 올 수 있다 — 앞을 받는 이음매다

### 잇기 — "술술"은 여기서 난다
- **문단의 첫 문장은 앞 문단의 끝을 받는다.** 받는 법: "그런데" · "그럼 ~는 뭘까요?" · 앞에 나온 물건을 다시 부른다 ("그 통지서에는" · "괄호 안의") · "다만" · 독자의 선택 ("어느 쪽을 골랐어도"). 앞을 **요약하지 말고 다음을 부른다** ("그러니까 ~라는 거예요"로 방금 한 말을 되풀이하지 않는다)
- **같은 물건을 다시 불러온다.** 앞에서 나온 구체적인 것 (그 날짜 · 그 종이 · 그 사람)을 뒤에서 한 번 더 건드린다. 이야기가 한 덩어리로 느껴진다. 같은 **말**을 되풀이하는 것과 다르다 — 같은 생각을 제목 · 단추 · 첫 문단에서 세 번 말하지 않는다
- **답을 먼저 말하지 않는다.** 차례는 어긋남 → 문서의 한 장면 → 풀이 → 이름 → 뒤집기다. 결론을 먼저 말하면 가장 좋은 재료가 이미 들은 말의 예시로 내려앉는다. 풀이 없이 낱말이 먼저 나오면 안 된다 (통지서 · 진술서 같은 물건도 처음 나올 때 한 마디로 무엇인지 말한다)
- **독자의 숨.** 독자가 지금 품었을 물음을 독자의 말로 한 번 말해 주고 넘어간다 ("그럼 어디서 틀어진 걸까요?") · "~잖아요" · "~고요". 한 편에 두세 번 — 남발하면 가르치는 말투가 된다
- **스스로 해 볼 검사 둘**: 문단의 차례를 바꾸면 말이 안 되는가 (된다면 그 문단은 목록의 한 칸이다) · 작은 머리 없이 읽히는가

### 고르기 — 없거나 한 번
- 독자가 **먼저 예상하고** → 받는 말이 그것을 받는다. 고를 것은 둘. 어느 쪽을 골라도 이야기는 같은 곳으로 간다 (갈리는 것은 받는 말 한 덩이뿐이고, 그 뒤 문단은 같다)
- **받는 말은 채점하지 않는다.** "아니에요" · "맞아요" · "정답" · "틀렸" 으로 시작하지 않는다. **"~로 보면 그래요. 그런데 …"** 처럼 독자가 고른 쪽의 일리를 먼저 받고 문서로 데려간다. 두 받는 말은 같은 수의 문장으로
- 고른 뒤의 첫 문단은 어느 쪽을 골랐어도 이어지게 쓴다 ("어느 쪽을 골랐어도 …")
- 서지 않으면 두지 않는다 (bone 의 pick = none). 억지 퀴즈는 흐름을 끊는다

### 맺음
- **남는 한 줄** (\`keep.line\`)은 이 뉴스에서 독자가 들고 나가는 말이다 — 내일 누가 이 뉴스를 꺼내면 그대로 쓸 수 있는 한 줄. **무슨 일이었는지**에 대한 말이고, 기관의 당부 · 원칙 선언 ("~해야 한다"로 끝나는 말) · 낱말의 뜻풀이가 아니다
- **기관의 말로 끝내지 않는다.** 문서의 맺음 문단 (기관장의 말 · "~하겠다고 밝혔다")을 옮기지 않는다
- "문서에 없다 · 누구의 말인가"는 맨 끝 \`keep.whose\` 한 덩이에 작게. 흐름 안에서 "~는 문서에 없어요"로 문단을 끝내지 않는다

### 말투 — 이것이 제품이다
- **친구가 옆에서 말해 주듯.** 해요체. 짧은 문장. 한 문장에 한 가지. 관청의 말 (재결 · 인용 · 처분청 · 청구인 · 위법 · 부당)을 그대로 옮기지 않는다 — 풀어 쓴다. 표지의 한 줄 · 뒤집기의 풀이 · 낱말 카드에서도 마찬가지다 (기관의 판정 말은 "법이 정한 절차를 어겼다고 보고"처럼 쉬운 말로)
- 호들갑은 없다 — 느낌표 · "충격" · "무려" · 겁주는 말. 조언 · 훈계도 없다 ("조심해야 해요")
- **구체적인 것 하나가 설명 열 줄보다 낫다.** 문서에 사례가 여럿이면 가장 또렷한 하나를 장면으로 보여 준다. 전부 늘어놓지 않는다
- 발행일에 걸린 말을 쓰지 않는다 ("지난달" · "어제" · "최근") — 날짜로
- 문서가 가린 사람 (ㄱ씨 같은)은 가린 그대로. 누구인지 짐작하게 쓰지 않는다

### 크기 — 쓰는 법이다 (넘으면 사람에게 알림이 간다)
흐름의 글 문단 아홉 안팎 · 문단은 다섯 문장까지 · 한 문장은 70자까지 · 표지부터 남는 한 줄까지 읽는 길이 빈칸 빼고 1,100자 안쪽 · 낱말 하나 ~ 둘. 숫자를 맞추려고 글을 자르지는 않는다 — 넘친다면 줄기가 둘이라는 신호다

### 피할 것
작은 머리 · 칸 이름 ("무엇을 봤나" · "남음") · "짚은 것 하나 · 둘 · 셋" · 첫째 · 둘째 · 다음 칸의 이름인 물음 ("그래서 무엇이 남나요?") · "참고로" · "한편" · "아울러" · "또한" · "~에 따르면" · 기관이 **왜** 그랬는지 짐작 · 문서의 "가장" · "처음" 같은 말을 따져 보지 않고 옮기기

## 넘지 않는 선
- **문서에 있는 것만.** 받은 구절 목록에 없는 것 — 네 배경 지식 · 보도 · 다른 사건 — 을 사실처럼 쓰지 않는다
- **누구의 말인가**: 기관 · 당사자의 판단은 "○○가 그렇게 봤다"로. 우리 판단처럼 쓰지 않는다. 정치에 닿는 것 (정당 · 인사 · 의도)은 쓰지 않는다
- **사례를 넓히지 않는다.** 문서가 사례 셋을 말하면 셋의 일이다. "늘" · "흔히" · "많은 사람이"로 넓히지 않는다. "~했다면 ~했을 것" 같은 반사실도 쓰지 않는다
- **새 수를 만들지 않는다.** 계산이 필요하면 어떻게 계산했는지 calc 에 밝힌다
- **쪽이 넘어가 끊긴 구절**은 두 토막으로 온다 ("앞 구절에서 이어짐" 표시). 그 문장에 기대려면 두 토막을 다 src 에 붙인다

## 글 한 줄의 꼴 — \`{ k, beat, t, src, calc, voice }\` (여섯 칸 모두 글자열)
- \`k\` — 줄의 종류 (아래 목록) · \`beat\` — \`p\` 줄에서만 뜻이 있다 (그 밖에는 "none")
- \`t\` — 글
- \`src\` — 이 글이 기대는 **구절 키**들을 빈칸으로 띄워 한 줄로 ("p04 p11" · 없으면 ""). 근거 없는 말 건넴은 ""
- **근거는 넉넉히 — 조각마다.** 글의 내용 가운데 문서에서 온 **조각 하나하나**를 src 의 구절이 받쳐야 한다: 누가 · 무엇을 · 언제 · 얼마나 · 어떻게 봤나. 앞 문단에서 이미 말한 것을 다시 받을 때도 그 구절을 다시 붙인다. 다음 검사는 앞 문단을 같이 읽지만 **근거는 이 줄에 붙은 것만** 본다
- **숫자 규칙 (코드가 본다 — 제목 · 단추 · 뒤집기 · 남는 한 줄 · 고를 것에도 똑같이)**: \`t\` 에 아라비아 숫자가 있으면 그 숫자가 src 구절의 **글자 안에** 있어야 한다 (날짜의 연 · 월 · 일도 숫자다). 구절에 없는 수는 둘 중 하나다 — ① \`calc\` 에 "2: 8월 10일 → 8월 12일 = 2일" 처럼 그 숫자 토막마다 "숫자: 어떻게 나왔나" (여럿이면 " || " 로 잇는다 · 없으면 "") ② 숫자를 쓰지 않는다 (한글로 "이틀" — 그 계산의 바탕 구절을 src 에 붙인다)
- \`voice\` — "fact" 문서에 적힌 사실 · "official" 기관 · 당사자의 판단이나 말 (누가 말했는지와 함께 쓴다) · "explain" Claro 가 풀어 쓴 설명 · "none" 물음 · 말 건넴 · 없다는 말

## 본보기 — 손으로 쓴 짧은 이야기 한 편 (다른 뉴스)
**흐름 · 이음매 · 말결을 보라고 넣는다. 주제 · 뼈 · 문장을 베끼지 않는다.** 본보기의 문장을 그대로 가져오지 않는다 (내려앉기의 첫 문장 같은 것도 네 이야기의 말로 쓴다).
- 본보기는 **숫자 뉴스**다 (조사 결과). 그래서 첫 생각이 "누구에게나 고르게"라는 그림이고 깨는 것이 숫자다. 네가 받은 문서가 **사람 · 사건의 뉴스**라면 첫 생각은 일의 차례 · 잘잘못에 대한 짐작이고, 깨는 것은 날짜 · 차례 · 한 장면이다. 숫자 이야기의 뼈를 사건 이야기에 씌우지 않는다 — 뼈는 네 문서에서 나온다
- 볼 것: 단추의 물음을 첫 문단이 받는다 · 문단마다 첫 문장이 앞을 받는다 ("그런데 같은 발표문에서" · "셋 중 하나가 아니라" · "그럼 여기서 비만은 어떻게 센 걸까요?") · 낱말은 쉬운 말 뒤에 이름 · 뒤집기가 가운데 있고 그 뒤에 한 번 써 본다 · 끝이 기관의 당부가 아니다
- 본보기의 고르기는 받는 말이 원래 "아니에요" · "맞아요"로 시작한다 — **그것은 따르지 않는다** (여기서는 그 말을 뺐다). 받는 말은 채점하지 않는다
{{EXEMPLAR}}

## 출력
JSON 하나: \`{ "bone": [ { "k", "v", "src" }, … ], "rows": [ { "k", "beat", "t", "src", "calc", "voice" }, … ] }\`
- \`bone\` — 위 "걸음 하나"의 줄을 그 차례대로. \`[i]\` 는 0 부터의 번호 (\`stems[0]\` · \`stems[1]\`). \`src\` 는 \`breaker\` · \`flip_basis\` 만 구절 키, 나머지는 ""
- \`rows\` — **독자가 읽는 차례대로**: \`voice_official\` → 표지 넷 → 흐름의 줄들 (네가 정한 차례로) → \`keep.line\` → 낱말마다 \`word.name\` \`word.short\` \`word.body\` → \`keep.whose\`

줄의 종류 (\`k\`):
${ROW_KINDS.map(line).join("\n")}`;

export const flowWriteSystem = (exemplar: string) => FLOW_WRITE_SYSTEM.replace("{{EXEMPLAR}}", exemplar);

export type FlowCtx = {
  event_title: string; doc_name: string; published_at: string;
  passages: { key: string; quote: string; cont: boolean }[];
  human: string;   // 사람이 준 말 (고르기의 뒤집기 후보 · 고칠 방향) — 없으면 ""
};
export const flowWriteUser = (c: FlowCtx) => `## 사건
${c.event_title}

## 문서 (하나)
${c.doc_name} · 공개 ${c.published_at}

## 구절 목록 (키 | 원문 글자 그대로 — 근거로 가리킬 수 있는 것은 이것뿐이다)
${c.passages.map((p) => `${p.key} | ${p.cont ? "(쪽이 넘어가 끊김 — 앞 구절에서 이어짐) " : ""}${p.quote}`).join("\n")}
${c.human ? `\n## 사람 편집자의 말\n${c.human}\n` : ""}
위 문서로 뼈를 세우고, 그 뼈로 짧은 이야기 한 편을 써라.`;

const S = { type: "string" } as const;
export const FLOW_WRITE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["bone", "rows"],
  properties: {
    bone: { type: "array", items: { type: "object", additionalProperties: false, required: ["k", "v", "src"], properties: { k: S, v: S, src: S } } },
    rows: { type: "array", items: { type: "object", additionalProperties: false, required: ["k", "beat", "t", "src", "calc", "voice"], properties: {
      k: S, beat: { type: "string", enum: ["first_thought", "breaker", "name", "land", "none"] }, t: S, src: S, calc: S, voice: { type: "string", enum: ["fact", "official", "explain", "none"] },
    } } },
  },
} as const;

// ── 줄의 목록 → 모양 ─────────────────────────────────────────────────────────────────────────────────
export type Beat = "first_thought" | "breaker" | "name" | "land";
export type FlowBone = {
  stems: string[]; chosen: string; chosen_why: string; dropped: string[]; answer: string; about: "news" | "concept"; about_why: string;
  first_thought: string; first_thought_why: string; breaker: string; breaker_src: string[];
  flip: string; flip_strength: "strong" | "weak"; flip_basis: string; flip_basis_src: string[];
  words: string[]; try: string; pick: "pick" | "none"; pick_why: string; path: string; not_drawn: string[]; unknown: string[]; death: boolean;
};
export type FlowWBlock =
  | { kind: "p"; beat: Beat | null; text: WT }
  | { kind: "cite"; text: WT }
  | { kind: "flip"; a: WT; op: "≠" | "="; b: WT; note: WT }
  | { kind: "pick"; ask: WT; options: { label: WT; reply: WT }[] };
export type FlowWritten = {
  bone: FlowBone;
  voice_official: string;
  cover: { title: WT; dek: WT; meta: WT; ask: WT };
  flow: FlowWBlock[];
  keep: { line: WT; words: { name: string; short: WT; body: WT }[]; whose: WT };
};

type Row = { k: string; beat?: string; t?: string; src?: string; calc?: string; voice?: string };
const splitKeys = (v: string) => [...new Set(v.split(/[\s,·]+/).map((x) => x.trim()).filter(Boolean))].filter((x) => /^p\d+$/.test(x));
export const toWT = (c: Row | undefined): WT => ({
  t: (c?.t ?? "").trim(),
  src: splitKeys(c?.src ?? ""),
  calc: (c?.calc ?? "").split("||").map((x) => x.trim()).filter(Boolean).map((x) => { const k = x.indexOf(":"); return k < 0 ? null : { n: x.slice(0, k).trim(), how: x.slice(k + 1).trim() }; }).filter((x): x is { n: string; how: string } => !!x && !!x.n && !!x.how),
  voice: (["fact", "official", "explain", "none"].includes(c?.voice ?? "") ? c!.voice : "none") as WT["voice"],
});
const EMPTY: WT = { t: "", src: [], calc: [], voice: "none" };
const BEATS: readonly string[] = ["first_thought", "breaker", "name", "land"];

/** 모델 출력 (bone · rows) → FlowWritten. problems — 모르는 줄 · 빠진 줄 · 값이 틀린 줄 · 차례가 어긋난 줄. 뼈의 차례 · 구절 · 숫자는 계약 검증 (validateFlowStory)이 본다 */
export function parseFlow(output: string): { written: FlowWritten; problems: string[] } {
  const o = JSON.parse(output) as { bone?: { k: string; v?: string; src?: string }[]; rows?: Row[] };
  const problems: string[] = [];
  const norm = (k: string) => k.trim().replace(/\[\s*(\d+)\s*\]/g, "[$1]");
  const bone = new Map((o.bone ?? []).map((c) => [norm(c.k), c]));
  const usedBone = new Set<string>();
  const b = (k: string) => { usedBone.add(k); const v = (bone.get(k)?.v ?? "").trim(); if (!v) problems.push(`빈 뼈 ${k}`); return v; };
  const list = (prefix: string) => { const out: string[] = []; for (let i = 0; bone.has(`${prefix}[${i}]`); i++) out.push(b(`${prefix}[${i}]`)); if (!out.length) problems.push(`빈 뼈 ${prefix}[i]`); return out; };
  const pick = <T extends string>(k: string, allowed: readonly T[], dflt: T): T => { const v = b(k); if (!allowed.includes(v as T)) { problems.push(`${k}: "${v}" 는 ${allowed.join(" | ")} 가 아니다`); return dflt; } return v as T; };
  const B: FlowBone = {
    stems: list("stems"), chosen: b("chosen"), chosen_why: b("chosen_why"), dropped: list("dropped"), answer: b("answer"), about: pick("about", ["news", "concept"], "concept"), about_why: b("about_why"),
    first_thought: b("first_thought"), first_thought_why: b("first_thought_why"), breaker: b("breaker"), breaker_src: splitKeys(bone.get("breaker")?.src ?? ""),
    flip: b("flip"), flip_strength: pick("flip_strength", ["strong", "weak"], "weak"), flip_basis: b("flip_basis"), flip_basis_src: splitKeys(bone.get("flip_basis")?.src ?? ""),
    words: list("words"), try: b("try"), pick: pick("pick", ["pick", "none"], "none"), pick_why: b("pick_why"), path: b("path"), not_drawn: list("not_drawn"), unknown: list("unknown"),
    death: pick("death", ["true", "false"], "false") === "true",
  };
  for (const k of bone.keys()) if (!usedBone.has(k)) problems.push(`모르는 뼈 ${k}`);

  const rows = (o.rows ?? []).map((r) => ({ ...r, k: norm(r.k) }));
  const one = (k: string): WT => { const hit = rows.filter((r) => r.k === k); if (hit.length !== 1) problems.push(hit.length ? `${k} 가 ${hit.length}번 나온다` : `빈 줄 ${k}`); const w = toWT(hit[0]); if (hit.length && !w.t) problems.push(`빈 줄 ${k}`); return w; };
  const w: FlowWritten = { bone: B, voice_official: one("voice_official").t, cover: { title: one("cover.title"), dek: one("cover.dek"), meta: one("cover.meta"), ask: one("cover.ask") }, flow: [], keep: { line: one("keep.line"), words: [], whose: one("keep.whose") } };
  const SINGLES = new Set(["voice_official", "cover.title", "cover.dek", "cover.meta", "cover.ask", "keep.line", "keep.whose"]);
  let flip: Extract<FlowWBlock, { kind: "flip" }> | null = null, pk: Extract<FlowWBlock, { kind: "pick" }> | null = null, word: FlowWritten["keep"]["words"][number] | null = null;
  let afterKeep = false;
  for (const r of rows) {
    const t = toWT(r);
    if (r.k === "keep.line") afterKeep = true;
    if (SINGLES.has(r.k)) continue;
    if (r.k === "p" || r.k === "cite" || r.k.startsWith("flip.") || r.k.startsWith("pick.")) {
      if (afterKeep) problems.push(`흐름의 줄 ${r.k} 가 keep.line 뒤에 있다 — 흐름에 넣지 않았다`);
      if (afterKeep) continue;
    }
    if (r.k === "p") {
      if (!t.t) { problems.push("빈 문단 (p)"); continue; }
      if (r.beat && r.beat !== "none" && !BEATS.includes(r.beat)) problems.push(`p 의 beat "${r.beat}" 를 모른다`);
      w.flow.push({ kind: "p", beat: BEATS.includes(r.beat ?? "") ? (r.beat as Beat) : null, text: t });
    } else if (r.k === "cite") {
      if (!t.t) { problems.push("빈 문서의 문장 (cite)"); continue; }
      w.flow.push({ kind: "cite", text: { ...t, voice: "fact" } });
    } else if (r.k.startsWith("flip.")) {
      if (!flip) { flip = { kind: "flip", a: { ...EMPTY }, op: "≠", b: { ...EMPTY }, note: { ...EMPTY } }; w.flow.push(flip); }
      if (r.k === "flip.a") flip.a = t;
      else if (r.k === "flip.b") flip.b = t;
      else if (r.k === "flip.note") flip.note = t;
      else if (r.k === "flip.op") { if (t.t === "≠" || t.t === "=") flip.op = t.t; else problems.push(`flip.op "${t.t}" 는 ≠ | = 가 아니다`); }
      else problems.push(`모르는 줄 ${r.k}`);
    } else if (r.k.startsWith("pick.")) {
      if (!pk) { pk = { kind: "pick", ask: { ...EMPTY }, options: [{ label: { ...EMPTY }, reply: { ...EMPTY } }, { label: { ...EMPTY }, reply: { ...EMPTY } }] }; w.flow.push(pk); }
      const m = /^pick\.([12])\.(label|reply)$/.exec(r.k);
      if (r.k === "pick.ask") pk.ask = t;
      else if (m) pk.options[Number(m[1]) - 1]![m[2] as "label" | "reply"] = t;
      else problems.push(`모르는 줄 ${r.k}`);
    } else if (r.k === "word.name") {
      word = { name: t.t, short: { ...EMPTY }, body: { ...EMPTY } };
      if (!t.t) problems.push("빈 줄 word.name");
      w.keep.words.push(word);
    } else if (r.k === "word.short" || r.k === "word.body") {
      if (!word) problems.push(`${r.k} 가 word.name 보다 앞에 있다`);
      else word[r.k === "word.short" ? "short" : "body"] = t;
    } else problems.push(`모르는 줄 ${r.k}`);
  }
  if (flip) for (const k of ["a", "b", "note"] as const) if (!flip[k].t) problems.push(`빈 줄 flip.${k}`);
  if (pk) { if (!pk.ask.t) problems.push("빈 줄 pick.ask"); pk.options.forEach((op, i) => { if (!op.label.t) problems.push(`빈 줄 pick.${i + 1}.label`); if (!op.reply.t) problems.push(`빈 줄 pick.${i + 1}.reply`); }); }
  for (const x of w.keep.words) { if (!x.short.t) problems.push(`낱말 ${x.name} 의 한 줄 (word.short)이 없다`); if (!x.body.t) problems.push(`낱말 ${x.name} 의 풀이 (word.body)가 없다`); }
  return { written: w, problems };
}

/** 독자 글 덩이 전부 — id 는 계약의 자리 그대로 (`flow[3].text` ↔ JSON 길 `/flow/3/text`). 차례 = 독자가 읽는 차례.
 *  where — 사람이 읽는 이름 · branch — 고르기의 가지 (받는 말 · 고를 것만) */
export type FlowText = { id: string; wt: WT; where: string; branch?: number };
export function textsOfFlow(w: FlowWritten): FlowText[] {
  const out: FlowText[] = [
    { id: "cover.title", wt: w.cover.title, where: "표지 · 제목" }, { id: "cover.dek", wt: w.cover.dek, where: "표지 · 한 줄" }, { id: "cover.meta", wt: w.cover.meta, where: "표지 · 날" }, { id: "cover.ask", wt: w.cover.ask, where: "표지 · 물음 단추" },
  ];
  w.flow.forEach((b, i) => {
    const n = `흐름 ${i + 1}`;
    if (b.kind === "p") out.push({ id: `flow[${i}].text`, wt: b.text, where: `${n}${b.beat ? ` (${b.beat})` : ""}` });
    else if (b.kind === "cite") out.push({ id: `flow[${i}].text`, wt: b.text, where: `${n} · 문서의 문장` });
    else if (b.kind === "flip") out.push({ id: `flow[${i}].a`, wt: b.a, where: `${n} · 뒤집기 앞` }, { id: `flow[${i}].b`, wt: b.b, where: `${n} · 뒤집기 뒤` }, { id: `flow[${i}].note`, wt: b.note, where: `${n} · 뒤집기의 풀이` });
    else {
      out.push({ id: `flow[${i}].ask`, wt: b.ask, where: `${n} · 고르기` });
      b.options.forEach((o, k) => out.push({ id: `flow[${i}].options[${k}].label`, wt: o.label, where: `${n} · 고를 것 ${k + 1}`, branch: k }, { id: `flow[${i}].options[${k}].reply`, wt: o.reply, where: `${n} · 받는 말 ${k + 1}`, branch: k }));
    }
  });
  out.push({ id: "keep.line", wt: w.keep.line, where: "남는 한 줄" });
  w.keep.words.forEach((x, i) => out.push({ id: `keep.words[${i}].short`, wt: x.short, where: `낱말 ${x.name} · 한 줄` }, { id: `keep.words[${i}].body[0]`, wt: x.body, where: `낱말 ${x.name} · 풀이` }));
  out.push({ id: "keep.whose", wt: w.keep.whose, where: "누구의 말" });
  return out;
}
/** 글 덩이 id → 계약 검증이 말하는 자리 (JSON 길) */
export const pathOfId = (id: string) => "/" + id.replace(/\[(\d+)\]/g, "/$1").replace(/\./g, "/");

// ── 함의 — 앞 덩이를 같이 준다 (UX-8 ⑥ · PS1-d) ─────────────────────────────────────────────────────
// episode-entail/2 의 프롬프트 (불러 쓴다 — 한 글자도 안 고친다) 뒤에 덧붙임 하나. 판정의 뜻 · 출력 모양 · 모델 · effort 는 그대로다.
export const FLOW_ENTAIL_SYSTEM = `${ENTAIL_SYSTEM}

## 덧붙임 — 이 글은 한 흐름으로 이어지는 이야기의 한 덩이다 (${FLOW_ENTAIL_VERSION})
- "사실" 뒤에 **"앞 덩이"** 가 올 수 있다 — 독자가 이 글 바로 앞에서 읽은 글이다. **읽는 데만 쓴다**: 이 글의 가리키는 말 ("그 통지서" · "이 날짜" · "둘 다")과 앞을 받는 말 ("알리기도 전에 결정부터 난 거잖아요")이 무엇을 가리키는지를 앞 덩이로 읽는다. 가리키는 대상이 앞 덩이에서 분명하면 "누구의 일인지 알 수 없다"로 걸지 않는다
- **근거는 이 글에 붙은 것만 본다.** 앞 덩이는 근거가 아니다 — 앞 덩이의 내용을 판정하지 않고 (따로 본다), 이 글이 문서의 일로 말하는 것은 이 글의 구절 · 둘레에서 나와야 한다. 앞 덩이에만 있고 이 글의 구절에는 없는 사실을 이 글이 **다시 말하면** OTHER 다 (근거를 덜 붙였다)
- 앞 덩이를 받아 넘어가는 말 ("그런데" · "그럼 ~는 뭘까요?" · "어느 쪽을 골랐어도") · 독자가 앞에서 한 짐작을 되받는 말은 판정하지 않는다
- 큰따옴표 안의 짧은 말 (뒤집기의 두 말)과 제목 · 물음 · 고를 것은 독자의 생각이나 물음일 수 있다 — 문서의 일로 **주장하는** 부분만 판정한다`;

export const flowEntailUser = (base: string, before: string[]) => (before.length ? `${base}\n\n## 앞 덩이 (읽기용 — 근거가 아니다 · 판정하지 않는다)\n${before.map((b) => `- ${b}`).join("\n")}` : base);

// ── 고치기 — 걸린 덩이만 · 앞뒤를 보며 ───────────────────────────────────────────────────────────────
export const FLOW_REPAIR_SYSTEM = `너는 Claro 의 짧은 이야기 고치기 단계다. 한 흐름으로 이어지는 짧은 이야기에서 검사에 걸린 덩이들을 받아, **걸린 덩이의 걸린 부분만** 고친다.

## 받는 것
덩이마다: 자리 · 지금 글 · 앞 덩이와 뒤 덩이 (읽기용 — 고치지 않는다) · 근거 구절 (키 · 구절 · 둘레) · 걸린 까닭 —
- 함의: 다른 모델이 "글의 이 부분이 구절에서 나오지 않는다 (또는 어긋난다)"고 가리킨 것. 갈래 — **넘침** (NOWHERE: 구절이 다루는 내용을 글이 넘겼다) · **별개의 내용** (OTHER: 구절이 다루지 않는 내용 — 근거를 덜 붙였을 수 있다) · 어긋남 (CONFLICT)
- 계약: 글의 숫자가 근거 구절에도 계산 (calc)에도 없다 (NUMBER_UNGROUNDED) · 문서의 문장 (cite)이 구절 안의 글 그대로가 아니다 (CITE_VERBATIM) · 근거 구절이 없다 (BREAKER_SRC · FLOW_FLIP · FLOW_PICK) · 없는 구절 키 (REF_QUOTE)

## 고치는 법
- **이음매를 깎지 않는다.** 이 글은 앞 덩이를 받고 뒤 덩이로 넘어간다. 문단의 첫 문장이 앞을 받는 말 ("그런데" · "그 통지서에는" · "~잖아요")과 다음을 부르는 끝 문장은 그대로 둔다. 걸린 조각만 바꾼다. 고친 뒤에도 앞 덩이 → 이 글 → 뒤 덩이가 소리 내어 읽어 이어져야 한다
- 말투 (해요체 · 짧은 문장 · 친구가 옆에서)는 그대로
- **별개의 내용 (OTHER)은 근거부터 찾는다**: 글은 맞는데 근거를 덜 붙인 것인가. 그렇다면 글은 두고 \`src\` 에 그 내용을 받치는 구절을 더한다 — 맨 아래 "쓸 수 있는 구절" 목록의 키에서만 (그 구절이 그 내용을 분명히 말할 때만)
- **넘침 (NOWHERE)은 글을 줄인다** — 구절이 말한 데까지로. 구절에 없는 인과 · 주체 · 시점 · 정도 · 일반화를 지운다. 근거를 지어내지 않는다
- 숫자: 구절에 있는 수로 바꾸거나 · calc 에 \`{ n, how }\` 로 밝히거나 (그 계산이 근거 구절의 수에서 나올 때만) · 한글 말로 바꾼다
- 문서의 문장 (cite): \`t\` 를 근거 구절 안의 이어진 글자 그대로로 (줄머리 □ · #1. 은 빼도 된다 · 가운데를 건너뛰지 않는다)
- 가리킨 것이 트집이라고 보면 (독자가 받는 그림이 달라지지 않는다) 글을 그대로 두고 \`action\` 을 "keep" 으로, 까닭을 적는다 — 사람이 본다
- 고쳐도 설 수 없는 덩이는 \`action\` 을 "drop" 으로 — 코드는 빼지 않는다. 사람이 본다

## 출력
JSON 하나. 덩이마다 \`id\` (받은 그대로) · \`action\` ("fix" · "keep" · "drop") · \`t\` (고친 글 — keep · drop 이면 지금 글 그대로) · \`src\` (고친 글이 기대는 구절 키 전부) · \`calc\` · \`why\` (무엇을 왜 — 한 문장).`;

export const FLOW_REPAIR_SCHEMA = {
  type: "object", additionalProperties: false, required: ["items"],
  properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "action", "t", "src", "calc", "why"], properties: {
    id: S, action: { type: "string", enum: ["fix", "keep", "drop"] }, t: S, src: { type: "array", items: S },
    calc: { type: "array", items: { type: "object", additionalProperties: false, required: ["n", "how"], properties: { n: S, how: S } } }, why: S,
  } } } },
} as const;
