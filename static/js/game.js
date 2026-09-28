const CARD_LIBRARY = {
  strike: { name: "강타", icon: "⚔️", type: "direct", description: "적을 베어 피해를 줍니다. 중독된 적에게 추가 피해." },
  bleed: { name: "맹독", icon: "☠️", type: "damage-over-time", description: "3턴 동안 독 피해를 줍니다." },
  heal: { name: "치유", icon: "💚", type: "heal", description: "생명력을 회복합니다. 방어 중이면 회복량 증가." },
  shield: { name: "방패술", icon: "🛡️", type: "defense", description: "다음 몬스터 공격을 막을 방어도를 얻습니다." },
};

const NODE_TYPES = ["battle", "event", "battle", "shop", "elite", "battle"];
const NODE_LABELS = {
  battle: "전투",
  event: "수상한 조우",
  shop: "떠돌이 상인",
  elite: "정예 몬스터",
  boss: "던전 우두머리",
};
const NODE_ICONS = { battle: "⚔️", event: "❔", shop: "🧙", elite: "💀", boss: "👑" };

const BUILD_LIBRARY = {
  balanced: {
    name: "모험가",
    description: "공격·독·치유·방패를 고루 익힌 안정적인 초심자용 전법입니다.",
    passive: "고른 카드 구성",
    cards: { strike: 8, bleed: 8, heal: 8, shield: 8 },
  },
  assault: {
    name: "검투사",
    description: "강타 피해 +2. 공격 카드가 많아 몬스터를 빠르게 쓰러뜨립니다.",
    passive: "강타 피해 +2",
    strikeBonus: 2,
    cards: { strike: 14, bleed: 8, heal: 5, shield: 5 },
  },
  attrition: {
    name: "독술사",
    description: "맹독 피해 +1, 지속 시간 +1턴. 독을 쌓아 강적을 약화시킵니다.",
    passive: "맹독 피해 +1 · 지속 +1턴",
    bleedBonus: 1,
    bleedTurnsBonus: 1,
    cards: { strike: 6, bleed: 14, heal: 6, shield: 6 },
  },
  guardian: {
    name: "성기사",
    description: "방패술과 치유 효과 +2. 방어와 회복으로 긴 싸움에 강합니다.",
    passive: "방패술·치유 효과 +2",
    shieldBonus: 2,
    healBonus: 2,
    cards: { strike: 6, bleed: 4, heal: 11, shield: 11 },
  },
};

const RANKS = [
  { name: "견습 기록자", score: 0 },
  { name: "숙련 기록자", score: 1500 },
  { name: "왕국의 기록자", score: 4000 },
  { name: "전설의 기록자", score: 8000 },
  { name: "대륙의 대기록관", score: 14000 },
  { name: "대현자 기록자", score: 22000 },
];

const NODE_SCORE = { battle: 100, event: 80, shop: 60, elite: 180, boss: 300 };

const DIFFICULTIES = {
  1: { name: "I · 초심자의 숲", description: "몬스터가 약한 초심자용 던전입니다.", enemyHp: 1, enemyDamage: 1, reward: 1, curseChance: 0, scoreMultiplier: 1 },
  2: { name: "II · 잊힌 폐허", description: "몬스터의 체력과 공격력이 조금 높아집니다.", enemyHp: 1.15, enemyDamage: 1.1, reward: 1.15, curseChance: 0, scoreMultiplier: 1.25 },
  3: { name: "III · 저주받은 지하묘지", description: "강한 몬스터와 저주받은 유물이 등장합니다.", enemyHp: 1.3, enemyDamage: 1.2, reward: 1.3, curseChance: .35, scoreMultiplier: 1.5 },
  4: { name: "IV · 슬라임 왕의 둥지", description: "정예 왕관 슬라임과 저주의 위험이 큽니다.", enemyHp: 1.5, enemyDamage: 1.35, reward: 1.5, curseChance: .6, scoreMultiplier: 1.8 },
  5: { name: "V · 왕관 슬라임의 성채", description: "슬라임 왕국의 지배자가 기다립니다. 보상과 위험이 모두 큽니다.", enemyHp: 1.75, enemyDamage: 1.55, reward: 1.8, curseChance: .85, scoreMultiplier: 2.2 },
};

const RELIC_LIBRARY = {
  starMap: { name: "왕실 보급 인장", icon: "🪙", description: "전투 승리 시 금화 +5" },
  compass: { name: "마력 증폭 수정", icon: "🔮", description: "모든 카드 효과 +1" },
  archiveKey: { name: "상인의 황금 열쇠", icon: "🗝️", description: "전투 시작 시 금화 5개를 얻습니다." },
  inkStain: { name: "저주받은 흑요석", icon: "☠️", description: "전투 시작 시 생명력 3 감소 (저주)" },
  crackedSeal: { name: "부서진 방패", icon: "🛡️", description: "몬스터 공격력 +2 (저주)" },
  missingPage: { name: "봉인된 족쇄", icon: "⛓️", description: "전투 첫 차례 행동 횟수 -1 (저주)" },
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
  difficulty: null,
  buildId: null,
  runScore: 0,
  runEnded: false,
};

let aiRequestVersion = 0;
let activeGameScreen = "setupScreen";
let screenBeforeRecords = "setupScreen";

