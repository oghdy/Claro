// 권리 (P-1 · E2-1). 가르는 기준은 넷뿐이다 — 법적 판단을 더 하지 않는다.
//   1. 미국 연방 정부의 저작물 — 17 U.S.C. §105 로 저작권이 없다. 전문을 저장소(git)에 둔다
//   2. 공공누리 제1유형 표시가 있는 한국 공공기관 저작물 (D53) — 출처 표시하면 상업 이용 · 변경 가능. git 에 둔다 (출처 표시)
//   3. 한국 법령 (국가법령정보센터) — 저작권법 제7조 (보호받지 못하는 저작물 — 헌법 · 법률 · 명령 …). git 에 둔다 (D53)
//   4. 그 밖 — 권리 **미확인**. 전문은 git 밖 캐시에만. git 에는 서지 · 해시 · span 만
// 이 넷으로 못 가르면 미확인이다. 2 · 3 은 발행처(도메인)에 묶는다 — 그 기관 사이트 전체의 표시가 근거다. 공공누리 2 ~ 4 유형 · 표시 없음 = 미확인 (D53).
// 문서 단위 (D69 · E3-1b): 발행처는 미확인이어도 **문서 안에** 공공누리 제1유형 표시가 있으면 그 문서만 git — pack.json 항목의 doc_rights (hold_text 의 반대).
//   근거는 무엇을 봤나 — 받은 바이트의 해시 · 쪽 · 그림 · 그림 스트림의 해시. 발행처 행의 can_* 은 그대로 (발행처 단위로 넓히지 않는다).
//   계약 모양 (B-E2 · DATA_MODEL §4.4 DocumentRights · D70): store.json 의 document_rights — doc_rights 하나에 행 하나 (documentRightsRow). 해시는 그 행 한 곳 · 발행처 행 근거 글은 문서 이름만.
// 권리가 git 을 허락해도 문서 안에 **제3자의 글**이 길게 있으면 그 문서만 캐시에 둔다 — pack.json 항목의 hold_text (E2-1 · D40 "긴 제3자 글이 섞인 문서가 나오면 다시 본다"). SourceRegistry 의 칸은 이 근거가 직접 말하는 것만 채운다 (can_store · can_quote). 나머지는 null = 검토 안 함. 근거 글은 basis 칸 (W-4 J5).
// 계약의 타입만 가져온다 (import type — 노드 타입 지우기로 돌 때 지워진다). 칸 이름 · 모양은 DATA_MODEL 이 원본
import type { DocumentRights, SourceRegistry } from "../../contract/src/data-model.ts";

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
// 한국 법령 — 발행처 → 무엇. 저작권법 제7조 제1호 (법령) · 제2호 (국가의 고시 · 공고 · 훈령 …) — 고시(행정규칙)와 별표도 같다 (E3-1)
export const KR_STATUTE: Record<string, string> = {
  "law.go.kr": "국가법령정보센터 (법제처) — 법률 · 대통령령 본문과 별표 · 행정규칙(고시) 본문",
};
// 공공누리를 찾아봤으나 git 의 근거가 되지 못한 발행처 — 무엇을 봤나 (권리는 미확인 그대로. 판정은 PM — E3-1)
export const CHECKED_NOT_STORABLE: Record<string, string> = {
  "pipc.go.kr":
    '개인정보보호위원회 (pipc.go.kr) — 사이트 꼬리말: "Copyright ⓒ Personal Information Protection Commission. All right reserved." · 공공누리 표시 글 없음 (게시물 페이지 · 누리집 안내 · 도움말). ' +
    "보도자료 첨부 (PDF · HWPX) 안에는 공공누리 제1유형 (출처표시) 그림이 있다 — 문서 단위 표시라 발행처 단위 목록(KOGL_TYPE1)에 넣지 않았다 (_open E3-1-a → D69: 표시를 확인한 문서만 문서 단위로 — pack.json doc_rights)",
};

