const CARD_LIBRARY = {
  strike: { name: "섬광", type: "direct", description: "즉시 적에게 피해를 줍니다. 지속 피해 중인 적에게 강해집니다." },
  bleed: { name: "흔적", type: "damage-over-time", description: "3턴 동안 적에게 지속 피해를 줍니다." },
  heal: { name: "회귀", type: "heal", description: "아군 HP를 회복합니다. 방어 중이면 회복량이 증가합니다." },
  shield: { name: "결계", type: "defense", description: "이번 적 공격을 막을 실드를 얻습니다." },
};

const NODE_TYPES = ["battle", "event", "battle", "shop", "elite", "battle"];
const NODE_LABELS = {
  battle: "전투",
  event: "이벤트",
  shop: "상점",
  elite: "정예",
  boss: "보스",
};

const RELIC_LIBRARY = {
  starMap: { name: "낡은 별 지도", description: "전투 승리 금화 +5" },
  compass: { name: "유리 나침반", description: "모든 카드 효과 +1" },
};

const gameState = {
  floor: 1,
  hp: 30,
  maxHp: 30,
  gold: 0,
  map: [],
  currentNode: null,
  cardPool: [],
  deck: [],
  hand: [],
  selectedCards: [],
  combat: null,
  event: null,
  shop: null,
  reward: null,
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
  gameState.cardPool = [
    createCard("strike", 1), createCard("strike", 1), createCard("strike", 1), createCard("strike", 1),
    createCard("strike", 1), createCard("strike", 1), createCard("strike", 1), createCard("strike", 1),
    createCard("bleed", 1), createCard("bleed", 1), createCard("bleed", 1), createCard("bleed", 1),
    createCard("bleed", 1), createCard("bleed", 1), createCard("bleed", 1), createCard("bleed", 1),
    createCard("heal", 1), createCard("heal", 1), createCard("heal", 1), createCard("heal", 1),
    createCard("heal", 1), createCard("heal", 1), createCard("heal", 1), createCard("heal", 1),
    createCard("shield", 1), createCard("shield", 1), createCard("shield", 1), createCard("shield", 1),
    createCard("shield", 1), createCard("shield", 1), createCard("shield", 1), createCard("shield", 1),
  ];
  gameState.deck = [];
  gameState.hand = [];
  gameState.selectedCards = [];
  gameState.combat = null;
  gameState.event = null;
  gameState.shop = null;
  gameState.reward = null;
  gameState.relics = [];
  gameState.runEnded = false;
  document.getElementById("resultPanel").hidden = true;
  renderAll();
}

