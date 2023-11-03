const Panels = {
    LOADING: 'loading-panel'
};

const MAX_FETCH_RETRIES = 5;

async function retryFetch(url, options = {}) {
    for (let i = MAX_FETCH_RETRIES - 1; i >= 0; --i) {
        try {
            let response = await fetch(url, options);
            if (response.ok) {
                return response;
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
    Promise.all(Object.values(Panels).map(name => retryFetch(`${name}.html`).then(response => response.text())))
            .then(panels => handlePanels(panels)).catch(_ => displayFatalError());
}

function handlePanels(panels) {
    Object.keys(Panels).forEach((key, index) => Panels[key] = panels[index]);    
    downloadCards();
}

function downloadCards() {
    document.getElementById('main-content').innerHTML = Panels.LOADING;
    
    const ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace' ];
    const suits = [ 'clubs', 'diamonds', 'hearts', 'spades' ];
    
    const progressBar = document.getElementById('loading-progress');
    let count = 0;
    Promise.all(ranks.flatMap(rank => suits.map(suit => retryFetch(`cards/${rank}_of_${suit}.svg`)
            .then(response => {
                progressBar.value = ++count;
                return response.text();
            })
    ))).then(cards => handleCards(cards)).catch(_ => displayFatalError());
}

function handleCards(cards) {
    document.getElementById('main-content').innerHTML = cards[51];
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadPanels();
}

document.addEventListener('DOMContentLoaded', init);