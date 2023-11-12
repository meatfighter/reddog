class ArrayShuffler {
    
    #array;
    #index;
    #shuffleThreshold;
    
    constructor(array, shuffleThreshold) {
        this.#array = array;        
        this.#index = this.#shuffleThreshold = shuffleThreshold ? shuffleThreshold : array.length;
    }

    next() {
        if (this.#index >= this.#shuffleThreshold) {
            this.#shuffle();
            this.#index = 0;
        }
        return this.#array[this.#index++];
    }

    #shuffle() {
        for (let i = this.#array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.#array[i], this.#array[j]] = [this.#array[j], this.#array[i]];
        }
    }
}

class CardState {    
    
    #index;
    #cardIndex = 0;
    #cardRank = 0;
    #visible = false;    
    #backSide = false;
    #flipFraction = 0;
    #changed = false;
    
    constructor(index) {
        this.#index = index;
    }
    
    deal(backSide) {        
        this.#cardIndex = deck.next();
        this.#cardRank = Math.floor(this.#cardIndex / 4);
        this.#visible = backSide;
        this.#flipFraction = 0;
        this.#backSide = backSide;
        this.#changed = true;
    }
    
    get index() {
        return this.#index;
    }

    get cardIndex() {
        return this.#cardIndex;
    }
        
    get cardRank() {
        return this.#cardRank; 
    }
    
    set visible(visible) {
        this.#changed = true;
        this.#visible = visible; 
    }
    
    get visible() {
        return this.#visible;
    }
    
    get backSide() {
        return this.#backSide;
    }
    
    set backSide(backSide) {
        this.#changed = true;
        this.#backSide = backSide;
    }
    
    set flipFraction(flipFraction) {
        this.#changed = true;
        this.#flipFraction = flipFraction;
    }
    
    get flipFraction () {
        return this.#flipFraction;
    }
    
    get changed() {
        const value = this.#changed;
        this.#changed = false;
        return value;
    }
}

const winPhrases = new ArrayShuffler([
    'Congratulations!',
    'Congrats!',
    'Great!',
    'Good stuff!',
    'Awesome!',
    'We have a winner!',
    'Winner!',
    'Win!',
    'Winner, winner, chicken dinner!',
    'You\'ve done it!',
    'You did it!',
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
    'Nice one!',
    'A win in the cards!',
    'It\'s a win!',
    'You\'re doing great!'
]);

const tiePhrases = new ArrayShuffler([
    'Push.',
    'Tie.',
    'Draw.',
    'It\'s a push.',
    'It\'s a tie.',
    'It\'s a draw.',
    'We have a push.',
    'We have a tie.',
    'We have a draw.',
    'The game\'s a tie.',
    'The game\'s a draw.',    
    'No winners or losers.',    
    'No losses or wins.',
    'It\'s a stand-off.',
    'No change in balance.',
    'Your bet is returned.',
    'Your wager is returned.',
    'Take back your bet.',
    'Take back your wager.',
    'Have your bet back.',
    'Have your wager back.'
]);

const losePhrases = new ArrayShuffler([
    'Ugh.',
    'Doh!',
    'Yipe!',
    'Better luck next time.',
    'Unlucky hand.',
    'Tough break.',
    'Tough luck.',
    'It\'s all part of the game.',
    'You\'ll get it next time.',
    'Unfortunately, it\'s a loss.',
    'Not your time.',
    'Not this time.',
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
    'It\'s a loss.',
    'Too bad.',
    'Try again.',
    'Give it another shot.'
]);

const Panels = {    
    BET: 'bet-panel',
    CONTINUE: 'continue-panel',
    MAIN: 'main-panel',
    RAISE: 'raise-panel'
};

const State = {
    BETTING: 0,
    RAISING: 1,
    CONTINUING: 2
};

const MAX_CARD_WIDTH = 222.78255213333333333333333333333;
const MAX_CARD_HEIGHT = 323.5559896;

const CARD_FLIP_MILLIS = 250;

const MAX_FETCH_RETRIES = 5;

const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;
const BACK = 52;

const deck = new ArrayShuffler(Array.from({ length: 52 }, (_, index) => index), 49);

const info = {
    balance: 1500,
    bet: '--',
    win: '--',
    spread: '--',
    pays: '--'
};

