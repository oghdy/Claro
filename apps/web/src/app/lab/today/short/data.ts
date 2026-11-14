// UX-7 — 짧은 이야기 견본: 영훈의료재단 (개인정보위 2026-10-28 의결 · 10-29 발표 — 「내 정보는 누가 지키나」의 긴 이야기와 **같은 발표**의 병원 쪽).
// 손으로 썼다 (모델 API 0). 재료 = logs/pipeline/E3-1.md ③ (영훈 쪽 뒤집기 · 그리지 않을 것 9 ~ 11) · D69.
// **구절은 git 에 있는 문서에서만** (E3-1b · D70): 개인정보위 보도자료 PDF (문서 안 공공누리 제1유형 표시) · 개인정보 보호법. 캐시에만 있는 게시물 페이지의 글은 쓰지 않았다.
// 긴 이야기 골든과 같은 구절은 골든의 것을 그대로 가져왔다 (다시 적지 않았다). 새 구절 여덟은 아래 QUOTES 에 — check.ts 가 저장된 문서와 대조한다.
// 꼴은 lab 전용이다 (./types.ts) — 계약에 모자란 칸이 무엇인지가 D80 의 실물이다.
import { PIPC } from "../../../../episode/episodes/pipc/data";
import { t } from "../../../../episode/kit/types";
import type { ShortStory } from "./types";

const DOC = "PR-1029";
const fromLong = (keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, PIPC.quotes[k]!]));

/** 이 이야기에서 새로 가리키는 구절 — 전부 보도자료 PDF (store.documents.json · source ae47d854…) */
const QUOTES: ShortStory["quotes"] = {
  "pr.yh.nofw": { doc: DOC, quote: "또한, 웹 취약점 공격 등을 탐지‧차단할 수 있는 웹 방화벽 등을 설치‧운영하지 않았으며, SQL 인젝션 등 웹 취약점을 점검하거나, 홈페이지 내 입력값을 검증할 수 있는 프로그램 구현 등을 하지 않았다." },
  "pr.yh.pw": { doc: DOC, quote: "아울러, 회원이 병원 홈페이지 회원가입 시 입력한 비밀번호를 암호화하면서 안전하지 않은 암호 알고리즘을 사용하였고, 솔트 값* 등을 사용하지 않아 일부 비밀번호의 경우 복호화가 가능한 사실도 확인되었다." },
  "pr.salt": { doc: DOC, quote: "* 같은 알고리즘에서 동일 hash 값 방지를 위해 암호화 전 비밀번호에 추가하는 임의의 값" },
  "pr.sqli": { doc: DOC, quote: "* 웹사이트 입력 칸에 정상적인 값 대신 데이터베이스 명령어를 입력하여 결과를 조회" },
  "pr.who": { doc: DOC, quote: "의료법인 영훈의료재단(대전선병원, 유성선병원) : 의료 서비스 제공 사업자" },
  "pr.mean.path": { doc: DOC, quote: "이번 조사‧처분은 주요 서비스를 제공하는 시스템뿐 아니라 관계사와 연결된 서버나 주요 서비스의 운영을 보조하는 홈페이지도 개인정보 유출의 경로가 될 수 있음을 확인하고," },
  "pr.mean.habit": { doc: DOC, quote: "관행적으로 수집하는 개인정보에 대한 현황 파악 및 안전조치 점검의 중요성을 강조하였다는 데 의의가 있다." },
  "pr.need2": { doc: DOC, quote: "운영 중인 개인정보처리시스템 현황을 파악하여 웹셸이나 SQL 인젝션 같은 잘 알려진 웹 취약점 공격에 대비한 웹 취약점 점검, 이상행위 탐지 및 대응체계를 강화할 것을 당부하였다." },
};