function showGameScreen(screenId) {
  activeGameScreen = screenId;
  document.querySelectorAll(".game-screen").forEach(function (screen) {
    const active = screen.id === screenId;
    screen.classList.toggle("active", active);
    screen.setAttribute("aria-hidden", active ? "false" : "true");
  });
  document.body.dataset.gameScreen = screenId;
}

function openRecords() {
  screenBeforeRecords = activeGameScreen;
  renderAdventureHistory();
  showGameScreen("recordsScreen");
}

function closeRecords() {
  showGameScreen(screenBeforeRecords);
}

function renderAdventureHistory() {
  const progress = loadPlayerProgress();
  const rank = getRankInfo(progress.totalScore);
  document.getElementById("recordsSummary").innerHTML =
    '<div><span>누적 명성</span><strong>✨ ' + progress.totalScore.toLocaleString("ko-KR") + '점</strong></div>' +
    '<div><span>현재 등급</span><strong>🏅 ' + rank.name + '</strong></div>' +
    '<div><span>떠난 모험</span><strong>🗺️ ' + progress.totalRuns + '회</strong></div>';

  let history = [];
  try {
    history = currentUser ? JSON.parse(localStorage.getItem("archive-game-history-" + currentUser.id) || "[]") : [];
  } catch (error) {
    console.error("모험 전적을 읽지 못했습니다:", error);
  }
  const list = document.getElementById("gameHistoryList");
  if (!history.length) {
    list.innerHTML = '<li class="muted">아직 떠난 모험이 없습니다. 지도를 펼쳐 첫 여정을 시작하세요.</li>';
    return;
  }
  list.innerHTML = history.map(function (run) {
    const relics = run.relics && run.relics.length ? run.relics.join(" · ") : "없음";
    return '<li class="game-history-item ' + (run.won ? "won" : "lost") + '">' +
      '<div class="game-history-title"><strong>' + (run.won ? "🏆 모험 완수" : "🪦 모험 실패") + '</strong><time>' + new Date(run.playedAt).toLocaleString("ko-KR") + '</time></div>' +
      '<span>' + run.difficulty + ' · ' + (run.build || "모험가") + ' · ' + run.floor + '층 도달</span>' +
      '<span>❤️ ' + run.hp + '/' + run.maxHp + '　🪙 ' + run.gold + '　✨ +' + (run.score || 0).toLocaleString("ko-KR") + '점 · ' + (run.rank || "견습 기록자") + '</span>' +
      '<small>유물: ' + relics + '</small>' +
      '</li>';
  }).join("");
}

function createCard(id, rank) {
  return { id: id, rank: rank, uid: id + "-" + rank + "-" + Math.random().toString(36).slice(2) };
}

function resetGame(difficultyId) {
  const difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES[1];
  gameState.difficulty = Number(difficultyId) || 1;
  gameState.floor = 1;
  gameState.hp = 30;
  gameState.maxHp = 30;
  gameState.gold = 0;
  gameState.runScore = 0;
  gameState.buildId = BUILD_LIBRARY[gameState.buildId] ? gameState.buildId : "balanced";
  gameState.map = createMap();
  gameState.currentNode = null;
  gameState.cardPool = [];
  const startingCards = BUILD_LIBRARY[gameState.buildId].cards;
  Object.keys(startingCards).forEach(function (cardId) {
    for (let index = 0; index < startingCards[cardId]; index += 1) {
      gameState.cardPool.push(createCard(cardId, 1));
    }
  });
  gameState.deck = [];
  gameState.hand = [];
  gameState.selectedCards = [];
  gameState.combat = null;
  gameState.event = null;
  gameState.shop = null;
  gameState.reward = null;
  gameState.relics = [];
  gameState.runEnded = false;
  aiRequestVersion += 1;
  document.getElementById("resultPanel").hidden = true;
  showGameScreen("mapScreen");
  renderAll();
}

function showDifficultySelect() {
  gameState.combat = null;
  gameState.event = null;
  gameState.reward = null;
  gameState.shop = null;
  document.getElementById("resultPanel").hidden = true;
  const choices = document.getElementById("difficultyChoices");
  choices.innerHTML = Object.keys(DIFFICULTIES).map(function (id) {
    const difficulty = DIFFICULTIES[id];
    return '<button class="difficulty-choice" data-difficulty="' + id + '" type="button"><strong>' + difficulty.name + '</strong><span>' + difficulty.description + '</span><small>✨ 명성 배율 ×' + difficulty.scoreMultiplier + '</small></button>';
  }).join("");
  choices.querySelectorAll("[data-difficulty]").forEach(function (button) {
    button.addEventListener("click", function () { resetGame(button.dataset.difficulty); });
  });
  renderBuildChoices();
  document.getElementById("difficultyContinueButton").disabled = !gameState.buildId;
  showGameScreen("setupScreen");
  renderAll();
}

