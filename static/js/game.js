const CARD_LIBRARY = {
  ember: { name: "잔불", type: "attack", description: "적에게 피해를 줍니다." },
  veil: { name: "장막", type: "defense", description: "방어도를 얻습니다." },
  pulse: { name: "맥동", type: "attack", description: "작은 피해를 줍니다." },
};

const NODE_TYPES = ["battle", "event", "battle", "rest", "elite", "battle"];
const NODE_LABELS = {
  battle: "전투",
  event: "이벤트",
  rest: "휴식",
  elite: "정예",
  boss: "보스",
};

const gameState = {
  floor: 1,
  hp: 30,
  maxHp: 30,
  gold: 0,
  map: [],
  currentNode: null,
  deck: [],
  hand: [],
  selectedCards: [],
  discard: [],
  combat: null,
  relics: [],
  runEnded: false,
};

function createCard(id, rank) {
  return { id: id, rank: rank, uid: id + "-" + rank + "-" + Math.random().toString(36).slice(2) };
}

function resetGame() {
  gameState.floor = 1;
  gameState.hp = 30;
  gameState.maxHp = 30;
  gameState.gold = 0;
  gameState.map = createMap();
  gameState.currentNode = null;
  gameState.deck = [
    createCard("ember", 1), createCard("ember", 1), createCard("ember", 1),
    createCard("veil", 1), createCard("veil", 1), createCard("pulse", 1),
  ];
  gameState.hand = [];
  gameState.selectedCards = [];
  gameState.discard = [];
  gameState.combat = null;
  gameState.relics = [];
  gameState.runEnded = false;
  document.getElementById("resultPanel").hidden = true;
  renderAll();
}

function createMap() {
  const map = [];
  for (let floor = 1; floor <= 3; floor += 1) {
    const count = floor === 3 ? 5 : 6;
    const nodes = [];
    for (let index = 0; index < count; index += 1) {
      const isLast = index === count - 1;
      nodes.push({
        id: floor + "-" + index,
        floor: floor,
        type: isLast ? "boss" : NODE_TYPES[index],
        cleared: false,
        locked: floor !== 1 || index !== 0,
      });
    }
    map.push(nodes);
  }
  return map;
}

function onAuthReady() {
  resetGame();
}

function renderAll() {
  renderStats();
  renderMap();
  renderHand();
  renderCombat();
  renderRelics();
}

function renderStats() {
  document.getElementById("floorValue").textContent = gameState.floor;
  document.getElementById("hpValue").textContent = gameState.hp + " / " + gameState.maxHp;
  document.getElementById("goldValue").textContent = gameState.gold;
}

function renderMap() {
  const map = document.getElementById("map");
  map.innerHTML = gameState.map.map(function (floorNodes, floorIndex) {
    const nodes = floorNodes.map(function (node) {
      const stateClass = node.cleared ? "cleared" : node.locked ? "locked" : "available";
      return '<button class="map-node ' + stateClass + '" data-node-id="' + node.id + '" type="button" ' +
        (node.locked || node.cleared ? "disabled" : "") + ">" +
        '<span class="node-floor">' + node.floor + "F</span>" +
        '<strong>' + NODE_LABELS[node.type] + "</strong></button>";
    }).join("");
    return '<div class="map-floor"><span class="floor-label">' + (floorIndex + 1) + "층</span>" + nodes + "</div>";
  }).join("");

  map.querySelectorAll(".map-node.available").forEach(function (button) {
    button.addEventListener("click", function () {
      selectNode(button.dataset.nodeId);
    });
  });
}

function selectNode(nodeId) {
  const node = gameState.map.flat().find(function (item) { return item.id === nodeId; });
  if (!node || node.locked || node.cleared || gameState.runEnded) return;
  gameState.currentNode = node;
  document.getElementById("nodeHint").textContent = NODE_LABELS[node.type] + " 노드가 선택되었습니다.";

  if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
    startCombat(node);
  } else if (node.type === "rest") {
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 8);
    completeNode("휴식으로 HP를 회복했습니다.");
  } else {
    gameState.gold += 15;
    gameState.relics.push("낡은 별 지도");
    completeNode("이벤트에서 기록물과 금화를 얻었습니다.");
  }
  renderAll();
}

function startCombat(node) {
  const boss = node.type === "boss";
  gameState.combat = {
    enemyName: boss ? "층의 관리자" : node.type === "elite" ? "깊은 기록의 사냥꾼" : "기록의 잔상",
    enemyHp: boss ? 45 : node.type === "elite" ? 28 : 18,
    enemyMaxHp: boss ? 45 : node.type === "elite" ? 28 : 18,
    enemyDamage: boss ? 8 : node.type === "elite" ? 6 : 4,
    block: 0,
  };
  drawCards(5);
}

function drawCards(amount) {
  for (let index = 0; index < amount; index += 1) {
    if (gameState.deck.length === 0) {
      gameState.deck = gameState.discard;
      gameState.discard = [];
    }
    if (gameState.deck.length > 0) gameState.hand.push(gameState.deck.shift());
  }
}

function renderCombat() {
  const panel = document.getElementById("combatPanel");
  if (!gameState.combat) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  document.getElementById("enemyName").textContent = gameState.combat.enemyName;
  document.getElementById("enemyHp").textContent = gameState.combat.enemyHp + " / " + gameState.combat.enemyMaxHp;
  document.getElementById("enemyBarFill").style.width = Math.max(0, gameState.combat.enemyHp / gameState.combat.enemyMaxHp * 100) + "%";
  document.getElementById("playButton").disabled = gameState.selectedCards.length !== 1;
  document.getElementById("fuseButton").disabled = !canFuseSelection();
}