function createMap() {
  const map = [];
  const floorOptions = [
    [["battle", "event"], ["battle", "shop"], ["event", "elite"], ["battle", "event"], ["shop", "battle"]],
    [["battle", "shop"], ["event", "battle"], ["elite", "event"], ["battle", "event"], ["shop", "battle"]],
    [["battle", "event"], ["shop", "battle"], ["elite", "battle"], ["event", "battle"]],
  ];
  for (let floor = 1; floor <= 3; floor += 1) {
    const nodes = [];
    floorOptions[floor - 1].forEach(function (pair, branch) {
      pair.forEach(function (type, option) {
        const index = branch * 2 + option;
        nodes.push({
          id: floor + "-" + index,
          floor: floor,
          stage: branch,
          option: option,
          type: type,
          cleared: false,
          locked: floor !== 1 || branch !== 0,
        });
      });
    });
    nodes.push({
      id: floor + "-boss",
      floor: floor,
      stage: floorOptions[floor - 1].length,
      option: 0,
      type: "boss",
      cleared: false,
      locked: true,
    });
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
  renderEvent();
  renderReward();
  renderShop();
  renderRelics();
}

function renderStats() {
  document.getElementById("floorValue").textContent = gameState.floor;
  document.getElementById("hpValue").textContent = gameState.hp + " / " + gameState.maxHp;
  document.getElementById("goldValue").textContent = gameState.gold;
  document.querySelectorAll(".floor-dots i").forEach(function (dot, index) {
    dot.classList.toggle("active", index < gameState.floor);
  });
}

function renderMap() {
  const map = document.getElementById("map");
  const floorNodes = gameState.map[gameState.floor - 1] || [];
  const stages = [];
  floorNodes.forEach(function (node) {
    if (!stages[node.stage]) stages[node.stage] = [];
    stages[node.stage].push(node);
  });
  map.innerHTML = '<div class="map-floor"><div class="map-floor-title"><span class="floor-label">현재 진행</span><strong>' + gameState.floor + "층 경로</strong></div>" +
    stages.map(function (stageNodes, stageIndex) {
      const options = stageNodes.map(renderMapNode).join("");
      return '<div class="map-stage"><span class="stage-label">' + (stageIndex === stages.length - 1 ? "BOSS" : "경로 " + (stageIndex + 1)) + '</span><div class="map-options">' + options + "</div></div>";
    }).join("") + "</div>";

  map.querySelectorAll(".map-node.available").forEach(function (button) {
    button.addEventListener("click", function () {
      selectNode(button.dataset.nodeId);
    });
  });
}

function renderMapNode(node) {
  const stateClass = node.cleared ? "cleared" : node.locked ? "locked" : "available";
  const bossClass = node.type === "boss" ? " boss-node" : "";
  return '<button class="map-node ' + stateClass + bossClass + '" data-node-id="' + node.id + '" type="button" ' +
    (node.locked || node.cleared ? "disabled" : "") + ">" +
    '<span class="node-floor">' + (node.type === "boss" ? "최종 관문" : "선택 가능") + "</span>" +
    '<strong>' + NODE_LABELS[node.type] + "</strong></button>";
}

function selectNode(nodeId) {
  const node = gameState.map.flat().find(function (item) { return item.id === nodeId; });
  if (!node || node.locked || node.cleared || gameState.runEnded) return;
  gameState.currentNode = node;
  document.getElementById("nodeHint").textContent = NODE_LABELS[node.type] + " 노드가 선택되었습니다.";

  if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
    startCombat(node);
  } else if (node.type === "shop") {
    openShop();
  } else {
    openEvent();
  }
  renderAll();
}

function openEvent() {
  gameState.event = { open: true };
  document.getElementById("nodeHint").textContent = "성장 선택지 중 하나를 고르세요.";
}

function renderEvent() {
  const panel = document.getElementById("eventPanel");
  const choices = document.getElementById("eventChoices");
  if (!gameState.event || !gameState.event.open) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  choices.innerHTML =
    '<button class="event-choice" data-event-choice="upgrade" type="button"><strong>기록을 벼리기</strong><span>카드 1장을 선택해 1등급 강화합니다.</span></button>' +
    '<button class="event-choice" data-event-choice="max-hp" type="button"><strong>생명력 확장</strong><span>최대 HP를 5 늘리고 HP를 모두 회복합니다.</span></button>' +
    '<button class="event-choice" data-event-choice="relic" type="button"><strong>낡은 별 지도</strong><span>금화 25와 기록물을 얻습니다.</span></button>';
  choices.querySelectorAll(".event-choice").forEach(function (button) {
    button.addEventListener("click", function () { chooseEvent(button.dataset.eventChoice); });
  });
}

function renderReward() {
  const panel = document.getElementById("rewardPanel");
  const choices = document.getElementById("rewardChoices");
  if (!gameState.reward) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  choices.innerHTML =
    '<button class="event-choice" data-reward-choice="upgrade" type="button"><strong>카드 강화</strong><span>카드 종류 하나의 모든 카드를 1등급 강화합니다.</span></button>' +
    '<button class="event-choice" data-reward-choice="replace" type="button"><strong>카드 교체</strong><span>카드 종류 하나를 다른 카드 종류로 바꿔 32장 덱을 유지합니다.</span></button>';
  choices.querySelectorAll("[data-reward-choice]").forEach(function (button) {
    button.addEventListener("click", function () { chooseReward(button.dataset.rewardChoice); });
  });
}

