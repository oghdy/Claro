// UX-1 시안 — 한 "회차"의 글과 근거. **시안 데이터다. 계약(ARTICLE_PACKAGE)이 아니고, 파이프라인이 만든 것도 아니다.**
// 손으로 썼다 (모델 API 0). 저장된 1차 문서에서만: packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json (git 에 있는 12 문서).
// 캐시에만 있는 문서(PR-1109-PDF · SL-TERMS-1013 · CO-CPNG-1109)는 읽기만 했고 구절을 싣지 않았다 — 공개 저장소다 (E2-1-a).
// 글의 규칙은 kit/types.ts 머리에 (check.ts 가 본다). 굵게는 **이렇게** 적는다.
// UX-2 에서 모양만 공통 틀(EpisodeData)로 옮겼다 — 독자가 읽는 글자는 바꾸지 않았다 (지도의 "다른 시리즈" 예시만 진짜 회차의 개념으로).
import { t as kt, type Concept, type EpisodeCopy, type EpisodeData, type ReaderFixture, type ReaderId, type SeriesInfo, type Source, type T } from "../../kit/types";

export type DocLabel = "PR-1109" | "LAW-MRFTA" | "SL-YGY-2020" | "SL-TF-0512" | "SL-CD-0618" | "SL-DECREE-1106";

/** label → store.json 의 source_id */
export const DOCS: Record<DocLabel, { store: "kftc"; source_id: string; name: string }> = {
  "PR-1109": { store: "kftc", source_id: "98897dcb-259e-480a-bfe3-fa1e35bbd12f", name: "공정위 보도자료 「배달앱 불공정행위 제재」 (2026-11-09)" },
  "LAW-MRFTA": { store: "kftc", source_id: "74c797a9-3fea-4fe6-8535-0a81e206d179", name: "공정거래법 [시행 2026. 10. 2.]" },
  "SL-YGY-2020": { store: "kftc", source_id: "11d8f90d-a0b3-4ecb-ba7d-e59f63f43ea2", name: "공정위 보도자료 — 요기요 최저가 보장제 제재 (2020-06-02)" },
  "SL-TF-0512": { store: "kftc", source_id: "668d96db-16a7-43a1-ac9c-d3dcf9660443", name: "공정위 보도참고자료 — 배달플랫폼 사건처리 전담팀 (2025-05-12)" },
  "SL-CD-0618": { store: "kftc", source_id: "07959564-241b-4224-8666-adbdaf3660df", name: "공정위 보도자료 — 동의의결 개시신청 기각 (2026-06-18)" },
  "SL-DECREE-1106": { store: "kftc", source_id: "19092e60-0e07-4150-baa5-8dd745ce578a", name: "공정위 보도참고자료 — 시행령 개정안 입법예고 (2026-11-06)" },
};

