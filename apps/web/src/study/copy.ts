// 물음의 흐름이 독자에게 하는 말 — 전부 여기 있다. 물음의 글(./probes.ts)과 기사의 글(골든)이 아닌 글자는 이 파일에서만 나온다.
// 동의 안내(NOTICE)는 DECISIONS D37 의 글자 그대로다. **글자를 바꾸면 NOTICE_VERSION 을 올린다** — 누가 어느 안내를 보고 눌렀는지가 남는다 (identity.consent).
// 그 밖의 글은 0.5 세션의 초안이다 — 도윤이 아직 안 봤다 (logs/backend/phase-0-step-0-5.md 의 표).
// 맞았다 · 틀렸다를 말하는 글은 없다 — 며칠 뒤 같은 물음을 다시 묻는다 (D37)

export const NOTICE_VERSION = 1;
export const NOTICE = {
  title: "읽기 전에 알려 드려요",
  lines: [
    "Claro 는 뉴스를 더 쉽게 읽히게 하려는 실험이에요. 도와주셔서 고맙습니다.",
    "기록하는 것: 기사를 어디까지 읽었는지, 물음에 적은 답.",
    "기록하지 않는 것: 이름, 연락처. 답은 번호로만 남아요.",
    "며칠 뒤에 같은 물음을 한 번 더 여쭤볼게요. 언제든 그만두셔도 됩니다.",
  ],
  agree: "알겠어요, 시작할게요",
} as const;

export const STUDY = {
  /** 물음 화면 */
  before: "읽기 전에 하나만 여쭤볼게요",
  after: "읽은 것에 대해 여쭤볼게요",
  again: "며칠 전에 읽은 뉴스, 다시 여쭤볼게요",
  write: "여기에 적어 주세요",
  next: "다음",
  skip: "건너뛰기",
  /** 기사의 마지막 장에 더해지는 길 (Claro 무리) */
  toQuestions: "다 읽었어요 — 세 가지만 여쭤볼게요",
  /** 일반 기사 무리 — 바깥 기사를 읽고 돌아오게 */
  goRead: "아래 기사를 읽고 돌아와 주세요",
  goReadNote: "기사는 새 창에서 열려요. 다 읽은 뒤 이 화면으로 돌아와 아래를 눌러 주세요.",
  outsideLink: "기사 읽으러 가기",
  didRead: "다 읽었어요",
  /** 끝 */
  thanks: "고맙습니다",
  thanksNow: "답이 잘 전해졌어요. 며칠 뒤에 같은 물음을 한 번 더 여쭤볼게요.",
  thanksLater: "여기까지예요. 도와주셔서 큰 힘이 됐어요.",
  reread: "기사 다시 보기",
  /** 그 밖 */
  preparing: "준비 중이에요",
  preparingNote: "곧 열릴 거예요. 조금 뒤에 다시 열어 주세요.",
  invite: "받으신 링크로 열어 주세요",
  inviteNote: "이 화면은 초대받은 분의 링크로만 열려요.",
  offline: "연결이 잘 안 돼요",
  offlineNote: "잠시 뒤에 다시 시도해 주세요.",
  retry: "다시 시도",
  readOnly: "기사만 읽기",
} as const;
