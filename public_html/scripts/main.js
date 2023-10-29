const Panels = {
    LOADING: 'loading-panel2'
};

async function downloadPanels() {
    try {
        return await Promise.all(Object.values(Panels).map(name => fetch(`${name}.html`))
                .map(promise => promise.then(response => response.text())));
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
    
    document.getElementById('main-content').innerHTML = Panels.LOADING;
}

function displayFatalError() {
    document.getElementById('main-content').innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadPanels().then(handlePanels);
}

document.addEventListener('DOMContentLoaded', init);