export const SOURCES = {
  // ── 오늘의 사건: 공정위 보도자료 (PR-1109)
  "pr.decision": {
    doc: "PR-1109",
    quote:
      "’26.10.29. ㈜우아한형제들(서비스명 배달의민족, 이하 ‘배민’)과 쿠팡㈜(서비스명 쿠팡, 쿠팡이츠, 이하 ‘쿠팡’)이 시장지배적 지위를 남용한 최혜대우 요구 등으로 배달 시장의 경쟁을 저해한 행위 등에 대해 시정명령과 함께 배민에 대해 3,311억 원*(잠정), 쿠팡에 대해 3,008억 원(잠정)의 과징금을 부과하기로 결정하였다.",
  },
  "pr.breakdown": { doc: "PR-1109", quote: "* (최혜대우 요구) 1,602억 원, (자체배달** 전환 강제) 1,554억 원, (배달예상시간 기만광고) 154억 원" },
  "pr.registered": { doc: "PR-1109", quote: "등록 : 2026-11-09" },
  "pr.mfnDef": { doc: "PR-1109", quote: "MFN(Most Favored Nation) 요구: 거래상대방에게 자신의 거래조건을 경쟁자와 같거나 경쟁자에 비해 유리하게 적용할 것을 요구하는 것을 말함" },
  "pr.cpng6": { doc: "PR-1109", quote: "메뉴가격을 포함한 6가지 주요 거래조건*에 대한 MFN 조건을 미충족한 입점업체는 와우매장 지위를 박탈하는 방식으로 MFN 요구를 관철하였다." },
  "pr.cpng6list": { doc: "PR-1109", quote: "* 메뉴가격, 최소주문금액, 할인 혜택, 고객 부담 배달비, 메뉴 수, 운영시간" },
  "pr.bm3": { doc: "PR-1109", quote: "최소주문금액 등 세 가지 주요 거래조건*에 대해 MFN 요구를 충족한 입점업체를 ‘배민클럽가게’로 선정하여" },
  "pr.feeUp": { doc: "PR-1109", quote: "’24.8.9.부터 자체배달 요금제 수수료율을 6.8%에서 9.8%로 인상하기로 하였다." },
  "pr.ratio": {
    doc: "PR-1109",
    quote: "MFN 요구를 충족한 와우매장 비율은 약 13%(’23.7.)에서 약 94%(’25.10.)로 급증하고 배민클럽가게 비율 또한 약 63%(’24.5.)에서 약 80%(’25.1.)로 크게 증가하였다.",
  },
  "pr.exclude": { doc: "PR-1109", quote: "와우매장 또는 배민클럽가게에서 제외되는 입점업체는 현저한 매출 감소를 경험하게 된다. 그 결과, 대다수의 입점업체는 이들의 요구를 마지못해 수용하였고" },
  "pr.share": { doc: "PR-1109", quote: "배민, 쿠팡은 배달앱 시장의 1위(58.45%), 2위(34.44%) 사업자로서 시지사업자에 해당(’25, 주문금액 기준)" },
  "pr.judge": {
    doc: "PR-1109",
    quote: "공정위는 배민과 쿠팡의 각 행위가 시장지배적지위*를 남용하여 입점업체에게 정상적인 거래관행에 비추어 타당성이 없는 조건을 제시한 행위로서 입점업체 및 경쟁 사업자의 사업활동을 어렵게 하는 행위에 해당한다고 판단하였다.",
  },
  "pr.also": { doc: "PR-1109", quote: "** 동시에 불공정거래행위 중 거래상지위 남용행위(경영활동 간섭)에도 해당된다고 판단" },
  "pr.entrant": {
    doc: "PR-1109",
    quote: "배민과 쿠팡은 낮은 수수료율을 통해서 입점업체들이 상품 가격을 낮추도록 유도하여 시장에 진입·확장하려는 신규·중소 배달앱 사업자의 전략을 무력화함으로써 경쟁사의 사업활동도 방해하였다.",
  },
  "pr.effect": { doc: "PR-1109", quote: "배달앱 시장에서 경쟁이 제한되어 수수료율*, 메뉴가격이 인상되고, 신규 진입 등이 봉쇄됨에 따라 소비자 후생이 감소하였다." },
  "pr.both90": {
    doc: "PR-1109",
    quote: "합산 점유율이 90%가 넘는 두 과점 사업자가 동시에 MFN 요구를 함으로써 높고 동일한 수준의 수수료 설정, 거래조건 동조화 등과 같이 담합이 이루어진 것과 유사한 강력한 경쟁제한효과를 초래하였다.",
  },
  "pr.after": { doc: "PR-1109", quote: "MFN 요구가 금지됨에 따라 입점업체는 자신의 경영 판단에 따라 메뉴가격, 최소주문금액 등을 플랫폼별로 자율적으로 설정할 수 있게 되고" },
  "pr.reexam": {
    doc: "PR-1109",
    quote: "쿠팡(주)의 거래강제행위에 대한 건에 대하여 심의한 결과, 심사보고서상 주된 상품·종된 상품 개념에 대한 해석상 이견으로 인해 심의가 충실히 진행되지 못한 측면이 있고 이 사건의 중요성을 고려할 때 보다 내실 있는 심사를 한 후에 사건을 심의함이 적절하다고 판단하여 재심사 명령을 결정하였다.",
  },

  // ── 법 (LAW-MRFTA)
  "law.def": {
    doc: "LAW-MRFTA",
    quote: "“시장지배적사업자”란 일정한 거래분야의 공급자나 수요자로서 단독으로 또는 다른 사업자와 함께 상품이나 용역의 가격, 수량, 품질, 그 밖의 거래조건을 결정ㆍ유지 또는 변경할 수 있는 시장지위를 가진 사업자를 말한다.",
  },
  "law.presume": {
    doc: "LAW-MRFTA",
    quote: "1. 하나의 사업자의 시장점유율이 100분의 50 이상\n2. 셋 이하의 사업자의 시장점유율의 합계가 100분의 75 이상. 이 경우 시장점유율이 100분의 10 미만인 사업자는 제외한다.",
  },
  "law.ban": { doc: "LAW-MRFTA", quote: "3. 다른 사업자의 사업활동을 부당하게 방해하는 행위" },
  "law.fine6": { doc: "LAW-MRFTA", quote: "에 100분의 6을 곱한 금액을 초과하지 아니하는 범위에서 과징금을 부과할 수 있다." },
  "law.fine4": {
    doc: "LAW-MRFTA",
    quote: "제45조제1항(제9호는 제외한다), 제46조 또는 제48조를 위반하는 행위가 있을 때에는 해당 사업자에게 대통령령으로 정하는 매출액에 100분의 4를 곱한 금액을 초과하지 아니하는 범위에서 과징금을 부과할 수 있다.",
  },
  "law.record": { doc: "LAW-MRFTA", quote: "의결 내용 및 그 이유를 명시한 의결서로 하여야 하고" },

  // ── 지금까지의 이야기 (0화)
  "ygy.date": { doc: "SL-YGY-2020", quote: "2020년 6월 2일(화) 배포" },
  "ygy.what": {
    doc: "SL-YGY-2020",
    quote:
      "배달앱 요기요가 배달 음식점에게 자신의 앱보다 직접 전화 주문 또는 타 배달앱에서 더 저렴하게 판매하는 것을 금지하고 이를 배달 음식점이 위반하면 계약 해지 등 불이익을 부과하는 최저가 보장제를 시행·강요한 행위에 시정명령과 함께 과징금 4억 6,800만 원 부과를 결정했다.",
  },
  "ygy.mech": {
    doc: "SL-YGY-2020",
    quote: "최저가 보장제 하에서는 배달 음식점이 요기요의 앱 이용 수수료 인상 시 자신이 인상된 수수료를 전적으로 부담하지 않는 한, 요기요 가격 뿐만 아니라 다른 경로의 판매 가격까지 모두 동일하게 인상해야 함.",
  },
  "ygy.law": { doc: "SL-YGY-2020", quote: "거래상 지위 남용 행위(경영 간섭)" },
  "ygy.prov": { doc: "SL-YGY-2020", quote: "과징금 4억 6,800만 원(잠정) 부과" },
  "tf.date": { doc: "SL-TF-0512", quote: "보도시점 2025. 5. 12.(월) 10:00" },
  "tf.what": { doc: "SL-TF-0512", quote: "「배달플랫폼 사건처리 전담팀(TF)」을 구성\n하고 5월 12일부터 활동을 시작한다고 밝혔다." },
  "cd.date": { doc: "SL-CD-0618", quote: "보도시점 2026. 6. 18.(목) 12:00" },
  "cd.what": { doc: "SL-CD-0618", quote: "동의의결절차 개시신청에 대하여 기각하기로 결정하였다." },
  "cd.def": { doc: "SL-CD-0618", quote: "시정방안이 타당하다고 인정하는 경우 위법 여부를 확정하지 않고\n사건을 처리하는 제도" },
  "cd.tying": { doc: "SL-CD-0618", quote: "쇼핑 멤버십(와우멤버십)에 자사 배달앱 서비스 ‘쿠팡이츠’를\n연계하여 쇼핑 사용자의 배달앱 서비스 이용을 강제한 혐의" },

  // ── 이어지는 것
  "decree.period": { doc: "SL-DECREE-1106", quote: "개정안을 11월 6일부터 12월\n16일까지 입법예고 한다." },
  "decree.date": { doc: "SL-DECREE-1106", quote: "보도시점 2026. 11. 6.(금) 10:00" },
  "decree.what": { doc: "SL-DECREE-1106", quote: "시장지배적지위\n남용행위를 변화한 경제 환경 및 집행 현실에 맞추어 정비하기 위한 것" },
  "decree.finish": { doc: "SL-DECREE-1106", quote: "법제처 심사 등의 절차를 거쳐 2027년 상반기\n중 시행령 개정 작업을 마무리할 예정이다." },
} as const satisfies Record<string, Source>;

