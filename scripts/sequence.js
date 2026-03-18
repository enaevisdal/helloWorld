/*
  SEQUENCE.JS — All logikk for Colour Sequence-spillet.

  Spillets gang:
  1. Vi viser 5 farger i tilfeldig rekkefølge, én om gangen
  2. Spilleren må klikke fargene i SAMME rekkefølge
  3. Riktig = neste nivå (flere farger). Feil = game over.

  Nytt konsept her: "async/await" — en måte å si
  "vent til dette er ferdig, SÅ gjør neste ting".
  Det bruker vi for å vise fargene med pauser mellom.
*/

// ==========================================
// SPILLDATA
// ==========================================

// De 5 fargene spilleren kan velge mellom
const sequenceColours = [
    { name: 'rød',    hex: '#e94560' },
    { name: 'blå',    hex: '#4361ee' },
    { name: 'grønn',  hex: '#0f9b58' },
    { name: 'gul',    hex: '#f0c929' },
    { name: 'lilla',  hex: '#9b5de5' }
];

let currentSequence = [];     // Sekvensen spilleren skal huske
let playerInput = [];         // Hva spilleren har klikket så langt
let sequenceLevel = 3;        // Starter med 3 farger, øker per runde
let sequenceRound = 1;        // Hvilken runde vi er på
let sequenceCanClick = false; // Kan spilleren klikke?

// ==========================================
// HIGH SCORE
// ==========================================

let sequenceInMemoryScores = [];

function sequenceHasStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

function sequenceGetScores() {
    if (sequenceHasStorage()) {
        const saved = localStorage.getItem('sequenceHighScores');
        return saved ? JSON.parse(saved) : [];
    }
    return sequenceInMemoryScores;
}

function sequenceSaveScore(level) {
    const scores = sequenceGetScores();
    scores.push({
        level: level,
        date: new Date().toLocaleDateString('no-NO')
    });
    // Sorter: høyest nivå først (mest er best)
    scores.sort(function(a, b) { return b.level - a.level; });
    const topFive = scores.slice(0, 5);

    if (sequenceHasStorage()) {
        localStorage.setItem('sequenceHighScores', JSON.stringify(topFive));
    } else {
        sequenceInMemoryScores = topFive;
    }
    return topFive;
}

function sequenceDisplayScores(newLevel) {
    const scores = sequenceGetScores();
    const container = document.getElementById('sequence-highscores');

    if (scores.length === 0) {
        container.innerHTML = '<p class="empty">Ingen resultater ennå. Spill en runde!</p>';
        return;
    }

    let html = '<ol>';
    scores.forEach(function(entry) {
        const isNew = (newLevel !== null && entry.level === newLevel);
        const cssClass = isNew ? ' class="new-score"' : '';
        html += '<li' + cssClass + '>'
            + 'Nivå ' + entry.level + ' — ' + entry.date
            + '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
}

// ==========================================
// HJELPEFUNKSJONER
// ==========================================

/**
 * "sleep" — venter et gitt antall millisekunder.
 * Brukes med "await" for å lage pauser.
 *
 * "Promise" er JavaScripts måte å håndtere ting som tar tid.
 * Tenk på det som: "Jeg lover å bli ferdig om X ms."
 */
function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

/** Genererer en tilfeldig sekvens med N farger */
function generateSequence(length) {
    const seq = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * sequenceColours.length);
        seq.push(randomIndex);
    }
    return seq;
}

// ==========================================
// VISNING
// ==========================================

/** Lager farge-knappene i HTML */
function createColourButtons() {
    const grid = document.getElementById('colour-grid');
    grid.innerHTML = '';

    sequenceColours.forEach(function(colour, index) {
        const btn = document.createElement('div');
        btn.classList.add('colour-btn');
        btn.style.backgroundColor = colour.hex;
        btn.dataset.index = index;

        btn.addEventListener('click', function() {
            handleColourClick(index);
        });

        grid.appendChild(btn);
    });
}