export const SHORT: ShortStory = {
  code: "pipc-hospital",
  event_ref: PIPC.event_ref,
  weight: "short",
  shelf: { series_id: PIPC.series.series_id, code: PIPC.series.code, name: PIPC.series.name },
  sibling: { code: PIPC.code, label: "같은 발표의 긴 이야기", note: "대교 쪽 이야기 · 긴 이야기 · 체험 있음" },
  docs: { [DOC]: PIPC.docs[DOC]!, "LAW-PIPA": PIPC.docs["LAW-PIPA"]! },
  quotes: { ...fromLong(["pr.when", "pr.decide", "pr.judge", "pr.yh.head", "pr.yh.hack", "pr.yh.signup", "pr.yh.order", "pr.need", "pr.table.yh", "law.9"]), ...QUOTES },
  voice_labels: PIPC.voice_labels,
  tools_from: { episode: PIPC.code, keys: ["safety", "fine", "order"] },

  entry: {
    first_thought: t("병원이 털렸다고 하면, 진료 기록이 새어 나갔겠구나 싶어요."),
    breaker: t("위원회 문서가 가리킨 곳은 병원 안내, 게시판, 예약신청에 쓰는 **홈페이지**예요. 거기에 관행처럼 만들어 둔 **회원가입**으로 모인 정보가 빠져나갔어요.", ["pr.yh.signup", "pr.yh.hack"], { voice: "official" }),
    flip: {
      label: "뒤집어 보면",
      a: "“털리는 곳”",
      op: "≠",
      b: "“가장 중요한 시스템”",
      note: t("위원회는 이번 일로, 주된 서비스를 하는 시스템만이 아니라 **그 운영을 돕는 홈페이지도** 개인정보가 새는 길이 될 수 있음을 확인했다고 했어요.", ["pr.mean.path"], { voice: "official" }),
    },
    // E3-1 ③-3 의 9 · 10 · 11 + D69
    not_drawn: [
      "영훈의료재단의 공표명령 — 없다 (과징금 · 시정명령뿐). 받은 것처럼 그리지 않는다",
      "“안 모았으면 안 털렸다” — 반사실. 위원회는 회원가입의 필요성을 검토하라고 당부만 했다",
      "병원 진료 기록이 안전했다 / 털렸다 — 문서는 홈페이지 회원 정보 항목만 말한다. 어느 쪽으로도 말하지 않고, 문서에 없다고 말한다",
      "과징금 ÷ 명수 · 대교의 금액과 배수로 견주기 — 금액을 어떻게 계산했는지는 공개 문서에 없다",
      "해커가 누구인가 · 유출의 날 — 문서는 달까지만 말한다",
    ],
    whose: t("여기까지는 **개인정보위가 내린 판단**이에요. 영훈의료재단의 공식 입장은 우리가 확인한 문서에서 찾지 못했어요. 그래서 싣지 않았어요."),
    death: false,
  },
  plain: { kind: "flip", why: null, title: "뚫린 곳은\n병원 안내 홈페이지였어요" },

  scenes: {
    cover: {
      weight_label: "짧은 이야기",
      title: "병원이 털렸다는데,\n어디가 털린 걸까",
      dek: t("병원을 운영하는 영훈의료재단(대전선병원, 유성선병원)에서 홈페이지 회원 188,481명의 정보가 빠져나갔어요. 개인정보보호위원회는 과징금 6억 3,000만 원을 매겼어요.", ["pr.who", "pr.yh.hack", "pr.yh.head"]),
      // 긴 이야기의 표지와 같은 글 · 같은 구절 (같은 발표다)
      meta: PIPC.scenes.cover.meta,
      hint: t("같은 날 발표된 대교 이야기와 한 묶음이에요. 이쪽은 짧게 볼게요."),
      ask: "진료 기록이 털린 건가요?",
    },
    where: {
      kicker: "어디가 털렸나",
      body: [
        t("빠져나간 건 그 홈페이지 회원의 아이디, 비밀번호, 이름, 휴대전화번호, 생년월일 같은 정보예요. 수법은 입력 칸에 정상적인 값 대신 데이터베이스 명령어를 넣는 **SQL 인젝션**이었어요.", ["pr.yh.hack", "pr.sqli"], { voice: "fact" }),
      ],
      unknown: t("진료 기록이 어떻게 됐는지는 이 문서에 없어요. 문서가 말한 건 홈페이지 회원 정보예요. 그래서 여기서도 말하지 않을게요."),
      ask: "그럼 병원은 왜 벌을 받았나요?",
    },
    why: {
      kicker: "문서가 말한 것",
      title: "막는 장치도,\n점검도 없었어요",
      lead: t("털렸다는 것만으로 벌이 정해지지는 않아요. 위원회가 본 건, 정보를 지킬 조치를 다했느냐였어요.", ["law.9", "pr.judge"], { voice: "explain" }),
      real_label: "위원회가 짚은 것",
      real: [
        { head: t("막는 장치가 없었어요"), body: t("웹 공격을 탐지하고 차단하는 웹 방화벽 같은 장치를 설치해 운영하지 않았어요.", ["pr.yh.nofw"], { voice: "official" }) },
        { head: t("점검하지 않았어요"), body: t("SQL 인젝션 같은 웹 취약점을 점검하지 않았고, 입력 칸에 들어온 값을 검증하는 프로그램도 만들지 않았어요.", ["pr.yh.nofw"], { voice: "official" }) },
        { head: t("비밀번호를 약하게 잠갔어요"), body: t("회원 비밀번호를 안전하지 않은 방식으로 암호화했고, 같은 비밀번호가 같은 값이 되지 않게 덧붙이는 임의의 값(솔트)도 쓰지 않았어요. 그래서 일부 비밀번호는 원래대로 풀 수 있었어요.", ["pr.yh.pw", "pr.salt"], { voice: "official" }) },
      ],
      verdict: t("위원회는 이것을 **안전조치의무** 위반으로 봤어요. 과징금 6억 3,000만 원과 함께, 약한 곳을 주기적으로 점검하고 고치라는 **시정명령**을 내렸어요.", ["pr.table.yh", "pr.yh.order"], { voice: "official" }),
      tool_lead: "긴 이야기에서 줍는 것과 같은 도구예요. 접어 둘게요.",
      ask: "그래서 무엇이 남나요?",
    },
    keep: {
      kicker: "남음",
      title: "작은 뒤집기 하나가\n남았어요",
      line: "털리는 곳이 꼭\n가장 중요한 시스템은 아니다.\n관행처럼 모은 정보도\n지켜야 할 개인정보다.",
      advice_label: "위원회의 당부",
      advice: t("위원회는 홈페이지 회원가입이 꼭 필요한지부터 살펴서, 필요 없는 개인정보가 모이지 않게 하라고 당부했어요. 운영 중인 시스템의 현황을 파악하고, 잘 알려진 웹 공격에 대비해 점검하라고도 했어요.", ["pr.need", "pr.need2", "pr.mean.habit"], { voice: "official" }),
      map_note: "이 이야기에서 만난 도구는 같은 주제의 지도에 붙어요. 긴 이야기를 읽으면 나머지가 채워져요.",
      gain_label: "이 이야기에서 만난 개념",
    },
  },
};

/** 근거 문서가 저장된 파일 (저장소 뿌리에서) — check.ts 가 구절을 대조할 때 읽는다. git 에 있는 파일이다 */
export const SHORT_STORES = ["packages/pipeline/data/events/PIPC-20261028-SAFETY-MEASURES/store.documents.json"] as const;

/** 화면의 글 (이야기의 글이 아니다) */
export const SHORT_CHROME = {
  draft: "시안",
  back: "오늘로",
  backHref: "/lab/today",
  barKind: "짧은 이야기",
  thought: "이렇게 생각하기 쉬워요",
  breaker: "그런데 문서에는",
  folded: "긴 이야기와 같은 도구",
  open: "펼치기",
  close: "접기",
  lineLabel: "이 이야기의 한 줄",
  mapButton: "내 개념 지도 보기",
  where: "짧은 이야기에서 만남",
  toToday: "오늘의 이야기로 돌아가기",
  restart: "처음부터 다시",
} as const;
