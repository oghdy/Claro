# 짧은 이야기 확인지 — 「사진 때문에 수억 유로라는데, 사진을 가져간 걸까」 (meta-gallery)

내기 전에 사람 (편집자)이 본다 — 10분 안쪽. 고칠 글은 같은 폴더 `human.json` 의 `edits` 에 `{ id, t, why }` (근거를 바꾸려면 `src`), 다 보면 칸마다 `true`. 고친 것은 `logs/correction-log.jsonl` 에도 한 줄.
사건 GPDP-20261114-META-GALLERY · 고른 곳 S-2 아침 한 장 2026-11-15-news W1 · 글 short-write/1 · claude-fable-5-2 · 글 덩이 19 (근거 있는 것 12) · 계약 검증 통과 · 함의 본 글 12 / 위험한 글 12

## 1. 막힘 0 — 고치거나 뺀다
- 없음

## 2. 뒤집기가 진짜인가 (가장 중요 — `flip_ok`)
- **“사진을 가져다 써서 받은 과징금” ≠ “허락 없이 폰 안에 닿아서 받은 과징금”** · 모델이 본 세기: **strong**
- 첫 생각: 사진 때문에 이렇게 큰 과징금이라면, 내 사진을 몰래 가져가 AI 학습에라도 썼겠구나 싶어요.
  - 왜 그렇게 생각하기 쉬운가 (모델): '사진'과 '8억 유로'가 나란히 놓인 제목을 보면, 그만큼 큰 벌이니 사진을 몰래 가져가 AI 학습 같은 데 썼으리라고 짐작하기 쉽다.
- 깨는 사실: 그런데 문서에는 이번 절차가 사진을 AI 학습에 쓰는 문제를 다루지 않았다고 적혀 있어요. 기구가 문제 삼은 건, 앱이 폰 안의 사진과 영상에 **따로 동의를 받지 않고 닿았다**는 것이에요.
  - `p14` “The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies.”
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
- 뒤집기가 서 있는 곳 (모델): 문서는 이번 절차가 AI 학습 이용 문제를 다루지 않았다고 적었고(p14), 폰 안 정보에 닿는 것은 전송이나 피해 여부와 상관없이 동의가 필요하다고 적었다(p11 p12). 위반으로 적힌 것은 구체적 동의와 제대로 된 안내 없이 접근했다는 것이다(p03).
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
  - `p11` “The Authority recalled that the infringed provision, Article 122 of the Privacy Code implementing the European ePrivacy Directive, protects the smartphone as part of a person's private sphere.”
  - `p12` “Any access to the information it contains therefore requires free and informed consent, regardless of whether the data is transmitted or any harm occurs.”
  - `p14` “The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies.”
- 아침 한 장의 뒤집기 후보 (제목만 본 신호): “8억 유로 = 사진을 가져가 AI 에 먹여서” ≠ 가져갔는지 · 피해가 있었는지와 상관없이, 폰 안에 닿는 것부터 따로 허락받아야 한다 (S-3 가 문서를 열어 본 것 — AI 학습은 이번 절차가 다루지 않았다고 문서에 글자로 있다)
- 볼 것: 보통 사람이 정말 그렇게 생각하나 · 뒤쪽 말이 틀렸다는 것을 **문서가** 받치나 (문서가 말하지 않은 것으로 뒤집지 않았나) · 억지가 아닌가