let state;
let cardImages = [];
let cardStates = Array.from({ length: 3 }, (_, index) => new CardState(index));
let displayWideInfo = false;

function initCanvas() {
    const canvas = document.getElementById('cards-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderCards() {
    const ctx = document.getElementById('cards-canvas').getContext('2d');
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    cardStates.forEach(cardState => renderCard(ctx, cardState));
    return ctx;
}

function renderCard(ctx, cardState) {
    
    if (!cardState.changed) {
        return;
    }
    
    const x = Math.ceil(cardState.index * (25 + MAX_CARD_WIDTH));
        
    ctx.fillRect(x, 0, Math.ceil(MAX_CARD_WIDTH), Math.ceil(MAX_CARD_HEIGHT));
    
    if (!cardState.visible) {
        return;
    }
    
    const image = cardImages[cardState.backSide ? BACK : cardState.cardIndex];
    
    if (cardState.flipFraction === 0 || cardState.flipFraction === 1) {
        ctx.drawImage(image, x, 0);
        return;
    }
    
    const width = MAX_CARD_WIDTH * Math.abs(Math.cos(Math.PI * cardState.flipFraction));
    
    ctx.drawImage(image, x + (MAX_CARD_WIDTH - width) / 2, 0, width, MAX_CARD_HEIGHT);
}

async function downloadFile(url, progressListener, options = {}) {
    for (let i = MAX_FETCH_RETRIES - 1; i >= 0; --i) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                continue;
            }            
            const contentLength = response.headers.get('Content-Length');
            if (!contentLength) {
                continue;
            }

            const reader = response.body.getReader();            
            const chunks = [];
            let bytesReceived = 0;
            while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(chunk);
                bytesReceived += chunk.length;
                if (progressListener) {                    
                    progressListener(bytesReceived, contentLength);
                }
            }

            const uint8Array = new Uint8Array(bytesReceived);
            let position = 0;
            chunks.forEach(chunk => {
                uint8Array.set(chunk, position);
                position += chunk.length;
            });

            return uint8Array;
        } catch (error) {
            if (i === 0) {
                throw error;
            }
        }
    }
    throw new Error("Failed to fetch.");
}