function renderBuildChoices() {
  const choices = document.getElementById("buildChoices");
  choices.innerHTML = Object.keys(BUILD_LIBRARY).map(function (id) {
    const build = BUILD_LIBRARY[id];
    const selected = gameState.buildId === id ? " selected" : "";
    return '<button class="build-choice' + selected + '" data-build="' + id + '" type="button" aria-pressed="' + (gameState.buildId === id) + '">' +
      '<span class="build-icon" aria-hidden="true">' + (id === "balanced" ? "🧭" : id === "assault" ? "⚔️" : id === "attrition" ? "☠️" : "🛡️") + '</span>' +
      '<strong>' + build.name + '</strong><span>' + build.description + '</span><small>전법 · ' + build.passive + '</small>' +
      '<span class="build-selected-label">' + (gameState.buildId === id ? "선택됨" : "빌드 선택") + '</span></button>';
  }).join("");
  choices.querySelectorAll("[data-build]").forEach(function (button) {
    button.addEventListener("click", function () {
      gameState.buildId = button.dataset.build;
      renderBuildChoices();
      document.getElementById("difficultyContinueButton").disabled = false;
      document.getElementById("buildSelectionHint").textContent = "" + BUILD_LIBRARY[gameState.buildId].name + " 전법을 익힙니다.";
    });
  });
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
  showDifficultySelect();
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

function getProgressKey() {
  return currentUser ? "archive-game-progress-" + currentUser.id : null;
}

function loadPlayerProgress() {
  const key = getProgressKey();
  if (!key) return { totalScore: 0, totalRuns: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      totalScore: Number.isFinite(saved.totalScore) ? Math.max(0, saved.totalScore) : 0,
      totalRuns: Number.isFinite(saved.totalRuns) ? Math.max(0, saved.totalRuns) : 0,
    };
  } catch (error) {
    console.error("누적 점수 읽기 실패:", error);
    return { totalScore: 0, totalRuns: 0 };
  }
}

function getRankInfo(totalScore) {
  let index = 0;
  for (let rankIndex = 1; rankIndex < RANKS.length; rankIndex += 1) {
    if (totalScore < RANKS[rankIndex].score) break;
    index = rankIndex;
  }
  return { index: index, name: RANKS[index].name, score: RANKS[index].score };
}

function renderStats() {
  document.getElementById("floorValue").textContent = gameState.floor;
  document.getElementById("hpValue").textContent = gameState.hp + " / " + gameState.maxHp;
  document.getElementById("goldValue").textContent = gameState.gold;
  document.getElementById("runScoreValue").textContent = gameState.runScore.toLocaleString("ko-KR");
  document.getElementById("buildValue").textContent = BUILD_LIBRARY[gameState.buildId] ? BUILD_LIBRARY[gameState.buildId].name : "선택 전";
  const progress = loadPlayerProgress();
  const rank = getRankInfo(progress.totalScore);
  const nextRank = RANKS[rank.index + 1];
  document.getElementById("rankValue").textContent = rank.name;
  document.getElementById("totalScoreValue").textContent = progress.totalScore.toLocaleString("ko-KR");
  const progressFill = document.getElementById("rankProgressFill");
  const progressBar = progressFill.parentElement;
  if (nextRank) {
    const percentage = Math.min(100, Math.max(0, (progress.totalScore - rank.score) / (nextRank.score - rank.score) * 100));
    progressFill.style.width = percentage + "%";
    progressBar.setAttribute("aria-valuenow", Math.round(percentage));
    document.getElementById("rankProgressText").textContent = "다음 명성 등급까지 " + (nextRank.score - progress.totalScore).toLocaleString("ko-KR") + "점 · " + nextRank.name;
  } else {
    progressFill.style.width = "100%";
    progressBar.setAttribute("aria-valuenow", "100");
    document.getElementById("rankProgressText").textContent = "최고 명성 등급 달성";
  }
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
  map.innerHTML = '<div class="map-floor"><div class="map-floor-title"><span class="floor-label">🗺️ 던전 지도</span><strong>' + gameState.floor + "층</strong></div>" +
    stages.map(function (stageNodes, stageIndex) {
      const options = stageNodes.map(renderMapNode).join("");
      return '<div class="map-stage"><span class="stage-label">' + (stageIndex === stages.length - 1 ? "👑 관문" : "구역 " + (stageIndex + 1)) + '</span><div class="map-options">' + options + "</div></div>";
    }).join("") + "</div>";

  map.querySelectorAll(".map-node.available").forEach(function (button) {
    button.addEventListener("click", function () {
      selectNode(button.dataset.nodeId);
    });
  });
}

function renderMapNode(node) {
  const stateClass = node.cleared ? "cleared" : node.selected ? "selected" : node.locked ? "locked" : "available";
  const bossClass = node.type === "boss" ? " boss-node" : "";
  const statusLabel = node.selected ? "진행 중" : node.cleared ? "완료" : node.type === "boss" ? "최종 관문" : node.locked ? "잠김" : "진입 가능";
  return '<button class="map-node ' + stateClass + bossClass + '" data-node-id="' + node.id + '" type="button" ' +
    (node.locked || node.cleared ? "disabled" : "") + ">" +
    '<span class="node-floor node-floor-' + stateClass + '">' + statusLabel + "</span>" +
    '<strong><span class="ui-icon" aria-hidden="true">' + NODE_ICONS[node.type] + '</span> ' + NODE_LABELS[node.type] + "</strong></button>";
}

function selectNode(nodeId) {
  if (gameState.combat || (gameState.event && gameState.event.open) ||
      (gameState.shop && gameState.shop.open) || gameState.reward || gameState.runEnded) return;
  const node = gameState.map.flat().find(function (item) { return item.id === nodeId; });
  if (!node || node.locked || node.cleared || gameState.runEnded) return;
  gameState.currentNode = node;
  node.selected = true;
  node.locked = true;
  gameState.map[node.floor - 1].forEach(function (sibling) {
    if (sibling.stage === node.stage && sibling.id !== node.id) sibling.locked = true;
  });
  document.getElementById("nodeHint").textContent = NODE_ICONS[node.type] + " " + NODE_LABELS[node.type] + "에 들어섭니다.";

  if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
    startCombat(node);
    showGameScreen("combatScreen");
  } else if (node.type === "shop") {
    openShop();
    showGameScreen("shopScreen");
  } else {
    openEvent();
    showGameScreen("eventScreen");
  }
  renderAll();
  requestNodeStory("entry");
}

