# 프로젝트 구조 안내

```
my-project/
│
├─ index.html                 홈 (로그인 화면)
│
├─ pages/                     ★ 새 페이지는 전부 여기에
│  ├─ board.html                게시판
│  ├─ mypage.html               내 정보
│  └─ _새페이지_템플릿.html      복사해서 쓰는 빈 페이지
│
├─ assets/                    ★ 화면에 쓰는 재료는 전부 여기에
│  ├─ css/
│  │  └─ style.css              공용 디자인 (모든 페이지가 함께 씀)
│  ├─ js/
│  │  ├─ common.js              연결·로그인·메뉴 (모든 페이지가 함께 씀)
│  │  ├─ home.js                홈 전용
│  │  ├─ board.js               게시판 전용
│  │  └─ mypage.js              내 정보 전용
│  └─ img/
│     └─ logo.svg               이미지는 여기에 넣기
│
├─ api/
│  └─ ai.js                  서버 함수 (브라우저로 안 내려감. API 키가 있는 곳)
│
├─ .gitignore                깃에 올리지 않을 파일 목록
├─ .env.example              필요한 키 이름 견본 (올라가도 안전)
└─ .env.local                진짜 키 ★ 직접 만들어야 하고, 깃에 안 올라갑니다
```

## 키를 두는 곳

| 장소 | 누가 볼 수 있나 | 여기에 둘 것 |
|---|---|---|
| `index.html`, `assets/` | **전 세계** | Supabase Publishable key |
| GitHub 저장소 | 저장소를 볼 수 있는 사람 | 코드만. 키는 없음 |
| `.env.local` (내 컴퓨터) | 나만 | Groq 키 |
| Vercel 환경변수 | 나만 | Groq 키 (같은 값) |

`.env.local` 은 깃에 안 올라가므로 **Vercel에는 따로 등록해야 합니다.**
Settings → Environment Variables 에 넣고 **Redeploy** 까지 해야 반영됩니다.

Supabase 키를 안 숨기는 건 실수가 아닙니다. 공개를 전제로 만들어진 키이고,
권한은 DB의 RLS 정책이 따로 막습니다.

## 규칙 1 — 주소는 항상 `/` 로 시작

```html
<!-- 맞음 -->
<link rel="stylesheet" href="/assets/css/style.css">
<script src="/assets/js/common.js"></script>
<img src="/assets/img/logo.svg">

<!-- 틀림 -->
<link rel="stylesheet" href="assets/css/style.css">
<script src="../assets/js/common.js"></script>
```

`/` 없이 쓰면 `index.html`에서는 되는데 `pages/board.html`에서는 깨집니다.
폴더 깊이가 달라지기 때문입니다.
**`/` 로 시작하면 어느 폴더에서든 똑같이 동작합니다.**

## 규칙 2 — 페이지마다 JS 파일 하나

`common.js` 는 모두가 함께 쓰고, 각 페이지는 자기 JS만 추가로 부릅니다.

한 파일에 다 넣지 마세요. 나눠두면 Copilot에게
"board.js의 addPost 함수 고쳐줘"처럼 좁게 지시할 수 있어서 **크레딧이 훨씬 덜 듭니다.**

## 규칙 3 — `onAuthReady()` 안에서 시작

로그인 확인이 끝나면 `common.js` 가 이 함수를 자동으로 불러줍니다.

```js
function onAuthReady() {
  // 여기서부터 currentUser, db, askAI 를 쓸 수 있습니다.
}
```

로그인 확인 전에 DB를 부르면 내 정보가 아직 없어서 실패합니다.

---

# 새 페이지 만드는 법 (4단계)

**1.** `pages/_새페이지_템플릿.html` 을 복사해서 새 이름으로 저장
```
pages/gallery.html
```

**2.** `assets/js/gallery.js` 를 만들고 안에 이렇게 씁니다
```js
function onAuthReady() {
  // 여기에 이 페이지가 할 일
}
```

**3.** `gallery.html` 맨 아래 script 주소를 바꿉니다
```html
<script src="/assets/js/gallery.js"></script>
```

**4.** `assets/js/common.js` 의 `MENU` 에 한 줄 추가
```js
{ name: "갤러리", url: "/pages/gallery.html" },
```

메뉴, 로그인 유지, DB 연결, AI 호출이 전부 그대로 따라옵니다.

---

# 바로 쓸 수 있는 것들

`common.js` 를 부른 페이지라면 어디서든 씁니다.

| 이름 | 하는 일 |
|---|---|
| `db` | Supabase. `db.from("posts").select("*")` 처럼 사용 |
| `currentUser` | 지금 로그인한 사람. `currentUser.email`, `currentUser.id` |
| `askAI(프롬프트)` | AI에게 물어보기. `await askAI("...")` |
| `signOut()` | 로그아웃 |

```js
// 예시
async function onAuthReady() {
  const { data, error } = await db.from("posts").select("*");
  if (error) { console.error(error); return; }

  const 요약 = await askAI("이 글들을 한 줄로 요약해줘: " + JSON.stringify(data));
  console.log(요약);
}
```

---

# 자주 나는 문제

| 증상 | 원인 |
|---|---|
| 새 페이지에서 디자인이 다 깨짐 | 주소에 `/` 를 안 붙임 (규칙 1) |
| `supabase is not defined` | CDN script 가 common.js 뒤에 있음 |
| `currentUser is null` | `onAuthReady()` 밖에서 코드를 실행함 (규칙 3) |
| 새 페이지가 메뉴에 안 보임 | `common.js` 의 `MENU` 에 안 넣음 |
| 커밋했는데 화면이 그대로 | 브라우저 캐시. `Ctrl+Shift+R` |
| AI만 404 | Live Server로 열었음. 배포 주소나 `vercel dev` 에서 확인 |

> **참고:** Git은 빈 폴더를 저장하지 않습니다.
> `assets/img/` 에 파일이 하나도 없으면 GitHub에 폴더가 안 올라갑니다.
> `logo.svg` 를 지우지 말고 두세요.