function chooseReward(choice) {
  if (!gameState.reward) return;
  if (choice === "upgrade") {
    showRewardCardChoices("upgrade");
    return;
  }
  showRewardCardChoices("replace");
}

function showRewardCardChoices(rewardType) {
  const choices = document.getElementById("rewardChoices");
  const available = [];
  gameState.cardPool.forEach(function (card) {
    if (available.some(function (item) { return item.id === card.id; })) return;
    available.push(card);
  });
  choices.innerHTML = '<p class="event-subtitle">카드 종류를 선택하세요.</p>' + available.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="event-choice card-upgrade-choice" data-reward-card="' + card.id + '" type="button"><strong>' + base.name + "</strong><span>" + (rewardType === "upgrade" ? "모든 " + base.name + " 카드를 강화" : base.name + " 카드를 다른 종류로 교체") + "</span></button>";
  }).join("");
  choices.querySelectorAll("[data-reward-card]").forEach(function (button) {
    button.addEventListener("click", function () { applyReward(rewardType, button.dataset.rewardCard); });
  });
}

function applyReward(rewardType, cardType) {
  if (!gameState.reward) return;
  if (rewardType === "upgrade") {
    gameState.cardPool.forEach(function (card) {
      if (card.id === cardType && card.rank < 3) card.rank += 1;
    });
    document.getElementById("nodeHint").textContent = CARD_LIBRARY[cardType].name + " 카드들이 강화되었습니다.";
  } else {
    const replacement = Object.keys(CARD_LIBRARY).find(function (id) { return id !== cardType; });
    gameState.cardPool.forEach(function (card) {
      if (card.id === cardType) {
        card.id = replacement;
        card.rank = 1;
      }
    });
    document.getElementById("nodeHint").textContent = CARD_LIBRARY[cardType].name + " 카드를 " + CARD_LIBRARY[replacement].name + " 카드로 교체했습니다.";
  }
  gameState.reward = null;
  renderAll();
}

function chooseEvent(choice) {
  if (!gameState.event || !gameState.event.open) return;
  if (choice === "upgrade") {
    showUpgradeChoices();
    return;
  }
  if (choice === "max-hp") {
    gameState.maxHp += 5;
    gameState.hp = gameState.maxHp;
    finishEvent("최대 HP가 5 증가했습니다.");
    return;
  }
  gameState.gold += 25;
  addRelic("starMap");
  finishEvent("금화 25와 낡은 별 지도를 얻었습니다.");
}

function showUpgradeChoices() {
  const choices = document.getElementById("eventChoices");
  const candidates = [];
  gameState.cardPool.forEach(function (card) {
    if (card.rank >= 3 || candidates.some(function (item) { return item.id === card.id; })) return;
    candidates.push(card);
  });
  if (candidates.length === 0) {
    choices.innerHTML = '<p class="muted">강화할 수 있는 카드가 없습니다. 다른 선택을 골라주세요.</p>';
    return;
  }
  choices.innerHTML = '<p class="event-subtitle">강화할 카드 종류를 선택하세요.</p>' + candidates.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="event-choice card-upgrade-choice" data-card-type="' + card.id + '" type="button"><strong>' + base.name + " " + card.rank + "등급</strong><span>이 카드 1장을 " + (card.rank + 1) + "등급으로 강화</span></button>";
  }).join("");
  choices.querySelectorAll(".card-upgrade-choice").forEach(function (button) {
    button.addEventListener("click", function () { upgradeCard(button.dataset.cardType); });
  });
}

function upgradeCard(cardType) {
  const target = gameState.cardPool.find(function (card) {
    return card.id === cardType && card.rank < 3;
  });
  if (!target) return;
  target.rank += 1;
  finishEvent(CARD_LIBRARY[cardType].name + " 카드 1장을 " + target.rank + "등급으로 강화했습니다.");
}

function finishEvent(message) {
  gameState.event = null;
  completeNode(message);
  renderAll();
}