export type SrcKey = keyof typeof SOURCES;

const t = (text: string, src?: readonly SrcKey[], more?: Partial<T>): T => kt(text, src, more);

// ─────────────────────────────────────────────────────────── 개념 (도구)

export type ConceptId = "fee" | "mfn" | "dominance" | "provisional";

// 넷 다 개념 라이브러리에 없다 — 손으로 썼다 (UX1-f)
export const CONCEPTS: Record<ConceptId, Concept> = {
  fee: {
    id: "fee",
    from: "hand",
    name: "중개수수료",
    short: t("가게가 주문을 받을 때마다 앱에 내는 몫이에요."),
    body: [
      t("배달앱은 손님과 가게를 이어 주고, 그 대가로 주문값의 일부를 가게에게서 받아요. 이게 **중개수수료**예요.", undefined, { layer: "explain" }),
      t("수수료가 오르면 가게에 남는 돈이 줄어요. 그래서 가게는 메뉴값을 올릴지 고민하게 돼요.", undefined, { layer: "explain" }),
      t("실제로 배민은 2024년 8월, 자체배달 요금제의 수수료율을 **6.8%에서 9.8%로** 올렸어요.", ["pr.feeUp"], { layer: "fact" }),
    ],
    use: t("수수료가 오를 때 메뉴값이 어디로 가는지가 오늘 수수께끼의 열쇠였어요."),
  },
  mfn: {
    id: "mfn",
    from: "hand",
    name: "최혜대우",
    short: t("“다른 데보다 나쁜 조건으로 팔지 마세요”라는 요구예요."),
    body: [
      t("앱이 가게에 “우리 앱에서의 값과 조건을, 다른 앱과 같거나 더 좋게 맞추세요”라고 요구하는 거예요. 공정위 문서에는 **MFN** 이라는 약자로 나와요.", ["pr.mfnDef"], { layer: "fact" }),
      t("메뉴값만이 아니에요. 쿠팡은 메뉴값 · 최소주문금액 · 할인 같은 여섯 가지를, 배민은 세 가지를 맞추라고 했어요.", ["pr.cpng6", "pr.cpng6list", "pr.bm3"], { layer: "fact" }),
    ],
    use: t("오늘의 주인공. 값을 “맞추라”는 요구가 값이 내려갈 길을 막았다는 게 공정위의 판단이에요."),
  },
  dominance: {
    id: "dominance",
    from: "hand",
    name: "시장지배적 지위",
    short: t("시장의 값과 조건을 좌우할 만큼 큰 회사라는 뜻이에요."),
    body: [
      t("한 시장에서 값이나 거래 조건을 좌우할 수 있을 만큼 큰 회사를, 법은 **시장지배적 사업자**라고 불러요.", ["law.def"], { layer: "fact" }),
      t("한 회사가 시장의 절반 이상을 차지하거나, 큰 회사 셋 이하가 합쳐 75% 이상이면 일단 그렇게 봐요. (10%가 안 되는 회사는 빼고요.)", ["law.presume"], { layer: "fact" }),
      t("배달앱 시장에서 배민은 **58.45%**, 쿠팡은 **34.44%**예요. (2025년, 주문금액 기준)", ["pr.share"], { layer: "fact" }),
      t("이런 회사가 그 힘으로 다른 사업자의 사업을 부당하게 방해하면 법 위반이에요. 과징금 한도도 더 높아요. 지금 법으로 매출액의 6%까지예요. (일반 불공정거래행위는 4%까지)", ["law.ban", "law.fine6", "law.fine4"], { layer: "fact" }),
    ],
    use: t("공정위가 이번에 꺼낸 잣대예요. 두 회사가 시장을 좌우하는 자리에 있다고 봤어요."),
  },
  provisional: {
    id: "provisional",
    from: "hand",
    name: "‘잠정’ 과징금",
    short: t("아직 확정되지 않은 금액이라는 표시예요."),
    body: [
      t("공정위는 두 금액 옆에 **(잠정)**이라고 적었어요. 아직 확정된 숫자가 아니라는 표시예요.", ["pr.decision"], { layer: "fact" }),
      t("그러니 오늘 본 숫자는 “지금까지 발표된 금액”으로 기억해 두면 돼요. 최종 금액은 달라질 수 있어요.", undefined, { layer: "explain" }),
    ],
    use: t("오늘의 금액을 읽는 법. 이 이야기가 아직 끝나지 않았다는 표시이기도 해요."),
  },
};