function openEvent() {
  gameState.event = { open: true };
  document.getElementById("nodeHint").textContent = "모험에 도움이 될 선택지를 고르세요.";
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
    '<button class="event-choice" data-event-choice="upgrade" type="button"><strong>⚒️ 숫돌로 연마</strong><span>카드 한 장을 한 등급 강화합니다.</span></button>' +
    '<button class="event-choice" data-event-choice="max-hp" type="button"><strong>💚 생명의 샘</strong><span>최대 생명력 +5, 생명력을 모두 회복합니다.</span></button>' +
    '<button class="event-choice" data-event-choice="relic" type="button"><strong>🪙 보급 상자</strong><span>금화 25개와 유물 하나를 얻습니다.</span></button>';
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
    '<button class="event-choice" data-reward-choice="upgrade" type="button"><strong>✨ 마법 각인</strong><span>선택한 카드 종류를 한 등급 강화합니다.</span></button>' +
    '<button class="event-choice" data-reward-choice="replace" type="button"><strong>🃏 전법 재정비</strong><span>덱의 카드 한 종류를 다른 전법으로 바꿉니다.</span></button>';
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
  choices.innerHTML = '<p class="event-subtitle">강화하거나 바꿀 전법을 선택하세요.</p>' + available.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="event-choice card-upgrade-choice" data-reward-card="' + card.id + '" type="button"><strong>' + base.icon + " " + base.name + "</strong><span>" + (rewardType === "upgrade" ? "모든 " + base.name + " 카드를 강화" : base.name + " 카드를 다른 전법으로 교체") + "</span></button>";
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
    document.getElementById("nodeHint").textContent = CARD_LIBRARY[cardType].name + " 전법이 강화되었습니다.";
  } else {
    const replacement = Object.keys(CARD_LIBRARY).find(function (id) { return id !== cardType; });
    gameState.cardPool.forEach(function (card) {
      if (card.id === cardType) {
        card.id = replacement;
        card.rank = 1;
      }
    });
    document.getElementById("nodeHint").textContent = CARD_LIBRARY[cardType].name + " 전법을 " + CARD_LIBRARY[replacement].name + " 전법으로 바꿨습니다.";
  }
  gameState.reward = null;
  showGameScreen("mapScreen");
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
    finishEvent("최대 생명력이 5 늘고 모두 회복했습니다.");
    return;
  }
  gameState.gold += 25;
  const relicId = getEventRelic();
  addRelic(relicId);
  finishEvent("🪙 금화 25개와 유물 " + RELIC_LIBRARY[relicId].name + "을 얻었습니다. " + RELIC_LIBRARY[relicId].description);
}

function showUpgradeChoices() {
  const choices = document.getElementById("eventChoices");
  const candidates = [];
  gameState.cardPool.forEach(function (card) {
    if (card.rank >= 3 || candidates.some(function (item) { return item.id === card.id; })) return;
    candidates.push(card);
  });
  if (candidates.length === 0) {
    choices.innerHTML = '<p class="muted">강화할 수 있는 전법이 없습니다. 다른 선택을 고르세요.</p>';
    return;
  }
  choices.innerHTML = '<p class="event-subtitle">강화할 전법을 선택하세요.</p>' + candidates.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="event-choice card-upgrade-choice" data-card-type="' + card.id + '" type="button"><strong>' + base.icon + " " + base.name + " " + card.rank + "등급</strong><span>이 카드 한 장을 " + (card.rank + 1) + "등급으로 강화</span></button>";
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
  finishEvent(CARD_LIBRARY[cardType].name + " 전법 한 장을 " + target.rank + "등급으로 강화했습니다.");
}

function finishEvent(message) {
  gameState.event = null;
  completeNode(message);
  showGameScreen("mapScreen");
  renderAll();
}

function openShop() {
  gameState.shop = { open: true, purchased: {} };
  document.getElementById("nodeHint").textContent = "🪙 금화로 장비와 마법 물품을 거래하세요.";
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
    '<button class="shop-item" data-shop-choice="upgrade" type="button"><strong>⚒️ 전법 연마 · 🪙 25</strong><span>카드 한 장을 한 등급 강화합니다.</span></button>' +
    '<button class="shop-item" data-shop-choice="max-hp" type="button"><strong>❤️ 생명력 증폭 · 🪙 30</strong><span>최대 생명력 +5, 생명력도 회복합니다.</span></button>' +
    '<button class="shop-item" data-shop-choice="relic" type="button"><strong>🔮 마력 증폭 수정 · 🪙 20</strong><span>모든 카드 효과가 강해지는 유물입니다.</span></button>' +
    '<button class="shop-leave" data-shop-choice="leave" type="button">길을 떠난다</button>';
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
    showGameScreen("mapScreen");
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
    document.getElementById("shopMessage").textContent = "최대 생명력이 5 늘고 모두 회복했습니다.";
  } else {
    addRelic("compass");
    document.getElementById("shopMessage").textContent = "마력 증폭 수정을 손에 넣었습니다.";
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
  choices.innerHTML = '<p class="event-subtitle">🪙 25개로 강화할 전법을 선택하세요.</p>' + candidates.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    return '<button class="shop-item" data-shop-card="' + card.id + '" type="button"><strong>' + base.icon + " " + base.name + " " + card.rank + "등급</strong><span>" + (card.rank + 1) + "등급으로 강화</span></button>";
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
  document.getElementById("shopMessage").textContent = CARD_LIBRARY[cardType].name + " 전법을 강화했습니다.";
  renderShop();
  renderAll();
}

