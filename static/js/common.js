// =========================================================
// 모든 페이지가 함께 쓰는 파일
// 새 페이지를 만들어도 이 파일만 불러오면 로그인과 메뉴가 그대로 이어집니다.
// =========================================================

// ---------------------------------------------------------
// 1. Supabase 연결
// ---------------------------------------------------------
// Supabase 대시보드 > Settings > API Keys 에서 복사해오시면 돼요
// 이 두 값은 공개돼도 ㄱㅊ음
const SUPABASE_URL = "⭐⭐⭐ 본인 걸로 바꿔주기";
const SUPABASE_KEY = "⭐⭐⭐ 본인 걸로 바꿔주기";

// (*참고 : CDN이 supabase 라는 이름을 이미 쓰고 있으믐로 우리가 만드는 것은 db 라고 부를 예정)

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 지금 로그인한 사람 (로그인 안 했으면 null)
let currentUser = null;

// ---------------------------------------------------------
// 2. 메뉴  ★ 만약 새 페이지 만들게 되시면 여기에 한 줄만 추가하주세요!!!!! ★
// ---------------------------------------------------------

const MENU = [
  { name: "홈", url: "/index.html" },
  { name: "게시판", url: "/pages/board.html" },
  { name: "내 정보", url: "/pages/mypage.html" },
];

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const here = location.pathname;

  const links = MENU.map(function (m) {
    const isHere = here === m.url || (m.url === "/index.html" && here === "/");
    return '<a href="' + m.url + '"' + (isHere ? ' class="on"' : "") + ">" + m.name + "</a>";
  }).join("");

  const me = currentUser
    ? "<span>" + currentUser.email + "</span>" +
      ' <button onclick="signOut()">로그아웃</button>'
    : '<a href="/index.html">로그인</a>';

  nav.innerHTML = '<div class="menu">' + links + "</div>" +
                  '<div class="me">' + me + "</div>";
}

// ---------------------------------------------------------
// 3. 로그인 / 회원가입
// ---------------------------------------------------------

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await db.auth.signUp({ email, password });

  if (error) {
    console.error("가입 실패:", error);
    alert("가입 실패: " + error.message);
    return;
  }
  alert("가입 완료! 바로 로그인됩니다.");
}

async function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("로그인 실패:", error);
    alert("로그인 실패: " + error.message);
  }
}

async function signOut() {
  await db.auth.signOut();
  location.href = "/index.html";
}

// ---------------------------------------------------------
// 4. 로그인 상태가 바뀔 때마다 자동 실행
// ---------------------------------------------------------
// 페이지를 처음 열 때도 한 번 실행되므로, 새로고침해도 로그인 유지됨
//
// ★★ 아래 pageReady를 지우면 로그인 화면 안뜨니까 꼭 남겨두기 ★★
//
// Supabase 는 첫 신호(INITIAL_SESSION)를 아주 빨리 보내서, 
// 이 파일 다음 줄에서 불러오는 페이지 전용 파일(home.js, board.js ...) 실행되기 전에 아래 콜백이 먼저 도는 일 발생
// 그러면 onAuthReady 아직 없어서 화면이 텅 빈 채로 남고, 페이지 스크립트가 모두 준비된 뒤에 실행되도록 한 번 기다리게 함

const pageReady = new Promise(function (resolve) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resolve);
  } else {
    resolve();
  }
});

db.auth.onAuthStateChange(function (event, session) {
  currentUser = session ? session.user : null;

  pageReady.then(function () {
    renderNav();

    // <body data-require-auth="true"> 인 페이지는 로그인 안 하면 홈으로 보냅니다.
    if (!currentUser && document.body.dataset.requireAuth === "true") {
      location.href = "/index.html";
      return;
    }

    // 각 페이지가 만들어 둔 준비 함수를 실행합니다.
    // 새 페이지에서도 onAuthReady 만 만들면 알아서 불립니다.
    if (typeof onAuthReady === "function") {
      onAuthReady();
    } else {
      // 있어야 할 함수가 없으면 조용히 넘어가지 말고 알려줍니다.
      console.warn(
        "onAuthReady 가 없습니다. 이 페이지의 전용 js(home.js, board.js ...)가 " +
        "제대로 불렸는지 확인하세요."
      );
    }
  });
});

// ---------------------------------------------------------
// 5. AI 부르기 (어느 페이지에서든 사용 가능)
// ---------------------------------------------------------
// 여기서 Groq를 직접 부르지 않는 것이 핵심입니다.
// 같은 사이트의 /api/ai 로만 요청하고, API 키는 서버에만 있습니다.

async function askAI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("AI 호출 실패:", res.status, data.error);
    throw new Error(data.error);
  }
  return data.text;
}