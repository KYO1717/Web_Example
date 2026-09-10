// 홈페이지 전용 코드
// common.js 가 로그인 상태를 확인한 뒤 이 함수를 자동으로 불러줍니다.

function onAuthReady() {
  const loginBox = document.getElementById("loginBox");
  const welcomeBox = document.getElementById("welcomeBox");

  if (currentUser) {
    loginBox.hidden = true;
    welcomeBox.hidden = false;
    document.getElementById("hello").textContent =
      currentUser.email.split("@")[0] + "님, 안녕하세요!";
  } else {
    loginBox.hidden = false;
    welcomeBox.hidden = true;
  }
}