/** 문서 단위 권리 (D69 · E3-1b) — pack.json 항목의 doc_rights. 발행처는 권리 미확인인데 그 문서 **안에** 공공누리 표시가 있다. 판정은 PM.
 *  칸은 전부 "무엇을 봤나"를 다시 확인할 수 있게 — 같은 바이트(raw_sha256)를 열어 그 쪽의 그 그림(스트림 해시)을 보면 된다 */
export type DocRights = {
  rights: "KOGL_TYPE1";           // 지금은 공공누리 제1유형만 — 2 ~ 4 유형 · 표시 없음 = 미확인 (D53)
  mark: string;                   // 본 표시 — "공공누리 제1유형 (OPEN · 출처표시) 그림"
  raw_sha256: string;             // 표시를 본 바이트 = fetch.json 의 fetch.raw_sha256. 받은 바이트가 다르면 멈춘다 (다른 파일이다)
  page: number;                   // 표시가 있는 쪽 (1부터)
  pages: number;                  // 파일의 쪽 수
  image: { name: string; xref: number; width: number; height: number; filter: string; stream_sha256: string };   // PDF 안 그림 — 이름 · 객체 번호 · 픽셀 · 필터 · 스트림 바이트(파일 안 그대로)의 sha256
  where: string;                  // 쪽 안 어디 — 본문 끝 · 붙임 앞 …
  third_party: string;            // 제3자 글이 길게 들었나 — 본 것. 있으면 hold_text 도 단다 (D55)
  seen_by: string;                // 누가 무엇으로 봤나
  checked_at: string;             // TimePoint — 본 날
};
const HEX64 = /^[0-9a-f]{64}$/;
/** doc_rights 칸의 모양 — 문제 글 목록 (빈 목록 = 됐다). pack.ts 는 문제가 있으면 멈춘다 */
export function docRightsProblems(it: { label: string; publisher: string; doc_rights?: DocRights }): string[] {
  const d = it.doc_rights;
  if (!d) return [];
  const p: string[] = [];
  if (d.rights !== "KOGL_TYPE1") p.push(`rights ${JSON.stringify(d.rights)} — 문서 단위는 공공누리 제1유형만 (D53 · D69)`);
  if (canStore(rightsOf(it.publisher))) p.push(`발행처 ${it.publisher} 는 발행처 단위로 이미 git 이다 — doc_rights 가 필요 없다`);
  if (!HEX64.test(d.raw_sha256 ?? "")) p.push("raw_sha256 이 sha256 (소문자 16진 64자) 가 아니다");
  if (!HEX64.test(d.image?.stream_sha256 ?? "")) p.push("image.stream_sha256 이 sha256 이 아니다");
  if (!Number.isInteger(d.page) || !Number.isInteger(d.pages) || d.page < 1 || d.page > d.pages) p.push(`쪽 ${d.page} / ${d.pages}`);
  for (const k of ["mark", "where", "third_party", "seen_by", "checked_at"] as const) if (!d[k]) p.push(`${k} 가 없다`);
  return p.map((m) => `${it.label}: doc_rights — ${m}`);
}
/** 문서의 권리 — doc_rights 가 있으면 그것, 없으면 발행처의 권리 */
export const rightsOfItem = (it: { publisher: string; doc_rights?: DocRights }): Rights => it.doc_rights?.rights ?? rightsOf(it.publisher);
/** 공공누리 제1유형이 직접 말하는 칸 (D53) — 발행처 행 (KOGL_TYPE1 목록) 과 문서 단위 행이 같은 값을 쓴다 */
const KOGL_TYPE1_GRANTS = { can_store: true, can_quote: true, can_transform: true, commercial_use: true, attribution_required: true } as const;

/** pack.json 의 doc_rights (사람이 쓴 입력) → 계약의 문서 단위 권리 행 (DATA_MODEL DocumentRights · B-E2). 다시 확인할 값만 옮긴다 —
 *  쪽 안의 자리 (where) · 본 방법 (seen_by) · 제3자 글 (third_party) 은 pack.json 에 그대로 (계약 칸이 아니다) */