// ─────────────────────────────────────────────────────────── 두 독자 — **손으로 적은 고정값이다**
// 지식 상태를 추정하지 않는다 (CLAUDE.md "절대 하지 말 것"). 아래 known 은 계산한 것이 아니라 시안이 정해 둔 것이다.
// 처음 온 독자는 "이거 알아요?" 에 스스로 답한 것만 접힌다 (D57 — 씨앗). 그것도 추정이 아니라 독자가 누른 그대로다.

export const READERS: Record<ReaderId, ReaderFixture> = {
  new: { id: "new", label: "처음 온 독자", note: "이 시리즈가 처음 · 개념 지도는 비어 있음", known: [], readZero: false, elsewhere: [] },
  follower: {
    id: "follower",
    label: "따라온 독자",
    note: "0화를 읽음 · 개념 세 개를 이미 앎",
    known: ["fee", "mfn", "provisional"],
    readZero: true,
    // 「금리는 어디로」 2화까지 읽은 독자다 — 그 회차(episodes/fomc)의 진짜 개념 다섯. UX-1 에서는 지어낸 예시 둘이었다
    elsewhere: [{ series: "rate", concepts: ["rate", "target", "dots", "vote", "conditions"] }],
  },
};

// ─────────────────────────────────────────────────────────── 시리즈

