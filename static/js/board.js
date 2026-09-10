// 게시판 페이지 전용 코드

// common.js 가 로그인 확인을 끝낸 뒤 이 함수를 자동으로 불러줍니다.
function onAuthReady() {
  loadPosts();
}

async function loadPosts() {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("읽기 실패:", error);
    return;
  }

  document.getElementById("list").innerHTML = data
    .map(function (p) {
      const isMine = currentUser && p.user_id === currentUser.id;
      const del = isMine
        ? '<button onclick="deletePost(' + p.id + ')">삭제</button>'
        : "";
      return "<li><strong>" + p.nickname + "</strong> " + p.content + " " + del + "</li>";
    })
    .join("");
}

async function addPost() {
  const box = document.getElementById("content");
  const content = box.value.trim();
  if (!content) return;

  const { error } = await db.from("posts").insert({
    content: content,
    nickname: currentUser.email.split("@")[0],
  });

  if (error) {
    console.error("쓰기 실패:", error);
    alert("쓰기 실패: " + error.message);
    return;
  }

  box.value = "";
  loadPosts();
}

async function deletePost(id) {
  const { error } = await db.from("posts").delete().eq("id", id);

  if (error) {
    console.error("삭제 실패:", error);
    return;
  }
  loadPosts();
}

// AI 부르기. askAI 함수는 common.js 에 있음
async function polish() {
  const content = document.getElementById("content").value.trim();
  if (!content) return;

  const btn = document.getElementById("aiBtn");
  const box = document.getElementById("aiBox");

  // 응답까지 몇 초 걸리는 것 표시
  btn.disabled = true;
  box.textContent = "생각하는 중...";

  try {
    box.textContent = await askAI(
      "다음 문장을 더 재미있게 다듬어줘. 한 문장으로만 답해줘: " + content
    );
  } catch (e) {
    // Live Server 로 열면 /api/ai 가 없어서 여기로 옴
    box.textContent = "AI 기능은 vercel dev 또는 배포된 주소에서만 동작합니다.";
  } finally {
    btn.disabled = false;
  }
}
