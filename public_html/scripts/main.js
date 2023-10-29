const Panels = {
    RED: 'red-panel',
    GREEN: 'green-panel',
    BLUE: 'blue-panel'
};

async function downloadPanels() {
    try {
        return await Promise.all(Object.values(Panels).map(name => fetch(`${name}.html`))
                .map(promise => promise.then(response => response.text())));
    } catch (error) {        
        return [];
    }    
}

function handlePanels(panels) {
    if (panels.length === 0) {
        displayError();
        return;
    } 
    
    Object.keys(Panels).forEach((key, index) => Panels[key] = panels[index]);
    
    document.getElementById('main-content').innerHTML = Panels.GREEN;
}

function displayError() {
    document.getElementById('main-content').innerHTML = 'Error!';
}

function init() {
    downloadPanels().then(handlePanels);
}

document.addEventListener('DOMContentLoaded', init);