function startCombat(node) {
  const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1];
  const boss = node.type === "boss";
  const firstFloorBoss = boss && node.floor === 1;
  gameState.hp = gameState.maxHp;
  gameState.deck = gameState.cardPool.map(function (card) {
    return createCard(card.id, card.rank);
  });
  gameState.hand = [];
  gameState.selectedCards = [];
  const baseHp = firstFloorBoss ? 32 : boss ? 45 : node.type === "elite" ? 28 : 18;
  const baseDamage = firstFloorBoss ? 5 : boss ? 8 : node.type === "elite" ? 6 : 4;
  gameState.combat = {
    enemyName: boss ? (firstFloorBoss ? "왕관 슬라임 대왕" : "슬라임 왕국의 수호자") : node.type === "elite" ? "정예 왕관 슬라임" : "왕관 슬라임",
    enemyHp: Math.round(baseHp * difficulty.enemyHp),
    enemyMaxHp: Math.round(baseHp * difficulty.enemyHp),
    enemyDamage: Math.round(baseDamage * difficulty.enemyDamage),
    block: 0,
    damageOverTime: 0,
    damageOverTimeTurns: 0,
    actionsRemaining: hasRelic("missingPage") ? 1 : 2,
    lastEnemyAction: "아직 움직이지 않았습니다.",
    enemyBlock: 0,
    enemyIntent: "attack",
    enemyTurnCount: 0,
    turn: "player",
  };
  if (hasRelic("inkStain")) gameState.hp = Math.max(1, gameState.hp - 3);
  if (hasRelic("archiveKey")) gameState.gold += 5;
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
    panel.classList.remove("enemy-turn-active", "enemy-action-active");
    return;
  }
  panel.hidden = false;
  document.getElementById("enemyName").textContent = gameState.combat.enemyName;
  document.getElementById("enemyLabel").textContent = gameState.combat.enemyName;
  document.getElementById("enemyHp").textContent = "❤️ " + gameState.combat.enemyHp + " / " + gameState.combat.enemyMaxHp;
  document.getElementById("enemyBarFill").style.width = Math.max(0, gameState.combat.enemyHp / gameState.combat.enemyMaxHp * 100) + "%";
  const playerTurn = gameState.combat.turn === "player";
  panel.classList.toggle("enemy-turn-active", !playerTurn);
  if (playerTurn) panel.classList.remove("enemy-action-active");
  document.getElementById("turnIndicator").textContent = playerTurn ? "기록자 차례" : "몬스터 차례";
  document.getElementById("turnIndicator").className = playerTurn ? "player-turn" : "enemy-turn";
  document.getElementById("actionCounter").textContent = playerTurn ? "⚡ 행동 " + gameState.combat.actionsRemaining + " / 2" : "👹 " + gameState.combat.enemyName + "의 행동";
  document.getElementById("turnOrder").textContent = playerTurn ? "행동 2회 후 몬스터 공격" : "몬스터 행동 후 기록자 차례";
  document.getElementById("playerHp").textContent = "❤️ " + gameState.hp + " / " + gameState.maxHp;
  document.getElementById("playerBarFill").style.width = Math.max(0, gameState.hp / gameState.maxHp * 100) + "%";
  document.getElementById("playerBlock").textContent = "🛡️ 방어도 " + gameState.combat.block;
  document.getElementById("enemyIntent").textContent = playerTurn ? getEnemyIntentText() : "준비 중 · " + getEnemyIntentText();
  document.getElementById("enemyAction").textContent = gameState.combat.lastEnemyAction;
  document.getElementById("selectionHint").textContent = playerTurn ? "같은 카드가 이웃하면 자동 합성 · 끌어 놓아 직접 합성" : "몬스터가 행동하고 있습니다.";
  document.getElementById("playButton").disabled = !playerTurn || gameState.selectedCards.length !== 1;
  document.getElementById("endTurnButton").disabled = !playerTurn;
}