export const SERIES: SeriesInfo = {
  id: "price",
  name: "누가 값을 정하나",
  sub: "플랫폼과 가게, 그리고 규칙",
  episodes: [
    { no: t("0화", undefined, { ui: true }), title: t("지금까지의 이야기"), state: "past" },
    { no: t("1화", undefined, { ui: true }), title: t("싸게 팔라는데, 왜 잘못일까"), state: "now" },
    { no: t("다음 화"), title: t("결정문이 나오면"), state: "next" },
  ],
};

// ─────────────────────────────────────────────────────────── 장면의 글

export const COPY: EpisodeCopy = {
  cover: {
    episode: t("1화", undefined, { ui: true }),
    title: "싸게 팔라는데,\n왜 잘못일까",
    dek: t("공정위가 배달의민족과 쿠팡에 과징금을 매겼어요. 두 회사가 가게에 한 요구는, 얼핏 손님에게 좋아 보이는 것이었어요."),
    meta: t("2026년 10월 29일 결정 · 11월 9일 발표", ["pr.decision", "pr.registered"]),
    newHint: t("이 시리즈가 처음이시네요. 지금까지의 이야기부터 짧게 볼게요."),
    recapLabel: "지난 이야기",
    recap: [
      t("2020년, 요기요가 가게들에 “다른 데서 더 싸게 팔지 말라”고 했다가 제재를 받았어요.", ["ygy.date", "ygy.what"]),
      t("올해 6월엔 배민과 쿠팡이 “스스로 고치겠다”는 절차를 신청했지만, 공정위가 받아들이지 않았어요.", ["cd.date", "cd.what"]),
    ],
    askNew: "이 이야기, 어디서 시작됐죠?",
    askFollower: "그래서 결론이 어떻게 났죠?",
  },

  zero: {
    kicker: t("0화 · 지금까지의 이야기", undefined, { ui: true }),
    title: t("같은 요구가,\n6년 전에도 있었어요", ["ygy.date", "pr.decision"], { calc: { "6": "2026 − 2020 (요기요 발표 2020년 · 이번 결정 2026년)" } }),
    beats: [
      {
        when: t("2020년 6월", ["ygy.date"]),
        head: "요기요, 제재를 받다",
        body: t("요기요가 가게들에 “전화 주문이나 다른 앱에서 더 싸게 팔지 말라”고 했어요. 어기면 계약을 끊기도 했고요. 공정위는 과징금 4억 6,800만 원을 매겼어요.", ["ygy.what"], { layer: "fact" }),
      },
      {
        when: t("2025년 5월", ["tf.date"]),
        head: "배달앱 전담팀이 생기다",
        body: t("배달앱 관련 사건이 여럿 쌓이자, 공정위가 이 사건들만 맡는 전담팀을 꾸렸어요.", ["tf.what"], { layer: "fact" }),
      },
      {
        when: t("2026년 6월", ["cd.date"]),
        head: "“스스로 고칠게요”가 거절되다",
        body: t("배민과 쿠팡은 스스로 고칠 방법을 내고, 위법인지는 가리지 않은 채 사건을 끝내는 절차(동의의결)를 신청했어요. 공정위는 받아들이지 않았어요.", ["cd.what", "cd.def"], { layer: "fact" }),
      },
      {
        when: t("2026년 10월 29일", ["pr.decision"]),
        head: "그리고, 결론",
        body: t("남은 길은 하나였어요. 법을 어겼는지 정식으로 가리는 것.", undefined, { layer: "explain" }),
      },
    ],
    ask: "그래서 결론이 어떻게 났죠?",
  },

  event: {
    kicker: t("1화 · 오늘의 사건", undefined, { ui: true }),
    title: "공정위는 두 회사가\n법을 어겼다고 봤어요",
    lead: t("10월 29일, 공정거래위원회는 배달의민족과 쿠팡에 “그만하라”는 명령(시정명령)과 과징금을 결정했어요. 발표는 11월 9일이었어요.", ["pr.decision", "pr.registered"], { layer: "fact" }),
    figures: [
      { who: "배달의민족", amount: t("3,311억 원", ["pr.decision"]), tag: "잠정" },
      { who: "쿠팡", amount: t("3,008억 원", ["pr.decision"]), tag: "잠정" },
    ],
    figureNote: t("배민의 금액에는 다른 두 가지 행위의 몫도 들어 있어요. 오늘 이야기인 최혜대우 요구의 몫은 1,602억 원이에요. ‘잠정’은 아직 확정된 금액이 아니라는 뜻이고요.", ["pr.decision", "pr.breakdown"], { layer: "fact" }),
    quoteLabel: "문제가 된 요구",
    quote: t("“우리 앱에서, 다른 앱보다 비싸게 팔지 마세요.”", ["pr.mfnDef"], { layer: "explain" }),
    quoteNote: "두 회사가 가게에 한 요구를 쉬운 말로 옮긴 거예요. 문서의 문장 그대로는 아니에요.",
    riddle: [
      t("잠깐, 손님에게는 좋은 얘기 아닌가요? 어느 앱에서 시켜도 더 비싸지 않다는 거니까요.", undefined, { layer: "explain" }),
      t("그런데 공정위는 이 요구 때문에 **수수료와 메뉴값이 올랐다**고 봤어요.", ["pr.effect"], { layer: "official" }),
    ],
    ask: "싸게 팔라는데, 왜 값이 오르죠?",
  },

  tools: {
    kicker: "도구 줍기",
    titleNew: "풀기 전에,\n도구 세 개만 챙겨요",
    titleFollower: "오늘 새로 필요한 도구는\n하나예요",
    subNew: t("아는 건 “알아요”를 누르면 접혀요. 접어도 언제든 다시 펼 수 있어요."),
    subFollower: t("나머지 둘은 이미 가지고 계세요. 접어 뒀어요."),
    ask: "그래서, 왜 값이 오르는 거죠?",
  },

  aha: {
    kicker: "풀이",
    title: "가게 사장님이\n되어 볼게요",
    setup: [
      t("당신은 앱 두 곳에 입점한 가게 사장님이에요. **큰 앱**은 손님이 많지만 수수료가 높아요. **새 앱**은 손님을 모으려고 수수료를 낮게 받아요.", undefined, { layer: "explain" }),
      t("새 앱에서는 덜 떼이니까, 값을 조금 내려 팔 수 있어요. 한번 내려 볼까요?", undefined, { layer: "explain" }),
    ],
    flipLabel: "뒤집어 보면",
    flipA: "“다른 앱보다 비싸게 팔지 마세요”",
    flipOp: "=",
    flipB: "“다른 앱에서 더 싸게 팔지 마세요”",
    flipNote: t("같은 말이에요. 더 싼 곳이 생길 수 없으면, 손님은 옮길 이유가 없어요. 새 앱은 수수료를 낮춰도 손님을 데려오지 못하고, 큰 앱은 수수료를 내릴 이유가 없어져요.", ["pr.entrant", "ygy.mech"], { layer: "explain" }),
    realLabel: "실제로 공정위가 본 것",
    real: [
      {
        head: t("13% → 94%", ["pr.ratio"]),
        body: t("쿠팡의 요구를 맞춘 가게(와우매장)의 비율. 2023년 7월 약 13%에서 2025년 10월 약 94%가 됐어요.", ["pr.ratio"], { layer: "fact" }),
      },
      {
        head: t("63% → 80%", ["pr.ratio"]),
        body: t("배민의 요구를 맞춘 가게(배민클럽가게)의 비율. 2024년 5월 약 63%에서 2025년 1월 약 80%가 됐어요.", ["pr.ratio"], { layer: "fact" }),
      },
      {
        head: t("90% 넘게", ["pr.both90"]),
        body: t("두 회사를 합치면 시장의 90%가 넘어요. 이 둘이 동시에 같은 요구를 했어요. 요구를 안 맞추면 혜택 매장에서 빠지고, 빠진 가게는 매출이 크게 줄었어요.", ["pr.both90", "pr.exclude"], { layer: "official" }),
      },
    ],
    verdict: t("그래서 공정위의 결론은 이래요. 수수료와 메뉴값이 올랐고, 새 앱이 들어올 길이 막혔다.", ["pr.effect"], { layer: "official" }),
    caveat: t("여기까지는 **공정위가 내린 판단**이에요. 두 회사의 반론은 이 회차에 아직 싣지 않았어요. 양쪽의 공식 입장을 나란히 놓을 수 있을 때 함께 실어요."),
    askNew: "그럼 이 이야기는 끝난 건가요?",
    askFollower: "지난번 요기요 때와는 뭐가 다르죠?",
  },

  compare: {
    kicker: "따라온 독자에게만",
    title: "요구는 닮았고,\n잣대가 달라졌어요",
    lead: t("지난 이야기에서 본 요기요 사건과 나란히 놓아 볼게요."),
    cols: [t("2020년 요기요", ["ygy.date"]), t("2026년 배민 · 쿠팡", ["pr.decision"])],
    rows: [
      {
        label: "요구",
        a: t("전화 주문이나 다른 앱에서 더 싸게 팔지 마라", ["ygy.what"]),
        b: t("다른 앱보다 불리한 조건으로 팔지 마라", ["pr.mfnDef"]),
      },
      {
        label: "공정위의 잣대",
        a: t("거래상 지위 남용", ["ygy.law"]),
        b: t("시장지배적 지위 남용 (거래상 지위 남용에도 해당)", ["pr.judge", "pr.also"]),
      },
      {
        label: "과징금",
        a: t("4억 6,800만 원 (발표 때 ‘잠정’)", ["ygy.prov"]),
        b: t("배민 최혜대우 몫 1,602억 원 · 쿠팡 3,008억 원 (둘 다 잠정)", ["pr.decision", "pr.breakdown"]),
      },
    ],
    body: [
      t("2020년의 잣대는 “가게 앞에서 힘이 센 쪽”이었어요. 이번에는 오늘 주운 도구, **“시장을 좌우하는 쪽”**이라는 잣대가 함께 쓰였어요.", ["ygy.date", "ygy.law", "pr.judge"], { layer: "explain" }),
      t("금액이 왜 이만큼 다른지, 계산의 자세한 근거는 아직 우리가 확인한 공개 문서에 없어요. 그래서 여기서는 까닭을 짐작해서 말하지 않을게요."),
    ],
    ask: "그럼 이 이야기는 끝난 건가요?",
  },

  next: {
    kicker: "이어짐",
    title: "아니요.\n아직 ‘잠정’이 남았어요",
    lead: t("오늘은 이 시리즈의 한 회차예요. 어디까지 왔고, 무엇이 남았는지 볼게요."),
    line: [
      { when: t("2020", ["ygy.date"]), what: "요기요 제재", state: "past" },
      { when: t("2025. 5", ["tf.date"]), what: "전담팀", state: "past" },
      { when: t("2026. 6", ["cd.date"]), what: "동의의결 거절", state: "past" },
      { when: t("2026. 10. 29", ["pr.decision"]), what: "제재 결정", state: "now" },
      { when: t("다음"), what: "?", state: "next" },
    ],
    hereLabel: "지금 여기",
    toolLead: "가는 길에 도구 하나 더.",
    comingLabel: "다음 회차가 될 일들",
    coming: [
      {
        head: "결정문이 나오면",
        body: t("공정위의 결정은 이유를 적은 문서(의결서)로 남겨요. 이번 결정의 의결서는 아직 우리가 확인한 공개 문서에 없어요. 자세한 이유와 금액 계산은 그 문서에 담겨요.", ["law.record"], { layer: "fact" }),
      },
      {
        head: "규칙도 바뀌는 중",
        body: t("공정위는 큰 회사의 힘 남용을 다루는 시행령을 고치는 안을 내놨어요. 11월 6일부터 12월 16일까지 의견을 받고, 2027년 상반기에 마무리할 예정이에요. 아직 ‘안’이에요.", ["decree.period", "decree.what", "decree.finish"], { layer: "fact" }),
      },
      {
        head: "따로 남은 숙제",
        body: t("쿠팡의 다른 건, 쇼핑 멤버십에 배달앱을 묶었다는 ‘끼워팔기’ 혐의는 이번에 결론을 내지 않고 다시 심사하기로 했어요.", ["pr.reexam", "cd.tying"], { layer: "fact" }),
      },
    ],
    unknownLabel: "아직 모르는 것",
    unknown: [t("최종 과징금 액수"), t("금액을 계산한 자세한 근거"), t("가게들의 값이 앞으로 실제로 달라질지")],
    unknownNote: t("공정위는 가게가 앱마다 값을 스스로 정할 수 있게 될 거라고 기대해요. 기대대로 될지는 지켜볼 일이에요.", ["pr.after"], { layer: "official" }),
    ask: "오늘 내가 얻은 건 뭐죠?",
  },

  keep: {
    kicker: "남음",
    title: "수수께끼 하나를 풀었고,\n도구가 남았어요",
    line: "“다른 데보다 비싸게 팔지 마”는\n“다른 데서 더 싸게 팔지 마”가 될 수 있다.",
    nextBody: t("결정문이 나오면 열려요. ‘잠정’이 떨어지는지, 계산이 어떻게 나왔는지 같이 볼게요."),
  },

  map: { whereToday: t("1화에서 주움", undefined, { ui: true }) },
};

