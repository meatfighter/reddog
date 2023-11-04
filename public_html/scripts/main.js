class ArrayShuffler {
    
    #array;
    #index;
    #shuffleLength;
    #shuffleThreshold;
    
    constructor(array, shuffleLength, shuffleThreshold) {
        this.#array = array;
        this.#index = array.length;
        this.#shuffleLength = shuffleLength ? shuffleLength : array.length;
        this.#shuffleThreshold = shuffleThreshold ? shuffleThreshold : array.length;
    }

    next() {
        if (this.#index >= this.#shuffleThreshold) {
            this.shuffle();
            this.#index = 0;
        }
        return this.#array[this.#index++];
    }

    #shuffle() {
        for (let i = this.#shuffleLength - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.#array[i], this.#array[j]] = [this.#array[j], this.#array[i]];
        }
    }
}

const winPhrases = new ArrayShuffler([
    'Congratulations!',
    'Winner, winner, chicken dinner!',
    'You\'ve done it!',
    'Winning hand!',
    'Well played!',
    'Lucky you!',
    'You\'ve won!',
    'You\'ve struck gold!',
    'Bingo!',
    'You\'re a winner!',
    'Well done!',
    'Keep it up!',
    'You\'re on a roll!',
    'A clear win!',
    'Luck is on your side!',
    'Nice play!',
    'A win in the cards!',
    'It\s a win!',
    'You\re doing great!'
]);

const tiePhrases = new ArrayShuffler([
    'Push.',
    'Tie.',
    'Draw.',
    'It\s a push.',
    'It\s a tie.',
    'It\s a draw.',
    'We have a push.',
    'We have a tie.',
    'We have a draw.',
    'The game\s a tie.',
    'The game\s a draw.',    
    'No winners or losers.',    
    'No losses or wins.',
    'It\s a stand-off.',
    'No change in balance.',
    'Your bet is returned.',
    'Your wager is returned.',
    'Take back your bet.',
    'Take back your wager.'
]);

const losePhrases = new ArrayShuffler([
    'Better luck next time.',
    'Unlucky hand.',
    'Tough break.',
    'It\'s all part of the game.',
    'You\'ll get it next time.',
    'Unfortunately, it\'s a loss.',
    'Not your time.',
    'It\'s all part of the thrill.',
    'No worries, there\'s more to come.',
    'Keep playing, luck can turn.',
    'Hard luck.',
    'More chances ahead.',
    'Stay in. The game\'s not over yet.',
    'Please try again.',
    'Sorry.',
    'Not in the cards.',
    'Nope.',
    'Perhaps next time.',
    'It\s a loss.',
    'Too bad.'
]);

const Panels = {    
    BET: 'bet-panel',
    CONTINUE: 'continue-panel',    
    LOADING: 'loading-panel',
    MAIN: 'main-panel',
    RAISE: 'raise-panel'
};

const State = {
    BETTING: 0,
    RAISING: 1,
    CONTINUING: 2
};

const MAX_FETCH_RETRIES = 5;

const BACK = 52;

const info = {
    balance: 0,
    bet: '--',
    win: '--',
    spread: '--',
    pays: '--'
};

let state = State.BETTING;
let svgCards;

async function fetchContent(url, options = {}, responseType = 'text') {
    for (let i = MAX_FETCH_RETRIES - 1; i >= 0; --i) {
        try {
            let response = await fetch(url, options);
            if (response.ok) {
                switch (responseType) {
                    case 'arrayBuffer':
                        return await response.arrayBuffer();
                    case 'blob':
                        return await response.blob();
                    case 'json':
                        return await response.json();
                    default:
                        return await response.text();                        
                }                
            }
        } catch (error) {
            if (i === 0) {
                throw error;
            }
        }
    }
    throw new Error("Failed to fetch.");
}

//function makeSameWidth(maxWidthId, ...ids) {
//    const width = document.getElementById(maxWidthId).clientWidth + 'px';
//    ids.forEach(id => document.getElementById(id).style.width = width);
//}

function downloadPanels() {
    Promise.all(Object.values(Panels).map(name => fetchContent(`${name}.html`))).then(panels => handlePanels(panels))
            .catch(_ => displayFatalError());
}

function handlePanels(panels) {
    Object.keys(Panels).forEach((key, index) => Panels[key] = panels[index]);    
    downloadCards();
}

function downloadCards() {
    document.getElementById('main-content').innerHTML = Panels.LOADING;
    
    const ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', 'back' ];
    const suits = [ 'clubs', 'diamonds', 'hearts', 'spades' ];
    
    const progressBar = document.getElementById('loading-progress');
    let count = 0;
    Promise.all(ranks.flatMap(rank => suits.map(suit => fetchContent(`cards/${rank}_of_${suit}.svg`)
            .then(text => {
                progressBar.value = ++count;
                return text;
            })
    ))).then(cards => handleCards(cards)).catch(_ => displayFatalError());
}

function handleCards(cards) {
    svgCards = cards;
    document.getElementById('main-content').innerHTML = Panels.MAIN;
    updateInfo();
    showBetPanel();
}

function handleBetButton(event) {
    switch (event.target.id) {
        case '10button':
            info.bet = 10;
            break;
        case '20button':
            info.bet = 20;
            break;
        case '50button':
            info.bet = 50;
            break;
        default:
            info.bet = 100;
            break;
    }
    updateInfo();
}

function showBetPanel() {
    state = State.BETTING;
    document.getElementById('button-row').innerHTML = Panels.BET;
    document.getElementById('left-card').innerHTML = svgCards[BACK];
    document.getElementById('middle-card').innerHTML = '';
    document.getElementById('right-card').innerHTML = svgCards[BACK];
    document.getElementById('message').innerHTML = 'Place your bet:';
    showBetButton(10);
    showBetButton(20);
    showBetButton(50);
    showBetButton(100);
}

function showBetButton(value) {
    const button = document.getElementById(`${value}button`);
    if (info.balance < value) {
        button.disabled = true;
    } else {
        button.addEventListener('click', handleBetButton);
    }
}

function updateInfo() {
    document.getElementById('info').innerHTML = `<p>Balance: ${info.balance}</p><p>Bet: ${info.bet}</p>`
            + `<p>Win: ${info.win}</p><p>Spread: ${info.spread}</p><p>Pays: ${info.pays}</p>`;
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadPanels();
}

document.addEventListener('DOMContentLoaded', init);