function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = gameState.hand.map(function (card) {
    const base = CARD_LIBRARY[card.id];
    const selected = gameState.selectedCards.includes(card.uid) ? " selected" : "";
    return '<button class="play-card ' + base.type + selected + '" data-card-id="' + card.uid + '" type="button" draggable="true" aria-label="' + base.name + " " + card.rank + "등급. " + base.description + " " + getCardValue(card) + (card.id === "heal" ? " 회복" : card.id === "shield" ? " 방어" : " 피해") + '" title="' + base.description + ' 같은 카드끼리 끌어 합성할 수 있습니다">' +
      '<span class="card-rank">' + card.rank + "등급</span>" +
      '<strong><span class="card-icon" aria-hidden="true">' + base.icon + '</span> ' + base.name + "</strong>" +
      '<span>' + getCardValue(card) + (card.id === "heal" ? " 회복" : card.id === "shield" ? " 방어" : " 피해") + "</span>" +
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
  const build = BUILD_LIBRARY[gameState.buildId] || BUILD_LIBRARY.balanced;
  if (card.id === "shield") return 5 * card.rank + bonus + (build.shieldBonus || 0);
  if (card.id === "heal") return 6 * card.rank + bonus + (gameState.combat && gameState.combat.block > 0 ? 2 : 0) + (build.healBonus || 0);
  if (card.id === "bleed") return 3 * card.rank + bonus + (build.bleedBonus || 0);
  return 7 * card.rank + bonus + (build.strikeBonus || 0);
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
    actionMessage = CARD_LIBRARY[card.id].name + "으로 방어도 " + value + "을 얻었습니다.";
  } else if (card.id === "heal") {
    const healed = Math.min(value, gameState.maxHp - gameState.hp);
    gameState.hp += healed;
    actionMessage = CARD_LIBRARY[card.id].name + "으로 생명력 " + healed + "을 회복했습니다.";
  } else if (card.id === "bleed") {
    gameState.combat.damageOverTime = value;
    gameState.combat.damageOverTimeTurns = 3 + (BUILD_LIBRARY[gameState.buildId].bleedTurnsBonus || 0);
    actionMessage = CARD_LIBRARY[card.id].name + "이(가) 매 차례 독 피해 " + value + "을 남깁니다.";
  } else {
    const synergyBonus = gameState.combat.damageOverTimeTurns > 0 ? 3 : 0;
    const dealt = Math.max(0, value + synergyBonus - gameState.combat.enemyBlock);
    gameState.combat.enemyHp -= dealt;
    gameState.combat.enemyBlock = 0;
    actionMessage = CARD_LIBRARY[card.id].name + "으로 " + dealt + " 피해를 입혔습니다." + (synergyBonus ? " 독 연계 추가 피해!" : "");
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
  enemyTurn("행동을 마치고 몬스터에게 차례를 넘겼습니다.");
  renderAll();
}

async function enemyTurn(playerAction) {
  if (!gameState.combat) return;
  gameState.combat.turn = "enemy";
  document.getElementById("combatLog").textContent = playerAction + " " + gameState.combat.enemyName + "이(가) 행동을 준비합니다...";
  renderAll();
  await new Promise(function (resolve) { setTimeout(resolve, 850); });
  if (!gameState.combat || gameState.combat.turn !== "enemy") return;

  let damageOverTimeMessage = "";
  if (gameState.combat.damageOverTimeTurns > 0) {
    gameState.combat.enemyHp -= gameState.combat.damageOverTime;
    gameState.combat.damageOverTimeTurns -= 1;
    damageOverTimeMessage = " 지속 피해 " + gameState.combat.damageOverTime + " 적용.";
    if (gameState.combat.enemyHp <= 0) {
      checkCombatEnd();
      renderAll();
      return;
    }
  }
  const intent = gameState.combat.enemyIntent;
  const intentText = getEnemyIntentText();
  const combatPanel = document.getElementById("combatPanel");
  combatPanel.classList.add("enemy-action-active");
  document.getElementById("enemyIntent").textContent = "💥 " + intentText + "!";
  document.getElementById("combatLog").textContent = gameState.combat.enemyName + "이(가) " + intentText + "!";
  renderAll();
  await new Promise(function (resolve) { setTimeout(resolve, 220); });
  combatPanel.classList.remove("enemy-action-active");
  if (!gameState.combat || gameState.combat.turn !== "enemy") return;

  let damage = 0;
  if (intent === "block") {
    gameState.combat.enemyBlock = 8;
    gameState.combat.lastEnemyAction = "방어 태세를 취해 방어도 8을 얻었습니다.";
  } else {
    const multiplier = intent === "charge" ? 2 : 1;
    const curseBonus = hasRelic("crackedSeal") ? 2 : 0;
    damage = Math.max(0, (gameState.combat.enemyDamage + curseBonus) * multiplier - gameState.combat.block);
    gameState.hp -= damage;
    gameState.combat.lastEnemyAction = intent === "charge" ? "강력한 일격으로 " + damage + " 피해를 입혔습니다." : "공격해 " + damage + " 피해를 입혔습니다.";
  }
  gameState.combat.block = 0;
  if (damageOverTimeMessage) gameState.combat.lastEnemyAction += damageOverTimeMessage;
  gameState.selectedCards = [];
  if (gameState.hp <= 0) {
    endRun(false, "생명력을 모두 잃었습니다. 이번 모험은 여기서 끝납니다.");
    return;
  }
  maintainHand();
  gameState.combat.enemyTurnCount += 1;
  gameState.combat.enemyIntent = ["attack", "block", "charge"][gameState.combat.enemyTurnCount % 3];
  gameState.combat.actionsRemaining = hasRelic("missingPage") ? 1 : 2;
  gameState.combat.turn = "player";
  document.getElementById("combatLog").textContent = playerAction + damageOverTimeMessage + " 몬스터에게 " + damage + " 피해를 받았습니다. 기록자 차례입니다.";
  renderAll();
}

function checkCombatEnd() {
  if (gameState.combat.enemyHp > 0) return;
  const node = gameState.currentNode;
  const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1];
  const reward = Math.round((node.type === "boss" ? 40 : node.type === "elite" ? 20 : 10) * difficulty.reward) +
    (gameState.relics.some(function (relic) { return relic.id === "starMap"; }) ? 5 : 0);
  const defeatedEnemy = gameState.combat.enemyName;
  gameState.gold += reward;
  gameState.combat = null;
  const finalBoss = node.type === "boss" && node.floor === 3;
  completeNode((finalBoss ? "던전의 지배자를 물리쳤습니다." : node.type === "boss" ? "층의 수호자를 물리쳤습니다." : "몬스터를 물리쳤습니다.") + " 🪙 금화 " + reward + "개를 얻었습니다.");
  if (finalBoss) endRun(true, "세 층의 던전을 돌파하고 왕관 슬라임 대왕을 물리쳤습니다!");
  else {
    gameState.reward = { open: true };
    document.getElementById("rewardTitle").textContent = "🏆 전투 승리!";
    document.getElementById("rewardText").textContent = "쓰러뜨린 몬스터: " + defeatedEnemy + ". 🪙 금화 " + reward + "개를 얻었습니다. 전리품을 선택하세요.";
    document.getElementById("nodeHint").textContent = "전투 보상을 선택하세요.";
    showGameScreen("rewardScreen");
  }
}