// ─────────────────────────────────────────────────────────── 풀이 장면의 글 — 이 회차만의 것 (Mechanism.tsx 가 읽는다)

export const LAB = {
  big: "큰 앱",
  small: "새 앱",
  feeHigh: "수수료 높음",
  feeLow: "수수료 낮음",
  price: "메뉴값",
  tabOff: "요구가 없을 때",
  tabOn: "요구가 있을 때",
  action: "새 앱에서 값 내리기",
  again: "처음으로",
  goOn: "요구가 있을 때는 어떨까요?",
  rule: "“다른 앱보다 비싸게 팔지 마세요”",
  noRule: "요구 없음. 값은 가게가 앱마다 정해요.",
  same: "같은 값",
  cheaper: "더 싼 값",
  blocked: "내릴 수 없어요",
  guests: "손님",
  offBefore: t("지금은 두 앱의 값이 같아요. 버튼을 눌러 보세요."),
  offAfter: t("손님이 더 싼 새 앱으로 옮겨 가요. 큰 앱은 손님을 지키려면 수수료를 낮춰야 해요. **값이 내려가는 쪽으로 경쟁이 생겨요.**", ["pr.entrant"], { layer: "explain" }),
  onBefore: t("이제 큰 앱이 요구해요. “우리 앱에서, 다른 앱보다 비싸게 팔지 마세요.” 그래도 눌러 보세요."),
  onAfter: t("막혔어요. 새 앱에서 값을 내리면 큰 앱에서도 똑같이 내려야 해요. 그런데 큰 앱은 수수료가 높아서 그럴 여유가 없어요. **결국 두 앱의 값은 같은 자리에 묶여요.**", ["ygy.mech", "pr.both90"], { layer: "explain" }),
};

