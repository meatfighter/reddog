async function downloadPanels() {
    const panelNames = [ 
        'red-panel', 
        'green-panel', 
        'blue-panel'
    ];
       
    try {
        return await Promise.all(panelNames.map(name => fetch(`${name}.html`))
                .map(promise => promise.then(response => response.text())));
    } catch (error) {        
        return [];
    }    
}

function init() {
    downloadPanels().then(panels => document.getElementById('hello').innerHTML = panels.length);
}

document.addEventListener('DOMContentLoaded', init);