async function convertSvgToImage(svgContent) {
    
    const index = svgContent.indexOf('<svg');
    if (index < 0) { 
        throw new Error("SVG content missing svg element.");
    }
    svgContent = svgContent.substring(index);
    
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgContent)}`;        
    });
}

async function handleZip(arrayBuffer) {
    
    const progressBar = document.getElementById('loading-progress');
    
    const cardMap = new Map();
    const ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace' ];
    const suits = [ 'clubs', 'diamonds', 'hearts', 'spades' ];
    ranks.forEach((rank, rankIndex) => 
            suits.forEach((suit, suitIndex) => cardMap.set(`cards/${rank}_of_${suit}.svg`, 4 * rankIndex + suitIndex)));
    cardMap.set('cards/back.svg', BACK);
    
    const zip = new JSZip();    
    const entries = Object.entries((await zip.loadAsync(arrayBuffer)).files);
       
    for (let i = 0; i < entries.length; ++i) {
        const [ filename, fileData ] = entries[i];          
        if (fileData.dir) {
            continue;
        }
        const data = await fileData.async("string");                
        if (cardMap.has(filename)) {
            cardImages[cardMap.get(filename)] = await convertSvgToImage(data);            
            continue;
        }       
        Object.entries(Panels).forEach(([key, value]) => {
            if (filename === `html/${value}.html`) {
                Panels[key] = data;
            }
        });
        progressBar.value = 50 + 50 * i / (entries.length - 1);
    }
}

function handleBetButton(event) {
    document.getElementById('message').style.visibility = 'hidden';
    document.getElementById('button-row').style.visibility = 'hidden';
    switch (event.target.id) {
        case 'button10':
            info.bet = 10;
            break;
        case 'button20':
            info.bet = 20;
            break;
        case 'button50':
            info.bet = 50;
            break;
        default:
            info.bet = 100;
            break;
    }
    info.balance -= info.bet;
    updateInfo();
    dealTwoCards();
}

function showBetPanel() {
    state = State.BETTING;
    info.bet = '--';
    info.win = '--';
    info.spread = '--';
    info.pays = '--';
    updateInfo();
    
    cardStates[LEFT].deal(true);
    cardStates[MIDDLE].visible = false;
    cardStates[RIGHT].deal(true);
    renderCards();
        
    const message = document.getElementById('message');
    message.innerHTML = 'Place your bet:';
    message.style.visibility = 'visible';
    const buttonRow = document.getElementById('button-row');
    buttonRow.innerHTML = Panels.BET;
    buttonRow.style.visibility = 'visible';
    
    showBetButton(10);
    showBetButton(20);
    showBetButton(50);
    showBetButton(100);
    
    handleWindowResized();
}

function showBetButton(value) {    
    const button = document.getElementById(`button${value}`);
    if (info.balance < value) {
        button.disabled = true;
    } else {
        button.addEventListener('click', handleBetButton);
    }
}

function handleRaiseButton() {
    document.getElementById('message').style.visibility = 'hidden';
    document.getElementById('button-row').style.visibility = 'hidden';
    info.balance -= info.bet;
    info.bet *= 2;
    updateInfo();
    handleCallButton();
}

async function handleCallButton() {
    document.getElementById('message').style.visibility = 'hidden';
    document.getElementById('button-row').style.visibility = 'hidden';
    state = State.CONTINUING;
    
    let minCardValue;
    let maxCardValue;
    if (cardStates[LEFT].cardRank < cardStates[RIGHT].cardRank) {
        minCardValue = cardStates[LEFT].cardRank;
        maxCardValue = cardStates[RIGHT].cardRank;
    } else {
        minCardValue = cardStates[RIGHT].cardRank;
        maxCardValue = cardStates[LEFT].cardRank;
    }
    
    cardStates[MIDDLE].deal(false);
    
    await await flipCardOver(cardStates[MIDDLE]);
    
    if (cardStates[MIDDLE].cardRank > minCardValue && cardStates[MIDDLE].cardRank < maxCardValue) {
        showContinuePanel(winPhrases.next());
        switch (info.spread) {
            case 1:
                info.win = 6 * info.bet;
                break;
            case 2:
                info.win = 5 * info.bet;
                break;
            case 3:
                info.win = 3 * info.bet;
                break;
            default:
                info.win = 2 * info.bet;
                break;
        }
        info.balance += info.win;        
    } else {
        showContinuePanel(losePhrases.next());
    }    
    
    updateInfo();
}

function showRaisePanel() {
    state = State.RAISING;
    
    const message = document.getElementById('message');
    message.innerHTML = 'Raise your bet?';
    message.style.visibility = 'visible';
    const buttonRow = document.getElementById('button-row');
    buttonRow.innerHTML = Panels.RAISE;
    buttonRow.style.visibility = 'visible';
    
    const raiseButton = document.getElementById('raiseButton');
    if (info.balance >= info.bet) {
        raiseButton.addEventListener('click', handleRaiseButton);
    } else {
        raiseButton.disabled = true;
    }
    
    document.getElementById('callButton').addEventListener('click', handleCallButton);
    
    handleWindowResized();
}

function handleContinueButton() {
    showBetPanel();
}

function showContinuePanel(msg) {
    state = State.CONTINUING;
    
    const message = document.getElementById('message');
    message.innerHTML = msg;
    message.style.visibility = 'visible';
    const buttonRow = document.getElementById('button-row');
    buttonRow.innerHTML = Panels.CONTINUE;
    buttonRow.style.visibility = 'visible';    
    
    document.getElementById('continueButton').addEventListener('click', handleContinueButton);
    
    handleWindowResized();
}

async function flipCardOver(cardState) {
    
    const ctx = renderCards();
    
    return new Promise(resolve => {
        
        let startTime;
        
        function animate(currentTime) {
            if (!startTime) {
                startTime = currentTime;
            }
            
            cardState.flipFraction = Math.min((currentTime - startTime) / CARD_FLIP_MILLIS, 1);
            cardState.backSide = (cardState.flipFraction < 0.5);
            cardState.visible |= !cardState.backSide;
            
            renderCard(ctx, cardState);
            
            if (cardState.flipFraction < 1) {
                requestAnimationFrame(animate);
            } else {                
                resolve();
            }
        }
       
        requestAnimationFrame(animate);
    });
}

async function dealTwoCards() {
    
    await flipCardOver(cardStates[LEFT]);
    await flipCardOver(cardStates[RIGHT]);
       
    const spread = Math.abs(cardStates[LEFT].cardRank - cardStates[RIGHT].cardRank) - 1;
    
    switch (spread) {
        case -1: {            
            cardStates[MIDDLE].deal(true);
            
            await flipCardOver(cardStates[MIDDLE]);
            
            if (cardStates[LEFT].cardRank === cardStates[MIDDLE].cardRank) {
                info.spread = '3 of a Kind';
                info.pays = '11:1';
                info.win = 12 * info.bet;
                showContinuePanel(winPhrases.next());
            } else {
                info.spread = 'Pair';
                info.pays = 'Push';
                info.win = info.bet;
                showContinuePanel(tiePhrases.next());
            }
            info.balance += info.win;            
            break;
        }
        case 0:
            info.spread = 'Consecutive';
            info.pays = 'Push';
            info.win = info.bet;
            info.balance += info.win;
            showContinuePanel(tiePhrases.next());
            break;
        case 1:
            info.spread = spread;
            info.pays = '5:1';
            showRaisePanel();
            break;
        case 2:
            info.spread = spread;
            info.pays = '4:1';
            showRaisePanel();
            break;
        case 3:
            info.spread = spread;
            info.pays = '2:1';
            showRaisePanel();
            break;
        default:
            info.spread = spread;
            info.pays = 'Even Money';
            showRaisePanel();
            break;
    }
    updateInfo();
}

function updateInfo() {
    const element = document.getElementById('info');
    if (displayWideInfo) {
        element.innerHTML = `<p>Balance: ${info.balance}, Bet: ${info.bet}, Win: ${info.win}, ` 
                + `Spread: ${info.spread}, Pays: ${info.pays}</p>`;
    } else {
        element.innerHTML = `<p>Balance: ${info.balance}</p>