function openShop() {
  gameState.shop = { open: true, purchased: {} };
  document.getElementById("nodeHint").textContent = "금화를 사용해 성장 요소를 구매하세요.";
}

function renderShop() {
  const panel = document.getElementById("shopPanel");
  const choices = document.getElementById("shopChoices");
  if (!gameState.shop || !gameState.shop.open) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  choices.innerHTML =
    '<button class="shop-item" data-shop-choice="upgrade" type="button"><strong>카드 연마 · 25G</strong><span>카드 1장을 선택해 1등급 강화합니다.</span></button>' +
    '<button class="shop-item" data-shop-choice="max-hp" type="button"><strong>생명력 증폭 · 30G</strong><span>최대 HP를 5 늘리고 현재 HP도 회복합니다.</span></button>' +
    '<button class="shop-item" data-shop-choice="relic" type="button"><strong>유리 나침반 · 20G</strong><span>기록물을 얻어 다음 선택을 준비합니다.</span></button>' +
    '<button class="shop-leave" data-shop-choice="leave" type="button">상점 나가기</button>';
  choices.querySelectorAll("[data-shop-choice]").forEach(function (button) {
    const choice = button.dataset.shopChoice;
    const unavailable = choice !== "leave" && (gameState.shop.purchased[choice] || !canBuyShopItem(choice));
    button.disabled = unavailable;
    button.addEventListener("click", function () { chooseShop(choice); });
  });
}

function shopPrice(choice) {
  return choice === "upgrade" ? 25 : choice === "max-hp" ? 30 : 20;
}

function canBuyShopItem(choice) {
  return gameState.gold >= shopPrice(choice);
}

function chooseShop(choice) {
  if (!gameState.shop || !gameState.shop.open) return;
  if (choice === "leave") {
    gameState.shop = null;
    completeNode("상점을 나왔습니다.");
    renderAll();
    return;
  }
  if (gameState.shop.purchased[choice] || !canBuyShopItem(choice)) return;
  if (choice === "upgrade") {
    showShopUpgradeChoices();
    return;
  }
  gameState.gold -= shopPrice(choice);
  gameState.shop.purchased[choice] = true;
  if (choice === "max-hp") {
    gameState.maxHp += 5;
    gameState.hp = gameState.maxHp;
    document.getElementById("shopMessage").textContent = "최대 HP가 5 증가했습니다.";
  } else {
    addRelic("compass");
    document.getElementById("shopMessage").textContent = "유리 나침반을 구매했습니다.";
  }
  renderAll();
}

function showShopUpgradeChoices() {
  const choices = document.getElementById("shopChoices");
  const candidates = [];
  gameState.cardPool.forEach(function (card) {
    if (card.rank >= 3 || candidates.some(function (item) { return item.id === card.id; })) return;
    candidates.push(card);
  });
  choices.innerHTML = '<p class="event-subtitle">25G로 강화할 카드 종류를 선택하세요.</p>' + candidates.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="shop-item" data-shop-card="' + card.id + '" type="button"><strong>' + base.name + " " + card.rank + "등급</strong><span>" + (card.rank + 1) + "등급으로 강화</span></button>";
  }).join("") + '<button class="shop-leave" data-shop-choice="back" type="button">상품 목록으로</button>';
  choices.querySelectorAll("[data-shop-card]").forEach(function (button) {
    button.addEventListener("click", function () { buyUpgrade(button.dataset.shopCard); });
  });
  choices.querySelector("[data-shop-choice=back]").addEventListener("click", renderShop);
}

function buyUpgrade(cardType) {
  if (!canBuyShopItem("upgrade")) return;
  const target = gameState.cardPool.find(function (card) {
    return card.id === cardType && card.rank < 3;
  });
  if (!target) return;
  target.rank += 1;
  gameState.gold -= shopPrice("upgrade");
  gameState.shop.purchased.upgrade = true;
  document.getElementById("shopMessage").textContent = CARD_LIBRARY[cardType].name + " 카드를 강화했습니다.";
  renderAll();
}