function getEnemyIntentText() {
  if (!gameState.combat) return "";
  const curseBonus = hasRelic("crackedSeal") ? 2 : 0;
  if (gameState.combat.enemyIntent === "block") return "🛡️ 방어 태세 · 방어도 8";
  if (gameState.combat.enemyIntent === "charge") return "💥 강한 일격 · 피해 " + ((gameState.combat.enemyDamage + curseBonus) * 2);
  return "⚔️ 공격 · 피해 " + (gameState.combat.enemyDamage + curseBonus);
}

function completeNode(message) {
  const current = gameState.currentNode;
  const points = awardNodeScore(current);
  current.cleared = true;
  current.selected = false;
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
  document.getElementById("nodeHint").textContent = message + " · +" + points.toLocaleString("ko-KR") + "점";
  requestNodeStory("outcome", message);
}

function awardNodeScore(node) {
  const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1];
  const baseScore = (NODE_SCORE[node.type] || 0) + (node.floor - 1) * 25;
  const points = Math.round(baseScore * difficulty.scoreMultiplier);
  gameState.runScore += points;
  return points;
}

function endRun(won, message) {
  if (gameState.runEnded) return;
  gameState.runEnded = true;
  if (won) {
    const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1];
    gameState.runScore += Math.round(500 * difficulty.scoreMultiplier);
  }
  const progress = saveGameResult(won, message);
  const resultPanel = document.getElementById("resultPanel");
  resultPanel.classList.toggle("is-victory", won);
  resultPanel.classList.toggle("is-defeat", !won);
  document.getElementById("resultTitle").textContent = won ? "🏆 전투 승리 · 모험 완수!" : "💔 전투 패배 · 모험 실패";
  document.getElementById("resultText").textContent = message;
  const scoreResult = document.getElementById("scoreResult");
  if (progress) {
    const previousRank = getRankInfo(progress.previousScore);
    const currentRank = getRankInfo(progress.totalScore);
    scoreResult.textContent = "+" + gameState.runScore.toLocaleString("ko-KR") + "점";
    document.getElementById("finalTotalScore").textContent = progress.totalScore.toLocaleString("ko-KR") + "점";
    document.getElementById("finalRank").textContent = currentRank.name;
    const rankUpNotice = document.getElementById("rankUpNotice");
    rankUpNotice.hidden = currentRank.index <= previousRank.index;
    rankUpNotice.textContent = rankUpNotice.hidden ? "" : "랭크 상승! " + previousRank.name + " → " + currentRank.name;
  } else {
    scoreResult.textContent = "+" + gameState.runScore.toLocaleString("ko-KR") + "점";
    document.getElementById("finalTotalScore").textContent = "로그인 후 기록 가능";
    document.getElementById("finalRank").textContent = "-";
    document.getElementById("rankUpNotice").hidden = true;
  }
  resultPanel.hidden = false;
  gameState.combat = null;
  showGameScreen("resultScreen");
  renderStats();
  requestNodeStory("run-ended", message);
}

function saveGameResult(won, message) {
  if (!currentUser) return;
  const progressKey = getProgressKey();
  const progress = loadPlayerProgress();
  const previousScore = progress.totalScore;
  progress.totalScore += gameState.runScore;
  progress.totalRuns += 1;
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } catch (error) {
    console.error("누적 점수 저장 실패:", error);
  }

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
    difficulty: DIFFICULTIES[gameState.difficulty].name,
    floor: gameState.floor,
    hp: Math.max(0, gameState.hp),
    maxHp: gameState.maxHp,
    gold: gameState.gold,
    score: gameState.runScore,
    totalScore: progress.totalScore,
    build: BUILD_LIBRARY[gameState.buildId].name,
    rank: getRankInfo(progress.totalScore).name,
    relics: gameState.relics.map(function (relic) { return RELIC_LIBRARY[relic.id].name; }),
    playedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
  } catch (error) {
    console.error("플레이 기록 저장 실패:", error);
  }
  progress.previousScore = previousScore;
  return progress;
}

function addRelic(id) {
  if (gameState.relics.some(function (relic) { return relic.id === id; })) return;
  gameState.relics.push({ id: id });
}

function hasRelic(id) {
  return gameState.relics.some(function (relic) { return relic.id === id; });
}

