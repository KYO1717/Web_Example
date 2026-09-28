const tutorialState = {
  step: 0,
  routeChoice: null,
  fusionSelected: [],
  fused: false,
  battle: null,
};

function onAuthReady() {}

function showTutorialStep(step) {
  tutorialState.step = Math.max(0, Math.min(4, step));
  document.querySelectorAll("[data-tutorial-step]").forEach(function (slide) {
    const active = Number(slide.dataset.tutorialStep) === tutorialState.step;
    slide.hidden = !active;
    slide.classList.toggle("active", active);
  });
  document.querySelectorAll("[data-step-target]").forEach(function (button) {
    const active = Number(button.dataset.stepTarget) === tutorialState.step;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "step" : "false");
  });
  document.getElementById("tutorialStepLabel").textContent = (tutorialState.step + 1) + " / 5";
  document.getElementById("tutorialProgressFill").style.width = ((tutorialState.step + 1) / 5 * 100) + "%";
  document.getElementById("tutorialBack").disabled = tutorialState.step === 0;
  document.getElementById("tutorialNext").textContent = tutorialState.step === 4 ? "모험 시작 ⚔️" : tutorialState.step === 0 ? "시작하기 →" : "다음 단계 →";
  document.getElementById("tutorialNext").disabled = tutorialState.step === 1 && !tutorialState.routeChoice;
  if (tutorialState.step === 2 && !tutorialState.battle) resetTutorialBattle();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetTutorialBattle() {
  tutorialState.battle = {
    playerHp: 20,
    maxPlayerHp: 20,
    enemyHp: 18,
    maxEnemyHp: 18,
    block: 0,
    enemyBlock: 0,
    actions: 2,
    turn: "player",
    intent: "attack",
    enemyTurn: 0,
    poisonDamage: 0,
    poisonTurns: 0,
    busy: false,
  };
  document.getElementById("tutorialBattleLog").textContent = "카드를 골라 연습해 보세요. 두 번 행동하면 몬스터가 반격합니다.";
  renderTutorialBattle();
}

function renderTutorialBattle() {
  const battle = tutorialState.battle;
  if (!battle) return;
  document.getElementById("tutorialPlayerHp").textContent = battle.playerHp + " / " + battle.maxPlayerHp;
  document.getElementById("tutorialEnemyHp").textContent = Math.max(0, battle.enemyHp) + " / " + battle.maxEnemyHp;
  document.getElementById("tutorialPlayerBar").style.width = Math.max(0, battle.playerHp / battle.maxPlayerHp * 100) + "%";
  document.getElementById("tutorialEnemyBar").style.width = Math.max(0, battle.enemyHp / battle.maxEnemyHp * 100) + "%";
  document.getElementById("tutorialEnemyGuard").textContent = "🛡️ 방어도 " + battle.enemyBlock;
  document.getElementById("tutorialTurnBadge").textContent = battle.turn === "player" ? "기록자 차례" : "몬스터 차례";
  document.getElementById("tutorialTurnBadge").classList.toggle("enemy", battle.turn === "enemy");
  document.getElementById("tutorialActions").textContent = battle.turn === "player" ? "행동 " + battle.actions + "회 남음" : "몬스터가 행동 중...";
  const intentText = battle.intent === "charge" ? "💥 강한 일격 · 피해 7" : battle.intent === "block" ? "🛡️ 방어 · 방어도 4" : "⚔️ 공격 · 피해 4";
  document.getElementById("tutorialIntent").textContent = battle.turn === "player" ? "예고: " + intentText : "실행 중: " + intentText;
  document.querySelectorAll("[data-tutorial-card]").forEach(function (button) {
    button.disabled = battle.turn !== "player" || battle.busy || battle.enemyHp <= 0;
  });
}

async function playTutorialCard(card) {
  const battle = tutorialState.battle;
  if (!battle || battle.turn !== "player" || battle.busy || battle.enemyHp <= 0) return;
  let message = "";
  if (card === "strike") {
    const damage = Math.max(0, 7 + (battle.poisonTurns > 0 ? 3 : 0) - battle.enemyBlock);
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.enemyBlock = 0;
    message = "강타로 " + damage + " 피해를 줬습니다." + (damage > 7 ? " 맹독 연계 보너스!" : "");
  } else if (card === "shield") {
    battle.block += 6;
    message = "방패술로 방어도 6을 얻었습니다. 다음 공격을 막습니다.";
  } else if (card === "heal") {
    const healed = Math.min(5, battle.maxPlayerHp - battle.playerHp);
    battle.playerHp += healed;
    message = "치유로 생명력 " + healed + "을 회복했습니다.";
  } else {
    battle.poisonDamage = 3;
    battle.poisonTurns = 2;
    message = "맹독을 걸었습니다. 다음 몬스터 차례부터 2회 피해를 줍니다.";
  }

  battle.actions -= 1;
  document.getElementById("tutorialBattleLog").textContent = message;
  renderTutorialBattle();
  if (battle.enemyHp <= 0) {
    document.getElementById("tutorialBattleLog").textContent += " 왕관 슬라임을 물리쳤습니다!";
    return;
  }
  if (battle.actions === 0) await tutorialEnemyTurn();
}

