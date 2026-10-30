// 권리 (P-1). 가르는 기준은 둘뿐이다 — 법적 판단을 더 하지 않는다.
//   1. 미국 연방 정부의 저작물 — 17 U.S.C. §105 로 저작권이 없다. 전문을 저장소(git)에 둔다
//   2. 그 밖 — 권리 **미확인**. 전문은 git 밖 캐시에만. git 에는 서지 · 해시 · span 만
// 이 두 줄로 못 가르면 미확인이다. SourceRegistry 의 칸은 이 근거가 직접 말하는 것만 채운다 (can_store · can_quote). 나머지는 null = 검토 안 함.
export type Rights = "US_FEDERAL_17USC105" | "UNCONFIRMED";

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

export const rightsOf = (publisher: string): Rights => (publisher in US_FEDERAL ? "US_FEDERAL_17USC105" : "UNCONFIRMED");

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
  _basis: string;
};

export function registryRow(publisher: string, reviewedAt: string, accessNote: string): RegistryRow {
  const fed = US_FEDERAL[publisher];
  if (fed) {
    return {
      source: publisher, access_method: accessNote, can_ingest: null, can_store: true, can_quote: true, can_transform: null,
      commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: reviewedAt,
      _basis: `17 U.S.C. §105 — ${fed} 는 미국 연방 정부다. 연방 정부의 저작물에는 저작권이 없다 → 전문 보관(can_store) · 인용(can_quote). ` +
        "나머지 칸은 이 근거가 직접 말하지 않아 null (검토 안 함). 문서 안에 든 제3자의 글(예: 기자회견의 기자 질문)은 따로 보지 않았다 (P-1)",
    };
  }
  return {
    source: publisher, access_method: accessNote, can_ingest: null, can_store: null, can_quote: null, can_transform: null,
    commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: null,
    _basis: "권리 미확인 — 미국 연방 정부가 아니다. 전문은 git 밖 캐시(packages/pipeline/.cache/text)에만 둔다. git 에는 서지 · 해시 · span 만 (P-1)",
  };
}