function startCombat(node) {
  const boss = node.type === "boss";
  const firstFloorBoss = boss && node.floor === 1;
  gameState.hp = gameState.maxHp;
  gameState.deck = gameState.cardPool.map(function (card) {
    return createCard(card.id, card.rank);
  });
  gameState.hand = [];
  gameState.selectedCards = [];
  gameState.combat = {
    enemyName: boss ? (firstFloorBoss ? "첫 기록의 관리자" : "층의 관리자") : node.type === "elite" ? "깊은 기록의 사냥꾼" : "기록의 잔상",
    enemyHp: firstFloorBoss ? 32 : boss ? 45 : node.type === "elite" ? 28 : 18,
    enemyMaxHp: firstFloorBoss ? 32 : boss ? 45 : node.type === "elite" ? 28 : 18,
    enemyDamage: firstFloorBoss ? 5 : boss ? 8 : node.type === "elite" ? 6 : 4,
    block: 0,
    damageOverTime: 0,
    damageOverTimeTurns: 0,
    actionsRemaining: 2,
    lastEnemyAction: "아직 행동하지 않았습니다.",
    enemyBlock: 0,
    enemyIntent: "attack",
    enemyTurnCount: 0,
    turn: "player",
  };
  maintainHand();
}

function drawCards(amount) {
  for (let index = 0; index < amount; index += 1) {
    if (gameState.deck.length === 0) return;
    const randomIndex = Math.floor(Math.random() * gameState.deck.length);
    gameState.hand.push(gameState.deck.splice(randomIndex, 1)[0]);
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
  document.getElementById("enemyLabel").textContent = gameState.combat.enemyName;
  document.getElementById("enemyHp").textContent = gameState.combat.enemyHp + " / " + gameState.combat.enemyMaxHp;
  document.getElementById("enemyBarFill").style.width = Math.max(0, gameState.combat.enemyHp / gameState.combat.enemyMaxHp * 100) + "%";
  const playerTurn = gameState.combat.turn === "player";
  document.getElementById("turnIndicator").textContent = playerTurn ? "아군 턴" : "적 턴";
  document.getElementById("turnIndicator").className = playerTurn ? "player-turn" : "enemy-turn";
  document.getElementById("actionCounter").textContent = playerTurn ? "행동 " + gameState.combat.actionsRemaining + " / 2" : "적 행동 중";
  document.getElementById("turnOrder").textContent = playerTurn ? "행동 2회 후 적 행동" : "적 행동이 끝나면 아군 행동";
  document.getElementById("playerHp").textContent = "HP " + gameState.hp + " / " + gameState.maxHp;
  document.getElementById("playerBarFill").style.width = Math.max(0, gameState.hp / gameState.maxHp * 100) + "%";
  document.getElementById("playerBlock").textContent = "방어도 " + gameState.combat.block;
  document.getElementById("enemyIntent").textContent = playerTurn ? getEnemyIntentText() : "행동 중...";
  document.getElementById("enemyAction").textContent = gameState.combat.lastEnemyAction;
  document.getElementById("selectionHint").textContent = playerTurn ? "같은 카드가 나란히 놓이면 자동 합성 · 드래그해 수동 합성" : "적의 턴입니다.";
  document.getElementById("playButton").disabled = !playerTurn || gameState.selectedCards.length !== 1;
  document.getElementById("endTurnButton").disabled = !playerTurn;
}

function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = gameState.hand.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    const selected = gameState.selectedCards.includes(card.uid) ? " selected" : "";
    return '<button class="play-card ' + base.type + selected + '" data-card-id="' + card.uid + '" type="button" draggable="true" aria-label="' + base.name + " " + card.rank + "등급 카드. 드래그해 합성" + '" title="카드를 끌어 같은 카드 위에 놓아 합성">' +
      '<span class="card-rank">' + card.rank + "등급</span>" +
      '<strong>' + base.name + "</strong>" +
      '<span>' + getCardValue(card) + " 효과</span>" +
      '<small>' + base.description + "</small></button>";
  }).join("");
  hand.querySelectorAll(".play-card").forEach(function (button) {
    button.addEventListener("click", function () { toggleCard(button.dataset.cardId); });
    button.addEventListener("dragstart", function (event) {
      if (!gameState.combat || gameState.combat.turn !== "player") {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", button.dataset.cardId);
      event.dataTransfer.effectAllowed = "move";
    });
    button.addEventListener("dragover", function (event) {
      event.preventDefault();
      button.classList.add("drag-over");
    });
    button.addEventListener("dragleave", function () { button.classList.remove("drag-over"); });
    button.addEventListener("drop", function (event) {
      event.preventDefault();
      button.classList.remove("drag-over");
      fuseCards(event.dataTransfer.getData("text/plain"), button.dataset.cardId);
    });
  });
}