function getEventRelic() {
  const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1];
  const cursed = ["inkStain", "crackedSeal", "missingPage"];
  const helpful = ["starMap", "compass", "archiveKey"];
  const pool = Math.random() < difficulty.curseChance ? cursed : helpful;
  const available = pool.filter(function (id) { return !hasRelic(id); });
  return available.length ? available[Math.floor(Math.random() * available.length)] : pool[Math.floor(Math.random() * pool.length)];
}

function renderRelics() {
  document.getElementById("relics").innerHTML = gameState.relics.length
    ? gameState.relics.map(function (relic) {
      const data = RELIC_LIBRARY[relic.id];
      return "<span class=\"relic\"><strong><span class=\"relic-icon\" aria-hidden=\"true\">" + data.icon + "</span> " + data.name + "</strong><small>" + data.description + "</small></span>";
    }).join("")
    : '<span class="muted">아직 발견한 유물이 없습니다.</span>';
}

function buildStoryContext(phase, outcome) {
  const node = gameState.currentNode;
  return {
    phase: phase,
    outcome: outcome || "",
    floor: gameState.floor,
    node: node ? { type: NODE_LABELS[node.type], stage: node.stage + 1 } : null,
    difficulty: (DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1]).name,
    player: { hp: gameState.hp, maxHp: gameState.maxHp, gold: gameState.gold },
    relics: gameState.relics.map(function (relic) { return RELIC_LIBRARY[relic.id].name; }),
    enemy: gameState.combat ? {
      name: gameState.combat.enemyName,
      hp: gameState.combat.enemyHp,
      maxHp: gameState.combat.enemyMaxHp,
      lastAction: gameState.combat.lastEnemyAction,
    } : null,
  };
}

async function requestContextualAI(task, context, buttonId) {
  const version = ++aiRequestVersion;
  const text = document.getElementById("aiText");
  const button = buttonId ? document.getElementById(buttonId) : null;
  const originalLabel = button ? button.textContent : "";
  if (button) {
    button.disabled = true;
    button.textContent = "현자가 살펴보는 중...";
  }
  text.textContent = task === "story" ? "현자가 상황을 살피는 중..." : "현자가 조언을 고르는 중...";
  try {
    const answer = await askAI({ task: task, context: context });
    if (version === aiRequestVersion) text.textContent = answer;
  } catch (error) {
    if (version === aiRequestVersion) text.textContent = "현자와 연락이 닿지 않습니다. 잠시 후 다시 시도해 주세요.";
    console.error("게임 AI 요청 실패:", error);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function requestNodeStory(phase, outcome) {
  requestContextualAI("story", buildStoryContext(phase, outcome));
}

function requestPathAdvice() {
  const availableNodes = (gameState.map[gameState.floor - 1] || []).filter(function (node) {
    return !node.locked && !node.cleared;
  }).map(function (node) {
    return { type: NODE_LABELS[node.type], stage: node.stage + 1 };
  });
  requestContextualAI("path-assist", {
    floor: gameState.floor,
    difficulty: (DIFFICULTIES[gameState.difficulty] || DIFFICULTIES[1]).name,
    hp: gameState.hp,
    maxHp: gameState.maxHp,
    gold: gameState.gold,
    relics: gameState.relics.map(function (relic) { return RELIC_LIBRARY[relic.id].name; }),
    availableNodes: availableNodes,
  }, "pathAssistButton");
}

function requestCombatAdvice() {
  if (!gameState.combat || gameState.combat.turn !== "player") return;
  requestContextualAI("combat-assist", {
    floor: gameState.floor,
    hp: gameState.hp,
    maxHp: gameState.maxHp,
    block: gameState.combat.block,
    actionsRemaining: gameState.combat.actionsRemaining,
    enemy: {
      name: gameState.combat.enemyName,
      hp: gameState.combat.enemyHp,
      intent: getEnemyIntentText(),
      block: gameState.combat.enemyBlock,
      damageOverTime: gameState.combat.damageOverTime,
      damageOverTimeTurns: gameState.combat.damageOverTimeTurns,
    },
    hand: gameState.hand.map(function (card) {
      return {
        name: CARD_LIBRARY[card.id].name,
        rank: card.rank,
        value: getCardValue(card),
        description: CARD_LIBRARY[card.id].description,
        selected: gameState.selectedCards.includes(card.uid),
      };
    }),
  }, "combatAssistButton");
}

function requestArchiveNote() {
  requestNodeStory("run-summary", "현재 상태를 바탕으로 지금 가장 중요한 조언 하나를 알려 주세요.");
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("playButton").addEventListener("click", playSelectedCard);
  document.getElementById("endTurnButton").addEventListener("click", endTurn);
  document.getElementById("restartButton").addEventListener("click", showDifficultySelect);
  document.getElementById("aiButton").addEventListener("click", requestArchiveNote);
  document.getElementById("pathAssistButton").addEventListener("click", requestPathAdvice);
  document.getElementById("combatAssistButton").addEventListener("click", requestCombatAdvice);
  document.getElementById("recordsButton").addEventListener("click", openRecords);
  document.getElementById("recordsBackButton").addEventListener("click", closeRecords);
  document.getElementById("difficultyContinueButton").addEventListener("click", function () {
    if (!gameState.buildId) return;
    showGameScreen("difficultyScreen");
  });
  document.getElementById("difficultyBackButton").addEventListener("click", function () {
    showGameScreen("setupScreen");
  });
});
