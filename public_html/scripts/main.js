const Panels = {
    LOADING: 'loading-panel'
};

async function downloadPanels() {
    try {
        return await Promise.all(Object.values(Panels).map(name => fetch(`${name}.html`)
                .then(response => response.text())));
    } catch (_) {        
        return [];
    }    
}

function handlePanels(panels) {
    if (panels.length === 0) {
        displayFatalError();
        return;
    } 
    
    Object.keys(Panels).forEach((key, index) => Panels[key] = panels[index]);
    
    downloadCards().then(handleCards);
}

async function downloadCards() {
    document.getElementById('main-content').innerHTML = Panels.LOADING;
    
    const ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace' ];
    const suits = [ 'clubs', 'diamonds', 'hearts', 'spades' ];
    
    try {        
        return await Promise.all(ranks.flatMap(rank => suits.map(suit => fetch(`cards/${rank}_of_${suit}.svg`)
                .then(response => response.text()))));
    } catch (_) {        
        return [];
    }    
}

function handleCards(cards) {
    if (cards.length === 0) {
        displayFatalError();
        return;
    }
    
    document.getElementById('main-content').innerHTML = cards[51];
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadPanels().then(handlePanels);
}

document.addEventListener('DOMContentLoaded', init);