// ─────────────────────────────────────────────────────────── 회차

export const DELIVERY: EpisodeData = {
  id: "delivery",
  path: "/lab/episode",
  short: "배달앱",
  stores: { kftc: "packages/pipeline/data/events/KFTC-20261029-DELIVERY-APPS/store.documents.json" },
  docs: DOCS,
  sources: SOURCES,
  series: SERIES,
  concepts: CONCEPTS,
  conceptOrder: ["fee", "mfn", "dominance", "provisional"],
  toolOrder: ["fee", "mfn", "dominance"],
  lateTool: "provisional",
  pickedAfter: { tools: ["fee", "mfn", "dominance"], next: ["provisional"] },
  readers: READERS,
  assembly: {
    new: ["cover", "zero", "event", "tools", "aha", "next", "keep"],
    follower: ["cover", "event", "tools", "aha", "compare", "next", "keep"],
  },
  copy: COPY,
  lab: LAB,
  // 지도 — UX-1 의 ConceptMap.tsx 에 있던 자리 · 선 그대로
  map: {
    at: { fee: [21, 72], mfn: [47, 45], dominance: [77, 66], provisional: [73, 22] },
    edges: [
      ["fee", "mfn"],
      ["mfn", "dominance"],
      ["dominance", "provisional"],
    ],
    ghosts: [
      { name: "의결서", at: [28, 13], from: "provisional" },
      { name: "끼워팔기", at: [52, 91], from: "dominance" },
    ],
  },
  layerLabels: { fact: "문서에 적힌 사실", official: "공정위의 판단", explain: "Claro 가 풀어 쓴 설명" },
};