## 3. 그리지 않을 것 (`not_drawn_ok`) — 글이 이 선을 넘지 않았나
- 사진이 메타 서버로 올라갔다 / 안 올라갔다, AI 학습에 쓰였다 / 안 쓰였다 — 문서는 이번 절차가 AI 학습을 다루지 않았고 메타가 부인한다고만 적었다. 어느 쪽으로도 쓰지 않는다
- 메타의 속마음 · 의도 (일부러 숨겼다, 몰래 했다) — 문서에 없다. 기구가 확인한 사실(권한 하나 · 일반적 안내 · 기본 켜짐)만 쓴다
- 한국 사용자 · 한국 법에 어떤지, 다른 나라 앱도 그런지 — 이탈리아의 일이고 문서에 없다. '앱들은 흔히'처럼 넓히지 않는다
- 과징금을 원 · 달러로 바꾼 값, 사람 수로 나눈 값, 메타의 전 세계 매출액 역산 — 문서에 없는 수. 유로와 문서의 비율만 쓴다
- 2019년의 앞선 결정이 무엇이었는지, 2026년에 나온 클라우드 처리 기능이 위법인지 — 문서는 있었다 · 따로 살필 수 있다고만 적었다
- 문서에 없는 것 (모델이 적은 것):
  - 사진이 실제로 폰 밖으로 전송됐는지, AI 학습에 쓰였는지
  - 메타가 직접 낸 공식 입장과 불복할지 여부
  - 이탈리아 밖 (한국 포함) 사용자에게 같은 기능이 어떻게 적용되는지
  - 과징금 액수를 구체적으로 어떻게 계산했는지 (고려한 요소와 매출 대비 비율만 있다)

## 4. 숫자 — 숫자가 든 글 6 (코드가 구절 · 계산과 댔다 — 그 수가 **무엇의** 수인지는 사람이)
- `cover.dek` 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 감독기구는 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았다고 밝혔어요.
  - 계산 8 = 805 million euros = 8억 500만 유로
  - 계산 500 = 805 million euros = 8억 500만 유로
  - `p01` “The Garante has fined Meta Platforms Ireland Limited 805 million euros”
  - `p02` “The Italian Data Protection Authority (Garante) has fined Meta Platforms Ireland Limited €805 million.”
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
- `cover.meta` 2026년 11월 14일 발표 · 로마
  - 계산 11 = November = 11월
  - `p28` “Rome, 14 November 2026”
- `where.body[0]` 안드로이드용 페이스북 앱에는 2023년부터 ‘갤러리에서 추천 받기’라는 기능이 있었어요. 페이스북을 보는 동안, 내 폰 갤러리에 있는 사진과 영상을 “이거 올려 볼래요?” 하듯 추천으로 보여 주는 기능이에요.
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
  - `p04` “The measure concerns the 'Get tips from your gallery while browsing Facebook' feature, available since 2023, which, while browsing, shows users photos and videos from their phone gallery as suggestions to post.”
- `where.body[1]` 조사는 2025년 7월에 시작됐어요. 볼차노 소비자보호센터가 민원을 냈고, 기구가 직접 기술 분석을 했어요.
  - 계산 7 = July = 7월
  - `p05` “The investigation was launched in July 2025 following a complaint by the Bolzano Consumer Protection Centre and was based on a technical analysis conducted by the Authority.”
- `why.verdict` 기구는 메타가 구체적인 동의를 받지 않았고 제대로 알리지도 않았다고 보고, 8억 500만 유로의 과징금을 매겼어요. 60일 안에 이 기능만을 위한 **별도의 동의**를 받고, 기능을 기본으로 꺼 두라고도 했어요. 금액을 정할 때는 이탈리아의 안드로이드 사용자 약 2,000만 명이 관련됐다는 점 등을 고려했다고 해요.
  - 계산 8 = 805 million = 8억 500만
  - 계산 500 = 805 million = 8억 500만
  - 계산 2,000 = 20 million = 2,000만
  - `p02` “The Italian Data Protection Authority (Garante) has fined Meta Platforms Ireland Limited €805 million.”
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
  - `p16` “Within 60 days, Meta must:”
  - `p17` “- request consent through a separate and specific request for the feature and clearly explain to users what it is for, that it involves access to the gallery, and how to disable it;”
  - `p18` “- keep the feature switched off by default, even for those who have already given consent.”
  - `p21` “In determining the amount of the fine, the Authority took into account:”
  - `p22` “- the high number of people involved (around 20 million Android users in Italy);”