/** Lager prikkene som viser fremgang (uten å avsløre fargene!) */
function createSequenceDots() {
    const display = document.getElementById('sequence-display');
    display.innerHTML = '';

    currentSequence.forEach(function() {
        const dot = document.createElement('div');
        dot.classList.add('sequence-dot');
        // Ingen bakgrunnsfarge — prikkene er grå til spilleren klikker
        display.appendChild(dot);
    });
}

/** Lyser opp én farge-knapp */
function lightUpButton(colourIndex) {
    const buttons = document.querySelectorAll('.colour-btn');
    buttons[colourIndex].classList.add('lit');
}

/** Slukker alle farge-knapper */
function dimAllButtons() {
    const buttons = document.querySelectorAll('.colour-btn');
    buttons.forEach(function(btn) {
        btn.classList.remove('lit');
    });
}

/** Gjør knappene klikkbare (eller ikke) */
function setClickable(canClick) {
    const buttons = document.querySelectorAll('.colour-btn');
    buttons.forEach(function(btn) {
        if (canClick) {
            btn.classList.add('clickable');
        } else {
            btn.classList.remove('clickable');
        }
    });
}

// ==========================================
// SPILLFLYT
// ==========================================

/**
 * Viser sekvensen til spilleren, én farge om gangen.
 *
 * "async" betyr at funksjonen kan bruke "await" for å pause.
 * Uten dette ville alle fargene blinket samtidig!
 */
async function showSequence() {
    const status = document.getElementById('sequence-status');
    status.textContent = 'Se nøye!';
    sequenceCanClick = false;
    setClickable(false);

    await sleep(500);

    // Vis hver farge i sekvensen, én om gangen (kun knappene blinker)
    for (let i = 0; i < currentSequence.length; i++) {
        lightUpButton(currentSequence[i]);
        await sleep(800);   // Vis fargen i 0.8 sekunder
        dimAllButtons();
        await sleep(300);   // Kort pause mellom fargene
    }

    status.textContent = 'Din tur! Klikk fargene i riktig rekkefølge.';
    sequenceCanClick = true;
    setClickable(true);
}

/** Håndterer når spilleren klikker en farge */
function handleColourClick(colourIndex) {
    if (!sequenceCanClick) return;

    const position = playerInput.length;
    const dots = document.querySelectorAll('.sequence-dot');

    // Blink knappen kort
    lightUpButton(colourIndex);
    setTimeout(dimAllButtons, 200);

    if (colourIndex === currentSequence[position]) {
        // Riktig farge!
        dots[position].classList.add('correct');
        playerInput.push(colourIndex);

        if (playerInput.length === currentSequence.length) {
            // Hele sekvensen riktig — neste nivå!
            sequenceCanClick = false;
            setClickable(false);
            document.getElementById('sequence-status').textContent = 'Riktig! Neste nivå...';

            sequenceLevel++;
            sequenceRound++;

            setTimeout(function() {
                startSequenceRound();
            }, 1500);
        }
    } else {
        // Feil farge — game over!
        dots[position].classList.add('wrong');
        sequenceCanClick = false;
        setClickable(false);

        const finalLevel = sequenceLevel - 1;
        const status = document.getElementById('sequence-status');
        status.textContent = 'Feil! Du kom til nivå ' + finalLevel + '.';

        document.getElementById('sequence-result').style.display = 'block';
        document.getElementById('sequence-result').textContent =
            'Game over! Du husket ' + finalLevel + ' farger.';

        if (finalLevel > 0) {
            sequenceSaveScore(finalLevel);
            sequenceDisplayScores(finalLevel);
        }
    }
}

/** Starter en ny runde (genererer sekvens og viser den) */
function startSequenceRound() {
    playerInput = [];
    document.getElementById('sequence-result').style.display = 'none';
    document.getElementById('sequence-level').textContent =
        'Runde ' + sequenceRound + ' — husk ' + sequenceLevel + ' farger';

    currentSequence = generateSequence(sequenceLevel);
    createSequenceDots();
    showSequence();
}

/** Starter hele spillet fra begynnelsen */
function startSequence() {
    sequenceLevel = 3;
    sequenceRound = 1;
    createColourButtons();
    sequenceDisplayScores(null);
    startSequenceRound();
}