<p>Bet: ${info.bet}</p>
<p>Win: ${info.win}</p>
<p>Spread: ${info.spread}</p>
<p>Pays: ${info.pays}</p>`;
    }
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function getViewportWidth() {
    return window.innerWidth && document.documentElement.clientWidth ? 
            Math.min(window.innerWidth, document.documentElement.clientWidth) : 
            window.innerWidth || 
            document.documentElement.clientWidth || 
            document.getElementsByTagName('body')[0].clientWidth;
}

function getViewportHeight() {
    return (window.innerHeight && document.documentElement.clientHeight ? 
            Math.min(window.innerHeight, document.documentElement.clientHeight) : 
            window.innerHeight || 
            document.documentElement.clientHeight || 
            document.getElementsByTagName('body')[0].clientHeight);
}

function handleWindowResized() {
    
    const main = document.getElementById('main-container');
    const infoElement = document.getElementById('info');
    const canvas = document.getElementById('cards-canvas');
    
    if (!(main && infoElement && canvas)) {
        return;
    }
    
    let width = canvas.width;
    let height = canvas.height;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    
    displayWideInfo = false;
    infoElement.style.marginBottom = '20px';
    updateInfo();
    
    if (main.clientHeight > getViewportHeight() && getViewportWidth() > 500) {
        displayWideInfo = true;
        infoElement.style.marginBottom = '0px';
        updateInfo();
    }
    
    if (main.clientHeight > getViewportHeight()) {
        height = Math.max(0.25 * canvas.height, getViewportHeight() - (main.clientHeight - canvas.height));
        width = height * canvas.width / canvas.height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }
    
    if (main.clientWidth > getViewportWidth()) {
        width = Math.max(0.25 * canvas.width, getViewportWidth() - (main.clientWidth - width));
        height = width * canvas.height / canvas.width;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }    
}

function startGame() {
    document.getElementById('main-content').innerHTML = Panels.MAIN;
    initCanvas();
    updateInfo();    
    showBetPanel();
}

function init() {
    window.addEventListener('resize', handleWindowResized);
    window.addEventListener('orientationchange', handleWindowResized);
    
    const progressBar = document.getElementById('loading-progress');
    downloadFile('reddog.zip', 
            (bytesReceived, contentLength) => progressBar.value = 50 * bytesReceived / contentLength)
                    .then(handleZip)
                    .then(startGame)
                    .catch(displayFatalError);
}

document.addEventListener('DOMContentLoaded', init);