- `keep.advice` 기구는 메타에 이 기능이 무엇을 위한 것인지, 갤러리에 닿는다는 것, 끄는 방법을 사용자에게 분명히 설명하라고 했어요. 이미 동의한 사람에게도 기능을 기본으로 꺼 두라고 했고요. 2026년에 새로 나온, 갤러리 내용을 클라우드에서 처리하는 기능은 따로 살펴볼 수 있다고도 밝혔어요.
  - `p16` “Within 60 days, Meta must:”
  - `p17` “- request consent through a separate and specific request for the feature and clearly explain to users what it is for, that it involves access to the gallery, and how to disable it;”
  - `p18` “- keep the feature switched off by default, even for those who have already given consent.”
  - `p15` “The Authority reserves the right to separately assess the new feature, launched in 2026, that allows cloud processing of gallery content.”

## 5. 구절 — 쓴 구절 20 / 문서의 구절 28 (전부 git 에 있는 문서의 글자 그대로 — 계약 검증이 댔다)
- 문서 `GPDP-10321080` Garante per la protezione dei dati personali (이탈리아 개인정보 감독기구) 보도자료 「The Garante has fined Meta Platforms Ireland Limited 805 million euros」 — 영어판에서 발췌 (2026-11-14 · Doc-Web 10321080 · 2026-11-15 에 봄 · https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10321080) · garanteprivacy.it · 공개 2026-11-14
  - `p01` “The Garante has fined Meta Platforms Ireland Limited 805 million euros”
  - `p02` “The Italian Data Protection Authority (Garante) has fined Meta Platforms Ireland Limited €805 million.”
  - `p03` “Through the Facebook app for Android devices, the company accessed photos, videos, and related metadata stored on Italian users' smartphones without obtaining specific consent and without properly informing them.”
  - `p04` “The measure concerns the 'Get tips from your gallery while browsing Facebook' feature, available since 2023, which, while browsing, shows users photos and videos from their phone gallery as suggestions to post.”
  - `p05` “The investigation was launched in July 2025 following a complaint by the Bolzano Consumer Protection Centre and was based on a technical analysis conducted by the Authority.”
  - `p06` “The checks revealed that:”
  - `p07` “- access to the gallery is requested through a single permission, valid for the entire app and for several functions serving different purposes;”
  - `p08` “- the authorisation is preceded by a generic notice ("enable other features") that does not allow users to understand that they are also authorising gallery suggestions;”
  - `p09` “- furthermore, the feature was enabled by default.”
  - `p10` “If fully granted, such authorisation allows the app to read the entire photo archive on the device, on an ongoing basis, without the user or the Authority being able to verify what information is actually being used.”
  - `p11` “The Authority recalled that the infringed provision, Article 122 of the Privacy Code implementing the European ePrivacy Directive, protects the smartphone as part of a person's private sphere.”
  - `p12` “Any access to the information it contains therefore requires free and informed consent, regardless of whether the data is transmitted or any harm occurs.”
  - `p14` “The procedure did not concern the potential use of content to train artificial intelligence, which Meta denies.”
  - `p15` “The Authority reserves the right to separately assess the new feature, launched in 2026, that allows cloud processing of gallery content.”
  - `p16` “Within 60 days, Meta must:”
  - `p17` “- request consent through a separate and specific request for the feature and clearly explain to users what it is for, that it involves access to the gallery, and how to disable it;”
  - `p18` “- keep the feature switched off by default, even for those who have already given consent.”
  - `p21` “In determining the amount of the fine, the Authority took into account:”
  - `p22` “- the high number of people involved (around 20 million Android users in Italy);”
  - `p28` “Rome, 14 November 2026”

