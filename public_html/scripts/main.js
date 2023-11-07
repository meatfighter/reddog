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
    LOADING: 'loading-panel',
    MAIN: 'main-panel',
    RAISE: 'raise-panel'
};

const State = {
    BETTING: 0,
    RAISING: 1,
    CONTINUING: 2
};

const MAX_SIDE_CARD_WIDTH = 249.4492188;
const MAX_MIDDLE_CARD_WIDTH = 222.78255213333333333333333333333;
const MAX_CARD_HEIGHT = 323.5559896;

const CARD_FLIP_MILLIS = 250;

const MAX_FETCH_RETRIES = 5;

const BACK = 52;

const deck = new ArrayShuffler(Array.from({ length: 52 }, (_, index) => index), 49);

const info = {
    balance: 10000,
    bet: '--',
    win: '--',
    spread: '--',
    pays: '--'
};

let state;
let svgCards;
let leftCardValue;
let rightCardValue;

let displayWideInfo = false;
let cardScale = 1.0;
let leftCardTranslateX = 0;
let rightCardTranslateX = MAX_SIDE_CARD_WIDTH - MAX_MIDDLE_CARD_WIDTH;
let cardTranslateY = 0;

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
    document.getElementById('left-card').innerHTML = svgCards[BACK];
    document.getElementById('middle-card').innerHTML = '';
    document.getElementById('right-card').innerHTML = svgCards[BACK];
        
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
    if (leftCardValue < rightCardValue) {
        minCardValue = leftCardValue;
        maxCardValue = rightCardValue;
    } else {
        minCardValue = rightCardValue;
        maxCardValue = leftCardValue;
    }
    
    const middleCardIndex = deck.next();
    
    await await flipCardOver('middle-card', middleCardIndex);
    
    const middleCardValue = Math.floor(middleCardIndex / 4);
    
    if (middleCardValue > minCardValue && middleCardValue < maxCardValue) {
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

async function flipCardOver(elementName, cardIndex) {
    
    const element = document.getElementById(elementName);
    
    return new Promise(resolve => {
        
        let startTime;
        let back = true;
        
        function animate(currentTime) {
            if (!startTime) {
                startTime = currentTime;
            }
            const elapsedTime = currentTime - startTime;
            const fraction = Math.min(elapsedTime / CARD_FLIP_MILLIS, 1);
            let scale = Math.cos(Math.PI * fraction);
            if (scale < 0) {
                if (back) {
                    back = false;
                    element.innerHTML = svgCards[cardIndex];
                }
                scale = -scale;
            }
            switch (elementName) {
                case 'left-card':
                    element.style.transform = `translateX(${leftCardTranslateX}px) scaleX(${scale * cardScale}) `
                            + `scaleY(${cardScale}) translateY(${cardTranslateY}px)`;
                    break;
                case 'middle-card':
                    element.style.transform = `scaleX(${scale * cardScale}) scaleY(${cardScale}) `
                            + `translateY(${cardTranslateY}px)`;
                    break;
                default:
                    element.style.transform = `translateX(${rightCardTranslateX}px) scaleX(${scale * cardScale}) `
                            + `scaleY(${cardScale}) translateY(${cardTranslateY}px)`;
                    break;
            }            
            
            if (fraction < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
       
        requestAnimationFrame(animate);
    });
}

async function dealTwoCards() {
    const leftCardIndex = deck.next();
    const rightCardIndex = deck.next();
    
    await flipCardOver('left-card', leftCardIndex);
    await flipCardOver('right-card', rightCardIndex);
       
    leftCardValue = Math.floor(leftCardIndex / 4);
    rightCardValue = Math.floor(rightCardIndex / 4);
    const spread = Math.abs(leftCardValue - rightCardValue) - 1;
    
    switch (spread) {
        case -1: {            
            const middleCardIndex = deck.next();
            
            await flipCardOver('middle-card', middleCardIndex);
            
            const middleCardValue = Math.floor(middleCardIndex / 4);
            if (leftCardValue === middleCardValue) {
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

function handleWindowResized(_) {
    
    const main = document.getElementById('main-container');
    
    const infoElement = document.getElementById('info');
    
    displayWideInfo = false;
    infoElement.style.marginBottom = '20px';
    updateInfo();
    
    if (main.clientHeight > window.innerHeight) {
        displayWideInfo = true;
        infoElement.style.marginBottom = '0px';
        updateInfo();
    } 
    
    const leftCard = document.getElementById('left-card');
    const middleCard = document.getElementById('middle-card');
    const rightCard = document.getElementById('right-card');
    const message = document.getElementById('message');
    const buttonRow = document.getElementById('button-row');
    
    cardScale = 1;
    leftCardTranslateX = 0;
    rightCardTranslateX = MAX_SIDE_CARD_WIDTH - MAX_MIDDLE_CARD_WIDTH;
    cardTranslateY = 0;
    
    const maxCardPxHeight = `${MAX_CARD_HEIGHT}px`;
    leftCard.style.height = maxCardPxHeight;
    middleCard.style.height = maxCardPxHeight;
    rightCard.style.height = maxCardPxHeight;
    leftCard.style.transform = '';
    middleCard.style.transform = '';
    rightCard.style.transform = `translateX(${rightCardTranslateX}px)`;
    
    if (main.clientHeight > window.innerHeight) {
        const cardHeight = Math.max(window.innerHeight - infoElement.clientHeight - message.clientHeight 
                - buttonRow.clientHeight - 40, 0.2 * MAX_CARD_HEIGHT);
        
        const cardPxHeight = `${cardHeight}px`;
        leftCard.style.height = cardPxHeight;
        middleCard.style.height = cardPxHeight;
        rightCard.style.height = cardPxHeight;
        
        cardScale = Math.min(1, cardHeight / MAX_CARD_HEIGHT);
        
        const middleCardWidth = MAX_MIDDLE_CARD_WIDTH * cardScale;
               
        leftCardTranslateX = (MAX_SIDE_CARD_WIDTH * (1 - cardScale)) 
                * Math.sqrt(MAX_MIDDLE_CARD_WIDTH / MAX_SIDE_CARD_WIDTH);
        rightCardTranslateX = (MAX_SIDE_CARD_WIDTH - MAX_MIDDLE_CARD_WIDTH) * cardScale - leftCardTranslateX;
        
        cardTranslateY = (cardHeight - MAX_CARD_HEIGHT) / 2;
        
        leftCard.style.transform 
                = `translateX(${leftCardTranslateX}px) scale(${cardScale}) translateY(${cardTranslateY}px)`;
        middleCard.style.transform = `scale(${cardScale}) translateY(${cardTranslateY}px)`;
        rightCard.style.transform 
                = `translateX(${rightCardTranslateX}px) scale(${cardScale}) translateY(${cardTranslateY}px)`;
    }
    
    if (main.clientWidth > window.innerWidth) {
        
        cardScale = Math.min(cardScale, window.innerWidth / (2 * MAX_SIDE_CARD_WIDTH + MAX_MIDDLE_CARD_WIDTH));
        
        const cardHeight = MAX_CARD_HEIGHT * cardScale;
        
        const cardPxHeight = `${cardHeight}px`;
        leftCard.style.height = cardPxHeight;
        middleCard.style.height = cardPxHeight;
        rightCard.style.height = cardPxHeight;
        
        const middleCardWidth = MAX_MIDDLE_CARD_WIDTH * cardScale;
               
        leftCardTranslateX = (MAX_SIDE_CARD_WIDTH * (1 - cardScale)) 
                * Math.sqrt(MAX_MIDDLE_CARD_WIDTH / MAX_SIDE_CARD_WIDTH);
        rightCardTranslateX = (MAX_SIDE_CARD_WIDTH - MAX_MIDDLE_CARD_WIDTH) * cardScale - leftCardTranslateX;
        
        cardTranslateY = (cardHeight - MAX_CARD_HEIGHT) / 2;
        
        leftCard.style.transform 
                = `translateX(${leftCardTranslateX}px) scale(${cardScale}) translateY(${cardTranslateY}px)`;
        middleCard.style.transform = `scale(${cardScale}) translateY(${cardTranslateY}px)`;
        rightCard.style.transform 
                = `translateX(${rightCardTranslateX}px) scale(${cardScale}) translateY(${cardTranslateY}px)`;
    }
}

function init() {
    window.addEventListener('resize', handleWindowResized);    
    downloadPanels();
}

document.addEventListener('DOMContentLoaded', init);