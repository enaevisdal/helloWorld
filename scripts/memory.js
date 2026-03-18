/*
  MEMORY.JS — All logikk for memory-kortspillet.

  Denne filen er "koblet fra" HTML-en. Den vet ikke noe om
  de andre spillene — den gjør bare sin egen jobb.

  HTML-filen laster denne med: <script src="scripts/memory.js">
  Det er som å si "hent oppskriften fra denne filen".
*/

// ==========================================
// SPILLDATA
// ==========================================

const memorySymbols = ['🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🐨', '🦁'];

let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = 0;
let memoryAttempts = 0;
let memoryTotalPairs = memorySymbols.length;
let memoryLocked = false;

// ==========================================
// HIGH SCORE (med localStorage + fallback)
// ==========================================

let memoryInMemoryScores = [];

function memoryHasStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

function memoryGetScores() {
    if (memoryHasStorage()) {
        const saved = localStorage.getItem('memoryHighScores');
        return saved ? JSON.parse(saved) : [];
    }
    return memoryInMemoryScores;
}

function memorySaveScore(score) {
    const scores = memoryGetScores();
    scores.push({
        attempts: score,
        date: new Date().toLocaleDateString('no-NO')
    });
    scores.sort(function(a, b) { return a.attempts - b.attempts; });
    const topFive = scores.slice(0, 5);

    if (memoryHasStorage()) {
        localStorage.setItem('memoryHighScores', JSON.stringify(topFive));
    } else {
        memoryInMemoryScores = topFive;
    }
    return topFive;
}

function memoryDisplayScores(newScore) {
    const scores = memoryGetScores();
    const container = document.getElementById('memory-highscores');

    if (scores.length === 0) {
        container.innerHTML = '<p class="empty">Ingen resultater ennå. Spill en runde!</p>';
        return;
    }

    let html = '<ol>';
    scores.forEach(function(entry) {
        const isNew = (newScore !== null && entry.attempts === newScore);
        const cssClass = isNew ? ' class="new-score"' : '';
        html += '<li' + cssClass + '>'
            + entry.attempts + ' forsøk — ' + entry.date
            + '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
}

// ==========================================
// SPILLFUNKSJONER
// ==========================================

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startMemory() {
    memoryMatched = 0;
    memoryAttempts = 0;
    memoryFlipped = [];
    memoryLocked = false;

    document.getElementById('memory-attempts').textContent = '0';
    document.getElementById('memory-matches').textContent = '0';
    document.getElementById('memory-total').textContent = memoryTotalPairs;
    document.getElementById('memory-result').style.display = 'none';

    memoryCards = shuffle([...memorySymbols, ...memorySymbols]);

    const board = document.getElementById('memory-board');
    board.innerHTML = '';

    memoryCards.forEach(function(symbol, index) {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.textContent = '?';

        card.addEventListener('click', function() {
            flipMemoryCard(card);
        });

        board.appendChild(card);
    });

    memoryDisplayScores(null);
}

function flipMemoryCard(card) {
    if (memoryLocked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    card.textContent = card.dataset.symbol;
    card.classList.add('flipped');
    memoryFlipped.push(card);

    if (memoryFlipped.length === 2) {
        memoryAttempts++;
        document.getElementById('memory-attempts').textContent = memoryAttempts;

        const [card1, card2] = memoryFlipped;

        if (card1.dataset.symbol === card2.dataset.symbol) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            memoryMatched++;
            document.getElementById('memory-matches').textContent = memoryMatched;
            memoryFlipped = [];

            if (memoryMatched === memoryTotalPairs) {
                document.getElementById('memory-result').style.display = 'block';
                memorySaveScore(memoryAttempts);
                memoryDisplayScores(memoryAttempts);
            }
        } else {
            memoryLocked = true;
            setTimeout(function() {
                card1.textContent = '?';
                card1.classList.remove('flipped');
                card2.textContent = '?';
                card2.classList.remove('flipped');
                memoryFlipped = [];
                memoryLocked = false;
            }, 800);
        }
    }
}