function getCardValue(card) {
  const bonus = gameState.relics.some(function (relic) { return relic.id === "compass"; }) ? 1 : 0;
  if (card.id === "shield") return 5 * card.rank + bonus;
  if (card.id === "heal") return 6 * card.rank + bonus + (gameState.combat && gameState.combat.block > 0 ? 2 : 0);
  if (card.id === "bleed") return 3 * card.rank + bonus;
  return 7 * card.rank + bonus;
}

function toggleCard(uid) {
  if (!gameState.combat || gameState.combat.turn !== "player") return;
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

function canFuseCards(first, second) {
  return first && second && first.uid !== second.uid && first.id === second.id && first.rank === second.rank && first.rank < 3;
}

function fuseCards(sourceUid, targetUid) {
  if (!gameState.combat || gameState.combat.turn !== "player") return;
  const sourceIndex = gameState.hand.findIndex(function (card) { return card.uid === sourceUid; });
  const targetIndex = gameState.hand.findIndex(function (card) { return card.uid === targetUid; });
  if (sourceIndex < 0 || targetIndex < 0) {
    document.getElementById("combatLog").textContent = "합성할 카드를 찾을 수 없습니다.";
    return;
  }
  const source = gameState.hand[sourceIndex];
  const target = gameState.hand[targetIndex];
  if (!canFuseCards(source, target)) {
    document.getElementById("combatLog").textContent = "같은 종류와 등급의 카드만 합성할 수 있습니다.";
    return;
  }
  const insertIndex = Math.min(sourceIndex, targetIndex);
  gameState.hand.splice(Math.max(sourceIndex, targetIndex), 1);
  gameState.hand.splice(insertIndex, 1, createCard(source.id, source.rank + 1));
  gameState.selectedCards = [];
  const actionMessage = source.rank + "등급 카드 2장을 합성해 " + (source.rank + 1) + "등급 카드를 만들었습니다.";
  maintainHand();
  completePlayerAction(actionMessage);
  renderAll();
}

function resolveAutomaticFusions() {
  let didFuse = true;
  let didFuseAny = false;
  while (didFuse) {
    didFuse = false;
    for (let index = 0; index < gameState.hand.length - 1; index += 1) {
      const first = gameState.hand[index];
      const second = gameState.hand[index + 1];
      if (!canFuseCards(first, second)) continue;
      gameState.hand.splice(index, 2, createCard(first.id, first.rank + 1));
      didFuse = true;
      didFuseAny = true;
      break;
    }
  }
  return didFuseAny;
}

function refillHand() {
  drawCards(Math.max(0, 8 - gameState.hand.length));
}

function maintainHand() {
  let changed = true;
  while (changed) {
    changed = resolveAutomaticFusions();
    const handLength = gameState.hand.length;
    refillHand();
    if (gameState.hand.length !== handLength) changed = true;
  }
}

function completePlayerAction(actionMessage) {
  if (!gameState.combat) return;
  gameState.combat.actionsRemaining -= 1;
  if (gameState.combat.actionsRemaining <= 0) {
    enemyTurn(actionMessage);
    return;
  }
  document.getElementById("combatLog").textContent = actionMessage + " 플레이어 행동이 1회 남았습니다.";
}

function playSelectedCard() {
  if (gameState.selectedCards.length !== 1 || !gameState.combat || gameState.combat.turn !== "player") return;
  const index = gameState.hand.findIndex(function (card) { return card.uid === gameState.selectedCards[0]; });
  const card = gameState.hand.splice(index, 1)[0];
  const value = getCardValue(card);
  let actionMessage = "";
  if (card.id === "shield") {
    gameState.combat.block += value;
    actionMessage = "결계로 실드 " + value + "을 얻었습니다.";
  } else if (card.id === "heal") {
    const healed = Math.min(value, gameState.maxHp - gameState.hp);
    gameState.hp += healed;
    actionMessage = "회귀로 HP를 " + healed + " 회복했습니다.";
  } else if (card.id === "bleed") {
    gameState.combat.damageOverTime = value;
    gameState.combat.damageOverTimeTurns = 3;
    actionMessage = "흔적이 적에게 매 턴 " + value + " 지속 피해를 남겼습니다.";
  } else {
    const synergyBonus = gameState.combat.damageOverTimeTurns > 0 ? 3 : 0;
    const dealt = Math.max(0, value + synergyBonus - gameState.combat.enemyBlock);
    gameState.combat.enemyHp -= dealt;
    gameState.combat.enemyBlock = 0;
    actionMessage = "섬광으로 " + dealt + " 피해를 주었습니다." + (synergyBonus ? " 지속 피해 연계 보너스!" : "");
  }
  gameState.selectedCards = [];
  checkCombatEnd();
  if (gameState.combat) {
    maintainHand();
    completePlayerAction(actionMessage);
  }
  renderAll();
}

function endTurn() {
  if (!gameState.combat || gameState.combat.turn !== "player") return;
  enemyTurn("아무 카드도 사용하지 않고 턴을 종료했습니다.");
  renderAll();
}

function enemyTurn(playerAction) {
  if (!gameState.combat) return;
  gameState.combat.turn = "enemy";
  let damageOverTimeMessage = "";
  if (gameState.combat.damageOverTimeTurns > 0) {
    gameState.combat.enemyHp -= gameState.combat.damageOverTime;
    gameState.combat.damageOverTimeTurns -= 1;
    damageOverTimeMessage = " 지속 피해 " + gameState.combat.damageOverTime + " 적용.";
    if (gameState.combat.enemyHp <= 0) {
      checkCombatEnd();
      return;
    }
  }
  const intent = gameState.combat.enemyIntent;
  let damage = 0;
  if (intent === "block") {
    gameState.combat.enemyBlock = 8;
    gameState.combat.lastEnemyAction = "방어 태세를 취해 실드 8을 얻었습니다.";
  } else {
    const multiplier = intent === "charge" ? 2 : 1;
    damage = Math.max(0, gameState.combat.enemyDamage * multiplier - gameState.combat.block);
    gameState.hp -= damage;
    gameState.combat.lastEnemyAction = intent === "charge" ? "강공으로 " + damage + " 피해를 주었습니다." : "공격하여 " + damage + " 피해를 주었습니다.";
  }
  gameState.combat.block = 0;
  if (damageOverTimeMessage) gameState.combat.lastEnemyAction += damageOverTimeMessage;
  gameState.selectedCards = [];
  if (gameState.hp <= 0) {
    endRun(false, "기록이 여기서 끝났습니다.");
    return;
  }
  maintainHand();
  gameState.combat.enemyTurnCount += 1;
  gameState.combat.enemyIntent = ["attack", "block", "charge"][gameState.combat.enemyTurnCount % 3];
  gameState.combat.actionsRemaining = 2;
  gameState.combat.turn = "player";
  document.getElementById("combatLog").textContent = playerAction + damageOverTimeMessage + " 적의 공격으로 " + damage + " 피해를 받았습니다. 다시 아군의 턴입니다.";
}

function checkCombatEnd() {
  if (gameState.combat.enemyHp > 0) return;
  const node = gameState.currentNode;
  const reward = (node.type === "boss" ? 40 : node.type === "elite" ? 20 : 10) +
    (gameState.relics.some(function (relic) { return relic.id === "starMap"; }) ? 5 : 0);
  gameState.gold += reward;
  gameState.combat = null;
  const finalBoss = node.type === "boss" && node.floor === 3;
  completeNode((finalBoss ? "최종 보스를 쓰러뜨렸습니다." : node.type === "boss" ? "층의 보스를 쓰러뜨렸습니다." : "전투에서 승리했습니다.") + " 금화 " + reward + "G를 얻었습니다.");
  if (finalBoss) endRun(true, "세 층의 기록을 모두 통과했습니다.");
  else {
    gameState.reward = { open: true };
    document.getElementById("nodeHint").textContent = "전투 보상을 선택하세요.";
  }
}

function getEnemyIntentText() {
  if (!gameState.combat) return "";
  if (gameState.combat.enemyIntent === "block") return "다음 행동: 방어 실드 8";
  if (gameState.combat.enemyIntent === "charge") return "다음 행동: 강공격 " + (gameState.combat.enemyDamage * 2);
  return "다음 행동: 공격 " + gameState.combat.enemyDamage;
}

function completeNode(message) {
  const current = gameState.currentNode;
  current.cleared = true;
  gameState.map[current.floor - 1].forEach(function (node) {
    if (node.stage === current.stage && node.id !== current.id) node.cleared = true;
    if (node.stage === current.stage + 1) node.locked = false;
  });
  if (current.type === "boss" && gameState.floor < 3) {
    gameState.floor += 1;
    gameState.map[gameState.floor - 1].forEach(function (node) {
      if (node.stage === 0) node.locked = false;
    });
  }
  document.getElementById("nodeHint").textContent = message;
}

function endRun(won, message) {
  if (gameState.runEnded) return;
  gameState.runEnded = true;
  saveGameResult(won, message);
  document.getElementById("resultTitle").textContent = won ? "기록 완료" : "기록 중단";
  document.getElementById("resultText").textContent = message;
  document.getElementById("resultPanel").hidden = false;
  gameState.combat = null;
}

function saveGameResult(won, message) {
  if (!currentUser) return;
  const historyKey = "archive-game-history-" + currentUser.id;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  } catch (error) {
    console.error("플레이 기록 저장 준비 실패:", error);
  }
  history.unshift({
    won: won,
    message: message,
    floor: gameState.floor,
    hp: Math.max(0, gameState.hp),
    maxHp: gameState.maxHp,
    gold: gameState.gold,
    relics: gameState.relics.map(function (relic) { return RELIC_LIBRARY[relic.id].name; }),
    playedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
  } catch (error) {
    console.error("플레이 기록 저장 실패:", error);
  }
}

function addRelic(id) {
  if (gameState.relics.some(function (relic) { return relic.id === id; })) return;
  gameState.relics.push({ id: id });
}

function renderRelics() {
  document.getElementById("relics").innerHTML = gameState.relics.length
    ? gameState.relics.map(function (relic) {
      const data = RELIC_LIBRARY[relic.id];
      return "<span class=\"relic\"><strong>" + data.name + "</strong><small>" + data.description + "</small></span>";
    }).join("")
    : '<span class="muted">아직 기록물이 없습니다.</span>';
}

async function requestArchiveNote() {
  const text = document.getElementById("aiText");
  text.textContent = "기록을 읽는 중...";
  try {
    text.textContent = await askAI("로그라이크 게임의 현재 상황을 신비로운 기록 보관자의 말투로 한 문장만 해설해줘. 현재 층: " + gameState.floor + ", HP: " + gameState.hp + ", 기록물: " + gameState.relics.map(function (relic) { return RELIC_LIBRARY[relic.id].name; }).join(", "));
  } catch (error) {
    text.textContent = "기록 보관소에 연결하지 못했습니다.";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("playButton").addEventListener("click", playSelectedCard);
  document.getElementById("endTurnButton").addEventListener("click", endTurn);
  document.getElementById("restartButton").addEventListener("click", resetGame);
  document.getElementById("aiButton").addEventListener("click", requestArchiveNote);
});