function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = gameState.hand.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    const selected = gameState.selectedCards.includes(card.uid) ? " selected" : "";
    return '<button class="play-card ' + base.type + selected + '" data-card-id="' + card.uid + '" type="button">' +
      '<span class="card-rank">' + card.rank + "등급</span>" +
      '<strong>' + base.name + "</strong>" +
      '<span>' + getCardValue(card) + " 효과</span>" +
      '<small>' + base.description + "</small></button>";
  }).join("");
  hand.querySelectorAll(".play-card").forEach(function (button) {
    button.addEventListener("click", function () { toggleCard(button.dataset.cardId); });
  });
}

function getCardValue(card) {
  return card.id === "veil" ? 5 * card.rank : (card.id === "pulse" ? 4 : 7) * card.rank;
}

function toggleCard(uid) {
  if (gameState.selectedCards.includes(uid)) {
    gameState.selectedCards = gameState.selectedCards.filter(function (id) { return id !== uid; });
  } else if (gameState.selectedCards.length < 2) {
    gameState.selectedCards.push(uid);
  }
  renderAll();
}

function canFuseSelection() {
  if (gameState.selectedCards.length !== 2) return false;
  const selected = gameState.hand.filter(function (card) { return gameState.selectedCards.includes(card.uid); });
  return selected[0].id === selected[1].id && selected[0].rank === selected[1].rank && selected[0].rank < 3;
}

function fuseSelectedCards() {
  if (!canFuseSelection()) return;
  const selected = gameState.hand.filter(function (card) { return gameState.selectedCards.includes(card.uid); });
  gameState.hand = gameState.hand.filter(function (card) { return !gameState.selectedCards.includes(card.uid); });
  gameState.hand.push(createCard(selected[0].id, selected[0].rank + 1));
  gameState.selectedCards = [];
  document.getElementById("combatLog").textContent = selected[0].rank + "등급 카드 2장을 합성해 " + (selected[0].rank + 1) + "등급 카드를 만들었습니다.";
  renderAll();
}

function playSelectedCard() {
  if (gameState.selectedCards.length !== 1 || !gameState.combat) return;
  const index = gameState.hand.findIndex(function (card) { return card.uid === gameState.selectedCards[0]; });
  const card = gameState.hand.splice(index, 1)[0];
  const value = getCardValue(card);
  if (card.id === "veil") {
    gameState.combat.block += value;
    document.getElementById("combatLog").textContent = "장막으로 " + value + " 방어도를 얻었습니다.";
  } else {
    gameState.combat.enemyHp -= value;
    document.getElementById("combatLog").textContent = CARD_LIBRARY[card.id].name + "으로 " + value + " 피해를 주었습니다.";
  }
  gameState.discard.push(card);
  gameState.selectedCards = [];
  checkCombatEnd();
  renderAll();
}

function endTurn() {
  if (!gameState.combat) return;
  const damage = Math.max(0, gameState.combat.enemyDamage - gameState.combat.block);
  gameState.hp -= damage;
  gameState.combat.block = 0;
  gameState.discard.push.apply(gameState.discard, gameState.hand);
  gameState.hand = [];
  gameState.selectedCards = [];
  if (gameState.hp <= 0) {
    endRun(false, "기록이 여기서 끝났습니다.");
    return;
  }
  drawCards(5);
  document.getElementById("combatLog").textContent = "적의 공격으로 " + damage + " 피해를 받았습니다.";
  renderAll();
}

function checkCombatEnd() {
  if (gameState.combat.enemyHp > 0) return;
  const node = gameState.currentNode;
  gameState.combat = null;
  completeNode(node.type === "boss" ? "최종 보스를 쓰러뜨렸습니다." : "전투에서 승리했습니다.");
  if (node.type === "boss") endRun(true, "세 층의 기록을 모두 통과했습니다.");
}

function completeNode(message) {
  gameState.currentNode.cleared = true;
  const next = gameState.map.flat().find(function (node) {
    return node.floor === gameState.currentNode.floor && node.id.split("-")[1] === String(Number(gameState.currentNode.id.split("-")[1]) + 1);
  });
  if (next) next.locked = false;
  else if (gameState.floor < 3) {
    gameState.floor += 1;
    gameState.map[gameState.floor - 1][0].locked = false;
  }
  document.getElementById("nodeHint").textContent = message;
}

function endRun(won, message) {
  gameState.runEnded = true;
  document.getElementById("resultTitle").textContent = won ? "기록 완료" : "기록 중단";
  document.getElementById("resultText").textContent = message;
  document.getElementById("resultPanel").hidden = false;
  gameState.combat = null;
}

function renderRelics() {
  document.getElementById("relics").innerHTML = gameState.relics.length
    ? gameState.relics.map(function (relic) { return "<span class=\"relic\">" + relic + "</span>"; }).join("")
    : '<span class="muted">아직 기록물이 없습니다.</span>';
}

async function requestArchiveNote() {
  const text = document.getElementById("aiText");
  text.textContent = "기록을 읽는 중...";
  try {
    text.textContent = await askAI("로그라이크 게임의 현재 상황을 신비로운 기록 보관자의 말투로 한 문장만 해설해줘. 현재 층: " + gameState.floor + ", HP: " + gameState.hp + ", 기록물: " + gameState.relics.join(", "));
  } catch (error) {
    text.textContent = "기록 보관소에 연결하지 못했습니다.";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("fuseButton").addEventListener("click", fuseSelectedCards);
  document.getElementById("playButton").addEventListener("click", playSelectedCard);
  document.getElementById("endTurnButton").addEventListener("click", endTurn);
  document.getElementById("restartButton").addEventListener("click", resetGame);
  document.getElementById("aiButton").addEventListener("click", requestArchiveNote);
});
