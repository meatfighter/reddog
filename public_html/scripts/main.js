const Panels = {
    LOADING: 'loading-panel',
    BET: 'bet-panel'
};

const MAX_FETCH_RETRIES = 5;

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
    
    const ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace' ];
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
    document.getElementById('main-content').innerHTML = Panels.BET;
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadPanels();
}

document.addEventListener('DOMContentLoaded', init);