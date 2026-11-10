// 권리 (P-1 · E2-1). 가르는 기준은 넷뿐이다 — 법적 판단을 더 하지 않는다.
//   1. 미국 연방 정부의 저작물 — 17 U.S.C. §105 로 저작권이 없다. 전문을 저장소(git)에 둔다
//   2. 공공누리 제1유형 표시가 있는 한국 공공기관 저작물 (D53) — 출처 표시하면 상업 이용 · 변경 가능. git 에 둔다 (출처 표시)
//   3. 한국 법령 (국가법령정보센터) — 저작권법 제7조 (보호받지 못하는 저작물 — 헌법 · 법률 · 명령 …). git 에 둔다 (D53)
//   4. 그 밖 — 권리 **미확인**. 전문은 git 밖 캐시에만. git 에는 서지 · 해시 · span 만
// 이 넷으로 못 가르면 미확인이다. 2 · 3 은 발행처(도메인)에 묶는다 — 그 기관 사이트 전체의 표시가 근거다. 공공누리 2 ~ 4 유형 · 표시 없음 = 미확인 (D53).
// 권리가 git 을 허락해도 문서 안에 **제3자의 글**이 길게 있으면 그 문서만 캐시에 둔다 — pack.json 항목의 hold_text (E2-1 · D40 "긴 제3자 글이 섞인 문서가 나오면 다시 본다"). SourceRegistry 의 칸은 이 근거가 직접 말하는 것만 채운다 (can_store · can_quote). 나머지는 null = 검토 안 함. 근거 글은 basis 칸 (W-4 J5).
export type Rights = "US_FEDERAL_17USC105" | "KOGL_TYPE1" | "KR_STATUTE" | "UNCONFIRMED";
/** 전문을 공개 저장소(git)에 둘 수 있는 권리 — verify-source-pack.py 의 STORABLE_RIGHTS 와 같다 */
export const STORABLE: readonly Rights[] = ["US_FEDERAL_17USC105", "KOGL_TYPE1", "KR_STATUTE"];

// 발행처(Source.publisher) → 연방 기관. 값은 그 기관 이름 (근거 글에 쓴다)
export const US_FEDERAL: Record<string, string> = {
  "federalreserve.gov": "Board of Governors of the Federal Reserve System",
  "bls.gov": "U.S. Bureau of Labor Statistics (Department of Labor)",
  "bea.gov": "U.S. Bureau of Economic Analysis (Department of Commerce)",
  "home.treasury.gov": "U.S. Department of the Treasury",
  "eia.gov": "U.S. Energy Information Administration (Department of Energy)",
  "whitehouse.gov": "The White House (Executive Office of the President)",
  "centcom.mil": "U.S. Central Command (Department of Defense)",
};

// 공공누리 제1유형 — 발행처 → 근거 (그 사이트가 스스로 밝힌 글 그대로. E2-1 이 2026-11-11 저장한 페이지의 꼬리말)
export const KOGL_TYPE1: Record<string, string> = {
  "ftc.go.kr": '공정거래위원회 (ftc.go.kr) — 게시물 페이지 꼬리말: "공정거래위원회 저작물은 " 공공누리 제1유형(출처명시) " 공공저작물의 출처를 명시하고, 상업적 활용여부에 관계없이 이용하며, 2차적저작물 작성등 변경하여 이용할 수 있다."',
};
// 한국 법령 — 발행처 → 무엇
export const KR_STATUTE: Record<string, string> = {
  "law.go.kr": "국가법령정보센터 (법제처) — 법률 · 대통령령 본문",
};

export const rightsOf = (publisher: string): Rights =>
  publisher in US_FEDERAL ? "US_FEDERAL_17USC105" : publisher in KOGL_TYPE1 ? "KOGL_TYPE1" : publisher in KR_STATUTE ? "KR_STATUTE" : "UNCONFIRMED";
export const canStore = (r: Rights) => STORABLE.includes(r);

export type RegistryRow = {
  source: string;
  access_method: string;
  can_ingest: boolean | null;
  can_store: boolean | null;
  can_quote: boolean | null;
  can_transform: boolean | null;
  commercial_use: boolean | null;
  attribution_required: boolean | null;
  terms_url: string | null;
  last_reviewed_at: string | null;
  basis: string;   // 권리 칸의 근거 (DATA_MODEL SourceRegistry.basis — W-4 J5). 전에는 `_basis` 주석
};

export function registryRow(publisher: string, reviewedAt: string, accessNote: string): RegistryRow {
  const fed = US_FEDERAL[publisher];
  if (fed) {
    return {
      source: publisher, access_method: accessNote, can_ingest: null, can_store: true, can_quote: true, can_transform: null,
      commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: reviewedAt,
      basis: `17 U.S.C. §105 — ${fed} 는 미국 연방 정부다. 연방 정부의 저작물에는 저작권이 없다 → 전문 보관(can_store) · 인용(can_quote). ` +
        "나머지 칸은 이 근거가 직접 말하지 않아 null (검토 안 함). 문서 안에 든 제3자의 글(예: 기자회견의 기자 질문)은 따로 보지 않았다 (P-1)",
    };
  }
  const kogl = KOGL_TYPE1[publisher];
  if (kogl) {
    return {
      source: publisher, access_method: accessNote, can_ingest: null, can_store: true, can_quote: true, can_transform: true,
      commercial_use: true, attribution_required: true, terms_url: null, last_reviewed_at: reviewedAt,
      basis: `공공누리 제1유형 (출처표시) — ${kogl} → 전문 보관(can_store) · 인용(can_quote) · 변경(can_transform) · 상업 이용(commercial_use) · 출처 표시 필요(attribution_required) (D53). ` +
        "can_ingest 는 이 표시가 말하지 않아 null. 문서 안의 제3자 글(언론 방송 발췌 · 회사 내부 자료 · 개인 발언)은 공공누리 대상이 아니다 — 그런 글이 길게 든 문서는 pack.json hold_text 로 캐시에만 (E2-1)",
    };
  }
  const law = KR_STATUTE[publisher];
  if (law) {
    return {
      source: publisher, access_method: accessNote, can_ingest: null, can_store: true, can_quote: true, can_transform: null,
      commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: reviewedAt,
      basis: `저작권법 제7조 (보호받지 못하는 저작물 — 헌법 · 법률 · 조약 · 명령 …) — ${law} → 전문 보관(can_store) · 인용(can_quote) (D53). ` +
        "나머지 칸은 null — 사이트(국가법령정보센터) 이용약관은 검토하지 않았다 (E2-1)",
    };
  }
  return {
    source: publisher, access_method: accessNote, can_ingest: null, can_store: null, can_quote: null, can_transform: null,
    commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: null,
    basis: "권리 미확인 — 미국 연방 정부가 아니다. 전문은 git 밖 캐시(packages/pipeline/.cache/text)에만 둔다. git 에는 서지 · 해시 · span 만 (P-1)",
  };
}
