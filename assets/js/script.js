// Full JavaScript Code for Solitaire Game

let deck = [], tableau = [], foundations = [[], [], [], []], stock = [], waste = [];
let selectedCard = null, selectedSource = null;
let history = [], future = [];
let time = 0, timerInterval, score = 0;
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value, color: suit === '♥' || suit === '♦' ? 'red' : 'black', faceUp: false });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCards() {
  tableau = Array.from({ length: 7 }, () => []);
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      tableau[j].push(deck.pop());
    }
  }
  tableau.forEach(pile => pile[pile.length - 1].faceUp = true);
  stock = deck;
  waste = [];
  foundations = [[], [], [], []];
}

function getTopCard(pile) {
  return pile.length ? pile[pile.length - 1] : null;
}

function renderTableau() {
  const row = document.getElementById('tableau-row');
  row.innerHTML = '';
  tableau.forEach((pile, pileIndex) => {
    const pileDiv = document.createElement('div');
    pileDiv.className = 'pile tableau';
    pileDiv.ondragover = e => e.preventDefault();
    pileDiv.ondrop = e => handleDrop(e, pileIndex);
    pile.forEach((card, cardIndex) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.style.top = `${cardIndex * 20}px`;
      if (!card.faceUp) {
        cardDiv.classList.add('face-down');
        cardDiv.textContent = '🁠';
      } else {
        cardDiv.textContent = `${card.value}${card.suit}`;
        if (card.color === 'red') cardDiv.classList.add('red');
        cardDiv.draggable = true;
        cardDiv.ondragstart = e => {
          selectedCard = card;
          selectedSource = { pile: tableau[pileIndex], index: cardIndex };
          e.dataTransfer.setData("text/plain", `${pileIndex}-${cardIndex}`);
        };
      }
      pileDiv.appendChild(cardDiv);
    });
    row.appendChild(pileDiv);
  });
}

function renderStock() {
  const stockDiv = document.getElementById('stock');
  stockDiv.innerHTML = '';
  const stockCard = getTopCard(stock);
  stockDiv.textContent = stockCard ? '🁠' : '↺';
  stockDiv.onclick = () => {
    if (stock.length) {
      const card = stock.pop();
      card.faceUp = true;
      waste.push(card);
    } else {
      stock = waste.reverse().map(c => ({ ...c, faceUp: false }));
      waste = [];
    }
    renderStock(); renderWaste(); saveState();
  };
}

function renderWaste() {
  const wasteDiv = document.getElementById('waste');
  wasteDiv.innerHTML = '';
  const topCard = getTopCard(waste);
  if (topCard) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.textContent = `${topCard.value}${topCard.suit}`;
    if (topCard.color === 'red') cardDiv.classList.add('red');
    cardDiv.draggable = true;
    cardDiv.ondragstart = e => {
      selectedCard = topCard;
      selectedSource = { pile: waste, index: waste.length - 1 };
      e.dataTransfer.setData("text/plain", `waste-${waste.length - 1}`);
    };
    wasteDiv.appendChild(cardDiv);
  }
}

function renderFoundations() {
  for (let i = 0; i < 4; i++) {
    const fDiv = document.getElementById(`foundation-${i}`);
    fDiv.innerHTML = '';
    const pile = foundations[i];
    const top = getTopCard(pile);
    if (top) {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.textContent = `${top.value}${top.suit}`;
      if (top.color === 'red') cardDiv.classList.add('red');
      cardDiv.ondragover = e => e.preventDefault();
      cardDiv.ondrop = e => handleFoundationDrop(e, i);
      fDiv.appendChild(cardDiv);
    } else {
      fDiv.textContent = 'A→K';
      fDiv.ondragover = e => e.preventDefault();
      fDiv.ondrop = e => handleFoundationDrop(e, i);
    }
  }
}

function isValidTableauMove(card, targetPile) {
  if (!targetPile.length) return card.value === 'K';
  const top = getTopCard(targetPile);
  return card.color !== top.color &&
    values.indexOf(card.value) === values.indexOf(top.value) - 1;
}

function isValidFoundationMove(card, pile) {
  if (!pile.length) return card.value === 'A';
  const top = getTopCard(pile);
  return card.suit === top.suit &&
    values.indexOf(card.value) === values.indexOf(top.value) + 1;
}

function handleDrop(e, targetIndex) {
  e.preventDefault();
  const [srcType, idx] = e.dataTransfer.getData("text").split("-");
  let srcPile = srcType === "waste" ? waste : tableau[parseInt(srcType)];
  const cardIdx = parseInt(idx);
  const moving = srcPile.splice(cardIdx);
  const targetPile = tableau[targetIndex];
  if (!isValidTableauMove(moving[0], targetPile)) {
    srcPile.push(...moving);
    return;
  }
  targetPile.push(...moving);
  const below = getTopCard(srcPile);
  if (below && !below.faceUp) below.faceUp = true;
  renderAll(); updateScore(5); saveState(); checkWin();
}

function handleFoundationDrop(e, foundationIndex) {
  const [srcType, idx] = e.dataTransfer.getData("text").split("-");
  let srcPile = srcType === "waste" ? waste : tableau[parseInt(srcType)];
  const cardIdx = parseInt(idx);
  const moving = srcPile.splice(cardIdx);
  const pile = foundations[foundationIndex];
  if (!isValidFoundationMove(moving[0], pile)) {
    srcPile.push(...moving);
    return;
  }
  pile.push(...moving);
  const below = getTopCard(srcPile);
  if (below && !below.faceUp) below.faceUp = true;
  renderAll(); updateScore(10); saveState(); checkWin();
}

function updateScore(pts) {
  score += pts;
  document.getElementById('score').textContent = score;
}

function startTimer() {
  clearInterval(timerInterval);
  time = 0;
  timerInterval = setInterval(() => {
    time++;
    document.getElementById('timer').textContent = time;
  }, 1000);
}

function saveState() {
  history.push(JSON.stringify({ tableau, foundations, stock, waste }));
  future = [];
}

function undo() {
  if (!history.length) return;
  future.push(JSON.stringify({ tableau, foundations, stock, waste }));
  const state = JSON.parse(history.pop());
  tableau = state.tableau;
  foundations = state.foundations;
  stock = state.stock;
  waste = state.waste;
  renderAll();
}

function redo() {
  if (!future.length) return;
  saveState();
  const state = JSON.parse(future.pop());
  tableau = state.tableau;
  foundations = state.foundations;
  stock = state.stock;
  waste = state.waste;
  renderAll();
}

function renderAll() {
  renderTableau(); renderStock(); renderWaste(); renderFoundations();
}

function checkWin() {
  const total = foundations.reduce((sum, pile) => sum + pile.length, 0);
  if (total === 52) setTimeout(() => alert("You win!"), 100);
}

function initGame() {
  createDeck();
  shuffleDeck();
  dealCards();
  score = 0;
  document.getElementById('score').textContent = score;
  renderAll();
  startTimer();
  saveState();
}

window.onload = initGame;