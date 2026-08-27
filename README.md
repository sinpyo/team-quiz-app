# 단체 게임 퀴즈

친구들끼리 모여서 하는 팀 대항 퀴즈입니다. 화면에 띄워놓고 키보드로 넘기면 됩니다.
기본 문제집에 16개 라운드, 127문제가 들어 있습니다.

카카오로 들어와서 **내 문제집**을 만들고, 링크로 나눠주되,
**보는 사람은 못 고치고 고칠 사람만 따로 초대**합니다.

> 로그인 없이 쓰던 예전 판은 [sinpyo/team-quiz](https://github.com/sinpyo/team-quiz) 에 그대로 있습니다.

---

## 화면

| 주소 | 하는 일 | 로그인 |
|---|---|---|
| `/` | 내 문제집 목록 (로그인 전에는 소개) | 아니오 |
| `/play/demo` | 기본 문제집으로 바로 진행 | 아니오 |
| `/play/<보기값>` | 나눠받은 문제집으로 진행 · **고치기 없음** | 아니오 |
| `/edit/<문제집>` | 문제 고치기 | 주인 또는 편집자 |
| `/share/<문제집>` | 보기 링크 · 편집 초대 · 편집자 관리 | 주인만 |
| `/invite/<초대값>` | 편집 초대 받기 | 필요 |

**보기와 편집은 아예 다른 길입니다.** 보기 링크에는 22자 무작위 값이 들어 있어
그 값을 아는 사람만 열 수 있고, 열어도 고칠 수는 없습니다. 대신 `📄 내 문제집으로 복사`
로 자기 계정에 사본을 만들면 그때부터 마음껏 고칠 수 있습니다 — **원본은 안 바뀝니다.**

권한은 전부 서버에서 확인합니다(`lib/perm.ts`). 화면에서 단추를 감추는 것은 보기
좋으라고 하는 것일 뿐이라, `/edit/<남의문제집>` 을 주소창에 직접 쳐도 막힙니다.

---

## 진행하는 법

노트북을 TV나 빔에 연결하고 링크를 연 다음, `F`를 눌러 전체화면으로 만드세요.

| 키 | 하는 일 |
|---|---|
| `→` `Space` | 정답 공개 → 다음 화면 |
| `←` | 정답 다시 덮기 → 이전 화면 |
| `[` `]` | 라운드 통째로 건너뛰기 |
| `P` | 노래 재생 · 멈춤 |
| `F` | 전체화면 |
| `M` | 라운드 이동 메뉴 |
| `E` | 문제 고치기 (고칠 수 있는 사람만) |

팀 이름과 점수는 **각자 브라우저에** 저장됩니다. 서버에 올리지 않습니다.
한 번 연 퀴즈는 브라우저가 받아 두므로, **모임 자리에서 인터넷이 끊겨도** 같은 링크로 열립니다.

`Ctrl+P` (맥은 `⌘P`) 를 누르면 한 화면이 한 장씩, 정답까지 다 보이게
**가로 A4 150쪽**으로 나옵니다. 진행자용 대본으로 쓰기 좋습니다.

---

## 돌려보기

```bash
npm install
cp .env.example .env.local     # 값을 채우세요
npx drizzle-kit migrate        # 표 만들기
npm run dev                    # http://localhost:3000
```

카카오 키가 아직 없다면 `.env.local` 에 `DEV_FAKE_LOGIN=1` 을 넣으세요.
`/api/auth/dev?who=이름` 으로 로그인한 셈 치고 나머지를 다 써볼 수 있습니다.
이 길은 **올려둔 곳에서는 아예 없습니다.**

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 고치면서 보기 |
| `npm run build` | 올릴 것 만들기 |
| `npm run typecheck` | 타입만 검사 |
| `npx drizzle-kit generate` | 표 모양이 바뀌면 SQL 만들기 |
| `npx drizzle-kit migrate` | 그 SQL 을 데이터베이스에 적용 |

### 처음 한 번 준비할 것

1. **카카오 개발자** — 앱 만들기 → 카카오 로그인 켜기 → 동의항목에 **닉네임·프로필사진**
   (이메일은 비즈 앱이라야 받을 수 있는데, 이 앱에는 필요 없습니다) →
   Redirect URI 두 개 등록:
   `http://localhost:3000/api/auth/callback` · `https://<올린주소>/api/auth/callback`
2. **Neon** — 프로젝트를 만들고 연결 문자열을 `DATABASE_URL` 에
3. **Vercel** — 이 저장소를 연결하고 환경변수 다섯 개를 넣기

---

## 짜임새

```
app/
  base.css                색과 글꼴 — 모든 화면
  globals.css             퀴즈 화면 (인쇄 규칙 포함 — 손대지 마세요)
  ui.css                  목록 · 공유 · 초대  (.page 안쪽에만 걸립니다)
  editor.css              문제 고치기        (.ed 안쪽에만 걸립니다)
  page.tsx                내 문제집 / 소개
  play/demo · play/[token] · edit/[packId] · share/[packId] · invite/[token]
  api/auth/{kakao,callback,logout,dev}
  api/packs · api/packs/[id] · api/packs/copy
  api/packs/[id]/invites · api/packs/[id]/editors/[userId] · api/invites/[token]
components/
  deck/                   퀴즈 화면
  editor/                 문제 고치기
  PackList · SharePanel · AcceptInvite
lib/
  types · defaultPack · buildSlides · pack · storage · ids
  db · schema · auth · perm · site
public/art/               앨범 사진 · public/sw.js  인터넷 없이 볼 수 있게 받아두는 일꾼
drizzle/                  표를 만드는 SQL
```

### 손대면 안 되는 곳

퀴즈 화면은 예전 `team-quiz` 의 손으로 쓴 HTML 을 React 로 옮긴 것입니다.

- **150장을 전부 그려 둡니다.** 지금 장만 `.on` 이 붙어 보입니다.
  지금 장만 그리면 `Ctrl+P` 가 한 장만 뽑힙니다
- **`globals.css` 맨 아래 `@media print`** — A4 가로 · 쪽나눔 · 인쇄 때 정답과
  앨범 사진을 강제로 펼치는 규칙입니다
- **유튜브 재생기는 `YouTubeBar` 안에만** 둡니다. 재생 시간이 흐를 때마다
  150장이 다시 그려지지 않게 하려는 것입니다

옮긴 뒤 원본과 대조했습니다 — 인쇄 **150쪽**, 그중 149쪽은 글자까지 완전히 같고,
1쪽(표지)만 `E 문제 고치기` 안내가 빠졌습니다(보기 전용이라 의도한 차이입니다).

### 문제집

`lib/defaultPack.ts` 가 기본 문제집이고, 사람이 만든 문제집은 `packs.data` 에
같은 모양으로 들어갑니다. 예전 `pack.js` 와 모양이 같아서 그때 내보낸 `.json` 을
그대로 불러올 수 있습니다. 밖에서 들어온 문제집은 저장 전에 반드시
`lib/pack.ts` 의 `sanitizePack()` 을 지나갑니다.

문제마다 붙어 있는 `id` 는 점수가 엉뚱한 문제에 붙지 않게 하는 이름표라서
건드리지 마세요. 남의 문제집을 복사할 때는 이름표를 새로 붙여서,
그 사람 점수가 따라오지 않게 합니다.
