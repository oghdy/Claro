// P-4 · Coverage 점검 프롬프트 — 이 파일 한 곳에만 있다. 글자를 바꾸면 판(ASSIGN_VERSION · UNSLOTTED_VERSION)을 올린다.
//   p4-assign/1    사실 하나하나를 Coverage 요소에 붙인다 (붙인 근거 한 줄). 표 · BLS 사실은 보내지 않는다 — 코드가 붙인다 (coverage-schema.json table_rules)
//   p4-unslotted/1 어느 요소에도 붙지 않은 사실에서 "이전과 달라졌거나 이례적인" 묶음을 찾는다 (FINDINGS §6.2 Unslotted Notable)
// 해석 · 요점 · 반증은 이 단계가 아니다 (P-5 ~). 사실이 무엇을 "말하는가" 로만 붙인다.

export const ASSIGN_VERSION = "p4-assign/1";
export const UNSLOTTED_VERSION = "p4-unslotted/1";

export type SchemaElement = { id: string; what: string; storyline?: string };
export type SchemaSlot = { id: string; name: string; from_09: string; renamed: string | null; _note?: string; elements: SchemaElement[] };

const slotList = (slots: SchemaSlot[]) =>
  slots.map((s) => `${s.id} ${s.name}${s._note ? ` — ${s._note}` : ""}\n${s.elements.map((e) => `  ${e.id}: ${e.what}`).join("\n")}`).join("\n");

export const ASSIGN_SYSTEM = `너는 Claro 의 Coverage 점검 단계다. 한 뉴스 사건의 사실 그래프(1차 문서에서 뽑은 사실들)를 받아, 사실 하나하나가 기사의 체크리스트(슬롯 · 요소) 가운데 어느 요소를 채우는지 붙인다. 사람이 이 표를 보고 빈 곳을 찾아 자료를 다시 모은다 — 그러니 빈 요소를 억지로 채우지 않는 것이 무엇보다 중요하다.

## 붙이는 규칙
- 사실의 글이 그 요소가 묻는 것을 **직접 말할 때만** 붙인다. 주제가 비슷하다 · 관련이 있어 보인다는 것만으로 붙이지 않는다
- 주체를 지킨다: 요소가 "성명문" 이면 성명문의 사실만 · "의장" 이면 의장이 말한 사실만 · "반대자" 는 이 사건의 반대자(아래 사건 정보)만 · "위원 · 총재 (반대자 밖)" 는 반대자가 아닌 사람만
- 때를 지킨다: 요소가 "10월 성명문" 이면 9월 성명문의 사실은 아니다. "회의 뒤" 는 사건 날짜 뒤에 한 말 · 낸 문서. "회의 전" 은 직전 회의와 사건 날짜 사이
- 한 사실이 여러 요소를 채우면 여럿을 붙인다. 어느 요소도 직접 채우지 않으면 빈 목록
- 해석하지 않는다 — 사실이 무엇을 뜻하는지 · 왜 중요한지를 판단하지 않는다. 글이 무엇을 말하는지로만 붙인다
- 사실의 글을 고치거나 새 사실을 만들지 않는다

## 출력
assignments: 받은 사실마다 하나 (빠짐없이 · key 그대로)
- elements: 붙인 요소 id 목록 (없으면 [])
- why: 한국어 한 줄. 붙였으면 사실 글의 어느 말이 그 요소에 닿는지 (글의 낱말을 들어). 비었으면 "슬롯 밖 — " 뒤에 이 사실의 주제를 몇 낱말로`;

export function assignUser(ev: { code: string; what: string; date: string; prev_meeting: string; summary: string }, slots: SchemaSlot[], facts: { key: string; doc: string; event_at: string | null; fact_type: string; actor: string | null; claim_text: string }[]): string {
  return `## 사건
code: ${ev.code}
무엇: ${ev.what}
사건 날짜: ${ev.date} · 직전 회의: ${ev.prev_meeting}
${ev.summary}

## 슬롯 · 요소
${slotList(slots)}

## 사실 (key | 문서 | event_at | fact_type | actor | 글)
${facts.map((f) => `${f.key} | ${f.doc} | ${f.event_at ?? "-"} | ${f.fact_type} | ${f.actor ?? "-"} | ${f.claim_text}`).join("\n")}

사실마다 채우는 요소를 붙여라.`;
}

export function assignSchema(elementIds: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["assignments"],
    properties: {
      assignments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["key", "elements", "why"],
          properties: {
            key: { type: "string" },
            elements: { type: "array", items: { type: "string", enum: elementIds } },
            why: { type: "string" },
          },
        },
      },
    },
  } as const;
}

export const UNSLOTTED_SYSTEM = `너는 Claro 의 Coverage 점검 단계 — Unslotted 탐색이다. Coverage 슬롯은 놓치지 않기 위한 체크리스트라, 예상하지 못한 것은 슬롯이 없어 잡히지 않는다. 너는 어느 슬롯에도 붙지 않은 사실들을 받아 열린 질문 하나에 답한다.

> 이 사실들 가운데, 기존 슬롯 어디에도 들어가지 않지만 이전과 달라졌거나 이례적인 사실이 있는가?

예 (다른 사건에서 실제로 놓쳤던 것): 회의록에 의장이 연 8회 회의를 줄이자고 제안한 것 · 회의가 선거 직전이라는 것.

## 규칙
- 사실 묶음을 낸다 — 같은 일을 말하는 사실들을 한 묶음으로. 묶음마다 title (한국어 몇 낱말) · keys (받은 key 그대로) · why
- why: 사실들의 글이 말하는 것 가운데 무엇이 "이전과 다름" · "이례적" 인지 한두 문장. 사실 글에 있는 것만 든다 — 네 배경 지식 · 해석 · 전망을 보태지 않는다 ("이전" 이 사실 글에 없으면 "이례적" 의 근거만)
- 흔한 배경 설명 · 문서 안내 · 기관 소개 · 사건과 거리가 먼 것은 내지 않는다. 없으면 빈 목록
- 많아야 8 묶음`;

export function unslottedUser(ev: { code: string; what: string; date: string; summary: string }, slots: SchemaSlot[], facts: { key: string; doc: string; event_at: string | null; actor: string | null; claim_text: string }[]): string {
  return `## 사건
code: ${ev.code}
무엇: ${ev.what}
사건 날짜: ${ev.date}
${ev.summary}

## 기존 슬롯 (이름만)
${slots.map((s) => `${s.id} ${s.name}`).join(" · ")}

## 어느 슬롯에도 붙지 않은 사실 (key | 문서 | event_at | actor | 글)
${facts.map((f) => `${f.key} | ${f.doc} | ${f.event_at ?? "-"} | ${f.actor ?? "-"} | ${f.claim_text}`).join("\n")}

이전과 달라졌거나 이례적인 사실 묶음을 내라.`;
}

export const UNSLOTTED_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["groups"],
  properties: {
    groups: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "keys", "why"],
        properties: { title: { type: "string" }, keys: { type: "array", items: { type: "string" } }, why: { type: "string" } },
      },
    },
  },
} as const;