## 6. 함의 — 위험한 글마다 (Opus)
- `cover.dek` [숫자 · 고친 글] **ENTAILED**
- `cover.meta` [숫자] **ENTAILED**
- `entry.breaker` [기관의 판단] **ENTAILED**
- `where.body[0]` [숫자 · 인과 · 고친 글] **ENTAILED**
- `where.body[1]` [숫자] **ENTAILED**
- `entry.flip_note` [한글 수 · 기관의 판단 · 인과] **ENTAILED**
- `why.lead` [한글 수] **ENTAILED**
- `why.real[0].body` [기관의 판단] **ENTAILED**
- `why.real[1].body` [기관의 판단] **ENTAILED**
- `why.real[2].body` [한글 수 · 기관의 판단] **ENTAILED**
- `why.verdict` [숫자 · 기관의 판단 · 인과] **ENTAILED**
- `keep.advice` [숫자 · 기관의 판단 · 인과] **ENTAILED**
- 위험하지 않아 건너뛴 글 (근거는 있다): -

## 고친 글 6
- `cover.dek` (고치기 1 · fix)
  - 앞: 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 안드로이드용 페이스북 앱이 이탈리아 사용자의 폰 안 사진과 영상에 닿은 일 때문이에요.
  - 뒤: 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았기 때문이에요.
  - 원문의 단서인 '구체적 동의 없이, 제대로 알리지 않고'를 되살려 접근 자체만으로 과징금이 매겨진 것처럼 읽히지 않게 했어요.
- `where.body[0]` (고치기 1 · fix)
  - 앞: 페이스북 앱에는 2023년부터 ‘갤러리에서 추천 받기’라는 기능이 있었어요. 페이스북을 보는 동안, 내 폰 갤러리에 있는 사진과 영상을 “이거 올려 볼래요?” 하듯 추천으로 보여 주는 기능이에요.
  - 뒤: 안드로이드용 페이스북 앱에는 2023년부터 ‘갤러리에서 추천 받기’라는 기능이 있었어요. 페이스북을 보는 동안, 내 폰 갤러리에 있는 사진과 영상을 “이거 올려 볼래요?” 하듯 추천으로 보여 주는 기능이에요.
  - 원문이 안드로이드용 페이스북 앱에 한정하므로 '안드로이드용'을 더하고, 그 한정을 받치는 p03을 근거에 붙였어요.
- `cover.dek` (고치기 2 · fix)
  - 앞: 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았기 때문이에요.
  - 뒤: 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 감독기구는 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았다고 밝혔어요.
  - 구절은 과징금과 접근 사실을 나란히 적을 뿐 인과로 잇지 않으므로, '때문이에요'를 빼고 감독기구가 밝힌 사실로 나란히 적었다.
- `entry.flip_a` (사람 · fix)
  - 앞: “큰 과징금을 받은 까닭”
  - 뒤: “사진을 가져다 써서 받은 과징금”
  - 사람: 앞쪽 말이 "까닭"이라는 빈 낱말이라 독자의 짐작이 서지 않음 — 짐작 그대로를 한 마디로
- `entry.flip_b` (사람 · fix)
  - 앞: “사진을 가져다 썼다”
  - 뒤: “허락 없이 폰 안에 닿아서 받은 과징금”
  - 사람: 뒤쪽도 같은 꼴로 맞춰 두 말이 바로 맞서게 (문서 p03 · p12)
- `keep.title` (사람 · fix)
  - 앞: 작은 뒤집기 하나가 남았어요
  - 뒤: 폰 안은 사적인 영역이에요
  - 사람: "작은 뒤집기 하나가 남았어요"는 손 견본 (영훈) 글자 그대로 — 이 사건의 말로 (문서 p11 "protects the smartphone as part of a person's private sphere")