async function tutorialEnemyTurn() {
  const battle = tutorialState.battle;
  battle.busy = true;
  battle.turn = "enemy";
  renderTutorialBattle();
  document.getElementById("tutorialBattleLog").textContent = "왕관 슬라임이 움직임을 준비합니다...";
  await new Promise(function (resolve) { setTimeout(resolve, 850); });
  if (battle.poisonTurns > 0) {
    battle.enemyHp = Math.max(0, battle.enemyHp - battle.poisonDamage);
    battle.poisonTurns -= 1;
    if (battle.enemyHp <= 0) {
      battle.turn = "player";
      battle.busy = false;
      document.getElementById("tutorialBattleLog").textContent = "맹독 피해 " + battle.poisonDamage + "! 독이 왕관 슬라임을 쓰러뜨렸습니다.";
      renderTutorialBattle();
      return;
    }
  }

  let received = 0;
  if (battle.intent === "block") {
    battle.enemyBlock = 8;
    document.getElementById("tutorialBattleLog").textContent = "왕관 슬라임이 방어 태세를 취해 방어도 8을 얻었습니다.";
  } else {
    const incoming = battle.intent === "charge" ? 7 : 4;
    received = Math.max(0, incoming - battle.block);
    battle.playerHp = Math.max(0, battle.playerHp - received);
    battle.block = 0;
    document.getElementById("tutorialBattleLog").textContent = "왕관 슬라임이 공격해 " + received + " 피해를 줬습니다.";
  }
  battle.enemyTurn += 1;
  battle.intent = ["attack", "block", "charge"][battle.enemyTurn % 3];
  battle.actions = 2;
  battle.turn = "player";
  battle.busy = false;
  if (battle.playerHp <= 0) {
    battle.playerHp = battle.maxPlayerHp;
    document.getElementById("tutorialBattleLog").textContent += " 연습을 위해 생명력을 회복했습니다.";
  }
  renderTutorialBattle();
}

function chooseTutorialRoute(button) {
  tutorialState.routeChoice = button.dataset.routeChoice;
  document.querySelectorAll("[data-route-choice]").forEach(function (choice) {
    const selected = choice === button;
    choice.classList.toggle("selected", selected);
    choice.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  const descriptions = {
    battle: "전투를 골랐습니다. 몬스터를 물리치면 금화와 전리품 기회를 얻습니다.",
    shop: "상인을 골랐습니다. 가진 금화로 전투 전에 덱을 보강할 수 있습니다.",
  };
  document.getElementById("routeChoiceMessage").textContent = descriptions[tutorialState.routeChoice];
  document.getElementById("tutorialNext").disabled = false;
}

function selectFusionCard(button) {
  if (tutorialState.fused) return;
  const cardId = button.dataset.fusionCard;
  if (tutorialState.fusionSelected.includes(cardId)) {
    tutorialState.fusionSelected = tutorialState.fusionSelected.filter(function (id) { return id !== cardId; });
  } else {
    tutorialState.fusionSelected.push(cardId);
  }
  button.classList.toggle("selected", tutorialState.fusionSelected.includes(cardId));
  document.getElementById("fusionButton").disabled = tutorialState.fusionSelected.length !== 2;
  document.getElementById("fusionHint").textContent = tutorialState.fusionSelected.length === 2
    ? "같은 종류·등급을 확인했습니다. 합성하면 행동 한 번을 사용합니다."
    : "같은 카드 두 장을 선택하세요 (" + tutorialState.fusionSelected.length + " / 2).";
}

function fuseTutorialCards() {
  if (tutorialState.fused || tutorialState.fusionSelected.length !== 2) return;
  tutorialState.fused = true;
  document.querySelectorAll("[data-fusion-card]").forEach(function (button) {
    button.disabled = true;
    button.classList.remove("selected");
  });
  document.getElementById("fusionResult").classList.add("fused");
  document.getElementById("fusionHint").textContent = "합성 성공! 강타 2등급은 피해 14를 줍니다. 실제 전투에서는 이 행동에 차례 한 번을 사용합니다.";
  document.getElementById("fusionButton").textContent = "합성 완료 ✓";
  document.getElementById("fusionButton").disabled = true;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("tutorialBack").addEventListener("click", function () { showTutorialStep(tutorialState.step - 1); });
  document.getElementById("tutorialNext").addEventListener("click", function () {
    if (tutorialState.step === 4) {
      location.href = "/pages/game.html";
      return;
    }
    showTutorialStep(tutorialState.step + 1);
  });
  document.querySelectorAll("[data-step-target]").forEach(function (button) {
    button.addEventListener("click", function () { showTutorialStep(Number(button.dataset.stepTarget)); });
  });
  document.querySelectorAll("[data-route-choice]").forEach(function (button) {
    button.addEventListener("click", function () { chooseTutorialRoute(button); });
  });
  document.querySelectorAll("[data-tutorial-card]").forEach(function (button) {
    button.addEventListener("click", function () { playTutorialCard(button.dataset.tutorialCard); });
  });
  document.getElementById("tutorialBattleReset").addEventListener("click", resetTutorialBattle);
  document.querySelectorAll("[data-fusion-card]").forEach(function (button) {
    button.addEventListener("click", function () { selectFusionCard(button); });
  });
  document.getElementById("fusionButton").addEventListener("click", fuseTutorialCards);
  showTutorialStep(0);
});
