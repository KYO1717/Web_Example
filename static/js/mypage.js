// 내 정보 페이지 전용 코드

function onAuthReady() {
  document.getElementById("myEmail").textContent = currentUser.email;
  loadMyPosts();
}

async function loadMyPosts() {
  // eq 로 조건을 걸어서 내 글만 가져옵니다.
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("읽기 실패:", error);
    return;
  }

  document.getElementById("myCount").textContent = data.length;

  document.getElementById("myList").innerHTML = data
    .map(function (p) {
      const when = new Date(p.created_at).toLocaleString("ko-KR");
      return (
        "<li>" + p.content +
        '<span class="when">' + when + "</span>" +
        '<button onclick="deletePost(' + p.id + ')">삭제</button></li>'
      );
    })
    .join("");
}

async function deletePost(id) {
  const { error } = await db.from("posts").delete().eq("id", id);

  if (error) {
    console.error("삭제 실패:", error);
    return;
  }
  loadMyPosts();
}