export function documentRightsRow(sourceId: string, d: DocRights): DocumentRights {
  return {
    source_id: sourceId, rights: d.rights, ...KOGL_TYPE1_GRANTS,
    basis: {
      bytes_sha256: d.raw_sha256, page: d.page, pages: d.pages,
      image: `${d.image.name} 객체 ${d.image.xref} · ${d.image.width}×${d.image.height} · ${d.image.filter}`,
      image_sha256: d.image.stream_sha256, seen: d.mark,
    },
    last_reviewed_at: d.checked_at,
  };
}

export const rightsOf = (publisher: string): Rights =>
  publisher in US_FEDERAL ? "US_FEDERAL_17USC105" : publisher in KOGL_TYPE1 ? "KOGL_TYPE1" : publisher in KR_STATUTE ? "KR_STATUTE" : "UNCONFIRMED";
export const canStore = (r: Rights) => STORABLE.includes(r);

/** 계약 SourceRegistry 그대로 — 파이프라인은 근거(basis) 를 늘 쓴다 (W-4 J5. 전에는 `_basis` 주석) */
export type RegistryRow = SourceRegistry & { basis: string };

/** 발행처 하나의 권리 행. docs = 그 발행처의 문서 중 doc_rights 가 있는 것 (held = hold_text 로 캐시) — 행의 can_* 은 발행처 단위 그대로,
 *  근거 글은 문서 이름만 가리킨다. 본 것 (해시 · 쪽 · 그림) 은 문서 단위 행 (store.json document_rights — B-E2) 한 곳 */
export function registryRow(publisher: string, reviewedAt: string, accessNote: string, docs: { label: string; doc_rights: DocRights; held?: boolean }[] = []): RegistryRow {
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
  if (docs.length) {
    return {
      source: publisher, access_method: accessNote, can_ingest: null, can_store: null, can_quote: null, can_transform: null,
      commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: docs.map((d) => d.doc_rights.checked_at).sort().at(-1)!,
      basis: `권리 미확인 (발행처 단위) — ${CHECKED_NOT_STORABLE[publisher] ?? "발행처 단위의 근거를 찾지 못했다"}. ` +
        "이 행의 can_* 은 발행처 단위라 null 그대로 — 발행처 단위로 넓히지 않는다 (D69). " +
        `문서 안에 공공누리 제1유형 (출처표시) 그림을 본 문서는 그 문서에 한해 문서 단위 행이 이 행보다 앞선다 (store.json document_rights — DATA_MODEL DocumentRights · D70 · B-E2): ` +
        `${docs.map((d) => d.label + (d.held ? " (제3자 글이 길어 전문은 캐시 — hold_text · D55)" : "")).join(" · ")}. ` +
        "본 것 (받은 바이트 · 쪽 · 그림 · 그림 해시) 은 그 행의 basis · 쪽 안의 자리 · 본 방법 · 제3자 글을 본 것은 pack.json 의 doc_rights. " +
        "그 밖의 이 발행처 문서 (표시가 없거나 보지 않은 것 — 게시물 · 일정 페이지 …) 는 전문을 git 밖 캐시에만 · git 에는 서지 · 해시 · span 만",
    };
  }
  return {
    source: publisher, access_method: accessNote, can_ingest: null, can_store: null, can_quote: null, can_transform: null,
    commercial_use: null, attribution_required: null, terms_url: null, last_reviewed_at: null,
    basis: CHECKED_NOT_STORABLE[publisher]
      ? `권리 미확인 — ${CHECKED_NOT_STORABLE[publisher]}. 전문은 git 밖 캐시에만 둔다. git 에는 서지 · 해시 · span 만 (P-1 · E3-1)`
      : "권리 미확인 — 미국 연방 정부가 아니다. 전문은 git 밖 캐시(packages/pipeline/.cache/text)에만 둔다. git 에는 서지 · 해시 · span 만 (P-1)",
  };
}
