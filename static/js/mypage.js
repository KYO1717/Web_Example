// 과거 기록 페이지 전용 코드

function onAuthReady() {
  document.getElementById("myEmail").textContent = currentUser.email;
  loadGameHistory();
}

function loadGameHistory() {
  const historyKey = "archive-game-history-" + currentUser.id;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  } catch (error) {
    console.error("기록 읽기 실패:", error);
  }

  document.getElementById("historyCount").textContent = history.length;
  const list = document.getElementById("historyList");
  if (history.length === 0) {
    list.innerHTML = '<li class="muted">아직 완료한 플레이 기록이 없습니다.</li>';
    return;
  }

  list.innerHTML = history.map(function (result) {
    const status = result.won ? "기록 완료" : "기록 중단";
    const statusClass = result.won ? "history-win" : "history-loss";
    const when = new Date(result.playedAt).toLocaleString("ko-KR");
    const relics = result.relics || [];
    const relicText = relics.length > 0 ? relics.join(", ") : "없음";
    return '<li class="history-item ' + statusClass + '">' +
      '<strong>' + status + "</strong>" +
      '<span class="history-message">' + result.message + "</span>" +
      '<span class="history-stats">' + result.floor + "층 도달 · HP " + result.hp + " / " + result.maxHp + " · " + result.gold + "G</span>" +
      '<span class="history-relics">기록물: ' + relicText + "</span>" +
      '<span class="when">' + when + "</span></li>";
  }).join("");
}