## 7. 사람 칸 — 무게 · 사망 · 선반 · 곁 이야기
- 무게 (`weight_ok`): 모델의 제안 **short** — 뒤집기가 하나 (가져다 썼느냐가 아니라 닿기 전의 허락)이고 문서가 글자로 받치며, 눌러 볼 차례가 없다.
- 사망 (`death_checked`): 모델의 제안 **false** (사람이 숨진 사건이면 짧은 이야기로 낼 수 없다 — EPISODE §13.6)
- 선반 (`series_ok`): 「내 정보는 누가 지키나」 (privacy) — 작업 세션의 제안이다. 이미 있는 선반에 놓을지 · 새 선반의 이름을 사람이 정한다
- 곁 이야기: **없음 (홀로 선 짧은 이야기)** — 같은 사건의 긴 이야기가 없다
- 가리킨 도구: **없음** — 도구 카드 · 지도가 없다. 개념은 글 안에서 풀었다 · 모델이 적은 개념 (도구 후보): 구체적 동의 (기능마다 따로 받는 허락) · 기본 켜짐 (기본 설정) · 원스톱숍 (관할을 한 나라 기구로 모으는 장치) — 문서가 이름만 말한다

## 8. 통독 (맛) — 화면의 차례대로
- **표지 · 제목** 사진 때문에 수억 유로라는데, 사진을 가져간 걸까
- **표지 · 한 줄** 이탈리아 개인정보 감독기구가 메타 플랫폼스 아일랜드에 8억 500만 유로의 과징금을 매겼어요. 감독기구는 안드로이드용 페이스북 앱이 따로 동의를 받지도, 제대로 알리지도 않고 이탈리아 사용자의 폰 안 사진과 영상에 닿았다고 밝혔어요. ← p01 p02 p03
- **표지 · 날** 2026년 11월 14일 발표 · 로마 ← p28
- **표지 · 귀띔** 발표 하나를 놓고 짧게 볼게요.
- **Q** 내 사진을 가져가 AI에 쓴 건가요?
- **어디가 (무슨 일인가) · 머리** 문제가 된 건 허락 없이 닿은 것이었어요
- **이렇게 생각하기 쉬워요** 사진 때문에 이렇게 큰 과징금이라면, 내 사진을 몰래 가져가 AI 학습에라도 썼겠구나 싶어요.
- **그런데 문서에는** 그런데 문서에는 이번 절차가 사진을 AI 학습에 쓰는 문제를 다루지 않았다고 적혀 있어요. 기구가 문제 삼은 건, 앱이 폰 안의 사진과 영상에 **따로 동의를 받지 않고 닿았다**는 것이에요. ← p14 p03
- **아래 글 1** 안드로이드용 페이스북 앱에는 2023년부터 ‘갤러리에서 추천 받기’라는 기능이 있었어요. 페이스북을 보는 동안, 내 폰 갤러리에 있는 사진과 영상을 “이거 올려 볼래요?” 하듯 추천으로 보여 주는 기능이에요. ← p03 p04
- **아래 글 2** 조사는 2025년 7월에 시작됐어요. 볼차노 소비자보호센터가 민원을 냈고, 기구가 직접 기술 분석을 했어요. ← p05
- **뒤집기** **“사진을 가져다 써서 받은 과징금” ≠ “허락 없이 폰 안에 닿아서 받은 과징금”**
- **뒤집기의 풀이** 기구는 메타가 어긴 조항이 스마트폰을 한 사람의 사적인 영역의 일부로 보호한다고 짚었어요. 그래서 폰 안의 정보에 닿는 것은 어떤 경우든, 자료가 전송됐는지나 피해가 생겼는지와 상관없이 **자유롭게, 충분히 알고 한 동의**가 있어야 한다고 했어요. ← p11 p12
- **문서에 없는 것** 사진이 회사 쪽으로 넘어갔는지, AI 학습에 쓰였는지는 이 문서에 없어요. 문서는 이번 절차가 그 문제를 다루지 않았고 메타는 부인한다고만 적었어요. 그래서 여기서도 어느 쪽으로도 말하지 않을게요.
- **Q** 허락은 받지 않았나요?
- **문서가 말한 것 · 머리** 허락을 받긴 했는데, 무엇을 허락하는지 알 수 없었어요
- **이끄는 글** 기구가 들여다본 건 허락을 어떻게 받았느냐였어요. 점검에서 드러난 것은 세 가지예요. ← p05 p06 p07 p08 p09
- **감독기구가 짚은 것 1** **허락 하나에 다 묶였어요** — 갤러리에 닿는 허락을 권한 하나로 받았어요. 그 권한 하나가 앱 전체에, 목적이 서로 다른 여러 기능에 함께 통했고요. ← p07
- **감독기구가 짚은 것 2** **안내가 두루뭉술했어요** — 허락을 받기 전에 나온 안내는 “다른 기능 켜기”라는 일반적인 말이었어요. 기구는 이 안내로는 사용자가 갤러리 추천까지 허락한다는 것을 알 수 없다고 봤어요. ← p08
- **감독기구가 짚은 것 3** **처음부터 켜져 있었어요** — 이 기능은 기본으로 켜져 있었어요. 허락을 전부 주면 앱이 기기의 사진 보관함 전체를 계속 읽을 수 있어요. 그런데 실제로 어떤 정보가 쓰이는지는 사용자도 기구도 확인할 수 없다고 했어요. ← p09 p10
- **판정** 기구는 메타가 구체적인 동의를 받지 않았고 제대로 알리지도 않았다고 보고, 8억 500만 유로의 과징금을 매겼어요. 60일 안에 이 기능만을 위한 **별도의 동의**를 받고, 기능을 기본으로 꺼 두라고도 했어요. 금액을 정할 때는 이탈리아의 안드로이드 사용자 약 2,000만 명이 관련됐다는 점 등을 고려했다고 해요. ← p02 p03 p16 p17 p18 p21 p22
- **누구의 말** 여기까지는 **이탈리아 개인정보 감독기구의 판단**이에요. 메타의 말은 기구가 문서에 옮겨 적은 것만 있어요. 관할이 아일랜드 기구에 있다고 이의를 냈다는 것, AI 학습 이용을 부인한다는 것이에요. 메타가 직접 낸 입장은 우리가 확인한 문서에 없어서 싣지 않았어요.
- **Q** 그래서 무엇이 남나요?
- **남음 · 머리** 폰 안은 사적인 영역이에요
- **남는 한 줄** 이 과징금의 까닭은 가져다 썼느냐가 아니었다. 기구가 물은 것은 폰 안에 닿기 전의 허락이었다.
- **감독기구의 말** 기구는 메타에 이 기능이 무엇을 위한 것인지, 갤러리에 닿는다는 것, 끄는 방법을 사용자에게 분명히 설명하라고 했어요. 이미 동의한 사람에게도 기능을 기본으로 꺼 두라고 했고요. 2026년에 새로 나온, 갤러리 내용을 클라우드에서 처리하는 기능은 따로 살펴볼 수 있다고도 밝혔어요. ← p16 p17 p18 p15
- 기계가 센 것 — 세 문장을 넘는 덩이 1: entry.whose (4)
- 기계가 센 것 — 독자 글 덩이 19 · 빈칸 뺀 글자 1215 (손 견본 영훈: 덩이 18 · 글자 875)
- 볼 것: 수수께끼가 걸리나 · 같은 말이 되풀이되나 · 관청의 말이 남았나 · 맺음이 “없어요”로 끝나나 · 손 견본 (영훈)의 결인가

## human.json 에 적을 것
```json
{
  "ok": false,
  "by": "",
  "minutes": 0,
  "flip_ok": false,
  "not_drawn_ok": false,
  "weight_ok": false,
  "series_ok": false,
  "death_checked": false,
  "edits": [
    {
      "id": "",
      "t": "",
      "why": ""
    }
  ],
  "drops": [],
  "note": ""
}
```
지금 상태: 낼 수 있나 = **true** (계약 통과 · 막힘 0 · 함의 못 본 글 0 · 사람 확인 넘김)
